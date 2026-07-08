import { createApp, watch } from 'vue'
import App from './App.vue'
import './index.css'
import { store } from './store'

// Apply saved favicon on load
const FAVICON_KEY = 'yihao_favicon'

function isEmoji(str) {
  if (!str || typeof str !== 'string') return false
  // URL or data URL should not be treated as emoji
  if (str.startsWith('http') || str.startsWith('/') || str.startsWith('data:')) return false
  const emojiRegex = /(?:[\u2700-\u27BF]|\u2B50|\u2B55|[\u2600-\u26FF]|\u200D|(?:\uD83C[\uDDE6-\uDDFF]){1,2}|(?:\uD83C[\uDDE8-\uDDEC\uDDE0-\uDDE5\uDDEF\uDDF2\uDDF5\uDDF7\uDDFA-\uDDFD]|\uD83D[\uDC00-\uDCFD\uDDFF\uDE80-\uDEA9\uDEC0-\uDEF8\uDF00-\uDF73\uDF80-\uDFF3\uDFA0-\uDFD5\uDFF8-\uDFFF])|(?:\uD83E[\uDD0C-\uDDAF\uDDC0-\uDDE8\uDE68-\uDE7F]))/
  // Consider it an emoji if it contains at least one emoji char and no regular latin letters
  const hasEmoji = emojiRegex.test(str)
  const hasText = /[a-zA-Z0-9]/.test(str)
  return hasEmoji && !hasText
}

function renderEmojiToDataURL(emoji) {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return '/avatar.png'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)
  ctx.font = '46px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, size / 2, size / 2 + 2)
  return canvas.toDataURL('image/png')
}

function applyFavicon(value) {
  let link = document.querySelector('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  if (!value || value === '/avatar.png') {
    link.href = '/avatar.png'
  } else if (isEmoji(value)) {
    link.href = renderEmojiToDataURL(value)
  } else {
    link.href = value
  }
}

// Apply on load
const saved = localStorage.getItem(FAVICON_KEY)
if (saved) applyFavicon(saved)

// Apply on storage change (e.g. from another tab)
window.addEventListener('storage', (e) => {
  if (e.key === FAVICON_KEY) applyFavicon(e.newValue)
})

// React to store changes within the same app
watch(() => store.siteFavicon, (v) => applyFavicon(v))

createApp(App).mount('#app')

export { applyFavicon }
