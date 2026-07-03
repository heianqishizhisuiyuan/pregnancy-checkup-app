<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <div class="logo">💝</div>
        <h1 class="title">创建账号</h1>
        <p class="subtitle">{{ isJoinMode ? '输入邀请码加入家庭' : '开始记录你的孕期之旅' }}</p>
      </div>

      <el-radio-group v-model="registerMode" class="mode-switch">
        <el-radio-button label="create">创建新家庭</el-radio-button>
        <el-radio-button label="join">加入家庭</el-radio-button>
      </el-radio-group>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        class="register-form"
        @submit.prevent="handleSubmit"
      >
        <el-form-item v-if="isJoinMode" prop="inviteCode">
          <el-input
            v-model="formData.inviteCode"
            placeholder="家庭邀请码（8位）"
            size="large"
            :prefix-icon="Key"
            maxlength="12"
            @input="formData.inviteCode = formData.inviteCode.toUpperCase()"
          />
        </el-form-item>

        <el-form-item prop="username">
          <el-input
            v-model="formData.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="formData.email"
            placeholder="邮箱"
            size="large"
            :prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="密码（至少6个字符）"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="nickname">
          <el-input
            v-model="formData.nickname"
            placeholder="昵称（可选）"
            size="large"
            :prefix-icon="Star"
          />
        </el-form-item>

        <template v-if="!isJoinMode">
          <el-form-item prop="lastPeriod">
            <el-date-picker
              v-model="formData.lastPeriod"
              type="date"
              placeholder="末次月经日期（可选）"
              size="large"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>

          <el-form-item prop="dueDate">
            <el-date-picker
              v-model="formData.dueDate"
              type="date"
              placeholder="预产期（可选）"
              size="large"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </template>

        <el-button
          type="primary"
          size="large"
          :loading="loading"
          class="submit-btn"
          native-type="submit"
        >
          {{ isJoinMode ? '加入家庭' : '注册' }}
        </el-button>
      </el-form>

      <div class="footer">
        <span>已有账号？</span>
        <router-link to="/login" class="link">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Key, Lock, Message, Star, User } from '@element-plus/icons-vue';
import { register as registerApi } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';
import { validateEmail, validateUsername, validatePassword } from '@/utils/validators';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const formRef = ref(null);
const loading = ref(false);
const registerMode = ref(route.query.invite ? 'join' : 'create');

const formData = reactive({
  username: '',
  email: '',
  password: '',
  nickname: '',
  lastPeriod: '',
  dueDate: '',
  inviteCode: route.query.invite ? String(route.query.invite).toUpperCase() : '',
});

const isJoinMode = computed(() => registerMode.value === 'join');

const rules = computed(() => ({
  inviteCode: isJoinMode.value
    ? [{ required: true, message: '请输入邀请码', trigger: 'blur' }]
    : [],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!validateUsername(value)) {
          callback(new Error('用户名必须在2-50个字符之间'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!validateEmail(value)) {
          callback(new Error('请输入有效的邮箱'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!validatePassword(value)) {
          callback(new Error('密码至少6个字符'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
}));

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;

    const payload = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      nickname: formData.nickname,
    };

    if (isJoinMode.value) {
      payload.inviteCode = formData.inviteCode.trim();
    } else {
      payload.lastPeriod = formData.lastPeriod || undefined;
      payload.dueDate = formData.dueDate || undefined;
    }

    const response = await registerApi(payload);

    if (response.success) {
      authStore.login(response.data);
      ElMessage.success(isJoinMode.value ? '加入家庭成功！' : '注册成功，欢迎加入！');
      router.push({ name: 'Home' });
    }
  } catch (error) {
    console.error('Register error:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
}

.register-card {
  width: 100%;
  max-width: 480px;
  background: var(--color-bg-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-lg);
}

.register-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.logo {
  font-size: 4rem;
  margin-bottom: var(--spacing-sm);
}

.title {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.subtitle {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.mode-switch {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-bottom: var(--spacing-lg);
}

.register-form {
  margin-bottom: var(--spacing-lg);
}

.submit-btn {
  width: 100%;
  border-radius: var(--radius-full);
  font-weight: 500;
}

.footer {
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.link {
  color: var(--color-accent);
  text-decoration: none;
  margin-left: var(--spacing-xs);
  font-weight: 500;
}

.link:hover {
  color: var(--color-accent-hover);
}
</style>
