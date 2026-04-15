import { prisma } from "@/lib/db/prisma";
import type { CalendarSchedule } from "@prisma/client";
import type { ICalendarRepository } from "@/lib/interfaces/repository.interfaces";

export class CalendarRepository implements ICalendarRepository {
  async findAll(): Promise<CalendarSchedule[]> {
    return prisma.calendarSchedule.findMany({ orderBy: { eventDate: "asc" } });
  }

  async findUpcoming(): Promise<CalendarSchedule[]> {
    return prisma.calendarSchedule.findMany({
      where: { eventDate: { gte: new Date() } },
      orderBy: { eventDate: "asc" },
    });
  }

  async findById(id: string): Promise<CalendarSchedule | null> {
    return prisma.calendarSchedule.findUnique({ where: { id } });
  }

  async create(data: Omit<CalendarSchedule, "id" | "createdAt" | "updatedAt">): Promise<CalendarSchedule> {
    return prisma.calendarSchedule.create({ data });
  }

  async update(id: string, data: Partial<CalendarSchedule>): Promise<CalendarSchedule> {
    return prisma.calendarSchedule.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.calendarSchedule.delete({ where: { id } });
  }
}
