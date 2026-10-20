/* =========================================================================
   MAJESTIC MATH TUTOR - script.js
   -------------------------------------------------------------------------
   This one file is loaded by every page. Each page only has certain
   elements on it, so every "init" function below first checks whether its
   elements exist before doing anything. You do NOT need to edit this file
   to add questions - see questions.js for that.
   ========================================================================= */

/* =========================================================================
   PART 1: Saving and loading data
   -------------------------------------------------------------------------
   The site reads and shows data from "localStorage" (this browser only) -
   that part never changes, so the site keeps working instantly even with
   no internet connection.

   ON TOP OF THAT, if firebase-config.js has your real project config
   pasted in, every save is ALSO copied ("mirrored") to your Firestore
   database in the cloud, so you build up a permanent record of every
   user and attempt. This is a one-way mirror for now: the site still
   READS from localStorage (fast, instant, no setup needed), it just also
   WRITES a copy to the cloud. Reading history back from Firestore (for
   example, on a different device) is a bigger follow-up step - ask me
   when you are ready for that and I will wire it up.

   You do not need to understand the Firebase code below to use the site.
   It simply does nothing at all until firebase-config.js has a real
   config in it.
   ========================================================================= */

var firebaseDb = null;

function setUpFirebaseIfConfigured() {
  var hasConfig = (typeof firebaseConfig !== "undefined") && firebaseConfig.apiKey;
  var sdkLoaded = (typeof firebase !== "undefined");

  if (hasConfig && sdkLoaded) {
    firebase.initializeApp(firebaseConfig);
    firebaseDb = firebase.firestore();
  }
  /* if either of those is missing, firebaseDb just stays null, and every
     mirror function below quietly skips itself - see the "if (!firebaseDb)
     return;" line at the top of each one. */
} 
setUpFirebaseIfConfigured();

function getOrCreateLocalUserId() {
  /* a random ID stored in this browser, so the same student's documents
     in Firestore stay grouped together across visits on this device */
  var id = localStorage.getItem("mmt_local_id");
  if (id === null) {
    id = "user_" + Date.now() + "_" + Math.floor(Math.random() * 1000000);
    localStorage.setItem("mmt_local_id", id);
  }
  return id;
}

function mirrorUserToFirestore(userObject) {
  if (!firebaseDb) { return; }
  var docId = makeSafeDocId(userObject.name || "Unknown");
  firebaseDb.collection("users").doc(docId).set(userObject).catch(function (error) {
    console.log("Firestore save (user) failed:", error);
  });
}

function makeSafeDocId(text) {
  return text.replace(/[^a-zA-Z0-9]+/g, "_");
}

function mirrorAttemptToFirestore(attemptObject) {
  if (!firebaseDb) { return; }
  var id = getOrCreateLocalUserId();
  var recordWithOwner = Object.assign({ userId: id }, attemptObject);

  var namePart = makeSafeDocId(attemptObject.name || "Unknown");
  var docId = namePart + "_" + Date.now();

  firebaseDb.collection("attempts").doc(docId).set(recordWithOwner).catch(function (error) {
    console.log("Firestore save (attempt) failed:", error);
  });
} 

function saveUser(userObject) {
  localStorage.setItem("mmt_user", JSON.stringify(userObject));
  mirrorUserToFirestore(userObject);
}

function loadUser() {
  var raw = localStorage.getItem("mmt_user");
  if (raw === null) {
    return { name: "", grade: "", track: "" };
  }
  return JSON.parse(raw);
}

/* home.html's tiny PyScript block reads this plain string to build the
   "Welcome back" message - just a name on window, nothing fancier. Empty
   string means nobody has logged in on this browser yet. */
window.mmtCurrentUserName = loadUser().name;
function sendAnalyticsEvent(eventName, details) {
  if (typeof gtag !== "function") { return; }
  try {
    gtag("event", eventName, details);
  } catch (error) {
    /* analytics must never break the website */
  }
}

