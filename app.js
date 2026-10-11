// === حالة اللعبة الإجمالية (State) ===
const state = {
  user: null,
  activeTab: "overview",
  toastMessage: null,
  toastTimer: null,
  resources: {
    gold: 500,
    stone: 300,
    wood: 200,
    food: 400
  },
  castles: [
    { id: 1, name: "قلعة خوفو العظمى", owner: "لاعب 1", isMine: true, x: 48, y: 35, level: 3, hp: 1000 },
    { id: 2, name: "حصن الفرعون", owner: "رمسيس", isMine: false, x: 30, y: 50, level: 2, hp: 600 },
    { id: 3, name: "معسكر الواحة", owner: "مجهول", isMine: false, x: 70, y: 65, level: 1, hp: 300 }
  ],
  buildings: [
    { id: "gold_mine", name: "منجم الذهب", level: 1, cost: { gold: 100, stone: 50 }, prod: "10 ذهب/ساعة" },
    { id: "quarry", name: "محجر المحاجر", level: 1, cost: { gold: 50, stone: 100 }, prod: "15 حجارة/ساعة" },
    { id: "farm", name: "مزارع النيل", level: 2, cost: { gold: 80, wood: 60 }, prod: "20 طعام/ساعة" }
  ],
  troops: [
    { id: "archers", name: "رماة السهام", count: 25, cost: { gold: 20, food: 10 } },
    { id: "spearmen", name: "مشاة الرماح", count: 40, cost: { gold: 15, food: 15 } },
    { id: "chariots", name: "المركبات الحربية", count: 5, cost: { gold: 100, wood: 50 } }
  ],
  logs: [
    "مرحباً بك في قلاع الجيزة!",
    "تم تأسيس مملكتك بنجاح قرب نهر النيل."
  ],
  selectedCastle: null
};

// === LocalStorage (حفظ واسترجاع التقدم) ===
function saveGame() {
  localStorage.setItem('giza_castles_state', JSON.stringify(state));
}

function loadGame() {
  const saved = localStorage.getItem('giza_castles_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(state, parsed);
    } catch (e) {
      console.error("خطأ في استرجاع البيانات المحفوظة", e);
    }
  }
}

// === Web Audio API (مؤثرات صوتية بدون ملفات خارجية) ===
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playCoinSound() {
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } catch (e) {}
}

function playSwordSound() {
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {}
}

// === الوظائف المساعدة ===
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

// === إدارة التفاعلات ===
function handleLogin(e) {
  e.preventDefault();
  const username = e.target.username.value.trim();
  if (!username) return;
  state.user = { name: username, level: 1 };
  addLog(`تسجيل الدخول باسم: ${username}`);
  playCoinSound();
  saveGame();
  render();
}

function switchTab(tab) {
  state.activeTab = tab;
  render();
}

function upgradeBuilding(buildingId) {
  const b = state.buildings.find(item => item.id === buildingId);
  if (!b) return;

  for (let res in b.cost) {
    if (state.resources[res] < b.cost[res]) {
      showToast("الموارد غير كافية لترقية هذا المبنى!");
      return;
    }
  }

  for (let res in b.cost) {
    state.resources[res] -= b.cost[res];
    b.cost[res] = Math.round(b.cost[res] * 1.5);
  }
  b.level++;
  playCoinSound();
  addLog(`تمت ترقية ${b.name} إلى المستوى ${b.level}`);
  showToast(`تمت ترقية ${b.name} بنجاح!`);
  saveGame();
  render();
}

function trainTroop(troopId) {
  const t = state.troops.find(item => item.id === troopId);
  if (!t) return;

  for (let res in t.cost) {
    if (state.resources[res] < t.cost[res]) {
      showToast("لا توجد موارد كافية للتدريب!");
      return;
    }
  }

  for (let res in t.cost) {
    state.resources[res] -= t.cost[res];
  }
  t.count += 5;
  playCoinSound();
  addLog(`تم تدريب 5 وحدات من ${t.name}`);
  showToast(`تم تدريب 5 وحدات من ${t.name}`);
  saveGame();
  render();
}

function openCastleModal(castle) {
  state.selectedCastle = castle;
  render();
}

function closeCastleModal() {
  state.selectedCastle = null;
  render();
}

