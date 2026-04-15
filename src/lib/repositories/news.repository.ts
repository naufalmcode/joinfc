import { prisma } from "@/lib/db/prisma";
import type { News } from "@prisma/client";
import type { INewsRepository } from "@/lib/interfaces/repository.interfaces";

export class NewsRepository implements INewsRepository {
  async findAll(): Promise<News[]> {
    return prisma.news.findMany({ orderBy: { createdAt: "desc" } });
  }

  async findActive(): Promise<News[]> {
    return prisma.news.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<News | null> {
    return prisma.news.findUnique({ where: { id } });
  }

  async create(data: Omit<News, "id" | "createdAt" | "updatedAt">): Promise<News> {
    return prisma.news.create({ data });
  }

  async update(id: string, data: Partial<News>): Promise<News> {
    return prisma.news.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.news.delete({ where: { id } });
  }
}
