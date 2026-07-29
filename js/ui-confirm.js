const DEFAULTS = {
  title: "Confirm Action",
  message: "Are you sure you want to continue?",
  confirmText: "Confirm",
  cancelText: "Cancel",
  type: "warning"
};

// If showConfirmModal() is called again while a previous call on the same
// modal hasn't resolved yet (e.g. a double-click on the button that opens
// it), force-close the earlier instance and clean up its listeners first.
// Without this, the shared #confirmModal element ends up with two stacked
// sets of click/keydown listeners, and a single click on "Confirm" fires
// both of them — running whatever the caller does next (a Firestore write,
// a toast, etc.) twice.
let activeClose = null;

export function showConfirmModal(options = {}) {
  const config = { ...DEFAULTS, ...options };
  const modal = document.getElementById("confirmModal");
  if (!modal) {
    console.error("[confirm-modal] #confirmModal not found in DOM");
    return Promise.resolve(false);
  }

  if (activeClose) {
    activeClose(false);
    activeClose = null;
  }

  const titleEl = modal.querySelector("[data-confirm-title]");
  const messageEl = modal.querySelector("[data-confirm-message]");
  const confirmBtn = modal.querySelector("[data-confirm-ok]");
  const cancelBtn = modal.querySelector("[data-confirm-cancel]");
  const iconWrap = modal.querySelector("[data-confirm-icon]");

  if (titleEl) titleEl.textContent = config.title;
  if (messageEl) messageEl.textContent = config.message;
  if (confirmBtn) confirmBtn.textContent = config.confirmText;
  if (cancelBtn) cancelBtn.textContent = config.cancelText;

  modal.dataset.type = config.type;
  iconWrap?.setAttribute("data-type", config.type);

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");

  return new Promise((resolve) => {
    const close = (result) => {
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
      confirmBtn?.removeEventListener("click", onConfirm);
      cancelBtn?.removeEventListener("click", onCancel);
      modal.removeEventListener("click", onBackdrop);
      document.removeEventListener("keydown", onKeydown);
      if (activeClose === close) activeClose = null;
      resolve(result);
    };
    activeClose = close;

    const onConfirm = () => close(true);
    const onCancel = () => close(false);
    const onBackdrop = (event) => {
      if (event.target === modal) close(false);
    };
    // Enter confirms, Escape cancels — matches the visible default action
    // (the primary "Confirm" button) so keyboard-only users aren't forced
    // to reach for the mouse.
    const onKeydown = (event) => {
      if (event.key === "Escape") {
        close(false);
      } else if (event.key === "Enter") {
        event.preventDefault();
        close(true);
      }
    };

    confirmBtn?.addEventListener("click", onConfirm);
    cancelBtn?.addEventListener("click", onCancel);
    modal.addEventListener("click", onBackdrop);
    document.addEventListener("keydown", onKeydown);

    confirmBtn?.focus();
  });
}
