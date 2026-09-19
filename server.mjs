import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');
const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'hotel.json');
const port = Number(process.env.PORT || 4173);

const roomTypes = {
  king: { name: '高级大床房', rate: 428 },
  twin: { name: '豪华双床房', rate: 468 },
  family: { name: '亲子家庭房', rate: 568 },
  suite: { name: '湖景套房', rate: 988 },
};

const statusByRoom = {
  '101': 'occupied', '102': 'available', '103': 'cleaning', '104': 'reserved',
  '105': 'occupied', '106': 'available', '107': 'maintenance', '108': 'available',
  '201': 'occupied', '202': 'occupied', '203': 'reserved', '204': 'available',
  '205': 'cleaning', '206': 'reserved', '207': 'occupied', '208': 'available',
  '301': 'occupied', '302': 'available', '303': 'occupied', '304': 'cleaning',
  '305': 'reserved', '306': 'occupied', '307': 'available', '308': 'occupied',
};

function dateOffset(offset) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function buildSeed() {
  const rooms = [];
  for (let floor = 1; floor <= 3; floor += 1) {
    for (let index = 1; index <= 8; index += 1) {
      const number = `${floor}0${index}`;
      let type = 'king';
      if (index === 1 || index === 8) type = 'suite';
      else if (index === 2 || index === 7) type = 'family';
      else if (index === 3 || index === 6) type = 'twin';
      rooms.push({
        id: `room-${number}`,
        number,
        floor,
        type: roomTypes[type].name,
        typeKey: type,
        rate: roomTypes[type].rate,
        status: statusByRoom[number],
        housekeeping: statusByRoom[number] === 'cleaning' ? '待清洁' : '已完成',
        currentBookingId: null,
        notes: number === '107' ? '空调滤网待更换' : '',
      });
    }
  }

  const guestDefs = [
    ['G-1001', '张岚', '138 1168 4201', true, '上海'],
    ['G-1002', '周启明', '186 2041 8930', false, '杭州'],
    ['G-1003', '林悦', '139 7782 1106', false, '南京'],
    ['G-1004', '顾思远', '137 5521 7789', true, '苏州'],
    ['G-1005', '陈嘉禾', '158 9013 2274', false, '宁波'],
    ['G-1006', '宋清扬', '133 6705 1198', false, '北京'],
    ['G-1007', '许安', '136 1120 5573', false, '广州'],
    ['G-1008', '沈知意', '189 3307 6621', true, '深圳'],
    ['G-1009', '陆远', '181 9204 8835', false, '成都'],
    ['G-1010', '方宁', '152 6780 3006', false, '厦门'],
    ['G-1011', '程雨', '177 2145 9088', false, '武汉'],
    ['G-1012', '唐望', '135 4410 6732', false, '重庆'],
  ];

  const guests = guestDefs.map(([id, name, phone, vip, city]) => ({
    id,
    name,
    phone,
    vip,
    city,
    memberLevel: vip ? '铂金会员' : '普通会员',
    stays: vip ? 12 : 3,
    preferences: vip ? '高层、无烟、延迟退房' : '无特殊偏好',
  }));

  const bookingDefs = [
    ['BK-26031', '张岚', '101', -1, 1, 'in_house', '携程', '需要无烟房'],
    ['BK-26028', '周启明', '105', -2, 1, 'in_house', '直订', '加一张儿童床'],
    ['BK-26025', '林悦', '201', -1, 2, 'in_house', '飞猪', ''],
    ['BK-26024', '顾思远', '202', 0, 2, 'in_house', '企业协议', '安排高楼层'],
    ['BK-26022', '陈嘉禾', '301', -3, 1, 'in_house', '美团', ''],
    ['BK-26021', '宋清扬', '303', -1, 3, 'in_house', '直订', '晚到 20:00'],
    ['BK-26020', '许安', '306', -2, 0, 'in_house', '携程', '今日中午退房'],
    ['BK-26018', '沈知意', '308', -1, 4, 'in_house', '企业协议', '行政礼遇'],
    ['BK-26040', '陆远', '102', 0, 2, 'confirmed', '直订', '预计 14:30 到店'],
    ['BK-26041', '方宁', '104', 0, 1, 'confirmed', '携程', '预计 16:00 到店'],
    ['BK-26042', '程雨', '203', 0, 3, 'confirmed', '飞猪', ''],
    ['BK-26043', '唐望', '206', 0, 1, 'confirmed', '美团', '高铁 15:10 到达'],
    ['BK-26044', '袁清', '205', 1, 3, 'confirmed', '直订', '亲子房，准备儿童用品'],
    ['BK-26045', '赵辰', '307', 2, 4, 'confirmed', '企业协议', '公司月结'],
    ['BK-25987', '蒋然', '302', -4, -1, 'completed', '携程', ''],
    ['BK-25984', '闻溪', '304', -5, -2, 'completed', '直订', ''],
  ];

  const bookings = bookingDefs.map(([id, guestName, roomNumber, checkInOffset, checkOutOffset, status, channel, notes]) => {
    const guest = guests.find((item) => item.name === guestName) || guests[0];
    const room = rooms.find((item) => item.number === roomNumber);
    const nights = Math.max(1, Math.round((new Date(dateOffset(checkOutOffset)) - new Date(dateOffset(checkInOffset))) / 86400000));
    const totalAmount = room.rate * nights;
    if (status === 'in_house') room.currentBookingId = id;
    return {
      id, guestId: guest.id, guestName, phone: guest.phone, roomId: room.id, roomNumber,
      roomType: room.type, checkIn: dateOffset(checkInOffset), checkOut: dateOffset(checkOutOffset),
      nights, adults: 2, children: 0, status, channel, source: channel, notes,
      rate: room.rate, totalAmount, paidAmount: status === 'completed' ? totalAmount : Math.round(totalAmount * 0.4),
      createdAt: dateOffset(Math.min(checkInOffset - 3, -1)),
    };
  });

  const payments = [];
  bookings.forEach((booking, index) => {
    if (booking.status === 'completed') {
      payments.push({
        id: `PY-${6000 + index}`, bookingId: booking.id, guestName: booking.guestName,
        category: 'room', description: `${booking.roomNumber} 房费结账`, amount: booking.totalAmount,
        method: index % 2 ? '微信支付' : '银行卡', status: 'paid', paidAt: booking.checkOut,
      });
    } else if (booking.status === 'in_house') {
      payments.push({
        id: `PY-${7000 + index}`, bookingId: booking.id, guestName: booking.guestName,
        category: 'deposit', description: `${booking.roomNumber} 预授权`, amount: booking.paidAmount,
        method: index % 2 ? '支付宝' : '微信支付', status: 'paid', paidAt: booking.checkIn === dateOffset(0) ? dateOffset(0) : dateOffset(-1),
      });
    } else {
      payments.push({
        id: `PY-${8000 + index}`, bookingId: booking.id, guestName: booking.guestName,
        category: 'deposit', description: `${booking.roomNumber} 预订定金`, amount: booking.paidAmount,
        method: '在线支付', status: 'paid', paidAt: dateOffset(0),
      });
    }
  });
  payments.push(
    { id: 'PY-9011', bookingId: null, guestName: '张岚', category: 'dining', description: '云水餐厅晚餐', amount: 286, method: '房账', status: 'pending', paidAt: dateOffset(0) },
    { id: 'PY-9012', bookingId: null, guestName: '顾思远', category: 'service', description: '接送机服务', amount: 180, method: '微信支付', status: 'paid', paidAt: dateOffset(0) },
    { id: 'PY-9013', bookingId: null, guestName: '林悦', category: 'dining', description: '客房送餐', amount: 128, method: '房账', status: 'pending', paidAt: dateOffset(0) },
  );

  const tasks = [
    { id: 'T-101', type: 'cleaning', roomId: 'room-103', roomNumber: '103', title: '退房清洁', detail: '预计 45 分钟 · 标准清洁', assignedTo: '王梅', status: 'in_progress', priority: 'high', dueTime: '11:30' },
    { id: 'T-102', type: 'cleaning', roomId: 'room-205', roomNumber: '205', title: '入住前准备', detail: '亲子用品、加湿器', assignedTo: '李芳', status: 'pending', priority: 'high', dueTime: '13:30' },
    { id: 'T-103', type: 'cleaning', roomId: 'room-304', roomNumber: '304', title: '退房清洁', detail: '浴巾补充、地毯吸尘', assignedTo: '周燕', status: 'pending', priority: 'normal', dueTime: '12:00' },
    { id: 'T-104', type: 'maintenance', roomId: 'room-107', roomNumber: '107', title: '空调滤网更换', detail: '工程部已接单', assignedTo: '赵工', status: 'in_progress', priority: 'normal', dueTime: '15:00' },
    { id: 'T-105', type: 'vip', roomId: 'room-308', roomNumber: '308', title: '行政礼遇确认', detail: '欢迎水果、延迟退房至 14:00', assignedTo: '前台班次', status: 'pending', priority: 'high', dueTime: '14:00' },
    { id: 'T-106', type: 'service', roomId: 'room-105', roomNumber: '105', title: '儿童床送达', detail: '宾客预计 18:00 返回', assignedTo: '礼宾部', status: 'pending', priority: 'normal', dueTime: '17:30' },
  ];

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    hotel: { name: '云栖酒店', branch: '湖滨店', address: '杭州市西湖区北山街 88 号', phone: '0571 8866 2088' },
    rooms,
    guests,
    bookings,
    payments,
    tasks,
  };
}

