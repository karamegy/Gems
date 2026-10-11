const state = {
  commander: null,
  activeTab: "overview",
  toastMessage: null,
  toastTimer: null,
  resources: {
    energy: 300,
    crystals: 150,
    alloy: 100,
    data: 50
  },
  satellites: [
    { id: "horus_sat", name: "قمر حورس (عين الرؤية)", level: 1, cost: { energy: 100, alloy: 50 }, prod: "5 بيانات/10ث" },
    { id: "obelisk_sat", name: "مسلة الفضاء الكونية", level: 1, cost: { crystals: 80, alloy: 60 }, prod: "8 طاقة/10ث" }
  ],
  rockets: [
    { id: "amun_1", name: "صاروخ أمون-1", count: 2, cost: { energy: 150, alloy: 100 } },
    { id: "ra_express", name: "مركبة رع السريعة", count: 0, cost: { crystals: 120, alloy: 150 } }
  ],
  techs: [
    { id: "quantum_shields", name: "دروع طاقة أوزوريس", level: 0, maxLevel: 3, cost: { data: 40, crystals: 50 }, desc: "تزيد كفاءة جمع الموارد الفضائية بنسبة 25%." },
    { id: "ion_drive", name: "محركات الدفع الأيوني", level: 0, maxLevel: 3, cost: { data: 60, alloy: 80 }, desc: "تضاعف نجاح البعثات الفضائية بنسبة 20%." }
  ],
  missions: [
    { id: "moon", name: "استكشاف القمر الهلالي", target: "قمر الأرض", reward: { crystals: 100, data: 30 }, successRate: 85, active: false },
    { id: "mars", name: "رحلة كوكب المريخ الأحمر", target: "المريخ", reward: { crystals: 250, data: 90 }, successRate: 60, active: false },
    { id: "deep_space", name: "بوابة سديم أوريون", target: "الفضاء السحيق", reward: { crystals: 600, data: 200 }, successRate: 35, active: false }
  ],
  logs: [
    "مرحباً بك يا قائد المحطة في مركز الفضاء المصري الجديد.",
    "تم تفعيل أنظمة الملاحة الكونية بنجاح."
  ]
};

function saveGame() {
  localStorage.setItem('pharaonic_space_state', JSON.stringify(state));
}

function loadGame() {
  const saved = localStorage.getItem('pharaonic_space_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(state, parsed);
    } catch (e) {
      console.error("خطأ في استرجاع بيانات الفضاء", e);
    }
  }
}

let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playLaserSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {}
}

function playRocketSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

function showToast(msg) {
  state.toastMessage = msg;
  render();
  if (state.toastTimer) clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    state.toastMessage = null;
    render();
  }, 3000);
}

function addLog(text) {
  const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  state.logs.unshift(`[${time}] ${text}`);
  saveGame();
}

function handleLogin(e) {
  e.preventDefault();
  const name = e.target.commanderName.value.trim();
  if (!name) return;
  state.commander = { name: name, rank: "قائد مركبة أول" };
  playLaserSound();
  addLog(`استلام القيادة بواسطة القائد: ${name}`);
  saveGame();
  render();
}

function switchTab(tab) {
  state.activeTab = tab;
  render();
}

function upgradeSatellite(satId) {
  const sat = state.satellites.find(s => s.id === satId);
  if (!sat) return;
  for (let res in sat.cost) {
    if (state.resources[res] < sat.cost[res]) {
      showToast("الموارد الفضائية غير كافية!");
      return;
    }
  }
  for (let res in sat.cost) {
    state.resources[res] -= sat.cost[res];
    sat.cost[res] = Math.round(sat.cost[res] * 1.6);
  }
  sat.level++;
  playLaserSound();
  addLog(`تم تطوير ${sat.name} إلى المستوى ${sat.level}`);
  showToast("تمت ترقية القمر الصناعي بنجاح!");
  saveGame();
  render();
}

function buildRocket(rocketId) {
  const r = state.rockets.find(item => item.id === rocketId);
  if (!r) return;
  for (let res in r.cost) {
    if (state.resources[res] < r.cost[res]) {
      showToast("الموارد غير كافية لتصنيع الصاروخ!");
      return;
    }
  }
  for (let res in r.cost) {
    state.resources[res] -= r.cost[res];
  }
  r.count++;
  playRocketSound();
  addLog(`تم بناء صاروخ استكشافي جديد: ${r.name}`);
  showToast("تم إطلاق صاروخ جديد للمنصة!");
  saveGame();
  render();
}

