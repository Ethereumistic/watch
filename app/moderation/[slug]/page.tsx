"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ArrowLeft, User, MessageSquare, ImageIcon, Shield, AlertTriangle, Eye, Copy, Loader2, Mail, Calendar as CalendarIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { withAuth } from "@/components/auth/withAuth"
import { useAuthStore, Profile } from "@/stores/use-auth-store"
import { cn } from "@/lib/utils"

const supabase = createClient();

// This interface defines the structure of the data returned by our 'get-report-details' function
interface FullReport {
  id: string
  created_at: string
  status: "PENDING" | "REVIEWED" | "ACTION_TAKEN"
  chat_log: { messages: { id: string, text: string, isUser: boolean, timestamp: string }[] } | null
  evidence_url: string
  reported_ip: string
  reporting_user: { id: string, username: string | null, email?: string }
  reported_user: { 
    id: string, 
    username: string | null, 
    email?: string, 
    times_reported: number, 
    violation_level: number, 
    banned_until: string | null 
  }
}

// Helper component to render the violation status badge
const ViolationStatusBadge = ({ level, banned_until }: { level: number, banned_until: string | null }) => {
  const getBanDays = (untilDate: string | null) => {
    if (!untilDate) return '';
    const diff = new Date(untilDate).getTime() - new Date().getTime();
    if (diff <= 0) return 'Expired';
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `${days}d left`;
  }

  switch (level) {
    case 1:
      return <Badge className="bg-orange-500 text-white">Warned</Badge>;
    case 2:
      return <Badge className="bg-red-600 text-white">Banned ({getBanDays(banned_until)})</Badge>;
    case 3:
      return <Badge className="bg-red-800 text-white">Perma-banned</Badge>;
    default:
      return null;
  }
};


function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.slug as string
  
  const { profile: moderatorProfile } = useAuthStore();
  const [report, setReport] = useState<FullReport | null>(null)
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [status, setStatus] = useState<FullReport["status"] | "">("")
  const [actionNotes, setActionNotes] = useState("")
  const [selectedAction, setSelectedAction] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [banUntilDate, setBanUntilDate] = useState<Date | undefined>()

  useEffect(() => {
    if (!reportId) return;

    const fetchReportAndUrl = async () => {
      setIsLoading(true);
      setError(null);
      setSignedImageUrl(null); // Reset on new report load

      // 1. Fetch the main report details
      const { data: reportData, error: reportError } = await supabase.functions.invoke('get-report-details', { body: { reportId } });

      if (reportError || !reportData) {
        setError("Report not found or failed to load.");
        setIsLoading(false);
        return;
      }

      const fullReport = reportData as FullReport;
      setReport(fullReport);
      setStatus(fullReport.status);

      // 2. If the report has an evidence path, get the signed URL for it
      if (fullReport.evidence_url) {
        const { data: urlData, error: urlError } = await supabase.functions.invoke('get-signed-evidence-url', {
          body: { filePath: fullReport.evidence_url }
        });

        if (urlError) {
          console.error("Failed to get signed URL for evidence:", urlError);
          // Keep the report data but show an image error
        } else {
          setSignedImageUrl(urlData.signedUrl);
        }
      }
      
      setIsLoading(false);
    };

    fetchReportAndUrl();
  }, [reportId]);

  const handleTakeAction = async () => {
    if (!selectedAction || !report || !moderatorProfile) return;
    
    if (selectedAction === 'temp_ban_custom' && !banUntilDate) {
      alert("Please select a date for the custom ban.");
      return;
    }

    setIsSubmitting(true);

    if (selectedAction === 'no_action') {
      const { error } = await supabase.functions.invoke('dismiss-report', { body: { reportId: report.id, evidencePath: report.evidence_url } });
      if (error) alert("Error: Could not dismiss the report.");
      else {
        alert("Report dismissed successfully.");
        router.push('/moderation');
      }
      setIsSubmitting(false);
      return;
    }
    
    const { error: actionError } = await supabase.functions.invoke('take-moderation-action', {
      body: {
        reportId: report.id,
        targetUserId: report.reported_user.id,
        actionType: selectedAction,
        notes: actionNotes,
        moderatorId: moderatorProfile.id,
        bannedUntilTimestamp: selectedAction === 'temp_ban_custom' ? banUntilDate?.toISOString() : undefined
      }
    });

    if (actionError) {
      alert("Error: Could not process the moderation action.");
    } else {
      alert("Action taken successfully.");
      router.push('/moderation');
    }
    
    setIsSubmitting(false);
  }

  const copyToClipboard = (text: string) => {
    if (text) navigator.clipboard.writeText(text);
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  if (isLoading) return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  if (error || !report) return <div className="flex h-screen w-full items-center justify-center text-red-500">{error || "Report not found."}</div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Report #{report.id.slice(0, 8)}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Submitted {formatDate(report.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={status === 'ACTION_TAKEN' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{status.replace("_", " ")}</Badge>
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(window.location.href)}><Copy className="h-4 w-4 mr-2" />Copy Link</Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Evidence Screenshot</CardTitle></CardHeader>
              <CardContent>
                {signedImageUrl ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <img src={signedImageUrl} alt="Evidence" className="w-full rounded-lg border cursor-pointer"/>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <img src={signedImageUrl} alt="Evidence" className="w-full rounded-lg"/>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                    <p className="text-gray-500">No evidence image or failed to load.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Chat History</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {report.chat_log?.messages?.map((message) => (
                      <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${message.isUser ? "bg-green-500/50" : "bg-red-500/50"}`}>
                          <p>{message.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Report Details</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p><strong>Reported IP:</strong> <span className="font-mono">{report.reported_ip || 'N/A'}</span></p>
                <Separator />
                <p><strong>Reporting User:</strong> {report.reporting_user?.username || 'Unknown'}</p>
                <p className="flex items-center gap-2"><strong>Email:</strong> {report.reporting_user?.email || 'N/A'} <Copy className="h-3 w-3 cursor-pointer" onClick={() => copyToClipboard(report.reporting_user?.email || '')}/></p>
                <Separator />
                <div className="flex items-center justify-between">
                  <p><strong>Reported User:</strong> {report.reported_user?.username || 'Unknown'}</p>
                  <ViolationStatusBadge level={report.reported_user.violation_level} banned_until={report.reported_user.banned_until} />
                </div>
                <p className="flex items-center gap-2"><strong>Email:</strong> {report.reported_user?.email || 'N/A'} <Copy className="h-3 w-3 cursor-pointer" onClick={() => copyToClipboard(report.reported_user?.email || '')}/></p>
                <p><strong>Total Reports:</strong> <Badge variant="destructive">{report.reported_user?.times_reported || 0}</Badge></p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Moderation Actions</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger><SelectValue placeholder="Select action..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">Issue Warning</SelectItem>
                    <SelectItem value="temp_ban_24h">Temporary Ban (24h)</SelectItem>
                    <SelectItem value="temp_ban_custom">Custom Temporary Ban</SelectItem>
                    <SelectItem value="permanent_ban">Permanent Ban</SelectItem>
                    <SelectItem value="no_action">No Action Required</SelectItem>
                  </SelectContent>
                </Select>
                
                {selectedAction === 'temp_ban_custom' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !banUntilDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {banUntilDate ? format(banUntilDate, "PPP") : <span>Pick a ban end date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={banUntilDate}
                        onSelect={setBanUntilDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}

                <Textarea placeholder="Add internal notes..." value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} rows={3}/>
                <Button onClick={handleTakeAction} disabled={!selectedAction || isSubmitting} className="w-full" variant="destructive">
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</> : "Take Action"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default withAuth(ReportDetailPage);
