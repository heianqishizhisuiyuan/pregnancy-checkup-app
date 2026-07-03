<template>
  <div class="timeline-page">
    <header class="page-header">
      <div class="header-text">
        <h1>产检时间轴</h1>
        <p v-if="!loading && records.length > 0" class="header-hint">共 {{ records.length }} 次产检</p>
      </div>
    </header>

    <TimelineListSkeleton v-if="loading" />

    <div v-else-if="records.length === 0" class="empty">
      <el-empty :description="emptyDescription">
        <el-button v-if="isOwner" type="primary" @click="goToAddRecord">
          添加第一条记录
        </el-button>
      </el-empty>
    </div>

    <div v-else class="timeline-container">
      <template v-for="group in groupedRecords" :key="group.key">
        <div class="month-header">{{ group.label }}</div>
        <TimelineItem
          v-for="record in group.records"
          :key="record._id"
          :record="record"
          @click="goToDetail"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import TimelineItem from '@/components/TimelineItem.vue';
import TimelineListSkeleton from '@/components/skeletons/TimelineListSkeleton.vue';
import { getRecords } from '@/api/record';
import { useRecordStore } from '@/stores/record';
import { useAuthStore } from '@/stores/auth';
import { groupRecordsByMonth } from '@/utils/timelineGroups.js';

const router = useRouter();
const recordStore = useRecordStore();
const authStore = useAuthStore();
const loading = ref(true);
const records = computed(() => recordStore.records);
const groupedRecords = computed(() => groupRecordsByMonth(records.value));
const isOwner = computed(() => authStore.isOwner);

const emptyDescription = computed(() => (
  isOwner.value ? '还没有产检记录' : '还没有产检记录，请联系主账号添加'
));

const fetchRecords = async () => {
  if (recordStore.records.length > 0) {
    loading.value = false;
  }

  try {
    const response = await getRecords();
    if (response.success) {
      recordStore.setRecords(response.data);
    }
  } catch (error) {
    console.error('获取记录失败:', error);
    ElMessage.error('获取记录失败');
  } finally {
    loading.value = false;
  }
};

const goToDetail = (recordId) => {
  router.push(`/record/${recordId}`);
};

const goToAddRecord = () => {
  router.push('/record/new');
};

onMounted(() => {
  fetchRecords();
});
</script>

<style scoped>
.timeline-page {
  background: var(--color-bg-primary);
  padding: var(--spacing-lg);
}

.page-header {
  max-width: 800px;
  margin: 0 auto var(--spacing-lg);
}

.header-text h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.header-hint {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.empty {
  max-width: 800px;
  margin: var(--spacing-xl) auto;
  text-align: center;
}

.timeline-container {
  max-width: 800px;
  margin: 0 auto;
}

.month-header {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: var(--spacing-lg) 0 var(--spacing-md);
  padding-left: 40px;
}

.month-header:first-child {
  margin-top: 0;
}

@media (max-width: 768px) {
  .timeline-page {
    padding: var(--spacing-md);
  }
}
</style>
