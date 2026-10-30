import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, JOURNAL_KEY, decodeJournal, encodeJournal, mergeEntries, validateEntry, newEntryId } from '../public/storage.js';
import { practices } from '../public/content.js';

const entry = (id = 'entry-1', action = 'Make room for a real conversation.') => ({ id, practiceId: 'before-the-machine', answers: { first: 'I want to say this honestly.', action }, createdAt: '2026-10-30T12:00:00.000Z', updatedAt: '2026-10-30T12:00:00.000Z' });
function memoryStorage(seed = {}) { const values = new Map(Object.entries(seed)); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; }

test('journal export and restoration preserve Unicode, line breaks, and literal markup', () => {
  const original = [entry('one', 'Ninachagua utulivu.\n<hello> & “my voice” 🌱')];
  assert.deepEqual(decodeJournal(encodeJournal(original)), original);
});
test('a new browser starts with an empty journal', () => {
  assert.deepEqual(createStore(memoryStorage()).loadJournal(), { ok: true, entries: [] });
});
test('journal saving also works when randomUUID is unavailable on an HTTP preview', () => {
  const provider = { getRandomValues: bytes => bytes.fill(7) };
  assert.match(newEntryId(provider), /^entry-[a-z0-9]+-[0-9a-f]{32}$/);
  assert.doesNotThrow(() => validateEntry(entry(newEntryId(provider))));
});
test('corrupted stored writing is preserved for recovery', () => {
  const storage = memoryStorage({ [JOURNAL_KEY]: '{not valid JSON' });
  const loaded = createStore(storage).loadJournal();
  assert.equal(loaded.ok, false);
  assert.equal(storage.getItem(JOURNAL_KEY), '{not valid JSON');
});
test('a storage quota failure is reported and leaves the old journal intact', () => {
  const original = encodeJournal([entry()]);
  const storage = { getItem: () => original, setItem: () => { const error = new Error('Full'); error.name = 'QuotaExceededError'; throw error; } };
  const result = createStore(storage).saveJournal([entry('two')]);
  assert.equal(result.ok, false);
  assert.match(result.error, /out of storage/);
  assert.deepEqual(decodeJournal(storage.getItem()), [entry()]);
});
test('reimporting a backup does not duplicate or replace newer writing', () => {
  const newer = { ...entry(), answers: { action: 'A newer reflection.' }, updatedAt: '2026-10-31T12:00:00.000Z' };
  assert.deepEqual(mergeEntries([newer], [entry(), entry('entry-2')]), [newer, entry('entry-2')]);
  assert.deepEqual(mergeEntries([entry()], [newer]), [newer]);
});
test('malformed imports, unsupported formats, invalid dates, and duplicate IDs are rejected', () => {
  assert.throws(() => decodeJournal(JSON.stringify({ version: 2, entries: [] })));
  assert.throws(() => decodeJournal(JSON.stringify({ version: 1, entries: [entry(), entry()] })));
  assert.throws(() => validateEntry({ ...entry(), createdAt: 'never' }));
  assert.throws(() => validateEntry({ ...entry(), id: '../invalid' }));
  assert.throws(() => validateEntry({ ...entry(), answers: { action: { html: 'not text' } } }));
  assert.throws(() => encodeJournal([entry(), entry()]));
});
test('prototype keys and oversized fields cannot be imported', () => {
  assert.throws(() => validateEntry({ ...entry(), answers: JSON.parse('{"__proto__":"pollution"}') }));
  assert.throws(() => validateEntry(entry('too-long', 'a'.repeat(24001))));
});
test('all eight practices have a real sequence and correspond to one book chapter', () => {
  assert.equal(practices.length, 8);
  assert.equal(new Set(practices.map(practice => practice.id)).size, 8);
  for (const [index, practice] of practices.entries()) {
    assert.equal(practice.chapter, index + 1);
    assert.ok(practice.steps.length >= 3);
    assert.equal(practice.steps.at(-1).key, 'action');
  }
});
