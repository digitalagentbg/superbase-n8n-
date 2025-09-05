import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogIn, BarChart3, Users, Shield, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Redirect authenticated users to dashboard
        if (session?.user) {
          navigate('/dashboard');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
              Client Data Portal
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Access your personalized dashboard with real-time data analytics, 
              processing history, and comprehensive reporting tools.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="flex items-center gap-2"
              >
                <LogIn className="h-5 w-5" />
                Get Started
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/dashboard')}
              >
                View Demo
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="px-4 py-2">
                <BarChart3 className="h-4 w-4 mr-2" />
                Real-time Analytics
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Shield className="h-4 w-4 mr-2" />
                Secure Access
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Database className="h-4 w-4 mr-2" />
                Data Processing
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Powerful Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to monitor and analyze your data processing workflows
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  <CardTitle>Interactive Dashboard</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Real-time KPI monitoring with success rates, processing times, 
                  and data volume analytics presented in beautiful charts and graphs.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-6 w-6 text-primary" />
                  <CardTitle>Processing History</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Complete audit trail of all data processing activities with 
                  detailed logs, status tracking, and error reporting.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  <CardTitle>Multi-Client Support</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Secure folder-based access control ensuring each client 
                  only sees their assigned data and projects.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  <CardTitle>Admin Panel</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Comprehensive administration tools for user management, 
                  project assignment, and access control configuration.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Export</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Export your data in multiple formats (CSV, JSON) with 
                  flexible filtering and date range selection options.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Responsive Design</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Modern, mobile-first design that works perfectly on all 
                  devices with dark/light mode support.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Access your personalized data dashboard and start monitoring your workflows today.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 mx-auto"
          >
            <LogIn className="h-5 w-5" />
            Sign In to Your Portal
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
