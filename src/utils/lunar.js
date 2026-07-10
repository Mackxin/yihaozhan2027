// 数字人生计算工具
// 依赖 solarlunar（公历/农历互转、生肖、干支）
import solarlunarPkg from 'solarlunar'

// solarlunar 在 CJS/ESM 下导出形态不统一，做一次兼容
const solarlunar = solarlunarPkg.default || solarlunarPkg

// 天干 / 地支
const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
// 农历月中文
const LUNAR_MONTH_CN = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
// 农历日中文（初一..三十）
const LUNAR_DAY_CN = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
// 五行（天干）
const GAN_WUXING = ['木', '火', '土', '金', '水', '木', '火', '土', '金', '水'] // 甲乙木 丙丁火 戊己土 庚辛金 壬癸水
// 五行（地支）
const ZHI_WUXING = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'] // 子水丑土寅木卯木辰土巳火午火未土申金酉金戌土亥水

// 时辰（12 地支）-> 对应的小时区间首值（用于推算时干）
const SHICHEN_HOUR_START = [0, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21] // 子丑寅卯辰巳午未申酉戌亥
const SHICHEN_LABEL = ['子时 (23:00-00:59)', '丑时 (01:00-02:59)', '寅时 (03:00-04:59)', '卯时 (05:00-06:59)',
  '辰时 (07:00-08:59)', '巳时 (09:00-10:59)', '午时 (11:00-12:59)', '未时 (13:00-14:59)',
  '申时 (15:00-16:59)', '酉时 (17:00-18:59)', '戌时 (19:00-20:59)', '亥时 (21:00-22:59)']

// ─── 星座 ───
const ZODIAC = [
  { name: '白羊座', element: '火', range: '3.21–4.19', ruler: '火星', luckyNum: '9', luckyColor: '红色', stone: '红宝石', keywords: ['热情', '勇敢', '行动派'], match: '狮子座 · 射手座', desc: '热情、勇敢、行动派，喜欢冲锋在前' },
  { name: '金牛座', element: '土', range: '4.20–5.20', ruler: '金星', luckyNum: '6', luckyColor: '绿色', stone: '祖母绿', keywords: ['稳重', '务实', '固执'], match: '处女座 · 摩羯座', desc: '稳重、务实、有耐心，追求安稳与美好' },
  { name: '双子座', element: '风', range: '5.21–6.21', ruler: '水星', luckyNum: '5', luckyColor: '黄色', stone: '珍珠', keywords: ['机智', '善变', '好奇'], match: '天秤座 · 水瓶座', desc: '机智、善变、好奇心强，擅长沟通' },
  { name: '巨蟹座', element: '水', range: '6.22–7.22', ruler: '月亮', luckyNum: '2', luckyColor: '银白/蓝', stone: '月光石', keywords: ['温柔', '顾家', '敏感'], match: '天蝎座 · 双鱼座', desc: '温柔、顾家、重感情，富有同理心' },
  { name: '狮子座', element: '火', range: '7.23–8.22', ruler: '太阳', luckyNum: '1', luckyColor: '金色', stone: '黄水晶', keywords: ['自信', '大方', '爱面子'], match: '白羊座 · 射手座', desc: '自信、大方、有领导力，天生发光体' },
  { name: '处女座', element: '土', range: '8.23–9.22', ruler: '水星', luckyNum: '5', luckyColor: '灰蓝', stone: '蓝宝石', keywords: ['细致', '完美', '挑剔'], match: '金牛座 · 摩羯座', desc: '细致、严谨、追求完美，注重细节' },
  { name: '天秤座', element: '风', range: '9.23–10.23', ruler: '金星', luckyNum: '6', luckyColor: '粉蓝', stone: '蛋白石', keywords: ['和谐', '优雅', '纠结'], match: '双子座 · 水瓶座', desc: '和谐、优雅、重视平衡与关系' },
  { name: '天蝎座', element: '水', range: '10.24–11.22', ruler: '冥王星', luckyNum: '9', luckyColor: '深红/黑', stone: '碧玺', keywords: ['深沉', '专注', '多疑'], match: '巨蟹座 · 双鱼座', desc: '深沉、专注、洞察力强，爱憎分明' },
  { name: '射手座', element: '火', range: '11.23–12.21', ruler: '木星', luckyNum: '3', luckyColor: '紫蓝', stone: '黄玉', keywords: ['自由', '乐观', '冒险'], match: '白羊座 · 狮子座', desc: '自由、乐观、爱冒险，向往远方' },
  { name: '摩羯座', element: '土', range: '12.22–1.19', ruler: '土星', luckyNum: '8', luckyColor: '棕黑', stone: '石榴石', keywords: ['负责', '坚韧', '保守'], match: '金牛座 · 处女座', desc: '负责、坚韧、有野心，踏踏实实向上' },
  { name: '水瓶座', element: '风', range: '1.20–2.18', ruler: '天王星', luckyNum: '4', luckyColor: '电光蓝', stone: '蓝晶', keywords: ['独立', '创新', '叛逆'], match: '双子座 · 天秤座', desc: '独立、创新、有想法，特立独行' },
  { name: '双鱼座', element: '水', range: '2.19–3.20', ruler: '海王星', luckyNum: '7', luckyColor: '海蓝', stone: '海蓝宝', keywords: ['浪漫', '敏感', '梦幻'], match: '巨蟹座 · 天蝎座', desc: '浪漫、敏感、富有想象力与同情心' },
]

