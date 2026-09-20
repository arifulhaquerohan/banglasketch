"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCalendar, FiCheck, FiClock, FiMapPin, FiPhone, FiRefreshCw, FiTrash2, FiX } from "react-icons/fi";
import { adminFetch } from "@/lib/api";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
type BookingDraft = {
  visit_date: string;
  time_slot: string;
};

interface SiteVisitBooking {
  id: number;
  name: string;
  phone: string;
  email?: string;
  location: string;
  space_size?: string;
  project_note?: string;
  visit_date: string;
  time_slot: string;
  time_slot_label: string;
  status: BookingStatus;
  status_label: string;
  admin_note?: string;
  last_contacted_at?: string | null;
  confirmed_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  submitted_at: string;
}

interface SiteVisitTimeSlot {
  id: number;
  label: string;
  value: string;
  active: boolean;
  display_order: number;
}

interface SiteVisitBlockedDate {
  id: number;
  date: string;
  reason?: string;
}

const statuses: Array<{ value: "all" | BookingStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const statusClass: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  completed: "bg-[#EEF3F4] text-[#26363B] border-[#DCE5E7]",
  cancelled: "bg-red-50 text-red-800 border-red-200",
};

export default function SiteVisitsPage() {
  const [bookings, setBookings] = useState<SiteVisitBooking[]>([]);
  const [timeSlots, setTimeSlots] = useState<SiteVisitTimeSlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<SiteVisitBlockedDate[]>([]);
  const [newSlot, setNewSlot] = useState({ label: "", value: "" });
  const [newBlock, setNewBlock] = useState({ date: "", reason: "" });
  const [drafts, setDrafts] = useState<Record<number, BookingDraft>>({});
  const [filter, setFilter] = useState<"all" | BookingStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await adminFetch<SiteVisitBooking[]>("site-visits");
    if (result.success && Array.isArray(result.data)) {
      setBookings(result.data);
      setDrafts(
        Object.fromEntries(
          result.data.map((booking) => [
            booking.id,
            { visit_date: booking.visit_date, time_slot: booking.time_slot },
          ])
        )
      );
    } else {
      setError(result.error || "Unable to load site visit bookings.");
    }
    setLoading(false);
  }, []);

  const loadSchedule = useCallback(async () => {
    const result = await adminFetch<{ slots: SiteVisitTimeSlot[]; blocked_dates: SiteVisitBlockedDate[] }>("site-visits/schedule");
    if (result.success && result.data) {
      setTimeSlots(result.data.slots || []);
      setBlockedDates(result.data.blocked_dates || []);
    }
  }, []);

  useEffect(() => {
    loadBookings();
    loadSchedule();
  }, [loadBookings, loadSchedule]);

  const visibleBookings = useMemo(() => {
    return filter === "all" ? bookings : bookings.filter((booking) => booking.status === filter);
  }, [bookings, filter]);

  const updateBooking = async (
    booking: SiteVisitBooking,
    updates: Partial<Pick<SiteVisitBooking, "status" | "admin_note" | "visit_date" | "time_slot">> & { mark_contacted?: boolean }
  ) => {
    setSavingId(booking.id);
    const result = await adminFetch<SiteVisitBooking>(`site-visits/${booking.id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    setSavingId(null);
    if (result.success && result.data) {
      setBookings((prev) => prev.map((item) => (item.id === booking.id ? result.data! : item)));
      setDrafts((prev) => ({
        ...prev,
        [booking.id]: {
          visit_date: result.data!.visit_date,
          time_slot: result.data!.time_slot,
        },
      }));
    } else {
      alert(result.error || "Unable to update booking.");
    }
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "Not recorded";
    return new Date(value).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const whatsappUrl = (booking: SiteVisitBooking) => {
    const message = `Hello ${booking.name}, this is Bangla Sketch. We are contacting you about your site visit on ${booking.visit_date} at ${booking.time_slot_label}.`;
    return `https://wa.me/88${booking.phone.replace(/\D/g, "").replace(/^88/, "")}?text=${encodeURIComponent(message)}`;
  };

  const removeBooking = async (booking: SiteVisitBooking) => {
    if (!window.confirm(`Delete site visit request from ${booking.name}?`)) return;
    setSavingId(booking.id);
    const result = await adminFetch(`site-visits/${booking.id}`, { method: "DELETE" });
    setSavingId(null);
    if (result.success) {
      setBookings((prev) => prev.filter((item) => item.id !== booking.id));
    } else {
      alert(result.error || "Unable to delete booking.");
    }
  };

  const refreshAll = async () => {
    await Promise.all([loadBookings(), loadSchedule()]);
  };

  const saveSlot = async () => {
    if (!newSlot.label.trim() || !newSlot.value.trim()) return;
    const result = await adminFetch<SiteVisitTimeSlot>("site-visits/slots", {
      method: "POST",
      body: JSON.stringify({
        label: newSlot.label.trim(),
        value: newSlot.value.trim(),
        active: true,
        display_order: timeSlots.length * 10 + 10,
      }),
    });
    if (result.success) {
      setNewSlot({ label: "", value: "" });
      refreshAll();
    } else {
      alert(result.error || "Unable to add time slot.");
    }
  };

  const toggleSlot = async (slot: SiteVisitTimeSlot) => {
    const result = await adminFetch<SiteVisitTimeSlot>(`site-visits/slots/${slot.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !slot.active }),
    });
    if (result.success) refreshAll();
    else alert(result.error || "Unable to update time slot.");
  };

  const removeSlot = async (slot: SiteVisitTimeSlot) => {
    const result = await adminFetch(`site-visits/slots/${slot.id}`, { method: "DELETE" });
    if (result.success) refreshAll();
    else alert(result.error || "Unable to remove time slot.");
  };

  const addBlockedDate = async () => {
    if (!newBlock.date) return;
    const result = await adminFetch<SiteVisitBlockedDate>("site-visits/blocked-dates", {
      method: "POST",
      body: JSON.stringify({ date: newBlock.date, reason: newBlock.reason.trim() }),
    });
    if (result.success) {
      setNewBlock({ date: "", reason: "" });
      refreshAll();
    } else {
      alert(result.error || "Unable to block date.");
    }
  };

  const removeBlockedDate = async (blockedDate: SiteVisitBlockedDate) => {
    const result = await adminFetch(`site-visits/blocked-dates/${blockedDate.id}`, { method: "DELETE" });
    if (result.success) refreshAll();
    else alert(result.error || "Unable to remove blocked date.");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-admin-ink">Site Visit Bookings</h1>
          <p className="mt-1 text-sm text-admin-muted">
            {loading ? "Loading calendar reservations..." : `${bookings.filter((b) => b.status === "pending").length} pending requests need confirmation.`}
          </p>
        </div>
        <button
          onClick={loadBookings}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-admin-border bg-admin-surface px-4 py-2.5 text-xs font-semibold text-admin-ink shadow-xs transition-colors hover:border-admin-primary disabled:opacity-50"
        >
          <FiRefreshCw className={loading ? "animate-spin text-admin-primary" : "text-admin-primary"} size={14} />
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {statuses.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
              filter === item.value
                ? "border-admin-primary bg-admin-primary text-white"
                : "border-admin-border bg-admin-surface text-admin-muted hover:border-admin-primary"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="rounded-3xl border border-admin-border bg-admin-surface p-5 shadow-xs">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-admin-ink">Timetable Settings</h2>
            <p className="text-xs text-admin-muted">Control which times customers can reserve from the chat calendar.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-admin-primary">Time Slots</p>
            <div className="space-y-2">
              {timeSlots.map((slot) => (
                <div key={slot.id} className="flex items-center gap-2 rounded-2xl border border-admin-border bg-white p-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-admin-ink">{slot.label}</p>
                    <p className="text-[11px] text-admin-subtle">{slot.value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSlot(slot)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${slot.active ? "bg-[#E7F3E7] text-[#1F5128]" : "bg-admin-canvas text-admin-subtle"}`}
                  >
                    {slot.active ? "Active" : "Off"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSlot(slot)}
                    className="rounded-xl p-2 text-[#A45138] hover:bg-red-50"
                    aria-label="Remove time slot"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px_auto]">
              <input
                value={newSlot.label}
                onChange={(event) => setNewSlot((prev) => ({ ...prev, label: event.target.value }))}
                placeholder="Label, e.g. 6:30 PM"
                className="min-h-10 rounded-xl border border-admin-border bg-white px-3 text-sm outline-none focus:border-admin-primary"
              />
              <input
                value={newSlot.value}
                onChange={(event) => setNewSlot((prev) => ({ ...prev, value: event.target.value }))}
                placeholder="18:30"
                className="min-h-10 rounded-xl border border-admin-border bg-white px-3 text-sm outline-none focus:border-admin-primary"
              />
              <button type="button" onClick={saveSlot} className="rounded-xl bg-admin-ink px-4 py-2 text-xs font-semibold text-white">
                Add Slot
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-admin-primary">Blocked Dates</p>
            <div className="space-y-2">
              {blockedDates.length === 0 ? (
                <p className="rounded-2xl border border-admin-border bg-white p-4 text-xs text-admin-subtle">No blocked dates.</p>
              ) : (
                blockedDates.map((blockedDate) => (
                  <div key={blockedDate.id} className="flex items-center gap-2 rounded-2xl border border-admin-border bg-white p-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-admin-ink">
                        {new Date(blockedDate.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-[11px] text-admin-subtle">{blockedDate.reason || "Unavailable"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBlockedDate(blockedDate)}
                      className="rounded-xl p-2 text-[#A45138] hover:bg-red-50"
                      aria-label="Remove blocked date"
                    >
                      <FiX size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-[150px_1fr_auto]">
              <input
                type="date"
                value={newBlock.date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setNewBlock((prev) => ({ ...prev, date: event.target.value }))}
                className="min-h-10 rounded-xl border border-admin-border bg-white px-3 text-sm outline-none focus:border-admin-primary"
              />
              <input
                value={newBlock.reason}
                onChange={(event) => setNewBlock((prev) => ({ ...prev, reason: event.target.value }))}
                placeholder="Reason optional"
                className="min-h-10 rounded-xl border border-admin-border bg-white px-3 text-sm outline-none focus:border-admin-primary"
              />
              <button type="button" onClick={addBlockedDate} className="rounded-xl bg-admin-ink px-4 py-2 text-xs font-semibold text-white">
                Block Date
              </button>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-3xl bg-admin-tint" />
          ))}
        </div>
      ) : visibleBookings.length === 0 ? (
        <div className="rounded-3xl border border-admin-border bg-admin-surface p-12 text-center text-admin-subtle">
          <FiCalendar className="mx-auto mb-3 text-admin-primary" size={28} />
          <p className="font-semibold text-admin-ink">No site visits found</p>
          <p className="mt-1 text-xs text-admin-muted">New customer reservations from chat will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleBookings.map((booking) => (
            <article key={booking.id} className="rounded-3xl border border-admin-border bg-admin-surface p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-xl font-bold text-admin-ink">{booking.name}</h2>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClass[booking.status]}`}>
                      {booking.status_label}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-admin-primary">
                    <FiCalendar size={13} />
                    {new Date(booking.visit_date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} at {booking.time_slot_label}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={savingId === booking.id}
                  onClick={() => removeBooking(booking)}
                  className="rounded-xl p-2 text-[#A45138] transition-colors hover:bg-red-50 disabled:opacity-40"
                  aria-label="Delete booking"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>

              <div className="mt-4 space-y-2 text-sm text-admin-muted">
                <a href={`tel:${booking.phone}`} className="flex items-center gap-2 font-semibold text-admin-ink hover:underline">
                  <FiPhone size={14} />
                  {booking.phone}
                </a>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`tel:${booking.phone}`}
                    onClick={() => updateBooking(booking, { mark_contacted: true })}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-admin-ink px-3 py-2 text-xs font-semibold text-white"
                  >
                    <FiPhone size={13} />
                    Call & Mark Contacted
                  </a>
                  <a
                    href={whatsappUrl(booking)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => updateBooking(booking, { mark_contacted: true })}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#D5DEC4] bg-[#EDF1EA] px-3 py-2 text-xs font-semibold text-[#1F5128]"
                  >
                    WhatsApp
                  </a>
                </div>
                <p className="flex items-start gap-2">
                  <FiMapPin className="mt-0.5 shrink-0 text-admin-primary" size={14} />
                  <span>{booking.location}</span>
                </p>
                {booking.space_size && <p>Size: {booking.space_size}</p>}
                {booking.email && <p>Email: {booking.email}</p>}
                {booking.project_note && <p className="rounded-2xl bg-admin-canvas p-3 text-xs leading-relaxed text-admin-ink">{booking.project_note}</p>}
              </div>

              <div className="mt-4 rounded-2xl border border-admin-border bg-white p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-admin-primary">Admin Schedule</p>
                <div className="grid gap-2 sm:grid-cols-[1fr_150px_auto]">
                  <input
                    type="date"
                    value={drafts[booking.id]?.visit_date || booking.visit_date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(event) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [booking.id]: {
                          visit_date: event.target.value,
                          time_slot: prev[booking.id]?.time_slot || booking.time_slot,
                        },
                      }))
                    }
                    className="min-h-10 rounded-xl border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none focus:border-admin-primary"
                  />
                  <select
                    value={drafts[booking.id]?.time_slot || booking.time_slot}
                    onChange={(event) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [booking.id]: {
                          visit_date: prev[booking.id]?.visit_date || booking.visit_date,
                          time_slot: event.target.value,
                        },
                      }))
                    }
                    className="min-h-10 rounded-xl border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none focus:border-admin-primary"
                  >
                    {timeSlots.filter((slot) => slot.active).map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={
                      savingId === booking.id ||
                      ((drafts[booking.id]?.visit_date || booking.visit_date) === booking.visit_date &&
                        (drafts[booking.id]?.time_slot || booking.time_slot) === booking.time_slot)
                    }
                    onClick={() =>
                      updateBooking(booking, {
                        visit_date: drafts[booking.id]?.visit_date || booking.visit_date,
                        time_slot: drafts[booking.id]?.time_slot || booking.time_slot,
                      })
                    }
                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-admin-ink px-3 text-xs font-semibold text-white transition-colors hover:bg-admin-elevated disabled:opacity-40"
                  >
                    Save Schedule
                  </button>
                </div>
              </div>

              <textarea
                defaultValue={booking.admin_note || ""}
                onBlur={(event) => {
                  if (event.target.value !== (booking.admin_note || "")) {
                    updateBooking(booking, { admin_note: event.target.value });
                  }
                }}
                placeholder="Admin note after calling customer..."
                rows={2}
                className="mt-4 w-full resize-none rounded-2xl border border-admin-border bg-white px-3 py-2.5 text-sm text-admin-ink outline-none focus:border-admin-primary"
              />

              <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-admin-border bg-admin-canvas p-3 text-[11px] text-admin-muted">
                <p><span className="font-semibold text-admin-ink">Submitted:</span> {formatDateTime(booking.submitted_at)}</p>
                <p><span className="font-semibold text-admin-ink">Contacted:</span> {formatDateTime(booking.last_contacted_at)}</p>
                <p><span className="font-semibold text-admin-ink">Confirmed:</span> {formatDateTime(booking.confirmed_at)}</p>
                <p><span className="font-semibold text-admin-ink">Completed:</span> {formatDateTime(booking.completed_at)}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={savingId === booking.id || booking.status === "confirmed"}
                  onClick={() => updateBooking(booking, { status: "confirmed" })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-admin-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-admin-hover disabled:opacity-40"
                >
                  <FiCheck size={13} />
                  Confirm
                </button>
                <button
                  type="button"
                  disabled={savingId === booking.id || booking.status === "completed"}
                  onClick={() => updateBooking(booking, { status: "completed" })}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-admin-border bg-white px-3 py-2 text-xs font-semibold text-admin-ink transition-colors hover:border-admin-primary disabled:opacity-40"
                >
                  <FiClock size={13} />
                  Completed
                </button>
                <button
                  type="button"
                  disabled={savingId === booking.id || booking.status === "cancelled"}
                  onClick={() => updateBooking(booking, { status: "cancelled" })}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 transition-colors hover:bg-red-100 disabled:opacity-40"
                >
                  <FiX size={13} />
                  Cancel
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
