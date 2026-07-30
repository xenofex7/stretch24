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
    set(key, value) {
      try { localStorage.setItem('s24.' + key, JSON.stringify(value)); } catch {}
    },
  };

  let soundOn = store.get('sound', true);

  /* ===== Views ===== */
  function show(viewId) {
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    $('#' + viewId).classList.add('active');
    window.scrollTo(0, 0);
  }

  /* ===== Streak ===== */
  const todayStr = () => new Date().toISOString().slice(0, 10);

  function currentStreak() {
    const s = store.get('streak', { last: null, count: 0 });
    if (!s.last) return 0;
    const last = new Date(s.last + 'T00:00:00');
    const diffDays = Math.round((new Date(todayStr() + 'T00:00:00') - last) / 86400000);
    return diffDays <= 1 ? s.count : 0; // heute oder gestern gedehnt → Streak lebt
  }

  function bumpStreak() {
    const s = store.get('streak', { last: null, count: 0 });
    const today = todayStr();
    if (s.last === today) return s.count; // heute schon gezählt
    const alive = currentStreak() > 0;
    const count = alive ? s.count + 1 : 1;
    store.set('streak', { last: today, count });
    return count;
  }

  function renderStreak() {
    const streak = currentStreak();
    const stats = store.get('stats', { sessions: 0, minutes: 0 });
    const bar = $('#streak-bar');
    if (streak === 0 && stats.sessions === 0) { bar.hidden = true; return; }
    bar.hidden = false;
    const parts = [];
    if (streak > 0) parts.push(`${streak} Tag${streak === 1 ? '' : 'e'} in Folge`);
    parts.push(`${stats.sessions} Session${stats.sessions === 1 ? '' : 's'}`);
    parts.push(`${stats.minutes} Min gesamt`);
    $('#streak-text').textContent = parts.join(' · ');
    $('#streak-flame').textContent = streak > 0 ? '🔥' : '🌱';
  }

  /* ===== Home rendern ===== */
  function routineDuration(routine) {
    const steps = routine.items.reduce((n, id) => n + (exerciseById[id]?.sides ? 2 : 1), 0);
    return Math.round((steps * routine.secs) / 60);
  }

  function routineCard(routine, { deletable = false } = {}) {
    const card = document.createElement('button');
    card.className = 'routine-card';
    card.innerHTML = `
      <span class="emoji">${routine.emoji}</span>
      <h3>${routine.name}</h3>
      <p>${routine.blurb || `${routine.items.length} Übungen, selbst zusammengestellt.`}</p>
      <span class="meta">≈ ${routineDuration(routine)} Min · ${routine.items.length} Übungen</span>`;
    card.addEventListener('click', () => startRoutine(routine));
    if (deletable) {
      const del = document.createElement('button');
      del.className = 'delete';
      del.textContent = '🗑';
      del.setAttribute('aria-label', `${routine.name} löschen`);
      del.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (!confirm(`„${routine.name}" löschen?`)) return;
        store.set('custom', store.get('custom', []).filter((r) => r.id !== routine.id));
        renderHome();
      });
      card.appendChild(del);
    }
    return card;
  }

  function exerciseCard(ex, { onClick } = {}) {
    const card = document.createElement('button');
    card.className = 'exercise-card';
    card.dataset.id = ex.id;
    card.innerHTML = `
      ${POSES[ex.pose]}
      <span class="name">${ex.name}</span>
      <span class="cat">${ex.cat}</span>
      ${ex.sides ? '<span class="sides-tag">links + rechts</span>' : ''}`;
    card.addEventListener('click', () => (onClick ? onClick(ex, card) : openExerciseDialog(ex)));
    return card;
  }

  function renderHome() {
    const list = $('#routine-list');
    list.innerHTML = '';
    ROUTINES.forEach((r) => list.appendChild(routineCard(r)));

    const custom = store.get('custom', []);
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
    $('#dialog-pose').innerHTML = POSES[ex.pose];
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

  const player = {
    active: false,
    steps: [],       // {ex, side: null|'links'|'rechts', secs}
    index: 0,
    remaining: 0,
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
    const step = player.steps[player.index];
    player.remaining = step.secs;

    $('#pose-figure').innerHTML = POSES[step.ex.pose];
    $('#player-title').textContent = step.ex.name;
    $('#player-hint').textContent = step.ex.desc;
    const badge = $('#side-badge');
    badge.hidden = !step.side;
    if (step.side) badge.textContent = step.side === 'links' ? '◀ Linke Seite' : 'Rechte Seite ▶';

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
    const step = player.steps[player.index];
    const ring = $('#ring-fg');
    if (reset) {
      ring.style.transition = 'none';
      ring.style.strokeDashoffset = '0';
      void ring.getBoundingClientRect(); // Reflow, damit der Reset ohne Animation greift
      ring.style.transition = '';
    }
    ring.style.strokeDashoffset = String(RING_CIRC * (1 - player.remaining / step.secs));
  }

  function tick() {
    if (player.paused) return;
    player.remaining -= 1;
    if (player.remaining <= 0) {
      chime();
      nextStep();
      return;
    }
    updateCountdown();
    if (player.remaining <= 3) beep(880, 0.1);
  }

  function nextStep() {
    if (player.index + 1 >= player.steps.length) { finish(); return; }
    player.index += 1;
    loadStep();
  }

  function prevStep() {
    if (player.index === 0) { loadStep(); return; } // aktuelle Übung neu starten
    player.index -= 1;
    loadStep();
  }

  function setPaused(paused) {
    player.paused = paused;
    $('#btn-pause').textContent = paused ? '▶' : '⏸';
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

    const stats = store.get('stats', { sessions: 0, minutes: 0 });
    stats.sessions += 1;
    stats.minutes += minutes;
    store.set('stats', stats);
    const streak = bumpStreak();

    $('#done-summary').textContent = player.single
      ? `${player.routineName} – schön dranbleiben!`
      : `${player.routineName} · ${player.steps.length} Übungen · ca. ${minutes} Minuten.`;
    $('#done-streak').textContent = streak > 1
      ? `🔥 ${streak} Tage in Folge – stark!`
      : '🌱 Streak gestartet – bis morgen!';
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
    $('#btn-sound').textContent = soundOn ? '🔊' : '🔇';
    if (!soundOn) { try { speechSynthesis?.cancel?.(); } catch {} }
  });
  $('#btn-sound').textContent = soundOn ? '🔊' : '🔇';

  $('#btn-done-home').addEventListener('click', () => { show('view-home'); renderHome(); });

  document.addEventListener('keydown', (ev) => {
    if (!player.active) return;
    if (ev.key === ' ') { ev.preventDefault(); setPaused(!player.paused); }
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
      grid.appendChild(exerciseCard(ex, {
        onClick: (exercise, card) => {
          const pos = builderSelection.indexOf(exercise.id);
          if (pos >= 0) builderSelection.splice(pos, 1);
          else builderSelection.push(exercise.id);
          grid.querySelectorAll('.exercise-card').forEach((c) => {
            const i = builderSelection.indexOf(c.dataset.id);
            c.classList.toggle('selected', i >= 0);
            if (i >= 0) c.dataset.order = i + 1;
          });
          updateBuilderSummary();
        },
      }));
    });
    updateBuilderSummary();
  }

  function updateBuilderSummary() {
    const secs = Number($('#builder-secs').value);
    const steps = builderSelection.reduce((n, id) => n + (exerciseById[id].sides ? 2 : 1), 0);
    const mins = Math.round((steps * secs) / 60);
    $('#builder-summary').textContent = builderSelection.length
      ? `${builderSelection.length} Übungen · ≈ ${mins} Min`
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
    const name = $('#builder-name').value.trim() || 'Meine Routine';
    const custom = store.get('custom', []);
    custom.push({
      id: 'c' + Date.now().toString(36),
      emoji: '⭐',
      name,
      secs: Number($('#builder-secs').value),
      items: [...builderSelection],
    });
    store.set('custom', custom);
    renderHome();
    show('view-home');
  });

  /* ===== Start ===== */
  renderHome();
})();
