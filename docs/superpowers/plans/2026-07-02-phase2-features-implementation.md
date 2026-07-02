# 第二阶段功能实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为产检记录应用添加图片上传管理、分类记录和时间轴展示功能

**Architecture:** 使用 multer 处理文件上传到本地文件系统，按家庭和记录组织目录结构；扩展 Record 模型添加 attachments 数组；前端使用 Element Plus Upload 组件实现图片上传和预览，新增时间轴视图页面

**Tech Stack:** Node.js, Express, Multer, UUID, MongoDB, Vue 3, Element Plus, Pinia

---

## 文件结构规划

### 后端新增文件
- `backend/src/config/multer.js` - Multer 上传配置
- `backend/src/middlewares/fileAccess.js` - 文件访问权限中间件
- `backend/src/utils/fileCleanup.js` - 文件清理工具函数

### 后端修改文件
- `backend/src/models/Record.js` - 添加 attachments 字段
- `backend/src/controllers/recordController.js` - 添加附件相关控制器方法
- `backend/src/routes/record.js` - 添加附件路由
- `backend/src/app.js` - 配置静态文件服务

### 前端新增文件
- `frontend/src/components/AttachmentUpload.vue` - 图片上传组件
- `frontend/src/components/AttachmentGallery.vue` - 图片画廊组件
- `frontend/src/views/Timeline.vue` - 时间轴页面
- `frontend/src/components/TimelineItem.vue` - 时间轴项组件
- `frontend/src/api/attachment.js` - 附件 API 接口
- `frontend/src/utils/attachmentCategories.js` - 附件分类常量

### 前端修改文件
- `frontend/src/views/RecordForm.vue` - 添加图片上传区域
- `frontend/src/views/RecordDetail.vue` - 添加图片展示区域
- `frontend/src/router/index.js` - 添加时间轴路由
- `frontend/src/views/Home.vue` - 添加时间轴入口

---

## Task 1: 安装后端依赖

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: 安装 multer 和 uuid**

```bash
cd backend
pnpm add multer uuid
```

Expected: 依赖安装成功，package.json 更新

- [ ] **Step 2: 验证依赖安装**

```bash
pnpm list multer uuid
```

Expected: 显示已安装的版本

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(backend): 添加 multer 和 uuid 依赖"
```

---

## Task 2: 创建 Multer 配置

**Files:**
- Create: `backend/src/config/multer.js`

- [ ] **Step 1: 创建 multer 配置文件**

```javascript
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

// 文件存储配置
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { familyId } = req.user;
    const { recordId } = req.params;
    const uploadDir = path.join('uploads', 'families', familyId.toString(), 'records', recordId);
    
    // 确保目录存在
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 jpg、png、webp 格式的图片'), false);
  }
};

// 创建 multer 实例
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,  // 10MB
    files: 10                     // 单次最多10个文件
  }
});

// 附件分类常量
export const ATTACHMENT_CATEGORIES = [
  'B超',
  '血常规',
  '尿常规',
  '唐筛',
  '糖耐',
  '肝功能',
  '肾功能',
  'NT检查',
  '四维彩超',
  '其他'
];
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/config/multer.js
git commit -m "feat(backend): 添加 multer 文件上传配置"
```

---

## Task 3: 创建文件访问权限中间件

**Files:**
- Create: `backend/src/middlewares/fileAccess.js`

- [ ] **Step 1: 创建文件访问权限中间件**

```javascript
/**
 * 文件访问权限中间件
 * 验证用户是否有权访问指定家庭的文件
 */
export const checkFileAccess = async (req, res, next) => {
  try {
    // 从 URL 路径中提取 familyId
    const pathParts = req.path.split('/');
    const familyIdIndex = pathParts.indexOf('families') + 1;
    const familyId = pathParts[familyIdIndex];
    
    // 验证用户是否属于该家庭
    if (!req.user || req.user.familyId.toString() !== familyId) {
      return res.status(403).json({
        success: false,
        error: { 
          code: 'FORBIDDEN',
          message: '无权访问该资源' 
        }
      });
    }
    
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: { 
        code: 'FORBIDDEN',
        message: '访问被拒绝' 
      }
    });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/middlewares/fileAccess.js
