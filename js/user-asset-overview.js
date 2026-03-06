import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from "../firebase-client.js";
const assetRef = collection(db, "assets");

let allAssets = [];
let currentPage = 1;
const usersPerPage = 25;
let groupedUsers = {};

async function loadUserAssets() {
  const snapshot = await getDocs(query(assetRef, where("AllocatedTo", "!=", "")));
  allAssets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  renderUserTable(allAssets);
}

function renderUserTable(data) {
  groupedUsers = {};
  data.forEach(asset => {
    const user = asset.AllocatedTo || "Unknown";
    if (!groupedUsers[user]) groupedUsers[user] = [];
    groupedUsers[user].push(asset);
  });

  renderPaginatedUsers(currentPage);
}

function renderPaginatedUsers(page) {
  const tbody = document.getElementById("userAssetTableBody");
  tbody.innerHTML = "";

  const users = Object.keys(groupedUsers);
  const totalPages = Math.ceil(users.length / usersPerPage);
  currentPage = Math.max(1, Math.min(page, totalPages));

  const start = (currentPage - 1) * usersPerPage;
  const end = start + usersPerPage;
  const usersToDisplay = users.slice(start, end);

  let index = start + 1;
  usersToDisplay.forEach(user => {
    const assets = groupedUsers[user];
    const row = document.createElement("tr");

    const assetList = assets.map(asset => `
      <div class="flex justify-between items-center bg-gray-100 p-2 mb-1 rounded">
        <span>${asset.assetId} (${asset.model})</span>
        <button onclick="returnSingleAsset('${asset.id}')" class="text-yellow-600 hover:text-yellow-800" title="Return">
          <i class="bi bi-arrow-counterclockwise"></i>
        </button>
      </div>
    `).join("");

    row.innerHTML = `
      <td class="border px-4 py-2 align-top">${index++}</td>
      <td class="border px-4 py-2 align-top font-semibold">${user}</td>
      <td class="border px-4 py-2 align-top text-center">${assets.length}</td>
      <td class="border px-4 py-2">${assetList}</td>
      <td class="border px-4 py-2 align-top">
        <button onclick="returnAllAssets('${user}')" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm">Return All</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  // Update pagination controls
  const pageIndicator = document.getElementById("pageIndicator");
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");

  if (pageIndicator) pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

async function returnAllAssets(user) {
  const userAssets = allAssets.filter(asset => asset.AllocatedTo === user);
  const confirmMsg = `Return all ${userAssets.length} asset(s) assigned to ${user}?`;
  if (!confirm(confirmMsg)) return;

  for (let asset of userAssets) {
    await updateDoc(doc(db, "assets", asset.id), {
      status: "Available",
      AllocatedTo: "",
      allocationDate: ""
    });
  }

  alert("All assets returned for " + user);
  loadUserAssets();
}

window.returnAllAssets = returnAllAssets;

async function returnSingleAsset(assetId) {
  if (!confirm("Return this asset to inventory?")) return;

  await updateDoc(doc(db, "assets", assetId), {
    status: "Available",
    AllocatedTo: "",
    allocationDate: ""
  });

  alert("Asset returned successfully.");
  loadUserAssets();
}

window.returnSingleAsset = returnSingleAsset;

// Search functionality + pagination nav
document.addEventListener("DOMContentLoaded", () => {
  loadUserAssets();

  const searchInput = document.getElementById("searchInput");
  const resetBtn = document.getElementById("resetSearch");

  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.toLowerCase();
    const filtered = allAssets.filter(asset =>
      asset.AllocatedTo?.toLowerCase().includes(keyword)
    );
    renderUserTable(filtered);
  });

  resetBtn.addEventListener("click", () => {
    searchInput.value = "";
    renderUserTable(allAssets);
  });

  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      renderPaginatedUsers(currentPage - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      renderPaginatedUsers(currentPage + 1);
    });
  }
});
