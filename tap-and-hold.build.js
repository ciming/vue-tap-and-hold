(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.vueTapAndHold = factory());
}(this, (function () { 'use strict';

/* eslint-disable */
/* eslint-disable */
var touchStart = false;
var startTime = 0;
var pos = {
  start: null,
  move: null,
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
    el.modifiers = el.modifiers || modifiers;
    if (!el.listeners[evt]) {
      el.listeners[evt] = [handler];
    } else {
      el.listeners[evt].push(handler);
    }
    var proxy = function proxy(e) {
      if (handler) {
        handler.call(null, e.detail.originEvent);
      }
      if (el.modifiers && el.modifiers.prevent) e.preventDefault();
      if (el.modifiers && el.modifiers.stop) e.stopPropagation();
    };
    if (el.listeners[evt]) {
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
  holdTime: 650,
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
    touchStart = false;
    pos = {
      start: null,
      move: null,
      end: null
    };
  }
};

var holdTimer = null;
var tapTimer = null;
var prevTappedPos = null;
var gestures = {
  tap: function tap(evt) {
    var el = evt.target;
    var now = Date.now();
    var touchTime = now - startTime;
    var distance = utils.getDistance(pos.start[0], pos.move ? pos.move[0] : pos.start[0]);
    clearTimeout(holdTimer);
    if (config.tapMaxDistance < distance) return false;
    if (config.holdTime > touchTime && utils.getFingers(evt) <= 1) {
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
      if (!pos.start) {
        pos.start = utils.getPosOfEvent(evt);
      }
      startTime = Date.now();
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
var vueTapAndHold = {
  init: function init() {
    var mouseEvents = 'mouseup mousedown mousemove mouseout';
    var touchEvents = 'touchstart touchmove touchend touchcancel';
    var bindingEvents = utils.hasTouch ? touchEvents : mouseEvents;
    bindingEvents.split(' ').forEach(function (evt) {
      document.addEventListener(evt, handlerOriginEvent, false);
    });
  },
  install: function install(Vue) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    config = Object.assign(config, options);
    this.init();
    Vue.directive('tap', {
      isFn: true,
      acceptStatement: true,
      bind: function bind(el, binding) {
        engine.bind(el, 'tap', binding.value, binding.modifiers);
      },
      unbind: function unbind(el, binding) {
        engine.unbind(el, 'tap', binding.value);
      }
    });
    Vue.directive('hold', {
      isFn: true,
      acceptStatement: true,
      bind: function bind(el, binding) {
        el.ontouchstart = function (e) {
          e.preventDefault();
        };
        engine.bind(el, 'hold', binding.value, binding.modifiers);
      },
      unbind: function unbind(el, binding) {
        engine.unbind(el, 'hold', binding.value);
      }
    });
  }
};

return vueTapAndHold;

})));
