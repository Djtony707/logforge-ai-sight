
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
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

interface ExportButtonsProps {
  results: LogEntry[];
}

const ExportButtons = ({ results }: ExportButtonsProps) => {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  
  if (results.length === 0) {
    return null;
  }

  const handleExport = () => {
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
  };

  return (
    <div className="flex space-x-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" onClick={() => setFormat("csv")}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export Data</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to export {results.length} log records as CSV?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleExport}>Export</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" onClick={() => setFormat("json")}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export Data</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to export {results.length} log records as JSON?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleExport}>Export</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExportButtons;
