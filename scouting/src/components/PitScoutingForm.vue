<template>
  <div class="pit-scouting-form">
    <h2>Pit Scouting - Team {{ teamNumber }}</h2>

    <form @submit.prevent="submitForm">
      <div class="form-group">
        <label>Scout Name:</label>
        <input v-model="scoutName" type="text" required />
      </div>

      <div class="form-group">
        <label>Drive Type:</label>
        <select v-model="formData.driveType">
          <option>Swerve</option>
          <option>Mecanum</option>
          <option>Tank</option>
          <option>Other</option>
        </select>
      </div>

      <div class="form-group">
        <label>Can Intake:</label>
        <input v-model.checkbox="formData.canIntake" type="checkbox" />
      </div>

      <div class="form-group">
        <label>Can Score:</label>
        <input v-model.checkbox="formData.canScore" type="checkbox" />
      </div>

      <div class="form-group">
        <label>Can Climb:</label>
        <input v-model.checkbox="formData.canClimb" type="checkbox" />
      </div>

      <div class="form-group">
        <label>Notes:</label>
        <textarea v-model="formData.notes"></textarea>
      </div>

      <button type="submit" :disabled="loading">{{ loading ? 'Submitting...' : 'Submit' }}</button>
      <div v-if="message" :class="['message', messageType]">{{ message }}</div>
    </form>

    <!-- Display previous entries -->
    <div class="previous-entries">
      <h3>Previous Pit Scout Entries</h3>
      <div v-for="entry in entries" :key="entry.id" class="entry-card">
        <p><strong>Scout:</strong> {{ entry.scout }}</p>
        <p><strong>Time:</strong> {{ formatDate(entry.timestamp) }}</p>
        <p><strong>Drive Type:</strong> {{ entry.data.driveType }}</p>
        <p><strong>Notes:</strong> {{ entry.data.notes }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { submitPitScouting, subscribeToPitScouting, initializeTeam } from '../services/scoutingService';

export default {
  props: ['teamNumber'],
  data() {
    return {
      scoutName: '',
      loading: false,
      message: '',
      messageType: '',
      entries: [],
      unsubscribe: null,
      formData: {
        driveType: 'Swerve',
        canIntake: false,
        canScore: false,
        canClimb: false,
        notes: ''
      }
    };
  },
  async mounted() {
    await initializeTeam(this.teamNumber);
    // Subscribe to real-time updates
    this.unsubscribe = subscribeToPitScouting(this.teamNumber, (data) => {
      this.entries = data;
    });
  },
  beforeUnmount() {
    if (this.unsubscribe) this.unsubscribe();
  },
  methods: {
    async submitForm() {
      this.loading = true;
      try {
        await submitPitScouting(this.teamNumber, this.formData, this.scoutName);
        this.message = 'Pit scouting submitted successfully!';
        this.messageType = 'success';
        this.scoutName = '';
        this.formData = {
          driveType: 'Swerve',
          canIntake: false,
          canScore: false,
          canClimb: false,
          notes: ''
        };
        setTimeout(() => (this.message = ''), 3000);
      } catch (error) {
        this.message = 'Error: ' + error.message;
        this.messageType = 'error';
      } finally {
        this.loading = false;
      }
    },
    formatDate(timestamp) {
      return new Date(timestamp?.seconds * 1000 || timestamp).toLocaleString();
    }
  }
};
</script>

<style scoped>
.pit-scouting-form {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}

label {
  font-weight: bold;
  margin-bottom: 5px;
}

input[type='text'],
input[type='checkbox'],
select,
textarea {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

button {
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.message {
  margin-top: 10px;
  padding: 10px;
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

.previous-entries {
  margin-top: 30px;
}

.entry-card {
  background-color: #f9f9f9;
  padding: 15px;
  margin-bottom: 10px;
  border-left: 4px solid #4caf50;
  border-radius: 4px;
}

.entry-card p {
  margin: 5px 0;
}
</style>
