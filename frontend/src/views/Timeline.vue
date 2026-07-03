<template>
  <div class="timeline-page">
    <header class="page-header">
      <el-button @click="goBack" text :icon="ArrowLeft">返回</el-button>
      <div class="header-text">
        <h1>产检时间轴</h1>
        <p v-if="records.length > 0" class="header-hint">共 {{ records.length }} 次产检</p>
      </div>
    </header>

    <div v-if="loading" class="loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      加载中...
    </div>

    <div v-else-if="records.length === 0" class="empty">
      <el-empty description="还没有产检记录">
        <el-button type="primary" @click="goToAddRecord">
          添加第一条记录
        </el-button>
      </el-empty>
    </div>

    <div v-else class="timeline-container">
      <TimelineItem
        v-for="record in records"
        :key="record._id"
        :record="record"
        @click="goToDetail"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Loading } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import TimelineItem from '@/components/TimelineItem.vue';
import { getRecords } from '@/api/record';
import { useRecordStore } from '@/stores/record';

const router = useRouter();
const recordStore = useRecordStore();
const loading = ref(true);
const records = computed(() => recordStore.records);

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

const goBack = () => {
  router.push('/');
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
  min-height: 100vh;
  background: #F7F4EF;
  padding: 24px;
}

.page-header {
  max-width: 800px;
  margin: 0 auto 24px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.header-text h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1F2421;
  margin: 0;
}

.header-hint {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: #6B7280;
}

.loading,
.empty {
  max-width: 800px;
  margin: 48px auto;
  text-align: center;
  color: #6B7280;
}

.timeline-container {
  max-width: 800px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .timeline-page {
    padding: 16px;
  }

  .header-text h1 {
    font-size: 1.25rem;
  }
}
</style>
