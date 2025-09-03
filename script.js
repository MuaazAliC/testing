// --- IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  updateProfile, GoogleAuthProvider, signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";

// --- CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyCwZt8aT-p0m3SmFgK1d4Wf-NLA_gAS3QM",
  authDomain: "code-with-muaaz.firebaseapp.com",
  projectId: "code-with-muaaz",
  storageBucket: "code-with-muaaz.appspot.com",
  messagingSenderId: "1037723136909",
  appId: "1:1037723136909:web:fac0ae41446221b6e683c4",
  measurementId: "G-JNN2Q1B7WT"
};

// --- INIT ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// --- UI HELPERS ---
const $ = (id) => document.getElementById(id);
const views = { login: $("loginCard"), register: $("registerCard"), profile: $("profileCard") };

function show(view) {
  Object.values(views).forEach(v => v.classList.add("hidden"));
  views[view].classList.remove("hidden");
}

function setMsg(id, text, type = "error") {
  const el = $(id);
  el.className = `msg ${type === "ok" ? "ok" : "error"}`;
  el.textContent = text || "";
}

// --- TOGGLE ---
$("toRegister").addEventListener("click", (e) => { e.preventDefault(); show("register"); });
$("toLogin").addEventListener("click", (e) => { e.preventDefault(); show("login"); });

// --- Photo chooser + preview ---
$("pickPhotoBtn").addEventListener("click", () => $("regPhoto").click());
$("regPhoto").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (file) $("regPreview").src = URL.createObjectURL(file);
});

// --- Register ---
$("registerBtn").addEventListener("click", async () => {
  setMsg("regMsg", "");
  const name = $("regName").value.trim();
  const email = $("regEmail").value.trim();
  const pass = $("regPassword").value;

  if (!name) return setMsg("regMsg", "Please enter your full name.");
  if (!email || !pass) return setMsg("regMsg", "Email and password required.");

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCred.user;

    // Upload photo if selected
    let photoURL = "";
    const file = $("regPhoto").files?.[0];
    if (file) {
      const path = `users/${user.uid}/profile_${Date.now()}.jpg`;
      const sref = ref(storage, path);
      await uploadBytes(sref, file);
      photoURL = await getDownloadURL(sref);
    }

    // Update profile with name + photo
    await updateProfile(user, { displayName: name, photoURL });

    setMsg("regMsg", "Account created!", "ok");

    // Use the updated currentUser instead of old user object
    renderProfile(auth.currentUser);
    show("profile");
  } catch (err) {
    setMsg("regMsg", err.message);
  }
});

// --- Login ---
$("loginBtn").addEventListener("click", async () => {
  setMsg("loginMsg", "");
  const email = $("loginEmail").value.trim();
  const pass = $("loginPassword").value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    renderProfile(auth.currentUser);
    show("profile");
  } catch (err) {
    setMsg("loginMsg", err.message);
  }
});

// --- Google login/signup ---
async function doGoogle() {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    renderProfile(res.user);
    show("profile");
  } catch (err) {
    if (!views.login.classList.contains("hidden")) setMsg("loginMsg", err.message);
    if (!views.register.classList.contains("hidden")) setMsg("regMsg", err.message);
  }
}
$("googleLoginBtn").addEventListener("click", doGoogle);
$("googleSignupBtn").addEventListener("click", doGoogle);

// --- Logout ---
$("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  setMsg("profMsg", "Signed out.", "ok");
  show("login");
});

// --- Persist session ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    renderProfile(user);
    show("profile");
  } else {
    show("login");
  }
});

// --- Render profile ---
function renderProfile(user) {
  $("pfName").textContent = user?.displayName || "User";
  $("pfEmail").textContent = user?.email || "";
  $("pfAvatar").src =
    user?.photoURL || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
}
