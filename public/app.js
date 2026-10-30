import { domains, practices, chapterPreviews, helpOptions } from './content.js';
import { createStore, JOURNAL_KEY, DRAFT_KEY, PREFERENCES_KEY, decodeJournal, encodeJournal, mergeEntries, newEntryId } from './storage.js';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
let browserStorage;
try { browserStorage = window.localStorage; } catch { browserStorage = { getItem() { throw new Error('Browser storage is unavailable.'); }, setItem() { throw new Error('Browser storage is unavailable.'); }, removeItem() { throw new Error('Browser storage is unavailable.'); } }; }
const store = createStore(browserStorage);
const loaded = store.loadJournal();
const savedPreferences = store.read(PREFERENCES_KEY, {});
const preferences = {
  theme: ['system', 'light', 'dark'].includes(savedPreferences?.theme) ? savedPreferences.theme : 'system',
  atmosphere: ['grounded', 'dawn', 'dusk'].includes(savedPreferences?.atmosphere) ? savedPreferences.atmosphere : 'grounded',
  motion: savedPreferences?.motion !== false
};
const state = { entries: loaded.entries, storageOk: loaded.ok, storageError: loaded.error, draft: null, query: '', journalDomain: 'all', lastSaved: null, editing: null, formError: '' };
let toastTimer;
let audioContext;
let audioNode;
let audioGain;
let soundOn = false;
let confirmAction;
let dialogTrigger;

const iconPaths = {
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>', back: '<path d="M19 12H5m5-5-5 5 5 5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>', check: '<path d="m5 12 4 4L19 6"/>',
  thought: '<path d="M8 19h8M9 22h6M8 15c-2-1-3-3-3-6a7 7 0 0 1 14 0c0 3-1 5-3 6v1H8Z"/><path d="M12 6v5m-2-2h4"/>',
  focus: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3"/>',
  connection: '<path d="M12 20s-9-5.6-9-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.4-9 11-9 11Z"/>',
  body: '<circle cx="12" cy="4" r="2"/><path d="m4 9 8 2 8-2m-8 2v5m0-3-5 8m5-8 5 8"/>',
  spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--bg)"/><circle cx="15" cy="17" r="3" fill="var(--bg)"/>',
  sound: '<path d="M3 10v4h4l5 4V6l-5 4Zm13-2a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  quiet: '<path d="M3 10v4h4l5 4V6l-5 4Zm13 0 5 5m0-5-5 5"/>',
  journal: '<path d="M5 3h14v18H5Zm-2 4h4m-4 5h4m-4 5h4m3-9h6m-6 4h6"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.spark}</svg>`;
const getPractice = id => practices.find(practice => practice.id === id);
const getDomain = id => domains.find(domain => domain.id === id);
const prettyDate = date => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const labelMap = { context: 'What I brought', first: 'My first thoughts', intent: 'The help I chose', boundary: 'What stays mine', assisted: 'The response I considered', reflection: 'What I noticed', action: 'My next step' };
function answerLabel(practice, key) { return labelMap[key] || practice.steps.find(step => step.key === key)?.title || key; }

function field(key, label, placeholder = '', options = {}) {
  const value = options.value ?? state.draft?.answers[key] ?? '';
  return `<label class="field"><span class="field-label">${esc(label)}${options.optional ? ' <small>optional</small>' : ''}</span><textarea name="${esc(key)}" maxlength="24000" class="${options.small ? 'textarea-small' : options.large ? 'textarea-large' : ''}" placeholder="${esc(placeholder)}" ${options.optional ? '' : 'required'}>${esc(value)}</textarea>${options.help ? `<span class="field-help">${esc(options.help)}</span>` : ''}</label>`;
}
function graphic() {
  const paths = Array.from({ length: 17 }, (_, i) => {
    const r = 15 + i * 6.5;
    const points = Array.from({ length: 91 }, (_, n) => {
      const angle = n / 90 * Math.PI * 2;
      const radius = r + Math.sin(angle * 3 + i * .15) * 7 + Math.cos(angle * 2) * 5;
      return `${n ? 'L' : 'M'}${(155 + Math.cos(angle) * radius).toFixed(2)},${(120 + Math.sin(angle) * radius * .72).toFixed(2)}`;
    }).join(' ');
    return `<path d="${points}Z" fill="none" stroke-width=".6" opacity="${(.2 + i * .035).toFixed(2)}"/>`;
  }).join('');
  return `<svg viewBox="0 0 310 240" aria-hidden="true">${paths}</svg>`;
}

