"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, ChevronDown, Filter, X } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

// 类型定义
type TransactionType = "receive" | "payment" | "transfer"
type TransactionStatus = "success" | "pending" | "failed"

interface Transaction {
  id: number
  name: string
  amount: number
  type: TransactionType
  buyer: {
    username: string
    uid: string
    avatar?: string
  }
  seller: {
    username: string
    uid: string
    avatar?: string
  }
  orderNo: string
  merchantOrderNo: string
  time: string
  status: TransactionStatus
}

// 模拟交易数据
const transactions: Transaction[] = [
  {
    id: 1,
    name: "在线购物订单",
    amount: 2850.00,
    type: "receive",
    buyer: { username: "张三", uid: "UID10001" },
    seller: { username: "商户A", uid: "UID20001" },
    orderNo: "202411060001",
    merchantOrderNo: "M2024110600001",
    time: "2024-11-06 14:30:25",
    status: "success"
  },
  {
    id: 2,
    name: "供应商货款",
    amount: 15600.00,
    type: "payment",
    buyer: { username: "商户A", uid: "UID20001" },
    seller: { username: "深圳科技", uid: "UID30001" },
    orderNo: "202411060002",
    merchantOrderNo: "M2024110600002",
    time: "2024-11-06 13:15:10",
    status: "success"
  },
  {
    id: 3,
    name: "账户转账",
    amount: 5000.00,
    type: "transfer",
    buyer: { username: "李四", uid: "UID10002" },
    seller: { username: "王五", uid: "UID10003" },
    orderNo: "202411060003",
    merchantOrderNo: "M2024110600003",
    time: "2024-11-06 11:20:45",
    status: "pending"
  },
  {
    id: 4,
    name: "会员充值",
    amount: 1000.00,
    type: "receive",
    buyer: { username: "王五", uid: "UID10003" },
    seller: { username: "商户A", uid: "UID20001" },
    orderNo: "202411060004",
    merchantOrderNo: "M2024110600004",
    time: "2024-11-06 10:05:30",
    status: "success"
  },
  {
    id: 5,
    name: "广告费用",
    amount: 3500.00,
    type: "payment",
    buyer: { username: "商户A", uid: "UID20001" },
    seller: { username: "广告服务商", uid: "UID40001" },
    orderNo: "202411060005",
    merchantOrderNo: "M2024110600005",
    time: "2024-11-06 09:30:15",
    status: "failed"
  },
  {
    id: 6,
    name: "商品销售",
    amount: 4280.00,
    type: "receive",
    buyer: { username: "赵六", uid: "UID10004" },
    seller: { username: "商户A", uid: "UID20001" },
    orderNo: "202411060006",
    merchantOrderNo: "M2024110600006",
    time: "2024-11-05 18:45:20",
    status: "success"
  },
]

