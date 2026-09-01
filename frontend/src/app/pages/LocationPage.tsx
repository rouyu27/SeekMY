// Shared module file
// LimRouYu: Location Detail Module
// WongYueShan: Weather Module
// LimTzeXin: Bookmark Module + User Review & Rating Module
import { useState, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, Star, Bookmark, BookmarkCheck, MapPin, Clock,
  Navigation, Sun, Droplets, Wind, AlertTriangle, Check, Activity, Flag,
  Users, ExternalLink, Pencil, Trash2, X, Car, Utensils, Hospital, Bus, Store, Fuel, Toilet, CalendarClock, Upload,
} from "lucide-react";
import type { Location, ActivityLog } from "../lib/types";
import { C, F } from "../lib/tokens";
import { diffStyle } from "../lib/helpers";
import { Pill } from "../components/Atoms";
import { fetchWeather, type WeatherBundle } from "../lib/weather";
import {
  fetchMetStateForecast,
  fetchMetWarnings,
  type MetForecast,
  type MetWarning,
} from "../lib/metMalaysia";
import { firebaseClient } from "../api/firebaseClient";
import { badgeAchievementMessage } from "../lib/badges";
import type { StoredReview } from "../lib/communityTypes";
import { locationMetadataFor } from "../lib/locationMetadata";
import type { Language } from "../lib/i18n";
import { activityLabel, difficultyLabel, t } from "../lib/i18n";
import type { WeatherAlert } from "../lib/weather";

const MAX_REVIEW_PHOTO_BYTES = 1 * 1024 * 1024;
const MAX_REVIEW_WORDS = 300;

function countReviewWords(value: string): number {
  return value.match(/\S+/g)?.length ?? 0;
}

