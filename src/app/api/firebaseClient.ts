// Shared Integration Code - used by multiple SeekMY modules/members.
// Member-specific ownership is documented in MODULE_OWNERSHIP.md.
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  signOut,
  updateProfile as updateFirebaseProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser as deleteFirebaseUser,
  type User,
} from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as take,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";

import { supabase } from "../../supabase";


import {
  auth as firebaseAuth,
  db as firebaseDb,
} from "../../firebase";

/* =========================================================
   ADMIN EMAILS
   ========================================================= */

const teamAdminEmails: string[] = [
  "shanyuew416@gmail.com",
  "claryncreammy05@gmail.com",
  "lowjunfeng5@gmail.com",
  "lim100663@gmail.com",
  "limrouyu9@gmail.com",
  "choongsk36@gmail.com",
];

function isTeamAdminEmail(email?: string | null): boolean {
  return Boolean(
    email &&
      teamAdminEmails.includes(email.toLowerCase())
  );
}

/* =========================================================
   FIREBASE SERVICES
   ========================================================= */

const services = {
  auth: firebaseAuth,
  db: firebaseDb,
};

function firebase() {
  return services;
}

/* =========================================================
   HELPERS
   ========================================================= */

type EntityRecord = {
  id: string;
  [key: string]: any;
};

type FilterValues = Record<string, any>;

function clean(snapshot: any): EntityRecord {
  return {
    id: snapshot.id,
    ...(snapshot.data() as DocumentData),
  };
}

function sortQuery(
  reference: any,
  sort?: string,
  maximum?: number
): any {
  const clauses: QueryConstraint[] = [];

  if (sort) {
    const descending = sort.startsWith("-");
    const field = descending ? sort.slice(1) : sort;

    clauses.push(
      orderBy(field, descending ? "desc" : "asc")
    );
  }

  if (maximum != null) {
    clauses.push(take(maximum));
  }

  return clauses.length
    ? query(reference, ...clauses)
    : reference;
}

function currentUser(): User | null {
  return firebase().auth.currentUser;
}

function isPasswordUser(user: User): boolean {
  return user.providerData.some((provider) => provider.providerId === "password");
}

async function requireVerifiedEmail(user: User): Promise<void> {
  await user.reload();
  if (isPasswordUser(user) && !user.emailVerified) {
    await signOut(firebase().auth);
    throw new Error("Please verify your email before signing in. Check your inbox for the Firebase verification link.");
  }
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

function withoutUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => withoutUndefined(item)).filter((item) => item !== undefined) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, any>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, withoutUndefined(item)])
    ) as T;
  }
  return value;
}

