"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import Link from "next/link";
import { useI18n, LanguageToggle } from "@/lib/i18n";

interface SiteSettings {
  siteName: string;
  description: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  instagramUrl: string | null;
  whatsappUrl: string | null;
  heroType: string;
  heroImageUrl: string | null;
}

interface Highlight {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
}

interface EventReg {
  id: string;
  name: string;
  position: string;
  status: string;
}

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  location: string;
  locationUrl: string | null;
  eventDate: string;
  bankAccount: string;
  maxPlayers: number;
  maxGoalkeepers: number;
  registrations: EventReg[];
}

interface JerseyItem {
  id: string;
  title: string;
  designUrls: string[];
  slug: string;
  registrations: { number: number }[];
}

interface VoteOptionPublic {
  id: string;
  name: string;
  imageUrl: string | null;
  _count: { responses: number };
}

interface VoteItemPublic {
  id: string;
  title: string;
  status: string;
  options: VoteOptionPublic[];
}

export default function HomePage() {
  const { t, locale } = useI18n();
  const dateLocale = locale === "id" ? idLocale : enUS;

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [jerseys, setJerseys] = useState<JerseyItem[]>([]);
  const [votes, setVotes] = useState<VoteItemPublic[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [tappedDay, setTappedDay] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/highlights").then((r) => r.json()),
      fetch("/api/news").then((r) => r.json()),
      fetch("/api/events").then((r) => r.json()),
      fetch("/api/jerseys").then((r) => r.json()),
      fetch("/api/votes").then((r) => r.json()),
    ]).then(([s, h, n, e, j, v]) => {
      if (s.data) setSettings(s.data);
      if (h.data) setHighlights(h.data);
      if (n.data) setNews(n.data);
      if (e.data) setEvents(e.data);
      if (j.data) setJerseys(j.data);
      if (v.data) setVotes(v.data.filter((vote: VoteItemPublic) => vote.status === "open"));
    });
  }, []);

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">{t("loading")}</div>
      </div>
    );
  }

  const primary = settings.primaryColor;
  const secondary = settings.secondaryColor;
  const accent = settings.accentColor;

  const heroStyle = settings.heroType === "image" && settings.heroImageUrl
    ? { backgroundImage: `url(${settings.heroImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: `linear-gradient(135deg, ${secondary}, ${primary})` };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Language Toggle - Fixed */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      {/* Hero */}
      <header className="relative overflow-hidden" style={heroStyle}>
        {settings.heroType === "image" && settings.heroImageUrl && (
          <div className="absolute inset-0 bg-black/40" />
        )}
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center relative z-10">
          {settings.logoUrl && (
            <img src={settings.logoUrl} alt="Logo" className="w-24 h-24 mx-auto mb-6 object-contain drop-shadow-lg" style={{ background: "transparent" }} />
          )}
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4" style={{ color: accent }}>
            {settings.siteName}
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">{settings.description}</p>

          {/* Social Media Links */}
          {(settings.instagramUrl || settings.whatsappUrl) && (
            <div className="flex items-center justify-center gap-4 mt-6">
              {settings.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition text-white text-sm backdrop-blur-sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  Instagram
                </a>
              )}
              {settings.whatsappUrl && (
                <a href={settings.whatsappUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition text-white text-sm backdrop-blur-sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      {/* 2-Column Layout: Calendar Sidebar (1/3) + Content (2/3) */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - Calendar (1/3) */}
          <div className="lg:col-span-1">
            {events.length > 0 && (() => {
              const year = calendarMonth.getFullYear();
              const month = calendarMonth.getMonth();
              const firstDay = new Date(year, month, 1).getDay();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const eventDates = events.reduce<Record<number, EventItem[]>>((acc, ev) => {
                const d = new Date(ev.eventDate);
                if (d.getFullYear() === year && d.getMonth() === month) {
                  const day = d.getDate();
                  if (!acc[day]) acc[day] = [];
                  acc[day].push(ev);
                }
                return acc;
              }, {});
              const monthEvents = events.filter((ev) => {
                const d = new Date(ev.eventDate);
                return d.getFullYear() === year && d.getMonth() === month;
              });
              const dayNames = locale === "id"
                ? ["Mi", "Se", "Se", "Ra", "Ka", "Ju", "Sa"]
                : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

              return (
                <div className="bg-gray-800 rounded-xl p-4 sticky top-4">
                  <h3 className="text-lg font-bold mb-3 text-center" style={{ color: accent }}>{t("eventCalendar")}</h3>
                  <div className="flex items-center justify-between mb-2">
                    <button onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                      className="p-1 text-gray-400 hover:text-white transition text-sm">&larr;</button>
                    <span className="text-white font-semibold text-sm">
                      {format(calendarMonth, "MMMM yyyy", { locale: dateLocale })}
                    </span>
                    <button onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                      className="p-1 text-gray-400 hover:text-white transition text-sm">&rarr;</button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {dayNames.map((d, i) => (
                      <div key={i} className="text-center text-[10px] text-gray-500 font-medium py-0.5">{d}</div>
                    ))}
                    {Array.from({ length: firstDay }, (_, i) => (
                      <div key={`pad-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const dayEvts = eventDates[day];
                      const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                      return (
                        <div key={day} className="relative group">
                          <div
                            onClick={() => dayEvts && setTappedDay(tappedDay === day ? null : day)}
                            className={`aspect-square flex items-center justify-center rounded text-xs transition
                            ${dayEvts ? "font-bold cursor-pointer" : "text-gray-400"}
                            ${isToday ? "ring-1 ring-white/30" : ""}
                          `} style={dayEvts ? { backgroundColor: primary, color: "#fff" } : undefined}>
                            {day}
                          </div>
                          {dayEvts && (
                            <div className={`absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-1 w-40 bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-xl pointer-events-none transition ${tappedDay === day ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                              {dayEvts.map((ev) => (
                                <div key={ev.id} className="text-[10px] text-white py-0.5">
                                  <span className="font-semibold">{format(new Date(ev.eventDate), "HH:mm")}</span>{" "}
                                  {ev.title}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Event List for current month */}
                  {monthEvents.length > 0 && (
                    <div className="mt-3 border-t border-gray-700 pt-3 space-y-2">
                      {monthEvents.map((ev) => (
                        <Link key={ev.id} href={`/event/${ev.id}`} className="block p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition">
                          <p className="text-xs font-semibold text-white truncate">{ev.title}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: primary }}>
                            {format(new Date(ev.eventDate), "dd MMM - HH:mm", { locale: dateLocale })}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">📍 {ev.location}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                  {monthEvents.length === 0 && (
                    <p className="mt-3 border-t border-gray-700 pt-3 text-xs text-gray-500 text-center">
                      {locale === "id" ? "Tidak ada event bulan ini" : "No events this month"}
                    </p>
                  )}
                </div>
              );
            })()}

            {events.length === 0 && (
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-lg font-bold mb-3 text-center" style={{ color: accent }}>{t("eventCalendar")}</h3>
                <p className="text-xs text-gray-500 text-center">{locale === "id" ? "Belum ada event" : "No events yet"}</p>
              </div>
            )}
          </div>

          {/* Right Column - Content (2/3) */}
          <div className="lg:col-span-2 space-y-12">

            {/* Highlights - Activity Gallery (Carousel) */}
            {highlights.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6" style={{ color: accent }}>{t("highlights")}</h2>
                <div className="relative">
                  <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin" style={{ scrollbarColor: `${primary} transparent` }}>
                    {highlights.map((h) => (
                      <div key={h.id} className="flex-shrink-0 w-64 md:w-72 bg-gray-800 rounded-xl overflow-hidden group cursor-pointer"
                        onClick={() => setSelectedHighlight(h)}>
                        {h.imageUrl && (
                          <div className="relative">
                            <img src={h.imageUrl} alt={h.title} className="w-full h-40 object-cover group-hover:scale-105 transition duration-300" />
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                              <p className="text-white text-sm font-medium truncate">{h.title}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* News Section */}
            {news.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6" style={{ color: accent }}>{t("news")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {news.map((n) => (
                    <div key={n.id} className="bg-gray-800 rounded-xl overflow-hidden">
                      {n.imageUrl && (
                        <img src={n.imageUrl} alt={n.title} className="w-full h-40 object-cover" />
                      )}
                      <div className="p-4">
                        <p className="text-xs text-gray-500 mb-1">
                          {format(new Date(n.createdAt), "dd MMMM yyyy", { locale: dateLocale })}
                        </p>
                        <h3 className="text-base font-bold text-white">{n.title}</h3>
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{n.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Open Events */}
            {events.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6" style={{ color: accent }}>{t("openEvents")}</h2>
                <div className="space-y-4">
                  {events.map((ev) => {
                    const confirmedPlayers = ev.registrations.filter((r) => (r.status === "confirmed" || r.status === "registered") && r.position === "player").length;
                    const confirmedGK = ev.registrations.filter((r) => (r.status === "confirmed" || r.status === "registered") && r.position === "goalkeeper").length;
                    const playerSpotsLeft = ev.maxPlayers - confirmedPlayers;
                    const gkSpotsLeft = ev.maxGoalkeepers - confirmedGK;
                    return (
                      <div key={ev.id} className="bg-gray-800 rounded-xl p-5">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold text-white">{ev.title}</h3>
                            <p className="text-sm mt-1" style={{ color: primary }}>
                              {format(new Date(ev.eventDate), "EEEE, dd MMMM yyyy - HH:mm", { locale: dateLocale })}
                            </p>
                            <p className="text-gray-400 text-sm">
                              📍 {ev.location}
                              {ev.locationUrl && (
                                <a href={ev.locationUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-blue-400 ml-2 hover:underline">
                                  {t("locationLink")} →
                                </a>
                              )}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              <span className="text-sm text-gray-300">
                                {t("players")}: <strong className="text-green-400">{confirmedPlayers}/{ev.maxPlayers}</strong>
                              </span>
                              <span className="text-sm text-gray-300">
                                {t("goalkeepers")}: <strong className="text-blue-400">{confirmedGK}/{ev.maxGoalkeepers}</strong>
                              </span>
                              {playerSpotsLeft > 0 ? (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-800 text-green-300">
                                  {playerSpotsLeft} {t("spotsLeft")}
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded bg-yellow-800 text-yellow-300">{t("playersFull")}</span>
                              )}
                              {gkSpotsLeft <= 0 && (
                                <span className="text-xs px-2 py-0.5 rounded bg-yellow-800 text-yellow-300">{t("goalkeepersFull")}</span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mt-1">💳 {ev.bankAccount}</p>
                          </div>
                          <Link href={`/event/${ev.id}`}
                            className="px-5 py-2.5 rounded-lg font-semibold text-white text-center text-sm transition hover:opacity-90"
                            style={{ backgroundColor: primary }}>
                            {t("registerNow")}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Jersey Launch */}
            {jerseys.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6" style={{ color: accent }}>{t("jerseyLaunch")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jerseys.map((j) => (
                    <div key={j.id} className="bg-gray-800 rounded-xl overflow-hidden">
                      {(j.designUrls || []).length > 0 && (
                        <img src={j.designUrls[0]} alt={j.title} className="w-full h-48 object-cover" />
                      )}
                      <div className="p-4">
                        <h3 className="text-base font-bold text-white">{j.title}</h3>
                        <p className="text-gray-400 text-sm mt-1">{j.registrations.length} {t("peopleRegistered")}</p>
                        <Link href={`/jersey/${j.slug}`}
                          className="mt-3 block text-center px-4 py-2.5 rounded-lg font-semibold text-white text-sm transition hover:opacity-90"
                          style={{ backgroundColor: primary }}>
                          {t("orderJersey")}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Voting Section */}
            {votes.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6" style={{ color: accent }}>{t("votingSection")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {votes.map((vote) => {
                    const totalVotes = vote.options.reduce((sum, o) => sum + o._count.responses, 0);
                    const previewOptions = vote.options.slice(0, 3);
                    return (
                      <Link key={vote.id} href={`/vote/${vote.id}`}
                        className="bg-gray-800 rounded-xl p-5 hover:bg-gray-750 transition group block">
                        <h3 className="text-lg font-bold text-white mb-3 group-hover:underline">{vote.title}</h3>
                        <div className="flex gap-2 mb-3">
                          {previewOptions.map((opt) => (
                            <div key={opt.id} className="flex-1 min-w-0">
                              {opt.imageUrl ? (
                                <img src={opt.imageUrl} alt={opt.name} className="w-full h-16 object-cover rounded" />
                              ) : (
                                <div className="w-full h-16 bg-gray-700 rounded flex items-center justify-center">
                                  <span className="text-xs text-gray-400 truncate px-1">{opt.name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                          {vote.options.length > 3 && (
                            <div className="flex-1 min-w-0 h-16 bg-gray-700 rounded flex items-center justify-center">
                              <span className="text-xs text-gray-400">+{vote.options.length - 3}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">{vote.options.length} {t("voteOptions")} · {totalVotes} {t("voteCount")}</span>
                          <span className="text-xs font-medium text-white">{t("voteNow")} →</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Highlight Detail Modal */}
      {selectedHighlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setSelectedHighlight(null)}>
          <div className="bg-gray-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {selectedHighlight.imageUrl && (
              <img src={selectedHighlight.imageUrl} alt={selectedHighlight.title} className="w-full max-h-[60vh] object-cover" />
            )}
            <div className="p-6">
              <h3 className="text-xl font-bold text-white">{selectedHighlight.title}</h3>
              {selectedHighlight.description && (
                <p className="text-gray-400 mt-2 text-sm">{selectedHighlight.description}</p>
              )}
              <button onClick={() => setSelectedHighlight(null)}
                className="mt-4 px-5 py-2 rounded-lg text-white text-sm font-medium transition hover:opacity-90"
                style={{ backgroundColor: primary }}>
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} {settings.siteName}. {t("allRightsReserved")}
            </p>
            {(settings.instagramUrl || settings.whatsappUrl) && (
              <div className="flex items-center gap-3">
                {settings.instagramUrl && (
                  <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-400 transition">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                )}
                {settings.whatsappUrl && (
                  <a href={settings.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-400 transition">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
