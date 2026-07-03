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
import { initPwaUpdate } from './composables/usePwaUpdate.js';

initPwaUpdate();

import { initTheme } from './composables/useTheme.js';

initTheme();

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(ElementPlus, { locale: zhCn });

app.mount('#app');
