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
