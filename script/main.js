(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
class AudioParameterMapping {

  constructor(varObj, paramObj, data = {}){
    this.variable = varObj;
    this._audioParameter = paramObj;
    this.init(varObj, paramObj, data);
  }

  init(varObj, paramObj, data){
    if(typeof data.id != "undefined"){
      // auto increase counter if initing from stored data
      AudioParameterMapping.cnt = Math.max(AudioParameterMapping.cnt, parseInt(data.id));
    }
    this.id = AudioParameterMapping.cnt++;
    this.state = typeof data.state == "undefined" ? true : data.state;
    this.invert = typeof data.invert == "undefined" ? false : data.invert;
    this.inputRange = this.variable.max - this.variable.min;

    if(typeof data.relInputLow != "undefined"){
      // use relInputLow and relInputHigh to set inputLow and inputHigh
      this.relInputLow = Math.max(0, data.relInputLow);
      this.relInputHigh= Math.min(1, data.relInputHigh);

      this.inputLow = this.variable.min + this.relInputLow * this.inputRange;
      this.inputHigh = this.variable.min + this.relInputHigh * this.inputRange;
    } else {
      // use inputLow and inputHigh to set relInputLow and relInputHigh
      this.inputLow = typeof data.inputLow == "undefined" ? varObj.min : data.inputLow;
      this.inputHigh = typeof data.inputHigh == "undefined" ? varObj.max : data.inputHigh;

      this.relInputLow = (this.inputLow - this.variable.min) / this.inputRange;
      this.relInputHigh= (this.inputHigh - this.variable.min) / this.inputRange;
      this.relInputLow = Math.max(0, this.relInputLow);
      this.relInputHigh= Math.min(1, this.relInputHigh);
    }

    this.outputLow = typeof data.outputLow == "undefined" ? paramObj.min : data.outputLow;
    this.outputHigh = typeof data.outputHigh == "undefined" ? paramObj.max : data.outputHigh;

    this.outputRange = paramObj.max - paramObj.min;
    this.relOutputLow = Math.pow((this.outputLow - paramObj.min) / this.outputRange, 1/paramObj.conv);
    this.relOutputHigh= Math.pow((this.outputHigh - paramObj.min) / this.outputRange, 1/paramObj.conv);
  }

  update(data){
    if(!data){return}

    Object.entries(data).forEach(entry => {

      let key = entry[0];
      let value = entry[1];

      switch (key) {
        case "variable":
        // update mins and maxs
        let newVarObj = value;
        this.inputRange = newVarObj.max - newVarObj.min;
        this.inputLow = this.relInputLow * this.inputRange + newVarObj.min;
        this.inputHigh = this.relInputHigh * this.inputRange + newVarObj.min;
        this.inputLow = Math.max(newVarObj.min, this.inputLow);
        this.inputHigh = Math.min(newVarObj.max, this.inputHigh);
        break;

        case "inputLow":
        this.relInputLow = (value - this.variable.min) / this.inputRange;
        this.relInputLow = Math.max(0, this.relInputLow);
        break;

        case "inputHigh":
        this.relInputHigh = (value - this.variable.min) / this.inputRange;
        this.relInputHigh = Math.min(1, this.relInputHigh);
        break;

        case "outputLow":
        this.relOutputLow = Math.pow((value - this.audioParameter.min) / this.outputRange, 1/this.audioParameter.conv);

        break;

        case "outputHigh":
        this.relOutputHigh= Math.pow((value - this.audioParameter.min) / this.outputRange, 1/this.audioParameter.conv);
        break;

        default:

      }
      this[key] = value;
    });

    if(!this.state){
      // reset all parameters when disabled
      this.audioParameter.target.setValueAtTime(this.audioParameter.target.defaultValue, 0);
    }
  }



  mapValue(x){
    x = Math.max(this.inputLow, x);
    x = Math.min(this.inputHigh, x);
    let curRange = this.inputHigh - this.inputLow;
    let relInput = (x - this.inputLow) / curRange;
    // invert if specified
    relInput = this.invert ? 1 - relInput : relInput;
    // do math for exp, bellcurve, etc
    relInput = Math.pow(relInput, this.audioParameter.conv);

    let output = relInput * (this.outputHigh - this.outputLow) + this.outputLow;

    return output;
  }

  set audioParameter(paramObj){
    this._audioParameter = paramObj;

    this.outputRange = paramObj.max - paramObj.min;
    this.outputLow = Math.pow(this.relOutputLow, this.audioParameter.conv) * this.outputRange + paramObj.min;
    this.outputHigh = Math.pow(this.relOutputHigh, this.audioParameter.conv) * this.outputRange + paramObj.min;

  }
  get audioParameter(){
    return this._audioParameter;
  }

  get state(){
    return this._state;
  }

  set state(newState){
    this._state = newState;
  }

  get data(){
    return {
      parameterID: this.audioParameter.id,
      inputLow: this.inputLow,
      inputHigh: this.inputHigh,
      outputLow: this.outputLow,
      outputHigh: this.outputHigh,
      relInputLow: this.relInputLow,
      relInputHigh: this.relInputHigh,
      invert: this.invert,
      state: this.state,
      id: this.id
    }
  }

  get inputLow(){
    return this._inputLow;
  }
  set inputLow(val){
    this._inputLow = parseFloat(val);
  }
  get inputHigh(){
    return this._inputHigh;
  }
  set inputHigh(val){
    this._inputHigh = parseFloat(val);
  }
  get outputLow(){
    return this._outputLow;
  }
  set outputLow(val){
    this._outputLow = parseFloat(val);
  }
  get outputHigh(){
    return this._outputHigh;
  }
  set outputHigh(val){
    this._outputHigh = parseFloat(val);
  }
  set invert(val){
    this._invert = val;
  }

  get invert(){
    return this._invert;
  }
}

AudioParameterMapping.cnt = 0;

module.exports = AudioParameterMapping;

},{}],2:[function(require,module,exports){
var Variable = require('./Variable.js');
var FileManager = require('./FileManager.js');
var AudioParameterMapping = require('./AudioParameterMapping.js');


class DataManager {

  constructor(src, waxml, gui){
    this._variables = [];
    this.audioConfig = waxml.structure;
    this._waxml = waxml;
    this.GUI = gui;
    this.GUI.dataManager = this;
    this._listeners = {};

    this.muteAllAudioObjects();
    this.audioConfig.audioObjects.forEach(audioObject => {
      if(audioObject.level == 2){
        audioObject.target.disconnect();
        // audioObject.target.gain = 0;
      }
    });

    this.mappings = [];
    this.animationIntervalTime = 10;

    this.audioMaster = this._waxml.master;
    this.audioMaster.gain = 0;
    this.dir = 1;
    this._variableID = 0;

    this.fileManager = new FileManager();
    this.statistics = [];

    if(src){
      this._data = this.parseData(src);
    }


    this.duration = this.GUI.duration;
  }


  parseData(src, callBack = ()=>{}){

    fetch(src)
      .then(response => response.text())
      .then(csv => {
        this._data = csv.split("\n").map(row => {
          let delimiter = row.includes(";") ? ";" : ",";
          let lastVal = 0;
          return row.split(delimiter).map(cell => {
            
            // fill with zeros until value is found
            // fill with last value if gap in data
            if(cell == ""){return lastVal}

            let floatVal = parseFloat(cell);

            // return column or row names if not a number
            if(isNaN(floatVal)){return cell}

            // update lastVal and return data number value if found
            lastVal = floatVal;
          	return floatVal;
          });
        });

        // clean data from empty rows
        let rowsToClear = [];
        this._data.forEach((row, i) => {
          if(row.length < 2){
            rowsToClear.push(i);
          }
        });
        while(rowsToClear.length){
          this._data.splice(rowsToClear.pop(), 1);
        }


        this._columnValues = this.firstRow.filter(entry => typeof entry == "number");
        if(!this._columnValues.length){
          // fill _columnValues with audio increased values
          let val = 0;
          while(this._columnValues.length < this.firstRow.length){
            this._columnValues.push(val++);
          }
        }
        callBack();
        this.dispatchEvent(new CustomEvent("inited"));
      });
  }

  set fileManager(fm){
    this._fileManager = fm;
  }

  get fileManager(){
    return this._fileManager;
  }

  get firstRow(){
    return this.getRow(0);
  }

  get firstColumn(){
    return this.getColumn(0);
  }

  get displayGroups(){
    let groups = [];
    let id = 1;
    while (groups.length < this._variables.length) {
      groups.push(id++);
    }
    return groups;
  }

  getRow(x){
    return x < this._data.length ? this._data[x] : [];
  }

  getColumn(x){
    let col = [];
    this._data.forEach(row => {
      col.push(row[x]);
    });
    return col;
  }

  getCell(x, y){
    return this._data[x][y];
  }

  getAllData(format = "json"){
    let data;
    switch (format) {
      case "json":
        data = {};
        data.version = 1;
        data.duration = this.duration;
        //data.table = this._data;
        //data.audioConfig = {};
        //data.audioConfig.xml = this.audioConfig.xml;
        data.variableMappings = this.getMappingData();
        return JSON.stringify(data, undefined, 4);
      break;

      case "xml":

      break;

      default:

    }
  }

  getSharedLink(){
    return window.location.origin + window.location.pathname + "?data=" + encodeURIComponent(JSONCrush(this.getAllData()));
  }

  initFromURL(){
    let indexOfQuery = window.location.hash.indexOf("?")+1;
    let queryString = window.location.hash.substr(indexOfQuery);
    let urlParams = new URLSearchParams(window.location.search);
    let dataStr = urlParams.get('data');
    if(!dataStr){return false}

    let decodedData = decodeURIComponent(dataStr);
    let json = JSONUncrush(decodedData);
    if(typeof json != "string"){return false}

    this.setAllData(json);
    return true;
  }

  initFromFile(file){
    this.fileManager.getFile(file, json => this.setAllData(json));
  }

  new(){
    let OK = true;
    if(this._variables.length){
      OK = confirm("Do you want to clear your current configuration?");
    }
    if(OK){

      while(this._variables.length){
        let varObj = this._variables.pop();
        varObj.mute();
        this.removeVariable(varObj.id)
      }

      this.GUI.clear();
      return true;
    } else {
      return false;
    }
  }

  setAllData(json){

    let data;
    try {
      data = JSON.parse(json);
    } catch(e) {
        console.warn(e);
        return;
    }

    let OK = this.new();
    if(OK){

      this.variableID = 0;
      this.duration = data.duration || 60;
      this.GUI.duration = this.duration;

      let id = 0;
      data.variableMappings.forEach(varData => {
        let varObj = this.setVariable(varData.id, varData.name, varData.rowID, varData);
        if(!varObj){return}

        this.setTargetAudioObject(varData.id, varData.audioObjectID);

        varData.mappings.forEach(mapping => {
          let paramObj = this.getParameter(mapping.parameterID);
          let mappingObj = this.setMapping(mapping.id, varObj, paramObj, mapping);
          varObj.mappings.push(mappingObj);

          this.statistics.push({
            varName: varObj.name,
            min: varObj.min,
            max: varObj.max,
            paramObj: paramObj.parent.path + paramObj.name,
            inputLow: mapping.inputLow,
            inputHigh: mapping.inputHigh,
            outputLow: mapping.outputLow,
            outputHigh: mapping.outputHigh,
            convert: paramObj.conv,
            invert: mapping.invert
          });
        });
      });
      this.GUI.initVariables(this._variables, {warnings: false});
    }

  }

  outputStatistics(){
    //if(!this.statistics.length){return ""}

    if(!this.statistics.length){return ""}
    
    // header
    let str = `<h2>Mappings:</h2><table>`;

    // colum names
    let row = this.statistics[0];
    str += `<tr>`;
    Object.keys(row).forEach(key => {
      str += `<td>${key}</td>`;
    });
    str += `</tr>`;

    this.statistics.forEach((item, i) => {

      str += "<tr>";
      Object.keys(item).forEach(key => {
        let val = item[key];
        if(typeof val == "number"){
          val = val.toString().replaceAll(".", ",");
        }
        str += `<td>${val}</td>`;
      });
      str += "</tr>";
    });

    str += "</table>";
    return str;
  }


  getMappingData(){
    let data = [];
    this._variables.forEach(variable => {
      let mappings = [];
      this.mappings.filter(mapping => mapping.variable == variable).forEach(mapping => {
        mappings.push(mapping.data);
      });
      if(mappings.length){
        let varObj = variable.data;
        varObj.mappings = mappings;
        data.push(varObj);
      }
    });
    return data;
  }

  get variableID(){
    return Variable.cnt;
  }

  set variableID(val){
    Variable.cnt = val;
  }

  setVariable(id, varName, rowID, varData){
    let values = this.getVariableData(parseFloat(rowID));
    if(!values.length){return}

    let varObj = this._variables.find(entry => entry.id == id);
    if(varObj){
      varObj.update(varName, {values: values, rowID: rowID});

      this.mappings.forEach(mapping => {
        mapping.update({variable: varObj});
      });

    } else {
      if(varData){
        varData.values = values;
        this.GUI.useColor(varData.color);
      } else {
        varData = {
          values: values,
          id: id,
          rowID: rowID,
          color: this.GUI.nextColor()
        }
      }
      varObj = new Variable(varName, varData, this._columnValues, this._waxml);
      this._variables.push(varObj);
    }

    return varObj;
  }

  setGain(id, vol, updateGUI = true){
    let varObj = this._variables.find(entry => entry.id == id);
    varObj.gain = vol;
    if(updateGUI){this.GUI.setGain(id, vol)}
  }

  setPan(id, pan, updateGUI = true){
    let varObj = this._variables.find(entry => entry.id == id);
    varObj.pan = pan;
    if(updateGUI){this.GUI.setPan(id, pan)}
  }

  getVariable(id){
    return this._variables.find(varObj => varObj.id == id);
  }

  setVariableState(id, state, updateGUI = true){
    this.getVariable(id).state = state;
    if(updateGUI){this.GUI.setVariableState(id, state)}
  }

  getVariableData(id){
    return this.getRow(id+1).filter(val => typeof val == "number");
  }

  get activeVariables(){
    return this._variables.filter(varObj => varObj.state == true);
  }

  getParameter(id){
    return this.audioConfig.parameters.find(param => param.id == id);
  }

  getAudioObject(id){
    return this.audioConfig.audioObjects.find(obj => obj.id == id);
  }

  setTargetAudioObject(varID, audioObjID){
    let varObj = this.getVariable(varID);
    varObj.mute();

    this.removeMappings(varID);
    varObj.targetAudioObject = this.getAudioObject(audioObjID);
    return varObj;
  }


  setMapping(id, varObj, paramObj, data){
    if(typeof varObj != "object"){varObj = this.getVariable(varObj)}
    if(typeof paramObj != "object"){paramObj = this.getParameter(paramObj)}

    let mapping = this.mappings.find(mapping => mapping.id == id);
    if(mapping){
      mapping.audioParameter = paramObj;

    } else {
      mapping = new AudioParameterMapping(varObj, paramObj, data);
      this.mappings.push(mapping);
    }
    if(data){
      mapping.update(data);
    }
    return mapping;
  }

  updateMapping(id, data, updateGUI = true){
    let mapping = this.mappings.find(mapping => mapping.id == id);
    if(!mapping){return}
    mapping.update(data);

    if(updateGUI){this.GUI.updateMapping(id, data)}
    //this.replay({mute:false});
  }

  removeMapping(id){
    let targetIndex;
    this.mappings.forEach((item, i) => {
      if(item.id == id){targetIndex = i}
    });
    if(typeof targetIndex !== "undefined"){
      let mapping = this.mappings.splice(targetIndex, 1).pop();
      mapping.audioParameter.target.setValueAtTime(mapping.audioParameter.target.defaultValue, 0); //mapping.audioParameter.default, 0);
      //this.replay();
    }
  }

  removeMappings(id){
    let targetIDs = [];
    this.mappings.forEach((item, i) => {
      if(item.variable.id == id){targetIDs.push(i)}
    });
    targetIDs.reverse().forEach((item, i) => {
      this.mappings.splice(item, 1);
    });
  }

  removeVariable(id){
    let targetIDs = [];
    this._variables.forEach((item, i) => {
      if(item.id == id){
        item.mute();
        item.disconnect();
        targetIDs.push(i)
      }
    });
    targetIDs.reverse().forEach((item, i) => {
      this._variables.splice(item, 1);
    });
    this.removeMappings(id);
  }

  get data(){
    return this._data;
  }

  pos2Time(pos){
    return pos * this.duration;
  }

  col2Time(colID){
    return colID / this._columnValues.length * this.duration;
    if(this.dir == 1){
      return colID / this._columnValues.length * this.duration;
    } else {
      return 1 - (colID / this._columnValues.length) * this.duration;
    }

  }

  replay(data = {}){
    data.mute = typeof data.mute == "undefined" ? true: data.mute;
    if(this.animationTimeout){
      this.stopPlayback(data);
      this.play(data);
    }
  }

  set duration(val){
    this._duration = parseFloat(val);
    this._duration = Math.max(1, val);
    this.replay();
  }

  get duration(){
    return this._duration;
  }

  muteAllAudioObjects(){
    this.audioConfig.audioObjects.forEach(audioObject => {
      // if(audioObject.level == 2){audioObject.target.gain = 0}
    });
  }



  play(data = {}){
    data.dir = data.dir || this.dir;
    data.mute = typeof data.mute == "undefined" ? true: data.mute;
    if(data.dir != this.dir){
      //this.stopPlayback(data);
      this.dir = data.dir;
    }

    if(this.animationTimeout){return}

    if(data.mute){this.audioMaster.gain = 1}
    this._waxml.start();
    this.mappings.filter(mapping => mapping.variable.state).forEach(mapping => {
      mapping.variable.unMute();
    });

    if(this.GUI.scrubValue >= 1 && this.dir == 1){this.GUI.scrubValue = 0}
    if(this.GUI.scrubValue <= 0 && this.dir == -1){this.GUI.scrubValue = 1}
    this.pos = this.GUI.scrubValue;
    // let relPos = this.GUI.scrubValue * this._columnValues.length;

    //let offsetPos = (relPos % this._columnValues.length) / this._columnValues.length
    // this.pos = this.GUI.scrubValue; // Math.floor(relPos) / this._columnValues.length;
    // if(this.pos >= 1 && this.dir == 1){this.pos = 0}
    // if(this.pos <= 0 && this.dir == -1){this.pos = 1}

    // let currentTime = this.pos2Time(this.pos);
    // let timePerColumn = this.duration / this._columnValues.length;
    // let nextColumnID = Math.ceil(this._columnValues.length * this.pos);
    // //let offsetTime = offsetPos * timePerColumn;
    //
    // let mappings = this.mappings.filter(mapping => mapping.variable.state && mapping.state);
    // mappings.forEach(mapping => {
    //   mapping.variable.unMute();
    //   let values;
    //   if(this.dir == 1){
    //     values = mapping.variable.values.filter((item, i) => i >= nextColumnID);
    //   } else {
    //     values = mapping.variable.values.filter((item, i) => i <= nextColumnID);
    //     values = values.reverse();
    //   }
    //
    //   values.forEach((item, i) => {
    //     let delay = this.col2Time(i); // + timePerColumn - offsetTime; // - currentTime;
    //     let fadeTime = i ? timePerColumn / 2 : 0.001; // see https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime
    //     let startTime = Math.max(0, delay - fadeTime);
    //     let val = item.val;
    //     let output = mapping.mapValue(val);
    //     //console.log(startTime, fadeTime, val, output);
    //     mapping.audioParameter.parent.setTargetAtTime(mapping.audioParameter.name, output, startTime, fadeTime);
    //     //mapping.audioParameter.target.setTargetAtTime(output, this._waxml._ctx.currentTime + startTime, fadeTime);
    //   });
    // });

    // animate position
    this.animationTimeout = setInterval(e => {
      this.pos += (1 / (this.duration * 1000 / this.animationIntervalTime)) * this.dir;
      this.GUI.scrubValue = this.pos;

      if((this.pos >= 1 && this.dir == 1) || (this.pos <= 0 && this.dir == -1)){
        this.stopPlayback();
      } else {
        this.scrub();
      }
    }, this.animationIntervalTime);

  }

  stopPlayback(data = {}){
    data.mute = typeof data.mute == "undefined" ? true: data.mute;
    this._waxml.stop();
    if(data.mute){this.audioMaster.gain = 0}
    if(this.animationTimeout){

      clearInterval(this.animationTimeout);
      this.animationTimeout = 0;

      this.muteAllAudioObjects();
      this.mappings.forEach(mapping => mapping.audioParameter.target.cancelScheduledValues(0));
    }
  }

  stop(){
    if(this.animationTimeout){
      this.stopPlayback();
    } else {
      this.pos = 0;
      this.GUI.scrubValue = this.pos;
    }
  }

  scrub(e){
    if(e){this.pos = parseFloat(e.target.value)}
    this.mappings.filter(mapping => mapping.variable.state && mapping.state).forEach(mapping => {
      let val = mapping.variable.relX2val(this.pos);
      let output = mapping.mapValue(val);
      mapping.audioParameter.target.setTargetAtTime(mapping.audioParameter.name, output, 0, 0.001);

      //mapping.audioParameter.target.setTargetAtTime(output, 0, 0.01);
    });
  }
  startScrub(){
    this.stopPlayback();
    this.audioMaster.gain = 1;
    this._waxml.start();
    this.mappings.filter(mapping => mapping.variable.state).forEach(mapping => {
      mapping.variable.unMute();
    });
  }

  updateParameters(y){

  }

  set GUI(gui){
    this._gui = gui;
  }

  get GUI(){
    return this._gui;
  }


	addEventListener(name, fn){
		if(typeof name !== "string"){return}
		if(typeof fn !== "function"){return}
		this._listeners[name] = this._listeners[name] || [];
		this._listeners[name].push(fn);
	}

	dispatchEvent(e){
		this._listeners[e.type] = this._listeners[e.type] || [];
		this._listeners[e.type].forEach(fn => fn(e));
	}
}


module.exports = DataManager;

},{"./AudioParameterMapping.js":1,"./FileManager.js":3,"./Variable.js":6}],3:[function(require,module,exports){


class FileManager {

  constructor(){

  }

  save(){
    const fileHandle = this.getPath();
  }

  open(){
    // const fileHandle = this.getPath();
    // this.file = await fileHandle.getFile();
    // let contents = await file.text();
    // textArea.value = contents;
  }

  getPath(){
    // let path = async () => {
    //   // Destructure the one-element array.
    //   [fileHandle] = await window.showOpenFilePicker();
    //   // Do something with the file handle.
    //   return fileHandle;
    // };
  }

  getFile(src, fn){
    fetch(src)
    .then(response => response.text())
    .then(json => fn(json));
  }

}


module.exports = FileManager;

},{}],4:[function(require,module,exports){
var VisualDisplay = require('./VisualDisplay.js');

class GUI {

  constructor(selectors = {}){

    this._colors = ["#D4E09B", "#F6F4D2", "#F19C79", "#A44A3F", "#B75E38", "#819B25", "#AAAD9B", "#3FB4A6", "#7CECDD"];

    window.onbeforeunload = () => {
      return 'Are you sure you want to leave?';
    };

    this._elements = {};


    Object.keys(selectors).forEach(key => {
      let target = document.querySelectorAll(selectors[key]);
      if(target.length < 2){target = document.querySelector(selectors[key])}
      this._elements[key] = target;
    });

    // VisualDisplay
    if(this._elements.canvas){
      this.visualDisplay = new VisualDisplay(this._elements.canvas);
    }


    let row = document.createElement("div");
    row.classList.add("variableContainer");
    row.classList.add("lastVariableRow");
    this._elements.lastVariableRow = row;
    this._elements.variableRowContainer.appendChild(row);

    this.addButton({
      target: row,
      label: "Add Data Source",
      fn: e => this.addVariableRow(),
      class: ["addBtn"]
    });

    // ScrubSlider
    if(this._elements.scrub){
      this._elements.scrub.addEventListener("input", e => {
        this._dataManager.scrub(e);
      });
      this._elements.scrub.addEventListener("pointerdown", e => {
        this._dataManager.startScrub(e);
      });
      this._elements.scrub.addEventListener("pointerup", e => {
        this._dataManager.stopPlayback();
      });
    }


    // Duration input
    if(this._elements.duration){
      this._elements.duration.addEventListener("input", e => {
        this._dataManager.duration = e.target.value;
      });
    }

    if(this._elements.reverseBtn){
      this._elements.reverseBtn.addEventListener("click", e => {
        this._dataManager.play({dir:-1});
      });
    }
    if(this._elements.playBtn){
      this._elements.playBtn.addEventListener("click", e => {
        this._dataManager.play({dir:1});
      });
    }

    if(this._elements.stopBtn){
      this._elements.stopBtn.addEventListener("click", e => {
        this._dataManager.stop();
      });
    }

    if(this._elements.newBtn){
      this._elements.newBtn.addEventListener("click", e => {
        this._dataManager.new();
      });
    }

    if(this._elements.openBtn){
      this._elements.openBtn.addEventListener("click", e => {
        this._elements.dataInputContainer.style.display = "block";
        this._elements.dataInputContainer.querySelector("textarea").value = "Paste your configuration data here..."
        //fileManager.open();
      });
    }

    if(this._elements.loadBtn){
      this._elements.loadBtn.addEventListener("click", e => {
        this._dataManager.setAllData(this._elements.dataInputContainer.querySelector("textarea").value);
        this._elements.dataInputContainer.style.display = "none";
      });
    }

    if(this._elements.saveBtn){
      this._elements.saveBtn.addEventListener("click", e => {
        let outputContainer = this._elements.dataOutputContainer;
        let outputText = outputContainer.querySelector("#outputText");
        outputText.value = this._dataManager.getAllData();
        outputContainer.style.display = "block";

        /* Select the text field */
        outputText.select();
        outputText.setSelectionRange(0, 99999); /* For mobile devices */

        /* Copy the text inside the text field */
        document.execCommand("copy");
        outputContainer.style.display = "none";

        /* Alert the copied text */
        alert("Configuration data copied to clipboard");

      });
    }

    if(this._elements.shareBtn){
      this._elements.shareBtn.addEventListener("click", e => {

          let url = this._dataManager.getSharedLink();

          if (navigator.share) {
            navigator.share({
              title: 'WebAudioXML Sonification Toolkit',
              url: url
            }).then(() => {
              console.log('Thanks for sharing!');
            })
            .catch(console.error);
          } else {
            // fallback
            let outputContainer = this._elements.dataOutputContainer;
            let outputText = outputContainer.querySelector("#outputText");
            outputText.value = url;
            outputContainer.style.display = "block";

            /* Select the text field */
            outputText.select();
            outputText.setSelectionRange(0, 99999); /* For mobile devices */

            /* Copy the text inside the text field */
            document.execCommand("copy");
            outputContainer.style.display = "none";

            /* Alert the copied text */
            alert("Configuration URL copied to clipboard");
          }


        
      });
    }

    if(this._elements.statisticsBtn){
      this._elements.statisticsBtn.addEventListener("click", e => {
        this._elements.dataOutputContainer.querySelector("#outputText").innerHTML = this._dataManager.outputStatistics();
        this._elements.dataOutputContainer.style.display = "block";
      });
    }



    if(this._elements.closeBtn){
      this._elements.closeBtn.forEach(el => {
        el.addEventListener("click", e => {
          e.target.parentNode.style.display = "none";
        });
      });
    }

    if(this._elements.displayModeBtn){
      this._elements.displayModeBtn.addEventListener("click", e => {
          this.visualDisplay.switchMode();
      });
    }

    document.body.addEventListener("click", e => {
      document.querySelectorAll(".menu ul.open").forEach(el => {
        el.classList.remove("open");
      });
    });
   
    
  }

  set dataManager(dm){
    this._dataManager = dm;
  }

  clear(){
    while(this._elements.variableRowContainer.children.length > 1){
      this._elements.variableRowContainer.removeChild(this._elements.variableRowContainer.firstChild);
    }
    this._visualDisplay.draw([]);
  }

  initVariables(variables, options = {}){

    this.clear();

    variables.forEach(varObj => {
      let row = this.addVariableRow(varObj, options);
      this.selectVariable(row, varObj, options);
    });
  }

  selectVariable(varRow, varObj, options){

    varRow.style.backgroundColor = varObj.color;
    varRow.classList.add("isset");
    this._elements.lastVariableRow.style.display = "block";

    let menu = varRow.querySelector(".variable .variableSelector");
    menu.querySelector("li > a").innerHTML =  varObj.name;

    // active checkbox
    this.setVariableState(varRow, varObj.state);

    // audio object
    if(!varRow.classList.contains("hasAudioObject")){
      this.selectAudioObject(varRow, varObj, options);
    }

    // update parameters
    let parameterRows = varRow.querySelectorAll(".parameter");
    if(parameterRows.length){
      parameterRows.forEach((parameterRow, i) => {
        parameterRow.querySelectorAll(".input.multiSlider").forEach(el => {
          el.parentNode.removeChild(el);
        });

        let nextSibling = parameterRow.querySelector(".output.multiSlider");
        let sliderData = {
          min: varObj.min,
          max: varObj.max,
          valueLow: varObj.mappings[i].inputLow,
          valueHigh: varObj.mappings[i].inputHigh,
          class: "input"
        }

        this.addSlider(nextSibling,
          sliderData,
          values => {
            this._dataManager.updateMapping(parameterRow.dataset.mappingId, {
              inputLow: values[0],
              inputHigh: values[1]
            }, false);
          }
        );
      });
    } else {

      // add new parameter rows
      let parameters = varRow.querySelector(".parameters");
      let mappingRowID = 0;
      varObj.mappings.forEach(mappingObj => {
        let paramObj = this._dataManager.getParameter(mappingObj.parameterID);
        let paramRow = this.addParameterRow(parameters, varObj, mappingObj);
        this.selectParameter(paramRow, varObj, paramObj, mappingObj);
        //this.updateMapping(mappingRowID++, mappingObj);
      });

    }

    this.draw();

  }


  setVariableState(varRow, state){
    if(typeof varRow == "string"){
      // if called from dataManager
      varRow = this.getVariableRow(varRow);
    }
    state = state == false ? false : true;
    varRow.style.opacity = state ? 1 : 0.5;
    if(state){
      varRow.classList.remove("inactive");
    } else {
      varRow.classList.add("inactive");
    }
    varRow.querySelector(".state").checked = state;
    this.draw();
  }

  setGain(id, vol){
    let row = this.getVariableRow(id);
    let volumeSlider = row.querySelector(".volumeSlider");
    volumeSlider.value = Math.pow(vol, 1/2);
  }

  setPan(id, pan){
    let row = this.getVariableRow(id);
    let panSlider = row.querySelector(".panSlider");
    panSlider.value = pan;
  }

  updateMapping(id, mappingObj){
    let row = this.getMappingRow(id);

    if(typeof mappingObj.invert != "undefined"){
      row.querySelector(".invertCheckBox").checked = mappingObj.invert;
    }

    if(typeof mappingObj.state != "undefined"){
      row.style.opacity = mappingObj.state ? 1 : 0.5;
      row.querySelector(".stateCheckBox").checked = mappingObj.state;
    }

    let multiSliderInput = row.querySelector(".multiSlider.input");
    let minInput = multiSliderInput.querySelector("input.min");
    let maxInput = multiSliderInput.querySelector("input.max");
    let multiRangeInput = multiSliderInput.querySelector(".input.multirange.original");

    if(typeof mappingObj.inputLow != "undefined"){
      multiRangeInput.setAttribute("valueLow",mappingObj.inputLow);
      minInput.value = mappingObj.inputLow;
    }
    if(typeof mappingObj.inputHigh != "undefined"){
      multiRangeInput.setAttribute("valueHigh",mappingObj.inputHigh);
      maxInput.value = mappingObj.inputHigh;
    }

    let multiSliderOutput = row.querySelector(".multiSlider.output");
    let minOutput = multiSliderOutput.querySelector("input.min");
    let maxOutput = multiSliderOutput.querySelector("input.max");
    let multiRangeOutput = multiSliderOutput.querySelector(".output.multirange.original");
    if(mappingObj.audioParameter){
      if(typeof mappingObj.audioParameter.min != "undefined"){
        multiRangeInput.min = mappingObj.audioParameter.min;
      }
      if(typeof mappingObj.audioParameter.max != "undefined"){
        multiRangeInput.min = mappingObj.audioParameter.max;
      }
    }
    if(typeof mappingObj.outputLow != "undefined"){
      multiRangeInput.setAttribute("valueLow",mappingObj.outputLow);
      minOutput.value = mappingObj.outputLow;
    }
    if(typeof mappingObj.outputHigh != "undefined"){
      multiRangeInput.setAttribute("valueHigh",mappingObj.outputHigh);
      minOutput.value = mappingObj.outputHigh;
    }
  }

  getMappingRow(id){
    return this._elements.variableRowContainer.querySelector(`.parameter[data-mapping-id='${id}']`);
  }

  getVariableRow(id){
    return this._elements.variableRowContainer.querySelector(`.variableContainer[data-id='${id}']`);
  }

  addVariableRow(varObj, options){

    let row = document.createElement("div");


    // hide "add variable button temporarily"
    this._elements.lastVariableRow.style.display = "none";

    // container for variable menu and all parameters
    row.classList.add("variableContainer");
    row.dataset.id = varObj ? varObj.id : this._dataManager.variableID;

    this._elements.variableRowContainer.insertBefore(row, this._elements.lastVariableRow);

    let variable = document.createElement("div");
    variable.classList.add("variable");
    row.appendChild(variable);
    let firstColumn = this._dataManager.firstColumn;
    firstColumn.shift();

    let variableSelector = this.addMenu(variable, [{name: "Select Data Source", children: firstColumn}], (e) => {
      let variableRow = e.target.closest(".variableContainer");
      let varObj = this._dataManager.setVariable(variableRow.dataset.id, e.target.dataset.value, e.target.dataset.index);
      this.selectVariable(variableRow, varObj);
    });
    variableSelector.classList.add("variableSelector");

    let checkbox = document.createElement("input");
    variable.appendChild(checkbox);
    checkbox.setAttribute("type", "checkbox");
    checkbox.checked = varObj ? varObj.state : true;
    checkbox.classList.add("state");

    checkbox.addEventListener("click", e => {
      let varRow = e.target.closest(".variableContainer");
      this._dataManager.setVariableState(varRow.dataset.id, e.target.checked);
    });

    let audioObjectMenu = this.addMenu(variable, [this._dataManager.audioConfig.tree], (e) => {
      let varRow = e.target.closest(".variableContainer");
      let varObj = this._dataManager.setTargetAudioObject(varRow.dataset.id, e.target.dataset.target);

      this.selectAudioObject(varRow, varObj);
    }, "Select Audio Object", [2]);
    audioObjectMenu.classList.add("audioObjectSelector");

    let volumeLabel = document.createElement("span");
    volumeLabel.innerHTML = "Volume:";
    volumeLabel.classList.add("volumeLabel");
    variable.appendChild(volumeLabel);

    let volumeSlider = document.createElement("input");
    volumeSlider.setAttribute("type", "range");
    volumeSlider.setAttribute("min", 0);
    volumeSlider.setAttribute("max", 1);
    volumeSlider.setAttribute("step", 1/100);
    volumeSlider.setAttribute("value", varObj ? Math.pow(varObj.gain, 1/2) : 0.5);
    volumeSlider.classList.add("volumeSlider");
    volumeSlider.addEventListener("input", e => {
      let varRow = e.target.closest(".variableContainer");
      this._dataManager.setGain(varRow.dataset.id, Math.pow(e.target.value, 2), false);
    });
    variable.appendChild(volumeSlider);
    //this.addMenu(variable, [{name: "Display group", children: this._dataManager.displayGroups}], (e) => this.selectVariable(e));


    let panLabel = document.createElement("span");
    panLabel.innerHTML = "Pan:";
    panLabel.classList.add("panLabel");
    variable.appendChild(panLabel);

    let panSlider = document.createElement("input");
    panSlider.setAttribute("type", "range");
    panSlider.setAttribute("min", -5);
    panSlider.setAttribute("max", 5);
    panSlider.setAttribute("step", 1/10);
    panSlider.setAttribute("value", varObj ? varObj.pan : 0);
    panSlider.classList.add("panSlider");
    panSlider.addEventListener("input", e => {
      let varRow = e.target.closest(".variableContainer");
      this._dataManager.setPan(varRow.dataset.id, e.target.value, false);
    });
    variable.appendChild(panSlider);
    //this.addMenu(variable, [{name: "Display group", children: this._dataManager.displayGroups}], (e) => this.selectVariable(e));






    this.addButton({
      target: variable,
      label: "X",
      fn: e => this.removeVariable(row),
      class: ["removeBtn"]
    });

    let parameters = document.createElement("div");
    parameters.classList.add("parameters");
    row.appendChild(parameters);

    this.addButton({
      target: row,
      label: "Add Parameter",
      fn: e => {
        let varObj = this._dataManager.getVariable(row.dataset.id) || {};
        this.addParameterRow(parameters, varObj)
      },
      class: ["addBtn", "param"]
    });

    if(varObj){
      row.style.backgroundColor = varObj.color;
      this.selectVariable(row, varObj, options);
    }
    return row;
  }


  addParameterRow(parent, varObj, mappingObj){
    let row = document.createElement("div");
    row.classList.add("parameter");
    if(mappingObj){
      row.classList.add("isset");
    }

    //this._dataManager.audioConfig.tree.name = "Select Parameter";
    let targetVariables = varObj.targetAudioObject.children.filter(child => child.type == "var");

    // let parameterMenu = this.addMenu(row, [varObj.targetAudioObject], (e) => {
    let parameterMenu = this.addMenu(row, [{children:targetVariables}], (e) => {
      let row = e.target.closest(".parameter");
      let paramObj = this._dataManager.getParameter(e.target.dataset.target);

      let mappingObj = this._dataManager.setMapping(row.dataset.mappingId, varObj.id, paramObj.id);
      this.selectParameter(row, varObj, paramObj, mappingObj);

    }, "Select Parameter");

    parameterMenu.classList.add("parameterSelect");
    parent.appendChild(row);

    // parameter active switch
    let checkbox = document.createElement("input");
    row.appendChild(checkbox);
    checkbox.setAttribute("type", "checkbox");
    checkbox.checked = mappingObj ? mappingObj.state : true;
    checkbox.classList.add("stateCheckBox");

    checkbox.addEventListener("click", e => {
      let row = e.target.closest(".parameter");
      this._dataManager.updateMapping(row.dataset.mappingId, {state: e.target.checked});
    });

    let menu = this.addMenu(row, GUI.curveTypes, e => {}, "Curve Type");
    menu.classList.add("curveType");


    // variable input
    let min = varObj.min || 0;
    let max = varObj.max || 100;
    let sliderData = {
      min: min,
      max: max,
      valueLow: mappingObj ? mappingObj.inputLow : min,
      valueHigh: mappingObj ? mappingObj.inputHigh : max,
      class: "input"
    };

    this.addSlider(menu,
      sliderData,
      values => {
        this._dataManager.updateMapping(row.dataset.mappingId, {
          inputLow: values[0],
          inputHigh: values[1]
        }, false);
      }
    );

    // audio parameter output
    // this.addSlider(menu, {min: 0, max: 100, class: "output"});


    checkbox = document.createElement("input");
    row.appendChild(checkbox);
    checkbox.setAttribute("type", "checkbox");
    checkbox.checked = false;
    checkbox.setAttribute("name", "invertCheckBox");
    checkbox.classList.add("invertCheckBox");

    checkbox.addEventListener("click", e => {
      let row = e.target.closest(".parameter");
      this._dataManager.updateMapping(row.dataset.mappingId, {
        invert: e.target.checked
      }, false);
    });

    let checkBoxLabel = document.createElement("label");
    checkBoxLabel.innerHTML = "Invert"
    checkBoxLabel.setAttribute("for", "invertCheckBox");
    row.appendChild(checkBoxLabel);

    let btn = this.addButton({
      target: row,
      label: "X",
      fn: e => this.removeParameterRow(row),
      class: ["removeBtn"]
    });

    return row;
  }

  removeParameterRow(row){
    if(confirm("Do you want to remove paramater?")){
      this._dataManager.removeMapping(row.dataset.mappingId);
      row.parentNode.removeChild(row);
    }
  }

  selectAudioObject(variableContainer, varObj, options = {}){

    if(!varObj.targetAudioObject){return}

    let parameterRow = variableContainer.querySelector(".parameters");

    let ok = options.warnings == false || !parameterRow.firstChild || confirm("Do you want to reset audio object? (including resetting parameters)");
    if(ok){

      while(parameterRow.firstChild) {
        // remove previous parameter rows
        parameterRow.removeChild(parameterRow.firstChild);
      }

      variableContainer.classList.add("hasAudioObject");
      let menu = variableContainer.querySelector(".audioObjectSelector");
      menu.querySelector("li > a").innerHTML = varObj.targetAudioObject.name; //e.target.dataset.value;

    }

  }


  selectParameter(row, varObj, paramObj, mappingObj){

    let menu = row.querySelector(".parameterSelect");
    let variableContainer = row.closest(".variableContainer");

    row.querySelectorAll(".output.multiSlider").forEach(el => {
      let nextSibling = el.nextSibling;
      el.parentNode.removeChild(el);
    });

    row.dataset.target = paramObj.id;
    row.classList.add("isset");

    //let parentMenuObject = e.target.closest(".parent").querySelector("a");
    //
    // if(!paramObj.parent){
    //   console.log(paramObj.parent);
    //   return;
    // }
    // menu.querySelector("li > a").innerHTML = `${paramObj.parent.name}.${paramObj.name}`;
    menu.querySelector("li > a").innerHTML = paramObj.label || paramObj.name;
    
    
    // `${parentMenuObject.innerHTML}.${e.target.innerHTML}`;
    //`${paramObj.parent._nodeType}.${paramObj.name}`;

    //e.target.innerHTML; //e.target.dataset.value;

    //let varObj = this._dataManager.getVariable(variableContainer.dataset.id);


    let mappingID;
    if(mappingObj){
      mappingID = mappingObj.id;
      row.dataset.mappingId = mappingID;
    }


    let invertCheckBox = row.querySelector(".invertCheckBox");
    if(mappingObj){
      invertCheckBox.checked = mappingObj.invert;
    }

    let sliderData = {
      // min: typeof varObj.min != "undefined" ? varObj.min : mappingObj.audioParameter.min,
      // max: typeof varObj.max != "undefined" ? varObj.max : mappingObj.audioParameter.max,
      min: mappingObj.audioParameter ? mappingObj.audioParameter.min : varObj.min,
      max: mappingObj.audioParameter ? mappingObj.audioParameter.max : varObj.max,
      valueLow: typeof mappingObj.outputLow != "undefined" ? mappingObj.outputLow : paramObj.min,
      valueHigh: typeof mappingObj.outputHigh != "undefined" ? mappingObj.outputHigh : paramObj.max,
      class: "output",
      conv: paramObj.conv
    }

    this.addSlider(invertCheckBox,
      sliderData,
      values => {
        this._dataManager.updateMapping(mappingID, {
          outputLow: values[0],
          outputHigh: values[1],
        }, false);
      }
    );


  }



  setAttributes(el, attr = {}){
      Object.entries(attr).forEach(entry => {
        el.setAttribute(entry[0], entry[1]);
      });
  }

  removeVariable(row){
    if(confirm("Do you want to remove variable? (including resetting parameters)")){
      this._dataManager.removeVariable(row.dataset.id);
      this._elements.variableRowContainer.removeChild(row);
      this.draw();
    }
  }


  addButton(data){
    if(!data.target){return}
    let btn = document.createElement("button");
    btn.innerHTML = data.label || "+";
    (data.class || ["btn"]).forEach((item, i) => btn.classList.add(item));

    data.target.appendChild(btn);
    btn.addEventListener("click", data.fn || (e => {}));
    return btn;
  }

  addSlider(sibling, attr = {}, fn = e => {}){
    attr.min = typeof attr.min != "undefined" ? attr.min : 0;
    attr.max = typeof attr.max != "undefined" ? attr.max : 100;
    attr.step = (attr.max - attr.min) / (attr.steps || 100);

    attr.valueLow = typeof attr.valueLow != "undefined" ? attr.valueLow : attr.min;
    attr.valueHigh = typeof attr.valueHigh != "undefined" ? attr.valueHigh :attr.max;

    let span = document.createElement("span");
    span.classList.add("multiSlider");
    if(attr.class){span.classList.add(attr.class)}
    sibling.parentNode.insertBefore(span, sibling);
    //span.innerHTML = label;

    let minInput = document.createElement("input");
    minInput.classList.add("min");
    minInput.value = attr.valueLow;
    span.appendChild(minInput);

    let el = document.createElement("input");
    attr.type = "range";
    this.setAttributes(el, attr);
    span.appendChild(el);
    multirange(el);

    // el.setAttribute("valueLow", attr.valueLow);
    // el.setAttribute("valueHigh", attr.valueHigh);
    // el.valueLow = attr.valueLow;
    // el.valueHigh = attr.valueHigh;

    el.valueLow = this.sliderValueConversion(el, attr.valueLow);
    el.valueHigh = this.sliderValueConversion(el, attr.valueHigh);

    let getLowAndHigh = () => {
      return [el.valueLow, el.valueHigh].map(val => {
        let min = parseFloat(el.min);
        let max = parseFloat(el.max);
        let range = max - min;
        let x = (val - min) / range;
        let powVal = parseFloat(el.getAttribute("conv")) || 1;
        x = Math.pow(x, powVal);
        x = x * (max - min) + min;
        if(range>100){
          x = Math.round(x);
        } else if(range > 2){
          x = x.toFixed(1);
        } else {
          x = x.toFixed(3);
        }
        return x;
      });
    }


    el.addEventListener("input", e => {
      let val = getLowAndHigh();
      minInput.value = val[0];
      maxInput.value = val[1];
      fn(val);
    });
    el.nextSibling.addEventListener("input", e => {
      let val = getLowAndHigh();
      minInput.value = val[0];
      maxInput.value = val[1];
      fn(val);
    });

    let maxInput = document.createElement("input");
    maxInput.classList.add("max");
    maxInput.value = attr.valueHigh;
    span.appendChild(maxInput);

    minInput.addEventListener("change", e => {
      setLowAndHigh();
    });

    maxInput.addEventListener("change", e => {
      setLowAndHigh();
    });


    let setLowAndHigh = () => {
      let min = parseFloat(el.min);
      let max = parseFloat(el.max);
      let range = max - min;

      let valueLow = Math.min(parseFloat(minInput.value), parseFloat(maxInput.value));
      let valueHigh = Math.max(parseFloat(minInput.value), parseFloat(maxInput.value));
      valueLow = Math.max(min, valueLow);
      valueHigh = Math.min(max, valueHigh);
      minInput.value = valueLow;
      maxInput.value = valueHigh;

      let values = [valueLow, valueHigh];
      fn(values);
      values.map(val => {
        let min = parseFloat(el.min);
        let max = parseFloat(el.max);
        let range = max - min;
        let x = (val - min) / range;

        let powVal = parseFloat(el.getAttribute("conv")) || 1;
        x = Math.pow(x, 1/powVal);
        x = x * (max - min) + min;

        return x;
      });

      el.setAttribute("valueLow", values[0]);
      el.setAttribute("valueHigh", values[1]);
      el.valueLow = values[0];
      el.valueHigh = values[1];
    }

  }

  sliderValueConversion(el, val){
    let min = parseFloat(el.min);
    let max = parseFloat(el.max);
    let range = max - min;
    let x = (val - min) / range;
    let powVal = parseFloat(el.getAttribute("conv")) || 1;
    x = Math.pow(x, 1/powVal);
    x = x * (max - min) + min;
    return x;
  }


  addMenu(parent, options, fn, label, filter = []){

      // options is an single or multidimensional Array
      // if single, all values are treated as the labels
      // if multidimensional, each entry should be an object
      // {name: label, children: subMenu}
      let ul = document.createElement("ul");
      ul.classList.add("menu");
      parent.appendChild(ul);
      let level = 0;
      this.addOptions(ul, options, fn, label, level, filter);
      return ul;
  }

  addOptions(parent, options = [], fn, label, level, filter = []){

    let curOptions = [];
    let index = 0;
    options.forEach(option => {
      if(!option){
        console.log(option);
        return;
      }
      let includeOption = filter.length ? filter.filter(item => item == option.type || item == option.level || option.level == 1)[0] : true;
      if(level == 1 && option.target instanceof AudioParam){includeOption = false} // omit AudioParameter from top level AudioObjects

      if(includeOption){
        curOptions.push(option);
        let a = document.createElement("a");
        let name = option.label || option.name || option;
        a.innerHTML = level ? name : (label ? label : name); // top level can have specified label

        let li = document.createElement("li");
        parent.appendChild(li);
        li.appendChild(a);
        let parentLi = a.closest("li.parent");
        let parentValue;
        if(parentLi){
          parentValue = parentLi.querySelector("a").dataset.value;
        }
        a.dataset.value = (parentValue ? parentValue + " > " : "") + name;
        a.dataset.target = option.id;
        a.dataset.level = level;
        a.dataset.index = index++;

        let ul = document.createElement("ul");
        let childOptions = this.addOptions(ul, option.children, fn, label, level + 1, filter);

        if(childOptions.length){
          li.classList.add("parent");

          let span = document.createElement("span");
          span.classList.add("expand");
          span.innerHTML = "»";
          a.appendChild(span);

          ul.classList.add("child");
          li.appendChild(ul);

          a.addEventListener("click", e => {
            ul.classList.add("open");
            e.stopPropagation();
          });
          

        } else {
          a.href = "#";
          a.addEventListener("click", fn);
          a.addEventListener("click", e => {
            document.querySelectorAll(".menu ul.open").forEach(el => {
              el.classList.remove("open");
            });
          });
        }


      }
    });
    return curOptions;
  }


  set visualDisplay(vd){
    this._visualDisplay = vd;
  }

  get visualDisplay(){
    return this._visualDisplay;
  }

  draw(){
    this._visualDisplay.draw(this._dataManager.activeVariables);
  }


  set scrubValue(val){
    this._elements.scrub.value = val;
  }

  get scrubValue(){
    return parseFloat(this._elements.scrub.value);
  }

  get duration(){
    return parseFloat(this._elements.duration.value);
  }

  set duration(val){
    this._elements.duration.value = val;
    this._dataManager.duration = val;
  }

  get color(){
    return this._colors[0];
  }

  nextColor(){
    let col = this._colors.shift();
    this._colors.push(col);
    return col;
  }

  useColor(col){
    let i = this._colors.indexOf(col);
    this._colors.splice(i, 1);
    this._colors.push(col);
  }

}




GUI.curveTypes = [
  {
    name:"Linear",
    children: [
      {name:"Linear"},
      {name:"Exponential"},
      {name:"Bell curve"},
      {name:"Gate"},
      {name:"MIDI"}
    ]
  }
];



module.exports = GUI;

},{"./VisualDisplay.js":7}],5:[function(require,module,exports){
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

},{"./DataManager.js":2,"./GUI.js":4}],6:[function(require,module,exports){

class Variable {
  constructor(name, data, colVals, waxml){

    // make it possible to have data with gaps by allowing for each
    // value to have its own y value (time position)

    if(typeof data.id != "undefined"){
      // auto increase counter if initing from stored data
      Variable.cnt = Math.max(Variable.cnt, parseInt(data.id));
    }

    this.id = Variable.cnt++;
    this.rowID = data.rowID;
    this.displayGroup = parseInt(data.id)+1;
    this.name = name;
    this._state = typeof data.state != "undefined" ? data.state : true;
    this.color = data.color;
    this.mappings = [];
    this.unit = data.unit;  // not used
    this._colVals = colVals;
    this._ctx = waxml._ctx;

    this.output = new GainNode(this._ctx);
    this.panner = new PannerNode(this._ctx, {
      panningModel: "HRTF",
      positionZ: -1
    });
    this.output.connect(this.panner).connect(waxml.master._node);

    this.gain = typeof data.gain != "undefined" ? data.gain : 0.25;
    this.pan = typeof data.pan != "undefined" ? data.pan : 0;
    this.values = [];
    this.update(name, data);
  }

  update(name, data){

    // empty old values
    // while(this.values.length){
    //   this.values.pop();
    // }
    this.values = [];

    this.name = name;
    if(typeof data.rowID != "undefined"){this.rowID = data.rowID}
    delete(this.min);
    delete(this.max);
    delete(this.minCol);
    delete(this.maxCol);
    let x = 0;

    (data.values || []).forEach(valObj => {
      let col, val;

      if(typeof valObj == "object"){
        col = valObj.col;
        val = valObj.val;
      }
      if(typeof col == "undefined"){
        col = this._colVals[x++];
        val = valObj;
      }
      if(typeof this.min == "undefined"){this.min = val}
      if(typeof this.max == "undefined"){this.max = val}
      if(typeof this.minCol == "undefined"){this.minCol = col}
      if(typeof this.maxCol == "undefined"){this.maxCol = col}
      this.min = Math.min(this.min, val);
      this.max = Math.max(this.max, val);
      this.minCol = Math.min(this.minCol, col);
      this.maxCol = Math.max(this.maxCol, col);
      this.values.push({col: col, val: val});
    });
  }


  relX2val(x){
    let col = x * (this.maxCol - this.minCol) +  this.minCol;
    let valObj = this.values.find(entry => entry.col == col);
    if(valObj){
      return valObj.val;
    } else {
      // interpolate between two values
      let val1 = this.values.filter(entry => entry.col < col).pop();
      let val2 = this.values.find(entry => entry.col > col);
      if(typeof val1 == "undefined"){val1 = this.values[0].col}
      if(typeof val2 == "undefined"){val2 = this.values[this.values.length-1].col}

      let relColDiff = (col-val1.col)/(val2.col-val1.col);
      let valDiff = val2.val - val1.val;
      return val1.val + valDiff * relColDiff;
    }
  }

  unMute(){
    if(this._targetAudioObject){
      this.output.gain.setValueAtTime(this.gain, this._ctx.currentTime);
      // this._targetAudioObject.target.gain = this.gain;
    }
  }

  mute(){
    if(this._targetAudioObject){
      this.output.gain.setValueAtTime(0, this._ctx.currentTime);
      // this._targetAudioObject.target.gain = 0;
    }
  }

  disconnect(){
    if(this._targetAudioObject){
      this._targetAudioObject.target.disconnect(0);
    }
  }

  set targetAudioObject(obj){
    if(this._targetAudioObject){
      this._targetAudioObject.target.disconnect(0);
    }
    let target = obj.target;
    target.disconnect(0);
    target.connect(this.output);
    this._targetAudioObject = obj;
  }

  get targetAudioObject(){
    return this._targetAudioObject;
  }

  get state(){
    return this._state;
  }

  set state(_state){
    this._state = _state;
    if(this._targetAudioObject){
      this.output.gain.setValueAtTime(_state ? this.gain : 0, this._ctx.currentTime);
      // this._targetAudioObject.target.gain = _state ? this.gain : 0;
    }
  }

  get data(){
    return {
      name: this.name,
      id: this.id,
      rowID: this.rowID,
      gain: this.gain,
      pan: this.pan,
      state: this.state,
      color: this.color,
      audioObjectID: this._targetAudioObject ? this._targetAudioObject.id : 0
    };
  }

  set gain(val){
    this._gain = val;
    this.output.gain.setValueAtTime(val, this._ctx.currentTime);
    if(this._targetAudioObject){
      
      // this._targetAudioObject.target.gain = val;
    }
  }

  get gain(){
    return this._gain;
  }

  get pan(){
    return this._pan;
  }

  set pan(val){
    val = parseFloat(val);
    this._pan = val;
    this.panner.positionX.setValueAtTime(val, this._ctx.currentTime);
  }

}

Variable.cnt = 0;

module.exports = Variable;

},{}],7:[function(require,module,exports){
class VisualDisplay {
  constructor(canvas){
    this._canvas = canvas;
    this.relative = true;
    this._ctx = canvas.getContext("2d");
    this._ctx.lineWidth = 3;

    canvas.addEventListener("click", e => {
      this.switchMode();
    });
  }

  switchMode(){
    this.relative = !this.relative;
    this.draw();
  }


  draw(variables = this.lastUsedVariables){
    this.clear();
    if(!variables){return}

    this.lastUsedVariables = variables;

    let globalMin;
    variables.forEach((item, i) => {
      if(typeof globalMin == "undefined"){globalMin = item.min}
      globalMin = Math.min(globalMin, item.min);
    });

    let globalMax;
    variables.forEach((item, i) => {
      if(typeof globalMax == "undefined"){globalMax = item.max}
      globalMax = Math.max(globalMax, item.max);
    });


    variables.forEach(varObj => {
      this._ctx.beginPath();
      this._ctx.strokeStyle = varObj.color;

      let xOffset = varObj.minCol;
      let xRange = varObj.maxCol - varObj.minCol;

      let yOffset = this.relative ? varObj.min : globalMin;
      let yRange = this.relative ? varObj.max - varObj.min : globalMax - globalMin;

      varObj.values.forEach((valueObj, i) => {
        let x = (valueObj.col - xOffset)/xRange * this._canvas.width;
        let y = (1 - (valueObj.val - yOffset)/yRange) * this._canvas.height;
        if(i==0){
          // first point
          this._ctx.moveTo(x,y);
        } else {
          // other points
          this._ctx.lineTo(x,y);
        }


        this._ctx.stroke();
      });
    });

  }

  clear(){
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }

  set gain(vol){
    if(this.targetAudioObject){
      this.targetAudioObject.target.gain = vol;
    }
  }

}

module.exports = VisualDisplay;

},{}]},{},[5]);
