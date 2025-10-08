// Diet Recommendation System - Frontend Logic

// In-memory data with localStorage persistence
const STORAGE_KEYS = {
    PROFILE: 'drs_profile',
    PROGRESS: 'drs_progress',
    THEME: 'drs_theme',
    PROFILE_IMAGE: 'drs_profile_image',
    RESULT: 'drs_last_result',
    WATER_COUNT: 'drs_water_count',
  };

  // Activity multipliers for TDEE calculation
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };

  // Sample food database
  const foodDatabase = {
    underweight: {
      breakfast: [
        'Oatmeal with banana and nuts (450 cal)',
        'Greek yogurt with honey and berries (300 cal)',
        'Whole grain toast with avocado (350 cal)',
      ],
      lunch: [
        'Grilled chicken breast with quinoa (550 cal)',
        'Salmon with sweet potato (600 cal)',
        'Protein smoothie with banana and peanut butter (450 cal)',
      ],
      dinner: [
        'Beef stir fry with vegetables and rice (650 cal)',
        'Pasta with meat sauce and vegetables (700 cal)',
        'Tofu curry with brown rice (550 cal)',
      ],
    },
    normal: {
      breakfast: [
        'Scrambled eggs with whole grain toast (350 cal)',
        'Oatmeal with fruit (300 cal)',
        'Smoothie bowl with granola (320 cal)',
      ],
      lunch: [
        'Grilled chicken salad with vinaigrette (450 cal)',
        'Turkey and avocado wrap (400 cal)',
        'Quinoa bowl with roasted vegetables (380 cal)',
      ],
      dinner: [
        'Baked fish with steamed vegetables (450 cal)',
        'Lean beef with broccoli and rice (500 cal)',
        'Vegetable stir fry with tofu (420 cal)',
      ],
    },
    overweight: {
      breakfast: [
        'Vegetable omelet (250 cal)',
        'Greek yogurt with berries (200 cal)',
        'Green smoothie (180 cal)',
      ],
      lunch: [
        'Grilled chicken salad (300 cal)',
        'Vegetable soup with whole grain bread (280 cal)',
        'Tuna salad with mixed greens (250 cal)',
      ],
      dinner: [
        'Baked fish with roasted vegetables (350 cal)',
        'Vegetable stir fry with tofu (320 cal)',
        'Zucchini noodles with marinara sauce (280 cal)',
      ],
    },
  };

  // Diet preference substitution rules
  const dietSubstitutes = {
      vegetarian: [
          { find: 'chicken', replace: 'tofu' },
          { find: 'salmon', replace: 'lentils' },
          { find: 'beef', replace: 'beans' },
          { find: 'turkey', replace: 'soy' },
          { find: 'fish', replace: 'paneer' },
          { find: 'meat sauce', replace: 'vegetable sauce' },
      ],
      vegan: [
          { find: 'chicken', replace: 'tempeh' },
          { find: 'salmon', replace: 'lentils' },
          { find: 'beef', replace: 'beans' },
          { find: 'turkey', replace: 'soy' },
          { find: 'fish', replace: 'mushrooms' },
          { find: 'meat sauce', replace: 'vegetable sauce' },
          { find: 'eggs', replace: 'chickpea scramble' },
          { find: 'yogurt', replace: 'almond yogurt' },
          { find: 'tuna', replace: 'mashed chickpeas' },
      ],
  };


  // Cached DOM elements for performance
  const DOM = {};

  // Utilities
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }
  function scrollToTarget(sel) {
    const el = typeof sel === 'string' ? qs(sel) : sel;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setYear() {
    const y = new Date().getFullYear();
    if (DOM.year) DOM.year.textContent = y;
  }

  function saveProfileToStorage(profile) {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile:', e);
    }
  }

  function loadProfileFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Failed to load profile:', e);
      return null;
    }
  }

  function saveProgressToStorage(progress) {
    try {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }

  function loadProgressFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to load progress:', e);
      return [];
    }
  }

  function applyValidation(form) {
    form.classList.add('was-validated');
    return form.checkValidity();
  }

  function toNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  }

  function showMessage(msg) {
    alert(msg);
  }
  
  // ... (BMI and Calorie Calculation functions remain the same)
  function mifflinStJeorBMR({ gender, weight, height, age }) {
    const base = 10 * weight + 6.25 * height - 5 * age;
    if (gender === 'male') return base + 5;
    if (gender === 'female') return base - 161;
    return base - 80;
  }
  function bmiCategory(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }
  
  
  function computePlan(profile) {
    const heightM = profile.height / 100;
    const bmi = profile.weight / (heightM * heightM);
    const bmr = mifflinStJeorBMR(profile);
    const tdee = Math.round(bmr * (activityMultipliers[profile.activity] || 1.2));
    let dailyCalories = tdee;
    if (profile.goal === 'lose') dailyCalories -= 500;
    if (profile.goal === 'gain') dailyCalories += 500;
    const category = bmiCategory(bmi);
    let planDB;
    if (bmi < 18.5) planDB = foodDatabase.underweight;
    else if (bmi < 25) planDB = foodDatabase.normal;
    else planDB = foodDatabase.overweight;
    
    const pref = profile.dietPref || 'omnivore';
    const adjusted = ['breakfast','lunch','dinner'].reduce((acc, meal) => {
      const items = planDB[meal].map((txt) => {
        if (pref === 'omnivore') return txt;
        const rules = dietSubstitutes[pref] || [];
        return rules.reduce((s, rule) => s.replace(new RegExp(rule.find, 'gi'), rule.replace), txt);
      });
      acc[meal] = items;
      return acc;
    }, {});
    return { bmi, category, bmr: Math.round(bmr), tdee, dailyCalories, planDB: adjusted };
  }
  
  
  function renderResults(result, profile) {
    // Safe updates with optional chaining and existence checks
    if (qs('#bmiValue')) qs('#bmiValue').textContent = result.bmi.toFixed(1);
    if (qs('#bmiCategory')) qs('#bmiCategory').textContent = result.category;
    if (qs('#calories')) qs('#calories').textContent = String(result.dailyCalories);
    
    // Progress bars
    const maxCalories = 3000;
    const caloriePercentage = Math.min(100, (result.dailyCalories / maxCalories) * 100);
    if (qs('#calorieProgress')) qs('#calorieProgress').style.width = `${caloriePercentage}%`;
    if (qs('#currentWeight')) qs('#currentWeight').textContent = String(profile.weight);
    
    const goalWeight = profile.goal === 'lose' ? (profile.weight - 5) : (profile.goal === 'gain' ? (profile.weight + 5) : profile.weight);
    if (qs('#goalWeight')) qs('#goalWeight').textContent = String(goalWeight);
    
    updateDietRecommendations(result.planDB);
    
    if (qs('#resultsSection')) qs('#resultsSection').classList.remove('hidden');
    if (qs('#noResults')) qs('#noResults').classList.add('hidden');
  }
  
  

  
  // -------------------- Grocery List Helpers --------------------
  // (All grocery list helpers, including modal setup, are correct and fully included)
  function splitItems(text) {
    return text.split(/,|;|\band\b|(\(.+?\))/gi).map((s) => s ? s.replace(/[\(\)]/g, '').trim() : '').filter(Boolean);
  }
  
  function normalizeItem(s) {
    let t = s.toLowerCase();
    t = t.replace(/^(\d+[x]?\s*|\d+[\.]?\d*\s*(?:g|kg|ml|l|cup|cups|tbsp|tsp|oz|slice|slices)\s*)/, '');
    t = t.replace(/\s{2,}/g, ' ').trim();
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
  }
  
  function buildGrocerySetFromSnapshot(snapshot) {
    const set = new Set();
    if (!snapshot || !snapshot.meals) return set;
    ['breakfast', 'lunch', 'dinner'].forEach((meal) => {
      const arr = snapshot.meals[meal] || [];
      arr.forEach((line) => {
        splitItems(line).forEach((item) => {
          const norm = normalizeItem(item);
          if (norm) set.add(norm);
        });
      });
    });
    return set;
  }
  
  function populateGroceryList(items) {
    const ul = document.getElementById('groceryList');
    if (!ul) return;
    ul.innerHTML = '';
    Array.from(items).sort().forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      ul.appendChild(li);
    });
  }
  
  function initGroceryModal() {
    const modalEl = document.getElementById('groceryModal');
    if (!modalEl || !window.bootstrap) return;
  
    modalEl.addEventListener('show.bs.modal', () => {
      const snapshotRaw = localStorage.getItem(STORAGE_KEYS.RESULT);
      if (snapshotRaw) {
        try {
          const snapshot = JSON.parse(snapshotRaw);
          const grocerySet = buildGrocerySetFromSnapshot(snapshot);
          populateGroceryList(grocerySet);
        } catch (e) {
          console.error("Error building grocery list:", e);
        }
      }
    });
  
    document.getElementById('copyGroceryBtn')?.addEventListener('click', () => {
      const ul = document.getElementById('groceryList');
      if (!ul) return;
      const lines = Array.from(ul.querySelectorAll('li')).map(li => `- ${li.textContent}`);
      const text = lines.join('\n');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          alert('Grocery list copied to clipboard');
        }).catch(() => {
          alert('Failed to copy.');
        });
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); alert('Grocery list copied to clipboard'); } catch {}
        document.body.removeChild(ta);
      }
    });
    
    document.getElementById('downloadGroceryBtn')?.addEventListener('click', () => {
      const ul = document.getElementById('groceryList');
      if (!ul) return;
      const lines = Array.from(ul.querySelectorAll('li')).map(li => `- ${li.textContent}`);
      const text = 'Grocery List\n\n' + lines.join('\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'grocery_list.txt';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
  // -----------------------------------------------------------
  
  
  // Image handling for profile upload
  function initImageHandling() {
    const input = qs('#profileImageInput');
    const preview = qs('#profileImagePreview');
    if (!input || !preview) return;

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.src = e.target.result;
          localStorage.setItem(STORAGE_KEYS.PROFILE_IMAGE, e.target.result);
        };
        reader.readAsDataURL(file);
      }
    });

    // Load saved image
    const savedImage = localStorage.getItem(STORAGE_KEYS.PROFILE_IMAGE);
    if (savedImage) {
      preview.src = savedImage;
    }
  }

  // Water tracker initialization
  function initWaterTracker() {
    const tracker = qs('#waterTracker');
    const countEl = qs('#waterCount');
    const volumeEl = qs('#waterVolume');
    const resetBtn = qs('#resetWaterBtn');
    if (!tracker) return;

    let waterCount = parseInt(localStorage.getItem(STORAGE_KEYS.WATER_COUNT) || '0', 10);

    function updateWaterDisplay() {
      if (countEl) countEl.textContent = waterCount;
      if (volumeEl) volumeEl.textContent = waterCount * 250;
      localStorage.setItem(STORAGE_KEYS.WATER_COUNT, waterCount.toString());

      // Update glasses
      const glasses = qsa('.water-glass');
      glasses.forEach((glass, i) => {
        glass.classList.toggle('filled', i < waterCount);
      });
    }

    // Create glasses
    tracker.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const glass = document.createElement('div');
      glass.className = 'water-glass';
      glass.addEventListener('click', () => {
        if (i < waterCount) {
          waterCount = i; // Set to clicked glass
        } else {
          waterCount = i + 1;
        }
        updateWaterDisplay();
      });
      tracker.appendChild(glass);
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        waterCount = 0;
        updateWaterDisplay();
      });
    }

    updateWaterDisplay();
  }

  // Update diet recommendations display
  function updateDietRecommendations(plan) {
    const breakfastList = qs('#breakfastList');
    const lunchList = qs('#lunchList');
    const dinnerList = qs('#dinnerList');

    if (breakfastList) {
      breakfastList.innerHTML = plan.breakfast.map(item => `<li>${item}</li>`).join('');
    }
    if (lunchList) {
      lunchList.innerHTML = plan.lunch.map(item => `<li>${item}</li>`).join('');
    }
    if (dinnerList) {
      dinnerList.innerHTML = plan.dinner.map(item => `<li>${item}</li>`).join('');
    }
  }

  // Progress tracking functions
  let progressData = [];

  function addProgressEntry(date, weight) {
    console.log('addProgressEntry called with date:', date, 'weight:', weight);
    const entry = { date, weight, timestamp: new Date(date).getTime() };
    progressData.push(entry);
    progressData.sort((a, b) => a.timestamp - b.timestamp);
    saveProgressToStorage(progressData);
    updateProgressSummary();
    renderProgressChart();
    console.log('Progress entry added, data length:', progressData.length);
  }

  function clearProgress() {
    progressData = [];
    saveProgressToStorage(progressData);
    updateProgressSummary();
    renderProgressChart();
  }

  function updateProgressSummary() {
    const summary = qs('#progressSummary');
    if (!summary) return;

    if (progressData.length === 0) {
      summary.innerHTML = '<div>Start Weight: <strong>--</strong></div><div>Current: <strong>--</strong></div><div>Change: <strong>--</strong></div><div>Weeks: <strong>--</strong></div>';
      return;
    }

    const startWeight = progressData[0].weight;
    const currentWeight = progressData[progressData.length - 1].weight;
    const change = currentWeight - startWeight;
    const weeks = Math.ceil((progressData[progressData.length - 1].timestamp - progressData[0].timestamp) / (7 * 24 * 60 * 60 * 1000));

    summary.innerHTML = `
      <div>Start Weight: <strong>${startWeight}kg</strong></div>
      <div>Current: <strong>${currentWeight}kg</strong></div>
      <div>Change: <strong>${change > 0 ? '+' : ''}${change.toFixed(1)}kg</strong></div>
      <div>Weeks: <strong>${weeks}</strong></div>
    `;
  }

  function exportProgress() {
    if (progressData.length === 0) {
      showMessage('No progress data to export.');
      return;
    }

    const text = progressData.map(entry => `${entry.date}\t${entry.weight}kg`).join('\n');
    const header = 'Date\tWeight\n';
    const blob = new Blob([header + text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weight_progress.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderProgressChart() {
    console.log('renderProgressChart called, progressData length:', progressData.length);
    const chartBox = qs('#progressChart');
    if (!chartBox) {
      console.log('chartBox not found');
      return;
    }

    if (progressData.length < 2) {
      console.log('Not enough data for chart');
      chartBox.innerHTML = '<p class="text-muted m-0">No data yet. Add your first weight entry!</p>';
      return;
    }

    // Simple SVG chart with tooltip interactivity
    const width = chartBox.clientWidth;
    const height = chartBox.clientHeight;
    const padding = 40;

    const weights = progressData.map(d => d.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const range = maxWeight - minWeight || 1;

    const points = progressData.map((d, i) => {
      const x = padding + (i / (progressData.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((d.weight - minWeight) / range) * (height - 2 * padding);
      return { x, y, date: d.date, weight: d.weight };
    });

    // Create SVG elements
    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

    // Create circles with data attributes for tooltip
    const circles = points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="6" fill="#4361ee" class="progress-point" data-date="${p.date}" data-weight="${p.weight}" style="cursor:pointer;" />`).join('');

    const svg = `
      <svg class="inline-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Weight progress chart">
        <polyline fill="none" stroke="#4361ee" stroke-width="3" points="${polylinePoints}" />
        ${circles}
      </svg>
      <div id="progressTooltip" class="chart-tooltip"></div>
    `;

    chartBox.innerHTML = svg;

    // Tooltip handling
    const tooltip = qs('#progressTooltip');
    const svgEl = chartBox.querySelector('svg');

    function showTooltip(evt) {
      const target = evt.target;
      if (target.classList.contains('progress-point')) {
        const date = target.getAttribute('data-date');
        const weight = target.getAttribute('data-weight');
        tooltip.style.display = 'block';
        tooltip.textContent = `Date: ${date}, Weight: ${weight}kg`;
        const rect = chartBox.getBoundingClientRect();
        const svgRect = svgEl.getBoundingClientRect();
        const offsetX = evt.clientX - svgRect.left;
        const offsetY = evt.clientY - svgRect.top;
        tooltip.style.left = `${offsetX}px`;
        tooltip.style.top = `${offsetY - 30}px`;
      }
    }

    function hideTooltip() {
      tooltip.style.display = 'none';
    }

    svgEl.addEventListener('mousemove', showTooltip);
    svgEl.addEventListener('mouseleave', hideTooltip);
  }

  // Main initialization
  function initApp() {
    console.log('initApp called');
    // Cache DOM elements
    DOM.year = qs('#year');
    DOM.form = qs('#dietForm');
    DOM.calculateBtn = qs('#calculateBtn');
    DOM.viewDetailsBtn = qs('#viewDetailsBtn');
    DOM.progressDateInput = qs('#progressDate');
    DOM.progressWeightInput = qs('#progressWeight');
    DOM.addProgressBtn = qs('#addProgressBtn');
    DOM.clearProgressBtn = qs('#clearProgressBtn');
    DOM.exportProgressBtn = qs('#exportProgressBtn');
    DOM.darkToggle = qs('#darkToggle');
    DOM.savePdfBtn = qs('#savePdfBtn');

    setYear();
    initImageHandling();
    initWaterTracker();
    initGroceryModal();

    if (DOM.progressDateInput) DOM.progressDateInput.value = new Date().toISOString().split('T')[0];

    // Load saved data
    progressData = loadProgressFromStorage();
    updateProgressSummary();
    renderProgressChart();

    // Load saved profile
    const savedProfile = loadProfileFromStorage();
    if (savedProfile) {
      Object.keys(savedProfile).forEach(key => {
        const el = qs(`#${key}`);
        if (el) el.value = savedProfile[key];
      });
    }
  
    // Dark mode toggle (FIXED: Added element check)
    const darkToggle = qs('#darkToggle');
    const root = document.documentElement;
  
    if (darkToggle) { // FIX: Ensure darkToggle exists before accessing properties
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        darkToggle.checked = true;
      }
  
      darkToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
          root.setAttribute('data-theme', 'dark');
          localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
        } else {
          root.removeAttribute('data-theme');
          localStorage.setItem(STORAGE_KEYS.THEME, 'light');
        }
      });
    }
  
    // Event Listeners
    if (DOM.calculateBtn) {
      DOM.calculateBtn.addEventListener('click', () => {
        console.log('Calculate button clicked');
        if (!applyValidation(DOM.form)) {
          console.log('Form validation failed');
          scrollToTarget(DOM.form);
          return;
        }
        console.log('Form validation passed');
        const profile = {
          name: qs('#name').value,
          age: toNumber(qs('#age').value),
          gender: qs('#gender').value,
          height: toNumber(qs('#height').value),
          weight: toNumber(qs('#weight').value),
          activity: qs('#activity').value,
          goal: qs('#goal').value,
          dietPref: qs('#dietPref').value,
        };
        console.log('Profile data:', profile);
        saveProfileToStorage(profile);
        const result = computePlan(profile);
        console.log('Computed result:', result);

        const snapshot = {
          profile,
          result: { bmi: result.bmi, category: result.category, dailyCalories: result.dailyCalories },
          meals: result.planDB,
          image: localStorage.getItem(STORAGE_KEYS.PROFILE_IMAGE) || null
        };
        localStorage.setItem(STORAGE_KEYS.RESULT, JSON.stringify(snapshot));
        console.log('Snapshot saved to localStorage:', snapshot);

        renderResults(result, profile);
        scrollToTarget('#resultsSection');
      });
    }

    if (DOM.viewDetailsBtn) {
      DOM.viewDetailsBtn.addEventListener('click', () => {
        window.location.href = 'results.html';
      });
    }

    if (DOM.addProgressBtn) {
      DOM.addProgressBtn.addEventListener('click', () => {
        const date = DOM.progressDateInput ? DOM.progressDateInput.value : '';
        const weight = DOM.progressWeightInput ? toNumber(DOM.progressWeightInput.value) : NaN;
        if (!date || !Number.isFinite(weight) || weight < 10) {
          showMessage('Please enter a valid date and weight.');
          return;
        }
        addProgressEntry(date, weight);
        if (DOM.progressWeightInput) DOM.progressWeightInput.value = '';
      });
    }

    if (DOM.clearProgressBtn) {
      DOM.clearProgressBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear ALL saved progress data? This action cannot be undone.')) {
          clearProgress();
          showMessage('Progress data cleared.');
        }
      });
    }

    if (DOM.exportProgressBtn) {
      DOM.exportProgressBtn.addEventListener('click', exportProgress);
    }

    // Save PDF button (placeholder)
    if (DOM.savePdfBtn) {
      DOM.savePdfBtn.addEventListener('click', () => {
        showMessage('PDF export feature coming soon!');
      });
    }

    // Scroll to section button with data-scroll-target attribute
    const scrollButtons = document.querySelectorAll('button[data-scroll-target]');
    scrollButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetSelector = btn.getAttribute('data-scroll-target');
        if (targetSelector) {
          scrollToTarget(targetSelector);
        }
      });
    });
  }
  
  window.addEventListener('DOMContentLoaded', initApp);
