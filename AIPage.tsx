import { C } from "../lib/tokens";
import { AI_RESPONSES } from "../data/catalog";

export function diffStyle(d:string) {
  if (d==="Easy") return {bg:"#dcf0e4",color:C.forest};
  if (d==="Moderate") return {bg:"#fef3c7",color:"#92400e"};
  return {bg:"#fde8e6",color:C.error};
}
export function getAIReply(msg:string) {
  const l = msg.toLowerCase();
  if (l.includes("sipadan")) return AI_RESPONSES.sipadan;
  if (l.includes("hik")||l.includes("trail")||l.includes("mountain")) return AI_RESPONSES.hiking;
  if (l.includes("div")||l.includes("snorkel")) return AI_RESPONSES.diving;
  if (l.includes("cycl")||l.includes("bike")) return AI_RESPONSES.cycling;
  if (l.includes("camp")) return AI_RESPONSES.camping;
  if (l.includes("gear")||l.includes("bring")||l.includes("pack")) return AI_RESPONSES.gear;
  if (l.includes("begin")||l.includes("first")||l.includes("easy")) return AI_RESPONSES.beginner;
  if (l.includes("weather")||l.includes("rain")||l.includes("monsoon")) return AI_RESPONSES.weather;
  return AI_RESPONSES.default;
}
export function isValidEmail(e:string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

