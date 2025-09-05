import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, Settings, BarChart3, Shield, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from '@/hooks/use-toast';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showAdminButton?: boolean;
}

const Layout = ({ children, title = "Dashboard", showAdminButton = false }: LayoutProps) => {
  const { user, signOut } = useAuth();
  const { 
    profile, 
    viewMode, 
    canSwitchRoles, 
    shouldShowAdminFeatures, 
    switchViewMode,
    loading: roleLoading 
  } = useUserRole();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully"
      });
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold text-foreground">Client Data Portal</h1>
              </div>
              {title !== "Dashboard" && (
                <Badge variant="outline">{title}</Badge>
              )}
              
              {/* Role/View Mode Indicator */}
              {!roleLoading && canSwitchRoles && (
                <Badge 
                  variant={viewMode === 'admin' ? 'default' : 'secondary'}
                  className="flex items-center gap-1"
                >
                  {viewMode === 'admin' ? (
                    <Shield className="h-3 w-3" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                  {viewMode === 'admin' ? 'Admin View' : 'Client View'}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Debug Info - временно за проверка */}
              <div className="text-xs text-muted-foreground">
                Loading: {roleLoading ? 'YES' : 'NO'} | 
                Can Switch: {canSwitchRoles ? 'YES' : 'NO'} | 
                Mode: {viewMode} |
                Profile: {profile?.role || 'none'}
              </div>

              {/* Role Switching */}
              {!roleLoading && canSwitchRoles && (
                <Select value={viewMode} onValueChange={(value: 'admin' | 'client') => switchViewMode(value)}>
                  <SelectTrigger className="w-32 bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border shadow-lg z-50">
                    <SelectItem value="admin" className="hover:bg-muted cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="client" className="hover:bg-muted cursor-pointer">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Client
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* User Info */}
              {user && (
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">
                    {profile?.full_name || user.email}
                  </div>
                  {profile?.full_name && (
                    <div className="text-xs text-muted-foreground">
                      {user.email}
                    </div>
                  )}
                </div>
              )}
              
              {/* Admin Button - only show in admin mode */}
              {shouldShowAdminFeatures() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>

              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;