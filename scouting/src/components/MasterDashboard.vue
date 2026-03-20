<template>
  <div class="master-dashboard">
    <h1>Master Scouting Dashboard</h1>

    <div class="controls">
      <button @click="refreshData" :disabled="loading">
        {{ loading ? 'Syncing...' : 'Sync All Data' }}
      </button>
      <button @click="exportToCSV">Export as CSV</button>
      <div class="last-sync" v-if="lastSync">
        Last synced: {{ formatDate(lastSync) }}
      </div>
    </div>

    <div v-if="message" :class="['message', messageType]">{{ message }}</div>

    <!-- Teams Overview -->
    <div class="teams-grid">
      <div v-for="(teamData, teamNumber) in allScoutingData" :key="teamNumber" class="team-card">
        <h3>Team {{ teamNumber }}</h3>

        <div class="card-stats">
          <div class="stat">
            <span class="label">Pit Scout Entries:</span>
            <span class="value">{{ teamData.pitScouting.length }}</span>
          </div>
          <div class="stat">
            <span class="label">Matches Scouted:</span>
            <span class="value">{{ Object.keys(teamData.matchScouting).length }}</span>
          </div>
        </div>

        <!-- Pit Scouting Summary -->
        <div v-if="teamData.pitScouting.length" class="section">
          <h4>Pit Scouting</h4>
          <div v-for="entry in teamData.pitScouting.slice(0, 2)" :key="entry.id" class="entry-preview">
            <p><strong>{{ entry.scout }}</strong> - {{ formatDate(entry.timestamp) }}</p>
            <p>{{ entry.data.driveType }} | {{ entry.data.notes }}</p>
          </div>
          <p v-if="teamData.pitScouting.length > 2" class="more-info">
            +{{ teamData.pitScouting.length - 2 }} more
          </p>
        </div>

        <!-- Match Scouting Summary -->
        <div v-if="Object.keys(teamData.matchScouting).length" class="section">
          <h4>Match Scouting</h4>
          <div v-for="(matches, matchNum) in teamData.matchScouting" :key="matchNum" class="match-summary">
            <p><strong>Match {{ matchNum }}:</strong> {{ matches.length }} entries</p>
            <div v-for="match in matches.slice(0, 1)" :key="match.id" class="match-info">
              <span>Auto: {{ match.matchData.autoPoints }} | Teleop: {{ match.matchData.teleopPoints }}</span>
            </div>
          </div>
        </div>

        <button @click="viewTeamDetails(teamNumber)" class="view-btn">View Details</button>
      </div>
    </div>

    <!-- Detailed View Modal -->
    <div v-if="selectedTeam" class="modal-overlay" @click="selectedTeam = null">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="selectedTeam = null">✕</button>
        <h2>Team {{ selectedTeam }} - Detailed View</h2>

        <div class="modal-section" v-if="allScoutingData[selectedTeam]?.pitScouting.length">
          <h3>All Pit Scouting Entries</h3>
          <div v-for="entry in allScoutingData[selectedTeam].pitScouting" :key="entry.id" class="detailed-entry">
            <p><strong>Scout:</strong> {{ entry.scout }}</p>
            <p><strong>Date:</strong> {{ formatDate(entry.timestamp) }}</p>
            <p><strong>Drive Type:</strong> {{ entry.data.driveType }}</p>
            <p><strong>Capabilities:</strong>
              <span v-if="entry.data.canIntake" class="badge">Intake</span>
              <span v-if="entry.data.canScore" class="badge">Score</span>
              <span v-if="entry.data.canClimb" class="badge">Climb</span>
            </p>
            <p><strong>Notes:</strong> {{ entry.data.notes }}</p>
          </div>
        </div>

        <div class="modal-section" v-if="Object.keys(allScoutingData[selectedTeam]?.matchScouting || {}).length">
          <h3>All Match Scouting Data</h3>
          <div v-for="(matches, matchNum) in allScoutingData[selectedTeam].matchScouting" :key="matchNum" class="match-table">
            <h4>Match {{ matchNum }}</h4>
            <table>
              <thead>
                <tr>
                  <th>Scout</th>
                  <th>Auto Points</th>
                  <th>Teleop Points</th>
                  <th>Total</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="match in matches" :key="match.id">
                  <td>{{ match.scout }}</td>
                  <td>{{ match.matchData.autoPoints }}</td>
                  <td>{{ match.matchData.teleopPoints }}</td>
                  <td><strong>{{ (match.matchData.autoPoints || 0) + (match.matchData.teleopPoints || 0) }}</strong></td>
                  <td>{{ match.matchData.notes }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { subscribeToAllScoutingData } from '../services/scoutingService';

export default {
  data() {
    return {
      allScoutingData: {},
      unsubscribe: null,
      loading: false,
      lastSync: null,
      message: '',
      messageType: '',
      selectedTeam: null
    };
  },
  mounted() {
    // Subscribe to real-time updates
    this.loading = true;
    this.unsubscribe = subscribeToAllScoutingData((data) => {
      this.allScoutingData = data;
      this.lastSync = new Date();
      this.loading = false;
    });
  },
  beforeUnmount() {
    if (this.unsubscribe) this.unsubscribe();
  },
  methods: {
    async refreshData() {
      this.loading = true;
      try {
        // Trigger a refresh by resubscribing
        if (this.unsubscribe) this.unsubscribe();
        this.unsubscribe = subscribeToAllScoutingData((data) => {
          this.allScoutingData = data;
          this.lastSync = new Date();
          this.loading = false;
        });
        this.message = 'Data synced!';
        this.messageType = 'success';
        setTimeout(() => (this.message = ''), 3000);
      } catch (error) {
        this.message = 'Error syncing: ' + error.message;
        this.messageType = 'error';
        this.loading = false;
      }
    },
    exportToCSV() {
      let csv = 'Team Number,Type,Scout,Data\n';

      for (const [teamNumber, teamData] of Object.entries(this.allScoutingData)) {
        // Pit scouting
        teamData.pitScouting.forEach(entry => {
          const data = JSON.stringify(entry.data).replace(/"/g, '""');
          csv += `${teamNumber},Pit,${entry.scout},"${data}"\n`;
        });

        // Match scouting
        Object.entries(teamData.matchScouting).forEach(([matchNum, matches]) => {
          matches.forEach(match => {
            const data = JSON.stringify(match.matchData).replace(/"/g, '""');
            csv += `${teamNumber},Match ${matchNum},${match.scout},"${data}"\n`;
          });
        });
      }

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scouting_data_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
    viewTeamDetails(teamNumber) {
      this.selectedTeam = teamNumber;
    },
    formatDate(timestamp) {
      return new Date(timestamp?.seconds * 1000 || timestamp).toLocaleString();
    }
  }
};
</script>

<style scoped>
.master-dashboard {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}

.controls {
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.controls button {
  padding: 10px 20px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.controls button:hover {
  background-color: #0b7dda;
}

.controls button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.last-sync {
  font-size: 12px;
  color: #666;
  margin-left: 10px;
}

.message {
  text-align: center;
  padding: 12px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.team-card {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.team-card h3 {
  margin-top: 0;
  color: #2196f3;
}

.card-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat .label {
  font-size: 12px;
  color: #666;
}

.stat .value {
  font-size: 20px;
  font-weight: bold;
  color: #2196f3;
}

.section {
  margin-top: 15px;
  padding: 10px 0;
}

.section h4 {
  margin: 10px 0 5px 0;
  font-size: 14px;
  color: #333;
}

.entry-preview {
  font-size: 12px;
  padding: 8px;
  background-color: #f9f9f9;
  border-radius: 3px;
  margin-bottom: 5px;
}

.entry-preview p {
  margin: 3px 0;
}

.more-info {
  font-size: 11px;
  color: #999;
  margin: 5px 0 0 0;
}

.match-summary {
  font-size: 12px;
  padding: 5px 0;
}

.match-info {
  font-size: 11px;
  color: #666;
  margin-left: 10px;
}

.view-btn {
  margin-top: 10px;
  width: 100%;
  padding: 8px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.view-btn:hover {
  background-color: #45a049;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.modal-section {
  margin-bottom: 30px;
}

.modal-section h3 {
  margin-top: 0;
  color: #2196f3;
  border-bottom: 2px solid #2196f3;
  padding-bottom: 10px;
}

.detailed-entry {
  background-color: #f9f9f9;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 4px;
  border-left: 4px solid #2196f3;
}

.detailed-entry p {
  margin: 5px 0;
}

.badge {
  display: inline-block;
  background-color: #2196f3;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  margin-right: 5px;
}

.match-table {
  margin-bottom: 20px;
}

.match-table h4 {
  margin: 15px 0 10px 0;
  font-size: 13px;
}

.match-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.match-table th,
.match-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.match-table th {
  background-color: #f0f0f0;
  font-weight: bold;
}

.match-table tr:nth-child(even) {
  background-color: #f9f9f9;
}
</style>
