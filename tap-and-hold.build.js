(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.vueTapAndHold = factory());
}(this, (function () { 'use strict';

var touchStart = false;
var pos = {
  start: null,
  end: null
};

var engine = {
  proxyid: 0,
  proxies: [],
  trigger: function trigger(el, evt, detail) {
    var e = void 0;
    var opt = {
      bubbles: true,
      cancelable: true,
      detail: detail || {}
    };
    try {
      e = new CustomEvent(evt, opt);
      if (el) {
        el.dispatchEvent(e, opt);
      }
    } catch (ex) {
      console.warn('It is not supported by environment.');
    }
  },
  bind: function bind(el, evt, handler, modifiers) {
    el.listeners = el.listeners || {};
    if (!el.listeners[evt]) {
      el.listeners[evt] = [handler];
    } else {
      el.listeners[evt].push(handler);
    }
    var proxy = function proxy(e) {
      if (modifiers) {
        if (modifiers.prevent) e.stopPropagation();
        if (modifiers.stop) e.stopPropagation();
      }
      handler.call(e.target, e);
    };
    if (el.addEventListener) {
      el.addEventListener(evt, proxy, false);
    }
  },
  unbind: function unbind(el, evt) {
    var handlers = el.listeners[evt];
    if (handlers && handlers.length) {
      handlers.forEach(function (handler) {
        el.removeEventListener(evt, handler, false);
      });
    }
  }
};
var config = {
  holdTime: 1000,
  tapMaxDistance: 10,
  tapTime: 200
};
var utils = {
  PCevts: {
    'touchstart': 'mousedown',
    'touchmove': 'mousemove',
    'touchend': 'mouseup',
    'touchcancel': 'mouseout'
  },
  hasTouch: 'ontouchstart' in window,
  getDistance: function getDistance(pos1, pos2) {
    var x = pos2.x - pos1.x;
    var y = pos2.y - pos1.y;
    return Math.sqrt(x * x + y * y);
  },
  getPosOfEvent: function getPosOfEvent(evt) {
    if (this.hasTouch) {
      var posi = [];
      var src = null;
      for (var t = 0, len = evt.touches.length; t < len; t++) {
        src = evt.touches[t];
        posi.push({
          x: src.pageX,
          y: src.pageY
        });
      }
      return posi;
    } else {
      return [{
        x: evt.pageX,
        y: evt.pageY
      }];
    }
  },
  getFingers: function getFingers(ev) {
    return ev.touches ? ev.touches.length : 1;
  },
  reset: function reset() {
    pos = {};
  }
};

var holdTimer = null;
var tapTimer = null;
var prevTappedPos = null;
var gestures = {
  tap: function tap(evt) {
    var el = evt.target;
    var distance = utils.getDistance(pos.start[0], pos.move ? pos.move[0] : pos.start[0]);
    clearTimeout(holdTimer);
    if (config.tapMaxDistance < distance) return false;
    if (config.holdTime > distance && utils.getFingers(evt) <= 1) {
      prevTappedPos = pos.start[0];
      tapTimer = setTimeout(function () {
        engine.trigger(el, 'tap', {
          type: 'tap',
          originEvent: evt,
          fingersCount: utils.getFingers(evt),
          position: prevTappedPos
        }, config.tapTime);
      });
    }
  },
  hold: function hold(evt) {
    var el = evt.target;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(function () {
      if (!pos.start) return false;
      var distance = utils.getDistance(pos.start[0], pos.move ? pos.move[0] : pos.start[0]);
      if (config.tapMaxDistance < distance) return false;
      engine.trigger(el, 'hold', {
        type: 'hold',
        originEvent: evt,
        fingersCount: utils.getFingers(evt),
        position: pos.start[0]
      });
    }, config.holdTime);
  }
};
var handlerOriginEvent = function handlerOriginEvent(evt) {
  switch (evt.type) {
    case 'touchstart':
    case 'mousedown':
      touchStart = true;
      if (!pos.start || pos.start.length < 2) {
        pos.start = utils.getPosOfEvent(evt);
      }
      
      
      gestures.hold(evt);
      break;
    case 'touchmove':
    case 'mousemove':
      if (!touchStart || !pos.start) return false;
      pos.move = utils.getPosOfEvent(evt);
      break;
    case 'touchend':
    case 'touchcancel':
    case 'mouseup':
    case 'mouseout':
      if (!touchStart) return false;
      
      gestures.tap(evt);
      utils.reset();
      if (evt.touches && evt.touches.length === 1) {
        touchStart = true;
      }
      break;
  }
};
var touchTap = {
  init: function init() {
    var mouseEvents = 'mouseup mousedown mousemove mouseout';
    var touchEvents = 'touchstart touchmove touchend touchcancel';
    var bindingEvents = utils.hasTouch ? touchEvents : mouseEvents;
    bindingEvents.split(' ').forEach(function (evt) {
      document.addEventListener(evt, handlerOriginEvent, false);
    });
  },
  install: function install(Vue) {
    this.init();
    Vue.directive('tap', {
      isFn: true,
      acceptStatement: true,
      bind: function bind(el, binding) {
        engine.bind(el, 'tap', binding.value, binding.modifiers);
      },
      unbind: function unbind(el) {
        engine.unbind(el, 'tap');
      }
    });
    Vue.directive('hold', {
      isFn: true,
      acceptStatement: true,
      bind: function bind(el, binding) {
        engine.bind(el, 'hold', binding.value, binding.modifiers);
      },
      unbind: function unbind(el) {
        engine.unbind(el, 'hold');
      }
    });
  },
  _on: function _on(el, evt, handler) {
    engine.bind(el, evt, handler);
  }
};

return touchTap;

})));
