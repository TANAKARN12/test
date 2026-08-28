/**
 * ============================================================
 *  CONFIG — แก้ไขเฉพาะไฟล์นี้ไฟล์เดียวเพื่อปรับข้อมูลงาน
 * ============================================================
 */
window.APP_CONFIG = {

  // ---- ข้อมูลงาน (แสดงบนบัตร Digital Pass) ----
  event: {
    name: "งานประชุมวิชาการและ AGM 2026",
    nameEn: "2026 Academic Conference & AGM",
    org: "สภาวิชาชีพสังคมสงเคราะห์",
    orgEn: "Social Work Professions Council",
    dates: "26–27 พฤศจิกายน 2569",
    venue: "โรงแรม (ระบุชื่อสถานที่จัดงาน)",
    passCode: "SWPC-CONF-2026", // รหัสอ้างอิงที่พิมพ์บนบัตร (ตกแต่งเท่านั้น ไม่ผูก logic)
  },

  // ---- Google Sheet (เผยแพร่สู่เว็บแล้ว / Publish to web) ----
  // วิธีหา SHEET_ID: จาก URL ของ Google Sheet
  // https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
  sheet: {
    id: "1AbCDeFGhIjKLmnOPQRstuVWXyz0000000000000", // TODO: ใส่ Sheet ID จริง
    tabName: "Agenda", // ชื่อชีตที่เก็บกำหนดการ (ต้อง publish to web ด้วย)
  },

  // ---- Google Drive (สำหรับไฟล์ PDF นำเสนอ) ----
  // ไฟล์ทุกไฟล์ต้องแชร์แบบ "Anyone with the link – Viewer"
  // ใน Sheet ใส่แค่ FILE_ID ของแต่ละไฟล์ (จาก URL ของไฟล์ใน Drive)
  drive: {
    // ใช้สำหรับสร้างลิงก์ preview / download จาก FILE_ID โดยอัตโนมัติ — ไม่ต้องแก้ตรงนี้
  },

  // ---- แบบประเมิน (Google Form) ----
  evaluation: {
    // ใช้ลิงก์แบบฟอร์ม แล้วเติม ?embedded=true ต่อท้าย
    formEmbedUrl: "https://docs.google.com/forms/d/e/1FAIpQLSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/viewform?embedded=true",
    formFullUrl: "https://docs.google.com/forms/d/e/1FAIpQLSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/viewform",
  },

  // ---- เกียรติบัตร (E-Certificate) ----
  certificate: {
    // ลิงก์ดาวน์โหลดเกียรติบัตร (ไฟล์เดียวสำหรับทุกคน หรือโฟลเดอร์ Drive)
    downloadUrl: "https://drive.google.com/drive/folders/1xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    label: "ดาวน์โหลดเกียรติบัตร (E-Certificate)",
  },

  // ---- แบรนด์สภาวิชาชีพ ----
  branding: {
    logoPath: "icons/logo.png", // วางไฟล์โลโก้ไว้ในโฟลเดอร์ icons/
  },
};