function getZodiac(month, day) {
  const md = month * 100 + day
  const table = [
    [101, 119, ZODIAC[9]], [120, 218, ZODIAC[10]], [219, 320, ZODIAC[11]],
    [321, 419, ZODIAC[0]], [420, 520, ZODIAC[1]], [521, 621, ZODIAC[2]],
    [622, 722, ZODIAC[3]], [723, 822, ZODIAC[4]], [823, 922, ZODIAC[5]],
    [923, 1023, ZODIAC[6]], [1024, 1122, ZODIAC[7]], [1123, 1221, ZODIAC[8]],
    [1222, 1231, ZODIAC[9]],
  ]
  for (const [s, e, z] of table) if (md >= s && md <= e) return z
  return ZODIAC[9]
}

// ─── 生肖完整档案 ───
const ANIMAL_PROFILE = {
  鼠: { traits: '机敏灵巧、适应力强，善于积蓄与交际', luckyNum: '2、3', luckyColor: '蓝色、金色', direction: '东南', triad: '龙 · 猴', secret: '牛', clash: '马' },
  牛: { traits: '勤恳踏实、任劳任怨，认准的事坚持到底', luckyNum: '1、4', luckyColor: '黄色、红色', direction: '正北', triad: '蛇 · 鸡', secret: '鼠', clash: '羊' },
  虎: { traits: '勇猛自信、敢闯敢拼，自带气场与正义感', luckyNum: '1、3、4', luckyColor: '绿色、金色', direction: '正东', triad: '马 · 狗', secret: '猪', clash: '猴' },
  兔: { traits: '温顺细腻、气质优雅，重视家庭与和平', luckyNum: '3、4、6', luckyColor: '粉色、绿色', direction: '正东', triad: '羊 · 猪', secret: '狗', clash: '鸡' },
  龙: { traits: '气势不凡、胸怀大志，天生的领袖气质', luckyNum: '1、6、7', luckyColor: '金色、红色', direction: '正西', triad: '鼠 · 猴', secret: '鸡', clash: '狗' },
  蛇: { traits: '沉稳智慧、直觉敏锐，外冷内热有谋略', luckyNum: '2、8、9', luckyColor: '红色、紫色', direction: '正南', triad: '牛 · 鸡', secret: '猴', clash: '猪' },
  马: { traits: '热情奔放、自由不羁，行动力与感染力十足', luckyNum: '2、7、8', luckyColor: '红色、紫色', direction: '正南', triad: '虎 · 狗', secret: '羊', clash: '鼠' },
  羊: { traits: '温和善良、富有艺术感，重情重义易心软', luckyNum: '3、4、9', luckyColor: '绿色、粉色', direction: '正南', triad: '兔 · 猪', secret: '马', clash: '牛' },
  猴: { traits: '聪明机变、多才多艺，点子多且学习力强', luckyNum: '4、9', luckyColor: '金色、白色', direction: '正北', triad: '鼠 · 龙', secret: '蛇', clash: '虎' },
  鸡: { traits: '精明务实、注重仪表，凡事力求完美而出色', luckyNum: '5、7、8', luckyColor: '金色、褐色', direction: '正西', triad: '牛 · 蛇', secret: '龙', clash: '兔' },
  狗: { traits: '忠诚可靠、正义感强，是值得托付的伙伴', luckyNum: '3、4、9', luckyColor: '红色、棕色', direction: '正南', triad: '虎 · 马', secret: '兔', clash: '龙' },
  猪: { traits: '憨厚随和、福气满满，知足常乐人缘好', luckyNum: '2、5、8', luckyColor: '黄色、灰色', direction: '正北', triad: '兔 · 羊', secret: '虎', clash: '蛇' },
}