function researchTech(techId) {
  const t = state.techs.find(item => item.id === techId);
  if (!t || t.level >= t.maxLevel) return;
  for (let res in t.cost) {
    if (state.resources[res] < t.cost[res]) {
      showToast("بيانات أو موارد البحث غير كافية!");
      return;
    }
  }
  for (let res in t.cost) {
    state.resources[res] -= t.cost[res];
    t.cost[res] = Math.round(t.cost[res] * 1.7);
  }
  t.level++;
  playLaserSound();
  addLog(`تم ابتكار تكنولوجيا جديدة: ${t.name} (مستوى ${t.level})`);
  showToast("تم تطوير التكنولوجيا بنجاح!");
  saveGame();
  render();
}

function launchMission(missionId) {
  const m = state.missions.find(item => item.id === missionId);
  if (!m) return;
  const totalRockets = state.rockets.reduce((acc, curr) => acc + curr.count, 0);
  if (totalRockets <= 0) {
    showToast("لا توجد صواريخ جاهزة للإطلاق! اصنع صواريخ أولاً.");
    return;
  }
  playRocketSound();
  const ionTech = state.techs.find(item => item.id === "ion_drive") ? state.techs.find(item => item.id === "ion_drive").level : 0;
  const currentSuccess = Math.min(95, m.successRate + (ionTech * 12));
  const success = Math.random() * 100 <= currentSuccess;
  if (success) {
    for (let res in m.reward) {
      state.resources[res] = (state.resources[res] ? state.resources[res] : 0) + m.reward[res];
    }
    addLog(`نجاح البعثة! تم استكشاف ${m.target} وجمع غنائم كونية.`);
    showToast("نجح الإطلاق! تم جلب موارد جديدة.");
  } else {
    addLog(`فشلت بعثة ${m.target} بسبب عاصفة نيازك كونية.`);
    showToast("فشلت البعثة وضاع الصاروخ!");
    for (let r of state.rockets) {
      if (r.count > 0) {
        r.count--;
        break;
      }
    }
  }
  saveGame();
  render();
}

function renderAuth() {
  return `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="space-emblem">🌌 𓂀 🚀</div>
        <h1>محطة الفضاء الفرعونية</h1>
        <p class="sub">اغزُ الفضاء بأسرار أجدادك الفراعنة</p>
        <form onsubmit="handleLogin(event)">
          <div class="field">
            <label>اسم القائد / الباحث الفضائي</label>
            <input type="text" name="commanderName" placeholder="أدخل اسمك هنا..." required autocomplete="off" />
          </div>
          <button type="submit" class="btn btn-cyber btn-full">دخول غرفة القيادة 🚀</button>
        </form>
      </div>
    </div>
  `;
}

function renderTopbar() {
  return `
    <div class="topbar">
      <div class="brand">🛰️ الفضاء الفرعوني</div>
      <div class="resources">
        <div class="res"><span class="ico">⚡</span> ${state.resources.energy} <span class="cap">طاقة</span></div>
        <div class="res"><span class="ico">💎</span> ${state.resources.crystals} <span class="cap">بلورات</span></div>
        <div class="res"><span class="ico">🛡️</span> ${state.resources.alloy} <span class="cap">سبائك</span></div>
        <div class="res"><span class="ico">📜</span> ${state.resources.data} <span class="cap">بيانات</span></div>
      </div>
      <div class="player-chip">
        <span>👨‍🚀 ${state.commander.name}</span>
      </div>
    </div>
  `;
}

function renderNav() {
  const tabs = [
    { id: "overview", label: "🔭 المركز الرئيسي" },
    { id: "satellites", label: "🛰️ الأقمار الصناعية" },
    { id: "rockets", label: "🚀 منصة الصواريخ" },
    { id: "missions", label: "🌌 البعثات الكونية" },
    { id: "tech", label: "🔬 معمل الأبحاث" }
  ];
  return `
    <div class="nav">
      ${tabs.map(t => `
        <button class="${state.activeTab === t.id ? 'active' : ''}" onclick="switchTab('${t.id}')">
          ${t.label}
        </button>
      `).join('')}
    </div>
  `;
}

