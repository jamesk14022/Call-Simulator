from authentication import CLIENT


def get_completion(messages, json=False):

    completion_input  = {
        "messages": messages,
        "model": "gpt-3.5-turbo-1106"
    }
    if json:
        completion_input = completion_input | {"response_format": { "type": "json_object" }}

    # system prompt test
    chat_completion = CLIENT.chat.completions.create(
        **completion_input 
    )
    return chat_completion