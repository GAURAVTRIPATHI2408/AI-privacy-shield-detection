// ============================================
// AI PRIVACY SHIELD
// PERSON DETECTION SYSTEM
// ============================================


let model = null;

let stream = null;

let monitoring = false;

let alertCount = 0;

let lastAlertTime = 0;

let startTime = null;

let timerInterval = null;


// ============================================
// ELEMENTS
// ============================================

const video =
    document.getElementById("video");

const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d");


const startButton =
    document.getElementById("startButton");

const stopButton =
    document.getElementById("stopButton");

const cameraStartButton =
    document.getElementById(
        "cameraStartButton"
    );


const cameraPlaceholder =
    document.getElementById(
        "cameraPlaceholder"
    );


const aiStatus =
    document.getElementById("aiStatus");

const detectionStatus =
    document.getElementById(
        "detectionStatus"
    );


const personCount =
    document.getElementById(
        "personCount"
    );

const personCountTop =
    document.getElementById(
        "personCountTop"
    );


const confidence =
    document.getElementById(
        "confidence"
    );

const confidenceTop =
    document.getElementById(
        "confidenceTop"
    );


const securityStatus =
    document.getElementById(
        "securityStatus"
    );


const safeBox =
    document.getElementById(
        "safeBox"
    );


const warningBox =
    document.getElementById(
        "warningBox"
    );


const blurLabel =
    document.getElementById(
        "blurLabel"
    );


const alertCounter =
    document.getElementById(
        "alertCount"
    );


const alertHistory =
    document.getElementById(
        "alertHistory"
    );


const timer =
    document.getElementById(
        "timer"
    );


// ============================================
// LOAD AI MODEL
// ============================================

async function loadAI() {

    try {

        console.log(
            "Loading COCO-SSD..."
        );


        aiStatus.textContent =
            "LOADING";


        detectionStatus.textContent =
            "LOADING";


        model =
            await cocoSsd.load();


        console.log(
            "COCO-SSD loaded successfully"
        );


        aiStatus.textContent =
            "READY";


        detectionStatus.textContent =
            "READY";


    } catch (error) {

        console.error(
            "AI MODEL ERROR:",
            error
        );


        aiStatus.textContent =
            "ERROR";


        detectionStatus.textContent =
            "ERROR";


        alert(
            "AI model load nahi hua. Internet connection check karo."
        );
    }
}


// ============================================
// START CAMERA
// ============================================

async function startProtection() {

    if (!model) {

        alert(
            "AI abhi load ho raha hai. 5-10 seconds wait karo."
        );

        return;
    }


    try {

        stream =
            await navigator
                .mediaDevices
                .getUserMedia({

                    video: {
                        width: {
                            ideal: 1280
                        },

                        height: {
                            ideal: 720
                        },

                        facingMode:
                            "user"
                    },

                    audio: false
                });


        video.srcObject =
            stream;


        monitoring =
            true;


        cameraPlaceholder.style.display =
            "none";


        startButton.disabled =
            true;


        stopButton.disabled =
            false;


        startTime =
            Date.now();


        startTimer();


        detectionStatus.textContent =
            "MONITORING";


        aiStatus.textContent =
            "ACTIVE";


        video.onloadedmetadata =
            () => {

                video.play();

                detectPersons();

            };


    } catch (error) {

        console.error(
            "CAMERA ERROR:",
            error
        );


        alert(
            "Camera permission Allow karo."
        );
    }
}


// ============================================
// STOP CAMERA
// ============================================

function stopProtection() {

    monitoring =
        false;


    if (stream) {

        stream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        stream = null;
    }


    video.srcObject =
        null;


    video.classList.remove(
        "privacy-blur"
    );


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    cameraPlaceholder.style.display =
        "flex";


    startButton.disabled =
        false;


    stopButton.disabled =
        true;


    detectionStatus.textContent =
        "READY";


    aiStatus.textContent =
        "READY";


    personCount.textContent =
        "0";


    personCountTop.textContent =
        "0";


    confidence.textContent =
        "0%";


    confidenceTop.textContent =
        "0%";


    safeMode();


    stopTimer();
}


// ============================================
// DETECT PERSONS
// ============================================

async function detectPersons() {

    if (
        !monitoring ||
        !model
    ) {

        return;
    }


    try {

        const predictions =
            await model.detect(
                video
            );


        // ONLY PERSON OBJECTS

        const persons =
            predictions.filter(
                prediction =>
                    prediction.class ===
                    "person" &&
                    prediction.score >=
                    0.45
            );


        console.log(
            "Persons detected:",
            persons.length
        );


        updateStats(
            persons
        );


        drawDetectionBoxes(
            persons
        );


        // ============================
        // PRIVACY RULE
        // ============================

        if (
            persons.length >= 2
        ) {

            privacyThreat(
                persons
            );

        } else {

            safeMode();
        }


    } catch (error) {

        console.error(
            "DETECTION ERROR:",
            error
        );
    }


    if (monitoring) {

        setTimeout(
            detectPersons,
            150
        );
    }
}


// ============================================
// UPDATE STATS
// ============================================

