# Diet Recommendation System

A lightweight, client-side diet planning app that generates personalized meal plans based on BMI, age, height, weight, activity level, fitness goal, and dietary preference. It also includes progress tracking, hydration tracking, weekly insights, achievements, theme switching, and local persistence using `localStorage`.

## Features

- BMI calculation with category classification
- Personalized daily calorie estimate
- Goal-based meal recommendations for breakfast, lunch, and dinner
- Vegetarian and vegan meal substitutions
- Meal shuffle for quick plan variation
- Grocery list modal with copy and download actions
- Weight progress tracker with chart and export
- Weekly insights for calories, hydration, and trend overview
- Hydration tracker with streak support
- Achievements system for progress milestones
- Dark mode toggle
- Quick actions panel for fast navigation
- Print-friendly output for saving the plan

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Bootstrap 5.3
- Font Awesome 6
- Browser `localStorage`

## Project Structure

- `index.html` - Main application page and all UI sections
- `app.js` - Diet calculation logic, storage, charts, hydration, achievements, and interactions
- `style.css` - Custom styling, responsive layout, dark mode, animations, and print support
- `results.html` - Detailed results page for the generated plan
- `results.js` - Logic for the detailed results page
- `MealPlanCalculator.js` - Meal recommendation helpers and calculations
- `api-service.js` - API-related utility layer used by the app

## How It Works

1. Enter your profile details in the BMI calculator.
2. The app calculates BMI and estimated daily calorie needs.
3. A meal plan is generated based on your goal and dietary preference.
4. You can shuffle meals, view the full plan, or save and print it.
5. Track weight entries, hydration, and weekly trends over time.
6. All data is stored locally in your browser.

## Getting Started

### Option 1: Open directly

Open `index.html` in your browser.

### Option 2: Use Live Server

If you are using VS Code, install the Live Server extension and open the project with a local server for the smoothest experience.

## Usage

### Generate a diet plan

1. Open the app.
2. Fill in your name, age, gender, height, weight, activity level, goal, and dietary preference.
3. Click `Calculate Diet Plan`.
4. Review the BMI, calorie estimate, and meal plan.

### Track progress

1. Enter a date and weight in the progress tracker.
2. Add entries regularly to see the chart update.
3. Use export or clear data when needed.

### Track hydration

1. Click the water glasses to log intake.
2. Reach 8 glasses to complete the daily hydration target.
3. Build streaks to unlock hydration achievements.

### Use quick actions

- Open the quick actions panel for fast navigation.
- Use it to jump to calculator, hydration, theme switching, or progress export.

## Data Storage

The application stores the following locally in your browser:

- User profile details
- Last calculated result
- Weight progress entries
- Hydration count and history
- Theme preference
- Profile image
- Achievements

If you clear browser storage, the saved data will be removed.

## Customization

You can customize the app by editing:

- `style.css` for colors, spacing, and layout
- `app.js` for calorie logic, meal options, or tracking behavior
- `index.html` for section text, structure, or contact details

## Browser Support

The app is designed for modern browsers that support:

- CSS variables
- `localStorage`
- SVG rendering
- Bootstrap 5 components

## Notes

- The app is fully client-side and does not require a backend.
- The generated meal plan is a recommendation tool, not medical advice.
- For best results, serve the project through a local web server when developing.

