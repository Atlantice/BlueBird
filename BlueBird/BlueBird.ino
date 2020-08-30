#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;
uint32_t value = 0;

// See the following for generating UUIDs:
// https://www.uuidgenerator.net/

#define SERVICE_UUID        "afa2f203-348f-4718-9cf3-f7ff0de38472"
#define CHARACTERISTIC_UUID "450fcc81-dad5-46a6-959f-c5f41e37b669"


class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      BLEDevice::startAdvertising();
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
    }
};


long randNumber;


void setup() {

    Serial.begin(9600);


  // Create the BLE Device
  BLEDevice::init("BlueBird");

  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create a BLE Characteristic
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_WRITE  |
                      BLECharacteristic::PROPERTY_NOTIFY |
                      BLECharacteristic::PROPERTY_INDICATE
                    );

  // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.descriptor.gatt.client_characteristic_configuration.xml
  // Create a BLE Descriptor
  pCharacteristic->addDescriptor(new BLE2902());

  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);  // set value to 0x00 to not advertise this parameter
  BLEDevice::startAdvertising();
  Serial.println("Waiting a client connection to notify...");
}

uint8_t level = 97;



void loop() {


  
//  String bleStatus = "Start the music!";
//  size_t dataLen = bleStatus.length();
//  pCharacteristic->setValue((uint8_t*)&bleStatus[0], dataLen);
//  pCharacteristic->notify(); 
//  
  char song[] = {'c', 'd',' ', 'e', 'f',' ', 'g', 'a', 'b', 'C',' '};
  const byte songLength = sizeof(song) / sizeof(song[0]);
  char notes[11];  //allow 1 extra for the NULL

  for (int n = 0; n < 10 ; n++)
  {
    notes[n] = song[random(0, songLength)];
    notes[n + 1] = '\0';
    //Serial.println(notes);
  }
  

  //delay(50);

  String payload = notes;
    Serial.println(payload);


    size_t dataLen2 = payload.length();
  pCharacteristic->setValue((uint8_t*)&payload[0], dataLen2);
  pCharacteristic->notify(); 
   
//  pCharacteristic->setValue(&level, 2); // size : 8 bit -> 1 byte, this only accepts uint8_t
//  pCharacteristic->notify(); // send first 20 bytes
//  level++;
  delay(5000); 

  
    // notify changed value
//    if (deviceConnected) {
//        pCharacteristic->setValue((uint8_t*)&value, 4);
//        pCharacteristic->notify();
//        value++;
//        delay(10); // bluetooth stack will go into congestion, if too many packets are sent, in 6 hours test i was able to go as low as 3ms
//    }
//    // disconnecting
//    if (!deviceConnected && oldDeviceConnected) {
//        delay(500); // give the bluetooth stack the chance to get things ready
//        pServer->startAdvertising(); // restart advertising
//        Serial.println("start advertising");
//        oldDeviceConnected = deviceConnected;
//    }
//    // connecting
//    if (deviceConnected && !oldDeviceConnected) {
//        // do stuff here on connecting
//        oldDeviceConnected = deviceConnected;
//    }
}
