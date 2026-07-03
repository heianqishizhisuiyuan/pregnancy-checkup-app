<template>
  <div class="reminder-card" :class="`tone-${reminder?.tone || 'empty'}`">
    <div class="reminder-icon">
      <el-icon :size="24"><Bell /></el-icon>
    </div>
    <div class="reminder-body">
      <div class="reminder-title">产检提醒</div>
      <p v-if="reminder" class="reminder-message">{{ reminder.message }}</p>
      <p v-else-if="scheduleSuggestion" class="reminder-message suggestion">
        建议下次产检：{{ scheduleSuggestion.dateText }}（{{ scheduleSuggestion.label }}）
      </p>
      <p v-else-if="isOwner" class="reminder-message muted">
        尚未设置下次产检日期，可在家庭设置中填写
      </p>
      <p v-else class="reminder-message muted">主账号可在家庭设置中设置下次产检日期</p>

      <div class="reminder-actions-row">
        <div v-if="notificationSupported" class="reminder-actions">
          <button
            v-if="permission !== 'granted'"
            type="button"
            class="notify-btn"
            @click="handleEnableNotification"
          >
            开启浏览器通知
          </button>
          <span v-else class="notify-enabled">已开启浏览器通知</span>
        </div>

        <div v-if="nextCheckupDate" class="reminder-actions">
          <button type="button" class="notify-btn" @click="handleAddToCalendar">
            添加到日历
          </button>
          <button
            v-if="isOwner && isTodayOrPast"
            type="button"
            class="notify-btn accent"
            @click="showSetNextDialog = true"
          >
            已完成，设置下次
          </button>
        </div>
      </div>
    </div>
    <el-button
      v-if="isOwner"
      text
      class="reminder-settings"
      @click="goToFamilySettings"
    >
      设置
    </el-button>

    <el-dialog
      v-model="showSetNextDialog"
      title="设置下次产检日期"
      width="90%"
      style="max-width: 400px"
      @closed="resetDialog"
    >
      <el-date-picker
        v-model="newCheckupDate"
        type="date"
        placeholder="选择日期"
        value-format="YYYY-MM-DD"
        :disabled-date="disabledPastDate"
        style="width: 100%"
      />
      <template #footer>
        <el-button @click="showSetNextDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSetNextCheckup">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Bell } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import { formatCheckupReminderText } from '@/utils/checkupReminder.js';
import {
  STANDARD_CHECKUP_SCHEDULE,
  suggestNextCheckupDate,
  downloadCheckupIcs,
} from '@/utils/checkupSchedule.js';
import { calculateGestationalAge } from '@/utils/date';
import { useCheckupReminder } from '@/composables/useCheckupReminder.js';
import { useFamilyStore } from '@/stores/family';
import { updateFamily } from '@/api/family';

const props = defineProps({
  nextCheckupDate: {
    type: [String, Date],
    default: null,
  },
  lastPeriod: {
    type: [String, Date],
    default: null,
  },
  reminderDaysBefore: {
    type: Number,
    default: 1,
  },
  isOwner: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['updated']);

const router = useRouter();
const familyStore = useFamilyStore();

const showSetNextDialog = ref(false);
const newCheckupDate = ref('');
const saving = ref(false);

const reminder = computed(() => {
  if (!props.nextCheckupDate) return null;
  return formatCheckupReminderText(props.nextCheckupDate);
});

const isTodayOrPast = computed(() => {
  if (!reminder.value) return false;
  return reminder.value.daysLeft <= 0;
});

const scheduleSuggestion = computed(() => {
  if (props.nextCheckupDate || !props.lastPeriod) return null;

  const age = calculateGestationalAge(props.lastPeriod);
  const suggestedDate = suggestNextCheckupDate(props.lastPeriod, age.weeks);
  if (!suggestedDate) return null;

  const next = STANDARD_CHECKUP_SCHEDULE.find((item) => item.week > age.weeks);
  if (!next) return null;

  return {
    date: suggestedDate,
    label: next.label,
    dateText: dayjs(suggestedDate).format('M月D日'),
  };
});

const getReminderConfig = () => ({
  nextCheckupDate: props.nextCheckupDate,
  reminderDaysBefore: props.reminderDaysBefore,
});

const { notificationSupported, permission, requestPermission } = useCheckupReminder(getReminderConfig);

const disabledPastDate = (date) => date < dayjs().startOf('day').toDate();

const resetDialog = () => {
  newCheckupDate.value = '';
};

const handleEnableNotification = async () => {
  const result = await requestPermission();
  if (result === 'granted') {
    ElMessage.success('已开启产检提醒通知');
  } else if (result === 'denied') {
    ElMessage.warning('请在浏览器设置中允许通知权限');
  } else if (result === 'unsupported') {
    ElMessage.info('当前浏览器不支持通知');
  }
};

const handleAddToCalendar = () => {
  downloadCheckupIcs({
    title: '产检提醒',
    date: props.nextCheckupDate,
    description: '孕期产检提醒',
  });
  ElMessage.success('日历文件已下载');
};

const handleSetNextCheckup = async () => {
  if (!newCheckupDate.value) {
    ElMessage.warning('请选择下次产检日期');
    return;
  }

  saving.value = true;
  try {
    const response = await updateFamily({ nextCheckupDate: newCheckupDate.value });
    if (response.success) {
      familyStore.setFamily(response.data);
      emit('updated', response.data);
      showSetNextDialog.value = false;
      ElMessage.success('下次产检日期已更新');
    }
  } catch (error) {
    console.error('更新产检日期失败:', error);
  } finally {
    saving.value = false;
  }
};

const goToFamilySettings = () => {
  router.push({ name: 'FamilyEdit' });
};
</script>

<style scoped>
.reminder-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  background: var(--color-bg-white);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.reminder-card.tone-today,
.reminder-card.tone-soon {
  border-color: var(--color-accent);
  background: linear-gradient(135deg, #fff 0%, var(--color-accent-light) 100%);
}

.reminder-card.tone-overdue {
  border-color: #d97706;
  background: #fffbeb;
}

.reminder-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-sm);
  background: var(--color-accent-light);
  color: var(--color-accent);
  flex-shrink: 0;
}

.reminder-body {
  flex: 1;
  min-width: 0;
}

.reminder-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.reminder-message {
  font-size: 0.95rem;
  color: var(--color-text-primary);
  margin: 0;
}

.reminder-message.muted {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.reminder-message.suggestion {
  color: var(--color-accent);
  font-size: 0.875rem;
}

.reminder-actions-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.reminder-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
}

.notify-btn {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-accent);
  background: #fff;
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.notify-btn:hover {
  color: #fff;
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.notify-btn.accent {
  color: #fff;
  background: var(--color-accent);
}

.notify-btn.accent:hover {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}

.notify-btn:active {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}

.notify-enabled {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.reminder-settings {
  flex-shrink: 0;
  color: var(--color-accent);
}
</style>
