"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import SignatureInput from "./SignatureInput";
import {
  FiPlus,
  FiPrinter,
  FiSave,
  FiTrash2,
  FiMail,
  FiSend,
  FiX,
  FiCheck,
  FiCopy,
  FiSearch,
  FiFileText,
  FiFolder,
  FiEdit2,
  FiExternalLink,
  FiCopy as FiClone,
  FiRefreshCw,
  FiArrowRight,
  FiClock,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { BRAND_NAME_EN, CONTACT } from "@/lib/constants";
import { adminFetch } from "@/lib/api";
import { invoiceTotals, type InvoiceItem } from "./calculations";
import "./invoice.css";

type Invoice = {
  revision?: number; cloudSaved?: boolean; updatedAt?: string;
  signature: string; signatory: string; signatoryTitle: string; signatureEnabled: boolean; clientSignature: boolean;
  id: string; number: string; issued: string; due: string;
  company: string; address: string; phone: string; email: string;
  client: string; clientCompany: string; clientAddress: string; clientPhone: string; clientEmail: string;
  project: string; location: string; notes: string; payment: string; terms: string;
  discount: number; tax: number; paid: number; items: InvoiceItem[];
};

type InvoiceSummary = {
  id: string;
  number: string;
  client?: string;
  project?: string;
  issued?: string;
  due?: string;
  clientPhone?: string;
  clientEmail?: string;
  revision?: number;
  cloudSaved?: boolean;
  updatedAt?: string;
};

const STORAGE = "banglasketch-invoices-v1";
const WORKING_DRAFT = "banglasketch-invoice-working-v1";

function newInvoice(): Invoice {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const id = crypto.randomUUID();
  return {
    id,
    revision: 0,
    signature: "",
    signatory: "",
    signatoryTitle: "Authorized signatory",
    signatureEnabled: true,
    clientSignature: false,
    number: `BS-${date.replaceAll("-", "")}-${id.slice(0, 6).toUpperCase()}`,
    issued: date,
    due: "",
    company: BRAND_NAME_EN,
    address: CONTACT.address,
    phone: CONTACT.phone,
    email: CONTACT.email,
    client: "",
    clientCompany: "",
    clientAddress: "",
    clientPhone: "",
    clientEmail: "",
    project: "",
    location: "",
    notes: "",
    payment: "",
    terms: "Payment is due by the date shown on this invoice.",
    discount: 0,
    tax: 0,
    paid: 0,
    items: [{ description: "Interior design consultation", quantity: 1, rate: 0 }],
  };
}

const money = (value: number) => new Intl.NumberFormat("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const dateLabel = (value: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function validDraft(value: unknown): value is Invoice {
  if (!value || typeof value !== "object") return false;
  const v = value as Invoice;
  return (
    ["id", "number", "issued", "due", "company", "address", "phone", "email", "client", "clientCompany", "clientAddress", "clientPhone", "clientEmail", "project", "location", "notes", "payment", "terms"].every(
      key => typeof (v as unknown as Record<string, unknown>)[key] === "string"
    ) &&
    [v.discount, v.tax, v.paid].every(n => Number.isFinite(n) && n >= 0) &&
    v.discount <= 100 &&
    v.tax <= 100 &&
    Array.isArray(v.items) &&
    v.items.length > 0 &&
    v.items.every(i => i && typeof i.description === "string" && Number.isFinite(i.quantity) && i.quantity > 0 && Number.isFinite(i.rate) && i.rate >= 0)
  );
}

function formatBDPhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("01")) return `88${digits}`;
  return digits;
}

