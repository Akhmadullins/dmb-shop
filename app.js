import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.86.0/+esm";

const CONTACT = "wshp.no1@gmail.com";
const DRAFT_KEY = "dmb-cal-draft";
const supabase = createClient(window.CAL_CONFIG.supabaseUrl, window.CAL_CONFIG.anonKey);
const app = document.querySelector("#app");
const templates = window.CALENDARS;

const draft = {
  templateId: null,
  screen: "catalog",
  name: "",
  callup: "",
  dembel: "",
  photos: {},
  city: "",
  address: "",
  phone: "",
  zoom: 165,
  pendingKind: null,
};

function templateById(id) {
  return templates.find((item) => item.id === id);
}

function baseAssetSrc(id) {
  const q = id === "v2-red" ? "?v=2" : "";
  return `assets/${id}-base.png${q}`;
}

const PROMO_UNTIL = Date.parse("2026-12-01T00:00:00+03:00");
const PROMO_PRICE = 349;
const REGULAR_PRICE = 549;
let promoTimerId = null;

function isPromoActive() {
  return Date.now() < PROMO_UNTIL;
}

function digitalPrice() {
  return isPromoActive() ? PROMO_PRICE : REGULAR_PRICE;
}

function promoMsLeft() {
  return Math.max(0, PROMO_UNTIL - Date.now());
}

function promoTimeParts() {
  let ms = promoMsLeft();
  const h = Math.floor(ms / 3600000);
  ms %= 3600000;
  const m = Math.floor(ms / 60000);
  ms %= 60000;
  const s = Math.floor(ms / 1000);
  return { h, m, s };
}

function promoClockHTML() {
  const { h, m, s } = promoTimeParts();
  const pad = (n) => String(n).padStart(2, "0");
  return `<span class="promo-digit">${h}</span> ч `
    + `<span class="promo-digit">${pad(m)}</span> м `
    + `<span class="promo-digit">${pad(s)}</span> с`;
}

function stopPromoTimer() {
  if (promoTimerId) clearInterval(promoTimerId);
  promoTimerId = null;
}

function startPromoTimer() {
  stopPromoTimer();
  const clockEl = document.querySelector("#promo-clock");
  if (!clockEl) return;
  const tick = () => {
    if (!isPromoActive()) {
      stopPromoTimer();
      renderPreview();
      return;
    }
    clockEl.innerHTML = promoClockHTML();
  };
  tick();
  promoTimerId = setInterval(tick, 1000);
}

function digitalPromoStripHTML() {
  if (!isPromoActive()) return "";
  return `<div class="price-promo-strip" id="price-promo">
    <p class="price-promo-sum"><strong>${PROMO_PRICE} ₽</strong> <span>за файл</span></p>
    <p class="price-promo-after">с&nbsp;1&nbsp;декабря&nbsp;— <strong>${REGULAR_PRICE} ₽</strong></p>
    <p class="price-promo-timer">до повышения: <span class="promo-clock" id="promo-clock">${promoClockHTML()}</span></p>
  </div>`;
}

function fieldsOf(template) {
  if (window.CAL_FIELDS[template.id]) return window.CAL_FIELDS[template.id];
  return window.CAL_FIELDS[template.group];
}

function ink(template) {
  return template.theme === "dark" ? "#ffffff" : "#B40000";
}

function show(html) {
  stopPromoTimer();
  app.innerHTML = html;
}

function saveLocal() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      templateId: draft.templateId,
      screen: draft.screen,
      name: draft.name,
      callup: draft.callup,
      dembel: draft.dembel,
      city: draft.city,
      address: draft.address,
      phone: draft.phone,
      zoom: draft.zoom,
      photos: draft.photos,
    }));
  } catch (e) {}
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    Object.assign(draft, data);
  } catch (e) {}
}

function photoZoom(photo) {
  return photo && photo.zoom ? photo.zoom : 1;
}

function photoStyle(photo) {
  const x = photo.x ?? 50;
  const y = photo.y ?? 50;
  const z = photoZoom(photo);
  return `object-position:${x}% ${y}%;transform:scale(${z});transform-origin:${x}% ${y}%;`;
}

function applyPhotoStyle(img, photo) {
  if (!img || !photo) return;
  img.style.cssText = photoStyle(photo);
}

