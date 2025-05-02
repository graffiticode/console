# Invite Code System

This document provides instructions for enabling and managing the invite code system for Graffiticode.

## Overview

The invite code system requires new users to enter an invite code after signing in with their Ethereum wallet. This helps control access to the platform and prevents unwanted registrations.

## Current Implementation Status

The invite code system is currently implemented but temporarily disabled. A workaround is in place in the `check-user-verification.js` API endpoint that marks all users as verified, avoiding the need for invite codes at this time.

## Enabling the Invite Code System

To enable the invite code system:

1. Edit `/src/pages/api/check-user-verification.js` and uncomment the original code, removing the temporary workaround.
2. Edit `/src/components/InviteCodeDialog.jsx` and uncomment the original code, removing the temporary workaround.
3. Run the setup script to mark existing users as verified and create initial invite codes:

```bash
npm run setup-invite-codes
```

## Admin Scripts

### Making a User an Admin

To grant a user admin privileges:

```bash
# Make sure you have the Firebase service account key set
export FIREBASE_SERVICE_ACCOUNT_KEY=$(base64 -w 0 path/to/service-account.json)

# Run the script with the user's Ethereum address
npm run make-admin 0x1234567890abcdef1234567890abcdef12345678
```

### Setting Up Invite Codes

To mark all existing users as verified and create initial invite codes:

```bash
# Make sure you have the Firebase service account key set
export FIREBASE_SERVICE_ACCOUNT_KEY=$(base64 -w 0 path/to/service-account.json)

# Run the setup script
npm run setup-invite-codes
```

## Admin UI Features

When the invite code system is fully enabled, administrators will have access to an Invite Codes section on the settings page. From there, they can:

- Generate new invite codes (custom or random)
- View all invite codes and their status (used/available)
- Delete unused invite codes

## User Experience

1. New users sign in with their Ethereum wallet
2. After authentication, they see an invite code popup
3. They must enter a valid, unused invite code to continue
4. If they don't have a code, they can request one via email
5. Once verified, they won't need to enter a code again

## Database Structure

The system uses two main Firestore collections:

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

Additional fields added to user documents:
- `isVerified`: Boolean indicating if the user has been verified
- `inviteCode`: The invite code used (if verified through invite)
- `verifiedAt`: Timestamp when verification occurred
- `isAdmin`: Boolean indicating if user has admin privileges

## API Endpoints

The system includes several API endpoints:

- `/api/check-user-verification` - Checks if a user needs to enter an invite code
- `/api/validate-invite-code` - Validates an invite code and marks it as used
- `/api/invite-codes` - Lists or creates invite codes (admin only)
- `/api/invite-codes/[id]` - Gets or deletes a specific invite code (admin only)
- `/api/user/admin-status` - Checks if the current user is an admin

## Future Improvements

Potential improvements to consider for the invite code system:

1. Add expiration dates for invite codes
2. Implement rate limiting for invite code submissions
3. Create an admin dashboard showing invite code usage stats
4. Add the ability to batch create multiple invite codes at once
5. Implement email notifications when invite codes are used