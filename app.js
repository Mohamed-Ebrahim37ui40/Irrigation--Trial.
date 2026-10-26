// Translations Object
const i18n = {
  ar: {
    appTitle: "تجربة الري",
    designerCredit: "تصميم مهندس محمد إبراهيم (فرمينو)",
    clearAll: "🗑️ مسح الكل",
    exportExcel: "📥 تصدير Excel",
    exportSVG: "🖼️ حفظ SVG",
    importData: "📂 استيراد",
    whatsappShare: "📱 واتساب",
    pivotManagement: "📂 إدارة البيفوتات (محفوظة محلياً)",
    addPivot: "➕ إضافة بيفوت جديد",
    parameters: "⚙️ المعاملات",
    dishRadius: "نصف قطر الطبق (م)",
    c1Constant: "ثابت التحويل C1",
    areaFeddan: "المساحة (فدان)",
    irrigationHours: "ساعات الري",
    feddanPerHour: "أفدنة / ساعة",
    flowRate: "التدفق M³/H",
    date: "التاريخ",
    pivotName: "اسم البيفوت",
    overallAvg: "متوسط كلي (مم)",
    readingsHeader: "📝 إدخال القراءات (8 لكل عجلة — End: 4)",
    addReading: "➕ قراءة",
    add3Readings: "➕ 3 قراءات",
    summaryTitle: "📊 الملخص والمنحنى",
    wheel: "العجلة",
    count: "عدد",
    average: "متوسط",
    stdDev: "انحراف",
    min: "أدنى",
    max: "أقصى",
    contactTitle: "بيانات التواصل والمطور",
    contactSubtitle: "اضغط على أي وسيلة للتواصل المباشر عبر التطبيقات الرسمية"
  },
  en: {
    appTitle: "Irrigation Trial",
    designerCredit: "Designed by Eng. Mohamed Ebrahim (Firmino)",
    clearAll: "🗑️ Clear All",
    exportExcel: "📥 Export Excel",
    exportSVG: "🖼️ Save SVG",
    importData: "📂 Import",
    whatsappShare: "📱 WhatsApp",
    pivotManagement: "📂 Pivot Manager (Saved Locally)",
    addPivot: "➕ Add New Pivot",
    parameters: "⚙️ Parameters",
    dishRadius: "Dish Radius (m)",
    c1Constant: "Conversion Constant C1",
    areaFeddan: "Area (Feddan)",
    irrigationHours: "Irrigation Hours",
    feddanPerHour: "Feddan / Hour",
    flowRate: "Flow Rate M³/H",
    date: "Date",
    pivotName: "Pivot Name",
    overallAvg: "Overall Avg (mm)",
    readingsHeader: "📝 Readings Entry (8 per wheel — End: 4)",
    addReading: "➕ Reading",
    add3Readings: "➕ 3 Readings",
    summaryTitle: "📊 Summary & Curve",
    wheel: "Wheel",
    count: "Count",
    average: "Average",
    stdDev: "Std Dev",
    min: "Min",
    max: "Max",
    contactTitle: "Contact & Developer Info",
    contactSubtitle: "Click on any channel to communicate directly via official apps"
  }
};

let currentLang = localStorage.getItem('lang') || 'ar';
let currentTheme = localStorage.getItem('theme') || 'light';

const PIVOTS_KEY = 'irrigation_pwa_pivots_v1';
const PIVOT_KEYS = [1, 2, 3, 4, 5, 6, 7, 'End'];
const READINGS = 8;

let pivotsData = JSON.parse(localStorage.getItem(PIVOTS_KEY)) || {};
if (Object.keys(pivotsData).length === 0) {
  // Add default pivot
  pivotsData['P16'] = createDefaultPivotData('P16');
  savePivots();
}

let activePivotName = Object.keys(pivotsData)[0] || 'P16';
let curWheel = 1;

