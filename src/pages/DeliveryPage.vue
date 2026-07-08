<script setup>
import { ref, computed, watch } from 'vue'
import {
  store,
  addDeliveryRecord,
  updateDeliveryRecord,
  deleteDeliveryRecord,
  addDeliveryPlatform,
  deleteDeliveryPlatform,
  updateDeliveryGoal,
} from '../store'

const emit = defineEmits(['close'])

// ═══ Platform helpers ═══
const platforms = computed(() => store.deliveryPlatforms)
const getPlatformStyle = (name) => {
  const p = store.deliveryPlatforms.find(p => p.name === name)
  return p || { icon: '🛵', color: '#6366f1' }
}

// ═══ Goal ═══
const goal = computed(() => store.deliveryGoal)
const showGoalEdit = ref(false)
const goalForm = ref({ daily: 200, monthly: 6000 })
const openGoalEdit = () => {
  goalForm.value = { ...store.deliveryGoal }
  showGoalEdit.value = true
}
const saveGoal = () => {
  updateDeliveryGoal(goalForm.value)
  showGoalEdit.value = false
}

// ═══ Form ═══
const today = new Date().toISOString().slice(0, 10)
const form = ref({
  date: today, platform: '美团众包', orders: '', income: '',
  insurance: '', mileage: '', duration: '', note: '',
})
const editingId = ref(null)

// 当前选中平台的每日保险费（用于表单提示）
const currentPlatInsurance = computed(() => {
  const p = platforms.value.find(pl => pl.name === form.value.platform)
  return p ? Number(p.insurance) || 0 : 0
})

// 选中平台或填写单量/收入时，按平台费率自动预填保险费（有单才扣，休息日归零；手动填写优先）
const autoFillInsurance = () => {
  const p = platforms.value.find(pl => pl.name === form.value.platform)
  const fee = p && Number(p.insurance) > 0 ? Number(p.insurance) : 0
  const hasOrder = (Number(form.value.orders) || 0) > 0 || (Number(form.value.income) || 0) > 0
  if (!hasOrder) {
    if (form.value.insurance === '' || Number(form.value.insurance) === 0) form.value.insurance = 0
  } else if (form.value.insurance === '' || Number(form.value.insurance) === 0) {
    form.value.insurance = fee
  }
}
watch(() => form.value.platform, autoFillInsurance)
watch(() => [form.value.orders, form.value.income], autoFillInsurance)

const submitForm = () => {
  if (!form.value.orders && !form.value.income && !form.value.mileage) {
    alert('请至少填写单量、收入或里程中的一项')
    return
  }
  if (editingId.value) {
    updateDeliveryRecord(editingId.value, { ...form.value })
    editingId.value = null
  } else {
    addDeliveryRecord({ ...form.value })
  }
  form.value = { date: today, platform: form.value.platform, orders: '', income: '', insurance: '', mileage: '', duration: '', note: '' }
}

const editRecord = (r) => {
  editingId.value = r.id
  form.value = { ...r }
  // scroll form into view on mobile
  const el = document.querySelector('.d-left')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

const cancelEdit = () => {
  editingId.value = null
  form.value = { date: today, platform: '美团众包', orders: '', income: '', insurance: '', mileage: '', duration: '', note: '' }
}

const removeRecord = (id) => {
  if (confirm('确认删除这条记录？')) { deleteDeliveryRecord(id); if (editingId.value === id) cancelEdit() }
}

// ═══ Data ═══
const allRecords = computed(() => [...store.deliveryRecords].sort((a, b) => b.date.localeCompare(a.date)))

const calcStats = (records) => {
  const totalOrders = records.reduce((s, r) => s + (r.orders || 0), 0)
  const totalIncome = records.reduce((s, r) => s + (r.income || 0), 0)
  const totalInsurance = records.reduce((s, r) => s + (r.insurance || 0), 0)
  const totalMileage = records.reduce((s, r) => s + (r.mileage || 0), 0)
  const totalDuration = records.reduce((s, r) => s + (r.duration || 0), 0)
  return {
    totalOrders, totalIncome, totalInsurance,
    netIncome: totalIncome - totalInsurance,
    totalMileage, totalDuration,
    avgPrice: totalOrders > 0 ? totalIncome / totalOrders : 0,
    hourlyRate: totalDuration > 0 ? (totalIncome - totalInsurance) / totalDuration : 0,
    days: new Set(records.map(r => r.date)).size,
  }
}

const overallStats = computed(() => calcStats(allRecords.value))
const todayStats = computed(() => calcStats(allRecords.value.filter(r => r.date === today)))

const weekStats = computed(() => {
  const now = new Date()
  const dayOfWeek = now.getDay() || 7
  const monday = new Date(now); monday.setDate(now.getDate() - dayOfWeek + 1); monday.setHours(0,0,0,0)
  return calcStats(allRecords.value.filter(r => r.date >= monday.toISOString().slice(0, 10)))
})

const monthStats = computed(() => calcStats(allRecords.value.filter(r => r.date.startsWith(today.slice(0, 7)))))

// ═══ 7-Day Trend (area chart) ═══
const last7Days = computed(() => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const ds = d.toISOString().slice(0, 10)
    const recs = allRecords.value.filter(r => r.date === ds)
    days.push({
      date: ds,
      label: `${d.getMonth()+1}/${d.getDate()}`,
      weekday: '日一二三四五六'[d.getDay()],
      income: recs.reduce((s,r)=>s+(r.income||0),0),
      orders: recs.reduce((s,r)=>s+(r.orders||0),0),
      net: recs.reduce((s,r)=>s+(r.income||0)-(r.insurance||0),0),
    })
  }
  return days
})

const chartMax = computed(() => Math.max(...last7Days.value.map(d => d.income), 50))

const areaPath2 = computed(() => {
  const w = 700, h = 140, bottomPad = 22, topPad = 10, max = chartMax.value || 1, innerH = h - bottomPad - topPad
  const pts = last7Days.value.map((d, i) => ({ x: 25 + i * (w - 50) / 6, y: h - bottomPad - (d.income / max) * innerH }))
  let d = `M${pts[0].x} ${h - bottomPad} L${pts[0].x} ${pts[0].y}`
  pts.slice(1).forEach(p => d += ` L${p.x} ${p.y}`)
  d += ` L${pts[6].x} ${h - bottomPad} Z`
  return d
})

const linePath2 = computed(() => {
  const w = 700, h = 140, bottomPad = 22, topPad = 10, max = chartMax.value || 1, innerH = h - bottomPad - topPad
  const pts = last7Days.value.map((d, i) => ({ x: 25 + i * (w - 50) / 6, y: h - bottomPad - (d.income / max) * innerH }))
  return `M${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L${p.x} ${p.y}`).join(' ')
})

