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

package util

import (
	"errors"

	"github.com/shopspring/decimal"
)

// ValidateRates 所有 rate 必须在 [0, 1] 范围内，且小数位数不超过2位
func ValidateRates(rates ...decimal.Decimal) error {
	for _, rate := range rates {
		// 验证范围：必须在 [0, 1] 之间
		if rate.LessThan(decimal.Zero) || rate.GreaterThan(decimal.NewFromInt(1)) {
			return errors.New("必须在 0 到 1 之间")
		}

		// 验证小数位数：不超过2位
		if rate.Exponent() < -2 {
			return errors.New("小数位数不能超过2位")
		}
	}

	return nil
}
