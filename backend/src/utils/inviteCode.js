import crypto from 'crypto';

/**
 * 生成 8 位家庭邀请码（大写字母+数字）
 */
export function generateInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * 确保家庭有邀请码，没有则生成并保存
 */
export async function ensureFamilyInviteCode(family) {
  if (family.inviteCode) {
    return family.inviteCode;
  }

  let code;
  let attempts = 0;
  const Family = (await import('../models/Family.js')).default;

  do {
    code = generateInviteCode();
    const exists = await Family.findOne({ inviteCode: code });
    if (!exists) break;
    attempts += 1;
  } while (attempts < 10);

  family.inviteCode = code;
  await family.save();
  return code;
}
