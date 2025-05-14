
import { Button } from "@/components/ui/button";
import { FileJson, FileCsv, Download } from "lucide-react";
import { LogEntry } from "./SearchResults";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { exportLogs, SearchLogsParams } from "@/lib/api";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ExportButtonsProps {
  results: LogEntry[];
  searchParams?: SearchLogsParams;
}

const ExportButtons = ({ results, searchParams }: ExportButtonsProps) => {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [isExporting, setIsExporting] = useState(false);
  
  if (results.length === 0) {
    return null;
  }

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      if (!searchParams) {
        // Client-side export (for development/no API)
        let content: string;
        let filename: string;
        
        if (format === "csv") {
          const headers = "id,timestamp,host,app,severity,message\n";
          const rows = results.map(log => 
            `${log.id},${log.ts},${log.host},${log.app},${log.severity},"${log.msg}"`
          ).join("\n");
          content = headers + rows;
          filename = "logforge_export.csv";
        } else {
          content = JSON.stringify(results, null, 2);
          filename = "logforge_export.json";
        }
        
        const blob = new Blob([content], { type: format === "csv" ? "text/csv" : "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        
        toast.success(`Exported ${results.length} records as ${format.toUpperCase()}`);
      } else {
        // Use API for export (production)
        const { blob, filename } = await exportLogs(searchParams, format);
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        
        toast.success(`Exported ${results.length} records as ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export Failed", {
        description: error instanceof Error ? error.message : "Failed to export logs",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <TooltipProvider>
        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button variant="outline" onClick={() => setFormat("csv")} disabled={isExporting}>
                  <FileCsv className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export logs as CSV file</p>
            </TooltipContent>
          </Tooltip>
          
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Export Data</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to export {results.length} log records as CSV?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleExport} disabled={isExporting}>
                {isExporting ? "Exporting..." : "Export"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>

      <TooltipProvider>
        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button variant="outline" onClick={() => setFormat("json")} disabled={isExporting}>
                  <FileJson className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export logs as JSON file</p>
            </TooltipContent>
          </Tooltip>
          
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Export Data</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to export {results.length} log records as JSON?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleExport} disabled={isExporting}>
                {isExporting ? "Exporting..." : "Export"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>
    </div>
  );
};

export default ExportButtons;
