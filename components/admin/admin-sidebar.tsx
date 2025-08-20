import { useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ShieldCheck, LayoutDashboard, Users, Bell, ChevronDown, Bot, Settings } from "lucide-react"
import Link from "next/link"

type AdminView = string // Changed to string to allow for more flexible view names like 'analytics-dashboard'

interface AdminSidebarProps {
  activeView: AdminView
  setActiveView: (view: AdminView) => void
}

const navigationItems = [
  {
    title: "Live Analytics",
    icon: LayoutDashboard,
    view: "analytics", // Base view name
    subItems: [
      { title: "Dashboard", view: "analytics-dashboard" },
      { title: "Online Users", view: "analytics-online-users" },
      { title: "Active P2P Matches", view: "analytics-active-matches" },
      { title: "Queue Breakdown", view: "analytics-queue-breakdown" },
    ],
  },
  {
    title: "Bot Management",
    icon: Bot,
    view: "bots",
  },
  {
    title: "Global Control", // New global control item
    icon: Settings,
    view: "global-control",
  },
  {
    title: "User Management",
    icon: Users,
    view: "users",
  },
  {
    title: "Reports",
    icon: Bell,
    view: "reports",
  },
]

export function AdminSidebar({ activeView, setActiveView }: AdminSidebarProps) {
  // State to track the open submenu, initialized to 'analytics'
  const [openMenu, setOpenMenu] = useState<string | null>('analytics')

  const handleMenuClick = (view: string, hasSubItems: boolean) => {
    if (hasSubItems) {
      setOpenMenu(openMenu === view ? null : view)
    } else {
      setActiveView(view)
    }
  }

  return (
    <Sidebar className="border-gray-800 bg-gray-950">
      <SidebarHeader className="border-b border-gray-800 px-6 py-4">
        <Link href="/administration" className="flex items-center gap-2 font-semibold text-white">
          <ShieldCheck className="h-6 w-6" />
          <span>Admin Panel</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-4 py-2">
        <SidebarMenu>
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.view}>
              <SidebarMenuButton
                onClick={() => handleMenuClick(item.view, !!item.subItems)}
                isActive={activeView.startsWith(item.view)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 transition-all hover:text-white ${
                  activeView.startsWith(item.view)
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </div>
                {item.subItems && (
                  <ChevronDown className={`h-4 w-4 transition-transform ${openMenu === item.view ? 'rotate-180' : ''}`} />
                )}
              </SidebarMenuButton>
              {item.subItems && openMenu === item.view && (
                <div className="mt-1 ml-4 border-l border-gray-700 pl-2">
                  {item.subItems.map(subItem => (
                    <SidebarMenuItem key={subItem.view}>
                      <SidebarMenuButton
                        onClick={() => setActiveView(subItem.view)}
                        isActive={activeView === subItem.view}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-white ${
                          activeView === subItem.view
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-500 hover:bg-gray-700'
                        }`}
                      >
                         {subItem.title}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </div>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
