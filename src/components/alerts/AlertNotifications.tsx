
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, BellRing, X, HelpCircle } from "lucide-react";
import { severityColors } from "@/lib/constants";
import { useAlertWebSocket, AlertNotification } from "@/hooks/useAlertWebSocket";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const AlertNotifications = () => {
  const { notifications, clearNotifications } = useAlertWebSocket();
  const [isMinimized, setIsMinimized] = useState(false);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Card className={`fixed bottom-4 right-4 shadow-lg transition-all duration-300 z-50 ${
      isMinimized ? 'w-14 h-14 overflow-hidden' : 'w-full max-w-xs md:max-w-sm'
    }`}>
      {isMinimized ? (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-0 left-0 right-0 bottom-0 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center"
          onClick={() => setIsMinimized(false)}
        >
          <BellRing className="h-6 w-6 text-red-600" />
          <span className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {notifications.length}
          </span>
        </Button>
      ) : (
        <>
          <CardHeader className="py-3 flex flex-row items-center justify-between bg-red-50">
            <div>
              <CardTitle className="text-md flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                Alert Notifications
              </CardTitle>
              <CardDescription>
                {notifications.length} recent alerts
              </CardDescription>
            </div>
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsMinimized(true)}
                      className="h-8 w-8"
                    >
                      <BellRing className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Minimize notifications</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={clearNotifications}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear all notifications</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="py-2 max-h-60 overflow-y-auto">
            <ul className="space-y-2">
              {notifications.map((notification, index) => (
                <li key={index} className="border-b last:border-b-0 pb-2 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{notification.alert_name}</span>
                    <Badge className={severityColors[notification.severity as keyof typeof severityColors]}>
                      {notification.severity}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(notification.triggered_at).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </>
      )}
    </Card>
  );
};

export default AlertNotifications;
