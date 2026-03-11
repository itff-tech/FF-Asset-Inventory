  import { collection, addDoc, query, where, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
  import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
  import { auth, db } from "../firebase-client.js";
  import { showConfirmModal } from "./ui-confirm.js";
  const assetsCollection = collection(db, "assets");

  const assetTypeSelect = document.getElementById("assetType");
  const manageBtn = document.getElementById("manageTypesBtn");
  const customList = document.getElementById("customTypesList");
  const popover = document.getElementById("manageTypesPopover");

  onAuthStateChanged(auth, user => {
    if (!user) window.location.href = "login.html";
  });

  async function loadAssetTypes() {
    assetTypeSelect.innerHTML = `<option value="">Select Type</option>`;
    const snapshot = await getDocs(collection(db, "assetTypes"));
    snapshot.forEach(doc => {
      const type = doc.data().name;
      const option = document.createElement("option");
      option.value = type.toLowerCase();
      option.textContent = type;
      assetTypeSelect.appendChild(option);
    });
  }
  await loadAssetTypes();

  // ➕ Add new asset type
  document.getElementById("addAssetTypeBtn").addEventListener("click", async () => {
    const newTypeInput = document.getElementById("newAssetType");
    const newType = newTypeInput.value.trim();
    if (!newType) return showToast(`Please Enter a Valid Asset Type`);

    const q = query(collection(db, "assetTypes"), where("name", "==", newType));
    const existing = await getDocs(q);
    if (!existing.empty) {
    showToast(`This Asset Type Already Exists`);
      return;
    }

    await addDoc(collection(db, "assetTypes"), { name: newType });
     showToast(`Asset type added`);
    newTypeInput.value = "";
    await loadAssetTypes();
  });

  // 🔢 Generate Asset ID
  async function generateAssetId(assetType) {
    const prefixMap = {
      laptop: "L", desktop: "D", monitor: "M",
      printer: "P", mouse: "Mo", headset: "H",
      pendrive: "PD", keyboard: "Key"
    };
    const cleanedType = assetType.trim().toLowerCase();
    const prefix = prefixMap[cleanedType] || "X";
    let assetId, exists = true;

    while (exists) {
      const randomId = Math.floor(1000 + Math.random() * 9000);
      assetId = `${prefix}-${randomId}`;
      const q = query(assetsCollection, where("assetId", "==", assetId));
      const snapshot = await getDocs(q);
      exists = !snapshot.empty;
    }
    return assetId;
  }

  // 📥 Add Asset Form
  document.getElementById("assetForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const type = document.getElementById("assetType").value;
  const model = document.getElementById("model").value.trim();
  const serialNumber = document.getElementById("serialNumber").value.trim();
  const purchaseDate = document.getElementById("purchaseDate").value;

  if (!type || !model || !serialNumber || !purchaseDate) {
    showToast(`Please fill all required fields`);
    return;
  }

  try {
    // Check duplicate serial number before creating asset
    const duplicateQuery = query(
      assetsCollection,
      where("serialNumber", "==", serialNumber)
    );
    const duplicateSnapshot = await getDocs(duplicateQuery);

    if (!duplicateSnapshot.empty) {
      window.showToast("Serial number already exists", "warning");
      return;
    }

    const assetId = await generateAssetId(type);

    const assetData = {
      assetId,
      type,
      model,
      serialNumber,
      purchaseDate,
      status: "Available",
      history: [
        {
          date: new Date().toISOString(),
          action: "Asset Added",
          details: `Registered asset (${type || "-"} | ${model || "-"} | SN: ${serialNumber || "-"})`
        }
      ]
    };

    await addDoc(assetsCollection, assetData);
    showToast(`Asset ${assetId} Added successfully!`, "success");
    document.getElementById("assetForm").reset();
    await loadAssetTypes();
  } catch (error) {
    console.error("❌ Error adding asset:", error);
    showToast(`Failed to add asset`);
  }
});

  // ⚙️ Open popover
  manageBtn.addEventListener("click", async () => {
    await refreshCustomList();
    const rect = manageBtn.getBoundingClientRect();
    popover.style.top = (rect.bottom + window.scrollY + 10) + "px";
    popover.style.left = (rect.left + window.scrollX) + "px";
    popover.classList.remove("hidden");
  });

  // ❌ Close popover
  document.getElementById("closeManagePopover")
    .addEventListener("click", () => popover.classList.add("hidden"));

  // 🖱️ Close popover if clicking outside
document.addEventListener("click", (event) => {
  if (!popover.classList.contains("hidden") &&
      !popover.contains(event.target) &&
      !manageBtn.contains(event.target)) {
    popover.classList.add("hidden");
  }
});

  // 🔍 Search filter
  document.getElementById("typeSearch").addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll("#customTypesList li").forEach(li => {
      li.style.display = li.textContent.toLowerCase().includes(term) ? "flex" : "none";
    });
  });

  // 🔁 Refresh custom types list
  async function refreshCustomList() {
    customList.innerHTML = "";
    const snapshot = await getDocs(collection(db, "assetTypes"));
    snapshot.forEach((doc) => {
      const type = doc.data().name;
      const li = document.createElement("li");
      li.className = "flex justify-between items-center bg-gray-100 px-3 py-2 rounded";
      li.innerHTML = `
        <span>${type}</span>
        <button data-value="${type}" class="text-red-600 hover:text-red-800">
          <i class="bi bi-trash"></i>
        </button>
      `;
      customList.appendChild(li);
    });
  }

  // 🗑️ Delete custom type (delegation)
  customList.addEventListener("click", async (e) => {
    const trashBtn = e.target.closest("button[data-value]");
    if (!trashBtn) return;

    const typeToDelete = trashBtn.dataset.value;
const ok = await showConfirmModal({
  title: "Delete Asset Type",
  message: `Delete "${typeToDelete}"? This cannot be undone.`,
  confirmText: "Delete",
  cancelText: "Keep",
  type: "warning"
});
if (!ok) return;

    try {
      const q = query(collection(db, "assetTypes"), where("name", "==", typeToDelete));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }

      // Remove from dropdown
      Array.from(assetTypeSelect.options).forEach(opt => {
        if (opt.textContent === typeToDelete) {
          opt.remove();
        }
      });

      await refreshCustomList();
      window.showToast("Deleted successfully!", "error");
    } catch (err) {
      console.error(err);
     showToast(`Error deleting asset type`);
    }
  });