// ═══ Platform Stats ═══
const platformStats = computed(() => {
  const map = {}
  allRecords.value.forEach(r => {
    if (!map[r.platform]) map[r.platform] = { name: r.platform, orders: 0, income: 0, insurance: 0, net: 0, count: 0, mileage: 0, duration: 0 }
    const m = map[r.platform]
    m.orders += r.orders || 0; m.income += r.income || 0; m.insurance += r.insurance || 0
    m.net += (r.income||0) - (r.insurance||0); m.mileage += r.mileage || 0; m.duration += r.duration || 0; m.count++
  })
  return Object.values(map).sort((a,b) => b.income - a.income)
})
const totalPlatformIncome = computed(() => platformStats.value.reduce((s,p) => s + p.income, 0) || 1)

const donutArcs = computed(() => {
  let cumulative = 0
  return platformStats.value.map(p => {
    const slice = p.income / totalPlatformIncome.value
    const start = cumulative; cumulative += slice
    const startAngle = start * 2 * Math.PI - Math.PI / 2
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2
    const r = 60, cx = 80, cy = 80
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle)
    const large = slice > 0.5 ? 1 : 0
    return { name: p.name, color: getPlatformStyle(p.name).color, x1, y1, x2, y2, large }
  })
})

// ═══ Calendar Heatmap (redesigned with month labels) ═══
const calendarData = computed(() => {
  const weeks = []
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay() - 17 * 7)
  start.setHours(0, 0, 0, 0)

  const dateIncome = {}
  allRecords.value.forEach(r => {
    dateIncome[r.date] = (dateIncome[r.date] || 0) + (r.income || 0)
  })
  const maxIncome = Math.max(...Object.values(dateIncome), 1)

  for (let w = 0; w < 18; w++) {
    const week = []
    let monthLabel = ''
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      const ds = date.toISOString().slice(0, 10)
      const val = dateIncome[ds] || 0
      const intensity = ds > todayStr ? -1 : val > 0 ? Math.min(val / maxIncome, 1) : 0
      week.push({
        date: ds, value: val, intensity,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        isToday: ds === todayStr,
      })
      if (d === 0) {
        monthLabel = (date.getDate() === 1 || (w === 0 && d === 0)) ? `${date.getMonth() + 1}月` : ''
      }
    }
    weeks.push({ label: monthLabel, days: week })
  }
  return weeks
})

// ═══ History View: day / month / year ═══
const historyMode = ref('day') // 'day' | 'month' | 'year'
const searchQuery = ref('')
const filterPlatform = ref('')
const filterPeriod = ref(today.slice(0, 7)) // used only in 'day' mode
const filterYear = ref(today.slice(0, 4))

const filteredRecords = computed(() => {
  let recs = allRecords.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    recs = recs.filter(r => (r.note||'').toLowerCase().includes(q) || r.platform.includes(q) || r.date.includes(q))
  }
  if (filterPlatform.value) recs = recs.filter(r => r.platform === filterPlatform.value)
  if (historyMode.value === 'day' && filterPeriod.value) {
    recs = recs.filter(r => r.date.startsWith(filterPeriod.value))
  }
  if (historyMode.value === 'month' && filterYear.value) {
    recs = recs.filter(r => r.date.startsWith(filterYear.value))
  }
  return recs
})

// Day grouping
const groupedByDay = computed(() => {
  const map = {}
  filteredRecords.value.forEach(r => {
    if (!map[r.date]) map[r.date] = []
    map[r.date].push(r)
  })
  return Object.entries(map).sort((a,b) => b[0].localeCompare(a[0]))
})

// Month grouping
const groupedByMonth = computed(() => {
  const map = {}
  filteredRecords.value.forEach(r => {
    const m = r.date.slice(0, 7)
    if (!map[m]) map[m] = { records: [], orders: 0, income: 0, insurance: 0, mileage: 0, duration: 0, days: new Set() }
    map[m].records.push(r)
    map[m].orders += r.orders || 0
    map[m].income += r.income || 0
    map[m].insurance += r.insurance || 0
    map[m].mileage += r.mileage || 0
    map[m].duration += r.duration || 0
    map[m].days.add(r.date)
  })
  return Object.entries(map).sort((a,b) => b[0].localeCompare(a[0]))
})

// Year grouping
const groupedByYear = computed(() => {
  const map = {}
  filteredRecords.value.forEach(r => {
    const y = r.date.slice(0, 4)
    if (!map[y]) map[y] = { records: [], orders: 0, income: 0, insurance: 0, mileage: 0, duration: 0, days: new Set() }
    map[y].records.push(r)
    map[y].orders += r.orders || 0
    map[y].income += r.income || 0
    map[y].insurance += r.insurance || 0
    map[y].mileage += r.mileage || 0
    map[y].duration += r.duration || 0
    map[y].days.add(r.date)
  })
  return Object.entries(map).sort((a,b) => b[0].localeCompare(a[0]))
})

// ═══ Platform Manager ═══
const showPlatformMgr = ref(false)
const newPlatform = ref({ name: '', icon: '🛵', color: '#6366f1', insurance: 0 })
const addPlat = () => {
  if (!newPlatform.value.name.trim()) return
  addDeliveryPlatform(newPlatform.value.name, newPlatform.value.icon, newPlatform.value.color, newPlatform.value.insurance)
  newPlatform.value = { name: '', icon: '🛵', color: '#6366f1', insurance: 0 }
}
const removePlat = (name) => {
  if (confirm(`确认删除平台「${name}」？`)) deleteDeliveryPlatform(name)
}

// ═══ Export ═══
const exportJSON = () => {
  const data = JSON.stringify({
    deliveryRecords: store.deliveryRecords,
    deliveryPlatforms: store.deliveryPlatforms,
    deliveryGoal: store.deliveryGoal,
    exportDate: new Date().toISOString(),
  }, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `waimai_${today}.json`; a.click(); URL.revokeObjectURL(url)
}

const exportCSV = () => {
  const header = '日期,平台,单量,收入,保险费,净收入,里程(km),时长(h),备注'
  const rows = allRecords.value.map(r => [
    r.date, r.platform, r.orders, r.income, r.insurance,
    ((r.income||0)-(r.insurance||0)).toFixed(2), r.mileage, r.duration,
    (r.note||'').replace(/,/g,'，')
  ].join(','))
  const csv = '\uFEFF' + header + '\n' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `waimai_${today}.csv`; a.click(); URL.revokeObjectURL(url)
}

const importData = (e) => {
  const file = e.target.files[0]; if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result)
      if (data.deliveryRecords) store.deliveryRecords = data.deliveryRecords
      if (data.deliveryPlatforms) store.deliveryPlatforms = data.deliveryPlatforms
      if (data.deliveryGoal) store.deliveryGoal = data.deliveryGoal
      alert('导入成功！')
    } catch { alert('导入失败：文件格式错误') }
  }
  reader.readAsText(file); e.target.value = ''
}

