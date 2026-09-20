"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiMail, FiPhone, FiEye, FiTrash2, FiSearch, FiCheck, FiClock, FiRefreshCw } from "react-icons/fi";
import { adminFetch } from "../../../lib/api";

interface ContactSubmission {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
  read: boolean;
  responded: boolean;
  submitted_at: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await adminFetch<ContactSubmission[]>("contacts");
    if (result.success && Array.isArray(result.data)) {
      setContacts(result.data);
      if (result.data.length > 0 && selectedId === null) {
        setSelectedId(result.data[0].id);
      }
    } else {
      setError(result.error || "Unable to load contact submissions.");
    }
    setLoading(false);
  }, [selectedId]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const term = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        (c.service || "").toLowerCase().includes(term) ||
        (c.message || "").toLowerCase().includes(term)
      );
    });
  }, [contacts, search]);

  const selectedContact = useMemo(() => {
    return contacts.find((c) => String(c.id) === String(selectedId)) || null;
  }, [contacts, selectedId]);

  const markStatus = async (id: string | number, updates: { read?: boolean; responded?: boolean }) => {
    setActionLoading(true);
    const result = await adminFetch<ContactSubmission>(`contacts/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    setActionLoading(false);
    if (result.success && result.data) {
      setContacts((prev) => prev.map((c) => (String(c.id) === String(id) ? { ...c, ...result.data } : c)));
    } else {
      alert(result.error || "Failed to update submission status.");
    }
  };

  const removeContact = async (contact: ContactSubmission) => {
    if (!window.confirm(`Delete message from ${contact.name}?`)) return;
    setActionLoading(true);
    const result = await adminFetch(`contacts/${contact.id}`, { method: "DELETE" });
    setActionLoading(false);
    if (result.success) {
      setContacts((prev) => prev.filter((c) => String(c.id) !== String(contact.id)));
      if (String(selectedId) === String(contact.id)) {
        setSelectedId(null);
      }
    } else {
      alert(result.error || "Failed to delete submission.");
    }
  };

  const handleSelect = (contact: ContactSubmission) => {
    setSelectedId(contact.id);
    if (!contact.read) {
      markStatus(contact.id, { read: true });
    }
  };

  const unreadCount = contacts.filter((c) => !c.read).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-admin-ink tracking-tight">Contact Submissions</h1>
          <p className="text-admin-muted text-sm mt-1">
            {loading ? "Loading inquiries..." : `${unreadCount} unread ${unreadCount === 1 ? "inquiry" : "inquiries"} received from public portal.`}
          </p>
        </div>
        <button
          onClick={loadContacts}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-admin-surface border border-admin-border hover:border-admin-primary text-xs font-semibold text-admin-ink transition-colors shadow-xs disabled:opacity-50"
        >
          <FiRefreshCw className={loading ? "animate-spin text-admin-primary" : "text-admin-primary"} size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="relative flex-1">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-subtle" size={16} />
        <input
          type="text"
          placeholder="Search messages by name, email, service, or keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-admin-surface border border-admin-border rounded-2xl pl-11 pr-4 py-3 text-xs text-admin-ink placeholder:text-admin-subtle focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/20 transition-all shadow-xs"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <div className="bg-admin-surface border border-admin-border rounded-3xl overflow-hidden min-h-[420px] shadow-xs flex flex-col">
          <div className="px-5 py-3.5 border-b border-admin-border bg-admin-canvas/60 flex items-center justify-between text-xs font-semibold text-admin-primary uppercase tracking-wider">
            <span>Inbox Messages</span>
            <span className="text-admin-subtle font-normal lowercase">{filtered.length} total</span>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-admin-tint" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-admin-subtle my-auto">
              <div className="w-12 h-12 rounded-2xl bg-admin-canvas border border-admin-border flex items-center justify-center mx-auto text-admin-primary mb-3">
                <FiMail size={22} />
              </div>
              <p className="font-semibold text-admin-ink">No inquiries found</p>
              <p className="text-xs text-admin-muted mt-1">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-admin-border overflow-y-auto max-h-[600px]">
              {filtered.map((contact) => {
                const isSelected = String(selectedId) === String(contact.id);
                return (
                  <div
                    key={contact.id}
                    onClick={() => handleSelect(contact)}
                    className={`p-4 cursor-pointer hover:bg-admin-canvas transition-colors ${
                      isSelected ? "bg-admin-tint border-l-4 border-admin-primary" : ""
                    } ${!contact.read ? "bg-admin-primary/5" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-admin-ink text-admin-surface flex items-center justify-center font-serif font-bold text-xs shrink-0 shadow-xs">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-admin-ink truncate flex items-center gap-2">
                            <span>{contact.name}</span>
                            {!contact.read && (
                              <span className="w-2 h-2 rounded-full bg-admin-primary" title="Unread" />
                            )}
                          </div>
                          <div className="text-[11px] text-admin-muted truncate">{contact.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {contact.responded ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200">
                            Replied
                          </span>
                        ) : !contact.read ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200">
                            New
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-admin-canvas text-admin-subtle border-admin-border">
                            Read
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-admin-muted mb-2 line-clamp-2 leading-relaxed">{contact.message}</p>
                    <div className="flex items-center justify-between text-[11px] text-admin-subtle">
                      <span className="text-admin-primary font-semibold">{contact.service || "General Inquiry"}</span>
                      <span>{new Date(contact.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Message Detail */}
        <div className="bg-admin-surface border border-admin-border rounded-3xl overflow-hidden min-h-[420px] shadow-xs flex flex-col">
          {selectedContact ? (
            <div className="p-6 sm:p-8 h-full flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-6 pb-5 border-b border-admin-border">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-admin-ink text-admin-surface flex items-center justify-center font-serif font-bold text-base shadow-xs">
                      {selectedContact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-serif text-lg font-bold text-admin-ink">{selectedContact.name}</h2>
                      <p className="text-xs text-admin-muted">{selectedContact.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => markStatus(selectedContact.id, { responded: !selectedContact.responded })}
                      disabled={actionLoading}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                        selectedContact.responded
                          ? "bg-admin-canvas text-admin-muted border-admin-border hover:bg-admin-tint"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                      }`}
                    >
                      <FiCheck size={12} /> {selectedContact.responded ? "Mark Pending" : "Mark Replied"}
                    </button>
                    <button
                      onClick={() => removeContact(selectedContact)}
                      disabled={actionLoading}
                      aria-label={`Delete message from ${selectedContact.name}`}
                      className="p-2 rounded-xl hover:bg-red-50 text-admin-subtle hover:text-red-600 transition-colors border border-transparent hover:border-red-200"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white rounded-2xl p-4 border border-admin-border shadow-2xs">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-admin-primary uppercase tracking-wider mb-1">
                      <FiPhone size={12} /> Phone
                    </div>
                    <div className="text-xs font-semibold text-admin-ink">{selectedContact.phone || "Not provided"}</div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-admin-border shadow-2xs">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-admin-subtle uppercase tracking-wider mb-1">
                      <FiClock size={12} /> Date Received
                    </div>
                    <div className="text-xs font-semibold text-admin-ink">
                      {new Date(selectedContact.submitted_at).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-[11px] font-semibold text-admin-primary uppercase tracking-wider mb-1">Service Requested</div>
                  <div className="text-sm font-semibold text-admin-ink">
                    {selectedContact.service || "General Inquiry"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-admin-subtle uppercase tracking-wider mb-2">Message Body</div>
                  <div className="bg-white border border-admin-border rounded-2xl p-5 text-xs text-admin-ink leading-relaxed whitespace-pre-wrap shadow-2xs">
                    {selectedContact.message}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-admin-border flex flex-col sm:flex-row gap-3">
                <a
                  href={`mailto:${selectedContact.email}?subject=${encodeURIComponent(
                    `Re: Bangla Sketch Inquiry (${selectedContact.service || "Consultation"})`
                  )}`}
                  className="flex-1 px-5 py-3 bg-admin-primary hover:bg-admin-hover text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <FiMail size={15} /> Reply via Email
                </a>
                {selectedContact.phone && (
                  <a
                    href={`https://wa.me/${selectedContact.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Hello ${selectedContact.name}, thank you for contacting Bangla Sketch!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 bg-admin-surface border border-admin-border hover:border-admin-primary text-admin-ink rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <FiPhone size={15} className="text-admin-primary" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-admin-subtle p-8 text-center my-auto">
              <div className="w-12 h-12 rounded-2xl bg-admin-canvas border border-admin-border flex items-center justify-center mx-auto text-admin-primary mb-3">
                <FiEye size={22} />
              </div>
              <p className="font-semibold text-admin-ink">No message selected</p>
              <p className="text-xs text-admin-muted mt-1 max-w-xs">Select an inquiry from the list on the left to read full message details and respond.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
