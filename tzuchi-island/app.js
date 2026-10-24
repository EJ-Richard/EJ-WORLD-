import { TOPICS, TOPIC_BY_ID, ABOUT } from "./data.js";
import { buildHexes, FILL, HEX_SIZE } from "./layout.js";
import { mountScene } from "./scene.js";

const $ = (sel) => document.querySelector(sel);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[ch]));

const hexes = buildHexes();
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const stage = $("#stage");
const listEl = $("#list");
const listBody = $("#list-body");
const panel = $("#panel");
const panelBody = $("#panel-body");
const qInput = $("#q");
const live = $("#live");
const loading = $("#loading");

let selected = null;
let query = "";
let mode = null;
let scene = null;

function say(text) {
  live.textContent = text;
}

function topicHex(id) {
  return hexes.find((hex) => hex.topic === id);
}

function matches(topic, text) {
  if (!text) return true;
  const hay = [topic.title, topic.short, topic.blurb, topic.impression, ...topic.keywords, ...topic.facts].join(" ").toLowerCase();
  return text.toLowerCase().split(/\s+/).filter(Boolean).every((part) => hay.includes(part));
}

function visibleTopics() {
  return TOPICS.filter((topic) => matches(topic, query.trim()));
}

function sourcesHtml(sources) {
  return `<ol class="srcs">${sources.map((source) => `
    <li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">
      <span class="st">${esc(source.title)}</span>
      <span class="so">${esc(source.outlet)}${source.date ? ` · ${esc(source.date)}` : ""}</span>
    </a></li>`).join("")}</ol>`;
}

function relatedHtml(ids) {
  if (!ids?.length) return "";
  return `<p class="related">相關話題 ${ids.map((id) => {
    const topic = TOPIC_BY_ID[id];
    return `<button type="button" data-open="${esc(id)}">${esc(topic.short)}</button>`;
  }).join("")}</p>`;
}

function renderAbout() {
  mode = "about";
  selected = null;
  scene?.setSelected(null);
  panelBody.innerHTML = `
    <p class="eyebrow">總覽</p>
    <h2>${esc(ABOUT.title)}</h2>
    <p class="lead">${esc(ABOUT.lead)}</p>
    ${ABOUT.notes.map((note) => `<p>${esc(note)}</p>`).join("")}
    <h3>七個話題</h3>
    <div class="about-list">${TOPICS.map((topic, index) => `
      <button type="button" data-open="${esc(topic.id)}">
        <span class="seal">${esc(topic.seal)}</span>
        <span><b>${esc(topic.title)}</b><small>${esc(topic.blurb)}</small></span>
        <em>${index + 1}</em>
      </button>`).join("")}</div>
    <p class="fine">摘要整理於2026年10月。本頁由粉絲製作，與慈濟基金會、慈濟醫院沒有隸屬關係。立體圖像只幫助辨認話題。</p>`;
  openPanel();
  say("總覽。七個話題可以用清單或島上的白島打開。");
}

function renderTopic(id) {
  const topic = TOPIC_BY_ID[id];
  if (!topic) return;
  mode = "topic";
  selected = id;
  const index = TOPICS.findIndex((item) => item.id === id);
  scene?.setSelected(id);
  scene?.focusHex(topicHex(id), true);
  panelBody.innerHTML = `
    <p class="eyebrow">話題 ${index + 1} / ${TOPICS.length} · ${esc(topic.place)}</p>
    <h2>${esc(topic.title)}</h2>
    <p class="lead">${esc(topic.blurb)}</p>
    <h3>常見印象</h3>
    <p>${esc(topic.impression)}</p>
    <h3>澄清說明</h3>
    ${topic.clarify.map((para) => `<p>${esc(para)}</p>`).join("")}
    <h3>重點</h3>
    <ul>${topic.facts.map((fact) => `<li>${esc(fact)}</li>`).join("")}</ul>
    <h3>權威來源</h3>
    ${sourcesHtml(topic.sources)}
    ${relatedHtml(topic.related)}
    <p class="fine">以上是公開資料的摘要，不是法律意見或募款文宣。日期、金額與程序以原連結為準。立體島不代表真實土地範圍。</p>`;
  openPanel();
  highlightList();
  if (location.hash !== `#/${id}`) history.replaceState(null, "", `#/${id}`);
  say(`${topic.title}。${topic.blurb}`);
}

function openPanel() {
  panel.hidden = false;
  document.body.classList.add("panel-open");
  layoutFrame(false);
}

function closePanel() {
  panel.hidden = true;
  panel.classList.remove("full");
  document.body.classList.remove("panel-open");
  mode = null;
  selected = null;
  scene?.setSelected(null);
  highlightList();
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  layoutFrame(true);
}

function renderList() {
  const rows = visibleTopics();
  listBody.innerHTML = rows.length ? rows.map((topic) => `
    <button type="button" class="topic-btn${topic.id === selected ? " on" : ""}" data-open="${esc(topic.id)}">
      <span class="seal">${esc(topic.seal)}</span>
      <span class="txt"><b>${esc(topic.title)}</b><small>${esc(topic.blurb)}</small></span>
    </button>`).join("") : `<p class="empty">沒有符合的話題。試試「內湖」「疫苗」「徵信」「救災」。</p>`;
  const hot = query.trim() ? new Set(rows.map((topic) => topic.id)) : null;
  scene?.setHot(hot);
  paintFlat(hot);
}

function highlightList() {
  listBody.querySelectorAll(".topic-btn").forEach((button) => {
    button.classList.toggle("on", button.dataset.open === selected);
  });
}

