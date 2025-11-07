"use client"

import * as React from "react"
import Link from "next/link"
import {
  BarChart3,
  Home,
  Receipt,
  CreditCard,
  Settings,
  HelpCircle,
  Wallet,
  FileText,
  Package,
} from "lucide-react"
import { AnimateIcon } from "@/components/animate-ui/icons/icon"
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left"
import { ChevronRight } from "@/components/animate-ui/icons/chevron-right"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

const data = {
  navMain: [
    {
      title: "首页",
      url: "/home",
      icon: Home,
      isActive: true,
    },
    {
      title: "交易",
      url: "/trade",
      icon: Package,
    },
    {
      title: "商户",
      url: "#",
      icon: Receipt,
    },
    {
      title: "余额",
      url: "#",
      icon: Wallet,
    },
  ],
  document: [
    {
      title: "接口文档",
      url: "#",
      icon: CreditCard,
    },
    {
      title: "使用文档",
      url: "#",
      icon: FileText,
    },
  ],
  products: [
    {
      title: "报表",
      url: "#",
      icon: BarChart3,
    },
  ],
  settings: [
    {
      title: "设置",
      url: "#",
      icon: Settings,
    },
    {
      title: "帮助",
      url: "#",
      icon: HelpCircle,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { toggleSidebar, state } = useSidebar()
  
  return (
    <Sidebar collapsible="icon" {...props} className="px-2 relative border-r border-border/40 group-data-[collapsible=icon]">
      <Button
        onClick={toggleSidebar}
        variant="ghost"
        size="icon"
        className="absolute top-1/2 -right-6 w-2 h-4 text-muted-foreground hover:bg-background"
      >
        {state === "expanded" ? (
          <AnimateIcon animateOnHover>
            <ChevronLeft className="size-6" />
          </AnimateIcon>
        ) : (
          <AnimateIcon animateOnHover>
            <ChevronRight className="size-6" />
          </AnimateIcon>
        )}
      </Button>
      
      <SidebarHeader className="py-4">
        <div className="flex items-center gap-2 px-1 h-12">
          <Avatar className="size-6 rounded group-data-[collapsible=icon]">
            <AvatarImage src="/avatars/user.jpg" alt="User" />
            <AvatarFallback className="rounded bg-muted text-sm">
              U
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-medium truncate">Username</span>
            <span className="text-[11px] font-medium text-muted-foreground/100 truncate">Trust Level 1</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="group-data-[collapsible=icon]">
        <SidebarGroup className="py-0">
          <SidebarGroupContent className="py-1">
            <SidebarMenu className="gap-1">
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    isActive={item.isActive}
                    asChild
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="py-0 pt-4">
          <SidebarGroupLabel className="text-xs font-normal text-muted-foreground">
            文档库
          </SidebarGroupLabel>
          <SidebarGroupContent className="py-1">
            <SidebarMenu className="gap-1">
              {data.document.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    asChild
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="py-0 pt-4">
          <SidebarGroupLabel className="text-xs font-normal text-muted-foreground">
            产品
          </SidebarGroupLabel>
          <SidebarGroupContent className="py-1">
            <SidebarMenu className="gap-1">
              {data.products.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    asChild
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto py-0 pb-2">
          <SidebarGroupContent className="py-1">
            <SidebarMenu className="gap-1">
              {data.settings.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    asChild
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
