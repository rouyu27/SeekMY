// FILE PRIMARY OWNER: WONG YUE SHAN | Firebase Integration / Shared CRUD Primary Owner
// GitHub target: feature/wong-yue-shan -> Pull Request -> main
// SHARED SECTION OWNERSHIP:
// WONG YUE SHAN: Firebase setup, generic Firestore CRUD, admin/contributor/location integration
// WILSON CHOONG WEI SHAN: authentication and account/user-profile operations
// LIM TZE XIN: Bookmark and Review entity usage
// FONG XIN TONG: ActivityLog / stats entity usage
// LOW JUN FENG: Badge entity usage
// LIM ROU YU: Location entity consumption for Map / Location Detail
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

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import {
  auth as firebaseAuth,
  db as firebaseDb,
  storage as firebaseStorage,
} from "../../firebase";

//==================== WongYueShan Part - Admin/Firebase Access ====================
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
  storage: firebaseStorage,
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

//==================== WilsonChoongWeiShan Part - Account/User Profile ====================
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

//==================== WongYueShan Part - Shared Firestore CRUD Integration ====================
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
          {
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
          }
        );

      return clean(
        await getDoc(created)
      );
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
        {
          ...data,

          updated_date:
            new Date()
              .toISOString(),
        }
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

//==================== WongYueShan END - Shared Firestore CRUD Integration ====================
//==================== WilsonChoongWeiShan Part - Account Authentication ====================
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

    return profile(user);
  },

  async isAuthenticated(): Promise<boolean> {
    return Boolean(
      (await waitForUser()) ||
      currentUser()
    );
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

    await profile(result.user);

    if (username) {
      await updateDoc(
        doc(
          firebase().db,
          // WilsonChoongWeiShan Part - Account/User entity
        "User",
        // WilsonChoongWeiShan END
          result.user.uid
        ),
        {
          username,

          updated_date:
            new Date()
              .toISOString(),
        }
      );
    }

    await sendEmailVerification(
      result.user
    );

    return {
      success: true,
      message:
        "Verification email sent",
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
  }: {
    full_name: string;
  }): Promise<EntityRecord> {
    const user =
      currentUser();

    if (!user) {
      throw new Error(
        "Please log in first."
      );
    }

    await updateFirebaseProfile(
      user,
      {
        displayName:
          full_name,
      }
    );

    await updateDoc(
      doc(
        firebase().db,
        "User",
        user.uid
      ),
      {
        full_name,

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

    await deleteDoc(
      doc(
        firebase().db,
        "User",
        user.uid
      )
    );

    await deleteFirebaseUser(
      user
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

//==================== WilsonChoongWeiShan END - Account Authentication ====================
/* =========================================================
   FUNCTIONS / EXTERNAL API
   ========================================================= */

const functions = {
  async invoke(
    name: string,
    payload: Record<string, any> = {}
  ): Promise<any> {
    //==================== WongYueShan Part - Weather API Integration ====================
    if (name === "getWeather") {
      const key =
        import.meta.env
          .VITE_OPENWEATHER_API_KEY;

      if (!key) {
        throw new Error(
          "OpenWeatherMap is not configured. Add VITE_OPENWEATHER_API_KEY to .env.local."
        );
      }

      const queryText = String(
        payload.locationName ||
        payload.state ||
        "Kuala Lumpur"
      );

      const params =
        new URLSearchParams({
          q: `${queryText},MY`,
          appid: key,
          units: "metric",
        });

      const [
        currentResponse,
        forecastResponse,
      ] = await Promise.all([
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?${params}`
        ),

        fetch(
          `https://api.openweathermap.org/data/2.5/forecast?${params}`
        ),
      ]);

      if (
        !currentResponse.ok ||
        !forecastResponse.ok
      ) {
        throw new Error(
          "Unable to load weather. Check your OpenWeatherMap API key."
        );
      }

      const current =
        await currentResponse.json();

      const forecast =
        await forecastResponse.json();

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

    //==================== WongYueShan END - Weather API Integration ====================
    //==================== WilsonChoongWeiShan Part - Activity/Location Search Integration ====================
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

    //==================== WilsonChoongWeiShan END - Activity/Location Search Integration ====================
    throw new Error(
      `${name} requires a Firebase Cloud Function and has not been configured.`
    );
  },
};

/* =========================================================
   STORAGE
   ========================================================= */

const storage = {
  async uploadFile(
    folder: string,
    file: File
  ): Promise<string> {
    const user =
      currentUser();

    if (!user) {
      throw new Error(
        "Please log in before uploading a file."
      );
    }

    const safe =
      file.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "-"
      );

    const fileRef =
      ref(
        firebase().storage,
        `${folder}/${user.uid}/${Date.now()}-${safe}`
      );

    await uploadBytes(
      fileRef,
      file
    );

    return getDownloadURL(
      fileRef
    );
  },

  //==================== FongXinTong Part - Activity Photo Storage ====================
  async uploadActivityPhoto(
    file: File
  ): Promise<string> {
    return this.uploadFile(
      "activity-photos",
      file
    );
  },

  //==================== FongXinTong END - Activity Photo Storage ====================
  //==================== WongYueShan Part - Contributor/Location Photo Storage ====================
  async uploadLocationPhoto(
    file: File
  ): Promise<string> {
    return this.uploadFile(
      "location-submissions",
      file
    );
  },

  async uploadContributorDocument(
    file: File
  ): Promise<string> {
    return this.uploadFile(
      "contributor-documents",
      file
    );
  },
  //==================== WongYueShan END - Contributor/Location Photo Storage ====================
};

/* =========================================================
   FIREBASE CLIENT
   ========================================================= */

export const firebaseClient = {
  entities:
    Object.fromEntries(
      [
        // LimRouYu Part - Location data used by Map and Location Detail
        // WongYueShan Part - Location management used by Admin
        "Location",
        // LimRouYu END / WongYueShan END
        // LimTzeXin Part - User Review & Rating entity
        "Review",
        // LimTzeXin END
        // LimTzeXin Part - Bookmark entity
        "Bookmark",
        // LimTzeXin END
        // FongXinTong Part - Activity Log entity
        "ActivityLog",
        // FongXinTong END
        // LowJunFeng Part - Badge entity
        "Badge",
        // LowJunFeng END
        // WongYueShan Part - Contributor entity
        "Contributor",
        // WongYueShan END
        // WongYueShan Part - Location Submission entity
        "LocationSubmission",
        // WongYueShan END
        // WongYueShan Part - Admin Announcement entity
        "Announcement",
        // WongYueShan END
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

  integrations: {
    Core: {
      async InvokeLLM(): Promise<never> {
        throw new Error(
          "The chatbot requires a server-side Cloud Function. Do not place an AI API key in this browser app."
        );
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