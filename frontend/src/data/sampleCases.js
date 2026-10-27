export const SAMPLE_CASES = [
  {
    id: "sample-1",
    tag: "Medical / Vaccine Rumor",
    badgeColor: "red",
    title: "Vaccine Magnetism Claim",
    headline: "The COVID-19 vaccine causes magnetic powers in people and metals stick to the arm.",
    description: "Multimodal claim pairing an injection photo with a claim of induced human magnetism.",
    expectedVerdict: "False / Mostly False",
    defaultWeights: { alpha_cls: 1.0, beta_cons: 0.6, gamma_evid: 0.4 },
    // SVG base64 preview for demo visual forensics
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="224" height="224" viewBox="0 0 224 224"><rect width="224" height="224" fill="%231e293b"/><circle cx="112" cy="90" r="45" fill="%236366f1" opacity="0.8"/><rect x="80" y="145" width="64" height="20" rx="6" fill="%23ef4444"/><text x="112" y="195" font-family="sans-serif" font-size="12" fill="%2394a3b8" text-anchor="middle">COVID-19 VACCINE TEST</text><path d="M112 50 L112 130 M90 85 L134 85" stroke="%23ffffff" stroke-width="4"/></svg>`
  },
  {
    id: "sample-2",
    tag: "Out-of-Context Media",
    badgeColor: "amber",
    title: "Recycled Historic Flood",
    headline: "Catastrophic flooding hits Europe today as emergency rescue teams scramble.",
    description: "Real archive footage from the 2014 Balkan floods recycled with false claims asserting it is current day.",
    expectedVerdict: "Misleading",
    defaultWeights: { alpha_cls: 1.0, beta_cons: 0.7, gamma_evid: 0.5 },
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="224" height="224" viewBox="0 0 224 224"><rect width="224" height="224" fill="%230f172a"/><path d="M0 140 Q 56 120, 112 140 T 224 140 L 224 224 L 0 224 Z" fill="%230284c7"/><path d="M0 165 Q 56 150, 112 165 T 224 165 L 224 224 L 0 224 Z" fill="%230369a1"/><rect x="70" y="70" width="84" height="60" fill="%23475569"/><polygon points="60,70 112,30 164,70" fill="%23dc2626"/><text x="112" y="205" font-family="sans-serif" font-size="11" fill="%23bae6fd" text-anchor="middle">ARCHIVE FLOOD FOOTAGE</text></svg>`
  },
  {
    id: "sample-3",
    tag: "AI Diffusion Deepfake",
    badgeColor: "purple",
    title: "Synthetic Politician Speech",
    headline: "Leaked confidential broadcast: World leader admits covert alien technology program.",
    description: "Generative AI synthetic video with diffusion warping and lip sync artifacts.",
    expectedVerdict: "False / Mostly False",
    defaultWeights: { alpha_cls: 1.0, beta_cons: 0.8, gamma_evid: 0.4 },
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="224" height="224" viewBox="0 0 224 224"><rect width="224" height="224" fill="%2318181b"/><circle cx="112" cy="85" r="38" fill="%23a855f7" opacity="0.6"/><rect x="72" y="130" width="80" height="50" rx="8" fill="%233b82f6" opacity="0.7"/><circle cx="100" cy="80" r="5" fill="%23ffffff"/><circle cx="124" cy="80" r="5" fill="%23ffffff"/><text x="112" y="205" font-family="monospace" font-size="11" fill="%23d8b4fe" text-anchor="middle">SYNTHETIC ARTIFACT DETECTED</text></svg>`
  },
  {
    id: "sample-4",
    tag: "Factually Verified",
    badgeColor: "emerald",
    title: "NASA Artemis 1 Launch",
    headline: "NASA Artemis 1 rocket launches successfully from Kennedy Space Center toward lunar orbit.",
    description: "Authentic multi-agency verified space launch with matching telemetry and official evidence.",
    expectedVerdict: "True / Mostly True",
    defaultWeights: { alpha_cls: 1.0, beta_cons: 0.5, gamma_evid: 0.4 },
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="224" height="224" viewBox="0 0 224 224"><rect width="224" height="224" fill="%23020617"/><circle cx="180" cy="40" r="16" fill="%23f1f5f9"/><polygon points="112,40 102,150 122,150" fill="%23e2e8f0"/><polygon points="95,150 112,190 129,150" fill="%23f97316"/><polygon points="102,150 112,180 122,150" fill="%23fde047"/><text x="112" y="210" font-family="sans-serif" font-size="11" fill="%2338bdf8" text-anchor="middle">VERIFIED NASA ARCHIVE</text></svg>`
  }
];