export function LocationPage({
  loc,
  onBack,
  bookmarked,
  onBookmark,
  onLogActivity,
  onSuggest,
  user,
  activityLogs,
  onToast,
  onReviewSummaryChange,
  initialTab,
  language = "en",
}: {
  loc: Location | null;
  onBack: () => void;
  bookmarked: boolean;
  onBookmark: () => void;
  onLogActivity: (location: Location) => void;
  onSuggest?: () => void;
  user?: { id: string; displayName: string; status?: "active" | "suspended" | "review_restricted" } | null;
  activityLogs?: ActivityLog[];
  onToast?: (msg: string, type?: "ok" | "err") => void;
  onReviewSummaryChange?: (locationId: number | string, rating: number, reviews: number) => void;
  initialTab?: "overview" | "weather" | "reviews";
  language?: Language;
}) {
  const [tab, setTab] = useState<"overview" | "weather" | "reviews">("overview");
  //==================== LimTzeXin Part - User Review & Rating Module ====================
  const [rt, setRt] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewPhotoFile, setReviewPhotoFile] = useState<File | null>(null);
  const [reviewPhotoPreview, setReviewPhotoPreview] = useState("");
  const [selectedReviewPhoto, setSelectedReviewPhoto] = useState<{url:string;alt:string}|null>(null);
  const [selectedLocationPhoto, setSelectedLocationPhoto] = useState<{url:string;alt:string}|null>(null);
  const [activeLocationImage, setActiveLocationImage] = useState(0);
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [flagId, setFlagId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState("Offensive language");
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingReviewText, setEditingReviewText] = useState("");
  const [editingReviewRating, setEditingReviewRating] = useState(0);

  function publishReviewSummary(nextReviews: StoredReview[]) {
    if (!loc) return;
    const count = nextReviews.length;
    const average = count
      ? nextReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / count
      : 0;
    onReviewSummaryChange?.(loc.id, Math.round(average * 10) / 10, count);
  }

  useEffect(() => {
    if (!loc) return;
    if (initialTab) setTab(initialTab);
    setActiveLocationImage(0);
    setShowReviewForm(false);
    let cancelled=false;
    firebaseClient.backend.getReviews(String(loc.id)).then(({reviews:rows})=>{
      if(cancelled) return;
      const nextReviews = rows.filter(r=>r.status==="approved"||r.status==="active").sort((a,b)=>String(b.created_date||b.date||"").localeCompare(String(a.created_date||a.date||""))) as StoredReview[];
      setReviews(nextReviews);
      publishReviewSummary(nextReviews);
    }).catch((error:any)=>{ if(!cancelled) setReviewMsg(error?.message||"Unable to load reviews."); });
    return()=>{cancelled=true;};
  },[loc?.id]);
  //==================== LimTzeXin END - User Review & Rating Module ====================
  //==================== WongYueShan Part - Weather Module ====================
  const [weather, setWeather] = useState<WeatherBundle | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [showForecast, setShowForecast] = useState(false);
  const [showRecs, setShowRecs] = useState(false);
  const [metForecast, setMetForecast] = useState<MetForecast[]>([]);
  const [metWarnings, setMetWarnings] = useState<MetWarning[]>([]);
  const [metLoading, setMetLoading] = useState(false);
  const [metError, setMetError] = useState<string | null>(null);

  // 2.2.1.1 — load weather when location changes
  useEffect(() => {
    if (!loc) return;
    let cancelled = false;
    setWeatherLoading(true);
    setWeatherError(null);
    setWeather(null);
    setShowForecast(false);
    setShowRecs(false);
    const lat = Number(loc.lat ?? loc.latitude);
    const lng = Number(loc.lng ?? loc.longitude);
    const coordinates = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined;
    fetchWeather(loc.name, loc.state, coordinates)
      .then((data) => {
        if (!cancelled) {
          setWeather(data);
          setWeatherLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWeatherError(language === "zh" ? "天气资料暂时无法使用，请稍后再试。" : language === "ms" ? "Data cuaca tidak tersedia buat sementara waktu. Sila cuba lagi kemudian." : "Weather data temporarily unavailable. Please try again later.");
          setWeatherLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [loc?.id, loc?.name, loc?.state, loc?.lat, loc?.lng, loc?.latitude, loc?.longitude, language]);

  // Official state-level forecast and warnings from MET Malaysia/data.gov.my.
  useEffect(() => {
    if (!loc?.state) return;
    let cancelled = false;
    setMetLoading(true);
    setMetError(null);
    setMetForecast([]);
    setMetWarnings([]);

    Promise.all([fetchMetStateForecast(loc.state), fetchMetWarnings(loc.state)])
      .then(([forecast, warnings]) => {
        if (cancelled) return;
        setMetForecast(forecast);
        setMetWarnings(warnings);
        setMetLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setMetError(error instanceof Error ? error.message : "MET Malaysia data unavailable.");
        setMetLoading(false);
      });

    return () => { cancelled = true; };
  }, [loc?.state]);
  //==================== WongYueShan END - Weather Module ====================

  // 4.2.1.1 A2 — location not found
  if (!loc) {
    return (
      <div className="pt-14 min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: C.cream }}>
        <MapPin size={40} style={{ color: C.textMuted, opacity: 0.4 }} />
        <h2 className="text-2xl mt-4 font-normal" style={{ fontFamily: F.display, color: C.text }}>Location not found</h2>
        <p className="text-sm mt-2 mb-6 text-center" style={{ color: C.textMuted, fontFamily: F.body }}>
          This location may have been removed or the link is invalid.
        </p>
        <Pill variant="filled" onClick={onBack}>Go back</Pill>
      </div>
    );
  }

  const canChangeReview = (review: StoredReview) => {
    const created = new Date(review.created_date || "").getTime();
    return Boolean(user && review.userId === user.id && Number.isFinite(created) && Date.now() - created <= 24 * 60 * 60 * 1000);
  };
  const isOwnReview = (review: StoredReview) => Boolean(user && String(review.userId) === String(user.id));
  const hasOwnReview = reviews.some(isOwnReview);
  const reviewsForDisplay = [...reviews].sort((a, b) => {
    const ownReviewOrder = Number(isOwnReview(b)) - Number(isOwnReview(a));
    if (ownReviewOrder !== 0) return ownReviewOrder;
    return String(b.created_date || b.date || "").localeCompare(String(a.created_date || a.date || ""));
  });
  const reviewDate = (review: StoredReview) => {
    const created = new Date(review.created_date || "");
    return Number.isFinite(created.getTime())
      ? created.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" })
      : review.date;
  };
  const beginEditReview = (review: StoredReview) => {
    setEditingReviewId(review.id);
    setEditingReviewText(review.comment || "");
    setEditingReviewRating(review.rating);
    setReviewMsg(null);
  };
  const cancelEditReview = () => {
    setEditingReviewId(null);
    setEditingReviewText("");
    setEditingReviewRating(0);
  };
  const chooseReviewPhoto = (file?: File | null) => {
    setReviewMsg(null);
    if (reviewPhotoPreview) URL.revokeObjectURL(reviewPhotoPreview);
    if (!file) {
      setReviewPhotoFile(null);
      setReviewPhotoPreview("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setReviewMsg("Please upload an image file.");
      return;
    }
    if (file.size > MAX_REVIEW_PHOTO_BYTES) {
      setReviewMsg("Review photo must be 1MB or smaller.");
      return;
    }
    setReviewPhotoFile(file);
    setReviewPhotoPreview(URL.createObjectURL(file));
  };

  const d = diffStyle(loc.difficulty);
  const displayedReviewCount = reviews.length || Number(loc.reviews || 0);
  const displayedRating = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    : Number(loc.rating || 0);
  const hasTrail =
    loc.distance &&
    loc.distance !== "N/A" &&
    !["Diving", "Swimming", "Water Sports"].includes(loc.activity);
  const lat = Number(loc.lat ?? loc.latitude);
  const lng = Number(loc.lng ?? loc.longitude);
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);
  const mapTarget = hasCoordinates ? `${lat},${lng}` : `${loc.name}, ${loc.state}, Malaysia`;
  const metadata = locationMetadataFor(loc.name);
  const openingHours = metadata?.openingHours || loc.openingHours || (loc as any).opening_hours || "Hours not verified yet";
  const officialUrl = metadata?.officialUrl || loc.officialUrl || (loc as any).official_url || loc.sourceUrl;
  const photoSourceUrl = loc.photo?.sourcePageUrl;
  const photoCredit = loc.photoAttribution || (loc.photo ? `${loc.photo.author} - ${loc.photo.license}` : "");
  const locCopy = {
    back: language === "zh" ? "返回" : language === "ms" ? "Kembali" : "Back",
    distance: language === "zh" ? "距离" : language === "ms" ? "Jarak" : "Distance",
    duration: language === "zh" ? "时长" : language === "ms" ? "Tempoh" : "Duration",
    hours: language === "zh" ? "开放时间" : language === "ms" ? "Waktu" : "Hours",
    source: language === "zh" ? "来源" : language === "ms" ? "Sumber" : "Source",
    bestSeason: language === "zh" ? "最佳季节" : language === "ms" ? "Musim terbaik" : "Best season",
    overview: language === "zh" ? "概览" : language === "ms" ? "Gambaran" : "Overview",
    weather: t(language, "weather"),
    reviews: language === "zh" ? "评价" : language === "ms" ? "Ulasan" : "Reviews",
    photoSource: language === "zh" ? "图片来源" : language === "ms" ? "Sumber foto" : "Photo source",
    photoSourceAvailable: language === "zh" ? "图片来源可查看" : language === "ms" ? "Sumber foto tersedia" : "Photo source available",
    about: language === "zh" ? "关于这个地点" : language === "ms" ? "Tentang lokasi ini" : "About this location",
    noDetails: language === "zh" ? "此活动类型暂无更多详情。" : language === "ms" ? "Butiran tambahan belum tersedia untuk aktiviti ini." : "Additional details not available for this activity type.",
    estimatedCost: language === "zh" ? "预计费用" : language === "ms" ? "Anggaran kos" : "Estimated cost",
    costNote: language === "zh" ? "实际价格可能因运营商、配套、租借、导游或季节而不同。" : language === "ms" ? "Harga sebenar mungkin berbeza mengikut operator, pakej, sewaan, panduan atau musim." : "Actual prices may vary by operator, package, rental, guide, or season.",
    facilities: t(language, "facilities"),
    noFacilities: language === "zh" ? "暂无设施资料。" : language === "ms" ? "Maklumat kemudahan belum disediakan." : "No facility information provided.",
    nearby: language === "zh" ? "查找附近设施" : language === "ms" ? "Cari kemudahan berhampiran" : "Find nearby facilities",
    nearbyNote: language === "zh" ? "在此目的地附近打开 Google 地图。" : language === "ms" ? "Buka Google Maps sekitar destinasi ini." : "Opens Google Maps around this destination.",
    accessibility: language === "zh" ? "无障碍信息" : language === "ms" ? "Kebolehcapaian" : "Accessibility",
    noAccessibility: language === "zh" ? "暂无无障碍资料。" : language === "ms" ? "Maklumat kebolehcapaian belum disediakan." : "No accessibility information provided.",
    verifiedContributors: language === "zh" ? "已验证本地贡献者" : language === "ms" ? "Penyumbang tempatan disahkan" : "Verified local contributors",
    verified: language === "zh" ? "已验证" : language === "ms" ? "Disahkan" : "Verified",
    noContributor: language === "zh" ? "此地点暂无已验证贡献者。" : language === "ms" ? "Tiada penyumbang disahkan untuk lokasi ini." : "No verified contributor for this location.",
    logActivity: language === "zh" ? "记录此活动" : language === "ms" ? "Log aktiviti ini" : "Log this activity",
    save: language === "zh" ? "收藏" : language === "ms" ? "Simpan" : "Save",
    saved: language === "zh" ? "已收藏" : language === "ms" ? "Disimpan" : "Saved",
    getDirections: t(language, "getDirections"),
    loadingWeather: language === "zh" ? "正在加载天气..." : language === "ms" ? "Memuatkan cuaca..." : "Loading weather...",
    retry: language === "zh" ? "重试" : language === "ms" ? "Cuba lagi" : "Retry",
    currentConditions: language === "zh" ? "当前天气状况" : language === "ms" ? "Keadaan semasa" : "Current conditions",
    feelsLike: language === "zh" ? "体感温度" : language === "ms" ? "Terasa seperti" : "Feels like",
    humidity: language === "zh" ? "湿度" : language === "ms" ? "Kelembapan" : "Humidity",
    wind: language === "zh" ? "风速" : language === "ms" ? "Angin" : "Wind",
    uvIndex: language === "zh" ? "紫外线指数" : language === "ms" ? "Indeks UV" : "UV index",
    advisory: language === "zh" ? "出行建议" : language === "ms" ? "Nasihat" : "Advisory",
    notAvailable: language === "zh" ? "暂无资料" : language === "ms" ? "Tidak tersedia" : "Not available",
    goodToGo: language === "zh" ? "适合出行" : language === "ms" ? "Sesuai pergi" : "Good to Go",
    checkBeforeGo: language === "zh" ? "出发前请检查" : language === "ms" ? "Semak sebelum pergi" : "Check Before You Go",
    hideForecast: language === "zh" ? "隐藏预报" : language === "ms" ? "Sembunyikan ramalan" : "Hide forecast",
    viewForecast: language === "zh" ? "查看预报" : language === "ms" ? "Lihat ramalan" : "View Forecast",
    hideRecommendations: language === "zh" ? "隐藏建议" : language === "ms" ? "Sembunyikan cadangan" : "Hide recommendations",
    getRecommendations: language === "zh" ? "获取建议" : language === "ms" ? "Dapatkan cadangan" : "Get Recommendations",
    weatherAlerts: language === "zh" ? "天气警报" : language === "ms" ? "Amaran cuaca" : "Weather alerts",
    noWeatherAlerts: language === "zh" ? "此地点暂无严重天气警报。祝你户外活动愉快！" : language === "ms" ? "Tiada amaran cuaca buruk untuk lokasi ini. Selamat beraktiviti!" : "No severe weather alerts for this location. Enjoy your outdoor activity!",
    next5Days: language === "zh" ? "未来 5 天" : language === "ms" ? "5 hari seterusnya" : "Next 5 days",
    rain: language === "zh" ? "降雨" : language === "ms" ? "Hujan" : "Rain",
    weatherRecommendations: language === "zh" ? "基于天气的建议" : language === "ms" ? "Cadangan berdasarkan cuaca" : "Weather-based recommendations",
    metForecast: language === "zh" ? "马来西亚气象局官方预报" : language === "ms" ? "Ramalan rasmi MET Malaysia" : "Official MET Malaysia forecast",
    metForecastNote: language === "zh" ? ` ${loc.state} 州的 7 天天气预报 · 每日更新` : language === "ms" ? `Ramalan 7 hari untuk ${loc.state} · dikemas kini setiap hari` : `7-day state forecast for ${loc.state} · updated daily`,
    officialSource: language === "zh" ? "官方来源" : language === "ms" ? "Sumber rasmi" : "Official source",
    loadingOfficialForecast: language === "zh" ? "正在加载官方预报..." : language === "ms" ? "Memuatkan ramalan rasmi..." : "Loading official forecast...",
    noStateForecast: language === "zh" ? `${loc.state} 暂无州级天气预报。` : language === "ms" ? `Ramalan peringkat negeri belum tersedia untuk ${loc.state}.` : `No state-level forecast is currently available for ${loc.state}.`,
    morning: language === "zh" ? "早上" : language === "ms" ? "Pagi" : "Morning",
    afternoon: language === "zh" ? "下午" : language === "ms" ? "Petang" : "Afternoon",
    night: language === "zh" ? "晚上" : language === "ms" ? "Malam" : "Night",
    officialWarning: language === "zh" ? "马来西亚气象局官方警报" : language === "ms" ? "Amaran rasmi MET Malaysia" : "Official MET Malaysia warning",
  };
  const weatherAdvisoryLabel = (value: string) => {
    if (value === "Good to Go") return locCopy.goodToGo;
    if (value === "Check Before You Go") return locCopy.checkBeforeGo;
    return value;
  };
  const weatherConditionLabel = (value: string) => {
    if (language === "en") return value;
    const normalized = value.toLowerCase();
    const zh: Record<string, string> = {
      "clear sky": "晴朗",
      "few clouds": "少云",
      "scattered clouds": "零散云",
      "broken clouds": "多云",
      "overcast clouds": "阴天",
      clouds: "多云",
      rain: "下雨",
      "light rain": "小雨",
      "moderate rain": "中雨",
      "heavy intensity rain": "大雨",
      drizzle: "毛毛雨",
      thunderstorm: "雷雨",
      mist: "薄雾",
      haze: "烟霾",
      fog: "雾",
    };
    const ms: Record<string, string> = {
      "clear sky": "langit cerah",
      "few clouds": "sedikit awan",
      "scattered clouds": "awan berselerak",
      "broken clouds": "berawan",
      "overcast clouds": "mendung",
      clouds: "berawan",
      rain: "hujan",
      "light rain": "hujan renyai",
      "moderate rain": "hujan sederhana",
      "heavy intensity rain": "hujan lebat",
      drizzle: "gerimis",
      thunderstorm: "ribut petir",
      mist: "berkabus tipis",
      haze: "jerebu",
      fog: "kabus",
    };
    const copy = language === "zh" ? zh : ms;
    return copy[normalized] || value;
  };
  const openingHoursLabel = (value: string) => {
    if (language === "en") return value;
    if (value === "Hours not verified yet") {
      return language === "zh" ? "开放时间未确认" : "Waktu belum disahkan";
    }
    if (value === "Daylight visit recommended. Check local opening hours before visiting.") {
      return language === "zh"
        ? "建议白天前往。出发前请查看当地开放时间。"
        : "Lawatan waktu siang disyorkan. Semak waktu operasi tempatan sebelum pergi.";
    }
    return value;
  };
  const bestSeasonLabel = (value: string) => {
    if (value === "Year-round") {
      return language === "zh" ? "全年" : language === "ms" ? "Sepanjang tahun" : value;
    }
    return value;
  };
  const weatherAlertLabel = (alert: WeatherAlert) => {
    if (language === "en") return alert;
    const zh: Record<string, Pick<WeatherAlert, "title" | "message" | "action">> = {
      heat: {
        title: "极端高温",
        message: "高温可能在步道上造成中暑风险。",
        action: "携带更多饮用水，在阴凉处休息，并避免中午登山。",
      },
      wind: {
        title: "强风",
        message: "高处山脊和开放海岸区域可能较危险。",
        action: "避免暴露山顶和开放水域活动。",
      },
      storm: {
        title: "雷雨风险",
        message: "雷雨可能影响户外活动。",
        action: "推迟暴露区域活动，听到雷声时马上寻找遮蔽处。",
      },
    };
    const ms: Record<string, Pick<WeatherAlert, "title" | "message" | "action">> = {
      heat: {
        title: "Panas melampau",
        message: "Suhu tinggi boleh menyebabkan tekanan haba di laluan.",
        action: "Bawa air tambahan, berehat di tempat teduh dan elakkan pendakian tengah hari.",
      },
      wind: {
        title: "Angin kuat",
        message: "Permatang tinggi dan pesisir terbuka mungkin berbahaya.",
        action: "Elakkan puncak terdedah dan aktiviti air terbuka.",
      },
      storm: {
        title: "Risiko ribut petir",
        message: "Ribut boleh menjejaskan aktiviti luar.",
        action: "Tangguhkan aktiviti di kawasan terdedah dan cari perlindungan jika terdengar guruh.",
      },
    };
    const copy = (language === "zh" ? zh : ms)[alert.id];
    return copy ? { ...alert, ...copy } : alert;
  };
  const weatherRecommendationLabel = (value: string) => {
    if (language === "en") return value;
    const zh: Record<string, string> = {
      "Prioritise safety: review weather alerts before departing.": "安全优先：出发前请查看天气警报。",
      "Conditions look suitable for most outdoor activities.": "当前天气适合大多数户外活动。",
      "Bring at least 2L of water per person.": "每人至少携带 2L 饮用水。",
      "Use SPF 50+ and sun protection — UV is high.": "紫外线偏高，请使用 SPF 50+ 防晒并做好遮阳。",
      "Pace yourself; high humidity slows recovery.": "湿度较高，体力恢复较慢，请放慢节奏。",
      "Pack a light rain jacket and protect electronics.": "携带轻便雨衣，并保护好电子设备。",
    };
    const ms: Record<string, string> = {
      "Prioritise safety: review weather alerts before departing.": "Utamakan keselamatan: semak amaran cuaca sebelum bertolak.",
      "Conditions look suitable for most outdoor activities.": "Keadaan sesuai untuk kebanyakan aktiviti luar.",
      "Bring at least 2L of water per person.": "Bawa sekurang-kurangnya 2L air untuk setiap orang.",
      "Use SPF 50+ and sun protection — UV is high.": "Gunakan SPF 50+ dan perlindungan matahari kerana UV tinggi.",
      "Pace yourself; high humidity slows recovery.": "Kawal rentak anda; kelembapan tinggi melambatkan pemulihan.",
      "Pack a light rain jacket and protect electronics.": "Bawa jaket hujan ringan dan lindungi peranti elektronik.",
    };
    return (language === "zh" ? zh : ms)[value] || value;
  };
  const locationImages = (Array.isArray(loc.image_urls) && loc.image_urls.length ? loc.image_urls : (loc.image_url ? [loc.image_url] : [])).filter(Boolean);
  const activeImage = locationImages[Math.min(activeLocationImage, Math.max(locationImages.length - 1, 0))];
  const estimatedCostLabel = loc.estimatedPriceRange
    ? `RM ${loc.estimatedPriceRange}`
    : typeof loc.estimatedPrice === "number"
      ? `RM ${loc.estimatedPrice.toFixed(2).replace(/\.00$/, "")}`
      : "";
  const goLocationImage = (direction: -1 | 1) => {
    if (locationImages.length < 2) return;
    setActiveLocationImage((index) => (index + direction + locationImages.length) % locationImages.length);
  };
  const nearbyFacilities = [
    { label: "Toilets", query: "toilet", icon: <Toilet size={14} /> },
    { label: "Parking", query: "parking", icon: <Car size={14} /> },
    { label: "Food", query: "restaurant food", icon: <Utensils size={14} /> },
    { label: "Clinic", query: "clinic hospital", icon: <Hospital size={14} /> },
    { label: "Transport", query: "bus station train station", icon: <Bus size={14} /> },
    { label: "Shops", query: "convenience store", icon: <Store size={14} /> },
    { label: "Petrol", query: "petrol station", icon: <Fuel size={14} /> },
  ];
  const nearbySearchUrl = (query: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${query} near ${mapTarget}`)}`;

  return (
    <div className="pt-14 min-h-screen" style={{ backgroundColor: C.cream }}>
      <div className="px-5 py-8" style={{ backgroundColor: loc.color }}>
        <div className="max-w-3xl mx-auto">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-5" style={{ color: "rgba(255,255,255,0.65)", fontFamily: F.body }}>
            <ChevronLeft size={15} /> {locCopy.back}
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#fff", fontFamily: F.body }}>{activityLabel(language, loc.activity)}</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: d.bg, color: d.color, fontFamily: F.body }}>{difficultyLabel(language, loc.difficulty)}</span>
                {loc.badge && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: C.amber, color: C.jungle, fontFamily: F.body }}>{loc.badge}</span>
                )}
              </div>
              <h1 className="text-3xl font-normal text-white mb-1.5" style={{ fontFamily: F.display }}>{loc.name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <MapPin size={12} style={{ color: "rgba(255,255,255,0.65)" }} />
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)", fontFamily: F.body }}>{loc.state}, Malaysia</span>
                <Star size={11} fill={C.amber} stroke={C.amber} />
                <span className="text-sm font-bold text-white">{displayedRating.toFixed(1).replace(/\.0$/, "")}</span>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.50)", fontFamily: F.body }}>({displayedReviewCount})</span>
              </div>
            </div>
            {/* ==================== LimTzeXin Part - Bookmark Module ==================== */}
            <button onClick={() => {
              onBookmark();
              onToast?.(bookmarked ? "Bookmark removed successfully." : "Location bookmarked successfully.");
            }} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all" style={{ backgroundColor: bookmarked ? C.amber : "rgba(255,255,255,0.15)" }}>
              {bookmarked ? <BookmarkCheck size={17} style={{ color: C.jungle }} /> : <Bookmark size={17} className="text-white" />}
            </button>
            {/* ==================== LimTzeXin END - Bookmark Module ==================== */}
          </div>

          <div className="flex flex-wrap gap-5 mt-5">
            {hasTrail && (
              <div className="flex items-center gap-1.5 text-sm" title="Distance" style={{ color: "rgba(255,255,255,0.72)", fontFamily: F.body }}>
                <Navigation size={12} />{locCopy.distance}: {loc.distance}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm" title="Estimated activity duration" style={{ color: "rgba(255,255,255,0.72)", fontFamily: F.body }}>
              <Clock size={12} />{locCopy.duration}: {loc.duration}
            </div>
            <div className="flex items-center gap-1.5 text-sm" title="Opening hours" style={{ color: "rgba(255,255,255,0.72)", fontFamily: F.body }}>
              <CalendarClock size={12} />{locCopy.hours}: {openingHoursLabel(openingHours)}
              {officialUrl && (
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-bold underline decoration-white/30 underline-offset-2"
                  style={{ color: "rgba(255,255,255,0.88)" }}
                >
                  {locCopy.source} <ExternalLink size={10} />
                </a>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm" title="Best season to visit" style={{ color: "rgba(255,255,255,0.72)", fontFamily: F.body }}>
              <Sun size={12} />{locCopy.bestSeason}: {bestSeasonLabel(loc.bestMonths)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b px-5" style={{ borderColor: C.border }}>
        <div className="max-w-3xl mx-auto flex gap-6">
          {(["overview", "weather", "reviews"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="py-4 text-sm font-bold capitalize transition-all"
              style={{
                color: tab === t ? C.jungle : C.textMuted,
                borderBottom: tab === t ? `2px solid ${C.amber}` : "2px solid transparent",
                fontFamily: F.body,
              }}
            >
              {locCopy[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-8">
        {/* ==================== LimRouYu Part - Location Detail Module ==================== */}
        {tab === "overview" && (
          <div className="space-y-4">
            {locationImages.length > 0 && (
              <figure className="bg-white rounded-[18px] overflow-hidden" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSelectedLocationPhoto({url:activeImage,alt:`${loc.name} photo ${activeLocationImage+1}`})}
                    className="block w-full text-left"
                    aria-label={`Open ${loc.name} photo ${activeLocationImage+1}`}
                  >
                    <img src={activeImage} alt={`${loc.name} photo ${activeLocationImage+1}`} className="w-full max-h-[420px] object-cover" />
                  </button>
                  {locationImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => goLocationImage(-1)}
                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 shadow-md"
                        aria-label="Previous location photo"
                      >
                        <ChevronLeft size={19}/>
                      </button>
                      <button
                        type="button"
                        onClick={() => goLocationImage(1)}
                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 shadow-md"
                        aria-label="Next location photo"
                      >
                        <ChevronRight size={19}/>
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white" style={{fontFamily:F.body}}>
                        {activeLocationImage + 1} / {locationImages.length}
                      </div>
                    </>
                  )}
                </div>
                {(photoCredit || photoSourceUrl) && (
                  <figcaption className="flex flex-col gap-1 px-4 py-3 text-[11px] sm:flex-row sm:items-center sm:justify-between" style={{ color: C.textMuted, fontFamily: F.body }}>
                    <span>{photoCredit || locCopy.photoSourceAvailable}</span>
                    {photoSourceUrl && (
                      <a href={photoSourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold" style={{ color: C.forest }}>
                        {locCopy.photoSource} <ExternalLink size={11}/>
                      </a>
                    )}
                  </figcaption>
                )}
              </figure>
            )}

            <div className="bg-white rounded-[18px] p-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
              <h2 className="font-bold mb-3 text-base" style={{ fontFamily: F.body, color: C.text }}>{locCopy.about}</h2>
              <p className="text-sm leading-relaxed" style={{ color: C.textSub, fontFamily: F.body }}>
                {loc.description || locCopy.noDetails}
              </p>
            </div>

            {estimatedCostLabel && (
              <div className="bg-white rounded-[18px] p-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
                <h2 className="font-bold mb-3 text-base" style={{ fontFamily: F.body, color: C.text }}>{locCopy.estimatedCost}</h2>
                <div className="inline-flex rounded-full px-4 py-2 text-sm font-bold" style={{ backgroundColor: C.muted, color: C.jungle, fontFamily: F.body }}>
                  {estimatedCostLabel}
                </div>
                <p className="mt-2 text-xs" style={{ color: C.textMuted, fontFamily: F.body }}>
                  {locCopy.costNote}
                </p>
              </div>
            )}

            {loc.activitySpecific && (
              <div className="bg-white rounded-[18px] p-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
                <h2 className="font-bold mb-3 text-base" style={{ fontFamily: F.body, color: C.text }}>{activityLabel(language, loc.activity)} details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {loc.activitySpecific.certification && (
                    <div className="p-3 rounded-xl" style={{ backgroundColor: C.muted }}>
                      <p className="text-[11px] font-bold uppercase" style={{ color: C.textMuted, fontFamily: F.body }}>Certification</p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: C.text, fontFamily: F.body }}>{loc.activitySpecific.certification}</p>
                    </div>
                  )}
                  {loc.activitySpecific.visibility && (
                    <div className="p-3 rounded-xl" style={{ backgroundColor: C.muted }}>
                      <p className="text-[11px] font-bold uppercase" style={{ color: C.textMuted, fontFamily: F.body }}>Visibility</p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: C.text, fontFamily: F.body }}>{loc.activitySpecific.visibility}</p>
                    </div>
                  )}
                  {loc.activitySpecific.entryType && (
                    <div className="p-3 rounded-xl" style={{ backgroundColor: C.muted }}>
                      <p className="text-[11px] font-bold uppercase" style={{ color: C.textMuted, fontFamily: F.body }}>Entry type</p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: C.text, fontFamily: F.body }}>{loc.activitySpecific.entryType}</p>
                    </div>
                  )}
                  {loc.activitySpecific.maxDepth && (
                    <div className="p-3 rounded-xl" style={{ backgroundColor: C.muted }}>
                      <p className="text-[11px] font-bold uppercase" style={{ color: C.textMuted, fontFamily: F.body }}>Max depth</p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: C.text, fontFamily: F.body }}>{loc.activitySpecific.maxDepth}</p>
                    </div>
                  )}
                  {loc.activitySpecific.marineLife && (
                    <div className="p-3 rounded-xl sm:col-span-2" style={{ backgroundColor: C.muted }}>
                      <p className="text-[11px] font-bold uppercase" style={{ color: C.textMuted, fontFamily: F.body }}>Marine life highlights</p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: C.text, fontFamily: F.body }}>{loc.activitySpecific.marineLife}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-[18px] p-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
              <h2 className="font-bold mb-3 text-base" style={{ fontFamily: F.body, color: C.text }}>{locCopy.facilities}</h2>
              {loc.facilities?.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {loc.facilities.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm" style={{ color: C.textSub, fontFamily: F.body }}>
                      <Check size={12} style={{ color: C.forest, flexShrink: 0 }} />{f}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: C.textMuted, fontFamily: F.body }}>{locCopy.noFacilities}</p>
              )}
            </div>

            <div className="bg-white rounded-[18px] p-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="font-bold text-base" style={{ fontFamily: F.body, color: C.text }}>{locCopy.nearby}</h2>
                  <p className="text-[12px] mt-1" style={{ color: C.textMuted, fontFamily: F.body }}>
                    {locCopy.nearbyNote}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapTarget)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold inline-flex items-center gap-1 whitespace-nowrap"
                  style={{ color: C.forest, fontFamily: F.body }}
                >
                  Map <ExternalLink size={11}/>
                </a>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {nearbyFacilities.map((facility) => (
                  <a
                    key={facility.label}
                    href={nearbySearchUrl(facility.query)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-[12px] font-bold transition-all hover:bg-gray-50 active:scale-[0.98]"
                    style={{ borderColor: C.border, color: C.textSub, fontFamily: F.body }}
                  >
                    <span style={{ color: C.forest }}>{facility.icon}</span>
                    {facility.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[18px] p-5" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
              <h2 className="font-bold mb-2 text-base" style={{ fontFamily: F.body, color: C.text }}>{locCopy.accessibility}</h2>
              <p className="text-sm" style={{ color: C.textSub, fontFamily: F.body }}>
                {loc.accessibility || locCopy.noAccessibility}
              </p>
            </div>

            <div className="bg-white rounded-[18px] p-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
              <h2 className="font-bold mb-3 text-base flex items-center gap-2" style={{ fontFamily: F.body, color: C.text }}>
                <Users size={16} style={{ color: C.forest }} /> {locCopy.verifiedContributors}
              </h2>
              {loc.contributors && loc.contributors.length > 0 ? (
                <div className="space-y-3">
                  {loc.contributors.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: C.muted }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: C.forest }}>
                        {c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold" style={{ color: C.text, fontFamily: F.body }}>{c.name}</p>
                        <p className="text-[11px]" style={{ color: C.textMuted, fontFamily: F.body }}>{c.role} · {c.area}</p>
                      </div>
                      {c.verified && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: C.successBg, color: C.success, fontFamily: F.body }}>
                          {locCopy.verified}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: C.textMuted, fontFamily: F.body }}>{locCopy.noContributor}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {/* ==================== FongXinTong Part - Activity Log Module ==================== */}
              <Pill variant="filled" onClick={() => onLogActivity(loc)}>
                <Activity size={14} /> {locCopy.logActivity}
              </Pill>
              {/* ==================== FongXinTong END - Activity Log Module ==================== */}

              {/* ==================== LimTzeXin Part - Bookmark Module ==================== */}
              <Pill variant="outline" onClick={onBookmark}>
                {bookmarked ? (<><BookmarkCheck size={13} /> {locCopy.saved}</>) : (<><Bookmark size={13} /> {locCopy.save}</>)}
              </Pill>
              {/* ==================== LimTzeXin END - Bookmark Module ==================== */}              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${loc.name}, ${loc.state}, Malaysia`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 h-[50px] px-6 rounded-full text-sm font-bold"
                style={{ backgroundColor: C.jungle, color: "#fff", fontFamily: F.body }}
              >
                <Navigation size={14} /> {locCopy.getDirections} <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}
        {/* ==================== LimRouYu END - Location Detail Module ==================== */}

        {/* ==================== WongYueShan Part - Weather Module ==================== */}
                {tab === "weather" && (
          <div className="space-y-4">
            {weatherLoading && (
              <div className="bg-white rounded-[18px] p-8 text-center" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10)` }}>
                <p className="text-sm" style={{ color: C.textMuted, fontFamily: F.body }}>{locCopy.loadingWeather}</p>
              </div>
            )}
            {weatherError && !weatherLoading && (
              <div className="bg-white rounded-[18px] p-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10)` }}>
                <p className="text-sm font-semibold" style={{ color: C.error, fontFamily: F.body }}>{weatherError}</p>
                {loc && (
                  <button
                    type="button"
                    className="mt-3 text-sm font-bold"
                    style={{ color: C.forest, fontFamily: F.body }}
                    onClick={() => {
                      setWeatherLoading(true);
                      setWeatherError(null);
                      {
                        const lat = Number(loc.lat ?? loc.latitude);
                        const lng = Number(loc.lng ?? loc.longitude);
                        fetchWeather(loc.name, loc.state, Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined)
                        .then((d) => { setWeather(d); setWeatherLoading(false); })
                        .catch(() => {
                          setWeatherError(language === "zh" ? "天气资料暂时无法使用，请稍后再试。" : language === "ms" ? "Data cuaca tidak tersedia buat sementara waktu. Sila cuba lagi kemudian." : "Weather data temporarily unavailable. Please try again later.");
                          setWeatherLoading(false);
                        });
                      }
                    }}
                  >
                    {locCopy.retry}
                  </button>
                )}
              </div>
            )}
            {weather && !weatherLoading && (
              <>
                <div className="bg-white rounded-[18px] p-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
                  <h2 className="font-bold mb-5 text-base" style={{ fontFamily: F.body, color: C.text }}>{locCopy.currentConditions}</h2>
                  <div className="flex items-center gap-5 mb-6">
                    <span className="text-5xl">{weather.current.icon}</span>
                    <div>
                      <p className="text-4xl font-bold" style={{ color: C.jungle, fontFamily: F.display }}>{weather.current.temp}°C</p>
                      <p className="text-sm" style={{ color: C.textSub, fontFamily: F.body }}>{weatherConditionLabel(weather.current.condition)}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: C.textMuted, fontFamily: F.body }}>{locCopy.feelsLike} {weather.current.feelsLike}°C</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {[
                      { icon: <Droplets size={16} style={{ color: C.forest }} />, label: locCopy.humidity, val: `${weather.current.humidity}%` },
                      { icon: <Wind size={16} style={{ color: C.forest }} />, label: locCopy.wind, val: `${weather.current.wind} km/h` },
                      { icon: <Sun size={16} style={{ color: C.forest }} />, label: locCopy.uvIndex, val: weather.current.uv === null ? locCopy.notAvailable : String(weather.current.uv) },
                      { icon: <AlertTriangle size={16} style={{ color: weather.current.advisory === "Good to Go" ? C.forest : "#92400e" }} />, label: locCopy.advisory, val: weatherAdvisoryLabel(weather.current.advisory) },
                    ].map(({ icon, label, val }) => (
                      <div key={label} className="text-center p-3 rounded-xl" style={{ backgroundColor: C.muted }}>
                        <div className="flex justify-center mb-1">{icon}</div>
                        <p className="text-[11px]" style={{ color: C.textMuted, fontFamily: F.body }}>{label}</p>
                        <p className="text-sm font-bold mt-0.5" style={{ fontFamily: F.body, color: C.text }}>{val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill variant="outline" small onClick={() => setShowForecast((v) => !v)}>
                      {showForecast ? locCopy.hideForecast : locCopy.viewForecast}
                    </Pill>
                    <Pill variant="outline" small onClick={() => setShowRecs((v) => !v)}>
                      {showRecs ? locCopy.hideRecommendations : locCopy.getRecommendations}
                    </Pill>
                  </div>
                </div>

                {/* Alerts 2.2.1.3 */}
                <div className="bg-white rounded-[18px] p-5" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10)` }}>
                  <h3 className="font-bold text-sm mb-3" style={{ fontFamily: F.body, color: C.text }}>{locCopy.weatherAlerts}</h3>
                  {weather.alerts.length === 0 ? (
                    <p className="text-sm" style={{ color: C.success, fontFamily: F.body }}>
                      {locCopy.noWeatherAlerts}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {weather.alerts.map((a) => {
                        const alertCopy = weatherAlertLabel(a);
                        return (
                          <div key={a.id} className="p-3 rounded-xl border" style={{ borderColor: a.severity === "warning" ? "rgba(192,57,43,0.3)" : C.border, backgroundColor: a.severity === "warning" ? C.errorBg : C.muted }}>
                            <p className="text-sm font-bold" style={{ color: a.severity === "warning" ? C.error : C.text, fontFamily: F.body }}>{alertCopy.title}</p>
                            <p className="text-[12px] mt-1" style={{ color: C.textSub, fontFamily: F.body }}>{alertCopy.message}</p>
                            <p className="text-[12px] mt-1 font-semibold" style={{ color: C.forest, fontFamily: F.body }}>→ {alertCopy.action}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {showForecast && (
                  <div className="bg-white rounded-[18px] p-5" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10)` }}>
                    <h3 className="font-bold text-sm mb-3" style={{ fontFamily: F.body, color: C.text }}>{locCopy.next5Days}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {weather.forecast.map((f) => (
                        <div key={f.date} className="text-center p-3 rounded-xl" style={{ backgroundColor: C.muted }}>
                          <p className="text-[11px] font-bold" style={{ color: C.textMuted, fontFamily: F.body }}>{f.date}</p>
                          <p className="text-2xl my-1">{f.icon}</p>
                          <p className="text-sm font-bold" style={{ color: C.text, fontFamily: F.body }}>{f.high}° / {f.low}°</p>
                          <p className="text-[11px]" style={{ color: C.textSub, fontFamily: F.body }}>{weatherConditionLabel(f.condition)}</p>
                          <p className="text-[10px] mt-1" style={{ color: C.textMuted, fontFamily: F.body }}>{locCopy.rain} {f.precipChance}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showRecs && (
                  <div className="bg-white rounded-[18px] p-5" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10)` }}>
                    <h3 className="font-bold text-sm mb-3" style={{ fontFamily: F.body, color: C.text }}>{locCopy.weatherRecommendations}</h3>
                    <ul className="space-y-2">
                      {weather.recommendations.map((r, i) => (
                        <li key={i} className="flex gap-2 text-sm" style={{ color: C.textSub, fontFamily: F.body }}>
                          <span>{r.icon}</span>
                          <span>{weatherRecommendationLabel(r.text)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            <section className="bg-white rounded-[18px] p-5" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10)` }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm" style={{ color: C.text, fontFamily: F.body }}>
                    {locCopy.metForecast}
                  </h3>
                  <p className="text-[11px] mt-1" style={{ color: C.textMuted, fontFamily: F.body }}>
                    {locCopy.metForecastNote}
                  </p>
                </div>
                <a
                  href="https://developer.data.gov.my/realtime-api/weather"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold whitespace-nowrap"
                  style={{ color: C.forest, fontFamily: F.body }}
                >
                  {locCopy.officialSource} ↗
                </a>
              </div>

              {metLoading && (
                <p className="text-sm mt-4" style={{ color: C.textMuted, fontFamily: F.body }}>
                  {locCopy.loadingOfficialForecast}
                </p>
              )}
              {metError && !metLoading && (
                <p className="text-sm mt-4 font-semibold" style={{ color: C.error, fontFamily: F.body }}>
                  {metError}
                </p>
              )}
              {!metLoading && !metError && metForecast.length === 0 && (
                <p className="text-sm mt-4" style={{ color: C.textMuted, fontFamily: F.body }}>
                  {locCopy.noStateForecast}
                </p>
              )}
              {!metLoading && !metError && metForecast.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                  {metForecast.map((day) => (
                    <article key={`${day.location.location_id}-${day.date}`} className="rounded-xl p-3" style={{ backgroundColor: C.muted }}>
                      <p className="text-[11px] font-bold" style={{ color: C.textMuted, fontFamily: F.body }}>
                        {new Date(`${day.date}T12:00:00+08:00`).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" })}
                      </p>
                      <p className="text-sm font-bold mt-2" style={{ color: C.text, fontFamily: F.body }}>
                        {day.summary_forecast}
                      </p>
                      <p className="text-sm mt-1" style={{ color: C.forest, fontFamily: F.body }}>
                        {day.min_temp}°C – {day.max_temp}°C
                      </p>
                      <div className="text-[11px] mt-3 space-y-1" style={{ color: C.textSub, fontFamily: F.body }}>
                        <p>{locCopy.morning}: {day.morning_forecast}</p>
                        <p>{locCopy.afternoon}: {day.afternoon_forecast}</p>
                        <p>{locCopy.night}: {day.night_forecast}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {metWarnings.map((warning, index) => (
              <section
                key={`${warning.warning_issue?.issued || warning.valid_from || "warning"}-${index}`}
                className="rounded-[18px] p-5 border"
                style={{ borderColor: "rgba(192,57,43,0.3)", backgroundColor: C.errorBg }}
              >
                <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: C.error, fontFamily: F.body }}>
                  {locCopy.officialWarning}
                </p>
                <h3 className="font-bold mt-1" style={{ color: C.error, fontFamily: F.body }}>
                  {language === "ms"
                    ? warning.heading_bm || warning.warning_issue?.title_bm || warning.heading_en || warning.warning_issue?.title_en || "Amaran cuaca"
                    : warning.heading_en || warning.warning_issue?.title_en || warning.heading_bm || warning.warning_issue?.title_bm || (language === "zh" ? "天气警报" : "Weather warning")}
                </h3>
                {(warning.text_en || warning.text_bm) && (
                  <p className="text-sm mt-2" style={{ color: C.textSub, fontFamily: F.body }}>
                    {language === "ms" ? warning.text_bm || warning.text_en : warning.text_en || warning.text_bm}
                  </p>
                )}
                {(warning.instruction_en || warning.instruction_bm) && (
                  <p className="text-sm font-bold mt-2" style={{ color: C.text, fontFamily: F.body }}>
                    {language === "ms" ? warning.instruction_bm || warning.instruction_en : warning.instruction_en || warning.instruction_bm}
                  </p>
                )}
                {warning.valid_to && (
                  <p className="text-[11px] mt-3" style={{ color: C.textMuted, fontFamily: F.body }}>
                    {language === "zh" ? "有效至" : language === "ms" ? "Sah sehingga" : "Valid until"} {new Date(warning.valid_to).toLocaleString("en-MY")}
                  </p>
                )}
              </section>
            ))}
          </div>
        )}
        {/* ==================== WongYueShan END - Weather Module ==================== */}

        {/* ==================== LimTzeXin Part - User Review & Rating Module ==================== */}
        {tab === "reviews" && (
          <div className="space-y-4">
            {!hasOwnReview && (
              <div className="flex justify-end py-1">
                <button
                  type="button"
                  onClick={() => {
                    setReviewMsg(null);
                    setShowReviewForm((visible) => !visible);
                  }}
                  className="rounded-full border bg-white px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50"
                  style={{ borderColor: C.forest, color: C.forest, fontFamily: F.body }}
                  aria-expanded={showReviewForm}
                >
                  {showReviewForm ? "Cancel review" : "Write a review"}
                </button>
              </div>
            )}
            {showReviewForm && !hasOwnReview && (
            <div className="bg-white rounded-[18px] p-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
              <h2 className="font-bold mb-4 text-base" style={{ fontFamily: F.body, color: C.text }}>Write a review</h2>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)}>
                    <Star size={22} fill={s <= rating ? C.amber : "none"} stroke={s <= rating ? C.amber : C.border} />
                  </button>
                ))}
              </div>
              <div className="mb-3">
                <textarea
                  value={rt}
                  onChange={(e) => setRt(e.target.value)}
                  placeholder="Share your experience…"
                  rows={3}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none border resize-none"
                  style={{ borderColor: countReviewWords(rt) > MAX_REVIEW_WORDS ? C.error : C.border, fontFamily: F.body, color: C.text }}
                />
                <p
                  className="mt-1 text-right text-xs"
                  style={{ color: countReviewWords(rt) > MAX_REVIEW_WORDS ? C.error : C.textMuted, fontFamily: F.body }}
                  aria-live="polite"
                >
                  {countReviewWords(rt)} / {MAX_REVIEW_WORDS} words
                </p>
              </div>
              <label
                className="mb-3 flex cursor-pointer items-center gap-3 rounded-xl border p-3"
                style={{ borderColor: C.border, fontFamily: F.body }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: C.muted, color: C.jungle }}>
                  <Upload size={15}/>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold" style={{ color: C.text }}>Add review photo</p>
                  <p className="truncate text-xs" style={{ color: C.textMuted }}>
                    {reviewPhotoFile ? reviewPhotoFile.name : "Optional JPG / PNG / WEBP up to 1MB"}
                  </p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(event) => chooseReviewPhoto(event.target.files?.[0])}/>
              </label>
              {reviewPhotoPreview && (
                <div className="mb-3 flex items-start gap-3">
                  <button type="button" onClick={() => setSelectedReviewPhoto({url:reviewPhotoPreview,alt:"Selected review photo preview"})} className="overflow-hidden rounded-xl border" style={{ borderColor: C.border }}>
                    <img src={reviewPhotoPreview} alt="Selected review photo preview" className="h-24 w-32 object-cover" />
                  </button>
                  <button type="button" onClick={() => chooseReviewPhoto(null)} className="text-[11px] font-bold" style={{ color: C.error, fontFamily: F.body }}>
                    Remove photo
                  </button>
                </div>
              )}
              <Pill
                variant="filled"
                small
                onClick={async () => {
                  setReviewMsg(null);
                  if (!user) { setReviewMsg("Please sign in to submit a review."); return; }
                  if (user.status === "review_restricted") { setReviewMsg("Your account is currently restricted from submitting reviews."); return; }
                  const visited=(activityLogs||[]).some(l=>l.location.toLowerCase()===(loc?.name||"").toLowerCase());
                  if(!visited){setReviewMsg("You can only review locations you have visited. Please log your activity first and try again.");return;}
                  if(rating===0){setReviewMsg("Please select a rating before submitting.");return;}
                  if(!rt.trim()){setReviewMsg("Please write a review comment.");return;}
                  if(countReviewWords(rt)>MAX_REVIEW_WORDS){setReviewMsg(`Review comments are limited to ${MAX_REVIEW_WORDS} words.`);return;}
                  try{
                    const photoUrl = reviewPhotoFile ? await firebaseClient.storage.uploadReviewPhoto(reviewPhotoFile) : "";
                    const result=await firebaseClient.backend.submitReview({
                      locationId:String(loc!.id),
                      rating,
                      comment:rt.trim(),
                      photoUrl,
                      locationSnapshot:{
                        name:loc!.name,
                        state:loc!.state,
                        activity:loc!.activity,
                        is_hidden_gem:(loc as any).is_hidden_gem===true,
                      },
                    });
                    if (result.newBadges?.length) {
                      await Promise.all(result.newBadges.map((badge:any)=>firebaseClient.entities.Announcement.create({
                        userId:user.id,
                        title:`Achievement unlocked: ${badge.name}`,
                        message:badgeAchievementMessage({ name: badge.name, desc: badge.desc || "Thanks for helping other explorers with your review.", icon: badge.icon || "" }),
                        type:"achievement",
                        relatedPage:"badges",
                        submissionId:badge.key,
                        read:false,
                        dismissed:false,
                        createdAt:new Date().toISOString(),
                      }).catch(()=>{})));
                    }
                    setReviews(p=>{
                      const nextReviews = [result.review as StoredReview,...p];
                      publishReviewSummary(nextReviews);
                      return nextReviews;
                    });
                    setRt(""); setRating(0); chooseReviewPhoto(null); setShowReviewForm(false); onToast?.("Your review has been submitted successfully!");
                  }catch(error:any){setReviewMsg(error?.message||"Unable to submit review to Firebase.");}
                }}
              >
                Submit review
              </Pill>
              {reviewMsg && (
                <p className="text-sm mt-3 font-semibold" style={{ color: C.error, fontFamily: F.body }}>{reviewMsg}</p>
              )}
            </div>
            )}
            {reviews.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: C.textMuted, fontFamily: F.body }}>
                Be the first to review this location!
              </p>
            ) : (
              reviewsForDisplay.map((r) => {
                const editing = editingReviewId === r.id;
                const changeAllowed = canChangeReview(r);
                return (
                <div key={r.id} className="bg-white rounded-[18px] p-5" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: C.forest }}>
                        {(r.userName || (r as any).user || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="text-sm font-bold" style={{ fontFamily: F.body, color: C.text }}>{r.userName || (r as any).user}</span>
                    </div>
                    <span className="text-[11px]" style={{ color: C.textMuted, fontFamily: F.body }}>{reviewDate(r)}</span>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      editing ? (
                        <button key={s} type="button" onClick={() => setEditingReviewRating(s)}>
                          <Star size={15} fill={s <= editingReviewRating ? C.amber : "none"} stroke={s <= editingReviewRating ? C.amber : C.border} />
                        </button>
                      ) : (
                        <Star key={s} size={11} fill={s <= r.rating ? C.amber : "none"} stroke={s <= r.rating ? C.amber : C.border} />
                      )
                    ))}
                  </div>
                  {editing ? (
                    <div className="space-y-2">
                      <div>
                        <textarea
                          value={editingReviewText}
                          onChange={(event) => setEditingReviewText(event.target.value)}
                          rows={3}
                          className="w-full rounded-xl px-4 py-3 text-sm outline-none border resize-none"
                          style={{ borderColor: countReviewWords(editingReviewText) > MAX_REVIEW_WORDS ? C.error : C.border, fontFamily: F.body, color: C.text }}
                        />
                        <p
                          className="mt-1 text-right text-xs"
                          style={{ color: countReviewWords(editingReviewText) > MAX_REVIEW_WORDS ? C.error : C.textMuted, fontFamily: F.body }}
                          aria-live="polite"
                        >
                          {countReviewWords(editingReviewText)} / {MAX_REVIEW_WORDS} words
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Pill
                          variant="filled"
                          small
                          onClick={async () => {
                            if (editingReviewRating === 0 || !editingReviewText.trim()) { setReviewMsg("A rating and review comment are required."); return; }
                            if (countReviewWords(editingReviewText) > MAX_REVIEW_WORDS) { setReviewMsg(`Review comments are limited to ${MAX_REVIEW_WORDS} words.`); return; }
                            try {
                              const result = await firebaseClient.backend.updateReview(r.id,{rating:editingReviewRating,comment:editingReviewText.trim()});
                              setReviews(items=>{
                                const nextReviews = items.map(item=>item.id===r.id?result.review as StoredReview:item);
                                publishReviewSummary(nextReviews);
                                return nextReviews;
                              });
                              cancelEditReview();
                              onToast?.("Review updated successfully.");
                            } catch(error:any) { setReviewMsg(error?.message||"Unable to update review."); }
                          }}
                        >
                          Save review
                        </Pill>
                        <Pill variant="outline" small onClick={cancelEditReview}><X size={12}/> Cancel</Pill>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm" style={{ color: C.textSub, fontFamily: F.body }}>{r.comment || (r as any).text}</p>
                      {r.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedReviewPhoto({url:r.photoUrl!,alt:`Review photo for ${loc.name}`})}
                          className="mt-3 block overflow-hidden rounded-xl border text-left"
                          style={{ borderColor: C.border }}
                          aria-label={`Open full review photo for ${loc.name}`}
                        >
                          <img src={r.photoUrl} alt={`Review photo for ${loc.name}`} className="h-44 w-full object-cover sm:w-80" />
                        </button>
                      )}
                    </>
                  )}
                  {user && !editing && (
                    <div className="flex flex-wrap gap-3 mt-2">
                      {changeAllowed && (
                        <>
                          <button type="button" onClick={() => beginEditReview(r)}
                            className="text-[11px] font-bold inline-flex items-center gap-1"
                            style={{ color: C.forest, fontFamily: F.body }}>
                            <Pencil size={11} /> Edit
                          </button>
                          <button type="button" onClick={async () => {
                            if(!confirm("Delete this review? This is only available within 24 hours after posting."))return;
                            try{
                              await firebaseClient.backend.deleteReview(r.id);
                              setReviews(items=>{
                                const nextReviews = items.filter(item=>item.id!==r.id);
                                publishReviewSummary(nextReviews);
                                return nextReviews;
                              });
                              onToast?.("Review deleted successfully.");
                            }catch(error:any){setReviewMsg(error?.message||"Unable to delete review.");}
                          }}
                            className="text-[11px] font-bold inline-flex items-center gap-1"
                            style={{ color: C.error, fontFamily: F.body }}>
                            <Trash2 size={11} /> Delete
                          </button>
                        </>
                      )}
                      {r.userId !== user.id && (
                        <button type="button" onClick={() => setFlagId(r.id)}
                          className="text-[11px] font-bold inline-flex items-center gap-1"
                          style={{ color: C.error, fontFamily: F.body }}>
                          <Flag size={11} /> Report
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )})
            )}
          </div>
        )}
        {/* ==================== LimTzeXin END - User Review & Rating Module ==================== */}
      </div>

      {/* ==================== LimTzeXin Part - User Review & Rating Module: Flag Review ==================== */}
      {flagId && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-5" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-[18px] p-6 max-w-sm w-full">
            <p className="font-bold mb-3" style={{ fontFamily: F.body, color: C.text }}>Report review</p>
            <select
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none mb-4"
              style={{ borderColor: C.border, fontFamily: F.body, color: C.text }}
            >
              <option>Offensive language</option>
              <option>Spam</option>
              <option>Inappropriate content</option>
              <option>Misleading information</option>
            </select>
            <div className="flex gap-2">
              <Pill variant="outline" small onClick={() => setFlagId(null)}>Cancel</Pill>
              <Pill
                variant="danger"
                small
                onClick={async () => {
                  if(!user||!flagId)return;
                  const target=reviews.find(r=>String(r.id)===String(flagId));
                  if(target?.flaggedBy?.includes(user.id)){onToast?.("You have already reported this review.","err");setFlagId(null);return;}
                  try{
                    await firebaseClient.backend.reportReview(flagId,flagReason);
                    setReviews(p=>{
                      const nextReviews = p.filter(r=>String(r.id)!==String(flagId));
                      publishReviewSummary(nextReviews);
                      return nextReviews;
                    });
                    setFlagId(null);
                    onToast?.("Review has been reported. Thank you for helping keep our community safe!");
                  }catch(error:any){onToast?.(error?.message||"Unable to report this review.","err");}
                }}
              >
                Submit Flag
              </Pill>
            </div>
          </div>
        </div>
      )}
      {/* ==================== LimTzeXin END - User Review & Rating Module: Flag Review ==================== */}
      {selectedReviewPhoto && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedReviewPhoto(null)}>
          <button
            type="button"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black"
            onClick={() => setSelectedReviewPhoto(null)}
            aria-label="Close full image"
          >
            <X size={18}/>
          </button>
          <img
            src={selectedReviewPhoto.url}
            alt={selectedReviewPhoto.alt}
            className="max-h-[86vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
      {selectedLocationPhoto && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedLocationPhoto(null)}>
          <button
            type="button"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black"
            onClick={() => setSelectedLocationPhoto(null)}
            aria-label="Close full image"
          >
            <X size={18}/>
          </button>
          <img
            src={selectedLocationPhoto.url}
            alt={selectedLocationPhoto.alt}
            className="max-h-[86vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
