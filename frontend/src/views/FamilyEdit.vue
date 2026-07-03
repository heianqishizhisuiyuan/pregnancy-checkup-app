<template>
  <div class="family-edit-container">
    <div class="edit-card">
      <div class="card-header">
        <el-button @click="handleBack" text :icon="ArrowLeft">返回</el-button>
        <h1 class="title">家庭信息设置</h1>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
        class="edit-form"
      >
        <el-form-item label="家庭名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入家庭名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-divider content-position="left">
          <span class="divider-text">孕期信息</span>
        </el-divider>

        <el-form-item label="末次月经" prop="lastPeriod">
          <el-date-picker
            v-model="formData.lastPeriod"
            type="date"
            placeholder="选择末次月经日期"
            style="width: 100%"
            :disabled-date="disabledDate"
          />
          <div class="form-tip">
            用于自动计算当前孕周
          </div>
        </el-form-item>

        <el-form-item label="预产期" prop="dueDate">
          <el-date-picker
            v-model="formData.dueDate"
            type="date"
            placeholder="选择预产期"
            style="width: 100%"
            :disabled-date="disabledDateDue"
          />
          <div class="form-tip">
            用于计算距离预产期的天数
          </div>
        </el-form-item>

        <el-form-item v-if="currentGestationalAge" class="info-item">
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">当前孕周：</span>
              <span class="info-value">{{ gestationalAgeText }}</span>
            </div>
            <div class="info-row" v-if="daysUntilDue !== null">
              <span class="info-label">距离预产期：</span>
              <span class="info-value">{{ daysUntilDueText }}</span>
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleSubmit"
            size="large"
          >
            保存
          </el-button>
          <el-button @click="handleBack" size="large">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import { useFamilyStore } from '@/stores/family';
import { getFamily, updateFamily } from '@/api/family';
import { calculateGestationalAge, calculateDaysUntilDue, formatGestationalAge } from '@/utils/date';
import dayjs from 'dayjs';

const router = useRouter();
const familyStore = useFamilyStore();

const formRef = ref(null);
const loading = ref(false);
const originalData = ref(null);

const formData = reactive({
  name: '',
  lastPeriod: null,
  dueDate: null,
});

const rules = {
  name: [
    { required: true, message: '请输入家庭名称', trigger: 'blur' },
    { min: 2, max: 50, message: '家庭名称应在2-50个字符之间', trigger: 'blur' },
  ],
};

// 计算属性
const currentGestationalAge = computed(() => {
  if (!formData.lastPeriod) return null;
  return calculateGestationalAge(formData.lastPeriod);
});

const gestationalAgeText = computed(() => {
  if (!currentGestationalAge.value) return '';
  const { weeks, days } = currentGestationalAge.value;
  return formatGestationalAge(weeks, days);
});

const daysUntilDue = computed(() => {
  if (!formData.dueDate) return null;
  return calculateDaysUntilDue(formData.dueDate);
});

const daysUntilDueText = computed(() => {
  const days = daysUntilDue.value;
  if (days === null) return '';
  if (days < 0) return '已过预产期';
  return `${days} 天`;
});

// 禁用未来日期
const disabledDate = (date) => {
  return date > new Date();
};

// 禁用过去日期（预产期应该在未来）
const disabledDateDue = (date) => {
  return date < new Date();
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const res = await getFamily();
    if (res.success && res.data) {
      originalData.value = res.data;
      formData.name = res.data.name || '';
      formData.lastPeriod = res.data.pregnancyInfo?.lastPeriod
        ? new Date(res.data.pregnancyInfo.lastPeriod)
        : null;
      formData.dueDate = res.data.pregnancyInfo?.dueDate
        ? new Date(res.data.pregnancyInfo.dueDate)
        : null;
    }
  } catch (error) {
    console.error('Failed to load family data:', error);
    ElMessage.error('加载家庭信息失败');
  } finally {
    loading.value = false;
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  loading.value = true;
  try {
    const updateData = {
      name: formData.name,
      pregnancyInfo: {
        lastPeriod: formData.lastPeriod ? dayjs(formData.lastPeriod).format('YYYY-MM-DD') : undefined,
        dueDate: formData.dueDate ? dayjs(formData.dueDate).format('YYYY-MM-DD') : undefined,
      },
    };

    const res = await updateFamily(updateData);
    if (res.success) {
      ElMessage.success('保存成功');
      // 更新 store
      familyStore.setFamily(res.data);
      router.back();
    }
  } catch (error) {
    console.error('Failed to update family:', error);
    ElMessage.error('保存失败');
  } finally {
    loading.value = false;
  }
};

// 返回
const handleBack = () => {
  router.back();
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.family-edit-container {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: var(--spacing-xl) var(--spacing-lg);
}

.edit-card {
  max-width: 600px;
  margin: 0 auto;
  background: var(--color-bg-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.edit-form {
  margin-top: var(--spacing-lg);
}

.divider-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.form-tip {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}

.info-item {
  margin-bottom: var(--spacing-lg);
}

.info-card {
  background: var(--color-accent-light);
  border-radius: var(--radius-sm);
  padding: var(--spacing-md);
}

.info-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.info-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-accent);
}
</style>
