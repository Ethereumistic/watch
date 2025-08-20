"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export function GlobalControlView() {
  const [isAuthEnabled, setIsAuthEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuthState = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("No active session found.");
        setIsAuthEnabled(true); // Default to enabled if no session
        return;
      }
      
      const response = await fetch('/api/admin/global-control/auth', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch auth state');
      const data = await response.json();
      setIsAuthEnabled(data.isAuthEnabled);
    } catch (error) {
      console.error("Failed to fetch auth state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthState();
  }, []);

  const handleToggleAuth = async (checked: boolean) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication session not found.");
      
      const response = await fetch('/api/admin/global-control/auth', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ isAuthEnabled: checked }),
      });
      if (!response.ok) throw new Error('Failed to update auth state');
      const data = await response.json();
      setIsAuthEnabled(data.isAuthEnabled);
    } catch (error) {
      console.error("Failed to update auth state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Global Controls</h2>
      <Card className="border-gray-800 bg-gray-950">
        <CardHeader>
          <CardTitle>WebSocket Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="auth-mode">Authentication Enabled</Label>
            <Switch
              id="auth-mode"
              checked={isAuthEnabled}
              onCheckedChange={handleToggleAuth}
              disabled={isLoading}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            When disabled, the backend will accept unauthenticated WebSocket connections. This is intended for stress testing purposes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
