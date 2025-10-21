// Combined JavaScript for all pages

// =============================================================================
// BOSSES/MYTHICAL CREATURE TIMERS FUNCTIONALITY
// =============================================================================
if (document.querySelector('#timersGrid')) {
document.addEventListener('DOMContentLoaded', function() {
    const STORAGE_KEY = 'bossTimers';
    
    // Elements
    const addTimerBtn = document.getElementById('addTimerBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const timersGrid = document.getElementById('timersGrid');
    const noTimers = document.getElementById('noTimers');
    const totalTimers = document.getElementById('totalTimers');
    const activeTimers = document.getElementById('activeTimers');
    const readyTimers = document.getElementById('readyTimers');
    
    // Modal elements
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const bossName = document.getElementById('bossName');
    const spawnTime = document.getElementById('spawnTime');
    const channel = document.getElementById('channel');
    const saveTimer = document.getElementById('saveTimer');
    const cancelTimer = document.getElementById('cancelTimer');
    
    let timers = [];
    let timerIntervals = new Map();
    
    // Load saved timers
    function loadTimers() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                timers = JSON.parse(saved);
                timers.forEach(timer => {
                    if (timer.endTime && new Date(timer.endTime) > new Date()) {
                        startTimerCountdown(timer);
                    }
                });
            } catch (e) {
                console.warn('Failed to load timers:', e);
            }
        }
    }
    
    // Save timers
    function saveTimers() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
    }
    
    // Create timer element
    function createTimerElement(timer) {
        const card = document.createElement('div');
        card.className = 'timer-card';
        card.dataset.timerId = timer.id;
        
        const now = new Date();
        const endTime = timer.endTime ? new Date(timer.endTime) : null;
        const isActive = endTime && endTime > now;
        const isReady = endTime && endTime <= now;
        
        if (isReady) card.classList.add('ready');
        else if (isActive) card.classList.add('active');
        
        card.innerHTML = `
            <div class="timer-header">
                <div class="timer-name">${timer.name}</div>
                <div class="timer-channel">Ch ${timer.channel}</div>
            </div>
            <div class="timer-display ${isReady ? 'ready' : isActive ? 'active' : ''}" id="display-${timer.id}">
                ${isReady ? 'READY!' : isActive ? formatTimeRemaining(endTime - now) : 'STOPPED'}
            </div>
            <div class="timer-controls-card">
                <button class="btn" onclick="startTimer('${timer.id}')">Start</button>
                <button class="btn secondary" onclick="resetTimer('${timer.id}')">Reset</button>
                <button class="btn danger" onclick="deleteTimer('${timer.id}')">Delete</button>
            </div>
        `;
        
        return card;
    }
    
    // Format time remaining
    function formatTimeRemaining(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Start timer countdown
    function startTimerCountdown(timer) {
        if (timerIntervals.has(timer.id)) {
            clearInterval(timerIntervals.get(timer.id));
        }
        
        const interval = setInterval(() => {
            const now = new Date();
            const endTime = new Date(timer.endTime);
            const remaining = endTime - now;
            
            const display = document.getElementById(`display-${timer.id}`);
            const card = document.querySelector(`[data-timer-id="${timer.id}"]`);
            
            if (remaining <= 0) {
                // Timer finished
                clearInterval(interval);
                timerIntervals.delete(timer.id);
                
                if (display) {
                    display.textContent = 'READY!';
                    display.className = 'timer-display ready';
                }
                if (card) {
                    card.className = 'timer-card ready';
                }
                
                updateStats();
                
                // Show notification if possible
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(`${timer.name} is ready!`, {
                        body: `Boss on channel ${timer.channel} has spawned!`,
                        icon: '🐉'
                    });
                }
            } else {
                // Update countdown
                if (display) {
                    display.textContent = formatTimeRemaining(remaining);
                    display.className = 'timer-display active';
                }
                if (card) {
                    card.className = 'timer-card active';
                }
            }
        }, 1000);
        
        timerIntervals.set(timer.id, interval);
    }
    
    // Start timer
    window.startTimer = function(timerId) {
        const timer = timers.find(t => t.id === timerId);
        if (timer) {
            timer.endTime = new Date(Date.now() + timer.spawnTimeMinutes * 60 * 1000).toISOString();
            saveTimers();
            startTimerCountdown(timer);
            updateStats();
        }
    };
    
    // Reset timer
    window.resetTimer = function(timerId) {
        const timer = timers.find(t => t.id === timerId);
        if (timer) {
            timer.endTime = null;
            
            if (timerIntervals.has(timerId)) {
                clearInterval(timerIntervals.get(timerId));
                timerIntervals.delete(timerId);
            }
            
            const display = document.getElementById(`display-${timerId}`);
            const card = document.querySelector(`[data-timer-id="${timerId}"]`);
            
            if (display) {
                display.textContent = 'STOPPED';
                display.className = 'timer-display';
            }
            if (card) {
                card.className = 'timer-card';
            }
            
            saveTimers();
            updateStats();
        }
    };
    
    // Delete timer
    window.deleteTimer = function(timerId) {
        if (confirm('Are you sure you want to delete this timer?')) {
            timers = timers.filter(t => t.id !== timerId);
            
            if (timerIntervals.has(timerId)) {
                clearInterval(timerIntervals.get(timerId));
                timerIntervals.delete(timerId);
            }
            
            saveTimers();
            updateDisplay();
        }
    };
    
    // Update display
    function updateDisplay() {
        timersGrid.innerHTML = '';
        
        if (timers.length === 0) {
            noTimers.style.display = 'block';
            timersGrid.style.display = 'none';
        } else {
            noTimers.style.display = 'none';
            timersGrid.style.display = 'grid';
            
            timers.forEach(timer => {
                const element = createTimerElement(timer);
                timersGrid.appendChild(element);
            });
        }
        
        updateStats();
    }
    
    // Update statistics
    function updateStats() {
        const now = new Date();
        let activeCount = 0;
        let readyCount = 0;
        
        timers.forEach(timer => {
            if (timer.endTime) {
                const endTime = new Date(timer.endTime);
                if (endTime > now) {
                    activeCount++;
                } else {
                    readyCount++;
                }
            }
        });
        
        if (totalTimers) totalTimers.textContent = timers.length;
        if (activeTimers) activeTimers.textContent = activeCount;
        if (readyTimers) readyTimers.textContent = readyCount;
    }
    
    // Show modal
    function showModal() {
        modalOverlay.classList.add('show');
        bossName.focus();
    }
    
    // Hide modal
    function hideModal() {
        modalOverlay.classList.remove('show');
        bossName.value = '';
        spawnTime.value = '';
        channel.value = '';
    }
    
    // Event listeners
    if (addTimerBtn) {
        addTimerBtn.addEventListener('click', showModal);
    }
    
    if (modalClose) {
        modalClose.addEventListener('click', hideModal);
    }
    
    if (cancelTimer) {
        cancelTimer.addEventListener('click', hideModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                hideModal();
            }
        });
    }
    
    if (saveTimer) {
        saveTimer.addEventListener('click', () => {
            const name = bossName.value.trim();
            const minutes = parseInt(spawnTime.value);
            const ch = parseInt(channel.value);
            
            if (!name || !minutes || !ch) {
                alert('Please fill in all fields');
                return;
            }
            
            if (minutes < 1 || minutes > 1440) {
                alert('Spawn time must be between 1 and 1440 minutes');
                return;
            }
            
            if (ch < 1 || ch > 450) {
                alert('Channel must be between 1 and 450');
                return;
            }
            
            const timer = {
                id: crypto.randomUUID(),
                name: name,
                spawnTimeMinutes: minutes,
                channel: ch,
                endTime: null
            };
            
            timers.push(timer);
            saveTimers();
            updateDisplay();
            hideModal();
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const data = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                timers: timers
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `boss-timers-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
    
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (data.timers && Array.isArray(data.timers)) {
                            timers = data.timers.map(t => ({ ...t, id: crypto.randomUUID(), endTime: null }));
                            saveTimers();
                            updateDisplay();
                            alert('Timers imported successfully!');
                        } else {
                            alert('Invalid timer file format');
                        }
                    } catch (err) {
                        alert('Error reading timer file: ' + err.message);
                    }
                };
                reader.readAsText(file);
            });
            input.click();
        });
    }
    
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (timers.length > 0 && confirm(`Delete all ${timers.length} timers?`)) {
                // Clear all intervals
                timerIntervals.forEach((interval, id) => {
                    clearInterval(interval);
                });
                timerIntervals.clear();
                
                timers = [];
                saveTimers();
                updateDisplay();
            }
        });
    }
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('show')) {
            hideModal();
        }
    });
    
    // Initialize
    loadTimers();
    updateDisplay();
});
}

// =============================================================================
// PROFIT CALCULATOR FUNCTIONALITY
// =============================================================================
if (document.querySelector('#salePrice')) {
(function() {
  // ------- Utilities -------
  const fmt = (n) => (!isFinite(n) ? '—' : Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 }));
  const q = (sel) => document.querySelector(sel);
  const el = (tag, props={}) => Object.assign(document.createElement(tag), props);
  const td = (child, cls) => { const c = el('td'); if (cls) c.className = cls; c.appendChild(child); return c; };

  // Debounce function for performance
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Loading indicator
  const loadingOverlay = document.getElementById('loadingOverlay');
  
  function showLoading() {
    if (loadingOverlay) loadingOverlay.classList.add('show');
  }
  
  function hideLoading() {
    if (loadingOverlay) loadingOverlay.classList.remove('show');
  }

  // Debounced compute function
  const debouncedCompute = debounce(() => {
    compute();
    saveState();
  }, 150);

  // ------- Validation -------
  function validateInput(input, min = 0, max = Infinity) {
    const value = parseFloat(input.value);
    const isValid = !isNaN(value) && value >= min && value <= max;
    
    input.classList.remove('error', 'success');
    if (input.value === '') {
      // Empty is okay for optional fields
      return true;
    } else if (isValid) {
      input.classList.add('success');
      return true;
    } else {
      input.classList.add('error');
      return false;
    }
  }

  function showToast(message, type = 'info') {
    const toast = el('div', {
      className: `toast ${type}`,
      innerHTML: message,
      style: `
        position: fixed; top: 20px; right: 20px; z-index: 1000;
        padding: 12px 16px; border-radius: 8px; color: white;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#3b82f6'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: translateX(100%); transition: transform 0.3s ease;
      `
    });
    
    document.body.appendChild(toast);
    setTimeout(() => toast.style.transform = 'translateX(0)', 10);
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

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
    if (!body) return;
    body.innerHTML = '';

    materials.forEach((m) => {
      const tr = el('tr');

      const name = el('input', { type:'text', value: m.name ?? '' });
      name.addEventListener('input', () => { m.name = name.value; saveState(); });

      const qty = el('input', { type:'number', min:'0', step:'0.0001', value: m.qty ?? 0 });
      const unit = el('input', { type:'number', min:'0', step:'0.01', value: m.unit ?? 0 });
      const lineTd = el('td', { className: 'right' });

      const updateLine = () => { lineTd.innerText = fmt((+qty.value || 0) * (+unit.value || 0)); };

      qty.addEventListener('input', () => { m.qty = +qty.value; updateLine(); debouncedCompute(); });
      unit.addEventListener('input', () => { m.unit = +unit.value; updateLine(); debouncedCompute(); });

      const rm = el('button', { innerText: '🗑️', className: 'danger' });
      rm.setAttribute('aria-label', `Remove material ${m.name || 'unnamed'}`);
      rm.addEventListener('click', () => { materials = materials.filter(x => x.id !== m.id); renderMaterials(); compute(); saveState(); });

      updateLine();
      tr.append(td(name), td(qty), td(unit), lineTd, td(rm));
      body.appendChild(tr);
    });
  }

  if (q('#addMaterial')) {
    q('#addMaterial').addEventListener('click', () => {
      materials.push({ id: crypto.randomUUID(), name: '', qty: 1, unit: 0 });
      renderMaterials(); compute(); saveState();
    });
  }

  if (q('#resetToDefaultMaterials')) {
    q('#resetToDefaultMaterials').addEventListener('click', () => {
      materials = [
        { id: crypto.randomUUID(), name: 'Ore', qty: 8, unit: 174 },
        { id: crypto.randomUUID(), name: 'Powder', qty: 1, unit: 138 },
      ];
      renderMaterials(); compute(); saveState();
    });
  }

  // Export configuration
  if (q('#exportConfig')) {
    q('#exportConfig').addEventListener('click', () => {
      const config = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        materials,
        outcomes,
        settings: {
          salePrice: q('#salePrice').value,
          feePct: q('#feePct').value,
          focusPerCraft: q('#focusPerCraft').value,
          dailyFocus: q('#dailyFocus').value,
          craftsPerDayInput: q('#craftsPerDayInput').value,
          depositFee: q('#depositFee').value
        }
      };
      
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = el('a', { href: url, download: `luno-calculator-config-${new Date().toISOString().split('T')[0]}.json` });
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Import configuration
  if (q('#importConfig')) {
    q('#importConfig').addEventListener('click', () => {
      const input = el('input', { type: 'file', accept: '.json' });
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const config = JSON.parse(e.target.result);
            
            // Validate config structure
            if (!config.materials || !config.outcomes || !config.settings) {
              showToast('Invalid configuration file format.', 'error');
              return;
            }
            
            // Load configuration
            materials = config.materials.map(m => ({ ...m, id: crypto.randomUUID() }));
            outcomes = config.outcomes.map(o => ({ ...o, id: crypto.randomUUID() }));
            
            const s = config.settings;
            q('#salePrice').value = s.salePrice || 0;
            q('#feePct').value = s.feePct || 0;
            q('#focusPerCraft').value = s.focusPerCraft || 1;
            q('#dailyFocus').value = s.dailyFocus || 0;
            q('#craftsPerDayInput').value = s.craftsPerDayInput || '';
            q('#depositFee').value = s.depositFee || 0;
            
            showLoading();
            
            setTimeout(() => {
              renderMaterials();
              renderOutcomes();
              compute();
              saveState();
              hideLoading();
              showToast('Configuration imported successfully!', 'success');
            }, 100);
          } catch (err) {
            showToast('Error parsing configuration file: ' + err.message, 'error');
          }
        };
        reader.readAsText(file);
      });
      input.click();
    });
  }

  // ------- Outcomes UI -------
  function renderOutcomes() {
    const body = q('#probBody');
    if (!body) return;
    body.innerHTML = '';

    outcomes.forEach((o) => {
      const tr = el('tr');
      const items = el('input', { type:'number', min:'0', step:'0.01', value: o.items ?? 0 });
      const pct = el('input', { type:'number', min:'0', step:'0.01', value: o.pct ?? 0 });
      const rm = el('button', { innerText: '🗑️', className: 'danger' });
      const contribTd = el('td', { className:'right' });

      const updateContrib = () => { contribTd.innerText = fmt((+o.items || 0) * ((+o.pct || 0)/100)); };

      items.addEventListener('input', () => { o.items = +items.value; updateContrib(); debouncedCompute(); });
      pct.addEventListener('input', () => { o.pct = +pct.value; updateContrib(); debouncedCompute(); });
      rm.setAttribute('aria-label', `Remove outcome with ${o.items} items`);
      rm.addEventListener('click', () => { outcomes = outcomes.filter(x => x.id !== o.id); renderOutcomes(); compute(); saveState(); });

      updateContrib();
      tr.append(td(items), td(pct), contribTd, td(rm));
      body.appendChild(tr);
    });

    const sumPct = outcomes.reduce((a,b) => a + (+b.pct || 0), 0);
    const exp = outcomes.reduce((a,b) => a + ((+b.items || 0) * ((+b.pct || 0)/100)), 0);
    if (q('#probSum')) q('#probSum').innerText = fmt(sumPct);
    if (q('#expectedItems')) q('#expectedItems').innerText = fmt(exp);
    if (q('#probWarning')) q('#probWarning').style.display = Math.abs(sumPct - 100) < 1e-9 ? 'none' : '';
  }

  if (q('#addOutcome')) {
    q('#addOutcome').addEventListener('click', () => {
      outcomes.push({ id: crypto.randomUUID(), items: 1, pct: 0 });
      renderOutcomes(); compute(); saveState();
    });
  }

  // ------- Inputs -------
  const salePrice         = q('#salePrice');
  const feePct            = q('#feePct');
  const focusPerCraft     = q('#focusPerCraft');
  const dailyFocus        = q('#dailyFocus');
  const craftsPerDayInput = q('#craftsPerDayInput');
  const depositFee        = q('#depositFee');

  [salePrice, feePct, focusPerCraft, dailyFocus, craftsPerDayInput, depositFee].forEach(inp => {
    if (!inp) return;
    inp.addEventListener('input', () => { 
      // Validate based on field type
      let isValid = true;
      if (inp === salePrice || inp === depositFee) {
        isValid = validateInput(inp, 0);
      } else if (inp === feePct) {
        isValid = validateInput(inp, 0, 100);
      } else if (inp === focusPerCraft) {
        isValid = validateInput(inp, 1);
      } else if (inp === dailyFocus) {
        isValid = validateInput(inp, 0);
      } else if (inp === craftsPerDayInput) {
        isValid = inp.value === '' || validateInput(inp, 0);
      }
      
      if (isValid) {
        debouncedCompute();
      }
    });
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

    if (q('#materialsTotal')) q('#materialsTotal').innerText = fmt(matPerCraft);
    if (q('#expectedItems')) q('#expectedItems').innerText = fmt(expectedItems);
    if (q('#revPerCraft')) q('#revPerCraft').innerText = fmt(revPerCraft);
    if (q('#matPerCraft')) q('#matPerCraft').innerText = fmt(matPerCraft);
    if (q('#profitPerCraft')) q('#profitPerCraft').innerText = fmt(profitPerCraft);
    if (q('#profitPerFocus')) q('#profitPerFocus').innerText = fmt(profitPerFocus);
    if (q('#breakeven')) q('#breakeven').innerText = isFinite(breakeven)?fmt(breakeven):'—';
    if (q('#craftsPerDay')) q('#craftsPerDay').innerText = fmt(craftsPerDay);
    if (q('#revPerDay')) q('#revPerDay').innerText = fmt(revPerDay);
    if (q('#matPerDay')) q('#matPerDay').innerText = fmt(matPerDay);
    if (q('#profitPerDay')) q('#profitPerDay').innerText = fmt(profitPerDay);
    if (q('#depositPerDay')) q('#depositPerDay').innerText = fmt(deposit);
    if (q('#matsPerDay')) q('#matsPerDay').innerText = matsPerDayUnits.length?matsPerDayUnits.map(m=>`${fmt(m.qty)} × ${m.name}`).join(', '):'—';
    const itemsEl=q('#itemsPerDay'); if(itemsEl) itemsEl.innerText=fmt(itemsPerDay);

    const pSum = outcomes.reduce((a,b)=>a+(+b.pct||0),0);
    const note=[];
    if(Math.abs(pSum-100)>1e-9) note.push('Probabilities sum ≠ 100%.');
    if((+feePct.value||0)===0) note.push('No market fee applied.');
    if((+depositFee.value||0)===0) note.push('No deposit fee applied.');
    if(overrideStr!=='') note.push('Crafts/day overridden.');
    if (q('#footerNote')) q('#footerNote').innerText=note.join('  ');
  }

  // ------- Init -------
  loadState();
  renderMaterials();
  renderOutcomes();
  compute();
})();
}

// =============================================================================
// DAILY MISSIONS FUNCTIONALITY
// =============================================================================
if (document.querySelector('#missionList')) {
/* ------------------------------
   Daily Missions with Auto-Reset
   ------------------------------ */

const TASKS = [
  "2x elite boss",
  "2x world boss",
  "guild check in",
  "guild cargo",
  "500 activity merits",
  "400 focus life skill",
  "buru commission x3",
  "unstable realms x2"
];

const KEY = "daily-missions-v1";   // store check states
const META_KEY = "daily-missions-meta"; // store last reset time
const TZ_OFFSET = 8;   // UTC+8 timezone
const RESET_HOUR = 15; // 3 PM

const today = new Date();
if (document.getElementById('dateSub')) {
  document.getElementById('dateSub').textContent =
    today.toLocaleDateString(undefined, { weekday:"long", year:"numeric", month:"short", day:"numeric" });
}

/* --- Load stored data --- */
let saved = JSON.parse(localStorage.getItem(KEY) || "{}");
let meta = JSON.parse(localStorage.getItem(META_KEY) || "{}");

/* --- Determine if we should reset --- */
function shouldReset() {
  const nowUtc = new Date();
  const now = new Date(nowUtc.getTime() + TZ_OFFSET * 60 * 60 * 1000); // convert to UTC+8

  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  // today's reset time (3 PM UTC+8)
  const resetTimeUtc = Date.UTC(y, m, d, RESET_HOUR - TZ_OFFSET, 0, 0);
  const resetTime = new Date(resetTimeUtc);

  const lastReset = meta.lastReset ? new Date(meta.lastReset) : null;

  // Reset if no record or last reset before today's reset and current time past reset time
  if (!lastReset || (now > resetTime && lastReset < resetTime)) {
    return true;
  }
  return false;
}

/* --- Perform the reset --- */
function performReset() {
  Object.keys(saved).forEach(k => saved[k] = false);
  localStorage.setItem(KEY, JSON.stringify(saved));
  meta.lastReset = new Date().toISOString();
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

/* --- Auto-reset if needed --- */
if (shouldReset()) {
  performReset();
}

/* --- Build checklist UI --- */
const list = document.getElementById("missionList");

if (list) {
  TASKS.forEach((text, idx) => {
    const id = `task-${idx}`;
    const checked = !!saved[id];

    const row = document.createElement("label");
    row.className = `item${checked ? " done" : ""}`;
    row.setAttribute("for", id);

    const box = document.createElement("input");
    box.type = "checkbox";
    box.id = id;
    box.checked = checked;
    box.setAttribute("aria-label", text);

    const span = document.createElement("span");
    span.className = "label";
    span.textContent = text;

    row.appendChild(box);
    row.appendChild(span);
    list.appendChild(row);

    // Save when toggled
    box.addEventListener("change", () => {
      saved[id] = box.checked;
      localStorage.setItem(KEY, JSON.stringify(saved));
      row.classList.toggle("done", box.checked);
      updateProgress();
    });
  });
}

/* --- Manual reset button --- */
if (document.getElementById("resetBtn")) {
  document.getElementById("resetBtn").addEventListener("click", () => {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    Object.keys(saved).forEach(k => saved[k] = false);
    localStorage.setItem(KEY, JSON.stringify(saved));
    document.querySelectorAll('.item').forEach(el => el.classList.remove('done'));
    meta.lastReset = new Date().toISOString();
    localStorage.setItem(META_KEY, JSON.stringify(meta));
    updateProgress();
  });
}

/* --- Progress indicator --- */
function updateProgress(){
  const boxes = [...document.querySelectorAll('input[type="checkbox"]')];
  const done = boxes.filter(b => b.checked).length;
  const total = boxes.length;
  const pct = Math.round((done / total) * 100);

  const circumference = 2 * Math.PI * 34; // radius=34
  const offset = circumference * (1 - pct/100);
  if (document.getElementById("ring")) {
    document.getElementById("ring").style.strokeDashoffset = offset.toFixed(2);
  }
  if (document.getElementById("progressLabel")) {
    document.getElementById("progressLabel").textContent = `${pct}%`;
  }
  if (document.getElementById("summary")) {
    document.getElementById("summary").textContent = `${done} / ${total} completed`;
  }
}

updateProgress();
}

// =============================================================================
// CHANNELS FUNCTIONALITY
// =============================================================================
if (document.querySelector('#channelsGrid')) {
document.addEventListener('DOMContentLoaded', function() {
    const STORAGE_KEY = 'channelActiveState';
    const TOTAL_CHANNELS = 450;
    
    // Elements
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const clearActiveBtn = document.getElementById('clearActiveBtn');
    const channelsGrid = document.getElementById('channelsGrid');
    const activeChannelsGrid = document.getElementById('activeChannelsGrid');
    const activeSection = document.getElementById('activeSection');
    const noActive = document.getElementById('noActive');
    const noResults = document.getElementById('noResults');
    const totalChannels = document.getElementById('totalChannels');
    const visibleChannels = document.getElementById('visibleChannels');
    const activeCount = document.getElementById('activeCount');
    
    let activeChannelSet = new Set();
    let allChannels = [];
    
    // Load saved state
    function loadActiveChannels() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                activeChannelSet = new Set(data);
            } catch (e) {
                console.warn('Failed to load active channels:', e);
            }
        }
    }
    
    // Save state
    function saveActiveChannels() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...activeChannelSet]));
    }
    
    // Create channel element
    function createChannelElement(number, isActive = false) {
        const channel = document.createElement('div');
        channel.className = `channel ${isActive ? 'active' : ''}`;
        channel.textContent = number;
        channel.dataset.channel = number;
        
        channel.addEventListener('click', () => toggleChannel(number));
        
        return channel;
    }
    
    // Toggle channel active state
    function toggleChannel(number) {
        if (activeChannelSet.has(number)) {
            activeChannelSet.delete(number);
        } else {
            activeChannelSet.add(number);
        }
        
        saveActiveChannels();
        updateChannelDisplay();
        updateStats();
    }
    
    // Generate all channels
    function generateChannels() {
        allChannels = [];
        for (let i = 1; i <= TOTAL_CHANNELS; i++) {
            allChannels.push(i);
        }
    }
    
    // Update channel display
    function updateChannelDisplay() {
        const searchQuery = searchInput.value.trim().toLowerCase();
        const filteredChannels = filterChannels(searchQuery);
        
        // Clear grids
        channelsGrid.innerHTML = '';
        activeChannelsGrid.innerHTML = '';
        
        // Show/hide no results
        if (filteredChannels.length === 0 && searchQuery) {
            noResults.style.display = 'block';
            channelsGrid.style.display = 'none';
        } else {
            noResults.style.display = 'none';
            channelsGrid.style.display = 'grid';
        }
        
        // Render filtered channels in main grid
        filteredChannels.forEach(num => {
            const isActive = activeChannelSet.has(num);
            const channel = createChannelElement(num, isActive);
            channelsGrid.appendChild(channel);
        });
        
        // Render active channels in separate section
        const activeChannels = [...activeChannelSet].sort((a, b) => a - b);
        activeChannels.forEach(num => {
            const channel = createChannelElement(num, true);
            activeChannelsGrid.appendChild(channel);
        });
        
        // Show/hide active section
        if (activeChannels.length === 0) {
            noActive.style.display = 'block';
            activeChannelsGrid.style.display = 'none';
        } else {
            noActive.style.display = 'none';
            activeChannelsGrid.style.display = 'grid';
        }
        
        updateStats(filteredChannels.length);
    }
    
    // Filter channels based on search
    function filterChannels(query) {
        if (!query) return allChannels;
        
        // Handle range queries (e.g., "50-60", "100-150")
        const rangeMatch = query.match(/^(\d+)-(\d+)$/);
        if (rangeMatch) {
            const start = parseInt(rangeMatch[1]);
            const end = parseInt(rangeMatch[2]);
            return allChannels.filter(num => num >= start && num <= end);
        }
        
        // Handle comma-separated queries (e.g., "1,5,10")
        if (query.includes(',')) {
            const numbers = query.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
            return allChannels.filter(num => numbers.includes(num));
        }
        
        // Handle single number or partial match
        const searchNum = parseInt(query);
        if (!isNaN(searchNum)) {
            // Exact match first, then partial matches
            const exact = allChannels.filter(num => num === searchNum);
            const partial = allChannels.filter(num => 
                num !== searchNum && num.toString().includes(query)
            );
            return [...exact, ...partial];
        }
        
        return allChannels.filter(num => num.toString().includes(query));
    }
    
    // Update statistics
    function updateStats(visible = allChannels.length) {
        if (totalChannels) totalChannels.textContent = TOTAL_CHANNELS;
        if (visibleChannels) visibleChannels.textContent = visible;
        if (activeCount) activeCount.textContent = activeChannelSet.size;
    }
    
    // Event listeners
    if (searchInput) {
        searchInput.addEventListener('input', updateChannelDisplay);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                updateChannelDisplay();
            }
        });
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            updateChannelDisplay();
            searchInput.focus();
        });
    }
    
    if (clearActiveBtn) {
        clearActiveBtn.addEventListener('click', () => {
            if (activeChannelSet.size > 0) {
                if (confirm(`Clear all ${activeChannelSet.size} active channels?`)) {
                    activeChannelSet.clear();
                    saveActiveChannels();
                    updateChannelDisplay();
                }
            }
        });
    }
    
    // Initialize
    loadActiveChannels();
    generateChannels();
    updateChannelDisplay();
});
}