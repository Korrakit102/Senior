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
         organizer, branch_code, budget_thb, attendees, contact_name, contact_phone, equipment
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
         organizer, branch_code, budget_thb, attendees, contact_name, contact_phone, equipment
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
             status_text = 'เสร็จสิ้น',
             status_tone = 'progress'
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

// แทนที่ข้อมูล stock ทั้งชุดใน transaction และบันทึก history ถ้ามีการเปลี่ยน qty
export async function replaceStockItems(
  items: Array<{
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
  }>,
  historyEntries?: Array<{
    id: string;
    stockId: string;
    stockCode: string;
    stockName: string;
    fieldName: string;
    changeType: "increase" | "decrease";
    oldValue: number;
    newValue: number;
    delta: number;
    createdAt: string;
  }>
) {
  const client = await pool.connect();
  try {
    await ensureStockTable(client);
    await ensureStockHistoryTable(client);
    await client.query("BEGIN");
    await client.query(`DELETE FROM stock_items`);
    for (const item of items) {
      await client.query(
        `INSERT INTO stock_items (
          id, code, name, brand, category, system, zone, status, qty, available, price_per_day, cost
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [item.id, item.code, item.name, item.brand, item.category, item.system,
         item.zone, item.status, item.qty, item.available, item.pricePerDay, item.cost]
      );
    }
    if (historyEntries && historyEntries.length > 0) {
      for (const h of historyEntries) {
        await client.query(
          `INSERT INTO stock_history (id, stock_id, stock_code, stock_name, field_name, change_type, old_value, new_value, delta, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [h.id, h.stockId, h.stockCode, h.stockName, h.fieldName, h.changeType, h.oldValue, h.newValue, h.delta, h.createdAt]
        );
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

// ดึงประวัติการเปลี่ยนจำนวน stock ล่าสุด ตาม limit ที่กำหนด
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
