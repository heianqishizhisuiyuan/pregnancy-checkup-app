<template>
  <div class="attachment-gallery">
    <div v-if="!attachments || attachments.length === 0" class="empty">
      暂无检查报告
    </div>

    <div v-else>
      <div
        v-for="(group, category) in groupedAttachments"
        :key="category"
        class="category-group"
      >
        <div class="category-header">
          <CategoryIcon :category="category" :size="20" />
          <span class="category-name">{{ category }}</span>
          <span class="category-count">（{{ group.length }} 张）</span>
        </div>

        <div class="image-grid">
          <div
            v-for="attachment in group"
            :key="attachment._id"
            :ref="(el) => registerLazyTarget(el, attachment._id)"
            class="image-item"
          >
            <el-image
              :src="getImageUrl(attachment)"
              :preview-src-list="getPreviewList(category)"
              :initial-index="getImageIndex(category, attachment._id)"
              fit="cover"
              class="image"
              lazy
            >
              <template #placeholder>
                <div class="image-placeholder">
                  <el-skeleton animated>
                    <template #template>
                      <el-skeleton-item variant="image" style="width: 100%; height: 100%" />
                    </template>
                  </el-skeleton>
                </div>
              </template>
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                  <div>加载失败</div>
                </div>
              </template>
            </el-image>

            <div class="image-info">
              <div class="image-name">{{ normalizeUploadedFilename(attachment.filename) }}</div>
              <div class="image-meta">
                <el-tag size="small" type="warning" effect="plain" class="category-tag">
                  <CategoryIcon :category="attachment.category || '其他'" :size="12" inline />
                  {{ attachment.category || '其他' }}
                </el-tag>
              </div>
              <div v-if="attachment.tags && attachment.tags.length" class="image-tags">
                <el-tag
                  v-for="tag in attachment.tags"
                  :key="tag"
                  size="small"
                  type="info"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>

            <div v-if="canEdit" class="image-actions">
              <el-button
                size="small"
                type="primary"
                link
                @click="handleEdit(attachment)"
              >
                编辑
              </el-button>
              <el-button
                size="small"
                type="danger"
                link
                @click="handleDelete(attachment)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="editDialogVisible"
      title="编辑附件信息"
      width="400px"
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="分类">
          <el-select v-model="editForm.category" placeholder="请选择分类">
            <el-option
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              :value="cat"
            >
              <CategoryIcon :category="cat" :size="14" inline />
              <span>{{ cat }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input
            v-model="editForm.tagsStr"
            placeholder="多个标签用逗号分隔"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEdit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Picture } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { deleteAttachment, updateAttachment } from '@/api/attachment';
import { ATTACHMENT_CATEGORIES } from '@/utils/attachmentCategories';
import CategoryIcon from '@/components/CategoryIcon.vue';
import { createAttachmentPreviewObjectUrl } from '@/utils/attachmentPreview';
import { normalizeUploadedFilename } from '@/utils/decodeFilename';
import { useLazyAttachmentPreview } from '@/composables/useLazyAttachmentPreview';

