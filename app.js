// Default Syllabus (Fallbacks - Fully Updated via PDF specification)
const defaultSyllabusData = {
  biology: [
    "1. Introduction to Biology",
    "2. Chemical and Cellular Basis of Life",
    "3. Evolution and Diversity of Organisms",
    "4. Plant Form and Function",
    "5. Animal Form and Function",
    "6. Genetics",
    "7. Molecular Biology and Recombinant DNA Technology",
    "8. Environmental Biology",
    "9. Microbiology",
    "10. Applied Biology",
  ],
  physics: [
    "1. Measurement",
    "2. Mechanics",
    "3. Oscillations and Waves",
    "4. Thermal Physics",
    "5. Gravitational Field",
    "6. Electrostatic Field",
    "7. Magnetic Field",
    "8. Current Electricity",
    "9. Electronics",
    "10. Mechanical Properties of Matter",
    "11. Matter and Radiation",
  ],
  chemistry: [
    "1. Atomic Structure",
    "2. Structure and Bonding",
    "3. Chemical Calculations (Stoichiometry)",
    "4. Gaseous State of Matter",
    "5. Energetics",
    "6. Chemistry of s, p, and d Block Elements",
    "7. Basic Concepts of Organic Chemistry",
    "8. Hydrocarbons and Halocarbons",
    "9. Oxygen and Nitrogen Containing Organic Compounds",
    "10. Chemical Kinetics",
    "11. Equilibrium",
    "12. Electrochemistry",
    "13. Industrial Chemistry and Environmental Pollution",
    "14. Chemistry in the Service of Mankind",
  ],
  combinedMaths: [
    "Pure: 1. Foundations of Mathematics",
    "Pure: 2. Polynomials",
    "Pure: 3. Quadratic Equations",
    "Pure: 4. Inequalities",
    "Pure: 5. Partial Fractions",
    "Pure: 6. Trigonometry",
    "Pure: 7. Mathematical Induction",
    "Pure: 8. Permutations and Combinations",
    "Pure: 9. Binomial Expansion",
    "Pure: 10. Sequences and Series",
    "Pure: 11. Complex Numbers",
    "Pure: 12. Limits",
    "Pure: 13. Differentiation",
    "Pure: 14. Applications of Differentiation",
    "Pure: 15. Integration",
    "Pure: 16. Applications of Integration",
    "Pure: 17. Coordinate Geometry (Straight Line)",
    "Pure: 18. Coordinate Geometry (Circle)",
    "Pure: 19. Matrices",
    "Applied: 1. Vectors",
    "Applied: 2. Coplanar Forces on a Particle",
    "Applied: 3. Coplanar Forces on a Rigid Body",
    "Applied: 4. Friction",
    "Applied: 5. Centre of Gravity/Mass",
    "Applied: 6. Kinematics (Linear Motion)",
    "Applied: 7. Relative Velocity",
    "Applied: 8. Projectile Motion",
    "Applied: 9. Newton's Laws of Motion",
    "Applied: 10. Work, Energy, and Power",
    "Applied: 11. Circular Motion",
    "Applied: 12. Simple Harmonic Motion",
    "Applied: 13. Probability",
    "Applied: 14. Statistics",
  ],
};

const defaultStreams = {
  "Biology Science": {
    subjects: {
      Biology: defaultSyllabusData.biology,
      Physics: defaultSyllabusData.physics,
      Chemistry: defaultSyllabusData.chemistry,
    },
  },
  "Physical Science": {
    subjects: {
      "Combined Maths": defaultSyllabusData.combinedMaths,
      Physics: defaultSyllabusData.physics,
      Chemistry: defaultSyllabusData.chemistry,
    },
  },
};

// Initialize App Data securely mapping to localStorage so Admin updates immediately reflect here
let appData = JSON.parse(localStorage.getItem("dnp_appData"));

// Detection logic to force-update if the user still has the old short list in local storage
let needsUpdate = false;
if (appData && appData.streams && appData.streams["Biology Science"]) {
  if (appData.streams["Biology Science"].subjects.Biology.length <= 3) {
    needsUpdate = true;
  }
}

if (!appData || !appData.streams || needsUpdate) {
  appData = { streams: defaultStreams };
  localStorage.setItem("dnp_appData", JSON.stringify(appData));
}

const streams = appData.streams;

