import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { FolderPlus, Plus, Upload, Calendar, Database, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  created_at: string;
}

interface RealDataManagerProps {
  projects: Project[];
  onProjectsUpdate: () => void;
}

const RealDataManager = ({ projects, onProjectsUpdate }: RealDataManagerProps) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  
  // Execution data states
  const [workflowName, setWorkflowName] = useState('');
  const [executionStatus, setExecutionStatus] = useState('success');
  const [duration, setDuration] = useState('');
  const [startedAt, setStartedAt] = useState(new Date().toISOString().slice(0, 16));
  const [errorMessage, setErrorMessage] = useState('');
  const [bulkExecutions, setBulkExecutions] = useState('');

  // Table import states
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [tableData, setTableData] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  // Load available tables
  useEffect(() => {
    loadAvailableTables();
  }, []);

  // Auto refresh functionality
  useEffect(() => {
    if (!autoRefresh || !selectedTable || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      loadTableData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedTable, refreshInterval]);

  const loadAvailableTables = async () => {
    try {
      // Get all available tables using a simple query
      const { data: tables, error } = await supabase
        .from('account')
        .select('id')
        .limit(0);  // Just to test connection
        
      // List of all available tables based on your database schema
      const allTables = [
        'account',
        'api_configs', 
        'api_executions',
        'chat_conversation',
        'chat_message',
        'client_connectors',
        'client_workflows',
        'clients',
        'documents',
        'execution',
        'executions',
        'incidents',
        'mulchbg',
        'mv_exec_daily',
        'n8n_chat_histories',
        'profiles',
        'project',
        'tenants',
        'user_profile',
        'v_project_last_activity',
        'webhooks'
      ];
      
      setAvailableTables(allTables);
    } catch (error) {
      console.error('Error loading tables:', error);
      // Fallback to main tables
      setAvailableTables([
        'execution', 
        'project', 
        'account', 
        'user_profile', 
        'profiles',
        'clients',
        'executions',
        'api_configs',
        'documents'
      ]);
    }
  };

  const loadTableData = async () => {
    if (!selectedTable) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(selectedTable as any)
        .select('*')
        .limit(100);

      if (error) throw error;
      setTableData(data || []);
      
      toast({
        title: "Данните са обновени",
        description: `Заредени ${data?.length || 0} записа от таблица ${selectedTable}`
      });

    } catch (error) {
      console.error('Error loading table data:', error);
      toast({
        title: "Грешка",
        description: "Неуспешно зареждане на данните от таблицата",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const importTableData = async () => {
    if (!selectedTable || !selectedProject) {
      toast({
        title: "Грешка",
        description: "Моля изберете таблица и проект",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await loadTableData();
      
      toast({
        title: "Успех",
        description: `Данните от таблица ${selectedTable} са импортирани`
      });

    } catch (error) {
      console.error('Error importing table data:', error);
      toast({
        title: "Грешка", 
        description: "Неуспешен импорт на данните",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Грешка",
        description: "Моля въведете име на проекта",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('create_real_project', {
        p_project_name: newProjectName.trim(),
        p_description: newProjectDescription.trim()
      });

      if (error) throw error;

      toast({
        title: "Успех",
        description: `Проектът "${newProjectName}" е създаден успешно`
      });

      setNewProjectName('');
      setNewProjectDescription('');
      onProjectsUpdate();

    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Грешка",
        description: "Неуспешно създаване на проекта: " + (error as any).message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddExecution = async () => {
    if (!selectedProject || !workflowName.trim()) {
      toast({
        title: "Грешка", 
        description: "Моля изберете проект и въведете име на работния процес",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('add_real_execution', {
        p_project_id: selectedProject,
        p_workflow_name: workflowName.trim(),
        p_status: executionStatus,
        p_duration_ms: duration ? parseInt(duration) : null,
        p_started_at: new Date(startedAt).toISOString(),
        p_error_message: errorMessage.trim() || null
      });

      if (error) throw error;

      toast({
        title: "Успех",
        description: "Изпълнението е добавено успешно"
      });

      // Reset form
      setWorkflowName('');
      setDuration('');
      setErrorMessage('');
      setStartedAt(new Date().toISOString().slice(0, 16));

    } catch (error) {
      console.error('Error adding execution:', error);
      toast({
        title: "Грешка",
        description: "Неуспешно добавяне на изпълнението: " + (error as any).message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    if (!selectedProject || !bulkExecutions.trim()) {
      toast({
        title: "Грешка",
        description: "Моля изберете проект и въведете данни за изпълненията",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const lines = bulkExecutions.trim().split('\n');
      let successCount = 0;
      let errorCount = 0;

      for (const line of lines) {
        const [name, status, durationStr, dateStr] = line.split(',').map(s => s.trim());
        
        if (!name) continue;

        try {
          const { error } = await supabase.rpc('add_real_execution', {
            p_project_id: selectedProject,
            p_workflow_name: name,
            p_status: status || 'success',
            p_duration_ms: durationStr ? parseInt(durationStr) : null,
            p_started_at: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
            p_error_message: null
          });

          if (error) throw error;
          successCount++;
        } catch (err) {
          console.error('Error importing line:', line, err);
          errorCount++;
        }
      }

      toast({
        title: "Импорт завършен",
        description: `Успешно: ${successCount}, Грешки: ${errorCount}`
      });

      setBulkExecutions('');

    } catch (error) {
      console.error('Error bulk importing:', error);
      toast({
        title: "Грешка",
        description: "Неуспешен масов импорт",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Управление на реални данни
          </CardTitle>
          <CardDescription>
            Създавайте реални проекти и добавяйте реална информация за изпълненията
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="projects" className="space-y-4">
            <TabsList>
              <TabsTrigger value="projects">Проекти</TabsTrigger>
              <TabsTrigger value="executions">Изпълнения</TabsTrigger>
              <TabsTrigger value="bulk">Масов импорт</TabsTrigger>
              <TabsTrigger value="tables">Импорт таблици</TabsTrigger>
            </TabsList>

            {/* Create Project */}
            <TabsContent value="projects" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Име на проекта *</Label>
                  <Input
                    id="projectName"
                    placeholder="напр. Клиент А - CRM система"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectDesc">Описание</Label>
                  <Input
                    id="projectDesc"
                    placeholder="Кратко описание на проекта"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleCreateProject} 
                disabled={loading || !newProjectName.trim()}
                className="w-full md:w-auto"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Създай реален проект
              </Button>

              {/* Current Projects */}
              <div className="space-y-2">
                <Label>Съществуващи проекти ({projects.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {projects.map(project => (
                    <Badge key={project.id} variant="outline">
                      {project.name}
                    </Badge>
                  ))}
                  {projects.length === 0 && (
                    <p className="text-sm text-muted-foreground">Няма създадени проекти</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Add Single Execution */}
            <TabsContent value="executions" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="projectSelect">Проект *</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Изберете проект" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workflowName">Работен процес *</Label>
                  <Input
                    id="workflowName"
                    placeholder="напр. Импорт на клиенти"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Статус</Label>
                  <Select value={executionStatus} onValueChange={setExecutionStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="success">Успешно</SelectItem>
                      <SelectItem value="error">Грешка</SelectItem>
                      <SelectItem value="running">В процес</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Продължителност (ms)</Label>
                  <Input
                    id="duration"
                    placeholder="5000"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startedAt">Започнато на</Label>
                  <Input
                    id="startedAt"
                    type="datetime-local"
                    value={startedAt}
                    onChange={(e) => setStartedAt(e.target.value)}
                  />
                </div>

                {executionStatus === 'error' && (
                  <div className="space-y-2">
                    <Label htmlFor="errorMsg">Съобщение за грешка</Label>
                    <Input
                      id="errorMsg"
                      placeholder="Описание на грешката"
                      value={errorMessage}
                      onChange={(e) => setErrorMessage(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <Button 
                onClick={handleAddExecution}
                disabled={loading || !selectedProject || !workflowName.trim()}
                className="w-full md:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Добави изпълнение
              </Button>
            </TabsContent>

            {/* Bulk Import */}
            <TabsContent value="bulk" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulkProject">Проект за импорт *</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете проект" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulkData">Данни за изпълненията *</Label>
                <Textarea
                  id="bulkData"
                  placeholder="Формат: име_процес,статус,продължителност_ms,дата&#10;Импорт клиенти,success,3000,2024-01-15T10:00:00&#10;Синхронизация CRM,error,5000,2024-01-15T11:00:00&#10;Изпращане имейли,success,2000,2024-01-15T12:00:00"
                  value={bulkExecutions}
                  onChange={(e) => setBulkExecutions(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  Всеки ред трябва да съдържа: име_процес,статус,продължителност_ms,дата (разделени със запетая)
                </p>
              </div>

              <Button 
                onClick={handleBulkImport}
                disabled={loading || !selectedProject || !bulkExecutions.trim()}
                className="w-full md:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                Импортирай данни
              </Button>
            </TabsContent>

            {/* Table Import */}
            <TabsContent value="tables" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tableSelect">Избери таблица *</Label>
                  <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger>
                      <SelectValue placeholder="Изберете таблица" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTables.map(table => (
                        <SelectItem key={table} value={table}>
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            {table}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectForTable">Проект за импорт *</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Изберете проект" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="autoRefresh">Автоматично обновяване</Label>
                    <p className="text-sm text-muted-foreground">
                      Автоматично зарежда данните на определен интервал
                    </p>
                  </div>
                  <Switch 
                    id="autoRefresh"
                    checked={autoRefresh} 
                    onCheckedChange={setAutoRefresh}
                  />
                </div>

                {autoRefresh && (
                  <div className="space-y-2">
                    <Label htmlFor="refreshInterval">Интервал за обновяване (секунди)</Label>
                    <Input
                      id="refreshInterval"
                      type="number"
                      min="5"
                      max="300"
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 30)}
                      placeholder="30"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={importTableData}
                  disabled={loading || !selectedTable || !selectedProject}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Импортирай данни от таблица
                </Button>
                
                <Button 
                  onClick={loadTableData}
                  disabled={loading || !selectedTable}
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Обнови
                </Button>
              </div>

              {tableData.length > 0 && (
                <div className="space-y-2">
                  <Label>Данни от таблица {selectedTable} ({tableData.length} записа)</Label>
                  <div className="max-h-60 overflow-auto border rounded-md p-4 bg-muted/50">
                    <pre className="text-sm">
                      {JSON.stringify(tableData.slice(0, 5), null, 2)}
                    </pre>
                    {tableData.length > 5 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        ... и още {tableData.length - 5} записа
                      </p>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealDataManager;