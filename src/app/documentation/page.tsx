'use client';

import React from 'react';
import { Bot, Book, Code, Zap, Settings, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';

export default function Documentation() {
  const sections = [
    {
      icon: <Zap className="h-8 w-8 text-yellow-400" />,
      title: "Quick Start",
      description: "Get up and running with Agentify in under 5 minutes",
      topics: ["Installation", "First Agent", "Basic Configuration", "Testing"]
    },
    {
      icon: <Code className="h-8 w-8 text-blue-400" />,
      title: "API Reference",
      description: "Complete API documentation with examples",
      topics: ["Authentication", "Endpoints", "Webhooks", "SDKs"]
    },
    {
      icon: <Settings className="h-8 w-8 text-green-400" />,
      title: "Configuration",
      description: "Advanced configuration and customization options",
      topics: ["Agent Settings", "Integrations", "Security", "Scaling"]
    },
    {
      icon: <Globe className="h-8 w-8 text-purple-400" />,
      title: "Integrations",
      description: "Connect Agentify with your favorite tools and platforms",
      topics: ["Web Frameworks", "Databases", "Third-party APIs", "Custom Integrations"]
    }
  ];

  const quickLinks = [
    { title: "Getting Started Guide", href: "#getting-started" },
    { title: "API Authentication", href: "#authentication" },
    { title: "Agent Configuration", href: "#configuration" },
    { title: "Deployment Guide", href: "#deployment" },
    { title: "Troubleshooting", href: "#troubleshooting" },
    { title: "FAQ", href: "#faq" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2" aria-label="Go to homepage">
              <Bot className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Agentify
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Book className="h-16 w-16 text-purple-400" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-6">
            Documentation
          </h1>
          <p className="text-xl text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed">
            Everything you need to know to build amazing AI-powered applications with Agentify.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm sticky top-8">
              <CardHeader>
                <CardTitle className="text-white">Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  {quickLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.href}
                      className="block text-white/70 hover:text-purple-400 transition-colors py-2 px-3 rounded hover:bg-white/5"
                    >
                      {link.title}
                    </a>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Documentation Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {sections.map((section, index) => (
                <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-4">
                      {section.icon}
                      <CardTitle className="text-white text-xl">{section.title}</CardTitle>
                    </div>
                    <CardDescription className="text-white/70">
                      {section.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.topics.map((topic, idx) => (
                        <li key={idx} className="text-white/60 hover:text-purple-400 cursor-pointer transition-colors">
                          • {topic}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Getting Started Section */}
            <Card id="getting-started" className="bg-white/5 border-white/10 backdrop-blur-sm mb-8">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">1. Installation</h3>
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <code className="text-green-400">npm install @agentify/sdk</code>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">2. Initialize Your First Agent</h3>
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <pre className="text-green-400 text-sm">
{`import { AgentifyClient } from '@agentify/sdk';

const client = new AgentifyClient({
  apiKey: 'your-api-key',
  environment: 'production'
});

const agent = await client.createAgent({
  name: 'My First Agent',
  personality: 'helpful and friendly',
  instructions: 'You are a helpful assistant.'
});`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">3. Deploy Your Agent</h3>
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <code className="text-green-400">await agent.deploy();</code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Reference Section */}
            <Card id="authentication" className="bg-white/5 border-white/10 backdrop-blur-sm mb-8">
              <CardHeader>
                <CardTitle className="text-white text-2xl">API Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 mb-4">
                  All API requests require authentication using your API key. Include it in the Authorization header:
                </p>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <code className="text-green-400">Authorization: Bearer your-api-key</code>
                </div>
              </CardContent>
            </Card>

            {/* More sections would go here */}
            <Card className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-400/30 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Need More Help?</h2>
                <p className="text-white/70 mb-6">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <Link 
                  href="/support" 
                  className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300"
                >
                  Contact Support
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