// DOM Elements
const streamSelect = document.getElementById("streamSelect");
const subjectSelect = document.getElementById("subjectSelect");
const topicSelect = document.getElementById("topicSelect");
const startBtn = document.getElementById("startBtn");
const finishBtn = document.getElementById("finishBtn");
const timeDisplay = document.getElementById("timeDisplay");
const progressContainer = document.getElementById("progressBarsContainer");
const pomodoroToggle = document.getElementById("pomodoroToggle");
const pomoTimeInput = document.getElementById("pomoTimeInput");

const sidebarToggle = document.getElementById("sidebarToggle");
const appSidebar = document.getElementById("appSidebar");
const toggleSessionBtn = document.getElementById("toggleSessionBtn");
const sessionContent = document.getElementById("sessionContent");
const mainGrid = document.getElementById("mainGrid");
const chartTimeframeSelect = document.getElementById("chartTimeframeSelect");
const mainDashboard = document.getElementById("mainDashboard"); // For drag scroll

const notesSection = document.getElementById("notesSection");
const sessionNotesList = document.getElementById("sessionNotesList");
const noteInput = document.getElementById("noteInput");
const addNoteBtn = document.getElementById("addNoteBtn");
const notePrefix = document.getElementById("notePrefix");

// State
let timerInterval;
let secondsElapsed = 0;
let defaultPomoMins = parseInt(pomoTimeInput.value) || 25;
let pomodoroSeconds = defaultPomoMins * 60;
let isRunning = false;
let currentSubject = "";
let currentTopic = "";
let chartInstance = null;
let customHistoricalDates = null;
let currentSessionNotes = [];

document.getElementById("currentDate").textContent =
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// Populate Stream Dropdown dynamically
Object.keys(streams).forEach((streamName) => {
  let opt = document.createElement("option");
  opt.value = streamName;
  opt.textContent = streamName;
  streamSelect.appendChild(opt);
});

// UI Toggles Implementations (With Chart Resize Fix added)
sidebarToggle.addEventListener("click", () => {
  appSidebar.classList.toggle("collapsed");
  sidebarToggle.classList.toggle("collapsed");
  sidebarToggle.innerHTML = appSidebar.classList.contains("collapsed")
    ? '<i class="fas fa-chevron-right"></i>'
    : '<i class="fas fa-chevron-left"></i>';

  // Wait for 0.3s CSS transition to complete, then resize chart
  setTimeout(() => {
    if (chartInstance) chartInstance.resize();
  }, 300);
});

toggleSessionBtn.addEventListener("click", () => {
  sessionContent.classList.toggle("hidden");
  mainGrid.classList.toggle("session-collapsed");
  let isHidden = sessionContent.classList.contains("hidden");
  toggleSessionBtn.innerHTML = isHidden
    ? '<i class="fas fa-expand-alt"></i>'
    : '<i class="fas fa-compress-alt"></i>';

  // Wait for 0.3s CSS transition to complete, then resize chart
  setTimeout(() => {
    if (chartInstance) chartInstance.resize();
  }, 300);
});

// --- PRO FEATURE: DRAG TO SCROLL (Up/Down/Left/Right) ---
let isDragging = false;
let startX, startY, scrollLeft, scrollTop;

mainDashboard.addEventListener("mousedown", (e) => {
  // Prevent dragging if clicking interactable elements
  if (
    ["INPUT", "BUTTON", "SELECT", "CANVAS", "A", "LI", "LABEL"].includes(
      e.target.tagName,
    ) ||
    e.target.closest(".custom-input") ||
    e.target.closest(".btn")
  )
    return;

  isDragging = true;
  mainDashboard.classList.add("grabbing-cursor");
  startX = e.pageX - mainDashboard.offsetLeft;
  startY = e.pageY - mainDashboard.offsetTop;
  scrollLeft = mainDashboard.scrollLeft;
  scrollTop = mainDashboard.scrollTop;
});

mainDashboard.addEventListener("mouseleave", () => {
  isDragging = false;
  mainDashboard.classList.remove("grabbing-cursor");
});

mainDashboard.addEventListener("mouseup", () => {
  isDragging = false;
  mainDashboard.classList.remove("grabbing-cursor");
});

mainDashboard.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  e.preventDefault();
  const x = e.pageX - mainDashboard.offsetLeft;
  const y = e.pageY - mainDashboard.offsetTop;
  const walkX = (x - startX) * 1.5; // Drag speed multiplier
  const walkY = (y - startY) * 1.5;
  mainDashboard.scrollLeft = scrollLeft - walkX;
  mainDashboard.scrollTop = scrollTop - walkY;
});
// --------------------------------------------------------

