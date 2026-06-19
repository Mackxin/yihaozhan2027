<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { store } from './store'
import HomePage from './pages/HomePage.vue'
import NavPage from './pages/NavPage.vue'
import NewsPage from './pages/NewsPage.vue'
import NotesPage from './pages/NotesPage.vue'
import AdminPanel from './pages/AdminPanel.vue'

const allTabs = [
  { key: 'home', label: '首页' },
  { key: 'nav', label: '导航' },
  { key: 'news', label: '讯息' },
  { key: 'notes', label: '随记' },
  { key: 'admin', label: '管理' },
]

const tabs = computed(() => store.isAdmin ? allTabs : allTabs.slice(0, 4))
const slideWidth = computed(() => 100 / tabs.value.length)
const activeTab = ref(0)
const isMobile = ref(window.innerWidth <= 768)
const touchRef = ref({ startX: 0, startY: 0, startTime: 0 })

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

onMounted(() => {
  applyTheme(darkMode.value)
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
        <div class="page-slide" :style="{ width: `${slideWidth}%` }"><NotesPage /></div>
        <div v-if="store.isAdmin" class="page-slide" :style="{ width: `${slideWidth}%` }"><AdminPanel /></div>
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
