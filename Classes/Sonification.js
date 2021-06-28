var DataManager = require('./DataManager.js');
var GUI = require('./GUI.js');



var dataManager;
var webAudioConfig;

var gui = new GUI({
  variableRowContainer: "#variables",
  canvas: "#visual-output canvas",
  scrub: "#scrub",
  duration: "#duration",
  reverseBtn: "#reverseBtn",
  playBtn: "#playBtn",
  stopBtn: "#stopBtn",
  newBtn: "#newBtn",
  openBtn: "#openBtn",
  saveBtn: "#saveBtn",
  shareBtn: "#shareBtn",
  statisticsBtn: "#statisticsBtn",
  displayModeBtn: "#displayModeBtn",
  loadBtn: "#data-input-container .loadBtn",
  closeBtn: ".data-container .closeBtn",
  dataInputContainer: "#data-input-container",
  dataOutputContainer: "#data-output-container"
});


webAudioXML.addEventListener("inited", e => {
  let dataManager = new DataManager("data.csv", webAudioXML, gui);
  dataManager.addEventListener("inited", e => {
    // init settings
    let inited = dataManager.initFromURL();
    if(!inited) {
      dataManager.initFromFile("configuration.json");
      console.log("initFromFile()");
    }
  });
});