// Notes Logic
topicSelect.addEventListener("change", (e) => {
  if (e.target.value) {
    notesSection.style.display = "block";
    resetNotes();
  } else {
    notesSection.style.display = "none";
  }
});

function resetNotes() {
  currentSessionNotes = [];
  sessionNotesList.innerHTML = "";
  noteInput.value = "";
  notePrefix.textContent = "1.";
}

addNoteBtn.addEventListener("click", () => {
  if (noteInput.value.trim() !== "") {
    currentSessionNotes.push(noteInput.value.trim());
    let li = document.createElement("li");
    li.textContent = `${currentSessionNotes.length}. ${noteInput.value.trim()}`;
    sessionNotesList.appendChild(li);
    noteInput.value = "";
    notePrefix.textContent = `${currentSessionNotes.length + 1}.`;
  }
});
noteInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addNoteBtn.click();
});

// Dropdowns Logic
streamSelect.addEventListener("change", (e) => {
  const stream = e.target.value;
  subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
  topicSelect.innerHTML = '<option value="">Select Subject First</option>';
  subjectSelect.disabled = !stream;
  topicSelect.disabled = true;
  notesSection.style.display = "none";
  if (stream) {
    Object.keys(streams[stream].subjects).forEach((sub) => {
      let opt = document.createElement("option");
      opt.value = sub;
      opt.textContent = sub;
      subjectSelect.appendChild(opt);
    });
  }
});

subjectSelect.addEventListener("change", (e) => {
  const stream = streamSelect.value;
  const subject = e.target.value;
  topicSelect.innerHTML = '<option value="">-- Select Topic --</option>';
  topicSelect.disabled = !subject;
  notesSection.style.display = "none";
  if (subject) {
    streams[stream].subjects[subject].forEach((topic) => {
      let opt = document.createElement("option");
      opt.value = topic;
      opt.textContent = topic;
      topicSelect.appendChild(opt);
    });
  }
});

