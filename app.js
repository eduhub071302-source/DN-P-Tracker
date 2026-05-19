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

// Initialize App Data securely
let appData = JSON.parse(localStorage.getItem("dnp_appData"));
let needsUpdate = false;
if (appData && appData.streams && appData.streams["Biology Science"]) {
  if (appData.streams["Biology Science"].subjects.Biology.length <= 3)
    needsUpdate = true;
}
if (!appData || !appData.streams || needsUpdate) {
  appData = { streams: defaultStreams };
  localStorage.setItem("dnp_appData", JSON.stringify(appData));
}
const streams = appData.streams;

// --- DOM Elements ---
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
const mainDashboard = document.getElementById("mainDashboard");

const notesSection = document.getElementById("notesSection");
const sessionNotesList = document.getElementById("sessionNotesList");
const noteInput = document.getElementById("noteInput");
const addNoteBtn = document.getElementById("addNoteBtn");
const notePrefix = document.getElementById("notePrefix");

const totalTimeFilter = document.getElementById("totalTimeFilter");

// Custom Anchor Inputs
const anchor7DayInput = document.getElementById("anchor7Day");
const anchor1MonthInput = document.getElementById("anchor1Month");
const anchor1YearInput = document.getElementById("anchor1Year");

// --- Sound Effect ---
const loudAlarmSound = new Audio(
  "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg",
);
loudAlarmSound.volume = 1.0;

// Programmatic Silent Audio to preserve lock-screen media state
const silentAudioLoop = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==");
silentAudioLoop.loop = true;

// --- State ---
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
let deferredPrompt; // For PWA installation

document.getElementById("currentDate").textContent =
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// Populate Dropdown
Object.keys(streams).forEach((streamName) => {
  let opt = document.createElement("option");
  opt.value = streamName;
  opt.textContent = streamName;
  streamSelect.appendChild(opt);
});

// --- PWA Installation Logic ---
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

function handleInstallClick() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      }
      deferredPrompt = null;
    });
  } else {
    alert(
      "Automatic install prompt is not available right now. You can install the app manually via your browser's menu (e.g., 'Add to Home Screen' or 'Install App'). Ensure you are running on an HTTPS connection.",
    );
  }
}

document
  .getElementById("installBtn")
  .addEventListener("click", handleInstallClick);
document
  .getElementById("mobileInstallBtn")
  .addEventListener("click", handleInstallClick);

// --- Mobile Immersive Mode ---
document
  .getElementById("btnEnterImmersive")
  .addEventListener("click", async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        await document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        await document.documentElement.msRequestFullscreen();
      }
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock("landscape");
      }
    } catch (err) {
      console.log(
        "Fullscreen/Orientation lock API error (expected on iOS):",
        err,
      );
    }
    document.body.classList.add("immersive-active");
    setTimeout(() => {
      if (chartInstance) chartInstance.resize();
    }, 500);
  });

// --- Ambient Sounds Logic ---
const soundBtns = document.querySelectorAll(".sound-btn");
soundBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const soundType = e.currentTarget.dataset.sound;
    const audioEl = document.getElementById(`audio-${soundType}`);

    if (e.currentTarget.classList.contains("active")) {
      audioEl.pause();
      e.currentTarget.classList.remove("active");
    } else {
      document
        .querySelectorAll('audio[id^="audio-"]')
        .forEach((a) => a.pause());
      soundBtns.forEach((b) => b.classList.remove("active"));
      audioEl.volume = 0.5;
      audioEl.play().catch((err) => console.log("Audio play blocked", err));
      e.currentTarget.classList.add("active");
    }
  });
});

// --- User Profile & Motivation Engine ---
const settingsModal = document.getElementById("settingsModal");
const motivationModal = document.getElementById("motivationModal");
const userNicknameInput = document.getElementById("userNickname");
const userExamDateInput = document.getElementById("userExamDate");

