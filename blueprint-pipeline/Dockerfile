FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download YOLO model into the image
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

# Pre-download EasyOCR models into the image
RUN python -c "import easyocr; easyocr.Reader(['en'], gpu=False)"

COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]