// Timer formatting
function formatTime(totalSeconds) {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function updatePomoDisplay() {
  if (!isRunning) {
    defaultPomoMins = parseInt(pomoTimeInput.value) || 25;
    pomodoroSeconds = defaultPomoMins * 60;
    timeDisplay.textContent = pomodoroToggle.checked
      ? formatTime(pomodoroSeconds)
      : "00:00:00";
  }
}
pomodoroToggle.addEventListener("change", updatePomoDisplay);
pomoTimeInput.addEventListener("change", updatePomoDisplay);

function endSession(timeToSave) {
  clearInterval(timerInterval);
  isRunning = false;
  saveSession(currentSubject, currentTopic, timeToSave, [
    ...currentSessionNotes,
  ]);
  secondsElapsed = 0;
  updatePomoDisplay();

  startBtn.disabled = false;
  finishBtn.disabled = true;
  streamSelect.disabled = false;
  subjectSelect.disabled = false;
  topicSelect.disabled = false;
  pomodoroToggle.disabled = false;
  pomoTimeInput.disabled = false;
  noteInput.disabled = false;
  addNoteBtn.disabled = false;
  resetNotes();
  updateDashboardUI();
}

startBtn.addEventListener("click", () => {
  if (!subjectSelect.value || !topicSelect.value)
    return alert("Please select a subject and topic first!");
  isRunning = true;
  currentSubject = subjectSelect.value;
  currentTopic = topicSelect.value;
  startBtn.disabled = true;
  finishBtn.disabled = false;
  streamSelect.disabled = true;
  subjectSelect.disabled = true;
  topicSelect.disabled = true;
  pomodoroToggle.disabled = true;
  pomoTimeInput.disabled = true;
  const isPomodoro = pomodoroToggle.checked;

  timerInterval = setInterval(() => {
    if (isPomodoro) {
      pomodoroSeconds--;
      timeDisplay.textContent = formatTime(pomodoroSeconds);
      if (pomodoroSeconds <= 0) {
        new Audio(
          "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
        ).play();
        endSession(defaultPomoMins * 60);
        alert("Pomodoro Complete! Take a break.");
      }
    } else {
      secondsElapsed++;
      timeDisplay.textContent = formatTime(secondsElapsed);
    }
  }, 1000);
});

finishBtn.addEventListener("click", () => {
  const timeToSave = pomodoroToggle.checked
    ? defaultPomoMins * 60 - pomodoroSeconds
    : secondsElapsed;
  endSession(timeToSave);
});

document.getElementById("closeDetailsBtn").addEventListener("click", () => {
  document.getElementById("dailyDetailsPanel").classList.add("hidden");
});

function saveSession(subject, topic, timeInSeconds, notesArray) {
  if (timeInSeconds <= 0) return;
  let history = JSON.parse(localStorage.getItem("dnp_history")) || {};
  if (!history[subject]) history[subject] = { totalTime: 0, topics: {} };
  if (!history[subject].topics[topic]) history[subject].topics[topic] = 0;
  history[subject].totalTime += timeInSeconds;
  history[subject].topics[topic] += timeInSeconds;
  localStorage.setItem("dnp_history", JSON.stringify(history));

  let dailyData = JSON.parse(localStorage.getItem("dnp_daily")) || {};
  let today = new Date().toISOString().split("T")[0];
  if (!dailyData[today]) dailyData[today] = 0;
  dailyData[today] += timeInSeconds;
  localStorage.setItem("dnp_daily", JSON.stringify(dailyData));

  let dailyDetailed =
    JSON.parse(localStorage.getItem("dnp_daily_detailed")) || {};
  if (!dailyDetailed[today]) dailyDetailed[today] = {};
  if (!dailyDetailed[today][subject])
    dailyDetailed[today][subject] = { totalTime: 0, topics: {} };

  let existingTopicData = dailyDetailed[today][subject].topics[topic];
  if (!existingTopicData) {
    dailyDetailed[today][subject].topics[topic] = { time: 0, notes: [] };
  } else if (typeof existingTopicData === "number") {
    dailyDetailed[today][subject].topics[topic] = {
      time: existingTopicData,
      notes: [],
    };
  }

  dailyDetailed[today][subject].totalTime += timeInSeconds;
  dailyDetailed[today][subject].topics[topic].time += timeInSeconds;
  if (notesArray && notesArray.length > 0) {
    dailyDetailed[today][subject].topics[topic].notes.push(...notesArray);
  }
  localStorage.setItem("dnp_daily_detailed", JSON.stringify(dailyDetailed));

  let lastDate = localStorage.getItem("dnp_lastDate");
  let streak = parseInt(localStorage.getItem("dnp_streak")) || 0;
  if (lastDate !== today) {
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    let yesterdayStr = yesterday.toISOString().split("T")[0];
    if (lastDate === yesterdayStr) streak++;
    else if (lastDate !== today) streak = 1;
    localStorage.setItem("dnp_lastDate", today);
    localStorage.setItem("dnp_streak", streak);
  }
}

chartTimeframeSelect.addEventListener("change", () => {
  updateDashboardUI();
});

function updateDashboardUI() {
  let history = JSON.parse(localStorage.getItem("dnp_history")) || {};
  let dailyData = JSON.parse(localStorage.getItem("dnp_daily")) || {};
  let dailyDetailed =
    JSON.parse(localStorage.getItem("dnp_daily_detailed")) || {};
  let streak = localStorage.getItem("dnp_streak") || 0;
  let today = new Date().toISOString().split("T")[0];

  let totalSecs = Object.values(history).reduce(
    (acc, curr) => acc + curr.totalTime,
    0,
  );
  document.getElementById("totalHoursText").textContent =
    `${Math.floor(totalSecs / 3600)}h ${Math.floor((totalSecs % 3600) / 60)}m`;
  document.getElementById("todayMinsText").textContent =
    `${Math.round((dailyData[today] || 0) / 60)} mins`;
  document.getElementById("streakText").textContent = `${streak} Days`;

  renderChart(dailyDetailed, history);

  progressContainer.innerHTML = "";
  let maxTime = Math.max(...Object.values(history).map((s) => s.totalTime));
  if (maxTime === 0) maxTime = 1;

  for (const [subject, data] of Object.entries(history)) {
    let percent = (data.totalTime / maxTime) * 100;
    let topicsArr = Object.entries(data.topics).sort((a, b) => b[1] - a[1]);
    let highest = topicsArr[0] ? topicsArr[0][0] : "None";
    let statRow = `
        <div class="stat-row">
            <div class="stat-labels"><strong>${subject}</strong><span>${Math.round(data.totalTime / 60)} mins</span></div>
            <div class="progress-track"><div class="progress-fill" style="width: ${percent}%"></div></div>
            <div class="stat-labels" style="font-size: 0.75em; margin-top: 4px; color: var(--text-muted);"><span>Strongest: ${highest.substring(0, 25)}...</span></div>
        </div>`;
    progressContainer.innerHTML += statRow;
  }
}

function renderChart(dailyDetailed, history) {
  const ctx = document.getElementById("progressChart").getContext("2d");
  const labels = [];
  const dateKeys = [];
  let timeframe = chartTimeframeSelect.value;

  if (customHistoricalDates) {
    customHistoricalDates.sort().forEach((dateStr) => {
      dateKeys.push(dateStr);
      let d = new Date(dateStr);
      labels.push(
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      );
    });
    document.getElementById("chartTitle").textContent = "History Vault View";
    document.getElementById("resetChartBtn").classList.remove("hidden");
    chartTimeframeSelect.classList.add("hidden");
  } else {
    document.getElementById("resetChartBtn").classList.add("hidden");
    chartTimeframeSelect.classList.remove("hidden");

    if (timeframe === "365") {
      for (let i = 11; i >= 0; i--) {
        let d = new Date();
        d.setMonth(d.getMonth() - i);
        let monthKey = d.toISOString().slice(0, 7);
        dateKeys.push(monthKey);
        labels.push(d.toLocaleDateString("en-US", { month: "short" }));
      }
      document.getElementById("chartTitle").textContent = "1-Year Trends";
    } else {
      let days = parseInt(timeframe);
      for (let i = days - 1; i >= 0; i--) {
        let d = new Date();
        d.setDate(d.getDate() - i);
        let dateStr = d.toISOString().split("T")[0];
        dateKeys.push(dateStr);
        let format =
          days === 7
            ? { weekday: "short" }
            : { month: "short", day: "numeric" };
        labels.push(d.toLocaleDateString("en-US", format));
      }
      document.getElementById("chartTitle").textContent =
        days === 7 ? "7-Day Trends" : "1-Month Trends";
    }
  }

  const subjectColors = {
    Biology: { border: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
    Physics: { border: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
    Chemistry: { border: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
    "Combined Maths": { border: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
  };

  let subjects = Object.keys(history);
  const datasets = subjects.map((subject) => {
    const data = dateKeys.map((key) => {
      let timeSecs = 0;
      if (key.length === 7) {
        for (let date in dailyDetailed) {
          if (date.startsWith(key) && dailyDetailed[date][subject]) {
            timeSecs += dailyDetailed[date][subject].totalTime;
          }
        }
      } else {
        if (dailyDetailed[key] && dailyDetailed[key][subject]) {
          timeSecs += dailyDetailed[key][subject].totalTime;
        }
      }
      return (timeSecs / 60).toFixed(1);
    });

    const colors = subjectColors[subject] || {
      border: "#ec4899",
      bg: "rgba(236, 72, 153, 0.1)",
    };
    return {
      label: subject,
      data: data,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      borderWidth: 2,
      pointBackgroundColor: colors.border,
      pointBorderColor: "#fff",
      pointRadius: 4,
      fill: true,
      tension: 0.4,
    };
  });

  if (chartInstance) chartInstance.destroy();
  Chart.defaults.color = "#94a3b8";
  Chart.defaults.font.family = "'Poppins', sans-serif";

  chartInstance = new Chart(ctx, {
    type: "line",
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: { boxWidth: 10, font: { size: 10 } },
        },
        tooltip: { enabled: true },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: "rgba(255, 255, 255, 0.05)" } },
        x: { grid: { display: false } },
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          let clickedKey = dateKeys[index];
          if (clickedKey.length === 10) showDailyDetails(clickedKey);
          else
            alert(
              "To view specific day details, switch the graph back to 7-Day or 1-Month view.",
            );
        }
      },
    },
  });
}

