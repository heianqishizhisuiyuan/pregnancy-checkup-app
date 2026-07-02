import mongoose from 'mongoose';

/**
 * 连接 MongoDB 数据库
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB 连接成功: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB 连接失败: ${error.message}`);
    process.exit(1);
  }
};

/**
 * 断开数据库连接（用于测试）
 */
export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB 连接已断开');
  } catch (error) {
    console.error(`断开连接失败: ${error.message}`);
  }
};
