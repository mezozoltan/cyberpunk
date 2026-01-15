const galleryEl = document.getElementById("gallery");
const galleryCon = document.getElementById("gallery-container");
const viewerEl = document.getElementById("viewer");
const stage = document.getElementById("stage");
const imgLeft = document.getElementById("imgLeft");
const imgRight = document.getElementById("imgRight");
const splashEl = document.getElementById("splash");
const splashSound = document.getElementById("splashSound");
const Menu_Ost = document.getElementById("menu_ost");
const Menu_Sound = document.getElementById("menu_sound");
const splashBtn = document.getElementById("splashBtn");
const svgDefault = document.getElementById("svgDefault");
const svgPressed = document.getElementById("svgPressed");
const viewer = document.getElementById("viewer");
const controls = document.getElementById("controls");
const divider = document.getElementById("divider");
const wrap = document.querySelector(".gallery-wrap");
const gallery = document.getElementById("gallery");
const bar = document.getElementById("customScrollbar");
const track = bar?.querySelector(".scrollbar-track");
const thumb = document.getElementById("scrollbarThumb");
const items = document.getElementsByClassName('menu-item');
const keys = document.getElementById("keys");

let percent = 1/3;
let isPointerDown = false;
let leftIndex = 0;
let rightIndex = 0;
let currentSet = null;

function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie =
    name +
    "=" +
    encodeURIComponent(value) +
    ";expires=" +
    d.toUTCString() +
    ";path=/;SameSite=Lax";
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
  }
  return null;
}

const musicImg = document.getElementById("music");

function applyMusicUiFromMuted() {
  musicImg.src = Menu_Ost.muted ? "./gallery/play_music.png" : "./gallery/mute_music.png";
  keys.src = Menu_Ost.muted ? "./graphics_menu/keys_play.png" : "./graphics_menu/keys_mute.png";
}

const savedMuted = getCookie("musicMuted");
if (savedMuted !== null) {
  Menu_Ost.muted = savedMuted === "true";
}
applyMusicUiFromMuted();

function preloadImages(urls) {
  return Promise.all(
    urls.map(
      (u) =>
        new Promise((res) => {
          const im = new Image();
          im.onload = im.onerror = () => res();
          im.src = u;
        })
    )
  );
}

async function preloadFirstTwelveThumbnails() {
  if (!Array.isArray(window.images)) return;
  const thumbs = window.images.slice(0, 12).map((i) => i?.image3).filter(Boolean);
  await preloadImages(thumbs);
}

function isFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

function requestFullscreen(el) {
  const fn =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen;
  if (fn) fn.call(el);
}

function updateSplashCtaPosition() {
  splashBtn.style.bottom = isFullscreen() ? "16vh" : "12vh";
}

function showGalleryAfterDelay(delayMs) {
  setTimeout(() => {
    splashEl.classList.add("fade-out");
    setTimeout(() => {
      if (splashEl && splashEl.parentNode) splashEl.parentNode.removeChild(splashEl);
    }, 450);
    Menu_Ost.volume = 0.1;
  }, delayMs);
}

function wireSplash() {
  preloadFirstTwelveThumbnails();
  updateSplashCtaPosition();

  document.addEventListener("fullscreenchange", updateSplashCtaPosition);
  document.addEventListener("webkitfullscreenchange", updateSplashCtaPosition);
  document.addEventListener("mozfullscreenchange", updateSplashCtaPosition);
  document.addEventListener("MSFullscreenChange", updateSplashCtaPosition);

  function activateSplash() {
    svgDefault.style.display = "none";
    svgPressed.style.display = "block";
    document.body.style.overflow = "auto";
    Menu_Ost.volume = 0.3;
    try {
      Menu_Ost.play();
    } catch (_) {}
    try {
      if (splashSound) {
        splashSound.currentTime = 0;
        splashSound.play();
      }
    } catch (_) {}
    requestFullscreen(document.documentElement);
    updateSplashCtaPosition();
    showGalleryAfterDelay(2000);
  }

  splashBtn.addEventListener("click", activateSplash);

  document.addEventListener("keydown", (e) => {
    if (!splashEl) return;
    const splashVisible =
      document.body.contains(splashEl) && !splashEl.classList.contains("fade-out");
    if (!splashVisible) return;
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      activateSplash();
    }
  });
}

