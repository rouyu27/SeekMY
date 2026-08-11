import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image } from "@/components/ui/image";

const SLIDES = [
  // Put your images in public/images/ then use /images/filename.jpg
  { url: "/images/hero-1.jpg", caption: "Snorkel with sea turtles" },
  { url: "/images/hero-2.jpg", caption: "Hike misty rainforest trails" },
  { url: "/images/hero-3.jpg", caption: "Conquer Mount Kinabalu" },
  { url: "/images/hero-4.jpg", caption: "Train at Bukit Jalil" },
  { url: "/images/hero-5.jpg", caption: "Walk urban park paths" },
  { url: "/images/hero-6.jpg", caption: "Relax by tranquil lakes" },
];

export default function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence>
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1.15 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.5, ease: "easeInOut" },
            scale: { duration: 6, ease: "linear" },
          }}
          className="absolute inset-0"
          style={{ filter: "blur(4px) brightness(0.82)" }}
        >
          <Image
            src={SLIDES[index].url}
            alt={SLIDES[index].caption}
            className="w-full h-full"
            fittingType="fill"
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-950/75 via-teal-900/65 to-blue-950/75" />

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-8 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"}`}
          />
        ))}
      </div>
    </div>
  );
}