function sendAttemptToAnalytics(attempt) {
  if (attempt.kind === "test") {
    sendAnalyticsEvent("test_completed", {
      grade: attempt.grade,
      track: attempt.track,
      test_number: attempt.testNumber,
      unit: attempt.unitLabel,
      score: attempt.score,
      max_score: attempt.total,
      percent: attempt.percent
    });
  } else {
    sendAnalyticsEvent("quiz_completed", {
      grade: attempt.grade,
      track: attempt.track,
      unit: attempt.unitLabel,
      quiz_number: attempt.quizNumber,
      score: attempt.score,
      max_score: attempt.total,
      percent: attempt.percent
    });
  }
} 
function saveAttempt(attemptObject) {
  /* attach who this attempt belongs to, so it's visible right on the
     attempt itself (in Firestore) instead of only in the separate
     "users" collection */
  var user = loadUser();
  attemptObject.name = user.name;

  var history = loadHistory();
  history.unshift(attemptObject);
  localStorage.setItem("mmt_history", JSON.stringify(history));
  mirrorAttemptToFirestore(attemptObject);
  sendAttemptToAnalytics(attemptObject);
}

function loadHistory() {
  var raw = localStorage.getItem("mmt_history");
  if (raw === null) {
    return [];
  }
  return JSON.parse(raw);
} 

/* PART 2: accessibility */ 

function changeSize200() {
    document.body.classList.add('changesize200');
}  
function defaultSize() {
    document.body.classList.remove('changesize200');
} 
function changeColor() {
    document.body.classList.add('changecolor');
}  
function defaultColor() {
    document.body.classList.remove('changecolor');
} 

function formatSecondsAsTime(totalSeconds) {
  var minutes = Math.floor(totalSeconds / 60);
  var seconds = totalSeconds % 60;
  var minuteText = String(minutes);
  var secondText = String(seconds);
  if (minuteText.length < 2) { minuteText = "0" + minuteText; }
  if (secondText.length < 2) { secondText = "0" + secondText; }
  return minuteText + ":" + secondText;
} 

/* PART 4: Login page (login.html) */
/* ! means not, return tells to stop the function, this just basically stores 
the values of name, grade, track of the users from the ids of the login details box 
and stores them in the variable to use further, whereas if some input is not selected then the 
user won't go to the tests page with the button, can go with the accessibility, but won't work and the 
the userObject is just the variable saving their details further for other things, and if the 
proceedbutton function is done with the details filled then it redirects them to the tests page */

function setupLoginPage() {
  var proceedButton = document.getElementById("proceedButton");
  if (!proceedButton) {
    return; 
  } 
  proceedButton.addEventListener("click", function () {
    var name = document.getElementById("inputName").value.trim();
    var grade = document.getElementById("inputGrade").value;
    var track = document.getElementById("inputTrack").value;
    if (name === "" || grade === "" || track === "") {
      return;
    } 
    var userObject = { name: name, grade: grade, track: track };
    saveUser(userObject);
    sendAnalyticsEvent("student_login", { grade: grade, track: track, transport_type: "beacon" });
    window.location.href = "tests.html";
  }); 
} 

/* =========================================================================
   PART 5: Tests page (tests.html)
   ========================================================================= */

var activeTest = null; /* holds the test currently being attempted */

function setupTestsPage() {
  var pickerArea = document.getElementById("testPickerArea");
  if (!pickerArea) { return; }

  var user = loadUser();

  if (user.grade === "" || user.track === "") {
    pickerArea.innerHTML = "<p class='board panel-info'>Please visit the <a href='login.html'>Login page</a> first and enter your grade and level.</p>";
    return;
  } 

  var whoLine = document.getElementById("pickerWho");
  if (whoLine) {
    whoLine.textContent = user.name + " - Grade " + user.grade + " - " + user.track;
  }

  var trackData = questionBank[user.grade][user.track];
  var testUnits = trackData.testUnits;

  for (var t = 1; t <= testUnits.length; t++) {
    var unitLabel = testUnits[t - 1];
    var hasQuestions = (trackData.tests[t] !== undefined && trackData.tests[t].length > 0);

    var card = document.createElement("div");
    card.className = "test-card";

    var heading = document.createElement("h4");
    heading.textContent = "Test " + t + ": " + unitLabel;
    card.appendChild(heading);

    var startBtn = document.createElement("button");
    startBtn.className = "btn";
    if (hasQuestions) {
      startBtn.textContent = "Start Test " + t;
      startBtn.addEventListener("click", makeStartTestHandler(user, t, unitLabel));
    } else {
      startBtn.textContent = "Coming soon";
      startBtn.disabled = true;
    }
    card.appendChild(startBtn);

    pickerArea.appendChild(card);
  }
} 

