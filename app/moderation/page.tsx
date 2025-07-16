"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, AlertTriangle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client" // Your client-side Supabase instance
import { withAuth } from "@/components/auth/withAuth" // Import the HOC

const supabase = createClient(); // FIX: Create the Supabase client instance

// Define a more detailed Report type that includes profile information
export interface ReportWithProfiles {
  id: string
  created_at: string
  status: "PENDING" | "REVIEWED" | "ACTION_TAKEN"
  evidence_url: string
  reported_ip: string
  // Joined data from the profiles table
  reporting_user: { username: string }
  reported_user: { username:string, times_reported: number }
}

function ModerationPage() {
  const [reports, setReports] = useState<ReportWithProfiles[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);
      
      // The query fetches reports and joins with profiles to get usernames
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          created_at,
          status,
          evidence_url,
          reported_ip,
          reporting_user:profiles!reports_reporting_user_id_fkey(username),
          reported_user:profiles!reports_reported_user_id_fkey(username, times_reported)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching reports:", error)
        setError("Failed to load reports. Please try again.")
      } else if (data) {
        // We need to cast the data because Supabase types can be complex
        setReports(data as unknown as ReportWithProfiles[]);
      }
      setIsLoading(false);
    }

    fetchReports();
  }, [])

  const filteredReports = reports.filter((report) => {
    const reportedUsername = report.reported_user?.username?.toLowerCase() || '';
    const matchesSearch =
      report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reportedUsername.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || report.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-500"
      case "REVIEWED": return "bg-blue-500"
      case "ACTION_TAKEN": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trust & Safety Dashboard</h1>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        <div className="w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by ID or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  <SelectItem value="ACTION_TAKEN">Action Taken</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {filteredReports.map((report) => (
                <Link key={report.id} href={`/moderation/${report.id}`}>
                  <Card className="cursor-pointer transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(report.status)}`} />
                          <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                            {report.id.slice(0, 8)}...
                          </span>
                        </div>
                        <Badge variant="destructive">
                          {report.reported_user?.times_reported || 0} Reports
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Reported: {report.reported_user?.username}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(report.created_at)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 p-6">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a Report</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a report from the sidebar to view details and take action.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Wrap the page with the HOC to protect it
export default withAuth(ModerationPage);
