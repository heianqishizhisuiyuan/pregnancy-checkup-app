export function createQueuedAttachmentEntry(file, overrides = {}) {
  return {
    id: overrides.id || `${file.name}-${file.size}-${file.lastModified || 0}`,
    file,
    category: overrides.category || '其他',
    tags: overrides.tags || [],
    status: overrides.status || 'queued'
  };
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
