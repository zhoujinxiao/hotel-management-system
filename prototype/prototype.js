const floors = ['7', '8', '9', '14'];
const floorStatuses = {
  '7': ['occupied','occupied','occupied','occupied','occupied','reserved','occupied','cleaning','occupied','occupied'],
  '8': ['occupied','occupied','occupied','occupied','occupied','available','occupied','cleaning','occupied','occupied'],
  '9': ['occupied','occupied','occupied','occupied','occupied','reserved','occupied','available','occupied','occupied'],
  '14': ['occupied','occupied','occupied','occupied','occupied','maintenance','occupied','cleaning','occupied','occupied']
};
const statusText = { occupied: '在住', reserved: '已订', available: '可售', cleaning: '待清洁', maintenance: '停用' };
const rooms = floors.flatMap((floor) => floorStatuses[floor].map((status, index) => ({ floor, number: `${floor}0${index + 1}`, status })));

const arrivals = [
  { room: '708', name: '徐文清', time: '14:00', source: '电话', status: '已担保' },
  { room: '802', name: '赵明宇', time: '14:30', source: '微信', status: '未担保' },
  { room: '904', name: '王倩', time: '15:10', source: '电话', status: '已担保' },
  { room: '1402', name: '李然', time: '16:00', source: '到店', status: '未担保' },
  { room: '1407', name: '周宁', time: '18:30', source: '微信', status: '已担保' }
];

const tasks = [
  { room: '708', title: '到店前查房', person: '王梅 · 11:30', icon: 'key' },
  { room: '902', title: '退房后清洁', person: '李芳 · 12:00', icon: 'broom' },
  { room: '1406', title: '住客续住查房', person: '周燕 · 12:30', icon: 'bed' },
  { room: '705', title: '高楼层查房', person: '王梅 · 13:00', icon: 'bed' }
];

const lanes = [
  { title: '已预订', count: 7, cards: [
    { room: '708', name: '徐文清', meta: '电话 · 已担保', time: '14:00', urgent: true },
    { room: '802', name: '赵明宇', meta: '微信 · 未担保', time: '14:30' },
    { room: '904', name: '王倩', meta: '电话 · 已担保', time: '15:10' }
  ]},
  { title: '待入住', count: 4, cards: [
    { room: '1402', name: '李然', meta: '到店 · 未担保', time: '16:00' },
    { room: '1407', name: '周宁', meta: '微信 · 已担保', time: '18:30' }
  ]},
  { title: '在住', count: 33, cards: [
    { room: '701', name: '陈嘉禾', meta: '09-17 至 09-20', time: '续住 3 晚' },
    { room: '806', name: '顾思远', meta: '09-19 至 09-21', time: '待补押金' },
    { room: '901', name: '许安', meta: '09-18 至 09-19', time: '今日离店' }
  ]},
  { title: '待退房', count: 5, cards: [
    { room: '901', name: '许安', meta: '房账 ¥200 · 已结清', time: '11:40', urgent: true },
    { room: '1004', name: '林悦', meta: '房账 ¥100 · 待退款', time: '12:00' }
  ]},
  { title: '待清洁', count: 6, cards: [
    { room: '902', name: '退房清洁', meta: '分配给李芳', time: '12:00' },
    { room: '1406', name: '住客清洁', meta: '等待查房', time: '12:30' },
    { room: '703', name: '退房清洁', meta: '待分配', time: '尽快' }
  ]}
];

const ledgerRows = [
  ['701', '在住', '陈嘉禾', '09-17 → 09-20', '¥300.00', '续住'],
  ['705', '在住', '宋清扬', '09-18 → 09-21', '¥300.00', '收款'],
  ['708', '已预订', '徐文清', '09-19 → 09-20', '¥100.00', '办理入住'],
  ['802', '已预订', '赵明宇', '09-19 → 09-20', '¥100.00', '确认担保'],
  ['806', '在住', '顾思远', '09-19 → 09-21', '¥200.00', '补押金'],
  ['901', '在住', '许安', '09-18 → 09-19', '¥0.00', '办理退房'],
  ['902', '待清洁', '—', '—', '—', '分配清洁'],
  ['1406', '待清洁', '沈知意', '09-18 → 09-22', '¥400.00', '查房']
];

function renderRoomBoards() {
  const aHtml = floors.map((floor) => `
    <div class="a-floor"><span class="a-floor-label">${floor}F</span><div class="a-room-row">
      ${rooms.filter((room) => room.floor === floor).map((room) => `<button class="a-room ${room.status}" title="${room.number} · ${statusText[room.status]}">${room.number}</button>`).join('')}
    </div></div>`).join('');
  document.getElementById('aRoomBoard').innerHTML = aHtml;

  document.getElementById('cRoomBoard').innerHTML = floors.map((floor) => `
    <div class="c-floor-row"><strong>${floor}F</strong><div class="c-floor-rooms">
      ${rooms.filter((room) => room.floor === floor).map((room) => `<span class="c-mini-room ${room.status}">${room.number.slice(-2)}</span>`).join('')}
    </div></div>`).join('');
}

