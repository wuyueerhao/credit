"use client"

import { MerchantProvider } from "@/contexts/merchant-context"
import { UserProvider } from "@/contexts/user-context"

/**
 * 支付页面布局
 * 为支付相关的页面提供商户和用户上下文
 */
export default function PayLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserProvider>
      <MerchantProvider>
        {children}
      </MerchantProvider>
    </UserProvider>
  )
}
