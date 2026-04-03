// Diet Recommendation System - Frontend Logic

// In-memory data with localStorage persistence
const STORAGE_KEYS = {
    PROFILE: 'drs_profile',
    PROGRESS: 'drs_progress',
    THEME: 'drs_theme',
    PROFILE_IMAGE: 'drs_profile_image',
    RESULT: 'drs_last_result',
    WATER_COUNT: 'drs_water_count',
  WATER_DAY: 'drs_water_day',
  WATER_HISTORY: 'drs_water_history',
  WATER_STREAK: 'drs_water_streak',
  WATER_STREAK_DATE: 'drs_water_streak_date',
  ONBOARDING_DISMISSED: 'drs_onboarding_dismissed',
  ACHIEVEMENTS: 'drs_achievements',
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

  function showMessage(msg, title = 'Update') {
    const container = qs('#toastContainer');
    if (!container) {
      alert(msg);
      return;
    }

    const toast = document.createElement('div');
    toast.className = 'toast-custom';
    toast.innerHTML = `<div class="title">${title}</div><div class="message">${msg}</div>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 220);
    }, 2300);
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function loadWaterHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.WATER_HISTORY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error('Failed to load water history:', e);
      return {};
    }
  }

  function saveWaterHistory(history) {
    try {
      localStorage.setItem(STORAGE_KEYS.WATER_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save water history:', e);
    }
  }

  function loadAchievements() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        planStarter: Boolean(parsed.planStarter),
        hydrationHero: Boolean(parsed.hydrationHero),
        consistencyChamp: Boolean(parsed.consistencyChamp),
      };
    } catch {
      return { planStarter: false, hydrationHero: false, consistencyChamp: false };
    }
  }

  function saveAchievements(state) {
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(state));
  }

  let achievementsState = loadAchievements();

  function renderAchievements() {
    qsa('.achievement-item').forEach((el) => {
      const key = el.getAttribute('data-achievement');
      el.classList.toggle('unlocked', Boolean(achievementsState[key]));
    });
    const unlocked = Object.values(achievementsState).filter(Boolean).length;
    const counter = qs('#achievementCounter');
    if (counter) counter.textContent = `${unlocked}/3 unlocked`;
  }

  function unlockAchievement(key, message) {
    if (!Object.prototype.hasOwnProperty.call(achievementsState, key)) return;
    if (achievementsState[key]) return;
    achievementsState[key] = true;
    saveAchievements(achievementsState);
    renderAchievements();
    if (message) showMessage(message, 'Achievement Unlocked');
  }

  function animateNumber(el, from, to, decimals = 0, duration = 650) {
    if (!el) return;
    const start = performance.now();
    const safeFrom = Number.isFinite(from) ? from : 0;
    const safeTo = Number.isFinite(to) ? to : 0;

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = safeFrom + (safeTo - safeFrom) * eased;
      el.textContent = value.toFixed(decimals);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function setBmiNeedle(bmi) {
    const needle = qs('#bmiNeedle');
    if (!needle || !Number.isFinite(bmi)) return;
    const clamped = Math.max(15, Math.min(35, bmi));
    const pct = (clamped - 15) / 20;
    const deg = 270 * pct - 135;
    needle.style.transform = `rotate(${deg}deg)`;
  }

  function setCalculateLoading(loading) {
    const btn = DOM.calculateBtn;
    if (!btn) return;
    if (loading) {
      btn.classList.add('calculating');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Calculating...';
    } else {
      btn.classList.remove('calculating');
      btn.disabled = false;
      btn.textContent = 'Calculate Diet Plan';
    }
  }

  function initOnboardingTips() {
    const tips = qs('#onboardingTips');
    const dismissBtn = qs('#dismissTipsBtn');
    if (!tips) return;

    const dismissed = localStorage.getItem(STORAGE_KEYS.ONBOARDING_DISMISSED) === '1';
    if (!dismissed) tips.classList.remove('hidden');

    dismissBtn?.addEventListener('click', () => {
      tips.classList.add('hidden');
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_DISMISSED, '1');
    });
  }

  function updateLiveSummary() {
    const height = toNumber(qs('#height')?.value);
    const weight = toNumber(qs('#weight')?.value);
    const age = toNumber(qs('#age')?.value);
    const gender = qs('#gender')?.value;
    const activity = qs('#activity')?.value;
    const goal = qs('#goal')?.value;

    const bmiEl = qs('#liveBmi');
    const catEl = qs('#liveCategory');
    const calEl = qs('#liveCalories');

    if (!Number.isFinite(height) || !Number.isFinite(weight) || height <= 0) {
      if (bmiEl) bmiEl.textContent = '--';
      if (catEl) catEl.textContent = '--';
      if (calEl) calEl.textContent = '--';
      return;
    }

    const bmi = weight / Math.pow(height / 100, 2);
    if (bmiEl) bmiEl.textContent = bmi.toFixed(1);
    if (catEl) catEl.textContent = bmiCategory(bmi);

    if (!Number.isFinite(age) || !gender || !activity || !goal) {
      if (calEl) calEl.textContent = '--';
      return;
    }

    const bmr = mifflinStJeorBMR({ gender, weight, height, age });
    let calories = Math.round(bmr * (activityMultipliers[activity] || 1.2));
    if (goal === 'lose') calories -= 500;
    if (goal === 'gain') calories += 500;
    if (calEl) calEl.textContent = String(calories);
  }

  function initLiveSummary() {
    const ids = ['#age', '#gender', '#height', '#weight', '#activity', '#goal'];
    ids.forEach((id) => {
      const el = qs(id);
      if (!el) return;
      el.addEventListener('input', updateLiveSummary);
      el.addEventListener('change', updateLiveSummary);
    });
    updateLiveSummary();
  }

  function initSectionAwareNav() {
    const navLinks = qsa('.navbar .nav-link[href^="#"]');
    const sections = navLinks
      .map((link) => qs(link.getAttribute('href')))
      .filter(Boolean);

    if (!sections.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0.01 });

    sections.forEach((section) => observer.observe(section));
  }

  function initCardTilt() {
    const cards = qsa('.card');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rx = ((y / rect.height) - 0.5) * -3;
        const ry = ((x / rect.width) - 0.5) * 3;
        card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-3px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
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
    const bmiEl = qs('#bmiValue');
    const calEl = qs('#calories');
    const prevBmi = toNumber(bmiEl?.textContent);
    const prevCal = toNumber(calEl?.textContent);

    if (bmiEl) animateNumber(bmiEl, Number.isFinite(prevBmi) ? prevBmi : 0, result.bmi, 1);
    setBmiNeedle(result.bmi);
    if (qs('#bmiCategory')) qs('#bmiCategory').textContent = result.category;
    if (calEl) animateNumber(calEl, Number.isFinite(prevCal) ? prevCal : 0, result.dailyCalories, 0);
    
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
          showMessage('Grocery list copied to clipboard', 'Copied');
        }).catch(() => {
          showMessage('Failed to copy list. Please try again.', 'Error');
        });
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showMessage('Grocery list copied to clipboard', 'Copied'); } catch {}
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
    const streakEl = qs('#hydrationStreak');
    const resetBtn = qs('#resetWaterBtn');
    if (!tracker) return;

    const today = todayKey();
    let waterCount = parseInt(localStorage.getItem(STORAGE_KEYS.WATER_COUNT) || '0', 10);
    let streak = parseInt(localStorage.getItem(STORAGE_KEYS.WATER_STREAK) || '0', 10);
    let lastStreakDate = localStorage.getItem(STORAGE_KEYS.WATER_STREAK_DATE) || '';
    const savedDay = localStorage.getItem(STORAGE_KEYS.WATER_DAY);

    if (savedDay !== today) {
      waterCount = 0;
      localStorage.setItem(STORAGE_KEYS.WATER_DAY, today);
      localStorage.setItem(STORAGE_KEYS.WATER_COUNT, '0');
    }

    function updateWaterDisplay() {
      if (countEl) countEl.textContent = waterCount;
      if (volumeEl) volumeEl.textContent = waterCount * 250;
      localStorage.setItem(STORAGE_KEYS.WATER_COUNT, waterCount.toString());
      const day = todayKey();
      localStorage.setItem(STORAGE_KEYS.WATER_DAY, day);
      const history = loadWaterHistory();
      history[day] = waterCount;
      saveWaterHistory(history);

      if (streakEl) streakEl.textContent = `Streak: ${streak} day${streak === 1 ? '' : 's'}`;

      // Update glasses
      const glasses = qsa('.water-glass');
      glasses.forEach((glass, i) => {
        glass.classList.toggle('filled', i < waterCount);
      });

      const nowDay = todayKey();
      if (waterCount >= 8 && lastStreakDate !== nowDay) {
        const prevDay = new Date(nowDay);
        prevDay.setDate(prevDay.getDate() - 1);
        const prevKey = prevDay.toISOString().slice(0, 10);

        if (lastStreakDate === prevKey) streak += 1;
        else streak = 1;

        lastStreakDate = nowDay;
        localStorage.setItem(STORAGE_KEYS.WATER_STREAK, String(streak));
        localStorage.setItem(STORAGE_KEYS.WATER_STREAK_DATE, nowDay);
        if (streakEl) streakEl.textContent = `Streak: ${streak} day${streak === 1 ? '' : 's'}`;
        unlockAchievement('hydrationHero', 'Hydration Hero: You hit 8 glasses in a day.');
        showMessage('Great consistency. Daily hydration target reached.', 'Hydration');
      }

      renderWeeklyInsights();
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
        showMessage('Today\'s water intake has been reset.', 'Hydration');
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

  function shuffleMealsFromCurrentResult() {
    const snapshotRaw = localStorage.getItem(STORAGE_KEYS.RESULT);
    if (!snapshotRaw) {
      showMessage('Calculate a plan first to shuffle meals.', 'Info');
      return;
    }

    try {
      const snapshot = JSON.parse(snapshotRaw);
      const meals = snapshot.meals;
      if (!meals) return;

      const shuffled = {};
      ['breakfast', 'lunch', 'dinner'].forEach((meal) => {
        const list = [...(meals[meal] || [])];
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [list[i], list[j]] = [list[j], list[i]];
        }
        shuffled[meal] = list;
      });

      snapshot.meals = shuffled;
      localStorage.setItem(STORAGE_KEYS.RESULT, JSON.stringify(snapshot));
      updateDietRecommendations(shuffled);
      showMessage('Meal suggestions shuffled for variety.', 'Updated');
    } catch {
      showMessage('Unable to shuffle meals right now.', 'Error');
    }
  }

  function initQuickActions() {
    const fab = qs('#quickActionFab');
    const panel = qs('#quickActionPanel');
    if (!fab || !panel) return;

    fab.addEventListener('click', () => {
      panel.classList.toggle('hidden');
    });

    qsa('[data-quick-target]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-quick-target');
        if (target) scrollToTarget(target);
        panel.classList.add('hidden');
      });
    });

    qs('#quickToggleThemeBtn')?.addEventListener('click', () => {
      const darkToggle = qs('#darkToggle');
      if (!darkToggle) return;
      darkToggle.checked = !darkToggle.checked;
      darkToggle.dispatchEvent(new Event('change', { bubbles: true }));
      panel.classList.add('hidden');
    });

    qs('#quickExportProgressBtn')?.addEventListener('click', () => {
      exportProgress();
      panel.classList.add('hidden');
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        panel.classList.toggle('hidden');
      }
    });
  }

  // Progress tracking functions
  let progressData = [];
  let isCalculating = false;

  function renderSparkline(containerId, values, color, labels = [], valueFormatter = (v) => String(v)) {
    const container = qs(containerId);
    if (!container) return;
    if (!Array.isArray(values) || values.length < 2) {
      container.innerHTML = '';
      return;
    }

    const width = Math.max(140, container.clientWidth || 180);
    const height = 34;
    const pad = 2;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const pointsData = values.map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (width - pad * 2);
      const y = height - pad - ((v - min) / range) * (height - pad * 2);
      return { x, y, v, i };
    });

    const points = pointsData.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    const circles = pointsData.map((p) => `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="3.2" fill="${color}" stroke="#ffffff" stroke-width="1" data-index="${p.i}" class="spark-point" />`).join('');

    container.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="trend sparkline"><polyline points="${points}" style="stroke:${color};" />${circles}</svg><div class="spark-tooltip"></div>`;

    const tooltip = container.querySelector('.spark-tooltip');
    const svg = container.querySelector('svg');
    if (!tooltip || !svg) return;

    svg.addEventListener('mousemove', (evt) => {
      const target = evt.target;
      if (!target.classList.contains('spark-point')) {
        tooltip.style.display = 'none';
        return;
      }

      const idx = Number(target.getAttribute('data-index'));
      const label = labels[idx] || `Point ${idx + 1}`;
      const value = valueFormatter(values[idx]);
      tooltip.textContent = `${label}: ${value}`;
      tooltip.style.display = 'block';

      const rect = svg.getBoundingClientRect();
      const x = evt.clientX - rect.left;
      const y = evt.clientY - rect.top;
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${Math.max(6, y - 22)}px`;
    });

    svg.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  }

  function renderWeeklyInsights() {
    const calorieEl = qs('#weeklyCalories');
    const hydrationEl = qs('#weeklyHydration');
    const trendEl = qs('#weeklyTrend');
    const trendNoteEl = qs('#weeklyTrendNote');
    const hydrationSeries = [];
    const trendSeries = [];
    if (!calorieEl || !hydrationEl || !trendEl || !trendNoteEl) return;

    const snapshotRaw = localStorage.getItem(STORAGE_KEYS.RESULT);
    if (snapshotRaw) {
      try {
        const snapshot = JSON.parse(snapshotRaw);
        const calories = snapshot?.result?.dailyCalories;
        calorieEl.textContent = Number.isFinite(calories) ? `${calories} cal/day` : '--';
      } catch {
        calorieEl.textContent = '--';
      }
    } else {
      calorieEl.textContent = '--';
    }

    const history = loadWaterHistory();
    let completedDays = 0;
    const hydrationLabels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = history[key] || 0;
      hydrationSeries.push(count);
      hydrationLabels.push(d.toLocaleDateString(undefined, { weekday: 'short' }));
      if (count >= 8) completedDays += 1;
    }
    const pct = Math.round((completedDays / 7) * 100);
    hydrationEl.textContent = `${completedDays}/7 days (${pct}%)`;
    renderSparkline('#weeklyHydrationSpark', hydrationSeries, '#0ea5e9', hydrationLabels, (v) => `${v} glasses`);

    if (!progressData.length || progressData.length < 2) {
      trendEl.textContent = '--';
      trendNoteEl.textContent = 'Add at least 2 progress entries to view trend.';
      renderSparkline('#weeklyTrendSpark', [], '#f97316');
      return;
    }

    const sorted = [...progressData].sort((a, b) => a.timestamp - b.timestamp);
    const trendLabels = [];
    sorted.slice(-7).forEach((item) => {
      trendSeries.push(item.weight);
      trendLabels.push(item.date);
    });
    const first = sorted[0].weight;
    const last = sorted[sorted.length - 1].weight;
    const diff = Number((last - first).toFixed(1));
    if (diff < 0) {
      trendEl.textContent = `Down ${Math.abs(diff)} kg`;
      trendNoteEl.textContent = 'Overall weight is trending downward.';
    } else if (diff > 0) {
      trendEl.textContent = `Up ${diff} kg`;
      trendNoteEl.textContent = 'Overall weight is trending upward.';
    } else {
      trendEl.textContent = 'Stable';
      trendNoteEl.textContent = 'Weight has stayed steady across entries.';
    }
    renderSparkline('#weeklyTrendSpark', trendSeries, '#f97316', trendLabels, (v) => `${v} kg`);
  }

  function addProgressEntry(date, weight) {
    console.log('addProgressEntry called with date:', date, 'weight:', weight);
    const entry = { date, weight, timestamp: new Date(date).getTime() };
    progressData.push(entry);
    progressData.sort((a, b) => a.timestamp - b.timestamp);
    saveProgressToStorage(progressData);
    updateProgressSummary();
    renderProgressChart();
    renderWeeklyInsights();
    if (progressData.length >= 3) {
      unlockAchievement('consistencyChamp', 'Consistency Champ: 3+ progress entries logged.');
    }
    console.log('Progress entry added, data length:', progressData.length);
  }

  function clearProgress() {
    progressData = [];
    saveProgressToStorage(progressData);
    updateProgressSummary();
    renderProgressChart();
    renderWeeklyInsights();
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
    initSectionAwareNav();
    initCardTilt();
    initLiveSummary();
    initOnboardingTips();
    initQuickActions();
    renderAchievements();

    if (DOM.progressDateInput) DOM.progressDateInput.value = new Date().toISOString().split('T')[0];

    // Load saved data
    progressData = loadProgressFromStorage();
    updateProgressSummary();
    renderProgressChart();
    renderWeeklyInsights();

    // Load saved profile
    const savedProfile = loadProfileFromStorage();
    if (savedProfile) {
      Object.keys(savedProfile).forEach(key => {
        const el = qs(`#${key}`);
        if (el) el.value = savedProfile[key];
      });
      updateLiveSummary();
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
        if (isCalculating) return;
        console.log('Calculate button clicked');
        if (!applyValidation(DOM.form)) {
          console.log('Form validation failed');
          scrollToTarget(DOM.form);
          return;
        }

        isCalculating = true;
        setCalculateLoading(true);

        setTimeout(() => {
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
        unlockAchievement('planStarter', 'Plan Starter: First personalized plan created.');
        renderWeeklyInsights();
        scrollToTarget('#resultsSection');
        setCalculateLoading(false);
        isCalculating = false;
        }, 450);
      });
    }

    if (DOM.viewDetailsBtn) {
      DOM.viewDetailsBtn.addEventListener('click', () => {
        window.location.href = 'results.html';
      });
    }

    qs('#shuffleMealsBtn')?.addEventListener('click', shuffleMealsFromCurrentResult);

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
          showMessage('Progress data cleared.', 'Progress');
        }
      });
    }

    if (DOM.exportProgressBtn) {
      DOM.exportProgressBtn.addEventListener('click', exportProgress);
    }

    // Save PDF button (placeholder)
    if (DOM.savePdfBtn) {
      DOM.savePdfBtn.addEventListener('click', () => {
        showMessage('PDF export feature coming soon!', 'Info');
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
