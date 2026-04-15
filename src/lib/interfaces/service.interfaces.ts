// SOLID: Interface Segregation & Dependency Inversion
// Services depend on abstractions (interfaces), not concrete implementations

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
  VoteResponse,
} from "@prisma/client";
import type { EventWithRegistrations, EventSummary, JerseyLaunchWithRegistrations, JerseyLaunchSummary, VoteWithOptions } from "./repository.interfaces";

export interface ISiteSettingsService {
  getSettings(): Promise<SiteSettings>;
  updateSettings(data: Partial<SiteSettings>): Promise<SiteSettings>;
}

export interface IHighlightService {
  getAll(): Promise<Highlight[]>;
  getActive(): Promise<Highlight[]>;
  getById(id: string): Promise<Highlight | null>;
  create(data: { title: string; description?: string; imageUrl?: string; sortOrder?: number }): Promise<Highlight>;
  update(id: string, data: Partial<Highlight>): Promise<Highlight>;
  delete(id: string): Promise<void>;
}

export interface ICalendarService {
  getAll(): Promise<CalendarSchedule[]>;
  getUpcoming(): Promise<CalendarSchedule[]>;
  create(data: { title: string; description?: string; eventDate: Date; location?: string }): Promise<CalendarSchedule>;
  update(id: string, data: Partial<CalendarSchedule>): Promise<CalendarSchedule>;
  delete(id: string): Promise<void>;
}

export interface IEventService {
  getAll(): Promise<EventWithRegistrations[]>;
  getAllSummary(): Promise<EventSummary[]>;
  getOpen(): Promise<EventWithRegistrations[]>;
  getById(id: string): Promise<EventWithRegistrations | null>;
  create(data: {
    title: string;
    description?: string;
    location: string;
    locationUrl?: string;
    eventDate: Date;
    bankAccount: string;
    maxPlayers: number;
    maxGoalkeepers: number;
  }): Promise<Event>;
  update(id: string, data: Partial<Event>): Promise<Event>;
  delete(id: string): Promise<void>;
  register(eventId: string, data: { name: string; phone: string; position: string }): Promise<{ registration: EventRegistration; status: "registered" | "waiting" }>;
  updateRegistration(id: string, data: { status?: string; position?: string }): Promise<EventRegistration>;
  removeRegistration(id: string): Promise<void>;
}

export interface IJerseyService {
  getAll(): Promise<JerseyLaunchWithRegistrations[]>;
  getAllSummary(): Promise<JerseyLaunchSummary[]>;
  getOpen(): Promise<JerseyLaunchWithRegistrations[]>;
  getById(id: string): Promise<JerseyLaunchWithRegistrations | null>;
  getBySlug(slug: string): Promise<JerseyLaunchWithRegistrations | null>;
  create(data: { title: string; designUrls?: string[]; basePrice?: number; shirtOnlyPrice?: number | null; shortsOnlyPrice?: number | null; sizeSurcharges?: string }): Promise<JerseyLaunch>;
  update(id: string, data: Partial<JerseyLaunch>): Promise<JerseyLaunch>;
  delete(id: string): Promise<void>;
  register(launchId: string, data: { name: string; phone: string; number: number; size: string; jerseyType?: string; itemType?: string; shirtSize?: string }): Promise<JerseyRegistration>;
  getTakenNumbers(launchId: string): Promise<number[]>;
  removeRegistration(id: string): Promise<void>;
}

export interface IReportService {
  generateEventReport(eventId: string): Promise<Buffer>;
  generateJerseyReport(launchId: string): Promise<Buffer>;
  generateAllEventsReport(): Promise<Buffer>;
}

export interface INewsService {
  getAll(): Promise<News[]>;
  getActive(): Promise<News[]>;
  create(data: { title: string; content: string; imageUrls?: string[] }): Promise<News>;
  update(id: string, data: Partial<News>): Promise<News>;
  delete(id: string): Promise<void>;
}

export interface IVoteService {
  getAll(): Promise<VoteWithOptions[]>;
  getOpen(): Promise<VoteWithOptions[]>;
  getById(id: string): Promise<VoteWithOptions | null>;
  create(data: { title: string; options: { name: string; imageUrl?: string }[] }): Promise<Vote>;
  update(id: string, data: { title?: string; status?: string; options?: { name: string; imageUrl?: string }[] }): Promise<Vote>;
  delete(id: string): Promise<void>;
  castVote(voteId: string, optionId: string): Promise<VoteResponse>;
}
