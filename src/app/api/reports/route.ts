import { NextRequest } from "next/server";
import { reportService } from "@/lib/container";
import { validateAdminSession } from "@/lib/auth";
import { errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  try {
    let buffer: Buffer;
    let filename: string;

    if (type === "event" && id) {
      buffer = await reportService.generateEventReport(id);
      filename = `event-report-${id}.xlsx`;
    } else if (type === "jersey" && id) {
      const columns = searchParams.get("columns")?.split(",").filter(Boolean);
      buffer = await reportService.generateJerseyReport(id, columns);
      filename = `jersey-report-${id}.xlsx`;
    } else if (type === "all-events") {
      buffer = await reportService.generateAllEventsReport();
      filename = "all-events-report.xlsx";
    } else {
      return errorResponse("Invalid report type. Use type=event&id=xxx, type=jersey&id=xxx, or type=all-events");
    }

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Report generation failed";
    return errorResponse(message);
  }
}
