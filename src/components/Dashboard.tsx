'use client';

import React from 'react';
import SettingsModal from "./SettingsModal";
import { MessageCircle, TrendingUp, Activity, Users, Bot, History, Monitor, Rocket, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// props required for status/settings, now provided from parent Index
interface DashboardProps {
  connectedApp: {url: string, name: string, type: string};
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  settingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
}

const Dashboard = ({
  connectedApp,
  isActive,
  setIsActive,
  settingsModalOpen,
  setSettingsModalOpen,
}: DashboardProps) => {
  const stats = [
    { label: 'Total Conversations', value: '1,247', change: '+12%', icon: MessageCircle },
    { label: 'Active Users', value: '342', change: '+8%', icon: Users },
    { label: 'Response Rate', value: '97%', change: '+3%', icon: TrendingUp },
    { label: 'Uptime', value: '99.9%', change: '0%', icon: Activity },
  ];

  const recentActivity = [
    { time: '2m ago', event: 'User asked about pricing', response: 'Provided pricing information' },
    { time: '5m ago', event: 'Integration test completed', response: 'All systems operational' },
    { time: '12m ago', event: 'New user onboarded', response: 'Guided through features' },
    { time: '18m ago', event: 'Feature request submitted', response: 'Logged for review' },
  ];

  const deployHistory = [
    {
      id: '1',
      version: 'v1.2.3',
      timestamp: '2024-01-15 14:30:00',
      status: 'success',
      environment: 'production',
      duration: '2m 34s',
      deployedBy: 'John Doe'
    },
    {
      id: '2',
      version: 'v1.2.2',
      timestamp: '2024-01-14 09:15:00',
      status: 'success',
      environment: 'staging',
      duration: '1m 45s',
      deployedBy: 'Jane Smith'
    },
    {
      id: '3',
      version: 'v1.2.1',
      timestamp: '2024-01-13 16:20:00',
      status: 'failed',
      environment: 'production',
      duration: '45s',
      deployedBy: 'Bob Johnson'
    },
    {
      id: '4',
      version: 'v1.2.0',
      timestamp: '2024-01-12 11:00:00',
      status: 'success',
      environment: 'production',
      duration: '3m 12s',
      deployedBy: 'Alice Brown'
    },
  ];

  const monitoringStats = [
    { label: 'CPU Usage', value: '45%', status: 'good', trend: 'stable' },
    { label: 'Memory Usage', value: '67%', status: 'warning', trend: 'increasing' },
    { label: 'Response Time', value: '0.8s', status: 'good', trend: 'decreasing' },
    { label: 'Error Rate', value: '0.2%', status: 'good', trend: 'stable' },
    { label: 'Throughput', value: '1.2k/min', status: 'good', trend: 'increasing' },
    { label: 'Active Connections', value: '342', status: 'good', trend: 'stable' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px:8 py-16">
      <div>
        <h2 className="text-4xl font-bold text-white mb-4">Agent Dashboard</h2>
        <p className="text-xl text-white/70">
          Monitoring {connectedApp.name} AI Agent
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8 mt-12">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="h-8 w-8 text-purple-400" />
                <Badge variant="outline" className="border-green-400/50 text-green-400">
                  {stat.change}
                </Badge>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-white/70 text-sm">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-white/5 border border-white/10">
          <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500/20">
            Overview
          </TabsTrigger>
          <TabsTrigger value="conversations" className="data-[state=active]:bg-purple-500/20">
            Conversations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-500/20">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="deploy-history" className="data-[state=active]:bg-purple-500/20">
            <History className="h-4 w-4 mr-2" />
            Deploy History
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="data-[state=active]:bg-purple-500/20">
            <Monitor className="h-4 w-4 mr-2" />
            Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Agent Status */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-purple-400" />
                  Agent Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Performance</span>
                  <span className="text-green-400">Excellent</span>
                </div>
                <Progress value={95} className="w-full" />
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/70">Response Speed</span>
                    <span className="text-white">0.8s avg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Accuracy Rate</span>
                    <span className="text-white">97%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">User Satisfaction</span>
                    <span className="text-white">4.8/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-purple-400" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="border-b border-white/10 pb-3 last:border-b-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-white text-sm">{activity.event}</span>
                      <span className="text-white/50 text-xs">{activity.time}</span>
                    </div>
                    <p className="text-white/70 text-xs">{activity.response}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-white">Live Conversations</CardTitle>
              <CardDescription className="text-white/70">
                Monitor ongoing conversations in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-white/40 mx-auto mb-4" />
                <p className="text-white/70">No active conversations</p>
                <p className="text-white/50 text-sm">Conversations will appear here when users interact with your agent</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-white">Usage Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/70">Analytics dashboard coming soon</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-white">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-white/70">Response Time</span>
                      <span className="text-white">95%</span>
                    </div>
                    <Progress value={95} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-white/70">User Engagement</span>
                      <span className="text-white">78%</span>
                    </div>
                    <Progress value={78} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-white/70">Resolution Rate</span>
                      <span className="text-white">89%</span>
                    </div>
                    <Progress value={89} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deploy-history" className="space-y-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <History className="h-5 w-5 mr-2 text-purple-400" />
                Deployment History
              </CardTitle>
              <CardDescription className="text-white/70">
                Track all agent deployments and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deployHistory.map((deployment) => (
                  <div key={deployment.id} className="bg-white/10 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        deployment.status === 'success' ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-white font-medium">{deployment.version}</h4>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              deployment.environment === 'production'
                                ? 'border-purple-400/50 text-purple-400'
                                : 'border-blue-400/50 text-blue-400'
                            }`}
                          >
                            {deployment.environment}
                          </Badge>
                        </div>
                        <p className="text-white/60 text-sm">
                          Deployed by {deployment.deployedBy} • {deployment.timestamp}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-white/70 text-sm">Duration</p>
                        <p className="text-white text-sm">{deployment.duration}</p>
                      </div>
                      {deployment.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {monitoringStats.map((stat, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Monitor className="h-6 w-6 text-purple-400" />
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        stat.status === 'good' ? 'border-green-400/50 text-green-400' :
                        stat.status === 'warning' ? 'border-yellow-400/50 text-yellow-400' :
                        'border-red-400/50 text-red-400'
                      }`}
                    >
                      {stat.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-white/70 text-sm">{stat.label}</p>
                    <p className={`text-xs mt-1 ${
                      stat.trend === 'increasing' ? 'text-green-400' :
                      stat.trend === 'decreasing' ? 'text-blue-400' :
                      'text-gray-400'
                    }`}>
                      {stat.trend === 'increasing' ? '↗ Increasing' :
                       stat.trend === 'decreasing' ? '↘ Decreasing' :
                       '→ Stable'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Activity className="h-5 w-5 mr-2 text-purple-400" />
                System Health
              </CardTitle>
              <CardDescription className="text-white/70">
                Real-time monitoring of agent performance and health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-white font-medium">Performance Metrics</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-white/70 text-sm">CPU Usage</span>
                        <span className="text-white text-sm">45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-white/70 text-sm">Memory Usage</span>
                        <span className="text-white text-sm">67%</span>
                      </div>
                      <Progress value={67} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-white/70 text-sm">Disk Usage</span>
                        <span className="text-white text-sm">23%</span>
                      </div>
                      <Progress value={23} className="h-2" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-white font-medium">Service Status</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">API Gateway</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-400 text-sm">Healthy</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Database</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-400 text-sm">Healthy</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Cache</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-yellow-400 text-sm">Warning</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Load Balancer</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-400 text-sm">Healthy</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SettingsModal 
        open={settingsModalOpen} 
        onOpenChange={setSettingsModalOpen} 
      />
    </div>
  );
};

export default Dashboard;
