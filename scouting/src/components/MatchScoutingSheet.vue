<template>
  <div class="match-scouting-sheet">
    <h2>Match Scouting - Team {{ teamNumber }}</h2>

    <div class="sheet-controls">
      <input v-model="scoutName" type="text" placeholder="Scout Name" />
      <input v-model="currentMatch" type="number" placeholder="Match #" min="1" />
      <button @click="addRow">Add Entry</button>
    </div>

    <div class="sheet-container">
      <table class="scouting-sheet">
        <thead>
          <tr>
            <th>Match #</th>
            <th>Scout</th>
            <th>Auto Points</th>
            <th>Teleop Points</th>
            <th>Total Points</th>
            <th>Notes</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          <!-- Edit row (new entry form) -->
          <tr v-if="editingIndex === -1" class="edit-row">
            <td>{{ currentMatch }}</td>
            <td>{{ scoutName }}</td>
            <td><input v-model.number="newEntry.autoPoints" type="number" /></td>
            <td><input v-model.number="newEntry.teleopPoints" type="number" /></td>
            <td>{{ (newEntry.autoPoints || 0) + (newEntry.teleopPoints || 0) }}</td>
            <td><input v-model="newEntry.notes" type="text" /></td>
            <td>
              <button @click="saveEntry" class="save-btn">Save</button>
              <button @click="cancelEdit" class="cancel-btn">Cancel</button>
            </td>
          </tr>

          <!-- Data rows -->
          <tr v-for="entry in matchData" :key="entry.id" class="data-row">
            <td>{{ currentMatch }}</td>
            <td>{{ entry.scout }}</td>
            <td>{{ entry.matchData.autoPoints }}</td>
            <td>{{ entry.matchData.teleopPoints }}</td>
            <td>{{ (entry.matchData.autoPoints || 0) + (entry.matchData.teleopPoints || 0) }}</td>
            <td>{{ entry.matchData.notes }}</td>
            <td>{{ formatDate(entry.timestamp) }}</td>
          </tr>

          <!-- Empty state -->
          <tr v-if="matchData.length === 0 && editingIndex !== -1">
            <td colspan="7">No entries. Add one above.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="message" :class="['message', messageType]">{{ message }}</div>
  </div>
</template>

<script>
import { addMatchScouting, subscribeToMatchScouting, initializeTeam } from '../services/scoutingService';

export default {
  props: ['teamNumber'],
  data() {
    return {
      scoutName: '',
      currentMatch: 1,
      matchData: [],
      unsubscribe: null,
      editingIndex: null,
      newEntry: {
        autoPoints: 0,
        teleopPoints: 0,
        notes: ''
      },
      message: '',
      messageType: ''
    };
  },
  async mounted() {
    await initializeTeam(this.teamNumber);
    this.loadMatchData();
  },
  watch: {
    currentMatch() {
      this.editingIndex = null;
      this.loadMatchData();
    }
  },
  beforeUnmount() {
    if (this.unsubscribe) this.unsubscribe();
  },
  methods: {
    loadMatchData() {
      if (this.unsubscribe) this.unsubscribe();

      this.unsubscribe = subscribeToMatchScouting(
        this.teamNumber,
        this.currentMatch,
        (data) => {
          this.matchData = data;
        }
      );
    },
    addRow() {
      this.editingIndex = -1;
      this.newEntry = {
        autoPoints: 0,
        teleopPoints: 0,
        notes: ''
      };
    },
    async saveEntry() {
      try {
        await addMatchScouting(
          this.teamNumber,
          this.currentMatch,
          this.newEntry,
          this.scoutName
        );
        this.message = 'Entry saved!';
        this.messageType = 'success';
        this.editingIndex = null;
        this.newEntry = { autoPoints: 0, teleopPoints: 0, notes: '' };
        setTimeout(() => (this.message = ''), 3000);
      } catch (error) {
        this.message = 'Error: ' + error.message;
        this.messageType = 'error';
      }
    },
    cancelEdit() {
      this.editingIndex = null;
    },
    formatDate(timestamp) {
      return new Date(timestamp?.seconds * 1000 || timestamp).toLocaleTimeString();
    }
  }
};
</script>

<style scoped>
.match-scouting-sheet {
  max-width: 100%;
  margin: 20px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.sheet-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.sheet-controls input,
.sheet-controls button {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.sheet-controls button {
  background-color: #2196f3;
  color: white;
  cursor: pointer;
}

.sheet-controls button:hover {
  background-color: #0b7dda;
}

.sheet-container {
  overflow-x: auto;
}

.scouting-sheet {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
}

.scouting-sheet th,
.scouting-sheet td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

.scouting-sheet th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.scouting-sheet tr:nth-child(even) {
  background-color: #f9f9f9;
}

.edit-row {
  background-color: #fff3cd;
}

.edit-row input {
  width: 100%;
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 3px;
  box-sizing: border-box;
}

.save-btn,
.cancel-btn {
  padding: 6px 12px;
  margin-right: 5px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.save-btn {
  background-color: #4caf50;
  color: white;
}

.save-btn:hover {
  background-color: #45a049;
}

.cancel-btn {
  background-color: #f44336;
  color: white;
}

.cancel-btn:hover {
  background-color: #da190b;
}

.message {
  margin-top: 20px;
  padding: 12px;
  border-radius: 4px;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>
