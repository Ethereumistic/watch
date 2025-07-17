"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/use-auth-store';
import { Loader2 } from 'lucide-react';

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const AuthComponent = (props: P) => {
    const router = useRouter();
    // 1. Get both the profile and the new isInitialized flag from the store.
    const { profile, isInitialized } = useAuthStore();

    // 2. This effect now waits for initialization before checking permissions.
    useEffect(() => {
      // Do nothing if the store is not yet initialized.
      if (!isInitialized) return;

      // Once initialized, check if the user is unauthorized and redirect if so.
      if (!profile || !['mod', 'admin'].includes(profile.role)) {
        router.replace('/');
      }
    }, [profile, isInitialized, router]);

    // 3. The render condition now also checks the isInitialized flag.
    // Show a loader if the state is initializing OR if the user is unauthorized (during redirect).
    if (!isInitialized || !profile || !['mod', 'admin'].includes(profile.role)) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p className="text-gray-600 dark:text-gray-400">Verifying access...</p>
          </div>
        </div>
      );
    }

    // 4. If initialized and authorized, render the actual component.
    return <WrappedComponent {...props} />;
  };

  AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthComponent;
}