function updateStats(
    persons
) {

    const count =
        persons.length;


    let highestConfidence =
        0;


    persons.forEach(
        person => {

            if (
                person.score >
                highestConfidence
            ) {

                highestConfidence =
                    person.score;
            }

        }
    );


    const percent =
        Math.round(
            highestConfidence * 100
        );


    personCount.textContent =
        count;


    personCountTop.textContent =
        count;


    confidence.textContent =
        percent + "%";


    confidenceTop.textContent =
        percent + "%";
}


// ============================================
// DRAW DETECTION BOXES
// ============================================

function drawDetectionBoxes(
    persons
) {

    if (
        video.videoWidth === 0 ||
        video.videoHeight === 0
    ) {

        return;
    }


    canvas.width =
        video.videoWidth;


    canvas.height =
        video.videoHeight;


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    persons.forEach(
        person => {

            const [
                x,
                y,
                width,
                height
            ] = person.bbox;


            const danger =
                persons.length >= 2;


            ctx.strokeStyle =
                danger
                    ? "#ff526f"
                    : "#43e0a4";


            ctx.lineWidth =
                4;


            ctx.strokeRect(
                x,
                y,
                width,
                height
            );


            ctx.fillStyle =
                danger
                    ? "#ff526f"
                    : "#43e0a4";


            ctx.font =
                "bold 16px Arial";


            ctx.fillText(
                "PERSON " +
                Math.round(
                    person.score * 100
                ) +
                "%",
                x,
                y > 20
                    ? y - 7
                    : y + 18
            );

        }
    );
}


// ============================================
// SAFE MODE
// ============================================

function safeMode() {

    video.classList.remove(
        "privacy-blur"
    );


    safeBox.style.display =
        "block";


    warningBox.style.display =
        "none";


    blurLabel.style.display =
        "none";


    securityStatus.textContent =
        "SAFE";


    securityStatus.className =
        "green";


    detectionStatus.textContent =
        monitoring
            ? "MONITORING"
            : "READY";
}


// ============================================
// PRIVACY THREAT
// ============================================

function privacyThreat(
    persons
) {

    // ============================
    // SCREEN BLUR
    // ============================

    video.classList.add(
        "privacy-blur"
    );


    // ============================
    // HIDE SAFE
    // ============================

    safeBox.style.display =
        "none";


    // ============================
    // SHOW WARNING
    // ============================

    warningBox.style.display =
        "block";


    warningBox.textContent =
        "⚠ " +
        persons.length +
        " PEOPLE DETECTED — PRIVACY THREAT";


    // ============================
    // SHOW BLUR MESSAGE
    // ============================

    blurLabel.style.display =
        "block";


    // ============================
    // SECURITY STATUS
    // ============================

    securityStatus.textContent =
        "THREAT";


    securityStatus.className =
        "red";


    detectionStatus.textContent =
        "THREAT";


    // ============================
    // CREATE ALERT
    // ============================

    const now =
        Date.now();


    if (
        now - lastAlertTime >
        3000
    ) {

        lastAlertTime =
            now;


        createPrivacyAlert(
            persons
        );
    }
}


// ============================================
// PRIVACY ALERT
// ============================================

function createPrivacyAlert(
    persons
) {

    alertCount++;


    alertCounter.textContent =
        alertCount;


    const oldEmpty =
        document.getElementById(
            "emptyAlert"
        );


    if (oldEmpty) {

        oldEmpty.remove();
    }


    let maxConfidence =
        0;


    persons.forEach(
        person => {

            if (
                person.score >
                maxConfidence
            ) {

                maxConfidence =
                    person.score;
            }
        }
    );


    const percent =
        Math.round(
            maxConfidence * 100
        );


    const time =
        new Date()
            .toLocaleTimeString();


    const alertItem =
        document.createElement(
            "div"
        );


    alertItem.className =
        "alert-item";


    alertItem.innerHTML = `

        <div class="alert-icon">
            🚨
        </div>

        <div class="alert-info">

            <strong>
                Privacy Threat Detected
            </strong>

            <span>
                ${persons.length}
                people detected
                • Confidence ${percent}%
            </span>

        </div>

        <div class="alert-time">
            ${time}
        </div>

    `;


    alertHistory.prepend(
        alertItem
    );
}


// ============================================
// TIMER
// ============================================

function startTimer() {

    stopTimer();


    timerInterval =
        setInterval(
            () => {

                const elapsed =
                    Math.floor(
                        (
                            Date.now() -
                            startTime
                        ) / 1000
                    );


                const minutes =
                    Math.floor(
                        elapsed / 60
                    );


                const seconds =
                    elapsed % 60;


                timer.textContent =
                    String(minutes)
                        .padStart(2, "0")
                    +
                    ":" +
                    String(seconds)
                        .padStart(2, "0");

            },
            1000
        );
}


function stopTimer() {

    if (
        timerInterval
    ) {

        clearInterval(
            timerInterval
        );

        timerInterval =
            null;
    }
}


// ============================================
// BUTTONS
// ============================================

startButton.addEventListener(
    "click",
    startProtection
);


stopButton.addEventListener(
    "click",
    stopProtection
);


cameraStartButton.addEventListener(
    "click",
    startProtection
);


// ============================================
// LOAD AI
// ============================================

window.addEventListener(
    "load",
    () => {

        loadAI();

    }
);