<script setup>
import { ref, computed, onMounted } from 'vue'
import { store } from '../store'
import UniSearch from '../components/UniSearch.vue'
import avatarUrl from '/avatar.png'

const props = defineProps({
  onNavigate: { type: Function, default: () => {} },
  darkMode: { type: String, default: 'light' },
  toggleDarkMode: { type: Function, default: () => {} },
})

const ready = ref(false)
onMounted(() => { setTimeout(() => { ready.value = true }, 80) })

const quickLinks = [
  { icon: '🧭', title: '壹号导航', sub: '1500+ 精选工具与资源', tab: 1 },
  { icon: '📰', title: '壹号讯息', sub: '每日发现，持续更新中', tab: 2 },
  { icon: '✏️', title: '灵感随记', sub: '捕捉想法，记录生活', tab: 3 },
]

// ─── Home Search ───
const search = ref('')
const searchResults = computed(() => {
  const kw = search.value.toLowerCase().trim()
  if (!kw) return { nav: [], news: [] }
  const nav = []
  store.navCategories.forEach(cat => {
    cat.links.forEach(link => {
      if (link.name.toLowerCase().includes(kw) || link.url.toLowerCase().includes(kw)) {
        nav.push({ cat: cat.title, name: link.name, url: link.url })
      }
    })
  })
  const news = []
  store.timelineItems.forEach(group => {
    group.items.forEach(item => {
      if (item.title.toLowerCase().includes(kw) || item.desc.some(d => d.toLowerCase().includes(kw))) {
        news.push({ date: group.date, title: item.title, url: item.url })
      }
    })
  })
  return { nav: nav.slice(0, 6), news: news.slice(0, 6) }
})
const totalResults = computed(() => searchResults.value.nav.length + searchResults.value.news.length)
const goNav = () => { props.onNavigate?.(1); search.value = '' }
const goNews = () => { props.onNavigate?.(2); search.value = '' }
</script>

<template>
  <div :class="['hp-page', { ready }]">

    <!-- Accent shape -->
    <div class="hp-accent-shape"></div>

    <div class="hp-inner">

      <!-- Hero section -->
      <section class="hp-hero">
        <div class="hp-hero-left">
          <div class="hp-greeting-row">
            <div class="hp-greeting">Hello 👋</div>
            <button class="hp-theme-toggle" @click="toggleDarkMode" :title="darkMode === 'light' ? '切换深色模式' : '切换浅色模式'">
              <svg v-if="darkMode === 'light'" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </button>
          </div>
          <h1 class="hp-title">
            <span class="hp-title-main">壹号栈</span>
            <span class="hp-title-sub">探索 · 记录 · 创造</span>
          </h1>
          <p class="hp-desc">发现更大的世界，记录更真的自我。在这里探索精选资源，获取前沿资讯，捕捉灵感瞬间。</p>

          <!-- Unified search on home page -->
          <div class="hp-search-area">
            <UniSearch v-model="search" placeholder="搜索导航链接、讯息内容..." />
            <!-- Inline results -->
            <div v-if="search.trim()" class="hp-search-results">
              <div v-if="totalResults === 0" class="hp-search-empty">
                没有找到匹配「{{ search }}」的结果
              </div>
              <template v-if="searchResults.nav.length">
                <div class="hp-search-group-label">导航链接</div>
                <div v-for="(r, i) in searchResults.nav" :key="'n'+i" class="hp-search-item" @click="goNav">
                  <span class="hp-search-badge hp-search-badge-nav">导航</span>
                  <strong>{{ r.name }}</strong>
                  <small>{{ r.cat }}</small>
                </div>
              </template>
              <template v-if="searchResults.news.length">
                <div class="hp-search-group-label">讯息内容</div>
                <div v-for="(r, i) in searchResults.news" :key="'w'+i" class="hp-search-item" @click="goNews">
                  <span class="hp-search-badge hp-search-badge-news">讯息</span>
                  <strong>{{ r.title }}</strong>
                  <small>{{ r.date }}</small>
                </div>
              </template>
            </div>
          </div>
        </div>
        <div class="hp-hero-right">
          <div class="hp-profile-card">
            <img :src="avatarUrl" alt="" class="hp-profile-avatar" />
            <div class="hp-profile-name">壹号栈</div>
            <div class="hp-profile-bio">数字花园</div>
            <div class="hp-profile-tags">
              <span>探索者</span>
              <span>记录者</span>
              <span>创造者</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Quick access -->
      <section class="hp-quick">
        <div class="hp-quick-label">快速访问</div>
        <div class="hp-quick-list">
          <button
            v-for="(link, i) in quickLinks"
            :key="link.title"
            class="hp-quick-item"
            :style="{ '--delay': i * 0.1 + 's' }"
            @click="onNavigate?.(link.tab)"
          >
            <span class="hp-quick-icon">{{ link.icon }}</span>
            <div class="hp-quick-text">
              <strong>{{ link.title }}</strong>
              <small>{{ link.sub }}</small>
            </div>
            <svg class="hp-quick-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </section>

    </div>
  </div>
</template>

<style src="./HomePage.css"></style>
