"use server";

import { Pool, PoolClient, QueryResult } from "pg";

// อ่าน connection string จาก env ก่อน ถ้าไม่มีจะ fallback ไป PostgreSQL local
const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/postgres";

// สร้าง connection pool กลางสำหรับ query PostgreSQL ทั้งระบบ
const pool = new Pool({
  connectionString,
  ssl:
    process.env.PGSSLMODE === "disable"
      ? false
      : process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
});

// รูปแบบข้อมูล notification ที่อ่านจากตาราง notifications
export type NotificationRow = {
  id: string;
  title: string;
  message: string;
  audience: string[];
  unread_for: string[];
  created_at: string;
};

// สถานะของ Event ที่ใช้กำหนดสี/ความหมายบน UI
export type EventStatusTone = "success" | "pending" | "progress" | "rejected";

// สถานะ lifecycle สำหรับงานเบิก-คืนอุปกรณ์ของ Event
export type EventLifecycleStatus = "ready" | "inuse" | "returned";

// รูปแบบอุปกรณ์ที่ผูกอยู่กับ Event และถูกเก็บเป็น JSONB
export type EventEquipmentRow = {
  name: string;
  qty: number;
  available: number;
  category: string;
  pricePerDayTHB: number;
};

// รูปแบบใบเสร็จที่ลูกค้าแนบหลังคืนอุปกรณ์
export type EventPaymentReceipt = {
  fileName: string;
  fileType: string;
  dataUrl: string;
  uploadedAt: string;
};

// รูปแบบข้อมูล Event ที่อ่านจากตาราง events
export type EventRow = {
  id: string;
  title: string;
  status_text: string;
  status_tone: EventStatusTone;
  issue_status: EventLifecycleStatus;
  is_damaged: boolean;
  created_at: string;
  description: string;
  company: string;
  place: string;
  start_date: string;
  end_date: string;
  items_count: number;
  organizer: string | null;
  branch_code: string | null;
  budget_thb: number | null;
  attendees: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  equipment: EventEquipmentRow[];
  receipt_file_name: string | null;
  receipt_file_type: string | null;
  receipt_data_url: string | null;
  receipt_uploaded_at: string | null;
  receipt_file_path: string | null;
};

// รูปแบบข้อมูล stock item ที่อ่านจากตาราง stock_items
export type StockRowDb = {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: string;
  system: string;
  zone: string;
  status: string;
  qty: number;
  available: number;
  price_per_day: number;
  cost: number;
};

// รูปแบบประวัติการเปลี่ยนจำนวน stock ที่อ่านจากตาราง stock_history
export type StockHistoryRow = {
  id: string;
  stock_id: string;
  stock_code: string;
  stock_name: string;
  field_name: string;
  change_type: "increase" | "decrease";
  old_value: number;
  new_value: number;
  delta: number;
  created_at: string;
};

// รูปแบบประวัติการรับเข้าสต็อกที่อ่านจากตาราง stock_receipts
export type StockReceiptRow = {
  id: string;
  stock_id: string;
  stock_code: string;
  stock_name: string;
  quantity: number;
  unit_cost: number;
  supplier: string;
  po_number: string | null;
  prev_qty: number;
  prev_avg_cost: number;
  new_qty: number;
  new_avg_cost: number;
  received_by_role: string;
  created_at: string;
};

// Type สำหรับประวัติการแก้ไขอุปกรณ์ใน Event
export type EquipmentHistoryRow = {
  id: string;
  event_id: string;
  action: "เพิ่ม" | "ลบ";
  equipment_name: string;
  qty: number;
  changed_at: string;
};

// ตรวจและสร้างตารางแจ้งเตือน ถ้ายังไม่มีในฐานข้อมูล
async function ensureNotificationsTable(client?: PoolClient) {
  const c = client ?? (await pool.connect());
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        audience TEXT[] NOT NULL,
        unread_for TEXT[] NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } finally {
    if (!client) c.release();
  }
}

