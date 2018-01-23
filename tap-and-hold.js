let touchStart = false
let startTime = 0
let startEvent = null
let endEvent = null
let pos = {
  start: null,
  end: null
}

const engine = {
  proxyid: 0,
  proxies: [],
  trigger (el, evt, detail) {
    let e
    const opt = {
      bubbles: true,
      cancelable: true,
      detail: detail || {}
    }
    try {
      e = new CustomEvent(evt, opt)
      if (el) {
        el.dispatchEvent(e, opt)
      }
    } catch (ex) {
      console.warn('It is not supported by environment.')
    }
  },
  bind (el, evt, handler, modifiers) {
    el.listeners = el.listeners || {}
    el.modifiers = el.modifiers || modifiers
    if (!el.listeners[evt]) {
      el.listeners[evt] = [handler]
    } else {
      el.listeners[evt].push(handler)
    }
    const proxy = e => {
      handler.call(e.target, e)
      if (el.modifiers && el.modifiers.prevent) e.preventDefault();
      if (el.modifiers && el.modifiers.stop) e.stopPropagation();
    }
    if (el.addEventListener) {
      el.addEventListener(evt, proxy, false)
    }
  },
  unbind (el, evt) {
    const handlers = el.listeners[evt]
    if (handlers && handlers.length) {
      handlers.forEach(handler => {
        el.removeEventListener(evt, handler, false)
      })
    }
  }
}
let config = {
  holdTime: 1000,
  tapMaxDistance: 10,
  tapTime: 200
}
const utils = {
  PCevts: {
    'touchstart': 'mousedown',
    'touchmove': 'mousemove',
    'touchend': 'mouseup',
    'touchcancel': 'mouseout'
  },
  hasTouch: ('ontouchstart' in window),
  getDistance (pos1, pos2) {
    const x = pos2.x - pos1.x
    const y = pos2.y - pos1.y
    return Math.sqrt((x * x) + (y * y))
  },
  getPosOfEvent (evt) {
    if (this.hasTouch) {
      const posi = []
      let src = null
      for (var t = 0, len = evt.touches.length; t < len; t++) {
        src = evt.touches[t]
        posi.push({
          x: src.pageX,
          y: src.pageY
        })
      }
      return posi
    } else {
      return [{
        x: evt.pageX,
        y: evt.pageY
      }]
    }
  },
  getFingers (ev) {
    return ev.touches ? ev.touches.length : 1
  },
  reset () {
    startEvent = null
    pos = {}
  }
}

let holdTimer = null
let tapTimer = null
let tapped = false
let prevTappedEndTime = 0
let prevTappedPos = null
const gestures = {
  tap (evt) {
    const el = evt.target
    const now = Date.now()
    const touchTime = now - startTime
    const distance = utils.getDistance(pos.start[0], pos.move ? pos.move[0] : pos.start[0])
    clearTimeout(holdTimer)
    if (config.tapMaxDistance < distance) return false
    if (config.holdTime > touchTime && utils.getFingers(evt) <= 1) {
      tapped = true
      prevTappedEndTime = now
      prevTappedPos = pos.start[0]
      tapTimer = setTimeout(() => {
        engine.trigger(el, 'tap', {
          type: 'tap',
          originEvent: evt,
          fingersCount: utils.getFingers(evt),
          position: prevTappedPos
        }, config.tapTime)
      })
    }
  },
  hold (evt) {
    const el = evt.target
    clearTimeout(holdTimer)
    holdTimer = setTimeout(() => {
      if (!pos.start) return false
      const distance = utils.getDistance(pos.start[0], pos.move ? pos.move[0] : pos.start[0])
      if (config.tapMaxDistance < distance) return false
      engine.trigger(el, 'hold', {
        type: 'hold',
        originEvent: evt,
        fingersCount: utils.getFingers(evt),
        position: pos.start[0]
      })
    }, config.holdTime)
  }
}
const handlerOriginEvent = function (evt) {
  const el = evt.target
  switch (evt.type) {
    case 'touchstart':
    case 'mousedown':
      touchStart = true
      if (!pos.start || pos.start.length < 2) {
        pos.start = utils.getPosOfEvent(evt)
      }
      startTime = Date.now()
      startEvent = evt
      gestures.hold(evt)
      break
    case 'touchmove':
    case 'mousemove':
      if (!touchStart || !pos.start) return false
      pos.move = utils.getPosOfEvent(evt)
      break
    case 'touchend':
    case 'touchcancel':
    case 'mouseup':
    case 'mouseout':
      if (!touchStart) return false
      endEvent = evt
      gestures.tap(evt)
      utils.reset()
      if (evt.touches && evt.touches.length === 1) {
        touchStart = true
      }
      break
  }
}
const touchTap = {
  init () {
    const mouseEvents = 'mouseup mousedown mousemove mouseout'
    const touchEvents = 'touchstart touchmove touchend touchcancel'
    const bindingEvents = utils.hasTouch ? touchEvents : mouseEvents
    bindingEvents.split(' ').forEach(evt => {
      document.addEventListener(evt, handlerOriginEvent, false)
    })
  },
  install (Vue, options = {}) {
    config = Object.assign(config, options)
    this.init()
    Vue.directive('tap', {
      isFn: true,
      acceptStatement: true,
      bind (el, binding) {
        engine.bind(el, 'tap', binding.value, binding.modifiers)
      },
      unbind (el) {
        engine.unbind(el, 'tap')
      }
    })
    Vue.directive('hold', {
      isFn: true,
      acceptStatement: true,
      bind (el, binding) {
        el.addEventListener('contextmenu', evt => {
          evt.preventDefault(); 
        })
        engine.bind(el, 'hold', binding.value)
      },
      unbind (el) {
        engine.unbind(el, 'hold')
      }
    })
  },
  _on (el, evt, handler) {
    engine.bind(el, evt, handler)
  }
}

export default touchTap
