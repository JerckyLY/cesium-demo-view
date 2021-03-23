/*
 * @Author: Jercky 
 * @Date: 2021-01-19 10:14:14 
 * @Last Modified by:   Jercky 
 * @Last Modified time: 2021-01-19 10:14:14 
 * 缓冲区显示
 */


var CesiumBufferUtil = function (viewer) {
  this.viewer = viewer
  this.handler = null;
  this.positions = [];
  this.isActive = false;
  this.isDrawing = false;
  this.viewEntities = []; // 点线面回显
  this.bufferEntities = [];
  this.type = 'Point'; //默认为点
  this.radius = 1; //单位 km 
}


/**
 * 
 * @param {Object} options  type类型 Point Line Polygon ; radius Number 半径  
 */
CesiumBufferUtil.prototype.active = function (options) {
  this.lastType = this.type; //记录上次操作的类型 便于清除结果
  this.type = options.type || 'Point';
  this.radius = options.radius || 1;

  if (this.type === 'Point') {
    this.initPointHandler()
  }

  if (this.type === 'Line') {
    this.initLineHandler()
  }

  if (this.type === 'Polygon') {
    this.initPolygonHandler()
  }
}

/**
 * 互斥 清除最后一个
 */
CesiumBufferUtil.prototype.removeLastOpereate = function () {
  if (this.isDrawing) {

    //如果是线或者面 则清除最后一个
    if (this.lastType === 'Line' || this.lastType === 'Polygon') {
      if (this.viewEntities.length > 0) {
        var lastEntity = this.viewEntities.pop()
        this.viewer.entities.remove(lastEntity)
      }
    }

    if (this.handler) {
      this.handler.destroy()
      this.handler = null
    }
  }

}


//#region 面缓冲区

