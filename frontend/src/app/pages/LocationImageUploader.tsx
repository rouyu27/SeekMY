import { ImageIcon, Upload, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { C } from "../lib/tokens";

const MAX_IMAGES = 5;
const MAX_DIMENSION = 1400;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const QUALITY = 0.78;

async function compressImage(file: File): Promise<File> {
  if (file.size < 700 * 1024) return file;
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) { bitmap.close(); return file; }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp", lastModified: Date.now() });
}

export function LocationImageUploader({ existing, files, setFiles, onRemoveExisting, showToast }: {
  existing: string[];
  files: File[];
  setFiles: (files: File[]) => void;
  onRemoveExisting: (url: string) => void;
  showToast: (message: string) => void;
}) {
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  async function selectImages(list: FileList | null) {
    if (!list) return;
    const available = MAX_IMAGES - existing.length - files.length;
    if (available <= 0) return showToast("Maximum 5 pictures per location.");
    const selected = Array.from(list).slice(0, available);
    const valid = selected.filter((file) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        showToast(`${file.name}: only JPG, PNG or WEBP is allowed.`);
        return false;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        showToast(`${file.name}: file is too large (maximum 2 MB).`);
        return false;
      }
      return true;
    });
    if (!valid.length) return;
    try {
      const compressed = await Promise.all(valid.map(compressImage));
      setFiles([...files, ...compressed]);
      showToast(`${compressed.length} picture(s) ready to upload.`);
    } catch {
      setFiles([...files, ...valid]);
      showToast("Could not optimise the image; the original will be uploaded.");
    }
  }

  return <div>
    <label className="text-xs font-bold block mb-2" style={{ color: C.textSub }}>Location pictures (maximum 5)</label>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
      {existing.map((url) => <div key={url} className="relative">
        <img src={url} alt="Location" className="w-full h-28 object-cover rounded-xl" />
        <button type="button" onClick={() => onRemoveExisting(url)} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow" aria-label="Remove existing picture"><X size={13} /></button>
      </div>)}
      {files.map((file, index) => <div key={`${file.name}-${index}`} className="relative">
        <img src={previews[index]} alt={file.name} className="w-full h-28 object-cover rounded-xl" />
        <button type="button" onClick={() => setFiles(files.filter((_, i) => i !== index))} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow" aria-label={`Remove ${file.name}`}><X size={13} /></button>
      </div>)}
      {!existing.length && !files.length && <div className="col-span-full h-28 rounded-xl border-2 border-dashed flex items-center justify-center" style={{ borderColor: C.border }}><ImageIcon size={25} style={{ color: C.textMuted }} /></div>}
    </div>
    {existing.length + files.length < MAX_IMAGES && <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-xl py-3 cursor-pointer text-sm font-bold" style={{ borderColor: C.border, color: C.jungle }}>
      <Upload size={16} /> Add pictures
      <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { selectImages(event.target.files); event.currentTarget.value = ""; }} />
    </label>}
    <p className="text-[10px] mt-1" style={{ color: C.textMuted }}>Images are compressed before upload. Maximum 2 MB per picture. The first picture is used as the cover.</p>
  </div>;
}
