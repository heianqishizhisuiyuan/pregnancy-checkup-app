<template>
  <div class="reminder-card" :class="`tone-${reminder?.tone || 'empty'}`">
    <div class="reminder-icon">
      <el-icon :size="24"><Bell /></el-icon>
    </div>
    <div class="reminder-body">
      <div class="reminder-title">产检提醒</div>
      <p v-if="reminder" class="reminder-message">{{ reminder.message }}</p>
      <p v-else-if="isOwner" class="reminder-message muted">
        尚未设置下次产检日期，可在家庭设置中填写
      </p>
      <p v-else class="reminder-message muted">主账号可在家庭设置中设置下次产检日期</p>

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
    </div>
    <el-button
      v-if="isOwner"
      text
      class="reminder-settings"
      @click="goToFamilySettings"
    >
      设置
    </el-button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Bell } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { formatCheckupReminderText } from '@/utils/checkupReminder.js';
import { useCheckupReminder } from '@/composables/useCheckupReminder.js';

const props = defineProps({
  nextCheckupDate: {
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

const router = useRouter();

const reminder = computed(() => {
  if (!props.nextCheckupDate) return null;
  return formatCheckupReminderText(props.nextCheckupDate);
});

const getReminderConfig = () => ({
  nextCheckupDate: props.nextCheckupDate,
  reminderDaysBefore: props.reminderDaysBefore,
});

const { notificationSupported, permission, requestPermission } = useCheckupReminder(getReminderConfig);

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

.reminder-actions {
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
