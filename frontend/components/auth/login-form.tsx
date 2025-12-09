"use client"

import { type ReactNode, useState } from "react"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { SquareArrowUpRight } from 'lucide-react';


import { cn } from "@/lib/utils"
import services from "@/lib/services"

type PolicySection = {
  value: string
  title: string
  content: ReactNode
}

const termsSections: PolicySection[] = [
  {
    value: "general",
    title: "1. 一般条款",
    content: (
      <div className="space-y-3 text-sm">
        <p>本服务条款（以下简称&quot;条款&quot;）规定了您使用 LINUX DO Pay 服务的条件。</p>
        <p>通过访问或使用我们的服务，您同意受这些条款的约束。如不同意，请立即停止使用。</p>
        <p>我们保留随时修改条款的权利，变更自发布起生效。</p>
      </div>
    ),
  },
  {
    value: "usage",
    title: "2. 使用规则",
    content: (
      <div className="space-y-3 text-sm">
        <p>您需以合法、负责的方式使用服务，并遵守中华人民共和国相关法律法规。</p>
        <p>禁止行为包括但不限于：</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>发布非法、有害、辱骂或其他令人反感的内容</li>
          <li>尝试未经授权访问系统或他人账户</li>
          <li>干扰、破坏服务的正常运行</li>
          <li>以任何方式违反适用法律法规</li>
        </ul>
      </div>
    ),
  },
  {
    value: "content",
    title: "3. 交易规范",
    content: (
      <div className="space-y-3 text-sm">
        <p>为维护平台安全与合规，禁止使用本平台进行以下交易或行为：</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>非法交易：包括但不限于洗钱、诈骗、赌博、色情服务等违法活动</li>
          <li>虚假交易：虚构交易、刷单、套现等虚假行为</li>
          <li>支持非法业务：为违反法律法规的业务提供支付服务</li>
          <li>侵犯他人权益：盗用他人账户、进行未授权交易等</li>
          <li>危害国家安全：支持恐怖主义、极端主义等危害国家安全的活动</li>
          <li>其他违反法律法规或平台规则的行为</li>
        </ul>
        <p>一经发现违规，我们将立即冻结相关账户并配合相关部门调查处理。</p>
      </div>
    ),
  },
  {
    value: "legal",
    title: "4. 法律合规",
    content: (
      <div className="space-y-3 text-sm">
        <p>我们严格遵守《网络安全法》《数据安全法》《个人信息保护法》等法律法规。</p>
        <p>用户亦须遵守上述法律法规及其他相关规定。</p>
        <p>若用户违法违规，我们将配合相关部门调查处理。</p>
      </div>
    ),
  },
  {
    value: "account",
    title: "5. 账户责任",
    content: (
      <div className="space-y-3 text-sm">
        <p>您负责维护账户信息的准确性与安全性。</p>
        <p>您需对账户下的所有活动承担责任。</p>
        <p>如发现未经授权的使用，请立即通知我们。</p>
      </div>
    ),
  },
  {
    value: "intellectual",
    title: "6. 知识产权",
    content: (
      <div className="space-y-3 text-sm">
        <p>服务内所有内容（文本、图形、图像、软件等）受版权及其他知识产权法保护。</p>
        <p>未经书面许可，您不得复制、修改、分发或以其他方式使用相关内容。</p>
      </div>
    ),
  },
  {
    value: "limitation",
    title: "7. 责任限制",
    content: (
      <div className="space-y-3 text-sm">
        <p>在法律允许的范围内，我们不对任何间接、偶然或后果性损害负责。</p>
        <p>我们承担的总责任不超过您在过去 12 个月为服务支付的金额。</p>
      </div>
    ),
  },
]

