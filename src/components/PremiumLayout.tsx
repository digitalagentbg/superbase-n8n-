import React, { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { 
  LogOut, 
  Settings, 
  Bell, 
  Search, 
  Menu,
  Sun,
  Moon,
  ChevronDown,
  Building2,
  Users,
  BarChart3,
  Shield
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

interface PremiumLayoutProps {
  children: ReactNode;
  title?: string;
  showSearch?: boolean;
}

export function PremiumLayout({ children, title = "Enterprise Dashboard", showSearch = true }: PremiumLayoutProps) {
  const { user, signOut } = useAuth();
  const { profile, viewMode, switchViewMode, shouldShowAdminFeatures, canSwitchRoles } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
        variant: "default",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || "U";

  return (
    <div className="layout-premium">
      {/* Premium Header */}
      <header className="header-premium">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left Section - Logo & Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-glow">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                  <p className="text-xs text-muted-foreground">Professional Analytics Platform</p>
                </div>
              </div>
            </div>

            {/* Center Section - Search */}
            {showSearch && (
              <div className="hidden md:flex flex-1 max-w-md mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-10 bg-card/50 border-border/50 focus:bg-card focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* Right Section - Actions & User */}
            <div className="flex items-center space-x-4">
              {/* Navigation Buttons */}
              <div className="hidden sm:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="flex items-center space-x-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Dashboard</span>
                </Button>

                {/* Only show Admin panel for true admins - not viewers */}
                {(profile?.role === 'admin' || profile?.role === 'owner') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/admin")}
                    className="flex items-center space-x-2"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </Button>
                )}
              </div>

              {/* View Mode Switcher - only for true admins */}
              {(profile?.role === 'admin' || profile?.role === 'owner') && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span className="capitalize">{viewMode}</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => switchViewMode('admin')}
                      className={viewMode === 'admin' ? 'bg-accent' : ''}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Admin View
                      {viewMode === 'admin' && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => switchViewMode('client')}
                      className={viewMode === 'client' ? 'bg-accent' : ''}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Client View
                      {viewMode === 'client' && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse"></span>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-accent/50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu */}
              <Button variant="ghost" size="icon" className="sm:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full">
          {children}
        </div>
      </main>

      {/* Premium Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <p>© 2024 Enterprise Analytics Platform</p>
              <Badge variant="outline" className="text-xs">
                Premium Dashboard v2.0
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span>Status: </span>
              <Badge variant="outline" className="status-success">
                All Systems Operational
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}