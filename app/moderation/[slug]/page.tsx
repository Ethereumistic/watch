"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, User, MessageSquare, ImageIcon, Shield, AlertTriangle, Eye, Copy, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { withAuth } from "@/components/auth/withAuth"
import { Profile } from "@/stores/use-auth-store"

const supabase = createClient();

// This interface defines the structure of a report from your database.
interface Report {
  id: string
  created_at: string
  status: "PENDING" | "REVIEWED" | "ACTION_TAKEN"
  reporting_user_id: string
  reported_user_id: string
  chat_log: { messages: { id: string, text: string, isUser: boolean, timestamp: string }[] } | null
  evidence_url: string // This holds the PATH to the file, not a full URL
  reported_ip: string
}

function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.slug as string
  
  const [report, setReport] = useState<Report | null>(null)
  const [reportingProfile, setReportingProfile] = useState<Profile | null>(null)
  const [reportedProfile, setReportedProfile] = useState<Profile | null>(null)
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null); // State for the secure URL
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [status, setStatus] = useState<Report["status"] | "">("")
  const [actionNotes, setActionNotes] = useState("")
  const [selectedAction, setSelectedAction] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!reportId) return;

    const fetchReportAndProfiles = async () => {
      setIsLoading(true);
      setError(null);
      setSignedImageUrl(null); // Reset image URL on new report load

      // Step 1: Fetch the core report data
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (reportError || !reportData) {
        setError("Report not found or failed to load.");
        setIsLoading(false);
        return;
      }
      
      setReport(reportData as Report);
      setStatus(reportData.status);

      // Step 2: Fetch associated profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', [reportData.reporting_user_id, reportData.reported_user_id]);
      
      if (profilesData) {
        setReportingProfile(profilesData.find(p => p.id === reportData.reporting_user_id) as Profile || null);
        setReportedProfile(profilesData.find(p => p.id === reportData.reported_user_id) as Profile || null);
      }

      // FIX: Step 3: Invoke the new Edge Function to securely get the signed URL
      if (reportData.evidence_url) {
        const { data, error } = await supabase.functions.invoke('get-signed-evidence-url', {
          body: { filePath: reportData.evidence_url }
        });
        
        if (error) {
          console.error("Error invoking get-signed-evidence-url function:", error);
        } else {
          setSignedImageUrl(data.signedUrl);
        }
      }

      setIsLoading(false);
    };

    fetchReportAndProfiles();
  }, [reportId]);

  const handleTakeAction = async () => {
    if (!selectedAction || !report) return;
    setIsSubmitting(true);
    
    // In a real app, you would invoke a Supabase Edge Function here
    // to securely handle the moderation action and record it in the 'moderation_actions' table.
    console.log({
      reportId: report.id,
      action: selectedAction,
      notes: actionNotes,
      targetUserId: report.reported_user_id
    });
    
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    
    setStatus("ACTION_TAKEN");
    if(report) setReport({...report, status: "ACTION_TAKEN"});
    setIsSubmitting(false);
  }

  const copyReportLink = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (error || !report) {
    return <div className="flex h-screen w-full items-center justify-center text-red-500">{error || "Report not found."}</div>
  }

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
            <Button variant="outline" size="sm" onClick={copyReportLink}><Copy className="h-4 w-4 mr-2" />Copy Link</Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Evidence Screenshot</CardTitle></CardHeader>
              <CardContent>
                {/* Use the signedImageUrl state for the src */}
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
                        <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${message.isUser ? "bg-blue-100" : "bg-gray-100"}`}>
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
                <p><strong>Reporting User:</strong> {reportingProfile?.username || 'Unknown'} ({report.reporting_user_id.slice(0,8)}...)</p>
                <p><strong>Reported User:</strong> {reportedProfile?.username || 'Unknown'} ({report.reported_user_id.slice(0,8)}...)</p>
                <p><strong>Total Reports Against User:</strong> <Badge variant="destructive">{reportedProfile?.times_reported || 0}</Badge></p>
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
                    <SelectItem value="permanent_ban">Permanent Ban</SelectItem>
                    <SelectItem value="no_action">No Action Required</SelectItem>
                  </SelectContent>
                </Select>
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
