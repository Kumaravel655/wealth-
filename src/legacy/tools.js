/* Wealth Bridge — calculators (indicative only) */
(function () {
  var inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  var num = function (id) { var v = parseFloat(String(document.getElementById(id).value).replace(/[, ₹]/g, '')); return isFinite(v) && v > 0 ? v : 0; };
  var dl = function (rows) { return '<dl>' + rows.map(function (r) { return '<dt' + (r[2] ? ' class="total"' : '') + '>' + r[0] + '</dt><dd' + (r[2] ? ' class="total"' : '') + '>' + r[1] + '</dd>'; }).join('') + '</dl>'; };

  // Income tax, new regime (slabs unchanged for FY 2025-26 and Tax Year 2026-27)
  function slabTax(ti) {
    var slabs = [[400000, 0], [800000, .05], [1200000, .10], [1600000, .15], [2000000, .20], [2400000, .25], [Infinity, .30]];
    var tax = 0, prev = 0;
    for (var i = 0; i < slabs.length; i++) {
      var top = slabs[i][0];
      if (ti > prev) tax += (Math.min(ti, top) - prev) * slabs[i][1];
      prev = top;
    }
    return tax;
  }
  function it() {
    var sal = num('it-sal'), oth = num('it-oth');
    var sd = Math.min(sal, 75000);
    var ti = Math.max(0, sal - sd + oth);
    var tax = slabTax(ti), rebate = 0;
    if (ti <= 1200000) rebate = tax;
    else if (tax > ti - 1200000) rebate = tax - (ti - 1200000); // marginal relief
    var after = tax - rebate, cess = after * 0.04;
    document.getElementById('it-out').innerHTML = dl([
      ['Standard deduction', inr(sd)], ['Taxable income', inr(ti)], ['Tax on slabs', inr(tax)],
      ['Rebate / marginal relief', '− ' + inr(rebate)], ['Health & education cess (4%)', inr(cess)],
      ['Estimated tax', inr(after + cess), true]]);
  }
  function gst() {
    var amt = num('g-amt'), r = parseFloat(document.getElementById('g-rate').value) / 100;
    var mode = document.querySelector('input[name="g-mode"]:checked').value;
    var sup = document.querySelector('input[name="g-sup"]:checked').value;
    var base = mode === 'ex' ? amt : amt / (1 + r), tax = base * r;
    var rows = [['Taxable value', inr(base)]];
    if (sup === 'intra') { rows.push(['CGST', inr(tax / 2)], ['SGST', inr(tax / 2)]); }
    else rows.push(['IGST', inr(tax)]);
    rows.push(['Total GST', inr(tax)], ['Invoice value', inr(base + tax), true]);
    document.getElementById('g-out').innerHTML = dl(rows);
  }
  function emi() {
    var p = num('e-p'), r = num('e-r') / 1200, n = Math.round(num('e-n'));
    if (!p || !n) { document.getElementById('e-out').textContent = 'Enter the loan amount and tenure.'; return; }
    var m = r ? p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : p / n;
    document.getElementById('e-out').innerHTML = dl([['Monthly EMI', inr(m), true], ['Total interest', inr(m * n - p)], ['Total payment', inr(m * n)]]);
  }
  [['t-it', it], ['t-gst', gst], ['t-emi', emi]].forEach(function (t) {
    var f = document.getElementById(t[0]);
    if (!f) return;
    f.addEventListener('input', t[1]); f.addEventListener('change', t[1]); t[1]();
  });
})();
