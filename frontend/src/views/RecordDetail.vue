<template>
  <div class="record-detail-container">
    <header class="detail-header">
      <el-button @click="handleBack" text>
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1 class="detail-title">记录详情</h1>
      <div style="width: 80px;"></div>
    </header>

    <main class="detail-main">
      <RecordDetailSkeleton v-if="loading" />

      <div v-else-if="record" class="record-detail">
        <el-alert
          v-if="!isOwner"
          type="info"
          :closable="false"
          show-icon
          class="readonly-alert"
          title="您为只读家人，可查看记录但无法编辑"
        />

        <nav v-if="navigationList.length > 1" class="record-nav">
          <el-button
            :disabled="!hasPrev"
            text
            @click="goToAdjacent(-1)"
          >
            <el-icon><ArrowLeft /></el-icon>
            上一条
          </el-button>
          <span class="nav-position">{{ navPosition }}</span>
          <el-button
            :disabled="!hasNext"
            text
            @click="goToAdjacent(1)"
          >
            下一条
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </nav>

        <div v-if="sameWeekRecords.length > 0" class="same-week-links">
          <span class="same-week-label">同孕周记录：</span>
          <router-link
            v-for="item in sameWeekRecords"
            :key="item._id"
            :to="{ name: 'RecordDetail', params: { id: item._id } }"
            class="same-week-link"
          >
            {{ formatDate(item.checkupDate, 'MM月DD日') }}
          </router-link>
        </div>

        <!-- 基本信息卡片 -->
        <div class="info-card">
          <div class="card-header">
            <h2 class="card-title">基本信息</h2>
            <div class="badge">{{ formatGestational }}</div>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">产检日期</span>
              <span class="info-value">{{ formatDate(record.checkupDate, 'YYYY年MM月DD日') }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">医院</span>
              <span class="info-value">{{ record.hospital }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">医生</span>
              <span class="info-value">{{ record.doctor }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">记录人</span>
              <span class="info-value">{{ record.createdBy?.profile?.nickname || record.createdBy?.username }}</span>
            </div>
          </div>
        </div>

        <!-- 生理指标卡片 -->
        <div class="vitals-card">
          <div class="vitals-card-header">
            <h2 class="card-title">生理指标</h2>
            <el-button text type="primary" @click="goToTrends">
              <el-icon><TrendCharts /></el-icon>
              查看趋势
            </el-button>
          </div>
          <div class="vitals-grid">
            <div class="vital-item" v-if="record.vitals?.weight">
              <div class="vital-icon">
                <el-icon :size="28"><Odometer /></el-icon>
              </div>
              <div class="vital-content">
                <span class="vital-label">体重</span>
                <span class="vital-value">{{ record.vitals.weight }} <span class="unit">kg</span></span>
              </div>
            </div>

            <div class="vital-item" v-if="record.vitals?.bloodPressure?.systolic && record.vitals?.bloodPressure?.diastolic">
              <div class="vital-icon">
                <el-icon :size="28"><TrendCharts /></el-icon>
              </div>
              <div class="vital-content">
                <span class="vital-label">血压</span>
                <span class="vital-value">
                  {{ record.vitals.bloodPressure.systolic }}/{{ record.vitals.bloodPressure.diastolic }}
                  <span class="unit">mmHg</span>
                </span>
              </div>
            </div>

            <div class="vital-item" v-if="record.vitals?.fundalHeight">
              <div class="vital-icon">
                <el-icon :size="28"><Compass /></el-icon>
              </div>
              <div class="vital-content">
                <span class="vital-label">宫高</span>
                <span class="vital-value">{{ record.vitals.fundalHeight }} <span class="unit">cm</span></span>
              </div>
            </div>

            <div class="vital-item" v-if="record.vitals?.abdominalCircumference">
              <div class="vital-icon">
                <el-icon :size="28"><Crop /></el-icon>
              </div>
              <div class="vital-content">
                <span class="vital-label">腹围</span>
                <span class="vital-value">{{ record.vitals.abdominalCircumference }} <span class="unit">cm</span></span>
              </div>
            </div>

            <div class="vital-item" v-if="record.vitals?.fetalHeartRate">
              <div class="vital-icon">
                <el-icon :size="28"><DataLine /></el-icon>
              </div>
              <div class="vital-content">
                <span class="vital-label">胎心率</span>
                <span class="vital-value">{{ record.vitals.fetalHeartRate }} <span class="unit">次/分</span></span>
              </div>
            </div>
          </div>

          <div v-if="!hasVitals" class="no-vitals">
            <span>暂无生理指标记录</span>
          </div>
        </div>

        <!-- 备注卡片 -->
        <div class="notes-card" v-if="record.notes">
          <h2 class="card-title">备注</h2>
          <p class="notes-content">{{ record.notes }}</p>
        </div>

        <!-- 检查报告 -->
        <div class="attachments-card">
          <h2 class="card-title">检查报告（{{ record.attachments?.length || 0 }}）</h2>

          <!-- 图片画廊（详情页仅查看） -->
          <div v-if="record.attachments && record.attachments.length > 0" class="gallery-section">
            <AttachmentGallery
              :record-id="recordId"
              :attachments="record.attachments"
              readonly
            />
          </div>

          <!-- 空状态 -->
          <div v-else class="empty-attachments">
            <el-empty description="暂无检查报告" :image-size="80" />
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="actions" v-if="isOwner">
          <el-button
            type="primary"
            size="large"
            @click="handleEdit"
            class="action-btn"
          >
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button
            size="large"
            @click="handleDelete"
            class="action-btn"
          >
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, ArrowRight, Edit, Delete, Odometer, TrendCharts, Compass, Crop, DataLine } from '@element-plus/icons-vue';
import { getRecordById, getRecords, deleteRecord as deleteRecordApi } from '@/api/record';
import { useAuthStore } from '@/stores/auth';
import { useRecordStore } from '@/stores/record';
import { formatDate, formatGestationalAge } from '@/utils/date';
import AttachmentGallery from '@/components/AttachmentGallery.vue';
import RecordDetailSkeleton from '@/components/skeletons/RecordDetailSkeleton.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const recordStore = useRecordStore();

const loading = ref(false);
const record = ref(null);
const navigationList = ref([]);
const recordId = computed(() => route.params.id);

const currentNavIndex = computed(() =>
  navigationList.value.findIndex((item) => item._id === recordId.value)
);

const hasPrev = computed(() => currentNavIndex.value > 0);
const hasNext = computed(() =>
  currentNavIndex.value >= 0 && currentNavIndex.value < navigationList.value.length - 1
);

const navPosition = computed(() => {
  if (currentNavIndex.value < 0 || navigationList.value.length === 0) return '';
  return `${currentNavIndex.value + 1} / ${navigationList.value.length}`;
});

const sameWeekRecords = computed(() => {
  if (!record.value) return [];
  return navigationList.value.filter(
    (item) =>
      item._id !== recordId.value &&
      item.gestationalWeek === record.value.gestationalWeek
  );
});

const isOwner = computed(() => authStore.isOwner);

const formatGestational = computed(() => {
  if (!record.value) return '';
  return formatGestationalAge(record.value.gestationalWeek, record.value.gestationalDay);
});

const hasVitals = computed(() => {
  if (!record.value?.vitals) return false;
  const vitals = record.value.vitals;
  return vitals.weight ||
         (vitals.bloodPressure?.systolic && vitals.bloodPressure?.diastolic) ||
         vitals.fundalHeight ||
         vitals.abdominalCircumference ||
         vitals.fetalHeartRate;
});

const goToTrends = () => {
  router.push({ name: 'Trends' });
};

const goToAdjacent = (delta) => {
  const index = currentNavIndex.value + delta;
  const target = navigationList.value[index];
  if (target) {
    router.push({ name: 'RecordDetail', params: { id: target._id } });
  }
};

const loadNavigationList = async () => {
  try {
    const response = await getRecords();
    if (response.success) {
      navigationList.value = response.data.map((item) => ({
        _id: item._id,
        checkupDate: item.checkupDate,
        gestationalWeek: item.gestationalWeek,
        gestationalDay: item.gestationalDay,
      }));
    }
  } catch (error) {
    console.error('Failed to load navigation list:', error);
  }
};

// 加载记录
const refreshRecord = async () => {
  loading.value = true;
  try {
    const response = await getRecordById(recordId.value);
    if (response.success) {
      record.value = response.data;
    }
  } catch (error) {
    console.error('Failed to load record:', error);
    ElMessage.error('加载记录失败');
  } finally {
    loading.value = false;
  }
};

// 编辑
const handleEdit = () => {
  router.push({ name: 'RecordEdit', params: { id: route.params.id } });
};

// 删除
const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？删除后无法恢复。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    loading.value = true;
    const response = await deleteRecordApi(route.params.id);

    if (response.success) {
      recordStore.deleteRecord(route.params.id);
      ElMessage.success('删除成功');
      router.push({ name: 'Home' });
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete record:', error);
      ElMessage.error('删除失败');
    }
  } finally {
    loading.value = false;
  }
};

