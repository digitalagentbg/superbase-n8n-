import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Download, 
  FileText, 
  Mail, 
  Calendar as CalendarIcon, 
  Settings,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

interface ExportManagerProps {
  data?: any[];
  kpiData?: any;
  chartData?: any;
  conversations?: any[];
  onRefresh?: () => void;
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
  className?: string;
}

export const ExportManager = ({ 
  data = [], 
  kpiData, 
  chartData, 
  conversations = [],
  onRefresh,
  onDateRangeChange,
  className 
}: ExportManagerProps) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeConversations, setIncludeConversations] = useState(true);
  const [companyName, setCompanyName] = useState('Your Company');
  const [reportTitle, setReportTitle] = useState('Dashboard Report');
  const [emailFrequency, setEmailFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailScheduled, setEmailScheduled] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isExporting, setIsExporting] = useState(false);

  const handleDateRangeChange = () => {
    onDateRangeChange?.(startDate, endDate);
    toast({
      title: "Date Range Updated",
      description: `Showing data from ${format(startDate, 'MMM dd')} to ${format(endDate, 'MMM dd')}`,
    });
  };

  const exportToPDF = async () => {
    try {
      setIsExporting(true);
      
      // Create PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header with company branding
      pdf.setFontSize(20);
      pdf.setTextColor(59, 130, 246); // Primary blue
      pdf.text(companyName, 20, 30);
      
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(reportTitle, 20, 45);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, 55);
      pdf.text(`Date Range: ${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd')}`, 20, 62);
      
      // Add separator line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, 70, pageWidth - 20, 70);
      
      let yPosition = 85;
      
      // KPI Summary
      if (kpiData) {
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Key Performance Indicators', 20, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(10);
        const kpiItems = [
          { label: 'Total Executions', value: kpiData.totalExec || 0 },
          { label: 'Success Rate', value: `${((kpiData.successRate || 0) * 100).toFixed(1)}%` },
          { label: 'Average Duration', value: `${(kpiData.avgDuration || 0).toFixed(0)}ms` },
          { label: 'Last Activity', value: kpiData.lastActivity ? format(new Date(kpiData.lastActivity), 'MMM dd, HH:mm') : 'N/A' }
        ];
        
        kpiItems.forEach((item, index) => {
          const x = 20 + (index % 2) * 90;
          const y = yPosition + Math.floor(index / 2) * 8;
          pdf.text(`${item.label}: ${item.value}`, x, y);
        });
        
        yPosition += 25;
      }
      
      // Recent Activity Table
      if (data.length > 0) {
        pdf.setFontSize(14);
        pdf.text('Recent Activity', 20, yPosition);
        yPosition += 15;
        
        // Table headers
        pdf.setFontSize(8);
        pdf.setTextColor(60, 60, 60);
        const headers = ['Workflow', 'Status', 'Time', 'Duration'];
        const colWidths = [60, 30, 40, 30];
        let xPos = 20;
        
        headers.forEach((header, index) => {
          pdf.text(header, xPos, yPosition);
          xPos += colWidths[index];
        });
        
        yPosition += 8;
        pdf.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += 5;
        
        // Table data (first 15 rows)
        const displayData = data.slice(0, 15);
        displayData.forEach((row, index) => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = 30;
          }
          
          pdf.setTextColor(0, 0, 0);
          let xPos = 20;
          
          const rowData = [
            row.workflow_name || row.name || 'N/A',
            row.status || 'Unknown',
            row.timestamp ? format(new Date(row.timestamp), 'MMM dd HH:mm') : 'N/A',
            row.duration_ms ? `${row.duration_ms}ms` : 'N/A'
          ];
          
          rowData.forEach((cell, cellIndex) => {
            const cellText = String(cell).substring(0, 25);
            pdf.text(cellText, xPos, yPosition);
            xPos += colWidths[cellIndex];
          });
          
          yPosition += 6;
        });
      }
      
      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`${companyName} - Confidential Report`, 20, pageHeight - 10);
      pdf.text(`Page 1`, pageWidth - 30, pageHeight - 10);
      
      // Save PDF
      pdf.save(`${reportTitle.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "Export Complete",
        description: "PDF report has been downloaded successfully",
      });
      
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = () => {
    try {
      setIsExporting(true);
      
      const workbook = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        ['Report Title', reportTitle],
        ['Company', companyName],
        ['Generated On', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
        ['Date Range', `${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`],
        [''],
        ['KPI Summary'],
        ...(kpiData ? [
          ['Total Executions', kpiData.totalExec || 0],
          ['Success Rate', ((kpiData.successRate || 0) * 100).toFixed(1) + '%'],
          ['Average Duration (ms)', (kpiData.avgDuration || 0).toFixed(0)],
          ['Last Activity', kpiData.lastActivity || 'N/A']
        ] : [])
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Data sheet
      if (data.length > 0) {
        const dataSheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, dataSheet, 'Data');
      }
      
      // Conversations sheet
      if (conversations.length > 0 && includeConversations) {
        const conversationsSheet = XLSX.utils.json_to_sheet(conversations);
        XLSX.utils.book_append_sheet(workbook, conversationsSheet, 'Conversations');
      }
      
      // Export
      XLSX.writeFile(workbook, `${reportTitle.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "Export Complete",
        description: "Excel file has been downloaded successfully",
      });
      
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate Excel file",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    try {
      setIsExporting(true);
      
      if (data.length === 0) {
        toast({
          title: "No Data",
          description: "No data available to export",
          variant: "destructive",
        });
        return;
      }
      
      // Convert JSON to CSV using XLSX
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportTitle.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Complete",
        description: "CSV file has been downloaded successfully",
      });
      
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate CSV file",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    switch (exportFormat) {
      case 'pdf':
        exportToPDF();
        break;
      case 'excel':
        exportToExcel();
        break;
      case 'csv':
        exportToCSV();
        break;
    }
  };

  const scheduleEmailReport = async () => {
    if (!recipientEmail) {
      toast({
        title: "Missing Email",
        description: "Please enter recipient email address",
        variant: "destructive",
      });
      return;
    }

    try {
      // In a real implementation, you would call your email scheduling API here
      // For now, we'll just simulate the scheduling
      setEmailScheduled(true);
      
      toast({
        title: "Email Scheduled",
        description: `${emailFrequency} reports will be sent to ${recipientEmail}`,
      });
      
    } catch (error) {
      console.error('Email scheduling error:', error);
      toast({
        title: "Scheduling Failed",
        description: "Failed to schedule email reports",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={`shadow-premium ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Export & Reporting
            </CardTitle>
            <CardDescription>
              Generate professional reports and schedule automated delivery
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Date Range</Label>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(startDate, 'MMM dd')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(endDate, 'MMM dd')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleDateRangeChange} variant="secondary" size="sm">
              Apply
            </Button>
          </div>
        </div>

        <Separator />

        {/* Export Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Export Settings</h4>
            
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your Company Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="report-title">Report Title</Label>
              <Input
                id="report-title"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Dashboard Report"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PDF Report
                    </div>
                  </SelectItem>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Excel Workbook
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      CSV Data
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="include-charts">Include Charts</Label>
                <Switch
                  id="include-charts"
                  checked={includeCharts}
                  onCheckedChange={setIncludeCharts}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="include-conversations">Include Conversations</Label>
                <Switch
                  id="include-conversations"
                  checked={includeConversations}
                  onCheckedChange={setIncludeConversations}
                />
              </div>
            </div>
          </div>

          {/* Email Scheduling */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Email Scheduling</h4>
            
            <div className="space-y-2">
              <Label htmlFor="recipient-email">Recipient Email</Label>
              <Input
                id="recipient-email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="recipient@company.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={emailFrequency} onValueChange={(value: any) => setEmailFrequency(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={scheduleEmailReport}
              className="w-full gap-2"
              variant={emailScheduled ? "secondary" : "default"}
            >
              <Mail className="h-4 w-4" />
              {emailScheduled ? "Email Scheduled" : "Schedule Email Reports"}
            </Button>

            {emailScheduled && (
              <div className="text-sm text-success bg-success/10 p-2 rounded-md">
                <Clock className="h-4 w-4 inline mr-2" />
                {emailFrequency} reports scheduled for {recipientEmail}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Export Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2 min-w-[140px]"
            variant="premium"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};