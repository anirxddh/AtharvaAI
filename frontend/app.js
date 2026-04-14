/**
 * AtharvaAI — app.js
 * ─────────────────────────────────────────────────────────────
 * Frontend
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const analyzeBtn       = document.getElementById('analyzeBtn');
const vedicInput       = document.getElementById('vedicInput');
const lawOutput        = document.getElementById('lawOutput');
const resultsPanel     = document.getElementById('resultsPanel');

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

const RING_CIRCUMFERENCE = 2 * Math.PI * 68;

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

    const formattedData = transformBackendData(backendData);

    populateResults(formattedData);

  } catch (err) {
    console.error("API ERROR:", err);
    alert("Sorry, an error occurred while fetching the analysis. check the console for details.");
  }

  setButtonLoading(false);
}

function scrollToInput() {
  const section = document.getElementById('inputSection');
  if (!section) return;

  const rect           = section.getBoundingClientRect();
  const sectionHeight  = rect.height;
  const viewportHeight = window.innerHeight;
  const sectionTop     = rect.top + window.scrollY;

  // Adjust this value to tune the vertical centering target.
  const OFFSET = 80;

  const targetScrollY = sectionTop - (viewportHeight / 2) + (sectionHeight / 2) - OFFSET;

  window.scrollTo({
    top:      Math.max(0, targetScrollY),
    behavior: 'smooth'
  });
}

function sanitizeText(text) {
  if (!text) return '';
  return text.replace(/\*\*/g, '');
}

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

function populateResults(data) {
  if (!data || typeof data !== 'object') {
    console.error('[AtharvaAI] populateResults called with invalid data:', data);
    return;
  }

  if (data.constitutionArticle) {
    lawOutput.value = data.constitutionArticle;
  }

  if (typeof data.score === 'number') {
    renderScoreRing(data.score);
    similarityScore.textContent = `${data.score}%`;
  }

  if (data.title) {
    resultTitle.textContent = data.title;
  }

  if (data.explanation) {
    const element = explanation;
    element.textContent = sanitizeText(data.explanation);
  }

  if (Array.isArray(data.tags) && data.tags.length) {
    renderTags(data.tags);
  }

  if (data.vedicFoundation)  vedicFoundation.textContent  = data.vedicFoundation;
  if (data.modernEquivalent) modernEquivalent.textContent = data.modernEquivalent;

  if (data.analyticalSynthesis) {
    analyticalSynthesis.innerHTML = wrapParagraphs(data.analyticalSynthesis);
  }

  if (data.detailedSynthesis) {
    detailedSynthesis.innerHTML = wrapParagraphs(data.detailedSynthesis);
  }

  if (Array.isArray(data.applications) && data.applications.length) {
    renderApplications(data.applications);
  }

  showResultsPanel();

  resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  console.log('[AtharvaAI] Results rendered successfully.');
}

function renderScoreRing(score) {
  const clampedScore  = Math.max(0, Math.min(100, score));
  const filledLength  = (clampedScore / 100) * RING_CIRCUMFERENCE;
  const offset        = RING_CIRCUMFERENCE - filledLength;

  // Force reflow so the transition starts from an empty ring.
  scoreArc.style.transition = 'none';
  scoreArc.style.strokeDashoffset = RING_CIRCUMFERENCE;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scoreArc.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
      scoreArc.style.strokeDashoffset = offset;
    });
  });
}

function renderTags(tags) {
  tagsContainer.innerHTML = '';
  tags.forEach(tag => {
    const chip = document.createElement('span');
    chip.className = 'chip chip--analysis';
    chip.textContent = tag;
    tagsContainer.appendChild(chip);
  });
}

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

      // Replace this Material Symbol with your own icon asset if needed.
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

function setButtonLoading(isLoading) {
  if (isLoading) {
    analyzeBtn.classList.add('btn--loading');
    analyzeBtn.disabled = true;
    analyzeBtn.dataset.originalText = analyzeBtn.innerHTML;
    analyzeBtn.innerHTML = 'Analysing…';
  } else {
    analyzeBtn.classList.remove('btn--loading');
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = '<span class="material-symbols-outlined">auto_awesome</span> Start Comparison';
  }
}

function showResultsPanel() {
  resultsPanel.classList.add('is-visible');
}

function hideResultsPanel() {
  resultsPanel.classList.remove('is-visible');
}

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
  if (scoreArc) {
    scoreArc.style.transition       = 'none';
    scoreArc.style.strokeDashoffset = RING_CIRCUMFERENCE;
  }
}
function wrapParagraphs(text) {
  if (!text) return '';
  if (/<(p|div|h[1-6])\b/.test(text)) return text;
  return text
    .split(/\n{2,}/)
    .map(chunk => chunk.trim())
    .filter(Boolean)
    .map(chunk => `<p>${chunk}</p>`)
    .join('\n');
}

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
// ===== PREDEFINED SUGGESTIONS =====
const suggestions = {
  dharma: "The principle of Dharma emphasizes justice, duty, fairness, and moral responsibility in maintaining social order and equality.",
  nyaya: "Nyaya philosophy focuses on logic, reasoning, fairness, and evidence-based justice, ensuring truth and impartial judgment in society.",
  environment: "Humans must protect nature, preserve ecological balance, and act responsibly towards the environment for sustainable living."
};

// ===== HANDLE SUGGESTION CLICK =====
function useSuggestion(key) {
  const inputBox = document.getElementById('vedicInput');

  if (!suggestions[key]) return;

  inputBox.value = suggestions[key];

  console.log('[AtharvaAI] Suggestion selected:', key);

  scrollToInput();

  setTimeout(() => {
    handleAnalyze();
  }, 300);
}

function filterSuggestions(tag) {
  const cards   = document.querySelectorAll('.suggestion-card');
  const buttons = document.querySelectorAll('.chip--filter');

  buttons.forEach(btn => {
    btn.classList.toggle('is-active', btn.textContent.toLowerCase() === (tag || '').toLowerCase());
  });

  cards.forEach(card => {
    const cardTags = (card.dataset.tags || '').split(' ');
    const show     = !tag || tag === 'all' || cardTags.includes(tag.toLowerCase());
    card.classList.toggle('is-hidden', !show);
  });
}

(function init() {
  if (scoreArc) {
    scoreArc.style.strokeDasharray  = RING_CIRCUMFERENCE;
    scoreArc.style.strokeDashoffset = RING_CIRCUMFERENCE;
  }
  console.log('[AtharvaAI] App initialised. Awaiting user input.');
})();
