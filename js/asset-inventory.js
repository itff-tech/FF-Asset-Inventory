// Firebase imports
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { db } from "../firebase-client.js";
const assetsCollection = collection(db, "assets");

let allAssets = [];
let currentPage = 1;
const rowsPerPage = 25;

let currentEditingAssetId = null;
let currentEditingAssetData = null;

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("tableBody");
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const typeFilter = document.getElementById("typeFilter");
  const resetBtn = document.getElementById("resetFilters");

  const editModal = document.getElementById("editAssetModal");
  const editForm = document.getElementById("editAssetForm");
  const closeEditModalBtn = document.getElementById("closeEditModal");
  const cancelEditModalBtn = document.getElementById("cancelEditModal");

  // 🔄 Load Assets
  async function loadAssets() {
    const snapshot = await getDocs(assetsCollection);
    allAssets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderTable(allAssets);

    // Add filters if elements exist
    if (searchInput && statusFilter && resetBtn) {
      searchInput.addEventListener("input", applyFilters);
      statusFilter.addEventListener("change", applyFilters);
      typeFilter?.addEventListener("change", applyFilters);
      resetBtn.addEventListener("click", () => {
        searchInput.value = "";
        statusFilter.value = "";
        if (typeFilter) typeFilter.value = "";
        currentPage = 1;
        renderTable(allAssets);
      });
    }
  }

  // ✅ ADD THIS FUNCTION to load asset types into dropdown
  async function loadAssetTypes() {
    const typeSnapshot = await getDocs(collection(db, "assetTypes"));
    const typeDropdown = document.getElementById("typeFilter");

    // Clear existing options
    typeDropdown.innerHTML = `<option value="">All Types</option>`;

    typeSnapshot.forEach((doc) => {
      const type = doc.data().name;
      const option = document.createElement("option");
      option.value = type.toLowerCase();
      option.textContent = type;
      typeDropdown.appendChild(option);
    });
  }

  // 🔍 Filter assets
  function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const status = statusFilter.value.toLowerCase();
    const type = typeFilter?.value.toLowerCase();

    const filtered = allAssets.filter(asset => {
      const matchesSearch =
        asset.assetId?.toLowerCase().includes(searchTerm) ||
        asset.model?.toLowerCase().includes(searchTerm) ||
        asset.serialNumber?.toLowerCase().includes(searchTerm) ||
        asset.type?.toLowerCase().includes(searchTerm) ||
        asset.AllocatedTo?.toLowerCase().includes(searchTerm);

      const matchesStatus = !status || asset.status?.toLowerCase() === status;
      const matchesType = !type || asset.type?.toLowerCase() === type;

      return matchesSearch && matchesStatus && matchesType;
    });

    currentPage = 1;
    renderTable(filtered);
  }

  // 🖥️ Render assets with pagination
  function renderTable(data) {
    tableBody.innerHTML = "";
    const start = (currentPage - 1) * rowsPerPage;
    const paginatedData = data.slice(start, start + rowsPerPage);

    paginatedData.forEach((asset, index) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td class="border px-4 py-2 text-center">${start + index + 1}</td>
        <td class="border px-4 py-2 text-center">${asset.assetId || "N/A"}</td>
        <td class="border px-4 py-2 text-center">${asset.type || "N/A"}</td>
        <td class="border px-4 py-2 text-center">${asset.model || "N/A"}</td>
        <td class="border px-4 py-2 text-center">${asset.serialNumber || "N/A"}</td>
        <td class="border px-4 py-2 text-center">${asset.AllocatedTo || "-"}</td>
        <td class="border px-4 py-2 text-center">${asset.allocationDate || "-"}</td>
        <td class="border px-4 py-2 text-center">${asset.purchaseDate || "N/A"}</td>
        <td class="border px-4 py-2 text-center">
          <span class="px-2 py-1 rounded text-white ${
            asset.status?.toLowerCase() === "available" ? "bg-green-500" : "bg-red-500"
          }">${asset.status || "N/A"}</span>
        </td>
        <td class="border px-4 py-2 space-x-2 text-center">
          <button class="edit-btn text-blue-500 hover:text-blue-700" data-id="${asset.id}" title="Edit"><i class="bi bi-pencil-square"></i></button>
          <button class="allocate-btn text-green-500 hover:text-green-700" data-assetid="${asset.assetId}" title="Allocate"><i class="bi bi-arrow-left-right"></i></button>
          <button class="return-btn text-yellow-500 hover:text-yellow-700" data-id="${asset.id}" title="Return"><i class="bi bi-arrow-counterclockwise"></i></button>
          <button class="delete-btn text-red-500 hover:text-red-700" data-id="${asset.id}" title="Delete"><i class="bi bi-trash"></i></button>
          <button class="history-btn text-gray-600 hover:text-black" data-id="${asset.id}" title="History"><i class="bi bi-clock-history"></i></button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    renderPagination(data);
    bindEvents();
  }

  function renderPagination(data) {
    const pagination = document.getElementById("pagination");
    const totalPages = Math.ceil(data.length / rowsPerPage);
    pagination.innerHTML = `
      <div class="flex justify-between items-center mt-4">
        <button onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled class="bg-gray-300 px-3 py-1 rounded"' : 'class="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"'}>Prev</button>
        <span>Page ${currentPage} of ${totalPages}</span>
        <button onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled class="bg-gray-300 px-3 py-1 rounded"' : 'class="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"'}>Next</button>
      </div>
    `;
  }

  window.goToPage = function (page) {
    const totalPages = Math.ceil(allAssets.length / rowsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable(allAssets);
  };

  async function confirmDelete(assetId) {
    if (confirm("Are you sure you want to delete this asset?")) {
      await deleteDoc(doc(db, "assets", assetId));
      window.showToast("Asset deleted successfully!", "success")
      loadAssets();
    }
  }

  async function returnAsset(assetId) {
    if (confirm("Mark this asset as Available?")) {
      const assetRef = doc(db, "assets", assetId);
      const assetSnap = await getDoc(assetRef);
      const assetData = assetSnap.data();

      const updatedHistory = [
        ...(assetData.history || []),
        {
          date: new Date().toISOString(),
          action: "Returned",
          details: `Returned by ${assetData.AllocatedTo || "Unknown"}`
        }
      ];

      await updateDoc(assetRef, {
        status: "Available",
        AllocatedTo: "",
        allocationDate: "",
        history: updatedHistory
      });

     window.showToast("Asset returned successfully!", "success")
      loadAssets();
    }
  }

  function openEditModal() {
    editModal.classList.remove("hidden");
  }

  function closeEditModal() {
    editModal.classList.add("hidden");
    editForm.reset();
    currentEditingAssetId = null;
    currentEditingAssetData = null;
  }

  function formatEditDetails(before, after) {
  const changes = [];

  const appendIfChanged = (label, oldValue, newValue) => {
    const oldText = (oldValue ?? "").toString().trim();
    const newText = (newValue ?? "").toString().trim();
    if (oldText !== newText) {
      changes.push(`${label}: ${oldText || "-"} → ${newText || "-"}`);
    }
  };

  appendIfChanged("Type", before.type, after.type);
  appendIfChanged("Model", before.model, after.model);
  appendIfChanged("Serial Number", before.serialNumber, after.serialNumber);
  appendIfChanged("Allocated To", before.AllocatedTo, after.AllocatedTo);
  appendIfChanged("Purchase Date", before.purchaseDate, after.purchaseDate);

  return changes.length > 0 ? changes.join("; ") : "No field changes";
}

  async function editAsset(assetId) {
    try {
      const assetDoc = await getDoc(doc(db, "assets", assetId));

      if (!assetDoc.exists()) {
        window.showToast("Asset not found", "warning")
        return;
      }

      const assetData = assetDoc.data();
      currentEditingAssetId = assetId;
      currentEditingAssetData = assetData;

      document.getElementById("editAssetId").value = assetData.assetId || "";
      document.getElementById("editType").value = assetData.type || "";
      document.getElementById("editModel").value = assetData.model || "";
      document.getElementById("editSerialNumber").value = assetData.serialNumber || "";
      document.getElementById("editAllocatedTo").value = assetData.AllocatedTo || "";
      document.getElementById("editPurchaseDate").value = assetData.purchaseDate || "";

      openEditModal();
    } catch (error) {
      console.error("Error loading asset for edit:", error);
      window.showToast("Failed to load asset details for edit", "error")
    }
  }

  async function saveEditedAsset(event) {
    event.preventDefault();

    if (!currentEditingAssetId || !currentEditingAssetData) {
      alert("No asset selected for editing.");
      return;
    }

    const type = document.getElementById("editType").value.trim();
    const model = document.getElementById("editModel").value.trim();
    const serialNumber = document.getElementById("editSerialNumber").value.trim();
    const allocatedTo = document.getElementById("editAllocatedTo").value.trim();
    const purchaseDate = document.getElementById("editPurchaseDate").value;

    if (!type || !model || !serialNumber || !purchaseDate) {
      alert("Please fill all required fields (Type, Model, Serial Number, Purchase Date).");
      return;
    }

    try {
      const duplicateQuery = query(
        assetsCollection,
        where("serialNumber", "==", serialNumber)
      );
      const duplicateSnapshot = await getDocs(duplicateQuery);
      const hasDuplicate = duplicateSnapshot.docs.some(d => d.id !== currentEditingAssetId);

      if (hasDuplicate) {
        window.showToast("Serial Number already exists for another asset", "error")
        return;
      }

      const updatedData = {
        type,
        model,
        serialNumber,
        AllocatedTo: allocatedTo,
        purchaseDate
      };

      const details = formatEditDetails(currentEditingAssetData, updatedData);
      const updatedHistory = [
        ...(currentEditingAssetData.history || []),
        {
          date: new Date().toISOString(),
          action: "Asset Edited",
          details
        }
      ];

      await updateDoc(doc(db, "assets", currentEditingAssetId), {
        ...updatedData,
        history: updatedHistory
      });

      window.showToast("Asset updated successfully!", "success")
      closeEditModal();
      loadAssets();
    } catch (error) {
      console.error("Error updating asset:", error);
      window.showToast("Failed to update asset", "error")
    }
  }

  function bindEvents() {
    document.querySelectorAll(".edit-btn").forEach(btn =>
      btn.addEventListener("click", () => editAsset(btn.dataset.id))
    );
    document.querySelectorAll(".allocate-btn").forEach(btn =>
      btn.addEventListener("click", () => openAllocateModal(btn.dataset.assetid))
    );
    document.querySelectorAll(".return-btn").forEach(btn =>
      btn.addEventListener("click", () => returnAsset(btn.dataset.id))
    );
    document.querySelectorAll(".delete-btn").forEach(btn =>
      btn.addEventListener("click", () => confirmDelete(btn.dataset.id))
    );
    document.querySelectorAll(".history-btn").forEach(btn =>
      btn.addEventListener("click", () => viewHistory(btn.dataset.id))
    );
  }

  async function viewHistory(assetId) {
    const assetDoc = await getDoc(doc(db, "assets", assetId));
    const asset = assetDoc.data();
    const history = asset.history || [];

    const historyList = document.getElementById("historyList");
    historyList.innerHTML = "";

    if (history.length === 0) {
      historyList.innerHTML = `<li class="text-gray-500">No history available for this asset.</li>`;
    } else {
      history.forEach(entry => {
  const li = document.createElement("li");
  li.textContent = `${new Date(entry.date).toLocaleString()} — ${entry.action}${entry.details ? ` — ${entry.details}` : ""}`;
  historyList.appendChild(li);
});
    }

    document.getElementById("historyModal").classList.remove("hidden");
  }

  closeEditModalBtn?.addEventListener("click", closeEditModal);
  cancelEditModalBtn?.addEventListener("click", closeEditModal);
  editForm?.addEventListener("submit", saveEditedAsset);

  window.confirmDelete = confirmDelete;
  window.returnAsset = returnAsset;
  window.editAsset = editAsset;
  window.viewHistory = viewHistory;
  window.openAllocateModal = (assetId) => {
    window.location.href = `allocate-asset.html?assetId=${assetId}`;
  };

  // 🔃 Initial Load
  loadAssets();
  loadAssetTypes(); // ✅ Call it here
});
