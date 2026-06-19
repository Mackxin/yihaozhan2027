<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { store } from '../store'
import UniSearch from '../components/UniSearch.vue'

const props = defineProps({
  active: { type: Boolean, default: false }
})

const search = ref('')
const collapsed = reactive({})
const timelineHidden = ref(false)
const contentRef = ref(null)

const filtered = computed(() => {
  const kw = search.value.toLowerCase().trim()
  if (!kw) return store.timelineItems
  return store.timelineItems
    .map(group => {
      const items = group.items.filter(item =>
        item.title.toLowerCase().includes(kw) ||
        item.desc.some(d => d.toLowerCase().includes(kw))
      )
      return items.length > 0 ? { ...group, items } : null
    })
    .filter(Boolean)
})

const toggleGroup = (date) => {
  collapsed[date] = !collapsed[date]
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

          <section class="news-timeline" v-show="!timelineHidden">
            <div class="news-timeline-axis" />
            <div class="news-timeline-axis-glow" />
            <div class="news-timeline-list">
              <article
                v-for="group in filtered"
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
                        <p v-for="(d, j) in item.desc" :key="j">{{ d }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
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
