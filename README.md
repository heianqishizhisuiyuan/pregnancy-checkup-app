# 产检记录 Web 应用

帮助孕妇及其家人记录和管理产检过程的全栈 Web 应用。

## 快速开始

### 1. 配置数据库

编辑 `backend/.env`：

```env
MONGODB_URI=mongodb://localhost:27017/pregnancy-record
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

### 2. 启动后端

```bash
cd backend
pnpm install
pnpm dev
```

后端：http://localhost:3000

### 3. 启动前端

```bash
cd frontend
pnpm install
pnpm dev
```

前端：http://localhost:5173

## 核心功能

- 用户注册 / 登录（JWT，7 天有效期，活跃使用时滑动续期）
- 家人邀请码加入家庭（注册加入、设置页复制 / 重新生成、成员列表）
- 产检记录 CRUD（owner 可写，family 只读）
- 生理指标：体重、血压、宫高、腹围、胎心率
- 孕周 / 预产期自动计算；新建记录时按末次月经自动填充孕周
- 检查报告图片上传（jpg/png/webp，单张最大 10MB，每条最多 20 张）
- 时间轴视图、数据趋势图表（`/trends`）
- 记录搜索与筛选（关键词、医院、日期、孕周）
- 首页分页列表
- 数据导出（Excel 下载；PDF 通过打印预览另存为）
- 个人资料（修改昵称、修改密码）

## 技术栈

**后端**：Node.js + Express + MongoDB + JWT  
**前端**：Vue 3 + Vite + Element Plus + Pinia + ECharts

## 生产部署

```powershell
# 本地一键：提交 → 推送 → 服务器拉取并重启
.\scripts\redeploy.ps1 "更新说明"

# 仅部署（不提交）
.\scripts\redeploy.ps1 -DeployOnly
```

服务器侧脚本：`scripts/deploy-app.sh`、`scripts/server-setup.sh`  
数据备份：`scripts/backup.sh`（详见 `QUICK_START.md`）

## 测试

```bash
cd backend && pnpm test
cd frontend && pnpm test
cd frontend && pnpm build
```

Push / PR 到 GitHub 后会自动跑 CI（`.github/workflows/ci.yml`）。

## 项目结构

```
├── backend/          # Express API + MongoDB
├── frontend/         # Vue 3 前端
├── scripts/          # 部署与备份脚本
└── docs/             # 设计文档与迭代计划
```

## 文档

- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) — 功能清单与 API 概览
- [QUICK_START.md](./QUICK_START.md) — 本地运行与故障排查
- [docs/superpowers/plans/2026-07-03-iteration-backlog.md](./docs/superpowers/plans/2026-07-03-iteration-backlog.md) — 后续迭代 backlog

## 许可证

本项目仅用于个人学习和使用。
