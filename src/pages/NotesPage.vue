<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { marked } from 'marked'

const STORAGE_KEY = 'yihao_ideas'

const getRandomColor = () => {
  const hue = Math.floor(Math.random() * 360)
  return `hsl(${hue}, 70%, 95%)`
}

const parseTags = (text) => {
  const matches = text.match(/#[\u4e00-\u9fa5_a-zA-Z0-9]+/g) || []
  return matches.map(t => t.slice(1))
}

const ideas = ref([])
const input = ref('')
const filterTag = ref(null)
const editIdx = ref(-1)
const editText = ref('')
const fileRef = ref(null)
const contentRef = ref(null)

// ─── New features ───
const search = ref('')
const sortBy = ref('newest') // newest, oldest, tags
const showPinnedOnly = ref(false)

onMounted(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) ideas.value = JSON.parse(saved)
  } catch { /* ignore */ }
  // Scroll detection for back-to-top
  const slide = contentRef.value?.closest('.page-slide')
  slide?.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => {
  const slide = contentRef.value?.closest('.page-slide')
  slide?.removeEventListener('scroll', onScroll)
})

const showBackTop = ref(false)
const onScroll = () => {
  const slide = contentRef.value?.closest('.page-slide')
  showBackTop.value = slide ? slide.scrollTop > 300 : false
}
const scrollToTop = () => {
  const slide = contentRef.value?.closest('.page-slide')
  slide?.scrollTo({ top: 0, behavior: 'smooth' })
}

const save = (newIdeas) => {
  ideas.value = newIdeas
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newIdeas))
}

const handleSave = () => {
  const text = input.value.trim()
  if (!text) return
  const idea = {
    text,
    date: new Date().toLocaleString('zh-CN'),
    timestamp: Date.now(),
    tags: parseTags(text),
    color: getRandomColor(),
    pinned: false
  }
  save([idea, ...ideas.value])
  input.value = ''
}

const handleDelete = (idx) => {
  if (!confirm('确定要删除这条灵感记录吗？')) return
  const newIdeas = [...ideas.value]
  newIdeas.splice(idx, 1)
  save(newIdeas)
  filterTag.value = null
}

const togglePin = (idx) => {
  const newIdeas = [...ideas.value]
  newIdeas[idx] = { ...newIdeas[idx], pinned: !newIdeas[idx].pinned }
  save(newIdeas)
}

