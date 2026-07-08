<script setup>
import { ref, computed } from 'vue'
import { store } from '../store'

const emit = defineEmits(['close'])

// ═══ Avatar helpers ═══
const avatarServices = [
  (seed) => `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=e5e7eb`,
  (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=e5e7eb`,
  (seed) => `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=e5e7eb`,
  (seed) => `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${seed}&backgroundColor=e5e7eb`,
  (seed) => `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}&backgroundColor=e5e7eb`,
]

const getRandomAvatar = (seed) => {
  if (!seed) seed = String(Date.now())
  const hash = seed.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0)
  const service = avatarServices[hash % avatarServices.length]
  return service(seed)
}

const FALLBACK_AVATAR = '/avatar.png'
const avatarUrl = (idea) => idea.avatar || getRandomAvatar(idea.id || idea.author || String(idea.createdAt)) || FALLBACK_AVATAR
const handleAvatarError = (e) => { e.target.src = FALLBACK_AVATAR }

// ═══ State ═══
const ideas = computed(() => store.ideas.filter(i => i.published).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))

// ═══ Formatters ═══
const fmtTime = (iso) => {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const sourceBadge = (source) => source || 'iPhone 17 Pro Max'
const formatContent = (text) => (text || '').replace(/\n/g, '<br>')

// ═══ Infinite scroll / limit ═══
const displayLimit = ref(20)
const displayedIdeas = computed(() => ideas.value.slice(0, displayLimit.value))
const hasMore = computed(() => displayedIdeas.value.length < ideas.value.length)

const loadMore = () => { displayLimit.value += 10 }

// Scroll to top
const scrollToTop = () => {
  const el = document.querySelector('.idea-page')
  if (el) el.scrollTo({ top: 0, behavior: 'smooth' })
}

// ═══ Image preview ═══
const previewImage = ref(null)
const openPreview = (url) => { previewImage.value = url }
const closePreview = () => { previewImage.value = null }
</script>

<template>
  <div class="idea-page">
    <!-- Top Bar -->
    <div class="idea-topbar">
      <div class="idea-topbar-left">
        <button class="idea-back" @click="$emit('close')" title="关闭">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <h1 class="idea-title">流记</h1>
      </div>
    </div>

    <!-- Feed -->
    <div class="idea-feed">
      <div v-if="!ideas.length" class="idea-empty">
        <div class="idea-empty-icon">🌊</div>
        <p>还没有流记</p>
        <p class="idea-empty-hint">在管理后台的流记管理中发布内容，将在这里展示</p>
      </div>

      <div class="idea-masonry">
        <article
          v-for="idea in displayedIdeas"
          :key="idea.id"
          class="idea-card"
        >
          <!-- Header -->
          <div class="idea-card-header">
            <img class="idea-avatar" :src="avatarUrl(idea)" alt="avatar" @error="handleAvatarError" />
            <div class="idea-user">
              <div class="idea-user-name">
                {{ idea.author || '壹号栈主' }}
              </div>
              <div class="idea-user-meta">
                <span>{{ fmtTime(idea.createdAt) }}</span>
                <span class="idea-dot">·</span>
                <span>来自 {{ sourceBadge(idea.source) }}</span>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="idea-card-body">
            <p class="idea-text" v-html="formatContent(idea.content)"></p>
            <div v-if="idea.images && idea.images.length" :class="['idea-images', `idea-images-${idea.images.length > 4 ? 9 : idea.images.length}`]">
              <div
                v-for="(img, idx) in idea.images.slice(0, 9)"
                :key="idx"
                class="idea-img-wrap"
                @click.stop="openPreview(img)"
              >
                <img :src="img" :alt="`图片${idx+1}`" loading="lazy" @error="$event.target.style.display='none'" />
              </div>
            </div>
          </div>
        </article>
      </div>

      <div v-if="hasMore" class="idea-load-more">
        <button class="idea-btn idea-btn-ghost" @click="loadMore">加载更多</button>
      </div>

      <div v-if="ideas.length" class="idea-back-top" @click="scrollToTop">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
      </div>
    </div>

    <!-- Image Preview Modal -->
    <div v-if="previewImage" class="idea-preview-mask" @click.self="closePreview">
      <img :src="previewImage" class="idea-preview-img" />
      <button class="idea-preview-close" @click="closePreview">✕</button>
    </div>
  </div>
</template>

<style src="./IdeaPage.css"></style>
