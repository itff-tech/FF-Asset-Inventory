import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth, db } from "../firebase-client.js";
const summaryTableBody = document.getElementById("summaryTableBody");
const typeFilter = document.getElementById("typeFilter");

const SUMMARY_COLSPAN = 4;

function renderLoadingRow() {
  summaryTableBody.innerHTML = `
    <tr>
      <td colspan="${SUMMARY_COLSPAN}" class="state-cell">
        <div class="loading-state">
          <span class="spinner" aria-hidden="true"></span>
          <span>Loading summary…</span>
        </div>
      </td>
    </tr>
  `;
}

function renderEmptyRow() {
  summaryTableBody.innerHTML = `
    <tr>
      <td colspan="${SUMMARY_COLSPAN}" class="state-cell">
        <div class="empty-state">
          <i class="bi bi-box-seam empty-state-icon"></i>
          <p class="empty-state-title">No assets yet</p>
          <p class="empty-state-message">Add assets from the Add Asset page to see them summarized here.</p>
        </div>
      </td>
    </tr>
  `;
}

function renderTable(filteredType = "all") {
  renderLoadingRow();
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

    if (Object.keys(grouped).length === 0) {
      renderEmptyRow();
      return;
    }

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

// Logout is handled globally by auth.js (the sidebar's "Logout" button
// calls window.logout()); no page-specific logout wiring needed here.
