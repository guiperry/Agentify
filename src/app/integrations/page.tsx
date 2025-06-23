'use client';

import React from 'react';
import { Bot, Globe, Code, Database, Smartphone, Cloud, Puzzle, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function IntegrationsPage() {
  const integrations = [
    {
      icon: <Globe className="h-8 w-8 text-blue-400" />,
      title: "Web Applications",
      description: "Integrate with React, Vue, Angular, and any modern web framework.",
      category: "Frontend",
      examples: ["React", "Vue.js", "Angular", "Svelte"]
    },
    {
      icon: <Database className="h-8 w-8 text-green-400" />,
      title: "Databases",
      description: "Connect to SQL and NoSQL databases for persistent data storage.",
      category: "Backend",
      examples: ["PostgreSQL", "MongoDB", "MySQL", "Firebase"]
    },
    {
      icon: <Cloud className="h-8 w-8 text-purple-400" />,
      title: "Cloud Platforms",
      description: "Deploy on major cloud providers with seamless integration.",
      category: "Infrastructure",
      examples: ["AWS", "Google Cloud", "Azure", "Vercel"]
    },
    {
      icon: <Code className="h-8 w-8 text-yellow-400" />,
      title: "APIs & Webhooks",
      description: "Connect to third-party services and existing API endpoints.",
      category: "Integration",
      examples: ["REST APIs", "GraphQL", "Webhooks", "gRPC"]
    },
    {
      icon: <Smartphone className="h-8 w-8 text-red-400" />,
      title: "Mobile Applications",
      description: "Extend functionality to mobile apps with our SDK.",
      category: "Mobile",
      examples: ["React Native", "Flutter", "iOS", "Android"]
    },
    {
      icon: <Puzzle className="h-8 w-8 text-indigo-400" />,
      title: "CMS & E-commerce",
      description: "Enhance content management and e-commerce platforms.",
      category: "Platform",
      examples: ["WordPress", "Shopify", "Strapi", "Contentful"]
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
            Seamless Integrations
          </h1>
          <p className="text-xl text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed">
            Connect Agentify with your existing tech stack. Our platform integrates with hundreds of tools and services.
          </p>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {integrations.map((integration, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    {integration.icon}
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                      {integration.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-xl">{integration.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-white/70 text-base leading-relaxed mb-4">
                    {integration.description}
                  </CardDescription>
                  <div className="flex flex-wrap gap-2">
                    {integration.examples.map((example, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs border-white/20 text-white/60">
                        {example}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Process */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How Integration Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-400">1</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Connect</h3>
              <p className="text-white/70">Link your application using our simple SDK or API endpoints.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-400">2</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Configure</h3>
              <p className="text-white/70">Customize agent behavior and set up your integration preferences.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Deploy</h3>
              <p className="text-white/70">Go live with intelligent AI agents enhancing your user experience.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
