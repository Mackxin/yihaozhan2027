<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { marked } from 'marked'
import { store } from '../store'

marked.setOptions({ breaks: true, gfm: true })

const props = defineProps({
  article: { type: Object, default: null }
})

const contentRef = ref(null)
const showBackTop = ref(false)
const progress = ref(0)
const showToc = ref(false)

// 解析正文：渲染 HTML 并为标题注入 id，同时抽取 TOC
const parsed = computed(() => {
  const content = props.article?.content
  if (!content) return { html: '<p style="color:#94a3b8;text-align:center;padding:2rem;">暂无内容</p>', toc: [] }
  const div = document.createElement('div')
  div.innerHTML = marked(content)
  const toc = []
  div.querySelectorAll('h1, h2, h3').forEach((el, i) => {
    const id = 'toc-' + i
    el.id = id
    toc.push({ id, text: el.textContent, level: Number(el.tagName[1]) })
  })
  return { html: div.innerHTML, toc }
})
const renderedContent = computed(() => parsed.value.html)
const toc = computed(() => parsed.value.toc)

const formattedDate = computed(() => {
  if (!props.article?.updatedAt) return ''
  const d = new Date(props.article.updatedAt)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
})

// ── 上一篇 / 下一篇 ──
const articleList = computed(() => store.articles || [])
const currentIndex = computed(() => articleList.value.findIndex(a => a.id === props.article?.id))
const prevArticle = computed(() => currentIndex.value > 0 ? articleList.value[currentIndex.value - 1] : null)
const nextArticle = computed(() => (currentIndex.value >= 0 && currentIndex.value < articleList.value.length - 1) ? articleList.value[currentIndex.value + 1] : null)
const goArticle = (a) => { if (a) { window.__yihaoOpenArticle?.(a.id); contentRef.value?.scrollTo({ top: 0 }) } }

const scrollToHeading = (id) => {
  const el = contentRef.value?.querySelector('#' + id)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  showToc.value = false
}

const onScroll = () => {
  const el = contentRef.value
  if (!el) return
  showBackTop.value = el.scrollTop > 300
  const max = el.scrollHeight - el.clientHeight
  progress.value = max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0
}

