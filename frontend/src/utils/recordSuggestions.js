/** 从历史记录提取医院、医生建议列表 */
export function extractSuggestions(records = []) {
  const hospitals = new Set();
  const doctors = new Set();

  records.forEach((record) => {
    if (record.hospital?.trim()) hospitals.add(record.hospital.trim());
    if (record.doctor?.trim()) doctors.add(record.doctor.trim());
  });

  return {
    hospitals: [...hospitals].sort(),
    doctors: [...doctors].sort(),
  };
}

export function filterSuggestions(list, query) {
  if (!query?.trim()) return list.slice(0, 10);
  const q = query.trim().toLowerCase();
  return list.filter((item) => item.toLowerCase().includes(q)).slice(0, 10);
}