const privacySections: PolicySection[] = [
  {
    value: "collection",
    title: "1. 信息收集",
    content: (
      <div className="space-y-3 text-sm">
        <p>我们可能收集以下信息类型：</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>账户信息：通过 Linux Do OAuth 获取的公开信息</li>
          <li>使用数据：您如何使用我们的服务</li>
          <li>技术信息：IP、设备、浏览器类型等</li>
          <li>日志信息：服务器日志和错误报告</li>
        </ul>
      </div>
    ),
  },
  {
    value: "usage-info",
    title: "2. 信息使用",
    content: (
      <div className="space-y-3 text-sm">
        <p>信息主要用于：</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>提供与维护服务</li>
          <li>改善用户体验</li>
          <li>防止欺诈与滥用</li>
          <li>遵守法律义务</li>
          <li>向您发送必要通知</li>
        </ul>
      </div>
    ),
  },
  {
    value: "sharing",
    title: "3. 信息共享",
    content: (
      <div className="space-y-3 text-sm">
        <p>我们不会出售、交换或出租您的个人信息，除非：</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>获得您的明确同意</li>
          <li>法律法规或政府要求</li>
          <li>为保护我们的权利和财产</li>
          <li>与可信服务商协作且受保密协议约束</li>
        </ul>
      </div>
    ),
  },
  {
    value: "security",
    title: "4. 数据安全",
    content: (
      <div className="space-y-3 text-sm">
        <p>我们采用行业标准措施保护您的信息：</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>HTTPS/TLS 传输加密</li>
          <li>数据库访问控制与加密</li>
          <li>定期安全审计与漏洞扫描</li>
          <li>员工访问权限管理</li>
        </ul>
        <p>但请注意，任何传输或存储方式都无法保证 100% 安全。</p>
      </div>
    ),
  },
  {
    value: "retention",
    title: "5. 数据保留",
    content: (
      <div className="space-y-3 text-sm">
        <p>我们仅在必要期限内保留您的信息：</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>账户信息：账户存续期间</li>
          <li>使用日志：90 天</li>
          <li>安全日志：1 年</li>
        </ul>
        <p>您可随时申请删除账户及相关数据。</p>
      </div>
    ),
  },
  {
    value: "rights",
    title: "6. 您的权利",
    content: (
      <div className="space-y-3 text-sm">
        <p>您对个人信息拥有以下权利：</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>访问权：查看我们持有的您的信息</li>
          <li>更正权：更正不准确的信息</li>
          <li>删除权：要求删除个人信息</li>
          <li>限制处理权：限制我们处理您信息的方式</li>
        </ul>
      </div>
    ),
  },
]


/**
 * 登录表单组件
 * 显示登录表单和登录按钮
 * 
 * @example
 * ```tsx
 * <LoginForm />
 * ```
 * @param {React.ComponentProps<"div">} props - 组件属性
 * @param {string} className - 组件类名
 * @returns {React.ReactNode} 登录表单组件
 */
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)

  /* 处理登录 */
  const handleLogin = async () => {
    setIsLoading(true)
    try {
      await services.auth.initiateLogin()
    } catch (error) {
      setIsLoading(false)
      console.error('Login error:', error)
      const message = error instanceof Error ? error.message : "登录失败，请重试"
      toast.error(message, {
        duration: 5000,
        description: error instanceof Error && error.name === 'NetworkError'
          ? '请确认后端服务已启动'
          : undefined
      })
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-xl font-bold tracking-tight text-center">
          欢迎使用 LINUX DO PAY
        </h1>
      </div>

      <div className="grid gap-4 mx-4">
        <Button
          variant="default"
          type="button"
          className="w-full tracking-wide bg-blue-600 hover:bg-blue-700 text-white text-sm shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all active:scale-[0.98]"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? <Spinner className="mr-2" /> : <SquareArrowUpRight className="mr-2 h-4 w-4" />}
          {isLoading ? "正在跳转..." : "使用 LINUX DO 登录"}
        </Button>

      </div>

      <div className="text-muted-foreground text-center text-xs text-balance opacity-75 hover:opacity-100 transition-opacity">
        登录即代表您同意我们的{" "}
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="underline underline-offset-4 hover:text-foreground"
            >
              服务条款
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>服务条款</DialogTitle>
              <DialogDescription>请仔细阅读以下条款，使用本服务即表示您接受。</DialogDescription>
            </DialogHeader>
            <Accordion type="single" collapsible className="w-full">
              {termsSections.map((section) => (
                <AccordionItem key={section.value} value={section.value}>
                  <AccordionTrigger>{section.title}</AccordionTrigger>
                  <AccordionContent>{section.content}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </DialogContent>
        </Dialog>
        {" "}及{" "}
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="underline underline-offset-4 hover:text-foreground"
            >
              隐私政策
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>隐私政策</DialogTitle>
              <DialogDescription>我们重视您的隐私，以下说明信息如何收集与使用。</DialogDescription>
            </DialogHeader>
            <Accordion type="single" collapsible className="w-full">
              {privacySections.map((section) => (
                <AccordionItem key={section.value} value={section.value}>
                  <AccordionTrigger>{section.title}</AccordionTrigger>
                  <AccordionContent>{section.content}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </DialogContent>
        </Dialog>
        .
      </div>
    </div>
  )
}
