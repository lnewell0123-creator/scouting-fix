// Server Sync Integration for Form Data
// This module handles sending form data to the server (which can store in Firebase)
// and retrieving synced data from the server

class ServerSync {
  constructor(serverUrl = '') {
    this.serverUrl = serverUrl || window.location.origin;
    this.baseUrl = `${this.serverUrl}/api/storage`;
  }

  // Save form submission to server
  async saveSubmission(collectionName, data) {
    try {
      const key = `${collectionName}_${data.teamNumber || 'unknown'}_${Date.now()}`;
      
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          collection: collectionName,
          timestamp: new Date().toISOString(),
          ...data
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Submitted to server:', result);
        return true;
      } else {
        throw new Error(`Server error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving to server:', error);
      throw error;
    }
  }

  // Get all submissions from server
  async getSubmissions(collectionName) {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const allData = await response.json();
        
        // Filter by collection if specified
        if (collectionName) {
          const filtered = {};
          Object.entries(allData).forEach(([key, value]) => {
            if (key.startsWith(collectionName + '_')) {
              filtered[key] = value;
            }
          });
          return filtered;
        }
        return allData;
      } else {
        throw new Error(`Server error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching from server:', error);
      return {};
    }
  }

  // Get submissions by team number
  async getTeamSubmissions(teamNumber) {
    try {
      const allData = await this.getSubmissions();
      const teamData = {};
      
      Object.entries(allData).forEach(([key, value]) => {
        if (value.teamNumber === parseInt(teamNumber)) {
          teamData[key] = value;
        }
      });
      
      return teamData;
    } catch (error) {
      console.error('Error fetching team submissions:', error);
      return {};
    }
  }

  // Subscribe to server updates (using SSE)
  async subscribeToUpdates(callback) {
    try {
      const eventSource = new EventSource(`${this.serverUrl}/api/stream`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (e) {
          console.error('Error parsing server update:', e);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Server stream error:', error);
        eventSource.close();
      };

      return eventSource; // Return for cleanup
    } catch (error) {
      console.error('Error subscribing to updates:', error);
      return null;
    }
  }
}

// Initialize server sync
const serverSync = new ServerSync();
