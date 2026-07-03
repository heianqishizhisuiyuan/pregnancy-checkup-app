import { buildAttachmentFileUrl } from './attachmentUrls.js';

export function buildAttachmentPreviewUrl(apiBaseUrl, relativePath) {
  return buildAttachmentFileUrl(apiBaseUrl, relativePath);
}

export async function createAttachmentPreviewObjectUrl({
  apiBaseUrl,
  path,
  token,
  fetchImpl = fetch,
  createObjectUrl = (blob) => URL.createObjectURL(blob)
}) {
  const response = await fetchImpl(buildAttachmentPreviewUrl(apiBaseUrl, path), {
    headers: token
      ? {
          Authorization: `Bearer ${token}`
        }
      : {}
  });

  if (!response.ok) {
    throw new Error(`PREVIEW_FETCH_FAILED:${response.status}`);
  }

  const blob = await response.blob();
  return createObjectUrl(blob);
}
