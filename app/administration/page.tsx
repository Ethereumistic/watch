"use client"

import { withAuth } from "@/components/auth/withAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OnlineUsersView } from "@/components/admin/views/OnlineUsersView"
import { ActiveMatchesView } from "@/components/admin/views/ActiveMatchesView"
import { QueueBreakdown } from "@/components/admin/QueueBreakdown"
import { BotManagementView } from "@/components/admin/views/BotManagementView" // Import the new component
import { GlobalControlView } from "@/components/admin/views/GlobalControlView" // Import the new component
import { useEffect, useState } from "react"
import { Loader2, Users, Clock, ArrowRightLeft, Home } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

// --- Types ---
interface LiveStats {
  onlineUsers: number
  usersInQueue: number
  activeMatches: number
}

interface QueueInfo {
  name: string
  count: number
}

// Allow for more specific view names like 'analytics-online-users'
type AdminView = string 

// --- Main Component ---
function AdministrationPage() {
  const [activeView, setActiveView] = useState<AdminView>('analytics-dashboard')

  const renderView = () => {
    // Analytics Sub-views
    if (activeView === 'analytics-dashboard') return <LiveAnalyticsDashboard />
    if (activeView === 'analytics-online-users') return <OnlineUsersView />
    if (activeView === 'analytics-active-matches') return <ActiveMatchesView />
    if (activeView === 'analytics-queue-breakdown') return <QueueBreakdownView />
    
    // New case for Bot Management
    if (activeView === 'bots') return <BotManagementView />
    
    // New case for Global Control
    if (activeView === 'global-control') return <GlobalControlView />


    // Add cases for other main views here
    switch (activeView) {
      case 'users':
        return <div>User Management Coming Soon</div>
      case 'reports':
        return <div>Reports Coming Soon</div>
      default:
        return <LiveAnalyticsDashboard />
    }
  }

  // Generate a user-friendly title from the activeView state
  const getPageTitle = (view: string) => {
    if (view.startsWith('analytics-')) {
      return `Live Analytics: ${view.split('-').slice(1).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}`;
    }
    return view.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <SidebarProvider>
        <AdminSidebar activeView={activeView} setActiveView={setActiveView} />
        <SidebarInset>
          <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b border-gray-800 bg-gray-950 px-6">
            <div className="flex-1">
              <h1 className="font-semibold text-lg text-white">
                {getPageTitle(activeView)}
              </h1>
            </div>
            <Link href="/watch">
              <Button variant="outline" size="sm" className="border-gray-700 bg-transparent hover:bg-gray-800 text-gray-200">
                <Home className="mr-2 h-4 w-4" />
                Back to App
              </Button>
            </Link>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            {renderView()}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

// --- Specific View Components ---

// New: A dashboard view just for the main statistics cards
const LiveAnalyticsDashboard = () => {
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/analytics')
        if (!response.ok) throw new Error(`API error: ${response.statusText}`)
        const data = await response.json()
        setStats(data.stats)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  if (error) {
    return <div className="text-red-500">Error loading analytics data: {error}</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-gray-800 bg-gray-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Online Users</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.onlineUsers ?? 'N/A'}</div>
          </CardContent>
        </Card>
        <Card className="border-gray-800 bg-gray-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Users in Queue</CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.usersInQueue ?? 'N/A'}</div>
          </CardContent>
        </Card>
        <Card className="border-gray-800 bg-gray-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Active P2P Matches</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.activeMatches ? stats.activeMatches / 2 : 'N/A'}</div>
          </CardContent>
        </Card>
      </div>
  )
}

// New: A wrapper for QueueBreakdown that fetches its own data
const QueueBreakdownView = () => {
  const [queues, setQueues] = useState<QueueInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/analytics')
        if (!response.ok) throw new Error(`API error: ${response.statusText}`)
        const data = await response.json()
        setQueues(data.queues)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  if (error) {
    return <div className="text-red-500">Error loading queue data: {error}</div>
  }

  // The original QueueBreakdown component is wrapped in a Card for consistent styling
  return (
     <Card className="border-gray-800 bg-gray-950">
        <CardContent className="p-0">
          <QueueBreakdown queues={queues} />
        </CardContent>
      </Card>
  )
}

export default withAuth(AdministrationPage)(['admin'])
