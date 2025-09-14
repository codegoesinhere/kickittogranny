
// === Display labels for duplicate years (e.g., 2010 Draw/Replay) ===
function computeDisplayLabels(gfRows){
  const byYear = new Map();
  gfRows.forEach((r, idx) => {
    if (!byYear.has(r.year)) byYear.set(r.year, []);
    byYear.get(r.year).push({ idx, row: r });
  });
  const labels = Array(gfRows.length).fill('');
  byYear.forEach(list => {
    list.sort((a,b) => new Date(a.row.date) - new Date(b.row.date));
    if (list.length === 1){
      labels[list[0].idx] = String(list[0].row.year);
      return;
    }
    list.forEach((item, i) => {
      const r = item.row;
      const isDraw = (typeof r.wLDiff === 'number') ? (r.wLDiff === 0)
                    : (typeof r.wScore==='number' && typeof r.lScore==='number' ? (r.wScore === r.lScore) : false);
      let suffix;
      if (i === 0 && isDraw) suffix = 'Draw';
      else if (i === 1)      suffix = 'Replay';
      else                   suffix = String.fromCharCode(65 + i);
      labels[item.idx] = `${r.year} (${suffix})`;
    });
  });
  return labels;
}

/* Utilities -------------------------------------------------------------- */

const PARTY_COLORS = {
  Labor: '#d32f2f',    // red
  Coalition: '#1976d2' // blue (Liberal/National)
};

const DUMBBELL_LINE_COLOR  = '#7f8c8d';  // the connector line
const DUMBBELL_HIGH_COLOR  = '#2ecc71';  // winner marker
const DUMBBELL_LOW_COLOR   = '#e74c3c';  // loser marker
const DUMBBELL_MARKER_SIZE = 6;          // tweak if you like

function canonicalParty(partyLabel){
  // Anything containing "Labor" → Labor; everything else = Coalition (tweak if you want Nationals green, etc.)
  return /labor/i.test(partyLabel) ? 'Labor' : 'Coalition';
}

function partyColor(partyLabel){
  return PARTY_COLORS[canonicalParty(partyLabel)] || '#666';
}

function toDate(s){
  if (s instanceof Date) return s;
  if (!s) return new Date(NaN);
  if (typeof s !== 'string') return new Date(s);

  // ISO: YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    const [y,m,d] = s.split('-').map(Number);
    return new Date(y, m-1, d);
  }

  // AU: DD/MM/YYYY or DD/MM/YY
  if (/^\d{1,2}\/\d{1,2}\/(\d{2}|\d{4})$/.test(s)) {
    let [d,m,y] = s.split('/').map(Number);
    if (y < 100) y = (y < 50) ? 2000 + y : 1900 + y;
    return new Date(y, m-1, d);
  }

  // Fallback
  const dt = new Date(s);
  return isNaN(+dt) ? new Date(NaN) : dt;
}

// If a GF row has no valid date, synthesize a "typical" GF date for that year (last Sat of Sept)
// so the government lookup still works.
function synthesizeGFDate(year){
  // last Saturday of September
  const d = new Date(year, 9-1, 30);            // Sept 30
  const day = d.getDay();                        // 0..6 (Sun..Sat)
  const offset = (day + 1) % 7;                  // days to go back to Saturday
  d.setDate(d.getDate() - offset);
  return d;
}

function normalizeGrandFinals(rows){
  const filtered = rows.filter(r => !r.drawn).map(r => {
    // Keep original fields, but compute a reliable Date object we can sort on
    const dt = toDate(r.date);
    const dateObj = isNaN(+dt) ? synthesizeGFDate(Number(r.year)) : dt;

    const wScore = (typeof r.wScore === 'number') ? r.wScore : (r.wGoals*6 + r.wBehinds);
    const lScore = (typeof r.lScore === 'number') ? r.lScore : (r.lGoals*6 + r.lBehinds);

    return { ...r, _date: dateObj, wScore, lScore };
  });

  // Sort strictly by the real/synthesized date
  filtered.sort((a,b)=> a._date - b._date);

  return filtered;
}

// removed older attachColumnHover (kept smarter version)


function parseColorToRGBA(c, alpha = 0.08){
  if (!c) return `rgba(0,0,0,${alpha})`;
  c = c.trim();
  const mRGBA = c.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)$/i);
  if (mRGBA){ const [_, r,g,b] = mRGBA; return `rgba(${r},${g},${b},${alpha})`; }
  const mHex = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (mHex){
    let h = mHex[1]; if (h.length === 3) h = h.split('').map(x=>x+x).join('');
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  const tmp = document.createElement('span'); tmp.style.color = c; document.body.appendChild(tmp);
  const rgb = getComputedStyle(tmp).color; document.body.removeChild(tmp);
  const m = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);
  return m ? `rgba(${m[1]},${m[2]},${m[3]},${alpha})` : `rgba(0,0,0,${alpha})`;
}

function attachColumnHover(chart){
  const ax = chart.xAxis[0];
  const HOVER_ID = 'hover-xband';
  let bandColor = window.__hoverBandColor || null;

  function resolveBandColor(){
    if (bandColor) return bandColor;
    // The crosshair element exists once you hover a point
    const cross = chart.container.querySelector('.highcharts-crosshair');
    if (cross){
      const stroke = cross.getAttribute('stroke') || getComputedStyle(cross).stroke || '#000';
      bandColor = parseColorToRGBA(stroke, 0.08);       // soften into a band
      window.__hoverBandColor = bandColor;              // cache globally for all charts
      return bandColor;
    }
    return 'rgba(0,0,0,0.06)'; // safe first-hover fallback
  }

  function highlight(ix){
    ax.removePlotBand(HOVER_ID);
    ax.addPlotBand({ id:HOVER_ID, from: ix-0.5, to: ix+0.5, color: resolveBandColor(), zIndex: 0 });
  }
  function clear(){ ax.removePlotBand(HOVER_ID); }

  chart.series.forEach(s => (s.points || []).forEach(p => {
    Highcharts.addEvent(p, 'mouseOver', () => highlight(p.x));
    Highcharts.addEvent(p, 'mouseOut', clear);
  }));

  Highcharts.addEvent(chart.container, 'mouseleave', clear);
}


function resolveHoverBandColor(chart){
  // 1) If you (now or later) set a CSS var, prefer it
  const css = getComputedStyle(document.documentElement);
  const varColor = (css.getPropertyValue('--hover-column-band') || '').trim();
  if (varColor) return varColor;

  // 2) If Charts 1–2 defined a crosshair color, reuse it (as a soft fill)
  const xa = chart?.xAxis?.[0];
  const cross = xa?.options?.crosshair;
  if (cross && typeof cross === 'object' && cross.color){
    return parseColorToRGBA(cross.color, 0.08);
  }

  // 3) Otherwise sniff any existing crosshair on the page and soften it
  const el = document.querySelector('.highcharts-crosshair');
  if (el){
    const stroke = el.getAttribute('stroke') || getComputedStyle(el).stroke || '#000';
    return parseColorToRGBA(stroke, 0.08);
  }

  // 4) Safe fallback
  return 'rgba(0,0,0,0.06)';
}


// 1) Build a stable, sorted election timeline once
// removed older buildGovernmentTimeline version


// 2) Lookup that uses the preprocessed timeline
// removed older governmentOnDate version


// Draw a vertical dotted "VFL → AFL" overlay ON TOP of the plot,
// positioned at the boundary between 1989 and 1990 using real tick pixels.
function ensureNameChangeOverlay(chart, labels, opts = {}){
  if (!chart || !labels || !labels.length) return;

  // Find the first label that starts with '1990'
  const idx1990 = labels.findIndex(l => /^1990\b/.test(String(l ?? '')));
  if (idx1990 < 0) return;

  const color = opts.color || '#e9eef2';
  const dash  = opts.dashStyle || 'Dot';
  const text  = opts.text || 'VFL → AFL';

  const draw = () => {
    const xa = chart.xAxis && chart.xAxis[0];
    if (!xa) return;

    // Use real tick positions to get the boundary "between" categories.
    const ticks = xa.tickPositions || [];
    // If ticks aren’t ready yet, bail quietly.
    if (!ticks.length || idx1990 <= 0 || idx1990 >= ticks.length) return;

    const prevTick = ticks[idx1990 - 1];
    const currTick = ticks[idx1990];

    const xPrev = xa.toPixels(prevTick, true);
    const xCurr = xa.toPixels(currTick, true);
    if (!Number.isFinite(xPrev) || !Number.isFinite(xCurr)) return;

    // Boundary = midpoint between the two tick pixel positions.
    const x = (xPrev + xCurr) / 2;

    const yTop = chart.plotTop;
    const yBot = chart.plotTop + chart.plotHeight;

    // Create overlay once
    if (!chart._vflafl){
      const g = chart.renderer.g('vfl-afl-overlay')
        .attr({ zIndex: 999 })
        .css({ pointerEvents: 'none' })
        .add();

      const line = chart.renderer.path(['M', x, yTop, 'L', x, yBot])
        .attr({ stroke: color, 'stroke-width': 2, dashstyle: dash })
        .add(g);

      const label = chart.renderer.text(text, x + 6, yTop + 14)
        .css({ color, fontWeight: 600, pointerEvents: 'none' })
        .add(g);

      // Clip to plot area so it never spills outside
      const clip = chart.renderer.clipRect(chart.plotLeft, chart.plotTop, chart.plotWidth, chart.plotHeight);
      g.clip(clip);

      chart._vflafl = { g, line, label, clip };
    } else {
      chart._vflafl.line.attr({ d: ['M', x, yTop, 'L', x, yBot] });
      chart._vflafl.label.attr({ x: x + 6, y: yTop + 14 });
      chart._vflafl.clip.attr({
        x: chart.plotLeft, y: chart.plotTop,
        width: chart.plotWidth, height: chart.plotHeight
      });
    }
  };

  // Draw now and on every render (resize/zoom/updates)
  if (!chart._vflaflHooked){
    Highcharts.addEvent(chart, 'render', draw);
    chart._vflaflHooked = true;
  }
  draw();
}



