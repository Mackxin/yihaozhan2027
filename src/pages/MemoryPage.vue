<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { marked } from 'marked'
import { store } from '../store'

// 只设置一次 marked 选项
marked.setOptions({ breaks: true, gfm: true })

const props = defineProps({
  active: { type: Boolean, default: false }
})

// ─── Predefined card color palette (light backgrounds) ───
const cardColors = [
  { bg: 'linear-gradient(145deg, #fff8f5, #fef0e8)', accent: '#f5d5b8' },
  { bg: 'linear-gradient(145deg, #f5fbfd, #e8f4f8)', accent: '#c5e0eb' },
  { bg: 'linear-gradient(145deg, #faf7ff, #f2edfa)', accent: '#d4c5eb' },
  { bg: 'linear-gradient(145deg, #f6fdf5, #eaf6e6)', accent: '#c8e6c0' },
  { bg: 'linear-gradient(145deg, #fdf9f5, #f7efe6)', accent: '#e8d5c0' },
  { bg: 'linear-gradient(145deg, #f5f7ff, #ebedf8)', accent: '#c8cce8' },
  { bg: 'linear-gradient(145deg, #fdfbf5, #f8f4e6)', accent: '#e0d8b0' },
  { bg: 'linear-gradient(145deg, #f5fdfa, #e8f6f2)', accent: '#c0e0d0' },
  { bg: 'linear-gradient(145deg, #fdf5f9, #f8e8f0)', accent: '#e8c0d4' },
  { bg: 'linear-gradient(145deg, #f5f8fd, #e8eef6)', accent: '#c8d4e8' },
  { bg: 'linear-gradient(145deg, #fafcf6, #f0f4e8)', accent: '#d8e4c0' },
  { bg: 'linear-gradient(145deg, #f8f5fb, #efebf5)', accent: '#d0c8e8' },
]

const darkCardColors = [
  { bg: 'linear-gradient(145deg, #2e2622, #252018)', accent: '#4a3530' },
  { bg: 'linear-gradient(145deg, #1f2c33, #182229)', accent: '#304050' },
  { bg: 'linear-gradient(145deg, #262332, #1e1b2a)', accent: '#35304a' },
  { bg: 'linear-gradient(145deg, #1f2c24, #18221c)', accent: '#2a4030' },
  { bg: 'linear-gradient(145deg, #2b2623, #221e1a)', accent: '#403530' },
  { bg: 'linear-gradient(145deg, #232633, #1b1e2a)', accent: '#32384a' },
  { bg: 'linear-gradient(145deg, #2b2923, #222018)', accent: '#403a30' },
  { bg: 'linear-gradient(145deg, #1f2929, #182222)', accent: '#2a3a3a' },
  { bg: 'linear-gradient(145deg, #292329, #201c20)', accent: '#3a323a' },
  { bg: 'linear-gradient(145deg, #21272b, #1a2024)', accent: '#303840' },
  { bg: 'linear-gradient(145deg, #262a22, #1e221a)', accent: '#384030' },
  { bg: 'linear-gradient(145deg, #24212b, #1c1923)', accent: '#342a3a' },
]

// ─── Theme reactivity ───
const isDark = ref(document.documentElement.getAttribute('data-theme') === 'dark')

function getCardStyle(index) {
  const palette = isDark.value ? darkCardColors : cardColors
  const color = palette[index % palette.length]
  return {
    background: color.bg,
    '--card-accent': color.accent,
  }
}

// ─── Published memories ───
const publishedMemories = computed(() =>
  store.memories.filter(m => m.published).sort((a, b) => b.date.localeCompare(a.date))
)

// ─── History view ───
const showHistory = ref(false)

// ─── Mobile swipe state (Douyin-style) ───
const isMobile = ref(window.innerWidth <= 768)
const orderedIndices = ref([])
const currentOrderIndex = ref(0)
const dragStartY = ref(0)
const dragOffsetY = ref(0)
const isDragging = ref(false)
const isAnimating = ref(false)
const SWIPE_THRESHOLD = 80
const swipeRef = ref(null)

