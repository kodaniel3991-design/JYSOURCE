// Web Crypto API 기반 세션 유틸 — Edge(middleware) + Node.js(API route) 모두 호환
// API route에서 현재 세션의 사업장 코드를 읽는 헬퍼
export async function getSessionFactory(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)jys_session=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : "";
  if (!token) return null;
  const session = await verifyToken(token);
  // admin(빈 문자열)은 null 반환 → 필터 없이 전체 조회
  return session?.factory || null;
}

const SECRET = process.env.AUTH_SECRET ?? "jysource-procurement-hub-2026";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8시간
export const SESSION_COOKIE = "jys_session";

async function getHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): ArrayBuffer {
  const pairs = hex.match(/.{2}/g) ?? [];
  return new Uint8Array(pairs.map((b) => parseInt(b, 16))).buffer as ArrayBuffer;
}

// payload 형식: "username|factoryCode:expires"
// factory는 admin의 경우 빈 문자열
export async function signToken(username: string, factory = ""): Promise<string> {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${username}|${factory}:${expires}`;
  const key = await getHmacKey();
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return btoa(`${payload}:${toHex(sig)}`);
}

export async function verifyToken(
  token: string
): Promise<{ username: string; factory: string } | null> {
  try {
    const decoded = atob(token);
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon < 0) return null;
    const sig = decoded.slice(lastColon + 1);
    const payload = decoded.slice(0, lastColon);

    // payload = "username|factory:expires"
    const colonIdx = payload.lastIndexOf(":");
    if (colonIdx < 0) return null;
    const expires = Number(payload.slice(colonIdx + 1));
    if (!expires || Date.now() > expires) return null;

    const userPart = payload.slice(0, colonIdx); // "username|factory"
    const pipeIdx = userPart.indexOf("|");
    if (pipeIdx < 0) return null;
    const username = userPart.slice(0, pipeIdx);
    const factory = userPart.slice(pipeIdx + 1);

    const key = await getHmacKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      hexToBytes(sig),
      new TextEncoder().encode(payload)
    );
    if (!valid) return null;
    return { username, factory };
  } catch {
    return null;
  }
}
