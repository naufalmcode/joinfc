import { prisma } from "@/lib/db/prisma";
import type { Highlight } from "@prisma/client";
import type { IHighlightRepository } from "@/lib/interfaces/repository.interfaces";

export class HighlightRepository implements IHighlightRepository {
  async findAll(): Promise<Highlight[]> {
    return prisma.highlight.findMany({ orderBy: { sortOrder: "asc" } });
  }

  async findActive(): Promise<Highlight[]> {
    return prisma.highlight.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<Highlight | null> {
    return prisma.highlight.findUnique({ where: { id } });
  }

  async create(data: Omit<Highlight, "id" | "createdAt" | "updatedAt">): Promise<Highlight> {
    return prisma.highlight.create({ data });
  }

  async update(id: string, data: Partial<Highlight>): Promise<Highlight> {
    return prisma.highlight.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.highlight.delete({ where: { id } });
  }
}
