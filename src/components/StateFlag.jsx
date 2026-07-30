import { useState } from "react";

/** Map state name → filename under public/images/flags/ */
const FLAG_FILES = {
  "Johor": "johor.png",
  "Kedah": "kedah.png",
  "Kelantan": "kelantan.png",
  "Melaka": "melaka.png",
  "Negeri Sembilan": "negeri-sembilan.png",
  "Pahang": "pahang.png",
  "Perak": "perak.png",
  "Perlis": "perlis.png",
  "Sabah": "sabah.png",
  "Sarawak": "sarawak.png",
  "Selangor": "selangor.png",
  "Terengganu": "terengganu.png",
  "Pulau Pinang": "pulau-pinang.png",
  "Kuala Lumpur": "kuala-lumpur.png",
  "Labuan": "labuan.png",
  "Putrajaya": "putrajaya.png",
};

function Crescent({ cx, cy, r, fill = "white", bg }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} />
      <circle cx={cx + r * 0.35} cy={cy} r={r * 0.82} fill={bg} />
    </g>
  );
}

function Star({ x, y, size, fill = "white" }) {
  const outer = size;
  const inner = size * 0.382;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    pts.push(`${(x + r * Math.cos(angle)).toFixed(2)},${(y + r * Math.sin(angle)).toFixed(2)}`);
  }
  return <polygon points={pts.join(" ")} fill={fill} />;
}

