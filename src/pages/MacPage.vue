<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { store } from '../store'
import UniSearch from '../components/UniSearch.vue'

const props = defineProps({
  active: { type: Boolean, default: false }
})

const emit = defineEmits(['back'])
const search = ref('')
const contentRef = ref(null)

const filtered = computed(() => {
  const kw = search.value.toLowerCase().trim()
  if (!kw) return store.macSections
  return store.macSections
    .map(section => {
      const items = section.items.filter(item =>
        item.name.toLowerCase().includes(kw) ||
        item.desc.toLowerCase().includes(kw) ||
        (item.tags || []).some(t => t.toLowerCase().includes(kw))
      )
      return items.length > 0 ? { ...section, items } : null
    })
    .filter(Boolean)
})

const totalItems = computed(() => store.macSections.reduce((s, sec) => s + sec.items.length, 0))

const scrollToTop = () => {
  const slide = contentRef.value?.closest('.page-slide')
  slide?.scrollTo({ top: 0, behavior: 'smooth' })
}

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
  <div class="mac-page" ref="contentRef">
    <div class="mac-page-container">
      <div class="mac-page-inner">

        <!-- Hero -->
        <header class="mac-hero">
          <button class="mac-back-btn" @click="$emit('back')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            返回导航
          </button>
          <h1 class="mac-hero-title">
            <span class="mac-hero-icon">🍎</span>
            Mac 软件推荐
          </h1>
          <p class="mac-hero-subtitle">精选日常使用必备工具</p>
          <p class="mac-hero-desc">壹号记录 2026 年 04 月 24 日国补弄了一台 Mac Mini，开始用 Mac 电脑了。记录装机过程中的实用工具和配置经验。</p>
          <div class="mac-hero-stats">
            <div class="mac-stat">
              <span class="mac-stat-num">{{ store.macSections.length }}</span>
              <span class="mac-stat-label">个分类</span>
            </div>
            <div class="mac-stat-divider"></div>
            <div class="mac-stat">
              <span class="mac-stat-num">{{ totalItems }}</span>
              <span class="mac-stat-label">个工具</span>
            </div>
          </div>
          <UniSearch v-model="search" placeholder="搜索 Mac 软件、标签..." />
        </header>

        <!-- Sections -->
        <main class="mac-main">
          <section v-for="section in filtered" :key="section.id" class="mac-section">
            <div class="mac-section-header">
              <div class="mac-section-badge">{{ section.icon }}</div>
              <div>
                <h2 class="mac-section-title">{{ section.title }}</h2>
                <p class="mac-section-subtitle">{{ section.subtitle }}</p>
              </div>
            </div>
            <div class="mac-grid">
              <a
                v-for="(item, i) in section.items"
                :key="i"
                :href="item.url || undefined"
                :target="item.url ? '_blank' : undefined"
                :rel="item.url ? 'noopener noreferrer' : undefined"
                :class="['mac-card', { 'mac-card-no-link': !item.url }]"
              >
                <div class="mac-card-emoji">{{ item.emoji }}</div>
                <div class="mac-card-body">
                  <h3 class="mac-card-name">{{ item.name }}</h3>
                  <p class="mac-card-desc">{{ item.desc }}</p>
                  <div v-if="item.tags?.length" class="mac-card-tags">
                    <span v-for="tag in item.tags" :key="tag" class="mac-card-tag">{{ tag }}</span>
                  </div>
                </div>
                <svg v-if="item.url" class="mac-card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
              </a>
            </div>
          </section>

          <!-- Empty state -->
          <div v-if="filtered.length === 0" class="mac-empty">
            <div class="mac-empty-icon">🔍</div>
            <h3>没有找到匹配的软件</h3>
            <p>试试其他关键词，或清除搜索</p>
            <button class="mac-empty-btn" @click="search = ''">清除搜索</button>
          </div>
        </main>

        <!-- Footer -->
        <footer class="mac-footer">
          <div class="mac-footer-left">
            <div class="mac-footer-dot"></div>
            <span>持续更新中</span>
          </div>
          <span>Powered by <a class="mac-footer-link" href="https://yihaozhan.xyz" target="_blank" rel="noopener noreferrer">壹号栈</a></span>
        </footer>

      </div>
    </div>

    <!-- Back to top -->
    <Teleport to="body">
    <button v-if="active && showBackTop" class="back-to-top" @click="scrollToTop">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M5 15l7-7 7 7"/>
      </svg>
    </button>
    </Teleport>
  </div>
</template>

<style src="./MacPage.css"></style>
