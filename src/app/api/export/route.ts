import { withErrors } from "@/lib/api";
import { buildWorkbook } from "@/lib/export";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Downloads everything as a formatted Excel workbook. */
export const GET = withErrors(async () => {
  const { buffer, filename } = await buildWorkbook();
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
});
