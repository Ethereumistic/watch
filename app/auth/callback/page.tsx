"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/use-auth-store";
import { SettingsModal } from "@/components/watch/SettingsModal";
import { updateProfileSettings } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function AuthCallbackPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { profile, session, setProfile, isInitialized } = useAuthStore();
  const router = useRouter();

  // This effect will check if the profile is already complete and redirect if so.
  // Or it will automatically open the modal if the profile is incomplete.
  useEffect(() => {
    if (isInitialized && profile) {
      const isProfileComplete = !!profile.username && !!profile.dob && !!profile.gender;
      if (isProfileComplete) {
        // If profile is complete, no need to be here. Go to the main app.
        router.push('/watch');
      } else {
        // If profile is not complete, open the modal for the user.
        setIsSettingsOpen(true);
      }
    }
  }, [profile, isInitialized, router]);

  const handleSaveSettings = async (payload: any) => {
    if (!session?.user.id) {
      console.error("User not authenticated. Cannot save settings.");
      return;
    }
    const { data: updatedProfile, error } = await updateProfileSettings(session.user.id, payload);
    
    if (error) {
      console.error("Failed to save settings:", error);
      // Maybe show a toast notification here in a real app
    } else if (updatedProfile) {
      // On successful save, update the global state
      setProfile(updatedProfile);
      setIsSettingsOpen(false);
      // Redirect to the main watch page after successful setup
      router.push('/watch');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border border-white/20 text-white">
        <CardHeader className="items-center text-center">
          <CheckCircle className="h-16 w-16 text-green-400 mb-4" />
          <CardTitle className="text-2xl">Email Verified Successfully!</CardTitle>
          <CardDescription className="text-white/80">
            Your account is ready. Just one more step to personalize your experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6">
            Please complete your profile to start connecting with others.
          </p>
          <Button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            Complete Your Profile
          </Button>
        </CardContent>
      </Card>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen}
        onSave={handleSaveSettings}
        isInitialSetup={true} // This is always for initial setup
      />
    </div>
  );
}
