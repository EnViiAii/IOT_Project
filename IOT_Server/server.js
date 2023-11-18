// Import các thư viện cần thiết
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Tạo ứng dụng Express và sử dụng middleware để xử lý JSON
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Tạo máy chủ HTTP từ ứng dụng Express
const server = http.createServer(app);

// Tạo đối tượng WebSocket cho ReactJS và ESP32
const wssToClient = new WebSocket.Server({ noServer: true }); // WebSocket dành cho ESP32 tới ReactJS
const wssToESP32 = new WebSocket.Server({ noServer: true });
const wssToESP32Distance = new WebSocket.Server({ noServer: true }); // WebSocket dành cho ReactJS tới ESP32

// Xử lý kết nối từ ReactJS client
wssToClient.on('connection', (ws) => {
    console.log('ReactJS Client Connected');

    // Xử lý khi nhận tin nhắn từ ReactJS client và chuyển đến ESP32
    ws.on('message', (data) => {
        const dataString = "" + data;
        console.log('Receive To ReactJS client:', dataString);

        wssToESP32.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(dataString, (err) => {
                    if (err) {
                        console.error('Error Sending Data To ESP32', err);
                    }
                    // else {
                    //     console.log('Send Data To ESP32 Successfully!');
                    // }
                });
            }
        });
    });

});

// Xử lý kết nối từ ESP32
wssToESP32Distance.on('connection', (ws) => {
    console.log('ESP32 Distance Connected');
    // Xử lý khi nhận tin nhắn từ ESP32 và chuyển đến ReactJS client
    ws.on('message', (data) => {
        const dataString = "" + data;
        // console.log('Receive To ESP32:', dataString);

        // Ví dụ: Gửi dữ liệu khoảng cách tới ReactJS client
        const distanceData = JSON.stringify({
            event: 'distance_update',
            distance: dataString
        });

        wssToClient.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(distanceData, (err) => {
                    if (err) {
                        console.error('Error Sending Data To ReactJS Client', err);
                    }
                    // else {
                    //     console.log('Send Data To ReactJS Successfully!');
                    // }
                });
            }
        });
    });

    // Xử lý khi kết nối bị đóng
    ws.on('close', () => {
        console.log('ESP32 Distance Disconnected');
    });
});

// Xử lý yêu cầu nâng cấp để thiết lập kết nối WebSocket
server.on('upgrade', (request, socket, head) => {
    // Xác định đường dẫn và xử lý yêu cầu nâng cấp tương ứng
    if (request.url === '/toClient') {
        wssToClient.handleUpgrade(request, socket, head, (ws) => {
            wssToClient.emit('connection', ws, request);
        });
    } else if (request.url === '/toESP32') {
        wssToESP32.handleUpgrade(request, socket, head, (ws) => {
            wssToESP32.emit('connection', ws, request);
        });
    } else if (request.url === '/toESP32Distance') {
        wssToESP32Distance.handleUpgrade(request, socket, head, (ws) => {
            wssToESP32Distance.emit('connection', ws, request);
        });
    }
    else {
        socket.destroy();
    }
});

// Lắng nghe trên cổng 8080
server.listen(8080, () => {
    console.log('WebSocket Running On Port 8080');
});
