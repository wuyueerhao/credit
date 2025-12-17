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

package task

const (
	UpdateUserGamificationScoresTask      = "user:gamification:update_scores_task"
	UpdateSingleUserGamificationScoreTask = "user:gamification:update_single_score_task"
	AutoRefundExpiredDisputesTask         = "dispute:auto_refund_expired"
	AutoRefundSingleDisputeTask           = "dispute:auto_refund_single"
	MerchantPaymentNotifyTask             = "payment:merchant_notify" // 商户支付回调任务
)

const (
	QueueWhitelistOnly = "whitelist_only"
	QueueWebhook       = "webhook"
	QueueDefault       = "default"
)
