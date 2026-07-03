import dayjs from 'dayjs';

/** 按年月分组产检记录（记录需已按日期倒序） */
export function groupRecordsByMonth(records = []) {
  const groups = [];
  let currentKey = null;

  records.forEach((record) => {
    const key = dayjs(record.checkupDate).format('YYYY-MM');
    const label = dayjs(record.checkupDate).format('YYYY年M月');

    if (key !== currentKey) {
      groups.push({ key, label, records: [record] });
      currentKey = key;
    } else {
      groups[groups.length - 1].records.push(record);
    }
  });

  return groups;
}
