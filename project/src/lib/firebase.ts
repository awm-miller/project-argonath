import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBr6lmdBG_u8WncCD3ohDe_ud994unGM_Q",
  authDomain: "project-argonath.firebaseapp.com",
  projectId: "project-argonath",
  storageBucket: "project-argonath.firebasestorage.app",
  messagingSenderId: "185370848440",
  appId: "1:185370848440:web:cde3ce698d576b05f3984d"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);