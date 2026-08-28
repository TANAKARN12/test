(function () {
  const cfg = window.APP_CONFIG;

  const state = {
    rows: null,
    day: "1",
    parallelRoomChoice: {}, // { [slotKey]: roomName }
    view: "agenda", // agenda | documents | evaluation
    docModal: null, // fileId or null
    evalConfirmed: localStorage.getItem("welcomeHub.evalConfirmed") === "1",
  };

  const root = document.getElementById("app");

  // ---------------- helpers ----------------
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function driveFileMeta(fileId) {
    return {
      preview: `https://drive.google.com/file/d/${fileId}/preview`,
      view: `https://drive.google.com/file/d/${fileId}/view`,
      download: `https://drive.google.com/uc?export=download&id=${fileId}`,
    };
  }

  function typeLabel(type) {
    const map = {
      keynote: "ปาฐกถาพิเศษ",
      plenary: "ภาคบรรยายรวม",
      parallel: "ห้องย่อย",
      break: "พักรับประทาน",
      ceremony: "พิธีการ",
    };
    return map[type] || (type ? type : "กิจกรรม");
  }

  function badgeClass(type) {
    if (["keynote", "plenary", "parallel", "ceremony", "break"].includes(type)) {
      return `badge-${type}`;
    }
    return "badge-plenary";
  }

  // ---------------- grouping ----------------
  function groupDayIntoSlots(rows) {
    const dayRows = rows
      .filter((r) => r.day === state.day)
      .slice()
      .sort((a, b) => a.order - b.order || a.time.localeCompare(b.time));

    const slots = [];
    const bySlotKey = new Map();

    dayRows.forEach((r) => {
      const key = `${r.time}__${r.endTime}`;
      if (!bySlotKey.has(key)) {
        const slot = { key, items: [] };
        bySlotKey.set(key, slot);
        slots.push(slot);
      }
      bySlotKey.get(key).items.push(r);
    });

    return slots;
  }

  // ---------------- render: pass card ----------------
  function renderPass() {
    const e = cfg.event;
    const bars = Array.from({ length: 28 })
      .map(() => {
        const h = 8 + Math.round(Math.random() * 18);
        const w = Math.random() > 0.75 ? 3 : 2;
        return `<span style="height:${h}px;width:${w}px"></span>`;
      })
      .join("");

    return `
      <div class="pass-wrap">
        <div class="pass-card">
          <div class="pass-top">
            <div class="pass-logo">
              <img src="${cfg.branding.logoPath}" alt="โลโก้" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'" />
              <div class="fallback" style="display:none">${escapeHtml((e.org || "").slice(0, 2))}</div>
            </div>
            <div class="pass-org">
              <div class="eyebrow">Digital Pass</div>
              <div class="name">${escapeHtml(e.org)}</div>
            </div>
            <div class="pass-code">${escapeHtml(e.passCode)}</div>
          </div>
          <div class="pass-body">
            <div class="pass-title">${escapeHtml(e.name)}</div>
            <div class="pass-sub">${escapeHtml(e.venue)}</div>
            <div class="pass-stub">
              <div class="pass-field">
                <div class="k">วันที่จัดงาน</div>
                <div class="v">${escapeHtml(e.dates)}</div>
              </div>
              <div class="pass-barcode" aria-hidden="true">${bars}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ---------------- render: status bar ----------------
  function renderStatus(meta) {
    if (!meta) return "";
    const offline = meta.source === "cache" && meta.stale;
    const label =
      meta.source === "network"
        ? "ข้อมูลล่าสุด"
        : meta.source === "cache"
        ? "แสดงข้อมูลที่บันทึกไว้ (ออฟไลน์)"
        : "ไม่สามารถโหลดข้อมูลได้";
    return `
      <div class="status-bar">
        <span class="status-dot ${offline || meta.source === "error" ? "offline" : ""}"></span>
        <span>${label}</span>
      </div>
    `;
  }

  // ---------------- render: bottom nav ----------------
  function renderBottomNav() {
    const items = [
      { id: "agenda", ic: "🗓️", label: "กำหนดการ" },
      { id: "documents", ic: "📄", label: "เอกสาร" },
      { id: "evaluation", ic: "🎓", label: "ประเมิน/เกียรติบัตร" },
    ];
    return `
      <nav class="bottom-nav">
        ${items
          .map(
            (it) => `
          <button class="nav-btn ${state.view === it.id ? "active" : ""}" data-nav="${it.id}">
            <span class="ic">${it.ic}</span>
            <span>${it.label}</span>
          </button>
        `
          )
          .join("")}
      </nav>
    `;
  }

  // ---------------- render: agenda item ----------------
  function renderAgendaItem(item) {
    if (item.type === "break") {
      return `
        <div class="agenda-item type-break">
          <div class="agenda-time">${escapeHtml(item.time)}${item.endTime ? `<span class="end">${escapeHtml(item.endTime)}</span>` : ""}</div>
          <div class="agenda-main">
            <span class="agenda-badge ${badgeClass(item.type)}">${typeLabel(item.type)}</span>
            <div class="agenda-title">${escapeHtml(item.title)}</div>
          </div>
        </div>
      `;
    }
    const pdf = item.pdfFileId
      ? `<a class="agenda-pdf-link" href="${driveFileMeta(item.pdfFileId).view}" target="_blank" rel="noopener">📎 ดูเอกสารประกอบ</a>`
      : "";
    return `
      <div class="agenda-item">
        <div class="agenda-time">${escapeHtml(item.time)}${item.endTime ? `<span class="end">${escapeHtml(item.endTime)}</span>` : ""}</div>
        <div class="agenda-main">
          <span class="agenda-badge ${badgeClass(item.type)}">${typeLabel(item.type)}</span>
          <div class="agenda-title">${escapeHtml(item.title)}</div>
          ${item.speaker ? `<div class="agenda-speaker">${escapeHtml(item.speaker)}</div>` : ""}
          ${pdf}
        </div>
      </div>
    `;
  }

  // ---------------- render: parallel block ----------------
  function renderParallelBlock(slot) {
    const rooms = slot.items.map((i) => i.room || "ห้อง");
    const activeRoom = state.parallelRoomChoice[slot.key] || rooms[0];
    const active = slot.items.find((i) => (i.room || "ห้อง") === activeRoom) || slot.items[0];
    const pdf = active.pdfFileId
      ? `<a class="agenda-pdf-link" href="${driveFileMeta(active.pdfFileId).view}" target="_blank" rel="noopener">📎 ดูเอกสารประกอบ</a>`
      : "";

    return `
      <div class="parallel-block" data-slot="${slot.key}">
        <div class="parallel-head">
          <div class="agenda-time">${escapeHtml(active.time)}${active.endTime ? `<span class="end">${escapeHtml(active.endTime)}</span>` : ""}</div>
          <div class="subtabbar" style="padding:0; flex:1;">
            ${rooms
              .map(
                (r) => `
              <button class="subtab-btn ${r === activeRoom ? "active" : ""}" data-slot="${slot.key}" data-room="${escapeHtml(r)}">${escapeHtml(r)}</button>
            `
              )
              .join("")}
          </div>
        </div>
        <div class="parallel-body">
          <span class="agenda-badge ${badgeClass(active.type)}">${typeLabel(active.type)}</span>
          <div class="agenda-title">${escapeHtml(active.title)}</div>
          ${active.speaker ? `<div class="agenda-speaker">${escapeHtml(active.speaker)}</div>` : ""}
          ${pdf}
        </div>
      </div>
    `;
  }

  // ---------------- render: agenda view ----------------
  function renderAgendaView() {
    if (state.rows === null) {
      return `
        <div class="tabbar">
          <button class="tab-btn active">Day 1</button>
          <button class="tab-btn">Day 2</button>
        </div>
        <div class="agenda-list">
          ${Array.from({ length: 4 }).map(() => `<div class="skeleton"></div>`).join("")}
        </div>
      `;
    }

    const days = Array.from(new Set(state.rows.map((r) => r.day))).sort();
    const slots = groupDayIntoSlots(state.rows);

    if (slots.length === 0) {
      return `
        ${renderDayTabs(days)}
        <div class="empty-state">
          <div class="icon">🗓️</div>
          <div>ยังไม่มีกำหนดการสำหรับวันนี้</div>
        </div>
      `;
    }

    const body = slots
      .map((slot) => {
        if (slot.items.length > 1) return renderParallelBlock(slot);
        return renderAgendaItem(slot.items[0]);
      })
      .join("");

    return `
      ${renderDayTabs(days)}
      <div class="agenda-list">${body}</div>
    `;
  }

  function renderDayTabs(days) {
    const labels = { 1: "Day 1", 2: "Day 2" };
    return `
      <div class="tabbar">
        ${days
          .map(
            (d) => `
          <button class="tab-btn ${state.day === d ? "active" : ""}" data-day="${d}">${labels[d] || `Day ${d}`}</button>
        `
          )
          .join("")}
      </div>
    `;
  }

  // ---------------- render: documents view ----------------
  function renderDocumentsView() {
    if (state.rows === null) {
      return `<div class="agenda-list">${Array.from({ length: 4 }).map(() => `<div class="skeleton"></div>`).join("")}</div>`;
    }
    const docs = state.rows.filter((r) => r.pdfFileId);
    if (docs.length === 0) {
      return `
        <div class="empty-state">
          <div class="icon">📄</div>
          <div>ยังไม่มีเอกสารนำเสนอให้ดาวน์โหลด</div>
        </div>
      `;
    }
    const items = docs
      .map(
        (d) => `
        <div class="doc-item">
          <div class="doc-icon">PDF</div>
          <div class="doc-meta">
            <div class="doc-title">${escapeHtml(d.title)}</div>
            <div class="doc-sub">${escapeHtml(d.speaker || "")} · Day ${escapeHtml(d.day)}${d.room ? " · " + escapeHtml(d.room) : ""}</div>
          </div>
          <div class="doc-actions">
            <button class="icon-btn" data-preview="${escapeHtml(d.pdfFileId)}" title="ดูตัวอย่าง">👁️</button>
            <a class="icon-btn" href="${driveFileMeta(d.pdfFileId).download}" title="ดาวน์โหลด">⬇️</a>
          </div>
        </div>
      `
      )
      .join("");
    return `<div class="agenda-list">${items}</div>`;
  }

  // ---------------- render: evaluation view ----------------
  function renderEvaluationView() {
    const certBlock = state.evalConfirmed
      ? `
        <div class="cert-unlocked">
          <div class="seal">✓</div>
          <h3>ขอบคุณที่ร่วมประเมินผล</h3>
          <p>ท่านสามารถดาวน์โหลดเกียรติบัตรได้ทันที</p>
          <a class="btn-gold" href="${cfg.certificate.downloadUrl}" target="_blank" rel="noopener">${escapeHtml(cfg.certificate.label)}</a>
        </div>
      `
      : `
        <div class="eval-confirm">
          <p>เมื่อตอบแบบประเมินด้านบนเรียบร้อยแล้ว กดปุ่มด้านล่างเพื่อปลดล็อกเกียรติบัตร</p>
          <button class="btn-primary" id="confirmEvalBtn">✅ ฉันตอบแบบประเมินเรียบร้อยแล้ว</button>
        </div>
      `;

    return `
      <div class="eval-hero">
        <div class="eval-card">
          <div class="eval-card-head">
            <h2>แบบประเมินความพึงพอใจ</h2>
            <p>กรุณาตอบแบบประเมินให้ครบถ้วน เพื่อรับเกียรติบัตรอิเล็กทรอนิกส์</p>
          </div>
          <div class="eval-frame-wrap">
            <iframe class="eval-frame" src="${cfg.evaluation.formEmbedUrl}" title="แบบประเมิน">กำลังโหลด…</iframe>
          </div>
        </div>
      </div>
      ${certBlock}
    `;
  }

  // ---------------- render: doc modal ----------------
  function renderDocModal() {
    if (!state.docModal) return "";
    const meta = driveFileMeta(state.docModal);
    return `
      <div class="modal-overlay" id="modalOverlay">
        <div class="modal-sheet">
          <div class="modal-head">
            <h3>ตัวอย่างเอกสาร</h3>
            <button class="modal-close" id="modalCloseBtn">✕</button>
          </div>
          <div class="modal-body">
            <iframe src="${meta.preview}" allow="autoplay"></iframe>
          </div>
          <div class="modal-footer">
            <a class="btn-primary" style="display:block; text-align:center; text-decoration:none;" href="${meta.download}">⬇️ ดาวน์โหลดไฟล์</a>
          </div>
        </div>
      </div>
    `;
  }

  // ---------------- main render ----------------
  function render(meta) {
    let viewHtml = "";
    if (state.view === "agenda") viewHtml = renderAgendaView();
    else if (state.view === "documents") viewHtml = renderDocumentsView();
    else if (state.view === "evaluation") viewHtml = renderEvaluationView();

    root.innerHTML = `
      ${renderPass()}
      ${renderStatus(meta)}
      <div class="container">${viewHtml}</div>
      ${renderDocModal()}
      ${renderBottomNav()}
    `;

    bindEvents();
  }

  // ---------------- events ----------------
  function bindEvents() {
    root.querySelectorAll("[data-nav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.view = btn.getAttribute("data-nav");
        render(lastMeta);
      });
    });

    root.querySelectorAll("[data-day]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.day = btn.getAttribute("data-day");
        render(lastMeta);
      });
    });

    root.querySelectorAll("[data-slot][data-room]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const slot = btn.getAttribute("data-slot");
        const room = btn.getAttribute("data-room");
        state.parallelRoomChoice[slot] = room;
        render(lastMeta);
      });
    });

    root.querySelectorAll("[data-preview]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.docModal = btn.getAttribute("data-preview");
        render(lastMeta);
      });
    });

    const overlay = document.getElementById("modalOverlay");
    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          state.docModal = null;
          render(lastMeta);
        }
      });
    }
    const closeBtn = document.getElementById("modalCloseBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        state.docModal = null;
        render(lastMeta);
      });
    }

    const confirmBtn = document.getElementById("confirmEvalBtn");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        state.evalConfirmed = true;
        localStorage.setItem("welcomeHub.evalConfirmed", "1");
        render(lastMeta);
      });
    }
  }

  // ---------------- boot ----------------
  let lastMeta = null;
  render(null);

  window.SheetData.loadAgenda((rows, meta) => {
    lastMeta = meta;
    if (rows) state.rows = rows;
    render(meta);
  });
})();