/* From elections → a function(date) -> partyInPower ---------------------- */

function buildGovernmentLookup(electionRows){
  // sort by date asc
  const rows = [...electionRows].sort((a,b)=> toDate(a.date) - toDate(b.date));
  return function(date){
    const target = (date instanceof Date) ? date : toDate(date);
    let last = rows[0];
    for (let i=1;i<rows.length;i++){
      const d = toDate(rows[i].date);
      if (d <= target) last = rows[i]; else break;
    }
    return last?.party ?? 'Unknown';
  };
}


/* Pre-process GF data ---------------------------------------------------- */

// removed duplicate normalizeGrandFinals (kept defensive version)




/* Build plotBands from party-per-year ----------------------------------- */

function buildPartyBands(gfRows, getGov){
  const parties = gfRows.map(r => canonicalParty(getGov(r.date)));
  const bands = [];
  if (!parties.length) return bands;

  let start = 0, cur = parties[0];
  for (let i=1;i<parties.length;i++){
    if (parties[i] !== cur){
      bands.push({ start, end: i-1, party: cur });
      start = i; cur = parties[i];
    }
  }
  bands.push({ start, end: parties.length-1, party: cur });

  return bands.map(b=>{
    const base = partyColor(b.party);
    const color = Highcharts.color(base).setOpacity(0.12).get();
    return {
      from: b.start - 0.5,
      to:   b.end + 0.5,
      color,
      label: { text: b.party, style: { color: '#e9eef2', fontWeight: '600' }, y: -1, }
    };
  });
}

/* Build series arrays for charts ---------------------------------------- */

function arraysFor(gfRows){
  const years     = gfRows.map(r => String(r.year));
  const wGoals    = gfRows.map(r => r.wGoals);
  const lGoals    = gfRows.map(r => r.lGoals);
  const wBehinds  = gfRows.map(r => r.wBehinds);
  const lBehinds  = gfRows.map(r => r.lBehinds);
  const wScore    = gfRows.map(r => r.wScore);
  const lScore    = gfRows.map(r => r.lScore);
  return { years, wGoals, lGoals, wBehinds, lBehinds, wScore, lScore };
}

// Build cumulative VIC vs Non-VIC series over time.
// Draws: count as entrants only (both teams), no premier/runner-up increments.
function buildCumulativeSeries(gfRows){
  const isVIC = s => (s || '').toUpperCase() === 'VIC';
  const isDraw = r => (typeof r.wLDiff === 'number')
    ? r.wLDiff === 0
    : (typeof r.wScore === 'number' && typeof r.lScore === 'number' ? (r.wScore === r.lScore) : false);

  let premVIC=0, premNon=0, runVIC=0, runNon=0, entVIC=0, entNon=0;

  const sPremVIC = [], sPremNon = [];
  const sRunVIC  = [], sRunNon  = [];
  const sEntVIC  = [], sEntNon  = [];

  gfRows.forEach(r => {
    // Entrants (both teams always count)
    if (isVIC(r.wState)) entVIC++; else entNon++;
    if (isVIC(r.lState)) entVIC++; else entNon++;

    // Premiers / Runners-Up (skip if draw)
    if (!isDraw(r)){
      if (isVIC(r.wState)) premVIC++; else premNon++;
      if (isVIC(r.lState)) runVIC++; else runNon++;
    }

    // Push current totals
    sPremVIC.push(premVIC); sPremNon.push(premNon);
    sRunVIC.push(runVIC);   sRunNon.push(runNon);
    sEntVIC.push(entVIC);   sEntNon.push(entNon);
  });

  return { sPremVIC, sPremNon, sRunVIC, sRunNon, sEntVIC, sEntNon };
}
// ========= Shared helpers =========
function formatAUDateLong(d) {
  return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' });
}
function getPartyForDateSafe(dt) {
  if (typeof getPartyForDate === 'function') return getPartyForDate(dt);
  if (typeof partyForDate === 'function') return partyForDate(dt);
  return null;
}
function partyBgClassSafe(party) {
  if (!party) return '';
  const p = (party + '').toLowerCase();
  if (p.includes('labor')) return 'party-labor row-labor';
  if (p.includes('coalition') || p.includes('liberal') || p.includes('nationals')) return 'party-coalition row-coalition';
  return '';
}
// Score helpers (use total “points” if G/B available; else precomputed fields)
function toPoints(g, b, fallback) {
  if (g != null && b != null) return (g * 6 + b);
  return (fallback != null ? fallback : null);
}
// function getPremierRunnerScores(gf) {
//   const pTot = toPoints(gf.premierGoals, gf.premierBehinds, gf.premierScore);
//   const rTot = toPoints(gf.runnerGoals,  gf.runnerBehinds,  gf.runnerScore);
//   return { pTot, rTot };
// }

function getPremierRunnerScores(gf) {
  // Support both naming schemes:
  const pTot = toPoints(
    gf.premierGoals ?? gf.wGoals,
    gf.premierBehinds ?? gf.wBehinds,
    gf.premierScore ?? gf.wScore
  );
  const rTot = toPoints(
    gf.runnerGoals ?? gf.lGoals,
    gf.runnerBehinds ?? gf.lBehinds,
    gf.runnerScore ?? gf.lScore
  );
  return { pTot, rTot };
}


// ========= Table 11 (dates, earliest → latest in season) =========
function sortBySeasonPosition(a, b) {
  const da = new Date(a.date), db = new Date(b.date);
  const keyA = (da.getMonth() * 31) + da.getDate();
  const keyB = (db.getMonth() * 31) + db.getDate();
  return keyA - keyB;
}
function buildGFDatesTable(tableId, toggleBtnId, initialLimit = 10) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;

  const rows = grandFinals.slice().sort(sortBySeasonPosition);

  tbody.innerHTML = '';

  rows.forEach((gf, idx) => {
    const d = new Date(gf.date);
    const party = getPartyForDateSafe(d) || gf.party || gf.partyInPower || '';
    const partyClass = partyBgClassSafe(party);
    const totals = getPremierRunnerScores(gf);
    const pTot = totals.pTot, rTot = totals.rTot;

    const tr = document.createElement('tr');
    if (partyClass) tr.classList.add(...partyClass.split(' '));
    tr.innerHTML = `
      <td>${gf.year}</td>
      <td>${gf.premier || gf.premiers || gf.winner || ''}</td>
      <td>${(pTot != null && rTot != null) ? `${pTot}-${rTot}` : ''}</td>
      <td>${gf.runnerUp || gf.runnersUp || gf.runner || gf.loser || ''}</td>
      <td>${formatAUDateLong(d)}</td>
      <td>${party}</td>
    `;
    tbody.appendChild(tr);
  });

  // Re-apply group collapsing so only the first N show when collapsed
  refreshCollapsibleGroup('gfdates', ['tblGFDates','tblGFTotals'], 10);

}