// ─── 生日石 / 生日花（按公历月份 1-12）───
const BIRTHSTONE = [
  { stone: '石榴石', flower: '梅花', flowerLang: '纯洁与希望' },       // 1
  { stone: '紫水晶', flower: '水仙', flowerLang: '谦逊与重生' },       // 2
  { stone: '海蓝宝', flower: '郁金香', flowerLang: '博爱与美丽' },     // 3
  { stone: '钻石', flower: '雏菊', flowerLang: '天真与纯洁' },         // 4
  { stone: '祖母绿', flower: '铃兰', flowerLang: '幸福归来' },         // 5
  { stone: '珍珠', flower: '玫瑰', flowerLang: '热烈的爱情' },         // 6
  { stone: '红宝石', flower: '飞燕草', flowerLang: '热情与自由' },     // 7
  { stone: '橄榄石', flower: '剑兰', flowerLang: '坚强与思念' },       // 8
  { stone: '蓝宝石', flower: '桂花', flowerLang: '高贵与丰收' },       // 9
  { stone: '碧玺', flower: '菊花', flowerLang: '真情与长久' },         // 10
  { stone: '黄玉', flower: '向日葵', flowerLang: '友谊与阳光' },       // 11
  { stone: '绿松石', flower: '水仙', flowerLang: '羁绊与思念' },       // 12
]

// ─── 代际 / 世代标签 ───
function getGeneration(year) {
  if (year < 1960) return { label: '长辈', gen: '建国一代', desc: '见证时代变迁的开创者' }
  if (year < 1970) return { label: '60后', gen: 'X世代前', desc: '踏实肯干的实干一代' }
  if (year < 1980) return { label: '70后', gen: 'X世代', desc: '承上启下的中坚力量' }
  if (year < 1995) return { label: '80后', gen: '千禧一代', desc: '伴随改革开放成长的中流砥柱' }
  if (year < 2000) return { label: '90后', gen: '千禧一代', desc: '个性鲜明、拥抱互联网的弄潮儿' }
  if (year < 2010) return { label: '00后', gen: 'Z世代', desc: '数字原住民，自由真实的表达者' }
  if (year < 2020) return { label: '10后', gen: 'Alpha世代', desc: '在智能时代出生的新新人类' }
  return { label: '20后', gen: 'Alpha世代', desc: '面向未来的全新一代' }
}

// ─── 本命年倒计时 ───
function getBenming(lunarYear, nowYear) {
  // 本命年：农历年与出生农历年地支相同，即相差 12 的倍数
  let y = nowYear
  while ((y - lunarYear) % 12 !== 0) y++
  const yearsLeft = y - nowYear
  return { year: y, yearsLeft: yearsLeft < 0 ? 0 : yearsLeft }
}

// ─── 生命数字（生命路径数）───
function reduceKeepMaster(n) {
  while (n > 9) {
    if (n === 11 || n === 22 || n === 33) return n
    n = String(n).split('').reduce((a, c) => a + Number(c), 0)
  }
  return n
}

function lifePathNumber(y, m, d) {
  const ry = reduceKeepMaster(y)
  const rm = reduceKeepMaster(m)
  const rd = reduceKeepMaster(d)
  return reduceKeepMaster(ry + rm + rd)
}

