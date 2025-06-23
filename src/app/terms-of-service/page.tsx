'use client';

import React from "react";
import { Bot } from "lucide-react";
import Link from "next/link";

export default function TermsOfServicePage() {
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
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none">
          <div className="text-white/70 space-y-6">
            <p className="text-lg">
              Last updated: December 2024
            </p>
            
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Agentify, you accept and agree to be bound by the terms 
                and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Use License</h2>
              <p>
                Permission is granted to temporarily use Agentify for personal, non-commercial 
                transitory viewing only.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Disclaimer</h2>
              <p>
                The materials on Agentify are provided on an 'as is' basis. Agentify makes no 
                warranties, expressed or implied.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Limitations</h2>
              <p>
                In no event shall Agentify or its suppliers be liable for any damages arising 
                out of the use or inability to use the materials on Agentify.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at{' '}
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
