const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 8081;
const STORAGE_FILE = path.join(__dirname, 'storage.json');

// Enable CORS so other tablets/laptops can send data to this one
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Ensure storage file exists
if (!fs.existsSync(STORAGE_FILE)) {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify({ pitScouting: [], matchScouting: [] }, null, 2));
}

// Endpoint to get all data (for the Master Dashboard)
app.get('/api/storage', (req, res) => {
    const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
    res.json(data);
});

// Endpoint to save data from scouts
app.post('/api/sync', (req, res) => {
    const { type, payload } = req.body; // type: 'pitScouting' or 'matchScouting'
    
    try {
        const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
        
        if (!data[type]) data[type] = [];
        
        // Add timestamp and ID
        const entry = {
            ...payload,
            serverTimestamp: new Date().toISOString(),
            id: Date.now() + Math.random().toString(36).substr(2, 9)
        };
        
        data[type].push(entry);
        
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
        console.log(`Successfully synced ${type} for Team ${payload.teamNumber}`);
        
        res.json({ success: true, entry });
    } catch (error) {
        console.error('Sync Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`-------------------------------------------`);
    console.log(`🚀 R.O.B.B.E. LOCAL SERVER RUNNING`);
    console.log(`Master Dashboard: http://localhost:${PORT}`);
    console.log(`Scout devices should connect to your IP address.`);
    console.log(`-------------------------------------------`);
});