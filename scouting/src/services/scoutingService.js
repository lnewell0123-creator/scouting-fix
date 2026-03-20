import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  arrayUnion
} from 'firebase/firestore';

// ===== PIT SCOUTING (Form-like) =====

/**
 * Submit pit scouting data for a team
 * @param {number} teamNumber - Team ID
 * @param {object} pitData - Form data (robot stats, capabilities, etc.)
 * @param {string} scoutName - Name of scout
 */
export const submitPitScouting = async (teamNumber, pitData, scoutName) => {
  const timestamp = new Date();
  const entryId = `pit_${timestamp.getTime()}`;

  const pitRef = doc(
    db,
    'teams',
    String(teamNumber),
    'pitScouting',
    entryId
  );

  await setDoc(pitRef, {
    id: entryId,
    timestamp,
    scout: scoutName,
    data: pitData,
    lastUpdated: timestamp,
    synced: false
  });

  return entryId;
};

/**
 * Get pit scouting data for a team
 */
export const getPitScouting = async (teamNumber) => {
  const pitRef = collection(db, 'teams', String(teamNumber), 'pitScouting');
  const q = query(pitRef, orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

/**
 * Real-time listener for pit scouting data
 */
export const subscribeToPitScouting = (teamNumber, callback) => {
  const pitRef = collection(db, 'teams', String(teamNumber), 'pitScouting');
  const q = query(pitRef, orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(data);
  });
};

// ===== MATCH SCOUTING (Sheet-like) =====

/**
 * Add a match scouting entry (like adding a row to a spreadsheet)
 * @param {number} teamNumber - Team ID
 * @param {number} matchNumber - Match ID
 * @param {object} matchData - Match statistics
 * @param {string} scoutName - Name of scout
 */
export const addMatchScouting = async (teamNumber, matchNumber, matchData, scoutName) => {
  const timestamp = new Date();
  const entryId = `match_${timestamp.getTime()}`;

  const matchRef = doc(
    db,
    'teams',
    String(teamNumber),
    'matchScouting',
    String(matchNumber),
    'entries',
    entryId
  );

  await setDoc(matchRef, {
    id: entryId,
    timestamp,
    scout: scoutName,
    matchData,
    lastUpdated: timestamp,
    synced: false
  });

  return entryId;
};

/**
 * Get all match scouting data for a team
 */
export const getMatchScoutingForTeam = async (teamNumber) => {
  const matchRef = collection(db, 'teams', String(teamNumber), 'matchScouting');
  const snapshot = await getDocs(matchRef);

  const allMatches = {};
  for (const matchDoc of snapshot.docs) {
    const entriesRef = collection(
      db,
      'teams',
      String(teamNumber),
      'matchScouting',
      matchDoc.id,
      'entries'
    );
    const entriesSnapshot = await getDocs(entriesRef);
    allMatches[matchDoc.id] = entriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  return allMatches;
};

/**
 * Get match scouting data for a specific match
 */
export const getMatchScouting = async (teamNumber, matchNumber) => {
  const entriesRef = collection(
    db,
    'teams',
    String(teamNumber),
    'matchScouting',
    String(matchNumber),
    'entries'
  );
  const q = query(entriesRef, orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

/**
 * Real-time listener for match scouting data
 */
export const subscribeToMatchScouting = (teamNumber, matchNumber, callback) => {
  const entriesRef = collection(
    db,
    'teams',
    String(teamNumber),
    'matchScouting',
    String(matchNumber),
    'entries'
  );
  const q = query(entriesRef, orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(data);
  });
};

// ===== MASTER SYNC (Your Admin Dashboard) =====

/**
 * Get all teams
 */
export const getAllTeams = async () => {
  const teamsRef = collection(db, 'teams');
  const snapshot = await getDocs(teamsRef);

  return snapshot.docs.map(doc => ({
    teamNumber: doc.id,
    ...doc.data()
  }));
};

/**
 * Get all data for all teams (for master dashboard)
 */
export const getAllScoutingData = async () => {
  const teamsRef = collection(db, 'teams');
  const teamsSnapshot = await getDocs(teamsRef);

  const allData = {};
  for (const teamDoc of teamsSnapshot.docs) {
    const teamNumber = teamDoc.id;
    allData[teamNumber] = {
      teamInfo: teamDoc.data(),
      pitScouting: await getPitScouting(teamNumber),
      matchScouting: await getMatchScoutingForTeam(teamNumber)
    };
  }

  return allData;
};

/**
 * Real-time listener for all scouting data (for live sync)
 */
export const subscribeToAllScoutingData = (callback) => {
  const teamsRef = collection(db, 'teams');

  return onSnapshot(teamsRef, async (teamsSnapshot) => {
    const allData = {};

    for (const teamDoc of teamsSnapshot.docs) {
      const teamNumber = teamDoc.id;
      allData[teamNumber] = {
        teamInfo: teamDoc.data(),
        pitScouting: [],
        matchScouting: {}
      };

      // Get pit scouting
      const pitRef = collection(db, 'teams', teamNumber, 'pitScouting');
      const pitSnapshot = await getDocs(pitRef);
      allData[teamNumber].pitScouting = pitSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get match scouting
      const matchRef = collection(db, 'teams', teamNumber, 'matchScouting');
      const matchSnapshot = await getDocs(matchRef);

      for (const matchDoc of matchSnapshot.docs) {
        const entriesRef = collection(
          db,
          'teams',
          teamNumber,
          'matchScouting',
          matchDoc.id,
          'entries'
        );
        const entriesSnapshot = await getDocs(entriesRef);
        allData[teamNumber].matchScouting[matchDoc.id] = entriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
    }

    callback(allData);
  });
};

/**
 * Initialize team record if it doesn't exist
 */
export const initializeTeam = async (teamNumber, teamInfo = {}) => {
  const teamRef = doc(db, 'teams', String(teamNumber));
  const teamDoc = await getDoc(teamRef);

  if (!teamDoc.exists()) {
    await setDoc(teamRef, {
      number: teamNumber,
      name: teamInfo.name || `Team ${teamNumber}`,
      createdAt: new Date(),
      lastUpdated: new Date(),
      ...teamInfo
    });
  }
};
