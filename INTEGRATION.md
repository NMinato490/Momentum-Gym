# Momentum Gym - Integration Guide

## Complete System Architecture

Momentum Gym is a hybrid system that uses **Firebase** for authentication and **MySQL** for gym operational data.

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                       │
│  React 19 + Next.js 16 | TypeScript | Tailwind CSS v4      │
└────────────────┬────────────────────────────────┬───────────┘
                 │                                 │
        ┌────────▼─────────┐           ┌──────────▼──────────┐
        │  Firebase Auth   │           │   SWR Data Cache    │
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
        │  Firebase Admin   │  │  MySQL Connection  │
        │  SDK              │  │  Pool (mysql2)     │
        │  - Auth API       │  │  - gym_management  │
        │  - Firestore API  │  │    database        │
        └──────────┬────────┘  └─────┬──────────────┘
                   │                  │
        ┌──────────▼────────┐  ┌─────▼──────────────┐
        │   Firebase Cloud  │  │   XAMPP MySQL      │
        │   - Auth          │  │   - users (Firestore
        │   - Firestore DB  │  │   - members        │
        │   - Storage       │  │   - zones          │
        │   - Cloud Funcs   │  │   - equipment      │
        │   (optional)      │  │   - check_in_logs  │
        └───────────────────┘  │   - vw_..._summary │
                               └────────────────────┘
```

## Data Flow

### 1. Authentication Flow
```
User → Login Page
   ↓
[Email/Password] → Firebase Auth API
   ↓
Auth Success → Create Session + Fetch User Doc from Firestore
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
Verify User is Authenticated (Firebase Token)
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

## Firebase Firestore Structure

### Users Collection
```
/users/{uid}
  ├── uid: string (Firebase UID)
  ├── email: string
  ├── displayName: string
  ├── role: string ('superadmin' | 'admin' | 'staff' | 'user')
  └── createdAt: timestamp
```

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own profile
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    
    // Only superadmins can read other user profiles
    match /users/{document=**} {
      allow list: if isAdmin();
    }
  }
  
  function isAdmin() {
    return get(/databases/$(database)/documents/users/$(request.auth.uid))
           .data.role in ['superadmin', 'admin'];
  }
}
```

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
  "uid": "firebase-uid",
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
# MySQL Configuration
DB_HOST=localhost              # MySQL host
DB_PORT=3306                   # MySQL port
DB_USER=root                   # MySQL user
DB_PASSWORD=                   # MySQL password

# Firebase Client (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (Private/Server-only)
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...      # Must have \n for newlines
FIREBASE_CLIENT_EMAIL=...
```

## Deployment Checklist

### Before Deploying to Production

- [ ] Firebase project is created and configured
- [ ] All environment variables are set (never commit .env.local)
- [ ] MySQL database is backed up
- [ ] Firestore security rules are reviewed and published
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

### Firebase Optimization
- Use Firestore composite indexes for complex queries
- Implement pagination for large result sets
- Consider Firestore backup plans for disaster recovery
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
- Verify Firebase credentials in environment
- Check Firestore security rules
- Review Firebase Console authentication methods
- Check browser console for CORS errors

### Real-time Data Lag
- Verify SWR revalidation intervals
- Check MySQL query performance
- Monitor Firebase quota usage
- Consider WebSocket subscription for live updates

## Maintenance Tasks

### Daily
- Monitor database disk usage
- Check Firebase billing
- Review error logs

### Weekly
- Test backup restoration
- Review slow query logs
- Check for security updates

### Monthly
- Full database backup verification
- Firestore security rule review
- User activity analysis
- Performance optimization review

---

For detailed setup instructions, see:
- [README.md](./README.md) - Project overview
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase configuration
- [SETUP.md](./SETUP.md) - MySQL configuration
