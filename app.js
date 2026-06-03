/* ==========================================================================
   TSS Exam Prep Hub - Core Logic & Data System (Vanilla JS)
   ========================================================================== */

// ==========================================
// 1. Toast Notification System
// ==========================================
function initToastContainer() {
  if (!document.getElementById("toast-container")) {
    const container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
}

function showToast(message, type = "success") {
  initToastContainer();
  const container = document.getElementById("toast-container");
  
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  const icon = document.createElement("i");
  if (type === "success") {
    icon.className = "lucide-check-circle";
    icon.setAttribute("data-lucide", "check-circle");
  } else {
    icon.className = "lucide-alert-triangle";
    icon.setAttribute("data-lucide", "alert-triangle");
  }
  
  const text = document.createElement("span");
  text.textContent = message;
  
  toast.appendChild(icon);
  toast.appendChild(text);
  container.appendChild(toast);
  
  // Initialize lucide icons for the new toast
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
  
  // Slide out and remove after 2.5 seconds
  setTimeout(() => {
    toast.classList.add("out");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2500);
}

// ==========================================
// 2. Scenario Data
// ==========================================
const csaScenarios = [
  {
    id: "csa-parking",
    title: "Smart Parking System",
    likelihood: 5,
    components: ["Arduino Uno", "IR Sensor", "Servo Motor", "LCD I2C 16x2", "Buzzer"],
    tasks: [
      "Detect approaching vehicle with IR sensor",
      "Open gate automatically using servo",
      "Count and display available slots on LCD",
      "Buzzer beep when slot is full",
    ],
    explanation:
      "When a car arrives, the IR sensor goes LOW. The servo rotates to 90° to open the gate, the slot count decreases, and the LCD shows available slots. When full, the buzzer beeps.",
    code: [
      {
        language: "cpp",
        filename: "smart_parking.ino",
        content: `#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Servo.h>

#define IR_PIN     2
#define SERVO_PIN  9
#define BUZZER     8
#define TOTAL_SLOTS 4

LiquidCrystal_I2C lcd(0x27, 16, 2);
Servo gate;
int slots = TOTAL_SLOTS;

void setup() {
  pinMode(IR_PIN, INPUT);
  pinMode(BUZZER, OUTPUT);
  gate.attach(SERVO_PIN);
  gate.write(0); // closed
  lcd.init(); lcd.backlight();
  lcd.print("Smart Parking");
}

void loop() {
  lcd.setCursor(0, 1);
  lcd.print("Slots: "); lcd.print(slots); lcd.print("   ");

  if (digitalRead(IR_PIN) == LOW) {     // car detected
    if (slots > 0) {
      gate.write(90); delay(3000);      // open 3s
      gate.write(0);
      slots--;
    } else {
      digitalWrite(BUZZER, HIGH); delay(500);
      digitalWrite(BUZZER, LOW);
    }
  }
  delay(200);
}`,
      },
    ],
  },
  {
    id: "csa-lab",
    title: "Pharmaceutical Lab Monitoring",
    likelihood: 5,
    components: ["Arduino Uno", "DHT22", "MQ135", "LCD I2C", "Fan", "Buzzer", "Relay"],
    tasks: [
      "Monitor temperature & humidity (DHT22)",
      "Detect gas contamination (MQ135)",
      "Auto-activate fan via relay",
      "Trigger buzzer on danger",
      "Display all readings on LCD",
    ],
    explanation:
      "Temperature/humidity from DHT22 and gas level from MQ135 are read every second. If temperature > 30°C OR gas > 400, the relay turns the fan ON and the buzzer alarms.",
    code: [
      {
        language: "cpp",
        filename: "lab_monitor.ino",
        content: `#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define DHTPIN   2
#define DHTTYPE  DHT22
#define MQ_PIN   A0
#define FAN      7   // relay
#define BUZZER   8

DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  pinMode(FAN, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  dht.begin();
  lcd.init(); lcd.backlight();
}

void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  int   gas = analogRead(MQ_PIN);

  lcd.setCursor(0,0); lcd.print("T:"); lcd.print(t,1);
  lcd.print(" H:"); lcd.print(h,0); lcd.print("%  ");
  lcd.setCursor(0,1); lcd.print("Gas:"); lcd.print(gas); lcd.print("   ");

  bool danger = (t > 30 || gas > 400);
  digitalWrite(FAN,    danger ? HIGH : LOW);
  digitalWrite(BUZZER, danger ? HIGH : LOW);
  delay(1000);
}`,
      },
    ],
  },
  {
    id: "csa-door",
    title: "Smart Door Lock (Keypad)",
    likelihood: 5,
    components: ["Arduino Uno", "4x4 Keypad", "Servo Motor", "LCD I2C", "Buzzer"],
    tasks: [
      "Enter 4-digit password on keypad",
      "Unlock door with servo when correct",
      "Alarm via buzzer on 3 wrong tries",
      "Display status on LCD",
    ],
    explanation:
      "User types a 4-digit code. If it matches '1234', the servo opens for 5s. Wrong code increments a counter — 3 fails triggers buzzer alarm.",
    code: [
      {
        language: "cpp",
        filename: "door_lock.ino",
        content: `#include <Keypad.h>
#include <Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

const byte ROWS = 4, COLS = 4;
char keys[ROWS][COLS] = {
  {'1','2','3','A'},{'4','5','6','B'},
  {'7','8','9','C'},{'*','0','#','D'}
};
byte rowPins[ROWS] = {9,8,7,6};
byte colPins[COLS] = {5,4,3,2};
Keypad kp(makeKeymap(keys), rowPins, colPins, ROWS, COLS);
Servo lock;
LiquidCrystal_I2C lcd(0x27,16,2);

String input = "";
const String PASSWORD = "1234";
int wrong = 0;

void setup(){
  lock.attach(10); lock.write(0);
  pinMode(11, OUTPUT); // buzzer
  lcd.init(); lcd.backlight();
  lcd.print("Enter code:");
}

void loop(){
  char k = kp.getKey();
  if(!k) return;
  if(k == '#'){
    if(input == PASSWORD){
      lcd.clear(); lcd.print("Access granted");
      lock.write(90); delay(5000); lock.write(0);
      wrong = 0;
    } else {
      lcd.clear(); lcd.print("Wrong code");
      wrong++;
      if(wrong >= 3){
        digitalWrite(11, HIGH); delay(2000);
        digitalWrite(11, LOW); wrong = 0;
      }
    }
    input = ""; delay(1500);
    lcd.clear(); lcd.print("Enter code:");
  } else if(k == '*'){
    input = ""; lcd.clear(); lcd.print("Enter code:");
  } else {
    input += k;
    lcd.setCursor(0,1); lcd.print(input);
  }
}`,
      },
    ],
  },
  {
    id: "csa-irrigation",
    title: "Smart Irrigation / Water Pump",
    likelihood: 4,
    components: ["Arduino Uno", "Soil Moisture Sensor", "Relay", "Fluid Pump", "LCD I2C"],
    tasks: [
      "Read soil moisture level",
      "Turn pump ON when soil is dry",
      "Stop pump when soil is wet",
      "Display moisture % on LCD",
    ],
    explanation:
      "Moisture sensor reads 0–1023. Below 400 = dry → pump ON. Above 700 = wet → pump OFF. Hysteresis prevents flicker.",
    code: [
      {
        language: "cpp",
        filename: "irrigation.ino",
        content: `#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define MOIST A0
#define PUMP  7   // relay
LiquidCrystal_I2C lcd(0x27,16,2);

void setup(){
  pinMode(PUMP, OUTPUT);
  lcd.init(); lcd.backlight();
}

void loop(){
  int raw = analogRead(MOIST);
  int pct = map(raw, 1023, 0, 0, 100); // dry=0%, wet=100%

  lcd.setCursor(0,0); lcd.print("Moisture:"); lcd.print(pct); lcd.print("% ");
  if (pct < 30) { digitalWrite(PUMP, HIGH); lcd.setCursor(0,1); lcd.print("Pump ON  "); }
  else if (pct > 70) { digitalWrite(PUMP, LOW); lcd.setCursor(0,1); lcd.print("Pump OFF "); }
  delay(1000);
}`,
      },
    ],
  },
  {
    id: "csa-weighing",
    title: "Smart Weighing (Load Cell)",
    likelihood: 4,
    components: ["Arduino Uno", "Load Cell", "HX711", "LCD I2C", "Buzzer"],
    tasks: [
      "Calibrate load cell with HX711",
      "Read weight in grams/kg",
      "Display weight on LCD",
      "Buzzer alarm on overload",
    ],
    explanation:
      "HX711 amplifies the load cell signal. Set scale factor after calibration with a known weight. Overload threshold triggers buzzer.",
    code: [
      {
        language: "cpp",
        filename: "weighing.ino",
        content: `#include <HX711.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define DT  3
#define SCK 2
#define BUZZER 8
#define LIMIT_KG 5.0

HX711 scale;
LiquidCrystal_I2C lcd(0x27,16,2);

void setup(){
  pinMode(BUZZER, OUTPUT);
  lcd.init(); lcd.backlight();
  scale.begin(DT, SCK);
  scale.set_scale(420.f);  // <-- calibrate me
  scale.tare();
  lcd.print("Smart Scale");
}

void loop(){
  float kg = scale.get_units(5) / 1000.0;
  if (kg < 0) kg = 0;

  lcd.setCursor(0,1);
  lcd.print("W:"); lcd.print(kg, 2); lcd.print(" kg   ");

  digitalWrite(BUZZER, kg > LIMIT_KG ? HIGH : LOW);
  delay(300);
}`,
      },
    ],
  },
  {
    id: "csa-fire",
    title: "Fire / Gas Detection",
    likelihood: 4,
    components: ["Arduino Uno", "MQ135", "Buzzer", "Horn Siren", "LCD I2C"],
    tasks: [
      "Continuously read MQ135 gas level",
      "Display value on LCD",
      "Trigger buzzer + siren when above threshold",
    ],
    explanation:
      "If gas reading exceeds 500, both buzzer and siren fire. Use a relay for the loud horn since Arduino can't drive it directly.",
    code: [
      {
        language: "cpp",
        filename: "fire_detect.ino",
        content: `#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define MQ A0
#define BUZZER 8
#define SIREN  7    // via relay

LiquidCrystal_I2C lcd(0x27,16,2);

void setup(){
  pinMode(BUZZER, OUTPUT);
  pinMode(SIREN,  OUTPUT);
  lcd.init(); lcd.backlight();
  lcd.print("Fire Detector");
}

void loop(){
  int g = analogRead(MQ);
  lcd.setCursor(0,1);
  lcd.print("Gas:"); lcd.print(g); lcd.print("    ");

  bool alarm = g > 500;
  digitalWrite(BUZZER, alarm);
  digitalWrite(SIREN,  alarm);
  delay(500);
}`,
      },
    ],
  },
];

const nitScenarios = [
  {
    id: "nit-ultrasonic-php",
    title: "Ultrasonic Distance Monitor (NodeMCU + PHP)",
    likelihood: 5,
    components: [
      "NodeMCU ESP8266",
      "HC-SR04 Ultrasonic Sensor",
      "Jumper wires",
      "Wi-Fi network",
      "PHP web server (XAMPP / Hostinger / Netlify-friendly host)",
    ],
    tasks: [
      "Measure distance with HC-SR04 on NodeMCU",
      "Send the reading over Wi-Fi (HTTP GET) to data.php",
      "data.php saves the value to a text file",
      "index.php reads the file and displays the live distance with simple HTML/CSS",
    ],
    explanation:
      "The NodeMCU reads the ultrasonic distance every 2 seconds and sends it as ?distance=XX to data.php. data.php writes the value + timestamp into data.txt. index.php opens data.txt and shows the latest reading on a simple styled page that auto-refreshes every 2 seconds. No database needed — easy to deploy.",
    code: [
      {
        language: "cpp",
        filename: "ultrasonic_nodemcu.ino",
        content: `#include <WiFi.h>
#include <HTTPClient.h>

#define TRIG 22
#define ECHO 21
#define buzzer 17
#define red 18

const char* SSID = "David";
const char* PASS = "day1@2026";


const char* SERVER = "http://192.168.1.10/iot/data.php";

void setup() {
  Serial.begin(115200);
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(buzzer, OUTPUT);
  pinMode(red, OUTPUT);

  WiFi.begin(SSID, PASS);
  Serial.print("Connecting");
  while (WiFi.status() != WL_CONNECTED) { 
  delay(400); 
  Serial.print("."); }
  Serial.println();
  Serial.print("Connected. IP: ");
  Serial.println(WiFi.localIP());

}

void loop() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10); 
  digitalWrite(TRIG, LOW);

  long duration = pulseIn(ECHO, HIGH);
   
  float cm = (duration * 0.034)/2;
  Serial.print("Distance: "); 
  Serial.print(cm); 
  Serial.println(" cm");

  if(cm <= 400){
  digitalWrite(red, HIGH);
  delay(300);
  digitalWrite(red, LOW);
  digitalWrite(buzzer, HIGH);
  delay(300);
  digitalWrite(buzzer, LOW);
  String status = "Danger";
  String image = "Image captured";
  
  }

  else{
  digitalWrite(red, LOW);
  digitalWrite(buzzer, LOW);
  String status = "safe zone";
  String image = "No image captured";
  
  }

  if (WiFi.status() == WL_CONNECTED) {
  
    HTTPClient http;
    http.begin(SERVER);
    String data = "distance=" + String(cm)
                + "&status=" + status
                + "&image=" + image; 
    int code = http.POST(data);
    Serial.print("HTTP code: ");
    Serial.println(code);
    http.end();
  }

  `,
      },
      {
        language: "php",
        filename: "data.php",
        content: `<?php
$host = "localhost";
$user = "root";
$password = "";
$database = "security_db";

$conn = mysqli_connect($host, $user, $password, $database);

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $distance = $_POST['distance'];
    $status     = $_POST['status'];
    $image     = $_POST['image'];

    $sql = "INSERT INTO intrusion_events(image_path, distance, event_status) VALUES('$image', '$distance', '$status')";
    $result = $conn -> query($sql);
    if ($result === TRUE) {
        echo "data inserted successfully!";
  } 
else {
    echo "No data received.";
}
}
else{
    echo "Invalid HTTP method";
}
?>`,
      },
      {
        language: "php",
        filename: "index.php",
        content: ``,
      },
    ],
  },
];

// ==========================================
// 3. Code Utilities (Copy & Download)
// ==========================================
function copyCode(content, btnElement, filename) {
  navigator.clipboard.writeText(content).then(
    () => {
      showToast(`Copied ${filename}`);
      btnElement.classList.add("copied");
      const originalHTML = btnElement.innerHTML;
      btnElement.innerHTML = `<i class="lucide-check"></i> Copied`;
      if (typeof lucide !== "undefined") lucide.createIcons();
      setTimeout(() => {
        btnElement.classList.remove("copied");
        btnElement.innerHTML = originalHTML;
        if (typeof lucide !== "undefined") lucide.createIcons();
      }, 1800);
    },
    () => {
      showToast("Copy failed", "error");
    }
  );
}

function downloadFile(content, filename) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Downloaded ${filename}`);
}

// Helpers to safely handle arbitrary file content via Base64 (avoids HTML attribute parsing issues)
function b64ToUtf8(b64) {
  try {
    // atob -> percent-encoding -> decodeURIComponent to support Unicode
    return decodeURIComponent(Array.prototype.map.call(atob(b64), function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (e) {
    // fallback
    return atob(b64);
  }
}

function downloadFromBase64(b64, filename) {
  const content = b64ToUtf8(b64);
  downloadFile(content, filename);
}

function copyFromBase64(b64, btnElement, filename) {
  const content = b64ToUtf8(b64);
  copyCode(content, btnElement, filename);
}

function utf8ToB64(str) {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
      return String.fromCharCode('0x' + p1);
    }));
  } catch (e) {
    return btoa(str);
  }
}

function downloadCsaPack(list) {
  const parts = list.map(
    (s) =>
      `// ============================================\n// ${s.title} (likelihood ${s.likelihood}/5)\n// Components: ${s.components.join(", ")}\n// ============================================\n\n` +
      s.code.map((c) => `// ---- ${c.filename} ----\n${c.content}`).join("\n\n")
  );
  const bundle = parts.join("\n\n\n");
  downloadFile(bundle, "csa-exam-pack.txt");
}