function loadUserProfile() {
  const profile = JSON.parse(localStorage.getItem("dnp_userProfile"));
  const anchors = JSON.parse(localStorage.getItem("dnp_customAnchors")) || {};

  if (anchors.sevenDayStart) {
    anchor7DayInput.value = anchors.sevenDayStart;
    anchor7DayInput.disabled = true;
  }
  if (anchors.oneMonthStart) {
    anchor1MonthInput.value = anchors.oneMonthStart;
    anchor1MonthInput.disabled = true;
  }
  if (anchors.oneYearStart) {
    anchor1YearInput.value = anchors.oneYearStart;
    anchor1YearInput.disabled = true;
  }

  if (!profile || !profile.nickname || !profile.examDate) {
    settingsModal.classList.remove("hidden");
    settingsModal.onclick = (e) => e.stopPropagation();
  } else {
    showMotivationPopup(profile);
  }
}

document.getElementById("openSettingsBtn").addEventListener("click", () => {
  const profile = JSON.parse(localStorage.getItem("dnp_userProfile")) || {};
  if (profile.nickname) userNicknameInput.value = profile.nickname;
  if (profile.examDate) userExamDateInput.value = profile.examDate;
  settingsModal.classList.remove("hidden");
});

document.getElementById("saveSettingsBtn").addEventListener("click", () => {
  const nickname = userNicknameInput.value.trim();
  const examDate = userExamDateInput.value;

  if (!nickname || !examDate) {
    alert("Please fill in both your nickname and exam date to continue!");
    return;
  }

  const anchors = JSON.parse(localStorage.getItem("dnp_customAnchors")) || {};
  let anchorsChanged = false;

  if (!anchors.sevenDayStart && anchor7DayInput.value) {
    anchors.sevenDayStart = anchor7DayInput.value;
    anchor7DayInput.disabled = true;
    anchorsChanged = true;
  }
  if (!anchors.oneMonthStart && anchor1MonthInput.value) {
    anchors.oneMonthStart = anchor1MonthInput.value;
    anchor1MonthInput.disabled = true;
    anchorsChanged = true;
  }
  if (!anchors.oneYearStart && anchor1YearInput.value) {
    anchors.oneYearStart = anchor1YearInput.value;
    anchor1YearInput.disabled = true;
    anchorsChanged = true;
  }

  if (anchorsChanged) {
    localStorage.setItem("dnp_customAnchors", JSON.stringify(anchors));
    updateDashboardUI();
  }

  const profile = { nickname, examDate };
  localStorage.setItem("dnp_userProfile", JSON.stringify(profile));
  settingsModal.classList.add("hidden");
  showMotivationPopup(profile);
});

document.getElementById("closeMotivationBtn").addEventListener("click", () => {
  motivationModal.classList.add("hidden");
});

