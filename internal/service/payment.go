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

package service

import (
	"errors"
	"time"

	"github.com/linux-do/pay/internal/common"
	"github.com/linux-do/pay/internal/model"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// CheckDailyLimit 检查用户每日支付限额
// 返回 nil 表示未超限额，返回 error 表示超限或查询失败
func CheckDailyLimit(tx *gorm.DB, userID uint64, amount decimal.Decimal, dailyLimit *int64) error {
	if dailyLimit == nil || *dailyLimit <= 0 {
		return nil
	}

	now := time.Now()
	datePart := int64(now.Year()*10000 + int(now.Month())*100 + now.Day())
	lockID := int64(userID)*100000000 + datePart
	if err := tx.Exec("SELECT pg_advisory_xact_lock(?)", lockID).Error; err != nil {
		return err
	}

	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	todayEnd := todayStart.Add(24 * time.Hour)

	// 统计当日成功支付的订单总金额
	var todayTotalAmount decimal.Decimal
	if err := tx.Model(&model.Order{}).
		Where("payer_user_id = ? AND status = ? AND type IN ? AND trade_time >= ? AND trade_time < ?",
			userID,
			model.OrderStatusSuccess,
			[]model.OrderType{model.OrderTypePayment, model.OrderTypeOnline},
			todayStart,
			todayEnd).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&todayTotalAmount).Error; err != nil {
		return err
	}

	dailyLimitDecimal := decimal.NewFromInt(*dailyLimit)
	if todayTotalAmount.Add(amount).GreaterThan(dailyLimitDecimal) {
		return errors.New(common.DailyLimitExceeded)
	}

	return nil
}

// DeductUserBalance 扣减用户余额
// 返回 nil 表示扣减成功，返回 error 表示余额不足或更新失败
func DeductUserBalance(tx *gorm.DB, userID uint64, amount decimal.Decimal) error {
	result := tx.Model(&model.User{}).
		Where("id = ? AND available_balance >= ?", userID, amount).
		UpdateColumns(map[string]interface{}{
			"available_balance": gorm.Expr("available_balance - ?", amount),
			"total_payment":     gorm.Expr("total_payment + ?", amount),
			"pay_score":         gorm.Expr("pay_score + ?", amount.Round(0).IntPart()),
		})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New(common.InsufficientBalance)
	}

	return nil
}

// AddMerchantBalance 增加商户余额和积分
func AddMerchantBalance(tx *gorm.DB, merchantUserID uint64, amount decimal.Decimal, scoreIncrease int64) error {
	return tx.Model(&model.User{}).
		Where("id = ?", merchantUserID).
		UpdateColumns(map[string]interface{}{
			"available_balance": gorm.Expr("available_balance + ?", amount),
			"total_receive":     gorm.Expr("total_receive + ?", amount),
			"pay_score":         gorm.Expr("pay_score + ?", scoreIncrease),
		}).Error
}

// CalculateFee 计算手续费和商户实收金额
// 返回：手续费、商户实收金额、手续费百分比
func CalculateFee(amount decimal.Decimal, feeRate decimal.Decimal) (fee decimal.Decimal, merchantAmount decimal.Decimal, feePercent int64) {
	fee = amount.Mul(feeRate).Round(2)
	merchantAmount = amount.Sub(fee)
	feePercent = feeRate.Mul(decimal.NewFromInt(100)).IntPart()
	return
}

// GetTodayUsedAmount 获取用户当日已使用的支付额度
func GetTodayUsedAmount(db *gorm.DB, userID uint64) (decimal.Decimal, error) {
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	todayEnd := todayStart.Add(24 * time.Hour)

	var todayTotalAmount decimal.Decimal
	if err := db.Model(&model.Order{}).
		Where("payer_user_id = ? AND status = ? AND type IN ? AND trade_time >= ? AND trade_time < ?",
			userID,
			model.OrderStatusSuccess,
			[]model.OrderType{model.OrderTypePayment, model.OrderTypeOnline},
			todayStart,
			todayEnd).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&todayTotalAmount).Error; err != nil {
		return decimal.Zero, err
	}

	return todayTotalAmount, nil
}
