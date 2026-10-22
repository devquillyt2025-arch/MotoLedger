import ExcelJS from "exceljs";
import { analyse } from "./analysis";
import { FUEL_PRICE_PER_LITRE } from "./constants";
import { getReminders, listEntries, listOdometerLogs } from "./data";
import { todayIST } from "./format";
import { getCurrentProfile } from "./profile";

// Palette matches the app: zinc ink, emerald accent.
const INK = "FF18181B";
const ACCENT = "FF10B981";
const BAND = "FFF4F4F5";
const MUTED = "FF71717A";
const RED = "FFDC2626";
const AMBER = "FFD97706";
const GREEN = "FF059669";

const RUPEE = '"₹"#,##0.00';
const RUPEE_INT = '"₹"#,##0';
const DATE = "dd mmm yyyy";
const KM = '#,##0" km"';

const thin = { style: "thin" as const, color: { argb: "FFE4E4E7" } };
const border = { top: thin, bottom: thin, left: thin, right: thin };

/** Excel wants real dates; parse YYYY-MM-DD as UTC midnight so no timezone shifts the day. */
const xlDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

type Col = { header: string; key: string; width: number; fmt?: string; align?: "left" | "right" | "center" };

/**
 * A titled table: big title row, subtitle, then a styled header with filters, banded rows,
 * frozen panes and an optional SUM totals row.
 */
function table(
  wb: ExcelJS.Workbook,
  name: string,
  title: string,
  subtitle: string,
  cols: Col[],
  rows: Record<string, unknown>[],
  totals?: { label: string; sum: string[] },
) {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 4, showGridLines: false }] });
  // +4 leaves room for the filter dropdown arrow so it never covers the heading.
  ws.columns = cols.map((c) => ({ key: c.key, width: Math.max(c.width, c.header.length + 2) + 4 }));
  const last = String.fromCharCode(64 + cols.length);

  ws.mergeCells(`A1:${last}1`);
  Object.assign(ws.getCell("A1"), { value: title });
  ws.getCell("A1").font = { size: 16, bold: true, color: { argb: INK } };
  ws.getRow(1).height = 26;
  ws.mergeCells(`A2:${last}2`);
  ws.getCell("A2").value = subtitle;
  ws.getCell("A2").font = { size: 10, color: { argb: MUTED } };

  const header = ws.getRow(4);
  cols.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } };
    cell.alignment = { vertical: "middle", horizontal: c.fmt || c.align ? "center" : "left", indent: c.fmt || c.align ? 0 : 1 };
    cell.border = border;
  });
  header.height = 24;

  rows.forEach((r, i) => {
    const row = ws.getRow(5 + i);
    cols.forEach((c, j) => {
      const cell = row.getCell(j + 1);
      cell.value = (r[c.key] ?? null) as ExcelJS.CellValue;
      if (c.fmt) cell.numFmt = c.fmt;
      cell.alignment = { vertical: "middle", horizontal: c.align ?? (c.fmt ? "right" : "left"), wrapText: !c.fmt };
      cell.border = border;
      if (i % 2) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BAND } };
    });
  });

  if (rows.length) ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + rows.length, column: cols.length } };

  if (totals && rows.length) {
    const r = ws.getRow(5 + rows.length);
    r.getCell(1).value = totals.label;
    cols.forEach((c, j) => {
      const cell = r.getCell(j + 1);
      if (totals.sum.includes(c.key)) {
        const col = String.fromCharCode(65 + j);
        cell.value = { formula: `SUBTOTAL(109,${col}5:${col}${4 + rows.length})` };
        cell.numFmt = c.fmt ?? "";
        cell.alignment = { horizontal: "right" };
      }
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
      cell.border = { ...border, top: { style: "medium", color: { argb: ACCENT } } };
    });
  }
  return ws;
}

