import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth, db } from "../firebase-client.js";
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

  const status = (asset.status || "").toLowerCase();

  if (status === "allocated") {
    grouped[type].allocated += 1;
  } else if (status === "available") {
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
  typeFilter.innerHTML = "";

  // Add "All Types" option first
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All Types";
  typeFilter.appendChild(allOption);

  types.forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    typeFilter.appendChild(option);
  });

  // Live filter functionality
  const typeSearchInput = document.getElementById("typeSearch");
  typeSearchInput.addEventListener("input", () => {
    const searchTerm = typeSearchInput.value.toLowerCase();
    Array.from(typeFilter.options).forEach(option => {
      const isMatch = option.textContent.toLowerCase().includes(searchTerm);
      option.style.display = isMatch ? "block" : "none";
    });
  });

  // Select first option by default
  typeFilter.selectedIndex = 0;
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
