import { C } from "../lib/tokens";
import { AI_RESPONSES } from "./constants";

export function diffStyle(d:string) {
  if (d==="Easy") return {bg:"#dcf0e4",color:C.forest};
  if (d==="Moderate") return {bg:"#fef3c7",color:"#92400e"};
  return {bg:"#fde8e6",color:C.error};
}