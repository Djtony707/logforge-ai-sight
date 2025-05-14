
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Download, Search } from "lucide-react";

interface LogEntry {
  id: string;
  ts: string;
  host: string;
  app: string;
  severity: "emergency" | "alert" | "critical" | "error" | "warning" | "notice" | "info" | "debug";
  msg: string;
}

interface SearchLogsProps {
  role: "admin" | "viewer" | null;
}

const severityColors = {
  emergency: "bg-red-600",
  alert: "bg-red-500",
  critical: "bg-red-400",
  error: "bg-orange-500",
  warning: "bg-yellow-500",
  notice: "bg-blue-500",
  info: "bg-green-500",
  debug: "bg-gray-500",
};

const severityOptions = ["emergency", "alert", "critical", "error", "warning", "notice", "info", "debug"];

const SearchLogs = ({ role }: SearchLogsProps) => {
  const [searchResults, setSearchResults] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [host, setHost] = useState("");
  const [app, setApp] = useState("");
  const [severity, setSeverity] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [useRegex, setUseRegex] = useState(false);
  
  const handleSearch = async () => {
    setIsLoading(true);
    try {
      // This would be replaced with an actual API call in a real implementation
      // Mock API call for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock search results
      const mockResults: LogEntry[] = [
        {
          id: "1",
          ts: new Date().toISOString(),
          host: "server1.example.com",
          app: "nginx",
          severity: "warning",
          msg: "High CPU usage detected",
        },
        {
          id: "2",
          ts: new Date().toISOString(),
          host: "db.example.com",
          app: "postgres",
          severity: "error",
          msg: "Connection refused",
        },
      ];
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: "csv" | "json") => {
    if (searchResults.length === 0) return;
    
    let content: string;
    let filename: string;
    
    if (format === "csv") {
      const headers = "id,timestamp,host,app,severity,message\n";
      const rows = searchResults.map(log => 
        `${log.id},${log.ts},${log.host},${log.app},${log.severity},"${log.msg}"`
      ).join("\n");
      content = headers + rows;
      filename = "logforge_export.csv";
    } else {
      content = JSON.stringify(searchResults, null, 2);
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

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Search Logs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Time Range</label>
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Host</label>
            <Input 
              placeholder="Enter hostname" 
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Application</label>
            <Input 
              placeholder="Enter application name" 
              value={app}
              onChange={(e) => setApp(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Severity</label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                {severityOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Message Search
              <div className="flex items-center space-x-2 mt-1">
                <input
                  type="checkbox"
                  id="useRegex"
                  checked={useRegex}
                  onChange={(e) => setUseRegex(e.target.checked)}
                  className="mr-1"
                />
                <label htmlFor="useRegex" className="text-xs text-gray-600">Use regex</label>
              </div>
            </label>
            <Input 
              placeholder={useRegex ? "Regular expression pattern" : "Search term"} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <Button onClick={handleSearch} disabled={isLoading}>
            <Search className="mr-2 h-4 w-4" />
            {isLoading ? "Searching..." : "Search"}
          </Button>
          
          {role === "admin" && searchResults.length > 0 && (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => handleExport("csv")}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport("json")}>
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>App</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead className="w-full">Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">{formatTimestamp(log.ts)}</TableCell>
                  <TableCell className="whitespace-nowrap">{log.host}</TableCell>
                  <TableCell className="whitespace-nowrap">{log.app}</TableCell>
                  <TableCell>
                    <Badge className={severityColors[log.severity]}>
                      {log.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{log.msg}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default SearchLogs;
