'use client';

import React from 'react';
import { Bot, Users, Target, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';

export default function About() {
  const values = [
    {
      icon: <Target className="h-8 w-8 text-purple-400" />,
      title: "Mission-Driven",
      description: "We're committed to democratizing AI and making it accessible to every business, regardless of size or technical expertise."
    },
    {
      icon: <Users className="h-8 w-8 text-blue-400" />,
      title: "User-Centric",
      description: "Every feature we build is designed with our users in mind, ensuring the best possible experience and outcomes."
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-yellow-400" />,
      title: "Innovation First",
      description: "We're constantly pushing the boundaries of what's possible with AI technology and integration platforms."
    }
  ];

  const team = [
    {
      name: "Alex Chen",
      role: "CEO & Co-founder",
      bio: "Former AI researcher at Google with 10+ years in machine learning and enterprise software."
    },
    {
      name: "Sarah Johnson",
      role: "CTO & Co-founder",
      bio: "Ex-Microsoft engineer specializing in distributed systems and AI infrastructure."
    },
    {
      name: "Marcus Rodriguez",
      role: "Head of Product",
      bio: "Product leader with experience at Stripe and Airbnb, focused on developer experience."
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
            About Agentify
          </h1>
          <p className="text-xl text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed">
            We're building the future of AI integration, making it simple for any business to add intelligent agents to their applications.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
              <div className="space-y-4 text-white/70 text-lg leading-relaxed">
                <p>
                  Agentify was born from a simple observation: while AI technology was advancing rapidly, 
                  integrating it into existing applications remained complex and time-consuming.
                </p>
                <p>
                  Our founders, having worked at leading tech companies, saw firsthand how businesses 
                  struggled to implement AI solutions that could truly enhance their user experience. 
                  They envisioned a platform that would bridge this gap.
                </p>
                <p>
                  Today, Agentify empowers thousands of businesses to deploy intelligent AI agents 
                  that understand context, provide personalized experiences, and drive meaningful 
                  engagement with their users.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    {value.icon}
                  </div>
                  <CardTitle className="text-white text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-white/70 text-center leading-relaxed">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-1">{member.name}</h3>
                  <p className="text-purple-400 text-sm mb-3">{member.role}</p>
                  <p className="text-white/70 text-sm leading-relaxed">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-400/30 backdrop-blur-sm">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-white mb-4">Join Our Mission</h2>
              <p className="text-white/70 text-lg mb-6">
                Ready to transform your application with intelligent AI agents?
              </p>
              <Link 
                href="/" 
                className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300"
              >
                Get Started Today
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
