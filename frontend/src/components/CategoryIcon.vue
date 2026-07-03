<template>
  <el-icon :size="size" :class="['category-icon', { 'category-icon--inline': inline }]">
    <component :is="iconComponent" />
  </el-icon>
</template>

<script setup>
import { computed } from 'vue';
import { getCategoryIconComponent } from '@/utils/categoryIcons';

const props = defineProps({
  category: {
    type: String,
    default: '其他'
  },
  size: {
    type: Number,
    default: 18
  },
  inline: {
    type: Boolean,
    default: false
  }
});

const iconComponent = computed(() => getCategoryIconComponent(props.category));
</script>

<style scoped>
.category-icon {
  color: var(--color-accent, #C4612F);
  vertical-align: middle;
}

.category-icon--inline {
  margin-right: 4px;
}
</style>
