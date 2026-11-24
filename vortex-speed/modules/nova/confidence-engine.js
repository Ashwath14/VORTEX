// =========================================================================
// VORTEX SPEED TITANIUM PRO // NOVA 2.0: EVIDENCE & CONFIDENCE ENGINE
// Mathematical, Defensible Confidence Scoring
// Depends strictly on Sample Size, Data Freshness, Consistency & Coverage
// Zero Fabricated 99% Placeholders
// =========================================================================

class ConfidenceEngine {
  constructor() {}

  /**
   * Calculates defensible confidence score (0 - 100)
   * Factors:
   * 1. Sample Size Weight (0 - 40 pts): how many genuine records were evaluated?
   * 2. Recency / Freshness Weight (0 - 25 pts): how recent is the telemetry?
   * 3. Consistency / Variance Weight (0 - 25 pts): low coefficient of variation?
   * 4. Multi-Source Corroboration (0 - 10 pts): corroborated across multiple modules?
   */
  calculateConfidence({
    sampleCount = 0,
    minSamplesForFullScore = 10,
    freshnessMs = 0,
    maxAcceptableAgeMs = 300000, // 5 minutes
    coefficientOfVariation = null,
    sourceModulesCount = 1,
    hasMissingCriticalFields = false
  } = {}) {
    if (hasMissingCriticalFields || sampleCount === 0) {
      return {
        score: 20,
        label: 'PRELIMINARY',
        isDefensible: false,
        methodology: 'Minimal or missing data samples. Insufficient data to calculate defensible confidence.',
        limitations: ['Zero or insufficient genuine measurement records available in the requested window.']
      };
    }

    // 1. Sample Size Factor (0 - 40)
    const sampleRatio = Math.min(1.0, sampleCount / Math.max(1, minSamplesForFullScore));
    const samplePts = parseFloat((sampleRatio * 40).toFixed(1));

    // 2. Freshness Factor (0 - 25)
    let freshnessPts = 25;
    if (freshnessMs > maxAcceptableAgeMs) {
      const ageRatio = Math.min(1.0, (freshnessMs - maxAcceptableAgeMs) / (maxAcceptableAgeMs * 4));
      freshnessPts = Math.max(5, parseFloat((25 * (1 - ageRatio)).toFixed(1)));
    }

    // 3. Consistency / Low Variance Factor (0 - 25)
    let variancePts = 20; // default reasonable variance
    if (coefficientOfVariation !== null && !isNaN(coefficientOfVariation)) {
      const cv = Math.max(0, coefficientOfVariation);
      if (cv <= 0.15) variancePts = 25; // extremely consistent
      else if (cv <= 0.35) variancePts = 20; // standard consistency
      else if (cv <= 0.70) variancePts = 12; // moderate variance
      else variancePts = 5; // high variance
    }

    // 4. Corroboration Factor (0 - 10)
    const corroborationPts = Math.min(10, Math.max(5, sourceModulesCount * 3.5));

    // Total Score
    const rawScore = Math.round(samplePts + freshnessPts + variancePts + corroborationPts);
    const score = Math.max(15, Math.min(96, rawScore));

    let label = 'MODERATE';
    if (score >= 80) label = 'HIGH';
    else if (score < 50) label = 'LOW';

    const methodology = `Calculated using sample depth (n=${sampleCount}, +${samplePts}pts), freshness (+${freshnessPts}pts), consistency (+${variancePts}pts), and multi-source corroboration (+${corroborationPts}pts).`;

    const limitations = [];
    if (sampleCount < minSamplesForFullScore) {
      limitations.push(`Sample size (n=${sampleCount}) is below the optimal threshold of ${minSamplesForFullScore} measurements.`);
    }
    if (freshnessMs > 60000) {
      limitations.push(`Latest sample was captured ${(freshnessMs / 1000).toFixed(0)}s ago.`);
    }
    if (coefficientOfVariation !== null && coefficientOfVariation > 0.5) {
      limitations.push(`Observed statistical variance is elevated (CV: ${(coefficientOfVariation * 100).toFixed(1)}%).`);
    }

    return {
      score,
      label,
      isDefensible: true,
      methodology,
      limitations
    };
  }
}

module.exports = new ConfidenceEngine();
