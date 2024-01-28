const getEvaluation = () => {
    const evaluationDiv = document.getElementById('evaluation') as HTMLDivElement;
    evaluationDiv.hidden = false;

    fetch("http://127.0.0.1:8000/evaluation")
        .then(response => {
            if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json(); // Parse the response as JSON (or use response.text() for text data)
        })
        .then(data => {

            const spinnerElement = document.getElementById('loadingBox') as HTMLDivElement;
            spinnerElement.hidden = true;

            const contentElement = document.getElementById('contentBox') as HTMLDivElement;
            contentElement.hidden = false;

            const transcriptionElement = document.getElementById('transcription-content') as HTMLParagraphElement;            
            transcriptionElement.textContent = data.transcription;

            const scoreElement = document.getElementById('eval-text') as HTMLSpanElement;
            scoreElement.textContent = data.score + "%";

            const resolvedElement = document.getElementById('resolved') as HTMLParagraphElement;
            resolvedElement.textContent = data.resolved.result;

            const elapsedTime = document.getElementById('elapsedTime') as HTMLParagraphElement;
            elapsedTime.textContent = parseFloat(data.handling_time.toFixed(2)) + " seconds";

            const acc1Header = document.getElementById('acc1-head') as HTMLSpanElement;
            acc1Header.textContent = data.polite.explanation;
            if(!data.polite.result){
                const warningElement = document.getElementById("acc1-warning") as HTMLSpanElement;
                warningElement.hidden = false;
            }

            const acc2Header = document.getElementById('acc2-head') as HTMLSpanElement;
            acc2Header.textContent = data.confirmed_result.explanation;
            if(!data.confirmed_result.result){
                const warningElement = document.getElementById("acc2-warning") as HTMLSpanElement;
                warningElement.hidden = false;
            }

            const acc3Header = document.getElementById('acc3-head') as HTMLSpanElement;
            acc3Header.textContent = data.confirmed_no_further_result.explanation;
            if(!data.confirmed_no_further_result.result){
                const warningElement = document.getElementById("acc3-warning") as HTMLSpanElement;
                warningElement.hidden = false;
            }

            const acc1Body = document.getElementById('acc1-body') as HTMLDivElement
            acc1Body.textContent = data.polite.feedback;
            const acc2Body = document.getElementById('acc2-body') as HTMLDivElement
            acc2Body.textContent = data.confirmed_result.feedback;
            const acc3Body = document.getElementById('acc3-body') as HTMLDivElement
            acc3Body.textContent = data.confirmed_no_further_result.feedback;
        })
        .catch(error => {
            // Handle errors
            console.error('Fetch error:', error);
        });
    }

document.addEventListener("DOMContentLoaded", function() {
    getEvaluation()
});