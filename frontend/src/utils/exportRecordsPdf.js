import { jsPDF } from 'jspdf';
import { buildRecordsPdfHtml } from './exportRecords.js';

/**
 * 直接下载 PDF 文件（通过 jsPDF 渲染 HTML，支持中文）
 */
export async function exportRecordsToPdfDownload(records, options = {}) {
  const { title = '产检记录', familyName = '', filename = '产检记录' } = options;
  const html = buildRecordsPdfHtml(records, { title, familyName });

  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '1100px';
  document.body.appendChild(container);

  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    await doc.html(container, {
      x: 8,
      y: 8,
      width: 277,
      windowWidth: 1100,
      autoPaging: 'text',
    });

    doc.save(`${filename}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