// 返回
const handleBack = () => {
  router.back();
};

onMounted(() => {
  refreshRecord();
  loadNavigationList();
});

watch(recordId, () => {
  refreshRecord();
});
</script>

<style scoped>
.record-detail-container {
  min-height: 100vh;
  background: var(--color-bg-primary);
}

.detail-header {
  background: var(--color-bg-white);
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.detail-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.detail-main {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

/* 记录详情 */
.record-detail {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.readonly-alert {
  margin-bottom: 0;
}

.record-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-white);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.nav-position {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.same-week-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-xs) var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-surface);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.same-week-label {
  color: var(--color-text-secondary);
}

.same-week-link {
  color: var(--color-accent);
  text-decoration: none;
}

.same-week-link:hover {
  text-decoration: underline;
}

/* 卡片通用样式 */
.info-card,
.vitals-card,
.notes-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0;
}

.vitals-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.vitals-card-header .card-title {
  margin-bottom: 0;
}

.badge {
  background: var(--color-accent-light);
  color: var(--color-accent);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 500;
}

/* 基本信息 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.info-value {
  font-size: 1rem;
  color: var(--color-text-primary);
  font-weight: 500;
}

/* 生理指标 */
.vitals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.vital-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-surface);
  border-radius: var(--radius-md);
}

.vital-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-md);
  background: var(--color-accent-light);
  color: var(--color-accent);
  flex-shrink: 0;
}

.vital-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.vital-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.vital-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.unit {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--color-text-secondary);
}

.no-vitals {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

/* 备注 */
.notes-content {
  color: var(--color-text-primary);
  line-height: 1.8;
  white-space: pre-wrap;
}

/* 操作按钮 */
.actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  padding-top: var(--spacing-lg);
}

.action-btn {
  border-radius: var(--radius-full);
  font-weight: 500;
  min-width: 120px;
}

/* 附件区域 */
.attachments-card {
  background: var(--color-bg-soft);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--color-border);
}
.gallery-section {
  margin-top: var(--spacing-md);
}

.empty-attachments {
  padding: var(--spacing-xl) 0;
}

@media (max-width: 640px) {
  .detail-main {
    padding: var(--spacing-lg) var(--spacing-md);
  }

  .info-card,
  .vitals-card,
  .notes-card,
  .attachments-card {
    padding: var(--spacing-lg);
  }

  .actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
