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
import { initTheme } from './composables/useTheme.js';
import { unregisterServiceWorkers } from './utils/unregisterServiceWorkers.js';

// 移除历史 PWA Service Worker，避免旧缓存继续生效
unregisterServiceWorkers();

initTheme();

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(ElementPlus, { locale: zhCn });

app.mount('#app');
