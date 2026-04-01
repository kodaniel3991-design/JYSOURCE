import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.EMAIL_ENCRYPTION_KEY;
  if (!secret) throw new Error("EMAIL_ENCRYPTION_KEY 환경변수가 설정되지 않았습니다.");
  return scryptSync(secret, "jys-email-salt", 32);
}

/** 평문 → 암호화 문자열 (iv:tag:ciphertext, hex 인코딩) */
export function encryptText(plain: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/** 암호화 문자열 → 평문 복호화 */
export function decryptText(encoded: string): string {
  const parts = encoded.split(":");
  if (parts.length !== 3) throw new Error("잘못된 암호화 형식");
  const [ivHex, tagHex, encHex] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted).toString("utf8") + decipher.final("utf8");
}