/** Built-in SVG flags (used if no image file is found) */
const FLAGS = {
  Johor: (
    <>
      <rect width="30" height="20" fill="#000080" />
      <Crescent cx={5} cy={5} r={1.8} fill="white" bg="#000080" />
      <Star x={8.5} y={5} size={2.2} fill="white" />
    </>
  ),
  Kedah: (
    <>
      <rect width="30" height="20" fill="#C8102E" />
      <ellipse cx="15" cy="10" rx="3.5" ry="4.5" fill="#FFD700" />
      <ellipse cx="15" cy="10" rx="2.2" ry="3.2" fill="#006633" />
      <Star x={15} y={10} size={1.8} fill="#FFD700" />
    </>
  ),
  Kelantan: (
    <>
      <rect width="30" height="20" fill="#C8102E" />
      <Crescent cx={12.5} cy={10} r={2.5} fill="white" bg="#C8102E" />
      <Star x={17} y={10} size={3} fill="white" />
    </>
  ),
  Melaka: (
    <>
      <rect x="0" y="0" width="15" height="10" fill="#002B7F" />
      <rect x="15" y="0" width="15" height="10" fill="#FFD700" />
      <rect x="0" y="10" width="15" height="10" fill="white" />
      <rect x="15" y="10" width="15" height="10" fill="#DC241F" />
      <Crescent cx={4} cy={4.5} r={1.7} fill="#FFD700" bg="#002B7F" />
      <Star x={7.5} y={4.5} size={2} fill="#FFD700" />
    </>
  ),
  "Negeri Sembilan": (
    <>
      <rect width="30" height="20" fill="#FFD700" />
      <rect x="0" y="0" width="12" height="10" fill="#C8102E" />
      <polygon points="2,2 2,8 9,5" fill="#000" />
    </>
  ),
  Pahang: (
    <>
      <rect x="0" y="0" width="30" height="10" fill="#000" />
      <rect x="0" y="10" width="30" height="10" fill="white" />
      <circle cx="15" cy="10" r="3" fill="#FFD700" stroke="#8B6914" strokeWidth="0.3" />
    </>
  ),
  "Pulau Pinang": (
    <>
      <rect x="0" y="0" width="10" height="20" fill="#0033A0" />
      <rect x="10" y="0" width="10" height="20" fill="white" />
      <rect x="20" y="0" width="10" height="20" fill="#FFC72C" />
      <rect x="14.6" y="9" width="0.8" height="7" fill="#8B4513" />
      <circle cx="15" cy="8" r="3" fill="#228B22" />
    </>
  ),
  Perak: (
    <>
      <rect x="0" y="0" width="30" height="6.67" fill="white" />
      <rect x="0" y="6.67" width="30" height="6.67" fill="#FFD700" />
      <rect x="0" y="13.33" width="30" height="6.67" fill="#000" />
    </>
  ),
  Perlis: (
    <>
      <rect x="0" y="0" width="30" height="10" fill="#FFD700" />
      <rect x="0" y="10" width="30" height="10" fill="#006633" />
      <Crescent cx={8} cy={5} r={2} fill="#000080" bg="#FFD700" />
      <Star x={12} y={5} size={2.2} fill="#000080" />
    </>
  ),
  Sabah: (
    <>
      <rect width="30" height="20" fill="#0033A0" />
      <polygon points="0,0 12,10 0,20" fill="#C8102E" />
      <Crescent cx={18} cy={10} r={3} fill="white" bg="#0033A0" />
      <Star x={23} y={10} size={2.5} fill="white" />
    </>
  ),
  Sarawak: (
    <>
      <rect width="30" height="20" fill="#C8102E" />
      <polygon points="0,0 15,10 0,20" fill="#FFD700" />
      <polygon points="0,3 11,10 0,17" fill="#000" />
      <Star x={20} y={10} size={3} fill="#FFD700" />
    </>
  ),
  Selangor: (
    <>
      <rect x="0" y="0" width="15" height="20" fill="#C8102E" />
      <rect x="15" y="0" width="15" height="20" fill="#FFD700" />
      <Crescent cx={7.5} cy={10} r={3} fill="#FFD700" bg="#C8102E" />
      <Star x={11.5} y={10} size={2.5} fill="#FFD700" />
    </>
  ),
  Terengganu: (
    <>
      <rect width="30" height="20" fill="#000" />
      <Crescent cx={12} cy={10} r={3.5} fill="white" bg="#000" />
      <Star x={18} y={10} size={3.5} fill="white" />
    </>
  ),
  "Kuala Lumpur": (
    <>
      <rect width="30" height="20" fill="#0033A0" />
      <Crescent cx={10} cy={10} r={3} fill="#FFD700" bg="#0033A0" />
      <Star x={16} y={10} size={2.5} fill="#FFD700" />
    </>
  ),
  Labuan: (
    <>
      <rect width="30" height="20" fill="#0033A0" />
      <Crescent cx={10} cy={10} r={3} fill="#FFD700" bg="#0033A0" />
      <Star x={16} y={10} size={2.5} fill="#FFD700" />
    </>
  ),
  Putrajaya: (
    <>
      <rect x="0" y="0" width="10" height="20" fill="#002B7F" />
      <rect x="10" y="0" width="10" height="20" fill="#FFD700" />
      <rect x="20" y="0" width="10" height="20" fill="#002B7F" />
      <path d="M11 5 L19 5 L19 11 Q15 16 11 11 Z" fill="white" />
      <Star x={15} y={8.5} size={2} fill="#002B7F" />
    </>
  ),
};

function SvgFlag({ state, className }) {
  const flag = FLAGS[state];
  if (!flag) return <div className={`bg-gray-200 ${className}`} />;
  return (
    <svg
      viewBox="0 0 30 20"
      className={`${className} flag-svg`}
      preserveAspectRatio="xMidYMid slice"
      style={{ display: "block", width: "100%", height: "100%" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {flag}
    </svg>
  );
}

/**
 * Renders a state flag.
 * 1. Tries image: /images/flags/{name}.png  (or .jpg / .webp)
 * 2. Falls back to built-in SVG if the image is missing
 */
export default function StateFlag({ state, className = "" }) {
  const file = FLAG_FILES[state];
  const [useSvg, setUseSvg] = useState(!file);

  if (useSvg || !file) {
    return <SvgFlag state={state} className={className} />;
  }

  return (
    <img
      src={`/images/flags/${file}`}
      alt={`${state} flag`}
      className={className}
      style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
      onError={() => setUseSvg(true)}
    />
  );
}
