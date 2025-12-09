"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, type MotionValue, type MotionStyle } from "motion/react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { LoginForm } from "@/components/auth/login-form"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Check, ShieldCheck, Globe, CreditCard, Zap } from "lucide-react"

import services from "@/lib/services"


/**
 * 登录页面组件
 * 显示登录表单和登录按钮
 * 
 * @example
 * ```tsx
 * <LoginPage />
 * ```
 * @returns {React.ReactNode} 登录页面组件
 */
export function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  /* 处理OAuth回调 */
  const [isProcessingCallback, setIsProcessingCallback] = useState(() => {
    const state = searchParams.get('state')
    const code = searchParams.get('code')
    return !!(state && code)
  })

  const [loginSuccess, setLoginSuccess] = useState(false)
  const [needsPayKeySetup, setNeedsPayKeySetup] = useState(false)

  const [payKey, setPayKey] = useState("")
  const [confirmPayKey, setConfirmPayKey] = useState("")
  const [isSubmittingPayKey, setIsSubmittingPayKey] = useState(false)
  const [setupStep, setSetupStep] = useState<'password' | 'confirm'>('password')

  const isPayKeyValid = payKey.length === 6 && /^\d{6}$/.test(payKey)
  const isConfirmValid = confirmPayKey.length === 6 && /^\d{6}$/.test(confirmPayKey)
  const passwordsMatch = payKey === confirmPayKey

  /* 支付密码输入 */
  const handlePayKeyChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    setPayKey(numericValue)
  }

  /* 鼠标视差效果 */
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  /* 弹簧物理效果 */
  const springConfig = { damping: 25, stiffness: 120 }
  const springX = useSpring(mouseX, springConfig)
  const springY = useSpring(mouseY, springConfig)

  /* 计算视差位移 */
  const moveX = useTransform(springX, [-0.5, 0.5], [-20, 20])
  const moveY = useTransform(springY, [-0.5, 0.5], [-20, 20])

  /* 聚光灯效果位置 */
  const spotlightX = useTransform(springX, [-0.5, 0.5], ["0%", "100%"])
  const spotlightY = useTransform(springY, [-0.5, 0.5], ["0%", "100%"])

  /* 鼠标移动 */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  /* 确认支付密码 */
  const handleConfirmPayKeyChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    setConfirmPayKey(numericValue)
  }

  /* 标语列表 */
  const slogans = [
    "体验社区最值得信赖的支付平台，享受无缝、安全、即时的交易。",
    "为社区交易赋能，打造面向未来的稳健、开源支付基础设施。",
    "让支付变得简单。零繁琐，最高安全标准，为社区量身定制。"
  ]

  const [currentSloganIndex, setCurrentSloganIndex] = useState(0)

  /* 标语切换 */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSloganIndex((prev) => (prev + 1) % slogans.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [slogans.length])

  /* 回调逻辑 */
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const state = searchParams.get('state')
      const code = searchParams.get('code')

      if (state && code) {
        setIsProcessingCallback(true)
        try {
          await services.auth.handleCallback({ state, code })

          const user = await services.auth.getUserInfo()

          if (!user.is_pay_key) {
            setNeedsPayKeySetup(true)
          } else {
            setLoginSuccess(true)
            toast.success("登录成功")

            const callbackUrl = searchParams.get('callbackUrl') || sessionStorage.getItem('redirect_after_login') || '/home'
            if (sessionStorage.getItem('redirect_after_login')) {
              sessionStorage.removeItem('redirect_after_login')
            }

            setTimeout(() => {
              router.replace(callbackUrl)
            }, 1500)
          }
        } catch (error) {
          console.error('OAuth callback error:', error)
          toast.error(error instanceof Error ? error.message : "登录失败，请重试")
          setIsProcessingCallback(false)
          router.replace('/login')
        }
      }
    }
    handleOAuthCallback()
  }, [searchParams, router])

  /* 支付密码设置 */
  const handlePayKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (setupStep === 'password') {
      if (!isPayKeyValid) {
        toast.error("支付密码必须为6位数字")
        return
      }
      setSetupStep('confirm')
    } else {
      if (!isConfirmValid) {
        toast.error("确认密码必须为6位数字")
        return
      }

      if (!passwordsMatch) {
        toast.error("两次输入的支付密码不一致")
        setSetupStep('password')
        setConfirmPayKey("")
        return
      }

      setIsSubmittingPayKey(true)
      try {
        await services.user.updatePayKey(payKey)
        toast.success("支付密码设置成功")
        setNeedsPayKeySetup(false)
        setLoginSuccess(true)
        setPayKey("")
        setConfirmPayKey("")
        setSetupStep('password')
        setTimeout(() => {
          const callbackUrl = searchParams.get('callbackUrl') || sessionStorage.getItem('redirect_after_login') || '/home'
          if (sessionStorage.getItem('redirect_after_login')) {
            sessionStorage.removeItem('redirect_after_login')
          }
          router.replace(callbackUrl)
        }, 1500)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "设置支付密码失败"
        toast.error(errorMessage)
        setSetupStep('password')
        setConfirmPayKey("")
      } finally {
        setIsSubmittingPayKey(false)
      }
    }
  }

  const renderPayKeySetup = (key: string) => (
    <motion.div
      key={key}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full space-y-8"
    >
      <div className="flex flex-col items-center gap-2 mb-4">
        <h3 className="text-2xl font-bold tracking-tight text-center">
          {setupStep === 'password' ? '设置支付密码' : '确认支付密码'}
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-[320px] mx-auto">
          {setupStep === 'password'
            ? '请设置6位数字支付密码，用于安全交易'
            : '请再次输入密码进行确认'}
        </p>
      </div>

      <form onSubmit={handlePayKeySubmit} className="space-y-8">
        <div className="flex justify-center">
          {setupStep === 'password' ? (
            <InputOTP
              maxLength={6}
              value={payKey}
              onChange={handlePayKeyChange}
              disabled={isSubmittingPayKey}
              autoFocus
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} className="w-12 h-12 text-lg border-zinc-200 dark:border-zinc-800" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          ) : (
            <div className="space-y-4">
              <InputOTP
                maxLength={6}
                value={confirmPayKey}
                onChange={handleConfirmPayKeyChange}
                disabled={isSubmittingPayKey}
                autoFocus
              >
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} className="w-12 h-12 text-lg border-zinc-200 dark:border-zinc-800" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {!passwordsMatch && confirmPayKey.length === 6 && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 text-center font-medium"
                >
                  两次输入的密码不一致
                </motion.p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4 mx-8">
          {setupStep === 'confirm' && (
            <Button
              type="button"
              size="lg"
              variant="secondary"
              onClick={() => {
                setSetupStep('password')
                setConfirmPayKey('')
              }}
              className="flex-1"
            >
              返回
            </Button>
          )}
          <Button
            type="submit"
            size="lg"
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-900/10"
            disabled={
              setupStep === 'password'
                ? !isPayKeyValid
                : isSubmittingPayKey || !isConfirmValid
            }
          >
            {isSubmittingPayKey && <Spinner className="mr-2" />}
            {setupStep === 'password' ? '继续' : '完成设置'}
          </Button>
        </div>
      </form>
    </motion.div>
  )

  return (
    <div className="w-full h-screen grid lg:grid-cols-2 overflow-hidden">
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        className="hidden lg:flex relative bg-[#0a2540] flex-col justify-between p-12 xl:px-24 2xl:px-32 text-white overflow-hidden group"
      >
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#0a2540]">

          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#635bff] opacity-40 blur-[100px]"
          />

          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              x: [0, -30, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#00d4ff] opacity-40 blur-[100px]"
          />

          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              x: [0, 40, 0],
              y: [0, -40, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 5
            }}
            className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-[#0048e5] opacity-40 blur-[120px]"
          />

          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-[40%] right-[10%] w-[400px] h-[400px] rounded-full bg-[#ff4b8b] opacity-20 blur-[120px]"
          />

          <div className="absolute inset-0 bg-gradient-to-tr from-[#0a2540]/80 via-transparent to-transparent z-10" />

          <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-20 mix-blend-overlay" />

          <motion.div
            className="absolute inset-0 bg-[radial-gradient(600px_at_var(--x)_var(--y),rgba(255,255,255,0.1),transparent_80%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 will-change-transform z-30"
            style={{
              "--x": spotlightX,
              "--y": spotlightY
            } as MotionStyle & { "--x": MotionValue<string>; "--y": MotionValue<string> }}
          />

          <motion.div
            className="absolute top-[20%] -right-[10%] z-20"
            style={{
              x: moveX,
              y: moveY,
            }}
          >
            <div className="relative w-[500px] h-[500px] flex items-center justify-center">
              <div className="absolute w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
              <div className="absolute w-16 h-16 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-[0_0_30px_rgba(59,130,246,0.3)] z-10" />

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute w-48 h-48 border border-white/10 border-dashed rounded-full"
              />

              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                className="absolute w-72 h-72 border border-white/5 border-dashed rounded-full opacity-50"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400/50 rounded-full blur-[2px]" />
              </motion.div>

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                className="absolute w-96 h-96 border border-indigo-500/10 rounded-full"
              >
                <div className="absolute top-1/2 -right-[2px] w-2 h-2 bg-white/20 rounded-full" />
                <div className="absolute bottom-1/2 -left-[2px] w-2 h-2 bg-white/20 rounded-full" />
              </motion.div>

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute w-[450px] h-[450px] border border-blue-400/5 rounded-full"
                style={{ rotateX: 60, rotateY: -12 }} // 3D tilt
              />
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-lg font-medium">
          <div className="flex items-center justify-center p-1 bg-white/10 rounded-md backdrop-blur-sm border border-white/10 shadow-inner">
            <CreditCard className="size-4" />
          </div>
          <span className="font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">LINUX DO PAY</span>
        </div>

        <div className="relative z-10 max-w-xl xl:max-w-2xl space-y-6 xl:space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-3xl sm:text-4xl xl:text-5xl 2xl:text-6xl font-bold tracking-tight mb-4 xl:mb-6">
              支付的未来，由此开启
            </h1>
            <div className="h-24 xl:h-32 relative">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentSloganIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="text-base xl:text-xl 2xl:text-2xl text-purple-100/90 font-light leading-relaxed absolute top-0 left-0 w-full"
                >
                  {slogans[currentSloganIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>

          <div className="flex gap-6 xl:gap-8 text-blue-200/80 pt-4 xl:pt-8 text-sm xl:text-base">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 xl:w-5 xl:h-5 text-indigo-400" />
              <span>全球覆盖</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 xl:w-5 xl:h-5 text-blue-400" />
              <span>安全支付</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 xl:w-5 xl:h-5 text-cyan-400" />
              <span>快速支付</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm xl:text-base text-blue-300/60">
          &copy; {new Date().getFullYear()} LINUX DO PAY. 版权所有
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-[400px] flex flex-col gap-6">

          <AnimatePresence mode="wait">
            {isProcessingCallback ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                {needsPayKeySetup ? (
                  renderPayKeySetup("oauth-pay-key-setup")
                ) : loginSuccess ? (
                  <div className="flex flex-col items-center justify-center space-y-6 py-10">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 ring-1 ring-green-500/20"
                    >
                      <Check className="w-8 h-8" strokeWidth={3} />
                    </motion.div>
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-semibold tracking-tight">登录成功</h3>
                      <p className="text-muted-foreground">正在跳转至控制台...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-8 py-10">
                    <div className="relative">
                      <Spinner className="w-12 h-12 text-zinc-900" />
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-zinc-200"
                        style={{ borderTopColor: 'transparent', width: '100%', height: '100%' }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-semibold tracking-tight">正在验证凭据</h3>
                      <p className="text-sm text-muted-foreground">请稍候，我们正在为您建立安全会话...</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="login-form-wrapper"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                <LoginForm />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  )
}
