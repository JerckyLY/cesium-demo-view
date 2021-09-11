/**
 * @Description: 二三维联动，二维openlayers,三维Cesium
 * @author Jercky Liu
 * @date 2021-06-09 11:34:36
*/
// import Map from "ol/Map";
// import View from "ol/View";
// import TileLayer from 'ol/layer/Tile';
// import XYZ from 'ol/source/XYZ';
// import * as Cesium from "cesium/Cesium";
// import {GridLayerIdType, LayerGroupIdType, PropertyLayerIdType} from "../../config/LayerListConfig";
// import GlobeView from "../../utils/GlobeView";
// import {transform,transformExtent} from 'ol/proj';
// import {AppEventBus, AppEventType} from "../../utils/AppEventBus";
// import OpenlayersPopupUtil from "../../d2map/utils/OpenLayersPopupUtil";
// import PropNameMapConfig from "../../config/PropNameMapConfig";
// import { getCenter } from "ol/extent";

class Cesium2DLinkage3DUtil {
    constructor(mapId = 'map2d-view-compare-map') {
        this.mapId = mapId

        this.isActive = false
        this.isIn2DMapFlag = false;

        this.mouseMoveEvent = this.mouseMoveEvent.bind(this)
        this.getViewCameraRectrange = this.getViewCameraRectrange.bind(this)
        this.changeCenterListener = this.changeCenterListener.bind(this)
    }


    /**
     * 初始化地图容器，插入三维容器的左侧
     */
    init2DDiv(){
        this.mapDiv = document.createElement('div');
        this.mapDiv.setAttribute('id', this.mapId)

        this.mapDiv.style.width = '0%';
        this.mapDiv.style.height = '100%';
        this.mapDiv.style.position = 'relative';
        this.mapDiv.style.visibility = 'hidden'
        // insertBefore
        const viewerContainer = this.viewer.cesiumWidget.container.parentElement.parentElement
        viewerContainer.parentNode.insertBefore(this.mapDiv, viewerContainer)
    }

    /**
     * 初始化地图视图
     */
    init2DMap(){
        // const originView = GlobeView.Map2DViewer.getView()
        //
        const layer = new ol.layer.Tile({
            source:new ol.source.XYZ({
                url:'https://server.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
            })
        })
        this.olMap = new ol.Map({
            layers:[layer],
            target: this.mapId,
            view: new ol.View({
                center: [13818313.960985335, 6519709.935426011],
                zoom: 8,
                projection: 'EPSG:3857',
                maxZoom:22
            })
        });

        this.olMap.updateSize()

    }


    /**
     * 二维监听事件处理
     */
    changeCenterListener(){
        if (this.isIn2DMapFlag) {
            const bounds = this.olMap.getView().calculateExtent();
            const boundsTansform = ol.proj.transformExtent(bounds,'EPSG:3857','EPSG:4326')
            this.viewer.camera.setView({
                destination: Cesium.Rectangle.fromDegrees(
                    boundsTansform[0],
                    boundsTansform[1],
                    boundsTansform[2],
                    boundsTansform[3],
                )
            });
        }
    }

    /**
     * 三维监听事件处理
     */
    getViewCameraRectrange(){
        const rectangle = this.viewer.camera.computeViewRectangle();
        // 弧度转为经纬度

        const west = (rectangle.west / Math.PI) * 180;

        const north = (rectangle.north / Math.PI) * 180;

        const east = (rectangle.east / Math.PI) * 180;

        const south = (rectangle.south / Math.PI) * 180;
        //三维联动二维界面
        if (!this.isIn2DMapFlag) {
            if (north > 87 && south < -87) {
                const center = this.getCenterPosition(this.viewer);
                this.olMap.getView().setZoom(0);
                this.olMap.getView().setCenter(ol.proj.transform([center.lon,center.lat],'EPSG:4326','EPSG:3857'));
            } else {
                // console.log(west, south, east, north);
                // this.olMap.getView().fit([transform(west,'EPSG:4326','EPSG:3857'), transform(south,'EPSG:4326','EPSG:3857'), transform(east,'EPSG:4326','EPSG:3857'), transform(north,'EPSG:4326','EPSG:3857')]);
                this.olMap.getView().fit(ol.proj.transformExtent([west,south, east, north],'EPSG:4326','EPSG:3857'));

            }

        }
    }

    /**
     * 判断鼠标是否在二维地图
     * @param x
     * @param y
     * @return {boolean}
     */
    isMouseIn2DMap(x, y){
        let y1 = this.mapDiv.offsetTop; //div上面两个的点的y值
        let y2 = y1 + this.mapDiv.clientHeight; //div下面两个点的y值
        let x1 = this.mapDiv.offsetLeft; //div左边两个的点的x值
        let x2 = x1 + this.mapDiv.clientWidth; //div右边两个点的x的值
        if (x < x1 || x > x2 || y < y1 || y > y2) {
            return false;
        } else {
            return true;
        }
    }

    addListener(){
        this.mapDiv.style.width = '50%';
        this.mapDiv.style.visibility = 'visible'
        this.olMap.getView().on("change:center", this.changeCenterListener);
        this.viewer.cesiumWidget.container.parentElement.parentElement.style.width = '50%'
        this.olMap.updateSize()
        this.viewer.cesiumWidget.container.parentElement.parentElement.parentElement.addEventListener('mousemove', this.mouseMoveEvent)
        this.viewer.scene.preRender.addEventListener(this.getViewCameraRectrange);
    }
    removeListener(){
        this.olMap.getView().un("change:center", this.changeCenterListener);
        this.viewer.scene.preRender.removeEventListener(this.getViewCameraRectrange)
        this.viewer.cesiumWidget.container.parentElement.parentElement.parentElement.removeEventListener('mousemove', this.mouseMoveEvent)
        // this.mapDiv.style.display = 'none'
        this.mapDiv.style.width = '0%';
        this.mapDiv.parentNode.removeChild(this.mapDiv)
        this.olMap = null;
        this.viewer.cesiumWidget.container.parentElement.parentElement.style.width = '100%'
    }


    mouseMoveEvent(e){
        this.isIn2DMapFlag = this.isMouseIn2DMap(e.pageX, e.pageY);
    }
    getCenterPosition(viewer) {
        const result = viewer.camera.pickEllipsoid(
            new Cesium.Cartesian2(
                viewer.canvas.clientWidth / 2,
                viewer.canvas.clientHeight / 2
            )
        );
        const curPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(result);
        const lon = (curPosition.longitude * 180) / Math.PI;
        const lat = (curPosition.latitude * 180) / Math.PI;
        return {
            lon: lon,
            lat: lat
        };
    }


    active(viewer) {
        this.viewer = viewer
        this.isActive =  true
        this.init2DDiv()
        this.init2DMap()
        this.addListener()
    }
    deactive() {
        this.removeListener()
        this.isActive =  false
        this.viewer = undefined
    }
}

// export default Cesium2DLinkage3DUtil
