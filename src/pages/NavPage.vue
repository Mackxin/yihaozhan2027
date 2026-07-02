<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { store, toolPageConfigs } from '../store'
import UniSearch from '../components/UniSearch.vue'

const props = defineProps({
  active: { type: Boolean, default: false }
})

const search = ref('')
const menuOpen = ref(false)
const contentRef = ref(null)

const navCategories = computed(() => store.navCategories)

const resolveToolLink = (url) => {
  if (!url) return null
  // 先检查 toolPageConfigs（registerToolPage 填充）
  for (const key of Object.keys(toolPageConfigs)) {
    const cfg = toolPageConfigs[key]
    if (url === cfg.url || url === cfg.url.replace('http://', 'https://')) {
      return key
    }
  }
  // 再检查 store.toolPages（用户自定义页面）
  for (const tp of store.toolPages) {
    const expectedUrl = `http://yihaozhan.xyz/${tp.key}.html`
    if (url === expectedUrl || url === expectedUrl.replace('http://', 'https://')) {
      return tp.key
    }
  }
  return null
}
const isToolLink = (url) => resolveToolLink(url) !== null
const isArticleLink = (url) => url?.startsWith('#article:')
const getArticleId = (url) => url?.replace('#article:', '')
const openToolPage = (key) => { window.__yihaoOpenTool?.(key) }
const openArticle = (id) => { window.__yihaoOpenArticle?.(id) }

const midIndex = computed(() => Math.ceil(navCategories.value.length / 2))
const topNavCats = computed(() => navCategories.value.slice(0, midIndex.value))
const bottomNavCats = computed(() => navCategories.value.slice(midIndex.value))

const filtered = computed(() => {
  const kw = search.value.toLowerCase().trim()
  if (!kw) return navCategories.value
  return navCategories.value
    .map(cat => {
      const titleMatch = cat.title.toLowerCase().includes(kw)
      const links = cat.links.filter(l => l.name.toLowerCase().includes(kw))
      if (titleMatch || links.length > 0) {
        return { ...cat, links: titleMatch ? cat.links : links }
      }
      return null
    })
    .filter(Boolean)
})

const scrollToSection = (id) => {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  menuOpen.value = false
}

const scrollToTop = () => {
  const slide = contentRef.value?.closest('.page-slide')
  slide?.scrollTo({ top: 0, behavior: 'smooth' })
}

// Scroll detection for back-to-top
const showBackTop = ref(false)
const onScroll = () => {
  const slide = contentRef.value?.closest('.page-slide')
  showBackTop.value = slide ? slide.scrollTop > 300 : false
}
onMounted(() => {
  const slide = contentRef.value?.closest('.page-slide')
  slide?.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => {
  const slide = contentRef.value?.closest('.page-slide')
  slide?.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="nav-page" ref="contentRef">
    <!-- Desktop sticky top nav (teleported to body to avoid overflow clipping) -->
    <Teleport to="body">
    <div v-if="active" class="desktop-nav">
      <div class="desktop-nav-inner">
        <div class="desktop-nav-list">
          <a
            v-for="cat in topNavCats"
            :key="cat.id"
            class="desktop-nav-link"
            @click="scrollToSection(`nav-section-${cat.id}`)"
          >
            {{ cat.title }}
          </a>
        </div>
      </div>
    </div>
    </Teleport>

    <!-- Mobile header -->
    <div class="mobile-header">
      <div class="mobile-header-inner">
        <span class="mobile-logo">壹号导航</span>
        <button class="mobile-menu-btn" @click="menuOpen = !menuOpen">
          <svg v-if="!menuOpen" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <!-- Mobile menu panel -->
      <div v-if="menuOpen" class="mobile-menu">
        <div class="mobile-menu-search">
          <UniSearch v-model="search" placeholder="搜索分类或链接..." />
        </div>
        <div class="mobile-menu-grid">
          <a
            v-for="cat in navCategories"
            :key="cat.id"
            class="mobile-menu-item"
            @click="scrollToSection(`nav-section-${cat.id}`)"
          >
            {{ cat.title }}
          </a>
        </div>
      </div>
    </div>

    <!-- Main content area -->
    <div class="nav-main">
      <div class="nav-inner">
        <!-- Hero search section -->
        <div class="nav-hero">
          <h1 class="nav-hero-title">壹号导航</h1>
          <p class="nav-hero-subtitle">精选优质工具与资源，助你高效探索数字世界</p>
          <UniSearch v-model="search" placeholder="输入关键词搜索导航链接..." :stats="search ? `找到 ${filtered.length}/${navCategories.length} 个分类` : ''" />
        </div>

        <!-- Category sections -->
        <div class="nav-content">
          <section
            v-for="cat in filtered"
            :key="cat.id"
            :id="`nav-section-${cat.id}`"
            class="nav-section"
          >
            <div class="nav-section-header">
              <h2 class="nav-section-title">{{ cat.title }}</h2>
            </div>
            <div class="nav-links">
              <a
                v-for="(link, i) in cat.links"
                :key="i"
                :href="(isToolLink(link.url) || isArticleLink(link.url)) ? undefined : link.url"
                :target="(isToolLink(link.url) || isArticleLink(link.url)) ? undefined : '_blank'"
                :rel="(isToolLink(link.url) || isArticleLink(link.url)) ? undefined : 'noopener noreferrer'"
                class="nav-link-item"
                @click="isToolLink(link.url) ? ($event.preventDefault(), openToolPage(resolveToolLink(link.url))) : isArticleLink(link.url) ? ($event.preventDefault(), openArticle(getArticleId(link.url))) : null"
              >
                {{ link.name }}
              </a>
            </div>
          </section>
          <div v-if="filtered.length === 0" class="nav-no-results">
            <p>未找到匹配的内容</p>
            <button @click="search = ''">清除搜索</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop fixed bottom nav (teleported to body to avoid overflow clipping) -->
    <Teleport to="body">
    <div v-if="active" class="desktop-footer">
      <div class="desktop-footer-inner">
        <div class="desktop-footer-list">
          <a
            v-for="cat in bottomNavCats"
            :key="cat.id"
            class="desktop-footer-link"
            @click="scrollToSection(`nav-section-${cat.id}`)"
          >
            {{ cat.title }}
          </a>
        </div>
      </div>
    </div>
    </Teleport>

    <!-- Back to top (teleported to body) -->
    <Teleport to="body">
    <button v-if="active && showBackTop" class="back-to-top" @click="scrollToTop">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M5 15l7-7 7 7"/>
      </svg>
    </button>
    </Teleport>
  </div>
</template>

<style src="./NavPage.css"></style>