function attackCastle(castle) {
  if (castle.isMine) {
    showToast("لا يمكنك هجوم قلعتك الخاصة!");
    return;
  }
  const totalTroops = state.troops.reduce((acc, curr) => acc + curr.count, 0);
  if (totalTroops < 10) {
    showToast("جيشك ضعيف جداً! درب المزيد من الجنود.");
    return;
  }

  playSwordSound();
  const success = Math.random() > 0.4;
  if (success) {
    const goldLoot = Math.floor(Math.random() * 150) + 50;
    state.resources.gold += goldLoot;
    addLog(`انتصار! تمت الإغارة على ${castle.name} ونهب ${goldLoot} ذهب.`);
    showToast(`انتصار! غنمت ${goldLoot} ذهب.`);
  } else {
    addLog(`هزيمة! تراجعت قواتك أثناء التصدّي لهجوم ${castle.name}.`);
    showToast("تراجعت القوات وخسرت المعركة!");
  }
  saveGame();
  closeCastleModal();
}

// === مكونات الواجهة (Render Engine) ===
function renderAuth() {
  return `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="auth-crest">
          <div class="pyramids">𓋹 𓏤 𓀀</div>
        </div>
        <h1>قلاع الجيزة</h1>
        <p class="sub">ابنِ إمبراطوريتك واحمِ أهراماتك</p>
        <form onsubmit="handleLogin(event)">
          <div class="field">
            <label>اسم الحاكم / القائد</label>
            <input type="text" name="username" placeholder="أدخل اسمك هنا..." required autocomplete="off" />
          </div>
          <button type="submit" class="btn btn-gold btn-full">دخول اللعبة ⚔️</button>
        </form>
      </div>
    </div>
  `;
}

function renderTopbar() {
  return `
    <div class="topbar">
      <div class="brand">🏰 قلاع الجيزة</div>
      <div class="resources">
        <div class="res"><span class="ico">🪙</span> ${state.resources.gold} <span class="cap">ذهب</span></div>
        <div class="res"><span class="ico">🪨</span> ${state.resources.stone} <span class="cap">حجر</span></div>
        <div class="res"><span class="ico">🪵</span> ${state.resources.wood} <span class="cap">خشب</span></div>
        <div class="res"><span class="ico">🌾</span> ${state.resources.food} <span class="cap">طعام</span></div>
      </div>
      <div class="player-chip">
        <span>👤 ${state.user.name}</span>
        <span class="lvl">مستوى ${state.user.level}</span>
      </div>
    </div>
  `;
}