// ตรวจและสร้างตาราง Event รวมถึงเติม column ใหม่ที่อาจเพิ่มภายหลัง
async function ensureEventsTable(client?: PoolClient) {
  const c = client ?? (await pool.connect());
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        status_text TEXT NOT NULL,
        status_tone TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        description TEXT NOT NULL DEFAULT '',
        company TEXT NOT NULL,
        place TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        items_count INTEGER NOT NULL DEFAULT 0,
        organizer TEXT,
        branch_code TEXT,
        budget_thb INTEGER,
        attendees INTEGER,
        equipment JSONB NOT NULL DEFAULT '[]'::jsonb
      );
    `);
    await c.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS issue_status TEXT NOT NULL DEFAULT 'ready';
    `);
    await c.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS is_damaged BOOLEAN NOT NULL DEFAULT false;
    `);
    await c.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS contact_name TEXT;
    `);
    await c.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS contact_phone TEXT;
    `);
    await c.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS receipt_file_name TEXT;
    `);
    await c.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS receipt_file_type TEXT;
    `);
    await c.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS receipt_data_url TEXT;
    `);
    await c.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS receipt_uploaded_at TIMESTAMPTZ;
    `);
    await c.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS receipt_file_path TEXT;
    `);
    // ข้อมูลเก่าที่คืนอุปกรณ์แล้วแต่ยังไม่มีใบเสร็จ ต้องกลับเข้าขั้นตอนรอชำระเงินตาม flow ใหม่
    await c.query(`
      UPDATE events
      SET status_text = 'รอชำระเงิน',
          status_tone = 'pending'
      WHERE issue_status = 'returned'
        AND receipt_data_url IS NULL
        AND receipt_file_path IS NULL;
    `);
  } finally {
    if (!client) c.release();
  }
}

// ตรวจและสร้างตาราง stock_items สำหรับเก็บข้อมูลอุปกรณ์ในคลัง
async function ensureStockTable(client?: PoolClient) {
  const c = client ?? (await pool.connect());
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS stock_items (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        category TEXT NOT NULL,
        system TEXT NOT NULL,
        zone TEXT NOT NULL,
        status TEXT NOT NULL,
        qty INTEGER NOT NULL,
        available INTEGER NOT NULL,
        price_per_day INTEGER NOT NULL,
        cost INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } finally {
    if (!client) c.release();
  }
}

// ตรวจและสร้างตาราง stock_history สำหรับเก็บประวัติการเปลี่ยนจำนวนอุปกรณ์
async function ensureStockHistoryTable(client?: PoolClient) {
  const c = client ?? (await pool.connect());
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS stock_history (
        id TEXT PRIMARY KEY,
        stock_id TEXT NOT NULL,
        stock_code TEXT NOT NULL,
        stock_name TEXT NOT NULL,
        field_name TEXT NOT NULL,
        change_type TEXT NOT NULL,
        old_value INTEGER NOT NULL,
        new_value INTEGER NOT NULL,
        delta INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } finally {
    if (!client) c.release();
  }
}

// ตรวจและสร้างตาราง stock_receipts สำหรับเก็บประวัติการรับเข้าสต็อก
async function ensureStockReceiptsTable(client?: PoolClient) {
  const c = client ?? (await pool.connect());
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS stock_receipts (
        id TEXT PRIMARY KEY,
        stock_id TEXT NOT NULL,
        stock_code TEXT NOT NULL,
        stock_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_cost NUMERIC NOT NULL,
        supplier TEXT NOT NULL,
        po_number TEXT,
        prev_qty INTEGER NOT NULL,
        prev_avg_cost NUMERIC NOT NULL,
        new_qty INTEGER NOT NULL,
        new_avg_cost NUMERIC NOT NULL,
        received_by_role TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } finally {
    if (!client) c.release();
  }
}

// ตรวจและสร้างตาราง equipment_history สำหรับประวัติการเพิ่ม/ลบอุปกรณ์ใน Event
async function ensureEquipmentHistoryTable(client?: PoolClient) {
  const c = client ?? (await pool.connect());
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS equipment_history (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        action TEXT NOT NULL,
        equipment_name TEXT NOT NULL,
        qty INTEGER NOT NULL,
        changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } finally {
    if (!client) c.release();
  }
}

// ตรวจและสร้างตาราง app_settings สำหรับเก็บค่า Settings ของระบบ
async function ensureSettingsTable(client?: PoolClient) {
  const c = client ?? (await pool.connect());
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } finally {
    if (!client) c.release();
  }
}

// เรียก ensure ทุกตาราง ใช้เมื่อต้องการเตรียม database ให้พร้อมก่อนใช้งาน
async function ensureTables(client?: PoolClient) {
  await ensureNotificationsTable(client);
  await ensureEventsTable(client);
  await ensureStockTable(client);
  await ensureStockHistoryTable(client);
  await ensureStockReceiptsTable(client);
  await ensureEquipmentHistoryTable(client);
  await ensureSettingsTable(client);
}

