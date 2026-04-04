const form = document.querySelector("#compareForm");
const vedicInput = document.querySelector("#vedicInput");
const lawInput = document.querySelector("#lawInput");
const submitButton = document.querySelector("#submitButton");
const clearButton = document.querySelector("#clearButton");
const statusText = document.querySelector("#statusText");
const errorBanner = document.querySelector("#errorBanner");
const resultGrid = document.querySelector("#resultGrid");
const emptyState = document.querySelector("#emptyState");
const similarityText = document.querySelector("#similarityText");
const explanationText = document.querySelector("#explanationText");
const applicationText = document.querySelector("#applicationText");
const metaText = document.querySelector("#metaText");
const sampleButtons = document.querySelectorAll(".sample-chip");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const vedicPrinciple = vedicInput.value.trim();
  const constitutionalLaw = lawInput.value.trim();

  if (!vedicPrinciple || !constitutionalLaw) {
    showError("Please enter both the Vedic principle and the constitutional law.");
    return;
  }

  setLoading(true);
  clearError();

  try {
    const response = await fetch("/api/compare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        vedicPrinciple,
        constitutionalLaw
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    renderResult(data.result, data.model, data.usage);
  } catch (error) {
    showError(error.message || "Something went wrong.");
  } finally {
    setLoading(false);
  }
});

clearButton.addEventListener("click", () => {
  form.reset();
  clearError();
  clearResult();
  vedicInput.focus();
});

for (const button of sampleButtons) {
  button.addEventListener("click", () => {
    vedicInput.value = button.dataset.vedic || "";
    lawInput.value = button.dataset.law || "";
    clearError();
    statusText.textContent = "Sample loaded. Generate the comparison when ready.";
    vedicInput.focus();
  });
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Generating..." : "Generate Comparison";
  statusText.textContent = isLoading
    ? "Analyzing philosophical alignment and preparing the structured result..."
    : statusText.textContent;
}

function renderResult(result, model, usage) {
  similarityText.textContent = result.similarity;
  explanationText.textContent = result.explanation;
  applicationText.textContent = result.application;

  resultGrid.classList.remove("hidden");
  emptyState.classList.add("hidden");
  statusText.textContent = "Comparison generated successfully.";

  const totalTokens = usage?.totalTokenCount || usage?.total_tokens;
  const tokenInfo = totalTokens ? ` | Tokens: ${totalTokens}` : "";
  metaText.textContent = model ? `Model: ${model}${tokenInfo}` : "";
}

function clearResult() {
  resultGrid.classList.add("hidden");
  emptyState.classList.remove("hidden");
  similarityText.textContent = "";
  explanationText.textContent = "";
  applicationText.textContent = "";
  metaText.textContent = "";
  statusText.textContent = "Enter both inputs and run the comparison.";
}

function showError(message) {
  errorBanner.textContent = message;
  errorBanner.classList.remove("hidden");
  statusText.textContent = "The comparison could not be generated.";
}

function clearError() {
  errorBanner.textContent = "";
  errorBanner.classList.add("hidden");
}
