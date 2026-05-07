/**
 * ZERO-G CALCULATOR
 * =================
 * Evaluation model: IMMEDIATE EXECUTION (classic pocket-calculator chaining).
 * Each binary operator applies immediately to the running accumulator.
 * e.g. 12 ÷ 3 + 4 = 8  (not 12 ÷ 7)
 *
 * Keyboard mapping:
 *   0-9, .         → digits / decimal
 *   +  -  *  /     → operators
 *   Enter / =      → equals
 *   Escape         → AC (all clear)
 *   Backspace      → delete last char
 */

(() => {
  'use strict';

  /* ── DOM refs ─────────────────────────────── */
  const displayVal   = document.getElementById('displayValue');
  const exprEl       = document.getElementById('expression');
  const floatBox     = document.getElementById('floatContainer');
  const calcShell    = document.getElementById('calcShell');
  const btnGrid      = document.getElementById('btnGrid');
  const gravToggle   = document.getElementById('gravityToggle');
  const gravLabel    = document.getElementById('gravityLabel');
  const themeToggle  = document.getElementById('themeToggle');
  const themeLabel   = document.getElementById('themeLabel');
  const themeIcon    = document.getElementById('themeIcon');
  const closeHint    = document.getElementById('closeHint');
  const usageHint    = document.getElementById('usageHint');
  const canvas       = document.getElementById('stardust');
  const ctx          = canvas.getContext('2d');

  /* ── Calculator state ─────────────────────── */
  let accumulator  = null;   // running total
  let pendingOp    = null;   // '+', '−', '×', '÷'
  let currentInput = '0';    // string the user is typing
  let freshResult  = false;  // true right after = or op
  let errorState   = false;

  /* ── Helpers ──────────────────────────────── */
  const MAX_DIGITS = 15;

  function formatNumber(n) {
    if (typeof n !== 'number' || !isFinite(n)) return 'ERROR';
    const s = parseFloat(n.toPrecision(12)).toString();
    return s.length > MAX_DIGITS ? parseFloat(n).toExponential(6) : s;
  }

  function updateDisplay() {
    displayVal.textContent = currentInput;
    displayVal.classList.toggle('error', errorState);
  }

  function setExpression(text) {
    exprEl.textContent = text || '';
  }

  /* ── Float-away effect ────────────────────── */
  function floatAwayValue(text) {
    if (!text || text === '0') return;
    const el = document.createElement('div');
    el.className = 'float-value';
    el.textContent = text;
    // slight random horizontal drift
    el.style.right = (30 + Math.random() * 40) + 'px';
    floatBox.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  /* ── Core operations ──────────────────────── */
  function compute(a, op, b) {
    switch (op) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷':
        if (b === 0) return null; // div-by-zero
        return a / b;
      default:  return b;
    }
  }

  function recoverFromError() {
    if (!errorState) return;
    errorState = false;
    accumulator = null;
    pendingOp = null;
    currentInput = '0';
    setExpression('');
    updateDisplay();
  }

  /* ── Actions ──────────────────────────────── */

  function inputDigit(d) {
    recoverFromError();
    if (freshResult) { currentInput = '0'; freshResult = false; }
    if (currentInput === '0' && d !== '.') currentInput = '';
    if (currentInput.length >= MAX_DIGITS) return;
    currentInput += d;
    updateDisplay();
  }

  function inputDecimal() {
    recoverFromError();
    if (freshResult) { currentInput = '0'; freshResult = false; }
    if (currentInput.includes('.')) return;
    currentInput += '.';
    updateDisplay();
  }

  function inputOperator(op) {
    recoverFromError();
    const val = parseFloat(currentInput);

    if (accumulator !== null && pendingOp && !freshResult) {
      const result = compute(accumulator, pendingOp, val);
      if (result === null) {
        errorState = true;
        currentInput = 'ERROR';
        setExpression('');
        accumulator = null;
        pendingOp = null;
        updateDisplay();
        return;
      }
      floatAwayValue(formatNumber(accumulator));
      accumulator = result;
      currentInput = formatNumber(result);
    } else {
      accumulator = val;
    }

    pendingOp = op;
    freshResult = true;
    setExpression(formatNumber(accumulator) + ' ' + op);
    updateDisplay();
    highlightActiveOp(op);
  }

  function inputEquals() {
    recoverFromError();
    const val = parseFloat(currentInput);

    if (accumulator !== null && pendingOp) {
      const result = compute(accumulator, pendingOp, val);
      if (result === null) {
        errorState = true;
        floatAwayValue(currentInput);
        currentInput = 'ERROR';
        setExpression('');
        accumulator = null;
        pendingOp = null;
        updateDisplay();
        return;
      }
      const prevText = currentInput;
      setExpression(formatNumber(accumulator) + ' ' + pendingOp + ' ' + formatNumber(val) + ' =');
      floatAwayValue(prevText);
      currentInput = formatNumber(result);
      accumulator = result;
      pendingOp = null;
    }

    freshResult = true;
    updateDisplay();
    clearActiveOp();
  }

  function clearEntry() {
    recoverFromError();
    floatAwayValue(currentInput);
    currentInput = '0';
    freshResult = false;
    updateDisplay();
  }

  function allClear() {
    const prev = currentInput;
    accumulator = null;
    pendingOp = null;
    currentInput = '0';
    freshResult = false;
    errorState = false;
    setExpression('');
    floatAwayValue(prev);
    updateDisplay();
    clearActiveOp();
  }

  function backspace() {
    recoverFromError();
    if (freshResult) return;
    currentInput = currentInput.slice(0, -1) || '0';
    updateDisplay();
  }

  function toggleSign() {
    recoverFromError();
    if (currentInput === '0' || currentInput === 'ERROR') return;
    currentInput = currentInput.startsWith('-')
      ? currentInput.slice(1)
      : '-' + currentInput;
    updateDisplay();
  }

  /* ── Active operator highlight ────────────── */
  function highlightActiveOp(op) {
    btnGrid.querySelectorAll('.btn--op').forEach(b => {
      b.classList.toggle('active', b.dataset.value === op);
    });
  }
  function clearActiveOp() {
    btnGrid.querySelectorAll('.btn--op').forEach(b => b.classList.remove('active'));
  }

  /* ── Button click handler ─────────────────── */
  btnGrid.addEventListener('click', e => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const action = btn.dataset.action;
    const value  = btn.dataset.value;

    switch (action) {
      case 'digit':    inputDigit(value);    break;
      case 'decimal':  inputDecimal();       break;
      case 'op':       inputOperator(value); break;
      case 'equals':   inputEquals();        break;
      case 'c':        clearEntry();         break;
      case 'ac':       allClear();           break;
      case 'backspace':backspace();          break;
      case 'sign':     toggleSign();         break;
    }
  });

  /* ── Keyboard support ─────────────────────── */
  const keyMap = {
    '0':'digit','1':'digit','2':'digit','3':'digit','4':'digit',
    '5':'digit','6':'digit','7':'digit','8':'digit','9':'digit',
    '.':'decimal',
    '+':'op','-':'op','*':'op','/':'op',
    'Enter':'equals','=':'equals',
    'Escape':'ac',
    'Backspace':'backspace',
  };
  const opSymbol = {'+':'+','-':'−','*':'×','/':'÷'};

  document.addEventListener('keydown', e => {
    const k = e.key;
    if (!(k in keyMap)) return;
    e.preventDefault();
    const action = keyMap[k];

    switch (action) {
      case 'digit':    inputDigit(k);              break;
      case 'decimal':  inputDecimal();              break;
      case 'op':       inputOperator(opSymbol[k]);  break;
      case 'equals':   inputEquals();               break;
      case 'ac':       allClear();                  break;
      case 'backspace':backspace();                 break;
    }

    // Visual press feedback
    const sel = action === 'digit'   ? `[data-value="${k}"]`
              : action === 'op'      ? `[data-value="${opSymbol[k]}"]`
              : action === 'decimal' ? `[data-action="decimal"]`
              : action === 'equals'  ? `[data-action="equals"]`
              : action === 'ac'      ? `[data-action="ac"]`
              : action === 'backspace' ? `[data-action="backspace"]`
              : null;
    if (sel) {
      const b = btnGrid.querySelector(sel);
      if (b) { b.classList.add('key-press'); setTimeout(() => b.classList.remove('key-press'), 150); }
    }
  });

  /* ── Zero-G button drift setup ────────────── */
  const allBtns = [...btnGrid.querySelectorAll('.btn')];
  let gravityOn = false;

  function applyZeroGDrift() {
    allBtns.forEach((btn, i) => {
      btn.style.setProperty('--ed', (i * 0.04) + 's');   // entrance delay
      btn.style.setProperty('--dd', (Math.random() * 3).toFixed(2) + 's');
      btn.style.setProperty('--dx', (Math.random() * 3 - 1.5).toFixed(2) + 'px');
      btn.style.setProperty('--dy', (Math.random() * 3 - 1.5).toFixed(2) + 'px');
      btn.classList.add('zero-g-drift');
    });
  }

  function removeZeroGDrift() {
    allBtns.forEach(btn => btn.classList.remove('zero-g-drift'));
  }

  applyZeroGDrift();

  /* ── Gravity toggle ───────────────────────── */
  function setGravity(on) {
    gravityOn = on;
    gravToggle.setAttribute('aria-checked', on);
    gravLabel.textContent = on ? 'GRAVITY' : 'ZERO-G';
    calcShell.classList.toggle('gravity-on', on);
    if (on) removeZeroGDrift(); else applyZeroGDrift();
  }

  gravToggle.addEventListener('click', () => setGravity(!gravityOn));
  gravToggle.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setGravity(!gravityOn); }
  });

  /* ── Theme toggle ─────────────────────────── */
  let lightTheme = false;
  function setTheme(light) {
    lightTheme = light;
    themeToggle.setAttribute('aria-checked', light);
    themeLabel.textContent = light ? 'LIGHT' : 'DARK';
    themeIcon.textContent = light ? '☀️' : '🌙';
    document.body.classList.toggle('light-theme', light);
  }

  themeToggle.addEventListener('click', () => setTheme(!lightTheme));
  themeToggle.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setTheme(!lightTheme); }
  });

  /* ── Hint dismiss ─────────────────────────── */
  closeHint.addEventListener('click', () => usageHint.classList.add('hidden'));

  /* ── Hover repel effect ───────────────────── */
  let repelRAF = null;
  btnGrid.addEventListener('mousemove', e => {
    if (repelRAF) return;
    repelRAF = requestAnimationFrame(() => {
      repelRAF = null;
      if (gravityOn) return;
      allBtns.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = cx - e.clientX;
        const dy = cy - e.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const threshold = 90;
        if (dist < threshold && dist > 0) {
          const strength = ((threshold - dist) / threshold) * 4;
          const tx = (dx / dist) * strength;
          const ty = (dy / dist) * strength;
          btn.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`;
        } else {
          btn.style.transform = '';
        }
      });
    });
  });

  btnGrid.addEventListener('mouseleave', () => {
    allBtns.forEach(btn => { btn.style.transform = ''; });
  });

  /* ══════════════════════════════════════════════
     STARDUST — ambient particle canvas
     ══════════════════════════════════════════════ */
  let stars = [];
  const STAR_COUNT = 80;

  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function initStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + 0.3,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        alpha: Math.random() * 0.5 + 0.2,
        twinkleSpeed: Math.random() * 0.008 + 0.002,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  let frameTime = 0;
  function drawStars(ts) {
    frameTime = ts;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const s of stars) {
      s.x += s.vx;
      s.y += s.vy;
      if (s.x < -5) s.x = canvas.width + 5;
      if (s.x > canvas.width + 5) s.x = -5;
      if (s.y < -5) s.y = canvas.height + 5;
      if (s.y > canvas.height + 5) s.y = -5;

      const flicker = s.alpha + Math.sin(ts * s.twinkleSpeed + s.twinkleOffset) * 0.2;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = lightTheme 
        ? `rgba(100, 150, 200, ${Math.max(0.05, flicker).toFixed(3)})`
        : `rgba(200, 220, 255, ${Math.max(0.05, flicker).toFixed(3)})`;
      ctx.fill();

      // soft glow for larger stars
      if (s.r > 1) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = lightTheme
          ? `rgba(80, 120, 180, ${(flicker * 0.12).toFixed(3)})`
          : `rgba(120, 180, 255, ${(flicker * 0.12).toFixed(3)})`;
        ctx.fill();
      }
    }

    requestAnimationFrame(drawStars);
  }

  window.addEventListener('resize', () => { resizeCanvas(); });
  resizeCanvas();
  initStars();
  requestAnimationFrame(drawStars);

  /* ── Add key-press style ──────────────────── */
  const style = document.createElement('style');
  style.textContent = `.key-press{transform:scale(.9)!important;transition:transform .08s!important}`;
  document.head.appendChild(style);
})();