// ==========================================
// 4. Personalized PHP generator (NIT page)
// ==========================================
const PALETTES = [
  { name: "Midnight",  bg: "#0f172a", card: "#1e293b", text: "#f1f5f9", muted: "#94a3b8", accent: "#22d3ee", font: "Arial, sans-serif",        radius: "16px", shadow: "0 10px 40px rgba(0,0,0,.4)",     layout: "center" },
  { name: "Sunrise",   bg: "#fff7ed", card: "#ffffff", text: "#1f2937", muted: "#6b7280", accent: "#ea580c", font: "Georgia, serif",            radius: "10px", shadow: "0 8px 24px rgba(234,88,12,.2)",   layout: "top"    },
  { name: "Forest",    bg: "#052e1f", card: "#064e3b", text: "#ecfdf5", muted: "#a7f3d0", accent: "#34d399", font: "Verdana, sans-serif",       radius: "20px", shadow: "0 10px 30px rgba(0,0,0,.5)",      layout: "center" },
  { name: "Royal",     bg: "#1e1b4b", card: "#312e81", text: "#eef2ff", muted: "#c7d2fe", accent: "#fbbf24", font: "Tahoma, sans-serif",        radius: "8px",  shadow: "0 12px 30px rgba(0,0,0,.45)",     layout: "split"  },
  { name: "Paper",     bg: "#f5f5f4", card: "#ffffff", text: "#111827", muted: "#6b7280", accent: "#2563eb", font: "'Courier New', monospace", radius: "4px",  shadow: "0 4px 12px rgba(0,0,0,.1)",       layout: "top"    },
  { name: "Rose",      bg: "#fdf2f8", card: "#ffffff", text: "#831843", muted: "#9d174d", accent: "#db2777", font: "'Trebuchet MS', sans-serif",radius: "24px", shadow: "0 10px 25px rgba(219,39,119,.2)", layout: "center" },
  { name: "Cyber",     bg: "#000000", card: "#0a0a0a", text: "#00ff9c", muted: "#4ade80", accent: "#ff00aa", font: "'Courier New', monospace",  radius: "0px",  shadow: "0 0 30px rgba(255,0,170,.4)",     layout: "center" },
  { name: "Ocean",     bg: "#082f49", card: "#0c4a6e", text: "#e0f2fe", muted: "#7dd3fc", accent: "#facc15", font: "Helvetica, sans-serif",     radius: "14px", shadow: "0 10px 30px rgba(0,0,0,.4)",      layout: "split"  },
  { name: "Sand",      bg: "#fef3c7", card: "#fffbeb", text: "#451a03", muted: "#92400e", accent: "#b45309", font: "Georgia, serif",            radius: "12px", shadow: "0 8px 20px rgba(180,83,9,.2)",    layout: "top"    },
  { name: "Slate",     bg: "#1f2937", card: "#374151", text: "#f9fafb", muted: "#d1d5db", accent: "#60a5fa", font: "Arial, sans-serif",         radius: "10px", shadow: "0 10px 30px rgba(0,0,0,.4)",      layout: "center" },
  { name: "Basic Light", bg: "#ffffff", card: "#f3f4f6", text: "#000000", muted: "#4b5563", accent: "#3b82f6", font: "system-ui, sans-serif",     radius: "8px",  shadow: "0 2px 4px rgba(0,0,0,.1)",        layout: "center" },
  { name: "Basic Dark",  bg: "#111827", card: "#1f2937", text: "#ffffff", muted: "#9ca3af", accent: "#60a5fa", font: "system-ui, sans-serif",     radius: "8px",  shadow: "0 4px 6px rgba(0,0,0,.3)",        layout: "center" }
];

