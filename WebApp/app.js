// PouchDB
// EDITING STARTS HERE (you dont need to edit anything above this line)
// https://pouchdb.com/getting-started.html

// 👇 SETUP LOCAL AND REMOTE DB 👇 
//  🐦 Define DB here
var db = new PouchDB('bluebirdDB');

db.info().then(function (info) {
  document.getElementById('display').innerHTML = 'We have a database: ' + JSON.stringify(info);
});
var remoteCouch = false;
// var remoteCouch = 'http://localhost:5984/bluebird'
// http://127.0.0.1:5984/_utils/#

// 🐦 If remoteCouch defined sync
if (remoteCouch) {
  sync();
}


// 👇 SETUP SYNC 👇 
// 🐦 sync - replicate to or from remote DB to local
function sync() {
  syncDom.setAttribute('data-sync-state', 'syncing');
  var opts = {
    live: true
  };
  db.replicate.to(remoteCouch, opts, syncError);
  db.replicate.from(remoteCouch, opts, syncError);
}

var syncDom = document.getElementById('sync-wrapper');

// There was some form or error syncing
function syncError() {
  syncDom.setAttribute('data-sync-state', 'error');
}



// 🐦  If new changes made to DB, display
db.changes({
  since: 'now',
  live: true
}).on('change', showPayload);


// 👇 SAVE TO DB 👇 
// 🐦 addPayload - adds incoming data from BLE Device to PouchDB
// called in handleChangedValue()
function addPayload(data) {
  // bluebirdPayload - doc/row in DB
  var bluebirdPayload = {
    _id: new Date().toISOString(),
    title: data,
  };

  db.put(bluebirdPayload, function callback(err, result) {
    if (!err) {
      console.log('Successfully added payload to DB!');
      document.getElementById('display').innerHTML = 'Successfully added payload to DB: ' + JSON.stringify(bluebirdPayload);
    }
  });
}


// 🐦 showPayload - Shows Payload
// For now shows the payload via Console
// Comment console.log if it's distracting
function showPayload() {
  db.allDocs({
    include_docs: true,
    descending: true
  }, function (err, doc) {
    console.log(doc.rows)
  });
}


// 👇 BLUETOOTH 👇 
// BlueTooth
var deviceName = "BlueBird";
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
    filters: [{
      name: deviceName,
    }, ],
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
      console.log("Reading Bird Data...");
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

function handleChangedValue(event) {

  let value = event.target.value;

  let payload = Decodeuint8arr(value);

  //  🐦 save to DB
  addPayload(payload);
  document.getElementById("bird-payload").innerHTML = payload;

  console.log(payload);
}

function send(data) {
  data = String(data); {
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