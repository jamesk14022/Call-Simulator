var ws = new WebSocket("ws://localhost:8000/ws");
var timerValue = 0;
var holdTimerValue = 0;
var timerInterval, holdTimerInterval;
var hold = false;
var hungUp = false;
navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(function (stream) {
    var audioCtx = new AudioContext();
    var audioIn_mic = audioCtx.createMediaStreamSource(stream);
    var dest_tab = audioCtx.createMediaStreamDestination();
    audioIn_mic.connect(dest_tab);
    var recorder = new MediaRecorder(dest_tab.stream);
    recorder.addEventListener("dataavailable", function (e) {
        var audioBlob = new Blob([e.data], { type: "audio/wav" });
        var reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onload = function () {
            var result = reader.result;
            var base64AudioMessage = result.split(",")[1];
            ws.send(base64AudioMessage);
        };
    });
    var isKeyPressed = false;
    // Add event listeners for keydown (press) and keyup (release) events
    document.addEventListener("keydown", function (event) {
        if (hold) {
            var myToast = document.getElementById("holdErrorToast");
            var toast = new bootstrap.Toast(myToast);
            toast.show();
            return;
        }
        if (!isKeyPressed && event.key === "m") {
            isKeyPressed = true;
            recorder.start();
            console.log("recording started");
        }
        else {
            isKeyPressed = false;
            recorder.stop();
            console.log("recording stopped");
        }
    }, false);
    ws.onmessage = function (event) {
        var snd = new Audio("data:audio/mp3;base64," + event.data);
        snd.play();
    };
})
    .catch(function (error) {
    console.error("Error accessing the microphone:", error);
});
var loadCharacterInformation = function () {
    fetch("http://127.0.0.1:8000/character")
        .then(function (response) {
        if (!response.ok) {
            throw new Error("HTTP error! Status: ".concat(response.status));
        }
        return response.json(); // Parse the response as JSON (or use response.text() for text data)
    }).then(function (data) {
    }).catch(function (error) {
        // Handle errors
        console.error("Fetch error:", error);
    });
};
var toggleCall = function () {
    hungUp = !hungUp;
    var callButton = document.getElementById("toggleCall");
    if (hungUp) {
        callButton.textContent = "New Call";
        pauseTimer();
        holdPauseTimer();
        holdTimerValue = 0;
        var holdTimerElement = document.getElementById("holdTimer");
        holdTimerElement.textContent = "";
    }
    else {
        callButton.textContent = "Hang Up";
        timerValue = 0;
        var timerElement = document.getElementById("timer");
        timerElement.textContent = "".concat(timerValue, " seconds");
        startTimer();
        fetch("http://127.0.0.1:8000/call_started", { method: "POST" })
            .then(function (response) {
            if (!response.ok) {
                throw new Error("HTTP error! Status: ".concat(response.status));
            }
            return response.json(); // Parse the response as JSON (or use response.text() for text data)
        }).catch(function (error) {
            // Handle errors
            console.error("Fetch error:", error);
        });
    }
};
var updateTimer = function () {
    var timerElement = document.getElementById("timer");
    timerElement.textContent = "".concat(timerValue, " seconds");
    timerValue++;
};
var pauseTimer = function () {
    clearInterval(timerInterval);
};
var startTimer = function () {
    clearInterval(timerInterval); // Clear any previous timers
    updateTimer(); // Initial display
    timerInterval = setInterval(updateTimer, 1000); // Update every 1 second (1000 milliseconds)
};
var holdUpdateTimer = function () {
    var holdTimerElement = document.getElementById("holdTimer");
    holdTimerElement.textContent = "".concat(holdTimerValue, " seconds");
    holdTimerValue++;
};
var holdPauseTimer = function () {
    clearInterval(holdTimerInterval);
};
var holdStartTimer = function () {
    clearInterval(holdTimerInterval); // Clear any previous timers
    holdUpdateTimer(); // Initial display
    holdTimerInterval = setInterval(holdUpdateTimer, 1000); // Update every 1 second (1000 milliseconds)
};
var toggleHold = function () {
    hold = !hold;
    if (hold) {
        pauseTimer();
        holdStartTimer();
    }
    else {
        startTimer();
        holdPauseTimer();
        holdTimerValue = 0;
        var holdTimerElement = document.getElementById("holdTimer");
        holdTimerElement.textContent = "";
    }
};
var evaluateCall = function () {
    fetch("http://127.0.0.1:8000/call_finished", { method: "POST" })
        .then(function (response) {
        if (!response.ok) {
            throw new Error("HTTP error! Status: ".concat(response.status));
        }
        return response.json(); // Parse the response as JSON (or use response.text() for text data)
    }).catch(function (error) {
        // Handle errors
        console.error("Fetch error:", error);
    });
    window.close();
};
var loadTransfers = function () {
    // load transfer options 
    fetch("http://127.0.0.1:8000/transfer_options")
        .then(function (response) {
        if (!response.ok) {
            throw new Error("HTTP error! Status: ".concat(response.status));
        }
        return response.json(); // Parse the response as JSON (or use response.text() for text data)
    }).then(function (data) {
        var transferOptionsElement = document.getElementById("transfer-dropdown");
        data.transfer_options.forEach(function (option) {
            var liElement = document.createElement("li");
            var aElement = document.createElement("a");
            liElement.appendChild(aElement);
            aElement.classList.add("dropdown-item");
            aElement.textContent = option;
            transferOptionsElement.appendChild(liElement);
        });
    }).catch(function (error) {
        // Handle errors
        console.error("Fetch error:", error);
    });
};
document.addEventListener("DOMContentLoaded", function () {
    loadTransfers();
    startTimer();
    fetch("http://127.0.0.1:8000/call_started", { method: "POST" })
        .then(function (response) {
        if (!response.ok) {
            throw new Error("HTTP error! Status: ".concat(response.status));
        }
        return response.json(); // Parse the response as JSON (or use response.text() for text data)
    }).catch(function (error) {
        // Handle errors
        console.error("Fetch error:", error);
    });
});
