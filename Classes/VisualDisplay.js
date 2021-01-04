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
