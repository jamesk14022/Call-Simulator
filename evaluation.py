from representations import Call
import json
from llm import get_completion

is_resolved_prompt = (
"Attached is a call transcript from a customer conversation at a bank. We would to decide whether the customer " 
"advisor was able to resolve the customer's issue. Please label the call as resolved or not resolved. Please response with a JSON dictionary "
"Include a key 'is_resolved' with a value of true or false. Include a key 'explanation' which describes why the call was or was not resolved."
"Transcript: {transcription}"
)

is_polite_prompt = (
"Attached is a call transcript from a customer conversation at a bank. We would to decide whether the customer " 
"advisor was polite to the customer during the call. Please label the call as polite or not polite. Please response with a JSON dictionary "
"Include a key 'is_polite=' with a value of true or false. Include a key 'explanation' which describes why the advisor was or was not polite. "
"Include a key 'feedback' which describes what the advisor could have done better. "
"Transcript: {transcription}"
)

confirm_intention_prompt = (
"Attached is a call transcript from a customer conversation at a bank. We would to decide whether the advisor repeated the customer intention back "
"to them. The advisor is supposed to do this to ensure they are really finding a solution to the customers problem. "
"Please response with a JSON dictionary. Include a key 'is_confirmed' with a value of true or false. Include a key 'explanation' which describes why "
"or why not the advisor confirmed the intention. Include a key 'feedback' which describes what the advisor could have done better. "
"Transcript: {transcription}"
)

confirm_no_further_prompt = (
"Attached is a call transcript from a customer conversation at a bank. We would to decide whether the advisor confirmed with the customer, at the end of the call, "
"if there were any other questions the customer had. Please response with a JSON dictionary. Include a key 'confirmed_is_no_further' with a value of true or false. "
"Include a key 'explanation' which describes why or why not you don't believe the advisor asked if there were further questions. Include a key 'feedback' which describes "
"what the advisor could have done better. "
"Transcript: {transcription}"
)

def check_call_resolved(input_call: Call):
    completion_result = get_completion([{"role": "system", "content": is_resolved_prompt.format(transcription = input_call.transcription)}], json=True).choices[0].message.content
    json_completion = json.loads(completion_result)
    return json_completion["is_resolved"], json_completion["explanation"]

def check_polite_advisor(input_call: Call):
    completion_result = get_completion([{"role": "system", "content": is_polite_prompt.format(transcription = input_call.transcription)}], json=True).choices[0].message.content
    json_completion = json.loads(completion_result)
    return json_completion["is_polite"], json_completion["explanation"], json_completion["feedback"]

def check_confirm_intention(input_call: Call):
    completion_result = get_completion([{"role": "system", "content": confirm_intention_prompt.format(transcription = input_call.transcription)}], json=True).choices[0].message.content
    json_completion = json.loads(completion_result)
    return json_completion["is_confirmed"], json_completion["explanation"], json_completion["feedback"]

def check_confirm_no_further(input_call: Call):
    completion_result = get_completion([{"role": "system", "content": confirm_no_further_prompt.format(transcription = input_call.transcription)}], json=True).choices[0].message.content
    json_completion = json.loads(completion_result)
    return json_completion["confirmed_is_no_further"], json_completion["explanation"], json_completion["feedback"]
