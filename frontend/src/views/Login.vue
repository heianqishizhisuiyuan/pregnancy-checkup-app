<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">💝</div>
        <h1 class="title">孕期记录</h1>
        <p class="subtitle">记录每一次温馨的产检时刻</p>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleSubmit"
      >
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
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          :loading="loading"
          class="submit-btn"
          native-type="submit"
        >
          登录
        </el-button>
      </el-form>

      <div class="footer">
        <span>还没有账号？</span>
        <router-link to="/register" class="link">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Lock, Message } from '@element-plus/icons-vue';
import { login as loginApi } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';
import { validateEmail } from '@/utils/validators';

const router = useRouter();
const authStore = useAuthStore();

const REMEMBERED_EMAIL_KEY = 'pregnancy_remembered_email';

const formRef = ref(null);
const loading = ref(false);

const formData = reactive({
  email: '',
  password: '',
});

onMounted(() => {
  const remembered = localStorage.getItem(REMEMBERED_EMAIL_KEY);
  if (remembered) {
    formData.email = remembered;
  }
});

const rules = {
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
    { min: 6, message: '密码至少6个字符', trigger: 'blur' },
  ],
};

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;

    const response = await loginApi(formData);

    if (response.success) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, formData.email.trim());
      authStore.login(response.data);
      ElMessage.success('登录成功');
      router.push({ name: 'Home' });
    }
  } catch (error) {
    console.error('Login error:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-bg-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-lg);
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
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

.login-form {
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