// ========= Table 11B (totals, lowest → highest) =========
function buildGFTotalsTable(tableId, toggleBtnId, initialLimit = 10) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;

  const rows = grandFinals.slice();

  const rows2 = rows.map(gf => {
    const d = new Date(gf.date);
    const party = getPartyForDateSafe(d) || gf.party || gf.partyInPower || '';
    const totals = getPremierRunnerScores(gf);
    const pTot = totals.pTot, rTot = totals.rTot;
    const total = (pTot != null && rTot != null) ? (pTot + rTot) : null;
    return { gf, d, party, total };
  }).sort((a, b) => {
    if (a.total == null && b.total == null) return 0;
    if (a.total == null) return 1;
    if (b.total == null) return -1;
    if (a.total !== b.total) return a.total - b.total;
    const keyA = (a.d.getMonth() * 31) + a.d.getDate();
    const keyB = (b.d.getMonth() * 31) + b.d.getDate();
    return keyA - keyB;
  });

  tbody.innerHTML = '';

  rows2.forEach(({ gf, d, party, total }) => {
    const partyClass = partyBgClassSafe(party);
    const tr = document.createElement('tr');
    if (partyClass) tr.classList.add(...partyClass.split(' '));
    tr.innerHTML = `
      <td>${gf.year}</td>
      <td>${gf.premier || gf.premiers || gf.winner || ''}</td>
      <td>${gf.runnerUp || gf.runnersUp || gf.runner || gf.loser || ''}</td>
      <td>${total != null ? total : ''}</td>
      <td>${formatAUDateLong(d)}</td>
      <td>${party}</td>
    `;
    tbody.appendChild(tr);
  });

  // Re-apply group collapsing so only the first N show when collapsed
  refreshCollapsibleGroup('gfdates', ['tblGFDates','tblGFTotals'], 10);
}

// === Chart 11 helpers: "When was the GF held?" ===
// Color by month to make Sep vs Oct obvious
function monthColor(d) { // 0=Jan ... 9=Oct
  const m = new Date(d).getMonth();
  if (m === 8)  return '#4e79a7'; // September
  if (m === 9)  return '#f28e2b'; // October
  return '#999999';               // Rare other months (fallback)
}

