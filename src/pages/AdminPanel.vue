<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { marked } from 'marked'
import {
  store,
  addNavCategory, updateNavCategoryTitle, deleteNavCategory,
  addNavLink, updateNavLink, deleteNavLink,
  addNewsGroup, updateNewsGroupDate, deleteNewsGroup,
  addNewsItem, updateNewsItem, deleteNewsItem,
  exportAllData, importAllData,
  reorderNavCategories, reorderNavLinks,
  clearEmptyCategories, clearAllIdeas,
  getNavSnapshot, getNewsSnapshot, restoreNavSnapshot, restoreNewsSnapshot,
  addHeroLink, updateHeroLink, deleteHeroLink,
  addMacItem, updateMacItem, deleteMacItem, getMacSnapshot, restoreMacSnapshot,
  addArticle, updateArticle, deleteArticle, getArticleById,
  getArticlesSnapshot, restoreArticlesSnapshot
} from '../store'

const activeTab = ref('overview')
const contentRef = ref(null)
const helpContentRef = ref(null)
const activeHelpSection = ref('h1')

// ─── Help sections ───
const helpSections = [
  { id: 'h1', icon: '🌐', title: '网站架构' },
  { id: 'h2', icon: '🧭', title: '导航管理' },
  { id: 'h3', icon: '📰', title: '讯息管理' },
  { id: 'h4', icon: '💾', title: '数据备份与恢复' },
  { id: 'h5', icon: '🚀', title: '更新网站数据' },
  { id: 'h6', icon: '🔍', title: '全站搜索' },
  { id: 'h7', icon: '🏠', title: '首页头像设置' },
  { id: 'h12', icon: '🎨', title: '导航栏图标' },
  { id: 'h13', icon: '👁️', title: 'Markdown 预览' },
  { id: 'h14', icon: '🔔', title: '备份提醒' },
  { id: 'h15', icon: '🍎', title: 'Mac 软件页' },
  { id: 'h16', icon: '📝', title: '文章管理' },
  { id: 'h17', icon: '🔑', title: '后台登录' },
  { id: 'h11', icon: '💻', title: '开发环境' },
  { id: 'h8', icon: '🌍', title: '部署到服务器' },
  { id: 'h9', icon: '✏️', title: '随记管理' },
  { id: 'h10', icon: '⌨️', title: '快捷键' },
]

const scrollToHelp = (id) => {
  const el = helpContentRef.value?.querySelector('#' + id)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  activeHelpSection.value = id
}

const onHelpScroll = () => {
  const container = helpContentRef.value
  if (!container) return
  const sections = helpSections.map(s => container.querySelector('#' + s.id)).filter(Boolean)
  const offset = container.scrollTop + 120
  for (let i = sections.length - 1; i >= 0; i--) {
    if (sections[i].offsetTop <= offset) {
      activeHelpSection.value = helpSections[i].id
      return
    }
  }
}

// ─── Nav state ───
const navSearch = ref('')
const selectedCatId = ref(null)
const editingCat = reactive({ id: null, title: '' })
const newCatTitle = ref('')
const showAddCat = ref(false)
const newLink = reactive({ catId: null, name: '', url: '' })
const editingLink = reactive({ catId: null, index: -1, name: '', url: '' })

// ─── Batch Import ───
const showBatchImport = ref(false)
const batchImportText = ref('')
const parsedBatchLinks = computed(() => {
  return batchImportText.value.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    // Support: "Name URL", "Name,URL", "Name | URL", "Name\tURL"
    const parts = line.split(/[\t,|]\s*|\s{2,}|(?<=\S)\s+(?=\S*(?:https?:\/\/|www\.))/)
    if (parts.length >= 2) {
      const url = parts.find(p => p.includes('http') || p.includes('www.')) || parts[parts.length - 1]
      const name = parts.filter(p => p !== url).join(' ') || url
      return { name: name.trim(), url: url.trim(), valid: true }
    }
    // Single URL
    if (line.includes('http') || line.includes('www.')) {
      try {
        const u = new URL(line.startsWith('http') ? line : 'https://' + line)
        return { name: u.hostname.replace('www.', ''), url: line, valid: true }
      } catch {
        return { name: line, url: line, valid: false }
      }
    }
    return { name: line, url: '', valid: false }
  })
})
const batchValidCount = computed(() => parsedBatchLinks.value.filter(l => l.valid).length)
const handleBatchImport = () => {
  if (!selectedCatId.value) return
  const valid = parsedBatchLinks.value.filter(l => l.valid)
  valid.forEach(l => addNavLink(selectedCatId.value, l.name, l.url.startsWith('http') ? l.url : 'https://' + l.url))
  log(`批量导入 ${valid.length} 个链接`)
  showBatchImport.value = false
  batchImportText.value = ''
}

// ─── News state ───
const selectedDate = ref(null)
const editingGroupDate = reactive({ old: '', new: '' })
const newGroupDate = ref('')
const showAddGroup = ref(false)
const newItem = reactive({ date: '', title: '', url: '', desc: '' })
const editingItem = reactive({ date: '', index: -1, title: '', url: '', desc: '' })

// ─── Custom Date Picker ───
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const offsetDate = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth())
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const calDays = computed(() => {
  const firstDay = new Date(calYear.value, calMonth.value, 1).getDay()
  const daysInMonth = new Date(calYear.value, calMonth.value + 1, 0).getDate()
  const daysInPrev = new Date(calYear.value, calMonth.value, 0).getDate()
  const days = []
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrev - i, current: false, date: '' })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(calMonth.value + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    days.push({ day: d, current: true, date: `${calYear.value}-${mm}-${dd}` })
  }
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, current: false, date: '' })
  }
  return days
})

const calHeader = computed(() => `${calYear.value}年${String(calMonth.value + 1).padStart(2, '0')}月`)

const prevMonth = () => {
  if (calMonth.value === 0) { calMonth.value = 11; calYear.value-- }
  else calMonth.value--
}
const nextMonth = () => {
  if (calMonth.value === 11) { calMonth.value = 0; calYear.value++ }
  else calMonth.value++
}
const pickDate = (dateStr) => {
  if (dateStr) { newGroupDate.value = dateStr; showAddGroup.value = false; handleAddGroup() }
}
const pickQuick = (dateStr) => { newGroupDate.value = dateStr; showAddGroup.value = false; handleAddGroup() }

// ─── Hero Links state ───
const showHeroLinks = ref(true)
const newHeroLink = reactive({ name: '', url: '' })
const editingHeroLink = reactive({ index: -1, name: '', url: '' })

const handleAddHeroLink = () => {
  if (!newHeroLink.name.trim() || !newHeroLink.url.trim()) return
  const name = newHeroLink.name.trim()
  addHeroLink(name, newHeroLink.url.trim())
  newHeroLink.name = ''
  newHeroLink.url = ''
  log('➕ 添加讯息链接: ' + name)
}
const startEditHeroLink = (index) => {
  const link = store.heroLinks[index]
  editingHeroLink.index = index
  editingHeroLink.name = link.name
  editingHeroLink.url = link.url
}
const saveEditHeroLink = () => {
  if (editingHeroLink.index < 0) return
  updateHeroLink(editingHeroLink.index, editingHeroLink.name, editingHeroLink.url)
  log('✏️ 更新讯息链接: ' + editingHeroLink.name)
  editingHeroLink.index = -1
}
const handleDeleteHeroLink = (index) => {
  if (!confirm('确定删除此链接？')) return
  const name = store.heroLinks[index]?.name
  deleteHeroLink(index)
  log('🗑️ 删除讯息链接: ' + name)
}

// ─── Mac Software state ───
const activeMacSection = ref(store.macSections[0]?.id || '')
const newMacItem = reactive({ name: '', desc: '', url: '', tags: '' })
const editingMacItem = reactive({ sectionId: '', index: -1, name: '', desc: '', url: '', tags: '' })

const currentMacSection = computed(() => store.macSections.find(s => s.id === activeMacSection.value))
const macTotalItems = computed(() => store.macSections.reduce((s, sec) => s + sec.items.length, 0))
const saveAddMacItem = () => {
  if (!newMacItem.name.trim()) return
  const sectionId = activeMacSection.value
  if (!sectionId) return
  pushUndo('mac', getMacSnapshot(), '新增Mac软件')
  addMacItem(sectionId, {
    name: newMacItem.name.trim(),
    desc: newMacItem.desc.trim(),
    url: newMacItem.url.trim(),
    emoji: '📦',
    tags: newMacItem.tags.split(',').map(t => t.trim()).filter(Boolean)
  })
  log(`新增Mac软件「${newMacItem.name.trim()}」`)
  newMacItem.name = ''; newMacItem.desc = ''; newMacItem.url = ''; newMacItem.tags = ''
}
const startEditMacItem = (sectionId, idx, item) => {
  editingMacItem.sectionId = sectionId
  editingMacItem.index = idx
  editingMacItem.name = item.name
  editingMacItem.desc = item.desc
  editingMacItem.url = item.url
  editingMacItem.tags = (item.tags || []).join(', ')
}
const saveEditMacItem = () => {
  if (editingMacItem.index < 0 || !editingMacItem.name.trim()) return
  pushUndo('mac', getMacSnapshot(), '编辑Mac软件')
  updateMacItem(editingMacItem.sectionId, editingMacItem.index, {
    name: editingMacItem.name.trim(),
    desc: editingMacItem.desc.trim(),
    url: editingMacItem.url.trim(),
    emoji: '📦',
    tags: editingMacItem.tags.split(',').map(t => t.trim()).filter(Boolean)
  })
  log(`修改Mac软件「${editingMacItem.name.trim()}」`)
  editingMacItem.index = -1
}
const handleDeleteMacItem = (sectionId, idx) => {
  const sec = store.macSections.find(s => s.id === sectionId)
  const name = sec?.items[idx]?.name
  if (!confirm(`确定删除「${name}」？`)) return
  pushUndo('mac', getMacSnapshot(), `删除Mac软件「${name}」`)
  deleteMacItem(sectionId, idx)
  log(`删除Mac软件「${name}」`)
}

// ─── Password Change ───
const newPwd = reactive({ username: '', password: '' })
const pwdMsg = ref('')

