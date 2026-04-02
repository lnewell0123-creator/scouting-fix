/**
 * QR Sync Module for Offline Robotics Scouting
 * Requires: qrcode.js (https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js)
 */

const QR_CONFIG = {
    width: 256,
    height: 256,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M // Medium error correction
};

const qrSync = {
    // This matches the key used in your app.js
    STORAGE_KEY: 'submissions',

    /**
     * Saves a match submission to the local list without overwriting previous matches.
     */
    saveMatchLocally: function(matchData) {
        try {
            // 1. Get existing matches from storage
            const rawData = localStorage.getItem(this.STORAGE_KEY);
            const matches = rawData ? JSON.parse(rawData) : [];

            // 2. Add metadata to help the master page identify the source
            const entry = {
                ...matchData,
                clientTimestamp: new Date().toISOString(),
                uuid: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
            };

            // 3. Append and save back to localStorage
            matches.push(entry);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(matches));
            
            console.log('Match saved locally. Total matches stored:', matches.length);
            return entry;
        } catch (e) {
            console.error('Failed to save match to localStorage:', e);
            alert('Storage error! Your device might be out of space.');
        }
    },

    /**
     * Retrieves all matches, stringifies them as an array, and renders it to the sync div.
     * @param {string} containerId - The ID of the div where the QR should appear
     * @param {string} customKey - Optional key if using something other than 'submissions'
     */
    showAllMatchQR: function(containerId, customKey = null) {
        const key = customKey || this.STORAGE_KEY;
        const rawData = localStorage.getItem(key);
        const matches = rawData ? JSON.parse(rawData) : [];

        if (matches.length === 0) {
            alert('No matches found to sync!');
            return;
        }

        const syncContainer = document.getElementById(containerId);
        
        // Clear previous QR codes
        syncContainer.innerHTML = '';
        syncContainer.style.display = 'block'; // Unhide the div

        // Generate the QR Code for all matches
        new QRCode(syncContainer, {
            text: JSON.stringify(matches),
            ...QR_CONFIG
        });
    }
};

window.qrSync = qrSync;
