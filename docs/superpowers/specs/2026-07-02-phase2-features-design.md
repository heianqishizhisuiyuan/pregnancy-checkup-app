# 产检记录应用 - 第二阶段功能设计文档

## 文档信息

- **创建日期**: 2026-07-02
- **版本**: 1.0
- **负责人**: 开发团队
- **状态**: 设计完成，待实施

## 1. 概述

### 1.1 目标

本文档定义产检记录应用第二阶段的功能设计，主要包括：
1. 图片上传和管理
2. 检查结果分类记录
3. 时间轴展示

### 1.2 范围

**包含功能：**
- 为产检记录添加图片附件（化验单、B超等）
- 图片分类管理（预设分类 + 自定义标签）
- 独立的时间轴视图页面

**暂不包含：**
- 家人分享功能（邀请码机制）- 延后实现

### 1.3 技术选型

- **文件上传**: multer
- **文件存储**: 本地文件系统
- **图片格式**: jpg、png、webp
- **前端组件**: Element Plus Upload、Image Viewer
- **文件标识**: UUID

---

## 2. 数据模型设计

### 2.1 Record 模型扩展

在现有的 `Record` 模型中新增 `attachments` 字段：

```javascript
{
  // 现有字段保持不变
  _id: ObjectId,
  familyId: ObjectId,
  createdBy: ObjectId,
  checkupDate: Date,
  gestationalWeek: Number,
  gestationalDay: Number,
  hospital: String,
  doctor: String,
  vitals: { ... },
  notes: String,
  
  // 新增：附件字段
  attachments: [{
    _id: ObjectId,              // 附件 ID
    filename: String,            // 原始文件名（用户上传时的名字）
    storedName: String,          // 服务器存储名（UUID + 扩展名）
    path: String,                // 相对路径（如：uploads/families/123/records/456/xxx.jpg）
    size: Number,                // 文件大小（字节）
    mimetype: String,            // MIME 类型（image/jpeg, image/png 等）
    category: String,            // 分类（B超、血常规等）
    tags: [String],              // 自定义标签
    uploadedAt: Date,            // 上传时间
    uploadedBy: ObjectId         // 上传者 ID
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

### 2.2 文件存储结构

本地文件系统组织方式：

```
backend/
└── uploads/                    # 文件上传根目录
    └── families/               # 按家庭分组
        └── {familyId}/         # 每个家庭一个目录
            └── records/        # 产检记录目录
                └── {recordId}/ # 每条记录一个目录
                    ├── uuid1.jpg
                    ├── uuid2.png
                    └── uuid3.webp
