import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import recordRoutes from './routes/record.js';
import familyRoutes from './routes/family.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { authenticate } from './middlewares/auth.js';
import { checkFileAccess } from './middlewares/fileAccess.js';

const app = express();

// 安全中间件
app.use(helmet());

// CORS 配置
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  exposedHeaders: ['X-New-Token'],
}));

// 日志中间件
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 解析 JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查（含数据库连通性）
app.get('/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;

  if (!dbConnected) {
    return res.status(503).json({
      status: 'error',
      db: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    status: 'ok',
    db: 'connected',
    timestamp: new Date().toISOString(),
  });
});

// 静态文件服务（需要认证和权限验证）
app.use('/uploads', authenticate, checkFileAccess, express.static('uploads'));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/family', familyRoutes);

// 404 处理
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '请求的资源不存在',
    },
  });
});

// 错误处理中间件
app.use(errorHandler);

export default app;