let activeStyle = PALETTES[0];

function pickRandomStyle() {
  const index = Math.floor(Math.random() * PALETTES.length);
  return PALETTES[index];
}

function buildIndexPhp(studentName, accent = "#000000") {
  const sanitizedName = studentName ? studentName.replace(/[<>\"]/g, "") : "";
  const titleName = sanitizedName ? ` — ${sanitizedName}` : "";

  return `<?php
$host = "localhost";
$user = "root";
$password = "";
$database = "security_db";

$conn = mysqli_connect($host, $user, $password, $database);

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

$sql = "SELECT * FROM intrusion_events"; // Specific columns are faster
$result = mysqli_query($conn, $sql);
?>

<!DOCTYPE html>
<html>
<head>
  <title>  — tresor </title>

  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
    }

    h1 {
      text-align: center;
    }

    /* Styled the table for a cleaner look */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border: 1px solid #3cd71d;
    }

    th {
      background-color: #f2f2f2;
    }

    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
  </style>
</head>
<body>

<h1>INTRUSION DETECTION SYSTEM BY  — tresor</h1>

<table>
  <thead>
    <tr>
      <th>ID</th>
      <th>image path</th>
      <th>Distance</th>
      <th>event status</th>
      <th>time_stamp</th>
     
    </tr>
  </thead>
  <tbody>
    <?php
    // Loop through the results and build table rows properly
    while($row = mysqli_fetch_assoc($result)) {
        echo "<tr>";
        echo "<td>" . htmlspecialchars($row['id']) . "</td>";
        echo "<td>". htmlspecialchars($row["image_path"]) ."</td>";
        echo "<td>" . htmlspecialchars($row['distance']) . "</td>";
        echo "<td>". htmlspecialchars($row["event_status"]) . "</td>";
        echo "<td>" . htmlspecialchars($row['time_stamp']) . "</td>";
        echo "</tr>";
    }
    ?>
  </tbody>
</table>

</body>
</html>`;
}

// Update the live preview container inside DOM
function updatePhpPreview(studentName) {
  const previewScreen = document.getElementById("preview-screen");
  if (!previewScreen) return;
  previewScreen.style.background = "#ffffff";
  previewScreen.style.color = "#111";
  previewScreen.style.fontFamily = "Arial, sans-serif";
  previewScreen.style.display = "block";
  previewScreen.style.padding = "20px";

  const sanitizedName = studentName ? studentName.trim() : "";
  const titleName = sanitizedName ? ` — ${sanitizedName}` : "";
  const accent = document.getElementById('accent-color-input')?.value || '#000000';

  previewScreen.innerHTML = `
    <h1 style="text-align:center;margin-bottom:20px;">Database Test${titleName}</h1>
    <div style="max-width:600px;margin:0 auto;padding:20px;font-family:Arial,sans-serif;">
      <div style="padding:10px;border:1px solid ${accent};margin:8px 0;border-radius:5px;">Example User</div>
      <div style="padding:10px;border:1px solid ${accent};margin:8px 0;border-radius:5px;">Another User</div>
    </div>`;

  const presetNameLabel = document.getElementById("preview-preset-name");
  if (presetNameLabel) {
    presetNameLabel.textContent = "Simple PHP";
  }
}

// Download personal index.php file
function downloadPersonalPhp(studentName) {
  const accent = document.getElementById('accent-color-input')?.value || '#000000';
  const phpContent = buildIndexPhp(studentName, accent);
  downloadFile(phpContent, "index.php");
}

// Download Full XAMPP pack (.ino, data.php, index.php combined in a text file)
function downloadNitFullPack(studentName) {
  const ino = nitScenarios[0].code.find((c) => c.filename.endsWith(".ino")).content;
  const data = nitScenarios[0].code.find((c) => c.filename === "data.php").content;
  const accent = document.getElementById('accent-color-input')?.value || '#000000';
  const index = buildIndexPhp(studentName, accent);

  const pack = [
    `// ===== ultrasonic_nodemcu.ino =====\n${ino}`,
    `// ===== data.php =====\n${data}`,
    `// ===== index.php (simple) =====\n${index}`,
  ].join("\n\n\n");

  downloadFile(pack, "ultrasonic-xampp-pack.txt");
}

// ==========================================
// 5. DOM Initialization and Rendering helpers
// ==========================================
function renderScenarioCard(scenario, index, accent = "csa") {
  const isOpen = index === 0;
  
  // Rating stars
  let starsHTML = "";
  for (let i = 0; i < 5; i++) {
    if (i < scenario.likelihood) {
      starsHTML += `<i class="lucide-star active" data-lucide="star" style="fill: var(--warning);"></i>`;
    } else {
      starsHTML += `<i class="lucide-star" data-lucide="star"></i>`;
    }
  }

  // Components list tags
  const componentsHTML = scenario.components
    .map((c) => `<span class="component-tag">${c}</span>`)
    .join("");

  // Tasks list items
  const tasksHTML = scenario.tasks
    .map((t) => `<li>${t}</li>`)
    .join("");

  // Code files
  const codeBlocksHTML = scenario.code
    .map((c) => {
      // Escape HTML entities to display code safely
      const escapedCode = c.content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      const b64 = utf8ToB64(c.content);
      return `
        <div class="code-wrapper">
          <div class="code-header">
            <div class="code-header-left">
              <div class="mac-buttons">
                <span class="mac-btn mac-close"></span>
                <span class="mac-btn mac-min"></span>
                <span class="mac-btn mac-max"></span>
              </div>
              <span class="code-filename">${c.filename}</span>
              <span class="code-lang-tag">${c.language}</span>
            </div>
            <div class="code-actions">
              <button onclick="downloadFromBase64('${b64}', '${c.filename}')">
                <i class="lucide-download" data-lucide="download"></i> Save
              </button>
              <button class="copy-btn" onclick="copyFromBase64('${b64}', this, '${c.filename}')">
                <i class="lucide-copy" data-lucide="copy"></i> Copy
              </button>
            </div>
          </div>
          <pre class="code-pre"><code class="code-content">${escapedCode}</code></pre>
        </div>
      `;
    })
    .join("");

  return `
    <article class="scenario-card ${isOpen ? "open" : ""}" id="scenario-${scenario.id}">
      <button class="scenario-header" onclick="toggleScenarioCard('${scenario.id}')">
        <div class="scenario-header-left">
          <span class="scenario-number">${String(index + 1).padStart(2, "0")}</span>
          <div class="scenario-title-area">
            <h3>${scenario.title}</h3>
            <div class="likelihood-stars">
              ${starsHTML}
              <span class="likelihood-text">Likelihood</span>
            </div>
          </div>
        </div>
        <i class="lucide-chevron-down scenario-chevron" data-lucide="chevron-down"></i>
      </button>
      
      <div class="scenario-content">
        <div class="meta-grid">
          <section class="meta-section">
            <h4><i class="lucide-cpu" data-lucide="cpu"></i> Components</h4>
            <div class="components-list">
              ${componentsHTML}
            </div>
          </section>
          <section class="meta-section">
            <h4><i class="lucide-list-checks" data-lucide="list-checks"></i> Tasks</h4>
            <ul class="tasks-list">
              ${tasksHTML}
            </ul>
          </section>
        </div>
        
        <div class="explanation-box">
          <strong>How it works — </strong> ${scenario.explanation}
        </div>
        
        <div class="code-blocks-container">
          ${codeBlocksHTML}
        </div>
      </div>
    </article>
  `;
}

function renderNitCodeLibrary() {
  const libraryContainer = document.getElementById("nit-code-library");
  if (!libraryContainer || !nitScenarios.length) return;

  const files = nitScenarios[0].code;
  libraryContainer.innerHTML = files
    .map((file) => {
      const escapedCode = file.content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      const b64 = utf8ToB64(file.content);

      return `
        <article class="code-library-card">
          <div class="code-library-card-header">
            <div>
              <span class="file-chip">${file.language.toUpperCase()}</span>
              <h3>${file.filename}</h3>
            </div>
            <div class="code-library-card-actions">
              <button class="btn btn-outline btn-sm" onclick="downloadFromBase64('${b64}', '${file.filename}')">
                <i data-lucide="download"></i> Download
              </button>
              <button class="btn btn-outline btn-sm" onclick="copyFromBase64('${b64}', this, '${file.filename}')">
                <i data-lucide="copy"></i> Copy
              </button>
            </div>
          </div>
          <pre class="code-snippet"><code>${escapedCode}</code></pre>
        </article>
      `;
    })
    .join("");

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

function toggleScenarioCard(id) {
  const card = document.getElementById(`scenario-${id}`);
  if (card) {
    card.classList.toggle("open");
  }
}

// ==========================================
// 6. Toolchain Simulation & Dashboard Animation
// ==========================================
function downloadToolchain(packageName, format) {
  showToast(`Initiating toolchain bundle download...`);
  
  setTimeout(() => {
    // Generate mock zip content
    const mockContent = `TSS DevSuite Toolchain Bundle\nPackage: ${packageName}\nVersion: Latest release\nStatus: Pre-compiled binaries generated successfully.`;
    downloadFile(mockContent, `${packageName.toLowerCase().replace(/ /g, "_")}_setup.${format}`);
    showToast(`Successfully downloaded ${packageName} package!`);
  }, 1200);
}

let myChart = null;
const GROUP_ADMIN_PASSCODE = "1234567890";
let currentJoinedGroup = null;

const groupPalette = [
  { name: "Group Alpha", color: "#60a5fa" },
  { name: "Group Beta", color: "#22c55e" },
  { name: "Group Gamma", color: "#f97316" }
];

const chartConfig = {
  nit: {
    label: "NIT",
    days: ["Day 1", "Day 2", "Day 3"],
    teams: Array.from({ length: 9 }, (_, index) => `${index + 1}`)
  },
  csa: {
    label: "CSA",
    days: ["Day 1", "Day 2", "Day 3"],
    teams: ["A", "B", "C"]
  }
};

function hexToRgba(hex, alpha) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
  const bigint = parseInt(c, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getDayOptions(track) {
  return chartConfig[track] ? chartConfig[track].days : ["Day 1"];
}

function getTeamOptions(track) {
  return chartConfig[track] ? chartConfig[track].teams : ["1"];
}

function formatChartTitle(track, day, team) {
  const division = chartConfig[track] ? chartConfig[track].label : "Exam";
  const teamLabel = track === "nit" ? `Team ${team}` : `Group ${team}`;
  return `${division} · ${day} · ${teamLabel}`;
}

function buildChartData(track, day, team) {
  const title = formatChartTitle(track, day, team);
  const dayIndex = getDayOptions(track).indexOf(day);
  const teamIndex = track === "nit" ? parseInt(team, 10) - 1 : team.charCodeAt(0) - 65;
  const baseValue = 55 + (teamIndex * 3) + (dayIndex * 4);

  let labels = [];
  let data = [];
  let color = "#4f46e5";

  if (track === "nit") {
    labels = ["Planning", "Coding", "Testing", "Review"];
    data = [baseValue, baseValue + 8, baseValue + 3, baseValue - 5].map((value) => Math.max(15, Math.min(100, value)));
    color = "#60a5fa";
  } else if (track === "csa") {
    labels = ["IR", "DHT", "MQ", "Keypad", "Soil"];
    data = [baseValue, baseValue - 7, baseValue + 5, baseValue - 3, baseValue + 2].map((value) => Math.max(15, Math.min(100, value)));
    color = "#22c55e";
  } else {
    labels = ["Planning", "Build", "Test", "Submit"];
    data = [65, 70, 60, 80];
    color = "#f97316";
  }

  return {
    labels,
    data,
    label: title,
    color
  };
}

function buildGroupDatasets(track, day, team) {
  const dayIndex = getDayOptions(track).indexOf(day);
  const teamIndex = track === 'nit' ? parseInt(team, 10) - 1 : team.charCodeAt(0) - 65;
  const labels = track === 'nit'
    ? ['Planning', 'Coding', 'Testing', 'Review']
    : ['IR', 'DHT', 'MQ', 'Keypad', 'Soil'];

  const datasets = groupPalette.map((group, index) => {
    const teamOffset = isNaN(teamIndex) ? 0 : teamIndex * 2;
    const baseValue = 45 + dayIndex * 5 + index * 4 + teamOffset;
    const rawData = track === 'nit'
      ? [baseValue, baseValue + 12, baseValue + 5, baseValue - 2]
      : [baseValue, baseValue - 5, baseValue + 6, baseValue - 2, baseValue + 3];

    const data = rawData.map((value) => Math.max(15, Math.min(100, value + index * 2)));
    const isJoined = currentJoinedGroup === group.name;
    const color = group.color;

    return {
      label: `${group.name} (${team})`,
      data,
      borderColor: color,
      backgroundColor: track === 'nit' ? hexToRgba(color, 0.28) : hexToRgba(color, 0.18),
      tension: 0.3,
      fill: track === 'nit',
      borderWidth: isJoined ? 3 : 2,
      pointStyle: track === 'csa' ? 'rectRot' : 'circle',
      pointRadius: isJoined ? 5 : 3,
      borderDash: track === 'csa' ? [6, 4] : []
    };
  });

  return {
    labels,
    datasets,
    label: `${chartConfig[track].label} Groups`
  };
}

function updateChart(track, day, team) {
  const chartData = buildGroupDatasets(track, day, team);
  const desiredType = track === 'nit' ? 'bar' : 'line';
  createChartWithData(desiredType, chartData);
  const trackLabel = document.getElementById('selected-track-label');
  if (trackLabel) {
    trackLabel.textContent = chartConfig[track].label;
  }
}

// Create or recreate the Chart.js instance with the provided type and data
function createChartWithData(type, chartData) {
  const ctx = document.getElementById('dashboardChart');
  if (!ctx || typeof Chart === 'undefined') return;

  if (myChart && myChart.config && myChart.config.type !== type) {
    myChart.destroy();
    myChart = null;
  }

  const config = {
    type,
    data: {
      labels: chartData.labels,
      datasets: chartData.datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: '#d7f6f3' } },
        title: { display: true, text: chartData.label, color: '#94a3b8', font: { size: 14, weight: '600' } }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.06)' } },
        x: { grid: { display: false }, ticks: { color: '#d7f6f3' } }
      }
    }
  };

  if (!myChart) {
    myChart = new Chart(ctx, config);
  } else {
    myChart.config.type = type;
    myChart.config.data = config.data;
    myChart.config.options = config.options;
    myChart.update();
  }
}

