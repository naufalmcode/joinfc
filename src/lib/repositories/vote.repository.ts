import { prisma } from "@/lib/db/prisma";
import type { Vote, VoteResponse } from "@prisma/client";
import type {
  IVoteRepository,
  IVoteOptionRepository,
  IVoteResponseRepository,
  VoteWithOptions,
} from "@/lib/interfaces/repository.interfaces";

const voteInclude = {
  options: {
    orderBy: { sortOrder: "asc" as const },
    include: { _count: { select: { responses: true } } },
  },
};

export class VoteRepository implements IVoteRepository {
  async findAll(): Promise<VoteWithOptions[]> {
    return prisma.vote.findMany({
      orderBy: { createdAt: "desc" },
      include: voteInclude,
    }) as unknown as VoteWithOptions[];
  }

  async findOpen(): Promise<VoteWithOptions[]> {
    return prisma.vote.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "desc" },
      include: voteInclude,
    }) as unknown as VoteWithOptions[];
  }

  async findById(id: string): Promise<VoteWithOptions | null> {
    return prisma.vote.findUnique({
      where: { id },
      include: voteInclude,
    }) as unknown as VoteWithOptions | null;
  }

  async create(data: { title: string; status?: string }): Promise<Vote> {
    return prisma.vote.create({ data: { title: data.title, status: data.status ?? "open" } });
  }

  async update(id: string, data: Partial<Vote>): Promise<Vote> {
    return prisma.vote.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.vote.delete({ where: { id } });
  }
}

export class VoteOptionRepository implements IVoteOptionRepository {
  async createMany(voteId: string, options: { name: string; imageUrl?: string; sortOrder?: number }[]): Promise<void> {
    await prisma.voteOption.createMany({
      data: options.map((opt, i) => ({
        voteId,
        name: opt.name,
        imageUrl: opt.imageUrl ?? null,
        sortOrder: opt.sortOrder ?? i,
      })),
    });
  }

  async deleteByVoteId(voteId: string): Promise<void> {
    await prisma.voteOption.deleteMany({ where: { voteId } });
  }
}

export class VoteResponseRepository implements IVoteResponseRepository {
  async create(data: { voteId: string; optionId: string }): Promise<VoteResponse> {
    return prisma.voteResponse.create({ data });
  }

  async countByOptionId(optionId: string): Promise<number> {
    return prisma.voteResponse.count({ where: { optionId } });
  }
}
