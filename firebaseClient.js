// Firebase SDK loaded from CDN
// Include this BEFORE other scripts

// Firebase Configuration - UPDATE WITH YOUR VALUES
const FIREBASE_CONFIG = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Simple Firebase Client using REST API (doesn't require SDK)
// This approach works with standard HTML scripts
class FirebaseClient {
  constructor(config) {
    this.config = config;
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents`;
    this.projectId = config.projectId;
  }

  // Check if Firebase is configured
  isConfigured() {
    return this.config.projectId !== 'your-project-id';
  }

  // Get authorization token (for security, deploy with proper auth)
  async getToken() {
    // For development: use anonymous access or API key
    // For production: implement proper authentication service
    return null;
  }

  // Add document to Firestore
  async addDocument(collection, document) {
    if (!this.isConfigured()) {
      console.warn('Firebase not configured. Saving to localStorage only.');
      return null;
    }

    try {
      const documentId = document.teamNumber + '_' + Date.now();
      const url = `${this.baseUrl}/${collection}?documentId=${documentId}`;

      const body = {
        fields: this.objectToFirestoreFields(document)
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        console.log('Document saved to Firebase:', documentId);
        return documentId;
      } else {
        console.error('Firebase error:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      return null;
    }
  }

  // Get documents from collection
  async getDocuments(collection) {
    if (!this.isConfigured()) {
      console.warn('Firebase not configured');
      return [];
    }

    try {
      const url = `${this.baseUrl}/${collection}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        return data.documents || [];
      } else {
        console.error('Firebase error:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error fetching from Firebase:', error);
      return [];
    }
  }

  // Convert JS object to Firestore field format
  objectToFirestoreFields(obj) {
    const fields = {};
    for (const [key, value] of Object.entries(obj)) {
      fields[key] = this.valueToFirestoreValue(value);
    }
    return fields;
  }

  // Convert JS value to Firestore value format
  valueToFirestoreValue(value) {
    if (value === null) return { nullValue: null };
    if (typeof value === 'boolean') return { booleanValue: value };
    if (typeof value === 'number') return { integerValue: String(value) };
    if (typeof value === 'string') return { stringValue: value };
    if (Array.isArray(value)) {
      return {
        arrayValue: {
          values: value.map(v => this.valueToFirestoreValue(v))
        }
      };
    }
    if (typeof value === 'object') {
      return {
        mapValue: {
          fields: this.objectToFirestoreFields(value)
        }
      };
    }
    return { stringValue: String(value) };
  }

  // Convert Firestore fields back to JS object
  fieldsToObject(fields) {
    const obj = {};
    for (const [key, fieldValue] of Object.entries(fields || {})) {
      obj[key] = this.firestoreValueToValue(fieldValue);
    }
    return obj;
  }

  // Convert Firestore value to JS value
  firestoreValueToValue(fieldValue) {
    if (fieldValue.nullValue !== undefined) return null;
    if (fieldValue.booleanValue !== undefined) return fieldValue.booleanValue;
    if (fieldValue.integerValue !== undefined) return parseInt(fieldValue.integerValue);
    if (fieldValue.doubleValue !== undefined) return parseFloat(fieldValue.doubleValue);
    if (fieldValue.stringValue !== undefined) return fieldValue.stringValue;
    if (fieldValue.arrayValue) {
      return (fieldValue.arrayValue.values || []).map(v => this.firestoreValueToValue(v));
    }
    if (fieldValue.mapValue) {
      return this.fieldsToObject(fieldValue.mapValue.fields);
    }
    return null;
  }
}

// Initialize Firebase Client
const firebaseClient = new FirebaseClient(FIREBASE_CONFIG);
