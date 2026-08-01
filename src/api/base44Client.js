/**
 * Local mock of the Base44 SDK — no Base44 platform required.
 * Data is stored in browser localStorage. Auth is simple email/password.
 */

import { SEED_LOCATIONS, SEED_USERS } from "./seedData";

const STORAGE_PREFIX = "seekmy_";
const COLLECTIONS = [
  "Location",
  "Review",
  "Bookmark",
  "ActivityLog",
  "Badge",
  "Contributor",
  "User",
];

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
}

function ensureSeeded() {
  if (!localStorage.getItem(STORAGE_PREFIX + "seeded")) {
    save("Location", SEED_LOCATIONS);
    save("Review", []);
    save("Bookmark", []);
    save("ActivityLog", []);
    save("Badge", []);
    save("Contributor", []);
    save("User", SEED_USERS);
    localStorage.setItem(STORAGE_PREFIX + "seeded", "1");
  }
}

function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function sortItems(items, sort) {
  if (!sort) return items;
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return [...items].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
}

function matchesFilter(item, filter) {
  if (!filter) return true;
  return Object.entries(filter).every(([k, v]) => {
    if (v === undefined) return true;
    if (Array.isArray(item[k])) return item[k].includes(v);
    return item[k] === v;
  });
}

function makeEntityApi(name) {
  return {
    async list(sort, limit) {
      ensureSeeded();
      let items = load(name, []);
      items = sortItems(items, sort);
      if (limit != null) items = items.slice(0, limit);
      return items;
    },
    async filter(filter, sort, limit) {
      ensureSeeded();
      let items = load(name, []).filter((i) => matchesFilter(i, filter));
      items = sortItems(items, sort);
      if (limit != null) items = items.slice(0, limit);
      return items;
    },
    async get(id) {
      ensureSeeded();
      const item = load(name, []).find((i) => i.id === id);
      if (!item) throw Object.assign(new Error("Not found"), { status: 404 });
      return item;
    },
    async create(data) {
      ensureSeeded();
      const items = load(name, []);
      const currentUser = await getCurrentUser();
      const record = {
        ...data,
        id: uid(name.toLowerCase()),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        created_by: currentUser?.email || null,
        created_by_id: currentUser?.id || null,
      };
      items.push(record);
      save(name, items);
      return record;
    },
    async update(id, data) {
      ensureSeeded();
      const items = load(name, []);
      const idx = items.findIndex((i) => i.id === id);
      if (idx < 0) throw Object.assign(new Error("Not found"), { status: 404 });
      items[idx] = {
        ...items[idx],
        ...data,
        id,
        updated_date: new Date().toISOString(),
      };
      save(name, items);
      return items[idx];
    },
    async delete(id) {
      ensureSeeded();
      const items = load(name, []).filter((i) => i.id !== id);
      save(name, items);
      return { success: true };
    },
  };
}

// --- Token signing ---
// This app has no real backend, so this key ships inside the client bundle
// and cannot be a genuine secret. Its job is to stop the token being forged
// in ten seconds via devtools (the old `btoa(JSON.stringify(user))` had zero
// integrity check — anyone could hand-craft `{ role: "admin" }` and be let
// into /admin). It is a deterrent against casual tampering, not a real
// security boundary. A production deployment needs a server that issues and
// verifies tokens itself.
const TOKEN_SECRET = "seekmy-local-demo-signing-key-v1";