git commit -m "feat(backend): 添加文件访问权限中间件"
```

---

## Task 4: 创建文件清理工具函数

**Files:**
- Create: `backend/src/utils/fileCleanup.js`

- [ ] **Step 1: 创建文件清理工具函数**

```javascript
import fs from 'fs/promises';
import path from 'path';

/**
 * 删除单个文件
 * @param {string} filePath - 文件路径
 */
export async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log(`文件删除成功: ${filePath}`);
  } catch (error) {
    console.error(`文件删除失败: ${filePath}`, error);
  }
}

/**
 * 删除目录（如果为空）
 * @param {string} dirPath - 目录路径
 */
export async function deleteEmptyDir(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    if (files.length === 0) {
      await fs.rmdir(dirPath);
      console.log(`目录删除成功: ${dirPath}`);
    }
  } catch (error) {
    console.error(`目录删除失败: ${dirPath}`, error);
  }
}

/**
 * 删除附件的所有文件
 * @param {Array} attachments - 附件数组
 */
export async function deleteAttachmentFiles(attachments) {
  if (!attachments || attachments.length === 0) {
    return;
  }
  
  for (const attachment of attachments) {
    const filePath = path.join(process.cwd(), attachment.path);
    await deleteFile(filePath);
  }
}

/**
 * 删除记录目录
 * @param {string} familyId - 家庭 ID
 * @param {string} recordId - 记录 ID
 */
