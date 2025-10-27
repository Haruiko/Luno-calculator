/* ------------------------------
   Weekly Lifestyle Mission Tracker
   ------------------------------ */

const LIFESTYLE_TASKS = [
  { name: "ENIGMITE POWDER", quantity: 40, exchange: "ALCHEMY EXCHANGE" },
  { name: "PINE LUMBER", quantity: 40, exchange: "ARTISANRY EXCHANGE" },
  { name: "BASE SOIL", quantity: 80, exchange: "BOTANY EXCHANGE" },
  { name: "HAY", quantity: 80, exchange: "BOTANY EXCHANGE" },
  { name: "RESIN", quantity: 80, exchange: "BOTANY EXCHANGE" },
  { name: "TARTBERRY JUICE", quantity: 80, exchange: "BOTANY EXCHANGE" },
  { name: "FLOUR", quantity: 45, exchange: "CULINARY EXCHANGE" },
  { name: "SANDSTONE POLISHERS", quantity: 40, exchange: "GEMCRAFTING EXCHANGE" },
  { name: "LIMPID AZURE WATER", quantity: 160, exchange: "GEMOLOGY EXCHANGE" },
  { name: "ROCK SALT", quantity: 80, exchange: "GEMOLOGY EXCHANGE" },
  { name: "CLAY", quantity: 160, exchange: "MINERALOGY EXCHANGE" },
  { name: "FINE METAL SAND", quantity: 80, exchange: "MINERALOGY EXCHANGE" },
  { name: "FINE SAND", quantity: 160, exchange: "MINERALOGY EXCHANGE" },
  { name: "PIG IRON INGOT", quantity: 40, exchange: "SMELTING EXCHANGE" },
  { name: "REFINED COTTON", quantity: 20, exchange: "WEAVING EXCHANGE" }
];

const KEY = "weekly-lifestyle-v1";   // store check states
const META_KEY = "weekly-lifestyle-meta"; // store last reset time

const today = new Date();
document.getElementById('dateSub').textContent =
  today.toLocaleDateString(undefined, { weekday:"long", year:"numeric", month:"short", day:"numeric" });

/* --- Load stored data --- */
let saved = JSON.parse(localStorage.getItem(KEY) || "{}");
let meta = JSON.parse(localStorage.getItem(META_KEY) || "{}");

/* --- Determine if we should reset (weekly reset on Mondays) --- */
function shouldReset() {
  const now = new Date();
  const lastReset = meta.lastReset ? new Date(meta.lastReset) : null;
  
  // Get the start of this week (Monday)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust for Sunday
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  // Reset if no record or last reset before this week's Monday
  if (!lastReset || lastReset < startOfWeek) {
    return true;
  }
  return false;
}

/* --- Perform the reset --- */
function performReset() {
  Object.keys(saved).forEach(k => saved[k] = false);
  localStorage.setItem(KEY, JSON.stringify(saved));
  meta.lastReset = new Date().toISOString();
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

/* --- Auto-reset if needed --- */
if (shouldReset()) {
  performReset();
}

/* --- Build task list UI --- */
const list = document.getElementById("missionList");

LIFESTYLE_TASKS.forEach((task, idx) => {
  const id = `lifestyle-task-${idx}`;
  const checked = !!saved[id];

  const row = document.createElement("label");
  row.className = `item${checked ? " done" : ""}`;
  row.setAttribute("for", id);

  const box = document.createElement("input");
  box.type = "checkbox";
  box.id = id;
  box.checked = checked;
  box.setAttribute("aria-label", task.name);

  const itemInfo = document.createElement("div");
  itemInfo.className = "item-info";
  
  const itemName = document.createElement("div");
  itemName.className = "item-name";
  itemName.textContent = task.name;
  
  const itemExchange = document.createElement("div");
  itemExchange.className = "item-exchange";
  itemExchange.textContent = task.exchange;
  
  itemInfo.appendChild(itemName);
  itemInfo.appendChild(itemExchange);

  const quantity = document.createElement("div");
  quantity.className = "item-quantity";
  quantity.textContent = task.quantity;

  row.appendChild(box);
  row.appendChild(itemInfo);
  row.appendChild(quantity);
  list.appendChild(row);

  // Save when toggled
  box.addEventListener("change", () => {
    saved[id] = box.checked;
    localStorage.setItem(KEY, JSON.stringify(saved));
    row.classList.toggle("done", box.checked);
    updateProgress();
  });
});

/* --- Manual reset button --- */
document.getElementById("resetBtn").addEventListener("click", () => {
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  Object.keys(saved).forEach(k => saved[k] = false);
  localStorage.setItem(KEY, JSON.stringify(saved));
  document.querySelectorAll('.item').forEach(el => el.classList.remove('done'));
  meta.lastReset = new Date().toISOString();
  localStorage.setItem(META_KEY, JSON.stringify(meta));
  updateProgress();
});

/* --- Progress indicator --- */
function updateProgress(){
  const boxes = [...document.querySelectorAll('input[type="checkbox"]')];
  const done = boxes.filter(b => b.checked).length;
  const total = boxes.length;
  const pct = Math.round((done / total) * 100);

  const circumference = 2 * Math.PI * 34; // radius=34
  const offset = circumference * (1 - pct/100);
  document.getElementById("ring").style.strokeDashoffset = offset.toFixed(2);
  document.getElementById("progressLabel").textContent = `${pct}%`;
  document.getElementById("summary").textContent = `${done} / ${total} completed`;
}

updateProgress();