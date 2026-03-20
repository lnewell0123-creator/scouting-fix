<script setup>
import { ref } from 'vue';
import { db } from './firebase'; 
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

// 1. Reactive variables for the form
const teamNum = ref(""); // The "Folder Name"
const scoutingType = ref("pit"); // Toggle between 'pit' and 'match'

// Data fields
const robotWeight = ref(""); // For Pit
const matchNum = ref("");    // For Match
const autoPoints = ref("");   // For Match

// 2. THE SAVING FUNCTIONS (This is where 1 & 2 go)

const saveScoutingData = async () => {
  if (!teamNum.value) return alert("Please enter a Team Number first!");

  try {
    if (scoutingType.value === 'pit') {
      // --- PIT SCOUTING (Number 1: Overwrites/Updates) ---
      // Path: teams > [Team#] > pitData > info
      await setDoc(doc(db, "teams", teamNum.value, "pitData", "info"), {
        weight: robotWeight.value,
        lastUpdated: serverTimestamp()
      });
      alert(`Pit Data saved for Team ${teamNum.value}`);

    } else {
      // --- MATCH SCOUTING (Number 2: Adds to a list) ---
      // Path: teams > [Team#] > matchData > [Auto-ID]
      await addDoc(collection(db, "teams", teamNum.value, "matchData"), {
        matchNumber: matchNum.value,
        points: autoPoints.value,
        timestamp: serverTimestamp()
      });
      alert(`Match ${matchNum.value} added for Team ${teamNum.value}`);
    }

    // Clear inputs after success
    robotWeight.value = "";
    matchNum.value = "";
    autoPoints.value = "";
  } catch (error) {
    alert("Firebase Error: " + error.message);
  }
};
</script>

<template>
  <div style="padding: 20px; font-family: sans-serif; max-width: 500px;">
    <h1>Robotics Scouting</h1>

    <div style="border: 1px solid #ccc; padding: 15px; border-radius: 8px;">
      <label>Team Number:</label><br>
      <input v-model="teamNum" type="number" placeholder="e.g. 254" style="width: 100%; margin-bottom: 10px;" />

      <label>Scouting Type:</label><br>
      <select v-model="scoutingType" style="width: 100%; margin-bottom: 20px;">
        <option value="pit">Pit Scouting (Specs)</option>
        <option value="match">Match Scouting (Performance)</option>
      </select>

      <!-- Pit Form -->
      <div v-if="scoutingType === 'pit'">
        <h3>Pit Details</h3>
        <input v-model="robotWeight" placeholder="Robot Weight" style="width: 100%; margin-bottom: 10px;" />
      </div>

      <!-- Match Form -->
      <div v-else>
        <h3>Match Results</h3>
        <input v-model="matchNum" type="number" placeholder="Match #" style="width: 100%; margin-bottom: 10px;" />
        <input v-model="autoPoints" type="number" placeholder="Auto Points" style="width: 100%; margin-bottom: 10px;" />
      </div>

      <button @click="saveScoutingData" style="width: 100%; padding: 10px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer;">
        Submit to Global Storage
      </button>
    </div>
  </div>
</template>
