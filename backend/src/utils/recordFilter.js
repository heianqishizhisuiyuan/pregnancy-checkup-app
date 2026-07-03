/**
 * 根据查询参数构建记录筛选条件
 */
export function buildRecordFilter(familyId, query = {}) {
  const filter = { familyId };

  const { keyword, hospital, startDate, endDate, minWeek, maxWeek } = query;

  if (hospital && hospital.trim()) {
    filter.hospital = new RegExp(hospital.trim(), 'i');
  }

  if (startDate || endDate) {
    filter.checkupDate = {};
    if (startDate) {
      filter.checkupDate.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.checkupDate.$lte = end;
    }
  }

  if (minWeek !== undefined && minWeek !== '') {
    filter.gestationalWeek = filter.gestationalWeek || {};
    filter.gestationalWeek.$gte = Number(minWeek);
  }

  if (maxWeek !== undefined && maxWeek !== '') {
    filter.gestationalWeek = filter.gestationalWeek || {};
    filter.gestationalWeek.$lte = Number(maxWeek);
  }

  if (keyword && keyword.trim()) {
    const pattern = new RegExp(keyword.trim(), 'i');
    filter.$or = [
      { hospital: pattern },
      { doctor: pattern },
      { notes: pattern },
    ];
  }

  return filter;
}

/**
 * 列表接口精简附件字段，只返回数量
 */
export function slimRecordForList(record) {
  const obj = record.toObject ? record.toObject() : { ...record };
  const attachments = obj.attachments || [];
  obj.attachmentCount = attachments.length;
  // 列表预览：最多返回前 2 张图片的路径信息
  obj.previewAttachments = attachments
    .filter((a) => a.mimetype?.startsWith('image/'))
    .slice(0, 2)
    .map((a) => ({
      _id: a._id,
      path: a.path,
      mimetype: a.mimetype,
    }));
  delete obj.attachments;
  return obj;
}
