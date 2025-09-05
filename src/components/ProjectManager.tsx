import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FolderOpen, Users, Activity, Calendar, UserPlus, Trash2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  created_at: string;
  account_id: string;
  data_table?: string;
}

interface Profile {
  id: string;
  user_id: string;
  email: string;
  role: string;
  project_id: string | null;
}

interface Execution {
  id: number;
  workflow_name: string;
  status: string;
  started_at: string;
  duration_ms: number | null;
  error: string | null;
}

const ProjectManager = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  
  // New project creation state
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectTable, setNewProjectTable] = useState('executions');
  const [availableTables] = useState([
    'executions',
    'mulchbg', 
    'documents',
    'api_executions',
    'n8n_chat_histories'
  ]);

  // Create new project
  const createProject = async () => {
    if (!newProjectName) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile } = await supabase
        .from('user_profile')
        .select('account_id')
        .eq('user_id', user.id)
        .single();

      if (!userProfile) return;

      const { error } = await supabase
        .from('project')
        .insert({
          name: newProjectName,
          account_id: userProfile.account_id,
          data_table: newProjectTable
        });

      if (error) throw error;

      toast({
        title: "Успех",
        description: "Проектът е създаден успешно",
      });

      // Reset form and reload projects
      setNewProjectName('');
      setNewProjectTable('executions');
      setShowNewProjectDialog(false);
      loadProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Грешка",
        description: "Неуспешно създаване на проекта",
        variant: "destructive",
      });
    }
  };

  // Load projects
  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('project')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Грешка",
        description: "Неуспешно зареждане на проектите",
        variant: "destructive",
      });
    }
  };

  // Load project details
  const loadProjectDetails = async (projectId: string) => {
    setLoading(true);
    try {
      // Load project executions
      const { data: execData, error: execError } = await supabase
        .from('execution')
        .select('*')
        .eq('project_id', projectId)
        .order('started_at', { ascending: false })
        .limit(50);

      if (execError) throw execError;
      setExecutions(execData || []);

      // Load assigned users to this project
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('project_id', projectId);

      if (profileError) throw profileError;
      setProfiles(profileData || []);

    } catch (error) {
      console.error('Error loading project details:', error);
      toast({
        title: "Грешка",
        description: "Неуспешно зареждане на детайлите за проекта",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load available users (not assigned to any project)
  const loadAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .is('project_id', null);

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error loading available users:', error);
    }
  };

  // Assign user to project
  const assignUserToProject = async () => {
    if (!selectedProject || !selectedUserId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ project_id: selectedProject.id })
        .eq('user_id', selectedUserId);

      if (error) throw error;

      toast({
        title: "Успех",
        description: "Потребителят е назначен към проекта",
      });

      // Refresh data
      loadProjectDetails(selectedProject.id);
      loadAvailableUsers();
      setSelectedUserId('');
    } catch (error) {
      console.error('Error assigning user:', error);
      toast({
        title: "Грешка",
        description: "Неуспешно назначаване на потребителя",
        variant: "destructive",
      });
    }
  };

  // Remove user from project
  const removeUserFromProject = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ project_id: null })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Успех",
        description: "Потребителят е премахнат от проекта",
      });

      // Refresh data
      if (selectedProject) {
        loadProjectDetails(selectedProject.id);
      }
      loadAvailableUsers();
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: "Грешка",
        description: "Неуспешно премахване на потребителя",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadProjects();
    loadAvailableUsers();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectDetails(selectedProject.id);
    }
  }, [selectedProject]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-success/10 text-success border-success/20">Успех</Badge>;
      case 'error':
        return <Badge variant="destructive">Грешка</Badge>;
      case 'running':
        return <Badge className="bg-warning/10 text-warning border-warning/20">В процес</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Управление на проекти</h2>
          <p className="text-muted-foreground">Преглед и управление на проекти и потребители</p>
        </div>
        <Button onClick={() => setShowNewProjectDialog(true)}>
          Създай проект
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Проекти ({projects.length})
            </CardTitle>
            <CardDescription>Изберете проект за преглед</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {projects.map((project) => (
                  <Card 
                    key={project.id}
                    className={`cursor-pointer transition-colors ${
                      selectedProject?.id === project.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-foreground">{project.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(project.created_at).toLocaleDateString('bg-BG')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Таблица: {project.data_table || 'executions'}
                          </p>
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Project Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProject ? (
            <>
              {/* Project Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    {selectedProject.name}
                  </CardTitle>
                  <CardDescription>
                    Създаден на {new Date(selectedProject.created_at).toLocaleDateString('bg-BG')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Общо изпълнения</Label>
                      <p className="text-2xl font-bold text-foreground">{executions.length}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Назначени потребители</Label>
                      <p className="text-2xl font-bold text-foreground">{profiles.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assigned Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Назначени потребители
                  </CardTitle>
                  <CardDescription>Потребители с достъп до този проект</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Add User */}
                    <div className="flex gap-2">
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Изберете потребител" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUsers.map((user) => (
                            <SelectItem key={user.user_id} value={user.user_id}>
                              {user.email} ({user.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={assignUserToProject}
                        disabled={!selectedUserId}
                        size="sm"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Назначи
                      </Button>
                    </div>

                    <Separator />

                    {/* Current Users */}
                    <div className="space-y-2">
                      {profiles.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          Няма назначени потребители
                        </p>
                      ) : (
                        profiles.map((profile) => (
                          <div key={profile.user_id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div>
                              <p className="font-medium text-foreground">{profile.email}</p>
                              <Badge variant="outline" className="text-xs">
                                {profile.role}
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeUserFromProject(profile.user_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Executions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Последни изпълнения
                  </CardTitle>
                  <CardDescription>Последните {executions.length} изпълнения</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : executions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Няма изпълнения за този проект
                    </p>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Workflow</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Време</TableHead>
                            <TableHead>Дата</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {executions.map((execution) => (
                            <TableRow key={execution.id}>
                              <TableCell className="font-medium">
                                {execution.workflow_name}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(execution.status)}
                              </TableCell>
                              <TableCell>
                                {formatDuration(execution.duration_ms)}
                              </TableCell>
                              <TableCell>
                                {new Date(execution.started_at).toLocaleString('bg-BG')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Изберете проект
                </h3>
                <p className="text-muted-foreground">
                  Изберете проект от лявата страна за да видите детайлите и управлявате потребителите
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Създаване на нов проект</DialogTitle>
            <DialogDescription>
              Създайте нов проект и изберете коя таблица да използва за данни
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="project-name">Име на проекта</Label>
              <Input
                id="project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Въведете име на проекта"
              />
            </div>
            <div>
              <Label htmlFor="data-table">Таблица за данни</Label>
              <Select value={newProjectTable} onValueChange={setNewProjectTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Изберете таблица" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Изберете коя таблица ще използва този проект за показване на данни в дашборда
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowNewProjectDialog(false)}
            >
              Отказ
            </Button>
            <Button 
              onClick={createProject}
              disabled={!newProjectName}
            >
              Създай проект
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectManager;