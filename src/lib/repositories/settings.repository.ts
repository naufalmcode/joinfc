// SOLID: Single Responsibility - only handles SiteSettings data access
import { prisma } from "@/lib/db/prisma";
import type { SiteSettings } from "@prisma/client";
import type { ISiteSettingsRepository } from "@/lib/interfaces/repository.interfaces";

export class SiteSettingsRepository implements ISiteSettingsRepository {
  async get(): Promise<SiteSettings> {
    let settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: "default" } });
    }
    return settings;
  }

  async upsert(data: Partial<SiteSettings>): Promise<SiteSettings> {
    return prisma.siteSettings.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data } as SiteSettings,
    });
  }
}
