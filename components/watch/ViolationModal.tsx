"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ShieldAlert, ShieldCheck } from "lucide-react"

interface ViolationModalProps {
  isOpen: boolean;
  level: number;
  banned_until: string | null;
  onAcknowledge?: () => void; // Optional callback for dismissing warnings
}

/**
 * A modal component to inform users about account warnings or bans.
 * For warnings (level 1), it's dismissible.
 * For bans (level 2 & 3), it's a non-dismissible overlay that blocks page access.
 */
export function ViolationModal({ isOpen, level, banned_until, onAcknowledge }: ViolationModalProps) {
  
  const isBanned = level === 2 || level === 3;
  
  const getTitle = () => {
    if (level === 1) return "Community Guideline Warning";
    if (level === 2) return "Account Temporarily Banned";
    if (level === 3) return "Account Permanently Banned";
    return "Account Status";
  };

  const getDescription = () => {
    if (level === 1) {
      return "Your account has received a warning for violating our community guidelines. Please review our terms of service. Further violations may result in a temporary or permanent ban.";
    }
    if (level === 2 && banned_until) {
      const banEndDate = new Date(banned_until).toLocaleString();
      return `Your account has been temporarily banned due to violations of our terms of service. You will be able to access the service again after ${banEndDate}.`;
    }
    if (level === 3) {
      return "Your account has been permanently banned due to severe or repeated violations of our terms of service. This action is final.";
    }
    return "";
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" hideCloseButton={isBanned}>
        <DialogHeader>
          <div className="flex flex-col items-center text-center">
            <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
            <DialogTitle className="text-2xl font-bold">{getTitle()}</DialogTitle>
            <DialogDescription className="mt-2 text-center px-4">
              {getDescription()}
            </DialogDescription>
          </div>
        </DialogHeader>
        {/* Only show the "I Understand" button for warnings */}
        {!isBanned && onAcknowledge && (
          <DialogFooter className="sm:justify-center">
            <Button type="button" onClick={onAcknowledge}>
              <ShieldCheck className="mr-2 h-4 w-4" /> I Understand
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