const props = defineProps({
  recordId: {
    type: String,
    required: true
  },
  attachments: {
    type: Array,
    default: () => []
  },
  readonly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update', 'delete']);

const authStore = useAuthStore();
const editDialogVisible = ref(false);
const editForm = ref({
  attachmentId: '',
  category: '',
  tagsStr: ''
});
const previewUrls = ref({});
const loadingIds = ref(new Set());

const categories = ATTACHMENT_CATEGORIES;
const canEdit = computed(() => !props.readonly && authStore.user?.role === 'owner');

const attachmentMap = computed(() => {
  const map = new Map();
  props.attachments.forEach((attachment) => {
    map.set(attachment._id, attachment);
  });
  return map;
});

const groupedAttachments = computed(() => {
  const groups = {};
  props.attachments.forEach((attachment) => {
    const category = attachment.category || '其他';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(attachment);
  });
  return groups;
});

const revokePreviewUrl = (attachmentId) => {
  const url = previewUrls.value[attachmentId];
  if (url && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
  }
  delete previewUrls.value[attachmentId];
};

const loadPreviewUrl = async (attachment) => {
  if (!attachment || previewUrls.value[attachment._id] || loadingIds.value.has(attachment._id)) {
    return;
  }

  loadingIds.value.add(attachment._id);
  try {
    const previewUrl = await createAttachmentPreviewObjectUrl({
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
      path: attachment.path,
      token: authStore.token
    });
    previewUrls.value[attachment._id] = previewUrl;
  } catch (error) {
    console.error('Failed to load preview:', error);
  } finally {
    loadingIds.value.delete(attachment._id);
  }
};

const { observe, unobserve } = useLazyAttachmentPreview((attachmentId) => {
  const attachment = attachmentMap.value.get(attachmentId);
  if (attachment) {
    loadPreviewUrl(attachment);
  }
});

const registerLazyTarget = (el, attachmentId) => {
  if (!el) {
    unobserve(attachmentId);
    return;
  }
  observe(el, attachmentId);
};

watch(
  () => props.attachments,
  (attachments = [], previousAttachments = []) => {
    const currentIds = new Set(attachments.map((attachment) => attachment._id));

    previousAttachments
      .filter((attachment) => !currentIds.has(attachment._id))
      .forEach((attachment) => revokePreviewUrl(attachment._id));
  },
  { deep: true }
);

const getImageUrl = (attachment) => {
  return previewUrls.value[attachment._id] || '';
};

const getPreviewList = (category) => {
  return groupedAttachments.value[category]
    ?.map((attachment) => getImageUrl(attachment))
    .filter(Boolean) || [];
};

const getImageIndex = (category, attachmentId) => {
  return groupedAttachments.value[category]?.findIndex((attachment) => attachment._id === attachmentId) || 0;
};

const handleEdit = (attachment) => {
  editForm.value = {
    attachmentId: attachment._id,
    category: attachment.category,
    tagsStr: attachment.tags?.join(', ') || ''
  };
  editDialogVisible.value = true;
};

const confirmEdit = async () => {
  try {
    const tags = editForm.value.tagsStr.split(',').map((tag) => tag.trim()).filter(Boolean);
    await updateAttachment(props.recordId, editForm.value.attachmentId, {
      category: editForm.value.category,
      tags
    });

    ElMessage.success('更新成功');
    editDialogVisible.value = false;
    emit('update');
  } catch (error) {
    console.error('更新失败:', error);
    ElMessage.error('更新失败');
  }
};

const handleDelete = async (attachment) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 "${normalizeUploadedFilename(attachment.filename)}" 吗？`,
      '删除确认',
      {
        type: 'warning'
      }
    );

    await deleteAttachment(props.recordId, attachment._id);
    ElMessage.success('删除成功');
    emit('delete');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

onBeforeUnmount(() => {
  Object.keys(previewUrls.value).forEach((attachmentId) => revokePreviewUrl(attachmentId));
});
</script>

<style scoped>
.attachment-gallery {
  width: 100%;
}

.empty {
  text-align: center;
  padding: 40px;
  color: var(--el-text-color-secondary);
}

.category-group {
  margin-bottom: 24px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 500;
}

.category-count {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-left: 4px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.image-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-fill-color-light);
}

.image {
  width: 100%;
  height: 150px;
  cursor: pointer;
}

.image-placeholder {
  width: 100%;
  height: 150px;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-secondary);
}

.image-info {
  padding: 8px;
}

.image-name {
  font-size: 12px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-meta {
  margin-top: 4px;
}

.category-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.image-tags {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.image-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: none;
  gap: 4px;
}

.image-item:hover .image-actions {
  display: flex;
}

@media (max-width: 640px) {
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }

  .image,
  .image-placeholder {
    height: 120px;
  }
}
</style>
