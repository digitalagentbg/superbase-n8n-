import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ChartContainer } from '@/components/ui/chart';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Database, 
  Calendar, 
  Filter,
  TrendingUp,
  Users,
  FileText,
  Download,
  RefreshCw,
  Eye,
  BarChart3,
  MessageSquare,
  CalendarIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { PremiumLayout } from '@/components/PremiumLayout';
import { PremiumKPICard } from '@/components/PremiumKPICard';
import { ConversationView } from '@/components/ConversationView';
import { ExpandableMessage } from '@/components/ExpandableMessage';
import { ExportManager } from '@/components/ExportManager';
import ProtectedRoute from '@/components/ProtectedRoute';

interface ExecutionData {
  id: string;
  workflow_name: string;
  status: string;
  timestamp: string;
  duration_ms: number;
  cost_usd: number;
  error_message?: string;
}

interface KPIData {
  totalProcessed: number;
  successRate: number;
  failedOps: number;
  lastUpdate: string;
  avgProcessingTime: number;
  dataVolume: number;
}

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [executions, setExecutions] = useState<ExecutionData[]>([]);
  const [kpiData, setKPIData] = useState<KPIData>({
    totalProcessed: 0,
    successRate: 0,
    failedOps: 0,
    lastUpdate: '',
    avgProcessingTime: 0,
    dataVolume: 0
  });
  const [selectedProject, setSelectedProject] = useState<string>(
    searchParams.get('project') || 'all'
  );
  const [projects, setProjects] = useState<Array<{id: string, name: string, data_table?: string}>>([]);
  const [documents, setDocuments] = useState<Array<{id: number, content: string, metadata: any}>>([]);
  const [mulchDocuments, setMulchDocuments] = useState<Array<{id: number, session_id: string, message: any, 'mulch id': string, project_id?: string}>>([]);
  // Additional state for user profile
  const [userProfile, setUserProfile] = useState<{role: string, tenant_id: string, project_id?: string} | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Date filtering state
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0] // today
  });

  // Role-based access control
  const { 
    viewMode, 
    assignedProjectId, 
    shouldShowAdminFeatures, 
    getAccessibleProjects,
    loading: roleLoading 
  } = useUserRole();

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    if (projectId === 'all') {
      searchParams.delete('project');
    } else {
      searchParams.set('project', projectId);
    }
    setSearchParams(searchParams);
  };

  // Separate effect for project selection logic
  useEffect(() => {
    if (roleLoading) return;
    
    const initializeProject = async () => {
      try {
        const accessibleProjects = await getAccessibleProjects();
        setProjects(accessibleProjects);
        
        const isAdminMode = shouldShowAdminFeatures();
        
        console.log('Initializing project selection:', {
          viewMode,
          assignedProjectId,
          shouldShowAdminFeatures: isAdminMode,
          currentSelected: selectedProject,
          accessibleProjects: accessibleProjects.map(p => ({id: p.id, name: p.name}))
        });

        let targetProject = selectedProject;
        
        // For non-admin users, always use their assigned project
        if (!isAdminMode && assignedProjectId) {
          targetProject = assignedProjectId;
        }
        // For client view mode with assigned project
        else if (viewMode === 'client' && assignedProjectId) {
          targetProject = assignedProjectId;
        }
        // If only one project available and currently showing 'all'
        else if (accessibleProjects.length === 1 && selectedProject === 'all') {
          targetProject = accessibleProjects[0].id;
        }
        // If current selection is not accessible
        else if (!accessibleProjects.some(p => p.id === selectedProject)) {
          targetProject = isAdminMode ? 'all' : 
                         (accessibleProjects.length > 0 ? accessibleProjects[0].id : 'all');
        }
        
        // Only update if different to avoid loops
        if (targetProject !== selectedProject) {
          console.log(`Changing project selection from ${selectedProject} to ${targetProject}`);
          setSelectedProject(targetProject);
          
          if (targetProject === 'all') {
            searchParams.delete('project');
          } else {
            searchParams.set('project', targetProject);
          }
          setSearchParams(searchParams);
        }
      } catch (error) {
        console.error('Error initializing project:', error);
      }
    };
    
    initializeProject();
  }, [viewMode, assignedProjectId, roleLoading]);

  // Separate effect for data fetching
  useEffect(() => {
    if (roleLoading) return;
    
    console.log('Fetching data for project:', selectedProject);
    fetchDashboardData();
    
    // Set up real-time listeners
    const executionsChannel = supabase
      .channel('dashboard-executions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'executions'
        },
        () => {
          console.log('Executions changed, refreshing dashboard...');
          fetchDashboardData();
        }
      )
      .subscribe();

    const projectsChannel = supabase
      .channel('dashboard-projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project'
        },
        () => {
          console.log('Projects changed, refreshing dashboard...');
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(executionsChannel);
      supabase.removeChannel(projectsChannel);
    };
  }, [selectedProject, dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching dashboard data with role settings:', {
        viewMode,
        assignedProjectId,
        shouldShowAdminFeatures: shouldShowAdminFeatures(),
        selectedProject
      });

      // Get user info for tenant-based filtering
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile with project assignment
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('tenant_id, role, project_id')
        .eq('user_id', user.id)
        .single();

      if (!userProfile) return;
      
      // Update user profile state
      setUserProfile(userProfile);

      let targetProjectId = selectedProject;

      // За non-admin потребители - ВИНАГИ използвай назначения проект
      if (userProfile && userProfile.role !== 'admin' && userProfile.role !== 'owner') {
        if (userProfile.project_id) {
          targetProjectId = userProfile.project_id;
        } else {
          // Ако няма назначен проект - показвай празни данни
          setExecutions([]);
          setKPIData({
            totalProcessed: 0,
            successRate: 0,
            failedOps: 0,
            lastUpdate: new Date().toISOString(),
            avgProcessingTime: 0,
            dataVolume: 0
          });
          return;
        }
      }

      console.log('Зареждам данни за проект:', targetProjectId);

      console.log('User profile for data filtering:', userProfile);

      // Get user's project details using the new function
      const { data: projectDetails } = await supabase
        .rpc('get_user_project_details');

      console.log('User project details:', projectDetails);

      let finalProjectToSelect = selectedProject;
      let dataTableName = 'executions';
      let filterConfig = null;

      if (userProfile.role === 'admin' || userProfile.role === 'owner') {
        // Admin users - get project details based on selected project
        if (selectedProject !== 'all') {
          const { data: adminProjectData } = await supabase
            .from('project')
            .select('id, name, data_table, filter_column, filter_value, filter_type')
            .eq('id', selectedProject)
            .single();
          
          if (adminProjectData) {
            dataTableName = adminProjectData.data_table || 'executions';
            filterConfig = {
              column: adminProjectData.filter_column,
              value: adminProjectData.filter_value,
              type: adminProjectData.filter_type
            };
          }
        } else {
          // For "all" projects, use executions as the primary table
          // We'll aggregate data from all project tables below
          dataTableName = 'executions';
        }
      } else {
        // Client users - use their assigned project details
        if (projectDetails && projectDetails.length > 0) {
          const projectInfo = projectDetails[0];
          finalProjectToSelect = projectInfo.project_id;
          dataTableName = projectInfo.data_table || 'executions';
          filterConfig = {
            column: projectInfo.filter_column,
            value: projectInfo.filter_value,
            type: projectInfo.filter_type
          };
          
          console.log('Client using project:', projectInfo.project_name, 'with table:', dataTableName);
        }
      }

      console.log(`Using data table: ${dataTableName} with filter config:`, filterConfig);

      // Build dynamic query based on table and filter configuration
      let executionsData = [];
      
      if (userProfile.role === 'admin' || userProfile.role === 'owner') {
        if (selectedProject === 'all') {
          // For admin viewing all projects, aggregate data from all project tables
          console.log('Admin viewing all projects - fetching from all tables');
          
          // Get all projects for this account to see what tables they use
          const { data: allProjects, error: projectsError } = await supabase
            .from('project')
            .select('id, name, data_table')
            .eq('account_id', userProfile.tenant_id);
          
          if (projectsError) {
            console.error('Error fetching all projects:', projectsError);
            executionsData = [];
          } else {
            console.log('All projects for admin:', allProjects);
            
            const aggregatedData = [];
            
            // Fetch from executions table if any project uses it
            const executionsProjects = allProjects?.filter(p => p.data_table === 'executions') || [];
            if (executionsProjects.length > 0) {
              console.log('Fetching from executions table for projects:', executionsProjects.map(p => p.name));
              try {
                const { data: execData, error } = await supabase
                  .from('executions')
                  .select('*')
                  .eq('tenant_id', userProfile.tenant_id)
                  .gte('timestamp', new Date(dateRange.from + 'T00:00:00Z').toISOString())
                  .lte('timestamp', new Date(dateRange.to + 'T23:59:59Z').toISOString())
                  .order('timestamp', { ascending: false })
                  .limit(500);
                
                if (error) {
                  console.error('Error fetching executions:', error);
                } else {
                  const transformedExecData = (execData || []).map(exec => ({
                    id: exec.id.toString(),
                    workflow_name: exec.workflow_name,
                    status: exec.status,
                    timestamp: exec.timestamp,
                    duration_ms: exec.duration_ms || 0,
                    cost_usd: exec.cost_usd || 0,
                    error_message: exec.error_message,
                    source_table: 'executions'
                  }));
                  aggregatedData.push(...transformedExecData);
                  console.log(`Added ${transformedExecData.length} records from executions table`);
                }
              } catch (err) {
                console.error('executions fetch error:', err);
              }
            }
            
            // Fetch from mulchbg table if any project uses it
            const mulchProjects = allProjects?.filter(p => p.data_table === 'mulchbg') || [];
            if (mulchProjects.length > 0) {
              console.log('Fetching from mulchbg table for projects:', mulchProjects.map(p => p.name));
              try {
                const { data: mulchData, error } = await supabase
                  .from('mulchbg')
                  .select('*')
                  .order('id', { ascending: false })
                  .limit(500);
                
                if (error) {
                  console.error('Error fetching mulchbg:', error);
                } else {
                  const transformedMulchData = (mulchData || []).map(item => ({
                    id: item.id.toString(),
                    workflow_name: `Mulch Entry ${item.id}`,
                    status: 'success',
                    timestamp: new Date().toISOString(),
                    duration_ms: 1000,
                    cost_usd: 0,
                    error_message: null,
                    source_table: 'mulchbg'
                  }));
                  aggregatedData.push(...transformedMulchData);
                  console.log(`Added ${transformedMulchData.length} records from mulchbg table`);
                }
              } catch (err) {
                console.error('mulchbg fetch error:', err);
              }
            }
            
            // Fetch from n8n_chat_histories table if any project uses it
            const chatProjects = allProjects?.filter(p => p.data_table === 'n8n_chat_histories') || [];
            if (chatProjects.length > 0) {
              console.log('Fetching from n8n_chat_histories table for projects:', chatProjects.map(p => p.name));
              try {
                const { data: chatData, error } = await supabase
                  .from('n8n_chat_histories')
                  .select('*')
                  .order('id', { ascending: false })
                  .limit(500);
                
                if (error) {
                  console.error('Error fetching n8n_chat_histories:', error);
                } else {
                  const transformedChatData = (chatData || []).map(item => ({
                    id: item.id.toString(),
                    workflow_name: `Chat History ${item.id}`,
                    status: 'success',
                    timestamp: new Date().toISOString(),
                    duration_ms: 1000,
                    cost_usd: 0,
                    error_message: null,
                    source_table: 'n8n_chat_histories'
                  }));
                  aggregatedData.push(...transformedChatData);
                  console.log(`Added ${transformedChatData.length} records from n8n_chat_histories table`);
                }
              } catch (err) {
                console.error('n8n_chat_histories fetch error:', err);
              }
            }
            
            // Sort all aggregated data by timestamp (newest first)
            executionsData = aggregatedData.sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            
            console.log(`Total aggregated data: ${executionsData.length} records from all tables`);
          }
        } else {
          // Admin single project selected - use project-specific table
          console.log(`Admin viewing single project ${selectedProject} with table: ${dataTableName}`);
          
          if (dataTableName === 'executions') {
            const { data, error } = await supabase
              .from('executions')
              .select('*')
              .eq('tenant_id', userProfile.tenant_id)
              .gte('timestamp', new Date(dateRange.from + 'T00:00:00Z').toISOString())
              .lte('timestamp', new Date(dateRange.to + 'T23:59:59Z').toISOString())
              .order('timestamp', { ascending: false })
              .limit(1000);
              
            if (error) throw error;
            executionsData = data || [];
            
          } else if (dataTableName === 'mulchbg') {
            const { data, error } = await supabase
              .from('mulchbg')
              .select('*')
              .order('id', { ascending: false })
              .limit(1000);
              
            if (error) throw error;
            executionsData = data || [];
            
          } else if (dataTableName === 'n8n_chat_histories') {
            const { data, error } = await supabase
              .from('n8n_chat_histories')
              .select('*')
              .order('id', { ascending: false })
              .limit(1000);
              
            if (error) throw error;
            executionsData = data || [];
            
          } else {
            // Fallback to executions
            const { data, error } = await supabase
              .from('executions')
              .select('*')
              .eq('tenant_id', userProfile.tenant_id)
              .order('timestamp', { ascending: false })
              .limit(1000);
              
            if (error) throw error;
            executionsData = data || [];
          }
        }
      } else {
        // Non-admin users - use their assigned project table only
        console.log(`Client user viewing project with table: ${dataTableName}`);
        
        if (dataTableName === 'executions') {
          const { data, error } = await supabase
            .from('executions')
            .select('*')
            .eq('tenant_id', userProfile.tenant_id)
            .gte('timestamp', new Date(dateRange.from + 'T00:00:00Z').toISOString())
            .lte('timestamp', new Date(dateRange.to + 'T23:59:59Z').toISOString())
            .order('timestamp', { ascending: false })
            .limit(1000);
            
          if (error) throw error;
          executionsData = data || [];
          
        } else if (dataTableName === 'mulchbg') {
          const { data, error } = await supabase
            .from('mulchbg')
            .select('*')
            .eq('project_id', userProfile.project_id)
            .order('id', { ascending: false })
            .limit(1000);
            
          if (error) throw error;
          executionsData = data || [];
          
        } else if (dataTableName === 'n8n_chat_histories') {
          const { data, error } = await supabase
            .from('n8n_chat_histories')
            .select('*')
            .order('id', { ascending: false })
            .limit(1000);
            
          if (error) throw error;
          executionsData = data || [];
          
        } else {
          // Fallback to executions for non-admin
          const { data, error } = await supabase
            .from('executions')
            .select('*')
            .eq('tenant_id', userProfile.tenant_id)
            .order('timestamp', { ascending: false })
            .limit(1000);
            
          if (error) throw error;
          executionsData = data || [];
        }
      }

      console.log(`Fetched ${executionsData?.length || 0} records`);

      // Transform data to match execution interface based on table type or source_table
      let transformedExecutions = [];
      
      if (executionsData.length > 0) {
        // Check if data already has source_table (aggregated admin data)
        if (executionsData[0].source_table) {
          transformedExecutions = executionsData;
        } else if (dataTableName === 'executions') {
          transformedExecutions = (executionsData || []).map(exec => ({
            id: exec.id.toString(),
            workflow_name: exec.workflow_name,
            status: exec.status,
            timestamp: exec.timestamp,
            duration_ms: exec.duration_ms || 0,
            cost_usd: exec.cost_usd || 0,
            error_message: exec.error_message
          }));
        } else if (dataTableName === 'mulchbg') {
          transformedExecutions = (executionsData || []).map((item, index) => ({
            id: item.id.toString(),
            workflow_name: `Mulch Entry ${item.id}`,
            status: 'success', // Default status for mulchbg entries
            timestamp: new Date().toISOString(), // Use current time if no timestamp
            duration_ms: 1000, // Mock duration
            cost_usd: 0,
            error_message: null
          }));
        } else if (dataTableName === 'n8n_chat_histories') {
          transformedExecutions = (executionsData || []).map((item, index) => ({
            id: item.id.toString(),
            workflow_name: `Chat History ${item.id}`,
            status: 'success', // Default status for chat histories
            timestamp: item.created_at || new Date().toISOString(),
            duration_ms: 1000, // Mock duration
            cost_usd: 0,
            error_message: null
          }));
        } else {
          // Generic transformation for other tables
          transformedExecutions = (executionsData || []).map((item, index) => ({
            id: (item.id || index).toString(),
            workflow_name: `${dataTableName.charAt(0).toUpperCase() + dataTableName.slice(1)} Entry`,
            status: 'success',
            timestamp: item.created_at || item.timestamp || new Date().toISOString(),
            duration_ms: 1000,
            cost_usd: 0,
            error_message: null
          }));
        }
      }

      setExecutions(transformedExecutions);

      // Calculate KPIs from real data
      if (transformedExecutions.length > 0) {
        const total = transformedExecutions.length;
        const successful = transformedExecutions.filter(e => e.status === 'success').length;
        const failed = transformedExecutions.filter(e => e.status === 'error' || e.status === 'failed').length;
        const avgDuration = transformedExecutions.reduce((acc, e) => acc + (e.duration_ms || 0), 0) / total;
        const lastUpdate = transformedExecutions[0]?.timestamp || new Date().toISOString();
        
        // Calculate data volume from payload/result sizes (mock calculation)
        const estimatedDataVolume = total * 0.5; // Estimate 0.5MB per execution

        setKPIData({
          totalProcessed: total,
          successRate: total > 0 ? (successful / total) * 100 : 0,
          failedOps: failed,
          lastUpdate,
          avgProcessingTime: avgDuration,
          dataVolume: estimatedDataVolume
        });
        
        console.log('KPI Data calculated:', {
          total,
          successful,
          failed,
          successRate: (successful / total) * 100,
          avgDuration
        });
      } else {
        setKPIData({
          totalProcessed: 0,
          successRate: 0,
          failedOps: 0,
          lastUpdate: new Date().toISOString(),
          avgProcessingTime: 0,
          dataVolume: 0
        });
        console.log('No execution data found - showing zero KPIs');
      }

      // Fetch documents - show relevant documents for all users
      let documentsData = [];
      if (userProfile.role === 'admin' || userProfile.role === 'owner') {
        // Admins see all documents
        const { data, error: documentsError } = await supabase
          .from('documents')
          .select('*')
          .order('id', { ascending: false })
          .limit(50);

        if (documentsError) {
          console.error('Documents error (admin):', documentsError);
        } else {
          console.log('Documents loaded for admin:', data?.length || 0);
          documentsData = data || [];
        }
      } else {
        // Regular users see limited documents (project-related if possible)
        const { data, error: documentsError } = await supabase
          .from('documents')
          .select('*')
          .order('id', { ascending: false })
          .limit(10); // Limit for regular users

        if (documentsError) {
          console.error('Documents error (user):', documentsError);
        } else {
          console.log('Documents loaded for user:', data?.length || 0);
          documentsData = data || [];
        }
      }
      setDocuments(documentsData);

      // Fetch project-specific chat data
      let chatData = [];
      
      if (userProfile.role === 'admin' || userProfile.role === 'owner') {
        if (selectedProject === 'all') {
          // Admins viewing all projects - fetch from all chat sources
          console.log('Admin viewing all projects - fetching all chat data');
          
          // Fetch from mulchbg (has project_id)
          const { data: mulchData, error: mulchError } = await supabase
            .from('mulchbg')
            .select('*')
            .order('id', { ascending: false })
            .limit(30);

          if (mulchError) {
            console.error('Mulchbg error (admin all):', mulchError);
          } else {
            console.log('Mulchbg data (admin all):', mulchData?.length || 0, 'records');
            chatData = [...chatData, ...(mulchData || [])];
          }

          // Fetch from chat_message/chat_conversation (has project_id)
          const { data: chatMessages, error: chatError } = await supabase
            .from('chat_message')
            .select(`
              id,
              content,
              conversation_id,
              created_at,
              chat_conversation!inner(project_id)
            `)
            .order('id', { ascending: false })
            .limit(20);

          if (chatError) {
            console.error('Chat messages error (admin all):', chatError);
          } else {
            console.log('Chat messages data (admin all):', chatMessages?.length || 0, 'records');
            // Transform chat messages to match mulchbg format
            const transformedChat = chatMessages?.map(msg => ({
              id: msg.id,
              session_id: msg.conversation_id,
              message: msg.content,
              'mulch id': 'chat',
              project_id: msg.chat_conversation?.project_id
            })) || [];
            chatData = [...chatData, ...transformedChat];
          }
        } else {
          // Admin viewing specific project
          console.log(`Admin viewing single project ${selectedProject} - fetching project-specific chat`);
          
          // Fetch from mulchbg for this project
          const { data: mulchData, error: mulchError } = await supabase
            .from('mulchbg')
            .select('*')
            .eq('project_id', selectedProject)
            .order('id', { ascending: false })
            .limit(30);

          if (mulchError) {
            console.error('Mulchbg error (admin project):', mulchError);
          } else {
            console.log(`Mulchbg data for project ${selectedProject}:`, mulchData?.length || 0, 'records');
            chatData = [...chatData, ...(mulchData || [])];
          }

          // Fetch from chat_message for this project
          const { data: chatMessages, error: chatError } = await supabase
            .from('chat_message')
            .select(`
              id,
              content,
              conversation_id,
              created_at,
              chat_conversation!inner(project_id)
            `)
            .eq('chat_conversation.project_id', selectedProject)
            .order('id', { ascending: false })
            .limit(20);

          if (chatError) {
            console.error('Chat messages error (admin project):', chatError);
          } else {
            console.log(`Chat messages for project ${selectedProject}:`, chatMessages?.length || 0, 'records');
            const transformedChat = chatMessages?.map(msg => ({
              id: msg.id,
              session_id: msg.conversation_id,
              message: msg.content,
              'mulch id': 'chat',
              project_id: selectedProject
            })) || [];
            chatData = [...chatData, ...transformedChat];
          }
        }
      } else {
        // Regular users - use their assigned project
        if (finalProjectToSelect && finalProjectToSelect !== 'all') {
          console.log(`User viewing assigned project ${finalProjectToSelect} - fetching project chat`);
          
          // Fetch from mulchbg for user's project
          const { data: mulchData, error: mulchError } = await supabase
            .from('mulchbg')
            .select('*')
            .eq('project_id', finalProjectToSelect)
            .order('id', { ascending: false })
            .limit(20);

          if (mulchError) {
            console.error('Mulchbg error (user):', mulchError);
          } else {
            console.log(`User mulchbg data for project ${finalProjectToSelect}:`, mulchData?.length || 0, 'records');
            chatData = [...chatData, ...(mulchData || [])];
          }

          // Fetch from chat_message for user's project
          const { data: chatMessages, error: chatError } = await supabase
            .from('chat_message')
            .select(`
              id,
              content,
              conversation_id,
              created_at,
              chat_conversation!inner(project_id)
            `)
            .eq('chat_conversation.project_id', finalProjectToSelect)
            .order('id', { ascending: false })
            .limit(15);

          if (chatError) {
            console.error('Chat messages error (user):', chatError);
          } else {
            console.log(`User chat messages for project ${finalProjectToSelect}:`, chatMessages?.length || 0, 'records');
            const transformedChat = chatMessages?.map(msg => ({
              id: msg.id,
              session_id: msg.conversation_id,
              message: msg.content,
              'mulch id': 'chat',
              project_id: finalProjectToSelect
            })) || [];
            chatData = [...chatData, ...transformedChat];
          }
        }
      }
      
      console.log('Total chat data collected:', chatData.length, 'records');
      setMulchDocuments(chatData);

      // Set up real-time subscription for project updates
      const channel = supabase
        .channel('dashboard-projects-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'project'
          },
          () => {
            console.log('Projects updated, refreshing folder list...');
            fetchDashboardData();
          }
        )
        .subscribe();

      // Store channel reference for cleanup
      (window as any).dashboardChannel = channel;

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Cleanup real-time subscription
  useEffect(() => {
    return () => {
      if ((window as any).dashboardChannel) {
        supabase.removeChannel((window as any).dashboardChannel);
      }
    };
  }, []);

  // Prepare chart data with better aggregation
  const timelineData = executions
    .reduce((acc, exec) => {
      const date = new Date(exec.timestamp).toLocaleDateString();
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.count += 1;
        if (exec.status === 'success') existing.success += 1;
        else if (exec.status === 'error' || exec.status === 'failed') existing.failed += 1;
      } else {
        acc.push({
          date,
          count: 1,
          success: exec.status === 'success' ? 1 : 0,
          failed: exec.status === 'error' || exec.status === 'failed' ? 1 : 0
        });
      }
      return acc;
    }, [] as Array<{date: string, count: number, success: number, failed: number}>)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30);

  // Fixed pie chart data using actual counts
  const successful = executions.filter(e => e.status === 'success').length;
  const failed = executions.filter(e => e.status === 'error' || e.status === 'failed').length;
  const pieData = [
    { name: 'Success', value: successful, color: 'hsl(var(--primary))' },
    { name: 'Failed', value: failed, color: 'hsl(var(--destructive))' }
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <PremiumLayout title="Dashboard Analytics">
        <div className="container mx-auto p-6 space-y-8 animate-fade-in">
          {/* Loading Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-muted/50 rounded w-64 mb-2 loading-pulse"></div>
              <div className="h-4 bg-muted/30 rounded w-96 loading-pulse"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-10 bg-muted/50 rounded w-32 loading-pulse"></div>
              <div className="h-10 bg-muted/50 rounded w-32 loading-pulse"></div>
            </div>
          </div>

          {/* Loading KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-muted/50 rounded-lg loading-pulse"></div>
                    <div className="h-4 bg-muted/50 rounded w-24 loading-pulse"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted/50 rounded w-16 mb-2 loading-pulse"></div>
                  <div className="h-3 bg-muted/30 rounded w-20 loading-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="h-6 bg-muted/50 rounded w-48 loading-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/30 rounded loading-pulse"></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-6 bg-muted/50 rounded w-32 loading-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/30 rounded loading-pulse"></div>
              </CardContent>
            </Card>
          </div>

          {/* Loading Table */}
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted/50 rounded w-40 loading-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted/30 rounded loading-pulse"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </PremiumLayout>
    );
  }

  return (
    <ProtectedRoute>
      <PremiumLayout title="Enterprise Analytics Dashboard">
        <div className="container mx-auto p-6 space-y-8 animate-fade-in">
          {/* Premium Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                Преглед на данните
              </h1>
              <p className="text-muted-foreground text-lg">
                Наблюдавай активността по обработката на данни в реално време
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Enhanced Controls */}
              <div className="flex items-center gap-3 p-3 bg-card/50 backdrop-blur-sm rounded-lg border">
                <Filter className="h-4 w-4 text-primary" />
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="w-36 input-premium"
                />
                <span className="text-sm text-muted-foreground font-medium">до</span>
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="w-36 input-premium"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-2"
                  onClick={fetchDashboardData}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </Button>
              </div>
              
              {/* Project Filter - Enhanced */}
              {(projects.length > 1 || (!shouldShowAdminFeatures() && projects.length > 0)) && (
                <Select value={selectedProject} onValueChange={handleProjectChange}>
                  <SelectTrigger className="w-[220px] bg-card/50 backdrop-blur-sm">
                    <SelectValue placeholder="Избери папка" />
                  </SelectTrigger>
                  <SelectContent>
                    {shouldShowAdminFeatures() && <SelectItem value="all">Всички папки</SelectItem>}
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                        <Badge variant="secondary" className="ml-2">
                          {project.data_table}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Enhanced Client Mode Display */}
              {viewMode === 'client' && projects.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-card/50 backdrop-blur-sm rounded-lg border">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Данни от:</span>
                  <Badge variant="outline" className="status-success">
                    {projects.find(p => p.id === selectedProject)?.name || 'Неизвестен проект'}
                  </Badge>
                </div>
              )}
            </div>
          </div>

        {/* Premium KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PremiumKPICard
            title="Total Items Processed"
            value={kpiData.totalProcessed}
            icon={Activity}
            description="Total records processed"
            trend="up"
            gradient={true}
            change={{ value: 12.5, type: 'increase' }}
          />
          
          <PremiumKPICard
            title="Success Rate"
            value={`${kpiData.successRate.toFixed(1)}%`}
            icon={CheckCircle}
            description="Processing success rate"
            trend={kpiData.successRate > 90 ? 'up' : 'down'}
            gradient={true}
          />
          
          <PremiumKPICard
            title="Failed Operations"
            value={kpiData.failedOps}
            icon={XCircle}
            description="Operations with errors"
            trend={kpiData.failedOps > 0 ? 'down' : 'neutral'}
          />
          
          <PremiumKPICard
            title="Last Update"
            value={new Date(kpiData.lastUpdate).toLocaleDateString()}
            icon={Clock}
            description="Most recent activity"
            trend="neutral"
          />
          
          <PremiumKPICard
            title="Avg Processing Time"
            value={`${kpiData.avgProcessingTime.toFixed(0)}ms`}
            icon={TrendingUp}
            description="Average execution duration"
            trend="up"
          />
          
          <PremiumKPICard
            title="Data Volume"
            value={`${kpiData.dataVolume.toFixed(1)} MB`}
            icon={Database}
            description="Total data processed"
            trend="up"
            gradient={true}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="success" stackId="a" fill="hsl(var(--primary))" />
                    <Bar dataKey="failed" stackId="a" fill="hsl(var(--destructive))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Success/Failure Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Processing History Table */}
        <Card>
          <CardHeader>
            <CardTitle>История на обработката</CardTitle>
            <CardDescription>
              {executions.length === 0 
                ? "Няма данни за изпълнения. Добавете реални данни в Admin панела → 'Реални данни' таб."
                : "Последни записи от изпълнените операции"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {executions.length === 0 ? (
              <div className="text-center py-12">
                <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Няма реални данни</h3>
                <p className="text-muted-foreground mb-6">
                  Демо данните са премахнати. Добавете реални проекти и изпълнения в Admin панела.
                </p>
                <Button onClick={() => window.location.href = '/admin'}>
                  Отиди в Admin панела
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Работен процес</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Продължителност</TableHead>
                    <TableHead>Стойност</TableHead>
                    <TableHead>Време</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.slice(0, 10).map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell className="font-medium">{execution.workflow_name}</TableCell>
                      <TableCell>
                        <Badge variant={execution.status === 'success' ? 'default' : 'destructive'}>
                          {execution.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{execution.duration_ms}ms</TableCell>
                      <TableCell>${execution.cost_usd?.toFixed(4) || '0.0000'}</TableCell>
                      <TableCell>{new Date(execution.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Export Manager */}
        <ExportManager
          data={executions}
          kpiData={{
            totalExec: kpiData.totalProcessed,
            successRate: kpiData.successRate / 100,
            avgDuration: kpiData.avgProcessingTime,
            lastActivity: kpiData.lastUpdate
          }}
          conversations={(() => {
            // Return appropriate chat data based on selected project
            const currentProject = projects.find(p => p.id === selectedProject);
            const projectDataTable = currentProject?.data_table;
            
            if (projectDataTable === 'mulchbg') {
              return mulchDocuments.map(doc => ({
                id: doc.id,
                session_id: doc.session_id,
                message: typeof doc.message === 'string' ? doc.message : JSON.stringify(doc.message),
                timestamp: new Date()
              }));
            } else if (projectDataTable === 'n8n_chat_histories') {
              return documents.map(doc => ({
                id: doc.id,
                session_id: `n8n_${doc.id}`,
                message: doc.content,
                timestamp: new Date()
              }));
            } else if (selectedProject === 'all') {
              // For "all" projects, combine both types of data
              const allConversations = [];
              
              // Add mulch conversations
              allConversations.push(...mulchDocuments.map(doc => ({
                id: doc.id,
                session_id: doc.session_id,
                message: typeof doc.message === 'string' ? doc.message : JSON.stringify(doc.message),
                timestamp: new Date()
              })));
              
              // Add n8n conversations
              allConversations.push(...documents.map(doc => ({
                id: doc.id,
                session_id: `n8n_${doc.id}`,
                message: doc.content,
                timestamp: new Date()
              })));
              
              return allConversations;
            }
            
            return [];
          })()}
          onRefresh={fetchDashboardData}
          onDateRangeChange={(startDate, endDate) => {
            setDateRange({
              from: startDate.toISOString().split('T')[0],
              to: endDate.toISOString().split('T')[0]
            });
          }}
          className="mb-6"
        />

        {/* Project-Specific Chat Section - SIMPLIFIED */}
        {(() => {
          // Определи кой проект да показва
          let targetProjectId = selectedProject;
          
          // За non-admin потребители - винаги използвай техния назначен проект
          if (!shouldShowAdminFeatures() && assignedProjectId) {
            targetProjectId = assignedProjectId;
          }
          
          // Ако няма проект - не показвай чат
          if (!targetProjectId || targetProjectId === 'all') {
            return (
              <Card>
                <CardContent className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Изберете проект за да видите чат съобщенията</p>
                </CardContent>
              </Card>
            );
          }

          const currentProject = projects.find(p => p.id === targetProjectId);
          const projectDataTable = currentProject?.data_table || 'executions';
          
          console.log('Показвам чат за проект:', currentProject?.name, 'таблица:', projectDataTable);

          // Mulch проекти - показвай mulch чат
          if (projectDataTable === 'mulchbg' && mulchDocuments.length > 0) {
            // Филтрирай само за този проект
            const projectMulchData = mulchDocuments.filter(doc => doc.project_id === targetProjectId);
            
            if (projectMulchData.length === 0) {
              return (
                <Card>
                  <CardContent className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Няма чат съобщения</h3>
                    <p className="text-muted-foreground">Все още няма чат данни за проект "{currentProject?.name}"</p>
                  </CardContent>
                </Card>
              );
            }
            
            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Чат съобщения - {currentProject?.name}</h2>
                  <Badge variant="outline">{projectMulchData.length} съобщения</Badge>
                </div>
                
                <div className="grid gap-6 lg:grid-cols-2">
                  <ConversationView 
                    messages={projectMulchData.map(doc => ({
                      id: doc.id,
                      session_id: doc.session_id,
                      message: doc.message,
                      timestamp: undefined
                    }))}
                    title="Разговори"
                    showSessionGroups={true}
                    maxHeight="400px"
                  />
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Последни съобщения</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Session</TableHead>
                            <TableHead>Съобщение</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectMulchData.slice(0, 8).map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell>
                                <Badge variant="outline" className="font-mono text-xs">
                                  {doc.session_id.substring(0, 10)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <ExpandableMessage 
                                  message={doc.message}
                                  recordId={doc.id}
                                  sessionId={doc.session_id}
                                  previewLength={60}
                                  variant="table"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          }
          
          // N8N/Document проекти - показвай document чат
          if ((projectDataTable === 'n8n_chat_histories' || projectDataTable === 'documents') && documents.length > 0) {
            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Документ чат - {currentProject?.name}</h2>
                  <Badge variant="outline">{documents.length} документа</Badge>
                </div>
                
                <div className="grid gap-6 lg:grid-cols-2">
                  <ConversationView 
                    messages={documents.map(doc => ({
                      id: doc.id,
                      session_id: `doc_${doc.id}`,
                      message: doc.content,
                      timestamp: undefined
                    }))}
                    title="Документи"
                    showSessionGroups={false}
                    maxHeight="400px"
                  />
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Съдържание на документите</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Съдържание</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {documents.slice(0, 8).map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell className="font-mono">{doc.id}</TableCell>
                              <TableCell>
                                <ExpandableMessage 
                                  message={doc.content}
                                  recordId={doc.id}
                                  previewLength={80}
                                  variant="table"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          }
          
          // Executions проекти - показвай че няма чат
          return (
            <Card>
              <CardContent className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Няма чат функция</h3>
                <p className="text-muted-foreground">
                  Проект "{currentProject?.name}" използва таблица за изпълнения и няма чат съобщения
                </p>
              </CardContent>
            </Card>
          );
        })()}
        </div>
      </PremiumLayout>
    </ProtectedRoute>
  );
};

export default Dashboard;