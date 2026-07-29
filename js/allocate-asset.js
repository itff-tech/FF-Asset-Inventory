import { getDocs, getDoc, collection, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from "../firebase-client.js";
import { showConfirmModal } from "./ui-confirm.js";
const assetsCollection = collection(db, "assets");

document.addEventListener('DOMContentLoaded', async function () {
  const assetDropdown = document.getElementById('assetSelect');
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedAssetId = urlParams.get('assetId'); // e.g., "L-5347"

  assetDropdown.innerHTML = `<option value="">Loading available assets…</option>`;
  assetDropdown.disabled = true;

  try {
    const snapshot = await getDocs(collection(db, "assets"));
    let docIdToSelect = null;
    let availableCount = 0;

    assetDropdown.innerHTML = `<option value="">-- Select an Asset --</option>`;

    snapshot.forEach(docSnap => {
      const asset = docSnap.data();

      if (asset.status?.toLowerCase() === "available") {
        availableCount++;
        const option = document.createElement("option");
        option.value = docSnap.id;
        option.textContent = `${asset.assetId} | ${asset.type} | ${asset.model} | ${asset.serialNumber}`;

        if (asset.assetId === preselectedAssetId) {
          docIdToSelect = docSnap.id;
        }

        assetDropdown.appendChild(option);
      }
    });

    if (availableCount === 0) {
      assetDropdown.innerHTML = `<option value="">No available assets to allocate</option>`;
    } else {
      assetDropdown.disabled = false;
    }

    if (docIdToSelect) {
      assetDropdown.value = docIdToSelect;
    }
  } catch (error) {
    console.error("Error loading assets:", error);
    assetDropdown.innerHTML = `<option value="">Failed to load assets</option>`;
    window.showToast("Failed to load available assets.", "error");
  }

  const assignButton = document.getElementById("assignBtn");
  if (assignButton) {
    assignButton.addEventListener('click', allocateAsset);
  }
});



// Allocate Asset function
async function allocateAsset() {
  const assignButton = document.getElementById("assignBtn");
  const assetDocId = document.getElementById("assetSelect").value;
  const userName = document.getElementById("userName").value;
  const allocationDate = document.getElementById("allocationDate").value;

  if (!assetDocId || !userName || !allocationDate) {
    showToast("Please fill in all fields.", "error");
    return;
  }

  const ok = await showConfirmModal({
    title: "Allocate Asset",
    message: `Assign this asset to ${userName}?`,
    confirmText: "Assign",
    cancelText: "Cancel",
    type: "info"
  });
  if (!ok) return;

  if (assignButton) assignButton.disabled = true;

  try {
    const assetRef = doc(db, "assets", assetDocId);
    const assetSnap = await getDoc(assetRef);
    const assetData = assetSnap.exists() ? assetSnap.data() : {};

    const updatedHistory = [
      ...(assetData.history || []),
      {
        date: new Date().toISOString(),
        action: "Allocated",
        details: `Assigned to ${userName || "Unknown"} on ${new Date().toLocaleDateString()}`
      }
    ];

    await updateDoc(assetRef, {
      status: "Allocated",
      AllocatedTo: userName,
      allocationDate: allocationDate,
      history: updatedHistory
    });

    window.showToast("Asset successfully Allocated!", "success");
    document.getElementById("allocateForm").reset();
    setTimeout(() => location.reload(), 1000);
  } catch (error) {
    console.error("Error allocating asset: ", error);
    window.showToast("❌ Error allocating asset.", "error");
    if (assignButton) assignButton.disabled = false;
  }
}
