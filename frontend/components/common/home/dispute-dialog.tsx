"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TransactionService } from "@/lib/services"
import type { Order } from "@/lib/services"
import { TransactionTableList } from "@/components/common/general/table-data"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"

const DISPUTE_PAGE_SIZE = 20

/**
 * 争议对话框模式
 */
type DisputeDialogMode = 'pending' | 'my-disputes'

/**
 * 争议对话框属性
 */
interface DisputeDialogProps {
  /** 对话框模式 */
  mode: DisputeDialogMode
  /** 是否打开 */
  open: boolean
  /** 打开状态变化回调 */
  onOpenChange: (open: boolean) => void
}

/**
 * 争议对话框组件
 * 支持两种模式：待处理的争议（商户）和我发起的争议（用户）
 */
export function DisputeDialog({ mode, open, onOpenChange }: DisputeDialogProps) {
  const [disputes, setDisputes] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)

  const totalPages = Math.ceil(total / DISPUTE_PAGE_SIZE)

  const fetchDisputes = useCallback(async (page: number = 1) => {
    try {
      setLoading(true)
      setError(null)

      let result
      let filteredOrders: Order[] = []

      if (mode === 'pending') {
        result = await TransactionService.getTransactions({
          page,
          page_size: DISPUTE_PAGE_SIZE,
          type: 'receive',
          status: 'disputing'
        })
        filteredOrders = result.orders
      } else {
        result = await TransactionService.getTransactions({
          page,
          page_size: DISPUTE_PAGE_SIZE,
          type: 'payment'
        })

        filteredOrders = result.orders.filter((order: Order) =>
          order.status === 'disputing' || order.status === 'refused' || order.status === 'refund'
        )
      }

      if (page === 1) {
        setDisputes(filteredOrders)
      } else {
        setDisputes(prev => [...prev, ...filteredOrders])
      }

      setTotal(result.total)
      setCurrentPage(page)
    } catch (err) {
      const error = err as Error
      setError(error)
      toast.error('获取争议数据失败', {
        description: error.message || '无法加载争议列表'
      })
    } finally {
      setLoading(false)
    }
  }, [mode])

  React.useEffect(() => {
    if (open) {
      fetchDisputes(1)
    } else {
      setDisputes([])
      setCurrentPage(1)
      setTotal(0)
      setError(null)
    }
  }, [open, fetchDisputes])

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      fetchDisputes(currentPage + 1)
    }
  }

  const handleRetry = () => {
    fetchDisputes(1)
  }

  const dialogTitle = mode === 'pending' ? '待处理的争议' : '我发起的争议'
  const dialogDescription = mode === 'pending'
    ? '您作为收款方，需要处理所有争议中的支付订单'
    : '您作为付款方发起的所有争议记录'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <TransactionTableList
            loading={loading}
            error={error}
            transactions={disputes}
            total={total}
            currentPage={currentPage}
            totalPages={totalPages}
            onRetry={handleRetry}
            onLoadMore={handleLoadMore}
            emptyIcon={AlertTriangle}
            emptyDescription={mode === 'pending' ? '暂无待处理的争议' : '暂无发起的争议'}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
