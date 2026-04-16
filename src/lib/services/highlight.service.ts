import type { Highlight } from "@prisma/client";
import type { IHighlightService } from "@/lib/interfaces/service.interfaces";
import type { IHighlightRepository } from "@/lib/interfaces/repository.interfaces";

export class HighlightService implements IHighlightService {
  constructor(private readonly repository: IHighlightRepository) {}

  async getAll(): Promise<Highlight[]> {
    return this.repository.findAll();
  }

  async getActive(): Promise<Highlight[]> {
    return this.repository.findActive();
  }

  async getById(id: string): Promise<Highlight | null> {
    return this.repository.findById(id);
  }

  async create(data: { title: string; description?: string; imageUrl?: string; imageUrls?: string[]; sortOrder?: number }): Promise<Highlight> {
    return this.repository.create({
      title: data.title,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      imageUrls: data.imageUrls ?? [],
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
    });
  }

  async update(id: string, data: Partial<Highlight>): Promise<Highlight> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
