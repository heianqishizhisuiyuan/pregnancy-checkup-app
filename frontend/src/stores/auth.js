import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  // State - 从 localStorage 恢复用户信息
  const storedUser = localStorage.getItem('user');
  const user = ref(storedUser ? JSON.parse(storedUser) : null);
  const token = ref(localStorage.getItem('token') || null);

  // Getters
  const isAuthenticated = computed(() => !!token.value);
  const isOwner = computed(() => user.value?.role === 'owner');

  // Actions
  function setToken(newToken) {
    token.value = newToken;
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
  }

  function setUser(newUser) {
    user.value = newUser;
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  function login(loginData) {
    setToken(loginData.token);
    setUser(loginData.user);
  }

  return {
    user,
    token,
    isAuthenticated,
    isOwner,
    setToken,
    setUser,
    logout,
    login,
  };
});
