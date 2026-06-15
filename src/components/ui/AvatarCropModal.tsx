"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  imageSrc: string;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

async function getCroppedImg(src: string, crop: CropArea): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 400;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("No canvas context")); return; }
      ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Canvas is empty"))),
        "image/jpeg",
        0.92
      );
    };
    img.onerror = reject;
    img.src = src;
  });
}

export default function AvatarCropModal({ imageSrc, onSave, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback(
    (_croppedArea: unknown, pixels: CropArea) => {
      setCroppedAreaPixels(pixels);
    },
    []
  );

  async function handleSave() {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(blob);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1E1654] rounded-3xl border border-purple-500/30 overflow-hidden shadow-2xl">

        <div className="px-6 pt-6 pb-3">
          <h2 className="text-lg font-black text-white">Crop your photo</h2>
          <p className="text-purple-300/60 text-xs mt-1">Drag to reposition · Scroll or pinch to zoom</p>
        </div>

        {/* Crop area */}
        <div className="relative w-full h-72 bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom slider */}
        <div className="px-6 py-5 space-y-1.5">
          <p className="text-xs text-purple-300/60 font-semibold uppercase tracking-wider">Zoom</p>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-1.5 rounded-full accent-yellow-400 cursor-pointer"
          />
        </div>

        {/* Buttons */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-white/10 hover:border-white/20 py-3 text-sm font-semibold text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-2xl bg-yellow-400 hover:bg-amber-400 disabled:opacity-50 py-3 text-sm font-black text-[#0F0D1E] transition-colors"
          >
            {saving ? "Saving…" : "Save photo"}
          </button>
        </div>

      </div>
    </div>
  );
}
