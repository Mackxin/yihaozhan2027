<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getToolSections, getToolConfig } from '../store'
import UniSearch from '../components/UniSearch.vue'

const props = defineProps({
  active: { type: Boolean, default: false },
  toolKey: { type: String, required: true },
})

const config = computed(() => getToolConfig(props.toolKey))
const sections = computed(() => getToolSections(props.toolKey))

const search = ref('')
const contentRef = ref(null)

const filtered = computed(() => {
  const kw = search.value.toLowerCase().trim()
  if (!kw) return sections.value
  return sections.value
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

const totalItems = computed(() => sections.value.reduce((s, sec) => s + sec.items.length, 0))

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
  <div class="tool-page" ref="contentRef">
    <div class="tool-page-container">
      <div class="tool-page-inner">

        <!-- Hero -->
        <header class="tool-hero">
          <h1 class="tool-hero-title">
            <span class="tool-hero-icon">{{ config.icon || '📦' }}</span>
            {{ config.heroTitle || config.label || '工具推荐' }}
          </h1>
          <p class="tool-hero-subtitle">{{ config.heroSubtitle || '' }}</p>
          <p v-if="config.heroDesc" class="tool-hero-desc">{{ config.heroDesc }}</p>
          <div class="tool-hero-stats">
            <div class="tool-stat">
              <span class="tool-stat-num">{{ sections.length }}</span>
              <span class="tool-stat-label">个分类</span>
            </div>
            <div class="tool-stat-divider"></div>
            <div class="tool-stat">
              <span class="tool-stat-num">{{ totalItems }}</span>
              <span class="tool-stat-label">个工具</span>
            </div>
          </div>
          <UniSearch v-model="search" placeholder="搜索名称、描述、标签..." />
        </header>

        <!-- Sections -->
        <main class="tool-main">
          <section v-for="section in filtered" :key="section.id" class="tool-section">
            <div class="tool-section-header">
              <div>
                <h2 class="tool-section-title">{{ section.title }}</h2>
                <p class="tool-section-subtitle">{{ section.subtitle }}</p>
              </div>
            </div>
            <div class="tool-grid">
              <a
                v-for="(item, i) in section.items"
                :key="i"
                :href="item.url || undefined"
                :target="item.url ? '_blank' : undefined"
                :rel="item.url ? 'noopener noreferrer' : undefined"
                :class="['tool-card', { 'tool-card-no-link': !item.url }]"
              >
                <div class="tool-card-body">
                  <h3 class="tool-card-name">{{ item.name }}</h3>
                  <p class="tool-card-desc">{{ item.desc }}</p>
                  <div v-if="item.tags?.length" class="tool-card-tags">
                    <span v-for="tag in item.tags" :key="tag" class="tool-card-tag">{{ tag }}</span>
                  </div>
                </div>
                <svg v-if="item.url" class="tool-card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
              </a>
            </div>
          </section>

          <div v-if="filtered.length === 0" class="tool-empty">
            <div class="tool-empty-icon">🔍</div>
            <h3>没有找到匹配的内容</h3>
            <p>试试其他关键词，或清除搜索</p>
            <button class="tool-empty-btn" @click="search = ''">清除搜索</button>
          </div>
        </main>

        <footer class="tool-footer">
          <div class="tool-footer-left">
            <div class="tool-footer-dot"></div>
            <span>持续更新中</span>
          </div>
          <span>Powered by <a class="tool-footer-link" href="https://yihaozhan.xyz" target="_blank" rel="noopener noreferrer">壹号栈</a></span>
        </footer>

      </div>
    </div>

    <Teleport to="body">
    <button v-if="active && showBackTop" class="back-to-top" @click="scrollToTop">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M5 15l7-7 7 7"/>
      </svg>
    </button>
    </Teleport>
  </div>
</template>

<style src="./ToolPage.css"></style>
