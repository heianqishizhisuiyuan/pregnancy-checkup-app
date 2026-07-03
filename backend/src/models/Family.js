import mongoose from 'mongoose';

const familySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '家庭名称不能为空'],
      trim: true,
      maxlength: [100, '家庭名称最多100个字符'],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '创建者ID不能为空'],
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['owner', 'family'],
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    pregnancyInfo: {
      dueDate: {
        type: Date,
        required: false,
      },
      lastPeriod: {
        type: Date,
        required: false,
      },
      nextCheckupDate: {
        type: Date,
        required: false,
      },
      reminderDaysBefore: {
        type: Number,
        default: 1,
        min: 0,
        max: 7,
      },
    },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// 添加索引（inviteCode 已通过字段 unique + sparse 自动建索引）
familySchema.index({ ownerId: 1 });
familySchema.index({ 'members.userId': 1 });

const Family = mongoose.model('Family', familySchema);

export default Family;