const scrollToTop = () => {
  contentRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

// 切换文章时重置滚动与进度
watch(() => props.article?.id, () => {
  progress.value = 0
  showToc.value = false
  contentRef.value?.scrollTo({ top: 0 })
})

onMounted(() => {
  contentRef.value?.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => {
  contentRef.value?.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="article-page">
    <!-- 阅读进度条 -->
    <div class="article-progress"><div class="article-progress-bar" :style="{ width: progress + '%' }"></div></div>

    <!-- 目录（TOC）浮层 -->
    <div v-if="toc.length" class="article-toc-wrap">
      <button class="article-toc-btn" @click="showToc = !showToc" title="目录" aria-label="目录">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
      </button>
      <div v-if="showToc" class="article-toc-panel">
        <div class="article-toc-title">目录</div>
        <a
          v-for="h in toc"
          :key="h.id"
          :class="['article-toc-item', `toc-l${h.level}`]"
          @click="scrollToHeading(h.id)"
        >{{ h.text }}</a>
      </div>
    </div>

    <div class="article-container" ref="contentRef">
      <header class="article-header">
        <h1 class="article-title">{{ article?.title }}</h1>
        <p class="article-meta" v-if="formattedDate">{{ formattedDate }}</p>
      </header>
      <article class="article-body" v-html="renderedContent"></article>

      <!-- 上一篇 / 下一篇 -->
      <nav v-if="prevArticle || nextArticle" class="article-nav">
        <a v-if="prevArticle" class="article-nav-item article-nav-prev" @click="goArticle(prevArticle)">
          <span class="article-nav-label">← 上一篇</span>
          <span class="article-nav-title">{{ prevArticle.title }}</span>
        </a>
        <span v-else class="article-nav-item article-nav-empty"></span>
        <a v-if="nextArticle" class="article-nav-item article-nav-next" @click="goArticle(nextArticle)">
          <span class="article-nav-label">下一篇 →</span>
          <span class="article-nav-title">{{ nextArticle.title }}</span>
        </a>
      </nav>

      <button v-if="showBackTop" class="article-back-top" @click="scrollToTop">↑</button>
    </div>
  </div>
</template>

<style>
/* ═══ Article Page ═══ */
.article-page {
  width: 80%;
  max-width: 860px;
  height: 100%;
  margin: 0 auto;
  background: #fff;
  overflow: hidden;
}
.article-container {
  height: 100%;
  overflow-y: auto;
  padding: 2.5rem 2rem 4rem;
  scroll-behavior: smooth;
}
.article-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1.5px solid #f1f5f9;
}
.article-title {
  font-size: 2rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.3;
  margin: 0 0 0.5rem;
}
.article-meta {
  font-size: 0.82rem;
  color: #94a3b8;
  margin: 0;
}

/* ── Article Body (Markdown rendered) ── */
.article-body { font-size: 1rem; line-height: 1.8; color: #334155; }
.article-body h1 { font-size: 1.6rem; font-weight: 700; margin: 2rem 0 1rem; color: #1e293b; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 0.5rem; }
.article-body h2 { font-size: 1.35rem; font-weight: 700; margin: 1.8rem 0 0.8rem; color: #1e293b; }
.article-body h3 { font-size: 1.15rem; font-weight: 600; margin: 1.5rem 0 0.6rem; color: #334155; }
.article-body h4 { font-size: 1rem; font-weight: 600; margin: 1.2rem 0 0.5rem; color: #475569; }
.article-body p { margin: 0 0 1rem; }
.article-body a { color: #ff1d55; text-decoration: none; border-bottom: 1px solid rgba(255,29,85,0.3); }
.article-body a:hover { border-bottom-color: #ff1d55; }
.article-body strong { font-weight: 700; color: #1e293b; }
.article-body em { font-style: italic; }
.article-body ul, .article-body ol { padding-left: 1.5rem; margin: 0 0 1rem; }
.article-body li { margin-bottom: 0.35rem; }
.article-body blockquote {
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  border-left: 4px solid #ff1d55;
  background: rgba(255,29,85,0.03);
  color: #475569;
  border-radius: 0 8px 8px 0;
}
.article-body code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.88em;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  color: #e11d48;
}
.article-body pre {
  margin: 1rem 0;
  padding: 1rem;
  background: #1e293b;
  border-radius: 10px;
  overflow-x: auto;
}
.article-body pre code {
  background: transparent;
  color: #e2e8f0;
  padding: 0;
  font-size: 0.85rem;
}
.article-body img {
  max-width: 100%;
  border-radius: 10px;
  margin: 1rem 0;
}
.article-body table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; }
.article-body th { background: #f8f9fb; font-weight: 600; text-align: left; padding: 8px 12px; border: 1px solid #e2e8f0; }
.article-body td { padding: 8px 12px; border: 1px solid #e2e8f0; }
.article-body hr { border: none; border-top: 1.5px solid #f1f5f9; margin: 2rem 0; }

.article-back-top {
  position: fixed;
  bottom: 5rem;
  right: 2rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ff1d55;
  color: #fff;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(255,29,85,0.3);
}

/* ── 阅读进度条 ── */
.article-progress {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: transparent;
  z-index: 20;
}
.article-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #ff1d55, #ff7a9c);
  width: 0;
  transition: width .1s linear;
}

/* ── 目录 TOC ── */
.article-toc-wrap { position: fixed; top: 14px; right: 18px; z-index: 30; }
.article-toc-btn {
  width: 38px; height: 38px; border-radius: 50%;
  background: #fff; color: #1e293b; border: 1px solid #e2e8f0;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.article-toc-btn:hover { background: #f8fafc; }
.article-toc-panel {
  position: absolute; top: 46px; right: 0;
  width: 240px; max-height: 60vh; overflow-y: auto;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.14); padding: 10px 6px;
}
.article-toc-title { font-size: 12px; font-weight: 700; color: #94a3b8; padding: 4px 10px 8px; }
.article-toc-item {
  display: block; font-size: 13.5px; color: #475569;
  padding: 6px 10px; border-radius: 7px; cursor: pointer; line-height: 1.4;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.article-toc-item:hover { background: #f1f5f9; color: #ff1d55; }
.toc-l2 { padding-left: 22px; }
.toc-l3 { padding-left: 34px; font-size: 12.5px; }

/* ── 上一篇/下一篇 ── */
.article-nav {
  display: flex; gap: 12px; margin-top: 2.5rem;
  padding-top: 1.5rem; border-top: 1.5px solid #f1f5f9;
}
.article-nav-item {
  flex: 1; display: flex; flex-direction: column; gap: 4px;
  padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 12px;
  cursor: pointer; transition: all .15s; min-width: 0;
}
.article-nav-item:hover { border-color: #ff1d55; background: rgba(255,29,85,0.03); }
.article-nav-empty { border: none; background: none; cursor: default; }
.article-nav-next { text-align: right; }
.article-nav-label { font-size: 12px; color: #94a3b8; font-weight: 600; }
.article-nav-title {
  font-size: 14px; color: #1e293b; font-weight: 600;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .article-page { width: 100%; }
  .article-container { padding: 1.5rem 1rem 5rem; }
  .article-title { font-size: 1.5rem; }
  .article-body { font-size: 0.95rem; }
}

/* ── Dark Mode ── */
[data-theme="dark"] .article-page { background: #0f172a; }
[data-theme="dark"] .article-header { border-bottom-color: #1e293b; }
[data-theme="dark"] .article-title { color: #f1f5f9; }
[data-theme="dark"] .article-body { color: #cbd5e1; }
[data-theme="dark"] .article-body h1,
[data-theme="dark"] .article-body h2 { color: #f1f5f9; border-bottom-color: #1e293b; }
[data-theme="dark"] .article-body h3 { color: #e2e8f0; }
[data-theme="dark"] .article-body strong { color: #f1f5f9; }
[data-theme="dark"] .article-body code { background: #334155; color: #fb7185; }
[data-theme="dark"] .article-body pre { background: #0f172a; border: 1px solid #334155; }
[data-theme="dark"] .article-body blockquote { background: rgba(255,29,85,0.06); border-left-color: #ff1d55; color: #94a3b8; }
[data-theme="dark"] .article-body th { background: #1e293b; border-color: #334155; }
[data-theme="dark"] .article-body td { border-color: #334155; }
[data-theme="dark"] .article-body hr { border-top-color: #1e293b; }
[data-theme="dark"] .article-toc-btn { background: #1e293b; color: #f1f5f9; border-color: #334155; }
[data-theme="dark"] .article-toc-btn:hover { background: #334155; }
[data-theme="dark"] .article-toc-panel { background: #1e293b; border-color: #334155; box-shadow: 0 8px 30px rgba(0,0,0,0.4); }
[data-theme="dark"] .article-toc-item { color: #cbd5e1; }
[data-theme="dark"] .article-toc-item:hover { background: #334155; color: #ff7a9c; }
[data-theme="dark"] .article-nav { border-top-color: #1e293b; }
[data-theme="dark"] .article-nav-item { border-color: #334155; }
[data-theme="dark"] .article-nav-item:hover { border-color: #ff1d55; background: rgba(255,29,85,0.08); }
[data-theme="dark"] .article-nav-title { color: #f1f5f9; }

/* ── 移动端 TOC ── */
@media (max-width: 768px) {
  .article-toc-wrap { top: 10px; right: 12px; }
  .article-toc-panel { width: 210px; }
  .article-nav { flex-direction: column; }
}
</style>
