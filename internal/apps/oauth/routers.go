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

package oauth

import (
	"fmt"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/linux-do/pay/internal/db"
	"github.com/linux-do/pay/internal/logger"
	"github.com/linux-do/pay/internal/model"
	"github.com/linux-do/pay/internal/service"
	"github.com/linux-do/pay/internal/util"
	"github.com/shopspring/decimal"
)

// GetLoginURL godoc
// @Tags oauth
// @Produce json
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/oauth/login [get]
func GetLoginURL(c *gin.Context) {
	// 存储 State 到缓存
	state := uuid.NewString()
	cmd := db.Redis.Set(c.Request.Context(), db.PrefixedKey(fmt.Sprintf(OAuthStateCacheKeyFormat, state)), state, OAuthStateCacheKeyExpiration)
	if cmd.Err() != nil {
		c.JSON(http.StatusInternalServerError, util.Err(cmd.Err().Error()))
		return
	}
	// 构造登录 URL
	c.JSON(http.StatusOK, util.OK(oauthConf.AuthCodeURL(state)))
}

type CallbackRequest struct {
	State string `json:"state"`
	Code  string `json:"code"`
}

// Callback godoc
// @Tags oauth
// @Param request body CallbackRequest true "request body"
// @Produce json
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/oauth/callback [post]
func Callback(c *gin.Context) {
	// init req
	var req CallbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}
	// check state
	cmd := db.Redis.Get(c.Request.Context(), db.PrefixedKey(fmt.Sprintf(OAuthStateCacheKeyFormat, req.State)))
	if cmd.Val() != req.State {
		c.JSON(http.StatusBadRequest, util.Err(InvalidState))
		return
	}
	db.Redis.Del(c.Request.Context(), db.PrefixedKey(fmt.Sprintf(OAuthStateCacheKeyFormat, req.State)))
	// do oauth
	user, err := doOAuth(c.Request.Context(), req.Code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}
	// bind to session
	session := sessions.Default(c)
	session.Set(UserIDKey, user.ID)
	session.Set(UserNameKey, user.Username)
	if err := session.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}
	// response
	c.JSON(http.StatusOK, util.OKNil())
	logger.InfoF(c.Request.Context(), "[OAuthCallback] %d %s", user.ID, user.Username)
}

type BasicUserInfo struct {
	ID               uint64           `json:"id"`
	Username         string           `json:"username"`
	Nickname         string           `json:"nickname"`
	TrustLevel       model.TrustLevel `json:"trust_level"`
	AvatarUrl        string           `json:"avatar_url"`
	TotalReceive     decimal.Decimal  `json:"total_receive"`
	TotalPayment     decimal.Decimal  `json:"total_payment"`
	TotalTransfer    decimal.Decimal  `json:"total_transfer"`
	TotalCommunity   decimal.Decimal  `json:"total_community"`
	AvailableBalance decimal.Decimal  `json:"available_balance"`
	PayScore         int64            `json:"pay_score"`
	IsPayKey         bool             `json:"is_pay_key"`
	IsAdmin          bool             `json:"is_admin"`
	RemainQuota      decimal.Decimal  `json:"remain_quota"`
	PayLevel         model.PayLevel   `json:"pay_level"`
	DailyLimit       *int64           `json:"daily_limit"`
}

// UserInfo godoc
// @Tags oauth
// @Produce json
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/oauth/user-info [get]
func UserInfo(c *gin.Context) {
	user, _ := util.GetFromContext[*model.User](c, UserObjKey)

	var payConfig model.UserPayConfig
	if err := payConfig.GetByPayScore(db.DB(c.Request.Context()), user.PayScore); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	// 计算剩余额度（-1 表示无限额）
	remainQuota := decimal.NewFromInt(-1)
	if payConfig.DailyLimit != nil && *payConfig.DailyLimit > 0 {
		todayUsed, err := service.GetTodayUsedAmount(db.DB(c.Request.Context()), user.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
			return
		}
		remainQuota = decimal.NewFromInt(*payConfig.DailyLimit).Sub(todayUsed)
	}

	c.JSON(
		http.StatusOK,
		util.OK(BasicUserInfo{
			ID:               user.ID,
			Username:         user.Username,
			Nickname:         user.Nickname,
			TrustLevel:       user.TrustLevel,
			AvatarUrl:        user.AvatarUrl,
			TotalReceive:     user.TotalReceive,
			TotalPayment:     user.TotalPayment,
			TotalTransfer:    user.TotalTransfer,
			TotalCommunity:   user.TotalCommunity,
			AvailableBalance: user.AvailableBalance,
			PayScore:         user.PayScore,
			IsPayKey:         user.PayKey != "",
			IsAdmin:          user.IsAdmin,
			RemainQuota:      remainQuota,
			PayLevel:         payConfig.Level,
			DailyLimit:       payConfig.DailyLimit,
		}),
	)
}

// Logout godoc
// @Tags oauth
// @Produce json
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/oauth/logout [get]
func Logout(c *gin.Context) {
	session := sessions.Default(c)
	session.Clear()
	if err := session.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, util.OKNil())
}
