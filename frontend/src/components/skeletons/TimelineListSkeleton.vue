<template>
  <div class="timeline-skeleton">
    <div v-for="i in count" :key="i" class="timeline-item-skeleton">
      <div class="dot-line">
        <div class="dot shimmer" />
        <div v-if="i < count" class="line shimmer" />
      </div>
      <div class="content shimmer-block">
        <div class="line-title shimmer" />
        <div class="line-sub shimmer" />
        <div class="line-meta shimmer" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 4,
  },
});
</script>

<style scoped>
.timeline-skeleton {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.timeline-item-skeleton {
  display: flex;
  gap: 16px;
  padding-bottom: 24px;
}

.dot-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 16px;
  flex-shrink: 0;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.line {
  width: 2px;
  flex: 1;
  min-height: 60px;
  margin-top: 4px;
}

.content {
  flex: 1;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  min-height: 80px;
}

.line-title {
  height: 18px;
  width: 40%;
  margin-bottom: 10px;
  border-radius: 4px;
}

.line-sub {
  height: 14px;
  width: 65%;
  margin-bottom: 8px;
  border-radius: 4px;
}

.line-meta {
  height: 14px;
  width: 50%;
  border-radius: 4px;
}

.shimmer,
.shimmer-block {
  background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
