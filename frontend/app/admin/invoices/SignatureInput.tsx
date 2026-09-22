"use client";
import Image from "next/image";
import { useRef, useState } from "react";

export default function SignatureInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [error, setError] = useState("");
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * 800 / rect.width, y: (event.clientY - rect.top) * 240 / rect.height };
  };
  const upload = async (file?: File) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) { setError("Choose a PNG, JPG or WebP signature smaller than 2 MB."); return; }
    const url = URL.createObjectURL(file);
    try {
      const image = new window.Image();
      image.src = url;
      await image.decode();
      const output = document.createElement("canvas");
      const scale = Math.min(1, 1200 / image.width, 600 / image.height);
      output.width = Math.max(1, Math.round(image.width * scale)); output.height = Math.max(1, Math.round(image.height * scale));
      output.getContext("2d")!.drawImage(image, 0, 0, output.width, output.height);
      const data = output.toDataURL("image/png");
      if (data.length > 280000) throw new Error("Signature is too detailed. Please use a smaller, cropped image.");
      onChange(data); setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not read the image."); }
    finally { URL.revokeObjectURL(url); }
  };
  return <div className="invoice-signature-input">
    <p className="text-xs text-admin-muted mb-3">Draw below, or upload a cropped signature. A transparent PNG looks best.</p>
    {value && <div className="signature-preview"><Image src={value} alt="Selected signature" width={250} height={70} unoptimized /></div>}
    <canvas ref={canvas} width={800} height={240} aria-label="Draw your signature here" style={{ touchAction: "none" }}
      onPointerDown={event => { const ctx = canvas.current?.getContext("2d"); if (!ctx) return; drawing.current = true; event.currentTarget.setPointerCapture(event.pointerId); const p = point(event); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineWidth = 2.7; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#253024"; }}
      onPointerMove={event => { if (!drawing.current) return; const p = point(event); const ctx = canvas.current?.getContext("2d"); ctx?.lineTo(p.x, p.y); ctx?.stroke(); }}
      onPointerUp={() => { if (drawing.current && canvas.current) onChange(canvas.current.toDataURL("image/png")); drawing.current = false; }}
      onPointerCancel={() => { drawing.current = false; }} />
    <div className="flex flex-wrap gap-3 mt-3"><label className="invoice-upload-label">Upload signature<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }} /></label><button type="button" onClick={() => { canvas.current?.getContext("2d")?.clearRect(0, 0, 800, 240); onChange(""); }}>Clear signature</button></div>
    {error && <p role="alert" className="text-xs text-red-700 mt-2">{error}</p>}
  </div>;
}
