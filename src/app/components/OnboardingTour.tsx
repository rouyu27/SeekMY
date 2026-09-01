import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import type { Language } from "../lib/i18n";
import { t } from "../lib/i18n";
import { C, F } from "../lib/tokens";

export function OnboardingTour({
  language,
  onFinish,
}: {
  language: Language;
  onFinish: () => void;
}) {
  const [step, setStep] = useState(0);
  const steps = [
    { title: t(language, "tour1Title"), text: t(language, "tour1Text") },
    { title: t(language, "tour2Title"), text: t(language, "tour2Text") },
    { title: t(language, "tour3Title"), text: t(language, "tour3Text") },
    { title: t(language, "tour4Title"), text: t(language, "tour4Text") },
  ];
  const last = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-black/55 px-5">
      <div className="w-full max-w-md rounded-[18px] bg-white p-6 shadow-2xl" style={{ fontFamily: F.body }}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: C.forest }}>
              SeekMY
            </p>
            <h2 className="mt-1 text-2xl font-normal" style={{ color: C.jungle, fontFamily: F.display }}>
              {steps[step].title}
            </h2>
          </div>
          <button type="button" onClick={onFinish} className="rounded-full p-2" aria-label={t(language, "tourSkip")}>
            <X size={17} />
          </button>
        </div>
        <p className="min-h-14 text-sm leading-relaxed" style={{ color: C.textSub }}>
          {steps[step].text}
        </p>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((item, index) => (
              <span
                key={item.title}
                className="h-2 rounded-full"
                style={{ width: index === step ? 24 : 8, backgroundColor: index === step ? C.jungle : C.border }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="flex h-10 items-center gap-1 rounded-full border px-4 text-sm font-bold" style={{ borderColor: C.border, color: C.textSub }}>
                <ChevronLeft size={14} /> {t(language, "tourBack")}
              </button>
            )}
            <button type="button" onClick={() => last ? onFinish() : setStep(step + 1)} className="flex h-10 items-center gap-1 rounded-full px-4 text-sm font-bold text-white" style={{ backgroundColor: C.jungle }}>
              {last ? t(language, "tourDone") : t(language, "tourNext")} {!last && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
