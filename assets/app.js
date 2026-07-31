/* Stretch24 – App-Logik (kein Framework, kein Build-Schritt) */
(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const exerciseById = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

  /* ===== Storage ===== */
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem('s24.' + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch { return fallback; }
    },
    /* Gibt false zurück, wenn der Speicher voll oder blockiert ist
     * (z.B. Safari im privaten Modus). Aufrufer mit Nutzerdaten melden das. */
    set(key, value) {
      try {
        localStorage.setItem('s24.' + key, JSON.stringify(value));
        return true;
      } catch { return false; }
    },
  };

  /* ===== Sprache =====
   * Reihenfolge: gespeicherte Wahl, dann Browser-Sprachen, sonst Deutsch.
   * Texte kommen aus assets/i18n.js, die Übungs-IDs verbinden beides. */
  const LANG_CODES = LANGS.map((l) => l.code);
  /* Englisch als Fallback: deckt die meisten Besucher ab, deren Browser-
   * sprache wir nicht anbieten, und passt zum statischen Stand in index.html. */
  const DEFAULT_LANG = 'en';

  function detectLang() {
    const saved = store.get('lang', null);
    if (typeof saved === 'string' && LANG_CODES.includes(saved)) return saved;
    for (const tag of navigator.languages || [navigator.language || '']) {
      const code = String(tag).slice(0, 2).toLowerCase();
      if (LANG_CODES.includes(code)) return code;
    }
    return DEFAULT_LANG;
  }

  let lang = detectLang();
  const dict = () => I18N[lang] || I18N[DEFAULT_LANG];

  /* t('key', { name: 'X' }) füllt {platzhalter} im Text. */
  function t(key, vars) {
    const raw = dict().ui[key] ?? I18N[DEFAULT_LANG].ui[key] ?? key;
    return vars ? fill(raw, vars) : raw;
  }

  const fill = (raw, vars) => raw.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

  /* Zählbares mit Singular/Plural, z.B. plural('exercises', 3). */
  function plural(key, n) {
    const forms = dict().plural[key] || I18N[DEFAULT_LANG].plural[key];
    return fill(n === 1 ? forms.one : forms.other, { n });
  }

  /* Texte einer Übung bzw. Routine in der aktiven Sprache. */
  const exText = (ex) => dict().ex[ex.id] || I18N[DEFAULT_LANG].ex[ex.id] || { name: ex.id, desc: '' };
  const exName = (ex) => exText(ex).name;
  const catName = (ex) => dict().cats[ex.cat] || I18N[DEFAULT_LANG].cats[ex.cat] || ex.cat;

  /* Eigene Routinen tragen ihren Namen selbst, feste liegen in i18n. */
  const routineText = (r) => (r.custom ? { name: r.name, blurb: '' }
    : dict().routines[r.id] || I18N[DEFAULT_LANG].routines[r.id] || { name: r.id, blurb: '' });

  /* ===== Eingabe-Validierung =====
   * Alles, was aus Nutzereingaben oder dem localStorage kommt, wird hier
   * geprüft: HTML wird escaped (kein Markup über Routinen-Namen einschleusbar),
   * Zahlen werden auf sinnvolle Bereiche begrenzt, kaputte Datensätze fliegen raus. */
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const clampSecs = (value) => {
    const n = Math.round(Number(value));
    return Number.isFinite(n) ? Math.min(90, Math.max(15, n)) : 30;
  };

  const cleanName = (value) => String(value ?? '').trim().slice(0, 40) || t('defaultRoutineName');

  const cleanCount = (value) => {
    const n = Math.floor(Number(value));
    return Number.isFinite(n) && n >= 0 ? Math.min(n, 999999) : 0;
  };

  function loadCustomRoutines() {
    const raw = store.get('custom', []);
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((r) => r && typeof r === 'object')
      .map((r, i) => ({
        id: typeof r.id === 'string' && r.id ? r.id : 'c' + i,
        icon: 'star',
        custom: true, // Name kommt vom Nutzer, nicht aus i18n
        name: cleanName(r.name),
        secs: clampSecs(r.secs),
        items: Array.isArray(r.items) ? r.items.filter((id) => exerciseById[id]) : [],
      }))
      .filter((r) => r.items.length > 0);
  }

  function loadStats() {
    const s = store.get('stats', {});
    return { sessions: cleanCount(s?.sessions), minutes: cleanCount(s?.minutes) };
  }

  function loadStreak() {
    const s = store.get('streak', {});
    const last = typeof s?.last === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.last) ? s.last : null;
    return { last, count: cleanCount(s?.count) };
  }

  let soundOn = store.get('sound', false) === true;

  /* ===== Views ===== */
  function show(viewId) {
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    const view = $('#' + viewId);
    view.classList.add('active');
    view.focus({ preventScroll: true }); // Fokus mitnehmen, sonst landet er auf <body>
    window.scrollTo(0, 0);
  }

  /* ===== Streak ===== */
  const todayStr = () => new Date().toISOString().slice(0, 10);

  function currentStreak() {
    const s = loadStreak();
    if (!s.last) return 0;
    const last = new Date(s.last + 'T00:00:00');
    const diffDays = Math.round((new Date(todayStr() + 'T00:00:00') - last) / 86400000);
    return diffDays <= 1 ? s.count : 0; // heute oder gestern gedehnt → Streak lebt
  }

  function bumpStreak() {
    const s = loadStreak();
    const today = todayStr();
    if (s.last === today) return s.count; // heute schon gezählt
    const alive = currentStreak() > 0;
    const count = alive ? s.count + 1 : 1;
    store.set('streak', { last: today, count });
    return count;
  }

  function renderStreak() {
    const streak = currentStreak();
    const stats = loadStats();
    const bar = $('#streak-bar');
    if (streak === 0 && stats.sessions === 0) { bar.hidden = true; return; }
    bar.hidden = false;
    const parts = [];
    if (streak > 0) parts.push(t('streakDays', { n: plural('days', streak) }));
    parts.push(t('streakSessions', { n: plural('sessions', stats.sessions) }));
    parts.push(t('streakMinutes', { n: stats.minutes }));
    $('#streak-text').textContent = parts.join(' · ');
    $('#streak-flame').innerHTML = streak > 0 ? ICONS.flame : ICONS.sprout;
  }

  /* ===== Home rendern ===== */
  function routineDuration(routine) {
    // Zufallsroutine: Übungen stehen noch nicht fest, mit ~1.5 Schritten
    // pro Übung schätzen (Links/Rechts-Übungen zählen doppelt).
    const steps = routine.random
      ? Math.round(routine.random * 1.5)
      : routine.items.reduce((n, id) => n + (exerciseById[id]?.sides ? 2 : 1), 0);
    return Math.round((steps * routine.secs + Math.max(0, steps - 1) * REST_SECS) / 60);
  }

  /* Kopie eines Arrays in zufälliger Reihenfolge (Fisher-Yates) */
  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* n zufällige Übungs-IDs ziehen */
  const randomExercises = (n) => shuffled(EXERCISES.map((ex) => ex.id)).slice(0, n);

  function routineCard(routine, { deletable = false } = {}) {
    const text = routineText(routine);
    const count = routine.random || routine.items.length;
    const card = document.createElement('button');
    card.className = 'routine-card';
    card.innerHTML = `
      <span class="routine-icon">${ICONS[routine.icon] || ICONS.star}</span>
      <span class="card-title">${esc(text.name)}</span>
      <span class="card-desc">${esc(text.blurb || t('cardCustomDesc', { n: plural('exercises', count) }))}</span>
      <span class="meta">${esc(t('cardMeta', { min: routineDuration(routine), n: plural('exercises', count) }))}</span>`;
    card.addEventListener('click', () => startRoutine(
      routine.random ? { ...routine, items: randomExercises(routine.random) }
      : routine.shuffle ? { ...routine, items: shuffled(routine.items) }
      : routine
    ));
    if (!deletable) return card;

    // Löschen-Button als Geschwister, nicht als Kind des Karten-Buttons
    // (verschachtelte Buttons sind ungültiges HTML).
    const slot = document.createElement('div');
    slot.className = 'routine-slot';
    slot.appendChild(card);
    const del = document.createElement('button');
    del.className = 'delete';
    del.innerHTML = ICONS.trash;
    del.setAttribute('aria-label', t('cardDelete', { name: text.name }));
    del.addEventListener('click', () => {
      if (!confirm(t('cardConfirmDelete', { name: text.name }))) return;
      if (!store.set('custom', loadCustomRoutines().filter((r) => r.id !== routine.id))) {
        alert(t('storageError'));
        return;
      }
      renderHome();
    });
    slot.appendChild(del);
    return slot;
  }

  function exerciseCard(ex, { onClick } = {}) {
    const card = document.createElement('button');
    card.className = 'exercise-card';
    card.dataset.id = ex.id;
    card.innerHTML = `
      ${figureHTML(ex)}
      <span class="name">${esc(exName(ex))}</span>
      <span class="cat">${esc(catName(ex))}</span>
      ${ex.sides ? `<span class="sides-tag">${esc(t('sidesTag'))}</span>` : ''}`;
    card.addEventListener('click', () => (onClick ? onClick(ex, card) : openExerciseDialog(ex)));
    return card;
  }

  function renderHome() {
    const list = $('#routine-list');
    list.innerHTML = '';
    ROUTINES.forEach((r) => list.appendChild(routineCard(r)));

    const custom = loadCustomRoutines();
    const customList = $('#custom-routine-list');
    customList.innerHTML = '';
    custom.forEach((r) => customList.appendChild(routineCard(r, { deletable: true })));
    $('#custom-empty').hidden = custom.length > 0;

    const exList = $('#exercise-list');
    exList.innerHTML = '';
    EXERCISES.forEach((ex) => exList.appendChild(exerciseCard(ex)));

    renderStreak();
  }

  /* ===== Übungs-Dialog ===== */
  const DIALOG_TRY_SECS = 60;
  const dialog = $('#exercise-dialog');
  let dialogExercise = null;

  function openExerciseDialog(ex) {
    dialogExercise = ex;
    $('#dialog-pose').innerHTML = figureHTML(ex, { eager: true });
    $('#dialog-title').textContent = exName(ex);
    $('#dialog-desc').textContent = exText(ex).desc;
    dialog.showModal();
  }
  $('#dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (ev) => { if (ev.target === dialog) dialog.close(); });
  $('#dialog-try').addEventListener('click', () => {
    dialog.close();
    startRoutine({ custom: true, name: exName(dialogExercise), secs: DIALOG_TRY_SECS, items: [dialogExercise.id], single: true });
  });

  /* ===== Audio & Sprache ===== */
  let audioCtx = null;
  function beep(freq = 880, dur = 0.12, when = 0) {
    if (!soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const t = audioCtx.currentTime + when;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    } catch {}
  }
  const chime = () => { beep(660, 0.15); beep(990, 0.25, 0.15); };

  function speak(text) {
    if (!soundOn || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LANGS.find((l) => l.code === lang)?.speech || 'de-DE';
      u.rate = 1.0;
      speechSynthesis.speak(u);
    } catch {}
  }

  /* ===== Wake Lock ===== */
  let wakeLock = null;
  async function requestWakeLock() {
    try { wakeLock = await navigator.wakeLock?.request('screen'); } catch {}
  }
  function releaseWakeLock() {
    try { wakeLock?.release(); } catch {}
    wakeLock = null;
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && player.active) requestWakeLock();
  });

  /* ===== Player ===== */
  /* Seitenangabe: kurz für die Vorschau ("links"), lang für Ansage und
   * Screenreader ("linke Seite"). */
  const sideShort = (side) => t(side === 'left' ? 'sideLeftShort' : 'sideRightShort');
  const sideLong = (side) => t(side === 'left' ? 'sideLeftLong' : 'sideRightLong');

  const RING_CIRC = 2 * Math.PI * 120;
  const REST_SECS = 5; // Pause zwischen Übungen, zum Neu-Ausrichten

  const player = {
    active: false,
    steps: [],       // {ex, side: null|'left'|'right', secs}
    index: 0,
    remaining: 0,
    phaseTotal: 0,   // Sekunden der aktuellen Phase (Übung oder Pause), für den Ring
    resting: false,
    paused: false,
    timerId: null,
    routineName: '',
    totalSecs: 0,
    single: false,
  };

  function buildSteps(routine) {
    const steps = [];
    routine.items.forEach((id) => {
      const ex = exerciseById[id];
      if (!ex) return;
      if (ex.sides) {
        steps.push({ ex, side: 'left', secs: routine.secs });
        steps.push({ ex, side: 'right', secs: routine.secs });
      } else {
        steps.push({ ex, side: null, secs: routine.secs });
      }
    });
    return steps;
  }

  function startRoutine(routine) {
    player.steps = buildSteps(routine);
    if (!player.steps.length) return;
    player.index = 0;
    player.active = true;
    player.paused = false;
    player.resting = false;
    $('#view-player').classList.remove('resting');
    player.routineName = routineText(routine).name;
    player.single = !!routine.single;
    player.totalSecs = player.steps.reduce((n, s) => n + s.secs, 0);

    const prog = $('#player-progress');
    prog.innerHTML = player.steps.map(() => '<span class="seg"></span>').join('');

    show('view-player');
    requestWakeLock();
    loadStep();
  }

  function loadStep() {
    clearInterval(player.timerId);
    player.resting = false;
    $('#view-player').classList.remove('resting');
    const step = player.steps[player.index];
    player.remaining = step.secs;
    player.phaseTotal = step.secs;

    $('#pose-figure').innerHTML = figureHTML(step.ex, { eager: true });
    $('#pose-figure').classList.toggle('flip', step.side === 'right');
    $('#player-title').textContent = exName(step.ex);
    $('#player-hint').textContent = exText(step.ex).desc;
    $('#player-announce').textContent = step.side
      ? t('announceSide', { name: exName(step.ex), side: sideLong(step.side), secs: step.secs })
      : t('announce', { name: exName(step.ex), secs: step.secs });
    const badge = $('#side-badge');
    badge.hidden = !step.side;
    if (step.side) {
      badge.innerHTML = step.side === 'left'
        ? `${ICONS.chevronLeft}<span>${esc(t('leftSide'))}</span>`
        : `<span>${esc(t('rightSide'))}</span>${ICONS.chevronRight}`;
    }

    const next = player.steps[player.index + 1];
    $('#player-next').textContent = next
      ? (next.side
        ? t('afterSide', { name: exName(next.ex), side: sideShort(next.side) })
        : t('after', { name: exName(next.ex) }))
      : t('lastExercise');

    document.querySelectorAll('#player-progress .seg').forEach((seg, i) => {
      seg.className = 'seg' + (i < player.index ? ' done' : i === player.index ? ' now' : '');
    });

    const sameExercise = step.side === 'right';
    speak(sameExercise ? t('sideSwitch') : exName(step.ex));

    updateCountdown(true);
    player.timerId = setInterval(tick, 1000);
  }

  function updateCountdown(reset = false) {
    $('#countdown').textContent = player.remaining;
    const ring = $('#ring-fg');
    if (reset) {
      ring.classList.add('no-anim');
      ring.style.strokeDashoffset = '0';
      void ring.getBoundingClientRect(); // Reflow, damit der Reset ohne Animation greift
      ring.classList.remove('no-anim');
    }
    ring.style.strokeDashoffset = String(RING_CIRC * (1 - player.remaining / player.phaseTotal));
  }

  /* Kurze Pause zwischen zwei Übungen, zum Neu-Ausrichten. */
  function startRest() {
    clearInterval(player.timerId);
    player.resting = true;
    player.remaining = REST_SECS;
    player.phaseTotal = REST_SECS;

    // Die Pause selbst nicht benennen – stattdessen die nächste Übung
    // mit Bild und Beschreibung ankündigen.
    const next = player.steps[player.index + 1];
    $('#view-player').classList.add('resting');
    $('#side-badge').hidden = true;
    $('#pose-figure').innerHTML = figureHTML(next.ex, { eager: true });
    $('#pose-figure').classList.toggle('flip', next.side === 'right');
    $('#player-title').textContent = t('upNext', { name: exName(next.ex) });
    $('#player-hint').textContent = exText(next.ex).desc;
    $('#player-announce').textContent = next.side
      ? t('upNextSide', { name: exName(next.ex), side: sideLong(next.side) })
      : t('upNext', { name: exName(next.ex) });
    $('#player-next').textContent = '';

    document.querySelectorAll('#player-progress .seg').forEach((seg, i) => {
      seg.className = 'seg' + (i <= player.index ? ' done' : '');
    });

    speak(t('upNext', { name: exName(next.ex) }));
    updateCountdown(true);
    player.timerId = setInterval(tick, 1000);
  }

  function tick() {
    if (player.paused) return;
    player.remaining -= 1;
    if (player.remaining <= 0) {
      if (player.resting) {
        player.index += 1;
        loadStep();
      } else {
        chime();
        if (player.index + 1 >= player.steps.length) { finish(); return; }
        startRest();
      }
      return;
    }
    updateCountdown();
    if (player.remaining <= 3) beep(880, 0.1);
  }

  function nextStep() {
    if (player.resting) { player.index += 1; loadStep(); return; }
    if (player.index + 1 >= player.steps.length) { finish(); return; }
    player.index += 1;
    loadStep();
  }

  function prevStep() {
    if (player.resting) { loadStep(); return; } // aktuelle (gerade beendete) Übung neu starten
    if (player.index === 0) { loadStep(); return; } // aktuelle Übung neu starten
    player.index -= 1;
    loadStep();
  }

  function setPaused(paused) {
    player.paused = paused;
    $('#btn-pause').innerHTML = paused ? ICONS.play : ICONS.pause;
    $('#view-player').classList.toggle('paused', paused);
    if (paused) speechSynthesis?.cancel?.();
  }

  function stopPlayer() {
    clearInterval(player.timerId);
    player.active = false;
    releaseWakeLock();
    try { speechSynthesis?.cancel?.(); } catch {}
  }

  function finish() {
    stopPlayer();
    const minutes = Math.max(1, Math.round(player.totalSecs / 60));

    const stats = loadStats();
    stats.sessions += 1;
    stats.minutes += minutes;
    store.set('stats', stats);
    const streak = bumpStreak();

    $('#done-summary').textContent = player.single
      ? t('doneSingle', { name: player.routineName })
      : t('doneSummary', { name: player.routineName, n: plural('exercises', player.steps.length), min: minutes });
    $('#done-streak').innerHTML = streak > 1
      ? `${ICONS.flame} ${esc(t('doneStreak', { n: streak }))}`
      : `${ICONS.sprout} ${esc(t('doneStreakStart'))}`;
    show('view-done');
    speak(t('doneSpeak'));
  }

  $('#btn-pause').addEventListener('click', () => setPaused(!player.paused));
  $('#btn-next').addEventListener('click', () => { setPaused(false); nextStep(); });
  $('#btn-prev').addEventListener('click', () => { setPaused(false); prevStep(); });
  $('#btn-quit').addEventListener('click', () => {
    stopPlayer();
    setPaused(false);
    show('view-home');
    renderStreak();
  });
  $('#btn-sound').addEventListener('click', () => {
    soundOn = !soundOn;
    store.set('sound', soundOn);
    $('#btn-sound').innerHTML = soundOn ? ICONS.volume : ICONS.volumeX;
    if (!soundOn) { try { speechSynthesis?.cancel?.(); } catch {} }
  });
  $('#btn-sound').innerHTML = soundOn ? ICONS.volume : ICONS.volumeX;

  $('#btn-done-home').addEventListener('click', () => { show('view-home'); renderHome(); });

  document.addEventListener('keydown', (ev) => {
    if (!player.active) return;
    // Space nur global abfangen, wenn kein Button fokussiert ist -
    // sonst erwartet man dort "Aktivieren", nicht "Pause".
    if (ev.key === ' ' && !ev.target.closest('button')) { ev.preventDefault(); setPaused(!player.paused); }
    if (ev.key === 'ArrowRight') nextStep();
    if (ev.key === 'ArrowLeft') prevStep();
    if (ev.key === 'Escape') $('#btn-quit').click();
  });

  /* ===== Builder ===== */
  const builderSelection = [];

  function renderBuilder() {
    builderSelection.length = 0;
    $('#builder-name').value = '';
    $('#builder-secs').value = 30;
    $('#builder-secs-label').textContent = '30';

    const grid = $('#builder-exercises');
    grid.innerHTML = '';
    EXERCISES.forEach((ex) => {
      const card = exerciseCard(ex, {
        onClick: (exercise) => {
          const pos = builderSelection.indexOf(exercise.id);
          if (pos >= 0) builderSelection.splice(pos, 1);
          else builderSelection.push(exercise.id);
          grid.querySelectorAll('.exercise-card').forEach((c) => {
            const i = builderSelection.indexOf(c.dataset.id);
            c.classList.toggle('selected', i >= 0);
            c.setAttribute('aria-pressed', String(i >= 0));
            if (i >= 0) c.dataset.order = i + 1;
          });
          updateBuilderSummary();
        },
      });
      card.setAttribute('aria-pressed', 'false');
      grid.appendChild(card);
    });
    updateBuilderSummary();
  }

  function updateBuilderSummary() {
    const secs = Number($('#builder-secs').value);
    const steps = builderSelection.reduce((n, id) => n + (exerciseById[id]?.sides ? 2 : 1), 0);
    const mins = Math.round((steps * secs + Math.max(0, steps - 1) * REST_SECS) / 60);
    $('#builder-summary').textContent = builderSelection.length
      ? t('builderSummary', { n: plural('exercises', builderSelection.length), min: mins })
      : t('builderEmpty');
    $('#btn-builder-save').disabled = builderSelection.length === 0;
  }

  $('#builder-secs').addEventListener('input', () => {
    $('#builder-secs-label').textContent = $('#builder-secs').value;
    updateBuilderSummary();
  });

  $('#btn-new-routine').addEventListener('click', () => { renderBuilder(); show('view-builder'); });
  $('#btn-builder-back').addEventListener('click', () => show('view-home'));

  $('#btn-builder-save').addEventListener('click', () => {
    const custom = loadCustomRoutines();
    custom.push({
      id: 'c' + Date.now().toString(36),
      icon: 'star',
      name: cleanName($('#builder-name').value),
      secs: clampSecs($('#builder-secs').value),
      items: builderSelection.filter((id) => exerciseById[id]),
    });
    if (!store.set('custom', custom)) { alert(t('storageError')); return; }
    renderHome();
    show('view-home');
  });

  /* ===== Sprache anwenden =====
   * Die Markup-Texte tragen data-i18n (Textinhalt), data-i18n-aria,
   * data-i18n-placeholder oder data-i18n-title. Platzhalter wie {n} füllt
   * data-i18n-n. */
  function applyStaticTexts() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const vars = el.dataset.i18nN ? { n: el.dataset.i18nN } : null;
      el.textContent = t(el.dataset.i18n, vars);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
  }

  function applyLang() {
    document.documentElement.lang = lang;
    document.title = t('metaTitle');
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('metaDesc'));
    $('#lang-select').value = lang;
    applyStaticTexts();
    // Sekundenzahl im Dialog-Button steht im Text, nicht im Markup.
    $('#dialog-try').textContent = t('dialogTry', { secs: DIALOG_TRY_SECS });
    renderHome();
  }

  $('#lang-select').addEventListener('change', (ev) => {
    const next = ev.target.value;
    if (!LANG_CODES.includes(next)) return;
    lang = next;
    store.set('lang', lang);
    applyLang();
  });

  /* ===== Statische Icons einsetzen ===== */
  $('#btn-quit').innerHTML = ICONS.x;
  $('#btn-prev').innerHTML = ICONS.skipBack;
  $('#btn-pause').innerHTML = ICONS.pause;
  $('#btn-next').innerHTML = ICONS.skipForward;
  $('#done-icon').innerHTML = ICONS.party;
  $('#btn-new-routine').insertAdjacentHTML('afterbegin', ICONS.plus);
  $('#btn-builder-back').insertAdjacentHTML('afterbegin', ICONS.arrowLeft);

  /* ===== Start ===== */
  $('#ring-fg').style.strokeDasharray = String(RING_CIRC);
  applyLang();

  /* ===== Service Worker =====
   * Hier statt inline in index.html, damit die CSP ohne 'unsafe-inline' auskommt. */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js');
  }
})();
