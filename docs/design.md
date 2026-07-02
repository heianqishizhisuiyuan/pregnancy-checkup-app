# 产检记录 Web 应用设计文档

## 1. 项目背景

### 1.1 为什么要做这个项目

用户的妻子刚怀孕，需要一个方便、私密的工具来记录整个孕期的产检过程。现有的产检记录方式存在以下问题：

- 纸质记录容易丢失，不便于长期保存
- 分散的照片和文档难以系统化管理
- 无法方便地与家人分享孕期进展
- 缺少数据趋势分析，难以发现异常

### 1.2 项目目标

开发一个 Web 应用（PWA），让用户可以：

- 系统化记录每次产检的详细信息
- 随时随地查看历史记录和数据趋势
- 安全地与家人分享孕期进展
- 通过数据可视化更好地了解孕期健康状况

### 1.3 用户角色

- **主账号（夫妻双方）**：拥有完全权限，可以添加、编辑、删除产检记录
- **家人账号（双方父母等）**：只读权限，可以查看产检记录但不能修改

## 2. 核心功能

### 2.1 MVP 阶段（第一阶段）功能

#### 基础信息记录
- 产检日期
- 孕周（周 + 天）
- 医院名称
- 医生姓名

#### 生理指标记录
- 体重（kg）
- 血压（收缩压/舒张压）
- 宫高（cm）
- 腹围（cm）
- 胎心率（次/分钟）

#### 其他功能
- 医嘱和个人备注
- 按时间倒序的记录列表
- 记录详情查看
- 用户认证（登录/注册）
- 数据权限控制

### 2.2 后续阶段功能（暂不实现）

**第二阶段**：
- 图片上传和管理
- 检查结果分类记录
- 时间轴展示
- 家人分享功能（邀请码机制）

**第三阶段**：
- 数据趋势图表
- 产检提醒（浏览器通知 API）
- PWA 离线支持
- 数据导出

## 3. 技术架构

### 3.1 整体架构

```
用户浏览器 (Vue 3 PWA)
    ↓ HTTPS / REST API
云服务器 (Express)
    ↓
MongoDB 数据库
```

### 3.2 技术栈选择

**前端**：
- Vue 3 (Composition API)
- Vite（构建工具）
- Vue Router（路由管理）
- Pinia（状态管理）
- Element Plus（UI 组件库）
- axios（HTTP 请求）
- dayjs（日期处理）

**后端**：
- Node.js + Express 4.x
- Mongoose（MongoDB ODM）
- jsonwebtoken（JWT 认证）
- bcrypt（密码加密）

**数据库**：
- MongoDB（文档型数据库）

**部署**：
- 前端：Vercel 或 Netlify
- 后端：云服务器（阿里云/腾讯云）
- 数据库：MongoDB Atlas 或自建

### 3.3 设计风格

**温馨关怀风**：
- 暖色调配色（米色、奶油色、陶土色）
- 圆角设计
- 柔和的阴影
- 衬线字体标题 + 无衬线正文
- 营造温暖陪伴的氛围

**主题色彩**：
- 背景主色：#F7F4EF（温暖米色）
- 表面色：#FBF9F5（奶油白）
- 强调色：#C4612F（陶土橙）
- 强调色悬停：#A94E22
- 主文本：#1F2421
- 次要文本：#5C635D
- 边框：#E7E1D7

## 4. 数据模型设计

### 4.1 User（用户）