const handleExport = () => {
  const blob = new Blob([JSON.stringify(ideas.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `灵感记录_${new Date().toLocaleString('zh-CN').replace(/[/\s:]/g, '_')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const handleImport = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const imported = JSON.parse(ev.target.result)
      if (Array.isArray(imported)) {
        save([...imported, ...ideas.value])
        alert('导入成功！')
      }
    } catch { alert('导入失败：文件格式不正确') }
  }
  reader.readAsText(file)
  e.target.value = ''
}

const handleClearAll = () => {
  if (ideas.value.length === 0) { alert('没有数据可以清空'); return }
  if (confirm('确定要删除所有灵感记录吗？') && confirm('再次确认？')) {
    save([])
    filterTag.value = null
  }
}

const handleUpdate = () => {
  if (editIdx.value < 0 || !editText.value.trim()) return
  const newIdeas = [...ideas.value]
  newIdeas[editIdx.value] = {
    ...newIdeas[editIdx.value],
    text: editText.value.trim(),
    tags: parseTags(editText.value),
    date: new Date().toLocaleString('zh-CN')
  }
  save(newIdeas)
  editIdx.value = -1
  editText.value = ''
  filterTag.value = null
}

const allTags = computed(() => {
  return ideas.value.reduce((acc, idea) => {
    (idea.tags || []).forEach(tag => { acc[tag] = (acc[tag] || 0) + 1 })
    return acc
  }, {})
})

const totalTags = computed(() => Object.keys(allTags.value).length)
const pinnedCount = computed(() => ideas.value.filter(i => i.pinned).length)

const displayed = computed(() => {
  let result = ideas.value
  // Filter by tag
  if (filterTag.value) {
    result = result.filter(i => i.tags?.includes(filterTag.value))
  }
  // Filter by pin
  if (showPinnedOnly.value) {
    result = result.filter(i => i.pinned)
  }
  // Filter by search
  const kw = search.value.toLowerCase().trim()
  if (kw) {
    result = result.filter(i =>
      i.text.toLowerCase().includes(kw) ||
      (i.tags || []).some(t => t.toLowerCase().includes(kw))
    )
  }
  // Sort
  if (sortBy.value === 'oldest') {
    result = [...result].reverse()
  } else if (sortBy.value === 'tags') {
    result = [...result].sort((a, b) => (b.tags?.length || 0) - (a.tags?.length || 0))
  } else {
    // newest first, pinned first
    result = [...result].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
  }
  return result
})

const renderMd = (text) => {
  const cleaned = text.replace(/#[\u4e00-\u9fa5_a-zA-Z0-9]+/g, '').trim()
  return marked(cleaned, { breaks: true })
}

const handleKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    handleSave()
  }
}
</script>

<template>
  <div class="notes-page" ref="contentRef">
    <div class="notes-container">

      <!-- Header -->
      <div class="notes-header">
        <div class="notes-header-top">
          <div class="notes-header-left">
            <h1 class="notes-title">✨ 灵感随记</h1>
            <p class="notes-subtitle">捕捉想法，记录生活，留住灵感瞬间</p>
          </div>
          <div class="notes-header-actions">
            <button class="notes-action-btn" @click="handleExport" title="导出数据">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              导出
            </button>
            <input ref="fileRef" type="file" accept=".json" style="display: none" @change="handleImport" />
            <button class="notes-action-btn" @click="fileRef?.click()" title="导入数据">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              导入
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div class="notes-stats">
          <div class="notes-stat">
            <span class="notes-stat-num">{{ ideas.length }}</span>
            <span class="notes-stat-label">条记录</span>
          </div>
          <div class="notes-stat-divider"></div>
          <div class="notes-stat">
            <span class="notes-stat-num">{{ totalTags }}</span>
            <span class="notes-stat-label">个标签</span>
          </div>
          <div class="notes-stat-divider"></div>
          <div class="notes-stat">
            <span class="notes-stat-num">{{ pinnedCount }}</span>
            <span class="notes-stat-label">已置顶</span>
          </div>
        </div>
      </div>

      <!-- Input area -->
      <div class="notes-input-section">
        <textarea
          v-model="input"
          @keydown="handleKeydown"
          placeholder="在这里记录你的灵感...&#10;支持 Markdown 语法，使用 #标签 添加标签&#10;按 Ctrl+Enter 快速保存"
          class="notes-textarea"
        />
        <div class="notes-input-footer">
          <button class="notes-save-btn" @click="handleSave" :disabled="!input.trim()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            保存灵感
          </button>
          <span class="notes-char-count" v-if="input.trim()">{{ input.length }} 字</span>
        </div>
      </div>

      <!-- Search + Filter bar -->
      <div class="notes-toolbar">
        <div class="uni-search uni-search-compact">
          <div class="uni-search-wrapper">
            <svg class="uni-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="搜索随记内容或标签..."
              v-model="search"
              class="uni-search-input"
            />
            <button v-if="search" class="uni-search-clear" @click="search = ''">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="notes-toolbar-right">
          <button :class="['notes-filter-btn', { active: showPinnedOnly }]" @click="showPinnedOnly = !showPinnedOnly">
            📌 置顶
          </button>
          <select v-model="sortBy" class="notes-sort-select">
            <option value="newest">最新优先</option>
            <option value="oldest">最早优先</option>
            <option value="tags">标签最多</option>
          </select>
        </div>
      </div>

      <!-- Tag cloud -->
      <div v-if="Object.keys(allTags).length > 0" class="notes-tag-cloud">
        <div class="notes-tag-header">
          <span>标签筛选</span>
          <button v-if="filterTag" class="notes-tag-clear" @click="filterTag = null">× 清除</button>
        </div>
        <div class="notes-tags">
          <span
            v-for="(count, tag) in allTags"
            :key="tag"
            :class="['notes-tag', { active: filterTag === tag }]"
            @click="filterTag = filterTag === tag ? null : tag"
          >
            #{{ tag }} <small>({{ count }})</small>
          </span>
        </div>
      </div>

      <!-- Cards -->
      <div v-if="displayed.length > 0" class="notes-grid">
        <div
          v-for="(idea, idx) in displayed"
          :key="ideas.indexOf(idea)"
          :class="['notes-card', { 'notes-card-pinned': idea.pinned }]"
          :style="{ backgroundColor: idea.color }"
        >
          <div v-if="idea.pinned" class="notes-pin-badge">📌 已置顶</div>
          <div class="notes-card-content" v-html="renderMd(idea.text)" />
          <div class="notes-card-footer">
            <div class="notes-card-meta">
              <span class="notes-date">{{ idea.date }}</span>
              <div class="notes-card-actions">
                <button :class="['notes-icon-btn', { active: idea.pinned }]" @click="togglePin(ideas.indexOf(idea))" :title="idea.pinned ? '取消置顶' : '置顶'">
                  📌
                </button>
                <button class="notes-icon-btn" @click="editIdx = ideas.indexOf(idea); editText = idea.text" title="编辑">
                  ✏️
                </button>
                <button class="notes-icon-btn" @click="handleDelete(ideas.indexOf(idea))" title="删除">
                  🗑️
                </button>
              </div>
            </div>
            <div v-if="idea.tags?.length > 0" class="notes-card-tags">
              <span v-for="t in idea.tags" :key="t" class="notes-card-tag" @click="filterTag = t">#{{ t }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="notes-empty">
        <div class="notes-empty-icon">📝</div>
        <h3>{{ ideas.length === 0 ? '还没有灵感记录' : '没有找到匹配的内容' }}</h3>
        <p>{{ ideas.length === 0 ? '在上方输入框开始记录你的第一条灵感吧！' : '试试调整搜索条件或清除筛选' }}</p>
      </div>

    </div>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div v-if="editIdx >= 0" class="notes-modal" @click="editIdx = -1">
        <div class="notes-modal-content" @click.stop>
          <div class="notes-modal-header">
            <h3>编辑灵感</h3>
            <button class="notes-modal-close" @click="editIdx = -1">×</button>
          </div>
          <textarea v-model="editText" class="notes-modal-textarea" />
          <button class="notes-update-btn" @click="handleUpdate">更新</button>
        </div>
      </div>
    </Teleport>

    <!-- Back to top -->
    <Teleport to="body">
    <button v-if="showBackTop" class="back-to-top" @click="scrollToTop">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M5 15l7-7 7 7"/>
      </svg>
    </button>
    </Teleport>
  </div>
</template>

<style src="./NotesPage.css"></style>
