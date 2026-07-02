import { reactive, watch } from 'vue'
import { navCategoriesPart1 } from './data/navData1'
import { fullTimelineData } from './data/timelineData'
import { defaultMacSections } from './data/macData'

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
const MAC_DATA_KEY = 'yihao_mac_data'
const ARTICLES_KEY = 'yihao_articles'
const MEMORIES_KEY = 'yihao_memories'
const TOOL_PAGES_KEY = 'yihao_tool_pages'
const TOOL_PAGES_DATA_KEY = 'yihao_tool_pages_data'
const FAVICON_KEY = 'yihao_favicon'

const defaultNav = navCategoriesPart1.map((c, i) => ({ ...c, id: c.id || i + 1 }))
const defaultTimeline = fullTimelineData
const defaultHeroLinks = [
  { name: '壹号导航', url: 'https://yihaozhan.xyz/naver.html', primary: true },
  { name: '正规大流量卡', url: 'https://h5.lot-ml.com/ProductEn/Index/45f704d8743b76f6' },
  { name: '靠谱大流量卡', url: 'https://simhaoka.com/phone/index?id=8EA4003D1FD6DBE5E7121A88C0DA52C5' },
]
const defaultMac = JSON.parse(JSON.stringify(defaultMacSections))
const defaultArticles = []
const defaultMemories = []
const defaultToolPages = [
  { key: 'mac', label: 'Mac 软件', icon: '🍎', themeColor: '#ff1d55', heroTitle: 'Mac 软件推荐', heroSubtitle: '精选好用的 macOS 工具与配置', heroDesc: '收集了一些好用的 Mac 软件、系统工具、终端命令、装机记录，以及收费软件推荐。' }
]
const defaultToolPagesData = {}
const defaultFavicon = '/avatar.png'

// ─── Initialize from localStorage or defaults ───
const savedNav = localStorage.getItem(NAV_STORAGE_KEY)
const savedNews = localStorage.getItem(NEWS_STORAGE_KEY)
const savedHeroLinks = localStorage.getItem(HERO_LINKS_KEY)
const savedMac = localStorage.getItem(MAC_DATA_KEY)
const savedArticles = localStorage.getItem(ARTICLES_KEY)
const savedMemories = localStorage.getItem(MEMORIES_KEY)
const savedToolPages = localStorage.getItem(TOOL_PAGES_KEY)
const savedToolPagesData = localStorage.getItem(TOOL_PAGES_DATA_KEY)
const savedFavicon = localStorage.getItem(FAVICON_KEY)

export const store = reactive({
  navCategories: savedNav ? JSON.parse(savedNav) : JSON.parse(JSON.stringify(defaultNav)),
  timelineItems: savedNews ? JSON.parse(savedNews) : JSON.parse(JSON.stringify(defaultTimeline)),
  heroLinks: savedHeroLinks ? JSON.parse(savedHeroLinks) : JSON.parse(JSON.stringify(defaultHeroLinks)),
  macSections: savedMac ? JSON.parse(savedMac) : defaultMac,
  articles: savedArticles ? JSON.parse(savedArticles) : JSON.parse(JSON.stringify(defaultArticles)),
  memories: savedMemories ? JSON.parse(savedMemories) : JSON.parse(JSON.stringify(defaultMemories)),
  toolPages: savedToolPages ? JSON.parse(savedToolPages) : JSON.parse(JSON.stringify(defaultToolPages)),
  toolPagesData: savedToolPagesData ? JSON.parse(savedToolPagesData) : JSON.parse(JSON.stringify(defaultToolPagesData)),
  siteFavicon: savedFavicon || defaultFavicon,
  dataReady: false,
  isAdmin: localStorage.getItem('yihao_admin') === 'true',
})

export function toggleAdmin() {
  if (store.isAdmin) {
    logoutAdmin()
  } else {
    // Will be handled by App.vue to show login modal
    window.dispatchEvent(new Event('yihao:show-login'))
  }
}

export function loginAdmin() {
  store.isAdmin = true
  localStorage.setItem('yihao_admin', 'true')
}

