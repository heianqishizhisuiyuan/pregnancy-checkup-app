<template>
  <div class="timeline-page">
    <div class="header">
      <h1>产检时间轴</h1>
    </div>

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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Loading } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import TimelineItem from '@/components/TimelineItem.vue';
import { getRecords } from '@/api/record';

const router = useRouter();
const loading = ref(true);
const records = ref([]);

// 获取记录列表
const fetchRecords = async () => {
  try {
    loading.value = true;
    const response = await getRecords();
    records.value = response.data;
  } catch (error) {
    console.error('获取记录失败:', error);
    ElMessage.error('获取记录失败');
  } finally {
    loading.value = false;
  }
};

// 跳转到详情页
const goToDetail = (recordId) => {
  router.push(`/record/${recordId}`);
};

// 跳转到添加记录页
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

.header {
  max-width: 800px;
  margin: 0 auto 32px;
}

.header h1 {
  font-size: 32px;
  font-weight: 600;
  color: #1F2421;
  margin: 0;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 60px 20px;
  color: #5C635D;
}

.empty {
  display: flex;
  justify-content: center;
  padding: 60px 20px;
}

.timeline-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(31, 36, 33, 0.04);
}

@media (max-width: 768px) {
  .timeline-page {
    padding: 16px;
  }

  .header h1 {
    font-size: 24px;
  }

  .timeline-container {
    padding: 16px;
  }
}
</style>
