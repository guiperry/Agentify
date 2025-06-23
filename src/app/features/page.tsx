'use client';

import React from 'react';
import { Bot, Zap, Globe, Settings, Sparkles, CheckCircle, Cpu, Shield, BarChart3, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';

export default function Features() {
  const features = [
    {
      icon: <Bot className="h-8 w-8 text-purple-400" />,
      title: "Intelligent AI Agents",
      description: "Deploy smart AI agents that understand context and provide personalized user experiences.",
      badge: "Core"
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-400" />,
      title: "Real-time Processing",
      description: "Lightning-fast response times with real-time data processing and instant user interactions.",
      badge: "Performance"
    },
    {
      icon: <Globe className="h-8 w-8 text-blue-400" />,
      title: "Multi-platform Integration",
      description: "Seamlessly integrate with any web application, regardless of technology stack.",
      badge: "Integration"
    },
    {
      icon: <Settings className="h-8 w-8 text-green-400" />,
      title: "Custom Configuration",
      description: "Tailor agent behavior with advanced configuration options and custom workflows.",
      badge: "Customization"
    },
    {
      icon: <Shield className="h-8 w-8 text-red-400" />,
      title: "Enterprise Security",
      description: "Bank-level security with end-to-end encryption and compliance certifications.",
      badge: "Security"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-indigo-400" />,
      title: "Advanced Analytics",
      description: "Comprehensive insights and analytics to optimize agent performance and user engagement.",
      badge: "Analytics"
    }
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
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-6">
            Powerful Features
          </h1>
          <p className="text-xl text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed">
            Discover the comprehensive suite of features that make Agentify the leading platform for AI agent integration.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    {feature.icon}
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-white/70 text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Why Choose Agentify?</h2>
          <div className="space-y-6">
            <div className="flex items-start space-x-4 p-6 bg-white/5 rounded-lg border border-white/10">
              <CheckCircle className="h-6 w-6 text-green-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Easy Setup & Deployment</h3>
                <p className="text-white/70">Get your AI agents up and running in minutes with our intuitive setup process and comprehensive documentation.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-6 bg-white/5 rounded-lg border border-white/10">
              <Users className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Scalable Architecture</h3>
                <p className="text-white/70">Built to scale from small startups to enterprise-level applications with millions of users.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-6 bg-white/5 rounded-lg border border-white/10">
              <Cpu className="h-6 w-6 text-purple-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Advanced AI Models</h3>
                <p className="text-white/70">Powered by the latest AI technologies and continuously updated with new capabilities.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
