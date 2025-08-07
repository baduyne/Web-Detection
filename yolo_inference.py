from ultralytics import YOLO

model = YOLO("yolov8n.pt")

def prediction(images):
    results = model(images, verbose=False)
    outputs = []

    for result in results:
        detections = []
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            class_id = int(box.cls[0])

            detections.append({
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2,
                "class": model.names[class_id],
            })
        outputs.append(detections)
    return outputs
