/**
 * AtharvaAI — app.js
 * ─────────────────────────────────────────────────────────────
 * Frontend
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ── DOM REFERENCES ──────────────────────────────────────────────────────── */
const analyzeBtn       = document.getElementById('analyzeBtn');
const vedicInput       = document.getElementById('vedicInput');
const lawOutput        = document.getElementById('lawOutput');
const resultsPanel     = document.getElementById('resultsPanel');

// Result placeholders
const similarityScore  = document.getElementById('similarityScore');
const scoreArc         = document.getElementById('scoreArc');
const resultTitle      = document.getElementById('resultTitle');
const explanation      = document.getElementById('explanation');
const tagsContainer    = document.getElementById('tagsContainer');
const vedicFoundation  = document.getElementById('vedicFoundation');
const modernEquivalent = document.getElementById('modernEquivalent');
const analyticalSynthesis = document.getElementById('analyticalSynthesis');
const detailedSynthesis   = document.getElementById('detailedSynthesis');
const applicationsList    = document.getElementById('applicationsList');

/* ── CONSTANTS ────────────────────────────────────────────────────────────── */
// Full circumference of the SVG circle (r=68): 2π × 68 ≈ 427
const RING_CIRCUMFERENCE = 2 * Math.PI * 68;

/* ═══════════════════════════════════════════════════════════════════════════
   PUBLIC ENTRY POINT
   Called by the "Start Comparison" button (onclick="handleAnalyze()").
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * handleAnalyze()
 * Reads the Vedic input, validates it, logs it, then sets the UI
 * into a loading/ready state for the AI response that will be
 * injected later via populateResults().
 */
  async function handleAnalyze() {
  const principle = vedicInput.value.trim();

  if (!principle) {
    shakeField(vedicInput);
    vedicInput.focus();
    return;
  }

  console.log('[AtharvaAI] Analyzing:', principle);

  setButtonLoading(true);
  clearResults();
  hideResultsPanel();

  try {
    const res = await fetch("http://127.0.0.1:5000/compare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: principle })
    });

    const backendData = await res.json();
    console.log("BACKEND RESPONSE:", backendData);

    // 👇 Transform backend → frontend format
    const formattedData = transformBackendData(backendData);

    populateResults(formattedData);

  } catch (err) {
    console.error("API ERROR:", err);
    alert("Something broke 😭 check console");
  }

  setButtonLoading(false);
}

  // ────────────────────────────────────────────────────────────────
  // TODO: Replace the setTimeout below with your actual API call.
  //
  // Expected usage once backend is ready:
  //   const result = await fetchAnalysis(principle);
  //   populateResults(result);
  //
  // The populateResults() function accepts an object shaped like:
  //   {
  //     score: 84,                     // number 0–100
  //     constitutionArticle: "...",    // text for #lawOutput
  //     title: "Harmonious Convergence",
  //     explanation: "...",
  //     tags: ["Justice", "Equality"],
  //     vedicFoundation: "...",
  //     modernEquivalent: "...",
  //     analyticalSynthesis: "...",    // may contain <p> tags
  //     detailedSynthesis: "...",      // may contain <p> and <i> tags
  //     applications: [
  //       { heading: "Judicial Interpretation", items: ["...", "..."] },
  //       { heading: "Policy Framework",        items: ["...", "..."] }
  //     ]
  //   }
  // ────────────────────────────────────────────────────────────────


/* ═══════════════════════════════════════════════════════════════════════════
   BACKEND DATA TRANSFORM
   Maps backend response shape to frontend rendering shape.
   ═══════════════════════════════════════════════════════════════════════════ */

