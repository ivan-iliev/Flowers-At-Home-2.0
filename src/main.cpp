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
#include <LittleFS.h>





#define I2C_SDA 25
#define I2C_SCL 26
#define DHT_PIN 16
#define BAT_ADC 33
#define SALT_PIN 34
#define SOIL_PIN 32
#define BOOT_PIN 0
#define POWER_CTRL 4
#define USER_BUTTON 35

#define uS_TO_S_FACTOR 1000000 
#define TIME_TO_SLEEP  120  
#define THRESHOLD   1

RTC_DATA_ATTR int bootCount = 0;
touch_pad_t touchPin;

#define soil_max 1638
#define soil_min 3285

#define DHT_TYPE DHT11


int state;
float luxRead;
float advice;
float soil;


BH1750 lightMeter(0x23);
DHT dht(DHT_PIN, DHT_TYPE);

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
void print_wakeup_touchpad(){
  touchPin = esp_sleep_get_touchpad_wakeup_status();
    switch(touchPin)
    {
      case 0  : Serial.println("Touch detected on GPIO 4"); break;
      case 1  : Serial.println("Touch detected on GPIO 0"); break;
      case 2  : Serial.println("Touch detected on GPIO 2"); break;
      case 3  : Serial.println("Touch detected on GPIO 15"); break;
      case 4  : Serial.println("Touch detected on GPIO 13"); break;
      case 5  : Serial.println("Touch detected on GPIO 12"); break;
      case 6  : Serial.println("Touch detected on GPIO 14"); break;
      case 7  : Serial.println("Touch detected on GPIO 27"); break;
      case 8  : Serial.println("Touch detected on GPIO 33"); break;
      case 9  : Serial.println("Touch detected on GPIO 32"); break;
      default : Serial.println("Wakeup not by touchpad"); break;
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
void callback(){
  //placeholder callback function
}


void setup() {

  Serial.begin(115200);
  delay(1000);
  pinMode(USER_BUTTON,INPUT_PULLUP);
  dht.begin();
  lightMeter.begin();

  pinMode(POWER_CTRL, OUTPUT);
  digitalWrite(POWER_CTRL, 1);
  delay(1000);
  esp_sleep_enable_touchpad_wakeup();
  
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



  bool res;


  WiFiManager wm;
  res = wm.autoConnect("Flowers At Home", "password"); // password protected ap
  wm.startWebPortal();
 // wm.resetSettings();

  

  state = digitalRead(USER_BUTTON);
  if(state==LOW){
     wm.resetSettings();
  }

  if (!res) {
    Serial.println("Failed to connect");
    ESP.restart();
  }

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



  ++bootCount;
  Serial.println("Boot number: " + String(bootCount));
  Serial.println("SoilM0 - " + String(touchRead(T0)));
  Serial.println("SoilM1 - " + String(touchRead(T1)));
  Serial.println("SoilM2 - " + String(touchRead(T2)));
  Serial.println("SoilM3 - " + String(touchRead(T3)));
  Serial.println("SoilM4 - " + String(touchRead(T4)));
  Serial.println("SoilM5 - " + String(touchRead(T5)));
  Serial.println("SoilM6 - " + String(touchRead(T6)));
  Serial.println("SoilM7 - " + String(touchRead(T7)));
  Serial.println("SoilM8 - " + String(touchRead(T8)));
  Serial.println("SoilM9 - " + String(touchRead(T9)));

  print_wakeup_reason();
  //print_wakeup_touchpad();


  esp_sleep_enable_timer_wakeup(TIME_TO_SLEEP * uS_TO_S_FACTOR);
 
  //touchSleepWakeUpEnable(T2, THRESHOLD);

  
  Serial.println("Setup ESP32 to sleep for every " + String(TIME_TO_SLEEP) + " Seconds");
  Serial.println("Going to sleep now");
  delay(1000);
  Serial.flush(); 
  esp_deep_sleep_start();
  Serial.println("This will never be printed");

}

void loop() {
 
}

