# Firebase & Firestore Setup Guide for R.O.B.B.E. Scouting

## Overview

Your scouting system now has **three levels of data storage**:

1. **Local Storage (Browser)** - Temporary data on each device
2. **Server Storage (storage.json)** - Central data served by Node.js server
3. **Firebase/Firestore (Optional)** - Cloud database for backup & sync

This guide explains how to set up and use Firebase/Firestore to store all scouting data in the cloud.

---

## Architecture

```
Scout on Device (page3.html/page5.html)
        ↓ [Enter password]
        ↓ [Click "Send to Master Database"]
Server Storage (storage.json via API)
        ↓ [Manual setup needed]
        ↓
Firebase Firestore (Cloud)
        ↓
Master Dashboard (index.html)
```

---

## Step 1: Create a Firebase Project

### 1a. Go to Firebase Console
- Visit: https://console.firebase.google.com/
- Click "Create a project" or "Add project"

### 1b. Project Setup
- **Project Name**: `ROBBE-Scouting` (or your choice)
- Click "Create project"
- Wait for project creation (~2 minutes)

### 1c. Enable Firestore
- In the Firebase Console, go to **Build → Firestore Database**
- Click **Create database**
- **Location**: Choose the location closest to your team
- **Security rules**: Start in **Test mode** (for development)
  - ⚠️ **WARNING**: Test mode allows anyone to read/write. Use production rules before competition.

---

## Step 2: Get Your Firebase Credentials

### 2a. Find Your Config
- In Firebase Console, click **⚙️ Project Settings** (top left)
- Go to **Your apps** section
- Click **Web app** (or create one if needed)
- Copy the Firebase config

### 2b. Your Config Will Look Like:
```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDxxxxxxxxxxxxxxx",
  authDomain: "robbe-scouting.firebaseapp.com",
  projectId: "robbe-scouting",
  storageBucket: "robbe-scouting.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef1234567890"
};
```

### 2c. Store Credentials Securely
- Copy your `projectId` and `apiKey`
- Save them in a safe place
- **Never commit to Git** - use environment variables

---

## Step 3: Connect to Your Server

### 3a. Update server.js (or environment variables)

The current setup uses `server.js` with `storage.json`. To connect to Firebase, you have two options:

**Option A: Cloud Backup (Recommended for start)**
- Keep using `storage.json` locally
- Manually export data to Firebase

**Option B: Direct Firestore Integration**
- Modify `server.js` to write directly to Firestore
- Delete local `storage.json`

### 3b. For Option A (Recommended Start):

In your server deployment environment, set:
```bash
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_API_KEY="your-api-key"
```

---

## Step 4: Create Firestore Database Structure

### 4a. Create Collections in Firestore Console

The system will automatically create these collections as data comes in:

#### **Collection 1: pitScouting**
```
pitScouting/
├── {auto-generated ID}
│   ├── teamNumber: 2481
│   ├── teamName: "Example Team"
│   ├── driveType: "Swerve"
│   ├── canIntake: true
│   ├── canScore: true
│   ├── canClimb: false
│   ├── notes: "Notes about team"
│   ├── scout: "Scout Name"
│   ├── sentAt: "2025-03-20T15:30:00Z"
│   ├── source: "page3"
│   └── timestamp: "2025-03-20T15:30:00Z"
```

#### **Collection 2: postMatchScouting**
```
postMatchScouting/
├── {auto-generated ID}
│   ├── teamNumber: 2481
│   ├── match: 5
│   ├── autoPoints: 15
│   ├── teleopPoints: 45
│   ├── shotballs-0: 12
│   ├── hung-0: true
│   ├── accuracy: "8/10"
│   ├── scout: "Scout Name"
│   ├── sentAt: "2025-03-20T16:45:00Z"
│   ├── source: "page5"
│   └── timestamp: "2025-03-20T16:45:00Z"
```

### 4b. Manual Setup (if needed)
If collections don't auto-create:

1. Open Firestore Console
2. Click **+ Start collection**
3. Name it: `pitScouting` (or `postMatchScouting`)
4. Click **Auto-generate ID** and add first document with sample data

---

## Step 5: Set Security Rules (Important!)