function home() {
  const practice = practices[0];
  const draft = readDraft(practice.id);
  return `<section class="hero" aria-labelledby="home-title">
    <div class="hero-copy"><p class="eyebrow"><span class="seed"></span>A little room to be human</p><h1 id="home-title">Make room<br>for being<br><em>human.</em></h1><p class="hero-description">Small practices for a considered life in the age of AI.</p><a class="text-link" href="#explore/all">Find your practice ${icon('arrow')}</a></div>
    <article class="feature-card"><div class="feature-top"><span>A place to begin</span><span>${practice.duration}</span></div><div class="feature-art">${graphic()}</div><div class="feature-body"><h2>Before you ask<br>the machine</h2><p>Begin with your own thinking. Then choose the help you actually want.</p><div class="feature-bottom"><button class="button button-light" data-start="${practice.id}">${draft ? 'Continue practice' : 'Begin practice'} ${icon('arrow')}</button><span>Thinking · 01</span></div></div></article>
    </section><section class="paths" aria-labelledby="paths-title"><div class="section-heading"><h2 id="paths-title">What needs a little space today?</h2><a class="text-link" href="#explore/all">All practices ${icon('arrow')}</a></div><ul class="domain-list">${domains.map(domain => `<li><a class="domain-link" href="#explore/${domain.id}">${icon(domain.icon)}<span class="domain-text"><strong>${domain.title}</strong><small>${domain.description}</small></span></a></li>`).join('')}</ul></section>`;
}

function explore(filter = 'all') {
  const domain = getDomain(filter);
  const selected = domain ? practices.filter(practice => practice.domain === domain.id) : practices;
  return `<a class="back-link" href="#home">${icon('back')} Back to your space</a><section><div class="page-heading"><div><p class="eyebrow">A question. A reflection. A way to live it.</p><h1>${domain ? domain.invitation : 'Choose a place to begin.'}</h1><p>Follow what feels useful today. There is no order to get right.</p></div></div><nav class="filter-row" aria-label="Practice areas"><a href="#explore/all" aria-current="${!domain}">All practices</a>${domains.map(item => `<a href="#explore/${item.id}" aria-current="${filter === item.id}">${item.title}</a>`).join('')}</nav><ul class="practice-list">${selected.map(practice => `<li><a class="practice-row" href="#practice/${practice.id}">${icon(getDomain(practice.domain).icon)}<div><h2>${esc(practice.title)}</h2><p>${esc(practice.description)}</p></div><div class="practice-meta"><span>${getDomain(practice.domain).title}</span><span>${practice.duration}</span></div>${icon('arrow')}</a></li>`).join('')}</ul></section>`;
}

function readDraft(id) {
  const drafts = store.read(DRAFT_KEY, {});
  const item = drafts && typeof drafts === 'object' && !Array.isArray(drafts) ? drafts[id] : null;
  if (!item || typeof item !== 'object' || !item.answers || typeof item.answers !== 'object' || Array.isArray(item.answers)) return null;
  const answers = {};
  for (const [key, value] of Object.entries(item.answers)) if (/^[a-zA-Z0-9_-]{1,100}$/.test(key) && !['__proto__', 'constructor', 'prototype'].includes(key) && typeof value === 'string') answers[key] = value.slice(0, 24000);
  return { practiceId: id, step: Number.isInteger(item.step) ? item.step : 0, answers };
}
function persistDraft() {
  if (!state.draft) return;
  const current = store.read(DRAFT_KEY, {});
  const drafts = current && typeof current === 'object' && !Array.isArray(current) ? current : {};
  drafts[state.draft.practiceId] = state.draft;
  const ok = store.write(DRAFT_KEY, drafts);
  const indicator = $('#draft-status');
  if (indicator) indicator.textContent = ok ? 'Draft saved in this browser.' : 'Draft could not be saved. Keep this page open and copy your writing.';
}
function dropDraft(id) {
  const drafts = store.read(DRAFT_KEY, {});
  if (drafts && typeof drafts === 'object' && !Array.isArray(drafts)) { delete drafts[id]; store.write(DRAFT_KEY, drafts); }
}
function startPractice(id) {
  const practice = getPractice(id);
  if (!practice) return;
  const draft = readDraft(id);
  state.draft = draft || { practiceId: id, step: 0, answers: {} };
  state.formError = '';
  go(`practice/${id}/${Math.min(state.draft.step, practice.steps.length - 1)}`);
}
function requiredFields(practice, index) {
  const step = practice.steps[index];
  if (step.type === 'first') return ['context', 'first'];
  if (step.type === 'intent') return ['intent'];
  if (step.type === 'compare') return ['reflection'];
  return step.optional ? [] : [step.key];
}
function buildRequest() {
  const a = state.draft?.answers || {};
  const help = helpOptions.find(option => option.id === a.intent);
  return [`What I am working through:\n${a.context || ''}`, `My own first thoughts:\n${a.first || ''}`, `The help I want:\n${help?.request || 'Help me examine my thinking.'}`, a.boundary?.trim() ? `What I want to retain or decide myself:\n${a.boundary}` : '', 'Keep my agency and voice intact. Flag uncertainty and anything I should verify. I will make the final choice.'].filter(Boolean).join('\n\n');
}

