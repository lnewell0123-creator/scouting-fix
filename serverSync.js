// Local Network Sync Library
const serverSync = {
    // If running on a scout tablet, change 'localhost' to the Master Laptop's IP
    // e.g., 'http://192.168.1.15:8081'
    getServerUrl: () => {
        const savedIp = localStorage.getItem('master-server-ip');
        return savedIp ? `http://${savedIp}:8081` : window.location.origin;
    },

    saveSubmission: async (type, payload) => {
        const url = `${serverSync.getServerUrl()}/api/sync`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, payload })
        });

        if (!response.ok) throw new Error('Server connection failed');
        return await response.json();
    },

    fetchAllData: async () => {
        const url = `${serverSync.getServerUrl()}/api/storage`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Could not fetch master data');
        return await response.json();
    },

    // Added getSubmissions to fix "not a function" error and flatten grouped server data
    getSubmissions: async () => {
        const data = await serverSync.fetchAllData();
        // The dashboard expects a single object of records. 
        // We combine pit and match scouting arrays into one object keyed by record ID.
        const all = {};
        if (data.pitScouting) data.pitScouting.forEach(entry => { all[entry.id] = entry; });
        if (data.matchScouting) data.matchScouting.forEach(entry => { all[entry.id] = entry; });
        
        return Object.keys(all).length > 0 ? all : data;
    }
};
window.serverSync = serverSync;