function transformBackendData(data) {
  const ai = data.ai_analysis;

  return {
    score: Math.round(data.similarity_score * 100),

    constitutionArticle: `${data.article.article} - ${data.article.text}`,

    title: ai.title,
    explanation: ai.explanation,
    tags: ai.tags,

    vedicFoundation: ai.explanation,
    modernEquivalent: data.article.text,

    analyticalSynthesis: ai.analytical_synthesis,
    detailedSynthesis: ai.detailed_synthesis,

    applications: [
      {
        heading: 'Applications',
        items: ai.applications
      }
    ]
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   RESULT POPULATION
   Call this with the data object once the AI returns a response.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * populateResults(data)
 * Accepts a structured result object and fills every placeholder element.
 * @param {Object} data - Structured AI response (see shape above)
 */
function populateResults(data) {
  if (!data || typeof data !== 'object') {
    console.error('[AtharvaAI] populateResults called with invalid data:', data);
    return;
  }

  // 1. Constitution article (readonly textarea)
  if (data.constitutionArticle) {
    lawOutput.value = data.constitutionArticle;
  }

  // 2. Similarity score ring + number
  if (typeof data.score === 'number') {
    renderScoreRing(data.score);
    similarityScore.textContent = `${data.score}%`;
  }

  // 3. Title
  if (data.title) {
    resultTitle.textContent = data.title;
  }

  // 4. Explanation
  if (data.explanation) {
    explanation.textContent = data.explanation;
  }

  // 5. Tags / chips
  if (Array.isArray(data.tags) && data.tags.length) {
    renderTags(data.tags);
  }

  // 6. Comparison cards
  if (data.vedicFoundation)  vedicFoundation.textContent  = data.vedicFoundation;
  if (data.modernEquivalent) modernEquivalent.textContent = data.modernEquivalent;

  // 7. Analytical synthesis (supports HTML for editorial drop-cap)
  if (data.analyticalSynthesis) {
    analyticalSynthesis.innerHTML = wrapParagraphs(data.analyticalSynthesis);
  }

  // 8. Detailed synthesis (two-column; supports italic tags)
  if (data.detailedSynthesis) {
    detailedSynthesis.innerHTML = wrapParagraphs(data.detailedSynthesis);
  }

  // 9. Practical applications
  if (Array.isArray(data.applications) && data.applications.length) {
    renderApplications(data.applications);
  }

  // Reveal the results panel with animation
  showResultsPanel();

  // Smooth scroll to results
  resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  console.log('[AtharvaAI] Results rendered successfully.');
}

/* ═══════════════════════════════════════════════════════════════════════════
   RENDER HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * renderScoreRing(score)
 * Animates the SVG arc to represent score (0–100).
 */
function renderScoreRing(score) {
  const clampedScore  = Math.max(0, Math.min(100, score));
  const filledLength  = (clampedScore / 100) * RING_CIRCUMFERENCE;
  const offset        = RING_CIRCUMFERENCE - filledLength;

  // Force a reflow so the CSS transition fires from the initial offset
  scoreArc.style.transition = 'none';
  scoreArc.style.strokeDashoffset = RING_CIRCUMFERENCE;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scoreArc.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
      scoreArc.style.strokeDashoffset = offset;
    });
  });
}

/**
 * renderTags(tags)
 * Creates chip elements and appends them to #tagsContainer.
 * @param {string[]} tags
 */
function renderTags(tags) {
  tagsContainer.innerHTML = '';
  tags.forEach(tag => {
    const chip = document.createElement('span');
    chip.className = 'chip chip--analysis';
    chip.textContent = tag;
    tagsContainer.appendChild(chip);
  });
}

/**
 * renderApplications(applications)
 * Builds application cards inside #applicationsList.
 * @param {Array<{heading: string, items: string[]}>} applications
 */
