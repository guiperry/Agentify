'use client';

import React from "react";
import { Bot, MessageSquare, Mail, Phone, Book, Search, Clock, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

export default function SupportPage() {
  const supportOptions = [
    {
      title: "Live Chat",
      description: "Get instant help from our support team",
      icon: MessageSquare,
      availability: "24/7",
      responseTime: "< 1 minute",
      buttonText: "Start Chat",
      primary: true
    },
    {
      title: "Email Support",
      description: "Send us a detailed message about your issue",
      icon: Mail,
      availability: "24/7",
      responseTime: "< 4 hours",
      buttonText: "Send Email",
      primary: false
    },
    {
      title: "Phone Support",
      description: "Speak directly with our technical team",
      icon: Phone,
      availability: "Mon-Fri 9AM-6PM PST",
      responseTime: "Immediate",
      buttonText: "Call Now",
      primary: false
    }
  ];

  const faqCategories = [
    {
      title: "Getting Started",
      questions: [
        "How do I create my first AI agent?",
        "What programming languages do you support?",
        "How do I integrate Agentify with my website?",
        "What are the system requirements?"
      ]
    },
    {
      title: "Billing & Pricing",
      questions: [
        "How does the pricing work?",
        "Can I change my plan anytime?",
        "Do you offer discounts for students?",
        "What payment methods do you accept?"
      ]
    },
    {
      title: "Technical Issues",
      questions: [
        "My agent is not responding correctly",
        "How do I troubleshoot API errors?",
        "Why is my agent slow to respond?",
        "How do I update my agent's knowledge base?"
      ]
    },
    {
      title: "Account & Security",
      questions: [
        "How do I reset my password?",
        "How do I manage team members?",
        "Is my data secure with Agentify?",
        "How do I delete my account?"
      ]
    }
  ];

  const statusItems = [
    { service: "API Services", status: "operational", uptime: "99.9%" },
    { service: "Web Dashboard", status: "operational", uptime: "99.8%" },
    { service: "Documentation", status: "operational", uptime: "99.9%" },
    { service: "Agent Training", status: "maintenance", uptime: "99.7%" }
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
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="border-purple-400/50 text-purple-400 hover:bg-purple-400/10">
                <Link href="/documentation">Documentation</Link>
              </Button>
              <Button variant="outline" className="border-purple-400/50 text-purple-400 hover:bg-purple-400/10">
                <Link href="/community">Community</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Support</span>
          </h1>
          <p className="text-xl text-white/70 mb-8 max-w-3xl mx-auto leading-relaxed">
            We're here to help you succeed with Agentify. Get the support you need, when you need it.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 h-5 w-5" />
            <Input 
              placeholder="Search for help articles, guides, or ask a question..." 
              className="pl-12 py-4 text-lg bg-white/10 border-white/20 text-white placeholder-white/40"
            />
            <Button className="absolute right-2 top-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Support Options */}
      <div className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white text-center mb-16">Get Help Now</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {supportOptions.map((option, index) => (
              <Card key={index} className={`bg-white/5 border-white/10 backdrop-blur-lg hover:bg-white/10 transition-all duration-300 ${
                option.primary ? 'ring-2 ring-purple-400/50' : ''
              }`}>
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 mb-6">
                    <option.icon className="h-8 w-8 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">{option.title}</h3>
                  <p className="text-white/70 mb-6">{option.description}</p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Availability:</span>
                      <span className="text-white">{option.availability}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Response Time:</span>
                      <span className="text-white">{option.responseTime}</span>
                    </div>
                  </div>
                  
                  <Button 
                    className={`w-full ${
                      option.primary 
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {option.buttonText}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-4xl font-bold text-white">System Status</h2>
            <Badge variant="outline" className="border-green-400/50 text-green-400">
              All Systems Operational
            </Badge>
          </div>
          
          <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
            <CardContent className="p-8">
              <div className="space-y-6">
                {statusItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        item.status === 'operational' ? 'bg-green-400' : 'bg-yellow-400'
                      }`} />
                      <span className="text-white font-medium">{item.service}</span>
                    </div>
                    <div className="flex items-center space-x-6">
                      <span className="text-white/60">{item.uptime} uptime</span>
                      <div className="flex items-center space-x-2">
                        {item.status === 'operational' ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-400" />
                        )}
                        <span className={`text-sm capitalize ${
                          item.status === 'operational' ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white text-center mb-16">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {faqCategories.map((category, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-lg">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-semibold text-white mb-6">{category.title}</h3>
                  <div className="space-y-4">
                    {category.questions.map((question, qIndex) => (
                      <div key={qIndex} className="text-white/80 hover:text-purple-400 cursor-pointer transition-colors p-3 rounded hover:bg-white/5">
                        {question}
                        <ArrowRight className="inline-block ml-2 h-4 w-4" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-6">Still Need Help?</h2>
            <p className="text-xl text-white/70">
              Send us a message and we'll get back to you as soon as possible.
            </p>
          </div>
          
          <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
            <CardContent className="p-8">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-medium mb-2">Name</label>
                    <Input className="bg-white/10 border-white/20 text-white" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Email</label>
                    <Input className="bg-white/10 border-white/20 text-white" placeholder="your@email.com" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Subject</label>
                  <Input className="bg-white/10 border-white/20 text-white" placeholder="How can we help?" />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Message</label>
                  <Textarea 
                    className="bg-white/10 border-white/20 text-white min-h-[120px]" 
                    placeholder="Describe your issue or question in detail..."
                  />
                </div>
                
                <Button size="lg" className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                  Send Message
                  <Mail className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Resources */}
      <div className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Additional Resources</h2>
          <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
            Explore these helpful resources to get the most out of Agentify.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" className="border-purple-400/50 text-purple-400 hover:bg-purple-400/10 px-8 py-6">
              <Link href="/documentation" className="flex items-center">
                <Book className="mr-2 h-5 w-5" />
                Documentation
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-purple-400/50 text-purple-400 hover:bg-purple-400/10 px-8 py-6">
              <Link href="/tutorials" className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Tutorials
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-purple-400/50 text-purple-400 hover:bg-purple-400/10 px-8 py-6">
              <Link href="/community" className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Community
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
