from llm import CLIENT, get_completion
import base64
import io
import json
from pathlib import Path
from representations import Turn

with open(Path(__file__).parent / "./characters.json") as f:
  characters = json.load(f)

def build_system_prompt(character_nickname):
  system_prompt = ""
  system_prompt += f"{characters['characters'][character_nickname]['profile']} {characters['characters'][character_nickname]['intent']} {characters['general_advisor']}"
  system_prompt += "Some further customer information is also included."  
  for key, value in characters['characters'][character_nickname]["customer_data"].items():
    system_prompt += f"{key}: {value}"

  return system_prompt

def get_character(character_nickname):
  return characters['characters'][character_nickname]


def get_voice(input):
    spoken_response = CLIENT.audio.speech.create(
      model="tts-1", # lower latency than tts-1-hd
      voice="alloy",
      response_format="mp3",
      input=input,
    )

    buffer = io.BytesIO()
    for chunk in spoken_response.iter_bytes(chunk_size=4096):
      buffer.write(chunk)
    buffer.seek(0)

    # Read the binary data from the BytesIO object
    binary_data = buffer.read()

    # Encode the binary data as a base64 string
    return base64.b64encode(binary_data).decode('utf-8')

def messages_to_turns(messages):
  turns = []
  for message in messages:
    if message["role"] != "system":
      turns.append(Turn(message["role"], message["content"]))

  return turns


# if __name__ == "__main__":

#   start_time = time.time()

#   while len(messages) < 15: 
#     #user_message = input("... \n\n")
#     mic = WhisperMic()
#     user_message = mic.listen(timeout=10)
#     print(user_message)



