"use strict";

const CALC_BTNS = [
  ['AC','fn'],['±','fn'],['%','fn'],['÷','op'],
  ['7',''],['8',''],['9',''],['×','op'],
  ['4',''],['5',''],['6',''],['−','op'],
  ['1',''],['2',''],['3',''],['+','op'],
  ['0','wide'],['.',''],['=','eq'],
];
let cVal='0', cExpr='', cOp=null, cFirst=null, cJustOp=false;

function buildCalculator() {
  return `
    <div class="calc-wrap">
      <div class="calc-display">
        <div id="cexd"></div>
        <div id="cvd">0</div>
      </div>
      <div class="calc-grid">
        ${CALC_BTNS.map(([l,t]) =>
          `<button class="calc-btn ${t}" onclick="calcPress('${l}')">${l}</button>`
        ).join('')}
      </div>
    </div>`;
}

function calcPress(k) {
  const dv=document.getElementById('cvd'), de=document.getElementById('cexd');
  if (!dv) return;
  if (k==='AC')  { cVal='0'; cExpr=''; cOp=null; cFirst=null; cJustOp=false; }
  else if (k==='±') { const n=-parseFloat(cVal); cVal=isNaN(n)?'0':String(n); }
  else if (k==='%')  cVal=String(parseFloat(cVal)/100);
  else if ('÷×−+'.includes(k)) { cFirst=parseFloat(cVal); cOp=k; cExpr=cVal+' '+k; cJustOp=true; }
  else if (k==='=') {
    if (cOp && cFirst!==null) {
      const s=parseFloat(cVal);
      let r = cOp==='+'?cFirst+s:cOp==='−'?cFirst-s:cOp==='×'?cFirst*s:s!==0?cFirst/s:NaN;
      cExpr += (cJustOp?' '+cVal:'')+' =';
      cVal = isNaN(r)?'Error':String(parseFloat(r.toFixed(10)));
      cOp=null; cFirst=null; cJustOp=false;
    }
  } else if (k==='.') {
    if (cJustOp) { cVal='0.'; cJustOp=false; }
    else if (!cVal.includes('.')) cVal+='.';
  } else {
    if (cJustOp||cVal==='0'||cVal==='Error') { cVal=k; cJustOp=false; }
    else if (cVal.length<12) cVal+=k;
  }
  dv.textContent  = cVal.length>11 ? parseFloat(cVal).toExponential(3) : cVal;
  if (de) de.textContent = cExpr;
}