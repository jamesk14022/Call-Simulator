


class Turn():
    def __init__(self, actor, transcription):
      self.actor = actor
      self.transcription = transcription


class Call():
  def __init__(self, time_s, turns=[]):
    self.turns = turns
    self.time_ms = time_s
  
  def __len__(self):
    return len(self.turns)

  @property
  def transcription(self):
    return " ".join([turn.transcription for turn in self.turns])