function makeStartTestHandler(user, testNumber, unitLabel) {
  return function () {
    startTest(user, testNumber, unitLabel);
  };
}

function startTest(user, testNumber, unitLabel) {
  var questions = questionBank[user.grade][user.track].tests[testNumber];

  var totalPoints = 0;
  for (var i = 0; i < questions.length; i++) {
    totalPoints = totalPoints + questions[i].points;
  }

  activeTest = {
    user: user,
    testNumber: testNumber,
    unitLabel: unitLabel,
    questions: questions,
    answers: [],
    totalPoints: totalPoints,
    seconds: 0,
    timerId: null,
    isRunning: false,
    isSubmitted: false
  };

  for (var q = 0; q < questions.length; q++) {
    activeTest.answers.push(-1);
  } 

  document.getElementById("testPickerArea").style.display = "none";
  document.getElementById("quizArea").style.display = "grid";

  document.getElementById("quizTitle").textContent = "Test " + testNumber + ": " + unitLabel;
  document.getElementById("scoreDisplay").textContent = "Score Summary - / " + totalPoints;
  document.getElementById("timerDisplay").textContent = "Time - 00:00";
  document.getElementById("startButton").disabled = false;
  document.getElementById("submitButton").disabled = true;
  document.getElementById("whoDisplay").textContent = user.name + " - Grade " + user.grade + " - " + user.track;

  drawQuizQuestions();

  document.getElementById("backButton").onclick = function () {
    if (activeTest.isRunning) { clearInterval(activeTest.timerId); }
    document.getElementById("testPickerArea").style.display = "block";
    document.getElementById("quizArea").style.display = "none";
  };

  document.getElementById("startButton").onclick = function () {
    if (activeTest.isRunning) { return; }
    if (activeTest.isSubmitted) {
      startTest(user, testNumber, unitLabel);
      return;
    }
    activeTest.isRunning = true;
    document.getElementById("startButton").disabled = true;
    document.getElementById("submitButton").disabled = false;
    activeTest.timerId = setInterval(function () {
      activeTest.seconds = activeTest.seconds + 1;
      document.getElementById("timerDisplay").textContent = "Time - " + formatSecondsAsTime(activeTest.seconds);
    }, 1000);
  };

  document.getElementById("submitButton").onclick = function () {
    submitActiveTest();
  };
}

/* Draws the optional data table for a question (item.table = rows of cells;
   the first cell of every row is the row label). Used by tests and micro-quizzes. */
function appendQuestionTable(box, item) {
  if (!item.table || item.table.length === 0) { return; }
  var wrap = document.createElement("div");
  wrap.className = "q-table-wrap";
  var table = document.createElement("table");
  table.className = "q-table";
  for (var r = 0; r < item.table.length; r++) {
    var tr = document.createElement("tr");
    for (var c = 0; c < item.table[r].length; c++) {
      var cell = document.createElement(c === 0 ? "th" : "td");
      cell.textContent = item.table[r][c];
      tr.appendChild(cell);
    }
    table.appendChild(tr);
  }
  wrap.appendChild(table);
  box.appendChild(wrap);
}

function drawQuizQuestions() {
  var area = document.getElementById("quizQuestionsArea");
  area.innerHTML = "";
  var letters = ["A", "B", "C", "D"];

  for (var qIndex = 0; qIndex < activeTest.questions.length; qIndex++) {
    var item = activeTest.questions[qIndex];

    var box = document.createElement("div");
    box.className = "question-box";

    var qText = document.createElement("p");
    qText.className = "q-text";
    qText.textContent = "Question " + (qIndex + 1) + " (" + item.points + " points): " + item.text;
    box.appendChild(qText);
    appendQuestionTable(box, item);

    var grid = document.createElement("div");
    grid.className = "option-grid";

    for (var oIndex = 0; oIndex < item.choices.length; oIndex++) {
      var optionDiv = document.createElement("div");
      optionDiv.className = "option-item";
      optionDiv.textContent = letters[oIndex] + ") " + item.choices[oIndex];
      optionDiv.addEventListener("click", makeOptionClickHandler(qIndex, oIndex, grid, optionDiv));
      grid.appendChild(optionDiv);
    }

    box.appendChild(grid);
    area.appendChild(box);
  }
}

