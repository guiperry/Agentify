'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface HeroProps {
  onGetStarted?: () => void;
}

const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <div className="relative overflow-hidden bg-slate-900">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-slate-900/0"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]"></div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
            Build and Deploy <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">AI Agents</span> with Ease
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10">
            Create, test, and deploy powerful AI agents for your applications without the complexity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {onGetStarted ? (
              <Button
                onClick={onGetStarted}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                Get Started
              </Button>
            ) : (
              <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                <Link href="/dashboard">Get Started</Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
              <Link href="/documentation">View Documentation</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;