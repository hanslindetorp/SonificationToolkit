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
