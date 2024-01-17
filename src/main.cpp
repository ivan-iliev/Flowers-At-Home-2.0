#include <WiFiManager.h>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>
#include <Arduino.h>
#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>
#include <SD.h>
#include <SPI.h>
#include <ESPmDNS.h>
#include <Esp.h>
#include <Firebase_ESP_Client.h>
#include "time.h"
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"



#define I2C_SDA 25
#define I2C_SCL 26
#define DHT_PIN 16
#define BAT_ADC 33
#define SALT_PIN 34
#define SOIL_PIN 32
#define BOOT_PIN 0
#define POWER_CTRL 4
#define USER_BUTTON 35

#define soil_max 1638
#define soil_min 3285

#define DHT_TYPE DHT11

int last = HIGH;
int state;


float luxRead;
float advice;
float soil;
IPAddress ip;

#define USER_EMAIL "mr.i.iliev@gmail.com"
#define USER_PASSWORD "qwertyui"
#define API_KEY "AIzaSyC-A0MfAzIYWH0_iOIq7Nd5MQDIXOMciXk"
#define DATABASE_URL "https://flowersathome-2817b-default-rtdb.firebaseio.com/"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

String uid;
String databasePath;

String tempPath = "/temperature";
String humPath = "/humidity";
String lightPath = "/light";
String soilPath = "/soil";
String saltPath = "/salt";
String batPath = "/battery";
String timePath = "/timestamp";
String parentPath;

int timestamp;

FirebaseJson json;
const char* ntpServer = "pool.ntp.org";

unsigned long sendDataPrevMillis = 0;
unsigned long timerDelay = 180000;
bool signupOK = false;

BH1750 lightMeter(0x23);
DHT dht(DHT_PIN, DHT_TYPE);





AsyncWebServer server(8080);

String readTemp() {

  float t = dht.readTemperature();

  if (isnan(t)) {
    Serial.println("Failed to read from  sensor!");
    return "";
  }
  else {
    Serial.println(t);
    return String(t);
  }
}

String readHum() {
  float h = dht.readHumidity();
  if (isnan(h)) {
    Serial.println("Failed to read from  sensor!");
    return "";
  }
  else {
    Serial.println(h);
    return String(h);
  }
}



String readLight() {
  float l = lightMeter.readLightLevel();
  if (isnan(l)) {
    Serial.println("Failed to read from  sensor!");
    return "";
  }
  else {
    Serial.println(l);
    return String(l);
  }
}

String readSoil()
{
  uint16_t soil = analogRead(SOIL_PIN);

  if (map(soil, soil_min, soil_max, 0, 100) <= 0 ) {
    return String(0);
  } else {
    return String(map(soil, soil_min, soil_max, 0, 100));
  }


}


float readBattery()
{
  int vref = 1100;
  uint16_t volt = analogRead(BAT_ADC);


  float battery_voltage = ((float)volt / 4095.0) * 2.0 * 3.3 * (vref) / 1000;

  battery_voltage = battery_voltage * 100;
  if (map(battery_voltage, 416, 290, 100, 0) >= 100) {
    return 100;
  } else {
    return map(battery_voltage, 416, 290, 100, 0);
  }

}


String readSalt()
{
  uint8_t samples = 120;
  uint32_t humi = 0;
  uint16_t array[120];

  for (int i = 0; i < samples; i++)
  {
    array[i] = analogRead(SALT_PIN);
    delay(2);
  }
  std::sort(array, array + samples);
  for (int i = 0; i < samples; i++)
  {
    if (i == 0 || i == samples - 1)
      continue;
    humi += array[i];
  }
  humi /= samples - 2;
  return String(humi);
}

unsigned long getTime() {
  time_t now;
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    //Serial.println("Failed to obtain time");
    return(0);
  }
  time(&now);
  return now;
}


