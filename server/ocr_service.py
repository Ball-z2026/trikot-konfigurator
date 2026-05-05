"""
OCR Service für Trikot-Konfigurator
Erkennt Text auf Bildern mit pixel-genauen Bounding Boxes.
Läuft als HTTP-Server auf Port 5050.
"""
import json
import sys
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import easyocr
import numpy as np
from PIL import Image
import io
import base64
import urllib.request
import cv2

# Initialize EasyOCR reader (German + English)
print("Initializing EasyOCR...", flush=True)
reader = easyocr.Reader(['de', 'en'], gpu=False)
print("EasyOCR ready!", flush=True)


def detect_non_text_regions(img_array, text_boxes):
    """
    Detect non-text regions (logos, patches, emblems) using contour detection.
    Excludes areas already identified as text.
    """
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    h, w = gray.shape
    
    # Create mask of text regions to exclude
    text_mask = np.zeros((h, w), dtype=np.uint8)
    for box in text_boxes:
        pts = np.array(box, dtype=np.int32)
        cv2.fillPoly(text_mask, [pts], 255)
    
    # Edge detection
    edges = cv2.Canny(gray, 50, 150)
    
    # Dilate to connect nearby edges
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    dilated = cv2.dilate(edges, kernel, iterations=3)
    
    # Remove text regions from edge map
    dilated[text_mask > 0] = 0
    
    # Find contours
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    non_text_regions = []
    min_area = (h * w) * 0.005  # Minimum 0.5% of image area
    max_area = (h * w) * 0.25   # Maximum 25% of image area
    
    for contour in contours:
        area = cv2.contourArea(contour)
        if min_area < area < max_area:
            x, y, cw, ch = cv2.boundingRect(contour)
            # Filter out very elongated shapes (likely not logos)
            aspect_ratio = max(cw, ch) / (min(cw, ch) + 1)
            if aspect_ratio < 4:  # Logos are usually not too elongated
                non_text_regions.append({
                    "bbox": [x, y, x + cw, y + ch],
                    "area": area,
                    "aspect_ratio": round(aspect_ratio, 2)
                })
    
    # Sort by area (largest first) and limit
    non_text_regions.sort(key=lambda r: r["area"], reverse=True)
    return non_text_regions[:10]  # Max 10 non-text regions


def analyze_image(image_data):
    """
    Analyze image: OCR for text + contour detection for logos.
    Returns all detected elements with pixel-precise bounding boxes.
    """
    # Load image
    img = Image.open(io.BytesIO(image_data)).convert("RGB")
    img_array = np.array(img)
    h, w = img_array.shape[:2]
    
    # Run OCR
    results = reader.readtext(img_array, detail=1, paragraph=False)
    
    text_elements = []
    text_boxes = []
    
    for (bbox, text, confidence) in results:
        if confidence < 0.3:  # Skip low-confidence results
            continue
        
        # bbox is [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
        pts = np.array(bbox, dtype=np.float32)
        x_min = float(pts[:, 0].min())
        y_min = float(pts[:, 1].min())
        x_max = float(pts[:, 0].max())
        y_max = float(pts[:, 1].max())
        
        text_boxes.append(bbox)
        
        text_elements.append({
            "type": "text",
            "text": text,
            "confidence": round(confidence, 3),
            "bbox_px": {
                "x": round(x_min),
                "y": round(y_min),
                "width": round(x_max - x_min),
                "height": round(y_max - y_min)
            },
            "bbox_percent": {
                "x": round(x_min / w * 100, 1),
                "y": round(y_min / h * 100, 1),
                "width": round((x_max - x_min) / w * 100, 1),
                "height": round((y_max - y_min) / h * 100, 1)
            },
            "polygon": [[round(p[0]), round(p[1])] for p in bbox]
        })
    
    # Detect non-text regions (logos, patches)
    non_text_regions = detect_non_text_regions(img_array, text_boxes)
    
    logo_elements = []
    for region in non_text_regions:
        x1, y1, x2, y2 = region["bbox"]
        logo_elements.append({
            "type": "logo_candidate",
            "confidence": 0.7,
            "bbox_px": {
                "x": x1,
                "y": y1,
                "width": x2 - x1,
                "height": y2 - y1
            },
            "bbox_percent": {
                "x": round(x1 / w * 100, 1),
                "y": round(y1 / h * 100, 1),
                "width": round((x2 - x1) / w * 100, 1),
                "height": round((y2 - y1) / h * 100, 1)
            },
            "aspect_ratio": region["aspect_ratio"]
        })
    
    return {
        "image_size": {"width": w, "height": h},
        "text_elements": text_elements,
        "logo_candidates": logo_elements,
        "total_text_found": len(text_elements),
        "total_logos_found": len(logo_elements)
    }


class OCRHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        try:
            data = json.loads(body)
            
            if "image_url" in data:
                # Download image from URL
                req = urllib.request.Request(data["image_url"])
                with urllib.request.urlopen(req) as response:
                    image_data = response.read()
            elif "image_base64" in data:
                # Decode base64 image
                image_data = base64.b64decode(data["image_base64"])
            elif "image_path" in data:
                # Read from local file
                with open(data["image_path"], "rb") as f:
                    image_data = f.read()
            else:
                self.send_error(400, "No image provided")
                return
            
            result = analyze_image(image_data)
            
            response_json = json.dumps(result, ensure_ascii=False)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(response_json.encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            error_response = json.dumps({"error": str(e)})
            self.wfile.write(error_response.encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
    
    def log_message(self, format, *args):
        print(f"[OCR] {args[0]}", flush=True)


if __name__ == "__main__":
    port = int(os.environ.get("OCR_PORT", 5050))
    server = HTTPServer(("0.0.0.0", port), OCRHandler)
    print(f"OCR Service running on port {port}", flush=True)
    server.serve_forever()