function posterHTML(template, opts) {
  const photos = template.photos.map((slot) => {
    const photo = draft.photos[slot.id];
    const loading = photo && photo.loading;
    const bleed = template.theme === "dark"
      ? "position:absolute;left:-5%;top:-5%;width:110%;height:110%;max-width:none;"
      : "";
    const inner = photo && !loading
      ? `<img alt="" draggable="false" src="${photo.src}" style="${bleed}${photoStyle(photo)}">`
      : `<em>${loading ? "Загружаю…" : opts.interactive ? "Добавить фото" : ""}</em>`;
    const tag = opts.interactive ? "button" : "div";
    const busy = loading ? " busy" : "";
    const ready = photo && !loading && opts.interactive ? " ready" : "";
    return `<${tag} class="slot${busy}${ready}" data-slot="${slot.id}" type="button" style="left:${slot.x}%;top:${slot.y}%;width:${slot.w}%;height:${slot.h}%">${inner}</${tag}>`;
  }).join("");
  const texts = fieldsOf(template).map((field) => {
    const value = draft[field.id] || "";
    const shift = field.dy ? `transform:translateY(${field.dy}em);` : "";
    const size = field.scale ? `font-size:${(2.15 * field.scale).toFixed(2)}cqi;` : "";
    const weight = field.weight ? `font-weight:${field.weight};` : (field.bold ? "font-weight:700;" : "");
    const stroke = field.bold && !field.font ? "-webkit-text-stroke:0.028em currentColor;" : "";
    const family = field.font
      ? `font-family:"${field.font}",Helvetica,Arial,sans-serif;`
      : "";
  const baseSize = field.font ? 1.92 : 2.15;
    const fontSize = field.scale ? `font-size:${(baseSize * field.scale).toFixed(2)}cqi;` : (field.font ? `font-size:${baseSize}cqi;` : size);
    const sizeStyle = field.font ? fontSize : size;
    return `<div class="on-poster${field.font ? " on-date" : ""}" style="left:${field.x}%;top:${field.y}%;${shift}${sizeStyle}${weight}${stroke}${family}">${value}</div>`;
  }).join("");
  const wmClass = opts.watermark ? " wm-editor" : "";
  const mark = opts.watermark ? `<img class="wm${wmClass}" alt="" src="assets/watermark.png">` : "";
  return `<div class="poster ${template.theme}" data-id="${template.id}">
    ${photos}
    <img class="base" alt="" src="${baseAssetSrc(template.id)}">
    ${texts}
    ${mark}
  </div>`;
}

function checklistHTML(template) {
  const need = [
    { ok: Boolean(draft.name), text: "Имя" },
    { ok: Boolean(draft.callup), text: "Дата призыва" },
    { ok: Boolean(draft.dembel), text: "Дата дембеля" },
  ];
  if (template.photos.length) {
    template.photos.forEach((slot, index) => {
      need.push({ ok: Boolean(draft.photos[slot.id] && !draft.photos[slot.id].loading), text: "Фото " + (index + 1) });
    });
  }
  return `<ul class="steps">${need.map((item) => `<li class="${item.ok ? "done" : ""}">${item.text}</li>`).join("")}</ul>`;
}

function fieldsFormHTML(template) {
  return fieldsOf(template).map((field) => `
    <label>${field.label}
      <input data-field="${field.id}" placeholder="${field.placeholder}" value="${(draft[field.id] || "").replace(/"/g, "&quot;")}">
    </label>`).join("");
}

function bindFields() {
  app.querySelectorAll("[data-field]").forEach((input) => {
    input.addEventListener("input", () => {
      draft[input.dataset.field] = input.value;
      saveLocal();
      syncPosterText();
      syncChecklist();
    });
  });
}

function syncPosterText() {
  const template = templateById(draft.templateId);
  if (!template) return;
  const nodes = [...app.querySelectorAll(".on-poster")];
  fieldsOf(template).forEach((field, index) => {
    if (nodes[index]) nodes[index].textContent = draft[field.id] || "";
  });
}

function syncChecklist() {
  const template = templateById(draft.templateId);
  const list = app.querySelector(".steps");
  if (!list || !template) return;
  list.outerHTML = checklistHTML(template);
  const look = document.querySelector("#look");
  if (look) look.disabled = !editorReady(template);
}

function bindPoster(template) {
  app.querySelectorAll("[data-slot]").forEach((slotEl) => {
    const slotId = slotEl.dataset.slot;
    const photo = draft.photos[slotId];
    if (!photo || photo.loading) {
      slotEl.addEventListener("click", () => pickPhoto(template, slotId));
      return;
    }
    bindSlotAdjust(slotEl, slotId, template);
  });
}

