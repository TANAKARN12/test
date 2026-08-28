/**
 * sheet-data.js
 * ดึงข้อมูลจาก Google Sheet ที่ publish to web แล้ว ผ่าน Google Visualization API
 * ไม่ต้องใช้ API key และไม่ต้องมี backend
 *
 * โครงสร้างคอลัมน์ที่คาดหวังใน Sheet (แถวแรกเป็นหัวตาราง):
 *  Day | Order | Time | EndTime | Title | Speaker | Type | Room | PDFFileID
 *
 *  Day        : 1 หรือ 2
 *  Order      : ตัวเลขสำหรับเรียงลำดับ (เผื่อเวลาไม่เรียงตามตัวอักษร)
 *  Time/EndTime: เช่น "09:00", "10:30"
 *  Type       : keynote | plenary | parallel | break | ceremony (พิมพ์เล็ก/ใหญ่ไม่สำคัญ)
 *               รายการที่มี Type = parallel และมี Time ตรงกันหลายแถว
 *               จะถูกจัดกลุ่มเป็นแท็บย่อยตามห้อง (Room) โดยอัตโนมัติ
 *  Room       : ชื่อ/หมายเลขห้อง เช่น "ห้อง A" (จำเป็นเมื่อ Type = parallel)
 *  PDFFileID  : Google Drive File ID ของเอกสารนำเสนอ (เว้นว่างได้ถ้าไม่มี)
 */

const CACHE_KEY = "welcomeHub.agendaCache.v1";
const CACHE_TTL_MS = 5 * 60 * 1000; // cache สด 5 นาที ก่อน refetch พื้นหลัง

function buildGvizUrl() {
  const { id, tabName } = window.APP_CONFIG.sheet;
  const encodedTab = encodeURIComponent(tabName);
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&sheet=${encodedTab}`;
}

function parseGvizResponse(text) {
  // การตอบกลับห่อด้วย: google.visualization.Query.setResponse({...});
  const match = text.match(/setResponse\(([\s\S]*)\);?\s*$/);
  if (!match) throw new Error("รูปแบบข้อมูลจาก Google Sheet ไม่ถูกต้อง");
  const json = JSON.parse(match[1]);
  const cols = json.table.cols.map((c) => (c.label || c.id || "").trim());
  const rows = json.table.rows || [];

  return rows
    .map((r) => {
      const obj = {};
      cols.forEach((colName, i) => {
        const cell = r.c[i];
        obj[colName] = cell ? (cell.f ?? cell.v ?? "") : "";
      });
      return obj;
    })
    .filter((row) => row.Time || row.Title); // ตัดแถวว่างทิ้ง
}

function normalizeRow(row) {
  return {
    day: String(row.Day || "1").trim(),
    order: Number(row.Order) || 0,
    time: String(row.Time || "").trim(),
    endTime: String(row.EndTime || "").trim(),
    title: String(row.Title || "").trim(),
    speaker: String(row.Speaker || "").trim(),
    type: String(row.Type || "").trim().toLowerCase(),
    room: String(row.Room || "").trim(),
    pdfFileId: String(row.PDFFileID || "").trim(),
  };
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(rows) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), rows })
    );
  } catch {
    /* localStorage อาจเต็มหรือถูกปิด — ข้ามได้ ไม่ critical */
  }
}

/**
 * ดึงข้อมูลกำหนดการ — คืนค่าจาก cache ทันทีถ้ามี (ให้เปิดแอปได้แบบออฟไลน์/เร็ว)
 * แล้วค่อย refetch จากเน็ตแบบพื้นหลังถ้า cache หมดอายุหรือไม่มี
 * @param {(rows: object[]) => void} onUpdate เรียกทุกครั้งที่มีข้อมูลใหม่ (cache หรือ network)
 */
async function loadAgenda(onUpdate) {
  const cached = readCache();
  let servedFromCache = false;

  if (cached && Array.isArray(cached.rows)) {
    onUpdate(cached.rows, { source: "cache", stale: Date.now() - cached.savedAt > CACHE_TTL_MS });
    servedFromCache = true;
  }

  try {
    const res = await fetch(buildGvizUrl(), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const rows = parseGvizResponse(text).map(normalizeRow);
    writeCache(rows);
    onUpdate(rows, { source: "network", stale: false });
  } catch (err) {
    if (!servedFromCache) {
      onUpdate(null, { source: "error", error: err });
    }
    // ถ้ามี cache แสดงอยู่แล้ว ก็ปล่อยผ่านเงียบๆ ไม่ต้อง block ผู้ใช้
    console.warn("โหลดข้อมูลจาก Google Sheet ไม่สำเร็จ:", err);
  }
}

window.SheetData = { loadAgenda };
