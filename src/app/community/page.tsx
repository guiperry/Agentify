'use client';

import React from "react";
import { Bot, MessageSquare, Users, Calendar, Trophy, Heart, Github, Twitter, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function CommunityPage() {
  const communityStats = [
    { icon: Users, label: "Active Members", value: "12,500+" },
    { icon: MessageSquare, label: "Discussions", value: "3,200+" },
    { icon: Trophy, label: "Projects Shared", value: "850+" },
    { icon: Heart, label: "Helpful Answers", value: "5,600+" }
  ];

  const platforms = [
    {
      name: "Discord",
      description: "Join our Discord server for real-time chat and support",
      icon: Hash,
      members: "8,500+",
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/20"
    },
    {
      name: "GitHub",
      description: "Contribute to open source projects and share code",
      icon: Github,
      members: "2,100+",
      color: "text-gray-400",
      bgColor: "bg-gray-500/20"
    },
    {
      name: "Twitter",
      description: "Follow us for updates and community highlights",
      icon: Twitter,
      members: "15,200+",
      color: "text-blue-400",
      bgColor: "bg-blue-500/20"
    }
  ];

  const events = [
    {
      title: "AI Agent Workshop",
      date: "Dec 28, 2024",
      time: "2:00 PM PST",
      type: "Workshop",
      attendees: 150
    },
    {
      title: "Community Showcase",
      date: "Jan 5, 2025",
      time: "11:00 AM PST",
      type: "Showcase",
      attendees: 200
    },
    {
      title: "Developer Q&A",
      date: "Jan 12, 2025",
      time: "3:00 PM PST",
      type: "Q&A",
      attendees: 100
    }
  ];

  const discussions = [
    {
      title: "Best practices for agent personality design",
      author: "Sarah Chen",
      replies: 24,
      category: "Design",
      time: "2 hours ago"
    },
    {
      title: "How to handle complex API integrations?",
      author: "Marcus Rodriguez",
      replies: 18,
      category: "Technical",
      time: "4 hours ago"
    },
    {
      title: "Showcase: E-commerce chatbot with 95% satisfaction",
      author: "Emily Johnson",
      replies: 32,
      category: "Showcase",
      time: "6 hours ago"
    },
    {
      title: "Performance optimization tips for high-traffic agents",
      author: "David Kim",
      replies: 15,
      category: "Performance",
      time: "8 hours ago"
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
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="border-purple-400/50 text-purple-400 hover:bg-purple-400/10">
                <Link href="/support">Support</Link>
              </Button>
              <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                Join Community
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Community</span>
          </h1>
          <p className="text-xl text-white/70 mb-8 max-w-3xl mx-auto leading-relaxed">
            Connect with developers, share knowledge, and build amazing AI agents together. Join our thriving community of creators and innovators.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {communityStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 mb-3">
                  <stat.icon className="h-6 w-6 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Community Platforms */}
      <div className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white text-center mb-16">Join Our Platforms</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {platforms.map((platform, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-lg hover:bg-white/10 transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${platform.bgColor} mb-6`}>
                    <platform.icon className={`h-8 w-8 ${platform.color}`} />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">{platform.name}</h3>
                  <p className="text-white/70 mb-6">{platform.description}</p>
                  <div className="text-purple-400 font-semibold mb-6">{platform.members} members</div>
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                    Join {platform.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white text-center mb-16">Upcoming Events</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {events.map((event, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-lg hover:bg-white/10 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                      {event.type}
                    </Badge>
                    <div className="text-white/60 text-sm">{event.attendees} attending</div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{event.title}</h3>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center space-x-2 text-white/70">
                      <Calendar className="h-4 w-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-white/70">
                      <MessageSquare className="h-4 w-4" />
                      <span>{event.time}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full border-purple-400/50 text-purple-400 hover:bg-purple-400/10">
                    Register
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Discussions */}
      <div className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-4xl font-bold text-white">Recent Discussions</h2>
            <Button variant="outline" className="border-purple-400/50 text-purple-400 hover:bg-purple-400/10">
              View All Discussions
            </Button>
          </div>
          <div className="space-y-4">
            {discussions.map((discussion, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-lg hover:bg-white/10 transition-all duration-300 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-lg font-semibold text-white hover:text-purple-400 transition-colors">
                          {discussion.title}
                        </h3>
                        <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
                          {discussion.category}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-white/60 text-sm">
                        <span>by {discussion.author}</span>
                        <span>•</span>
                        <span>{discussion.replies} replies</span>
                        <span>•</span>
                        <span>{discussion.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5 text-purple-400" />
                      <span className="text-white font-semibold">{discussion.replies}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Community Guidelines */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Community Guidelines</h2>
          <p className="text-xl text-white/70 mb-12">
            Help us maintain a welcoming and productive environment for everyone.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Be Respectful</h3>
                <p className="text-white/70">
                  Treat all community members with respect and kindness. We're all here to learn and grow together.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Share Knowledge</h3>
                <p className="text-white/70">
                  Share your experiences, ask questions, and help others. Knowledge sharing makes our community stronger.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
