// Firebase initialization (compat) for Websight
// Uses the user's provided config and exposes window.db (Firestore)

// eslint-disable-next-line no-undef
firebase.initializeApp({
  apiKey: "AIzaSyD0fYngTU3Mme_JovyNGeQJmS3GDIQj7Os",
  authDomain: "sammyb-91361.firebaseapp.com",
  projectId: "sammyb-91361",
  storageBucket: "sammyb-91361.firebasestorage.app",
  messagingSenderId: "473581080473",
  appId: "1:473581080473:web:3d32f7ccfc485dfa9d0d08",
  measurementId: "G-2RKV40TKR5",
});

// eslint-disable-next-line no-undef
window.db = firebase.firestore();