function createDefaultPivotData(name) {
  let d = {};
  PIVOT_KEYS.forEach(p => {
    const n = (p === 'End') ? 4 : READINGS;
    d[p] = Array(n).fill(null);
  });
  return {
    radius: 17.5,
    area: 125,
    hours: 10,
    date: new Date().toISOString().slice(0, 10),
    pivotName: name,
    readings: d
  };
}

function savePivots() {
  localStorage.setItem(PIVOTS_KEY, JSON.stringify(pivotsData));
}

function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed:', err));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initPWA();
  applyTheme(currentTheme);
  applyLanguage(currentLang);
  renderPivotChips();
  loadActivePivotData();
});

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', currentTheme);
  applyTheme(currentTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeBtn').textContent = theme === 'light' ? '🌙' : '☀️';
  drawChart();
}

function toggleLanguage() {
  currentLang = currentLang === 'ar' ? 'en' : 'ar';
  localStorage.setItem('lang', currentLang);
  applyLanguage(currentLang);
}

function applyLanguage(lang) {
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang][key]) el.textContent = i18n[lang][key];
  });
  renderTabs();
  renderTable();
  updateAll();
}

function renderPivotChips() {
  const container = document.getElementById('pivotChipsContainer');
  container.innerHTML = '';
  Object.keys(pivotsData).forEach(pName => {
    const chip = document.createElement('div');
    chip.className = 'pivot-chip' + (pName === activePivotName ? ' active' : '');
    chip.innerHTML = `<span>${pName}</span> <span class="del-btn" onclick="deletePivot('${pName}', event)">✕</span>`;
    chip.onclick = () => switchPivot(pName);
    container.appendChild(chip);
  });
}

function switchPivot(name) {
  activePivotName = name;
  renderPivotChips();
  loadActivePivotData();
}

function addNewPivot() {
  const count = Object.keys(pivotsData).length;
  if (count >= 15) {
    toast(currentLang === 'ar' ? '⚠️ لا يمكن إضافة أكثر من 15 بيفوت' : '⚠️ Max 15 pivots reached');
    return;
  }
  const newName = prompt(currentLang === 'ar' ? 'أدخل اسم البيفوت الجديد:' : 'Enter new pivot name:', `P ${count + 1}`);
  if (!newName || newName.trim() === '') return;
  if (pivotsData[newName.trim()]) {
    toast(currentLang === 'ar' ? '⚠️ هذا الاسم موجود بالفعل' : '⚠️ Name already exists');
    return;
  }
  pivotsData[newName.trim()] = createDefaultPivotData(newName.trim());
  activePivotName = newName.trim();
  savePivots();
  renderPivotChips();
  loadActivePivotData();
}

function deletePivot(name, e) {
  e.stopPropagation();
  if (Object.keys(pivotsData).length <= 1) {
    toast(currentLang === 'ar' ? '⚠️ يجب الاحتفاظ ببيفوت واحد على الأقل' : '⚠️ Must keep at least one pivot');
    return;
  }
  if (!confirm(currentLang === 'ar' ? `هل أنت تأكد من حذف البيفوت ${name}؟` : `Are you sure you want to delete ${name}?`)) return;
  delete pivotsData[name];
  activePivotName = Object.keys(pivotsData)[0];
  savePivots();
  renderPivotChips();
  loadActivePivotData();
}

function loadActivePivotData() {
  const p = pivotsData[activePivotName];
  if (!p) return;
  document.getElementById('radius').value = p.radius;
  document.getElementById('area').value = p.area;
  document.getElementById('hours').value = p.hours;
  document.getElementById('date').value = p.date;
  document.getElementById('pivotName').value = p.pivotName;
  recalc();
  renderTabs();
  renderTable();
  updateAll();
}

