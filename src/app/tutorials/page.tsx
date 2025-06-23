'use client';

import React from "react";
import { Bot, Play, Clock, User, Star, BookOpen, Code, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function TutorialsPage() {
  const tutorials = [
    {
      title: "Getting Started with Agentify",
      description: "Learn the basics of creating your first AI agent in under 10 minutes.",
      duration: "8 min",
      level: "Beginner",
      author: "Sarah Chen",
      rating: 4.9,
      thumbnail: "🚀",
      category: "Getting Started"
    },
    {
      title: "Building a Customer Support Agent",
      description: "Step-by-step guide to creating an intelligent customer support chatbot.",
      duration: "15 min",
      level: "Intermediate",
      author: "Marcus Rodriguez",
      rating: 4.8,
      thumbnail: "🎧",
      category: "Use Cases"
    },
    {
      title: "Advanced Agent Configuration",
      description: "Deep dive into advanced settings and customization options.",
      duration: "22 min",
      level: "Advanced",
      author: "Emily Johnson",
      rating: 4.7,
      thumbnail: "⚙️",
      category: "Configuration"
    },
    {
      title: "Integrating with React Applications",
      description: "How to seamlessly integrate Agentify agents into your React projects.",
      duration: "12 min",
      level: "Intermediate",
      author: "David Kim",
      rating: 4.9,
      thumbnail: "⚛️",
      category: "Integration"
    },
    {
      title: "API Authentication & Security",
      description: "Best practices for securing your agent integrations and API calls.",
      duration: "18 min",
      level: "Advanced",
      author: "Lisa Wang",
      rating: 4.6,
      thumbnail: "🔒",
      category: "Security"
    },
    {
      title: "Deploying Agents to Production",
      description: "Complete guide to deploying and scaling your agents in production.",
      duration: "25 min",
      level: "Advanced",
      author: "Alex Chen",
      rating: 4.8,
      thumbnail: "🌐",
      category: "Deployment"
    }
  ];

  const categories = [
    { name: "All Tutorials", count: 24 },
    { name: "Getting Started", count: 6 },
    { name: "Integration", count: 8 },
    { name: "Use Cases", count: 5 },
    { name: "Configuration", count: 3 },
    { name: "Security", count: 2 }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner": return "bg-green-500/20 text-green-300 border-green-400/30";
      case "Intermediate": return "bg-yellow-500/20 text-yellow-300 border-yellow-400/30";
      case "Advanced": return "bg-red-500/20 text-red-300 border-red-400/30";
      default: return "bg-gray-500/20 text-gray-300 border-gray-400/30";
    }
  };

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
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="border-purple-400/50 text-purple-400 hover:bg-purple-400/10">
                <Link href="/documentation">Documentation</Link>
              </Button>
              <Button variant="outline" className="border-purple-400/50 text-purple-400 hover:bg-purple-400/10">
                <Link href="/support">Support</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Tutorials</span>
          </h1>
          <p className="text-xl text-white/70 mb-8 max-w-3xl mx-auto leading-relaxed">
            Learn how to build, deploy, and optimize AI agents with our comprehensive video tutorials and guides.
          </p>
          <div className="flex items-center justify-center space-x-8 text-white/60">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Step-by-step guides</span>
            </div>
            <div className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>Code examples</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Best practices</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category, index) => (
              <Button
                key={index}
                variant={index === 0 ? "default" : "outline"}
                className={index === 0 
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white" 
                  : "bg-white/10 border-white/20 text-white/80 hover:bg-white/20 backdrop-blur-lg"
                }
              >
                {category.name} ({category.count})
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Tutorials Grid */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white text-center mb-16">Featured Tutorials</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tutorials.map((tutorial, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-lg hover:bg-white/10 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-0">
                  <div className="relative bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-12 flex items-center justify-center">
                    <span className="text-6xl">{tutorial.thumbnail}</span>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Play className="h-8 w-8 text-white ml-1" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="bg-white/10 text-white/80">
                        {tutorial.category}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={getLevelColor(tutorial.level)}
                      >
                        {tutorial.level}
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-purple-400 transition-colors leading-tight">
                      {tutorial.title}
                    </h3>
                    
                    <p className="text-white/70 text-sm mb-4 line-clamp-2">
                      {tutorial.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-white/60 text-xs mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{tutorial.author}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{tutorial.duration}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span>{tutorial.rating}</span>
                      </div>
                    </div>
                    
                    <Button variant="outline" className="w-full border-purple-400/50 text-purple-400 hover:bg-purple-400/10">
                      <Play className="mr-2 h-3 w-3" />
                      Watch Tutorial
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Learning Path */}
      <div className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Recommended Learning Path</h2>
          <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
            Follow our structured learning path to master Agentify from basics to advanced concepts.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌱</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Beginner</h3>
                <p className="text-white/70 mb-6">Start with the fundamentals and create your first agent.</p>
                <Button variant="outline" className="border-green-400/50 text-green-400 hover:bg-green-400/10">
                  Start Learning
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Intermediate</h3>
                <p className="text-white/70 mb-6">Build complex agents and integrate with your applications.</p>
                <Button variant="outline" className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10">
                  Continue Path
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Advanced</h3>
                <p className="text-white/70 mb-6">Master advanced features and production deployment.</p>
                <Button variant="outline" className="border-purple-400/50 text-purple-400 hover:bg-purple-400/10">
                  Master Skills
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
