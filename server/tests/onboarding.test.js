const mongoose = require('mongoose');
const Verification = require('../src/models/Verification');
const Application = require('../src/models/Application');

describe('Verification codes', () => {
  test('generated codes are six digits', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(Verification.generateCode()).toMatch(/^\d{6}$/);
    }
  });

  test('the same code always hashes identically, different codes do not collide', () => {
    expect(Verification.hashCode('123456')).toBe(Verification.hashCode('123456'));
    expect(Verification.hashCode('123456')).not.toBe(Verification.hashCode('123457'));
  });

  test('the plain code is never what gets stored', () => {
    const hash = Verification.hashCode('654321');
    expect(hash).not.toContain('654321');
    expect(hash).toHaveLength(64); // sha-256 hex
  });

  test('a fresh record is usable, an expired one is not', () => {
    const doc = new Verification({
      email: 'a@b.om',
      codeHash: Verification.hashCode('111111'),
      expiresAt: new Date(Date.now() + 60_000)
    });
    expect(doc.isUsable()).toBe(true);

    doc.expiresAt = new Date(Date.now() - 1000);
    expect(doc.isUsable()).toBe(false);
  });

  test('a consumed record cannot be reused', () => {
    const doc = new Verification({
      email: 'a@b.om',
      codeHash: Verification.hashCode('111111'),
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: new Date()
    });
    expect(doc.isUsable()).toBe(false);
  });

  test('a record is spent once the attempt cap is reached', () => {
    const doc = new Verification({
      email: 'a@b.om',
      codeHash: Verification.hashCode('111111'),
      expiresAt: new Date(Date.now() + 60_000),
      attempts: Verification.maxAttempts
    });
    expect(doc.isUsable()).toBe(false);
  });

  test('matching is exact', () => {
    const doc = new Verification({
      email: 'a@b.om',
      codeHash: Verification.hashCode('424242'),
      expiresAt: new Date(Date.now() + 60_000)
    });
    expect(doc.matches('424242')).toBe(true);
    expect(doc.matches('424243')).toBe(false);
    expect(doc.matches('')).toBe(false);
  });
});

describe('Application lifecycle', () => {
  test('a bid starts as a draft, before it is a commitment', () => {
    // A bid is long — files, a bill of quantities, pricing — so it can be
    // saved half-finished. Submitting is the act that commits to it.
    expect(Application.STATUSES[0]).toBe('draft');
  });

  test('a draft may be submitted or abandoned, and nothing else', () => {
    expect(Application.canTransition('draft', 'submitted')).toBe(true);
    expect(Application.canTransition('draft', 'withdrawn')).toBe(true);
    // A draft the buyer has never seen cannot be shortlisted or accepted.
    for (const target of ['under_review', 'shortlisted', 'accepted', 'rejected']) {
      expect(Application.canTransition('draft', target)).toBe(false);
    }
  });

  test('and nothing falls back into draft once submitted', () => {
    for (const from of Application.STATUSES.filter((x) => x !== 'draft')) {
      expect(Application.canTransition(from, 'draft')).toBe(false);
    }
  });

  test('permitted moves follow the documented lifecycle', () => {
    expect(Application.canTransition('submitted', 'under_review')).toBe(true);
    expect(Application.canTransition('under_review', 'shortlisted')).toBe(true);
    expect(Application.canTransition('shortlisted', 'accepted')).toBe(true);
  });

  test('an application cannot skip review and jump straight to accepted', () => {
    expect(Application.canTransition('submitted', 'accepted')).toBe(false);
  });

  test('decided and withdrawn applications are terminal', () => {
    for (const terminal of ['accepted', 'rejected', 'withdrawn']) {
      for (const target of Application.STATUSES) {
        expect(Application.canTransition(terminal, target)).toBe(false);
      }
    }
  });

  test('an unknown status is never transitionable', () => {
    expect(Application.canTransition('not_a_status', 'accepted')).toBe(false);
    expect(Application.canTransition('submitted', 'not_a_status')).toBe(false);
  });

  test('withdrawal is reachable from every live state', () => {
    for (const live of ['submitted', 'under_review', 'shortlisted']) {
      expect(Application.canTransition(live, 'withdrawn')).toBe(true);
    }
  });
});

afterAll(async () => {
  await mongoose.disconnect().catch(() => {});
});
