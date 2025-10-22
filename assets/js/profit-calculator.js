(function() {
  // ------- Utilities -------
  const fmt = (n) => (!isFinite(n) ? '—' : Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 }));
  const q = (sel) => document.querySelector(sel);
  const el = (tag, props={}) => Object.assign(document.createElement(tag), props);
  const td = (child, cls) => { const c = el('td'); if (cls) c.className = cls; c.appendChild(child); return c; };

  const STORAGE_KEY = 'metalCraftCalcV1';

  // ------- State -------
  let materials = [];
  let outcomes = [
    { id: crypto.randomUUID(), items: 1, pct: 72 },
    { id: crypto.randomUUID(), items: 2, pct: 26 },
    { id: crypto.randomUUID(), items: 3, pct: 2  },
  ];

  // ------- Persistence -------
  function saveState() {
    const data = {
      materials,
      outcomes,
      salePrice: q('#salePrice').value,
      feePct: q('#feePct').value,
      focusPerCraft: q('#focusPerCraft').value,
      dailyFocus: q('#dailyFocus').value,
      craftsPerDayInput: q('#craftsPerDayInput').value,
      depositFee: q('#depositFee').value
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.materials) materials = data.materials;
      if (data.outcomes) outcomes = data.outcomes;
      if (data.salePrice !== undefined) q('#salePrice').value = data.salePrice;
      if (data.feePct !== undefined) q('#feePct').value = data.feePct;
      if (data.focusPerCraft !== undefined) q('#focusPerCraft').value = data.focusPerCraft;
      if (data.dailyFocus !== undefined) q('#dailyFocus').value = data.dailyFocus;
      if (data.craftsPerDayInput !== undefined) q('#craftsPerDayInput').value = data.craftsPerDayInput;
      if (data.depositFee !== undefined) q('#depositFee').value = data.depositFee;
    } catch(e) {
      console.warn('Failed to load saved data:', e);
    }
  }

  // ------- Materials UI -------
  function renderMaterials() {
    const body = q('#materialsBody');
    body.innerHTML = '';

    materials.forEach((m) => {
      const tr = el('tr');

      const name = el('input', { type:'text', value: m.name ?? '' });
      name.addEventListener('input', () => { m.name = name.value; saveState(); });

      const qty = el('input', { type:'number', min:'0', step:'0.0001', value: m.qty ?? 0 });
      const unit = el('input', { type:'number', min:'0', step:'0.01', value: m.unit ?? 0 });
      const lineTd = el('td', { className: 'right' });

      const updateLine = () => { lineTd.innerText = fmt((+qty.value || 0) * (+unit.value || 0)); };

      qty.addEventListener('input', () => { m.qty = +qty.value; updateLine(); compute(); saveState(); });
      unit.addEventListener('input', () => { m.unit = +unit.value; updateLine(); compute(); saveState(); });

      const rm = el('button', { innerText: '🗑️', className: 'danger' });
      rm.addEventListener('click', () => { materials = materials.filter(x => x.id !== m.id); renderMaterials(); compute(); saveState(); });

      updateLine();
      tr.append(td(name), td(qty), td(unit), lineTd, td(rm));
      body.appendChild(tr);
    });
  }

  q('#addMaterial').addEventListener('click', () => {
    materials.push({ id: crypto.randomUUID(), name: '', qty: 1, unit: 0 });
    renderMaterials(); compute(); saveState();
  });

  q('#resetToDefaultMaterials').addEventListener('click', () => {
    materials = [
      { id: crypto.randomUUID(), name: 'Ore', qty: 8, unit: 174 },
      { id: crypto.randomUUID(), name: 'Powder', qty: 1, unit: 138 },
    ];
    renderMaterials(); compute(); saveState();
  });

  // ------- Outcomes UI -------
  function renderOutcomes() {
    const body = q('#probBody');
    body.innerHTML = '';

    outcomes.forEach((o) => {
      const tr = el('tr');
      const items = el('input', { type:'number', min:'0', step:'0.01', value: o.items ?? 0 });
      const pct = el('input', { type:'number', min:'0', step:'0.01', value: o.pct ?? 0 });
      const rm = el('button', { innerText: '🗑️', className: 'danger' });
      const contribTd = el('td', { className:'right' });

      const updateContrib = () => { contribTd.innerText = fmt((+o.items || 0) * ((+o.pct || 0)/100)); };

      items.addEventListener('input', () => { o.items = +items.value; updateContrib(); compute(); saveState(); });
      pct.addEventListener('input', () => { o.pct = +pct.value; updateContrib(); compute(); saveState(); });
      rm.addEventListener('click', () => { outcomes = outcomes.filter(x => x.id !== o.id); renderOutcomes(); compute(); saveState(); });

      updateContrib();
      tr.append(td(items), td(pct), contribTd, td(rm));
      body.appendChild(tr);
    });

    const sumPct = outcomes.reduce((a,b) => a + (+b.pct || 0), 0);
    const exp = outcomes.reduce((a,b) => a + ((+b.items || 0) * ((+b.pct || 0)/100)), 0);
    q('#probSum').innerText = fmt(sumPct);
    q('#expectedItems').innerText = fmt(exp);
    q('#probWarning').style.display = Math.abs(sumPct - 100) < 1e-9 ? 'none' : '';
  }

  q('#addOutcome').addEventListener('click', () => {
    outcomes.push({ id: crypto.randomUUID(), items: 1, pct: 0 });
    renderOutcomes(); compute(); saveState();
  });

  // ------- Inputs -------
  const salePrice         = q('#salePrice');
  const feePct            = q('#feePct');
  const focusPerCraft     = q('#focusPerCraft');
  const dailyFocus        = q('#dailyFocus');
  const craftsPerDayInput = q('#craftsPerDayInput');
  const depositFee        = q('#depositFee');

  [salePrice, feePct, focusPerCraft, dailyFocus, craftsPerDayInput, depositFee].forEach(inp => {
    inp.addEventListener('input', () => { compute(); saveState(); });
  });

  // ------- Compute -------
  function compute() {
    const matPerCraft = materials.reduce((s,m)=>s+((+m.qty||0)*(+m.unit||0)),0);
    const expectedItems = outcomes.reduce((s,o)=>s+((+o.items||0)*((+o.pct||0)/100)),0);

    const price = +salePrice.value || 0;
    const fee = (+feePct.value || 0)/100;
    const revPerCraft = expectedItems * price * (1 - fee);

    const fpc = (+focusPerCraft.value || 1);
    const profitPerCraft = revPerCraft - matPerCraft;
    const profitPerFocus = profitPerCraft / fpc;
    const breakeven = expectedItems>0&&(1-fee)!==0?matPerCraft/expectedItems/(1-fee):NaN;

    const df = (+dailyFocus.value || 0);
    const computedCrafts = Math.floor(df / fpc);
    const overrideStr = craftsPerDayInput.value?.trim?.() ?? '';
    const craftsPerDay = overrideStr === '' ? computedCrafts : Math.max(0, Math.floor(+overrideStr || 0));

    const matsPerDayUnits = materials.map(m=>({name:m.name||'Material', qty:(+m.qty||0)*craftsPerDay}));
    const matPerDay = matPerCraft * craftsPerDay;
    const revPerDay = revPerCraft * craftsPerDay;
    const itemsPerDay = expectedItems * craftsPerDay;

    const deposit = (+depositFee.value || 0); // per-day flat
    const profitPerDay = revPerDay - matPerDay - deposit;

    q('#materialsTotal').innerText = fmt(matPerCraft);
    q('#expectedItems').innerText = fmt(expectedItems);
    q('#revPerCraft').innerText = fmt(revPerCraft);
    q('#matPerCraft').innerText = fmt(matPerCraft);
    q('#profitPerCraft').innerText = fmt(profitPerCraft);
    q('#profitPerFocus').innerText = fmt(profitPerFocus);
    q('#breakeven').innerText = isFinite(breakeven)?fmt(breakeven):'—';
    q('#craftsPerDay').innerText = fmt(craftsPerDay);
    q('#revPerDay').innerText = fmt(revPerDay);
    q('#matPerDay').innerText = fmt(matPerDay);
    q('#profitPerDay').innerText = fmt(profitPerDay);
    q('#depositPerDay').innerText = fmt(deposit);
    q('#matsPerDay').innerText = matsPerDayUnits.length?matsPerDayUnits.map(m=>`${fmt(m.qty)} × ${m.name}`).join(', '):'—';
    const itemsEl=q('#itemsPerDay'); if(itemsEl) itemsEl.innerText=fmt(itemsPerDay);

    const pSum = outcomes.reduce((a,b)=>a+(+b.pct||0),0);
    const note=[];
    if(Math.abs(pSum-100)>1e-9) note.push('Probabilities sum ≠ 100%.');
    if((+feePct.value||0)===0) note.push('No market fee applied.');
    if((+depositFee.value||0)===0) note.push('No deposit fee applied.');
    if(overrideStr!=='') note.push('Crafts/day overridden.');
    q('#footerNote').innerText=note.join('  ');
  }

  // ------- Init -------
  loadState();
  renderMaterials();
  renderOutcomes();
  compute();
})();