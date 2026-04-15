import { prisma } from "@/lib/db/prisma";
import type { Event, EventRegistration } from "@prisma/client";
import type {
  IEventRepository,
  IEventRegistrationRepository,
  EventWithRegistrations,
} from "@/lib/interfaces/repository.interfaces";

export class EventRepository implements IEventRepository {
  async findAll(): Promise<EventWithRegistrations[]> {
    return prisma.event.findMany({
      include: { registrations: { orderBy: { createdAt: "asc" } } },
      orderBy: { eventDate: "desc" },
    });
  }

  async findOpen(): Promise<EventWithRegistrations[]> {
    return prisma.event.findMany({
      where: { status: "open" },
      include: { registrations: { orderBy: { createdAt: "asc" } } },
      orderBy: { eventDate: "asc" },
    });
  }

  async findById(id: string): Promise<EventWithRegistrations | null> {
    return prisma.event.findUnique({
      where: { id },
      include: { registrations: { orderBy: { createdAt: "asc" } } },
    });
  }

  async create(data: Omit<Event, "id" | "createdAt" | "updatedAt">): Promise<Event> {
    return prisma.event.create({ data });
  }

  async update(id: string, data: Partial<Event>): Promise<Event> {
    return prisma.event.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.event.delete({ where: { id } });
  }
}

export class EventRegistrationRepository implements IEventRegistrationRepository {
  async findByEventId(eventId: string): Promise<EventRegistration[]> {
    return prisma.eventRegistration.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
    });
  }

  async create(data: Omit<EventRegistration, "id" | "createdAt">): Promise<EventRegistration> {
    return prisma.eventRegistration.create({ data });
  }

  async update(id: string, data: Partial<EventRegistration>): Promise<EventRegistration> {
    return prisma.eventRegistration.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.eventRegistration.delete({ where: { id } });
  }

  async countByEventIdAndPosition(eventId: string, position: string): Promise<number> {
    return prisma.eventRegistration.count({
      where: { eventId, position, status: { in: ["registered", "confirmed"] } },
    });
  }
}
