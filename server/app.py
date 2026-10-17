"""Relast trash classifier: a tiny inference service the app calls for the Sorter feature.

POST /classify (multipart/form-data, field `image`) -> {model, label, score, bin}
GET  /health -> {ok: true, model}
"""

import io
import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from transformers import pipeline

MODEL_ID = os.environ.get("RELAST_CLASSIFIER_MODEL", "dima806/garbage_types_image_detection")
# This model's probabilities are flat (a clear battery photo scores ~0.4), so a fixed cutoff
# like 0.6 never fires. Trust the top label only if it is above a floor AND clearly ahead of
# the runner-up; otherwise report `unsure` and let the text model decide.
MIN_SCORE = float(os.environ.get("RELAST_CLASSIFIER_MIN_SCORE", "0.2"))
MIN_MARGIN = float(os.environ.get("RELAST_CLASSIFIER_MIN_MARGIN", "1.5"))  # top1 / top2
MAX_BYTES = 10 * 1024 * 1024

# Model label -> the app's BinType (src/services/ai/types.ts).
LABEL_TO_BIN = {
    "battery": "hazardous",
    "biological": "compost",
    "brown-glass": "recycling",
    "cardboard": "recycling",
    "clothes": "garbage",  # Gemini/mock text suggests donation first.
    "green-glass": "recycling",
    "metal": "recycling",
    "paper": "recycling",
    "plastic": "recycling",
    "shoes": "garbage",
    "trash": "garbage",
    "white-glass": "recycling",
}

classifier = pipeline("image-classification", model=MODEL_ID)
app = FastAPI(title="Relast classifier")


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_ID}


@app.post("/classify")
async def classify(image: UploadFile = File(...)):
    data = await image.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Image too large.")
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
    except UnidentifiedImageError:
        raise HTTPException(400, "Not a readable image.")

    top, runner_up = classifier(img, top_k=2)
    label, score = top["label"], float(top["score"])
    confident = score >= MIN_SCORE and score >= MIN_MARGIN * float(runner_up["score"])
    bin_ = LABEL_TO_BIN.get(label, "unsure") if confident else "unsure"
    return {"model": MODEL_ID, "label": label, "score": round(score, 4), "bin": bin_}