function buildGallery() {
  if (!Array.isArray(window.images)) return;

  window.images.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "thumb";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `Open set ${idx + 1}`);

    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = item.image3;
    img.alt = `Thumbnail ${idx + 1}`;

    card.appendChild(img);

    card.addEventListener("mouseenter", playMenuHoverSound);

    card.addEventListener("click", () => openSet(idx));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openSet(idx);
      }
    });

    galleryEl.appendChild(card);
  });
}

bar.addEventListener("mouseenter", playMenuHoverSound);

for (const menuitems of items) {
  menuitems.addEventListener("mouseenter", playMenuHoverSound);
}

bar.addEventListener("mouseenter", () => {
  setShadowCursorImage(true);
});

bar.addEventListener("mouseleave", () => {
  setShadowCursorImage(false);
});

function playMenuHoverSound() {
  try {
    const snd = Menu_Sound.cloneNode(true);
    snd.volume = Menu_Sound.volume;

    snd.addEventListener("ended", () => snd.remove());
    void snd.play();
  } catch (_) {}
}


function getSetByIndex(i) {
  const it = window.images[i];
  if (!it) return null;
  return { images: [it.image1, it.image2, it.image3] };
}

function preload(urls) {
  return Promise.all(
    urls.map(
      (u) =>
        new Promise((res) => {
          const im = new Image();
          im.onload = im.onerror = () => res();
          im.src = u;
        })
    )
  );
}

async function openSet(index) {
  const set = getSetByIndex(index);
  if (!set) return;

  currentSet = set;
  await preload(set.images);

  setLeftImage(0);
  setRightImage(1);

  percent = 1/3;

  viewerEl.classList.add("show");
  viewerEl.setAttribute("aria-hidden", "false");

  requestAnimationFrame(applyDivider);
}

function closeViewer() {
  viewerEl.classList.remove("show");
  viewerEl.setAttribute("aria-hidden", "true");
  currentSet = null;
}

function setLeftImage(i) {
  if (!currentSet) return;
  leftIndex = i;
  imgLeft.style.backgroundImage = `url("${currentSet.images[i]}")`;
  markActiveButtons("left", i);
}

function setRightImage(i) {
  if (!currentSet) return;
  rightIndex = i;
  imgRight.style.backgroundImage = `url("${currentSet.images[i]}")`;
  markActiveButtons("right", i);
}

function markActiveButtons(side, index) {
  const buttons = controls.querySelectorAll(side === "left" ? "[data-left]" : "[data-right]");
  buttons.forEach((btn) => {
    const isActive =
      Number(btn.getAttribute(side === "left" ? "data-left" : "data-right")) === index;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });
}

function applyDivider() {
  const rect = stage.getBoundingClientRect();
  const x = rect.left + percent * rect.width;
  const leftClip = Math.max(0, x - rect.left);
  imgRight.style.clipPath = `inset(0 0 0 ${leftClip}px)`;
  divider.style.left = `${x}px`;
}

function setPercentFromClientX(clientX) {
  const rect = stage.getBoundingClientRect();
  const x = Math.min(Math.max(clientX, rect.left), rect.right);
  percent = (x - rect.left) / rect.width;
  applyDivider();
}

function onPointerDown(e) {
  isPointerDown = true;
  setPercentFromClientX(e.clientX ?? e.touches?.[0]?.clientX ?? 0);
}

function onPointerMove(e) {
  if (!isPointerDown) return;
  const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
  setPercentFromClientX(clientX);
}

function onPointerUp() {
  isPointerDown = false;
}