function bindSlotAdjust(slotEl, slotId, template) {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const photo = () => draft.photos[slotId];
  const img = slotEl.querySelector("img");
  let dragging = false;
  let pinchActive = false;
  let startX = 0;
  let startY = 0;
  let startPhotoX = 0;
  let startPhotoY = 0;
  let pinchStartDist = 0;
  let pinchStartZoom = 1;
  const pointers = new Map();
  let lastTap = 0;
  let didDrag = false;

  const sync = () => {
    applyPhotoStyle(img, photo());
    saveLocal();
  };

  slotEl.addEventListener("click", (event) => {
    if (dragging || didDrag) {
      event.preventDefault();
      didDrag = false;
      return;
    }
    const now = Date.now();
    if (now - lastTap < 380) {
      event.preventDefault();
      pickPhoto(template, slotId);
      return;
    }
    lastTap = now;
  });

  slotEl.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      const current = photo();
      if (!current) return;
      const factor = 1 - event.deltaY * 0.002;
      current.zoom = clamp(photoZoom(current) * factor, 1, 3.2);
      sync();
    },
    { passive: false }
  );

  const pointerDistance = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  slotEl.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointers.set(event.pointerId, event);
    slotEl.setPointerCapture(event.pointerId);

    if (pointers.size === 2) {
      pinchActive = true;
      dragging = false;
      const [a, b] = [...pointers.values()];
      pinchStartDist = pointerDistance(a, b);
      pinchStartZoom = photoZoom(photo());
      slotEl.classList.add("adjusting");
      return;
    }

    if (pointers.size === 1) {
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      const current = photo();
      startPhotoX = current.x ?? 50;
      startPhotoY = current.y ?? 50;
      slotEl.classList.add("adjusting");
    }
  });

  slotEl.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, event);
    const current = photo();
    if (!current) return;

    if (pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const dist = pointerDistance(a, b);
      if (pinchStartDist > 0) {
        current.zoom = clamp(pinchStartZoom * (dist / pinchStartDist), 1, 3.2);
        sync();
      }
      return;
    }

    if (!dragging) return;
    const rect = slotEl.getBoundingClientRect();
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag = true;
    current.x = clamp(startPhotoX - (dx / rect.width) * 40, 0, 100);
    current.y = clamp(startPhotoY - (dy / rect.height) * 40, 0, 100);
    sync();
  });

  const endPointer = (event) => {
    pointers.delete(event.pointerId);
    try {
      slotEl.releasePointerCapture(event.pointerId);
    } catch (e) {}

    if (pointers.size === 1) {
      const remaining = [...pointers.values()][0];
      dragging = true;
      pinchActive = false;
      startX = remaining.clientX;
      startY = remaining.clientY;
      const current = photo();
      startPhotoX = current.x ?? 50;
      startPhotoY = current.y ?? 50;
      return;
    }

    if (pointers.size === 0) {
      setTimeout(() => {
        dragging = false;
      }, 0);
      pinchActive = false;
      slotEl.classList.remove("adjusting");
    }
  };

  slotEl.addEventListener("pointerup", endPointer);
  slotEl.addEventListener("pointercancel", endPointer);
}

function pickPhoto(template, slotId) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file) return;
    draft.photos[slotId] = { loading: true };
    saveLocal();
    renderEditor();
    const reader = new FileReader();
    reader.onload = () => {
      draft.photos[slotId] = { src: reader.result, x: 50, y: 50, zoom: 1 };
      saveLocal();
      renderEditor();
    };
    reader.onerror = () => {
      delete draft.photos[slotId];
      saveLocal();
      renderEditor();
    };
    reader.readAsDataURL(file);
  });
  input.click();
}

function renderCatalog() {
  draft.screen = "catalog";
  saveLocal();
  const groups = [["variant1", "Вариант 1"], ["variant2", "Вариант 2"]];
  const rows = groups.map(([group, title]) => {
    const cards = templates.filter((item) => item.group === group).map((item) => `
      <button class="card" data-open="${item.id}">
        <img alt="${item.title}" src="assets/${item.id}-preview.jpg">
        <span>${item.title}</span>
      </button>`).join("");
    return `<section class="group"><h2>${title}</h2><div class="row">${cards}</div></section>`;
  }).join("");
  show(`<div class="wrap">${rows}<section class="group"><h2>Другие</h2><p class="soon">Следующие листы добавим следом.</p></section></div>`);
  app.querySelectorAll("[data-open]").forEach((card) => {
    card.addEventListener("click", () => {
      draft.templateId = card.dataset.open;
      draft.photos = {};
      saveLocal();
      renderEditor();
    });
  });
}

function editorReady(template) {
  const missingPhoto = template.photos.some((slot) => !draft.photos[slot.id] || draft.photos[slot.id].loading);
  return draft.name && draft.callup && draft.dembel && !missingPhoto;
}

function renderEditor() {
  const template = templateById(draft.templateId);
  if (!template) return renderCatalog();
  draft.screen = "editor";
  saveLocal();
  show(`<section class="editor">
    ${checklistHTML(template)}
    <p class="hint">${template.hint || "Заполни поля ниже. На листе видно, как это ляжет. Знак на листе — только для предпросмотра."}${template.photos.length ? " Фото в рамке: тяни — сдвиг, щипок или колёсико — крупнее, двойной тап — заменить." : ""}</p>
    ${posterHTML(template, { interactive: true, watermark: true })}
  <div class="field-form">${fieldsFormHTML(template)}</div>
    <div class="actions">
      <button class="go" id="look" type="button" ${editorReady(template) ? "" : "disabled"}>Посмотреть крупно</button>
    </div>
    <p class="err" id="err"></p>
  </section>`);
  bindPoster(template);
  bindFields();
  document.querySelector("#look").addEventListener("click", () => {
    const err = document.querySelector("#err");
    if (!editorReady(template)) {
      err.textContent = "Сначала отметь всё в списке выше.";
      return;
    }
    history.pushState({ dmbPreview: true }, "");
    renderPreview();
  });
}