function syncCurrentPivotData() {
  if (!pivotsData[activePivotName]) return;
  pivotsData[activePivotName].radius = parseFloat(document.getElementById('radius').value) || 17.5;
  pivotsData[activePivotName].area = parseFloat(document.getElementById('area').value) || 0;
  pivotsData[activePivotName].hours = parseFloat(document.getElementById('hours').value) || 1;
  pivotsData[activePivotName].date = document.getElementById('date').value;
  pivotsData[activePivotName].pivotName = document.getElementById('pivotName').value;
  savePivots();
}

function getC1() {
  const r = parseFloat(document.getElementById('radius').value) || 17.5;
  return (r * r) * Math.PI / 10;
}

function recalc() {
  const area = parseFloat(document.getElementById('area').value) || 0;
  const hours = parseFloat(document.getElementById('hours').value) || 1;
  const c1 = getC1();
  document.getElementById('c1').textContent = c1.toFixed(2);
  document.getElementById('feddanPH').textContent = (area / hours).toFixed(2);
  syncCurrentPivotData();
  renderTable();
  updateAll();
}

function renderTabs() {
  const el = document.getElementById('tabs');
  el.innerHTML = '';
  const currentReadings = pivotsData[activePivotName].readings;
  PIVOT_KEYS.forEach(p => {
    const n = currentReadings[p] ? currentReadings[p].filter(v => v != null && v > 0).length : 0;
    const b = document.createElement('button');
    b.className = 'tab' + (p === curWheel ? ' active' : '');
    const labelText = currentLang === 'ar' ? `عجلة ${p}` : `Wheel ${p}`;
    b.innerHTML = `${labelText} <span class="badge">${n}/${currentReadings[p] ? currentReadings[p].length : 0}</span>`;
    b.onclick = () => { curWheel = p; renderTabs(); renderTable(); };
    el.appendChild(b);
  });
}

