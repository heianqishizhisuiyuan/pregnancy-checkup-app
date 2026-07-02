import mongoose from 'mongoose';

const recordSchema = new mongoose.Schema(
  {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      required: [true, '家庭ID不能为空'],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '创建者ID不能为空'],
    },
    checkupDate: {
      type: Date,
      required: [true, '产检日期不能为空'],
    },
    gestationalWeek: {
      type: Number,
      required: [true, '孕周不能为空'],
      min: [0, '孕周不能小于0'],
      max: [45, '孕周不能大于45'],
    },
    gestationalDay: {
      type: Number,
      required: [true, '孕周天数不能为空'],
      min: [0, '天数不能小于0'],
      max: [6, '天数不能大于6'],
    },
    hospital: {
      type: String,
      required: [true, '医院名称不能为空'],
      trim: true,
      maxlength: [200, '医院名称最多200个字符'],
    },
    doctor: {
      type: String,
      required: [true, '医生姓名不能为空'],
      trim: true,
      maxlength: [100, '医生姓名最多100个字符'],
    },
    vitals: {
      weight: {
        type: Number,
        required: false,
        min: [0, '体重不能小于0'],
        max: [200, '体重不能大于200'],
      },
      bloodPressure: {
        systolic: {
          type: Number,
          required: false,
          min: [0, '收缩压不能小于0'],
          max: [300, '收缩压不能大于300'],
        },
        diastolic: {
          type: Number,
          required: false,
          min: [0, '舒张压不能小于0'],
          max: [200, '舒张压不能大于200'],
        },
      },
      fundalHeight: {
        type: Number,
        required: false,
        min: [0, '宫高不能小于0'],
        max: [100, '宫高不能大于100'],
      },
      abdominalCircumference: {
        type: Number,
        required: false,
        min: [0, '腹围不能小于0'],
        max: [200, '腹围不能大于200'],
      },
      fetalHeartRate: {
        type: Number,
        required: false,
        min: [0, '胎心率不能小于0'],
        max: [300, '胎心率不能大于300'],
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, '备注最多2000个字符'],
    },
  },
  {
    timestamps: true,
  }
);

// 添加复合索引：按家庭和日期排序
recordSchema.index({ familyId: 1, checkupDate: -1 });

const Record = mongoose.model('Record', recordSchema);

export default Record;