const LIFE_PATH_MEANING = {
  1: '开创者 · 独立自信、有领导力，适合做领头羊',
  2: '协调者 · 温和合作、善解人意，是优秀的伙伴',
  3: '表达者 · 创意与社交达人，乐观爱分享',
  4: '建设者 · 踏实可靠、务实有条理，基础牢固',
  5: '自由者 · 热爱变化与探索，适应力强',
  6: '关怀者 · 有责任感、重家庭与爱，乐于照顾他人',
  7: '思考者 · 内省智慧、喜欢钻研，富有哲思',
  8: '成就者 · 目标感强、善于管理与积累，追求成功',
  9: '博爱者 · 理想主义、包容大度，有圆满气质',
  11: '灵感者（大师数）· 直觉敏锐、富有洞察与灵性',
  22: '实现者（大师数）· 能把宏大理想落地，务实的建造者',
  33: '导师（大师数）· 无私奉献、慈悲包容，天生的引路人',
}

// ─── 八字时柱 ───
function getShiChenIndex(hour) {
  if (hour === 0 || hour === 23) return 0 // 子时（含晚子时）
  const ranges = [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10], [11, 12], [13, 14], [15, 16], [17, 18], [19, 20], [21, 22]]
  for (let i = 0; i < ranges.length; i++) {
    const [a, b] = ranges[i]
    if (hour >= a && hour <= b) return i + 1
  }
  return 0
}

function getTimeGanZhi(dayGanChar, hour) {
  const dayGanIdx = GAN.indexOf(dayGanChar)
  if (dayGanIdx < 0) return null
  const startGan = (dayGanIdx % 5) * 2 // 子时天干起始（甲己→甲，乙庚→丙…）
  const scIdx = getShiChenIndex(hour)
  const ganIdx = (startGan + scIdx) % 10
  return GAN[ganIdx] + ZHI[scIdx]
}

// ─── 五行统计 ───
function getWuxingStats(pillars) {
  const counts = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 }
  for (const p of pillars) {
    if (!p) continue
    const g = p[0], z = p[1]
    if (GAN.includes(g)) counts[GAN_WUXING[GAN.indexOf(g)]]++
    if (ZHI.includes(z)) counts[ZHI_WUXING[ZHI.indexOf(z)]]++
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
  const max = Math.max(...Object.values(counts)) || 1
  const wuxingArr = Object.keys(counts).map(k => ({
    name: k,
    count: counts[k],
    pct: Math.round((counts[k] / total) * 100),
    width: Math.round((counts[k] / max) * 100),
  }))
  // 缺失的五行
  const missing = Object.keys(counts).filter(k => counts[k] === 0)
  return { counts, total, arr: wuxingArr, missing }
}

// ─── 年龄 / 已活时间 ───
function calcAge(birthDate, now) {
  let age = now.getFullYear() - birthDate.getFullYear()
  const m = now.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--
  return age < 0 ? 0 : age
}

function dayOfYear(y, m, d) {
  const start = new Date(y, 0, 0)
  const cur = new Date(y, m - 1, d)
  return Math.floor((cur - start) / 86400000)
}

function getSeason(month) {
  if (month >= 3 && month <= 5) return '春季'
  if (month >= 6 && month <= 8) return '夏季'
  if (month >= 9 && month <= 11) return '秋季'
  return '冬季'
}

// 下一个生日倒计时（返回天数与日期）
function nextBirthdayCountdown(calendarType, ly, lm, ld, now) {
  const buildSolar = (y, m, d) => {
    if (calendarType === 'lunar') {
      const r = solarlunar.lunar2solar(y, m, d)
      if (!r) return null
      return new Date(r.cYear, r.cMonth - 1, r.cDay)
    }
    return new Date(y, m - 1, d)
  }
  const thisYear = buildSolar(now.getFullYear(), lm, ld)
  const nextYear = buildSolar(now.getFullYear() + 1, lm, ld)
  let target = thisYear
  if (!target || target < now) target = nextYear
  if (!target) return null
  const days = Math.ceil((target - now) / 86400000)
  return { date: target, days: days < 0 ? 0 : days }
}

