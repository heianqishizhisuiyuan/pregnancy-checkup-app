// 修改用户角色为 owner 的脚本
// 在 backend 目录下创建此文件，然后运行: node scripts/setOwner.js

import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function setUserAsOwner() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB 连接成功');

    // 获取用户邮箱（从命令行参数）
    const email = process.argv[2];
    if (!email) {
      console.error('请提供用户邮箱: node scripts/setOwner.js your@email.com');
      process.exit(1);
    }

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      console.error('用户不存在:', email);
      process.exit(1);
    }

    // 更新角色
    user.role = 'owner';
    await user.save();

    console.log('✅ 用户角色已更新为 owner');
    console.log('用户名:', user.username);
    console.log('邮箱:', user.email);
    console.log('角色:', user.role);

    process.exit(0);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

setUserAsOwner();
