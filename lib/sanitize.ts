// ตรวจว่า string/object/array ใดๆ มี null byte (\u0000) ปนอยู่หรือไม่
// Postgres ปฏิเสธ null byte ใน column ประเภท TEXT ตรงๆ ทำให้เกิด 500 ถ้าไม่ดักไว้ก่อนที่ API layer
export function containsNullByte(value: unknown): boolean {
  if (typeof value === "string") return value.includes("\u0000");
  if (Array.isArray(value)) return value.some(containsNullByte);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(containsNullByte);
  }
  return false;
}