function showDailyDetails(dateStr) {
  const panel = document.getElementById("dailyDetailsPanel");
  const content = document.getElementById("dailyDetailsContent");
  const dailyDetailed =
    JSON.parse(localStorage.getItem("dnp_daily_detailed")) || {};
  const dayData = dailyDetailed[dateStr];

  panel.classList.remove("hidden");
  const niceDate = new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  document.getElementById("detailDateLabel").textContent = niceDate;

  if (!dayData || Object.keys(dayData).length === 0) {
    content.innerHTML = `<p class="placeholder-text" style="font-size: 0.9em;">No study sessions recorded on this day.</p>`;
    return;
  }

  let html = "";
  for (const [subject, data] of Object.entries(dayData)) {
    html += `<div class="detail-subject-block"><h4>${subject} <span class="badge">${Math.round(data.totalTime / 60)} mins</span></h4><ul class="topic-list">`;
    for (const [topic, topicData] of Object.entries(data.topics)) {
      let timeSec = typeof topicData === "number" ? topicData : topicData.time;
      let notes =
        typeof topicData === "object" && topicData.notes ? topicData.notes : [];

      html += `<li><span class="topic-name">${topic}</span> <span class="topic-time">${Math.round(timeSec / 60)}m</span></li>`;
      if (notes.length > 0) {
        html += `<ul style="font-size: 0.85em; color: var(--text-muted); margin-bottom: 8px; padding-left: 20px; list-style-type: decimal;">`;
        notes.forEach((note) => {
          html += `<li style="padding: 2px 0;">${note}</li>`;
        });
        html += `</ul>`;
      }
    }
    html += `</ul></div>`;
  }
  content.innerHTML = html;
}

