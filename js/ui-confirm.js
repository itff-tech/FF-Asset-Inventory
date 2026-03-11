const DEFAULTS = {
  title: "Confirm Action",
  message: "Are you sure you want to continue?",
  confirmText: "Confirm",
  cancelText: "Cancel",
  type: "warning"
};

export function showConfirmModal(options = {}) {
  const config = { ...DEFAULTS, ...options };
  const modal = document.getElementById("confirmModal");
  if (!modal) {
    console.error("[confirm-modal] #confirmModal not found in DOM");
    return Promise.resolve(false);
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
      document.removeEventListener("keydown", onEsc);
      resolve(result);
    };

    const onConfirm = () => close(true);
    const onCancel = () => close(false);
    const onBackdrop = (event) => {
      if (event.target === modal) close(false);
    };
    const onEsc = (event) => {
      if (event.key === "Escape") close(false);
    };

    confirmBtn?.addEventListener("click", onConfirm);
    cancelBtn?.addEventListener("click", onCancel);
    modal.addEventListener("click", onBackdrop);
    document.addEventListener("keydown", onEsc);
  });
}
