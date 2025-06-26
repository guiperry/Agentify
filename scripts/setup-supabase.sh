#!/bin/bash

# Supabase Setup Script for Next-Agentify
# This script initializes and configures the Supabase project

set -e  # Exit on any error

echo "🚀 Setting up Supabase for Next-Agentify..."
echo "============================================"

# Check if required environment variables are set
if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo "❌ Error: SUPABASE_PROJECT_REF environment variable is not set"
    echo "Please set it to your Supabase project reference ID"
    echo "Example: export SUPABASE_PROJECT_REF=movvczmmdmxalnpbptwx"
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "Installing Supabase CLI..."
    
    # Install Supabase CLI based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install supabase/tap/supabase
        else
            echo "Please install Homebrew first: https://brew.sh/"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://supabase.com/install.sh | sh
    else
        echo "Please install Supabase CLI manually: https://supabase.com/docs/guides/cli"
        exit 1
    fi
fi

echo "✅ Supabase CLI is available"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if supabase directory exists
if [ ! -d "supabase" ]; then
    echo "❌ Error: supabase directory not found. Please ensure the Supabase project structure is created."
    exit 1
fi

echo "📁 Supabase directory found"

# Link to remote Supabase project
echo "🔗 Linking to remote Supabase project: $SUPABASE_PROJECT_REF"
supabase link --project-ref "$SUPABASE_PROJECT_REF"

if [ $? -eq 0 ]; then
    echo "✅ Successfully linked to Supabase project"
else
    echo "❌ Failed to link to Supabase project"
    echo "Please check your project reference ID and try again"
    exit 1
fi

# Apply database migrations
echo "📊 Applying database migrations..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Database migrations applied successfully"
else
    echo "❌ Failed to apply database migrations"
    echo "Please check the migration files and try again"
    exit 1
fi

# Generate TypeScript types (optional)
echo "🔧 Generating TypeScript types..."
supabase gen types typescript --linked > src/types/supabase.ts

if [ $? -eq 0 ]; then
    echo "✅ TypeScript types generated successfully"
else
    echo "⚠️  Warning: Failed to generate TypeScript types (this is optional)"
fi

# Check if environment variables are properly set
echo "🔍 Checking environment configuration..."

if [ -f ".env" ]; then
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env && grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env; then
        echo "✅ Environment variables found in .env file"
    else
        echo "⚠️  Warning: Supabase environment variables not found in .env file"
        echo "Please ensure the following variables are set:"
        echo "  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
        echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
        echo "  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    fi
else
    echo "⚠️  Warning: .env file not found"
    echo "Please create a .env file with your Supabase configuration"
fi

# Test connection
echo "🧪 Testing Supabase connection..."
if command -v node &> /dev/null; then
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    supabase.from('agent_configs').select('count').then(({ error }) => {
        if (error) {
            console.log('❌ Connection test failed:', error.message);
            process.exit(1);
        } else {
            console.log('✅ Supabase connection test successful');
        }
    });
    " 2>/dev/null || echo "⚠️  Could not test connection (missing dependencies)"
fi

echo ""
echo "🎉 Supabase setup completed successfully!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Ensure your .env file has the correct Supabase configuration"
echo "2. Install dependencies: npm install @supabase/supabase-js"
echo "3. Start your development server: npm run dev"
echo ""
echo "Your Supabase project is now ready for Next-Agentify!"