### 5a. Default Test Mode (Development Only)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 5b. Production Rules (Use Before Competition!)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow reads from anywhere
    match /{document=**} {
      allow read;
      allow write: if false;  // No writes from client
    }
  }
}
```

**Why?** This ensures data is only written from your server.

---

## Step 6: Upload Data to Firebase

### Method 1: Using Cloud Console (Manual)
1. In Firestore, click **+ Add document**
2. Enter data matching the structure above
3. Click **Save**

### Method 2: Automated Export (Recommended)

Create a script in your server repository:

**`scripts/firestore-export.js`**
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const fs = require('fs');

// Read from storage.json
const storage = JSON.parse(fs.readFileSync('./storage.json', 'utf8'));

// Upload to Firestore
Object.entries(storage).forEach(async ([key, value]) => {
  if (key.startsWith('pitScouting_')) {
    await db.collection('pitScouting').add(value);
  } else if (key.startsWith('postMatchScouting_')) {
    await db.collection('postMatchScouting').add(value);
  }
});

console.log('Data uploaded to Firestore');
process.exit(0);
```

Run with:
```bash
node scripts/firestore-export.js
```

### Method 3: CSV Import via Community Tools
- Use Firestore community tools: https://github.com/jloic/csv-to-firestore
- Export your `storage.json` as CSV
- Import into Firestore

---

## Step 7: How Data Flows

### When a Scout Submits from page3.html (Pit Scouting):

1. Scout enters form data
2. Scout clicks **"Send to Master Database"**
3. System prompts for password
4. Password verified ✓
5. Data sent to server API → `/api/storage/{teamNumber}_pit_{timestamp}`
6. Server stores in `storage.json`
7. **Optional**: Server also stores in Firestore
8. Master Dashboard fetches and displays

### When Admin Views index.html:

1. Admin loads master dashboard
2. Dashboard fetches all data from `/api/storage/`
3. Shows real-time statistics
4. Can export to CSV

---

## Step 8: Advanced - Real-time Sync

To add real-time updates when ANY device syncs data:

**In `serverSync.js`, add:**
```javascript
// Real-time Firestore listener
export async function subscribeToAllScouting(callback) {
  const db = getFirestore();
  
  onSnapshot(
    collection(db, 'pitScouting'),
    (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(data);
    }
  );
}
```

Then in `index.html` Master Dashboard:
```javascript
subscribeToAllScouting((data) => {
  // Auto-update dashboard when new data arrives
  renderDashboard(data);
});
```

---

## Troubleshooting

### Problem: "Firebase not configured"
**Solution**: 
- Check `firebaseClient.js` has correct config
- Verify `projectId` is not "your-project-id"
- Check internet connection

### Problem: "Permission denied" errors
**Solution**:
- Change Firestore security rules to Test Mode
- Or modify rules to allow reads
- Check user is authenticated

### Problem: Data not appearing in Firestore
**Solution**:
- Verify `storage.json` has data
- Check Firestore collections exist
- Run export script manually
- Check security rules allow writes

### Problem: Can't find my Firebase credentials
**Solution**:
- Go to: https://console.firebase.google.com/
- Select your project → ⚙️ Settings → Your apps → Web
- Copy the Firebase config

---

## Data Backup Strategy

### Weekly Backup to Firestore:
```bash
# Add to your cron job or CI/CD
node scripts/firestore-export.js every Sunday at 11:59pm
```

### Download Firestore Data:
1. Firestore Console → **⋮ More** → **Export/Import**
2. Click **Export collections**
3. Choose destination (Google Cloud Storage)

---

## Production Checklist

- [ ] Firebase project created
- [ ] Firestore database enabled
- [ ] Security rules set to Production
- [ ] API credentials stored securely (not in Git)
- [ ] Data export script created & tested
- [ ] Backup schedule configured
- [ ] Team password set on all scouting pages
- [ ] Master dashboard accessible from main port (8081)
- [ ] Test full submission workflow
- [ ] Verified data appears in Firestore

---

## Next Steps

1. **Immediate**: Set up accounts & passwords
2. **Before First Event**: Create Firebase, configure Firestore
3. **After Setup**: Test end-to-end (submit → Firebase → Master Dashboard)
4. **During Event**: Monitor data flow, make manual backups if needed

---

## Support

For issues:
1. Check browser console (F12 → Console tab)
2. Check server logs (terminal where `npm start` runs)
3. Check Firestore rules (should be Test Mode for development)
4. Verify network connectivity
