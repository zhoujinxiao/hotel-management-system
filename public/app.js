const els = {
  app: document.getElementById('app'),
  view: document.getElementById('view'),
  loading: document.getElementById('loadingState'),
  sidebar: document.getElementById('sidebar'),
  scrim: document.getElementById('mobileScrim'),
  menuButton: document.getElementById('menuButton'),
  todayLabel: document.getElementById('todayLabel'),
  arrivalBadge: document.getElementById('arrivalBadge'),
  sidebarTaskCount: document.getElementById('sidebarTaskCount'),
  notificationDot: document.getElementById('notificationDot'),
  modalRoot: document.getElementById('modalRoot'),
  drawerRoot: document.getElementById('drawerRoot'),
  toastRegion: document.getElementById('toastRegion'),
  globalSearch: document.getElementById('globalSearch'),
};

const ui = {
  route: 'dashboard',
  roomFloor: 'all',
  roomStatus: 'all',
  bookingStatus: 'all',
  bookingSearch: '',
  guestSearch: '',
  modalReturnFocus: null,
  drawerReturnFocus: null,
};

let appData = null;

const roomStatusLabels = {
  available: '可售',
  occupied: '在住',
  reserved: '已预订',
  cleaning: '待清洁',
  maintenance: '维修中',
};

const bookingStatusLabels = {
  confirmed: '待入住',
  in_house: '在住',
  completed: '已完成',
};

const taskTypeLabels = {
  cleaning: '客房任务',
  maintenance: '工程任务',
  vip: '贵宾接待',
  service: '宾客服务',
};

const icon = (name, className = '') => `<svg class="${className}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function todayString() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseDate(dateString) {
  return new Date(`${dateString}T12:00:00`);
}

function formatDate(dateString, includeYear = false) {
  if (!dateString) return '—';
  const date = parseDate(dateString);
  return new Intl.DateTimeFormat('zh-CN', {
    year: includeYear ? 'numeric' : undefined,
    month: 'numeric',
    day: 'numeric',
  }).format(date);
}

function formatDateRange(checkIn, checkOut) {
  return `${formatDate(checkIn)} — ${formatDate(checkOut)}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function initials(name) {
  return String(name || '宾').trim().slice(0, 1);
}

function getRoom(roomId) {
  return appData?.state.rooms.find((room) => room.id === roomId);
}

function getGuest(guestId) {
  return appData?.state.guests.find((guest) => guest.id === guestId);
}

function getBooking(bookingId) {
  return appData?.state.bookings.find((booking) => booking.id === bookingId);
}

function applyPayload(payload) {
  if (payload?.state) appData = { state: payload.state, summary: payload.summary };
  updateShellSummary();
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || '操作失败，请稍后重试');
  return payload;
}

function showToast(title, message = '', type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast${type === 'error' ? ' is-error' : ''}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.innerHTML = `
    ${icon(type === 'error' ? 'warning' : 'check')}
    <div><strong>${escapeHtml(title)}</strong>${message ? `<span>${escapeHtml(message)}</span>` : ''}</div>
    <button type="button" aria-label="关闭提示">${icon('x')}</button>
  `;
  toast.querySelector('button').addEventListener('click', () => toast.remove());
  els.toastRegion.append(toast);
  window.setTimeout(() => toast.remove(), 4200);
}

function updateShellSummary() {
  if (!appData) return;
  const { summary } = appData;
  els.arrivalBadge.textContent = String(summary.arrivals);
  els.sidebarTaskCount.textContent = `${summary.pendingTasks} 项待处理`;
  els.notificationDot.hidden = summary.pendingTasks === 0;
  const date = new Date(`${todayString()}T12:00:00`);
  els.todayLabel.textContent = new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date);
}

function closeMobileNav() {
  els.sidebar.classList.remove('is-open');
  els.scrim.classList.remove('is-open');
  els.menuButton.setAttribute('aria-expanded', 'false');
}

function toggleMobileNav() {
  const isOpen = !els.sidebar.classList.contains('is-open');
  els.sidebar.classList.toggle('is-open', isOpen);
  els.scrim.classList.toggle('is-open', isOpen);
  els.menuButton.setAttribute('aria-expanded', String(isOpen));
}

