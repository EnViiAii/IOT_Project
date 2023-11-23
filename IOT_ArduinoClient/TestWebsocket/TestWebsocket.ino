#include <Arduino.h>
#include <WiFi.h>
#include <Ultrasonic.h>
#include <WebSocketsClient.h>
#include <ESP32Servo.h>

const char *ssid = "Cin";
const char *password = "23122002";
const char *host = "192.168.1.3";
const int port = 8080;

WebSocketsClient webSocket;
WebSocketsClient webSocketDistance;
Servo myservo; 

unsigned long connectionTimeout = 10000; 
unsigned long startTime;

// Cài đặt GPIO cho Driver động cơ L298N
const int ENA = 2;
const int IN1 = 5;
const int IN2 = 18;
const int IN3 = 19;
const int IN4 = 21;
const int ENB = 4;

// Cài đặt GPIO cho cảm biến siêu âm HC-SR04
const int trigPin = 14;
const int echoPin = 27;

// Thiết lập GPIO cho Servo
const int servoPin = 13;

// Đối tượng Ultrasonic
Ultrasonic ultrasonic(trigPin, echoPin);

bool autoMode = false;
bool moveForwardMode = false;
bool moveBackMode = false;


void setup() {
  Serial.begin(115200);

  if (!setupWifiConnection()) {
    Serial.println("WiFi connection failed. Turning off.");
    delay(1000);
    // Tắt thiết bị
    ESP.deepSleep(0); 
  }

  // Lưu thời gian bắt đầu kết nối
  startTime = millis(); 

  if (!connectToSocketIO()) {
    Serial.println("Socket.IO connection failed. Turning off.");
    delay(1000);
    // Tắt thiết bị
    ESP.deepSleep(0);
  }

    // Khởi tạo GPIO cho Driver L298N Motor
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT);
  pinMode(ENB, OUTPUT);

  // Khởi tạo GPIO cho cảm biến siêu âm HC-SR04
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  
  // Khởi tạo GPIO cho Servo
  myservo.attach(servoPin);
}

bool setupWifiConnection() {
  WiFi.begin(ssid, password);
  unsigned long timeout = millis() + 10000; // 10 giây timeout

  while (WiFi.status() != WL_CONNECTED && millis() < timeout) {
    delay(1000);
    Serial.println("Đang kết nối WiFi...");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Đã kết nối WiFi");
    Serial.print("Địa chỉ IP: ");
    Serial.println(WiFi.localIP());
    return true;
  } else {
    Serial.println("Kết nối WiFi thất bại. Đang reset lại....!");
    return false;
  }
}

bool connectToSocketIO() {
  if (millis() - startTime > connectionTimeout) {
    Serial.println("Kết nối Socket.IO thất bại trong khoảng thời gian chờ.");
    return false;
  }

  webSocket.begin(host, port, "/toESP32");
  webSocket.onEvent(webSocketEvent);
  webSocketDistance.begin(host, port, "/toESP32Distance");
  webSocketDistance.onEvent(webSocketEventDistance);

  Serial.println("Đang kết nối đến server Socket.IO...");

  unsigned long timeout = millis() + 10000; // 10 seconds timeout

  while (!webSocket.isConnected() && millis() < timeout) {
    webSocket.loop();
    delay(10);
  }

  if (webSocket.isConnected()) {
    Serial.println("Đã kết nối đến server Socket.IO");
    return true;
  } else {
    Serial.println("Kết nối Socket.IO thất bại. Đang reset lại....!");
    return false;
  }
}


// Chức năng di chuyển xe về phía trước
void moveForward() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  analogWrite(ENA, 150);
  analogWrite(ENB, 150);
  // Serial.println("Moving forward...");
}

void moveForwardAuto() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  analogWrite(ENA, 100);
  analogWrite(ENB, 100);
  // Serial.println("Moving forward...");
}

// Chức năng di chuyển xe về phía sau
void moveBack() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
  analogWrite(ENA, 200);
  analogWrite(ENB, 200);
  // Serial.println("Moving back...");
}

