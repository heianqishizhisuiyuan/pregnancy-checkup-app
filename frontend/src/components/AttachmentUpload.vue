<template>
  <div class="attachment-upload">
    <el-upload
      ref="uploadRef"
      v-model:file-list="fileList"
      :action="uploadUrl"
      :headers="uploadHeaders"
      :data="uploadData"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :limit="maxCount"
      :disabled="disabled"
      accept="image/jpeg,image/jpg,image/png,image/webp"
      list-type="picture-card"
      multiple
    >
      <el-icon><Plus /></el-icon>
      <template #tip>
        <div class="upload-tip">
          支持 jpg/png/webp，单张最大 10MB，最多 {{ maxCount }} 张
        </div>
      </template>
    </el-upload>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  recordId: {
    type: String,
    required: true
  },
  existingCount: {
    type: Number,
    default: 0
  },
  disabled: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    default: '其他'
  },
  tags: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['success']);

const authStore = useAuthStore();
const uploadRef = ref(null);
const fileList = ref([]);

// 计算还能上传多少张
const maxCount = computed(() => {
  return Math.max(0, 20 - props.existingCount);
});

// 上传地址
const uploadUrl = computed(() => {
  return `${import.meta.env.VITE_API_BASE_URL}/api/records/${props.recordId}/attachments`;
});

// 上传请求头
const uploadHeaders = computed(() => {
  return {
    Authorization: `Bearer ${authStore.token}`
  };
});

// 上传数据
const uploadData = computed(() => {
  return {
    category: props.category,
    tags: JSON.stringify(props.tags)
  };
});

// 上传前验证
const beforeUpload = (file) => {
  const isImage = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
  if (!isImage) {
    ElMessage.error('只能上传 JPG/PNG/WEBP 格式的图片');
    return false;
  }

  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB');
    return false;
  }

  return true;
};

// 上传成功
const handleSuccess = (response) => {
  if (response.success) {
    ElMessage.success('上传成功');
    emit('success', response.data.attachments);
    fileList.value = [];
  } else {
    ElMessage.error(response.error?.message || '上传失败');
  }
};

// 上传失败
const handleError = (error) => {
  console.error('上传失败:', error);
  ElMessage.error('上传失败，请重试');
};
</script>

<style scoped>
.attachment-upload {
  width: 100%;
}

.upload-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 8px;
}
</style>