function populateChartControls() {
  const trackSelect = document.getElementById("track-select");
  const daySelect = document.getElementById("day-select");
  const teamSelect = document.getElementById("team-select");
  const groupSelect = document.getElementById("group-select");
  const joinGroupSelect = document.getElementById("join-group-select");

  if (!trackSelect || !daySelect || !teamSelect) return;

  trackSelect.innerHTML = Object.keys(chartConfig)
    .map((track) => `<option value="${track}">${chartConfig[track].label}</option>`)
    .join("");

  function refreshDayOptions() {
    const track = trackSelect.value;
    const previousDay = daySelect.value;
    const dayOptions = getDayOptions(track);
    daySelect.innerHTML = dayOptions
      .map((day) => `<option value="${day}">${day}</option>`)
      .join("");
    if (previousDay && dayOptions.includes(previousDay)) {
      daySelect.value = previousDay;
    }
  }

  function refreshTeamOptions() {
    const track = trackSelect.value;
    const previousTeam = teamSelect.value;
    const teamOptions = getTeamOptions(track);
    teamSelect.innerHTML = teamOptions
      .map((team) => `<option value="${team}">${track === "nit" ? `Team ${team}` : `Group ${team}`}</option>`)
      .join("");
    if (previousTeam && teamOptions.includes(previousTeam)) {
      teamSelect.value = previousTeam;
    }
  }

  function refreshGroupSelectors() {
    const selectedGroup = groupSelect?.value || currentJoinedGroup || "";
    const html = groupPalette
      .map((group) => `<option value="${group.name}">${group.name}</option>`)
      .join("");

    if (groupSelect) {
      groupSelect.innerHTML = `<option value="">All groups</option>${html}`;
      if (selectedGroup) {
        groupSelect.value = selectedGroup;
      }
    }
    if (joinGroupSelect) {
      joinGroupSelect.innerHTML = html;
      if (selectedGroup) {
        joinGroupSelect.value = selectedGroup;
      }
    }
    updateGroupWidgets();
  }

  trackSelect.addEventListener("change", () => {
    refreshDayOptions();
    refreshTeamOptions();
    updateChart(trackSelect.value, daySelect.value, teamSelect.value);
    refreshGroupSelectors();
  });

  if (groupSelect) {
    groupSelect.addEventListener("change", () => {
      const selected = groupSelect.value;
      currentJoinedGroup = selected || null;
      updateChart(trackSelect.value, daySelect.value, teamSelect.value);
    });
  }

  if (daySelect) {
    daySelect.addEventListener("change", () => {
      updateChart(trackSelect.value, daySelect.value, teamSelect.value);
    });
  }

  if (teamSelect) {
    teamSelect.addEventListener("change", () => {
      updateChart(trackSelect.value, daySelect.value, teamSelect.value);
    });
  }

  refreshDayOptions();
  refreshTeamOptions();
  refreshGroupSelectors();
}

