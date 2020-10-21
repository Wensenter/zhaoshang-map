$(function(){
    active($('.nav-list>li'))
    active($('.tab-nav li'))
    tabSearch($('.search-tab-nav li'))
    selectItem(4,$('.add-video .tab-content li'))
    selectItem(5,$('.add-project .tab-content li'))
    map('map')
})

//创建一个地图
var map,title,areaData,addCenter,storageOverlays;
function map(mapString){
    //请求区域视图省份
    $.ajax({
        url:'../json/class_1.json',
        async:false,
        success:function(data){
            areaData = data.data;
        }
    })

    map = new BMap.Map(mapString);    // 创建Map实例
    map.centerAndZoom(new BMap.Point(114.070876,22.546587), 5);  // 初始化地图,设置中心点坐标和地图级别
    map.enableScrollWheelZoom();//开启鼠标滚动
    map.enableContinuousZoom(); //开启连续缩放
    map.disableDoubleClickZoom();//禁止双击放大
    map.setMinZoom(5);
    map.setMaxZoom(15);
    //自定义地图样式
    map.setMapStyleV2({styleId:'58f68ec685eb3d1b965d6add7dcb1385'})
    // 添加自定义覆盖物   
    addOverlayForMap('class_1');
    //监听地zoom变化
    var ZommStatus;
    map.addEventListener("zoomend", function(e){
        var center = map.getCenter();
            console.log(center)
        var ZoomNum = map.getZoom();
        if(ZoomNum>= 5 && ZoomNum <= 6){
            if(ZommStatus != 'County'){
                $('.class-2').hide();
                $('.class-3').hide();
                map.clearOverlays();
                //添加该级覆盖物
                addOverlayForMap('class_1');
                ZommStatus = 'County';
            }
        }else if(ZoomNum>= 7 && ZoomNum <= 10){
            if(ZommStatus != 'Area'){
                $('.class-2').css('display','inline');
                $('.class-3').hide();

                //添加该级覆盖物
                map.clearOverlays();
                addOverlayForMap('class_2');

                ZommStatus = 'Area';
            }
        }else if(ZoomNum>= 11 && ZoomNum <= 13){
            if(ZommStatus != 'City'){
                $('.class-2').css('display','inline');
                $('.class-3').css('display','inline');
                $('.main-title').css('display','inline');
                map.clearOverlays();

                addOverlayForMap('class_3');
                ZommStatus = 'City';
   
            }
            var mergeSquares = accumulation(storageOverlays,8);
            map.clearOverlays()
            mergeSquares.forEach(item => {
                map.addOverlay(item)
            })
            projectRemoveEdit()
        }else if(ZoomNum>= 14 && ZoomNum <= 15){
            if(ZommStatus != 'community'){
                $('.class-2').css('display','inline');
                $('.class-3').css('display','inline');
                $('.main-title').css('display','inline');
                map.clearOverlays();

                ZommStatus = 'community';
            }
            var mergeSquares = accumulation(storageOverlays,7);
            map.clearOverlays()
            mergeSquares.forEach(item => {
                map.addOverlay(item)
            })
            videoRemoveEdit()
        }
    });

    //监听地图拖拽
    var adressStatus;
    map.addEventListener('dragend',function(){
        var ZoomNum = map.getZoom();
        if(ZoomNum>= 7 && ZoomNum <= 10){
            var center = map.getCenter();
            var gc = new BMap.Geocoder();
            gc.getLocation(center,function(rs){ //根据中心点查出城市省
                var p = rs.addressComponents.province.split('省')[0];
                var area =  areaData.filter(item=>{
                    return item.data.plist.indexOf(p) >= 0;
                })
                var areaItem = !area[0]?areaData[0]:area[0];
                $('.area-tip .area-ctx').text(areaItem.name)
                //添加该级覆盖物
                if(adressStatus != areaItem.name){
                    console.log('视图变化了')
                    adressStatus = areaItem.name;
                    map.clearOverlays();
                    addOverlayForMap('dataArea');
                }
            });
        }
    })

    // 右键菜单
    var menuflag;
    map.addEventListener('rightclick',function(e){
        addCenter = e.point
        if(ZommStatus == 'City'){
            menuflag = true
            $('.project-right-menu').css({
                left:e.pixel.x+'px',
                top:e.pixel.y+'px'
            }).show()
        }
        if(ZommStatus == 'community'){
            menuflag = true
            $('.video-right-menu').css({
                left:e.pixel.x+'px',
                top:e.pixel.y+'px'
            }).show()
        }
    })

    //左键关闭
    map.addEventListener('click',function(e){
        if(menuflag){
            $('.video-right-menu').hide()
            $('.project-right-menu').hide()
            menuflag = false
        }
    })

}

