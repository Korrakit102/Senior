import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// กัน null byte ใน URL ของทุก API (path param เช่น /api/events/[id] และ query string เช่น ?role=)
// ค่าพวกนี้ถูกส่งเข้า SQL ตรงๆ และ Postgres ปฏิเสธ \u0000 ใน TEXT ทำให้เกิด 500
// ดักที่นี่ที่เดียวแทนการเช็คทีละ route — body ยังต้องเช็คด้วย containsNullByte ใน route เหมือนเดิม
export function proxy(request: NextRequest) {
  if (/%00/.test(request.nextUrl.pathname + request.nextUrl.search)) {
    return NextResponse.json(
      { error: "ข้อความมีอักขระที่ไม่รองรับ กรุณาลบแล้วลองใหม่" },
      { status: 400 }
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