function makeOptionClickHandler(questionIndex, optionIndex, grid, optionDiv) {
  return function () {
    if (activeTest.isSubmitted) { return; }
    if (!activeTest.isRunning) { return; }

    activeTest.answers[questionIndex] = optionIndex;

    var allOptions = grid.querySelectorAll(".option-item");
    for (var i = 0; i < allOptions.length; i++) {
      allOptions[i].classList.remove("picked");
    }
    optionDiv.classList.add("picked");
  };
}

function submitActiveTest() {
  if (!activeTest.isRunning) { return; }

  clearInterval(activeTest.timerId);
  activeTest.isRunning = false;
  activeTest.isSubmitted = true;
  document.getElementById("submitButton").disabled = true;
  document.getElementById("startButton").disabled = false;

  var earnedPoints = 0;
  var area = document.getElementById("quizQuestionsArea");
  var boxes = area.children;

  for (var qIndex = 0; qIndex < activeTest.questions.length; qIndex++) {
    var item = activeTest.questions[qIndex];
    var chosenIndex = activeTest.answers[qIndex];
    var options = boxes[qIndex].querySelectorAll(".option-item");

    for (var oIndex = 0; oIndex < options.length; oIndex++) {
      if (oIndex === item.correctIndex) {
        options[oIndex].classList.add("right-answer");
      } else if (oIndex === chosenIndex) {
        options[oIndex].classList.add("wrong-answer");
      }
    }

    if (chosenIndex === item.correctIndex) {
      earnedPoints = earnedPoints + item.points;
    }
  }

  document.getElementById("scoreDisplay").textContent = "Score Summary - " + earnedPoints + " / " + activeTest.totalPoints;

  var percent = Math.round((earnedPoints / activeTest.totalPoints) * 100);
  saveAttempt({
    kind: "test",
    grade: activeTest.user.grade,
    track: activeTest.user.track,
    testNumber: activeTest.testNumber,
    unitLabel: activeTest.unitLabel,
    score: earnedPoints,
    total: activeTest.totalPoints,
    percent: percent,
    seconds: activeTest.seconds,
    when: new Date().toISOString()
  });
}

/* =========================================================================
   PART 6: Reports page (reports.html)
   ========================================================================= */

function setupReportsPage() {
  var chartArea = document.getElementById("chartArea");
  if (!chartArea) { return; }

  var user = loadUser();
  if (user.grade === "" || user.track === "") {
    chartArea.innerHTML = "<p class='muted'>Please visit the Login page first.</p>";
    return;
  }

  var trackData = questionBank[user.grade][user.track];
  var history = loadHistory();

  for (var t = 1; t <= trackData.testUnits.length; t++) {
    /* find the most recent attempt of this exact test, for this user's grade/track */
    var mostRecent = null;
    for (var i = 0; i < history.length; i++) {
      var record = history[i];
      if (record.kind === "test" && record.grade === user.grade && record.track === user.track && record.testNumber === t) {
        mostRecent = record;
        break; /* history is newest-first, so the first match is the latest */
      }
    }

    var column = document.createElement("div");
    column.className = "chart-col";

    var bar = document.createElement("div");
    bar.className = "chart-bar";

    var statusText = document.createElement("div");
    statusText.className = "chart-col-status";

    if (mostRecent === null) {
      bar.style.height = "0%";
      statusText.textContent = "Not Taken";
    } else {
      bar.style.height = mostRecent.percent + "%";
      bar.classList.add("completed");
      statusText.textContent = mostRecent.percent + "%";
    }

    column.appendChild(bar);
    column.appendChild(statusText);

    var label = document.createElement("div");
    label.className = "chart-col-label";
    label.textContent = "Test " + t;
    column.appendChild(label);

    chartArea.appendChild(column);
  }

  /* overall feedback text based on completed tests only */
  var completedPercents = [];
  for (var j = 0; j < history.length; j++) {
    if (history[j].kind === "test" && history[j].grade === user.grade && history[j].track === user.track) {
      completedPercents.push(history[j].percent);
    }
  }
  var feedbackBox = document.getElementById("overallText");
  if (completedPercents.length === 0) {
    feedbackBox.textContent = "No tests attempted yet. Take a test to see your performance summary here.";
  } else {
    var total = 0;
    for (var k = 0; k < completedPercents.length; k++) { total = total + completedPercents[k]; }
    var average = Math.round(total / completedPercents.length);
    if (average >= 80) {
      feedbackBox.textContent = "Strong performance overall (" + average + "% average). Keep it up!";
    } else if (average >= 60) {
      feedbackBox.textContent = "Good progress overall (" + average + "% average). Revisit Practice for the units scoring lower.";
    } else {
      feedbackBox.textContent = "There is room to grow (" + average + "% average). Work through the Practice page before retaking any tests.";
    }
  }
}

