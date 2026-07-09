<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { store, toggleAdmin, loginAdmin } from './store'
import HomePage from './pages/HomePage.vue'
import NavPage from './pages/NavPage.vue'
import NewsPage from './pages/NewsPage.vue'
import NotesPage from './pages/NotesPage.vue'
import MemoryPage from './pages/MemoryPage.vue'
import AdminPanel from './pages/AdminPanel.vue'
import ToolPage from './pages/ToolPage.vue'
import ArticlePage from './pages/ArticlePage.vue'
import DeliveryPage from './pages/DeliveryPage.vue'
import IdeaPage from './pages/IdeaPage.vue'
import DigitalLifePage from './pages/DigitalLifePage.vue'
import LoginModal from './components/LoginModal.vue'

const allTabs = [
  { key: 'home', label: '首页' },
  { key: 'nav', label: '导航' },
  { key: 'news', label: '讯息' },
  { key: 'notes', label: '随记' },
  { key: 'memory', label: '回忆' },
  { key: 'admin', label: '管理' },
]

const tabs = computed(() => store.isAdmin ? allTabs : allTabs.slice(0, 5))
const slideWidth = computed(() => 100 / tabs.value.length)
const activeTab = ref(0)
const isMobile = ref(window.innerWidth <= 768)
const touchRef = ref({ startX: 0, startY: 0, startTime: 0 })

// ─── Long-press home tab (3s) to toggle admin ───
let tabLongPressTimer = null
const startTabLongPress = (tabKey) => {
  if (tabKey !== 'home') return
  tabLongPressTimer = setTimeout(() => { toggleAdmin() }, 3000)
}
const cancelTabLongPress = () => {
  if (tabLongPressTimer) { clearTimeout(tabLongPressTimer); tabLongPressTimer = null }
}

// ─── Custom Nav Icons ───
const navIcons = ref({})
try {
  navIcons.value = JSON.parse(localStorage.getItem('yihao_nav_icons') || '{}')
} catch { navIcons.value = {} }
const getTabIcon = (key) => navIcons.value[key] || ''

// ─── Dark Mode (2 states: light / dark) ───
const darkMode = ref(localStorage.getItem('yihao_theme') === 'dark' ? 'dark' : 'light')

const applyTheme = (mode) => {
  if (mode === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

const toggleDarkMode = () => {
  darkMode.value = darkMode.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem('yihao_theme', darkMode.value)
  applyTheme(darkMode.value)
}

// ─── Login Modal ───
const showLogin = ref(false)
const handleShowLogin = () => { showLogin.value = true }
const handleLoginSuccess = () => {
  loginAdmin()
  showLogin.value = false
  // Switch to admin tab
  activeTab.value = tabs.value.length - 1
}
const handleLoginClose = () => { showLogin.value = false }

// ─── Tool Pages (overlay) ───
const showToolPage = ref(false)
const activeToolKey = ref('')
const openToolPage = (key) => {
  activeToolKey.value = key
  showToolPage.value = true
  document.body.classList.add('overlay-open')
  store.overlayOpen = true
}
const closeToolPage = () => {
  showToolPage.value = false
  document.body.classList.remove('overlay-open')
  store.overlayOpen = false
}

// ─── Article Page (overlay) ───
const showArticlePage = ref(false)
const currentArticle = ref(null)
const openArticlePage = (articleId) => {
  const article = store.articles.find(a => a.id === articleId)
  if (article) {
    currentArticle.value = article
    showArticlePage.value = true
    document.body.classList.add('overlay-open')
    store.overlayOpen = true
  }
}
const closeArticlePage = () => {
  showArticlePage.value = false
  document.body.classList.remove('overlay-open')
  store.overlayOpen = false
}

// ─── Delivery Page (overlay) ───
const showDeliveryPage = ref(false)
const openDeliveryPage = () => {
  showDeliveryPage.value = true
  document.body.classList.add('overlay-open')
  store.overlayOpen = true
}
const closeDeliveryPage = () => {
  showDeliveryPage.value = false
  document.body.classList.remove('overlay-open')
  store.overlayOpen = false
}

// ─── Idea Page (overlay) ───
const showIdeaPage = ref(false)
const openIdeaPage = () => {
  showIdeaPage.value = true
  document.body.classList.add('overlay-open')
  store.overlayOpen = true
}
const closeIdeaPage = () => {
  showIdeaPage.value = false
  document.body.classList.remove('overlay-open')
  store.overlayOpen = false
}
const showDigitalLifePage = ref(false)
const openDigitalLifePage = () => {
  showDigitalLifePage.value = true
  document.body.classList.add('overlay-open')
  store.overlayOpen = true
}
const closeDigitalLifePage = () => {
  showDigitalLifePage.value = false
  document.body.classList.remove('overlay-open')
  store.overlayOpen = false
}

// Sync overlay state for any overlay
const syncOverlayState = () => {
  const open = showToolPage.value || showArticlePage.value || showDeliveryPage.value || showIdeaPage.value || showDigitalLifePage.value
  store.overlayOpen = open
  if (open) document.body.classList.add('overlay-open')
  else document.body.classList.remove('overlay-open')
}
watch(() => showToolPage.value || showArticlePage.value || showDeliveryPage.value || showIdeaPage.value || showDigitalLifePage.value, syncOverlayState)

// 登出管理员后若仍停留在 admin tab，重置索引避免页面错位/空白
watch(() => store.isAdmin, (v) => {
  if (!v && activeTab.value >= tabs.value.length) activeTab.value = 0
})

// Expose for NavPage link interception
window.__yihaoOpenTool = openToolPage
window.__yihaoOpenMac = () => openToolPage('mac')  // backward compat
window.__yihaoOpenArticle = openArticlePage
window.__yihaoOpenDelivery = openDeliveryPage
window.__yihaoOpenIdea = openIdeaPage
window.__yihaoOpenDigitalLife = openDigitalLifePage

// ─── Admin shortcut: Ctrl+Shift+A / Cmd+Shift+A ───
const handleAdminShortcut = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
    e.preventDefault()
    toggleAdmin()
  }
}

