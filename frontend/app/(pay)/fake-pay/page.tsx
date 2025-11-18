"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Copy, ExternalLink, Key } from "lucide-react"
import { toast } from "sonner"
import { useMerchant } from "@/contexts/merchant-context"
import { useUser } from "@/contexts/user-context"
import axios, { AxiosError } from "axios"
import { apiConfig } from "@/lib/services/core/config"

/**
 * Fake Pay Page - For demonstration and testing.
 * Allows creation of merchant payment orders from the web UI.
 */
export default function FakePayPage() {
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

  // Load API keys (only after user logged in)
  useEffect(() => {
    if (user && !userLoading) {
      loadAPIKeys()
    }
  }, [user, userLoading, loadAPIKeys])

  // After API keys loaded, default to selecting the first one
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

  // Simple Alert component
  const Alert = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
      {children}
    </div>
  )

  const AlertDescription = ({ children }: { children: React.ReactNode }) => (
    <div className="text-sm">{children}</div>
  )

  // Custom function to create order, avoid auto redirect
  const createMerchantOrderDirectly = async (
    request: { order_name: string; amount: number; remark?: string },
    clientId: string,
    clientSecret: string
  ) => {
    // Use Basic Auth format: ClientID:ClientSecret
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
      toast.error("Please select Client ID")
      return
    }

    if (!formData.client_secret) {
      toast.error("Please enter Client Secret")
      return
    }

    if (!formData.order_name.trim()) {
      toast.error("Please enter order name")
      return
    }

    const amount = parseFloat(formData.amount)
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setLoading(true)

    try {
      // Use custom API call to avoid auto redirect to login
      const result = await createMerchantOrderDirectly(
        {
          order_name: formData.order_name,
          amount: amount,
          remark: formData.remark || undefined
        },
        formData.client_id,
        formData.client_secret
      )

      // Extract order number from pay url
      let orderNo: string | null = null;

      // Try to parse as full URL first
      try {
        const url = new URL(result.pay_url);
        orderNo = url.searchParams.get('order_no');
      } catch {
        // If not a valid URL, try to extract from query string format
        const urlPattern = /[?&]order_no=([^&#]*)/;
        const match = result.pay_url.match(urlPattern);
        orderNo = match ? decodeURIComponent(match[1]) : null;
      }

      // Fallback: split method
      if (!orderNo) {
        orderNo = result.pay_url.split('order_no=')[1] || null;
      }

      setCreatedOrder({
        order_id: result.order_id,
        pay_url: result.pay_url,
        order_no: orderNo || result.pay_url
      })

      toast.success("Order created successfully!")
    } catch (error: unknown) {
      console.error('Failed to create order:', error)

      // Type guard for AxiosError
      const isAxiosError = (err: unknown): err is AxiosError => {
        return err instanceof Error && 'isAxiosError' in err && err.isAxiosError === true
      }

      if (isAxiosError(error)) {
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        })

        // Handle different error types
        if (error.response?.status === 401) {
          toast.error("Invalid Client ID or Client Secret. Please check your credentials.")
          console.log('Auth failed - check client_id and client_secret')
        } else if (error.response?.status === 403) {
          toast.error("Permission denied. Cannot create order.")
        } else if (error.response?.status === 400) {
          const errorMsg = error.response.data && typeof error.response.data === 'object' && 'error_msg' in error.response.data
            ? String(error.response.data.error_msg)
            : "Invalid request parameters"
          toast.error(errorMsg)
        } else if (error.response?.status && error.response.status >= 500) {
          toast.error("Server error, please try again later")
        } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          toast.error("Request timed out, please check your network connection")
        } else {
          const errorMessage = error.response?.data && typeof error.response.data === 'object' && 'error_msg' in error.response.data
            ? String(error.response.data.error_msg)
            : error.message || "Failed to create order, please check credentials"
          toast.error(errorMessage)
        }
      } else {
        toast.error("An unexpected error occurred")
      }
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Copy failed")
    }
  }

  // Show loading state if user info is loading
  if (userLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  // If user not logged in, show login prompt
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Login Required</h1>
            <p className="text-muted-foreground mt-2">
              Please log in to use the fake pay demo function.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  This function needs access to your merchant API key. Please log into your account first.
                </p>
                <Button
                  onClick={() => window.location.href = '/login'}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Fake Pay Demo</h1>
          <p className="text-muted-foreground mt-2">
            This page demonstrates merchant payment order creation. It calls the production API.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Payment Order</CardTitle>
            <CardDescription>
              Fill in the order info. The system will call the production API to create a real order.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Select Client ID *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => handleInputChange("client_id", value)}
                disabled={apiKeysLoading}
              >
              <SelectTrigger>
                <SelectValue placeholder={apiKeysLoading ? "Loading..." : "Select Client ID"} />
              </SelectTrigger>
                <SelectContent>
                  {apiKeys.map((apiKey) => (
                    <SelectItem key={apiKey.client_id} value={apiKey.client_id}>
                      <div className="flex items-center gap-2">
                        <Key className="w-3 h-3" />
                        <span className="font-mono text-sm">{apiKey.client_id}</span>
                        <span className="text-muted-foreground text-xs">({apiKey.app_name})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {apiKeys.length === 0 && !apiKeysLoading && (
                <p className="text-sm text-muted-foreground">
                  No API keys available. Please create a merchant API key first.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_secret">Client Secret *</Label>
              <Input
                id="client_secret"
                type="password"
                placeholder="Enter your merchant Client Secret"
                value={formData.client_secret}
                onChange={(e) => handleInputChange("client_secret", e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Client Secret will not be saved. Please keep it safe.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_name">Order Name *</Label>
              <Input
                id="order_name"
                placeholder="e.g. Goods purchase, membership recharge, etc."
                value={formData.order_name}
                onChange={(e) => handleInputChange("order_name", e.target.value)}
                maxLength={64}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Order Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Amount must be greater than 0, support up to two decimal places.
              </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="remark">Remark (optional)</Label>
              <textarea
                id="remark"
                placeholder="Order remark..."
                value={formData.remark}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("remark", e.target.value)}
                maxLength={200}
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <Button
              onClick={handleCreateOrder}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Creating..." : "Create Order"}
            </Button>
          </CardContent>
        </Card>

        {createdOrder && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Order Created Successfully
              </CardTitle>
              <CardDescription>
                The order is created. Below is the order info and payment link.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Order ID</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {createdOrder.order_id}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(createdOrder.order_id.toString())}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Order No</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {createdOrder.order_no}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(createdOrder.order_no)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Payment Link</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-muted px-2 py-1 rounded flex-1 break-all">
                    {createdOrder.pay_url}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(createdOrder.pay_url)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(createdOrder.pay_url, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Note:</strong> This is a demo page. The created order will call the production API.
                  The payment link leads to the actual payment page.
                </AlertDescription>
              </Alert>

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
                className="w-full"
              >
                Create New Order
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
