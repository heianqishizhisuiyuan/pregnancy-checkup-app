import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

// 连接数据库
connectDB();

console.log(`Server configuration loaded`);
console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
console.log('Database connection module integrated');
