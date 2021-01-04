var FileManager = require('./FileManager.js');
var DataManager = require('./DataManager.js');
var GUI = require('./GUI.js');



var dataManager;
var webAudioConfig;
var fileManager = new FileManager();
var gui = new GUI({
  variableRowContainer: "#variables",
  canvas: "#visual-output canvas",
  scrub: "#scrub",
  duration: "#duration",
  reverseBtn: "#reverseBtn",
  playBtn: "#playBtn",
  stopBtn: "#stopBtn",
  openBtn: "#openBtn",
  saveBtn: "#saveBtn",
  loadBtn: "#data-input-container .loadBtn",
  closeBtn: ".data-container .closeBtn",
  dataInputContainer: "#data-input-container",
  dataOutputContainer: "#data-output-container"
});


webAudioXML.addEventListener("inited", e => {
  let dm = new DataManager("data.csv", webAudioXML, gui);
  dm.addEventListener("inited", e => {
    // init settings
    fileManager.getFile("configuration.json", json => dm.setAllData(json));
  });
});
