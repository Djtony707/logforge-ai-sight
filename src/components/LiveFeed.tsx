
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLogWebSocket, LogEntry } from "@/hooks/useLogWebSocket";
import { severityColors } from "@/lib/constants";

const LiveFeed = () => {
  const { logs, isConnected } = useLogWebSocket(1000);
  const [autoScroll, setAutoScroll] = useState(true);

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleTimeString();
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Live Log Feed</h2>
          <p className="text-sm text-gray-500">
            Connection status: {isConnected ? (
              <span className="text-green-600">Connected</span>
            ) : (
              <span className="text-red-600">Disconnected</span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="mr-2"
            />
            Auto-scroll
          </label>
        </div>
      </div>
      <div className="overflow-auto max-h-[70vh]">
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
            {logs.length > 0 ? (
              logs.map((log) => (
                <TableRow 
                  key={log.id} 
                  className={log.is_anomaly ? "bg-red-50" : undefined}
                >
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Waiting for logs...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LiveFeed;
