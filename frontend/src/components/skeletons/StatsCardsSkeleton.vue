<template>
  <div class="stats-skeleton">
    <div v-for="n in 3" :key="n" class="stat-skeleton-card">
      <el-skeleton animated>
        <template #template>
          <div class="stat-skeleton-inner">
            <el-skeleton-item variant="circle" style="width: 48px; height: 48px" />
            <div class="stat-skeleton-text">
              <el-skeleton-item variant="text" style="width: 72px" />
              <el-skeleton-item variant="h3" style="width: 96px; margin-top: 8px" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<style scoped>
.stats-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.stat-skeleton-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.stat-skeleton-inner {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.stat-skeleton-text {
  flex: 1;
}
</style>
