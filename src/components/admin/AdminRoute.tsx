
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, profile, loading } = useAuth();

  console.log('AdminRoute - user:', user?.id, 'profile:', profile, 'loading:', loading);

  // Show loading while auth is loading OR while we have a user but no profile yet
  if (loading || (user && !profile)) {
    console.log('AdminRoute - Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    console.log('AdminRoute - No user, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  if (profile?.role !== 'admin') {
    console.log('AdminRoute - Profile role is not admin:', profile?.role, 'redirecting to /');
    return <Navigate to="/" replace />;
  }

  console.log('AdminRoute - Admin access granted!');
  return <>{children}</>;
}