//添加自定义覆盖物
//urlType => dataArea/dataCity/dataCounty
function addOverlayForMap(urlType){ 
    $.ajax({
        url:'../json/'+urlType+'.json',
        async:true,
        success:function(data){
            var mapCenter = data.mapCenter || {};
            var viewclass = data.viewclass
            var _data = data.data
            var squares = [];
            _data.forEach(item => {
                var mySquare = new SquareOverlay(item.point,item.data,viewclass,mapCenter);    
                map.addOverlay(mySquare)
                squares.push(mySquare)
            });
            mergeSquares = accumulation(squares)
            // mergeSquares.forEach(item => {
            //     map.addOverlay(item)
            // })
        }
    })
}

// 定义自定义覆盖物的构造函数  
function SquareOverlay(point, data, viewclass, mapCenter){
    this._point = point;
    this._data = data;
    this._viewclass = viewclass;
    this._mapCenter = mapCenter;
}
// 继承API的BMap.Overlay
SquareOverlay.prototype = new BMap.Overlay();

// 实现初始化方法  
SquareOverlay.prototype.initialize = function(map){
    // 保存map对象实例
    this._map = map;
    //创建地图卡片
    var div;
    switch(this._viewclass){
        case 1:
        div = createClass_1_Card(this._data,this._point);
        break;
        case 2:
        div = createClass_2_Card(this._data,this._point);
        break;
        case 3:
        div = createClass_3_Card(this._data,this._point);
        break;
        case 4:
        div = createClass_4_Card(this._data,this._point);
        break;
        case 5:
        div = createClass_5_Card(this._data,this._point);
        break;
        case 6:
        div = createClass_6_Card(this._data,this._point);
        break;
        case 7:
        div = create_merge_videoCard(this._data,this._point)
        break;
        case 8:
        div = create_merge_ProjectCard(this._data,this._point)
        break;
        case 9:
        div = create_objectScreenCard(this._data,this._point)
        break;
    }

    // 将div添加到覆盖物容器中
    map.getPanes().markerPane.appendChild(div);
    // 保存div实例
    this._div = div;

    //监听覆盖物的鼠标移入事件
    let that = this;
    div.addEventListener('mouseenter',function(){
        if(that._data&&that._data.plist) {
            setBoundary(that._data.plist)
        }
        $(this).addClass('active')
    })

    //监听覆盖物的鼠标移出事件
    div.addEventListener('mouseleave',function(){
        $(this).removeClass('active')
        if(that._data&&that._data.plist) {
            let overs = map.getOverlays();
            for (let i = 0; i < overs.length; i++){
                if(!overs[i]._div){
                    map.removeOverlay(overs[i])
                }
            }
        }
    })

    return div;
}

//设置行政区边界
var ply;
function setBoundary(names){
    var overs = map.getOverlays();
    for (var i = 0; i < overs.length; i++){
        if(!overs[i]._div){
            map.removeOverlay(overs[i])
        }
    }
    var Bdary = new BMap.Boundary();
    var pointArray = [];
    for(var i =0; i<names.length; i++){
        Bdary.get(names[i],function(rs){
            var count = rs.boundaries.length; //行政区域的点有多少个
            if (count === 0) {
                // 如果没有成功获取到，再次调用
                setBoundary(name);
                return;
            }
            for (var i = 0; i < count; i++) {
                ply = new BMap.Polygon(rs.boundaries[i], {
                    strokeWeight: 1,
                    strokeColor: '#0190BF',
                    fillColor: '#008AB8'
                }); //建立多边形覆盖物
                ply.type = 'over';
                map.addOverlay(ply); //添加覆盖物
                pointArray = pointArray.concat(ply.getPath());
            }
        })
    }
}

// 实现绘制方法   
SquareOverlay.prototype.draw = function(){  
// 根据地理坐标转换为像素坐标，并设置给容器   
    if(!this._point && this._data.name){
        var ls = new BMap.LocalSearch(this._data.cityName);
        this.hide();
        ls.search(this._data.cityName+this._data.name);
        var that = this
        ls.setSearchCompleteCallback(function(rs){
            if(ls.getStatus() == BMAP_STATUS_SUCCESS){
                var poi = rs.getPoi(0);
                var pt = poi.point;
                var position = that._map.pointToOverlayPixel(pt);  
                that._div.style.left = position.x - 40 / 2 + "px";    
                that._div.style.top = position.y - 40 / 2 + "px"; 
                that.show(); 
            }
        })
    }else{
        var position = this._map.pointToOverlayPixel(this._point);   
        this._div.style.left = position.x - 40 / 2 + "px";    
        this._div.style.top = position.y - 40 / 2 + "px"; 
    }   
}

