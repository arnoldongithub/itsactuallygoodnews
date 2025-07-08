from transformers import BartForConditionalGeneration, BartTokenizer
from fastapi import FastAPI
from pydantic import BaseModel
import torch

app = FastAPI()

# Use smaller, memory-efficient summarization model
model_name = "sshleifer/distilbart-cnn-12-6"
tokenizer = BartTokenizer.from_pretrained(model_name)
model = BartForConditionalGeneration.from_pretrained(model_name)

class SummaryRequest(BaseModel):
    text: str

@app.post("/summarize")
def summarize(req: SummaryRequest):
    inputs = tokenizer([req.text], max_length=1024, return_tensors="pt", truncation=True)
    summary_ids = model.generate(
        inputs["input_ids"],
        max_length=150,
        min_length=40,
        length_penalty=2.0,
        num_beams=4,
        early_stopping=True
    )
    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    return {"summary": summary}

