/**
 * Reusable toast notification
 * @param {string} message - text to display
 * @param {"success"|"error"|"warning"|"info"} type
 * @param {number} duration - auto-dismiss in ms (default 3000)
 */
function showToast(message, type = "info", duration = 3000) {
  const container = document.getElementById("toastContainer");
  if (!container) {
    console.warn("Toast container (#toastContainer) not found.");
    return;
  }

  const safeType = ["success", "error", "warning", "info"].includes(type) ? type : "info";

  const toast = document.createElement("div");
  toast.className = `toast toast-${safeType}`;
  toast.setAttribute("role", "status");

  toast.innerHTML = `
    <div class="toast-message">${message}</div>
    <button class="toast-close" aria-label="Close notification">&times;</button>
  `;

  const removeToast = () => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 220);
  };

  toast.querySelector(".toast-close").addEventListener("click", removeToast);

  container.appendChild(toast);

  setTimeout(removeToast, duration);
}
