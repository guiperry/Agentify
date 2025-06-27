This is a very common and highly recommended practice for ensuring consistency, enabling CI/CD, and simplifying developer onboarding.

We'll create a shell script and a configuration file structure to automatically set up a Supabase project.

The primary tool you will use for this is the **Supabase CLI**. It's designed specifically for this "Infrastructure as Code" approach.

Here’s a comprehensive breakdown of how you can achieve this, covering tables, settings, and seed data.

---

### The Core Concept: Local First Development

The recommended workflow is to define your entire Supabase setup in your local file system and then use a script to "push" that configuration to a remote Supabase project.

Your local project structure, created by the Supabase CLI, will look something like this:

```
my-supabase-app/
├── supabase/
│   ├── migrations/
│   │   └── 20231027100000_initial_schema.sql
│   ├── functions/
│   │   └── my-function/
│   │       └── index.ts
│   ├── config.toml       # <-- The "YAML" config you mentioned (in TOML format)
│   └── seed.sql          # <-- (Optional) For seeding data
└── .gitignore
```

### Part 1: The Configuration (`supabase/config.toml`)

This file is the central point for your project's configuration. While it's in TOML format (which is very similar to YAML's key-value structure), it serves the purpose you described.

You generate this by running `supabase init` in your project root.

**Example `config.toml`:**

```toml
# supabase/config.toml

# This is the unique identifier for your project.
# It's recommended to link your project instead of hardcoding this.
project_id = "your-project-id"

[api]
port = 54321
# schemas are automatically introspected
schemas = ["public", "storage", "graphql"]

[db]
port = 54322
# The major version of Postgres to use for the local database.
major_version = 15

[studio]
port = 54323

# This section is crucial for defining auth settings.
[auth]
# Enable or disable sign-ups.
enable_signup = true
# The default URL to redirect to after a user signs in.
site_url = "http://localhost:3000"
# Add any additional redirect URLs for OAuth, etc.
additional_redirect_urls = ["http://localhost:3000/welcome"]
# Enable external OAuth providers.
external = { "apple" = true, "github" = true, "google" = false }

# You can also configure email templates, rate limits, and more here.
# For a full list of options, refer to the Supabase documentation.
[auth.email]
enable_signup = true
```

### Part 2: The Tables and Schema (`supabase/migrations/`)

This is the most important part for setting up your database. Instead of clicking around in the Supabase Studio UI, you define your tables, policies, and functions in SQL files.

1.  **Start your local environment:**
    ```bash
    supabase start
    ```
2.  **Create a new migration file:**
    ```bash
    supabase migration new initial_schema
    ```
    This will create a new, empty SQL file in the `supabase/migrations/` directory.

3.  **Define your schema in the SQL file:**

    **`supabase/migrations/<timestamp>_initial_schema.sql`**
    ```sql
    -- Create a table for public profiles
    create table profiles (
      id uuid references auth.users on delete cascade not null primary key,
      updated_at timestamp with time zone,
      username text unique,
      avatar_url text,
      website text,

      constraint username_length check (char_length(username) >= 3)
    );

    -- Set up Row Level Security (RLS)
    alter table profiles enable row level security;

    create policy "Public profiles are viewable by everyone."
      on profiles for select using (true);

    create policy "Users can insert their own profile."
      on profiles for insert with check (auth.uid() = id);

    create policy "Users can update own profile."
      on profiles for update using (auth.uid() = id);

    -- Set up Storage for avatars
    insert into storage.buckets (id, name, public)
    values ('avatars', 'avatars', true);

    create policy "Avatar images are publicly accessible."
      on storage.objects for select using (bucket_id = 'avatars');

    create policy "Anyone can upload an avatar."
      on storage.objects for insert with check (bucket_id = 'avatars');
    ```

### Part 3: The Automation (The Shell Script)

Now you can create a shell script that uses the Supabase CLI to apply this local configuration to a remote, hosted Supabase project.

#### **Prerequisites for the Script:**
1.  **Install Supabase CLI:** The script assumes the CLI is installed.
2.  **Supabase Access Token:** You need a personal access token. Generate one from [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).
3.  **Project ID (or "Ref"):** Find this in your Supabase project's URL (`<project-ref>.supabase.co`) or in the project settings.

Here is the automation script.

**`setup_supabase.sh`**
```bash
#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# These should be set as environment variables in a real CI/CD environment
# For example: export SUPABASE_ACCESS_TOKEN='your_token'
: "${SUPABASE_ACCESS_TOKEN?You must set the SUPABASE_ACCESS_TOKEN environment variable.}"
: "${PROJECT_REF?You must set the PROJECT_REF environment variable.}"

echo "----------------------------------------"
echo "--- Setting up Supabase Project: $PROJECT_REF ---"
echo "----------------------------------------"

# 1. Link the local project to the remote Supabase project.
#    The --project-ref flag is used to specify which project to link.
#    This command creates a file at supabase/.temp/project-ref
echo "Linking to remote project..."
supabase link --project-ref "$PROJECT_REF"

# 2. Push the database migrations.
#    This command compares the state of your local migrations with the remote
#    database and applies any pending migrations. It's idempotent.
#    WARNING: This can be destructive if you've made manual changes
#    on your remote database. It's best for fresh setups or controlled environments.
echo "Applying database migrations..."
supabase db push

# 3. Deploy Edge Functions (if you have any).
#    This deploys all functions in the supabase/functions directory.
#    The --project-ref is not needed here as it's already linked.
if [ -d "supabase/functions" ]; then
  echo "Deploying Edge Functions..."
  supabase functions deploy
else
  echo "No Edge Functions found to deploy."
fi

# 4. Set secrets for the project.
#    It's good practice to read these from a secure source or env file.
echo "Setting project secrets..."
# Example: supabase secrets set MY_API_KEY=12345
# You could loop through a secrets file:
# if [ -f ".secrets" ]; then
#   while IFS= read -r line; do
#     supabase secrets set "$line"
#   done < .secrets
# fi

echo "----------------------------------------"
echo "--- Supabase Project Setup Complete! ---"
echo "----------------------------------------"
```

### How to Use It

1.  **Set up your local project:** Run `supabase init`, create your migrations, and configure `config.toml`.
2.  **Save the script:** Save the script above as `setup_supabase.sh` in your project root and make it executable (`chmod +x setup_supabase.sh`).
3.  **Set environment variables:**
    ```bash
    export SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxxxxxxxxxxxxxxxx"
    export PROJECT_REF="your-project-ref-from-supabase-url"
    ```
4.  **Run the script:**
    ```bash
    ./setup_supabase.sh
    ```

### Limitations and Advanced Settings

The CLI and `config.toml` cover most, but not all, settings available in the UI.

*   **OAuth Provider Credentials:** You can *enable* providers like GitHub or Google in `config.toml`, but you cannot set the `Client ID` and `Client Secret` via this file. These must be set via the UI or the [Supabase Management API](https://supabase.com/docs/reference/management-api).
*   **Email Templates, Custom SMTP, etc.:** These are not currently manageable via `config.toml`. You would also need to use the Management API for full automation.

For those advanced cases, you would extend your shell script to include `curl` commands to the Management API.

**Example: Setting a secret and enabling a provider via API**
```bash
# This would go inside your shell script
# Set a secret using the CLI (recommended)
supabase secrets set STRIPE_API_KEY=sk_test_123

# Set OAuth credentials using the Management API (for settings not in the CLI)
CLIENT_ID="your_github_client_id"
CLIENT_SECRET="your_github_client_secret"

curl -X PATCH "https://api.supabase.com/v1/projects/${PROJECT_REF}/auth/config" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
        "external_github_enabled": true,
        "external_github_client_id": "'"$CLIENT_ID"'",
        "external_github_secret": "'"$CLIENT_SECRET"'"
      }'
```

---

**In summary: Yes, you absolutely can.** The Supabase CLI is the key, `supabase/migrations/` defines your schema, `config.toml` handles many project settings, and a shell script ties it all together to automate the setup against a remote project.