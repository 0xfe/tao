const $ = (selector) => document.querySelector(selector);
const chapters = [...document.querySelectorAll(".chapter")];
const links = [...document.querySelectorAll(".index-link")];
const dialog = $("#chapter-index");
const search = $("#chapter-search");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* Reading works without storage. */
    }
  },
};
let active = 0;
let jumpTarget = null;
let jumpTimer;
let frame;
let lastPosition = -1;
const motionOff = () => reducedMotion.matches;
const behavior = () => (motionOff() ? "instant" : "smooth");
const initialHash = location.hash;
const saved = Number(storage.get("tao-chapter"));
if (saved > 1 && saved <= 81) {
  const resume = $(".resume");
  resume.hidden = false;
  resume.href = `#chapter-${String(saved).padStart(2, "0")}`;
  resume.textContent = `Continue · Chapter ${saved}`;
}
function updateActive(number) {
  if (number === active && lastPosition !== -1) return;
  active = number;
  $("#current-chapter").textContent = number
    ? `Chapter ${number} of 81`
    : "81 chapters";
  $("#previous").disabled = number <= 1;
  $("#next").disabled = number === 81;
  $(".reading-progress").setAttribute("aria-valuenow", number);
  $(".reading-progress span").style.transform = `scaleX(${number / 81})`;
  links.forEach((link, i) => {
    if (i + 1 === number) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
  if (number) storage.set("tao-chapter", number);
}
function measure() {
  frame = null;
  if (jumpTarget) return;
  const threshold = Math.min(innerHeight * 0.25, 180);
  let number = 0;
  // All chapter positions are laid out up front so distant anchors are stable.
  for (const chapter of chapters) {
    if (chapter.getBoundingClientRect().top <= threshold)
      number = Number(chapter.dataset.number);
    else break;
  }
  updateActive(number);
  if (scrollY !== lastPosition) {
    const hash = number ? `#${chapters[number - 1].id}` : "";
    if (location.hash !== hash)
      history.replaceState(
        null,
        "",
        location.pathname + location.search + hash,
      );
  }
  lastPosition = scrollY;
}
function scheduleMeasure() {
  if (!frame) frame = requestAnimationFrame(measure);
}
function finishJump() {
  jumpTarget = null;
  clearTimeout(jumpTimer);
  scheduleMeasure();
}
function jump(hash, push = true) {
  const target = document.getElementById(hash.replace(/^#/, ""));
  if (!target) return;
  if (dialog.open) dialog.close();
  jumpTarget = target;
  clearTimeout(jumpTimer);
  if (push && location.hash !== hash) history.pushState(null, "", hash);
  const heading =
    target.id === "top" ? $("#book-title") : target.querySelector("h2");
  heading?.focus({ preventScroll: true });
  const distant =
    Math.abs(target.getBoundingClientRect().top) > innerHeight * 2;
  target.scrollIntoView({
    behavior: distant ? "instant" : behavior(),
    block: "start",
  });
  if (distant && !motionOff())
    target.animate(
      [
        { opacity: 0.3, transform: "translateY(8px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 480, easing: "ease-out" },
    );
  if (target.dataset.number) updateActive(Number(target.dataset.number));
  else updateActive(0);
  jumpTimer = setTimeout(finishJump, 1800);
}
document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return;
  event.preventDefault();
  jump(link.getAttribute("href"));
});
$("#previous").addEventListener("click", () =>
  jump(`#${chapters[Math.max(active - 2, 0)].id}`),
);
$("#next").addEventListener("click", () =>
  jump(`#${chapters[Math.min(active, 80)].id}`),
);
for (const button of document.querySelectorAll(".index-open"))
  button.addEventListener("click", () => {
    search.value = "";
    filterIndex();
    dialog.showModal();
    search.focus();
  });
$("#close-index").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      dialog.close();
  }
});
const searchable = chapters.map((chapter) =>
  chapter.textContent.toLocaleLowerCase(),
);
function filterIndex() {
  const query = search.value.trim().toLocaleLowerCase();
  let found = 0;
  links.forEach((link, i) => {
    const match =
      !query ||
      (/^\d+$/.test(query)
        ? i + 1 === Number(query)
        : searchable[i].includes(query));
    link.hidden = !match;
    if (match) found++;
  });
  $("#search-count").textContent = `${found} chapter${found === 1 ? "" : "s"}`;
  $(".no-results").hidden = found !== 0;
}
search.addEventListener("input", filterIndex);
addEventListener("hashchange", () => jump(location.hash || "#top", false));
addEventListener("scroll", scheduleMeasure, { passive: true });
addEventListener("scrollend", finishJump);
addEventListener("resize", scheduleMeasure);
for (const event of ["wheel", "touchstart"])
  addEventListener(event, finishJump, { passive: true });
new ResizeObserver(scheduleMeasure).observe($(".book"));
if (initialHash) jump(initialHash, false);
document.fonts.ready.then(() => {
  if (initialHash) jump(initialHash, false);
  else scheduleMeasure();
});

// Continuous contours of an organic scalar field: every level traces one
// flowing line, so neighboring curves merge into valleys without crossing.
const canvas = $(".margin-art");
const context = canvas.getContext("2d");
let width = 0;
let height = 0;
let contourPaths = [];
let ink;
let artFrame;
let lastArt = 0;
let artTime = 0;
let lastTick = 0;
let scrollDrift = 0;
const gridStep = 12;
const overscan = 150;

function field(x, y) {
  const u = x / 230;
  const v = y / 230;
  const bendX = u + 0.72 * Math.sin(v * 0.71) + 0.2 * Math.cos(v * 1.63);
  const bendY = v + 0.68 * Math.sin(u * 0.63 + 1.1);
  return (
    Math.sin(bendX * 1.12 + 0.4) +
    0.83 * Math.cos(bendY * 1.28) +
    0.3 * Math.sin(bendX * 2.03 - bendY * 0.77 + 2.1)
  );
}

function traceContours() {
  const columns = Math.ceil((width + overscan * 2) / gridStep);
  const rows = Math.ceil((height + overscan * 2) / gridStep);
  const samples = new Float32Array((columns + 1) * (rows + 1));
  for (let row = 0; row <= rows; row++) {
    for (let column = 0; column <= columns; column++) {
      samples[row * (columns + 1) + column] = field(
        column * gridStep - overscan,
        row * gridStep - overscan,
      );
    }
  }
  const paths = [];
  for (let level = -1.85; level <= 1.86; level += 0.205) {
    const path = new Path2D();
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const start = row * (columns + 1) + column;
        const values = [
          samples[start],
          samples[start + 1],
          samples[start + columns + 2],
          samples[start + columns + 1],
        ];
        const corners = [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ];
        const edges = [];
        const x = column * gridStep - overscan;
        const y = row * gridStep - overscan;
        for (let edge = 0; edge < 4; edge++) {
          const next = (edge + 1) % 4;
          if (values[edge] < level === values[next] < level) continue;
          const t = (level - values[edge]) / (values[next] - values[edge]);
          edges.push([
            x +
              (corners[edge][0] + t * (corners[next][0] - corners[edge][0])) *
                gridStep,
            y +
              (corners[edge][1] + t * (corners[next][1] - corners[edge][1])) *
                gridStep,
          ]);
        }
        // Resolve saddle cells consistently using the bilinear center value.
        if (
          edges.length === 4 &&
          values.reduce((a, b) => a + b) / 4 < level !== values[0] < level
        ) {
          edges.push(edges.shift());
        }
        for (let edge = 0; edge + 1 < edges.length; edge += 2) {
          path.moveTo(...edges[edge]);
          path.lineTo(...edges[edge + 1]);
        }
      }
    }
    paths.push(path);
  }
  return paths;
}

