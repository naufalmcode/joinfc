import type { JerseyLaunch, JerseyRegistration } from "@prisma/client";
import type { IJerseyService } from "@/lib/interfaces/service.interfaces";
import type {
  IJerseyLaunchRepository,
  IJerseyRegistrationRepository,
  JerseyLaunchWithRegistrations,
} from "@/lib/interfaces/repository.interfaces";
import { v4 as uuidv4 } from "uuid";

export class JerseyService implements IJerseyService {
  constructor(
    private readonly launchRepo: IJerseyLaunchRepository,
    private readonly registrationRepo: IJerseyRegistrationRepository
  ) {}

  async getAll(): Promise<JerseyLaunchWithRegistrations[]> {
    return this.launchRepo.findAll();
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

  async create(data: { title: string; designUrls?: string[] }): Promise<JerseyLaunch> {
    const slug = uuidv4().slice(0, 8);
    return this.launchRepo.create({
      title: data.title,
      designUrls: data.designUrls ?? [],
      slug,
      status: "open",
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
    data: { registrantName?: string; name: string; phone: string; number: number; size: string }
  ): Promise<JerseyRegistration> {
    if (data.number < 1 || data.number > 99) {
      throw new Error("Number must be between 1 and 99");
    }

    const launch = await this.launchRepo.findById(launchId);
    if (!launch) throw new Error("Jersey launch not found");
    if (launch.status !== "open") throw new Error("Jersey launch is closed");

    const takenNumbers = await this.registrationRepo.findTakenNumbers(launchId);
    if (takenNumbers.includes(data.number)) {
      throw new Error(`Number ${data.number} is already taken`);
    }

    return this.registrationRepo.create({
      jerseyLaunchId: launchId,
      registrantName: data.registrantName || "",
      name: data.name,
      phone: data.phone,
      number: data.number,
      size: data.size,
    });
  }

  async getTakenNumbers(launchId: string): Promise<number[]> {
    return this.registrationRepo.findTakenNumbers(launchId);
  }

  async removeRegistration(id: string): Promise<void> {
    return this.registrationRepo.delete(id);
  }
}
