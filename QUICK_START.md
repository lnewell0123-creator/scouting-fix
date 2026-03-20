# R.O.B.B.E. Scouting - Quick Start Guide

## ✅ What's Been Set Up

Your scouting system now has:

### **Master Dashboard (index.html)**
- Shows all synced submissions from across all devices
- Real-time statistics by team
- Export data to CSV
- Auto-refreshes every 20 seconds
- **Go to**: http://localhost:8081/

### **Pit Scouting Form (page3.html)**
- Form for team pit capabilities
- Password-protected "Send to Master Database" button
- Data synced to central server

### **Match Scouting Sheet (page5.html)**
- Spreadsheet-style entry for match data
- Multiple rows per match
- Password-protected "Send to Master Database" button

### **Synced Data Display (page2.html)**
- Shows all submissions synced to the database
- Groups by team
- Updates every 30 seconds

---

## 🚀 How to Use

### Step 1: Start the Server
```bash
cd /workspaces/Scouting
npm start
```

Server runs at: **http://localhost:8081/**

### Step 2: Set a Password

On **page3.html** or **page5.html**:
1. Click **"Set/Change Password"**
2. Enter any password (e.g., "scouting2025")
3. Confirm password
4. Click OK

This password protects submissions from being sent to the master database.

### Step 3: Enter Scouting Data

**For Pit Scouting (page3.html):**
1. Fill out the form (Team Number required)
2. Click **"Submit"** - saves locally
3. Click **"Send to Master Database"**
4. Enter password
5. Data now appears on page2 and master dashboard

**For Match Scouting (page5.html):**
1. Fill out table rows (Team Number required)
2. Click **"Send to Master Database"**
3. Enter password
4. Data synced to server

### Step 4: View Master Dashboard

**http://localhost:8081/**
- Shows all synced data in real-time
- Click on teams to expand details
- Click "Refresh All Data" for manual refresh
- Click "Export to CSV" to download

---

## 📊 Data Flow

```
Scout enters data (page3 or page5)
        ↓
Save to browser (localStorage)
        ↓
Click "Send to Master Database" + password
        ↓
Server storage.json (persistent)
        ↓
Master Dashboard displays it (index.html)
        ↓
All other scouts see it (live refresh)
```

---

## 🔐 Password System

- **Set Password**: "Set/Change Password" button on page3/page5
- **Why**: Only authorized scouts can send data to master
- **Master Password**: If you forget, use "admin" as fallback
- **Change Anytime**: Just click "Set/Change Password" again

---

## 💾 Data Storage

### Local Storage (Browser)
- Each device stores temp data locally
- Cleared if browser cache is cleared
- Falls back to localStorage if server is down

### Server Storage (storage.json)
- Persistent storage on the server
- All submissions synced here when password verified
- Survives server restarts
- Can be backed up manually

### Firebase/Firestore (Optional)
- See FIREBASE_SETUP.md for cloud backup
- NOT required to use the system
- Useful for long-term storage & cross-device sync

---

## 📱 Multi-Device Setup

### Device 1 (Pit Scouting Station):
- Open http://localhost:8081/page3.html
- Set password: "scouting2025"
- Enter pit data, send to master

### Device 2 (Match Scouting Station):
- Open http://localhost:8081/page5.html
- Set same password: "scouting2025"
- Enter match data, send to master

### Device 3 (Admin/Master):
- Open http://localhost:8081/
- See all data in real-time
- Export when needed

All devices use same server = shared data!

---

## 🆘 Troubleshooting

### "Server is not running"
```bash
npm start
```
Server must be running for syncing to work.

### "Send to Master Database button not working"
1. Check password is set: "Set/Change Password"
2. Check server is running
3. Check internet connection between devices
4. Check browser console (F12) for errors

### "Data not appearing on master dashboard"
1. Make sure data was submitted (not just saved locally)
2. Click "Refresh All Data" on master dashboard
3. Check server logs for errors
4. Verify password was correct

### "I forgot the password"
- Click "Set/Change Password" again
- Or use master password: "admin"
- Then set a new password

