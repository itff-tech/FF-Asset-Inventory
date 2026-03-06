import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth } from "./firebase-client.js";
window.login = function () {
  const usernameInput = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const errorDiv = document.getElementById("error");

  // Map username to Firebase email
  const email = usernameInput.toLowerCase() === "asset admin" ? "it@finalfunnel.com" : usernameInput;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "add-asset.html"; // Redirect to main page after login
    })
    .catch((error) => {
      console.error("Login failed:", error);
      errorDiv.textContent = "Login failed: " + error.message;
      errorDiv.classList.remove("hidden");
    });
};

// 🔐 Protect all pages (except login.html)
onAuthStateChanged(auth, (user) => {
  const isLoginPage = window.location.pathname.endsWith("login.html");
  if (!user && !isLoginPage) {
    window.location.href = "login.html";
  }
});

// 🚪 Global logout function (to be called on logout button click)
window.logout = function () {
  signOut(auth)
    .then(() => {
      window.location.href = "login.html";
    })
    .catch((error) => {
      console.error("Logout failed:", error);
    });
};

/* ===============================
   🕒 Auto Logout After Inactivity
   =============================== */
let lastActivityTime = Date.now();

/* const maxInactivity = 1 * 60 * 1000; // 1 minute */

 const maxInactivity = 30 * 60 * 1000; // 30 minutes

function resetInactivityTimer() {
  lastActivityTime = Date.now();
}

// Track user activity
['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(event => {
  window.addEventListener(event, resetInactivityTimer);
});

// Check every minute
setInterval(() => {
  if (auth.currentUser && (Date.now() - lastActivityTime > maxInactivity)) {
    console.log("Logging out due to inactivity...");
    signOut(auth).then(() => {
      window.location.href = "login.html";
    });
  }
}, 60 * 1000);

