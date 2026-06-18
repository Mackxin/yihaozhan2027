<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import HomePage from './pages/HomePage.vue'
import NavPage from './pages/NavPage.vue'
import NewsPage from './pages/NewsPage.vue'
import NotesPage from './pages/NotesPage.vue'
import AdminPanel from './pages/AdminPanel.vue'

const tabs = [
  { key: 'home', label: '首页' },
  { key: 'nav', label: '导航' },
  { key: 'news', label: '讯息' },
  { key: 'notes', label: '随记' },
  { key: 'admin', label: '管理' },
]

const activeTab = ref(0)
const isMobile = ref(window.innerWidth <= 768)
const touchRef = ref({ startX: 0, startY: 0, startTime: 0 })

// ─── Dark Mode (3 states: auto / light / dark) ───
const darkMode = ref(localStorage.getItem('yihao_theme') || 'auto')

const applyTheme = (mode) => {
  const html = document.documentElement
  if (mode === 'dark') {
    html.setAttribute('data-theme', 'dark')
  } else if (mode === 'light') {
    html.removeAttribute('data-theme')
  } else {
    if (matchMedia('(prefers-color-scheme: dark)').matches) {
      html.setAttribute('data-theme', 'dark')
    } else {
      html.removeAttribute('data-theme')
    }
  }
}

const toggleDarkMode = () => {
  const cycle = ['auto', 'light', 'dark']
  const idx = cycle.indexOf(darkMode.value)
  darkMode.value = cycle[(idx + 1) % 3]
  localStorage.setItem('yihao_theme', darkMode.value)
  applyTheme(darkMode.value)
}

// Listen for system theme changes
onMounted(() => {
  applyTheme(darkMode.value)
  const mql = matchMedia('(prefers-color-scheme: dark)')
  mql.addEventListener('change', () => { if (darkMode.value === 'auto') applyTheme('auto') })
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => window.removeEventListener('resize', handleResize))

const handleResize = () => { isMobile.value = window.innerWidth <= 768 }

const handleTouchStart = (e) => {
  touchRef.current = {
    startX: e.touches[0].clientX,
    startY: e.touches[0].clientY,
    startTime: Date.now()
  }
}

const handleTouchEnd = (e) => {
  const t = touchRef.current
  const dx = e.changedTouches[0].clientX - t.startX
  const dy = e.changedTouches[0].clientY - t.startY
  const dt = Date.now() - t.startTime
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50 && dt < 500) {
    if (dx < 0 && activeTab.value < 4) activeTab.value++
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
      <div class="page-slider" :style="{ transform: `translateX(-${activeTab * 20}%)` }">
        <div class="page-slide"><HomePage :onNavigate="(i) => activeTab = i" /></div>
        <div class="page-slide"><NavPage :active="activeTab === 1" /></div>
        <div class="page-slide"><NewsPage :active="activeTab === 2" /></div>
        <div class="page-slide"><NotesPage /></div>
        <div class="page-slide"><AdminPanel /></div>
      </div>
    </div>

    <!-- Bottom Tab Bar -->
    <div class="tab-bar">
      <div
        v-for="(tab, i) in tabs"
        :key="tab.key"
        :class="['tab-item', { active: activeTab === i }]"
        @click="activeTab = i"
      >
        <!-- Home Icon -->
        <svg v-if="tab.key === 'home'" viewBox="0 0 24 24" width="22" height="22" fill="none"
          :stroke="activeTab === i ? 'var(--primary)' : 'var(--text-light)'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <!-- Nav Icon -->
        <svg v-else-if="tab.key === 'nav'" viewBox="0 0 24 24" width="22" height="22" fill="none"
          :stroke="activeTab === i ? 'var(--primary)' : 'var(--text-light)'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
            :fill="activeTab === i ? 'var(--primary)' : 'none'"/>
        </svg>
        <!-- News Icon -->
        <svg v-else-if="tab.key === 'news'" viewBox="0 0 24 24" width="22" height="22" fill="none"
          :stroke="activeTab === i ? 'var(--primary)' : 'var(--text-light)'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
          <line x1="10" y1="6" x2="18" y2="6"/>
          <line x1="10" y1="10" x2="18" y2="10"/>
          <line x1="10" y1="14" x2="14" y2="14"/>
        </svg>
        <!-- Notes Icon -->
        <svg v-else-if="tab.key === 'notes'" viewBox="0 0 24 24" width="22" height="22" fill="none"
          :stroke="activeTab === i ? 'var(--primary)' : 'var(--text-light)'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        <!-- Admin Icon -->
        <svg v-else viewBox="0 0 24 24" width="22" height="22" fill="none"
          :stroke="activeTab === i ? 'var(--primary)' : 'var(--text-light)'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <span class="tab-label">{{ tab.label }}</span>
      </div>
      <!-- Theme Toggle (inside tab bar) -->
      <button class="theme-toggle" @click="toggleDarkMode" :title="darkMode === 'auto' ? '跟随系统' : darkMode === 'light' ? '浅色模式' : '深色模式'">
        <!-- Auto (system) -->
        <svg v-if="darkMode === 'auto'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2v20"/>
          <path d="M12 2a10 10 0 0 1 0 20"/>
        </svg>
        <!-- Light -->
        <svg v-else-if="darkMode === 'light'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        <!-- Dark -->
        <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style src="./App.css"></style>
