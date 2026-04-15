import type { Vote, VoteResponse } from "@prisma/client";
import type { IVoteService } from "@/lib/interfaces/service.interfaces";
import type {
  IVoteRepository,
  IVoteOptionRepository,
  IVoteResponseRepository,
  VoteWithOptions,
} from "@/lib/interfaces/repository.interfaces";

export class VoteService implements IVoteService {
  constructor(
    private readonly voteRepo: IVoteRepository,
    private readonly optionRepo: IVoteOptionRepository,
    private readonly responseRepo: IVoteResponseRepository,
  ) {}

  async getAll(): Promise<VoteWithOptions[]> {
    return this.voteRepo.findAll();
  }

  async getOpen(): Promise<VoteWithOptions[]> {
    return this.voteRepo.findOpen();
  }

  async getById(id: string): Promise<VoteWithOptions | null> {
    return this.voteRepo.findById(id);
  }

  async create(data: { title: string; options: { name: string; imageUrl?: string }[] }): Promise<Vote> {
    const vote = await this.voteRepo.create({ title: data.title });
    if (data.options.length > 0) {
      await this.optionRepo.createMany(vote.id, data.options);
    }
    return vote;
  }

  async update(id: string, data: { title?: string; status?: string; options?: { name: string; imageUrl?: string }[] }): Promise<Vote> {
    const vote = await this.voteRepo.update(id, {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.status !== undefined && { status: data.status }),
    });
    if (data.options !== undefined) {
      await this.optionRepo.deleteByVoteId(id);
      if (data.options.length > 0) {
        await this.optionRepo.createMany(id, data.options);
      }
    }
    return vote;
  }

  async delete(id: string): Promise<void> {
    await this.voteRepo.delete(id);
  }

  async castVote(voteId: string, optionId: string): Promise<VoteResponse> {
    const vote = await this.voteRepo.findById(voteId);
    if (!vote || vote.status !== "open") {
      throw new Error("Vote is closed");
    }
    const validOption = vote.options.find((o) => o.id === optionId);
    if (!validOption) {
      throw new Error("Invalid option");
    }
    return this.responseRepo.create({ voteId, optionId });
  }
}
