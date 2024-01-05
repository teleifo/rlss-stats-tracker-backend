// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDvwmo_wYENRxcMSthX0tm7O9I5iN8eeqU",
  authDomain: "rocket-league-stats-67a37.firebaseapp.com",
  projectId: "rocket-league-stats-67a37",
  storageBucket: "rocket-league-stats-67a37.appspot.com",
  messagingSenderId: "83469636920",
  appId: "1:83469636920:web:f5f572b11df9570ce99dcd",
  measurementId: "G-RVXX67GETZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

module.exports = app;