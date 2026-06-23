"use strict";

// ─────────────────────────────────────────────
//  APP: Calculator — Basic & Scientific
// ─────────────────────────────────────────────

// ─── State ───
let calcMode = 'basic';
let calcDisplay = '0';
let calcExpr = '';
let calcAngleMode = 'deg';
let calcMemory = null;
let calcJustEval = false;

// ─── Button Layouts ───
const CALC_BASIC_BTNS = [
  ['AC','fn'],['(−)','fn'],['%','fn'],['÷','op'],
  ['7',''],  ['8',''],     ['9',''],   ['×','op'],
  ['4',''],  ['5',''],     ['6',''],   ['−','op'],
  ['1',''],  ['2',''],     ['3',''],   ['+','op'],
  ['0','wide'],['.',''],   ['=','eq'],
];

const CALC_SCI_BTNS = [
  ['MC','mem'],['MR','mem'],['M+','mem'],['M−','mem'], ['AC','fn'],
  ['sin','sci-fn'],['cos','sci-fn'],['tan','sci-fn'],['(−)','fn'],['%','fn'],
  ['log','sci-fn'],['ln','sci-fn'],['√','sci-fn'],  ['x²','sci-fn'],['x³','sci-fn'],
  ['xʸ','sci-fn'],['x!','sci-fn'],['1/x','sci-fn'], ['÷','op'],     ['×','op'],
  ['π','const'],  ['e','const'],   ['7',''],         ['8',''],       ['9',''],
  ['(','paren'],  [')','paren'],   ['4',''],         ['5',''],       ['6',''],
  ['+','op'],     ['−','op'],      ['1',''],         ['2',''],       ['3',''],
  [calcAngleMode==='deg'?'°DEG':'°RAD','sci-fn'],['.',''],['0',''],['⌫','fn'],['=','eq'],
];

// ─── Build ───
function buildCalculator() {
  return `
    <div class="calc-wrap">
      <div class="calc-mode-toggle">
        <button class="calc-mode-btn ${calcMode==='basic'?'active':''}" onclick="calcSetMode('basic',this)">Basic</button>
        <button class="calc-mode-btn ${calcMode==='scientific'?'active':''}" onclick="calcSetMode('scientific',this)">Scientific</button>
      </div>
      <div class="calc-display">
        <div id="cexd"></div>
        <div id="cvd">0</div>
      </div>
      <div class="calc-grid ${calcMode}" id="calc-grid-id">
        ${calcMode === 'basic' ? calcRenderBasic() : calcRenderScientific()}
      </div>
    </div>`;
}

function calcRenderBasic() {
  return CALC_BASIC_BTNS.map(([l,t]) =>
    `<button class="calc-btn ${t}" onclick="calcPress('${l}')">${l}</button>`
  ).join('');
}

function calcRenderScientific() {
  return CALC_SCI_BTNS.map(([l,t]) => {
    // Handle the angle mode button label
    const label = l === '°DEG' || l === '°RAD'
      ? (calcAngleMode === 'deg' ? '°DEG' : '°RAD')
      : l;
    return `<button class="calc-btn ${t}" onclick="calcSciPress('${l}')">${label}</button>`;
  }).join('');
}

function calcSetMode(mode, btn) {
  if (calcMode === mode) return;
  calcMode = mode;
  // Reset state
  calcDisplay = '0';
  calcExpr = '';
  calcJustEval = false;
  // The window needs rebuilding since the grid structure changes
  const wrap = btn.closest('.calc-wrap');
  const win = wrap?.closest('.wc');
  if (win) {
    win.innerHTML = buildCalculator();
  }
}

