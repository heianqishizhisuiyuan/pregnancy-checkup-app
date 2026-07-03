# 🚀 立即开始使用 - 快速启动指南

## ✅ 当前状态

- ✅ MongoDB 已安装并运行
- ✅ 环境变量已配置
- ✅ JWT 密钥已生成
- ✅ 所有代码已完成

**你现在可以立即启动应用了！**

---

## 🎯 三步启动应用

### 第一步：启动后端服务

打开终端（PowerShell 或 CMD），执行：

```bash
cd D:\code\pregnancy-checkup-app\backend
pnpm dev
```

**预期输出**：
```
🚀 服务器运行在 http://localhost:3000
📝 健康检查: http://localhost:3000/health
🌍 环境: development
✅ MongoDB 连接成功
```

### 第二步：启动前端服务

**打开新的终端窗口**，执行：

```bash
cd D:\code\pregnancy-checkup-app\frontend
pnpm dev
```

**预期输出**：
```
VITE ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 第三步：访问应用

打开浏览器，访问：**http://localhost:5173**

---

## 🎮 开始使用

### 1. 注册新用户

- 访问注册页面
- 填写信息：
  - 用户名
  - 邮箱
  - 密码
  - 昵称
  - 末次月经日期（选填）
  - 预产期（选填）
- 点击"注册"
- 自动登录并跳转到首页

### 2. 查看首页

首页会显示：
- **孕周统计**：当前孕周（基于末次月经计算）
- **预产期倒计时**：距离预产期还有多少天
- **产检记录列表**：所有产检记录（初始为空）

### 3. 创建第一条产检记录

- 点击右下角的"+"浮动按钮
- 填写产检信息：
  - 产检日期
  - 孕周（周+天）
  - 医院名称
  - 医生姓名
  - 生理指标（体重、血压、宫高、腹围、胎心率）
  - 备注（选填）
- 点击"保存"

### 4. 查看和管理记录

- 在首页点击记录卡片查看详情
- 点击"编辑"按钮修改记录（仅 owner 可见）
- 点击"删除"按钮删除记录（仅 owner 可见）

---

## 🎨 UI 特色

- **温馨关怀风格**：米色背景、陶土色强调
- **清晰的信息展示**：卡片式设计
- **直观的操作**：浮动按钮、表单验证
- **响应式布局**：适配不同屏幕

---

## 🔧 故障排查

### 问题 1：后端启动失败

**错误信息**：`MongoDB 连接失败`

**解决方案**：
```powershell
# 检查 MongoDB 服务
Get-Service MongoDB

# 如果服务未运行，启动它
Start-Service MongoDB
```

### 问题 2：前端无法访问后端

**错误信息**：网络错误或 CORS 错误

**解决方案**：
1. 确认后端正在运行（http://localhost:3000）
2. 检查后端控制台是否有错误
3. 访问健康检查：http://localhost:3000/health

### 问题 3：端口被占用

**错误信息**：`Port 3000 is already in use`

**解决方案**：
```powershell
# 查找占用端口的进程
netstat -ano | findstr :3000

# 结束进程（替换 PID）
taskkill /PID <进程ID> /F
```

### 问题 4：依赖安装失败

**解决方案**：
```bash
# 清理缓存并重新安装
cd backend
rm -rf node_modules
pnpm install

cd ../frontend
rm -rf node_modules
pnpm install
```

---

## 📊 系统要求

- ✅ Node.js >= 18
- ✅ pnpm >= 8
- ✅ MongoDB 8.3.4（已安装）
- ✅ Windows 11
- ✅ 现代浏览器（Chrome, Edge, Firefox）

---

## 📝 重要提示

1. **不要关闭终端**：后端和前端都需要在终端中持续运行
2. **同时运行两个终端**：一个运行后端，一个运行前端
3. **首次使用需要注册**：注册后会自动创建家庭
4. **数据存储在本地**：MongoDB 数据库位于本地

### 数据备份（生产环境建议）

```bash
# 在服务器上执行（需已安装 mongodb-database-tools）
bash scripts/backup.sh

# 可选 cron 示例：每天凌晨 3 点备份
# 0 3 * * * APP_DIR=/var/www/pregnancy-checkup-app bash /var/www/pregnancy-checkup-app/scripts/backup.sh
```

恢复：`bash scripts/restore.sh /path/to/backup_YYYYMMDD_HHMMSS.tar.gz`

---

## 🎉 恭喜！

你的产检记录 Web 应用已经完全准备好了！

现在你可以：
- ✅ 记录每次产检的详细信息
- ✅ 追踪孕周和预产期
- ✅ 查看历史产检记录
- ✅ 管理生理指标数据

**祝你使用愉快！** 🎊

---

## 📚 更多信息

- 项目总结：`PROJECT_SUMMARY.md`
- MongoDB 配置：`MONGODB_SETUP.md`
- 快速指南：`README.md`

## 🐛 遇到问题？

如果遇到任何问题，请查看：
1. 后端终端的错误日志
2. 前端终端的错误日志
3. 浏览器控制台的错误信息
4. MongoDB 服务状态

---

**项目位置**: `D:\code\pregnancy-checkup-app`  
**版本**: v1.0.0 MVP  
**开发完成时间**: 2026年7月2日