function buildOrder() {
  const indices = publishedMemories.value.map((_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]]
  }
  orderedIndices.value = indices
  currentOrderIndex.value = 0
}

function currentMemory() {
  if (!orderedIndices.value.length) return null
  return publishedMemories.value[orderedIndices.value[currentOrderIndex.value]]
}

function prevMemory() {
  const idx = currentOrderIndex.value - 1
  if (idx < 0) return null
  return publishedMemories.value[orderedIndices.value[idx]]
}

function nextMemory() {
  const idx = currentOrderIndex.value + 1
  if (idx >= orderedIndices.value.length) return null
  return publishedMemories.value[orderedIndices.value[idx]]
}

function hasPrev() { return currentOrderIndex.value > 0 }
function hasNext() { return currentOrderIndex.value < orderedIndices.value.length - 1 }

function goToPrev() {
  if (hasPrev() && !isAnimating.value) {
    isAnimating.value = true
    swipeDirection.value = 'down'
    setTimeout(() => {
      currentOrderIndex.value--
      swipeDirection.value = ''
      dragOffsetY.value = 0
      isAnimating.value = false
    }, 320)
  }
}

function goToNext() {
  if (hasNext() && !isAnimating.value) {
    isAnimating.value = true
    swipeDirection.value = 'up'
    setTimeout(() => {
      currentOrderIndex.value++
      swipeDirection.value = ''
      dragOffsetY.value = 0
      isAnimating.value = false
    }, 320)
  }
}

const swipeDirection = ref('') // '' | 'up' | 'down'

// ─── Touch handlers ───
function handleTouchStart(e) {
  if (!isMobile.value || isAnimating.value) return
  isDragging.value = true
  dragStartY.value = e.touches[0].clientY
  dragOffsetY.value = 0
  swipeDirection.value = ''
}

function handleTouchMove(e) {
  if (!isDragging.value) return
  const y = e.touches[0].clientY
  const offset = y - dragStartY.value
  // 只有滑动距离超过 5px 才阻止页面滚动
  if (Math.abs(offset) > 5) {
    e.preventDefault()
  }
  dragOffsetY.value = offset
}

function handleTouchEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  const offset = dragOffsetY.value
  if (Math.abs(offset) > SWIPE_THRESHOLD) {
    if (offset < 0) goToNext()
    else goToPrev()
  } else {
    // Spring back
    dragOffsetY.value = 0
  }
}

// ─── Keyboard support for desktop testing ───
function handleKeydown(e) {
  if (isMobile.value || !props.active) return
  if (e.key === 'ArrowDown') goToNext()
  if (e.key === 'ArrowUp') goToPrev()
}

// ─── Mobile detection ───
function onResize() {
  const next = window.innerWidth <= 768
  if (next !== isMobile.value) {
    isMobile.value = next
    if (next) buildOrder()
  }
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  window.addEventListener('keydown', handleKeydown)
  buildOrder()
})
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('keydown', handleKeydown)
})

// 只在已发布回忆的「数量」变化时才重新洗牌（增删/发布/取消发布），
// 内容编辑不会触发（避免保存后卡片重排、丢失浏览位置）
watch(() => publishedMemories.value.length, () => {
  buildOrder()
})

// ─── Markdown render ───
function renderMarkdown(content) {
  if (!content) return ''
  return marked(content)
}

