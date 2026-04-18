const introSection = document.getElementById("introSection");
const formSection = document.getElementById("formSection");
const resultSection = document.getElementById("resultSection");

const startButton = document.getElementById("startButton");
const retryButton = document.getElementById("retryButton");
const diagnosisForm = document.getElementById("diagnosisForm");
const resultContent = document.getElementById("resultContent");

startButton.addEventListener("click", () => {
  introSection.classList.add("hidden");
  formSection.classList.remove("hidden");
});

retryButton.addEventListener("click", () => {
  resultSection.classList.add("hidden");
  formSection.classList.remove("hidden");
  diagnosisForm.reset();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

diagnosisForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(diagnosisForm);

  const answers = {
    purpose: formData.get("purpose"),
    level: formData.get("level"),
    weakness: formData.get("weakness"),
    studyFrequency: formData.get("studyFrequency"),
    location: formData.get("location"),
    futurePlan: formData.get("futurePlan"),
    name: formData.get("name") || "",
    email: formData.get("email") || "",
    consent: formData.get("consent") ? true : false,
    source: getSourceFromURL()
  };

  const diagnosis = diagnoseType(answers);
  const resultData = resultPatterns[diagnosis.mainType][diagnosis.studyStyle];

  renderResult(resultData, answers);

  formSection.classList.add("hidden");
  resultSection.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });

  try {
    await sendToBackend(answers, diagnosis, resultData);
  } catch (error) {
    console.error("送信エラー:", error);
  }
});

function getSourceFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("source") || "direct";
}

function diagnoseType(answers) {
  let mainType = answers.purpose;
  let studyStyle = answers.studyFrequency;

  return {
    mainType,
    studyStyle
  };
}

function renderResult(resultData, answers) {
  resultContent.innerHTML = `
    <div>
      <span class="tag">${resultData.typeName}</span>
      <span class="tag">${resultData.styleName}</span>
      <span class="tag">レベル: ${answers.level.toUpperCase()}</span>
    </div>

    <div class="result-box">
      <h3>あなたの学習タイプ</h3>
      <p>${resultData.summary}</p>
    </div>

    <div class="result-box">
      <h3>おすすめの1週間プラン</h3>
      <ul>
        ${resultData.plan.map(item => `<li>${item}</li>`).join("")}
      </ul>
    </div>

    <div class="result-box">
      <h3>勉強のポイント</h3>
      <ul>
        ${resultData.advice.map(item => `<li>${item}</li>`).join("")}
      </ul>
    </div>

    <div class="result-box">
      <h3>ひとことアドバイス</h3>
      <p>
        苦手分野が「${translateWeakness(answers.weakness)}」なので、
        まずはそこを優先して学習すると効果が出やすいです。
      </p>
    </div>
  `;
}

function translateWeakness(value) {
  const map = {
    vocabulary: "語彙・漢字",
    grammar: "文法",
    reading: "読解",
    listening: "聴解",
    speaking: "会話",
    writing: "書くこと"
  };
  return map[value] || value;
}

async function sendToBackend(answers, diagnosis, resultData) {
  const endpoint = "https://YOUR_WORKER_URL.workers.dev";

  const payload = {
    createdAt: new Date().toISOString(),
    ...answers,
    diagnosisType: resultData.typeName,
    studyStyle: resultData.styleName,
    resultKey: `${diagnosis.mainType}_${diagnosis.studyStyle}`
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Backend request failed");
  }

  return response.json();
}