function renderOverview() {
  return `
    <div class="panel">
      <h2>مرحباً بك مجدداً يا قائد ${state.commander.name}</h2>
      <p class="muted">المحطة تعمل بكفاءة تامة. تابع تقارير الرادار وأحدث سجلات الطاقم.</p>
    </div>
    <div class="grid-2">
      <div class="panel">
        <h3>📡 السجلات الحية لغرفة القيادة</h3>
        <div class="log">
          ${state.logs.map(log => `<div>${log}</div>`).join('')}
        </div>
      </div>
      <div class="panel">
        <h3>🚀 أسطول الصواريخ الجاهزة</h3>
        ${state.rockets.map(r => `
          <div class="stat-row">
            <span>${r.name}</span>
            <span class="badge badge-cyber">${r.count} مركبة</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderSatellites() {
  return `
    <div class="panel">
      <h2>🛰️ شبكة الأقمار الصناعية الفرعونية</h2>
      <p class="muted">طور الأقمار لجمع الطاقة والبيانات الكونية تلقائياً.</p>
    </div>
    <div class="grid-2">
      ${state.satellites.map(sat => `
        <div class="card">
          <div class="title">${sat.name}</div>
          <div class="meta">المستوى الحالي: <strong>${sat.level}</strong></div>
          <div class="meta">الإنتاج: ${sat.prod}</div>
          <button class="btn btn-cyber btn-full btn-sm" onclick="upgradeSatellite('${sat.id}')">
            ترقية (⚡ ${sat.cost.energy ? sat.cost.energy : 0} - 💎 ${sat.cost.crystals ? sat.cost.crystals : 0} - 🛡️ ${sat.cost.alloy ? sat.cost.alloy : 0})
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

function renderRockets() {
  return `
    <div class="panel">
      <h2>🚀 منصة تصنيع وإطلاق الصواريخ</h2>
      <p class="muted">اصنع المزيد من الصواريخ لضمان نجاح الرحلات الاستكشافية الكونية.</p>
    </div>
    <div class="grid-2">
      ${state.rockets.map(r => `
        <div class="card">
          <div class="title">${r.name}</div>
          <div class="meta">المتوفر في الهناغز: <strong>${r.count}</strong></div>
          <button class="btn btn-gold btn-full btn-sm" onclick="buildRocket('${r.id}')">
            تصنيع صاروخ (⚡ ${r.cost.energy ? r.cost.energy : 0} - 💎 ${r.cost.crystals ? r.cost.crystals : 0} - 🛡️ ${r.cost.alloy ? r.cost.alloy : 0})
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

function renderMissions() {
  return `
    <div class="panel">
      <h2>🌌 بعثات الفضاء العميق والكواكب</h2>
      <p class="muted">اختر الكوكب المستهدف وأرسل الصواريخ لجمع الثروات الكونية.</p>
    </div>
    <div class="grid-3">
      ${state.missions.map(m => `
        <div class="card">
          <div class="title">${m.name}</div>
          <div class="meta">الهدف: <strong>${m.target}</strong></div>
          <div class="meta">نسبة النجاح الأساسية: <strong>${m.successRate}%</strong></div>
          <button class="btn btn-cyber btn-full btn-sm" onclick="launchMission('${m.id}')">
            إطلاق البعثة 🚀
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTech() {
  return `
    <div class="panel">
      <h2>🔬 معمل التكنولوجيا المتقدمة</h2>
      <p class="muted">استثمر البيانات العلمية لتقوية أبحاث المحطة الفضائية.</p>
    </div>
    <div class="grid-2">
      ${state.techs.map(t => `
        <div class="card">
          <div class="title">${t.name}</div>
          <div class="meta">المستوى: <strong>${t.level} /${t.maxLevel}</strong></div>
          <div class="meta">${t.desc}</div>
          <button class="btn btn-cyber btn-full btn-sm" onclick="researchTech('${t.id}')" ${t.level >= t.maxLevel ? 'disabled' : ''}>
            ${t.level >= t.maxLevel ? 'مكتمل بالكامل' : `بحث (📜 ${t.cost.data ? t.cost.data : 0} - 💎 ${t.cost.crystals ? t.cost.crystals : 0} - 🛡️ ${t.cost.alloy ? t.cost.alloy : 0})`}
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

function renderToast() {
  if (!state.toastMessage) return '';
  return `<div class="toast">${state.toastMessage}</div>`;
}

function render() {
  const app = document.getElementById("app");
  if (!app) return;
  if (!state.commander) {
    app.innerHTML = renderAuth();
    return;
  }
  let mainContent = "";
  switch (state.activeTab) {
    case "overview": mainContent = renderOverview(); break;
    case "satellites": mainContent = renderSatellites(); break;
    case "rockets": mainContent = renderRockets(); break;
    case "missions": mainContent = renderMissions(); break;
    case "tech": mainContent = renderTech(); break;
    default: mainContent = renderOverview();
  }
  app.innerHTML = `
    ${renderTopbar()}
    ${renderNav()}
    <div class="main">
      ${mainContent}
    </div>
    ${renderToast()}
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  loadGame();
  render();
  setInterval(() => {
    if (!state.commander) return;
    const shieldObj = state.techs.find(item => item.id === "quantum_shields");
    const shieldTech = shieldObj ? shieldObj.level : 0;
    const bonus = 1 + (shieldTech * 0.25);
    state.satellites.forEach(sat => {
      if (sat.id === 'horus_sat') state.resources.data += Math.round(sat.level * 5 * bonus);
      if (sat.id === 'obelisk_sat') state.resources.energy += Math.round(sat.level * 8 * bonus);
    });
    state.resources.alloy += 5;
    saveGame();
    render();
  }, 10000);
});
