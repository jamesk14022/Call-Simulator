var ws = new WebSocket("ws://localhost:8000/ws");
var timerValue = 0;
var holdTimerValue = 0;
var timerInterval, holdTimerInterval;
var hold = false;
var hungUp = false;

navigator.mediaDevices
  .getUserMedia({ audio: true })
  .then((stream) => {
    let audioCtx = new AudioContext();
    let audioIn_mic = audioCtx.createMediaStreamSource(stream);
    const dest_tab = audioCtx.createMediaStreamDestination();
    audioIn_mic.connect(dest_tab);
    let recorder = new MediaRecorder(dest_tab.stream);

    recorder.addEventListener("dataavailable", (e) => {
      const audioBlob = new Blob([e.data], { type: "audio/wav" });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onload = function () {
        const result = reader.result as string;
        const base64AudioMessage = result.split(",")[1];
        ws.send(base64AudioMessage);
      };
    });

    var isKeyPressed = false;
    // Add event listeners for keydown (press) and keyup (release) events
    document.addEventListener(
      "keydown",
      (event) => {
        if (hold) {
          const myToast = document.getElementById("holdErrorToast");
          const toast = new bootstrap.Toast(myToast);
          toast.show();
          return;
        }
        if (!isKeyPressed && event.key === "m") {
          isKeyPressed = true;
          recorder.start();
          console.log("recording started");
        } else {
          isKeyPressed = false;
          recorder.stop();
          console.log("recording stopped");
        }
      },
      false,
    );

    ws.onmessage = (event) => {
      var snd = new Audio("data:audio/mp3;base64," + event.data);
      snd.play();
    };
  })
  .catch((error) => {
    console.error("Error accessing the microphone:", error);
  });

const loadCharacterInformation = () => {  
   fetch("http://127.0.0.1:8000/character")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json(); // Parse the response as JSON (or use response.text() for text data)
    }).then((data) => {
        
    }).catch((error) => {
      // Handle errors
      console.error("Fetch error:", error);
    }); 
}

const toggleCall = () => {


    hungUp = !hungUp;
    const callButton = document.getElementById("toggleCall") as HTMLButtonElement;
    if(hungUp){
        callButton.textContent = "New Call";
        pauseTimer();

        holdPauseTimer();
        holdTimerValue = 0;
        const holdTimerElement = document.getElementById("holdTimer") as HTMLParagraphElement;
        holdTimerElement.textContent = ``;
    }else{
        callButton.textContent = "Hang Up";

        timerValue = 0;
        const timerElement = document.getElementById("timer") as HTMLParagraphElement;
        timerElement.textContent = `${timerValue} seconds`;
        startTimer();

        fetch("http://127.0.0.1:8000/call_started", {method: "POST"})
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json(); // Parse the response as JSON (or use response.text() for text data)
          }).catch((error) => {
            // Handle errors
            console.error("Fetch error:", error);
          });  
    }


};

const updateTimer = () => {
  const timerElement = document.getElementById("timer") as HTMLParagraphElement;
  timerElement.textContent = `${timerValue} seconds`;
  timerValue++;
};

const pauseTimer = () => {
  clearInterval(timerInterval);
};

const startTimer = () => {
  clearInterval(timerInterval); // Clear any previous timers
  updateTimer(); // Initial display
  timerInterval = setInterval(updateTimer, 1000); // Update every 1 second (1000 milliseconds)
};

const holdUpdateTimer = () => {
    const holdTimerElement = document.getElementById("holdTimer") as HTMLParagraphElement;
    holdTimerElement.textContent = `${holdTimerValue} seconds`;
    holdTimerValue++;
  };
  
  const holdPauseTimer = () => {
    clearInterval(holdTimerInterval);
  };
  
  const holdStartTimer = () => {
    clearInterval(holdTimerInterval); // Clear any previous timers
    holdUpdateTimer(); // Initial display
    holdTimerInterval = setInterval(holdUpdateTimer, 1000); // Update every 1 second (1000 milliseconds)
  };

const toggleHold = () => {
  hold = !hold;
  if (hold) {
    pauseTimer();
    holdStartTimer();
  } else {
    startTimer();
    holdPauseTimer();
    holdTimerValue = 0;
    const holdTimerElement = document.getElementById("holdTimer") as HTMLParagraphElement;
    holdTimerElement.textContent = ``;
  }
};

const evaluateCall = () => {
  fetch("http://127.0.0.1:8000/call_finished", {method: "POST"})
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json(); // Parse the response as JSON (or use response.text() for text data)
  }).catch((error) => {
    // Handle errors
    console.error("Fetch error:", error);
  });   
  window.close();
}

const loadTransfers = () => {
  // load transfer options 
  fetch("http://127.0.0.1:8000/transfer_options")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json(); // Parse the response as JSON (or use response.text() for text data)
    }).then((data) => {
        const transferOptionsElement = document.getElementById("transfer-dropdown") as HTMLUListElement;
        data.transfer_options.forEach((option: string) => {
            const liElement = document.createElement("li");
            const aElement = document.createElement("a");
            liElement.appendChild(aElement);
            aElement.classList.add("dropdown-item");
            aElement.textContent = option;
            transferOptionsElement.appendChild(liElement);
        })

    }).catch((error) => {
      // Handle errors
      console.error("Fetch error:", error);
    }); 
}

document.addEventListener("DOMContentLoaded", function () {
  loadTransfers(); 
  startTimer();
  fetch("http://127.0.0.1:8000/call_started", {method: "POST"})
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json(); // Parse the response as JSON (or use response.text() for text data)
    }).catch((error) => {
      // Handle errors
      console.error("Fetch error:", error);
    }); 
});
