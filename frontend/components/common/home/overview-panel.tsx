import * as React from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Area, AreaChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ExternalLink, Info, Eye, EyeOff, RefreshCcw } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DisputeService } from "@/lib/services"
import type { DisputeWithOrder, Order } from "@/lib/services"
import { RefundReviewDialog, CancelDisputeDialog } from "@/components/common/general/table-data"
import { CountingNumber } from '@/components/animate-ui/primitives/texts/counting-number'
import { useDisputeData } from "@/hooks/use-dispute"
import { DisputeDialog } from "@/components/common/home/dispute-dialog"

const chartData = [
  { date: "10-31", value: 0 },
  { date: "11-01", value: 0 },
  { date: "11-02", value: 0 },
  { date: "11-03", value: 0 },
  { date: "11-04", value: 0.01 },
  { date: "11-05", value: 0 },
  { date: "11-06", value: 0 },
]

const chartConfig = {
  value: {
    label: "数值",
    color: "hsl(217, 91%, 60%)",
  },
} satisfies ChartConfig


/**
 * 创建争议订单对象
 * @param dispute 争议对象
 * @param type 争议类型
 * @returns 争议订单对象
 */
const createDisputeOrder = (dispute: DisputeWithOrder, type: 'receive' | 'payment'): Order => ({
  id: dispute.order_id,
  dispute_id: dispute.id,
  type,
  status: 'disputing' as const,
  order_no: '',
  order_name: dispute.order_name,
  merchant_order_no: '',
  payer_user_id: 0,
  payee_user_id: 0,
  payer_username: '',
  payee_username: dispute.payee_username,
  amount: dispute.amount,
  remark: '',
  client_id: '',
  trade_time: '',
  expires_at: '',
  created_at: '',
  updated_at: '',
  payment_type: ''
})

/**
 * 争议列表骨架屏
 * 用于显示争议列表的加载状态
 * 
 * @returns 争议列表骨架屏
 */
const DisputeListSkeleton = () => (
  <div className="space-y-1">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={`skeleton-${index}`}
        className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30"
      >
        <div className="flex-1 min-w-0">
          <Skeleton className="h-3 w-32 mb-1" />
          <Skeleton className="h-2.5 w-20" />
        </div>
        <div className="flex items-center gap-1 ml-2">
          <Skeleton className="h-5 w-5 p-1 rounded-full bg-muted" />
        </div>
      </div>
    ))}
  </div>
)

/**
 * 面积图卡片（总额和净交易额共用）
 */
interface AreaChartCardProps {
  /** 卡片标题 */
  title: string
  /** 卡片值 */
  value: string
  /** 渐变 ID */
  gradientId: string
  /** 是否显示更多按钮 */
  showMoreButton?: boolean
}

