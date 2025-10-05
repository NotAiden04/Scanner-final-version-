import type { NextApiRequest, NextApiResponse } from "next";

type Sample = { t: number; v: number };
type Body = {
  vehicle?: { vin?: string };
  pids: string[];
  series: Record<string, Sample[]>;
};

const RULES: Record<string, { warnLow?: number; warnHigh?: number }> = {
  "01_0C": { warnHigh: 4000 },             // RPM
  "01_0D": { warnHigh: 110 },              // Vehicle speed (mph)
  "01_05": { warnLow: 165, warnHigh: 235 },// Coolant °F
  "TCM_LINE": { warnLow: 60, warnHigh: 260 } // Line pressure psi
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as Body;
  const findings: string[] = [];

  for (const pid of body.pids ?? []) {
    const rule = RULES[pid];
    const arr = (body.series?.[pid] ?? []).slice(-60); // last minute
    if (!rule || arr.length < 3) continue;

    const last = arr[arr.length - 1].v;

    const outOfBand =
      (rule.warnLow  != null && last < rule.warnLow) ||
      (rule.warnHigh != null && last > rule.warnHigh);

    if (outOfBand) {
      findings.push(
        `${pid} outside threshold. Latest ${last}. Limits: ${rule.warnLow ?? "-"}–${rule.warnHigh ?? "-"}`
      );
    }

    const first = arr[0].v;
    // crude trend check
    if (Math.abs(last - first) > 0.25 * (rule.warnHigh ?? Math.max(last, 1))) {
      findings.push(`${pid} rapid change over 60s`);
    }
  }

  res.status(200).json({
    summary: findings.length
      ? findings.join("\n")
      : "No obvious out-of-parameter behavior in the current view.",
    findings
  });
}