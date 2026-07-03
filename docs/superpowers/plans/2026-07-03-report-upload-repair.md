# Report Upload Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复检查报告上传/查看/更新/删除的可用性问题，并补齐记录表单页“先选图、保存后自动上传”的流程。

**Architecture:** 前端通过新增小型附件辅助工具来承载 URL 构造、待上传队列和保存后自动上传逻辑，避免把状态机硬塞进 Vue 组件。后端在附件上传路由前增加记录存在性校验中间件，阻止无效 `recordId` 请求先落盘。组件层只做界面和事件编排，核心行为放到可测试的纯函数里。

**Tech Stack:** Vue 3, Vite, Element Plus, Axios, Node.js test runner, Express, Mongoose, Multer

---

## File Map

### Frontend

- Create: `frontend/src/utils/attachmentUrls.js`
  - 负责从 `VITE_API_BASE_URL` 推导上传地址与图片访问地址
- Create: `frontend/src/utils/attachmentUrls.test.js`
  - 覆盖上传 URL 和图片 URL 构造
- Create: `frontend/src/utils/attachmentQueue.js`
  - 负责待上传队列项构造、更新、删除、顺序上传
- Create: `frontend/src/utils/attachmentQueue.test.js`
  - 覆盖保存后自动上传的顺序调用和错误汇总
- Modify: `frontend/src/components/AttachmentUpload.vue`
  - 支持 `queue` 模式和 `upload` 模式
- Modify: `frontend/src/components/AttachmentGallery.vue`
  - 使用统一图片 URL 工具
- Modify: `frontend/src/views/RecordForm.vue`
  - 新建页待上传队列、保存后自动上传、编辑页现有附件管理
- Modify: `frontend/src/views/RecordDetail.vue`
  - 修复刷新函数引用，统一附件事件回调

### Backend

- Create: `backend/src/middlewares/recordExists.js`
  - 上传前校验 `recordId` 是否存在且属于当前家庭
- Create: `backend/src/middlewares/recordExists.test.js`
  - 覆盖存在/不存在两种路径
- Modify: `backend/src/routes/record.js`
  - 在 `upload.array(...)` 前接入 `recordExists` 中间件

### Verification

- Reuse: `frontend/package.json`
- Reuse: `backend/package.json`

---

### Task 1: Add Attachment URL Helpers

**Files:**
- Create: `frontend/src/utils/attachmentUrls.js`
- Test: `frontend/src/utils/attachmentUrls.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAttachmentUploadUrl, buildAttachmentFileUrl } from './attachmentUrls.js';

test('buildAttachmentUploadUrl appends records path to API base url without duplicating api', () => {
  assert.equal(
    buildAttachmentUploadUrl('http://localhost:3000/api', 'record-123'),
    'http://localhost:3000/api/records/record-123/attachments'
  );
});

test('buildAttachmentFileUrl converts api base url to uploads root url', () => {
  assert.equal(
    buildAttachmentFileUrl('http://localhost:3000/api', 'uploads/families/f1/records/r1/image.webp'),
    'http://localhost:3000/uploads/families/f1/records/r1/image.webp'
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/utils/attachmentUrls.test.js`
Expected: FAIL with module not found for `./attachmentUrls.js`

- [ ] **Step 3: Write minimal implementation**

```javascript
function normalizeBaseUrl(baseUrl) {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

export function buildAttachmentUploadUrl(apiBaseUrl, recordId) {
  return `${normalizeBaseUrl(apiBaseUrl)}/records/${recordId}/attachments`;
}

export function buildAttachmentFileUrl(apiBaseUrl, relativePath) {
  const normalizedBase = normalizeBaseUrl(apiBaseUrl);
  const siteBase = normalizedBase.endsWith('/api')
    ? normalizedBase.slice(0, -4)
    : normalizedBase;
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${siteBase}/${cleanPath}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/utils/attachmentUrls.test.js`
Expected: PASS with 2 passing tests

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/attachmentUrls.js frontend/src/utils/attachmentUrls.test.js
git commit -m "fix(frontend): add attachment url helpers"
```

### Task 2: Add Upload Queue Helpers

**Files:**
- Create: `frontend/src/utils/attachmentQueue.js`
- Test: `frontend/src/utils/attachmentQueue.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { uploadQueuedAttachments } from './attachmentQueue.js';

