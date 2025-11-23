# 🗄️ JSON Database System - PathFinder AI

## Overview

PathFinder AI now uses a **JSON-based database system** with localStorage persistence. This provides:

- ✅ **Structured Data Storage** - Clean JSON format
- ✅ **Automatic Persistence** - All changes auto-saved to localStorage
- ✅ **Export/Import** - Backup and restore your data as JSON files
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Developer Tools** - Built-in utilities for debugging

---

## 📁 Database Structure

### File Locations

```
data/
└── database.json          # JSON schema template (seed data)

services/
├── jsonDB.ts              # JSON Database implementation
└── db.ts                  # Database service (exports jsonDB)
```

### Database Schema

```json
{
  "users": [],           // User accounts (students, admins, consultants)
  "sessions": [],        // Consultation bookings
  "availability": [],    // Consultant working hours
  "faqs": [],           // Help articles and Q&A
  "assessments": [],    // Career assessment results
  "roadmaps": [],       // Generated career roadmaps
  "progress": []        // Progress tracker data
}
```

---

## 🚀 Usage

### Basic Operations

```typescript
import { db } from './services/db';

// CREATE
const newUser = db.users.create({
  id: 'u3',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: UserRole.USER,
  tier: SubscriptionTier.FREE,
  currentClass: '11th'
});

// READ
const allUsers = db.users.getAll();
const user = db.users.getById('u1');
const userByEmail = db.users.getByEmail('john@example.com');

// UPDATE
db.users.update('u1', { tier: SubscriptionTier.PREMIUM });

// DELETE
db.users.delete('u3');
```

### Query Methods

#### Users
```typescript
db.users.getAll()                    // Get all users
db.users.getById(id)                 // Get user by ID
db.users.getByEmail(email)           // Get user by email
db.users.create(user)                // Create new user
db.users.update(id, updates)         // Update user
db.users.delete(id)                  // Delete user
db.users.login(email)                // Find user for login
```

#### Sessions
```typescript
db.sessions.getAll()                 // Get all sessions
db.sessions.getById(id)              // Get session by ID
db.sessions.getByStudent(studentId)  // Get student's sessions
db.sessions.getByConsultant(id)      // Get consultant's sessions
db.sessions.create(session)          // Create new session
db.sessions.update(id, updates)      // Update session
db.sessions.delete(id)               // Delete session
```

#### FAQs
```typescript
db.faqs.getAll()                     // Get all FAQs
db.faqs.getById(id)                  // Get FAQ by ID
db.faqs.getByCategory(category)      // Get FAQs by category
db.faqs.getPending()                 // Get pending questions
db.faqs.create(faq)                  // Create new FAQ
db.faqs.update(id, updates)          // Update FAQ
db.faqs.updateAll(faqs)              // Replace all FAQs
db.faqs.delete(id)                   // Delete FAQ
```

#### Assessments
```typescript
db.assessments.getAll()              // Get all assessments
db.assessments.getAllByUserId(id)    // Get user's assessments
db.assessments.getLatestByUserId(id) // Get latest assessment
db.assessments.save(assessment)      // Save new assessment
db.assessments.delete(id)            // Delete assessment
```

#### Roadmaps
```typescript
db.roadmaps.getAll()                 // Get all roadmaps
db.roadmaps.getById(id)              // Get roadmap by ID
db.roadmaps.getAllByUserId(id)       // Get user's roadmaps
db.roadmaps.save(roadmap)            // Save new roadmap
db.roadmaps.delete(id)               // Delete roadmap
```

#### Progress Trackers
```typescript
db.progress.getAll()                 // Get all trackers
db.progress.getById(id)              // Get tracker by ID
db.progress.getByUserId(userId)      // Get user's trackers
db.progress.getByRoadmapId(id)       // Get tracker by roadmap
db.progress.save(tracker)            // Save/update tracker
db.progress.delete(id)               // Delete tracker
```

---

## 🛠️ Developer Tools

### Browser Console Commands

The database exposes utility functions in the browser console:

```javascript
// View database statistics
dbStats()
// Output: { users: 5, sessions: 1, faqs: 4, ... }

// Export database as JSON string
const json = exportDB()
console.log(json)

// Download backup file
downloadBackup()
// Downloads: pathfinder-backup-2025-11-23.json

// Reset database to defaults
resetDB()

// Access database directly
window.jsonDB.users.getAll()
```

### Programmatic Export/Import

```typescript
import { 
  exportDatabase, 
  importDatabase, 
  downloadDatabaseBackup,
  resetDatabase,
  getDBStats 
} from './services/db';

// Export as JSON string
const jsonString = exportDatabase();

// Import from JSON string
importDatabase(jsonString);

// Download backup file
downloadDatabaseBackup();

// Reset to defaults
resetDatabase();

// Get statistics
const stats = getDBStats();
console.log(stats);
```

