import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAA7CPZlsno18TYokUdgGwVxpHJWlAAs3s",
  authDomain: "studyo-firebase.firebaseapp.com",
  projectId: "studyo-firebase",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

connectAuthEmulator(auth, "http://127.0.0.1:9099");

signInWithEmailAndPassword(auth, "tutor@test.com", "password123")
  .then((userCredential) => {
    return userCredential.user.getIdToken();
  })
  .then((token) => {
    console.log("\nCopy Token ini ke Postman (Authorization: Bearer ...):");
    console.log(token);
    process.exit(0);
  })
  .catch((error) => console.error(error));