// 类型标签配置
const typeConfig: Record<TransactionType, { label: string; color: string }> = {
  receive: { label: "收款", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  payment: { label: "付款", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  transfer: { label: "转账", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" }
}

// 状态标签配置
const statusConfig: Record<TransactionStatus, { label: string; color: string }> = {
  success: { label: "成功", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  pending: { label: "处理中", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  failed: { label: "失败", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" }
}

export function AllActivity() {
  // 筛选状态
  const [selectedTypes, setSelectedTypes] = React.useState<TransactionType[]>([])
  const [selectedStatuses, setSelectedStatuses] = React.useState<TransactionStatus[]>([])
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)
  const [isTypeFilterOpen, setIsTypeFilterOpen] = React.useState(false)
  const [isStatusFilterOpen, setIsStatusFilterOpen] = React.useState(false)
  
  // 计算最近7天
  const getLastDays = (days: number) => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    return { from, to }
  }
  
  const [dateRange, setDateRange] = React.useState<{
    from: Date
    to: Date
  }>(getLastDays(7))

  const quickSelections = [
    { label: "今天", getValue: () => {
      const today = new Date()
      return { from: today, to: today }
    }},
    { label: "最近 7 天", getValue: () => getLastDays(7) },
    { label: "最近 4 周", getValue: () => getLastDays(28) },
    { label: "最近 6 个月", getValue: () => {
      const to = new Date()
      const from = new Date()
      from.setMonth(from.getMonth() - 6)
      return { from, to }
    }},
    { label: "本月至今", getValue: () => {
      const to = new Date()
      const from = new Date(to.getFullYear(), to.getMonth(), 1)
      return { from, to }
    }},
    { label: "所有时间", getValue: () => {
      const to = new Date()
      const from = new Date(2020, 0, 1)
      return { from, to }
    }},
  ]

  // 切换类型筛选
  const toggleType = (type: TransactionType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  // 切换状态筛选
  const toggleStatus = (status: TransactionStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  // 清空所有筛选
  const clearAllFilters = () => {
    setSelectedTypes([])
    setSelectedStatuses([])
    setDateRange(getLastDays(7))
  }

  // 筛选交易数据
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(transaction => {
      // 类型筛选
      if (selectedTypes.length > 0 && !selectedTypes.includes(transaction.type)) {
        return false
      }
      
      // 状态筛选
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(transaction.status)) {
        return false
      }
      
      // 时间筛选
      const transactionDate = new Date(transaction.time)
      const rangeFrom = new Date(dateRange.from)
      const rangeTo = new Date(dateRange.to)
      
      // 设置时间范围的开始为当天00:00:00，结束为当天23:59:59
      rangeFrom.setHours(0, 0, 0, 0)
      rangeTo.setHours(23, 59, 59, 999)
      
      if (transactionDate < rangeFrom || transactionDate > rangeTo) {
        return false
      }
      
      return true
    })
  }, [selectedTypes, selectedStatuses, dateRange])

  // 计算筛选后的统计数据
  const filteredStats = React.useMemo(() => {
    const totalReceive = filteredTransactions
      .filter(t => t.type === "receive" && t.status === "success")
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalPayment = filteredTransactions
      .filter(t => t.type === "payment" && t.status === "success")
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalTransfer = filteredTransactions
      .filter(t => t.type === "transfer" && t.status === "success")
      .reduce((sum, t) => sum + t.amount, 0)
    
    const netProfit = totalReceive - totalPayment

    return [
      {
        title: "总收款",
        amount: `¥${totalReceive.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
        color: "text-green-600",
      },
      {
        title: "总付款",
        amount: `¥${totalPayment.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
        color: "text-red-600",
      },
      {
        title: "总转账",
        amount: `¥${totalTransfer.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
        color: "text-blue-600",
      },
      {
        title: "净收益",
        amount: `¥${netProfit.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
        color: "text-primary",
      }
    ]
  }, [filteredTransactions])

  const hasActiveFilters = selectedTypes.length > 0 || selectedStatuses.length > 0

  return (
    <div className="pt-2 space-y-6 w-full">
      {/* 筛选工具栏 */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-6 border-b">
        <div className="flex items-center gap-2 flex-wrap">
          {/* 类型筛选 */}
          <div className="relative">
            <button
              onClick={() => setIsTypeFilterOpen(!isTypeFilterOpen)}
              className={`!h-6 !min-h-6 text-xs font-bold rounded-full border shadow-none !px-2.5 !py-1 gap-2 inline-flex items-center w-auto hover:bg-accent ${
                selectedTypes.length > 0 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                  : 'border-muted-foreground/20'
              }`}
            >
              <Filter className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground text-xs font-bold">类型</span>
              {selectedTypes.length > 0 && (
                <>
                  <Separator orientation="vertical" className="h-2.5" />
                  <span className="text-blue-600 text-xs font-bold">{selectedTypes.length}</span>
                </>
              )}
              <ChevronDown className="h-3 w-3 text-muted-foreground/50" />
            </button>
            
            {isTypeFilterOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsTypeFilterOpen(false)}
                />
                <div className="absolute top-full mt-2 left-0 z-50 bg-popover border rounded-lg shadow-lg p-3 min-w-[160px]">
                  <div className="space-y-2">
                    {(Object.keys(typeConfig) as TransactionType[]).map((type) => (
                      <label
                        key={type}
                        className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded-md"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(type)}
                          onChange={() => toggleType(type)}
                          className="rounded border-gray-300"
                        />
                        <Badge 
                          variant="secondary" 
                          className={typeConfig[type].color}
                        >
                          {typeConfig[type].label}
                        </Badge>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 状态筛选 */}
          <div className="relative">
            <button
              onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
              className={`!h-6 !min-h-6 text-xs font-bold rounded-full border shadow-none !px-2.5 !py-1 gap-2 inline-flex items-center w-auto hover:bg-accent ${
                selectedStatuses.length > 0 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                  : 'border-muted-foreground/20'
              }`}
            >
              <Filter className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground text-xs font-bold">状态</span>
              {selectedStatuses.length > 0 && (
                <>
                  <Separator orientation="vertical" className="h-2.5" />
                  <span className="text-blue-600 text-xs font-bold">{selectedStatuses.length}</span>
                </>
              )}
              <ChevronDown className="h-3 w-3 text-muted-foreground/50" />
            </button>
            
            {isStatusFilterOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsStatusFilterOpen(false)}
                />
                <div className="absolute top-full mt-2 left-0 z-50 bg-popover border rounded-lg shadow-lg p-3 min-w-[160px]">
                  <div className="space-y-2">
                    {(Object.keys(statusConfig) as TransactionStatus[]).map((status) => (
                      <label
                        key={status}
                        className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded-md"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStatuses.includes(status)}
                          onChange={() => toggleStatus(status)}
                          className="rounded border-gray-300"
                        />
                        <Badge 
                          variant="secondary"
                          className={statusConfig[status].color}
                        >
                          {statusConfig[status].label}
                        </Badge>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 时间范围筛选 */}
          <div className="relative">
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="!h-6 !min-h-6 text-xs font-bold rounded-full border border-muted-foreground/20 shadow-none !px-2.5 !py-1 gap-2 inline-flex items-center w-auto hover:bg-accent"
            >
              <span className="text-muted-foreground text-xs font-bold">时间区间</span>
              <Separator orientation="vertical" className="h-2.5" />
              <CalendarIcon className="h-3 w-3 text-muted-foreground" />
              <span className="text-blue-600 text-xs font-bold">
                {format(dateRange.from, "yyyy/MM/dd", { locale: zhCN })} → {format(dateRange.to, "yyyy/MM/dd", { locale: zhCN })}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground/50" />
            </button>
            
            {isCalendarOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsCalendarOpen(false)}
                />
                <div className="absolute top-full mt-2 left-0 z-50 bg-popover border rounded-lg shadow-lg flex">
                  {/* 左侧快速选择 */}
                  <div className="w-32 space-y-1 pt-7 px-3">
                    {quickSelections.map((selection) => (
                      <button
                        key={selection.label}
                        onClick={() => {
                          const range = selection.getValue()
                          setDateRange(range)
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs rounded-md hover:bg-accent transition-colors cursor-pointer"
                      >
                        {selection.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* 右侧日历 */}
                  <div className="p-4">
                    <Calendar
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setDateRange({ from: range.from, to: range.to })
                        }
                      }}
                      numberOfMonths={2}
                      locale={zhCN}
                    />
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCalendarOpen(false)}
                        className="h-8 text-xs"
                      >
                        取消
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setIsCalendarOpen(false)}
                        className="h-8 text-xs"
                      >
                        确定
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 清空筛选按钮 */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 px-2.5 text-xs font-bold rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              清空筛选
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          共 <span className="font-bold text-foreground">{filteredTransactions.length}</span> 条记录
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredStats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-none bg-muted overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground truncate">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color} truncate`}>
                {stat.amount}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 交易明细表格 */}
      <div className="w-full">
        <Card className="border-0 shadow-none bg-muted">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">交易明细</CardTitle>
          </CardHeader>
          <CardContent className="px-2 py-2">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap w-[180px]">订单名称</TableHead>
                    <TableHead className="whitespace-nowrap text-center w-[50px]">类型</TableHead>
                    <TableHead className="whitespace-nowrap text-center w-[150px]">订单金额</TableHead>
                    <TableHead className="whitespace-nowrap text-center w-[120px]">积分流向</TableHead>
                    <TableHead className="whitespace-nowrap text-center w-[160px]">订单号</TableHead>
                    <TableHead className="whitespace-nowrap text-center w-[160px]">商户订单号</TableHead>
                    <TableHead className="whitespace-nowrap text-center w-[180px]">订单时间</TableHead>
                    <TableHead className="whitespace-nowrap text-center w-[50px]">状态</TableHead>
                    <TableHead className="sticky right-0 whitespace-nowrap text-center bg-muted shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                        暂无符合条件的交易记录
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {transaction.name}
                        </TableCell>
                      <TableCell className="whitespace-nowrap text-center">
                        <Badge 
                          variant="secondary" 
                          className={typeConfig[transaction.type].color}
                        >
                          {typeConfig[transaction.type].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold whitespace-nowrap text-center">
                        ¥{transaction.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center cursor-pointer gap-1 justify-center">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={transaction.buyer.avatar} />
                                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                    {transaction.buyer.username.substring(0, 1)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="text-xs font-bold">⭢</div>
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={transaction.seller.avatar} />
                                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                    {transaction.seller.username.substring(0, 1)}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="p-3">
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs font-semibold">买家</p>
                                  <p className="text-xs">用户名: {transaction.buyer.username}</p>
                                  <p className="text-xs text-muted-foreground">{transaction.buyer.uid}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold">卖家</p>
                                  <p className="text-xs">用户名: {transaction.seller.username}</p>
                                  <p className="text-xs text-muted-foreground">{transaction.seller.uid}</p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap text-center">
                        {transaction.orderNo}
                      </TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap text-center">
                        {transaction.merchantOrderNo}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap text-center">
                        {transaction.time}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center">
                        <Badge 
                          variant="secondary"
                          className={statusConfig[transaction.status].color}
                        >
                          {statusConfig[transaction.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="sticky right-0 whitespace-nowrap text-center bg-muted shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]">
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
