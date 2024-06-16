
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loopWithPause() {
  let condition = true; // Replace this with your actual loop condition
  while (condition) {
    await sleep(5000); // Sleep for 1 second at the start of each iteration
    fetch("http://127.0.0.1:8000/evaluation_ready")
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json(); // Parse the response as JSON (or use response.text() for text data)
        }).then((data) => {
            console.log(data);
            if(data.ready){
                window.open("http://127.0.0.1:8000/evaluate", "_self");
            }
        }).catch((error) => {
          // Handle errors
          console.error("Fetch error:", error);
        }); 
  }
}


const start = () => {

    const prepareElement = document.getElementById("prepare") as HTMLDivElement;
    prepareElement.hidden = true;

    const spinnerElement = document.getElementById("spinner") as HTMLDivElement;
    spinnerElement.hidden = false;

    window.open("http://127.0.0.1:8000/",  "_blank", "width=400,height=400");
    loopWithPause();
}