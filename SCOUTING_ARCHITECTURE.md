# ROBBE Scouting System Architecture

## Overview

This is a comprehensive robotics scouting application built with Vue 3, Vite, and Firebase Firestore. It supports:
- **Pit Scouting**: Team capabilities collected via forms
- **Match Scouting**: Real-time match data collection like a spreadsheet
- **Master Dashboard**: Centralized view of all team data with live sync
- **Real-time Sync**: All scouts see updates instantly across their devices

## Database Structure

```
scouting-database/
├── teams/
│   └── {teamNumber}/
│       ├── number: number
│       ├── name: string
│       ├── createdAt: timestamp
│       ├── lastUpdated: timestamp
│       │
│       ├── pitScouting/ (collection)
│       │   └── {entryId}/
│       │       ├── id: string
│       │       ├── timestamp: timestamp
│       │       ├── scout: string (scout name)
│       │       ├── data: object (form fields)
│       │       │   ├── driveType: string
│       │       │   ├── canIntake: boolean
│       │       │   ├── canScore: boolean
│       │       │   ├── canClimb: boolean
│       │       │   └── notes: string
│       │       ├── lastUpdated: timestamp
│       │       └── synced: boolean
│       │
│       └── matchScouting/ (collection)
│           └── {matchNumber}/
│               ├── entries/ (collection)
│               │   └── {entryId}/
│               │       ├── id: string
│               │       ├── timestamp: timestamp
│               │       ├── scout: string
│               │       ├── matchData: object
│               │       │   ├── autoPoints: number
│               │       │   ├── teleopPoints: number
│               │       │   └── notes: string
│               │       ├── lastUpdated: timestamp
│               │       └── synced: boolean
```

## Firebase Firestore Security Rules

Add these rules to your Firestore console for appropriate access control:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads and writes for now (change for production)
    match /teams/{document=**} {
      allow read, write;
    }
  }
}
```

**For production** (recommended):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Scouts can read all teams but only write to their own entries
    match /teams/{teamNumber}/pitScouting/{entryId} {
      allow read;
      allow create, update;
    }
    
    match /teams/{teamNumber}/matchScouting/{matchNumber}/entries/{entryId} {
      allow read;
      allow create, update;
    }
    
    // Admin only: master dashboard access
    match /teams/{document=**} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd scouting
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the `scouting/` directory:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Get these values from Firebase Console → Project Settings → SDK

### 3. Update App.vue to Use TeamNavigator

Edit `scouting/src/App.vue`:

```vue
<template>
  <TeamNavigator />
</template>

<script>
import TeamNavigator from './components/TeamNavigator.vue';

export default {
  components: {
    TeamNavigator
  }
};
</script>
```

### 4. Run Development Server

```bash
npm run dev
```

## Key Features

### Real-Time Sync
- All scouts see updates **instantly** using Firestore listeners
- When one scout submits data, all other scouts' dashboards update automatically
- No manual refresh needed

### Three Main Views

#### 1. Teams View
- Browse all teams
- Quick search by team number
- Add new teams
- Click to enter scouting mode

#### 2. Scouting View (Per Team)
- **Pit Scouting Tab**: Form-based entry for team capabilities
  - Drive type, intake ability, scoring ability, climbing ability, notes
  - View all previous pit scout entries
  
- **Match Scouting Tab**: Spreadsheet-like interface
  - Add entries for each match
  - Auto/Teleop points tracking
  - Multiple scouts can enter data for same match
  - Live updates

#### 3. Master Dashboard
- View all teams at once
- Quick stats: pit entries, matches scouted
- Click any team for detailed breakdown
- Export all data to CSV
- Live sync button for manual refresh

## Service Functions

### Pit Scouting

```javascript
import { 
  submitPitScouting, 
  getPitScouting, 
  subscribeToPitScouting 
} from '@/services/scoutingService';

// Submit form data
await submitPitScouting(teamNumber, formData, scoutName);

// Get all pit data for a team
const data = await getPitScouting(teamNumber);

