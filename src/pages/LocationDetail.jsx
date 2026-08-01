import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ACTIVITY_TYPES, DIFFICULTY_COLORS } from "@/lib/malaysia-data";
import { ArrowLeft, Star, MapPin, Clock, Route, Bookmark, BookmarkCheck, Send, Wind, Droplets } from "lucide-react";
import { Image } from "@/components/ui/image";

const WEATHER_EMOJI = {
  '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
  '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️', '50d': '🌫️', '50n': '🌫️'
};

export default function LocationDetail() {
  const { id } = useParams();
  const [location, setLocation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Location.get(id),
      base44.entities.Review.filter({ location_id: id, status: "active" }, "-created_date"),
      base44.entities.Bookmark.filter({ location_id: id })
    ]).then(([loc, revs, bks]) => {
      setLocation(loc);
      setReviews(revs);
      setBookmarked(bks.length > 0);
      setLoading(false);

      // Fetch weather if we have coords
      if (loc?.latitude && loc?.longitude) {
        base44.functions.invoke('getWeather', { lat: loc.latitude, lon: loc.longitude })
          .then(res => {
            if (res.data?.current) {
              setWeather({
                temp: res.data.current.temp,
                feelsLike: res.data.current.feelsLike,
                desc: res.data.current.descFull || res.data.current.desc,
                icon: res.data.current.icon,
                humidity: res.data.current.humidity,
                wind: res.data.current.wind,
              });
              if (res.data.forecast) setForecast(res.data.forecast);
            }
          }).catch(() => {});
      }
    }).catch(() => setLoading(false));
  }, [id]);

  const handleBookmark = async () => {
    if (bookmarked) {
      const bks = await base44.entities.Bookmark.filter({ location_id: id });
      for (const b of bks) await base44.entities.Bookmark.delete(b.id);
      setBookmarked(false);
    } else {
      await base44.entities.Bookmark.create({
        location_id: id,
        location_name: location.name,
        location_state: location.state,
        location_image: location.image_url,
        activity_types: location.activity_types
      });
      setBookmarked(true);
    }
  };

  const handleReview = async () => {
    if (!newReview.comment.trim()) return;
    setSubmittingReview(true);
    const rev = await base44.entities.Review.create({
      location_id: id,
      location_name: location.name,
      rating: newReview.rating,
      comment: newReview.comment,
      user_name: "You"
    });
    // Update avg rating
    const allRatings = [...reviews, rev];
    const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;
    await base44.entities.Location.update(id, { avg_rating: Math.round(avg * 10) / 10, review_count: allRatings.length });
    setReviews([rev, ...reviews]);
    setNewReview({ rating: 5, comment: "" });
    setSubmittingReview(false);
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-64 bg-gray-200 rounded-2xl mb-6" />
      <div className="h-8 bg-gray-200 rounded w-2/3 mb-4" />
      <div className="h-4 bg-gray-200 rounded mb-2" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
    </div>
  );

  if (!location) return <div className="text-center py-20 text-gray-400">Location not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link to={`/state/${encodeURIComponent(location.state)}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {location.state}
        </Link>

        {/* Hero Image */}
        {location.image_url ? (
          <div className="rounded-2xl overflow-hidden h-64 mb-6">
            <Image src={location.image_url} alt={location.name} className="w-full h-full" fittingType="fill" />
          </div>
        ) : (
          <div className="rounded-2xl h-40 bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center text-6xl mb-6">
            {ACTIVITY_TYPES.find(a => (location.activity_types || []).includes(a.name))?.icon || "🏞️"}
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="text-2xl font-black text-gray-900 mb-1">{location.name}</h1>
              <p className="text-gray-500 flex items-center gap-1 text-sm"><MapPin className="w-4 h-4" />{location.state}</p>
            </div>
            <button onClick={handleBookmark} className={`p-3 rounded-xl border transition-all ${bookmarked ? "bg-green-50 border-green-200 text-green-600" : "border-gray-200 text-gray-400 hover:border-green-200 hover:text-green-600"}`}>
              {bookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(location.activity_types || []).map(a => {
              const act = ACTIVITY_TYPES.find(t => t.name === a);
              return <span key={a} className={`text-sm px-3 py-1 rounded-full border font-medium ${act?.color || "bg-gray-100 text-gray-600"}`}>{act?.icon} {a}</span>;
            })}
            {location.difficulty && <span className={`text-sm px-3 py-1 rounded-full border font-medium ${DIFFICULTY_COLORS[location.difficulty]}`}>{location.difficulty}</span>}
            {location.is_hidden_gem && <span className="text-sm px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-medium">💎 Hidden Gem</span>}
            {location.is_family_friendly && <span className="text-sm px-3 py-1 rounded-full bg-pink-100 text-pink-700 border border-pink-200 font-medium">👨‍👩‍👧 Family Friendly</span>}
            {location.is_free && <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200 font-medium">🆓 Free</span>}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl mb-4">
            {location.avg_rating > 0 && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 font-bold text-lg text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400" />{location.avg_rating}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{location.review_count} reviews</div>
              </div>
            )}
            {location.distance_km && (
              <div className="text-center">
                <div className="font-bold text-lg text-gray-900 flex items-center justify-center gap-1">
                  <Route className="w-4 h-4 text-blue-500" />{location.distance_km}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">kilometres</div>
              </div>
            )}
            {location.duration_hours && (
              <div className="text-center">
                <div className="font-bold text-lg text-gray-900 flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4 text-purple-500" />{location.duration_hours}h
                </div>
                <div className="text-xs text-gray-500 mt-0.5">estimated</div>
              </div>
            )}
          </div>

          {location.description && <p className="text-gray-700 leading-relaxed">{location.description}</p>}
        </div>

        {/* Weather Widget */}
        {weather && (
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl p-5 mb-4">
            <h3 className="font-bold mb-3 text-sm opacity-80">Live Weather · OpenWeatherMap</h3>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{WEATHER_EMOJI[weather.icon] || '🌤️'}</span>
                <div>
                  <div className="text-3xl font-black leading-none">{weather.temp}°C</div>
                  <div className="text-white/80 text-sm mt-0.5 capitalize">{weather.desc}</div>
                  {weather.feelsLike != null && <div className="text-white/60 text-xs mt-0.5">Feels like {weather.feelsLike}°C</div>}
                </div>
              </div>
              <div className="space-y-1 text-sm text-right">
                <div className="flex items-center gap-2 justify-end"><Droplets className="w-4 h-4" />{weather.humidity}% humidity</div>
                <div className="flex items-center gap-2 justify-end"><Wind className="w-4 h-4" />{weather.wind} km/h</div>
              </div>
            </div>
            {forecast.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mb-3">
                {forecast.slice(0, 6).map((f, i) => (
                  <div key={i} className="bg-white/15 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-center shrink-0 min-w-[52px]">
                    <div className="text-xs text-white/60">{new Date(f.time).getHours()}:00</div>
                    <div className="text-lg leading-none my-0.5">{WEATHER_EMOJI[f.icon] || '🌤️'}</div>
                    <div className="text-xs font-bold">{f.temp}°</div>
                  </div>
                ))}
              </div>
            )}
            <div className={`mt-3 text-xs px-3 py-1.5 rounded-full inline-flex font-medium ${parseInt(weather.wind) < 30 ? "bg-green-400/30" : "bg-yellow-400/30"}`}>
              {parseInt(weather.wind) < 30 ? "✅ Good to Go" : "⚠️ Check Before You Go"}
            </div>
            <p className="mt-2 text-xs text-white/80">
              Weather tip: {weather.temp >= 32 ? "Very hot — bring extra water and sun protection." : weather.temp <= 22 ? "Cooler conditions — light jacket may help in highlands." : "Mild conditions — ideal for most outdoor activities."}
              {weather.humidity >= 85 ? " High humidity; pace yourself." : ""}
              {Strinhg(weather.desc || "").toLowerCase().includes("rain") ? " Rain possible — pack a light raincoat." : ""}
            </p>
          </div>
        )}

        {/* Facilities & Info */}
        {(location.facilities?.length > 0 || location.accessibility || location.best_months?.length > 0) && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
            <h3 className="font-bold text-gray-900 mb-4">Details</h3>
            {location.facilities?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Facilities</p>
                <div className="flex flex-wrap gap-2">
                  {location.facilities.map(f => <span key={f} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">{f}</span>)}
                </div>
              </div>
            )}
            {location.accessibility && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Accessibility</p>
                <p className="text-sm text-gray-700">{location.accessibility}</p>
              </div>
            )}
            {location.best_months?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Best Months to Visit</p>
                <div className="flex flex-wrap gap-2">
                  {location.best_months.map(m => <span key={m} className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">{m}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h3 className="font-bold text-gray-900 mb-4">Reviews</h3>
          
          {/* Add Review */}
          <div className="border border-gray-200 rounded-xl p-4 mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Write a Review</p>
            <div className="flex gap-1 mb-3">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setNewReview(r => ({...r, rating: n}))}
                  className={`text-2xl transition-transform hover:scale-110 ${n <= newReview.rating ? "text-amber-400" : "text-gray-200"}`}>★</button>
              ))}
            </div>
            <textarea
              value={newReview.comment}
              onChange={e => setNewReview(r => ({...r, comment: e.target.value}))}
              placeholder="Share your experience..."
              className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
              rows={3}
            />
            <button onClick={handleReview} disabled={submittingReview || !newReview.comment.trim()}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-green-700 transition-colors">
              <Send className="w-4 h-4" />
              {submittingReview ? "Posting..." : "Post Review"}
            </button>
          </div>

          {/* Review List */}
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map(rev => (
                <div key={rev.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-gray-900">{rev.user_name || "Anonymous"}</span>
                    <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <span key={n} className={`text-sm ${n <= rev.rating ? "text-amber-400" : "text-gray-200"}`}>★</span>)}</div>
                  </div>
                  <p className="text-sm text-gray-600">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Log Activity CTA */}
        <Link to="/activity-log" className="block bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-2xl p-5 text-center hover:shadow-lg transition-shadow mb-4">
          <div className="text-2xl mb-1">📝</div>
          <div className="font-bold">Visited this place?</div>
          <div className="text-white/80 text-sm mt-1">Log your activity and earn badges!</div>
        </Link>
      </div>
    </div>
  );
}