async function hmacSign(message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(TOKEN_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getCurrentUser() {
  const token = localStorage.getItem(STORAGE_PREFIX + "token");
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  const expected = await hmacSign(payload);
  if (signature !== expected) return null;
  try {
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

async function setToken(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_PREFIX + "token");
    return;
  }
  const { password, ...safe } = user;
  const payload = btoa(JSON.stringify(safe));
  const signature = await hmacSign(payload);
  localStorage.setItem(STORAGE_PREFIX + "token", `${payload}.${signature}`);
}

const entities = Object.fromEntries(COLLECTIONS.map((n) => [n, makeEntityApi(n)]));

const auth = {
  async me() {
    ensureSeeded();
    const user = await getCurrentUser();
    if (!user) throw Object.assign(new Error("Unauthorized"), { status: 401 });
    return user;
  },

  async isAuthenticated() {
    return !!(await getCurrentUser());
  },

  async loginViaEmailPassword(email, password) {
    ensureSeeded();
    const users = load("User", []);
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) {
      throw Object.assign(new Error("Invalid email or password"), { status: 401 });
    }
    await setToken(user);
    return user;
  },

  async register({ email, password, full_name }) {
    ensureSeeded();
    const users = load("User", []);
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw Object.assign(new Error("Email already registered"), { status: 400 });
    }
    // Store pending registration; OTP step completes it
    const pending = { email, password, full_name: full_name || email.split("@")[0] };
    localStorage.setItem(STORAGE_PREFIX + "pending_reg", JSON.stringify(pending));
    localStorage.setItem(STORAGE_PREFIX + "demo_otp", "123456");
    return { success: true, message: "OTP sent (use 123456 in local mode)" };
  },

  async verifyOtp({ email, otpCode }) {
    const expected = localStorage.getItem(STORAGE_PREFIX + "demo_otp") || "123456";
    if (otpCode !== expected) {
      throw Object.assign(new Error("Invalid OTP"), { status: 400 });
    }
    const pendingRaw = localStorage.getItem(STORAGE_PREFIX + "pending_reg");
    if (!pendingRaw) {
      throw Object.assign(new Error("No pending registration"), { status: 400 });
    }
    const pending = JSON.parse(pendingRaw);
    if (pending.email.toLowerCase() !== email.toLowerCase()) {
      throw Object.assign(new Error("Email mismatch"), { status: 400 });
    }
    const users = load("User", []);
    const user = {
      id: uid("user"),
      email: pending.email,
      password: pending.password,
      full_name: pending.full_name,
      role: "user",
      created_date: new Date().toISOString(),
    };
    users.push(user);
    save("User", users);
    localStorage.removeItem(STORAGE_PREFIX + "pending_reg");
    await setToken(user);
    return { access_token: localStorage.getItem(STORAGE_PREFIX + "token"), user };
  },

  async resendOtp(email) {
    localStorage.setItem(STORAGE_PREFIX + "demo_otp", "123456");
    return { success: true, message: "OTP resent (use 123456)" };
  },

  setToken(token) {
    if (token) localStorage.setItem(STORAGE_PREFIX + "token", token);
    else localStorage.removeItem(STORAGE_PREFIX + "token");
  },

  async loginWithProvider(provider, redirectPath = "/") {
    // Simulated Google login — creates/logs in demo user
    ensureSeeded();
    const users = load("User", []);
    let user = users.find((u) => u.email === "google@seekmy.local");
    if (!user) {
      user = {
        id: uid("user"),
        email: "google@seekmy.local",
        password: "",
        full_name: "Google User",
        role: "user",
        created_date: new Date().toISOString(),
      };
      users.push(user);
      save("User", users);
    }
    await setToken(user);
    window.location.href = redirectPath || "/";
  },

  async resetPasswordRequest(email) {
    localStorage.setItem(STORAGE_PREFIX + "reset_email", email);
    localStorage.setItem(STORAGE_PREFIX + "reset_token", "reset-demo-token");
    return { success: true, message: "Reset link sent (local: use token reset-demo-token)" };
  },

  async resetPassword({ resetToken, newPassword }) {
    const expected = localStorage.getItem(STORAGE_PREFIX + "reset_token");
    const email = localStorage.getItem(STORAGE_PREFIX + "reset_email");
    if (resetToken !== expected || !email) {
      throw Object.assign(new Error("Invalid reset token"), { status: 400 });
    }
    const users = load("User", []);
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx < 0) throw Object.assign(new Error("User not found"), { status: 404 });
    users[idx].password = newPassword;
    save("User", users);
    localStorage.removeItem(STORAGE_PREFIX + "reset_token");
    localStorage.removeItem(STORAGE_PREFIX + "reset_email");
    return { success: true };
  },

  async updateCurrentUser(patch) {
    const current = await getCurrentUser();
    if (!current) throw Object.assign(new Error("Unauthorized"), { status: 401 });
    const users = load("User", []);
    const idx = users.findIndex((u) => u.id === current.id);
    if (idx < 0) throw Object.assign(new Error("User not found"), { status: 404 });
    users[idx] = { ...users[idx], ...patch, id: current.id };
    save("User", users);
    await setToken(users[idx]); // re-sign so the token reflects the change
    return users[idx];
  },

  async changePassword({ oldPassword, newPassword }) {
    const current = await getCurrentUser();
    if (!current) throw Object.assign(new Error("Unauthorized"), { status: 401 });
    const users = load("User", []);
    const idx = users.findIndex((u) => u.id === current.id);
    if (idx < 0) throw Object.assign(new Error("User not found"), { status: 404 });
    if (users[idx].password !== oldPassword) {
      throw Object.assign(new Error("Current password is incorrect"), { status: 400 });
    }
    if (!newPassword || newPassword.length < 6) {
      throw Object.assign(new Error("New password must be at least 6 characters"), { status: 400 });
    }
    users[idx].password = newPassword;
    save("User", users);
    return { success: true };
  },

  async deleteCurrentAccount() {
    const current = await getCurrentUser();
    if (!current) throw Object.assign(new Error("Unauthorized"), { status: 401 });
    save("User", load("User", []).filter((u) => u.id !== current.id));
    await setToken(null);
    return { success: true };
  },

  logout(redirectUrl) {
    setToken(null);
    if (redirectUrl) window.location.href = redirectUrl.startsWith("http") ? "/" : redirectUrl;
  },

  redirectToLogin() {
    window.location.href = "/login";
  },
};

