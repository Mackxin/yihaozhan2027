<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import './DigitalLifePage.css'
import { analyzeBirth, SHICHEN_OPTIONS, lunarMonthOptions, lunarDayOptions } from '../utils/lunar.js'

const emit = defineEmits(['close'])

const STORAGE_KEY = 'yihao_digitallife'

// 表单状态
const calendarType = ref('solar') // 'solar' | 'lunar'
const solarDate = ref('')         // YYYY-MM-DD
const lunarY = ref('')
const lunarM = ref('')
const lunarD = ref('')
const hour = ref('')              // 时辰对应小时起点，'' 表示不填

// 选项
const years = []
for (let y = 1900; y <= 2100; y++) years.push(y)
const months = lunarMonthOptions().map((m, i) => ({ label: m, value: i + 1 }))
const days = lunarDayOptions().map((d, i) => ({ label: d, value: i + 1 }))
const shichenOptions = [{ value: '', label: '不填（仅算年月日柱）' }, ...SHICHEN_OPTIONS.map(o => ({ value: o.value, label: o.label }))]

const ANIMAL_EMOJI = { 鼠: '🐭', 牛: '🐮', 虎: '🐯', 兔: '🐰', 龙: '🐲', 蛇: '🐍', 马: '🐴', 羊: '🐑', 猴: '🐵', 鸡: '🐔', 狗: '🐶', 猪: '🐷' }
const ZODIAC_EMOJI = { 白羊座: '♈', 金牛座: '♉', 双子座: '♊', 巨蟹座: '♋', 狮子座: '♌', 处女座: '♍', 天秤座: '♎', 天蝎座: '♏', 射手座: '♐', 摩羯座: '♑', 水瓶座: '♒', 双鱼座: '♓' }
const WX_COLOR = { 金: '#f59e0b', 木: '#22c55e', 水: '#3b82f6', 火: '#ef4444', 土: '#c08a4a' }

const birthInput = computed(() => {
  if (calendarType.value === 'solar') {
    if (!solarDate.value) return null
    const [y, m, d] = solarDate.value.split('-').map(Number)
    if (!y || !m || !d) return null
    return { calendarType: 'solar', year: y, month: m, day: d, hour: hour.value === '' ? null : Number(hour.value) }
  } else {
    if (!lunarY.value || !lunarM.value || !lunarD.value) return null
    return { calendarType: 'lunar', year: Number(lunarY.value), month: Number(lunarM.value), day: Number(lunarD.value), hour: hour.value === '' ? null : Number(hour.value) }
  }
})

const result = computed(() => (birthInput.value ? analyzeBirth(birthInput.value) : null))

// 持久化
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      calendarType: calendarType.value,
      solarDate: solarDate.value,
      lunarY: lunarY.value,
      lunarM: lunarM.value,
      lunarD: lunarD.value,
      hour: hour.value,
    }))
  } catch (e) { /* ignore */ }
}

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (saved) {
      calendarType.value = saved.calendarType || 'solar'
      solarDate.value = saved.solarDate || ''
      lunarY.value = saved.lunarY || ''
      lunarM.value = saved.lunarM || ''
      lunarD.value = saved.lunarD || ''
      hour.value = saved.hour !== undefined ? saved.hour : ''
    }
  } catch (e) { /* ignore */ }
})

watch([calendarType, solarDate, lunarY, lunarM, lunarD, hour], save, { deep: true })

const fmtDate = (d) => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
</script>

