import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, MapPin, Star, Loader2, Compass, Globe, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const SUGGESTIONS = [
  "Hiking trails Sabah",
  "Beaches Langkawi",
  "Waterfalls Pahang",
  "Diving Sipadan",
  "National parks Malaysia",
  "Rock climbing Selangor",
  "Camping Perak",
  "Kayaking Kuala Lumpur"
];

export default function Discover() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (q) => {
    const searchTerm = q || query;
    if (!searchTerm.trim()) return;
    setQuery(searchTerm);
    setLoading(true);
    setSearched(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('searchGooglePlaces', { query: searchTerm });
      setResults(response.data?.places || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to search');
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-teal-600 to-cyan-700 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-12">
          <div className="flex items-center gap-3 mb-2">
            <Compass className="w-7 h-7" />
            <h1 className="text-3xl font-black">Discover Real Places</h1>
          </div>
          <p className="text-white/70 mb-6">
            Search Google Places for real Malaysian landmarks, parks, beaches & trailheads with authentic photos
          </p>
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search places... e.g. 'hiking trails Cameron Highlands'"
              className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-900 text-base shadow-2xl focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white/95"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => handleSearch(s)}
                className="text-sm bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 hover:bg-white/25 transition-colors border border-white/20"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-teal-500 mb-4" />
            <p className="text-gray-500">Searching Google Places for real photos...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-600 font-medium mb-1">Search Error</p>
            <p className="text-red-500 text-sm">{error}</p>
            <p className="text-gray-400 text-xs mt-2">
              Make sure the Google Places API key is set in Settings &gt; Environment Variables.
            </p>
          </div>
        )}

        {!loading && !error && searched && results.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No places found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <>
            <div className="mb-4 text-sm text-gray-500">
              {results.length} real places found for &ldquo;{query}&rdquo;
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((place, idx) => (
                <motion.div
                  key={place.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {place.photoUrl ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={place.photoUrl}
                        alt={place.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-teal-100 to-cyan-200 flex items-center justify-center">
                      <Globe className="w-12 h-12 text-teal-400" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1 group-hover:text-teal-700 transition-colors line-clamp-1">
                      {place.name}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-start gap-1 mb-2">
                      <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{place.address}</span>
                    </p>
                    {place.rating > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="font-semibold text-sm text-gray-900">{place.rating}</span>
                        <span className="text-xs text-gray-400">({place.ratingCount} reviews)</span>
                      </div>
                    )}
                    {place.types?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {place.types.slice(0, 3).map(t => (
                          <span key={t} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                            {t.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                    {place.latitude && place.longitude && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" /> View on Google Maps
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {!loading && !error && !searched && (
          <div className="text-center py-20">
            <Compass className="w-16 h-16 mx-auto mb-4 text-teal-200" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">Start Your Discovery</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Search for real Malaysian outdoor destinations powered by Google Places API. Find authentic photos, ratings, and locations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}