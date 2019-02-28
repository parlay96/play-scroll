/* ----------------------------U M D 写 法------------------*/
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(factory);
  } else if (typeof exports === 'object') {
    // Node, CommonJS之类的
    module.exports = factory();
  } else {
    // 浏览器全局变量(root 即 window)
    root.returnExports = factory();
  }
})(window, function () {
      var plScroll = function (plScrollId, options) {
        var _this = this;
        _this.isScrollBody = (!plScrollId || plScrollId === 'body'); // 滑动区域是否为body
        _this.scrollDom = _this.isScrollBody ? document.body : _this.getDomById(plScrollId); // Scroll的滑动区域
        _this.options = options || {}; // 配置
        var u = navigator.userAgent;
        var isIOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); // 是否为ios设备
        var isPC = typeof window.orientation === 'undefined'; // 是否为PC端
        var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1;// 是否为android端
        _this.os = { ios: isIOS, pc: isPC, android: isAndroid }
        _this.isDownScrolling = false; // 是否在执行下拉刷新的回调
        _this.isUpScrolling = false; // 是否在执行上拉加载的回调
        _this.xTranScroll()
        // 初始化判断滑向
        if (_this.options.yScroll && _this.options.xScroll) {
          console.log('上下拉， 左右滑不能同时进行')
          return '上下拉， 左右滑不能同时进行';
        } else if (_this.options.yScroll){
          _this.scrollDom.className = 'plyscroll plScroll';
          // 初始化下拉刷新
          _this.initDownScroll();
          // // 初始化上拉加载
          _this.initUpScroll();
        } else if (_this.options.xScroll) {
          _this.scrollDom.className = 'plxscroll plScroll plscroll-hardware';
          // 初始化左滑右滑
          _this.initLeftRightScroll();
        } else {
          console.log('未定义滑动方向')
          return '未定义滑动方向';
        }
      }
      // 上拉具体参数配置
      plScroll.prototype.extendUpScroll = function (optUp) {
        plScroll.extend(optUp, {
          use: true, // 是否需要上拉
          toTop: {
            src : null,
            offset : 200 ,
            warpClass : "plscroll-totop" ,
            showClass : "plscroll-fade-in" ,
            hideClass : "plscroll-fade-out" ,
            duration : 300 ,
            fadeDuration: 0.5,
          }
        })
      }
      // 下拉具体参数配置
      plScroll.prototype.extendDownScroll = function (optUp) {
        plScroll.extend(optUp, {
          warpClass: 'plscroll-downwarp',
          resetClass: 'plscroll-downwarp-reset',
          htmlContent: '<p class="downwarp-progress"></p><p class="downwarp-tip"></p>', // 布局内容
          outOffsetRate: 0.2,
          offset: 80,
          minAngle: 45,
          bottomOffset: 20,
          hardwareClass: 'plscroll-hardware', // 硬件加速样式,解决部分手机闪屏或动画不流畅的问题
          textInOffset: '下拉刷新', // 下拉的距离在offset范围内的提示文本
          textOutOffset: '释放更新', // 下拉的距离大于offset范围的提示文本
          textLoading: '加载中 ...', // 加载中的提示文本
          use: true, // 是否需要下拉
          inited: function (plScroll, downwarp) {
            // 下拉刷新初始化完毕的回调
            plScroll.downTipDom = downwarp.getElementsByClassName('downwarp-tip')[0];
            plScroll.downProgressDom = downwarp.getElementsByClassName('downwarp-progress')[0];
          },
          inOffset: function (plScroll) {
            // 下拉的距离进入offset范围内那一刻的回调
            if (plScroll.downTipDom) plScroll.downTipDom.innerHTML = plScroll.optDown.textInOffset;
            if (plScroll.downProgressDom) plScroll.downProgressDom.classList.remove('plScroll-rotate');
          },
          onMoving: function (plScroll, rate, downHight) {
            // 下拉过程中的回调,滑动过程一直在执行; rate下拉区域当前高度与指定距离的比值(inOffset: rate<1; outOffset: rate>=1); downHight当前下拉区域的高度
            if (plScroll.downProgressDom) {
              var progress = 360 * rate;
              plScroll.downProgressDom.style.webkitTransform = 'rotate(' + progress + 'deg)';
              plScroll.downProgressDom.style.transform = 'rotate(' + progress + 'deg)';
            }
          },
          outOffset: function (plScroll) {
            // 下拉的距离大于offset那一刻的回调
            if (plScroll.downTipDom) plScroll.downTipDom.innerHTML = plScroll.optDown.textOutOffset;
          },
          beforeLoading: function (plScroll, downwarp) {
            // 准备触发下拉刷新的回调
            return false; // 如果return true,将不触发showLoading和callback回调; 常用来完全自定义下拉刷新
          },
          showLoading: function (plScroll) {
          // 显示下拉刷新进度的回调
          if (plScroll.downTipDom) plScroll.downTipDom.innerHTML = plScroll.optDown.textLoading;
          if (plScroll.downProgressDom) plScroll.downProgressDom.classList.add('plscroll-rotate');
          },
          afterLoading: function (mescroll) {
            // 准备结束下拉的回调. 返回结束下拉的延时执行时间,默认0ms; 常用于结束下拉之前再显示另外一小段动画,才去隐藏下拉刷新的场景
            return 0
          },
          callback: function (plScroll) {
            // console.log(plScroll)
          }
        })
      }
      /* -------初始化上拉加载------- */
      plScroll.prototype.initUpScroll = function () {
        var _this = this;
        // 初始化配置参数
        _this.optUp = _this.options.up;
        _this.extendUpScroll(_this.optUp);
        var firstChild = _this.scrollDom.firstChild  // 需要滚动的子元素
        firstChild.id = 'contentBox'
        // 移动端手指按下事件
        _this.touchstartEvent = function (e) {
          if (_this.isScrollTo) {_this.preventDefault(e)} // 如果列表执行滑动事件,则阻止事件,优先执行scrollTo方法
          _this.startPoint = _this.getPoint(e); // 记录起点
          _this.lastPoint = _this.startPoint; // 重置上次move的点
          var bodyH = document.body.clientHeight || document.documentElement.clientHeight;
          _this.maxTouchmoveY = bodyH - _this.optDown.bottomOffset; // 手指触摸的最大范围(写在touchstart避免body获取高度为0的情况)
        }
        _this.scrollDom.addEventListener('touchstart', _this.touchstartEvent);
        // 移动端手指的滑动事件
        _this.touchmoveEvent = function (e) {
          var scrollTop = _this.getScrollDistance('y'); // 当前滚动条的距离
          var minDistance = _this.scrollDom.offsetHeight - firstChild.offsetHeight
          _this.inTouchend = false; // 标记不是touchend
          var curPoint = _this.getPoint(e)
          var moveY = curPoint.y - _this.startPoint.y; // 和起点比,移动的距离,大于0向下拉,小于0向上拉
          // 向下拉
          if (moveY > 0) {
            // 在顶部
            if (scrollTop <= 0) {
              _this.preventDefault(e); // 阻止浏览器默认的滚动,避免触发bounce
              if (_this.optDown.use && !_this.inTouchend && !_this.isDownScrolling) {
                // 下拉的角度是否在配置的范围内
                var x = Math.abs(_this.lastPoint.x - curPoint.x);
                var y = Math.abs(_this.lastPoint.y - curPoint.y);
                var z = Math.sqrt(x * x + y * y);
                if (z !== 0) {
                  var angle = Math.asin(y / z) / Math.PI * 180; // 两点之间的角度,区间 [0,90]
                  if (angle < _this.optDown.minAngle) return // 如果小于配置的角度,则不往下执行下拉刷新
                }
                // 如果手指的位置超过配置的距离,则提前结束下拉,避免Webview嵌套导致touchend无法触发
                if (_this.maxTouchmoveY > 0 && curPoint.y >= _this.maxTouchmoveY) {
                  _this.inTouchend = true; // 标记执行touchend
                  _this.touchendEvent(); // 提前触发touchend
                  return;
                }
                var diff = curPoint.y - _this.lastPoint.y; // 和上次比,移动的距离 (大于0向下,小于0向上)
                if (!_this.downHight) _this.downHight = 0; // 下拉区域的高度
                // 下拉距离  < 指定距离
                if (_this.downHight < _this.optDown.offset) {
                  if (_this.movetype !== 1) {
                    _this.movetype = 1; // 加入标记,保证只执行一次
                    _this.optDown.inOffset(_this); // 进入指定距离范围内那一刻的回调,只执行一次
                    _this.downwarp.classList.remove(_this.optDown.resetClass); // 移除高度重置的动画
                    _this.isMoveDown = true; // 标记下拉区域高度改变,在touchend重置回来
                    if (_this.os.ios) { // 下拉过程中,滚动条一直在顶部的,则不必取消回弹,否则会闪白屏
                      _this.scrollDom.classList.add(_this.optDown.hardwareClass); // 开启硬件加速,解决iOS下拉因隐藏进度条而闪屏的问题
                      _this.scrollDom.style.webkitOverflowScrolling = 'auto'; // 取消列表回弹效果,避免与下面me.downwarp.style.height混合,而导致界面抖动闪屏
                      _this.isSetScrollAuto = true; // 标记设置了webkitOverflowScrolling为auto
                    }
                  }
                  _this.downHight += diff;
                  // 指定距离  <= 下拉距离
                } else {
                  if (_this.movetype !== 2) {
                    _this.movetype = 2; // 加入标记,保证只执行一次
                    _this.optDown.outOffset(_this); // 下拉超过指定距离那一刻的回调,只执行一次
                    _this.downwarp.classList.remove(_this.optDown.resetClass); // 移除高度重置的动画
                    _this.isMoveDown = true; // 标记下拉区域高度改变,在touchend重置回来
                    if (_this.os.ios) { // 下拉过程中,滚动条一直在顶部的,则不必取消回弹,否则会闪白屏
                      _this.scrollDom.classList.add(_this.optDown.hardwareClass); // 开启硬件加速,解决iOS下拉因隐藏进度条而闪屏的问题
                      _this.scrollDom.style.webkitOverflowScrolling = 'auto'; // 取消列表回弹效果,避免与下面me.downwarp.style.height混合,而导致界面抖动闪屏
                      _this.isSetScrollAuto = true; // 标记设置了webkitOverflowScrolling为auto
                    }
                  }
                  if (diff > 0) { // 向下拉
                    _this.downHight += diff * _this.optDown.outOffsetRate; // 越往下,高度变化越小
                  } else { // 向上收
                    _this.downHight += diff; // 向上收回高度,则向上滑多少收多少高度
                  }
                }
                _this.downwarp.style.height = _this.downHight + 'px'; // 实时更新下拉区域高度
                var rate = _this.downHight / _this.optDown.offset; // 下拉区域当前高度与指定距离的比值
                _this.optDown.onMoving(_this, rate, _this.downHight); // 下拉过程中的回调,一直在执行
              }
            }
            // 向上拉
          } else if (moveY < 0) {
            var scrollHeight = _this.scrollDom.scrollHeight; // 滚动内容的高度
            var clientHeight =  _this.scrollDom.clientHeight; // 滚动容器的高度
            var toBottom = scrollHeight - clientHeight - scrollTop; // 滚动条距离底部的距离
            // 在底部
            if (toBottom <= 0) {
              _this.preventDefault(e); // 阻止浏览器默认的滚动,避免触发bounce
            }
          }
          _this.lastPoint = curPoint; // 记录本次移动的点
        }
        _this.scrollDom.addEventListener('touchmove', _this.touchmoveEvent, {
          passive: false
        });
        // 移动端手指抬起事件
        _this.touchendEvent = function (e) {
          // 如果下拉区域高度已改变,则需重置回来
          if (_this.optDown.use && _this.isMoveDown) {
            if (_this.downHight >= _this.optDown.offset) {
              // 符合触发刷新的条件
              _this.triggerDownScroll();
            } else {
              // 不符合的话 则重置
              _this.downwarp.classList.add(_this.optDown.resetClass); // 加入高度重置的动画,过渡平滑
              _this.downHight = 0;
              _this.downwarp.style.height = 0;
            }
            if (_this.isSetScrollAuto) {
              _this.scrollDom.style.webkitOverflowScrolling = 'touch';
              _this.scrollDom.classList.remove(_this.optDown.hardwareClass);
              _this.isSetScrollAuto = false;
            }
            _this.movetype = 0;
            _this.isMoveDown = false;
          }
        }
        _this.scrollDom.addEventListener('touchend', _this.touchendEvent); // 移动端手指抬起事件
        _this.scrollDom.addEventListener('touchcancel', _this.touchendEvent); // 移动端系统停止跟踪触摸
      }
      /* 重置上拉加载列表为第一页
         *isShowLoading 是否显示进度布局;
         * 1.默认null,不传参,则显示上拉加载的进度布局
         * 2.传参true, 则显示下拉刷新的进度布局
         * 3.传参false,则不显示上拉和下拉的进度 (常用于静默更新列表数据)
     */
      plScroll.prototype.resetUpScroll = function (isShowLoading) {
        if (this.optUp && this.optUp.use) {
          // var page = this.optUp.page;
          // this.prePageNum = page.num; // 缓存重置前的页码,加载失败可退回
          // this.prePageTime = page.time; // 缓存重置前的时间,加载失败可退回
          // page.num = 1; // 重置为第一页
          // page.time = null; // 重置时间为空
          // if (!this.isDownScrolling && isShowLoading !== false) { // 如果不是下拉刷新触发的resetUpScroll并且不配置列表静默更新,则显示进度;
          //   if (isShowLoading == null) {
          //     this.removeEmpty(); // 移除空布局
          //     this.clearDataList(); // 先清空列表数据,才能显示到上拉加载的布局
          //     this.showUpScroll(); // 不传参,默认显示上拉加载的进度布局
          //   } else {
          //     this.showDownScroll(); // 传true,显示下拉刷新的进度布局,不清空列表
          //   }
          // }
          // this.isUpAutoLoad = true; // 标记上拉已经自动执行过,避免初始化时多次触发上拉回调
          // this.optUp.callback && this.optUp.callback(page, this); // 执行上拉回调
        }
      }
      /* 触发下拉刷新 */
      plScroll.prototype.triggerDownScroll = function () {
          if (!this.optDown.beforeLoading(this, this.downwarp)) { // 准备触发下拉的回调,return true则处于完全自定义状态;默认return false;
            this.showDownScroll(); // 下拉刷新中...
            this.optDown.callback && this.optDown.callback(this); // 执行回调,联网加载数据
          }
      }
      /* 结束下拉刷新 */
      plScroll.prototype.endDownScroll = function () {
        var _this = this;
        // 结束下拉刷新的方法
        var endScroll = function () {
          _this.downHight = 0;
          _this.downwarp.style.height = 0;
          _this.isDownScrolling = false;
          if (_this.downProgressDom) _this.downProgressDom.classList.remove('plscroll-rotate');
        }
        // 结束下拉刷新时的回调
        var delay = _this.optDown.afterLoading(_this); // 结束下拉刷新的延时,单位ms
        if (typeof delay === 'number' && delay > 0) {
          setTimeout(endScroll, delay);
        } else {
          endScroll();
        }
      }
      /* 显示下拉进度布局 */
      plScroll.prototype.showDownScroll = function () {
        this.isDownScrolling = true; // 标记下拉中
        this.optDown.showLoading(this); // 下拉刷新中...
        this.downHight = this.optDown.offset; // 更新下拉区域高度
        this.downwarp.classList.add(this.optDown.resetClass); // 加入高度重置的动画,过渡平滑
        this.downwarp.style.height = this.optDown.offset + 'px'; // 调整下拉区域高度
      }
      /* -------初始化下拉刷新------- */
      plScroll.prototype.initDownScroll = function () {
        var _this = this;
        // 初始化配置参数
        _this.optDown = _this.options.down;
        _this.extendDownScroll(_this.optDown);
        if (_this.optDown.use) {
          _this.downwarp = document.createElement('div');
          _this.downwarp.className = _this.optDown.warpClass;
          _this.downwarp.innerHTML = '<div class="downwarp-content">' + _this.optDown.htmlContent + '</div>';
          _this.scrollDom.insertBefore(_this.downwarp, _this.scrollDom.firstChild);
          // 初始化完毕的回调
          setTimeout(function () { // 待主线程执行完毕再执行,避免new MeScroll未初始化,在回调获取不到mescroll的实例
            _this.optDown.inited(_this, _this.downwarp);
          }, 0)
        }
        //  列表滑动监听
        _this.scrollDom.addEventListener("scroll", function (e) {
          var scrollTop = _this.getScrollDistance('y'); // 当前滚动条的距离
          // 返回 onScroll 列表滑动监听
          if (typeof _this.optUp.onScroll === 'function') {
            _this.optUp.onScroll(_this, scrollTop);
          }
          // 顶部按钮的显示隐藏
          var optTop = _this.optUp.toTop;
          if (optTop.src) {
            if (scrollTop >= optTop.offset) {
              _this.showTopBtn();
            } else {
              _this.hideTopBtn();
            }
          }
        })
      }
      /* 根据点击滑动事件获取第一个手指的坐标 */
      plScroll.prototype.getPoint = function (e) {
          return {
            x: e.touches ? e.touches[0].pageX : e.clientX,
            y: e.touches ? e.touches[0].pageY : e.clientY
          }
       }
      /* --------回到顶部的按钮-------- */
      plScroll.prototype.showTopBtn = function () {
         if (!this.topBtnShow) {
           this.topBtnShow = true; // 标记显示
           var _this = this;
           var optTop = _this.optUp.toTop; // 回到顶部的配置
           if (_this.toTopBtn == null) {
             _this.toTopBtn = document.createElement('img');
             _this.toTopBtn.src = optTop.src;
             _this.toTopBtn.className = optTop.warpClass;
             document.body.appendChild(_this.toTopBtn);
             _this.toTopBtn.onclick = function () {
               _this.scrollTo(0, optTop.duration); // 置顶
             }
           }
           // 显示--淡入动画
           _this.toTopBtn.classList.remove(optTop.hideClass);
           _this.toTopBtn.classList.add(optTop.showClass);
           _this.toTopBtn.style.animationDuration = optTop.fadeDuration;
           _this.toTopBtn.style.webkitAnimationDuration =  optTop.fadeDuration;
         }
      }
      /* 隐藏回到顶部的按钮 */
      plScroll.prototype.hideTopBtn = function () {
        if (this.topBtnShow && this.toTopBtn) {
          this.topBtnShow = false;
          var optTop = this.optUp.toTop; // 回到顶部的配置
          this.toTopBtn.classList.remove(this.optUp.toTop.showClass);
          this.toTopBtn.classList.add(this.optUp.toTop.hideClass);
          this.toTopBtn.style.animationDuration = optTop.fadeDuration;
          this.toTopBtn.style.webkitAnimationDuration =  optTop.fadeDuration;
        }
      }
      /* 滑动列表到指定位置--带缓冲效果 (y=0回到顶部;如果要滚动到底部可以传一个较大的值,比如99999);t时长,单位ms,默认300 */
      plScroll.prototype.scrollTo = function (y, t) {
        var _this = this;
        var star = _this.getScrollDistance('y');
        var end = y;
        if (end > 0) {
          var maxY = _this.scrollDom.scrollHeight - _this.scrollDom.clientHeight; // y的最大值
          if (end > maxY) end = maxY; // 不可超过最大值
        } else {
          end = 0; // 不可小于0
        }
         _this.isScrollTo = true; // 标记在滑动中,阻止列表的触摸事件
         _this.scrollDom.style.webkitOverflowScrolling = 'auto';
         _this.getStep(star, end, function (step) {
           _this.scrollDom.scrollTop = step;
          if (step === end) {
            _this.scrollDom.style.webkitOverflowScrolling = 'touch';
            _this.isScrollTo = false;
          }
        }, t)
      }
      /* 计步器
        star: 开始值
        end: 结束值
        callback(step,timer): 回调step值,计步器timer,可自行通过window.clearInterval(timer)结束计步器;
        t: 计步时长,传0则直接回调end值;不传则默认300ms
        rate: 周期;不传则默认30ms计步一次
        * */
      plScroll.prototype.getStep = function (star, end, callback, t, rate) {
        var diff = end - star; // 差值
        // 如果不存在滚动，或者滚动时长为0 ，则直接滚到结束位置 不执行动画
        if (t === 0 || diff === 0) {
          callback && callback(end);
          return '';
        } else {
          t = t || 300; // 时长 300ms
          rate = rate || 30; // 周期 30ms
          var count = t / rate; // 次数
          var step = diff / count; // 步长
          var i = 0; // 计数
          var timer = window.setInterval(function () {
            if (i < count - 1) {
              star += step;
              callback && callback(star, timer);
              i++;
            } else {
              callback && callback(end, timer); // 最后一次直接设置end,避免计算误差
              window.clearInterval(timer);
            }
          }, rate);
        }
      }
      // 左滑右滑具体参数配置
      plScroll.prototype.extendLeftRightScroll = function (optLeftRight) {
        plScroll.extend(optLeftRight, {
          springback: true, // 是否需要回弹 true 回弹 || false 不回弹
          springbackNum: 150, // 回弹的最大范围
          scrollbar: true, // 隐藏滚动条
        })
      }
      /* 配置参数 */
      plScroll.extend = function (userOption, defaultOption) {
        if (!userOption) return defaultOption;
        for (var key in defaultOption) {
          if (userOption[key] == null) {
            userOption[key] = defaultOption[key];
          } else if (typeof userOption[key] === 'object') {
            plScroll.extend(userOption[key], defaultOption[key]); // 深度匹配
          }
        }
        return userOption;
      }
      /* -------初始化左滑右滑------- */
      plScroll.prototype.initLeftRightScroll = function () {
        var _this = this;
        // 配置参数
        _this.optLeftRight = _this.options.LeftRight;
        // 初始化配参数配置
        _this.extendLeftRightScroll(_this.optLeftRight);
        var firstChild = _this.scrollDom.firstChild  // 需要滚动的子元素
        var firstChildWidth = firstChild.offsetWidth
        // 隐藏滚动条
        if (_this.optLeftRight.scrollbar) {
          var conBox = document.createElement('div');
          conBox.id = 'conBox';
          //  _this.scrollDom.parentNode父亲的节点
          _this.scrollDom.parentNode.insertBefore(conBox, _this.scrollDom)
          conBox.appendChild(_this.scrollDom);
          var nums = (_this.scrollDom.offsetHeight - firstChild.offsetHeight) + 10
          _this.scrollDom.style.top = nums + 'px'
          _this.scrollDom.style.marginTop = -nums + 'px'
        }
        // 滑动元素初始化配置
        _this.xInitParameters = {
          transitionTime: ".5", // 动画时间
          xstart: 0,
          xdifference: 0,
          xisMove: false,
          xmaxTranslate: 0,
          xminTranslate: _this.scrollDom.offsetWidth - firstChild.offsetWidth,
          moveX: 0,
        }
        //  列表滑动监听
        _this.scrollDom.addEventListener("scroll", function (e) {
          // 返回 onScroll 列表滑动监听
          if (typeof _this.optLeftRight.onScroll === 'function') {
            var scrollLeft = _this.getScrollDistance('x'); // 当前滚动条的距离
            _this.optLeftRight.onScroll(_this, scrollLeft);
          }
        })
        // 以下变量主要用于拿取当scrollLeft为0或者为最大值时对应的移动距离；计算回弹距离
        // kaiguan num （右拉计算变量,num滚动条初次进入判断的滑动距离） kaiguan2 num2（左拉计算变量）
        // initX 保存我当前往左拉动了多少（解决滚动条距离会减去我当前左移动的距离，导致我拿到的滚动条距离不准确）
        var kaiguan = true;var num = -1;var kaiguan2 = true;var num2 = -1;
        // 当在屏幕上按下手指时触发
        _this.scrollDom.addEventListener("touchstart", function (e) {
          _this.xInitParameters.xstart = e.touches[0].clientX;
        })
        // 当在屏幕上移动手指时触发
        _this.scrollDom.addEventListener("touchmove", function (e) {
          var minDistance = _this.scrollDom.offsetWidth - firstChild.offsetWidth
          if (minDistance < 0) {
              _this.xInitParameters.xisMove = true;
              var scrollLeft = _this.getScrollDistance('x'); // 当前滚动条的距离
              var clientX2 = e.touches[0].clientX;
              _this.xInitParameters.xdifference = clientX2 - _this.xInitParameters.xstart; // 滑动的距离
              var xmins = Math.abs(_this.xInitParameters.xminTranslate)
              var minxs = Math.abs(_this.xInitParameters.xminTranslate) + _this.optLeftRight.springbackNum // 最小滑动距离
              // 回弹效果
              if (_this.optLeftRight.springback &&  _this.os.android) {
                _this.removeTransition(firstChild) //拖动时候屏蔽动画
                // 右拉
                if (scrollLeft <= 0 && _this.xInitParameters.xdifference > 0) {
                  if (kaiguan) {num = _this.xInitParameters.xdifference;kaiguan = false}
                  // 小于等于回弹最大宽度 则让右拉
                  if ((Math.abs(_this.xInitParameters.xdifference) - Math.abs(num)) <= _this.optLeftRight.springbackNum) {
                    var nums = num >= 0 ? _this.xInitParameters.xdifference - num : _this.xInitParameters.xdifference
                    _this.translateX(firstChild, nums)
                  }
                  if ((Math.abs(_this.xInitParameters.xdifference) - Math.abs(num)) > _this.optLeftRight.springbackNum) {
                    _this.translateX(firstChild, _this.optLeftRight.springbackNum)
                  }
                  // 左拉
                } else if (minxs >= scrollLeft && scrollLeft >= xmins && _this.xInitParameters.xdifference < 0) {
                  if (kaiguan2) {num2 = _this.xInitParameters.xdifference;kaiguan2 = false}
                  var juli = Math.abs(_this.xInitParameters.xdifference) - Math.abs(num2)
                  // 小于等于回弹最大宽度 则让左拉
                  if (juli <= _this.optLeftRight.springbackNum) {
                    firstChild.style.width = firstChildWidth + Math.abs(juli) + 'px'
                    _this.scrollDom.scrollLeft = Math.abs(_this.xInitParameters.xminTranslate) + Math.abs(juli)
                  } else if (juli > _this.optLeftRight.springbackNum){
                    firstChild.style.width = firstChildWidth + _this.optLeftRight.springbackNum + 'px'
                    _this.scrollDom.scrollLeft = Math.abs(_this.xInitParameters.xminTranslate) + _this.optLeftRight.springbackNum
                  }
                }
                // 不需要回弹
              } else {
                if (_this.optLeftRight.springback === false) {
                  // 右滑
                  if (_this.xInitParameters.xdifference > 0) {
                    if (scrollLeft <= 0) {
                      _this.preventDefault(e); // 阻止浏览器默认的滚动,避免触发bounce
                    }
                    // 左滑
                  } else if (_this.xInitParameters.xdifference < 0) {
                    if (scrollLeft >= xmins) {
                      _this.preventDefault(e); // 阻止浏览器默认的滚动,避免触发bounce
                    }
                  }
                }
              }
              // 左右滑阻止外面滑动
              window.addEventListener('touchmove', _this.bounceTouchmove, {
                passive: false
              });
          }
        })
        // 当在屏幕上抬起手指时触发
        _this.scrollDom.addEventListener("touchend", function (e) {
          if (!_this.xInitParameters.xisMove) {
            return;
          }
          // 回弹动画
          if (_this.optLeftRight.springback) {
            if (kaiguan === false) {
              _this.translateX(firstChild, 0)
              _this.addTransition(firstChild, false, parseFloat(_this.xInitParameters.transitionTime) + "s");
              kaiguan = true;
              num = -1;
            } else if (kaiguan2 === false) {
              firstChild.style.width = firstChildWidth + 'px'
              _this.addTransition(firstChild, 'width', parseFloat(_this.xInitParameters.transitionTime) + "s");
              kaiguan2 = true;
              num2 = -1;
            }
          }
          _this.xInitParameters.xisMove = false;
          // 左右滑结束取消阻止外面滑动
          window.removeEventListener('touchmove', _this.bounceTouchmove);
        })
      }
      /* 阻止浏览器默认滚动事件 */
      plScroll.prototype.preventDefault = function (e) {
        // cancelable:是否可以被禁用; defaultPrevented:是否已经被禁用
        if (e && e.cancelable && !e.defaultPrevented) e.preventDefault()
      }
      // 阻止默认事件
      plScroll.prototype.bounceTouchmove = function (e) {
        var el = e.target;
        // 当前touch的元素及父元素是否要拦截touchmove事件
        var isPrevent = true;
        while (el !== document.body && el !== document) {
          var cls = el.classList;
          if (cls) {
              if (cls.contains('plxscroll')) {
                 isPrevent = false; // 如果是指定条件的元素,则无需拦截touchmove事件
                 break;
              }
           }
          el = el.parentNode; // 继续检查其父元素
        }
          if (isPrevent) e.preventDefault();
      }
      /* 查找dom元素 */
      plScroll.prototype.getDomById = function (id) {
        var dom;
        if (id) {
          if (typeof id === 'string') {
            dom = document.getElementById(id); // 如果是String,则根据id查找
          } else if (id.nodeType) {
            dom = id; // 如果是dom对象,则直接赋值
          }
        }
        if (!dom) console.error('id为: ' + id + '找不到');
        return dom;
      }
      /* 滚动条的位置 */
      plScroll.prototype.getScrollDistance = function (shaft) {
        if (this.isScrollBody) {
          if (shaft === 'x') {
            return document.documentElement.scrollLeft || document.body.scrollLeft;
          } else if (shaft === 'y'){
            return document.documentElement.scrollTop || document.body.scrollTop;
          }
        } else {
          if (shaft === 'x') {
            return this.scrollDom.scrollLeft
          } else if (shaft === 'y'){
            return this.scrollDom.scrollTop;
          }
        }
      }
      // 动画属性
      plScroll.prototype.xTranScroll = function () {
      var _this = this;
      _this.translateX = function (dom, x) {
        dom.style["transform"] = "translateX(" + x + "px)";
        dom.style["webkitTransform"] = "translateX(" + x + "px)";
      }
      _this.translateY = function (dom, y) {
        dom.style["transform"] = "translateY(" + y + "px)";
        dom.style["webkitTransform"] = "translateY(" + y + "px)";
      }
      _this.removeTransition = function (dom) {
        dom.style.transition = "none";
        dom.style.webkitTransition = "none";
      }
      _this.addTransition = function (dom,type,timer) {
        dom.style.transition = type ? type + ' '+  timer : timer
        dom.style.webkitTransition = type ? type + ' '+  timer : timer
      }
    }
      /* 销毁plScroll */
      plScroll.prototype.destroy = function () {
        var _this = this;
        // 移除下拉布局,移除事件
        _this.scrollDom.removeEventListener('touchstart', _this.touchstartEvent); // 移动端手指事件
        _this.scrollDom.removeEventListener('touchmove', _this.touchmoveEvent); // 移动端手指事件
        _this.scrollDom.removeEventListener('touchend', _this.touchendEvent); // 移动端手指事件
        _this.removeChild(_this.toTopBtn); // 回到顶部按钮
      }
      /* 删除dom元素 */
      plScroll.prototype.removeChild = function (dom) {
      if (dom) {
        var parent = dom.parentNode;
        parent && parent.removeChild(dom);
        dom = null;
       }
      }
      // 暴露公共方法
      return plScroll;
});
