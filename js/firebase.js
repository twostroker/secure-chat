// firebase.js

// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getDatabase, ref, set, push, onChildAdded, onChildRemoved, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyABZX-PzDYuHlXXQejuctb20stQzzjQKRo",
  authDomain: "chat-52341.firebaseapp.com",
  databaseURL: "https://chat-52341-default-rtdb.firebaseio.com", // Your Realtime Database URL
  projectId: "chat-52341",
  storageBucket: "chat-52341.firebasestorage.app",
  messagingSenderId: "21248299480",
  appId: "1:21248299480:web:b40999b1eacb532914e2ad",
  measurementId: "G-DYG1K14FT7"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Make database available globally
window.db = database;

// Export Firebase services for use in other files
export { database, ref, set, push, onChildAdded, onChildRemoved, serverTimestamp };