const handleChangePwd = async () => {
  if (!newPwd.username.trim() || !newPwd.password) return
  try {
    const msgBuffer = new TextEncoder().encode(newPwd.username.trim() + ':' + newPwd.password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
    const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
    localStorage.setItem('yihao_admin_hash', hash)
    pwdMsg.value = '密码已更新'
    newPwd.username = ''
    newPwd.password = ''
    log('🔑 修改了管理员密码')
    setTimeout(() => { pwdMsg.value = '' }, 3000)
  } catch {
    pwdMsg.value = '保存失败'
  }
}

// ─── Articles state ───
const articleView = ref('list') // 'list' | 'edit'
const editingArticle = reactive({ id: '', title: '', content: '', published: false })
const articlePreview = ref(false)

const articlesTotal = computed(() => store.articles.length)
const articlesPublished = computed(() => store.articles.filter(a => a.published).length)

const handleNewArticle = () => {
  addArticle('未命名文章', '')
  const article = store.articles[store.articles.length - 1]
  editingArticle.id = article.id
  editingArticle.title = article.title
  editingArticle.content = article.content
  editingArticle.published = article.published
  articleView.value = 'edit'
  log('➕ 新建文章')
}

const handleEditArticle = (article) => {
  editingArticle.id = article.id
  editingArticle.title = article.title
  editingArticle.content = article.content
  editingArticle.published = article.published
  articleView.value = 'edit'
}

const handleSaveArticle = () => {
  if (!editingArticle.id) return
  pushUndo('articles', getArticlesSnapshot(), '保存文章')
  updateArticle(editingArticle.id, {
    title: editingArticle.title,
    content: editingArticle.content,
    published: editingArticle.published
  })
  log(`✏️ 保存文章「${editingArticle.title}」`)
  articleView.value = 'list'
}

const handleDeleteArticle = (id) => {
  const article = getArticleById(id)
  if (!confirm(`确定删除文章「${article?.title}」？`)) return
  pushUndo('articles', getArticlesSnapshot(), `删除文章「${article?.title}」`)
  deleteArticle(id)
  log(`🗑️ 删除文章「${article?.title}」`)
  if (editingArticle.id === id) articleView.value = 'list'
}

const handleTogglePublish = (article) => {
  pushUndo('articles', getArticlesSnapshot(), article.published ? '取消发布' : '发布文章')
  updateArticle(article.id, { published: !article.published })
  log(article.published ? `📤 发布文章「${article.title}」` : `📥 取消发布「${article.title}」`)
}

const renderArticlePreview = () => {
  return editingArticle.content ? marked(editingArticle.content, { breaks: true, gfm: true }) : '<p style="color:#94a3b8">暂无内容</p>'
}

const isArticleInNav = computed(() => {
  if (!editingArticle.id) return false
  const link = '#article:' + editingArticle.id
  return store.navCategories.some(c => c.links.some(l => l.url === link))
})

const addArticleToNav = () => {
  if (!editingArticle.id || !editingArticle.title) return
  const link = '#article:' + editingArticle.id
  // Find "万物归一" category (id: 1)
  const wanyi = store.navCategories.find(c => c.id === 1 || c.title === '万物归一')
  if (wanyi) {
    addNavLink(wanyi.id, editingArticle.title, link)
    log(`🧭 已添加「${editingArticle.title}」到导航`)
  }
}

const removeArticleFromNav = () => {
  if (!editingArticle.id) return
  const link = '#article:' + editingArticle.id
  for (const cat of store.navCategories) {
    const idx = cat.links.findIndex(l => l.url === link)
    if (idx >= 0) {
      deleteNavLink(cat.id, idx)
      log(`🧭 已从导航移除「${editingArticle.title}」`)
      return
    }
  }
}

// ─── Undo System ───
const undoStack = ref([])
const pushUndo = (type, snapshot, desc) => {
  undoStack.value.unshift({ type, snapshot, desc, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) })
  if (undoStack.value.length > 10) undoStack.value.pop()
}
const handleUndo = (item) => {
  if (item.type === 'nav') restoreNavSnapshot(item.snapshot)
  else if (item.type === 'news') restoreNewsSnapshot(item.snapshot)
  else if (item.type === 'mac') restoreMacSnapshot(item.snapshot)
  else if (item.type === 'articles') restoreArticlesSnapshot(item.snapshot)
  undoStack.value = undoStack.value.filter(u => u !== item)
  log(`↩️ 撤销: ${item.desc}`)
}

// ─── Action log ───
const actionLog = ref(JSON.parse(localStorage.getItem('yihao_action_log') || '[]'))
const log = (msg) => {
  const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  actionLog.value.unshift({ time, msg, date: new Date().toISOString().slice(0, 10) })
  if (actionLog.value.length > 50) actionLog.value.pop()
  localStorage.setItem('yihao_action_log', JSON.stringify(actionLog.value.slice(0, 20)))
}

// ─── Global Search (admin) ───
const globalSearch = ref('')
const globalSearchOpen = ref(false)
const globalSearchResults = computed(() => {
  const kw = globalSearch.value.toLowerCase().trim()
  if (!kw) return { nav: [], news: [] }
  const nav = []
  store.navCategories.forEach(cat => {
    cat.links.forEach(link => {
      if (link.name.toLowerCase().includes(kw) || link.url.toLowerCase().includes(kw)) {
        nav.push({ cat: cat.title, name: link.name, catId: cat.id })
      }
    })
  })
  const news = []
  store.timelineItems.forEach(group => {
    group.items.forEach(item => {
      if (item.title.toLowerCase().includes(kw) || (item.desc || []).some(d => d.toLowerCase().includes(kw))) {
        news.push({ date: group.date, title: item.title })
      }
    })
  })
  return { nav: nav.slice(0, 5), news: news.slice(0, 5) }
})
const globalTotal = computed(() => globalSearchResults.value.nav.length + globalSearchResults.value.news.length)
const goNavFromSearch = (result) => { activeTab.value = 'nav'; selectedCatId.value = result.catId; globalSearch.value = ''; globalSearchOpen.value = false }
const goNewsFromSearch = (result) => { activeTab.value = 'news'; selectedDate.value = result.date; globalSearch.value = ''; globalSearchOpen.value = false }
const closeGlobalSearch = () => { globalSearchOpen.value = false }

// ─── Computed ───
const filteredCategories = computed(() => {
  const kw = navSearch.value.toLowerCase().trim()
  if (!kw) return store.navCategories
  return store.navCategories.filter(c =>
    c.title.toLowerCase().includes(kw) ||
    c.links.some(l => l.name.toLowerCase().includes(kw))
  )
})

const selectedCat = computed(() => store.navCategories.find(c => c.id === selectedCatId.value))
const selectedGroup = computed(() => store.timelineItems.find(g => g.date === selectedDate.value))

const navTotalLinks = computed(() => store.navCategories.reduce((s, c) => s + c.links.length, 0))
const newsTotalItems = computed(() => store.timelineItems.reduce((s, g) => s + g.items.length, 0))
const emptyCatCount = computed(() => store.navCategories.filter(c => c.links.length === 0).length)

// Enhanced stats
const statsData = computed(() => {
  const allDates = store.timelineItems.map(g => g.date).sort()
  const latestNews = allDates.length ? allDates[allDates.length - 1] : '-'
  const earliestNews = allDates.length ? allDates[0] : '-'
  const avgLinksPerCat = store.navCategories.length ? (navTotalLinks.value / store.navCategories.length).toFixed(1) : 0
  const avgItemsPerDay = store.timelineItems.length ? (newsTotalItems.value / store.timelineItems.length).toFixed(1) : 0
  return { latestNews, earliestNews, avgLinksPerCat, avgItemsPerDay }
})

// Group news by month
const groupedByMonth = computed(() => {
  const groups = {}
  store.timelineItems.forEach(g => {
    const month = g.date.slice(0, 7)
    if (!groups[month]) groups[month] = []
    groups[month].push(g)
  })
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
})

const selectCat = (id) => { selectedCatId.value = id }
const selectDate = (date) => { selectedDate.value = date }

// ─── Drag & Drop (Categories) ───
const dragCatIndex = ref(null)
const onCatDragStart = (e, idx) => { dragCatIndex.value = idx; e.dataTransfer.effectAllowed = 'move' }
const onCatDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
const onCatDrop = (e, toIdx) => {
  e.preventDefault()
  if (dragCatIndex.value !== null && dragCatIndex.value !== toIdx) {
    reorderNavCategories(dragCatIndex.value, toIdx)
    log('拖拽调整分类顺序')
  }
  dragCatIndex.value = null
}

// ─── Drag & Drop (Links) ───
const dragLinkIndex = ref(null)
const onLinkDragStart = (e, idx) => { dragLinkIndex.value = idx; e.dataTransfer.effectAllowed = 'move' }
const onLinkDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
const onLinkDrop = (e, toIdx) => {
  e.preventDefault()
  if (dragLinkIndex.value !== null && dragLinkIndex.value !== toIdx && selectedCatId.value) {
    reorderNavLinks(selectedCatId.value, dragLinkIndex.value, toIdx)
    log('拖拽调整链接顺序')
  }
  dragLinkIndex.value = null
}

// ─── Nav handlers ───
const startEditCat = (cat) => { editingCat.id = cat.id; editingCat.title = cat.title }
const saveEditCat = () => {
  if (editingCat.title.trim()) {
    pushUndo('nav', getNavSnapshot(), '编辑分类')
    updateNavCategoryTitle(editingCat.id, editingCat.title.trim())
    log(`修改分类「${editingCat.title.trim()}」`)
  }
  editingCat.id = null
}
const cancelEditCat = () => { editingCat.id = null }
const handleAddCat = () => {
  if (newCatTitle.value.trim()) {
    pushUndo('nav', getNavSnapshot(), '新增分类')
    addNavCategory(newCatTitle.value.trim())
    log(`新增分类「${newCatTitle.value.trim()}」`)
    const newId = store.navCategories[store.navCategories.length - 1]?.id
    if (newId) selectedCatId.value = newId
    newCatTitle.value = ''
    showAddCat.value = false
  }
}
const handleDeleteCat = (id) => {
  const cat = store.navCategories.find(c => c.id === id)
  if (cat && confirm(`确认删除分类「${cat.title}」及其全部 ${cat.links.length} 个链接？`)) {
    pushUndo('nav', getNavSnapshot(), `删除分类「${cat.title}」`)
    log(`删除分类「${cat.title}」`)
    deleteNavCategory(id)
    if (selectedCatId.value === id) selectedCatId.value = store.navCategories[0]?.id || null
  }
}
const startAddLink = () => { newLink.catId = selectedCatId.value; newLink.name = ''; newLink.url = '' }
const saveAddLink = () => {
  if (newLink.name.trim() && newLink.url.trim()) {
    pushUndo('nav', getNavSnapshot(), '新增链接')
    addNavLink(newLink.catId, newLink.name.trim(), newLink.url.trim())
    log(`新增链接「${newLink.name.trim()}」`)
    newLink.catId = null; newLink.name = ''; newLink.url = ''
  }
}
const startEditLink = (idx, link) => {
  editingLink.catId = selectedCatId.value; editingLink.index = idx
  editingLink.name = link.name; editingLink.url = link.url
}
const saveEditLink = () => {
  if (editingLink.name.trim() && editingLink.url.trim()) {
    pushUndo('nav', getNavSnapshot(), '编辑链接')
    updateNavLink(editingLink.catId, editingLink.index, editingLink.name.trim(), editingLink.url.trim())
    log(`修改链接「${editingLink.name.trim()}」`)
  }
  editingLink.catId = null; editingLink.index = -1
}
const cancelEditLink = () => { editingLink.catId = null; editingLink.index = -1 }

