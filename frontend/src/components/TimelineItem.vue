<template>
  <div class="timeline-item">
    <div class="timeline-dot"></div>
    <div class="timeline-content">
      <div class="card" @click="handleClick">
        <div class="card-header">
          <div class="date-info">
            <div class="checkup-date">{{ formatDate(record.checkupDate) }}</div>
            <div class="gestational-age">
              {{ record.gestationalWeek }}周{{ record.gestationalDay > 0 ? `+${record.gestationalDay}天` : '' }}
            </div>
          </div>
          <div v-if="attachmentCount > 0" class="attachment-badge">
            <el-icon><Picture /></el-icon>
            {{ attachmentCount }}
          </div>
        </div>

        <div class="card-body">
          <div class="info-row">
            <span class="label">医院：</span>
            <span class="value">{{ record.hospital || '未填写' }}</span>
          </div>
          <div v-if="record.doctor" class="info-row">
            <span class="label">医生：</span>
            <span class="value">{{ record.doctor }}</span>
          </div>
          <div v-if="record.vitals" class="vitals-summary">
            <span v-if="record.vitals.weight" class="vital-item">
              体重 {{ record.vitals.weight }}kg
            </span>
            <span v-if="record.vitals.bloodPressure" class="vital-item">
              血压 {{ record.vitals.bloodPressure.systolic }}/{{ record.vitals.bloodPressure.diastolic }}
            </span>
            <span v-if="record.vitals.fetalHeartRate" class="vital-item">
              胎心 {{ record.vitals.fetalHeartRate }}次/分
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Picture } from '@element-plus/icons-vue';
import dayjs from 'dayjs';

const props = defineProps({
  record: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['click']);

const attachmentCount = computed(() => {
  return props.record.attachmentCount ?? props.record.attachments?.length ?? 0;
});

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD');
};

const handleClick = () => {
  emit('click', props.record._id);
};
</script>

<style scoped>
.timeline-item {
  position: relative;
  padding-left: 40px;
  padding-bottom: 32px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 24px;
  bottom: 0;
  width: 2px;
  background: #E7E1D7;
}

.timeline-item:last-child::before {
  display: none;
}

.timeline-dot {
  position: absolute;
  left: 0;
  top: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #C4612F;
  border: 4px solid #F7F4EF;
  box-shadow: 0 0 0 2px #C4612F;
}

.timeline-content {
  width: 100%;
}

.card {
  background: #FBF9F5;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #E7E1D7;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(31, 36, 33, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.date-info {
  flex: 1;
}

.checkup-date {
  font-size: 18px;
  font-weight: 600;
  color: #1F2421;
  margin-bottom: 4px;
}

.gestational-age {
  font-size: 14px;
  color: #5C635D;
}

.attachment-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: #F2E3D6;
  border-radius: 999px;
  font-size: 12px;
  color: #C4612F;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  font-size: 14px;
}

.label {
  color: #5C635D;
  min-width: 50px;
}

.value {
  color: #1F2421;
}

.vitals-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #E7E1D7;
}

.vital-item {
  font-size: 13px;
  color: #5C635D;
}
</style>
