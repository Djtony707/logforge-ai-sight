
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { fetchApi } from "@/lib/api";

interface LogExample {
  id: string;
  ts: string;
  host: string;
  app: string;
  severity: string;
  msg: string;
}

interface LogPattern {
  pattern: string;
  count: number;
  examples: LogExample[];
}

const PatternAnalysisSection = () => {
  const [expanded, setExpanded] = useState<string[]>([]);

  const {
    data: patterns,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["logPatterns"],
    queryFn: async () => {
      return fetchApi<LogPattern[]>("/logs/patterns");
    },
  });

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Analyzing log patterns...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-500 flex flex-col items-center space-y-2">
        <p>Failed to load log patterns</p>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  if (!patterns || patterns.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No recurring patterns detected in recent logs
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-muted-foreground">
          Displaying {patterns.length} recurring log patterns
        </span>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <Accordion type="multiple" value={expanded} onValueChange={setExpanded}>
        {patterns.map((pattern, index) => (
          <AccordionItem value={`item-${index}`} key={index}>
            <AccordionTrigger className="hover:bg-muted/50 px-2 rounded-md">
              <div className="flex items-center space-x-2 text-left">
                <FileCode className="h-4 w-4 text-muted-foreground" />
                <div className="font-mono text-xs truncate max-w-[300px]">
                  {pattern.pattern.length > 60
                    ? pattern.pattern.slice(0, 60) + "..."
                    : pattern.pattern}
                </div>
                <Badge variant="outline" className="ml-2">
                  {pattern.count} occurrences
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pl-6">
                <div className="text-xs text-muted-foreground mb-2">
                  Pattern template:
                </div>
                <pre className="bg-muted p-2 rounded-md text-xs font-mono overflow-x-auto">
                  {pattern.pattern}
                </pre>

                <div className="text-xs text-muted-foreground mt-4 mb-2">
                  Example logs:
                </div>
                {pattern.examples.map((example, i) => (
                  <Card key={i} className="p-2 text-xs font-mono mb-2">
                    <div className="flex justify-between text-muted-foreground mb-1">
                      <span>
                        {example.host} / {example.app}
                      </span>
                      <span>{new Date(example.ts).toLocaleString()}</span>
                    </div>
                    <div className={`text-${example.severity}`}>
                      {example.msg}
                    </div>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default PatternAnalysisSection;