function stepContent(practice, step) {
  const a = state.draft.answers;
  if (step.type === 'first') return `${field('context', 'What are you bringing?', 'A question, a decision, a conversation…', { small: true })}${field('first', 'What do you already think?', 'My first thoughts, in my own words…', { help: 'An unfinished thought is a valid place to start.' })}`;
  if (step.type === 'intent') return `<fieldset class="help-options"><legend>What would be useful?</legend>${helpOptions.map(option => `<label class="help-choice"><input type="radio" name="intent" value="${option.id}" ${a.intent === option.id ? 'checked' : ''} required><span><strong>${option.title}</strong><small>${option.description}</small></span></label>`).join('')}</fieldset>${field('boundary', 'What would you like to keep yours?', 'My voice, my final decision, the part I want to learn…', { optional: true, small: true })}<div class="prompt-box"><p>Want to explore this with an AI tool? Copy a request built from your thoughts. Choose what you share. Nothing is sent from here.</p><button type="button" class="text-button" data-action="copy-request">${icon('copy')} Copy my request</button></div>`;
  if (step.type === 'compare') return `<div class="first-thought"><strong>Your first thoughts</strong><p>${esc(a.first)}</p></div>${field('assisted', 'A response you considered', 'Paste an assisted response here, if you used one…', { optional: true, small: true })}${field('reflection', 'What do you notice now?', 'What became clearer? What felt unlike me? What do I want to keep, question, or change?', { large: true })}`;
  return field(step.key, 'Your reflection', step.placeholder, { optional: step.optional, large: true });
}

function exercise(id, rawStep) {
  const practice = getPractice(id);
  if (!practice) return notFound();
  if (!state.draft || state.draft.practiceId !== id) state.draft = readDraft(id) || { practiceId: id, step: 0, answers: {} };
  const requested = rawStep === undefined ? state.draft.step : Number(rawStep);
  const index = Math.max(0, Math.min(Number.isInteger(requested) ? requested : 0, practice.steps.length - 1));
  state.draft.step = index;
  const step = practice.steps[index];
  return `<section class="exercise-layout"><aside class="exercise-aside"><a class="back-link" href="#explore/${practice.domain}">${icon('back')} All ${getDomain(practice.domain).title.toLowerCase()} practices</a><h2>${esc(practice.title)}</h2><p>${esc(practice.principle)}</p><ol class="step-list">${practice.steps.map((item, i) => `<li ${i === index ? 'aria-current="step"' : ''}><span class="step-number">${i < index ? '✓' : i + 1}</span><span>${esc(item.title)}</span></li>`).join('')}</ol><p class="aside-note">Take your time. Your draft stays in this browser so you can return.</p></aside><div class="exercise-content"><div class="mobile-step" aria-hidden="true">${practice.steps.map((_, i) => `<span class="${i <= index ? 'complete' : ''}"></span>`).join('')}</div><p class="eyebrow">${getDomain(practice.domain).title} <span aria-hidden="true">/</span> Step ${index + 1} of ${practice.steps.length}</p><h1>${esc(step.title)}</h1><p class="exercise-description">${esc(step.description)}</p><form id="practice-form" novalidate><div class="form-error" role="alert" ${state.formError ? '' : 'hidden'}>${esc(state.formError)}</div>${stepContent(practice, step)}<div class="exercise-bottom"><button type="button" class="text-button" data-action="${index === 0 ? 'leave-practice' : 'previous-step'}">${icon('back')} ${index === 0 ? 'Save for later' : 'Back'}</button><button class="button" type="submit">${index === practice.steps.length - 1 ? 'Save to journal' : 'Continue'} ${icon(index === practice.steps.length - 1 ? 'check' : 'arrow')}</button></div><p class="save-state" id="draft-status" aria-live="polite">Your writing is kept on this device.</p></form></div></section>`;
}

function complete() {
  const entry = state.lastSaved;
  if (!entry) return home();
  return `<section class="completion"><div class="completion-mark">${icon('check')}</div><p class="eyebrow" style="justify-content:center">Saved to your journal</p><h1>Take a little of this<br>with you.</h1><p>Your next step, in your own words:</p><blockquote>${esc(entry.answers.action || entry.answers.agreement || 'Return to what matters to you.')}</blockquote><div class="button-row"><a class="button" href="#journal">Open your journal ${icon('arrow')}</a><a class="button button-secondary" href="#home">Back to your space</a></div><p class="save-state">Saved in this browser. Export a copy whenever you like.</p></section>`;
}

