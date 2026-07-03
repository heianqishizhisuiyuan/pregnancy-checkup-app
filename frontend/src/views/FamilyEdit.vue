<template>
  <div class="family-edit-container">
    <div class="edit-card">
      <div class="card-header">
        <el-button @click="handleBack" text :icon="ArrowLeft">返回</el-button>
        <h1 class="title">家庭设置</h1>
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

        <el-form-item label="下次产检" prop="nextCheckupDate">
          <el-date-picker
            v-model="formData.nextCheckupDate"
            type="date"
            placeholder="选择下次产检日期"
            style="width: 100%"
          />
          <div class="form-tip">
            设置后首页将显示提醒，并可开启浏览器通知
          </div>
        </el-form-item>

        <el-form-item label="提前提醒" prop="reminderDaysBefore">
          <el-select v-model="formData.reminderDaysBefore" style="width: 100%">
            <el-option label="当天" :value="0" />
            <el-option label="提前 1 天" :value="1" />
            <el-option label="提前 2 天" :value="2" />
            <el-option label="提前 3 天" :value="3" />
            <el-option label="提前 7 天" :value="7" />
          </el-select>
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

        <el-divider v-if="isOwner" content-position="left">
          <span class="divider-text">家人邀请</span>
        </el-divider>

        <el-form-item v-if="isOwner" label="邀请码">
          <div class="invite-row">
            <el-input :model-value="inviteCode" readonly class="invite-code-input" />
            <el-button @click="handleCopyInvite" :icon="CopyDocument">复制</el-button>
            <el-button @click="handleRegenerateInvite" :loading="inviteLoading">重新生成</el-button>
          </div>
          <div class="form-tip">
            家人注册时选择「加入家庭」并输入此邀请码；主账号可在下方为成员开启编辑权限
          </div>
        </el-form-item>

        <el-form-item v-if="isOwner && members.length" label="家庭成员">
          <div class="members-list">
            <div v-for="member in members" :key="member.userId?._id || member.userId" class="member-item">
              <span class="member-name">
                {{ member.userId?.profile?.nickname || member.userId?.username || '未知用户' }}
              </span>
              <div class="member-actions">
                <el-tag size="small" :type="getMemberTagType(member)">
                  {{ getMemberRoleLabel(member) }}
                </el-tag>
                <el-switch
                  v-if="member.role !== 'owner'"
                  :model-value="!!member.userId?.canEdit"
                  :loading="updatingPermissionId === (member.userId?._id || member.userId)"
                  active-text="允许编辑"
                  inline-prompt
                  @change="(value) => handleTogglePermission(member, value)"
                />
                <el-button
                  v-if="member.role !== 'owner'"
                  type="danger"
                  text
                  size="small"
                  :loading="removingId === (member.userId?._id || member.userId)"
                  @click="handleRemoveMember(member)"
                >
                  移除
                </el-button>
              </div>
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, CopyDocument } from '@element-plus/icons-vue';
import { useFamilyStore } from '@/stores/family';
import { useAuthStore } from '@/stores/auth';
import { getFamily, updateFamily, getInviteCode, regenerateInviteCode, getMembers, removeMember, updateMemberPermissions } from '@/api/family';
import { calculateGestationalAge, calculateDaysUntilDue, formatGestationalAge } from '@/utils/date';
import dayjs from 'dayjs';

const router = useRouter();
const familyStore = useFamilyStore();
const authStore = useAuthStore();

const isOwner = computed(() => authStore.isOwner);

const formRef = ref(null);
const loading = ref(false);
const inviteLoading = ref(false);
const inviteCode = ref('');
const members = ref([]);
const removingId = ref(null);
const updatingPermissionId = ref(null);
const originalData = ref(null);

