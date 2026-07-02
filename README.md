# 产检记录 Web 应用

一个温馨的产检记录管理系统，帮助准爸爸准妈妈记录整个孕期的每一次产检。

## 项目简介

这是一个基于 Vue 3 + Express + MongoDB 的全栈 Web 应用，采用渐进式开发策略，分三个阶段实现。

### 核心功能（MVP 阶段）

- 📝 产检记录管理（基础信息、生理指标、医嘱备注）
- 👥 多用户权限控制（主账号 + 家人只读）
- 📊 快速统计展示（当前孕周、距预产期、产检次数）
- 🎨 温馨关怀风格设计（暖色调、圆角、柔和阴影）

### 技术栈

**前端**：
- Vue 3 + Vite
- Vue Router + Pinia
- Element Plus
- axios + dayjs

**后端**：
- Node.js + Express
- MongoDB + Mongoose
- JWT 认证

**部署**：
- 前端：Vercel/Netlify
- 后端：阿里云/腾讯云
- 数据库：MongoDB Atlas

## 项目结构

```
pregnancy-checkup-app/
├── docs/                    # 文档目录
│   ├── design.md           # 设计文档
│   └── plan.md             # 实施计划（即将创建）
├── frontend/               # 前端项目（待创建）
├── backend/                # 后端项目（待创建）
└── README.md               # 本文件
```

## 开发计划

MVP 阶段预计 10-14 天完成：

- **前端开发**：5-7 天
- **后端开发**：4-5 天
- **部署测试**：1-2 天

详细实施计划请查看 `docs/plan.md`。

## 快速开始

### 前端开发

```bash
cd frontend
pnpm install
pnpm dev
```

### 后端开发

```bash
cd backend
pnpm install
pnpm dev
```

## 文档

- [设计文档](./docs/design.md) - 完整的系统设计和技术方案
- [实施计划](./docs/plan.md) - 分步骤的开发计划（即将创建）

## 后续阶段

**第二阶段**（2-3 周）：
- 图片上传和管理
- 检查结果分类
- 时间轴展示
- 家人分享功能

**第三阶段**（2-3 周）：
- 数据趋势图表
- 产检提醒
- PWA 离线支持
- 数据导出

## 开发约定

- 所有前端项目使用 `pnpm` 作为包管理器
- 代码注释和 commit 信息使用简体中文
- 遵循温馨关怀风格的设计规范
- 优先复用现有组件和工具函数

## License

MIT
