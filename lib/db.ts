"use server";

import { Pool, PoolClient, QueryResult } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/postgres";

const pool = new Pool({
  connectionString,
  ssl:
    process.env.PGSSLMODE === "disable"
      ? false
      : process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
});

export type NotificationRow = {
  id: string;
  title: string;
  message: string;
  audience: string[];
  unread_for: string[];
  created_at: string;
};

export type EventStatusTone = "success" | "pending" | "progress" | "rejected";
export type EventLifecycleStatus = "ready" | "inuse" | "returned";

export type EventEquipmentRow = {
  name: string;
  qty: number;
  available: number;
  category: string;
  pricePerDayTHB: number;
};

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

// ✅ Type สำหรับประวัติการแก้ไขอุปกรณ์ใน Event
export type EquipmentHistoryRow = {
  id: string;
  event_id: string;
  action: "เพิ่ม" | "ลบ";
  equipment_name: string;
  qty: number;
  changed_at: string;
};

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

// ✅ Table สำหรับประวัติการแก้ไขอุปกรณ์ใน Event
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

// ✅ บันทึกประวัติการแก้ไขอุปกรณ์ใน Event
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

// ✅ ดึงประวัติการแก้ไขอุปกรณ์ของ Event
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
