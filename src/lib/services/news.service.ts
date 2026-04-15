import type { News } from "@prisma/client";
import type { INewsService } from "@/lib/interfaces/service.interfaces";
import type { INewsRepository } from "@/lib/interfaces/repository.interfaces";

export class NewsService implements INewsService {
  constructor(private readonly repository: INewsRepository) {}

  async getAll(): Promise<News[]> {
    return this.repository.findAll();
  }

  async getActive(): Promise<News[]> {
    return this.repository.findActive();
  }

  async create(data: { title: string; content: string; imageUrl?: string }): Promise<News> {
    return this.repository.create({
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl ?? null,
      isActive: true,
    });
  }

  async update(id: string, data: Partial<News>): Promise<News> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