//菜单点击切换
function active(el){
    el.click(function(){
        $(this).siblings('li').removeClass('active');
        $(this).addClass('active');
    })
}

// 搜索tab切换
// let isinitSwiper = false
function tabSearch(el){
    $(el).click(function(){
        $(this).siblings('li').removeClass('active');
        $(this).addClass('active');
        var index = $(this).index()
        $('.tab'+index).show().siblings().hide()
        // if(index == 3&&!isinitSwiper){
        //     initSwiperDom(1)
        //     InitVideoSwiper(videoSwiperOption);
        //     isinitSwiper = true
        // }
    })
}

// let videoSwiperOption = {
//     autoplay: false,
//     pagination: {
//         el: '.pagination',
//         type: 'fraction',
//     },
//     navigation: {
//     nextEl: '.swiper-button-next',
//     prevEl: '.swiper-button-prev',
//     },
//     observer:true
// }

// let VideoSwiper = null;
// let videoCount = ['视频0','视频1','视频2','视频3','视频4','视频5','视频6','视频7','视频8','视频9','视频10','视频11','视频12',]
// function InitVideoSwiper(option) {
//     VideoSwiper = new Swiper('.video-swiper', option)
// }

// // 初始化swiper子节点
// function initSwiperDom(num) {
//     let classObj = {
//         1:'lg',
//         4:'md',
//         9:'sm'
//     };
//     let className = classObj[num]
//     let temp = ``;
//     let newArr = handleArrCut(videoCount,num)
//     for(i = 0; i < newArr.length; i++){
//         let sonTemp = ``;
//         for(j = 0; j < newArr[i].length; j++){
//             sonTemp += `<div>${newArr[i][j]}</div>`;
//         }
//         temp += `<div class="swiper-slide">
//                     <div class="${className} video-box">
//                         ${sonTemp}
//                     </div>
//                 </div>`;
//     }
//     $('.swiper-wrapper').html(temp);
// }

// // 切换swiper显示数量
// function checkout(num) {
//     initSwiperDom(num)
//     VideoSwiper.slideTo(0, 300, false);
// }

//获取时间
function getCurrentDate(){
    var weekStr = {
        0:'星期日',
        1:'星期一',
        2:'星期二',
        3:'星期三',
        4:'星期四',
        5:'星期五',
        6:'星期六',
    };

    var curDate = new Date();
    var curYear =curDate.getFullYear();  //获取完整的年份(4位,1970-????)
    var curMonth = curDate.getMonth()+1;  //获取当前月份(0-11,0代表1月)
    var curDay = curDate.getDate();       //获取当前日(1-31)
    var curWeekDay = curDate.getDay();    //获取当前星期X(0-6,0代表星期天)
    var curHour = curDate.getHours() > 9 ? curDate.getHours(): '0'+curDate.getHours();     //获取当前小时数(0-23)
    var curMinute = curDate.getMinutes() > 9 ? curDate.getMinutes(): '0'+curDate.getMinutes();   // 获取当前分钟数(0-59)
    var curSec =curDate.getSeconds() > 9 ? curDate.getSeconds(): '0'+curDate.getSeconds()      //获取当前秒数(0-59)
    var Current= curHour+':'+curMinute+':'+curSec+'  '+curYear+'年'+curMonth+'月'+curDay+'日'+'  '+weekStr[curWeekDay*1];
    return Current;
}
setInterval(()=>{
    $('.time-text').text(getCurrentDate())
},1000)


// 创建一级视图卡片
function createClass_1_Card(data,center) {
    let div = document.createElement("div")
    div.className = 'cardWrap'

    //创建div事件
    div.addEventListener('click',function(e){
        map.clearOverlays()
        title = data.title;
        e.stopPropagation()
        map.centerAndZoom(new BMap.Point(center.lng, center.lat), 8);
        //区域视图显示区域标题
        $('.class_1').show();
        $('.class_2').show();
        $('.main-title').show().text(title)
    })

    let pointPic = document.createElement('img')
    pointPic.className = 'pointPic'
    pointPic.src = 'img/icon_pnt.png'

    let Title = document.createElement('h3')
    TitleText = document.createTextNode(data.title)
    Title.appendChild(TitleText)

    let infoBox = createProjectInfoBox(data);

    div.appendChild(pointPic)
    div.appendChild(infoBox)
    div.appendChild(Title)

    return div
}