function renderNav() {
  const tabs = [
    { id: "overview", label: "🏛️ نظرة عامة" },
    { id: "map", label: "🗺️ الخريطة" },
    { id: "buildings", label: "🏗️ المنشآت" },
    { id: "army", label: "⚔️ الجيش" }
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
      <h2>مرحباً بك يا الملك ${state.user.name}</h2>
      <p class="muted">أهلاً بك في العصر الفرعوني العظيم. تفقد مملكتك وإحصائيات القلاع المجاورة.</p>
    </div>
    <div class="grid-2">
      <div class="panel">
        <h3>📜 آخر التحديثات والأحداث</h3>
        <div class="log">
          ${state.logs.map(log => `<div>${log}</div>`).join('')}
        </div>
      </div>
      <div class="panel">
        <h3>📊 حالة الجاهزية العسكرية</h3>
        <p class="muted" style="margin-bottom: 12px;">إجمالي القوات المجهزة للقتال:</p>
        ${state.troops.map(t => `
          <div class="stat-row">
            <span>${t.name}</span>
            <span class="badge badge-gold">${t.count} جندي</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderMap() {
  return `
    <div class="map-wrap">
      <div class="map-canvas">
        <div class="pyramid khufu"></div>
        <div class="pyramid khafre"></div>
        <div class="pyramid menkaure"></div>
        <div class="sphinx">🦁</div>
        <div class="nile-river"></div>

        ${state.castles.map(c => `
          <div class="castle-pin ${c.isMine ? 'mine' : ''}" style="left: ${c.x}%; top: ${c.y}\%;" onclick='openCastleModal(${JSON.stringify(c)})'>
            <div class="icon">${c.isMine ? '🏰' : '🏯'}</div>
            <div class="name">${c.name}</div>
          </div>
        `).join('')}
      </div>
      <div class="map-legend">
        <span>🏰 قلعتك</span> | <span>🏯 القلاع المجاورة</span>
      </div>
    </div>
  `;
}

function renderBuildings() {
  return `
    <div class="panel">
      <h2>مباني المملكة</h2>
      <p class="muted">قم بزيادة الإنتاج لجمع المزيد من الموارد لبناء جيش أعتى.</p>
    </div>
    <div class="grid-3">
      ${state.buildings.map(b => `
        <div class="card">
          <div class="title">${b.name}</div>
          <div class="meta">المستوى الحالي: <strong>${b.level}</strong></div>
          <div class="meta">الإنتاج: ${b.prod}</div>
          <button class="btn btn-gold btn-full btn-sm" onclick="upgradeBuilding('${b.id}')">
            ترقية (🪙 ${b.cost.gold || 0} | 🪨 ${b.cost.stone \vert{}\vert{} 0} \vert{} 🪵 ${b.cost.wood || 0})
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

function renderArmy() {
  return `
    <div class="panel">
      <h2>المعسكر العسكري</h2>
      <p class="muted">قم بتدريب الجيش للدفاع عن قلاعك والسيطرة على أراضي الجيزة.</p>
    </div>
    <div class="grid-3">
      ${state.troops.map(t => `
        <div class="card">
          <div class="title">${t.name}</div>
          <div class="meta">العدد المتوفر: <strong>${t.count}</strong></div>
          <button class="btn btn-blood btn-full btn-sm" onclick="trainTroop('${t.id}')">
            تدريب +5 (🪙 ${t.cost.gold \vert{}\vert{} 0} \vert{} 🌾 ${t.cost.food || 0})
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

function renderModal() {
  if (!state.selectedCastle) return '';
  const c = state.selectedCastle;
  return `
    <div class="overlay" onclick="closeCastleModal()">
      <div class="modal" onclick="event.stopPropagation()">
        <h2>${c.name}</h2>
        <div class="stat-row"><span>المالك:</span> <strong>${c.owner}</strong></div>
        <div class="stat-row"><span>المستوى:</span> <strong>${c.level}</strong></div>
        <div class="stat-row"><span>الصلابة (HP):</span> <strong>${c.hp}</strong></div>
        <div class="gap"></div>
        <div class="row">
          ${c.isMine 
            ? `<button class="btn btn-oasis btn-full" onclick="showToast('القلعة بحالة جيدة!')">إدارة القلعة</button>`
            : `<button class="btn btn-blood btn-full" onclick='attackCastle(${JSON.stringify(c)})'>شن هجوم ⚔️</button>`
          }
        </div>
      </div>
    </div>
  `;
}

function renderToast() {
  if (!state.toastMessage) return '';
  return `<div class="toast">${state.toastMessage}</div>`;
}

// === الدالة الرئيسية للرسم (Main Render Loop) ===
function render() {
  const app = document.getElementById("app");
  if (!app) return;

  if (!state.user) {
    app.innerHTML = renderAuth();
    return;
  }

  let mainContent = "";
  switch (state.activeTab) {
    case "overview": mainContent = renderOverview(); break;
    case "map": mainContent = renderMap(); break;
    case "buildings": mainContent = renderBuildings(); break;
    case "army": mainContent = renderArmy(); break;
    default: mainContent = renderOverview();
  }

  app.innerHTML = `
    ${renderTopbar()}
    ${renderNav()}
    <div class="main">
      ${mainContent}
    </div>
    ${renderModal()}
    ${renderToast()}
  `;
}

// === التشغيل التلقائي والإنتاج (Idle Loop) ===
document.addEventListener("DOMContentLoaded", () => {
  loadGame();
  render();

  // الإنتاج التلقائي للموارد كل 10 ثوانٍ بناءً على مستوى المباني
  setInterval(() => {
    if (!state.user) return;
    state.buildings.forEach(b => {
      if (b.id === 'gold_mine') state.resources.gold += b.level * 2;
      if (b.id === 'quarry') state.resources.stone += b.level * 2;
      if (b.id === 'farm') state.resources.food += b.level * 3;
    });
    saveGame();
    // تحديث الشاشة فقط إذا كان اللاعب مسجلاً الدخول
    render();
  }, 10000);
});