// เพิ่ม notification ใหม่พร้อมกำหนด audience และรายชื่อ role ที่ยังไม่ได้อ่าน
export async function insertNotification(payload: {
  id: string;
  title: string;
  message: string;
  audience: string[];
  unread: string[];
  createdAt: string;
}) {
  const client = await pool.connect();
  try {
    await ensureNotificationsTable(client);
    await client.query(
      `INSERT INTO notifications (id, title, message, audience, unread_for, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [payload.id, payload.title, payload.message, payload.audience, payload.unread, payload.createdAt]
    );
  } finally {
    client.release();
  }
}

// ดึง notification ทั้งหมดที่ role นี้มีสิทธิ์เห็น เรียงจากใหม่ไปเก่า
export async function listNotificationsForRole(role: string): Promise<NotificationRow[]> {
  const client = await pool.connect();
  try {
    await ensureNotificationsTable(client);
    const res: QueryResult<NotificationRow> = await client.query(
      `SELECT id, title, message, audience, unread_for, created_at
       FROM notifications
       WHERE $1 = ANY(audience)
       ORDER BY created_at DESC`,
      [role]
    );
    return res.rows;
  } finally {
    client.release();
  }
}

// ลบแจ้งเตือนที่เก่ากว่าจำนวนวันที่กำหนด ใช้ cleanup อัตโนมัติใน popup แจ้งเตือน
export async function deleteOldNotifications(days = 30): Promise<number> {
  const client = await pool.connect();
  try {
    await ensureNotificationsTable(client);
    const res = await client.query(
      `DELETE FROM notifications
       WHERE created_at < NOW() - ($1::int * INTERVAL '1 day')`,
      [days]
    );
    return res.rowCount ?? 0;
  } finally {
    client.release();
  }
}

// ลบแจ้งเตือนออกจาก role เดียว ถ้าไม่มี role ไหนเห็นแล้วจะลบ row ทิ้งจริง
export async function deleteNotificationForRole(role: string, id: string): Promise<number> {
  const client = await pool.connect();
  try {
    await ensureNotificationsTable(client);
    const res = await client.query(
      `UPDATE notifications
       SET
         audience = array_remove(audience, $1),
         unread_for = array_remove(unread_for, $1)
       WHERE id = $2 AND $1 = ANY(audience)`,
      [role, id]
    );
    await client.query(
      `DELETE FROM notifications
       WHERE array_length(audience, 1) IS NULL`
    );
    return res.rowCount ?? 0;
  } finally {
    client.release();
  }
}

// ล้างแจ้งเตือนทั้งหมดของ role ปัจจุบันใน popup
export async function deleteNotificationsForRole(role: string): Promise<number> {
  const client = await pool.connect();
  try {
    await ensureNotificationsTable(client);
    const res = await client.query(
      `UPDATE notifications
       SET
         audience = array_remove(audience, $1),
         unread_for = array_remove(unread_for, $1)
       WHERE $1 = ANY(audience)`,
      [role]
    );
    await client.query(
      `DELETE FROM notifications
       WHERE array_length(audience, 1) IS NULL`
    );
    return res.rowCount ?? 0;
  } finally {
    client.release();
  }
}

// นับจำนวน notification ที่ role นี้ยังไม่ได้อ่าน
export async function countUnread(role: string): Promise<number> {
  const client = await pool.connect();
  try {
    await ensureNotificationsTable(client);
    const res = await client.query<{ count: string }>(
      `SELECT COUNT(*)::int as count
       FROM notifications
       WHERE $1 = ANY(audience) AND $1 = ANY(unread_for)`,
      [role]
    );
    return Number(res.rows[0]?.count ?? 0);
  } finally {
    client.release();
  }
}

// mark notification เป็นอ่านแล้ว โดยเอา role ออกจาก unread_for จะระบุ ids หรืออ่านทั้งหมดก็ได้
export async function markRead(role: string, ids?: string[]) {
  const client = await pool.connect();
  try {
    await ensureNotificationsTable(client);
    if (ids && ids.length > 0) {
      await client.query(
        `UPDATE notifications
         SET unread_for = array_remove(unread_for, $1)
         WHERE id = ANY($2::text[]) AND $1 = ANY(unread_for)`,
        [role, ids]
      );
    } else {
      await client.query(
        `UPDATE notifications
         SET unread_for = array_remove(unread_for, $1)
         WHERE $1 = ANY(unread_for)`,
        [role]
      );
    }
  } finally {
    client.release();
  }
}

// เตรียมตารางทั้งหมดแล้วคืน pool ให้ส่วนอื่นนำไป query เองได้
export async function getPool() {
  await ensureTables();
  return pool;
}

// ดึงรายการ Event ทั้งหมดจากฐานข้อมูลเพื่อส่งให้ API/UI
export async function listEvents(): Promise<EventRow[]> {
  const client = await pool.connect();
  try {
    await ensureEventsTable(client);
    const res: QueryResult<EventRow> = await client.query(
      `SELECT id, title, status_text, status_tone, issue_status, is_damaged, created_at,
         description, company, place, start_date, end_date, items_count,
         organizer, branch_code, budget_thb, attendees, contact_name, contact_phone, equipment,
         receipt_file_name, receipt_file_type, receipt_data_url, receipt_uploaded_at, receipt_file_path
       FROM events ORDER BY created_at DESC, id DESC`
    );
    return res.rows;
  } finally {
    client.release();
  }
}

// ดึง Event เดียวตาม id ใช้ก่อน update/delete หรือเช็คว่ามีข้อมูลอยู่จริง
export async function getEventById(id: string): Promise<EventRow | null> {
  const client = await pool.connect();
  try {
    await ensureEventsTable(client);
    const res: QueryResult<EventRow> = await client.query(
      `SELECT id, title, status_text, status_tone, issue_status, is_damaged, created_at,
         description, company, place, start_date, end_date, items_count,
         organizer, branch_code, budget_thb, attendees, contact_name, contact_phone, equipment,
         receipt_file_name, receipt_file_type, receipt_data_url, receipt_uploaded_at, receipt_file_path
       FROM events WHERE id = $1 LIMIT 1`,
      [id]
    );
    return res.rows[0] ?? null;
  } finally {
    client.release();
  }
}

// เพิ่ม Event ใหม่จากฟอร์มสร้างงาน โดยเริ่ม issue_status เป็น ready
export async function insertEvent(payload: {
  id: string;
  title: string;
  statusText: string;
  statusTone: EventStatusTone;
  createdAt: string;
  description: string;
  company: string;
  place: string;
  startDate: string;
  endDate: string;
  itemsCount: number;
  organizer?: string;
  branchCode?: string;
  budgetTHB?: number;
  attendees?: number;
  contactName?: string;
  contactPhone?: string;
  equipment?: EventEquipmentRow[];
}) {
  const client = await pool.connect();
  try {
    await ensureEventsTable(client);
    await client.query(
      `INSERT INTO events (
        id, title, status_text, status_tone, created_at, description, company, place,
        start_date, end_date, items_count, organizer, branch_code, budget_thb, attendees,
        contact_name, contact_phone, equipment, issue_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18::jsonb, $19)`,
      [
        payload.id, payload.title, payload.statusText, payload.statusTone,
        payload.createdAt, payload.description, payload.company, payload.place,
        payload.startDate, payload.endDate, payload.itemsCount,
        payload.organizer ?? null, payload.branchCode ?? null,
        payload.budgetTHB ?? null, payload.attendees ?? null,
        payload.contactName ?? null, payload.contactPhone ?? null,
        JSON.stringify(payload.equipment ?? []), "ready",
      ]
    );
  } finally {
    client.release();
  }
}

// อัปเดตสถานะการเบิก/คืนของ Event และบันทึกว่าเสียหายหรือไม่เมื่อคืนอุปกรณ์
export async function updateEventIssueStatus(
  id: string,
  issueStatus: EventLifecycleStatus,
  isDamaged = false
) {
  const client = await pool.connect();
  try {
    await ensureEventsTable(client);
    let res;
    if (issueStatus === "returned") {
      res = await client.query(
        `UPDATE events
         SET issue_status = $2,
             is_damaged = $3,
             status_text = 'รอชำระเงิน',
             status_tone = 'pending'
         WHERE id = $1`,
        [id, issueStatus, isDamaged]
      );
    } else {
      res = await client.query(
        `UPDATE events SET issue_status = $2 WHERE id = $1`,
        [id, issueStatus]
      );
    }
    return res.rowCount ?? 0;
  } finally {
    client.release();
  }
}

// หักจำนวน available ใน stock_items ตามอุปกรณ์ที่ผูกกับ Event นั้น
export async function deductStockForEventIssue(eventId: string) {
  const client = await pool.connect();
  try {
    await ensureEventsTable(client);
    await ensureStockTable(client);
    await client.query(
      `UPDATE stock_items s
       SET
         available = GREATEST(0, s.available - e.qty),
         status = CASE
           WHEN GREATEST(0, s.available - e.qty) = 0 THEN 'ใช้งานอยู่'
           ELSE s.status
         END
       FROM (
         SELECT item->>'name' AS name, GREATEST(0, COALESCE((item->>'qty')::int, 0)) AS qty
         FROM events ev, jsonb_array_elements(ev.equipment) AS item
         WHERE ev.id = $1
       ) e
       WHERE s.name = e.name`,
      [eventId]
    );
  } finally {
    client.release();
  }
}

// บันทึกผลอนุมัติ/ไม่อนุมัติ Event พร้อมช่วงวันที่และรายการอุปกรณ์ที่เลือก
export async function updateEventDecision(payload: {
  id: string;
  startDate: string;
  endDate: string;
  itemsCount: number;
  statusText: string;
  statusTone: EventStatusTone;
  equipment: EventEquipmentRow[];
}) {
  const client = await pool.connect();
  try {
    await ensureEventsTable(client);
    const res = await client.query(
      `UPDATE events
       SET
         start_date = $2,
         end_date = $3,
         items_count = $4,
         status_text = $5,
         status_tone = $6,
         equipment = $7::jsonb,
         issue_status = CASE WHEN $6 = 'pending' THEN 'ready' ELSE issue_status END
       WHERE id = $1`,
      [
        payload.id, payload.startDate, payload.endDate, payload.itemsCount,
        payload.statusText, payload.statusTone, JSON.stringify(payload.equipment),
      ]
    );
    return res.rowCount ?? 0;
  } finally {
    client.release();
  }
}

// อัปเดตรายการอุปกรณ์ของ Event จาก flow เบิก/คืนด่วน โดยไม่ต้องผ่านหน้าจออนุมัติ
export async function updateEventEquipment(payload: {
  id: string;
  equipment: EventEquipmentRow[];
  issueStatus?: EventLifecycleStatus;
  isDamaged?: boolean;
  statusText?: string;
  statusTone?: EventStatusTone;
}) {
  const client = await pool.connect();
  try {
    await ensureEventsTable(client);
    const res = await client.query(
      `UPDATE events
       SET
         equipment = $2::jsonb,
         items_count = $3,
         issue_status = COALESCE($4::text, issue_status),
         is_damaged = COALESCE($5::boolean, is_damaged),
         status_text = COALESCE($6::text, status_text),
         status_tone = COALESCE($7::text, status_tone)
       WHERE id = $1`,
      [
        payload.id,
        JSON.stringify(payload.equipment),
        payload.equipment.length,
        payload.issueStatus ?? null,
        typeof payload.isDamaged === "boolean" ? payload.isDamaged : null,
        payload.statusText ?? null,
        payload.statusTone ?? null,
      ]
    );
    return res.rowCount ?? 0;
  } finally {
    client.release();
  }
}

// บันทึกสลิปการชำระเงินที่ลูกค้าแนบ (เก็บเป็น path ไฟล์บนดิสก์) และเปลี่ยนสถานะให้ผู้จัดการตรวจสอบ
export async function updateEventPaymentReceipt(payload: {
  id: string;
  fileName: string;
  fileType: string;
  filePath: string;
  uploadedAt: string;
}) {
  const client = await pool.connect();
  try {
    await ensureEventsTable(client);
    const res = await client.query(
      `UPDATE events
       SET
         receipt_file_name = $2,
         receipt_file_type = $3,
         receipt_file_path = $4,
         receipt_uploaded_at = $5,
         status_text = 'รอตรวจสอบการชำระเงิน',
         status_tone = 'pending'
       WHERE id = $1`,
      [
        payload.id,
        payload.fileName,
        payload.fileType,
        payload.filePath,
        payload.uploadedAt,
      ]
    );
    return res.rowCount ?? 0;
  } finally {
    client.release();
  }
}

// ผู้จัดการยืนยันว่าสลิปถูกต้องและปิดงานเป็นเสร็จสิ้น
export async function confirmEventPayment(id: string) {
  const client = await pool.connect();
  try {
    await ensureEventsTable(client);
    const res = await client.query(
      `UPDATE events
       SET
         status_text = 'เสร็จสิ้น',
         status_tone = 'progress'
       WHERE id = $1 AND (receipt_data_url IS NOT NULL OR receipt_file_path IS NOT NULL)`,
      [id]
    );
    return res.rowCount ?? 0;
  } finally {
    client.release();
  }
}

// ลบ Event ตาม id และคืนจำนวนแถวที่ถูกลบให้ API ใช้ตรวจ 404
export async function deleteEventById(id: string) {
  const client = await pool.connect();
  try {
    await ensureEventsTable(client);
    const res = await client.query(`DELETE FROM events WHERE id = $1`, [id]);
    return res.rowCount ?? 0;
  } finally {
    client.release();
  }
}

// ดึงข้อมูลอุปกรณ์ทั้งหมดในคลังจาก stock_items
export async function listStockItems(): Promise<StockRowDb[]> {
  const client = await pool.connect();
  try {
    await ensureStockTable(client);
    const res: QueryResult<StockRowDb> = await client.query(
      `SELECT id, code, name, brand, category, system, zone, status, qty, available, price_per_day, cost
       FROM stock_items ORDER BY id ASC`
    );
    return res.rows;
  } finally {
    client.release();
  }
}

type StockItemInput = {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: string;
  system: string;
  zone: string;
  status: string;
  qty: number;
  available: number;
  pricePerDay: number;
  cost: number;
};

const STOCK_NUMERIC_FIELDS: Array<{
  label: string;
  getOld: (r: StockRowDb) => number;
  getNew: (i: StockItemInput) => number;
}> = [
  { label: "qty",           getOld: r => r.qty,           getNew: i => i.qty },
  { label: "available",     getOld: r => r.available,     getNew: i => i.available },
  { label: "price_per_day", getOld: r => r.price_per_day, getNew: i => i.pricePerDay },
  { label: "cost",          getOld: r => r.cost,          getNew: i => i.cost },
];

async function insertStockHistory(
  client: PoolClient,
  stockId: string,
  stockCode: string,
  stockName: string,
  fieldLabel: string,
  oldValue: number,
  newValue: number,
  createdAt: string
) {
  const delta = newValue - oldValue;
  await client.query(
    `INSERT INTO stock_history (id, stock_id, stock_code, stock_name, field_name, change_type, old_value, new_value, delta, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      `STH-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      stockId, stockCode, stockName,
      fieldLabel,
      delta > 0 ? "increase" : "decrease",
      oldValue, newValue, delta,
      createdAt,
    ]
  );
}

export async function upsertStockItems(items: StockItemInput[]) {
  const client = await pool.connect();
  try {
    await ensureStockTable(client);
    await ensureStockHistoryTable(client);
    await client.query("BEGIN");

    // Snapshot current rows for history comparison
    const prevRes = await client.query<StockRowDb>(
      `SELECT id, code, name, qty, available, price_per_day, cost FROM stock_items`
    );
    const prevById = new Map(prevRes.rows.map(r => [r.id, r]));

    // Upsert each item — ON CONFLICT preserves the original created_at
    for (const item of items) {
      await client.query(
        `INSERT INTO stock_items (id, code, name, brand, category, system, zone, status, qty, available, price_per_day, cost)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           code = EXCLUDED.code, name = EXCLUDED.name, brand = EXCLUDED.brand,
           category = EXCLUDED.category, system = EXCLUDED.system, zone = EXCLUDED.zone,
           status = EXCLUDED.status, qty = EXCLUDED.qty, available = EXCLUDED.available,
           price_per_day = EXCLUDED.price_per_day, cost = EXCLUDED.cost`,
        [item.id, item.code, item.name, item.brand, item.category, item.system,
         item.zone, item.status, item.qty, item.available, item.pricePerDay, item.cost]
      );
    }

    // Delete items removed from the list
    const activeIds = items.map(i => i.id);
    if (activeIds.length > 0) {
      await client.query(
        `DELETE FROM stock_items WHERE NOT (id = ANY($1::text[]))`,
        [activeIds]
      );
    } else {
      await client.query(`DELETE FROM stock_items`);
    }

    // Record history for every changed numeric field on existing items
    const createdAt = new Date().toISOString();
    for (const item of items) {
      const prev = prevById.get(item.id);
      if (!prev) continue; // new item — no before state to compare
      for (const field of STOCK_NUMERIC_FIELDS) {
        const oldVal = field.getOld(prev);
        const newVal = field.getNew(item);
        if (oldVal === newVal) continue;
        await insertStockHistory(client, item.id, item.code, item.name, field.label, oldVal, newVal, createdAt);
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Atomic server-side stock adjustment — deduct / return / damage
export async function adjustStock(
  items: Array<{ name: string; qty: number }>,
  action: "deduct" | "return" | "damage"
): Promise<StockRowDb[]> {
  const client = await pool.connect();
  try {
    await ensureStockTable(client);
    await ensureStockHistoryTable(client);

    const results: StockRowDb[] = [];
    const createdAt = new Date().toISOString();

    for (const item of items) {
      if (action === "deduct") {
        // CTE captures old available before the UPDATE in the same query
        const res = await client.query<StockRowDb & { old_available: number }>(
          `WITH old_row AS (SELECT available FROM stock_items WHERE name = $1),
           upd AS (
             UPDATE stock_items
             SET
               available = GREATEST(0, available - $2::int),
               status = CASE WHEN GREATEST(0, available - $2::int) = 0 THEN 'ใช้งานอยู่' ELSE status END
             WHERE name = $1
             RETURNING id, code, name, brand, category, system, zone, status, qty, available, price_per_day, cost
           )
           SELECT upd.*, old_row.available AS old_available FROM upd, old_row`,
          [item.name, item.qty]
        );
        if (res.rows.length > 0) {
          const row = res.rows[0];
          results.push(row);
          if (row.old_available !== row.available) {
            await insertStockHistory(client, row.id, row.code, row.name, "available", row.old_available, row.available, createdAt);
          }
        }
      } else if (action === "return") {
        const res = await client.query<StockRowDb & { old_available: number }>(
          `WITH old_row AS (SELECT available FROM stock_items WHERE name = $1),
           upd AS (
             UPDATE stock_items
             SET
               available = LEAST(qty, available + $2::int),
               status = CASE WHEN available + $2::int > 0 THEN 'พร้อมใช้' ELSE status END
             WHERE name = $1
             RETURNING id, code, name, brand, category, system, zone, status, qty, available, price_per_day, cost
           )
           SELECT upd.*, old_row.available AS old_available FROM upd, old_row`,
          [item.name, item.qty]
        );
        if (res.rows.length > 0) {
          const row = res.rows[0];
          results.push(row);
          if (row.old_available !== row.available) {
            await insertStockHistory(client, row.id, row.code, row.name, "available", row.old_available, row.available, createdAt);
          }
        }
      } else {
        // damage: status only, no available change
        const res = await client.query<StockRowDb>(
          `UPDATE stock_items SET status = 'ซ่อมแซม' WHERE name = $1
           RETURNING id, code, name, brand, category, system, zone, status, qty, available, price_per_day, cost`,
          [item.name]
        );
        results.push(...res.rows);
      }
    }

    return results;
  } finally {
    client.release();
  }
}

// รับเข้าสต็อก: คำนวณต้นทุนเฉลี่ยถ่วงน้ำหนักใหม่ อัปเดต stock_items แล้วบันทึกประวัติลง stock_receipts แบบ atomic
export async function receiveStock(payload: {
  equipmentId: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  poNumber?: string;
  receivedByRole: string;
}): Promise<StockRowDb> {
  const client = await pool.connect();
  try {
    await ensureStockTable(client);
    await ensureStockHistoryTable(client);
    await ensureStockReceiptsTable(client);
    await client.query("BEGIN");

    const currentRes = await client.query<StockRowDb>(
      `SELECT id, code, name, brand, category, system, zone, status, qty, available, price_per_day, cost
       FROM stock_items WHERE id = $1 FOR UPDATE`,
      [payload.equipmentId]
    );
    const current = currentRes.rows[0];
    if (!current) {
      await client.query("ROLLBACK");
      throw new Error("stock item not found");
    }

    const prevQty = current.qty;
    const prevAvgCost = current.cost;
    const newQty = prevQty + payload.quantity;
    // สูตรเดียวกับที่ preview ใน ReceiveStockModal
    const newAvgCost =
      newQty > 0
        ? (prevQty * prevAvgCost + payload.quantity * payload.unitCost) / newQty
        : prevAvgCost;
    const newAvailable = current.available + payload.quantity;
    const roundedAvgCost = Math.round(newAvgCost);

    const updatedRes = await client.query<StockRowDb>(
      `UPDATE stock_items
       SET qty = $2, available = $3, cost = $4
       WHERE id = $1
       RETURNING id, code, name, brand, category, system, zone, status, qty, available, price_per_day, cost`,
      [payload.equipmentId, newQty, newAvailable, roundedAvgCost]
    );
    const updated = updatedRes.rows[0];

    const createdAt = new Date().toISOString();
    await client.query(
      `INSERT INTO stock_receipts (
        id, stock_id, stock_code, stock_name, quantity, unit_cost, supplier, po_number,
        prev_qty, prev_avg_cost, new_qty, new_avg_cost, received_by_role, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        `SRC-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        current.id, current.code, current.name,
        payload.quantity, payload.unitCost, payload.supplier, payload.poNumber ?? null,
        prevQty, prevAvgCost, newQty, newAvgCost,
        payload.receivedByRole, createdAt,
      ]
    );

    await insertStockHistory(client, current.id, current.code, current.name, "qty", prevQty, newQty, createdAt);
    if (current.available !== newAvailable) {
      await insertStockHistory(client, current.id, current.code, current.name, "available", current.available, newAvailable, createdAt);
    }
    if (prevAvgCost !== roundedAvgCost) {
      await insertStockHistory(client, current.id, current.code, current.name, "cost", prevAvgCost, roundedAvgCost, createdAt);
    }

    await client.query("COMMIT");
    return updated;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function listStockHistory(limit = 100): Promise<StockHistoryRow[]> {
  const client = await pool.connect();
  try {
    await ensureStockHistoryTable(client);
    const res: QueryResult<StockHistoryRow> = await client.query(
      `SELECT id, stock_id, stock_code, stock_name, field_name, change_type, old_value, new_value, delta, created_at
       FROM stock_history ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return res.rows;
  } finally {
    client.release();
  }
}

// ดึงค่า Settings ปัจจุบันจาก app_settings key default
export async function getSettings(): Promise<Record<string, unknown> | null> {
  const client = await pool.connect();
  try {
    await ensureSettingsTable(client);
    const res = await client.query<{ data: Record<string, unknown> }>(
      `SELECT data FROM app_settings WHERE key = 'default' LIMIT 1`
    );
    return res.rows[0]?.data ?? null;
  } finally {
    client.release();
  }
}

// บันทึกหรืออัปเดต Settings โดยใช้ JSONB เก็บทั้งก้อนใน key default
export async function upsertSettings(data: Record<string, unknown>): Promise<void> {
  const client = await pool.connect();
  try {
    await ensureSettingsTable(client);
    await client.query(
      `INSERT INTO app_settings (key, data, updated_at)
       VALUES ('default', $1::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET data = $1::jsonb, updated_at = NOW()`,
      [JSON.stringify(data)]
    );
  } finally {
    client.release();
  }
}

// บันทึกประวัติการเพิ่ม/ลบอุปกรณ์ใน Event ลง equipment_history
export async function insertEquipmentHistory(payload: {
  id: string;
  eventId: string;
  action: "เพิ่ม" | "ลบ";
  equipmentName: string;
  qty: number;
  changedAt: string;
}) {
  const client = await pool.connect();
  try {
    await ensureEquipmentHistoryTable(client);
    await client.query(
      `INSERT INTO equipment_history (id, event_id, action, equipment_name, qty, changed_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [payload.id, payload.eventId, payload.action, payload.equipmentName, payload.qty, payload.changedAt]
    );
  } finally {
    client.release();
  }
}

// ดึงประวัติการแก้ไขอุปกรณ์ของ Event ตาม eventId เรียงจากใหม่ไปเก่า
export async function listEquipmentHistoryByEvent(eventId: string): Promise<EquipmentHistoryRow[]> {
  const client = await pool.connect();
  try {
    await ensureEquipmentHistoryTable(client);
    const res: QueryResult<EquipmentHistoryRow> = await client.query(
      `SELECT id, event_id, action, equipment_name, qty, changed_at
       FROM equipment_history
       WHERE event_id = $1
       ORDER BY changed_at DESC`,
      [eventId]
    );
    return res.rows;
  } finally {
    client.release();
  }
}
