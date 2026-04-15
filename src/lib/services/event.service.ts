import type { Event, EventRegistration } from "@prisma/client";
import type { IEventService } from "@/lib/interfaces/service.interfaces";
import type { IEventRepository, IEventRegistrationRepository, EventWithRegistrations } from "@/lib/interfaces/repository.interfaces";

export class EventService implements IEventService {
  constructor(
    private readonly eventRepo: IEventRepository,
    private readonly registrationRepo: IEventRegistrationRepository
  ) {}

  async getAll(): Promise<EventWithRegistrations[]> {
    return this.eventRepo.findAll();
  }

  async getOpen(): Promise<EventWithRegistrations[]> {
    return this.eventRepo.findOpen();
  }

  async getById(id: string): Promise<EventWithRegistrations | null> {
    return this.eventRepo.findById(id);
  }

  async create(data: {
    title: string;
    description?: string;
    location: string;
    locationUrl?: string;
    eventDate: Date;
    bankAccount: string;
    maxPlayers: number;
    maxGoalkeepers: number;
  }): Promise<Event> {
    return this.eventRepo.create({
      title: data.title,
      description: data.description ?? null,
      location: data.location,
      locationUrl: data.locationUrl ?? null,
      eventDate: data.eventDate,
      bankAccount: data.bankAccount,
      maxPlayers: data.maxPlayers,
      maxGoalkeepers: data.maxGoalkeepers,
      status: "open",
    });
  }

  async update(id: string, data: Partial<Event>): Promise<Event> {
    return this.eventRepo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.eventRepo.delete(id);
  }

  async register(
    eventId: string,
    data: { name: string; phone: string; position: string }
  ): Promise<{ registration: EventRegistration; status: "registered" | "waiting" }> {
    const event = await this.eventRepo.findById(eventId);
    if (!event) throw new Error("Event not found");
    if (event.status !== "open") throw new Error("Event is closed");

    const position = data.position === "goalkeeper" ? "goalkeeper" : "player";

    const currentCount = await this.registrationRepo.countByEventIdAndPosition(eventId, position);
    const maxSlots = position === "goalkeeper" ? event.maxGoalkeepers : event.maxPlayers;
    const status = currentCount >= maxSlots ? "waiting" : "registered";

    const registration = await this.registrationRepo.create({
      eventId,
      name: data.name,
      phone: data.phone,
      position,
      status,
    });

    return { registration, status };
  }

  async updateRegistration(id: string, data: { status?: string; position?: string }): Promise<EventRegistration> {
    return this.registrationRepo.update(id, data);
  }

  async removeRegistration(id: string): Promise<void> {
    return this.registrationRepo.delete(id);
  }
}