// 创建二级视图卡片
function createClass_2_Card(data,center) {
    let div = document.createElement("div")
    div.className = 'cardWrap'

    div.addEventListener('click',function(e){
        map.clearOverlays()
        e.stopPropagation()
        if(data.name){
            var gc = new BMap.Geocoder();
            gc.getPoint(data.name,function(rs){
                map.centerAndZoom(rs, 12);
            })
        }else{
            map.centerAndZoom(new BMap.Point(center.lng, center.lat), 12);
        }
        //二级视图显示区域标题
        $('.class_1').show();
        $('.class_2').show();
        $('.class_3').show();
        $('.main-title').show().text(data.title)
    })

    let pointPic = document.createElement('img')
    pointPic.className = 'pointPic'
    pointPic.src = 'img/icon_pnt.png'

    let Title = document.createElement('h3')
    TitleText = document.createTextNode(data.title)
    Title.appendChild(TitleText)

    let infoBox = createProjectInfoBox(data);

    div.appendChild(pointPic)
    div.appendChild(infoBox)
    div.appendChild(Title)

    return div
}

// 创建三级视图卡片
function createClass_3_Card(data,center) {
    let div = document.createElement("div")
    div.className = 'cardWrap'

    div.addEventListener('click',function(e){
        map.clearOverlays()
        e.stopPropagation()
        if(data.name){
            var gc = new BMap.Geocoder();
            gc.getPoint(data.name,function(rs){
                map.centerAndZoom(rs, 14);
            })
        }else{
            map.centerAndZoom(new BMap.Point(center.lng, center.lat), 14);
        }
        $('.main-title').show().text(data.title);
    })

    let pointPic = document.createElement('img')
    pointPic.className = 'pointPic'
    pointPic.src = 'img/icon_pnt.png'

    let Title = document.createElement('h3')
    TitleText = document.createTextNode(data.title)
    Title.appendChild(TitleText)

    let infoBox = createCameraInfoBox(data)

    div.appendChild(pointPic)
    div.appendChild(infoBox)
    div.appendChild(Title)

    return div
}

// 创建摄像头编辑视图卡片
var isEdit = false
function createClass_4_Card(data) {
    var div = document.createElement('div')
    div.className = 'addVideoWrap'
    div.id = data.id

    //创建覆盖物拖拽
    var x = 0;
    var y = 0;
    var l = 0;
    var t = 0;
    var isDown = false;
    div.addEventListener('mousedown',function(e){
        //获取x坐标和y坐标
        x = e.clientX;
        y = e.clientY;
        //获取左部和顶部的偏移量
        l = div.offsetLeft;
        t = div.offsetTop;
        //开关打开
        isDown = true;
    })

    window.addEventListener('mousemove',function(e){
        if (isDown == false || isEdit == false) {
            return;
        }
        //获取x和y
        var nx = e.clientX;
        var ny = e.clientY;
        //计算移动后的左偏移量和顶部的偏移量
        var nl = nx - (x - l);
        var nt = ny - (y - t);
    
        div.style.left = nl + 'px';
        div.style.top = nt + 'px';
    })
    div.addEventListener('mouseup',function(e){
        //开关关闭
        isDown = false;
        if(isEdit == false){
            return;
        }
        let allOverLays = map.getOverlays()
        allOverLays.map(item =>{
            if(item._data&&item._data.id == this.id){
                var x = parseInt(this.style.left) + 20
                var y = parseInt(this.style.top) + 20
                var pixel = {x,y}
                map.removeOverlay(item)

                dragSingleOverlay(4,$(this),pixel,data)
            }
        })
    })

    let pointPic = document.createElement('img')
    pointPic.className = 'pointPic'
    pointPic.src = 'img/icon_cam.png'

    let Title = document.createElement('h3')
    Title.className = 'pointTitle'
    TitleText = document.createTextNode(data.title)
    Title.appendChild(TitleText)

    let infoBox = createSingleCameraInfoBox(data)

    div.appendChild(pointPic)
    div.appendChild(infoBox)
    div.appendChild(Title)

    return div
}

