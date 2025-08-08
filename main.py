from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import base64
import io
from PIL import Image
import numpy as np
from yolo_inference import prediction

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*')

@app.route('/')
def index():
    return render_template("index.html")


@socketio.on('message')
def prediction_handler(data):
    if 'images' not in data or 'filenames' not in data:
        emit('error', {'error': 'Images or filenames missing'})
        return

    # Tạm lưu vào buffer
    buffer_images = []
    buffer_names = []
    
    # Chia theo batch = 3
    batch_size = 3
    num_patch = 1
    for base64_image, filename in zip(data['images'], data['filenames']):
        try:
            header, encoded = base64_image.split(',', 1)
            image_data = base64.b64decode(encoded)
            image = Image.open(io.BytesIO(image_data)).convert("RGB")
            buffer_images.append(np.array(image))
            buffer_names.append(filename)

            if len(buffer_images) == batch_size:
                # Run YOLO inference
                results = prediction(buffer_images) 

                # Gửi kết quả về frontend
                for name, dets in zip(buffer_names, results):
                    emit('prediction', {
                        'filename': name,
                        'detections': dets
                    })
                buffer_images.clear()
                buffer_names.clear()
                results.clear()

            elif buffer_images:
                results = prediction(buffer_images)
                for name, dets in zip(buffer_names, results):
                    emit('prediction', {'filename': name, 'detections': dets})
                buffer_images.clear()
                buffer_names.clear()
                results.clear()

        except Exception as e:
            emit('error', {'error': f'Failed to process {filename}: {str(e)}'})
            continue

if __name__ == '__main__':
    socketio.run(app, port=8000, debug=True)
