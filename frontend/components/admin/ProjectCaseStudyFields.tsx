"use client";
import { CloudinaryUpload } from "./CloudinaryUpload";

export const EMPTY_CASE_STUDY = {
  location: "", area: "", style: "", scope: "", materials: "", timeline: "", design_challenge: "", design_solution: "",
  before_image: "", after_image: "", client_testimonial: "",
};
export type CaseStudyFields = typeof EMPTY_CASE_STUDY;

export function ProjectCaseStudyFields({ value, onChange }: { value: CaseStudyFields; onChange: (patch: Partial<CaseStudyFields>) => void }) {
  return <div className="space-y-5 rounded-3xl border border-admin-border bg-admin-surface p-6 sm:p-8">
    <h2 className="text-lg font-semibold">Project details & story</h2>
    <p className="text-sm text-admin-muted">Add confirmed details. Empty fields stay hidden on the public project page.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      {([
        ["location", "Location", "Banani, Dhaka"], ["area", "Size", "1,200 sq.ft"],
        ["style", "Design style", "Warm contemporary"], ["timeline", "Project timeline", "12 weeks"],
      ] as const).map(([key, label, placeholder]) => <label key={key} className="block text-sm font-medium">{label}<input value={value[key]} onChange={event => onChange({ [key]: event.target.value })} maxLength={255} placeholder={placeholder} className="mt-2 min-h-12 w-full rounded-xl border border-admin-border bg-white px-3 py-2 text-base" /></label>)}
    </div>
    {([
      ["scope", "Scope of work", "What did the studio design or deliver?"],
      ["materials", "Materials & finishes", "Describe the actual materials used."],
      ["design_challenge", "The client's brief", "What needed to change, and what mattered to the client?"],
      ["design_solution", "The design response", "Explain how the layout, lighting, or materials answered the brief."],
      ["client_testimonial", "Client feedback (with permission)", "Paste the client's actual words. Leave blank if unavailable."],
    ] as const).map(([key, label, placeholder]) => <label key={key} className="block text-sm font-medium">{label}<textarea value={value[key]} onChange={event => onChange({ [key]: event.target.value })} maxLength={5000} rows={3} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-admin-border bg-white px-3 py-3 text-base" /></label>)}
    <div className="grid gap-6 sm:grid-cols-2">
      <div><p className="mb-3 text-sm font-medium">Before photo (optional)</p><CloudinaryUpload value={value.before_image} onChange={before_image => onChange({ before_image })} folder="banglasketch/projects/before" /></div>
      <div><p className="mb-3 text-sm font-medium">After photo (optional)</p><CloudinaryUpload value={value.after_image} onChange={after_image => onChange({ after_image })} folder="banglasketch/projects/after" /></div>
    </div>
  </div>;
}
