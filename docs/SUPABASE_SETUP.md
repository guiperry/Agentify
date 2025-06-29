# Supabase Setup for Agentify

This document provides instructions for setting up and seeding the Supabase database for the Agentify application.

## Database Schema Setup

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Navigate to your project
3. Go to the SQL Editor
4. Copy the contents of the `supabase-schema.sql` file
5. Paste it into the SQL Editor and run the query

This will create the necessary tables and policies for the Agentify application.

## Seeding the Database for Testing

To create a test admin user and sample data:

1. Log in to your Supabase dashboard
2. Navigate to your project
3. Go to the SQL Editor
4. Copy the contents of the `supabase-seed.sql` file
5. Paste it into the SQL Editor and run the query

This will create:
- An admin user with email `admin@example.com` and password `password123`
- A sample agent associated with this user

**Important Security Note**: The seeded admin user has a simple password for testing purposes only. In a production environment, always use strong, unique passwords.

## Test Credentials

After running the seed script, you can use these credentials for testing:

- **Email**: admin@example.com
- **Password**: password123

## Environment Variables

Make sure your `.env` file contains the correct Supabase configuration:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Troubleshooting

If you encounter issues with authentication:

1. Check that your Supabase URL and keys are correct in the `.env` file
2. Verify that the `user_agents` table exists and has the correct structure
3. Ensure that Row Level Security (RLS) policies are properly configured
4. Check the browser console for any API errors

For API errors showing HTML instead of JSON responses, this typically indicates a server-side error or misconfiguration. Check your Netlify function logs for more details.