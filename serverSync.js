// Local Network Sync Library
const serverSync = (function () {
    const LOCAL_STORAGE_KEY = 'serverSync.local.masterData';

    const defaultData = () => ({ pitScouting: [], matchScouting: [] });

    function getServerUrl() {
        const savedIp = localStorage.getItem('master-server-ip');
        if (savedIp) return `http://${savedIp}:8081`;

        // On remote static hosting (Netlify, GitHub Pages), there is no /api endpoint.
        // Keep this in a disabled state and fallback to localStorage handling.
        const host = window.location.hostname;
        if (host && host !== 'localhost' && host !== '127.0.0.1') {
            return null;
        }

        return window.location.origin;
    }

    function getLocalMasterData() {
        try {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (!raw) return defaultData();
            const parsed = JSON.parse(raw);
            return { ...defaultData(), ...parsed };
        } catch (error) {
            console.warn('Failed to parse local masterData, resetting', error);
            return defaultData();
        }
    }

    function setLocalMasterData(data) {
        const save = { ...defaultData(), ...data };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(save));
        return save;
    }

    function addLocalSubmission(type, payload) {
        const data = getLocalMasterData();
        if (!Array.isArray(data[type])) data[type] = [];

        const entry = {
            ...payload,
            serverTimestamp: new Date().toISOString(),
            id: payload.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        };

        data[type].push(entry);
        setLocalMasterData(data);
        return entry;
    }

    async function saveSubmission(type, payload) {
        const serverUrl = getServerUrl();
        const body = JSON.stringify({ type, payload });

        if (!serverUrl) {
            console.info('No master server detected; saving submission locally only.');
            const entry = addLocalSubmission(type, payload);
            return { success: true, entry };
        }

        try {
            const response = await fetch(`${serverUrl}/api/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body
            });

            if (!response.ok) {
                console.warn('Server sync failed (fallback to local).', response.status, response.statusText);
                const entry = addLocalSubmission(type, payload);
                return { success: true, entry };
            }

            const json = await response.json();
            // Keep local cache in sync for dashboard offline behavior
            if (json && json.entry) {
                addLocalSubmission(type, json.entry);
            }
            return json;

        } catch (error) {
            console.warn('Network error while saving submission, fallback to local:', error);
            const entry = addLocalSubmission(type, payload);
            return { success: true, entry };
        }
    }

    async function fetchAllData() {
        const serverUrl = getServerUrl();
        if (!serverUrl) {
            console.info('No master server detected; using local cache for data retrieval.');
            return getLocalMasterData();
        }

        try {
            const response = await fetch(`${serverUrl}/api/storage`);
            if (!response.ok) {
                console.warn('Could not fetch master data from remote server. Using local cache.');
                return getLocalMasterData();
            }

            const json = await response.json();
            setLocalMasterData(json);
            return json;

        } catch (error) {
            console.warn('Could not fetch master data due to network error. Using local cache.', error);
            return getLocalMasterData();
        }
    }

    async function getSubmissions() {
        const data = await fetchAllData();
        const all = {};

        if (Array.isArray(data.pitScouting)) {
            data.pitScouting.forEach(entry => { if (entry && entry.id) all[entry.id] = entry; });
        }
        if (Array.isArray(data.matchScouting)) {
            data.matchScouting.forEach(entry => { if (entry && entry.id) all[entry.id] = entry; });
        }

        return Object.keys(all).length > 0 ? all : (data || {});
    }

    async function clearAll() {
        const serverUrl = getServerUrl();
        if (serverUrl) {
            try {
                await fetch(`${serverUrl}/api/clear`, { method: 'POST' });
            } catch (e) {
                console.log('Server clear failed', e);
            }
        }
        setLocalMasterData(defaultData());
    }

    return {
        getServerUrl,
        saveSubmission,
        fetchAllData,
        getSubmissions,
        clearAll,
        _getLocalMasterData: getLocalMasterData,
        _setLocalMasterData: setLocalMasterData
    };
})();

window.serverSync = serverSync;