// 创建项目编辑视图卡片
function createClass_5_Card(data) {
    var div = document.createElement('div')
    div.className = 'projectWrap'
    div.id = data.id

    //创建覆盖物拖拽
    var x = 0;
    var y = 0;
    var l = 0;
    var t = 0;
    var isDown = false;
    div.addEventListener('mousedown',function(e){
        //获取x坐标和y坐标
        x = e.clientX;
        y = e.clientY;
        //获取左部和顶部的偏移量
        l = div.offsetLeft;
        t = div.offsetTop;
        //开关打开
        isDown = true;
    })

    window.addEventListener('mousemove',function(e){
        if (isDown == false || isEdit == false) {
            return;
        }
        //获取x和y
        var nx = e.clientX;
        var ny = e.clientY;
        //计算移动后的左偏移量和顶部的偏移量
        var nl = nx - (x - l);
        var nt = ny - (y - t);
    
        div.style.left = nl + 'px';
        div.style.top = nt + 'px';
    })
    div.addEventListener('mouseup',function(e){
        //开关关闭
        isDown = false;
        if(isEdit == false){
            return;
        }
        let allOverLays = map.getOverlays()
        allOverLays.map(item =>{
            if(item._data&&item._data.id == this.id){
                var x = parseInt(this.style.left) + 20
                var y = parseInt(this.style.top) + 20
                var pixel = {x,y}
                map.removeOverlay(item)

                dragSingleOverlay(5,$(this),pixel,data)
            }
        })
    })

    let pointPic = document.createElement('img')
    pointPic.className = 'pointPic'
    pointPic.src = 'img/icon_pnt.png'

    let Title = document.createElement('h3')
    TitleText = document.createTextNode(data.title)
    Title.appendChild(TitleText)

    let infoBox = createCameraInfoBox(data)

    div.appendChild(pointPic)
    div.appendChild(infoBox)
    div.appendChild(Title)

    return div
}

//创建四级视图卡片
function createClass_6_Card(data) {
    var div = document.createElement('div')
    div.className = 'addVideoWrap'

    let pointPic = document.createElement('img')
    pointPic.className = 'pointPic'
    pointPic.src = 'img/icon_cam.png'

    let Title = document.createElement('h3')
    Title.className = 'pointTitle'
    TitleText = document.createTextNode(data.title)
    Title.appendChild(TitleText)

    let infoBox = createSingleCameraInfoBox(data)

    div.appendChild(pointPic)
    div.appendChild(infoBox)
    div.appendChild(Title)

    return div
}

// 创建项目信息框
let objectlist = {
    "mall":"商场",
    "construct":"工地",
    "office":"案场",
    "community":"社区",
    "other":"其他"
}
function createProjectInfoBox(data) {
    let info = document.createElement("div")
    info.className = 'project-info-box'

    let infoHead = document.createElement('h5')
    infoHead.className = 'clear'
    let infoHeadText = document.createTextNode('项目数')
    infoHead.appendChild(infoHeadText)

    let ProjectSum = document.createElement('span')
    let Sum = document.createTextNode(data.projectSum)
    ProjectSum.appendChild(Sum)
    infoHead.appendChild(ProjectSum)

    let projectList = document.createElement('ul')

    for(let i = 0; i < data.projectInfoList.length; i++){
        let li = document.createElement('li')
        let icon = document.createElement('img')
        icon.className = 'info-icon'
        icon.src = 'img/icon_'+ data.projectInfoList[i].projectName+'.png'
        li.appendChild(icon)
        let liSpan = document.createElement('span')
        liSpan.className = 'info-text'
        let liText = document.createTextNode(objectlist[data.projectInfoList[i].projectName])
        liSpan.appendChild(liText)
        li.appendChild(liSpan)
        let liNum = document.createElement('span')
        liNum.className = 'info-num'
        liNumText = document.createTextNode(data.projectInfoList[i].projectNum)
        liNum.appendChild(liNumText)
        li.appendChild(liNum)

        projectList.appendChild(li)
    }

    info.appendChild(infoHead)
    info.appendChild(projectList)

    return info;
}

// 创建摄像头信息框
function createCameraInfoBox(data) {
    let info = document.createElement("div")
    info.className = 'camera-info-box clear'

    let icon = document.createElement('img')
    icon.src = 'img/icon_'+data.sitetype+'_lg.png'
    info.appendChild(icon)

    let leftBox = document.createElement('div')
    leftBox.className = 'left-box'

    let infoHead = document.createElement('h5')
    infoHead.className = 'clear'
    let infoHeadText = document.createTextNode('摄像头数')
    infoHead.appendChild(infoHeadText)

    let CameraSum = document.createElement('span')
    let Sum = document.createTextNode(data.CameraNum)
    CameraSum.appendChild(Sum)
    infoHead.appendChild(CameraSum)

    leftBox.appendChild(infoHead)

    let companyName = document.createElement('div')
    companyName.className = 'companyName'
    let companyNameText = document.createTextNode(data.companyName)
    companyName.appendChild(companyNameText)

    leftBox.appendChild(companyName)

    info.appendChild(leftBox)

    return info;
}