// ═══ Formatters ═══
const fmtMoney = (n) => '¥' + (n || 0).toFixed(2)
const fmtMoney0 = (n) => '¥' + (n || 0).toFixed(0)
const fmtNum = (n, d = 1) => (n || 0).toFixed(d)
const fmtDate = (d) => {
  const date = new Date(d + 'T00:00:00')
  return `${date.getMonth()+1}月${date.getDate()}日 周${'日一二三四五六'[date.getDay()]}`
}
const fmtMonth = (m) => {
  const [y, mo] = m.split('-')
  return `${y}年${parseInt(mo)}月`
}
const fmtYear = (y) => `${y}年`

// ═══ Day Detail Modal ═══
const showDayDetail = ref(false)
const detailDate = ref('')
const detailRecords = computed(() => {
  if (!detailDate.value) return []
  return allRecords.value.filter(r => r.date === detailDate.value)
})
const detailStats = computed(() => calcStats(detailRecords.value))
const detailByPlatform = computed(() => {
  const map = {}
  detailRecords.value.forEach(r => {
    if (!map[r.platform]) map[r.platform] = { name: r.platform, orders: 0, income: 0, insurance: 0, mileage: 0, duration: 0, count: 0 }
    const m = map[r.platform]
    m.orders += r.orders || 0; m.income += r.income || 0; m.insurance += r.insurance || 0
    m.mileage += r.mileage || 0; m.duration += r.duration || 0; m.count++
  })
  return Object.values(map).sort((a,b) => b.income - a.income)
})
const openDayDetail = (date) => {
  detailDate.value = date
  showDayDetail.value = true
}

// ═══ Share Card (Canvas screenshot) ═══
const showShareModal = ref(false)
const shareType = ref('day') // 'day' | 'month' | 'year'
const shareDate = ref(today)
const shareMonth = ref(today.slice(0, 7))
const shareYear = ref(today.slice(0, 4))
const shareDataUrl = ref('')
const shareLoading = ref(false)

const openShare = () => {
  showShareModal.value = true
  shareDataUrl.value = ''
}

const shareRecords = computed(() => {
  if (shareType.value === 'day') return allRecords.value.filter(r => r.date === shareDate.value)
  if (shareType.value === 'month') return allRecords.value.filter(r => r.date.startsWith(shareMonth.value))
  return allRecords.value.filter(r => r.date.startsWith(shareYear.value))
})

const shareStats = computed(() => calcStats(shareRecords.value))
const sharePlatformStats = computed(() => {
  const map = {}
  shareRecords.value.forEach(r => {
    if (!map[r.platform]) map[r.platform] = { name: r.platform, orders: 0, income: 0, insurance: 0, count: 0 }
    const m = map[r.platform]
    m.orders += r.orders || 0; m.income += r.income || 0; m.insurance += r.insurance || 0; m.count++
  })
  return Object.values(map).sort((a,b) => b.income - a.income)
})

const shareTitle = computed(() => {
  if (shareType.value === 'day') return fmtDate(shareDate.value)
  if (shareType.value === 'month') return fmtMonth(shareMonth.value)
  return fmtYear(shareYear.value)
})

