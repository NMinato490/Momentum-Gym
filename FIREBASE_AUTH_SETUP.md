# Firebase Authentication Setup - Momentum Gym

## Quick Start: 2 Demo Accounts Ready to Use

Your Momentum Gym dashboard comes with **2 pre-configured demo accounts** for immediate testing:

### Demo Account Credentials

Login page displays these accounts for quick access:

**Superadmin Account**
- Email: `superadmin@momentumgym.com`
- Password: `SuperAdmin123!`
- Role: Full system access

**Admin Account**
- Email: `admin@momentumgym.com`
- Password: `Admin123!`
- Role: Facility management access

## Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a new project"
3. Name it: `Momentum Gym`
4. Accept Firebase terms and create

### Step 2: Add Firebase Config to Project

1. In Firebase Console, click the Web icon (</> symbol)
2. Register your app as "Momentum Gym Web"
3. Copy the config credentials
4. Add to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
```

### Step 3: Enable Email Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Sign-in method**
3. Enable **Email/Password** provider
4. Click **Save**

### Step 4: Create the 2 Demo Accounts

In Firebase Console > Authentication > Users tab:

1. Click **Add user**
2. Create first account:
   - Email: `superadmin@momentumgym.com`
   - Password: `SuperAdmin123!`
3. Click **Add user** again
4. Create second account:
   - Email: `admin@momentumgym.com`
   - Password: `Admin123!`

### Step 5: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Select **Start in production mode**
4. Choose region (e.g., `us-central1`)
5. Click **Create**

### Step 6: Set Firestore Rules

After database is created:

1. Go to **Firestore > Rules** tab
2. Replace rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /roles/{uid} {
      allow read: if request.auth.uid == uid;
      allow write: if request.auth.uid == uid;
    }
  }
}
```

3. Click **Publish**

### Step 7: Create Users Collection

1. In Firestore, click **+ Start collection**
2. Collection name: `users`
3. Auto ID for first document
4. Add fields:

```json
{
  "displayName": "Super Admin",
  "email": "superadmin@momentumgym.com",
  "role": "superadmin",
  "createdAt": (current timestamp)
}
```

5. Click **+ Start collection** again
6. Collection name: `users` (same as above)
7. Auto ID for second document
8. Add fields:

```json
{
  "displayName": "Admin",
  "email": "admin@momentumgym.com",
  "role": "admin",
  "createdAt": (current timestamp)
}
```

### Step 8: Restart Development Server

```bash
pnpm dev
```

## Testing Login

1. Visit `http://localhost:3000/login`
2. Click demo account buttons OR manually enter:
   - Email: `superadmin@momentumgym.com`
   - Password: `SuperAdmin123!`
3. Click "Sign In"
4. You'll be redirected to dashboard

## Role-Based Access Control

### Superadmin Permissions
- Full system access
- User management
- Facility configuration
- System settings
- View all reports

### Admin Permissions
- Facility management
- Member check-ins
- Zone configuration
- Basic reporting

## Changing Passwords

**In Firebase Console:**

1. Go to Authentication > Users
2. Click user email
3. Click the 3-dot menu
4. Select "Change password"
5. Enter new password

**Note:** Changes take effect immediately.

## Disabling/Enabling Accounts

In Firebase Console > Authentication > Users:

1. Click user email
2. Click 3-dot menu
3. Select "Disable" or "Enable"

Disabled users cannot log in.

## Troubleshooting

### "Firebase is not configured"
- Check all 6 Firebase keys in `.env.local`
- Verify spelling matches Firebase Console exactly
- Restart dev server after updating `.env.local`

### "User not found"
- Verify email exists in Firebase Authentication
- Check spelling matches exactly
- Passwords are case-sensitive

### "Wrong password"
- Passwords are case-sensitive
- Use: `SuperAdmin123!` or `Admin123!`
- Reset password in Firebase Console if needed

### Database not initializing
- Confirm Firestore is created
- Check Firestore rules are published
- Verify IAM permissions in Firebase Project Settings

## Security Notes

⚠️ **Important for Production:**
- Change demo account passwords immediately
- Use strong, unique passwords for production
- Enable email verification
- Set up 2FA for admin accounts
- Use environment-specific Firebase projects
- Never commit `.env.local` to version control

## Next Steps

1. ✅ Firebase project created
2. ✅ Authentication enabled
3. ✅ Demo accounts set up
4. ✅ Firestore configured
5. Ready to deploy!

Visit `http://localhost:3000/login` and log in with demo credentials to begin using Momentum Gym.

---

**Need help?** Check the main README.md for additional resources.
