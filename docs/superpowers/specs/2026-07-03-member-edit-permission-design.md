# 家庭成员编辑权限设计

**日期：** 2026-07-03  
**状态：** 已确认

## 背景

当前系统仅有 `owner`（主账号）与 `family`（只读家人）两种角色。家人只能查看产检记录，无法新建/编辑/删除记录或修改家庭信息。用户希望主账号能为特定家庭成员开启「接近主账号」的编辑能力。

## 目标

主账号可在家庭设置页为每位家人单独开关「允许编辑」。被授权的家人可执行除成员管理外的几乎所有主账号操作。

## 权限矩阵

| 能力 | 主账号 | 可编辑家人 | 只读家人 |
|------|--------|------------|----------|
| 查看记录/趋势/时间轴 | ✅ | ✅ | ✅ |
| 新建/编辑/删除记录与附件 | ✅ | ✅ | ❌ |
| 修改家庭信息（名称、预产期等） | ✅ | ✅ | ❌ |
| 设置下次产检提醒 | ✅ | ✅ | ❌ |
| 访问家庭设置页 | ✅ | ✅（受限 UI） | ❌ |
| 查看/重新生成邀请码 | ✅ | ❌ | ❌ |
| 移除成员 | ✅ | ❌ | ❌ |
| 配置他人编辑权限 | ✅ | ❌ | ❌ |

**明确不做：** 转让主账号、移除成员（非主账号）、查看邀请码（非主账号）。

## 方案

在 `User` 模型增加 `canEdit: Boolean`（家人默认 `false`，主账号注册时为 `true`）。权限判断：`role === 'owner' || canEdit === true`。

不引入第三角色 enum，改动面最小。

## 数据模型

### User

```javascript
canEdit: {
  type: Boolean,
  default: false,
}
```

- 注册创建家庭的主账号：`canEdit: true`
- 邀请码加入的家人：`canEdit: false`（默认）
- 主账号通过 API 切换家人的 `canEdit`

### Family.members（展示同步，可选）

可在成员条目增加 `canEdit` 便于列表展示；权威数据源为 `User.canEdit`。

## 后端

### 中间件

- **`requireCanEdit`**：`req.user.role === 'owner' || req.user.canEdit === true`
- **`requireOwner`**：不变，用于成员管理、邀请码、权限配置

### 路由变更

| 路由 | 原守卫 | 新守卫 |
|------|--------|--------|
| POST/PUT/DELETE `/api/records/*` | requireOwner | requireCanEdit |
| PUT `/api/family` | ownerId 检查 | requireCanEdit（controller 内） |
| GET/POST `/api/family/invite*` | ownerId | 不变 |
| DELETE `/api/family/members/:id` | ownerId | 不变 |

### 新 API

```
PUT /api/family/members/:userId/permissions
Body: { canEdit: boolean }
Access: 仅主账号（family.ownerId === req.user._id）
```

约束：
- 不能修改自己
- 不能修改 role 为 owner 的成员
- 同步更新 `User.canEdit`

### 认证响应

`login`、`register`、`GET /api/auth/me` 的 user 对象包含 `canEdit` 字段。

## 前端

### authStore

```javascript
const canEdit = computed(() => isOwner.value || user.value?.canEdit === true);
```

### 路由

`/record/new`、`/record/:id/edit`、`/family/edit` 的 `requiresOwner` 改为 `requiresCanEdit`。

### UI 规则

- 编辑按钮、FAB、提醒设置等：`canEdit` 替代 `isOwner`
- 主账号标签、邀请码、移除成员、权限开关：仍用 `isOwner`
- 角色展示：
  - owner → 「主账号」
  - family + canEdit → 「可编辑家人」
  - family + !canEdit → 「只读家人」

### FamilyEdit.vue

- 主账号在成员行显示「允许编辑」开关
- 可编辑家人访问该页时：可见家庭信息表单，隐藏邀请码区与成员管理操作

## 测试

- 集成测试：主账号授权家人 canEdit 后，家人可 POST record；未授权时 403
- 集成测试：非主账号不能 PUT permissions
- 前端 authGuard 测试：canEdit 用户可访问 requiresCanEdit 路由

## 迁移

现有用户：`owner` 用户 `canEdit` 设为 `true`，`family` 用户保持 `false`。可通过 schema default + 登录时逻辑处理，无需单独 migration 脚本。
