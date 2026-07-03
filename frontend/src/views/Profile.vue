<template>
  <div class="profile-container">
    <div class="profile-card">
      <div class="profile-header">
        <UserAvatar :name="displayName" size="lg" />
        <div class="profile-identity">
          <h1 class="nickname">{{ displayName }}</h1>
          <el-tag size="small" :type="isOwner ? 'warning' : 'info'">
            {{ isOwner ? '主账号' : '只读家人' }}
          </el-tag>
        </div>
        <ThemeToggle />
      </div>

      <PwaInstallBanner />

      <div class="offline-info">
        <div class="offline-info-title">离线说明</div>
        <p class="offline-info-text">
          安装到主屏幕后，弱网下可打开已访问过的页面；附件图片与实时数据需联网加载。
        </p>
      </div>

      <div v-if="familyLoading" class="section-loading">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else-if="familyStore.family" class="family-summary">
        <el-divider content-position="left">家庭概览</el-divider>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">家庭名称</span>
            <span class="summary-value">{{ familyStore.family.name }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">当前孕周</span>
            <span class="summary-value">{{ gestationalAgeText }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">下次产检</span>
            <span class="summary-value">{{ nextCheckupText }}</span>
          </div>
        </div>
      </div>

      <div v-if="members.length" class="members-section">
        <el-divider content-position="left">家庭成员</el-divider>
        <div class="members-list">
          <div
            v-for="member in members"
            :key="member.userId?._id || member.userId"
            class="member-item"
          >
            <UserAvatar
              :name="member.userId?.profile?.nickname || member.userId?.username || '?'"
              size="sm"
            />
            <span class="member-name">
              {{ member.userId?.profile?.nickname || member.userId?.username || '未知用户' }}
            </span>
            <el-tag size="small" :type="member.role === 'owner' ? 'warning' : 'info'">
              {{ member.role === 'owner' ? '主账号' : '家人' }}
            </el-tag>
          </div>
        </div>
      </div>

      <div v-if="isOwner" class="quick-links">
        <el-button type="primary" plain @click="goToFamilySettings">
          家庭设置与产检提醒
        </el-button>
      </div>

      <el-form
        ref="profileFormRef"
        :model="profileForm"
        :rules="profileRules"
        label-width="100px"
        class="profile-form"
      >
        <el-divider content-position="left">个人资料</el-divider>

        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="profileForm.nickname"
            placeholder="请输入昵称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="profileLoading" @click="handleSaveProfile">
            保存昵称
          </el-button>
        </el-form-item>
      </el-form>

      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
        class="profile-form"
      >
        <el-divider content-position="left">修改密码</el-divider>

        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            show-password
            placeholder="请输入原密码"
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            show-password
            placeholder="至少 6 位"
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password
            placeholder="再次输入新密码"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="passwordLoading" @click="handleChangePassword">
            修改密码
          </el-button>
        </el-form-item>
      </el-form>

      <div class="logout-section">
        <el-button type="danger" plain @click="handleLogout">
          退出登录
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import { useAuthStore } from '@/stores/auth';
import { useFamilyStore } from '@/stores/family';
import { updateProfile, updatePassword } from '@/api/auth';
import { getFamily, getMembers } from '@/api/family';
import { formatGestationalAge } from '@/utils/date';
import UserAvatar from '@/components/UserAvatar.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import PwaInstallBanner from '@/components/PwaInstallBanner.vue';

const router = useRouter();
const authStore = useAuthStore();
const familyStore = useFamilyStore();

const profileFormRef = ref(null);
const passwordFormRef = ref(null);
const profileLoading = ref(false);
const passwordLoading = ref(false);
const familyLoading = ref(false);
const members = ref([]);

const isOwner = computed(() => authStore.isOwner);
const displayName = computed(() => authStore.user?.profile?.nickname || authStore.user?.username || '');

const gestationalAgeText = computed(() => {
  const age = familyStore.currentGestationalAge;
  if (!age) return '未设置';
  return formatGestationalAge(age.weeks, age.days);
});

const nextCheckupText = computed(() => {
  const date = familyStore.nextCheckupDate;
  if (!date) return '未设置';
  return dayjs(date).format('YYYY年M月D日');
});

const profileForm = reactive({
  nickname: '',
});

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const profileRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { max: 50, message: '昵称最多 50 个字符', trigger: 'blur' },
  ],
};

const validateConfirmPassword = (_rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'));
    return;
  }
  callback();
};

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
};

const loadFamilyData = async () => {
  familyLoading.value = true;
  try {
    const [familyRes, membersRes] = await Promise.all([getFamily(), getMembers()]);
    if (familyRes.success) {
      familyStore.setFamily(familyRes.data);
    }
    if (membersRes.success) {
      members.value = membersRes.data;
    }
  } catch (error) {
    console.error('加载家庭信息失败:', error);
  } finally {
    familyLoading.value = false;
  }
};

const goToFamilySettings = () => {
  router.push({ name: 'FamilyEdit' });
};

const handleSaveProfile = async () => {
  try {
    await profileFormRef.value.validate();
    profileLoading.value = true;

    const response = await updateProfile({ nickname: profileForm.nickname });
    if (response.success) {
      authStore.setUser(response.data);
      ElMessage.success('昵称已更新');
    }
  } catch (error) {
    console.error('更新昵称失败:', error);
  } finally {
    profileLoading.value = false;
  }
};

const handleChangePassword = async () => {
  try {
    await passwordFormRef.value.validate();
    passwordLoading.value = true;

    const response = await updatePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });

    if (response.success) {
      authStore.setToken(response.data.token);
      authStore.setUser(response.data.user);
      passwordForm.oldPassword = '';
      passwordForm.newPassword = '';
      passwordForm.confirmPassword = '';
      passwordFormRef.value.resetFields();
      ElMessage.success('密码已修改');
    }
  } catch (error) {
    console.error('修改密码失败:', error);
  } finally {
    passwordLoading.value = false;
  }
};

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning',
    });
    authStore.logout();
    router.push({ name: 'Login' });
  } catch {
    // 用户取消
  }
};

onMounted(() => {
  profileForm.nickname = authStore.user?.profile?.nickname || authStore.user?.username || '';
  loadFamilyData();
});
</script>

<style scoped>
.profile-container {
  background: var(--color-bg-primary, #F7F4EF);
  padding: var(--spacing-lg, 24px);
}

.profile-card {
  max-width: 640px;
  margin: 0 auto;
  background: var(--color-bg-white, #FBF9F5);
  border-radius: var(--radius-lg, 16px);
  padding: var(--spacing-xl, 32px);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.08));
}

.profile-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.profile-identity {
  flex: 1;
  min-width: 0;
}

.nickname {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 6px;
  color: var(--color-text-primary, #1F2421);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.offline-info {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.offline-info-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.offline-info-text {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.section-loading {
  margin-bottom: var(--spacing-lg);
}

.family-summary {
  margin-bottom: var(--spacing-md);
}

.summary-grid {
  display: grid;
  gap: var(--spacing-sm);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.summary-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.members-section {
  margin-bottom: var(--spacing-md);
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.member-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 8px 12px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-sm);
}

.member-name {
  flex: 1;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-links {
  margin-bottom: 20px;
}

.profile-form {
  margin-bottom: 8px;
}

.logout-section {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  text-align: center;
}
</style>
