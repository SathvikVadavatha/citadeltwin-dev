FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt
RUN python -c "from huggingface_hub import hf_hub_download; from ultralytics import YOLO; YOLO(hf_hub_download(repo_id='SathvikVadavatha/floor-plan-detection', filename='best.pt'))"
RUN python -c "import easyocr; easyocr.Reader(['en'], gpu=False)"
COPY . .
EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]