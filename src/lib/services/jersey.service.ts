import type { JerseyLaunch, JerseyRegistration } from "@prisma/client";
import type { IJerseyService } from "@/lib/interfaces/service.interfaces";
import type {
  IJerseyLaunchRepository,
  IJerseyRegistrationRepository,
  JerseyLaunchWithRegistrations,
  JerseyLaunchSummary,
} from "@/lib/interfaces/repository.interfaces";
import { v4 as uuidv4 } from "uuid";

export class JerseyService implements IJerseyService {
  constructor(
    private readonly launchRepo: IJerseyLaunchRepository,
    private readonly registrationRepo: IJerseyRegistrationRepository
  ) { }

  async getAll(): Promise<JerseyLaunchWithRegistrations[]> {
    return this.launchRepo.findAll();
  }

  async getAllSummary(): Promise<JerseyLaunchSummary[]> {
    return this.launchRepo.findAllSummary();
  }

  async getOpen(): Promise<JerseyLaunchWithRegistrations[]> {
    return this.launchRepo.findOpen();
  }

  async getById(id: string): Promise<JerseyLaunchWithRegistrations | null> {
    return this.launchRepo.findById(id);
  }

  async getBySlug(slug: string): Promise<JerseyLaunchWithRegistrations | null> {
    return this.launchRepo.findBySlug(slug);
  }

  async create(data: { title: string; designUrls?: string[]; basePrice?: number; shirtOnlyPrice?: number | null; shortsOnlyPrice?: number | null; sizeSurcharges?: string }): Promise<JerseyLaunch> {
    const slug = uuidv4().slice(0, 8);
    return this.launchRepo.create({
      title: data.title,
      designUrls: data.designUrls ?? [],
      slug,
      status: "open",
      isVisible: true,
      basePrice: data.basePrice ?? 0,
      shirtOnlyPrice: data.shirtOnlyPrice ?? null,
      shortsOnlyPrice: data.shortsOnlyPrice ?? null,
      sizeSurcharges: data.sizeSurcharges ?? "{}",
    });
  }

  async update(id: string, data: Partial<JerseyLaunch>): Promise<JerseyLaunch> {
    return this.launchRepo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.launchRepo.delete(id);
  }

  async register(
    launchId: string,
    data: { registrantName?: string; name: string; phone: string; number: number; size: string; jerseyType: string; itemType?: string; shirtSize?: string }
  ): Promise<JerseyRegistration> {
    if (data.number < 0 || data.number > 99) {
      throw new Error("Number must be between 0 and 99");
    }

    const launch = await this.launchRepo.findById(launchId);
    if (!launch) throw new Error("Jersey launch not found");
    if (launch.status !== "open") throw new Error("Jersey launch is closed");

    // Use already-loaded registrations instead of a separate DB query
    if (launch.registrations.some((r) => r.number === data.number)) {
      throw new Error(`Number ${data.number} is already taken`);
    }

    const itemType = data.itemType || "set";
    const shirtSize = itemType === "set" && data.shirtSize && data.shirtSize !== data.size ? data.shirtSize : "";
    let totalPrice = launch.basePrice || 0;
    try {
      const surchargeList = JSON.parse(launch.sizeSurcharges || "[]");
      if (Array.isArray(surchargeList)) {
        const baseRules = surchargeList.filter((p: { target?: string }) => p.target !== "shirt");
        // Find exact match: same size + same itemType
        const exact = baseRules.find((p: { size: string; itemType?: string; surcharge?: number; price?: number }) => p.size === data.size && (p.itemType || "set") === itemType);
        if (exact) {
          totalPrice += (exact.surcharge ?? exact.price ?? 0);
        } else {
          // Fallback: match by size only
          const bySize = baseRules.find((p: { size: string; surcharge?: number; price?: number }) => p.size === data.size);
          if (bySize) totalPrice += (bySize.surcharge ?? bySize.price ?? 0);
        }

        if (shirtSize) {
          const shirtRule = surchargeList.find((p: { target?: string; shirtSize?: string; size?: string; surcharge?: number; price?: number }) => p.target === "shirt" && (p.shirtSize || p.size) === shirtSize);
          if (shirtRule) {
            totalPrice += (shirtRule.surcharge ?? shirtRule.price ?? 0);
          } else {
            // Fallback: use base surcharge difference between shirt size and main size
            const shirtBase = baseRules.find((p: { size: string }) => p.size === shirtSize);
            const mainBase = exact || baseRules.find((p: { size: string }) => p.size === data.size);
            const shirtSurcharge = shirtBase ? (shirtBase.surcharge ?? shirtBase.price ?? 0) : 0;
            const mainSurcharge = mainBase ? (mainBase.surcharge ?? mainBase.price ?? 0) : 0;
            if (shirtSurcharge > mainSurcharge) totalPrice += (shirtSurcharge - mainSurcharge);
          }
        }
      }
    } catch { /* ignore parse errors, use basePrice */ }

    return this.registrationRepo.create({
      jerseyLaunchId: launchId,
      registrantName: data.registrantName || "",
      name: data.name,
      phone: data.phone,
      number: data.number,
      size: data.size,
      shirtSize,
      jerseyType: data.jerseyType || "player",
      itemType,
      totalPrice,
      paymentStatus: "registered",
    });
  }

  async getTakenNumbers(launchId: string): Promise<number[]> {
    return this.registrationRepo.findTakenNumbers(launchId);
  }

  async updateRegistration(id: string, data: Partial<JerseyRegistration>): Promise<JerseyRegistration> {
    return this.registrationRepo.update(id, data);
  }

  async removeRegistration(id: string): Promise<void> {
    return this.registrationRepo.delete(id);
  }
}
