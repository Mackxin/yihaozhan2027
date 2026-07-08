<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { marked } from 'marked'

marked.setOptions({ breaks: true, gfm: true })

const props = defineProps({
  article: { type: Object, default: null }
})

const contentRef = ref(null)
const showBackTop = ref(false)

const renderedContent = computed(() => {
  if (!props.article?.content) return '<p style="color:#94a3b8;text-align:center;padding:2rem;">暂无内容</p>'
  return marked(props.article.content)
})

const formattedDate = computed(() => {
  if (!props.article?.updatedAt) return ''
  const d = new Date(props.article.updatedAt)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
})

const onScroll = () => {
  if (!contentRef.value) return
  showBackTop.value = contentRef.value.scrollTop > 300
}

const scrollToTop = () => {
  contentRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  contentRef.value?.addEventListener('scroll', onScroll)
})
onUnmounted(() => {
  contentRef.value?.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="article-page">
    <div class="article-container" ref="contentRef">
      <header class="article-header">
        <h1 class="article-title">{{ article?.title }}</h1>
        <p class="article-meta" v-if="formattedDate">{{ formattedDate }}</p>
      </header>
      <article class="article-body" v-html="renderedContent"></article>
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
</style>