function renderPreview() {
  draft.screen = "preview";
  saveLocal();
  const template = templateById(draft.templateId);
  show(`<section class="preview">
    <p class="zoom-hint">Щипок, колёсико или двойной тап — приближение. Тяни лист — сдвиг и загиб сверху.</p>
    <div class="zoom" id="zoom">
      <div class="zoom-stage" id="zoom-stage">
        <div class="zoom-card" id="zoom-card">
          <div class="paper-fold-shadow" id="paper-shadow" aria-hidden="true"></div>
          <div class="zoom-sheet" id="zoom-sheet">
            <div class="paper-curl" id="paper-curl" aria-hidden="true">
              <div class="paper-curl-surface"></div>
              <div class="paper-curl-underside"></div>
            </div>
            <div class="fold-veil" id="fold-veil" aria-hidden="true"></div>
            ${posterHTML(template, { interactive: false, watermark: true })}
          </div>
        </div>
      </div>
    </div>
    ${digitalPromoStripHTML()}
    <div class="actions">
      <button class="go" id="file" type="button">Скачать без водяного знака · ${digitalPrice()} ₽</button>
      <button class="ghost" id="print" type="button">Заказать печать A2 · 1199 ₽</button>
    </div>
    <p class="price-note">После оплаты файл скачивается в кабинете (PNG под печать A2, не PDF). Чек ЮKassa придёт на почту, если в магазине включены чеки. Вопросы: <a href="mailto:${CONTACT}">${CONTACT}</a></p>
  </section>`);
  document.querySelector("#file").addEventListener("click", () => startPay("digital"));
  document.querySelector("#print").addEventListener("click", () => askAddress());
  try {
    bindPreviewCard();
  } catch (err) {
    console.error("preview gestures", err);
  }
  if (isPromoActive()) startPromoTimer();
}

