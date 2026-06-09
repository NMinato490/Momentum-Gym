# Momentum Gym - Management Dashboard

A professional gym facility management system built with Next.js, Supabase Authentication, and MySQL. Track member check-ins, monitor equipment usage, and manage facility occupancy in real-time.

## Features

### Authentication & Authorization
- Supabase Authentication (Email/Password)
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

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Authentication** | Supabase Auth |
| **Database** | MySQL (XAMPP) — gym data, check-ins, equipment |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | shadcn/ui, Radix UI |
| **Animation** | Framer Motion |
| **Data Fetching** | SWR (stale-while-revalidate) |
| **Icons** | Lucide React |

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- MySQL server running (XAMPP)
- Supabase account

### 1. Clone and Install
```bash
git clone <repository-url>
cd momentum-gym
pnpm install
```

### 2. Configure Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from **Settings > API**
3. Enable **Email/Password** authentication in **Auth > Providers**
4. Add credentials to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

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

## Project Structure

```
momentum-gym/
├── app/
│   ├── api/
│   │   ├── auth/                    # Authentication endpoints
│   │   ├── members/                 # Member CRUD endpoints
│   │   ├── check-in/                # Check-in/check-out logic
│   │   ├── facility/                # Facility metrics endpoints
│   │   ├── zones/                   # Zone data endpoints
│   │   ├── db/init                  # Database initialization
│   │   ├── export/                  # Data export endpoints
│   │   └── mysql/status             # MySQL connection status
│   ├── login/                       # Login page
│   ├── setup-auth/                  # Auth setup page
│   ├── members/                     # Member management
│   ├── check-in/                    # Check-in flow
│   ├── admin-management/            # Admin account management
│   ├── profile/                     # User profile
│   ├── settings/                    # Application settings
│   ├── sync/                        # Data sync/export
│   ├── page.tsx                     # Home/dashboard
│   └── layout.tsx                   # Root layout
├── components/
│   ├── dashboard.tsx                # Main dashboard layout
│   ├── sidebar.tsx                  # Navigation sidebar
│   ├── header.tsx                   # Top header
│   ├── auth-guard.tsx               # Route protection wrapper
│   ├── overview-metrics.tsx         # Dashboard metrics cards
│   ├── zone-capacity.tsx            # Zone capacity monitor
│   ├── check-in-form.tsx            # Member check-in form
│   ├── check-in-logs.tsx            # Recent check-in history
│   ├── members-table.tsx            # Member list and management
│   ├── pages/                       # Page-level components
│   └── ui/                          # shadcn/ui components
├── context/
│   └── auth-context.tsx             # Supabase auth context provider
├── lib/
│   ├── db.ts                        # MySQL connection pool
│   └── supabase.ts                  # Supabase client
├── public/                          # Static assets
└── scripts/                         # Migration and utility scripts
```

## Environment Variables

### Supabase (Client-side)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### MySQL (Server-side)
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
```

## API Endpoints

### Authentication
- `POST /api/auth/create-admin` — Create a new admin account
- `GET /api/auth/list-admins` — List existing admin accounts
- `POST /api/auth/setup-accounts` — Initial auth account setup

### Members
- `GET /api/members` — List all members
- `POST /api/members` — Create new member
- `GET /api/members/[id]` — Get member details
- `PUT /api/members/[id]` — Update member
- `DELETE /api/members/[id]` — Soft delete member

### Check-ins
- `GET /api/check-in` — List recent check-ins
- `POST /api/check-in` — Record check-in/check-out

### Facility
- `GET /api/zones` — List all zones with occupancy
- `POST /api/zones/manage` — Manage zone capacities
- `GET /api/facility/metrics` — Get facility-wide metrics

### Database
- `POST /api/db/init` — Initialize database schema
- `GET /api/mysql/status` — MySQL connection status

### Export
- `GET /api/export` — Export data
- `GET /api/export/mysql` — Export MySQL data
- `GET /api/export/sheets` — Export to Google Sheets

## Troubleshooting

### "Database Connection Error"
- Ensure MySQL is running on the configured host/port
- Check `.env.local` for correct credentials
- See [SETUP.md](./SETUP.md) for MySQL configuration

### "Supabase not configured"
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Restart dev server after adding/changing env vars

### Authentication Issues
- Clear browser cookies/storage and try again
- Check Supabase Auth settings for Email/Password provider
- Verify Supabase project is active

### Performance Issues
- Check database query logs
- Verify indexes on frequently queried columns
- Monitor Supabase quota usage

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

Ensure MySQL and Supabase credentials are configured on the server.

## Security Considerations

1. **Never commit `.env.local`** — Always keep secrets out of git
2. **Database** — Use strong passwords and restrict network access
3. **CORS** — Configure properly for production domains
4. **HTTPS** — Always use HTTPS in production
5. **Rate Limiting** — Implement on API endpoints for production

---

**Momentum Gym** — Professional gym management made simple.
