
import React from "react";
import { Button } from "@/components/ui/button";
import AlertNotifications from "@/components/alerts/AlertNotifications";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface DashboardProps {
  children: React.ReactNode;
  role: "admin" | "viewer" | null;
  onLogout: () => void;
}

const Dashboard = ({ children, role, onLogout }: DashboardProps) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-primary text-white p-3 sm:p-4 shadow-md">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold">LogForge AI</h1>
            <span className="bg-white/20 px-2 py-1 rounded text-xs">
              {role === "admin" ? "Admin" : "Viewer"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="text-white border-white hover:bg-white/20">
                    <HelpCircle className="h-4 w-4 mr-1" />
                    Help
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>View documentation and help resources</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="text-white border-white hover:bg-white/20" 
              onClick={onLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-3 md:p-6">
        {children}
      </main>
      <footer className="container mx-auto p-4 text-center text-sm text-gray-500 border-t">
        <p>LogForge AI - Local-only syslog dashboard with AI insights</p>
      </footer>
      
      {/* Alert notifications component */}
      <AlertNotifications />
    </div>
  );
};

export default Dashboard;
