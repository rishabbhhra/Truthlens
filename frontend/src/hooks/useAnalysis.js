/**
 * useAnalysis.js — core hook for calling /api/v1/analyze-json
 * Handles loading state, error parsing, and response normalisation.
 */
import { useState } from 'react';

export function useAnalysis() {
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const run = async ({ text, image_base64, sample_id, weights }) => {
    if (!text?.trim()) {
      setError('Please enter a claim or headline to analyse.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body = {
        text: text.trim(),
        image_base64: image_base64 || null,
        sample_id: sample_id || null,
        alpha_cls:  weights?.alpha_cls  ?? 1.0,
        beta_cons:  weights?.beta_cons  ?? 0.6,
        gamma_evid: weights?.gamma_evid ?? 0.4,
      };

      const res = await fetch('/api/v1/analyze-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Analysis failed. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, run };
}
