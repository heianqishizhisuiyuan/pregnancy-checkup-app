import { ref, watch } from 'vue';

const STORAGE_KEY = 'pregnancy_theme';
const isDark = ref(false);

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  isDark.value = dark;
}

function loadInitialTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') {
    applyTheme(saved === 'dark');
    return;
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark);
}

export function useTheme() {
  if (typeof document !== 'undefined' && !document.documentElement.getAttribute('data-theme')) {
    loadInitialTheme();
  }

  const toggleTheme = () => {
    const next = !isDark.value;
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
  };

  const setTheme = (dark) => {
    applyTheme(dark);
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  };

  return { isDark, toggleTheme, setTheme };
}

export function initTheme() {
  loadInitialTheme();
}
