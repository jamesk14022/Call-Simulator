import tempfile
import io
import base64
import time
from representations import Call
from pathlib import Path
import whisper
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from pydub import AudioSegment
from simulator import (
    get_completion,
    build_system_prompt,
    messages_to_turns,
    get_character,
    get_voice_elevenlabs,
)
from evaluation import (
    check_call_resolved,
    check_polite_advisor,
    check_confirm_intention,
    check_confirm_no_further,
)
from transcription import get_transcription_from_api

messages = [
    {"role": "system", "content": build_system_prompt("bowser")},
]

STATIC_DIR = Path(__file__).parent.parent / "web/static"
WHISPER_MODEL = whisper.load_model("medium")

start_time = 0
finished = False

app = FastAPI()
with open(STATIC_DIR / "js/client.js", "r") as f:
    client_js_source = f.read()

with open(STATIC_DIR / "js/evaluate.js", "r") as f:
    evaluate_js_source = f.read()

with open(STATIC_DIR / "js/prepare.js", "r") as f:
    prepare_js_source = f.read()

with open(STATIC_DIR / "index.html", "r") as f:
    index_html_body = f.read()

with open(STATIC_DIR / "evaluate.html", "r") as f:
    evaluate_html_body = f.read()

with open(STATIC_DIR / "prepare.html", "r") as f:
    prepare_html_body = f.read()


index_html = (
    """
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chat</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
        <style>
            .Blink {
                animation: blinker 1.5s cubic-bezier(.5, 0, 1, 1) infinite alternate;  
            }

            @keyframes blinker {  
            from { opacity: 1; }
            to { opacity: 0; }
            }
        </style>
    </head>
    <body>
        """
    + index_html_body
    + """ 
        <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/2.9.2/umd/popper.min.js" integrity="sha512-2rNj2KJ+D8s1ceNasTIex6z4HWyOnEYLVC3FigGOmyQCZc2eBXKgOxQmo3oKLHyfcj53uz4QMsRCWNbLd32Q1g==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
        <script src="https://code.jquery.com/jquery-3.7.1.slim.js" integrity="sha256-UgvvN8vBkgO0luPSUl2s8TIlOSYRoGFAX4jlCIm9Adc=" crossorigin="anonymous"></script>
        <!-- Latest compiled and minified JavaScript -->
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
        <script>
"""
    + client_js_source
    + """
        </script>
    </body>
</html>
"""
)

evaluate_html = (
    """
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chat</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    </head>
    <body>
        """
    + evaluate_html_body
    + """ 
        <script src="https://code.jquery.com/jquery-3.7.1.slim.js" integrity="sha256-UgvvN8vBkgO0luPSUl2s8TIlOSYRoGFAX4jlCIm9Adc=" crossorigin="anonymous"></script>
        <!-- Latest compiled and minified JavaScript -->
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
        <script>
"""
    + evaluate_js_source
    + """
        </script>
    </body>
</html>
"""
)

prepare_html = (
    """
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chat</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    </head>
    <body>
        """
    + prepare_html_body
    + """ 
        <script src="https://code.jquery.com/jquery-3.7.1.slim.js" integrity="sha256-UgvvN8vBkgO0luPSUl2s8TIlOSYRoGFAX4jlCIm9Adc=" crossorigin="anonymous"></script>
        <!-- Latest compiled and minified JavaScript -->
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
        <script>
"""
    + prepare_js_source
    + """
        </script>
    </body>
</html>
"""
)


@app.get("/")
async def get():
    return HTMLResponse(index_html)


@app.get("/evaluate")
async def get():
    return HTMLResponse(evaluate_html)


@app.get("/prepare")
async def get():
    return HTMLResponse(prepare_html)


@app.get("/evaluation")
async def get_evaulation():
    global start_time

    while True:
        try:
            finished_call = Call(time.time() - start_time, messages_to_turns(messages))
            resolved_result, resolved_explanation = check_call_resolved(finished_call)
            polite_result, polite_explanation, polite_feedback = check_polite_advisor(
                finished_call
            )
            (
                confirmed_result,
                confirmed_explanation,
                confirmed_feedback,
            ) = check_confirm_intention(finished_call)
            (
                confirmed_no_further_result,
                confirmed_no_further_explanation,
                confirmed_no_further_feedback,
            ) = check_confirm_no_further(finished_call)
        except KeyError:
            print("Retrying the evaluation.")
            continue
        else:
            break

    return {
        "score": 70,
        "transcription": finished_call.transcription,
        "handling_time": finished_call.time_ms,
        "polite": {
            "result": polite_result,
            "explanation": polite_explanation,
            "feedback": polite_feedback,
        },
        "resolved": {"result": resolved_result, "explanation": resolved_explanation},
        "confirmed_result": {
            "result": confirmed_result,
            "explanation": confirmed_explanation,
            "feedback": confirmed_feedback,
        },
        "confirmed_no_further_result": {
            "result": confirmed_no_further_result,
            "explanation": confirmed_no_further_explanation,
            "feedback": confirmed_no_further_feedback,
        },
    }


@app.post("/call_started")
async def call_started():
    global finished
    finished = False


@app.post("/call_finished")
async def call_finished():
    global finished
    finished = True


@app.get("/new_call")
async def new_call():
    global messages
    global start_time
    start_time = time.time()
    messages = [
        {"role": "system", "content": build_system_prompt("bowser")},
    ]


@app.get("/evaluation_ready")
async def evaluation_ready():
    global finished
    print(finished)
    return {"ready": finished}


@app.get("/character/{character_nickname}")
async def get_character(character_nickname: str):
    return get_character(character_nickname)


@app.get("/transfer_options")
async def get_transfer_options():
    return {
        "transfer_options": [
            "Credit card desk",
            "Inheritance desk",
            "Mortgage desk",
            "Investment desk",
            "Insurance desk",
        ]
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global start_time
    start_time = time.time()

    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        decoded = base64.b64decode(data)
        io_file = io.BytesIO(decoded)
        audio_segment = AudioSegment.from_file(io_file)
        temp = tempfile.NamedTemporaryFile(mode="w+b", suffix=".wav", delete=False)
        audio_segment.export(temp.name, format="wav")

        result = get_transcription_from_api(temp.name)
        temp.close()

        messages.append({"role": "user", "content": result.text})
        assistant_response = get_completion(messages).choices[0].message.content
        messages.append({"role": "assistant", "content": assistant_response})
        print(assistant_response)

        base64_response = get_voice_elevenlabs(assistant_response)
        await websocket.send_text(base64_response)
