import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';
import { buildLoginQuery } from '@/utils/redirect';

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加 token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const newToken = response.headers['x-new-token'];
    if (newToken) {
      localStorage.setItem('token', newToken);
    }
    return response.data;
  },
  (error) => {
    const { response } = error;

    if (response) {
      const { status, data } = response;

      // 401 未授权，清除 token 并跳转登录页（保留回跳地址）
      if (status === 401) {
        localStorage.removeItem('token');
        const currentPath = router.currentRoute.value.fullPath;
        router.push({
          name: 'Login',
          query: buildLoginQuery(currentPath),
        });
        ElMessage.error(data.error?.message || '登录已过期，请重新登录');
      } else if (status === 403) {
        ElMessage.error(data.error?.message || '权限不足');
      } else if (status === 404) {
        ElMessage.error(data.error?.message || '请求的资源不存在');
      } else if (status === 500) {
        ElMessage.error('服务器错误，请稍后重试');
      } else {
        ElMessage.error(data.error?.message || '请求失败');
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接');
    }

    return Promise.reject(error);
  }
);

export default request;
