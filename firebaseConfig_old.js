// firebaseConfig.js
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from "./firebase-client.js";
const assetsCollection = collection(db, "assets");
export { db, assetsCollection, getDocs };
