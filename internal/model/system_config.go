/*
 * MIT License
 *
 * Copyright (c) 2025 linux.do
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

package model

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/linux-do/pay/internal/db"
)

// 配置键常量 - 所有系统配置的 key 定义
const (
	ConfigKeyMerchantOrderExpireMinutes = "merchant_order_expire_minutes" // 商家订单过期时间（分钟）
	ConfigKeyWebsiteOrderExpireMinutes  = "website_order_expire_minutes"  // 网站订单过期时间（分钟）
	ConfigKeyDisputeTimeWindowHours     = "dispute_time_window_hours"     // 商家争议时间窗口（小时）
)

const (
	// SystemConfigRedisHashKey Redis Hash key，存储所有系统配置
	SystemConfigRedisHashKey = "system:system_configs"
)

type SystemConfig struct {
	Key         string    `json:"key" gorm:"primaryKey;size:64;not null"`
	Value       string    `json:"value" gorm:"size:255;not null"`
	Description string    `json:"description" gorm:"size:255"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
}

// GetByKey 通过 key 查询配置（带 Redis 缓存）
func (sc *SystemConfig) GetByKey(ctx context.Context, key string) error {
	if err := db.HGetJSON(ctx, SystemConfigRedisHashKey, key, sc); err == nil {
		return nil
	} else if !errors.Is(err, redis.Nil) {
		// Redis 服务错误，返回错误
		return err
	}

	// 查数据库
	if err := db.DB(ctx).Where("key = ?", key).First(sc).Error; err != nil {
		return err
	}

	// 更新 Redis Hash 缓存
	_ = db.HSetJSON(ctx, SystemConfigRedisHashKey, key, sc)

	return nil
}

// GetIntByKey 通过 key 查询配置并转换为 int 类型
func GetIntByKey(ctx context.Context, key string) (int, error) {
	var sc SystemConfig
	if err := sc.GetByKey(ctx, key); err != nil {
		return 0, err
	}

	value, err := strconv.Atoi(sc.Value)
	if err != nil {
		return 0, fmt.Errorf("配置 %s 的值 '%s' 无法转换为整数: %w", key, sc.Value, err)
	}

	return value, nil
}
