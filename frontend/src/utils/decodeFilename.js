const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]/;

export function decodeUploadedFilename(name) {
  if (!name) {
    return name;
  }

  return Buffer.from(name, 'latin1').toString('utf8');
}

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
