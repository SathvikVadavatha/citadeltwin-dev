import { describe, expect, it } from 'vitest';
import { checkResponseForLeaks } from './outputGuard';

// No knowledge entry currently quotes a real measurement or code citation,
// so an empty supplied-context string is representative of every real call.
const NO_CONTEXT = '';

describe('checkResponseForLeaks', () => {
  it('blocks a measurement-with-unit tied to a code citation', () => {
    const result = checkResponseForLeaks('Corridors must be at least 44 in wide per IBC 1020.3', NO_CONTEXT);
    expect(result.blocked).toBe(true);
  });

  it('blocks a bare construction-unit measurement', () => {
    const result = checkResponseForLeaks('Ground snow load is 20 psf', NO_CONTEXT);
    expect(result.blocked).toBe(true);
  });

  it('allows a file-size figure', () => {
    const result = checkResponseForLeaks('You have 2 blueprints, 550 KB each', NO_CONTEXT);
    expect(result.blocked).toBe(false);
  });

  it('allows a duration estimate', () => {
    const result = checkResponseForLeaks('Generation takes about 60 seconds', NO_CONTEXT);
    expect(result.blocked).toBe(false);
  });

  it('allows "in" used as the preposition, not the inch unit', () => {
    const result = checkResponseForLeaks('Check back in the meantime', NO_CONTEXT);
    expect(result.blocked).toBe(false);
  });

  it('flags the specific measurement and citation substrings, not the whole sentence', () => {
    const result = checkResponseForLeaks('Corridors must be at least 44 in wide per IBC 1020.3', NO_CONTEXT);
    expect(result.flagged).toEqual(expect.arrayContaining([expect.stringContaining('44 in'), expect.stringContaining('IBC 1020.3')]));
  });

  it('allows a measurement that is verbatim in the supplied context (grounded, not hallucinated)', () => {
    const context = 'req_federal_rules: ADA 403.5.1 requires a minimum clear width of 44 in for accessible routes.';
    const result = checkResponseForLeaks('Per the federal rule on file, the minimum clear width is 44 in (ADA 403.5.1).', context);
    expect(result.blocked).toBe(false);
  });
});