---

## 💾 Data Persistence

### How It Works

1. **Auto-Save**: Every create/update/delete operation automatically saves to localStorage
2. **Single Key**: All data stored under one key: `pathfinder_db`
3. **JSON Format**: Data is stored as formatted JSON for readability
4. **Instant Sync**: Changes are immediately reflected across all components

### LocalStorage Key

```
Key: pathfinder_db
Value: JSON string containing entire database
```

### Check Storage Usage

```javascript
// Browser console
const data = localStorage.getItem('pathfinder_db');
const sizeInBytes = new Blob([data]).size;
const sizeInKB = (sizeInBytes / 1024).toFixed(2);
console.log(`Database size: ${sizeInKB} KB`);
```

---

## 🔄 Migration from Old System

The new system automatically migrates data from the old localStorage keys:

### Old Keys (Legacy)
- `pf_users_table`
- `pf_sessions_table`
- `pf_availability_table`
- `pf_faqs_table`
- `pf_assessments_table`
- `pf_roadmaps_table`
- `pf_progress_table`

### New Key
- `pathfinder_db` (contains all tables in one JSON object)

**Migration happens automatically on first load!**

---

## 📤 Backup & Restore

### Create Backup

#### Method 1: Browser Console
```javascript
downloadBackup()
```

#### Method 2: Programmatically
```typescript
import { downloadDatabaseBackup } from './services/db';
downloadDatabaseBackup();
```

#### Method 3: Manual Export
```javascript
// Copy from console
const backup = exportDB();
// Paste into a file named: backup.json
```

### Restore from Backup

```typescript
import { importDatabase } from './services/db';

// Read your backup file
const backupJSON = `{ "users": [...], "sessions": [...], ... }`;

// Import
importDatabase(backupJSON);

// Refresh the page to see changes
window.location.reload();
```

---

## 🧪 Testing

### Seed Data

The database comes with pre-populated seed data:

- **5 Users**: 2 students, 1 admin, 2 consultants
- **1 Session**: Sample booking
- **2 Availability Schedules**: Consultant working hours
- **4 FAQs**: Sample help articles

### Reset to Seed Data

```javascript
// Browser console
resetDB()

// Or programmatically
import { resetDatabase } from './services/db';
resetDatabase();
```

---

## 🔍 Debugging

### View Current Data

```javascript
// Browser console
window.jsonDB.users.getAll()
window.jsonDB.sessions.getAll()
window.jsonDB.faqs.getAll()

// Get stats
dbStats()
```

### Check localStorage

```javascript
// View raw JSON
const raw = localStorage.getItem('pathfinder_db');
console.log(JSON.parse(raw));

// Pretty print
console.log(JSON.parse(raw).users);
```

### Clear All Data

```javascript
// Nuclear option - removes everything
localStorage.clear();
location.reload();

// Better option - reset to defaults
resetDB();
```

---

## ⚠️ Important Notes

### Browser Limitations

- **5-10 MB Limit**: LocalStorage has size limits per domain
- **Synchronous**: Operations block the main thread (but they're fast)
- **No Encryption**: Data is stored in plain text
- **User-specific**: Each browser/user has separate storage

### Best Practices

1. **Regular Backups**: Download backups before major changes
2. **Test Imports**: Validate JSON before importing
3. **Monitor Size**: Check storage usage periodically
4. **Clear Browser Cache Carefully**: Will lose all data!

### Production Considerations

For production deployment, consider:
- Backend database (PostgreSQL, MongoDB)
- User authentication & authorization
- Data encryption
- Real-time sync
- Multi-device support

---

## 🎯 Quick Reference

### Common Tasks

```typescript
// Add a new FAQ
db.faqs.create({
  id: Date.now().toString(),
  category: 'General',
  question: 'Your question here',
  answer: 'Your answer here',
  status: 'answered'
});

// Upgrade user tier
db.users.update('u1', { tier: SubscriptionTier.PREMIUM });

// Book a session
db.sessions.create({
  id: Date.now().toString(),
  studentId: 'u1',
  studentName: 'John Doe',
  consultantId: 'c1',
  consultantName: 'Dr. Amit',
  date: '2025-11-25',
  time: '14:00',
  status: 'Scheduled'
});

// Save assessment result
db.assessments.save({
  id: Date.now().toString(),
  userId: 'u1',
  date: new Date().toISOString(),
  recommendations: [...] // AI-generated careers
});
```

---

## 📚 Resources

- **Main DB Service**: `/services/db.ts`
- **JSON DB Implementation**: `/services/jsonDB.ts`
- **Seed Data**: `/data/database.json`
- **Type Definitions**: `/types.ts`

---

**Last Updated**: November 23, 2025  
**Version**: 2.0 (JSON Database System)