void setup() {

  Serial.begin(115200);
  pinMode(USER_BUTTON,INPUT_PULLUP);
  dht.begin();
  lightMeter.begin();

  pinMode(POWER_CTRL, OUTPUT);
  digitalWrite(POWER_CTRL, 1);
  delay(1000);


  


  bool wireOk = Wire.begin(I2C_SDA, I2C_SCL);
  if (wireOk)
  {
    Serial.println(F("Wire ok"));
  }
  else
  {
    Serial.println(F("Wire NOK"));
  }
  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE))
  {
    Serial.println(F("BH1750 Advanced begin"));
  }
  else
  {
    Serial.println(F("Error initialising BH1750"));
  }


  if (!SPIFFS.begin()) {
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }


  WiFiManager wm;

  bool res;

  res = wm.autoConnect("Flowers At Home", "password"); // password protected ap
  wm.startWebPortal();
 // wm.resetSettings();


  if (!res) {

    Serial.println("Failed to connect");

    // ESP.restart();

  }

  configTime(0, 0, ntpServer);

  config.api_key = API_KEY;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;
  config.database_url = DATABASE_URL;

  /* Assign the callback function for the long running token generation task */
  config.token_status_callback = tokenStatusCallback; //see addons/TokenHelper.h
  
  Firebase.begin(&config, &auth);
  Serial.println("Getting User UID");
  while ((auth.token.uid) == "") {
    Serial.print('.');
    delay(1000);
  }
  // Print user UID
  uid = auth.token.uid.c_str();
  Serial.print("User UID: ");
  Serial.println(uid);
  databasePath = "/readings";


  server.on("/", HTTP_GET, [](AsyncWebServerRequest * request) {
    request->send(SPIFFS, "/index.html");
  });
   server.on("/favicon", HTTP_GET, [](AsyncWebServerRequest * request) {
    request->send(SPIFFS, "/favicon.ico", "image/ico");
  });
   server.on("/logo", HTTP_GET, [](AsyncWebServerRequest * request) {
    request->send(SPIFFS, "/logo.png", "image/png");
  });
  server.on("/temperature", HTTP_GET, [](AsyncWebServerRequest * request) {
    request->send_P(200, "text/plain", readTemp().c_str());
  });
  server.on("/humidity", HTTP_GET, [](AsyncWebServerRequest * request) {
    request->send_P(200, "text/plain", readHum().c_str());
  });
  server.on("/light", HTTP_GET, [](AsyncWebServerRequest * request) {
    request->send_P(200, "text/plain", readLight().c_str());
  });

  server.on("/soil", HTTP_GET, [](AsyncWebServerRequest * request) {
    request->send_P(200, "text/plain", readSoil().c_str());
  });

  server.on("/salt", HTTP_GET, [](AsyncWebServerRequest * request) {
    request->send_P(200, "text/plain", readSalt().c_str());
  });

  server.on("/battery", HTTP_GET, [](AsyncWebServerRequest * request) {
    request->send_P(200, "text/plain", String(readBattery()).c_str());
  });

  server.begin();
}

void loop() {
  if (Firebase.ready() && (millis() - sendDataPrevMillis > timerDelay || sendDataPrevMillis == 0)){
    sendDataPrevMillis = millis();

    timestamp = getTime();
    Serial.print ("time: ");
    Serial.println (timestamp);

    String MAC = WiFi.macAddress();
    parentPath= databasePath + "/" + MAC;
    json.set(tempPath.c_str(),readTemp().c_str());
    json.set(humPath.c_str(),readHum().c_str());
    json.set(lightPath.c_str(),readLight().c_str());
    json.set(soilPath.c_str(),readSoil().c_str());
    json.set(saltPath.c_str(),readSalt().c_str());
    json.set(batPath.c_str(),String(readBattery()).c_str());
    json.set(timePath.c_str(),String(timestamp));
     Serial.printf("Set json... %s\n", Firebase.RTDB.setJSON(&fbdo, parentPath.c_str(), &json) ? "ok" : fbdo.errorReason().c_str());
  }


  state = digitalRead(USER_BUTTON);

  if(state==LOW){
     Serial.println("LOW");
  }else{
    Serial.println("high");
}

}

