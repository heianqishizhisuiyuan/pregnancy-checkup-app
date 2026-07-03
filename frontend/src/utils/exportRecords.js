import * as XLSX from 'xlsx';
import { formatDate, formatGestationalAge } from './date.js';

/**
 * 将记录转为导出行
 */
export function recordsToRows(records) {
  return records.map((record) => ({
    产检日期: formatDate(record.checkupDate),
    孕周: formatGestationalAge(record.gestationalWeek, record.gestationalDay),
    医院: record.hospital || '',
    医生: record.doctor || '',
    体重kg: record.vitals?.weight ?? '',
    收缩压: record.vitals?.bloodPressure?.systolic ?? '',
    舒张压: record.vitals?.bloodPressure?.diastolic ?? '',
    宫高cm: record.vitals?.fundalHeight ?? '',
    腹围cm: record.vitals?.abdominalCircumference ?? '',
    胎心率: record.vitals?.fetalHeartRate ?? '',
    附件数: record.attachmentCount ?? record.attachments?.length ?? 0,
    备注: record.notes || '',
  }));
}

/**
 * 导出 Excel
 */
export function exportRecordsToExcel(records, filename = '产检记录') {
  const rows = recordsToRows(records);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '产检记录');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * 导出 PDF（通过打印对话框，支持中文）
 */
export function exportRecordsToPdf(records, options = {}) {
  const { title = '产检记录', familyName = '' } = options;
  const rows = recordsToRows(records);

  const tableRows = rows
    .map(
      (row) => `
      <tr>
        <td>${row.产检日期}</td>
        <td>${row.孕周}</td>
        <td>${row.医院}</td>
        <td>${row.医生}</td>
        <td>${row.体重kg}</td>
        <td>${row.收缩压}/${row.舒张压}</td>
        <td>${row.宫高cm}</td>
        <td>${row.腹围cm}</td>
        <td>${row.胎心率}</td>
        <td>${row.备注}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    body { font-family: "Microsoft YaHei", sans-serif; padding: 24px; color: #1F2421; }
    h1 { font-size: 20px; margin-bottom: 8px; }
    .meta { color: #5C635D; font-size: 13px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #E7E1D7; padding: 8px; text-align: left; }
    th { background: #F7F4EF; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">${familyName ? `家庭：${familyName} · ` : ''}共 ${records.length} 条记录 · 导出时间 ${formatDate(new Date(), 'YYYY-MM-DD HH:mm')}</div>
  <table>
    <thead>
      <tr>
        <th>日期</th><th>孕周</th><th>医院</th><th>医生</th>
        <th>体重</th><th>血压</th><th>宫高</th><th>腹围</th><th>胎心</th><th>备注</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('无法打开打印窗口，请允许弹出窗口');
  }
  printWindow.document.write(html);
  printWindow.document.close();
}