<template>
  <div class="dl-page">
    <button class="tool-back" @click="emit('close')" title="返回" aria-label="返回">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
    </button>

    <div class="dl-hero">
      <h1>🔢 数字人生</h1>
      <p>输入出生信息，解锁生肖、星座、八字五行、生命数字、生日石与关于你的一切人生密码</p>
    </div>

    <div class="dl-form">
      <div class="dl-field">
        <label>历法</label>
        <div class="dl-seg">
          <button :class="{ active: calendarType === 'solar' }" @click="calendarType = 'solar'">公历（新历）</button>
          <button :class="{ active: calendarType === 'lunar' }" @click="calendarType = 'lunar'">农历（旧历）</button>
        </div>
      </div>

      <div class="dl-field" v-if="calendarType === 'solar'">
        <label>出生日期</label>
        <input type="date" class="dl-date-input" v-model="solarDate" />
      </div>

      <div class="dl-field" v-else>
        <label>农历出生日期</label>
        <div class="dl-date-row">
          <select class="dl-select" v-model="lunarY">
            <option value="" disabled>年</option>
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
          <select class="dl-select" v-model="lunarM">
            <option value="" disabled>月</option>
            <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
          <select class="dl-select" v-model="lunarD">
            <option value="" disabled>日</option>
            <option v-for="d in days" :key="d.value" :value="d.value">{{ d.label }}</option>
          </select>
        </div>
        <div class="dl-hint">农历数据由 solarlunar 提供，覆盖 1900–2100 年</div>
      </div>

      <div class="dl-field">
        <label>出生时辰（可选，用于推算八字时柱）</label>
        <select class="dl-select" v-model="hour">
          <option v-for="o in shichenOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </div>
    </div>

    <div v-if="result && result.error" class="dl-empty">{{ result.error }}</div>

    <template v-else-if="result">
      <div class="dl-results">
        <!-- 生肖 -->
        <div class="dl-card feature">
          <span class="dl-label">生肖</span>
          <span class="dl-value"><span class="dl-emoji">{{ ANIMAL_EMOJI[result.animal] || '🐾' }}</span>{{ result.animal }}</span>
          <span class="dl-sub">{{ result.gzYear }}年 · {{ result.lunarText.split(' ')[0] }}</span>
        </div>

        <!-- 星座 -->
        <div class="dl-card feature">
          <span class="dl-label">星座</span>
          <span class="dl-value"><span class="dl-emoji">{{ ZODIAC_EMOJI[result.zodiac.name] }}</span>{{ result.zodiac.name }}</span>
          <span class="dl-badge">{{ result.zodiac.element }}象</span>
          <span class="dl-sub">{{ result.zodiac.desc }}</span>
        </div>

        <!-- 农历生日 -->
        <div class="dl-card">
          <span class="dl-label">农历生日</span>
          <span class="dl-value sm">{{ result.lunarText }}</span>
        </div>

        <!-- 公历生日 -->
        <div class="dl-card">
          <span class="dl-label">公历生日</span>
          <span class="dl-value sm">{{ result.solarText }}</span>
          <span class="dl-sub">{{ result.weekday }}</span>
        </div>

        <!-- 年龄 -->
        <div class="dl-card">
          <span class="dl-label">年龄</span>
          <span class="dl-value">{{ result.age }}<span style="font-size:.8rem;font-weight:400"> 周岁</span></span>
          <span class="dl-sub">虚岁约 {{ result.virtualAge }} 岁</span>
        </div>

        <!-- 生命数字 -->
        <div class="dl-card">
          <span class="dl-label">生命数字</span>
          <span class="dl-value">{{ result.lifePath }}</span>
          <span class="dl-sub">{{ result.lifePathDesc }}</span>
        </div>

        <!-- 八字四柱 -->
        <div class="dl-card wide">
          <span class="dl-label">八字（四柱）· 十神</span>
          <div class="dl-bazi">
            <span v-for="(p, i) in result.tenGods" :key="i" :class="{ 'is-day': p.label === '日' }">
              {{ p.label }}<i class="dl-bazi-gz">{{ p.gan }}</i><em class="dl-bazi-god">{{ p.god }}</em>
            </span>
          </div>
          <span class="dl-sub" v-if="result.hasHour">时柱 {{ result.timeGz }} · {{ result.shiChenLabel }}</span>
          <span class="dl-sub" v-else>未填出生时辰，仅年月日三柱（十神以日干为基准）</span>
        </div>

        <!-- 五行喜用 · 起名参考 -->
        <div class="dl-card wide" v-if="result.yongShen">
          <span class="dl-label">五行喜用 · 起名参考</span>
          <div class="dl-relate">
            <span class="dl-rel ok">喜用神 <b>{{ result.yongShen.xi.join(' · ') }}</b></span>
            <span class="dl-rel bad">忌神（过旺） <b>{{ result.yongShen.ji.join(' · ') }}</b></span>
          </div>
          <div class="dl-naming" v-for="n in result.yongShen.naming" :key="n.element">
            <span class="dl-naming-el">补{{ n.element }}</span>
            <span class="dl-naming-chars">{{ n.chars.join('、') }}</span>
          </div>
          <span class="dl-sub">※ 喜用神为简化推算（按五行缺失/最弱取用），正式起名建议结合姓名学综合判断</span>
        </div>

        <!-- 五行 -->
        <div class="dl-card wide">
          <span class="dl-label">五行分布</span>
          <div class="dl-wuxing-row" v-for="w in result.wuxing.arr" :key="w.name">
            <span class="dl-wx-name">{{ w.name }}</span>
            <span class="dl-wuxing-bar"><i :style="{ width: w.width + '%', background: WX_COLOR[w.name] }"></i></span>
            <span class="dl-wx-count">{{ w.count }}</span>
          </div>
          <div class="dl-wx-missing" v-if="result.wuxing.missing.length">
            命中缺失：<b v-for="m in result.wuxing.missing" :key="m">{{ m }} </b>
          </div>
          <div class="dl-wx-missing" v-else>五行俱全 ✓</div>
        </div>

        <!-- 黄历宜忌 -->
        <div class="dl-card wide dl-almanac" v-if="result.almanac">
          <span class="dl-label">📅 当日黄历 · {{ result.almanac.name }}日</span>
          <div class="dl-yiji-row">
            <div class="dl-yiji yi">
              <b>宜</b>
              <span>{{ result.almanac.yi }}</span>
            </div>
            <div class="dl-yiji ji">
              <b>忌</b>
              <span>{{ result.almanac.ji }}</span>
            </div>
          </div>
          <span class="dl-sub">基于农历建除十二神简化推算，仅供文化参考</span>
        </div>

        <!-- 生肖档案 -->
        <div class="dl-card wide" v-if="result.animalProfile">
          <span class="dl-label">生肖档案 · {{ result.animal }}🐾</span>
          <p class="dl-traits">{{ result.animalProfile.traits }}</p>
          <div class="dl-kv-grid">
            <div class="dl-kv"><span>幸运数字</span><b>{{ result.animalProfile.luckyNum }}</b></div>
            <div class="dl-kv"><span>幸运颜色</span><b>{{ result.animalProfile.luckyColor }}</b></div>
            <div class="dl-kv"><span>幸运方位</span><b>{{ result.animalProfile.direction }}</b></div>
          </div>
          <div class="dl-relate">
            <span class="dl-rel">三合 <b>{{ result.animalProfile.triad }}</b></span>
            <span class="dl-rel ok">六合 <b>{{ result.animalProfile.secret }}</b></span>
            <span class="dl-rel bad">相冲 <b>{{ result.animalProfile.clash }}</b></span>
          </div>
          <div class="dl-benming" v-if="result.benming">
            🐲 下一个本命年：<b>{{ result.benming.year }} 年</b>（还有 {{ result.benming.yearsLeft }} 年）
          </div>
        </div>

        <!-- 星座档案 -->
        <div class="dl-card wide" v-if="result.zodiac">
          <span class="dl-label">星座档案 · {{ result.zodiac.name }} {{ ZODIAC_EMOJI[result.zodiac.name] }}</span>
          <p class="dl-traits">{{ result.zodiac.desc }}</p>
          <div class="dl-kv-grid">
            <div class="dl-kv"><span>日期</span><b>{{ result.zodiac.range }}</b></div>
            <div class="dl-kv"><span>守护星</span><b>{{ result.zodiac.ruler }}</b></div>
            <div class="dl-kv"><span>幸运数字</span><b>{{ result.zodiac.luckyNum }}</b></div>
            <div class="dl-kv"><span>幸运颜色</span><b>{{ result.zodiac.luckyColor }}</b></div>
            <div class="dl-kv"><span>幸运石</span><b>{{ result.zodiac.stone }}</b></div>
            <div class="dl-kv"><span>元素</span><b>{{ result.zodiac.element }}象</b></div>
          </div>
          <div class="dl-chips">
            <span class="dl-chip" v-for="k in result.zodiac.keywords" :key="k">{{ k }}</span>
          </div>
          <div class="dl-match">💞 最佳配对：<b>{{ result.zodiac.match }}</b></div>
        </div>

        <!-- 生日石 / 生日花 -->
        <div class="dl-card" v-if="result.birthstone">
          <span class="dl-label">生日石 · {{ result.solarM }} 月</span>
          <span class="dl-value sm">{{ result.birthstone.stone }}</span>
          <span class="dl-sub">生日花：{{ result.birthstone.flower }}</span>
          <span class="dl-sub">花语：{{ result.birthstone.flowerLang }}</span>
        </div>

        <!-- 代际标签 -->
        <div class="dl-card" v-if="result.generation">
          <span class="dl-label">你的世代</span>
          <span class="dl-value sm">{{ result.generation.label }}</span>
          <span class="dl-sub">{{ result.generation.gen }}</span>
          <span class="dl-sub">{{ result.generation.desc }}</span>
        </div>

        <!-- 已来到世界 -->
        <div class="dl-card wide">
          <span class="dl-label">你已来到这个世界</span>
          <span class="dl-value">{{ result.liveDays.toLocaleString() }} <span style="font-size:.8rem;font-weight:400">天</span></span>
          <span class="dl-sub">约 {{ result.liveHours.toLocaleString() }} 小时 · {{ result.liveMinutes.toLocaleString() }} 分钟</span>
        </div>

        <!-- 下一个生日 -->
        <div class="dl-card">
          <span class="dl-label">下一个生日</span>
          <span class="dl-value sm" v-if="result.nextBday">{{ result.nextBday.days }} 天后</span>
          <span class="dl-sub" v-if="result.nextBday">{{ fmtDate(result.nextBday.date) }}</span>
        </div>

        <!-- 季节 / 第几天 -->
        <div class="dl-card">
          <span class="dl-label">时间坐标</span>
          <span class="dl-value sm">{{ result.season }}</span>
          <span class="dl-sub">今年第 {{ result.doy }} 天 · 第 {{ result.weekOfYear }} 周</span>
        </div>
      </div>
    </template>

    <div v-else class="dl-empty">👆 选择出生日期，开启你的数字人生</div>
  </div>
</template>