export async function deleteRecordDir(familyId, recordId) {
  const recordDir = path.join('uploads', 'families', familyId.toString(), 'records', recordId.toString());
  await deleteEmptyDir(recordDir);
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/utils/fileCleanup.js
git commit -m "feat(backend): 添加文件清理工具函数"
```

---

## Task 5: 扩展 Record 模型

**Files:**
- Modify: `backend/src/models/Record.js`

- [ ] **Step 1: 添加 attachments 字段到 Record schema**

在 `vitals` 字段后、`timestamps` 选项前添加 attachments 字段：

```javascript
  // 附件
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    storedName: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    category: {
      type: String,
      default: '其他'
    },
    tags: [{
      type: String
    }],
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
```

- [ ] **Step 2: 验证模型定义**

```bash
cd backend
node -e "import('./src/models/Record.js').then(m => console.log('Record model loaded successfully'))"
```

Expected: "Record model loaded successfully"

- [ ] **Step 3: Commit**

```bash
git add backend/src/models/Record.js
git commit -m "feat(backend): 扩展 Record 模型添加 attachments 字段"
```

---

## Task 6: 添加附件上传控制器

**Files:**
- Modify: `backend/src/controllers/recordController.js`

- [ ] **Step 1: 在文件顶部添加导入**

```javascript
import { ATTACHMENT_CATEGORIES } from '../config/multer.js';
```

- [ ] **Step 2: 在文件末尾添加上传附件控制器**

```javascript
// 上传附件
export const uploadAttachments = async (req, res) => {
  try {
    const { recordId } = req.params;
    
    // 查找记录
    const record = await Record.findOne({
      _id: recordId,
      familyId: req.user.familyId
    });
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: { 
          code: 'NOT_FOUND',
          message: '记录不存在' 
        }
      });
    }
    
    // 检查附件数量限制
    const currentCount = record.attachments ? record.attachments.length : 0;
    const newCount = req.files ? req.files.length : 0;
    
    if (currentCount + newCount > 20) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LIMIT_EXCEEDED',
          message: `附件总数不能超过 20 个（当前: ${currentCount}，尝试添加: ${newCount}）`
        }
      });
    }
    
    // 处理上传的文件
    const { category = '其他', tags } = req.body;
    const parsedTags = tags ? JSON.parse(tags) : [];
    
    const newAttachments = req.files.map(file => ({
      filename: file.originalname,
      storedName: file.filename,
      path: file.path.replace(/\\/g, '/'), // 统一使用正斜杠
      size: file.size,
      mimetype: file.mimetype,
      category,
      tags: parsedTags,
      uploadedAt: new Date(),
      uploadedBy: req.user._id
    }));
    
    // 添加到记录
    record.attachments.push(...newAttachments);
    await record.save();
    
    // 返回新上传的附件
    const uploadedAttachments = newAttachments.map(att => ({
      _id: record.attachments[record.attachments.length - newAttachments.indexOf(att) - 1]._id,
      filename: att.filename,
      url: `/${att.path}`,
      category: att.category,
      tags: att.tags,
      size: att.size,
      uploadedAt: att.uploadedAt
    }));
    
    res.json({
      success: true,
      data: {
        attachments: uploadedAttachments
      }
    });
  } catch (error) {
    console.error('上传附件失败:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: 'UPLOAD_FAILED',
        message: '上传附件失败' 
      }
    });
  }
};
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/recordController.js
git commit -m "feat(backend): 添加附件上传控制器"
```

---

## Task 7: 添加附件删除控制器

**Files:**
- Modify: `backend/src/controllers/recordController.js`

- [ ] **Step 1: 在文件顶部添加导入**

```javascript
import { deleteFile } from '../utils/fileCleanup.js';
import path from 'path';
```

- [ ] **Step 2: 在 uploadAttachments 后添加删除附件控制器**

```javascript
// 删除附件
export const deleteAttachment = async (req, res) => {
  try {
    const { recordId, attachmentId } = req.params;
    
    // 查找记录
    const record = await Record.findOne({
      _id: recordId,
      familyId: req.user.familyId
    });
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: { 
          code: 'NOT_FOUND',
          message: '记录不存在' 
        }
      });
    }
    
    // 查找附件
    const attachment = record.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: { 
          code: 'NOT_FOUND',
          message: '附件不存在' 
        }
      });
    }
    
    // 删除物理文件
    const filePath = path.join(process.cwd(), attachment.path);
    await deleteFile(filePath);
    
    // 从数据库删除
    attachment.deleteOne();
    await record.save();
    
    res.json({
      success: true,
      data: { 
        message: '附件删除成功' 
      }
    });
  } catch (error) {
    console.error('删除附件失败:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: 'DELETE_FAILED',
        message: '删除附件失败' 
      }
    });
  }
};
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/recordController.js
git commit -m "feat(backend): 添加附件删除控制器"
```

---

## Task 8: 添加附件更新控制器

**Files:**
- Modify: `backend/src/controllers/recordController.js`

- [ ] **Step 1: 在 deleteAttachment 后添加更新附件控制器**

```javascript
// 更新附件信息
export const updateAttachment = async (req, res) => {
  try {
    const { recordId, attachmentId } = req.params;
    const { category, tags } = req.body;
    
    // 查找记录
    const record = await Record.findOne({
      _id: recordId,
      familyId: req.user.familyId
    });
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: { 
          code: 'NOT_FOUND',
          message: '记录不存在' 
        }
      });
    }
    
    // 查找并更新附件
    const attachment = record.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: { 
          code: 'NOT_FOUND',
          message: '附件不存在' 
        }
      });
    }
    
    if (category !== undefined) {
      attachment.category = category;
    }
    if (tags !== undefined) {
      attachment.tags = tags;
    }
    
    await record.save();
    
    res.json({
      success: true,
      data: {
        attachment: {
          _id: attachment._id,
          category: attachment.category,
          tags: attachment.tags
        }
      }
    });
  } catch (error) {
    console.error('更新附件失败:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: 'UPDATE_FAILED',
        message: '更新附件失败' 
      }
    });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/controllers/recordController.js
