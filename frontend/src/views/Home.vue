<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <header class="navbar">
      <div class="navbar-content">
        <div class="logo-section">
          <span class="logo">💝</span>
          <span class="app-name">孕期记录</span>
        </div>
        <div class="user-section">
          <span class="username">{{ user?.profile?.nickname || user?.username }}</span>
          <el-button @click="goToTrends" text :icon="TrendCharts">
            <span class="nav-label">趋势</span>
          </el-button>
          <el-button @click="goToTimeline" text :icon="Clock">
            <span class="nav-label">时间轴</span>
          </el-button>
          <el-button @click="goToProfile" text :icon="User">
            <span class="nav-label">账号</span>
          </el-button>
          <el-button v-if="isOwner" @click="handleSettings" text :icon="Setting">
            <span class="nav-label">设置</span>
          </el-button>
          <el-button @click="handleLogout" text>
            <span class="nav-label">退出</span>
          </el-button>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 快速统计卡片 -->
      <StatsCardsSkeleton v-if="loading" />
      <div v-else class="stats-section">
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon :size="28"><Female /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">当前孕周</div>
            <div class="stat-value">{{ gestationalAgeText }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <el-icon :size="28"><Calendar /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">距离预产期</div>
            <div class="stat-value">{{ daysUntilDueText }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <el-icon :size="28"><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">已完成产检</div>
            <div class="stat-value">{{ totalRecordCount }} 次</div>
          </div>
        </div>
      </div>

      <!-- 记录列表 -->
      <div class="records-section">
        <div class="section-header">
          <h2 class="section-title">产检记录</h2>
          <div class="section-actions">
            <span class="record-count">
              {{ recordCountText }}
            </span>
            <el-tooltip :content="filterExpanded ? '收起筛选' : '筛选'" placement="top">
              <el-badge :value="activeFilterCount" :hidden="activeFilterCount === 0" :max="9">
                <el-button
                  text
                  :icon="filterExpanded ? ArrowUp : Filter"
                  @click="filterExpanded = !filterExpanded"
                />
              </el-badge>
            </el-tooltip>
            <el-dropdown v-if="totalRecords > 0" trigger="click" @command="handleExport">
              <el-button text :icon="Download">导出</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="excel">导出 Excel</el-dropdown-item>
                  <el-dropdown-item command="pdf">导出 PDF（打印）</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <RecordFilterBar v-model="filters" v-model:expanded="filterExpanded" @search="handleSearch" />

        <RecordListSkeleton v-if="loading" />

        <div v-else-if="records.length === 0" class="empty-state">
          <div class="empty-icon">
            <el-icon :size="48"><Document /></el-icon>
          </div>
          <p class="empty-text">{{ hasActiveFilter ? '没有符合条件的记录' : '还没有产检记录' }}</p>
          <p v-if="!hasActiveFilter && isOwner" class="empty-hint">点击右下角按钮添加第一条记录</p>
        </div>

        <div v-else class="records-list">
          <RecordCard
            v-for="(record, index) in records"
            :key="record._id"
            :record="record"
            :is-latest="!hasActiveFilter && currentPage === 1 && index === 0"
          />
        </div>

        <div v-if="!loading && totalRecords > pageSize" class="pagination-wrap">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="totalRecords"
            :page-sizes="[10, 20, 50]"
            :layout="paginationLayout"
            :small="isNarrowScreen"
            background
            @current-change="handlePageChange"
            @size-change="handlePageSizeChange"
          />
        </div>
      </div>
    </main>

    <!-- 浮动添加按钮 -->
    <el-button
      v-if="isOwner"
      type="primary"
      circle
      size="large"
      class="fab"
      @click="handleAddRecord"
    >
      <el-icon><Plus /></el-icon>
    </el-button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Plus, Setting, Clock, Female, Calendar, Document,
  TrendCharts, Download, Filter, ArrowUp, User,
} from '@element-plus/icons-vue';
import RecordCard from '@/components/RecordCard.vue';
import RecordFilterBar from '@/components/RecordFilterBar.vue';
import StatsCardsSkeleton from '@/components/skeletons/StatsCardsSkeleton.vue';
import RecordListSkeleton from '@/components/skeletons/RecordListSkeleton.vue';
import { useAuthStore } from '@/stores/auth';
import { useRecordStore } from '@/stores/record';
import { useFamilyStore } from '@/stores/family';
import { getRecords } from '@/api/record';
import { getFamily } from '@/api/family';
import { formatGestationalAge } from '@/utils/date';
import { exportRecordsToExcel, exportRecordsToPdf } from '@/utils/exportRecords';

const router = useRouter();
const authStore = useAuthStore();
const recordStore = useRecordStore();
const familyStore = useFamilyStore();

const loading = ref(false);
const isNarrowScreen = ref(false);
const filters = ref({});
const filterExpanded = ref(false);
const totalRecordCount = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const totalRecords = ref(0);

const user = computed(() => authStore.user);
const isOwner = computed(() => authStore.isOwner);
const records = computed(() => recordStore.records);

const hasActiveFilter = computed(() => Object.keys(filters.value).length > 0);

const activeFilterCount = computed(() => Object.keys(filters.value).length);

const paginationLayout = computed(() => (
  isNarrowScreen.value ? 'prev, pager, next' : 'total, sizes, prev, pager, next'
));

const recordCountText = computed(() => {
  if (hasActiveFilter.value) {
    return `筛选结果 ${totalRecords.value} 条`;
  }
  return `共 ${totalRecords.value} 条记录`;
});

const gestationalAgeText = computed(() => {
  const age = familyStore.currentGestationalAge;
  if (!age) return '未设置';
  return formatGestationalAge(age.weeks, age.days);
});

const daysUntilDueText = computed(() => {
  const days = familyStore.daysUntilDue;
  if (days === null) return '未设置';
  if (days < 0) return '已过预产期';
  return `${days} 天`;
});

const loadRecords = async (params = {}, page = currentPage.value) => {
  loading.value = true;
  try {
    const recordsRes = await getRecords({
      ...params,
      page,
      limit: pageSize.value,
    });
    if (recordsRes.success) {
      recordStore.setRecords(recordsRes.data);
      totalRecords.value = recordsRes.pagination?.total ?? recordsRes.data.length;
    }
  } catch (error) {
    console.error('Failed to load records:', error);
    ElMessage.error('加载记录失败');
  } finally {
    loading.value = false;
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [recordsRes, familyRes] = await Promise.all([
      getRecords({ page: currentPage.value, limit: pageSize.value }),
      getFamily(),
    ]);

    if (recordsRes.success) {
      recordStore.setRecords(recordsRes.data);
      totalRecords.value = recordsRes.pagination?.total ?? recordsRes.data.length;
      totalRecordCount.value = totalRecords.value;
    }

    if (familyRes.success) {
      familyStore.setFamily(familyRes.data);
    }
  } catch (error) {
    console.error('Failed to load data:', error);
    ElMessage.error('加载数据失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = (params) => {
  currentPage.value = 1;
  loadRecords(params, 1);
};

const handlePageChange = (page) => {
  loadRecords(filters.value, page);
};

const handlePageSizeChange = () => {
  currentPage.value = 1;
  loadRecords(filters.value, 1);
};

const handleExport = async (command) => {
  const familyName = familyStore.family?.name || '';
  const filename = `产检记录_${new Date().toISOString().slice(0, 10)}`;

  try {
    const exportRes = await getRecords(filters.value);
    const exportData = exportRes.success ? exportRes.data : records.value;

    if (command === 'excel') {
      exportRecordsToExcel(exportData, filename);
      ElMessage.success('Excel 导出成功');
    } else if (command === 'pdf') {
      exportRecordsToPdf(exportData, { title: '产检记录', familyName });
    }
  } catch (error) {
    console.error('Export failed:', error);
    ElMessage.error(error.message || '导出失败');
  }
};

const handleAddRecord = () => {
  router.push({ name: 'RecordNew' });
};

const goToTrends = () => {
  router.push({ name: 'Trends' });
};

const goToTimeline = () => {
  router.push('/timeline');
};

const goToProfile = () => {
  router.push({ name: 'Profile' });
};

const handleSettings = () => {
  router.push({ name: 'FamilyEdit' });
};

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    authStore.logout();
    ElMessage.success('已退出登录');
    router.push({ name: 'Login' });
  } catch {
    // 用户取消
  }
};

let narrowMediaQuery;
let updateNarrowScreen;

onMounted(() => {
  narrowMediaQuery = window.matchMedia('(max-width: 640px)');
  updateNarrowScreen = (event) => {
    isNarrowScreen.value = event.matches;
  };
  isNarrowScreen.value = narrowMediaQuery.matches;
  narrowMediaQuery.addEventListener('change', updateNarrowScreen);

  loadData();
});

onBeforeUnmount(() => {
  if (narrowMediaQuery && updateNarrowScreen) {
    narrowMediaQuery.removeEventListener('change', updateNarrowScreen);
  }
});
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: var(--color-bg-primary);
}