function showMotivationPopup(profile) {
  const examDate = new Date(profile.examDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  examDate.setHours(0, 0, 0, 0);

  const diffTime = examDate - today;
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const motHeadline = document.getElementById("motHeadline");
  const motBody = document.getElementById("motBody");
  const motEmoji = document.getElementById("motEmoji");

  const intros = [
    `Listen up, ${profile.nickname}!`,
    `Reality check, ${profile.nickname}.`,
    `Hey ${profile.nickname},`,
    `Focus up, ${profile.nickname}!`,
    `It's time, ${profile.nickname}.`,
    `Look here, ${profile.nickname}.`,
    `Wake up, ${profile.nickname}!`,
    `Stay hard, ${profile.nickname}.`,
    `Yo ${profile.nickname}!`,
    `Champion mindset, ${profile.nickname}.`,
  ];

  const middleFar = [
    "Every single hour you put in today is a brick in the foundation of your future.",
    "The pain of discipline is nothing compared to the pain of regret.",
    "Your competitors are studying right now. Are you going to let them win?",
    "You didn't come this far to only come this far.",
    "Greatness is forged in the silent hours of relentless work.",
    "The exam won't care how tired you were. It only cares if you're ready.",
    "Motivation gets you going, but raw discipline keeps you growing.",
    "Small consistent steps turn into massive leaps.",
    "Don't stop when you're tired. Stop when you're done.",
    "You are capable of doing incredibly hard things.",
  ];

  const endings = [
    "Let's crush today! 💥",
    "Time to grind. 🚀",
    "Make it happen. 🎯",
    "No excuses. 🚫",
    "Go get what's yours! 🏆",
    "Lock in! 🔒",
    "Dominate this session. ⚡",
    "Prove yourself right. 🌟",
    "Execute. ⚔️",
    "Win the day! 🏁",
  ];

  const emojis = ["🔥", "🚀", "⚔️", "🧠", "🎯", "⚡", "🏆", "🌟", "💪", "👑"];

  let headline = "";
  let bodyText = "";

  if (daysLeft < 0) {
    headline = "The Exam is Over!";
    bodyText = `Hope you crushed it, ${profile.nickname}! Update your settings for the next milestone.`;
    motEmoji.innerText = "🎉";
  } else if (daysLeft === 0) {
    headline = "IT'S GAME DAY!";
    bodyText = `This is it, ${profile.nickname}. You've trained for this. Take a deep breath, trust your preparation, and go destroy that exam!`;
    motEmoji.innerText = "🏆";
  } else {
    headline = `Only ${daysLeft} Days Left!`;
    const rIntro = intros[Math.floor(Math.random() * intros.length)];
    const rMid = middleFar[Math.floor(Math.random() * middleFar.length)];
    const rEnd = endings[Math.floor(Math.random() * endings.length)];
    bodyText = `${rIntro} ${rMid} ${rEnd}`;
    motEmoji.innerText = emojis[Math.floor(Math.random() * emojis.length)];
  }

  motHeadline.textContent = headline;
  motBody.textContent = bodyText;
  motivationModal.classList.remove("hidden");
}

window.addEventListener("DOMContentLoaded", () => {
  loadUserProfile();
  checkActiveSession();
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
});

// --- Share & Download PDF Feature ---
async function generateReportPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  const profile = JSON.parse(localStorage.getItem("dnp_userProfile")) || {
    nickname: "Student",
  };

  const timeframeDropdown = document.getElementById("chartTimeframeSelect");
  const timeframeText =
    timeframeDropdown.options[timeframeDropdown.selectedIndex].text;
  const timeframeLabel = customHistoricalDates
    ? "History Vault View"
    : timeframeText;
  const fileName = `Study_Report_${profile.nickname}_${timeframeLabel.replace(/ /g, "")}.pdf`;

  pdf.setFontSize(22);
  pdf.setTextColor(59, 130, 246);
  pdf.text("DN P Tracker PRO - Study Report", 14, 20);

  pdf.setFontSize(11);
  pdf.setTextColor(80, 80, 80);
  pdf.text(`Student: ${profile.nickname}`, 14, 30);

  let examText = "Not Set";
  if (profile.examDate) {
    const ed = new Date(profile.examDate);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    ed.setHours(0, 0, 0, 0);
    const diff = Math.ceil((ed - t) / (1000 * 60 * 60 * 24));
    if (diff > 0) examText = `${ed.toLocaleDateString()} (${diff} days left)`;
    else if (diff === 0) examText = `${ed.toLocaleDateString()} (Today!)`;
    else examText = `${ed.toLocaleDateString()} (Completed)`;
  }
  pdf.text(`Exam Target: ${examText}`, 14, 36);

  const streak = localStorage.getItem("dnp_streak") || 0;
  pdf.text(`Current Streak: ${streak} Days`, 14, 42);

  pdf.text(`Report Period: ${timeframeLabel}`, 105, 30);
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 36);

  let currentY = 55;

  if (chartInstance) {
    pdf.setFontSize(14);
    pdf.setTextColor(40, 40, 40);
    pdf.text("Study Trends Overview", 14, currentY);
    currentY += 5;

    const currentCanvas = chartInstance.canvas;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = currentCanvas.offsetWidth || 800;
    tempCanvas.height = currentCanvas.offsetHeight || 250;

    const tempChart = new Chart(tempCanvas.getContext("2d"), {
      type: chartInstance.config.type,
      data: chartInstance.config.data,
      options: {
        ...chartInstance.config.options,
        animation: false,
        responsive: false,
        devicePixelRatio: 4,
      },
    });

    const chartImage = tempChart.toBase64Image("image/png", 1.0);
    tempChart.destroy();

    const imgProps = pdf.getImageProperties(chartImage);
    const pdfWidth = pdf.internal.pageSize.getWidth() - 28;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.setFillColor(15, 23, 42);
    pdf.rect(14, currentY, pdfWidth, pdfHeight, "F");

    pdf.addImage(chartImage, "PNG", 14, currentY, pdfWidth, pdfHeight);
    currentY += pdfHeight + 15;
  }

  if (currentY > 200) {
    pdf.addPage();
    currentY = 20;
  }

  pdf.setFontSize(16);
  pdf.setTextColor(59, 130, 246);
  pdf.text("Detailed Study Log Breakdown", 14, currentY);
  currentY += 10;

  const dailyDetailed =
    JSON.parse(localStorage.getItem("dnp_daily_detailed")) || {};
  let activeDates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (customHistoricalDates) {
    activeDates = customHistoricalDates;
  } else {
    const anchors = JSON.parse(localStorage.getItem("dnp_customAnchors")) || {};
    let startBoundary = null;
    let endBoundary = null;

    if (timeframeDropdown.value === "7" && anchors.sevenDayStart) {
      let [y, m, d] = anchors.sevenDayStart.split("-");
      startBoundary = new Date(y, m - 1, d);
      endBoundary = new Date(startBoundary);
      endBoundary.setDate(endBoundary.getDate() + 6);
    } else if (timeframeDropdown.value === "30" && anchors.oneMonthStart) {
      let [y, m, d] = anchors.oneMonthStart.split("-");
      startBoundary = new Date(y, m - 1, d);
      endBoundary = new Date(startBoundary);
      endBoundary.setDate(endBoundary.getDate() + 29);
    } else if (timeframeDropdown.value === "365" && anchors.oneYearStart) {
      let [y, m] = anchors.oneYearStart.split("-");
      startBoundary = new Date(y, m - 1, 1);
      endBoundary = new Date(startBoundary);
      endBoundary.setFullYear(endBoundary.getFullYear() + 1);
      endBoundary.setDate(endBoundary.getDate() - 1);
    } else {
      let days =
        timeframeDropdown.value === "365"
          ? 365
          : parseInt(timeframeDropdown.value);
      endBoundary = new Date(today);
      startBoundary = new Date(today);
      startBoundary.setDate(startBoundary.getDate() - days + 1);
    }

    for (let dateStr in dailyDetailed) {
      let [y, m, d] = dateStr.split("-");
      const loopDate = new Date(y, m - 1, d);
      if (loopDate >= startBoundary && loopDate <= endBoundary) {
        activeDates.push(dateStr);
      }
    }
  }

  activeDates.sort((a, b) => {
    let [y1, m1, d1] = a.split("-");
    let [y2, m2, d2] = b.split("-");
    return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
  });

  if (activeDates.length === 0) {
    pdf.setFontSize(11);
    pdf.setTextColor(100, 100, 100);
    pdf.text("No study data recorded for this timeframe.", 14, currentY);
  } else {
    for (let dateStr of activeDates) {
      const dayData = dailyDetailed[dateStr];
      if (!dayData || Object.keys(dayData).length === 0) continue;

      let tableBody = [];
      for (const [subject, data] of Object.entries(dayData)) {
        for (const [topic, topicData] of Object.entries(data.topics)) {
          let timeSec =
            typeof topicData === "number" ? topicData : topicData.time;
          
          let durationText = "";
          if (timeSec > 0 && timeSec < 60) {
            durationText = "<1m";
          } else {
            const h = Math.floor(timeSec / 3600);
            const m = Math.floor((timeSec % 3600) / 60);
            durationText = h > 0 ? `${h}h ${m}m` : `${m}m`;
          }

          let notes =
            typeof topicData === "object" &&
            topicData.notes &&
            topicData.notes.length > 0
              ? topicData.notes.map((n, i) => `${i + 1}. ${n}`).join("\n")
              : "-";

          tableBody.push([subject, topic, durationText, notes]);
        }
      }

      if (tableBody.length > 0) {
        let [y, m, d] = dateStr.split("-");
        const niceDate = new Date(y, m - 1, d).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        if (currentY > 260) {
          pdf.addPage();
          currentY = 20;
        }

        pdf.setFontSize(12);
        pdf.setTextColor(40, 40, 40);
        pdf.text(niceDate, 14, currentY);
        currentY += 4;

        pdf.autoTable({
          startY: currentY,
          head: [["Subject", "Topic", "Duration", "Notes"]],
          body: tableBody,
          theme: "grid",
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
          styles: { fontSize: 9, cellPadding: 4 },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 50 },
            2: { cellWidth: 25 },
            3: { cellWidth: "auto" },
          },
          margin: { bottom: 20 },
        });

        currentY = pdf.lastAutoTable.finalY + 12;
      }
    }
  }

  const pdfBlob = pdf.output("blob");
  return { pdf, pdfBlob, fileName, profile, timeframe: timeframeLabel };
}

