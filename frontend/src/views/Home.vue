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
          <el-button @click="goToTimeline" text icon="Clock">时间轴</el-button>
          <el-button v-if="isOwner" @click="handleSettings" text icon="Setting">设置</el-button>
          <el-button @click="handleLogout" text>退出</el-button>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 快速统计卡片 -->
      <div class="stats-section">
        <div class="stat-card">
          <div class="stat-icon">🤰</div>
          <div class="stat-content">
            <div class="stat-label">当前孕周</div>
            <div class="stat-value">
              {{ gestationalAgeText }}
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-label">距离预产期</div>
            <div class="stat-value">
              {{ daysUntilDueText }}
            </div>
          </div>
        </div>
      </div>

      <!-- 记录列表 -->
      <div class="records-section">
        <div class="section-header">
          <h2 class="section-title">产检记录</h2>
          <span class="record-count">共 {{ records.length }} 条记录</span>
        </div>

        <div v-if="loading" class="loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>

        <div v-else-if="records.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <p class="empty-text">还没有产检记录</p>
          <p class="empty-hint">点击右下角按钮添加第一条记录</p>
        </div>

        <div v-else class="records-list">
          <RecordCard
            v-for="(record, index) in records"
            :key="record._id"
            :record="record"
            :is-latest="index === 0"
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Loading, Setting } from '@element-plus/icons-vue';
import RecordCard from '@/components/RecordCard.vue';
import { useAuthStore } from '@/stores/auth';
import { useRecordStore } from '@/stores/record';
import { useFamilyStore } from '@/stores/family';
import { getRecords } from '@/api/record';
import { getFamily } from '@/api/family';
import { formatGestationalAge } from '@/utils/date';

const router = useRouter();
const authStore = useAuthStore();
const recordStore = useRecordStore();
const familyStore = useFamilyStore();

const loading = ref(false);

// 计算属性
const user = computed(() => authStore.user);
const isOwner = computed(() => authStore.isOwner);
const records = computed(() => recordStore.records);

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

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const [recordsRes, familyRes] = await Promise.all([
      getRecords(),
      getFamily(),
    ]);

    if (recordsRes.success) {
      recordStore.setRecords(recordsRes.data);
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

// 添加记录
const handleAddRecord = () => {
  router.push({ name: 'RecordNew' });
};

// 家庭设置
const goToTimeline = () => {
  router.push('/timeline');
};

const handleSettings = () => {
  router.push({ name: 'FamilyEdit' });
};

// 退出登录
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

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: var(--color-bg-primary);
}

/* 顶部导航栏 */
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
  gap: var(--spacing-md);
}

.username {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

/* 主内容区 */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

/* 统计卡片 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
  font-size: 2.5rem;
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

/* 记录列表 */
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
  margin-bottom: var(--spacing-lg);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.record-count {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* 加载状态 */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  gap: var(--spacing-sm);
  color: var(--color-text-secondary);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-md);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
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

/* 记录列表 */
.records-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* 浮动添加按钮 */
.fab {
  position: fixed;
  bottom: var(--spacing-xl);
  right: var(--spacing-xl);
  width: 56px;
  height: 56px;
  box-shadow: var(--shadow-lg);
  font-size: 1.5rem;
}

.fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(196, 97, 47, 0.3);
}
</style>
