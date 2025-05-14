
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { severityColors } from "@/lib/constants";
import { Alert } from "@/lib/api";

interface AlertCardProps {
  alert: Alert;
  onDelete: () => void;
  onToggleActive: () => void;
}

const AlertCard = ({ alert, onDelete, onToggleActive }: AlertCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Card className={`${!alert.is_active ? 'bg-gray-50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">
              {alert.name}
              <Badge className={`ml-2 ${severityColors[alert.severity as keyof typeof severityColors]}`}>
                {alert.severity}
              </Badge>
            </CardTitle>
            <CardDescription>{alert.description}</CardDescription>
          </div>
          <Switch 
            checked={alert.is_active} 
            onCheckedChange={onToggleActive}
          />
        </div>
      </CardHeader>
      <CardContent className={`pb-2 ${showDetails ? '' : 'hidden'}`}>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Query pattern:</span> {alert.query}
          </div>
          <div>
            <span className="font-medium">Created:</span> {formatDate(alert.created_at)}
          </div>
          <div>
            <span className="font-medium">Last triggered:</span> {formatDate(alert.last_triggered)}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowDetails(!showDetails)}
        >
          <FileText className="mr-2 h-4 w-4" />
          {showDetails ? "Hide details" : "Show details"}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AlertCard;

