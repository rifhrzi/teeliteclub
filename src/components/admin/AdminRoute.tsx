
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, profile, loading } = useAuth();

  logger.debug('AdminRoute access check', { 
    userId: user?.id, 
    userRole: profile?.role, 
    loading 
  });

  // Show loading while auth is loading OR while we have a user but no profile yet
  if (loading || (user && !profile)) {
    logger.debug('AdminRoute - Authentication still loading');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    logger.info('AdminRoute - Unauthorized access attempt, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  if (profile?.role !== 'admin') {
    logger.warn('AdminRoute - Non-admin user attempted admin access', { 
      userId: user.id, 
      userRole: profile?.role 
    });
    return <Navigate to="/" replace />;
  }

  logger.debug('AdminRoute - Admin access granted');
  return <>{children}</>;
}
