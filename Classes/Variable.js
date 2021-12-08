
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
