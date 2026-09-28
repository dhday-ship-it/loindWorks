import { createHmac, timingSafeEqual } from "crypto";

// LOIND-아티즌은 LOIND-WORKSPACE와 다른 오리진의 SPA라 쿠키 세션 대신
// Authorization: Bearer <token> 방식을 쓴다. next-auth(직원용)와는 완전히 별개.
const SECRET = process.env.ARTISAN_CUSTOMER_JWT_SECRET;
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

export function signCustomerToken(customerId: string): string {
  if (!SECRET) throw new Error("ARTISAN_CUSTOMER_JWT_SECRET이 설정되지 않았습니다.");
  const payloadB64 = base64url(JSON.stringify({ sub: customerId, exp: Date.now() + TOKEN_TTL_MS }));
  const sig = createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifyCustomerToken(token: string): string | null {
  if (!SECRET) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const expected = createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (typeof payload.sub !== "string") return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}
