# Agentify - Next.js Version

This is the Next.js version of the Agentify application, refactored from the original Node.js backend and Vite-powered frontend.

## Key Features

- **Unified Development Server**: Single Next.js server that handles both frontend React components and backend API routes
- **Full-Stack Framework**: Next.js provides both frontend and backend capabilities in a single project
- **API Routes**: Server-side endpoints that run in a Node.js environment, replacing the separate Express server
- **Optimized Builds**: Next.js build system optimizes the application for production

## Project Structure

- `/src/app`: Next.js App Router pages and layouts
- `/src/app/api`: API routes (backend functionality)
- `/src/components`: React components
- `/src/lib`: Utility functions and libraries
- `/public`: Static assets

## API Routes

The compiler service has been migrated to Next.js API routes:

- `/api/compile`: Handles agent compilation requests
- `/api/health`: Health check endpoint

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```

3. Build for production:
   ```
   npm run build
   ```

4. Start the production server:
   ```
   npm start
   ```

## Migration Notes

This project was refactored from a dual-server architecture (Vite + Express) to a unified Next.js application. The key changes include:

1. Migrated React components from the original Vite project
2. Converted Express routes to Next.js API routes
3. Updated the compiler service to work with Next.js
4. Simplified the development workflow by eliminating the need for `concurrently`

## Environment Variables

Create a `.env.local` file with the following variables:

```
# Add any environment variables here
```