```javascript
{
  _id: ObjectId,
  username: String,        // 用户名（唯一）
  email: String,           // 邮箱（唯一）
  password: String,        // 加密后的密码
  role: String,            // 'owner' 或 'family'
  familyId: ObjectId,      // 所属家庭ID
  profile: {
    nickname: String,      // 昵称
    avatar: String         // 头像URL（第二阶段）
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 4.2 Family（家庭）

```javascript
{
  _id: ObjectId,
  name: String,            // 家庭名称
  ownerId: ObjectId,       // 创建者ID
  members: [{
    userId: ObjectId,
    role: String,          // 'owner' 或 'family'
    joinedAt: Date
  }],
  pregnancyInfo: {
    dueDate: Date,         // 预产期
    lastPeriod: Date       // 末次月经
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 4.3 Record（产检记录）

```javascript
{
  _id: ObjectId,
  familyId: ObjectId,      // 所属家庭
  createdBy: ObjectId,     // 创建者ID
  
  // 基础信息
  checkupDate: Date,       // 产检日期
  gestationalWeek: Number, // 孕周
  gestationalDay: Number,  // 孕周+天数
  hospital: String,        // 医院名称
  doctor: String,          // 医生姓名
  
  // 生理指标
  vitals: {
    weight: Number,        // 体重（kg）
    bloodPressure: {
      systolic: Number,    // 收缩压
      diastolic: Number    // 舒张压
    },
    fundalHeight: Number,  // 宫高（cm）
    abdominalCircumference: Number, // 腹围（cm）
    fetalHeartRate: Number // 胎心率（次/分）
  },
  
  // 备注
  notes: String,           // 医嘱和个人备注
  
  createdAt: Date,
  updatedAt: Date
}
```

## 5. 页面设计

### 5.1 页面结构

```
产检记录 App
│
├── 登录/注册页 (/login, /register)
│   └── 表单：用户名、邮箱、密码
│
├── 首页 - 产检记录列表 (/)
│   ├── 顶部导航栏（Logo、用户信息、退出按钮）
│   ├── 快速统计卡片（当前孕周、距预产期天数、已产检次数）
│   ├── 记录列表卡片（按时间倒序）
│   └── 浮动添加按钮（右下角）
│
├── 添加/编辑记录页 (/record/new, /record/:id/edit)
│   ├── 基础信息表单
│   ├── 生理指标表单
│   ├── 备注文本框
│   └── 保存/取消按钮
│
└── 记录详情页 (/record/:id)
    ├── 返回按钮
    ├── 编辑/删除按钮（主账号可见）
    ├── 基础信息展示
    ├── 生理指标展示（卡片式布局）
    └── 备注内容
```

### 5.2 路由配置

```javascript
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/record/new',
    name: 'RecordNew',
    component: () => import('@/views/RecordForm.vue'),
    meta: { requiresAuth: true, requiresOwner: true }
  },
  {
    path: '/record/:id',
    name: 'RecordDetail',
    component: () => import('@/views/RecordDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/record/:id/edit',
    name: 'RecordEdit',
    component: () => import('@/views/RecordForm.vue'),
    meta: { requiresAuth: true, requiresOwner: true }
  }
]
```

### 5.3 首页布局说明

**顶部导航栏**：
- 左侧：应用 Logo（💝）+ 标题"孕期记录"
- 右侧：用户头像

**快速统计卡片**（渐变背景，陶土橙色）：
- 当前孕周（大号数字显示）
- 距预产期天数
- 已完成产检次数

**记录列表**：
- 卡片式布局，每条记录显示：
  - 产检日期 + 孕周
  - 医院和医生
  - 关键指标摘要（体重、血压、胎心）
- 最新记录带有"最新"标签
- 卡片悬停有提升效果

**浮动添加按钮**：
- 位置：右下角固定
- 样式：圆形，渐变背景，加号图标
- 点击跳转到添加记录页面

## 6. API 设计

### 6.1 API 端点

**用户认证相关**：
```
POST   /api/auth/register          注册新用户
POST   /api/auth/login             用户登录
GET    /api/auth/me                获取当前用户信息
```

**产检记录相关**：
```
GET    /api/records                获取当前家庭的所有记录
GET    /api/records/:id            获取单条记录详情
POST   /api/records                创建新记录（需要 owner 权限）
PUT    /api/records/:id            更新记录（需要 owner 权限）
DELETE /api/records/:id            删除记录（需要 owner 权限）
```

**家庭信息相关**：
```
GET    /api/family                 获取当前用户的家庭信息
PUT    /api/family                 更新家庭信息（预产期等）
```

### 6.2 API 请求/响应示例

**用户登录**：
```javascript
// POST /api/auth/login
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "张三",
      "email": "user@example.com",
      "role": "owner",
      "profile": {
        "nickname": "准爸爸"
      }
    }
  }
}
```

**获取记录列表**：
```javascript
// GET /api/records
Response:
{
  "success": true,
  "data": [
    {
      "id": "507f191e810c19729de860ea",
      "checkupDate": "2026-06-28T00:00:00.000Z",
      "gestationalWeek": 12,
      "gestationalDay": 3,
      "hospital": "市妇幼保健院",
      "doctor": "李医生",
      "vitals": {
        "weight": 58.5,
        "bloodPressure": {
          "systolic": 110,
          "diastolic": 70
        },
        "fundalHeight": 12,
        "abdominalCircumference": 80,
        "fetalHeartRate": 150
      },
      "notes": "一切正常，注意休息",
      "createdBy": "507f1f77bcf86cd799439011",
      "createdAt": "2026-06-28T10:30:00.000Z"
    }
  ]
}
```

**创建新记录**：
```javascript
// POST /api/records
Request:
{
  "checkupDate": "2026-07-05",
  "gestationalWeek": 13,
  "gestationalDay": 3,
  "hospital": "市妇幼保健院",
  "doctor": "李医生",
  "vitals": {
    "weight": 59.0,
    "bloodPressure": {
      "systolic": 112,
      "diastolic": 72
    },
    "fundalHeight": 13,
    "abdominalCircumference": 82,
    "fetalHeartRate": 148
  },
  "notes": "宝宝发育良好"
}

Response:
{
  "success": true,
  "data": {
    "id": "507f191e810c19729de860eb",
    // 完整的记录对象
  }
}
```

### 6.3 中间件设计

**认证中间件**：
- 验证 JWT Token
- 从 Header 中提取 `Authorization: Bearer <token>`
- 解析 token，将用户信息附加到 `req.user`

**权限中间件**：
- 检查 `req.user.role === 'owner'`
- 如果不是，返回 403 Forbidden

**错误处理中间件**：
- 统一的错误响应格式：
```javascript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "错误描述"
  }
}
```

## 7. 项目目录结构

### 7.1 前端目录

```
pregnancy-app-frontend/
├── public/
│   ├── favicon.ico
│   └── manifest.json          # PWA 配置（第三阶段）
├── src/
│   ├── assets/                # 静态资源
│   │   └── styles/
│   │       └── theme.css      # 全局主题变量
│   ├── components/            # 通用组件
│   │   ├── RecordCard.vue     # 记录卡片
│   │   ├── StatCard.vue       # 统计卡片
│   │   └── VitalInput.vue     # 生理指标输入组件
│   ├── views/                 # 页面组件
│   │   ├── Login.vue
│   │   ├── Register.vue
│   │   ├── Home.vue
│   │   ├── RecordForm.vue
│   │   └── RecordDetail.vue
│   ├── router/
│   │   └── index.js           # 路由配置
│   ├── stores/                # Pinia stores
│   │   ├── auth.js            # 用户认证状态
│   │   ├── record.js          # 产检记录状态
│   │   └── family.js          # 家庭信息状态
│   ├── api/                   # API 接口封装
│   │   ├── request.js         # axios 实例配置
│   │   ├── auth.js
│   │   ├── record.js
│   │   └── family.js
│   ├── utils/                 # 工具函数
│   │   ├── date.js            # 日期计算（孕周等）
│   │   └── validator.js       # 表单验证
│   ├── App.vue
│   └── main.js
├── package.json
└── vite.config.js
```

### 7.2 后端目录

```
pregnancy-app-backend/
├── src/
│   ├── models/                # 数据模型
│   │   ├── User.js
│   │   ├── Family.js
│   │   └── Record.js
│   ├── routes/                # 路由
│   │   ├── auth.js
│   │   ├── record.js
│   │   └── family.js
│   ├── controllers/           # 控制器
│   │   ├── authController.js
│   │   ├── recordController.js
│   │   └── familyController.js
│   ├── middlewares/           # 中间件
│   │   ├── auth.js            # JWT 认证
│   │   ├── roleCheck.js       # 权限检查
│   │   └── errorHandler.js    # 错误处理
│   ├── utils/                 # 工具函数
│   │   └── jwt.js             # JWT 生成和验证
│   ├── config/
│   │   └── db.js              # 数据库连接
│   └── app.js                 # Express 应用入口
├── .env
├── .env.example
├── package.json
└── server.js                  # 启动文件
```

## 8. 关键功能实现

### 8.1 孕周计算

```javascript
// utils/date.js
export function calculateGestationalAge(lastPeriod, targetDate = new Date()) {
  const diffDays = Math.floor((targetDate - lastPeriod) / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(diffDays / 7);
  const days = diffDays % 7;
  return { weeks, days, totalDays: diffDays };
}

export function calculateDueDate(lastPeriod) {
  const dueDate = new Date(lastPeriod);
  dueDate.setDate(dueDate.getDate() + 280); // 40周 = 280天
  return dueDate;
}
```

### 8.2 JWT 认证流程

1. 用户登录成功后，后端生成 JWT Token
2. 前端将 Token 存储在 localStorage
3. 每次请求时，axios 拦截器自动在 Header 中添加 Token
4. 后端中间件验证 Token，将用户信息附加到 `req.user`

### 8.3 数据权限控制

- 所有产检记录查询时，自动过滤为当前用户所属家庭的记录
- 创建/编辑/删除操作，检查用户是否为 owner 角色
- 家人角色只能查看，不能修改

## 9. 开发环境配置

### 9.1 前端环境变量

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3000/api
```

```bash
# .env.production
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### 9.2 后端环境变量

```bash
# .env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pregnancy-record
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## 10. 验证方案

### 10.1 端到端测试流程

1. **用户注册和登录**
   - 注册新用户（自动创建家庭）
   - 登录获取 Token
   - 验证 Token 有效性

2. **产检记录管理**
   - 添加新的产检记录
   - 查看记录列表
   - 查看记录详情
   - 编辑已有记录
   - 删除记录

3. **权限验证**
   - 主账号可以创建/编辑/删除记录
   - 家人账号只能查看记录
   - 跨家庭数据隔离

4. **数据计算验证**
   - 孕周自动计算准确性
   - 预产期计算准确性
   - 距离预产期天数计算

### 10.2 手动测试清单

**前端界面**：
- [ ] 登录/注册页面正常显示
- [ ] 首页统计卡片显示正确
- [ ] 记录列表按时间倒序排列
- [ ] 添加记录表单验证正常
- [ ] 编辑记录预填充数据正确
- [ ] 详情页展示完整信息
- [ ] 响应式布局在移动端正常

**后端 API**：
- [ ] 注册接口创建用户和家庭
- [ ] 登录接口返回正确的 Token
- [ ] 记录 CRUD 接口功能正常
- [ ] 权限中间件正确拦截
- [ ] 数据查询自动过滤家庭
- [ ] 错误处理返回统一格式

## 11. 部署方案

### 11.1 前端部署

**推荐平台**：Vercel 或 Netlify

**部署步骤**：
1. 推送代码到 GitHub
2. 连接 Vercel/Netlify
3. 配置构建命令：`npm run build`
4. 配置输出目录：`dist`
5. 设置环境变量：`VITE_API_BASE_URL`

### 11.2 后端部署

**推荐方案**：阿里云/腾讯云轻量应用服务器

**部署步骤**：
1. 购买云服务器（1核2G足够）
2. 安装 Node.js 和 MongoDB
3. 上传代码到服务器
4. 配置 .env 文件
5. 使用 PM2 管理进程
6. 配置 Nginx 反向代理
7. 配置 SSL 证书（Let's Encrypt）

### 11.3 数据库部署

**选项一**：MongoDB Atlas（免费额度 512MB）
- 完全托管，无需维护
- 免费版足够个人使用

**选项二**：自建 MongoDB
- 安装在云服务器上
- 需要手动备份

## 12. 开发时间估算

### 12.1 MVP 阶段（第一阶段）

**前端开发**（约 5-7 天）：
- Day 1-2: 项目搭建、路由、状态管理、主题样式
- Day 3-4: 登录/注册页面、首页列表
- Day 5-6: 添加/编辑记录页面、详情页
- Day 7: 联调和 Bug 修复

**后端开发**（约 4-5 天）：
- Day 1: 项目搭建、数据库连接、模型定义
- Day 2: 用户认证 API（注册、登录、Token 验证）
- Day 3: 产检记录 API（CRUD）
- Day 4: 中间件、错误处理
- Day 5: 测试和 Bug 修复

**部署和测试**（约 1-2 天）：
- 前端部署到 Vercel
- 后端部署到云服务器
- 端到端测试

**总计：10-14 天**（可以利用业余时间分阶段完成）

## 13. 后续迭代规划

### 13.1 第二阶段（预计 2-3 周）

- 图片上传和管理（阿里云 OSS）
- 检查结果分类记录（唐筛、糖耐量、血常规等）
- 时间轴展示
- 家人分享功能（邀请码机制）

### 13.2 第三阶段（预计 2-3 周）

- 数据趋势图表（ECharts）
- 产检提醒（浏览器通知 API + node-cron）
- PWA 离线支持（Service Worker）
- 数据导出（PDF/Excel）

## 14. 风险和注意事项

### 14.1 技术风险

- **数据安全**：确保密码加密、Token 安全传输、HTTPS 部署
- **数据备份**：定期备份 MongoDB 数据，防止数据丢失
- **性能问题**：随着记录增多，列表查询可能需要分页

### 14.2 产品风险

- **需求变化**：孕期长达 40 周，可能会有新的需求产生
- **用户体验**：第一次使用时需要引导，确保操作流畅

### 14.3 建议

- 从简单开始，快速上线 MVP，边用边改进
- 定期备份数据
- 收集使用反馈，优先实现最需要的功能
- 保持代码整洁，方便后续迭代