const generateShareImage = async () => {
  shareLoading.value = true
  // Use setTimeout to let loading state render
  await new Promise(r => setTimeout(r, 50))

  const W = 400, H = 640
  const canvas = document.createElement('canvas')
  canvas.width = W * 2  // retina
  canvas.height = H * 2
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)

  const s = shareStats.value
  const ps = sharePlatformStats.value
  const title = shareTitle.value
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

  // Colors
  const bg = isDark ? '#0f172a' : '#f8fafc'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const text = isDark ? '#f1f5f9' : '#1e293b'
  const text2 = isDark ? '#94a3b8' : '#64748b'
  const muted = isDark ? '#64748b' : '#94a3b8'
  const accent = '#ff7f00'
  const accent2 = '#ff5500'
  const border = isDark ? '#334155' : '#e2e8f0'

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, isDark ? '#1a2540' : '#fff7ed')
  grad.addColorStop(0.3, bg)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Top accent bar
  const topGrad = ctx.createLinearGradient(0, 0, W, 0)
  topGrad.addColorStop(0, accent)
  topGrad.addColorStop(1, accent2)
  ctx.fillStyle = topGrad
  ctx.fillRect(0, 0, W, 5)

  // Title
  ctx.fillStyle = text
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🛵 外卖跑单战绩', W / 2, 38)

  ctx.fillStyle = text2
  ctx.font = '13px system-ui, -apple-system, sans-serif'
  ctx.fillText(title, W / 2, 58)

  // Main income card
  const cardY = 75
  ctx.fillStyle = cardBg
  roundRect(ctx, 20, cardY, W - 40, 90, 12)
  ctx.fill()
  ctx.strokeStyle = border
  ctx.lineWidth = 1
  roundRect(ctx, 20, cardY, W - 40, 90, 12)
  ctx.stroke()

  // Total income (big number)
  ctx.fillStyle = accent
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(fmtMoney0(s.totalIncome), W / 2, cardY + 42)

  ctx.fillStyle = muted
  ctx.font = '11px system-ui, -apple-system, sans-serif'
  ctx.fillText('总收入', W / 2, cardY + 58)

  // Net income badge
  ctx.fillStyle = accent + '15'
  roundRect(ctx, W / 2 - 55, cardY + 65, 110, 18, 9)
  ctx.fill()
  ctx.fillStyle = accent
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
  ctx.fillText(`净收入 ${fmtMoney0(s.netIncome)}`, W / 2, cardY + 78)

  // Stats grid (2x3)
  const gridY = 185
  const gridItems = [
    { label: '总单量', value: `${s.totalOrders} 单`, icon: '📦' },
    { label: '跑单天数', value: `${s.days} 天`, icon: '📅' },
    { label: '平均单价', value: fmtMoney0(s.avgPrice), icon: '💰' },
    { label: '总里程', value: `${fmtNum(s.totalMileage)} km`, icon: '🛣️' },
    { label: '总时长', value: `${fmtNum(s.totalDuration)} h`, icon: '⏱️' },
    { label: '时薪', value: fmtMoney0(s.hourlyRate), icon: '⚡' },
  ]
  const cellW = (W - 40 - 16) / 3
  const cellH = 52
  gridItems.forEach((item, i) => {
    const col = i % 3, row = Math.floor(i / 3)
    const x = 20 + col * (cellW + 8)
    const y = gridY + row * (cellH + 8)
    ctx.fillStyle = cardBg
    roundRect(ctx, x, y, cellW, cellH, 8)
    ctx.fill()
    ctx.strokeStyle = border
    ctx.lineWidth = 0.5
    roundRect(ctx, x, y, cellW, cellH, 8)
    ctx.stroke()
    ctx.fillStyle = text2
    ctx.font = '10px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${item.icon} ${item.label}`, x + cellW / 2, y + 16)
    ctx.fillStyle = text
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
    ctx.fillText(item.value, x + cellW / 2, y + 36)
  })

  // Platform breakdown
  const platY = gridY + 2 * (cellH + 8) + 16
  ctx.fillStyle = text
  ctx.font = 'bold 13px system-ui, -apple-platform, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('📊 平台明细', 20, platY)

  const platTotal = ps.reduce((sum, p) => sum + p.income, 0) || 1
  let py = platY + 14
  ps.forEach((p, i) => {
    if (py > H - 80) return
    const style = getPlatformStyle(p.name)
    const pct = (p.income / platTotal * 100).toFixed(0)

    // Platform row bg
    ctx.fillStyle = cardBg
    roundRect(ctx, 20, py, W - 40, 38, 8)
    ctx.fill()
    ctx.strokeStyle = border
    ctx.lineWidth = 0.5
    roundRect(ctx, 20, py, W - 40, 38, 8)
    ctx.stroke()

    // Color dot
    ctx.fillStyle = style.color || accent
    ctx.beginPath()
    ctx.arc(32, py + 19, 5, 0, Math.PI * 2)
    ctx.fill()

    // Platform name
    ctx.fillStyle = text
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`${style.icon} ${p.name}`, 44, py + 16)

    // Orders & percentage
    ctx.fillStyle = muted
    ctx.font = '10px system-ui, -apple-system, sans-serif'
    ctx.fillText(`${p.orders}单 · ${pct}%`, 44, py + 30)

    // Income
    ctx.fillStyle = accent
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(fmtMoney0(p.income), W - 30, py + 24)

    // Progress bar
    const barX = 20, barY = py + 35, barW = W - 40
    ctx.fillStyle = isDark ? '#334155' : '#e2e8f0'
    ctx.fillRect(barX, barY, barW, 2)
    ctx.fillStyle = style.color || accent
    ctx.fillRect(barX, barY, barW * (p.income / platTotal), 2)

    py += 44
  })

  // Footer
  ctx.fillStyle = muted
  ctx.font = '10px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('壹号栈 · 外卖跑单记录', W / 2, H - 20)

  // Decorative dots
  ctx.fillStyle = accent + '20'
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    ctx.arc(30 + i * 12, H - 15, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  shareDataUrl.value = canvas.toDataURL('image/png')
  shareLoading.value = false
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

const downloadShareImage = () => {
  if (!shareDataUrl.value) return
  const a = document.createElement('a')
  a.href = shareDataUrl.value
  const name = shareType.value === 'day' ? shareDate.value : shareType.value === 'month' ? shareMonth.value : shareYear.value
  a.download = `waimai_report_${name}.png`
  a.click()
}

const shareToFriend = async () => {
  if (!shareDataUrl.value) return
  try {
    const res = await fetch(shareDataUrl.value)
    const blob = await res.blob()
    const file = new File([blob], 'waimai_report.png', { type: 'image/png' })
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: '我的外卖跑单战绩', text: `看看我${shareTitle.value}的战绩！` })
    } else {
      downloadShareImage()
    }
  } catch { downloadShareImage() }
}

// Auto-generate when modal opens or type changes
const onShareTypeChange = () => { shareDataUrl.value = '' }
</script>

