'use client';

import React from 'react';
import { Bot, Home, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Bot className="h-16 w-16 text-purple-400" />
        </div>
        
        {/* 404 Text */}
        <h1 className="text-8xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
          404
        </h1>
        
        {/* Error Message */}
        <h2 className="text-2xl font-bold text-white mb-4">
          Page Not Found
        </h2>
        
        <p className="text-white/70 mb-8 leading-relaxed">
          Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
        </p>
        
        {/* Action Buttons */}
        <div className="space-y-4">
          <Link href="/">
            <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="w-full border-white/20 text-white/70 hover:bg-white/10"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
        
        {/* Additional Help */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-white/50 text-sm mb-4">
            Need help? Try these popular pages:
          </p>
          <div className="space-y-2">
            <Link href="/features" className="block text-purple-400 hover:text-purple-300 transition-colors text-sm">
              Features
            </Link>
            <Link href="/pricing" className="block text-purple-400 hover:text-purple-300 transition-colors text-sm">
              Pricing
            </Link>
            <Link href="/documentation" className="block text-purple-400 hover:text-purple-300 transition-colors text-sm">
              Documentation
            </Link>
            <Link href="/about" className="block text-purple-400 hover:text-purple-300 transition-colors text-sm">
              About
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
