from authentication import CLIENT

def get_transcription_from_api(file_path: str):

    return CLIENT.audio.transcriptions.create(
    model="whisper-1", 
    file=open(file_path, "rb")
    )