test('uploadQueuedAttachments uploads queued files in order after record creation', async () => {
  const calls = [];
  const queue = [
    {
      file: { name: 'report-a.png' },
      category: 'B超',
      tags: ['12周']
    },
    {
      file: { name: 'report-b.png' },
      category: '血常规',
      tags: ['空腹']
    }
  ];

  const uploader = async (recordId, entry) => {
    calls.push([recordId, entry.file.name, entry.category, entry.tags]);
    return { success: true };
  };

  const result = await uploadQueuedAttachments({
    recordId: 'record-123',
    queue,
    uploader
  });

  assert.deepEqual(calls, [
    ['record-123', 'report-a.png', 'B超', ['12周']],
    ['record-123', 'report-b.png', '血常规', ['空腹']]
  ]);
  assert.equal(result.failed.length, 0);
});

test('uploadQueuedAttachments reports failed entries without hiding successful uploads', async () => {
  const uploader = async (recordId, entry) => {
    if (entry.file.name === 'bad.png') {
      throw new Error('UPLOAD_FAILED');
    }
    return { success: true };
  };

  const result = await uploadQueuedAttachments({
    recordId: 'record-123',
    queue: [
      { file: { name: 'good.png' }, category: '其他', tags: [] },
      { file: { name: 'bad.png' }, category: '其他', tags: [] }
    ],
    uploader
  });

  assert.equal(result.succeeded.length, 1);
  assert.equal(result.failed.length, 1);
  assert.equal(result.failed[0].file.name, 'bad.png');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/utils/attachmentQueue.test.js`
Expected: FAIL with module not found for `./attachmentQueue.js`

- [ ] **Step 3: Write minimal implementation**

```javascript
export function createQueuedAttachmentEntry(file, overrides = {}) {
  return {
    id: overrides.id || `${file.name}-${file.size}-${file.lastModified || 0}`,
    file,
    category: overrides.category || '其他',
    tags: overrides.tags || [],
    status: overrides.status || 'queued'
  };
}

export async function uploadQueuedAttachments({ recordId, queue, uploader }) {
  const succeeded = [];
  const failed = [];

  for (const entry of queue) {
    try {
      await uploader(recordId, entry);
      succeeded.push(entry);
    } catch (error) {
      failed.push({ ...entry, error });
    }
  }

  return { succeeded, failed };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/utils/attachmentQueue.test.js`
Expected: PASS with 2 passing tests

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/attachmentQueue.js frontend/src/utils/attachmentQueue.test.js
git commit -m "feat(frontend): add attachment queue helpers"
```

### Task 3: Add Backend Record Existence Guard

**Files:**
- Create: `backend/src/middlewares/recordExists.js`
- Create: `backend/src/middlewares/recordExists.test.js`
- Modify: `backend/src/routes/record.js`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecordExistsMiddleware } from './recordExists.js';

test('recordExists middleware returns 404 when record does not belong to current family', async () => {
  const middleware = createRecordExistsMiddleware({
    findRecord: async () => null
  });

  let statusCode = 200;
  let payload = null;
  let nextCalled = false;

  const req = {
    params: { recordId: 'record-123' },
    user: { familyId: 'family-1' }
  };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
      return this;
    }
  };

  await middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(statusCode, 404);
  assert.equal(payload.error.code, 'NOT_FOUND');
  assert.equal(nextCalled, false);
});

test('recordExists middleware calls next when record exists', async () => {
  const middleware = createRecordExistsMiddleware({
    findRecord: async () => ({ _id: 'record-123' })
  });

  let nextCalled = false;

  await middleware(
    {
      params: { recordId: 'record-123' },
      user: { familyId: 'family-1' }
    },
    {
      status() {
        throw new Error('status should not be called');
      },
      json() {
        throw new Error('json should not be called');
      }
    },
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/middlewares/recordExists.test.js`
Expected: FAIL with module not found for `./recordExists.js`

- [ ] **Step 3: Write minimal implementation**

```javascript
import Record from '../models/Record.js';

export function createRecordExistsMiddleware({ findRecord = defaultFindRecord } = {}) {
  return async function recordExists(req, res, next) {
    const { recordId } = req.params;
    const familyId = req.user.familyId;

    const record = await findRecord({ recordId, familyId });
    if (!record) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '记录不存在'
        }
      });
    }

    next();
  };
}

async function defaultFindRecord({ recordId, familyId }) {
  return Record.findOne({
    _id: recordId,
    familyId
  }).select('_id');
}

export const recordExists = createRecordExistsMiddleware();
```

在 `backend/src/routes/record.js` 中把上传路由改成：

```javascript
import { recordExists } from '../middlewares/recordExists.js';

