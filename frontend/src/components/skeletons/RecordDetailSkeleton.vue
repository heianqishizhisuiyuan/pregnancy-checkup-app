<template>
  <div class="detail-skeleton">
    <div class="detail-skeleton-card">
      <el-skeleton animated>
        <template #template>
          <div class="detail-skeleton-row">
            <el-skeleton-item variant="h3" style="width: 120px" />
            <el-skeleton-item variant="text" style="width: 80px" />
          </div>
          <div class="detail-skeleton-grid">
            <el-skeleton-item v-for="n in 4" :key="n" variant="text" style="width: 100%" />
          </div>
        </template>
      </el-skeleton>
    </div>

    <div class="detail-skeleton-card">
      <el-skeleton animated>
        <template #template>
          <el-skeleton-item variant="h3" style="width: 100px; margin-bottom: 16px" />
          <div class="detail-skeleton-vitals">
            <el-skeleton-item v-for="n in 3" :key="n" variant="rect" style="width: 100%; height: 72px" />
          </div>
        </template>
      </el-skeleton>
    </div>

    <div class="detail-skeleton-card">
      <el-skeleton animated>
        <template #template>
          <el-skeleton-item variant="h3" style="width: 140px; margin-bottom: 16px" />
          <div class="detail-skeleton-images">
            <el-skeleton-item v-for="n in 4" :key="n" variant="image" style="width: 100%; height: 120px" />
          </div>
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<style scoped>
.detail-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.detail-skeleton-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.detail-skeleton-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.detail-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-md);
}

.detail-skeleton-vitals {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.detail-skeleton-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--spacing-md);
}
</style>