function updateGroupWidgets() {
  const groupCount = document.getElementById('group-count');
  const joinedGroupName = document.getElementById('joined-group-name');
  const adminStatus = document.getElementById('admin-status');

  if (groupCount) groupCount.textContent = String(groupPalette.length);
  if (joinedGroupName) joinedGroupName.textContent = currentJoinedGroup || 'None';
  if (adminStatus) adminStatus.textContent = 'Ready';
}

function createGroup(name, passcode) {
  const message = document.getElementById('group-create-message');
  if (passcode !== GROUP_ADMIN_PASSCODE) {
    if (message) message.textContent = 'Incorrect passcode. Only admin can create a group.';
    showToast('Admin passcode denied', 'error');
    return;
  }

  const trimmed = name.trim();
  if (!trimmed) {
    if (message) message.textContent = 'Please enter a valid group name.';
    return;
  }

  if (groupPalette.some((group) => group.name.toLowerCase() === trimmed.toLowerCase())) {
    if (message) message.textContent = 'A group with that name already exists.';
    return;
  }

  const colors = ['#60a5fa', '#22c55e', '#f97316', '#a855f7', '#ec4899', '#f59e0b', '#38bdf8'];
  const nextColor = colors[groupPalette.length % colors.length];
  groupPalette.push({ name: trimmed, color: nextColor });

  if (message) message.textContent = `Group "${trimmed}" created. Students can join it now.`;
  const passcodeInput = document.getElementById('admin-passcode-input');
  const groupNameInput = document.getElementById('new-group-name-input');
  if (passcodeInput) passcodeInput.value = '';
  if (groupNameInput) groupNameInput.value = '';
  showToast(`Group ${trimmed} created`, 'success');
  populateChartControls();
  updateChart(document.getElementById('track-select').value, document.getElementById('day-select').value, document.getElementById('team-select').value);
}

