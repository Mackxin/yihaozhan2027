<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { store } from '../store'
import UniSearch from '../components/UniSearch.vue'

const props = defineProps({
  active: { type: Boolean, default: false }
})

const search = ref('')
const collapsed = reactive({})
const monthCollapsed = reactive({})
const activeYear = ref(null)
const timelineHidden = ref(false)
const contentRef = ref(null)

// 关键字过滤
const filtered = computed(() => {
  const kw = search.value.toLowerCase().trim()
  if (!kw) return store.timelineItems
  return store.timelineItems
    .map(group => {
      const items = group.items.filter(item => {
        const descs = Array.isArray(item.desc) ? item.desc : (item.desc ? [item.desc] : [])
        return item.title.toLowerCase().includes(kw) ||
          descs.some(d => String(d).toLowerCase().includes(kw))
      })
      return items.length > 0 ? { ...group, items } : null
    })
    .filter(Boolean)
})

// 提取年份（date 形如 2026-07-08）
const yearOf = (date) => (typeof date === 'string' && date.length >= 4) ? date.slice(0, 4) : '其他'
const monthOf = (date) => (typeof date === 'string' && date.length >= 7) ? date.slice(0, 7) : '其他'
const monthLabel = (m) => {
  const parts = m.split('-')
  return parts.length >= 2 ? `${parts[0]}年${Number(parts[1])}月` : m
}

// 可选年份列表
const years = computed(() => {
  const set = new Set(filtered.value.map(g => yearOf(g.date)))
  return [...set].sort((a, b) => b.localeCompare(a))
})

// 年份过滤后的分组
const yearFiltered = computed(() => {
  if (!activeYear.value) return filtered.value
  return filtered.value.filter(g => yearOf(g.date) === activeYear.value)
})

// 按月分组
const months = computed(() => {
  const map = new Map()
  for (const g of yearFiltered.value) {
    const m = monthOf(g.date)
    if (!map.has(m)) map.set(m, [])
    map.get(m).push(g)
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, groups]) => ({
      month,
      label: monthLabel(month),
      groups,
      count: groups.reduce((n, g) => n + (g.items?.length || 0), 0),
    }))
})

const toggleGroup = (date) => {
  collapsed[date] = !collapsed[date]
}
const toggleMonth = (m) => {
  monthCollapsed[m] = !monthCollapsed[m]
}

const scrollToTop = () => {
  const slide = contentRef.value?.closest('.page-slide')
  slide?.scrollTo({ top: 0, behavior: 'smooth' })
}

// Scroll detection
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
  <div class="news-page" ref="contentRef">
    <!-- White page container -->
    <div class="news-page-container">
      <div class="news-page-inner">

        <!-- Hero -->
        <header class="news-hero">
          <h1 class="news-hero-title">
            <span class="news-hero-gradient">壹号讯息</span>
          </h1>
          <p class="news-hero-subtitle">每天一小条讯息，记录正在发生的灵感、工具与小发现</p>
          <p class="news-hero-subtitle">像刷动态一样，回看这一年的数字足迹</p>
          <div class="news-hero-links">
            <a v-for="(link, i) in store.heroLinks" :key="i" :class="['news-hero-link', { 'news-hero-link-primary': i === 0 }]" :href="link.url" target="_blank" rel="noopener noreferrer">
              <span>{{ link.name }}</span>
            </a>
          </div>
          <UniSearch v-model="search" placeholder="输入关键词，筛选时间线内容..." />
        </header>

        <!-- Timeline section -->
        <main class="news-main">
          <div class="news-section-header" @click="timelineHidden = !timelineHidden" style="cursor:pointer">
            <h2 class="news-section-title">时光轨迹</h2>
            <p class="news-section-caption">时光总是匆匆流逝，记忆总是慢慢消退</p>
          </div>

          <!-- 年份筛选条 -->
          <div v-if="years.length > 1 && !timelineHidden" class="news-year-filter">
            <button
              :class="['news-year-chip', { active: !activeYear }]"
              @click="activeYear = null"
            >全部</button>
            <button
              v-for="y in years"
              :key="y"
              :class="['news-year-chip', { active: activeYear === y }]"
              @click="activeYear = activeYear === y ? null : y"
            >{{ y }}</button>
          </div>

          <section class="news-timeline" v-show="!timelineHidden">
            <div class="news-timeline-axis" />
            <div class="news-timeline-axis-glow" />
            <div class="news-timeline-list">
              <template v-for="mo in months" :key="mo.month">
                <!-- 月份分组头 -->
                <div class="news-month-header" @click="toggleMonth(mo.month)">
                  <span class="news-month-toggle">{{ monthCollapsed[mo.month] ? '▸' : '▾' }}</span>
                  <span class="news-month-label">{{ mo.label }}</span>
                  <span class="news-month-count">{{ mo.count }} 条</span>
                </div>
                <template v-if="!monthCollapsed[mo.month]">
                  <article
                    v-for="group in mo.groups"
                    :key="group.date"
                    :class="['news-timeline-group', { collapsed: collapsed[group.date] }]"
                  >
                    <div class="news-timeline-dot" />
                    <!-- Meta side (date) -->
                    <div class="news-timeline-side news-timeline-meta">
                      <span class="news-timeline-date" @click="toggleGroup(group.date)">{{ group.date }}</span>
                    </div>
                    <!-- Cards side -->
                    <div class="news-timeline-side news-timeline-cards-wrap">
                      <div class="news-timeline-cards">
                        <div v-for="(item, i) in group.items" :key="i" class="news-timeline-card">
                          <div class="news-card-header">
                            <h3 class="news-card-title">
                              <a class="news-title-link" :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.title }}</a>
                            </h3>
                          </div>
                          <div class="news-card-body">
                            <p v-for="(d, j) in (Array.isArray(item.desc) ? item.desc : (item.desc ? [item.desc] : []))" :key="j">{{ d }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </template>
              </template>
              <div v-if="filtered.length === 0" style="text-align:center;padding:48px 20px;color:var(--text-light)">
                <div style="font-size:42px;margin-bottom:10px">📭</div>
                <p>{{ search ? '没有找到匹配的讯息' : '暂无讯息，去后台添加第一条吧' }}</p>
              </div>
            </div>
          </section>
        </main>

        <!-- Footer -->
        <footer class="news-footer">
          <div class="news-footer-left">
            <div class="news-footer-dot" />
            <span>持续更新中</span>
          </div>
          <span>Powered by <a class="news-footer-link" href="https://yihaozhan.xyz" target="_blank" rel="noopener noreferrer">壹号栈</a></span>
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

<style src="./NewsPage.css"></style>
