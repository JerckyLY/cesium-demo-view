/**
 * @Description: 极坐标 测量 角度
 * @author Jercky Liu
 * @date 2021-01-22 11:09:44
*/
// import BaseBtnTool from "./BaseBtnTool";
// import * as Cesium from "cesium/Cesium";


 class  CesiumAngelUtil{
    constructor() {
        // super();
        this.arrowEntities = [];
        this.viewEntities = [];
        this.positions = [];


    }


    /**
     * 转换为经纬度
     * @param viewer {Cesium.viewer}
     * @param cartesian {Cesium.Cartesian3}
     * @return [lng,lat]
     */
    cartesianToLngLat (viewer,cartesian){
        const latlng = viewer.scene.globe.ellipsoid.cartesianToCartographic(
            cartesian
        );
        const lat = Cesium.Math.toDegrees(latlng.latitude);
        const lng = Cesium.Math.toDegrees(latlng.longitude);
        return [lng, lat];
    }



    //初始化绘制事件
    initDraw(){
        //数组记录数据
        this.positions = [];
        if(!this.handler) this.handler= new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        let arrowEntity = null;
        //左键点击
        this.handler.setInputAction((evt)=> {
            //单机开始绘制
            var cartesian;
            cartesian = this.getCatesian3FromPX(evt.position, this.viewer);
            if (!cartesian) return;
            // if (this.positions.length == 0) {
            //     this.positions.push(cartesian);
            // }
            this.positions.push(cartesian);

            if (this.positions.length == 3) {
                this.handler.destroy();
                this.handler = null;

                this.initDraw()
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);


        //鼠标移动事件
        this.handler.setInputAction((evt)=> {
            //移动时绘制面
            if (this.positions.length < 1) return;
            var cartesian;
            cartesian = this.getCatesian3FromPX(evt.endPosition, this.viewer);
            if (!cartesian) return;

            if (this.positions.length >= 1) {
                if (!arrowEntity) {
                    this.positions.push(cartesian);
                    arrowEntity = this.showArrowOnMap(this.positions);
                    this.showAngelOnMap(this.positions);
                    this.showFloatLineOnMap(this.positions)
                } else {
                    this.positions.pop();
                    this.positions.push(cartesian);
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    }

    /**
     * 清空结果
     */
    clearDraw () {

        this.viewEntities.forEach(item =>{
            this.viewer.entities.remove(item)
        })
        this.viewEntities = []

        this.arrowEntities.forEach(item => {
            this.viewer.entities.remove(item)
        })
        this.arrowEntities = []

        this.positions = [];
        if (this.handler) {
            this.handler.destroy();
            this.handler = null;
            delete this.handler
        }
    }

    getLineSDistance(positions){
        let distance = 0
        const point1cartographic = Cesium.Cartographic.fromCartesian(positions[0]);
        const point2cartographic = Cesium.Cartographic.fromCartesian(positions[1]);
        /**根据经纬度计算出距离**/
        const geodesic = new Cesium.EllipsoidGeodesic();
        geodesic.setEndPoints(point1cartographic, point2cartographic);
        let s = geodesic.surfaceDistance;
        //console.log(Math.sqrt(Math.pow(distance, 2) + Math.pow(endheight, 2)));
        //返回两点之间的距离
        s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
       distance = distance + s;
       return distance.toFixed(2)
    }

    showFloatLineOnMap(positions){
        const that = this
        const radiansPerDegree = Math.PI / 180.0;//角度转化为弧度(rad)
        const update = function() {
            if (positions.length < 2) {
                return null;
            }
            const startC=Cesium.Cartographic.fromCartesian(positions[0])
            const distance = that.getLineSDistance(positions);
            const tmp=Cesium.Cartesian3.fromRadians(
                startC.longitude,
                startC.latitude+distance/111000*radiansPerDegree,
                startC.height
            )
            return [positions[0],tmp]

        };
        const arrowEntity = this.viewer.entities.add({
            polyline: new Cesium.PolylineGraphics({
                positions: new Cesium.CallbackProperty(update, false),
                clampToGround: true,
                material: new Cesium.PolylineDashMaterialProperty({
                    color: Cesium.Color.RED,
                }),
                width:4
            })
        });
        this.arrowEntities.push(arrowEntity)
        return arrowEntity
    }


    /**
     * 绘制箭头
     * @param positions
     * @return {}
     */
    showArrowOnMap(positions){
        const update = function() {
            if (positions.length < 2) {
                return null;
            }
            return positions;
        };
        const arrowEntity = this.viewer.entities.add({
            polyline: new Cesium.PolylineGraphics({
                positions: new Cesium.CallbackProperty(update, false),
                clampToGround: true,
                material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.fromCssColorString("#FFFF33").withAlpha(0.8)),
                width: 8
            })
        });
        this.arrowEntities.push(arrowEntity)
        return arrowEntity
    }


    /**
     * 显示实时角度结果
     * @param positions
     * @return {}
     */
    showAngelOnMap(positions){
        const $this = this;
        const update = function() {
            if (positions.length < 2) {
                return null;
            }

            return positions[1];
        };
        const textUpdate = function() {
            if (positions.length < 2) {
                return null;
            }
            const firstPoint = $this.cartesianToLngLat($this.viewer,positions[0]);
            const endPoints = $this.cartesianToLngLat($this.viewer,positions[1]);
            const angelText = $this.courseAngle(
                firstPoint[0],
                firstPoint[1],
                endPoints[0],
                endPoints[1]
            ).toFixed(1);
            return angelText + " °";
        };
        const labelEntity = this.viewer.entities.add({
            position: new Cesium.CallbackProperty(update, false),
            label: {
                text: new Cesium.CallbackProperty(textUpdate, false),
                font: "18px sans-serif",
                fillColor: Cesium.Color.GOLD,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(20, -20)
            }
        });
        this.viewEntities.push(labelEntity)
        return  labelEntity
    }

    /**
     * 计算两个点的角度
     * @param lng_a
     * @param lat_a
     * @param lng_b
     * @param lat_b
     * @return {number}
     */
    courseAngle(lng_a, lat_a, lng_b, lat_b) {

        //以a点为原点建立局部坐标系（东方向为y轴,北方向为x轴,垂直于地面为z轴），得到一个局部坐标到世界坐标转换的变换矩阵
        // const localToWorld_Matrix = Cesium.Transforms.northEastDownToFixedFrame(
        //     new Cesium.Cartesian3.fromDegrees(lng_a, lat_a)
        // );

        //以a点为原点建立局部坐标系（东方向为x轴,北方向为y轴,垂直于地面为z轴），得到一个局部坐标到世界坐标转换的变换矩阵
        const localToWorld_Matrix = Cesium.Transforms.eastNorthUpToFixedFrame(
            new Cesium.Cartesian3.fromDegrees(lng_a, lat_a)
        );
        //求世界坐标到局部坐标的变换矩阵
        const worldToLocal_Matrix = Cesium.Matrix4.inverse(
            localToWorld_Matrix,
            new Cesium.Matrix4()
        );
        //a点在局部坐标的位置，其实就是局部坐标原点
        const localPosition_A = Cesium.Matrix4.multiplyByPoint(
            worldToLocal_Matrix,
            new Cesium.Cartesian3.fromDegrees(lng_a, lat_a),
            new Cesium.Cartesian3()
        );
        //B点在以A点为原点的局部的坐标位置
        const localPosition_B = Cesium.Matrix4.multiplyByPoint(
            worldToLocal_Matrix,
            new Cesium.Cartesian3.fromDegrees(lng_b, lat_b),
            new Cesium.Cartesian3()
        );

        //弧度
        // const angle = Math.atan2(
        //     localPosition_B.y - localPosition_A.y,
        //     localPosition_B.x - localPosition_A.x
        // );
        //弧度
        const angle = Math.atan2(
            localPosition_B.x - localPosition_A.x,
            localPosition_B.y - localPosition_A.y
        );
        //角度
        let theta = angle * (180 / Math.PI);
        if (theta < 0) {
            theta = theta + 360;
        }
        return theta;
    }
    /**
     * 根据屏幕坐标 获取世界坐标
     * @param px  屏幕坐标
     * @param viewer {Cesium.viewer}
     * @return {Cesium.Cartesian3}
     */
    getCatesian3FromPX(px, viewer) {
        let cartesian;
        //在模型上提取坐标
        var pickobject = viewer.scene.pick(px); //取模型
        if (viewer.scene.pickPositionSupported && Cesium.defined(pickobject)) {   //!scene.pickPositionSupported : 不支持深度拾取,无法进行鼠标交互绘制
            cartesian = viewer.scene.pickPosition(px);
            if (cartesian) {
                const pgeo = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
                if (pgeo.height > 0)
                    return cartesian;
            }
        }

        //提取鼠标点的地理坐标
        const pickRay = viewer.scene.camera.getPickRay(px);
        cartesian = viewer.scene.globe.pick(pickRay, viewer.scene);
        return cartesian;
    }


    /**
     * 激活
     * @param viewer
     */
    active(viewer) {
        // super.active(viewer);
        this.viewer = viewer

        this.initDraw()
    }


    /**
     * 关闭
     */
    deactive() {
        this.clearDraw()

        // super.deactive();
        this.viewer = null
        delete  this.viewer
    }
}

// export default CesiumAngelUtil
