export function createAttachmentFormData(entry) {
  const formData = new FormData();
  formData.append('files', entry.file);
  formData.append('category', entry.category);
  formData.append('tags', JSON.stringify(entry.tags));
  return formData;
}