function renderTable() {
  const tb = document.getElementById('tbody');
  tb.innerHTML = '';
  const c1 = getC1();
  const currentReadings = pivotsData[activePivotName].readings[curWheel] || [];
  currentReadings.forEach((v, i) => {
    const calc = (v != null && v > 0) ? (v / c1).toFixed(2) : '—';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td><input type="number" step="0.1" min="0" value="${v != null ? v : ''}"
           placeholder="MM" data-idx="${i}"
           oninput="setVal(${i}, this.value)"
           onkeydown="navKey(event, ${i})" /></td>
      <td class="calc-cell">${calc}</td>
      <td><button class="btn btn-danger btn-sm" onclick="delVal(${i})">✕</button></td>
    `;
    tb.appendChild(tr);
  });
}

function navKey(e, i) {
  if (e.key === 'Enter' || e.key === 'ArrowDown') {
    e.preventDefault();
    const inputs = document.querySelectorAll('#tbody input');
    if (i + 1 < inputs.length) {
      inputs[i + 1].focus();
      inputs[i + 1].select();
    } else {
      addReading();
      setTimeout(() => {
        const inputs2 = document.querySelectorAll('#tbody input');
        if (inputs2.length) {
          inputs2[inputs2.length - 1].focus();
          inputs2[inputs2.length - 1].select();
        }
      }, 50);
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const inputs = document.querySelectorAll('#tbody input');
    if (i > 0) {
      inputs[i - 1].focus();
      inputs[i - 1].select();
    }
  }
}

function setVal(i, val) {
  const n = val === '' ? null : parseFloat(val);
  pivotsData[activePivotName].readings[curWheel][i] = isNaN(n) ? null : n;
  savePivots();
  renderTabs();
  const row = document.getElementById('tbody').rows[i];
  if (row) {
    const c1 = getC1();
    const v = pivotsData[activePivotName].readings[curWheel][i];
    row.cells[2].textContent = (v != null && v > 0) ? (v / c1).toFixed(2) : '—';
  }
  updateAll();
}

function addReading() {
  pivotsData[activePivotName].readings[curWheel].push(null);
  savePivots();
  renderTabs();
  renderTable();
  setTimeout(() => {
    const inputs = document.querySelectorAll('#tbody input');
    if (inputs.length) inputs[inputs.length - 1].focus();
  }, 40);
}

function addMany(n) {
  for (let i = 0; i < n; i++) pivotsData[activePivotName].readings[curWheel].push(null);
  savePivots();
  renderTabs();
  renderTable();
}

function delVal(i) {
  pivotsData[activePivotName].readings[curWheel].splice(i, 1);
  if (pivotsData[activePivotName].readings[curWheel].length === 0) pivotsData[activePivotName].readings[curWheel] = [null];
  savePivots();
  renderTabs();
  renderTable();
  updateAll();
}

function getVals(arr) {
  const c1 = getC1();
  return (arr || []).filter(v => v != null && v > 0).map(v => v / c1);
}

function avg(a) { return a.length ? a.reduce((s, v) => s + v, 0) / a.length : null; }
function std(a) {
  if (a.length < 2) return null;
  const m = avg(a);
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
}

function updateAll() {
  const tb = document.getElementById('sumBody');
  tb.innerHTML = '';
  let all = [];
  const stats = [];
  const pData = pivotsData[activePivotName].readings;

  PIVOT_KEYS.forEach(p => {
    const vals = getVals(pData[p]);
    all = all.concat(vals);
    stats.push({
      p, n: vals.length,
      avg: avg(vals), sd: std(vals),
      min: vals.length ? Math.min(...vals) : null,
      max: vals.length ? Math.max(...vals) : null
    });
  });

  const overall = avg(all);
  document.getElementById('overallAvg').textContent = overall != null ? overall.toFixed(2) : '—';

  const area = parseFloat(document.getElementById('area').value) || 0;
  const hours = parseFloat(document.getElementById('hours').value) || 1;
  const feddanPH = area / hours;
  if (overall != null && overall > 0) {
    document.getElementById('flow').textContent = (overall * feddanPH * 4.2).toFixed(2);
  } else {
    document.getElementById('flow').textContent = '—';
  }

  stats.forEach(s => {
    const div = (s.avg != null && overall) ? ((s.avg / overall) * 100).toFixed(1) + '%' : '—';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${s.p}</strong></td>
      <td>${s.n}</td>
      <td class="avg-cell">${s.avg != null ? s.avg.toFixed(2) : '—'}</td>
      <td>${s.sd != null ? s.sd.toFixed(2) : '—'}</td>
      <td>${s.min != null ? s.min.toFixed(2) : '—'}</td>
      <td>${s.max != null ? s.max.toFixed(2) : '—'}</td>
      <td>${div}</td>
    `;
    tb.appendChild(tr);
  });

  drawChart();
}

