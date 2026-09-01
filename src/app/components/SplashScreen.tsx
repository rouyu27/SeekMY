import { useEffect, useState } from "react";
import "./SplashScreen.css";

interface SplashScreenProps {
  logoSrc: string;
  onFinish?: () => void;
  minDuration?: number;
}

export function SplashScreen({ logoSrc, onFinish, minDuration = 2200 }: SplashScreenProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsFadingOut(true);
    }, minDuration);

    return () => {
      window.clearTimeout(timer);
    };
  }, [minDuration]);

  function handleAnimationEnd() {
    if (isFadingOut) onFinish?.();
  }

  return (
    <div
      className={`seekmy-splash ${isFadingOut ? "seekmy-splash--fade-out" : ""}`}
      onAnimationEnd={handleAnimationEnd}
      role="status"
      aria-label="Loading SeekMY"
    >
      <div className="seekmy-splash__content">
        <div className="seekmy-splash__logo-wrap">
          <img src={logoSrc} alt="SeekMY Logo" className="seekmy-splash__logo" />
        </div>
        <h1 className="seekmy-splash__title">Seek<span>MY</span></h1>
        <div className="seekmy-splash__divider" aria-hidden="true" />
        <p className="seekmy-splash__subtitle">Malaysia Outdoor Activity Discovery Platform</p>
        <div className="seekmy-splash__loader" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
