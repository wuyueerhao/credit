import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Send } from "@/components/animate-ui/icons/send"
import { Check } from "@/components/animate-ui/icons/check"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/animate-ui/primitives/radix/collapsible"
import { AlertCircle, CreditCard, ArrowLeft } from "lucide-react"

import type { GetMerchantOrderResponse } from "@/lib/services"


type PaymentStep = typeof PAYMENT_STEPS[keyof typeof PAYMENT_STEPS]

const PAYMENT_METHODS = {
  LINUX_DO_PAY: 'linux-do-pay'
} as const

const PAYMENT_STEPS = {
  METHOD: 'method' as const,
  PAY: 'pay' as const
} as const

const ORDER_STATUSES = {
  SUCCESS: 'success',
  PENDING: 'pending'
} as const

/**
 * 加载中骨架组件
 * 显示支付方式加载中的骨架
 * 
 * @returns {JSX.Element} 加载中骨架组件
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>

      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  )
}

/**
 * 成功状态组件
 * 显示支付成功状态
 * 
 * @returns {JSX.Element} 成功状态组件
 */
function SuccessState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.6,
        ease: "easeOut",
        type: "spring",
        stiffness: 100
      }}
      className="text-center py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          delay: 0.2,
          duration: 0.5,
          type: "spring",
          stiffness: 200
        }}
        className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <Check
          className="text-green-600"
          animation="path"
          animate={true}
          loop={false}
        />
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        className="font-semibold text-gray-900 mb-2"
      >
        支付成功
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.3 }}
        className="text-sm text-gray-600"
      >
        您的订单已成功支付，感谢您的购买！
      </motion.p>
    </motion.div>
  )
}

/**
 * 支付方式选择步骤组件
 * 显示支付方式选择步骤
 * 
 * @param {GetMerchantOrderResponse} orderInfo - 订单信息
 * @param {string} selectedMethod - 选择的支付方式
 * @param {boolean} isOpen - 是否打开
 * @param {() => void} onSelectedMethodChange - 选择支付方式回调
 * @param {() => void} onIsOpenChange - 打开关闭回调
 * @param {() => void} onCurrentStepChange - 当前步骤回调
 * @returns {JSX.Element} 支付方式选择步骤组件
 */
