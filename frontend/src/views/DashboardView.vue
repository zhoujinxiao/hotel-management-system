<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, BedDouble, Clock3, DoorOpen, Sparkles, UsersRound, WalletCards } from '@lucide/vue'

type RoomStatus = 'occupied' | 'reserved' | 'available' | 'cleaning' | 'maintenance'

const floors = ['7', '8', '9', '14']
const statusPattern: RoomStatus[][] = [
  ['occupied', 'occupied', 'occupied', 'occupied', 'occupied', 'reserved', 'occupied', 'cleaning', 'occupied', 'occupied'],
  ['occupied', 'occupied', 'occupied', 'occupied', 'occupied', 'available', 'occupied', 'cleaning', 'occupied', 'occupied'],
  ['occupied', 'occupied', 'occupied', 'occupied', 'occupied', 'reserved', 'occupied', 'available', 'occupied', 'occupied'],
  ['occupied', 'occupied', 'occupied', 'occupied', 'occupied', 'maintenance', 'occupied', 'cleaning', 'occupied', 'occupied'],
]

const rooms = floors.flatMap((floor, floorIndex) =>
  statusPattern[floorIndex].map((status, roomIndex) => ({
    number: `${floor}0${roomIndex + 1}`,
    floor,
    status,
  })),
)

const occupiedCount = computed(() => rooms.filter((room) => room.status === 'occupied').length)

const statusLabels: Record<RoomStatus, string> = {
  occupied: '在住',
  reserved: '已订',
  available: '可售',
  cleaning: '待清洁',
  maintenance: '停用',
}

const metrics = [
  { label: '今日到店', value: '7', note: '最近 14:00 · 708', icon: DoorOpen },
  { label: '今日离店', value: '5', note: '2 间已结账', icon: Clock3 },
  { label: '待查房', value: '6', note: '3 间影响排房', icon: BedDouble },
  { label: '在住宾客', value: '46', note: '含随行人员', icon: UsersRound },
  { label: '今日入账', value: '¥3,684', note: 'ADR ¥100 · 含税', icon: WalletCards },
]

const tasks = [
  { room: '708', title: '到店前查房', note: '王梅 · 11:30' },
  { room: '902', title: '退房后清洁', note: '李芳 · 12:00' },
  { room: '1406', title: '住客续住查房', note: '周燕 · 12:30' },
  { room: '705', title: '高楼层查房', note: '王梅 · 13:00' },
]

const arrivals = [
  { room: '708', name: '徐文清', time: '14:00', channel: '电话', guarantee: '已担保' },
  { room: '802', name: '赵明宇', time: '14:30', channel: '微信', guarantee: '未担保' },
  { room: '904', name: '王倩', time: '15:10', channel: '电话', guarantee: '已担保' },
  { room: '1402', name: '李然', time: '16:00', channel: '到店', guarantee: '未担保' },
]
</script>