.navbar {
  background: var(--color-bg-white);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.navbar-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.logo {
  font-size: 1.5rem;
}

.app-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.user-section {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.user-section :deep(.el-button) {
  padding: 2px 6px;
  margin-left: 0;
}

.username {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-md);
  background: var(--color-accent-light);
  color: var(--color-accent);
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-accent);
}

.records-section {
  background: var(--color-bg-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.section-actions :deep(.el-button) {
  padding: 2px 6px;
  margin-left: 0;
}

.record-count {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  gap: var(--spacing-sm);
  color: var(--color-text-secondary);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-md);
}

.empty-icon {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-secondary);
  opacity: 0.6;
}

.empty-text {
  font-size: 1.125rem;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.empty-hint {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.fab {
  position: fixed;
  bottom: calc(var(--spacing-xl) + env(safe-area-inset-bottom, 0px));
  right: calc(var(--spacing-xl) + env(safe-area-inset-right, 0px));
  width: 56px;
  height: 56px;
  box-shadow: var(--shadow-lg);
  font-size: 1.5rem;
}

@media (max-width: 640px) {
  .navbar-content {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .app-name {
    font-size: 1.1rem;
  }

  .username {
    max-width: 72px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nav-label {
    display: none;
  }

  .main-content {
    padding: var(--spacing-lg) var(--spacing-md);
    padding-bottom: calc(var(--spacing-xl) + 56px + env(safe-area-inset-bottom, 0px));
  }

  .records-section {
    padding: var(--spacing-lg);
  }

  .fab {
    bottom: calc(var(--spacing-lg) + env(safe-area-inset-bottom, 0px));
    right: calc(var(--spacing-lg) + env(safe-area-inset-right, 0px));
  }
}

.fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(196, 97, 47, 0.3);
}
</style>
