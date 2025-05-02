# Invite Code System Setup

This document provides instructions for setting up and managing the invite code system for Graffiticode.

## Overview

The invite code system requires new users to enter an invite code after signing in with their Ethereum wallet. This helps control access to the platform and prevents unwanted registrations.

## Initial Setup

When deploying for the first time:

1. Run the setup script to mark existing users as verified and create initial invite codes:

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

To grant a user admin privileges, use the Firebase console or run a script to update the user document:

```javascript
// Using Firebase Admin SDK
const admin = require('firebase-admin');
const db = admin.firestore();

async function makeUserAdmin(uid) {
  const usersRef = db.collection('users');
  const userQuery = await usersRef.where('uid', '==', uid).get();
  
  if (userQuery.empty) {
    console.error('User not found');
    return;
  }
  
  await userQuery.docs[0].ref.update({
    isAdmin: true
  });
  
  console.log(`User ${uid} is now an admin`);
}

// Call the function with the user's UID
makeUserAdmin('0x123456789...');
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