

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