// ─── News handlers ───
const handleAddGroup = () => {
  if (newGroupDate.value) {
    pushUndo('news', getNewsSnapshot(), '新增日期')
    addNewsGroup(newGroupDate.value)
    log(`新增日期「${newGroupDate.value}」`)
    selectedDate.value = newGroupDate.value
    newGroupDate.value = ''
    showAddGroup.value = false
  }
}
const startEditGroupDate = (date) => { editingGroupDate.old = date; editingGroupDate.new = date }
const saveEditGroupDate = () => {
  if (editingGroupDate.new && editingGroupDate.new !== editingGroupDate.old) {
    pushUndo('news', getNewsSnapshot(), '修改日期')
    updateNewsGroupDate(editingGroupDate.old, editingGroupDate.new)
    log(`修改日期 ${editingGroupDate.old} → ${editingGroupDate.new}`)
    if (selectedDate.value === editingGroupDate.old) selectedDate.value = editingGroupDate.new
  }
  editingGroupDate.old = ''
}
const handleDeleteGroup = (date) => {
  const g = store.timelineItems.find(g => g.date === date)
  if (g && confirm(`确认删除日期「${date}」及其全部 ${g.items.length} 条讯息？`)) {
    pushUndo('news', getNewsSnapshot(), `删除日期「${date}」`)
    log(`删除日期「${date}」`)
    deleteNewsGroup(date)
    if (selectedDate.value === date) selectedDate.value = store.timelineItems[0]?.date || null
  }
}
const startAddItem = () => { newItem.date = selectedDate.value; newItem.title = ''; newItem.url = ''; newItem.desc = '' }
const saveAddItem = () => {
  if (newItem.title.trim()) {
    pushUndo('news', getNewsSnapshot(), '新增讯息')
    addNewsItem(newItem.date, { title: newItem.title.trim(), url: newItem.url.trim(), desc: newItem.desc.split('\n').filter(l => l.trim()) })
    log(`新增讯息「${newItem.title.trim()}」`)
    newItem.date = ''; newItem.title = ''; newItem.url = ''; newItem.desc = ''
  }
}
const startEditItem = (idx, item) => {
  editingItem.date = selectedDate.value; editingItem.index = idx
  editingItem.title = item.title; editingItem.url = item.url; editingItem.desc = item.desc.join('\n')
}
const saveEditItem = () => {
  if (editingItem.title.trim()) {
    pushUndo('news', getNewsSnapshot(), '编辑讯息')
    updateNewsItem(editingItem.date, editingItem.index, { title: editingItem.title.trim(), url: editingItem.url.trim(), desc: editingItem.desc.split('\n').filter(l => l.trim()) })
    log(`修改讯息「${editingItem.title.trim()}」`)
  }
  editingItem.date = ''; editingItem.index = -1
}
const cancelEditItem = () => { editingItem.date = ''; editingItem.index = -1 }

// ─── Data Cleanup ───
const handleClearEmptyCats = () => {
  const count = emptyCatCount.value
  if (count === 0) return alert('没有空分类需要清理')
  if (confirm(`确认清理 ${count} 个空分类？`)) {
    pushUndo('nav', getNavSnapshot(), `清理 ${count} 个空分类`)
    clearEmptyCategories()
    log(`清理了 ${count} 个空分类`)
  }
}
const handleClearAllIdeas = () => {
  if (confirm('确认清除所有随记？此操作不可恢复！')) {
    clearAllIdeas()
    log('清除所有随记')
    alert('所有随记已清除')
  }
}

