<template>
  <div class="record-list-skeleton">
    <div v-for="n in count" :key="n" class="record-skeleton-card">
      <el-skeleton animated>
        <template #template>
          <div class="record-skeleton-header">
            <el-skeleton-item variant="text" style="width: 40%" />
            <el-skeleton-item variant="text" style="width: 20%" />
          </div>
          <el-skeleton-item variant="text" style="width: 60%; margin-top: 12px" />
          <el-skeleton-item variant="text" style="width: 45%; margin-top: 8px" />
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<script setup>
defineProps({
  count: { type: Number, default: 3 },
});
</script>

<style scoped>
.record-list-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.record-skeleton-card {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
}

.record-skeleton-header {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-md);
}
</style>
