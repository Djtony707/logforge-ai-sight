
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { severityColors } from "@/lib/constants";
import { formatTimestamp } from "@/lib/utils";

export interface LogEntry {
  id: string;
  ts: string;
  host: string;
  app: string;
  severity: "emergency" | "alert" | "critical" | "error" | "warning" | "notice" | "info" | "debug";
  msg: string;
  is_anomaly?: boolean;
  anomaly_score?: number;
}

interface SearchResultsProps {
  results: LogEntry[];
}

const SearchResults = ({ results }: SearchResultsProps) => {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto mt-6">
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
          {results.map((log) => (
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
  );
};

export default SearchResults;
