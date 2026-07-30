/** App params – local mode (no Base44). */
export const appParams = {
  appId: "seekmy-local",
  token: null,
  fromUrl: typeof window !== "undefined" ? window.location.href : "",
  functionsVersion: "local",
  appBaseUrl: typeof window !== "undefined" ? window.location.origin : "",
};
