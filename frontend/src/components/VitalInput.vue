<template>
  <div class="vital-input">
    <label v-if="label" class="vital-label">{{ label }}</label>
    <div class="input-wrapper">
      <el-input-number
        :model-value="modelValue"
        @update:model-value="handleUpdate"
        :min="min"
        :max="max"
        :precision="precision"
        :placeholder="placeholder"
        :disabled="disabled"
        class="vital-number-input"
      />
      <span v-if="unit" class="vital-unit">{{ unit }}</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Number,
    default: null,
  },
  label: {
    type: String,
    default: '',
  },
  unit: {
    type: String,
    default: '',
  },
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 999,
  },
  precision: {
    type: Number,
    default: 0,
  },
  placeholder: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const handleUpdate = (value) => {
  emit('update:modelValue', value);
};
</script>

<style scoped>
.vital-input {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.vital-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.vital-number-input {
  flex: 1;
}

.vital-unit {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  min-width: 40px;
  text-align: left;
}
</style>
