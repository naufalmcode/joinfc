// SOLID: Dependency Inversion - depends on ISiteSettingsRepository, not concrete class
import type { SiteSettings } from "@prisma/client";
import type { ISiteSettingsService } from "@/lib/interfaces/service.interfaces";
import type { ISiteSettingsRepository } from "@/lib/interfaces/repository.interfaces";

export class SiteSettingsService implements ISiteSettingsService {
  constructor(private readonly repository: ISiteSettingsRepository) {}

  async getSettings(): Promise<SiteSettings> {
    return this.repository.get();
  }

  async updateSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
    return this.repository.upsert(data);
  }
}