const AreaChartCard: React.FC<AreaChartCardProps> = ({ title, value, gradientId, showMoreButton = false }) => (
  <Card className="bg-background border-0 shadow-none rounded-lg min-h-[200px] flex flex-col h-full">
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
          <Info className="size-4 text-muted-foreground" />
        </Button>
      </div>
      <div>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </CardHeader>
    <CardContent className="flex-1">
      <ChartContainer config={chartConfig} className="h-[120px] w-full">
        <AreaChart data={chartData} margin={{ left: 2, right: 2, top: 5, bottom: 5 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis hide />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
          <Area
            dataKey="value"
            type="monotone"
            fill={`url(#${gradientId})`}
            stroke="hsl(217, 91%, 60%)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
        <span className="w-full text-center">所有时间</span>
      </div>
    </CardContent>
    <CardFooter className="border-t h-8 items-end">
      <div className="flex items-center justify-between text-xs text-muted-foreground w-full">
        <span>更新时间：上午12:29</span>
        {showMoreButton && (
          <Button variant="link" className="px-0 h-4 text-xs text-blue-600">
            查看更多
          </Button>
        )}
      </div>
    </CardFooter>
  </Card>
)


/**
 * 付款卡片
 * 用于显示付款数据
 * 
 * @returns 付款卡片
 */
function PaymentCard() {
  const [isHidden, setIsHidden] = React.useState(false)

  return (
    <Card className="bg-background border-0 shadow-none rounded-lg min-h-[200px] flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">付款</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0"
            onClick={() => setIsHidden(!isHidden)}
          >
            {isHidden ? (
              <EyeOff className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Eye className="h-3 w-3 text-muted-foreground" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center justify-between py-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center justify-between py-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center justify-between py-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {isHidden && (
          <div className="absolute inset-0 backdrop-blur-md bg-background/30 rounded-lg flex items-center justify-center">
            <EyeOff className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t h-8 items-end">
        <div className="flex items-center justify-between text-xs text-muted-foreground w-full">
          <span>更新时间：上午12:29</span>
        </div>
      </CardFooter>
    </Card>
  )
}

/**
 * 总额卡片
 * 用于显示总额数据
 * 
 * @returns 总额卡片
 */
const TotalCard = () => <AreaChartCard title="总额" value="LDC 100.00" gradientId="totalGradient" showMoreButton />

/**
 * 净交易额卡片
 * 用于显示净交易额数据
 * 
 * @returns 净交易额卡片
 */
const NetVolumeCard = () => <AreaChartCard title="净交易额" value="LDC 100.00" gradientId="netGradient" showMoreButton />

/**
 * 支出最多的客户卡片
 * 用于显示支出最多的客户数据
 * 
 * @returns 支出最多的客户卡片
 */
function TopCustomersCard() {
  return (
    <Card className="bg-background border-0 shadow-none rounded-lg min-h-[200px] flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium">支出最多的客户</CardTitle>
          <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
            <ExternalLink className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
      <CardFooter className="border-t h-8 items-end">
        <div className="flex items-center justify-between text-xs text-muted-foreground w-full">
          <span>更新时间：上午12:29</span>
        </div>
      </CardFooter>
    </Card>
  )
}

/**
 * 待处理的争议卡片
 * 用于显示待处理的争议数据
 * 
 * @returns 待处理的争议卡片
 */
function PendingDisputesCard({ onViewAll }: { onViewAll: () => void }) {
  const { disputes, loading, handleRefresh, refetchData } = useDisputeData({
    fetchFn: (params) => DisputeService.listMerchantDisputes(params)
  })

  return (
    <Card className="bg-background border-0 shadow-none rounded-lg min-h-[200px] flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <CardTitle className="text-sm font-medium">待处理的争议</CardTitle>
            <p className="font-semibold">{loading ? '-' : <CountingNumber number={disputes.count} decimalPlaces={0} />}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={handleRefresh}>
            <RefreshCcw className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 -mt-4">
        <ScrollArea className="h-46">
          {loading ? (
            <DisputeListSkeleton />
          ) : disputes.list.length > 0 ? (
            <div className="space-y-1">
              {disputes.list.map((dispute) => (
                <div
                  key={`merchant-${dispute.id}`}
                  className="flex items-center justify-between py-1 px-2 rounded-md bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate leading-tight">
                      {dispute.order_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {dispute.payee_username}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <RefundReviewDialog
                      order={createDisputeOrder(dispute, 'receive')}
                      onSuccess={refetchData}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-46 flex items-center justify-center">
              <p className="text-muted-foreground text-xs">暂无待处理的争议</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="h-8 items-end">
        <div className="flex border-t pt-4 items-center justify-between text-xs text-muted-foreground w-full">
          <span>更新时间：{new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
          <Button
            variant="link"
            className="px-0 h-4 text-xs text-blue-600"
            disabled={loading}
            onClick={onViewAll}
          >
            查看全部
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

/**
 * 我发起的争议卡片
 * 用于显示我发起的争议数据
 * 
 * @returns 我发起的争议卡片
 */
function MyDisputesCard({ onViewAll }: { onViewAll: () => void }) {
  const { disputes, loading, handleRefresh, refetchData } = useDisputeData({
    fetchFn: (params) => DisputeService.listDisputes(params)
  })

  return (
    <Card className="bg-background border-0 shadow-none rounded-lg min-h-[200px] flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <CardTitle className="text-sm font-medium">我发起的争议</CardTitle>
            <p className="font-semibold">{loading ? '-' : <CountingNumber number={disputes.count} decimalPlaces={0} />}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={handleRefresh}>
            <RefreshCcw className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 -mt-4">
        <ScrollArea className="h-46">
          {loading ? (
            <DisputeListSkeleton />
          ) : disputes.list.length > 0 ? (
            <div className="space-y-1">
              {disputes.list.map((dispute) => (
                <div
                  key={`user-${dispute.id}`}
                  className="flex items-center justify-between py-1 px-2 rounded-md bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate leading-tight">
                      {dispute.order_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      商家正在处理争议
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <CancelDisputeDialog
                      order={createDisputeOrder(dispute, 'payment')}
                      onSuccess={refetchData}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-46 flex items-center justify-center text-muted-foreground text-xs">
              暂无我发起的争议
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="h-8 items-end">
        <div className="flex border-t pt-4 items-center justify-between text-xs text-muted-foreground w-full">
          <span>更新时间：{new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
          <Button
            variant="link"
            className="px-0 h-4 text-xs text-blue-600"
            disabled={loading}
            onClick={onViewAll}
          >
            查看全部
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

/**
 * 概览面板组件
 * 用于显示概览面板
 * 
 * @returns 概览面板组件
 */
export function OverviewPanel() {
  const [disputeDialogOpen, setDisputeDialogOpen] = React.useState(false)
  const [disputeDialogMode, setDisputeDialogMode] = React.useState<'pending' | 'my-disputes'>('pending')

  const handleViewAllPending = () => {
    setDisputeDialogMode('pending')
    setDisputeDialogOpen(true)
  }

  const handleViewAllMyDisputes = () => {
    setDisputeDialogMode('my-disputes')
    setDisputeDialogOpen(true)
  }

  return (
    <>
      <div className="bg-muted rounded-lg p-2 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          <PaymentCard />
          <TotalCard />
          <NetVolumeCard />
          <TopCustomersCard />
          <PendingDisputesCard onViewAll={handleViewAllPending} />
          <MyDisputesCard onViewAll={handleViewAllMyDisputes} />
        </div>
      </div>

      <DisputeDialog
        mode={disputeDialogMode}
        open={disputeDialogOpen}
        onOpenChange={setDisputeDialogOpen}
      />
    </>
  )
}
