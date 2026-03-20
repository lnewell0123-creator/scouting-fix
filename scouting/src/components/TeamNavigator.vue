<template>
  <div class="team-navigator">
    <div class="header">
      <h1>ROBBE Scouting System</h1>
      <div class="nav-buttons">
        <button
          @click="currentView = 'teams'"
          :class="{ active: currentView === 'teams' }"
        >
          Teams
        </button>
        <button
          @click="currentView = 'dashboard'"
          :class="{ active: currentView === 'dashboard' }"
        >
          Master Dashboard
        </button>
      </div>
    </div>

    <!-- Teams View -->
    <div v-if="currentView === 'teams'" class="teams-view">
      <div class="search-box">
        <input
          v-model="searchTeam"
          type="text"
          placeholder="Search by team number..."
        />
      </div>

      <div class="teams-list">
        <div
          v-for="teamNum in filteredTeams"
          :key="teamNum"
          class="team-item"
          @click="selectTeam(teamNum)"
        >
          <h3>Team {{ teamNum }}</h3>
          <p>Click to scout</p>
        </div>
      </div>

      <!-- Add new team -->
      <div class="add-team">
        <input
          v-model.number="newTeamNumber"
          type="number"
          placeholder="Enter team number..."
          min="1"
        />
        <button @click="addTeam">Add Team</button>
      </div>
    </div>

    <!-- Scouting View -->
    <div v-if="currentView === 'scouting'" class="scouting-view">
      <div class="scouting-header">
        <button @click="currentView = 'teams'" class="back-btn">← Back to Teams</button>
        <h2>Team {{ selectedTeamNumber }}</h2>
      </div>

      <div class="scout-tabs">
        <button
          @click="scoutingType = 'pit'"
          :class="{ active: scoutingType === 'pit' }"
        >
          Pit Scouting
        </button>
        <button
          @click="scoutingType = 'match'"
          :class="{ active: scoutingType === 'match' }"
        >
          Match Scouting
        </button>
      </div>

      <PitScoutingForm v-if="scoutingType === 'pit'" :team-number="selectedTeamNumber" />
      <MatchScoutingSheet v-if="scoutingType === 'match'" :team-number="selectedTeamNumber" />
    </div>

    <!-- Dashboard View -->
    <div v-if="currentView === 'dashboard'" class="dashboard-view">
      <MasterDashboard />
    </div>
  </div>
</template>

<script>
import PitScoutingForm from './PitScoutingForm.vue';
import MatchScoutingSheet from './MatchScoutingSheet.vue';
import MasterDashboard from './MasterDashboard.vue';
import { getAllTeams, initializeTeam } from '../services/scoutingService';

export default {
  components: {
    PitScoutingForm,
    MatchScoutingSheet,
    MasterDashboard
  },
  data() {
    return {
      currentView: 'teams', // teams, scouting, dashboard
      scoutingType: 'pit', // pit or match
      selectedTeamNumber: null,
      teams: [],
      searchTeam: '',
      newTeamNumber: '',
      loading: false
    };
  },
  computed: {
    filteredTeams() {
      if (!this.searchTeam) return this.teams.sort((a, b) => a - b);
      return this.teams
        .filter(num => String(num).includes(this.searchTeam))
        .sort((a, b) => a - b);
    }
  },
  async mounted() {
    await this.loadTeams();
  },
  methods: {
    async loadTeams() {
      try {
        const teamsData = await getAllTeams();
        this.teams = teamsData.map(t => parseInt(t.teamNumber));
      } catch (error) {
        console.error('Error loading teams:', error);
      }
    },
    async selectTeam(teamNumber) {
      this.selectedTeamNumber = teamNumber;
      this.scoutingType = 'pit';
      this.currentView = 'scouting';
    },
    async addTeam() {
      if (!this.newTeamNumber || this.newTeamNumber < 1) {
        alert('Please enter a valid team number');
        return;
      }

      if (this.teams.includes(this.newTeamNumber)) {
        alert('Team already exists');
        return;
      }

      try {
        await initializeTeam(this.newTeamNumber, {
          name: `Team ${this.newTeamNumber}`
        });
        this.teams.push(this.newTeamNumber);
        this.newTeamNumber = '';
        alert('Team added successfully!');
      } catch (error) {
        alert('Error adding team: ' + error.message);
      }
    }
  }
};
</script>

<style scoped>
.team-navigator {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  background-color: rgba(0, 0, 0, 0.2);
  padding: 20px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.header h1 {
  margin: 0;
  font-size: 32px;
}

.nav-buttons {
  display: flex;
  gap: 10px;
}

.nav-buttons button {
  padding: 10px 20px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s;
}

.nav-buttons button:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.nav-buttons button.active {
  background-color: white;
  color: #667eea;
}

.teams-view,
.scouting-view,
.dashboard-view {
  padding: 30px;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.search-box {
  margin-bottom: 30px;
}

.search-box input {
  width: 100%;
  max-width: 400px;
  padding: 12px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.teams-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.team-item {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  text-align: center;
}

.team-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
}

.team-item h3 {
  margin: 0;
  font-size: 24px;
  color: #667eea;
}

.team-item p {
  margin: 5px 0 0 0;
  color: #999;
  font-size: 12px;
}

.add-team {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.add-team input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
  font-size: 16px;
  box-sizing: border-box;
}

.add-team button {
  width: 100%;
  padding: 12px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
}

.add-team button:hover {
  background-color: #764ba2;
}

.scouting-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.back-btn {
  background-color: white;
  color: #667eea;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.back-btn:hover {
  background-color: rgba(255, 255, 255, 0.9);
}

.scouting-header h2 {
  color: white;
  margin: 0;
}

.scout-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
}

.scout-tabs button {
  padding: 12px 24px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s;
}

.scout-tabs button:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.scout-tabs button.active {
  background-color: white;
  color: #667eea;
}

.dashboard-view {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
