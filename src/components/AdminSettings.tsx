
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import AlertForm from "@/components/alerts/AlertForm";
import AlertList from "@/components/alerts/AlertList";
import { useQuery } from "@tanstack/react-query";
import { getAlerts } from "@/lib/api";
import { toast } from "sonner";

const AdminSettings = () => {
  const [isCreating, setIsCreating] = useState(false);
  
  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  });

  const handleExportAlerts = (format: "csv" | "json") => {
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
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Alerts exported as ${format.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Alert Management</h2>
        <div className="flex gap-2">
          {!isCreating && (
            <>
              <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Alert
              </Button>
              {alerts && alerts.length > 0 && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleExportAlerts("csv")}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExportAlerts("json")}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export JSON
                  </Button>
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
