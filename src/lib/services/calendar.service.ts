import type { CalendarSchedule } from "@prisma/client";
import type { ICalendarService } from "@/lib/interfaces/service.interfaces";
import type { ICalendarRepository } from "@/lib/interfaces/repository.interfaces";

export class CalendarService implements ICalendarService {
  constructor(private readonly repository: ICalendarRepository) {}

  async getAll(): Promise<CalendarSchedule[]> {
    return this.repository.findAll();
  }

  async getUpcoming(): Promise<CalendarSchedule[]> {
    return this.repository.findUpcoming();
  }

  async create(data: { title: string; description?: string; eventDate: Date; location?: string }): Promise<CalendarSchedule> {
    return this.repository.create({
      title: data.title,
      description: data.description ?? null,
      eventDate: data.eventDate,
      location: data.location ?? null,
    });
  }

  async update(id: string, data: Partial<CalendarSchedule>): Promise<CalendarSchedule> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
