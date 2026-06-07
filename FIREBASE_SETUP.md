# Firebase Setup Guide - Momentum Gym

This guide will help you set up Firebase Authentication and Firestore for the Momentum Gym management dashboard.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Create a new project**
3. Enter project name: `Momentum Gym`
4. Accept the terms and click **Create project**
5. Wait for the project to be created (usually takes a few seconds)

## Step 2: Register Your Web App

1. In the Firebase Console, click the **Web** icon (</>) to add a web app
2. App nickname: `Momentum Gym Dashboard`
3. Click **Register app**
4. Copy your Firebase config object - you'll need this

Your config will look like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "momentum-gym-xxx.firebaseapp.com",
  projectId: "momentum-gym-xxx",
  storageBucket: "momentum-gym-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## Step 3: Enable Authentication

1. In the Firebase Console, go to **Authentication** (left sidebar)
2. Click **Get started**
3. Click **Email/Password** provider
4. Toggle **Enable** on
5. Click **Save**

## Step 4: Create Firestore Database

1. In the Firebase Console, go to **Firestore Database** (left sidebar)
2. Click **Create database**
3. Select **Start in production mode**
4. Choose your preferred location (closest to your users)
5. Click **Create**

## Step 5: Set Firestore Security Rules

1. In Firestore, go to the **Rules** tab
2. Replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /users/{uid}/roles {
      allow read: if request.auth.uid == uid;
    }
  }
}
```

3. Click **Publish**

## Step 6: Create Service Account (for Admin SDK)

1. Go to **Project Settings** (gear icon, top right)
2. Click the **Service Accounts** tab
3. Click **Generate new private key**
4. A JSON file will download - keep it safe!
5. The file contains your admin credentials

## Step 7: Update `.env.local`

Add your Firebase credentials to `.env.local`:

```bash
# Firebase Client Config (Public - OK to share)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=momentum-gym-xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=momentum-gym-xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=momentum-gym-xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Firebase Admin SDK (Private - KEEP SECRET!)
FIREBASE_PROJECT_ID=momentum-gym-xxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@momentum-gym-xxx.iam.gserviceaccount.com
```

**Important:** The `FIREBASE_PRIVATE_KEY` must have newlines as `\n` in the .env file.

## Step 8: Create First Superadmin

1. Start your development server: `pnpm dev`
2. Open http://localhost:3000
3. Click **Create Superadmin**
4. Fill in:
   - Full Name: (your name)
   - Email: (your email)
   - Password: (secure password)
5. Click **Create Superadmin**
6. You'll be redirected to login
7. Sign in with the credentials you just created

## Step 9: Verify Everything Works

1. You should see the Momentum Gym dashboard
2. Check the sidebar shows your name and "superadmin" role
3. Try the Check-In feature to verify database connection
4. Click **Logout** to test the logout flow

## Troubleshooting

### "Firebase Admin SDK not configured"
- Check that all `FIREBASE_*` variables are set in `.env.local`
- Restart the dev server after adding env variables

### "Firebase is not configured"
- Check that all `NEXT_PUBLIC_FIREBASE_*` variables are set
- Verify they match your Firebase Console config exactly

### "User not found" on login
- Use the email/password you created in the Superadmin setup
- Make sure the account was created successfully

### Firestore writes failing
- Check the Security Rules in Firestore
- Ensure the user is authenticated (signed in)
- Check browser console for error messages

## Database Schema

The app uses:
- **MySQL** (via XAMPP) for gym equipment, members, and check-in logs
- **Firebase Firestore** for user accounts and role-based access control

User document structure in Firestore:
```json
{
  "uid": "firebase-user-id",
  "email": "user@example.com",
  "displayName": "Full Name",
  "role": "superadmin",
  "createdAt": 1234567890
}
```

## Next Steps

1. Create additional admin or staff accounts from the dashboard
2. Configure your gym zones and equipment in the Members section
3. Start tracking member check-ins
4. Monitor facility occupancy in real-time

## Support

For Firebase help, visit: https://firebase.google.com/docs