// ─── Notes Export ───
const handleExportNotes = () => {
  const raw = localStorage.getItem('yihao_ideas')
  if (!raw) return alert('没有随记数据可导出')
  let ideas
  try { ideas = JSON.parse(raw) } catch { return alert('随记数据损坏，无法导出') }
  if (!Array.isArray(ideas) || ideas.length === 0) return alert('没有随记数据可导出')
  let md = '# 壹号栈随记导出\n\n'
  md += `> 导出时间：${new Date().toLocaleString('zh-CN')}\n> 共 ${ideas.length} 条记录\n\n---\n\n`
  ideas.forEach((idea, i) => {
    const pinned = idea.pinned ? ' 📌' : ''
    const tags = (idea.tags || []).map(t => '`' + t + '`').join(' ')
    md += `## ${i + 1}. ${new Date(idea.timestamp || idea.createdAt || Date.now()).toLocaleString('zh-CN')}${pinned}\n\n`
    md += idea.text + '\n\n'
    if (tags) md += tags + '\n\n'
    md += '---\n\n'
  })
  const blob = new Blob([md], { type: 'text/markdown' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `yihao-notes-${new Date().toISOString().slice(0, 10)}.md`
  a.click()
  log('导出随记为 Markdown')
}

// ─── Data tools ───
const fileInput = ref(null)
const handleExport = () => {
  const blob = new Blob([exportAllData()], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `yihao-data-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  localStorage.setItem('yihao_last_export', Date.now().toString())
  log('导出数据包')
}

// ─── Backup Reminder ───
const backupReminder = computed(() => {
  const lastExport = parseInt(localStorage.getItem('yihao_last_export') || '0')
  if (!lastExport) {
    // Never exported
    const totalData = store.navCategories.length + store.timelineItems.length
    if (totalData > 5) return { level: 'warn', msg: '您还没有导出过数据备份，建议定期导出以防数据丢失。', days: null }
    return null
  }
  const daysSince = Math.floor((Date.now() - lastExport) / (1000 * 60 * 60 * 24))
  if (daysSince >= 30) return { level: 'danger', msg: `距上次导出已 ${daysSince} 天，强烈建议立即备份数据！`, days: daysSince }
  if (daysSince >= 14) return { level: 'warn', msg: `距上次导出已 ${daysSince} 天，建议导出数据备份。`, days: daysSince }
  if (daysSince >= 7) return { level: 'info', msg: `距上次导出已 ${daysSince} 天，可以考虑备份。`, days: daysSince }
  return null
})

const dismissBackup = () => {
  sessionStorage.setItem('yihao_backup_dismissed', '1')
}

const showBackupReminder = computed(() => {
  if (sessionStorage.getItem('yihao_backup_dismissed')) return false
  return backupReminder.value !== null
})
const handleImport = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      pushUndo('nav', getNavSnapshot(), '导入数据(导航)')
      pushUndo('news', getNewsSnapshot(), '导入数据(讯息)')
      importAllData(ev.target.result); alert('数据导入成功！'); log('导入数据包')
    } catch { alert('导入失败') }
  }
  reader.readAsText(file)
  e.target.value = ''
}

// ─── Build & Deploy ───
const building = ref(false)
const handleBuild = async () => {
  building.value = true
  const data = exportAllData()

  // Try to POST to dev server (direct write to public/data.json)
  try {
    const res = await fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data
    })
    if (res.ok) {
      building.value = false
      log('✅ public/data.json 已自动更新！运行 ./deploy.sh 即可发布')
      return
    }
  } catch {
    // Not in dev mode, fall back to download
  }

  // Fallback: download file
  const blob = new Blob([data], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'data.json'
  a.click()
  building.value = false
  log('⬇️ data.json 已下载 → 放入 public/ 目录 → 运行 ./deploy.sh')
}

// ─── Nav Icon Customization ───
const navIconTabs = [
  { key: 'home', label: '首页', options: ['🏠', '🏡', '🏘️', '🏰', '🏕️', '🌆', '🌇', '🌃', '🛖', '🏢'] },
  { key: 'nav', label: '导航', options: ['🧭', '🗺️', '🌐', '🔗', '📡', '🧩', '📌', '🎯', '🔮', '⚓'] },
  { key: 'news', label: '讯息', options: ['📰', '📋', '📜', '📝', '📡', '💬', '🔔', '📣', '🗞️', '🏷️'] },
  { key: 'notes', label: '随记', options: ['✏️', '📝', '📒', '📔', '🖊️', '✍️', '💡', '📌', '🗒️', '🧠'] },
]
const navIcons = ref(JSON.parse(localStorage.getItem('yihao_nav_icons') || '{}'))

const setNavIcon = (key, emoji) => {
  if (navIcons.value[key] === emoji) {
    delete navIcons.value[key]
  } else {
    navIcons.value[key] = emoji
  }
  localStorage.setItem('yihao_nav_icons', JSON.stringify(navIcons.value))
  log(`导航栏「${navIconTabs.find(t => t.key === key)?.label}」图标已更换为 ${navIcons.value[key] || '(默认)'}`)
}

const resetNavIcons = () => {
  if (!confirm('确认恢复所有导航栏图标为默认？')) return
  navIcons.value = {}
  localStorage.removeItem('yihao_nav_icons')
  log('导航栏图标已恢复默认')
}

const hasCustomIcons = computed(() => Object.keys(navIcons.value).length > 0)

// ─── Auto-save: warn before leaving ───
const handleBeforeUnload = (e) => {
  if (newLink.name || newItem.title || batchImportText.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}
onMounted(() => { window.addEventListener('beforeunload', handleBeforeUnload) })
onUnmounted(() => { window.removeEventListener('beforeunload', handleBeforeUnload) })
</script>

<template>
  <div class="admin-page" ref="contentRef">
    <!-- ═══ Top Bar ═══ -->
    <div class="admin-topbar">
      <div class="admin-topbar-left">
        <h1 class="admin-logo">壹号栈后台管理</h1>
      </div>
      <div class="admin-topbar-center">
        <button :class="['admin-tab', { active: activeTab === 'overview' }]" @click="activeTab = 'overview'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          总览
        </button>
        <button :class="['admin-tab', { active: activeTab === 'nav' }]" @click="activeTab = 'nav'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
          导航
          <span class="admin-tab-count">{{ store.navCategories.length }}</span>
        </button>
        <button :class="['admin-tab', { active: activeTab === 'news' }]" @click="activeTab = 'news'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2z"/><line x1="10" y1="6" x2="18" y2="6"/><line x1="10" y1="10" x2="18" y2="10"/></svg>
          讯息
          <span class="admin-tab-count">{{ newsTotalItems }}</span>
        </button>
        <button :class="['admin-tab', { active: activeTab === 'mac' }]" @click="activeTab = 'mac'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 7.5V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v1.5"/><rect x="4" y="7.5" width="16" height="12.5" rx="2"/><line x1="12" y1="12" x2="12" y2="12.01"/></svg>
          Mac
          <span class="admin-tab-count">{{ macTotalItems }}</span>
        </button>
        <button :class="['admin-tab', { active: activeTab === 'articles' }]" @click="activeTab = 'articles'; articleView = 'list'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          文章
          <span class="admin-tab-count">{{ articlesTotal }}</span>
        </button>
        <button :class="['admin-tab', { active: activeTab === 'help' }]" @click="activeTab = 'help'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          帮助
        </button>
      </div>
      <div class="admin-topbar-right">
        <!-- Admin Global Search -->
        <div class="admin-global-search">
          <div class="uni-search uni-search-compact">
            <div class="uni-search-wrapper">
              <svg class="uni-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input type="text" placeholder="搜索全站..." v-model="globalSearch" class="uni-search-input" @focus="globalSearchOpen = true" />
              <button v-if="globalSearch" class="uni-search-clear" @click="globalSearch = ''; globalSearchOpen = false">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          <div v-if="globalSearchOpen && globalSearch.trim()" class="admin-search-dropdown">
            <div v-if="globalTotal === 0" class="admin-search-empty">未找到匹配结果</div>
            <template v-if="globalSearchResults.nav.length">
              <div class="admin-search-label">导航</div>
              <div v-for="(r, i) in globalSearchResults.nav" :key="'n'+i" class="admin-search-item" @click="goNavFromSearch(r)">
                <span class="admin-search-badge admin-search-badge-nav">导航</span>
                <strong>{{ r.name }}</strong>
                <small>{{ r.cat }}</small>
              </div>
            </template>
            <template v-if="globalSearchResults.news.length">
              <div class="admin-search-label">讯息</div>
              <div v-for="(r, i) in globalSearchResults.news" :key="'w'+i" class="admin-search-item" @click="goNewsFromSearch(r)">
                <span class="admin-search-badge admin-search-badge-news">讯息</span>
                <strong>{{ r.title }}</strong>
                <small>{{ r.date }}</small>
              </div>
            </template>
          </div>
        </div>

        <button class="admin-btn admin-btn-primary" @click="handleBuild" :disabled="building" title="点击生成数据 → 运行 ./deploy.sh 一键发布">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          {{ building ? '生成中...' : '生成网站' }}
        </button>
        <button class="admin-btn admin-btn-ghost" @click="handleExport" title="导出数据">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          导出
        </button>
        <button class="admin-btn admin-btn-ghost" @click="fileInput?.click()" title="导入数据">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          导入
        </button>
        <input ref="fileInput" type="file" accept=".json" style="display:none" @change="handleImport" />
      </div>
    </div>

    <!-- ═══ Main Content ═══ -->
    <div class="admin-main">

      <!-- ── OVERVIEW ── -->
      <template v-if="activeTab === 'overview'">
        <div class="admin-overview">
          <div class="admin-overview-header">
            <h2>站点总览</h2>
            <span class="admin-overview-date">{{ new Date().toLocaleDateString('zh-CN') }}</span>
          </div>

          <!-- Backup Reminder -->
          <div v-if="showBackupReminder" :class="['backup-banner', 'backup-banner-' + backupReminder.level]">
            <div class="backup-banner-icon">{{ backupReminder.level === 'danger' ? '🚨' : backupReminder.level === 'warn' ? '⚠️' : '💾' }}</div>
            <div class="backup-banner-text">{{ backupReminder.msg }}</div>
            <div class="backup-banner-actions">
              <button class="backup-banner-btn" @click="handleExport">立即导出</button>
              <button class="backup-banner-dismiss" @click="dismissBackup">稍后提醒</button>
            </div>
          </div>

          <!-- Stats grid -->
          <div class="admin-stats-grid">
            <div class="admin-stat-card">
              <div class="admin-stat-icon admin-stat-icon-nav">🧭</div>
              <div class="admin-stat-info">
                <div class="admin-stat-num">{{ store.navCategories.length }}</div>
                <div class="admin-stat-label">导航分类</div>
              </div>
              <div class="admin-stat-sub">平均 {{ statsData.avgLinksPerCat }} 链接/分类</div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-icon admin-stat-icon-link">🔗</div>
              <div class="admin-stat-info">
                <div class="admin-stat-num">{{ navTotalLinks }}</div>
                <div class="admin-stat-label">导航链接</div>
              </div>
              <div class="admin-stat-sub" v-if="emptyCatCount > 0">⚠️ {{ emptyCatCount }} 个空分类</div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-icon admin-stat-icon-news">📰</div>
              <div class="admin-stat-info">
                <div class="admin-stat-num">{{ store.timelineItems.length }}</div>
                <div class="admin-stat-label">讯息天数</div>
              </div>
              <div class="admin-stat-sub">{{ statsData.earliestNews }} ~ {{ statsData.latestNews }}</div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-icon admin-stat-icon-item">📝</div>
              <div class="admin-stat-info">
                <div class="admin-stat-num">{{ newsTotalItems }}</div>
                <div class="admin-stat-label">讯息条数</div>
              </div>
              <div class="admin-stat-sub">平均 {{ statsData.avgItemsPerDay }} 条/天</div>
            </div>
          </div>

          <!-- Quick actions + Activity log + Undo -->
          <div class="admin-overview-grid">
            <div class="admin-panel-card">
              <h3 class="admin-panel-title">快捷操作</h3>
              <div class="admin-quick-actions">
                <button class="admin-quick-btn" @click="activeTab = 'nav'; showAddCat = true">
                  <span>+ 新分类</span>
                </button>
                <button class="admin-quick-btn" @click="activeTab = 'news'; showAddGroup = true">
                  <span>+ 新日期</span>
                </button>
                <button class="admin-quick-btn" @click="handleBuild">
                  <span>📦 生成网站</span>
                </button>
                <button class="admin-quick-btn" @click="handleExport">
                  <span>💾 导出备份</span>
                </button>
                <button class="admin-quick-btn" @click="handleExportNotes">
                  <span>📄 导出随记</span>
                </button>
                <button class="admin-quick-btn" @click="handleClearEmptyCats" :disabled="emptyCatCount === 0">
                  <span>🧹 清理空分类</span>
                </button>
                <button class="admin-quick-btn admin-quick-btn-danger" @click="handleClearAllIdeas">
                  <span>🗑️ 清除所有随记</span>
                </button>
              </div>
            </div>

            <!-- Nav Icon Settings -->
            <div class="admin-panel-card">
              <div class="admin-panel-card-head">
                <h3 class="admin-panel-title">🎨 导航栏图标</h3>
                <button v-if="hasCustomIcons" class="admin-btn admin-btn-xs admin-btn-ghost" @click="resetNavIcons" title="恢复默认图标">↺ 重置</button>
              </div>
              <p class="admin-panel-sub">点击图标更换底部导航栏的显示样式，再次点击取消选择</p>
              <div class="nav-icon-grid">
                <div v-for="tab in navIconTabs" :key="tab.key" class="nav-icon-card">
                  <div class="nav-icon-card-head">
                    <span class="nav-icon-current" :class="{ 'nav-icon-custom': navIcons[tab.key] }">{{ navIcons[tab.key] || '●' }}</span>
                    <span class="nav-icon-card-label">{{ tab.label }}</span>
                  </div>
                  <div class="nav-icon-options">
                    <button
                      v-for="emoji in tab.options"
                      :key="emoji"
                      :class="['nav-icon-opt', { active: navIcons[tab.key] === emoji }]"
                      @click="setNavIcon(tab.key, emoji)"
                    >{{ emoji }}</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Undo History -->
            <div class="admin-panel-card" v-if="undoStack.length > 0">
              <h3 class="admin-panel-title">撤销历史 <span class="admin-panel-badge">{{ undoStack.length }}</span></h3>
              <div class="admin-log-list">
                <div v-for="(item, i) in undoStack" :key="'u'+i" class="admin-log-item admin-log-item-undo">
                  <div class="admin-log-undo-info">
                    <span class="admin-log-msg">{{ item.desc }}</span>
                    <span class="admin-log-time">{{ item.time }}</span>
                  </div>
                  <button class="admin-btn admin-btn-xs admin-btn-warn" @click="handleUndo(item)">↩️ 撤销</button>
                </div>
              </div>
              <div class="help-tip" style="margin-top:8px;font-size:12px;">
                <strong>⚠️</strong> 最多保留 10 步撤销记录
              </div>
            </div>

            <div class="admin-panel-card">
              <h3 class="admin-panel-title">操作日志 <span class="admin-panel-badge">{{ actionLog.length }}</span></h3>
              <div class="admin-log-list">
                <div v-if="actionLog.length === 0" class="admin-log-empty">暂无操作记录</div>
                <div v-for="(item, i) in actionLog" :key="i" class="admin-log-item">
                  <span class="admin-log-time">{{ item.time }}</span>
                  <span class="admin-log-msg">{{ item.msg }}</span>
                </div>
              </div>
              <button v-if="actionLog.length > 0" class="admin-btn admin-btn-xs admin-btn-ghost" style="margin-top:8px;" @click="actionLog = []; localStorage.removeItem('yihao_action_log')">清除日志</button>
            </div>

            <div class="admin-panel-card">
              <h3 class="admin-panel-title">修改密码</h3>
              <div class="admin-pwd-form">
                <input v-model="newPwd.username" class="admin-input admin-input-sm" placeholder="新账号" />
                <input v-model="newPwd.password" type="password" class="admin-input admin-input-sm" placeholder="新密码" />
                <button class="admin-btn admin-btn-primary admin-btn-sm" @click="handleChangePwd" :disabled="!newPwd.username.trim() || !newPwd.password">保存</button>
              </div>
              <p v-if="pwdMsg" class="admin-pwd-msg">{{ pwdMsg }}</p>
            </div>
          </div>
        </div>
      </template>

      <!-- ── NAV: Sidebar + Detail ── -->
      <template v-if="activeTab === 'nav'">
        <aside class="admin-sidebar">
          <div class="admin-sidebar-search">
            <input class="admin-search" type="text" placeholder="搜索分类..." v-model="navSearch" />
            <button class="admin-btn admin-btn-primary admin-btn-sm" @click="showAddCat = !showAddCat">+</button>
          </div>
          <div v-if="showAddCat" class="admin-sidebar-add">
            <input class="admin-input admin-input-sm" v-model="newCatTitle" placeholder="新分类名称" @keyup.enter="handleAddCat" autofocus />
            <div class="admin-sidebar-add-btns">
              <button class="admin-btn admin-btn-xs admin-btn-primary" @click="handleAddCat">确定</button>
              <button class="admin-btn admin-btn-xs admin-btn-ghost" @click="showAddCat = false">取消</button>
            </div>
          </div>
          <div class="admin-sidebar-list">
            <div
              v-for="(cat, idx) in filteredCategories" :key="cat.id"
              :class="['admin-sidebar-item', { active: selectedCatId === cat.id, 'drag-over': dragCatIndex !== null && dragCatIndex !== idx }]"
              @click="selectCat(cat.id)"
              draggable="true"
              @dragstart="onCatDragStart($event, idx)"
              @dragover="onCatDragOver"
              @drop="onCatDrop($event, idx)"
              @dragend="dragCatIndex = null"
            >
              <div class="admin-sidebar-item-drag">⠿</div>
              <div class="admin-sidebar-item-info">
                <span class="admin-sidebar-item-title">{{ cat.title }}</span>
                <span class="admin-sidebar-item-badge">{{ cat.links.length }}</span>
              </div>
              <div class="admin-sidebar-item-actions" @click.stop>
                <button class="admin-icon-btn" @click="startEditCat(cat)" title="编辑">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="admin-icon-btn admin-icon-btn-danger" @click="handleDeleteCat(cat.id)" title="删除">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main class="admin-detail">
          <div v-if="editingCat.id" class="admin-detail-edit-bar">
            <input class="admin-input" v-model="editingCat.title" @keyup.enter="saveEditCat" />
            <button class="admin-btn admin-btn-primary admin-btn-sm" @click="saveEditCat">保存</button>
            <button class="admin-btn admin-btn-ghost admin-btn-sm" @click="cancelEditCat">取消</button>
          </div>

          <template v-if="selectedCat">
            <div class="admin-detail-header">
              <h2 class="admin-detail-title">{{ selectedCat.title }}</h2>
              <span class="admin-detail-subtitle">{{ selectedCat.links.length }} 个链接</span>
              <div class="admin-detail-actions">
                <button class="admin-btn admin-btn-ghost admin-btn-sm" @click="showBatchImport = !showBatchImport" title="批量导入链接">📋 批量导入</button>
                <button class="admin-btn admin-btn-primary admin-btn-sm" @click="startAddLink">+ 添加链接</button>
              </div>
            </div>

            <!-- Batch Import -->
            <div v-if="showBatchImport" class="admin-add-form admin-batch-form">
              <div class="admin-add-form-title">📋 批量导入链接</div>
              <p class="admin-batch-hint">每行一个链接，支持格式：<code>名称 URL</code>、<code>名称,URL</code>、<code>名称|URL</code>，或直接粘贴 URL</p>
              <textarea class="admin-textarea" v-model="batchImportText" placeholder="Google https://google.com&#10;GitHub,https://github.com&#10;https://twitter.com" rows="8" />
              <div v-if="batchImportText" class="admin-batch-preview">
                <div class="admin-batch-count">解析到 <strong>{{ batchValidCount }}</strong> 个有效链接（共 {{ parsedBatchLinks.length }} 行）</div>
                <div class="admin-batch-links">
                  <div v-for="(link, i) in parsedBatchLinks" :key="i" :class="['admin-batch-link', { invalid: !link.valid }]">
                    <span class="admin-batch-link-name">{{ link.name }}</span>
                    <span class="admin-batch-link-url">{{ link.url }}</span>
                  </div>
                </div>
              </div>
              <div class="admin-add-form-actions">
                <button class="admin-btn admin-btn-primary" @click="handleBatchImport" :disabled="batchValidCount === 0">导入 {{ batchValidCount }} 个链接</button>
                <button class="admin-btn admin-btn-ghost" @click="showBatchImport = false; batchImportText = ''">取消</button>
              </div>
            </div>

            <div v-if="newLink.catId === selectedCatId" class="admin-add-form">
              <div class="admin-add-form-title">添加新链接</div>
              <div class="admin-add-form-row">
                <div class="admin-add-form-field">
                  <label>名称</label>
                  <input class="admin-input" v-model="newLink.name" placeholder="链接名称" />
                </div>
                <div class="admin-add-form-field">
                  <label>链接</label>
                  <input class="admin-input" v-model="newLink.url" placeholder="https://..." @keyup.enter="saveAddLink" />
                </div>
              </div>
              <div class="admin-add-form-actions">
                <button class="admin-btn admin-btn-primary" @click="saveAddLink">添加链接</button>
                <button class="admin-btn admin-btn-ghost" @click="newLink.catId = null">取消</button>
              </div>
            </div>

            <div class="admin-link-grid">
              <div
                v-for="(link, i) in selectedCat.links" :key="i"
                class="admin-link-card"
                draggable="true"
                @dragstart="onLinkDragStart($event, i)"
                @dragover="onLinkDragOver"
                @drop="onLinkDrop($event, i)"
                @dragend="dragLinkIndex = null"
              >
                <div class="admin-link-card-drag">⠿</div>
                <template v-if="editingLink.catId === selectedCatId && editingLink.index === i">
                  <input class="admin-input admin-input-sm" v-model="editingLink.name" placeholder="名称" />
                  <input class="admin-input admin-input-sm" v-model="editingLink.url" placeholder="URL" />
                  <div class="admin-link-card-btns">
                    <button class="admin-btn admin-btn-xs admin-btn-primary" @click="saveEditLink">保存</button>
                    <button class="admin-btn admin-btn-xs admin-btn-ghost" @click="cancelEditLink">取消</button>
                  </div>
                </template>
                <template v-else>
                  <div class="admin-link-card-content">
                    <strong class="admin-link-card-name">{{ link.name }}</strong>
                    <span class="admin-link-card-url">{{ link.url }}</span>
                  </div>
                  <div class="admin-link-card-actions">
                    <button class="admin-icon-btn" @click="startEditLink(i, link)" title="编辑">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="admin-icon-btn admin-icon-btn-danger" @click="deleteNavLink(selectedCatId, i)" title="删除">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </template>

          <div v-else class="admin-detail-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            <p>从左侧选择一个分类开始编辑</p>
            <p class="admin-detail-empty-hint">💡 提示：拖拽分类可调整顺序</p>
          </div>
        </main>
      </template>

      <!-- ── NEWS: Sidebar + Detail ── -->
      <template v-if="activeTab === 'news'">
        <aside class="admin-sidebar">
          <div class="admin-sidebar-search">
            <span class="admin-sidebar-label">日期列表</span>
            <button class="admin-btn admin-btn-primary admin-btn-sm" @click="showAddGroup = !showAddGroup" :title="showAddGroup ? '收起' : '新增日期'">+</button>
          </div>

          <!-- Modern Add Date Panel -->
          <div v-if="showAddGroup" class="dp-panel">
            <!-- Quick date buttons -->
            <div class="dp-quick-row">
              <button class="dp-quick-btn" @click="pickQuick(offsetDate(-1))">昨天</button>
              <button class="dp-quick-btn dp-quick-btn-primary" @click="pickQuick(todayStr())">今天</button>
              <button class="dp-quick-btn" @click="pickQuick(offsetDate(1))">明天</button>
              <button class="dp-quick-btn" @click="pickQuick(offsetDate(2))">后天</button>
            </div>

            <!-- Calendar header -->
            <div class="dp-header">
              <button class="dp-nav-btn" @click="prevMonth">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span class="dp-header-title">{{ calHeader }}</span>
              <button class="dp-nav-btn" @click="nextMonth">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            <!-- Weekday headers -->
            <div class="dp-weekdays">
              <span v-for="w in weekdays" :key="w" class="dp-weekday">{{ w }}</span>
            </div>

            <!-- Date grid -->
            <div class="dp-grid">
              <button
                v-for="(cell, idx) in calDays"
                :key="idx"
                :class="['dp-cell', { 'dp-cell-other': !cell.current, 'dp-cell-today': cell.date === todayStr(), 'dp-cell-selected': cell.date === newGroupDate }]"
                :disabled="!cell.current"
                @click="cell.current && pickDate(cell.date)"
              >{{ cell.day }}</button>
            </div>

            <!-- Footer -->
            <div class="dp-footer">
              <button class="dp-footer-link" @click="calYear = new Date().getFullYear(); calMonth = new Date().getMonth()">回到本月</button>
              <button class="dp-footer-link dp-footer-link-cancel" @click="showAddGroup = false">取消</button>
            </div>
          </div>
          <div class="admin-sidebar-list">
            <template v-for="[month, groups] in groupedByMonth" :key="month">
              <div class="admin-sidebar-month">{{ month }}</div>
              <div
                v-for="group in groups" :key="group.date"
                :class="['admin-sidebar-item', { active: selectedDate === group.date }]"
                @click="selectDate(group.date)"
              >
                <div class="admin-sidebar-item-info">
                  <span class="admin-sidebar-item-title">{{ group.date.slice(5) }}</span>
                  <span class="admin-sidebar-item-badge">{{ group.items.length }}</span>
                </div>
                <div class="admin-sidebar-item-actions" @click.stop>
                  <button class="admin-icon-btn" @click="startEditGroupDate(group.date)" title="编辑日期">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="admin-icon-btn admin-icon-btn-danger" @click="handleDeleteGroup(group.date)" title="删除">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </aside>

        <main class="admin-detail">
          <!-- Hero Links Management -->
          <div class="admin-hero-links-section">
            <div class="admin-hero-links-header" @click="showHeroLinks = !showHeroLinks">
              <h3>讯息页顶部链接 <span class="admin-hero-links-count">{{ store.heroLinks.length }}</span></h3>
              <svg :style="{ transform: showHeroLinks ? 'rotate(180deg)' : '' }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div v-if="showHeroLinks" class="admin-hero-links-body">
              <div v-for="(link, i) in store.heroLinks" :key="i" class="admin-hero-link-item">
                <template v-if="editingHeroLink.index === i">
                  <input class="admin-input admin-input-sm" v-model="editingHeroLink.name" placeholder="名称" style="flex:1" />
                  <input class="admin-input admin-input-sm" v-model="editingHeroLink.url" placeholder="链接" style="flex:2" />
                  <button class="admin-btn admin-btn-xs admin-btn-primary" @click="saveEditHeroLink">保存</button>
                  <button class="admin-btn admin-btn-xs admin-btn-ghost" @click="editingHeroLink.index = -1">取消</button>
                </template>
                <template v-else>
                  <span class="admin-hero-link-name">{{ link.name }}</span>
                  <span class="admin-hero-link-url">{{ link.url }}</span>
                  <button class="admin-icon-btn" @click="startEditHeroLink(i)" title="编辑">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="admin-icon-btn admin-icon-btn-danger" @click="handleDeleteHeroLink(i)" title="删除">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </template>
              </div>
              <div class="admin-hero-link-item admin-hero-link-add">
                <input class="admin-input admin-input-sm" v-model="newHeroLink.name" placeholder="名称" style="flex:1" />
                <input class="admin-input admin-input-sm" v-model="newHeroLink.url" placeholder="https://..." style="flex:2" />
                <button class="admin-btn admin-btn-xs admin-btn-primary" @click="handleAddHeroLink">+ 添加</button>
              </div>
            </div>
          </div>

          <div v-if="editingGroupDate.old" class="admin-detail-edit-bar">
            <input class="admin-input" type="date" v-model="editingGroupDate.new" />
            <button class="admin-btn admin-btn-primary admin-btn-sm" @click="saveEditGroupDate">保存</button>
            <button class="admin-btn admin-btn-ghost admin-btn-sm" @click="editingGroupDate.old = ''">取消</button>
          </div>

          <template v-if="selectedGroup">
            <div class="admin-detail-header">
              <h2 class="admin-detail-title">{{ selectedGroup.date }}</h2>
              <span class="admin-detail-subtitle">{{ selectedGroup.items.length }} 条讯息</span>
              <button class="admin-btn admin-btn-primary admin-btn-sm" @click="startAddItem">+ 添加讯息</button>
            </div>

            <div v-if="newItem.date === selectedDate" class="admin-add-form">
              <div class="admin-add-form-title">添加新讯息</div>
              <div class="admin-add-form-row">
                <div class="admin-add-form-field">
                  <label>标题</label>
                  <input class="admin-input" v-model="newItem.title" placeholder="输入讯息标题" />
                </div>
                <div class="admin-add-form-field">
                  <label>链接</label>
                  <input class="admin-input" v-model="newItem.url" placeholder="https://..." />
                </div>
              </div>
              <div class="admin-add-form-field">
                <label>描述（每行一条）</label>
                <textarea class="admin-textarea" v-model="newItem.desc" placeholder="第一行描述&#10;第二行描述..." rows="4" />
              </div>
              <div class="admin-add-form-actions">
                <button class="admin-btn admin-btn-primary" @click="saveAddItem">添加讯息</button>
                <button class="admin-btn admin-btn-ghost" @click="newItem.date = ''">取消</button>
              </div>
            </div>

            <div class="admin-news-list">
              <div v-for="(item, i) in selectedGroup.items" :key="i" class="admin-news-card">
                <template v-if="editingItem.date === selectedDate && editingItem.index === i">
                  <input class="admin-input" v-model="editingItem.title" placeholder="标题" />
                  <input class="admin-input" v-model="editingItem.url" placeholder="URL" />
                  <textarea class="admin-textarea" v-model="editingItem.desc" placeholder="描述（每行一条）" rows="3" />
                  <div class="admin-add-form-actions">
                    <button class="admin-btn admin-btn-primary admin-btn-sm" @click="saveEditItem">保存</button>
                    <button class="admin-btn admin-btn-ghost admin-btn-sm" @click="cancelEditItem">取消</button>
                  </div>
                </template>
                <template v-else>
                  <div class="admin-news-card-head">
                    <h3 class="admin-news-card-title">{{ item.title }}</h3>
                    <div class="admin-link-card-actions">
                      <button class="admin-icon-btn" @click="startEditItem(i, item)" title="编辑">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button class="admin-icon-btn admin-icon-btn-danger" @click="deleteNewsItem(selectedDate, i)" title="删除">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                  <a class="admin-news-card-url" :href="item.url" target="_blank">{{ item.url }}</a>
                  <p v-for="(d, j) in item.desc" :key="j" class="admin-news-card-desc">{{ d }}</p>
                </template>
              </div>
            </div>
          </template>

          <div v-else class="admin-detail-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2z"/><line x1="10" y1="6" x2="18" y2="6"/><line x1="10" y1="10" x2="18" y2="10"/></svg>
            <p>从左侧选择一个日期开始编辑</p>
          </div>
        </main>
      </template>

      <!-- ── MAC ── -->
      <template v-if="activeTab === 'mac'">
        <div class="admin-mac">
          <!-- Sidebar: Header + Category Tabs -->
          <aside class="admin-mac-sidebar">
            <div class="admin-mac-header">
              <h2>🍎 Mac 管理</h2>
              <p>{{ store.macSections.length }} 个分类 · {{ macTotalItems }} 个工具</p>
            </div>
            <nav class="admin-mac-tabs">
              <button
                v-for="sec in store.macSections"
                :key="sec.id"
                :class="['admin-mac-tab', { active: activeMacSection === sec.id }]"
                @click="activeMacSection = sec.id"
              >
                <span class="admin-mac-tab-label">{{ sec.icon }} {{ sec.title }}</span>
                <span class="admin-mac-tab-count">{{ sec.items.length }}</span>
              </button>
            </nav>
          </aside>

          <!-- Main Content -->
          <main class="admin-mac-main">
            <div v-if="currentMacSection" class="admin-mac-content">
              <!-- Section title -->
              <div class="admin-mac-section-title">
                <span>{{ currentMacSection.icon }} {{ currentMacSection.title }}</span>
                <small>{{ currentMacSection.subtitle }}</small>
              </div>

              <!-- Add new item form -->
              <div class="admin-mac-add">
                <input v-model="newMacItem.name" placeholder="软件名称" class="admin-mac-input" />
                <input v-model="newMacItem.url" placeholder="链接 URL（可选）" class="admin-mac-input" />
                <input v-model="newMacItem.desc" placeholder="描述" class="admin-mac-input" />
                <div class="admin-mac-add-footer">
                  <input v-model="newMacItem.tags" placeholder="标签（逗号分隔）" class="admin-mac-input" />
                  <button class="admin-btn admin-btn-primary admin-btn-sm" @click="saveAddMacItem" :disabled="!newMacItem.name.trim()">添加</button>
                </div>
              </div>

              <!-- Items list -->
              <div v-if="currentMacSection.items.length > 0" class="admin-mac-list">
                <div
                  v-for="(item, idx) in currentMacSection.items"
                  :key="idx"
                  class="admin-mac-item"
                >
                  <!-- Edit mode -->
                  <template v-if="editingMacItem.sectionId === activeMacSection && editingMacItem.index === idx">
                    <div class="admin-mac-edit">
                      <input v-model="editingMacItem.name" class="admin-mac-input" placeholder="名称" />
                      <input v-model="editingMacItem.url" class="admin-mac-input" placeholder="链接" />
                      <input v-model="editingMacItem.desc" class="admin-mac-input" placeholder="描述" />
                      <div class="admin-mac-add-footer">
                        <input v-model="editingMacItem.tags" class="admin-mac-input" placeholder="标签" />
                        <div class="admin-mac-edit-actions">
                          <button class="admin-btn admin-btn-primary admin-btn-sm" @click="saveEditMacItem">保存</button>
                          <button class="admin-btn admin-btn-ghost admin-btn-sm" @click="editingMacItem.index = -1">取消</button>
                        </div>
                      </div>
                    </div>
                  </template>
                  <!-- Display mode -->
                  <template v-else>
                    <div class="admin-mac-item-body">
                      <strong>{{ item.name }}</strong>
                      <small>{{ item.desc.slice(0, 80) }}{{ item.desc.length > 80 ? '...' : '' }}</small>
                      <div v-if="item.tags?.length" class="admin-mac-item-tags">
                        <span v-for="t in item.tags" :key="t">{{ t }}</span>
                      </div>
                    </div>
                    <div class="admin-mac-item-actions">
                      <button class="admin-icon-btn" @click="startEditMacItem(activeMacSection, idx, item)" title="编辑">✏️</button>
                      <button class="admin-icon-btn" @click="handleDeleteMacItem(activeMacSection, idx)" title="删除">🗑️</button>
                    </div>
                  </template>
                </div>
              </div>
              <div v-else class="admin-mac-empty">
                <p>该分类下暂无软件，请在上方添加</p>
              </div>
            </div>
          </main>
        </div>
      </template>

      <!-- ── ARTICLES ── -->
      <template v-if="activeTab === 'articles'">
        <div class="admin-articles">
          <!-- List View -->
          <template v-if="articleView === 'list'">
            <div class="admin-articles-header">
              <div>
                <h2>文章管理</h2>
                <p>{{ articlesTotal }} 篇文章 · {{ articlesPublished }} 已发布</p>
              </div>
              <button class="admin-btn admin-btn-primary" @click="handleNewArticle">+ 新建文章</button>
            </div>
            <div class="admin-articles-list">
              <div v-if="!store.articles.length" class="admin-articles-empty">
                <p>还没有文章，点击上方按钮新建</p>
              </div>
              <div v-for="article in store.articles" :key="article.id" class="admin-article-row">
                <div class="admin-article-info">
                  <h3>{{ article.title }}</h3>
                  <div class="admin-article-meta">
                    <span :class="['admin-article-status', article.published ? 'published' : 'draft']">
                      {{ article.published ? '已发布' : '草稿' }}
                    </span>
                    <span class="admin-article-date">{{ new Date(article.updatedAt).toLocaleDateString('zh-CN') }}</span>
                    <span class="admin-article-words">{{ article.content.length }} 字</span>
                  </div>
                </div>
                <div class="admin-article-actions">
                  <button class="admin-btn admin-btn-xs admin-btn-ghost" @click="handleTogglePublish(article)">
                    {{ article.published ? '取消发布' : '发布' }}
                  </button>
                  <button class="admin-btn admin-btn-xs admin-btn-ghost" @click="handleEditArticle(article)">编辑</button>
                  <button class="admin-btn admin-btn-xs admin-btn-warn" @click="handleDeleteArticle(article.id)">删除</button>
                </div>
              </div>
            </div>
          </template>

          <!-- Edit View -->
          <template v-if="articleView === 'edit'">
            <div class="admin-article-editor">
              <div class="admin-article-editor-header">
                <button class="admin-btn admin-btn-ghost admin-btn-sm" @click="articleView = 'list'">← 返回列表</button>
                <div class="admin-article-editor-actions">
                  <label class="admin-article-publish-toggle">
                    <input type="checkbox" v-model="editingArticle.published" />
                    <span>{{ editingArticle.published ? '已发布' : '草稿' }}</span>
                  </label>
                  <button class="admin-btn admin-btn-ghost admin-btn-sm" @click="articlePreview = !articlePreview">
                    {{ articlePreview ? '编辑' : '预览' }}
                  </button>
                  <button v-if="isArticleInNav" class="admin-btn admin-btn-warn admin-btn-sm" @click="removeArticleFromNav">已在导航</button>
                  <button v-else class="admin-btn admin-btn-ghost admin-btn-sm" @click="addArticleToNav">+ 导航</button>
                  <button class="admin-btn admin-btn-primary admin-btn-sm" @click="handleSaveArticle">保存</button>
                </div>
              </div>
              <input v-model="editingArticle.title" class="admin-article-title-input" placeholder="文章标题" />
              <div class="admin-article-editor-body">
                <textarea v-if="!articlePreview" v-model="editingArticle.content" class="admin-article-textarea" placeholder="在此输入 Markdown 内容..."></textarea>
                <div v-else class="admin-article-preview article-body" v-html="renderArticlePreview()"></div>
              </div>
            </div>
          </template>
        </div>
      </template>

      <!-- ── HELP ── -->
      <template v-if="activeTab === 'help'">
        <div class="help-panel">
          <!-- Left Sidebar TOC -->
          <aside class="help-sidebar">
            <div class="help-sidebar-brand">
              <span class="help-sidebar-badge">使用手册</span>
              <h2>使用指南</h2>
            </div>
            <nav class="help-sidebar-nav">
              <a
                v-for="s in helpSections" :key="s.id"
                :class="['help-sidebar-link', { active: activeHelpSection === s.id }]"
                :href="'#' + s.id"
                @click.prevent="scrollToHelp(s.id)"
              >{{ s.icon }} {{ s.title }}</a>
            </nav>
          </aside>
          <!-- Right Content -->
          <div class="help-content" ref="helpContentRef" @scroll="onHelpScroll">
            <!-- Hero -->
            <div class="help-hero">
              <div class="help-hero-inner">
                <h1>壹号栈 使用指南</h1>
                <p>完整的功能说明与操作教程，帮助您快速管理网站内容</p>
              </div>
            </div>

            <!-- 1. 网站架构 -->
            <section :id="'h1'" class="help-section">
              <div class="help-section-head">
                <div class="help-section-badge badge-blue">🌐</div>
                <div>
                  <h2>网站架构</h2>
                  <p class="help-section-sub">壹号栈是一个单页应用（SPA），包含 4 个公开页面和 1 个隐藏管理后台</p>
                </div>
              </div>
              <div class="help-card-grid">
                <div class="help-page-card"><div class="help-page-icon">🏠</div><strong>首页</strong><span>网站门面，展示头像、简介、快速入口，点击标题「壹号栈」切换暗黑模式</span></div>
                <div class="help-page-card"><div class="help-page-icon">🧭</div><strong>导航</strong><span>收录的网站链接，按分类整理</span></div>
                <div class="help-page-card"><div class="help-page-icon">📰</div><strong>讯息</strong><span>时间线形式记录的资源、资讯和灵感</span></div>
                <div class="help-page-card"><div class="help-page-icon">✏️</div><strong>随记</strong><span>个人笔记，支持搜索、置顶、标签和排序</span></div>
                <div class="help-page-card"><div class="help-page-icon">⚙️</div><strong>管理后台</strong><span>隐藏页面，快捷键/URL参数/长按首页tab激活</span></div>
              </div>
              <div class="help-tip"><span class="help-tip-icon">💡</span> 管理后台默认隐藏。进入方式（任选其一）：① 快捷键 <kbd>Ctrl+Shift+A</kbd>（Mac: <kbd>⌘+Shift+A</kbd>）；② URL 加参数 <code>?admin=1</code>；③ 长按底部「首页」tab 3 秒；④ 控制台执行 <code>localStorage.setItem('yihao_admin','true')</code> 后刷新。</div>
              <div class="help-tip"><span class="help-tip-icon">🌙</span> 暗黑模式切换：点击首页标题「壹号栈」即可在浅色与深色之间切换，设置会自动保存到本地。</div>
            </section>

            <!-- 2. 导航管理 -->
            <section :id="'h2'" class="help-section">
              <div class="help-section-head">
                <div class="help-section-badge badge-pink">🧭</div>
                <div>
                  <h2>导航管理</h2>
                  <p class="help-section-sub">导航页用于收录各类网站链接，按分类组织。左侧分类列表，右侧链接详情。</p>
                </div>
              </div>
              <div class="help-two-col">
                <div class="help-col">
                  <h3>分类操作</h3>
                  <ul>
                    <li><strong>新增分类</strong>：点击左上角 <code>+</code> 按钮，输入分类名称后确定</li>
                    <li><strong>编辑分类</strong>：悬停分类项，点击编辑图标</li>
                    <li><strong>删除分类</strong>：点击删除图标（同时删除该分类下所有链接）</li>
                    <li><strong>搜索分类</strong>：在顶部搜索框输入关键词过滤</li>
                    <li><strong>拖拽排序</strong>：按住 ⠿ 手柄拖动调整顺序</li>
                  </ul>
                </div>
                <div class="help-col">
                  <h3>链接操作</h3>
                  <ul>
                    <li><strong>添加链接</strong>：选中分类，点击「+ 添加链接」</li>
                    <li><strong>批量导入</strong>：点击「📋 批量导入」，粘贴多行一键导入</li>
                    <li><strong>编辑链接</strong>：点击卡片编辑图标直接修改</li>
                    <li><strong>删除链接</strong>：点击卡片删除图标</li>
                    <li><strong>拖拽排序</strong>：按住 ⠿ 手柄拖动调整顺序</li>
                  </ul>
                </div>
              </div>
              <div class="help-tip"><span class="help-tip-icon">💡</span> 删除分类会同时删除其下所有链接，请谨慎操作。建议先导出备份。</div>
            </section>

            <!-- 3. 讯息管理 -->
            <section :id="'h3'" class="help-section">
              <div class="help-section-head">
                <div class="help-section-badge badge-purple">📰</div>
                <div>
                  <h2>讯息管理</h2>
                  <p class="help-section-sub">讯息页以时间线形式展示内容，左侧按月份分组，右侧显示当天的讯息列表。</p>
                </div>
              </div>
              <div class="help-two-col">
                <div class="help-col">
                  <h3>日期操作</h3>
                  <ul>
                    <li><strong>新增日期</strong>：点击左上角 <code>+</code>，选择日期后确定</li>
                    <li><strong>修改日期</strong>：点击日期旁的编辑图标修改</li>
                    <li><strong>删除日期</strong>：点击删除图标（同时删除该日期下所有讯息）</li>
                    <li><strong>月份分组</strong>：列表自动按「年-月」分组，降序排列</li>
                  </ul>
                </div>
                <div class="help-col">
                  <h3>讯息操作</h3>
                  <ul>
                    <li><strong>添加讯息</strong>：选中日期，点击「+ 添加讯息」</li>
                    <li><strong>标题</strong>：讯息的名称，必填</li>
                    <li><strong>链接</strong>：讯息的来源链接，必填</li>
                    <li><strong>描述</strong>：多行文本，每行一条描述信息，选填</li>
                  </ul>
                </div>
              </div>
              <div class="help-tip"><span class="help-tip-icon">🔗</span> 讯息页顶部的快捷链接（如「壹号导航」「大流量卡」等）可在右侧详情区顶部「讯息页顶部链接」面板中管理，支持新增、编辑、删除和自由扩展数量。</div>
            </section>

            <!-- 4. 随记管理 -->
            <section :id="'h9'" class="help-section">
              <div class="help-section-head">
                <div class="help-section-badge badge-green">✏️</div>
                <div>
                  <h2>随记管理</h2>
                  <p class="help-section-sub">随记页用于记录灵感、笔记和想法，支持 Markdown 语法和标签分类。</p>
                </div>
              </div>
              <div class="help-two-col">
                <div class="help-col">
                  <h3>基本操作</h3>
                  <ul>
                    <li><strong>添加随记</strong>：在输入框中输入内容，点击「保存随记」或按 <code>⌘+Enter</code></li>
                    <li><strong>Markdown</strong>：支持 Markdown 语法，渲染后显示格式化内容</li>
                    <li><strong>标签</strong>：在内容中使用 <code>#标签名</code> 添加标签</li>
                    <li><strong>删除</strong>：点击卡片上的删除图标，需确认</li>
                  </ul>
                </div>
                <div class="help-col">
                  <h3>高级功能</h3>
                  <ul>
                    <li><strong>置顶</strong>：点击置顶图标，置顶笔记始终显示在最前</li>
                    <li><strong>排序</strong>：支持「最新优先」「最早优先」「标签最多」三种排序</li>
                    <li><strong>筛选</strong>：点击「只看置顶」按钮筛选置顶笔记</li>
                    <li><strong>标签云</strong>：点击标签可按标签筛选，再次点击取消</li>
                    <li><strong>导出</strong>：在总览页点击「📄 导出随记」可导出为 Markdown 文件</li>
                    <li><strong>发布到讯息</strong>：点击卡片上的 📢 按钮，确认后可将笔记内容直接发布到讯息页当天的日期分组下，Markdown 符号会自动清除</li>
                  </ul>
                </div>
              </div>
              <div class="help-tip help-tip-warn"><span class="help-tip-icon">⚠️</span> 随记数据保存在浏览器本地（localStorage），清除浏览器数据会丢失。建议定期导出备份。</div>
            </section>

            <!-- 5. 数据备份与恢复 -->
            <section :id="'h4'" class="help-section">
              <div class="help-section-head">
                <div class="help-section-badge badge-yellow">💾</div>
                <div>
                  <h2>数据备份与恢复</h2>
                  <p class="help-section-sub">数据操作按钮位于后台管理顶部右侧</p>
                </div>
              </div>
              <div class="help-feature-list">
                <div class="help-feature-item"><div class="help-feature-dot dot-pink"></div><strong>📦 更新网站</strong><span>下载 data.json 文件，用于更新线上数据</span></div>
                <div class="help-feature-item"><div class="help-feature-dot dot-blue"></div><strong>⬇️ 导出</strong><span>导出完整数据为 JSON 文件，用于备份或迁移</span></div>
                <div class="help-feature-item"><div class="help-feature-dot dot-green"></div><strong>⬆️ 导入</strong><span>从 JSON 文件导入数据，恢复之前的备份</span></div>
              </div>
              <h3>撤销操作</h3>
              <p>总览页面会显示「撤销历史」面板，每个删除、编辑操作都可一键撤销，最多保留 <strong>10 步</strong>。</p>
              <div class="help-tip help-tip-warn"><span class="help-tip-icon">⚠️</span> 导入会覆盖当前所有数据！建议定期导出备份。</div>
            </section>

            <!-- 6. 更新网站 -->
            <section :id="'h5'" class="help-section">
              <div class="help-section-head">
                <div class="help-section-badge badge-pink">🚀</div>
                <div>
                  <h2>更新网站数据</h2>
                  <p class="help-section-sub">开发模式下点击按钮自动写入，一键部署脚本搞定发布</p>
                </div>
              </div>
              <div class="help-steps">
                <div class="help-step">
                  <span class="help-step-num">1</span>
                  <div class="help-step-body">
                    <strong>点击「生成网站」按钮</strong>
                    <p>开发模式下 <code>npm run dev</code>，点击按钮会<strong>自动写入</strong> <code>public/data.json</code>；生产模式下会下载文件，手动放到 <code>public/</code> 目录</p>
                  </div>
                </div>
                <div class="help-step">
                  <span class="help-step-num">2</span>
                  <div class="help-step-body">
                    <strong>运行一键部署脚本</strong>
                    <p>打开终端，运行 <code>./deploy.sh</code>，自动构建 + 提交 + 推送到 GitHub</p>
                  </div>
                </div>
              </div>
              <div class="help-code-block">
                <div class="help-code-header">一键部署（可自定义提交信息）</div>
                <code>cd ~/Desktop/2027网站<br/>./deploy.sh<br/># 或自定义提交信息：./deploy.sh "添加了新链接"</code>
              </div>
              <div class="help-two-col">
                <div class="help-col">
                  <h3>开发模式（推荐）</h3>
                  <ul>
                    <li><code>npm run dev</code> 启动开发服务器</li>
                    <li>点击「生成网站」→ 数据自动写入 <code>public/data.json</code></li>
                    <li>运行 <code>./deploy.sh</code> 一键发布</li>
                  </ul>
                </div>
                <div class="help-col">
                  <h3>生产模式</h3>
                  <ul>
                    <li>点击「生成网站」→ 下载 <code>data.json</code></li>
                    <li>手动覆盖到 <code>public/data.json</code></li>
                    <li>运行 <code>./deploy.sh</code> 一键发布</li>
                  </ul>
                </div>
              </div>
              <div class="help-tip"><span class="help-tip-icon">💡</span> <code>deploy.sh</code> 会自动执行构建、<code>git add</code>、<code>git commit</code>、<code>git push</code>，一条命令搞定发布。也可以单独运行 <code>./build.sh</code> 只构建不提交。</div>
            </section>

            <!-- 7. 全站搜索 -->
            <section :id="'h6'" class="help-section">
              <div class="help-section-head">
                <div class="help-section-badge badge-blue">🔍</div>
                <div>
                  <h2>全站搜索</h2>
                  <p class="help-section-sub">每个页面都内置了统一风格的搜索框，直接搜索对应内容</p>
                </div>
              </div>
              <div class="help-card-grid cols-4">
                <div class="help-search-card"><div class="help-search-icon">🏠</div><strong>首页</strong><span>跨页面搜索导航链接 + 讯息</span></div>
                <div class="help-search-card"><div class="help-search-icon">🧭</div><strong>导航</strong><span>搜索导航链接名称和 URL</span></div>
                <div class="help-search-card"><div class="help-search-icon">📰</div><strong>讯息</strong><span>搜索讯息标题和描述</span></div>
                <div class="help-search-card"><div class="help-search-icon">✏️</div><strong>随记</strong><span>搜索随记内容和标签</span></div>
              </div>
            </section>

            <!-- 8. 首页头像设置 -->
            <section :id="'h7'" class="help-section">
              <div class="help-section-head">
                <div class="help-section-badge badge-pink">🏠</div>
                <div>
                  <h2>首页头像设置</h2>
                  <p class="help-section-sub">首页会显示一个头像图片，按以下步骤设置</p>
                </div>
              </div>
              <div class="help-steps">
                <div class="help-step"><span class="help-step-num">1</span><div class="help-step-body"><p>准备一张正方形图片（推荐 200×200 以上）</p></div></div>
                <div class="help-step"><span class="help-step-num">2</span><div class="help-step-body"><p>命名为 <code>avatar.png</code></p></div></div>
                <div class="help-step"><span class="help-step-num">3</span><div class="help-step-body"><p>放到项目的 <code>public/</code> 文件夹中</p></div></div>
                <div class="help-step"><span class="help-step-num">4</span><div class="help-step-body"><p>重新构建后上传，或直接放到服务器网站根目录</p></div></div>
              </div>
            </section>

            <!-- 导航栏图标 -->
            <section :id="'h12'" class="help-section">
              <div class="help-section-head">
                <div class="help-section-badge badge-yellow">🎨</div>
                <div>
                  <h2>导航栏图标</h2>
                  <p class="help-section-sub">自定义底部导航栏的 Emoji 图标，让界面更有个性</p>
                </div>
              </div>
              <div class="help-two-col">
                <div class="help-col">
                  <h3>设置方法</h3>
                  <ul>
                    <li>在总览页找到「🎨 导航栏图标」卡片</li>
                    <li>每个 Tab 提供 10 个 Emoji 可选</li>
                    <li>点击即切换，再次点击取消选择</li>
                    <li>设置立即生效，无需重新构建</li>
                  </ul>
                </div>
                <div class="help-col">
                  <h3>其他说明</h3>
                  <ul>
                    <li><strong>恢复默认</strong>：点击卡片右上角「↺ 重置」按钮</li>
                    <li><strong>本地存储</strong>：图标设置保存在浏览器 localStorage，每个设备独立</li>
                    <li><strong>支持范围</strong>：首页、导航、讯息、随记 4 个 Tab，管理 Tab 保持默认</li>
                  </ul>
                </div>
              </div>
              <div class="help-tip"><span class="help-tip-icon">💡</span> 图标设置保存在本地，不同设备或浏览器需分别设置。</div>
            </section>

            <!-- Markdown 预览 -->
            <section :id="'h13'" class="help-section">
              <div class="help-section-head">
                <div class="help-section-badge badge-purple">👁️</div>
                <div>
                  <h2>Markdown 预览</h2>
                  <p class="help-section-sub">随记输入时实时预览 Markdown 渲染效果</p>
                </div>
              </div>
              <div class="help-steps">
                <div class="help-step">
                  <span class="help-step-num">1</span>
                  <div class="help-step-body">
                    <strong>切换到预览模式</strong>
                    <p>在随记输入框顶部，点击「预览」按钮即可查看渲染后的效果</p>
                  </div>
                </div>
                <div class="help-step">
                  <span class="help-step-num">2</span>
                  <div class="help-step-body">
                    <strong>支持的语法</strong>
                    <p>标题 (#)、加粗 (**text**)、列表 (- item)、代码块、引用 (>)、链接、图片等</p>
                  </div>
                </div>
                <div class="help-step">
                  <span class="help-step-num">3</span>
                  <div class="help-step-body">
                    <strong>切换回编辑</strong>
                    <p>点击「编辑」按钮即可返回编辑模式，继续修改内容</p>
                  </div>
                </div>
              </div>
              <div class="help-tip"><span class="help-tip-icon">💡</span> 输入为空时「预览」按钮不可用，确保有内容后再预览。</div>
            </section>

            <!-- 备份提醒 -->
            <section :id="'h14'" class="help-section">
              <div class="help-section-head">
                <div class="help-section-badge badge-yellow">🔔</div>
                <div>
                  <h2>备份提醒</h2>
                  <p class="help-section-sub">自动提醒你导出数据备份，防止数据丢失</p>
                </div>
              </div>
              <div class="help-steps">
                <div class="help-step">
                  <span class="help-step-num">1</span>
                  <div class="help-step-body">
                    <strong>自动检测</strong>
                    <p>系统会在后台总览页自动检查上次导出时间，超过 7 天显示提醒</p>
                  </div>
                </div>
                <div class="help-step">
                  <span class="help-step-num">2</span>
                  <div class="help-step-body">
                    <strong>提醒级别</strong>
                    <p>7 天提示（蓝色）、14 天警告（黄色）、30 天危险（红色），超过 30 天强烈建议备份</p>
                  </div>
                </div>
                <div class="help-step">
                  <span class="help-step-num">3</span>
                  <div class="help-step-body">
                    <strong>一键导出</strong>
                    <p>点击提醒横幅中的「立即导出」按钮，或点击「稍后提醒」关闭横幅</p>
                  </div>
                </div>
              </div>
              <div class="help-tip"><span class="help-tip-icon">💡</span> 每次导出数据时会自动记录时间，重置备份提醒计时。</div>
            </section>

            <!-- Mac 软件页 -->
            <section :id="'h15'" class="help-section">
              <div class="help-section-head">
                <div class="help-section-badge badge-green">🍎</div>
                <div>
                  <h2>Mac 软件页</h2>
                  <p class="help-section-sub">管理 Mac 软件推荐页面，左右布局 + 多列网格，支持分类增删改查</p>
                </div>
              </div>
              <div class="help-steps">
                <div class="help-step">
                  <span class="help-step-num">1</span>
                  <div class="help-step-body">
                    <strong>进入页面</strong>
                    <p>在导航页「万物归一」分类下点击「mac」链接，即可进入 Mac 软件推荐页（占屏幕 80% 宽度）</p>
                  </div>
                </div>
                <div class="help-step">
                  <span class="help-step-num">2</span>
                  <div class="help-step-body">
                    <strong>后台管理</strong>
                    <p>在后台点击「Mac」标签，左侧显示分类侧边栏，右侧显示 3 列网格。切换分类后可添加、编辑、删除软件条目</p>
                  </div>
                </div>
                <div class="help-step">
                  <span class="help-step-num">3</span>
                  <div class="help-step-body">
                    <strong>数据结构</strong>
                    <p>每个软件包含名称、描述、链接和标签，支持按分类浏览和搜索</p>
                  </div>
                </div>
              </div>
              <div class="help-tip"><span class="help-tip-icon">💡</span> Mac 页面数据支持导出/导入，备份时会自动包含。移动端自动切换为上下布局 + 单列显示。</div>
            </section>

            <!-- 文章管理 -->
            <section :id="'h16'" class="help-section">
              <div class="help-section-head">
                <div class="help-section-badge badge-blue">📝</div>
                <div>
                  <h2>文章管理</h2>
                  <p class="help-section-sub">支持 Markdown 语法，写完后自动生成页面，可发布到导航「万物归一」</p>
                </div>
              </div>
              <div class="help-steps">
                <div class="help-step">
                  <span class="help-step-num">1</span>
                  <div class="help-step-body">
                    <strong>新建文章</strong>
                    <p>在后台点击「文章」标签，点击「+ 新建文章」按钮，进入编辑器</p>
                  </div>
                </div>
                <div class="help-step">
                  <span class="help-step-num">2</span>
                  <div class="help-step-body">
                    <strong>编写内容</strong>
                    <p>输入标题，在文本框中输入 Markdown 内容，支持标题、加粗、列表、代码块、图片等语法。点击「预览」可实时查看渲染效果</p>
                  </div>
                </div>
                <div class="help-step">
                  <span class="help-step-num">3</span>
                  <div class="help-step-body">
                    <strong>添加到导航</strong>
                    <p>点击「+ 导航」按钮，文章会自动添加到「万物归一」分类中，用户点击即可打开文章页面</p>
                  </div>
                </div>
                <div class="help-step">
                  <span class="help-step-num">4</span>
                  <div class="help-step-body">
                    <strong>发布/取消发布</strong>
                    <p>在列表中点击「发布」或「取消发布」，控制文章是否在导航中可见</p>
                  </div>
                </div>
              </div>
              <div class="help-tip"><span class="help-tip-icon">💡</span> 文章数据支持导出/导入，撤销操作可回滚。导航链接格式为 <code>#article:文章ID</code>。</div>
            </section>

            <!-- 后台登录 -->
            <section :id="'h17'" class="help-section">
              <div class="help-section-head">
                <div class="help-section-badge badge-red">🔑</div>
                <div>
                  <h2>后台登录</h2>
                  <p class="help-section-sub">管理后台需要账号密码登录，保护数据安全</p>
                </div>
              </div>
              <div class="help-steps">
                <div class="help-step">
                  <span class="help-step-num">1</span>
                  <div class="help-step-body">
                    <strong>默认账号</strong>
                    <p>账号：<code>admin</code>，密码：<code>yihao2027</code>。首次登录后请及时修改密码</p>
                  </div>
                </div>
                <div class="help-step">
                  <span class="help-step-num">2</span>
                  <div class="help-step-body">
                    <strong>进入后台</strong>
                    <p>通过快捷键 Ctrl+Shift+A、URL 参数 ?admin=1、或长按首页 tab 3 秒触发登录弹窗</p>
                  </div>
                </div>
                <div class="help-step">
                  <span class="help-step-num">3</span>
                  <div class="help-step-body">
                    <strong>修改密码</strong>
                    <p>登录后台后，在总览页底部「修改密码」卡片中设置新账号和密码</p>
                  </div>
                </div>
              </div>
              <div class="help-tip"><span class="help-tip-icon">💡</span> 密码使用 SHA-256 哈希存储，不会明文保存。修改密码后旧密码立即失效。</div>
            </section>

            <!-- 开发环境 -->
            <section :id="'h11'" class="help-section">
              <div class="help-section-head">
                <div class="help-section-badge badge-green">💻</div>
                <div>
                  <h2>开发环境</h2>
                  <p class="help-section-sub">本地开发和调试的完整流程</p>
                </div>
              </div>
              <div class="help-steps">
                <div class="help-step">
                  <span class="help-step-num">1</span>
                  <div class="help-step-body">
                    <strong>安装依赖</strong>
                    <p>首次使用，在项目根目录运行 <code>npm install</code></p>
                  </div>
                </div>
                <div class="help-step">
                  <span class="help-step-num">2</span>
                  <div class="help-step-body">
                    <strong>启动开发服务器</strong>
                    <p>运行 <code>npm run dev</code>，浏览器打开 <code>http://localhost:5173</code></p>
                  </div>
                </div>
                <div class="help-step">
                  <span class="help-step-num">3</span>
                  <div class="help-step-body">
                    <strong>进入管理后台</strong>
                    <p>任选其一：① 快捷键 <kbd>Ctrl+Shift+A</kbd>；② URL 加 <code>?admin=1</code>；③ 长按底部「首页」tab 3 秒；④ 控制台执行 <code>localStorage.setItem('yihao_admin','true')</code> 后刷新</p>
                  </div>
                </div>
              </div>
              <div class="help-code-block">
                <div class="help-code-header">终端命令</div>
                <code>cd ~/Desktop/2027网站<br/>npm install<br/>npm run dev</code>
              </div>
              <div class="help-two-col">
                <div class="help-col">
                  <h3>常用命令</h3>
                  <ul>
                    <li><code>npm run dev</code> — 启动开发服务器，支持热更新</li>
                    <li><code>npm run build</code> — 构建生产版本到 <code>docs/</code></li>
                    <li><code>./deploy.sh</code> — 一键构建 + 提交 + 推送到 GitHub</li>
                    <li><code>./build.sh</code> — 仅构建，不提交</li>
                  </ul>
                </div>
                <div class="help-col">
                  <h3>技术栈</h3>
                  <ul>
                    <li><strong>Vue 3.5</strong> — Composition API + 响应式数据</li>
                    <li><strong>Vite 8</strong> — 极速构建和热模块替换</li>
                    <li><strong>marked 18</strong> — Markdown 渲染（随记页）</li>
                  </ul>
                </div>
              </div>
              <div class="help-tip"><span class="help-tip-icon">💡</span> 开发服务器的端口默认为 <code>5173</code>，如果被占用会自动切换到 <code>5174</code>。修改代码后页面会自动热更新，无需手动刷新。</div>
            </section>

            <!-- 9. 部署说明 -->
            <section :id="'h8'" class="help-section">
              <div class="help-section-head">
                <div class="help-section-badge badge-purple">🌍</div>
                <div>
                  <h2>部署到 GitHub Pages</h2>
                  <p class="help-section-sub">网站已配置为从 docs/ 文件夹部署，与 GitHub Pages 完美配合</p>
                </div>
              </div>
              <div class="help-steps">
                <div class="help-step"><span class="help-step-num">1</span><div class="help-step-body"><strong>配置 Pages</strong><p>GitHub 仓库 → Settings → Pages → Source 选择 <code>main</code> 分支的 <code>/docs</code> 文件夹</p></div></div>
                <div class="help-step"><span class="help-step-num">2</span><div class="help-step-body"><strong>构建并推送</strong><p>运行 <code>./deploy.sh</code>，自动构建 + 提交 + 推送到 GitHub</p></div></div>
                <div class="help-step"><span class="help-step-num">3</span><div class="help-step-body"><strong>等待部署</strong><p>GitHub 会自动从 <code>docs/</code> 部署，几分钟后即可访问</p></div></div>
              </div>
              <div class="help-tip"><span class="help-tip-icon">💡</span> <code>docs/</code> 文件夹已纳入 Git 版本控制，每次推送都会自动触发部署。</div>
            </section>

            <!-- 10. 快捷键 -->
            <section :id="'h10'" class="help-section">
              <div class="help-section-head">
                <div class="help-section-badge badge-yellow">⌨️</div>
                <div>
                  <h2>快捷键</h2>
                  <p class="help-section-sub">常用快捷键一览</p>
                </div>
              </div>
              <div class="help-kbd-grid">
                <div class="help-kbd-item"><kbd>ESC</kbd><span>关闭弹窗/模态框</span></div>
                <div class="help-kbd-item"><kbd>Enter</kbd><span>确认表单提交</span></div>
                <div class="help-kbd-item"><kbd>⌘+Enter</kbd><span>快速保存随记</span></div>
                <div class="help-kbd-item"><kbd>← →</kbd><span>切换页面（移动端滑动）</span></div>
                <div class="help-kbd-item"><kbd>拖拽 ⠿</kbd><span>调整分类/链接顺序</span></div>
              </div>
            </section>

            <div class="help-footer">
              <p>壹号栈 v1.2 · 如需更多功能或有使用问题，请联系开发者</p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style src="./AdminPanel.css"></style>