const functions = {
  async invoke(name, payload = {}) {
    if (name === "getWeather") {
      const temp = 28 + Math.floor(Math.random() * 6);
      return {
        data: {
          current: {
            temp,
            feelsLike: temp + 2,
            desc: "Clouds",
            descFull: "scattered clouds",
            icon: "03d",
            humidity: 70 + Math.floor(Math.random() * 20),
            wind: 8 + Math.floor(Math.random() * 10),
            clouds: 40,
            locationName: "Malaysia",
          },
          forecast: Array.from({ length: 8 }, (_, i) => ({
            time: new Date(Date.now() + i * 3 * 3600000).toISOString(),
            temp: temp - 2 + Math.floor(Math.random() * 5),
            desc: ["Clear", "Clouds", "Rain"][i % 3],
            icon: ["01d", "03d", "10d"][i % 3],
          })),
        },
      };
    }

    if (name === "searchGooglePlaces") {
      const q = (payload.query || "").toLowerCase();
      ensureSeeded();
      const locs = load("Location", []).filter(
        (l) =>
          !q ||
          l.name.toLowerCase().includes(q) ||
          l.state.toLowerCase().includes(q) ||
          (l.activity_types || []).some((a) => a.toLowerCase().includes(q))
      );
      return {
        data: {
          places: locs.slice(0, 15).map((l) => ({
            id: l.id,
            name: l.name,
            address: `${l.state}, Malaysia`,
            rating: l.avg_rating || 0,
            ratingCount: l.review_count || 0,
            photoUrl: l.image_url,
            latitude: l.latitude,
            longitude: l.longitude,
            types: l.activity_types || [],
          })),
        },
      };
    }

    if (name === "addToGoogleCalendar") {
      if (payload.checkOnly) {
        return { data: { connected: true } };
      }
      return {
        data: {
          success: true,
          eventId: uid("event"),
          htmlLink: "#",
          summary: payload.title,
        },
      };
    }

    return { data: {} };
  },
};

const integrations = {
  Core: {
    async InvokeLLM({ prompt, response_json_schema }) {
      ensureSeeded();
      const locs = load("Location", []).filter((l) => l.status === "active");
      const picks = locs.sort(() => Math.random() - 0.5).slice(0, 3);

      if (response_json_schema) {
        return {
          recommendations: picks.map((l) => ({
            name: l.name,
            state: l.state,
            reason: `Great match for outdoor explorers — ${l.activity_types?.join(", ") || "various activities"} in ${l.state}. Difficulty: ${l.difficulty || "N/A"}.`,
          })),
        };
      }

      // Chatbot-style text reply
      const list = picks
        .map((l) => `• **${l.name}** (${l.state}) — ${l.activity_types?.join(", ") || "outdoor"} · ${l.difficulty || "various"} difficulty`)
        .join("\n");
      return (
        `Great question about outdoor activities in Malaysia!\n\n` +
        `Here are a few spots you might enjoy:\n${list}\n\n` +
        `Tips: check weather before you go, bring enough water, and respect local guidelines. ` +
        `(Local mode — responses are generated offline without an external AI API.)`
      );
    },
  },
};

const connectors = {
  async connectAppUser() {
    return "#";
  },
};

export const base44 = {
  entities,
  auth,
  functions,
  integrations,
  connectors,
};

// Auto-seed on import in browser
if (typeof window !== "undefined") {
  try {
    ensureSeeded();
  } catch {
    /* ignore */
  }
}