function joinGroup() {
  const joinGroupSelect = document.getElementById('join-group-select');
  const message = document.getElementById('join-message');
  if (!joinGroupSelect) return;

  const groupName = joinGroupSelect.value;
  if (!groupName) {
    if (message) message.textContent = 'Choose a group to join first.';
    return;
  }

  currentJoinedGroup = groupName;
  const groupSelect = document.getElementById('group-select');
  if (groupSelect) {
    groupSelect.value = groupName;
  }
  if (message) message.textContent = `Joined ${groupName}. Your group is now highlighted.`;
  showToast(`Joined ${groupName}`, 'success');
  updateGroupWidgets();
  const trackSelect = document.getElementById('track-select');
  const daySelect = document.getElementById('day-select');
  const teamSelect = document.getElementById('team-select');
  if (trackSelect && daySelect && teamSelect) {
    updateChart(trackSelect.value, daySelect.value, teamSelect.value);
  }
}

function promptChartQuery() {
  const trackSelect = document.getElementById("track-select");
  const daySelect = document.getElementById("day-select");
  const teamSelect = document.getElementById("team-select");

  if (!trackSelect || !daySelect || !teamSelect) return;

  showToast("Refreshing group progress chart...");
  updateChart(trackSelect.value, daySelect.value, teamSelect.value);
}

