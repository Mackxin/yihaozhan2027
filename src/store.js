import { reactive, watch } from 'vue'
import { navCategoriesPart1 } from './data/navData1'
import { fullTimelineData } from './data/timelineData'

const NAV_STORAGE_KEY = 'yihao_nav_categories'
const NEWS_STORAGE_KEY = 'yihao_news_timeline'

const defaultNav = navCategoriesPart1.map((c, i) => ({ ...c, id: c.id || i + 1 }))
const defaultTimeline = fullTimelineData

// ─── Initialize from localStorage or defaults ───
const savedNav = localStorage.getItem(NAV_STORAGE_KEY)
const savedNews = localStorage.getItem(NEWS_STORAGE_KEY)

export const store = reactive({
  navCategories: savedNav ? JSON.parse(savedNav) : JSON.parse(JSON.stringify(defaultNav)),
  timelineItems: savedNews ? JSON.parse(savedNews) : JSON.parse(JSON.stringify(defaultTimeline)),
  dataReady: false,
  // Admin mode: hidden by default in static build; enable via 5 clicks on homepage logo
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
      console.log('✅ 已加载 ./data.json')
    }
  } catch { /* no data.json, use defaults */ }
  store.dataReady = true
}
loadRemoteData()

// Auto-persist on changes
watch(() => store.navCategories, (v) => {
  localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(v))
}, { deep: true })

watch(() => store.timelineItems, (v) => {
  localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(v))
}, { deep: true })

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
  // Sort: navCategories by id ascending, timelineItems by date descending
  const sortedNav = [...store.navCategories].sort((a, b) => (a.id || 0) - (b.id || 0))
  const sortedNews = [...store.timelineItems].sort((a, b) => b.date.localeCompare(a.date))
  return JSON.stringify({
    navCategories: sortedNav,
    timelineItems: sortedNews,
  }, null, 2)
}

export function importAllData(jsonStr) {
  const data = JSON.parse(jsonStr)
  if (data.navCategories) store.navCategories = data.navCategories
  if (data.timelineItems) store.timelineItems = data.timelineItems
}

export function resetToDefaults() {
  localStorage.removeItem(NAV_STORAGE_KEY)
  localStorage.removeItem(NEWS_STORAGE_KEY)
  store.navCategories = navCategoriesPart1.map((c, i) => ({ ...c, id: c.id || i + 1 }))
  store.timelineItems = JSON.parse(JSON.stringify(defaultTimeline))
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
