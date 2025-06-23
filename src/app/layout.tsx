import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { Toaster } from "@/components/ui/toaster";
import Footer from "@/components/Footer";

// Use system fonts as fallback to avoid Google Fonts loading issues
const fontClass = 'font-sans';

export const metadata: Metadata = {
  title: 'Agentify - Transform Any App Into An AI Agent',
  description: 'Add conversational AI, automation, and smart features to existing apps without code.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={fontClass}>
        <AuthProvider>
          <OnboardingProvider>
            <ChatProvider>
              <div className="min-h-screen flex flex-col">
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
              <Toaster />
            </ChatProvider>
          </OnboardingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}