<template>
  <div class="delivery-page">
    <!-- ═══ Top Bar ═══ -->
    <div class="d-topbar">
      <button class="d-back-btn" @click="emit('close')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        <span>返回</span>
      </button>
      <div class="d-topbar-title">
        <span class="d-topbar-emoji">🛵</span>
        <span>外卖跑单记录</span>
      </div>
      <div class="d-topbar-actions">
        <button class="d-icon-btn d-share-btn" @click="openShare" title="生成战绩截图">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
        </button>
        <label class="d-icon-btn" title="导入 JSON">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          <input type="file" accept=".json" @change="importData" hidden />
        </label>
        <button class="d-icon-btn" @click="exportJSON" title="导出 JSON">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
        </button>
        <button class="d-icon-btn" @click="exportCSV" title="导出 CSV">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M8 8h4M8 16h6"/></svg>
        </button>
      </div>
    </div>

    <!-- ═══ Left-Right Layout ═══ -->
    <div class="d-layout">
      <!-- ═══════ LEFT COLUMN: Form + Stats ═══════ -->
      <aside class="d-left">
        <!-- Quick Add Form -->
        <div class="d-card">
          <div class="d-card-header">
            <h3>{{ editingId ? '✏️ 编辑记录' : '➕ 快速记录' }}</h3>
            <button v-if="editingId" class="d-link-btn" @click="cancelEdit">取消编辑</button>
          </div>
          <div class="d-quick-form">
            <div class="d-form-row">
              <input type="date" v-model="form.date" class="d-input" />
              <select v-model="form.platform" class="d-input">
                <option v-for="p in platforms" :key="p.name" :value="p.name">{{ p.icon }} {{ p.name }}<template v-if="p.insurance"> ·¥{{ p.insurance }}</template></option>
              </select>
            </div>
            <div class="d-form-row d-form-row-3">
              <div class="d-form-g">
                <label>单量</label>
                <input type="number" v-model="form.orders" placeholder="0" class="d-input" min="0" />
              </div>
              <div class="d-form-g">
                <label>收入 ¥</label>
                <input type="number" v-model="form.income" placeholder="0" class="d-input" min="0" step="0.01" />
              </div>
              <div class="d-form-g">
                <label>保险 ¥ <span class="d-ins-hint" v-if="currentPlatInsurance">平台 ¥{{ currentPlatInsurance }}/天</span></label>
                <input type="number" v-model="form.insurance" placeholder="0" class="d-input" min="0" step="0.01" />
              </div>
            </div>
            <div class="d-form-row d-form-row-3">
              <div class="d-form-g">
                <label>里程 km</label>
                <input type="number" v-model="form.mileage" placeholder="0" class="d-input" min="0" step="0.1" />
              </div>
              <div class="d-form-g">
                <label>时长 h</label>
                <input type="number" v-model="form.duration" placeholder="0" class="d-input" min="0" step="0.1" />
              </div>
              <div class="d-form-g">
                <label>净收入</label>
                <div class="d-readonly">{{ fmtMoney((Number(form.income)||0) - (Number(form.insurance)||0)) }}</div>
              </div>
            </div>
            <input type="text" v-model="form.note" placeholder="添加备注..." class="d-input" />
            <button class="d-btn d-btn-primary" @click="submitForm">
              {{ editingId ? '✓ 更新记录' : '+ 添加记录' }}
            </button>
          </div>
        </div>

        <!-- Goal Card -->
        <div class="d-card d-goal-card">
          <div class="d-card-header">
            <h3>🎯 今日目标</h3>
            <button class="d-link-btn" @click="openGoalEdit">设定</button>
          </div>
          <div class="d-goal-body">
            <div class="d-goal-row">
              <div class="d-goal-bar-wrap">
                <div class="d-goal-bar" :style="{ width: Math.min(todayStats.totalIncome / (goal.daily || 1) * 100, 100) + '%' }"></div>
              </div>
              <span class="d-goal-pct">{{ (todayStats.totalIncome / (goal.daily || 1) * 100).toFixed(0) }}%</span>
            </div>
            <div class="d-goal-split">
              <span>已赚 {{ fmtMoney(todayStats.totalIncome) }}</span>
              <span>目标 {{ fmtMoney(goal.daily) }}</span>
            </div>
            <div class="d-goal-month" v-if="goal.monthly > 0">
              <span>本月：{{ fmtMoney(monthStats.totalIncome) }} / {{ fmtMoney(goal.monthly) }}</span>
              <span class="d-goal-mpct">{{ (monthStats.totalIncome / goal.monthly * 100).toFixed(0) }}%</span>
            </div>
          </div>
        </div>

        <!-- Stats Summary -->
        <div class="d-card">
          <div class="d-card-header"><h3>📊 数据总览</h3></div>
          <div class="d-stats-mini">
            <div class="d-stat-row"><span class="d-stat-dot" style="background:#ff7f00"></span><span>总收入</span><b>{{ fmtMoney(overallStats.totalIncome) }}</b></div>
            <div class="d-stat-row"><span class="d-stat-dot" style="background:#22c55e"></span><span>净收入</span><b>{{ fmtMoney(overallStats.netIncome) }}</b></div>
            <div class="d-stat-row"><span class="d-stat-dot" style="background:#3b82f6"></span><span>总单量</span><b>{{ overallStats.totalOrders }} 单</b></div>
            <div class="d-stat-row"><span class="d-stat-dot" style="background:#8b5cf6"></span><span>跑单天数</span><b>{{ overallStats.days }} 天</b></div>
            <div class="d-stat-row"><span class="d-stat-dot" style="background:#f59e0b"></span><span>平均单价</span><b>{{ fmtMoney(overallStats.avgPrice) }}</b></div>
            <div class="d-stat-row"><span class="d-stat-dot" style="background:#ef4444"></span><span>时薪</span><b>{{ fmtMoney(overallStats.hourlyRate) }}/h</b></div>
          </div>
        </div>

        <!-- Platform Manager -->
        <div class="d-card">
          <div class="d-card-header">
            <h3>🏷️ 平台管理</h3>
            <button class="d-link-btn" @click="showPlatformMgr = !showPlatformMgr">{{ showPlatformMgr ? '收起' : '展开' }}</button>
          </div>
          <div v-if="showPlatformMgr" class="d-plat-mgr-body">
            <div class="d-plat-tags">
              <span v-for="p in platforms" :key="p.name" class="d-plat-tag" :style="{ borderColor: p.color }">
                {{ p.icon }} {{ p.name }}
                <small class="d-plat-fee" v-if="p.insurance">¥{{ p.insurance }}/天</small>
                <small class="d-plat-fee d-plat-fee-none" v-else>无保险</small>
                <button @click="removePlat(p.name)">✕</button>
              </span>
            </div>
            <div class="d-plat-add">
              <input v-model="newPlatform.name" placeholder="名称" class="d-input d-input-sm" />
              <input v-model="newPlatform.icon" placeholder="🛵" class="d-input d-input-sm d-input-icon" />
              <input v-model="newPlatform.color" type="color" class="d-color-pick" />
              <input v-model.number="newPlatform.insurance" type="number" placeholder="保险费/天" min="0" step="0.1" class="d-input d-input-sm d-input-fee" />
              <button class="d-btn d-btn-sm d-btn-primary" @click="addPlat">+</button>
            </div>
          </div>
        </div>
      </aside>

      <!-- ═══════ RIGHT COLUMN ═══════ -->
      <main class="d-right">
        <!-- ─── Period Summary Cards ─── -->
        <div class="d-summary-row">
          <div class="d-summary-card" :class="item.cardClass" v-for="item in [
            { label:'今日', cardClass:'d-sc-today', stats: todayStats },
            { label:'本周', cardClass:'d-sc-week', stats: weekStats },
            { label:'本月', cardClass:'d-sc-month', stats: monthStats },
            { label:'总计', cardClass:'d-sc-total', stats: overallStats },
          ]" :key="item.label">
            <div class="d-sc-label">{{ item.label }}</div>
            <div class="d-sc-body">
              <div class="d-sc-kv">
                <span class="d-sc-v">{{ item.stats.totalOrders }}</span>
                <span class="d-sc-k">单</span>
              </div>
              <div class="d-sc-kv d-sc-kv-main">
                <span class="d-sc-v">{{ fmtMoney(item.stats.netIncome) }}</span>
                <span class="d-sc-k">净收</span>
              </div>
              <div class="d-sc-kv" v-if="item.stats.days > 0">
                <span class="d-sc-v">{{ item.stats.days }}</span>
                <span class="d-sc-k">天</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── Two-Column Main Area ─── -->
        <div class="d-main-grid">
          <!-- LEFT SUB-COLUMN: Charts + Platform Table -->
          <div class="d-main-left">
            <!-- ─── Trend + Heatmap in one row ─── -->
            <div class="d-visual-row">
              <!-- 7-Day Trend Chart -->
              <div class="d-card d-trend-card">
                <div class="d-card-header"><h3>📈 近 7 天收入趋势</h3></div>
                <div class="d-chart-area">
                  <svg viewBox="0 0 700 160" class="d-chart-svg">
                    <!-- grid lines -->
                    <line v-for="i in 5" :key="'gl'+i" :x1="0" :y1="10 + (i-1)*27" :x2="700" :y2="10 + (i-1)*27" stroke="var(--d-grid)" stroke-dasharray="3,3" />
                    <!-- area -->
                    <path :d="areaPath2" fill="url(#grad2)" opacity="0.2" />
                    <defs><linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff7f00"/><stop offset="100%" stop-color="#ff7f00" stop-opacity="0"/></linearGradient></defs>
                    <!-- line -->
                    <path :d="linePath2" fill="none" stroke="#ff7f00" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                    <!-- dots + labels -->
                    <g v-for="(d, i) in last7Days" :key="'dot'+i">
                      <circle :cx="25 + i*(650/6)" :cy="118-(d.income/chartMax)*108" r="5" fill="#fff" stroke="#ff7f00" stroke-width="2.5" />
                      <text :x="25 + i*(650/6)" y="138" text-anchor="middle" font-size="10" fill="var(--d-muted)">{{ d.label }}</text>
                      <text :x="25 + i*(650/6)" y="150" text-anchor="middle" font-size="9" fill="var(--d-muted)" opacity="0.7">{{ d.weekday }}</text>
                      <text v-if="d.income > 0" :x="25 + i*(650/6)" :y="106-(d.income/chartMax)*108" text-anchor="middle" font-size="10" font-weight="700" fill="#ff7f00">¥{{ d.income.toFixed(0) }}</text>
                    </g>
                  </svg>
                </div>
              </div>

              <!-- Calendar Heatmap -->
              <div class="d-card d-heatmap-card">
                <div class="d-card-header">
                  <h3>📅 收入热力图</h3>
                  <span class="d-card-hint">近 4 个月</span>
                </div>
                <div class="d-calendar">
                  <div class="d-cal-wrap">
                    <div class="d-cal-y-axis">
                      <span>一</span><span>三</span><span>五</span><span>日</span>
                    </div>
                    <div class="d-cal-scroll">
                      <div class="d-cal-months">
                        <span v-for="(week, wi) in calendarData" :key="'ml'+wi" :class="['d-cal-month', { empty: !week.label }]">{{ week.label }}</span>
                      </div>
                      <div class="d-cal-grid">
                        <div v-for="(week, wi) in calendarData" :key="'w'+wi" class="d-cal-week">
                          <div
                            v-for="(day, di) in week.days" :key="'d'+di"
                            :class="['d-cal-day', {
                              'd-cal-day-future': day.intensity < 0,
                              'd-cal-day-1': day.intensity >= 0 && day.intensity < 0.2,
                              'd-cal-day-2': day.intensity >= 0.2 && day.intensity < 0.5,
                              'd-cal-day-3': day.intensity >= 0.5 && day.intensity < 0.75,
                              'd-cal-day-4': day.intensity >= 0.75,
                              'd-cal-day-today': day.isToday,
                            }]"
                            :title="day.label + (day.value > 0 ? ' ¥' + day.value.toFixed(0) : ' 无数据')"
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="d-cal-legend">
                    <span>少</span><span class="d-cal-legend-dot d-cal-day-1"></span><span class="d-cal-legend-dot d-cal-day-2"></span><span class="d-cal-legend-dot d-cal-day-3"></span><span class="d-cal-legend-dot d-cal-day-4"></span><span>多</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Platform Detail Table -->
            <div class="d-card">
              <div class="d-card-header"><h3>🏷️ 平台明细表</h3></div>
              <div v-if="platformStats.length > 0" class="d-plat-table">
                <div class="d-plat-row d-plat-head">
                  <span>平台</span><span>天数</span><span>单量</span><span>收入</span><span>净收</span><span>保险</span><span>里程</span><span>时长</span>
                </div>
                <div v-for="p in platformStats" :key="p.name" class="d-plat-row">
                  <span class="d-plat-name">
                    <span class="d-plat-dot" :style="{ background: getPlatformStyle(p.name).color }"></span>
                    {{ getPlatformStyle(p.name).icon }} {{ p.name }}
                  </span>
                  <span>{{ p.count }}</span>
                  <span>{{ p.orders }}</span>
                  <span class="d-plat-income">{{ fmtMoney(p.income) }}</span>
                  <span class="d-plat-net">{{ fmtMoney(p.net) }}</span>
                  <span class="d-plat-ins">{{ fmtMoney(p.insurance) }}</span>
                  <span>{{ fmtNum(p.mileage) }} km</span>
                  <span>{{ fmtNum(p.duration) }} h</span>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT SUB-COLUMN: Donut + History (always visible) -->
          <div class="d-main-right">
            <!-- Platform Donut -->
            <div class="d-card">
              <div class="d-card-header"><h3>🍩 平台占比</h3></div>
              <div v-if="platformStats.length > 0" class="d-donut-wrap">
                <svg viewBox="0 0 160 160" class="d-donut">
                  <circle cx="80" cy="80" r="56" fill="none" stroke="var(--d-card-border)" stroke-width="14" />
                  <g v-for="(arc, i) in donutArcs" :key="'arc'+i">
                    <path :d="'M80 80 L' + arc.x1.toFixed(2) + ' ' + arc.y1.toFixed(2) + ' A60 60 0 ' + arc.large + ' 1 ' + arc.x2.toFixed(2) + ' ' + arc.y2.toFixed(2) + ' Z'" :fill="arc.color" opacity="0.85" />
                  </g>
                  <circle cx="80" cy="80" r="38" fill="var(--d-card-bg)" />
                  <text x="80" y="76" text-anchor="middle" font-size="17" font-weight="800" fill="var(--d-text)">¥{{ totalPlatformIncome.toFixed(0) }}</text>
                  <text x="80" y="93" text-anchor="middle" font-size="9" fill="var(--d-muted)">总收入</text>
                </svg>
                <div class="d-donut-legend">
                  <div v-for="p in platformStats" :key="p.name" class="d-donut-leg-item">
                    <span class="d-donut-leg-dot" :style="{ background: getPlatformStyle(p.name).color }"></span>
                    <span class="d-donut-leg-name">{{ p.name }}</span>
                    <span class="d-donut-leg-pct">{{ (p.income/totalPlatformIncome*100).toFixed(0) }}%</span>
                  </div>
                </div>
              </div>
              <div v-else class="d-empty-sm">暂无数据</div>
            </div>

            <!-- ═══ History Section (main area, scrollable) ═══ -->
            <div class="d-card d-history-card">
              <div class="d-card-header">
                <h3>📋 历史记录</h3>
                <span class="d-card-num">{{ filteredRecords.length }} 条</span>
              </div>

              <!-- History Mode Tabs -->
              <div class="d-history-tabs">
                <button
                  v-for="mode in [{k:'day',l:'按日'},{k:'month',l:'按月'},{k:'year',l:'按年'}]"
                  :key="mode.k"
                  :class="['d-history-tab', { active: historyMode === mode.k }]"
                  @click="historyMode = mode.k"
                >{{ mode.l }}</button>
              </div>

              <!-- Filters -->
              <div class="d-filter-row">
                <input type="text" v-model="searchQuery" placeholder="🔍 搜索..." class="d-input d-input-sm" />
                <select v-model="filterPlatform" class="d-input d-input-sm">
                  <option value="">全部平台</option>
                  <option v-for="p in platforms" :key="p.name" :value="p.name">{{ p.icon }} {{ p.name }}</option>
                </select>
                <input v-if="historyMode === 'day'" type="month" v-model="filterPeriod" class="d-input d-input-sm" />
                <input v-else type="number" v-model="filterYear" class="d-input d-input-sm" placeholder="年份" min="2020" max="2099" />
              </div>

              <!-- ═══ Day View ═══ -->
              <div v-if="historyMode === 'day'" class="d-history-body">
                <div v-if="groupedByDay.length === 0" class="d-empty">
                  <div class="d-empty-icon">🛵</div>
                  <p>暂无记录，去左边添加一条吧</p>
                </div>
                <div v-else class="d-history-list-day">
                  <div v-for="[date, records] in groupedByDay" :key="date" class="d-day-group">
                    <div class="d-day-head" @click="openDayDetail(date)">
                      <span class="d-day-date">
                        {{ fmtDate(date) }}
                        <svg class="d-day-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
                      </span>
                      <span class="d-day-sum">
                        {{ records.length }}条 · {{ records.reduce((s,r)=>s+(r.orders||0),0) }}单 · ¥{{ records.reduce((s,r)=>s+(r.income||0),0).toFixed(0) }}
                      </span>
                    </div>
                    <div v-for="r in records" :key="r.id" :class="['d-record', { 'd-record-active': editingId === r.id }]">
                      <div class="d-record-main" @click="editRecord(r)">
                        <span class="d-record-icon">{{ getPlatformStyle(r.platform).icon }}</span>
                        <span class="d-record-plat">{{ r.platform }}</span>
                        <span class="d-record-orders">{{ r.orders || 0 }}单</span>
                        <span class="d-record-income">{{ fmtMoney(r.income) }}</span>
                        <span class="d-record-net">净{{ fmtMoney((r.income||0)-(r.insurance||0)) }}</span>
                        <span v-if="r.mileage" class="d-record-mile">{{ r.mileage }}km</span>
                        <span v-if="r.duration" class="d-record-dur">{{ r.duration }}h</span>
                      </div>
                      <button class="d-record-del" @click.stop="removeRecord(r.id)" title="删除">✕</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ═══ Month View ═══ -->
              <div v-if="historyMode === 'month'" class="d-history-body">
                <div v-if="groupedByMonth.length === 0" class="d-empty">
                  <div class="d-empty-icon">📅</div>
                  <p>暂无记录</p>
                </div>
                <div v-else class="d-history-list-month">
                  <div v-for="[m, data] in groupedByMonth" :key="m" class="d-month-card">
                    <div class="d-month-head">
                      <span class="d-month-label">{{ fmtMonth(m) }}</span>
                      <div class="d-month-stats">
                        <span>{{ data.days.size }}天</span>
                        <span class="d-month-sep">·</span>
                        <span>{{ data.orders }}单</span>
                        <span class="d-month-sep">·</span>
                        <span>¥{{ (data.income).toFixed(0) }}</span>
                      </div>
                    </div>
                    <div class="d-month-bar-wrap">
                      <div class="d-month-bar" :style="{ width: Math.min(data.income / (goal.monthly || 1) * 100, 100) + '%' }"></div>
                    </div>
                    <div class="d-month-actions">
                      <button class="d-mini-btn" @click="shareType='month'; shareMonth=m; openShare()">📱 生成战绩图</button>
                    </div>
                    <div class="d-month-records" v-if="data.records.length <= 15">
                      <span v-for="r in data.records" :key="r.id" class="d-month-day-pill" @click="openDayDetail(r.date)" :title="r.date + ' ' + r.platform">
                        {{ r.date.slice(8) }}日 {{ r.platform }} ¥{{ (r.income||0).toFixed(0) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ═══ Year View ═══ -->
              <div v-if="historyMode === 'year'" class="d-history-body">
                <div v-if="groupedByYear.length === 0" class="d-empty">
                  <div class="d-empty-icon">📆</div>
                  <p>暂无记录</p>
                </div>
                <div v-else class="d-history-list-year">
                  <div v-for="[y, data] in groupedByYear" :key="y" class="d-year-card">
                    <div class="d-year-head">
                      <span class="d-year-label">{{ fmtYear(y) }}</span>
                      <div class="d-year-stats">
                        <span>{{ data.days.size }}天</span>
                        <span class="d-month-sep">·</span>
                        <span>{{ data.orders }}单</span>
                        <span class="d-month-sep">·</span>
                        <span>¥{{ (data.income).toFixed(0) }}</span>
                      </div>
                    </div>
                    <div class="d-year-extras" v-if="data.mileage || data.duration">
                      <span v-if="data.mileage">里程 {{ fmtNum(data.mileage) }} km</span>
                      <span v-if="data.duration">时长 {{ fmtNum(data.duration) }} h</span>
                      <span>日均 ¥{{ (data.income / (data.days.size || 1)).toFixed(0) }}</span>
                    </div>
                    <div class="d-month-actions">
                      <button class="d-mini-btn" @click="shareType='year'; shareYear=y; openShare()">📱 生成战绩图</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer class="d-footer">
          数据实时保存 · 支持导入导出 · Powered by 壹号栈
        </footer>
      </main>
    </div>

    <!-- ═══ Mobile Floating Share Button ═══ -->
    <button class="d-fab" @click="openShare" title="生成战绩截图">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
    </button>

    <!-- Goal Edit Modal -->
    <div v-if="showGoalEdit" class="d-modal-mask" @click.self="showGoalEdit = false">
      <div class="d-modal">
        <h3>🎯 设定目标</h3>
        <div class="d-form-g">
          <label>每日目标 ¥</label>
          <input type="number" v-model="goalForm.daily" class="d-input" min="0" />
        </div>
        <div class="d-form-g">
          <label>每月目标 ¥</label>
          <input type="number" v-model="goalForm.monthly" class="d-input" min="0" />
        </div>
        <div class="d-modal-actions">
          <button class="d-btn d-btn-ghost" @click="showGoalEdit = false">取消</button>
          <button class="d-btn d-btn-primary" @click="saveGoal">保存</button>
        </div>
      </div>
    </div>

    <!-- ═══ Day Detail Modal ═══ -->
    <Transition name="d-slide-up">
      <div v-if="showDayDetail" class="d-modal-mask d-detail-mask" @click.self="showDayDetail = false">
        <div class="d-detail-modal">
          <div class="d-detail-header">
            <h3>📋 {{ fmtDate(detailDate) }}</h3>
            <div class="d-detail-actions">
              <button class="d-mini-btn d-mini-btn-accent" @click="shareType='day'; shareDate=detailDate; showDayDetail=false; openShare()">📱 战绩图</button>
              <button class="d-detail-close" @click="showDayDetail = false">✕</button>
            </div>
          </div>
          <div class="d-detail-body">
            <!-- Summary cards -->
            <div class="d-detail-summary" v-if="detailRecords.length > 0">
              <div class="d-ds-item">
                <span class="d-ds-val">{{ detailStats.totalOrders }}</span>
                <span class="d-ds-label">总单量</span>
              </div>
              <div class="d-ds-item d-ds-accent">
                <span class="d-ds-val">{{ fmtMoney0(detailStats.totalIncome) }}</span>
                <span class="d-ds-label">总收入</span>
              </div>
              <div class="d-ds-item">
                <span class="d-ds-val">{{ fmtMoney0(detailStats.netIncome) }}</span>
                <span class="d-ds-label">净收入</span>
              </div>
              <div class="d-ds-item">
                <span class="d-ds-val">{{ fmtNum(detailStats.totalMileage) }}</span>
                <span class="d-ds-label">里程km</span>
              </div>
              <div class="d-ds-item">
                <span class="d-ds-val">{{ fmtNum(detailStats.totalDuration) }}</span>
                <span class="d-ds-label">时长h</span>
              </div>
              <div class="d-ds-item">
                <span class="d-ds-val">{{ fmtMoney0(detailStats.avgPrice) }}</span>
                <span class="d-ds-label">均价</span>
              </div>
            </div>

            <!-- Platform breakdown -->
            <div v-if="detailByPlatform.length > 0" class="d-detail-section">
              <div class="d-detail-section-title">平台明细</div>
              <div v-for="p in detailByPlatform" :key="p.name" class="d-detail-plat">
                <span class="d-dp-icon" :style="{ background: getPlatformStyle(p.name).color + '20', color: getPlatformStyle(p.name).color }">{{ getPlatformStyle(p.name).icon }}</span>
                <div class="d-dp-info">
                  <span class="d-dp-name">{{ p.name }}</span>
                  <span class="d-dp-meta">{{ p.count }}条 · {{ p.orders }}单 · {{ fmtNum(p.mileage) }}km · {{ fmtNum(p.duration) }}h</span>
                </div>
                <div class="d-dp-money">
                  <span class="d-dp-income">{{ fmtMoney0(p.income) }}</span>
                  <span class="d-dp-net">净 {{ fmtMoney0(p.income - p.insurance) }}</span>
                </div>
              </div>
            </div>

            <!-- Record timeline -->
            <div class="d-detail-section">
              <div class="d-detail-section-title">记录列表 ({{ detailRecords.length }}条)</div>
              <div v-for="r in detailRecords" :key="r.id" class="d-detail-record" @click="showDayDetail=false; editRecord(r)">
                <span class="d-dr-plat">{{ getPlatformStyle(r.platform).icon }} {{ r.platform }}</span>
                <span class="d-dr-orders">{{ r.orders || 0 }}单</span>
                <span class="d-dr-income">{{ fmtMoney(r.income) }}</span>
                <span v-if="r.mileage" class="d-dr-extra">{{ r.mileage }}km</span>
                <span v-if="r.duration" class="d-dr-extra">{{ r.duration }}h</span>
                <span v-if="r.note" class="d-dr-note" :title="r.note">📝</span>
              </div>
            </div>

            <div v-if="detailRecords.length === 0" class="d-empty">
              <div class="d-empty-icon">📭</div>
              <p>该日暂无记录</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ═══ Share Card Modal ═══ -->
    <Transition name="d-slide-up">
      <div v-if="showShareModal" class="d-modal-mask d-share-mask" @click.self="showShareModal = false">
        <div class="d-share-modal">
          <div class="d-share-header">
            <h3>📱 生成战绩截图</h3>
            <button class="d-detail-close" @click="showShareModal = false">✕</button>
          </div>
          <div class="d-share-body">
            <!-- Type selector -->
            <div class="d-share-types">
              <button :class="['d-share-type', { active: shareType === 'day' }]" @click="shareType='day'; onShareTypeChange()">按天</button>
              <button :class="['d-share-type', { active: shareType === 'month' }]" @click="shareType='month'; onShareTypeChange()">按月</button>
              <button :class="['d-share-type', { active: shareType === 'year' }]" @click="shareType='year'; onShareTypeChange()">按年</button>
            </div>
            <!-- Date picker -->
            <div class="d-share-picker">
              <input v-if="shareType === 'day'" type="date" v-model="shareDate" class="d-input" @change="shareDataUrl=''" />
              <input v-else-if="shareType === 'month'" type="month" v-model="shareMonth" class="d-input" @change="shareDataUrl=''" />
              <input v-else type="number" v-model="shareYear" class="d-input" placeholder="年份" min="2020" max="2099" @change="shareDataUrl=''" />
            </div>

            <!-- Preview -->
            <div class="d-share-preview-wrap">
              <img v-if="shareDataUrl" :src="shareDataUrl" class="d-share-preview" alt="战绩截图" />
              <div v-else-if="shareLoading" class="d-share-loading">
                <div class="d-spinner"></div>
                <span>生成中...</span>
              </div>
              <div v-else class="d-share-placeholder" @click="generateShareImage">
                <span class="d-share-ph-icon">🎯</span>
                <span class="d-share-ph-text">点击生成战绩图</span>
                <span class="d-share-ph-hint">{{ shareTitle }} · {{ shareStats.totalOrders }}单 · {{ fmtMoney0(shareStats.totalIncome) }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="d-share-actions" v-if="shareDataUrl">
              <button class="d-btn d-btn-primary" @click="shareToFriend">📤 分享给朋友</button>
              <button class="d-btn d-btn-ghost" @click="downloadShareImage">💾 保存图片</button>
            </div>
            <div class="d-share-actions" v-else>
              <button class="d-btn d-btn-primary" @click="generateShareImage">🎨 生成战绩图</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style src="./DeliveryPage.css"></style>