// Option A: Calendar-position scatter (x = day-in-year, y = year)
function buildGFCalendarScatter(containerId) {
  const pts = grandFinals.map(gf => {
    const d = new Date(gf.date);
    // Use a constant year (2000) so x-axis runs Jan→Dec once
    const x = Date.UTC(2000, d.getMonth(), d.getDate());
    return { x, y: gf.year, name: String(gf.year), color: monthColor(gf.date) };
  });
  const xs = pts.map(p => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const fortnight = 7 * 24 * 60 * 60 * 1000;

  return Highcharts.chart(containerId, {
    chart: { type: 'scatter', spacingTop: 12 },
    title: { text: 'Calendar position by year' },
  xAxis: {
    type: 'datetime',
    // Tighten the window to [earliest-14d, latest+14d]
    min: minX - fortnight,
    max: maxX + fortnight,
    dateTimeLabelFormats: { day: '%e %b', month: '%b' },
    tickInterval: 1000 * 60 * 60 * 24 * 7, // weekly ticks work better in this tighter view
    gridLineWidth: 1
  },
    yAxis: {
      title: { text: 'Year' },
      tickInterval: 2,
      reversed: true
    },
    legend: { enabled: false },
    tooltip: {
      pointFormatter: function () {
        const d = new Date(this.x);
        const label = d.toLocaleString('en-AU', { day: 'numeric', month: 'long' });
        return `<b>${this.name}</b><br>${label}`;
      }
    },
    plotOptions: {
      series: {
        marker: { radius: 4, symbol: 'circle' },
        dataLabels: {
          enabled: true,
          formatter: function(){ return this.point.name; },
          style: { textOutline: 'none', fontSize: '10px', color: '#666' }
        }
      }
    },
    series: [{ name: 'GF', data: pts }]
  });
}

// builder
function buildGFPieMonth(containerId) {
  let sep = 0, oct = 0, other = 0;
  grandFinals.forEach(gf => {
    const m = new Date(gf.date).getMonth();
    if (m === 8) sep++; else if (m === 9) oct++; else other++;
  });
  Highcharts.chart(containerId, {
    chart: { type: 'pie', spacingTop: 12 },
    title: { text: 'Grand Finals by Month (Sep vs Oct)' },
    tooltip: { pointFormat: '<b>{point.y}</b> ({point.percentage:.1f}%)' },
    plotOptions: { pie: { dataLabels: { enabled: true, format: '{point.name}: {point.y} ({point.percentage:.1f}%)', style: { textOutline: 'none', color: 'white' } } } },
    series: [{ data: [
      { name: 'September', y: sep, color: '#4e79a7' },
      { name: 'October',   y: oct, color: '#f28e2b' }
    ].concat(other ? [{ name: 'Other', y: other, color: '#bbbbbb' }] : []) }]
  });
}

// --- Religion helpers ---
// For any region object (vic or aus), return a safe value for a given label
function relGet(regionObj, label){
  return (regionObj && Number.isFinite(regionObj[label])) ? regionObj[label] : 0;
}

// Build a year selector from absRelStats (sorted ascending; skip duplicates)
function populateCensusYearSelect(selectId = 'censusYearSelect'){
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const years = [...new Set(absRelStats.map(r => r.censusYear))].sort((a,b)=> a-b);
  sel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');

  // Default to 1986 if present, otherwise latest
  sel.value = years.includes(1986) ? 1986 : years[years.length - 1];
}

// Compute sorted top entries (by value desc), insert AFL into its rightful spot.
// Returns { categories: [...], data: [...], hiddenPointsIndex: Set(indices to hide) }
function buildTopReligionSeriesForYear(censusYear, regionKey /* 'vic' | 'aus' */, opts = { showNR: true, showNS: true, maxVisible: 12 }){
  const row = absRelStats.find(r => r.censusYear === censusYear) || {};
  const region = row[regionKey] || null;

  // If no data for the region/year, return empty structures
  if (!region) return { categories: [], data: [], hiddenPointsIndex: new Set() };

  // Collect entries (exclude AFL/No religion/Not stated for top-10 computation first)
  const SPECIAL = new Set(['AFL', 'No religion', 'Not stated']);
  const entries = Object.keys(region)
    .filter(k => !SPECIAL.has(k))
    .map(k => ({ name: k, value: +region[k] || 0 }));

  // Sort by value desc and take top 10
  entries.sort((a,b)=> b.value - a.value);
  const top10 = entries.slice(0, 10);

  // Insert AFL in its natural position among ALL categories (compared to top10’s values)
  const aflVal = relGet(region, 'AFL');
  const withAfl = [...top10];
  if (aflVal > 0){
    let ins = withAfl.findIndex(e => aflVal > e.value);
    if (ins === -1) ins = withAfl.length;
    withAfl.splice(ins, 0, { name: 'AFL', value: aflVal, isAfl: true });
  }

  // Append "No religion" and "Not stated" at their positions *if* you want them visible in the order.
  // BUT we’ll default them hidden via point options (visible:false).
  const NR = relGet(region, 'No religion');
  const NS = relGet(region, 'Not stated');

  // Where would they rank compared to withAfl list?
  function insertAtRank(list, label, val){
    if (val <= 0) return list;
    let idx = list.findIndex(e => val > e.value);
    if (idx === -1) idx = list.length;
    const pt = { name: label, value: val, special: true };
    list = [...list];
    list.splice(idx, 0, pt);
    return list;
  }

  let finalList = withAfl;
  if (opts && opts.showNR) finalList = insertAtRank(finalList, 'No religion', NR);
  if (opts && opts.showNS) finalList = insertAtRank(finalList, 'Not stated', NS);

  // Build categories and data points; mark NR/NS as hidden initially; AFL gets a special color
  const categories = finalList.map(e => e.name);
  const data = finalList.map(e => {
    const base = { y: e.value };
    if (e.isAfl) {
      base.color = '#f1c40f'; // AFL golden/yellow
      base.dataLabels = { enabled: true, style: { fontWeight: '600' } };
    }
    if (e.special) {
      const isNR = e.name === 'No religion';
      base.color = isNR ? '#9aa7b0' : '#c7ced4';
    }
    return base;
  });

  // Enforce a maximum visible count if requested (e.g., keep to 12 when specials are shown)
  if (opts && typeof opts.maxVisible === 'number') {
    if (data.length > opts.maxVisible) {
      let toDrop = data.length - opts.maxVisible;
      for (let i = data.length - 1; i >= 0 && toDrop > 0; i--) {
        const name = categories[i];
        const isSpecial = (name === 'AFL' || name === 'No religion' || name === 'Not stated');
        if (!isSpecial) {
          categories.splice(i, 1);
          data.splice(i, 1);
          toDrop--;
        }
      }
    }
  }

  // Track which are hidden for quick toggles
  const hiddenPointsIndex = new Set();
  finalList.forEach((e, i) => { if (e.special) hiddenPointsIndex.add(i); });

  return { categories, data, hiddenPointsIndex };
}

// Rank AFL vs Top-10 religions (excludes "No religion" & "Not stated").
// Resulting rank is 1..11 (10 religions + AFL). Missing region/year => null.
function buildAflTop10RankSeries(regionKey){
  const years = [...new Set(absRelStats.map(r => r.censusYear))].sort((a,b)=> a-b);

  const points = years.map(year => {
    const row = absRelStats.find(r => r.censusYear === year);
    const region = row && row[regionKey];
    if (!region) return { x: year, y: null };

    const SPECIAL = new Set(['AFL','No religion','Not stated']);

    // Collect non-special religions
    const religions = Object.keys(region)
      .filter(k => !SPECIAL.has(k))
      .map(k => ({ name: k, value: +region[k] || 0 }));

    if (religions.length === 0) return { x: year, y: null };

    // Top 10 by value
    religions.sort((a,b)=> b.value - a.value);
    const top10 = religions.slice(0, 10);

    // Insert AFL by its value
    const aflVal = +((region['AFL'] != null) ? region['AFL'] : 0);
    const withAfl = [...top10];
    // Insert position among top10
    let ins = withAfl.findIndex(e => aflVal > e.value);
    if (ins === -1) ins = withAfl.length;
    withAfl.splice(ins, 0, { name: 'AFL', value: aflVal });

    // Rank = 1-based index of AFL in this 11-length list
    const rank = 1 + withAfl.findIndex(e => e.name === 'AFL');
    return { x: year, y: Number.isFinite(rank) ? rank : null };
  });

  return { years, points };
}

/* Chart builders --------------------------------------------------------- */
function baseColumnOptions({renderTo, titleText, categories, plotBands}){
  return {
    chart: { type: 'column', renderTo },
    title: { text: null },
    xAxis: {
      type: 'category',
      categories,           // index order = year order from normalizeGrandFinals
      crosshair: true,
      plotBands
    },
    yAxis: { title: { text: titleText } },
    legend: { itemStyle:{ fontWeight:'500' } },
    tooltip: { shared: true, valueDecimals: 0 },
    plotOptions: {
      series: {
        borderWidth: 0,
        pointPadding: 0.05,
        groupPadding: 0.12,
        dataSorting: { enabled: false }   // <- keep our order
      }
    },
    credits: { enabled:false },
    accessibility: { enabled: true }
  };
}

function buildChart1(containerId, data, plotBands, labels){
  const nameChangeLine = buildNameChangeLine(labels);

  // Reuse the same grouped-column base as Chart 2
  const opts = baseColumnOptions({
    renderTo: containerId,
    titleText: 'Goals',
    categories: labels,
    plotBands
  });

  // Add the VFL→AFL line
  opts.xAxis.plotLines = nameChangeLine ? [nameChangeLine] : [];

  // Match the padding/zIndex pattern you liked from Chart 2
  opts.series = [
    { name: 'Premiers Goals',   data: data.wGoals, color: '#2ecc71', pointPadding: 0.18, zIndex: 2 },
    { name: 'Runners-up Goals', data: data.lGoals, color: '#e74c3c', pointPadding: 0.30, zIndex: 1, opacity: 0.9 }
  ];

  return new Highcharts.Chart(opts);
}

function buildChart2(containerId, data, plotBands, labels){
  const nameChangeLine = buildNameChangeLine(labels);

  const opts = baseColumnOptions({
    renderTo: containerId,
    titleText: 'Behinds (Points)',
    categories: labels,
    plotBands
  });

    opts.xAxis.plotLines = nameChangeLine ? [nameChangeLine] : [];

    opts.series = [
    { 
        name:'Premiers Behinds', 
        data: data.wBehinds,
        color: '#2ecc71',        // green
        pointPadding: 0.18,
        zIndex: 2
    },
    { 
        name:'Runners-up Behinds',  
        data: data.lBehinds,
        color: '#e74c3c',        // red
        pointPadding: 0.30,
        zIndex: 1,
        opacity: 0.9
    }
    ];
  return new Highcharts.Chart(opts);
}

function buildChart3(containerId, data, plotBands, labels){
  const nameChangeLine = buildNameChangeLine(labels);

  const opts = baseColumnOptions({
    renderTo: containerId,
    titleText: 'Total Score',
    categories: labels,
    plotBands
  });

  opts.xAxis.plotLines = nameChangeLine ? [nameChangeLine] : [];

  opts.series = [
    { name: 'Premiers Score', data: data.wScore, color: '#2ecc71', pointPadding: 0.18 },
    { name: 'Runners-up Score', data: data.lScore, color: '#e74c3c', pointPadding: 0.30 }
  ];
  return new Highcharts.Chart(opts);
}

function buildChart4(containerId, gfRows, plotBands, labels){
  const nameChangeLine = buildNameChangeLine(labels);

  const data = gfRows.map((r, i) => {
    const isDraw = (typeof r.wLDiff === 'number')
      ? r.wLDiff === 0
      : (typeof r.wScore === 'number' && typeof r.lScore === 'number' ? r.wScore === r.lScore : false);

    // Use point object form: { x, low, high, color }
    return {
      x: i,
      low: r.lScore,
      high: r.wScore,
      name: labels[i],
      // Special coloring if draw
      color: isDraw ? '#f1c40f' : DUMBBELL_HIGH_COLOR,   // winner marker
      lowColor: isDraw ? '#f1c40f' : DUMBBELL_LOW_COLOR, // loser marker
      connectorColor: isDraw ? '#f1c40f' : DUMBBELL_LINE_COLOR
    };
  });

  return Highcharts.chart(containerId, {
    chart: { type: 'dumbbell', spacingTop: 28 },
    title: { text: null },
    legend: { enabled: false },
    xAxis: {
      type: 'category',
      categories: labels,
      plotLines: buildNameChangeLine(labels) ? [buildNameChangeLine(labels)] : [],
      uniqueNames: false,
      tickLength: 0,
      plotBands,
      
      ordinal: false
    },
    yAxis: { title: { text: 'Total Score' } },
    tooltip: {
      formatter: function () {
        const low   = this.point.low;
        const high  = this.point.high;
        const delta = high - low;
        return `<b>${this.point.name}</b><br/>Runners-Up: ${low}<br/>Premiers: ${high}<br/>Δ: ${delta}`;
      },
      useHTML: true
    },
series: [{
  data,
  connectorWidth: 2,
  marker: {
    enabled: true,
    radius: DUMBBELL_MARKER_SIZE,
    states: {
      hover: {
        enabled: true,
        radius: DUMBBELL_MARKER_SIZE + 2,   // enlarge marker slightly
        lineWidth: 2,
        lineColor: '#fff'
      }
    }
  },
  states: {
    hover: {
      enabled: true,
      lineWidthPlus: 0,
      brightness: 0.2   // <- same “brighten on hover” effect as columns
    }
  },
  dataSorting: { enabled: false }
}],
    credits: { enabled: false },
    accessibility: { enabled: true }
  });
}

// New Chart 5: score scatter (two markers per game, no connecting line)
function buildChart5(containerId, gfRows, plotBands, labels){
  // Horizontal offsets so two points per category don’t overlap
  const OFF_PREMIERS   = -0.16;
  const OFF_RUNNERSUP  =  0.16;

  const isVIC = s => (s||'').toUpperCase() === 'VIC';

  // Build four series for clear legend control & shape control
  const premiersVIC = [];
  const premiersOTH = [];
  const runnersVIC  = [];
  const runnersOTH  = [];

  gfRows.forEach((r, idx) => {
    const xPrem = idx + OFF_PREMIERS;
    const xRUp  = idx + OFF_RUNNERSUP;

    // Premiers point
    const p = { x: xPrem, y: r.wScore, name: labels[idx],
                team: r.winner, state: r.wState, opp: r.loser, oppState: r.lState, year: r.year };
    if (isVIC(r.wState)) premiersVIC.push(p); else premiersOTH.push(p);

    // Runners-Up point
    const q = { x: xRUp, y: r.lScore, name: labels[idx],
                team: r.loser, state: r.lState, opp: r.winner, oppState: r.wState, year: r.year };
    if (isVIC(r.lState)) runnersVIC.push(q); else runnersOTH.push(q);
  });

  return Highcharts.chart(containerId, {
    chart: { type: 'scatter', spacingTop: 28 },
    title: { text: null },
    xAxis: {
      categories: labels,          // one slot per game (e.g., “2010 (Draw)”, “2010 (Replay)”)
      tickLength: 0,
      plotBands,
      ordinal: false
    },
    yAxis: {
      title: { text: 'Score' }
    },
    legend: { itemStyle:{ fontWeight:'500' } },
    tooltip: {
      useHTML: true,
      formatter: function(){
        // this.point has the rich context we set above
        const role = (this.series.name.startsWith('Premiers')) ? 'Premiers' : 'Runners-Up';
        return `<b>${this.point.name}</b><br/>
                ${role}: ${this.point.team} (${this.point.state}) — ${this.y}<br/>
                Opponent: ${this.point.opp} (${this.point.oppState})`;
      }
    },
    plotOptions: {
      scatter: {
        marker: { radius: 6 },
        dataSorting: { enabled: false }
      },
      series: {
        // ensure our x offsets are respected
        pointPlacement: 0
      }
    },
    series: [
      { name:'Premiers (VIC)',     data: premiersVIC,  color: DUMBBELL_HIGH_COLOR, marker:{ symbol:'circle'  } },
      { name:'Premiers (Non-VIC)', data: premiersOTH,  color: DUMBBELL_HIGH_COLOR, marker:{ symbol:'diamond' } },
      { name:'Runners-Up (VIC)',   data: runnersVIC,   color: DUMBBELL_LOW_COLOR,  marker:{ symbol:'circle'  } },
      { name:'Runners-Up (Non-VIC)', data: runnersOTH, color: DUMBBELL_LOW_COLOR,  marker:{ symbol:'diamond' } },
    ],
    credits: { enabled:false },
    accessibility: { enabled:true }
  });
}

function buildChart6(containerId, gfRows, plotBands, labels){
  const S = buildCumulativeSeries(gfRows);

  return Highcharts.chart(containerId, {
    chart: { type: 'line', spacingTop: 28 },
    title: { text: null },
    xAxis: {
      categories: labels,
      tickLength: 0,
      plotBands,
      ordinal: false
    },
    yAxis: {
      title: { text: 'Cumulative total' },
      allowDecimals: false
    },
    tooltip: {
      shared: true,
      useHTML: true,
      formatter: function(){
        const i = this.points?.[0]?.point?.index ?? this.x;
        const yr = labels[i];
        return `<b>${yr}</b><br/>` + this.points.map(p =>
          `${p.series.name}: ${p.y}`
        ).join('<br/>');
      }
    },
    legend: { itemStyle:{ fontWeight:'500' } },
    plotOptions: {
      series: { marker: { enabled: false }, dataSorting: { enabled: false } }
    },
    series: [
      // Premiers
      { name: 'Premiers (VIC)',     data: S.sPremVIC, color: DUMBBELL_HIGH_COLOR, dashStyle: 'Solid' },
      { name: 'Premiers (Non-VIC)', data: S.sPremNon, color: DUMBBELL_HIGH_COLOR, dashStyle: 'ShortDash' },

      // Runners-Up
      { name: 'Runners-Up (VIC)',     data: S.sRunVIC, color: DUMBBELL_LOW_COLOR, dashStyle: 'Solid' },
      { name: 'Runners-Up (Non-VIC)', data: S.sRunNon, color: DUMBBELL_LOW_COLOR, dashStyle: 'ShortDash' },

      // Entrants (neutral grey to distinguish from result lines)
      { name: 'Entrants (VIC)',     data: S.sEntVIC, color: '#95a5a6', dashStyle: 'Solid', visible: false },
      { name: 'Entrants (Non-VIC)', data: S.sEntNon, color: '#7f8c8d', dashStyle: 'ShortDash' }
    ],
    credits: { enabled:false },
    accessibility: { enabled:true }
  });
}

function buildRelBar(containerId, categories, data){
  return Highcharts.chart(containerId, {
    chart: { type: 'bar', spacingTop: 20 },
    title: { text: null },
    xAxis: {
      categories,
      labels: { style: { fontSize: '12px' } }
    },
    yAxis: {
      title: { text: 'People' },
      allowDecimals: false
    },
    legend: { enabled: false },
    tooltip: {
      pointFormatter: function(){
        return `<b>${this.category}</b>: ${Highcharts.numberFormat(this.y, 0)}`;
      },
      useHTML: true
    },
    plotOptions: {
      series: {
        dataSorting: { enabled: false },
        pointPadding: 0.08,
        groupPadding: 0.1,
        borderWidth: 0
      }
    },
    series: [{
      name: 'Count',
      data
    }],
    credits: { enabled: false }
  });
}

function buildRelRankLine(containerId){
  const vicSeries = buildAflTop10RankSeries('vic');
  const ausSeries = buildAflTop10RankSeries('aus');
  const years = vicSeries.years;

  return Highcharts.chart(containerId, {
    chart: { type: 'line', spacingTop: 20 },
    title: { text: null },
    xAxis: { categories: years, tickLength: 0 },
    yAxis: {
      title: { text: 'AFL Rank vs Top 10 Religions' },
      reversed: true,
      allowDecimals: false,
      min: 1,
      max: 12,              // 👈 lock to 1..10
      startOnTick: true,
      endOnTick: true,
      tickInterval: 1       // show only whole ranks
    },
    tooltip: {
      shared: true,
      formatter: function () {
        // With categories, this.x can be an index — grab the category label instead
        const year =
          (this.points && this.points[0] && this.points[0].point && this.points[0].point.category != null)
            ? this.points[0].point.category
            : this.x;

        return `<b>${year}</b><br/>` + this.points.map(p => {
          const v = (p.y == null) ? '—' : p.y;
          return `${p.series.name}: ${v}`;
        }).join('<br/>');
      }
    },
    legend: { itemStyle: { fontWeight: '500' } },
    series: [
      { name:'Victoria',  data: vicSeries.points.map(p => p.y), color: '#3498db' },
      { name:'Australia', data: ausSeries.points.map(p => p.y), color: '#f28e2b' }
    ],
    credits: { enabled: false }
  });
}

function buildNameChangeLine(labels){
  // Find the index of 1990 (or 1990 (Replay) if using draw labels)
  const idx = labels.findIndex(l => l.startsWith('1990'));
  if (idx === -1) return null;

  return {
    color: '#e9eef2',
    dashStyle: 'Dot',
    width: 2,
    value: idx - 0.5,   // <-- put the line BETWEEN 1989 and 1990
    zIndex: 5,
    label: {
      text: 'VFL → AFL',
      style: { color: '#e9eef2', fontWeight: '600' },
      rotation: 0,
      textAlign: 'left',
      y: 12,
      x: 4
    }
  };
}


// Render Top-N table rows into <tbody>
function renderTopGoalsTables(gfRows, getGov){
  // Winner goals: sort desc by wGoals
  const topW = [...gfRows]
    .filter(r => typeof r.wGoals === 'number')
    .sort((a,b)=> b.wGoals - a.wGoals)

  // Loser goals: sort desc by lGoals
  const topL = [...gfRows]
    .filter(r => typeof r.lGoals === 'number')
    .sort((a,b)=> b.lGoals - a.lGoals)

  // Render helper
  function fillBody(tbodyId, rows, getName, getGoals, isWinner){
    const tbody = document.querySelector(`#${tbodyId} tbody`);
    if (!tbody) return;
    tbody.innerHTML = rows.map(r => {
      const party = getGov(r.date);
      const cls = partyBgClassSafe(party);
      const name = getName(r) || '—';
      const goals = (typeof getGoals(r) === 'number') ? getGoals(r) : '—';
      return `
        <tr class="${cls}">
          <td>${r.year}</td>
          <td>${name}</td>
          <td class="num">${goals}</td>
          <td>${party}</td>
        </tr>
      `;
    }).join('');
  }

  fillBody('tblTopWinnerGoals', topW, r => r.winner, r => r.wGoals, true);
  fillBody('tblTopLoserGoals',  topL, r => r.loser,  r => r.lGoals, false);
}

function renderTopBehindsTables(gfRows, getGov){
  const topW = [...gfRows].filter(r => typeof r.wBehinds === 'number')
    .sort((a,b) => b.wBehinds - a.wBehinds);

  const topL = [...gfRows].filter(r => typeof r.lBehinds === 'number')
    .sort((a,b) => b.lBehinds - a.lBehinds);

  function fillBody(tbodyId, rows, getName, getVal){
    const tbody = document.querySelector(`#${tbodyId} tbody`);
    if (!tbody) return;
    tbody.innerHTML = rows.map(r => {
      const party = getGov(r.date);
      return `
        <tr class="${partyBgClassSafe(party)}">
          <td>${r.year}</td>
          <td>${getName(r) ?? '—'}</td>
          <td class="num">${getVal(r) ?? '—'}</td>
          <td>${party}</td>
        </tr>`;
    }).join('');
  }

  fillBody('tblTopWinnerBehinds', topW, r => r.winner, r => r.wBehinds);
  fillBody('tblTopLoserBehinds',  topL, r => r.loser,  r => r.lBehinds);
}

function renderTopScoreTables(gfRows, getGov){
  const topW = [...gfRows].filter(r => typeof r.wScore === 'number')
    .sort((a,b) => b.wScore - a.wScore);

  const topL = [...gfRows].filter(r => typeof r.lScore === 'number')
    .sort((a,b) => b.lScore - a.lScore);

  function fillBody(tbodyId, rows, getName, getVal){
    const tbody = document.querySelector(`#${tbodyId} tbody`);
    if (!tbody) return;
    tbody.innerHTML = rows.map(r => {
      const party = getGov(r.date);
      return `
        <tr class="${partyBgClassSafe(party)}">
          <td>${r.year}</td>
          <td>${getName(r) ?? '—'}</td>
          <td class="num">${getVal(r) ?? '—'}</td>
          <td>${party}</td>
        </tr>`;
    }).join('');
  }

  fillBody('tblTopWinnerScores', topW, r => r.winner, r => r.wScore);
  fillBody('tblTopLoserScores',  topL, r => r.loser,  r => r.lScore);
}

function renderNonVicTables(gfRows, getGov){
  const isNonVIC = s => (s || '').toUpperCase() !== 'VIC';

  // Oldest → newest
  const nonVicPremiers = [...gfRows]
    .filter(r => isNonVIC(r.wState))
    .sort((a,b) => (a.year - b.year));

  const nonVicRunners  = [...gfRows]
    .filter(r => isNonVIC(r.lState))
    .sort((a,b) => (a.year - b.year));

  function fillBody(tbodyId, rows, getTeam, getState){
    const tbody = document.querySelector(`#${tbodyId} tbody`);
    if (!tbody) return;
    tbody.innerHTML = rows.map(r => {
      const party = getGov(r.date);
      return `
        <tr class="${partyBgClassSafe(party)}">
          <td>${r.year}</td>
          <td>${getTeam(r) ?? '—'}</td>
          <td>${getState(r) ?? '—'}</td>
          <td>${party}</td>
        </tr>`;
    }).join('');
  }

  fillBody('tblPremiersNonVIC', nonVicPremiers, r => r.winner, r => r.wState);
  fillBody('tblRunnersNonVIC',  nonVicRunners,  r => r.loser,  r => r.lState);
}

// Compute absolute margin safely (prefers r.wLDiff if present, else wScore-lScore)
function getAbsDiff(r){
  let signed = (typeof r.wLDiff === 'number')
    ? r.wLDiff
    : (typeof r.wScore === 'number' && typeof r.lScore === 'number'
        ? (r.wScore - r.lScore)
        : null);
  return (typeof signed === 'number') ? Math.abs(signed) : null;
}

function renderMarginTables(gfRows, getGov){
  // Build a clean list with absolute diff
  const rows = gfRows.map(r => ({
    year: r.year,
    winner: r.winner,
    loser: r.loser,
    date: r.date,
    diff: getAbsDiff(r)
  })).filter(x => typeof x.diff === 'number');

  // Closest (ascending) & Biggest (descending)
  const closest = [...rows].sort((a,b)=> a.diff - b.diff);
  const biggest = [...rows].sort((a,b)=> b.diff - a.diff);

  function fillBody(tbodyId, list){
    const tbody = document.querySelector(`#${tbodyId} tbody`);
    if (!tbody) return;
    tbody.innerHTML = list.map(x => {
      const party = getGov(x.date);
      return `
        <tr class="${partyBgClassSafe(party)}">
          <td>${x.year}</td>
          <td>${x.winner ?? '—'}</td>
          <td>${x.loser ?? '—'}</td>
          <td class="num">${x.diff}</td>
          <td>${party}</td>
        </tr>
      `;
    }).join('');
  }

  fillBody('tblClosestMargins', closest);
  fillBody('tblBiggestMargins', biggest);
}

function buildGovernmentTimeline(electionRows, handoverDays = 0){
  return (electionRows || [])
    .map(r => {
      const d = toDate(r.date);
      return { _start: new Date(d.getTime() + handoverDays*86400000), party: r.party };
    })
    .filter(r => !isNaN(+r._start))
    .sort((a,b)=> a._start - b._start);
}

function governmentOnDate(timeline, when){
  const target = when instanceof Date ? when : toDate(when);
  if (!timeline || !timeline.length || isNaN(+target)) return 'Unknown';
  let last = timeline[0].party;
  for (let i=1;i<timeline.length;i++){
    if (timeline[i]._start <= target) last = timeline[i].party; else break;
  }
  return last;
}

// Safe wrapper: gives you a getGov(date) you can pass everywhere
function makeGetGov(electionRows, handoverDays = 0){
  const tl = buildGovernmentTimeline(electionRows, handoverDays);
  if (!tl.length) console.warn('No valid VIC elections found; bands/tints will show "Unknown".');
  return (date) => governmentOnDate(tl, date);
}

/**
 * Make a section with two (or more) tables collapse/expand together.
 * - sectionId: the id of the wrapper <section>
 * - tableIds: array of table ids inside that section
 * - visibleCount: how many rows to show per table when collapsed
 */
function makeCollapsibleGroup(sectionId, tableIds, visibleCount = 10){
  const section = document.getElementById(sectionId);
  if (!section) return;

  // Ensure tables have the class that hides .extra when collapsed
  const tables = tableIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  tables.forEach(t => t.classList.add('collapsible-table'));

  // Insert (or reuse) a single control row under the section
  let controls = section.querySelector(':scope > .group-controls');
  if (!controls){
    controls = document.createElement('div');
    controls.className = 'group-controls';
    section.appendChild(controls);
  }

  let btn = controls.querySelector('.btn-toggle');
  if (!btn){
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-toggle';
    controls.appendChild(btn);
  }

  const storageKey = `grp-state:${sectionId}`;

  function markExtras(){
    tables.forEach(t => {
      const rows = Array.from(t.tBodies[0]?.rows || []);
      rows.forEach((tr, idx) => tr.classList.toggle('extra', idx >= visibleCount));
    });
  }

  function totalRemaining(){
    return tables.reduce((sum, t) => {
      const rows = t.tBodies[0]?.rows ? t.tBodies[0].rows.length : 0;
      return sum + Math.max(0, rows - visibleCount);
    }, 0);
  }

  function setCollapsed(collapsed){
    markExtras();
    tables.forEach(t => t.classList.toggle('collapsed', collapsed));
    const remaining = totalRemaining();
    if (remaining > 0){
      controls.style.display = '';
      btn.textContent = collapsed ? `Show all (${remaining} more)` : 'Collapse';
      btn.setAttribute('aria-expanded', String(!collapsed));
    } else {
      controls.style.display = 'none';
    }
    localStorage.setItem(storageKey, collapsed ? 'collapsed' : 'expanded');
  }

  btn.onclick = () => {
    const isCollapsed = tables[0]?.classList.contains('collapsed');
    setCollapsed(!isCollapsed);
  };

  // Initial state (remember per group)
  const initialCollapsed = (localStorage.getItem(storageKey) !== 'expanded');
  setCollapsed(initialCollapsed);
}

/** Call this after you re-render a group's tables to re-apply grouping logic */
function refreshCollapsibleGroup(sectionId, tableIds, visibleCount = 10){
  // Just rebuild — cheap and reliable
  makeCollapsibleGroup(sectionId, tableIds, visibleCount);
}

/**
 * If you re-render a table's <tbody>, call refreshCollapsibleTable to re-apply
 * the Top N classing without re-adding the button.
 */
function refreshCollapsibleTable(tableId){
  const table = document.getElementById(tableId);
  if (!table) return;
  const controls = table.nextElementSibling;
  const btn = controls?.querySelector('.btn-toggle');
  // If we have a button already, simulate re-applying the current state
  if (btn){
    const collapsed = table.classList.contains('collapsed');
    // Temporarily show all to mark .extra again, then set back to collapsed/expanded
    table.classList.remove('collapsed');
    const rows = Array.from(table.tBodies[0]?.rows || []);
    const visibleCount = rows.findIndex(tr => tr.classList.contains('extra'));
    // If we can't infer visibleCount (e.g., first time), default to 10
    makeCollapsibleTable(tableId, (visibleCount > 0 ? visibleCount : 10));
    if (!collapsed) btn.click(); // expand again if it was expanded
  }
}

/* ===== Chart 7 helpers & icons ===== */
function getVicPremiers(){
  // Prefer data.js source if present
  if (typeof vicPremiers !== 'undefined' && Array.isArray(vicPremiers)) return vicPremiers;
  // Fallback minimal (should not be hit if data.js is up to date)
  return [
    { start:'1982-04-08', end:'1990-08-10', surname:'Cain',     party:'Labor',    supports:'Fitzroy' },
    { start:'1990-08-10', end:'1992-10-06', surname:'Kirner',   party:'Labor',    supports:'Essendon' },
    { start:'1992-10-06', end:'1999-10-20', surname:'Kennett',  party:'Coalition',supports:'Hawthorn' },
    { start:'1999-10-20', end:'2007-07-30', surname:'Bracks',   party:'Labor',    supports:'Geelong' },
    { start:'2007-07-30', end:'2010-12-02', surname:'Brumby',   party:'Labor',    supports:'Collingwood' },
    { start:'2010-12-02', end:'2013-03-06', surname:'Baillieu', party:'Coalition',supports:'Geelong' },
    { start:'2013-03-06', end:'2014-12-04', surname:'Napthine', party:'Coalition',supports:'Geelong' },
    { start:'2014-12-04', end:'2023-09-27', surname:'Andrews',  party:'Labor',    supports:'Essendon' },
    { start:'2023-09-27', end:'2100-01-01', surname:'Allan',    party:'Labor',    supports:'' }
  ];
}
function premierInfoOn(dateStr){
  const rows = getVicPremiers();
  const d = toDate(dateStr);
  for (const p of rows){
    const a = toDate(p.start), b = toDate(p.end);
    if (d >= a && d < b) return p;
  }
  return { surname:'?', party:'Unknown', supports:'' };
}
function makeGetGovFromPremiers(){
  const rows = getVicPremiers().map(p => ({ date: p.start, party: p.party }));
  return makeGetGov(rows, 0);
}
// Simple club colours (edit freely)
const CLUB_COLORS = {
  'Carlton':'#001e5a','Collingwood':'#111111','Essendon':'#cc0000','Hawthorn':'#8b5d15',
  'Geelong':'#0b2d59','Richmond':'#f4c20d','Melbourne':'#0f203a','North Melbourne':'#1f4aa3',
  'Sydney':'#c60c30','West Coast':'#003087','Adelaide':'#002b5c','Port Adelaide':'#01b3ae',
  'Brisbane':'#7b0038','Brisbane Lions':'#7b0038','Fitzroy':'#7b0038',
  'St Kilda':'#aa0000','Western Bulldogs':'#2b66b1','Fremantle':'#2b225a',
  'Greater Western Sydney':'#f37021','Gold Coast':'#f37021','Gold Coast Suns':'#f37021'
};
function colorForClub(name){ return CLUB_COLORS[name] || '#888'; }
// Local image markers (SVG/PNG)
const CLUB_ICON = {
  'Adelaide':'assets/club-svg/adelaide.svg',
  'Brisbane':'assets/club-svg/brisbane.svg',
  'Brisbane Lions':'assets/club-svg/brisbane.svg',
  'Carlton':'assets/club-svg/carlton.svg',
  'Collingwood':'assets/club-svg/collingwood.svg',
  'Essendon':'assets/club-svg/essendon.svg',
  'Fremantle':'assets/club-svg/fremantle.svg',
  'Geelong':'assets/club-svg/geelong.svg',
  'Gold Coast':'assets/club-svg/gold-coast.svg',
  'Gold Coast Suns':'assets/club-svg/gold-coast.svg',
  'Greater Western Sydney':'assets/club-svg/gws.svg',
  'GWS Giants':'assets/club-svg/gws.svg',
  'Hawthorn':'assets/club-svg/hawthorn.svg',
  'Melbourne':'assets/club-svg/melbourne.svg',
  'North Melbourne':'assets/club-svg/north-melbourne.svg',
  'Port Adelaide':'assets/club-svg/port-adelaide.svg',
  'Richmond':'assets/club-svg/richmond.svg',
  'St Kilda':'assets/club-svg/st-kilda.svg',
  'Sydney':'assets/club-svg/sydney.svg',
  'Sydney Swans':'assets/club-svg/sydney.svg',
  'West Coast':'assets/club-svg/west-coast.svg',
  'West Coast Eagles':'assets/club-svg/west-coast.svg',
  'Western Bulldogs':'assets/club-svg/western-bulldogs.svg',
  'Fitzroy/Brisbane':'assets/club-svg/brisbane.svg',
  'Fitzroy':'assets/club-svg/fitzroy.png'
};
function iconForClub(name){ return CLUB_ICON[name] || null; }

function buildChart7(containerId, gfRows, plotBands, labels){
  // Even spacing using category y-axis: 0=Runner-up, 1=Premiers, 2=Premier
  const Y_RUNNER=0, Y_WINNER=1, Y_GAP=2, Y_PREMIER=3;
  const yCats = ['AFL Runner-up','AFL Premiers','','Victorian Premier Supports'];

  const premierPts=[], winnerPts=[], runnerPts=[], drawPts=[];

  gfRows.forEach((r,i)=>{
    const info = premierInfoOn(r.date);
    // Premier marker (image or triangle)
    premierPts.push({
      x:i, y:Y_PREMIER, year:r.year, name:labels[i],
      premier:info.surname, supports:(info.supports||''),
      marker: (iconForClub(info.supports) ? { symbol:'url(' + iconForClub(info.supports) + ')', width:18, height:18 } : { symbol:'triangle' }),
      color: (info.supports ? colorForClub(info.supports) : '#888')
    });

    // Handle 2010 draw specially (wScore == lScore)
    const isDraw = +r.wScore === +r.lScore;
    if (isDraw){
      // Use the same orange you used for draw in the dumbbell chart
      const DRAW_ORANGE = 'grey';

      // one diamond on the Premiers row...
      drawPts.push({
        x: i, y: Y_WINNER, year: r.year, name: 'Draw',
        marker: { symbol: 'diamond', radius: 8 },
        color: DRAW_ORANGE
      });

      // ...and one diamond on the Runners-up row
      drawPts.push({
        x: i, y: Y_RUNNER, year: r.year, name: 'Draw',
        marker: { symbol: 'diamond', radius: 8 },
        color: DRAW_ORANGE
      });
    } else {
      // Winner + Runner-up markers (use icons when available)
      winnerPts.push({
        x:i, y:Y_WINNER, name:`${r.winner}`, year:r.year,
        marker:(iconForClub(r.winner)?{symbol:'url('+iconForClub(r.winner)+')', width:18, height:18}:{symbol:'square', radius:8}),
        color: colorForClub(r.winner)
      });
      runnerPts.push({
        x:i, y:Y_RUNNER, name:`${r.loser}`, year:r.year,
        marker:(iconForClub(r.loser)?{symbol:'url('+iconForClub(r.loser)+')', width:18, height:18}:{symbol:'square', radius:8}),
        color: colorForClub(r.loser)
      });
    }
  });

  const nameChangeLine = buildNameChangeLine ? buildNameChangeLine(labels) : null;

  Highcharts.chart(containerId, {
    chart: { 
      events: {
        load()   { attachColumnHover(this); },
        redraw() { attachColumnHover(this); }
       },
      type:'scatter', spacingTop:22, spacingBottom:12 

    },
    title: { text: null },
    legend: { enabled:false },
    xAxis: {
      categories: labels,
      tickInterval: 1,
      labels: { rotation:-50, style:{ fontSize:'10px' } },
      plotBands: plotBands,
      plotLines: nameChangeLine ? [nameChangeLine] : [],
      crosshair: true 
    },
    yAxis: {
      categories: yCats,
      title: { text: null },
      min: -0.5, max: yCats.length - 0.5,
      startOnTick: false, endOnTick: false,
      tickPositions: [Y_RUNNER, Y_WINNER, Y_GAP, Y_PREMIER],
      labels: {
        useHTML: true,
        formatter: function () {
          const cats = this.axis.categories || [];
          const v = (typeof this.value === 'string') ? this.value : (cats[this.value] || '');
          return `<span class="ywrap">${v}</span>`;
        }
      }
    },
    tooltip: {
      shared: true,
      useHTML:true,
      formatter: function(){
        if (this.series.name === 'Premier'){
          const sup = (this.point.supports && this.point.supports.length) ? `supports ${this.point.supports}` : 'No known allegiance';
          return `<b>${this.point.premier}</b> (${sup})<br/>Year: ${this.point.year}`;
        } else if (this.series.name === 'Draw'){
          return `<b>${this.point.year}</b><br/>Grand Final drawn`;
        }
        return `<b>${this.point.name}</b><br/>Year: ${this.point.year}`;
      }
    },
    plotOptions: {
      scatter: { marker:{ radius:6 } },
      series: { turboThreshold:0, dataLabels:{ enabled:false }, inactive: { opacity: 0.2 }, 
        states: {
          inactive: {opacity: 1}
        }
      }
    },
    series: [
      { name:'Premier', type:'scatter', data: premierPts, zIndex:3 },
      { name:'Premiers', type:'scatter', data: winnerPts, zIndex:2 },
      { name:'Runners-up', type:'scatter', data: runnerPts, zIndex:2 },
      { name:'Draw', type:'scatter', data: drawPts, zIndex:2 }
    ],
    credits: { enabled:false },
  });
}

/* Boot ------------------------------------------------------------- */

// ========= Tables A–F: Team counts (overall and by party) =========
function aggregateByTeam(gfRows, options){
  options = options || {};
  const role = options.role || 'winner';
  const wantParty = options.party || null;
  const getGov = options.getGov || (dt => getPartyForDateSafe(dt));

  function nameFor(r){
    if (role === 'winner') return r.premier || r.premiers || r.winner || null;
    return r.runnerUp || r.runnersUp || r.runner || r.loser || null;
  }

  const items = [];
  for (const r of gfRows){
    const name = nameFor(r);
    if (!name) continue;
    if (wantParty){
      const gov = canonicalParty(getGov(new Date(r.date)) || r.party || r.partyInPower || '');
      if (gov !== wantParty) continue;
    }
    items.push({ team: name, year: Number(r.year) });
  }

  const map = new Map();
  for (const it of items){
    const rec = map.get(it.team) || { team: it.team, total: 0, years: [] };
    rec.total += 1;
    rec.years.push(it.year);
    map.set(it.team, rec);
  }

  const out = Array.from(map.values()).map(rec => {
    rec.years.sort((a,b)=>a-b);
    return rec;
  }).sort((a,b)=> (b.total - a.total) || a.team.localeCompare(b.team));

  return out;

  
}

function renderCountTable(tableId, rows, partyLabel){
  const tbody = document.querySelector('#' + tableId + ' tbody');
  if (!tbody) return;
  const cls = partyLabel ? partyBgClassSafe(partyLabel) : '';
  tbody.innerHTML = rows.map(r => (
    '<tr class="' + cls + '">' +
      '<td class="num">' + r.total + '</td>' +
      '<td>' + r.team + '</td>' +
      '<td>' + r.years.join(', ') + '</td>' +
    '</tr>'
  )).join('');
}

function renderPremRunCountTables(gfRows, getGov){
  // Overall
  renderCountTable('tblPremiersCount',       aggregateByTeam(gfRows, { role:'winner', getGov }));
  renderCountTable('tblRunnersUpCount',      aggregateByTeam(gfRows, { role:'loser',  getGov }));

  // By party
  renderCountTable('tblPremiersCountLabor',      aggregateByTeam(gfRows, { role:'winner', party:'Labor',     getGov }), 'Labor');
  renderCountTable('tblPremiersCountCoalition',  aggregateByTeam(gfRows, { role:'winner', party:'Coalition', getGov }), 'Coalition');
  renderCountTable('tblRunnersUpCountLabor',     aggregateByTeam(gfRows, { role:'loser',  party:'Labor',     getGov }), 'Labor');
  renderCountTable('tblRunnersUpCountCoalition', aggregateByTeam(gfRows, { role:'loser',  party:'Coalition', getGov }), 'Coalition');
}
// ========= end Tables A–F helpers =========
document.addEventListener('DOMContentLoaded', () => {
  const gf = normalizeGrandFinals(grandFinals); // your existing normalizer that keeps year order

  // Build a single, canonical election timeline (uses your untouched ISO dates)
  const getGov = makeGetGovFromPremiers();

  // Expose a canonical date→party lookup that table builders already expect
  window.getPartyForDate = (dt) => {
    const d = (dt instanceof Date) ? dt : new Date(dt);
    return getGov(d);
  };
  
// One-time sanity prints (comment out after checking)
// const bands = buildPartyBands(gf, getGov);
  const bands = buildPartyBands(gf, getGov);
  const arrs  = arraysFor(gf);
  const labels = computeDisplayLabels(gf);
// charts
  buildChart1('chart1', arrs, bands, labels);
  buildChart2('chart2', arrs, bands, labels);
  buildChart3('chart3', arrs, bands, labels);
  buildChart4('chart4', gf, bands, labels);
  buildChart5('chart5', gf, bands, labels);
  buildChart6('chart6', gf, bands, labels);
  buildChart7('chart7', gf, bands, labels);

  const COLLAPSE_COUNT = 10;

  // tables
  renderTopGoalsTables(gf, getGov);
  renderTopBehindsTables(gf, getGov);
  renderTopScoreTables(gf, getGov);
  renderMarginTables(gf, getGov);
  renderNonVicTables(gf, getGov);
  renderPremRunCountTables(gf, getGov);


  // Then wire group toggles (one per two-table section)
  makeCollapsibleGroup('grp-goals',   ['tblTopWinnerGoals','tblTopLoserGoals'], COLLAPSE_COUNT);
  makeCollapsibleGroup('grp-behinds', ['tblTopWinnerBehinds','tblTopLoserBehinds'], COLLAPSE_COUNT);
  makeCollapsibleGroup('grp-scores',  ['tblTopWinnerScores','tblTopLoserScores'], COLLAPSE_COUNT);
  makeCollapsibleGroup('grp-margins', ['tblClosestMargins','tblBiggestMargins'], COLLAPSE_COUNT);


  // Build Chart 11 and related tables
  buildGFCalendarScatter('chart11');
  buildGFDatesTable('tblGFDates','btnGFDatesToggle',10);
  buildGFTotalsTable('tblGFTotals','btnGFTotalsToggle',10);
  buildGFPieMonth('chart12');

  // Hide per-table toggles and replace with one group toggle for the pair (11A/11B)
  ;['btnGFDatesToggle','btnGFTotalsToggle'].forEach(id => {
    const b = document.getElementById(id);
    if (b) b.style.display = 'none';
  });
  makeCollapsibleGroup('gfdates', ['tblGFDates','tblGFTotals'], 10);

  // --- Religion charts wiring ---
populateCensusYearSelect();

function renderReligionFor(year){
  const showNR = document.getElementById('toggleNoReligion')?.checked ?? true;
  const showNS = document.getElementById('toggleNotStated')?.checked ?? true;

  // VIC
  const vic = buildTopReligionSeriesForYear(+year, 'vic', { showNR, showNS, maxVisible: 12 });
  const vicContainer = document.getElementById('chartRelVic');
  // Clear container
  vicContainer.innerHTML = '';
  if (!vic || vic.categories.length === 0) {
    // No data available (e.g., 1986 VIC). Show a friendly message box.
    const msg = document.createElement('div');
    msg.style.padding = '12px';
    msg.style.border = '1px dashed #999';
    msg.style.borderRadius = '8px';
    msg.style.fontStyle = 'italic';
    msg.style.opacity = '0.85';
    msg.textContent = 'There is no available information breaking religion down by state for Victoria in the 1986 census. Information at the state level begins with the 1991 census.';
    vicContainer.appendChild(msg);
  } else {
    buildRelBar('chartRelVic', vic.categories, vic.data);
  }

  // AUS
  const aus = buildTopReligionSeriesForYear(+year, 'aus', { showNR, showNS, maxVisible: 12 });
  const ausContainer = document.getElementById('chartRelAus');
  ausContainer.innerHTML = '';
  if (!aus || aus.categories.length === 0) {
    const msg = document.createElement('div');
    msg.style.padding = '12px';
    msg.style.border = '1px dashed #999';
    msg.style.borderRadius = '8px';
    msg.style.fontStyle = 'italic';
    msg.style.opacity = '0.85';
    msg.textContent = 'No data';
    ausContainer.appendChild(msg);
  } else {
    buildRelBar('chartRelAus', aus.categories, aus.data);
  }
}

// Initial render (latest year pre-selected)
renderReligionFor(document.getElementById('censusYearSelect').value);

// Re-render on year change

// Also react to show/hide toggles
['toggleNoReligion','toggleNotStated'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', () => {
    renderReligionFor(document.getElementById('censusYearSelect').value);
  });
});

