const imageInput = document.getElementById('imageInput');
const sendBtn = document.getElementById('sendBtn');
const MAX_FILES = 20;

let imageFiles = [];
let base64Images = [];
let filenames = [];

// kết nỗi đến socket
const socket = io('http://localhost:8000');  

socket.on('connect', () => {
    console.log(' Socket.IO connected!');
});


// dự đoán ảnh
socket.on('prediction', (data) => {
    if (data.filename && data.detections) {
        drawDetections(data.filename, data.detections);
    } else {
        console.log('Unknown message:', data);
    }
});


imageInput.addEventListener('change', (e) => {
    const files = [...e.target.files];

    if (files.length > MAX_FILES) {
        alert(`Bạn chỉ được chọn tối đa ${MAX_FILES} ảnh.`);
        imageInput.value = ''; // Reset input
        return;
    }

    imageFiles = files;
    base64Images = [];
    filenames = [];

    imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            base64Images.push(e.target.result);
            filenames.push(file.name);
        };
        reader.readAsDataURL(file);
    });
});

// gửi đến client
sendBtn.addEventListener('click', () => {
    if (!socket.connected) {
        console.error('WebSocket not connected!');
        return;
    }

    socket.emit('message', {
        images: base64Images,
        filenames: filenames
    });
});

// vẽ bounding box 
function drawDetections(filename, detections) {

    const container = document.getElementById('results');
    if (!detections || detections.length === 0) {
        console.log(`Không có đối tượng nào được phát hiện trong ảnh: ${filename}`);
        return; // Không vẽ gì nếu không có detection nào
    }

    // Tìm ảnh base64 theo tên
    const index = filenames.indexOf(filename);
    const base64 = base64Images[index];
    if (!base64) {
        console.error(`Không tìm thấy ảnh cho ${filename}`);
        return;
    }

    // Tạo thẻ canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = new Image();

    image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;

        // Vẽ ảnh gốc lên canvas
        ctx.drawImage(image, 0, 0);

        // Vẽ các bounding box
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.font = "16px Arial";
        ctx.fillStyle = 'red';

        detections.forEach(det => {
            const { x1, y1, x2, y2, class: cls } = det;
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            ctx.fillText(cls, x1, y1 - 5);
        });

        const wrapper = document.createElement('div');
        wrapper.innerHTML = `<h3>${filename}</h3>`;
        wrapper.appendChild(canvas);
        container.appendChild(wrapper);
    };

    image.src = base64;
}
