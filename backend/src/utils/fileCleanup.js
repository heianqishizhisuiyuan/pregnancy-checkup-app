import fs from 'fs/promises';
import path from 'path';

/**
 * 删除单个文件
 * @param {string} filePath - 文件路径
 */
export async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log(`文件删除成功: ${filePath}`);
  } catch (error) {
    console.error(`文件删除失败: ${filePath}`, error);
  }
}

/**
 * 删除目录（如果为空）
 * @param {string} dirPath - 目录路径
 */
export async function deleteEmptyDir(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    if (files.length === 0) {
      await fs.rmdir(dirPath);
      console.log(`目录删除成功: ${dirPath}`);
    }
  } catch (error) {
    console.error(`目录删除失败: ${dirPath}`, error);
  }
}

/**
 * 删除附件的所有文件
 * @param {Array} attachments - 附件数组
 */
export async function deleteAttachmentFiles(attachments) {
  if (!attachments || attachments.length === 0) {
    return;
  }

  for (const attachment of attachments) {
    const filePath = path.join(process.cwd(), attachment.path);
    await deleteFile(filePath);
  }
}

/**
 * 删除记录目录
 * @param {string} familyId - 家庭 ID
 * @param {string} recordId - 记录 ID
 */
export async function deleteRecordDir(familyId, recordId) {
  const recordDir = path.join('uploads', 'families', familyId.toString(), 'records', recordId.toString());
  await deleteEmptyDir(recordDir);
}