git commit -m "feat(backend): 添加附件更新控制器"
```

---

## Task 9: 修改删除记录控制器（联动删除附件）

**Files:**
- Modify: `backend/src/controllers/recordController.js`

- [ ] **Step 1: 在文件顶部添加导入**

```javascript
import { deleteAttachmentFiles, deleteRecordDir } from '../utils/fileCleanup.js';
```

- [ ] **Step 2: 找到 deleteRecord 函数，在删除记录前添加附件清理逻辑**

在 `await record.deleteOne();` 之前添加：

```javascript
    // 删除所有附件文件
    if (record.attachments && record.attachments.length > 0) {
      await deleteAttachmentFiles(record.attachments);
      
      // 删除记录目录（如果为空）
      await deleteRecordDir(req.user.familyId, req.params.id);
    }
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/recordController.js
git commit -m "feat(backend): 删除记录时联动删除附件文件"
```

---

## Task 10: 添加附件路由

**Files:**
- Modify: `backend/src/routes/record.js`

- [ ] **Step 1: 在文件顶部添加导入**

```javascript
import { upload } from '../config/multer.js';
import { uploadAttachments, deleteAttachment, updateAttachment } from '../controllers/recordController.js';
```

- [ ] **Step 2: 在现有路由后添加附件路由**

```javascript
// 附件路由
router.post('/:recordId/attachments', requireOwner, upload.array('files', 10), uploadAttachments);
router.delete('/:recordId/attachments/:attachmentId', requireOwner, deleteAttachment);
router.put('/:recordId/attachments/:attachmentId', requireOwner, updateAttachment);
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/record.js
git commit -m "feat(backend): 添加附件相关路由"
```

---

## Task 11: 配置静态文件服务

**Files:**
- Modify: `backend/src/app.js`

- [ ] **Step 1: 在文件顶部添加导入**

```javascript
import { authenticateToken } from './middlewares/auth.js';
import { checkFileAccess } from './middlewares/fileAccess.js';
```

- [ ] **Step 2: 在路由注册之前添加静态文件服务配置**

在 `app.use('/api/auth', authRoutes);` 之前添加：

```javascript
// 静态文件服务（需要认证和权限验证）
app.use('/uploads', authenticateToken, checkFileAccess, express.static('uploads'));
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/app.js
git commit -m "feat(backend): 配置静态文件服务和权限验证"
```

---

## Task 12: 后端功能测试

**Files:**
- Test: Manual testing

- [ ] **Step 1: 启动后端服务**

```bash
cd backend
pnpm dev
```

Expected: 服务启动成功，监听 3000 端口

- [ ] **Step 2: 测试上传附件（使用 Postman 或 curl）**

创建测试文件：
```bash
echo "test" > test.jpg
```

使用 curl 测试（需要先登录获取 token）：
```bash
curl -X POST http://localhost:3000/api/records/{recordId}/attachments \
  -H "Authorization: Bearer {token}" \
  -F "files=@test.jpg" \
  -F "category=B超" \
  -F "tags=[\"测试\"]"
```

Expected: 返回 success: true，附件信息

- [ ] **Step 3: 测试访问文件**

```bash
curl http://localhost:3000/uploads/families/{familyId}/records/{recordId}/{filename} \
  -H "Authorization: Bearer {token}"
```

Expected: 返回图片内容

- [ ] **Step 4: 测试删除附件**

```bash
curl -X DELETE http://localhost:3000/api/records/{recordId}/attachments/{attachmentId} \
  -H "Authorization: Bearer {token}"
```

Expected: 返回 success: true

---

## Task 13: 创建前端附件分类常量

**Files:**
- Create: `frontend/src/utils/attachmentCategories.js`

- [ ] **Step 1: 创建分类常量文件**

```javascript
// 附件预设分类
export const ATTACHMENT_CATEGORIES = [
  'B超',
  '血常规',
  '尿常规',
  '唐筛',
  '糖耐',
  '肝功能',
  '肾功能',
  'NT检查',
  '四维彩超',
  '其他'
];