function MethodSelectionStep({
  orderInfo,
  selectedMethod,
  isOpen,
  onSelectedMethodChange,
  onIsOpenChange,
  onCurrentStepChange
}: {
  orderInfo: GetMerchantOrderResponse
  selectedMethod: string
  isOpen: boolean
  onSelectedMethodChange: (method: string) => void
  onIsOpenChange: (isOpen: boolean) => void
  onCurrentStepChange: (step: PaymentStep) => void
}) {
  return (
    <motion.div
      key="method-step"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="w-full">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">支付方式</h2>
        <p className="text-sm text-gray-600 mb-4">请选择您想要使用的支付方式</p>
      </div>

      <div className="space-y-4 w-full">
        <Collapsible open={isOpen} onOpenChange={onIsOpenChange}>
          <CollapsibleTrigger asChild>
            <div
              className={`cursor-pointer border shadow-none rounded-lg py-2 px-4 transition-colors ${
                selectedMethod === PAYMENT_METHODS.LINUX_DO_PAY
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => {
                if (selectedMethod === PAYMENT_METHODS.LINUX_DO_PAY) {
                  onSelectedMethodChange('')
                  onIsOpenChange(false)
                } else {
                  onSelectedMethodChange(PAYMENT_METHODS.LINUX_DO_PAY)
                  onIsOpenChange(true)
                }
              }}
            >
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                  <CreditCard className="size-3.5 text-white" />
                </div>
                <div className="text-sm font-bold text-gray-900">LINUX DO PAY</div>
              </div>
            </div>
          </CollapsibleTrigger>

          {selectedMethod === PAYMENT_METHODS.LINUX_DO_PAY && (
            <CollapsibleContent>
              <div className="text-xs text-gray-600 py-4">
                确认您的付款账户: {orderInfo.order.payer_username}
              </div>
              <Button
                onClick={() => onCurrentStepChange(PAYMENT_STEPS.PAY)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                继续
              </Button>
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    </motion.div>
  )
}

/**
 * 支付步骤组件
 * 显示支付步骤
 * 
 * @param {GetMerchantOrderResponse} orderInfo - 订单信息
 * @param {string} payKey - 支付密码
 * @param {boolean} paying - 是否支付中
 * @param {() => void} onPayKeyChange - 支付密码回调
 * @param {() => void} onCurrentStepChange - 当前步骤回调
 * @param {() => void} onPayOrder - 支付订单回调
 * @returns {JSX.Element} 支付步骤组件
 */
function PaymentStep({
  orderInfo,
  payKey,
  paying,
  onPayKeyChange,
  onCurrentStepChange,
  onPayOrder
}: {
  orderInfo: GetMerchantOrderResponse
  payKey: string
  paying: boolean
  onPayKeyChange: (value: string) => void
  onCurrentStepChange: (step: PaymentStep) => void
  onPayOrder: () => void
}) {
  return (
    <motion.div
      key="pay-step"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="w-full">
        <div className="flex items-center mb-2">
          <ArrowLeft
            className="size-4 mr-2 hover:text-blue-600 cursor-pointer"
            onClick={() => onCurrentStepChange(PAYMENT_STEPS.METHOD)}
          />
          <span className="text-xl font-semibold text-gray-900">身份验证</span>
        </div>
        <p className="text-sm text-gray-600 mb-4">请输入您的6位支付密码进行身份验证</p>
      </div>

      <div className="flex">
        <div className="flex flex-[3]">
          <InputOTP
            maxLength={6}
            value={payKey}
            onChange={onPayKeyChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && payKey.length === 6 && !paying) {
                onPayOrder()
              }
            }}
          >
            <InputOTPGroup className="gap-1">
              <InputOTPSlot index={0} className="size-11" />
              <InputOTPSlot index={1} className="size-11" />
              <InputOTPSlot index={2} className="size-11" />
              <InputOTPSlot index={3} className="size-11" />
              <InputOTPSlot index={4} className="size-11" />
              <InputOTPSlot index={5} className="size-11" />
            </InputOTPGroup>
          </InputOTP>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <Button
          onClick={onPayOrder}
          disabled={paying || payKey.length !== 6}
          className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold"
        >
          {paying ? (
            <>
              <Send className="mr-1" animate={true} loop={true} loopDelay={2000}/> 处理中
            </>
          ) : (
            `支付 LDC ${(parseFloat(orderInfo.order.amount)).toFixed(2)}`
          )}
        </Button>
      </div>
    </motion.div>
  )
}

/**
 * 错误状态组件
 * 显示错误状态
 * 
 * @param {string} status - 错误状态
 * @returns {JSX.Element} 错误状态组件
 */
function ErrorState({ status }: { status: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">订单状态异常</h3>
      <p className="text-gray-600">订单状态: {status}</p>
    </div>
  )
}

/**
 * 底部组件
 * 显示底部
 * 
 * @param {boolean} loading - 是否加载中
 * @returns {JSX.Element} 底部组件
 */
function Footer({ loading }: { loading?: boolean }) {
  return loading ? (
    <div className="flex flex-col items-center justify-center space-y-1 mt-6">
      <Skeleton className="h-3 w-48" />
      <Skeleton className="h-3 w-56" />
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center text-xs text-gray-600 space-y-1 mt-6">
      <span>由 LINUX DO PAY 提供安全支付支持</span>
      <span>Copyright © 2025 LINUX DO PAY。保留所有权利。</span>
    </div>
  )
}

/**
 * 支付现在组件的props
 * 显示支付现在组件
 * 
 * @param {GetMerchantOrderResponse | null} orderInfo - 订单信息
 * @param {boolean} paying - 是否支付中
 * @param {string} payKey - 支付密码
 * @param {PaymentStep} currentStep - 当前步骤
 * @param {string} selectedMethod - 选择的支付方式
 * @param {boolean} isOpen - 是否打开
 * @param {boolean} loading - 是否加载中
 * @returns {JSX.Element} 支付现在组件
 */
interface PayingNowProps {
  orderInfo: GetMerchantOrderResponse | null
  paying: boolean
  payKey: string
  currentStep: PaymentStep
  selectedMethod: string
  isOpen: boolean
  loading?: boolean
  onPayKeyChange: (value: string) => void
  onCurrentStepChange: (step: PaymentStep) => void
  onSelectedMethodChange: (method: string) => void
  onIsOpenChange: (isOpen: boolean) => void
  onPayOrder: () => void
}

/**
 * 支付现在组件
 * 显示支付现在组件
 * 
 * @param {PayingNowProps} props - 支付现在组件的props
 * @returns {JSX.Element} 支付现在组件
 */
export function PayingNow({
  orderInfo,
  paying,
  payKey,
  currentStep,
  selectedMethod,
  isOpen,
  loading = false,
  onPayKeyChange,
  onCurrentStepChange,
  onSelectedMethodChange,
  onIsOpenChange,
  onPayOrder
}: PayingNowProps) {
  const renderContent = () => {
    if (loading) return <LoadingSkeleton />

    if (!orderInfo) return null

    switch (orderInfo.order.status) {
      case ORDER_STATUSES.SUCCESS:
        return <SuccessState />

      case ORDER_STATUSES.PENDING:
        return (
          <AnimatePresence mode="wait">
            {currentStep === PAYMENT_STEPS.METHOD ? (
              <MethodSelectionStep
                orderInfo={orderInfo}
                selectedMethod={selectedMethod}
                isOpen={isOpen}
                onSelectedMethodChange={onSelectedMethodChange}
                onIsOpenChange={onIsOpenChange}
                onCurrentStepChange={onCurrentStepChange}
              />
            ) : (
              <PaymentStep
                orderInfo={orderInfo}
                payKey={payKey}
                paying={paying}
                onPayKeyChange={onPayKeyChange}
                onCurrentStepChange={onCurrentStepChange}
                onPayOrder={onPayOrder}
              />
            )}
          </AnimatePresence>
        )

      default:
        return <ErrorState status={orderInfo.order.status} />
    }
  }

  return (
    <div className="flex-1 bg-white flex items-center justify-center px-6 py-8 md:px-0 md:py-0">
      <div className="w-full md:w-2/3 max-w-sm md:max-w-md">
        {renderContent()}
        <Footer loading={loading} />
      </div>
    </div>
  )
}