document.getElementById('censusYearSelect').addEventListener('change', (e)=>{
  renderReligionFor(e.target.value);
});

// AFL rank over time line (one-time)
buildRelRankLine('chartRelRank');
});


// === Hover for Tables A & B and Back-to-Top (top-level, safe) ===
(function(){
  // inject styles once
  if (!document.getElementById('aflCountsHoverBackToTopCSS')) {
    const css = [
      '#tblPremiersCount tbody tr:hover, #tblRunnersUpCount tbody tr:hover{',
      '  filter: brightness(1.06);',
      '}',
      '#backToTop{position:fixed;left:50%;transform:translateX(-50%);bottom:24px;padding:10px 14px;border-radius:999px;',
      '  box-shadow:0 4px 16px rgba(0,0,0,.25);font-weight:600;opacity:0;pointer-events:none;transition:opacity .2s;',
      '  backdrop-filter:saturate(1.2) blur(6px);border:1px solid rgba(0,0,0,.08); z-index: 2147483647;',
      '  background:#fff;color:#111;',
      '}',
      '@media (prefers-color-scheme: dark){#backToTop{background:#222;color:#fff;border-color:rgba(255,255,255,.12);box-shadow:0 6px 18px rgba(0,0,0,.5);}}',
      '#backToTop.show{opacity:1; pointer-events:auto;}'
    ].join('\n');
    const style = document.createElement('style');
    style.id='aflCountsHoverBackToTopCSS';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // create button once body exists
  function ensureButton(){
    if (document.getElementById('backToTop')) return;
    const btn = document.createElement('button');
    btn.id='backToTop';
    btn.type='button';
    btn.setAttribute('aria-label','Back to top');
    btn.textContent='▲ Back to top';
    btn.addEventListener('click', () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
    document.body.appendChild(btn);

    const THRESH = 600;
    const toggle = () => btn.classList.toggle('show', (window.scrollY||document.documentElement.scrollTop||0) > THRESH);
    window.addEventListener('scroll', toggle, { passive: true });
    window.addEventListener('resize', toggle);
    toggle();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ensureButton, { once: true });
  } else {
    ensureButton();
  }
})();
