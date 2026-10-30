export const JOURNAL_KEY = 'alive-practice.journal.v1';
export const DRAFT_KEY = 'alive-practice.drafts.v1';
export const PREFERENCES_KEY = 'alive-practice.preferences.v1';
const MAX_SIZE = 10 * 1024 * 1024;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const safeKey = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value) && !['__proto__', 'prototype', 'constructor'].includes(value);

export function newEntryId(cryptoProvider = globalThis.crypto) {
  if (typeof cryptoProvider?.randomUUID === 'function') return cryptoProvider.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof cryptoProvider?.getRandomValues === 'function') cryptoProvider.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return `entry-${Date.now().toString(36)}-${Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

export function validateEntry(entry) {
  if (!isObject(entry) || !safeKey(entry.id) || !safeKey(entry.practiceId) || !isObject(entry.answers)) throw new Error('This file contains an invalid journal entry.');
  if (![entry.createdAt, entry.updatedAt].every(date => typeof date === 'string' && Number.isFinite(Date.parse(date)))) throw new Error('A journal entry has an invalid date.');
  const answers = {};
  const fields = Object.entries(entry.answers);
  if (!fields.length || fields.length > 30) throw new Error('A journal entry has an invalid set of answers.');
  for (const [key, value] of fields) {
    if (!safeKey(key) || typeof value !== 'string' || value.length > 24000) throw new Error('A journal answer is invalid or too long.');
    answers[key] = value;
  }
  return { id: entry.id, practiceId: entry.practiceId, answers, createdAt: entry.createdAt, updatedAt: entry.updatedAt };
}

export function decodeJournal(raw) {
  if (raw === null || raw === undefined) return [];
  if (typeof raw !== 'string' || raw.length > MAX_SIZE) throw new Error('The journal file is too large.');
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new Error('The journal could not be read. Your existing data has not been changed.'); }
  if (!isObject(parsed) || parsed.version !== 1 || !Array.isArray(parsed.entries) || parsed.entries.length > 5000) throw new Error('Choose an Alive Practice journal export (version 1).');
  const entries = parsed.entries.map(validateEntry);
  if (new Set(entries.map(entry => entry.id)).size !== entries.length) throw new Error('This journal contains duplicate entry IDs.');
  return entries;
}

export function encodeJournal(entries) {
  if (!Array.isArray(entries) || entries.length > 5000) throw new Error('The journal has reached its entry limit. Export a copy before removing older entries.');
  if (new Set(entries.map(entry => entry.id)).size !== entries.length) throw new Error('The journal contains duplicate entry IDs.');
  const raw = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), entries: entries.map(validateEntry) }, null, 2);
  if (raw.length > MAX_SIZE) throw new Error('The journal is too large to save. Export a copy before removing older entries.');
  return raw;
}

export function mergeEntries(existing, imported) {
  const map = new Map(existing.map(entry => [entry.id, validateEntry(entry)]));
  for (const item of imported) {
    const next = validateEntry(item);
    const current = map.get(next.id);
    if (!current || Date.parse(next.updatedAt) > Date.parse(current.updatedAt)) map.set(next.id, next);
  }
  if (map.size > 5000) throw new Error('This import would exceed the journal limit. Your existing entries have not been changed.');
  return [...map.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function createStore(storage) {
  return {
    loadJournal() {
      try { return { ok: true, entries: decodeJournal(storage.getItem(JOURNAL_KEY)) }; }
      catch (error) { return { ok: false, entries: [], error: error.message }; }
    },
    saveJournal(entries) {
      try { storage.setItem(JOURNAL_KEY, encodeJournal(entries)); return { ok: true }; }
      catch (error) { return { ok: false, error: error.name === 'QuotaExceededError' ? 'This browser is out of storage. Export your writing before removing older entries.' : 'Your changes could not be saved in this browser. Keep this page open and export your writing.' }; }
    },
    read(key, fallback) {
      try { return JSON.parse(storage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    write(key, value) {
      try { storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
    },
    raw(key) { try { return storage.getItem(key); } catch { return null; } },
    remove(key) { try { storage.removeItem(key); return true; } catch { return false; } }
  };
}
