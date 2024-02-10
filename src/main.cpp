#include <WiFiManager.h>
#include <WiFi.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <ESPAsyncWebServer.h>
#include <AsyncTCP.h>
#include <ArduinoJson.h>
#include <DNSServer.h>
#include <SPIFFS.h>
#include <Arduino.h>
#include <ESP32Time.h>
#include <stdint.h>
#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>
#include <SD.h>
#include <SPI.h>
#include <LittleFS.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <stdio.h>
#include <string.h>
#include "esp_system.h"
#include "esp_wifi.h"
#include "time.h"



#define I2C_SDA 25
#define I2C_SCL 26
#define DHT_PIN 16
#define BAT_ADC 33
#define SALT_PIN 34
#define SOIL_PIN 32
#define BOOT_PIN 0
#define POWER_CTRL 4
#define USER_BUTTON 35



#define BUTTON_PIN_BITMASK 0x800000000

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP);
String timeStamp;
uint64_t milisec;


DNSServer dnsServer;

AsyncWebServer server(80);

const char* PARAM_INPUT_1 = "ssid";
const char* PARAM_INPUT_2 = "pass";
const char* PARAM_INPUT_3 = "username";
const char* PARAM_INPUT_4 = "userpass";
const char* PARAM_INPUT_5 = "interval";

const char*  HTTPSServer = "https://www.botanica-wellness.com/report.php";

const char* test_root_ca= \
  "-----BEGIN CERTIFICATE-----\n" \
  "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\n" \
  "-----END CERTIFICATE-----\n"; 




String ssid;
String pass;
String username;
String userpass;
String interval;

#define uS_TO_S_FACTOR 1000000 
#define TIME_TO_SLEEP interval.toInt() * 60  //time to sleep in seconds 
const char* ntpServer = "ntp.rit.edu";



JsonDocument postJson;

const char* ssidPath = "/ssid.conf";
const char* passPath = "/pass.conf";
const char* usernamePath = "/username.conf";
const char* userpassPath = "/userpass.conf";
const char* intervalPath = "/interval.conf";

RTC_DATA_ATTR int bootCount = 0;

#define soil_max 1638
#define soil_min 3285

String MAC = WiFi.macAddress();

#define DHT_TYPE DHT11

unsigned long previousMillis = 0;
const long intervalA = 10000; 

int state;
float luxRead;
float advice;
float soil;


BH1750 lightMeter(0x23);
DHT dht(DHT_PIN, DHT_TYPE);

