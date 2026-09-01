import { ArrowLeft, ArrowRight, ImageIcon, Upload, X } from "lucide-react";
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

export function LocationImageUploader({ existing, files, setFiles, setExisting, onRemoveExisting, showToast }: {
  existing: string[];
  files: File[];
  setFiles: (files: File[]) => void;
  setExisting: (urls: string[]) => void;
  onRemoveExisting: (url: string) => void;
  showToast: (message: string) => void;
}) {
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);
  const orderedItems = [
    ...existing.map((url) => ({ kind: "existing" as const, url })),
    ...files.map((file, index) => ({ kind: "file" as const, file, preview: previews[index], index })),
  ];
  const remainingSlots = MAX_IMAGES - existing.length - files.length;

  function replaceOrdered(items: typeof orderedItems) {
    setExisting(items.filter((item) => item.kind === "existing").map((item) => item.url));
    setFiles(items.filter((item) => item.kind === "file").map((item) => item.file));
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= orderedItems.length) return;
    const next = [...orderedItems];
    [next[index], next[target]] = [next[target], next[index]];
    replaceOrdered(next);
  }

  function reorderImage(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    const next = [...orderedItems];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    replaceOrdered(next);
  }

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
      {orderedItems.map((item, index) => <div key={item.kind === "existing" ? item.url : `${item.file.name}-${index}`} draggable onDragStart={(event) => { event.dataTransfer.setData("text/plain", String(index)); event.dataTransfer.effectAllowed = "move"; }} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onDrop={(event) => { event.preventDefault(); const fromIndex = Number(event.dataTransfer.getData("text/plain")); if (Number.isInteger(fromIndex)) reorderImage(fromIndex, index); }} className="relative overflow-hidden rounded-xl border bg-white cursor-move" style={{ borderColor: index === 0 ? C.amber : C.border }}>
        <img src={item.kind === "existing" ? item.url : item.preview} alt={item.kind === "existing" ? "Location" : item.file.name} className="w-full h-28 object-cover" />
        <div className="absolute left-1 top-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: index === 0 ? C.jungle : "rgba(0,0,0,0.55)" }}>{index === 0 ? "Cover" : `#${index + 1}`}</div>
        <button type="button" onClick={() => item.kind === "existing" ? onRemoveExisting(item.url) : setFiles(files.filter((_, i) => i !== item.index))} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow" aria-label="Remove picture"><X size={13} /></button>
        <div className="absolute bottom-1 right-1 flex gap-1">
          <button type="button" disabled={index === 0} onClick={() => moveImage(index, -1)} className="rounded-full bg-white p-1 shadow disabled:opacity-40" aria-label="Move picture earlier"><ArrowLeft size={12}/></button>
          <button type="button" disabled={index === orderedItems.length - 1} onClick={() => moveImage(index, 1)} className="rounded-full bg-white p-1 shadow disabled:opacity-40" aria-label="Move picture later"><ArrowRight size={12}/></button>
        </div>
      </div>)}
      {!existing.length && !files.length && <div className="col-span-full h-28 rounded-xl border-2 border-dashed flex items-center justify-center" style={{ borderColor: C.border }}><ImageIcon size={25} style={{ color: C.textMuted }} /></div>}
    </div>
    {remainingSlots > 0 && <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-xl py-3 cursor-pointer text-sm font-bold" style={{ borderColor: C.border, color: C.jungle }}>
      <Upload size={16} /> Add Pictures ({remainingSlots} left)
      <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { selectImages(event.target.files); event.currentTarget.value = ""; }} />
    </label>}
    <p className="text-[10px] mt-1" style={{ color: C.textMuted }}>You can select several pictures at once or add more later. Drag pictures to arrange the cover and gallery order. Maximum 2 MB per picture.</p>
  </div>;
}
