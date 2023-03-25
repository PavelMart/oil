(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? (module.exports = factory())
    : typeof define === "function" && define.amd
    ? define(factory)
    : (global.Popper = factory());
})(this, function () {
  "use strict";
  var isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
  var longerTimeoutBrowsers = ["Edge", "Trident", "Firefox"];
  var timeoutDuration = 0;
  for (var i = 0; i < longerTimeoutBrowsers.length; i += 1) {
    if (isBrowser && navigator.userAgent.indexOf(longerTimeoutBrowsers[i]) >= 0) {
      timeoutDuration = 1;
      break;
    }
  }
  function microtaskDebounce(fn) {
    var called = false;
    return function () {
      if (called) {
        return;
      }
      called = true;
      window.Promise.resolve().then(function () {
        called = false;
        fn();
      });
    };
  }
  function taskDebounce(fn) {
    var scheduled = false;
    return function () {
      if (!scheduled) {
        scheduled = true;
        setTimeout(function () {
          scheduled = false;
          fn();
        }, timeoutDuration);
      }
    };
  }
  var supportsMicroTasks = isBrowser && window.Promise;
  var debounce = supportsMicroTasks ? microtaskDebounce : taskDebounce;
  function isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === "[object Function]";
  }
  function getStyleComputedProperty(element, property) {
    if (element.nodeType !== 1) {
      return [];
    }
    var css = getComputedStyle(element, null);
    return property ? css[property] : css;
  }
  function getParentNode(element) {
    if (element.nodeName === "HTML") {
      return element;
    }
    return element.parentNode || element.host;
  }
  function getScrollParent(element) {
    if (!element) {
      return document.body;
    }
    switch (element.nodeName) {
      case "HTML":
      case "BODY":
        return element.ownerDocument.body;
      case "#document":
        return element.body;
    }
    var _getStyleComputedProp = getStyleComputedProperty(element),
      overflow = _getStyleComputedProp.overflow,
      overflowX = _getStyleComputedProp.overflowX,
      overflowY = _getStyleComputedProp.overflowY;
    if (/(auto|scroll)/.test(overflow + overflowY + overflowX)) {
      return element;
    }
    return getScrollParent(getParentNode(element));
  }
  function getOffsetParent(element) {
    var offsetParent = element && element.offsetParent;
    var nodeName = offsetParent && offsetParent.nodeName;
    if (!nodeName || nodeName === "BODY" || nodeName === "HTML") {
      if (element) {
        return element.ownerDocument.documentElement;
      }
      return document.documentElement;
    }
    if (["TD", "TABLE"].indexOf(offsetParent.nodeName) !== -1 && getStyleComputedProperty(offsetParent, "position") === "static") {
      return getOffsetParent(offsetParent);
    }
    return offsetParent;
  }
  function isOffsetContainer(element) {
    var nodeName = element.nodeName;
    if (nodeName === "BODY") {
      return false;
    }
    return nodeName === "HTML" || getOffsetParent(element.firstElementChild) === element;
  }
  function getRoot(node) {
    if (node.parentNode !== null) {
      return getRoot(node.parentNode);
    }
    return node;
  }
  function findCommonOffsetParent(element1, element2) {
    if (!element1 || !element1.nodeType || !element2 || !element2.nodeType) {
      return document.documentElement;
    }
    var order = element1.compareDocumentPosition(element2) & Node.DOCUMENT_POSITION_FOLLOWING;
    var start = order ? element1 : element2;
    var end = order ? element2 : element1;
    var range = document.createRange();
    range.setStart(start, 0);
    range.setEnd(end, 0);
    var commonAncestorContainer = range.commonAncestorContainer;
    if ((element1 !== commonAncestorContainer && element2 !== commonAncestorContainer) || start.contains(end)) {
      if (isOffsetContainer(commonAncestorContainer)) {
        return commonAncestorContainer;
      }
      return getOffsetParent(commonAncestorContainer);
    }
    var element1root = getRoot(element1);
    if (element1root.host) {
      return findCommonOffsetParent(element1root.host, element2);
    } else {
      return findCommonOffsetParent(element1, getRoot(element2).host);
    }
  }
  function getScroll(element) {
    var side = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "top";
    var upperSide = side === "top" ? "scrollTop" : "scrollLeft";
    var nodeName = element.nodeName;
    if (nodeName === "BODY" || nodeName === "HTML") {
      var html = element.ownerDocument.documentElement;
      var scrollingElement = element.ownerDocument.scrollingElement || html;
      return scrollingElement[upperSide];
    }
    return element[upperSide];
  }
  function includeScroll(rect, element) {
    var subtract = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var scrollTop = getScroll(element, "top");
    var scrollLeft = getScroll(element, "left");
    var modifier = subtract ? -1 : 1;
    rect.top += scrollTop * modifier;
    rect.bottom += scrollTop * modifier;
    rect.left += scrollLeft * modifier;
    rect.right += scrollLeft * modifier;
    return rect;
  }
  function getBordersSize(styles, axis) {
    var sideA = axis === "x" ? "Left" : "Top";
    var sideB = sideA === "Left" ? "Right" : "Bottom";
    return parseFloat(styles["border" + sideA + "Width"], 10) + parseFloat(styles["border" + sideB + "Width"], 10);
  }
  var isIE10 = undefined;
  var isIE10$1 = function () {
    if (isIE10 === undefined) {
      isIE10 = navigator.appVersion.indexOf("MSIE 10") !== -1;
    }
    return isIE10;
  };
  function getSize(axis, body, html, computedStyle) {
    return Math.max(
      body["offset" + axis],
      body["scroll" + axis],
      html["client" + axis],
      html["offset" + axis],
      html["scroll" + axis],
      isIE10$1()
        ? html["offset" + axis] +
            computedStyle["margin" + (axis === "Height" ? "Top" : "Left")] +
            computedStyle["margin" + (axis === "Height" ? "Bottom" : "Right")]
        : 0
    );
  }
  function getWindowSizes() {
    var body = document.body;
    var html = document.documentElement;
    var computedStyle = isIE10$1() && getComputedStyle(html);
    return { height: getSize("Height", body, html, computedStyle), width: getSize("Width", body, html, computedStyle) };
  }
  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };
  var createClass = (function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  })();
  var defineProperty = function (obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  };
  var _extends =
    Object.assign ||
    function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    };
  function getClientRect(offsets) {
    return _extends({}, offsets, { right: offsets.left + offsets.width, bottom: offsets.top + offsets.height });
  }
  function getBoundingClientRect(element) {
    var rect = {};
    if (isIE10$1()) {
      try {
        rect = element.getBoundingClientRect();
        var scrollTop = getScroll(element, "top");
        var scrollLeft = getScroll(element, "left");
        rect.top += scrollTop;
        rect.left += scrollLeft;
        rect.bottom += scrollTop;
        rect.right += scrollLeft;
      } catch (err) {}
    } else {
      rect = element.getBoundingClientRect();
    }
    var result = { left: rect.left, top: rect.top, width: rect.right - rect.left, height: rect.bottom - rect.top };
    var sizes = element.nodeName === "HTML" ? getWindowSizes() : {};
    var width = sizes.width || element.clientWidth || result.right - result.left;
    var height = sizes.height || element.clientHeight || result.bottom - result.top;
    var horizScrollbar = element.offsetWidth - width;
    var vertScrollbar = element.offsetHeight - height;
    if (horizScrollbar || vertScrollbar) {
      var styles = getStyleComputedProperty(element);
      horizScrollbar -= getBordersSize(styles, "x");
      vertScrollbar -= getBordersSize(styles, "y");
      result.width -= horizScrollbar;
      result.height -= vertScrollbar;
    }
    return getClientRect(result);
  }
  function getOffsetRectRelativeToArbitraryNode(children, parent) {
    var isIE10 = isIE10$1();
    var isHTML = parent.nodeName === "HTML";
    var childrenRect = getBoundingClientRect(children);
    var parentRect = getBoundingClientRect(parent);
    var scrollParent = getScrollParent(children);
    var styles = getStyleComputedProperty(parent);
    var borderTopWidth = parseFloat(styles.borderTopWidth, 10);
    var borderLeftWidth = parseFloat(styles.borderLeftWidth, 10);
    var offsets = getClientRect({
      top: childrenRect.top - parentRect.top - borderTopWidth,
      left: childrenRect.left - parentRect.left - borderLeftWidth,
      width: childrenRect.width,
      height: childrenRect.height,
    });
    offsets.marginTop = 0;
    offsets.marginLeft = 0;
    if (!isIE10 && isHTML) {
      var marginTop = parseFloat(styles.marginTop, 10);
      var marginLeft = parseFloat(styles.marginLeft, 10);
      offsets.top -= borderTopWidth - marginTop;
      offsets.bottom -= borderTopWidth - marginTop;
      offsets.left -= borderLeftWidth - marginLeft;
      offsets.right -= borderLeftWidth - marginLeft;
      offsets.marginTop = marginTop;
      offsets.marginLeft = marginLeft;
    }
    if (isIE10 ? parent.contains(scrollParent) : parent === scrollParent && scrollParent.nodeName !== "BODY") {
      offsets = includeScroll(offsets, parent);
    }
    return offsets;
  }
  function getViewportOffsetRectRelativeToArtbitraryNode(element) {
    var html = element.ownerDocument.documentElement;
    var relativeOffset = getOffsetRectRelativeToArbitraryNode(element, html);
    var width = Math.max(html.clientWidth, window.innerWidth || 0);
    var height = Math.max(html.clientHeight, window.innerHeight || 0);
    var scrollTop = getScroll(html);
    var scrollLeft = getScroll(html, "left");
    var offset = {
      top: scrollTop - relativeOffset.top + relativeOffset.marginTop,
      left: scrollLeft - relativeOffset.left + relativeOffset.marginLeft,
      width: width,
      height: height,
    };
    return getClientRect(offset);
  }
  function isFixed(element) {
    var nodeName = element.nodeName;
    if (nodeName === "BODY" || nodeName === "HTML") {
      return false;
    }
    if (getStyleComputedProperty(element, "position") === "fixed") {
      return true;
    }
    return isFixed(getParentNode(element));
  }
  function getBoundaries(popper, reference, padding, boundariesElement) {
    var boundaries = { top: 0, left: 0 };
    var offsetParent = findCommonOffsetParent(popper, reference);
    if (boundariesElement === "viewport") {
      boundaries = getViewportOffsetRectRelativeToArtbitraryNode(offsetParent);
    } else {
      var boundariesNode = void 0;
      if (boundariesElement === "scrollParent") {
        boundariesNode = getScrollParent(getParentNode(reference));
        if (boundariesNode.nodeName === "BODY") {
          boundariesNode = popper.ownerDocument.documentElement;
        }
      } else if (boundariesElement === "window") {
        boundariesNode = popper.ownerDocument.documentElement;
      } else {
        boundariesNode = boundariesElement;
      }
      var offsets = getOffsetRectRelativeToArbitraryNode(boundariesNode, offsetParent);
      if (boundariesNode.nodeName === "HTML" && !isFixed(offsetParent)) {
        var _getWindowSizes = getWindowSizes(),
          height = _getWindowSizes.height,
          width = _getWindowSizes.width;
        boundaries.top += offsets.top - offsets.marginTop;
        boundaries.bottom = height + offsets.top;
        boundaries.left += offsets.left - offsets.marginLeft;
        boundaries.right = width + offsets.left;
      } else {
        boundaries = offsets;
      }
    }
    boundaries.left += padding;
    boundaries.top += padding;
    boundaries.right -= padding;
    boundaries.bottom -= padding;
    return boundaries;
  }
  function getArea(_ref) {
    var width = _ref.width,
      height = _ref.height;
    return width * height;
  }
  function computeAutoPlacement(placement, refRect, popper, reference, boundariesElement) {
    var padding = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
    if (placement.indexOf("auto") === -1) {
      return placement;
    }
    var boundaries = getBoundaries(popper, reference, padding, boundariesElement);
    var rects = {
      top: { width: boundaries.width, height: refRect.top - boundaries.top },
      right: { width: boundaries.right - refRect.right, height: boundaries.height },
      bottom: { width: boundaries.width, height: boundaries.bottom - refRect.bottom },
      left: { width: refRect.left - boundaries.left, height: boundaries.height },
    };
    var sortedAreas = Object.keys(rects)
      .map(function (key) {
        return _extends({ key: key }, rects[key], { area: getArea(rects[key]) });
      })
      .sort(function (a, b) {
        return b.area - a.area;
      });
    var filteredAreas = sortedAreas.filter(function (_ref2) {
      var width = _ref2.width,
        height = _ref2.height;
      return width >= popper.clientWidth && height >= popper.clientHeight;
    });
    var computedPlacement = filteredAreas.length > 0 ? filteredAreas[0].key : sortedAreas[0].key;
    var variation = placement.split("-")[1];
    return computedPlacement + (variation ? "-" + variation : "");
  }
  function getReferenceOffsets(state, popper, reference) {
    var commonOffsetParent = findCommonOffsetParent(popper, reference);
    return getOffsetRectRelativeToArbitraryNode(reference, commonOffsetParent);
  }
  function getOuterSizes(element) {
    var styles = getComputedStyle(element);
    var x = parseFloat(styles.marginTop) + parseFloat(styles.marginBottom);
    var y = parseFloat(styles.marginLeft) + parseFloat(styles.marginRight);
    var result = { width: element.offsetWidth + y, height: element.offsetHeight + x };
    return result;
  }
  function getOppositePlacement(placement) {
    var hash = { left: "right", right: "left", bottom: "top", top: "bottom" };
    return placement.replace(/left|right|bottom|top/g, function (matched) {
      return hash[matched];
    });
  }
  function getPopperOffsets(popper, referenceOffsets, placement) {
    placement = placement.split("-")[0];
    var popperRect = getOuterSizes(popper);
    var popperOffsets = { width: popperRect.width, height: popperRect.height };
    var isHoriz = ["right", "left"].indexOf(placement) !== -1;
    var mainSide = isHoriz ? "top" : "left";
    var secondarySide = isHoriz ? "left" : "top";
    var measurement = isHoriz ? "height" : "width";
    var secondaryMeasurement = !isHoriz ? "height" : "width";
    popperOffsets[mainSide] = referenceOffsets[mainSide] + referenceOffsets[measurement] / 2 - popperRect[measurement] / 2;
    if (placement === secondarySide) {
      popperOffsets[secondarySide] = referenceOffsets[secondarySide] - popperRect[secondaryMeasurement];
    } else {
      popperOffsets[secondarySide] = referenceOffsets[getOppositePlacement(secondarySide)];
    }
    return popperOffsets;
  }
  function find(arr, check) {
    if (Array.prototype.find) {
      return arr.find(check);
    }
    return arr.filter(check)[0];
  }
  function findIndex(arr, prop, value) {
    if (Array.prototype.findIndex) {
      return arr.findIndex(function (cur) {
        return cur[prop] === value;
      });
    }
    var match = find(arr, function (obj) {
      return obj[prop] === value;
    });
    return arr.indexOf(match);
  }
  function runModifiers(modifiers, data, ends) {
    var modifiersToRun = ends === undefined ? modifiers : modifiers.slice(0, findIndex(modifiers, "name", ends));
    modifiersToRun.forEach(function (modifier) {
      if (modifier["function"]) {
        console.warn("`modifier.function` is deprecated, use `modifier.fn`!");
      }
      var fn = modifier["function"] || modifier.fn;
      if (modifier.enabled && isFunction(fn)) {
        data.offsets.popper = getClientRect(data.offsets.popper);
        data.offsets.reference = getClientRect(data.offsets.reference);
        data = fn(data, modifier);
      }
    });
    return data;
  }
  function update() {
    if (this.state.isDestroyed) {
      return;
    }
    var data = { instance: this, styles: {}, arrowStyles: {}, attributes: {}, flipped: false, offsets: {} };
    data.offsets.reference = getReferenceOffsets(this.state, this.popper, this.reference);
    data.placement = computeAutoPlacement(
      this.options.placement,
      data.offsets.reference,
      this.popper,
      this.reference,
      this.options.modifiers.flip.boundariesElement,
      this.options.modifiers.flip.padding
    );
    data.originalPlacement = data.placement;
    data.offsets.popper = getPopperOffsets(this.popper, data.offsets.reference, data.placement);
    data.offsets.popper.position = "absolute";
    data = runModifiers(this.modifiers, data);
    if (!this.state.isCreated) {
      this.state.isCreated = true;
      this.options.onCreate(data);
    } else {
      this.options.onUpdate(data);
    }
  }
  function isModifierEnabled(modifiers, modifierName) {
    return modifiers.some(function (_ref) {
      var name = _ref.name,
        enabled = _ref.enabled;
      return enabled && name === modifierName;
    });
  }
  function getSupportedPropertyName(property) {
    var prefixes = [false, "ms", "Webkit", "Moz", "O"];
    var upperProp = property.charAt(0).toUpperCase() + property.slice(1);
    for (var i = 0; i < prefixes.length - 1; i++) {
      var prefix = prefixes[i];
      var toCheck = prefix ? "" + prefix + upperProp : property;
      if (typeof document.body.style[toCheck] !== "undefined") {
        return toCheck;
      }
    }
    return null;
  }
  function destroy() {
    this.state.isDestroyed = true;
    if (isModifierEnabled(this.modifiers, "applyStyle")) {
      this.popper.removeAttribute("x-placement");
      this.popper.style.left = "";
      this.popper.style.position = "";
      this.popper.style.top = "";
      this.popper.style[getSupportedPropertyName("transform")] = "";
    }
    this.disableEventListeners();
    if (this.options.removeOnDestroy) {
      this.popper.parentNode.removeChild(this.popper);
    }
    return this;
  }
  function getWindow(element) {
    var ownerDocument = element.ownerDocument;
    return ownerDocument ? ownerDocument.defaultView : window;
  }
  function attachToScrollParents(scrollParent, event, callback, scrollParents) {
    var isBody = scrollParent.nodeName === "BODY";
    var target = isBody ? scrollParent.ownerDocument.defaultView : scrollParent;
    target.addEventListener(event, callback, { passive: true });
    if (!isBody) {
      attachToScrollParents(getScrollParent(target.parentNode), event, callback, scrollParents);
    }
    scrollParents.push(target);
  }
  function setupEventListeners(reference, options, state, updateBound) {
    state.updateBound = updateBound;
    getWindow(reference).addEventListener("resize", state.updateBound, { passive: true });
    var scrollElement = getScrollParent(reference);
    attachToScrollParents(scrollElement, "scroll", state.updateBound, state.scrollParents);
    state.scrollElement = scrollElement;
    state.eventsEnabled = true;
    return state;
  }
  function enableEventListeners() {
    if (!this.state.eventsEnabled) {
      this.state = setupEventListeners(this.reference, this.options, this.state, this.scheduleUpdate);
    }
  }
  function removeEventListeners(reference, state) {
    getWindow(reference).removeEventListener("resize", state.updateBound);
    state.scrollParents.forEach(function (target) {
      target.removeEventListener("scroll", state.updateBound);
    });
    state.updateBound = null;
    state.scrollParents = [];
    state.scrollElement = null;
    state.eventsEnabled = false;
    return state;
  }
  function disableEventListeners() {
    if (this.state.eventsEnabled) {
      cancelAnimationFrame(this.scheduleUpdate);
      this.state = removeEventListeners(this.reference, this.state);
    }
  }
  function isNumeric(n) {
    return n !== "" && !isNaN(parseFloat(n)) && isFinite(n);
  }
  function setStyles(element, styles) {
    Object.keys(styles).forEach(function (prop) {
      var unit = "";
      if (["width", "height", "top", "right", "bottom", "left"].indexOf(prop) !== -1 && isNumeric(styles[prop])) {
        unit = "px";
      }
      element.style[prop] = styles[prop] + unit;
    });
  }
  function setAttributes(element, attributes) {
    Object.keys(attributes).forEach(function (prop) {
      var value = attributes[prop];
      if (value !== false) {
        element.setAttribute(prop, attributes[prop]);
      } else {
        element.removeAttribute(prop);
      }
    });
  }
  function applyStyle(data) {
    setStyles(data.instance.popper, data.styles);
    setAttributes(data.instance.popper, data.attributes);
    if (data.arrowElement && Object.keys(data.arrowStyles).length) {
      setStyles(data.arrowElement, data.arrowStyles);
    }
    return data;
  }
  function applyStyleOnLoad(reference, popper, options, modifierOptions, state) {
    var referenceOffsets = getReferenceOffsets(state, popper, reference);
    var placement = computeAutoPlacement(
      options.placement,
      referenceOffsets,
      popper,
      reference,
      options.modifiers.flip.boundariesElement,
      options.modifiers.flip.padding
    );
    popper.setAttribute("x-placement", placement);
    setStyles(popper, { position: "absolute" });
    return options;
  }
  function computeStyle(data, options) {
    var x = options.x,
      y = options.y;
    var popper = data.offsets.popper;
    var legacyGpuAccelerationOption = find(data.instance.modifiers, function (modifier) {
      return modifier.name === "applyStyle";
    }).gpuAcceleration;
    if (legacyGpuAccelerationOption !== undefined) {
      console.warn(
        "WARNING: `gpuAcceleration` option moved to `computeStyle` modifier and will not be supported in future versions of Popper.js!"
      );
    }
    var gpuAcceleration = legacyGpuAccelerationOption !== undefined ? legacyGpuAccelerationOption : options.gpuAcceleration;
    var offsetParent = getOffsetParent(data.instance.popper);
    var offsetParentRect = getBoundingClientRect(offsetParent);
    var styles = { position: popper.position };
    var offsets = {
      left: Math.floor(popper.left),
      top: Math.floor(popper.top),
      bottom: Math.floor(popper.bottom),
      right: Math.floor(popper.right),
    };
    var sideA = x === "bottom" ? "top" : "bottom";
    var sideB = y === "right" ? "left" : "right";
    var prefixedProperty = getSupportedPropertyName("transform");
    var left = void 0,
      top = void 0;
    if (sideA === "bottom") {
      top = -offsetParentRect.height + offsets.bottom;
    } else {
      top = offsets.top;
    }
    if (sideB === "right") {
      left = -offsetParentRect.width + offsets.right;
    } else {
      left = offsets.left;
    }
    if (gpuAcceleration && prefixedProperty) {
      styles[prefixedProperty] = "translate3d(" + left + "px, " + top + "px, 0)";
      styles[sideA] = 0;
      styles[sideB] = 0;
      styles.willChange = "transform";
    } else {
      var invertTop = sideA === "bottom" ? -1 : 1;
      var invertLeft = sideB === "right" ? -1 : 1;
      styles[sideA] = top * invertTop;
      styles[sideB] = left * invertLeft;
      styles.willChange = sideA + ", " + sideB;
    }
    var attributes = { "x-placement": data.placement };
    data.attributes = _extends({}, attributes, data.attributes);
    data.styles = _extends({}, styles, data.styles);
    data.arrowStyles = _extends({}, data.offsets.arrow, data.arrowStyles);
    return data;
  }
  function isModifierRequired(modifiers, requestingName, requestedName) {
    var requesting = find(modifiers, function (_ref) {
      var name = _ref.name;
      return name === requestingName;
    });
    var isRequired =
      !!requesting &&
      modifiers.some(function (modifier) {
        return modifier.name === requestedName && modifier.enabled && modifier.order < requesting.order;
      });
    if (!isRequired) {
      var _requesting = "`" + requestingName + "`";
      var requested = "`" + requestedName + "`";
      console.warn(
        requested +
          " modifier is required by " +
          _requesting +
          " modifier in order to work, be sure to include it before " +
          _requesting +
          "!"
      );
    }
    return isRequired;
  }
  function arrow(data, options) {
    var _data$offsets$arrow;
    if (!isModifierRequired(data.instance.modifiers, "arrow", "keepTogether")) {
      return data;
    }
    var arrowElement = options.element;
    if (typeof arrowElement === "string") {
      arrowElement = data.instance.popper.querySelector(arrowElement);
      if (!arrowElement) {
        return data;
      }
    } else {
      if (!data.instance.popper.contains(arrowElement)) {
        console.warn("WARNING: `arrow.element` must be child of its popper element!");
        return data;
      }
    }
    var placement = data.placement.split("-")[0];
    var _data$offsets = data.offsets,
      popper = _data$offsets.popper,
      reference = _data$offsets.reference;
    var isVertical = ["left", "right"].indexOf(placement) !== -1;
    var len = isVertical ? "height" : "width";
    var sideCapitalized = isVertical ? "Top" : "Left";
    var side = sideCapitalized.toLowerCase();
    var altSide = isVertical ? "left" : "top";
    var opSide = isVertical ? "bottom" : "right";
    var arrowElementSize = getOuterSizes(arrowElement)[len];
    if (reference[opSide] - arrowElementSize < popper[side]) {
      data.offsets.popper[side] -= popper[side] - (reference[opSide] - arrowElementSize);
    }
    if (reference[side] + arrowElementSize > popper[opSide]) {
      data.offsets.popper[side] += reference[side] + arrowElementSize - popper[opSide];
    }
    data.offsets.popper = getClientRect(data.offsets.popper);
    var center = reference[side] + reference[len] / 2 - arrowElementSize / 2;
    var css = getStyleComputedProperty(data.instance.popper);
    var popperMarginSide = parseFloat(css["margin" + sideCapitalized], 10);
    var popperBorderSide = parseFloat(css["border" + sideCapitalized + "Width"], 10);
    var sideValue = center - data.offsets.popper[side] - popperMarginSide - popperBorderSide;
    sideValue = Math.max(Math.min(popper[len] - arrowElementSize, sideValue), 0);
    data.arrowElement = arrowElement;
    data.offsets.arrow =
      ((_data$offsets$arrow = {}),
      defineProperty(_data$offsets$arrow, side, Math.round(sideValue)),
      defineProperty(_data$offsets$arrow, altSide, ""),
      _data$offsets$arrow);
    return data;
  }
  function getOppositeVariation(variation) {
    if (variation === "end") {
      return "start";
    } else if (variation === "start") {
      return "end";
    }
    return variation;
  }
  var placements = [
    "auto-start",
    "auto",
    "auto-end",
    "top-start",
    "top",
    "top-end",
    "right-start",
    "right",
    "right-end",
    "bottom-end",
    "bottom",
    "bottom-start",
    "left-end",
    "left",
    "left-start",
  ];
  var validPlacements = placements.slice(3);
  function clockwise(placement) {
    var counter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var index = validPlacements.indexOf(placement);
    var arr = validPlacements.slice(index + 1).concat(validPlacements.slice(0, index));
    return counter ? arr.reverse() : arr;
  }
  var BEHAVIORS = { FLIP: "flip", CLOCKWISE: "clockwise", COUNTERCLOCKWISE: "counterclockwise" };
  function flip(data, options) {
    if (isModifierEnabled(data.instance.modifiers, "inner")) {
      return data;
    }
    if (data.flipped && data.placement === data.originalPlacement) {
      return data;
    }
    var boundaries = getBoundaries(data.instance.popper, data.instance.reference, options.padding, options.boundariesElement);
    var placement = data.placement.split("-")[0];
    var placementOpposite = getOppositePlacement(placement);
    var variation = data.placement.split("-")[1] || "";
    var flipOrder = [];
    switch (options.behavior) {
      case BEHAVIORS.FLIP:
        flipOrder = [placement, placementOpposite];
        break;
      case BEHAVIORS.CLOCKWISE:
        flipOrder = clockwise(placement);
        break;
      case BEHAVIORS.COUNTERCLOCKWISE:
        flipOrder = clockwise(placement, true);
        break;
      default:
        flipOrder = options.behavior;
    }
    flipOrder.forEach(function (step, index) {
      if (placement !== step || flipOrder.length === index + 1) {
        return data;
      }
      placement = data.placement.split("-")[0];
      placementOpposite = getOppositePlacement(placement);
      var popperOffsets = data.offsets.popper;
      var refOffsets = data.offsets.reference;
      var floor = Math.floor;
      var overlapsRef =
        (placement === "left" && floor(popperOffsets.right) > floor(refOffsets.left)) ||
        (placement === "right" && floor(popperOffsets.left) < floor(refOffsets.right)) ||
        (placement === "top" && floor(popperOffsets.bottom) > floor(refOffsets.top)) ||
        (placement === "bottom" && floor(popperOffsets.top) < floor(refOffsets.bottom));
      var overflowsLeft = floor(popperOffsets.left) < floor(boundaries.left);
      var overflowsRight = floor(popperOffsets.right) > floor(boundaries.right);
      var overflowsTop = floor(popperOffsets.top) < floor(boundaries.top);
      var overflowsBottom = floor(popperOffsets.bottom) > floor(boundaries.bottom);
      var overflowsBoundaries =
        (placement === "left" && overflowsLeft) ||
        (placement === "right" && overflowsRight) ||
        (placement === "top" && overflowsTop) ||
        (placement === "bottom" && overflowsBottom);
      var isVertical = ["top", "bottom"].indexOf(placement) !== -1;
      var flippedVariation =
        !!options.flipVariations &&
        ((isVertical && variation === "start" && overflowsLeft) ||
          (isVertical && variation === "end" && overflowsRight) ||
          (!isVertical && variation === "start" && overflowsTop) ||
          (!isVertical && variation === "end" && overflowsBottom));
      if (overlapsRef || overflowsBoundaries || flippedVariation) {
        data.flipped = true;
        if (overlapsRef || overflowsBoundaries) {
          placement = flipOrder[index + 1];
        }
        if (flippedVariation) {
          variation = getOppositeVariation(variation);
        }
        data.placement = placement + (variation ? "-" + variation : "");
        data.offsets.popper = _extends(
          {},
          data.offsets.popper,
          getPopperOffsets(data.instance.popper, data.offsets.reference, data.placement)
        );
        data = runModifiers(data.instance.modifiers, data, "flip");
      }
    });
    return data;
  }
  function keepTogether(data) {
    var _data$offsets = data.offsets,
      popper = _data$offsets.popper,
      reference = _data$offsets.reference;
    var placement = data.placement.split("-")[0];
    var floor = Math.floor;
    var isVertical = ["top", "bottom"].indexOf(placement) !== -1;
    var side = isVertical ? "right" : "bottom";
    var opSide = isVertical ? "left" : "top";
    var measurement = isVertical ? "width" : "height";
    if (popper[side] < floor(reference[opSide])) {
      data.offsets.popper[opSide] = floor(reference[opSide]) - popper[measurement];
    }
    if (popper[opSide] > floor(reference[side])) {
      data.offsets.popper[opSide] = floor(reference[side]);
    }
    return data;
  }
  function toValue(str, measurement, popperOffsets, referenceOffsets) {
    var split = str.match(/((?:\-|\+)?\d*\.?\d*)(.*)/);
    var value = +split[1];
    var unit = split[2];
    if (!value) {
      return str;
    }
    if (unit.indexOf("%") === 0) {
      var element = void 0;
      switch (unit) {
        case "%p":
          element = popperOffsets;
          break;
        case "%":
        case "%r":
        default:
          element = referenceOffsets;
      }
      var rect = getClientRect(element);
      return (rect[measurement] / 100) * value;
    } else if (unit === "vh" || unit === "vw") {
      var size = void 0;
      if (unit === "vh") {
        size = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      } else {
        size = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      }
      return (size / 100) * value;
    } else {
      return value;
    }
  }
  function parseOffset(offset, popperOffsets, referenceOffsets, basePlacement) {
    var offsets = [0, 0];
    var useHeight = ["right", "left"].indexOf(basePlacement) !== -1;
    var fragments = offset.split(/(\+|\-)/).map(function (frag) {
      return frag.trim();
    });
    var divider = fragments.indexOf(
      find(fragments, function (frag) {
        return frag.search(/,|\s/) !== -1;
      })
    );
    if (fragments[divider] && fragments[divider].indexOf(",") === -1) {
      console.warn("Offsets separated by white space(s) are deprecated, use a comma (,) instead.");
    }
    var splitRegex = /\s*,\s*|\s+/;
    var ops =
      divider !== -1
        ? [
            fragments.slice(0, divider).concat([fragments[divider].split(splitRegex)[0]]),
            [fragments[divider].split(splitRegex)[1]].concat(fragments.slice(divider + 1)),
          ]
        : [fragments];
    ops = ops.map(function (op, index) {
      var measurement = (index === 1 ? !useHeight : useHeight) ? "height" : "width";
      var mergeWithPrevious = false;
      return op
        .reduce(function (a, b) {
          if (a[a.length - 1] === "" && ["+", "-"].indexOf(b) !== -1) {
            a[a.length - 1] = b;
            mergeWithPrevious = true;
            return a;
          } else if (mergeWithPrevious) {
            a[a.length - 1] += b;
            mergeWithPrevious = false;
            return a;
          } else {
            return a.concat(b);
          }
        }, [])
        .map(function (str) {
          return toValue(str, measurement, popperOffsets, referenceOffsets);
        });
    });
    ops.forEach(function (op, index) {
      op.forEach(function (frag, index2) {
        if (isNumeric(frag)) {
          offsets[index] += frag * (op[index2 - 1] === "-" ? -1 : 1);
        }
      });
    });
    return offsets;
  }
  function offset(data, _ref) {
    var offset = _ref.offset;
    var placement = data.placement,
      _data$offsets = data.offsets,
      popper = _data$offsets.popper,
      reference = _data$offsets.reference;
    var basePlacement = placement.split("-")[0];
    var offsets = void 0;
    if (isNumeric(+offset)) {
      offsets = [+offset, 0];
    } else {
      offsets = parseOffset(offset, popper, reference, basePlacement);
    }
    if (basePlacement === "left") {
      popper.top += offsets[0];
      popper.left -= offsets[1];
    } else if (basePlacement === "right") {
      popper.top += offsets[0];
      popper.left += offsets[1];
    } else if (basePlacement === "top") {
      popper.left += offsets[0];
      popper.top -= offsets[1];
    } else if (basePlacement === "bottom") {
      popper.left += offsets[0];
      popper.top += offsets[1];
    }
    data.popper = popper;
    return data;
  }
  function preventOverflow(data, options) {
    var boundariesElement = options.boundariesElement || getOffsetParent(data.instance.popper);
    if (data.instance.reference === boundariesElement) {
      boundariesElement = getOffsetParent(boundariesElement);
    }
    var boundaries = getBoundaries(data.instance.popper, data.instance.reference, options.padding, boundariesElement);
    options.boundaries = boundaries;
    var order = options.priority;
    var popper = data.offsets.popper;
    var check = {
      primary: function primary(placement) {
        var value = popper[placement];
        if (popper[placement] < boundaries[placement] && !options.escapeWithReference) {
          value = Math.max(popper[placement], boundaries[placement]);
        }
        return defineProperty({}, placement, value);
      },
      secondary: function secondary(placement) {
        var mainSide = placement === "right" ? "left" : "top";
        var value = popper[mainSide];
        if (popper[placement] > boundaries[placement] && !options.escapeWithReference) {
          value = Math.min(popper[mainSide], boundaries[placement] - (placement === "right" ? popper.width : popper.height));
        }
        return defineProperty({}, mainSide, value);
      },
    };
    order.forEach(function (placement) {
      var side = ["left", "top"].indexOf(placement) !== -1 ? "primary" : "secondary";
      popper = _extends({}, popper, check[side](placement));
    });
    data.offsets.popper = popper;
    return data;
  }
  function shift(data) {
    var placement = data.placement;
    var basePlacement = placement.split("-")[0];
    var shiftvariation = placement.split("-")[1];
    if (shiftvariation) {
      var _data$offsets = data.offsets,
        reference = _data$offsets.reference,
        popper = _data$offsets.popper;
      var isVertical = ["bottom", "top"].indexOf(basePlacement) !== -1;
      var side = isVertical ? "left" : "top";
      var measurement = isVertical ? "width" : "height";
      var shiftOffsets = {
        start: defineProperty({}, side, reference[side]),
        end: defineProperty({}, side, reference[side] + reference[measurement] - popper[measurement]),
      };
      data.offsets.popper = _extends({}, popper, shiftOffsets[shiftvariation]);
    }
    return data;
  }
  function hide(data) {
    if (!isModifierRequired(data.instance.modifiers, "hide", "preventOverflow")) {
      return data;
    }
    var refRect = data.offsets.reference;
    var bound = find(data.instance.modifiers, function (modifier) {
      return modifier.name === "preventOverflow";
    }).boundaries;
    if (refRect.bottom < bound.top || refRect.left > bound.right || refRect.top > bound.bottom || refRect.right < bound.left) {
      if (data.hide === true) {
        return data;
      }
      data.hide = true;
      data.attributes["x-out-of-boundaries"] = "";
    } else {
      if (data.hide === false) {
        return data;
      }
      data.hide = false;
      data.attributes["x-out-of-boundaries"] = false;
    }
    return data;
  }
  function inner(data) {
    var placement = data.placement;
    var basePlacement = placement.split("-")[0];
    var _data$offsets = data.offsets,
      popper = _data$offsets.popper,
      reference = _data$offsets.reference;
    var isHoriz = ["left", "right"].indexOf(basePlacement) !== -1;
    var subtractLength = ["top", "left"].indexOf(basePlacement) === -1;
    popper[isHoriz ? "left" : "top"] = reference[basePlacement] - (subtractLength ? popper[isHoriz ? "width" : "height"] : 0);
    data.placement = getOppositePlacement(placement);
    data.offsets.popper = getClientRect(popper);
    return data;
  }
  var modifiers = {
    shift: { order: 100, enabled: true, fn: shift },
    offset: { order: 200, enabled: true, fn: offset, offset: 0 },
    preventOverflow: {
      order: 300,
      enabled: true,
      fn: preventOverflow,
      priority: ["left", "right", "top", "bottom"],
      padding: 5,
      boundariesElement: "scrollParent",
    },
    keepTogether: { order: 400, enabled: true, fn: keepTogether },
    arrow: { order: 500, enabled: true, fn: arrow, element: "[x-arrow]" },
    flip: { order: 600, enabled: true, fn: flip, behavior: "flip", padding: 5, boundariesElement: "viewport" },
    inner: { order: 700, enabled: false, fn: inner },
    hide: { order: 800, enabled: true, fn: hide },
    computeStyle: { order: 850, enabled: true, fn: computeStyle, gpuAcceleration: true, x: "bottom", y: "right" },
    applyStyle: { order: 900, enabled: true, fn: applyStyle, onLoad: applyStyleOnLoad, gpuAcceleration: undefined },
  };
  var Defaults = {
    placement: "bottom",
    eventsEnabled: true,
    removeOnDestroy: false,
    onCreate: function onCreate() {},
    onUpdate: function onUpdate() {},
    modifiers: modifiers,
  };
  var Popper = (function () {
    function Popper(reference, popper) {
      var _this = this;
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      classCallCheck(this, Popper);
      this.scheduleUpdate = function () {
        return requestAnimationFrame(_this.update);
      };
      this.update = debounce(this.update.bind(this));
      this.options = _extends({}, Popper.Defaults, options);
      this.state = { isDestroyed: false, isCreated: false, scrollParents: [] };
      this.reference = reference && reference.jquery ? reference[0] : reference;
      this.popper = popper && popper.jquery ? popper[0] : popper;
      this.options.modifiers = {};
      Object.keys(_extends({}, Popper.Defaults.modifiers, options.modifiers)).forEach(function (name) {
        _this.options.modifiers[name] = _extends(
          {},
          Popper.Defaults.modifiers[name] || {},
          options.modifiers ? options.modifiers[name] : {}
        );
      });
      this.modifiers = Object.keys(this.options.modifiers)
        .map(function (name) {
          return _extends({ name: name }, _this.options.modifiers[name]);
        })
        .sort(function (a, b) {
          return a.order - b.order;
        });
      this.modifiers.forEach(function (modifierOptions) {
        if (modifierOptions.enabled && isFunction(modifierOptions.onLoad)) {
          modifierOptions.onLoad(_this.reference, _this.popper, _this.options, modifierOptions, _this.state);
        }
      });
      this.update();
      var eventsEnabled = this.options.eventsEnabled;
      if (eventsEnabled) {
        this.enableEventListeners();
      }
      this.state.eventsEnabled = eventsEnabled;
    }
    createClass(Popper, [
      {
        key: "update",
        value: function update$$1() {
          return update.call(this);
        },
      },
      {
        key: "destroy",
        value: function destroy$$1() {
          return destroy.call(this);
        },
      },
      {
        key: "enableEventListeners",
        value: function enableEventListeners$$1() {
          return enableEventListeners.call(this);
        },
      },
      {
        key: "disableEventListeners",
        value: function disableEventListeners$$1() {
          return disableEventListeners.call(this);
        },
      },
    ]);
    return Popper;
  })();
  Popper.Utils = (typeof window !== "undefined" ? window : global).PopperUtils;
  Popper.placements = placements;
  Popper.Defaults = Defaults;
  return Popper;
});
/*!
 * jQuery JavaScript Library v3.2.1
 * https://jquery.com/
 *
 * Includes Sizzle.js
 * https://sizzlejs.com/
 *
 * Copyright JS Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
 *
 * Date: 2017-03-20T18:59Z
 */ (function (global, factory) {
  "use strict";
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = global.document
      ? factory(global, true)
      : function (w) {
          if (!w.document) {
            throw new Error("jQuery requires a window with a document");
          }
          return factory(w);
        };
  } else {
    factory(global);
  }
})(typeof window !== "undefined" ? window : this, function (window, noGlobal) {
  "use strict";
  var arr = [];
  var document = window.document;
  var getProto = Object.getPrototypeOf;
  var slice = arr.slice;
  var concat = arr.concat;
  var push = arr.push;
  var indexOf = arr.indexOf;
  var class2type = {};
  var toString = class2type.toString;
  var hasOwn = class2type.hasOwnProperty;
  var fnToString = hasOwn.toString;
  var ObjectFunctionString = fnToString.call(Object);
  var support = {};
  function DOMEval(code, doc) {
    doc = doc || document;
    var script = doc.createElement("script");
    script.text = code;
    doc.head.appendChild(script).parentNode.removeChild(script);
  }
  var version = "3.2.1",
    jQuery = function (selector, context) {
      return new jQuery.fn.init(selector, context);
    },
    rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
    rmsPrefix = /^-ms-/,
    rdashAlpha = /-([a-z])/g,
    fcamelCase = function (all, letter) {
      return letter.toUpperCase();
    };
  jQuery.fn = jQuery.prototype = {
    jquery: version,
    constructor: jQuery,
    length: 0,
    toArray: function () {
      return slice.call(this);
    },
    get: function (num) {
      if (num == null) {
        return slice.call(this);
      }
      return num < 0 ? this[num + this.length] : this[num];
    },
    pushStack: function (elems) {
      var ret = jQuery.merge(this.constructor(), elems);
      ret.prevObject = this;
      return ret;
    },
    each: function (callback) {
      return jQuery.each(this, callback);
    },
    map: function (callback) {
      return this.pushStack(
        jQuery.map(this, function (elem, i) {
          return callback.call(elem, i, elem);
        })
      );
    },
    slice: function () {
      return this.pushStack(slice.apply(this, arguments));
    },
    first: function () {
      return this.eq(0);
    },
    last: function () {
      return this.eq(-1);
    },
    eq: function (i) {
      var len = this.length,
        j = +i + (i < 0 ? len : 0);
      return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
    },
    end: function () {
      return this.prevObject || this.constructor();
    },
    push: push,
    sort: arr.sort,
    splice: arr.splice,
  };
  jQuery.extend = jQuery.fn.extend = function () {
    var options,
      name,
      src,
      copy,
      copyIsArray,
      clone,
      target = arguments[0] || {},
      i = 1,
      length = arguments.length,
      deep = false;
    if (typeof target === "boolean") {
      deep = target;
      target = arguments[i] || {};
      i++;
    }
    if (typeof target !== "object" && !jQuery.isFunction(target)) {
      target = {};
    }
    if (i === length) {
      target = this;
      i--;
    }
    for (; i < length; i++) {
      if ((options = arguments[i]) != null) {
        for (name in options) {
          src = target[name];
          copy = options[name];
          if (target === copy) {
            continue;
          }
          if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
            if (copyIsArray) {
              copyIsArray = false;
              clone = src && Array.isArray(src) ? src : [];
            } else {
              clone = src && jQuery.isPlainObject(src) ? src : {};
            }
            target[name] = jQuery.extend(deep, clone, copy);
          } else if (copy !== undefined) {
            target[name] = copy;
          }
        }
      }
    }
    return target;
  };
  jQuery.extend({
    expando: "jQuery" + (version + Math.random()).replace(/\D/g, ""),
    isReady: true,
    error: function (msg) {
      throw new Error(msg);
    },
    noop: function () {},
    isFunction: function (obj) {
      return jQuery.type(obj) === "function";
    },
    isWindow: function (obj) {
      return obj != null && obj === obj.window;
    },
    isNumeric: function (obj) {
      var type = jQuery.type(obj);
      return (type === "number" || type === "string") && !isNaN(obj - parseFloat(obj));
    },
    isPlainObject: function (obj) {
      var proto, Ctor;
      if (!obj || toString.call(obj) !== "[object Object]") {
        return false;
      }
      proto = getProto(obj);
      if (!proto) {
        return true;
      }
      Ctor = hasOwn.call(proto, "constructor") && proto.constructor;
      return typeof Ctor === "function" && fnToString.call(Ctor) === ObjectFunctionString;
    },
    isEmptyObject: function (obj) {
      var name;
      for (name in obj) {
        return false;
      }
      return true;
    },
    type: function (obj) {
      if (obj == null) {
        return obj + "";
      }
      return typeof obj === "object" || typeof obj === "function" ? class2type[toString.call(obj)] || "object" : typeof obj;
    },
    globalEval: function (code) {
      DOMEval(code);
    },
    camelCase: function (string) {
      return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
    },
    each: function (obj, callback) {
      var length,
        i = 0;
      if (isArrayLike(obj)) {
        length = obj.length;
        for (; i < length; i++) {
          if (callback.call(obj[i], i, obj[i]) === false) {
            break;
          }
        }
      } else {
        for (i in obj) {
          if (callback.call(obj[i], i, obj[i]) === false) {
            break;
          }
        }
      }
      return obj;
    },
    trim: function (text) {
      return text == null ? "" : (text + "").replace(rtrim, "");
    },
    makeArray: function (arr, results) {
      var ret = results || [];
      if (arr != null) {
        if (isArrayLike(Object(arr))) {
          jQuery.merge(ret, typeof arr === "string" ? [arr] : arr);
        } else {
          push.call(ret, arr);
        }
      }
      return ret;
    },
    inArray: function (elem, arr, i) {
      return arr == null ? -1 : indexOf.call(arr, elem, i);
    },
    merge: function (first, second) {
      var len = +second.length,
        j = 0,
        i = first.length;
      for (; j < len; j++) {
        first[i++] = second[j];
      }
      first.length = i;
      return first;
    },
    grep: function (elems, callback, invert) {
      var callbackInverse,
        matches = [],
        i = 0,
        length = elems.length,
        callbackExpect = !invert;
      for (; i < length; i++) {
        callbackInverse = !callback(elems[i], i);
        if (callbackInverse !== callbackExpect) {
          matches.push(elems[i]);
        }
      }
      return matches;
    },
    map: function (elems, callback, arg) {
      var length,
        value,
        i = 0,
        ret = [];
      if (isArrayLike(elems)) {
        length = elems.length;
        for (; i < length; i++) {
          value = callback(elems[i], i, arg);
          if (value != null) {
            ret.push(value);
          }
        }
      } else {
        for (i in elems) {
          value = callback(elems[i], i, arg);
          if (value != null) {
            ret.push(value);
          }
        }
      }
      return concat.apply([], ret);
    },
    guid: 1,
    proxy: function (fn, context) {
      var tmp, args, proxy;
      if (typeof context === "string") {
        tmp = fn[context];
        context = fn;
        fn = tmp;
      }
      if (!jQuery.isFunction(fn)) {
        return undefined;
      }
      args = slice.call(arguments, 2);
      proxy = function () {
        return fn.apply(context || this, args.concat(slice.call(arguments)));
      };
      proxy.guid = fn.guid = fn.guid || jQuery.guid++;
      return proxy;
    },
    now: Date.now,
    support: support,
  });
  if (typeof Symbol === "function") {
    jQuery.fn[Symbol.iterator] = arr[Symbol.iterator];
  }
  jQuery.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "), function (i, name) {
    class2type["[object " + name + "]"] = name.toLowerCase();
  });
  function isArrayLike(obj) {
    var length = !!obj && "length" in obj && obj.length,
      type = jQuery.type(obj);
    if (type === "function" || jQuery.isWindow(obj)) {
      return false;
    }
    return type === "array" || length === 0 || (typeof length === "number" && length > 0 && length - 1 in obj);
  }
  var Sizzle = /*!
   * Sizzle CSS Selector Engine v2.3.3
   * https://sizzlejs.com/
   *
   * Copyright jQuery Foundation and other contributors
   * Released under the MIT license
   * http://jquery.org/license
   *
   * Date: 2016-08-08
   */ (function (window) {
    var i,
      support,
      Expr,
      getText,
      isXML,
      tokenize,
      compile,
      select,
      outermostContext,
      sortInput,
      hasDuplicate,
      setDocument,
      document,
      docElem,
      documentIsHTML,
      rbuggyQSA,
      rbuggyMatches,
      matches,
      contains,
      expando = "sizzle" + 1 * new Date(),
      preferredDoc = window.document,
      dirruns = 0,
      done = 0,
      classCache = createCache(),
      tokenCache = createCache(),
      compilerCache = createCache(),
      sortOrder = function (a, b) {
        if (a === b) {
          hasDuplicate = true;
        }
        return 0;
      },
      hasOwn = {}.hasOwnProperty,
      arr = [],
      pop = arr.pop,
      push_native = arr.push,
      push = arr.push,
      slice = arr.slice,
      indexOf = function (list, elem) {
        var i = 0,
          len = list.length;
        for (; i < len; i++) {
          if (list[i] === elem) {
            return i;
          }
        }
        return -1;
      },
      booleans =
        "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",
      whitespace = "[\\x20\\t\\r\\n\\f]",
      identifier = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",
      attributes =
        "\\[" +
        whitespace +
        "*(" +
        identifier +
        ")(?:" +
        whitespace +
        "*([*^$|!~]?=)" +
        whitespace +
        "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" +
        identifier +
        "))|)" +
        whitespace +
        "*\\]",
      pseudos =
        ":(" +
        identifier +
        ")(?:\\((" +
        "('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
        "((?:\\\\.|[^\\\\()[\\]]|" +
        attributes +
        ")*)|" +
        ".*" +
        ")\\)|)",
      rwhitespace = new RegExp(whitespace + "+", "g"),
      rtrim = new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g"),
      rcomma = new RegExp("^" + whitespace + "*," + whitespace + "*"),
      rcombinators = new RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*"),
      rattributeQuotes = new RegExp("=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g"),
      rpseudo = new RegExp(pseudos),
      ridentifier = new RegExp("^" + identifier + "$"),
      matchExpr = {
        ID: new RegExp("^#(" + identifier + ")"),
        CLASS: new RegExp("^\\.(" + identifier + ")"),
        TAG: new RegExp("^(" + identifier + "|[*])"),
        ATTR: new RegExp("^" + attributes),
        PSEUDO: new RegExp("^" + pseudos),
        CHILD: new RegExp(
          "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" +
            whitespace +
            "*(even|odd|(([+-]|)(\\d*)n|)" +
            whitespace +
            "*(?:([+-]|)" +
            whitespace +
            "*(\\d+)|))" +
            whitespace +
            "*\\)|)",
          "i"
        ),
        bool: new RegExp("^(?:" + booleans + ")$", "i"),
        needsContext: new RegExp(
          "^" +
            whitespace +
            "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
            whitespace +
            "*((?:-\\d)?\\d*)" +
            whitespace +
            "*\\)|)(?=[^-]|$)",
          "i"
        ),
      },
      rinputs = /^(?:input|select|textarea|button)$/i,
      rheader = /^h\d$/i,
      rnative = /^[^{]+\{\s*\[native \w/,
      rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
      rsibling = /[+~]/,
      runescape = new RegExp("\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig"),
      funescape = function (_, escaped, escapedWhitespace) {
        var high = "0x" + escaped - 0x10000;
        return high !== high || escapedWhitespace
          ? escaped
          : high < 0
          ? String.fromCharCode(high + 0x10000)
          : String.fromCharCode((high >> 10) | 0xd800, (high & 0x3ff) | 0xdc00);
      },
      rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
      fcssescape = function (ch, asCodePoint) {
        if (asCodePoint) {
          if (ch === "\0") {
            return "\uFFFD";
          }
          return ch.slice(0, -1) + "\\" + ch.charCodeAt(ch.length - 1).toString(16) + " ";
        }
        return "\\" + ch;
      },
      unloadHandler = function () {
        setDocument();
      },
      disabledAncestor = addCombinator(
        function (elem) {
          return elem.disabled === true && ("form" in elem || "label" in elem);
        },
        { dir: "parentNode", next: "legend" }
      );
    try {
      push.apply((arr = slice.call(preferredDoc.childNodes)), preferredDoc.childNodes);
      arr[preferredDoc.childNodes.length].nodeType;
    } catch (e) {
      push = {
        apply: arr.length
          ? function (target, els) {
              push_native.apply(target, slice.call(els));
            }
          : function (target, els) {
              var j = target.length,
                i = 0;
              while ((target[j++] = els[i++])) {}
              target.length = j - 1;
            },
      };
    }
    function Sizzle(selector, context, results, seed) {
      var m,
        i,
        elem,
        nid,
        match,
        groups,
        newSelector,
        newContext = context && context.ownerDocument,
        nodeType = context ? context.nodeType : 9;
      results = results || [];
      if (typeof selector !== "string" || !selector || (nodeType !== 1 && nodeType !== 9 && nodeType !== 11)) {
        return results;
      }
      if (!seed) {
        if ((context ? context.ownerDocument || context : preferredDoc) !== document) {
          setDocument(context);
        }
        context = context || document;
        if (documentIsHTML) {
          if (nodeType !== 11 && (match = rquickExpr.exec(selector))) {
            if ((m = match[1])) {
              if (nodeType === 9) {
                if ((elem = context.getElementById(m))) {
                  if (elem.id === m) {
                    results.push(elem);
                    return results;
                  }
                } else {
                  return results;
                }
              } else {
                if (newContext && (elem = newContext.getElementById(m)) && contains(context, elem) && elem.id === m) {
                  results.push(elem);
                  return results;
                }
              }
            } else if (match[2]) {
              push.apply(results, context.getElementsByTagName(selector));
              return results;
            } else if ((m = match[3]) && support.getElementsByClassName && context.getElementsByClassName) {
              push.apply(results, context.getElementsByClassName(m));
              return results;
            }
          }
          if (support.qsa && !compilerCache[selector + " "] && (!rbuggyQSA || !rbuggyQSA.test(selector))) {
            if (nodeType !== 1) {
              newContext = context;
              newSelector = selector;
            } else if (context.nodeName.toLowerCase() !== "object") {
              if ((nid = context.getAttribute("id"))) {
                nid = nid.replace(rcssescape, fcssescape);
              } else {
                context.setAttribute("id", (nid = expando));
              }
              groups = tokenize(selector);
              i = groups.length;
              while (i--) {
                groups[i] = "#" + nid + " " + toSelector(groups[i]);
              }
              newSelector = groups.join(",");
              newContext = (rsibling.test(selector) && testContext(context.parentNode)) || context;
            }
            if (newSelector) {
              try {
                push.apply(results, newContext.querySelectorAll(newSelector));
                return results;
              } catch (qsaError) {
              } finally {
                if (nid === expando) {
                  context.removeAttribute("id");
                }
              }
            }
          }
        }
      }
      return select(selector.replace(rtrim, "$1"), context, results, seed);
    }
    function createCache() {
      var keys = [];
      function cache(key, value) {
        if (keys.push(key + " ") > Expr.cacheLength) {
          delete cache[keys.shift()];
        }
        return (cache[key + " "] = value);
      }
      return cache;
    }
    function markFunction(fn) {
      fn[expando] = true;
      return fn;
    }
    function assert(fn) {
      var el = document.createElement("fieldset");
      try {
        return !!fn(el);
      } catch (e) {
        return false;
      } finally {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
        el = null;
      }
    }
    function addHandle(attrs, handler) {
      var arr = attrs.split("|"),
        i = arr.length;
      while (i--) {
        Expr.attrHandle[arr[i]] = handler;
      }
    }
    function siblingCheck(a, b) {
      var cur = b && a,
        diff = cur && a.nodeType === 1 && b.nodeType === 1 && a.sourceIndex - b.sourceIndex;
      if (diff) {
        return diff;
      }
      if (cur) {
        while ((cur = cur.nextSibling)) {
          if (cur === b) {
            return -1;
          }
        }
      }
      return a ? 1 : -1;
    }
    function createInputPseudo(type) {
      return function (elem) {
        var name = elem.nodeName.toLowerCase();
        return name === "input" && elem.type === type;
      };
    }
    function createButtonPseudo(type) {
      return function (elem) {
        var name = elem.nodeName.toLowerCase();
        return (name === "input" || name === "button") && elem.type === type;
      };
    }
    function createDisabledPseudo(disabled) {
      return function (elem) {
        if ("form" in elem) {
          if (elem.parentNode && elem.disabled === false) {
            if ("label" in elem) {
              if ("label" in elem.parentNode) {
                return elem.parentNode.disabled === disabled;
              } else {
                return elem.disabled === disabled;
              }
            }
            return elem.isDisabled === disabled || (elem.isDisabled !== !disabled && disabledAncestor(elem) === disabled);
          }
          return elem.disabled === disabled;
        } else if ("label" in elem) {
          return elem.disabled === disabled;
        }
        return false;
      };
    }
    function createPositionalPseudo(fn) {
      return markFunction(function (argument) {
        argument = +argument;
        return markFunction(function (seed, matches) {
          var j,
            matchIndexes = fn([], seed.length, argument),
            i = matchIndexes.length;
          while (i--) {
            if (seed[(j = matchIndexes[i])]) {
              seed[j] = !(matches[j] = seed[j]);
            }
          }
        });
      });
    }
    function testContext(context) {
      return context && typeof context.getElementsByTagName !== "undefined" && context;
    }
    support = Sizzle.support = {};
    isXML = Sizzle.isXML = function (elem) {
      var documentElement = elem && (elem.ownerDocument || elem).documentElement;
      return documentElement ? documentElement.nodeName !== "HTML" : false;
    };
    setDocument = Sizzle.setDocument = function (node) {
      var hasCompare,
        subWindow,
        doc = node ? node.ownerDocument || node : preferredDoc;
      if (doc === document || doc.nodeType !== 9 || !doc.documentElement) {
        return document;
      }
      document = doc;
      docElem = document.documentElement;
      documentIsHTML = !isXML(document);
      if (preferredDoc !== document && (subWindow = document.defaultView) && subWindow.top !== subWindow) {
        if (subWindow.addEventListener) {
          subWindow.addEventListener("unload", unloadHandler, false);
        } else if (subWindow.attachEvent) {
          subWindow.attachEvent("onunload", unloadHandler);
        }
      }
      support.attributes = assert(function (el) {
        el.className = "i";
        return !el.getAttribute("className");
      });
      support.getElementsByTagName = assert(function (el) {
        el.appendChild(document.createComment(""));
        return !el.getElementsByTagName("*").length;
      });
      support.getElementsByClassName = rnative.test(document.getElementsByClassName);
      support.getById = assert(function (el) {
        docElem.appendChild(el).id = expando;
        return !document.getElementsByName || !document.getElementsByName(expando).length;
      });
      if (support.getById) {
        Expr.filter["ID"] = function (id) {
          var attrId = id.replace(runescape, funescape);
          return function (elem) {
            return elem.getAttribute("id") === attrId;
          };
        };
        Expr.find["ID"] = function (id, context) {
          if (typeof context.getElementById !== "undefined" && documentIsHTML) {
            var elem = context.getElementById(id);
            return elem ? [elem] : [];
          }
        };
      } else {
        Expr.filter["ID"] = function (id) {
          var attrId = id.replace(runescape, funescape);
          return function (elem) {
            var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
            return node && node.value === attrId;
          };
        };
        Expr.find["ID"] = function (id, context) {
          if (typeof context.getElementById !== "undefined" && documentIsHTML) {
            var node,
              i,
              elems,
              elem = context.getElementById(id);
            if (elem) {
              node = elem.getAttributeNode("id");
              if (node && node.value === id) {
                return [elem];
              }
              elems = context.getElementsByName(id);
              i = 0;
              while ((elem = elems[i++])) {
                node = elem.getAttributeNode("id");
                if (node && node.value === id) {
                  return [elem];
                }
              }
            }
            return [];
          }
        };
      }
      Expr.find["TAG"] = support.getElementsByTagName
        ? function (tag, context) {
            if (typeof context.getElementsByTagName !== "undefined") {
              return context.getElementsByTagName(tag);
            } else if (support.qsa) {
              return context.querySelectorAll(tag);
            }
          }
        : function (tag, context) {
            var elem,
              tmp = [],
              i = 0,
              results = context.getElementsByTagName(tag);
            if (tag === "*") {
              while ((elem = results[i++])) {
                if (elem.nodeType === 1) {
                  tmp.push(elem);
                }
              }
              return tmp;
            }
            return results;
          };
      Expr.find["CLASS"] =
        support.getElementsByClassName &&
        function (className, context) {
          if (typeof context.getElementsByClassName !== "undefined" && documentIsHTML) {
            return context.getElementsByClassName(className);
          }
        };
      rbuggyMatches = [];
      rbuggyQSA = [];
      if ((support.qsa = rnative.test(document.querySelectorAll))) {
        assert(function (el) {
          docElem.appendChild(el).innerHTML =
            "<a id='" +
            expando +
            "'></a>" +
            "<select id='" +
            expando +
            "-\r\\' msallowcapture=''>" +
            "<option selected=''></option></select>";
          if (el.querySelectorAll("[msallowcapture^='']").length) {
            rbuggyQSA.push("[*^$]=" + whitespace + "*(?:''|\"\")");
          }
          if (!el.querySelectorAll("[selected]").length) {
            rbuggyQSA.push("\\[" + whitespace + "*(?:value|" + booleans + ")");
          }
          if (!el.querySelectorAll("[id~=" + expando + "-]").length) {
            rbuggyQSA.push("~=");
          }
          if (!el.querySelectorAll(":checked").length) {
            rbuggyQSA.push(":checked");
          }
          if (!el.querySelectorAll("a#" + expando + "+*").length) {
            rbuggyQSA.push(".#.+[+~]");
          }
        });
        assert(function (el) {
          el.innerHTML = "<a href='' disabled='disabled'></a>" + "<select disabled='disabled'><option/></select>";
          var input = document.createElement("input");
          input.setAttribute("type", "hidden");
          el.appendChild(input).setAttribute("name", "D");
          if (el.querySelectorAll("[name=d]").length) {
            rbuggyQSA.push("name" + whitespace + "*[*^$|!~]?=");
          }
          if (el.querySelectorAll(":enabled").length !== 2) {
            rbuggyQSA.push(":enabled", ":disabled");
          }
          docElem.appendChild(el).disabled = true;
          if (el.querySelectorAll(":disabled").length !== 2) {
            rbuggyQSA.push(":enabled", ":disabled");
          }
          el.querySelectorAll("*,:x");
          rbuggyQSA.push(",.*:");
        });
      }
      if (
        (support.matchesSelector = rnative.test(
          (matches =
            docElem.matches ||
            docElem.webkitMatchesSelector ||
            docElem.mozMatchesSelector ||
            docElem.oMatchesSelector ||
            docElem.msMatchesSelector)
        ))
      ) {
        assert(function (el) {
          support.disconnectedMatch = matches.call(el, "*");
          matches.call(el, "[s!='']:x");
          rbuggyMatches.push("!=", pseudos);
        });
      }
      rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join("|"));
      rbuggyMatches = rbuggyMatches.length && new RegExp(rbuggyMatches.join("|"));
      hasCompare = rnative.test(docElem.compareDocumentPosition);
      contains =
        hasCompare || rnative.test(docElem.contains)
          ? function (a, b) {
              var adown = a.nodeType === 9 ? a.documentElement : a,
                bup = b && b.parentNode;
              return (
                a === bup ||
                !!(
                  bup &&
                  bup.nodeType === 1 &&
                  (adown.contains ? adown.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16)
                )
              );
            }
          : function (a, b) {
              if (b) {
                while ((b = b.parentNode)) {
                  if (b === a) {
                    return true;
                  }
                }
              }
              return false;
            };
      sortOrder = hasCompare
        ? function (a, b) {
            if (a === b) {
              hasDuplicate = true;
              return 0;
            }
            var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
            if (compare) {
              return compare;
            }
            compare = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) : 1;
            if (compare & 1 || (!support.sortDetached && b.compareDocumentPosition(a) === compare)) {
              if (a === document || (a.ownerDocument === preferredDoc && contains(preferredDoc, a))) {
                return -1;
              }
              if (b === document || (b.ownerDocument === preferredDoc && contains(preferredDoc, b))) {
                return 1;
              }
              return sortInput ? indexOf(sortInput, a) - indexOf(sortInput, b) : 0;
            }
            return compare & 4 ? -1 : 1;
          }
        : function (a, b) {
            if (a === b) {
              hasDuplicate = true;
              return 0;
            }
            var cur,
              i = 0,
              aup = a.parentNode,
              bup = b.parentNode,
              ap = [a],
              bp = [b];
            if (!aup || !bup) {
              return a === document
                ? -1
                : b === document
                ? 1
                : aup
                ? -1
                : bup
                ? 1
                : sortInput
                ? indexOf(sortInput, a) - indexOf(sortInput, b)
                : 0;
            } else if (aup === bup) {
              return siblingCheck(a, b);
            }
            cur = a;
            while ((cur = cur.parentNode)) {
              ap.unshift(cur);
            }
            cur = b;
            while ((cur = cur.parentNode)) {
              bp.unshift(cur);
            }
            while (ap[i] === bp[i]) {
              i++;
            }
            return i ? siblingCheck(ap[i], bp[i]) : ap[i] === preferredDoc ? -1 : bp[i] === preferredDoc ? 1 : 0;
          };
      return document;
    };
    Sizzle.matches = function (expr, elements) {
      return Sizzle(expr, null, null, elements);
    };
    Sizzle.matchesSelector = function (elem, expr) {
      if ((elem.ownerDocument || elem) !== document) {
        setDocument(elem);
      }
      expr = expr.replace(rattributeQuotes, "='$1']");
      if (
        support.matchesSelector &&
        documentIsHTML &&
        !compilerCache[expr + " "] &&
        (!rbuggyMatches || !rbuggyMatches.test(expr)) &&
        (!rbuggyQSA || !rbuggyQSA.test(expr))
      ) {
        try {
          var ret = matches.call(elem, expr);
          if (ret || support.disconnectedMatch || (elem.document && elem.document.nodeType !== 11)) {
            return ret;
          }
        } catch (e) {}
      }
      return Sizzle(expr, document, null, [elem]).length > 0;
    };
    Sizzle.contains = function (context, elem) {
      if ((context.ownerDocument || context) !== document) {
        setDocument(context);
      }
      return contains(context, elem);
    };
    Sizzle.attr = function (elem, name) {
      if ((elem.ownerDocument || elem) !== document) {
        setDocument(elem);
      }
      var fn = Expr.attrHandle[name.toLowerCase()],
        val = fn && hasOwn.call(Expr.attrHandle, name.toLowerCase()) ? fn(elem, name, !documentIsHTML) : undefined;
      return val !== undefined
        ? val
        : support.attributes || !documentIsHTML
        ? elem.getAttribute(name)
        : (val = elem.getAttributeNode(name)) && val.specified
        ? val.value
        : null;
    };
    Sizzle.escape = function (sel) {
      return (sel + "").replace(rcssescape, fcssescape);
    };
    Sizzle.error = function (msg) {
      throw new Error("Syntax error, unrecognized expression: " + msg);
    };
    Sizzle.uniqueSort = function (results) {
      var elem,
        duplicates = [],
        j = 0,
        i = 0;
      hasDuplicate = !support.detectDuplicates;
      sortInput = !support.sortStable && results.slice(0);
      results.sort(sortOrder);
      if (hasDuplicate) {
        while ((elem = results[i++])) {
          if (elem === results[i]) {
            j = duplicates.push(i);
          }
        }
        while (j--) {
          results.splice(duplicates[j], 1);
        }
      }
      sortInput = null;
      return results;
    };
    getText = Sizzle.getText = function (elem) {
      var node,
        ret = "",
        i = 0,
        nodeType = elem.nodeType;
      if (!nodeType) {
        while ((node = elem[i++])) {
          ret += getText(node);
        }
      } else if (nodeType === 1 || nodeType === 9 || nodeType === 11) {
        if (typeof elem.textContent === "string") {
          return elem.textContent;
        } else {
          for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
            ret += getText(elem);
          }
        }
      } else if (nodeType === 3 || nodeType === 4) {
        return elem.nodeValue;
      }
      return ret;
    };
    Expr = Sizzle.selectors = {
      cacheLength: 50,
      createPseudo: markFunction,
      match: matchExpr,
      attrHandle: {},
      find: {},
      relative: {
        ">": { dir: "parentNode", first: true },
        " ": { dir: "parentNode" },
        "+": { dir: "previousSibling", first: true },
        "~": { dir: "previousSibling" },
      },
      preFilter: {
        ATTR: function (match) {
          match[1] = match[1].replace(runescape, funescape);
          match[3] = (match[3] || match[4] || match[5] || "").replace(runescape, funescape);
          if (match[2] === "~=") {
            match[3] = " " + match[3] + " ";
          }
          return match.slice(0, 4);
        },
        CHILD: function (match) {
          match[1] = match[1].toLowerCase();
          if (match[1].slice(0, 3) === "nth") {
            if (!match[3]) {
              Sizzle.error(match[0]);
            }
            match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * (match[3] === "even" || match[3] === "odd"));
            match[5] = +(match[7] + match[8] || match[3] === "odd");
          } else if (match[3]) {
            Sizzle.error(match[0]);
          }
          return match;
        },
        PSEUDO: function (match) {
          var excess,
            unquoted = !match[6] && match[2];
          if (matchExpr["CHILD"].test(match[0])) {
            return null;
          }
          if (match[3]) {
            match[2] = match[4] || match[5] || "";
          } else if (
            unquoted &&
            rpseudo.test(unquoted) &&
            (excess = tokenize(unquoted, true)) &&
            (excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length)
          ) {
            match[0] = match[0].slice(0, excess);
            match[2] = unquoted.slice(0, excess);
          }
          return match.slice(0, 3);
        },
      },
      filter: {
        TAG: function (nodeNameSelector) {
          var nodeName = nodeNameSelector.replace(runescape, funescape).toLowerCase();
          return nodeNameSelector === "*"
            ? function () {
                return true;
              }
            : function (elem) {
                return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
              };
        },
        CLASS: function (className) {
          var pattern = classCache[className + " "];
          return (
            pattern ||
            ((pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) &&
              classCache(className, function (elem) {
                return pattern.test(
                  (typeof elem.className === "string" && elem.className) ||
                    (typeof elem.getAttribute !== "undefined" && elem.getAttribute("class")) ||
                    ""
                );
              }))
          );
        },
        ATTR: function (name, operator, check) {
          return function (elem) {
            var result = Sizzle.attr(elem, name);
            if (result == null) {
              return operator === "!=";
            }
            if (!operator) {
              return true;
            }
            result += "";
            return operator === "="
              ? result === check
              : operator === "!="
              ? result !== check
              : operator === "^="
              ? check && result.indexOf(check) === 0
              : operator === "*="
              ? check && result.indexOf(check) > -1
              : operator === "$="
              ? check && result.slice(-check.length) === check
              : operator === "~="
              ? (" " + result.replace(rwhitespace, " ") + " ").indexOf(check) > -1
              : operator === "|="
              ? result === check || result.slice(0, check.length + 1) === check + "-"
              : false;
          };
        },
        CHILD: function (type, what, argument, first, last) {
          var simple = type.slice(0, 3) !== "nth",
            forward = type.slice(-4) !== "last",
            ofType = what === "of-type";
          return first === 1 && last === 0
            ? function (elem) {
                return !!elem.parentNode;
              }
            : function (elem, context, xml) {
                var cache,
                  uniqueCache,
                  outerCache,
                  node,
                  nodeIndex,
                  start,
                  dir = simple !== forward ? "nextSibling" : "previousSibling",
                  parent = elem.parentNode,
                  name = ofType && elem.nodeName.toLowerCase(),
                  useCache = !xml && !ofType,
                  diff = false;
                if (parent) {
                  if (simple) {
                    while (dir) {
                      node = elem;
                      while ((node = node[dir])) {
                        if (ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) {
                          return false;
                        }
                      }
                      start = dir = type === "only" && !start && "nextSibling";
                    }
                    return true;
                  }
                  start = [forward ? parent.firstChild : parent.lastChild];
                  if (forward && useCache) {
                    node = parent;
                    outerCache = node[expando] || (node[expando] = {});
                    uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});
                    cache = uniqueCache[type] || [];
                    nodeIndex = cache[0] === dirruns && cache[1];
                    diff = nodeIndex && cache[2];
                    node = nodeIndex && parent.childNodes[nodeIndex];
                    while ((node = (++nodeIndex && node && node[dir]) || (diff = nodeIndex = 0) || start.pop())) {
                      if (node.nodeType === 1 && ++diff && node === elem) {
                        uniqueCache[type] = [dirruns, nodeIndex, diff];
                        break;
                      }
                    }
                  } else {
                    if (useCache) {
                      node = elem;
                      outerCache = node[expando] || (node[expando] = {});
                      uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});
                      cache = uniqueCache[type] || [];
                      nodeIndex = cache[0] === dirruns && cache[1];
                      diff = nodeIndex;
                    }
                    if (diff === false) {
                      while ((node = (++nodeIndex && node && node[dir]) || (diff = nodeIndex = 0) || start.pop())) {
                        if ((ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) && ++diff) {
                          if (useCache) {
                            outerCache = node[expando] || (node[expando] = {});
                            uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});
                            uniqueCache[type] = [dirruns, diff];
                          }
                          if (node === elem) {
                            break;
                          }
                        }
                      }
                    }
                  }
                  diff -= last;
                  return diff === first || (diff % first === 0 && diff / first >= 0);
                }
              };
        },
        PSEUDO: function (pseudo, argument) {
          var args,
            fn = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || Sizzle.error("unsupported pseudo: " + pseudo);
          if (fn[expando]) {
            return fn(argument);
          }
          if (fn.length > 1) {
            args = [pseudo, pseudo, "", argument];
            return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase())
              ? markFunction(function (seed, matches) {
                  var idx,
                    matched = fn(seed, argument),
                    i = matched.length;
                  while (i--) {
                    idx = indexOf(seed, matched[i]);
                    seed[idx] = !(matches[idx] = matched[i]);
                  }
                })
              : function (elem) {
                  return fn(elem, 0, args);
                };
          }
          return fn;
        },
      },
      pseudos: {
        not: markFunction(function (selector) {
          var input = [],
            results = [],
            matcher = compile(selector.replace(rtrim, "$1"));
          return matcher[expando]
            ? markFunction(function (seed, matches, context, xml) {
                var elem,
                  unmatched = matcher(seed, null, xml, []),
                  i = seed.length;
                while (i--) {
                  if ((elem = unmatched[i])) {
                    seed[i] = !(matches[i] = elem);
                  }
                }
              })
            : function (elem, context, xml) {
                input[0] = elem;
                matcher(input, null, xml, results);
                input[0] = null;
                return !results.pop();
              };
        }),
        has: markFunction(function (selector) {
          return function (elem) {
            return Sizzle(selector, elem).length > 0;
          };
        }),
        contains: markFunction(function (text) {
          text = text.replace(runescape, funescape);
          return function (elem) {
            return (elem.textContent || elem.innerText || getText(elem)).indexOf(text) > -1;
          };
        }),
        lang: markFunction(function (lang) {
          if (!ridentifier.test(lang || "")) {
            Sizzle.error("unsupported lang: " + lang);
          }
          lang = lang.replace(runescape, funescape).toLowerCase();
          return function (elem) {
            var elemLang;
            do {
              if ((elemLang = documentIsHTML ? elem.lang : elem.getAttribute("xml:lang") || elem.getAttribute("lang"))) {
                elemLang = elemLang.toLowerCase();
                return elemLang === lang || elemLang.indexOf(lang + "-") === 0;
              }
            } while ((elem = elem.parentNode) && elem.nodeType === 1);
            return false;
          };
        }),
        target: function (elem) {
          var hash = window.location && window.location.hash;
          return hash && hash.slice(1) === elem.id;
        },
        root: function (elem) {
          return elem === docElem;
        },
        focus: function (elem) {
          return (
            elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex)
          );
        },
        enabled: createDisabledPseudo(false),
        disabled: createDisabledPseudo(true),
        checked: function (elem) {
          var nodeName = elem.nodeName.toLowerCase();
          return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
        },
        selected: function (elem) {
          if (elem.parentNode) {
            elem.parentNode.selectedIndex;
          }
          return elem.selected === true;
        },
        empty: function (elem) {
          for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
            if (elem.nodeType < 6) {
              return false;
            }
          }
          return true;
        },
        parent: function (elem) {
          return !Expr.pseudos["empty"](elem);
        },
        header: function (elem) {
          return rheader.test(elem.nodeName);
        },
        input: function (elem) {
          return rinputs.test(elem.nodeName);
        },
        button: function (elem) {
          var name = elem.nodeName.toLowerCase();
          return (name === "input" && elem.type === "button") || name === "button";
        },
        text: function (elem) {
          var attr;
          return (
            elem.nodeName.toLowerCase() === "input" &&
            elem.type === "text" &&
            ((attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text")
          );
        },
        first: createPositionalPseudo(function () {
          return [0];
        }),
        last: createPositionalPseudo(function (matchIndexes, length) {
          return [length - 1];
        }),
        eq: createPositionalPseudo(function (matchIndexes, length, argument) {
          return [argument < 0 ? argument + length : argument];
        }),
        even: createPositionalPseudo(function (matchIndexes, length) {
          var i = 0;
          for (; i < length; i += 2) {
            matchIndexes.push(i);
          }
          return matchIndexes;
        }),
        odd: createPositionalPseudo(function (matchIndexes, length) {
          var i = 1;
          for (; i < length; i += 2) {
            matchIndexes.push(i);
          }
          return matchIndexes;
        }),
        lt: createPositionalPseudo(function (matchIndexes, length, argument) {
          var i = argument < 0 ? argument + length : argument;
          for (; --i >= 0; ) {
            matchIndexes.push(i);
          }
          return matchIndexes;
        }),
        gt: createPositionalPseudo(function (matchIndexes, length, argument) {
          var i = argument < 0 ? argument + length : argument;
          for (; ++i < length; ) {
            matchIndexes.push(i);
          }
          return matchIndexes;
        }),
      },
    };
    Expr.pseudos["nth"] = Expr.pseudos["eq"];
    for (i in { radio: true, checkbox: true, file: true, password: true, image: true }) {
      Expr.pseudos[i] = createInputPseudo(i);
    }
    for (i in { submit: true, reset: true }) {
      Expr.pseudos[i] = createButtonPseudo(i);
    }
    function setFilters() {}
    setFilters.prototype = Expr.filters = Expr.pseudos;
    Expr.setFilters = new setFilters();
    tokenize = Sizzle.tokenize = function (selector, parseOnly) {
      var matched,
        match,
        tokens,
        type,
        soFar,
        groups,
        preFilters,
        cached = tokenCache[selector + " "];
      if (cached) {
        return parseOnly ? 0 : cached.slice(0);
      }
      soFar = selector;
      groups = [];
      preFilters = Expr.preFilter;
      while (soFar) {
        if (!matched || (match = rcomma.exec(soFar))) {
          if (match) {
            soFar = soFar.slice(match[0].length) || soFar;
          }
          groups.push((tokens = []));
        }
        matched = false;
        if ((match = rcombinators.exec(soFar))) {
          matched = match.shift();
          tokens.push({ value: matched, type: match[0].replace(rtrim, " ") });
          soFar = soFar.slice(matched.length);
        }
        for (type in Expr.filter) {
          if ((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))) {
            matched = match.shift();
            tokens.push({ value: matched, type: type, matches: match });
            soFar = soFar.slice(matched.length);
          }
        }
        if (!matched) {
          break;
        }
      }
      return parseOnly ? soFar.length : soFar ? Sizzle.error(selector) : tokenCache(selector, groups).slice(0);
    };
    function toSelector(tokens) {
      var i = 0,
        len = tokens.length,
        selector = "";
      for (; i < len; i++) {
        selector += tokens[i].value;
      }
      return selector;
    }
    function addCombinator(matcher, combinator, base) {
      var dir = combinator.dir,
        skip = combinator.next,
        key = skip || dir,
        checkNonElements = base && key === "parentNode",
        doneName = done++;
      return combinator.first
        ? function (elem, context, xml) {
            while ((elem = elem[dir])) {
              if (elem.nodeType === 1 || checkNonElements) {
                return matcher(elem, context, xml);
              }
            }
            return false;
          }
        : function (elem, context, xml) {
            var oldCache,
              uniqueCache,
              outerCache,
              newCache = [dirruns, doneName];
            if (xml) {
              while ((elem = elem[dir])) {
                if (elem.nodeType === 1 || checkNonElements) {
                  if (matcher(elem, context, xml)) {
                    return true;
                  }
                }
              }
            } else {
              while ((elem = elem[dir])) {
                if (elem.nodeType === 1 || checkNonElements) {
                  outerCache = elem[expando] || (elem[expando] = {});
                  uniqueCache = outerCache[elem.uniqueID] || (outerCache[elem.uniqueID] = {});
                  if (skip && skip === elem.nodeName.toLowerCase()) {
                    elem = elem[dir] || elem;
                  } else if ((oldCache = uniqueCache[key]) && oldCache[0] === dirruns && oldCache[1] === doneName) {
                    return (newCache[2] = oldCache[2]);
                  } else {
                    uniqueCache[key] = newCache;
                    if ((newCache[2] = matcher(elem, context, xml))) {
                      return true;
                    }
                  }
                }
              }
            }
            return false;
          };
    }
    function elementMatcher(matchers) {
      return matchers.length > 1
        ? function (elem, context, xml) {
            var i = matchers.length;
            while (i--) {
              if (!matchers[i](elem, context, xml)) {
                return false;
              }
            }
            return true;
          }
        : matchers[0];
    }
    function multipleContexts(selector, contexts, results) {
      var i = 0,
        len = contexts.length;
      for (; i < len; i++) {
        Sizzle(selector, contexts[i], results);
      }
      return results;
    }
    function condense(unmatched, map, filter, context, xml) {
      var elem,
        newUnmatched = [],
        i = 0,
        len = unmatched.length,
        mapped = map != null;
      for (; i < len; i++) {
        if ((elem = unmatched[i])) {
          if (!filter || filter(elem, context, xml)) {
            newUnmatched.push(elem);
            if (mapped) {
              map.push(i);
            }
          }
        }
      }
      return newUnmatched;
    }
    function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
      if (postFilter && !postFilter[expando]) {
        postFilter = setMatcher(postFilter);
      }
      if (postFinder && !postFinder[expando]) {
        postFinder = setMatcher(postFinder, postSelector);
      }
      return markFunction(function (seed, results, context, xml) {
        var temp,
          i,
          elem,
          preMap = [],
          postMap = [],
          preexisting = results.length,
          elems = seed || multipleContexts(selector || "*", context.nodeType ? [context] : context, []),
          matcherIn = preFilter && (seed || !selector) ? condense(elems, preMap, preFilter, context, xml) : elems,
          matcherOut = matcher ? (postFinder || (seed ? preFilter : preexisting || postFilter) ? [] : results) : matcherIn;
        if (matcher) {
          matcher(matcherIn, matcherOut, context, xml);
        }
        if (postFilter) {
          temp = condense(matcherOut, postMap);
          postFilter(temp, [], context, xml);
          i = temp.length;
          while (i--) {
            if ((elem = temp[i])) {
              matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem);
            }
          }
        }
        if (seed) {
          if (postFinder || preFilter) {
            if (postFinder) {
              temp = [];
              i = matcherOut.length;
              while (i--) {
                if ((elem = matcherOut[i])) {
                  temp.push((matcherIn[i] = elem));
                }
              }
              postFinder(null, (matcherOut = []), temp, xml);
            }
            i = matcherOut.length;
            while (i--) {
              if ((elem = matcherOut[i]) && (temp = postFinder ? indexOf(seed, elem) : preMap[i]) > -1) {
                seed[temp] = !(results[temp] = elem);
              }
            }
          }
        } else {
          matcherOut = condense(matcherOut === results ? matcherOut.splice(preexisting, matcherOut.length) : matcherOut);
          if (postFinder) {
            postFinder(null, results, matcherOut, xml);
          } else {
            push.apply(results, matcherOut);
          }
        }
      });
    }
    function matcherFromTokens(tokens) {
      var checkContext,
        matcher,
        j,
        len = tokens.length,
        leadingRelative = Expr.relative[tokens[0].type],
        implicitRelative = leadingRelative || Expr.relative[" "],
        i = leadingRelative ? 1 : 0,
        matchContext = addCombinator(
          function (elem) {
            return elem === checkContext;
          },
          implicitRelative,
          true
        ),
        matchAnyContext = addCombinator(
          function (elem) {
            return indexOf(checkContext, elem) > -1;
          },
          implicitRelative,
          true
        ),
        matchers = [
          function (elem, context, xml) {
            var ret =
              (!leadingRelative && (xml || context !== outermostContext)) ||
              ((checkContext = context).nodeType ? matchContext(elem, context, xml) : matchAnyContext(elem, context, xml));
            checkContext = null;
            return ret;
          },
        ];
      for (; i < len; i++) {
        if ((matcher = Expr.relative[tokens[i].type])) {
          matchers = [addCombinator(elementMatcher(matchers), matcher)];
        } else {
          matcher = Expr.filter[tokens[i].type].apply(null, tokens[i].matches);
          if (matcher[expando]) {
            j = ++i;
            for (; j < len; j++) {
              if (Expr.relative[tokens[j].type]) {
                break;
              }
            }
            return setMatcher(
              i > 1 && elementMatcher(matchers),
              i > 1 && toSelector(tokens.slice(0, i - 1).concat({ value: tokens[i - 2].type === " " ? "*" : "" })).replace(rtrim, "$1"),
              matcher,
              i < j && matcherFromTokens(tokens.slice(i, j)),
              j < len && matcherFromTokens((tokens = tokens.slice(j))),
              j < len && toSelector(tokens)
            );
          }
          matchers.push(matcher);
        }
      }
      return elementMatcher(matchers);
    }
    function matcherFromGroupMatchers(elementMatchers, setMatchers) {
      var bySet = setMatchers.length > 0,
        byElement = elementMatchers.length > 0,
        superMatcher = function (seed, context, xml, results, outermost) {
          var elem,
            j,
            matcher,
            matchedCount = 0,
            i = "0",
            unmatched = seed && [],
            setMatched = [],
            contextBackup = outermostContext,
            elems = seed || (byElement && Expr.find["TAG"]("*", outermost)),
            dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
            len = elems.length;
          if (outermost) {
            outermostContext = context === document || context || outermost;
          }
          for (; i !== len && (elem = elems[i]) != null; i++) {
            if (byElement && elem) {
              j = 0;
              if (!context && elem.ownerDocument !== document) {
                setDocument(elem);
                xml = !documentIsHTML;
              }
              while ((matcher = elementMatchers[j++])) {
                if (matcher(elem, context || document, xml)) {
                  results.push(elem);
                  break;
                }
              }
              if (outermost) {
                dirruns = dirrunsUnique;
              }
            }
            if (bySet) {
              if ((elem = !matcher && elem)) {
                matchedCount--;
              }
              if (seed) {
                unmatched.push(elem);
              }
            }
          }
          matchedCount += i;
          if (bySet && i !== matchedCount) {
            j = 0;
            while ((matcher = setMatchers[j++])) {
              matcher(unmatched, setMatched, context, xml);
            }
            if (seed) {
              if (matchedCount > 0) {
                while (i--) {
                  if (!(unmatched[i] || setMatched[i])) {
                    setMatched[i] = pop.call(results);
                  }
                }
              }
              setMatched = condense(setMatched);
            }
            push.apply(results, setMatched);
            if (outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1) {
              Sizzle.uniqueSort(results);
            }
          }
          if (outermost) {
            dirruns = dirrunsUnique;
            outermostContext = contextBackup;
          }
          return unmatched;
        };
      return bySet ? markFunction(superMatcher) : superMatcher;
    }
    compile = Sizzle.compile = function (selector, match) {
      var i,
        setMatchers = [],
        elementMatchers = [],
        cached = compilerCache[selector + " "];
      if (!cached) {
        if (!match) {
          match = tokenize(selector);
        }
        i = match.length;
        while (i--) {
          cached = matcherFromTokens(match[i]);
          if (cached[expando]) {
            setMatchers.push(cached);
          } else {
            elementMatchers.push(cached);
          }
        }
        cached = compilerCache(selector, matcherFromGroupMatchers(elementMatchers, setMatchers));
        cached.selector = selector;
      }
      return cached;
    };
    select = Sizzle.select = function (selector, context, results, seed) {
      var i,
        tokens,
        token,
        type,
        find,
        compiled = typeof selector === "function" && selector,
        match = !seed && tokenize((selector = compiled.selector || selector));
      results = results || [];
      if (match.length === 1) {
        tokens = match[0] = match[0].slice(0);
        if (
          tokens.length > 2 &&
          (token = tokens[0]).type === "ID" &&
          context.nodeType === 9 &&
          documentIsHTML &&
          Expr.relative[tokens[1].type]
        ) {
          context = (Expr.find["ID"](token.matches[0].replace(runescape, funescape), context) || [])[0];
          if (!context) {
            return results;
          } else if (compiled) {
            context = context.parentNode;
          }
          selector = selector.slice(tokens.shift().value.length);
        }
        i = matchExpr["needsContext"].test(selector) ? 0 : tokens.length;
        while (i--) {
          token = tokens[i];
          if (Expr.relative[(type = token.type)]) {
            break;
          }
          if ((find = Expr.find[type])) {
            if (
              (seed = find(
                token.matches[0].replace(runescape, funescape),
                (rsibling.test(tokens[0].type) && testContext(context.parentNode)) || context
              ))
            ) {
              tokens.splice(i, 1);
              selector = seed.length && toSelector(tokens);
              if (!selector) {
                push.apply(results, seed);
                return results;
              }
              break;
            }
          }
        }
      }
      (compiled || compile(selector, match))(
        seed,
        context,
        !documentIsHTML,
        results,
        !context || (rsibling.test(selector) && testContext(context.parentNode)) || context
      );
      return results;
    };
    support.sortStable = expando.split("").sort(sortOrder).join("") === expando;
    support.detectDuplicates = !!hasDuplicate;
    setDocument();
    support.sortDetached = assert(function (el) {
      return el.compareDocumentPosition(document.createElement("fieldset")) & 1;
    });
    if (
      !assert(function (el) {
        el.innerHTML = "<a href='#'></a>";
        return el.firstChild.getAttribute("href") === "#";
      })
    ) {
      addHandle("type|href|height|width", function (elem, name, isXML) {
        if (!isXML) {
          return elem.getAttribute(name, name.toLowerCase() === "type" ? 1 : 2);
        }
      });
    }
    if (
      !support.attributes ||
      !assert(function (el) {
        el.innerHTML = "<input/>";
        el.firstChild.setAttribute("value", "");
        return el.firstChild.getAttribute("value") === "";
      })
    ) {
      addHandle("value", function (elem, name, isXML) {
        if (!isXML && elem.nodeName.toLowerCase() === "input") {
          return elem.defaultValue;
        }
      });
    }
    if (
      !assert(function (el) {
        return el.getAttribute("disabled") == null;
      })
    ) {
      addHandle(booleans, function (elem, name, isXML) {
        var val;
        if (!isXML) {
          return elem[name] === true ? name.toLowerCase() : (val = elem.getAttributeNode(name)) && val.specified ? val.value : null;
        }
      });
    }
    return Sizzle;
  })(window);
  jQuery.find = Sizzle;
  jQuery.expr = Sizzle.selectors;
  jQuery.expr[":"] = jQuery.expr.pseudos;
  jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
  jQuery.text = Sizzle.getText;
  jQuery.isXMLDoc = Sizzle.isXML;
  jQuery.contains = Sizzle.contains;
  jQuery.escapeSelector = Sizzle.escape;
  var dir = function (elem, dir, until) {
    var matched = [],
      truncate = until !== undefined;
    while ((elem = elem[dir]) && elem.nodeType !== 9) {
      if (elem.nodeType === 1) {
        if (truncate && jQuery(elem).is(until)) {
          break;
        }
        matched.push(elem);
      }
    }
    return matched;
  };
  var siblings = function (n, elem) {
    var matched = [];
    for (; n; n = n.nextSibling) {
      if (n.nodeType === 1 && n !== elem) {
        matched.push(n);
      }
    }
    return matched;
  };
  var rneedsContext = jQuery.expr.match.needsContext;
  function nodeName(elem, name) {
    return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
  }
  var rsingleTag = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;
  var risSimple = /^.[^:#\[\.,]*$/;
  function winnow(elements, qualifier, not) {
    if (jQuery.isFunction(qualifier)) {
      return jQuery.grep(elements, function (elem, i) {
        return !!qualifier.call(elem, i, elem) !== not;
      });
    }
    if (qualifier.nodeType) {
      return jQuery.grep(elements, function (elem) {
        return (elem === qualifier) !== not;
      });
    }
    if (typeof qualifier !== "string") {
      return jQuery.grep(elements, function (elem) {
        return indexOf.call(qualifier, elem) > -1 !== not;
      });
    }
    if (risSimple.test(qualifier)) {
      return jQuery.filter(qualifier, elements, not);
    }
    qualifier = jQuery.filter(qualifier, elements);
    return jQuery.grep(elements, function (elem) {
      return indexOf.call(qualifier, elem) > -1 !== not && elem.nodeType === 1;
    });
  }
  jQuery.filter = function (expr, elems, not) {
    var elem = elems[0];
    if (not) {
      expr = ":not(" + expr + ")";
    }
    if (elems.length === 1 && elem.nodeType === 1) {
      return jQuery.find.matchesSelector(elem, expr) ? [elem] : [];
    }
    return jQuery.find.matches(
      expr,
      jQuery.grep(elems, function (elem) {
        return elem.nodeType === 1;
      })
    );
  };
  jQuery.fn.extend({
    find: function (selector) {
      var i,
        ret,
        len = this.length,
        self = this;
      if (typeof selector !== "string") {
        return this.pushStack(
          jQuery(selector).filter(function () {
            for (i = 0; i < len; i++) {
              if (jQuery.contains(self[i], this)) {
                return true;
              }
            }
          })
        );
      }
      ret = this.pushStack([]);
      for (i = 0; i < len; i++) {
        jQuery.find(selector, self[i], ret);
      }
      return len > 1 ? jQuery.uniqueSort(ret) : ret;
    },
    filter: function (selector) {
      return this.pushStack(winnow(this, selector || [], false));
    },
    not: function (selector) {
      return this.pushStack(winnow(this, selector || [], true));
    },
    is: function (selector) {
      return !!winnow(this, typeof selector === "string" && rneedsContext.test(selector) ? jQuery(selector) : selector || [], false).length;
    },
  });
  var rootjQuery,
    rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,
    init = (jQuery.fn.init = function (selector, context, root) {
      var match, elem;
      if (!selector) {
        return this;
      }
      root = root || rootjQuery;
      if (typeof selector === "string") {
        if (selector[0] === "<" && selector[selector.length - 1] === ">" && selector.length >= 3) {
          match = [null, selector, null];
        } else {
          match = rquickExpr.exec(selector);
        }
        if (match && (match[1] || !context)) {
          if (match[1]) {
            context = context instanceof jQuery ? context[0] : context;
            jQuery.merge(this, jQuery.parseHTML(match[1], context && context.nodeType ? context.ownerDocument || context : document, true));
            if (rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) {
              for (match in context) {
                if (jQuery.isFunction(this[match])) {
                  this[match](context[match]);
                } else {
                  this.attr(match, context[match]);
                }
              }
            }
            return this;
          } else {
            elem = document.getElementById(match[2]);
            if (elem) {
              this[0] = elem;
              this.length = 1;
            }
            return this;
          }
        } else if (!context || context.jquery) {
          return (context || root).find(selector);
        } else {
          return this.constructor(context).find(selector);
        }
      } else if (selector.nodeType) {
        this[0] = selector;
        this.length = 1;
        return this;
      } else if (jQuery.isFunction(selector)) {
        return root.ready !== undefined ? root.ready(selector) : selector(jQuery);
      }
      return jQuery.makeArray(selector, this);
    });
  init.prototype = jQuery.fn;
  rootjQuery = jQuery(document);
  var rparentsprev = /^(?:parents|prev(?:Until|All))/,
    guaranteedUnique = { children: true, contents: true, next: true, prev: true };
  jQuery.fn.extend({
    has: function (target) {
      var targets = jQuery(target, this),
        l = targets.length;
      return this.filter(function () {
        var i = 0;
        for (; i < l; i++) {
          if (jQuery.contains(this, targets[i])) {
            return true;
          }
        }
      });
    },
    closest: function (selectors, context) {
      var cur,
        i = 0,
        l = this.length,
        matched = [],
        targets = typeof selectors !== "string" && jQuery(selectors);
      if (!rneedsContext.test(selectors)) {
        for (; i < l; i++) {
          for (cur = this[i]; cur && cur !== context; cur = cur.parentNode) {
            if (
              cur.nodeType < 11 &&
              (targets ? targets.index(cur) > -1 : cur.nodeType === 1 && jQuery.find.matchesSelector(cur, selectors))
            ) {
              matched.push(cur);
              break;
            }
          }
        }
      }
      return this.pushStack(matched.length > 1 ? jQuery.uniqueSort(matched) : matched);
    },
    index: function (elem) {
      if (!elem) {
        return this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
      }
      if (typeof elem === "string") {
        return indexOf.call(jQuery(elem), this[0]);
      }
      return indexOf.call(this, elem.jquery ? elem[0] : elem);
    },
    add: function (selector, context) {
      return this.pushStack(jQuery.uniqueSort(jQuery.merge(this.get(), jQuery(selector, context))));
    },
    addBack: function (selector) {
      return this.add(selector == null ? this.prevObject : this.prevObject.filter(selector));
    },
  });
  function sibling(cur, dir) {
    while ((cur = cur[dir]) && cur.nodeType !== 1) {}
    return cur;
  }
  jQuery.each(
    {
      parent: function (elem) {
        var parent = elem.parentNode;
        return parent && parent.nodeType !== 11 ? parent : null;
      },
      parents: function (elem) {
        return dir(elem, "parentNode");
      },
      parentsUntil: function (elem, i, until) {
        return dir(elem, "parentNode", until);
      },
      next: function (elem) {
        return sibling(elem, "nextSibling");
      },
      prev: function (elem) {
        return sibling(elem, "previousSibling");
      },
      nextAll: function (elem) {
        return dir(elem, "nextSibling");
      },
      prevAll: function (elem) {
        return dir(elem, "previousSibling");
      },
      nextUntil: function (elem, i, until) {
        return dir(elem, "nextSibling", until);
      },
      prevUntil: function (elem, i, until) {
        return dir(elem, "previousSibling", until);
      },
      siblings: function (elem) {
        return siblings((elem.parentNode || {}).firstChild, elem);
      },
      children: function (elem) {
        return siblings(elem.firstChild);
      },
      contents: function (elem) {
        if (nodeName(elem, "iframe")) {
          return elem.contentDocument;
        }
        if (nodeName(elem, "template")) {
          elem = elem.content || elem;
        }
        return jQuery.merge([], elem.childNodes);
      },
    },
    function (name, fn) {
      jQuery.fn[name] = function (until, selector) {
        var matched = jQuery.map(this, fn, until);
        if (name.slice(-5) !== "Until") {
          selector = until;
        }
        if (selector && typeof selector === "string") {
          matched = jQuery.filter(selector, matched);
        }
        if (this.length > 1) {
          if (!guaranteedUnique[name]) {
            jQuery.uniqueSort(matched);
          }
          if (rparentsprev.test(name)) {
            matched.reverse();
          }
        }
        return this.pushStack(matched);
      };
    }
  );
  var rnothtmlwhite = /[^\x20\t\r\n\f]+/g;
  function createOptions(options) {
    var object = {};
    jQuery.each(options.match(rnothtmlwhite) || [], function (_, flag) {
      object[flag] = true;
    });
    return object;
  }
  jQuery.Callbacks = function (options) {
    options = typeof options === "string" ? createOptions(options) : jQuery.extend({}, options);
    var firing,
      memory,
      fired,
      locked,
      list = [],
      queue = [],
      firingIndex = -1,
      fire = function () {
        locked = locked || options.once;
        fired = firing = true;
        for (; queue.length; firingIndex = -1) {
          memory = queue.shift();
          while (++firingIndex < list.length) {
            if (list[firingIndex].apply(memory[0], memory[1]) === false && options.stopOnFalse) {
              firingIndex = list.length;
              memory = false;
            }
          }
        }
        if (!options.memory) {
          memory = false;
        }
        firing = false;
        if (locked) {
          if (memory) {
            list = [];
          } else {
            list = "";
          }
        }
      },
      self = {
        add: function () {
          if (list) {
            if (memory && !firing) {
              firingIndex = list.length - 1;
              queue.push(memory);
            }
            (function add(args) {
              jQuery.each(args, function (_, arg) {
                if (jQuery.isFunction(arg)) {
                  if (!options.unique || !self.has(arg)) {
                    list.push(arg);
                  }
                } else if (arg && arg.length && jQuery.type(arg) !== "string") {
                  add(arg);
                }
              });
            })(arguments);
            if (memory && !firing) {
              fire();
            }
          }
          return this;
        },
        remove: function () {
          jQuery.each(arguments, function (_, arg) {
            var index;
            while ((index = jQuery.inArray(arg, list, index)) > -1) {
              list.splice(index, 1);
              if (index <= firingIndex) {
                firingIndex--;
              }
            }
          });
          return this;
        },
        has: function (fn) {
          return fn ? jQuery.inArray(fn, list) > -1 : list.length > 0;
        },
        empty: function () {
          if (list) {
            list = [];
          }
          return this;
        },
        disable: function () {
          locked = queue = [];
          list = memory = "";
          return this;
        },
        disabled: function () {
          return !list;
        },
        lock: function () {
          locked = queue = [];
          if (!memory && !firing) {
            list = memory = "";
          }
          return this;
        },
        locked: function () {
          return !!locked;
        },
        fireWith: function (context, args) {
          if (!locked) {
            args = args || [];
            args = [context, args.slice ? args.slice() : args];
            queue.push(args);
            if (!firing) {
              fire();
            }
          }
          return this;
        },
        fire: function () {
          self.fireWith(this, arguments);
          return this;
        },
        fired: function () {
          return !!fired;
        },
      };
    return self;
  };
  function Identity(v) {
    return v;
  }
  function Thrower(ex) {
    throw ex;
  }
  function adoptValue(value, resolve, reject, noValue) {
    var method;
    try {
      if (value && jQuery.isFunction((method = value.promise))) {
        method.call(value).done(resolve).fail(reject);
      } else if (value && jQuery.isFunction((method = value.then))) {
        method.call(value, resolve, reject);
      } else {
        resolve.apply(undefined, [value].slice(noValue));
      }
    } catch (value) {
      reject.apply(undefined, [value]);
    }
  }
  jQuery.extend({
    Deferred: function (func) {
      var tuples = [
          ["notify", "progress", jQuery.Callbacks("memory"), jQuery.Callbacks("memory"), 2],
          ["resolve", "done", jQuery.Callbacks("once memory"), jQuery.Callbacks("once memory"), 0, "resolved"],
          ["reject", "fail", jQuery.Callbacks("once memory"), jQuery.Callbacks("once memory"), 1, "rejected"],
        ],
        state = "pending",
        promise = {
          state: function () {
            return state;
          },
          always: function () {
            deferred.done(arguments).fail(arguments);
            return this;
          },
          catch: function (fn) {
            return promise.then(null, fn);
          },
          pipe: function () {
            var fns = arguments;
            return jQuery
              .Deferred(function (newDefer) {
                jQuery.each(tuples, function (i, tuple) {
                  var fn = jQuery.isFunction(fns[tuple[4]]) && fns[tuple[4]];
                  deferred[tuple[1]](function () {
                    var returned = fn && fn.apply(this, arguments);
                    if (returned && jQuery.isFunction(returned.promise)) {
                      returned.promise().progress(newDefer.notify).done(newDefer.resolve).fail(newDefer.reject);
                    } else {
                      newDefer[tuple[0] + "With"](this, fn ? [returned] : arguments);
                    }
                  });
                });
                fns = null;
              })
              .promise();
          },
          then: function (onFulfilled, onRejected, onProgress) {
            var maxDepth = 0;
            function resolve(depth, deferred, handler, special) {
              return function () {
                var that = this,
                  args = arguments,
                  mightThrow = function () {
                    var returned, then;
                    if (depth < maxDepth) {
                      return;
                    }
                    returned = handler.apply(that, args);
                    if (returned === deferred.promise()) {
                      throw new TypeError("Thenable self-resolution");
                    }
                    then = returned && (typeof returned === "object" || typeof returned === "function") && returned.then;
                    if (jQuery.isFunction(then)) {
                      if (special) {
                        then.call(returned, resolve(maxDepth, deferred, Identity, special), resolve(maxDepth, deferred, Thrower, special));
                      } else {
                        maxDepth++;
                        then.call(
                          returned,
                          resolve(maxDepth, deferred, Identity, special),
                          resolve(maxDepth, deferred, Thrower, special),
                          resolve(maxDepth, deferred, Identity, deferred.notifyWith)
                        );
                      }
                    } else {
                      if (handler !== Identity) {
                        that = undefined;
                        args = [returned];
                      }
                      (special || deferred.resolveWith)(that, args);
                    }
                  },
                  process = special
                    ? mightThrow
                    : function () {
                        try {
                          mightThrow();
                        } catch (e) {
                          if (jQuery.Deferred.exceptionHook) {
                            jQuery.Deferred.exceptionHook(e, process.stackTrace);
                          }
                          if (depth + 1 >= maxDepth) {
                            if (handler !== Thrower) {
                              that = undefined;
                              args = [e];
                            }
                            deferred.rejectWith(that, args);
                          }
                        }
                      };
                if (depth) {
                  process();
                } else {
                  if (jQuery.Deferred.getStackHook) {
                    process.stackTrace = jQuery.Deferred.getStackHook();
                  }
                  window.setTimeout(process);
                }
              };
            }
            return jQuery
              .Deferred(function (newDefer) {
                tuples[0][3].add(resolve(0, newDefer, jQuery.isFunction(onProgress) ? onProgress : Identity, newDefer.notifyWith));
                tuples[1][3].add(resolve(0, newDefer, jQuery.isFunction(onFulfilled) ? onFulfilled : Identity));
                tuples[2][3].add(resolve(0, newDefer, jQuery.isFunction(onRejected) ? onRejected : Thrower));
              })
              .promise();
          },
          promise: function (obj) {
            return obj != null ? jQuery.extend(obj, promise) : promise;
          },
        },
        deferred = {};
      jQuery.each(tuples, function (i, tuple) {
        var list = tuple[2],
          stateString = tuple[5];
        promise[tuple[1]] = list.add;
        if (stateString) {
          list.add(
            function () {
              state = stateString;
            },
            tuples[3 - i][2].disable,
            tuples[0][2].lock
          );
        }
        list.add(tuple[3].fire);
        deferred[tuple[0]] = function () {
          deferred[tuple[0] + "With"](this === deferred ? undefined : this, arguments);
          return this;
        };
        deferred[tuple[0] + "With"] = list.fireWith;
      });
      promise.promise(deferred);
      if (func) {
        func.call(deferred, deferred);
      }
      return deferred;
    },
    when: function (singleValue) {
      var remaining = arguments.length,
        i = remaining,
        resolveContexts = Array(i),
        resolveValues = slice.call(arguments),
        master = jQuery.Deferred(),
        updateFunc = function (i) {
          return function (value) {
            resolveContexts[i] = this;
            resolveValues[i] = arguments.length > 1 ? slice.call(arguments) : value;
            if (!--remaining) {
              master.resolveWith(resolveContexts, resolveValues);
            }
          };
        };
      if (remaining <= 1) {
        adoptValue(singleValue, master.done(updateFunc(i)).resolve, master.reject, !remaining);
        if (master.state() === "pending" || jQuery.isFunction(resolveValues[i] && resolveValues[i].then)) {
          return master.then();
        }
      }
      while (i--) {
        adoptValue(resolveValues[i], updateFunc(i), master.reject);
      }
      return master.promise();
    },
  });
  var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;
  jQuery.Deferred.exceptionHook = function (error, stack) {
    if (window.console && window.console.warn && error && rerrorNames.test(error.name)) {
      window.console.warn("jQuery.Deferred exception: " + error.message, error.stack, stack);
    }
  };
  jQuery.readyException = function (error) {
    window.setTimeout(function () {
      throw error;
    });
  };
  var readyList = jQuery.Deferred();
  jQuery.fn.ready = function (fn) {
    readyList.then(fn).catch(function (error) {
      jQuery.readyException(error);
    });
    return this;
  };
  jQuery.extend({
    isReady: false,
    readyWait: 1,
    ready: function (wait) {
      if (wait === true ? --jQuery.readyWait : jQuery.isReady) {
        return;
      }
      jQuery.isReady = true;
      if (wait !== true && --jQuery.readyWait > 0) {
        return;
      }
      readyList.resolveWith(document, [jQuery]);
    },
  });
  jQuery.ready.then = readyList.then;
  function completed() {
    document.removeEventListener("DOMContentLoaded", completed);
    window.removeEventListener("load", completed);
    jQuery.ready();
  }
  if (document.readyState === "complete" || (document.readyState !== "loading" && !document.documentElement.doScroll)) {
    window.setTimeout(jQuery.ready);
  } else {
    document.addEventListener("DOMContentLoaded", completed);
    window.addEventListener("load", completed);
  }
  var access = function (elems, fn, key, value, chainable, emptyGet, raw) {
    var i = 0,
      len = elems.length,
      bulk = key == null;
    if (jQuery.type(key) === "object") {
      chainable = true;
      for (i in key) {
        access(elems, fn, i, key[i], true, emptyGet, raw);
      }
    } else if (value !== undefined) {
      chainable = true;
      if (!jQuery.isFunction(value)) {
        raw = true;
      }
      if (bulk) {
        if (raw) {
          fn.call(elems, value);
          fn = null;
        } else {
          bulk = fn;
          fn = function (elem, key, value) {
            return bulk.call(jQuery(elem), value);
          };
        }
      }
      if (fn) {
        for (; i < len; i++) {
          fn(elems[i], key, raw ? value : value.call(elems[i], i, fn(elems[i], key)));
        }
      }
    }
    if (chainable) {
      return elems;
    }
    if (bulk) {
      return fn.call(elems);
    }
    return len ? fn(elems[0], key) : emptyGet;
  };
  var acceptData = function (owner) {
    return owner.nodeType === 1 || owner.nodeType === 9 || !+owner.nodeType;
  };
  function Data() {
    this.expando = jQuery.expando + Data.uid++;
  }
  Data.uid = 1;
  Data.prototype = {
    cache: function (owner) {
      var value = owner[this.expando];
      if (!value) {
        value = {};
        if (acceptData(owner)) {
          if (owner.nodeType) {
            owner[this.expando] = value;
          } else {
            Object.defineProperty(owner, this.expando, { value: value, configurable: true });
          }
        }
      }
      return value;
    },
    set: function (owner, data, value) {
      var prop,
        cache = this.cache(owner);
      if (typeof data === "string") {
        cache[jQuery.camelCase(data)] = value;
      } else {
        for (prop in data) {
          cache[jQuery.camelCase(prop)] = data[prop];
        }
      }
      return cache;
    },
    get: function (owner, key) {
      return key === undefined ? this.cache(owner) : owner[this.expando] && owner[this.expando][jQuery.camelCase(key)];
    },
    access: function (owner, key, value) {
      if (key === undefined || (key && typeof key === "string" && value === undefined)) {
        return this.get(owner, key);
      }
      this.set(owner, key, value);
      return value !== undefined ? value : key;
    },
    remove: function (owner, key) {
      var i,
        cache = owner[this.expando];
      if (cache === undefined) {
        return;
      }
      if (key !== undefined) {
        if (Array.isArray(key)) {
          key = key.map(jQuery.camelCase);
        } else {
          key = jQuery.camelCase(key);
          key = key in cache ? [key] : key.match(rnothtmlwhite) || [];
        }
        i = key.length;
        while (i--) {
          delete cache[key[i]];
        }
      }
      if (key === undefined || jQuery.isEmptyObject(cache)) {
        if (owner.nodeType) {
          owner[this.expando] = undefined;
        } else {
          delete owner[this.expando];
        }
      }
    },
    hasData: function (owner) {
      var cache = owner[this.expando];
      return cache !== undefined && !jQuery.isEmptyObject(cache);
    },
  };
  var dataPriv = new Data();
  var dataUser = new Data();
  var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
    rmultiDash = /[A-Z]/g;
  function getData(data) {
    if (data === "true") {
      return true;
    }
    if (data === "false") {
      return false;
    }
    if (data === "null") {
      return null;
    }
    if (data === +data + "") {
      return +data;
    }
    if (rbrace.test(data)) {
      return JSON.parse(data);
    }
    return data;
  }
  function dataAttr(elem, key, data) {
    var name;
    if (data === undefined && elem.nodeType === 1) {
      name = "data-" + key.replace(rmultiDash, "-$&").toLowerCase();
      data = elem.getAttribute(name);
      if (typeof data === "string") {
        try {
          data = getData(data);
        } catch (e) {}
        dataUser.set(elem, key, data);
      } else {
        data = undefined;
      }
    }
    return data;
  }
  jQuery.extend({
    hasData: function (elem) {
      return dataUser.hasData(elem) || dataPriv.hasData(elem);
    },
    data: function (elem, name, data) {
      return dataUser.access(elem, name, data);
    },
    removeData: function (elem, name) {
      dataUser.remove(elem, name);
    },
    _data: function (elem, name, data) {
      return dataPriv.access(elem, name, data);
    },
    _removeData: function (elem, name) {
      dataPriv.remove(elem, name);
    },
  });
  jQuery.fn.extend({
    data: function (key, value) {
      var i,
        name,
        data,
        elem = this[0],
        attrs = elem && elem.attributes;
      if (key === undefined) {
        if (this.length) {
          data = dataUser.get(elem);
          if (elem.nodeType === 1 && !dataPriv.get(elem, "hasDataAttrs")) {
            i = attrs.length;
            while (i--) {
              if (attrs[i]) {
                name = attrs[i].name;
                if (name.indexOf("data-") === 0) {
                  name = jQuery.camelCase(name.slice(5));
                  dataAttr(elem, name, data[name]);
                }
              }
            }
            dataPriv.set(elem, "hasDataAttrs", true);
          }
        }
        return data;
      }
      if (typeof key === "object") {
        return this.each(function () {
          dataUser.set(this, key);
        });
      }
      return access(
        this,
        function (value) {
          var data;
          if (elem && value === undefined) {
            data = dataUser.get(elem, key);
            if (data !== undefined) {
              return data;
            }
            data = dataAttr(elem, key);
            if (data !== undefined) {
              return data;
            }
            return;
          }
          this.each(function () {
            dataUser.set(this, key, value);
          });
        },
        null,
        value,
        arguments.length > 1,
        null,
        true
      );
    },
    removeData: function (key) {
      return this.each(function () {
        dataUser.remove(this, key);
      });
    },
  });
  jQuery.extend({
    queue: function (elem, type, data) {
      var queue;
      if (elem) {
        type = (type || "fx") + "queue";
        queue = dataPriv.get(elem, type);
        if (data) {
          if (!queue || Array.isArray(data)) {
            queue = dataPriv.access(elem, type, jQuery.makeArray(data));
          } else {
            queue.push(data);
          }
        }
        return queue || [];
      }
    },
    dequeue: function (elem, type) {
      type = type || "fx";
      var queue = jQuery.queue(elem, type),
        startLength = queue.length,
        fn = queue.shift(),
        hooks = jQuery._queueHooks(elem, type),
        next = function () {
          jQuery.dequeue(elem, type);
        };
      if (fn === "inprogress") {
        fn = queue.shift();
        startLength--;
      }
      if (fn) {
        if (type === "fx") {
          queue.unshift("inprogress");
        }
        delete hooks.stop;
        fn.call(elem, next, hooks);
      }
      if (!startLength && hooks) {
        hooks.empty.fire();
      }
    },
    _queueHooks: function (elem, type) {
      var key = type + "queueHooks";
      return (
        dataPriv.get(elem, key) ||
        dataPriv.access(elem, key, {
          empty: jQuery.Callbacks("once memory").add(function () {
            dataPriv.remove(elem, [type + "queue", key]);
          }),
        })
      );
    },
  });
  jQuery.fn.extend({
    queue: function (type, data) {
      var setter = 2;
      if (typeof type !== "string") {
        data = type;
        type = "fx";
        setter--;
      }
      if (arguments.length < setter) {
        return jQuery.queue(this[0], type);
      }
      return data === undefined
        ? this
        : this.each(function () {
            var queue = jQuery.queue(this, type, data);
            jQuery._queueHooks(this, type);
            if (type === "fx" && queue[0] !== "inprogress") {
              jQuery.dequeue(this, type);
            }
          });
    },
    dequeue: function (type) {
      return this.each(function () {
        jQuery.dequeue(this, type);
      });
    },
    clearQueue: function (type) {
      return this.queue(type || "fx", []);
    },
    promise: function (type, obj) {
      var tmp,
        count = 1,
        defer = jQuery.Deferred(),
        elements = this,
        i = this.length,
        resolve = function () {
          if (!--count) {
            defer.resolveWith(elements, [elements]);
          }
        };
      if (typeof type !== "string") {
        obj = type;
        type = undefined;
      }
      type = type || "fx";
      while (i--) {
        tmp = dataPriv.get(elements[i], type + "queueHooks");
        if (tmp && tmp.empty) {
          count++;
          tmp.empty.add(resolve);
        }
      }
      resolve();
      return defer.promise(obj);
    },
  });
  var pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;
  var rcssNum = new RegExp("^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i");
  var cssExpand = ["Top", "Right", "Bottom", "Left"];
  var isHiddenWithinTree = function (elem, el) {
    elem = el || elem;
    return (
      elem.style.display === "none" ||
      (elem.style.display === "" && jQuery.contains(elem.ownerDocument, elem) && jQuery.css(elem, "display") === "none")
    );
  };
  var swap = function (elem, options, callback, args) {
    var ret,
      name,
      old = {};
    for (name in options) {
      old[name] = elem.style[name];
      elem.style[name] = options[name];
    }
    ret = callback.apply(elem, args || []);
    for (name in options) {
      elem.style[name] = old[name];
    }
    return ret;
  };
  function adjustCSS(elem, prop, valueParts, tween) {
    var adjusted,
      scale = 1,
      maxIterations = 20,
      currentValue = tween
        ? function () {
            return tween.cur();
          }
        : function () {
            return jQuery.css(elem, prop, "");
          },
      initial = currentValue(),
      unit = (valueParts && valueParts[3]) || (jQuery.cssNumber[prop] ? "" : "px"),
      initialInUnit = (jQuery.cssNumber[prop] || (unit !== "px" && +initial)) && rcssNum.exec(jQuery.css(elem, prop));
    if (initialInUnit && initialInUnit[3] !== unit) {
      unit = unit || initialInUnit[3];
      valueParts = valueParts || [];
      initialInUnit = +initial || 1;
      do {
        scale = scale || ".5";
        initialInUnit = initialInUnit / scale;
        jQuery.style(elem, prop, initialInUnit + unit);
      } while (scale !== (scale = currentValue() / initial) && scale !== 1 && --maxIterations);
    }
    if (valueParts) {
      initialInUnit = +initialInUnit || +initial || 0;
      adjusted = valueParts[1] ? initialInUnit + (valueParts[1] + 1) * valueParts[2] : +valueParts[2];
      if (tween) {
        tween.unit = unit;
        tween.start = initialInUnit;
        tween.end = adjusted;
      }
    }
    return adjusted;
  }
  var defaultDisplayMap = {};
  function getDefaultDisplay(elem) {
    var temp,
      doc = elem.ownerDocument,
      nodeName = elem.nodeName,
      display = defaultDisplayMap[nodeName];
    if (display) {
      return display;
    }
    temp = doc.body.appendChild(doc.createElement(nodeName));
    display = jQuery.css(temp, "display");
    temp.parentNode.removeChild(temp);
    if (display === "none") {
      display = "block";
    }
    defaultDisplayMap[nodeName] = display;
    return display;
  }
  function showHide(elements, show) {
    var display,
      elem,
      values = [],
      index = 0,
      length = elements.length;
    for (; index < length; index++) {
      elem = elements[index];
      if (!elem.style) {
        continue;
      }
      display = elem.style.display;
      if (show) {
        if (display === "none") {
          values[index] = dataPriv.get(elem, "display") || null;
          if (!values[index]) {
            elem.style.display = "";
          }
        }
        if (elem.style.display === "" && isHiddenWithinTree(elem)) {
          values[index] = getDefaultDisplay(elem);
        }
      } else {
        if (display !== "none") {
          values[index] = "none";
          dataPriv.set(elem, "display", display);
        }
      }
    }
    for (index = 0; index < length; index++) {
      if (values[index] != null) {
        elements[index].style.display = values[index];
      }
    }
    return elements;
  }
  jQuery.fn.extend({
    show: function () {
      return showHide(this, true);
    },
    hide: function () {
      return showHide(this);
    },
    toggle: function (state) {
      if (typeof state === "boolean") {
        return state ? this.show() : this.hide();
      }
      return this.each(function () {
        if (isHiddenWithinTree(this)) {
          jQuery(this).show();
        } else {
          jQuery(this).hide();
        }
      });
    },
  });
  var rcheckableType = /^(?:checkbox|radio)$/i;
  var rtagName = /<([a-z][^\/\0>\x20\t\r\n\f]+)/i;
  var rscriptType = /^$|\/(?:java|ecma)script/i;
  var wrapMap = {
    option: [1, "<select multiple='multiple'>", "</select>"],
    thead: [1, "<table>", "</table>"],
    col: [2, "<table><colgroup>", "</colgroup></table>"],
    tr: [2, "<table><tbody>", "</tbody></table>"],
    td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
    _default: [0, "", ""],
  };
  wrapMap.optgroup = wrapMap.option;
  wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
  wrapMap.th = wrapMap.td;
  function getAll(context, tag) {
    var ret;
    if (typeof context.getElementsByTagName !== "undefined") {
      ret = context.getElementsByTagName(tag || "*");
    } else if (typeof context.querySelectorAll !== "undefined") {
      ret = context.querySelectorAll(tag || "*");
    } else {
      ret = [];
    }
    if (tag === undefined || (tag && nodeName(context, tag))) {
      return jQuery.merge([context], ret);
    }
    return ret;
  }
  function setGlobalEval(elems, refElements) {
    var i = 0,
      l = elems.length;
    for (; i < l; i++) {
      dataPriv.set(elems[i], "globalEval", !refElements || dataPriv.get(refElements[i], "globalEval"));
    }
  }
  var rhtml = /<|&#?\w+;/;
  function buildFragment(elems, context, scripts, selection, ignored) {
    var elem,
      tmp,
      tag,
      wrap,
      contains,
      j,
      fragment = context.createDocumentFragment(),
      nodes = [],
      i = 0,
      l = elems.length;
    for (; i < l; i++) {
      elem = elems[i];
      if (elem || elem === 0) {
        if (jQuery.type(elem) === "object") {
          jQuery.merge(nodes, elem.nodeType ? [elem] : elem);
        } else if (!rhtml.test(elem)) {
          nodes.push(context.createTextNode(elem));
        } else {
          tmp = tmp || fragment.appendChild(context.createElement("div"));
          tag = (rtagName.exec(elem) || ["", ""])[1].toLowerCase();
          wrap = wrapMap[tag] || wrapMap._default;
          tmp.innerHTML = wrap[1] + jQuery.htmlPrefilter(elem) + wrap[2];
          j = wrap[0];
          while (j--) {
            tmp = tmp.lastChild;
          }
          jQuery.merge(nodes, tmp.childNodes);
          tmp = fragment.firstChild;
          tmp.textContent = "";
        }
      }
    }
    fragment.textContent = "";
    i = 0;
    while ((elem = nodes[i++])) {
      if (selection && jQuery.inArray(elem, selection) > -1) {
        if (ignored) {
          ignored.push(elem);
        }
        continue;
      }
      contains = jQuery.contains(elem.ownerDocument, elem);
      tmp = getAll(fragment.appendChild(elem), "script");
      if (contains) {
        setGlobalEval(tmp);
      }
      if (scripts) {
        j = 0;
        while ((elem = tmp[j++])) {
          if (rscriptType.test(elem.type || "")) {
            scripts.push(elem);
          }
        }
      }
    }
    return fragment;
  }
  (function () {
    var fragment = document.createDocumentFragment(),
      div = fragment.appendChild(document.createElement("div")),
      input = document.createElement("input");
    input.setAttribute("type", "radio");
    input.setAttribute("checked", "checked");
    input.setAttribute("name", "t");
    div.appendChild(input);
    support.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked;
    div.innerHTML = "<textarea>x</textarea>";
    support.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue;
  })();
  var documentElement = document.documentElement;
  var rkeyEvent = /^key/,
    rmouseEvent = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
    rtypenamespace = /^([^.]*)(?:\.(.+)|)/;
  function returnTrue() {
    return true;
  }
  function returnFalse() {
    return false;
  }
  function safeActiveElement() {
    try {
      return document.activeElement;
    } catch (err) {}
  }
  function on(elem, types, selector, data, fn, one) {
    var origFn, type;
    if (typeof types === "object") {
      if (typeof selector !== "string") {
        data = data || selector;
        selector = undefined;
      }
      for (type in types) {
        on(elem, type, selector, data, types[type], one);
      }
      return elem;
    }
    if (data == null && fn == null) {
      fn = selector;
      data = selector = undefined;
    } else if (fn == null) {
      if (typeof selector === "string") {
        fn = data;
        data = undefined;
      } else {
        fn = data;
        data = selector;
        selector = undefined;
      }
    }
    if (fn === false) {
      fn = returnFalse;
    } else if (!fn) {
      return elem;
    }
    if (one === 1) {
      origFn = fn;
      fn = function (event) {
        jQuery().off(event);
        return origFn.apply(this, arguments);
      };
      fn.guid = origFn.guid || (origFn.guid = jQuery.guid++);
    }
    return elem.each(function () {
      jQuery.event.add(this, types, fn, data, selector);
    });
  }
  jQuery.event = {
    global: {},
    add: function (elem, types, handler, data, selector) {
      var handleObjIn,
        eventHandle,
        tmp,
        events,
        t,
        handleObj,
        special,
        handlers,
        type,
        namespaces,
        origType,
        elemData = dataPriv.get(elem);
      if (!elemData) {
        return;
      }
      if (handler.handler) {
        handleObjIn = handler;
        handler = handleObjIn.handler;
        selector = handleObjIn.selector;
      }
      if (selector) {
        jQuery.find.matchesSelector(documentElement, selector);
      }
      if (!handler.guid) {
        handler.guid = jQuery.guid++;
      }
      if (!(events = elemData.events)) {
        events = elemData.events = {};
      }
      if (!(eventHandle = elemData.handle)) {
        eventHandle = elemData.handle = function (e) {
          return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type
            ? jQuery.event.dispatch.apply(elem, arguments)
            : undefined;
        };
      }
      types = (types || "").match(rnothtmlwhite) || [""];
      t = types.length;
      while (t--) {
        tmp = rtypenamespace.exec(types[t]) || [];
        type = origType = tmp[1];
        namespaces = (tmp[2] || "").split(".").sort();
        if (!type) {
          continue;
        }
        special = jQuery.event.special[type] || {};
        type = (selector ? special.delegateType : special.bindType) || type;
        special = jQuery.event.special[type] || {};
        handleObj = jQuery.extend(
          {
            type: type,
            origType: origType,
            data: data,
            handler: handler,
            guid: handler.guid,
            selector: selector,
            needsContext: selector && jQuery.expr.match.needsContext.test(selector),
            namespace: namespaces.join("."),
          },
          handleObjIn
        );
        if (!(handlers = events[type])) {
          handlers = events[type] = [];
          handlers.delegateCount = 0;
          if (!special.setup || special.setup.call(elem, data, namespaces, eventHandle) === false) {
            if (elem.addEventListener) {
              elem.addEventListener(type, eventHandle);
            }
          }
        }
        if (special.add) {
          special.add.call(elem, handleObj);
          if (!handleObj.handler.guid) {
            handleObj.handler.guid = handler.guid;
          }
        }
        if (selector) {
          handlers.splice(handlers.delegateCount++, 0, handleObj);
        } else {
          handlers.push(handleObj);
        }
        jQuery.event.global[type] = true;
      }
    },
    remove: function (elem, types, handler, selector, mappedTypes) {
      var j,
        origCount,
        tmp,
        events,
        t,
        handleObj,
        special,
        handlers,
        type,
        namespaces,
        origType,
        elemData = dataPriv.hasData(elem) && dataPriv.get(elem);
      if (!elemData || !(events = elemData.events)) {
        return;
      }
      types = (types || "").match(rnothtmlwhite) || [""];
      t = types.length;
      while (t--) {
        tmp = rtypenamespace.exec(types[t]) || [];
        type = origType = tmp[1];
        namespaces = (tmp[2] || "").split(".").sort();
        if (!type) {
          for (type in events) {
            jQuery.event.remove(elem, type + types[t], handler, selector, true);
          }
          continue;
        }
        special = jQuery.event.special[type] || {};
        type = (selector ? special.delegateType : special.bindType) || type;
        handlers = events[type] || [];
        tmp = tmp[2] && new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)");
        origCount = j = handlers.length;
        while (j--) {
          handleObj = handlers[j];
          if (
            (mappedTypes || origType === handleObj.origType) &&
            (!handler || handler.guid === handleObj.guid) &&
            (!tmp || tmp.test(handleObj.namespace)) &&
            (!selector || selector === handleObj.selector || (selector === "**" && handleObj.selector))
          ) {
            handlers.splice(j, 1);
            if (handleObj.selector) {
              handlers.delegateCount--;
            }
            if (special.remove) {
              special.remove.call(elem, handleObj);
            }
          }
        }
        if (origCount && !handlers.length) {
          if (!special.teardown || special.teardown.call(elem, namespaces, elemData.handle) === false) {
            jQuery.removeEvent(elem, type, elemData.handle);
          }
          delete events[type];
        }
      }
      if (jQuery.isEmptyObject(events)) {
        dataPriv.remove(elem, "handle events");
      }
    },
    dispatch: function (nativeEvent) {
      var event = jQuery.event.fix(nativeEvent);
      var i,
        j,
        ret,
        matched,
        handleObj,
        handlerQueue,
        args = new Array(arguments.length),
        handlers = (dataPriv.get(this, "events") || {})[event.type] || [],
        special = jQuery.event.special[event.type] || {};
      args[0] = event;
      for (i = 1; i < arguments.length; i++) {
        args[i] = arguments[i];
      }
      event.delegateTarget = this;
      if (special.preDispatch && special.preDispatch.call(this, event) === false) {
        return;
      }
      handlerQueue = jQuery.event.handlers.call(this, event, handlers);
      i = 0;
      while ((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {
        event.currentTarget = matched.elem;
        j = 0;
        while ((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) {
          if (!event.rnamespace || event.rnamespace.test(handleObj.namespace)) {
            event.handleObj = handleObj;
            event.data = handleObj.data;
            ret = ((jQuery.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args);
            if (ret !== undefined) {
              if ((event.result = ret) === false) {
                event.preventDefault();
                event.stopPropagation();
              }
            }
          }
        }
      }
      if (special.postDispatch) {
        special.postDispatch.call(this, event);
      }
      return event.result;
    },
    handlers: function (event, handlers) {
      var i,
        handleObj,
        sel,
        matchedHandlers,
        matchedSelectors,
        handlerQueue = [],
        delegateCount = handlers.delegateCount,
        cur = event.target;
      if (delegateCount && cur.nodeType && !(event.type === "click" && event.button >= 1)) {
        for (; cur !== this; cur = cur.parentNode || this) {
          if (cur.nodeType === 1 && !(event.type === "click" && cur.disabled === true)) {
            matchedHandlers = [];
            matchedSelectors = {};
            for (i = 0; i < delegateCount; i++) {
              handleObj = handlers[i];
              sel = handleObj.selector + " ";
              if (matchedSelectors[sel] === undefined) {
                matchedSelectors[sel] = handleObj.needsContext
                  ? jQuery(sel, this).index(cur) > -1
                  : jQuery.find(sel, this, null, [cur]).length;
              }
              if (matchedSelectors[sel]) {
                matchedHandlers.push(handleObj);
              }
            }
            if (matchedHandlers.length) {
              handlerQueue.push({ elem: cur, handlers: matchedHandlers });
            }
          }
        }
      }
      cur = this;
      if (delegateCount < handlers.length) {
        handlerQueue.push({ elem: cur, handlers: handlers.slice(delegateCount) });
      }
      return handlerQueue;
    },
    addProp: function (name, hook) {
      Object.defineProperty(jQuery.Event.prototype, name, {
        enumerable: true,
        configurable: true,
        get: jQuery.isFunction(hook)
          ? function () {
              if (this.originalEvent) {
                return hook(this.originalEvent);
              }
            }
          : function () {
              if (this.originalEvent) {
                return this.originalEvent[name];
              }
            },
        set: function (value) {
          Object.defineProperty(this, name, { enumerable: true, configurable: true, writable: true, value: value });
        },
      });
    },
    fix: function (originalEvent) {
      return originalEvent[jQuery.expando] ? originalEvent : new jQuery.Event(originalEvent);
    },
    special: {
      load: { noBubble: true },
      focus: {
        trigger: function () {
          if (this !== safeActiveElement() && this.focus) {
            this.focus();
            return false;
          }
        },
        delegateType: "focusin",
      },
      blur: {
        trigger: function () {
          if (this === safeActiveElement() && this.blur) {
            this.blur();
            return false;
          }
        },
        delegateType: "focusout",
      },
      click: {
        trigger: function () {
          if (this.type === "checkbox" && this.click && nodeName(this, "input")) {
            this.click();
            return false;
          }
        },
        _default: function (event) {
          return nodeName(event.target, "a");
        },
      },
      beforeunload: {
        postDispatch: function (event) {
          if (event.result !== undefined && event.originalEvent) {
            event.originalEvent.returnValue = event.result;
          }
        },
      },
    },
  };
  jQuery.removeEvent = function (elem, type, handle) {
    if (elem.removeEventListener) {
      elem.removeEventListener(type, handle);
    }
  };
  jQuery.Event = function (src, props) {
    if (!(this instanceof jQuery.Event)) {
      return new jQuery.Event(src, props);
    }
    if (src && src.type) {
      this.originalEvent = src;
      this.type = src.type;
      this.isDefaultPrevented =
        src.defaultPrevented || (src.defaultPrevented === undefined && src.returnValue === false) ? returnTrue : returnFalse;
      this.target = src.target && src.target.nodeType === 3 ? src.target.parentNode : src.target;
      this.currentTarget = src.currentTarget;
      this.relatedTarget = src.relatedTarget;
    } else {
      this.type = src;
    }
    if (props) {
      jQuery.extend(this, props);
    }
    this.timeStamp = (src && src.timeStamp) || jQuery.now();
    this[jQuery.expando] = true;
  };
  jQuery.Event.prototype = {
    constructor: jQuery.Event,
    isDefaultPrevented: returnFalse,
    isPropagationStopped: returnFalse,
    isImmediatePropagationStopped: returnFalse,
    isSimulated: false,
    preventDefault: function () {
      var e = this.originalEvent;
      this.isDefaultPrevented = returnTrue;
      if (e && !this.isSimulated) {
        e.preventDefault();
      }
    },
    stopPropagation: function () {
      var e = this.originalEvent;
      this.isPropagationStopped = returnTrue;
      if (e && !this.isSimulated) {
        e.stopPropagation();
      }
    },
    stopImmediatePropagation: function () {
      var e = this.originalEvent;
      this.isImmediatePropagationStopped = returnTrue;
      if (e && !this.isSimulated) {
        e.stopImmediatePropagation();
      }
      this.stopPropagation();
    },
  };
  jQuery.each(
    {
      altKey: true,
      bubbles: true,
      cancelable: true,
      changedTouches: true,
      ctrlKey: true,
      detail: true,
      eventPhase: true,
      metaKey: true,
      pageX: true,
      pageY: true,
      shiftKey: true,
      view: true,
      char: true,
      charCode: true,
      key: true,
      keyCode: true,
      button: true,
      buttons: true,
      clientX: true,
      clientY: true,
      offsetX: true,
      offsetY: true,
      pointerId: true,
      pointerType: true,
      screenX: true,
      screenY: true,
      targetTouches: true,
      toElement: true,
      touches: true,
      which: function (event) {
        var button = event.button;
        if (event.which == null && rkeyEvent.test(event.type)) {
          return event.charCode != null ? event.charCode : event.keyCode;
        }
        if (!event.which && button !== undefined && rmouseEvent.test(event.type)) {
          if (button & 1) {
            return 1;
          }
          if (button & 2) {
            return 3;
          }
          if (button & 4) {
            return 2;
          }
          return 0;
        }
        return event.which;
      },
    },
    jQuery.event.addProp
  );
  jQuery.each(
    { mouseenter: "mouseover", mouseleave: "mouseout", pointerenter: "pointerover", pointerleave: "pointerout" },
    function (orig, fix) {
      jQuery.event.special[orig] = {
        delegateType: fix,
        bindType: fix,
        handle: function (event) {
          var ret,
            target = this,
            related = event.relatedTarget,
            handleObj = event.handleObj;
          if (!related || (related !== target && !jQuery.contains(target, related))) {
            event.type = handleObj.origType;
            ret = handleObj.handler.apply(this, arguments);
            event.type = fix;
          }
          return ret;
        },
      };
    }
  );
  jQuery.fn.extend({
    on: function (types, selector, data, fn) {
      return on(this, types, selector, data, fn);
    },
    one: function (types, selector, data, fn) {
      return on(this, types, selector, data, fn, 1);
    },
    off: function (types, selector, fn) {
      var handleObj, type;
      if (types && types.preventDefault && types.handleObj) {
        handleObj = types.handleObj;
        jQuery(types.delegateTarget).off(
          handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
          handleObj.selector,
          handleObj.handler
        );
        return this;
      }
      if (typeof types === "object") {
        for (type in types) {
          this.off(type, selector, types[type]);
        }
        return this;
      }
      if (selector === false || typeof selector === "function") {
        fn = selector;
        selector = undefined;
      }
      if (fn === false) {
        fn = returnFalse;
      }
      return this.each(function () {
        jQuery.event.remove(this, types, fn, selector);
      });
    },
  });
  var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,
    rnoInnerhtml = /<script|<style|<link/i,
    rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
    rscriptTypeMasked = /^true\/(.*)/,
    rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;
  function manipulationTarget(elem, content) {
    if (nodeName(elem, "table") && nodeName(content.nodeType !== 11 ? content : content.firstChild, "tr")) {
      return jQuery(">tbody", elem)[0] || elem;
    }
    return elem;
  }
  function disableScript(elem) {
    elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
    return elem;
  }
  function restoreScript(elem) {
    var match = rscriptTypeMasked.exec(elem.type);
    if (match) {
      elem.type = match[1];
    } else {
      elem.removeAttribute("type");
    }
    return elem;
  }
  function cloneCopyEvent(src, dest) {
    var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;
    if (dest.nodeType !== 1) {
      return;
    }
    if (dataPriv.hasData(src)) {
      pdataOld = dataPriv.access(src);
      pdataCur = dataPriv.set(dest, pdataOld);
      events = pdataOld.events;
      if (events) {
        delete pdataCur.handle;
        pdataCur.events = {};
        for (type in events) {
          for (i = 0, l = events[type].length; i < l; i++) {
            jQuery.event.add(dest, type, events[type][i]);
          }
        }
      }
    }
    if (dataUser.hasData(src)) {
      udataOld = dataUser.access(src);
      udataCur = jQuery.extend({}, udataOld);
      dataUser.set(dest, udataCur);
    }
  }
  function fixInput(src, dest) {
    var nodeName = dest.nodeName.toLowerCase();
    if (nodeName === "input" && rcheckableType.test(src.type)) {
      dest.checked = src.checked;
    } else if (nodeName === "input" || nodeName === "textarea") {
      dest.defaultValue = src.defaultValue;
    }
  }
  function domManip(collection, args, callback, ignored) {
    args = concat.apply([], args);
    var fragment,
      first,
      scripts,
      hasScripts,
      node,
      doc,
      i = 0,
      l = collection.length,
      iNoClone = l - 1,
      value = args[0],
      isFunction = jQuery.isFunction(value);
    if (isFunction || (l > 1 && typeof value === "string" && !support.checkClone && rchecked.test(value))) {
      return collection.each(function (index) {
        var self = collection.eq(index);
        if (isFunction) {
          args[0] = value.call(this, index, self.html());
        }
        domManip(self, args, callback, ignored);
      });
    }
    if (l) {
      fragment = buildFragment(args, collection[0].ownerDocument, false, collection, ignored);
      first = fragment.firstChild;
      if (fragment.childNodes.length === 1) {
        fragment = first;
      }
      if (first || ignored) {
        scripts = jQuery.map(getAll(fragment, "script"), disableScript);
        hasScripts = scripts.length;
        for (; i < l; i++) {
          node = fragment;
          if (i !== iNoClone) {
            node = jQuery.clone(node, true, true);
            if (hasScripts) {
              jQuery.merge(scripts, getAll(node, "script"));
            }
          }
          callback.call(collection[i], node, i);
        }
        if (hasScripts) {
          doc = scripts[scripts.length - 1].ownerDocument;
          jQuery.map(scripts, restoreScript);
          for (i = 0; i < hasScripts; i++) {
            node = scripts[i];
            if (rscriptType.test(node.type || "") && !dataPriv.access(node, "globalEval") && jQuery.contains(doc, node)) {
              if (node.src) {
                if (jQuery._evalUrl) {
                  jQuery._evalUrl(node.src);
                }
              } else {
                DOMEval(node.textContent.replace(rcleanScript, ""), doc);
              }
            }
          }
        }
      }
    }
    return collection;
  }
  function remove(elem, selector, keepData) {
    var node,
      nodes = selector ? jQuery.filter(selector, elem) : elem,
      i = 0;
    for (; (node = nodes[i]) != null; i++) {
      if (!keepData && node.nodeType === 1) {
        jQuery.cleanData(getAll(node));
      }
      if (node.parentNode) {
        if (keepData && jQuery.contains(node.ownerDocument, node)) {
          setGlobalEval(getAll(node, "script"));
        }
        node.parentNode.removeChild(node);
      }
    }
    return elem;
  }
  jQuery.extend({
    htmlPrefilter: function (html) {
      return html.replace(rxhtmlTag, "<$1></$2>");
    },
    clone: function (elem, dataAndEvents, deepDataAndEvents) {
      var i,
        l,
        srcElements,
        destElements,
        clone = elem.cloneNode(true),
        inPage = jQuery.contains(elem.ownerDocument, elem);
      if (!support.noCloneChecked && (elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem)) {
        destElements = getAll(clone);
        srcElements = getAll(elem);
        for (i = 0, l = srcElements.length; i < l; i++) {
          fixInput(srcElements[i], destElements[i]);
        }
      }
      if (dataAndEvents) {
        if (deepDataAndEvents) {
          srcElements = srcElements || getAll(elem);
          destElements = destElements || getAll(clone);
          for (i = 0, l = srcElements.length; i < l; i++) {
            cloneCopyEvent(srcElements[i], destElements[i]);
          }
        } else {
          cloneCopyEvent(elem, clone);
        }
      }
      destElements = getAll(clone, "script");
      if (destElements.length > 0) {
        setGlobalEval(destElements, !inPage && getAll(elem, "script"));
      }
      return clone;
    },
    cleanData: function (elems) {
      var data,
        elem,
        type,
        special = jQuery.event.special,
        i = 0;
      for (; (elem = elems[i]) !== undefined; i++) {
        if (acceptData(elem)) {
          if ((data = elem[dataPriv.expando])) {
            if (data.events) {
              for (type in data.events) {
                if (special[type]) {
                  jQuery.event.remove(elem, type);
                } else {
                  jQuery.removeEvent(elem, type, data.handle);
                }
              }
            }
            elem[dataPriv.expando] = undefined;
          }
          if (elem[dataUser.expando]) {
            elem[dataUser.expando] = undefined;
          }
        }
      }
    },
  });
  jQuery.fn.extend({
    detach: function (selector) {
      return remove(this, selector, true);
    },
    remove: function (selector) {
      return remove(this, selector);
    },
    text: function (value) {
      return access(
        this,
        function (value) {
          return value === undefined
            ? jQuery.text(this)
            : this.empty().each(function () {
                if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                  this.textContent = value;
                }
              });
        },
        null,
        value,
        arguments.length
      );
    },
    append: function () {
      return domManip(this, arguments, function (elem) {
        if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
          var target = manipulationTarget(this, elem);
          target.appendChild(elem);
        }
      });
    },
    prepend: function () {
      return domManip(this, arguments, function (elem) {
        if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
          var target = manipulationTarget(this, elem);
          target.insertBefore(elem, target.firstChild);
        }
      });
    },
    before: function () {
      return domManip(this, arguments, function (elem) {
        if (this.parentNode) {
          this.parentNode.insertBefore(elem, this);
        }
      });
    },
    after: function () {
      return domManip(this, arguments, function (elem) {
        if (this.parentNode) {
          this.parentNode.insertBefore(elem, this.nextSibling);
        }
      });
    },
    empty: function () {
      var elem,
        i = 0;
      for (; (elem = this[i]) != null; i++) {
        if (elem.nodeType === 1) {
          jQuery.cleanData(getAll(elem, false));
          elem.textContent = "";
        }
      }
      return this;
    },
    clone: function (dataAndEvents, deepDataAndEvents) {
      dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
      deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
      return this.map(function () {
        return jQuery.clone(this, dataAndEvents, deepDataAndEvents);
      });
    },
    html: function (value) {
      return access(
        this,
        function (value) {
          var elem = this[0] || {},
            i = 0,
            l = this.length;
          if (value === undefined && elem.nodeType === 1) {
            return elem.innerHTML;
          }
          if (typeof value === "string" && !rnoInnerhtml.test(value) && !wrapMap[(rtagName.exec(value) || ["", ""])[1].toLowerCase()]) {
            value = jQuery.htmlPrefilter(value);
            try {
              for (; i < l; i++) {
                elem = this[i] || {};
                if (elem.nodeType === 1) {
                  jQuery.cleanData(getAll(elem, false));
                  elem.innerHTML = value;
                }
              }
              elem = 0;
            } catch (e) {}
          }
          if (elem) {
            this.empty().append(value);
          }
        },
        null,
        value,
        arguments.length
      );
    },
    replaceWith: function () {
      var ignored = [];
      return domManip(
        this,
        arguments,
        function (elem) {
          var parent = this.parentNode;
          if (jQuery.inArray(this, ignored) < 0) {
            jQuery.cleanData(getAll(this));
            if (parent) {
              parent.replaceChild(elem, this);
            }
          }
        },
        ignored
      );
    },
  });
  jQuery.each(
    { appendTo: "append", prependTo: "prepend", insertBefore: "before", insertAfter: "after", replaceAll: "replaceWith" },
    function (name, original) {
      jQuery.fn[name] = function (selector) {
        var elems,
          ret = [],
          insert = jQuery(selector),
          last = insert.length - 1,
          i = 0;
        for (; i <= last; i++) {
          elems = i === last ? this : this.clone(true);
          jQuery(insert[i])[original](elems);
          push.apply(ret, elems.get());
        }
        return this.pushStack(ret);
      };
    }
  );
  var rmargin = /^margin/;
  var rnumnonpx = new RegExp("^(" + pnum + ")(?!px)[a-z%]+$", "i");
  var getStyles = function (elem) {
    var view = elem.ownerDocument.defaultView;
    if (!view || !view.opener) {
      view = window;
    }
    return view.getComputedStyle(elem);
  };
  (function () {
    function computeStyleTests() {
      if (!div) {
        return;
      }
      div.style.cssText =
        "box-sizing:border-box;" + "position:relative;display:block;" + "margin:auto;border:1px;padding:1px;" + "top:1%;width:50%";
      div.innerHTML = "";
      documentElement.appendChild(container);
      var divStyle = window.getComputedStyle(div);
      pixelPositionVal = divStyle.top !== "1%";
      reliableMarginLeftVal = divStyle.marginLeft === "2px";
      boxSizingReliableVal = divStyle.width === "4px";
      div.style.marginRight = "50%";
      pixelMarginRightVal = divStyle.marginRight === "4px";
      documentElement.removeChild(container);
      div = null;
    }
    var pixelPositionVal,
      boxSizingReliableVal,
      pixelMarginRightVal,
      reliableMarginLeftVal,
      container = document.createElement("div"),
      div = document.createElement("div");
    if (!div.style) {
      return;
    }
    div.style.backgroundClip = "content-box";
    div.cloneNode(true).style.backgroundClip = "";
    support.clearCloneStyle = div.style.backgroundClip === "content-box";
    container.style.cssText = "border:0;width:8px;height:0;top:0;left:-9999px;" + "padding:0;margin-top:1px;position:absolute";
    container.appendChild(div);
    jQuery.extend(support, {
      pixelPosition: function () {
        computeStyleTests();
        return pixelPositionVal;
      },
      boxSizingReliable: function () {
        computeStyleTests();
        return boxSizingReliableVal;
      },
      pixelMarginRight: function () {
        computeStyleTests();
        return pixelMarginRightVal;
      },
      reliableMarginLeft: function () {
        computeStyleTests();
        return reliableMarginLeftVal;
      },
    });
  })();
  function curCSS(elem, name, computed) {
    var width,
      minWidth,
      maxWidth,
      ret,
      style = elem.style;
    computed = computed || getStyles(elem);
    if (computed) {
      ret = computed.getPropertyValue(name) || computed[name];
      if (ret === "" && !jQuery.contains(elem.ownerDocument, elem)) {
        ret = jQuery.style(elem, name);
      }
      if (!support.pixelMarginRight() && rnumnonpx.test(ret) && rmargin.test(name)) {
        width = style.width;
        minWidth = style.minWidth;
        maxWidth = style.maxWidth;
        style.minWidth = style.maxWidth = style.width = ret;
        ret = computed.width;
        style.width = width;
        style.minWidth = minWidth;
        style.maxWidth = maxWidth;
      }
    }
    return ret !== undefined ? ret + "" : ret;
  }
  function addGetHookIf(conditionFn, hookFn) {
    return {
      get: function () {
        if (conditionFn()) {
          delete this.get;
          return;
        }
        return (this.get = hookFn).apply(this, arguments);
      },
    };
  }
  var rdisplayswap = /^(none|table(?!-c[ea]).+)/,
    rcustomProp = /^--/,
    cssShow = { position: "absolute", visibility: "hidden", display: "block" },
    cssNormalTransform = { letterSpacing: "0", fontWeight: "400" },
    cssPrefixes = ["Webkit", "Moz", "ms"],
    emptyStyle = document.createElement("div").style;
  function vendorPropName(name) {
    if (name in emptyStyle) {
      return name;
    }
    var capName = name[0].toUpperCase() + name.slice(1),
      i = cssPrefixes.length;
    while (i--) {
      name = cssPrefixes[i] + capName;
      if (name in emptyStyle) {
        return name;
      }
    }
  }
  function finalPropName(name) {
    var ret = jQuery.cssProps[name];
    if (!ret) {
      ret = jQuery.cssProps[name] = vendorPropName(name) || name;
    }
    return ret;
  }
  function setPositiveNumber(elem, value, subtract) {
    var matches = rcssNum.exec(value);
    return matches ? Math.max(0, matches[2] - (subtract || 0)) + (matches[3] || "px") : value;
  }
  function augmentWidthOrHeight(elem, name, extra, isBorderBox, styles) {
    var i,
      val = 0;
    if (extra === (isBorderBox ? "border" : "content")) {
      i = 4;
    } else {
      i = name === "width" ? 1 : 0;
    }
    for (; i < 4; i += 2) {
      if (extra === "margin") {
        val += jQuery.css(elem, extra + cssExpand[i], true, styles);
      }
      if (isBorderBox) {
        if (extra === "content") {
          val -= jQuery.css(elem, "padding" + cssExpand[i], true, styles);
        }
        if (extra !== "margin") {
          val -= jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
        }
      } else {
        val += jQuery.css(elem, "padding" + cssExpand[i], true, styles);
        if (extra !== "padding") {
          val += jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
        }
      }
    }
    return val;
  }
  function getWidthOrHeight(elem, name, extra) {
    var valueIsBorderBox,
      styles = getStyles(elem),
      val = curCSS(elem, name, styles),
      isBorderBox = jQuery.css(elem, "boxSizing", false, styles) === "border-box";
    if (rnumnonpx.test(val)) {
      return val;
    }
    valueIsBorderBox = isBorderBox && (support.boxSizingReliable() || val === elem.style[name]);
    if (val === "auto") {
      val = elem["offset" + name[0].toUpperCase() + name.slice(1)];
    }
    val = parseFloat(val) || 0;
    return val + augmentWidthOrHeight(elem, name, extra || (isBorderBox ? "border" : "content"), valueIsBorderBox, styles) + "px";
  }
  jQuery.extend({
    cssHooks: {
      opacity: {
        get: function (elem, computed) {
          if (computed) {
            var ret = curCSS(elem, "opacity");
            return ret === "" ? "1" : ret;
          }
        },
      },
    },
    cssNumber: {
      animationIterationCount: true,
      columnCount: true,
      fillOpacity: true,
      flexGrow: true,
      flexShrink: true,
      fontWeight: true,
      lineHeight: true,
      opacity: true,
      order: true,
      orphans: true,
      widows: true,
      zIndex: true,
      zoom: true,
    },
    cssProps: { float: "cssFloat" },
    style: function (elem, name, value, extra) {
      if (!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style) {
        return;
      }
      var ret,
        type,
        hooks,
        origName = jQuery.camelCase(name),
        isCustomProp = rcustomProp.test(name),
        style = elem.style;
      if (!isCustomProp) {
        name = finalPropName(origName);
      }
      hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];
      if (value !== undefined) {
        type = typeof value;
        if (type === "string" && (ret = rcssNum.exec(value)) && ret[1]) {
          value = adjustCSS(elem, name, ret);
          type = "number";
        }
        if (value == null || value !== value) {
          return;
        }
        if (type === "number") {
          value += (ret && ret[3]) || (jQuery.cssNumber[origName] ? "" : "px");
        }
        if (!support.clearCloneStyle && value === "" && name.indexOf("background") === 0) {
          style[name] = "inherit";
        }
        if (!hooks || !("set" in hooks) || (value = hooks.set(elem, value, extra)) !== undefined) {
          if (isCustomProp) {
            style.setProperty(name, value);
          } else {
            style[name] = value;
          }
        }
      } else {
        if (hooks && "get" in hooks && (ret = hooks.get(elem, false, extra)) !== undefined) {
          return ret;
        }
        return style[name];
      }
    },
    css: function (elem, name, extra, styles) {
      var val,
        num,
        hooks,
        origName = jQuery.camelCase(name),
        isCustomProp = rcustomProp.test(name);
      if (!isCustomProp) {
        name = finalPropName(origName);
      }
      hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];
      if (hooks && "get" in hooks) {
        val = hooks.get(elem, true, extra);
      }
      if (val === undefined) {
        val = curCSS(elem, name, styles);
      }
      if (val === "normal" && name in cssNormalTransform) {
        val = cssNormalTransform[name];
      }
      if (extra === "" || extra) {
        num = parseFloat(val);
        return extra === true || isFinite(num) ? num || 0 : val;
      }
      return val;
    },
  });
  jQuery.each(["height", "width"], function (i, name) {
    jQuery.cssHooks[name] = {
      get: function (elem, computed, extra) {
        if (computed) {
          return rdisplayswap.test(jQuery.css(elem, "display")) && (!elem.getClientRects().length || !elem.getBoundingClientRect().width)
            ? swap(elem, cssShow, function () {
                return getWidthOrHeight(elem, name, extra);
              })
            : getWidthOrHeight(elem, name, extra);
        }
      },
      set: function (elem, value, extra) {
        var matches,
          styles = extra && getStyles(elem),
          subtract =
            extra && augmentWidthOrHeight(elem, name, extra, jQuery.css(elem, "boxSizing", false, styles) === "border-box", styles);
        if (subtract && (matches = rcssNum.exec(value)) && (matches[3] || "px") !== "px") {
          elem.style[name] = value;
          value = jQuery.css(elem, name);
        }
        return setPositiveNumber(elem, value, subtract);
      },
    };
  });
  jQuery.cssHooks.marginLeft = addGetHookIf(support.reliableMarginLeft, function (elem, computed) {
    if (computed) {
      return (
        (parseFloat(curCSS(elem, "marginLeft")) ||
          elem.getBoundingClientRect().left -
            swap(elem, { marginLeft: 0 }, function () {
              return elem.getBoundingClientRect().left;
            })) + "px"
      );
    }
  });
  jQuery.each({ margin: "", padding: "", border: "Width" }, function (prefix, suffix) {
    jQuery.cssHooks[prefix + suffix] = {
      expand: function (value) {
        var i = 0,
          expanded = {},
          parts = typeof value === "string" ? value.split(" ") : [value];
        for (; i < 4; i++) {
          expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];
        }
        return expanded;
      },
    };
    if (!rmargin.test(prefix)) {
      jQuery.cssHooks[prefix + suffix].set = setPositiveNumber;
    }
  });
  jQuery.fn.extend({
    css: function (name, value) {
      return access(
        this,
        function (elem, name, value) {
          var styles,
            len,
            map = {},
            i = 0;
          if (Array.isArray(name)) {
            styles = getStyles(elem);
            len = name.length;
            for (; i < len; i++) {
              map[name[i]] = jQuery.css(elem, name[i], false, styles);
            }
            return map;
          }
          return value !== undefined ? jQuery.style(elem, name, value) : jQuery.css(elem, name);
        },
        name,
        value,
        arguments.length > 1
      );
    },
  });
  function Tween(elem, options, prop, end, easing) {
    return new Tween.prototype.init(elem, options, prop, end, easing);
  }
  jQuery.Tween = Tween;
  Tween.prototype = {
    constructor: Tween,
    init: function (elem, options, prop, end, easing, unit) {
      this.elem = elem;
      this.prop = prop;
      this.easing = easing || jQuery.easing._default;
      this.options = options;
      this.start = this.now = this.cur();
      this.end = end;
      this.unit = unit || (jQuery.cssNumber[prop] ? "" : "px");
    },
    cur: function () {
      var hooks = Tween.propHooks[this.prop];
      return hooks && hooks.get ? hooks.get(this) : Tween.propHooks._default.get(this);
    },
    run: function (percent) {
      var eased,
        hooks = Tween.propHooks[this.prop];
      if (this.options.duration) {
        this.pos = eased = jQuery.easing[this.easing](percent, this.options.duration * percent, 0, 1, this.options.duration);
      } else {
        this.pos = eased = percent;
      }
      this.now = (this.end - this.start) * eased + this.start;
      if (this.options.step) {
        this.options.step.call(this.elem, this.now, this);
      }
      if (hooks && hooks.set) {
        hooks.set(this);
      } else {
        Tween.propHooks._default.set(this);
      }
      return this;
    },
  };
  Tween.prototype.init.prototype = Tween.prototype;
  Tween.propHooks = {
    _default: {
      get: function (tween) {
        var result;
        if (tween.elem.nodeType !== 1 || (tween.elem[tween.prop] != null && tween.elem.style[tween.prop] == null)) {
          return tween.elem[tween.prop];
        }
        result = jQuery.css(tween.elem, tween.prop, "");
        return !result || result === "auto" ? 0 : result;
      },
      set: function (tween) {
        if (jQuery.fx.step[tween.prop]) {
          jQuery.fx.step[tween.prop](tween);
        } else if (tween.elem.nodeType === 1 && (tween.elem.style[jQuery.cssProps[tween.prop]] != null || jQuery.cssHooks[tween.prop])) {
          jQuery.style(tween.elem, tween.prop, tween.now + tween.unit);
        } else {
          tween.elem[tween.prop] = tween.now;
        }
      },
    },
  };
  Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
    set: function (tween) {
      if (tween.elem.nodeType && tween.elem.parentNode) {
        tween.elem[tween.prop] = tween.now;
      }
    },
  };
  jQuery.easing = {
    linear: function (p) {
      return p;
    },
    swing: function (p) {
      return 0.5 - Math.cos(p * Math.PI) / 2;
    },
    _default: "swing",
  };
  jQuery.fx = Tween.prototype.init;
  jQuery.fx.step = {};
  var fxNow,
    inProgress,
    rfxtypes = /^(?:toggle|show|hide)$/,
    rrun = /queueHooks$/;
  function schedule() {
    if (inProgress) {
      if (document.hidden === false && window.requestAnimationFrame) {
        window.requestAnimationFrame(schedule);
      } else {
        window.setTimeout(schedule, jQuery.fx.interval);
      }
      jQuery.fx.tick();
    }
  }
  function createFxNow() {
    window.setTimeout(function () {
      fxNow = undefined;
    });
    return (fxNow = jQuery.now());
  }
  function genFx(type, includeWidth) {
    var which,
      i = 0,
      attrs = { height: type };
    includeWidth = includeWidth ? 1 : 0;
    for (; i < 4; i += 2 - includeWidth) {
      which = cssExpand[i];
      attrs["margin" + which] = attrs["padding" + which] = type;
    }
    if (includeWidth) {
      attrs.opacity = attrs.width = type;
    }
    return attrs;
  }
  function createTween(value, prop, animation) {
    var tween,
      collection = (Animation.tweeners[prop] || []).concat(Animation.tweeners["*"]),
      index = 0,
      length = collection.length;
    for (; index < length; index++) {
      if ((tween = collection[index].call(animation, prop, value))) {
        return tween;
      }
    }
  }
  function defaultPrefilter(elem, props, opts) {
    var prop,
      value,
      toggle,
      hooks,
      oldfire,
      propTween,
      restoreDisplay,
      display,
      isBox = "width" in props || "height" in props,
      anim = this,
      orig = {},
      style = elem.style,
      hidden = elem.nodeType && isHiddenWithinTree(elem),
      dataShow = dataPriv.get(elem, "fxshow");
    if (!opts.queue) {
      hooks = jQuery._queueHooks(elem, "fx");
      if (hooks.unqueued == null) {
        hooks.unqueued = 0;
        oldfire = hooks.empty.fire;
        hooks.empty.fire = function () {
          if (!hooks.unqueued) {
            oldfire();
          }
        };
      }
      hooks.unqueued++;
      anim.always(function () {
        anim.always(function () {
          hooks.unqueued--;
          if (!jQuery.queue(elem, "fx").length) {
            hooks.empty.fire();
          }
        });
      });
    }
    for (prop in props) {
      value = props[prop];
      if (rfxtypes.test(value)) {
        delete props[prop];
        toggle = toggle || value === "toggle";
        if (value === (hidden ? "hide" : "show")) {
          if (value === "show" && dataShow && dataShow[prop] !== undefined) {
            hidden = true;
          } else {
            continue;
          }
        }
        orig[prop] = (dataShow && dataShow[prop]) || jQuery.style(elem, prop);
      }
    }
    propTween = !jQuery.isEmptyObject(props);
    if (!propTween && jQuery.isEmptyObject(orig)) {
      return;
    }
    if (isBox && elem.nodeType === 1) {
      opts.overflow = [style.overflow, style.overflowX, style.overflowY];
      restoreDisplay = dataShow && dataShow.display;
      if (restoreDisplay == null) {
        restoreDisplay = dataPriv.get(elem, "display");
      }
      display = jQuery.css(elem, "display");
      if (display === "none") {
        if (restoreDisplay) {
          display = restoreDisplay;
        } else {
          showHide([elem], true);
          restoreDisplay = elem.style.display || restoreDisplay;
          display = jQuery.css(elem, "display");
          showHide([elem]);
        }
      }
      if (display === "inline" || (display === "inline-block" && restoreDisplay != null)) {
        if (jQuery.css(elem, "float") === "none") {
          if (!propTween) {
            anim.done(function () {
              style.display = restoreDisplay;
            });
            if (restoreDisplay == null) {
              display = style.display;
              restoreDisplay = display === "none" ? "" : display;
            }
          }
          style.display = "inline-block";
        }
      }
    }
    if (opts.overflow) {
      style.overflow = "hidden";
      anim.always(function () {
        style.overflow = opts.overflow[0];
        style.overflowX = opts.overflow[1];
        style.overflowY = opts.overflow[2];
      });
    }
    propTween = false;
    for (prop in orig) {
      if (!propTween) {
        if (dataShow) {
          if ("hidden" in dataShow) {
            hidden = dataShow.hidden;
          }
        } else {
          dataShow = dataPriv.access(elem, "fxshow", { display: restoreDisplay });
        }
        if (toggle) {
          dataShow.hidden = !hidden;
        }
        if (hidden) {
          showHide([elem], true);
        }
        anim.done(function () {
          if (!hidden) {
            showHide([elem]);
          }
          dataPriv.remove(elem, "fxshow");
          for (prop in orig) {
            jQuery.style(elem, prop, orig[prop]);
          }
        });
      }
      propTween = createTween(hidden ? dataShow[prop] : 0, prop, anim);
      if (!(prop in dataShow)) {
        dataShow[prop] = propTween.start;
        if (hidden) {
          propTween.end = propTween.start;
          propTween.start = 0;
        }
      }
    }
  }
  function propFilter(props, specialEasing) {
    var index, name, easing, value, hooks;
    for (index in props) {
      name = jQuery.camelCase(index);
      easing = specialEasing[name];
      value = props[index];
      if (Array.isArray(value)) {
        easing = value[1];
        value = props[index] = value[0];
      }
      if (index !== name) {
        props[name] = value;
        delete props[index];
      }
      hooks = jQuery.cssHooks[name];
      if (hooks && "expand" in hooks) {
        value = hooks.expand(value);
        delete props[name];
        for (index in value) {
          if (!(index in props)) {
            props[index] = value[index];
            specialEasing[index] = easing;
          }
        }
      } else {
        specialEasing[name] = easing;
      }
    }
  }
  function Animation(elem, properties, options) {
    var result,
      stopped,
      index = 0,
      length = Animation.prefilters.length,
      deferred = jQuery.Deferred().always(function () {
        delete tick.elem;
      }),
      tick = function () {
        if (stopped) {
          return false;
        }
        var currentTime = fxNow || createFxNow(),
          remaining = Math.max(0, animation.startTime + animation.duration - currentTime),
          temp = remaining / animation.duration || 0,
          percent = 1 - temp,
          index = 0,
          length = animation.tweens.length;
        for (; index < length; index++) {
          animation.tweens[index].run(percent);
        }
        deferred.notifyWith(elem, [animation, percent, remaining]);
        if (percent < 1 && length) {
          return remaining;
        }
        if (!length) {
          deferred.notifyWith(elem, [animation, 1, 0]);
        }
        deferred.resolveWith(elem, [animation]);
        return false;
      },
      animation = deferred.promise({
        elem: elem,
        props: jQuery.extend({}, properties),
        opts: jQuery.extend(true, { specialEasing: {}, easing: jQuery.easing._default }, options),
        originalProperties: properties,
        originalOptions: options,
        startTime: fxNow || createFxNow(),
        duration: options.duration,
        tweens: [],
        createTween: function (prop, end) {
          var tween = jQuery.Tween(elem, animation.opts, prop, end, animation.opts.specialEasing[prop] || animation.opts.easing);
          animation.tweens.push(tween);
          return tween;
        },
        stop: function (gotoEnd) {
          var index = 0,
            length = gotoEnd ? animation.tweens.length : 0;
          if (stopped) {
            return this;
          }
          stopped = true;
          for (; index < length; index++) {
            animation.tweens[index].run(1);
          }
          if (gotoEnd) {
            deferred.notifyWith(elem, [animation, 1, 0]);
            deferred.resolveWith(elem, [animation, gotoEnd]);
          } else {
            deferred.rejectWith(elem, [animation, gotoEnd]);
          }
          return this;
        },
      }),
      props = animation.props;
    propFilter(props, animation.opts.specialEasing);
    for (; index < length; index++) {
      result = Animation.prefilters[index].call(animation, elem, props, animation.opts);
      if (result) {
        if (jQuery.isFunction(result.stop)) {
          jQuery._queueHooks(animation.elem, animation.opts.queue).stop = jQuery.proxy(result.stop, result);
        }
        return result;
      }
    }
    jQuery.map(props, createTween, animation);
    if (jQuery.isFunction(animation.opts.start)) {
      animation.opts.start.call(elem, animation);
    }
    animation
      .progress(animation.opts.progress)
      .done(animation.opts.done, animation.opts.complete)
      .fail(animation.opts.fail)
      .always(animation.opts.always);
    jQuery.fx.timer(jQuery.extend(tick, { elem: elem, anim: animation, queue: animation.opts.queue }));
    return animation;
  }
  jQuery.Animation = jQuery.extend(Animation, {
    tweeners: {
      "*": [
        function (prop, value) {
          var tween = this.createTween(prop, value);
          adjustCSS(tween.elem, prop, rcssNum.exec(value), tween);
          return tween;
        },
      ],
    },
    tweener: function (props, callback) {
      if (jQuery.isFunction(props)) {
        callback = props;
        props = ["*"];
      } else {
        props = props.match(rnothtmlwhite);
      }
      var prop,
        index = 0,
        length = props.length;
      for (; index < length; index++) {
        prop = props[index];
        Animation.tweeners[prop] = Animation.tweeners[prop] || [];
        Animation.tweeners[prop].unshift(callback);
      }
    },
    prefilters: [defaultPrefilter],
    prefilter: function (callback, prepend) {
      if (prepend) {
        Animation.prefilters.unshift(callback);
      } else {
        Animation.prefilters.push(callback);
      }
    },
  });
  jQuery.speed = function (speed, easing, fn) {
    var opt =
      speed && typeof speed === "object"
        ? jQuery.extend({}, speed)
        : {
            complete: fn || (!fn && easing) || (jQuery.isFunction(speed) && speed),
            duration: speed,
            easing: (fn && easing) || (easing && !jQuery.isFunction(easing) && easing),
          };
    if (jQuery.fx.off) {
      opt.duration = 0;
    } else {
      if (typeof opt.duration !== "number") {
        if (opt.duration in jQuery.fx.speeds) {
          opt.duration = jQuery.fx.speeds[opt.duration];
        } else {
          opt.duration = jQuery.fx.speeds._default;
        }
      }
    }
    if (opt.queue == null || opt.queue === true) {
      opt.queue = "fx";
    }
    opt.old = opt.complete;
    opt.complete = function () {
      if (jQuery.isFunction(opt.old)) {
        opt.old.call(this);
      }
      if (opt.queue) {
        jQuery.dequeue(this, opt.queue);
      }
    };
    return opt;
  };
  jQuery.fn.extend({
    fadeTo: function (speed, to, easing, callback) {
      return this.filter(isHiddenWithinTree).css("opacity", 0).show().end().animate({ opacity: to }, speed, easing, callback);
    },
    animate: function (prop, speed, easing, callback) {
      var empty = jQuery.isEmptyObject(prop),
        optall = jQuery.speed(speed, easing, callback),
        doAnimation = function () {
          var anim = Animation(this, jQuery.extend({}, prop), optall);
          if (empty || dataPriv.get(this, "finish")) {
            anim.stop(true);
          }
        };
      doAnimation.finish = doAnimation;
      return empty || optall.queue === false ? this.each(doAnimation) : this.queue(optall.queue, doAnimation);
    },
    stop: function (type, clearQueue, gotoEnd) {
      var stopQueue = function (hooks) {
        var stop = hooks.stop;
        delete hooks.stop;
        stop(gotoEnd);
      };
      if (typeof type !== "string") {
        gotoEnd = clearQueue;
        clearQueue = type;
        type = undefined;
      }
      if (clearQueue && type !== false) {
        this.queue(type || "fx", []);
      }
      return this.each(function () {
        var dequeue = true,
          index = type != null && type + "queueHooks",
          timers = jQuery.timers,
          data = dataPriv.get(this);
        if (index) {
          if (data[index] && data[index].stop) {
            stopQueue(data[index]);
          }
        } else {
          for (index in data) {
            if (data[index] && data[index].stop && rrun.test(index)) {
              stopQueue(data[index]);
            }
          }
        }
        for (index = timers.length; index--; ) {
          if (timers[index].elem === this && (type == null || timers[index].queue === type)) {
            timers[index].anim.stop(gotoEnd);
            dequeue = false;
            timers.splice(index, 1);
          }
        }
        if (dequeue || !gotoEnd) {
          jQuery.dequeue(this, type);
        }
      });
    },
    finish: function (type) {
      if (type !== false) {
        type = type || "fx";
      }
      return this.each(function () {
        var index,
          data = dataPriv.get(this),
          queue = data[type + "queue"],
          hooks = data[type + "queueHooks"],
          timers = jQuery.timers,
          length = queue ? queue.length : 0;
        data.finish = true;
        jQuery.queue(this, type, []);
        if (hooks && hooks.stop) {
          hooks.stop.call(this, true);
        }
        for (index = timers.length; index--; ) {
          if (timers[index].elem === this && timers[index].queue === type) {
            timers[index].anim.stop(true);
            timers.splice(index, 1);
          }
        }
        for (index = 0; index < length; index++) {
          if (queue[index] && queue[index].finish) {
            queue[index].finish.call(this);
          }
        }
        delete data.finish;
      });
    },
  });
  jQuery.each(["toggle", "show", "hide"], function (i, name) {
    var cssFn = jQuery.fn[name];
    jQuery.fn[name] = function (speed, easing, callback) {
      return speed == null || typeof speed === "boolean"
        ? cssFn.apply(this, arguments)
        : this.animate(genFx(name, true), speed, easing, callback);
    };
  });
  jQuery.each(
    {
      slideDown: genFx("show"),
      slideUp: genFx("hide"),
      slideToggle: genFx("toggle"),
      fadeIn: { opacity: "show" },
      fadeOut: { opacity: "hide" },
      fadeToggle: { opacity: "toggle" },
    },
    function (name, props) {
      jQuery.fn[name] = function (speed, easing, callback) {
        return this.animate(props, speed, easing, callback);
      };
    }
  );
  jQuery.timers = [];
  jQuery.fx.tick = function () {
    var timer,
      i = 0,
      timers = jQuery.timers;
    fxNow = jQuery.now();
    for (; i < timers.length; i++) {
      timer = timers[i];
      if (!timer() && timers[i] === timer) {
        timers.splice(i--, 1);
      }
    }
    if (!timers.length) {
      jQuery.fx.stop();
    }
    fxNow = undefined;
  };
  jQuery.fx.timer = function (timer) {
    jQuery.timers.push(timer);
    jQuery.fx.start();
  };
  jQuery.fx.interval = 13;
  jQuery.fx.start = function () {
    if (inProgress) {
      return;
    }
    inProgress = true;
    schedule();
  };
  jQuery.fx.stop = function () {
    inProgress = null;
  };
  jQuery.fx.speeds = { slow: 600, fast: 200, _default: 400 };
  jQuery.fn.delay = function (time, type) {
    time = jQuery.fx ? jQuery.fx.speeds[time] || time : time;
    type = type || "fx";
    return this.queue(type, function (next, hooks) {
      var timeout = window.setTimeout(next, time);
      hooks.stop = function () {
        window.clearTimeout(timeout);
      };
    });
  };
  (function () {
    var input = document.createElement("input"),
      select = document.createElement("select"),
      opt = select.appendChild(document.createElement("option"));
    input.type = "checkbox";
    support.checkOn = input.value !== "";
    support.optSelected = opt.selected;
    input = document.createElement("input");
    input.value = "t";
    input.type = "radio";
    support.radioValue = input.value === "t";
  })();
  var boolHook,
    attrHandle = jQuery.expr.attrHandle;
  jQuery.fn.extend({
    attr: function (name, value) {
      return access(this, jQuery.attr, name, value, arguments.length > 1);
    },
    removeAttr: function (name) {
      return this.each(function () {
        jQuery.removeAttr(this, name);
      });
    },
  });
  jQuery.extend({
    attr: function (elem, name, value) {
      var ret,
        hooks,
        nType = elem.nodeType;
      if (nType === 3 || nType === 8 || nType === 2) {
        return;
      }
      if (typeof elem.getAttribute === "undefined") {
        return jQuery.prop(elem, name, value);
      }
      if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
        hooks = jQuery.attrHooks[name.toLowerCase()] || (jQuery.expr.match.bool.test(name) ? boolHook : undefined);
      }
      if (value !== undefined) {
        if (value === null) {
          jQuery.removeAttr(elem, name);
          return;
        }
        if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined) {
          return ret;
        }
        elem.setAttribute(name, value + "");
        return value;
      }
      if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
        return ret;
      }
      ret = jQuery.find.attr(elem, name);
      return ret == null ? undefined : ret;
    },
    attrHooks: {
      type: {
        set: function (elem, value) {
          if (!support.radioValue && value === "radio" && nodeName(elem, "input")) {
            var val = elem.value;
            elem.setAttribute("type", value);
            if (val) {
              elem.value = val;
            }
            return value;
          }
        },
      },
    },
    removeAttr: function (elem, value) {
      var name,
        i = 0,
        attrNames = value && value.match(rnothtmlwhite);
      if (attrNames && elem.nodeType === 1) {
        while ((name = attrNames[i++])) {
          elem.removeAttribute(name);
        }
      }
    },
  });
  boolHook = {
    set: function (elem, value, name) {
      if (value === false) {
        jQuery.removeAttr(elem, name);
      } else {
        elem.setAttribute(name, name);
      }
      return name;
    },
  };
  jQuery.each(jQuery.expr.match.bool.source.match(/\w+/g), function (i, name) {
    var getter = attrHandle[name] || jQuery.find.attr;
    attrHandle[name] = function (elem, name, isXML) {
      var ret,
        handle,
        lowercaseName = name.toLowerCase();
      if (!isXML) {
        handle = attrHandle[lowercaseName];
        attrHandle[lowercaseName] = ret;
        ret = getter(elem, name, isXML) != null ? lowercaseName : null;
        attrHandle[lowercaseName] = handle;
      }
      return ret;
    };
  });
  var rfocusable = /^(?:input|select|textarea|button)$/i,
    rclickable = /^(?:a|area)$/i;
  jQuery.fn.extend({
    prop: function (name, value) {
      return access(this, jQuery.prop, name, value, arguments.length > 1);
    },
    removeProp: function (name) {
      return this.each(function () {
        delete this[jQuery.propFix[name] || name];
      });
    },
  });
  jQuery.extend({
    prop: function (elem, name, value) {
      var ret,
        hooks,
        nType = elem.nodeType;
      if (nType === 3 || nType === 8 || nType === 2) {
        return;
      }
      if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
        name = jQuery.propFix[name] || name;
        hooks = jQuery.propHooks[name];
      }
      if (value !== undefined) {
        if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined) {
          return ret;
        }
        return (elem[name] = value);
      }
      if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
        return ret;
      }
      return elem[name];
    },
    propHooks: {
      tabIndex: {
        get: function (elem) {
          var tabindex = jQuery.find.attr(elem, "tabindex");
          if (tabindex) {
            return parseInt(tabindex, 10);
          }
          if (rfocusable.test(elem.nodeName) || (rclickable.test(elem.nodeName) && elem.href)) {
            return 0;
          }
          return -1;
        },
      },
    },
    propFix: { for: "htmlFor", class: "className" },
  });
  if (!support.optSelected) {
    jQuery.propHooks.selected = {
      get: function (elem) {
        var parent = elem.parentNode;
        if (parent && parent.parentNode) {
          parent.parentNode.selectedIndex;
        }
        return null;
      },
      set: function (elem) {
        var parent = elem.parentNode;
        if (parent) {
          parent.selectedIndex;
          if (parent.parentNode) {
            parent.parentNode.selectedIndex;
          }
        }
      },
    };
  }
  jQuery.each(
    ["tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable"],
    function () {
      jQuery.propFix[this.toLowerCase()] = this;
    }
  );
  function stripAndCollapse(value) {
    var tokens = value.match(rnothtmlwhite) || [];
    return tokens.join(" ");
  }
  function getClass(elem) {
    return (elem.getAttribute && elem.getAttribute("class")) || "";
  }
  jQuery.fn.extend({
    addClass: function (value) {
      var classes,
        elem,
        cur,
        curValue,
        clazz,
        j,
        finalValue,
        i = 0;
      if (jQuery.isFunction(value)) {
        return this.each(function (j) {
          jQuery(this).addClass(value.call(this, j, getClass(this)));
        });
      }
      if (typeof value === "string" && value) {
        classes = value.match(rnothtmlwhite) || [];
        while ((elem = this[i++])) {
          curValue = getClass(elem);
          cur = elem.nodeType === 1 && " " + stripAndCollapse(curValue) + " ";
          if (cur) {
            j = 0;
            while ((clazz = classes[j++])) {
              if (cur.indexOf(" " + clazz + " ") < 0) {
                cur += clazz + " ";
              }
            }
            finalValue = stripAndCollapse(cur);
            if (curValue !== finalValue) {
              elem.setAttribute("class", finalValue);
            }
          }
        }
      }
      return this;
    },
    removeClass: function (value) {
      var classes,
        elem,
        cur,
        curValue,
        clazz,
        j,
        finalValue,
        i = 0;
      if (jQuery.isFunction(value)) {
        return this.each(function (j) {
          jQuery(this).removeClass(value.call(this, j, getClass(this)));
        });
      }
      if (!arguments.length) {
        return this.attr("class", "");
      }
      if (typeof value === "string" && value) {
        classes = value.match(rnothtmlwhite) || [];
        while ((elem = this[i++])) {
          curValue = getClass(elem);
          cur = elem.nodeType === 1 && " " + stripAndCollapse(curValue) + " ";
          if (cur) {
            j = 0;
            while ((clazz = classes[j++])) {
              while (cur.indexOf(" " + clazz + " ") > -1) {
                cur = cur.replace(" " + clazz + " ", " ");
              }
            }
            finalValue = stripAndCollapse(cur);
            if (curValue !== finalValue) {
              elem.setAttribute("class", finalValue);
            }
          }
        }
      }
      return this;
    },
    toggleClass: function (value, stateVal) {
      var type = typeof value;
      if (typeof stateVal === "boolean" && type === "string") {
        return stateVal ? this.addClass(value) : this.removeClass(value);
      }
      if (jQuery.isFunction(value)) {
        return this.each(function (i) {
          jQuery(this).toggleClass(value.call(this, i, getClass(this), stateVal), stateVal);
        });
      }
      return this.each(function () {
        var className, i, self, classNames;
        if (type === "string") {
          i = 0;
          self = jQuery(this);
          classNames = value.match(rnothtmlwhite) || [];
          while ((className = classNames[i++])) {
            if (self.hasClass(className)) {
              self.removeClass(className);
            } else {
              self.addClass(className);
            }
          }
        } else if (value === undefined || type === "boolean") {
          className = getClass(this);
          if (className) {
            dataPriv.set(this, "__className__", className);
          }
          if (this.setAttribute) {
            this.setAttribute("class", className || value === false ? "" : dataPriv.get(this, "__className__") || "");
          }
        }
      });
    },
    hasClass: function (selector) {
      var className,
        elem,
        i = 0;
      className = " " + selector + " ";
      while ((elem = this[i++])) {
        if (elem.nodeType === 1 && (" " + stripAndCollapse(getClass(elem)) + " ").indexOf(className) > -1) {
          return true;
        }
      }
      return false;
    },
  });
  var rreturn = /\r/g;
  jQuery.fn.extend({
    val: function (value) {
      var hooks,
        ret,
        isFunction,
        elem = this[0];
      if (!arguments.length) {
        if (elem) {
          hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()];
          if (hooks && "get" in hooks && (ret = hooks.get(elem, "value")) !== undefined) {
            return ret;
          }
          ret = elem.value;
          if (typeof ret === "string") {
            return ret.replace(rreturn, "");
          }
          return ret == null ? "" : ret;
        }
        return;
      }
      isFunction = jQuery.isFunction(value);
      return this.each(function (i) {
        var val;
        if (this.nodeType !== 1) {
          return;
        }
        if (isFunction) {
          val = value.call(this, i, jQuery(this).val());
        } else {
          val = value;
        }
        if (val == null) {
          val = "";
        } else if (typeof val === "number") {
          val += "";
        } else if (Array.isArray(val)) {
          val = jQuery.map(val, function (value) {
            return value == null ? "" : value + "";
          });
        }
        hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()];
        if (!hooks || !("set" in hooks) || hooks.set(this, val, "value") === undefined) {
          this.value = val;
        }
      });
    },
  });
  jQuery.extend({
    valHooks: {
      option: {
        get: function (elem) {
          var val = jQuery.find.attr(elem, "value");
          return val != null ? val : stripAndCollapse(jQuery.text(elem));
        },
      },
      select: {
        get: function (elem) {
          var value,
            option,
            i,
            options = elem.options,
            index = elem.selectedIndex,
            one = elem.type === "select-one",
            values = one ? null : [],
            max = one ? index + 1 : options.length;
          if (index < 0) {
            i = max;
          } else {
            i = one ? index : 0;
          }
          for (; i < max; i++) {
            option = options[i];
            if (
              (option.selected || i === index) &&
              !option.disabled &&
              (!option.parentNode.disabled || !nodeName(option.parentNode, "optgroup"))
            ) {
              value = jQuery(option).val();
              if (one) {
                return value;
              }
              values.push(value);
            }
          }
          return values;
        },
        set: function (elem, value) {
          var optionSet,
            option,
            options = elem.options,
            values = jQuery.makeArray(value),
            i = options.length;
          while (i--) {
            option = options[i];
            if ((option.selected = jQuery.inArray(jQuery.valHooks.option.get(option), values) > -1)) {
              optionSet = true;
            }
          }
          if (!optionSet) {
            elem.selectedIndex = -1;
          }
          return values;
        },
      },
    },
  });
  jQuery.each(["radio", "checkbox"], function () {
    jQuery.valHooks[this] = {
      set: function (elem, value) {
        if (Array.isArray(value)) {
          return (elem.checked = jQuery.inArray(jQuery(elem).val(), value) > -1);
        }
      },
    };
    if (!support.checkOn) {
      jQuery.valHooks[this].get = function (elem) {
        return elem.getAttribute("value") === null ? "on" : elem.value;
      };
    }
  });
  var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/;
  jQuery.extend(jQuery.event, {
    trigger: function (event, data, elem, onlyHandlers) {
      var i,
        cur,
        tmp,
        bubbleType,
        ontype,
        handle,
        special,
        eventPath = [elem || document],
        type = hasOwn.call(event, "type") ? event.type : event,
        namespaces = hasOwn.call(event, "namespace") ? event.namespace.split(".") : [];
      cur = tmp = elem = elem || document;
      if (elem.nodeType === 3 || elem.nodeType === 8) {
        return;
      }
      if (rfocusMorph.test(type + jQuery.event.triggered)) {
        return;
      }
      if (type.indexOf(".") > -1) {
        namespaces = type.split(".");
        type = namespaces.shift();
        namespaces.sort();
      }
      ontype = type.indexOf(":") < 0 && "on" + type;
      event = event[jQuery.expando] ? event : new jQuery.Event(type, typeof event === "object" && event);
      event.isTrigger = onlyHandlers ? 2 : 3;
      event.namespace = namespaces.join(".");
      event.rnamespace = event.namespace ? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
      event.result = undefined;
      if (!event.target) {
        event.target = elem;
      }
      data = data == null ? [event] : jQuery.makeArray(data, [event]);
      special = jQuery.event.special[type] || {};
      if (!onlyHandlers && special.trigger && special.trigger.apply(elem, data) === false) {
        return;
      }
      if (!onlyHandlers && !special.noBubble && !jQuery.isWindow(elem)) {
        bubbleType = special.delegateType || type;
        if (!rfocusMorph.test(bubbleType + type)) {
          cur = cur.parentNode;
        }
        for (; cur; cur = cur.parentNode) {
          eventPath.push(cur);
          tmp = cur;
        }
        if (tmp === (elem.ownerDocument || document)) {
          eventPath.push(tmp.defaultView || tmp.parentWindow || window);
        }
      }
      i = 0;
      while ((cur = eventPath[i++]) && !event.isPropagationStopped()) {
        event.type = i > 1 ? bubbleType : special.bindType || type;
        handle = (dataPriv.get(cur, "events") || {})[event.type] && dataPriv.get(cur, "handle");
        if (handle) {
          handle.apply(cur, data);
        }
        handle = ontype && cur[ontype];
        if (handle && handle.apply && acceptData(cur)) {
          event.result = handle.apply(cur, data);
          if (event.result === false) {
            event.preventDefault();
          }
        }
      }
      event.type = type;
      if (!onlyHandlers && !event.isDefaultPrevented()) {
        if ((!special._default || special._default.apply(eventPath.pop(), data) === false) && acceptData(elem)) {
          if (ontype && jQuery.isFunction(elem[type]) && !jQuery.isWindow(elem)) {
            tmp = elem[ontype];
            if (tmp) {
              elem[ontype] = null;
            }
            jQuery.event.triggered = type;
            elem[type]();
            jQuery.event.triggered = undefined;
            if (tmp) {
              elem[ontype] = tmp;
            }
          }
        }
      }
      return event.result;
    },
    simulate: function (type, elem, event) {
      var e = jQuery.extend(new jQuery.Event(), event, { type: type, isSimulated: true });
      jQuery.event.trigger(e, null, elem);
    },
  });
  jQuery.fn.extend({
    trigger: function (type, data) {
      return this.each(function () {
        jQuery.event.trigger(type, data, this);
      });
    },
    triggerHandler: function (type, data) {
      var elem = this[0];
      if (elem) {
        return jQuery.event.trigger(type, data, elem, true);
      }
    },
  });
  jQuery.each(
    (
      "blur focus focusin focusout resize scroll click dblclick " +
      "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
      "change select submit keydown keypress keyup contextmenu"
    ).split(" "),
    function (i, name) {
      jQuery.fn[name] = function (data, fn) {
        return arguments.length > 0 ? this.on(name, null, data, fn) : this.trigger(name);
      };
    }
  );
  jQuery.fn.extend({
    hover: function (fnOver, fnOut) {
      return this.mouseenter(fnOver).mouseleave(fnOut || fnOver);
    },
  });
  support.focusin = "onfocusin" in window;
  if (!support.focusin) {
    jQuery.each({ focus: "focusin", blur: "focusout" }, function (orig, fix) {
      var handler = function (event) {
        jQuery.event.simulate(fix, event.target, jQuery.event.fix(event));
      };
      jQuery.event.special[fix] = {
        setup: function () {
          var doc = this.ownerDocument || this,
            attaches = dataPriv.access(doc, fix);
          if (!attaches) {
            doc.addEventListener(orig, handler, true);
          }
          dataPriv.access(doc, fix, (attaches || 0) + 1);
        },
        teardown: function () {
          var doc = this.ownerDocument || this,
            attaches = dataPriv.access(doc, fix) - 1;
          if (!attaches) {
            doc.removeEventListener(orig, handler, true);
            dataPriv.remove(doc, fix);
          } else {
            dataPriv.access(doc, fix, attaches);
          }
        },
      };
    });
  }
  var location = window.location;
  var nonce = jQuery.now();
  var rquery = /\?/;
  jQuery.parseXML = function (data) {
    var xml;
    if (!data || typeof data !== "string") {
      return null;
    }
    try {
      xml = new window.DOMParser().parseFromString(data, "text/xml");
    } catch (e) {
      xml = undefined;
    }
    if (!xml || xml.getElementsByTagName("parsererror").length) {
      jQuery.error("Invalid XML: " + data);
    }
    return xml;
  };
  var rbracket = /\[\]$/,
    rCRLF = /\r?\n/g,
    rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
    rsubmittable = /^(?:input|select|textarea|keygen)/i;
  function buildParams(prefix, obj, traditional, add) {
    var name;
    if (Array.isArray(obj)) {
      jQuery.each(obj, function (i, v) {
        if (traditional || rbracket.test(prefix)) {
          add(prefix, v);
        } else {
          buildParams(prefix + "[" + (typeof v === "object" && v != null ? i : "") + "]", v, traditional, add);
        }
      });
    } else if (!traditional && jQuery.type(obj) === "object") {
      for (name in obj) {
        buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
      }
    } else {
      add(prefix, obj);
    }
  }
  jQuery.param = function (a, traditional) {
    var prefix,
      s = [],
      add = function (key, valueOrFunction) {
        var value = jQuery.isFunction(valueOrFunction) ? valueOrFunction() : valueOrFunction;
        s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value == null ? "" : value);
      };
    if (Array.isArray(a) || (a.jquery && !jQuery.isPlainObject(a))) {
      jQuery.each(a, function () {
        add(this.name, this.value);
      });
    } else {
      for (prefix in a) {
        buildParams(prefix, a[prefix], traditional, add);
      }
    }
    return s.join("&");
  };
  jQuery.fn.extend({
    serialize: function () {
      return jQuery.param(this.serializeArray());
    },
    serializeArray: function () {
      return this.map(function () {
        var elements = jQuery.prop(this, "elements");
        return elements ? jQuery.makeArray(elements) : this;
      })
        .filter(function () {
          var type = this.type;
          return (
            this.name &&
            !jQuery(this).is(":disabled") &&
            rsubmittable.test(this.nodeName) &&
            !rsubmitterTypes.test(type) &&
            (this.checked || !rcheckableType.test(type))
          );
        })
        .map(function (i, elem) {
          var val = jQuery(this).val();
          if (val == null) {
            return null;
          }
          if (Array.isArray(val)) {
            return jQuery.map(val, function (val) {
              return { name: elem.name, value: val.replace(rCRLF, "\r\n") };
            });
          }
          return { name: elem.name, value: val.replace(rCRLF, "\r\n") };
        })
        .get();
    },
  });
  var r20 = /%20/g,
    rhash = /#.*$/,
    rantiCache = /([?&])_=[^&]*/,
    rheaders = /^(.*?):[ \t]*([^\r\n]*)$/gm,
    rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
    rnoContent = /^(?:GET|HEAD)$/,
    rprotocol = /^\/\//,
    prefilters = {},
    transports = {},
    allTypes = "*/".concat("*"),
    originAnchor = document.createElement("a");
  originAnchor.href = location.href;
  function addToPrefiltersOrTransports(structure) {
    return function (dataTypeExpression, func) {
      if (typeof dataTypeExpression !== "string") {
        func = dataTypeExpression;
        dataTypeExpression = "*";
      }
      var dataType,
        i = 0,
        dataTypes = dataTypeExpression.toLowerCase().match(rnothtmlwhite) || [];
      if (jQuery.isFunction(func)) {
        while ((dataType = dataTypes[i++])) {
          if (dataType[0] === "+") {
            dataType = dataType.slice(1) || "*";
            (structure[dataType] = structure[dataType] || []).unshift(func);
          } else {
            (structure[dataType] = structure[dataType] || []).push(func);
          }
        }
      }
    };
  }
  function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR) {
    var inspected = {},
      seekingTransport = structure === transports;
    function inspect(dataType) {
      var selected;
      inspected[dataType] = true;
      jQuery.each(structure[dataType] || [], function (_, prefilterOrFactory) {
        var dataTypeOrTransport = prefilterOrFactory(options, originalOptions, jqXHR);
        if (typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[dataTypeOrTransport]) {
          options.dataTypes.unshift(dataTypeOrTransport);
          inspect(dataTypeOrTransport);
          return false;
        } else if (seekingTransport) {
          return !(selected = dataTypeOrTransport);
        }
      });
      return selected;
    }
    return inspect(options.dataTypes[0]) || (!inspected["*"] && inspect("*"));
  }
  function ajaxExtend(target, src) {
    var key,
      deep,
      flatOptions = jQuery.ajaxSettings.flatOptions || {};
    for (key in src) {
      if (src[key] !== undefined) {
        (flatOptions[key] ? target : deep || (deep = {}))[key] = src[key];
      }
    }
    if (deep) {
      jQuery.extend(true, target, deep);
    }
    return target;
  }
  function ajaxHandleResponses(s, jqXHR, responses) {
    var ct,
      type,
      finalDataType,
      firstDataType,
      contents = s.contents,
      dataTypes = s.dataTypes;
    while (dataTypes[0] === "*") {
      dataTypes.shift();
      if (ct === undefined) {
        ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
      }
    }
    if (ct) {
      for (type in contents) {
        if (contents[type] && contents[type].test(ct)) {
          dataTypes.unshift(type);
          break;
        }
      }
    }
    if (dataTypes[0] in responses) {
      finalDataType = dataTypes[0];
    } else {
      for (type in responses) {
        if (!dataTypes[0] || s.converters[type + " " + dataTypes[0]]) {
          finalDataType = type;
          break;
        }
        if (!firstDataType) {
          firstDataType = type;
        }
      }
      finalDataType = finalDataType || firstDataType;
    }
    if (finalDataType) {
      if (finalDataType !== dataTypes[0]) {
        dataTypes.unshift(finalDataType);
      }
      return responses[finalDataType];
    }
  }
  function ajaxConvert(s, response, jqXHR, isSuccess) {
    var conv2,
      current,
      conv,
      tmp,
      prev,
      converters = {},
      dataTypes = s.dataTypes.slice();
    if (dataTypes[1]) {
      for (conv in s.converters) {
        converters[conv.toLowerCase()] = s.converters[conv];
      }
    }
    current = dataTypes.shift();
    while (current) {
      if (s.responseFields[current]) {
        jqXHR[s.responseFields[current]] = response;
      }
      if (!prev && isSuccess && s.dataFilter) {
        response = s.dataFilter(response, s.dataType);
      }
      prev = current;
      current = dataTypes.shift();
      if (current) {
        if (current === "*") {
          current = prev;
        } else if (prev !== "*" && prev !== current) {
          conv = converters[prev + " " + current] || converters["* " + current];
          if (!conv) {
            for (conv2 in converters) {
              tmp = conv2.split(" ");
              if (tmp[1] === current) {
                conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]];
                if (conv) {
                  if (conv === true) {
                    conv = converters[conv2];
                  } else if (converters[conv2] !== true) {
                    current = tmp[0];
                    dataTypes.unshift(tmp[1]);
                  }
                  break;
                }
              }
            }
          }
          if (conv !== true) {
            if (conv && s.throws) {
              response = conv(response);
            } else {
              try {
                response = conv(response);
              } catch (e) {
                return { state: "parsererror", error: conv ? e : "No conversion from " + prev + " to " + current };
              }
            }
          }
        }
      }
    }
    return { state: "success", data: response };
  }
  jQuery.extend({
    active: 0,
    lastModified: {},
    etag: {},
    ajaxSettings: {
      url: location.href,
      type: "GET",
      isLocal: rlocalProtocol.test(location.protocol),
      global: true,
      processData: true,
      async: true,
      contentType: "application/x-www-form-urlencoded; charset=UTF-8",
      accepts: {
        "*": allTypes,
        text: "text/plain",
        html: "text/html",
        xml: "application/xml, text/xml",
        json: "application/json, text/javascript",
      },
      contents: { xml: /\bxml\b/, html: /\bhtml/, json: /\bjson\b/ },
      responseFields: { xml: "responseXML", text: "responseText", json: "responseJSON" },
      converters: { "* text": String, "text html": true, "text json": JSON.parse, "text xml": jQuery.parseXML },
      flatOptions: { url: true, context: true },
    },
    ajaxSetup: function (target, settings) {
      return settings ? ajaxExtend(ajaxExtend(target, jQuery.ajaxSettings), settings) : ajaxExtend(jQuery.ajaxSettings, target);
    },
    ajaxPrefilter: addToPrefiltersOrTransports(prefilters),
    ajaxTransport: addToPrefiltersOrTransports(transports),
    ajax: function (url, options) {
      if (typeof url === "object") {
        options = url;
        url = undefined;
      }
      options = options || {};
      var transport,
        cacheURL,
        responseHeadersString,
        responseHeaders,
        timeoutTimer,
        urlAnchor,
        completed,
        fireGlobals,
        i,
        uncached,
        s = jQuery.ajaxSetup({}, options),
        callbackContext = s.context || s,
        globalEventContext = s.context && (callbackContext.nodeType || callbackContext.jquery) ? jQuery(callbackContext) : jQuery.event,
        deferred = jQuery.Deferred(),
        completeDeferred = jQuery.Callbacks("once memory"),
        statusCode = s.statusCode || {},
        requestHeaders = {},
        requestHeadersNames = {},
        strAbort = "canceled",
        jqXHR = {
          readyState: 0,
          getResponseHeader: function (key) {
            var match;
            if (completed) {
              if (!responseHeaders) {
                responseHeaders = {};
                while ((match = rheaders.exec(responseHeadersString))) {
                  responseHeaders[match[1].toLowerCase()] = match[2];
                }
              }
              match = responseHeaders[key.toLowerCase()];
            }
            return match == null ? null : match;
          },
          getAllResponseHeaders: function () {
            return completed ? responseHeadersString : null;
          },
          setRequestHeader: function (name, value) {
            if (completed == null) {
              name = requestHeadersNames[name.toLowerCase()] = requestHeadersNames[name.toLowerCase()] || name;
              requestHeaders[name] = value;
            }
            return this;
          },
          overrideMimeType: function (type) {
            if (completed == null) {
              s.mimeType = type;
            }
            return this;
          },
          statusCode: function (map) {
            var code;
            if (map) {
              if (completed) {
                jqXHR.always(map[jqXHR.status]);
              } else {
                for (code in map) {
                  statusCode[code] = [statusCode[code], map[code]];
                }
              }
            }
            return this;
          },
          abort: function (statusText) {
            var finalText = statusText || strAbort;
            if (transport) {
              transport.abort(finalText);
            }
            done(0, finalText);
            return this;
          },
        };
      deferred.promise(jqXHR);
      s.url = ((url || s.url || location.href) + "").replace(rprotocol, location.protocol + "//");
      s.type = options.method || options.type || s.method || s.type;
      s.dataTypes = (s.dataType || "*").toLowerCase().match(rnothtmlwhite) || [""];
      if (s.crossDomain == null) {
        urlAnchor = document.createElement("a");
        try {
          urlAnchor.href = s.url;
          urlAnchor.href = urlAnchor.href;
          s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !== urlAnchor.protocol + "//" + urlAnchor.host;
        } catch (e) {
          s.crossDomain = true;
        }
      }
      if (s.data && s.processData && typeof s.data !== "string") {
        s.data = jQuery.param(s.data, s.traditional);
      }
      inspectPrefiltersOrTransports(prefilters, s, options, jqXHR);
      if (completed) {
        return jqXHR;
      }
      fireGlobals = jQuery.event && s.global;
      if (fireGlobals && jQuery.active++ === 0) {
        jQuery.event.trigger("ajaxStart");
      }
      s.type = s.type.toUpperCase();
      s.hasContent = !rnoContent.test(s.type);
      cacheURL = s.url.replace(rhash, "");
      if (!s.hasContent) {
        uncached = s.url.slice(cacheURL.length);
        if (s.data) {
          cacheURL += (rquery.test(cacheURL) ? "&" : "?") + s.data;
          delete s.data;
        }
        if (s.cache === false) {
          cacheURL = cacheURL.replace(rantiCache, "$1");
          uncached = (rquery.test(cacheURL) ? "&" : "?") + "_=" + nonce++ + uncached;
        }
        s.url = cacheURL + uncached;
      } else if (s.data && s.processData && (s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0) {
        s.data = s.data.replace(r20, "+");
      }
      if (s.ifModified) {
        if (jQuery.lastModified[cacheURL]) {
          jqXHR.setRequestHeader("If-Modified-Since", jQuery.lastModified[cacheURL]);
        }
        if (jQuery.etag[cacheURL]) {
          jqXHR.setRequestHeader("If-None-Match", jQuery.etag[cacheURL]);
        }
      }
      if ((s.data && s.hasContent && s.contentType !== false) || options.contentType) {
        jqXHR.setRequestHeader("Content-Type", s.contentType);
      }
      jqXHR.setRequestHeader(
        "Accept",
        s.dataTypes[0] && s.accepts[s.dataTypes[0]]
          ? s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== "*" ? ", " + allTypes + "; q=0.01" : "")
          : s.accepts["*"]
      );
      for (i in s.headers) {
        jqXHR.setRequestHeader(i, s.headers[i]);
      }
      if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === false || completed)) {
        return jqXHR.abort();
      }
      strAbort = "abort";
      completeDeferred.add(s.complete);
      jqXHR.done(s.success);
      jqXHR.fail(s.error);
      transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR);
      if (!transport) {
        done(-1, "No Transport");
      } else {
        jqXHR.readyState = 1;
        if (fireGlobals) {
          globalEventContext.trigger("ajaxSend", [jqXHR, s]);
        }
        if (completed) {
          return jqXHR;
        }
        if (s.async && s.timeout > 0) {
          timeoutTimer = window.setTimeout(function () {
            jqXHR.abort("timeout");
          }, s.timeout);
        }
        try {
          completed = false;
          transport.send(requestHeaders, done);
        } catch (e) {
          if (completed) {
            throw e;
          }
          done(-1, e);
        }
      }
      function done(status, nativeStatusText, responses, headers) {
        var isSuccess,
          success,
          error,
          response,
          modified,
          statusText = nativeStatusText;
        if (completed) {
          return;
        }
        completed = true;
        if (timeoutTimer) {
          window.clearTimeout(timeoutTimer);
        }
        transport = undefined;
        responseHeadersString = headers || "";
        jqXHR.readyState = status > 0 ? 4 : 0;
        isSuccess = (status >= 200 && status < 300) || status === 304;
        if (responses) {
          response = ajaxHandleResponses(s, jqXHR, responses);
        }
        response = ajaxConvert(s, response, jqXHR, isSuccess);
        if (isSuccess) {
          if (s.ifModified) {
            modified = jqXHR.getResponseHeader("Last-Modified");
            if (modified) {
              jQuery.lastModified[cacheURL] = modified;
            }
            modified = jqXHR.getResponseHeader("etag");
            if (modified) {
              jQuery.etag[cacheURL] = modified;
            }
          }
          if (status === 204 || s.type === "HEAD") {
            statusText = "nocontent";
          } else if (status === 304) {
            statusText = "notmodified";
          } else {
            statusText = response.state;
            success = response.data;
            error = response.error;
            isSuccess = !error;
          }
        } else {
          error = statusText;
          if (status || !statusText) {
            statusText = "error";
            if (status < 0) {
              status = 0;
            }
          }
        }
        jqXHR.status = status;
        jqXHR.statusText = (nativeStatusText || statusText) + "";
        if (isSuccess) {
          deferred.resolveWith(callbackContext, [success, statusText, jqXHR]);
        } else {
          deferred.rejectWith(callbackContext, [jqXHR, statusText, error]);
        }
        jqXHR.statusCode(statusCode);
        statusCode = undefined;
        if (fireGlobals) {
          globalEventContext.trigger(isSuccess ? "ajaxSuccess" : "ajaxError", [jqXHR, s, isSuccess ? success : error]);
        }
        completeDeferred.fireWith(callbackContext, [jqXHR, statusText]);
        if (fireGlobals) {
          globalEventContext.trigger("ajaxComplete", [jqXHR, s]);
          if (!--jQuery.active) {
            jQuery.event.trigger("ajaxStop");
          }
        }
      }
      return jqXHR;
    },
    getJSON: function (url, data, callback) {
      return jQuery.get(url, data, callback, "json");
    },
    getScript: function (url, callback) {
      return jQuery.get(url, undefined, callback, "script");
    },
  });
  jQuery.each(["get", "post"], function (i, method) {
    jQuery[method] = function (url, data, callback, type) {
      if (jQuery.isFunction(data)) {
        type = type || callback;
        callback = data;
        data = undefined;
      }
      return jQuery.ajax(
        jQuery.extend({ url: url, type: method, dataType: type, data: data, success: callback }, jQuery.isPlainObject(url) && url)
      );
    };
  });
  jQuery._evalUrl = function (url) {
    return jQuery.ajax({ url: url, type: "GET", dataType: "script", cache: true, async: false, global: false, throws: true });
  };
  jQuery.fn.extend({
    wrapAll: function (html) {
      var wrap;
      if (this[0]) {
        if (jQuery.isFunction(html)) {
          html = html.call(this[0]);
        }
        wrap = jQuery(html, this[0].ownerDocument).eq(0).clone(true);
        if (this[0].parentNode) {
          wrap.insertBefore(this[0]);
        }
        wrap
          .map(function () {
            var elem = this;
            while (elem.firstElementChild) {
              elem = elem.firstElementChild;
            }
            return elem;
          })
          .append(this);
      }
      return this;
    },
    wrapInner: function (html) {
      if (jQuery.isFunction(html)) {
        return this.each(function (i) {
          jQuery(this).wrapInner(html.call(this, i));
        });
      }
      return this.each(function () {
        var self = jQuery(this),
          contents = self.contents();
        if (contents.length) {
          contents.wrapAll(html);
        } else {
          self.append(html);
        }
      });
    },
    wrap: function (html) {
      var isFunction = jQuery.isFunction(html);
      return this.each(function (i) {
        jQuery(this).wrapAll(isFunction ? html.call(this, i) : html);
      });
    },
    unwrap: function (selector) {
      this.parent(selector)
        .not("body")
        .each(function () {
          jQuery(this).replaceWith(this.childNodes);
        });
      return this;
    },
  });
  jQuery.expr.pseudos.hidden = function (elem) {
    return !jQuery.expr.pseudos.visible(elem);
  };
  jQuery.expr.pseudos.visible = function (elem) {
    return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
  };
  jQuery.ajaxSettings.xhr = function () {
    try {
      return new window.XMLHttpRequest();
    } catch (e) {}
  };
  var xhrSuccessStatus = { 0: 200, 1223: 204 },
    xhrSupported = jQuery.ajaxSettings.xhr();
  support.cors = !!xhrSupported && "withCredentials" in xhrSupported;
  support.ajax = xhrSupported = !!xhrSupported;
  jQuery.ajaxTransport(function (options) {
    var callback, errorCallback;
    if (support.cors || (xhrSupported && !options.crossDomain)) {
      return {
        send: function (headers, complete) {
          var i,
            xhr = options.xhr();
          xhr.open(options.type, options.url, options.async, options.username, options.password);
          if (options.xhrFields) {
            for (i in options.xhrFields) {
              xhr[i] = options.xhrFields[i];
            }
          }
          if (options.mimeType && xhr.overrideMimeType) {
            xhr.overrideMimeType(options.mimeType);
          }
          if (!options.crossDomain && !headers["X-Requested-With"]) {
            headers["X-Requested-With"] = "XMLHttpRequest";
          }
          for (i in headers) {
            xhr.setRequestHeader(i, headers[i]);
          }
          callback = function (type) {
            return function () {
              if (callback) {
                callback = errorCallback = xhr.onload = xhr.onerror = xhr.onabort = xhr.onreadystatechange = null;
                if (type === "abort") {
                  xhr.abort();
                } else if (type === "error") {
                  if (typeof xhr.status !== "number") {
                    complete(0, "error");
                  } else {
                    complete(xhr.status, xhr.statusText);
                  }
                } else {
                  complete(
                    xhrSuccessStatus[xhr.status] || xhr.status,
                    xhr.statusText,
                    (xhr.responseType || "text") !== "text" || typeof xhr.responseText !== "string"
                      ? { binary: xhr.response }
                      : { text: xhr.responseText },
                    xhr.getAllResponseHeaders()
                  );
                }
              }
            };
          };
          xhr.onload = callback();
          errorCallback = xhr.onerror = callback("error");
          if (xhr.onabort !== undefined) {
            xhr.onabort = errorCallback;
          } else {
            xhr.onreadystatechange = function () {
              if (xhr.readyState === 4) {
                window.setTimeout(function () {
                  if (callback) {
                    errorCallback();
                  }
                });
              }
            };
          }
          callback = callback("abort");
          try {
            xhr.send((options.hasContent && options.data) || null);
          } catch (e) {
            if (callback) {
              throw e;
            }
          }
        },
        abort: function () {
          if (callback) {
            callback();
          }
        },
      };
    }
  });
  jQuery.ajaxPrefilter(function (s) {
    if (s.crossDomain) {
      s.contents.script = false;
    }
  });
  jQuery.ajaxSetup({
    accepts: { script: "text/javascript, application/javascript, " + "application/ecmascript, application/x-ecmascript" },
    contents: { script: /\b(?:java|ecma)script\b/ },
    converters: {
      "text script": function (text) {
        jQuery.globalEval(text);
        return text;
      },
    },
  });
  jQuery.ajaxPrefilter("script", function (s) {
    if (s.cache === undefined) {
      s.cache = false;
    }
    if (s.crossDomain) {
      s.type = "GET";
    }
  });
  jQuery.ajaxTransport("script", function (s) {
    if (s.crossDomain) {
      var script, callback;
      return {
        send: function (_, complete) {
          script = jQuery("<script>")
            .prop({ charset: s.scriptCharset, src: s.url })
            .on(
              "load error",
              (callback = function (evt) {
                script.remove();
                callback = null;
                if (evt) {
                  complete(evt.type === "error" ? 404 : 200, evt.type);
                }
              })
            );
          document.head.appendChild(script[0]);
        },
        abort: function () {
          if (callback) {
            callback();
          }
        },
      };
    }
  });
  var oldCallbacks = [],
    rjsonp = /(=)\?(?=&|$)|\?\?/;
  jQuery.ajaxSetup({
    jsonp: "callback",
    jsonpCallback: function () {
      var callback = oldCallbacks.pop() || jQuery.expando + "_" + nonce++;
      this[callback] = true;
      return callback;
    },
  });
  jQuery.ajaxPrefilter("json jsonp", function (s, originalSettings, jqXHR) {
    var callbackName,
      overwritten,
      responseContainer,
      jsonProp =
        s.jsonp !== false &&
        (rjsonp.test(s.url)
          ? "url"
          : typeof s.data === "string" &&
            (s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0 &&
            rjsonp.test(s.data) &&
            "data");
    if (jsonProp || s.dataTypes[0] === "jsonp") {
      callbackName = s.jsonpCallback = jQuery.isFunction(s.jsonpCallback) ? s.jsonpCallback() : s.jsonpCallback;
      if (jsonProp) {
        s[jsonProp] = s[jsonProp].replace(rjsonp, "$1" + callbackName);
      } else if (s.jsonp !== false) {
        s.url += (rquery.test(s.url) ? "&" : "?") + s.jsonp + "=" + callbackName;
      }
      s.converters["script json"] = function () {
        if (!responseContainer) {
          jQuery.error(callbackName + " was not called");
        }
        return responseContainer[0];
      };
      s.dataTypes[0] = "json";
      overwritten = window[callbackName];
      window[callbackName] = function () {
        responseContainer = arguments;
      };
      jqXHR.always(function () {
        if (overwritten === undefined) {
          jQuery(window).removeProp(callbackName);
        } else {
          window[callbackName] = overwritten;
        }
        if (s[callbackName]) {
          s.jsonpCallback = originalSettings.jsonpCallback;
          oldCallbacks.push(callbackName);
        }
        if (responseContainer && jQuery.isFunction(overwritten)) {
          overwritten(responseContainer[0]);
        }
        responseContainer = overwritten = undefined;
      });
      return "script";
    }
  });
  support.createHTMLDocument = (function () {
    var body = document.implementation.createHTMLDocument("").body;
    body.innerHTML = "<form></form><form></form>";
    return body.childNodes.length === 2;
  })();
  jQuery.parseHTML = function (data, context, keepScripts) {
    if (typeof data !== "string") {
      return [];
    }
    if (typeof context === "boolean") {
      keepScripts = context;
      context = false;
    }
    var base, parsed, scripts;
    if (!context) {
      if (support.createHTMLDocument) {
        context = document.implementation.createHTMLDocument("");
        base = context.createElement("base");
        base.href = document.location.href;
        context.head.appendChild(base);
      } else {
        context = document;
      }
    }
    parsed = rsingleTag.exec(data);
    scripts = !keepScripts && [];
    if (parsed) {
      return [context.createElement(parsed[1])];
    }
    parsed = buildFragment([data], context, scripts);
    if (scripts && scripts.length) {
      jQuery(scripts).remove();
    }
    return jQuery.merge([], parsed.childNodes);
  };
  jQuery.fn.load = function (url, params, callback) {
    var selector,
      type,
      response,
      self = this,
      off = url.indexOf(" ");
    if (off > -1) {
      selector = stripAndCollapse(url.slice(off));
      url = url.slice(0, off);
    }
    if (jQuery.isFunction(params)) {
      callback = params;
      params = undefined;
    } else if (params && typeof params === "object") {
      type = "POST";
    }
    if (self.length > 0) {
      jQuery
        .ajax({ url: url, type: type || "GET", dataType: "html", data: params })
        .done(function (responseText) {
          response = arguments;
          self.html(selector ? jQuery("<div>").append(jQuery.parseHTML(responseText)).find(selector) : responseText);
        })
        .always(
          callback &&
            function (jqXHR, status) {
              self.each(function () {
                callback.apply(this, response || [jqXHR.responseText, status, jqXHR]);
              });
            }
        );
    }
    return this;
  };
  jQuery.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function (i, type) {
    jQuery.fn[type] = function (fn) {
      return this.on(type, fn);
    };
  });
  jQuery.expr.pseudos.animated = function (elem) {
    return jQuery.grep(jQuery.timers, function (fn) {
      return elem === fn.elem;
    }).length;
  };
  jQuery.offset = {
    setOffset: function (elem, options, i) {
      var curPosition,
        curLeft,
        curCSSTop,
        curTop,
        curOffset,
        curCSSLeft,
        calculatePosition,
        position = jQuery.css(elem, "position"),
        curElem = jQuery(elem),
        props = {};
      if (position === "static") {
        elem.style.position = "relative";
      }
      curOffset = curElem.offset();
      curCSSTop = jQuery.css(elem, "top");
      curCSSLeft = jQuery.css(elem, "left");
      calculatePosition = (position === "absolute" || position === "fixed") && (curCSSTop + curCSSLeft).indexOf("auto") > -1;
      if (calculatePosition) {
        curPosition = curElem.position();
        curTop = curPosition.top;
        curLeft = curPosition.left;
      } else {
        curTop = parseFloat(curCSSTop) || 0;
        curLeft = parseFloat(curCSSLeft) || 0;
      }
      if (jQuery.isFunction(options)) {
        options = options.call(elem, i, jQuery.extend({}, curOffset));
      }
      if (options.top != null) {
        props.top = options.top - curOffset.top + curTop;
      }
      if (options.left != null) {
        props.left = options.left - curOffset.left + curLeft;
      }
      if ("using" in options) {
        options.using.call(elem, props);
      } else {
        curElem.css(props);
      }
    },
  };
  jQuery.fn.extend({
    offset: function (options) {
      if (arguments.length) {
        return options === undefined
          ? this
          : this.each(function (i) {
              jQuery.offset.setOffset(this, options, i);
            });
      }
      var doc,
        docElem,
        rect,
        win,
        elem = this[0];
      if (!elem) {
        return;
      }
      if (!elem.getClientRects().length) {
        return { top: 0, left: 0 };
      }
      rect = elem.getBoundingClientRect();
      doc = elem.ownerDocument;
      docElem = doc.documentElement;
      win = doc.defaultView;
      return { top: rect.top + win.pageYOffset - docElem.clientTop, left: rect.left + win.pageXOffset - docElem.clientLeft };
    },
    position: function () {
      if (!this[0]) {
        return;
      }
      var offsetParent,
        offset,
        elem = this[0],
        parentOffset = { top: 0, left: 0 };
      if (jQuery.css(elem, "position") === "fixed") {
        offset = elem.getBoundingClientRect();
      } else {
        offsetParent = this.offsetParent();
        offset = this.offset();
        if (!nodeName(offsetParent[0], "html")) {
          parentOffset = offsetParent.offset();
        }
        parentOffset = {
          top: parentOffset.top + jQuery.css(offsetParent[0], "borderTopWidth", true),
          left: parentOffset.left + jQuery.css(offsetParent[0], "borderLeftWidth", true),
        };
      }
      return {
        top: offset.top - parentOffset.top - jQuery.css(elem, "marginTop", true),
        left: offset.left - parentOffset.left - jQuery.css(elem, "marginLeft", true),
      };
    },
    offsetParent: function () {
      return this.map(function () {
        var offsetParent = this.offsetParent;
        while (offsetParent && jQuery.css(offsetParent, "position") === "static") {
          offsetParent = offsetParent.offsetParent;
        }
        return offsetParent || documentElement;
      });
    },
  });
  jQuery.each({ scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function (method, prop) {
    var top = "pageYOffset" === prop;
    jQuery.fn[method] = function (val) {
      return access(
        this,
        function (elem, method, val) {
          var win;
          if (jQuery.isWindow(elem)) {
            win = elem;
          } else if (elem.nodeType === 9) {
            win = elem.defaultView;
          }
          if (val === undefined) {
            return win ? win[prop] : elem[method];
          }
          if (win) {
            win.scrollTo(!top ? val : win.pageXOffset, top ? val : win.pageYOffset);
          } else {
            elem[method] = val;
          }
        },
        method,
        val,
        arguments.length
      );
    };
  });
  jQuery.each(["top", "left"], function (i, prop) {
    jQuery.cssHooks[prop] = addGetHookIf(support.pixelPosition, function (elem, computed) {
      if (computed) {
        computed = curCSS(elem, prop);
        return rnumnonpx.test(computed) ? jQuery(elem).position()[prop] + "px" : computed;
      }
    });
  });
  jQuery.each({ Height: "height", Width: "width" }, function (name, type) {
    jQuery.each({ padding: "inner" + name, content: type, "": "outer" + name }, function (defaultExtra, funcName) {
      jQuery.fn[funcName] = function (margin, value) {
        var chainable = arguments.length && (defaultExtra || typeof margin !== "boolean"),
          extra = defaultExtra || (margin === true || value === true ? "margin" : "border");
        return access(
          this,
          function (elem, type, value) {
            var doc;
            if (jQuery.isWindow(elem)) {
              return funcName.indexOf("outer") === 0 ? elem["inner" + name] : elem.document.documentElement["client" + name];
            }
            if (elem.nodeType === 9) {
              doc = elem.documentElement;
              return Math.max(
                elem.body["scroll" + name],
                doc["scroll" + name],
                elem.body["offset" + name],
                doc["offset" + name],
                doc["client" + name]
              );
            }
            return value === undefined ? jQuery.css(elem, type, extra) : jQuery.style(elem, type, value, extra);
          },
          type,
          chainable ? margin : undefined,
          chainable
        );
      };
    });
  });
  jQuery.fn.extend({
    bind: function (types, data, fn) {
      return this.on(types, null, data, fn);
    },
    unbind: function (types, fn) {
      return this.off(types, null, fn);
    },
    delegate: function (selector, types, data, fn) {
      return this.on(types, selector, data, fn);
    },
    undelegate: function (selector, types, fn) {
      return arguments.length === 1 ? this.off(selector, "**") : this.off(types, selector || "**", fn);
    },
  });
  jQuery.holdReady = function (hold) {
    if (hold) {
      jQuery.readyWait++;
    } else {
      jQuery.ready(true);
    }
  };
  jQuery.isArray = Array.isArray;
  jQuery.parseJSON = JSON.parse;
  jQuery.nodeName = nodeName;
  if (typeof define === "function" && define.amd) {
    define("jquery", [], function () {
      return jQuery;
    });
  }
  var _jQuery = window.jQuery,
    _$ = window.$;
  jQuery.noConflict = function (deep) {
    if (window.$ === jQuery) {
      window.$ = _$;
    }
    if (deep && window.jQuery === jQuery) {
      window.jQuery = _jQuery;
    }
    return jQuery;
  };
  if (!noGlobal) {
    window.jQuery = window.$ = jQuery;
  }
  return jQuery;
});
(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? (module.exports = factory())
    : typeof define === "function" && define.amd
    ? define(factory)
    : (global.Popper = factory());
})(this, function () {
  "use strict";
  var isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
  var longerTimeoutBrowsers = ["Edge", "Trident", "Firefox"];
  var timeoutDuration = 0;
  for (var i = 0; i < longerTimeoutBrowsers.length; i += 1) {
    if (isBrowser && navigator.userAgent.indexOf(longerTimeoutBrowsers[i]) >= 0) {
      timeoutDuration = 1;
      break;
    }
  }
  function microtaskDebounce(fn) {
    var called = false;
    return function () {
      if (called) {
        return;
      }
      called = true;
      window.Promise.resolve().then(function () {
        called = false;
        fn();
      });
    };
  }
  function taskDebounce(fn) {
    var scheduled = false;
    return function () {
      if (!scheduled) {
        scheduled = true;
        setTimeout(function () {
          scheduled = false;
          fn();
        }, timeoutDuration);
      }
    };
  }
  var supportsMicroTasks = isBrowser && window.Promise;
  var debounce = supportsMicroTasks ? microtaskDebounce : taskDebounce;
  function isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === "[object Function]";
  }
  function getStyleComputedProperty(element, property) {
    if (element.nodeType !== 1) {
      return [];
    }
    var css = getComputedStyle(element, null);
    return property ? css[property] : css;
  }
  function getParentNode(element) {
    if (element.nodeName === "HTML") {
      return element;
    }
    return element.parentNode || element.host;
  }
  function getScrollParent(element) {
    if (!element) {
      return document.body;
    }
    switch (element.nodeName) {
      case "HTML":
      case "BODY":
        return element.ownerDocument.body;
      case "#document":
        return element.body;
    }
    var _getStyleComputedProp = getStyleComputedProperty(element),
      overflow = _getStyleComputedProp.overflow,
      overflowX = _getStyleComputedProp.overflowX,
      overflowY = _getStyleComputedProp.overflowY;
    if (/(auto|scroll)/.test(overflow + overflowY + overflowX)) {
      return element;
    }
    return getScrollParent(getParentNode(element));
  }
  function getOffsetParent(element) {
    var offsetParent = element && element.offsetParent;
    var nodeName = offsetParent && offsetParent.nodeName;
    if (!nodeName || nodeName === "BODY" || nodeName === "HTML") {
      if (element) {
        return element.ownerDocument.documentElement;
      }
      return document.documentElement;
    }
    if (["TD", "TABLE"].indexOf(offsetParent.nodeName) !== -1 && getStyleComputedProperty(offsetParent, "position") === "static") {
      return getOffsetParent(offsetParent);
    }
    return offsetParent;
  }
  function isOffsetContainer(element) {
    var nodeName = element.nodeName;
    if (nodeName === "BODY") {
      return false;
    }
    return nodeName === "HTML" || getOffsetParent(element.firstElementChild) === element;
  }
  function getRoot(node) {
    if (node.parentNode !== null) {
      return getRoot(node.parentNode);
    }
    return node;
  }
  function findCommonOffsetParent(element1, element2) {
    if (!element1 || !element1.nodeType || !element2 || !element2.nodeType) {
      return document.documentElement;
    }
    var order = element1.compareDocumentPosition(element2) & Node.DOCUMENT_POSITION_FOLLOWING;
    var start = order ? element1 : element2;
    var end = order ? element2 : element1;
    var range = document.createRange();
    range.setStart(start, 0);
    range.setEnd(end, 0);
    var commonAncestorContainer = range.commonAncestorContainer;
    if ((element1 !== commonAncestorContainer && element2 !== commonAncestorContainer) || start.contains(end)) {
      if (isOffsetContainer(commonAncestorContainer)) {
        return commonAncestorContainer;
      }
      return getOffsetParent(commonAncestorContainer);
    }
    var element1root = getRoot(element1);
    if (element1root.host) {
      return findCommonOffsetParent(element1root.host, element2);
    } else {
      return findCommonOffsetParent(element1, getRoot(element2).host);
    }
  }
  function getScroll(element) {
    var side = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "top";
    var upperSide = side === "top" ? "scrollTop" : "scrollLeft";
    var nodeName = element.nodeName;
    if (nodeName === "BODY" || nodeName === "HTML") {
      var html = element.ownerDocument.documentElement;
      var scrollingElement = element.ownerDocument.scrollingElement || html;
      return scrollingElement[upperSide];
    }
    return element[upperSide];
  }
  function includeScroll(rect, element) {
    var subtract = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var scrollTop = getScroll(element, "top");
    var scrollLeft = getScroll(element, "left");
    var modifier = subtract ? -1 : 1;
    rect.top += scrollTop * modifier;
    rect.bottom += scrollTop * modifier;
    rect.left += scrollLeft * modifier;
    rect.right += scrollLeft * modifier;
    return rect;
  }
  function getBordersSize(styles, axis) {
    var sideA = axis === "x" ? "Left" : "Top";
    var sideB = sideA === "Left" ? "Right" : "Bottom";
    return parseFloat(styles["border" + sideA + "Width"], 10) + parseFloat(styles["border" + sideB + "Width"], 10);
  }
  var isIE10 = undefined;
  var isIE10$1 = function () {
    if (isIE10 === undefined) {
      isIE10 = navigator.appVersion.indexOf("MSIE 10") !== -1;
    }
    return isIE10;
  };
  function getSize(axis, body, html, computedStyle) {
    return Math.max(
      body["offset" + axis],
      body["scroll" + axis],
      html["client" + axis],
      html["offset" + axis],
      html["scroll" + axis],
      isIE10$1()
        ? html["offset" + axis] +
            computedStyle["margin" + (axis === "Height" ? "Top" : "Left")] +
            computedStyle["margin" + (axis === "Height" ? "Bottom" : "Right")]
        : 0
    );
  }
  function getWindowSizes() {
    var body = document.body;
    var html = document.documentElement;
    var computedStyle = isIE10$1() && getComputedStyle(html);
    return { height: getSize("Height", body, html, computedStyle), width: getSize("Width", body, html, computedStyle) };
  }
  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };
  var createClass = (function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  })();
  var defineProperty = function (obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  };
  var _extends =
    Object.assign ||
    function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    };
  function getClientRect(offsets) {
    return _extends({}, offsets, { right: offsets.left + offsets.width, bottom: offsets.top + offsets.height });
  }
  function getBoundingClientRect(element) {
    var rect = {};
    if (isIE10$1()) {
      try {
        rect = element.getBoundingClientRect();
        var scrollTop = getScroll(element, "top");
        var scrollLeft = getScroll(element, "left");
        rect.top += scrollTop;
        rect.left += scrollLeft;
        rect.bottom += scrollTop;
        rect.right += scrollLeft;
      } catch (err) {}
    } else {
      rect = element.getBoundingClientRect();
    }
    var result = { left: rect.left, top: rect.top, width: rect.right - rect.left, height: rect.bottom - rect.top };
    var sizes = element.nodeName === "HTML" ? getWindowSizes() : {};
    var width = sizes.width || element.clientWidth || result.right - result.left;
    var height = sizes.height || element.clientHeight || result.bottom - result.top;
    var horizScrollbar = element.offsetWidth - width;
    var vertScrollbar = element.offsetHeight - height;
    if (horizScrollbar || vertScrollbar) {
      var styles = getStyleComputedProperty(element);
      horizScrollbar -= getBordersSize(styles, "x");
      vertScrollbar -= getBordersSize(styles, "y");
      result.width -= horizScrollbar;
      result.height -= vertScrollbar;
    }
    return getClientRect(result);
  }
  function getOffsetRectRelativeToArbitraryNode(children, parent) {
    var isIE10 = isIE10$1();
    var isHTML = parent.nodeName === "HTML";
    var childrenRect = getBoundingClientRect(children);
    var parentRect = getBoundingClientRect(parent);
    var scrollParent = getScrollParent(children);
    var styles = getStyleComputedProperty(parent);
    var borderTopWidth = parseFloat(styles.borderTopWidth, 10);
    var borderLeftWidth = parseFloat(styles.borderLeftWidth, 10);
    var offsets = getClientRect({
      top: childrenRect.top - parentRect.top - borderTopWidth,
      left: childrenRect.left - parentRect.left - borderLeftWidth,
      width: childrenRect.width,
      height: childrenRect.height,
    });
    offsets.marginTop = 0;
    offsets.marginLeft = 0;
    if (!isIE10 && isHTML) {
      var marginTop = parseFloat(styles.marginTop, 10);
      var marginLeft = parseFloat(styles.marginLeft, 10);
      offsets.top -= borderTopWidth - marginTop;
      offsets.bottom -= borderTopWidth - marginTop;
      offsets.left -= borderLeftWidth - marginLeft;
      offsets.right -= borderLeftWidth - marginLeft;
      offsets.marginTop = marginTop;
      offsets.marginLeft = marginLeft;
    }
    if (isIE10 ? parent.contains(scrollParent) : parent === scrollParent && scrollParent.nodeName !== "BODY") {
      offsets = includeScroll(offsets, parent);
    }
    return offsets;
  }
  function getViewportOffsetRectRelativeToArtbitraryNode(element) {
    var html = element.ownerDocument.documentElement;
    var relativeOffset = getOffsetRectRelativeToArbitraryNode(element, html);
    var width = Math.max(html.clientWidth, window.innerWidth || 0);
    var height = Math.max(html.clientHeight, window.innerHeight || 0);
    var scrollTop = getScroll(html);
    var scrollLeft = getScroll(html, "left");
    var offset = {
      top: scrollTop - relativeOffset.top + relativeOffset.marginTop,
      left: scrollLeft - relativeOffset.left + relativeOffset.marginLeft,
      width: width,
      height: height,
    };
    return getClientRect(offset);
  }
  function isFixed(element) {
    var nodeName = element.nodeName;
    if (nodeName === "BODY" || nodeName === "HTML") {
      return false;
    }
    if (getStyleComputedProperty(element, "position") === "fixed") {
      return true;
    }
    return isFixed(getParentNode(element));
  }
  function getBoundaries(popper, reference, padding, boundariesElement) {
    var boundaries = { top: 0, left: 0 };
    var offsetParent = findCommonOffsetParent(popper, reference);
    if (boundariesElement === "viewport") {
      boundaries = getViewportOffsetRectRelativeToArtbitraryNode(offsetParent);
    } else {
      var boundariesNode = void 0;
      if (boundariesElement === "scrollParent") {
        boundariesNode = getScrollParent(getParentNode(reference));
        if (boundariesNode.nodeName === "BODY") {
          boundariesNode = popper.ownerDocument.documentElement;
        }
      } else if (boundariesElement === "window") {
        boundariesNode = popper.ownerDocument.documentElement;
      } else {
        boundariesNode = boundariesElement;
      }
      var offsets = getOffsetRectRelativeToArbitraryNode(boundariesNode, offsetParent);
      if (boundariesNode.nodeName === "HTML" && !isFixed(offsetParent)) {
        var _getWindowSizes = getWindowSizes(),
          height = _getWindowSizes.height,
          width = _getWindowSizes.width;
        boundaries.top += offsets.top - offsets.marginTop;
        boundaries.bottom = height + offsets.top;
        boundaries.left += offsets.left - offsets.marginLeft;
        boundaries.right = width + offsets.left;
      } else {
        boundaries = offsets;
      }
    }
    boundaries.left += padding;
    boundaries.top += padding;
    boundaries.right -= padding;
    boundaries.bottom -= padding;
    return boundaries;
  }
  function getArea(_ref) {
    var width = _ref.width,
      height = _ref.height;
    return width * height;
  }
  function computeAutoPlacement(placement, refRect, popper, reference, boundariesElement) {
    var padding = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
    if (placement.indexOf("auto") === -1) {
      return placement;
    }
    var boundaries = getBoundaries(popper, reference, padding, boundariesElement);
    var rects = {
      top: { width: boundaries.width, height: refRect.top - boundaries.top },
      right: { width: boundaries.right - refRect.right, height: boundaries.height },
      bottom: { width: boundaries.width, height: boundaries.bottom - refRect.bottom },
      left: { width: refRect.left - boundaries.left, height: boundaries.height },
    };
    var sortedAreas = Object.keys(rects)
      .map(function (key) {
        return _extends({ key: key }, rects[key], { area: getArea(rects[key]) });
      })
      .sort(function (a, b) {
        return b.area - a.area;
      });
    var filteredAreas = sortedAreas.filter(function (_ref2) {
      var width = _ref2.width,
        height = _ref2.height;
      return width >= popper.clientWidth && height >= popper.clientHeight;
    });
    var computedPlacement = filteredAreas.length > 0 ? filteredAreas[0].key : sortedAreas[0].key;
    var variation = placement.split("-")[1];
    return computedPlacement + (variation ? "-" + variation : "");
  }
  function getReferenceOffsets(state, popper, reference) {
    var commonOffsetParent = findCommonOffsetParent(popper, reference);
    return getOffsetRectRelativeToArbitraryNode(reference, commonOffsetParent);
  }
  function getOuterSizes(element) {
    var styles = getComputedStyle(element);
    var x = parseFloat(styles.marginTop) + parseFloat(styles.marginBottom);
    var y = parseFloat(styles.marginLeft) + parseFloat(styles.marginRight);
    var result = { width: element.offsetWidth + y, height: element.offsetHeight + x };
    return result;
  }
  function getOppositePlacement(placement) {
    var hash = { left: "right", right: "left", bottom: "top", top: "bottom" };
    return placement.replace(/left|right|bottom|top/g, function (matched) {
      return hash[matched];
    });
  }
  function getPopperOffsets(popper, referenceOffsets, placement) {
    placement = placement.split("-")[0];
    var popperRect = getOuterSizes(popper);
    var popperOffsets = { width: popperRect.width, height: popperRect.height };
    var isHoriz = ["right", "left"].indexOf(placement) !== -1;
    var mainSide = isHoriz ? "top" : "left";
    var secondarySide = isHoriz ? "left" : "top";
    var measurement = isHoriz ? "height" : "width";
    var secondaryMeasurement = !isHoriz ? "height" : "width";
    popperOffsets[mainSide] = referenceOffsets[mainSide] + referenceOffsets[measurement] / 2 - popperRect[measurement] / 2;
    if (placement === secondarySide) {
      popperOffsets[secondarySide] = referenceOffsets[secondarySide] - popperRect[secondaryMeasurement];
    } else {
      popperOffsets[secondarySide] = referenceOffsets[getOppositePlacement(secondarySide)];
    }
    return popperOffsets;
  }
  function find(arr, check) {
    if (Array.prototype.find) {
      return arr.find(check);
    }
    return arr.filter(check)[0];
  }
  function findIndex(arr, prop, value) {
    if (Array.prototype.findIndex) {
      return arr.findIndex(function (cur) {
        return cur[prop] === value;
      });
    }
    var match = find(arr, function (obj) {
      return obj[prop] === value;
    });
    return arr.indexOf(match);
  }
  function runModifiers(modifiers, data, ends) {
    var modifiersToRun = ends === undefined ? modifiers : modifiers.slice(0, findIndex(modifiers, "name", ends));
    modifiersToRun.forEach(function (modifier) {
      if (modifier["function"]) {
        console.warn("`modifier.function` is deprecated, use `modifier.fn`!");
      }
      var fn = modifier["function"] || modifier.fn;
      if (modifier.enabled && isFunction(fn)) {
        data.offsets.popper = getClientRect(data.offsets.popper);
        data.offsets.reference = getClientRect(data.offsets.reference);
        data = fn(data, modifier);
      }
    });
    return data;
  }
  function update() {
    if (this.state.isDestroyed) {
      return;
    }
    var data = { instance: this, styles: {}, arrowStyles: {}, attributes: {}, flipped: false, offsets: {} };
    data.offsets.reference = getReferenceOffsets(this.state, this.popper, this.reference);
    data.placement = computeAutoPlacement(
      this.options.placement,
      data.offsets.reference,
      this.popper,
      this.reference,
      this.options.modifiers.flip.boundariesElement,
      this.options.modifiers.flip.padding
    );
    data.originalPlacement = data.placement;
    data.offsets.popper = getPopperOffsets(this.popper, data.offsets.reference, data.placement);
    data.offsets.popper.position = "absolute";
    data = runModifiers(this.modifiers, data);
    if (!this.state.isCreated) {
      this.state.isCreated = true;
      this.options.onCreate(data);
    } else {
      this.options.onUpdate(data);
    }
  }
  function isModifierEnabled(modifiers, modifierName) {
    return modifiers.some(function (_ref) {
      var name = _ref.name,
        enabled = _ref.enabled;
      return enabled && name === modifierName;
    });
  }
  function getSupportedPropertyName(property) {
    var prefixes = [false, "ms", "Webkit", "Moz", "O"];
    var upperProp = property.charAt(0).toUpperCase() + property.slice(1);
    for (var i = 0; i < prefixes.length - 1; i++) {
      var prefix = prefixes[i];
      var toCheck = prefix ? "" + prefix + upperProp : property;
      if (typeof document.body.style[toCheck] !== "undefined") {
        return toCheck;
      }
    }
    return null;
  }
  function destroy() {
    this.state.isDestroyed = true;
    if (isModifierEnabled(this.modifiers, "applyStyle")) {
      this.popper.removeAttribute("x-placement");
      this.popper.style.left = "";
      this.popper.style.position = "";
      this.popper.style.top = "";
      this.popper.style[getSupportedPropertyName("transform")] = "";
    }
    this.disableEventListeners();
    if (this.options.removeOnDestroy) {
      this.popper.parentNode.removeChild(this.popper);
    }
    return this;
  }
  function getWindow(element) {
    var ownerDocument = element.ownerDocument;
    return ownerDocument ? ownerDocument.defaultView : window;
  }
  function attachToScrollParents(scrollParent, event, callback, scrollParents) {
    var isBody = scrollParent.nodeName === "BODY";
    var target = isBody ? scrollParent.ownerDocument.defaultView : scrollParent;
    target.addEventListener(event, callback, { passive: true });
    if (!isBody) {
      attachToScrollParents(getScrollParent(target.parentNode), event, callback, scrollParents);
    }
    scrollParents.push(target);
  }
  function setupEventListeners(reference, options, state, updateBound) {
    state.updateBound = updateBound;
    getWindow(reference).addEventListener("resize", state.updateBound, { passive: true });
    var scrollElement = getScrollParent(reference);
    attachToScrollParents(scrollElement, "scroll", state.updateBound, state.scrollParents);
    state.scrollElement = scrollElement;
    state.eventsEnabled = true;
    return state;
  }
  function enableEventListeners() {
    if (!this.state.eventsEnabled) {
      this.state = setupEventListeners(this.reference, this.options, this.state, this.scheduleUpdate);
    }
  }
  function removeEventListeners(reference, state) {
    getWindow(reference).removeEventListener("resize", state.updateBound);
    state.scrollParents.forEach(function (target) {
      target.removeEventListener("scroll", state.updateBound);
    });
    state.updateBound = null;
    state.scrollParents = [];
    state.scrollElement = null;
    state.eventsEnabled = false;
    return state;
  }
  function disableEventListeners() {
    if (this.state.eventsEnabled) {
      cancelAnimationFrame(this.scheduleUpdate);
      this.state = removeEventListeners(this.reference, this.state);
    }
  }
  function isNumeric(n) {
    return n !== "" && !isNaN(parseFloat(n)) && isFinite(n);
  }
  function setStyles(element, styles) {
    Object.keys(styles).forEach(function (prop) {
      var unit = "";
      if (["width", "height", "top", "right", "bottom", "left"].indexOf(prop) !== -1 && isNumeric(styles[prop])) {
        unit = "px";
      }
      element.style[prop] = styles[prop] + unit;
    });
  }
  function setAttributes(element, attributes) {
    Object.keys(attributes).forEach(function (prop) {
      var value = attributes[prop];
      if (value !== false) {
        element.setAttribute(prop, attributes[prop]);
      } else {
        element.removeAttribute(prop);
      }
    });
  }
  function applyStyle(data) {
    setStyles(data.instance.popper, data.styles);
    setAttributes(data.instance.popper, data.attributes);
    if (data.arrowElement && Object.keys(data.arrowStyles).length) {
      setStyles(data.arrowElement, data.arrowStyles);
    }
    return data;
  }
  function applyStyleOnLoad(reference, popper, options, modifierOptions, state) {
    var referenceOffsets = getReferenceOffsets(state, popper, reference);
    var placement = computeAutoPlacement(
      options.placement,
      referenceOffsets,
      popper,
      reference,
      options.modifiers.flip.boundariesElement,
      options.modifiers.flip.padding
    );
    popper.setAttribute("x-placement", placement);
    setStyles(popper, { position: "absolute" });
    return options;
  }
  function computeStyle(data, options) {
    var x = options.x,
      y = options.y;
    var popper = data.offsets.popper;
    var legacyGpuAccelerationOption = find(data.instance.modifiers, function (modifier) {
      return modifier.name === "applyStyle";
    }).gpuAcceleration;
    if (legacyGpuAccelerationOption !== undefined) {
      console.warn(
        "WARNING: `gpuAcceleration` option moved to `computeStyle` modifier and will not be supported in future versions of Popper.js!"
      );
    }
    var gpuAcceleration = legacyGpuAccelerationOption !== undefined ? legacyGpuAccelerationOption : options.gpuAcceleration;
    var offsetParent = getOffsetParent(data.instance.popper);
    var offsetParentRect = getBoundingClientRect(offsetParent);
    var styles = { position: popper.position };
    var offsets = {
      left: Math.floor(popper.left),
      top: Math.floor(popper.top),
      bottom: Math.floor(popper.bottom),
      right: Math.floor(popper.right),
    };
    var sideA = x === "bottom" ? "top" : "bottom";
    var sideB = y === "right" ? "left" : "right";
    var prefixedProperty = getSupportedPropertyName("transform");
    var left = void 0,
      top = void 0;
    if (sideA === "bottom") {
      top = -offsetParentRect.height + offsets.bottom;
    } else {
      top = offsets.top;
    }
    if (sideB === "right") {
      left = -offsetParentRect.width + offsets.right;
    } else {
      left = offsets.left;
    }
    if (gpuAcceleration && prefixedProperty) {
      styles[prefixedProperty] = "translate3d(" + left + "px, " + top + "px, 0)";
      styles[sideA] = 0;
      styles[sideB] = 0;
      styles.willChange = "transform";
    } else {
      var invertTop = sideA === "bottom" ? -1 : 1;
      var invertLeft = sideB === "right" ? -1 : 1;
      styles[sideA] = top * invertTop;
      styles[sideB] = left * invertLeft;
      styles.willChange = sideA + ", " + sideB;
    }
    var attributes = { "x-placement": data.placement };
    data.attributes = _extends({}, attributes, data.attributes);
    data.styles = _extends({}, styles, data.styles);
    data.arrowStyles = _extends({}, data.offsets.arrow, data.arrowStyles);
    return data;
  }
  function isModifierRequired(modifiers, requestingName, requestedName) {
    var requesting = find(modifiers, function (_ref) {
      var name = _ref.name;
      return name === requestingName;
    });
    var isRequired =
      !!requesting &&
      modifiers.some(function (modifier) {
        return modifier.name === requestedName && modifier.enabled && modifier.order < requesting.order;
      });
    if (!isRequired) {
      var _requesting = "`" + requestingName + "`";
      var requested = "`" + requestedName + "`";
      console.warn(
        requested +
          " modifier is required by " +
          _requesting +
          " modifier in order to work, be sure to include it before " +
          _requesting +
          "!"
      );
    }
    return isRequired;
  }
  function arrow(data, options) {
    var _data$offsets$arrow;
    if (!isModifierRequired(data.instance.modifiers, "arrow", "keepTogether")) {
      return data;
    }
    var arrowElement = options.element;
    if (typeof arrowElement === "string") {
      arrowElement = data.instance.popper.querySelector(arrowElement);
      if (!arrowElement) {
        return data;
      }
    } else {
      if (!data.instance.popper.contains(arrowElement)) {
        console.warn("WARNING: `arrow.element` must be child of its popper element!");
        return data;
      }
    }
    var placement = data.placement.split("-")[0];
    var _data$offsets = data.offsets,
      popper = _data$offsets.popper,
      reference = _data$offsets.reference;
    var isVertical = ["left", "right"].indexOf(placement) !== -1;
    var len = isVertical ? "height" : "width";
    var sideCapitalized = isVertical ? "Top" : "Left";
    var side = sideCapitalized.toLowerCase();
    var altSide = isVertical ? "left" : "top";
    var opSide = isVertical ? "bottom" : "right";
    var arrowElementSize = getOuterSizes(arrowElement)[len];
    if (reference[opSide] - arrowElementSize < popper[side]) {
      data.offsets.popper[side] -= popper[side] - (reference[opSide] - arrowElementSize);
    }
    if (reference[side] + arrowElementSize > popper[opSide]) {
      data.offsets.popper[side] += reference[side] + arrowElementSize - popper[opSide];
    }
    data.offsets.popper = getClientRect(data.offsets.popper);
    var center = reference[side] + reference[len] / 2 - arrowElementSize / 2;
    var css = getStyleComputedProperty(data.instance.popper);
    var popperMarginSide = parseFloat(css["margin" + sideCapitalized], 10);
    var popperBorderSide = parseFloat(css["border" + sideCapitalized + "Width"], 10);
    var sideValue = center - data.offsets.popper[side] - popperMarginSide - popperBorderSide;
    sideValue = Math.max(Math.min(popper[len] - arrowElementSize, sideValue), 0);
    data.arrowElement = arrowElement;
    data.offsets.arrow =
      ((_data$offsets$arrow = {}),
      defineProperty(_data$offsets$arrow, side, Math.round(sideValue)),
      defineProperty(_data$offsets$arrow, altSide, ""),
      _data$offsets$arrow);
    return data;
  }
  function getOppositeVariation(variation) {
    if (variation === "end") {
      return "start";
    } else if (variation === "start") {
      return "end";
    }
    return variation;
  }
  var placements = [
    "auto-start",
    "auto",
    "auto-end",
    "top-start",
    "top",
    "top-end",
    "right-start",
    "right",
    "right-end",
    "bottom-end",
    "bottom",
    "bottom-start",
    "left-end",
    "left",
    "left-start",
  ];
  var validPlacements = placements.slice(3);
  function clockwise(placement) {
    var counter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var index = validPlacements.indexOf(placement);
    var arr = validPlacements.slice(index + 1).concat(validPlacements.slice(0, index));
    return counter ? arr.reverse() : arr;
  }
  var BEHAVIORS = { FLIP: "flip", CLOCKWISE: "clockwise", COUNTERCLOCKWISE: "counterclockwise" };
  function flip(data, options) {
    if (isModifierEnabled(data.instance.modifiers, "inner")) {
      return data;
    }
    if (data.flipped && data.placement === data.originalPlacement) {
      return data;
    }
    var boundaries = getBoundaries(data.instance.popper, data.instance.reference, options.padding, options.boundariesElement);
    var placement = data.placement.split("-")[0];
    var placementOpposite = getOppositePlacement(placement);
    var variation = data.placement.split("-")[1] || "";
    var flipOrder = [];
    switch (options.behavior) {
      case BEHAVIORS.FLIP:
        flipOrder = [placement, placementOpposite];
        break;
      case BEHAVIORS.CLOCKWISE:
        flipOrder = clockwise(placement);
        break;
      case BEHAVIORS.COUNTERCLOCKWISE:
        flipOrder = clockwise(placement, true);
        break;
      default:
        flipOrder = options.behavior;
    }
    flipOrder.forEach(function (step, index) {
      if (placement !== step || flipOrder.length === index + 1) {
        return data;
      }
      placement = data.placement.split("-")[0];
      placementOpposite = getOppositePlacement(placement);
      var popperOffsets = data.offsets.popper;
      var refOffsets = data.offsets.reference;
      var floor = Math.floor;
      var overlapsRef =
        (placement === "left" && floor(popperOffsets.right) > floor(refOffsets.left)) ||
        (placement === "right" && floor(popperOffsets.left) < floor(refOffsets.right)) ||
        (placement === "top" && floor(popperOffsets.bottom) > floor(refOffsets.top)) ||
        (placement === "bottom" && floor(popperOffsets.top) < floor(refOffsets.bottom));
      var overflowsLeft = floor(popperOffsets.left) < floor(boundaries.left);
      var overflowsRight = floor(popperOffsets.right) > floor(boundaries.right);
      var overflowsTop = floor(popperOffsets.top) < floor(boundaries.top);
      var overflowsBottom = floor(popperOffsets.bottom) > floor(boundaries.bottom);
      var overflowsBoundaries =
        (placement === "left" && overflowsLeft) ||
        (placement === "right" && overflowsRight) ||
        (placement === "top" && overflowsTop) ||
        (placement === "bottom" && overflowsBottom);
      var isVertical = ["top", "bottom"].indexOf(placement) !== -1;
      var flippedVariation =
        !!options.flipVariations &&
        ((isVertical && variation === "start" && overflowsLeft) ||
          (isVertical && variation === "end" && overflowsRight) ||
          (!isVertical && variation === "start" && overflowsTop) ||
          (!isVertical && variation === "end" && overflowsBottom));
      if (overlapsRef || overflowsBoundaries || flippedVariation) {
        data.flipped = true;
        if (overlapsRef || overflowsBoundaries) {
          placement = flipOrder[index + 1];
        }
        if (flippedVariation) {
          variation = getOppositeVariation(variation);
        }
        data.placement = placement + (variation ? "-" + variation : "");
        data.offsets.popper = _extends(
          {},
          data.offsets.popper,
          getPopperOffsets(data.instance.popper, data.offsets.reference, data.placement)
        );
        data = runModifiers(data.instance.modifiers, data, "flip");
      }
    });
    return data;
  }
  function keepTogether(data) {
    var _data$offsets = data.offsets,
      popper = _data$offsets.popper,
      reference = _data$offsets.reference;
    var placement = data.placement.split("-")[0];
    var floor = Math.floor;
    var isVertical = ["top", "bottom"].indexOf(placement) !== -1;
    var side = isVertical ? "right" : "bottom";
    var opSide = isVertical ? "left" : "top";
    var measurement = isVertical ? "width" : "height";
    if (popper[side] < floor(reference[opSide])) {
      data.offsets.popper[opSide] = floor(reference[opSide]) - popper[measurement];
    }
    if (popper[opSide] > floor(reference[side])) {
      data.offsets.popper[opSide] = floor(reference[side]);
    }
    return data;
  }
  function toValue(str, measurement, popperOffsets, referenceOffsets) {
    var split = str.match(/((?:\-|\+)?\d*\.?\d*)(.*)/);
    var value = +split[1];
    var unit = split[2];
    if (!value) {
      return str;
    }
    if (unit.indexOf("%") === 0) {
      var element = void 0;
      switch (unit) {
        case "%p":
          element = popperOffsets;
          break;
        case "%":
        case "%r":
        default:
          element = referenceOffsets;
      }
      var rect = getClientRect(element);
      return (rect[measurement] / 100) * value;
    } else if (unit === "vh" || unit === "vw") {
      var size = void 0;
      if (unit === "vh") {
        size = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      } else {
        size = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      }
      return (size / 100) * value;
    } else {
      return value;
    }
  }
  function parseOffset(offset, popperOffsets, referenceOffsets, basePlacement) {
    var offsets = [0, 0];
    var useHeight = ["right", "left"].indexOf(basePlacement) !== -1;
    var fragments = offset.split(/(\+|\-)/).map(function (frag) {
      return frag.trim();
    });
    var divider = fragments.indexOf(
      find(fragments, function (frag) {
        return frag.search(/,|\s/) !== -1;
      })
    );
    if (fragments[divider] && fragments[divider].indexOf(",") === -1) {
      console.warn("Offsets separated by white space(s) are deprecated, use a comma (,) instead.");
    }
    var splitRegex = /\s*,\s*|\s+/;
    var ops =
      divider !== -1
        ? [
            fragments.slice(0, divider).concat([fragments[divider].split(splitRegex)[0]]),
            [fragments[divider].split(splitRegex)[1]].concat(fragments.slice(divider + 1)),
          ]
        : [fragments];
    ops = ops.map(function (op, index) {
      var measurement = (index === 1 ? !useHeight : useHeight) ? "height" : "width";
      var mergeWithPrevious = false;
      return op
        .reduce(function (a, b) {
          if (a[a.length - 1] === "" && ["+", "-"].indexOf(b) !== -1) {
            a[a.length - 1] = b;
            mergeWithPrevious = true;
            return a;
          } else if (mergeWithPrevious) {
            a[a.length - 1] += b;
            mergeWithPrevious = false;
            return a;
          } else {
            return a.concat(b);
          }
        }, [])
        .map(function (str) {
          return toValue(str, measurement, popperOffsets, referenceOffsets);
        });
    });
    ops.forEach(function (op, index) {
      op.forEach(function (frag, index2) {
        if (isNumeric(frag)) {
          offsets[index] += frag * (op[index2 - 1] === "-" ? -1 : 1);
        }
      });
    });
    return offsets;
  }
  function offset(data, _ref) {
    var offset = _ref.offset;
    var placement = data.placement,
      _data$offsets = data.offsets,
      popper = _data$offsets.popper,
      reference = _data$offsets.reference;
    var basePlacement = placement.split("-")[0];
    var offsets = void 0;
    if (isNumeric(+offset)) {
      offsets = [+offset, 0];
    } else {
      offsets = parseOffset(offset, popper, reference, basePlacement);
    }
    if (basePlacement === "left") {
      popper.top += offsets[0];
      popper.left -= offsets[1];
    } else if (basePlacement === "right") {
      popper.top += offsets[0];
      popper.left += offsets[1];
    } else if (basePlacement === "top") {
      popper.left += offsets[0];
      popper.top -= offsets[1];
    } else if (basePlacement === "bottom") {
      popper.left += offsets[0];
      popper.top += offsets[1];
    }
    data.popper = popper;
    return data;
  }
  function preventOverflow(data, options) {
    var boundariesElement = options.boundariesElement || getOffsetParent(data.instance.popper);
    if (data.instance.reference === boundariesElement) {
      boundariesElement = getOffsetParent(boundariesElement);
    }
    var boundaries = getBoundaries(data.instance.popper, data.instance.reference, options.padding, boundariesElement);
    options.boundaries = boundaries;
    var order = options.priority;
    var popper = data.offsets.popper;
    var check = {
      primary: function primary(placement) {
        var value = popper[placement];
        if (popper[placement] < boundaries[placement] && !options.escapeWithReference) {
          value = Math.max(popper[placement], boundaries[placement]);
        }
        return defineProperty({}, placement, value);
      },
      secondary: function secondary(placement) {
        var mainSide = placement === "right" ? "left" : "top";
        var value = popper[mainSide];
        if (popper[placement] > boundaries[placement] && !options.escapeWithReference) {
          value = Math.min(popper[mainSide], boundaries[placement] - (placement === "right" ? popper.width : popper.height));
        }
        return defineProperty({}, mainSide, value);
      },
    };
    order.forEach(function (placement) {
      var side = ["left", "top"].indexOf(placement) !== -1 ? "primary" : "secondary";
      popper = _extends({}, popper, check[side](placement));
    });
    data.offsets.popper = popper;
    return data;
  }
  function shift(data) {
    var placement = data.placement;
    var basePlacement = placement.split("-")[0];
    var shiftvariation = placement.split("-")[1];
    if (shiftvariation) {
      var _data$offsets = data.offsets,
        reference = _data$offsets.reference,
        popper = _data$offsets.popper;
      var isVertical = ["bottom", "top"].indexOf(basePlacement) !== -1;
      var side = isVertical ? "left" : "top";
      var measurement = isVertical ? "width" : "height";
      var shiftOffsets = {
        start: defineProperty({}, side, reference[side]),
        end: defineProperty({}, side, reference[side] + reference[measurement] - popper[measurement]),
      };
      data.offsets.popper = _extends({}, popper, shiftOffsets[shiftvariation]);
    }
    return data;
  }
  function hide(data) {
    if (!isModifierRequired(data.instance.modifiers, "hide", "preventOverflow")) {
      return data;
    }
    var refRect = data.offsets.reference;
    var bound = find(data.instance.modifiers, function (modifier) {
      return modifier.name === "preventOverflow";
    }).boundaries;
    if (refRect.bottom < bound.top || refRect.left > bound.right || refRect.top > bound.bottom || refRect.right < bound.left) {
      if (data.hide === true) {
        return data;
      }
      data.hide = true;
      data.attributes["x-out-of-boundaries"] = "";
    } else {
      if (data.hide === false) {
        return data;
      }
      data.hide = false;
      data.attributes["x-out-of-boundaries"] = false;
    }
    return data;
  }
  function inner(data) {
    var placement = data.placement;
    var basePlacement = placement.split("-")[0];
    var _data$offsets = data.offsets,
      popper = _data$offsets.popper,
      reference = _data$offsets.reference;
    var isHoriz = ["left", "right"].indexOf(basePlacement) !== -1;
    var subtractLength = ["top", "left"].indexOf(basePlacement) === -1;
    popper[isHoriz ? "left" : "top"] = reference[basePlacement] - (subtractLength ? popper[isHoriz ? "width" : "height"] : 0);
    data.placement = getOppositePlacement(placement);
    data.offsets.popper = getClientRect(popper);
    return data;
  }
  var modifiers = {
    shift: { order: 100, enabled: true, fn: shift },
    offset: { order: 200, enabled: true, fn: offset, offset: 0 },
    preventOverflow: {
      order: 300,
      enabled: true,
      fn: preventOverflow,
      priority: ["left", "right", "top", "bottom"],
      padding: 5,
      boundariesElement: "scrollParent",
    },
    keepTogether: { order: 400, enabled: true, fn: keepTogether },
    arrow: { order: 500, enabled: true, fn: arrow, element: "[x-arrow]" },
    flip: { order: 600, enabled: true, fn: flip, behavior: "flip", padding: 5, boundariesElement: "viewport" },
    inner: { order: 700, enabled: false, fn: inner },
    hide: { order: 800, enabled: true, fn: hide },
    computeStyle: { order: 850, enabled: true, fn: computeStyle, gpuAcceleration: true, x: "bottom", y: "right" },
    applyStyle: { order: 900, enabled: true, fn: applyStyle, onLoad: applyStyleOnLoad, gpuAcceleration: undefined },
  };
  var Defaults = {
    placement: "bottom",
    eventsEnabled: true,
    removeOnDestroy: false,
    onCreate: function onCreate() {},
    onUpdate: function onUpdate() {},
    modifiers: modifiers,
  };
  var Popper = (function () {
    function Popper(reference, popper) {
      var _this = this;
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      classCallCheck(this, Popper);
      this.scheduleUpdate = function () {
        return requestAnimationFrame(_this.update);
      };
      this.update = debounce(this.update.bind(this));
      this.options = _extends({}, Popper.Defaults, options);
      this.state = { isDestroyed: false, isCreated: false, scrollParents: [] };
      this.reference = reference && reference.jquery ? reference[0] : reference;
      this.popper = popper && popper.jquery ? popper[0] : popper;
      this.options.modifiers = {};
      Object.keys(_extends({}, Popper.Defaults.modifiers, options.modifiers)).forEach(function (name) {
        _this.options.modifiers[name] = _extends(
          {},
          Popper.Defaults.modifiers[name] || {},
          options.modifiers ? options.modifiers[name] : {}
        );
      });
      this.modifiers = Object.keys(this.options.modifiers)
        .map(function (name) {
          return _extends({ name: name }, _this.options.modifiers[name]);
        })
        .sort(function (a, b) {
          return a.order - b.order;
        });
      this.modifiers.forEach(function (modifierOptions) {
        if (modifierOptions.enabled && isFunction(modifierOptions.onLoad)) {
          modifierOptions.onLoad(_this.reference, _this.popper, _this.options, modifierOptions, _this.state);
        }
      });
      this.update();
      var eventsEnabled = this.options.eventsEnabled;
      if (eventsEnabled) {
        this.enableEventListeners();
      }
      this.state.eventsEnabled = eventsEnabled;
    }
    createClass(Popper, [
      {
        key: "update",
        value: function update$$1() {
          return update.call(this);
        },
      },
      {
        key: "destroy",
        value: function destroy$$1() {
          return destroy.call(this);
        },
      },
      {
        key: "enableEventListeners",
        value: function enableEventListeners$$1() {
          return enableEventListeners.call(this);
        },
      },
      {
        key: "disableEventListeners",
        value: function disableEventListeners$$1() {
          return disableEventListeners.call(this);
        },
      },
    ]);
    return Popper;
  })();
  Popper.Utils = (typeof window !== "undefined" ? window : global).PopperUtils;
  Popper.placements = placements;
  Popper.Defaults = Defaults;
  return Popper;
});
/*!
 * Bootstrap v4.0.0-beta (https://getbootstrap.com)
 * Copyright 2011-2017 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 */ if (typeof jQuery === "undefined") {
  throw new Error("Bootstrap's JavaScript requires jQuery. jQuery must be included before Bootstrap's JavaScript.");
}
(function ($) {
  var version = $.fn.jquery.split(" ")[0].split(".");
  if ((version[0] < 2 && version[1] < 9) || (version[0] == 1 && version[1] == 9 && version[2] < 1) || version[0] >= 4) {
    throw new Error("Bootstrap's JavaScript requires at least jQuery v1.9.1 but less than v4.0.0");
  }
})(jQuery);
(function () {
  var _typeof =
    typeof Symbol === "function" && typeof Symbol.iterator === "symbol"
      ? function (obj) {
          return typeof obj;
        }
      : function (obj) {
          return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
        };
  var _createClass = (function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  })();
  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }
  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: { value: subClass, enumerable: false, writable: true, configurable: true },
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : (subClass.__proto__ = superClass);
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  var Util = (function ($) {
    var transition = false;
    var MAX_UID = 1000000;
    var TransitionEndEvent = {
      WebkitTransition: "webkitTransitionEnd",
      MozTransition: "transitionend",
      OTransition: "oTransitionEnd otransitionend",
      transition: "transitionend",
    };
    function toType(obj) {
      return {}.toString
        .call(obj)
        .match(/\s([a-zA-Z]+)/)[1]
        .toLowerCase();
    }
    function isElement(obj) {
      return (obj[0] || obj).nodeType;
    }
    function getSpecialTransitionEndEvent() {
      return {
        bindType: transition.end,
        delegateType: transition.end,
        handle: function handle(event) {
          if ($(event.target).is(this)) {
            return event.handleObj.handler.apply(this, arguments);
          }
          return undefined;
        },
      };
    }
    function transitionEndTest() {
      if (window.QUnit) {
        return false;
      }
      var el = document.createElement("bootstrap");
      for (var name in TransitionEndEvent) {
        if (el.style[name] !== undefined) {
          return { end: TransitionEndEvent[name] };
        }
      }
      return false;
    }
    function transitionEndEmulator(duration) {
      var _this = this;
      var called = false;
      $(this).one(Util.TRANSITION_END, function () {
        called = true;
      });
      setTimeout(function () {
        if (!called) {
          Util.triggerTransitionEnd(_this);
        }
      }, duration);
      return this;
    }
    function setTransitionEndSupport() {
      transition = transitionEndTest();
      $.fn.emulateTransitionEnd = transitionEndEmulator;
      if (Util.supportsTransitionEnd()) {
        $.event.special[Util.TRANSITION_END] = getSpecialTransitionEndEvent();
      }
    }
    var Util = {
      TRANSITION_END: "bsTransitionEnd",
      getUID: function getUID(prefix) {
        do {
          prefix += ~~(Math.random() * MAX_UID);
        } while (document.getElementById(prefix));
        return prefix;
      },
      getSelectorFromElement: function getSelectorFromElement(element) {
        var selector = element.getAttribute("data-target");
        if (!selector || selector === "#") {
          selector = element.getAttribute("href") || "";
        }
        try {
          var $selector = $(selector);
          return $selector.length > 0 ? selector : null;
        } catch (error) {
          return null;
        }
      },
      reflow: function reflow(element) {
        return element.offsetHeight;
      },
      triggerTransitionEnd: function triggerTransitionEnd(element) {
        $(element).trigger(transition.end);
      },
      supportsTransitionEnd: function supportsTransitionEnd() {
        return Boolean(transition);
      },
      typeCheckConfig: function typeCheckConfig(componentName, config, configTypes) {
        for (var property in configTypes) {
          if (configTypes.hasOwnProperty(property)) {
            var expectedTypes = configTypes[property];
            var value = config[property];
            var valueType = value && isElement(value) ? "element" : toType(value);
            if (!new RegExp(expectedTypes).test(valueType)) {
              throw new Error(
                componentName.toUpperCase() +
                  ": " +
                  ('Option "' + property + '" provided type "' + valueType + '" ') +
                  ('but expected type "' + expectedTypes + '".')
              );
            }
          }
        }
      },
    };
    setTransitionEndSupport();
    return Util;
  })(jQuery);
  var Alert = (function ($) {
    var NAME = "alert";
    var VERSION = "4.0.0-beta";
    var DATA_KEY = "bs.alert";
    var EVENT_KEY = "." + DATA_KEY;
    var DATA_API_KEY = ".data-api";
    var JQUERY_NO_CONFLICT = $.fn[NAME];
    var TRANSITION_DURATION = 150;
    var Selector = { DISMISS: '[data-dismiss="alert"]' };
    var Event = { CLOSE: "close" + EVENT_KEY, CLOSED: "closed" + EVENT_KEY, CLICK_DATA_API: "click" + EVENT_KEY + DATA_API_KEY };
    var ClassName = { ALERT: "alert", FADE: "fade", SHOW: "show" };
    var Alert = (function () {
      function Alert(element) {
        _classCallCheck(this, Alert);
        this._element = element;
      }
      Alert.prototype.close = function close(element) {
        element = element || this._element;
        var rootElement = this._getRootElement(element);
        var customEvent = this._triggerCloseEvent(rootElement);
        if (customEvent.isDefaultPrevented()) {
          return;
        }
        this._removeElement(rootElement);
      };
      Alert.prototype.dispose = function dispose() {
        $.removeData(this._element, DATA_KEY);
        this._element = null;
      };
      Alert.prototype._getRootElement = function _getRootElement(element) {
        var selector = Util.getSelectorFromElement(element);
        var parent = false;
        if (selector) {
          parent = $(selector)[0];
        }
        if (!parent) {
          parent = $(element).closest("." + ClassName.ALERT)[0];
        }
        return parent;
      };
      Alert.prototype._triggerCloseEvent = function _triggerCloseEvent(element) {
        var closeEvent = $.Event(Event.CLOSE);
        $(element).trigger(closeEvent);
        return closeEvent;
      };
      Alert.prototype._removeElement = function _removeElement(element) {
        var _this2 = this;
        $(element).removeClass(ClassName.SHOW);
        if (!Util.supportsTransitionEnd() || !$(element).hasClass(ClassName.FADE)) {
          this._destroyElement(element);
          return;
        }
        $(element)
          .one(Util.TRANSITION_END, function (event) {
            return _this2._destroyElement(element, event);
          })
          .emulateTransitionEnd(TRANSITION_DURATION);
      };
      Alert.prototype._destroyElement = function _destroyElement(element) {
        $(element).detach().trigger(Event.CLOSED).remove();
      };
      Alert._jQueryInterface = function _jQueryInterface(config) {
        return this.each(function () {
          var $element = $(this);
          var data = $element.data(DATA_KEY);
          if (!data) {
            data = new Alert(this);
            $element.data(DATA_KEY, data);
          }
          if (config === "close") {
            data[config](this);
          }
        });
      };
      Alert._handleDismiss = function _handleDismiss(alertInstance) {
        return function (event) {
          if (event) {
            event.preventDefault();
          }
          alertInstance.close(this);
        };
      };
      _createClass(Alert, null, [
        {
          key: "VERSION",
          get: function get() {
            return VERSION;
          },
        },
      ]);
      return Alert;
    })();
    $(document).on(Event.CLICK_DATA_API, Selector.DISMISS, Alert._handleDismiss(new Alert()));
    $.fn[NAME] = Alert._jQueryInterface;
    $.fn[NAME].Constructor = Alert;
    $.fn[NAME].noConflict = function () {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Alert._jQueryInterface;
    };
    return Alert;
  })(jQuery);
  var Button = (function ($) {
    var NAME = "button";
    var VERSION = "4.0.0-beta";
    var DATA_KEY = "bs.button";
    var EVENT_KEY = "." + DATA_KEY;
    var DATA_API_KEY = ".data-api";
    var JQUERY_NO_CONFLICT = $.fn[NAME];
    var ClassName = { ACTIVE: "active", BUTTON: "btn", FOCUS: "focus" };
    var Selector = {
      DATA_TOGGLE_CARROT: '[data-toggle^="button"]',
      DATA_TOGGLE: '[data-toggle="buttons"]',
      INPUT: "input",
      ACTIVE: ".active",
      BUTTON: ".btn",
    };
    var Event = {
      CLICK_DATA_API: "click" + EVENT_KEY + DATA_API_KEY,
      FOCUS_BLUR_DATA_API: "focus" + EVENT_KEY + DATA_API_KEY + " " + ("blur" + EVENT_KEY + DATA_API_KEY),
    };
    var Button = (function () {
      function Button(element) {
        _classCallCheck(this, Button);
        this._element = element;
      }
      Button.prototype.toggle = function toggle() {
        var triggerChangeEvent = true;
        var addAriaPressed = true;
        var rootElement = $(this._element).closest(Selector.DATA_TOGGLE)[0];
        if (rootElement) {
          var input = $(this._element).find(Selector.INPUT)[0];
          if (input) {
            if (input.type === "radio") {
              if (input.checked && $(this._element).hasClass(ClassName.ACTIVE)) {
                triggerChangeEvent = false;
              } else {
                var activeElement = $(rootElement).find(Selector.ACTIVE)[0];
                if (activeElement) {
                  $(activeElement).removeClass(ClassName.ACTIVE);
                }
              }
            }
            if (triggerChangeEvent) {
              if (
                input.hasAttribute("disabled") ||
                rootElement.hasAttribute("disabled") ||
                input.classList.contains("disabled") ||
                rootElement.classList.contains("disabled")
              ) {
                return;
              }
              input.checked = !$(this._element).hasClass(ClassName.ACTIVE);
              $(input).trigger("change");
            }
            input.focus();
            addAriaPressed = false;
          }
        }
        if (addAriaPressed) {
          this._element.setAttribute("aria-pressed", !$(this._element).hasClass(ClassName.ACTIVE));
        }
        if (triggerChangeEvent) {
          $(this._element).toggleClass(ClassName.ACTIVE);
        }
      };
      Button.prototype.dispose = function dispose() {
        $.removeData(this._element, DATA_KEY);
        this._element = null;
      };
      Button._jQueryInterface = function _jQueryInterface(config) {
        return this.each(function () {
          var data = $(this).data(DATA_KEY);
          if (!data) {
            data = new Button(this);
            $(this).data(DATA_KEY, data);
          }
          if (config === "toggle") {
            data[config]();
          }
        });
      };
      _createClass(Button, null, [
        {
          key: "VERSION",
          get: function get() {
            return VERSION;
          },
        },
      ]);
      return Button;
    })();
    $(document)
      .on(Event.CLICK_DATA_API, Selector.DATA_TOGGLE_CARROT, function (event) {
        event.preventDefault();
        var button = event.target;
        if (!$(button).hasClass(ClassName.BUTTON)) {
          button = $(button).closest(Selector.BUTTON);
        }
        Button._jQueryInterface.call($(button), "toggle");
      })
      .on(Event.FOCUS_BLUR_DATA_API, Selector.DATA_TOGGLE_CARROT, function (event) {
        var button = $(event.target).closest(Selector.BUTTON)[0];
        $(button).toggleClass(ClassName.FOCUS, /^focus(in)?$/.test(event.type));
      });
    $.fn[NAME] = Button._jQueryInterface;
    $.fn[NAME].Constructor = Button;
    $.fn[NAME].noConflict = function () {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Button._jQueryInterface;
    };
    return Button;
  })(jQuery);
  var Carousel = (function ($) {
    var NAME = "carousel";
    var VERSION = "4.0.0-beta";
    var DATA_KEY = "bs.carousel";
    var EVENT_KEY = "." + DATA_KEY;
    var DATA_API_KEY = ".data-api";
    var JQUERY_NO_CONFLICT = $.fn[NAME];
    var TRANSITION_DURATION = 600;
    var ARROW_LEFT_KEYCODE = 37;
    var ARROW_RIGHT_KEYCODE = 39;
    var TOUCHEVENT_COMPAT_WAIT = 500;
    var Default = { interval: 5000, keyboard: true, slide: false, pause: "hover", wrap: true };
    var DefaultType = {
      interval: "(number|boolean)",
      keyboard: "boolean",
      slide: "(boolean|string)",
      pause: "(string|boolean)",
      wrap: "boolean",
    };
    var Direction = { NEXT: "next", PREV: "prev", LEFT: "left", RIGHT: "right" };
    var Event = {
      SLIDE: "slide" + EVENT_KEY,
      SLID: "slid" + EVENT_KEY,
      KEYDOWN: "keydown" + EVENT_KEY,
      MOUSEENTER: "mouseenter" + EVENT_KEY,
      MOUSELEAVE: "mouseleave" + EVENT_KEY,
      TOUCHEND: "touchend" + EVENT_KEY,
      LOAD_DATA_API: "load" + EVENT_KEY + DATA_API_KEY,
      CLICK_DATA_API: "click" + EVENT_KEY + DATA_API_KEY,
    };
    var ClassName = {
      CAROUSEL: "carousel",
      ACTIVE: "active",
      SLIDE: "slide",
      RIGHT: "carousel-item-right",
      LEFT: "carousel-item-left",
      NEXT: "carousel-item-next",
      PREV: "carousel-item-prev",
      ITEM: "carousel-item",
    };
    var Selector = {
      ACTIVE: ".active",
      ACTIVE_ITEM: ".active.carousel-item",
      ITEM: ".carousel-item",
      NEXT_PREV: ".carousel-item-next, .carousel-item-prev",
      INDICATORS: ".carousel-indicators",
      DATA_SLIDE: "[data-slide], [data-slide-to]",
      DATA_RIDE: '[data-ride="carousel"]',
    };
    var Carousel = (function () {
      function Carousel(element, config) {
        _classCallCheck(this, Carousel);
        this._items = null;
        this._interval = null;
        this._activeElement = null;
        this._isPaused = false;
        this._isSliding = false;
        this.touchTimeout = null;
        this._config = this._getConfig(config);
        this._element = $(element)[0];
        this._indicatorsElement = $(this._element).find(Selector.INDICATORS)[0];
        this._addEventListeners();
      }
      Carousel.prototype.next = function next() {
        if (!this._isSliding) {
          this._slide(Direction.NEXT);
        }
      };
      Carousel.prototype.nextWhenVisible = function nextWhenVisible() {
        if (!document.hidden) {
          this.next();
        }
      };
      Carousel.prototype.prev = function prev() {
        if (!this._isSliding) {
          this._slide(Direction.PREV);
        }
      };
      Carousel.prototype.pause = function pause(event) {
        if (!event) {
          this._isPaused = true;
        }
        if ($(this._element).find(Selector.NEXT_PREV)[0] && Util.supportsTransitionEnd()) {
          Util.triggerTransitionEnd(this._element);
          this.cycle(true);
        }
        clearInterval(this._interval);
        this._interval = null;
      };
      Carousel.prototype.cycle = function cycle(event) {
        if (!event) {
          this._isPaused = false;
        }
        if (this._interval) {
          clearInterval(this._interval);
          this._interval = null;
        }
        if (this._config.interval && !this._isPaused) {
          this._interval = setInterval((document.visibilityState ? this.nextWhenVisible : this.next).bind(this), this._config.interval);
        }
      };
      Carousel.prototype.to = function to(index) {
        var _this3 = this;
        this._activeElement = $(this._element).find(Selector.ACTIVE_ITEM)[0];
        var activeIndex = this._getItemIndex(this._activeElement);
        if (index > this._items.length - 1 || index < 0) {
          return;
        }
        if (this._isSliding) {
          $(this._element).one(Event.SLID, function () {
            return _this3.to(index);
          });
          return;
        }
        if (activeIndex === index) {
          this.pause();
          this.cycle();
          return;
        }
        var direction = index > activeIndex ? Direction.NEXT : Direction.PREV;
        this._slide(direction, this._items[index]);
      };
      Carousel.prototype.dispose = function dispose() {
        $(this._element).off(EVENT_KEY);
        $.removeData(this._element, DATA_KEY);
        this._items = null;
        this._config = null;
        this._element = null;
        this._interval = null;
        this._isPaused = null;
        this._isSliding = null;
        this._activeElement = null;
        this._indicatorsElement = null;
      };
      Carousel.prototype._getConfig = function _getConfig(config) {
        config = $.extend({}, Default, config);
        Util.typeCheckConfig(NAME, config, DefaultType);
        return config;
      };
      Carousel.prototype._addEventListeners = function _addEventListeners() {
        var _this4 = this;
        if (this._config.keyboard) {
          $(this._element).on(Event.KEYDOWN, function (event) {
            return _this4._keydown(event);
          });
        }
        if (this._config.pause === "hover") {
          $(this._element)
            .on(Event.MOUSEENTER, function (event) {
              return _this4.pause(event);
            })
            .on(Event.MOUSELEAVE, function (event) {
              return _this4.cycle(event);
            });
          if ("ontouchstart" in document.documentElement) {
            $(this._element).on(Event.TOUCHEND, function () {
              _this4.pause();
              if (_this4.touchTimeout) {
                clearTimeout(_this4.touchTimeout);
              }
              _this4.touchTimeout = setTimeout(function (event) {
                return _this4.cycle(event);
              }, TOUCHEVENT_COMPAT_WAIT + _this4._config.interval);
            });
          }
        }
      };
      Carousel.prototype._keydown = function _keydown(event) {
        if (/input|textarea/i.test(event.target.tagName)) {
          return;
        }
        switch (event.which) {
          case ARROW_LEFT_KEYCODE:
            event.preventDefault();
            this.prev();
            break;
          case ARROW_RIGHT_KEYCODE:
            event.preventDefault();
            this.next();
            break;
          default:
            return;
        }
      };
      Carousel.prototype._getItemIndex = function _getItemIndex(element) {
        this._items = $.makeArray($(element).parent().find(Selector.ITEM));
        return this._items.indexOf(element);
      };
      Carousel.prototype._getItemByDirection = function _getItemByDirection(direction, activeElement) {
        var isNextDirection = direction === Direction.NEXT;
        var isPrevDirection = direction === Direction.PREV;
        var activeIndex = this._getItemIndex(activeElement);
        var lastItemIndex = this._items.length - 1;
        var isGoingToWrap = (isPrevDirection && activeIndex === 0) || (isNextDirection && activeIndex === lastItemIndex);
        if (isGoingToWrap && !this._config.wrap) {
          return activeElement;
        }
        var delta = direction === Direction.PREV ? -1 : 1;
        var itemIndex = (activeIndex + delta) % this._items.length;
        return itemIndex === -1 ? this._items[this._items.length - 1] : this._items[itemIndex];
      };
      Carousel.prototype._triggerSlideEvent = function _triggerSlideEvent(relatedTarget, eventDirectionName) {
        var targetIndex = this._getItemIndex(relatedTarget);
        var fromIndex = this._getItemIndex($(this._element).find(Selector.ACTIVE_ITEM)[0]);
        var slideEvent = $.Event(Event.SLIDE, {
          relatedTarget: relatedTarget,
          direction: eventDirectionName,
          from: fromIndex,
          to: targetIndex,
        });
        $(this._element).trigger(slideEvent);
        return slideEvent;
      };
      Carousel.prototype._setActiveIndicatorElement = function _setActiveIndicatorElement(element) {
        if (this._indicatorsElement) {
          $(this._indicatorsElement).find(Selector.ACTIVE).removeClass(ClassName.ACTIVE);
          var nextIndicator = this._indicatorsElement.children[this._getItemIndex(element)];
          if (nextIndicator) {
            $(nextIndicator).addClass(ClassName.ACTIVE);
          }
        }
      };
      Carousel.prototype._slide = function _slide(direction, element) {
        var _this5 = this;
        var activeElement = $(this._element).find(Selector.ACTIVE_ITEM)[0];
        var activeElementIndex = this._getItemIndex(activeElement);
        var nextElement = element || (activeElement && this._getItemByDirection(direction, activeElement));
        var nextElementIndex = this._getItemIndex(nextElement);
        var isCycling = Boolean(this._interval);
        var directionalClassName = void 0;
        var orderClassName = void 0;
        var eventDirectionName = void 0;
        if (direction === Direction.NEXT) {
          directionalClassName = ClassName.LEFT;
          orderClassName = ClassName.NEXT;
          eventDirectionName = Direction.LEFT;
        } else {
          directionalClassName = ClassName.RIGHT;
          orderClassName = ClassName.PREV;
          eventDirectionName = Direction.RIGHT;
        }
        if (nextElement && $(nextElement).hasClass(ClassName.ACTIVE)) {
          this._isSliding = false;
          return;
        }
        var slideEvent = this._triggerSlideEvent(nextElement, eventDirectionName);
        if (slideEvent.isDefaultPrevented()) {
          return;
        }
        if (!activeElement || !nextElement) {
          return;
        }
        this._isSliding = true;
        if (isCycling) {
          this.pause();
        }
        this._setActiveIndicatorElement(nextElement);
        var slidEvent = $.Event(Event.SLID, {
          relatedTarget: nextElement,
          direction: eventDirectionName,
          from: activeElementIndex,
          to: nextElementIndex,
        });
        if (Util.supportsTransitionEnd() && $(this._element).hasClass(ClassName.SLIDE)) {
          $(nextElement).addClass(orderClassName);
          Util.reflow(nextElement);
          $(activeElement).addClass(directionalClassName);
          $(nextElement).addClass(directionalClassName);
          $(activeElement)
            .one(Util.TRANSITION_END, function () {
              $(nextElement)
                .removeClass(directionalClassName + " " + orderClassName)
                .addClass(ClassName.ACTIVE);
              $(activeElement).removeClass(ClassName.ACTIVE + " " + orderClassName + " " + directionalClassName);
              _this5._isSliding = false;
              setTimeout(function () {
                return $(_this5._element).trigger(slidEvent);
              }, 0);
            })
            .emulateTransitionEnd(TRANSITION_DURATION);
        } else {
          $(activeElement).removeClass(ClassName.ACTIVE);
          $(nextElement).addClass(ClassName.ACTIVE);
          this._isSliding = false;
          $(this._element).trigger(slidEvent);
        }
        if (isCycling) {
          this.cycle();
        }
      };
      Carousel._jQueryInterface = function _jQueryInterface(config) {
        return this.each(function () {
          var data = $(this).data(DATA_KEY);
          var _config = $.extend({}, Default, $(this).data());
          if ((typeof config === "undefined" ? "undefined" : _typeof(config)) === "object") {
            $.extend(_config, config);
          }
          var action = typeof config === "string" ? config : _config.slide;
          if (!data) {
            data = new Carousel(this, _config);
            $(this).data(DATA_KEY, data);
          }
          if (typeof config === "number") {
            data.to(config);
          } else if (typeof action === "string") {
            if (data[action] === undefined) {
              throw new Error('No method named "' + action + '"');
            }
            data[action]();
          } else if (_config.interval) {
            data.pause();
            data.cycle();
          }
        });
      };
      Carousel._dataApiClickHandler = function _dataApiClickHandler(event) {
        var selector = Util.getSelectorFromElement(this);
        if (!selector) {
          return;
        }
        var target = $(selector)[0];
        if (!target || !$(target).hasClass(ClassName.CAROUSEL)) {
          return;
        }
        var config = $.extend({}, $(target).data(), $(this).data());
        var slideIndex = this.getAttribute("data-slide-to");
        if (slideIndex) {
          config.interval = false;
        }
        Carousel._jQueryInterface.call($(target), config);
        if (slideIndex) {
          $(target).data(DATA_KEY).to(slideIndex);
        }
        event.preventDefault();
      };
      _createClass(Carousel, null, [
        {
          key: "VERSION",
          get: function get() {
            return VERSION;
          },
        },
        {
          key: "Default",
          get: function get() {
            return Default;
          },
        },
      ]);
      return Carousel;
    })();
    $(document).on(Event.CLICK_DATA_API, Selector.DATA_SLIDE, Carousel._dataApiClickHandler);
    $(window).on(Event.LOAD_DATA_API, function () {
      $(Selector.DATA_RIDE).each(function () {
        var $carousel = $(this);
        Carousel._jQueryInterface.call($carousel, $carousel.data());
      });
    });
    $.fn[NAME] = Carousel._jQueryInterface;
    $.fn[NAME].Constructor = Carousel;
    $.fn[NAME].noConflict = function () {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Carousel._jQueryInterface;
    };
    return Carousel;
  })(jQuery);
  var Collapse = (function ($) {
    var NAME = "collapse";
    var VERSION = "4.0.0-beta";
    var DATA_KEY = "bs.collapse";
    var EVENT_KEY = "." + DATA_KEY;
    var DATA_API_KEY = ".data-api";
    var JQUERY_NO_CONFLICT = $.fn[NAME];
    var TRANSITION_DURATION = 600;
    var Default = { toggle: true, parent: "" };
    var DefaultType = { toggle: "boolean", parent: "string" };
    var Event = {
      SHOW: "show" + EVENT_KEY,
      SHOWN: "shown" + EVENT_KEY,
      HIDE: "hide" + EVENT_KEY,
      HIDDEN: "hidden" + EVENT_KEY,
      CLICK_DATA_API: "click" + EVENT_KEY + DATA_API_KEY,
    };
    var ClassName = { SHOW: "show", COLLAPSE: "collapse", COLLAPSING: "collapsing", COLLAPSED: "collapsed" };
    var Dimension = { WIDTH: "width", HEIGHT: "height" };
    var Selector = { ACTIVES: ".show, .collapsing", DATA_TOGGLE: '[data-toggle="collapse"]' };
    var Collapse = (function () {
      function Collapse(element, config) {
        _classCallCheck(this, Collapse);
        this._isTransitioning = false;
        this._element = element;
        this._config = this._getConfig(config);
        this._triggerArray = $.makeArray(
          $('[data-toggle="collapse"][href="#' + element.id + '"],' + ('[data-toggle="collapse"][data-target="#' + element.id + '"]'))
        );
        var tabToggles = $(Selector.DATA_TOGGLE);
        for (var i = 0; i < tabToggles.length; i++) {
          var elem = tabToggles[i];
          var selector = Util.getSelectorFromElement(elem);
          if (selector !== null && $(selector).filter(element).length > 0) {
            this._triggerArray.push(elem);
          }
        }
        this._parent = this._config.parent ? this._getParent() : null;
        if (!this._config.parent) {
          this._addAriaAndCollapsedClass(this._element, this._triggerArray);
        }
        if (this._config.toggle) {
          this.toggle();
        }
      }
      Collapse.prototype.toggle = function toggle() {
        if ($(this._element).hasClass(ClassName.SHOW)) {
          this.hide();
        } else {
          this.show();
        }
      };
      Collapse.prototype.show = function show() {
        var _this6 = this;
        if (this._isTransitioning || $(this._element).hasClass(ClassName.SHOW)) {
          return;
        }
        var actives = void 0;
        var activesData = void 0;
        if (this._parent) {
          actives = $.makeArray($(this._parent).children().children(Selector.ACTIVES));
          if (!actives.length) {
            actives = null;
          }
        }
        if (actives) {
          activesData = $(actives).data(DATA_KEY);
          if (activesData && activesData._isTransitioning) {
            return;
          }
        }
        var startEvent = $.Event(Event.SHOW);
        $(this._element).trigger(startEvent);
        if (startEvent.isDefaultPrevented()) {
          return;
        }
        if (actives) {
          Collapse._jQueryInterface.call($(actives), "hide");
          if (!activesData) {
            $(actives).data(DATA_KEY, null);
          }
        }
        var dimension = this._getDimension();
        $(this._element).removeClass(ClassName.COLLAPSE).addClass(ClassName.COLLAPSING);
        this._element.style[dimension] = 0;
        if (this._triggerArray.length) {
          $(this._triggerArray).removeClass(ClassName.COLLAPSED).attr("aria-expanded", true);
        }
        this.setTransitioning(true);
        var complete = function complete() {
          $(_this6._element).removeClass(ClassName.COLLAPSING).addClass(ClassName.COLLAPSE).addClass(ClassName.SHOW);
          _this6._element.style[dimension] = "";
          _this6.setTransitioning(false);
          $(_this6._element).trigger(Event.SHOWN);
        };
        if (!Util.supportsTransitionEnd()) {
          complete();
          return;
        }
        var capitalizedDimension = dimension[0].toUpperCase() + dimension.slice(1);
        var scrollSize = "scroll" + capitalizedDimension;
        $(this._element).one(Util.TRANSITION_END, complete).emulateTransitionEnd(TRANSITION_DURATION);
        this._element.style[dimension] = this._element[scrollSize] + "px";
      };
      Collapse.prototype.hide = function hide() {
        var _this7 = this;
        if (this._isTransitioning || !$(this._element).hasClass(ClassName.SHOW)) {
          return;
        }
        var startEvent = $.Event(Event.HIDE);
        $(this._element).trigger(startEvent);
        if (startEvent.isDefaultPrevented()) {
          return;
        }
        var dimension = this._getDimension();
        this._element.style[dimension] = this._element.getBoundingClientRect()[dimension] + "px";
        Util.reflow(this._element);
        $(this._element).addClass(ClassName.COLLAPSING).removeClass(ClassName.COLLAPSE).removeClass(ClassName.SHOW);
        if (this._triggerArray.length) {
          for (var i = 0; i < this._triggerArray.length; i++) {
            var trigger = this._triggerArray[i];
            var selector = Util.getSelectorFromElement(trigger);
            if (selector !== null) {
              var $elem = $(selector);
              if (!$elem.hasClass(ClassName.SHOW)) {
                $(trigger).addClass(ClassName.COLLAPSED).attr("aria-expanded", false);
              }
            }
          }
        }
        this.setTransitioning(true);
        var complete = function complete() {
          _this7.setTransitioning(false);
          $(_this7._element).removeClass(ClassName.COLLAPSING).addClass(ClassName.COLLAPSE).trigger(Event.HIDDEN);
        };
        this._element.style[dimension] = "";
        if (!Util.supportsTransitionEnd()) {
          complete();
          return;
        }
        $(this._element).one(Util.TRANSITION_END, complete).emulateTransitionEnd(TRANSITION_DURATION);
      };
      Collapse.prototype.setTransitioning = function setTransitioning(isTransitioning) {
        this._isTransitioning = isTransitioning;
      };
      Collapse.prototype.dispose = function dispose() {
        $.removeData(this._element, DATA_KEY);
        this._config = null;
        this._parent = null;
        this._element = null;
        this._triggerArray = null;
        this._isTransitioning = null;
      };
      Collapse.prototype._getConfig = function _getConfig(config) {
        config = $.extend({}, Default, config);
        config.toggle = Boolean(config.toggle);
        Util.typeCheckConfig(NAME, config, DefaultType);
        return config;
      };
      Collapse.prototype._getDimension = function _getDimension() {
        var hasWidth = $(this._element).hasClass(Dimension.WIDTH);
        return hasWidth ? Dimension.WIDTH : Dimension.HEIGHT;
      };
      Collapse.prototype._getParent = function _getParent() {
        var _this8 = this;
        var parent = $(this._config.parent)[0];
        var selector = '[data-toggle="collapse"][data-parent="' + this._config.parent + '"]';
        $(parent)
          .find(selector)
          .each(function (i, element) {
            _this8._addAriaAndCollapsedClass(Collapse._getTargetFromElement(element), [element]);
          });
        return parent;
      };
      Collapse.prototype._addAriaAndCollapsedClass = function _addAriaAndCollapsedClass(element, triggerArray) {
        if (element) {
          var isOpen = $(element).hasClass(ClassName.SHOW);
          if (triggerArray.length) {
            $(triggerArray).toggleClass(ClassName.COLLAPSED, !isOpen).attr("aria-expanded", isOpen);
          }
        }
      };
      Collapse._getTargetFromElement = function _getTargetFromElement(element) {
        var selector = Util.getSelectorFromElement(element);
        return selector ? $(selector)[0] : null;
      };
      Collapse._jQueryInterface = function _jQueryInterface(config) {
        return this.each(function () {
          var $this = $(this);
          var data = $this.data(DATA_KEY);
          var _config = $.extend(
            {},
            Default,
            $this.data(),
            (typeof config === "undefined" ? "undefined" : _typeof(config)) === "object" && config
          );
          if (!data && _config.toggle && /show|hide/.test(config)) {
            _config.toggle = false;
          }
          if (!data) {
            data = new Collapse(this, _config);
            $this.data(DATA_KEY, data);
          }
          if (typeof config === "string") {
            if (data[config] === undefined) {
              throw new Error('No method named "' + config + '"');
            }
            data[config]();
          }
        });
      };
      _createClass(Collapse, null, [
        {
          key: "VERSION",
          get: function get() {
            return VERSION;
          },
        },
        {
          key: "Default",
          get: function get() {
            return Default;
          },
        },
      ]);
      return Collapse;
    })();
    $(document).on(Event.CLICK_DATA_API, Selector.DATA_TOGGLE, function (event) {
      if (!/input|textarea/i.test(event.target.tagName)) {
        event.preventDefault();
      }
      var $trigger = $(this);
      var selector = Util.getSelectorFromElement(this);
      $(selector).each(function () {
        var $target = $(this);
        var data = $target.data(DATA_KEY);
        var config = data ? "toggle" : $trigger.data();
        Collapse._jQueryInterface.call($target, config);
      });
    });
    $.fn[NAME] = Collapse._jQueryInterface;
    $.fn[NAME].Constructor = Collapse;
    $.fn[NAME].noConflict = function () {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Collapse._jQueryInterface;
    };
    return Collapse;
  })(jQuery);
  var Dropdown = (function ($) {
    if (typeof Popper === "undefined") {
      throw new Error("Bootstrap dropdown require Popper.js (https://popper.js.org)");
    }
    var NAME = "dropdown";
    var VERSION = "4.0.0-beta";
    var DATA_KEY = "bs.dropdown";
    var EVENT_KEY = "." + DATA_KEY;
    var DATA_API_KEY = ".data-api";
    var JQUERY_NO_CONFLICT = $.fn[NAME];
    var ESCAPE_KEYCODE = 27;
    var SPACE_KEYCODE = 32;
    var TAB_KEYCODE = 9;
    var ARROW_UP_KEYCODE = 38;
    var ARROW_DOWN_KEYCODE = 40;
    var RIGHT_MOUSE_BUTTON_WHICH = 3;
    var REGEXP_KEYDOWN = new RegExp(ARROW_UP_KEYCODE + "|" + ARROW_DOWN_KEYCODE + "|" + ESCAPE_KEYCODE);
    var Event = {
      HIDE: "hide" + EVENT_KEY,
      HIDDEN: "hidden" + EVENT_KEY,
      SHOW: "show" + EVENT_KEY,
      SHOWN: "shown" + EVENT_KEY,
      CLICK: "click" + EVENT_KEY,
      CLICK_DATA_API: "click" + EVENT_KEY + DATA_API_KEY,
      KEYDOWN_DATA_API: "keydown" + EVENT_KEY + DATA_API_KEY,
      KEYUP_DATA_API: "keyup" + EVENT_KEY + DATA_API_KEY,
    };
    var ClassName = {
      DISABLED: "disabled",
      SHOW: "show",
      DROPUP: "dropup",
      MENURIGHT: "dropdown-menu-right",
      MENULEFT: "dropdown-menu-left",
    };
    var Selector = {
      DATA_TOGGLE: '[data-toggle="dropdown"]',
      FORM_CHILD: ".dropdown form",
      MENU: ".dropdown-menu",
      NAVBAR_NAV: ".navbar-nav",
      VISIBLE_ITEMS: ".dropdown-menu .dropdown-item:not(.disabled)",
    };
    var AttachmentMap = { TOP: "top-start", TOPEND: "top-end", BOTTOM: "bottom-start", BOTTOMEND: "bottom-end" };
    var Default = { placement: AttachmentMap.BOTTOM, offset: 0, flip: true };
    var DefaultType = { placement: "string", offset: "(number|string)", flip: "boolean" };
    var Dropdown = (function () {
      function Dropdown(element, config) {
        _classCallCheck(this, Dropdown);
        this._element = element;
        this._popper = null;
        this._config = this._getConfig(config);
        this._menu = this._getMenuElement();
        this._inNavbar = this._detectNavbar();
        this._addEventListeners();
      }
      Dropdown.prototype.toggle = function toggle() {
        if (this._element.disabled || $(this._element).hasClass(ClassName.DISABLED)) {
          return;
        }
        var parent = Dropdown._getParentFromElement(this._element);
        var isActive = $(this._menu).hasClass(ClassName.SHOW);
        Dropdown._clearMenus();
        if (isActive) {
          return;
        }
        var relatedTarget = { relatedTarget: this._element };
        var showEvent = $.Event(Event.SHOW, relatedTarget);
        $(parent).trigger(showEvent);
        if (showEvent.isDefaultPrevented()) {
          return;
        }
        var element = this._element;
        if ($(parent).hasClass(ClassName.DROPUP)) {
          if ($(this._menu).hasClass(ClassName.MENULEFT) || $(this._menu).hasClass(ClassName.MENURIGHT)) {
            element = parent;
          }
        }
        this._popper = new Popper(element, this._menu, this._getPopperConfig());
        if ("ontouchstart" in document.documentElement && !$(parent).closest(Selector.NAVBAR_NAV).length) {
          $("body").children().on("mouseover", null, $.noop);
        }
        this._element.focus();
        this._element.setAttribute("aria-expanded", true);
        $(this._menu).toggleClass(ClassName.SHOW);
        $(parent).toggleClass(ClassName.SHOW).trigger($.Event(Event.SHOWN, relatedTarget));
      };
      Dropdown.prototype.dispose = function dispose() {
        $.removeData(this._element, DATA_KEY);
        $(this._element).off(EVENT_KEY);
        this._element = null;
        this._menu = null;
        if (this._popper !== null) {
          this._popper.destroy();
        }
        this._popper = null;
      };
      Dropdown.prototype.update = function update() {
        this._inNavbar = this._detectNavbar();
        if (this._popper !== null) {
          this._popper.scheduleUpdate();
        }
      };
      Dropdown.prototype._addEventListeners = function _addEventListeners() {
        var _this9 = this;
        $(this._element).on(Event.CLICK, function (event) {
          event.preventDefault();
          event.stopPropagation();
          _this9.toggle();
        });
      };
      Dropdown.prototype._getConfig = function _getConfig(config) {
        var elementData = $(this._element).data();
        if (elementData.placement !== undefined) {
          elementData.placement = AttachmentMap[elementData.placement.toUpperCase()];
        }
        config = $.extend({}, this.constructor.Default, $(this._element).data(), config);
        Util.typeCheckConfig(NAME, config, this.constructor.DefaultType);
        return config;
      };
      Dropdown.prototype._getMenuElement = function _getMenuElement() {
        if (!this._menu) {
          var parent = Dropdown._getParentFromElement(this._element);
          this._menu = $(parent).find(Selector.MENU)[0];
        }
        return this._menu;
      };
      Dropdown.prototype._getPlacement = function _getPlacement() {
        var $parentDropdown = $(this._element).parent();
        var placement = this._config.placement;
        if ($parentDropdown.hasClass(ClassName.DROPUP) || this._config.placement === AttachmentMap.TOP) {
          placement = AttachmentMap.TOP;
          if ($(this._menu).hasClass(ClassName.MENURIGHT)) {
            placement = AttachmentMap.TOPEND;
          }
        } else if ($(this._menu).hasClass(ClassName.MENURIGHT)) {
          placement = AttachmentMap.BOTTOMEND;
        }
        return placement;
      };
      Dropdown.prototype._detectNavbar = function _detectNavbar() {
        return $(this._element).closest(".navbar").length > 0;
      };
      Dropdown.prototype._getPopperConfig = function _getPopperConfig() {
        var popperConfig = {
          placement: this._getPlacement(),
          modifiers: { offset: { offset: this._config.offset }, flip: { enabled: this._config.flip } },
        };
        if (this._inNavbar) {
          popperConfig.modifiers.applyStyle = { enabled: !this._inNavbar };
        }
        return popperConfig;
      };
      Dropdown._jQueryInterface = function _jQueryInterface(config) {
        return this.each(function () {
          var data = $(this).data(DATA_KEY);
          var _config = (typeof config === "undefined" ? "undefined" : _typeof(config)) === "object" ? config : null;
          if (!data) {
            data = new Dropdown(this, _config);
            $(this).data(DATA_KEY, data);
          }
          if (typeof config === "string") {
            if (data[config] === undefined) {
              throw new Error('No method named "' + config + '"');
            }
            data[config]();
          }
        });
      };
      Dropdown._clearMenus = function _clearMenus(event) {
        if (event && (event.which === RIGHT_MOUSE_BUTTON_WHICH || (event.type === "keyup" && event.which !== TAB_KEYCODE))) {
          return;
        }
        var toggles = $.makeArray($(Selector.DATA_TOGGLE));
        for (var i = 0; i < toggles.length; i++) {
          var parent = Dropdown._getParentFromElement(toggles[i]);
          var context = $(toggles[i]).data(DATA_KEY);
          var relatedTarget = { relatedTarget: toggles[i] };
          if (!context) {
            continue;
          }
          var dropdownMenu = context._menu;
          if (!$(parent).hasClass(ClassName.SHOW)) {
            continue;
          }
          if (
            event &&
            ((event.type === "click" && /input|textarea/i.test(event.target.tagName)) ||
              (event.type === "keyup" && event.which === TAB_KEYCODE)) &&
            $.contains(parent, event.target)
          ) {
            continue;
          }
          var hideEvent = $.Event(Event.HIDE, relatedTarget);
          $(parent).trigger(hideEvent);
          if (hideEvent.isDefaultPrevented()) {
            continue;
          }
          if ("ontouchstart" in document.documentElement) {
            $("body").children().off("mouseover", null, $.noop);
          }
          toggles[i].setAttribute("aria-expanded", "false");
          $(dropdownMenu).removeClass(ClassName.SHOW);
          $(parent).removeClass(ClassName.SHOW).trigger($.Event(Event.HIDDEN, relatedTarget));
        }
      };
      Dropdown._getParentFromElement = function _getParentFromElement(element) {
        var parent = void 0;
        var selector = Util.getSelectorFromElement(element);
        if (selector) {
          parent = $(selector)[0];
        }
        return parent || element.parentNode;
      };
      Dropdown._dataApiKeydownHandler = function _dataApiKeydownHandler(event) {
        if (
          !REGEXP_KEYDOWN.test(event.which) ||
          (/button/i.test(event.target.tagName) && event.which === SPACE_KEYCODE) ||
          /input|textarea/i.test(event.target.tagName)
        ) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (this.disabled || $(this).hasClass(ClassName.DISABLED)) {
          return;
        }
        var parent = Dropdown._getParentFromElement(this);
        var isActive = $(parent).hasClass(ClassName.SHOW);
        if (
          (!isActive && (event.which !== ESCAPE_KEYCODE || event.which !== SPACE_KEYCODE)) ||
          (isActive && (event.which === ESCAPE_KEYCODE || event.which === SPACE_KEYCODE))
        ) {
          if (event.which === ESCAPE_KEYCODE) {
            var toggle = $(parent).find(Selector.DATA_TOGGLE)[0];
            $(toggle).trigger("focus");
          }
          $(this).trigger("click");
          return;
        }
        var items = $(parent).find(Selector.VISIBLE_ITEMS).get();
        if (!items.length) {
          return;
        }
        var index = items.indexOf(event.target);
        if (event.which === ARROW_UP_KEYCODE && index > 0) {
          index--;
        }
        if (event.which === ARROW_DOWN_KEYCODE && index < items.length - 1) {
          index++;
        }
        if (index < 0) {
          index = 0;
        }
        items[index].focus();
      };
      _createClass(Dropdown, null, [
        {
          key: "VERSION",
          get: function get() {
            return VERSION;
          },
        },
        {
          key: "Default",
          get: function get() {
            return Default;
          },
        },
        {
          key: "DefaultType",
          get: function get() {
            return DefaultType;
          },
        },
      ]);
      return Dropdown;
    })();
    $(document)
      .on(Event.KEYDOWN_DATA_API, Selector.DATA_TOGGLE, Dropdown._dataApiKeydownHandler)
      .on(Event.KEYDOWN_DATA_API, Selector.MENU, Dropdown._dataApiKeydownHandler)
      .on(Event.CLICK_DATA_API + " " + Event.KEYUP_DATA_API, Dropdown._clearMenus)
      .on(Event.CLICK_DATA_API, Selector.DATA_TOGGLE, function (event) {
        event.preventDefault();
        event.stopPropagation();
        Dropdown._jQueryInterface.call($(this), "toggle");
      })
      .on(Event.CLICK_DATA_API, Selector.FORM_CHILD, function (e) {
        e.stopPropagation();
      });
    $.fn[NAME] = Dropdown._jQueryInterface;
    $.fn[NAME].Constructor = Dropdown;
    $.fn[NAME].noConflict = function () {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Dropdown._jQueryInterface;
    };
    return Dropdown;
  })(jQuery);
  var Modal = (function ($) {
    var NAME = "modal";
    var VERSION = "4.0.0-beta";
    var DATA_KEY = "bs.modal";
    var EVENT_KEY = "." + DATA_KEY;
    var DATA_API_KEY = ".data-api";
    var JQUERY_NO_CONFLICT = $.fn[NAME];
    var TRANSITION_DURATION = 300;
    var BACKDROP_TRANSITION_DURATION = 150;
    var ESCAPE_KEYCODE = 27;
    var Default = { backdrop: true, keyboard: true, focus: true, show: true };
    var DefaultType = { backdrop: "(boolean|string)", keyboard: "boolean", focus: "boolean", show: "boolean" };
    var Event = {
      HIDE: "hide" + EVENT_KEY,
      HIDDEN: "hidden" + EVENT_KEY,
      SHOW: "show" + EVENT_KEY,
      SHOWN: "shown" + EVENT_KEY,
      FOCUSIN: "focusin" + EVENT_KEY,
      RESIZE: "resize" + EVENT_KEY,
      CLICK_DISMISS: "click.dismiss" + EVENT_KEY,
      KEYDOWN_DISMISS: "keydown.dismiss" + EVENT_KEY,
      MOUSEUP_DISMISS: "mouseup.dismiss" + EVENT_KEY,
      MOUSEDOWN_DISMISS: "mousedown.dismiss" + EVENT_KEY,
      CLICK_DATA_API: "click" + EVENT_KEY + DATA_API_KEY,
    };
    var ClassName = {
      SCROLLBAR_MEASURER: "modal-scrollbar-measure",
      BACKDROP: "modal-backdrop",
      OPEN: "modal-open",
      FADE: "fade",
      SHOW: "show",
    };
    var Selector = {
      DIALOG: ".modal-dialog",
      DATA_TOGGLE: '[data-toggle="modal"]',
      DATA_DISMISS: '[data-dismiss="modal"]',
      FIXED_CONTENT: ".fixed-top, .fixed-bottom, .is-fixed, .sticky-top",
      NAVBAR_TOGGLER: ".navbar-toggler",
    };
    var Modal = (function () {
      function Modal(element, config) {
        _classCallCheck(this, Modal);
        this._config = this._getConfig(config);
        this._element = element;
        this._dialog = $(element).find(Selector.DIALOG)[0];
        this._backdrop = null;
        this._isShown = false;
        this._isBodyOverflowing = false;
        this._ignoreBackdropClick = false;
        this._originalBodyPadding = 0;
        this._scrollbarWidth = 0;
      }
      Modal.prototype.toggle = function toggle(relatedTarget) {
        return this._isShown ? this.hide() : this.show(relatedTarget);
      };
      Modal.prototype.show = function show(relatedTarget) {
        var _this10 = this;
        if (this._isTransitioning) {
          return;
        }
        if (Util.supportsTransitionEnd() && $(this._element).hasClass(ClassName.FADE)) {
          this._isTransitioning = true;
        }
        var showEvent = $.Event(Event.SHOW, { relatedTarget: relatedTarget });
        $(this._element).trigger(showEvent);
        if (this._isShown || showEvent.isDefaultPrevented()) {
          return;
        }
        this._isShown = true;
        this._checkScrollbar();
        this._setScrollbar();
        $(document.body).addClass(ClassName.OPEN);
        this._setEscapeEvent();
        this._setResizeEvent();
        $(this._element).on(Event.CLICK_DISMISS, Selector.DATA_DISMISS, function (event) {
          return _this10.hide(event);
        });
        $(this._dialog).on(Event.MOUSEDOWN_DISMISS, function () {
          $(_this10._element).one(Event.MOUSEUP_DISMISS, function (event) {
            if ($(event.target).is(_this10._element)) {
              _this10._ignoreBackdropClick = true;
            }
          });
        });
        this._showBackdrop(function () {
          return _this10._showElement(relatedTarget);
        });
      };
      Modal.prototype.hide = function hide(event) {
        var _this11 = this;
        if (event) {
          event.preventDefault();
        }
        if (this._isTransitioning || !this._isShown) {
          return;
        }
        var transition = Util.supportsTransitionEnd() && $(this._element).hasClass(ClassName.FADE);
        if (transition) {
          this._isTransitioning = true;
        }
        var hideEvent = $.Event(Event.HIDE);
        $(this._element).trigger(hideEvent);
        if (!this._isShown || hideEvent.isDefaultPrevented()) {
          return;
        }
        this._isShown = false;
        this._setEscapeEvent();
        this._setResizeEvent();
        $(document).off(Event.FOCUSIN);
        $(this._element).removeClass(ClassName.SHOW);
        $(this._element).off(Event.CLICK_DISMISS);
        $(this._dialog).off(Event.MOUSEDOWN_DISMISS);
        if (transition) {
          $(this._element)
            .one(Util.TRANSITION_END, function (event) {
              return _this11._hideModal(event);
            })
            .emulateTransitionEnd(TRANSITION_DURATION);
        } else {
          this._hideModal();
        }
      };
      Modal.prototype.dispose = function dispose() {
        $.removeData(this._element, DATA_KEY);
        $(window, document, this._element, this._backdrop).off(EVENT_KEY);
        this._config = null;
        this._element = null;
        this._dialog = null;
        this._backdrop = null;
        this._isShown = null;
        this._isBodyOverflowing = null;
        this._ignoreBackdropClick = null;
        this._scrollbarWidth = null;
      };
      Modal.prototype.handleUpdate = function handleUpdate() {
        this._adjustDialog();
      };
      Modal.prototype._getConfig = function _getConfig(config) {
        config = $.extend({}, Default, config);
        Util.typeCheckConfig(NAME, config, DefaultType);
        return config;
      };
      Modal.prototype._showElement = function _showElement(relatedTarget) {
        var _this12 = this;
        var transition = Util.supportsTransitionEnd() && $(this._element).hasClass(ClassName.FADE);
        if (!this._element.parentNode || this._element.parentNode.nodeType !== Node.ELEMENT_NODE) {
          document.body.appendChild(this._element);
        }
        this._element.style.display = "block";
        this._element.removeAttribute("aria-hidden");
        this._element.scrollTop = 0;
        if (transition) {
          Util.reflow(this._element);
        }
        $(this._element).addClass(ClassName.SHOW);
        if (this._config.focus) {
          this._enforceFocus();
        }
        var shownEvent = $.Event(Event.SHOWN, { relatedTarget: relatedTarget });
        var transitionComplete = function transitionComplete() {
          if (_this12._config.focus) {
            _this12._element.focus();
          }
          _this12._isTransitioning = false;
          $(_this12._element).trigger(shownEvent);
        };
        if (transition) {
          $(this._dialog).one(Util.TRANSITION_END, transitionComplete).emulateTransitionEnd(TRANSITION_DURATION);
        } else {
          transitionComplete();
        }
      };
      Modal.prototype._enforceFocus = function _enforceFocus() {
        var _this13 = this;
        $(document)
          .off(Event.FOCUSIN)
          .on(Event.FOCUSIN, function (event) {
            if (document !== event.target && _this13._element !== event.target && !$(_this13._element).has(event.target).length) {
              _this13._element.focus();
            }
          });
      };
      Modal.prototype._setEscapeEvent = function _setEscapeEvent() {
        var _this14 = this;
        if (this._isShown && this._config.keyboard) {
          $(this._element).on(Event.KEYDOWN_DISMISS, function (event) {
            if (event.which === ESCAPE_KEYCODE) {
              event.preventDefault();
              _this14.hide();
            }
          });
        } else if (!this._isShown) {
          $(this._element).off(Event.KEYDOWN_DISMISS);
        }
      };
      Modal.prototype._setResizeEvent = function _setResizeEvent() {
        var _this15 = this;
        if (this._isShown) {
          $(window).on(Event.RESIZE, function (event) {
            return _this15.handleUpdate(event);
          });
        } else {
          $(window).off(Event.RESIZE);
        }
      };
      Modal.prototype._hideModal = function _hideModal() {
        var _this16 = this;
        this._element.style.display = "none";
        this._element.setAttribute("aria-hidden", true);
        this._isTransitioning = false;
        this._showBackdrop(function () {
          $(document.body).removeClass(ClassName.OPEN);
          _this16._resetAdjustments();
          _this16._resetScrollbar();
          $(_this16._element).trigger(Event.HIDDEN);
        });
      };
      Modal.prototype._removeBackdrop = function _removeBackdrop() {
        if (this._backdrop) {
          $(this._backdrop).remove();
          this._backdrop = null;
        }
      };
      Modal.prototype._showBackdrop = function _showBackdrop(callback) {
        var _this17 = this;
        var animate = $(this._element).hasClass(ClassName.FADE) ? ClassName.FADE : "";
        if (this._isShown && this._config.backdrop) {
          var doAnimate = Util.supportsTransitionEnd() && animate;
          this._backdrop = document.createElement("div");
          this._backdrop.className = ClassName.BACKDROP;
          if (animate) {
            $(this._backdrop).addClass(animate);
          }
          $(this._backdrop).appendTo(document.body);
          $(this._element).on(Event.CLICK_DISMISS, function (event) {
            if (_this17._ignoreBackdropClick) {
              _this17._ignoreBackdropClick = false;
              return;
            }
            if (event.target !== event.currentTarget) {
              return;
            }
            if (_this17._config.backdrop === "static") {
              _this17._element.focus();
            } else {
              _this17.hide();
            }
          });
          if (doAnimate) {
            Util.reflow(this._backdrop);
          }
          $(this._backdrop).addClass(ClassName.SHOW);
          if (!callback) {
            return;
          }
          if (!doAnimate) {
            callback();
            return;
          }
          $(this._backdrop).one(Util.TRANSITION_END, callback).emulateTransitionEnd(BACKDROP_TRANSITION_DURATION);
        } else if (!this._isShown && this._backdrop) {
          $(this._backdrop).removeClass(ClassName.SHOW);
          var callbackRemove = function callbackRemove() {
            _this17._removeBackdrop();
            if (callback) {
              callback();
            }
          };
          if (Util.supportsTransitionEnd() && $(this._element).hasClass(ClassName.FADE)) {
            $(this._backdrop).one(Util.TRANSITION_END, callbackRemove).emulateTransitionEnd(BACKDROP_TRANSITION_DURATION);
          } else {
            callbackRemove();
          }
        } else if (callback) {
          callback();
        }
      };
      Modal.prototype._adjustDialog = function _adjustDialog() {
        var isModalOverflowing = this._element.scrollHeight > document.documentElement.clientHeight;
        if (!this._isBodyOverflowing && isModalOverflowing) {
          this._element.style.paddingLeft = this._scrollbarWidth + "px";
        }
        if (this._isBodyOverflowing && !isModalOverflowing) {
          this._element.style.paddingRight = this._scrollbarWidth + "px";
        }
      };
      Modal.prototype._resetAdjustments = function _resetAdjustments() {
        this._element.style.paddingLeft = "";
        this._element.style.paddingRight = "";
      };
      Modal.prototype._checkScrollbar = function _checkScrollbar() {
        this._isBodyOverflowing = document.body.clientWidth < window.innerWidth;
        this._scrollbarWidth = this._getScrollbarWidth();
      };
      Modal.prototype._setScrollbar = function _setScrollbar() {
        var _this18 = this;
        if (this._isBodyOverflowing) {
          $(Selector.FIXED_CONTENT).each(function (index, element) {
            var actualPadding = $(element)[0].style.paddingRight;
            var calculatedPadding = $(element).css("padding-right");
            $(element)
              .data("padding-right", actualPadding)
              .css("padding-right", parseFloat(calculatedPadding) + _this18._scrollbarWidth + "px");
          });
          $(Selector.NAVBAR_TOGGLER).each(function (index, element) {
            var actualMargin = $(element)[0].style.marginRight;
            var calculatedMargin = $(element).css("margin-right");
            $(element)
              .data("margin-right", actualMargin)
              .css("margin-right", parseFloat(calculatedMargin) + _this18._scrollbarWidth + "px");
          });
          var actualPadding = document.body.style.paddingRight;
          var calculatedPadding = $("body").css("padding-right");
          $("body")
            .data("padding-right", actualPadding)
            .css("padding-right", parseFloat(calculatedPadding) + this._scrollbarWidth + "px");
        }
      };
      Modal.prototype._resetScrollbar = function _resetScrollbar() {
        $(Selector.FIXED_CONTENT).each(function (index, element) {
          var padding = $(element).data("padding-right");
          if (typeof padding !== "undefined") {
            $(element).css("padding-right", padding).removeData("padding-right");
          }
        });
        $(Selector.NAVBAR_TOGGLER).each(function (index, element) {
          var margin = $(element).data("margin-right");
          if (typeof margin !== "undefined") {
            $(element).css("margin-right", margin).removeData("margin-right");
          }
        });
        var padding = $("body").data("padding-right");
        if (typeof padding !== "undefined") {
          $("body").css("padding-right", padding).removeData("padding-right");
        }
      };
      Modal.prototype._getScrollbarWidth = function _getScrollbarWidth() {
        var scrollDiv = document.createElement("div");
        scrollDiv.className = ClassName.SCROLLBAR_MEASURER;
        document.body.appendChild(scrollDiv);
        var scrollbarWidth = scrollDiv.getBoundingClientRect().width - scrollDiv.clientWidth;
        document.body.removeChild(scrollDiv);
        return scrollbarWidth;
      };
      Modal._jQueryInterface = function _jQueryInterface(config, relatedTarget) {
        return this.each(function () {
          var data = $(this).data(DATA_KEY);
          var _config = $.extend(
            {},
            Modal.Default,
            $(this).data(),
            (typeof config === "undefined" ? "undefined" : _typeof(config)) === "object" && config
          );
          if (!data) {
            data = new Modal(this, _config);
            $(this).data(DATA_KEY, data);
          }
          if (typeof config === "string") {
            if (data[config] === undefined) {
              throw new Error('No method named "' + config + '"');
            }
            data[config](relatedTarget);
          } else if (_config.show) {
            data.show(relatedTarget);
          }
        });
      };
      _createClass(Modal, null, [
        {
          key: "VERSION",
          get: function get() {
            return VERSION;
          },
        },
        {
          key: "Default",
          get: function get() {
            return Default;
          },
        },
      ]);
      return Modal;
    })();
    $(document).on(Event.CLICK_DATA_API, Selector.DATA_TOGGLE, function (event) {
      var _this19 = this;
      var target = void 0;
      var selector = Util.getSelectorFromElement(this);
      if (selector) {
        target = $(selector)[0];
      }
      var config = $(target).data(DATA_KEY) ? "toggle" : $.extend({}, $(target).data(), $(this).data());
      if (this.tagName === "A" || this.tagName === "AREA") {
        event.preventDefault();
      }
      var $target = $(target).one(Event.SHOW, function (showEvent) {
        if (showEvent.isDefaultPrevented()) {
          return;
        }
        $target.one(Event.HIDDEN, function () {
          if ($(_this19).is(":visible")) {
            _this19.focus();
          }
        });
      });
      Modal._jQueryInterface.call($(target), config, this);
    });
    $.fn[NAME] = Modal._jQueryInterface;
    $.fn[NAME].Constructor = Modal;
    $.fn[NAME].noConflict = function () {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Modal._jQueryInterface;
    };
    return Modal;
  })(jQuery);
  var ScrollSpy = (function ($) {
    var NAME = "scrollspy";
    var VERSION = "4.0.0-beta";
    var DATA_KEY = "bs.scrollspy";
    var EVENT_KEY = "." + DATA_KEY;
    var DATA_API_KEY = ".data-api";
    var JQUERY_NO_CONFLICT = $.fn[NAME];
    var Default = { offset: 10, method: "auto", target: "" };
    var DefaultType = { offset: "number", method: "string", target: "(string|element)" };
    var Event = { ACTIVATE: "activate" + EVENT_KEY, SCROLL: "scroll" + EVENT_KEY, LOAD_DATA_API: "load" + EVENT_KEY + DATA_API_KEY };
    var ClassName = { DROPDOWN_ITEM: "dropdown-item", DROPDOWN_MENU: "dropdown-menu", ACTIVE: "active" };
    var Selector = {
      DATA_SPY: '[data-spy="scroll"]',
      ACTIVE: ".active",
      NAV_LIST_GROUP: ".nav, .list-group",
      NAV_LINKS: ".nav-link",
      LIST_ITEMS: ".list-group-item",
      DROPDOWN: ".dropdown",
      DROPDOWN_ITEMS: ".dropdown-item",
      DROPDOWN_TOGGLE: ".dropdown-toggle",
    };
    var OffsetMethod = { OFFSET: "offset", POSITION: "position" };
    var ScrollSpy = (function () {
      function ScrollSpy(element, config) {
        var _this20 = this;
        _classCallCheck(this, ScrollSpy);
        this._element = element;
        this._scrollElement = element.tagName === "BODY" ? window : element;
        this._config = this._getConfig(config);
        this._selector =
          this._config.target +
          " " +
          Selector.NAV_LINKS +
          "," +
          (this._config.target + " " + Selector.LIST_ITEMS + ",") +
          (this._config.target + " " + Selector.DROPDOWN_ITEMS);
        this._offsets = [];
        this._targets = [];
        this._activeTarget = null;
        this._scrollHeight = 0;
        $(this._scrollElement).on(Event.SCROLL, function (event) {
          return _this20._process(event);
        });
        this.refresh();
        this._process();
      }
      ScrollSpy.prototype.refresh = function refresh() {
        var _this21 = this;
        var autoMethod = this._scrollElement !== this._scrollElement.window ? OffsetMethod.POSITION : OffsetMethod.OFFSET;
        var offsetMethod = this._config.method === "auto" ? autoMethod : this._config.method;
        var offsetBase = offsetMethod === OffsetMethod.POSITION ? this._getScrollTop() : 0;
        this._offsets = [];
        this._targets = [];
        this._scrollHeight = this._getScrollHeight();
        var targets = $.makeArray($(this._selector));
        targets
          .map(function (element) {
            var target = void 0;
            var targetSelector = Util.getSelectorFromElement(element);
            if (targetSelector) {
              target = $(targetSelector)[0];
            }
            if (target) {
              var targetBCR = target.getBoundingClientRect();
              if (targetBCR.width || targetBCR.height) {
                return [$(target)[offsetMethod]().top + offsetBase, targetSelector];
              }
            }
            return null;
          })
          .filter(function (item) {
            return item;
          })
          .sort(function (a, b) {
            return a[0] - b[0];
          })
          .forEach(function (item) {
            _this21._offsets.push(item[0]);
            _this21._targets.push(item[1]);
          });
      };
      ScrollSpy.prototype.dispose = function dispose() {
        $.removeData(this._element, DATA_KEY);
        $(this._scrollElement).off(EVENT_KEY);
        this._element = null;
        this._scrollElement = null;
        this._config = null;
        this._selector = null;
        this._offsets = null;
        this._targets = null;
        this._activeTarget = null;
        this._scrollHeight = null;
      };
      ScrollSpy.prototype._getConfig = function _getConfig(config) {
        config = $.extend({}, Default, config);
        if (typeof config.target !== "string") {
          var id = $(config.target).attr("id");
          if (!id) {
            id = Util.getUID(NAME);
            $(config.target).attr("id", id);
          }
          config.target = "#" + id;
        }
        Util.typeCheckConfig(NAME, config, DefaultType);
        return config;
      };
      ScrollSpy.prototype._getScrollTop = function _getScrollTop() {
        return this._scrollElement === window ? this._scrollElement.pageYOffset : this._scrollElement.scrollTop;
      };
      ScrollSpy.prototype._getScrollHeight = function _getScrollHeight() {
        return this._scrollElement.scrollHeight || Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      };
      ScrollSpy.prototype._getOffsetHeight = function _getOffsetHeight() {
        return this._scrollElement === window ? window.innerHeight : this._scrollElement.getBoundingClientRect().height;
      };
      ScrollSpy.prototype._process = function _process() {
        var scrollTop = this._getScrollTop() + this._config.offset;
        var scrollHeight = this._getScrollHeight();
        var maxScroll = this._config.offset + scrollHeight - this._getOffsetHeight();
        if (this._scrollHeight !== scrollHeight) {
          this.refresh();
        }
        if (scrollTop >= maxScroll) {
          var target = this._targets[this._targets.length - 1];
          if (this._activeTarget !== target) {
            this._activate(target);
          }
          return;
        }
        if (this._activeTarget && scrollTop < this._offsets[0] && this._offsets[0] > 0) {
          this._activeTarget = null;
          this._clear();
          return;
        }
        for (var i = this._offsets.length; i--; ) {
          var isActiveTarget =
            this._activeTarget !== this._targets[i] &&
            scrollTop >= this._offsets[i] &&
            (this._offsets[i + 1] === undefined || scrollTop < this._offsets[i + 1]);
          if (isActiveTarget) {
            this._activate(this._targets[i]);
          }
        }
      };
      ScrollSpy.prototype._activate = function _activate(target) {
        this._activeTarget = target;
        this._clear();
        var queries = this._selector.split(",");
        queries = queries.map(function (selector) {
          return selector + '[data-target="' + target + '"],' + (selector + '[href="' + target + '"]');
        });
        var $link = $(queries.join(","));
        if ($link.hasClass(ClassName.DROPDOWN_ITEM)) {
          $link.closest(Selector.DROPDOWN).find(Selector.DROPDOWN_TOGGLE).addClass(ClassName.ACTIVE);
          $link.addClass(ClassName.ACTIVE);
        } else {
          $link.addClass(ClassName.ACTIVE);
          $link
            .parents(Selector.NAV_LIST_GROUP)
            .prev(Selector.NAV_LINKS + ", " + Selector.LIST_ITEMS)
            .addClass(ClassName.ACTIVE);
        }
        $(this._scrollElement).trigger(Event.ACTIVATE, { relatedTarget: target });
      };
      ScrollSpy.prototype._clear = function _clear() {
        $(this._selector).filter(Selector.ACTIVE).removeClass(ClassName.ACTIVE);
      };
      ScrollSpy._jQueryInterface = function _jQueryInterface(config) {
        return this.each(function () {
          var data = $(this).data(DATA_KEY);
          var _config = (typeof config === "undefined" ? "undefined" : _typeof(config)) === "object" && config;
          if (!data) {
            data = new ScrollSpy(this, _config);
            $(this).data(DATA_KEY, data);
          }
          if (typeof config === "string") {
            if (data[config] === undefined) {
              throw new Error('No method named "' + config + '"');
            }
            data[config]();
          }
        });
      };
      _createClass(ScrollSpy, null, [
        {
          key: "VERSION",
          get: function get() {
            return VERSION;
          },
        },
        {
          key: "Default",
          get: function get() {
            return Default;
          },
        },
      ]);
      return ScrollSpy;
    })();
    $(window).on(Event.LOAD_DATA_API, function () {
      var scrollSpys = $.makeArray($(Selector.DATA_SPY));
      for (var i = scrollSpys.length; i--; ) {
        var $spy = $(scrollSpys[i]);
        ScrollSpy._jQueryInterface.call($spy, $spy.data());
      }
    });
    $.fn[NAME] = ScrollSpy._jQueryInterface;
    $.fn[NAME].Constructor = ScrollSpy;
    $.fn[NAME].noConflict = function () {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return ScrollSpy._jQueryInterface;
    };
    return ScrollSpy;
  })(jQuery);
  var Tab = (function ($) {
    var NAME = "tab";
    var VERSION = "4.0.0-beta";
    var DATA_KEY = "bs.tab";
    var EVENT_KEY = "." + DATA_KEY;
    var DATA_API_KEY = ".data-api";
    var JQUERY_NO_CONFLICT = $.fn[NAME];
    var TRANSITION_DURATION = 150;
    var Event = {
      HIDE: "hide" + EVENT_KEY,
      HIDDEN: "hidden" + EVENT_KEY,
      SHOW: "show" + EVENT_KEY,
      SHOWN: "shown" + EVENT_KEY,
      CLICK_DATA_API: "click" + EVENT_KEY + DATA_API_KEY,
    };
    var ClassName = { DROPDOWN_MENU: "dropdown-menu", ACTIVE: "active", DISABLED: "disabled", FADE: "fade", SHOW: "show" };
    var Selector = {
      DROPDOWN: ".dropdown",
      NAV_LIST_GROUP: ".nav, .list-group",
      ACTIVE: ".active",
      DATA_TOGGLE: '[data-toggle="tab"], [data-toggle="pill"], [data-toggle="list"]',
      DROPDOWN_TOGGLE: ".dropdown-toggle",
      DROPDOWN_ACTIVE_CHILD: "> .dropdown-menu .active",
    };
    var Tab = (function () {
      function Tab(element) {
        _classCallCheck(this, Tab);
        this._element = element;
      }
      Tab.prototype.show = function show() {
        var _this22 = this;
        if (
          (this._element.parentNode &&
            this._element.parentNode.nodeType === Node.ELEMENT_NODE &&
            $(this._element).hasClass(ClassName.ACTIVE)) ||
          $(this._element).hasClass(ClassName.DISABLED)
        ) {
          return;
        }
        var target = void 0;
        var previous = void 0;
        var listElement = $(this._element).closest(Selector.NAV_LIST_GROUP)[0];
        var selector = Util.getSelectorFromElement(this._element);
        if (listElement) {
          previous = $.makeArray($(listElement).find(Selector.ACTIVE));
          previous = previous[previous.length - 1];
        }
        var hideEvent = $.Event(Event.HIDE, { relatedTarget: this._element });
        var showEvent = $.Event(Event.SHOW, { relatedTarget: previous });
        if (previous) {
          $(previous).trigger(hideEvent);
        }
        $(this._element).trigger(showEvent);
        if (showEvent.isDefaultPrevented() || hideEvent.isDefaultPrevented()) {
          return;
        }
        if (selector) {
          target = $(selector)[0];
        }
        this._activate(this._element, listElement);
        var complete = function complete() {
          var hiddenEvent = $.Event(Event.HIDDEN, { relatedTarget: _this22._element });
          var shownEvent = $.Event(Event.SHOWN, { relatedTarget: previous });
          $(previous).trigger(hiddenEvent);
          $(_this22._element).trigger(shownEvent);
        };
        if (target) {
          this._activate(target, target.parentNode, complete);
        } else {
          complete();
        }
      };
      Tab.prototype.dispose = function dispose() {
        $.removeData(this._element, DATA_KEY);
        this._element = null;
      };
      Tab.prototype._activate = function _activate(element, container, callback) {
        var _this23 = this;
        var active = $(container).find(Selector.ACTIVE)[0];
        var isTransitioning = callback && Util.supportsTransitionEnd() && active && $(active).hasClass(ClassName.FADE);
        var complete = function complete() {
          return _this23._transitionComplete(element, active, isTransitioning, callback);
        };
        if (active && isTransitioning) {
          $(active).one(Util.TRANSITION_END, complete).emulateTransitionEnd(TRANSITION_DURATION);
        } else {
          complete();
        }
        if (active) {
          $(active).removeClass(ClassName.SHOW);
        }
      };
      Tab.prototype._transitionComplete = function _transitionComplete(element, active, isTransitioning, callback) {
        if (active) {
          $(active).removeClass(ClassName.ACTIVE);
          var dropdownChild = $(active.parentNode).find(Selector.DROPDOWN_ACTIVE_CHILD)[0];
          if (dropdownChild) {
            $(dropdownChild).removeClass(ClassName.ACTIVE);
          }
          active.setAttribute("aria-expanded", false);
        }
        $(element).addClass(ClassName.ACTIVE);
        element.setAttribute("aria-expanded", true);
        if (isTransitioning) {
          Util.reflow(element);
          $(element).addClass(ClassName.SHOW);
        } else {
          $(element).removeClass(ClassName.FADE);
        }
        if (element.parentNode && $(element.parentNode).hasClass(ClassName.DROPDOWN_MENU)) {
          var dropdownElement = $(element).closest(Selector.DROPDOWN)[0];
          if (dropdownElement) {
            $(dropdownElement).find(Selector.DROPDOWN_TOGGLE).addClass(ClassName.ACTIVE);
          }
          element.setAttribute("aria-expanded", true);
        }
        if (callback) {
          callback();
        }
      };
      Tab._jQueryInterface = function _jQueryInterface(config) {
        return this.each(function () {
          var $this = $(this);
          var data = $this.data(DATA_KEY);
          if (!data) {
            data = new Tab(this);
            $this.data(DATA_KEY, data);
          }
          if (typeof config === "string") {
            if (data[config] === undefined) {
              throw new Error('No method named "' + config + '"');
            }
            data[config]();
          }
        });
      };
      _createClass(Tab, null, [
        {
          key: "VERSION",
          get: function get() {
            return VERSION;
          },
        },
      ]);
      return Tab;
    })();
    $(document).on(Event.CLICK_DATA_API, Selector.DATA_TOGGLE, function (event) {
      event.preventDefault();
      Tab._jQueryInterface.call($(this), "show");
    });
    $.fn[NAME] = Tab._jQueryInterface;
    $.fn[NAME].Constructor = Tab;
    $.fn[NAME].noConflict = function () {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Tab._jQueryInterface;
    };
    return Tab;
  })(jQuery);
  var Tooltip = (function ($) {
    if (typeof Popper === "undefined") {
      throw new Error("Bootstrap tooltips require Popper.js (https://popper.js.org)");
    }
    var NAME = "tooltip";
    var VERSION = "4.0.0-beta";
    var DATA_KEY = "bs.tooltip";
    var EVENT_KEY = "." + DATA_KEY;
    var JQUERY_NO_CONFLICT = $.fn[NAME];
    var TRANSITION_DURATION = 150;
    var CLASS_PREFIX = "bs-tooltip";
    var BSCLS_PREFIX_REGEX = new RegExp("(^|\\s)" + CLASS_PREFIX + "\\S+", "g");
    var DefaultType = {
      animation: "boolean",
      template: "string",
      title: "(string|element|function)",
      trigger: "string",
      delay: "(number|object)",
      html: "boolean",
      selector: "(string|boolean)",
      placement: "(string|function)",
      offset: "(number|string)",
      container: "(string|element|boolean)",
      fallbackPlacement: "(string|array)",
    };
    var AttachmentMap = { AUTO: "auto", TOP: "top", RIGHT: "right", BOTTOM: "bottom", LEFT: "left" };
    var Default = {
      animation: true,
      template: '<div class="tooltip" role="tooltip">' + '<div class="arrow"></div>' + '<div class="tooltip-inner"></div></div>',
      trigger: "hover focus",
      title: "",
      delay: 0,
      html: false,
      selector: false,
      placement: "top",
      offset: 0,
      container: false,
      fallbackPlacement: "flip",
    };
    var HoverState = { SHOW: "show", OUT: "out" };
    var Event = {
      HIDE: "hide" + EVENT_KEY,
      HIDDEN: "hidden" + EVENT_KEY,
      SHOW: "show" + EVENT_KEY,
      SHOWN: "shown" + EVENT_KEY,
      INSERTED: "inserted" + EVENT_KEY,
      CLICK: "click" + EVENT_KEY,
      FOCUSIN: "focusin" + EVENT_KEY,
      FOCUSOUT: "focusout" + EVENT_KEY,
      MOUSEENTER: "mouseenter" + EVENT_KEY,
      MOUSELEAVE: "mouseleave" + EVENT_KEY,
    };
    var ClassName = { FADE: "fade", SHOW: "show" };
    var Selector = { TOOLTIP: ".tooltip", TOOLTIP_INNER: ".tooltip-inner", ARROW: ".arrow" };
    var Trigger = { HOVER: "hover", FOCUS: "focus", CLICK: "click", MANUAL: "manual" };
    var Tooltip = (function () {
      function Tooltip(element, config) {
        _classCallCheck(this, Tooltip);
        this._isEnabled = true;
        this._timeout = 0;
        this._hoverState = "";
        this._activeTrigger = {};
        this._popper = null;
        this.element = element;
        this.config = this._getConfig(config);
        this.tip = null;
        this._setListeners();
      }
      Tooltip.prototype.enable = function enable() {
        this._isEnabled = true;
      };
      Tooltip.prototype.disable = function disable() {
        this._isEnabled = false;
      };
      Tooltip.prototype.toggleEnabled = function toggleEnabled() {
        this._isEnabled = !this._isEnabled;
      };
      Tooltip.prototype.toggle = function toggle(event) {
        if (event) {
          var dataKey = this.constructor.DATA_KEY;
          var context = $(event.currentTarget).data(dataKey);
          if (!context) {
            context = new this.constructor(event.currentTarget, this._getDelegateConfig());
            $(event.currentTarget).data(dataKey, context);
          }
          context._activeTrigger.click = !context._activeTrigger.click;
          if (context._isWithActiveTrigger()) {
            context._enter(null, context);
          } else {
            context._leave(null, context);
          }
        } else {
          if ($(this.getTipElement()).hasClass(ClassName.SHOW)) {
            this._leave(null, this);
            return;
          }
          this._enter(null, this);
        }
      };
      Tooltip.prototype.dispose = function dispose() {
        clearTimeout(this._timeout);
        $.removeData(this.element, this.constructor.DATA_KEY);
        $(this.element).off(this.constructor.EVENT_KEY);
        $(this.element).closest(".modal").off("hide.bs.modal");
        if (this.tip) {
          $(this.tip).remove();
        }
        this._isEnabled = null;
        this._timeout = null;
        this._hoverState = null;
        this._activeTrigger = null;
        if (this._popper !== null) {
          this._popper.destroy();
        }
        this._popper = null;
        this.element = null;
        this.config = null;
        this.tip = null;
      };
      Tooltip.prototype.show = function show() {
        var _this24 = this;
        if ($(this.element).css("display") === "none") {
          throw new Error("Please use show on visible elements");
        }
        var showEvent = $.Event(this.constructor.Event.SHOW);
        if (this.isWithContent() && this._isEnabled) {
          $(this.element).trigger(showEvent);
          var isInTheDom = $.contains(this.element.ownerDocument.documentElement, this.element);
          if (showEvent.isDefaultPrevented() || !isInTheDom) {
            return;
          }
          var tip = this.getTipElement();
          var tipId = Util.getUID(this.constructor.NAME);
          tip.setAttribute("id", tipId);
          this.element.setAttribute("aria-describedby", tipId);
          this.setContent();
          if (this.config.animation) {
            $(tip).addClass(ClassName.FADE);
          }
          var placement =
            typeof this.config.placement === "function" ? this.config.placement.call(this, tip, this.element) : this.config.placement;
          var attachment = this._getAttachment(placement);
          this.addAttachmentClass(attachment);
          var container = this.config.container === false ? document.body : $(this.config.container);
          $(tip).data(this.constructor.DATA_KEY, this);
          if (!$.contains(this.element.ownerDocument.documentElement, this.tip)) {
            $(tip).appendTo(container);
          }
          $(this.element).trigger(this.constructor.Event.INSERTED);
          this._popper = new Popper(this.element, tip, {
            placement: attachment,
            modifiers: {
              offset: { offset: this.config.offset },
              flip: { behavior: this.config.fallbackPlacement },
              arrow: { element: Selector.ARROW },
            },
            onCreate: function onCreate(data) {
              if (data.originalPlacement !== data.placement) {
                _this24._handlePopperPlacementChange(data);
              }
            },
            onUpdate: function onUpdate(data) {
              _this24._handlePopperPlacementChange(data);
            },
          });
          $(tip).addClass(ClassName.SHOW);
          if ("ontouchstart" in document.documentElement) {
            $("body").children().on("mouseover", null, $.noop);
          }
          var complete = function complete() {
            if (_this24.config.animation) {
              _this24._fixTransition();
            }
            var prevHoverState = _this24._hoverState;
            _this24._hoverState = null;
            $(_this24.element).trigger(_this24.constructor.Event.SHOWN);
            if (prevHoverState === HoverState.OUT) {
              _this24._leave(null, _this24);
            }
          };
          if (Util.supportsTransitionEnd() && $(this.tip).hasClass(ClassName.FADE)) {
            $(this.tip).one(Util.TRANSITION_END, complete).emulateTransitionEnd(Tooltip._TRANSITION_DURATION);
          } else {
            complete();
          }
        }
      };
      Tooltip.prototype.hide = function hide(callback) {
        var _this25 = this;
        var tip = this.getTipElement();
        var hideEvent = $.Event(this.constructor.Event.HIDE);
        var complete = function complete() {
          if (_this25._hoverState !== HoverState.SHOW && tip.parentNode) {
            tip.parentNode.removeChild(tip);
          }
          _this25._cleanTipClass();
          _this25.element.removeAttribute("aria-describedby");
          $(_this25.element).trigger(_this25.constructor.Event.HIDDEN);
          if (_this25._popper !== null) {
            _this25._popper.destroy();
          }
          if (callback) {
            callback();
          }
        };
        $(this.element).trigger(hideEvent);
        if (hideEvent.isDefaultPrevented()) {
          return;
        }
        $(tip).removeClass(ClassName.SHOW);
        if ("ontouchstart" in document.documentElement) {
          $("body").children().off("mouseover", null, $.noop);
        }
        this._activeTrigger[Trigger.CLICK] = false;
        this._activeTrigger[Trigger.FOCUS] = false;
        this._activeTrigger[Trigger.HOVER] = false;
        if (Util.supportsTransitionEnd() && $(this.tip).hasClass(ClassName.FADE)) {
          $(tip).one(Util.TRANSITION_END, complete).emulateTransitionEnd(TRANSITION_DURATION);
        } else {
          complete();
        }
        this._hoverState = "";
      };
      Tooltip.prototype.update = function update() {
        if (this._popper !== null) {
          this._popper.scheduleUpdate();
        }
      };
      Tooltip.prototype.isWithContent = function isWithContent() {
        return Boolean(this.getTitle());
      };
      Tooltip.prototype.addAttachmentClass = function addAttachmentClass(attachment) {
        $(this.getTipElement()).addClass(CLASS_PREFIX + "-" + attachment);
      };
      Tooltip.prototype.getTipElement = function getTipElement() {
        return (this.tip = this.tip || $(this.config.template)[0]);
      };
      Tooltip.prototype.setContent = function setContent() {
        var $tip = $(this.getTipElement());
        this.setElementContent($tip.find(Selector.TOOLTIP_INNER), this.getTitle());
        $tip.removeClass(ClassName.FADE + " " + ClassName.SHOW);
      };
      Tooltip.prototype.setElementContent = function setElementContent($element, content) {
        var html = this.config.html;
        if ((typeof content === "undefined" ? "undefined" : _typeof(content)) === "object" && (content.nodeType || content.jquery)) {
          if (html) {
            if (!$(content).parent().is($element)) {
              $element.empty().append(content);
            }
          } else {
            $element.text($(content).text());
          }
        } else {
          $element[html ? "html" : "text"](content);
        }
      };
      Tooltip.prototype.getTitle = function getTitle() {
        var title = this.element.getAttribute("data-original-title");
        if (!title) {
          title = typeof this.config.title === "function" ? this.config.title.call(this.element) : this.config.title;
        }
        return title;
      };
      Tooltip.prototype._getAttachment = function _getAttachment(placement) {
        return AttachmentMap[placement.toUpperCase()];
      };
      Tooltip.prototype._setListeners = function _setListeners() {
        var _this26 = this;
        var triggers = this.config.trigger.split(" ");
        triggers.forEach(function (trigger) {
          if (trigger === "click") {
            $(_this26.element).on(_this26.constructor.Event.CLICK, _this26.config.selector, function (event) {
              return _this26.toggle(event);
            });
          } else if (trigger !== Trigger.MANUAL) {
            var eventIn = trigger === Trigger.HOVER ? _this26.constructor.Event.MOUSEENTER : _this26.constructor.Event.FOCUSIN;
            var eventOut = trigger === Trigger.HOVER ? _this26.constructor.Event.MOUSELEAVE : _this26.constructor.Event.FOCUSOUT;
            $(_this26.element)
              .on(eventIn, _this26.config.selector, function (event) {
                return _this26._enter(event);
              })
              .on(eventOut, _this26.config.selector, function (event) {
                return _this26._leave(event);
              });
          }
          $(_this26.element)
            .closest(".modal")
            .on("hide.bs.modal", function () {
              return _this26.hide();
            });
        });
        if (this.config.selector) {
          this.config = $.extend({}, this.config, { trigger: "manual", selector: "" });
        } else {
          this._fixTitle();
        }
      };
      Tooltip.prototype._fixTitle = function _fixTitle() {
        var titleType = _typeof(this.element.getAttribute("data-original-title"));
        if (this.element.getAttribute("title") || titleType !== "string") {
          this.element.setAttribute("data-original-title", this.element.getAttribute("title") || "");
          this.element.setAttribute("title", "");
        }
      };
      Tooltip.prototype._enter = function _enter(event, context) {
        var dataKey = this.constructor.DATA_KEY;
        context = context || $(event.currentTarget).data(dataKey);
        if (!context) {
          context = new this.constructor(event.currentTarget, this._getDelegateConfig());
          $(event.currentTarget).data(dataKey, context);
        }
        if (event) {
          context._activeTrigger[event.type === "focusin" ? Trigger.FOCUS : Trigger.HOVER] = true;
        }
        if ($(context.getTipElement()).hasClass(ClassName.SHOW) || context._hoverState === HoverState.SHOW) {
          context._hoverState = HoverState.SHOW;
          return;
        }
        clearTimeout(context._timeout);
        context._hoverState = HoverState.SHOW;
        if (!context.config.delay || !context.config.delay.show) {
          context.show();
          return;
        }
        context._timeout = setTimeout(function () {
          if (context._hoverState === HoverState.SHOW) {
            context.show();
          }
        }, context.config.delay.show);
      };
      Tooltip.prototype._leave = function _leave(event, context) {
        var dataKey = this.constructor.DATA_KEY;
        context = context || $(event.currentTarget).data(dataKey);
        if (!context) {
          context = new this.constructor(event.currentTarget, this._getDelegateConfig());
          $(event.currentTarget).data(dataKey, context);
        }
        if (event) {
          context._activeTrigger[event.type === "focusout" ? Trigger.FOCUS : Trigger.HOVER] = false;
        }
        if (context._isWithActiveTrigger()) {
          return;
        }
        clearTimeout(context._timeout);
        context._hoverState = HoverState.OUT;
        if (!context.config.delay || !context.config.delay.hide) {
          context.hide();
          return;
        }
        context._timeout = setTimeout(function () {
          if (context._hoverState === HoverState.OUT) {
            context.hide();
          }
        }, context.config.delay.hide);
      };
      Tooltip.prototype._isWithActiveTrigger = function _isWithActiveTrigger() {
        for (var trigger in this._activeTrigger) {
          if (this._activeTrigger[trigger]) {
            return true;
          }
        }
        return false;
      };
      Tooltip.prototype._getConfig = function _getConfig(config) {
        config = $.extend({}, this.constructor.Default, $(this.element).data(), config);
        if (config.delay && typeof config.delay === "number") {
          config.delay = { show: config.delay, hide: config.delay };
        }
        if (config.title && typeof config.title === "number") {
          config.title = config.title.toString();
        }
        if (config.content && typeof config.content === "number") {
          config.content = config.content.toString();
        }
        Util.typeCheckConfig(NAME, config, this.constructor.DefaultType);
        return config;
      };
      Tooltip.prototype._getDelegateConfig = function _getDelegateConfig() {
        var config = {};
        if (this.config) {
          for (var key in this.config) {
            if (this.constructor.Default[key] !== this.config[key]) {
              config[key] = this.config[key];
            }
          }
        }
        return config;
      };
      Tooltip.prototype._cleanTipClass = function _cleanTipClass() {
        var $tip = $(this.getTipElement());
        var tabClass = $tip.attr("class").match(BSCLS_PREFIX_REGEX);
        if (tabClass !== null && tabClass.length > 0) {
          $tip.removeClass(tabClass.join(""));
        }
      };
      Tooltip.prototype._handlePopperPlacementChange = function _handlePopperPlacementChange(data) {
        this._cleanTipClass();
        this.addAttachmentClass(this._getAttachment(data.placement));
      };
      Tooltip.prototype._fixTransition = function _fixTransition() {
        var tip = this.getTipElement();
        var initConfigAnimation = this.config.animation;
        if (tip.getAttribute("x-placement") !== null) {
          return;
        }
        $(tip).removeClass(ClassName.FADE);
        this.config.animation = false;
        this.hide();
        this.show();
        this.config.animation = initConfigAnimation;
      };
      Tooltip._jQueryInterface = function _jQueryInterface(config) {
        return this.each(function () {
          var data = $(this).data(DATA_KEY);
          var _config = (typeof config === "undefined" ? "undefined" : _typeof(config)) === "object" && config;
          if (!data && /dispose|hide/.test(config)) {
            return;
          }
          if (!data) {
            data = new Tooltip(this, _config);
            $(this).data(DATA_KEY, data);
          }
          if (typeof config === "string") {
            if (data[config] === undefined) {
              throw new Error('No method named "' + config + '"');
            }
            data[config]();
          }
        });
      };
      _createClass(Tooltip, null, [
        {
          key: "VERSION",
          get: function get() {
            return VERSION;
          },
        },
        {
          key: "Default",
          get: function get() {
            return Default;
          },
        },
        {
          key: "NAME",
          get: function get() {
            return NAME;
          },
        },
        {
          key: "DATA_KEY",
          get: function get() {
            return DATA_KEY;
          },
        },
        {
          key: "Event",
          get: function get() {
            return Event;
          },
        },
        {
          key: "EVENT_KEY",
          get: function get() {
            return EVENT_KEY;
          },
        },
        {
          key: "DefaultType",
          get: function get() {
            return DefaultType;
          },
        },
      ]);
      return Tooltip;
    })();
    $.fn[NAME] = Tooltip._jQueryInterface;
    $.fn[NAME].Constructor = Tooltip;
    $.fn[NAME].noConflict = function () {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Tooltip._jQueryInterface;
    };
    return Tooltip;
  })(jQuery);
  var Popover = (function ($) {
    var NAME = "popover";
    var VERSION = "4.0.0-beta";
    var DATA_KEY = "bs.popover";
    var EVENT_KEY = "." + DATA_KEY;
    var JQUERY_NO_CONFLICT = $.fn[NAME];
    var CLASS_PREFIX = "bs-popover";
    var BSCLS_PREFIX_REGEX = new RegExp("(^|\\s)" + CLASS_PREFIX + "\\S+", "g");
    var Default = $.extend({}, Tooltip.Default, {
      placement: "right",
      trigger: "click",
      content: "",
      template:
        '<div class="popover" role="tooltip">' +
        '<div class="arrow"></div>' +
        '<h3 class="popover-header"></h3>' +
        '<div class="popover-body"></div></div>',
    });
    var DefaultType = $.extend({}, Tooltip.DefaultType, { content: "(string|element|function)" });
    var ClassName = { FADE: "fade", SHOW: "show" };
    var Selector = { TITLE: ".popover-header", CONTENT: ".popover-body" };
    var Event = {
      HIDE: "hide" + EVENT_KEY,
      HIDDEN: "hidden" + EVENT_KEY,
      SHOW: "show" + EVENT_KEY,
      SHOWN: "shown" + EVENT_KEY,
      INSERTED: "inserted" + EVENT_KEY,
      CLICK: "click" + EVENT_KEY,
      FOCUSIN: "focusin" + EVENT_KEY,
      FOCUSOUT: "focusout" + EVENT_KEY,
      MOUSEENTER: "mouseenter" + EVENT_KEY,
      MOUSELEAVE: "mouseleave" + EVENT_KEY,
    };
    var Popover = (function (_Tooltip) {
      _inherits(Popover, _Tooltip);
      function Popover() {
        _classCallCheck(this, Popover);
        return _possibleConstructorReturn(this, _Tooltip.apply(this, arguments));
      }
      Popover.prototype.isWithContent = function isWithContent() {
        return this.getTitle() || this._getContent();
      };
      Popover.prototype.addAttachmentClass = function addAttachmentClass(attachment) {
        $(this.getTipElement()).addClass(CLASS_PREFIX + "-" + attachment);
      };
      Popover.prototype.getTipElement = function getTipElement() {
        return (this.tip = this.tip || $(this.config.template)[0]);
      };
      Popover.prototype.setContent = function setContent() {
        var $tip = $(this.getTipElement());
        this.setElementContent($tip.find(Selector.TITLE), this.getTitle());
        this.setElementContent($tip.find(Selector.CONTENT), this._getContent());
        $tip.removeClass(ClassName.FADE + " " + ClassName.SHOW);
      };
      Popover.prototype._getContent = function _getContent() {
        return (
          this.element.getAttribute("data-content") ||
          (typeof this.config.content === "function" ? this.config.content.call(this.element) : this.config.content)
        );
      };
      Popover.prototype._cleanTipClass = function _cleanTipClass() {
        var $tip = $(this.getTipElement());
        var tabClass = $tip.attr("class").match(BSCLS_PREFIX_REGEX);
        if (tabClass !== null && tabClass.length > 0) {
          $tip.removeClass(tabClass.join(""));
        }
      };
      Popover._jQueryInterface = function _jQueryInterface(config) {
        return this.each(function () {
          var data = $(this).data(DATA_KEY);
          var _config = (typeof config === "undefined" ? "undefined" : _typeof(config)) === "object" ? config : null;
          if (!data && /destroy|hide/.test(config)) {
            return;
          }
          if (!data) {
            data = new Popover(this, _config);
            $(this).data(DATA_KEY, data);
          }
          if (typeof config === "string") {
            if (data[config] === undefined) {
              throw new Error('No method named "' + config + '"');
            }
            data[config]();
          }
        });
      };
      _createClass(Popover, null, [
        {
          key: "VERSION",
          get: function get() {
            return VERSION;
          },
        },
        {
          key: "Default",
          get: function get() {
            return Default;
          },
        },
        {
          key: "NAME",
          get: function get() {
            return NAME;
          },
        },
        {
          key: "DATA_KEY",
          get: function get() {
            return DATA_KEY;
          },
        },
        {
          key: "Event",
          get: function get() {
            return Event;
          },
        },
        {
          key: "EVENT_KEY",
          get: function get() {
            return EVENT_KEY;
          },
        },
        {
          key: "DefaultType",
          get: function get() {
            return DefaultType;
          },
        },
      ]);
      return Popover;
    })(Tooltip);
    $.fn[NAME] = Popover._jQueryInterface;
    $.fn[NAME].Constructor = Popover;
    $.fn[NAME].noConflict = function () {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return Popover._jQueryInterface;
    };
    return Popover;
  })(jQuery);
})();
(function ($) {
  if (typeof $.fn.each2 == "undefined") {
    $.extend($.fn, {
      each2: function (c) {
        var j = $([0]),
          i = -1,
          l = this.length;
        while (++i < l && (j.context = j[0] = this[i]) && c.call(j[0], i, j) !== false);
        return this;
      },
    });
  }
})(jQuery);
(function ($, undefined) {
  "use strict";
  if (window.Select2 !== undefined) {
    return;
  }
  var AbstractSelect2,
    SingleSelect2,
    MultiSelect2,
    nextUid,
    sizer,
    lastMousePosition = { x: 0, y: 0 },
    $document,
    scrollBarDimensions,
    KEY = {
      TAB: 9,
      ENTER: 13,
      ESC: 27,
      SPACE: 32,
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
      SHIFT: 16,
      CTRL: 17,
      ALT: 18,
      PAGE_UP: 33,
      PAGE_DOWN: 34,
      HOME: 36,
      END: 35,
      BACKSPACE: 8,
      DELETE: 46,
      isArrow: function (k) {
        k = k.which ? k.which : k;
        switch (k) {
          case KEY.LEFT:
          case KEY.RIGHT:
          case KEY.UP:
          case KEY.DOWN:
            return true;
        }
        return false;
      },
      isControl: function (e) {
        var k = e.which;
        switch (k) {
          case KEY.SHIFT:
          case KEY.CTRL:
          case KEY.ALT:
            return true;
        }
        if (e.metaKey) return true;
        return false;
      },
      isFunctionKey: function (k) {
        k = k.which ? k.which : k;
        return k >= 112 && k <= 123;
      },
    },
    MEASURE_SCROLLBAR_TEMPLATE = "<div class='select2-measure-scrollbar'></div>",
    DIACRITICS = {
      "\u24B6": "A",
      "\uFF21": "A",
      "\u00C0": "A",
      "\u00C1": "A",
      "\u00C2": "A",
      "\u1EA6": "A",
      "\u1EA4": "A",
      "\u1EAA": "A",
      "\u1EA8": "A",
      "\u00C3": "A",
      "\u0100": "A",
      "\u0102": "A",
      "\u1EB0": "A",
      "\u1EAE": "A",
      "\u1EB4": "A",
      "\u1EB2": "A",
      "\u0226": "A",
      "\u01E0": "A",
      "\u00C4": "A",
      "\u01DE": "A",
      "\u1EA2": "A",
      "\u00C5": "A",
      "\u01FA": "A",
      "\u01CD": "A",
      "\u0200": "A",
      "\u0202": "A",
      "\u1EA0": "A",
      "\u1EAC": "A",
      "\u1EB6": "A",
      "\u1E00": "A",
      "\u0104": "A",
      "\u023A": "A",
      "\u2C6F": "A",
      "\uA732": "AA",
      "\u00C6": "AE",
      "\u01FC": "AE",
      "\u01E2": "AE",
      "\uA734": "AO",
      "\uA736": "AU",
      "\uA738": "AV",
      "\uA73A": "AV",
      "\uA73C": "AY",
      "\u24B7": "B",
      "\uFF22": "B",
      "\u1E02": "B",
      "\u1E04": "B",
      "\u1E06": "B",
      "\u0243": "B",
      "\u0182": "B",
      "\u0181": "B",
      "\u24B8": "C",
      "\uFF23": "C",
      "\u0106": "C",
      "\u0108": "C",
      "\u010A": "C",
      "\u010C": "C",
      "\u00C7": "C",
      "\u1E08": "C",
      "\u0187": "C",
      "\u023B": "C",
      "\uA73E": "C",
      "\u24B9": "D",
      "\uFF24": "D",
      "\u1E0A": "D",
      "\u010E": "D",
      "\u1E0C": "D",
      "\u1E10": "D",
      "\u1E12": "D",
      "\u1E0E": "D",
      "\u0110": "D",
      "\u018B": "D",
      "\u018A": "D",
      "\u0189": "D",
      "\uA779": "D",
      "\u01F1": "DZ",
      "\u01C4": "DZ",
      "\u01F2": "Dz",
      "\u01C5": "Dz",
      "\u24BA": "E",
      "\uFF25": "E",
      "\u00C8": "E",
      "\u00C9": "E",
      "\u00CA": "E",
      "\u1EC0": "E",
      "\u1EBE": "E",
      "\u1EC4": "E",
      "\u1EC2": "E",
      "\u1EBC": "E",
      "\u0112": "E",
      "\u1E14": "E",
      "\u1E16": "E",
      "\u0114": "E",
      "\u0116": "E",
      "\u00CB": "E",
      "\u1EBA": "E",
      "\u011A": "E",
      "\u0204": "E",
      "\u0206": "E",
      "\u1EB8": "E",
      "\u1EC6": "E",
      "\u0228": "E",
      "\u1E1C": "E",
      "\u0118": "E",
      "\u1E18": "E",
      "\u1E1A": "E",
      "\u0190": "E",
      "\u018E": "E",
      "\u24BB": "F",
      "\uFF26": "F",
      "\u1E1E": "F",
      "\u0191": "F",
      "\uA77B": "F",
      "\u24BC": "G",
      "\uFF27": "G",
      "\u01F4": "G",
      "\u011C": "G",
      "\u1E20": "G",
      "\u011E": "G",
      "\u0120": "G",
      "\u01E6": "G",
      "\u0122": "G",
      "\u01E4": "G",
      "\u0193": "G",
      "\uA7A0": "G",
      "\uA77D": "G",
      "\uA77E": "G",
      "\u24BD": "H",
      "\uFF28": "H",
      "\u0124": "H",
      "\u1E22": "H",
      "\u1E26": "H",
      "\u021E": "H",
      "\u1E24": "H",
      "\u1E28": "H",
      "\u1E2A": "H",
      "\u0126": "H",
      "\u2C67": "H",
      "\u2C75": "H",
      "\uA78D": "H",
      "\u24BE": "I",
      "\uFF29": "I",
      "\u00CC": "I",
      "\u00CD": "I",
      "\u00CE": "I",
      "\u0128": "I",
      "\u012A": "I",
      "\u012C": "I",
      "\u0130": "I",
      "\u00CF": "I",
      "\u1E2E": "I",
      "\u1EC8": "I",
      "\u01CF": "I",
      "\u0208": "I",
      "\u020A": "I",
      "\u1ECA": "I",
      "\u012E": "I",
      "\u1E2C": "I",
      "\u0197": "I",
      "\u24BF": "J",
      "\uFF2A": "J",
      "\u0134": "J",
      "\u0248": "J",
      "\u24C0": "K",
      "\uFF2B": "K",
      "\u1E30": "K",
      "\u01E8": "K",
      "\u1E32": "K",
      "\u0136": "K",
      "\u1E34": "K",
      "\u0198": "K",
      "\u2C69": "K",
      "\uA740": "K",
      "\uA742": "K",
      "\uA744": "K",
      "\uA7A2": "K",
      "\u24C1": "L",
      "\uFF2C": "L",
      "\u013F": "L",
      "\u0139": "L",
      "\u013D": "L",
      "\u1E36": "L",
      "\u1E38": "L",
      "\u013B": "L",
      "\u1E3C": "L",
      "\u1E3A": "L",
      "\u0141": "L",
      "\u023D": "L",
      "\u2C62": "L",
      "\u2C60": "L",
      "\uA748": "L",
      "\uA746": "L",
      "\uA780": "L",
      "\u01C7": "LJ",
      "\u01C8": "Lj",
      "\u24C2": "M",
      "\uFF2D": "M",
      "\u1E3E": "M",
      "\u1E40": "M",
      "\u1E42": "M",
      "\u2C6E": "M",
      "\u019C": "M",
      "\u24C3": "N",
      "\uFF2E": "N",
      "\u01F8": "N",
      "\u0143": "N",
      "\u00D1": "N",
      "\u1E44": "N",
      "\u0147": "N",
      "\u1E46": "N",
      "\u0145": "N",
      "\u1E4A": "N",
      "\u1E48": "N",
      "\u0220": "N",
      "\u019D": "N",
      "\uA790": "N",
      "\uA7A4": "N",
      "\u01CA": "NJ",
      "\u01CB": "Nj",
      "\u24C4": "O",
      "\uFF2F": "O",
      "\u00D2": "O",
      "\u00D3": "O",
      "\u00D4": "O",
      "\u1ED2": "O",
      "\u1ED0": "O",
      "\u1ED6": "O",
      "\u1ED4": "O",
      "\u00D5": "O",
      "\u1E4C": "O",
      "\u022C": "O",
      "\u1E4E": "O",
      "\u014C": "O",
      "\u1E50": "O",
      "\u1E52": "O",
      "\u014E": "O",
      "\u022E": "O",
      "\u0230": "O",
      "\u00D6": "O",
      "\u022A": "O",
      "\u1ECE": "O",
      "\u0150": "O",
      "\u01D1": "O",
      "\u020C": "O",
      "\u020E": "O",
      "\u01A0": "O",
      "\u1EDC": "O",
      "\u1EDA": "O",
      "\u1EE0": "O",
      "\u1EDE": "O",
      "\u1EE2": "O",
      "\u1ECC": "O",
      "\u1ED8": "O",
      "\u01EA": "O",
      "\u01EC": "O",
      "\u00D8": "O",
      "\u01FE": "O",
      "\u0186": "O",
      "\u019F": "O",
      "\uA74A": "O",
      "\uA74C": "O",
      "\u01A2": "OI",
      "\uA74E": "OO",
      "\u0222": "OU",
      "\u24C5": "P",
      "\uFF30": "P",
      "\u1E54": "P",
      "\u1E56": "P",
      "\u01A4": "P",
      "\u2C63": "P",
      "\uA750": "P",
      "\uA752": "P",
      "\uA754": "P",
      "\u24C6": "Q",
      "\uFF31": "Q",
      "\uA756": "Q",
      "\uA758": "Q",
      "\u024A": "Q",
      "\u24C7": "R",
      "\uFF32": "R",
      "\u0154": "R",
      "\u1E58": "R",
      "\u0158": "R",
      "\u0210": "R",
      "\u0212": "R",
      "\u1E5A": "R",
      "\u1E5C": "R",
      "\u0156": "R",
      "\u1E5E": "R",
      "\u024C": "R",
      "\u2C64": "R",
      "\uA75A": "R",
      "\uA7A6": "R",
      "\uA782": "R",
      "\u24C8": "S",
      "\uFF33": "S",
      "\u1E9E": "S",
      "\u015A": "S",
      "\u1E64": "S",
      "\u015C": "S",
      "\u1E60": "S",
      "\u0160": "S",
      "\u1E66": "S",
      "\u1E62": "S",
      "\u1E68": "S",
      "\u0218": "S",
      "\u015E": "S",
      "\u2C7E": "S",
      "\uA7A8": "S",
      "\uA784": "S",
      "\u24C9": "T",
      "\uFF34": "T",
      "\u1E6A": "T",
      "\u0164": "T",
      "\u1E6C": "T",
      "\u021A": "T",
      "\u0162": "T",
      "\u1E70": "T",
      "\u1E6E": "T",
      "\u0166": "T",
      "\u01AC": "T",
      "\u01AE": "T",
      "\u023E": "T",
      "\uA786": "T",
      "\uA728": "TZ",
      "\u24CA": "U",
      "\uFF35": "U",
      "\u00D9": "U",
      "\u00DA": "U",
      "\u00DB": "U",
      "\u0168": "U",
      "\u1E78": "U",
      "\u016A": "U",
      "\u1E7A": "U",
      "\u016C": "U",
      "\u00DC": "U",
      "\u01DB": "U",
      "\u01D7": "U",
      "\u01D5": "U",
      "\u01D9": "U",
      "\u1EE6": "U",
      "\u016E": "U",
      "\u0170": "U",
      "\u01D3": "U",
      "\u0214": "U",
      "\u0216": "U",
      "\u01AF": "U",
      "\u1EEA": "U",
      "\u1EE8": "U",
      "\u1EEE": "U",
      "\u1EEC": "U",
      "\u1EF0": "U",
      "\u1EE4": "U",
      "\u1E72": "U",
      "\u0172": "U",
      "\u1E76": "U",
      "\u1E74": "U",
      "\u0244": "U",
      "\u24CB": "V",
      "\uFF36": "V",
      "\u1E7C": "V",
      "\u1E7E": "V",
      "\u01B2": "V",
      "\uA75E": "V",
      "\u0245": "V",
      "\uA760": "VY",
      "\u24CC": "W",
      "\uFF37": "W",
      "\u1E80": "W",
      "\u1E82": "W",
      "\u0174": "W",
      "\u1E86": "W",
      "\u1E84": "W",
      "\u1E88": "W",
      "\u2C72": "W",
      "\u24CD": "X",
      "\uFF38": "X",
      "\u1E8A": "X",
      "\u1E8C": "X",
      "\u24CE": "Y",
      "\uFF39": "Y",
      "\u1EF2": "Y",
      "\u00DD": "Y",
      "\u0176": "Y",
      "\u1EF8": "Y",
      "\u0232": "Y",
      "\u1E8E": "Y",
      "\u0178": "Y",
      "\u1EF6": "Y",
      "\u1EF4": "Y",
      "\u01B3": "Y",
      "\u024E": "Y",
      "\u1EFE": "Y",
      "\u24CF": "Z",
      "\uFF3A": "Z",
      "\u0179": "Z",
      "\u1E90": "Z",
      "\u017B": "Z",
      "\u017D": "Z",
      "\u1E92": "Z",
      "\u1E94": "Z",
      "\u01B5": "Z",
      "\u0224": "Z",
      "\u2C7F": "Z",
      "\u2C6B": "Z",
      "\uA762": "Z",
      "\u24D0": "a",
      "\uFF41": "a",
      "\u1E9A": "a",
      "\u00E0": "a",
      "\u00E1": "a",
      "\u00E2": "a",
      "\u1EA7": "a",
      "\u1EA5": "a",
      "\u1EAB": "a",
      "\u1EA9": "a",
      "\u00E3": "a",
      "\u0101": "a",
      "\u0103": "a",
      "\u1EB1": "a",
      "\u1EAF": "a",
      "\u1EB5": "a",
      "\u1EB3": "a",
      "\u0227": "a",
      "\u01E1": "a",
      "\u00E4": "a",
      "\u01DF": "a",
      "\u1EA3": "a",
      "\u00E5": "a",
      "\u01FB": "a",
      "\u01CE": "a",
      "\u0201": "a",
      "\u0203": "a",
      "\u1EA1": "a",
      "\u1EAD": "a",
      "\u1EB7": "a",
      "\u1E01": "a",
      "\u0105": "a",
      "\u2C65": "a",
      "\u0250": "a",
      "\uA733": "aa",
      "\u00E6": "ae",
      "\u01FD": "ae",
      "\u01E3": "ae",
      "\uA735": "ao",
      "\uA737": "au",
      "\uA739": "av",
      "\uA73B": "av",
      "\uA73D": "ay",
      "\u24D1": "b",
      "\uFF42": "b",
      "\u1E03": "b",
      "\u1E05": "b",
      "\u1E07": "b",
      "\u0180": "b",
      "\u0183": "b",
      "\u0253": "b",
      "\u24D2": "c",
      "\uFF43": "c",
      "\u0107": "c",
      "\u0109": "c",
      "\u010B": "c",
      "\u010D": "c",
      "\u00E7": "c",
      "\u1E09": "c",
      "\u0188": "c",
      "\u023C": "c",
      "\uA73F": "c",
      "\u2184": "c",
      "\u24D3": "d",
      "\uFF44": "d",
      "\u1E0B": "d",
      "\u010F": "d",
      "\u1E0D": "d",
      "\u1E11": "d",
      "\u1E13": "d",
      "\u1E0F": "d",
      "\u0111": "d",
      "\u018C": "d",
      "\u0256": "d",
      "\u0257": "d",
      "\uA77A": "d",
      "\u01F3": "dz",
      "\u01C6": "dz",
      "\u24D4": "e",
      "\uFF45": "e",
      "\u00E8": "e",
      "\u00E9": "e",
      "\u00EA": "e",
      "\u1EC1": "e",
      "\u1EBF": "e",
      "\u1EC5": "e",
      "\u1EC3": "e",
      "\u1EBD": "e",
      "\u0113": "e",
      "\u1E15": "e",
      "\u1E17": "e",
      "\u0115": "e",
      "\u0117": "e",
      "\u00EB": "e",
      "\u1EBB": "e",
      "\u011B": "e",
      "\u0205": "e",
      "\u0207": "e",
      "\u1EB9": "e",
      "\u1EC7": "e",
      "\u0229": "e",
      "\u1E1D": "e",
      "\u0119": "e",
      "\u1E19": "e",
      "\u1E1B": "e",
      "\u0247": "e",
      "\u025B": "e",
      "\u01DD": "e",
      "\u24D5": "f",
      "\uFF46": "f",
      "\u1E1F": "f",
      "\u0192": "f",
      "\uA77C": "f",
      "\u24D6": "g",
      "\uFF47": "g",
      "\u01F5": "g",
      "\u011D": "g",
      "\u1E21": "g",
      "\u011F": "g",
      "\u0121": "g",
      "\u01E7": "g",
      "\u0123": "g",
      "\u01E5": "g",
      "\u0260": "g",
      "\uA7A1": "g",
      "\u1D79": "g",
      "\uA77F": "g",
      "\u24D7": "h",
      "\uFF48": "h",
      "\u0125": "h",
      "\u1E23": "h",
      "\u1E27": "h",
      "\u021F": "h",
      "\u1E25": "h",
      "\u1E29": "h",
      "\u1E2B": "h",
      "\u1E96": "h",
      "\u0127": "h",
      "\u2C68": "h",
      "\u2C76": "h",
      "\u0265": "h",
      "\u0195": "hv",
      "\u24D8": "i",
      "\uFF49": "i",
      "\u00EC": "i",
      "\u00ED": "i",
      "\u00EE": "i",
      "\u0129": "i",
      "\u012B": "i",
      "\u012D": "i",
      "\u00EF": "i",
      "\u1E2F": "i",
      "\u1EC9": "i",
      "\u01D0": "i",
      "\u0209": "i",
      "\u020B": "i",
      "\u1ECB": "i",
      "\u012F": "i",
      "\u1E2D": "i",
      "\u0268": "i",
      "\u0131": "i",
      "\u24D9": "j",
      "\uFF4A": "j",
      "\u0135": "j",
      "\u01F0": "j",
      "\u0249": "j",
      "\u24DA": "k",
      "\uFF4B": "k",
      "\u1E31": "k",
      "\u01E9": "k",
      "\u1E33": "k",
      "\u0137": "k",
      "\u1E35": "k",
      "\u0199": "k",
      "\u2C6A": "k",
      "\uA741": "k",
      "\uA743": "k",
      "\uA745": "k",
      "\uA7A3": "k",
      "\u24DB": "l",
      "\uFF4C": "l",
      "\u0140": "l",
      "\u013A": "l",
      "\u013E": "l",
      "\u1E37": "l",
      "\u1E39": "l",
      "\u013C": "l",
      "\u1E3D": "l",
      "\u1E3B": "l",
      "\u017F": "l",
      "\u0142": "l",
      "\u019A": "l",
      "\u026B": "l",
      "\u2C61": "l",
      "\uA749": "l",
      "\uA781": "l",
      "\uA747": "l",
      "\u01C9": "lj",
      "\u24DC": "m",
      "\uFF4D": "m",
      "\u1E3F": "m",
      "\u1E41": "m",
      "\u1E43": "m",
      "\u0271": "m",
      "\u026F": "m",
      "\u24DD": "n",
      "\uFF4E": "n",
      "\u01F9": "n",
      "\u0144": "n",
      "\u00F1": "n",
      "\u1E45": "n",
      "\u0148": "n",
      "\u1E47": "n",
      "\u0146": "n",
      "\u1E4B": "n",
      "\u1E49": "n",
      "\u019E": "n",
      "\u0272": "n",
      "\u0149": "n",
      "\uA791": "n",
      "\uA7A5": "n",
      "\u01CC": "nj",
      "\u24DE": "o",
      "\uFF4F": "o",
      "\u00F2": "o",
      "\u00F3": "o",
      "\u00F4": "o",
      "\u1ED3": "o",
      "\u1ED1": "o",
      "\u1ED7": "o",
      "\u1ED5": "o",
      "\u00F5": "o",
      "\u1E4D": "o",
      "\u022D": "o",
      "\u1E4F": "o",
      "\u014D": "o",
      "\u1E51": "o",
      "\u1E53": "o",
      "\u014F": "o",
      "\u022F": "o",
      "\u0231": "o",
      "\u00F6": "o",
      "\u022B": "o",
      "\u1ECF": "o",
      "\u0151": "o",
      "\u01D2": "o",
      "\u020D": "o",
      "\u020F": "o",
      "\u01A1": "o",
      "\u1EDD": "o",
      "\u1EDB": "o",
      "\u1EE1": "o",
      "\u1EDF": "o",
      "\u1EE3": "o",
      "\u1ECD": "o",
      "\u1ED9": "o",
      "\u01EB": "o",
      "\u01ED": "o",
      "\u00F8": "o",
      "\u01FF": "o",
      "\u0254": "o",
      "\uA74B": "o",
      "\uA74D": "o",
      "\u0275": "o",
      "\u01A3": "oi",
      "\u0223": "ou",
      "\uA74F": "oo",
      "\u24DF": "p",
      "\uFF50": "p",
      "\u1E55": "p",
      "\u1E57": "p",
      "\u01A5": "p",
      "\u1D7D": "p",
      "\uA751": "p",
      "\uA753": "p",
      "\uA755": "p",
      "\u24E0": "q",
      "\uFF51": "q",
      "\u024B": "q",
      "\uA757": "q",
      "\uA759": "q",
      "\u24E1": "r",
      "\uFF52": "r",
      "\u0155": "r",
      "\u1E59": "r",
      "\u0159": "r",
      "\u0211": "r",
      "\u0213": "r",
      "\u1E5B": "r",
      "\u1E5D": "r",
      "\u0157": "r",
      "\u1E5F": "r",
      "\u024D": "r",
      "\u027D": "r",
      "\uA75B": "r",
      "\uA7A7": "r",
      "\uA783": "r",
      "\u24E2": "s",
      "\uFF53": "s",
      "\u00DF": "s",
      "\u015B": "s",
      "\u1E65": "s",
      "\u015D": "s",
      "\u1E61": "s",
      "\u0161": "s",
      "\u1E67": "s",
      "\u1E63": "s",
      "\u1E69": "s",
      "\u0219": "s",
      "\u015F": "s",
      "\u023F": "s",
      "\uA7A9": "s",
      "\uA785": "s",
      "\u1E9B": "s",
      "\u24E3": "t",
      "\uFF54": "t",
      "\u1E6B": "t",
      "\u1E97": "t",
      "\u0165": "t",
      "\u1E6D": "t",
      "\u021B": "t",
      "\u0163": "t",
      "\u1E71": "t",
      "\u1E6F": "t",
      "\u0167": "t",
      "\u01AD": "t",
      "\u0288": "t",
      "\u2C66": "t",
      "\uA787": "t",
      "\uA729": "tz",
      "\u24E4": "u",
      "\uFF55": "u",
      "\u00F9": "u",
      "\u00FA": "u",
      "\u00FB": "u",
      "\u0169": "u",
      "\u1E79": "u",
      "\u016B": "u",
      "\u1E7B": "u",
      "\u016D": "u",
      "\u00FC": "u",
      "\u01DC": "u",
      "\u01D8": "u",
      "\u01D6": "u",
      "\u01DA": "u",
      "\u1EE7": "u",
      "\u016F": "u",
      "\u0171": "u",
      "\u01D4": "u",
      "\u0215": "u",
      "\u0217": "u",
      "\u01B0": "u",
      "\u1EEB": "u",
      "\u1EE9": "u",
      "\u1EEF": "u",
      "\u1EED": "u",
      "\u1EF1": "u",
      "\u1EE5": "u",
      "\u1E73": "u",
      "\u0173": "u",
      "\u1E77": "u",
      "\u1E75": "u",
      "\u0289": "u",
      "\u24E5": "v",
      "\uFF56": "v",
      "\u1E7D": "v",
      "\u1E7F": "v",
      "\u028B": "v",
      "\uA75F": "v",
      "\u028C": "v",
      "\uA761": "vy",
      "\u24E6": "w",
      "\uFF57": "w",
      "\u1E81": "w",
      "\u1E83": "w",
      "\u0175": "w",
      "\u1E87": "w",
      "\u1E85": "w",
      "\u1E98": "w",
      "\u1E89": "w",
      "\u2C73": "w",
      "\u24E7": "x",
      "\uFF58": "x",
      "\u1E8B": "x",
      "\u1E8D": "x",
      "\u24E8": "y",
      "\uFF59": "y",
      "\u1EF3": "y",
      "\u00FD": "y",
      "\u0177": "y",
      "\u1EF9": "y",
      "\u0233": "y",
      "\u1E8F": "y",
      "\u00FF": "y",
      "\u1EF7": "y",
      "\u1E99": "y",
      "\u1EF5": "y",
      "\u01B4": "y",
      "\u024F": "y",
      "\u1EFF": "y",
      "\u24E9": "z",
      "\uFF5A": "z",
      "\u017A": "z",
      "\u1E91": "z",
      "\u017C": "z",
      "\u017E": "z",
      "\u1E93": "z",
      "\u1E95": "z",
      "\u01B6": "z",
      "\u0225": "z",
      "\u0240": "z",
      "\u2C6C": "z",
      "\uA763": "z",
      "\u0386": "\u0391",
      "\u0388": "\u0395",
      "\u0389": "\u0397",
      "\u038A": "\u0399",
      "\u03AA": "\u0399",
      "\u038C": "\u039F",
      "\u038E": "\u03A5",
      "\u03AB": "\u03A5",
      "\u038F": "\u03A9",
      "\u03AC": "\u03B1",
      "\u03AD": "\u03B5",
      "\u03AE": "\u03B7",
      "\u03AF": "\u03B9",
      "\u03CA": "\u03B9",
      "\u0390": "\u03B9",
      "\u03CC": "\u03BF",
      "\u03CD": "\u03C5",
      "\u03CB": "\u03C5",
      "\u03B0": "\u03C5",
      "\u03C9": "\u03C9",
      "\u03C2": "\u03C3",
    };
  $document = $(document);
  nextUid = (function () {
    var counter = 1;
    return function () {
      return counter++;
    };
  })();
  function reinsertElement(element) {
    var placeholder = $(document.createTextNode(""));
    element.before(placeholder);
    placeholder.before(element);
    placeholder.remove();
  }
  function stripDiacritics(str) {
    function match(a) {
      return DIACRITICS[a] || a;
    }
    return str.replace(/[^\u0000-\u007E]/g, match);
  }
  function indexOf(value, array) {
    var i = 0,
      l = array.length;
    for (; i < l; i = i + 1) {
      if (equal(value, array[i])) return i;
    }
    return -1;
  }
  function measureScrollbar() {
    var $template = $(MEASURE_SCROLLBAR_TEMPLATE);
    $template.appendTo(document.body);
    var dim = { width: $template.width() - $template[0].clientWidth, height: $template.height() - $template[0].clientHeight };
    $template.remove();
    return dim;
  }
  function equal(a, b) {
    if (a === b) return true;
    if (a === undefined || b === undefined) return false;
    if (a === null || b === null) return false;
    if (a.constructor === String) return a + "" === b + "";
    if (b.constructor === String) return b + "" === a + "";
    return false;
  }
  function splitVal(string, separator, transform) {
    var val, i, l;
    if (string === null || string.length < 1) return [];
    val = string.split(separator);
    for (i = 0, l = val.length; i < l; i = i + 1) val[i] = transform(val[i]);
    return val;
  }
  function getSideBorderPadding(element) {
    return element.outerWidth(false) - element.width();
  }
  function installKeyUpChangeEvent(element) {
    var key = "keyup-change-value";
    element.on("keydown", function () {
      if ($.data(element, key) === undefined) {
        $.data(element, key, element.val());
      }
    });
    element.on("keyup", function () {
      var val = $.data(element, key);
      if (val !== undefined && element.val() !== val) {
        $.removeData(element, key);
        element.trigger("keyup-change");
      }
    });
  }
  function installFilteredMouseMove(element) {
    element.on("mousemove", function (e) {
      var lastpos = lastMousePosition;
      if (lastpos === undefined || lastpos.x !== e.pageX || lastpos.y !== e.pageY) {
        $(e.target).trigger("mousemove-filtered", e);
      }
    });
  }
  function debounce(quietMillis, fn, ctx) {
    ctx = ctx || undefined;
    var timeout;
    return function () {
      var args = arguments;
      window.clearTimeout(timeout);
      timeout = window.setTimeout(function () {
        fn.apply(ctx, args);
      }, quietMillis);
    };
  }
  function installDebouncedScroll(threshold, element) {
    var notify = debounce(threshold, function (e) {
      element.trigger("scroll-debounced", e);
    });
    element.on("scroll", function (e) {
      if (indexOf(e.target, element.get()) >= 0) notify(e);
    });
  }
  function focus($el) {
    if ($el[0] === document.activeElement) return;
    window.setTimeout(function () {
      var el = $el[0],
        pos = $el.val().length,
        range;
      $el.focus();
      var isVisible = el.offsetWidth > 0 || el.offsetHeight > 0;
      if (isVisible && el === document.activeElement) {
        if (el.setSelectionRange) {
          el.setSelectionRange(pos, pos);
        } else if (el.createTextRange) {
          range = el.createTextRange();
          range.collapse(false);
          range.select();
        }
      }
    }, 0);
  }
  function getCursorInfo(el) {
    el = $(el)[0];
    var offset = 0;
    var length = 0;
    if ("selectionStart" in el) {
      offset = el.selectionStart;
      length = el.selectionEnd - offset;
    } else if ("selection" in document) {
      el.focus();
      var sel = document.selection.createRange();
      length = document.selection.createRange().text.length;
      sel.moveStart("character", -el.value.length);
      offset = sel.text.length - length;
    }
    return { offset: offset, length: length };
  }
  function killEvent(event) {
    event.preventDefault();
    event.stopPropagation();
  }
  function killEventImmediately(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  function measureTextWidth(e) {
    if (!sizer) {
      var style = e[0].currentStyle || window.getComputedStyle(e[0], null);
      sizer = $(document.createElement("div")).css({
        position: "absolute",
        left: "-10000px",
        top: "-10000px",
        display: "none",
        fontSize: style.fontSize,
        fontFamily: style.fontFamily,
        fontStyle: style.fontStyle,
        fontWeight: style.fontWeight,
        letterSpacing: style.letterSpacing,
        textTransform: style.textTransform,
        whiteSpace: "nowrap",
      });
      sizer.attr("class", "select2-sizer");
      $(document.body).append(sizer);
    }
    sizer.text(e.val());
    return sizer.width();
  }
  function syncCssClasses(dest, src, adapter) {
    var classes,
      replacements = [],
      adapted;
    classes = $.trim(dest.attr("class"));
    if (classes) {
      classes = "" + classes;
      $(classes.split(/\s+/)).each2(function () {
        if (this.indexOf("select2-") === 0) {
          replacements.push(this);
        }
      });
    }
    classes = $.trim(src.attr("class"));
    if (classes) {
      classes = "" + classes;
      $(classes.split(/\s+/)).each2(function () {
        if (this.indexOf("select2-") !== 0) {
          adapted = adapter(this);
          if (adapted) {
            replacements.push(adapted);
          }
        }
      });
    }
    dest.attr("class", replacements.join(" "));
  }
  function markMatch(text, term, markup, escapeMarkup) {
    var match = stripDiacritics(text.toUpperCase()).indexOf(stripDiacritics(term.toUpperCase())),
      tl = term.length;
    if (match < 0) {
      markup.push(escapeMarkup(text));
      return;
    }
    markup.push(escapeMarkup(text.substring(0, match)));
    markup.push("<span class='select2-match'>");
    markup.push(escapeMarkup(text.substring(match, match + tl)));
    markup.push("</span>");
    markup.push(escapeMarkup(text.substring(match + tl, text.length)));
  }
  function defaultEscapeMarkup(markup) {
    var replace_map = { "\\": "&#92;", "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "/": "&#47;" };
    return String(markup).replace(/[&<>"'\/\\]/g, function (match) {
      return replace_map[match];
    });
  }
  function ajax(options) {
    var timeout,
      handler = null,
      quietMillis = options.quietMillis || 100,
      ajaxUrl = options.url,
      self = this;
    return function (query) {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(function () {
        var data = options.data,
          url = ajaxUrl,
          transport = options.transport || $.fn.select2.ajaxDefaults.transport,
          deprecated = {
            type: options.type || "GET",
            cache: options.cache || false,
            jsonpCallback: options.jsonpCallback || undefined,
            dataType: options.dataType || "json",
          },
          params = $.extend({}, $.fn.select2.ajaxDefaults.params, deprecated);
        data = data ? data.call(self, query.term, query.page, query.context) : null;
        url = typeof url === "function" ? url.call(self, query.term, query.page, query.context) : url;
        if (handler && typeof handler.abort === "function") {
          handler.abort();
        }
        if (options.params) {
          if ($.isFunction(options.params)) {
            $.extend(params, options.params.call(self));
          } else {
            $.extend(params, options.params);
          }
        }
        $.extend(params, {
          url: url,
          dataType: options.dataType,
          data: data,
          success: function (data) {
            var results = options.results(data, query.page, query);
            query.callback(results);
          },
          error: function (jqXHR, textStatus, errorThrown) {
            var results = { hasError: true, jqXHR: jqXHR, textStatus: textStatus, errorThrown: errorThrown };
            query.callback(results);
          },
        });
        handler = transport.call(self, params);
      }, quietMillis);
    };
  }
  function local(options) {
    var data = options,
      dataText,
      tmp,
      text = function (item) {
        return "" + item.text;
      };
    if ($.isArray(data)) {
      tmp = data;
      data = { results: tmp };
    }
    if ($.isFunction(data) === false) {
      tmp = data;
      data = function () {
        return tmp;
      };
    }
    var dataItem = data();
    if (dataItem.text) {
      text = dataItem.text;
      if (!$.isFunction(text)) {
        dataText = dataItem.text;
        text = function (item) {
          return item[dataText];
        };
      }
    }
    return function (query) {
      var t = query.term,
        filtered = { results: [] },
        process;
      if (t === "") {
        query.callback(data());
        return;
      }
      process = function (datum, collection) {
        var group, attr;
        datum = datum[0];
        if (datum.children) {
          group = {};
          for (attr in datum) {
            if (datum.hasOwnProperty(attr)) group[attr] = datum[attr];
          }
          group.children = [];
          $(datum.children).each2(function (i, childDatum) {
            process(childDatum, group.children);
          });
          if (group.children.length || query.matcher(t, text(group), datum)) {
            collection.push(group);
          }
        } else {
          if (query.matcher(t, text(datum), datum)) {
            collection.push(datum);
          }
        }
      };
      $(data().results).each2(function (i, datum) {
        process(datum, filtered.results);
      });
      query.callback(filtered);
    };
  }
  function tags(data) {
    var isFunc = $.isFunction(data);
    return function (query) {
      var t = query.term,
        filtered = { results: [] };
      var result = isFunc ? data(query) : data;
      if ($.isArray(result)) {
        $(result).each(function () {
          var isObject = this.text !== undefined,
            text = isObject ? this.text : this;
          if (t === "" || query.matcher(t, text)) {
            filtered.results.push(isObject ? this : { id: this, text: this });
          }
        });
        query.callback(filtered);
      }
    };
  }
  function checkFormatter(formatter, formatterName) {
    if ($.isFunction(formatter)) return true;
    if (!formatter) return false;
    if (typeof formatter === "string") return true;
    throw new Error(formatterName + " must be a string, function, or falsy value");
  }
  function evaluate(val, context) {
    if ($.isFunction(val)) {
      var args = Array.prototype.slice.call(arguments, 2);
      return val.apply(context, args);
    }
    return val;
  }
  function countResults(results) {
    var count = 0;
    $.each(results, function (i, item) {
      if (item.children) {
        count += countResults(item.children);
      } else {
        count++;
      }
    });
    return count;
  }
  function defaultTokenizer(input, selection, selectCallback, opts) {
    var original = input,
      dupe = false,
      token,
      index,
      i,
      l,
      separator;
    if (!opts.createSearchChoice || !opts.tokenSeparators || opts.tokenSeparators.length < 1) return undefined;
    while (true) {
      index = -1;
      for (i = 0, l = opts.tokenSeparators.length; i < l; i++) {
        separator = opts.tokenSeparators[i];
        index = input.indexOf(separator);
        if (index >= 0) break;
      }
      if (index < 0) break;
      token = input.substring(0, index);
      input = input.substring(index + separator.length);
      if (token.length > 0) {
        token = opts.createSearchChoice.call(this, token, selection);
        if (token !== undefined && token !== null && opts.id(token) !== undefined && opts.id(token) !== null) {
          dupe = false;
          for (i = 0, l = selection.length; i < l; i++) {
            if (equal(opts.id(token), opts.id(selection[i]))) {
              dupe = true;
              break;
            }
          }
          if (!dupe) selectCallback(token);
        }
      }
    }
    if (original !== input) return input;
  }
  function cleanupJQueryElements() {
    var self = this;
    $.each(arguments, function (i, element) {
      self[element].remove();
      self[element] = null;
    });
  }
  function clazz(SuperClass, methods) {
    var constructor = function () {};
    constructor.prototype = new SuperClass();
    constructor.prototype.constructor = constructor;
    constructor.prototype.parent = SuperClass.prototype;
    constructor.prototype = $.extend(constructor.prototype, methods);
    return constructor;
  }
  AbstractSelect2 = clazz(Object, {
    bind: function (func) {
      var self = this;
      return function () {
        func.apply(self, arguments);
      };
    },
    init: function (opts) {
      var results,
        search,
        resultsSelector = ".select2-results";
      this.opts = opts = this.prepareOpts(opts);
      this.id = opts.id;
      if (opts.element.data("select2") !== undefined && opts.element.data("select2") !== null) {
        opts.element.data("select2").destroy();
      }
      this.container = this.createContainer();
      this.liveRegion = $(".select2-hidden-accessible");
      if (this.liveRegion.length == 0) {
        this.liveRegion = $("<span>", { role: "status", "aria-live": "polite" })
          .addClass("select2-hidden-accessible")
          .appendTo(document.body);
      }
      this.containerId = "s2id_" + (opts.element.attr("id") || "autogen" + nextUid());
      this.containerEventName = this.containerId.replace(/([.])/g, "_").replace(/([;&,\-\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, "\\$1");
      this.container.attr("id", this.containerId);
      this.container.attr("title", opts.element.attr("title"));
      this.body = $(document.body);
      syncCssClasses(this.container, this.opts.element, this.opts.adaptContainerCssClass);
      this.container.attr("style", opts.element.attr("style"));
      this.container.css(evaluate(opts.containerCss, this.opts.element));
      this.container.addClass(evaluate(opts.containerCssClass, this.opts.element));
      this.elementTabIndex = this.opts.element.attr("tabindex");
      this.opts.element.data("select2", this).attr("tabindex", "-1").before(this.container).on("click.select2", killEvent);
      this.container.data("select2", this);
      this.dropdown = this.container.find(".select2-drop");
      syncCssClasses(this.dropdown, this.opts.element, this.opts.adaptDropdownCssClass);
      this.dropdown.addClass(evaluate(opts.dropdownCssClass, this.opts.element));
      this.dropdown.data("select2", this);
      this.dropdown.on("click", killEvent);
      this.results = results = this.container.find(resultsSelector);
      this.search = search = this.container.find("input.select2-input");
      this.queryCount = 0;
      this.resultsPage = 0;
      this.context = null;
      this.initContainer();
      this.container.on("click", killEvent);
      installFilteredMouseMove(this.results);
      this.dropdown.on("mousemove-filtered", resultsSelector, this.bind(this.highlightUnderEvent));
      this.dropdown.on(
        "touchstart touchmove touchend",
        resultsSelector,
        this.bind(function (event) {
          this._touchEvent = true;
          this.highlightUnderEvent(event);
        })
      );
      this.dropdown.on("touchmove", resultsSelector, this.bind(this.touchMoved));
      this.dropdown.on("touchstart touchend", resultsSelector, this.bind(this.clearTouchMoved));
      this.dropdown.on(
        "click",
        this.bind(function (event) {
          if (this._touchEvent) {
            this._touchEvent = false;
            this.selectHighlighted();
          }
        })
      );
      installDebouncedScroll(80, this.results);
      this.dropdown.on("scroll-debounced", resultsSelector, this.bind(this.loadMoreIfNeeded));
      $(this.container).on("change", ".select2-input", function (e) {
        e.stopPropagation();
      });
      $(this.dropdown).on("change", ".select2-input", function (e) {
        e.stopPropagation();
      });
      if ($.fn.mousewheel) {
        results.mousewheel(function (e, delta, deltaX, deltaY) {
          var top = results.scrollTop();
          if (deltaY > 0 && top - deltaY <= 0) {
            results.scrollTop(0);
            killEvent(e);
          } else if (deltaY < 0 && results.get(0).scrollHeight - results.scrollTop() + deltaY <= results.height()) {
            results.scrollTop(results.get(0).scrollHeight - results.height());
            killEvent(e);
          }
        });
      }
      installKeyUpChangeEvent(search);
      search.on("keyup-change input paste", this.bind(this.updateResults));
      search.on("focus", function () {
        search.addClass("select2-focused");
      });
      search.on("blur", function () {
        search.removeClass("select2-focused");
      });
      this.dropdown.on(
        "mouseup",
        resultsSelector,
        this.bind(function (e) {
          if ($(e.target).closest(".select2-result-selectable").length > 0) {
            this.highlightUnderEvent(e);
            this.selectHighlighted(e);
          }
        })
      );
      this.dropdown.on("click mouseup mousedown touchstart touchend focusin", function (e) {
        e.stopPropagation();
      });
      this.nextSearchTerm = undefined;
      if ($.isFunction(this.opts.initSelection)) {
        this.initSelection();
        this.monitorSource();
      }
      if (opts.maximumInputLength !== null) {
        this.search.attr("maxlength", opts.maximumInputLength);
      }
      var disabled = opts.element.prop("disabled");
      if (disabled === undefined) disabled = false;
      this.enable(!disabled);
      var readonly = opts.element.prop("readonly");
      if (readonly === undefined) readonly = false;
      this.readonly(readonly);
      scrollBarDimensions = scrollBarDimensions || measureScrollbar();
      this.autofocus = opts.element.prop("autofocus");
      opts.element.prop("autofocus", false);
      if (this.autofocus) this.focus();
      this.search.attr("placeholder", opts.searchInputPlaceholder);
    },
    destroy: function () {
      var element = this.opts.element,
        select2 = element.data("select2"),
        self = this;
      this.close();
      if (element.length && element[0].detachEvent && self._sync) {
        element.each(function () {
          if (self._sync) {
            this.detachEvent("onpropertychange", self._sync);
          }
        });
      }
      if (this.propertyObserver) {
        this.propertyObserver.disconnect();
        this.propertyObserver = null;
      }
      this._sync = null;
      if (select2 !== undefined) {
        select2.container.remove();
        select2.liveRegion.remove();
        select2.dropdown.remove();
        element
          .show()
          .removeData("select2")
          .off(".select2")
          .prop("autofocus", this.autofocus || false);
        if (this.elementTabIndex) {
          element.attr({ tabindex: this.elementTabIndex });
        } else {
          element.removeAttr("tabindex");
        }
        element.show();
      }
      cleanupJQueryElements.call(this, "container", "liveRegion", "dropdown", "results", "search");
    },
    optionToData: function (element) {
      if (element.is("option")) {
        return {
          id: element.prop("value"),
          text: element.text(),
          element: element.get(),
          css: element.attr("class"),
          disabled: element.prop("disabled"),
          locked: equal(element.attr("locked"), "locked") || equal(element.data("locked"), true),
        };
      } else if (element.is("optgroup")) {
        return { text: element.attr("label"), children: [], element: element.get(), css: element.attr("class") };
      }
    },
    prepareOpts: function (opts) {
      var element,
        select,
        idKey,
        ajaxUrl,
        self = this;
      element = opts.element;
      if (element.get(0).tagName.toLowerCase() === "select") {
        this.select = select = opts.element;
      }
      if (select) {
        $.each(["id", "multiple", "ajax", "query", "createSearchChoice", "initSelection", "data", "tags"], function () {
          if (this in opts) {
            throw new Error("Option '" + this + "' is not allowed for Select2 when attached to a <select> element.");
          }
        });
      }
      opts = $.extend(
        {},
        {
          populateResults: function (container, results, query) {
            var populate,
              id = this.opts.id,
              liveRegion = this.liveRegion;
            populate = function (results, container, depth) {
              var i, l, result, selectable, disabled, compound, node, label, innerContainer, formatted;
              results = opts.sortResults(results, container, query);
              var nodes = [];
              for (i = 0, l = results.length; i < l; i = i + 1) {
                result = results[i];
                disabled = result.disabled === true;
                selectable = !disabled && id(result) !== undefined;
                compound = result.children && result.children.length > 0;
                node = $("<li></li>");
                node.addClass("select2-results-dept-" + depth);
                node.addClass("select2-result");
                node.addClass(selectable ? "select2-result-selectable" : "select2-result-unselectable");
                if (disabled) {
                  node.addClass("select2-disabled");
                }
                if (compound) {
                  node.addClass("select2-result-with-children");
                }
                node.addClass(self.opts.formatResultCssClass(result));
                node.attr("role", "presentation");
                label = $(document.createElement("div"));
                label.addClass("select2-result-label");
                label.attr("id", "select2-result-label-" + nextUid());
                label.attr("role", "option");
                formatted = opts.formatResult(result, label, query, self.opts.escapeMarkup);
                if (formatted !== undefined) {
                  label.html(formatted);
                  node.append(label);
                }
                if (compound) {
                  innerContainer = $("<ul></ul>");
                  innerContainer.addClass("select2-result-sub");
                  populate(result.children, innerContainer, depth + 1);
                  node.append(innerContainer);
                }
                node.data("select2-data", result);
                nodes.push(node[0]);
              }
              container.append(nodes);
              liveRegion.text(opts.formatMatches(results.length));
            };
            populate(results, container, 0);
          },
        },
        $.fn.select2.defaults,
        opts
      );
      if (typeof opts.id !== "function") {
        idKey = opts.id;
        opts.id = function (e) {
          return e[idKey];
        };
      }
      if ($.isArray(opts.element.data("select2Tags"))) {
        if ("tags" in opts) {
          throw "tags specified as both an attribute 'data-select2-tags' and in options of Select2 " + opts.element.attr("id");
        }
        opts.tags = opts.element.data("select2Tags");
      }
      if (select) {
        opts.query = this.bind(function (query) {
          var data = { results: [], more: false },
            term = query.term,
            children,
            placeholderOption,
            process;
          process = function (element, collection) {
            var group;
            if (element.is("option")) {
              if (query.matcher(term, element.text(), element)) {
                collection.push(self.optionToData(element));
              }
            } else if (element.is("optgroup")) {
              group = self.optionToData(element);
              element.children().each2(function (i, elm) {
                process(elm, group.children);
              });
              if (group.children.length > 0) {
                collection.push(group);
              }
            }
          };
          children = element.children();
          if (this.getPlaceholder() !== undefined && children.length > 0) {
            placeholderOption = this.getPlaceholderOption();
            if (placeholderOption) {
              children = children.not(placeholderOption);
            }
          }
          children.each2(function (i, elm) {
            process(elm, data.results);
          });
          query.callback(data);
        });
        opts.id = function (e) {
          return e.id;
        };
      } else {
        if (!("query" in opts)) {
          if ("ajax" in opts) {
            ajaxUrl = opts.element.data("ajax-url");
            if (ajaxUrl && ajaxUrl.length > 0) {
              opts.ajax.url = ajaxUrl;
            }
            opts.query = ajax.call(opts.element, opts.ajax);
          } else if ("data" in opts) {
            opts.query = local(opts.data);
          } else if ("tags" in opts) {
            opts.query = tags(opts.tags);
            if (opts.createSearchChoice === undefined) {
              opts.createSearchChoice = function (term) {
                return { id: $.trim(term), text: $.trim(term) };
              };
            }
            if (opts.initSelection === undefined) {
              opts.initSelection = function (element, callback) {
                var data = [];
                $(splitVal(element.val(), opts.separator, opts.transformVal)).each(function () {
                  var obj = { id: this, text: this },
                    tags = opts.tags;
                  if ($.isFunction(tags)) tags = tags();
                  $(tags).each(function () {
                    if (equal(this.id, obj.id)) {
                      obj = this;
                      return false;
                    }
                  });
                  data.push(obj);
                });
                callback(data);
              };
            }
          }
        }
      }
      if (typeof opts.query !== "function") {
        throw "query function not defined for Select2 " + opts.element.attr("id");
      }
      if (opts.createSearchChoicePosition === "top") {
        opts.createSearchChoicePosition = function (list, item) {
          list.unshift(item);
        };
      } else if (opts.createSearchChoicePosition === "bottom") {
        opts.createSearchChoicePosition = function (list, item) {
          list.push(item);
        };
      } else if (typeof opts.createSearchChoicePosition !== "function") {
        throw "invalid createSearchChoicePosition option must be 'top', 'bottom' or a custom function";
      }
      return opts;
    },
    monitorSource: function () {
      var el = this.opts.element,
        observer,
        self = this;
      el.on(
        "change.select2",
        this.bind(function (e) {
          if (this.opts.element.data("select2-change-triggered") !== true) {
            this.initSelection();
          }
        })
      );
      this._sync = this.bind(function () {
        var disabled = el.prop("disabled");
        if (disabled === undefined) disabled = false;
        this.enable(!disabled);
        var readonly = el.prop("readonly");
        if (readonly === undefined) readonly = false;
        this.readonly(readonly);
        if (this.container) {
          syncCssClasses(this.container, this.opts.element, this.opts.adaptContainerCssClass);
          this.container.addClass(evaluate(this.opts.containerCssClass, this.opts.element));
        }
        if (this.dropdown) {
          syncCssClasses(this.dropdown, this.opts.element, this.opts.adaptDropdownCssClass);
          this.dropdown.addClass(evaluate(this.opts.dropdownCssClass, this.opts.element));
        }
      });
      if (el.length && el[0].attachEvent) {
        el.each(function () {
          this.attachEvent("onpropertychange", self._sync);
        });
      }
      observer = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
      if (observer !== undefined) {
        if (this.propertyObserver) {
          delete this.propertyObserver;
          this.propertyObserver = null;
        }
        this.propertyObserver = new observer(function (mutations) {
          $.each(mutations, self._sync);
        });
        this.propertyObserver.observe(el.get(0), { attributes: true, subtree: false });
      }
    },
    triggerSelect: function (data) {
      var evt = $.Event("select2-selecting", { val: this.id(data), object: data, choice: data });
      this.opts.element.trigger(evt);
      return !evt.isDefaultPrevented();
    },
    triggerChange: function (details) {
      details = details || {};
      details = $.extend({}, details, { type: "change", val: this.val() });
      this.opts.element.data("select2-change-triggered", true);
      this.opts.element.trigger(details);
      this.opts.element.data("select2-change-triggered", false);
      this.opts.element.click();
      if (this.opts.blurOnChange) this.opts.element.blur();
    },
    isInterfaceEnabled: function () {
      return this.enabledInterface === true;
    },
    enableInterface: function () {
      var enabled = this._enabled && !this._readonly,
        disabled = !enabled;
      if (enabled === this.enabledInterface) return false;
      this.container.toggleClass("select2-container-disabled", disabled);
      this.close();
      this.enabledInterface = enabled;
      return true;
    },
    enable: function (enabled) {
      if (enabled === undefined) enabled = true;
      if (this._enabled === enabled) return;
      this._enabled = enabled;
      this.opts.element.prop("disabled", !enabled);
      this.enableInterface();
    },
    disable: function () {
      this.enable(false);
    },
    readonly: function (enabled) {
      if (enabled === undefined) enabled = false;
      if (this._readonly === enabled) return;
      this._readonly = enabled;
      this.opts.element.prop("readonly", enabled);
      this.enableInterface();
    },
    opened: function () {
      return this.container ? this.container.hasClass("select2-dropdown-open") : false;
    },
    positionDropdown: function () {
      var $dropdown = this.dropdown,
        container = this.container,
        offset = container.offset(),
        height = container.outerHeight(false),
        width = container.outerWidth(false),
        dropHeight = $dropdown.outerHeight(false),
        $window = $(window),
        windowWidth = $window.width(),
        windowHeight = $window.height(),
        viewPortRight = $window.scrollLeft() + windowWidth,
        viewportBottom = $window.scrollTop() + windowHeight,
        dropTop = offset.top + height,
        dropLeft = offset.left,
        enoughRoomBelow = dropTop + dropHeight <= viewportBottom,
        enoughRoomAbove = offset.top - dropHeight >= $window.scrollTop(),
        dropWidth = $dropdown.outerWidth(false),
        enoughRoomOnRight = function () {
          return dropLeft + dropWidth <= viewPortRight;
        },
        enoughRoomOnLeft = function () {
          return offset.left + viewPortRight + container.outerWidth(false) > dropWidth;
        },
        aboveNow = $dropdown.hasClass("select2-drop-above"),
        bodyOffset,
        above,
        changeDirection,
        css,
        resultsListNode;
      if (aboveNow) {
        above = true;
        if (!enoughRoomAbove && enoughRoomBelow) {
          changeDirection = true;
          above = false;
        }
      } else {
        above = false;
        if (!enoughRoomBelow && enoughRoomAbove) {
          changeDirection = true;
          above = true;
        }
      }
      if (changeDirection) {
        $dropdown.hide();
        offset = this.container.offset();
        height = this.container.outerHeight(false);
        width = this.container.outerWidth(false);
        dropHeight = $dropdown.outerHeight(false);
        viewPortRight = $window.scrollLeft() + windowWidth;
        viewportBottom = $window.scrollTop() + windowHeight;
        dropTop = offset.top + height;
        dropLeft = offset.left;
        dropWidth = $dropdown.outerWidth(false);
        $dropdown.show();
        this.focusSearch();
      }
      if (this.opts.dropdownAutoWidth) {
        resultsListNode = $(".select2-results", $dropdown)[0];
        $dropdown.addClass("select2-drop-auto-width");
        $dropdown.css("width", "");
        dropWidth =
          $dropdown.outerWidth(false) + (resultsListNode.scrollHeight === resultsListNode.clientHeight ? 0 : scrollBarDimensions.width);
        dropWidth > width ? (width = dropWidth) : (dropWidth = width);
        dropHeight = $dropdown.outerHeight(false);
      } else {
        this.container.removeClass("select2-drop-auto-width");
      }
      if (this.body.css("position") !== "static") {
        bodyOffset = this.body.offset();
        dropTop -= bodyOffset.top;
        dropLeft -= bodyOffset.left;
      }
      if (!enoughRoomOnRight() && enoughRoomOnLeft()) {
        dropLeft = offset.left + this.container.outerWidth(false) - dropWidth;
      }
      css = { left: dropLeft, width: width };
      if (above) {
        css.top = offset.top - dropHeight;
        css.bottom = "auto";
        this.container.addClass("select2-drop-above");
        $dropdown.addClass("select2-drop-above");
      } else {
        css.top = dropTop;
        css.bottom = "auto";
        this.container.removeClass("select2-drop-above");
        $dropdown.removeClass("select2-drop-above");
      }
      css = $.extend(css, evaluate(this.opts.dropdownCss, this.opts.element));
      $dropdown.css(css);
    },
    shouldOpen: function () {
      var event;
      if (this.opened()) return false;
      if (this._enabled === false || this._readonly === true) return false;
      event = $.Event("select2-opening");
      this.opts.element.trigger(event);
      return !event.isDefaultPrevented();
    },
    clearDropdownAlignmentPreference: function () {
      this.container.removeClass("select2-drop-above");
      this.dropdown.removeClass("select2-drop-above");
    },
    open: function () {
      if (!this.shouldOpen()) return false;
      this.opening();
      $document.on("mousemove.select2Event", function (e) {
        lastMousePosition.x = e.pageX;
        lastMousePosition.y = e.pageY;
      });
      return true;
    },
    opening: function () {
      var cid = this.containerEventName,
        scroll = "scroll." + cid,
        resize = "resize." + cid,
        orient = "orientationchange." + cid,
        mask;
      this.container.addClass("select2-dropdown-open").addClass("select2-container-active");
      this.clearDropdownAlignmentPreference();
      if (this.dropdown[0] !== this.body.children().last()[0]) {
        this.dropdown.detach().appendTo(this.body);
      }
      mask = $("#select2-drop-mask");
      if (mask.length === 0) {
        mask = $(document.createElement("div"));
        mask.attr("id", "select2-drop-mask").attr("class", "select2-drop-mask");
        mask.hide();
        mask.appendTo(this.body);
        mask.on("mousedown touchstart click", function (e) {
          reinsertElement(mask);
          var dropdown = $("#select2-drop"),
            self;
          if (dropdown.length > 0) {
            self = dropdown.data("select2");
            if (self.opts.selectOnBlur) {
              self.selectHighlighted({ noFocus: true });
            }
            self.close();
            e.preventDefault();
            e.stopPropagation();
          }
        });
      }
      if (this.dropdown.prev()[0] !== mask[0]) {
        this.dropdown.before(mask);
      }
      $("#select2-drop").removeAttr("id");
      this.dropdown.attr("id", "select2-drop");
      mask.show();
      this.positionDropdown();
      this.dropdown.show();
      this.positionDropdown();
      this.dropdown.addClass("select2-drop-active");
      var that = this;
      this.container
        .parents()
        .add(window)
        .each(function () {
          $(this).on(resize + " " + scroll + " " + orient, function (e) {
            if (that.opened()) that.positionDropdown();
          });
        });
    },
    close: function () {
      if (!this.opened()) return;
      var cid = this.containerEventName,
        scroll = "scroll." + cid,
        resize = "resize." + cid,
        orient = "orientationchange." + cid;
      this.container
        .parents()
        .add(window)
        .each(function () {
          $(this).off(scroll).off(resize).off(orient);
        });
      this.clearDropdownAlignmentPreference();
      $("#select2-drop-mask").hide();
      this.dropdown.removeAttr("id");
      this.dropdown.hide();
      this.container.removeClass("select2-dropdown-open").removeClass("select2-container-active");
      this.results.empty();
      $document.off("mousemove.select2Event");
      this.clearSearch();
      this.search.removeClass("select2-active");
      this.opts.element.trigger($.Event("select2-close"));
    },
    externalSearch: function (term) {
      this.open();
      this.search.val(term);
      this.updateResults(false);
    },
    clearSearch: function () {},
    getMaximumSelectionSize: function () {
      return evaluate(this.opts.maximumSelectionSize, this.opts.element);
    },
    ensureHighlightVisible: function () {
      var results = this.results,
        children,
        index,
        child,
        hb,
        rb,
        y,
        more,
        topOffset;
      index = this.highlight();
      if (index < 0) return;
      if (index == 0) {
        results.scrollTop(0);
        return;
      }
      children = this.findHighlightableChoices().find(".select2-result-label");
      child = $(children[index]);
      topOffset = (child.offset() || {}).top || 0;
      hb = topOffset + child.outerHeight(true);
      if (index === children.length - 1) {
        more = results.find("li.select2-more-results");
        if (more.length > 0) {
          hb = more.offset().top + more.outerHeight(true);
        }
      }
      rb = results.offset().top + results.outerHeight(false);
      if (hb > rb) {
        results.scrollTop(results.scrollTop() + (hb - rb));
      }
      y = topOffset - results.offset().top;
      if (y < 0 && child.css("display") != "none") {
        results.scrollTop(results.scrollTop() + y);
      }
    },
    findHighlightableChoices: function () {
      return this.results.find(".select2-result-selectable:not(.select2-disabled):not(.select2-selected)");
    },
    moveHighlight: function (delta) {
      var choices = this.findHighlightableChoices(),
        index = this.highlight();
      while (index > -1 && index < choices.length) {
        index += delta;
        var choice = $(choices[index]);
        if (choice.hasClass("select2-result-selectable") && !choice.hasClass("select2-disabled") && !choice.hasClass("select2-selected")) {
          this.highlight(index);
          break;
        }
      }
    },
    highlight: function (index) {
      var choices = this.findHighlightableChoices(),
        choice,
        data;
      if (arguments.length === 0) {
        return indexOf(choices.filter(".select2-highlighted")[0], choices.get());
      }
      if (index >= choices.length) index = choices.length - 1;
      if (index < 0) index = 0;
      this.removeHighlight();
      choice = $(choices[index]);
      choice.addClass("select2-highlighted");
      this.search.attr("aria-activedescendant", choice.find(".select2-result-label").attr("id"));
      this.ensureHighlightVisible();
      this.liveRegion.text(choice.text());
      data = choice.data("select2-data");
      if (data) {
        this.opts.element.trigger({ type: "select2-highlight", val: this.id(data), choice: data });
      }
    },
    removeHighlight: function () {
      this.results.find(".select2-highlighted").removeClass("select2-highlighted");
    },
    touchMoved: function () {
      this._touchMoved = true;
    },
    clearTouchMoved: function () {
      this._touchMoved = false;
    },
    countSelectableResults: function () {
      return this.findHighlightableChoices().length;
    },
    highlightUnderEvent: function (event) {
      var el = $(event.target).closest(".select2-result-selectable");
      if (el.length > 0 && !el.is(".select2-highlighted")) {
        var choices = this.findHighlightableChoices();
        this.highlight(choices.index(el));
      } else if (el.length == 0) {
        this.removeHighlight();
      }
    },
    loadMoreIfNeeded: function () {
      var results = this.results,
        more = results.find("li.select2-more-results"),
        below,
        page = this.resultsPage + 1,
        self = this,
        term = this.search.val(),
        context = this.context;
      if (more.length === 0) return;
      below = more.offset().top - results.offset().top - results.height();
      if (below <= this.opts.loadMorePadding) {
        more.addClass("select2-active");
        this.opts.query({
          element: this.opts.element,
          term: term,
          page: page,
          context: context,
          matcher: this.opts.matcher,
          callback: this.bind(function (data) {
            if (!self.opened()) return;
            self.opts.populateResults.call(this, results, data.results, { term: term, page: page, context: context });
            self.postprocessResults(data, false, false);
            if (data.more === true) {
              more
                .detach()
                .appendTo(results)
                .html(self.opts.escapeMarkup(evaluate(self.opts.formatLoadMore, self.opts.element, page + 1)));
              window.setTimeout(function () {
                self.loadMoreIfNeeded();
              }, 10);
            } else {
              more.remove();
            }
            self.positionDropdown();
            self.resultsPage = page;
            self.context = data.context;
            this.opts.element.trigger({ type: "select2-loaded", items: data });
          }),
        });
      }
    },
    tokenize: function () {},
    updateResults: function (initial) {
      var search = this.search,
        results = this.results,
        opts = this.opts,
        data,
        self = this,
        input,
        term = search.val(),
        lastTerm = $.data(this.container, "select2-last-term"),
        queryNumber;
      if (initial !== true && lastTerm && equal(term, lastTerm)) return;
      $.data(this.container, "select2-last-term", term);
      if (initial !== true && (this.showSearchInput === false || !this.opened())) {
        return;
      }
      function postRender() {
        search.removeClass("select2-active");
        self.positionDropdown();
        if (results.find(".select2-no-results,.select2-selection-limit,.select2-searching").length) {
          self.liveRegion.text(results.text());
        } else {
          self.liveRegion.text(self.opts.formatMatches(results.find('.select2-result-selectable:not(".select2-selected")').length));
        }
      }
      function render(html) {
        results.html(html);
        postRender();
      }
      queryNumber = ++this.queryCount;
      var maxSelSize = this.getMaximumSelectionSize();
      if (maxSelSize >= 1) {
        data = this.data();
        if ($.isArray(data) && data.length >= maxSelSize && checkFormatter(opts.formatSelectionTooBig, "formatSelectionTooBig")) {
          render("<li class='select2-selection-limit'>" + evaluate(opts.formatSelectionTooBig, opts.element, maxSelSize) + "</li>");
          return;
        }
      }
      if (search.val().length < opts.minimumInputLength) {
        if (checkFormatter(opts.formatInputTooShort, "formatInputTooShort")) {
          render(
            "<li class='select2-no-results'>" +
              evaluate(opts.formatInputTooShort, opts.element, search.val(), opts.minimumInputLength) +
              "</li>"
          );
        } else {
          render("");
        }
        if (initial && this.showSearch) this.showSearch(true);
        return;
      }
      if (opts.maximumInputLength && search.val().length > opts.maximumInputLength) {
        if (checkFormatter(opts.formatInputTooLong, "formatInputTooLong")) {
          render(
            "<li class='select2-no-results'>" +
              evaluate(opts.formatInputTooLong, opts.element, search.val(), opts.maximumInputLength) +
              "</li>"
          );
        } else {
          render("");
        }
        return;
      }
      if (opts.formatSearching && this.findHighlightableChoices().length === 0) {
        render("<li class='select2-searching'>" + evaluate(opts.formatSearching, opts.element) + "</li>");
      }
      search.addClass("select2-active");
      this.removeHighlight();
      input = this.tokenize();
      if (input != undefined && input != null) {
        search.val(input);
      }
      this.resultsPage = 1;
      opts.query({
        element: opts.element,
        term: search.val(),
        page: this.resultsPage,
        context: null,
        matcher: opts.matcher,
        callback: this.bind(function (data) {
          var def;
          if (queryNumber != this.queryCount) {
            return;
          }
          if (!this.opened()) {
            this.search.removeClass("select2-active");
            return;
          }
          if (data.hasError !== undefined && checkFormatter(opts.formatAjaxError, "formatAjaxError")) {
            render(
              "<li class='select2-ajax-error'>" +
                evaluate(opts.formatAjaxError, opts.element, data.jqXHR, data.textStatus, data.errorThrown) +
                "</li>"
            );
            return;
          }
          this.context = data.context === undefined ? null : data.context;
          if (this.opts.createSearchChoice && search.val() !== "") {
            def = this.opts.createSearchChoice.call(self, search.val(), data.results);
            if (def !== undefined && def !== null && self.id(def) !== undefined && self.id(def) !== null) {
              if (
                $(data.results).filter(function () {
                  return equal(self.id(this), self.id(def));
                }).length === 0
              ) {
                this.opts.createSearchChoicePosition(data.results, def);
              }
            }
          }
          if (data.results.length === 0 && checkFormatter(opts.formatNoMatches, "formatNoMatches")) {
            render("<li class='select2-no-results'>" + evaluate(opts.formatNoMatches, opts.element, search.val()) + "</li>");
            return;
          }
          results.empty();
          self.opts.populateResults.call(this, results, data.results, { term: search.val(), page: this.resultsPage, context: null });
          if (data.more === true && checkFormatter(opts.formatLoadMore, "formatLoadMore")) {
            results.append(
              "<li class='select2-more-results'>" +
                opts.escapeMarkup(evaluate(opts.formatLoadMore, opts.element, this.resultsPage)) +
                "</li>"
            );
            window.setTimeout(function () {
              self.loadMoreIfNeeded();
            }, 10);
          }
          this.postprocessResults(data, initial);
          postRender();
          this.opts.element.trigger({ type: "select2-loaded", items: data });
        }),
      });
    },
    cancel: function () {
      this.close();
    },
    blur: function () {
      if (this.opts.selectOnBlur) this.selectHighlighted({ noFocus: true });
      this.close();
      this.container.removeClass("select2-container-active");
      if (this.search[0] === document.activeElement) {
        this.search.blur();
      }
      this.clearSearch();
      this.selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus");
    },
    focusSearch: function () {
      focus(this.search);
    },
    selectHighlighted: function (options) {
      if (this._touchMoved) {
        this.clearTouchMoved();
        return;
      }
      var index = this.highlight(),
        highlighted = this.results.find(".select2-highlighted"),
        data = highlighted.closest(".select2-result").data("select2-data");
      if (data) {
        this.highlight(index);
        this.onSelect(data, options);
      } else if (options && options.noFocus) {
        this.close();
      }
    },
    getPlaceholder: function () {
      var placeholderOption;
      return (
        this.opts.element.attr("placeholder") ||
        this.opts.element.attr("data-placeholder") ||
        this.opts.element.data("placeholder") ||
        this.opts.placeholder ||
        ((placeholderOption = this.getPlaceholderOption()) !== undefined ? placeholderOption.text() : undefined)
      );
    },
    getPlaceholderOption: function () {
      if (this.select) {
        var firstOption = this.select.children("option").first();
        if (this.opts.placeholderOption !== undefined) {
          return (
            (this.opts.placeholderOption === "first" && firstOption) ||
            (typeof this.opts.placeholderOption === "function" && this.opts.placeholderOption(this.select))
          );
        } else if ($.trim(firstOption.text()) === "" && firstOption.val() === "") {
          return firstOption;
        }
      }
    },
    initContainerWidth: function () {
      function resolveContainerWidth() {
        var style, attrs, matches, i, l, attr;
        if (this.opts.width === "off") {
          return null;
        } else if (this.opts.width === "element") {
          return this.opts.element.outerWidth(false) === 0 ? "auto" : this.opts.element.outerWidth(false) + "px";
        } else if (this.opts.width === "copy" || this.opts.width === "resolve") {
          style = this.opts.element.attr("style");
          if (style !== undefined) {
            attrs = style.split(";");
            for (i = 0, l = attrs.length; i < l; i = i + 1) {
              attr = attrs[i].replace(/\s/g, "");
              matches = attr.match(/^width:(([-+]?([0-9]*\.)?[0-9]+)(px|em|ex|%|in|cm|mm|pt|pc))/i);
              if (matches !== null && matches.length >= 1) return matches[1];
            }
          }
          if (this.opts.width === "resolve") {
            style = this.opts.element.css("width");
            if (style.indexOf("%") > 0) return style;
            return this.opts.element.outerWidth(false) === 0 ? "auto" : this.opts.element.outerWidth(false) + "px";
          }
          return null;
        } else if ($.isFunction(this.opts.width)) {
          return this.opts.width();
        } else {
          return this.opts.width;
        }
      }
      var width = resolveContainerWidth.call(this);
      if (width !== null) {
        this.container.css("width", width);
      }
    },
  });
  SingleSelect2 = clazz(AbstractSelect2, {
    createContainer: function () {
      var container = $(document.createElement("div"))
        .attr({ class: "select2-container" })
        .html(
          [
            "<a href='javascript:void(0)' class='select2-choice' tabindex='-1'>",
            "   <span class='select2-chosen'>&#160;</span><abbr class='select2-search-choice-close'></abbr>",
            "   <span class='select2-arrow' role='presentation'><b role='presentation'></b></span>",
            "</a>",
            "<label for='' class='select2-offscreen'></label>",
            "<input class='select2-focusser select2-offscreen' type='text' aria-haspopup='true' role='button' />",
            "<div class='select2-drop select2-display-none'>",
            "   <div class='select2-search'>",
            "       <label for='' class='select2-offscreen'></label>",
            "       <input type='text' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' class='select2-input' role='combobox' aria-expanded='true'",
            "       aria-autocomplete='list' />",
            "   </div>",
            "   <ul class='select2-results' role='listbox'>",
            "   </ul>",
            "</div>",
          ].join("")
        );
      return container;
    },
    enableInterface: function () {
      if (this.parent.enableInterface.apply(this, arguments)) {
        this.focusser.prop("disabled", !this.isInterfaceEnabled());
      }
    },
    opening: function () {
      var el, range, len;
      if (this.opts.minimumResultsForSearch >= 0) {
        this.showSearch(true);
      }
      this.parent.opening.apply(this, arguments);
      if (this.showSearchInput !== false) {
        this.search.val(this.focusser.val());
      }
      if (this.opts.shouldFocusInput(this)) {
        this.search.focus();
        el = this.search.get(0);
        if (el.createTextRange) {
          range = el.createTextRange();
          range.collapse(false);
          range.select();
        } else if (el.setSelectionRange) {
          len = this.search.val().length;
          el.setSelectionRange(len, len);
        }
      }
      if (this.search.val() === "") {
        if (this.nextSearchTerm != undefined) {
          this.search.val(this.nextSearchTerm);
          this.search.select();
        }
      }
      this.focusser.prop("disabled", true).val("");
      this.updateResults(true);
      this.opts.element.trigger($.Event("select2-open"));
    },
    close: function () {
      if (!this.opened()) return;
      this.parent.close.apply(this, arguments);
      this.focusser.prop("disabled", false);
      if (this.opts.shouldFocusInput(this)) {
        this.focusser.focus();
      }
    },
    focus: function () {
      if (this.opened()) {
        this.close();
      } else {
        this.focusser.prop("disabled", false);
        if (this.opts.shouldFocusInput(this)) {
          this.focusser.focus();
        }
      }
    },
    isFocused: function () {
      return this.container.hasClass("select2-container-active");
    },
    cancel: function () {
      this.parent.cancel.apply(this, arguments);
      this.focusser.prop("disabled", false);
      if (this.opts.shouldFocusInput(this)) {
        this.focusser.focus();
      }
    },
    destroy: function () {
      $("label[for='" + this.focusser.attr("id") + "']").attr("for", this.opts.element.attr("id"));
      this.parent.destroy.apply(this, arguments);
      cleanupJQueryElements.call(this, "selection", "focusser");
    },
    initContainer: function () {
      var selection,
        container = this.container,
        dropdown = this.dropdown,
        idSuffix = nextUid(),
        elementLabel;
      if (this.opts.minimumResultsForSearch < 0) {
        this.showSearch(false);
      } else {
        this.showSearch(true);
      }
      this.selection = selection = container.find(".select2-choice");
      this.focusser = container.find(".select2-focusser");
      selection.find(".select2-chosen").attr("id", "select2-chosen-" + idSuffix);
      this.focusser.attr("aria-labelledby", "select2-chosen-" + idSuffix);
      this.results.attr("id", "select2-results-" + idSuffix);
      this.search.attr("aria-owns", "select2-results-" + idSuffix);
      this.focusser.attr("id", "s2id_autogen" + idSuffix);
      elementLabel = $("label[for='" + this.opts.element.attr("id") + "']");
      this.opts.element.focus(
        this.bind(function () {
          this.focus();
        })
      );
      this.focusser.prev().text(elementLabel.text()).attr("for", this.focusser.attr("id"));
      var originalTitle = this.opts.element.attr("title");
      this.opts.element.attr("title", originalTitle || elementLabel.text());
      this.focusser.attr("tabindex", this.elementTabIndex);
      this.search.attr("id", this.focusser.attr("id") + "_search");
      this.search
        .prev()
        .text($("label[for='" + this.focusser.attr("id") + "']").text())
        .attr("for", this.search.attr("id"));
      this.search.on(
        "keydown",
        this.bind(function (e) {
          if (!this.isInterfaceEnabled()) return;
          if (229 == e.keyCode) return;
          if (e.which === KEY.PAGE_UP || e.which === KEY.PAGE_DOWN) {
            killEvent(e);
            return;
          }
          switch (e.which) {
            case KEY.UP:
            case KEY.DOWN:
              this.moveHighlight(e.which === KEY.UP ? -1 : 1);
              killEvent(e);
              return;
            case KEY.ENTER:
              this.selectHighlighted();
              killEvent(e);
              return;
            case KEY.TAB:
              this.selectHighlighted({ noFocus: true });
              return;
            case KEY.ESC:
              this.cancel(e);
              killEvent(e);
              return;
          }
        })
      );
      this.search.on(
        "blur",
        this.bind(function (e) {
          if (document.activeElement === this.body.get(0)) {
            window.setTimeout(
              this.bind(function () {
                if (this.opened()) {
                  this.search.focus();
                }
              }),
              0
            );
          }
        })
      );
      this.focusser.on(
        "keydown",
        this.bind(function (e) {
          if (!this.isInterfaceEnabled()) return;
          if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e) || e.which === KEY.ESC) {
            return;
          }
          if (this.opts.openOnEnter === false && e.which === KEY.ENTER) {
            killEvent(e);
            return;
          }
          if (e.which == KEY.DOWN || e.which == KEY.UP || (e.which == KEY.ENTER && this.opts.openOnEnter)) {
            if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) return;
            this.open();
            killEvent(e);
            return;
          }
          if (e.which == KEY.DELETE || e.which == KEY.BACKSPACE) {
            if (this.opts.allowClear) {
              this.clear();
            }
            killEvent(e);
            return;
          }
        })
      );
      installKeyUpChangeEvent(this.focusser);
      this.focusser.on(
        "keyup-change input",
        this.bind(function (e) {
          if (this.opts.minimumResultsForSearch >= 0) {
            e.stopPropagation();
            if (this.opened()) return;
            this.open();
          }
        })
      );
      selection.on(
        "mousedown touchstart",
        "abbr",
        this.bind(function (e) {
          if (!this.isInterfaceEnabled()) {
            return;
          }
          this.clear();
          killEventImmediately(e);
          this.close();
          if (this.selection) {
            this.selection.focus();
          }
        })
      );
      selection.on(
        "mousedown touchstart",
        this.bind(function (e) {
          reinsertElement(selection);
          if (!this.container.hasClass("select2-container-active")) {
            this.opts.element.trigger($.Event("select2-focus"));
          }
          if (this.opened()) {
            this.close();
          } else if (this.isInterfaceEnabled()) {
            this.open();
          }
          killEvent(e);
        })
      );
      dropdown.on(
        "mousedown touchstart",
        this.bind(function () {
          if (this.opts.shouldFocusInput(this)) {
            this.search.focus();
          }
        })
      );
      selection.on(
        "focus",
        this.bind(function (e) {
          killEvent(e);
        })
      );
      this.focusser
        .on(
          "focus",
          this.bind(function () {
            if (!this.container.hasClass("select2-container-active")) {
              this.opts.element.trigger($.Event("select2-focus"));
            }
            this.container.addClass("select2-container-active");
          })
        )
        .on(
          "blur",
          this.bind(function () {
            if (!this.opened()) {
              this.container.removeClass("select2-container-active");
              this.opts.element.trigger($.Event("select2-blur"));
            }
          })
        );
      this.search.on(
        "focus",
        this.bind(function () {
          if (!this.container.hasClass("select2-container-active")) {
            this.opts.element.trigger($.Event("select2-focus"));
          }
          this.container.addClass("select2-container-active");
        })
      );
      this.initContainerWidth();
      this.opts.element.hide();
      this.setPlaceholder();
    },
    clear: function (triggerChange) {
      var data = this.selection.data("select2-data");
      if (data) {
        var evt = $.Event("select2-clearing");
        this.opts.element.trigger(evt);
        if (evt.isDefaultPrevented()) {
          return;
        }
        var placeholderOption = this.getPlaceholderOption();
        this.opts.element.val(placeholderOption ? placeholderOption.val() : "");
        this.selection.find(".select2-chosen").empty();
        this.selection.removeData("select2-data");
        this.setPlaceholder();
        if (triggerChange !== false) {
          this.opts.element.trigger({ type: "select2-removed", val: this.id(data), choice: data });
          this.triggerChange({ removed: data });
        }
      }
    },
    initSelection: function () {
      var selected;
      if (this.isPlaceholderOptionSelected()) {
        this.updateSelection(null);
        this.close();
        this.setPlaceholder();
      } else {
        var self = this;
        this.opts.initSelection.call(null, this.opts.element, function (selected) {
          if (selected !== undefined && selected !== null) {
            self.updateSelection(selected);
            self.close();
            self.setPlaceholder();
            self.nextSearchTerm = self.opts.nextSearchTerm(selected, self.search.val());
          }
        });
      }
    },
    isPlaceholderOptionSelected: function () {
      var placeholderOption;
      if (this.getPlaceholder() === undefined) return false;
      return (
        ((placeholderOption = this.getPlaceholderOption()) !== undefined && placeholderOption.prop("selected")) ||
        this.opts.element.val() === "" ||
        this.opts.element.val() === undefined ||
        this.opts.element.val() === null
      );
    },
    prepareOpts: function () {
      var opts = this.parent.prepareOpts.apply(this, arguments),
        self = this;
      if (opts.element.get(0).tagName.toLowerCase() === "select") {
        opts.initSelection = function (element, callback) {
          var selected = element.find("option").filter(function () {
            return this.selected && !this.disabled;
          });
          callback(self.optionToData(selected));
        };
      } else if ("data" in opts) {
        opts.initSelection =
          opts.initSelection ||
          function (element, callback) {
            var id = element.val();
            var match = null;
            opts.query({
              matcher: function (term, text, el) {
                var is_match = equal(id, opts.id(el));
                if (is_match) {
                  match = el;
                }
                return is_match;
              },
              callback: !$.isFunction(callback)
                ? $.noop
                : function () {
                    callback(match);
                  },
            });
          };
      }
      return opts;
    },
    getPlaceholder: function () {
      if (this.select) {
        if (this.getPlaceholderOption() === undefined) {
          return undefined;
        }
      }
      return this.parent.getPlaceholder.apply(this, arguments);
    },
    setPlaceholder: function () {
      var placeholder = this.getPlaceholder();
      if (this.isPlaceholderOptionSelected() && placeholder !== undefined) {
        if (this.select && this.getPlaceholderOption() === undefined) return;
        this.selection.find(".select2-chosen").html(this.opts.escapeMarkup(placeholder));
        this.selection.addClass("select2-default");
        this.container.removeClass("select2-allowclear");
      }
    },
    postprocessResults: function (data, initial, noHighlightUpdate) {
      var selected = 0,
        self = this,
        showSearchInput = true;
      this.findHighlightableChoices().each2(function (i, elm) {
        if (equal(self.id(elm.data("select2-data")), self.opts.element.val())) {
          selected = i;
          return false;
        }
      });
      if (noHighlightUpdate !== false) {
        if (initial === true && selected >= 0) {
          this.highlight(selected);
        } else {
          this.highlight(0);
        }
      }
      if (initial === true) {
        var min = this.opts.minimumResultsForSearch;
        if (min >= 0) {
          this.showSearch(countResults(data.results) >= min);
        }
      }
    },
    showSearch: function (showSearchInput) {
      if (this.showSearchInput === showSearchInput) return;
      this.showSearchInput = showSearchInput;
      this.dropdown.find(".select2-search").toggleClass("select2-search-hidden", !showSearchInput);
      this.dropdown.find(".select2-search").toggleClass("select2-offscreen", !showSearchInput);
      $(this.dropdown, this.container).toggleClass("select2-with-searchbox", showSearchInput);
    },
    onSelect: function (data, options) {
      if (!this.triggerSelect(data)) {
        return;
      }
      var old = this.opts.element.val(),
        oldData = this.data();
      this.opts.element.val(this.id(data));
      this.updateSelection(data);
      this.opts.element.trigger({ type: "select2-selected", val: this.id(data), choice: data });
      this.nextSearchTerm = this.opts.nextSearchTerm(data, this.search.val());
      this.close();
      if ((!options || !options.noFocus) && this.opts.shouldFocusInput(this)) {
        this.focusser.focus();
      }
      if (!equal(old, this.id(data))) {
        this.triggerChange({ added: data, removed: oldData });
      }
    },
    updateSelection: function (data) {
      var container = this.selection.find(".select2-chosen"),
        formatted,
        cssClass;
      this.selection.data("select2-data", data);
      container.empty();
      if (data !== null) {
        formatted = this.opts.formatSelection(data, container, this.opts.escapeMarkup);
      }
      if (formatted !== undefined) {
        container.append(formatted);
      }
      cssClass = this.opts.formatSelectionCssClass(data, container);
      if (cssClass !== undefined) {
        container.addClass(cssClass);
      }
      this.selection.removeClass("select2-default");
      if (this.opts.allowClear && this.getPlaceholder() !== undefined) {
        this.container.addClass("select2-allowclear");
      }
    },
    val: function () {
      var val,
        triggerChange = false,
        data = null,
        self = this,
        oldData = this.data();
      if (arguments.length === 0) {
        return this.opts.element.val();
      }
      val = arguments[0];
      if (arguments.length > 1) {
        triggerChange = arguments[1];
      }
      if (this.select) {
        this.select
          .val(val)
          .find("option")
          .filter(function () {
            return this.selected;
          })
          .each2(function (i, elm) {
            data = self.optionToData(elm);
            return false;
          });
        this.updateSelection(data);
        this.setPlaceholder();
        if (triggerChange) {
          this.triggerChange({ added: data, removed: oldData });
        }
      } else {
        if (!val && val !== 0) {
          this.clear(triggerChange);
          return;
        }
        if (this.opts.initSelection === undefined) {
          throw new Error("cannot call val() if initSelection() is not defined");
        }
        this.opts.element.val(val);
        this.opts.initSelection(this.opts.element, function (data) {
          self.opts.element.val(!data ? "" : self.id(data));
          self.updateSelection(data);
          self.setPlaceholder();
          if (triggerChange) {
            self.triggerChange({ added: data, removed: oldData });
          }
        });
      }
    },
    clearSearch: function () {
      this.search.val("");
      this.focusser.val("");
    },
    data: function (value) {
      var data,
        triggerChange = false;
      if (arguments.length === 0) {
        data = this.selection.data("select2-data");
        if (data == undefined) data = null;
        return data;
      } else {
        if (arguments.length > 1) {
          triggerChange = arguments[1];
        }
        if (!value) {
          this.clear(triggerChange);
        } else {
          data = this.data();
          this.opts.element.val(!value ? "" : this.id(value));
          this.updateSelection(value);
          if (triggerChange) {
            this.triggerChange({ added: value, removed: data });
          }
        }
      }
    },
  });
  MultiSelect2 = clazz(AbstractSelect2, {
    createContainer: function () {
      var container = $(document.createElement("div"))
        .attr({ class: "select2-container select2-container-multi" })
        .html(
          [
            "<ul class='select2-choices'>",
            "  <li class='select2-search-field'>",
            "    <label for='' class='select2-offscreen'></label>",
            "    <input type='text' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' class='select2-input'>",
            "  </li>",
            "</ul>",
            "<div class='select2-drop select2-drop-multi select2-display-none'>",
            "   <ul class='select2-results'>",
            "   </ul>",
            "</div>",
          ].join("")
        );
      return container;
    },
    prepareOpts: function () {
      var opts = this.parent.prepareOpts.apply(this, arguments),
        self = this;
      if (opts.element.get(0).tagName.toLowerCase() === "select") {
        opts.initSelection = function (element, callback) {
          var data = [];
          element
            .find("option")
            .filter(function () {
              return this.selected && !this.disabled;
            })
            .each2(function (i, elm) {
              data.push(self.optionToData(elm));
            });
          callback(data);
        };
      } else if ("data" in opts) {
        opts.initSelection =
          opts.initSelection ||
          function (element, callback) {
            var ids = splitVal(element.val(), opts.separator, opts.transformVal);
            var matches = [];
            opts.query({
              matcher: function (term, text, el) {
                var is_match = $.grep(ids, function (id) {
                  return equal(id, opts.id(el));
                }).length;
                if (is_match) {
                  matches.push(el);
                }
                return is_match;
              },
              callback: !$.isFunction(callback)
                ? $.noop
                : function () {
                    var ordered = [];
                    for (var i = 0; i < ids.length; i++) {
                      var id = ids[i];
                      for (var j = 0; j < matches.length; j++) {
                        var match = matches[j];
                        if (equal(id, opts.id(match))) {
                          ordered.push(match);
                          matches.splice(j, 1);
                          break;
                        }
                      }
                    }
                    callback(ordered);
                  },
            });
          };
      }
      return opts;
    },
    selectChoice: function (choice) {
      var selected = this.container.find(".select2-search-choice-focus");
      if (selected.length && choice && choice[0] == selected[0]) {
      } else {
        if (selected.length) {
          this.opts.element.trigger("choice-deselected", selected);
        }
        selected.removeClass("select2-search-choice-focus");
        if (choice && choice.length) {
          this.close();
          choice.addClass("select2-search-choice-focus");
          this.opts.element.trigger("choice-selected", choice);
        }
      }
    },
    destroy: function () {
      $("label[for='" + this.search.attr("id") + "']").attr("for", this.opts.element.attr("id"));
      this.parent.destroy.apply(this, arguments);
      cleanupJQueryElements.call(this, "searchContainer", "selection");
    },
    initContainer: function () {
      var selector = ".select2-choices",
        selection;
      this.searchContainer = this.container.find(".select2-search-field");
      this.selection = selection = this.container.find(selector);
      var _this = this;
      this.selection.on(
        "click",
        ".select2-container:not(.select2-container-disabled) .select2-search-choice:not(.select2-locked)",
        function (e) {
          _this.search[0].focus();
          _this.selectChoice($(this));
        }
      );
      this.search.attr("id", "s2id_autogen" + nextUid());
      this.search
        .prev()
        .text($("label[for='" + this.opts.element.attr("id") + "']").text())
        .attr("for", this.search.attr("id"));
      this.opts.element.focus(
        this.bind(function () {
          this.focus();
        })
      );
      this.search.on(
        "input paste",
        this.bind(function () {
          if (this.search.attr("placeholder") && this.search.val().length == 0) return;
          if (!this.isInterfaceEnabled()) return;
          if (!this.opened()) {
            this.open();
          }
        })
      );
      this.search.attr("tabindex", this.elementTabIndex);
      this.keydowns = 0;
      this.search.on(
        "keydown",
        this.bind(function (e) {
          if (!this.isInterfaceEnabled()) return;
          ++this.keydowns;
          var selected = selection.find(".select2-search-choice-focus");
          var prev = selected.prev(".select2-search-choice:not(.select2-locked)");
          var next = selected.next(".select2-search-choice:not(.select2-locked)");
          var pos = getCursorInfo(this.search);
          if (
            selected.length &&
            (e.which == KEY.LEFT || e.which == KEY.RIGHT || e.which == KEY.BACKSPACE || e.which == KEY.DELETE || e.which == KEY.ENTER)
          ) {
            var selectedChoice = selected;
            if (e.which == KEY.LEFT && prev.length) {
              selectedChoice = prev;
            } else if (e.which == KEY.RIGHT) {
              selectedChoice = next.length ? next : null;
            } else if (e.which === KEY.BACKSPACE) {
              if (this.unselect(selected.first())) {
                this.search.width(10);
                selectedChoice = prev.length ? prev : next;
              }
            } else if (e.which == KEY.DELETE) {
              if (this.unselect(selected.first())) {
                this.search.width(10);
                selectedChoice = next.length ? next : null;
              }
            } else if (e.which == KEY.ENTER) {
              selectedChoice = null;
            }
            this.selectChoice(selectedChoice);
            killEvent(e);
            if (!selectedChoice || !selectedChoice.length) {
              this.open();
            }
            return;
          } else if (((e.which === KEY.BACKSPACE && this.keydowns == 1) || e.which == KEY.LEFT) && pos.offset == 0 && !pos.length) {
            this.selectChoice(selection.find(".select2-search-choice:not(.select2-locked)").last());
            killEvent(e);
            return;
          } else {
            this.selectChoice(null);
          }
          if (this.opened()) {
            switch (e.which) {
              case KEY.UP:
              case KEY.DOWN:
                this.moveHighlight(e.which === KEY.UP ? -1 : 1);
                killEvent(e);
                return;
              case KEY.ENTER:
                this.selectHighlighted();
                killEvent(e);
                return;
              case KEY.TAB:
                this.selectHighlighted({ noFocus: true });
                this.close();
                return;
              case KEY.ESC:
                this.cancel(e);
                killEvent(e);
                return;
            }
          }
          if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e) || e.which === KEY.BACKSPACE || e.which === KEY.ESC) {
            return;
          }
          if (e.which === KEY.ENTER) {
            if (this.opts.openOnEnter === false) {
              return;
            } else if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) {
              return;
            }
          }
          this.open();
          if (e.which === KEY.PAGE_UP || e.which === KEY.PAGE_DOWN) {
            killEvent(e);
          }
          if (e.which === KEY.ENTER) {
            killEvent(e);
          }
        })
      );
      this.search.on(
        "keyup",
        this.bind(function (e) {
          this.keydowns = 0;
          this.resizeSearch();
        })
      );
      this.search.on(
        "blur",
        this.bind(function (e) {
          this.container.removeClass("select2-container-active");
          this.search.removeClass("select2-focused");
          this.selectChoice(null);
          if (!this.opened()) this.clearSearch();
          e.stopImmediatePropagation();
          this.opts.element.trigger($.Event("select2-blur"));
        })
      );
      this.container.on(
        "click",
        selector,
        this.bind(function (e) {
          if (!this.isInterfaceEnabled()) return;
          if ($(e.target).closest(".select2-search-choice").length > 0) {
            return;
          }
          this.selectChoice(null);
          this.clearPlaceholder();
          if (!this.container.hasClass("select2-container-active")) {
            this.opts.element.trigger($.Event("select2-focus"));
          }
          this.open();
          this.focusSearch();
          e.preventDefault();
        })
      );
      this.container.on(
        "focus",
        selector,
        this.bind(function () {
          if (!this.isInterfaceEnabled()) return;
          if (!this.container.hasClass("select2-container-active")) {
            this.opts.element.trigger($.Event("select2-focus"));
          }
          this.container.addClass("select2-container-active");
          this.dropdown.addClass("select2-drop-active");
          this.clearPlaceholder();
        })
      );
      this.initContainerWidth();
      this.opts.element.hide();
      this.clearSearch();
    },
    enableInterface: function () {
      if (this.parent.enableInterface.apply(this, arguments)) {
        this.search.prop("disabled", !this.isInterfaceEnabled());
      }
    },
    initSelection: function () {
      var data;
      if (this.opts.element.val() === "" && this.opts.element.text() === "") {
        this.updateSelection([]);
        this.close();
        this.clearSearch();
      }
      if (this.select || this.opts.element.val() !== "") {
        var self = this;
        this.opts.initSelection.call(null, this.opts.element, function (data) {
          if (data !== undefined && data !== null) {
            self.updateSelection(data);
            self.close();
            self.clearSearch();
          }
        });
      }
    },
    clearSearch: function () {
      var placeholder = this.getPlaceholder(),
        maxWidth = this.getMaxSearchWidth();
      if (placeholder !== undefined && this.getVal().length === 0 && this.search.hasClass("select2-focused") === false) {
        this.search.val(placeholder).addClass("select2-default");
        this.search.width(maxWidth > 0 ? maxWidth : this.container.css("width"));
      } else {
        this.search.val("").width(10);
      }
    },
    clearPlaceholder: function () {
      if (this.search.hasClass("select2-default")) {
        this.search.val("").removeClass("select2-default");
      }
    },
    opening: function () {
      this.clearPlaceholder();
      this.resizeSearch();
      this.parent.opening.apply(this, arguments);
      this.focusSearch();
      if (this.search.val() === "") {
        if (this.nextSearchTerm != undefined) {
          this.search.val(this.nextSearchTerm);
          this.search.select();
        }
      }
      this.updateResults(true);
      if (this.opts.shouldFocusInput(this)) {
        this.search.focus();
      }
      this.opts.element.trigger($.Event("select2-open"));
    },
    close: function () {
      if (!this.opened()) return;
      this.parent.close.apply(this, arguments);
    },
    focus: function () {
      this.close();
      this.search.focus();
    },
    isFocused: function () {
      return this.search.hasClass("select2-focused");
    },
    updateSelection: function (data) {
      var ids = [],
        filtered = [],
        self = this;
      $(data).each(function () {
        if (indexOf(self.id(this), ids) < 0) {
          ids.push(self.id(this));
          filtered.push(this);
        }
      });
      data = filtered;
      this.selection.find(".select2-search-choice").remove();
      $(data).each(function () {
        self.addSelectedChoice(this);
      });
      self.postprocessResults();
    },
    tokenize: function () {
      var input = this.search.val();
      input = this.opts.tokenizer.call(this, input, this.data(), this.bind(this.onSelect), this.opts);
      if (input != null && input != undefined) {
        this.search.val(input);
        if (input.length > 0) {
          this.open();
        }
      }
    },
    onSelect: function (data, options) {
      if (!this.triggerSelect(data) || data.text === "") {
        return;
      }
      this.addSelectedChoice(data);
      this.opts.element.trigger({ type: "selected", val: this.id(data), choice: data });
      this.nextSearchTerm = this.opts.nextSearchTerm(data, this.search.val());
      this.clearSearch();
      this.updateResults();
      if (this.select || !this.opts.closeOnSelect) this.postprocessResults(data, false, this.opts.closeOnSelect === true);
      if (this.opts.closeOnSelect) {
        this.close();
        this.search.width(10);
      } else {
        if (this.countSelectableResults() > 0) {
          this.search.width(10);
          this.resizeSearch();
          if (this.getMaximumSelectionSize() > 0 && this.val().length >= this.getMaximumSelectionSize()) {
            this.updateResults(true);
          } else {
            if (this.nextSearchTerm != undefined) {
              this.search.val(this.nextSearchTerm);
              this.updateResults();
              this.search.select();
            }
          }
          this.positionDropdown();
        } else {
          this.close();
          this.search.width(10);
        }
      }
      this.triggerChange({ added: data });
      if (!options || !options.noFocus) this.focusSearch();
    },
    cancel: function () {
      this.close();
      this.focusSearch();
    },
    addSelectedChoice: function (data) {
      var enableChoice = !data.locked,
        enabledItem = $(
          "<li class='select2-search-choice'>" +
            "    <div></div>" +
            "    <a href='#' class='select2-search-choice-close' tabindex='-1'></a>" +
            "</li>"
        ),
        disabledItem = $("<li class='select2-search-choice select2-locked'>" + "<div></div>" + "</li>");
      var choice = enableChoice ? enabledItem : disabledItem,
        id = this.id(data),
        val = this.getVal(),
        formatted,
        cssClass;
      formatted = this.opts.formatSelection(data, choice.find("div"), this.opts.escapeMarkup);
      if (formatted != undefined) {
        choice.find("div").replaceWith($("<div></div>").html(formatted));
      }
      cssClass = this.opts.formatSelectionCssClass(data, choice.find("div"));
      if (cssClass != undefined) {
        choice.addClass(cssClass);
      }
      if (enableChoice) {
        choice
          .find(".select2-search-choice-close")
          .on("mousedown", killEvent)
          .on(
            "click dblclick",
            this.bind(function (e) {
              if (!this.isInterfaceEnabled()) return;
              this.unselect($(e.target));
              this.selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus");
              killEvent(e);
              this.close();
              this.focusSearch();
            })
          )
          .on(
            "focus",
            this.bind(function () {
              if (!this.isInterfaceEnabled()) return;
              this.container.addClass("select2-container-active");
              this.dropdown.addClass("select2-drop-active");
            })
          );
      }
      choice.data("select2-data", data);
      choice.insertBefore(this.searchContainer);
      val.push(id);
      this.setVal(val);
    },
    unselect: function (selected) {
      var val = this.getVal(),
        data,
        index;
      selected = selected.closest(".select2-search-choice");
      if (selected.length === 0) {
        throw "Invalid argument: " + selected + ". Must be .select2-search-choice";
      }
      data = selected.data("select2-data");
      if (!data) {
        return;
      }
      var evt = $.Event("select2-removing");
      evt.val = this.id(data);
      evt.choice = data;
      this.opts.element.trigger(evt);
      if (evt.isDefaultPrevented()) {
        return false;
      }
      while ((index = indexOf(this.id(data), val)) >= 0) {
        val.splice(index, 1);
        this.setVal(val);
        if (this.select) this.postprocessResults();
      }
      selected.remove();
      this.opts.element.trigger({ type: "select2-removed", val: this.id(data), choice: data });
      this.triggerChange({ removed: data });
      return true;
    },
    postprocessResults: function (data, initial, noHighlightUpdate) {
      var val = this.getVal(),
        choices = this.results.find(".select2-result"),
        compound = this.results.find(".select2-result-with-children"),
        self = this;
      choices.each2(function (i, choice) {
        var id = self.id(choice.data("select2-data"));
        if (indexOf(id, val) >= 0) {
          choice.addClass("select2-selected");
          choice.find(".select2-result-selectable").addClass("select2-selected");
        }
      });
      compound.each2(function (i, choice) {
        if (!choice.is(".select2-result-selectable") && choice.find(".select2-result-selectable:not(.select2-selected)").length === 0) {
          choice.addClass("select2-selected");
        }
      });
      if (this.highlight() == -1 && noHighlightUpdate !== false && this.opts.closeOnSelect === true) {
        self.highlight(0);
      }
      if (!this.opts.createSearchChoice && !choices.filter(".select2-result:not(.select2-selected)").length > 0) {
        if (!data || (data && !data.more && this.results.find(".select2-no-results").length === 0)) {
          if (checkFormatter(self.opts.formatNoMatches, "formatNoMatches")) {
            this.results.append(
              "<li class='select2-no-results'>" + evaluate(self.opts.formatNoMatches, self.opts.element, self.search.val()) + "</li>"
            );
          }
        }
      }
    },
    getMaxSearchWidth: function () {
      return this.selection.width() - getSideBorderPadding(this.search);
    },
    resizeSearch: function () {
      var minimumWidth,
        left,
        maxWidth,
        containerLeft,
        searchWidth,
        sideBorderPadding = getSideBorderPadding(this.search);
      minimumWidth = measureTextWidth(this.search) + 10;
      left = this.search.offset().left;
      maxWidth = this.selection.width();
      containerLeft = this.selection.offset().left;
      searchWidth = maxWidth - (left - containerLeft) - sideBorderPadding;
      if (searchWidth < minimumWidth) {
        searchWidth = maxWidth - sideBorderPadding;
      }
      if (searchWidth < 40) {
        searchWidth = maxWidth - sideBorderPadding;
      }
      if (searchWidth <= 0) {
        searchWidth = minimumWidth;
      }
      this.search.width(Math.floor(searchWidth));
    },
    getVal: function () {
      var val;
      if (this.select) {
        val = this.select.val();
        return val === null ? [] : val;
      } else {
        val = this.opts.element.val();
        return splitVal(val, this.opts.separator, this.opts.transformVal);
      }
    },
    setVal: function (val) {
      var unique;
      if (this.select) {
        this.select.val(val);
      } else {
        unique = [];
        $(val).each(function () {
          if (indexOf(this, unique) < 0) unique.push(this);
        });
        this.opts.element.val(unique.length === 0 ? "" : unique.join(this.opts.separator));
      }
    },
    buildChangeDetails: function (old, current) {
      var current = current.slice(0),
        old = old.slice(0);
      for (var i = 0; i < current.length; i++) {
        for (var j = 0; j < old.length; j++) {
          if (equal(this.opts.id(current[i]), this.opts.id(old[j]))) {
            current.splice(i, 1);
            if (i > 0) {
              i--;
            }
            old.splice(j, 1);
            j--;
          }
        }
      }
      return { added: current, removed: old };
    },
    val: function (val, triggerChange) {
      var oldData,
        self = this;
      if (arguments.length === 0) {
        return this.getVal();
      }
      oldData = this.data();
      if (!oldData.length) oldData = [];
      if (!val && val !== 0) {
        this.opts.element.val("");
        this.updateSelection([]);
        this.clearSearch();
        if (triggerChange) {
          this.triggerChange({ added: this.data(), removed: oldData });
        }
        return;
      }
      this.setVal(val);
      if (this.select) {
        this.opts.initSelection(this.select, this.bind(this.updateSelection));
        if (triggerChange) {
          this.triggerChange(this.buildChangeDetails(oldData, this.data()));
        }
      } else {
        if (this.opts.initSelection === undefined) {
          throw new Error("val() cannot be called if initSelection() is not defined");
        }
        this.opts.initSelection(this.opts.element, function (data) {
          var ids = $.map(data, self.id);
          self.setVal(ids);
          self.updateSelection(data);
          self.clearSearch();
          if (triggerChange) {
            self.triggerChange(self.buildChangeDetails(oldData, self.data()));
          }
        });
      }
      this.clearSearch();
    },
    onSortStart: function () {
      if (this.select) {
        throw new Error("Sorting of elements is not supported when attached to <select>. Attach to <input type='hidden'/> instead.");
      }
      this.search.width(0);
      this.searchContainer.hide();
    },
    onSortEnd: function () {
      var val = [],
        self = this;
      this.searchContainer.show();
      this.searchContainer.appendTo(this.searchContainer.parent());
      this.resizeSearch();
      this.selection.find(".select2-search-choice").each(function () {
        val.push(self.opts.id($(this).data("select2-data")));
      });
      this.setVal(val);
      this.triggerChange();
    },
    data: function (values, triggerChange) {
      var self = this,
        ids,
        old;
      if (arguments.length === 0) {
        return this.selection
          .children(".select2-search-choice")
          .map(function () {
            return $(this).data("select2-data");
          })
          .get();
      } else {
        old = this.data();
        if (!values) {
          values = [];
        }
        ids = $.map(values, function (e) {
          return self.opts.id(e);
        });
        this.setVal(ids);
        this.updateSelection(values);
        this.clearSearch();
        if (triggerChange) {
          this.triggerChange(this.buildChangeDetails(old, this.data()));
        }
      }
    },
  });
  $.fn.select2 = function () {
    var args = Array.prototype.slice.call(arguments, 0),
      opts,
      select2,
      method,
      value,
      multiple,
      allowedMethods = [
        "val",
        "destroy",
        "opened",
        "open",
        "close",
        "focus",
        "isFocused",
        "container",
        "dropdown",
        "onSortStart",
        "onSortEnd",
        "enable",
        "disable",
        "readonly",
        "positionDropdown",
        "data",
        "search",
      ],
      valueMethods = ["opened", "isFocused", "container", "dropdown"],
      propertyMethods = ["val", "data"],
      methodsMap = { search: "externalSearch" };
    this.each(function () {
      if (args.length === 0 || typeof args[0] === "object") {
        opts = args.length === 0 ? {} : $.extend({}, args[0]);
        opts.element = $(this);
        if (opts.element.get(0).tagName.toLowerCase() === "select") {
          multiple = opts.element.prop("multiple");
        } else {
          multiple = opts.multiple || false;
          if ("tags" in opts) {
            opts.multiple = multiple = true;
          }
        }
        select2 = multiple ? new window.Select2["class"].multi() : new window.Select2["class"].single();
        select2.init(opts);
      } else if (typeof args[0] === "string") {
        if (indexOf(args[0], allowedMethods) < 0) {
          throw "Unknown method: " + args[0];
        }
        value = undefined;
        select2 = $(this).data("select2");
        if (select2 === undefined) return;
        method = args[0];
        if (method === "container") {
          value = select2.container;
        } else if (method === "dropdown") {
          value = select2.dropdown;
        } else {
          if (methodsMap[method]) method = methodsMap[method];
          value = select2[method].apply(select2, args.slice(1));
        }
        if (indexOf(args[0], valueMethods) >= 0 || (indexOf(args[0], propertyMethods) >= 0 && args.length == 1)) {
          return false;
        }
      } else {
        throw "Invalid arguments to select2 plugin: " + args;
      }
    });
    return value === undefined ? this : value;
  };
  $.fn.select2.defaults = {
    width: "copy",
    loadMorePadding: 0,
    closeOnSelect: true,
    openOnEnter: true,
    containerCss: {},
    dropdownCss: {},
    containerCssClass: "",
    dropdownCssClass: "",
    formatResult: function (result, container, query, escapeMarkup) {
      var markup = [];
      markMatch(this.text(result), query.term, markup, escapeMarkup);
      return markup.join("");
    },
    transformVal: function (val) {
      return $.trim(val);
    },
    formatSelection: function (data, container, escapeMarkup) {
      return data ? escapeMarkup(this.text(data)) : undefined;
    },
    sortResults: function (results, container, query) {
      return results;
    },
    formatResultCssClass: function (data) {
      return data.css;
    },
    formatSelectionCssClass: function (data, container) {
      return undefined;
    },
    minimumResultsForSearch: 0,
    minimumInputLength: 0,
    maximumInputLength: null,
    maximumSelectionSize: 0,
    id: function (e) {
      return e == undefined ? null : e.id;
    },
    text: function (e) {
      if (e && this.data && this.data.text) {
        if ($.isFunction(this.data.text)) {
          return this.data.text(e);
        } else {
          return e[this.data.text];
        }
      } else {
        return e.text;
      }
    },
    matcher: function (term, text) {
      return (
        stripDiacritics("" + text)
          .toUpperCase()
          .indexOf(stripDiacritics("" + term).toUpperCase()) >= 0
      );
    },
    separator: ",",
    tokenSeparators: [],
    tokenizer: defaultTokenizer,
    escapeMarkup: defaultEscapeMarkup,
    blurOnChange: false,
    selectOnBlur: false,
    adaptContainerCssClass: function (c) {
      return c;
    },
    adaptDropdownCssClass: function (c) {
      return null;
    },
    nextSearchTerm: function (selectedObject, currentSearchTerm) {
      return undefined;
    },
    searchInputPlaceholder: "",
    createSearchChoicePosition: "top",
    shouldFocusInput: function (instance) {
      var supportsTouchEvents = "ontouchstart" in window || navigator.msMaxTouchPoints > 0;
      if (!supportsTouchEvents) {
        return true;
      }
      if (instance.opts.minimumResultsForSearch < 0) {
        return false;
      }
      return true;
    },
  };
  $.fn.select2.locales = [];
  $.fn.select2.locales["en"] = {
    formatMatches: function (matches) {
      if (matches === 1) {
        return "One result is available, press enter to select it.";
      }
      return matches + " results are available, use up and down arrow keys to navigate.";
    },
    formatNoMatches: function () {
      return "No matches found";
    },
    formatAjaxError: function (jqXHR, textStatus, errorThrown) {
      return "Loading failed";
    },
    formatInputTooShort: function (input, min) {
      var n = min - input.length;
      return "Please enter " + n + " or more character" + (n == 1 ? "" : "s");
    },
    formatInputTooLong: function (input, max) {
      var n = input.length - max;
      return "Please delete " + n + " character" + (n == 1 ? "" : "s");
    },
    formatSelectionTooBig: function (limit) {
      return "You can only select " + limit + " item" + (limit == 1 ? "" : "s");
    },
    formatLoadMore: function (pageNumber) {
      return "Loading more results…";
    },
    formatSearching: function () {
      return "Searching…";
    },
  };
  $.extend($.fn.select2.defaults, $.fn.select2.locales["en"]);
  $.fn.select2.ajaxDefaults = { transport: $.ajax, params: { type: "GET", cache: false, dataType: "json" } };
  window.Select2 = {
    query: { ajax: ajax, local: local, tags: tags },
    util: { debounce: debounce, markMatch: markMatch, escapeMarkup: defaultEscapeMarkup, stripDiacritics: stripDiacritics },
    class: { abstract: AbstractSelect2, single: SingleSelect2, multi: MultiSelect2 },
  };
})(jQuery);
