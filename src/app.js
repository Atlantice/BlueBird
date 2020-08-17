var deviceName = "ESP32";
// var deviceName = 'UART Service';
// var bleService = 'battery_service'

// same as SERVICE_UUID in arduino
var bleService = "afa2f203-348f-4718-9cf3-f7ff0de38472";
// var bleCharacteristic = 'battery_level'

// same as CHARACTERISTIC_UUID in arduino
var bleCharacteristic = "450fcc81-dad5-46a6-959f-c5f41e37b669";
var bluetoothDeviceDetected;
var gattCharacteristic;
let sendForm = document.getElementById("send-form");
let inputField = document.getElementById("input");

document.querySelector("#read-button").addEventListener("click", function () {
  if (isWebBluetoothEnabled()) {
    read();
  }
});

document
  .querySelector("#start-button")
  .addEventListener("click", function (event) {
    if (isWebBluetoothEnabled()) {
      start();
    }
  });

document
  .querySelector("#stop-button")
  .addEventListener("click", function (event) {
    if (isWebBluetoothEnabled()) {
      stop();
    }
  });

// Handle form submit event
sendForm.addEventListener("submit-button", function (event) {
  event.preventDefault(); // Prevent form sending
  send(inputField.value); // Send text field contents
  inputField.value = ""; // Zero text field
  inputField.focus(); // Focus on text field
});

function isWebBluetoothEnabled() {
  if (!navigator.bluetooth) {
    console.log("Web Bluetooth API is not available in this browser!");
    alert("Web Bluetooth API is not available in this browser!");
    return false;
  }

  return true;
}

function getDeviceInfo() {
  let options = {
    optionalServices: [bleService],
    filters: [
      {
        name: deviceName,
      },
    ],
  };

  console.log("Requesting any Bluetooth Device...");
  return navigator.bluetooth
    .requestDevice(options)
    .then((device) => {
      bluetoothDeviceDetected = device;
    })
    .catch((error) => {
      console.log("Argh! " + error);
    });
}

function read() {
  return (bluetoothDeviceDetected ? Promise.resolve() : getDeviceInfo())
    .then(connectGATT)
    .then((_) => {
      console.log("Reading UV Index...");
      return gattCharacteristic.readValue();
    })
    .catch((error) => {
      console.log("Waiting to start reading: " + error);
    });
}

function connectGATT() {
  if (bluetoothDeviceDetected.gatt.connected && gattCharacteristic) {
    return Promise.resolve();
  }

  return bluetoothDeviceDetected.gatt
    .connect()
    .then((server) => {
      console.log("Getting GATT Service...");
      return server.getPrimaryService(bleService);
    })
    .then((service) => {
      console.log("Getting GATT Characteristic...");
      return service.getCharacteristic(bleCharacteristic);
    })
    .then((characteristic) => {
      gattCharacteristic = characteristic;
      gattCharacteristic.addEventListener(
        "characteristicvaluechanged",
        handleChangedValue
      );
      // handleChangedValue(gattCharacteristic.readValue());
      document.querySelector("#start-button").disabled = false;
      document.querySelector("#stop-button").disabled = true;
      gattCharacteristic.readValue();
    });
}

function Decodeuint8arr(uint8array) {
  return new TextDecoder("utf-8").decode(uint8array);
}

// function handleChangedValue(value) {
function handleChangedValue(event) {
  // let value = event.target.value.getUint8(0)
  // var uint8 = new Uint8Array(30);
  // uint8[0] = value;
  // var now = new Date()
  // console.log('> ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + ' string input is ' + Decodeuint8arr(uint8))

  let value = event.target.value;
  console.log(Decodeuint8arr(value));

  // value -> object
  // event.target.value -> arraybuffer
  // let decoder = new TextDecoder("uft-8");
  // console.log(decoder.decode(value));

  // let value = new TextDecoder().decode(event.target.value);
  // console.log(value, 'in');
}

function send(data) {
  data = String(data);
  {
    {
      /* gattCharacteristic = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E'; */
    }
  }

  if (!data || !gattCharacteristic) {
    return;
  }

  writeToCharacteristic(gattCharacteristic, data);
  console.log(data, "out");
}

function writeToCharacteristic(characteristic, data) {
  characteristic.writeValue(new TextEncoder().encode(data));
}

// function send(data) {
//     data = String(data);

//     if (!data || !gattCharacteristic) {
//         return;
//     }

//     data += '\n'
//     if (data.length > 20) {
//         let chunks = data.match(/(.|[/r/n])){1,20}/g);

//         writeToCharacteristic(gattCharacteristic, chunks[0]); // writing chunk[0] to characteristicCache

//         // for message longer than 20bytes
//         for (let i = 1; i < chunks.length; i++) {
//             setTimeout(() => {
//                 writeToCharacteristic(gattCharacteristic, chunks[i]);
//             }, i * 100);
//         }

//     } else {
//         writeToCharacteristic(gattCharacteristic, data);
//     }

//     console.log(data, 'out');
// }

// function writeToCharacteristic(characteristic, data) {
//     characteristic.writeValue(new TextEncoder().encode(data));
// }

function start() {
  gattCharacteristic
    .startNotifications()
    .then((_) => {
      console.log("Start reading...");
      document.querySelector("#start-button").disabled = true;
      document.querySelector("#stop-button").disabled = false;
    })
    .catch((error) => {
      console.log("[ERROR] Start: " + error);
    });
}

function stop() {
  gattCharacteristic
    .stopNotifications()
    .then((_) => {
      console.log("Stop reading...");
      document.querySelector("#start-button").disabled = false;
      document.querySelector("#stop-button").disabled = true;
    })
    .catch((error) => {
      console.log("[ERROR] Stop: " + error);
    });
}
