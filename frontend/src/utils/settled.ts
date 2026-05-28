/** Retourne la valeur d'une promesse résolue ou un repli si rejetée. */
export function settled<T>(r: PromiseSettledResult<T>, fallback: T): T {
  return r.status === "fulfilled" ? r.value : fallback;
}
