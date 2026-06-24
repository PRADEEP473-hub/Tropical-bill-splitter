"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Anchor,
  LayoutDashboard,
  Receipt,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/expenses", label: "My Expenses", icon: Receipt },
  { href: "/dashboard/groups", label: "My Groups", icon: Users },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserEmail(user?.email ?? null)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F5F5DC]">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#003366] text-white">
        <div className="flex items-center gap-2">
          <Anchor size={22} className="text-[#40E0D0]" />
          <span className="font-heading font-bold text-lg">Voyage Splitter</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#003366] text-white px-4 pb-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-[#0077BE] text-white font-medium"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 w-full"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-[#003366] text-white p-6 min-h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-10 w-10 bg-[#0077BE] rounded-lg flex items-center justify-center text-[#40E0D0]">
            <Anchor size={24} />
          </div>
          <span className="font-heading font-bold text-lg">Voyage Splitter</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-[#0077BE] text-white font-medium shadow-md"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="pt-6 border-t border-white/20 space-y-3">
          {userEmail && (
            <p className="text-xs text-white/50 truncate font-mono">{userEmail}</p>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 w-full transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