CesiumBufferUtil.prototype.initPolygonHandler = function () {
  this.positions = [];
  this.removeLastOpereate()
  var polygonEntity = null;
  var $this = this;
  this.isDrawing = true
  if (!this.handler)
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

  this.handler.setInputAction(function (evt) {
    //单机开始绘制
    var cartesian;
    cartesian = getCatesian3FromPX(evt.position, $this.viewer);
    if (!cartesian) return;

    if ($this.positions.length == 0) {
      $this.positions.push(cartesian.clone());
    }

    $this.positions.push(cartesian.clone());
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);


  this.handler.setInputAction(function (evt) {
    //移动时绘制面
    if ($this.positions.length < 2) return;
    var cartesian;
    cartesian = getCatesian3FromPX(evt.endPosition, $this.viewer);
    if (!cartesian) return;

    if ($this.positions.length >= 2) {
      if (!Cesium.defined(polygonEntity)) {
        $this.positions.push(cartesian);
        //
        polygonEntity = $this.showPolygonOnMap($this.positions);
      } else {
        $this.positions.pop();
        $this.positions.push(cartesian);
      }
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  this.handler.setInputAction(function (evt) {
    //单击开始绘制
    var cartesian;
    cartesian = getCatesian3FromPX(evt.position, $this.viewer);
    if (!cartesian) return;
    // $this.positions.push(cartesian.clone());
    $this.isDrawing = false;
    $this.createPolygonBuffer()
    $this.handler.destroy();
    $this.handler = null;

  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
}

/**
 * 绘制面
 * @param {Array} positions 
 */
CesiumBufferUtil.prototype.showPolygonOnMap = function (positions) {
  var update = function () {
    if (positions.length < 2) {
      return null;
    }
    return new Cesium.PolygonHierarchy(positions);
  };
  var polygon = this.viewer.entities.add({
    polygon: {
      hierarchy: new Cesium.CallbackProperty(update, false),
      material: Cesium.Color.YELLOW.withAlpha(0.6),
      classificationType: Cesium.ClassificationType.BOTH
    },
    // polyline: {
    //   positions: new Cesium.CallbackProperty(update, false),
    //   width: 2,
    //   material: Cesium.Color.YELLOW.withAlpha(0.4),
    // }
  });
  this.viewEntities.push(polygon)
  return polygon;
}

/**
 * 多边形缓冲区
 */
CesiumBufferUtil.prototype.createPolygonBuffer = function () {
  var points = this.getLngLats(); // 坐标数组
  points.push(points[0])
  var polygonF = turf.polygon([points]);
  var bufferd = turf.buffer(polygonF, this.radius);
  var coordinates = bufferd.geometry.coordinates;
  points = coordinates[0]
  var degreesArray = this.pointsToDegreesArray(points)
  this.createBuffer(Cesium.Cartesian3.fromDegreesArray(degreesArray))
}

//#endregion



//#region  线缓冲区

/**
 * 激活线操作
 */
CesiumBufferUtil.prototype.initLineHandler = function () {
  this.positions = [];
  this.removeLastOpereate()
  var lineEntity = null;
  var $this = this;
  this.isDrawing = true
  if (!this.handler)
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
  this.handler.setInputAction(function (evt) {
    //单机开始绘制
    var cartesian;
    cartesian = getCatesian3FromPX(evt.position, $this.viewer);
    if (!cartesian) return;

    if ($this.positions.length == 0) {
      $this.positions.push(cartesian.clone());
    }

    $this.positions.push(cartesian.clone());
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);


  this.handler.setInputAction(function (evt) {
    //移动时绘制面
    if ($this.positions.length < 2) return;
    var cartesian;
    cartesian = getCatesian3FromPX(evt.endPosition, $this.viewer);
    if (!cartesian) return;

    if ($this.positions.length >= 2) {
      if (!Cesium.defined(lineEntity)) {
        $this.positions.push(cartesian);
        //线entity
        lineEntity = $this.showLineOnMap($this.positions);
      } else {
        $this.positions.pop();
        $this.positions.push(cartesian);
      }
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  this.handler.setInputAction(function (evt) {
    //单击开始绘制
    var cartesian;
    cartesian = getCatesian3FromPX(evt.position, $this.viewer);
    if (!cartesian) return;
    // $this.positions.push(cartesian.clone());
    $this.isDrawing = false;
    $this.createLineBuffer()
    $this.handler.destroy();
    $this.handler = null;

  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
}

/**
 * 显示线
 * @param {Array} positions 
 */
CesiumBufferUtil.prototype.showLineOnMap = function (positions) {
  var update = function () {
    if (positions.length < 2) {
      return null;
    }
    return positions;
  };
  var line = this.viewer.entities.add({
    polyline: {
      positions: new Cesium.CallbackProperty(update, false),
      show: true,
      clampToGround: true,
      material: Cesium.Color.fromCssColorString('#fadb14').withAlpha(0.8),
      width: 2
    }
  });
  this.viewEntities.push(line)
  return line;
}

/**
 * 创建线缓冲区
 */
CesiumBufferUtil.prototype.createLineBuffer = function () {
  var points = this.getLngLats(); // 坐标数组
  var polylineF = turf.lineString(points);
  var bufferd = turf.buffer(polylineF, this.radius);
  var coordinates = bufferd.geometry.coordinates;
  points = coordinates[0]
  var degreesArray = this.pointsToDegreesArray(points)
  this.createBuffer(Cesium.Cartesian3.fromDegreesArray(degreesArray))

}

//#endregion



//#region 点缓冲区

/**
 * 激活点
 */
CesiumBufferUtil.prototype.initPointHandler = function () {
  this.positions = []
  this.removeLastOpereate()

  var $this = this;
  this.isDrawing = true
  if (!this.handler)
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
  this.handler.setInputAction(function (evt) {
    //开始绘制
    var cartesian;
    cartesian = getCatesian3FromPX(evt.position, $this.viewer);
    if (!cartesian) return;
    if ($this.positions.length == 0) {
      $this.positions.push(cartesian.clone());
      $this.isDrawing = false
      $this.createPointBuffer()
      $this.handler.destroy();
      $this.handler = null;
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

}


/**
 * 创建点缓冲区
 * 
 */
CesiumBufferUtil.prototype.createPointBuffer = function () {

  //添加点
  this.addPoint()

  //添加点的缓冲区
  const coordinate = this.cartesianToLatlng(this.positions[0]).slice(0, 2);
  let pointF = turf.point(coordinate)
  let buffered = turf.buffer(pointF, this.radius)
  let coordinates = buffered.geometry.coordinates;
  let points = coordinates[0]
  let degreesArray = this.pointsToDegreesArray(points);
  this.createBuffer(Cesium.Cartesian3.fromDegreesArray(degreesArray))
}

/**
 * 添加点实体
 */
CesiumBufferUtil.prototype.addPoint = function () {
  var point = this.viewer.entities.add({
    position: this.positions[0],
    point: {
      pixelSize: 5,
      color: Cesium.Color.BLUE,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
    },
  });
  this.viewEntities.push(point)
}


//#endregion


/**
 * 生成缓冲区
 * @param {Array} array  坐标数据
 */
CesiumBufferUtil.prototype.createBuffer = function (array) {
  const bufferPolygon = this.viewer.entities.add({
    polygon: {
      hierarchy: new Cesium.PolygonHierarchy(array),
      material: Cesium.Color.RED.withAlpha(0.6),
      classificationType: Cesium.ClassificationType.BOTH
    },
  });
  this.bufferEntities.push(bufferPolygon)
}


/**
 * 获取经纬度坐标数组
 */
CesiumBufferUtil.prototype.getLngLats = function () {
  var arr = []
  for (var i = 0; i < this.positions.length; i++) {
    var item = this.cartesianToLatlng(this.positions[i]);
    arr.push(item.slice(0, 2));
  }
  return arr;
}


/**
 * 转经纬度
 * @param {*} cartesian 
 */
CesiumBufferUtil.prototype.cartesianToLatlng = function (cartesian) {
  var latlng = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(
    cartesian
  );
  var lat = Cesium.Math.toDegrees(latlng.latitude);
  var lng = Cesium.Math.toDegrees(latlng.longitude);
  var height = latlng.height
  return [lng, lat, height];
};

//二维数组转一维数组
CesiumBufferUtil.prototype.pointsToDegreesArray = function (points) {
  let degreesArray = [];
  points.map(item => {
    degreesArray.push(item[0]);
    degreesArray.push(item[1]);
  });
  return degreesArray;
}


/**
 * 关闭 清除全部
 */
CesiumBufferUtil.prototype.deactive = function () {

  if (this.viewEntities.length > 0) {
    this.viewEntities.forEach(fn => {
      this.viewer.entities.remove(fn)
    })
    this.viewEntities = []
  }

  if (this.bufferEntities.length > 0) {
    this.bufferEntities.forEach(fn => {
      this.viewer.entities.remove(fn)
    })
  }
  this.bufferEntities = []


  this.positions = []


  if (this.handler) {
    this.handler.destroy()
    this.handler = null
  }
}


function getCatesian3FromPX(px, viewer) {
  var cartesian;
  //在模型上提取坐标
  var pickobject = viewer.scene.pick(px); //取模型
  if (viewer.scene.pickPositionSupported && Cesium.defined(pickobject)) {
    //!scene.pickPositionSupported : 不支持深度拾取,无法进行鼠标交互绘制
    cartesian = viewer.scene.pickPosition(px);
    if (cartesian) {
      var pgeo = viewer.scene.globe.ellipsoid.cartesianToCartographic(
        cartesian
      );
      if (pgeo.height > 0) return cartesian;
    }
  }

  //提取鼠标点的地理坐标
  var pickRay = viewer.scene.camera.getPickRay(px);
  cartesian = viewer.scene.globe.pick(pickRay, viewer.scene);
  return cartesian;
}