document.getElementById("resetChartBtn").addEventListener("click", () => {
  customHistoricalDates = null;
  updateDashboardUI();
});

document.querySelectorAll(".close-modal").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.target.closest(".modal-overlay").classList.add("hidden");
  });
});

document.getElementById("openArchiveBtn").addEventListener("click", () => {
  renderArchiveList();
  document.getElementById("archiveModal").classList.remove("hidden");
});

document.getElementById("openHistoryBtn").addEventListener("click", () => {
  renderHistoryTree();
  document.getElementById("historyModal").classList.remove("hidden");
});

document.getElementById("btnCreateArchive").addEventListener("click", () => {
  const history = localStorage.getItem("dnp_history");
  const dailyDetailed = localStorage.getItem("dnp_daily_detailed");
  if (!history || Object.keys(JSON.parse(history)).length === 0)
    return alert("Dashboard is empty. Nothing to archive.");

  if (confirm("Move data to Archive Bucket? You can restore it later.")) {
    const archives = JSON.parse(localStorage.getItem("dnp_archives")) || [];
    archives.push({
      id: Date.now(),
      date: new Date().toISOString(),
      history: JSON.parse(history || "{}"),
      dailyDetailed: JSON.parse(dailyDetailed || "{}"),
      daily: JSON.parse(localStorage.getItem("dnp_daily") || "{}"),
    });
    localStorage.setItem("dnp_archives", JSON.stringify(archives));
    localStorage.removeItem("dnp_history");
    localStorage.removeItem("dnp_daily_detailed");
    localStorage.removeItem("dnp_daily");
    localStorage.setItem("dnp_streak", 0);
    customHistoricalDates = null;
    updateDashboardUI();
    renderArchiveList();
    alert("Data archived!");
  }
});

