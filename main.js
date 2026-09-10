const INVITES = {
  main: {
    src: "assets/invitations/invite-no-qr.png",
    label: "Wedding invitation",
    short: "Wedding",
  },
  mehindi: {
    src: "assets/invitations/mehindi.png",
    label: "Mehindi invitation",
    short: "Mehindi",
  },
};

// Which invitations each kind of guest receives. Everyone gets the main
// invite; only mehindi guests get the extra card on top of it.
const GUEST_SETS = {
  default: ["main"],
  mehindi: ["main", "mehindi"],
};

const WEDDING_URL =
  "https://www.theknot.com/us/chris-cavalea-and-rohini-jaikaran-dec-2026";

const INVITATION_ASPECT = 0.72;

// Breathing room between the card and the pager above / the button below.
// Scales with the viewport so the proportions hold from phone to desktop.
const edgeGap = () =>
  Math.min(Math.max(window.innerHeight * 0.03, 16), 32);

const stage = document.querySelector(".stage");
const envelope = document.querySelector(".envelope");
const deck = document.querySelector(".invitation");
const deckNav = document.querySelector(".deck-nav");
const cta = document.querySelector(".cta");

const invtype = new URLSearchParams(location.search).get("invtype");
const keys = GUEST_SETS[invtype] || GUEST_SETS.default;

const pages = keys.map((key, i) => {
  const invite = INVITES[key];
  const img = document.createElement("img");
  img.className = "invite-page";
  img.alt = invite.label;
  img.src = invite.src;
  img.decoding = "async";
  if (i === 0) img.classList.add("is-active");
  else img.setAttribute("aria-hidden", "true");
  deck.appendChild(img);
  return img;
});

let index = 0;
let revealed = false;
let swipeStartX = null;
let swiped = false;
const hasNav = pages.length > 1;

cta.href = WEDDING_URL;

const dots = hasNav
  ? keys.map((key, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "deck-dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", INVITES[key].label);
      dot.textContent = INVITES[key].short;
      dot.addEventListener("click", () => show(i));
      deckNav.appendChild(dot);
      return dot;
    })
  : [];

function show(next) {
  const target = (next + pages.length) % pages.length;
  if (target === index) return;
  pages[index].classList.remove("is-active");
  pages[index].setAttribute("aria-hidden", "true");
  index = target;
  pages[index].classList.add("is-active");
  pages[index].removeAttribute("aria-hidden");
  syncNav();
  // Before the reveal finishes the grow keyframes own the card's box; leave
  // the size vars alone until then so the animation doesn't jump.
  if (revealed) setFinalScale();
}

function syncNav() {
  dots.forEach((dot, i) => {
    dot.classList.toggle("is-active", i === index);
    dot.setAttribute("aria-selected", i === index ? "true" : "false");
  });
}

function setFinalScale() {
  const active = pages[index];
  const aspect =
    active.naturalWidth > 0 && active.naturalHeight > 0
      ? active.naturalWidth / active.naturalHeight
      : INVITATION_ASPECT;
  // The pager and the button are both fixed, so their edges bound the space
  // the card may occupy. Pad the stage to match, which centres the card in
  // that band instead of leaving the slack all at one end.
  const gap = edgeGap();
  const ceiling = hasNav ? deckNav.getBoundingClientRect().bottom + gap : gap;
  const floor = cta.getBoundingClientRect().top - gap;
  stage.style.paddingTop = `${ceiling}px`;
  stage.style.paddingBottom = `${window.innerHeight - floor}px`;
  const box = envelope.getBoundingClientRect();
  const centre = box.top + box.height / 2;
  // Centred growth means the tighter side caps both halves.
  const maxH = Math.max(2 * Math.min(centre - ceiling, floor - centre), 120);
  const targetW = Math.min(window.innerWidth * 0.84, maxH * aspect);
  const targetH = targetW / aspect;
  const rect = deck.getBoundingClientRect();
  if (rect.width === 0) return;
  stage.style.setProperty("--inv-current-w", `${rect.width.toFixed(2)}px`);
  stage.style.setProperty("--inv-current-h", `${rect.height.toFixed(2)}px`);
  stage.style.setProperty("--inv-final-w", `${targetW.toFixed(2)}px`);
  stage.style.setProperty("--inv-final-h", `${targetH.toFixed(2)}px`);
}

window.addEventListener("resize", setFinalScale);

if (hasNav) {
  stage.classList.add("has-nav");
  deckNav.hidden = false;
  syncNav();

  deck.addEventListener("click", () => {
    if (swiped) return;
    show(index + 1);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") show(index + 1);
    else if (e.key === "ArrowLeft") show(index - 1);
  });

  stage.addEventListener("pointerdown", (e) => {
    swipeStartX = e.clientX;
    swiped = false;
  });
  stage.addEventListener("pointerup", (e) => {
    if (swipeStartX === null) return;
    const dx = e.clientX - swipeStartX;
    swipeStartX = null;
    if (Math.abs(dx) > 40) {
      // Mark it so the click that follows this gesture doesn't advance again.
      swiped = true;
      show(index + (dx < 0 ? 1 : -1));
    }
  });
  stage.addEventListener("pointercancel", () => {
    swipeStartX = null;
  });
}

function start() {
  setFinalScale();
  stage.classList.add("is-opening");
  setTimeout(() => stage.classList.add("is-flap-open"), 1200);
  setTimeout(() => stage.classList.add("is-invitation-front"), 2000);
  setTimeout(() => {
    revealed = true;
  }, 3000);
}

// Only the first card gates the opening animation; the rest load behind it.
const first = pages[0];
const decoded = first.decode ? first.decode() : Promise.resolve();
decoded.catch(() => {}).then(() => {
  requestAnimationFrame(start);
});
