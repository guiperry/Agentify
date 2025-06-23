'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertTriangle, Activity, GitBranch, FileCode, TestTube } from "lucide-react";

interface StatusDashboardProps {
  repoUrl: string;
  agentConfig: {
    name: string;
    personality: string;
    instructions: string;
    features: Record<string, boolean>;
    // Other relevant config properties
  };
}

const StatusDashboard = ({ repoUrl, agentConfig }: StatusDashboardProps) => {
  const stats = {
    totalFiles: 47,
    linesOfCode: 12543,
    testCoverage: 78,
    codeQuality: 92,
    passedTests: 47,
    failedTests: 3,
    totalTests: 50
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Repository Status */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Repository Status</CardTitle>
          <GitBranch className="h-4 w-4 text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">Connected</div>
          <p className="text-xs text-slate-400 truncate">{repoUrl}</p>
          <Badge className="mt-2 bg-emerald-500/20 text-emerald-400 border-emerald-400">
            Active
          </Badge>
        </CardContent>
      </Card>

      {/* Code Quality */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Code Quality</CardTitle>
          <Activity className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.codeQuality}%</div>
          <Progress value={stats.codeQuality} className="mt-3" />
          <div className="flex items-center mt-2">
            <CheckCircle className="h-3 w-3 text-emerald-400 mr-1" />
            <span className="text-xs text-slate-400">Excellent quality</span>
          </div>
        </CardContent>
      </Card>

      {/* Test Coverage */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Test Coverage</CardTitle>
          <TestTube className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.testCoverage}%</div>
          <Progress value={stats.testCoverage} className="mt-3" />
          <div className="flex items-center mt-2">
            <AlertTriangle className="h-3 w-3 text-yellow-400 mr-1" />
            <span className="text-xs text-slate-400">Good coverage</span>
          </div>
        </CardContent>
      </Card>

      {/* Files Overview */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Files Analyzed</CardTitle>
          <FileCode className="h-4 w-4 text-cyan-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.totalFiles}</div>
          <p className="text-xs text-slate-400">
            {stats.linesOfCode.toLocaleString()} lines of code
          </p>
          <div className="flex space-x-2 mt-2">
            <Badge variant="outline" className="text-cyan-400 border-cyan-400">
              TypeScript
            </Badge>
            <Badge variant="outline" className="text-orange-400 border-orange-400">
              React
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Test Results</CardTitle>
          <div className="flex space-x-1">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <XCircle className="h-4 w-4 text-red-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm">
            <span className="text-emerald-400">{stats.passedTests} passed</span>
            <span className="text-red-400">{stats.failedTests} failed</span>
          </div>
          <Progress value={(stats.passedTests / stats.totalTests) * 100} className="mt-3" />
          <p className="text-xs text-slate-400 mt-2">
            {stats.totalTests} total tests
          </p>
        </CardContent>
      </Card>

      {/* Agent Info */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Agent Configuration</CardTitle>
          <Activity className="h-4 w-4 text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center text-xs">
              <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
              <span className="text-slate-300">Name: {agentConfig.name}</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              <span className="text-slate-300">Personality: {agentConfig.personality}</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              <span className="text-slate-300">Features: {Object.entries(agentConfig.features)
                .filter(([_, enabled]) => enabled)
                .map(([feature]) => feature)
                .join(', ')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatusDashboard;
