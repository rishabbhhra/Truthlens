// Sample cases with proper PNG-compatible base64 format hint.
// The backend gracefully generates a forensic canvas when no real image is uploaded.

export const SAMPLE_CASES = [
  {
    id: "sample-1",
    tag: "Medical Misinformation",
    tagColor: "red",
    title: "Vaccine Magnetism Claim",
    headline:
      "The COVID-19 vaccine causes magnetic powers in people and metals stick to the injection site on the arm.",
    description:
      "A viral claim pairing an injection-site photo with fabricated assertions of induced human magnetism post-vaccination. Refuted by CDC, WHO, and Reuters Fact Check.",
    expectedVerdict: "False / Mostly False",
    defaultWeights: { alpha_cls: 1.0, beta_cons: 0.6, gamma_evid: 0.5 },
    image_base64: null, // backend generates a distinctive forensic canvas
  },
  {
    id: "sample-2",
    tag: "Out-of-Context Media",
    tagColor: "amber",
    title: "Recycled Balkan Flood Footage",
    headline:
      "Catastrophic flooding devastates European capital today as emergency rescue teams scramble to evacuate thousands.",
    description:
      "Authentic archive footage from the 2014 Balkan floods recycled with a false timestamp, asserting current-day European disaster to trigger panic and misattribute climate events.",
    expectedVerdict: "Misleading",
    defaultWeights: { alpha_cls: 1.0, beta_cons: 0.8, gamma_evid: 0.5 },
    image_base64: null,
  },
  {
    id: "sample-3",
    tag: "AI-Generated Deepfake",
    tagColor: "purple",
    title: "Synthetic Politician Speech",
    headline:
      "Leaked broadcast: World leader admits secret alien technology program and cover-up spanning five decades.",
    description:
      "Generative AI synthetic video with diffusion warping artifacts and neural lip-sync manipulation. CLIP-Vision patch attention reveals GAN frequency artifacts.",
    expectedVerdict: "False / Mostly False",
    defaultWeights: { alpha_cls: 1.0, beta_cons: 0.9, gamma_evid: 0.4 },
    image_base64: null,
  },
  {
    id: "sample-4",
    tag: "Verified Factual",
    tagColor: "emerald",
    title: "NASA Artemis 1 Launch",
    headline:
      "NASA Artemis 1 rocket successfully launches from Kennedy Space Center on a trajectory toward lunar orbit.",
    description:
      "Multi-agency corroborated space launch event with matching official telemetry data, live broadcast timestamps, and convergent authoritative evidence passages.",
    expectedVerdict: "True / Mostly True",
    defaultWeights: { alpha_cls: 1.0, beta_cons: 0.5, gamma_evid: 0.4 },
    image_base64: null,
  },
];