function journal() {
  return `<section><div class="page-heading"><div><p class="eyebrow">A record of returning</p><h1>Your journal.</h1><p>Your thoughts, in your own words. Stored in this browser.</p></div><button class="button button-secondary" data-action="privacy">${icon('download')} Export & data</button></div>${!state.storageOk ? `<div class="storage-error" role="alert">${esc(state.storageError)} <button class="text-button" data-action="privacy">Open data controls</button></div>` : ''}<div class="journal-toolbar"><label class="sr-only" for="journal-search">Search your journal</label><input type="search" id="journal-search" placeholder="Find a thought…" value="${esc(state.query)}"><label class="sr-only" for="journal-domain">Filter journal by area</label><select id="journal-domain"><option value="all">All areas</option>${domains.map(domain => `<option value="${domain.id}" ${state.journalDomain === domain.id ? 'selected' : ''}>${domain.title}</option>`).join('')}</select><span class="journal-count" id="journal-count"></span></div><div id="journal-results">${journalResults()}</div></section>`;
}
function journalResults() {
  const entries = state.entries.filter(entry => {
    const practice = getPractice(entry.practiceId);
    const matchesDomain = state.journalDomain === 'all' || practice?.domain === state.journalDomain;
    const text = `${practice?.title || ''} ${Object.values(entry.answers).join(' ')}`.toLowerCase();
    return matchesDomain && text.includes(state.query.trim().toLowerCase());
  }).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  if (!entries.length) return `<div class="empty-state">${icon('journal')}<h2>${state.entries.length ? 'A little more room to look.' : 'A space for your own words.'}</h2><p>${state.entries.length ? 'No entries match these filters. Try another word or area.' : 'Finish a practice and your reflections will be here, ready to return to.'}</p>${state.entries.length ? '<button class="button button-secondary" data-action="reset-search">Clear filters</button>' : '<a class="button" href="#explore/all">Find your first practice</a>'}</div>`;
  return `<ul class="journal-list">${entries.map(entry => {
    const practice = getPractice(entry.practiceId);
    const preview = entry.answers.action || entry.answers.reflection || Object.values(entry.answers).find(Boolean) || '';
    return `<li class="journal-entry"><a href="#journal/${entry.id}" data-entry="${entry.id}"><div class="entry-meta"><span>${prettyDate(entry.createdAt)}</span><span>${getDomain(practice?.domain)?.title || 'Reflection'}</span></div><h2>${esc(practice?.title || 'A reflection')}</h2><p>${esc(preview.slice(0, 180))}${preview.length > 180 ? '…' : ''}</p></a></li>`;
  }).join('')}</ul>`;
}
function updateJournalResults() {
  const results = $('#journal-results');
  if (!results) return;
  results.innerHTML = journalResults();
  const count = results.querySelectorAll('.journal-entry').length;
  $('#journal-count').textContent = `${count} ${count === 1 ? 'entry' : 'entries'}`;
}

function book(rawChapter) {
  const chapter = Math.max(0, Math.min(Number(rawChapter || 1) - 1 || 0, chapterPreviews.length - 1));
  const preview = chapterPreviews[chapter];
  const practice = practices[chapter];
  return `<section class="book-layout"><aside class="book-aside"><div class="book-cover" aria-label="Before You Ask the Machine, a short guide to being human in the age of AI"><span class="eyebrow">Alive Systems Lab</span><h2>Before<br>you ask<br>the machine.</h2><p>A short guide to being human in the age of AI</p><small>Imani-Faith Kirika</small></div><p class="book-note">The book is taking shape.<br>Explore these opening ideas, then put one into practice.</p><nav aria-label="Book chapters" style="display:contents"><ol class="chapter-list">${chapterPreviews.map((item, i) => `<li><a href="#book/${i + 1}" aria-current="${i === chapter}"><span>${String(i + 1).padStart(2, '0')}</span><span>${esc(item[0])}</span></a></li>`).join('')}</ol></nav></aside><article class="book-reader"><p class="eyebrow">Chapter ${String(chapter + 1).padStart(2, '0')} <span aria-hidden="true">/</span> Concept preview</p><h1>${esc(preview[0])}</h1><p class="lead">${esc(preview[1])}</p><p>${esc(preview[2])}</p><section class="book-experiment"><h2>Try the idea in your own life.</h2><p>${esc(practice.description)}</p><button class="button" data-start="${practice.id}">Begin this practice ${icon('arrow')}</button></section><nav class="chapter-navigation" aria-label="Chapter navigation">${chapter > 0 ? `<a class="text-link" href="#book/${chapter}">${icon('back')} Previous chapter</a>` : '<span></span>'}${chapter < 7 ? `<a class="text-link" href="#book/${chapter + 2}">Next chapter ${icon('arrow')}</a>` : '<a class="text-link" href="#home">Back to your space</a>'}</nav></article></section>`;
}
function notFound() { return '<section class="empty-state"><h1>Let’s find your place.</h1><p>This page is not part of Alive Practice.</p><a class="button" href="#home">Back to your space</a></section>'; }