onMounted(() => {
  applyTheme(darkMode.value)
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleAdminShortcut)
  window.addEventListener('yihao:show-login', handleShowLogin)

  // URL parameter: ?admin=1 to show login, ?admin=0 to disable
  const params = new URLSearchParams(window.location.search)
  if (params.get('admin') === '1' && !store.isAdmin) showLogin.value = true
  if (params.get('admin') === '0' && store.isAdmin) toggleAdmin()
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleAdminShortcut)
  window.removeEventListener('yihao:show-login', handleShowLogin)
})

const handleResize = () => { isMobile.value = window.innerWidth <= 768 }

const handleTouchStart = (e) => {
  touchRef.value = {
    startX: e.touches[0].clientX,
    startY: e.touches[0].clientY,
    startTime: Date.now()
  }
}

const handleTouchEnd = (e) => {
  const t = touchRef.value
  const dx = e.changedTouches[0].clientX - t.startX
  const dy = e.changedTouches[0].clientY - t.startY
  const dt = Date.now() - t.startTime
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50 && dt < 500) {
    const maxTab = tabs.value.length - 1
    if (dx < 0 && activeTab.value < maxTab) activeTab.value++
    else if (dx > 0 && activeTab.value > 0) activeTab.value--
  }
}
</script>

<template>
  <div class="app-container">
    <!-- Content area with page slider -->
    <div
      class="content-area"
      @touchstart="isMobile ? handleTouchStart($event) : undefined"
      @touchend="isMobile ? handleTouchEnd($event) : undefined"
    >
      <div class="page-slider" :style="{ transform: `translateX(-${activeTab * slideWidth}%)`, width: `${tabs.length * 100}%` }">
        <div class="page-slide" :style="{ width: `${slideWidth}%` }"><HomePage :onNavigate="(i) => activeTab = i" :darkMode="darkMode" :toggleDarkMode="toggleDarkMode" /></div>
        <div class="page-slide" :style="{ width: `${slideWidth}%` }"><NavPage :active="activeTab === 1" /></div>
        <div class="page-slide" :style="{ width: `${slideWidth}%` }"><NewsPage :active="activeTab === 2" /></div>
        <div class="page-slide" :style="{ width: `${slideWidth}%` }"><NotesPage :active="activeTab === 3" /></div>
        <div class="page-slide" :style="{ width: `${slideWidth}%` }"><MemoryPage :active="activeTab === 4" /></div>
        <div v-if="store.isAdmin" class="page-slide" :style="{ width: `${slideWidth}%` }"><AdminPanel /></div>
      </div>
    </div>

    <!-- Tool Page Overlay -->
    <Transition name="tool-slide">
      <div v-if="showToolPage" class="tool-overlay">
        <ToolPage :active="showToolPage" :toolKey="activeToolKey" @close="closeToolPage" />
      </div>
    </Transition>

    <!-- Article Page Overlay -->
    <Transition name="tool-slide">
      <div v-if="showArticlePage" class="tool-overlay">
        <ArticlePage :article="currentArticle" />
      </div>
    </Transition>

    <!-- Delivery Page Overlay -->
    <Transition name="tool-slide">
      <div v-if="showDeliveryPage" class="tool-overlay">
        <DeliveryPage @close="closeDeliveryPage" />
      </div>
    </Transition>

    <!-- Idea Page Overlay -->
    <Transition name="tool-slide">
      <div v-if="showIdeaPage" class="tool-overlay">
        <IdeaPage @close="closeIdeaPage" />
      </div>
      <div v-if="showDigitalLifePage" class="tool-overlay">
        <DigitalLifePage @close="closeDigitalLifePage" />
      </div>
    </Transition>

    <!-- Login Modal -->
    <LoginModal v-if="showLogin" @login="handleLoginSuccess" @close="handleLoginClose" />

    <!-- Bottom Tab Bar (always visible) -->
    <div class="tab-bar">
      <div
        v-for="(tab, i) in tabs"
        :key="tab.key"
        :class="['tab-item', { active: activeTab === i }]"
        @click="activeTab = i; closeToolPage(); closeArticlePage(); closeDeliveryPage(); closeIdeaPage(); closeDigitalLifePage()"
        @pointerdown="startTabLongPress(tab.key)"
        @pointerup="cancelTabLongPress"
        @pointerleave="cancelTabLongPress"
      >
        <!-- Custom emoji icon (if set) -->
        <span v-if="getTabIcon(tab.key)" class="tab-emoji" :style="{ filter: activeTab === i ? 'none' : 'grayscale(1) opacity(0.6)' }">{{ getTabIcon(tab.key) }}</span>
        <!-- Home Icon (SVG fallback) -->
        <svg v-else-if="tab.key === 'home'" viewBox="0 0 24 24" width="22" height="22" fill="none"
          :stroke="activeTab === i ? 'var(--primary)' : 'var(--text-light)'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 10.5L12 3l9 7.5"/>
          <path d="M5 9.5V19a1 1 0 0 0 1 1h3.5v-5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5v5H18a1 1 0 0 0 1-1V9.5"/>
        </svg>
        <!-- Nav Icon -->
        <svg v-else-if="tab.key === 'nav'" viewBox="0 0 24 24" width="22" height="22" fill="none"
          stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7.5" height="7.5" rx="2"
            :fill="activeTab === i ? 'var(--primary)' : 'none'"
            :stroke="activeTab === i ? 'var(--primary)' : 'var(--text-light)'"/>
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="2"
            :fill="activeTab === i ? 'var(--primary)' : 'none'"
            :stroke="activeTab === i ? 'var(--primary)' : 'var(--text-light)'" opacity="0.65"/>
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="2"
            :fill="activeTab === i ? 'var(--primary)' : 'none'"
            :stroke="activeTab === i ? 'var(--primary)' : 'var(--text-light)'" opacity="0.65"/>
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"
            :fill="activeTab === i ? 'var(--primary)' : 'none'"
            :stroke="activeTab === i ? 'var(--primary)' : 'var(--text-light)'"/>
        </svg>
        <!-- News Icon -->
        <svg v-else-if="tab.key === 'news'" viewBox="0 0 24 24" width="22" height="22" fill="none"
          :stroke="activeTab === i ? 'var(--primary)' : 'var(--text-light)'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1"/>
          <path d="M21 12a9 9 0 0 0-9-9"/>
          <line x1="9" y1="9" x2="15" y2="9" :stroke="activeTab === i ? 'var(--primary)' : 'var(--text-light)'" stroke-width="1.5"/>
          <line x1="9" y1="13" x2="15" y2="13" :stroke="activeTab === i ? 'var(--primary)' : 'var(--text-light)'" stroke-width="1.5"/>
          <line x1="9" y1="17" x2="13" y2="17" :stroke="activeTab === i ? 'var(--primary)' : 'var(--text-light)'" stroke-width="1.5"/>
        </svg>
        <!-- Notes Icon -->
        <svg v-else-if="tab.key === 'notes'" viewBox="0 0 24 24" width="22" height="22" fill="none"
          :stroke="activeTab === i ? 'var(--primary)' : 'var(--text-light)'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
            :fill="activeTab === i ? 'rgba(255,29,85,0.12)' : 'none'"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="8" y1="13" x2="16" y2="13" stroke-width="1.5"/>
          <line x1="8" y1="17" x2="13" y2="17" stroke-width="1.5"/>
        </svg>
        <!-- Memory Icon -->
        <svg v-else-if="tab.key === 'memory'" viewBox="0 0 24 24" width="22" height="22" fill="none"
          :stroke="activeTab === i ? 'var(--primary)' : 'var(--text-light)'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
            :fill="activeTab === i ? 'rgba(255,29,85,0.12)' : 'none'"/>
          <line x1="8" y1="7" x2="16" y2="7" stroke-width="1.5"/>
          <line x1="8" y1="11" x2="16" y2="11" stroke-width="1.5"/>
          <line x1="8" y1="15" x2="12" y2="15" stroke-width="1.5"/>
        </svg>
        <!-- Admin Icon -->
        <svg v-else viewBox="0 0 24 24" width="22" height="22" fill="none"
          :stroke="activeTab === i ? 'var(--primary)' : 'var(--text-light)'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="10" rx="2"/>
          <circle cx="12" cy="5" r="2"/>
          <path d="M12 7v4"/>
          <line x1="8" y1="16" x2="8" y2="16.01" stroke-width="2"/>
          <line x1="16" y1="16" x2="16" y2="16.01" stroke-width="2"/>
        </svg>
        <span class="tab-label">{{ tab.label }}</span>
      </div>
    </div>
  </div>
</template>

<style src="./App.css"></style>
