var getEvaluation = function () {
    var evaluationDiv = document.getElementById('evaluation');
    evaluationDiv.hidden = false;
    fetch("http://127.0.0.1:8000/evaluation")
        .then(function (response) {
        if (!response.ok) {
            throw new Error("HTTP error! Status: ".concat(response.status));
        }
        return response.json(); // Parse the response as JSON (or use response.text() for text data)
    })
        .then(function (data) {
        var spinnerElement = document.getElementById('loadingBox');
        spinnerElement.hidden = true;
        var contentElement = document.getElementById('contentBox');
        contentElement.hidden = false;
        var transcriptionElement = document.getElementById('transcription-content');
        transcriptionElement.textContent = data.transcription;
        var scoreElement = document.getElementById('eval-text');
        scoreElement.textContent = data.score + "%";
        var resolvedElement = document.getElementById('resolved');
        resolvedElement.textContent = data.resolved.result;
        var elapsedTime = document.getElementById('elapsedTime');
        elapsedTime.textContent = parseFloat(data.handling_time.toFixed(2)) + " seconds";
        var acc1Header = document.getElementById('acc1-head');
        acc1Header.textContent = data.polite.explanation;
        if (!data.polite.result) {
            var warningElement = document.getElementById("acc1-warning");
            warningElement.hidden = false;
        }
        var acc2Header = document.getElementById('acc2-head');
        acc2Header.textContent = data.confirmed_result.explanation;
        if (!data.confirmed_result.result) {
            var warningElement = document.getElementById("acc2-warning");
            warningElement.hidden = false;
        }
        var acc3Header = document.getElementById('acc3-head');
        acc3Header.textContent = data.confirmed_no_further_result.explanation;
        if (!data.confirmed_no_further_result.result) {
            var warningElement = document.getElementById("acc3-warning");
            warningElement.hidden = false;
        }
        var acc1Body = document.getElementById('acc1-body');
        acc1Body.textContent = data.polite.feedback;
        var acc2Body = document.getElementById('acc2-body');
        acc2Body.textContent = data.confirmed_result.feedback;
        var acc3Body = document.getElementById('acc3-body');
        acc3Body.textContent = data.confirmed_no_further_result.feedback;
    })
        .catch(function (error) {
        // Handle errors
        console.error('Fetch error:', error);
    });
};
document.addEventListener("DOMContentLoaded", function () {
    getEvaluation();
});
