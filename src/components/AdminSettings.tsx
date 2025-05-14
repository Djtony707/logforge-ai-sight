
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileJson, FileCsv } from "lucide-react";
import AlertForm from "@/components/alerts/AlertForm";
import AlertList from "@/components/alerts/AlertList";
import { useQuery } from "@tanstack/react-query";
import { getAlerts } from "@/lib/api";
import { toast } from "sonner";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { downloadBlob } from "@/lib/utils";

const AdminSettings = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  });

  const handleExportAlerts = (format: "csv" | "json") => {
    try {
      setIsExporting(true);
      
      if (!alerts || alerts.length === 0) {
        toast.error("No alerts to export");
        return;
      }

      let content: string;
      let filename: string;
      
      if (format === "csv") {
        // Generate CSV content
        const headers = "id,name,description,severity,query,is_active,created_at,last_triggered\n";
        const rows = alerts.map(alert => 
          `${alert.id},"${alert.name}","${alert.description || ''}",${alert.severity},"${alert.query}",${alert.is_active},${alert.created_at},${alert.last_triggered || ''}`
        ).join("\n");
        content = headers + rows;
        filename = "alerts_export.csv";
      } else {
        // Generate JSON content
        content = JSON.stringify(alerts, null, 2);
        filename = "alerts_export.json";
      }
      
      // Create and trigger download
      const blob = new Blob([content], { type: format === "csv" ? "text/csv" : "application/json" });
      downloadBlob(blob, filename);
      
      toast.success(`Alerts exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export Failed", {
        description: error instanceof Error ? error.message : "Failed to export alerts"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Alert Management</h2>
        <div className="flex flex-wrap gap-2">
          {!isCreating && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      New Alert
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create a new alert rule</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {alerts && alerts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <AlertDialog>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              onClick={() => {}} // Will be handled by AlertDialogAction
                              className="flex items-center gap-2"
                              disabled={isExporting}
                            >
                              <FileCsv className="h-4 w-4" />
                              Export CSV
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Export alerts as CSV file</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Export Alerts</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to export {alerts.length} alerts as CSV?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleExportAlerts("csv")}>Export</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <AlertDialog>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              onClick={() => {}} // Will be handled by AlertDialogAction
                              className="flex items-center gap-2"
                              disabled={isExporting}
                            >
                              <FileJson className="h-4 w-4" />
                              Export JSON
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Export alerts as JSON file</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Export Alerts</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to export {alerts.length} alerts as JSON?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleExportAlerts("json")}>Export</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isCreating ? (
        <AlertForm onCancel={() => setIsCreating(false)} />
      ) : (
        <AlertList />
      )}
    </div>
  );
};

export default AdminSettings;