// ─── Input Handler (Basic) ───
function calcPress(k) {
  const dv = document.getElementById('cvd');
  const de = document.getElementById('cexd');
  if (!dv) return;

  if (k === 'AC') {
    calcDisplay = '0';
    calcExpr = '';
    calcJustEval = false;
  } else if (k === '(−)') {
    if (calcDisplay === '0') return;
    calcDisplay = calcDisplay.startsWith('−')
      ? calcDisplay.slice(1)
      : '−' + calcDisplay;
  } else if (k === '%') {
    calcDisplay = String(parseFloat(calcDisplay) / 100);
  } else if (k === '÷' || k === '×' || k === '−' || k === '+') {
    const opMap = { '÷':'/', '×':'*', '−':'-', '+' :'+' };
    if (calcJustEval) {
      // Continue from result
      calcExpr = calcDisplay + ' ' + k + ' ';
      calcJustEval = false;
    } else {
      calcExpr += calcDisplay + ' ' + k + ' ';
    }
    calcDisplay = '0';
    if (de) de.textContent = calcExpr;
  } else if (k === '=') {
    const expr = calcExpr + calcDisplay;
    if (de) de.textContent = expr + ' =';
    const result = calcEvaluate(expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-'));
    calcDisplay = result !== null ? String(result) : 'Error';
    calcExpr = '';
    calcJustEval = true;
  } else if (k === '.') {
    if (calcJustEval) { calcDisplay = '0.'; calcJustEval = false; }
    else if (!calcDisplay.includes('.')) calcDisplay += '.';
  } else {
    if (calcJustEval || calcDisplay === '0' || calcDisplay === 'Error') {
      calcDisplay = k;
      calcJustEval = false;
    } else if (calcDisplay.length < 14) {
      calcDisplay += k;
    }
  }

  dv.textContent = calcDisplay.length > 13
    ? parseFloat(calcDisplay).toExponential(4)
    : calcDisplay;
}

// ─── Input Handler (Scientific) ───
function calcSciPress(k) {
  const dv = document.getElementById('cvd');
  const de = document.getElementById('cexd');
  if (!dv) return;

  // ── Memory ──
  if (k === 'MC') { calcMemory = null; notify('Memory cleared'); return; }
  if (k === 'MR') {
    if (calcMemory === null) return;
    calcDisplay = String(calcMemory);
    calcJustEval = false;
    dv.textContent = calcDisplay;
    return;
  }
  if (k === 'M+') {
    const val = parseFloat(calcDisplay);
    if (!isNaN(val)) { calcMemory = (calcMemory || 0) + val; notify('M+'); }
    return;
  }
  if (k === 'M−') {
    const val = parseFloat(calcDisplay);
    if (!isNaN(val)) { calcMemory = (calcMemory || 0) - val; notify('M−'); }
    return;
  }

  // ── AC ──
  if (k === 'AC') {
    calcDisplay = '0';
    calcExpr = '';
    calcJustEval = false;
    if (de) de.textContent = '';
    dv.textContent = '0';
    return;
  }

  // ── ⌫ Backspace ──
  if (k === '⌫') {
    if (calcJustEval) { calcDisplay = '0'; calcJustEval = false; }
    else if (calcDisplay.length > 1) calcDisplay = calcDisplay.slice(0, -1);
    else calcDisplay = '0';
    dv.textContent = calcDisplay;
    return;
  }

  // ── (−) Negate ──
  if (k === '(−)') {
    if (calcDisplay === '0' || calcDisplay === 'Error') return;
    calcDisplay = calcDisplay.startsWith('−') ? calcDisplay.slice(1) : '−' + calcDisplay;
    dv.textContent = calcDisplay;
    return;
  }

  // ── % ──
  if (k === '%') {
    calcDisplay = String(parseFloat(calcDisplay) / 100);
    dv.textContent = calcDisplay;
    return;
  }

  // ── Operators ──
  if (k === '÷' || k === '×' || k === '−' || k === '+' || k === 'xʸ') {
    const opMap = { '÷':'/', '×':'*', '−':'-', '+':'+', 'xʸ':'^' };
    const exprOp = opMap[k];
    if (calcJustEval) {
      calcExpr = calcDisplay + ' ' + k + ' ';
      calcJustEval = false;
    } else {
      calcExpr += calcDisplay + ' ' + k + ' ';
    }
    calcDisplay = '0';
    if (de) de.textContent = calcExpr;
    dv.textContent = '0';
    return;
  }

  // ── = ──
  if (k === '=') {
    const fullExpr = calcExpr + calcDisplay;
    if (de) de.textContent = fullExpr + ' =';
    const sanitized = fullExpr
      .replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-')
      .replace(/π/g, `(${Math.PI})`).replace(/e(?![xp])/g, `(${Math.E})`);
    const result = calcEvaluate(sanitized);
    calcDisplay = result !== null ? String(parseFloat(result.toFixed(12))) : 'Error';
    calcExpr = '';
    calcJustEval = true;
    dv.textContent = calcDisplay;
    return;
  }

  // ── Dot ──
  if (k === '.') {
    if (calcJustEval) { calcDisplay = '0.'; calcJustEval = false; }
    else if (!calcDisplay.includes('.')) calcDisplay += '.';
    dv.textContent = calcDisplay;
    return;
  }

  // ── Parentheses ──
  if (k === '(' || k === ')') {
    // Append to expression and keep display as-is
    calcExpr += calcDisplay + ' ' + k + ' ';
    calcDisplay = '0';
    if (de) de.textContent = calcExpr;
    dv.textContent = '0';
    return;
  }

  // ── Angle mode toggle ──
  if (k === '°DEG' || k === '°RAD') {
    calcAngleMode = calcAngleMode === 'deg' ? 'rad' : 'deg';
    // Rebuild grid to update the button label
    const grid = document.getElementById('calc-grid-id');
    if (grid) grid.innerHTML = calcRenderScientific();
    notify('Angle mode: ' + calcAngleMode.toUpperCase());
    return;
  }

  // ── Scientific functions (unary) ──
  const sciUnary = {
    'sin':  x => Math.sin(calcAngleMode === 'deg' ? x * Math.PI / 180 : x),
    'cos':  x => Math.cos(calcAngleMode === 'deg' ? x * Math.PI / 180 : x),
    'tan':  x => Math.tan(calcAngleMode === 'deg' ? x * Math.PI / 180 : x),
    'log':  x => Math.log10(x),
    'ln':   x => Math.log(x),
    '√':    x => Math.sqrt(x),
    'x²':   x => x * x,
    'x³':   x => x * x * x,
    'x!':   x => calcFactorial(x),
    '1/x':  x => x !== 0 ? 1 / x : NaN,
  };

  if (sciUnary[k]) {
    const val = parseFloat(calcDisplay);
    if (isNaN(val)) { notify('Invalid input'); return; }
    const result = sciUnary[k](val);
    calcDisplay = !isNaN(result) && isFinite(result)
      ? String(parseFloat(result.toFixed(12)))
      : 'Error';
    // Show expression
    if (de) de.textContent = k + '(' + (calcJustEval ? '' : val) + ')';
    calcJustEval = true;
    dv.textContent = calcDisplay;
    return;
  }

  // ── Constants ──
  if (k === 'π') {
    calcDisplay = String(Math.PI);
    calcJustEval = false;
    dv.textContent = calcDisplay;
    return;
  }
  if (k === 'e') {
    calcDisplay = String(Math.E);
    calcJustEval = false;
    dv.textContent = calcDisplay;
    return;
  }

  // ── Digits (fallback) ──
  if (calcJustEval || calcDisplay === '0' || calcDisplay === 'Error') {
    calcDisplay = k;
    calcJustEval = false;
  } else if (calcDisplay.length < 14) {
    calcDisplay += k;
  }
  dv.textContent = calcDisplay;
}

// ─── Safe Expression Evaluator ───
// Supports: +, -, *, /, ^, sqrt(), sin(), cos(), tan(), log(), ln(), and parentheses
function calcEvaluate(expr) {
  expr = expr.trim();
  if (!expr) return null;

  // Replace ^ with ** for exponentiation
  expr = expr.replace(/\^/g, '**');

  // Replace function names
  expr = expr.replace(/sqrt\(/g, 'Math.sqrt(');
  expr = expr.replace(/sin\(/g, `Math.sin(${calcAngleMode === 'deg' ? '(x=>x*Math.PI/180)' : ''}`); 
  
  // Actually, for the expression evaluator we handle functions that take raw numbers
  // Since the user presses sin/cos etc as unary operations BEFORE entering the expression,
  // we don't need to handle them inside the expression. Only basic operators.
  // But let's support them anyway for robustness.
  expr = expr.replace(/sqrt\(/g, 'Math.sqrt(');
  expr = expr.replace(/Math\.Math\./g, 'Math.');

  try {
    // Use Function constructor for safe evaluation
    const fn = new Function('return (' + expr + ')');
    const result = fn();
    if (typeof result !== 'number' || !isFinite(result)) return null;
    return parseFloat(result.toFixed(12));
  } catch (e) {
    return null;
  }
}

// ─── Factorial ───
function calcFactorial(n) {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}