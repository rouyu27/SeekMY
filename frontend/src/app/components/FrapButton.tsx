// Shared Integration Code - used by multiple SeekMY modules/members.
// Member-specific ownership is documented in MODULE_OWNERSHIP.md.
import { MessageCircle, MapPin } from "lucide-react";
import type { Page } from "../lib/types";
import { C } from "../lib/tokens";

/** Floating action button — Explore/Discover opens Suggest Location; other pages open AI chat */
export function FrapButton({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  // Hide on pages where FAB is not useful
  if (page === "ai" || page === "suggest" || page === "admin") return null;

  // Discover / Explore only → Suggest a location
  if (page === "explore") {
    return (
      <button
        type="button"
        onClick={() => setPage("suggest")}
        title="Suggest a location"
        className="fixed bottom-6 right-5 z-40 w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all active:scale-95 hover:scale-105"
        style={{
          backgroundColor: C.amber,
          boxShadow: `0 2px 8px rgba(27,67,50,0.20), 0 8px 20px rgba(27,67,50,0.14)`,
        }}
      >
        <MapPin size={22} style={{ color: C.jungle }} />
      </button>
    );
  }

  // All other pages → AI chat
  return (
    <button
      type="button"
      onClick={() => setPage("ai")}
      title="AI Guide"
      className="fixed bottom-6 right-5 z-40 w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all active:scale-95 hover:scale-105"
      style={{
        backgroundColor: C.amber,
        boxShadow: `0 2px 8px rgba(27,67,50,0.20), 0 8px 20px rgba(27,67,50,0.14)`,
      }}
    >
      <MessageCircle size={21} style={{ color: C.jungle }} />
    </button>
  );
}
