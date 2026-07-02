import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null);
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
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
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
