# Momentum Gym - Integration Guide

## Complete System Architecture

Momentum Gym uses **Supabase** for authentication and **MySQL** for gym operational data.

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                       │
│  React 19 + Next.js 16 | TypeScript | Tailwind CSS v4      │
└────────────────┬────────────────────────────────┬───────────┘
                 │                                 │
        ┌────────▼─────────┐           ┌──────────▼──────────┐
        │  Supabase Auth   │           │   SWR Data Cache    │
        │ (Sign In/Up)     │           │  (Stale Revalidate) │
        └────────┬─────────┘           └──────────┬──────────┘
                 │                                 │
         ┌───────▼──────────────────────────────────▼──────┐
         │      Next.js API Routes (Server-side)           │
         │  /api/auth/create-superadmin                    │
         │  /api/members/*                                 │
         │  /api/check-in                                  │
         │  /api/zones                                     │
         │  /api/facility/metrics                          │
         │  /api/db/init                                   │
         └─────────┬──────────────────┬─────────────────────┘
                   │                  │
        ┌──────────▼────────┐  ┌─────▼──────────────┐
        │  Supabase         │  │  MySQL Connection  │
        │  - Auth API       │  │  Pool (mysql2)     │
        │  - Database API   │  │  - gym_management  │
        │                   │  │    database        │
        └──────────┬────────┘  └─────┬──────────────┘
                   │                  │
        ┌──────────▼────────┐  ┌─────▼──────────────┐
        │   Supabase        │  │   XAMPP MySQL      │
        │   - Auth          │  │   - users          │
        │   - Database      │  │   - members        │
        └───────────────────┘  │   - zones          │
                               │   - equipment      │
                               │   - check_in_logs  │
                               │   - vw_..._summary │
                               └────────────────────┘
```

## Data Flow

### 1. Authentication Flow
```
User → Login Page
   ↓
[Email/Password] → Supabase Auth API
    ↓
Auth Success → Create Session + Fetch user data from Supabase
   ↓
Store in Auth Context (React) → Access User Data & Role
   ↓
Navigate to Dashboard
```

### 2. Member Check-In Flow
```
User Selects Member → Zone → Action (Check In/Out)
   ↓
[POST /api/check-in]
   ↓
Verify User is Authenticated (Supabase Session)
   ↓
Insert into MySQL check_in_logs table
   ↓
Update Zone Occupancy Count
   ↓
Return Success + Update Cache (SWR)
   ↓
UI Shows Success Message + Refreshes Logs
```

### 3. Dashboard Data Refresh
```
Dashboard Loads
   ↓
[GET /api/facility/metrics] - MySQL query
[GET /api/members] - MySQL query
[GET /api/check-in] - MySQL query
   ↓
Cache with SWR (revalidate every 5 seconds)
   ↓
Real-time updates as new check-ins come in
```

## MySQL Database Schema

### Members Table
```sql
CREATE TABLE members (
  member_id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  membership_tier ENUM('Bronze', 'Silver', 'Gold', 'Platinum'),
  status ENUM('active', 'inactive', 'suspended'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Zones Table
```sql
CREATE TABLE zones (
  zone_id INT PRIMARY KEY AUTO_INCREMENT,
  zone_name VARCHAR(100) NOT NULL,
  description TEXT,
  capacity INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Equipment Table
```sql
CREATE TABLE equipment (
  equipment_id INT PRIMARY KEY AUTO_INCREMENT,
  zone_id INT NOT NULL,
  equipment_name VARCHAR(100) NOT NULL,
  status ENUM('available', 'in_maintenance'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (zone_id) REFERENCES zones(zone_id)
);
```

### Check-In Logs Table
```sql
CREATE TABLE check_in_logs (
  log_id INT PRIMARY KEY AUTO_INCREMENT,
  member_id INT NOT NULL,
  zone_id INT NOT NULL,
  equipment_id INT,
  action ENUM('check_in', 'check_out'),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(member_id),
  FOREIGN KEY (zone_id) REFERENCES zones(zone_id),
  FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id)
);
```

### Facility Summary View
```sql
CREATE VIEW vw_GymFacilitySummary AS
SELECT
  z.zone_id,
  z.zone_name,
  z.capacity,
  COUNT(cl.log_id) as active_count,
  ROUND((COUNT(cl.log_id) / z.capacity) * 100, 0) as occupancy_percent,
  CASE
    WHEN (COUNT(cl.log_id) / z.capacity) < 0.5 THEN 'healthy'
    WHEN (COUNT(cl.log_id) / z.capacity) < 0.8 THEN 'warning'
    ELSE 'critical'
  END as status
FROM zones z
LEFT JOIN check_in_logs cl ON z.zone_id = cl.zone_id
  AND cl.action = 'check_in'
  AND cl.timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY z.zone_id, z.zone_name, z.capacity;
```

## Supabase Auth

### Users
Supabase Auth manages user accounts with built-in authentication. User profiles and roles are stored in a `users` table in MySQL, linked to the Supabase Auth user ID.

### Row Level Security
Supabase provides Row Level Security (RLS) for database-level access control.

## API Endpoint Documentation

### POST /api/auth/create-superadmin
Creates the first superadmin account
```
Request:
{
  "email": "admin@momentum-gym.com",
  "password": "SecurePassword123!",
  "displayName": "Admin Name"
}

Response:
{
  "success": true,
  "message": "Superadmin created successfully",
  "uid": "user-id",
  "email": "admin@momentum-gym.com"
}
```

### GET /api/members
List all active members
```
Response:
{
  "success": true,
  "data": [
    {
      "member_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "membership_tier": "Gold",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/members
Create new member
```
Request:
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "phone": "555-0100",
  "membership_tier": "Silver"
}

Response:
{
  "success": true,
  "message": "Member created",
  "member_id": 2
}
```

### POST /api/check-in
Record check-in or check-out
```
Request:
{
  "member_id": 1,
  "zone_id": 2,
  "equipment_id": 5,
  "action": "check_in"
}

Response:
{
  "success": true,
  "message": "Checked in successfully",
  "log_id": 150
}
```

### GET /api/zones
Get all zones with current occupancy
```
Response:
{
  "success": true,
  "data": [
    {
      "zone_id": 1,
      "zone_name": "Cardio",
      "capacity": 20,
      "active_count": 8,
      "occupancy_percent": 40,
      "status": "healthy",
      "equipment_list": [...]
    }
  ]
}
```

### GET /api/facility/metrics
Get facility-wide metrics
```
Response:
{
  "success": true,
  "data": {
    "total_members": 145,
    "active_today": 42,
    "total_capacity": 150,
    "occupancy_percent": 28,
    "facility_status": "healthy",
    "zones": [...]
  }
}
```

## Environment Variables Reference

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# MySQL Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
```

## Deployment Checklist

### Before Deploying to Production

- [ ] Supabase project is created and configured
- [ ] All environment variables are set (never commit .env.local)
- [ ] MySQL database is backed up
- [ ] Supabase RLS policies are reviewed and applied
- [ ] HTTPS is enabled on production domain
- [ ] CORS is configured for production domain
- [ ] Rate limiting is implemented on API endpoints
- [ ] Error logging is configured (optional: Sentry, DataDog)
- [ ] Database indexes are created for common queries
- [ ] Backup strategy is in place for MySQL
- [ ] Monitoring alerts are configured

### Database Migration Checklist

- [ ] Test schema on staging environment first
- [ ] Backup current production database
- [ ] Run init script: `curl http://localhost:3000/api/db/init`
- [ ] Verify tables and views are created
- [ ] Verify data integrity after migration
- [ ] Update application configuration if needed
- [ ] Test all features after migration

## Scaling Considerations

### MySQL Optimization
- Add indexes on frequently queried columns (member_id, zone_id, timestamp)
- Use connection pooling (already configured with mysql2)
- Implement query caching for read-heavy operations
- Consider read replicas for high-traffic scenarios

### Supabase Optimization
- Use Supabase query optimization
- Implement pagination for large result sets
- Consider Supabase backup plans for disaster recovery
- Monitor billing and quota usage

### Caching Strategy
- SWR revalidation every 5 seconds for real-time data
- Redis optional for high-traffic scenarios
- Browser cache for static assets (images, CSS, JS)

## Troubleshooting Production Issues

### High Database Load
- Check slow query logs
- Add missing indexes
- Implement query result caching
- Consider database replication

### Authentication Failures
- Verify Supabase credentials in environment
- Check Supabase RLS policies
- Review Supabase Auth settings
- Check browser console for CORS errors

### Real-time Data Lag
- Verify SWR revalidation intervals
- Check MySQL query performance
- Monitor Supabase quota usage
- Consider WebSocket subscription for live updates

## Maintenance Tasks

### Daily
- Monitor database disk usage
- Check Supabase billing
- Review error logs

### Weekly
- Test backup restoration
- Review slow query logs
- Check for security updates

### Monthly
- Full database backup verification
- Supabase RLS policy review
- User activity analysis
- Performance optimization review

---

For detailed setup instructions, see:
- [README.md](./README.md) - Project overview
- [SETUP.md](./SETUP.md) - MySQL configuration
