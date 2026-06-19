import { reactive, watch } from 'vue'
import { navCategoriesPart1 } from './data/navData1'
import { fullTimelineData } from './data/timelineData'

// Simple debounce for watch persistence
const debounce = (fn, ms) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

const NAV_STORAGE_KEY = 'yihao_nav_categories'
const NEWS_STORAGE_KEY = 'yihao_news_timeline'
const HERO_LINKS_KEY = 'yihao_hero_links'

const defaultNav = navCategoriesPart1.map((c, i) => ({ ...c, id: c.id || i + 1 }))
const defaultTimeline = fullTimelineData
const defaultHeroLinks = [
  { name: '壹号导航', url: 'https://yihaozhan.xyz/naver.html', primary: true },
  { name: '正规大流量卡', url: 'https://h5.lot-ml.com/ProductEn/Index/45f704d8743b76f6' },
  { name: '靠谱大流量卡', url: 'https://simhaoka.com/phone/index?id=8EA4003D1FD6DBE5E7121A88C0DA52C5' },
]

// ─── Initialize from localStorage or defaults ───
const savedNav = localStorage.getItem(NAV_STORAGE_KEY)
const savedNews = localStorage.getItem(NEWS_STORAGE_KEY)
const savedHeroLinks = localStorage.getItem(HERO_LINKS_KEY)

export const store = reactive({
  navCategories: savedNav ? JSON.parse(savedNav) : JSON.parse(JSON.stringify(defaultNav)),
  timelineItems: savedNews ? JSON.parse(savedNews) : JSON.parse(JSON.stringify(defaultTimeline)),
  heroLinks: savedHeroLinks ? JSON.parse(savedHeroLinks) : JSON.parse(JSON.stringify(defaultHeroLinks)),
  dataReady: false,
  isAdmin: localStorage.getItem('yihao_admin') === 'true',
})

export function toggleAdmin() {
  store.isAdmin = !store.isAdmin
  if (store.isAdmin) {
    localStorage.setItem('yihao_admin', 'true')
  } else {
    localStorage.removeItem('yihao_admin')
  }
}

// ─── Try to load from ./data.json (relative path for static deployment) ───
async function loadRemoteData() {
  try {
    const res = await fetch('./data.json?t=' + Date.now())
    if (res.ok) {
      const data = await res.json()
      if (data.navCategories) store.navCategories = data.navCategories
      if (data.timelineItems) store.timelineItems = data.timelineItems
      if (data.heroLinks) store.heroLinks = data.heroLinks
      console.log('✅ 已加载 ./data.json')
    }
  } catch {
    // file:// protocol or no data.json — localStorage data already loaded, keep it
    console.log('ℹ️ fetch 不可用，使用 localStorage 数据')
  }
  store.dataReady = true
}
loadRemoteData()

// Auto-persist on changes (debounced 300ms)
const persistNav = debounce((v) => localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(v)), 300)
const persistNews = debounce((v) => localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(v)), 300)
const persistHero = debounce((v) => localStorage.setItem(HERO_LINKS_KEY, JSON.stringify(v)), 300)

watch(() => store.navCategories, (v) => persistNav(v), { deep: true })
watch(() => store.timelineItems, (v) => persistNews(v), { deep: true })
watch(() => store.heroLinks, (v) => persistHero(v), { deep: true })

// ─── Nav CRUD ───
export function getNextNavId() {
  return store.navCategories.length > 0
    ? Math.max(...store.navCategories.map(c => c.id)) + 1
    : 1
}

export function addNavCategory(title) {
  store.navCategories.push({ id: getNextNavId(), title, links: [] })
}

export function updateNavCategoryTitle(id, title) {
  const cat = store.navCategories.find(c => c.id === id)
  if (cat) cat.title = title
}

export function deleteNavCategory(id) {
  const idx = store.navCategories.findIndex(c => c.id === id)
  if (idx !== -1) store.navCategories.splice(idx, 1)
}

export function addNavLink(catId, name, url) {
  const cat = store.navCategories.find(c => c.id === catId)
  if (cat) cat.links.push({ name, url })
}

export function updateNavLink(catId, linkIndex, name, url) {
  const cat = store.navCategories.find(c => c.id === catId)
  if (cat && cat.links[linkIndex]) {
    cat.links[linkIndex] = { name, url }
  }
}

