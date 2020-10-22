/*
 * @Author: Jercky 
 * @Date: 2020-10-22 10:47:48 
 * @Last Modified by: Jercky
 * @Last Modified time: 2020-10-22 12:16:41
 */


var BaseEvent = function () {
  this.handles = {}
  this.cached = []
}
BaseEvent.prototype.on = function (eventName, callback) {

  if (typeof callback !== "function") return;

  if (!this.handles[eventName]) {
    this.handles[eventName] = [];
  }
  this.handles[eventName].push(callback);

  if (this.cached[eventName] instanceof Array) {
    //说明有缓存的 可以执行
    callback.apply(null, this.cached[eventName]);
  }
}

BaseEvent.prototype.emit = function () {
  if (this.handles[arguments[0]] instanceof Array) {
    for (let i = 0; i < this.handles[arguments[0]].length; i++) {
      this.handles[arguments[0]][i](arguments[1]);
    }
  }
  //默认缓存
  this.cached[arguments[0]] = Array.prototype.slice.call(arguments, 1);
}

var CesiumPopup = (function () {

  var _panelContainer = null
  var _contentContainer = null
  var _closeBtn = null

  var _renderListener = null
  var _viewer = null

  var CesiumPopup = function (options) {
    //继承
    BaseEvent.call(this)

    this.className = options.className || ''
    this.title = options.title || ''
    this.offset = options.offset || [0, 0]

    // this.render = this.render.bind(this)
    this.closeHander = this.closeHander.bind(this)

  }

  CesiumPopup.prototype = new BaseEvent()
  CesiumPopup.prototype.constrctor = CesiumPopup


  CesiumPopup.prototype.addTo = function (viewer) {
    if (_viewer) this.remove()
    _viewer = viewer
    this.initPanle();
    //关闭按钮
    _closeBtn.addEventListener('click', this.closeHander, false)
    if (this.position) {
      _panelContainer.style.display = 'block'
      _renderListener = _viewer.scene.postRender.addEventListener(this.render, this)
    }

    return this

  }

  CesiumPopup.prototype.initPanle = function () {

    var closeBtnIcon = '<svg t="1603334792546" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1328" width="32" height="32"><path d="M568.922 508.232L868.29 208.807a39.139 39.139 0 0 0 0-55.145l-1.64-1.64a39.139 39.139 0 0 0-55.09 0l-299.367 299.82-299.425-299.934a39.139 39.139 0 0 0-55.088 0l-1.697 1.64a38.46 38.46 0 0 0 0 55.09l299.48 299.594-299.424 299.48a39.139 39.139 0 0 0 0 55.09l1.64 1.696a39.139 39.139 0 0 0 55.09 0l299.424-299.48L811.56 864.441a39.139 39.139 0 0 0 55.089 0l1.696-1.64a39.139 39.139 0 0 0 0-55.09l-299.48-299.537z" p-id="1329"></path></svg>'

    _panelContainer = document.createElement('div')
    _panelContainer.classList.add('cesium-popup-panel')
    if (this.className && this.className !== '') {
      _panelContainer.classList.add(this.className)
    }

    _closeBtn = document.createElement('div')
    _closeBtn.classList.add('cesium-popup-close-btn')

    _closeBtn.innerHTML = closeBtnIcon

    // header container
    var headerContainer = document.createElement('div')
    headerContainer.classList.add('cesium-popup-header-panel')

    this.headerTitle = document.createElement('div')
    this.headerTitle.classList.add('cesium-poput-header-title')
    this.headerTitle.innerHTML = this.title

    headerContainer.appendChild(this.headerTitle)
    _panelContainer.appendChild(_closeBtn)

    _panelContainer.appendChild(headerContainer)

    // content container

    _contentContainer = document.createElement('div')
    _contentContainer.classList.add('cesium-popup-content-panel')
    _contentContainer.innerHTML = this.content

    _panelContainer.appendChild(_contentContainer)

    //tip container
    var tipContaienr = document.createElement('div')
    tipContaienr.classList.add('cesium-popup-tip-panel')

    var tipDiv = document.createElement('div')
    tipDiv.classList.add('cesium-popup-tip-bottom')

    tipContaienr.appendChild(tipDiv)

    _panelContainer.appendChild(tipContaienr)

    _panelContainer.style.display = 'none'
    // add to Viewer Container
    _viewer.cesiumWidget.container.appendChild(_panelContainer)
    this.emit('open')

  }

  CesiumPopup.prototype.setHTML = function (html) {
    if (_contentContainer) {
      _contentContainer.innerHTML = html
    }
    this.content = html
    return this;

  }

  CesiumPopup.prototype.render = function () {
    var geometry = this.position
    if (!geometry) return
    var position = Cesium.SceneTransforms.wgs84ToWindowCoordinates(_viewer.scene, geometry)
    if (!position) {
      return
    }
    if (_panelContainer) {
      _panelContainer.style.left = position.x - _panelContainer.offsetWidth / 2 + this.offset[0] + 'px';
      _panelContainer.style.top = position.y - _panelContainer.offsetHeight - 10 + this.offset[1] + 'px';
    }

  }

  CesiumPopup.prototype.setPosition = function (cartesian3) {
    this.position = cartesian3
    return this;

  }

  CesiumPopup.prototype.addClassName = function (className) {
    if (_panelContainer) {
      _panelContainer.classList.add(className)
    }
    return this;

  }

  CesiumPopup.prototype.removeClass = function (className) {
    if (_panelContainer) {
      _panelContainer.classList.remove(className)
    }
    return this;

  }


  CesiumPopup.prototype.setTitle = function (title) {
    this.headerTitle.innerHTML = title

    return this;
  }
  CesiumPopup.prototype.setOffset = function (offset) {
    this.offset = offset
    return this;
  }

  CesiumPopup.prototype.closeHander = function () {
    this.remove()
  }

  CesiumPopup.prototype.remove = function () {

    _closeBtn.removeEventListener('click', this.closeHander, false)


    if (_closeBtn) {
      _closeBtn.parentNode.removeChild(_closeBtn)
      _closeBtn = null

    }

    if (_contentContainer) {
      _contentContainer.parentNode.removeChild(_contentContainer)
      _contentContainer = null
    }

    if (_panelContainer) {
      _panelContainer.parentNode.removeChild(_panelContainer)
      _panelContainer = null
    }


    if (_renderListener) {
      _renderListener()
      _renderListener = null
    }

    if (_viewer) {
      _viewer = null
    }
    this.emit('close')

  }


  return CesiumPopup
})()