document.getElementById("sharePdfBtn").addEventListener("click", async () => {
  const btn = document.getElementById("sharePdfBtn");
  const originalText = btn.innerHTML;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Generating...`;
  btn.disabled = true;

  try {
    const { pdf, pdfBlob, fileName, profile, timeframe } =
      await generateReportPDF();
    const file = new File([pdfBlob], fileName, { type: "application/pdf" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `${profile.nickname}'s Study Progress`,
        text: `Check out my ${timeframe} study progress report from DN P Tracker Pro! 🔥`,
        files: [file],
      });
    } else {
      pdf.save(fileName);
      alert(
        "Your browser does not support direct sharing. The PDF report has been downloaded to your device instead.",
      );
    }
  } catch (err) {
    console.error("PDF Generation Error:", err);
    alert("Failed to generate the PDF report. Please try again.");
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

document
  .getElementById("downloadPdfBtn")
  .addEventListener("click", async () => {
    const btn = document.getElementById("downloadPdfBtn");
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Downloading...`;
    btn.disabled = true;

    try {
      const { pdf, fileName } = await generateReportPDF();
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("Failed to download the PDF report. Please try again.");
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });

// UI Toggles
sidebarToggle.addEventListener("click", () => {
  appSidebar.classList.toggle("collapsed");
  sidebarToggle.classList.toggle("collapsed");
  sidebarToggle.innerHTML = appSidebar.classList.contains("collapsed")
    ? '<i class="fas fa-chevron-right"></i>'
    : '<i class="fas fa-chevron-left"></i>';
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
  setTimeout(() => {
    if (chartInstance) chartInstance.resize();
  }, 300);
});

// Drag to Scroll
let isDragging = false;
let startX, startY, scrollLeft, scrollTop;

mainDashboard.addEventListener("mousedown", (e) => {
  if (
    ["INPUT", "BUTTON", "SELECT", "CANVAS", "A", "LI", "LABEL"].includes(
      e.target.tagName,
    ) ||
    e.target.closest(".custom-input") ||
    e.target.closest(".btn") ||
    e.target.closest(".sound-btn")
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
  mainDashboard.scrollLeft = scrollLeft - (x - startX) * 1.5;
  mainDashboard.scrollTop = scrollTop - (y - startY) * 1.5;
});

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

function updateStoredActiveSessionNotes() {
  const activeSession = JSON.parse(localStorage.getItem("dnp_activeSession"));
  if (activeSession) {
    activeSession.notes = [...currentSessionNotes];
    localStorage.setItem("dnp_activeSession", JSON.stringify(activeSession));
  }
}

addNoteBtn.addEventListener("click", () => {
  if (noteInput.value.trim() !== "") {
    currentSessionNotes.push(noteInput.value.trim());
    let li = document.createElement("li");
    li.textContent = `${currentSessionNotes.length}. ${noteInput.value.trim()}`;
    sessionNotesList.appendChild(li);
    noteInput.value = "";
    notePrefix.textContent = `${currentSessionNotes.length + 1}.`;
    updateStoredActiveSessionNotes();
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

// Timer & Time Formatting Logic
function formatTime(totalSeconds) {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatToHoursMins(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
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

// Persistent Absolute Time Logic
function startTimerLoop(startTimeEpoch) {
  if (timerInterval) clearInterval(timerInterval);

  const isPomodoro = pomodoroToggle.checked;
  const totalPomoSeconds = defaultPomoMins * 60;

  timerInterval = setInterval(() => {
    const elapsedSeconds = Math.floor((Date.now() - startTimeEpoch) / 1000);
    secondsElapsed = elapsedSeconds;

    if (isPomodoro) {
      pomodoroSeconds = totalPomoSeconds - elapsedSeconds;
      if (pomodoroSeconds <= 0) {
        pomodoroSeconds = 0;
        timeDisplay.textContent = formatTime(0);
        loudAlarmSound.play().catch((e) => console.log("Audio play blocked by browser."));
        
        localStorage.removeItem("dnp_activeSession");
        clearMediaSession();
        endSession(totalPomoSeconds);
        
        setTimeout(() => {
          alert("Pomodoro Complete! Take a break.");
          loudAlarmSound.pause();
          loudAlarmSound.currentTime = 0;
        }, 300);
      } else {
        timeDisplay.textContent = formatTime(pomodoroSeconds);
      }
    } else {
      timeDisplay.textContent = formatTime(secondsElapsed);
    }
  }, 1000);
}

function checkActiveSession() {
  const activeSession = JSON.parse(localStorage.getItem("dnp_activeSession"));
  if (activeSession) {
    isRunning = true;
    currentSubject = activeSession.subject;
    currentTopic = activeSession.topic;

    streamSelect.value = activeSession.stream;
    
    // Rebuild Subject dropdown items
    subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
    if (activeSession.stream && streams[activeSession.stream]) {
      Object.keys(streams[activeSession.stream].subjects).forEach((sub) => {
        let opt = document.createElement("option");
        opt.value = sub;
        opt.textContent = sub;
        subjectSelect.appendChild(opt);
      });
    }
    subjectSelect.value = activeSession.subject;

    // Rebuild Topic dropdown items
    topicSelect.innerHTML = '<option value="">-- Select Topic --</option>';
    if (activeSession.stream && activeSession.subject && streams[activeSession.stream].subjects[activeSession.subject]) {
      streams[activeSession.stream].subjects[activeSession.subject].forEach((topic) => {
        let opt = document.createElement("option");
        opt.value = topic;
        opt.textContent = topic;
        topicSelect.appendChild(opt);
      });
    }
    topicSelect.value = activeSession.topic;

    pomodoroToggle.checked = activeSession.isPomodoro;
    pomoTimeInput.value = activeSession.defaultPomoMins;
    defaultPomoMins = activeSession.defaultPomoMins;

    currentSessionNotes = activeSession.notes || [];
    sessionNotesList.innerHTML = "";
    currentSessionNotes.forEach((note, idx) => {
      let li = document.createElement("li");
      li.textContent = `${idx + 1}. ${note}`;
      sessionNotesList.appendChild(li);
    });
    notePrefix.textContent = `${currentSessionNotes.length + 1}.`;
    notesSection.style.display = currentTopic ? "block" : "none";

    startBtn.disabled = true;
    finishBtn.disabled = false;
    streamSelect.disabled = true;
    subjectSelect.disabled = true;
    topicSelect.disabled = true;
    pomodoroToggle.disabled = true;
    pomoTimeInput.disabled = true;

    silentAudioLoop.play().catch(() => console.log("Silent loop ready."));
    startTimerLoop(activeSession.startTime);
    setupMediaSession();
  }
}

function setupMediaSession() {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `Studying: ${currentTopic || 'Session'}`,
      artist: `Subject: ${currentSubject || 'General'}`,
      album: 'DN P Tracker PRO',
      artwork: [
        { src: 'https://cdn-icons-png.flaticon.com/512/3135/3135692.png', sizes: '192x192', type: 'image/png' }
      ]
    });
    navigator.mediaSession.setActionHandler('stop', () => {
      if (finishBtn && !finishBtn.disabled) finishBtn.click();
    });
  }
}

function clearMediaSession() {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = null;
  }
  silentAudioLoop.pause();
}

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

  loudAlarmSound.pause();
  loudAlarmSound.currentTime = 0;

  const startTimeEpoch = Date.now();
  const activeSessionData = {
    startTime: startTimeEpoch,
    stream: streamSelect.value,
    subject: subjectSelect.value,
    topic: topicSelect.value,
    isPomodoro: pomodoroToggle.checked,
    defaultPomoMins: parseInt(pomoTimeInput.value) || 25,
    notes: [...currentSessionNotes]
  };
  localStorage.setItem("dnp_activeSession", JSON.stringify(activeSessionData));

  silentAudioLoop.play().catch((e) => console.log("Audio lock framework initialized."));
  startTimerLoop(startTimeEpoch);
  setupMediaSession();
});

finishBtn.addEventListener("click", () => {
  const activeSession = JSON.parse(localStorage.getItem("dnp_activeSession"));
  let calculatedTime = 0;
  
  if (activeSession) {
    const calculatedDuration = Math.floor((Date.now() - activeSession.startTime) / 1000);
    calculatedTime = pomodoroToggle.checked
      ? Math.min(defaultPomoMins * 60, calculatedDuration)
      : calculatedDuration;
  } else {
    calculatedTime = pomodoroToggle.checked
      ? defaultPomoMins * 60 - pomodoroSeconds
      : secondsElapsed;
  }

  localStorage.removeItem("dnp_activeSession");
  clearMediaSession();
  
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(reg => {
      reg.getNotifications({ tag: "study-session" }).then(notifications => {
        notifications.forEach(n => n.close());
      });
    });
  }

  endSession(calculatedTime);
});

// Storage and Charting logic
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

chartTimeframeSelect.addEventListener("change", updateDashboardUI);
totalTimeFilter.addEventListener("change", updateDashboardUI);

function getFilteredTotalSeconds() {
  const filter = totalTimeFilter.value;
  let history = JSON.parse(localStorage.getItem("dnp_history")) || {};

  if (filter === "all") {
    return Object.values(history).reduce(
      (acc, curr) => acc + curr.totalTime,
      0,
    );
  }

  const dailyData = JSON.parse(localStorage.getItem("dnp_daily")) || {};
  let totalSecs = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const anchors = JSON.parse(localStorage.getItem("dnp_customAnchors")) || {};
  let startBoundary = null;
  let endBoundary = null;

  if (filter === "7" && anchors.sevenDayStart) {
    startBoundary = new Date(anchors.sevenDayStart);
    endBoundary = new Date(startBoundary);
    endBoundary.setDate(endBoundary.getDate() + 6);
  } else if (filter === "30" && anchors.oneMonthStart) {
    startBoundary = new Date(anchors.oneMonthStart);
    endBoundary = new Date(startBoundary);
    endBoundary.setDate(endBoundary.getDate() + 29);
  } else if (filter === "365" && anchors.oneYearStart) {
    startBoundary = new Date(anchors.oneYearStart + "-01");
    endBoundary = new Date(startBoundary);
    endBoundary.setFullYear(endBoundary.getFullYear() + 1);
    endBoundary.setDate(endBoundary.getDate() - 1);
  } else {
    const daysToLookBack = parseInt(filter);
    endBoundary = today;
    startBoundary = new Date(today);
    startBoundary.setDate(startBoundary.getDate() - daysToLookBack + 1);
  }

  for (let dateStr in dailyData) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    if (d >= startBoundary && d <= endBoundary) {
      totalSecs += dailyData[dateStr];
    }
  }
  return totalSecs;
}

function updateDashboardUI() {
  let history = JSON.parse(localStorage.getItem("dnp_history")) || {};
  let dailyData = JSON.parse(localStorage.getItem("dnp_daily")) || {};
  let dailyDetailed =
    JSON.parse(localStorage.getItem("dnp_daily_detailed")) || {};
  let streak = localStorage.getItem("dnp_streak") || 0;
  let today = new Date().toISOString().split("T")[0];

  let totalSecs = getFilteredTotalSeconds();

  document.getElementById("totalHoursText").textContent = formatToHoursMins(totalSecs);
  document.getElementById("todayMinsText").textContent = formatToHoursMins(dailyData[today] || 0);
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
            <div class="stat-labels"><strong>${subject}</strong><span>${formatToHoursMins(data.totalTime)} (All time)</span></div>
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
  const anchors = JSON.parse(localStorage.getItem("dnp_customAnchors")) || {};

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
      if (anchors.oneYearStart) {
        let start = new Date(anchors.oneYearStart + "-01");
        for (let i = 0; i < 12; i++) {
          let d = new Date(start);
          d.setMonth(d.getMonth() + i);
          let monthKey = d.toISOString().slice(0, 7);
          dateKeys.push(monthKey);
          labels.push(d.toLocaleDateString("en-US", { month: "short" }));
        }
        document.getElementById("chartTitle").textContent =
          "1-Year Trends (Custom)";
      } else {
        for (let i = 11; i >= 0; i--) {
          let d = new Date();
          d.setMonth(d.getMonth() - i);
          let monthKey = d.toISOString().slice(0, 7);
          dateKeys.push(monthKey);
          labels.push(d.toLocaleDateString("en-US", { month: "short" }));
        }
        document.getElementById("chartTitle").textContent = "1-Year Trends";
      }
    } else {
      let days = parseInt(timeframe);
      if (timeframe === "7" && anchors.sevenDayStart) {
        let start = new Date(anchors.sevenDayStart);
        for (let i = 0; i < 7; i++) {
          let d = new Date(start);
          d.setDate(d.getDate() + i);
          dateKeys.push(d.toISOString().split("T")[0]);
          labels.push(d.toLocaleDateString("en-US", { weekday: "short" }));
        }
        document.getElementById("chartTitle").textContent =
          "7-Day Trends (Custom)";
      } else if (timeframe === "30" && anchors.oneMonthStart) {
        let start = new Date(anchors.oneMonthStart);
        for (let i = 0; i < 30; i++) {
          let d = new Date(start);
          d.setDate(d.getDate() + i);
          dateKeys.push(d.toISOString().split("T")[0]);
          labels.push(
            d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          );
        }
        document.getElementById("chartTitle").textContent =
          "1-Month Trends (Custom)";
      } else {
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
          if (date.startsWith(key) && dailyDetailed[date][subject])
            timeSecs += dailyDetailed[date][subject].totalTime;
        }
      } else {
        if (dailyDetailed[key] && dailyDetailed[key][subject])
          timeSecs += dailyDetailed[key][subject].totalTime;
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
    html += `<div class="detail-subject-block"><h4>${subject} <span class="badge">${formatToHoursMins(data.totalTime)}</span></h4><ul class="topic-list">`;
    for (const [topic, topicData] of Object.entries(data.topics)) {
      let timeSec = typeof topicData === "number" ? topicData : topicData.time;
      let notes =
        typeof topicData === "object" && topicData.notes ? topicData.notes : [];
      
      let topicDuration = "";
      if (timeSec > 0 && timeSec < 60) {
        topicDuration = "<1m";
      } else {
        const th = Math.floor(timeSec / 3600);
        const tm = Math.floor((timeSec % 3600) / 60);
        topicDuration = th > 0 ? `${th}h ${tm}m` : `${tm}m`;
      }

      html += `<li><span class="topic-name">${topic}</span> <span class="topic-time">${topicDuration}</span></li>`;
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
                      <button class="btn primary" style="padding: 8px 15px; font-size: 0.9em;" onclick="restoreArchive(${arc.id})"><i class="fas fa-undo"></i> Regain</button>`;
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

// Mobile Background Context & Local Visibility Calibration Loop
document.addEventListener("visibilitychange", () => {
  const activeSession = JSON.parse(localStorage.getItem("dnp_activeSession"));

  if (document.visibilityState === "visible") {
    appData = JSON.parse(localStorage.getItem("dnp_appData")) || {
      streams: defaultStreams,
    };
    
    if (activeSession && isRunning) {
      startTimerLoop(activeSession.startTime);
    }
    
    updateDashboardUI();
    loadUserProfile();

    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.getNotifications({ tag: "study-session" }).then(notifications => {
          notifications.forEach(n => n.close());
        });
      });
    }
  } else {
    // If user minimizes app or leaves, dispatch a push-card monitoring reminder
    if (activeSession && isRunning && "Notification" in window && Notification.permission === "granted") {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification("DN P Tracker PRO", {
          body: `⏱️ Study Session Active: ${activeSession.subject} - ${activeSession.topic}`,
          icon: "https://cdn-icons-png.flaticon.com/512/3135/3135692.png",
          tag: "study-session",
          renotify: false,
          silent: true,
          sticky: true
        });
      });
    }
  }
});

updateDashboardUI();