export function isStrongPassword(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

export const PASSWORD_REQUIREMENT =
  "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.";

/* =========================================================
   USER PROFILE
   ========================================================= */

async function profile(user: User): Promise<EntityRecord> {
  const { db } = firebase();

  const reference = doc(
    db,
    "User",
    user.uid
  );

  const existing = await getDoc(reference);

  const existingData: DocumentData =
    existing.exists()
      ? existing.data()
      : {};

  if (existingData.status === "deleted" || existingData.status === "disabled" || existingData.status === "suspended") {
    await signOut(firebase().auth);
    throw new Error(existingData.restrictionReason ? `This account is suspended: ${existingData.restrictionReason}` : "This account has been suspended by an administrator.");
  }

  const now = new Date().toISOString();

  /*
    Team admin emails always receive role = admin.

    Other users:
    - keep existing Firestore role
    - default to "user" for first login
  */
  const role =
    isTeamAdminEmail(user.email)
      ? "admin"
      : existingData.role || "user";

  await setDoc(
    reference,
    {
      email: user.email || "",

      full_name:
        existingData.full_name ||
        user.displayName ||
        user.email?.split("@")[0] ||
        "Explorer",

      username:
        existingData.username ||
        user.displayName ||
        user.email?.split("@")[0] ||
        "explorer",

      photo_url:
        user.photoURL ||
        existingData.photo_url ||
        "",

      role,

      auth_provider:
        user.providerData?.[0]?.providerId ||
        "password",

      last_login: now,

      ...(existing.exists()
        ? {}
        : {
            created_date: now,
          }),
    },
    {
      merge: true,
    }
  );

  const updated = await getDoc(reference);

  return clean(updated);
}

/* =========================================================
   WAIT FOR FIREBASE AUTH
   ========================================================= */

function waitForUser(): Promise<User | null> {
  const { auth } = firebase();

  return new Promise<User | null>(
    (resolve) => {
      const unsubscribe =
        onAuthStateChanged(
          auth,
          (user) => {
            unsubscribe();
            resolve(user);
          }
        );
    }
  );
}

/* =========================================================
   GENERIC FIRESTORE ENTITY
   ========================================================= */

function entity(name: string) {
  return {
    async list(
      sort?: string,
      maximum?: number
    ): Promise<EntityRecord[]> {
      const { db } = firebase();

      const reference = collection(
        db,
        name
      );

      const result = await getDocs(
        sortQuery(
          reference,
          sort,
          maximum
        )
      );

      return result.docs.map(clean);
    },

    async filter(
      filters: FilterValues = {},
      sort?: string,
      maximum?: number
    ): Promise<EntityRecord[]> {
      const { db } = firebase();

      const clauses: QueryConstraint[] =
        Object.entries(filters)
          .filter(
            ([, value]) =>
              value !== undefined
          )
          .map(
            ([field, value]) =>
              where(
                field,
                "==",
                value
              )
          );

      if (sort) {
        const descending =
          sort.startsWith("-");

        const field =
          descending
            ? sort.slice(1)
            : sort;

        clauses.push(
          orderBy(
            field,
            descending
              ? "desc"
              : "asc"
          )
        );
      }

      if (maximum != null) {
        clauses.push(
          take(maximum)
        );
      }

      const reference =
        collection(db, name);

      const result =
        await getDocs(
          query(
            reference,
            ...clauses
          )
        );

      return result.docs.map(clean);
    },

    async get(
      id: string
    ): Promise<EntityRecord> {
      const { db } = firebase();

      const result =
        await getDoc(
          doc(
            db,
            name,
            id
          )
        );

      if (!result.exists()) {
        throw Object.assign(
          new Error("Not found"),
          {
            status: 404,
          }
        );
      }

      return clean(result);
    },

    async create(
      data: Record<string, any>
    ): Promise<EntityRecord> {
      const user =
        currentUser();

      if (!user) {
        throw Object.assign(
          new Error(
            "Please log in first"
          ),
          {
            status: 401,
          }
        );
      }

      const { db } = firebase();

      const created =
        await addDoc(
          collection(
            db,
            name
          ),
          withoutUndefined({
            ...data,

            created_by:
              user.email || "",

            created_by_id:
              user.uid,

            created_date:
              new Date()
                .toISOString(),

            updated_date:
              new Date()
                .toISOString(),

            server_created_at:
              serverTimestamp(),
          })
        );

      return clean(
        await getDoc(created)
      );
    },

    async createWithId(
      id: string,
      data: Record<string, any>
    ): Promise<EntityRecord> {
      const user = currentUser();
      if (!user) throw Object.assign(new Error("Please log in first"), { status: 401 });
      const reference = doc(firebase().db, name, id);
      await setDoc(reference, withoutUndefined({
        ...data,
        created_by: user.email || "",
        created_by_id: user.uid,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        server_created_at: serverTimestamp(),
      }));
      return clean(await getDoc(reference));
    },

    async update(
      id: string,
      data: Record<string, any>
    ): Promise<EntityRecord> {
      const { db } = firebase();

      const reference =
        doc(
          db,
          name,
          id
        );

      await updateDoc(
        reference,
        withoutUndefined({
          ...data,

          updated_date:
            new Date()
              .toISOString(),
        })
      );

      return clean(
        await getDoc(reference)
      );
    },

    async delete(
      id: string
    ): Promise<{
      success: boolean;
    }> {
      const { db } = firebase();

      await deleteDoc(
        doc(
          db,
          name,
          id
        )
      );

      return {
        success: true,
      };
    },
  };
}

/* =========================================================
   AUTHENTICATION
   ========================================================= */

const auth = {
  async me(): Promise<EntityRecord> {
    const user =
      (await waitForUser()) ||
      currentUser();

    if (!user) {
      throw Object.assign(
        new Error(
          "Unauthorized"
        ),
        {
          status: 401,
        }
      );
    }

    await requireVerifiedEmail(user);

    return profile(user);
  },

  async isAuthenticated(): Promise<boolean> {
    const user =
      (await waitForUser()) ||
      currentUser();

    if (!user) {
      return false;
    }

    try {
      await requireVerifiedEmail(user);
      return true;
    } catch {
      return false;
    }
  },

  async loginViaEmailPassword(
    email: string,
    password: string
  ): Promise<EntityRecord> {
    const result =
      await signInWithEmailAndPassword(
        firebase().auth,
        email,
        password
      );

    await requireVerifiedEmail(result.user);

    return profile(result.user);
  },

  async register({
    email,
    password,
    full_name,
    username,
  }: {
    email: string;
    password: string;
    full_name?: string;
    username?: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    const result =
      await createUserWithEmailAndPassword(
        firebase().auth,
        email,
        password
      );

    if (full_name) {
      await updateFirebaseProfile(
        result.user,
        {
          displayName:
            full_name,
        }
      );
    }

    await sendEmailVerification(
      result.user
    );

    await signOut(firebase().auth);

    return {
      success: true,
      message:
        "Verification email sent. Please open the link before signing in.",
    };
  },

  async verifyOtp(): Promise<{
    user: EntityRecord;
  }> {
    const user =
      currentUser();

    if (!user) {
      throw new Error(
        "Please log in again after verifying your email."
      );
    }

    await user.reload();

    if (!user.emailVerified) {
      throw new Error(
        "Your email is not verified yet. Open the verification link, then try again."
      );
    }

    return {
      user:
        await profile(user),
    };
  },

  async resendOtp(): Promise<{
    success: boolean;
  }> {
    const user =
      currentUser();

    if (!user) {
      throw new Error(
        "Please log in again to resend verification."
      );
    }

    await sendEmailVerification(
      user
    );

    return {
      success: true,
    };
  },

  async resendVerificationEmail(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
  }> {
    const result =
      await signInWithEmailAndPassword(
        firebase().auth,
        email,
        password
      );

    if (result.user.emailVerified) {
      await signOut(firebase().auth);
      return { success: true };
    }

    await sendEmailVerification(result.user);
    await signOut(firebase().auth);
    return { success: true };
  },

  setToken(): void {
    // Kept for compatibility.
  },

  async loginWithProvider(): Promise<EntityRecord> {
    const provider =
      new GoogleAuthProvider();

    provider.setCustomParameters({
      prompt:
        "select_account",
    });

    const result =
      await signInWithPopup(
        firebase().auth,
        provider
      );

    return profile(
      result.user
    );
  },

  async resetPasswordRequest(
    email: string
  ): Promise<{
    success: boolean;
  }> {
    await sendPasswordResetEmail(
      firebase().auth,
      email,
      {
        url:
          `${window.location.origin}/login`,
      }
    );

    return {
      success: true,
    };
  },

  async resetPassword({
    resetToken,
    newPassword,
  }: {
    resetToken: string;
    newPassword: string;
  }): Promise<{
    success: boolean;
  }> {
    await confirmPasswordReset(
      firebase().auth,
      resetToken,
      newPassword
    );

    return {
      success: true,
    };
  },

  async updateProfile({
    full_name,
    photo_url,
  }: {
    full_name?: string;
    photo_url?: string;
  }): Promise<EntityRecord> {
    const user =
      currentUser();

    if (!user) {
      throw new Error(
        "Please log in first."
      );
    }

    await updateFirebaseProfile(user, {
      ...(full_name ? { displayName: full_name } : {}),
      ...(photo_url !== undefined ? { photoURL: photo_url } : {}),
    });

    await updateDoc(
      doc(
        firebase().db,
        "User",
        user.uid
      ),
      {
        ...(full_name ? { full_name } : {}),
        ...(photo_url !== undefined ? { photo_url } : {}),

        updated_date:
          new Date()
            .toISOString(),
      }
    );

    return profile(user);
  },

  async changePassword({
    oldPassword,
    newPassword,
  }: {
    oldPassword: string;
    newPassword: string;
  }): Promise<void> {
    const user =
      currentUser();

    if (!user?.email) {
      throw new Error(
        "Password changes are unavailable for this account."
      );
    }

    const credential =
      EmailAuthProvider
        .credential(
          user.email,
          oldPassword
        );

    await reauthenticateWithCredential(
      user,
      credential
    );

    await updatePassword(
      user,
      newPassword
    );
  },

  async deleteAccount(): Promise<void> {
    const user =
      currentUser();

    if (!user) {
      throw new Error(
        "Please log in first."
      );
    }

    for (const collection of ["Bookmark", "ActivityLog", "Badge", "Contributor", "LocationSubmission", "Review"]) {
      const records = await entity(collection).filter({ created_by_id: user.uid }, undefined, 500);
      await Promise.all(records.map((record) => entity(collection).delete(String(record.id))));
    }
    const announcements = await entity("Announcement").filter({ userId: user.uid }, undefined, 500);
    await Promise.all(announcements.map((record) => entity("Announcement").delete(String(record.id))));
    await deleteDoc(doc(firebase().db, "User", user.uid));
    await deleteFirebaseUser(user);
  },

  async adminDeleteUser(uid: string): Promise<void> {
    const now = new Date().toISOString();

    await backend.adminDeleteUserData(uid);

    for (const collection of ["Bookmark", "ActivityLog", "Badge", "Contributor", "LocationSubmission", "Review"]) {
      const createdRows = await entity(collection).filter({ created_by_id: uid }, undefined, 500);
      const userRows = await entity(collection).filter({ userId: uid }, undefined, 500);
      const contributorRows = await entity(collection).filter({ contributorId: uid }, undefined, 500);
      const rows = [...createdRows, ...userRows, ...contributorRows];
      const ids = [...new Set(rows.map((record) => String(record.id)))];
      await Promise.all(ids.map((id) => entity(collection).delete(id)));
    }

    const announcements = await entity("Announcement").filter({ userId: uid }, undefined, 500);
    await Promise.all(announcements.map((record) => entity("Announcement").delete(String(record.id))));

    await setDoc(
      doc(firebase().db, "User", uid),
      {
        status: "deleted",
        role: "user",
        deleted_at: now,
        full_name: "Deleted user",
        username: `deleted_${uid.slice(0, 8)}`,
        photo_url: "",
      },
      { merge: true }
    );
  },

  async logout(
    redirectUrl?: string
  ): Promise<void> {
    await signOut(
      firebase().auth
    );

    if (redirectUrl) {
      window.location.href =
        redirectUrl;
    }
  },

  redirectToLogin(): void {
    window.location.href =
      "/login";
  },
};

/* =========================================================
   FUNCTIONS / EXTERNAL API
   ========================================================= */

const functions = {
  async invoke(
    name: string,
    payload: Record<string, any> = {}
  ): Promise<any> {
    if (name === "getWeather") {
      const response: any = await getFreeWeather(payload);
      const current = response.current;
      const forecast = response.forecast;

      return {
        data: {
          current: {
            temp:
              Math.round(
                current.main.temp
              ),

            feelsLike:
              Math.round(
                current.main
                  .feels_like
              ),

            desc:
              current.weather[0]
                .main,

            descFull:
              current.weather[0]
                .description,

            icon:
              current.weather[0]
                .icon,

            humidity:
              current.main
                .humidity,

            wind:
              Math.round(
                current.wind.speed *
                  3.6
              ),

            clouds:
              current.clouds.all,

            locationName:
              current.name,
          },

          forecast:
            forecast.list
              .slice(0, 8)
              .map(
                (item: any) => ({
                  time:
                    new Date(
                      item.dt *
                        1000
                    )
                      .toISOString(),

                  temp:
                    Math.round(
                      item.main
                        .temp
                    ),

                  desc:
                    item.weather[0]
                      .main,

                  icon:
                    item.weather[0]
                      .icon,
                })
              ),
        },
      };
    }

    if (
      name ===
      "searchGooglePlaces"
    ) {
      const locations =
        await entity(
          "Location"
        ).list(
          "name",
          100
        );

      const term =
        String(
          payload.query || ""
        )
          .toLowerCase();

      return {
        data: {
          places:
            locations
              .filter(
                (item) =>
                  !term ||
                  `${item.name} ${item.state} ${(item.activity_types || []).join(" ")}`
                    .toLowerCase()
                    .includes(term)
              )
              .slice(0, 15),
        },
      };
    }

    throw new Error(
      `${name} requires a Firebase Cloud Function and has not been configured.`
    );
  },
};

async function getFreeWeather(payload: { locationName?: string; state?: string; lat?: number; lng?: number }) {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error("Add VITE_OPENWEATHER_API_KEY to .env.local to enable live weather.");
  const params = new URLSearchParams({ appid: apiKey, units: "metric" });
  const lat = Number(payload.lat);
  const lng = Number(payload.lng);
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    params.set("lat", String(lat));
    params.set("lon", String(lng));
  } else {
    params.set("q", `${payload.locationName || payload.state || "Kuala Lumpur"},MY`);
  }
  const [currentResponse, forecastResponse, uvResponse] = await Promise.all([
    fetch(`https://api.openweathermap.org/data/2.5/weather?${params}`),
    fetch(`https://api.openweathermap.org/data/2.5/forecast?${params}`),
    hasCoordinates
      ? fetch(`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(String(lat))}&longitude=${encodeURIComponent(String(lng))}&hourly=uv_index&forecast_days=1&timezone=Asia%2FKuala_Lumpur`).catch(() => null)
      : Promise.resolve(null),
  ]);
  if (!currentResponse.ok || !forecastResponse.ok) {
    throw new Error(`OpenWeather request failed (${currentResponse.status}/${forecastResponse.status}).`);
  }
  const uvJson = uvResponse?.ok ? await uvResponse.json().catch(() => null) : null;
  const uvTimes = Array.isArray(uvJson?.hourly?.time) ? uvJson.hourly.time : [];
  const uvValues = Array.isArray(uvJson?.hourly?.uv_index) ? uvJson.hourly.uv_index.map(Number) : [];
  const now = Date.now();
  const nearestIndex = uvTimes.reduce((best: number, time: string, index: number) => {
    const currentDiff = Math.abs(new Date(`${time}:00+08:00`).getTime() - now);
    const bestDiff = best >= 0 ? Math.abs(new Date(`${uvTimes[best]}:00+08:00`).getTime() - now) : Number.POSITIVE_INFINITY;
    return currentDiff < bestDiff ? index : best;
  }, -1);
  const rawUv = nearestIndex >= 0 ? uvValues[nearestIndex] : NaN;
  const uv = Number.isFinite(rawUv) ? Math.round(rawUv * 10) / 10 : null;
  return { current: await currentResponse.json(), forecast: await forecastResponse.json(), uv: { value: uv } };
}

const backend = {
  async call<T = any>(name: string, payload: Record<string, any> = {}): Promise<T> {
    const token = await firebase().auth.currentUser?.getIdToken(false);
    const { data, error } = await withTimeout(
      supabase.functions.invoke("seekmy-backend", {
        body: { action: name, payload },
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      }),
      20000,
      "Supabase backend took too long to respond. Please check the seekmy-backend Edge Function and try again."
    );
    if (error) {
      let message = error.message || "Backend request failed.";
      try {
        const details = await (error as any).context?.json?.();
        if (details?.error) message = details.error;
      } catch { /* use the transport error */ }
      throw new Error(message);
    }
    if (data?.error) throw new Error(data.error);
    return data as T;
  },
  getWeather(payload: { locationName?: string; state?: string; lat?: number; lng?: number }) {
    return this.call("getWeather", payload);
  },
  createActivity(payload: Record<string, any>) {
    return this.call<{ activity: EntityRecord; newBadges: EntityRecord[]; stats: Record<string, number> }>("createActivity", payload);
  },
  deleteActivity(id: string) {
    return this.call<{ success: boolean; stats: Record<string, number>; revokedBadges: string[] }>("deleteActivity", { id });
  },
  updateActivity(id: string, payload: Record<string, any>) {
    return this.call<{ activity: EntityRecord; stats: Record<string, number>; newBadges?: EntityRecord[]; revokedBadges?: string[] }>("updateActivity", { id, ...payload });
  },
  getMyData() {
    return this.call<{ activities: EntityRecord[]; badges: EntityRecord[] }>("getMyData");
  },
  getReviews(locationId: string) {
    return this.call<{ reviews: EntityRecord[] }>("getReviews", { locationId });
  },
  getLocationReviewSummaries() {
    return this.call<{ summaries: Array<{ locationId: string; locationName?: string; count: number; rating: number }> }>("getLocationReviewSummaries");
  },
  getSharedBookmarkFolder(token: string) {
    return this.call<{ folder: { id: string; name: string; sharingEnabled: boolean; memberCount: number; viewerRole: "owner" | "member" | null; locations: Array<Record<string, any>> } }>("getSharedBookmarkFolder", { token });
  },
  getBookmarkFolderShareStatus(folderName: string) {
    return this.call<{ active: boolean; folderId: string | null; updatedAt: string | null }>("getBookmarkFolderShareStatus", { folderName });
  },
  createBookmarkFolderShare(folderName: string, locationIds: Array<string | number>) {
    return this.call<{ token: string; folderId: string; folderName: string; locationCount: number }>("createBookmarkFolderShare", { folderName, locationIds });
  },
  disableBookmarkFolderShare(folderName: string, folderId?: string) {
    return this.call<{ success: boolean }>("disableBookmarkFolderShare", { folderName, folderId });
  },
  getMyCollaborativeFolders() {
    return this.call<{ folders: Array<Record<string, any>> }>("getMyCollaborativeFolders");
  },
  joinSharedBookmarkFolder(token: string) {
    return this.call<{ folderId: string; folderName: string; role: "owner" | "member"; alreadyJoined: boolean }>("joinSharedBookmarkFolder", { token });
  },
  addSharedBookmarkLocation(folderId: string, locationId: string | number, locationSnapshot?: Record<string, any>) {
    return this.call<{ location: Record<string, any> }>("addSharedBookmarkLocation", { folderId, locationId, locationSnapshot });
  },
  removeSharedBookmarkLocation(folderId: string, locationId: string | number) {
    return this.call<{ success: boolean }>("removeSharedBookmarkLocation", { folderId, locationId });
  },
  renameSharedBookmarkFolder(folderId: string, folderName: string) {
    return this.call<{ success: boolean; folderName: string }>("renameSharedBookmarkFolder", { folderId, folderName });
  },
  deleteSharedBookmarkFolder(folderId: string) {
    return this.call<{ success: boolean }>("deleteSharedBookmarkFolder", { folderId });
  },
  leaveSharedBookmarkFolder(folderId: string) {
    return this.call<{ success: boolean }>("leaveSharedBookmarkFolder", { folderId });
  },
  getSharedBookmarkFolderMembers(folderId: string) {
    return this.call<{ viewerRole: "owner" | "member"; members: Array<Record<string, any>> }>("getSharedBookmarkFolderMembers", { folderId });
  },
  removeSharedBookmarkFolderMember(folderId: string, membershipId: string) {
    return this.call<{ success: boolean }>("removeSharedBookmarkFolderMember", { folderId, membershipId });
  },
  submitReview(payload: Record<string, any>) {
    return this.call<{ review: EntityRecord; newBadges: EntityRecord[] }>("submitReview", payload);
  },
  updateReview(id: string, payload: Record<string, any>) {
    return this.call<{ review: EntityRecord }>("updateReview", { id, ...payload });
  },
  deleteReview(id: string) {
    return this.call<{ success: boolean; stats: Record<string, number>; revokedBadges: string[] }>("deleteReview", { id });
  },
  reportReview(id: string, reason: string) {
    return this.call<{ success: boolean }>("reportReview", { id, reason });
  },
  getAdminReviews() {
    return this.call<{ reviews: EntityRecord[] }>("getAdminReviews");
  },
  moderateReview(id: string, action: "approve" | "remove") {
    return this.call<{ review: EntityRecord }>("moderateReview", { id, action });
  },
  adminDeleteUserData(uid: string) {
    return this.call<{ success: boolean }>("adminDeleteUserData", { uid });
  },
  signContributorDocument(uri: string) {
    return this.call<{ url: string }>("signContributorDocument", { uri });
  },
  getLeaderboard(period: "weekly" | "monthly") {
    return this.call<{ entries: Array<{ id: string; name: string; km: number; checkins: number; states: number }>; badges: EntityRecord[] }>("getLeaderboard", { period });
  },
};

/* =========================================================
   STORAGE
   ========================================================= */

const storage = {
  async uploadFile(
    folder: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    const user = currentUser();
    if (!user) throw new Error("Please log in before uploading a file.");
    const isDocument = folder === "contributor-documents";
    const maximum = isDocument ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > maximum) throw new Error(`${isDocument ? "Document" : "Photo"} must be ${isDocument ? "5" : "2"} MB or smaller.`);
    const bucket = isDocument ? "contributor-documents" : "seekmy-photos";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${user.uid}/${folder}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    onProgress?.(10);
    const { error } = await withTimeout(
      supabase.storage.from(bucket).upload(path, file, {
        contentType: file.type || undefined,
        cacheControl: "31536000",
        upsert: false,
      }),
      20000,
      "Upload timed out. Please check your Supabase Storage setup and try again."
    );
    if (error) throw new Error(error.message);
    onProgress?.(100);
    if (isDocument) {
      return `supabase://${bucket}/${path}`;
    }
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  },

  async uploadActivityPhoto(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    return this.uploadFile("activity-photos", file, onProgress);
  },

  async uploadReviewPhoto(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    return this.uploadFile("review-photos", file, onProgress);
  },

  async uploadLocationPhoto(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    return this.uploadFile("location-submissions", file, onProgress);
  },

  async uploadContributorDocument(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    return this.uploadFile("contributor-documents", file, onProgress);
  },

  async uploadProfilePhoto(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    return this.uploadFile("profile-photos", file, onProgress);
  },
};

/* =========================================================
   FIREBASE CLIENT
   ========================================================= */

export const firebaseClient = {
  entities:
    Object.fromEntries(
      [
        "Location",
        "Review",
        "Bookmark",
        "ActivityLog",
        "Badge",
        "Contributor",
        "LocationSubmission",
        "LocationImportCandidate",
        "Announcement",
        "User",
      ].map(
        (name) => [
          name,
          entity(name),
        ]
      )
    ) as Record<
      string,
      ReturnType<typeof entity>
    >,

  auth,

  functions,

  backend,

  integrations: {
    Core: {
      async InvokeLLM(input: {
        message: string;
        history?: { role: "user" | "assistant"; content: string }[];
        locations?: { name: string; state: string; activity: string; difficulty: string }[];
      }): Promise<string> {
        const { data, error } = await supabase.functions.invoke("chat-with-guide", {
          body: input,
        });
        if (error) throw error;
        if (!data?.text) {
          throw new Error("The AI guide returned an empty response.");
        }
        return data.text;
      },
    },
  },

  storage,

  connectors: {
    async connectAppUser(): Promise<never> {
      throw new Error(
        "Google Calendar integration requires a server-side OAuth flow."
      );
    },
  },
};