export function logoutAdmin() {
  store.isAdmin = false
  localStorage.removeItem('yihao_admin')
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
      if (data.macSections) store.macSections = data.macSections
      if (data.articles) store.articles = data.articles
      if (data.memories) store.memories = data.memories
      if (data.toolPages) store.toolPages = data.toolPages
      if (data.toolPagesData) store.toolPagesData = data.toolPagesData
      if (data.siteFavicon) store.siteFavicon = data.siteFavicon
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
const persistMac = debounce((v) => localStorage.setItem(MAC_DATA_KEY, JSON.stringify(v)), 300)
const persistArticles = debounce((v) => localStorage.setItem(ARTICLES_KEY, JSON.stringify(v)), 300)
const persistMemories = debounce((v) => localStorage.setItem(MEMORIES_KEY, JSON.stringify(v)), 300)
const persistToolPages = debounce((v) => localStorage.setItem(TOOL_PAGES_KEY, JSON.stringify(v)), 300)
const persistToolPagesData = debounce((v) => localStorage.setItem(TOOL_PAGES_DATA_KEY, JSON.stringify(v)), 300)
const persistFavicon = debounce((v) => localStorage.setItem(FAVICON_KEY, v), 300)

watch(() => store.navCategories, (v) => persistNav(v), { deep: true })
watch(() => store.timelineItems, (v) => persistNews(v), { deep: true })
watch(() => store.heroLinks, (v) => persistHero(v), { deep: true })
watch(() => store.macSections, (v) => persistMac(v), { deep: true })
watch(() => store.articles, (v) => persistArticles(v), { deep: true })
watch(() => store.memories, (v) => persistMemories(v), { deep: true })
watch(() => store.toolPages, (v) => persistToolPages(v), { deep: true })
watch(() => store.toolPagesData, (v) => persistToolPagesData(v), { deep: true })
watch(() => store.siteFavicon, (v) => persistFavicon(v))

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
    macSections: store.macSections,
    articles: store.articles,
    memories: store.memories,
    toolPages: store.toolPages,
    toolPagesData: store.toolPagesData,
    siteFavicon: store.siteFavicon,
  }, null, 2)
}

export function importAllData(jsonStr) {
  const data = JSON.parse(jsonStr)
  if (data.navCategories) store.navCategories = data.navCategories
  if (data.timelineItems) store.timelineItems = data.timelineItems
  if (data.heroLinks) store.heroLinks = data.heroLinks
  if (data.macSections) store.macSections = data.macSections
  if (data.articles) store.articles = data.articles
  if (data.memories) store.memories = data.memories
  if (data.toolPages) store.toolPages = data.toolPages
  if (data.toolPagesData) store.toolPagesData = data.toolPagesData
  if (data.siteFavicon) store.siteFavicon = data.siteFavicon
}