router.post(
  '/:recordId/attachments',
  requireOwner,
  recordExists,
  upload.array('files', 10),
  uploadAttachments
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/middlewares/recordExists.test.js`
Expected: PASS with 2 passing tests

- [ ] **Step 5: Commit**

```bash
git add backend/src/middlewares/recordExists.js backend/src/middlewares/recordExists.test.js backend/src/routes/record.js
git commit -m "fix(backend): guard attachment uploads with record existence check"
```

### Task 4: Refactor AttachmentUpload for Queue and Direct Upload Modes

**Files:**
- Modify: `frontend/src/components/AttachmentUpload.vue`
- Modify: `frontend/src/api/attachment.js`
- Modify: `frontend/src/utils/attachmentUrls.js`
- Reuse: `frontend/src/utils/attachmentQueue.js`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createQueuedAttachmentEntry } from './attachmentQueue.js';

test('createQueuedAttachmentEntry defaults to category 其他 and queued status', () => {
  const entry = createQueuedAttachmentEntry({
    name: 'report.png',
    size: 100,
    lastModified: 1
  });

  assert.equal(entry.category, '其他');
  assert.deepEqual(entry.tags, []);
  assert.equal(entry.status, 'queued');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/utils/attachmentQueue.test.js`
Expected: FAIL because `createQueuedAttachmentEntry` is missing or incomplete

- [ ] **Step 3: Write minimal implementation**

在 `frontend/src/components/AttachmentUpload.vue` 中实现以下接口：

```javascript
const props = defineProps({
  mode: {
    type: String,
    default: 'upload'
  },
  recordId: {
    type: String,
    default: ''
  },
  queueItems: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits([
  'success',
  'queue-change'
]);
```

并按下面逻辑分支：

```javascript
if (props.mode === 'queue') {
  const nextQueue = [
    ...props.queueItems,
    ...selectedFiles.map(file => createQueuedAttachmentEntry(file))
  ];
  emit('queue-change', nextQueue);
  return false;
}
```

在直传模式下，上传请求不要再自己拼 `/api/api/...`，而是使用：

```javascript
const uploadUrl = computed(() => {
  return buildAttachmentUploadUrl(import.meta.env.VITE_API_BASE_URL, props.recordId);
});
```

在 `frontend/src/api/attachment.js` 中补一个单文件上传帮助函数，供表单页自动上传复用：

```javascript
export function uploadAttachmentEntry(recordId, entry) {
  const formData = new FormData();
  formData.append('files', entry.file);
  formData.append('category', entry.category);
  formData.append('tags', JSON.stringify(entry.tags));
  return uploadAttachments(recordId, formData);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/utils/attachmentQueue.test.js`
Expected: PASS and existing queue helper tests remain green

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/AttachmentUpload.vue frontend/src/api/attachment.js frontend/src/utils/attachmentQueue.js
git commit -m "feat(frontend): support queued and direct attachment upload modes"
```

### Task 5: Wire RecordForm to Queue Before Save and Auto Upload After Save

**Files:**
- Modify: `frontend/src/views/RecordForm.vue`
- Reuse: `frontend/src/components/AttachmentUpload.vue`
- Reuse: `frontend/src/components/AttachmentGallery.vue`
- Reuse: `frontend/src/utils/attachmentQueue.js`
- Reuse: `frontend/src/api/attachment.js`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { uploadQueuedAttachments } from '../utils/attachmentQueue.js';

test('uploadQueuedAttachments can be used after createRecord to upload selected images', async () => {
  const queue = [
    {
      file: { name: 'first.png' },
      category: 'NT检查',
      tags: ['11周']
    }
  ];

  const uploaded = [];
  const recordId = 'new-record-id';

  const result = await uploadQueuedAttachments({
    recordId,
    queue,
    uploader: async (nextRecordId, entry) => {
      uploaded.push([nextRecordId, entry.file.name]);
      return { success: true };
    }
  });

  assert.deepEqual(uploaded, [['new-record-id', 'first.png']]);
  assert.equal(result.failed.length, 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/utils/attachmentQueue.test.js`
Expected: FAIL until helper and integration contract exist

- [ ] **Step 3: Write minimal implementation**

在 `frontend/src/views/RecordForm.vue` 中增加状态：

```javascript
const pendingAttachments = ref([]);
const currentRecordId = ref(route.params.id || '');
```

在模板中，在备注后增加：

```vue
<el-divider content-position="left">检查报告</el-divider>

<el-form-item v-if="!isEditMode" label="待上传图片">
  <AttachmentUpload
    mode="queue"
    :queue-items="pendingAttachments"
    @queue-change="pendingAttachments = $event"
  />
</el-form-item>

<template v-else>
  <el-form-item label="上传图片">
    <AttachmentUpload
      mode="upload"
      :record-id="currentRecordId"
      :existing-count="recordAttachments.length"
      @success="loadRecord"
    />
  </el-form-item>
  <AttachmentGallery
    v-if="recordAttachments.length"
    :record-id="currentRecordId"
    :attachments="recordAttachments"
    @update="loadRecord"
    @delete="loadRecord"
  />
</template>
```

在提交成功后增加：

```javascript
if (!isEditMode.value) {
  currentRecordId.value = response.data._id;
  const uploadResult = await uploadQueuedAttachments({
    recordId: currentRecordId.value,
    queue: pendingAttachments.value,
    uploader: uploadAttachmentEntry
  });

  if (uploadResult.failed.length > 0) {
    ElMessage.warning('记录已创建，但部分检查报告上传失败，可稍后在详情页继续上传');
  }

  router.push({ name: 'RecordDetail', params: { id: currentRecordId.value } });
  return;
}
```

并在编辑模式加载记录时，把 `record.attachments || []` 存入本地 `recordAttachments`。

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/utils/attachmentQueue.test.js`
Expected: PASS and no new frontend test failures

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/RecordForm.vue
git commit -m "feat(frontend): queue report uploads before record creation"
```

### Task 6: Fix RecordDetail Refresh and Attachment Image Rendering

**Files:**
- Modify: `frontend/src/views/RecordDetail.vue`
- Modify: `frontend/src/components/AttachmentGallery.vue`
- Reuse: `frontend/src/utils/attachmentUrls.js`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAttachmentFileUrl } from '../utils/attachmentUrls.js';

