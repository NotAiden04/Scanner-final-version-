const RULES = {
  "01_0C": { warnHigh: 4000 },
  "01_0D": { warnHigh: 110 },
  "01_05": { warnLow: 165, warnHigh: 235 },
  "TCM_LINE": { warnLow: 60, warnHigh: 260 }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const body = req.body || {};
  const findings = [];
  for (const pid of body.pids || []) {
    const rule = RULES[pid];
    const arr = ((body.series || {})[pid] || []).slice(-60);
    if (!rule || arr.length < 3) continue;
    const last = arr[arr.length - 1].v;
    const out =
      (rule.warnLow != null && last < rule.warnLow) ||
      (rule.warnHigh != null && last > rule.warnHigh);
    if (out) findings.push(`${pid} outside threshold. Latest ${last}. Limits: ${rule.warnLow ?? "-"}–${rule.warnHigh ?? "-"}.`);
    const first = arr[0].v;
    if (Math.abs(last - first) > 0.25 * (rule.warnHigh ?? Math.max(last, 1))) {
      findings.push(`${pid} rapid change over 60s.`);
    }
  }
  res.json({ summary: findings.length ? findings.join("\n") : "No obvious out-of-parameter behavior in the current view.", findings });
}