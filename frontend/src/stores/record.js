import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useRecordStore = defineStore('record', () => {
  // State
  const records = ref([]);
  const currentRecord = ref(null);
  const loading = ref(false);

  // Actions
  function setRecords(newRecords) {
    records.value = newRecords;
  }

  function setCurrentRecord(record) {
    currentRecord.value = record;
  }

  function addRecord(record) {
    records.value.unshift(record);
  }

  function updateRecord(id, updatedRecord) {
    const index = records.value.findIndex(r => r._id === id);
    if (index !== -1) {
      records.value[index] = updatedRecord;
    }
  }

  function deleteRecord(id) {
    records.value = records.value.filter(r => r._id !== id);
  }

  function setLoading(state) {
    loading.value = state;
  }

  return {
    records,
    currentRecord,
    loading,
    setRecords,
    setCurrentRecord,
    addRecord,
    updateRecord,
    deleteRecord,
    setLoading,
  };
});