function go(route) {
  const next = `#${route}`;
  if (location.hash === next) render(); else location.hash = route;
}
function render() {
  const [route = 'home', id, step] = location.hash.slice(1).split('/');
  const main = $('#main');
  let page;
  if (route === 'home' || route === '') page = home();
  else if (route === 'explore') page = explore(id);
  else if (route === 'practice') page = exercise(id, step);
  else if (route === 'journal') page = journal();
  else if (route === 'book') page = book(id);
  else if (route === 'complete') page = complete();
  else page = notFound();
  main.innerHTML = page;
  const activeNav = route === 'journal' ? 'journal' : route === 'book' ? 'book' : 'practice';
  document.querySelectorAll('[data-nav]').forEach(link => { if (link.dataset.nav === activeNav) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
  $('.journal-dot').hidden = state.entries.length === 0;
  document.title = `${route === 'book' ? 'The Book' : route === 'journal' ? 'Your Journal' : route === 'practice' ? getPractice(id)?.title || 'Practice' : 'A little room to be human'} — Alive Practice`;
  if (route === 'journal') updateJournalResults();
  if (route === 'practice') persistDraft();
  window.scrollTo({ top: 0, behavior: 'instant' });
  main.focus({ preventScroll: true });
  if (route === 'journal' && id) openEntry(id);
}

function showToast(message) {
  clearTimeout(toastTimer);
  const toast = $('#toast'); toast.textContent = message; toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 5000);
}
function openDialog(dialog) {
  dialogTrigger = document.activeElement;
  if (!dialog.open) dialog.showModal();
}
function closeDialog(dialog) { dialog.close(); }
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { if (dialogTrigger?.isConnected) dialogTrigger.focus({ preventScroll: true }); if (dialog.id === 'confirm-dialog') confirmAction = null; });
});
function dialogClose(id) { return `<button type="button" class="icon-button" data-close="${id}" aria-label="Close">${icon('close')}</button>`; }

function applyPreferences() {
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = preferences.theme === 'system' ? (dark ? 'dark' : 'light') : preferences.theme;
  document.documentElement.dataset.atmosphere = preferences.atmosphere;
  document.documentElement.dataset.motion = preferences.motion && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'on' : 'off';
  $('meta[name="theme-color"]').content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
}
function savePreferences() {
  applyPreferences();
  if (!store.write(PREFERENCES_KEY, preferences)) showToast('Your appearance changed for this visit. This browser could not remember it.');
  updateAppearanceControls();
}
function appearance() {
  const dialog = $('#appearance-dialog');
  dialog.innerHTML = `<div class="dialog-header"><div><h2 id="appearance-title">Make yourself at home.</h2><p>Choose how this space feels.</p></div>${dialogClose('appearance-dialog')}</div><fieldset class="settings-group"><legend>Appearance</legend><div class="segment">${['system', 'light', 'dark'].map(theme => `<button data-theme-choice="${theme}" aria-pressed="${preferences.theme === theme}">${theme[0].toUpperCase() + theme.slice(1)}</button>`).join('')}</div></fieldset><fieldset class="settings-group"><legend>Atmosphere</legend><div class="atmospheres">${['grounded', 'dawn', 'dusk'].map(atmosphere => `<button class="atmosphere-button" data-atmosphere-choice="${atmosphere}" aria-pressed="${preferences.atmosphere === atmosphere}"><span class="atmosphere-swatch ${atmosphere}" aria-hidden="true"></span>${atmosphere[0].toUpperCase() + atmosphere.slice(1)}</button>`).join('')}</div></fieldset><div class="setting-line"><div><strong>Gentle motion</strong><small>${matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Your device requests reduced motion.' : 'A slow-moving field. Pause whenever you like.'}</small></div><button class="switch" role="switch" aria-label="Gentle motion" aria-checked="${preferences.motion && !matchMedia('(prefers-reduced-motion: reduce)').matches}" data-action="motion" ${matchMedia('(prefers-reduced-motion: reduce)').matches ? 'disabled' : ''}></button></div><div class="setting-line"><div><strong>Soft ambient sound</strong><small>A quiet, generated sound texture. Off until you choose it.</small></div><button class="switch" role="switch" aria-label="Soft ambient sound" aria-checked="${soundOn}" data-action="sound"></button></div><p class="save-state">Appearance is remembered on this device.</p>`;
  openDialog(dialog);
}
function updateAppearanceControls() {
  document.querySelectorAll('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === preferences.theme)));
  document.querySelectorAll('[data-atmosphere-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.atmosphereChoice === preferences.atmosphere)));
  const motion = $('[data-action="motion"]'); if (motion) motion.setAttribute('aria-checked', String(preferences.motion && !matchMedia('(prefers-reduced-motion: reduce)').matches));
}
async function toggleSound() {
  try {
    if (soundOn) { await audioContext.suspend(); soundOn = false; }
    else {
      if (!audioContext) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw new Error('Audio is unavailable');
        audioContext = new Audio();
        const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 6, audioContext.sampleRate);
        const samples = buffer.getChannelData(0);
        let previous = 0;
        for (let i = 0; i < samples.length; i++) { previous = (previous + Math.random() * .04 - .02) / 1.02; samples[i] = previous * 3.5; }
        audioNode = audioContext.createBufferSource(); audioNode.buffer = buffer; audioNode.loop = true;
        const filter = audioContext.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 950;
        audioGain = audioContext.createGain(); audioGain.gain.value = .18;
        audioNode.connect(filter).connect(audioGain).connect(audioContext.destination); audioNode.start();
      }
      await audioContext.resume(); soundOn = true;
    }
    updateSoundControls();
  } catch { showToast('Sound could not start in this browser. All practices are available in quiet.'); }
}
function updateSoundControls() {
  const button = $('#sound-toggle'); button.innerHTML = icon(soundOn ? 'sound' : 'quiet'); button.setAttribute('aria-pressed', String(soundOn)); button.setAttribute('aria-label', soundOn ? 'Turn off soft ambient sound' : 'Turn on soft ambient sound');
  $('[data-action="sound"]')?.setAttribute('aria-checked', String(soundOn));
}

