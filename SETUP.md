# Gym Facility Management System - Setup Guide

A professional gym equipment usage and facility management dashboard built with Next.js and MySQL, featuring real-time capacity monitoring, member check-ins, and facility metrics.

## Features

✅ **Member Management** - Add, view, and manage gym members with different membership tiers  
✅ **Check-In/Check-Out Tracking** - Log member facility usage across different zones  
✅ **Real-Time Capacity Monitor** - Live occupancy tracking per zone (Cardio, Strength, Yoga, CrossFit, Swimming)  
✅ **Facility Metrics** - View active members, peak hours, equipment usage  
✅ **Workout Logging** - Complete audit trail with MySQL logs and analytics view  
✅ **Professional Dashboard** - Modern UI with sidebar navigation and real-time data updates  

## Prerequisites

- **XAMPP** running with MySQL enabled
- **Node.js** 18+ installed
- **pnpm** package manager (or npm/yarn)

## Setup Instructions

### Step 1: Configure MySQL Connection

Edit `.env.local` in the project root:

```bash
# .env.local
DB_HOST=localhost        # or your XAMPP IP (e.g., 192.168.1.100)
DB_PORT=3306            # MySQL port (default 3306)
DB_USER=root            # MySQL username
DB_PASSWORD=            # MySQL password (empty by default in XAMPP)
```

**If your XAMPP is on a different machine:**
```bash
DB_HOST=192.168.1.100   # Replace with your XAMPP IP
```

**If your XAMPP has a password:**
```bash
DB_PASSWORD=your_password
```

### Step 2: Ensure XAMPP MySQL is Running

1. Open XAMPP Control Panel
2. Make sure **MySQL** is running (click Start if needed)
3. Verify MySQL is listening on port 3306

### Step 3: Install Dependencies

```bash
pnpm install
```

### Step 4: Start the Development Server

```bash
pnpm dev
```

The app will automatically:
- Attempt to connect to MySQL
- Create the `gym_management` database (if it doesn't exist)
- Create all required tables:
  - `members` - Member information and membership details
  - `zones` - Gym zones (Cardio, Strength, Yoga, CrossFit, Swimming)
  - `equipment` - Equipment per zone
  - `check_in_logs` - Complete workout session logs
- Create a database view (`vw_GymFacilitySummary`) for real-time facility metrics
- Seed initial data (sample members, zones, equipment)

### Step 5: Access the Dashboard

Open your browser and go to `http://localhost:3000`

## Database Schema

### Members Table
- member_id (PK)
- first_name, last_name
- email, phone
- membership_type (basic/premium/vip)
- is_active
- join_date

### Zones Table
- zone_id (PK)
- zone_name (unique)
- capacity
- description

### Equipment Table
- equipment_id (PK)
- zone_id (FK)
- equipment_name
- equipment_type
- status (available/in_use/maintenance)

### Check-In Logs Table
- log_id (PK)
- member_id (FK)
- zone_id (FK)
- equipment_id (FK)
- check_in_time
- check_out_time
- duration_minutes

### Database View (vw_GymFacilitySummary)
Real-time analytics with:
- zone_id, zone_name, capacity
- active_members count
- occupancy_percentage
- density_status (Healthy/Warning/Critical)
- equipment_in_use count
- total_equipment count

## Features

### Dashboard Tab
- **Overview Metrics**: Active members, total capacity, number of zones
- **Zone Capacity Monitor**: Real-time capacity per zone with status indicators
- **Recent Check-Ins**: Live log of member check-ins/check-outs

### Check-In Tab
- **Member Check-In Form**: Select member and zone, choose check-in/check-out action
- **Check-In Logs**: View all recent member activities with duration tracking

### Members Tab
- **Member List**: View all members with details (ID, name, email, phone, membership type, status)
- **Add Member**: Create new member records with membership tier selection
- **Deactivate Member**: Soft-delete members (marks as inactive without removing data)

## API Endpoints

### Members
- `GET /api/members` - List all members
- `POST /api/members` - Create new member
- `GET /api/members/[id]` - Get member details
- `PUT /api/members/[id]` - Update member
- `DELETE /api/members/[id]` - Deactivate member

### Check-Ins
- `GET /api/check-in` - Get recent check-in logs
- `POST /api/check-in` - Record check-in or check-out

### Zones
- `GET /api/zones` - List all zones with capacity info

### Facility Metrics
- `GET /api/facility/metrics` - Get real-time facility summary using the database view

### Database Initialization
- `GET /api/db/init` - Initialize database (runs automatically on first load)

## Troubleshooting

### "Database Connection Error: connect ECONNREFUSED"
- Verify XAMPP MySQL is running
- Check `.env.local` has correct DB_HOST and DB_PORT
- Ensure firewall isn't blocking port 3306

### "Database already exists" warning
- This is normal if you've run the app before
- The system automatically uses existing database

### Members/zones not showing
- Check that MySQL connection is successful (no error message)
- Verify tables were created by checking XAMPP phpMyAdmin at http://localhost/phpmyadmin

### Can't connect to remote XAMPP
- Use IP address instead of 'localhost': `DB_HOST=192.168.1.100`
- Ensure MySQL is listening on all interfaces (not just localhost)
- Check firewall allows port 3306 connections

## Data Flow

1. **Member Arrival** → Check-In Form selects member and zone
2. **Check-In Request** → API logs to check_in_logs table (check_in_time)
3. **Real-Time Update** → Zone capacity metric updates immediately
4. **Member Leaves** → Check-Out marks check_out_time and calculates duration_minutes
5. **Analytics** → vw_GymFacilitySummary view calculates occupancy_percentage and density_status

## Technology Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS, Lucide Icons
- **Data Fetching**: SWR (stale-while-revalidate) for real-time updates
- **Backend**: Next.js API Routes
- **Database**: MySQL 5.7+ with native views
- **Styling**: Tailwind CSS with custom color scheme

## Performance Notes

- Zone metrics refresh every 30 seconds
- Check-in logs refresh every 15 seconds
- Members list refreshes on demand
- All queries are indexed on relevant columns for fast lookups

## License

MIT - Use freely for educational and commercial purposes
