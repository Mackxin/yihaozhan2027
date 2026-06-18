<script setup>
import { ref, reactive, computed } from 'vue'
import {
  store,
  addNavCategory, updateNavCategoryTitle, deleteNavCategory,
  addNavLink, updateNavLink, deleteNavLink,
  addNewsGroup, updateNewsGroupDate, deleteNewsGroup,
  addNewsItem, updateNewsItem, deleteNewsItem,
  exportAllData, importAllData
} from '../store'

const activeTab = ref('overview')
const contentRef = ref(null)
const helpContentRef = ref(null)

// ─── Help sections ───
const helpSections = [
  { id: 'h1', icon: '🌐', title: '网站架构' },
  { id: 'h2', icon: '🧭', title: '导航管理' },
  { id: 'h3', icon: '📰', title: '讯息管理' },
  { id: 'h4', icon: '💾', title: '数据备份与恢复' },
  { id: 'h5', icon: '🚀', title: '更新网站数据' },
  { id: 'h6', icon: '🔍', title: '全站搜索' },
  { id: 'h7', icon: '🏠', title: '首页头像设置' },
  { id: 'h8', icon: '🌍', title: '部署到服务器' },
  { id: 'h9', icon: '✏️', title: '随记管理' },
  { id: 'h10', icon: '⌨️', title: '快捷键' },
]
const scrollToHelp = (id) => {
  const el = helpContentRef.value?.querySelector('#' + id)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ─── Nav state ───
const navSearch = ref('')
const selectedCatId = ref(null)
const editingCat = reactive({ id: null, title: '' })
const newCatTitle = ref('')
const showAddCat = ref(false)
const newLink = reactive({ catId: null, name: '', url: '' })
const editingLink = reactive({ catId: null, index: -1, name: '', url: '' })

// ─── News state ───
const selectedDate = ref(null)
const editingGroupDate = reactive({ old: '', new: '' })
const newGroupDate = ref('')
const showAddGroup = ref(false)
const newItem = reactive({ date: '', title: '', url: '', desc: '' })
const editingItem = reactive({ date: '', index: -1, title: '', url: '', desc: '' })

// ─── Action log ───
const actionLog = ref([])
const log = (msg) => {
  const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  actionLog.value.unshift({ time, msg })
  if (actionLog.value.length > 20) actionLog.value.pop()
}

// ─── Global Search (admin) ───
const globalSearch = ref('')
const globalSearchOpen = ref(false)
const globalSearchResults = computed(() => {
  const kw = globalSearch.value.toLowerCase().trim()
  if (!kw) return { nav: [], news: [] }
  const nav = []
  store.navCategories.forEach(cat => {
    cat.links.forEach(link => {
      if (link.name.toLowerCase().includes(kw) || link.url.toLowerCase().includes(kw)) {
        nav.push({ cat: cat.title, name: link.name, catId: cat.id })
      }
    })
  })
  const news = []
  store.timelineItems.forEach(group => {
    group.items.forEach(item => {
      if (item.title.toLowerCase().includes(kw) || item.desc.some(d => d.toLowerCase().includes(kw))) {
        news.push({ date: group.date, title: item.title })
      }
    })
  })
  return { nav: nav.slice(0, 5), news: news.slice(0, 5) }
})
const globalTotal = computed(() => globalSearchResults.value.nav.length + globalSearchResults.value.news.length)
const goNavFromSearch = (result) => {
  activeTab.value = 'nav'
  selectedCatId.value = result.catId
  globalSearch.value = ''
  globalSearchOpen.value = false
}
const goNewsFromSearch = (result) => {
  activeTab.value = 'news'
  selectedDate.value = result.date
  globalSearch.value = ''
  globalSearchOpen.value = false
}
const closeGlobalSearch = () => { globalSearchOpen.value = false }

// ─── Computed ───
const filteredCategories = computed(() => {
  const kw = navSearch.value.toLowerCase().trim()
  if (!kw) return store.navCategories
  return store.navCategories.filter(c =>
    c.title.toLowerCase().includes(kw) ||
    c.links.some(l => l.name.toLowerCase().includes(kw))
  )
})

const selectedCat = computed(() =>
  store.navCategories.find(c => c.id === selectedCatId.value)
)
const selectedGroup = computed(() =>
  store.timelineItems.find(g => g.date === selectedDate.value)
)

const navTotalLinks = computed(() => store.navCategories.reduce((s, c) => s + c.links.length, 0))
const newsTotalItems = computed(() => store.timelineItems.reduce((s, g) => s + g.items.length, 0))

// Group news by month
const groupedByMonth = computed(() => {
  const groups = {}
  store.timelineItems.forEach(g => {
    const month = g.date.slice(0, 7) // "2026-01"
    if (!groups[month]) groups[month] = []
    groups[month].push(g)
  })
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
})

// Auto-select first item
const selectCat = (id) => { selectedCatId.value = id }
const selectDate = (date) => { selectedDate.value = date }

// ─── Nav handlers ───
const startEditCat = (cat) => { editingCat.id = cat.id; editingCat.title = cat.title }
const saveEditCat = () => {
  if (editingCat.title.trim()) { updateNavCategoryTitle(editingCat.id, editingCat.title.trim()); log(`修改分类「${editingCat.title.trim()}」`) }
  editingCat.id = null
}
const cancelEditCat = () => { editingCat.id = null }
const handleAddCat = () => {
  if (newCatTitle.value.trim()) {
    addNavCategory(newCatTitle.value.trim())
    log(`新增分类「${newCatTitle.value.trim()}」`)
    const newId = store.navCategories[store.navCategories.length - 1]?.id
    if (newId) selectedCatId.value = newId
    newCatTitle.value = ''
    showAddCat.value = false
  }
}
const handleDeleteCat = (id) => {
  const cat = store.navCategories.find(c => c.id === id)
  if (cat && confirm(`确认删除分类「${cat.title}」及其全部 ${cat.links.length} 个链接？`)) {
    log(`删除分类「${cat.title}」`)
    deleteNavCategory(id)
    if (selectedCatId.value === id) selectedCatId.value = store.navCategories[0]?.id || null
  }
}
const startAddLink = () => { newLink.catId = selectedCatId.value; newLink.name = ''; newLink.url = '' }
const saveAddLink = () => {
  if (newLink.name.trim() && newLink.url.trim()) {
    addNavLink(newLink.catId, newLink.name.trim(), newLink.url.trim())
    log(`新增链接「${newLink.name.trim()}」`)
    newLink.catId = null; newLink.name = ''; newLink.url = ''
  }
}
const startEditLink = (idx, link) => {
  editingLink.catId = selectedCatId.value; editingLink.index = idx
  editingLink.name = link.name; editingLink.url = link.url
}
const saveEditLink = () => {
  if (editingLink.name.trim() && editingLink.url.trim()) {
    updateNavLink(editingLink.catId, editingLink.index, editingLink.name.trim(), editingLink.url.trim())
    log(`修改链接「${editingLink.name.trim()}」`)
  }
  editingLink.catId = null; editingLink.index = -1
}
const cancelEditLink = () => { editingLink.catId = null; editingLink.index = -1 }

// ─── News handlers ───
const handleAddGroup = () => {
  if (newGroupDate.value) {
    addNewsGroup(newGroupDate.value)
    log(`新增日期「${newGroupDate.value}」`)
    selectedDate.value = newGroupDate.value
    newGroupDate.value = ''
    showAddGroup.value = false
  }
}
const startEditGroupDate = (date) => { editingGroupDate.old = date; editingGroupDate.new = date }
const saveEditGroupDate = () => {
  if (editingGroupDate.new && editingGroupDate.new !== editingGroupDate.old) {
    updateNewsGroupDate(editingGroupDate.old, editingGroupDate.new)
    log(`修改日期 ${editingGroupDate.old} → ${editingGroupDate.new}`)
    if (selectedDate.value === editingGroupDate.old) selectedDate.value = editingGroupDate.new
  }
  editingGroupDate.old = ''
}
const handleDeleteGroup = (date) => {
  const g = store.timelineItems.find(g => g.date === date)
  if (g && confirm(`确认删除日期「${date}」及其全部 ${g.items.length} 条讯息？`)) {
    log(`删除日期「${date}」`)
    deleteNewsGroup(date)
    if (selectedDate.value === date) selectedDate.value = store.timelineItems[0]?.date || null
  }
}
const startAddItem = () => { newItem.date = selectedDate.value; newItem.title = ''; newItem.url = ''; newItem.desc = '' }
const saveAddItem = () => {
  if (newItem.title.trim() && newItem.url.trim()) {
    addNewsItem(newItem.date, { title: newItem.title.trim(), url: newItem.url.trim(), desc: newItem.desc.split('\n').filter(l => l.trim()) })
    log(`新增讯息「${newItem.title.trim()}」`)
    newItem.date = ''; newItem.title = ''; newItem.url = ''; newItem.desc = ''
  }
}
const startEditItem = (idx, item) => {
  editingItem.date = selectedDate.value; editingItem.index = idx
  editingItem.title = item.title; editingItem.url = item.url; editingItem.desc = item.desc.join('\n')
}
const saveEditItem = () => {
  if (editingItem.title.trim() && editingItem.url.trim()) {
    updateNewsItem(editingItem.date, editingItem.index, { title: editingItem.title.trim(), url: editingItem.url.trim(), desc: editingItem.desc.split('\n').filter(l => l.trim()) })
    log(`修改讯息「${editingItem.title.trim()}」`)
  }
  editingItem.date = ''; editingItem.index = -1
}
const cancelEditItem = () => { editingItem.date = ''; editingItem.index = -1 }

// ─── Data tools ───
const fileInput = ref(null)
const handleExport = () => {
  const blob = new Blob([exportAllData()], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `yihao-data-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  log('导出数据包')
}
const handleImport = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => { try { importAllData(ev.target.result); alert('数据导入成功！'); log('导入数据包') } catch { alert('导入失败') } }
  reader.readAsText(file)
  e.target.value = ''
}

// ─── Update dist ───
const building = ref(false)
const handleBuild = () => {
  building.value = true
  log('生成 data.json...')
  setTimeout(() => {
    const data = exportAllData()
    const blob = new Blob([data], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'data.json'
    a.click()
    building.value = false
    log('✅ data.json 已下载，请放到 dist 文件夹后上传到服务器')
  }, 300)
}
</script>

<template>
  <div class="admin-page" ref="contentRef">
    <!-- ═══ Top Bar ═══ -->
    <div class="admin-topbar">
      <div class="admin-topbar-left">
        <h1 class="admin-logo">壹号栈后台管理</h1>
      </div>
      <div class="admin-topbar-center">
        <button :class="['admin-tab', { active: activeTab === 'overview' }]" @click="activeTab = 'overview'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          总览
        </button>
        <button :class="['admin-tab', { active: activeTab === 'nav' }]" @click="activeTab = 'nav'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
          导航
          <span class="admin-tab-count">{{ store.navCategories.length }}</span>
        </button>
        <button :class="['admin-tab', { active: activeTab === 'news' }]" @click="activeTab = 'news'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2z"/><line x1="10" y1="6" x2="18" y2="6"/><line x1="10" y1="10" x2="18" y2="10"/></svg>
          讯息
          <span class="admin-tab-count">{{ newsTotalItems }}</span>
        </button>
        <button :class="['admin-tab', { active: activeTab === 'help' }]" @click="activeTab = 'help'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          帮助
        </button>
      </div>
      <div class="admin-topbar-right">
        <!-- Admin Global Search -->
        <div class="admin-global-search">
          <div class="uni-search uni-search-compact">
            <div class="uni-search-wrapper">
              <svg class="uni-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="搜索全站..."
                v-model="globalSearch"
                class="uni-search-input"
                @focus="globalSearchOpen = true"
              />
              <button v-if="globalSearch" class="uni-search-clear" @click="globalSearch = ''; globalSearchOpen = false">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          <!-- Dropdown -->
          <div v-if="globalSearchOpen && globalSearch.trim()" class="admin-search-dropdown">
            <div v-if="globalTotal === 0" class="admin-search-empty">未找到匹配结果</div>
            <template v-if="globalSearchResults.nav.length">
              <div class="admin-search-label">导航</div>
              <div v-for="(r, i) in globalSearchResults.nav" :key="'n'+i" class="admin-search-item" @click="goNavFromSearch(r)">
                <span class="admin-search-badge admin-search-badge-nav">导航</span>
                <strong>{{ r.name }}</strong>
                <small>{{ r.cat }}</small>
              </div>
            </template>
            <template v-if="globalSearchResults.news.length">
              <div class="admin-search-label">讯息</div>
              <div v-for="(r, i) in globalSearchResults.news" :key="'w'+i" class="admin-search-item" @click="goNewsFromSearch(r)">
                <span class="admin-search-badge admin-search-badge-news">讯息</span>
                <strong>{{ r.title }}</strong>
                <small>{{ r.date }}</small>
              </div>
            </template>
          </div>
        </div>

        <button class="admin-btn admin-btn-primary" @click="handleBuild" :disabled="building" title="导出 data.json，放入 dist 文件夹后上传到服务器">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          {{ building ? '生成中...' : '更新网站' }}
        </button>
        <button class="admin-btn admin-btn-ghost" @click="handleExport" title="导出数据">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          导出
        </button>
        <button class="admin-btn admin-btn-ghost" @click="fileInput?.click()" title="导入数据">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          导入
        </button>
        <input ref="fileInput" type="file" accept=".json" style="display:none" @change="handleImport" />
      </div>
    </div>

    <!-- ═══ Main Content ═══ -->
    <div class="admin-main">

      <!-- ── OVERVIEW ── -->
      <template v-if="activeTab === 'overview'">
        <div class="admin-overview">
          <div class="admin-overview-header">
            <h2>站点总览</h2>
            <span class="admin-overview-date">{{ new Date().toLocaleDateString('zh-CN') }}</span>
          </div>

          <!-- Stats grid -->
          <div class="admin-stats-grid">
            <div class="admin-stat-card">
              <div class="admin-stat-icon admin-stat-icon-nav">🧭</div>
              <div class="admin-stat-info">
                <div class="admin-stat-num">{{ store.navCategories.length }}</div>
                <div class="admin-stat-label">导航分类</div>
              </div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-icon admin-stat-icon-link">🔗</div>
              <div class="admin-stat-info">
                <div class="admin-stat-num">{{ navTotalLinks }}</div>
                <div class="admin-stat-label">导航链接</div>
              </div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-icon admin-stat-icon-news">📰</div>
              <div class="admin-stat-info">
                <div class="admin-stat-num">{{ store.timelineItems.length }}</div>
                <div class="admin-stat-label">讯息天数</div>
              </div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-icon admin-stat-icon-item">📝</div>
              <div class="admin-stat-info">
                <div class="admin-stat-num">{{ newsTotalItems }}</div>
                <div class="admin-stat-label">讯息条数</div>
              </div>
            </div>
          </div>

          <!-- Quick actions + Activity log -->
          <div class="admin-overview-grid">
            <div class="admin-panel-card">
              <h3 class="admin-panel-title">快捷操作</h3>
              <div class="admin-quick-actions">
                <button class="admin-quick-btn" @click="activeTab = 'nav'; handleAddCat(); showAddCat = true">
                  <span>+ 新分类</span>
                </button>
                <button class="admin-quick-btn" @click="activeTab = 'news'; showAddGroup = true">
                  <span>+ 新日期</span>
                </button>
                <button class="admin-quick-btn" @click="handleBuild">
                  <span>📦 更新网站数据</span>
                </button>
                <button class="admin-quick-btn" @click="handleExport">
                  <span>💾 导出备份</span>
                </button>
              </div>
            </div>

            <div class="admin-panel-card">
              <h3 class="admin-panel-title">操作日志 <span class="admin-panel-badge">{{ actionLog.length }}</span></h3>
              <div class="admin-log-list">
                <div v-if="actionLog.length === 0" class="admin-log-empty">暂无操作记录</div>
                <div v-for="(item, i) in actionLog" :key="i" class="admin-log-item">
                  <span class="admin-log-time">{{ item.time }}</span>
                  <span class="admin-log-msg">{{ item.msg }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ── NAV: Sidebar + Detail ── -->
      <template v-if="activeTab === 'nav'">
        <aside class="admin-sidebar">
          <div class="admin-sidebar-search">
            <input class="admin-search" type="text" placeholder="搜索分类..." v-model="navSearch" />
            <button class="admin-btn admin-btn-primary admin-btn-sm" @click="showAddCat = !showAddCat">+</button>
          </div>
          <div v-if="showAddCat" class="admin-sidebar-add">
            <input class="admin-input admin-input-sm" v-model="newCatTitle" placeholder="新分类名称" @keyup.enter="handleAddCat" autofocus />
            <div class="admin-sidebar-add-btns">
              <button class="admin-btn admin-btn-xs admin-btn-primary" @click="handleAddCat">确定</button>
              <button class="admin-btn admin-btn-xs admin-btn-ghost" @click="showAddCat = false">取消</button>
            </div>
          </div>
          <div class="admin-sidebar-list">
            <div
              v-for="cat in filteredCategories" :key="cat.id"
              :class="['admin-sidebar-item', { active: selectedCatId === cat.id }]"
              @click="selectCat(cat.id)"
            >
              <div class="admin-sidebar-item-info">
                <span class="admin-sidebar-item-title">{{ cat.title }}</span>
                <span class="admin-sidebar-item-badge">{{ cat.links.length }}</span>
              </div>
              <div class="admin-sidebar-item-actions" @click.stop>
                <button class="admin-icon-btn" @click="startEditCat(cat)" title="编辑">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="admin-icon-btn admin-icon-btn-danger" @click="handleDeleteCat(cat.id)" title="删除">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main class="admin-detail">
          <div v-if="editingCat.id" class="admin-detail-edit-bar">
            <input class="admin-input" v-model="editingCat.title" @keyup.enter="saveEditCat" />
            <button class="admin-btn admin-btn-primary admin-btn-sm" @click="saveEditCat">保存</button>
            <button class="admin-btn admin-btn-ghost admin-btn-sm" @click="cancelEditCat">取消</button>
          </div>

          <template v-if="selectedCat">
            <div class="admin-detail-header">
              <h2 class="admin-detail-title">{{ selectedCat.title }}</h2>
              <span class="admin-detail-subtitle">{{ selectedCat.links.length }} 个链接</span>
              <button class="admin-btn admin-btn-primary admin-btn-sm" @click="startAddLink">+ 添加链接</button>
            </div>

            <div v-if="newLink.catId === selectedCatId" class="admin-add-form">
              <div class="admin-add-form-title">添加新链接</div>
              <div class="admin-add-form-row">
                <div class="admin-add-form-field">
                  <label>名称</label>
                  <input class="admin-input" v-model="newLink.name" placeholder="链接名称" />
                </div>
                <div class="admin-add-form-field">
                  <label>链接</label>
                  <input class="admin-input" v-model="newLink.url" placeholder="https://..." @keyup.enter="saveAddLink" />
                </div>
              </div>
              <div class="admin-add-form-actions">
                <button class="admin-btn admin-btn-primary" @click="saveAddLink">添加链接</button>
                <button class="admin-btn admin-btn-ghost" @click="newLink.catId = null">取消</button>
              </div>
            </div>

            <div class="admin-link-grid">
              <div v-for="(link, i) in selectedCat.links" :key="i" class="admin-link-card">
                <template v-if="editingLink.catId === selectedCatId && editingLink.index === i">
                  <input class="admin-input admin-input-sm" v-model="editingLink.name" placeholder="名称" />
                  <input class="admin-input admin-input-sm" v-model="editingLink.url" placeholder="URL" />
                  <div class="admin-link-card-btns">
                    <button class="admin-btn admin-btn-xs admin-btn-primary" @click="saveEditLink">保存</button>
                    <button class="admin-btn admin-btn-xs admin-btn-ghost" @click="cancelEditLink">取消</button>
                  </div>
                </template>
                <template v-else>
                  <div class="admin-link-card-content">
                    <strong class="admin-link-card-name">{{ link.name }}</strong>
                    <span class="admin-link-card-url">{{ link.url }}</span>
                  </div>
                  <div class="admin-link-card-actions">
                    <button class="admin-icon-btn" @click="startEditLink(i, link)" title="编辑">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="admin-icon-btn admin-icon-btn-danger" @click="deleteNavLink(selectedCatId, i)" title="删除">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </template>

          <div v-else class="admin-detail-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            <p>从左侧选择一个分类开始编辑</p>
          </div>
        </main>
      </template>

      <!-- ── NEWS: Sidebar + Detail ── -->
      <template v-if="activeTab === 'news'">
        <aside class="admin-sidebar">
          <div class="admin-sidebar-search">
            <span class="admin-sidebar-label">日期列表</span>
            <button class="admin-btn admin-btn-primary admin-btn-sm" @click="showAddGroup = !showAddGroup">+</button>
          </div>
          <div v-if="showAddGroup" class="admin-sidebar-add">
            <input class="admin-input admin-input-sm" type="date" v-model="newGroupDate" />
            <div class="admin-sidebar-add-btns">
              <button class="admin-btn admin-btn-xs admin-btn-primary" @click="handleAddGroup">确定</button>
              <button class="admin-btn admin-btn-xs admin-btn-ghost" @click="showAddGroup = false">取消</button>
            </div>
          </div>
          <div class="admin-sidebar-list">
            <template v-for="[month, groups] in groupedByMonth" :key="month">
              <div class="admin-sidebar-month">{{ month }}</div>
              <div
                v-for="group in groups" :key="group.date"
                :class="['admin-sidebar-item', { active: selectedDate === group.date }]"
                @click="selectDate(group.date)"
              >
                <div class="admin-sidebar-item-info">
                  <span class="admin-sidebar-item-title">{{ group.date.slice(5) }}</span>
                  <span class="admin-sidebar-item-badge">{{ group.items.length }}</span>
                </div>
                <div class="admin-sidebar-item-actions" @click.stop>
                  <button class="admin-icon-btn" @click="startEditGroupDate(group.date)" title="编辑日期">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="admin-icon-btn admin-icon-btn-danger" @click="handleDeleteGroup(group.date)" title="删除">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </aside>

        <main class="admin-detail">
          <div v-if="editingGroupDate.old" class="admin-detail-edit-bar">
            <input class="admin-input" type="date" v-model="editingGroupDate.new" />
            <button class="admin-btn admin-btn-primary admin-btn-sm" @click="saveEditGroupDate">保存</button>
            <button class="admin-btn admin-btn-ghost admin-btn-sm" @click="editingGroupDate.old = ''">取消</button>
          </div>

          <template v-if="selectedGroup">
            <div class="admin-detail-header">
              <h2 class="admin-detail-title">{{ selectedGroup.date }}</h2>
              <span class="admin-detail-subtitle">{{ selectedGroup.items.length }} 条讯息</span>
              <button class="admin-btn admin-btn-primary admin-btn-sm" @click="startAddItem">+ 添加讯息</button>
            </div>

            <div v-if="newItem.date === selectedDate" class="admin-add-form">
              <div class="admin-add-form-title">添加新讯息</div>
              <div class="admin-add-form-row">
                <div class="admin-add-form-field">
                  <label>标题</label>
                  <input class="admin-input" v-model="newItem.title" placeholder="输入讯息标题" />
                </div>
                <div class="admin-add-form-field">
                  <label>链接</label>
                  <input class="admin-input" v-model="newItem.url" placeholder="https://..." />
                </div>
              </div>
              <div class="admin-add-form-field">
                <label>描述（每行一条）</label>
                <textarea class="admin-textarea" v-model="newItem.desc" placeholder="第一行描述&#10;第二行描述..." rows="4" />
              </div>
              <div class="admin-add-form-actions">
                <button class="admin-btn admin-btn-primary" @click="saveAddItem">添加讯息</button>
                <button class="admin-btn admin-btn-ghost" @click="newItem.date = ''">取消</button>
              </div>
            </div>

            <div class="admin-news-list">
              <div v-for="(item, i) in selectedGroup.items" :key="i" class="admin-news-card">
                <template v-if="editingItem.date === selectedDate && editingItem.index === i">
                  <input class="admin-input" v-model="editingItem.title" placeholder="标题" />
                  <input class="admin-input" v-model="editingItem.url" placeholder="URL" />
                  <textarea class="admin-textarea" v-model="editingItem.desc" placeholder="描述（每行一条）" rows="3" />
                  <div class="admin-add-form-actions">
                    <button class="admin-btn admin-btn-primary admin-btn-sm" @click="saveEditItem">保存</button>
                    <button class="admin-btn admin-btn-ghost admin-btn-sm" @click="cancelEditItem">取消</button>
                  </div>
                </template>
                <template v-else>
                  <div class="admin-news-card-head">
                    <h3 class="admin-news-card-title">{{ item.title }}</h3>
                    <div class="admin-link-card-actions">
                      <button class="admin-icon-btn" @click="startEditItem(i, item)" title="编辑">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button class="admin-icon-btn admin-icon-btn-danger" @click="deleteNewsItem(selectedDate, i)" title="删除">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                  <a class="admin-news-card-url" :href="item.url" target="_blank">{{ item.url }}</a>
                  <p v-for="(d, j) in item.desc" :key="j" class="admin-news-card-desc">{{ d }}</p>
                </template>
              </div>
            </div>
          </template>

          <div v-else class="admin-detail-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2z"/><line x1="10" y1="6" x2="18" y2="6"/><line x1="10" y1="10" x2="18" y2="10"/></svg>
            <p>从左侧选择一个日期开始编辑</p>
          </div>
        </main>
      </template>

      <!-- ── HELP ── -->
      <template v-if="activeTab === 'help'">
        <div class="help-panel">
          <div class="help-toc">
            <h3 class="help-toc-title">目录</h3>
            <a v-for="s in helpSections" :key="s.id" :href="'#' + s.id" class="help-toc-link" @click.prevent="scrollToHelp(s.id)">{{ s.icon }} {{ s.title }}</a>
          </div>

          <div class="help-content" ref="helpContentRef">
            <div class="help-hero">
              <h1>🚀 壹号栈 使用指南</h1>
              <p>完整的功能说明与操作教程，帮助您快速管理网站内容</p>
            </div>

            <!-- 1. 网站架构 -->
            <section :id="'h1'" class="help-section">
              <h2><span class="help-section-icon">🌐</span>网站架构</h2>
              <p>壹号栈是一个单页应用（SPA），包含 <strong>5 个页面</strong>，通过底部导航栏切换：</p>
              <div class="help-table">
                <div class="help-table-row help-table-head"><span>页面</span><span>功能说明</span></div>
                <div class="help-table-row"><strong>🏠 首页</strong><span>网站门面，展示头像、简介和快速入口</span></div>
                <div class="help-table-row"><strong>🧭 导航</strong><span>收录的网站链接，按分类整理</span></div>
                <div class="help-table-row"><strong>📰 讯息</strong><span>时间线形式记录的资源、资讯和灵感</span></div>
                <div class="help-table-row"><strong>✏️ 随记</strong><span>个人笔记，支持搜索、置顶、标签和排序</span></div>
                <div class="help-table-row"><strong>⚙️ 管理</strong><span>后台管理面板，编辑所有数据</span></div>
              </div>
            </section>

            <!-- 2. 导航管理 -->
            <section :id="'h2'" class="help-section">
              <h2><span class="help-section-icon">🧭</span>导航管理</h2>
              <p>导航页用于收录各类网站链接，按分类组织。左侧显示分类列表（三列），右侧显示链接详情。</p>
              <h3>分类操作</h3>
              <ul>
                <li><strong>新增分类</strong>：点击左上角 <code>+</code> 按钮，输入分类名称后确定</li>
                <li><strong>编辑分类</strong>：悬停在分类项上，点击 ✏️ 编辑图标</li>
                <li><strong>删除分类</strong>：点击 🗑️ 图标，会同时删除该分类下的所有链接</li>
                <li><strong>搜索分类</strong>：在顶部搜索框输入关键词过滤</li>
              </ul>
              <h3>链接操作</h3>
              <ul>
                <li><strong>添加链接</strong>：选中分类后，点击 <code>+ 添加链接</code>，填写名称和 URL</li>
                <li><strong>编辑链接</strong>：点击链接卡片上的 ✏️ 图标直接编辑</li>
                <li><strong>删除链接</strong>：点击链接卡片上的 🗑️ 图标删除</li>
              </ul>
              <div class="help-tip">
                <strong>💡 提示</strong>：删除分类会同时删除其下所有链接，请谨慎操作。建议先导出备份。
              </div>
            </section>

            <!-- 3. 讯息管理 -->
            <section :id="'h3'" class="help-section">
              <h2><span class="help-section-icon">📰</span>讯息管理</h2>
              <p>讯息页以时间线形式展示内容，左侧按月份分组（三列），右侧显示当天的讯息列表。</p>
              <h3>日期操作</h3>
              <ul>
                <li><strong>新增日期</strong>：点击左上角 <code>+</code>，选择日期后确定</li>
                <li><strong>修改日期</strong>：点击日期旁的 ✏️ 图标修改</li>
                <li><strong>删除日期</strong>：点击 🗑️ 图标，会同时删除该日期下所有讯息</li>
                <li><strong>月份分组</strong>：左侧列表自动按「年-月」分组，降序排列</li>
              </ul>
              <h3>讯息操作</h3>
              <ul>
                <li><strong>添加讯息</strong>：选中日期后，点击 <code>+ 添加讯息</code></li>
                <li><strong>标题</strong>：讯息的名称，必填</li>
                <li><strong>链接</strong>：讯息的来源链接，必填</li>
                <li><strong>描述</strong>：多行文本，每行一条描述信息，选填</li>
              </ul>
            </section>

            <!-- 4. 数据备份与恢复 -->
            <section :id="'h4'" class="help-section">
              <h2><span class="help-section-icon">💾</span>数据备份与恢复</h2>
              <p>数据操作按钮位于后台管理顶部右侧：</p>
              <div class="help-table">
                <div class="help-table-row help-table-head"><span>按钮</span><span>功能说明</span></div>
                <div class="help-table-row"><strong>📦 更新网站</strong><span>下载 data.json 文件，用于更新线上数据（见下文）</span></div>
                <div class="help-table-row"><strong>⬇️ 导出</strong><span>导出完整数据为 JSON 文件，用于备份或迁移</span></div>
                <div class="help-table-row"><strong>⬆️ 导入</strong><span>从 JSON 文件导入数据，恢复之前的备份</span></div>
              </div>
              <div class="help-tip">
                <strong>⚠️ 注意</strong>：导入会覆盖当前所有数据！建议定期导出备份。
              </div>
            </section>

            <!-- 5. 更新网站 -->
            <section :id="'h5'" class="help-section">
              <h2><span class="help-section-icon">🚀</span>更新网站数据</h2>
              <p>在后台编辑完数据后，有两种方式更新到线上服务器：</p>

              <h3>方式一：只更新数据（推荐，最快）</h3>
              <div class="help-steps">
                <div class="help-step"><span class="help-step-num">1</span>点击后台顶部的 <strong>「更新网站」</strong> 按钮，下载 <code>data.json</code></div>
                <div class="help-step"><span class="help-step-num">2</span>将 <code>data.json</code> 直接上传到服务器的网站根目录（与 dist 同级）</div>
                <div class="help-step"><span class="help-step-num">3</span>完成！刷新网页即可看到最新数据</div>
              </div>
              <div class="help-tip">
                <strong>💡 原理</strong>：网站启动时会自动加载 <code>/data.json</code>，如果存在就用它覆盖默认数据。所以只需替换 data.json 即可，无需重新构建。
              </div>

              <h3>方式二：完整重新构建</h3>
              <div class="help-steps">
                <div class="help-step"><span class="help-step-num">1</span>下载 <code>data.json</code> 并放到项目根目录（<code>2027网站/</code>）</div>
                <div class="help-step"><span class="help-step-num">2</span>在终端执行 <code>./build.sh</code></div>
                <div class="help-step"><span class="help-step-num">3</span>将整个 <code>dist</code> 文件夹上传到服务器</div>
              </div>
              <div class="help-code">
                <code>cd ~/Desktop/2027网站<br/>./build.sh</code>
              </div>
            </section>

            <!-- 6. 全站搜索 -->
            <section :id="'h6'" class="help-section">
              <h2><span class="help-section-icon">🔍</span>全站搜索</h2>
              <p>每个页面都内置了统一风格的搜索框，直接搜索对应内容：</p>
              <div class="help-table">
                <div class="help-table-row help-table-head"><span>页面</span><span>搜索范围</span></div>
                <div class="help-table-row"><strong>🏠 首页</strong><span>跨页面搜索导航链接 + 讯息，结果以列表展示，点击跳转</span></div>
                <div class="help-table-row"><strong>🧭 导航</strong><span>搜索导航链接名称和 URL，实时过滤结果</span></div>
                <div class="help-table-row"><strong>📰 讯息</strong><span>搜索讯息标题和描述，实时过滤结果</span></div>
                <div class="help-table-row"><strong>✏️ 随记</strong><span>搜索随记内容和标签，实时过滤</span></div>
                <div class="help-table-row"><strong>⚙️ 管理</strong><span>顶部搜索栏跨页面搜索，下拉显示导航和讯息结果</span></div>
              </div>
              <div class="help-tip">
                <strong>💡 提示</strong>：搜索框统一采用粉色主题设计，聚焦时有高亮动效，支持一键清除输入。
              </div>
            </section>

            <!-- 7. 首页设置 -->
            <section :id="'h7'" class="help-section">
              <h2><span class="help-section-icon">🏠</span>首页头像设置</h2>
              <p>首页会显示一个头像图片。设置方法：</p>
              <ol>
                <li>准备一张正方形图片（推荐 200×200 以上）</li>
                <li>命名为 <code>avatar.png</code></li>
                <li>放到项目的 <code>public/</code> 文件夹中</li>
                <li>重新构建后上传，或直接放到服务器网站根目录</li>
              </ol>
            </section>

            <!-- 8. 部署说明 -->
            <section :id="'h8'" class="help-section">
              <h2><span class="help-section-icon">🌍</span>部署到服务器</h2>
              <p>网站为纯静态站点，部署非常简单：</p>
              <div class="help-steps">
                <div class="help-step"><span class="help-step-num">1</span>首次部署：运行 <code>npm run build</code> 生成 <code>dist</code> 文件夹</div>
                <div class="help-step"><span class="help-step-num">2</span>将 <code>dist</code> 文件夹内所有文件上传到虚拟主机</div>
                <div class="help-step"><span class="help-step-num">3</span>后续更新数据：只需上传 <code>data.json</code> 到网站根目录</div>
              </div>
              <div class="help-tip">
                <strong>💡 虚拟主机</strong>：只需支持静态文件托管即可，无需 PHP/数据库。确保主机配置了 URL 重写到 index.html（SPA 路由）。
              </div>
            </section>

            <!-- 9. 随记管理 -->
            <section :id="'h9'" class="help-section">
              <h2><span class="help-section-icon">✏️</span>随记管理</h2>
              <p>随记页用于记录灵感、笔记和想法，支持 Markdown 语法和标签分类。</p>
              <h3>基本操作</h3>
              <ul>
                <li><strong>添加随记</strong>：在输入框中输入内容，点击「保存随记」或按 <code>⌘+Enter</code> 保存</li>
                <li><strong>Markdown</strong>：支持 Markdown 语法，渲染后显示格式化内容</li>
                <li><strong>标签</strong>：在内容中使用 <code>#标签名</code> 添加标签，如 <code>#学习 #灵感</code></li>
                <li><strong>删除</strong>：点击卡片上的 🗑️ 图标删除，需确认</li>
              </ul>
              <h3>高级功能</h3>
              <ul>
                <li><strong>置顶</strong>：点击 📌 图标置顶/取消置顶，置顶笔记始终显示在最前面</li>
                <li><strong>搜索</strong>：使用顶部搜索框搜索内容和标签</li>
                <li><strong>排序</strong>：支持「最新优先」「最早优先」「标签最多」三种排序</li>
                <li><strong>筛选</strong>：点击「只看置顶」按钮筛选置顶笔记</li>
                <li><strong>标签云</strong>：点击标签可按标签筛选，再次点击取消</li>
              </ul>
              <div class="help-tip">
                <strong>💡 提示</strong>：随记数据保存在浏览器本地（localStorage），清除浏览器数据会丢失。建议重要内容及时备份。
              </div>
            </section>

            <!-- 10. 快捷键 -->
            <section :id="'h10'" class="help-section">
              <h2><span class="help-section-icon">⌨️</span>快捷键</h2>
              <div class="help-table">
                <div class="help-table-row help-table-head"><span>快捷键</span><span>功能</span></div>
                <div class="help-table-row"><code>ESC</code><span>关闭弹窗/模态框</span></div>
                <div class="help-table-row"><code>Enter</code><span>确认表单提交</span></div>
                <div class="help-table-row"><code>⌘+Enter / Ctrl+Enter</code><span>快速保存随记</span></div>
                <div class="help-table-row"><span>左右滑动</span><span>切换页面（移动端）</span></div>
                <div class="help-table-row"><span>双击导航分类</span><span>编辑分类名称（后台）</span></div>
                <div class="help-table-row"><span>双击日期</span><span>编辑日期（后台）</span></div>
              </div>
            </section>

            <div class="help-footer">
              <p>壹号栈 v1.1 · 如需更多功能或有使用问题，请联系开发者</p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style src="./AdminPanel.css"></style>
