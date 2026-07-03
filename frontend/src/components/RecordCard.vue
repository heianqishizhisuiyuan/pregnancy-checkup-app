<template>
  <div class="record-card" @click="handleClick">
    <div class="card-header">
      <div class="date-info">
        <div class="date">{{ formatDate(record.checkupDate, 'MM月DD日') }}</div>
        <div class="gestational">{{ formatGestational }}</div>
      </div>
      <div v-if="isLatest" class="latest-badge">最新</div>
    </div>

    <div class="location">
      <el-icon class="location-icon"><Location /></el-icon>
      <span>{{ record.hospital }}</span>
      <span class="separator">·</span>
      <span>{{ record.doctor }}</span>
    </div>

    <div class="vitals" v-if="hasVitals">
      <div class="vital-item" v-if="record.vitals?.weight">
        <span class="vital-label">体重</span>
        <span class="vital-value">{{ record.vitals.weight }} kg</span>
      </div>
      <div class="vital-item" v-if="record.vitals?.bloodPressure?.systolic && record.vitals?.bloodPressure?.diastolic">
        <span class="vital-label">血压</span>
        <span class="vital-value">{{ bloodPressure }}</span>
      </div>
      <div class="vital-item" v-if="record.vitals?.fetalHeartRate">
        <span class="vital-label">胎心</span>
        <span class="vital-value">{{ record.vitals.fetalHeartRate }} 次/分</span>
      </div>
    </div>

    <div class="footer" v-if="record.createdBy">
      <span class="creator">记录人：{{ record.createdBy.profile?.nickname || record.createdBy.username }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Location } from '@element-plus/icons-vue';
import { formatDate, formatGestationalAge } from '@/utils/date';

const props = defineProps({
  record: {
    type: Object,
    required: true,
  },
  isLatest: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();

const formatGestational = computed(() => {
  return formatGestationalAge(props.record.gestationalWeek, props.record.gestationalDay);
});

const bloodPressure = computed(() => {
  const bp = props.record.vitals?.bloodPressure;
  if (!bp) return '';
  return `${bp.systolic}/${bp.diastolic}`;
});

const hasVitals = computed(() => {
  const vitals = props.record.vitals;
  if (!vitals) return false;
  return vitals.weight ||
         (vitals.bloodPressure?.systolic && vitals.bloodPressure?.diastolic) ||
         vitals.fetalHeartRate;
});

const handleClick = () => {
  router.push({ name: 'RecordDetail', params: { id: props.record._id } });
};
</script>

<style scoped>
.record-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--color-border);
}

.record-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--color-accent-light);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.date-info {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
}

.date {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.gestational {
  font-size: 0.875rem;
  color: var(--color-accent);
  font-weight: 500;
}

.latest-badge {
  background: var(--color-accent);
  color: white;
  padding: 2px var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
}

.location {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
}

.location-icon {
  font-size: 1rem;
  color: var(--color-accent);
  flex-shrink: 0;
}

.separator {
  margin: 0 var(--spacing-xs);
}

.vitals {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-bg-surface);
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-sm);
}

.vital-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vital-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.vital-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.footer {
  display: flex;
  justify-content: flex-end;
}

.creator {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}
</style>
