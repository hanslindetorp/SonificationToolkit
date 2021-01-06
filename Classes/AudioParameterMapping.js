class AudioParameterMapping {

  constructor(varObj, paramObj, data = {}){
    this.variable = varObj;
    this.audioParameter = paramObj;
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

    this.inputLow = typeof data.inputLow == "undefined" ? varObj.min : data.inputLow;
    this.inputHigh = typeof data.inputHigh == "undefined" ? varObj.max : data.inputHigh;
    this.outputLow = typeof data.outputLow == "undefined" ? paramObj.min : data.outputLow;
    this.outputHigh = typeof data.outputHigh == "undefined" ? paramObj.max : data.outputHigh;


  }

  update(data){
    if(!data){return}

    Object.entries(data).forEach(entry => {

      let key = entry[0];
      let value = entry[1];

      switch (key) {
        case "variable":
          // update mins and maxs
          let range = this.variable.max - this.variable.min;
          let relInputLow = (this.inputLow - this.variable.min) / range;
          let relInputHigh= (this.inputHigh - this.variable.min) / range;
          let newVarObj = value;
          let newRange = newVarObj.max - newVarObj.min;
          this.inputLow = relInputLow * newRange + newVarObj.min;
          this.inputHigh = relInputHigh * newRange + newVarObj.max;
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
    let relInput = (x - this.inputLow)/(this.inputHigh - this.inputLow);
    // invert if specified
    relInput = this.invert ? 1 - relInput : relInput;
    // do math for exp, bellcurve, etc
    relInput = Math.pow(relInput, this.audioParameter.conv);

    let output = relInput * (this.outputHigh - this.outputLow) + this.outputLow;

    return output;
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
