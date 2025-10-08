// Results page renderer
(function(){
    const STORAGE_KEYS = {
      RESULT: 'drs_last_result',
      PROFILE_IMAGE: 'drs_profile_image',
      THEME: 'drs_theme',
      WATER_COUNT: 'drs_water_count',
    };

    // Cached DOM elements
    const DOM = {};

    function loadSnapshot(){
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.RESULT);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to load snapshot:', e);
        return null;
      }
    }

    function animateDial(bmi){
      const needle = DOM.dialNeedle;
      const elVal = DOM.bmiValueDial;
      const elCat = DOM.bmiCategoryDial;
      if (!needle) return;
      const clamped = Math.max(15, Math.min(35, bmi));
      const pct = (clamped - 15) / 20;
      const deg = 270 * pct - 135;
      requestAnimationFrame(() => {
        needle.style.transform = `rotate(${deg}deg)`;
        if (elVal) elVal.textContent = bmi.toFixed(1);
        if (elCat) elCat.textContent = bmi < 18.5 ? 'Underweight' : (bmi < 25 ? 'Normal' : (bmi < 30 ? 'Overweight' : 'Obese'));
      });
    }

    function formatPlanAsText(meals) {
      let text = 'Personalized Diet Plan\n\n';
      ['breakfast', 'lunch', 'dinner'].forEach(meal => {
        text += `${meal.charAt(0).toUpperCase() + meal.slice(1)}:\n`;
        meals[meal].forEach(item => text += `- ${item}\n`);
        text += '\n';
      });
      return text;
    }

    function render(snapshot){
      if (!snapshot) {
        document.body.insertAdjacentHTML('beforeend', '<div class="container mt-4"><div class="alert alert-warning">No results found. Please calculate on the input page.</div></div>');
        return;
      }
      const { profile, result, meals, image } = snapshot;

      // Update profile info
      if (DOM.resName) DOM.resName.textContent = profile.name || '—';
      if (DOM.resMeta) DOM.resMeta.textContent = `${profile.age}y, ${profile.height}cm, ${profile.activity}`;
      if (DOM.resProfileImg && image) DOM.resProfileImg.src = image;

      // Update BMI dial
      animateDial(result.bmi);

      // Update calories and progress
      if (DOM.caloriesNeed) DOM.caloriesNeed.textContent = result.dailyCalories;
      const maxCalories = 3000;
      const caloriePct = Math.min(100, (result.dailyCalories / maxCalories) * 100);
      if (DOM.calorieBar) DOM.calorieBar.style.width = `${caloriePct}%`;

      const goalWeight = profile.goal === 'lose' ? (profile.weight - 5) : (profile.goal === 'gain' ? (profile.weight + 5) : profile.weight);
      if (DOM.curW) DOM.curW.textContent = profile.weight;
      if (DOM.goalW) DOM.goalW.textContent = goalWeight;
      const goalPct = profile.goal === 'maintain' ? 50 : Math.min(100, ((profile.weight - (goalWeight - 5)) / 10) * 100);
      if (DOM.goalBar) DOM.goalBar.style.width = `${goalPct}%`;

      // Update meals
      if (DOM.resBreakfast) DOM.resBreakfast.innerHTML = meals.breakfast.map(item => `<li>${item}</li>`).join('');
      if (DOM.resLunch) DOM.resLunch.innerHTML = meals.lunch.map(item => `<li>${item}</li>`).join('');
      if (DOM.resDinner) DOM.resDinner.innerHTML = meals.dinner.map(item => `<li>${item}</li>`).join('');

      // Coach message
      const coachMsg = profile.goal === 'lose' ? 'Great job focusing on weight loss!' : profile.goal === 'gain' ? 'Keep building those muscles!' : 'Maintain your healthy lifestyle!';
      if (DOM.coachMsg) DOM.coachMsg.textContent = coachMsg;

      // Event listeners
      if (DOM.exportPlanBtn) {
        DOM.exportPlanBtn.addEventListener('click', () => {
          const text = formatPlanAsText(meals);
          const blob = new Blob([text], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'diet_plan.txt';
          a.click();
          URL.revokeObjectURL(url);
        });
      }

      if (DOM.savePlanBtn) {
        DOM.savePlanBtn.addEventListener('click', () => {
          localStorage.setItem('drs_saved_plan', JSON.stringify(snapshot));
          alert('Plan saved! You can re-open this results page anytime.');
        });
      }

      if (DOM.openGroceryModalBtn) {
        DOM.openGroceryModalBtn.addEventListener('click', () => {
          const modalEl = DOM.groceryModal;
          if (modalEl && window.bootstrap && bootstrap.Modal) {
            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
          }
        });
      }

      // Water tracker setup
      const waterCount = Number(localStorage.getItem(STORAGE_KEYS.WATER_COUNT) || 0);
      if (DOM.waterCountLabel) DOM.waterCountLabel.textContent = `${waterCount} glasses (${waterCount * 250}ml)`;
      const container = DOM.resWaterTracker;
      if (container) {
        container.innerHTML = '';
        for (let i = 0; i < 8; i++) {
          const glass = document.createElement('div');
          glass.className = 'water-glass';
          glass.classList.toggle('filled', i < waterCount);
          container.appendChild(glass);
        }
      }
    }
  
    window.addEventListener('DOMContentLoaded', ()=>{
      // Cache DOM elements
      DOM.resName = document.getElementById('resName');
      DOM.resMeta = document.getElementById('resMeta');
      DOM.resProfileImg = document.getElementById('resProfileImg');
      DOM.dialNeedle = document.getElementById('dialNeedle');
      DOM.bmiValueDial = document.getElementById('bmiValueDial');
      DOM.bmiCategoryDial = document.getElementById('bmiCategoryDial');
      DOM.caloriesNeed = document.getElementById('caloriesNeed');
      DOM.calorieBar = document.getElementById('calorieBar');
      DOM.curW = document.getElementById('curW');
      DOM.goalW = document.getElementById('goalW');
      DOM.goalBar = document.getElementById('goalBar');
      DOM.resBreakfast = document.getElementById('resBreakfast');
      DOM.resLunch = document.getElementById('resLunch');
      DOM.resDinner = document.getElementById('resDinner');
      DOM.coachMsg = document.getElementById('coachMsg');
      DOM.exportPlanBtn = document.getElementById('exportPlanBtn');
      DOM.savePlanBtn = document.getElementById('savePlanBtn');
      DOM.openGroceryModalBtn = document.getElementById('openGroceryModalBtn');
      DOM.waterCountLabel = document.getElementById('waterCountLabel');
      DOM.resWaterTracker = document.getElementById('resWaterTracker');
      DOM.groceryModal = document.getElementById('groceryModal');

      // Theme setup
      const root = document.documentElement;
      const btn = document.getElementById('themeToggle');
      const icon = document.getElementById('themeIcon');

      function applyTheme(theme){
        if (theme === 'dark') {
          root.setAttribute('data-theme', 'dark');
          if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
          if (btn) { btn.classList.remove('btn-light'); btn.classList.add('btn-warning'); btn.title = 'Switch to Light Mode'; }
        } else {
          root.removeAttribute('data-theme');
          if (icon) { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); }
          if (btn) { btn.classList.remove('btn-warning'); btn.classList.add('btn-light'); btn.title = 'Switch to Dark Mode'; }
        }
      }

      function getInitialTheme(){
        const saved = localStorage.getItem(STORAGE_KEYS.THEME);
        return saved === 'dark' ? 'dark' : 'light';
      }

      applyTheme(getInitialTheme());

      if (btn) {
        btn.addEventListener('click', () => {
          const currentTheme = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
          const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
          applyTheme(newTheme);
          localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
        });
      }

      render(loadSnapshot());

      // Initialize grocery modal for grocery list population
      function initGroceryModal() {
        const modalEl = document.getElementById('groceryModal');
        if (!modalEl || !window.bootstrap) return;

        modalEl.addEventListener('show.bs.modal', () => {
          const snapshotRaw = localStorage.getItem(STORAGE_KEYS.RESULT);
          if (snapshotRaw) {
            try {
              const snapshot = JSON.parse(snapshotRaw);
              const grocerySet = new Set();
              if (snapshot && snapshot.meals) {
                ['breakfast', 'lunch', 'dinner'].forEach((meal) => {
                  const arr = snapshot.meals[meal] || [];
                  arr.forEach((line) => {
                    line.split(/,|;|\band\b|(\(.+?\))/gi).map((s) => s ? s.replace(/[\(\)]/g, '').trim() : '').filter(Boolean).forEach((item) => {
                      let t = item.toLowerCase();
                      t = t.replace(/^(\d+[x]?\s*|\d+[\.]?\d*\s*(?:g|kg|ml|l|cup|cups|tbsp|tsp|oz|slice|slices)\s*)/, '');
                      t = t.replace(/\s{2,}/g, ' ').trim();
                      if (t) grocerySet.add(t.charAt(0).toUpperCase() + t.slice(1));
                    });
                  });
                });
              }
              const ul = document.getElementById('groceryList');
              if (ul) {
                ul.innerHTML = '';
                Array.from(grocerySet).sort().forEach((item) => {
                  const li = document.createElement('li');
                  li.textContent = item;
                  ul.appendChild(li);
                });
              }
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
      initGroceryModal();
    });
  })();
