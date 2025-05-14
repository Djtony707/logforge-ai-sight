
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Search as SearchIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SearchLogsParams } from "@/lib/api";
import { severityOptions } from "@/lib/constants";

interface SearchFormProps {
  onSearch: (params: SearchLogsParams) => void;
  isSearching: boolean;
}

const SearchForm = ({ onSearch, isSearching }: SearchFormProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [host, setHost] = useState("");
  const [app, setApp] = useState("");
  const [severity, setSeverity] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [useRegex, setUseRegex] = useState(false);
  
  const handleSearch = () => {
    onSearch({
      start_date: startDate?.toISOString(),
      end_date: endDate?.toISOString(),
      host: host || undefined,
      app: app || undefined,
      severity: severity === 'all' ? undefined : severity,
      message: searchTerm || undefined,
      use_regex: useRegex
    });
  };
  
  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Search Logs</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Time Range</label>
          <div className="flex flex-col sm:flex-row gap-2">
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="block text-sm font-medium mb-1 cursor-help">Host</label>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Filter logs by source hostname</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Input 
            placeholder="Enter hostname" 
            value={host}
            onChange={(e) => setHost(e.target.value)}
          />
        </div>
        
        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="block text-sm font-medium mb-1 cursor-help">Application</label>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Filter logs by application name</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Input 
            placeholder="Enter application name" 
            value={app}
            onChange={(e) => setApp(e.target.value)}
          />
        </div>
        
        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="block text-sm font-medium mb-1 cursor-help">Severity</label>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Filter logs by severity level</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="block text-sm font-medium mb-1 cursor-help">
                  Message Search
                </label>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Search log messages by text or regular expressions</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex items-center space-x-2 mt-1 mb-1">
            <input
              type="checkbox"
              id="useRegex"
              checked={useRegex}
              onChange={(e) => setUseRegex(e.target.checked)}
              className="mr-1"
            />
            <label htmlFor="useRegex" className="text-xs text-gray-600">Use regex</label>
          </div>
          <Input 
            placeholder={useRegex ? "Regular expression pattern" : "Search term"} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <Button onClick={handleSearch} disabled={isSearching}>
          <SearchIcon className="mr-2 h-4 w-4" />
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </div>
    </div>
  );
};

export default SearchForm;
