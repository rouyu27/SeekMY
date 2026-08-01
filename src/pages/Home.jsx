import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MALAYSIA_STATES, ACTIVITY_TYPES } from "@/lib/malaysia-data";
import { Search, MapPin, Sparkles, TrendingUp } from "lucide-react";
import StateFlag from "@/components/StateFlag";
import { motion } from "framer-motion";
import HeroSlider from "@/components/HeroSlider";

export default function Home() {
  const [search, setSearch] = useState("");
  const [hiddenGem, setHiddenGem] = useState(null);

  useEffect(() => {
    base44.entities.Location.filter({ is_hidden_gem: true, status: "active" }, "-created_date", 1)
      .then(r => r.length > 0 && setHiddenGem(r[0]));
  }, []);

  const filtered = MALAYSIA_STATES.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.region.toLowerCase().includes(search.toLowerCase())
  );

  const peninsular = filtered.filter(s => s.region === "Peninsular");
  const east = filtered.filter(s => s.region === "East Malaysia");
  const federal = filtered.filter(s => s.region === "Federal Territory");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative text-white overflow-hidden min-h-[420px] md:min-h-[480px] flex items-center justify-center">
        <HeroSlider />

        {/* Floating decorative icons */}
        <motion.div className="absolute top-24 left-[8%] text-4xl opacity-60 hidden md:block" animate={{ y: [0, -16, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>⛰️</motion.div>
        <motion.div className="absolute top-36 right-[10%] text-4xl opacity-60 hidden md:block" animate={{ y: [0, -22, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>🤿</motion.div>
        <motion.div className="absolute bottom-32 left-[14%] text-3xl opacity-50 hidden md:block" animate={{ y: [0, -14, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}>🚵</motion.div>
        <motion.div className="absolute bottom-40 right-[12%] text-3xl opacity-50 hidden md:block" animate={{ y: [0, -18, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}>🏕️</motion.div>
        <motion.div className="absolute top-1/2 left-[5%] text-2xl opacity-40 hidden lg:block" animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}>🏊</motion.div>

        <div className="relative max-w-5xl mx-auto px-4 py-6 md:py-8 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-4 py-1.5 mb-6 text-sm font-medium border border-white/20"
          >
            <Sparkles className="w-4 h-4" />
            Visit Malaysia 2026 · VM2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl md:text-7xl font-black mb-4 leading-tight drop-shadow-2xl"
          >
            Discover Malaysia's<br />
            <span className="bg-gradient-to-r from-amber-200 via-green-200 to-teal-200 bg-clip-text text-transparent">Outdoor Adventures</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-lg md:text-xl text-white/85 mb-8 max-w-2xl mx-auto drop-shadow-lg"
          >
            Explore hiking trails, dive sites, cycling routes, and more across all 13 states and 3 federal territories.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="max-w-xl mx-auto relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search states, activities, locations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-900 text-base shadow-2xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-white/95 backdrop-blur-sm"
            />
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex justify-center items-start gap-8 md:gap-16 mt-6"
          >
            {[
              { label: "States", value: "16" },
              { label: "Activities", value: "9+" },
              { label: "Locations", value: "30+" }
            ].map(s => (
              <div key={s.label} className="text-center w-24 md:w-28">
                <div className="text-2xl md:text-3xl font-black drop-shadow-lg tabular-nums">{s.value}</div>
                <div className="text-white/60 text-xs md:text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/50"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* Activity Types Quick Filter */}
      <section className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {ACTIVITY_TYPES.map(a => (
              <Link
                key={a.name}
                to={`/locations?activity=${encodeURIComponent(a.name)}`}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm font-medium whitespace-nowrap hover:bg-green-50 hover:border-green-300 transition-all text-gray-700"
              >
                <span>{a.icon}</span>
                {a.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Hidden Gem Spotlight */}
        {hiddenGem && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-gray-900">Hidden Gem Spotlight</h2>
            </div>
            <Link to={`/location/${hiddenGem.id}`}>
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white hover:shadow-xl transition-shadow group">
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold">
                  ✨ Hidden Gem
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-5xl">💎</div>
                  <div>
                    <h3 className="text-xl font-bold mb-1 group-hover:underline">{hiddenGem.name}</h3>
                    <p className="text-white/80 flex items-center gap-1 text-sm mb-2">
                      <MapPin className="w-3 h-3" /> {hiddenGem.state}
                    </p>
                    <p className="text-white/70 text-sm line-clamp-2">{hiddenGem.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* State Grid */}
        {[
          { label: "Peninsular Malaysia", states: peninsular },
          { label: "East Malaysia", states: east },
          { label: "Federal Territories", states: federal }
        ].filter(g => g.states.length > 0).map(group => (
          <section key={group.label} className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-green-500 rounded-full" />
              {group.label}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {group.states.map((state, idx) => (
                <motion.div
                  key={state.name}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.04 }}
                >
                <Link to={`/state/${encodeURIComponent(state.name)}`}>
                  <div className="flag-container relative rounded-xl overflow-hidden hover:scale-105 hover:shadow-lg transition-all cursor-pointer group w-45 h-30 ring-1 ring-black/10">
                                        <StateFlag state={state.name} className="w-full h-full block" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                          <div className="font-bold text-sm leading-tight text-white drop-shadow-lg">{state.name}</div>
                                          <div className="text-white/80 text-xs mt-0.5 drop-shadow">{state.region}</div>
                                        </div>
                                      </div>
                </Link>
                </motion.div>
              ))}
            </div>
          </section>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No states found for "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
}