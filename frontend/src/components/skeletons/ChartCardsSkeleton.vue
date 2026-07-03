<template>
  <div class="charts-skeleton">
    <div v-for="n in count" :key="n" class="chart-skeleton-card">
      <el-skeleton animated>
        <template #template>
          <el-skeleton-item variant="h3" style="width: 100px; margin-bottom: 12px" />
          <el-skeleton-item variant="rect" style="width: 100%; height: 260px" />
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<script setup>
defineProps({
  count: { type: Number, default: 4 },
});
</script>

<style scoped>
.charts-skeleton {
  max-width: 880px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.chart-skeleton-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(31, 36, 33, 0.06);
}
</style>
