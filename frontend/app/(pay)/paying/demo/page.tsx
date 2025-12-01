"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Copy, ExternalLink, Key, AlertCircle, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useMerchant } from "@/contexts/merchant-context"
import { useUser } from "@/contexts/user-context"
import { LoadingPage } from "@/components/layout/loading"
import axios, { AxiosError } from "axios"
import { apiConfig } from "@/lib/services/core/config"
import { Spinner } from "@/components/ui/spinner"

export default function DemoPayPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const { apiKeys, loading: apiKeysLoading, loadAPIKeys } = useMerchant()

  const [formData, setFormData] = useState({
    client_id: "",
    client_secret: "",
    order_name: "",
    amount: "",
    remark: "",
  })

  const [createdOrder, setCreatedOrder] = useState<{
    order_id: number
    pay_url: string
    order_no: string
  } | null>(null)

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && !userLoading) {
      loadAPIKeys()
    }
  }, [user, userLoading, loadAPIKeys])

  useEffect(() => {
    if (apiKeys.length > 0 && !formData.client_id) {
      setFormData(prev => ({
        ...prev,
        client_id: apiKeys[0].client_id
      }))
    }
  }, [apiKeys, formData.client_id])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const createMerchantOrderDirectly = async (
    request: { order_name: string; amount: number; remark?: string },
    clientId: string,
    clientSecret: string
  ) => {
    const auth = `${clientId}:${clientSecret}`;
    const encodedAuth = btoa(auth);

    const response = await axios.post(
      `${apiConfig.baseURL}/api/v1/merchant/payment/orders`,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${encodedAuth}`,
        },
        withCredentials: apiConfig.withCredentials,
        timeout: apiConfig.timeout,
      }
    );

    return response.data.data;
  }

  const handleCreateOrder = async () => {
    if (!formData.client_id) {
      toast.error("创建失败", {
        description: "请选择 Client ID",
      })
      return
    }

    if (!formData.client_secret) {
      toast.error("创建失败", {
        description: "请输入 Client Secret",
      })
      return
    }

    if (!formData.order_name.trim()) {
      toast.error("创建失败", {
        description: "请输入订单名称",
      })
      return
    }

    const amount = parseFloat(formData.amount)
    if (!amount || amount <= 0) {
      toast.error("创建失败", {
        description: "请输入有效的金额",
      })
      return
    }

    setLoading(true)

    try {
      const result = await createMerchantOrderDirectly(
        {
          order_name: formData.order_name,
          amount: amount,
          remark: formData.remark || undefined
        },
        formData.client_id,
        formData.client_secret
      )

      let orderNo: string | null = null;

      try {
        const url = new URL(result.pay_url);
        orderNo = url.searchParams.get('order_no');
      } catch {
        const urlPattern = /[?&]order_no=([^&#]*)/;
        const match = result.pay_url.match(urlPattern);
        orderNo = match ? decodeURIComponent(match[1]) : null;
      }

      if (!orderNo) {
        orderNo = result.pay_url.split('order_no=')[1] || null;
      }

      setCreatedOrder({
        order_id: result.order_id,
        pay_url: result.pay_url,
        order_no: orderNo || result.pay_url
      })

      toast.success("订单创建成功！")
    } catch (error: unknown) {
      console.error('Failed to create order:', error)

      const isAxiosError = (err: unknown): err is AxiosError => {
        return err instanceof Error && 'isAxiosError' in err && err.isAxiosError === true
      }

      if (isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error("Client ID 或 Client Secret 无效，请检查凭据")
        } else if (error.response?.status === 403) {
          toast.error("无权限创建订单")
        } else if (error.response?.status === 400) {
          const errorMsg = error.response.data && typeof error.response.data === 'object' && 'error_msg' in error.response.data
            ? String(error.response.data.error_msg)
            : "请求参数无效"
          toast.error(errorMsg)
        } else if (error.response?.status && error.response.status >= 500) {
          toast.error("服务器错误，请稍后重试")
        } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          toast.error("请求超时，请检查网络连接")
        } else {
          const errorMessage = error.response?.data && typeof error.response.data === 'object' && 'error_msg' in error.response.data
            ? String(error.response.data.error_msg)
            : error.message || "创建订单失败，请检查凭据"
          toast.error(errorMessage)
        }
      } else {
        toast.error("发生未知错误")
      }
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("已复制到剪贴板")
    } catch {
      toast.error("复制失败")
    }
  }

  if (userLoading) {
    return <LoadingPage text="用户信息" badgeText="DEMO" />
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="space-y-6 animate-in fade-in duration-300">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-8 text-xs"
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            返回
          </Button>

          <div className="text-center">
            <h1 className="text-xl font-semibold">需要登录</h1>
            <p className="text-muted-foreground text-xs mt-2">
              请先登录以使用测试支付功能
            </p>
          </div>

          <div className="border border-dashed rounded-lg p-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-xs">
                此功能需要访问您的商户 API 密钥，请先登录您的账户
              </p>
              <Button
                onClick={() => window.location.href = '/login'}
                className="w-full h-8 text-xs"
              >
                前往登录
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl relative">
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none z-0">
        <div className="transform -rotate-45 text-9xl font-black tracking-wider">
          DEMO
        </div>
      </div>

      <div className="space-y-6 relative z-10 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="h-8 text-xs"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              返回
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-medium text-orange-700 dark:text-orange-300">DEMO 模式</span>
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-lg font-semibold">快速测试</h1>
          <p className="text-muted-foreground text-xs mt-1">
            创建测试订单并进行支付验证
          </p>
        </div>

        <div className="border border-dashed rounded-lg p-6 space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_id" className="text-xs">Client ID <span className="text-red-500">*</span></Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => handleInputChange("client_id", value)}
                disabled={apiKeysLoading}
              >
                <SelectTrigger className="!h-8 text-xs w-full">
                  <SelectValue placeholder={apiKeysLoading ? "加载中..." : "选择 Client ID"} />
                </SelectTrigger>
                <SelectContent>
                  {apiKeys.map((apiKey) => (
                    <SelectItem key={apiKey.client_id} value={apiKey.client_id}>
                      <div className="flex items-center gap-2">
                        <Key className="w-3 h-3" />
                        <span className="font-mono text-xs">{apiKey.client_id}</span>
                        <span className="text-muted-foreground text-[10px]">({apiKey.app_name})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {apiKeys.length === 0 && !apiKeysLoading && (
                <p className="text-xs text-muted-foreground">
                  暂无可用 API 密钥，请先创建商户 API 密钥
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_secret" className="text-xs">Client Secret <span className="text-red-500">*</span></Label>
              <Input
                id="client_secret"
                type="password"
                placeholder="请输入您的商户 Client Secret"
                value={formData.client_secret}
                onChange={(e) => handleInputChange("client_secret", e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_name" className="text-xs">订单名称 <span className="text-red-500">*</span></Label>
              <Input
                id="order_name"
                placeholder="例如：商品购买、会员充值等"
                value={formData.order_name}
                onChange={(e) => handleInputChange("order_name", e.target.value)}
                maxLength={64}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-xs">订单金额 <span className="text-red-500">*</span></Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                金额必须大于 0，最多支持两位小数
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remark" className="text-xs">备注（可选）</Label>
              <textarea
                id="remark"
                placeholder="订单备注..."
                value={formData.remark}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("remark", e.target.value)}
                maxLength={200}
                rows={3}
                className="flex min-h-[60px] w-full rounded-md border border-input px-3 py-2 text-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow] outline-none"
              />
            </div>

            <Button
              onClick={handleCreateOrder}
              disabled={loading}
              className="w-full h-8 text-xs"
            >
              {loading ? <><Spinner className="w-3 h-3 mr-1" /> 创建中...</> : '创建订单'}
            </Button>
          </div>
        </div>

        {createdOrder && (
          <div className="border border-dashed rounded-lg p-6 space-y-4 bg-green-50/30 dark:bg-green-900/10 animate-in fade-in duration-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <h2 className="text-sm font-medium">订单创建成功</h2>
            </div>
            <p className="text-xs text-muted-foreground">订单已创建，以下是订单信息和支付链接</p>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">订单 ID</Label>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 font-mono">
                    {createdOrder.order_id}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(createdOrder.order_id.toString())}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">订单号</Label>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 font-mono">
                    {createdOrder.order_no}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(createdOrder.order_no)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">支付链接</Label>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 break-all font-mono">
                    {`${process.env.NEXT_PUBLIC_LINUX_DO_PAY_FRONTEND_URL || 'http://localhost:3000'}/paying/${createdOrder.pay_url}`}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(`${process.env.NEXT_PUBLIC_LINUX_DO_PAY_FRONTEND_URL || 'http://localhost:3000'}/paying/${createdOrder.pay_url}`)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(`${process.env.NEXT_PUBLIC_LINUX_DO_PAY_FRONTEND_URL || 'http://localhost:3000'}/paying/${createdOrder.pay_url}`, '_blank')}
                    className="h-6 w-6 p-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-yellow-800 dark:text-yellow-300">
                    <strong>注意：</strong>这是 DEMO 测试页面，创建的订单会调用生产 API，支付链接会跳转到真实支付页面
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setCreatedOrder(null)
                  setFormData({
                    client_id: apiKeys.length > 0 ? apiKeys[0].client_id : "",
                    client_secret: "",
                    order_name: "",
                    amount: "",
                    remark: ""
                  })
                }}
                className="w-full h-8 text-xs border-dashed"
              >
                创建新订单
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
