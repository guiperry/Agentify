# Chat Implementation Setup Guide

This guide provides instructions for setting up the chat functionality in the Agentify application.

## Prerequisites

- Node.js (v16 or higher)
- Gemini API key

## Setup Steps

### 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL_NAME=gemini-1.5-flash

# Server Configuration
PORT=3001

# SQLite Database Path (optional, defaults to ./data/agentify.db)
# DB_PATH=./data/agentify.db
```

### 2. Database Setup

The application uses SQLite for data storage, which is a file-based database that doesn't require a separate server. The database file will be automatically created in the `data` directory when the server starts.

No additional setup is required for the database.

### 3. Install Dependencies

Install the required dependencies:

```bash
npm install
```

### 4. Start the Server

Start the server:

```bash
npm run server
```

### 5. Start the Client

In a separate terminal, start the client:

```bash
npm run dev
```

## Usage

The chat functionality is accessible through the "Chat with Agon" button in the Agent Deployer interface. The chat provides contextual assistance based on the current deployment step.

## Features

- **Contextual Assistance**: Agon provides help based on the current deployment step (dashboard, repository, compile, tests, deploy)
- **Chat History**: Users can access previous chat sessions
- **Help Feature**: Users can get specific help for each deployment step
- **AI Integration**: Powered by Google's Gemini API for intelligent responses
- **Embedded Database**: Uses SQLite for simple, file-based data storage without requiring a separate database server

## Troubleshooting

- If you encounter database issues, check that the application has write permissions to the `data` directory.
- If Gemini API responses are not working, verify that your API key is valid and properly set in the `.env` file.
- For any other issues, check the server logs for error messages.

## Database Location

The SQLite database file is stored at `./data/agentify.db` by default. You can change this location by setting the `DB_PATH` environment variable in the `.env` file.

## Backup and Migration

To backup the database, simply copy the `agentify.db` file. To restore from a backup, replace the existing database file with your backup copy.