// ─── 主入口 ───
export function analyzeBirth({ calendarType, year, month, day, hour }) {
  if (!year || !month || !day) return { error: '请填写完整的出生日期' }

  let solarY, solarM, solarD
  if (calendarType === 'lunar') {
    const r = solarlunar.lunar2solar(Number(year), Number(month), Number(day))
    if (!r) return { error: '农历日期无效（可能该农历月没有这一天）' }
    solarY = r.cYear; solarM = r.cMonth; solarD = r.cDay
  } else {
    solarY = Number(year); solarM = Number(month); solarD = Number(day)
  }

  const lun = solarlunar.solar2lunar(solarY, solarM, solarD)
  const gzYear = lun.gzYear
  const gzMonth = lun.gzMonth
  const gzDay = lun.gzDay
  const animal = lun.animal
  const zodiac = getZodiac(solarM, solarD)

  // 时柱
  let timeGz = null
  if (hour !== undefined && hour !== null && hour !== '' && !isNaN(Number(hour))) {
    timeGz = getTimeGanZhi(gzDay[0], Number(hour))
  }
  const pillars = [gzYear, gzMonth, gzDay, timeGz].filter(Boolean)
  const bazi = pillars.join(' ')
  const wuxing = getWuxingStats([gzYear, gzMonth, gzDay].concat(timeGz ? [timeGz] : []))

  const lifePath = lifePathNumber(solarY, solarM, solarD)
  const lifePathDesc = LIFE_PATH_MEANING[lifePath] || ''

  const now = new Date()
  const birthDate = new Date(solarY, solarM - 1, solarD)
  if (isNaN(birthDate.getTime())) return { error: '出生日期无效' }

  const age = calcAge(birthDate, now)
  const virtualAge = solarY ? now.getFullYear() - solarY + 1 : 0 // 传统虚岁近似
  const diff = now - birthDate
  const liveDays = Math.max(0, Math.floor(diff / 86400000))
  const liveHours = Math.max(0, Math.floor(diff / 3600000))
  const liveMinutes = Math.max(0, Math.floor(diff / 60000))
  const liveSeconds = Math.max(0, Math.floor(diff / 1000))

  const nextBday = nextBirthdayCountdown(calendarType, Number(year), Number(month), Number(day), now)
  const doy = dayOfYear(solarY, solarM, solarD)
  const weekOfYear = Math.ceil(doy / 7)
  const season = getSeason(solarM)

  // 生肖 / 星座 / 生日石 / 代际 / 本命年 档案
  const animalProfile = ANIMAL_PROFILE[animal] || null
  const birthstone = BIRTHSTONE[(solarM - 1 + 12) % 12] || null
  const generation = getGeneration(solarY)
  const benming = getBenming(Number(lun.lYear || solarY), now.getFullYear())

  return {
    error: null,
    // 基础
    calendarType,
    animal,
    zodiac,
    gzYear, gzMonth, gzDay,
    // 农历 / 公历
    lunarText: `${lun.yearCn} ${lun.monthCn}${lun.dayCn}${lun.isLeap ? '（闰月）' : ''}`,
    lunarCn: lun.monthCn + lun.dayCn,
    solarText: `${solarY}年${solarM}月${solarD}日`,
    weekday: lun.ncWeek,
    // 八字 / 五行
    bazi,
    hasHour: !!timeGz,
    timeGz,
    shiChenLabel: timeGz ? SHICHEN_LABEL[getShiChenIndex(Number(hour))] : null,
    wuxing,
    // 生命数字
    lifePath,
    lifePathDesc,
    // 年龄 / 统计
    age,
    virtualAge,
    liveDays,
    liveHours,
    liveMinutes,
    liveSeconds,
    nextBday,
    doy,
    weekOfYear,
    season,
    // 档案补充
    animalProfile,
    birthstone,
    generation,
    benming,
    // 原始可展示
    solarY, solarM, solarD,
  }
}

// 暴露常量给 UI 使用
export const SHICHEN_OPTIONS = SHICHEN_LABEL.map((label, i) => ({ value: SHICHEN_HOUR_START[i], label }))

export function lunarMonthOptions() {
  return LUNAR_MONTH_CN
}
export function lunarDayOptions() {
  return LUNAR_DAY_CN
}

export default {
  analyzeBirth,
  SHICHEN_OPTIONS,
  lunarMonthOptions,
  lunarDayOptions,
}
