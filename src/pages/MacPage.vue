<script setup>
import ToolPage from './ToolPage.vue'
defineProps({ active: { type: Boolean, default: false } })
</script>

<template>
  <ToolPage :active="active" toolKey="mac" />
</template>
