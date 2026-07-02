import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import app from './src/app.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

// 连接数据库
connectDB();

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📝 健康检查: http://localhost:${PORT}/health`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
});