function drawChart() {
  const canvas = document.getElementById('chart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const pData = pivotsData[activePivotName].readings;

  const pts = [];
  PIVOT_KEYS.forEach(p => {
    let vi = 0;
    const vals = getVals(pData[p]);
    (pData[p] || []).forEach((raw, idx) => {
      if (raw != null && raw > 0) {
        pts.push({ p, i: idx + 1, v: vals[vi], label: p + '-' + (idx + 1) });
        vi++;
      }
    });
  });

  const minPointW = 36;
  const parentW = canvas.parentElement.getBoundingClientRect().width;
  const chartContentW = Math.max(parentW, pts.length * minPointW + 80);
  const H = 410;

  canvas.width = chartContentW * dpr;
  canvas.height = H * dpr;
  canvas.style.width = chartContentW + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = chartContentW;
  const pad = { t: 40, r: 20, b: 90, l: 50 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;
  ctx.clearRect(0, 0, W, H);

  if (!pts.length) {
    ctx.fillStyle = currentTheme === 'dark' ? '#AAA' : '#888';
    ctx.font = '14px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(currentLang === 'ar' ? 'أدخل بيانات لعرض المنحنى' : 'Enter data to render chart', parentW / 2, H / 2);
    return;
  }

  const values = pts.map(p => p.v);
  const mean = avg(values);
  const sdVal = std(values) || 0;
  const lo = mean - 1.5 * sdVal;
  const hi = mean + 1.5 * sdVal;
  pts.forEach(pt => { pt.out = pt.v < lo || pt.v > hi; });

  const maxY = Math.max(...values, hi) * 1.2 || 1;
  const gap = cW / pts.length;

  if (sdVal > 0) {
    const yU = pad.t + cH - (Math.min(hi, maxY) / maxY) * cH;
    const yL = pad.t + cH - (Math.max(lo, 0) / maxY) * cH;
    ctx.fillStyle = currentTheme === 'dark' ? 'rgba(76,175,80,.15)' : 'rgba(46,125,50,.08)';
    ctx.fillRect(pad.l, yU, cW, Math.max(yL - yU, 0));
  }

  ctx.strokeStyle = currentTheme === 'dark' ? '#444' : '#BDBDBD';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t);
  ctx.lineTo(pad.l, pad.t + cH);
  ctx.lineTo(pad.l + cW, pad.t + cH);
  ctx.stroke();

  ctx.fillStyle = currentTheme === 'dark' ? '#BBB' : '#757575';
  ctx.font = '11px Segoe UI';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const y = pad.t + cH - (i / 5) * cH;
    ctx.fillText((maxY * i / 5).toFixed(1), pad.l - 6, y + 4);
    ctx.strokeStyle = currentTheme === 'dark' ? '#222' : '#EEEEEE';
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(pad.l + cW, y);
    ctx.stroke();
  }

  const yM = pad.t + cH - (mean / maxY) * cH;
  ctx.strokeStyle = '#43A047';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(pad.l, yM);
  ctx.lineTo(pad.l + cW, yM);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#43A047';
  ctx.font = '10px Segoe UI';
  ctx.textAlign = 'left';
  ctx.fillText('μ ' + mean.toFixed(2), pad.l + 4, yM - 4);

  ctx.strokeStyle = currentTheme === 'dark' ? '#64B5F6' : '#1565C0';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach((pt, i) => {
    const x = pad.l + gap * i + gap / 2;
    const y = pad.t + cH - (pt.v / maxY) * cH;
    if (i === 0) ctx.moveTo(x, y);
    else {
      const prev = pts[i - 1];
      const px = pad.l + gap * (i - 1) + gap / 2;
      const py = pad.t + cH - (prev.v / maxY) * cH;
      ctx.quadraticCurveTo((px + x) / 2, py, x, y);
    }
  });
  ctx.stroke();

  pts.forEach((pt, i) => {
    const x = pad.l + gap * i + gap / 2;
    const y = pad.t + cH - (pt.v / maxY) * cH;

    if (pt.out) {
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(198,40,40,.25)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#EF5350';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#EF5350';
      ctx.font = 'bold 10px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(pt.v.toFixed(2), x, y - 12);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = currentTheme === 'dark' ? '#64B5F6' : '#1565C0';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(x, H - 55);
    ctx.rotate(-Math.PI / 3);
    ctx.textAlign = 'right';
    ctx.font = '10px Segoe UI';
    ctx.fillStyle = pt.out ? '#EF5350' : (currentTheme === 'dark' ? '#CCC' : '#424242');
    ctx.fillText(pt.label, 0, 0);
    ctx.restore();
  });
}

function clearAll() {
  if (!confirm(currentLang === 'ar' ? 'هل تريد مسح جميع الإدخالات للبيفوت الحالي؟' : 'Clear all entries for active pivot?')) return;
  PIVOT_KEYS.forEach(p => {
    const n = (p === 'End') ? 4 : READINGS;
    pivotsData[activePivotName].readings[p] = Array(n).fill(null);
  });
  savePivots();
  renderTabs();
  renderTable();
  updateAll();
  toast(currentLang === 'ar' ? '🗑️ تم مسح القراءات' : '🗑️ Readings cleared');
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
