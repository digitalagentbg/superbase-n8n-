import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

interface RoleProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  fallbackPath?: string;
}

const RoleProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  fallbackPath = '/dashboard' 
}: RoleProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  // Show loading while checking auth and roles
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    navigate('/auth');
    return null;
  }

  // Check admin requirements - more direct check
  if (requireAdmin && !isAdmin && !isOwner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Достъпът е отказан</h1>
          <p className="text-muted-foreground mb-6">
            Нямате права за достъп до тази страница. Моля превключете се към администраторски изглед.
          </p>
          <Button onClick={() => navigate(fallbackPath)}>
            Назад към dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;