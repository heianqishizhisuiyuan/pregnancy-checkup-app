import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import dayjs from 'dayjs';

export const useFamilyStore = defineStore('family', () => {
  // State
  const family = ref(null);
  const loading = ref(false);

  // Getters
  const dueDate = computed(() => {
    return family.value?.pregnancyInfo?.dueDate
      ? dayjs(family.value.pregnancyInfo.dueDate)
      : null;
  });

  const lastPeriod = computed(() => {
    return family.value?.pregnancyInfo?.lastPeriod
      ? dayjs(family.value.pregnancyInfo.lastPeriod)
      : null;
  });

  const daysUntilDue = computed(() => {
    if (!dueDate.value) return null;
    return dueDate.value.diff(dayjs(), 'day');
  });

  const currentGestationalAge = computed(() => {
    if (!lastPeriod.value) return null;
    const diffDays = dayjs().diff(lastPeriod.value, 'day');
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    return { weeks, days, totalDays: diffDays };
  });

  // Actions
  function setFamily(newFamily) {
    family.value = newFamily;
  }

  function setLoading(state) {
    loading.value = state;
  }

  return {
    family,
    loading,
    dueDate,
    lastPeriod,
    daysUntilDue,
    currentGestationalAge,
    setFamily,
    setLoading,
  };
});