function bindPreviewCard() {
  const viewport = document.querySelector("#zoom");
  const stage = document.querySelector("#zoom-stage");
  const card = document.querySelector("#zoom-card");
  const sheet = document.querySelector("#zoom-sheet");
  const curl = document.querySelector("#paper-curl");
  const shadow = document.querySelector("#paper-shadow");
  if (!viewport || !stage || !card || !sheet) return;

  const poster = sheet.querySelector(".poster");
  const veil = document.querySelector("#fold-veil");
  const baseImg = sheet.querySelector(".base");
  const curlFace = curl && curl.querySelector(".paper-curl-surface");
  if (baseImg && curlFace && !curlFace.querySelector(".paper-curl-photo")) {
    const curlPhoto = baseImg.cloneNode();
    curlPhoto.className = "paper-curl-photo";
    curlPhoto.alt = "";
    curlFace.prepend(curlPhoto);
  }

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function clampScale(next) {
    return clamp(next, 0.85, 3.6);
  }

  let panX = 0;
  let panY = 0;
  let scale = clampScale(Math.max(1.15, (draft.zoom || 135) / 100));
  let panning = false;
  let pinchActive = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let startPanX = 0;
  let startPanY = 0;
  let pinchStartDist = 0;
  let pinchStartScale = scale;
  let lastTap = 0;
  const pointers = new Map();

  function pointerDistance(a, b) {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function touchDistance(touches) {
    return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
  }

  function clampPan() {
    const box = stage.getBoundingClientRect();
    const w = card.offsetWidth * scale;
    const h = card.offsetHeight * scale;
    const maxX = Math.max(40, (w - box.width) * 0.55 + 36);
    const maxY = Math.max(40, (h - box.height) * 0.55 + 36);
    panX = clamp(panX, -maxX, maxX);
    panY = clamp(panY, -maxY, maxY);
  }

  function saveScale() {
    draft.zoom = Math.round(scale * 100);
    saveLocal();
  }

  function foldFromDrag(dx, dy) {
    const pull = Math.hypot(dx, dy);
    const strength = clamp(pull / 140, 0, 1);
    const corner = clamp(dx / 90, -1, 1);
    const foldDeg = strength * 68;
    let originX = "50%";
    let twist = 0;
    if (strength > 0.38) {
      originX = corner < 0 ? "6%" : "94%";
      twist = corner * strength * 22;
    } else if (strength > 0.12) {
      originX = `${50 + corner * 18}%`;
      twist = corner * strength * 8;
    }
    return {
      strength,
      foldDeg,
      twist,
      originX,
      tiltX: clamp(-dy * 0.035, -10, 10),
      tiltY: clamp(dx * 0.04, -12, 12),
    };
  }

  function paintFold({ strength, foldDeg, twist, originX, tiltX, tiltY, animate }) {
    const ease = animate ? "0.45s cubic-bezier(0.22, 1, 0.36, 1)" : "none";
    sheet.style.transition = animate ? `transform ${ease}` : "none";
    sheet.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${scale}) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

    if (curl) {
      curl.style.transition = animate ? `transform ${ease}, opacity 0.35s` : "none";
      curl.style.transformOrigin = `${originX} 100%`;
      curl.style.transform = `rotateX(${-foldDeg}deg) rotateZ(${twist}deg)`;
      curl.style.opacity = strength > 0.04 ? String(0.35 + strength * 0.65) : "0";
    }
    const folding = strength > 0.05;
    card.classList.toggle("is-folded", folding);
    sheet.classList.toggle("is-folded", folding);
    if (poster) {
      poster.style.clipPath = folding ? "inset(27% 0 0 0)" : "none";
    }
    if (veil) {
      veil.style.opacity = folding ? String(Math.min(1, strength * 1.35)) : "0";
    }
    if (shadow) {
      shadow.style.opacity = "0";
    }
  }

  function paintFlat(animate) {
    paintFold({
      strength: 0,
      foldDeg: 0,
      twist: 0,
      originX: "50%",
      tiltX: 0,
      tiltY: 0,
      animate,
    });
  }

  function beginPinch() {
    const pts = [...pointers.values()];
    if (pts.length < 2) return;
    pinchActive = true;
    panning = false;
    pinchStartDist = pointerDistance(pts[0], pts[1]);
    pinchStartScale = scale;
    card.classList.add("pinching");
  }

  paintFlat(false);
  saveScale();

  const onWheel = (event) => {
    event.preventDefault();
    const factor = 1 - event.deltaY * 0.0022;
    scale = clampScale(scale * factor);
    clampPan();
    paintFlat(false);
    saveScale();
  };

  viewport.addEventListener("wheel", onWheel, { passive: false });
  stage.addEventListener("wheel", onWheel, { passive: false });

  stage.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointers.set(event.pointerId, event);
    stage.setPointerCapture(event.pointerId);

    if (pointers.size >= 2) {
      beginPinch();
      return;
    }

    const now = Date.now();
    if (event.pointerType === "touch" && now - lastTap < 320) {
      scale = scale < 1.6 ? 2.15 : 1.15;
      clampPan();
      paintFlat(true);
      saveScale();
      lastTap = 0;
      return;
    }
    lastTap = now;

    panning = true;
    pinchActive = false;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    startPanX = panX;
    startPanY = panY;
    card.classList.add("dragging");
    paintFlat(false);
  });

  stage.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, event);

    if (pointers.size >= 2) {
      if (!pinchActive) beginPinch();
      const [a, b] = [...pointers.values()];
      const dist = pointerDistance(a, b);
      if (pinchStartDist > 0) {
        scale = clampScale(pinchStartScale * (dist / pinchStartDist));
      }
      clampPan();
      paintFlat(false);
      saveScale();
      return;
    }

    if (!panning) return;
    const dx = event.clientX - dragStartX;
    const dy = event.clientY - dragStartY;
    panX = startPanX + dx;
    panY = startPanY + dy;
    paintFold({ ...foldFromDrag(dx, dy), animate: false });
  });

  const endPointer = (event) => {
    pointers.delete(event.pointerId);
    try {
      stage.releasePointerCapture(event.pointerId);
    } catch (e) {}

    if (pointers.size === 1) {
      const remaining = [...pointers.values()][0];
      panning = true;
      pinchActive = false;
      dragStartX = remaining.clientX;
      dragStartY = remaining.clientY;
      startPanX = panX;
      startPanY = panY;
      card.classList.remove("pinching");
      pinchStartDist = 0;
      return;
    }

    if (pointers.size === 0) {
      panning = false;
      pinchActive = false;
      card.classList.remove("dragging", "pinching");
      clampPan();
      paintFlat(true);
      saveScale();
    }
  };

  stage.addEventListener("pointerup", endPointer);
  stage.addEventListener("pointercancel", endPointer);

  viewport.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length === 2) {
        pinchActive = true;
        panning = false;
        pinchStartDist = touchDistance(event.touches);
        pinchStartScale = scale;
      }
    },
    { passive: true }
  );

  viewport.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches.length === 2) {
        event.preventDefault();
        if (!pinchStartDist) {
          pinchStartDist = touchDistance(event.touches);
          pinchStartScale = scale;
        }
        const dist = touchDistance(event.touches);
        scale = clampScale(pinchStartScale * (dist / pinchStartDist));
        clampPan();
        paintFlat(false);
        saveScale();
        return;
      }
      if (event.touches.length === 1 && panning) {
        event.preventDefault();
        const touch = event.touches[0];
        const dx = touch.clientX - dragStartX;
        const dy = touch.clientY - dragStartY;
        panX = startPanX + dx;
        panY = startPanY + dy;
        paintFold({ ...foldFromDrag(dx, dy), animate: false });
      }
    },
    { passive: false }
  );

  viewport.addEventListener("touchend", (event) => {
    if (event.touches.length < 2) {
      pinchStartDist = 0;
      pinchActive = false;
    }
    if (event.touches.length === 0) {
      panning = false;
      card.classList.remove("dragging", "pinching");
      clampPan();
      paintFlat(true);
      saveScale();
    }
  });
}

