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
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { fetchApi, SearchLogsParams } from "@/lib/api";
import { severityColors, severityOptions } from "@/lib/constants";

interface LogEntry {
  id: string;
  ts: string;
  host: string;
  app: string;
  severity: "emergency" | "alert" | "critical" | "error" | "warning" | "notice" | "info" | "debug";
  msg: string;
  is_anomaly?: boolean;
  anomaly_score?: number;
}

interface SearchLogsProps {
  role: "admin" | "viewer" | null;
}

const SearchLogs = ({ role }: SearchLogsProps) => {
  const [searchResults, setSearchResults] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [host, setHost] = useState("");
  const [app, setApp] = useState("");
  const [severity, setSeverity] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [useRegex, setUseRegex] = useState(false);
  const toast = useToast();
  
  const searchMutation = useMutation({
    mutationFn: async (params: SearchLogsParams) => {
      return fetchApi<LogEntry[]>("/logs/search", {
        method: "POST",
        body: params,
      });
    },
    onSuccess: (data) => {
      setSearchResults(data);
      toast.success("Search completed", `Found ${data.length} results`);
    },
    onError: (error) => {
      console.error("Search failed:", error);
      toast.error("Search Failed", error instanceof Error ? error.message : "An unknown error occurred");
      setSearchResults([]);
    }
  });
  
  const handleSearch = () => {
    // In development mode without backend, use mock data
    if (process.env.NODE_ENV === "development" && !import.meta.env.VITE_API_URL) {
      const mockResults: LogEntry[] = Array(20).fill(0).map((_, i) => ({
        id: `mock-${i}`,
        ts: new Date(Date.now() - i * 3600000).toISOString(),
        host: ["server1", "db-primary", "web-frontend"][i % 3] + ".example.com",
        app: ["nginx", "postgres", "app-server"][i % 3],
        severity: ["info", "warning", "error", "critical"][i % 4] as any,
        msg: `Sample log message ${i} matching "${searchTerm}"`,
        is_anomaly: i % 7 === 0,
        anomaly_score: i % 7 === 0 ? Math.random() : undefined
      }));
      setSearchResults(mockResults);
      return;
    }
    
    // Use React Query for real API call
    searchMutation.mutate({
      start_date: startDate?.toISOString(),
      end_date: endDate?.toISOString(),
      host: host || undefined,
      app: app || undefined,
      severity: severity === 'all' ? undefined : severity,
      message: searchTerm || undefined,
      use_regex: useRegex
    });
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
          <Button onClick={handleSearch} disabled={searchMutation.isPending}>
            <Search className="mr-2 h-4 w-4" />
            {searchMutation.isPending ? "Searching..." : "Search"}
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
                <TableRow key={log.id} className={log.is_anomaly ? "bg-red-50" : undefined}>
                  <TableCell className="whitespace-nowrap">{formatTimestamp(log.ts)}</TableCell>
                  <TableCell className="whitespace-nowrap">{log.host}</TableCell>
                  <TableCell className="whitespace-nowrap">{log.app}</TableCell>
                  <TableCell>
                    <Badge className={severityColors[log.severity]}>
                      {log.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.is_anomaly && (
                      <Badge variant="outline" className="mr-2 border-red-300 text-red-700">
                        Anomaly {log.anomaly_score?.toFixed(2)}
                      </Badge>
                    )}
                    {log.msg}
                  </TableCell>
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
