'use client';

import React from "react";
import { Bot, Mail, Phone, MapPin, Clock, Send, MessageSquare, Users, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

export default function ContactPage() {
  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email",
      contact: "support@agentify.com",
      time: "Response within 24 hours"
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Chat with our team",
      contact: "Available in app",
      time: "Monday - Friday, 9 AM - 6 PM PST"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak with our experts",
      contact: "+1 (555) 123-4567",
      time: "Business hours only"
    }
  ];

  const offices = [
    {
      city: "San Francisco",
      address: "123 Tech Street, Suite 100",
      region: "CA 94105, USA",
      phone: "+1 (555) 123-4567"
    },
    {
      city: "New York",
      address: "456 Innovation Ave, Floor 25",
      region: "NY 10001, USA",
      phone: "+1 (555) 987-6543"
    },
    {
      city: "London",
      address: "789 Digital Lane, 3rd Floor",
      region: "EC2A 4BX, UK",
      phone: "+44 20 1234 5678"
    }
  ];

  const departments = [
    { icon: Headphones, title: "General Support", email: "support@agentify.com" },
    { icon: Users, title: "Sales", email: "sales@agentify.com" },
    { icon: MessageSquare, title: "Partnerships", email: "partners@agentify.com" },
    { icon: Mail, title: "Press & Media", email: "press@agentify.com" }
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
            <Button variant="outline" className="border-purple-400/50 text-purple-400 hover:bg-purple-400/10">
              <Link href="/support">Support Center</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
            Get in <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="text-xl text-white/70 mb-8 max-w-3xl mx-auto leading-relaxed">
            Have questions about Agentify? Need help getting started? Want to explore partnership opportunities? We're here to help.
          </p>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="py-16 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How Can We Help?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-lg hover:bg-white/10 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 mb-4">
                    <method.icon className="h-8 w-8 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{method.title}</h3>
                  <p className="text-white/70 mb-3">{method.description}</p>
                  <div className="text-purple-400 font-semibold mb-2">{method.contact}</div>
                  <div className="text-white/60 text-sm">{method.time}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Form */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-8">Send us a Message</h2>
              <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
                <CardContent className="p-8">
                  <form className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-white">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="Enter your first name"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-white">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Enter your last name"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-white">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company" className="text-white">Company (Optional)</Label>
                      <Input
                        id="company"
                        placeholder="Enter your company name"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject" className="text-white">Subject</Label>
                      <Select>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="support">Technical Support</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="press">Press & Media</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="message" className="text-white">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us how we can help you..."
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[120px]"
                      />
                    </div>
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                      Send Message
                      <Send className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-8">Contact Information</h2>
              <div className="space-y-6">
                {departments.map((dept, index) => (
                  <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                            <dept.icon className="h-6 w-6 text-purple-400" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{dept.title}</h3>
                          <p className="text-purple-400">{dept.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Office Locations */}
      <div className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Our Offices</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {offices.map((office, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-lg">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-purple-400" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{office.city}</h3>
                      <p className="text-white/70 text-sm mb-1">{office.address}</p>
                      <p className="text-white/70 text-sm mb-3">{office.region}</p>
                      <div className="flex items-center space-x-2 text-purple-400 text-sm">
                        <Phone className="h-4 w-4" />
                        <span>{office.phone}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Business Hours */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 mb-6">
            <Clock className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Business Hours</h3>
          <div className="text-white/70 space-y-2">
            <p><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM PST</p>
            <p><strong>Saturday:</strong> 10:00 AM - 4:00 PM PST</p>
            <p><strong>Sunday:</strong> Closed</p>
          </div>
          <p className="text-white/60 text-sm mt-4">
            For urgent issues outside business hours, please email support@agentify.com
          </p>
        </div>
      </div>
    </div>
  );
}
