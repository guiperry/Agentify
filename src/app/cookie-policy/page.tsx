'use client';

import React from "react";
import { Bot } from "lucide-react";
import Link from "next/link";

export default function CookiePolicyPage() {
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-white mb-8">Cookie Policy</h1>
        
        <div className="prose prose-invert max-w-none">
          <div className="text-white/70 space-y-6">
            <p className="text-lg">
              Last updated: December 2024
            </p>
            
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">What Are Cookies</h2>
              <p>
                Cookies are small text files that are placed on your computer by websites that you visit. 
                They are widely used to make websites work more efficiently.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">How We Use Cookies</h2>
              <p>
                We use cookies to enhance your experience, analyze site usage, and assist in our 
                marketing efforts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Types of Cookies We Use</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Essential cookies: Required for the website to function properly</li>
                <li>Analytics cookies: Help us understand how visitors interact with our website</li>
                <li>Functional cookies: Enable enhanced functionality and personalization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Managing Cookies</h2>
              <p>
                You can control and/or delete cookies as you wish. You can delete all cookies 
                that are already on your computer and set most browsers to prevent them from being placed.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p>
                If you have any questions about our use of cookies, please contact us at{' '}
                <Link href="/contact" className="text-purple-400 hover:text-purple-300">
                  our contact page
                </Link>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
