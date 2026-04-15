// SOLID: Interface Segregation Principle - small, focused interfaces

import type {
  SiteSettings,
  Highlight,
  CalendarSchedule,
  Event,
  EventRegistration,
  JerseyLaunch,
  JerseyRegistration,
  News,
  Vote,
  VoteOption,
  VoteResponse,
} from "@prisma/client";

// ─── Site Settings ───────────────────────────────────────────────
export interface ISiteSettingsRepository {
  get(): Promise<SiteSettings>;
  upsert(data: Partial<SiteSettings>): Promise<SiteSettings>;
}

// ─── Highlights ──────────────────────────────────────────────────
export interface IHighlightRepository {
  findAll(): Promise<Highlight[]>;
  findActive(): Promise<Highlight[]>;
  findById(id: string): Promise<Highlight | null>;
  create(data: Omit<Highlight, "id" | "createdAt" | "updatedAt">): Promise<Highlight>;
  update(id: string, data: Partial<Highlight>): Promise<Highlight>;
  delete(id: string): Promise<void>;
}

// ─── Calendar ────────────────────────────────────────────────────
export interface ICalendarRepository {
  findAll(): Promise<CalendarSchedule[]>;
  findUpcoming(): Promise<CalendarSchedule[]>;
  findById(id: string): Promise<CalendarSchedule | null>;
  create(data: Omit<CalendarSchedule, "id" | "createdAt" | "updatedAt">): Promise<CalendarSchedule>;
  update(id: string, data: Partial<CalendarSchedule>): Promise<CalendarSchedule>;
  delete(id: string): Promise<void>;
}

// ─── Events ──────────────────────────────────────────────────────
export type EventWithRegistrations = Event & { registrations: EventRegistration[] };

export interface IEventRepository {
  findAll(): Promise<EventWithRegistrations[]>;
  findOpen(): Promise<EventWithRegistrations[]>;
  findById(id: string): Promise<EventWithRegistrations | null>;
  create(data: Omit<Event, "id" | "createdAt" | "updatedAt">): Promise<Event>;
  update(id: string, data: Partial<Event>): Promise<Event>;
  delete(id: string): Promise<void>;
}

export interface IEventRegistrationRepository {
  findByEventId(eventId: string): Promise<EventRegistration[]>;
  create(data: Omit<EventRegistration, "id" | "createdAt">): Promise<EventRegistration>;
  update(id: string, data: Partial<EventRegistration>): Promise<EventRegistration>;
  delete(id: string): Promise<void>;
  countByEventIdAndPosition(eventId: string, position: string): Promise<number>;
}

// ─── Jersey ──────────────────────────────────────────────────────
export type JerseyLaunchWithRegistrations = JerseyLaunch & { registrations: JerseyRegistration[] };

export interface IJerseyLaunchRepository {
  findAll(): Promise<JerseyLaunchWithRegistrations[]>;
  findOpen(): Promise<JerseyLaunchWithRegistrations[]>;
  findById(id: string): Promise<JerseyLaunchWithRegistrations | null>;
  findBySlug(slug: string): Promise<JerseyLaunchWithRegistrations | null>;
  create(data: Omit<JerseyLaunch, "id" | "createdAt" | "updatedAt">): Promise<JerseyLaunch>;
  update(id: string, data: Partial<JerseyLaunch>): Promise<JerseyLaunch>;
  delete(id: string): Promise<void>;
}

export interface IJerseyRegistrationRepository {
  findByLaunchId(launchId: string): Promise<JerseyRegistration[]>;
  findTakenNumbers(launchId: string): Promise<number[]>;
  create(data: Omit<JerseyRegistration, "id" | "createdAt">): Promise<JerseyRegistration>;
  delete(id: string): Promise<void>;
}

// ─── News ────────────────────────────────────────────────────────
export interface INewsRepository {
  findAll(): Promise<News[]>;
  findActive(): Promise<News[]>;
  findById(id: string): Promise<News | null>;
  create(data: Omit<News, "id" | "createdAt" | "updatedAt">): Promise<News>;
  update(id: string, data: Partial<News>): Promise<News>;
  delete(id: string): Promise<void>;
}

// ─── Votes ───────────────────────────────────────────────────────
export type VoteWithOptions = Vote & { options: (VoteOption & { _count: { responses: number } })[] };

export interface IVoteRepository {
  findAll(): Promise<VoteWithOptions[]>;
  findOpen(): Promise<VoteWithOptions[]>;
  findById(id: string): Promise<VoteWithOptions | null>;
  create(data: { title: string; status?: string }): Promise<Vote>;
  update(id: string, data: Partial<Vote>): Promise<Vote>;
  delete(id: string): Promise<void>;
}

export interface IVoteOptionRepository {
  createMany(voteId: string, options: { name: string; imageUrl?: string; sortOrder?: number }[]): Promise<void>;
  deleteByVoteId(voteId: string): Promise<void>;
}

export interface IVoteResponseRepository {
  create(data: { voteId: string; optionId: string }): Promise<VoteResponse>;
  countByOptionId(optionId: string): Promise<number>;
}