const formData = reactive({
  name: '',
  lastPeriod: null,
  dueDate: null,
  nextCheckupDate: null,
  reminderDaysBefore: 1,
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

function getMemberRoleLabel(member) {
  if (member.role === 'owner') return '主账号';
  if (member.userId?.canEdit) return '可编辑家人';
  return '只读家人';
}

function getMemberTagType(member) {
  if (member.role === 'owner') return 'warning';
  if (member.userId?.canEdit) return 'success';
  return 'info';
}

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const requests = [getFamily()];
    if (isOwner.value) {
      requests.push(getInviteCode(), getMembers());
    }

    const results = await Promise.all(requests);
    const familyRes = results[0];

    if (familyRes.success && familyRes.data) {
      originalData.value = familyRes.data;
      formData.name = familyRes.data.name || '';
      formData.lastPeriod = familyRes.data.pregnancyInfo?.lastPeriod
        ? new Date(familyRes.data.pregnancyInfo.lastPeriod)
        : null;
      formData.dueDate = familyRes.data.pregnancyInfo?.dueDate
        ? new Date(familyRes.data.pregnancyInfo.dueDate)
        : null;
      formData.nextCheckupDate = familyRes.data.pregnancyInfo?.nextCheckupDate
        ? new Date(familyRes.data.pregnancyInfo.nextCheckupDate)
        : null;
      formData.reminderDaysBefore = familyRes.data.pregnancyInfo?.reminderDaysBefore ?? 1;
    }

    if (isOwner.value) {
      const inviteRes = results[1];
      const membersRes = results[2];

      if (inviteRes?.success) {
        inviteCode.value = inviteRes.data.inviteCode;
      }

      if (membersRes?.success) {
        members.value = membersRes.data;
      }
    }
  } catch (error) {
    console.error('Failed to load family data:', error);
    ElMessage.error('加载家庭信息失败');
  } finally {
    loading.value = false;
  }
};

const handleTogglePermission = async (member, canEdit) => {
  const userId = member.userId?._id || member.userId;
  updatingPermissionId.value = userId;

  try {
    const res = await updateMemberPermissions(userId, canEdit);
    if (res.success) {
      if (member.userId && typeof member.userId === 'object') {
        member.userId.canEdit = canEdit;
      }
      ElMessage.success(canEdit ? '已开启编辑权限' : '已关闭编辑权限');
    }
  } catch (error) {
    console.error('Failed to update member permission:', error);
    ElMessage.error('更新权限失败');
  } finally {
    updatingPermissionId.value = null;
  }
};

const handleCopyInvite = async () => {
  if (!inviteCode.value) return;
  try {
    await navigator.clipboard.writeText(inviteCode.value);
    ElMessage.success('邀请码已复制');
  } catch {
    ElMessage.warning(`请手动复制：${inviteCode.value}`);
  }
};

const handleRegenerateInvite = async () => {
  inviteLoading.value = true;
  try {
    const res = await regenerateInviteCode();
    if (res.success) {
      inviteCode.value = res.data.inviteCode;
      ElMessage.success('邀请码已更新，旧邀请码将失效');
    }
  } catch (error) {
    console.error('Failed to regenerate invite code:', error);
    ElMessage.error('重新生成失败');
  } finally {
    inviteLoading.value = false;
  }
};

const handleRemoveMember = async (member) => {
  const userId = member.userId?._id || member.userId;
  const name = member.userId?.profile?.nickname || member.userId?.username || '该成员';

  try {
    await ElMessageBox.confirm(
      `确定移除「${name}」吗？移除后该账号将无法再访问家庭记录。`,
      '移除成员',
      { confirmButtonText: '移除', cancelButtonText: '取消', type: 'warning' }
    );
  } catch {
    return;
  }

  removingId.value = userId;
  try {
    const res = await removeMember(userId);
    if (res.success) {
      members.value = members.value.filter(
        (m) => (m.userId?._id || m.userId) !== userId
      );
      ElMessage.success('成员已移除');
    }
  } catch (error) {
    console.error('Failed to remove member:', error);
    ElMessage.error('移除失败');
  } finally {
    removingId.value = null;
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
        nextCheckupDate: formData.nextCheckupDate
          ? dayjs(formData.nextCheckupDate).format('YYYY-MM-DD')
          : null,
        reminderDaysBefore: formData.reminderDaysBefore,
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

.invite-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  width: 100%;
}

.invite-code-input {
  flex: 1;
  min-width: 160px;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  width: 100%;
}

.member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-surface);
  border-radius: var(--radius-sm);
}

.member-name {
  font-size: 0.9rem;
  color: var(--color-text-primary);
}

.member-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  justify-content: flex-end;
}
</style>