//创建单个摄像头信息框
function createSingleCameraInfoBox(data) {
    let info = document.createElement("div")
    info.className = 'single-camera-info-box'

    let infoText = document.createTextNode(data.title)

    info.appendChild(infoText)

    return info;
}

// 视频搜索
function getVideoResult() {
    $('.search-result').show();
}

// 切割数组
function handleArrCut(arr,num) {
    let arrLength = arr.length; // 数组长度
    let newArr = [];
    let index = 0;
    for (let i = 0; i < arrLength; i++) {
        if (i % num === 0 && i !== 0) { // 可以被 10 整除
                newArr.push(arr.slice(index, i));
                index = i;
            };
            if ((i + 1) === arrLength) {
                newArr.push(arr.slice(index, (i + 1)));
            }
    };
    return newArr;
}

// 取随机数
function handleRandom(min,max) {
    return Math.floor(Math.random()*(max-min))+min
}

// 搜索激活
function handleSearchActive(el) {
    if($(el).val()){
        $(el).parent().addClass('active')
    }
}

// 关闭搜索结果
function handleCloseSearch(el) {
    $('.search-result').hide()
    $(el).prev().val('');
    $(el).parent().removeClass('active')
}

// 添加摄像头
function addVideo() {
    videoBindEdit()
    isEdit = true
    map.disableDragging()
    map.disableScrollWheelZoom()
    $('.edit-confirm').show()
    // addCenter = map.pointToPixel(map.getCenter())
    var maker = map.add
    $('.video-right-menu').hide()
    $('.add-video').show()
    $('.search').hide()
    $('.left-nav').hide()
}

//添加项目
function addProject() {
    projectBindEdit()
    isEdit = true
    map.disableDragging()
    map.disableScrollWheelZoom()
    $('.edit-confirm').show()
    // addCenter = map.pointToPixel(map.getCenter())
    $('.project-right-menu').hide()
    $('.add-project').show()
    $('.search').hide()
    $('.left-nav').hide()
}

// 编辑摄像头
function editVideo() {
    videoBindEdit()
    isEdit = true
    map.disableDragging()
    map.disableScrollWheelZoom()
    $('.video-right-menu').hide()
    $('.edit-confirm').show()
    $('.add-video').hide()
    $('.search').hide()
    $('.left-nav').hide()
}

//编辑项目
function editProject() {
    projectBindEdit()
    isEdit = true
    map.disableDragging()
    map.disableScrollWheelZoom()
    $('.project-right-menu').hide()
    $('.edit-confirm').show()
    $('.add-project').hide()
    $('.search').hide()
    $('.left-nav').hide()
}

// 勾选or取消覆盖物
function selectItem(viewClass,el) {
    el.click(function(){
        if($(this).hasClass('active')){
            $(this).removeClass('active');
            var id = $(this).attr('dataId')
            removeVideoOverlay(id)
        }else{
            $(this).addClass('active');
            addSingleOverlay(viewClass,$(this))
        }
    })
}

// 全选编辑覆盖物
function selectAllItem(viewClass) {
    var tags
    if(viewClass == 4){
       tags = $('.add-video .tab-content li')
    }else if(viewClass == 5){
        tags = $('.add-project .tab-content li')
    }
     
    map.clearOverlays()
    tags.map((item)=>{
        tags.eq(item).addClass('active')
        addSingleOverlay(viewClass,tags.eq(item))
    })
}

var r = 0.01 //取点半径
// 添加编辑覆盖物
function addSingleOverlay(viewClass,el,point={},data={}) {
    if(!point.lat && !point.lng){
        point.lat = handleRandom(addCenter.lat - r,addCenter.lat + r)
        point.lng = handleRandom(addCenter.lng - r,addCenter.lng + r)
    }
    if(!data.title && !data.id){
        var title = $(el).find('.item-name').text()
        var id = $(el).attr('dataId')
        var dataobj = {
            title:"会展湾东城广场一期",
            name:"会展湾东城广场一期",
            cityName:"深圳市",
            CameraNum:24,
            companyName:"深圳公司",
            sitetype: "mall"
        }
        var data = {...dataobj,title,id}
    }
    var mySquare = new SquareOverlay(point,data,viewClass);   
    map.addOverlay(mySquare);  
}


