/**
 * Cloudflare Workers AI list prices for the two models this PoC allows.
 *
 * Source: https://developers.cloudflare.com/workers-ai/platform/pricing/
 * (page last updated 2026-10-20). Workers AI bills neurons.
 * $0.011 per 1,000 neurons. The free 10,000 neurons/day are NOT subtracted:
 * costUsd is the list price of the reported tokens.
 *
 * Formula:
 *   neurons = prompt_tokens / 1e6 * inputNeuronsPerMillion
 *           + completion_tokens / 1e6 * outputNeuronsPerMillion
 *   costUsd = neurons / 1000 * 0.011
 *
 * The published "$ per M tokens" column is that formula rounded. This file
 * uses the neuron rates so the browser can recompute from usage.
 *
 * | model                                        | $ / M in | $ / M out | neurons / M in | neurons / M out |
 * |----------------------------------------------|----------|-----------|----------------|-----------------|
 * | @cf/meta/llama-3.3-70b-instruct-fp8-fast     | 0.293    | 2.253     | 26668          | 204805          |
 * | @cf/meta/llama-3.1-8b-instruct-fp8-fast      | 0.045    | 0.384     | 4119           | 34868           |
 *
 * The demo build copies this module into the browser. The worker response
 * carries tokens only. The browser calls costUsd().
 */

export const USD_PER_THOUSAND_NEURONS = 0.011;

export const DEFAULT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

export const FAST_MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8-fast';

export const MODELS = {
  [DEFAULT_MODEL]: {
    label: 'Llama 3.3 70B fp8-fast',
    inputNeuronsPerMillion: 26668,
    outputNeuronsPerMillion: 204805,
    inputUsdPerMillion: 0.293,
    outputUsdPerMillion: 2.253,
  },
  [FAST_MODEL]: {
    label: 'Llama 3.1 8B fp8-fast',
    inputNeuronsPerMillion: 4119,
    outputNeuronsPerMillion: 34868,
    inputUsdPerMillion: 0.045,
    outputUsdPerMillion: 0.384,
  },
};

const ALIASES = {
  '70b': DEFAULT_MODEL,
  fast: FAST_MODEL,
  '8b': FAST_MODEL,
};

/**
 * @param {string|undefined|null} requested A model id or a short alias.
 * @returns {string|null} The allowlisted id, the default when omitted, or null.
 */
export function resolveModel(requested) {
  if (requested == null || requested === '') {
    return DEFAULT_MODEL;
  }

  if (Object.prototype.hasOwnProperty.call(MODELS, requested)) {
    return requested;
  }

  return ALIASES[requested] || null;
}

/**
 * List-price USD for one model call. Null when the model is not priced or
 * the call did not report token counts. Never invents a zero for missing usage.
 *
 * @param {string} model Allowlisted model id.
 * @param {{ prompt_tokens: number, completion_tokens: number }|null|undefined} usage
 * @returns {number|null}
 */
export function costUsd(model, usage) {
  const rate = MODELS[model];

  if (!rate || !usage) {
    return null;
  }

  const neurons = (usage.prompt_tokens / 1e6) * rate.inputNeuronsPerMillion
    + (usage.completion_tokens / 1e6) * rate.outputNeuronsPerMillion;

  return (neurons / 1000) * USD_PER_THOUSAND_NEURONS;
}
