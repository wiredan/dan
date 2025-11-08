import { useAuthStore } from '@/lib/authStore';
import { Navigate } from 'react-router-dom';
interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}
export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (user?.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}