function setList(open) {
  listEl.hidden = !open;
  document.body.classList.toggle("list-open", open);
  $("#btn-list").setAttribute("aria-pressed", open ? "true" : "false");
  layoutFrame(!selected);
}

function layoutFrame(refit) {
  const wide = window.innerWidth >= 900;
  const left = wide && !listEl.hidden ? 3.2 : 0;
  const right = wide && !panel.hidden ? 3.2 : 0;
  scene?.setBias(left - right);
  if (refit && !selected) scene?.focusHome(false);
}

function openFromHash() {
  const id = decodeURIComponent(location.hash.replace(/^#\//, ""));
  if (TOPIC_BY_ID[id]) renderTopic(id);
}

function paintFlat(hot) {
  const svg = $("#flat");
  if (!svg) return;
  svg.querySelectorAll("[data-topic]").forEach((node) => {
    const on = node.dataset.topic === selected;
    const match = !hot || hot.has(node.dataset.topic);
    node.classList.toggle("on", on);
    node.classList.toggle("dim", Boolean(hot && !match));
  });
}

function buildFlat() {
  const xs = hexes.map((hex) => hex.x);
  const zs = hexes.map((hex) => hex.z);
  const minX = Math.min(...xs) - HEX_SIZE * 1.4;
  const maxX = Math.max(...xs) + HEX_SIZE * 1.4;
  const minZ = Math.min(...zs) - HEX_SIZE * 1.4;
  const maxZ = Math.max(...zs) + HEX_SIZE * 1.4;
  const polygons = hexes.map((hex) => {
    const points = [];
    for (let i = 0; i < 6; i += 1) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 3;
      points.push(`${hex.x + Math.cos(angle) * HEX_SIZE * 0.9},${hex.z + Math.sin(angle) * HEX_SIZE * 0.9}`);
    }
    const fill = FILL[hex.topic ? "topic" : hex.kind];
    const topic = hex.topic ? ` data-topic="${esc(hex.topic)}" tabindex="0" role="button"` : "";
    return `<polygon points="${points.join(" ")}" fill="${fill}" stroke="#ffffff" stroke-width="0.08"${topic}><title>${esc(hex.topic ? TOPIC_BY_ID[hex.topic].title : hex.kind === "penghu" ? "澎湖（示意）" : "地形")}</title></polygon>`;
  }).join("");
  const labels = TOPICS.map((topic) => {
    const hex = topicHex(topic.id);
    return `<text data-topic="${esc(topic.id)}" x="${hex.x}" y="${hex.z + 0.12}" text-anchor="middle" font-size="0.42">${esc(topic.short)}</text>`;
  }).join("");
  $("#flat").innerHTML = `${polygons}${labels}`;
  $("#flat").setAttribute("viewBox", `${minX} ${minZ} ${maxX - minX} ${maxZ - minZ}`);
}

function wireFlat() {
  $("#flat").addEventListener("click", (event) => {
    const node = event.target.closest("[data-topic]");
    if (node) renderTopic(node.dataset.topic);
  });
  $("#flat").addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const node = event.target.closest("[data-topic]");
    if (!node) return;
    event.preventDefault();
    renderTopic(node.dataset.topic);
  });
}

function bootScene() {
  scene = mountScene(stage, hexes, {
    reduced,
    onPick(hex) {
      if (hex.topic) {
        renderTopic(hex.topic);
        return;
      }
      const note = hex.kind === "penghu"
        ? "澎湖只用來辨認台灣輪廓，不是獨立話題。"
        : "這是拼出蕃薯形的地形。七個話題在較高的白島上。";
      say(note);
    },
  });
  if (!scene.ok) {
    stage.classList.add("fallback");
    scene = null;
    say("這個瀏覽器沒有打開立體畫面，已改用地圖。話題仍可點選。");
  }
}

document.addEventListener("click", (event) => {
  const opener = event.target.closest("[data-open]");
  if (opener) {
    renderTopic(opener.dataset.open);
    if (window.innerWidth < 900) setList(false);
  }
});

$("#btn-home").addEventListener("click", () => {
  closePanel();
  scene?.focusHome(true);
  say("回到全景。");
});
$("#btn-about").addEventListener("click", () => {
  renderAbout();
  scene?.focusHome(true);
});
$("#btn-list").addEventListener("click", () => setList(listEl.hidden));
$("#list-close").addEventListener("click", () => setList(false));
$("#panel-close").addEventListener("click", closePanel);
$("#sheet-handle").addEventListener("click", () => panel.classList.toggle("full"));

qInput.addEventListener("input", () => {
  query = qInput.value;
  renderList();
  if (query.trim()) {
    setList(true);
    const rows = visibleTopics();
    say(rows.length ? `找到 ${rows.length} 個話題。` : "沒有符合的話題。");
  }
});
$("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const rows = visibleTopics();
  if (rows.length === 1) renderTopic(rows[0].id);
  else setList(true);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!panel.hidden) closePanel();
    else if (!listEl.hidden && window.innerWidth < 900) setList(false);
  }
  if (event.key === "/" && document.activeElement !== qInput) {
    event.preventDefault();
    qInput.focus();
  }
});

window.addEventListener("hashchange", openFromHash);
window.addEventListener("resize", () => scene?.resize());

buildFlat();
wireFlat();
bootScene();
renderList();
setList(window.innerWidth >= 900);
if (location.hash) openFromHash();
loading.classList.add("hide");
