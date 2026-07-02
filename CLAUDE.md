# 产检记录 Web 应用 - 项目上下文

## 项目概述

这是一个帮助准爸爸准妈妈记录孕期产检的 Web 应用（PWA），采用渐进式开发策略。

**当前阶段**：MVP 已完成，进入验证、修复和小步迭代阶段

## 重要文档位置

- **设计文档**：`docs/design.md` - 完整的系统设计、数据模型、API 设计、技术栈等
- **实施计划**：`docs/superpowers/plans/2026-07-02-pregnancy-checkup-mvp.md` - MVP 分步骤开发计划
- **项目总结**：`PROJECT_SUMMARY.md` - 当前功能完成情况、启动方式和后续优化方向
- **快速启动**：`QUICK_START.md` - 本地运行和故障排查说明

## 开发约定

### 技术栈

**前端**（`frontend/` 目录）：
- Vue 3 (Composition API)
- Vite
- Vue Router + Pinia
- Element Plus
- axios + dayjs

**后端**（`backend/` 目录）：
- Node.js + Express
- MongoDB + Mongoose
- JWT 认证

### 设计风格

**温馨关怀风**：
- 主题色：
  - 背景：`#F7F4EF`（温暖米色）
  - 表面：`#FBF9F5`（奶油白）
  - 强调色：`#C4612F`（陶土橙）
  - 文本：`#1F2421`（深色）
- 圆角设计、柔和阴影
- 衬线字体标题 + 无衬线正文

### 开发流程

1. **启动新功能开发时**：
   - 先阅读 `docs/design.md` 了解该功能的设计
   - 查看 `docs/superpowers/plans/2026-07-02-pregnancy-checkup-mvp.md` 了解 MVP 实施背景
   - 按照设计文档中的数据模型、API 规范、页面布局进行开发

2. **代码规范**：
   - 使用简体中文注释
   - commit 信息使用简体中文
   - 遵循项目现有的代码风格
   - 优先复用现有组件

3. **测试验证**：
   - 参考 `docs/design.md` 第 10 节的验证方案
   - 手动测试清单必须全部通过

## 当前进度

### 已完成
- ✅ 需求分析和设计
- ✅ 技术栈选型
- ✅ 数据模型设计
- ✅ API 接口设计
- ✅ 页面布局设计
- ✅ 设计文档编写
- ✅ 后端 MVP 实现（认证、家庭、产检记录、权限控制）
- ✅ 前端 MVP 实现（登录注册、首页、记录表单、详情、家庭设置）
- ✅ 前端生产构建通过
- ✅ 最小自动化测试脚本已建立

### 下一步
- ⏳ 完整注册-使用流程测试
- ⏳ 补充后端 API 集成测试
- ⏳ 根据实际使用反馈迭代导出、提醒、图片上传等功能

## Claude 工作指引

当用户要求继续开发或修复时：

1. **先看现状**：阅读 `PROJECT_SUMMARY.md`、相关代码和 `docs/design.md`
2. **执行开发**：保持前后端 API、数据模型和权限边界一致
3. **保持同步**：功能状态变化后，更新 README/PROJECT_SUMMARY/相关 docs
4. **验证质量**：至少运行相关测试和前端构建，涉及数据库时补充手动流程验证

## 数据模型快速参考

### User（用户）
- username, email, password, role, familyId
- role: 'owner' | 'family'

### Family（家庭）
- name, ownerId, members, pregnancyInfo
- pregnancyInfo: { dueDate, lastPeriod }

### Record（产检记录）
- familyId, createdBy, checkupDate, gestationalWeek, gestationalDay
- hospital, doctor
- vitals: { weight, bloodPressure, fundalHeight, abdominalCircumference, fetalHeartRate }
- notes

## API 端点快速参考

### 认证
- POST /api/auth/register - 注册
- POST /api/auth/login - 登录
- GET /api/auth/me - 获取当前用户

### 记录
- GET /api/records - 获取所有记录
- GET /api/records/:id - 获取单条记录
- POST /api/records - 创建记录（需要 owner 权限）
- PUT /api/records/:id - 更新记录（需要 owner 权限）
- DELETE /api/records/:id - 删除记录（需要 owner 权限）

### 家庭
- GET /api/family - 获取家庭信息
- PUT /api/family - 更新家庭信息

## 注意事项

- 所有日期使用 ISO 8601 格式
- 密码必须使用 bcrypt 加密
- JWT Token 过期时间为 7 天
- 所有 API 响应统一格式：`{ success: boolean, data?: any, error?: { code, message } }`
- 前端必须在每次请求时携带 JWT Token
- 权限控制通过后端中间件实现
