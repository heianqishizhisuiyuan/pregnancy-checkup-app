const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]/;

/**
 * 将 latin1 误读的 UTF-8 字节还原为正确字符串。
 */
export function decodeUploadedFilename(name) {
  if (!name) {
    return name;
  }

  return Buffer.from(name, 'latin1').toString('utf8');
}

/**
 * 规范化上传文件名：兼容 multer 乱码与已正确解析的 UTF-8。
 * - 已含中文：原样返回
 * - latin1 乱码：尝试还原
 */
export function normalizeUploadedFilename(name) {
  if (!name) {
    return name;
  }

  if (CJK_REGEX.test(name)) {
    return name;
  }

  const decoded = decodeUploadedFilename(name);

  if (CJK_REGEX.test(decoded)) {
    return decoded;
  }

  if (/^[\x20-\x7e.]+$/.test(name)) {
    return name;
  }

  if (decoded !== name && !decoded.includes('\uFFFD')) {
    return decoded;
  }

  return name;
}

/**
 * 规范化记录附件列表中的文件名（用于 API 响应）。
 */
export function normalizeAttachmentFilenames(attachments = []) {
  return attachments.map((attachment) => ({
    ...attachment,
    filename: normalizeUploadedFilename(attachment.filename)
  }));
}

/**
 * 规范化记录对象中的附件文件名。
 */
export function normalizeRecordAttachments(record) {
  if (!record) {
    return record;
  }

  const plain = typeof record.toObject === 'function' ? record.toObject() : { ...record };

  if (Array.isArray(plain.attachments)) {
    plain.attachments = normalizeAttachmentFilenames(plain.attachments);
  }

  return plain;
}