function download(filename, content, type) {
  const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportJournal(format = 'json', entries = state.entries) {
  const date = new Date().toISOString().slice(0, 10);
  if (format === 'json') download(`alive-practice-journal-${date}.json`, encodeJournal(entries), 'application/json');
  else {
    const text = ['# Alive Practice — My Journal', '', ...entries.map(entry => { const practice = getPractice(entry.practiceId); return [`## ${practice?.title || 'Reflection'}`, `Created: ${entry.createdAt}`, `Updated: ${entry.updatedAt}`, '', ...Object.entries(entry.answers).filter(([, value]) => value.trim()).map(([key, value]) => `### ${answerLabel(practice || { steps: [] }, key)}\n\n${value}\n`)].join('\n'); })].join('\n\n');
    download(`alive-practice-journal-${date}.md`, text, 'text/plain;charset=utf-8');
  }
  showToast('Your journal export is ready.');
}
function dataControls() {
  const dialog = $('#data-dialog');
  dialog.innerHTML = `<div class="dialog-header"><div><h2 id="data-title">Your data, your space.</h2><p>Keep a copy. Choose what stays.</p></div>${dialogClose('data-dialog')}</div><p>Your journal and practice drafts are stored in this browser on this device. Alive Practice does not send your writing to a server or AI service.</p><p>They are not protected by a separate password. Anyone with access to this browser profile may be able to read them. Clearing browser data or changing devices can remove access, so export a copy you want to keep.</p><section class="data-section"><h3>Take your journal with you</h3><p>${state.entries.length} saved ${state.entries.length === 1 ? 'entry' : 'entries'}. JSON can be restored here; Markdown is easy to read elsewhere.</p><div class="button-row"><button class="button button-secondary" data-action="export-json" ${!state.entries.length ? 'disabled' : ''}>${icon('download')} Export JSON</button><button class="button button-secondary" data-action="export-markdown" ${!state.entries.length ? 'disabled' : ''}>Export Markdown</button></div></section><section class="data-section"><h3>Restore a journal</h3><p>Import an Alive Practice JSON export. Existing entries are kept; a newer version of the same entry replaces an older one.</p><button class="button button-secondary" data-action="choose-import">Choose a JSON file</button><input hidden type="file" id="journal-import" accept=".json,application/json"><p id="import-result" role="status"></p></section>${!state.storageOk ? '<section class="data-section"><h3>Recover existing data</h3><p>The stored journal could not be read. It has not been overwritten. Download the original data before clearing it.</p><button class="button button-secondary" data-action="recover-raw">Download original data</button></section>' : ''}<section class="data-section"><h3>Clear this browser</h3><p>This removes your journal and unfinished drafts from this browser. Download a copy first if you want to keep them.</p><button class="button button-danger" data-action="clear-all">Delete journal & drafts</button></section>`;
  openDialog(dialog);
}
function askConfirm(title, message, label, action) {
  const dialog = $('#confirm-dialog');
  dialog.innerHTML = `<h2 id="confirm-title">${esc(title)}</h2><p>${esc(message)}</p><div class="button-row"><button class="button button-secondary" data-close="confirm-dialog" autofocus>Keep it</button><button class="button button-danger" data-action="confirm">${esc(label)}</button></div>`;
  confirmAction = action; openDialog(dialog);
}
function openEntry(id, edit = false) {
  const entry = state.entries.find(item => item.id === id);
  if (!entry) { if (location.hash.includes('/')) go('journal'); return; }
  const practice = getPractice(entry.practiceId) || { title: 'A reflection', steps: [] };
  const dialog = $('#entry-dialog');
  state.editing = edit ? id : null;
  const fields = Object.entries(entry.answers).filter(([, value]) => value.trim());
  dialog.innerHTML = `<div class="dialog-header"><div><p class="eyebrow">${prettyDate(entry.createdAt)}${edit ? ' / Edit entry' : ''}</p><h2 id="entry-title">${esc(practice.title)}</h2></div>${dialogClose('entry-dialog')}</div>${edit ? `<form id="entry-edit-form" data-id="${id}">${fields.map(([key, value]) => key === 'intent' ? `<div class="entry-answer"><h3>The help I chose</h3><p>${esc(helpOptions.find(option => option.id === value)?.title || value)}</p></div>` : field(key, answerLabel(practice, key), '', { value, optional: true })).join('')}<p class="form-error" id="edit-error" role="alert" hidden></p><div class="button-row"><button class="button" type="submit">Save changes</button><button class="button button-secondary" type="button" data-view-entry="${id}">Cancel</button></div></form>` : `${fields.map(([key, value]) => `<section class="entry-answer"><h3>${esc(answerLabel(practice, key))}</h3><p>${esc(key === 'intent' ? helpOptions.find(option => option.id === value)?.title || value : value)}</p></section>`).join('')}<div class="button-row"><button class="button button-secondary" data-edit-entry="${id}">Edit entry</button><button class="button button-secondary" data-export-entry="${id}">Export entry</button><button class="text-button" data-delete-entry="${id}">Delete entry</button></div>`}`;
  openDialog(dialog);
}

document.addEventListener('input', event => {
  const field = event.target;
  if (field.closest('#practice-form') && field.name && state.draft) {
    state.draft.answers[field.name] = field.value;
    state.formError = ''; const error = $('#practice-form .form-error'); if (error) error.hidden = true;
    persistDraft();
  }
  if (field.id === 'journal-search') { state.query = field.value; updateJournalResults(); }
});
document.addEventListener('change', async event => {
  if (event.target.id === 'journal-domain') { state.journalDomain = event.target.value; updateJournalResults(); }
  if (event.target.id === 'journal-import') {
    const file = event.target.files?.[0]; if (!file) return;
    const result = $('#import-result');
    try {
      if (!state.storageOk) throw new Error('Download and clear the unreadable stored data before importing.');
      if (file.size > 10 * 1024 * 1024) throw new Error('Choose a file smaller than 10 MB.');
      const imported = decodeJournal(await file.text());
      if (imported.some(entry => !getPractice(entry.practiceId))) throw new Error('This file includes a practice this version does not recognize. Your journal has not changed.');
      const merged = mergeEntries(state.entries, imported);
      const saved = store.saveJournal(merged); if (!saved.ok) throw new Error(saved.error);
      state.entries = merged; result.textContent = `${imported.length} ${imported.length === 1 ? 'entry' : 'entries'} checked. Your journal now has ${merged.length}.`;
      if (location.hash.startsWith('#journal')) updateJournalResults();
      $('.journal-dot').hidden = !merged.length;
    } catch (error) { result.textContent = error.message; }
    event.target.value = '';
  }
});
document.addEventListener('submit', event => {
  if (event.target.id === 'practice-form') {
    event.preventDefault();
    const practice = getPractice(state.draft.practiceId);
    const index = state.draft.step;
    const missing = requiredFields(practice, index).find(key => !state.draft.answers[key]?.trim());
    if (missing) {
      state.formError = missing === 'intent' ? 'Choose the kind of help you want.' : 'Give this question a few words before continuing.';
      const error = $('#practice-form .form-error'); error.textContent = state.formError; error.hidden = false;
      document.querySelector(`#practice-form [name="${missing}"]`)?.focus(); return;
    }
    if (index < practice.steps.length - 1) { state.draft.step++; persistDraft(); state.formError = ''; go(`practice/${practice.id}/${state.draft.step}`); return; }
    for (let i = 0; i < practice.steps.length; i++) {
      if (requiredFields(practice, i).some(key => !state.draft.answers[key]?.trim())) { state.formError = 'Finish this reflection before saving your practice.'; go(`practice/${practice.id}/${i}`); return; }
    }
    if (!state.storageOk) { showToast('The stored journal needs attention before saving. Open Your data, your space to recover it.'); return; }
    const now = new Date().toISOString();
    const entry = { id: newEntryId(), practiceId: practice.id, answers: { ...state.draft.answers }, createdAt: now, updatedAt: now };
    const next = [entry, ...state.entries];
    const saved = store.saveJournal(next);
    if (!saved.ok) { showToast(saved.error); download(`alive-practice-unsaved-${now.slice(0, 10)}.json`, encodeJournal([entry]), 'application/json'); return; }
    state.entries = next; state.lastSaved = entry; dropDraft(practice.id); state.draft = null; state.formError = ''; go('complete');
  }
  if (event.target.id === 'entry-edit-form') {
    event.preventDefault();
    const original = state.entries.find(entry => entry.id === event.target.dataset.id); if (!original) return;
    const answers = { ...original.answers };
    for (const [key, value] of new FormData(event.target)) answers[key] = String(value);
    const updated = { ...original, answers, updatedAt: new Date().toISOString() };
    const next = state.entries.map(entry => entry.id === original.id ? updated : entry);
    const saved = store.saveJournal(next);
    if (!saved.ok) { $('#edit-error').textContent = saved.error; $('#edit-error').hidden = false; return; }
    state.entries = next; openEntry(original.id); updateJournalResults(); showToast('Your changes are saved.');
  }
});

document.addEventListener('click', async event => {
  const target = event.target.closest('button, a, [data-action]'); if (!target) return;
  if (target.classList.contains('skip-link')) { event.preventDefault(); $('#main').focus(); return; }
  if (target.dataset.close) { closeDialog(document.getElementById(target.dataset.close)); return; }
  if (target.dataset.start) { startPractice(target.dataset.start); return; }
  if (target.dataset.themeChoice) { preferences.theme = target.dataset.themeChoice; savePreferences(); return; }
  if (target.dataset.atmosphereChoice) { preferences.atmosphere = target.dataset.atmosphereChoice; savePreferences(); return; }
  if (target.id === 'appearance-toggle') { appearance(); return; }
  if (target.id === 'sound-toggle') { await toggleSound(); return; }
  if (target.dataset.entry) { event.preventDefault(); openEntry(target.dataset.entry); return; }
  if (target.dataset.editEntry) { openEntry(target.dataset.editEntry, true); return; }
  if (target.dataset.viewEntry) { openEntry(target.dataset.viewEntry); return; }
  if (target.dataset.exportEntry) { exportJournal('json', state.entries.filter(entry => entry.id === target.dataset.exportEntry)); return; }
  if (target.dataset.deleteEntry) {
    const id = target.dataset.deleteEntry;
    askConfirm('Delete this reflection?', 'This removes this entry from this browser. An exported copy will stay wherever you saved it.', 'Delete entry', () => {
      const next = state.entries.filter(entry => entry.id !== id); const saved = store.saveJournal(next);
      if (!saved.ok) { showToast(saved.error); return; }
      state.entries = next; $('#entry-dialog').close(); if (location.hash !== '#journal') go('journal'); else render(); showToast('Entry deleted.');
    }); return;
  }
  const action = target.dataset.action;
  if (action === 'privacy') dataControls();
  else if (action === 'motion') { preferences.motion = !preferences.motion; savePreferences(); }
  else if (action === 'sound') await toggleSound();
  else if (action === 'leave-practice') { persistDraft(); state.draft = null; go('home'); showToast('You can return to your draft when you are ready.'); }
  else if (action === 'previous-step') { if (state.draft) { state.draft.step = Math.max(0, state.draft.step - 1); state.formError = ''; persistDraft(); go(`practice/${state.draft.practiceId}/${state.draft.step}`); } }
  else if (action === 'copy-request') {
    try { await navigator.clipboard.writeText(buildRequest()); showToast('Request copied. Choose what you share with another tool.'); }
    catch { const dialog = $('#data-dialog'); dialog.innerHTML = `<div class="dialog-header"><div><h2 id="data-title">Your request</h2><p>Select and copy the text below.</p></div>${dialogClose('data-dialog')}</div><label class="field"><span class="field-label">Request to copy</span><textarea class="textarea-large" readonly>${esc(buildRequest())}</textarea></label>`; openDialog(dialog); dialog.querySelector('textarea').select(); }
  }
  else if (action === 'reset-search') { state.query = ''; state.journalDomain = 'all'; render(); }
  else if (action === 'choose-import') $('#journal-import').click();
  else if (action === 'export-json') exportJournal('json');
  else if (action === 'export-markdown') exportJournal('markdown');
  else if (action === 'recover-raw') download('alive-practice-recovery.txt', store.raw(JOURNAL_KEY) || 'No stored data could be accessed.', 'text/plain');
  else if (action === 'clear-all') askConfirm('Clear your journal and drafts?', 'This deletes all saved reflections and unfinished practices from this browser. Export a copy first if you want to keep them.', 'Delete everything', () => {
    if (!store.remove(JOURNAL_KEY) || !store.remove(DRAFT_KEY)) { showToast('This browser could not clear the data. Use its site storage controls.'); return; }
    state.entries = []; state.draft = null; state.storageOk = true; state.storageError = ''; state.lastSaved = null;
    $('#data-dialog').close(); $('#entry-dialog').close(); go('journal'); render(); showToast('Your journal and drafts have been cleared.');
  });
  else if (action === 'confirm') { const run = confirmAction; $('#confirm-dialog').close(); confirmAction = null; run?.(); }
});

window.addEventListener('hashchange', () => {
  if (!location.hash.startsWith('#practice/')) state.draft = null;
  render();
});
window.addEventListener('storage', event => {
  if (event.key === JOURNAL_KEY || event.key === null) { const next = store.loadJournal(); state.entries = next.entries; state.storageOk = next.ok; state.storageError = next.error; if (location.hash.startsWith('#journal') && !$('#entry-dialog').open) render(); $('.journal-dot').hidden = !state.entries.length; }
});
document.addEventListener('visibilitychange', async () => { if (document.hidden && soundOn) { await audioContext.suspend(); soundOn = false; updateSoundControls(); } });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyPreferences);
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => { applyPreferences(); updateAppearanceControls(); });
$('#appearance-toggle').innerHTML = icon('settings');
updateSoundControls(); applyPreferences(); render();