export async function buildWorkbook() {
  const [entries, { reminders, currentOdometer }, odometer, profile] = await Promise.all([
    listEntries(),
    getReminders(),
    listOdometerLogs(10_000),
    getCurrentProfile(),
  ]);
  const a = analyse(entries);
  const today = todayIST();

  const wb = new ExcelJS.Workbook();
  wb.creator = "Moto Ledger";
  wb.created = new Date();

  // ---- Summary ----
  const ws = wb.addWorksheet("Summary", { views: [{ showGridLines: false }] });
  ws.columns = [{ width: 30 }, { width: 22 }, { width: 4 }, { width: 30 }, { width: 22 }];
  ws.mergeCells("A1:E1");
  ws.getCell("A1").value = "Moto Ledger";
  ws.getCell("A1").font = { size: 22, bold: true, color: { argb: ACCENT } };
  ws.getRow(1).height = 32;
  ws.mergeCells("A2:E2");
  ws.getCell("A2").value = `${profile.name} · ${profile.bike} · exported ${xlDate(today).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}`;
  ws.getCell("A2").font = { size: 10, color: { argb: MUTED } };

  const block = (startRow: number, col: 1 | 4, heading: string, items: [string, ExcelJS.CellValue, string?][]) => {
    const h = ws.getCell(startRow, col);
    h.value = heading.toUpperCase();
    h.font = { bold: true, size: 10, color: { argb: MUTED } };
    ws.getCell(startRow, col).border = { bottom: { style: "medium", color: { argb: ACCENT } } };
    ws.getCell(startRow, col + 1).border = { bottom: { style: "medium", color: { argb: ACCENT } } };
    items.forEach(([label, value, fmt], i) => {
      const r = startRow + 1 + i;
      ws.getCell(r, col).value = label;
      ws.getCell(r, col).font = { color: { argb: INK } };
      const v = ws.getCell(r, col + 1);
      v.value = value ?? "—";
      v.font = { bold: true };
      v.alignment = { horizontal: "right" };
      if (fmt) v.numFmt = fmt;
      [ws.getCell(r, col), v].forEach((c) => (c.border = { bottom: thin }));
    });
  };

  block(4, 1, "Spend", [
    ["Total fuel spend", a.totals.fuel, RUPEE],
    ["Total service spend", a.totals.service, RUPEE],
    ["Accessories", a.totals.accessory, RUPEE],
    ["Total bike spend", a.totals.total, RUPEE],
    ["Fuel per month (pace)", Math.round(a.fuelPerMonth), RUPEE_INT],
    ["Fuel per year (pace)", Math.round(a.fuelPerYear), RUPEE_INT],
  ]);
  block(4, 4, "Refuels", [
    ["Refuels", a.refills.length],
    ["Average refill", a.avgRefill, RUPEE],
    ["Usual refill", a.modeAmount, RUPEE],
    ["Est. fuel bought", Number((a.totals.fuel / FUEL_PRICE_PER_LITRE).toFixed(1)), '0.0" L"'],
    ["Average gap", a.avgGapDays != null ? Number(a.avgGapDays.toFixed(1)) : null, '0.0" days"'],
    ["Days since last refill", a.daysSinceLastRefill, '0" days"'],
  ]);
  block(12, 1, "Bike", [
    ["Current odometer", currentOdometer, KM],
    ["Fuel price used", FUEL_PRICE_PER_LITRE, '"₹"0"/L"'],
    ["Entries logged", entries.length],
  ]);
  block(12, 4, "Spend split", a.split.map((s) => [s.label, s.share, "0.0%"] as [string, number, string]));

  // ---- Refuels ----
  const refuels = entries.filter((e) => e.type === "refuel").reverse();
  table(
    wb,
    "Refuels",
    "Refuel Log",
    `${refuels.length} refills · litres estimated at ₹${FUEL_PRICE_PER_LITRE}/L · newest first`,
    [
      { header: "#", key: "seq", width: 6, align: "center" },
      { header: "Date", key: "date", width: 14, fmt: DATE },
      { header: "Amount", key: "amount", width: 14, fmt: RUPEE },
      { header: "≈ Litres", key: "litres", width: 10, fmt: "0.0" },
      { header: "Running total", key: "runningTotal", width: 16, fmt: RUPEE },
      { header: "Odometer", key: "odometer", width: 13, fmt: KM },
      { header: "Category", key: "category", width: 18 },
      { header: "Notes", key: "notes", width: 34 },
    ],
    refuels.map((r) => ({
      seq: r.seq,
      date: xlDate(r.date),
      amount: r.amount,
      litres: Number((r.amount / FUEL_PRICE_PER_LITRE).toFixed(2)),
      runningTotal: r.runningTotal,
      odometer: r.odometer,
      category: r.category,
      notes: r.notes,
    })),
    { label: "Total", sum: ["amount", "litres"] },
  );

  // ---- Service & Parts ----
  const others = entries.filter((e) => e.type !== "refuel").reverse();
  table(
    wb,
    "Service & Parts",
    "Service & Parts",
    `${others.length} entries · servicing, repairs and accessories`,
    [
      { header: "Date", key: "date", width: 14, fmt: DATE },
      { header: "Type", key: "type", width: 12 },
      { header: "Category", key: "category", width: 20 },
      { header: "Amount", key: "amount", width: 14, fmt: RUPEE },
      { header: "Odometer", key: "odometer", width: 13, fmt: KM },
      { header: "Notes", key: "notes", width: 40 },
    ],
    others.map((e) => ({
      date: xlDate(e.date),
      type: e.type === "service" ? "Service" : "Accessory",
      category: e.category,
      amount: e.amount,
      odometer: e.odometer,
      notes: e.notes,
    })),
    { label: "Total", sum: ["amount"] },
  );

  // ---- Monthly ----
  table(
    wb,
    "Monthly",
    "Monthly Spend",
    "Calendar months from your first entry",
    [
      { header: "Month", key: "month", width: 14 },
      { header: "Fuel", key: "fuel", width: 14, fmt: RUPEE },
      { header: "Service", key: "service", width: 14, fmt: RUPEE },
      { header: "Accessories", key: "accessory", width: 14, fmt: RUPEE },
      { header: "Total", key: "total", width: 15, fmt: RUPEE },
      { header: "Refills", key: "refuels", width: 10, fmt: "0" },
    ],
    a.months.map((m) => ({
      month: m.long,
      fuel: m.fuel,
      service: m.service,
      accessory: m.accessory,
      total: m.fuel + m.service + m.accessory,
      refuels: m.refuels,
    })),
    { label: "Total", sum: ["fuel", "service", "accessory", "total", "refuels"] },
  );

  // ---- Reminders ----
  const rs = table(
    wb,
    "Reminders",
    "Maintenance Reminders",
    `Status as of export · current odometer ${currentOdometer != null ? `${currentOdometer.toLocaleString("en-IN")} km` : "not logged"}`,
    [
      { header: "Reminder", key: "label", width: 20 },
      { header: "Status", key: "status", width: 11, align: "center" },
      { header: "Every (km)", key: "intervalKm", width: 12, fmt: "#,##0" },
      { header: "Every (days)", key: "intervalDays", width: 12, fmt: "0" },
      { header: "Last done", key: "last", width: 14, fmt: DATE },
      { header: "Next due", key: "next", width: 14, fmt: DATE },
      { header: "Days left", key: "daysLeft", width: 11, fmt: "0" },
      { header: "Km left", key: "kmLeft", width: 11, fmt: "#,##0" },
    ],
    reminders.map((r) => ({
      label: r.label,
      status: r.status === "overdue" ? "Overdue" : r.status === "upcoming" ? "Due soon" : "OK",
      intervalKm: r.intervalKm,
      intervalDays: r.intervalDays,
      last: xlDate(r.lastDoneDate),
      next: r.nextDueDate ? xlDate(r.nextDueDate) : null,
      daysLeft: r.daysLeft,
      kmLeft: r.kmLeft,
    })),
  );
  reminders.forEach((r, i) => {
    const cell = rs.getCell(5 + i, 2);
    cell.font = { bold: true, color: { argb: r.status === "overdue" ? RED : r.status === "upcoming" ? AMBER : GREEN } };
  });

  // ---- Odometer ----
  table(
    wb,
    "Odometer",
    "Odometer Readings",
    "Standalone readings (refuel/service odometer values are on their own sheets)",
    [
      { header: "Date", key: "date", width: 14, fmt: DATE },
      { header: "Reading", key: "km", width: 14, fmt: KM },
    ],
    odometer.map((o) => ({ date: xlDate(o.date), km: o.km })),
  );

  return { buffer: await wb.xlsx.writeBuffer(), filename: `moto-ledger-${profile.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "profile"}-${today}.xlsx` };
}
