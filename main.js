const INVITES = {
  default: "assets/invitations/invite-1.png",
};

const WEDDING_URL = "https://example.com";

const INVITATION_ASPECT = 0.72;

const stage = document.querySelector(".stage");
const invitation = document.querySelector(".invitation");
const cta = document.querySelector(".cta");

const invtype = new URLSearchParams(location.search).get("invtype");
const src = INVITES[invtype] || INVITES.default;

invitation.alt = "Wedding invitation";
invitation.src = src;

cta.href = WEDDING_URL;

function setFinalScale() {
  const rect = invitation.getBoundingClientRect();
  if (rect.width === 0) return;
  const targetW = Math.min(window.innerWidth * 0.84, window.innerHeight * 0.84 * INVITATION_ASPECT);
  const scale = targetW / rect.width;
  stage.style.setProperty("--final-scale", scale.toFixed(3));
}

window.addEventListener("resize", setFinalScale);

function start() {
  setFinalScale();
  stage.classList.add("is-opening");
  setTimeout(() => stage.classList.add("is-flap-open"), 1200);
  setTimeout(() => stage.classList.add("is-invitation-front"), 2000);
}

const decoded = invitation.decode ? invitation.decode() : Promise.resolve();
decoded.catch(() => {}).then(() => {
  requestAnimationFrame(start);
});