function onKeyDown(e) {
  if (!viewerEl.classList.contains("show")) return;
  if (e.key === "ArrowLeft") {
    percent = Math.max(0, percent - 0.01);
    applyDivider();
  } else if (e.key === "ArrowRight") {
    percent = Math.min(1, percent + 0.01);
    applyDivider();
  } else if (e.key === "Escape") {
    closeViewer();
  }
}

controls.addEventListener("click", (e) => {
  if (!(e.target instanceof HTMLElement)) return;

  const button = e.target.closest("[data-left],[data-right]");
  if (!button) return;

  const leftAttr = button.getAttribute("data-left");
  const rightAttr = button.getAttribute("data-right");

  if (leftAttr !== null) {
    setLeftImage(Number(leftAttr));
  } else if (rightAttr !== null) {
    setRightImage(Number(rightAttr));
  }
});
stage.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  onPointerDown(e);
});
stage.addEventListener("mousemove", onPointerMove);
window.addEventListener("mouseup", onPointerUp);

stage.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    onPointerDown(e.touches[0]);
  },
  { passive: false }
);
stage.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    onPointerMove(e.touches[0]);
  },
  { passive: false }
);
stage.addEventListener("touchend", onPointerUp);
stage.addEventListener("touchcancel", onPointerUp);

function handleRightClick(e) {
  if (!viewerEl.classList.contains("show")) return;
  
  e.preventDefault();
  closeViewer();
}

document.addEventListener('contextmenu', handleRightClick);

window.addEventListener("keydown", onKeyDown);
window.addEventListener("resize", applyDivider);

function toggleMusicMute() {
  Menu_Ost.muted = !Menu_Ost.muted;
  setCookie("musicMuted", String(Menu_Ost.muted), 365);
  applyMusicUiFromMuted();

  if (!Menu_Ost.muted && Menu_Ost.paused) {
    try {
      Menu_Ost.play();
    } catch (_) {}
  }
}

window.addEventListener("keydown", (e) => {
  if (e.key === "m" || e.key === "M") {
    e.preventDefault();
    toggleMusicMute();
  }
});

const CURSOR_CENTER_WEIGHT = 1;
const MAX_OFFSET = 20;

const SHADOWS = [
  { id: "cursor-shadow-1", distanceFactor: 1.0, blurPx: 2, opacity: 0.30 },
  { id: "cursor-shadow-2", distanceFactor: 1.8, blurPx: 4, opacity: 0.20 },
];

const SHADOW_VIEWBOX_W = 60;
const SHADOW_VIEWBOX_H = 59;
const TIP_X = 0;
const TIP_Y = 0;

const SMOOTHING = 0.8;

