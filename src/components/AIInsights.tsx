
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, Info, FileCode } from "lucide-react";
import NaturalLanguageSearch from "./ai/NaturalLanguageSearch";
import ForecastSection from "./ai/ForecastSection";
import AnomalySection from "./ai/AnomalySection";
import PatternAnalysisSection from "./ai/PatternAnalysisSection";

const AIInsights = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="mr-2 h-5 w-5" />
            Natural Language Search
          </CardTitle>
          <CardDescription>
            Ask questions about your logs in plain English
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NaturalLanguageSearch />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Log Volume Forecast (7 Days)
          </CardTitle>
          <CardDescription>
            Predicted daily log volume for the next week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForecastSection />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Live Anomalies
          </CardTitle>
          <CardDescription>
            Unusual log patterns detected in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnomalySection />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileCode className="mr-2 h-5 w-5" />
            Log Pattern Analysis
          </CardTitle>
          <CardDescription>
            Recurring patterns identified in your logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PatternAnalysisSection />
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsights;