let stateCache = null;

async function loadState() {
  if (stateCache) return stateCache;
  await mkdir(dataDir, { recursive: true });
  if (!existsSync(dataFile)) {
    stateCache = buildSeed();
    await persistState();
    return stateCache;
  }
  stateCache = JSON.parse(await readFile(dataFile, 'utf8'));
  return stateCache;
}

async function persistState() {
  await writeFile(dataFile, JSON.stringify(stateCache, null, 2), 'utf8');
}

function sameDay(value, date = dateOffset(0)) {
  return value === date;
}

function buildSummary(state) {
  const occupied = state.rooms.filter((room) => room.status === 'occupied').length;
  const available = state.rooms.filter((room) => room.status === 'available').length;
  const arrivals = state.bookings.filter((booking) => booking.status === 'confirmed' && sameDay(booking.checkIn));
  const departures = state.bookings.filter((booking) => booking.status === 'in_house' && sameDay(booking.checkOut));
  const todayRevenue = state.payments
    .filter((payment) => payment.status === 'paid' && sameDay(payment.paidAt))
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const pendingTasks = state.tasks.filter((task) => task.status !== 'done').length;
  return {
    occupancyRate: Math.round((occupied / state.rooms.length) * 1000) / 10,
    occupied,
    available,
    arrivals: arrivals.length,
    departures: departures.length,
    todayRevenue,
    pendingTasks,
    inHouseGuests: state.bookings.filter((booking) => booking.status === 'in_house').reduce((sum, booking) => sum + booking.adults + booking.children, 0),
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error('请求内容过大');
  }
  return body ? JSON.parse(body) : {};
}

