import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FolderPlus, Settings, Upload, Shield, Database, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';
import RealDataManager from '@/components/RealDataManager';
import ProjectManager from '@/components/ProjectManager';
import { ExportManager } from '@/components/ExportManager';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  tenant_id: string;
  project_id: string | null;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
  external_id: string;
  tenant_id: string;
  created_at: string;
}

interface Tenant {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface MulchDocument {
  id: number;
  session_id: string;
  message: any;
  'mulch id': string;
}

interface Project {
  id: string;
  name: string;
  account_id: string;
  created_at: string;
}

const Admin = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [documents, setDocuments] = useState<Array<{id: number, content: string, metadata: any}>>([]);
  const [mulchDocuments, setMulchDocuments] = useState<MulchDocument[]>([]);
  const [allTables, setAllTables] = useState<{[key: string]: any[]}>({});
  const [loading, setLoading] = useState(true);

  // Role-based access control
  const { shouldShowAdminFeatures, viewMode, loading: roleLoading } = useUserRole();
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newTenantName, setNewTenantName] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<{[tenantId: string]: FileList | null}>({});

  useEffect(() => {
    fetchAdminData();
    
    // Само КРИТИЧНИТЕ таблици за real-time updates
    const criticalTables = ['profiles', 'project', 'execution'];
    
    const channels = criticalTables.map(tableName => {
      return supabase
        .channel(`admin-${tableName}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName
          },
          (payload) => {
            console.log(`${tableName} промяна:`, payload.eventType);
            // Debounced refresh само за важни промени
            setTimeout(() => fetchAdminData(), 1000);
          }
        )
        .subscribe();
    });

    return () => channels.forEach(ch => supabase.removeChannel(ch));
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      console.log('Fetching admin data...');
      
      const tableData: {[key: string]: any[]} = {};

      // Fetch each table individually to avoid TypeScript issues
      try {
        const { data } = await supabase.from('profiles').select('id, email, full_name, role, tenant_id, project_id, created_at').limit(100);
        tableData.profiles = data || [];
      } catch (err) { console.error('profiles error:', err); tableData.profiles = []; }

      try {
        const { data } = await supabase.from('project').select('*').limit(100);
        tableData.project = data || [];
      } catch (err) { console.error('project error:', err); tableData.project = []; }

      try {
        const { data } = await supabase.from('clients').select('*').limit(100);
        tableData.clients = data || [];
      } catch (err) { console.error('clients error:', err); tableData.clients = []; }

      try {
        const { data } = await supabase.from('tenants').select('*').limit(100);
        tableData.tenants = data || [];
      } catch (err) { console.error('tenants error:', err); tableData.tenants = []; }

      try {
        const { data } = await supabase.from('documents').select('*').limit(100);
        tableData.documents = data || [];
      } catch (err) { console.error('documents error:', err); tableData.documents = []; }

      try {
        const { data } = await supabase.from('mulchbg').select('*').limit(100);
        tableData.mulchbg = data || [];
      } catch (err) { console.error('mulchbg error:', err); tableData.mulchbg = []; }

      try {
        const { data } = await supabase.from('account').select('*').limit(100);
        tableData.account = data || [];
      } catch (err) { console.error('account error:', err); tableData.account = []; }

      try {
        const { data } = await supabase.from('api_configs').select('*').limit(100);
        tableData.api_configs = data || [];
      } catch (err) { console.error('api_configs error:', err); tableData.api_configs = []; }

      try {
        const { data } = await supabase.from('api_executions').select('*').limit(100);
        tableData.api_executions = data || [];
      } catch (err) { console.error('api_executions error:', err); tableData.api_executions = []; }

      try {
        const { data } = await supabase.from('chat_conversation').select('*').limit(100);
        tableData.chat_conversation = data || [];
      } catch (err) { console.error('chat_conversation error:', err); tableData.chat_conversation = []; }

      try {
        const { data } = await supabase.from('chat_message').select('*').limit(100);
        tableData.chat_message = data || [];
      } catch (err) { console.error('chat_message error:', err); tableData.chat_message = []; }

      try {
        const { data } = await supabase.from('client_connectors').select('*').limit(100);
        tableData.client_connectors = data || [];
      } catch (err) { console.error('client_connectors error:', err); tableData.client_connectors = []; }

      try {
        const { data } = await supabase.from('client_workflows').select('*').limit(100);
        tableData.client_workflows = data || [];
      } catch (err) { console.error('client_workflows error:', err); tableData.client_workflows = []; }

      try {
        const { data } = await supabase.from('execution').select('*').limit(100);
        tableData.execution = data || [];
      } catch (err) { console.error('execution error:', err); tableData.execution = []; }

      try {
        const { data } = await supabase.from('executions').select('*').limit(100);
        tableData.executions = data || [];
      } catch (err) { console.error('executions error:', err); tableData.executions = []; }

      try {
        const { data } = await supabase.from('incidents').select('*').limit(100);
        tableData.incidents = data || [];
      } catch (err) { console.error('incidents error:', err); tableData.incidents = []; }

      try {
        const { data } = await supabase.from('n8n_chat_histories').select('*').limit(100);
        tableData.n8n_chat_histories = data || [];
      } catch (err) { console.error('n8n_chat_histories error:', err); tableData.n8n_chat_histories = []; }

      try {
        const { data } = await supabase.from('project').select('*').limit(100);
        tableData.project = data || [];
      } catch (err) { console.error('project error:', err); tableData.project = []; }

      try {
        const { data } = await supabase.from('user_profile').select('*').limit(100);
        tableData.user_profile = data || [];
      } catch (err) { console.error('user_profile error:', err); tableData.user_profile = []; }

      try {
        const { data } = await supabase.from('webhooks').select('*').limit(100);
        tableData.webhooks = data || [];
      } catch (err) { console.error('webhooks error:', err); tableData.webhooks = []; }

      // Set individual states for compatibility
      setProfiles(tableData.profiles || []);
      setClients(tableData.clients || []);
      setTenants(tableData.tenants || []);
      setProjects(tableData.project || []);
      setDocuments(tableData.documents || []);
      setMulchDocuments(tableData.mulchbg || []);
      
      // Set all tables data
      setAllTables(tableData);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenantName.trim()) {
      toast({
        title: "Грешка",
        description: "Моля въведете име на папката",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('tenants')
        .insert([{ name: newTenantName.trim() }]);

      if (error) throw error;

      toast({
        title: "Успех",
        description: `Папката "${newTenantName}" е създадена успешно`
      });

      setNewTenantName('');
      fetchAdminData();
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast({
        title: "Грешка",
        description: "Неуспешно създаване на папката",
        variant: "destructive"
      });
    }
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      toast({
        title: "Error",
        description: "Client name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get current user's tenant_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('clients')
        .insert({
          name: newClientName,
          external_id: newClientEmail,
          tenant_id: profile.tenant_id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client created successfully"
      });

      setNewClientName('');
      setNewClientEmail('');
      fetchAdminData();
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: "Failed to create client",
        variant: "destructive"
      });
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('user_profile')
        .select('account_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('project')
        .insert({
          name: newProjectName,
          account_id: profile.account_id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project created successfully"
      });

      setNewProjectName('');
      fetchAdminData();
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
    }
  };

  const handleAssignProject = async (profileId: string, projectId: string) => {
    try {
      const assignedProject = projectId === 'unassigned' ? null : projectId;
      const { error } = await supabase
        .from('profiles')
        .update({ project_id: assignedProject })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Успех",
        description: "Потребителят е назначен успешно към проекта"
      });

      fetchAdminData();
    } catch (error) {
      console.error('Error assigning project:', error);
      toast({
        title: "Грешка",
        description: "Неуспешно назначение към проекта",
        variant: "destructive"
      });
    }
  };

  const handleAssignTenant = async (profileId: string, tenantId: string) => {
    try {
      const assignedTenant = tenantId === 'unassigned' ? null : tenantId;
      const { error } = await supabase
        .from('profiles')
        .update({ tenant_id: assignedTenant })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Успех",
        description: "Потребителят е назначен успешно към папката"
      });

      fetchAdminData();
    } catch (error) {
      console.error('Error assigning tenant:', error);
      toast({
        title: "Грешка",
        description: "Неуспешно назначение към папката",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (tenantId: string, files: FileList) => {
    if (!files || files.length === 0) return;

    setUploadingFiles(prev => new Set(prev).add(tenantId));

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileName = `${tenantId}/${Date.now()}-${file.name}`;
        
        const { error } = await supabase.storage
          .from('tenant-documents')
          .upload(fileName, file);

        if (error) throw error;
        return fileName;
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Успех",
        description: `Качени са ${files.length} файла успешно`
      });

      // Clear selected files
      setSelectedFiles(prev => ({ ...prev, [tenantId]: null }));
      
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Грешка",
        description: "Неуспешно качване на файловете",
        variant: "destructive"
      });
    } finally {
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(tenantId);
        return newSet;
      });
    }
  };

  const handleFileSelect = (tenantId: string, files: FileList | null) => {
    setSelectedFiles(prev => ({ ...prev, [tenantId]: files }));
  };


  const handleUpdateUserRole = async (profileId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully"
      });

      fetchAdminData();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid gap-6">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prevent access if not in admin mode
  if (!shouldShowAdminFeatures()) {
    return (
      <ProtectedRoute>
        <Layout title="Access Denied">
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="max-w-md mx-auto text-center p-6">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Достъпът е отказан</h1>
              <p className="text-muted-foreground mb-6">
                Нямате права за достъп до админ панела. Моля превключете се към администраторски изглед или се свържете с администратор.
              </p>
              <Button onClick={() => window.history.back()}>
                Назад към dashboard
              </Button>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <RoleProtectedRoute requireAdmin={true}>
        <Layout title="Admin Panel">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Role indicator for admin view */}
            {viewMode === 'admin' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Shield className="h-4 w-4" />
                <span>Администраторски изглед активен</span>
              </div>
            )}

        <Tabs defaultValue="real-data" className="space-y-6">
          <TabsList className="grid w-full grid-cols-10 h-auto flex-wrap">
            <TabsTrigger value="real-data" className="text-xs px-3 py-2">Реални данни</TabsTrigger>
            <TabsTrigger value="projects" className="text-xs px-3 py-2">Проекти</TabsTrigger>
            <TabsTrigger value="folders" className="text-xs px-3 py-2">Папки</TabsTrigger>
            <TabsTrigger value="clients" className="text-xs px-3 py-2">Клиенти</TabsTrigger>
            <TabsTrigger value="users" className="text-xs px-3 py-2">Потребители</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs px-3 py-2">Документи</TabsTrigger>
            <TabsTrigger value="all-tables" className="text-xs px-3 py-2">Всички таблици</TabsTrigger>
            <TabsTrigger value="executions" className="text-xs px-3 py-2">Изпълнения</TabsTrigger>
            <TabsTrigger value="chat" className="text-xs px-3 py-2">Чат</TabsTrigger>
            <TabsTrigger value="system" className="text-xs px-3 py-2">Система</TabsTrigger>
          </TabsList>

          {/* Real Data Management */}
          <TabsContent value="real-data" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Управление на реални данни</h2>
              <p className="text-muted-foreground">
                Създавайте реални проекти и добавяйте реална информация вместо демо данни.
                Всички нови данни ще се покажат веднага в Client Data Portal.
              </p>
            </div>
            <RealDataManager 
              projects={projects} 
              onProjectsUpdate={fetchAdminData}
            />
          </TabsContent>

          {/* Project Management */}
          <TabsContent value="projects" className="space-y-6">
            <ProjectManager />
          </TabsContent>

          {/* Client Management */}
          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Client Management
                    </CardTitle>
                    <CardDescription>Create and manage client accounts</CardDescription>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>Add New Client</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Client</DialogTitle>
                        <DialogDescription>Add a new client to the system</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="clientName">Client Name</Label>
                          <Input
                            id="clientName"
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            placeholder="Enter client name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="clientEmail">External ID/Email</Label>
                          <Input
                            id="clientEmail"
                            value={newClientEmail}
                            onChange={(e) => setNewClientEmail(e.target.value)}
                            placeholder="Enter external ID or email"
                          />
                        </div>
                        <Button onClick={handleCreateClient} className="w-full">
                          Create Client
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>External ID</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.external_id || 'N/A'}</TableCell>
                        <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Folder Management */}
          <TabsContent value="folders" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Create New Folder */}
              <Card>
                <CardHeader>
                  <CardTitle>Създай нова папка</CardTitle>
                  <CardDescription>Добави нова папка за организиране на клиентите</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Input
                      placeholder="Име на новата папка (напр. mulchbg)"
                      value={newTenantName}
                      onChange={(e) => setNewTenantName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateTenant()}
                    />
                    <Button onClick={handleCreateTenant} className="whitespace-nowrap">
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Създай
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Folder Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Статистика на папките</CardTitle>
                  <CardDescription>Преглед на всички папки и техните потребители</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tenants.map((tenant) => {
                      const usersInTenant = profiles.filter(p => p.tenant_id === tenant.id).length;
                      const clientsInTenant = clients.filter(c => c.tenant_id === tenant.id).length;
                      return (
                        <div key={tenant.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{tenant.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {usersInTenant} потребители, {clientsInTenant} клиенти
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={usersInTenant > 0 ? "default" : "secondary"}>
                              {usersInTenant === 0 ? "Празна" : "Активна"}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Folders Table */}
            <Card>
              <CardHeader>
                <CardTitle>Всички папки</CardTitle>
                <CardDescription>Подробна информация за всяка папка</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Име на папката</TableHead>
                      <TableHead>Потребители</TableHead>
                      <TableHead>Клиенти</TableHead>
                      <TableHead>Създадена на</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((tenant) => {
                      const usersInTenant = profiles.filter(p => p.tenant_id === tenant.id);
                      const clientsInTenant = clients.filter(c => c.tenant_id === tenant.id);
                      return (
                        <TableRow key={tenant.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="font-medium">{tenant.name}</div>
                              <Badge variant={usersInTenant.length > 0 ? "default" : "secondary"} className="text-xs">
                                {usersInTenant.length === 0 ? "Празна" : `${usersInTenant.length} потр.`}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">{tenant.id}</div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {usersInTenant.map(user => (
                                <div key={user.id} className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {user.role}
                                  </Badge>
                                  <span className="text-sm">{user.full_name || user.email}</span>
                                </div>
                              ))}
                              {usersInTenant.length === 0 && (
                                <span className="text-sm text-muted-foreground">Няма потребители</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {clientsInTenant.map(client => (
                                <div key={client.id} className="text-sm">
                                  {client.name}
                                </div>
                              ))}
                              {clientsInTenant.length === 0 && (
                                <span className="text-sm text-muted-foreground">Няма клиенти</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(tenant.created_at).toLocaleDateString('bg-BG')}</TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              <Button variant="outline" size="sm" className="whitespace-nowrap">
                                Редактирай
                              </Button>
                              
                              <div className="flex gap-1">
                                <input
                                  type="file"
                                  multiple
                                  id={`file-upload-${tenant.id}`}
                                  className="hidden"
                                  onChange={(e) => handleFileSelect(tenant.id, e.target.files)}
                                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                                />
                                <Button
                                  variant="outline" 
                                  size="sm" 
                                  className="whitespace-nowrap"
                                  onClick={() => document.getElementById(`file-upload-${tenant.id}`)?.click()}
                                  disabled={uploadingFiles.has(tenant.id)}
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  {uploadingFiles.has(tenant.id) ? "Качва..." : "Избери"}
                                </Button>
                                
                                {selectedFiles[tenant.id] && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleFileUpload(tenant.id, selectedFiles[tenant.id]!)}
                                    disabled={uploadingFiles.has(tenant.id)}
                                    className="whitespace-nowrap"
                                  >
                                    Качи ({selectedFiles[tenant.id]!.length})
                                  </Button>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Документи от mulchbg</CardTitle>
                <CardDescription>Всички чат съобщения и данни от mulchbg таблицата</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Session ID</TableHead>
                      <TableHead>Тип съобщение</TableHead>
                      <TableHead>Съдържание</TableHead>
                      <TableHead>Източник</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mulchDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="text-muted-foreground">
                            Няма данни в mulchbg таблицата
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      mulchDocuments.map((doc) => {
                        const message = doc.message || {};
                        const messageType = message.type || 'unknown';
                        const content = message.content || 'N/A';
                        const source = doc['mulch id'] || 'N/A';
                        
                        return (
                          <TableRow key={doc.id}>
                            <TableCell className="font-mono text-xs">{doc.id}</TableCell>
                            <TableCell className="font-mono text-xs max-w-32 truncate">
                              {doc.session_id}
                            </TableCell>
                            <TableCell>
                              <Badge variant={messageType === 'human' ? 'default' : 'secondary'}>
                                {messageType}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-64 truncate">
                              {typeof content === 'string' ? content : JSON.stringify(content)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {source}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    Виж
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Детайли на съобщението #{doc.id}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Session ID:</Label>
                                      <div className="font-mono text-sm bg-muted p-2 rounded">
                                        {doc.session_id}
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Пълно съобщение:</Label>
                                      <div className="bg-muted p-3 rounded text-sm max-h-64 overflow-y-auto">
                                        <pre className="whitespace-pre-wrap">
                                          {JSON.stringify(message, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                     <CardTitle className="flex items-center gap-2">
                       <FolderPlus className="h-5 w-5" />
                       Управление на папки (Legacy)
                     </CardTitle>
                     <CardDescription>Стари папки от проектната система</CardDescription>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>Create Project</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                        <DialogDescription>Add a new project folder</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="projectName">Project Name</Label>
                          <Input
                            id="projectName"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Enter project name"
                          />
                        </div>
                        <Button onClick={handleCreateProject} className="w-full">
                          Create Project
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Tenant ID</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell className="font-mono text-xs">{tenant.id}</TableCell>
                        <TableCell>{new Date(tenant.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button variant="outline" size="sm">
                              <Upload className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>Manage user roles and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Assigned Folder</TableHead>
                      <TableHead>Assigned Project</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.full_name || 'N/A'}</TableCell>
                        <TableCell>{profile.email}</TableCell>
                        <TableCell>
                          <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                            {profile.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={profile.tenant_id || 'unassigned'}
                            onValueChange={(value) => handleAssignTenant(profile.id, value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Select folder" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Без назначение</SelectItem>
                              {tenants.map(tenant => (
                                <SelectItem key={tenant.id} value={tenant.id}>
                                  {tenant.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={profile.project_id || 'unassigned'}
                            onValueChange={(value) => handleAssignProject(profile.id, value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Без назначение</SelectItem>
                              {projects.map(project => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={profile.role}
                            onValueChange={(value) => handleUpdateUserRole(profile.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="operator">Operator</SelectItem>
                              <SelectItem value="viewer">Client</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
            {/* All Tables */}
            <TabsContent value="all-tables" className="space-y-6">
              <div className="grid gap-6">
                {Object.entries(allTables).map(([tableName, tableData]) => (
                  <Card key={tableName}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{tableName} ({tableData.length} записа)</span>
                        <Badge variant="outline">{tableData.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tableData.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {Object.keys(tableData[0]).slice(0, 6).map((key) => (
                                  <TableHead key={key}>{key}</TableHead>
                                ))}
                                {Object.keys(tableData[0]).length > 6 && <TableHead>...</TableHead>}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tableData.slice(0, 10).map((row, index) => (
                                <TableRow key={index}>
                                  {Object.entries(row).slice(0, 6).map(([key, value]) => (
                                    <TableCell key={key} className="max-w-xs truncate">
                                      {typeof value === 'object' && value !== null
                                        ? JSON.stringify(value).substring(0, 50) + '...'
                                        : String(value || 'N/A').substring(0, 50)
                                      }
                                    </TableCell>
                                  ))}
                                  {Object.keys(row).length > 6 && (
                                    <TableCell>
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button variant="outline" size="sm">View All</Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                          <DialogHeader>
                                            <DialogTitle>{tableName} - Запис #{index + 1}</DialogTitle>
                                          </DialogHeader>
                                          <div className="space-y-4">
                                            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                                              {JSON.stringify(row, null, 2)}
                                            </pre>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {tableData.length > 10 && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Показани са първите 10 от {tableData.length} записа
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Няма данни в тази таблица</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Executions */}
            <TabsContent value="executions" className="space-y-6">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Execution Logs</CardTitle>
                    <CardDescription>История на изпълненията</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {allTables.execution?.length > 0 || allTables.executions?.length > 0 ? (
                      <div className="space-y-6">
                        {allTables.execution?.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Execution таблица ({allTables.execution.length})</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>ID</TableHead>
                                  <TableHead>Workflow</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Started</TableHead>
                                  <TableHead>Duration (ms)</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {allTables.execution.slice(0, 10).map((exec: any) => (
                                  <TableRow key={exec.id}>
                                    <TableCell>{exec.id}</TableCell>
                                    <TableCell>{exec.workflow_name}</TableCell>
                                    <TableCell>
                                      <Badge variant={exec.status === 'success' ? 'default' : 'destructive'}>
                                        {exec.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(exec.started_at).toLocaleString()}</TableCell>
                                    <TableCell>{exec.duration_ms || 'N/A'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                        
                        {allTables.executions?.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Executions таблица ({allTables.executions.length})</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>ID</TableHead>
                                  <TableHead>Workflow</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Created</TableHead>
                                  <TableHead>Duration (ms)</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {allTables.executions.slice(0, 10).map((exec: any) => (
                                  <TableRow key={exec.id}>
                                    <TableCell>{exec.id}</TableCell>
                                    <TableCell>{exec.workflow_name}</TableCell>
                                    <TableCell>
                                      <Badge variant={exec.status === 'success' ? 'default' : 'destructive'}>
                                        {exec.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(exec.created_at).toLocaleString()}</TableCell>
                                    <TableCell>{exec.duration_ms || 'N/A'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Няма данни за изпълнения</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Chat */}
            <TabsContent value="chat" className="space-y-6">
              <div className="grid gap-6">
                {(allTables.chat_conversation?.length > 0 || allTables.chat_message?.length > 0 || allTables.n8n_chat_histories?.length > 0) && (
                  <>
                    {allTables.chat_conversation?.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Chat Conversations ({allTables.chat_conversation.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Created</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {allTables.chat_conversation.slice(0, 10).map((conv: any) => (
                                <TableRow key={conv.id}>
                                  <TableCell>{conv.id}</TableCell>
                                  <TableCell>{conv.title || 'Untitled'}</TableCell>
                                  <TableCell>{new Date(conv.created_at).toLocaleString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}

                    {allTables.chat_message?.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Chat Messages ({allTables.chat_message.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Content Preview</TableHead>
                                <TableHead>Created</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {allTables.chat_message.slice(0, 10).map((msg: any) => (
                                <TableRow key={msg.id}>
                                  <TableCell>{msg.id}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{msg.role}</Badge>
                                  </TableCell>
                                  <TableCell className="max-w-xs truncate">
                                    {String(msg.content).substring(0, 100) + '...'}
                                  </TableCell>
                                  <TableCell>{new Date(msg.created_at).toLocaleString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}

                    {allTables.n8n_chat_histories?.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>N8N Chat Histories ({allTables.n8n_chat_histories.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Session ID</TableHead>
                                <TableHead>Message Preview</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {allTables.n8n_chat_histories.slice(0, 10).map((hist: any) => (
                                <TableRow key={hist.id}>
                                  <TableCell>{hist.id}</TableCell>
                                  <TableCell className="font-mono text-sm">{hist.session_id}</TableCell>
                                  <TableCell className="max-w-xs truncate">
                                    {typeof hist.message === 'object' 
                                      ? JSON.stringify(hist.message).substring(0, 100) + '...'
                                      : String(hist.message).substring(0, 100) + '...'
                                    }
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            {/* System */}
            <TabsContent value="system" className="space-y-6">
              <div className="grid gap-6">
                {(allTables.account?.length > 0 || allTables.user_profile?.length > 0 || allTables.api_configs?.length > 0) && (
                  <>
                    {allTables.account?.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Accounts ({allTables.account.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Created</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {allTables.account.map((acc: any) => (
                                <TableRow key={acc.id}>
                                  <TableCell className="font-mono text-sm">{acc.id}</TableCell>
                                  <TableCell>{acc.name}</TableCell>
                                  <TableCell>{new Date(acc.created_at).toLocaleString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}

                    {allTables.user_profile?.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>User Profiles ({allTables.user_profile.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Created</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {allTables.user_profile.map((profile: any) => (
                                <TableRow key={profile.id}>
                                  <TableCell className="font-mono text-sm">{profile.id}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{profile.role}</Badge>
                                  </TableCell>
                                  <TableCell>{new Date(profile.created_at).toLocaleString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}

                    {allTables.api_configs?.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>API Configurations ({allTables.api_configs.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>URL</TableHead>
                                <TableHead>Active</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {allTables.api_configs.map((config: any) => (
                                <TableRow key={config.id}>
                                  <TableCell>{config.name}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{config.method}</Badge>
                                  </TableCell>
                                  <TableCell className="max-w-xs truncate">{config.url}</TableCell>
                                  <TableCell>
                                    <Badge variant={config.is_active ? 'default' : 'secondary'}>
                                      {config.is_active ? 'Активен' : 'Неактивен'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            {/* Export Tab */}
            <TabsContent value="export" className="space-y-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Data Export & Reporting</h2>
                  <p className="text-muted-foreground">
                    Export administrative data, generate reports, and schedule automated delivery
                  </p>
                </div>

                <ExportManager
                  data={[
                    ...allTables.profiles.map(p => ({ ...p, type: 'profile' })),
                    ...allTables.executions.map(e => ({ ...e, type: 'execution' })),
                    ...allTables.clients.map(c => ({ ...c, type: 'client' })),
                    ...allTables.tenants.map(t => ({ ...t, type: 'tenant' }))
                  ]}
                  kpiData={{
                    totalExec: allTables.executions.length || 0,
                    successRate: allTables.executions.length > 0 
                      ? allTables.executions.filter((e: any) => e.status === 'success').length / allTables.executions.length 
                      : 0,
                    avgDuration: allTables.executions.length > 0
                      ? allTables.executions.reduce((sum: number, e: any) => sum + (e.duration_ms || 0), 0) / allTables.executions.length
                      : 0,
                    lastActivity: allTables.executions[0]?.timestamp || new Date().toISOString()
                  }}
                  conversations={allTables.mulchbg?.map((doc: any) => ({
                    id: doc.id,
                    session_id: doc.session_id,
                    message: typeof doc.message === 'string' ? doc.message : JSON.stringify(doc.message),
                    timestamp: new Date()
                  })) || []}
                  onRefresh={fetchAdminData}
                  onDateRangeChange={(startDate, endDate) => {
                    // Could add date filtering to admin panel if needed
                    console.log('Date range changed:', { startDate, endDate });
                  }}
                />

                {/* Admin Export Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{allTables.profiles.length}</div>
                      <p className="text-xs text-muted-foreground">Active profiles</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{allTables.executions.length}</div>
                      <p className="text-xs text-muted-foreground">Processing records</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{allTables.tenants.length}</div>
                      <p className="text-xs text-muted-foreground">Organization folders</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{allTables.clients.length}</div>
                      <p className="text-xs text-muted-foreground">Client accounts</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
      </RoleProtectedRoute>
    </ProtectedRoute>
  );
};

export default Admin;