```

**设计考虑：**
- 按家庭隔离，方便数据管理和删除
- 按记录分组，结构清晰
- 使用 UUID 文件名，避免重名冲突
- 保留原始扩展名，方便识别文件类型

### 2.3 预设分类列表

后端定义常量：

```javascript
const ATTACHMENT_CATEGORIES = [
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

**使用方式：**
- 用户从预设分类中选择（下拉框）
- 可添加自定义标签（tags 字段，支持多个）

### 2.4 约束和限制

- **文件格式**: jpg、jpeg、png、webp
- **单文件大小**: 最大 10MB
- **单次上传**: 最多 10 个文件
- **记录总附件数**: 最多 20 个
- **文件名**: UUID + 原始扩展名

---

## 3. 后端 API 设计

### 3.1 上传附件 API

**端点**: `POST /api/records/:recordId/attachments`

**功能**: 为指定产检记录上传图片

**权限**: 需要 owner 权限

**请求**:
- Content-Type: `multipart/form-data`
- 字段：
  - `files`: 图片文件（支持多文件上传）
  - `category`: 分类（可选，默认"其他"）
  - `tags`: 自定义标签（可选，JSON 数组字符串）

**验证规则**:
- 记录必须存在且属于当前用户家庭
- 文件格式：jpg, jpeg, png, webp
- 单文件大小：最大 10MB
- 单次上传：最多 10 个文件
- 记录总附件数：最多 20 个

**响应**:
```json
{
  "success": true,
  "data": {
    "attachments": [
      {
        "_id": "att123",
        "filename": "化验单.jpg",
        "url": "/uploads/families/fam123/records/rec456/uuid1.jpg",
        "category": "血常规",
        "tags": ["空腹"],
        "size": 1234567,
        "uploadedAt": "2026-07-02T10:00:00.000Z"
      }
    ]
  }
}
```

### 3.2 删除附件 API

**端点**: `DELETE /api/records/:recordId/attachments/:attachmentId`

**功能**: 删除指定附件

**权限**: 需要 owner 权限

**行为**:
- 从 MongoDB 删除附件记录
- 从文件系统删除物理文件
- 返回更新后的记录

**响应**:
```json
{
  "success": true,
  "data": {
    "message": "附件删除成功"
  }
}
```

### 3.3 更新附件信息 API

**端点**: `PUT /api/records/:recordId/attachments/:attachmentId`

**功能**: 更新附件的分类和标签（不修改文件本身）

**权限**: 需要 owner 权限

**请求体**:
```json
{
  "category": "B超",
  "tags": ["NT检查", "11周"]
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "attachment": {
      "_id": "att123",
      "category": "B超",
      "tags": ["NT检查", "11周"]
    }
  }
}
```

### 3.4 静态文件访问

**端点**: `GET /uploads/families/:familyId/records/:recordId/:filename`

**功能**: 访问上传的图片文件

**权限**: 需要认证，且用户必须属于该家庭

**实现**:
- 使用 Express 静态文件中间件
- 添加权限验证中间件（检查用户是否属于该家庭）
- 设置合适的 Cache-Control 头

---

## 4. 前端页面设计

### 4.1 记录表单页改造（RecordForm.vue）

**新增功能**: 添加图片上传区域

**位置**: 在"备注"字段之后，"保存/取消"按钮之前

**UI 组件**: 使用 Element Plus 的 `el-upload`

**交互**:
- 点击"上传图片"按钮，打开文件选择器
- 支持多选图片
- 图片上传后显示缩略图预览
- 每张图片下方有：
  - 分类下拉框（预设分类）
  - 自定义标签输入框
  - 删除按钮

**保存逻辑**:
- 编辑模式：先保存记录，再上传图片
- 新建模式：先创建记录，获取 recordId，再上传图片

### 4.2 记录详情页改造（RecordDetail.vue）

**新增区域**: 在生理指标卡片下方添加"检查报告"区域

**布局特点**:
- 图片按分类分组展示
- 每个分类显示该分类的图片数量
- 图片以缩略图形式展示

**交互**:
- 点击图片打开大图预览（使用 Element Plus 的 `el-image-viewer`）
- 大图预览支持左右切换、缩放、旋转
- Owner 可以：
  - 添加更多图片
  - 编辑图片分类和标签
  - 删除图片
- Family 角色只能查看，不能编辑/删除

### 4.3 时间轴页面（新建 Timeline.vue）

**路由**: `/timeline`

**入口**: 在首页顶部导航栏添加"时间轴"按钮

**布局**:
- 垂直时间轴，左侧日期 + 孕周，右侧记录卡片
- 时间线用 CSS 实现（圆点 + 连线）
- 卡片样式与首页保持一致
- 点击卡片跳转到详情页
- 显示图片数量角标

**响应式**:
- 移动端：时间线居中，卡片两侧交替显示
- 桌面端：时间线偏左，卡片统一在右侧

### 4.4 新增组件

**AttachmentUpload.vue** - 图片上传组件
- 支持多文件选择
- 拖拽上传
- 实时预览
- 分类和标签编辑

**AttachmentGallery.vue** - 图片画廊组件
- 按分类分组展示
- 点击放大预览
- 支持编辑和删除（owner权限）

**TimelineItem.vue** - 时间轴项组件
- 显示单条产检记录
- 复用 RecordCard 的部分逻辑

---

## 5. 技术实现细节

### 5.1 Multer 配置

**依赖安装**:
```bash
pnpm add multer uuid
```

**存储配置**:
```javascript
// backend/src/config/multer.js
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { familyId } = req.user;
    const { recordId } = req.params;
    const uploadDir = path.join('uploads', 'families', familyId.toString(), 'records', recordId);
    
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 jpg、png、webp 格式的图片'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,  // 10MB
    files: 10                     // 单次最多10个文件
  }
});
```

### 5.2 权限验证中间件

**静态文件访问权限**:
```javascript
// backend/src/middlewares/fileAccess.js
export const checkFileAccess = async (req, res, next) => {
  try {
    const pathParts = req.path.split('/');
    const familyIdIndex = pathParts.indexOf('families') + 1;
    const familyId = pathParts[familyIdIndex];
    
    if (req.user.familyId.toString() !== familyId) {
      return res.status(403).json({
        success: false,
        error: { message: '无权访问该资源' }
      });
    }
    
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: { message: '访问被拒绝' }
    });
  }
};
```

**应用到路由**:
```javascript
// backend/src/app.js
app.use('/uploads', authenticateToken, checkFileAccess, express.static('uploads'));
```

### 5.3 文件删除处理

**删除记录时清理附件**:
- 删除所有附件文件
- 删除记录目录（如果为空）
- 记录删除失败，文件保留；文件删除失败，记录日志但不影响记录删除

### 5.4 前端文件上传

**Element Plus Upload 组件配置**:
```vue
<el-upload
  :action="`${API_BASE_URL}/api/records/${recordId}/attachments`"
  :headers="{ Authorization: `Bearer ${token}` }"
  :before-upload="beforeUpload"
  :limit="20"
  accept="image/jpeg,image/jpg,image/png,image/webp"
  list-type="picture-card"
  multiple
>
  <el-icon><Plus /></el-icon>
</el-upload>
```

**文件验证**:
- 验证文件类型
- 验证文件大小（< 10MB）
- 验证总数量限制（≤ 20）

---

## 6. 错误处理

### 6.1 后端错误处理

**文件上传错误**:
- 文件格式不支持 → 400 错误
- 文件过大 → 413 错误（Payload Too Large）
- 超过数量限制 → 400 错误
- 磁盘空间不足 → 500 错误
- 无权限访问 → 403 错误

**文件删除错误**:
- 文件不存在 → 记录日志，继续执行
- 权限不足 → 记录日志，继续执行
- 目录非空 → 保留目录

### 6.2 前端错误处理

**上传错误**:
- 上传失败显示错误提示
- 网络错误重试机制
- 上传进度显示
- 文件验证失败提前拦截

**边界情况**:
- 上传过程中用户离开页面 → 已上传的文件保留
- 同时上传多个大文件 → 显示进度条
- 删除记录时附件删除失败 → 记录依然删除，记录日志

---

## 7. 测试和验收标准

### 7.1 功能测试清单

**图片上传功能**:
- [ ] 在记录表单页可以选择并上传图片
- [ ] 支持 jpg、png、webp 格式
- [ ] 拒绝其他格式文件（显示错误提示）
- [ ] 单张图片超过 10MB 显示错误提示
- [ ] 可以同时选择多张图片上传
- [ ] 上传时显示进度条
- [ ] 上传成功后显示缩略图预览
- [ ] 可以为每张图片选择分类
- [ ] 可以为每张图片添加自定义标签
- [ ] 单条记录最多上传 20 张图片
- [ ] 超过数量限制时禁用上传按钮

**图片管理功能**:
- [ ] 记录详情页按分类分组展示图片
- [ ] 点击图片可以放大预览
- [ ] 大图预览支持左右切换
- [ ] 大图预览支持缩放和旋转
- [ ] Owner 可以编辑图片分类和标签
- [ ] Owner 可以删除图片
- [ ] Family 角色只能查看，不能编辑/删除
- [ ] 删除图片需要二次确认
- [ ] 删除图片后文件系统中的文件也被删除

**记录删除联动**:
- [ ] 删除记录时，所有附件图片也被删除
- [ ] 删除记录后，文件系统中的记录目录被清理

**时间轴功能**:
- [ ] 首页导航栏显示"时间轴"入口
- [ ] 时间轴页面按时间倒序显示所有记录
- [ ] 左侧显示日期和孕周，右侧显示记录卡片
- [ ] 记录卡片显示图片数量角标
- [ ] 点击卡片跳转到记录详情页
- [ ] 时间线样式美观（圆点 + 连线）
- [ ] 移动端响应式布局正常

### 7.2 权限测试

**Owner 权限**:
- [ ] 可以上传图片
- [ ] 可以编辑图片信息
- [ ] 可以删除图片
- [ ] 可以删除记录及其所有图片

**Family 权限**:
- [ ] 可以查看所有图片
- [ ] 不能上传图片（按钮不显示）
- [ ] 不能编辑图片信息
- [ ] 不能删除图片
- [ ] 不能删除记录

**跨家庭访问**:
- [ ] 用户 A 不能访问用户 B 家庭的图片 URL
- [ ] 直接访问其他家庭的图片返回 403 错误

### 7.3 性能测试

- [ ] 记录详情页加载 20 张图片缩略图在 2 秒内完成
- [ ] 时间轴页面加载 50 条记录在 3 秒内完成
- [ ] 大图预览打开速度快（< 1 秒）
- [ ] 上传 10MB 文件成功且速度合理

### 7.4 用户体验测试

- [ ] 上传按钮易于找到和点击
- [ ] 文件选择器支持多选
- [ ] 图片预览清晰美观
- [ ] 删除操作有明确的确认提示
- [ ] 所有操作有及时的成功/失败反馈
- [ ] 图片展示区域符合温馨关怀风格
- [ ] 时间轴样式美观且易读

### 7.5 验收标准

**必须满足**:
1. 所有功能测试清单项通过
2. 所有权限测试项通过
3. 不存在明显的安全漏洞
4. 核心功能在主流浏览器正常工作（Chrome、Safari、Edge）
5. 移动端（iOS/Android）基本功能正常

---

## 8. 实施计划

### 8.1 开发任务拆解

**后端任务**:
1. 安装依赖（multer、uuid）
2. 创建 multer 配置文件
3. 创建文件访问权限中间件
4. 扩展 Record 模型（添加 attachments 字段）
5. 实现附件上传控制器
6. 实现附件删除控制器
7. 实现附件更新控制器
8. 配置静态文件服务和权限验证
9. 修改删除记录逻辑（联动删除附件）

**前端任务**:
1. 创建 AttachmentUpload 组件
2. 创建 AttachmentGallery 组件
3. 改造 RecordForm 页面（添加图片上传）
4. 改造 RecordDetail 页面（显示图片画廊）
5. 创建 Timeline 页面
6. 创建 TimelineItem 组件
7. 在导航栏添加时间轴入口
8. 添加图片上传相关 API 接口
9. 添加图片预览功能

**测试任务**:
1. 功能测试
2. 权限测试
3. 性能测试
4. 用户体验测试

### 8.2 预估工作量

- 后端开发：4-6 小时
- 前端开发：6-8 小时
- 测试验证：2-3 小时
- **总计**: 12-17 小时

---

## 9. 风险和注意事项

### 9.1 风险

1. **磁盘空间管理**: 需要定期监控磁盘使用情况
2. **文件删除一致性**: 数据库和文件系统删除可能不同步
3. **并发上传**: 多用户同时上传可能导致性能问题
4. **备份复杂性**: 文件系统备份需要与数据库备份同步

### 9.2 未来优化方向

1. **图片压缩**: 自动压缩上传的图片以节省空间
2. **缩略图生成**: 生成缩略图加快列表页加载
3. **云存储迁移**: 迁移到阿里云 OSS/腾讯云 COS
4. **CDN 加速**: 使用 CDN 加速图片访问
5. **图片懒加载**: 优化大量图片的加载性能

---

## 10. 参考资料

- [Multer 文档](https://github.com/expressjs/multer)
- [Element Plus Upload 组件](https://element-plus.org/zh-CN/component/upload.html)
- [Element Plus Image Viewer](https://element-plus.org/zh-CN/component/image.html)
- 项目设计文档：`docs/design.md`
- MVP 实施计划：`docs/superpowers/plans/2026-07-02-pregnancy-checkup-mvp.md`
