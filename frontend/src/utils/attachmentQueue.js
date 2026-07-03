export const MAX_ATTACHMENTS = 20;

export function assertAttachmentRecordId(recordId) {
  if (!recordId || !recordId.trim()) {
    throw new Error('recordId is required');
  }
}

export function createQueuedAttachmentEntry(file, overrides = {}) {
  return {
    id: overrides.id ?? `${file.name}-${file.size}-${file.lastModified || 0}`,
    file,
    category: overrides.category ?? '其他',
    tags: overrides.tags ?? [],
    status: overrides.status ?? 'queued'
  };
}

export function appendQueuedAttachmentEntries(queue, files, overrides = {}) {
  return [
    ...queue,
    ...files.map((file) => createQueuedAttachmentEntry(file, overrides))
  ];
}

export function getRemainingAttachmentSlots(existingCount = 0, queuedCount = 0, maxAttachments = MAX_ATTACHMENTS) {
  return Math.max(0, maxAttachments - existingCount - queuedCount);
}

export async function uploadQueuedAttachments({ recordId, queue, uploader }) {
  const succeeded = [];
  const failed = [];

  for (const entry of queue) {
    try {
      await uploader(recordId, entry);
      succeeded.push(entry);
    } catch (error) {
      failed.push({ ...entry, error });
    }
  }

  return { succeeded, failed };
}