// ─── Strip markdown for preview ───
function stripMarkdown(content) {
  if (!content) return ''
  return content
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_~`]/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\n/g, ' ')
    .slice(0, 80)
}

// ─── Navigate to a specific memory from history ───
function viewMemory(idx) {
  showHistory.value = false
  if (isMobile.value) {
    const orderIdx = orderedIndices.value.findIndex(i => i === idx)
    if (orderIdx >= 0) {
      currentOrderIndex.value = orderIdx
    } else {
      const indices = publishedMemories.value.map((_, i) => i)
      const selected = indices.splice(idx, 1)[0]
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]]
      }
      orderedIndices.value = [selected, ...indices]
      currentOrderIndex.value = 0
    }
  } else {
    setTimeout(() => {
      const el = document.getElementById('mem-' + idx)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }
}

// ─── Shuffle / random order ───
function shuffleMemories() {
  buildOrder()
}

// ─── Card transform styles for swipe stack ───
function getStackCardStyle(position) {
  const offset = dragOffsetY.value
  const progress = Math.min(Math.abs(offset) / 300, 1)
  const palette = isDark.value ? darkCardColors : cardColors
  const baseColor = palette[(currentOrderIndex.value + position) % palette.length]

  if (position === 0) {
    const opacity = 1 - progress * 0.6
    const scale = 1 - progress * 0.06
    return {
      background: baseColor.bg,
      '--card-accent': baseColor.accent,
      transform: `translateY(${offset}px) scale(${scale})`,
      opacity: `${opacity}`,
      zIndex: 3,
    }
  }
  if (position === 1) {
    const y = hasNext() ? `calc(100% + ${offset * 0.45}px)` : '120%'
    const scale = 0.86 + progress * 0.14
    const opacity = 0.25 + progress * 0.75
    return {
      background: baseColor.bg,
      '--card-accent': baseColor.accent,
      transform: `translateY(${y}) scale(${scale})`,
      opacity: `${opacity}`,
      zIndex: 2,
    }
  }
  if (position === -1) {
    const y = hasPrev() ? `calc(-100% + ${offset * 0.45}px)` : '-120%'
    const scale = 0.86
    const opacity = 0.25
    return {
      background: baseColor.bg,
      '--card-accent': baseColor.accent,
      transform: `translateY(${y}) scale(${scale})`,
      opacity: `${opacity}`,
      zIndex: 1,
    }
  }
  return {}
}

function getCardAnimatingClass(position) {
  if (!swipeDirection.value) return ''
  if (position === 0) {
    return swipeDirection.value === 'up' ? 'animating-out-up' : 'animating-out-down'
  }
  if (position === 1 && swipeDirection.value === 'up') return 'animating-in-up'
  if (position === -1 && swipeDirection.value === 'down') return 'animating-in-down'
  return ''
}

// ─── Refresh on theme change ───
function onThemeChange() {
  isDark.value = document.documentElement.getAttribute('data-theme') === 'dark'
}
onMounted(() => {
  const observer = new MutationObserver(onThemeChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  // 手动绑定非 passive 的 touch 事件，才能在 handleTouchMove 里 preventDefault
  const el = swipeRef.value
  if (el) {
    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
  }

  onUnmounted(() => {
    observer.disconnect()
    if (el) {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
    }
  })
})
</script>

<template>
  <div class="memory-page">
    <!-- ── Toolbar ── -->
    <div class="memory-toolbar">
      <div class="memory-toolbar-left">
        <h1 class="memory-toolbar-title">📖 回忆过往</h1>
        <span class="memory-toolbar-count">{{ publishedMemories.length }} 篇</span>
      </div>
      <div class="memory-toolbar-actions">
        <button
          v-if="!isMobile"
          class="memory-btn-random"
          @click="shuffleMemories()"
        >🔀 随机排列</button>
        <button
          :class="['memory-btn-history', { active: showHistory }]"
          @click="showHistory = !showHistory"
        >📋 历史</button>
      </div>
    </div>

    <!-- ── Desktop: Waterfall ── -->
    <div v-if="!isMobile" class="memory-waterfall">
      <div
        v-for="(mem, idx) in publishedMemories"
        :id="'mem-' + idx"
        :key="mem.id"
        class="memory-card"
        :style="getCardStyle(idx)"
      >
        <div class="memory-card-header">
          <span class="memory-card-mood">{{ mem.mood || '😊' }}</span>
          <div class="memory-card-date-wrap">
            <span class="memory-card-date">{{ mem.date }}</span>
            <span class="memory-card-weekday">{{ mem.weekday || '' }}</span>
          </div>
        </div>
        <div class="memory-card-body" v-html="renderMarkdown(mem.content)"></div>
      </div>
      <div v-if="publishedMemories.length === 0" class="memory-empty">
        <div class="memory-empty-icon">📭</div>
        <h3>暂无回忆</h3>
        <p>在管理后台创建并发布回忆卡片吧</p>
      </div>
    </div>

    <!-- ── Mobile: Douyin-style swipe ── -->
    <div
      ref="swipeRef"
      v-else
      class="memory-swipe"
      @touchend="handleTouchEnd"
    >
      <div v-if="publishedMemories.length === 0" class="memory-empty">
        <div class="memory-empty-icon">📭</div>
        <h3>暂无回忆</h3>
        <p>在管理后台创建并发布回忆卡片吧</p>
      </div>
      <div v-else class="memory-swipe-stack">
        <!-- Previous card -->
        <div
          v-if="prevMemory()"
          class="memory-swipe-card memory-swipe-card-prev"
          :class="getCardAnimatingClass(-1)"
          :style="getStackCardStyle(-1)"
        >
          <div class="memory-card-header">
            <span class="memory-card-mood">{{ prevMemory().mood || '😊' }}</span>
            <div class="memory-card-date-wrap">
              <span class="memory-card-date">{{ prevMemory().date }}</span>
              <span class="memory-card-weekday">{{ prevMemory().weekday || '' }}</span>
            </div>
          </div>
          <div class="memory-card-body" v-html="renderMarkdown(prevMemory().content)"></div>
        </div>

        <!-- Current card -->
        <div
          v-if="currentMemory()"
          class="memory-swipe-card memory-swipe-card-current"
          :class="getCardAnimatingClass(0)"
          :style="getStackCardStyle(0)"
        >
          <div class="memory-card-header">
            <span class="memory-card-mood">{{ currentMemory().mood || '😊' }}</span>
            <div class="memory-card-date-wrap">
              <span class="memory-card-date">{{ currentMemory().date }}</span>
              <span class="memory-card-weekday">{{ currentMemory().weekday || '' }}</span>
            </div>
          </div>
          <div class="memory-card-body" v-html="renderMarkdown(currentMemory().content)"></div>
        </div>

        <!-- Next card -->
        <div
          v-if="nextMemory()"
          class="memory-swipe-card memory-swipe-card-next"
          :class="getCardAnimatingClass(1)"
          :style="getStackCardStyle(1)"
        >
          <div class="memory-card-header">
            <span class="memory-card-mood">{{ nextMemory().mood || '😊' }}</span>
            <div class="memory-card-date-wrap">
              <span class="memory-card-date">{{ nextMemory().date }}</span>
              <span class="memory-card-weekday">{{ nextMemory().weekday || '' }}</span>
            </div>
          </div>
          <div class="memory-card-body" v-html="renderMarkdown(nextMemory().content)"></div>
        </div>
      </div>

      <!-- Indicator -->
      <div v-if="publishedMemories.length > 0" class="memory-swipe-indicator">
        <div class="memory-swipe-progress">
          <span>{{ currentOrderIndex + 1 }}</span>
          <span class="memory-swipe-progress-bar"><i :style="{ width: orderedIndices.length ? ((currentOrderIndex + 1) / orderedIndices.length * 100) + '%' : '0%' }"></i></span>
          <span>{{ orderedIndices.length }}</span>
        </div>
        <span class="memory-swipe-hint">上下滑动切换</span>
      </div>
    </div>

    <!-- ── History Panel ── -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showHistory" class="memory-history-overlay" @click.self="showHistory = false">
          <div class="memory-history-panel">
            <div class="memory-history-header">
              <h3>📋 历史记录</h3>
              <button class="memory-history-close" @click="showHistory = false">✕</button>
            </div>
            <div class="memory-history-list">
              <div
                v-for="(mem, idx) in publishedMemories"
                :key="mem.id"
                class="memory-history-item"
                @click="viewMemory(idx)"
              >
                <span class="memory-history-mood">{{ mem.mood || '😊' }}</span>
                <div class="memory-history-info">
                  <div class="memory-history-date">{{ mem.date }} {{ mem.weekday }}</div>
                  <div class="memory-history-preview">{{ stripMarkdown(mem.content) }}</div>
                </div>
              </div>
              <div v-if="publishedMemories.length === 0" class="memory-empty" style="padding: 2rem 0">
                <p>暂无回忆记录</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style src="./MemoryPage.css"></style>
