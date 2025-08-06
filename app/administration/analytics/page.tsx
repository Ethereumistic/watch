"use client";

import { withAuth } from "@/components/auth/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Loader2, Users, Clock, ArrowRightLeft } from "lucide-react";
import { OnlineUsersView } from "@/components/admin/views/OnlineUsersView";
import { ActiveMatchesView } from "@/components/admin/views/ActiveMatchesView";
import { QueueBreakdown } from "@/components/admin/QueueBreakdown"; // Re-using this for the sidebar

// --- Types ---
interface LiveStats {
  onlineUsers: number;
  usersInQueue: number;
  activeMatches: number;
}

interface QueueInfo {
  name: string;
  count: number;
}

type ViewType = 'online-users' | 'users-in-queue' | 'active-matches' | 'queue-details';

// --- Main Component ---
function AnalyticsDashboard() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [queues, setQueues] = useState<QueueInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('online-users');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/analytics');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setStats(data.stats);
        setQueues(data.queues);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'online-users':
        return <OnlineUsersView />;
      case 'active-matches':
        return <ActiveMatchesView />;
      case 'users-in-queue':
        // For now, this will just show the queue breakdown component itself.
        // This can be expanded into its own detailed view later.
        return <QueueBreakdown queues={queues} />;
      default:
        return <OnlineUsersView />;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-2rem)]">
      {/* Sidebar */}
      <aside className="w-80 bg-gray-50 dark:bg-gray-800 border-r p-4 space-y-4">
        <h2 className="text-xl font-bold">Live Stats</h2>
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : error ? (
          <p className="text-red-500 text-xs">Failed to load stats.</p>
        ) : (
          <>
            {/* Stat Cards */}
            <Card className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setCurrentView('online-users')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Online Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats?.onlineUsers ?? 'N/A'}</div></CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setCurrentView('users-in-queue')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users in Queue</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats?.usersInQueue ?? 'N/A'}</div></CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setCurrentView('active-matches')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active P2P Matches</CardTitle>
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats?.activeMatches ?? 'N/A'}</div></CardContent>
            </Card>
            
            {/* Queue Breakdown in Sidebar */}
            <div className="pt-4">
                <QueueBreakdown queues={queues} />
            </div>
          </>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {renderView()}
      </main>
    </div>
  );
}

export default withAuth(AnalyticsDashboard)(['admin']);