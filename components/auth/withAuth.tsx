"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/use-auth-store';
import { Loader2 } from 'lucide-react';

/**
 * A Higher-Order Component to protect routes based on user roles.
 * @param WrappedComponent - The component to wrap.
 * @returns A new component that can be further configured with allowed roles.
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  // Return a function that takes the allowed roles and returns the final component
  return function (allowedRoles: Array<string>) {
    const AuthComponent = (props: P) => {
      const router = useRouter();
      const { profile, isInitialized } = useAuthStore();

      useEffect(() => {
        if (!isInitialized) return;

        if (!profile || !allowedRoles.includes(profile.role)) {
          router.replace('/');
        }
      }, [profile, isInitialized, router]);

      if (!isInitialized || !profile || !allowedRoles.includes(profile.role)) {
        return (
          <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <p className="text-gray-600 dark:text-gray-400">Verifying access...</p>
            </div>
          </div>
        );
      }

      return <WrappedComponent {...props} />;
    };

    AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return AuthComponent;
  }
}