function askAddress() {
  draft.screen = "address";
  saveLocal();
  show(`<section class="sheet">
    <h2>Куда везти A2</h2>
    <label>Город<input id="city" value="${draft.city}"></label>
    <label>Адрес<textarea id="address" rows="3">${draft.address}</textarea></label>
    <label>Телефон<input id="phone" value="${draft.phone}" inputmode="tel"></label>
    <div class="actions">
      <button class="go" id="ship" type="button">Дальше к оплате · 1199 ₽</button>
      <button class="ghost" id="back" type="button">Назад</button>
    </div>
    <p class="err" id="err"></p>
    <p class="price-note">1199 ₽ — печать. Доставку посчитаем и напишем на твою почту. Я вижу заказ в базе и связываюсь сам, если нужно уточнить адрес.</p>
  </section>`);
  document.querySelector("#back").addEventListener("click", renderPreview);
  document.querySelector("#ship").addEventListener("click", () => {
    draft.city = document.querySelector("#city").value.trim();
    draft.address = document.querySelector("#address").value.trim();
    draft.phone = document.querySelector("#phone").value.trim();
    saveLocal();
    if (!draft.city || !draft.address || !draft.phone) {
      document.querySelector("#err").textContent = "Нужны город, адрес и телефон.";
      return;
    }
    startPay("print");
  });
}

async function startPay(kind) {
  draft.pendingKind = kind;
  draft.screen = "auth";
  saveLocal();
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    renderAuth(false);
    return;
  }
  showPayPending(kind);
  await createAndPay(kind, session.data.session);
}

function payTitle(kind) {
  if (kind === "print") return "печать A2 · 1199 ₽";
  return `файл · ${digitalPrice()} ₽`;
}

function showPayPending(kind) {
  show(`<section class="sheet">
    <h2>Оплата</h2>
    <p class="hint">Аккаунт есть. Открываем ЮKassa: ${payTitle(kind)}.</p>
    <p class="hint">Если окно не открылось, отключи блокировщик всплывающих окон.</p>
  </section>`);
}

let authEmail = "";

function renderAuth(otpStep) {
  const forPay = Boolean(draft.pendingKind);
  const payNote = forPay
    ? `<p class="hint">Сначала короткая регистрация по почте (отдельного пароля нет). После подтверждения сразу откроется ЮKassa: <strong>${payTitle(draft.pendingKind)}</strong>.</p>`
    : `<p class="hint">Пришлём письмо для входа в кабинет с заказами.</p>`;
  const backPay = forPay
    ? `<div class="actions"><button class="ghost" id="back-preview" type="button">Назад к листу</button></div>`
  : "";

  if (!otpStep) {
    show(`<section class="sheet">
      <h2>${forPay ? "Регистрация перед оплатой" : "Вход"}</h2>
      ${payNote}
      <label>Почта<input id="email" type="email" autocomplete="email" value="${authEmail}"></label>
      <div class="actions">
        <button class="go" id="send-code" type="button">${forPay ? "Зарегистрироваться и продолжить" : "Получить код"}</button>
      </div>
      ${backPay}
      <p class="err" id="err"></p>
    </section>`);
    document.querySelector("#send-code").addEventListener("click", sendAuthCode);
    const back = document.querySelector("#back-preview");
    if (back) back.addEventListener("click", renderPreview);
    return;
  }
  show(`<section class="sheet">
    <h2>${forPay ? "Подтверди почту" : "Код из письма"}</h2>
    <p class="hint">Отправили на ${authEmail}. ${forPay ? "После подтверждения сразу откроем ЮKassa." : ""} Если в письме только ссылка Sign in — нажми её, вернёшься на сайт${forPay ? " и оплата продолжится" : ""}. Если есть цифры — введи ниже. Загляни в «Спам», если письма нет.</p>
    <label>Код<input id="otp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="8"></label>
    <div class="actions">
      <button class="go" id="verify-code" type="button">${forPay ? "Подтвердить и перейти к оплате" : "Войти в кабинет"}</button>
      <button class="ghost" id="resend" type="button">Отправить письмо снова</button>
    </div>
    ${backPay}
    <p class="err" id="err"></p>
  </section>`);
  document.querySelector("#verify-code").addEventListener("click", verifyAuthCode);
  document.querySelector("#resend").addEventListener("click", sendAuthCode);
  const back = document.querySelector("#back-preview");
  if (back) back.addEventListener("click", renderPreview);
}