function renderApplications(applications) {
  applicationsList.innerHTML = '';
  applications.forEach(group => {
    const card = document.createElement('div');
    card.className = 'app-card';

    const title = document.createElement('h4');
    title.className = 'app-card__title';
    title.textContent = group.heading || '';
    card.appendChild(title);

    const list = document.createElement('ul');
    list.className = 'app-card__list';

    (group.items || []).forEach(item => {
      const li = document.createElement('li');
      li.className = 'app-card__item';

      // ICON FILE: 'check_circle' Material Symbol.
      // Replace with <img src="/assets/icons/check.svg"> if using custom icons.
      const icon = document.createElement('span');
      icon.className = 'app-card__item-icon material-symbols-outlined';
      icon.textContent = 'check_circle';

      const text = document.createElement('span');
      text.textContent = item;

      li.appendChild(icon);
      li.appendChild(text);
      list.appendChild(li);
    });

    card.appendChild(list);
    applicationsList.appendChild(card);
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   UI STATE HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

function setButtonLoading(isLoading) {
  if (isLoading) {
    analyzeBtn.classList.add('btn--loading');
    analyzeBtn.disabled = true;
    analyzeBtn.dataset.originalText = analyzeBtn.innerHTML;
    analyzeBtn.innerHTML = 'Analysing…';
  } else {
    analyzeBtn.classList.remove('btn--loading');
    analyzeBtn.disabled = false;
    // Restore original button contents (icon + label)
    analyzeBtn.innerHTML = '<span class="material-symbols-outlined">auto_awesome</span> Start Comparison';
  }
}

function showResultsPanel() {
  resultsPanel.classList.add('is-visible');
}

function hideResultsPanel() {
  resultsPanel.classList.remove('is-visible');
}

/**
 * clearResults()
 * Empties every placeholder element so stale data never shows.
 */
function clearResults() {
  similarityScore.textContent    = '—';
  resultTitle.textContent        = '';
  explanation.textContent        = '';
  tagsContainer.innerHTML        = '';
  vedicFoundation.textContent    = '';
  modernEquivalent.textContent   = '';
  analyticalSynthesis.innerHTML  = '';
  detailedSynthesis.innerHTML    = '';
  applicationsList.innerHTML     = '';
  lawOutput.value                = '';
  // Reset arc to empty
  if (scoreArc) {
    scoreArc.style.transition       = 'none';
    scoreArc.style.strokeDashoffset = RING_CIRCUMFERENCE;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITY HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * wrapParagraphs(text)
 * Splits a plain-text or lightly-HTML string into <p> tags
 * so the editorial drop-cap and column styling work properly.
 * Already-wrapped paragraphs are returned as-is.
 */
function wrapParagraphs(text) {
  if (!text) return '';
  // If it already contains block tags, trust it.
  if (/<(p|div|h[1-6])\b/.test(text)) return text;
  // Split on double newlines and wrap each chunk.
  return text
    .split(/\n{2,}/)
    .map(chunk => chunk.trim())
    .filter(Boolean)
    .map(chunk => `<p>${chunk}</p>`)
    .join('\n');
}

/**
 * shakeField(el)
 * Brief horizontal shake animation to signal a validation error.
 */
function shakeField(el) {
  el.style.transition = 'transform 0.05s ease';
  const keyframes = [0, -6, 6, -4, 4, -2, 2, 0];
  let i = 0;
  const step = () => {
    if (i >= keyframes.length) {
      el.style.transform = '';
      return;
    }
    el.style.transform = `translateX(${keyframes[i]}px)`;
    i++;
    setTimeout(step, 50);
  };
  step();
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUGGESTION FILTER
   Filters suggestion cards by tag keyword.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * filterSuggestions(tag)
 * Shows only suggestion cards whose data-tags attribute includes the tag.
 * Passing null / 'all' shows every card.
 * @param {string|null} tag
 */
function filterSuggestions(tag) {
  const cards   = document.querySelectorAll('.suggestion-card');
  const buttons = document.querySelectorAll('.chip--filter');

  // Update active filter chip
  buttons.forEach(btn => {
    btn.classList.toggle('is-active', btn.textContent.toLowerCase() === (tag || '').toLowerCase());
  });

  cards.forEach(card => {
    const cardTags = (card.dataset.tags || '').split(' ');
    const show     = !tag || tag === 'all' || cardTags.includes(tag.toLowerCase());
    card.classList.toggle('is-hidden', !show);
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════════════════ */

(function init() {
  // Ensure SVG ring starts at 0 fill
  if (scoreArc) {
    scoreArc.style.strokeDasharray  = RING_CIRCUMFERENCE;
    scoreArc.style.strokeDashoffset = RING_CIRCUMFERENCE;
  }
  console.log('[AtharvaAI] App initialised. Awaiting user input.');
})();