### "Can't connect between devices"
- Both must use same server URL
- Use IP address: `http://{YOUR_IP}:8081/` instead of localhost
- Check firewall (port 8081 must be open)

---

## 📋 Field Guide

### Pit Scouting Form (page3.html)
**Required:**
- Team Number
- Team Name
- Leader
- Auto Strat

**Optional:**
- Drive Type
- Intake ability
- Scoring ability
- Climbing ability
- Notes

### Match Scouting Sheet (page5.html)
**Required:**
- Team Number

**Optional (customize as needed):**
- Match #
- Hung
- Shot Balls
- Auto Points
- Teleop Points
- Accuracy
- (Add more columns with "Add Column" button)

---

## 🎯 Tips for Success

1. **Test Before Event**
   - Set passwords on all devices
   - Submit sample data from each station
   - Verify it appears on master dashboard

2. **Backup Your Data**
   - Export CSV regularly (button on master dashboard)
   - Save to USB drive
   - Email to team lead

3. **Multi-Station Setup**
   - Have one device per scouting type (pit/match)
   - Use different tablets/laptops to reduce strain
   - All sync automatically

4. **Password Best Practices**
   - Use something memorable but secure
   - Tell all scouts the password
   - Don't use team number
   - Can change between events

5. **During Event**
   - Keep master dashboard visible on projection/monitor
   - Check data every few matches
   - Watch for duplicate entries
   - Backup data multiple times

---

## 📚 Advanced Topics

### Custom Fields
In page3.html or page5.html:
1. Click "Add Question" (page3) or "Add Column" (page5)
2. Enter field name
3. New field appears in future submissions

### Export Data
1. Go to Master Dashboard (index.html)
2. Click "Export to CSV"
3. Opens in Excel, Google Sheets, or Numbers
4. Can add graphs, pivot tables, analysis

### Firebase Cloud Backup (Optional)
See FIREBASE_SETUP.md for:
- Cloud data backup to AWS/Google Cloud
- Real-time sync across offices
- Long-term data archiving

---

## 🔑 Files Reference

| File | Purpose |
|------|---------|
| `index.html` | Master Dashboard (main entry point) |
| `page2.html` | Synced Data List |
| `page3.html` | Pit Scouting Form |
| `page5.html` | Match Scouting Sheet |
| `server.js` | Node.js server, handles API & storage |
| `storage.json` | Persistent data file |
| `serverSync.js` | Syncing library (page3/5/2 use this) |
| `app.js` | Form logic & UI handlers |
| `FIREBASE_SETUP.md` | Cloud backup instructions |

---

## 🎓 Example Workflow

**Event Day: 10:00 AM**

1. Admin opens: http://192.168.1.100:8081/
   - Sees empty master dashboard

2. Scout A (Pit Team) goes to: http://192.168.1.100:8081/page3.html
   - Enters Team 2481 pit data
   - Clicks "Send to Master Database"
   - Data appears on admin's dashboard

3. Scout B (Match Team) goes to: http://192.168.1.100:8081/page5.html
   - Enters Team 2481 Match 1 data
   - Clicks "Send to Master Database"  
   - Admin's dashboard updates with match data too

4. Admin (12:00 PM) clicks "Export to CSV"
   - Backs up all morning's data

5. Final match (4:00 PM):
   - Scouts enter final data
   - Admin exports final CSV
   - System shuts down

**Total data**: All teams, all matches, all scout entries preserved!

---

## 📞 Support

If you need help:
1. Check browser console (F12 → Console)
2. Search for error message in FIREBASE_SETUP.md
3. Check server logs (where you ran `npm start`)
4. Verify network connectivity

---

## ✨ You're Ready!

- [ ] Server running (`npm start`)?
- [ ] Master dashboard accessible (http://localhost:8081/)?
- [ ] Password set on page3 and page5?
- [ ] Test submission sent successfully?
- [ ] Data appears on master dashboard?

**If all checked ✓ - You're ready to scout!**

Have a great event! 🤖
