import * as XLSX from "xlsx";
import type { IReportService } from "@/lib/interfaces/service.interfaces";
import type { IEventRepository, IJerseyLaunchRepository } from "@/lib/interfaces/repository.interfaces";

export class ReportService implements IReportService {
  constructor(
    private readonly eventRepo: IEventRepository,
    private readonly jerseyRepo: IJerseyLaunchRepository
  ) {}

  async generateEventReport(eventId: string): Promise<Buffer> {
    const event = await this.eventRepo.findById(eventId);
    if (!event) throw new Error("Event not found");

    const data = event.registrations.map((r, i) => ({
      No: i + 1,
      Nama: r.name,
      Telepon: r.phone,
      Posisi: r.position === "goalkeeper" ? "Kiper" : "Pemain",
      Status: r.status === "confirmed" ? "Confirmed" : "Waiting List",
      "Tanggal Daftar": new Date(r.createdAt).toLocaleDateString("id-ID"),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, event.title.slice(0, 31));
    return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  }

  async generateJerseyReport(launchId: string): Promise<Buffer> {
    const launch = await this.jerseyRepo.findById(launchId);
    if (!launch) throw new Error("Jersey launch not found");

    const data = launch.registrations.map((r, i) => ({
      No: i + 1,
      Pendaftar: r.registrantName || "-",
      "Nama Jersey": r.name,
      "Nomor Jersey": r.number,
      Ukuran: r.size,
      "Ukuran Baju": r.shirtSize || "-",
      Item: r.itemType,
      Harga: r.totalPrice,
      "Tanggal Daftar": new Date(r.createdAt).toLocaleDateString("id-ID"),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, launch.title.slice(0, 31));
    return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  }

  async generateAllEventsReport(): Promise<Buffer> {
    const events = await this.eventRepo.findAll();
    const wb = XLSX.utils.book_new();

    for (const event of events) {
      const data = event.registrations.map((r, i) => ({
        No: i + 1,
        Nama: r.name,
        Telepon: r.phone,
        Posisi: r.position === "goalkeeper" ? "Kiper" : "Pemain",
        Status: r.status === "confirmed" ? "Confirmed" : "Waiting List",
        "Tanggal Daftar": new Date(r.createdAt).toLocaleDateString("id-ID"),
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const sheetName = event.title.slice(0, 31).replace(/[\\/*?[\]]/g, "");
      XLSX.utils.book_append_sheet(wb, ws, sheetName || "Event");
    }

    if (wb.SheetNames.length === 0) {
      const ws = XLSX.utils.json_to_sheet([]);
      XLSX.utils.book_append_sheet(wb, ws, "No Data");
    }

    return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  }
}
