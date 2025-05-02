# Invite Code System Setup

This document provides instructions for setting up and managing the invite code system for Graffiticode.

## Overview

The invite code system requires new users to enter an invite code after signing in with their Ethereum wallet. This helps control access to the platform and prevents unwanted registrations.

## Authentication

The system uses Google's recommended authentication practices:

- **Application Default Credentials (ADC)** - No service account keys are stored in code or environment variables
- **Workload Identity Federation** - When deployed to Google Cloud, the app automatically uses the service account attached to the environment
- **Local Development** - For local development, use `gcloud auth application-default login`

This approach follows security best practices by avoiding the use of service account keys.

## Initial Setup

When deploying for the first time:

1. Authenticate with Google Cloud (if running locally):
   ```bash
   gcloud auth application-default login
   ```

2. Run the setup script to mark existing users as verified and create initial invite codes:
   ```bash
   npm run setup-invite-codes
   ```

This script will:
- Mark all existing users as verified
- Create invite codes for admin users
- Create additional invite codes if none exist

## Admin Tasks

### Managing Invite Codes

Administrators can manage invite codes through the settings page:

1. Sign in as an admin user
2. Navigate to Settings
3. Scroll down to the Invite Codes section
4. From here you can:
   - Generate new invite codes
   - View existing codes and their status
   - Delete unused codes

### Making a User an Admin

To grant a user admin privileges, use the provided admin script:

```bash
# First, authenticate with Google Cloud (if running locally)
gcloud auth application-default login

# Then make the user an admin
npm run make-admin 0x1234567890abcdef1234567890abcdef12345678
```

## User Experience

1. New users sign in with their Ethereum wallet
2. After authentication, they see an invite code popup
3. They must enter a valid, unused invite code to continue
4. If they don't have a code, they can request one via email to admin@graffiticode.org
5. Once verified, they won't need to enter a code again

## Database Structure

The system uses two main collections:

### inviteCodes

Fields:
- `id`: UUID for the invite code
- `code`: The actual invite code string
- `createdBy`: UID of the user who created the code
- `createdAt`: Timestamp when the code was created
- `used`: Boolean indicating if the code has been used
- `usedBy`: UID of the user who used the code (if used)
- `usedAt`: Timestamp when the code was used (if used)

### users

Additional fields:
- `isVerified`: Boolean indicating if the user has been verified
- `inviteCode`: The invite code used (if verified through invite)
- `verifiedAt`: Timestamp when verification occurred
- `isAdmin`: Boolean indicating if user has admin privileges