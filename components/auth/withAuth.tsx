"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/use-auth-store'; // Assuming you have this store
import { Loader2 } from 'lucide-react';

// This is a Higher-Order Component (HOC)
// It wraps other components to provide them with authentication and authorization logic.
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const AuthComponent = (props: P) => {
    const router = useRouter();
    const { profile, isLoading } = useAuthStore();

    useEffect(() => {
      // If the profile is done loading and there is no profile, redirect to login
    //   if (!isLoading && !profile) {
    //     router.replace('/login'); // Or your login page
    //   }
      
      // If the profile is loaded and the user is not a mod or admin, redirect them
      if (!isLoading && profile && !['mod', 'admin'].includes(profile.role)) {
        router.replace('/'); // Redirect to home page for unauthorized users
      }
    }, [profile, isLoading, router]);

    // While loading authentication state, show a loading spinner
    if (isLoading || !profile) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p className="text-gray-600 dark:text-gray-400">Verifying access...</p>
          </div>
        </div>
      );
    }

    // If the user has the correct role, render the component they were trying to access
    if (['mod', 'admin'].includes(profile.role)) {
      return <WrappedComponent {...props} />;
    }

    // Fallback for any other case (should not be reached often)
    return null;
  };

  return AuthComponent;
}
