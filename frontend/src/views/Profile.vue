<template>
  <div class="profile-container">
    <div class="profile-card">
      <div class="card-header">
        <h1 class="title">我的</h1>
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
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import { updateProfile, updatePassword } from '@/api/auth';

const router = useRouter();
const authStore = useAuthStore();

const profileFormRef = ref(null);
const passwordFormRef = ref(null);
const profileLoading = ref(false);
const passwordLoading = ref(false);
const isOwner = computed(() => authStore.isOwner);

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

onMounted(() => {
  profileForm.nickname = authStore.user?.profile?.nickname || authStore.user?.username || '';
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

.card-header {
  margin-bottom: 16px;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary, #1F2421);
}

.quick-links {
  margin-bottom: 20px;
}

.profile-form {
  margin-bottom: 8px;
}
</style>
