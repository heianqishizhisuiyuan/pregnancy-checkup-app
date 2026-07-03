<template>
  <div class="not-found">
    <div class="content">
      <div class="code">404</div>
      <h1 class="title">页面不存在</h1>
      <p class="desc">您访问的地址可能已变更或输入有误</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goHome = () => {
  router.push({ name: 'Home' });
};
</script>

<style scoped>
.not-found {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}

.content {
  text-align: center;
}

.code {
  font-size: 4rem;
  font-weight: 700;
  color: var(--color-accent);
  line-height: 1;
  margin-bottom: var(--spacing-md);
}

.title {
  font-size: 1.25rem;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-sm);
}

.desc {
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-lg);
}
</style>