async function sendAuthCode() {
  const emailInput = document.querySelector("#email");
  const err = document.querySelector("#err");
  const email = (emailInput ? emailInput.value : authEmail).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    err.textContent = "Нужна почта.";
    return;
  }
  authEmail = email;
  const button = document.querySelector("#send-code") || document.querySelector("#resend");
  if (button) button.disabled = true;
  err.textContent = "Отправляем код.";
  const sent = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: window.CAL_CONFIG.authRedirect,
    },
  });
  if (button) button.disabled = false;
  if (sent.error) {
    err.textContent = sent.error.message;
    return;
  }
  renderAuth(true);
}

async function verifyAuthCode() {
  const err = document.querySelector("#err");
  const token = document.querySelector("#otp").value.trim().replace(/\s+/g, "");
  if (!token) {
    err.textContent = "Введи код из письма.";
    return;
  }
  const auth = await supabase.auth.verifyOtp({
    email: authEmail,
    token,
    type: "email",
  });
  if (auth.error || !auth.data.session) {
    err.textContent = auth.error ? auth.error.message : "Код не подошёл.";
    return;
  }
  if (draft.pendingKind) {
    showPayPending(draft.pendingKind);
    await createAndPay(draft.pendingKind, auth.data.session);
    return;
  }
  await renderCabinet();
}

async function createAndPay(kind, session) {
  const template = templateById(draft.templateId);
  const inserted = await supabase.from("calendar_orders").insert({
    user_id: session.user.id,
    email: session.user.email,
    template_id: template.id,
    kind,
    amount: kind === "print" ? 1199 : digitalPrice(),
    status: "pending",
    person_name: draft.name,
    callup: draft.callup,
    dembel: draft.dembel,
    city: draft.city,
    address: draft.address,
    phone: draft.phone,
  }).select("id").single();
  if (inserted.error) {
    show(`<section class="sheet"><p class="err">${inserted.error.message}</p></section>`);
    return;
  }
  await saveDraft(inserted.data.id);
  const response = await fetch(window.CAL_CONFIG.supabaseUrl + "/functions/v1/create-calendar-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: window.CAL_CONFIG.anonKey,
      Authorization: "Bearer " + session.access_token,
    },
    body: JSON.stringify({ orderId: inserted.data.id }),
  });
  const data = await response.json();
  if (!response.ok || !data.confirmation_url) {
    show(`<section class="sheet"><p class="err">${data.message || "Оплата не открылась"}</p></section>`);
    return;
  }
  draft.pendingKind = null;
  saveLocal();
  location.href = data.confirmation_url;
}

