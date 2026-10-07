"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { FiEdit3, FiUpload, FiRotateCcw } from "react-icons/fi";

export default function SignatureInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [error, setError] = useState("");

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 800,
      y: ((event.clientY - rect.top) / rect.height) * 240,
    };
  };

  const upload = async (file?: File) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError("Choose a PNG, JPG or WebP signature smaller than 2 MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const image = new window.Image();
      image.src = url;
      await image.decode();
      const output = document.createElement("canvas");
      const scale = Math.min(1, 1200 / image.width, 600 / image.height);
      output.width = Math.max(1, Math.round(image.width * scale));
      output.height = Math.max(1, Math.round(image.height * scale));
      output.getContext("2d")!.drawImage(image, 0, 0, output.width, output.height);
      const data = output.toDataURL("image/png");
      if (data.length > 280000) throw new Error("Signature is too detailed. Please use a smaller, cropped image.");
      onChange(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read the image.");
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
    const p = point(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#253024";
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const p = point(event);
    const ctx = canvas.current?.getContext("2d");
    ctx?.lineTo(p.x, p.y);
    ctx?.stroke();
  };

  const handlePointerUp = () => {
    if (drawing.current && canvas.current) {
      onChange(canvas.current.toDataURL("image/png"));
    }
    drawing.current = false;
  };

  return (
    <div className="invoice-signature-input">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs text-admin-muted">
          <FiEdit3 className="inline mr-1 text-admin-primary" />
          Draw with finger/pen, or upload signature image
        </p>
      </div>
      {value && (
        <div className="signature-preview">
          <p className="text-[11px] text-gray-500 mb-1">Active Signature:</p>
          <Image src={value} alt="Selected signature" width={250} height={70} unoptimized />
        </div>
      )}
      <div className="signature-canvas-wrapper">
        <canvas
          ref={canvas}
          width={800}
          height={240}
          aria-label="Draw your signature here with touch or mouse"
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => { drawing.current = false; }}
        />
        <span className="signature-canvas-hint">Touch & Draw here</span>
      </div>
      <div className="signature-actions-row">
        <label className="invoice-upload-label">
          <FiUpload size={14} /> Upload image
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }}
          />
        </label>
        <button
          type="button"
          className="invoice-btn-clear"
          onClick={() => {
            canvas.current?.getContext("2d")?.clearRect(0, 0, 800, 240);
            onChange("");
          }}
        >
          <FiRotateCcw size={13} /> Clear
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-red-700 mt-2">{error}</p>}
    </div>
  );
}
