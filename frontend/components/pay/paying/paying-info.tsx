import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronDown } from "@/components/animate-ui/icons/chevron-down"
import { ShoppingBag } from "lucide-react"

import type { GetMerchantOrderResponse } from "@/lib/services"


/**
 * 加载中骨架组件
 * 显示订单信息加载中的骨架
 * 
 * @returns {JSX.Element} 加载中骨架组件
 */
function LoadingSkeleton() {
  return (
    <>
      <div className="mb-8">
        <Skeleton className="h-4 w-64 mb-2 bg-slate-600 bg-gray-300" />
        <Skeleton className="h-10 w-32 bg-slate-600 bg-gray-300" />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between py-4 border-b border-slate-600 border-gray-300">
          <div className="flex flex-col items-start space-y-2">
            <Skeleton className="h-4 w-24 bg-slate-600 bg-gray-300" />
            <Skeleton className="h-3 w-16 bg-slate-600 bg-gray-300" />
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Skeleton className="h-4 w-20 bg-slate-600 bg-gray-300" />
            <Skeleton className="h-3 w-24 bg-slate-600 bg-gray-300" />
          </div>
        </div>

        <Skeleton className="h-4 w-32 bg-slate-600 bg-gray-300" />

        <div className="flex justify-between items-center pt-4 border-t border-slate-600 border-gray-300">
          <Skeleton className="h-6 w-20 bg-slate-600 bg-gray-300" />
          <Skeleton className="h-6 w-24 bg-slate-600 bg-gray-300" />
        </div>

        <div className="space-y-1">
          <Skeleton className="h-3 w-full bg-slate-600 bg-gray-300" />
          <Skeleton className="h-3 w-3/4 bg-slate-600 bg-gray-300" />
        </div>
      </div>
    </>
  )
}

/**
 * 订单信息组件
 * 显示订单信息
 * 
 * @param {GetMerchantOrderResponse} orderInfo - 订单信息
 * @returns {JSX.Element} 订单信息组件
 */
function OrderContent({ orderInfo }: { orderInfo: GetMerchantOrderResponse }) {
  const amount = parseFloat(orderInfo.order.amount).toFixed(2)
  const feeRate = (parseFloat(orderInfo.user_pay_config.fee_rate) * 100).toFixed(2)

  return (
    <>
      <div className="mb-8">
        <p className="text-slate-300 text-sm mb-2">
          向 {orderInfo.merchant.app_name} ({orderInfo.order.payee_username}) 支付
        </p>
        <h1 className="text-4xl font-bold">LDC {amount}</h1>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between py-4 border-b border-slate-600 border-gray-300">
          <div className="flex flex-col items-start">
            <p className="text-sm font-medium mb-1">{orderInfo.order.order_name}</p>
            <p className="text-slate-300 text-gray-600 text-xs">数量: 1</p>
          </div>
          <div className="flex flex-col items-end text-right">
            <p className="text-sm font-medium mb-1">LDC {amount}</p>
            <p className="text-slate-300 text-gray-600 text-xs">LDC {amount} 每个</p>
          </div>
        </div>

        <button className="text-sm text-slate-300 text-gray-600 hover:text-white hover:text-gray-900 transition">
          添加促销码 (暂未开放)
        </button>

        <div className="flex justify-between items-center pt-4 border-t border-slate-600 border-gray-300">
          <p className="text-2xl font-bold">应付合计</p>
          <p className="text-2xl font-bold">LDC {amount}</p>
        </div>

        <p className="text-xs text-slate-400 text-gray-500 space-y-1 leading-relaxed">
          手续费率: {feeRate}%
          <br />
          手续费率会根据商家支付等级动态调整，并不会增加您的支付金额，仅对商家收取手续费，手续费将直接从商家账户扣除。
        </p>
      </div>
    </>
  )
}

/**
 * 滚动提示组件
 * 显示滚动提示
 * 
 * @returns {JSX.Element} 滚动提示组件
 */
function ScrollHint() {
  return (
    <div className="flex flex-col items-center justify-center py-4 mt-12 space-y-2 md:hidden">
      <div className="text-xs text-slate-400 text-gray-500">
        下滑继续支付
      </div>
      <ChevronDown
        size={16}
        className="text-slate-400 text-gray-500 animate-bounce duration-1000"
      />
    </div>
  )
}

/**
 * 支付信息组件
 * 显示支付信息
 * 
 * @param {GetMerchantOrderResponse} orderInfo - 订单信息
 * @param {boolean} loading - 是否加载中
 * @returns {JSX.Element} 支付信息组件
 */
export function PayingInfo({ orderInfo, loading = false }: { orderInfo: GetMerchantOrderResponse, loading: boolean }) {

  return (
    <div className="flex flex-col w-full md:w-1/2 p-6 md:p-24 pb-8 md:pb-24 items-center bg-slate-700 bg-gray-50 text-white text-gray-900 justify-center min-h-screen md:min-h-0 lg:min-h-screen">
      <div className="w-full max-w-sm md:max-w-none text-left">
        <div className="mb-12">
          <div className="flex items-center">
            {loading ? (
              <>
                <Skeleton className="w-8 h-8 rounded-full mr-4 bg-slate-600 bg-gray-300" />
                <Skeleton className="h-8 w-48 bg-slate-600 bg-gray-300" />
              </>
            ) : (
              <>
                <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full mr-4">
                  <ShoppingBag className="size-4.5 text-slate-700" />
                </div>
                <span className="text-3xl font-bold">{orderInfo.merchant.app_name}</span>
              </>
            )}
          </div>
        </div>

        {loading ? <LoadingSkeleton /> : <OrderContent orderInfo={orderInfo} />}

        <ScrollHint />
      </div>
    </div>
  )
}
