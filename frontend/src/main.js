import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'element-plus/dist/index.css';
import './assets/styles/theme.css';
import App from './App.vue';
import router from './router';

// 生产环境注册 Service Worker（由 vite-plugin-pwa 生成 sw.js）
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // 离线能力不可用时静默失败
    });
  });
}

dayjs.locale('zh-cn');

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(ElementPlus, { locale: zhCn });

app.mount('#app');
