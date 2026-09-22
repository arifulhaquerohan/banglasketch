"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import SignatureInput from "./SignatureInput";
import { FiPlus, FiPrinter, FiSave, FiTrash2 } from "react-icons/fi";
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
type InvoiceSummary = Pick<Invoice, "id" | "number" | "client" | "revision" | "cloudSaved" | "updatedAt">;
const STORAGE = "banglasketch-invoices-v1";
const WORKING_DRAFT = "banglasketch-invoice-working-v1";
function newInvoice(): Invoice {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const id = crypto.randomUUID();
  return { id, revision: 0, signature: "", signatory: "", signatoryTitle: "Authorized signatory", signatureEnabled: true, clientSignature: false, number: `BS-${date.replaceAll("-", "")}-${id.slice(0, 6).toUpperCase()}`, issued: date, due: "", company: BRAND_NAME_EN, address: CONTACT.address, phone: CONTACT.phone, email: CONTACT.email, client: "", clientCompany: "", clientAddress: "", clientPhone: "", clientEmail: "", project: "", location: "", notes: "", payment: "", terms: "Payment is due by the date shown on this invoice.", discount: 0, tax: 0, paid: 0, items: [{ description: "Interior design consultation", quantity: 1, rate: 0 }] };
}
const money = (value: number) => new Intl.NumberFormat("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const dateLabel = (value: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
function validDraft(value: unknown): value is Invoice {
  if (!value || typeof value !== "object") return false;
  const v = value as Invoice;
  return ["id", "number", "issued", "due", "company", "address", "phone", "email", "client", "clientCompany", "clientAddress", "clientPhone", "clientEmail", "project", "location", "notes", "payment", "terms"].every(key => typeof (v as unknown as Record<string, unknown>)[key] === "string") && [v.discount, v.tax, v.paid].every(n => Number.isFinite(n) && n >= 0) && v.discount <= 100 && v.tax <= 100 && Array.isArray(v.items) && v.items.length > 0 && v.items.every(i => i && typeof i.description === "string" && Number.isFinite(i.quantity) && i.quantity > 0 && Number.isFinite(i.rate) && i.rate >= 0);
}
function InvoicePaper({ invoice: v }: { invoice: Invoice }) {
  const t = invoiceTotals(v.items, v.discount, v.tax, v.paid);
  return <article className="invoice-paper">
    <div className="invoice-brand"><Image src="/brand-logo.png" width={98} height={79} alt="Bangla Sketch" className="invoice-logo" unoptimized /><div className="invoice-brand-name"><strong>{v.company}</strong><span>Architecture & Interior Design</span></div><div className="invoice-contact"><p>{v.address}</p><p>{v.phone}<br />{v.email}</p></div></div>
    <div className="invoice-title"><div><h1>Invoice</h1><p># {v.number}</p></div><dl><div><dt>Date issued</dt><dd>{dateLabel(v.issued)}</dd></div><div><dt>Payment due</dt><dd>{dateLabel(v.due)}</dd></div><div><dt>Currency</dt><dd>BDT</dd></div></dl></div>
    <div className="invoice-details"><section><h2>Bill to</h2><strong>{v.client || "Client name"}</strong>{[v.clientCompany, v.clientAddress, v.clientPhone, v.clientEmail].filter(Boolean).map((text, i) => <p key={i}>{text}</p>)}</section><section><h2>Project</h2><p>{v.project || "—"}</p>{v.location && <p>{v.location}</p>}</section></div>
    <table className="invoice-table"><thead><tr><th>Service description</th><th>Qty / Units</th><th>Rate (BDT)</th><th>Total (BDT)</th></tr></thead><tbody>{v.items.map((item, i) => <tr key={i}><td>{item.description || "—"}</td><td>{item.quantity}</td><td>{money(item.rate)}</td><td>{money(t.lines[i])}</td></tr>)}</tbody></table>
    <div className="invoice-summary"><section><h2>Additional notes</h2><p>{v.notes || "Thank you for choosing Bangla Sketch for your space."}</p></section><dl>{[["Subtotal", t.subtotal], ...(v.discount ? [[`Discount (${v.discount}%)`, -t.discount]] : []), ...(v.tax ? [[`Tax (${v.tax}%)`, t.tax]] : []), ["Invoice total", t.total], ["Amount paid", v.paid]].map(([label, amount]) => <div key={label}><dt>{label}</dt><dd>{money(Number(amount))}</dd></div>)}<div className="invoice-total"><dt>Total due</dt><dd>BDT {money(t.due)}</dd></div>{t.credit > 0 && <div><dt>Credit balance</dt><dd>BDT {money(t.credit)}</dd></div>}</dl></div>
    <footer className="invoice-footer"><section><h2>Payment methods</h2><p>{v.payment || "Please contact us for payment details."}</p></section><section><h2>Payment terms</h2><p>{v.terms}</p></section></footer>
    {(v.signatureEnabled || v.clientSignature) && <div className="invoice-signatures">{v.signatureEnabled && <section><div className="invoice-signature-space">{v.signature && <Image src={v.signature} width={190} height={60} alt="Authorized signature" unoptimized />}</div><div className="invoice-sign-line"><strong>{v.signatory || v.company}</strong><span>{v.signatoryTitle || "Authorized signatory"}</span></div></section>}{v.clientSignature && <section><div className="invoice-signature-space" /><div className="invoice-sign-line"><strong>Client acceptance</strong><span>Signature & date</span></div></section>}</div>}
    <p className="invoice-thanks">Thank you for choosing {v.company}. Thoughtful spaces, made for you.</p>
  </article>;
}
export default function InvoicesPage() {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [drafts, setDrafts] = useState<InvoiceSummary[]>([]);
  const [localDrafts, setLocalDrafts] = useState<Invoice[]>([]);
  const [busy, setBusy] = useState(false);
  const [cloudLoading, setCloudLoading] = useState(true);
  const saveInProgress = useRef(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const edited = useRef(false);
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
    } catch { setMessage("Draft recovery is unavailable in this browser."); }
    setInvoice(initial);
    try { const data: unknown = JSON.parse(localStorage.getItem(STORAGE) || "[]"); if (Array.isArray(data) && data.every(validDraft)) setLocalDrafts(data); else setMessage("Saved drafts could not be read. Existing browser data has not been changed."); } catch { setMessage("Local drafts are unavailable. Cloud invoices can still be loaded and saved."); }
    let active = true;
    adminFetch<InvoiceSummary[]>("invoices").then(result => {
      if (!active) return;
      if (result.success && result.data) setDrafts(result.data);
      else setMessage(result.error || "Could not load cloud invoices. Refresh to retry.");
    }).finally(() => { if (active) setCloudLoading(false); });
    adminFetch<{ contact?: Partial<typeof CONTACT>; general?: { siteName?: string } }>("settings").then(result => {
      if (active && !edited.current && result.success && result.data) {
        const { contact, general } = result.data;
        setInvoice(current => current ? { ...current, company: general?.siteName || current.company, address: contact?.address || current.address, phone: contact?.phone && !/1700[ -]?000000/.test(contact.phone) ? contact.phone : current.phone, email: contact?.email || current.email } : current);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  if (!invoice) return <p>Loading invoice workspace…</p>;
  const rememberDraft = (draft: Invoice) => {
    try { sessionStorage.setItem(WORKING_DRAFT, JSON.stringify(draft)); }
    catch { setMessage("This browser could not back up your draft. Save before leaving this page."); }
  };
  const clearDraft = () => { try { sessionStorage.removeItem(WORKING_DRAFT); } catch {} };
  const update = <K extends keyof Invoice>(key: K, value: Invoice[K]) => {
    edited.current = true;
    const next = { ...invoice, [key]: value };
    rememberDraft(next); setInvoice(next); setDirty(true);
  };
  const field = (label: string, key: keyof Invoice, type = "text", required = false) => <label className="invoice-field">{label}<input type={type} value={String(invoice[key])} required={required} min={type === "date" && key === "due" ? invoice.issued : undefined} onChange={e => update(key, e.target.value)} /></label>;
  const area = (label: string, key: "address" | "clientAddress" | "notes" | "payment" | "terms") => <label className="invoice-field">{label}<textarea rows={3} value={invoice[key]} onChange={e => update(key, e.target.value)} /></label>;
  const save = async (print = false) => {
    if (saveInProgress.current) return;
    // Open during the user gesture so the browser does not block the PDF tab.
    const pdfWindow = print ? window.open("about:blank", "_blank") : null;
    if (pdfWindow) { pdfWindow.opener = null; pdfWindow.document.title = "Preparing invoice PDF…"; }
    saveInProgress.current = true; setBusy(true); setMessage("Creating your PDF and saving to Cloudinary…");
    try {
      const result = await adminFetch<Invoice>("invoices", { method: "POST", body: JSON.stringify(invoice) });
      if (!result.success || !result.data) throw new Error(result.error || "Could not save invoice.");
      const saved = result.data;
      setInvoice(saved); setDirty(false); clearDraft();
      setDrafts(current => [saved, ...current.filter(d => d.id !== saved.id)]);
      setMessage(`Saved to Cloudinary • Revision ${saved.revision}. Your invoice is available across devices.`);
      // Keep legacy drafts until a confirmed server save has completed.
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
    } catch (err) { pdfWindow?.close(); setMessage(err instanceof Error ? err.message : "Save failed. Please retry."); }
    finally { saveInProgress.current = false; setBusy(false); }
  };
  const loadInvoice = async (id: string) => {
    if (!canSwitch()) return;
    setBusy(true);
    try {
      const result = await adminFetch<Invoice>(`invoices/${id}`);
      if (!result.success || !result.data) throw new Error(result.error || "Could not load invoice.");
      setInvoice(result.data); setDirty(false); clearDraft(); setMessage("");
    } catch (err) { setMessage(err instanceof Error ? err.message : "Could not load invoice."); }
    finally { setBusy(false); }
  };
  const canSwitch = () => { edited.current = true; const allowed = !dirty || window.confirm("Discard unsaved invoice changes?"); if (allowed) clearDraft(); return allowed; };
  return <div className="invoice-workspace">
    <div className="invoice-toolbar"><div><p className="text-xs uppercase tracking-widest text-admin-primary font-semibold">Studio accounts</p><h1 className="text-3xl font-serif mt-2">Invoices</h1><p className="text-sm text-admin-muted mt-2">Branded invoices, signatures, and a secure PDF archive.</p></div><button type="button" disabled={busy} onClick={() => { if (canSwitch()) { setInvoice({ ...newInvoice(), company: invoice.company, address: invoice.address, phone: invoice.phone, email: invoice.email }); setDirty(false); setMessage(""); } }}><FiPlus /> New invoice</button></div>
    <div className="invoice-drafts"><label className="invoice-field">Cloud invoices<select disabled={busy || cloudLoading} value={drafts.some(d => d.id === invoice.id) ? invoice.id : ""} onChange={e => { void loadInvoice(e.target.value); }}><option value="" disabled>{cloudLoading ? "Loading saved invoices…" : "Choose a saved invoice"}</option>{drafts.map(d => <option key={d.id} value={d.id}>{d.number} — {d.client || "Unnamed client"}</option>)}</select></label><p>Private PDFs stored in Cloudinary. Invoice details sync across devices. Saving an edit creates a new archived revision.{dirty ? " • Unsaved changes" : ""}</p>{invoice.cloudSaved && <a className="invoice-pdf-link" href={`/api/admin/proxy/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">Open saved PDF ↗</a>}</div>
    {localDrafts.length > 0 && <div className="invoice-drafts"><label className="invoice-field">Earlier browser drafts<select disabled={busy} value="" onChange={e => { const draft = localDrafts.find(d => d.id === e.target.value); if (draft && canSwitch()) { const restored = { ...newInvoice(), ...draft, revision: 0, cloudSaved: false }; rememberDraft(restored); setInvoice(restored); setDirty(true); setMessage("This draft has not been saved to the cloud. Review it, then choose Save to Cloudinary."); } }}><option value="" disabled>Select a local draft to migrate</option>{localDrafts.filter(d => !drafts.some(cloud => cloud.id === d.id)).map(d => <option key={d.id} value={d.id}>{d.number} — {d.client}</option>)}</select></label><p>Your previous browser drafts are preserved. Save each one to move it to cloud storage.</p></div>}
    {message && <p role="status" className="invoice-message">{message}</p>}
    <form onSubmit={e => { e.preventDefault(); const action = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value"); void save(action === "print"); }}>
      <fieldset disabled={busy}>
      <div className="invoice-editor">
        <section><h2>Company details</h2><div className="invoice-fields">{field("Company name", "company", "text", true)}{field("Phone", "phone", "tel")}{field("Email", "email", "email")}{area("Company address", "address")}</div></section>
        <section><h2>Invoice & client</h2><div className="invoice-fields">{field("Invoice number", "number", "text", true)}{field("Date issued", "issued", "date", true)}{field("Due date", "due", "date", true)}{field("Client name", "client", "text", true)}{field("Client company", "clientCompany")}{field("Client phone", "clientPhone", "tel")}{field("Client email", "clientEmail", "email")}{area("Billing address", "clientAddress")}{field("Project name", "project")}{field("Project location", "location")}</div></section>
        <section className="invoice-wide"><h2>Services & pricing <span>BDT</span></h2>{invoice.items.map((item, i) => <div className="invoice-item" key={i}><label className="invoice-field">Service description<input required value={item.description} onChange={e => update("items", invoice.items.map((it, j) => j === i ? { ...it, description: e.target.value } : it))} /></label>{(["quantity", "rate"] as const).map(key => <label className="invoice-field" key={key}>{key === "quantity" ? "Quantity / units" : "Unit price (BDT)"}<input type="number" required min={key === "quantity" ? "0.01" : "0"} max={key === "quantity" ? "1000000" : "100000000"} step="0.01" value={item[key]} onChange={e => update("items", invoice.items.map((it, j) => j === i ? { ...it, [key]: e.target.value === "" ? 0 : Number(e.target.value) } : it))} /></label>)}<button type="button" aria-label={`Remove service ${i + 1}`} disabled={invoice.items.length === 1} onClick={() => update("items", invoice.items.filter((_, j) => j !== i))}><FiTrash2 /></button></div>)}<button type="button" disabled={invoice.items.length >= 100} onClick={() => update("items", [...invoice.items, { description: "", quantity: 1, rate: 0 }])}><FiPlus /> Add service</button><div className="invoice-fields mt-5">{(["discount", "tax", "paid"] as const).map(key => <label className="invoice-field" key={key}>{key === "paid" ? "Amount already paid (BDT)" : `${key === "tax" ? "Tax" : "Discount"} (%)`}<input type="number" required min="0" max={key === "paid" ? "1000000000000" : "100"} step="0.01" value={invoice[key]} onChange={e => update(key, Number(e.target.value))} /></label>)}</div><p className="text-xs text-admin-muted mt-3">Tax is calculated after the discount. Amount paid is deducted from the invoice total.</p></section>
        <section className="invoice-wide"><h2>Signature & approval</h2><div className="invoice-fields"><div><label className="invoice-checkbox"><input type="checkbox" checked={invoice.signatureEnabled} onChange={e => update("signatureEnabled", e.target.checked)} /> Show authorized signature</label><label className="invoice-checkbox"><input type="checkbox" checked={invoice.clientSignature} onChange={e => update("clientSignature", e.target.checked)} /> Include client acceptance line</label>{invoice.signatureEnabled && <div className="invoice-fields mt-4">{field("Signatory name", "signatory")}{field("Designation", "signatoryTitle")}</div>}</div>{invoice.signatureEnabled && <SignatureInput key={invoice.id} value={invoice.signature} onChange={value => update("signature", value)} />}</div></section>
        <section><h2>Notes</h2>{area("Additional notes", "notes")}</section><section><h2>Payment information</h2>{area("Payment methods / bank or mobile banking details", "payment")}{area("Payment terms", "terms")}</section>
      </div><div className="invoice-actions"><button type="submit" value="save"><FiSave /> {busy ? "Saving…" : "Save to Cloudinary"}</button><button type="submit" value="print" className="invoice-print-button"><FiPrinter /> Save & open PDF</button></div>
      </fieldset>
    </form><div className="invoice-preview-label">Invoice preview · A4 · BDT <span>Save & open PDF opens the archived document. Print from the PDF viewer for matching totals and layout.</span></div><div className="invoice-preview"><InvoicePaper invoice={invoice} /></div>
  </div>;
}
