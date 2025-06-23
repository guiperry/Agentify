'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Play, Square, RefreshCw, CheckCircle, XCircle, Clock, Zap } from "lucide-react";

interface TestRunnerProps {
  repoUrl: string;
  agentConfig: {
    name: string;
    personality: string;
    instructions: string;
    features: Record<string, boolean>;
    // Other relevant config properties
  };
}

interface TestResult {
  name: string;
  status: "passed" | "failed" | "running" | "pending";
  duration: number;
  error?: string;
}

const TestRunner = ({ repoUrl, agentConfig }: TestRunnerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: "User authentication flow", status: "passed", duration: 1.2 },
    { name: "API data fetching", status: "passed", duration: 0.8 },
    { name: "Component rendering", status: "failed", duration: 0.5, error: "Expected 3 elements, got 2" },
    { name: "Form validation", status: "passed", duration: 0.9 },
    { name: "Error handling", status: "failed", duration: 0.3, error: "TypeError: Cannot read property 'data'" },
    { name: "Navigation routing", status: "passed", duration: 1.1 }
  ]);
  
  const [autoFix, setAutoFix] = useState(false);
  const [testLoopCount, setTestLoopCount] = useState(0);

  const runTests = () => {
    setIsRunning(true);
    setTestLoopCount(prev => prev + 1);
    
    // Simulate test running
    const newResults = testResults.map(test => ({
      ...test,
      status: "running" as const
    }));
    setTestResults(newResults);

    // Simulate test completion over time
    let completedTests = 0;
    const testInterval = setInterval(() => {
      completedTests++;
      setTestResults(prev => prev.map((test, index) => {
        if (index < completedTests) {
          // Simulate some tests passing after fixes
          const shouldPass = Math.random() > 0.2 || (autoFix && test.status === "failed");
          return {
            ...test,
            status: shouldPass ? "passed" : "failed",
            duration: Math.random() * 2,
            error: shouldPass ? undefined : test.error
          };
        }
        return test;
      }));

      if (completedTests >= testResults.length) {
        clearInterval(testInterval);
        setIsRunning(false);
      }
    }, 800);
  };

  const stopTests = () => {
    setIsRunning(false);
    setTestResults(prev => prev.map(test => 
      test.status === "running" ? { ...test, status: "pending" } : test
    ));
  };

  const runAutoFix = () => {
    setAutoFix(true);
    console.log("Auto-fix enabled - will attempt to fix failing tests");
    runTests();
  };

  const passedTests = testResults.filter(t => t.status === "passed").length;
  const failedTests = testResults.filter(t => t.status === "failed").length;
  const runningTests = testResults.filter(t => t.status === "running").length;
  const totalTests = testResults.length;
  const passRate = (passedTests / totalTests) * 100;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "running":
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case "pending":
        return <Clock className="w-4 h-4 text-slate-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Test Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Test Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button 
              onClick={runTests}
              disabled={isRunning}
              className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>
            
            <Button 
              onClick={runAutoFix}
              disabled={isRunning}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Zap className="w-4 h-4 mr-2" />
              Run with Auto-Fix
            </Button>
            
            {isRunning && (
              <Button 
                onClick={stopTests}
                variant="outline"
                className="w-full border-red-400 text-red-400 hover:bg-red-400/10"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Tests
              </Button>
            )}
          </div>

          <div className="pt-4 border-t border-slate-700 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Test Loops</span>
              <Badge variant="outline" className="text-slate-300">{testLoopCount}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-emerald-400">Passed</span>
              <Badge className="bg-emerald-500/20 text-emerald-400">{passedTests}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-400">Failed</span>
              <Badge className="bg-red-500/20 text-red-400">{failedTests}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-400">Running</span>
              <Badge className="bg-blue-500/20 text-blue-400">{runningTests}</Badge>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-300">Pass Rate</span>
              <span className="text-white font-bold">{Math.round(passRate)}%</span>
            </div>
            <Progress value={passRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {testResults.map((test, index) => (
                <div 
                  key={index}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600"
                >
                  <div className="mt-0.5">
                    {getStatusIcon(test.status)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-200">{test.name}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          test.status === "passed" 
                            ? "text-emerald-400 border-emerald-400"
                            : test.status === "failed"
                              ? "text-red-400 border-red-400"
                              : test.status === "running"
                                ? "text-blue-400 border-blue-400"
                                : "text-slate-400 border-slate-400"
                        }`}
                      >
                        {test.status}
                      </Badge>
                      {test.status !== "running" && test.status !== "pending" && (
                        <span className="text-xs text-slate-400">
                          {test.duration.toFixed(1)}s
                        </span>
                      )}
                    </div>
                    {test.error && (
                      <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-300">
                        {test.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestRunner;
