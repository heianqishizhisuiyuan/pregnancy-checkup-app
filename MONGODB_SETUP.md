# MongoDB 配置指南

## 方案 A：MongoDB Atlas（云数据库）⭐ 推荐

### 优点
- ✅ 无需本地安装
- ✅ 免费套餐 512MB
- ✅ 自动备份
- ✅ 随时随地访问
- ✅ 5 分钟即可完成配置

### 配置步骤

#### 1. 注册账号
访问：https://www.mongodb.com/cloud/atlas/register
- 使用邮箱注册或 Google 账号登录

#### 2. 创建免费集群
1. 登录后点击 "Build a Database"
2. 选择 "FREE" 套餐（M0 Sandbox）
3. 选择云服务商和区域（推荐 AWS - Singapore）
4. 集群名称保持默认或自定义
5. 点击 "Create"（等待 3-5 分钟）

#### 3. 创建数据库用户
1. 点击左侧 "Database Access"
2. 点击 "Add New Database User"
3. 认证方式选择 "Password"
4. 设置用户名和密码（例如：`pregnancy_user` / `your_password`）
5. 权限选择 "Read and write to any database"
6. 点击 "Add User"

#### 4. 配置网络访问
1. 点击左侧 "Network Access"
2. 点击 "Add IP Address"
3. 选择 "Allow Access from Anywhere"（开发环境）
4. 点击 "Confirm"

#### 5. 获取连接字符串
1. 点击左侧 "Database"
2. 点击集群的 "Connect" 按钮
3. 选择 "Connect your application"
4. 驱动选择 "Node.js" 版本 "5.5 or later"
5. 复制连接字符串，格式如下：
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

#### 6. 配置后端环境变量

编辑 `backend/.env` 文件：

```env
PORT=3000
MONGODB_URI=mongodb+srv://pregnancy_user:your_password@cluster0.xxxxx.mongodb.net/pregnancy-record?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**重要提示**：
- 将 `<username>` 替换为你创建的数据库用户名
- 将 `<password>` 替换为你设置的密码
- 将 `cluster0.xxxxx` 替换为你的实际集群地址
- 添加数据库名称 `/pregnancy-record`

#### 7. 测试连接

```bash
cd backend
pnpm dev
```

如果看到 `MongoDB 连接成功` 就表示配置成功！

---

## 方案 B：本地安装 MongoDB

### 适用场景
- 需要离线开发
- 对数据隐私有特殊要求
- 网络不稳定

### Windows 安装步骤

#### 1. 安装 MongoDB（使用 winget）

```powershell
winget install MongoDB.Server
```

#### 2. 创建数据目录

```powershell
mkdir C:\data\db
```

#### 3. 启动 MongoDB 服务

**方法 1：作为 Windows 服务（推荐）**

安装完成后，MongoDB 会自动作为 Windows 服务启动。

检查服务状态：
```powershell
Get-Service MongoDB
```

如果未运行，启动服务：
```powershell
Start-Service MongoDB
```

**方法 2：手动启动**

```powershell
mongod --dbpath C:\data\db
```

#### 4. 验证 MongoDB 是否运行

打开新终端：
```powershell
mongosh
```

如果成功连接，会看到 MongoDB shell 提示符。

#### 5. 配置后端环境变量

编辑 `backend/.env` 文件：

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pregnancy-record
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

#### 6. 测试连接

```bash
cd backend
pnpm dev
```

如果看到 `MongoDB 连接成功: localhost` 就表示配置成功！

---

## 故障排查

### 问题 1：连接超时

**MongoDB Atlas**：
- 检查网络访问设置（IP 白名单）
- 确认用户名密码正确
- 检查连接字符串格式

**本地 MongoDB**：
- 确认 MongoDB 服务正在运行
- 检查端口 27017 是否被占用
- 确认数据目录存在且有写入权限

### 问题 2：认证失败

- 检查用户名和密码是否正确
- 确认密码中的特殊字符已经 URL 编码
- Atlas：确认用户权限设置正确

### 问题 3：数据库连接成功但无法操作

- 检查用户权限
- 确认数据库名称正确
- 查看后端控制台错误日志

---

## 推荐配置

### 开发环境
- 使用 **MongoDB Atlas** 免费套餐
- 简单快速，无需维护

### 生产环境
- MongoDB Atlas 付费套餐（自动备份、监控）
- 或自建 MongoDB 服务器（需要运维能力）

---

## 安全建议

1. **JWT_SECRET**：使用强密码，至少 32 个字符
   ```bash
   # 生成随机密钥
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **数据库密码**：使用强密码，包含大小写字母、数字、特殊字符

3. **网络访问**：生产环境不要使用 "Allow Access from Anywhere"

4. **定期备份**：Atlas 自动备份，本地安装需要手动备份

---

## 下一步

配置完成后：

1. 启动后端：`cd backend && pnpm dev`
2. 启动前端：`cd frontend && pnpm dev`
3. 访问应用：http://localhost:5173
4. 注册第一个用户开始使用！

---

## 参考链接

- MongoDB Atlas 官网：https://www.mongodb.com/cloud/atlas
- MongoDB 官方文档：https://docs.mongodb.com/
- Mongoose 文档：https://mongoosejs.com/
