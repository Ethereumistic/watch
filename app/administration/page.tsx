"use client"

import { withAuth } from "@/components/auth/withAuth"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { BarChart, Users, Bot, Clock } from "lucide-react"
import Link from "next/link"

function AdministrationPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Administration</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Welcome to the central hub for managing and monitoring the platform.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/administration/analytics">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-6 w-6" />
                <span>Live Analytics</span>
              </CardTitle>
              <CardDescription>
                Monitor real-time matchmaking data and user activity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>View live Redis data, queue sizes, and match types.</p>
            </CardContent>
          </Card>
        </Link>
        {/* Add more links to other admin sections here in the future */}
      </div>
    </div>
  )
}

export default withAuth(AdministrationPage)(['admin']);