function db() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("dmb-cal", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveDraft(orderId) {
  const database = await db();
  await new Promise((resolve, reject) => {
    const tx = database.transaction("drafts", "readwrite");
    tx.objectStore("drafts").put({ ...draft }, orderId);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function loadDraft(orderId) {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction("drafts", "readonly");
    const request = tx.objectStore("drafts").get(orderId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function renderFile(order) {
  const saved = await loadDraft(order.id);
  if (saved) Object.assign(draft, saved);
  const template = templateById(order.template_id || draft.templateId);
  const base = new Image();
  base.src = baseAssetSrc(template.id);
  await base.decode();
  const width = 3200;
  const height = Math.round(width * base.height / base.width);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  for (const slot of template.photos) {
    const photo = draft.photos[slot.id];
    if (!photo || photo.loading) continue;
    const image = new Image();
    image.src = photo.src;
    await image.decode();
    const pad = template.id === "v2-red" ? 0.022 : 0;
    let dx = slot.x / 100 * width;
    let dy = slot.y / 100 * height;
    let dw = slot.w / 100 * width;
    let dh = slot.h / 100 * height;
    dx -= dw * pad;
    dy -= dh * pad;
    dw *= 1 + pad * 2;
    dh *= 1 + pad * 2;
    const corner = template.id === "v2-red" ? dw * 0.041 : dw * 0.03;
    ctx.save();
    roundRect(ctx, dx, dy, dw, dh, corner);
    ctx.clip();
    const scale = Math.max(dw / image.width, dh / image.height) * photoZoom(photo);
    const sw = dw / scale;
    const sh = dh / scale;
    const sx = (image.width - sw) * (photo.x / 100);
    const sy = (image.height - sh) * (photo.y / 100);
    ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.restore();
  }
  ctx.drawImage(base, 0, 0, width, height);
  await document.fonts.load('40px "Jar Binks"');
  await document.fonts.load('40px "Helvetica Neue"');
  const baseFontPx = width * 0.018;
  const dateBasePx = width * 0.0162;
  ctx.textBaseline = "top";
  for (const field of fieldsOf(template)) {
    const fontPx = (field.font ? dateBasePx : baseFontPx) * (field.scale || 1);
    const text = draft[field.id] || "";
    const x = field.x / 100 * width;
    const y = field.y / 100 * height + (field.dy || 0) * fontPx;
    const family = field.font ? `"${field.font}",Helvetica,Arial,sans-serif` : '"Jar Binks"';
    const sansBold = field.font && (field.weight >= 600 || field.bold);
    ctx.font = `${sansBold ? "bold " : ""}${fontPx}px ${family}`;
    ctx.fillStyle = ink(template);
    if (field.bold && !field.font) {
      ctx.lineWidth = fontPx * 0.045;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.strokeText(text, x, y);
    }
    ctx.fillText(text, x, y);
  }
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "kto-lyubit-tot-zhdet.png";
  link.click();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function paidMessage(order) {
  if (order.kind === "print") {
    return `Печать A2 оплачена. Мы напишем на ${order.email} по доставке. Вопросы: ${CONTACT}`;
  }
  return `Файл готов. Нажми «Скачать» — это PNG без знака, под печать A2. Чек ЮKassa уйдёт на ${order.email}.`;
}

async function renderCabinet() {
  draft.pendingKind = null;
  draft.screen = "cabinet";
  saveLocal();
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    renderAuth(false);
    return;
  }
  const orders = await supabase.from("calendar_orders").select("*").order("created_at", { ascending: false });
  const cards = (orders.data || []).map((order) => {
    const template = templateById(order.template_id);
    const paid = order.status === "paid";
    const file = paid && order.kind === "digital"
      ? `<button class="ghost" data-file="${order.id}" type="button">Скачать файл</button>`
      : "";
  const note = paid ? `<p class="hint">${paidMessage(order)}</p>` : "";
    return `<article>
      <strong>${template ? template.title : order.template_id}</strong>
      <p>${order.kind === "print" ? "Печать A2" : "Файл"} · ${order.amount} ₽ · ${paid ? "оплачен" : "ждёт оплату"}</p>
      <p>${order.person_name || ""} · ${order.callup || ""} – ${order.dembel || ""}</p>
      ${order.address ? `<p>${order.city}, ${order.address}, ${order.phone}</p>` : ""}
      ${note}
      ${file}
    </article>`;
  }).join("") || `<p class="hint">Заказов пока нет.</p>`;
  show(`<section class="orders"><h2>Кабинет</h2>
    <p class="contact">Почта для связи: <a href="mailto:${CONTACT}">${CONTACT}</a></p>
    ${cards}
    <div class="actions"><button class="go" id="more" type="button">Сделать ещё один</button></div>
  </section>`);
  document.querySelector("#more").addEventListener("click", () => {
    draft.templateId = null;
    draft.photos = {};
    renderCatalog();
  });
  app.querySelectorAll("[data-file]").forEach((button) => {
    button.addEventListener("click", async () => {
      const order = (orders.data || []).find((item) => item.id === button.dataset.file);
      await renderFile(order);
    });
  });
}

async function resume(orderId) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const order = await supabase.from("calendar_orders").select("*").eq("id", orderId).maybeSingle();
    if (order.data && order.data.status === "paid") {
      if (order.data.kind === "digital") {
        show(`<section class="sheet"><p class="hint">${paidMessage(order.data)}</p><button class="go" id="dl" type="button">Скачать файл</button><button class="ghost" id="cab" type="button">В кабинет</button></section>`);
        document.querySelector("#dl").addEventListener("click", () => renderFile(order.data));
        document.querySelector("#cab").addEventListener("click", renderCabinet);
        return;
      }
      show(`<section class="sheet"><p class="hint">${paidMessage(order.data)}</p><button class="go" id="cab" type="button">В кабинет</button></section>`);
      document.querySelector("#cab").addEventListener("click", renderCabinet);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  show(`<section class="sheet"><p class="hint">Оплата пока не видна. Если деньги списались, открой кабинет через минуту.</p><button class="go" id="cab" type="button">Кабинет</button></section>`);
  document.querySelector("#cab").addEventListener("click", renderCabinet);
}

async function resumeAfterMagicLink() {
  if (!location.hash.includes("access_token")) return false;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return false;
  history.replaceState(null, "", location.pathname + location.search);
  if (draft.pendingKind) {
    const kind = draft.pendingKind;
    showPayPending(kind);
    await createAndPay(kind, data.session);
    return true;
  }
  await renderCabinet();
  return true;
}

async function boot() {
  loadLocal();
  await supabase.auth.getSession();
  if (await resumeAfterMagicLink()) return;
  const returned = new URLSearchParams(location.search).get("order");
  if (returned) {
    history.replaceState(null, "", location.pathname);
    resume(returned);
    return;
  }
  if (draft.templateId && draft.screen === "preview") renderPreview();
  else if (draft.templateId && draft.screen === "address") askAddress();
  else if (draft.templateId) renderEditor();
  else renderCatalog();
}

document.querySelector("#home").addEventListener("click", renderCatalog);
document.querySelector("#cabinet").addEventListener("click", renderCabinet);
window.addEventListener("popstate", () => {
  if (draft.templateId && draft.screen === "preview") renderEditor();
});
boot();