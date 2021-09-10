

function getTimestamp() {
  var getTime;

  if (
    typeof performance !== "undefined" &&
    typeof performance.now === "function" &&
    isFinite(performance.now())
  ) {
    getTime = function () {
      return performance.now();
    };
  } else {
    getTime = function () {
      return Date.now();
    };
  }
  return getTime();
}
class CesiumFPSUtil {
  constructor(containerId) {
    this.id = containerId || "fpsdiv";
    this._lastFpsSampleTime = getTimestamp();
    this._lastMsSampleTime = getTimestamp();
    this._fpsFrameCount = 0;
    this._msFrameCount = 0;
    this.createDiv();
  }

  createDiv() {
    const parent = document.getElementById(this.id);
    const fpsDiv = document.createElement("div");
    fpsDiv.className = "info-content";

    this._fpsText = document.createElement("span");
    this._msText = document.createElement("span");
    fpsDiv.append(this._fpsText);
    fpsDiv.append(this._msText);
    parent.append(fpsDiv);
  }


  update() {
    let time = getTimestamp();
    this._fpsFrameCount++;
    let updateDisplay = true;
    let fpsElapsedTime = time - this._lastFpsSampleTime;
    if (fpsElapsedTime > 1000) {
      var fps = "N/A";
      if (updateDisplay) {
        fps = ((this._fpsFrameCount * 1000) / fpsElapsedTime) | 0;
      }

      this._fpsText.innerText = fps + " FPS";
      this._lastFpsSampleTime = time;
      this._fpsFrameCount = 0;
    }
    this._msFrameCount++;
    let msElapsedTime = time - this._lastMsSampleTime;
    if (msElapsedTime > 200) {
      let ms = "N/A";
      if (updateDisplay) {
        ms = (msElapsedTime / this._msFrameCount).toFixed(2);
      }

      this._msText.innerText = ms + " MS";
      this._lastMsSampleTime = time;
      this._msFrameCount = 0;
    }
  }
}