export function resetToDefaults() {
  localStorage.removeItem(NAV_STORAGE_KEY)
  localStorage.removeItem(NEWS_STORAGE_KEY)
  localStorage.removeItem(HERO_LINKS_KEY)
  localStorage.removeItem(MAC_DATA_KEY)
  localStorage.removeItem(ARTICLES_KEY)
  localStorage.removeItem(MEMORIES_KEY)
  localStorage.removeItem(TOOL_PAGES_KEY)
  localStorage.removeItem(TOOL_PAGES_DATA_KEY)
  localStorage.removeItem(FAVICON_KEY)
  store.navCategories = navCategoriesPart1.map((c, i) => ({ ...c, id: c.id || i + 1 }))
  store.timelineItems = JSON.parse(JSON.stringify(defaultTimeline))
  store.heroLinks = JSON.parse(JSON.stringify(defaultHeroLinks))
  store.macSections = JSON.parse(JSON.stringify(defaultMacSections))
  store.articles = JSON.parse(JSON.stringify(defaultArticles))
  store.memories = JSON.parse(JSON.stringify(defaultMemories))
  store.toolPages = JSON.parse(JSON.stringify(defaultToolPages))
  store.toolPagesData = JSON.parse(JSON.stringify(defaultToolPagesData))
  store.siteFavicon = defaultFavicon
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

// ─── Mac CRUD ───
export function getNextMacSectionId() {
  const ids = store.macSections.map(s => s.id).filter(id => typeof id === 'number')
  return ids.length > 0 ? Math.max(...ids) + 1 : 1
}

export function addMacSection({ icon, title, subtitle }) {
  const id = getNextMacSectionId()
  store.macSections.push({ id, icon: icon || '📦', title, subtitle: subtitle || '', items: [] })
  return id
}

export function updateMacSection(id, { icon, title, subtitle }) {
  const section = store.macSections.find(s => s.id === id)
  if (section) {
    section.icon = icon ?? section.icon
    section.title = title ?? section.title
    section.subtitle = subtitle ?? section.subtitle
  }
}

export function deleteMacSection(id) {
  const idx = store.macSections.findIndex(s => s.id === id)
  if (idx !== -1) store.macSections.splice(idx, 1)
}

export function addMacItem(sectionId, item) {
  const section = store.macSections.find(s => s.id === sectionId)
  if (section) section.items.push(item)
}

export function updateMacItem(sectionId, index, item) {
  const section = store.macSections.find(s => s.id === sectionId)
  if (section && section.items[index]) {
    section.items[index] = item
  }
}

export function deleteMacItem(sectionId, index) {
  const section = store.macSections.find(s => s.id === sectionId)
  if (section) section.items.splice(index, 1)
}

export function getMacSnapshot() {
  return JSON.parse(JSON.stringify(store.macSections))
}

export function restoreMacSnapshot(snapshot) {
  store.macSections = snapshot
}

// ─── Tool Page Registry (通用工具页面系统) ───
// 所有工具页面（内置 + 用户自定义）存储在 store.toolPages 中
// 每个页面的 sections 数据存储在 store.toolPagesData[key]（mac 除外，mac 使用 store.macSections）
export const toolPageConfigs = {}  // 保留兼容性，由 registerToolPage 填充

export function registerToolPage(key, config) {
  toolPageConfigs[key] = { ...config, key, url: `http://yihaozhan.xyz/${key}.html` }
  // 同步到动态数组
  const existing = store.toolPages.find(tp => tp.key === key)
  if (!existing) {
    store.toolPages.push({ key, label: config.label, icon: config.icon, themeColor: config.themeColor, heroTitle: config.heroTitle, heroSubtitle: config.heroSubtitle, heroDesc: config.heroDesc, storeField: config.storeField || '' })
  }
}

// 获取工具页面配置
export function getToolConfig(key) {
  const tp = store.toolPages.find(t => t.key === key)
  return tp || toolPageConfigs[key] || {}
}

// 获取某个工具的数据（sections）
export function getToolSections(key) {
  if (key === 'mac') return store.macSections
  return store.toolPagesData[key] || []
}

// ─── Tool Page CRUD ───
// 验证 key 格式：小写字母、数字、连字符
export function isValidToolKey(key) {
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(key)
}

// 检查 key 是否已存在
export function toolKeyExists(key) {
  return store.toolPages.some(tp => tp.key === key)
}

export function addToolPage(config) {
  const key = config.key
  if (!isValidToolKey(key)) throw new Error('key 格式不正确：仅支持小写字母、数字和连字符')
  if (toolKeyExists(key)) throw new Error(`工具页面 "${key}" 已存在`)
  const tp = {
    key,
    label: config.label || key,
    icon: config.icon || '📦',
    themeColor: config.themeColor || '#6366f1',
    heroTitle: config.heroTitle || config.label || key,
    heroSubtitle: config.heroSubtitle || '',
    heroDesc: config.heroDesc || '',
  }
  store.toolPages.push(tp)
  // 初始化数据
  if (key !== 'mac') {
    store.toolPagesData[key] = []
  }
  // 同步到 toolPageConfigs（供 NavPage resolveToolLink 识别）
  registerToolPage(key, tp)
  return tp
}

export function updateToolPage(key, config) {
  const idx = store.toolPages.findIndex(tp => tp.key === key)
  if (idx === -1) return
  const tp = store.toolPages[idx]
  if (config.label !== undefined) tp.label = config.label
  if (config.icon !== undefined) tp.icon = config.icon
  if (config.themeColor !== undefined) tp.themeColor = config.themeColor
  if (config.heroTitle !== undefined) tp.heroTitle = config.heroTitle
  if (config.heroSubtitle !== undefined) tp.heroSubtitle = config.heroSubtitle
  if (config.heroDesc !== undefined) tp.heroDesc = config.heroDesc
  // 同步 toolPageConfigs
  if (toolPageConfigs[key]) {
    Object.assign(toolPageConfigs[key], { label: tp.label, icon: tp.icon, themeColor: tp.themeColor, heroTitle: tp.heroTitle, heroSubtitle: tp.heroSubtitle, heroDesc: tp.heroDesc })
  }
}

export function deleteToolPage(key) {
  if (key === 'mac') return  // 不允许删除内置的 mac 页面
  const idx = store.toolPages.findIndex(tp => tp.key === key)
  if (idx !== -1) store.toolPages.splice(idx, 1)
  delete store.toolPagesData[key]
  delete toolPageConfigs[key]
}

// 获取工具页面列表（不含 mac，mac 单独管理）
export function getCustomToolPages() {
  return store.toolPages.filter(tp => tp.key !== 'mac')
}

export function getAllToolPages() {
  return store.toolPages
}

// ─── 通用 Tool Section/Item CRUD（适用于所有工具页面） ───
export function addToolSection(key, { icon, title, subtitle }) {
  const sections = getToolSections(key)
  const ids = sections.map(s => s.id).filter(id => typeof id === 'number')
  const id = ids.length > 0 ? Math.max(...ids) + 1 : 1
  sections.push({ id, icon: icon || '📦', title, subtitle: subtitle || '', items: [] })
  return id
}

export function updateToolSection(key, id, { icon, title, subtitle }) {
  const section = getToolSections(key).find(s => s.id === id)
  if (section) {
    if (icon !== undefined) section.icon = icon
    if (title !== undefined) section.title = title
    if (subtitle !== undefined) section.subtitle = subtitle
  }
}

export function deleteToolSection(key, id) {
  const sections = getToolSections(key)
  const idx = sections.findIndex(s => s.id === id)
  if (idx !== -1) sections.splice(idx, 1)
}

export function addToolItem(key, sectionId, item) {
  const section = getToolSections(key).find(s => s.id === sectionId)
  if (section) section.items.push(item)
}

export function updateToolItem(key, sectionId, index, item) {
  const sections = getToolSections(key)
  const section = sections.find(s => s.id === sectionId)
  if (section && section.items[index]) {
    section.items[index] = item
  }
}

export function deleteToolItem(key, sectionId, index) {
  const section = getToolSections(key).find(s => s.id === sectionId)
  if (section) section.items.splice(index, 1)
}

export function getToolSnapshot(key) {
  return JSON.parse(JSON.stringify(getToolSections(key)))
}

export function restoreToolSnapshot(key, snapshot) {
  if (key === 'mac') {
    store.macSections = snapshot
  } else {
    store.toolPagesData[key] = snapshot
  }
}

// ─── Articles CRUD ───
export function generateArticleId() {
  return 'a_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function addArticle(title, content) {
  const now = new Date().toISOString()
  store.articles.push({
    id: generateArticleId(),
    title: title || '未命名文章',
    content: content || '',
    published: false,
    createdAt: now,
    updatedAt: now
  })
}

export function updateArticle(id, updates) {
  const article = store.articles.find(a => a.id === id)
  if (article) {
    Object.assign(article, updates, { updatedAt: new Date().toISOString() })
  }
}

export function deleteArticle(id) {
  const idx = store.articles.findIndex(a => a.id === id)
  if (idx >= 0) store.articles.splice(idx, 1)
}

export function getArticleById(id) {
  return store.articles.find(a => a.id === id)
}

export function getArticlesSnapshot() {
  return JSON.parse(JSON.stringify(store.articles))
}

export function restoreArticlesSnapshot(snapshot) {
  store.articles = snapshot
}

// ─── Memories CRUD ───
export function generateMemoryId() {
  return 'm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function addMemory(memory) {
  const now = new Date().toISOString()
  store.memories.push({
    id: generateMemoryId(),
    content: memory.content || '',
    date: memory.date || new Date().toISOString().slice(0, 10),
    weekday: memory.weekday || '',
    mood: memory.mood || '😊',
    published: memory.published || false,
    createdAt: now,
    updatedAt: now
  })
}

export function updateMemory(id, updates) {
  const memory = store.memories.find(m => m.id === id)
  if (memory) {
    Object.assign(memory, updates, { updatedAt: new Date().toISOString() })
  }
}

export function deleteMemory(id) {
  const idx = store.memories.findIndex(m => m.id === id)
  if (idx >= 0) store.memories.splice(idx, 1)
}

export function getMemoriesSnapshot() {
  return JSON.parse(JSON.stringify(store.memories))
}

export function restoreMemoriesSnapshot(snapshot) {
  store.memories = snapshot
}

// ─── 注册内置工具页面 ───
registerToolPage('mac', {
  label: 'Mac 软件',
  icon: '🍎',
  storeField: 'macSections',
  storageKey: MAC_DATA_KEY,
  themeColor: '#ff1d55',
  heroTitle: 'Mac 软件推荐',
  heroSubtitle: '精选好用的 macOS 工具与配置',
  heroDesc: '收集了一些好用的 Mac 软件、系统工具、终端命令、装机记录，以及收费软件推荐。',
})