function InvoicePaper({ invoice: v }: { invoice: Invoice }) {
  const t = invoiceTotals(v.items, v.discount, v.tax, v.paid);
  return (
    <article className="invoice-paper">
      <div className="invoice-brand">
        <Image src="/brand-logo.png" width={98} height={79} alt="Bangla Sketch" className="invoice-logo" unoptimized />
        <div className="invoice-brand-name">
          <strong>{v.company}</strong>
          <span>Architecture & Interior Design</span>
        </div>
        <div className="invoice-contact">
          <p>{v.address}</p>
          <p>{v.phone}<br />{v.email}</p>
        </div>
      </div>
      <div className="invoice-title">
        <div>
          <h1>Invoice</h1>
          <p># {v.number}</p>
        </div>
        <dl>
          <div><dt>Date issued</dt><dd>{dateLabel(v.issued)}</dd></div>
          <div><dt>Payment due</dt><dd>{dateLabel(v.due)}</dd></div>
          <div><dt>Currency</dt><dd>BDT</dd></div>
        </dl>
      </div>
      <div className="invoice-details">
        <section>
          <h2>Bill to</h2>
          <strong>{v.client || "Client name"}</strong>
          {[v.clientCompany, v.clientAddress, v.clientPhone, v.clientEmail].filter(Boolean).map((text, i) => <p key={i}>{text}</p>)}
        </section>
        <section>
          <h2>Project</h2>
          <p>{v.project || "—"}</p>
          {v.location && <p>{v.location}</p>}
        </section>
      </div>
      <table className="invoice-table">
        <thead>
          <tr>
            <th>Service description</th>
            <th>Qty / Units</th>
            <th>Rate (BDT)</th>
            <th>Total (BDT)</th>
          </tr>
        </thead>
        <tbody>
          {v.items.map((item, i) => (
            <tr key={i}>
              <td>{item.description || "—"}</td>
              <td>{item.quantity}</td>
              <td>{money(item.rate)}</td>
              <td>{money(t.lines[i])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="invoice-summary">
        <section>
          <h2>Additional notes</h2>
          <p>{v.notes || "Thank you for choosing Bangla Sketch for your space."}</p>
        </section>
        <dl>
          {[
            ["Subtotal", t.subtotal],
            ...(v.discount ? [[`Discount (${v.discount}%)`, -t.discount]] : []),
            ...(v.tax ? [[`Tax (${v.tax}%)`, t.tax]] : []),
            ["Invoice total", t.total],
            ["Amount paid", v.paid],
          ].map(([label, amount]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{money(Number(amount))}</dd>
            </div>
          ))}
          <div className="invoice-total">
            <dt>Total due</dt>
            <dd>BDT {money(t.due)}</dd>
          </div>
          {t.credit > 0 && (
            <div>
              <dt>Credit balance</dt>
              <dd>BDT {money(t.credit)}</dd>
            </div>
          )}
        </dl>
      </div>
      <footer className="invoice-footer">
        <section>
          <h2>Payment methods</h2>
          <p>{v.payment || "Please contact us for payment details."}</p>
        </section>
        <section>
          <h2>Payment terms</h2>
          <p>{v.terms}</p>
        </section>
      </footer>
      {(v.signatureEnabled || v.clientSignature) && (
        <div className="invoice-signatures">
          {v.signatureEnabled && (
            <section>
              <div className="invoice-signature-space">
                {v.signature && <Image src={v.signature} width={190} height={60} alt="Authorized signature" unoptimized />}
              </div>
              <div className="invoice-sign-line">
                <strong>{v.signatory || v.company}</strong>
                <span>{v.signatoryTitle || "Authorized signatory"}</span>
              </div>
            </section>
          )}
          {v.clientSignature && (
            <section>
              <div className="invoice-signature-space" />
              <div className="invoice-sign-line">
                <strong>Client acceptance</strong>
                <span>Signature & date</span>
              </div>
            </section>
          )}
        </div>
      )}
      <p className="invoice-thanks">Thank you for choosing {v.company}. Thoughtful spaces, made for you.</p>
    </article>
  );
}

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<"editor" | "saved">("editor");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [drafts, setDrafts] = useState<InvoiceSummary[]>([]);
  const [localDrafts, setLocalDrafts] = useState<Invoice[]>([]);
  const [busy, setBusy] = useState(false);
  const [cloudLoading, setCloudLoading] = useState(true);
  const saveInProgress = useRef(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const edited = useRef(false);
  const invoiceCache = useRef<Record<string, Invoice>>({});

  // Search & Filter for Previous Invoices
  const [searchQuery, setSearchQuery] = useState("");

  // WhatsApp Share Modal State
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappLang, setWhatsappLang] = useState<"en" | "bn">("en");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappTargetInvoice, setWhatsappTargetInvoice] = useState<Invoice | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Email Delivery Modal State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailNote, setEmailNote] = useState("");
  const [emailTargetInvoice, setEmailTargetInvoice] = useState<Invoice | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState("");

  const refreshCloudInvoices = async () => {
    setCloudLoading(true);
    try {
      const result = await adminFetch<InvoiceSummary[]>("invoices");
      if (result.success && result.data) {
        setDrafts(result.data);
      } else {
        setMessage(result.error || "Could not load saved invoices.");
      }
    } catch {
      setMessage("Could not connect to invoice service.");
    } finally {
      setCloudLoading(false);
    }
  };

  useEffect(() => {
    let initial = newInvoice();
    try {
      const draft: unknown = JSON.parse(sessionStorage.getItem(WORKING_DRAFT) || "null");
      if (validDraft(draft)) {
        initial = { ...initial, ...draft };
        edited.current = true;
        setDirty(true);
        setMessage("Your unsaved invoice draft has been restored in this tab.");
      }
    } catch {
      setMessage("Draft recovery is unavailable in this browser.");
    }
    setInvoice(initial);
    invoiceCache.current[initial.id] = initial;

    try {
      const data: unknown = JSON.parse(localStorage.getItem(STORAGE) || "[]");
      if (Array.isArray(data) && data.every(validDraft)) {
        setLocalDrafts(data);
        data.forEach(d => { invoiceCache.current[d.id] = d; });
      }
    } catch {}

    let active = true;
    adminFetch<InvoiceSummary[]>("invoices").then(result => {
      if (!active) return;
      if (result.success && result.data) setDrafts(result.data);
      else setMessage(result.error || "Could not load cloud invoices. Refresh to retry.");
    }).finally(() => {
      if (active) setCloudLoading(false);
    });

    adminFetch<{ contact?: Partial<typeof CONTACT>; general?: { siteName?: string } }>("settings").then(result => {
      if (active && !edited.current && result.success && result.data) {
        const { contact, general } = result.data;
        setInvoice(current =>
          current
            ? {
                ...current,
                company: general?.siteName || current.company,
                address: contact?.address || current.address,
                phone: contact?.phone && !/1700[ -]?000000/.test(contact.phone) ? contact.phone : current.phone,
                email: contact?.email || current.email,
              }
            : current
        );
      }
    }).catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const rememberDraft = (draft: Invoice) => {
    try {
      sessionStorage.setItem(WORKING_DRAFT, JSON.stringify(draft));
      invoiceCache.current[draft.id] = draft;
    } catch {
      setMessage("This browser could not back up your draft. Save before leaving this page.");
    }
  };

  const clearDraft = () => {
    try {
      sessionStorage.removeItem(WORKING_DRAFT);
    } catch {}
  };

  const update = <K extends keyof Invoice>(key: K, value: Invoice[K]) => {
    if (!invoice) return;
    edited.current = true;
    const next = { ...invoice, [key]: value };
    rememberDraft(next);
    setInvoice(next);
    setDirty(true);
  };

  const field = (label: string, key: keyof Invoice, type = "text", required = false) => {
    if (!invoice) return null;
    return (
      <label className="invoice-field">
        {label}
        <input
          type={type}
          value={String(invoice[key])}
          required={required}
          min={type === "date" && key === "due" ? invoice.issued : undefined}
          onChange={e => update(key, e.target.value)}
        />
      </label>
    );
  };

  const area = (label: string, key: "address" | "clientAddress" | "notes" | "payment" | "terms") => {
    if (!invoice) return null;
    return (
      <label className="invoice-field">
        {label}
        <textarea rows={3} value={invoice[key]} onChange={e => update(key, e.target.value)} />
      </label>
    );
  };

  const save = async (print = false): Promise<Invoice | null> => {
    if (!invoice || saveInProgress.current) return null;
    const pdfWindow = print ? window.open("about:blank", "_blank") : null;
    if (pdfWindow) {
      pdfWindow.opener = null;
      pdfWindow.document.title = "Preparing invoice PDF…";
    }
    saveInProgress.current = true;
    setBusy(true);
    setMessage("Creating your PDF and saving to Cloudinary…");
    try {
      const result = await adminFetch<Invoice>("invoices", { method: "POST", body: JSON.stringify(invoice) });
      if (!result.success || !result.data) throw new Error(result.error || "Could not save invoice.");
      const saved = result.data;
      setInvoice(saved);
      invoiceCache.current[saved.id] = saved;
      setDirty(false);
      clearDraft();
      setDrafts(current => [
        {
          id: saved.id,
          number: saved.number,
          client: saved.client,
          project: saved.project,
          issued: saved.issued,
          due: saved.due,
          clientPhone: saved.clientPhone,
          clientEmail: saved.clientEmail,
          revision: saved.revision,
          cloudSaved: true,
          updatedAt: saved.updatedAt,
        },
        ...current.filter(d => d.id !== saved.id),
      ]);
      setMessage(`Saved to Cloudinary • Revision ${saved.revision}. Your invoice is available across devices.`);
      const remaining = localDrafts.filter(d => d.id !== saved.id);
      setLocalDrafts(remaining);
      try { localStorage.setItem(STORAGE, JSON.stringify(remaining)); } catch {}

      if (print) {
        const pdfUrl = `/api/admin/proxy/invoices/${saved.id}/pdf`;
        if (pdfWindow && !pdfWindow.closed) {
          pdfWindow.location.replace(pdfUrl);
          setMessage("Saved. The archived PDF is open in a new tab; use its print button to print the exact saved document.");
        } else {
          setMessage("Saved. Your browser blocked the PDF tab. Use Open saved PDF, then print from the PDF viewer.");
        }
      }
      return saved;
    } catch (err) {
      pdfWindow?.close();
      setMessage(err instanceof Error ? err.message : "Save failed. Please retry.");
      return null;
    } finally {
      saveInProgress.current = false;
      setBusy(false);
    }
  };

  const loadInvoice = async (id: string, switchTab = true) => {
    if (!canSwitch()) return;

    // Check fast in-memory cache first
    if (invoiceCache.current[id]) {
      const cached = invoiceCache.current[id];
      setInvoice(cached);
      setDirty(false);
      clearDraft();
      setMessage(`Loaded Invoice #${cached.number}`);
      if (switchTab) setActiveTab("editor");
      return;
    }

    setBusy(true);
    try {
      const result = await adminFetch<Invoice>(`invoices/${id}`);
      if (!result.success || !result.data) throw new Error(result.error || "Could not load invoice.");
      const loaded = result.data;
      setInvoice(loaded);
      invoiceCache.current[loaded.id] = loaded;
      setDirty(false);
      clearDraft();
      setMessage(`Loaded Invoice #${loaded.number}`);
      if (switchTab) setActiveTab("editor");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not load invoice.");
    } finally {
      setBusy(false);
    }
  };

  const duplicateInvoice = async (sourceId: string) => {
    if (!canSwitch()) return;

    let source = invoiceCache.current[sourceId];
    if (!source) {
      setBusy(true);
      try {
        const result = await adminFetch<Invoice>(`invoices/${sourceId}`);
        if (!result.success || !result.data) throw new Error("Could not load invoice to duplicate.");
        source = result.data;
        invoiceCache.current[sourceId] = source;
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to duplicate invoice.");
        setBusy(false);
        return;
      } finally {
        setBusy(false);
      }
    }

    const template = newInvoice();
    const cloned: Invoice = {
      ...source,
      id: template.id,
      number: template.number,
      issued: template.issued,
      due: template.due,
      revision: 0,
      cloudSaved: false,
    };

    setInvoice(cloned);
    rememberDraft(cloned);
    setDirty(true);
    setActiveTab("editor");
    setMessage(`Created new invoice draft cloned from #${source.number}. Review and save.`);
  };

  const canSwitch = () => {
    edited.current = true;
    const allowed = !dirty || window.confirm("Discard unsaved invoice changes in the editor?");
    if (allowed) clearDraft();
    return allowed;
  };

  const getPdfShareUrl = (invoiceId: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/invoices/${invoiceId}/pdf`;
    }
    return `/api/invoices/${invoiceId}/pdf`;
  };

  const generateWhatsAppTextFor = (inv: Invoice, lang: "en" | "bn" = whatsappLang) => {
    const t = invoiceTotals(inv.items, inv.discount, inv.tax, inv.paid);
    const clientName = inv.client.trim() || (lang === "bn" ? "গ্রাহক" : "Client");
    const project = inv.project.trim() || (lang === "bn" ? "প্রজেক্ট" : "Interior Design");
    const dueAmount = money(t.due);
    const pdfUrl = getPdfShareUrl(inv.id);
    const company = inv.company || BRAND_NAME_EN;

    if (lang === "bn") {
      return `প্রিয় ${clientName}, ${company} থেকে আপনার '${project}' প্রজেক্টের ইনভয়েস #${inv.number} প্রস্তুত হয়েছে। মোট প্রদেয়: BDT ${dueAmount}। PDF ইনভয়েস দেখতে লিংকটিতে ক্লিক করুন: ${pdfUrl}\n\nধন্যবাদ, ${company}।`;
    }
    return `Dear ${clientName}, your invoice #${inv.number} from ${company} for ${project} is ready. Total due: BDT ${dueAmount}. View PDF: ${pdfUrl}\n\nThank you for choosing ${company}.`;
  };

  const handleOpenWhatsAppModal = async (targetInv?: Invoice) => {
    let inv = targetInv || invoice;
    if (!inv) return;
    if (inv.id === invoice?.id && (dirty || !inv.cloudSaved)) {
      const saved = await save(false);
      if (!saved) return;
      inv = saved;
    }
    setWhatsappTargetInvoice(inv);
    setWhatsappPhone(inv.clientPhone || "");
    setCopiedWhatsApp(false);
    setWhatsappModalOpen(true);
  };

  const handleSendWhatsApp = () => {
    const inv = whatsappTargetInvoice || invoice;
    if (!inv) return;
    const text = generateWhatsAppTextFor(inv, whatsappLang);
    const cleaned = formatBDPhone(whatsappPhone || inv.clientPhone || "");
    const waUrl = cleaned
      ? `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setWhatsappModalOpen(false);
  };

  const handleCopyWhatsApp = async () => {
    const inv = whatsappTargetInvoice || invoice;
    if (!inv) return;
    const text = generateWhatsAppTextFor(inv, whatsappLang);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2500);
    } catch {}
  };

  const handleOpenEmailModal = (targetInv?: Invoice) => {
    const inv = targetInv || invoice;
    if (!inv) return;
    setEmailTargetInvoice(inv);
    setEmailRecipient(inv.clientEmail || "");
    setEmailNote("");
    setEmailError("");
    setEmailModalOpen(true);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const inv = emailTargetInvoice || invoice;
    if (!inv) return;
    if (!emailRecipient.trim()) {
      setEmailError("Please enter a valid client recipient email address.");
      return;
    }
    setEmailSending(true);
    setEmailError("");

    try {
      let currentInvoice = inv;
      if (inv.id === invoice?.id && (dirty || !invoice.cloudSaved)) {
        setMessage("Saving latest invoice changes before emailing…");
        const saved = await save(false);
        if (!saved) throw new Error("Please save the invoice before sending the email.");
        currentInvoice = saved;
      }

      const res = await adminFetch<{ success: boolean; message?: string }>(
        `invoices/${currentInvoice.id}/send-email`,
        {
          method: "POST",
          body: JSON.stringify({
            recipient_email: emailRecipient.trim(),
            custom_notes: emailNote.trim(),
          }),
        }
      );

      if (!res.success) {
        throw new Error(res.error || "Failed to deliver email. Please check server settings.");
      }

      setEmailModalOpen(false);
      setMessage(res.data?.message || `Invoice #${currentInvoice.number} was emailed successfully to ${emailRecipient}.`);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed to send email.");
    } finally {
      setEmailSending(false);
    }
  };

  // Filtered list of previous invoices
  const filteredDrafts = useMemo(() => {
    if (!searchQuery.trim()) return drafts;
    const q = searchQuery.toLowerCase().trim();
    return drafts.filter(
      d =>
        d.number.toLowerCase().includes(q) ||
        (d.client && d.client.toLowerCase().includes(q)) ||
        (d.project && d.project.toLowerCase().includes(q)) ||
        (d.clientPhone && d.clientPhone.toLowerCase().includes(q)) ||
        (d.clientEmail && d.clientEmail.toLowerCase().includes(q)) ||
        (d.issued && d.issued.includes(q))
    );
  }, [drafts, searchQuery]);

  if (!invoice) return <p className="p-8 text-center text-admin-muted">Loading invoice workspace…</p>;

  return (
    <div className="invoice-workspace">
      {/* Top Header & View Tabs */}
      <div className="invoice-toolbar">
        <div>
          <p className="text-xs uppercase tracking-widest text-admin-primary font-semibold">Studio Accounts</p>
          <h1 className="text-3xl font-serif mt-1">Invoice Management</h1>
          <p className="text-sm text-admin-muted mt-1">Branded invoices, instant PDF archiving, WhatsApp sharing & email dispatch.</p>
        </div>

        <div className="invoice-header-controls">
          <div className="invoice-nav-tabs">
            <button
              type="button"
              className={`invoice-tab-btn ${activeTab === "editor" ? "active" : ""}`}
              onClick={() => setActiveTab("editor")}
            >
              <FiEdit2 size={14} /> Invoice Editor
            </button>
            <button
              type="button"
              className={`invoice-tab-btn ${activeTab === "saved" ? "active" : ""}`}
              onClick={() => setActiveTab("saved")}
            >
              <FiFolder size={14} /> Previous Invoices
              <span className="invoice-tab-badge">{drafts.length}</span>
            </button>
          </div>

          <button
            type="button"
            className="invoice-btn-new"
            disabled={busy}
            onClick={() => {
              if (canSwitch()) {
                setInvoice({ ...newInvoice(), company: invoice.company, address: invoice.address, phone: invoice.phone, email: invoice.email });
                setDirty(false);
                setMessage("New invoice template initialized.");
                setActiveTab("editor");
              }
            }}
          >
            <FiPlus /> New Invoice
          </button>
        </div>
      </div>

      {message && <p role="status" className="invoice-message">{message}</p>}

      {/* ========================================================================= */}
      {/* TAB 1: PREVIOUS / SAVED INVOICES LIST (Fast Search, Filters, 1-Click Open) */}
      {/* ========================================================================= */}
      {activeTab === "saved" ? (
        <section className="invoice-saved-hub">
          <div className="invoice-saved-topbar">
            <div className="invoice-search-box">
              <FiSearch className="invoice-search-icon" />
              <input
                type="text"
                placeholder="Search by invoice number, client name, project, phone, or date…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button type="button" className="invoice-search-clear" onClick={() => setSearchQuery("")}>
                  <FiX size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="invoice-btn-refresh"
                disabled={cloudLoading}
                onClick={refreshCloudInvoices}
                title="Refresh saved invoices from cloud"
              >
                <FiRefreshCw className={cloudLoading ? "animate-spin" : ""} size={14} /> Refresh
              </button>
            </div>
          </div>

          <div className="invoice-saved-status">
            <p>
              Showing <strong>{filteredDrafts.length}</strong> of <strong>{drafts.length}</strong> saved studio invoices
              {searchQuery ? ` matching "${searchQuery}"` : ""}.
            </p>
          </div>

          {cloudLoading && drafts.length === 0 ? (
            <div className="invoice-empty-state">
              <FiRefreshCw className="animate-spin text-2xl text-admin-primary mb-2" />
              <p>Loading your saved invoices from the cloud…</p>
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="invoice-empty-state">
              <FiFileText className="text-3xl text-gray-400 mb-2" />
              <p className="font-semibold text-gray-700">No invoices match your search.</p>
              <p className="text-xs text-gray-500 mt-1">Try clearing your search terms or create a new invoice.</p>
              {searchQuery && (
                <button type="button" className="mt-3 text-xs text-admin-primary underline" onClick={() => setSearchQuery("")}>
                  Clear search query
                </button>
              )}
            </div>
          ) : (
            <div className="invoice-cards-grid">
              {filteredDrafts.map(d => {
                const isActiveInEditor = invoice.id === d.id;
                return (
                  <div key={d.id} className={`invoice-saved-card ${isActiveInEditor ? "is-active" : ""}`}>
                    <div className="invoice-card-header">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="invoice-card-number">#{d.number}</span>
                          {isActiveInEditor && <span className="invoice-active-tag">Active in Editor</span>}
                        </div>
                        <h3 className="invoice-card-client">{d.client || "Unnamed Client"}</h3>
                        {d.project && <p className="invoice-card-project">{d.project}</p>}
                      </div>
                      <div className="text-right">
                        <span className="invoice-rev-badge">Rev {d.revision || 1}</span>
                        {d.issued && <p className="invoice-card-date mt-1"><FiClock size={11} className="inline mr-1" />{dateLabel(d.issued)}</p>}
                      </div>
                    </div>

                    <div className="invoice-card-contact">
                      {d.clientPhone && <span>📞 {d.clientPhone}</span>}
                      {d.clientEmail && <span>✉️ {d.clientEmail}</span>}
                    </div>

                    <div className="invoice-card-actions">
                      <button
                        type="button"
                        className="invoice-card-btn-open"
                        onClick={() => { void loadInvoice(d.id, true); }}
                        title="Open and edit invoice"
                      >
                        <FiEdit2 size={13} /> Open & Edit
                      </button>

                      <button
                        type="button"
                        className="invoice-card-btn-clone"
                        onClick={() => { void duplicateInvoice(d.id); }}
                        title="Duplicate as a new invoice template"
                      >
                        <FiClone size={13} /> Clone
                      </button>

                      <a
                        className="invoice-card-btn-pdf"
                        href={`/api/admin/proxy/invoices/${d.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open archived PDF in new tab"
                      >
                        <FiExternalLink size={13} /> PDF ↗
                      </a>

                      <button
                        type="button"
                        className="invoice-card-btn-wa"
                        onClick={async () => {
                          let full = invoiceCache.current[d.id];
                          if (!full) {
                            const res = await adminFetch<Invoice>(`invoices/${d.id}`);
                            if (res.success && res.data) {
                              full = res.data;
                              invoiceCache.current[d.id] = full;
                            }
                          }
                          if (full) handleOpenWhatsAppModal(full);
                        }}
                        title="Share on WhatsApp"
                      >
                        <FaWhatsapp size={14} />
                      </button>

                      <button
                        type="button"
                        className="invoice-card-btn-email"
                        onClick={async () => {
                          let full = invoiceCache.current[d.id];
                          if (!full) {
                            const res = await adminFetch<Invoice>(`invoices/${d.id}`);
                            if (res.success && res.data) {
                              full = res.data;
                              invoiceCache.current[d.id] = full;
                            }
                          }
                          if (full) handleOpenEmailModal(full);
                        }}
                        title="Send invoice via email"
                      >
                        <FiMail size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {localDrafts.length > 0 && (
            <div className="invoice-local-drafts-panel mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Unmigrated Local Browser Drafts</h4>
              <div className="flex flex-wrap gap-2">
                {localDrafts
                  .filter(d => !drafts.some(cloud => cloud.id === d.id))
                  .map(d => (
                    <button
                      key={d.id}
                      type="button"
                      className="text-xs bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-lg hover:bg-amber-100 flex items-center gap-1.5"
                      onClick={() => {
                        if (canSwitch()) {
                          const restored = { ...newInvoice(), ...d, revision: 0, cloudSaved: false };
                          rememberDraft(restored);
                          setInvoice(restored);
                          setDirty(true);
                          setActiveTab("editor");
                          setMessage("Loaded local draft. Choose 'Save to Cloudinary' to archive it to the cloud.");
                        }
                      }}
                    >
                      <span>📂 {d.number} — {d.client || "Draft"}</span>
                      <FiArrowRight size={12} />
                    </button>
                  ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        /* ========================================================================= */
        /* TAB 2: INVOICE EDITOR & REAL-TIME PREVIEW                                  */
        /* ========================================================================= */
        <>
          <div className="invoice-quick-bar">
            <label className="invoice-quick-select">
              <span className="text-xs font-semibold text-gray-600">Quick Switch Invoice:</span>
              <select
                disabled={busy || cloudLoading}
                value={drafts.some(d => d.id === invoice.id) ? invoice.id : ""}
                onChange={e => { void loadInvoice(e.target.value, false); }}
              >
                <option value="" disabled>
                  {cloudLoading ? "Loading invoices…" : "Choose a saved invoice…"}
                </option>
                {drafts.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.number} — {d.client || "Unnamed"} ({d.project || "Project"})
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="invoice-btn-view-all"
                onClick={() => setActiveTab("saved")}
              >
                <FiFolder size={13} /> View All Saved Invoices ({drafts.length})
              </button>

              {invoice.cloudSaved && (
                <a
                  className="invoice-pdf-link"
                  href={`/api/admin/proxy/invoices/${invoice.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open saved PDF ↗
                </a>
              )}
            </div>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              const action = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value");
              void save(action === "print");
            }}
          >
            <fieldset disabled={busy}>
              <div className="invoice-editor">
                <section>
                  <h2>Company details</h2>
                  <div className="invoice-fields">
                    {field("Company name", "company", "text", true)}
                    {field("Phone", "phone", "tel")}
                    {field("Email", "email", "email")}
                    {area("Company address", "address")}
                  </div>
                </section>

                <section>
                  <h2>Invoice & client</h2>
                  <div className="invoice-fields">
                    {field("Invoice number", "number", "text", true)}
                    {field("Date issued", "issued", "date", true)}
                    {field("Due date", "due", "date", true)}
                    {field("Client name", "client", "text", true)}
                    {field("Client company", "clientCompany")}
                    {field("Client phone", "clientPhone", "tel")}
                    {field("Client email", "clientEmail", "email")}
                    {area("Billing address", "clientAddress")}
                    {field("Project name", "project")}
                    {field("Project location", "location")}
                  </div>
                </section>

                <section className="invoice-wide">
                  <h2>Services & pricing <span>BDT</span></h2>
                  {invoice.items.map((item, i) => (
                    <div className="invoice-item" key={i}>
                      <label className="invoice-field">
                        Service description
                        <input
                          required
                          value={item.description}
                          onChange={e =>
                            update(
                              "items",
                              invoice.items.map((it, j) => (j === i ? { ...it, description: e.target.value } : it))
                            )
                          }
                        />
                      </label>
                      {(["quantity", "rate"] as const).map(key => (
                        <label className="invoice-field" key={key}>
                          {key === "quantity" ? "Quantity / units" : "Unit price (BDT)"}
                          <input
                            type="number"
                            required
                            min={key === "quantity" ? "0.01" : "0"}
                            max={key === "quantity" ? "1000000" : "100000000"}
                            step="0.01"
                            value={item[key]}
                            onChange={e =>
                              update(
                                "items",
                                invoice.items.map((it, j) =>
                                  j === i ? { ...it, [key]: e.target.value === "" ? 0 : Number(e.target.value) } : it
                                )
                              )
                            }
                          />
                        </label>
                      ))}
                      <button
                        type="button"
                        aria-label={`Remove service ${i + 1}`}
                        disabled={invoice.items.length === 1}
                        onClick={() => update("items", invoice.items.filter((_, j) => j !== i))}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    disabled={invoice.items.length >= 100}
                    onClick={() => update("items", [...invoice.items, { description: "", quantity: 1, rate: 0 }])}
                  >
                    <FiPlus /> Add service
                  </button>
                  <div className="invoice-fields mt-5">
                    {(["discount", "tax", "paid"] as const).map(key => (
                      <label className="invoice-field" key={key}>
                        {key === "paid" ? "Amount already paid (BDT)" : `${key === "tax" ? "Tax" : "Discount"} (%)`}
                        <input
                          type="number"
                          required
                          min="0"
                          max={key === "paid" ? "1000000000000" : "100"}
                          step="0.01"
                          value={invoice[key]}
                          onChange={e => update(key, Number(e.target.value))}
                        />
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-admin-muted mt-3">Tax is calculated after the discount. Amount paid is deducted from the invoice total.</p>
                </section>

                <section className="invoice-wide">
                  <h2>Signature & approval</h2>
                  <div className="invoice-fields">
                    <div>
                      <label className="invoice-checkbox">
                        <input type="checkbox" checked={invoice.signatureEnabled} onChange={e => update("signatureEnabled", e.target.checked)} /> Show authorized signature
                      </label>
                      <label className="invoice-checkbox">
                        <input type="checkbox" checked={invoice.clientSignature} onChange={e => update("clientSignature", e.target.checked)} /> Include client acceptance line
                      </label>
                      {invoice.signatureEnabled && (
                        <div className="invoice-fields mt-4">
                          {field("Signatory name", "signatory")}
                          {field("Designation", "signatoryTitle")}
                        </div>
                      )}
                    </div>
                    {invoice.signatureEnabled && <SignatureInput key={invoice.id} value={invoice.signature} onChange={value => update("signature", value)} />}
                  </div>
                </section>

                <section><h2>Notes</h2>{area("Additional notes", "notes")}</section>
                <section><h2>Payment information</h2>{area("Payment methods / bank or mobile banking details", "payment")}{area("Payment terms", "terms")}</section>
              </div>

              <div className="invoice-actions">
                <div className="invoice-sharing-actions">
                  <button
                    type="button"
                    className="invoice-whatsapp-btn"
                    onClick={() => handleOpenWhatsAppModal(invoice)}
                    title="Share invoice on WhatsApp"
                  >
                    <FaWhatsapp className="text-base text-emerald-600" /> 1-Click WhatsApp Share
                  </button>
                  <button
                    type="button"
                    className="invoice-email-btn"
                    onClick={() => handleOpenEmailModal(invoice)}
                    title="Directly email invoice PDF to client"
                  >
                    <FiMail className="text-base text-admin-primary" /> Send via Email
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button type="submit" value="save"><FiSave /> {busy ? "Saving…" : "Save to Cloudinary"}</button>
                  <button type="submit" value="print" className="invoice-print-button"><FiPrinter /> Save & open PDF</button>
                </div>
              </div>
            </fieldset>
          </form>

          <div className="invoice-preview-label">
            Invoice preview · A4 · BDT <span>Save & open PDF opens the archived document. Print from the PDF viewer for matching totals and layout.</span>
          </div>
          <div className="invoice-preview-banner">
            ⇄ Swipe horizontally to preview full A4 page
          </div>
          <div className="invoice-preview"><InvoicePaper invoice={invoice} /></div>
        </>
      )}

      {/* ========================================================================= */}
      {/* WHATSAPP SHARE MODAL                                                      */}
      {/* ========================================================================= */}
      {whatsappModalOpen && whatsappTargetInvoice && (
        <div className="invoice-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="wa-modal-title">
          <div className="invoice-modal-card">
            <div className="invoice-modal-header">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <FaWhatsapp size={18} />
                </div>
                <div>
                  <h3 id="wa-modal-title" className="font-bold text-base text-gray-900">1-Click WhatsApp Share</h3>
                  <p className="text-xs text-gray-500">Send invoice #{whatsappTargetInvoice.number} to client</p>
                </div>
              </div>
              <button type="button" className="invoice-modal-close" onClick={() => setWhatsappModalOpen(false)}>
                <FiX size={18} />
              </button>
            </div>

            <div className="invoice-modal-body">
              <label className="invoice-field">
                Client Phone Number (WhatsApp)
                <input
                  type="tel"
                  placeholder="017XXXXXXXX or +88017XXXXXXXX"
                  value={whatsappPhone}
                  onChange={e => setWhatsappPhone(e.target.value)}
                />
                <span className="text-[11px] text-gray-500">Bangladeshi numbers starting with 01 will be automatically formatted to +880.</span>
              </label>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">Message Language:</span>
                  <div className="invoice-lang-toggle">
                    <button
                      type="button"
                      className={whatsappLang === "en" ? "active" : ""}
                      onClick={() => setWhatsappLang("en")}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      className={whatsappLang === "bn" ? "active" : ""}
                      onClick={() => setWhatsappLang("bn")}
                    >
                      বাংলা (Bengali)
                    </button>
                  </div>
                </div>

                <div className="invoice-preview-textbox">
                  {generateWhatsAppTextFor(whatsappTargetInvoice, whatsappLang)}
                </div>
              </div>
            </div>

            <div className="invoice-modal-footer">
              <button
                type="button"
                className="invoice-btn-secondary"
                onClick={handleCopyWhatsApp}
              >
                {copiedWhatsApp ? <><FiCheck className="text-emerald-600" /> Copied!</> : <><FiCopy /> Copy text</>}
              </button>
              <button
                type="button"
                className="invoice-btn-whatsapp"
                onClick={handleSendWhatsApp}
              >
                <FaWhatsapp size={16} /> Open WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EMAIL DELIVERY MODAL                                                      */}
      {/* ========================================================================= */}
      {emailModalOpen && emailTargetInvoice && (
        <div className="invoice-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="email-modal-title">
          <div className="invoice-modal-card">
            <form onSubmit={handleSendEmail}>
              <div className="invoice-modal-header">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-admin-primary flex items-center justify-center text-white">
                    <FiMail size={16} />
                  </div>
                  <div>
                    <h3 id="email-modal-title" className="font-bold text-base text-gray-900">Email Invoice PDF</h3>
                    <p className="text-xs text-gray-500">Official invoice delivery to client</p>
                  </div>
                </div>
                <button type="button" className="invoice-modal-close" onClick={() => setEmailModalOpen(false)}>
                  <FiX size={18} />
                </button>
              </div>

              <div className="invoice-modal-body">
                {emailError && <div className="invoice-modal-error">{emailError}</div>}

                <label className="invoice-field">
                  Recipient Email Address *
                  <input
                    type="email"
                    required
                    placeholder="client@example.com"
                    value={emailRecipient}
                    onChange={e => setEmailRecipient(e.target.value)}
                  />
                </label>

                <div className="invoice-email-summary-pill mt-4">
                  <div>
                    <span className="text-gray-500 block text-[11px]">Invoice #</span>
                    <strong>{emailTargetInvoice.number}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Client / Project</span>
                    <strong>{emailTargetInvoice.client || "Client"} • {emailTargetInvoice.project || "Interior Design"}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Total Due</span>
                    <strong className="text-emerald-800">
                      BDT {money(invoiceTotals(emailTargetInvoice.items, emailTargetInvoice.discount, emailTargetInvoice.tax, emailTargetInvoice.paid).due)}
                    </strong>
                  </div>
                </div>

                <label className="invoice-field mt-4">
                  Custom Personal Note (Optional)
                  <textarea
                    rows={2}
                    placeholder="Add a personalized message or instructions for your client..."
                    value={emailNote}
                    onChange={e => setEmailNote(e.target.value)}
                  />
                </label>

                <div className="invoice-attachment-pill">
                  <FiFileText className="text-emerald-700 text-lg flex-shrink-0" />
                  <div className="text-xs">
                    <strong>Attached:</strong> Invoice-{emailTargetInvoice.number}.pdf
                    <span className="block text-[11px] text-gray-500">Official PDF generated with Bangla Sketch branding</span>
                  </div>
                </div>
              </div>

              <div className="invoice-modal-footer">
                <button
                  type="button"
                  className="invoice-btn-secondary"
                  disabled={emailSending}
                  onClick={() => setEmailModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="invoice-btn-primary"
                  disabled={emailSending}
                >
                  {emailSending ? (
                    <>
                      <FiSend className="animate-spin" /> Sending Email…
                    </>
                  ) : (
                    <>
                      <FiSend /> Send Invoice Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