(() => {
  const shadows = SHADOWS.map((s) => ({
    ...s,
    el: document.getElementById(s.id),
  })).filter((s) => s.el);

  if (!shadows.length) return;

  let targetX = 0;
  let targetY = 0;

  let x = 0;
  let y = 0;

  let vw = window.innerWidth;
  let vh = window.innerHeight;

  function getTipOffsetsPx(el) {
    const r = el.getBoundingClientRect();
    const tipPxX = (TIP_X / SHADOW_VIEWBOX_W) * r.width;
    const tipPxY = (TIP_Y / SHADOW_VIEWBOX_H) * r.height;
    return { x: tipPxX, y: tipPxY };
  }

  function centerVector(cx, cy) {
    const centerX = vw / 2;
    const centerY = vh / 2;
    const dx = (cx - centerX) * CURSOR_CENTER_WEIGHT;
    const dy = (cy - centerY) * CURSOR_CENTER_WEIGHT;
    const angle = Math.atan2(dy, dx);
    const nx = dx / (vw / 2);
    const ny = dy / (vh / 2);
    const distNorm = Math.min(Math.hypot(nx, ny), 1);
    return { angle, distNorm };
  }

  window.addEventListener("mousemove", (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  window.addEventListener("resize", () => {
    vw = window.innerWidth;
    vh = window.innerHeight;
  });

  const tipOffsets = new Map();
  function refreshTipOffsets() {
    for (const s of shadows) {
      tipOffsets.set(s.el, getTipOffsetsPx(s.el));
    }
  }
  refreshTipOffsets();
  let tipRefreshRaf = 0;
  const obs = new ResizeObserver(() => {
    cancelAnimationFrame(tipRefreshRaf);
    tipRefreshRaf = requestAnimationFrame(refreshTipOffsets);
  });
  for (const s of shadows) obs.observe(s.el);

  function tick() {
    x += (targetX - x) * SMOOTHING;
    y += (targetY - y) * SMOOTHING;

    const { angle, distNorm } = centerVector(x, y);
    const baseDist = distNorm * MAX_OFFSET;

    for (const s of shadows) {
      const dist = baseDist * s.distanceFactor;

      const tip = tipOffsets.get(s.el) || { x: 0, y: 0 };
      let sx = x + Math.cos(angle) * dist - tip.x;
      let sy = y + Math.sin(angle) * dist - tip.y;

      const opacity = s.opacity * (0.6 + 0.4 * distNorm);

      s.el.style.transform = `translate(${sx}px, ${sy}px)`;
      s.el.style.opacity = opacity.toFixed(3);

      const node = s.el.querySelector("img, svg");
      if (node) node.style.filter = `blur(${s.blurPx}px)`;
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();

function setShadowCursorImage(grab) {
  document.querySelectorAll(".cursor-shadow .shadow-img").forEach((img) => {
    img.src = grab ? "./cursor/cursor_grab.png" : "./cursor/cursor.png";
  });
}

(function () {
  if (!wrap || !gallery || !bar || !track || !thumb) return;

  let dragging = false;
  let dragStartY = 0;
  let thumbStartTop = 0;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function updateThumb() {
    const contentHeight = gallery.scrollHeight;
    const viewportHeight = gallery.clientHeight;

    if (contentHeight <= viewportHeight) {
      bar.style.visibility = "hidden";
      return;
    }
    bar.style.visibility = "visible";

    const trackHeight = track.clientHeight;
    const ratio = viewportHeight / contentHeight;
    const minThumb = 32;
    const thumbHeight = Math.max(Math.floor(trackHeight * ratio), minThumb);
    const maxThumbTop = trackHeight - thumbHeight;

    const scrollRatio = gallery.scrollTop / (contentHeight - viewportHeight);
    const thumbTop = Math.round(scrollRatio * maxThumbTop);

    thumb.style.height = thumbHeight + "px";
    thumb.style.top = thumbTop + "px";
  }

  function scrollFromThumbTop(newTop) {
    const trackHeight = track.clientHeight;
    const thumbHeight = thumb.clientHeight;
    const maxThumbTop = trackHeight - thumbHeight;

    const contentHeight = gallery.scrollHeight;
    const viewportHeight = gallery.clientHeight;
    const scrollMax = contentHeight - viewportHeight;

    const ratio = maxThumbTop > 0 ? newTop / maxThumbTop : 0;
    gallery.scrollTop = Math.round(scrollMax * ratio);
  }

  function onPointerDownThumb(e) {
    dragging = true;
    thumb.classList.add("dragging");
    dragStartY = (e.touches ? e.touches[0].clientY : e.clientY);
    thumbStartTop = parseFloat(getComputedStyle(thumb).top) || 0;
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const clientY = (e.touches ? e.touches[0].clientY : e.clientY);
    const dy = clientY - dragStartY;

    if (dragging) {
      galleryCon.style.cursor = "url(\"./cursor/cursor_grab.png\") 0 0, auto";
      setShadowCursorImage(true);
    }

    const trackHeight = track.clientHeight;
    const thumbHeight = thumb.clientHeight;
    const maxThumbTop = trackHeight - thumbHeight;

    const newTop = clamp(thumbStartTop + dy, 0, maxThumbTop);
    thumb.style.top = newTop + "px";
    scrollFromThumbTop(newTop);
  }

  function onPointerUp() {
    if (!dragging) return;
    dragging = false;
    thumb.classList.remove("dragging");
  }

  window.addEventListener("mouseup", () => {
    galleryCon.style.cursor = "url(\"./cursor/cursor.png\") 0 0, auto";
  });

  function onTrackMouseDown(e) {
    if (e.target === thumb) return;

    const rect = track.getBoundingClientRect();
    const clickY = e.clientY - rect.top;

    const trackHeight = track.clientHeight;
    const thumbHeight = thumb.clientHeight;
    const maxThumbTop = trackHeight - thumbHeight;

    const desiredTop = clamp(clickY - thumbHeight / 2, 0, maxThumbTop);

    thumb.style.top = desiredTop + "px";
    scrollFromThumbTop(desiredTop);

    dragging = true;
    thumb.classList.add("dragging");
    dragStartY = e.clientY;
    thumbStartTop = desiredTop;

    e.preventDefault();
  }

  function onGalleryScroll() {
    updateThumb();
  }

  const WHEEL_SCROLL_STEP = 40;

  function onWheelInsideGalleryContainer(e) {
    e.preventDefault();

    const delta = e.deltaY || 0;
    if (delta === 0) return;

    const newTop = gallery.scrollTop + Math.sign(delta) * WHEEL_SCROLL_STEP;
    const maxScroll = gallery.scrollHeight - gallery.clientHeight;

    gallery.scrollTop = Math.max(0, Math.min(maxScroll, newTop));

    updateThumb();
  }

  galleryCon.addEventListener("wheel", onWheelInsideGalleryContainer, { passive: false });
  
  thumb.addEventListener("mousedown", onPointerDownThumb);
  window.addEventListener("mousemove", onPointerMove);
  window.addEventListener("mouseup", onPointerUp);

  thumb.addEventListener("touchstart", onPointerDownThumb, { passive: false });
  window.addEventListener("touchmove", onPointerMove, { passive: false });
  window.addEventListener("touchend", onPointerUp);
  window.addEventListener("touchcancel", onPointerUp);

track.addEventListener("mousedown", (e) => {
  if (e.target === thumb) return;

  const rect = track.getBoundingClientRect();
  const clickY = e.clientY - rect.top;

  const trackHeight = track.clientHeight;
  const th = thumb.clientHeight;
  const maxTop = trackHeight - th;

  const desiredTop = Math.max(0, Math.min(maxTop, clickY - th / 2));
  thumb.style.top = desiredTop + "px";
  scrollFromThumbTop(desiredTop);

  dragging = true;
  thumb.classList.add("dragging");
  dragStartY = e.clientY;
  thumbStartTop = desiredTop;

  e.preventDefault();
});

  gallery.addEventListener("scroll", onGalleryScroll);
  window.addEventListener("resize", updateThumb);

  const ro = new ResizeObserver(updateThumb);
  ro.observe(gallery);

  requestAnimationFrame(updateThumb);
})();

function isEventInsideScrollbar(e) {
  if (!bar) return false;
  const target = e.target;
  return target instanceof Node && bar.contains(target);
}

window.addEventListener("mouseup", (e) => {
  galleryCon.style.cursor = 'url("./cursor/cursor.png") 0 0, auto';

  if (!isEventInsideScrollbar(e)) {
    setShadowCursorImage(false);
  }
});

(function () {
  function viewerIsVisible() {
    return window.getComputedStyle(viewer).display === "block";
  }

  function toggleHud() {
    const isHidden =
      keys.style.display === "none" &&
      controls.style.display === "none" &&
      divider.style.display === "none";

    if (isHidden) {
      keys.style.display = "";
      document.body.style.cursor = "";
      controls.style.display = "";
      divider.style.display = "";
    } else {
      keys.style.display = "none";
      document.body.style.cursor = 'none';
      controls.style.display = "none";
      divider.style.display = "none";
    }
  }

  function onKeyDown(e) {
    if (e.key === "h" || e.key === "H") {
      e.preventDefault();
      toggleHud();
    }
  }

  function syncListener() {
    const wantsListener = viewerIsVisible();
    const hasListener = syncListener._attached === true;

    if (wantsListener && !hasListener) {
      window.addEventListener("keydown", onKeyDown);
      syncListener._attached = true;
    } else if (!wantsListener && hasListener) {
      window.removeEventListener("keydown", onKeyDown);
      syncListener._attached = false;
    }
  }
  syncListener._attached = false;

  const ro = new ResizeObserver(syncListener);
  ro.observe(viewer);

  const mo = new MutationObserver(syncListener);
  mo.observe(viewer, { attributes: true, attributeFilter: ["class", "style", "aria-hidden"] });

  syncListener();
})();

const ICONS = {
  button: {
    unselected: "./graphics_menu/unselected_button.svg",
    hovered: "./graphics_menu/hovered_button.svg",
    selected: "./graphics_menu/selected_button.svg",
  },
  box: {
    unticked: "./graphics_menu/unticked_box.svg",
    hovered: "./graphics_menu/hovered_box.svg",
    ticked: "./graphics_menu/ticked_box.svg",
  },
};

// Initializes one menu container independently
function initMenu(containerId, startIndex = 0) {
  const menu = document.getElementById(containerId);
  const items = Array.from(menu.querySelectorAll(".menu-item"));
  let selectedIndex = Math.min(
    Math.max(startIndex, 0),
    Math.max(items.length - 1, 0)
  );

  items.forEach((item, idx) => {
    const isSelected = idx === selectedIndex;
    item.setAttribute("aria-selected", String(isSelected));
    renderItemState(item, { selected: isSelected, hovered: false });

    item.addEventListener("mouseenter", () =>
      onHoverChange(item, true)
    );
    item.addEventListener("mouseleave", () =>
      onHoverChange(item, false)
    );
    item.addEventListener("click", () => onClick(item));
  });

  function onHoverChange(item, hovered) {
    const idx = Number(item.dataset.index);
    const isSelected = idx === selectedIndex;
    renderItemState(item, { selected: isSelected, hovered });
  }

  function onClick(item) {
    const newIndex = Number(item.dataset.index);
    if (newIndex === selectedIndex) return;

    const prev = items[selectedIndex];
    prev.setAttribute("aria-selected", "false");
    renderItemState(prev, { selected: false, hovered: false });

    selectedIndex = newIndex;
    item.setAttribute("aria-selected", "true");
    const hovered = item.matches(":hover");
    renderItemState(item, { selected: true, hovered });
  }

  function renderItemState(item, { selected, hovered }) {
    const bg = hovered
      ? ICONS.button.hovered
      : selected
      ? ICONS.button.selected
      : ICONS.button.unselected;
    item.style.backgroundImage = `url("${bg}")`;

    const boxEl = item.querySelector(".box");
    const boxIcon = selected
      ? ICONS.box.ticked
      : hovered
      ? ICONS.box.hovered
      : ICONS.box.unticked;
    boxEl.style.backgroundImage = `url("${boxIcon}")`;

    const featureEl = item.querySelector(".feature");
    const blue = item.dataset.featureBlue;
    const red = item.dataset.featureRed;
    const featureIcon = selected || hovered ? blue : red;
    featureEl.style.backgroundImage = `url("${featureIcon}")`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".thumb").forEach((indexes) => {
    indexes.addEventListener("mouseenter", () => setShadowCursorImage(true));
    indexes.addEventListener("mouseleave", () => setShadowCursorImage(false));
  });
});

initMenu("menu-a", 0);
initMenu("menu-b", 1);

wireSplash();
buildGallery();