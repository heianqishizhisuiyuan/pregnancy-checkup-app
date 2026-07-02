<template>
  <div class="stat-card">
    <div class="stat-icon">{{ icon }}</div>
    <div class="stat-content">
      <div class="stat-label">{{ label }}</div>
      <div class="stat-value">{{ value }}</div>
      <div v-if="subtitle" class="stat-subtitle">{{ subtitle }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
});
</script>

<style scoped>
.stat-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.stat-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-accent);
}

.stat-subtitle {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}
</style>