test('buildAttachmentFileUrl leaves existing uploads path intact under site root', () => {
  assert.equal(
    buildAttachmentFileUrl('https://api.example.com/api', '/uploads/families/f1/records/r1/test.png'),
    'https://api.example.com/uploads/families/f1/records/r1/test.png'
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/utils/attachmentUrls.test.js`
Expected: FAIL until leading-slash handling is correct

- [ ] **Step 3: Write minimal implementation**

在 `frontend/src/views/RecordDetail.vue` 中把 `loadRecord` 更名或别名为 `refreshRecord`，并统一使用：

```javascript
const refreshRecord = async () => {
  loading.value = true;
  try {
    const response = await getRecordById(route.params.id);
    if (response.success) {
      record.value = response.data;
    }
  } finally {
    loading.value = false;
  }
};

const handleUploadSuccess = () => {
  refreshRecord();
};
```

模板事件统一改成：

```vue
<AttachmentGallery
  :record-id="recordId"
  :attachments="record.attachments"
  @update="refreshRecord"
  @delete="refreshRecord"
/>
```

在 `frontend/src/components/AttachmentGallery.vue` 中把：

```javascript
return `${import.meta.env.VITE_API_BASE_URL}/${path}`;
```

改成：

```javascript
return buildAttachmentFileUrl(import.meta.env.VITE_API_BASE_URL, path);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/utils/attachmentUrls.test.js`
Expected: PASS and no frontend unit regressions

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/RecordDetail.vue frontend/src/components/AttachmentGallery.vue frontend/src/utils/attachmentUrls.js
git commit -m "fix(frontend): refresh record detail after attachment changes"
```

### Task 7: Run End-to-End Verification for the Repair

**Files:**
- Reuse: `frontend/src/utils/attachmentUrls.test.js`
- Reuse: `frontend/src/utils/attachmentQueue.test.js`
- Reuse: `backend/src/middlewares/recordExists.test.js`

- [ ] **Step 1: Run targeted frontend tests**

Run: `pnpm test -- src/utils/attachmentUrls.test.js src/utils/attachmentQueue.test.js`
Expected: PASS with all new frontend tests green

- [ ] **Step 2: Run targeted backend tests**

Run: `pnpm test -- src/middlewares/recordExists.test.js`
Expected: PASS with 2 passing tests

- [ ] **Step 3: Run full frontend test suite**

Run: `pnpm test`
Expected: PASS including existing auth guard tests

- [ ] **Step 4: Run full backend test suite**

Run: `pnpm test`
Expected: PASS including existing validation middleware tests

- [ ] **Step 5: Run frontend production build**

Run: `pnpm build`
Expected: PASS with built assets emitted to `frontend/dist`

- [ ] **Step 6: Manual verification checklist**

```text
1. 新建记录页选择 1-2 张图片，不先保存。
2. 点击“创建记录”，确认记录保存后自动上传图片。
3. 跳转到详情页，确认图片可见。
4. 在详情页编辑附件分类/标签，确认页面刷新后生效。
5. 在详情页删除附件，确认页面刷新且图片消失。
6. 在编辑记录页继续上传新图片，确认画廊刷新。
7. 对不存在的 recordId 发送附件上传请求，确认返回 404。
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src backend/src
git commit -m "fix: repair report upload flow end to end"
```

