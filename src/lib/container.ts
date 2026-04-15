// SOLID: Dependency Inversion - composition root wires everything together
// All service instances are created here with their repository dependencies

import { SiteSettingsRepository } from "@/lib/repositories/settings.repository";
import { HighlightRepository } from "@/lib/repositories/highlight.repository";
import { CalendarRepository } from "@/lib/repositories/calendar.repository";
import { EventRepository, EventRegistrationRepository } from "@/lib/repositories/event.repository";
import { JerseyLaunchRepository, JerseyRegistrationRepository } from "@/lib/repositories/jersey.repository";
import { NewsRepository } from "@/lib/repositories/news.repository";
import { VoteRepository, VoteOptionRepository, VoteResponseRepository } from "@/lib/repositories/vote.repository";

import { SiteSettingsService } from "@/lib/services/settings.service";
import { HighlightService } from "@/lib/services/highlight.service";
import { CalendarService } from "@/lib/services/calendar.service";
import { EventService } from "@/lib/services/event.service";
import { JerseyService } from "@/lib/services/jersey.service";
import { ReportService } from "@/lib/services/report.service";
import { NewsService } from "@/lib/services/news.service";
import { VoteService } from "@/lib/services/vote.service";

// Repositories
const settingsRepo = new SiteSettingsRepository();
const highlightRepo = new HighlightRepository();
const calendarRepo = new CalendarRepository();
const eventRepo = new EventRepository();
const eventRegRepo = new EventRegistrationRepository();
const jerseyLaunchRepo = new JerseyLaunchRepository();
const jerseyRegRepo = new JerseyRegistrationRepository();
const newsRepo = new NewsRepository();
const voteRepo = new VoteRepository();
const voteOptionRepo = new VoteOptionRepository();
const voteResponseRepo = new VoteResponseRepository();

// Services (injected with repository dependencies)
export const settingsService = new SiteSettingsService(settingsRepo);
export const highlightService = new HighlightService(highlightRepo);
export const calendarService = new CalendarService(calendarRepo);
export const eventService = new EventService(eventRepo, eventRegRepo);
export const jerseyService = new JerseyService(jerseyLaunchRepo, jerseyRegRepo);
export const reportService = new ReportService(eventRepo, jerseyLaunchRepo);
export const newsService = new NewsService(newsRepo);
export const voteService = new VoteService(voteRepo, voteOptionRepo, voteResponseRepo);
