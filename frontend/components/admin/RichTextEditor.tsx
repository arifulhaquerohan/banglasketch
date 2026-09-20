"use client";

import { useRef } from "react";
import { FiBold, FiItalic, FiList, FiAlignLeft, FiLink, FiImage, FiCode } from "react-icons/fi";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, label = "Content", placeholder = "Start writing..." }: RichTextEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrap = (start: string, end: string = start) => {
    const el = ref.current;
    if (!el) return;
    const startIdx = el.selectionStart;
    const endIdx = el.selectionEnd;
    const selected = value.substring(startIdx, endIdx);
    const before = value.substring(0, startIdx);
    const after = value.substring(endIdx);
    onChange(before + start + selected + end + after);
    setTimeout(() => { el.focus(); el.setSelectionRange(startIdx + start.length, endIdx + start.length); }, 0);
  };

  return (
    <div>
      {label && <label className="block text-xs font-semibold text-admin-primary uppercase tracking-wider mb-2">{label}</label>}
      <div className="bg-white border border-admin-border rounded-2xl overflow-hidden focus-within:border-admin-primary focus-within:ring-2 focus-within:ring-admin-primary/20 transition-all shadow-2xs">
        <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-admin-border bg-admin-canvas/60">
          {[
            { icon: FiBold, cmd: () => wrap("**"), title: "Bold" },
            { icon: FiItalic, cmd: () => wrap("*"), title: "Italic" },
            { icon: FiList, cmd: () => wrap("\n- ", ""), title: "List" },
            { icon: FiAlignLeft, cmd: () => wrap("\n## ", ""), title: "Heading" },
            { icon: FiLink, cmd: () => wrap("[", "](url)"), title: "Link" },
            { icon: FiImage, cmd: () => wrap("![", "](url)"), title: "Image" },
            { icon: FiCode, cmd: () => wrap("`"), title: "Code" },
          ].map((btn, i) => {
            const Icon = btn.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={btn.cmd}
                title={btn.title}
                aria-label={btn.title}
                className="p-1.5 rounded-lg text-admin-muted hover:bg-admin-tint hover:text-admin-ink transition-colors"
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={14}
          className="w-full bg-transparent px-4 py-3 text-xs text-admin-ink placeholder:text-admin-subtle focus:outline-none resize-none font-mono leading-relaxed"
        />
      </div>
      <p className="text-[11px] text-admin-subtle mt-1.5">Supports Markdown formatting</p>
    </div>
  );
}