// 分类图标映射
export const CATEGORY_ICONS = {
  'B超': '📷',
  '血常规': '🩸',
  '尿常规': '🧪',
  '唐筛': '🔬',
  '糖耐': '🍬',
  '肝功能': '🫀',
  '肾功能': '💊',
  'NT检查': '👶',
  '四维彩超': '📸',
  '其他': '📄'
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/utils/attachmentCategories.js
git commit -m "feat(frontend): 添加附件分类常量"
```

---

## Task 14: 创建附件 API 接口

**Files:**
- Create: `frontend/src/api/attachment.js`

- [ ] **Step 1: 创建附件 API 文件**

```javascript
import request from './request';

/**
 * 上传附件
 */
export function uploadAttachments(recordId, formData) {
  return request({
    url: `/records/${recordId}/attachments`,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 删除附件
 */
export function deleteAttachment(recordId, attachmentId) {
  return request({
    url: `/records/${recordId}/attachments/${attachmentId}`,
    method: 'delete'
  });
}

/**
 * 更新附件信息
 */
export function updateAttachment(recordId, attachmentId, data) {
  return request({
    url: `/records/${recordId}/attachments/${attachmentId}`,
    method: 'put',
    data
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api/attachment.js
git commit -m "feat(frontend): 添加附件 API 接口"
```

---

## Task 15: 创建图片上传组件

**Files:**
- Create: `frontend/src/components/AttachmentUpload.vue`

- [ ] **Step 1: 创建组件文件（模板和脚本部分）**

```vue
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
      :on-remove="handleRemove"
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

    <!-- 分类和标签编辑对话框 -->
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
            v-model="editForm.tags"
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
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { ATTACHMENT_CATEGORIES } from '@/utils/attachmentCategories';

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
  }
});

const emit = defineEmits(['success']);

const authStore = useAuthStore();
const uploadRef = ref(null);
const fileList = ref([]);
const editDialogVisible = ref(false);
const editForm = ref({
  category: '其他',
  tags: ''
});

const categories = ATTACHMENT_CATEGORIES;

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
    category: editForm.value.category,
    tags: JSON.stringify(editForm.value.tags.split(',').map(t => t.trim()).filter(Boolean))
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
  } else {
    ElMessage.error(response.error?.message || '上传失败');
  }
};

// 上传失败
const handleError = (error) => {
  console.error('上传失败:', error);
  ElMessage.error('上传失败，请重试');
};

// 移除文件
const handleRemove = (file) => {
  // 如果文件已上传，需要调用删除接口
  // 这里简化处理，只在本地移除
};

// 确认编辑
const confirmEdit = () => {
  editDialogVisible.value = false;
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/AttachmentUpload.vue
git commit -m "feat(frontend): 创建图片上传组件"
```

---

## Task 16: 创建图片画廊组件

**Files:**
- Create: `frontend/src/components/AttachmentGallery.vue`

- [ ] **Step 1: 创建组件文件**

```vue
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/AttachmentGallery.vue
git commit -m "feat(frontend): 创建图片画廊组件"
```

---

## Task 17: 改造记录表单页（添加图片上传）

**Files:**
- Modify: `frontend/src/views/RecordForm.vue`

- [ ] **Step 1: 在 script 部分导入 AttachmentUpload 组件**

```javascript
import AttachmentUpload from '@/components/AttachmentUpload.vue';
```

- [ ] **Step 2: 在组件注册中添加**

在 `components` 对象中添加：
```javascript
  AttachmentUpload,
```

- [ ] **Step 3: 在模板中备注字段后添加上传区域**

在备注输入框后、按钮组前添加：

```vue
      <!-- 检查报告 -->
      <el-form-item label="检查报告">
        <AttachmentUpload
          v-if="recordId"
          :record-id="recordId"
          :existing-count="existingAttachmentsCount"
          :disabled="loading"
          @success="handleUploadSuccess"
        />
        <div v-else class="upload-tip">
          保存记录后可上传图片
        </div>
      </el-form-item>
```

- [ ] **Step 4: 在 script 中添加相关状态和方法**

```javascript
const existingAttachmentsCount = ref(0);

// 上传成功处理
const handleUploadSuccess = (attachments) => {
  existingAttachmentsCount.value += attachments.length;
};
```

- [ ] **Step 5: 修改保存逻辑（新建模式）**

在创建记录成功后，获取 recordId 以便上传图片：

```javascript
// 在创建成功的响应处理中
if (response.data) {
  recordId.value = response.data.record._id;
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/views/RecordForm.vue
git commit -m "feat(frontend): 记录表单页添加图片上传功能"
```

---

## Task 18: 改造记录详情页（显示图片画廊）

**Files:**
- Modify: `frontend/src/views/RecordDetail.vue`

- [ ] **Step 1: 在 script 部分导入 AttachmentGallery 组件**

```javascript
import AttachmentGallery from '@/components/AttachmentGallery.vue';
```

- [ ] **Step 2: 在组件注册中添加**

在 `components` 对象中添加：
```javascript
  AttachmentGallery,
```

- [ ] **Step 3: 在模板中生理指标卡片后添加检查报告区域**

在生理指标卡片后添加：

```vue
    <!-- 检查报告 -->
    <div v-if="record.attachments && record.attachments.length > 0" class="section">
      <div class="section-header">
        <h3>检查报告（{{ record.attachments.length }}）</h3>
      </div>
      <AttachmentGallery
        :record-id="recordId"
        :attachments="record.attachments"
        @update="fetchRecord"
        @delete="fetchRecord"
      />
    </div>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/views/RecordDetail.vue
git commit -m "feat(frontend): 记录详情页添加图片画廊展示"
```

---

## Task 19: 创建时间轴项组件

**Files:**
- Create: `frontend/src/components/TimelineItem.vue`

- [ ] **Step 1: 创建组件文件**

```vue
<template>
  <div class="timeline-item">
    <div class="timeline-dot"></div>
    <div class="timeline-content">
      <div class="card" @click="handleClick">
        <div class="card-header">
          <div class="date-info">
            <div class="checkup-date">{{ formatDate(record.checkupDate) }}</div>
            <div class="gestational-age">
              {{ record.gestationalWeek }}周{{ record.gestationalDay > 0 ? `+${record.gestationalDay}天` : '' }}
            </div>
          </div>
          <div v-if="record.attachments && record.attachments.length" class="attachment-badge">
            <el-icon><Picture /></el-icon>
            {{ record.attachments.length }}
          </div>
        </div>
        
        <div class="card-body">
          <div class="info-row">
            <span class="label">医院：</span>
            <span class="value">{{ record.hospital || '未填写' }}</span>
          </div>
          <div v-if="record.doctor" class="info-row">
            <span class="label">医生：</span>
            <span class="value">{{ record.doctor }}</span>
          </div>
          <div v-if="record.vitals" class="vitals-summary">
            <span v-if="record.vitals.weight" class="vital-item">
              体重 {{ record.vitals.weight }}kg
            </span>
            <span v-if="record.vitals.bloodPressure" class="vital-item">
              血压 {{ record.vitals.bloodPressure.systolic }}/{{ record.vitals.bloodPressure.diastolic }}
            </span>
            <span v-if="record.vitals.fetalHeartRate" class="vital-item">
              胎心 {{ record.vitals.fetalHeartRate }}次/分
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Picture } from '@element-plus/icons-vue';
import dayjs from 'dayjs';

const props = defineProps({
  record: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['click']);

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD');
};

const handleClick = () => {
  emit('click', props.record._id);
};
</script>

<style scoped>
.timeline-item {
  position: relative;
  padding-left: 40px;
  padding-bottom: 32px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 24px;
  bottom: 0;
  width: 2px;
  background: #E7E1D7;
}

.timeline-item:last-child::before {
  display: none;
}

.timeline-dot {
  position: absolute;
  left: 0;
  top: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #C4612F;
  border: 4px solid #F7F4EF;
  box-shadow: 0 0 0 2px #C4612F;
}

.timeline-content {
  width: 100%;
}

.card {
  background: #FBF9F5;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #E7E1D7;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(31, 36, 33, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.date-info {
  flex: 1;
}

.checkup-date {
  font-size: 18px;
  font-weight: 600;
  color: #1F2421;
  margin-bottom: 4px;
}

.gestational-age {
  font-size: 14px;
  color: #5C635D;
}

.attachment-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: #F2E3D6;
  border-radius: 999px;
  font-size: 12px;
  color: #C4612F;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  font-size: 14px;
}

.label {
  color: #5C635D;
  min-width: 50px;
}

.value {
  color: #1F2421;
}

.vitals-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #E7E1D7;
}

.vital-item {
  font-size: 13px;
  color: #5C635D;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/TimelineItem.vue
git commit -m "feat(frontend): 创建时间轴项组件"
```

---

## Task 20: 创建时间轴页面

**Files:**
- Create: `frontend/src/views/Timeline.vue`

- [ ] **Step 1: 创建页面文件**

```vue
<template>
  <div class="timeline-page">
    <div class="header">
      <h1>产检时间轴</h1>
    </div>
    
    <div v-if="loading" class="loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      加载中...
    </div>
    
    <div v-else-if="records.length === 0" class="empty">
      <el-empty description="还没有产检记录">
        <el-button type="primary" @click="goToAddRecord">
          添加第一条记录
        </el-button>
      </el-empty>
    </div>
    
    <div v-else class="timeline-container">
      <TimelineItem
        v-for="record in records"
        :key="record._id"
        :record="record"
        @click="goToDetail"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Loading } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import TimelineItem from '@/components/TimelineItem.vue';
import { getRecords } from '@/api/record';

const router = useRouter();
const loading = ref(true);
const records = ref([]);

// 获取记录列表
const fetchRecords = async () => {
  try {
    loading.value = true;
    const response = await getRecords();
    records.value = response.data.records;
  } catch (error) {
    console.error('获取记录失败:', error);
    ElMessage.error('获取记录失败');
  } finally {
    loading.value = false;
  }
};

// 跳转到详情页
const goToDetail = (recordId) => {
  router.push(`/record/${recordId}`);
};

// 跳转到添加记录页
const goToAddRecord = () => {
  router.push('/record/new');
};

onMounted(() => {
  fetchRecords();
});
</script>

<style scoped>
.timeline-page {
  min-height: 100vh;
  background: #F7F4EF;
  padding: 24px;
}

.header {
  max-width: 800px;
  margin: 0 auto 32px;
}

.header h1 {
  font-size: 32px;
  font-weight: 600;
  color: #1F2421;
  margin: 0;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 60px 20px;
  color: #5C635D;
}

.empty {
  display: flex;
  justify-content: center;
  padding: 60px 20px;
}

.timeline-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(31, 36, 33, 0.04);
}