function setActiveNav(route) {
  document.querySelectorAll('[data-route]').forEach((item) => {
    const active = item.dataset.route === route;
    item.classList.toggle('is-active', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
}

function navigateTo(route) {
  if (window.location.hash === `#/${route}`) renderRoute();
  else window.location.hash = `#/${route}`;
  closeMobileNav();
}

function renderRoute() {
  if (!appData) return;
  const route = window.location.hash.replace(/^#\//, '') || 'dashboard';
  const allowed = ['dashboard', 'bookings', 'rooms', 'frontdesk', 'guests', 'finance'];
  ui.route = allowed.includes(route) ? route : 'dashboard';
  if (!allowed.includes(route)) window.location.hash = '#/dashboard';
  setActiveNav(ui.route);

  const renderers = {
    dashboard: renderDashboard,
    bookings: renderBookings,
    rooms: renderRooms,
    frontdesk: renderFrontdesk,
    guests: renderGuests,
    finance: renderFinance,
  };
  els.view.innerHTML = renderers[ui.route]();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

async function mutate(path, options, success) {
  try {
    const payload = await apiRequest(path, options);
    applyPayload(payload);
    closeDrawer(false);
    closeModal(false);
    renderRoute();
    showToast(success.title, success.message);
    return true;
  } catch (error) {
    showToast('操作未完成', error.message, 'error');
    return false;
  }
}

function emptyState(title, message, iconName = 'file') {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${icon(iconName)}</div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function statusPill(status, label = roomStatusLabels[status]) {
  return `<span class="status-pill ${escapeHtml(status)}">${escapeHtml(label || status)}</span>`;
}

function guestCell(bookingOrGuest) {
  const name = bookingOrGuest.guestName || bookingOrGuest.name;
  return `
    <div class="guest-cell">
      <span class="avatar">${escapeHtml(initials(name))}</span>
      <span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(bookingOrGuest.phone)}</small></span>
    </div>
  `;
}

function taskIcon(task) {
  const name = task.type === 'cleaning' ? 'broom' : task.type === 'maintenance' ? 'warning' : task.type === 'vip' ? 'shield' : 'bell';
  return icon(name);
}

function renderDashboard() {
  const { state, summary } = appData;
  const arrivals = state.bookings
    .filter((booking) => booking.status === 'confirmed' && booking.checkIn === todayString())
    .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
  const activeTasks = state.tasks.filter((task) => task.status !== 'done').slice(0, 5);
  const floors = [1, 2, 3];
  const now = new Date();
  const nowPosition = Math.max(2, Math.min(98, ((now.getHours() + now.getMinutes() / 60 - 6) / 18) * 100));

  return `
    <header class="page-heading">
      <div class="page-heading-copy">
        <p class="date-line">${escapeHtml(els.todayLabel.textContent)} · 早班交接</p>
        <h1>运营工作台</h1>
        <p class="lead">先处理到店、离店和待清洁房，其余工作按节奏推进。</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" type="button" data-action="new-booking">${icon('plus')}新建预订</button>
      </div>
    </header>

    <section class="dashboard-rail" aria-label="今日关键指标">
      <div class="rail-lead">
        <div class="occupancy-number">${summary.occupancyRate}<small>%</small></div>
        <div class="rail-lead-copy">
          <strong>今日入住率</strong>
          <span>${summary.occupied} 间在住 / ${state.rooms.length} 间客房</span>
          <div class="occupancy-bar" aria-hidden="true"><i style="width:${Math.min(summary.occupancyRate, 100)}%"></i></div>
        </div>
      </div>
      <div class="rail-metric">
        <span class="metric-label">${icon('door')}今日到店</span>
        <strong class="metric-value">${summary.arrivals}<small>单</small></strong>
        <span class="metric-note">最早 14:00 开始办理</span>
      </div>
      <div class="rail-metric">
        <span class="metric-label">${icon('key')}今日离店</span>
        <strong class="metric-value">${summary.departures}<small>单</small></strong>
        <span class="metric-note">退房截止 12:00</span>
      </div>
      <div class="rail-metric">
        <span class="metric-label">${icon('users')}在住宾客</span>
        <strong class="metric-value">${summary.inHouseGuests}<small>人</small></strong>
        <span class="metric-note">含儿童与加床</span>
      </div>
      <div class="rail-metric">
        <span class="metric-label">${icon('wallet')}今日入账</span>
        <strong class="metric-value">${Math.round(summary.todayRevenue / 1000)}<small>千元</small></strong>
        <span class="metric-note">${formatCurrency(summary.todayRevenue)}</span>
      </div>
    </section>

    <div class="dashboard-grid">
      <section class="panel rhythm-panel">
        <div class="panel-header">
          <div class="panel-title">
            <h2>今日运营节奏</h2>
            <p>按前台、客房和夜审的关键时间组织工作</p>
          </div>
          <button class="panel-link" type="button" data-nav="frontdesk">前台工作台 ${icon('arrow')}</button>
        </div>
        <div class="rhythm-body">
          <div class="rhythm-track">
            <div class="now-marker" style="left:${nowPosition}%"><span>${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}</span></div>
            <div class="rhythm-block">
              <span class="rhythm-time">08:00 — 11:30</span>
              <strong>退房与清洁</strong>
              <span>${summary.departures} 间离店 · 优先释放可售房</span>
            </div>
            <div class="rhythm-block peak">
              <span class="rhythm-time">11:30 — 15:30</span>
              <strong>房态高峰</strong>
              <span>清洁验收与到店排房同步进行</span>
            </div>
            <div class="rhythm-block peak">
              <span class="rhythm-time">14:00 — 18:30</span>
              <strong>集中到店</strong>
              <span>${summary.arrivals} 单预订 · 核对证件与预授权</span>
            </div>
            <div class="rhythm-block">
              <span class="rhythm-time">18:30 — 00:00</span>
              <strong>夜审准备</strong>
              <span>补录账务 · 核对未到店预订</span>
            </div>
          </div>
        </div>
      </section>

      <section class="panel task-panel">
        <div class="panel-header">
          <div class="panel-title">
            <h2>优先任务</h2>
            <p>${summary.pendingTasks} 项尚未完成</p>
          </div>
          <button class="panel-link" type="button" data-action="open-task-list">全部任务 ${icon('arrow')}</button>
        </div>
        <div class="task-list">
          ${activeTasks.length ? activeTasks.map((task) => `
            <div class="task-item">
              <span class="task-icon ${task.priority === 'high' ? 'high' : ''} ${task.type === 'maintenance' ? 'maintenance' : ''}">${taskIcon(task)}</span>
              <div class="task-copy">
                <strong>${escapeHtml(task.roomNumber)} · ${escapeHtml(task.title)}</strong>
                <span>${escapeHtml(task.assignedTo)} · ${escapeHtml(task.dueTime)} · ${escapeHtml(task.detail)}</span>
              </div>
              <button class="task-action" type="button" data-action="complete-task" data-id="${escapeHtml(task.id)}">完成</button>
            </div>
          `).join('') : emptyState('今日任务已清空', '新的客房和工程任务会出现在这里。', 'check')}
        </div>
      </section>

      <section class="panel room-snapshot">
        <div class="panel-header">
          <div class="panel-title">
            <h2>实时房态</h2>
            <p>${summary.available} 间可售 · ${summary.occupied} 间在住</p>
          </div>
          <button class="panel-link" type="button" data-nav="rooms">打开房态中心 ${icon('arrow')}</button>
        </div>
        <div class="room-snapshot-body">
          <div class="snapshot-floors">
            ${floors.map((floor) => `
              <div class="snapshot-floor">
                <span class="snapshot-floor-label">${floor}F</span>
                <div class="snapshot-rooms">
                  ${state.rooms.filter((room) => room.floor === floor).map((room) => `
                    <button class="room-chip status-${escapeHtml(room.status)}" type="button" data-action="open-room" data-id="${escapeHtml(room.id)}" aria-label="${escapeHtml(room.number)} ${escapeHtml(roomStatusLabels[room.status])}">
                      ${escapeHtml(room.number)}
                    </button>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
          <div class="legend" aria-label="房态图例">
            ${Object.entries(roomStatusLabels).map(([status, label]) => `<span class="legend-item status-${escapeHtml(status)}"><i class="legend-dot"></i>${escapeHtml(label)}</span>`).join('')}
          </div>
        </div>
      </section>

      <section class="panel arrivals-panel">
        <div class="panel-header">
          <div class="panel-title">
            <h2>今日到店</h2>
            <p>按预计到店时间与预订渠道排列</p>
          </div>
          <button class="panel-link" type="button" data-nav="frontdesk">办理入住 ${icon('arrow')}</button>
        </div>
        <div class="compact-table-wrap">
          <table class="compact-table">
            <thead><tr><th>宾客</th><th>房间</th><th>入住晚数</th><th>渠道</th><th>预订备注</th><th>状态</th><th></th></tr></thead>
            <tbody>
              ${arrivals.length ? arrivals.map((booking) => `
                <tr>
                  <td>${guestCell(booking)}</td>
                  <td><span class="room-number">${escapeHtml(booking.roomNumber)}</span><div class="form-hint">${escapeHtml(booking.roomType)}</div></td>
                  <td>${booking.nights} 晚</td>
                  <td>${escapeHtml(booking.channel)}</td>
                  <td>${escapeHtml(booking.notes || '—')}</td>
                  <td>${statusPill(booking.status, bookingStatusLabels[booking.status])}</td>
                  <td class="actions"><button class="row-button" type="button" data-action="open-booking" data-id="${escapeHtml(booking.id)}">查看${icon('arrow')}</button></td>
                </tr>
              `).join('') : `<tr><td class="empty-row" colspan="7">今日暂时没有待入住预订</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}

function renderRooms() {
  const { state } = appData;
  const floors = [...new Set(state.rooms.map((room) => room.floor))].sort();
  const statusOrder = ['available', 'occupied', 'reserved', 'cleaning', 'maintenance'];
  const filtered = state.rooms.filter((room) => {
    const floorMatches = ui.roomFloor === 'all' || String(room.floor) === ui.roomFloor;
    const statusMatches = ui.roomStatus === 'all' || room.status === ui.roomStatus;
    return floorMatches && statusMatches;
  });

  return `
    <header class="page-heading">
      <div class="page-heading-copy">
        <p class="date-line">${escapeHtml(els.todayLabel.textContent)} · 实时同步</p>
        <h1>房态中心</h1>
        <p class="lead">房态变化会影响可售、清洁和排房，请在交接班前完成核对。</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" type="button" data-action="refresh-data">${icon('refresh')}刷新房态</button>
        <button class="btn btn-primary" type="button" data-action="new-booking">${icon('plus')}新建预订</button>
      </div>
    </header>

    <div class="room-legend-bar">
      <div class="room-legend" aria-label="房态图例">
        ${Object.entries(roomStatusLabels).map(([status, label]) => `<span class="legend-item status-${escapeHtml(status)}"><i class="legend-dot"></i>${escapeHtml(label)}</span>`).join('')}
      </div>
      <span class="form-hint">共 ${filtered.length} 间房</span>
    </div>

    <div class="toolbar">
      <div class="toolbar-group" role="group" aria-label="楼层筛选">
        <button class="filter-chip ${ui.roomFloor === 'all' ? 'is-active' : ''}" type="button" data-filter="room-floor" data-value="all">全部楼层</button>
        ${floors.map((floor) => `<button class="filter-chip ${ui.roomFloor === String(floor) ? 'is-active' : ''}" type="button" data-filter="room-floor" data-value="${floor}">${floor}F</button>`).join('')}
      </div>
      <div class="toolbar-group" role="group" aria-label="房态筛选">
        <button class="filter-chip ${ui.roomStatus === 'all' ? 'is-active' : ''}" type="button" data-filter="room-status" data-value="all">全部房态</button>
        ${statusOrder.map((status) => `<button class="filter-chip ${ui.roomStatus === status ? 'is-active' : ''}" type="button" data-filter="room-status" data-value="${status}">${escapeHtml(roomStatusLabels[status])}</button>`).join('')}
      </div>
    </div>

    ${floors.filter((floor) => ui.roomFloor === 'all' || String(floor) === ui.roomFloor).map((floor) => {
      const rooms = filtered.filter((room) => room.floor === floor);
      if (!rooms.length) return '';
      const occupied = rooms.filter((room) => room.status === 'occupied').length;
      return `
        <section class="floor-section">
          <div class="floor-header">
            <h2>${floor} 楼</h2>
            <span>${occupied} 间在住 · ${rooms.filter((room) => room.status === 'available').length} 间可售</span>
          </div>
          <div class="room-grid">
            ${rooms.map((room) => {
              const booking = room.currentBookingId ? getBooking(room.currentBookingId) : null;
              return `
                <button class="room-card status-${escapeHtml(room.status)}" type="button" data-action="open-room" data-id="${escapeHtml(room.id)}">
                  <span class="room-card-top">
                    <span class="room-card-number">${escapeHtml(room.number)}</span>
                    ${statusPill(room.status)}
                  </span>
                  <span class="room-card-type">${escapeHtml(room.type)}</span>
                  <span class="room-card-guest">
                    <strong>${booking ? escapeHtml(booking.guestName) : room.status === 'maintenance' ? '工程处理中' : room.housekeeping}</strong>
                    <span>${booking ? `至 ${escapeHtml(formatDate(booking.checkOut))} 退房` : `标准价 ${formatCurrency(room.rate)}`}</span>
                  </span>
                </button>
              `;
            }).join('')}
          </div>
        </section>
      `;
    }).join('') || emptyState('没有符合条件的房间', '调整楼层或房态筛选后再试。', 'bed')}
  `;
}

function bookingRows(query = ui.bookingSearch) {
  const normalized = query.trim().toLowerCase();
  return appData.state.bookings.filter((booking) => {
    const statusMatches = ui.bookingStatus === 'all' || booking.status === ui.bookingStatus;
    const text = `${booking.id} ${booking.guestName} ${booking.phone} ${booking.roomNumber} ${booking.notes}`.toLowerCase();
    return statusMatches && (!normalized || text.includes(normalized));
  });
}

function renderBookingRows(query = ui.bookingSearch) {
  const bookings = bookingRows(query);
  if (!bookings.length) return `<tr><td class="empty-row" colspan="8">没有找到符合条件的预订</td></tr>`;
  return bookings.map((booking) => `
    <tr>
      <td>${guestCell(booking)}</td>
      <td><span class="mono">${escapeHtml(booking.id)}</span><div class="form-hint">${escapeHtml(booking.channel)}</div></td>
      <td><span class="room-number">${escapeHtml(booking.roomNumber)}</span><div class="form-hint">${escapeHtml(booking.roomType)}</div></td>
      <td>${escapeHtml(formatDateRange(booking.checkIn, booking.checkOut))}<div class="form-hint">${booking.nights} 晚 · ${booking.adults} 成人</div></td>
      <td>${statusPill(booking.status, bookingStatusLabels[booking.status])}</td>
      <td>${formatCurrency(booking.totalAmount)}<div class="form-hint">已收 ${formatCurrency(booking.paidAmount)}</div></td>
      <td>${escapeHtml(booking.notes || '—')}</td>
      <td class="actions"><button class="row-button" type="button" data-action="open-booking" data-id="${escapeHtml(booking.id)}">详情${icon('arrow')}</button></td>
    </tr>
  `).join('');
}

function renderBookings() {
  const bookings = bookingRows();
  return `
    <header class="page-heading">
      <div class="page-heading-copy">
        <p class="date-line">渠道、排房与到店信息</p>
        <h1>预订管理</h1>
        <p class="lead">在同一张表里核对预订、房型、收款和宾客特殊需求。</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" type="button" data-action="new-booking">${icon('plus')}新建预订</button>
      </div>
    </header>

    <div class="toolbar">
      <label class="search-field">
        ${icon('search')}
        <input id="bookingSearch" type="search" value="${escapeHtml(ui.bookingSearch)}" placeholder="搜索姓名、手机号、房号或预订号" autocomplete="off" />
      </label>
      <div class="toolbar-group" role="group" aria-label="预订状态筛选">
        <button class="filter-chip ${ui.bookingStatus === 'all' ? 'is-active' : ''}" type="button" data-filter="booking-status" data-value="all">全部</button>
        ${Object.entries(bookingStatusLabels).map(([status, label]) => `<button class="filter-chip ${ui.bookingStatus === status ? 'is-active' : ''}" type="button" data-filter="booking-status" data-value="${status}">${escapeHtml(label)}</button>`).join('')}
      </div>
    </div>

    <section class="data-panel">
      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr><th>宾客</th><th>预订号</th><th>房间</th><th>入住日期</th><th>状态</th><th>房费</th><th>备注</th><th></th></tr></thead>
          <tbody id="bookingRows">${renderBookingRows()}</tbody>
        </table>
      </div>
      <p class="table-note" id="bookingCount">共 ${bookings.length} 条记录 · 金额均为人民币含税房价</p>
    </section>
  `;
}

function frontdeskCard(booking, type) {
  const departure = type === 'departure';
  const outstanding = Math.max(0, booking.totalAmount - booking.paidAmount);
  return `
    <article class="frontdesk-card ${departure ? 'is-departure' : ''}">
      <div class="room-plate">${escapeHtml(booking.roomNumber)}</div>
      <div class="frontdesk-copy">
        <strong>${escapeHtml(booking.guestName)} ${getGuest(booking.guestId)?.vip ? statusPill('vip', '贵宾') : ''}</strong>
        <span>${escapeHtml(booking.phone)} · ${escapeHtml(booking.roomType)}</span>
        <small>${icon('clock')}${departure ? `退房截止 12:00 · 待结 ${formatCurrency(outstanding)}` : `预订 ${escapeHtml(booking.channel)} · ${booking.nights} 晚 · 预付 ${formatCurrency(booking.paidAmount)}`}</small>
      </div>
      <div class="frontdesk-actions">
        <span class="checkin-time">${departure ? '今日离店' : '预计 14:00'}</span>
        <button class="btn ${departure ? 'btn-copper' : 'btn-primary'} btn-sm" type="button" data-action="${departure ? 'checkout' : 'checkin'}" data-id="${escapeHtml(booking.id)}">
          ${icon(departure ? 'wallet' : 'key')}${departure ? '办理退房' : '办理入住'}
        </button>
      </div>
    </article>
  `;
}

function renderFrontdesk() {
  const today = todayString();
  const arrivals = appData.state.bookings.filter((booking) => booking.status === 'confirmed' && booking.checkIn === today);
  const departures = appData.state.bookings.filter((booking) => booking.status === 'in_house' && booking.checkOut === today);
  const outstanding = departures.reduce((sum, booking) => sum + Math.max(0, booking.totalAmount - booking.paidAmount), 0);
  return `
    <header class="page-heading">
      <div class="page-heading-copy">
        <p class="date-line">${escapeHtml(els.todayLabel.textContent)} · 前台交接</p>
        <h1>入住与退房</h1>
        <p class="lead">先核对证件与预订，再处理预授权；退房时确认房账和房间状态。</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" type="button" data-action="open-task-list">${icon('bell')}查看待办</button>
      </div>
    </header>

    <div class="folio-summary">
      <div class="folio-metric"><span>待办理入住</span><strong>${arrivals.length} 单</strong></div>
      <div class="folio-metric"><span>今日预计离店</span><strong>${departures.length} 单</strong></div>
      <div class="folio-metric"><span>退房待结金额</span><strong>${formatCurrency(outstanding)}</strong></div>
    </div>

    <div class="frontdesk-grid" style="margin-top:20px">
      <section class="frontdesk-column">
        <div class="panel-header" style="padding-left:0;padding-right:0">
          <div class="panel-title"><h2>今日到店</h2><p>核验预订后办理入住并发放房卡</p></div>
          <span class="form-hint">${arrivals.length} 单</span>
        </div>
        <div class="frontdesk-list">
          ${arrivals.length ? arrivals.map((booking) => frontdeskCard(booking, 'arrival')).join('') : emptyState('到店宾客已处理完毕', '新的到店任务会实时出现在这里。', 'check')}
        </div>
      </section>
      <section class="frontdesk-column">
        <div class="panel-header" style="padding-left:0;padding-right:0">
          <div class="panel-title"><h2>今日离店</h2><p>确认账务、回收房卡并通知客房部</p></div>
          <span class="form-hint">${departures.length} 单</span>
        </div>
        <div class="frontdesk-list">
          ${departures.length ? departures.map((booking) => frontdeskCard(booking, 'departure')).join('') : emptyState('今日退房已处理完毕', '房间清洁任务会自动进入客房工作流。', 'check')}
        </div>
      </section>
    </div>
  `;
}

function renderGuests() {
  const normalized = ui.guestSearch.trim().toLowerCase();
  const guests = appData.state.guests.filter((guest) => {
    const text = `${guest.name} ${guest.phone} ${guest.city} ${guest.memberLevel}`.toLowerCase();
    return !normalized || text.includes(normalized);
  });
  return `
    <header class="page-heading">
      <div class="page-heading-copy">
        <p class="date-line">偏好、历史与会员信息</p>
        <h1>宾客档案</h1>
        <p class="lead">记录宾客偏好与住店历史，让下一次接待更自然，而不是重新询问。</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" type="button" data-action="new-booking">${icon('plus')}新增宾客并预订</button>
      </div>
    </header>
    <div class="toolbar">
      <label class="search-field">
        ${icon('search')}
        <input id="guestSearch" type="search" value="${escapeHtml(ui.guestSearch)}" placeholder="搜索姓名、手机号、城市或会员等级" autocomplete="off" />
      </label>
      <span class="form-hint">共 ${guests.length} 位宾客</span>
    </div>
    <section class="data-panel">
      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr><th>宾客</th><th>城市</th><th>会员等级</th><th>住店次数</th><th>常住偏好</th><th>当前状态</th><th></th></tr></thead>
          <tbody>
            ${guests.length ? guests.map((guest) => {
              const currentBooking = appData.state.bookings.find((booking) => booking.guestId === guest.id && booking.status === 'in_house');
              return `
                <tr>
                  <td><div class="guest-profile-cell"><span class="avatar">${escapeHtml(initials(guest.name))}</span><span><strong>${escapeHtml(guest.name)}</strong><small>${escapeHtml(guest.phone)}</small></span></div></td>
                  <td>${escapeHtml(guest.city || '未记录')}</td>
                  <td>${guest.vip ? statusPill('vip', guest.memberLevel) : escapeHtml(guest.memberLevel)}</td>
                  <td>${guest.stays} 次</td>
                  <td>${escapeHtml(guest.preferences || '无特殊偏好')}</td>
                  <td>${currentBooking ? statusPill('in_house', `${currentBooking.roomNumber} 在住`) : '<span class="form-hint">未在住</span>'}</td>
                  <td class="actions"><button class="row-button" type="button" data-action="open-guest" data-id="${escapeHtml(guest.id)}">档案${icon('arrow')}</button></td>
                </tr>
              `;
            }).join('') : `<tr><td class="empty-row" colspan="7">没有找到符合条件的宾客</td></tr>`}
          </tbody>
        </table>
      </div>
      <p class="table-note">客人隐私信息仅限授权员工查看，演示数据均为虚构。</p>
    </section>
  `;
}

function lastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => addDays(todayString(), index - 6));
}

function renderFinance() {
  const { state, summary } = appData;
  const days = lastSevenDays();
  const series = days.map((date) => ({
    date,
    revenue: state.payments
      .filter((payment) => payment.status === 'paid' && payment.paidAt === date)
      .reduce((sum, payment) => sum + Number(payment.amount), 0),
  }));
  const maxRevenue = Math.max(...series.map((item) => item.revenue), 1);
  const pending = state.payments.filter((payment) => payment.status === 'pending');
  const pendingAmount = pending.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const roomRevenue = state.payments.filter((payment) => payment.status === 'paid' && ['room', 'deposit'].includes(payment.category)).reduce((sum, payment) => sum + Number(payment.amount), 0);
  const revpar = roomRevenue / state.rooms.length;
  const recentPayments = [...state.payments].sort((a, b) => b.paidAt.localeCompare(a.paidAt)).slice(0, 8);

  return `
    <header class="page-heading">
      <div class="page-heading-copy">
        <p class="date-line">营收、房账与支付方式</p>
        <h1>账单与收款</h1>
        <p class="lead">把房费、定金和住店消费放在同一视角，退房前优先处理未结金额。</p>
      </div>
      <div class="page-actions"><button class="btn btn-secondary" type="button" data-action="refresh-data">${icon('refresh')}刷新账务</button></div>
    </header>
    <section class="dashboard-rail" aria-label="今日账务指标">
      <div class="rail-lead">
        <div class="occupancy-number">${Math.round(summary.todayRevenue / 1000)}<small>千</small></div>
        <div class="rail-lead-copy"><strong>今日已入账</strong><span>${formatCurrency(summary.todayRevenue)}</span><div class="occupancy-bar"><i style="width:${Math.min((summary.todayRevenue / Math.max(maxRevenue, 1)) * 100, 100)}%"></i></div></div>
      </div>
      <div class="rail-metric"><span class="metric-label">${icon('warning')}待结金额</span><strong class="metric-value">${formatCurrency(pendingAmount)}</strong><span class="metric-note">${pending.length} 笔住店消费</span></div>
      <div class="rail-metric"><span class="metric-label">${icon('bed')}平均可售房收入</span><strong class="metric-value">${formatCurrency(revpar)}</strong><span class="metric-note">按全部房间计算 RevPAR</span></div>
      <div class="rail-metric"><span class="metric-label">${icon('calendar')}累计收款</span><strong class="metric-value">${formatCurrency(roomRevenue)}</strong><span class="metric-note">房费与预订定金</span></div>
      <div class="rail-metric"><span class="metric-label">${icon('shield')}账务状态</span><strong class="metric-value" style="font-size:18px">已日清</strong><span class="metric-note">最近核对 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span></div>
    </section>
    <div class="finance-layout">
      <section class="panel">
        <div class="panel-header"><div class="panel-title"><h2>近 7 日实收</h2><p>按实际到账日期统计，不含待入账房账</p></div><span class="form-hint">单位：元</span></div>
        <div class="revenue-chart-body">
          <div class="bar-chart" role="img" aria-label="近七日收入柱状图">
            ${series.map((item) => {
              const height = Math.max(6, Math.round((item.revenue / maxRevenue) * 168));
              const isToday = item.date === todayString();
              const label = new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(parseDate(item.date));
              return `<div class="bar-column ${isToday ? 'today' : ''}"><span class="bar-value">${item.revenue ? Math.round(item.revenue / 100) / 10 + 'k' : '0'}</span><i class="bar" style="height:${height}px"></i><span class="bar-day">${isToday ? '今日' : label}</span></div>`;
            }).join('')}
          </div>
        </div>
      </section>
      <div class="finance-stack">
        <section class="panel">
          <div class="panel-header"><div class="panel-title"><h2>待结房账</h2><p>退房前确认入账或转应收</p></div><span class="status-pill pending">${pending.length} 笔</span></div>
          <div class="payment-list">
            ${pending.length ? pending.map((payment) => `
              <div class="payment-item">
                <span class="payment-icon">${icon('wallet')}</span>
                <div class="payment-copy"><strong>${escapeHtml(payment.guestName)} · ${escapeHtml(payment.description)}</strong><span>${escapeHtml(payment.method)} · ${escapeHtml(formatDate(payment.paidAt))}</span></div>
                <span class="payment-amount pending">${formatCurrency(payment.amount)}</span>
              </div>
            `).join('') : emptyState('没有待结房账', '住店消费完成后会显示在这里。', 'check')}
          </div>
        </section>
      </div>
    </div>
    <section class="data-panel" style="margin-top:18px">
      <div class="panel-header"><div class="panel-title"><h2>最近收款</h2><p>预授权、房费和住店服务</p></div></div>
      <div class="data-table-wrap">
        <table class="data-table" style="min-width:760px">
          <thead><tr><th>流水号</th><th>宾客</th><th>项目</th><th>支付方式</th><th>日期</th><th>状态</th><th>金额</th></tr></thead>
          <tbody>
            ${recentPayments.map((payment) => `
              <tr><td class="mono">${escapeHtml(payment.id)}</td><td>${escapeHtml(payment.guestName)}</td><td>${escapeHtml(payment.description)}</td><td>${escapeHtml(payment.method)}</td><td>${escapeHtml(formatDate(payment.paidAt))}</td><td>${statusPill(payment.status, payment.status === 'paid' ? '已入账' : '待入账')}</td><td class="mono">${formatCurrency(payment.amount)}</td></tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function syncBodyLock() {
  const locked = Boolean(els.modalRoot.firstElementChild || els.drawerRoot.firstElementChild);
  document.body.classList.toggle('no-scroll', locked);
}

function openDrawer({ title, subtitle, body, footer = '' }) {
  ui.drawerReturnFocus = document.activeElement;
  els.drawerRoot.innerHTML = `
    <div class="overlay" data-layer="drawer">
      <section class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawerTitle">
        <header class="drawer-header">
          <div><h2 id="drawerTitle">${escapeHtml(title)}</h2>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div>
          <button class="icon-button" type="button" data-action="close-drawer" aria-label="关闭">${icon('x')}</button>
        </header>
        <div class="drawer-body">${body}</div>
        ${footer ? `<footer class="drawer-footer">${footer}</footer>` : ''}
      </section>
    </div>
  `;
  syncBodyLock();
  requestAnimationFrame(() => els.drawerRoot.querySelector('[data-action="close-drawer"]')?.focus());
}

function closeDrawer(restoreFocus = true) {
  els.drawerRoot.innerHTML = '';
  syncBodyLock();
  if (restoreFocus && ui.drawerReturnFocus instanceof HTMLElement) ui.drawerReturnFocus.focus();
}

function openModal(content, onOpen) {
  ui.modalReturnFocus = document.activeElement;
  els.modalRoot.innerHTML = content;
  syncBodyLock();
  requestAnimationFrame(() => onOpen?.());
}

function closeModal(restoreFocus = true) {
  els.modalRoot.innerHTML = '';
  syncBodyLock();
  if (restoreFocus && ui.modalReturnFocus instanceof HTMLElement) ui.modalReturnFocus.focus();
}

function openRoomDrawer(roomId) {
  const room = getRoom(roomId);
  if (!room) return;
  const booking = room.currentBookingId ? getBooking(room.currentBookingId) : null;
  const guest = booking ? getGuest(booking.guestId) : null;
  const statusActions = Object.entries(roomStatusLabels).map(([status, label]) => `
    <button class="btn btn-secondary btn-sm ${room.status === status ? 'is-current' : ''}" type="button" data-action="set-room-status" data-id="${escapeHtml(room.id)}" data-status="${escapeHtml(status)}" ${room.status === status ? 'disabled' : ''}>
      <span class="room-status-dot status-${escapeHtml(status)}"></span>${escapeHtml(label)}
    </button>
  `).join('');

  openDrawer({
    title: `${room.number} · ${room.type}`,
    subtitle: `${room.floor} 楼 · 标准价 ${formatCurrency(room.rate)}`,
    body: `
      <div class="detail-grid">
        <div class="detail-field"><span>当前房态</span><strong>${statusPill(room.status)}</strong></div>
        <div class="detail-field"><span>客房清洁</span><strong>${escapeHtml(room.housekeeping)}</strong></div>
        <div class="detail-field wide"><span>住客</span><strong>${booking ? `${escapeHtml(booking.guestName)} · ${escapeHtml(booking.phone)}` : '当前无住客'}</strong></div>
        ${booking ? `
          <div class="detail-field"><span>入住日期</span><strong>${escapeHtml(formatDate(booking.checkIn))}</strong></div>
          <div class="detail-field"><span>退房日期</span><strong>${escapeHtml(formatDate(booking.checkOut))}</strong></div>
          <div class="detail-field"><span>预订渠道</span><strong>${escapeHtml(booking.channel)}</strong></div>
          <div class="detail-field"><span>房账余额</span><strong>${formatCurrency(Math.max(0, booking.totalAmount - booking.paidAmount))}</strong></div>
        ` : ''}
        <div class="detail-field wide"><span>特殊备注</span><strong>${escapeHtml(booking?.notes || room.notes || '无')}</strong></div>
      </div>
      ${guest ? `<div class="detail-section"><h3>宾客偏好</h3><div class="detail-field"><strong>${escapeHtml(guest.preferences)}</strong><span>${escapeHtml(guest.memberLevel)} · 历史住店 ${guest.stays} 次</span></div></div>` : ''}
      <div class="detail-section">
        <h3>调整房态</h3>
        <div class="room-status-actions">${statusActions}</div>
        <p class="form-hint" style="margin-top:8px">房态变更会立即同步到工作台和客房任务。</p>
      </div>
    `,
    footer: `
      ${(['available', 'reserved'].includes(room.status) ? `<button class="btn btn-primary" type="button" data-action="new-booking-room" data-id="${escapeHtml(room.id)}">${icon('plus')}为这间房建预订</button>` : '')}
      <button class="btn btn-secondary" type="button" data-action="close-drawer">关闭</button>
    `,
  });
}

function openBookingDrawer(bookingId) {
  const booking = getBooking(bookingId);
  if (!booking) return;
  const room = getRoom(booking.roomId);
  const action = booking.status === 'confirmed'
    ? `<button class="btn btn-primary" type="button" data-action="checkin" data-id="${escapeHtml(booking.id)}">${icon('key')}办理入住</button>`
    : booking.status === 'in_house'
      ? `<button class="btn btn-copper" type="button" data-action="checkout" data-id="${escapeHtml(booking.id)}">${icon('wallet')}办理退房</button>`
      : `<button class="btn btn-secondary" type="button" data-action="close-drawer">收起</button>`;
  openDrawer({
    title: `${booking.guestName} · ${booking.id}`,
    subtitle: `${booking.roomNumber} ${booking.roomType} · ${booking.nights} 晚`,
    body: `
      <div class="detail-grid">
        <div class="detail-field"><span>预订状态</span><strong>${statusPill(booking.status, bookingStatusLabels[booking.status])}</strong></div>
        <div class="detail-field"><span>预订渠道</span><strong>${escapeHtml(booking.channel)}</strong></div>
        <div class="detail-field wide"><span>入住日期</span><strong>${escapeHtml(formatDateRange(booking.checkIn, booking.checkOut))}</strong></div>
        <div class="detail-field"><span>房费总额</span><strong>${formatCurrency(booking.totalAmount)}</strong></div>
        <div class="detail-field"><span>已收金额</span><strong>${formatCurrency(booking.paidAmount)}</strong></div>
        <div class="detail-field wide"><span>宾客备注</span><strong>${escapeHtml(booking.notes || '无')}</strong></div>
        <div class="detail-field"><span>联系电话</span><strong>${escapeHtml(booking.phone)}</strong></div>
        <div class="detail-field"><span>房间标准价</span><strong>${formatCurrency(room?.rate || booking.rate)}</strong></div>
      </div>
      <div class="detail-section">
        <h3>预订进度</h3>
        <div class="timeline">
          <div class="timeline-item"><span class="timeline-dot"></span><div><strong>预订已创建</strong><span>${escapeHtml(formatDate(booking.createdAt, true))} · ${escapeHtml(booking.channel)}</span></div></div>
          <div class="timeline-item"><span class="timeline-dot"></span><div><strong>${booking.status === 'confirmed' ? '等待到店' : '宾客已入住'}</strong><span>${escapeHtml(formatDate(booking.checkIn, true))} · ${escapeHtml(booking.roomNumber)} 房</span></div></div>
          <div class="timeline-item"><span class="timeline-dot" style="opacity:${booking.status === 'completed' ? 1 : .35}"></span><div><strong>${booking.status === 'completed' ? '订单已完成' : '计划退房'}</strong><span>${escapeHtml(formatDate(booking.checkOut, true))}</span></div></div>
        </div>
      </div>
    `,
    footer: `${action}<button class="btn btn-ghost" type="button" data-action="close-drawer">关闭</button>`,
  });
}

function openGuestDrawer(guestId) {
  const guest = getGuest(guestId);
  if (!guest) return;
  const bookings = appData.state.bookings.filter((booking) => booking.guestId === guest.id).sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  openDrawer({
    title: guest.name,
    subtitle: `${guest.memberLevel} · 常住 ${guest.city || '城市未记录'}`,
    body: `
      <div class="detail-grid">
        <div class="detail-field wide"><span>联系电话</span><strong>${escapeHtml(guest.phone)}</strong></div>
        <div class="detail-field"><span>住店次数</span><strong>${guest.stays} 次</strong></div>
        <div class="detail-field"><span>会员状态</span><strong>${guest.vip ? '贵宾客户' : '普通客户'}</strong></div>
        <div class="detail-field wide"><span>常住偏好</span><strong>${escapeHtml(guest.preferences)}</strong></div>
      </div>
      <div class="detail-section">
        <h3>住店记录</h3>
        <div class="timeline">
          ${bookings.length ? bookings.slice(0, 6).map((booking) => `
            <div class="timeline-item"><span class="timeline-dot"></span><div><strong>${escapeHtml(booking.roomNumber)} · ${escapeHtml(booking.roomType)}</strong><span>${escapeHtml(formatDateRange(booking.checkIn, booking.checkOut))} · ${escapeHtml(bookingStatusLabels[booking.status])}</span></div></div>
          `).join('') : '<p class="form-hint">暂无住店记录</p>'}
        </div>
      </div>
    `,
    footer: `<button class="btn btn-primary" type="button" data-action="new-booking">${icon('plus')}为宾客新建预订</button><button class="btn btn-ghost" type="button" data-action="close-drawer">关闭</button>`,
  });
}

function openTaskListDrawer() {
  const tasks = appData.state.tasks.filter((task) => task.status !== 'done');
  openDrawer({
    title: '待处理任务',
    subtitle: `${tasks.length} 项客房、工程与宾客服务任务`,
    body: `
      <div class="task-list" style="padding:0">
        ${tasks.length ? tasks.map((task) => `
          <div class="task-item">
            <span class="task-icon ${task.priority === 'high' ? 'high' : ''} ${task.type === 'maintenance' ? 'maintenance' : ''}">${taskIcon(task)}</span>
            <div class="task-copy"><strong>${escapeHtml(task.roomNumber)} · ${escapeHtml(task.title)}</strong><span>${escapeHtml(taskTypeLabels[task.type])} · ${escapeHtml(task.assignedTo)} · ${escapeHtml(task.dueTime)}</span></div>
            <button class="task-action" type="button" data-action="complete-task" data-id="${escapeHtml(task.id)}">完成</button>
          </div>
        `).join('') : emptyState('没有待处理任务', '当前班次任务已全部完成。', 'check')}
      </div>
    `,
    footer: '<button class="btn btn-secondary" type="button" data-action="close-drawer">关闭</button>',
  });
}

function openBookingModal(roomId = '') {
  const preferredRoom = roomId ? getRoom(roomId) : null;
  const availableRooms = [...appData.state.rooms]
    .filter((room) => ['available', 'reserved'].includes(room.status))
    .sort((a, b) => a.number.localeCompare(b.number));
  const defaultRoom = preferredRoom || availableRooms[0];
  const checkIn = todayString();
  const checkOut = addDays(checkIn, 1);
  const roomOptions = availableRooms.map((room) => `<option value="${escapeHtml(room.id)}" ${defaultRoom?.id === room.id ? 'selected' : ''}>${escapeHtml(room.number)} · ${escapeHtml(room.type)} · ${formatCurrency(room.rate)}</option>`).join('');

  openModal(`
    <div class="modal-overlay" data-layer="modal">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <header class="modal-header">
          <div><h2 id="modalTitle">新建预订</h2><p>创建后房间会进入已预订状态，入住时再转为在住。</p></div>
          <button class="icon-button" type="button" data-action="close-modal" aria-label="关闭">${icon('x')}</button>
        </header>
        <form id="bookingForm" novalidate>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-field"><label for="guestName">宾客姓名 <span class="required">*</span></label><input id="guestName" name="guestName" autocomplete="name" required /><span class="form-error">请输入宾客姓名</span></div>
              <div class="form-field"><label for="phone">手机号码 <span class="required">*</span></label><input id="phone" name="phone" inputmode="tel" autocomplete="tel" required /><span class="form-error">请输入联系电话</span></div>
              <div class="form-field wide"><label for="roomId">房间 <span class="required">*</span></label><select id="roomId" name="roomId" required>${roomOptions}</select><span class="form-error">请选择房间</span></div>
              <div class="form-field"><label for="checkIn">到店日期 <span class="required">*</span></label><input id="checkIn" name="checkIn" type="date" value="${checkIn}" required /></div>
              <div class="form-field"><label for="checkOut">离店日期 <span class="required">*</span></label><input id="checkOut" name="checkOut" type="date" value="${checkOut}" required /><span class="form-error">离店日期必须晚于到店日期</span></div>
              <div class="form-field"><label for="adults">成人数</label><input id="adults" name="adults" type="number" min="1" max="6" value="2" inputmode="numeric" /></div>
              <div class="form-field"><label for="children">儿童数</label><input id="children" name="children" type="number" min="0" max="4" value="0" inputmode="numeric" /></div>
              <div class="form-field"><label for="channel">预订渠道</label><select id="channel" name="channel"><option>直订</option><option>携程</option><option>飞猪</option><option>美团</option><option>企业协议</option></select></div>
              <div class="form-field"><label for="rate">每晚房价</label><input id="rate" name="rate" type="number" min="0" step="1" value="${Number(defaultRoom?.rate || 428)}" inputmode="decimal" /><span class="form-hint">含税人民币房价</span></div>
              <div class="form-field"><label for="deposit">预订定金</label><input id="deposit" name="deposit" type="number" min="0" step="1" value="0" inputmode="decimal" /><span class="form-hint">大于 0 时创建收款流水</span></div>
              <div class="form-field"><label for="city">常住城市</label><input id="city" name="city" autocomplete="address-level2" /></div>
              <div class="form-field wide"><label for="notes">宾客备注</label><textarea id="notes" name="notes" placeholder="例如：预计 16:00 到店、需要无烟房"></textarea></div>
              <label class="form-field" style="display:flex;align-items:center;gap:8px"><input type="checkbox" name="vip" style="width:18px;height:18px;min-height:auto" /> <span>标记为贵宾宾客</span></label>
              <div class="form-summary"><span>预计房费</span><strong id="bookingTotal">${formatCurrency(Number(defaultRoom?.rate || 428))}</strong></div>
            </div>
          </div>
          <footer class="modal-footer">
            <button class="btn btn-ghost" type="button" data-action="close-modal">取消</button>
            <button class="btn btn-primary" type="submit">${icon('plus')}创建预订</button>
          </footer>
        </form>
      </section>
    </div>
  `, () => {
    document.getElementById('guestName')?.focus();
    updateBookingTotal();
  });
}

function updateBookingTotal() {
  const roomId = document.getElementById('roomId')?.value;
  const checkIn = document.getElementById('checkIn')?.value;
  const checkOut = document.getElementById('checkOut')?.value;
  const rateInput = document.getElementById('rate');
  const total = document.getElementById('bookingTotal');
  if (!roomId || !checkIn || !checkOut || !rateInput || !total) return;
  const selectedRoom = getRoom(roomId);
  if (selectedRoom && rateInput.dataset.userEdited !== 'true') rateInput.value = String(selectedRoom.rate);
  const nights = Math.max(1, Math.round((parseDate(checkOut) - parseDate(checkIn)) / 86400000));
  total.textContent = formatCurrency(Number(rateInput.value || 0) * nights);
}

function clearFormError(field) {
  field?.closest('.form-field')?.classList.remove('has-error');
  field?.removeAttribute('aria-invalid');
}

function markFormError(field) {
  field?.closest('.form-field')?.classList.add('has-error');
  field?.setAttribute('aria-invalid', 'true');
}

async function submitBookingForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  data.vip = form.elements.vip.checked;
  const requiredFields = ['guestName', 'phone', 'roomId', 'checkIn', 'checkOut'];
  let firstInvalid = null;
  requiredFields.forEach((name) => {
    const field = form.elements[name];
    clearFormError(field);
    if (!String(data[name] || '').trim()) {
      markFormError(field);
      firstInvalid ||= field;
    }
  });
  const checkOutField = form.elements.checkOut;
  clearFormError(checkOutField);
  if (data.checkIn && data.checkOut && data.checkOut <= data.checkIn) {
    markFormError(checkOutField);
    firstInvalid ||= checkOutField;
  }
  if (firstInvalid) {
    firstInvalid.focus();
    showToast('请检查预订信息', '必填项或日期范围不完整。', 'error');
    return;
  }
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = '正在创建…';
  try {
    const payload = await apiRequest('/api/bookings', { method: 'POST', body: JSON.stringify(data) });
    applyPayload(payload);
    closeModal();
    renderRoute();
    showToast('预订已创建', `${payload.booking.roomNumber} 房 · ${payload.booking.guestName}`);
  } catch (error) {
    submitButton.disabled = false;
    submitButton.innerHTML = `${icon('plus')}创建预订`;
    showToast('预订创建失败', error.message, 'error');
  }
}

function openSearchDrawer(rawQuery) {
  const query = String(rawQuery || '').trim().toLowerCase();
  if (!query) return;
  const rooms = appData.state.rooms.filter((room) => `${room.number} ${room.type} ${roomStatusLabels[room.status]}`.toLowerCase().includes(query)).slice(0, 5);
  const guests = appData.state.guests.filter((guest) => `${guest.name} ${guest.phone} ${guest.city}`.toLowerCase().includes(query)).slice(0, 5);
  const bookings = appData.state.bookings.filter((booking) => `${booking.id} ${booking.guestName} ${booking.roomNumber} ${booking.phone}`.toLowerCase().includes(query)).slice(0, 5);
  const count = rooms.length + guests.length + bookings.length;
  openDrawer({
    title: `搜索：${rawQuery}`,
    subtitle: count ? `找到 ${count} 条相关记录` : '没有匹配结果',
    body: count ? `
      ${bookings.length ? `<div class="detail-section"><h3>预订</h3><div class="lookup-result">${bookings.map((booking) => `<button class="lookup-item" type="button" data-action="open-booking" data-id="${escapeHtml(booking.id)}"><strong>${escapeHtml(booking.guestName)} · ${escapeHtml(booking.roomNumber)}</strong><span>${escapeHtml(booking.id)} · ${escapeHtml(bookingStatusLabels[booking.status])}</span></button>`).join('')}</div></div>` : ''}
      ${guests.length ? `<div class="detail-section"><h3>宾客</h3><div class="lookup-result">${guests.map((guest) => `<button class="lookup-item" type="button" data-action="open-guest" data-id="${escapeHtml(guest.id)}"><strong>${escapeHtml(guest.name)}</strong><span>${escapeHtml(guest.phone)}</span></button>`).join('')}</div></div>` : ''}
      ${rooms.length ? `<div class="detail-section"><h3>房间</h3><div class="lookup-result">${rooms.map((room) => `<button class="lookup-item" type="button" data-action="open-room" data-id="${escapeHtml(room.id)}"><strong>${escapeHtml(room.number)} · ${escapeHtml(room.type)}</strong><span>${escapeHtml(roomStatusLabels[room.status])}</span></button>`).join('')}</div></div>` : ''}
    ` : emptyState('没有找到匹配记录', '试试输入宾客姓名、手机号、预订号或房号。', 'search'),
    footer: '<button class="btn btn-secondary" type="button" data-action="close-drawer">关闭</button>',
  });
}

async function refreshData(showSuccess = false) {
  try {
    const payload = await apiRequest('/api/state');
    applyPayload(payload);
    renderRoute();
    if (showSuccess) showToast('数据已刷新', '房态、预订和账务均为最新状态。');
  } catch (error) {
    showToast('刷新失败', error.message, 'error');
  }
}

function handleAction(button) {
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (action === 'new-booking') return openBookingModal();
  if (action === 'new-booking-room') {
    closeDrawer(false);
    return openBookingModal(id);
  }
  if (action === 'open-room') return openRoomDrawer(id);
  if (action === 'open-booking') return openBookingDrawer(id);
  if (action === 'open-guest') return openGuestDrawer(id);
  if (action === 'open-task-list') return openTaskListDrawer();
  if (action === 'close-drawer') return closeDrawer();
  if (action === 'close-modal') return closeModal();
  if (action === 'refresh-data') return refreshData(true);
  if (action === 'checkin') return mutate(`/api/bookings/${encodeURIComponent(id)}/checkin`, { method: 'POST' }, { title: '入住已办理', message: '房态已切换为在住，房卡可正常制发。' });
  if (action === 'checkout') return mutate(`/api/bookings/${encodeURIComponent(id)}/checkout`, { method: 'POST' }, { title: '退房已办理', message: '房间已转入待清洁任务。' });
  if (action === 'complete-task') return mutate(`/api/tasks/${encodeURIComponent(id)}/complete`, { method: 'POST' }, { title: '任务已完成', message: '相关房态已按规则同步更新。' });
  if (action === 'set-room-status') {
    return mutate(`/api/rooms/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: button.dataset.status }),
    }, { title: '房态已更新', message: `已调整为${roomStatusLabels[button.dataset.status]}。` });
  }
}

function bindEvents() {
  els.menuButton.addEventListener('click', toggleMobileNav);
  els.scrim.addEventListener('click', closeMobileNav);
  window.addEventListener('hashchange', renderRoute);

  document.getElementById('notificationButton').addEventListener('click', openTaskListDrawer);

  els.globalSearch.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      openSearchDrawer(els.globalSearch.value);
      els.globalSearch.value = '';
    }
  });

  document.addEventListener('keydown', (event) => {
    const tagName = document.activeElement?.tagName;
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName);
    if (event.key === '/' && !typing) {
      event.preventDefault();
      els.globalSearch.focus();
    }
    if (event.key === 'Escape') {
      if (els.modalRoot.firstElementChild) closeModal();
      else if (els.drawerRoot.firstElementChild) closeDrawer();
      else closeMobileNav();
    }
  });

  document.addEventListener('click', (event) => {
    const overlay = event.target.closest('[data-layer]');
    if (overlay && event.target === overlay) {
      if (overlay.dataset.layer === 'modal') closeModal();
      else closeDrawer();
      return;
    }

    const filter = event.target.closest('[data-filter]');
    if (filter) {
      event.preventDefault();
      if (filter.dataset.filter === 'room-floor') ui.roomFloor = filter.dataset.value;
      if (filter.dataset.filter === 'room-status') ui.roomStatus = filter.dataset.value;
      if (filter.dataset.filter === 'booking-status') ui.bookingStatus = filter.dataset.value;
      renderRoute();
      return;
    }

    const nav = event.target.closest('[data-nav]');
    if (nav) {
      event.preventDefault();
      navigateTo(nav.dataset.nav);
      return;
    }

    const action = event.target.closest('[data-action]');
    if (action) {
      event.preventDefault();
      handleAction(action);
    }
  });

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (target.id === 'bookingSearch') {
      ui.bookingSearch = target.value;
      const rows = document.getElementById('bookingRows');
      const count = document.getElementById('bookingCount');
      const matches = bookingRows(target.value);
      if (rows) rows.innerHTML = renderBookingRows(target.value);
      if (count) count.textContent = `共 ${matches.length} 条记录 · 金额均为人民币含税房价`;
    }
    if (target.id === 'guestSearch') {
      ui.guestSearch = target.value;
      const query = target.value.trim().toLowerCase();
      const matches = appData.state.guests.filter((guest) => `${guest.name} ${guest.phone} ${guest.city} ${guest.memberLevel}`.toLowerCase().includes(query));
      const tableBody = target.closest('.toolbar')?.nextElementSibling?.querySelector('tbody');
      if (tableBody) tableBody.innerHTML = matches.length ? matches.map((guest) => {
        const currentBooking = appData.state.bookings.find((booking) => booking.guestId === guest.id && booking.status === 'in_house');
        return `<tr><td><div class="guest-profile-cell"><span class="avatar">${escapeHtml(initials(guest.name))}</span><span><strong>${escapeHtml(guest.name)}</strong><small>${escapeHtml(guest.phone)}</small></span></div></td><td>${escapeHtml(guest.city || '未记录')}</td><td>${guest.vip ? statusPill('vip', guest.memberLevel) : escapeHtml(guest.memberLevel)}</td><td>${guest.stays} 次</td><td>${escapeHtml(guest.preferences || '无特殊偏好')}</td><td>${currentBooking ? statusPill('in_house', `${currentBooking.roomNumber} 在住`) : '<span class="form-hint">未在住</span>'}</td><td class="actions"><button class="row-button" type="button" data-action="open-guest" data-id="${escapeHtml(guest.id)}">档案${icon('arrow')}</button></td></tr>`;
      }).join('') : '<tr><td class="empty-row" colspan="7">没有找到符合条件的宾客</td></tr>';
    }

    if (target.closest('#bookingForm')) {
      if (target.id === 'rate') target.dataset.userEdited = 'true';
      updateBookingTotal();
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target.closest('#bookingForm')) updateBookingTotal();
  });

  document.addEventListener('submit', (event) => {
    if (event.target.id === 'bookingForm') {
      event.preventDefault();
      submitBookingForm(event.target);
    }
  });
}

async function init() {
  bindEvents();
  if (!window.location.hash) window.location.hash = '#/dashboard';
  try {
    const payload = await apiRequest('/api/state');
    applyPayload(payload);
    els.loading.remove();
    els.app.setAttribute('aria-busy', 'false');
    renderRoute();
  } catch (error) {
    els.loading.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${icon('warning')}</div><h3>系统暂时无法连接</h3><p>${escapeHtml(error.message)}</p></div>`;
  }
}

init();