function renderArrivalsAndTasks() {
  document.getElementById('aArrivalTable').innerHTML = `
    <div class="a-arrival-head"><span>时间</span><span>宾客</span><span>房间与渠道</span><span>担保</span><span>状态</span></div>
    ${arrivals.slice(0, 4).map((item) => `
      <div class="a-arrival-row">
        <span>${item.time}</span>
        <span class="a-person"><i class="avatar">${item.name.slice(0, 1)}</i><b>${item.name}</b></span>
        <span><strong>${item.room} 房</strong><small>${item.source}预订</small></span>
        <span>${item.status}</span>
        <span class="a-status arrival">待入住</span>
      </div>`).join('')}`;

  document.getElementById('aTasks').innerHTML = tasks.map((task) => `
    <div class="a-task">
      <span class="a-task-icon"><svg><use href="#i-${task.icon}"></use></svg></span>
      <div><strong>${task.room} · ${task.title}</strong><small>${task.person}</small></div>
      <button>完成</button>
    </div>`).join('');
}

function renderFlow() {
  document.getElementById('bFlow').innerHTML = lanes.map((lane) => `
    <section class="b-lane">
      <div class="b-lane-head"><h2>${lane.title}</h2><b>${lane.count}</b></div>
      <div class="b-cards">
        ${lane.cards.map((card) => `
          <article class="b-card ${card.urgent ? 'urgent' : ''}">
            <div class="b-card-head"><strong>${card.room}</strong><span>${card.time}</span></div>
            <p>${card.name}</p><small>${card.meta}</small>
            <footer><span>详情</span><span>操作 →</span></footer>
          </article>`).join('')}
      </div>
    </section>`).join('');
}

function renderLedger() {
  document.getElementById('cLedgerRows').innerHTML = ledgerRows.map((row, index) => `
    <div class="c-ledger-row ${index === 2 ? 'selected' : ''}">
      <span class="c-room-code">${row[0]}</span>
      <span class="c-state ${row[1] === '在住' ? 'inhouse' : row[1] === '已预订' ? 'arrival' : 'cleaning'}">${row[1]}</span>
      <span>${row[2]}</span><span>${row[3]}</span><span class="c-money">${row[4]}</span><span>${row[5]}</span>
    </div>`).join('');
}

const variants = [
  { key: 'A', label: 'A · 值班控制台' },
  { key: 'B', label: 'B · 宾客旅程' },
  { key: 'C', label: 'C · 客房台账' }
];

function getVariant() {
  const key = new URLSearchParams(window.location.search).get('variant')?.toUpperCase();
  return variants.some((item) => item.key === key) ? key : 'A';
}

function setVariant(key, updateUrl = true) {
  const variant = variants.find((item) => item.key === key) || variants[0];
  document.body.dataset.variant = variant.key;
  document.getElementById('variantLabel').textContent = variant.label;
  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant.key);
    window.history.replaceState({}, '', url);
  }
}

function cycleVariant(step) {
  const currentIndex = variants.findIndex((item) => item.key === getVariant());
  const nextIndex = (currentIndex + step + variants.length) % variants.length;
  setVariant(variants[nextIndex].key);
}

const overlay = document.getElementById('previewOverlay');

function openPreview(title) {
  document.getElementById('previewTitle').textContent = title;
  overlay.hidden = false;
  document.getElementById('cancelPreview').focus();
}

function closePreview() {
  overlay.hidden = true;
}

document.getElementById('prevVariant').addEventListener('click', () => cycleVariant(-1));
document.getElementById('nextVariant').addEventListener('click', () => cycleVariant(1));
document.getElementById('closePreview').addEventListener('click', closePreview);
document.getElementById('cancelPreview').addEventListener('click', closePreview);
document.getElementById('confirmPreview').addEventListener('click', closePreview);
overlay.addEventListener('click', (event) => { if (event.target === overlay) closePreview(); });

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-preview]');
  if (trigger) openPreview(trigger.dataset.preview);
});

document.addEventListener('keydown', (event) => {
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
  if (typing) return;
  if (event.key === 'ArrowLeft') cycleVariant(-1);
  if (event.key === 'ArrowRight') cycleVariant(1);
  if (event.key === 'Escape') closePreview();
});

renderRoomBoards();
renderArrivalsAndTasks();
renderFlow();
renderLedger();
setVariant(getVariant(), false);
