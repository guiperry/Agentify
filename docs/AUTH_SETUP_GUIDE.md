# Authentication Setup Guide

This guide will help you configure Google OAuth and Supabase authentication for your Next.js application deployed on Vercel.

## 🔧 Prerequisites

1. **Supabase Project**: You should have a Supabase project set up
2. **Google Cloud Console Account**: For Google OAuth configuration
3. **Vercel Account**: For deployment

## 📋 Step 1: Configure Environment Variables

Add the following environment variables to your `.env.local` file and Vercel deployment:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://movvczmmdmxalnpbptwx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=797257688639-8u3veis0f6081m5mmak3p5kkflf557gj.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## 🔑 Step 2: Configure Google OAuth

### 2.1 Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Enable the **Google+ API** (if not already enabled)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**

### 2.2 OAuth Client Configuration

Configure your OAuth client with these settings:

**Application Type**: Web application

**Authorized JavaScript Origins**:
```
http://localhost:3000
https://your-vercel-domain.vercel.app
```

**Authorized Redirect URIs**:
```
http://localhost:3000/auth/callback
https://your-vercel-domain.vercel.app/auth/callback
https://movvczmmdmxalnpbptwx.supabase.co/auth/v1/callback
```

### 2.3 Get Your Credentials

After creating the OAuth client:
1. Copy the **Client ID** (already in your .env)
2. Copy the **Client Secret** and add it to your environment variables

## 🗄️ Step 3: Configure Supabase

### 3.1 Supabase Dashboard Configuration

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/movvczmmdmxalnpbptwx)
2. Navigate to **Authentication** → **Settings**

### 3.2 Site URL Configuration

Set your Site URL to:
```
https://your-vercel-domain.vercel.app
```

### 3.3 Additional Redirect URLs

Add these redirect URLs:
```
http://localhost:3000/auth/callback
https://your-vercel-domain.vercel.app/auth/callback
https://your-vercel-domain.vercel.app
http://localhost:3000
```

### 3.4 Enable Google OAuth Provider

1. Go to **Authentication** → **Providers**
2. Enable **Google**
3. Add your Google Client ID: `797257688639-8u3veis0f6081m5mmak3p5kkflf557gj.apps.googleusercontent.com`
4. Add your Google Client Secret (from Step 2.3)
5. Save the configuration

### 3.5 Email Templates (Optional)

Configure email templates for password reset:
1. Go to **Authentication** → **Email Templates**
2. Customize the "Reset Password" template if needed

## 🚀 Step 4: Deploy to Vercel

### 4.1 Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add all the environment variables from Step 1

### 4.2 Deploy

Deploy your application and test the authentication features.

## 🧪 Step 5: Testing

### 5.1 Test Google OAuth

1. Open your deployed application
2. Click "Sign In" and try Google OAuth
3. Verify that you can sign in successfully

### 5.2 Test Forgot Password

1. Click "Forgot Password?" on the login modal
2. Enter your email address
3. Check your email for the reset link
4. Follow the link and reset your password

## 🔍 Troubleshooting

### Google OAuth Issues

**Error: "redirect_uri_mismatch"**
- Ensure all redirect URIs are properly configured in Google Cloud Console
- Check that the Supabase callback URL is included

**Error: "invalid_client"**
- Verify your Google Client ID and Secret are correct
- Ensure the OAuth client is properly configured

### Supabase Issues

**Error: "Invalid login credentials"**
- Check that your Supabase URL and anon key are correct
- Verify the user exists in your Supabase auth users table

**Password Reset Not Working**
- Ensure email templates are configured in Supabase
- Check that the redirect URL in the reset email is correct
- Verify that password recovery is enabled in Supabase settings

### General Issues

**Environment Variables Not Loading**
- Restart your development server after adding new environment variables
- For Vercel, redeploy after adding environment variables

## 📝 Notes

- The Google Client ID is already configured for your domain
- Make sure to replace `your-vercel-domain` with your actual Vercel domain
- Keep your Google Client Secret secure and never commit it to version control
- Test both local development and production environments
- The application has been migrated from Netlify to Vercel for better Next.js integration

## 🔗 Useful Links

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
