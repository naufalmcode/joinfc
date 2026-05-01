import { prisma, jakartaNow } from "@/lib/db/prisma";
import type { JerseyLaunch, JerseyRegistration } from "@prisma/client";
import type {
  IJerseyLaunchRepository,
  IJerseyRegistrationRepository,
  JerseyLaunchWithRegistrations,
  JerseyLaunchSummary,
} from "@/lib/interfaces/repository.interfaces";

export class JerseyLaunchRepository implements IJerseyLaunchRepository {
  async findAll(): Promise<JerseyLaunchWithRegistrations[]> {
    return prisma.jerseyLaunch.findMany({
      include: { registrations: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findAllSummary(): Promise<JerseyLaunchSummary[]> {
    return prisma.jerseyLaunch.findMany({
      include: { _count: { select: { registrations: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOpen(): Promise<JerseyLaunchWithRegistrations[]> {
    return prisma.jerseyLaunch.findMany({
      where: { status: "open", isVisible: true },
      include: { registrations: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<JerseyLaunchWithRegistrations | null> {
    return prisma.jerseyLaunch.findUnique({
      where: { id },
      include: { registrations: { orderBy: { createdAt: "asc" } } },
    });
  }

  async findBySlug(slug: string): Promise<JerseyLaunchWithRegistrations | null> {
    return prisma.jerseyLaunch.findUnique({
      where: { slug },
      include: { registrations: { orderBy: { createdAt: "asc" } } },
    });
  }

  async create(data: Omit<JerseyLaunch, "id" | "createdAt" | "updatedAt">): Promise<JerseyLaunch> {
    return prisma.jerseyLaunch.create({ data: { ...data, createdAt: jakartaNow() } });
  }

  async update(id: string, data: Partial<JerseyLaunch>): Promise<JerseyLaunch> {
    return prisma.jerseyLaunch.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.jerseyLaunch.delete({ where: { id } });
  }
}

export class JerseyRegistrationRepository implements IJerseyRegistrationRepository {
  async findByLaunchId(launchId: string): Promise<JerseyRegistration[]> {
    return prisma.jerseyRegistration.findMany({
      where: { jerseyLaunchId: launchId },
      orderBy: { createdAt: "asc" },
    });
  }

  async findTakenNumbers(launchId: string): Promise<number[]> {
    const regs = await prisma.jerseyRegistration.findMany({
      where: { jerseyLaunchId: launchId },
      select: { number: true },
    });
    return regs.map((r) => r.number);
  }

  async create(data: Omit<JerseyRegistration, "id" | "createdAt">): Promise<JerseyRegistration> {
    return prisma.jerseyRegistration.create({ data: { ...data, createdAt: jakartaNow() } });
  }

  async update(id: string, data: Partial<JerseyRegistration>): Promise<JerseyRegistration> {
    return prisma.jerseyRegistration.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.jerseyRegistration.delete({ where: { id } });
  }
}
