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
