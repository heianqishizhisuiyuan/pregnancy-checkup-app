# 产检记录 Web 应用

一个帮助孕妇及其家人记录和管理产检过程的全栈 Web 应用。

## 快速开始

### 1. 启动后端服务

```bash
cd backend
pnpm install
pnpm dev
```

后端运行在: http://localhost:3000

### 2. 启动前端服务

```bash
cd frontend
pnpm install
pnpm dev
```

前端运行在: http://localhost:5173

### 3. 配置数据库

编辑 `backend/.env` 文件，配置 MongoDB 连接：

```env
MONGODB_URI=mongodb://localhost:27017/pregnancy-record
JWT_SECRET=your-secret-key
```

## 核心功能

✅ 用户注册和登录  
✅ 产检记录管理（创建、查看、编辑、删除）  
✅ 生理指标记录（体重、血压、宫高、腹围、胎心率）  
✅ 孕周自动计算  
✅ 预产期倒计时  
✅ 权限控制（owner/family 角色）  

## 技术栈

**后端**: Node.js + Express + MongoDB + JWT  
**前端**: Vue 3 + Vite + Element Plus + Pinia

## 项目结构

```
├── backend/          # 后端服务（Express + MongoDB）
├── frontend/         # 前端应用（Vue 3）
└── docs/            # 项目文档
```

## 开发状态

✅ **MVP 开发完成**  
- 30/30 任务完成
- 17 个功能提交
- 36 个源代码文件

## 详细文档

查看 [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) 了解完整的项目信息。

## 许可证

本项目仅用于个人学习和使用。
