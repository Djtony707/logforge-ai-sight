
import { Shield, ShieldOff, FileExport, FileX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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

interface Alert {
  id: number;
  name: string;
  description: string;
  severity: string;
  query: string;
  is_active: boolean;
}

interface AlertCardProps {
  alert: Alert;
  onEdit: () => void;
  onToggle: (isActive: boolean) => void;
  onDelete: () => void;
}

const severityColors = {
  info: "bg-blue-500",
  warning: "bg-yellow-500",
  error: "bg-orange-500",
  critical: "bg-red-600",
};

const AlertCard = ({ alert, onEdit, onToggle, onDelete }: AlertCardProps) => {
  return (
    <div className={`border rounded-lg overflow-hidden ${alert.is_active ? 'bg-white' : 'bg-gray-50'}`}>
      <div className="p-4 flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium">{alert.name}</h3>
            <Badge className={severityColors[alert.severity as keyof typeof severityColors]}>
              {alert.severity}
            </Badge>
            {!alert.is_active && (
              <Badge variant="outline" className="border-gray-300 text-gray-500">
                Inactive
              </Badge>
            )}
          </div>
          <p className="text-gray-600">{alert.description}</p>
          <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 font-mono text-sm overflow-x-auto">
            {alert.query}
          </div>
        </div>
        
        <div className="flex flex-col items-center space-y-2 ml-4">
          <div className="flex items-center space-x-2">
            {alert.is_active ? (
              <Shield className="h-4 w-4 text-green-500" />
            ) : (
              <ShieldOff className="h-4 w-4 text-gray-400" />
            )}
            <Switch
              checked={alert.is_active}
              onCheckedChange={onToggle}
            />
          </div>
        </div>
      </div>
      
      <div className="border-t px-4 py-3 bg-gray-50 flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <FileExport className="h-4 w-4 mr-1" />
          Edit
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-800 border-red-200 hover:border-red-300">
              <FileX className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Alert</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the "{alert.name}" alert? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AlertCard;
