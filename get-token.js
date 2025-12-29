import 'dotenv/config';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

if (!firebaseConfig.apiKey || !process.env.TEST_TUTOR_EMAIL) {
  console.error("❌ Error: Variabel environment tidak ditemukan. Pastikan file .env sudah dikonfigurasi.");
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

connectAuthEmulator(auth, process.env.AUTH_EMULATOR_URL || "http://127.0.0.1:9099");

console.log(`Attempting login for: ${process.env.TEST_TUTOR_EMAIL}...`);

signInWithEmailAndPassword(
  auth, 
  process.env.TEST_TUTOR_EMAIL, 
  process.env.TEST_TUTOR_PASSWORD
)
  .then((userCredential) => {
    return userCredential.user.getIdToken();
  })
  .then((token) => {
    console.log("\nLogin Berhasil!");
    console.log("-------------------------------------------------------");
    console.log(token);
    console.log("-------------------------------------------------------");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Login Gagal:", error.message);
    process.exit(1);
  });