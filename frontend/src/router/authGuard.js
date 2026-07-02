/**
 * 确保有 token 时已恢复当前用户信息。
 */
export async function ensureAuthUser(authStore, fetchCurrentUser) {
  if (!authStore.token) {
    return null;
  }

  if (authStore.user) {
    return authStore.user;
  }

  try {
    const response = await fetchCurrentUser();
    if (response.success) {
      authStore.setUser(response.data);
      return response.data;
    }
    return null;
  } catch (error) {
    authStore.logout();
    throw error;
  }
}