// 拖拽编辑覆盖物
function dragSingleOverlay(viewClass,el,pixel={},data={}){
    if(!pixel.x && !pixel.y){
        console.log(addCenter)
        pixel.x = handleRandom(addCenter.x - r,addCenter.x + r)
        pixel.y = handleRandom(addCenter.y - r,addCenter.y + r)
    }
    var point = map.overlayPixelToPoint(pixel)
    if(!data.title && !data.id){
        var title = $(el).find('.item-name').text()
        var id = $(el).attr('dataId')
        var dataobj = {
            title:"会展湾东城广场一期",
            name:"会展湾东城广场一期",
            cityName:"深圳市",
            CameraNum:24,
            companyName:"深圳公司",
            sitetype: "mall"
        }
        var data = {...dataobj,title,id}
    }
    var mySquare = new SquareOverlay(point,data,viewClass);   
    map.addOverlay(mySquare);  
}

//删除摄像头覆盖物
function removeVideoOverlay(id) {
    var overlays = map.getOverlays()
    overlays.map(item=>{
        if(item._data&&item._data.id == id){
            map.removeOverlay(item)
        }
    }) 
}

//关闭添加覆盖物
function addVideoClose() {
    $('.add-video').hide()
    $('.add-project').hide()
}

//保存覆盖物设置
function videoSave() {
    storageOverlays = map.getOverlays()
    videoRemoveEdit()
    projectRemoveEdit()
    map.enableDragging()
    map.enableScrollWheelZoom()
    isEdit = false
    $('.edit-confirm').hide()
    $('.add-video').hide()
    $('.add-project').hide()
    $('.search').show()
    $('.left-nav').show()
}

//取消覆盖物设置
function videoCancle() {
    videoRemoveEdit()
    projectRemoveEdit()
    map.enableDragging()
    map.enableScrollWheelZoom()
    isEdit = false
    $('.edit-confirm').hide()
    $('.add-video').hide()
    $('.add-project').hide()
    $('.search').show()
    $('.left-nav').show()
    var overlays = map.getOverlays()
    overlays.map(item=>{
        if(item._data&&item._data.id){
            map.removeOverlay(item)
        }
    }) 
}

// 项目绑定编辑状态
function projectBindEdit() {
    $('.cardWrap').addClass('projectWrap').removeClass('cardWrap')
}


//项目解除编辑状态
function projectRemoveEdit() {
    $('.projectWrap').addClass('cardWrap').removeClass('projectWrap')
}

// 摄像头绑定编辑状态
function videoBindEdit() {
    $('.videoWrap').addClass('addVideoWrap').removeClass('videoWrap')
}

//摄像头解除编辑状态
function videoRemoveEdit() {
    $('.addVideoWrap').addClass('videoWrap').removeClass('addVideoWrap')
}

//解析覆盖物坐标
function pointToPixel(overlay,fun) {
    var position,point;
    if(!overlay){
        return {x:-100000,y:-100000}
    }
    if(!overlay._point && overlay._data && overlay._data.name){
        var ls = new BMap.LocalSearch(overlay._data.cityName);
        ls.search(overlay._data.cityName+overlay._data.name);
        ls.setSearchCompleteCallback(function(rs){
            if(ls.getStatus() == BMAP_STATUS_SUCCESS){
                var poi = rs.getPoi(0);
                point = poi.point;
                position = map.pointToOverlayPixel(point); 
                fun({position,point})
            }
        })
    }else{
        position = map.pointToOverlayPixel(overlay._point);  
        point = overlay._point 
        fun({position,point})
    } 
}

// 定位地图
function fixedPos(point,zoom) {
    map.centerAndZoom(new BMap.Point(point.lng, point.lat),zoom)
}

//绑定视频弹出框事件
$('.swiper-body').delegate('.video-box div','click',function(){
    $('.videoPop').show()
})

//关闭视频弹窗
function closeVideo() {
    $('.videoPop').hide()
}

// 聚点
var d= 80
function accumulation(overlays,viewClass=7) {
    var _overlays   
    if(!overlays){
        _overlays = map.getOverlays()
    }else{
        _overlays = overlays
    }
    let posList = []
    _overlays.map(item => {
        var pos = {}
        if(item._data){
            pointToPixel(item,function({position,point}){
                pos.left = position.x%d == 0 ? position.x + d/2 : position.x + d/2 - position.x%d;
                pos.top = position.y%d == 0 ? position.y + d/2 : position.y + d/2 - position.y%d;
                pos.overlay = item
                posList.push(pos)
            })
        }
    })
    var flag = 0
    var data = []
    for(let i = 0; i < posList.length; i++){
        var az = ''
        for(let j =0; j < data.length; j++){
            if(data[j][0].left == posList[i].left && data[j][0].top == posList[i].top){
                flag = 1
                az = j
                break;
            }
        }
            if(flag == 1){
                data[az].push(posList[i])
                flag = 0
            }else if(flag == 0){
                var wdy = new Array()
                wdy.push(posList[i])
                data.push(wdy)
            }
    }
    var newOverlays = [];
    for(var i = 0; i < data.length; i++){
        newOverlays.push(mergeOverlay(data[i],viewClass))
    }
    return newOverlays
}

