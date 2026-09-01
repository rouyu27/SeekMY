// FILE PRIMARY OWNER: WONG YUE SHAN | Local Contributor / Location Suggestion
// GitHub target: feature/wong-yue-shan -> Pull Request -> main

//==================== WongYueShan Part - Local Contributor / Location Suggestion ====================
import { useState } from "react";
import {
  ChevronLeft,
  MapPin,
  Check,
  AlertTriangle,
  FileUp,
  ImageIcon,
  Search,
  WalletCards,
  X,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import type { AppUser, Page } from "../lib/types";
import { C, F } from "../lib/tokens";
import { Pill } from "../components/Atoms";
import { ALL_STATES } from "../lib/constants";
import { firebaseClient } from "../api/firebaseClient";
import type { LocationSubmission } from "../lib/communityTypes";

//==================== LimRouYu Part - Suggest Location Map Confirmation Integration ====================
import {
  geocodeMapLocation,
  reverseGeocodeLocation,
} from "../lib/mapGeocoding";
//==================== LimRouYu END - Suggest Location Map Confirmation Integration ====================

const ACTIVITIES =
  "Hiking,Diving,Cycling,Camping,Swimming,Trail Running,Jogging,Rock Climbing,Water Sports".split(",");
const MAX_LOCATION_PHOTOS = 5;

type BudgetLevel = "Free" | "Low" | "Medium" | "High";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Estimated cost classification used for suggestions and official locations.
// RM0 = Free
// RM1-RM20 = Low
// RM21-RM50 = Medium
// RM51+ = High
function getBudgetLevel(price: number): BudgetLevel {
  if (price <= 0) return "Free";
  if (price <= 20) return "Low";
  if (price <= 50) return "Medium";
  return "High";
}

function parsePriceRange(minValue: string, maxValue: string): { min: number; max: number; label: string } | null {
  const minText = minValue.trim();
  const maxText = maxValue.trim();
  if (!minText && !maxText) return null;
  if (!/^\d+(?:\.\d{1,2})?$/.test(minText || maxText)) return null;
  if (maxText && !/^\d+(?:\.\d{1,2})?$/.test(maxText)) return null;
  const min = Number(minText || maxText);
  const max = Number(maxText || minText);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) return null;
  const format = (price: number) => Number.isInteger(price) ? String(price) : price.toFixed(2);
  return {
    min,
    max,
    label: min === max ? format(min) : `${format(min)}-${format(max)}`,
  };
}

function withTimeout<T>(
  work: Promise<T>,
  milliseconds: number,
  message: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(message)),
      milliseconds
    );
  });

  return Promise.race([work, timeout]).finally(() => {
    clearTimeout(timeoutId);
  });
}