<template>
  <section class="dashboard-page">
    <header class="page-heading">
      <div>
        <p class="page-kicker">9 月 19 日 · 星期六 · 白班</p>
        <h1>值班控制台</h1>
        <p>先处理到店、离店和待查房，再推进其他运营工作。</p>
      </div>
      <div class="heading-actions">
        <button class="secondary-button" type="button">
          <WalletCards :size="16" />
          班次结算
        </button>
        <button class="primary-button" type="button">
          <Sparkles :size="16" />
          新建预订
        </button>
      </div>
    </header>

    <section class="pulse-rail">
      <article class="occupancy-panel">
        <span>今日入住率</span>
        <strong>{{ Math.round((occupiedCount / rooms.length) * 1000) / 10 }}<small>%</small></strong>
        <div class="occupancy-track"><i :style="{ width: `${(occupiedCount / rooms.length) * 100}%` }" /></div>
        <small>{{ occupiedCount }} / {{ rooms.length }} 间在住</small>
      </article>
      <article v-for="metric in metrics" :key="metric.label" class="metric-item">
        <span><component :is="metric.icon" :size="16" />{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <small>{{ metric.note }}</small>
      </article>
    </section>

    <div class="dashboard-grid">
      <div class="dashboard-column">
        <section class="panel rhythm-panel">
          <header class="panel-header">
            <div>
              <h2>今日节奏</h2>
              <p>交班、清洁、到店和日报的关键节点</p>
            </div>
            <span class="panel-meta">现在 11:18</span>
          </header>
          <div class="rhythm-track">
            <article class="rhythm-step is-done"><span>08:00</span><strong>退房与清洁</strong><small>5 间离店</small></article>
            <article class="rhythm-step is-active"><span>11:00</span><strong>房态冲刺</strong><small>6 间待查房</small></article>
            <article class="rhythm-step"><span>14:00</span><strong>集中到店</strong><small>7 笔预订</small></article>
            <article class="rhythm-step"><span>17:00</span><strong>白班交班</strong><small>班次结算</small></article>
            <article class="rhythm-step"><span>02:00</span><strong>日报生成</strong><small>夜班处理</small></article>
          </div>
        </section>

        <section class="panel room-panel">
          <header class="panel-header">
            <div>
              <h2>实时房态矩阵</h2>
              <p>4 个楼层 · {{ rooms.length }} 间房 · 点击房间进入操作</p>
            </div>
            <div class="status-legend">
              <span v-for="(label, key) in statusLabels" :key="key" :class="key">{{ label }}</span>
            </div>
          </header>
          <div class="room-board">
            <div v-for="floor in floors" :key="floor" class="room-floor">
              <span class="floor-label">{{ floor }}F</span>
              <div class="room-row">
                <button
                  v-for="room in rooms.filter((item) => item.floor === floor)"
                  :key="room.number"
                  class="room-tile"
                  :class="room.status"
                  type="button"
                  :title="`${room.number} · ${statusLabels[room.status]}`"
                >
                  {{ room.number }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="panel arrivals-panel">
          <header class="panel-header">
            <div>
              <h2>今日到店</h2>
              <p>按预计时间排列，优先处理未担保订单</p>
            </div>
            <button class="text-button" type="button">查看全部 <ArrowRight :size="14" /></button>
          </header>
          <div class="simple-table">
            <div class="table-row table-head"><span>时间</span><span>宾客</span><span>房间</span><span>渠道</span><span>担保</span><span /></div>
            <div v-for="arrival in arrivals" :key="arrival.room" class="table-row">
              <span>{{ arrival.time }}</span>
              <span class="guest-name"><i>{{ arrival.name.slice(0, 1) }}</i>{{ arrival.name }}</span>
              <span class="mono">{{ arrival.room }}</span>
              <span>{{ arrival.channel }}</span>
              <span><b class="guarantee-pill">{{ arrival.guarantee }}</b></span>
              <button type="button">办理入住</button>
            </div>
          </div>
        </section>
      </div>

      <aside class="dashboard-sidebar">
        <section class="panel task-panel">
          <header class="panel-header">
            <div><h2>优先任务</h2><p>6 项未完成</p></div>
            <button class="text-button" type="button">全部</button>
          </header>
          <div class="task-list">
            <article v-for="task in tasks" :key="task.room" class="task-row">
              <span class="task-icon"><BedDouble :size="15" /></span>
              <div><strong>{{ task.room }} · {{ task.title }}</strong><small>{{ task.note }}</small></div>
              <button type="button">完成</button>
            </article>
          </div>
        </section>

        <section class="panel cash-panel">
          <header class="panel-header">
            <div><h2>当前班次</h2><p>08:00 开班 · 差额 ¥0</p></div>
          </header>
          <div class="cash-grid">
            <div><span>现金</span><strong>¥1,260</strong></div>
            <div><span>微信</span><strong>¥1,538</strong></div>
            <div><span>支付宝</span><strong>¥486</strong></div>
            <div><span>银行卡</span><strong>¥400</strong></div>
          </div>
          <button class="dark-button" type="button">开始交班结算</button>
        </section>

        <aside class="warning-note">
          <strong>708 已担保但未到店</strong>
          <p>保留至 18:00，夜班需要电话确认。</p>
        </aside>
      </aside>
    </div>
  </section>
</template>
