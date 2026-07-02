<template>
  <div class="attachment-gallery">
    <div v-if="!attachments || attachments.length === 0" class="empty">
      暂无检查报告
    </div>

    <div v-else>
      <!-- 按分类分组显示 -->
      <div
        v-for="(group, category) in groupedAttachments"
        :key="category"
        class="category-group"
      >
        <div class="category-header">
          <span class="category-icon">{{ getCategoryIcon(category) }}</span>
          <span class="category-name">{{ category }}</span>
          <span class="category-count">（{{ group.length }} 张）</span>
        </div>

        <div class="image-grid">
          <div
            v-for="attachment in group"
            :key="attachment._id"
            class="image-item"
          >
            <el-image
              :src="getImageUrl(attachment.path)"
              :preview-src-list="getPreviewList(category)"
              :initial-index="getImageIndex(category, attachment._id)"
              fit="cover"
              class="image"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                  <div>加载失败</div>
                </div>
              </template>
            </el-image>

            <div class="image-info">
              <div class="image-name">{{ attachment.filename }}</div>
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

            <!-- 操作按钮（仅 owner 可见）-->
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

    <!-- 编辑对话框 -->
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
            />
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
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Picture } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { deleteAttachment, updateAttachment } from '@/api/attachment';
import { ATTACHMENT_CATEGORIES, CATEGORY_ICONS } from '@/utils/attachmentCategories';

const props = defineProps({
  recordId: {
    type: String,
    required: true
  },
  attachments: {
    type: Array,
    default: () => []
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

const categories = ATTACHMENT_CATEGORIES;

// 是否可编辑
const canEdit = computed(() => authStore.user?.role === 'owner');

// 按分类分组
const groupedAttachments = computed(() => {
  const groups = {};
  props.attachments.forEach(att => {
    const category = att.category || '其他';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(att);
  });
  return groups;
});

// 获取分类图标
const getCategoryIcon = (category) => {
  return CATEGORY_ICONS[category] || '📄';
};

// 获取图片 URL
const getImageUrl = (path) => {
  return `${import.meta.env.VITE_API_BASE_URL}/${path}`;
};

// 获取预览列表
const getPreviewList = (category) => {
  return groupedAttachments.value[category]?.map(att => getImageUrl(att.path)) || [];
};

// 获取图片索引
const getImageIndex = (category, attachmentId) => {
  return groupedAttachments.value[category]?.findIndex(att => att._id === attachmentId) || 0;
};

// 编辑附件
const handleEdit = (attachment) => {
  editForm.value = {
    attachmentId: attachment._id,
    category: attachment.category,
    tagsStr: attachment.tags?.join(', ') || ''
  };
  editDialogVisible.value = true;
};

// 确认编辑
const confirmEdit = async () => {
  try {
    const tags = editForm.value.tagsStr.split(',').map(t => t.trim()).filter(Boolean);
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

// 删除附件
const handleDelete = async (attachment) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除"${attachment.filename}"吗？`,
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
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 500;
}

.category-icon {
  font-size: 20px;
  margin-right: 8px;
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
</style>
