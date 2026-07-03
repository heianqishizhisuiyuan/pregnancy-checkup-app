import { ref, onMounted, onBeforeUnmount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { ElMessageBox } from 'element-plus';

/**
 * 表单未保存离开提示
 * @param {() => boolean} isDirty - 是否有未保存修改
 */
export function useFormGuard(isDirty) {
  const enabled = ref(true);

  const confirmLeave = async () => {
    if (!enabled.value || !isDirty()) return true;
    try {
      await ElMessageBox.confirm('有未保存的修改，确定离开吗？', '提示', {
        confirmButtonText: '离开',
        cancelButtonText: '继续编辑',
        type: 'warning',
      });
      return true;
    } catch {
      return false;
    }
  };

  onBeforeRouteLeave(async (_to, _from, next) => {
    const ok = await confirmLeave();
    next(ok);
  });

  const handleBeforeUnload = (e) => {
    if (enabled.value && isDirty()) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  const disableGuard = () => {
    enabled.value = false;
  };

  return { disableGuard, confirmLeave };
}
