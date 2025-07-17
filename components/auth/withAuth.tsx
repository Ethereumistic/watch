"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/use-auth-store';
import { Loader2 } from 'lucide-react';

/**
 * This is a Higher-Order Component (HOC) for client components.
 * It checks if a user has the 'mod' or 'admin' role.
 * If authorized, it renders the wrapped component.
 * If not, it shows a loading screen while redirecting to the homepage.
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const AuthComponent = (props: P) => {
    const router = useRouter();
    // 1. Get the profile directly from the store. 'loading' is no longer needed.
    const { profile } = useAuthStore();

    // 2. This effect handles the redirection logic.
    // It runs when the profile state is available.
    useEffect(() => {
      // If there is no profile OR the user's role is not authorized, redirect.
      if (!profile || !['mod', 'admin'].includes(profile.role)) {
        router.replace('/');
      }
    }, [profile, router]);

    // 3. This condition now gate-keeps the component.
    // If the user is not authorized, we show a loader while the redirect from the useEffect happens.
    if (!profile || !['mod', 'admin'].includes(profile.role)) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p className="text-gray-600 dark:text-gray-400">Verifying access...</p>
          </div>
        </div>
      );
    }

    // 4. If the check passes, the user is authorized. Render the actual component.
    return <WrappedComponent {...props} />;
  };

  // Add a display name for better debugging in React DevTools
  AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthComponent;
}