async function handleApi(req, res, url) {
  const state = await loadState();
  const method = req.method || 'GET';

  if (method === 'GET' && url.pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, service: 'yunqi-hotel-mvp', time: new Date().toISOString() });
  }

  if (method === 'GET' && url.pathname === '/api/state') {
    return sendJson(res, 200, { state, summary: buildSummary(state) });
  }

  if (method === 'POST' && url.pathname === '/api/bookings') {
    const body = await readBody(req);
    const required = ['guestName', 'phone', 'roomId', 'checkIn', 'checkOut'];
    const missing = required.find((field) => !body[field]);
    if (missing) return sendJson(res, 400, { error: `缺少必填字段：${missing}` });
    if (body.checkOut <= body.checkIn) return sendJson(res, 400, { error: '离店日期必须晚于到店日期' });

    const room = state.rooms.find((item) => item.id === body.roomId);
    if (!room) return sendJson(res, 404, { error: '所选房间不存在' });
    const nights = Math.max(1, Math.round((new Date(body.checkOut) - new Date(body.checkIn)) / 86400000));
    const guestId = `G-${Date.now()}`;
    const bookingId = `BK-${String(Date.now()).slice(-6)}`;
    const guest = {
      id: guestId,
      name: String(body.guestName).trim(),
      phone: String(body.phone).trim(),
      vip: Boolean(body.vip),
      city: String(body.city || '').trim(),
      memberLevel: body.vip ? '铂金会员' : '普通会员',
      stays: 1,
      preferences: String(body.notes || '').trim() || '无特殊偏好',
    };
    const booking = {
      id: bookingId,
      guestId,
      guestName: guest.name,
      phone: guest.phone,
      roomId: room.id,
      roomNumber: room.number,
      roomType: room.type,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      nights,
      adults: Number(body.adults || 2),
      children: Number(body.children || 0),
      status: 'confirmed',
      channel: String(body.channel || '直订'),
      source: String(body.channel || '直订'),
      notes: String(body.notes || '').trim(),
      rate: Number(body.rate || room.rate),
      totalAmount: Number(body.rate || room.rate) * nights,
      paidAmount: Number(body.deposit || 0),
      createdAt: dateOffset(0),
    };
    state.guests.unshift(guest);
    state.bookings.unshift(booking);
    if (room.status === 'available') room.status = 'reserved';
    if (booking.paidAmount > 0) {
      state.payments.unshift({
        id: `PY-${String(Date.now()).slice(-6)}`,
        bookingId,
        guestName: guest.name,
        category: 'deposit',
        description: `${room.number} 预订定金`,
        amount: booking.paidAmount,
        method: '线下支付',
        status: 'paid',
        paidAt: dateOffset(0),
      });
    }
    await persistState();
    return sendJson(res, 201, { booking, state, summary: buildSummary(state) });
  }

  const bookingAction = url.pathname.match(/^\/api\/bookings\/([^/]+)\/(checkin|checkout)$/);
  if (method === 'POST' && bookingAction) {
    const [, bookingId, action] = bookingAction;
    const booking = state.bookings.find((item) => item.id === bookingId);
    if (!booking) return sendJson(res, 404, { error: '预订不存在' });
    const room = state.rooms.find((item) => item.id === booking.roomId);

    if (action === 'checkin') {
      if (!['confirmed', 'reserved'].includes(booking.status)) return sendJson(res, 409, { error: '当前预订无法办理入住' });
      booking.status = 'in_house';
      if (room) {
        room.status = 'occupied';
        room.currentBookingId = booking.id;
      }
    } else {
      if (booking.status !== 'in_house') return sendJson(res, 409, { error: '当前预订不在住' });
      booking.status = 'completed';
      if (room) {
        room.status = 'cleaning';
        room.currentBookingId = null;
        room.housekeeping = '待清洁';
        state.tasks.unshift({
          id: `T-${String(Date.now()).slice(-6)}`,
          type: 'cleaning',
          roomId: room.id,
          roomNumber: room.number,
          title: '退房清洁',
          detail: '宾客已离店，按退房标准清洁',
          assignedTo: '待分配',
          status: 'pending',
          priority: 'high',
          dueTime: '尽快',
        });
      }
    }
    await persistState();
    return sendJson(res, 200, { booking, state, summary: buildSummary(state) });
  }

  const roomStatusAction = url.pathname.match(/^\/api\/rooms\/([^/]+)\/status$/);
  if (method === 'PATCH' && roomStatusAction) {
    const room = state.rooms.find((item) => item.id === roomStatusAction[1]);
    if (!room) return sendJson(res, 404, { error: '房间不存在' });
    const body = await readBody(req);
    const allowed = ['available', 'occupied', 'reserved', 'cleaning', 'maintenance'];
    if (!allowed.includes(body.status)) return sendJson(res, 400, { error: '无效的房态' });
    room.status = body.status;
    room.housekeeping = body.status === 'cleaning' ? '待清洁' : '已完成';
    room.notes = body.notes === undefined ? room.notes : String(body.notes).trim();
    await persistState();
    return sendJson(res, 200, { room, state, summary: buildSummary(state) });
  }

  const taskAction = url.pathname.match(/^\/api\/tasks\/([^/]+)\/complete$/);
  if (method === 'POST' && taskAction) {
    const task = state.tasks.find((item) => item.id === taskAction[1]);
    if (!task) return sendJson(res, 404, { error: '任务不存在' });
    task.status = 'done';
    task.completedAt = new Date().toISOString();
    const room = state.rooms.find((item) => item.id === task.roomId);
    if (task.type === 'cleaning' && room?.status === 'cleaning') {
      room.status = 'available';
      room.housekeeping = '已完成';
    }
    if (task.type === 'maintenance' && room?.status === 'maintenance') {
      room.status = 'available';
    }
    await persistState();
    return sendJson(res, 200, { task, state, summary: buildSummary(state) });
  }

  return sendJson(res, 404, { error: '接口不存在' });
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

async function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    return res.end('Method Not Allowed');
  }
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const decoded = decodeURIComponent(requested);
  const filePath = path.resolve(publicDir, `.${decoded}`);
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  try {
    const content = await readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[extension] || 'application/octet-stream' });
    if (req.method === 'HEAD') return res.end();
    res.end(content);
  } catch {
    const fallback = await readFile(path.join(publicDir, 'index.html'));
    res.writeHead(200, { 'Content-Type': mimeTypes['.html'] });
    res.end(fallback);
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) await handleApi(req, res, url);
    else await serveStatic(req, res, url);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) sendJson(res, 500, { error: error.message || '服务器内部错误' });
    else res.end();
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`云栖酒店运营系统已启动：http://127.0.0.1:${port}`);
});
