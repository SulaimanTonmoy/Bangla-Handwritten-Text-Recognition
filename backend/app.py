from flask import Flask, request, jsonify
from flask_cors import CORS
import easyocr  
import cv2
import numpy as np
import os
import uuid

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


reader = easyocr.Reader(['bn'], gpu=False) 

@app.route("/")
def home():
    return {"message": "Bangla OCR API running"}

@app.route("/upload", methods=["POST"])
def upload_image():
    file = request.files['file']
    image_id = str(uuid.uuid4())
    filename = f"{image_id}_{file.filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    return jsonify({"image_id": image_id, "file_name": filename})

@app.route("/ocr", methods=["POST"])
def ocr_detect():
    file = request.files['file']
    npimg = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    # Use EasyOCR to detect and recognize text
    result = reader.readtext(img)

    annotations = []
    for i, (bbox, text, conf) in enumerate(result):
        x_min = min([p[0] for p in bbox])
        y_min = min([p[1] for p in bbox])
        x_max = max([p[0] for p in bbox])
        y_max = max([p[1] for p in bbox])
        annotations.append({
            "id": i + 1,
            "image_id": 1,
            "bbox": [float(x_min), float(y_min), float(x_max - x_min), float(y_max - y_min)],
            "text": text,
            "confidence": float(conf)
        })

    return jsonify({"annotations": annotations})

@app.route("/export", methods=["POST"])
def export_json():
    data = request.json
    image_name = data.get("image_name", "unknown.jpg")
    height = data.get("height", 0)
    width = data.get("width", 0)
    annotations = data.get("annotations", [])

    coco_json = {
        "images": [
            {
                "id": 1,
                "file_name": image_name,
                "height": height,
                "width": width
            }
        ],
        "annotations": annotations
    }
    return jsonify(coco_json)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