function renderArchiveList() {
  const container = document.getElementById("archiveListContainer");
  const archives = JSON.parse(localStorage.getItem("dnp_archives")) || [];
  container.innerHTML =
    archives.length === 0
      ? '<p class="placeholder-text">No archives found.</p>'
      : "";

  archives.forEach((arc) => {
    let d = new Date(arc.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    let hours = Math.round(
      Object.values(arc.history).reduce((sum, sub) => sum + sub.totalTime, 0) /
        3600,
    );
    let card = document.createElement("div");
    card.className = "archive-card";
    card.innerHTML = `<div class="archive-info"><h4>Archived on ${d}</h4><p>Total logged: ~${hours} Hours</p></div>
                      <button class="btn primary" style="padding: 8px 15px; font-size: 0.9em;" onclick="restoreArchive(${arc.id})">
                          <i class="fas fa-undo"></i> Regain
                      </button>`;
    container.appendChild(card);
  });
}

window.restoreArchive = function (id) {
  if (!confirm("Merge the archived data back into your current dashboard?"))
    return;
  let archives = JSON.parse(localStorage.getItem("dnp_archives")) || [];
  let idx = archives.findIndex((a) => a.id === id);
  if (idx === -1) return;
  let target = archives[idx];

  let currHistory = JSON.parse(localStorage.getItem("dnp_history")) || {};
  let currDailyDetailed =
    JSON.parse(localStorage.getItem("dnp_daily_detailed")) || {};

  for (let sub in target.history) {
    if (!currHistory[sub]) currHistory[sub] = { totalTime: 0, topics: {} };
    currHistory[sub].totalTime += target.history[sub].totalTime;
    for (let top in target.history[sub].topics)
      currHistory[sub].topics[top] =
        (currHistory[sub].topics[top] || 0) + target.history[sub].topics[top];
  }

  for (let date in target.dailyDetailed) {
    if (!currDailyDetailed[date]) currDailyDetailed[date] = {};
    for (let sub in target.dailyDetailed[date]) {
      if (!currDailyDetailed[date][sub])
        currDailyDetailed[date][sub] = { totalTime: 0, topics: {} };
      currDailyDetailed[date][sub].totalTime +=
        target.dailyDetailed[date][sub].totalTime;

      for (let top in target.dailyDetailed[date][sub].topics) {
        let currTopData = currDailyDetailed[date][sub].topics[top];
        let targetTopData = target.dailyDetailed[date][sub].topics[top];
        let currTime =
          typeof currTopData === "number"
            ? currTopData
            : currTopData?.time || 0;
        let currNotes = currTopData?.notes || [];
        let targetTime =
          typeof targetTopData === "number"
            ? targetTopData
            : targetTopData?.time || 0;
        let targetNotes = targetTopData?.notes || [];
        currDailyDetailed[date][sub].topics[top] = {
          time: currTime + targetTime,
          notes: [...currNotes, ...targetNotes],
        };
      }
    }
  }

  localStorage.setItem("dnp_history", JSON.stringify(currHistory));
  localStorage.setItem("dnp_daily_detailed", JSON.stringify(currDailyDetailed));
  archives.splice(idx, 1);
  localStorage.setItem("dnp_archives", JSON.stringify(archives));

  updateDashboardUI();
  renderArchiveList();
  document.getElementById("archiveModal").classList.add("hidden");
  alert("Data restored!");
};

function getHistoryTree() {
  const detailed = JSON.parse(localStorage.getItem("dnp_daily_detailed")) || {};
  const tree = {};
  Object.keys(detailed)
    .sort()
    .forEach((dateStr) => {
      const d = new Date(dateStr);
      const year = d.getFullYear(),
        month = d.toLocaleString("default", { month: "long" });
      const weekStr = `Week ${Math.ceil(d.getDate() / 7)}`;
      if (!tree[year]) tree[year] = {};
      if (!tree[year][month]) tree[year][month] = {};
      if (!tree[year][month][weekStr]) tree[year][month][weekStr] = [];
      tree[year][month][weekStr].push(dateStr);
    });
  return tree;
}

function renderHistoryTree() {
  const tree = getHistoryTree();
  const container = document.getElementById("historyTreeContainer");
  container.innerHTML =
    Object.keys(tree).length === 0
      ? '<p class="placeholder-text">No history logged yet.</p>'
      : "";

  for (const year in tree) {
    const yearDiv = document.createElement("div");
    yearDiv.innerHTML = `<h4 class="tree-year"><i class="fas fa-calendar"></i> ${year} <i class="fas fa-chevron-down" style="margin-left:auto; font-size: 0.8em;"></i></h4>`;
    const monthsDiv = document.createElement("div");
    monthsDiv.className = "tree-months hidden";

    for (const month in tree[year]) {
      const monthDiv = document.createElement("div");
      monthDiv.innerHTML = `<h5 class="tree-month"><i class="fas fa-calendar-alt"></i> ${month}</h5>`;
      const weeksDiv = document.createElement("div");
      weeksDiv.className = "tree-weeks hidden";

      for (const week in tree[year][month]) {
        const weekBtn = document.createElement("button");
        weekBtn.className = "btn tree-week-btn";
        weekBtn.innerHTML = `<i class="fas fa-chart-bar"></i> View ${week} (${tree[year][month][week].length} days)`;
        weekBtn.onclick = () => {
          customHistoricalDates = tree[year][month][week];
          updateDashboardUI();
          document.getElementById("historyModal").classList.add("hidden");
        };
        weeksDiv.appendChild(weekBtn);
      }
      monthDiv.querySelector("h5").onclick = () =>
        weeksDiv.classList.toggle("hidden");
      monthDiv.appendChild(weeksDiv);
      monthsDiv.appendChild(monthDiv);
    }
    yearDiv.querySelector("h4").onclick = () =>
      monthsDiv.classList.toggle("hidden");
    yearDiv.appendChild(monthsDiv);
    container.appendChild(yearDiv);
  }
}

updateDashboardUI();