/* =========================================================================
   PART 7: Practice page (practice.html)
   ========================================================================= */

function setupPracticePage() {
  var filterRow = document.getElementById("unitFilterRow");
  if (!filterRow) { return; }

  var user = loadUser();
  if (user.grade === "" || user.track === "") {
    filterRow.innerHTML = "<p class='muted'>Please visit the Login page first.</p>";
    return;
  }

  var whoLine = document.getElementById("practiceWho");
  if (whoLine) {
    whoLine.textContent = user.name + " - Grade " + user.grade + " - " + user.track;
  }

  var unitData = practiceBank[user.grade][user.track];
  var unitNames = Object.keys(unitData);

  for (var i = 0; i < unitNames.length; i++) {
    var unitName = unitNames[i];
    var unitButton = document.createElement("button");
    unitButton.className = "btn";
    unitButton.textContent = unitName;
    unitButton.addEventListener("click", makeUnitFilterHandler(unitName, unitButton));
    filterRow.appendChild(unitButton);
  }

  /* show the first unit automatically */
  if (unitNames.length > 0) {
    showPracticeUnit(unitNames[0]);
    filterRow.children[0].classList.add("selected-unit");
  }

  function makeUnitFilterHandler(unitName, unitButton) {
    return function () {
      var allButtons = filterRow.querySelectorAll("button");
      for (var b = 0; b < allButtons.length; b++) {
        allButtons[b].classList.remove("selected-unit");
      }
      unitButton.classList.add("selected-unit");
      showPracticeUnit(unitName);
    };
  }

  function showPracticeUnit(unitName) {
    var area = document.getElementById("microQuizArea");
    area.innerHTML = "";

    var quizzes = [unitData[unitName].quiz1, unitData[unitName].quiz2];

    for (var qz = 0; qz < quizzes.length; qz++) {
      var quizQuestions = quizzes[qz] || [];

      if (quizQuestions.length === 0) {
        var comingSoon = document.createElement("p");
        comingSoon.className = "muted";
        comingSoon.textContent = unitName + " - Micro-Quiz " + (qz + 1) + ": coming soon.";
        area.appendChild(comingSoon);
        continue;
      }

      area.appendChild(buildMicroQuizBox(unitName, qz + 1, quizQuestions));
    }
  }
}

