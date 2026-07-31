/* Stretch24 – App-Logik (kein Framework, kein Build-Schritt) */
(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const exerciseById = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

  /* ===== Storage ===== */
  const STORAGE_ERROR = 'Speichern nicht möglich: Der Browser-Speicher ist voll '
    + 'oder blockiert (z.B. privater Modus). Deine Routinen bleiben nur bis zum '
    + 'Schliessen des Tabs erhalten.';

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

  const cleanName = (value) => String(value ?? '').trim().slice(0, 40) || 'Meine Routine';

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
    if (streak > 0) parts.push(`${streak} Tag${streak === 1 ? '' : 'e'} in Folge`);
    parts.push(`${stats.sessions} Session${stats.sessions === 1 ? '' : 's'}`);
    parts.push(`${stats.minutes} Min gesamt`);
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
    const card = document.createElement('button');
    card.className = 'routine-card';
    card.innerHTML = `
      <span class="routine-icon">${ICONS[routine.icon] || ICONS.star}</span>
      <span class="card-title">${esc(routine.name)}</span>
      <span class="card-desc">${routine.blurb ? esc(routine.blurb) : `${routine.items.length} Übungen, selbst zusammengestellt.`}</span>
      <span class="meta">~ ${routineDuration(routine)} Min · ${routine.random || routine.items.length} Übungen</span>`;
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
    del.setAttribute('aria-label', `${routine.name} löschen`);
    del.addEventListener('click', () => {
      if (!confirm(`"${routine.name}" löschen?`)) return;
      if (!store.set('custom', loadCustomRoutines().filter((r) => r.id !== routine.id))) {
        alert(STORAGE_ERROR);
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
      <span class="name">${esc(ex.name)}</span>
      <span class="cat">${esc(ex.cat)}</span>
      ${ex.sides ? '<span class="sides-tag">links + rechts</span>' : ''}`;
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
  const dialog = $('#exercise-dialog');
  let dialogExercise = null;

  function openExerciseDialog(ex) {
    dialogExercise = ex;
    $('#dialog-pose').innerHTML = figureHTML(ex, { eager: true });
    $('#dialog-title').textContent = ex.name;
    $('#dialog-desc').textContent = ex.desc;
    dialog.showModal();
  }
  $('#dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (ev) => { if (ev.target === dialog) dialog.close(); });
  $('#dialog-try').addEventListener('click', () => {
    dialog.close();
    startRoutine({ name: dialogExercise.name, secs: 60, items: [dialogExercise.id], single: true });
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
      u.lang = 'de-DE';
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
  const RING_CIRC = 2 * Math.PI * 120;
  const REST_SECS = 5; // Pause zwischen Übungen, zum Neu-Ausrichten

  const player = {
    active: false,
    steps: [],       // {ex, side: null|'links'|'rechts', secs}
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
        steps.push({ ex, side: 'links', secs: routine.secs });
        steps.push({ ex, side: 'rechts', secs: routine.secs });
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
    player.routineName = routine.name;
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
    $('#pose-figure').classList.toggle('flip', step.side === 'rechts');
    $('#player-title').textContent = step.ex.name;
    $('#player-hint').textContent = step.ex.desc;
    $('#player-announce').textContent = step.side
      ? `${step.ex.name}, ${step.side === 'links' ? 'linke' : 'rechte'} Seite, ${step.secs} Sekunden`
      : `${step.ex.name}, ${step.secs} Sekunden`;
    const badge = $('#side-badge');
    badge.hidden = !step.side;
    if (step.side) {
      badge.innerHTML = step.side === 'links'
        ? `${ICONS.chevronLeft}<span>Linke Seite</span>`
        : `<span>Rechte Seite</span>${ICONS.chevronRight}`;
    }

    const next = player.steps[player.index + 1];
    $('#player-next').textContent = next
      ? `Danach: ${next.ex.name}${next.side ? ` (${next.side})` : ''}`
      : 'Letzte Übung – gleich geschafft!';

    document.querySelectorAll('#player-progress .seg').forEach((seg, i) => {
      seg.className = 'seg' + (i < player.index ? ' done' : i === player.index ? ' now' : '');
    });

    const sameExercise = step.side === 'rechts';
    speak(sameExercise ? 'Seitenwechsel' : step.ex.name);

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
    $('#pose-figure').classList.toggle('flip', next.side === 'rechts');
    $('#player-title').textContent = `Es folgt: ${next.ex.name}`;
    $('#player-hint').textContent = next.ex.desc;
    $('#player-announce').textContent = next.side
      ? `Es folgt: ${next.ex.name}, ${next.side === 'links' ? 'linke' : 'rechte'} Seite`
      : `Es folgt: ${next.ex.name}`;
    $('#player-next').textContent = '';

    document.querySelectorAll('#player-progress .seg').forEach((seg, i) => {
      seg.className = 'seg' + (i <= player.index ? ' done' : '');
    });

    speak(`Es folgt: ${next.ex.name}`);
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
      ? `${player.routineName} – schön dranbleiben!`
      : `${player.routineName} · ${player.steps.length} Übungen · ca. ${minutes} Minuten.`;
    $('#done-streak').innerHTML = streak > 1
      ? `${ICONS.flame} ${streak} Tage in Folge – stark!`
      : `${ICONS.sprout} Streak gestartet – bis morgen!`;
    show('view-done');
    speak('Geschafft. Gut gemacht!');
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
      ? `${builderSelection.length} Übungen · ~ ${mins} Min`
      : 'Keine Übung ausgewählt';
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
    if (!store.set('custom', custom)) { alert(STORAGE_ERROR); return; }
    renderHome();
    show('view-home');
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
  renderHome();

  /* ===== Service Worker =====
   * Hier statt inline in index.html, damit die CSP ohne 'unsafe-inline' auskommt. */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js');
  }
})();
