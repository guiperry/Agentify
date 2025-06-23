'use client';

import Link from 'next/link';
import { Bot, Heart, Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900/95 border-t border-white/10 backdrop-blur-lg mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2" aria-label="Go to homepage">
              <Bot className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Agentify
              </span>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed">
              Transform your web applications with intelligent AI agents. Automate, engage, and enhance user experiences like never before.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white/60 hover:text-purple-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-white/60 hover:text-purple-400 transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-white/60 hover:text-purple-400 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/documentation" className="text-white/70 hover:text-purple-400 transition-colors text-sm">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/tutorials" className="text-white/70 hover:text-purple-400 transition-colors text-sm">
                  Tutorials
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="text-white/70 hover:text-purple-400 transition-colors text-sm">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-white/70 hover:text-purple-400 transition-colors text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-white/70 hover:text-purple-400 transition-colors text-sm">
                  Community
                </Link>
              </li>
            </ul>
          </div>
          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-white/70 hover:text-purple-400 transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-white/70 hover:text-purple-400 transition-colors text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/70 hover:text-purple-400 transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-white/70 hover:text-purple-400 transition-colors text-sm">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy-policy" className="text-white/70 hover:text-purple-400 transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-white/70 hover:text-purple-400 transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="text-white/70 hover:text-purple-400 transition-colors text-sm">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-white/60">
              <p>&copy; 2024 Agentify. All rights reserved.</p>
              <div className="flex space-x-6">
                <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-sm text-white/60">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-400" />
              <span>for the future of AI</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;