function buildMicroQuizBox(unitName, quizNumber, quizQuestions) {
  var letters = ["A", "B", "C", "D"];
  var box = document.createElement("div");
  box.className = "question-box";

  var title = document.createElement("p");
  title.className = "q-text";
  title.textContent = unitName + " - Micro-Quiz " + quizNumber;
  box.appendChild(title);

  var answers = [];
  for (var i = 0; i < quizQuestions.length; i++) { answers.push(-1); }

  for (var qIndex = 0; qIndex < quizQuestions.length; qIndex++) {
    var item = quizQuestions[qIndex];

    var qP = document.createElement("p");
    qP.textContent = "Q" + (qIndex + 1) + ": " + item.text;
    box.appendChild(qP);
    appendQuestionTable(box, item);

    var grid = document.createElement("div");
    grid.className = "option-grid";

    for (var oIndex = 0; oIndex < item.choices.length; oIndex++) {
      var optionDiv = document.createElement("div");
      optionDiv.className = "option-item";
      optionDiv.textContent = letters[oIndex] + ") " + item.choices[oIndex];
      optionDiv.addEventListener("click", makeMicroOptionHandler(qIndex, oIndex, grid, optionDiv, answers, box));
      grid.appendChild(optionDiv);
    }
    box.appendChild(grid);
  }

  var submitBtn = document.createElement("button");
  submitBtn.className = "btn";
  submitBtn.style.marginTop = "10px";
  submitBtn.textContent = "Submit Micro-Quiz";
  submitBtn.addEventListener("click", function () {
    if (box.getAttribute("data-done") === "1") { return; }
    box.setAttribute("data-done", "1");

    var earnedPoints = 0;
    var totalPoints = 0;
    var boxes = box.querySelectorAll(".option-grid");

    for (var qIndex = 0; qIndex < quizQuestions.length; qIndex++) {
      var item = quizQuestions[qIndex];
      totalPoints = totalPoints + item.points;
      var options = boxes[qIndex].querySelectorAll(".option-item");
      for (var oIndex = 0; oIndex < options.length; oIndex++) {
        if (oIndex === item.correctIndex) {
          options[oIndex].classList.add("right-answer");
        } else if (oIndex === answers[qIndex]) {
          options[oIndex].classList.add("wrong-answer");
        }
      }
      if (answers[qIndex] === item.correctIndex) {
        earnedPoints = earnedPoints + item.points;
      }
    }

    var user = loadUser();
    var percent = Math.round((earnedPoints / totalPoints) * 100);
    saveAttempt({
      kind: "practice",
      grade: user.grade,
      track: user.track,
      unitLabel: unitName,
      quizNumber: quizNumber,
      score: earnedPoints,
      total: totalPoints,
      percent: percent,
      seconds: null,
      when: new Date().toISOString()
    });

    submitBtn.textContent = "Submitted - " + earnedPoints + " / " + totalPoints;
    submitBtn.disabled = true;
  });
  box.appendChild(submitBtn);

  return box;
}  

function makeMicroOptionHandler(questionIndex, optionIndex, grid, optionDiv, answers, box) {
  return function () {
    if (box.getAttribute("data-done") === "1") { return; }
    answers[questionIndex] = optionIndex;
    var allOptions = grid.querySelectorAll(".option-item");
    for (var i = 0; i < allOptions.length; i++) {
      allOptions[i].classList.remove("picked");
    }
    optionDiv.classList.add("picked");
  };
}

/* =========================================================================
   PART 8: History page (history.html)
   ========================================================================= */

function setupHistoryPage() {
  var area = document.getElementById("historyArea");
  if (!area) { return; }

  var history = loadHistory();

  if (history.length === 0) {
    area.innerHTML = "<p class='muted'>Nothing attempted yet. Take a test or micro-quiz to see it logged here.</p>";
    return;
  }

  for (var i = 0; i < history.length; i++) {
    var record = history[i];

    var row = document.createElement("div");
    row.className = "history-row";

    var left = document.createElement("div");
    var titleLine = document.createElement("strong");

    if (record.kind === "test") {
      titleLine.textContent = "Grade " + record.grade + " " + record.track + " - Test " + record.testNumber + " (" + record.unitLabel + ")";
    } else {
      titleLine.textContent = "Grade " + record.grade + " " + record.track + " - " + record.unitLabel + " Micro-Quiz " + record.quizNumber;
    }
    left.appendChild(titleLine);

    var detail = document.createElement("div");
    var timeText = "";
    if (record.seconds !== null) {
      timeText = " - Time: " + formatSecondsAsTime(record.seconds);
    }
    var whenDate = new Date(record.when);
    detail.textContent = "Score: " + record.score + " / " + record.total + " (" + record.percent + "%)" + timeText + " - " + whenDate.toLocaleString();
    left.appendChild(detail);

    row.appendChild(left);
    area.appendChild(row);
  } 
} 

/* =========================================================================
   PART 9: Retake Test button (history.html)
   ========================================================================= */

function setupRetakeButton() {
  var retakeButton = document.getElementById("retakeButton");
  if (!retakeButton) { return; }

  retakeButton.addEventListener("click", function () {
    window.location.href = "tests.html";
  });
}

/* =========================================================================
   PART 10: Run the correct setup functions once the page has loaded
   ========================================================================= */

setupLoginPage();
setupTestsPage();
setupReportsPage();
setupPracticePage();
setupHistoryPage();
setupRetakeButton();
