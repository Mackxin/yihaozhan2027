<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '搜索...' },
  compact: { type: Boolean, default: false },
  iconSize: { type: Number, default: 16 },
  stats: { type: String, default: '' },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div :class="['uni-search', { 'uni-search-compact': compact }]">
    <div class="uni-search-wrapper">
      <svg class="uni-search-icon" :width="iconSize" :height="iconSize" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        type="text"
        :placeholder="placeholder"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        class="uni-search-input"
      />
      <button v-if="modelValue" class="uni-search-clear" @click="$emit('update:modelValue', '')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
    <div v-if="stats" class="uni-search-stats">{{ stats }}</div>
  </div>
</template>