String ToString(uint64_t x)
{
     boolean flag = false; // For preventing string return like this 0000123, with a lot of zeros in front.
     String str = "";      // Start with an empty string.
     uint64_t y = 10000000000000000000;
     int res;
     if (x == 0)  // if x = 0 and this is not testet, then function return a empty string.
     {
           str = "0";
           return str;  // or return "0";
     }    
     while (y > 0)
     {                
            res = (int)(x / y);
            if (res > 0)  // Wait for res > 0, then start adding to string.
                flag = true;
            if (flag == true)
                str = str + String(res);
            x = x - (y * (uint64_t)res);  // Subtract res times * y from x
            y = y / 10;                   // Reducer y with 10    
     }
     return str;
}  
void print_wakeup_reason(){

  esp_sleep_wakeup_cause_t wakeup_reason;

  wakeup_reason = esp_sleep_get_wakeup_cause();

  switch(wakeup_reason)
  {
    case ESP_SLEEP_WAKEUP_EXT0 : Serial.println("Wakeup caused by external signal using RTC_IO"); break;
    case ESP_SLEEP_WAKEUP_EXT1 : Serial.println("Wakeup caused by external signal using RTC_CNTL"); break;
    case ESP_SLEEP_WAKEUP_TIMER : Serial.println("Wakeup caused by timer"); break;
    case ESP_SLEEP_WAKEUP_TOUCHPAD : Serial.println("Wakeup caused by touchpad"); break;
    case ESP_SLEEP_WAKEUP_ULP : Serial.println("Wakeup caused by ULP program"); break;
    default : Serial.printf("Wakeup was not caused by deep sleep: %d\n",wakeup_reason); break;
  }
}
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
void getMacAddress(char* macAddress) {
    uint8_t mac[6];
    
    
    esp_read_mac(mac, ESP_MAC_WIFI_STA);
    
    
    sprintf(macAddress, "%02X:%02X:%02X:%02X:%02X:%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
}
void initSPIFFS() {
  if (!SPIFFS.begin(true)) {
    Serial.println("An error has occurred while mounting SPIFFS");
  }
  Serial.println("SPIFFS mounted successfully");
}
String readFile(fs::FS &fs, const char * path){
  Serial.printf("Reading file: %s\r\n", path);

  File file = fs.open(path);
  if(!file || file.isDirectory()){
    Serial.println("- failed to open file for reading");
    return String();
  }
  
  String fileContent;
  while(file.available()){
    fileContent = file.readStringUntil('\n');
    break;     
  }
  return fileContent;
}
void writeFile(fs::FS &fs, const char * path, const char * message){
  Serial.printf("Writing file: %s\r\n", path);

  File file = fs.open(path, FILE_WRITE);
  if(!file){
    Serial.println("- failed to open file for writing");
    return;
  }
  if(file.print(message)){
    Serial.println("- file written");
  } else {
    Serial.println("- write failed");
  }
}
bool initWiFi() {
  if(ssid=="" || pass==""){
    Serial.println("Undefined SSID or IP address.");
    return false;
  }

  WiFi.mode(WIFI_STA);

  if (!WiFi.config(WiFi.localIP(), WiFi.gatewayIP(), WiFi.subnetMask())){
    Serial.println("STA Failed to configure");
    return false;
  }
  WiFi.begin(ssid.c_str(), pass.c_str());
  Serial.println("Connecting to WiFi...");

  unsigned long currentMillis = millis();
  previousMillis = currentMillis;

  while(WiFi.status() != WL_CONNECTED) {
    currentMillis = millis();
    if (currentMillis - previousMillis >= intervalA) {
      Serial.println("Failed to connect.");
      return false;
    }
  }

  Serial.println(WiFi.localIP());
  return true;
}
class CaptiveRequestHandler : public AsyncWebHandler {
public:
  CaptiveRequestHandler() {}
  virtual ~CaptiveRequestHandler() {}

  bool canHandle(AsyncWebServerRequest *request){
    return true;
  }

  void handleRequest(AsyncWebServerRequest *request) {
    request->send(SPIFFS, "/wifimanager.html", "text/html"); 
  }
};

void setup() {
  Serial.begin(115200);
  delay(1000);
  pinMode(USER_BUTTON,INPUT);
  dht.begin();
  lightMeter.begin();
  

  initSPIFFS();
  ssid = readFile(SPIFFS, ssidPath);
  pass = readFile(SPIFFS, passPath);
  username = readFile(SPIFFS, usernamePath);
  userpass = readFile (SPIFFS, userpassPath);
  interval = readFile(SPIFFS, intervalPath);
  Serial.println(ssid);
  Serial.println(pass);
  Serial.println(username);
  Serial.println(userpass);
  Serial.println(interval);


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




  char macAddress[18];
  char apString[30];
  getMacAddress(macAddress);

  strcpy(apString, macAddress);
  strcat(apString, " - Botanica");//apstring

  


if(initWiFi()) {
  
  timeClient.begin();
  //configTime(0, 0, ntpServer);
  float bat = readBattery();
  Serial.println("Battery level");
  Serial.println(bat);
  Serial.print("**********************************");
  Serial.print("Printing Data of ALl the Sensors");
  Serial.println("**********************************");
  Serial.println("");

  luxRead = lightMeter.readLightLevel();
  Serial.print("Lux - "); Serial.println(luxRead);

  String soil = readSoil();
  Serial.print("Soil Moisture - "); Serial.println(soil);

  String salt = readSalt();

  
  Serial.print("Salt - "); Serial.println(salt);

  float t = dht.readTemperature(); // Read temperature as Fahrenheit then dht.readTemperature(true)
  Serial.print("Temperature - "); Serial.println(t);

  float h = dht.readHumidity();
  Serial.print("Humidity - "); Serial.println(h);

  float batt = readBattery();
  Serial.print("Battery - "); Serial.println(batt);




  timeClient.update();
  timeStamp = timeClient.getEpochTime();
  
  Serial.print("Time - "); Serial.println(timeStamp);
  
  milisec = timeStamp.toInt();
  milisec *= 1000;

  uint64_t milisecInterval = interval.toInt() * 60000;
  String milisecIntervalHeader = ToString(milisecInterval);

  Serial.print("TimeMil - "); Serial.println(milisec);
  String resJson;
  postJson["battery"] = bat;
  postJson["humidity"] = h;
  postJson["light"] = luxRead;
  postJson["salt"] = salt;
  postJson["soil"] = soil;
  postJson["temperature"] = t;
  postJson["timestamp"] = milisec;
  serializeJson(postJson, resJson);

  WiFiClientSecure *client = new WiFiClientSecure;
  if(client) {
    // set secure client with certificate
    client->setCACert(test_root_ca);
    //create an HTTPClient instance
    HTTPClient https;

    //Initializing an HTTPS communication using the secure client
    Serial.print("[HTTPS] begin...\n");
    if (https.begin(*client, HTTPSServer)) {  // HTTPS
      Serial.print("[HTTPS] POST...\n");
      
      https.addHeader("Content-Type", "application/json");
      https.addHeader("mac", MAC);
      https.addHeader("user", username);
      https.addHeader("pass", userpass);
      https.addHeader("interval", milisecIntervalHeader);
      int httpCode = https.POST(resJson);
      if (httpCode > 0) {
       Serial.printf("[HTTPS] POST... code: %d\n", httpCode);

        if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_MOVED_PERMANENTLY) {
          String payload = https.getString();
          Serial.println(payload);
        }
      }
      else {
        Serial.printf("[HTTPS] POST... failed, error: %s\n", https.errorToString(httpCode).c_str());
      }
      https.end();
    }
  } else {
    Serial.printf("[HTTPS] Unable to connect\n");
  }



  ++bootCount;
  Serial.println("Boot number: " + String(bootCount));
  print_wakeup_reason();


  esp_sleep_enable_timer_wakeup(TIME_TO_SLEEP * uS_TO_S_FACTOR);
  state = digitalRead(USER_BUTTON);

  esp_sleep_enable_ext0_wakeup(GPIO_NUM_35,0);
  
 

  
  Serial.println("Setup ESP32 to sleep for every " + String(TIME_TO_SLEEP) + " Seconds");
  Serial.println("Going to sleep now");
  delay(1000);
  Serial.flush(); 
  esp_deep_sleep_start();
  Serial.println("This will never be printed");

  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(200, "text/plain", "VURZA SE:" + WiFi.localIP());
  });
  server.serveStatic("/", SPIFFS, "/");
  server.begin();
  }else{
    Serial.println("Setting AP (Access Point)");
  
    WiFi.softAP(apString, NULL);

    IPAddress IP = WiFi.softAPIP();
    Serial.print("AP IP address: ");
    Serial.println(IP); 

    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
      request->send(SPIFFS, "/wifimanager.html", "text/html");
    });
    
    server.serveStatic("/", SPIFFS, "/");
    
    server.on("/", HTTP_POST, [](AsyncWebServerRequest *request) {
      int params = request->params();
      for(int i=0;i<params;i++){
        AsyncWebParameter* p = request->getParam(i);
        if(p->isPost()){
     
          if (p->name() == PARAM_INPUT_1) {
            ssid = p->value().c_str();
            Serial.print("SSID set to: ");
            Serial.println(ssid);
        
            writeFile(SPIFFS, ssidPath, ssid.c_str());
          }
       
          if (p->name() == PARAM_INPUT_2) {
            pass = p->value().c_str();
            Serial.print("Password set to: ");
            Serial.println(pass);
        
            writeFile(SPIFFS, passPath, pass.c_str());
          }
         
          if (p->name() == PARAM_INPUT_3) {
            username = p->value().c_str();
            Serial.print("Username set to: ");
            Serial.println(username);
      
            writeFile(SPIFFS, usernamePath, username.c_str());
          }
         
          if (p->name() == PARAM_INPUT_4) {
            userpass = p->value().c_str();
            Serial.print("Userpass set to: ");
            Serial.println(userpass);
    
            writeFile(SPIFFS, userpassPath, userpass.c_str());
          }

          if (p->name() == PARAM_INPUT_5) {
            interval = p->value().c_str();
            Serial.print("interval set to: ");
            Serial.println(interval);
    
            writeFile(SPIFFS, intervalPath, interval.c_str());
          }
        }
      }
      request->send(200, "text/plain", "Done. The device will restart, open your app. If u have entered a wrong wifi SSID or PASSWORD the device will remain in AP mode." + WiFi.localIP());
      delay(3000);
      ESP.restart();
    });

    dnsServer.start(53, "*", WiFi.softAPIP());
    server.addHandler(new CaptiveRequestHandler()).setFilter(ON_AP_FILTER);
    server.begin();
  }




  state = digitalRead(USER_BUTTON);
  

}

void loop() {
  dnsServer.processNextRequest();
   state = digitalRead(USER_BUTTON);

}

