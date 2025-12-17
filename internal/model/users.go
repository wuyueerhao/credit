/*
Copyright 2025 linux.do

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package model

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"github.com/linux-do/pay/internal/common"
	"github.com/linux-do/pay/internal/db"
	"github.com/linux-do/pay/internal/logger"
	"github.com/linux-do/pay/internal/task"
	"github.com/linux-do/pay/internal/task/schedule"
	"github.com/linux-do/pay/internal/util"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type TrustLevel uint8

const (
	TrustLevelNewUser TrustLevel = iota
	TrustLevelBasicUser
	TrustLevelUser
	TrustLevelActiveUser
	TrustLevelLeader
)

type OAuthUserInfo struct {
	Id         uint64     `json:"id"`
	Username   string     `json:"username"`
	Name       string     `json:"name"`
	Active     bool       `json:"active"`
	AvatarUrl  string     `json:"avatar_url"`
	TrustLevel TrustLevel `json:"trust_level"`
}

// UserGamificationScoreResponse API响应
type UserGamificationScoreResponse struct {
	GamificationScore int64 `json:"gamification_score"`
}

type User struct {
	ID               uint64          `json:"id" gorm:"primaryKey"`
	Username         string          `json:"username" gorm:"size:64;uniqueIndex"`
	Nickname         string          `json:"nickname" gorm:"size:100"`
	AvatarUrl        string          `json:"avatar_url" gorm:"size:100"`
	TrustLevel       TrustLevel      `json:"trust_level" gorm:"index"`
	PayScore         int64           `json:"pay_score" gorm:"default:0;index"`
	PayKey           string          `json:"pay_key" gorm:"size:128"`
	SignKey          string          `json:"sign_key" gorm:"size:64;uniqueIndex;not null"`
	TotalReceive     decimal.Decimal `json:"total_receive" gorm:"type:numeric(20,2);default:0"`
	TotalPayment     decimal.Decimal `json:"total_payment" gorm:"type:numeric(20,2);default:0"`
	TotalTransfer    decimal.Decimal `json:"total_transfer" gorm:"type:numeric(20,2);default:0"`
	TotalCommunity   decimal.Decimal `json:"total_community" gorm:"type:numeric(20,2);default:0"`
	CommunityBalance decimal.Decimal `json:"community_balance" gorm:"type:numeric(20,2);default:0"`
	AvailableBalance decimal.Decimal `json:"available_balance" gorm:"type:numeric(20,2);default:0"`
	IsActive         bool            `json:"is_active" gorm:"default:true"`
	IsAdmin          bool            `json:"is_admin" gorm:"default:false"`
	LastLoginAt      time.Time       `json:"last_login_at" gorm:"index"`
	CreatedAt        time.Time       `json:"created_at" gorm:"autoCreateTime;index"`
	UpdatedAt        time.Time       `json:"updated_at" gorm:"autoUpdateTime;index"`
}

func (u *User) GetByID(tx *gorm.DB, id uint64) error {
	if err := tx.Where("id = ?", id).First(u).Error; err != nil {
		return err
	}
	return nil
}

// VerifyPayKey 验证用户支付密码
// 使用用户的 SignKey 解密存储的加密密码，然后与输入的明文密码比较
func (u *User) VerifyPayKey(inputPayKey string) bool {
	if u.PayKey == "" {
		return false
	}
	decrypted, err := util.Decrypt(u.SignKey, u.PayKey)
	if err != nil {
		return false
	}

	return subtle.ConstantTimeCompare([]byte(decrypted), []byte(inputPayKey)) == 1
}

func (u *User) GetUserGamificationScore(ctx context.Context) (*UserGamificationScoreResponse, error) {
	url := fmt.Sprintf("https://linux.do/u/%s.json", u.Username)
	resp, err := util.Request(ctx, http.MethodGet, url, nil, nil, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("获取用户积分失败，状态码: %d", resp.StatusCode)
	}

	var response UserGamificationScoreResponse
	if err = json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("解析用户积分响应失败: %w", err)
	}
	return &response, nil
}

// UpdateFromOAuthInfo 根据 OAuth 信息更新用户数据
func (u *User) UpdateFromOAuthInfo(oauthInfo *OAuthUserInfo) {
	u.Username = oauthInfo.Username
	u.Nickname = oauthInfo.Name
	u.AvatarUrl = oauthInfo.AvatarUrl
	u.IsActive = oauthInfo.Active
	u.TrustLevel = oauthInfo.TrustLevel
	u.LastLoginAt = time.Now()
}

// CheckActive 检查用户账户是否激活,未激活则返回错误
func (u *User) CheckActive() error {
	if !u.IsActive {
		return errors.New(common.BannedAccount)
	}
	return nil
}

// EnqueueBadgeScoreTask 为用户下发积分计算任务
func (u *User) EnqueueBadgeScoreTask(ctx context.Context) {
	payload, _ := json.Marshal(map[string]interface{}{
		"user_id": u.ID,
	})
	if _, err := schedule.AsynqClient.Enqueue(asynq.NewTask(task.UpdateSingleUserGamificationScoreTask, payload), asynq.Queue(task.QueueWhitelistOnly)); err != nil {
		logger.ErrorF(ctx, "下发用户[%s]积分计算任务失败: %v", u.Username, err)
	} else {
		logger.InfoF(ctx, "下发用户[%s]积分计算任务成功", u.Username)
	}
}

// MarkAsDeactivatedAndCreateNew 将当前用户标记为已注销,并创建新用户
func (u *User) MarkAsDeactivatedAndCreateNew(ctx context.Context, oauthInfo *OAuthUserInfo) (*User, error) {
	err := db.DB(ctx).Transaction(func(tx *gorm.DB) error {
		// 将旧用户名修改为注销状态
		oldUsername := fmt.Sprintf("%s已注销: %s", u.Username, uuid.NewString())
		if err := tx.Model(u).Updates(map[string]interface{}{
			"username":  oldUsername,
			"is_active": false,
		}).Error; err != nil {
			return err
		}

		// 创建新用户
		newUser := User{
			ID:          oauthInfo.Id,
			Username:    oauthInfo.Username,
			Nickname:    oauthInfo.Name,
			AvatarUrl:   oauthInfo.AvatarUrl,
			IsActive:    oauthInfo.Active,
			TrustLevel:  oauthInfo.TrustLevel,
			SignKey:     util.GenerateUniqueIDSimple(),
			LastLoginAt: time.Now(),
		}
		if err := tx.Create(&newUser).Error; err != nil {
			return err
		}
		*u = newUser
		return nil
	})
	return u, err
}