function sizeArt() {
  if (!context) return;
  ({ width, height } = canvas.getBoundingClientRect());
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  contourPaths = traceContours();
  ink = context.createLinearGradient(0, 0, width, 0);
  // Warm, more visible edges taper into barely-there ink beneath the text.
  for (const [position, alpha] of [
    [0, 0.29],
    [0.09, 0.18],
    [0.24, 0.045],
    [0.5, 0.035],
    [0.76, 0.045],
    [0.91, 0.18],
    [1, 0.29],
  ]) {
    ink.addColorStop(position, `rgba(148, 126, 84, ${alpha})`);
  }
  drawArt();
}

function drawArt() {
  if (!context) return;
  context.clearRect(0, 0, width, height);
  const breath = motionOff() ? 0 : Math.sin(artTime / 6900);
  context.save();
  context.translate(
    width / 2 + (motionOff() ? 0 : Math.sin(artTime / 21000) * 5),
    height / 2 + scrollDrift,
  );
  context.scale(
    1 + breath * 0.006,
    1 + Math.sin(artTime / 8300) * (motionOff() ? 0 : 0.008),
  );
  context.translate(-width / 2, -height / 2);
  context.strokeStyle = ink;
  context.lineWidth = 0.95;
  context.lineJoin = "round";
  for (const path of contourPaths) context.stroke(path);
  context.restore();
}

function animate(time) {
  artFrame = null;
  if (document.hidden || motionOff()) return;
  if (lastTick) artTime += Math.min(time - lastTick, 80);
  lastTick = time;
  if (time - lastArt > 1000 / 30) {
    const targetDrift = Math.sin(scrollY / 2100) * 52;
    scrollDrift += (targetDrift - scrollDrift) * 0.065;
    drawArt();
    lastArt = time;
  }
  artFrame = requestAnimationFrame(animate);
}
function setMotion() {
  if (!context) return;
  cancelAnimationFrame(artFrame);
  lastTick = 0;
  if (motionOff()) {
    artTime = 0;
    scrollDrift = 0;
  }
  drawArt();
  if (!motionOff() && !document.hidden)
    artFrame = requestAnimationFrame(animate);
}
reducedMotion.addEventListener("change", setMotion);
addEventListener("visibilitychange", setMotion);
addEventListener("resize", sizeArt);
if (context) {
  sizeArt();
  setMotion();
}
scheduleMeasure();
