<template>
  <div v-if="visible" class="setup-banner">
    <div class="banner-icon">📅</div>
    <div class="banner-body">
      <div class="banner-title">完善孕期信息</div>
      <p class="banner-text">填写末次月经后，系统将自动计算孕周并在新建记录时自动填充</p>
    </div>
    <el-button type="primary" size="small" @click="goToSettings">去设置</el-button>
    <el-button text size="small" class="dismiss-btn" @click="dismiss">暂不</el-button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  hasLastPeriod: {
    type: Boolean,
    default: false,
  },
  isOwner: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();
const dismissed = ref(false);

const DISMISS_KEY = 'pregnancy_setup_banner_dismissed';

const visible = computed(() => props.isOwner && !props.hasLastPeriod && !dismissed.value);

const goToSettings = () => {
  router.push({ name: 'FamilyEdit' });
};

const dismiss = () => {
  dismissed.value = true;
  localStorage.setItem(DISMISS_KEY, '1');
};

onMounted(() => {
  if (localStorage.getItem(DISMISS_KEY) === '1') {
    dismissed.value = true;
  }
});
</script>

<style scoped>
.setup-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  background: linear-gradient(135deg, #fff 0%, var(--color-accent-light) 100%);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  flex-wrap: wrap;
}

.banner-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.banner-body {
  flex: 1;
  min-width: 180px;
}

.banner-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.banner-text {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.dismiss-btn {
  color: var(--color-text-secondary);
}
</style>