//合并覆盖物
function mergeOverlay(overlays,viewClass) {
    if(overlays.length == 1){
        return overlays[0].overlay
    }else if(overlays.length > 1){
        var _point={lat:0,lng:0};
        for(var i = 0; i < overlays.length; i++){
            pointToPixel(overlays[i].overlay,function({position,point}){
                _point.lat += point.lat
                _point.lng += point.lng
            })
            // _point.lat += point.lat
            // _point.lng += point.lng
        }
        console.log(_point)
        _point.lat /= overlays.length
        _point.lng /= overlays.length
        var data = {num :overlays.length}
        return new SquareOverlay(_point,data,viewClass)
    }
}

//创建摄像头合并覆盖物卡片
function create_merge_videoCard(data,center) {
    let div = document.createElement("div")
    div.className = 'mergeVideoCard'

    div.addEventListener('click',function(e){
        var point = new BMap.Point(center.lng,center.lat);
        var zoom = map.getZoom();
        map.centerAndZoom(point,zoom+1)
    })

    let pic = document.createElement('img')
    pic.src = 'img/icon_cam.png'
    
    let span = document.createElement('span')
    let spanText = document.createTextNode(data.num)
    span.appendChild(spanText)

    div.appendChild(pic)
    div.appendChild(span)

    return div
}

//创建项目合并覆盖物卡片
function create_merge_ProjectCard(data,center) {
    let div = document.createElement("div")
    div.className = 'mergeProjectCard'

    div.addEventListener('click',function(e){
        var point = new BMap.Point(center.lng,center.lat);
        var zoom = map.getZoom();
        map.centerAndZoom(point,zoom+1)
    })

    let pic = document.createElement('div')
    pic.className = 'merge-project-pic'
    let picText = document.createTextNode(data.num)
    pic.appendChild(picText)
    
    let span = document.createElement('span')
    let spanText = document.createTextNode(data.num+'个项目')
    span.appendChild(spanText)

    div.appendChild(pic)
    div.appendChild(span)

    return div
}

//项目筛选卡片
function create_objectScreenCard(data,center,) {
    let div = document.createElement("div")
    div.className = 'cardWrap'

    div.addEventListener('click',function(e){
        map.clearOverlays()
        e.stopPropagation()
        if(data.name){
            var gc = new BMap.Geocoder();
            gc.getPoint(data.name,function(rs){
                map.centerAndZoom(rs, 12);
            })
        }else{
            map.centerAndZoom(new BMap.Point(center.lng, center.lat), 12);
        }
        //二级视图显示区域标题
        $('.class_1').show();
        $('.class_2').show();
        $('.class_3').show();
        $('.main-title').show().text(data.title)
    })

    let pointPic = document.createElement('img')
    pointPic.className = 'pointPic'
    pointPic.src = 'img/icon_pnt.png'

    let Title = document.createElement('h3')
    TitleText = document.createTextNode(data.title)
    Title.appendChild(TitleText)

    let infoBox = createScreenInfoBox(data);

    div.appendChild(pointPic)
    div.appendChild(infoBox)
    div.appendChild(Title)

    return div
}

//创建筛选卡片弹层
var typeJson = {
    'community':'社区',
    'construction':'工地',
    'mall':'商场',
    'office':'案场',
    'other':'其他'
}
function createScreenInfoBox(data) {
    var _type
    if(!data.type){
        _type = 'other'
    }else{
        _type = data.type
    }

    var div = document.createElement('div')
    div.className = 'screen_info_box'
    
    var pic = document.createElement('img')
    pic.className = 'info_pic'
    pic.src = 'img/icon_'+_type+'_lg.png'

    var name = document.createElement('span')
    name.className = 'info_name'
    
    var nameText = document.createTextNode(typeJson[_type])
    name.appendChild(nameText)

    var num = document.createElement('span')
    num.className = 'info_num'

    var numText = document.createTextNode(data.projectSum)
    num.appendChild(numText)

    div.appendChild(pic)
    div.appendChild(num)
    div.appendChild(name)

    return div
}

// 同步摄像头
function synchro() {
    $('#comfirm').show()
}

function sure() {
    $('#comfirm').hide()
    $('#comfirmSure').show()
}

function cancle() {
    $('#comfirm').hide()
}

//确认同步
function comfirmSure() {
    $('#comfirmSure').hide()
}

//切换视频数量
function checkoutVideo(el) {
    $(el).addClass('active').siblings().removeClass('active')
}
