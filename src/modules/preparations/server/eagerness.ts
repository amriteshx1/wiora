export function eagerness(style: { interruption: string; pace: string }): "low" | "medium" | "high" {
  if (style.interruption === "rare" && style.pace !== "brisk") {
    return "low";
  }
  if (style.interruption === "frequent" || style.pace === "brisk") {
    return "high";
  }
  return "medium";
}
