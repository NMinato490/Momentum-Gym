# Momentum Gym - Management Dashboard

A professional gym facility management system built with Next.js, Firebase Authentication, and MySQL database. Track member check-ins, monitor equipment usage, and manage facility occupancy in real-time.

## Features

### Authentication & Authorization
- Firebase Authentication (Email/Password)
- Role-based access control (Superadmin, Admin, Staff, User)
- Secure session management
- Automatic logout and redirect for unauthorized access

### Member Management
- View all active gym members
- Add new members with membership tiers
- Edit member information
- Deactivate/reactivate members
- Track membership status

### Check-In/Check-Out Tracking
- Real-time member check-in and check-out logging
- Zone and equipment selection
- Timestamp tracking for workout sessions
- Check-in history and analytics

### Facility Monitoring
- Real-time capacity monitoring per zone
- 5 gym zones: Cardio, Strength, Yoga, CrossFit, Swimming
- Live occupancy percentages and status indicators
- Equipment-specific tracking

### Dashboard Analytics
- Overview metrics (total members, active capacity, today's check-ins)
- Zone density visualization
- Real-time check-in logs
- Performance trends

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19
- **Authentication**: Firebase Auth
- **Database**: 
  - MySQL (XAMPP) - Gym data, check-ins, equipment
  - Firestore - User accounts and roles
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Data Fetching**: SWR (stale-while-revalidate)
- **Icons**: Lucide React

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- MySQL server running (XAMPP)
- Firebase project configured

### 1. Clone and Install
```bash
git clone <repository-url>
cd momentum-gym
pnpm install
```

### 2. Configure Firebase

Follow the detailed guide in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) to:
1. Create a Firebase project
2. Enable Email/Password authentication
3. Create a Firestore database
4. Generate service account credentials
5. Add credentials to `.env.local`

### 3. Configure MySQL

Update `.env.local` with your XAMPP credentials:
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
```

### 4. Start Development Server
```bash
pnpm dev
```

Visit http://localhost:3000

### 5. Create Superadmin Account
1. Click **Create Superadmin** on the login page
2. Fill in your details
3. Sign in with your new account
4. You'll see the dashboard with full access

## Project Structure

```
momentum-gym/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── create-superadmin/      # Superadmin creation endpoint
│   │   ├── members/                    # Member CRUD endpoints
│   │   ├── check-in/                   # Check-in/check-out logic
│   │   ├── facility/                   # Facility metrics endpoints
│   │   └── zones/                      # Zone data endpoints
│   ├── login/                          # Login page
│   ├── setup/                          # Superadmin setup page
│   ├── page.tsx                        # Home (dashboard redirect)
│   └── layout.tsx                      # Root layout with auth provider
├── components/
│   ├── dashboard.tsx                   # Main dashboard layout
│   ├── sidebar.tsx                     # Navigation sidebar
│   ├── header.tsx                      # Top header
│   ├── auth-guard.tsx                  # Route protection wrapper
│   ├── overview-metrics.tsx            # Dashboard metrics cards
│   ├── zone-capacity.tsx               # Zone capacity monitor
│   ├── check-in-form.tsx               # Member check-in form
│   ├── check-in-logs.tsx               # Recent check-in history
│   ├── members-table.tsx               # Member list and management
│   └── ui/                             # shadcn/ui components
├── context/
│   └── auth-context.tsx                # Firebase auth context provider
├── lib/
│   ├── db.ts                           # MySQL connection pool
│   └── firebase.ts                     # Firebase SDK initialization
├── public/
│   └── logo.png                        # Momentum Gym logo
├── .env.local                          # Environment variables (not in git)
├── FIREBASE_SETUP.md                   # Firebase configuration guide
├── SETUP.md                            # MySQL setup guide
└── README.md                           # This file
```

## Environment Variables

### Public (Client-side)
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

### Private (Server-side)
```
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
FIREBASE_PROJECT_ID
FIREBASE_PRIVATE_KEY
FIREBASE_CLIENT_EMAIL
```

## Database Schema

### MySQL (XAMPP)
- `members` - Gym member profiles
- `zones` - Facility zones (Cardio, Strength, etc.)
- `equipment` - Equipment per zone
- `check_in_logs` - Workout session logs
- `vw_GymFacilitySummary` - Real-time facility analytics view

### Firestore
- `users/` - User accounts with role-based access
  - `role` - superadmin, admin, staff, user
  - `email` - User email address
  - `displayName` - User display name
  - `createdAt` - Account creation timestamp

## API Endpoints

### Authentication
- `POST /api/auth/create-superadmin` - Create first admin account

### Members
- `GET /api/members` - List all members
- `POST /api/members` - Create new member
- `GET /api/members/[id]` - Get member details
- `PATCH /api/members/[id]` - Update member
- `DELETE /api/members/[id]` - Soft delete member

### Check-ins
- `GET /api/check-in` - List recent check-ins
- `POST /api/check-in` - Record check-in/check-out

### Facility
- `GET /api/zones` - List all zones with occupancy
- `GET /api/facility/metrics` - Get facility-wide metrics
- `GET /api/facility/summary` - Analytics view data

## User Roles & Permissions

### Superadmin
- Full system access
- Create/manage admin accounts
- View all facilities and members
- Access to all features

### Admin
- Manage members
- View check-in logs
- Monitor facility usage
- Cannot create other admins

### Staff
- Record member check-ins
- View facility status
- View current occupancy

### User
- View personal check-in history
- View facility availability (read-only)

## Troubleshooting

### "Database Connection Error"
- Ensure MySQL is running on the configured host/port
- Check `.env.local` for correct credentials
- See [SETUP.md](./SETUP.md) for MySQL configuration

### "Firebase not configured"
- Verify all `FIREBASE_*` and `NEXT_PUBLIC_FIREBASE_*` env vars are set
- Restart dev server after adding/changing env vars
- See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed setup

### Authentication Issues
- Clear browser cookies/storage and try again
- Check Firebase Console for authentication method enablement
- Verify Firestore rules are published

### Performance Issues
- Check database query logs
- Verify indexes on frequently queried columns
- Monitor Firebase quota usage in Console

## Deployment

### To Vercel
```bash
pnpm build
vercel deploy
```

Configure environment variables in Vercel project settings before deploying.

### To Self-Hosted Server
```bash
pnpm build
pnpm start
```

Ensure MySQL and Firebase credentials are configured on the server.

## Security Considerations

1. **Never commit `.env.local`** - Always keep secrets out of git
2. **Firebase Admin SDK** - Private key should only be on server
3. **Database** - Use strong passwords and restrict network access
4. **CORS** - Configure properly for production domains
5. **HTTPS** - Always use HTTPS in production
6. **Rate Limiting** - Implement on API endpoints for production

## Contributing

Contributions are welcome! Please follow the existing code style and patterns.

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
1. Check [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for Firebase configuration
2. Check [SETUP.md](./SETUP.md) for MySQL configuration
3. Review error messages in browser console and server logs
4. Check Firebase Console and MySQL logs for detailed errors

## Roadmap

- Mobile app version
- Advanced analytics and reporting
- Equipment maintenance tracking
- Member billing integration
- SMS/Email notifications
- Integration with gym equipment APIs
- Multi-location support
- Custom report builder

---

**Momentum Gym** - Professional gym management made simple. © 2024