export function SuggestLocationPage({
  user,
  setPage,
  onToast,
}: {
  user: AppUser | null;
  setPage: (p: Page) => void;
  onToast?: (msg: string, type?: "ok" | "err") => void;
}) {
  const [name, setName] = useState("");
  const [state, setState] = useState("Selangor");
  const [activity, setActivity] = useState("Hiking");
  const [difficulty, setDifficulty] = useState("Easy");
  const [description, setDescription] = useState("");
  const [facilities, setFacilities] = useState("");
  const [accessibility, setAccessibility] = useState("");

  //==================== WongYueShan Part - Suggested Location Price ====================
  const [estimatedPriceMin, setEstimatedPriceMin] = useState("");
  const [estimatedPriceMax, setEstimatedPriceMax] = useState("");
  const priceRange = parsePriceRange(estimatedPriceMin, estimatedPriceMax);
  const budget = getBudgetLevel(priceRange?.max ?? 0);
  //==================== WongYueShan END - Suggested Location Price ====================

  //==================== LimRouYu Part - Map Confirmation State ====================
  const [detectedLocation, setDetectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [findingLocation, setFindingLocation] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  //==================== LimRouYu END - Map Confirmation State ====================

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const inputStyle = {
    borderColor: C.border,
    fontFamily: F.body,
    color: C.text,
  } as const;

  function resetDetectedLocation() {
    setDetectedLocation(null);
    setLocationConfirmed(false);
  }

  if (!user) {
    return (
      <div
        className="pt-14 min-h-screen flex items-center justify-center px-6"
        style={{ backgroundColor: C.cream }}
      >
        <div className="text-center max-w-sm">
          <MapPin
            size={40}
            className="mx-auto mb-3"
            style={{ color: C.textMuted }}
          />
          <h1
            className="text-2xl font-normal mb-2"
            style={{ fontFamily: F.display, color: C.text }}
          >
            Suggest a location
          </h1>
          <p
            className="text-sm mb-4"
            style={{ color: C.textMuted, fontFamily: F.body }}
          >
            Sign in to suggest a new outdoor location for SeekMY.
          </p>
          <Pill variant="filled" onClick={() => setPage("account")}>
            Go to Account
          </Pill>
        </div>
      </div>
    );
  }

  async function onPhotos(fileList?: FileList | null) {
    setMsg(null);
    if (!fileList?.length) return;

    const remainingSlots = MAX_LOCATION_PHOTOS - photoFiles.length;
    if (remainingSlots <= 0) {
      setMsg({ type: "err", text: "Maximum 5 pictures per location." });
      return;
    }

    const validFiles: File[] = [];
    for (const file of Array.from(fileList).slice(0, remainingSlots)) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setMsg({
          type: "err",
          text: `${file.name}: please upload a JPG, PNG, or WEBP image.`,
        });
        continue;
      }

      if (file.size > 2 * 1024 * 1024) {
        setMsg({
          type: "err",
          text: `${file.name}: photo must be under 2MB.`,
        });
        continue;
      }

      validFiles.push(file);
    }

    if (!validFiles.length) return;

    try {
      const previews = await Promise.all(validFiles.map(fileToDataUrl));
      setPhotoFiles([...photoFiles, ...validFiles]);
      setPhotoPreviews([...photoPreviews, ...previews]);
    } catch {
      setMsg({
        type: "err",
        text: "Could not read one of the images. Please try another file.",
      });
    }
  }

  function removePhoto(index: number) {
    setPhotoFiles(photoFiles.filter((_, itemIndex) => itemIndex !== index));
    setPhotoPreviews(photoPreviews.filter((_, itemIndex) => itemIndex !== index));
  }

  function reorderPhoto(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;

    const nextFiles = [...photoFiles];
    const nextPreviews = [...photoPreviews];
    const [movedFile] = nextFiles.splice(fromIndex, 1);
    const [movedPreview] = nextPreviews.splice(fromIndex, 1);
    nextFiles.splice(toIndex, 0, movedFile);
    nextPreviews.splice(toIndex, 0, movedPreview);
    setPhotoFiles(nextFiles);
    setPhotoPreviews(nextPreviews);
  }

  //==================== LimRouYu Part - Find and Confirm Suggested Place ====================
  async function handleFindLocation() {
    setMsg(null);
    resetDetectedLocation();

    if (!name.trim()) {
      setMsg({
        type: "err",
        text: "Please enter the place name before searching the map.",
      });
      return;
    }

    setFindingLocation(true);

    try {
      const found = await geocodeMapLocation({
        name: name.trim(),
        state,
      });

      if (!found) {
        setMsg({
          type: "err",
          text: "Place not found. Please check that the place name and selected state are correct.",
        });
        return;
      }

      const detectedAddress =
        (await reverseGeocodeLocation(found.lat, found.lng)) ||
        found.label ||
        `${name.trim()}, ${state}, Malaysia`;

      setDetectedLocation({
        lat: found.lat,
        lng: found.lng,
        address: detectedAddress,
      });
    } catch (error) {
      console.error(error);
      setMsg({
        type: "err",
        text: "Unable to find this location. Please check your input and try again.",
      });
    } finally {
      setFindingLocation(false);
    }
  }
  //==================== LimRouYu END - Find and Confirm Suggested Place ====================

  async function submit() {
    setMsg(null);

    if (!user) {
      setMsg({
        type: "err",
        text: "Please sign in before submitting a location.",
      });
      return;
    }

    const currentUser = user;

    if (!name.trim() || !description.trim()) {
      setMsg({
        type: "err",
        text: "Please complete all required fields (name and description).",
      });
      return;
    }

    if (!detectedLocation || !locationConfirmed) {
      setMsg({
        type: "err",
        text: "Please find the place on the map and confirm that the marker is correct before submitting.",
      });
      return;
    }

    const parsedPrice = parsePriceRange(estimatedPriceMin, estimatedPriceMax);
    if (!parsedPrice) {
      setMsg({
        type: "err",
        text: "Please enter a valid estimated cost. Max RM must be the same or higher than Min RM.",
      });
      return;
    }

    if (!photoFiles.length) {
      setMsg({
        type: "err",
        text: "A photo is required. Please upload at least one picture of the location.",
      });
      return;
    }

    setSaving(true);

    try {
      const [profile, contributorApplications] = await Promise.all([
        firebaseClient.entities.User.get(currentUser.id),
        firebaseClient.entities.Contributor.filter({
          created_by_id: currentUser.id,
        }),
      ]);

      const approvedStatuses = ["approved", "verified"];
      const contributorApproved =
        approvedStatuses.includes(String(profile.contributorStatus || "")) ||
        contributorApplications.some((application: any) =>
          approvedStatuses.includes(String(application.status || ""))
        );

      if (!contributorApproved) {
        setMsg({
          type: "err",
          text: "Only approved contributors can submit new locations. Please register in the Local Contributor Portal and wait for admin approval first.",
        });
        return;
      }

      const [existingLocations, mySubmissions] = await Promise.all([
        firebaseClient.entities.Location.filter({ state }),
        firebaseClient.entities.LocationSubmission.filter({
          created_by_id: currentUser.id,
        }),
      ]);

      const duplicate = [...existingLocations, ...mySubmissions].some(
        (x: any) =>
          String(x.name || "").toLowerCase() ===
            name.trim().toLowerCase() &&
          String(x.state || "") === state
      );

      if (duplicate) {
        setMsg({
          type: "err",
          text: "This location already exists in SeekMY or in your suggestion queue.",
        });
        return;
      }

      const photoUrls = await Promise.all(
        photoFiles.map((file) => firebaseClient.storage.uploadLocationPhoto(file))
      );

      const price = parsedPrice.max;
      const payload: Omit<LocationSubmission, "id"> = {
        contributorId: currentUser.id,
        contributorName: currentUser.displayName,
        name: name.trim(),
        address: detectedLocation.address,
        lat: detectedLocation.lat,
        lng: detectedLocation.lng,
        locationConfirmed: true,
        state,
        activity,
        difficulty,
        description: description.trim(),
        facilities: facilities.trim(),
        accessibility: accessibility.trim(),
        estimatedPrice: price,
        estimatedPriceRange: parsedPrice.label,
        budget: getBudgetLevel(price),
        photoUrl: photoUrls[0],
        photoUrls,
        photoName: photoFiles.map((file) => file.name).join(", "),
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      await withTimeout(
        firebaseClient.entities.LocationSubmission.create(payload),
        15000,
        "Firebase took too long to save the suggestion. Please check your Firestore rules/network and try again."
      );

      setMsg({
        type: "ok",
        text: "Location submitted successfully. You can track it under Profile → My Suggestions. You will be notified when an admin reviews it.",
      });

      onToast?.(
        "Location submitted successfully. Awaiting admin approval."
      );

      setName("");
      setDescription("");
      setFacilities("");
      setAccessibility("");
      setEstimatedPriceMin("");
      setEstimatedPriceMax("");
      setPhotoFiles([]);
      setPhotoPreviews([]);
      resetDetectedLocation();
    } catch (error: any) {
      setMsg({
        type: "err",
        text:
          error?.message ||
          "Unable to submit this location to Firebase.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="pt-14 min-h-screen"
      style={{ backgroundColor: C.cream }}
    >
      <div
        className="px-5 py-6"
        style={{
          background: `linear-gradient(135deg, ${C.jungle} 0%, #0a2318 100%)`,
        }}
      >
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => setPage("explore")}
            className="flex items-center gap-1.5 text-sm mb-3"
            style={{
              color: "rgba(255,255,255,0.7)",
              fontFamily: F.body,
            }}
          >
            <ChevronLeft size={15} /> Back
          </button>

          <h1
            className="text-2xl font-normal text-white"
            style={{ fontFamily: F.display }}
          >
            Suggest a location
          </h1>

          <p
            className="text-sm mt-1"
            style={{
              color: "rgba(255,255,255,0.7)",
              fontFamily: F.body,
            }}
          >
            Search the place on the map, confirm the marker, enter the
            estimated cost, and submit it for admin review.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8">
        {msg && (
          <div
            className="p-4 rounded-xl text-sm font-semibold flex gap-2 mb-4"
            style={{
              backgroundColor:
                msg.type === "ok" ? C.successBg : C.errorBg,
              color: msg.type === "ok" ? C.success : C.error,
              fontFamily: F.body,
            }}
          >
            {msg.type === "ok" ? (
              <Check size={16} />
            ) : (
              <AlertTriangle size={16} />
            )}
            {msg.text}
          </div>
        )}

        <div
          className="bg-white rounded-[18px] p-6 space-y-4"
          style={{
            boxShadow: "0 1px 3px rgba(27,67,50,0.1)",
          }}
        >
          <div className="flex items-center gap-2">
            <MapPin size={16} style={{ color: C.jungle }} />
            <h2
              className="font-bold text-sm"
              style={{ fontFamily: F.body, color: C.text }}
            >
              Location details
            </h2>
          </div>

          <input
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none"
            style={inputStyle}
            placeholder="Location name *"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              resetDetectedLocation();
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              className="px-4 py-3 rounded-xl text-sm border outline-none"
              style={inputStyle}
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                resetDetectedLocation();
              }}
            >
              {ALL_STATES.map((s) => (
                <option key={s.code} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              className="px-4 py-3 rounded-xl text-sm border outline-none"
              style={inputStyle}
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
            >
              {ACTIVITIES.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleFindLocation}
            disabled={findingLocation}
            className="w-full rounded-xl px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{
              backgroundColor: C.muted,
              color: C.jungle,
              fontFamily: F.body,
            }}
          >
            <Search size={15} />
            {findingLocation ? "Finding Location..." : "Find on Map"}
          </button>

          {/* ==================== LimRouYu Part - Suggested Place Map Preview ==================== */}
          {detectedLocation && (
            <div
              className="rounded-[16px] overflow-hidden border"
              style={{ borderColor: C.border }}
            >
              <div className="p-4 bg-white">
                <p
                  className="font-bold text-sm"
                  style={{ color: C.text, fontFamily: F.body }}
                >
                  Detected location
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: C.textMuted, fontFamily: F.body }}
                >
                  📍 {detectedLocation.address}
                </p>
              </div>

              <div style={{ height: 300, width: "100%" }}>
                <MapContainer
                  key={`${detectedLocation.lat}-${detectedLocation.lng}`}
                  center={[
                    detectedLocation.lat,
                    detectedLocation.lng,
                  ]}
                  zoom={15}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker
                    position={[
                      detectedLocation.lat,
                      detectedLocation.lng,
                    ]}
                  >
                    <Popup>{name}</Popup>
                  </Marker>
                </MapContainer>
              </div>

              <div className="p-4">
                {!locationConfirmed ? (
                  <button
                    type="button"
                    onClick={() => setLocationConfirmed(true)}
                    className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white"
                    style={{
                      backgroundColor: C.jungle,
                      fontFamily: F.body,
                    }}
                  >
                    ✓ Yes, this is the correct location
                  </button>
                ) : (
                  <div
                    className="rounded-xl p-3 text-sm font-bold flex items-center gap-2"
                    style={{
                      backgroundColor: C.successBg,
                      color: C.success,
                      fontFamily: F.body,
                    }}
                  >
                    <Check size={15} />
                    Location confirmed
                  </div>
                )}
              </div>
            </div>
          )}
          {/* ==================== LimRouYu END - Suggested Place Map Preview ==================== */}

          <select
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none"
            style={inputStyle}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option>Easy</option>
            <option>Moderate</option>
            <option>Hard</option>
          </select>

          {/* ==================== WongYueShan Part - Estimated Cost / Budget ==================== */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: C.muted }}
          >
            <div className="flex items-center gap-2 mb-2">
              <WalletCards size={16} style={{ color: C.jungle }} />
              <label
                className="text-sm font-bold"
                style={{ color: C.text, fontFamily: F.body }}
              >
                Estimated Entry / Activity Cost (RM) *
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                inputMode="decimal"
                className="w-full px-4 py-3 rounded-xl text-sm border outline-none bg-white"
                style={inputStyle}
                placeholder="Min RM"
                value={estimatedPriceMin}
                onChange={(e) => setEstimatedPriceMin(e.target.value)}
              />
              <input
                inputMode="decimal"
                className="w-full px-4 py-3 rounded-xl text-sm border outline-none bg-white"
                style={inputStyle}
                placeholder="Max RM"
                value={estimatedPriceMax}
                onChange={(e) => setEstimatedPriceMax(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <span
                className="text-xs"
                style={{ color: C.textMuted, fontFamily: F.body }}
              >
                Automatically classified
              </span>

              <span
                className="text-xs font-bold px-3 py-1 rounded-full"
                style={{
                  backgroundColor: "#fff",
                  color: C.jungle,
                  fontFamily: F.body,
                }}
              >
                {!estimatedPriceMin && !estimatedPriceMax ? "Enter price" : priceRange ? `RM ${priceRange.label} - ${budget}` : "Invalid range"}
              </span>
            </div>

            <p
              className="text-[10px] mt-2"
              style={{ color: C.textMuted, fontFamily: F.body }}
            >
              Type numbers only. For a fixed/free price, fill one box or use the same amount.
            </p>
          </div>
          {/* ==================== WongYueShan END - Estimated Cost / Budget ==================== */}

          <textarea
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none resize-none"
            style={inputStyle}
            rows={3}
            placeholder="Description *"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none"
            style={inputStyle}
            placeholder="Facilities (comma-separated)"
            value={facilities}
            onChange={(e) => setFacilities(e.target.value)}
          />

          <input
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none"
            style={inputStyle}
            placeholder="Accessibility info"
            value={accessibility}
            onChange={(e) => setAccessibility(e.target.value)}
          />

          <div
            className="p-4 rounded-xl border-2 border-dashed"
            style={{
              borderColor: photoFiles.length ? C.forest : C.border,
            }}
          >
            <label className="flex flex-col items-center gap-2 cursor-pointer text-center">
              {photoFiles.length ? (
                <img
                  src={photoPreviews[0]}
                  alt="Preview"
                  className="w-full max-h-48 object-cover rounded-lg"
                />
              ) : (
                <ImageIcon
                  size={32}
                  style={{ color: C.textMuted }}
                />
              )}

              <span
                className="text-sm font-bold flex items-center gap-2"
                style={{ color: C.forest, fontFamily: F.body }}
              >
                <FileUp size={16} />
                Add Pictures ({MAX_LOCATION_PHOTOS - photoFiles.length} left)
              </span>

              <span
                className="text-[11px]"
                style={{ color: C.textMuted, fontFamily: F.body }}
              >
                JPG, PNG or WEBP · max 2MB
              </span>

              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={photoFiles.length >= MAX_LOCATION_PHOTOS}
                onChange={(e) => {
                  onPhotos(e.target.files);
                  e.currentTarget.value = "";
                }}
              />
            </label>

            {photoFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                {photoFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", String(index));
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const fromIndex = Number(event.dataTransfer.getData("text/plain"));
                      if (Number.isInteger(fromIndex)) reorderPhoto(fromIndex, index);
                    }}
                    className="relative overflow-hidden rounded-lg border bg-white cursor-move"
                    style={{ borderColor: index === 0 ? C.amber : C.border }}
                  >
                    <img
                      src={photoPreviews[index]}
                      alt={file.name}
                      className="w-full h-28 object-cover"
                    />
                    <div
                      className="absolute left-1 top-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: index === 0 ? C.jungle : "rgba(0,0,0,0.55)" }}
                    >
                      {index === 0 ? "Cover" : `#${index + 1}`}
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X size={13} />
                    </button>
                    <p
                      className="truncate px-2 py-1 text-[10px]"
                      style={{ color: C.textMuted, fontFamily: F.body }}
                    >
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Pill variant="filled" onClick={submit} disabled={saving}>
              {saving ? "Submitting..." : "Submit suggestion"}
            </Pill>

            <Pill
              variant="outline"
              onClick={() => setPage("explore")}
            >
              Cancel
            </Pill>
          </div>
        </div>
      </div>
    </div>
  );
}
//==================== WongYueShan END - Local Contributor / Location Suggestion ====================