export function deleteNavLink(catId, linkIndex) {
  const cat = store.navCategories.find(c => c.id === catId)
  if (cat) cat.links.splice(linkIndex, 1)
}

// ─── News CRUD ───
export function addNewsGroup(date) {
  store.timelineItems.unshift({ date, items: [] })
  store.timelineItems.sort((a, b) => b.date.localeCompare(a.date))
}

export function updateNewsGroupDate(oldDate, newDate) {
  const g = store.timelineItems.find(g => g.date === oldDate)
  if (g) {
    g.date = newDate
    store.timelineItems.sort((a, b) => b.date.localeCompare(a.date))
  }
}

export function deleteNewsGroup(date) {
  const idx = store.timelineItems.findIndex(g => g.date === date)
  if (idx !== -1) store.timelineItems.splice(idx, 1)
}

export function addNewsItem(date, item) {
  const g = store.timelineItems.find(g => g.date === date)
  if (g) g.items.push(item)
}

export function updateNewsItem(date, itemIndex, item) {
  const g = store.timelineItems.find(g => g.date === date)
  if (g && g.items[itemIndex]) {
    g.items[itemIndex] = item
  }
}

export function deleteNewsItem(date, itemIndex) {
  const g = store.timelineItems.find(g => g.date === date)
  if (g) g.items.splice(itemIndex, 1)
}

// ─── Export / Import ───
export function exportAllData() {
  const sortedNav = [...store.navCategories].sort((a, b) => (a.id || 0) - (b.id || 0))
  const sortedNews = [...store.timelineItems].sort((a, b) => b.date.localeCompare(a.date))
  return JSON.stringify({
    navCategories: sortedNav,
    timelineItems: sortedNews,
    heroLinks: store.heroLinks,
  }, null, 2)
}

export function importAllData(jsonStr) {
  const data = JSON.parse(jsonStr)
  if (data.navCategories) store.navCategories = data.navCategories
  if (data.timelineItems) store.timelineItems = data.timelineItems
  if (data.heroLinks) store.heroLinks = data.heroLinks
}

export function resetToDefaults() {
  localStorage.removeItem(NAV_STORAGE_KEY)
  localStorage.removeItem(NEWS_STORAGE_KEY)
  localStorage.removeItem(HERO_LINKS_KEY)
  store.navCategories = navCategoriesPart1.map((c, i) => ({ ...c, id: c.id || i + 1 }))
  store.timelineItems = JSON.parse(JSON.stringify(defaultTimeline))
  store.heroLinks = JSON.parse(JSON.stringify(defaultHeroLinks))
}

// ─── Hero Links CRUD ───
export function addHeroLink(name, url) {
  store.heroLinks.push({ name, url })
}

export function updateHeroLink(index, name, url) {
  if (store.heroLinks[index]) {
    store.heroLinks[index] = { ...store.heroLinks[index], name, url }
  }
}

export function deleteHeroLink(index) {
  store.heroLinks.splice(index, 1)
}

// ─── Reorder ───
export function reorderNavCategories(fromIndex, toIndex) {
  const [item] = store.navCategories.splice(fromIndex, 1)
  store.navCategories.splice(toIndex, 0, item)
}

export function reorderNavLinks(catId, fromIndex, toIndex) {
  const cat = store.navCategories.find(c => c.id === catId)
  if (cat && cat.links) {
    const [item] = cat.links.splice(fromIndex, 1)
    cat.links.splice(toIndex, 0, item)
  }
}

// ─── Cleanup ───
export function clearEmptyCategories() {
  store.navCategories = store.navCategories.filter(c => c.links.length > 0)
}

export function clearAllIdeas() {
  localStorage.removeItem('yihao_ideas')
  window.dispatchEvent(new Event('yihao:ideas-cleared'))
}

// ─── Snapshot (for undo) ───
export function getNavSnapshot() {
  return JSON.parse(JSON.stringify(store.navCategories))
}

export function getNewsSnapshot() {
  return JSON.parse(JSON.stringify(store.timelineItems))
}

export function restoreNavSnapshot(snapshot) {
  store.navCategories = snapshot
}

export function restoreNewsSnapshot(snapshot) {
  store.timelineItems = snapshot
}