function initDashboardStats() {
  const trackSelect = document.getElementById("track-select");
  const daySelect = document.getElementById("day-select");
  const teamSelect = document.getElementById("team-select");

  if (!trackSelect || !daySelect || !teamSelect) return;

  populateChartControls();

  const ctx = document.getElementById('dashboardChart');
  if (ctx && typeof Chart !== "undefined") {
    Chart.defaults.color = "#94a3b8";
    Chart.defaults.font.family = '"Space Grotesk", sans-serif';

    myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4'],
        datasets: [{
          label: 'Group progress',
          data: [60, 72, 68, 81],
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96, 165, 250, 0.18)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Group progress overview', color: '#94a3b8', font: { size: 14, weight: '600' } }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.08)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  if (trackSelect && daySelect && teamSelect) {
    updateChart(trackSelect.value, daySelect.value, teamSelect.value);
  }

  setInterval(() => {
    if (!myChart) return;
    myChart.data.datasets[0].data = myChart.data.datasets[0].data.map((value) => {
      const drift = Math.floor(Math.random() * 7) - 3;
      return Math.max(15, Math.min(100, value + drift));
    });
    myChart.update('none');
  }, 7000);
}
// Initial script hooks for UI icons load
document.addEventListener("DOMContentLoaded", () => {
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
});