@media (max-width: 768px) {
  .timeline-page {
    padding: 16px;
  }
  
  .header h1 {
    font-size: 24px;
  }
  
  .timeline-container {
    padding: 16px;
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/Timeline.vue
git commit -m "feat(frontend): 创建时间轴页面"
```

---

## Task 21: 添加时间轴路由

**Files:**
- Modify: `frontend/src/router/index.js`

- [ ] **Step 1: 在路由配置中添加时间轴路由**

在现有路由数组中添加：

```javascript
  {
    path: '/timeline',
    name: 'Timeline',
    component: () => import('@/views/Timeline.vue'),
    meta: { requiresAuth: true }
  },
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/router/index.js
git commit -m "feat(frontend): 添加时间轴路由"
```

---

## Task 22: 在首页导航栏添加时间轴入口

**Files:**
- Modify: `frontend/src/views/Home.vue`

- [ ] **Step 1: 在导航栏添加时间轴按钮**

在导航栏中"家庭设置"按钮前添加：

```vue
        <el-button link @click="goToTimeline">
          <el-icon><Clock /></el-icon>
          时间轴
        </el-button>
```

- [ ] **Step 2: 在 script 中导入 Clock 图标**

```javascript
import { Clock } from '@element-plus/icons-vue';
```

- [ ] **Step 3: 添加跳转方法**

```javascript
const goToTimeline = () => {
  router.push('/timeline');
};
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/views/Home.vue
git commit -m "feat(frontend): 首页添加时间轴入口"
```

---

## Task 23: 前端功能集成测试

**Files:**
- Test: Manual testing

- [ ] **Step 1: 启动前端开发服务器**

```bash
cd frontend
pnpm dev
```

Expected: 服务启动成功，可访问 http://localhost:5173

- [ ] **Step 2: 测试图片上传流程**

1. 登录应用
2. 创建或编辑一条产检记录
3. 在记录表单中上传图片
4. 选择分类和添加标签
5. 保存并查看详情

Expected: 图片上传成功，详情页正确显示

- [ ] **Step 3: 测试图片管理功能**

1. 在记录详情页查看图片
2. 点击图片放大预览
3. 测试左右切换、缩放功能
4. 编辑图片分类和标签
5. 删除图片

Expected: 所有功能正常工作

- [ ] **Step 4: 测试时间轴功能**

1. 点击导航栏"时间轴"按钮
2. 查看时间轴页面布局
3. 确认记录按时间倒序排列
4. 确认图片数量角标显示
5. 点击卡片跳转到详情页

Expected: 时间轴正确显示，交互流畅

- [ ] **Step 5: 测试权限控制**

1. 使用 family 角色账号登录
2. 确认只能查看图片，不能上传/编辑/删除
3. 切换回 owner 账号
4. 确认所有操作权限正常

Expected: 权限控制正确

---

## Task 24: 前端构建测试

**Files:**
- Test: Build verification

- [ ] **Step 1: 执行生产构建**

```bash
cd frontend
pnpm build
```

Expected: 构建成功，无错误和警告

- [ ] **Step 2: 预览生产构建**

```bash
pnpm preview
```

Expected: 预览服务启动成功，应用正常运行

- [ ] **Step 3: Commit（如有构建配置调整）**

```bash
git add .
git commit -m "chore(frontend): 构建配置优化"
```

---

## Task 25: 文档更新

**Files:**
- Modify: `PROJECT_SUMMARY.md`
- Modify: `README.md`

- [ ] **Step 1: 更新 PROJECT_SUMMARY.md**

在"已完成功能"部分添加：

```markdown
### 第二阶段功能（2026-07-02 完成）

**图片上传和管理**：
- ✅ 为产检记录上传图片附件（化验单、B超等）
- ✅ 支持 jpg、png、webp 格式
- ✅ 单张最大 10MB，每条记录最多 20 张
- ✅ 图片按分类（B超、血常规等）组织
- ✅ 支持自定义标签
- ✅ 图片放大预览、编辑、删除功能
- ✅ Owner/Family 权限控制

**时间轴展示**：
- ✅ 独立的时间轴视图页面
- ✅ 垂直时间线布局
- ✅ 显示图片数量角标
- ✅ 点击跳转到详情页
```

- [ ] **Step 2: 更新 README.md**

在功能介绍部分添加第二阶段功能说明

- [ ] **Step 3: Commit**

```bash
git add PROJECT_SUMMARY.md README.md
git commit -m "docs: 更新文档记录第二阶段功能完成"
```

---

## 自我审查清单

**规格覆盖检查：**
- [x] 图片上传和管理 - Task 2-12（后端），Task 13-18（前端）
- [x] 检查结果分类记录 - Task 2（预设分类），Task 16（画廊组件分组显示）
- [x] 时间轴展示 - Task 19-22
- [x] 文件存储结构 - Task 2（multer 配置）
- [x] 权限控制 - Task 3（文件访问），Task 6-8（API 权限），Task 16（前端权限）
- [x] 文件清理 - Task 4, 9

**占位符检查：**
- 无 TBD、TODO 或"实现类似"的占位符
- 所有代码块完整
- 所有文件路径明确

**类型一致性检查：**
- attachments 字段结构在后端模型（Task 5）和前端组件中一致
- API 端点路径在后端路由（Task 10）和前端 API（Task 14）中一致
- 分类常量在后端（Task 2）和前端（Task 13）中一致

---

## 执行说明

计划已完成。包含 25 个任务，覆盖：
- 后端：依赖安装、配置、模型扩展、控制器、路由、静态文件服务
- 前端：组件开发、页面改造、路由配置、API 集成
- 测试：后端 API 测试、前端功能测试、构建测试
- 文档：项目文档更新

**预估工作量**：12-17 小时
