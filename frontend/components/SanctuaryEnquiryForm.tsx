"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { FiArrowUpRight, FiCheck, FiCheckCircle, FiAlertCircle, FiPlus } from "react-icons/fi";
import { CONTACT } from "../lib/constants";
import { useSpaceCollection } from "./SpaceCollectionContext";

const INITIAL_FORM = { name: "", phone: "", email: "", location: "", scope: "entire-home", timeline: "Exploring", message: "", attachmentUrl: "" };
const FIELD_CLASS = "block min-h-12 w-full border border-limestone bg-white/60 px-3.5 py-3 text-base text-charcoal outline-none transition-colors placeholder:text-charcoal-muted/70 focus:border-olive-dark focus:ring-1 focus:ring-olive-dark";
const LABEL_CLASS = "mb-2 block text-xs font-medium text-charcoal";

export function SanctuaryEnquiryForm() {
  const { items, totalCount } = useSpaceCollection();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [includeCollection, setIncludeCollection] = useState(true);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const updateField = (field: keyof typeof INITIAL_FORM, value: string) => setFormData(current => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMessage("");
    try {
      const collectionNote = includeCollection && items.length > 0 ? `\n[Attached Collection: ${items.map(item => item.title).join(", ")}]` : "";
      const planNote = formData.attachmentUrl.trim() ? `\n[Blueprint / Document Link: ${formData.attachmentUrl.trim()}]` : "";
      const response = await fetch("/api/v1/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          project_location: formData.location.trim(),
          service_scope: formData.scope,
          preferred_start_date: formData.timeline,
          notes: `${formData.message.trim()}${collectionNote}${planNote}`,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error((typeof data.error === "string" ? data.error : "") || "We couldn’t send your enquiry. Please try again or contact us on WhatsApp.");
      setStatus("success");
    } catch (error: unknown) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "We couldn’t send your enquiry. Please try again.");
    }
  };

  return (
    <section id="enquiry" className="bg-[#EDECE4] py-16 sm:py-24" aria-labelledby="enquiry-title">
      <div className="container">
        <div className="grid border border-limestone lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex flex-col justify-between bg-[#343E32] p-7 text-ivory-light sm:p-10 lg:p-12">
            <div>
              <p className="mb-7 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#D8DECE]"><span className="h-1.5 w-1.5 rounded-full bg-[#CBA78B]" /> A new beginning</p>
              <h2 id="enquiry-title" className="max-w-sm font-serif text-5xl font-normal leading-[1.06] text-ivory-light sm:text-6xl">Your space.<br />Your story.<br /><em className="text-[#C6CFB8]">Let’s start here.</em></h2>
              <p className="mt-7 max-w-xs text-sm leading-relaxed text-[#D8DECE]">A new home, a favourite room, or a fresh start. Tell us what you’re imagining, and we’ll figure out the next step together.</p>
              <div className="mt-8 space-y-3 border-t border-white/15 pt-6 text-xs text-[#E4E8DD]">
                {["A conversation about your ideas", "Guidance on scope and budget", "A plan shaped around your space"].map(text => <p key={text} className="flex items-center gap-3"><FiCheck size={15} className="shrink-0 text-[#C6CFB8]" />{text}</p>)}
              </div>
            </div>
            <div className="mt-10 border-t border-white/15 pt-6">
              <p className="text-xs text-[#D8DECE]">Prefer a quick conversation?</p>
              <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-6 border-b border-[#AEBB9C] text-sm font-medium text-ivory-light transition-colors hover:text-[#C6CFB8]">Say hello on WhatsApp <FiArrowUpRight size={18} /></a>
            </div>
          </div>
          <div className="bg-ivory-light p-6 sm:p-10 lg:p-12">
            {status === "success" ? (
              <div role="status" className="flex min-h-[500px] flex-col items-start justify-center">
                <FiCheckCircle size={38} strokeWidth={1.3} className="mb-6 text-olive-dark" />
                <h3 className="font-serif text-4xl font-normal">The first step is yours.</h3>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-charcoal-muted">Thank you for sharing your ideas. Your enquiry has reached our studio, and we’ll be in touch to talk about your space.</p>
                <button type="button" onClick={() => { setFormData(INITIAL_FORM); setStatus("idle"); }} className="studio-text-link mt-7">Start another enquiry <FiArrowUpRight size={17} /></button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" aria-label="Project enquiry" aria-busy={status === "submitting"}>
                <div className="mb-7 flex items-baseline justify-between gap-4"><h3 className="font-serif text-3xl font-normal">Start with the essentials.</h3><span className="shrink-0 text-xs text-charcoal-muted">* Required</span></div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><label htmlFor="enquiry-name" className={LABEL_CLASS}>Your name *</label><input id="enquiry-name" name="name" autoComplete="name" required maxLength={100} placeholder="Your full name" value={formData.name} onChange={event => updateField("name", event.target.value)} className={FIELD_CLASS} /></div>
                  <div><label htmlFor="enquiry-phone" className={LABEL_CLASS}>Phone / WhatsApp *</label><input id="enquiry-phone" name="phone" type="tel" autoComplete="tel" required maxLength={30} placeholder="+880 …" value={formData.phone} onChange={event => updateField("phone", event.target.value)} className={FIELD_CLASS} /></div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><label htmlFor="enquiry-location" className={LABEL_CLASS}>Project location *</label><input id="enquiry-location" name="location" autoComplete="address-level2" required maxLength={150} placeholder="Area or city" value={formData.location} onChange={event => updateField("location", event.target.value)} className={FIELD_CLASS} /></div>
                  <div><label htmlFor="enquiry-scope" className={LABEL_CLASS}>What do you need? *</label><select id="enquiry-scope" name="scope" value={formData.scope} onChange={event => updateField("scope", event.target.value)} className={FIELD_CLASS}><option value="entire-home">An entire home</option><option value="one-room">A single room</option><option value="renovation">A renovation</option><option value="commercial">A commercial space</option></select></div>
                </div>
                <details className="group border-y border-limestone py-3">
                  <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between text-xs text-charcoal-muted [&::-webkit-details-marker]:hidden">Add ideas, a timeline or floor plan (optional) <FiPlus size={16} className="transition-transform group-open:rotate-45" /></summary>
                  <div className="grid gap-4 py-4">
                <div><label htmlFor="enquiry-email" className={LABEL_CLASS}>Email address (optional)</label><input id="enquiry-email" name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" value={formData.email} onChange={event => updateField("email", event.target.value)} className={FIELD_CLASS} /></div>
                <div><label htmlFor="enquiry-message" className={LABEL_CLASS}>What would make it feel like you?</label><textarea id="enquiry-message" name="message" rows={3} maxLength={3000} placeholder="Share your ideas, needs, or anything you’d love us to know…" value={formData.message} onChange={event => updateField("message", event.target.value)} className={`${FIELD_CLASS} resize-y`} /></div>
                    <div><label htmlFor="enquiry-timeline" className={LABEL_CLASS}>When would you like to begin?</label><select id="enquiry-timeline" name="timeline" value={formData.timeline} onChange={event => updateField("timeline", event.target.value)} className={FIELD_CLASS}><option value="Exploring">I’m exploring ideas</option><option value="Immediate">Within a month</option><option value="Within 3 Months">In 1–3 months</option><option value="Within 6 Months">In 3–6 months</option></select></div>
                    <div><label htmlFor="enquiry-plan" className={LABEL_CLASS}>Floor plan or inspiration link</label><input id="enquiry-plan" name="attachmentUrl" type="url" maxLength={2000} placeholder="https://…" value={formData.attachmentUrl} onChange={event => updateField("attachmentUrl", event.target.value)} className={FIELD_CLASS} /></div>
                  </div>
                </details>
                {totalCount > 0 && <label className="flex cursor-pointer items-start gap-3 bg-olive-tint p-4 text-xs leading-relaxed text-olive-dark"><input type="checkbox" checked={includeCollection} onChange={event => setIncludeCollection(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#575E4A]" /><span>Include my saved collection <strong>({totalCount} {totalCount === 1 ? "item" : "items"})</strong><span className="mt-1 block text-charcoal-muted">Help the studio understand the spaces and materials you like.</span></span></label>}
                {status === "error" && <div role="alert" className="flex items-start gap-2.5 border border-red-200 bg-red-50 p-4 text-sm text-red-800"><FiAlertCircle size={17} className="mt-0.5 shrink-0" /><p>{errorMessage}</p></div>}
                <button type="submit" disabled={status === "submitting"} className="studio-button w-full disabled:cursor-wait disabled:opacity-60"><span>{status === "submitting" ? "Sending your enquiry…" : "Request a consultation"}</span><FiArrowUpRight size={20} /></button>
                <p className="text-xs leading-relaxed text-charcoal-muted">We’ll use these details to respond to your enquiry. <Link href="/privacy" className="underline underline-offset-2 hover:text-charcoal">Privacy policy</Link></p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
