import { getDocs, collection, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from "../firebase-client.js";
const assetsCollection = collection(db, "assets");

document.addEventListener('DOMContentLoaded', async function () {
  const assetDropdown = document.getElementById('assetSelect');
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedAssetId = urlParams.get('assetId'); // e.g., "L-5347"

  assetDropdown.innerHTML = `<option value="">-- Select an Asset --</option>`;

  try {
    const snapshot = await getDocs(collection(db, "assets"));
    let docIdToSelect = null;

    snapshot.forEach(docSnap => {
      const asset = docSnap.data();

      if (asset.status?.toLowerCase() === "available") {
        const option = document.createElement("option");
        option.value = docSnap.id;
        option.textContent = `${asset.assetId} | ${asset.type} | ${asset.model} | ${asset.serialNumber}`;

        if (asset.assetId === preselectedAssetId) {
          docIdToSelect = docSnap.id;
        }

        assetDropdown.appendChild(option);
      }
    });

    if (docIdToSelect) {
      assetDropdown.value = docIdToSelect;
    }
  } catch (error) {
    console.error("Error loading assets:", error);
    alert("❌ Failed to load available assets.");
  }

  const assignButton = document.getElementById("assignBtn");
  if (assignButton) {
    assignButton.addEventListener('click', allocateAsset);
  }
});



// Allocate Asset function
async function allocateAsset() {
  const assetDocId = document.getElementById("assetSelect").value;
  const userName = document.getElementById("userName").value;
  const allocationDate = document.getElementById("allocationDate").value;

  if (!assetDocId || !userName || !allocationDate) {
    showToast("Please fill in all fields.", "error");
    return;
  }

  if (!confirm("Are you sure you want to assign this asset?")) return;

  try {
    const assetRef = doc(db, "assets", assetDocId);
    const assetSnap = await getDocs(assetsCollection);
    const assetData = (await getDocs(assetsCollection)).docs.find(doc => doc.id === assetDocId)?.data() || {};

    const updatedHistory = [
      ...(assetData.history || []),
      {
        date: new Date().toISOString(),
        action: "Allocated",
        details: `Returned from ${assetData.AllocatedTo || "Unknown"}${assetData.allocationDate ? ` (allocated on ${assetData.allocationDate})` : ""}`
      }
    ];

    await updateDoc(assetRef, {
      status: "Allocated",
      AllocatedTo: userName,
      allocationDate: allocationDate,
      history: updatedHistory
    });

    showToast("✅ Asset successfully Allocated!", "success");
    document.getElementById("allocateForm").reset();
    setTimeout(() => location.reload(), 1000);
  } catch (error) {
    console.error("Error allocating asset: ", error);
    showToast("❌ Error allocating asset.", "error");
  }
}


// Toast Notification
function showToast(message, type) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.className = `
    fixed bottom-5 right-5 
    ${type === "success" ? "bg-green-500" : "bg-red-500"} 
    text-white px-4 py-2 rounded shadow-lg animate-fade-in-out z-50
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Toast animation styles
const style = document.createElement('style');
style.textContent = `
@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(20px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-20px); }
}
.animate-fade-in-out {
  animation: fadeInOut 3s ease-in-out forwards;
}
`;
document.head.appendChild(style);
