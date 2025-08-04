import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAspahfUUGnBzh0mh6U53evGQzWQP956xQ",
  authDomain: "ffassetmanager.firebaseapp.com",
  projectId: "ffassetmanager",
  storageBucket: "ffassetmanager.appspot.com",
  messagingSenderId: "803858971008",
  appId: "1:803858971008:web:72d69ddce6cbc85010a965"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

const summaryTableBody = document.getElementById("summaryTableBody");
const typeFilter = document.getElementById("typeFilter");

function renderTable(filteredType = "all") {
  getDocs(collection(db, "assets")).then(snapshot => {
    const assets = snapshot.docs.map(doc => doc.data());
    const grouped = {};

    assets.forEach(asset => {
      const type = asset.type || "Unknown";
      if (!grouped[type]) {
        grouped[type] = { total: 0, allocated: 0, available: 0 };
      }
      grouped[type].total += 1;
      if (asset.status === "Allocated") {
        grouped[type].allocated += 1;
      } else {
        grouped[type].available += 1;
      }
    });

    // Clear table
    summaryTableBody.innerHTML = "";

    Object.keys(grouped).forEach(type => {
      if (filteredType === "all" || type === filteredType) {
        const data = grouped[type];
        const row = `
          <tr class="text-sm border-b">
            <td class="px-4 py-2">${type}</td>
            <td class="px-4 py-2 text-center">${data.total}</td>
            <td class="px-4 py-2 text-center">${data.available}</td>
            <td class="px-4 py-2 text-center">${data.allocated}</td>
          </tr>
        `;
        summaryTableBody.insertAdjacentHTML("beforeend", row);
      }
    });

    // Populate dropdown (once)
    if (typeFilter.options.length <= 1) {
      const types = Object.keys(grouped);
      types.forEach(type => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type;
        typeFilter.appendChild(option);
      });
    }
  });
}

typeFilter.addEventListener("change", () => {
  renderTable(typeFilter.value);
});

// Auth check
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    renderTable();
  }
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
});