// Chức năng di chuyển xe về bên phải
void moveRight() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  analogWrite(ENA, 200);
  analogWrite(ENB, 200);
  // Serial.println("Moving Right...");
}

// Chức năng di chuyển xe về bên trái
void moveLeft() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
  analogWrite(ENA, 200);
  analogWrite(ENB, 200);
  // Serial.println("Moving left...");
}

// Chức năng dừng xe
void stopMoving() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
  analogWrite(ENA, 0);
  analogWrite(ENB, 0);
  // Serial.println("Stopping...");
}

void scanByServoLeft() {
  for (int pos = 90; pos >= 30; pos -= 1) {
    myservo.write(pos);
    delay(15);
  }
  delay(500);
}

void scanByServoRight() {
  for (int pos = 90; pos <= 150; pos += 1) {
    myservo.write(pos);
    delay(15);
  }
  delay(500);
}


void sendDistance() {
  if (webSocketDistance.isConnected()) {
    int distance = ultrasonic.read();
    String messageToSend = String(distance);
    webSocketDistance.sendTXT(messageToSend);
    delay(100);
  }
}


void loop() {
  webSocket.loop();
  webSocketDistance.loop();
  sendDistance();

  if (autoMode) {
    handleAutoMode();
  }

  if (moveForwardMode) {
    moveForward();
  }

  if (moveBackMode) {
    moveBack();
  }
}

void webSocketEventDistance(WStype_t type, uint8_t *payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.println("Disconnected from server!");
      break;
    case WStype_CONNECTED:
      Serial.println("Connected to server");
      break;
  }
}

// WebSocket event handler function
void webSocketEvent(WStype_t type, uint8_t *payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.println("Disconnected from server!");
      break;
    case WStype_CONNECTED:
      Serial.println("Connected to server");
      break;
    case WStype_TEXT:
      {
        String receivedText = String((char *)payload);
        Serial.print("Received text: ");
        Serial.println(receivedText);

        if (receivedText.equals("forward")) {
          moveForwardMode = true;
        } else if (receivedText.equals("auto")) {
          autoMode = true;
        } else if (receivedText.equals("left")) {
          moveLeft();
          delay(200);
          stopMoving();
        } else if (receivedText.equals("right")) {
          moveRight();
          delay(200);
          stopMoving();
        } else if (receivedText.equals("back")) {
          moveBackMode = true;
        } else if (receivedText.equals("stop")) {
          autoMode = false;
          moveBackMode = false;
          moveForwardMode = false;
          stopMoving();
        }
      }
      break;
    case WStype_BIN:
      Serial.println("Received binary data");
      break;
  }
}

// Extracted the auto mode logic to a separate function
void handleAutoMode() {
  int distance = ultrasonic.read();
  int distance_right;
  int distance_left;

  if (distance > 40 || distance == 0) {
    moveForwardAuto();
  } else {
    stopMoving();
    delay(300);
    moveBack();
    delay(200);
    stopMoving();

    myservo.write(90);
    delay(500);
    myservo.write(150);
    delay(500);
    distance_left = ultrasonic.read();
    delay(100);
    myservo.write(90);
    delay(500);
    myservo.write(30);
    delay(500);
    distance_right = ultrasonic.read();
    delay(100);
    myservo.write(90);
    delay(500);

    if (distance_left < 30 && distance_right < 30) {
      moveBack();
      delay(300);
      stopMoving();
      delay(300);
      moveLeft();
      delay(200);
      stopMoving();
      delay(300);
    } else {
      if (distance_left > distance_right) {
        moveBack();
        delay(300);
        stopMoving();
        delay(300);
        moveLeft();
        delay(200);
        stopMoving();
        delay(300);
      } else {
        moveBack();
        delay(300);
        stopMoving();
        delay(300);
        moveRight();
        delay(200);
        stopMoving();
        delay(300);
      }
    }
  }
}