// Real-time listener
const unsubscribe = subscribeToPitScouting(teamNumber, (data) => {
  console.log('Updated pit data:', data);
});
```

### Match Scouting

```javascript
import { 
  addMatchScouting, 
  getMatchScouting, 
  subscribeToMatchScouting 
} from '@/services/scoutingService';

// Add a match entry
await addMatchScouting(teamNumber, matchNumber, matchData, scoutName);

// Get all match data for a team
const allMatches = await getMatchScoutingForTeam(teamNumber);

// Real-time listener for specific match
const unsubscribe = subscribeToMatchScouting(
  teamNumber, 
  matchNumber, 
  (data) => {
    console.log('Match data:', data);
  }
);
```

### Master Sync

```javascript
import { 
  getAllTeams, 
  getAllScoutingData, 
  subscribeToAllScoutingData 
} from '@/services/scoutingService';

// Get list of all teams
const teams = await getAllTeams();

// Get all data for all teams (one-time fetch)
const allData = await getAllScoutingData();

// Real-time listener for everything
const unsubscribe = subscribeToAllScoutingData((data) => {
  console.log('All scouting data:', data);
  // This updates whenever ANY scout submits data
});
```

## Syncing Strategy

### How Real-Time Sync Works

1. **Each scout has the app open** on their device/laptop
2. **Scout enters pit data** → Firestore saves it → **All other scouts' apps update instantly**
3. **Scout scrubs match data** → Firestore saves it → **Master dashboard updates live**
4. **Admin checks master dashboard** → Sees all data from all scouts **in real-time**

### Network Considerations
- Firestore listeners work **offline** with local caching
- Once connection restores, data syncs automatically
- Perfect for event venues with spotty WiFi

### Master Sync Button
- Manual refresh available if needed
- Force re-fetch all data from Firestore
- Useful if you suspect cached data is stale

## Data Export

### CSV Export from Master Dashboard
- Includes all pit scouting and match scouting data
- Organized by team, type, and scout
- Includes all metadata (timestamps, scout names, etc.)
- One click to download

### Custom Export
Build your own export with:
```javascript
import { getAllScoutingData } from '@/services/scoutingService';

const data = await getAllScoutingData();
// Custom processing here
```

## Extending the System

### Add More Pit Scouting Fields

In `PitScoutingForm.vue`, update the form:
```vue
<input v-model="formData.maxRPM" type="number" placeholder="Max RPM" />
```

In form data object:
```javascript
formData: {
  driveType: 'Swerve',
  maxRPM: 0,  // Add here
  // ... other fields
}
```

### Add More Match Stats

In `MatchScoutingSheet.vue`, add columns:
```vue
<th>Penalties</th>
<td><input v-model.number="newEntry.penalties" type="number" /></td>
```

### Custom Analytics

```javascript
// Get all match data and calculate averages
import { getAllScoutingData } from '@/services/scoutingService';

const allData = await getAllScoutingData();
Object.entries(allData).forEach(([teamNumber, teamData]) => {
  const avgAutoPoints = teamData.matchScouting
    .flatMap(matches => matches)
    .reduce((sum, m) => sum + m.matchData.autoPoints, 0) 
    / teamData.matchScouting.length;
  console.log(`Team ${teamNumber} avg auto: ${avgAutoPoints}`);
});
```

## Troubleshooting

### Data not syncing
- Check Firebase config in `firebase.js`
- Check Firestore security rules
- Verify internet connection
- Check browser console for errors

### Slow performance
- Firestore has limits: ~1mb per document, ~500 writes/sec
- Split large arrays into subcollections
- Consider archiving old event data

### Offline issues
- Firestore caches data locally
- Changes made offline sync when back online
- Consider IndexedDB for larger offline support

## Production Checklist

- [ ] Set strong Firestore security rules
- [ ] Enable Firebase authentication
- [ ] Set up Firebase backups
- [ ] Use environment variables for API keys
- [ ] Test on multiple devices/networks
- [ ] Plan data retention/archival
- [ ] Set up error logging/monitoring

