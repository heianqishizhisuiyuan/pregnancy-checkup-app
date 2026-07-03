function normalizeBaseUrl(baseUrl) {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

export function buildAttachmentUploadUrl(apiBaseUrl, recordId) {
  return `${normalizeBaseUrl(apiBaseUrl)}/records/${recordId}/attachments`;
}

export function buildAttachmentFileUrl(apiBaseUrl, relativePath) {
  const normalizedBase = normalizeBaseUrl(apiBaseUrl);
  const siteBase = normalizedBase.endsWith('/api')
    ? normalizedBase.slice(0, -4)
    : normalizedBase;
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${siteBase}/${cleanPath}`;
}
