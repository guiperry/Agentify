'use client';

import React from 'react';
import { Bot, Code, Database, Zap, Shield, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function APIPage() {
  const endpoints = [
    {
      method: "POST",
      endpoint: "/api/agents",
      description: "Create a new AI agent",
      response: "201 Created"
    },
    {
      method: "GET",
      endpoint: "/api/agents/{id}",
      description: "Retrieve agent information",
      response: "200 OK"
    },
    {
      method: "PUT",
      endpoint: "/api/agents/{id}/config",
      description: "Update agent configuration",
      response: "200 OK"
    },
    {
      method: "POST",
      endpoint: "/api/chat",
      description: "Send message to agent",
      response: "200 OK"
    }
  ];

  const features = [
    {
      icon: <Shield className="h-6 w-6 text-green-400" />,
      title: "Secure Authentication",
      description: "OAuth 2.0 and API key authentication with rate limiting"
    },
    {
      icon: <Zap className="h-6 w-6 text-yellow-400" />,
      title: "Real-time Updates",
      description: "WebSocket connections for instant communication"
    },
    {
      icon: <Database className="h-6 w-6 text-blue-400" />,
      title: "RESTful Design",
      description: "Clean, predictable API following REST principles"
    },
    {
      icon: <Globe className="h-6 w-6 text-purple-400" />,
      title: "Global CDN",
      description: "Low-latency access from anywhere in the world"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Agentify
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-6">
            Developer API
          </h1>
          <p className="text-xl text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed">
            Build powerful integrations with our comprehensive REST API. Everything you need to integrate AI agents into your applications.
          </p>
        </div>
      </section>

      {/* API Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">API Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    {feature.icon}
                    <CardTitle className="text-white text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-white/70">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Key Endpoints</h2>
          <div className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-4">
                      <Badge 
                        variant="secondary" 
                        className={`${
                          endpoint.method === 'POST' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                          endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' :
                          'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
                        }`}
                      >
                        {endpoint.method}
                      </Badge>
                      <code className="text-white font-mono text-sm bg-black/30 px-3 py-1 rounded">
                        {endpoint.endpoint}
                      </code>
                    </div>
                    <Badge variant="outline" className="text-xs border-white/20 text-white/60">
                      {endpoint.response}
                    </Badge>
                  </div>
                  <p className="text-white/70">{endpoint.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Quick Start Example</h2>
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Code className="h-5 w-5 text-purple-400" />
                <span>Create Your First Agent</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-white/80 text-sm overflow-x-auto">
{`// Initialize the Agentify client
const agentify = new AgentifyClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.agentify.com'
});

// Create a new agent
const agent = await agentify.agents.create({
  name: 'Customer Support Agent',
  personality: 'helpful and friendly',
  capabilities: ['chat', 'search', 'analytics']
});

// Start a conversation
const response = await agentify.chat.send({
  agentId: agent.id,
  message: 'Hello, how can I help you today?'
});

console.log(response.message);`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
