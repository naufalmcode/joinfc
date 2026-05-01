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
      "Tanggal Daftar": new Date(r.createdAt).toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, event.title.slice(0, 31));
    return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  }

  async generateJerseyReport(launchId: string, columns?: string[]): Promise<Buffer> {
    const launch = await this.jerseyRepo.findById(launchId);
    if (!launch) throw new Error("Jersey launch not found");
    const regs = launch.registrations;

    type Reg = typeof regs[number];
    const allColumns: Record<string, (r: Reg, i: number) => unknown> = {
      no: (r, i) => i + 1,
      registrantName: (r) => r.registrantName || "-",
      name: (r) => r.name,
      phone: (r) => r.phone,
      number: (r) => r.number,
      size: (r) => r.size,
      shirtSize: (r) => r.shirtSize || "-",
      jerseyType: (r) => r.jerseyType,
      itemType: (r) => r.itemType,
      totalPrice: (r) => r.totalPrice,
      paymentStatus: (r) => r.paymentStatus || "registered",
      createdAt: (r) => new Date(r.createdAt).toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }),
    };

    const colLabels: Record<string, string> = {
      no: "No",
      registrantName: "Pendaftar",
      name: "Nama Jersey",
      phone: "Telepon",
      number: "Nomor Jersey",
      size: "Ukuran",
      shirtSize: "Ukuran Baju",
      jerseyType: "Tipe",
      itemType: "Item",
      totalPrice: "Harga",
      paymentStatus: "Status",
      createdAt: "Tanggal Daftar",
    };

    const selected = columns && columns.length > 0 ? columns : Object.keys(allColumns);

    const data = regs.map((r, i) => {
      const row: Record<string, unknown> = {};
      for (const col of selected) {
        const fn = allColumns[col];
        if (fn) row[colLabels[col] || col] = fn(r, i);
      }
      return row;
    });

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
        "Tanggal Daftar": new Date(r.createdAt).toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }),
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
