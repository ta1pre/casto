"use client"

import { Home, Search, FileText, User, Settings } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/shared/lib/utils"

export const BOTTOM_NAV_HEIGHT = 64

const navItems = [
  { icon: Home, label: "ホーム", href: "/liff" },
  { icon: Search, label: "探す", href: "/liff/auditions" },
  { icon: FileText, label: "応募管理", href: "/liff/applications" },
  { icon: User, label: "プロフィール", href: "/liff/profile" },
  { icon: Settings, label: "設定", href: "/liff/settings" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-black text-white border-t border-border/40 z-[70] shadow-2xl"
      style={{
        height: BOTTOM_NAV_HEIGHT,
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
