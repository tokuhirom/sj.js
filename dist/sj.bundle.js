(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.sj = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/**
 * @license
 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.IncrementalDOM = {})));
}(this, function (exports) { 'use strict';

  /**
   * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS-IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  /**
   * A cached reference to the hasOwnProperty function.
   */
  var hasOwnProperty = Object.prototype.hasOwnProperty;

  /**
   * A cached reference to the create function.
   */
  var create = Object.create;

  /**
   * Used to prevent property collisions between our "map" and its prototype.
   * @param {!Object<string, *>} map The map to check.
   * @param {string} property The property to check.
   * @return {boolean} Whether map has property.
   */
  var has = function (map, property) {
    return hasOwnProperty.call(map, property);
  };

  /**
   * Creates an map object without a prototype.
   * @return {!Object}
   */
  var createMap = function () {
    return create(null);
  };

  /**
   * Keeps track of information needed to perform diffs for a given DOM node.
   * @param {!string} nodeName
   * @param {?string=} key
   * @constructor
   */
  function NodeData(nodeName, key) {
    /**
     * The attributes and their values.
     * @const {!Object<string, *>}
     */
    this.attrs = createMap();

    /**
     * An array of attribute name/value pairs, used for quickly diffing the
     * incomming attributes to see if the DOM node's attributes need to be
     * updated.
     * @const {Array<*>}
     */
    this.attrsArr = [];

    /**
     * The incoming attributes for this Node, before they are updated.
     * @const {!Object<string, *>}
     */
    this.newAttrs = createMap();

    /**
     * The key used to identify this node, used to preserve DOM nodes when they
     * move within their parent.
     * @const
     */
    this.key = key;

    /**
     * Keeps track of children within this node by their key.
     * {?Object<string, !Element>}
     */
    this.keyMap = null;

    /**
     * Whether or not the keyMap is currently valid.
     * {boolean}
     */
    this.keyMapValid = true;

    /**
     * The node name for this node.
     * @const {string}
     */
    this.nodeName = nodeName;

    /**
     * @type {?string}
     */
    this.text = null;
  }

  /**
   * Initializes a NodeData object for a Node.
   *
   * @param {Node} node The node to initialize data for.
   * @param {string} nodeName The node name of node.
   * @param {?string=} key The key that identifies the node.
   * @return {!NodeData} The newly initialized data object
   */
  var initData = function (node, nodeName, key) {
    var data = new NodeData(nodeName, key);
    node['__incrementalDOMData'] = data;
    return data;
  };

  /**
   * Retrieves the NodeData object for a Node, creating it if necessary.
   *
   * @param {Node} node The node to retrieve the data for.
   * @return {!NodeData} The NodeData for this Node.
   */
  var getData = function (node) {
    var data = node['__incrementalDOMData'];

    if (!data) {
      var nodeName = node.nodeName.toLowerCase();
      var key = null;

      if (node instanceof Element) {
        key = node.getAttribute('key');
      }

      data = initData(node, nodeName, key);
    }

    return data;
  };

  /**
   * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS-IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  /** @const */
  var symbols = {
    default: '__default',

    placeholder: '__placeholder'
  };

  /**
   * @param {string} name
   * @return {string|undefined} The namespace to use for the attribute.
   */
  var getNamespace = function (name) {
    if (name.lastIndexOf('xml:', 0) === 0) {
      return 'http://www.w3.org/XML/1998/namespace';
    }

    if (name.lastIndexOf('xlink:', 0) === 0) {
      return 'http://www.w3.org/1999/xlink';
    }
  };

  /**
   * Applies an attribute or property to a given Element. If the value is null
   * or undefined, it is removed from the Element. Otherwise, the value is set
   * as an attribute.
   * @param {!Element} el
   * @param {string} name The attribute's name.
   * @param {?(boolean|number|string)=} value The attribute's value.
   */
  var applyAttr = function (el, name, value) {
    if (value == null) {
      el.removeAttribute(name);
    } else {
      var attrNS = getNamespace(name);
      if (attrNS) {
        el.setAttributeNS(attrNS, name, value);
      } else {
        el.setAttribute(name, value);
      }
    }
  };

  /**
   * Applies a property to a given Element.
   * @param {!Element} el
   * @param {string} name The property's name.
   * @param {*} value The property's value.
   */
  var applyProp = function (el, name, value) {
    el[name] = value;
  };

  /**
   * Applies a style to an Element. No vendor prefix expansion is done for
   * property names/values.
   * @param {!Element} el
   * @param {string} name The attribute's name.
   * @param {*} style The style to set. Either a string of css or an object
   *     containing property-value pairs.
   */
  var applyStyle = function (el, name, style) {
    if (typeof style === 'string') {
      el.style.cssText = style;
    } else {
      el.style.cssText = '';
      var elStyle = el.style;
      var obj = /** @type {!Object<string,string>} */style;

      for (var prop in obj) {
        if (has(obj, prop)) {
          elStyle[prop] = obj[prop];
        }
      }
    }
  };

  /**
   * Updates a single attribute on an Element.
   * @param {!Element} el
   * @param {string} name The attribute's name.
   * @param {*} value The attribute's value. If the value is an object or
   *     function it is set on the Element, otherwise, it is set as an HTML
   *     attribute.
   */
  var applyAttributeTyped = function (el, name, value) {
    var type = typeof value;

    if (type === 'object' || type === 'function') {
      applyProp(el, name, value);
    } else {
      applyAttr(el, name, /** @type {?(boolean|number|string)} */value);
    }
  };

  /**
   * Calls the appropriate attribute mutator for this attribute.
   * @param {!Element} el
   * @param {string} name The attribute's name.
   * @param {*} value The attribute's value.
   */
  var updateAttribute = function (el, name, value) {
    var data = getData(el);
    var attrs = data.attrs;

    if (attrs[name] === value) {
      return;
    }

    var mutator = attributes[name] || attributes[symbols.default];
    mutator(el, name, value);

    attrs[name] = value;
  };

  /**
   * A publicly mutable object to provide custom mutators for attributes.
   * @const {!Object<string, function(!Element, string, *)>}
   */
  var attributes = createMap();

  // Special generic mutator that's called for any attribute that does not
  // have a specific mutator.
  attributes[symbols.default] = applyAttributeTyped;

  attributes[symbols.placeholder] = function () {};

  attributes['style'] = applyStyle;

  /**
   * Gets the namespace to create an element (of a given tag) in.
   * @param {string} tag The tag to get the namespace for.
   * @param {?Node} parent
   * @return {?string} The namespace to create the tag in.
   */
  var getNamespaceForTag = function (tag, parent) {
    if (tag === 'svg') {
      return 'http://www.w3.org/2000/svg';
    }

    if (getData(parent).nodeName === 'foreignObject') {
      return null;
    }

    return parent.namespaceURI;
  };

  /**
   * Creates an Element.
   * @param {Document} doc The document with which to create the Element.
   * @param {?Node} parent
   * @param {string} tag The tag for the Element.
   * @param {?string=} key A key to identify the Element.
   * @param {?Array<*>=} statics An array of attribute name/value pairs of the
   *     static attributes for the Element.
   * @return {!Element}
   */
  var createElement = function (doc, parent, tag, key, statics) {
    var namespace = getNamespaceForTag(tag, parent);
    var el = undefined;

    if (namespace) {
      el = doc.createElementNS(namespace, tag);
    } else {
      el = doc.createElement(tag);
    }

    initData(el, tag, key);

    if (statics) {
      for (var i = 0; i < statics.length; i += 2) {
        updateAttribute(el, /** @type {!string}*/statics[i], statics[i + 1]);
      }
    }

    return el;
  };

  /**
   * Creates a Text Node.
   * @param {Document} doc The document with which to create the Element.
   * @return {!Text}
   */
  var createText = function (doc) {
    var node = doc.createTextNode('');
    initData(node, '#text', null);
    return node;
  };

  /**
   * Creates a mapping that can be used to look up children using a key.
   * @param {?Node} el
   * @return {!Object<string, !Element>} A mapping of keys to the children of the
   *     Element.
   */
  var createKeyMap = function (el) {
    var map = createMap();
    var child = el.firstElementChild;

    while (child) {
      var key = getData(child).key;

      if (key) {
        map[key] = child;
      }

      child = child.nextElementSibling;
    }

    return map;
  };

  /**
   * Retrieves the mapping of key to child node for a given Element, creating it
   * if necessary.
   * @param {?Node} el
   * @return {!Object<string, !Node>} A mapping of keys to child Elements
   */
  var getKeyMap = function (el) {
    var data = getData(el);

    if (!data.keyMap) {
      data.keyMap = createKeyMap(el);
    }

    return data.keyMap;
  };

  /**
   * Retrieves a child from the parent with the given key.
   * @param {?Node} parent
   * @param {?string=} key
   * @return {?Node} The child corresponding to the key.
   */
  var getChild = function (parent, key) {
    return key ? getKeyMap(parent)[key] : null;
  };

  /**
   * Registers an element as being a child. The parent will keep track of the
   * child using the key. The child can be retrieved using the same key using
   * getKeyMap. The provided key should be unique within the parent Element.
   * @param {?Node} parent The parent of child.
   * @param {string} key A key to identify the child with.
   * @param {!Node} child The child to register.
   */
  var registerChild = function (parent, key, child) {
    getKeyMap(parent)[key] = child;
  };

  /**
   * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS-IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  /** @const */
  var notifications = {
    /**
     * Called after patch has compleated with any Nodes that have been created
     * and added to the DOM.
     * @type {?function(Array<!Node>)}
     */
    nodesCreated: null,

    /**
     * Called after patch has compleated with any Nodes that have been removed
     * from the DOM.
     * Note it's an applications responsibility to handle any childNodes.
     * @type {?function(Array<!Node>)}
     */
    nodesDeleted: null
  };

  /**
   * Keeps track of the state of a patch.
   * @constructor
   */
  function Context() {
    /**
     * @type {(Array<!Node>|undefined)}
     */
    this.created = notifications.nodesCreated && [];

    /**
     * @type {(Array<!Node>|undefined)}
     */
    this.deleted = notifications.nodesDeleted && [];
  }

  /**
   * @param {!Node} node
   */
  Context.prototype.markCreated = function (node) {
    if (this.created) {
      this.created.push(node);
    }
  };

  /**
   * @param {!Node} node
   */
  Context.prototype.markDeleted = function (node) {
    if (this.deleted) {
      this.deleted.push(node);
    }
  };

  /**
   * Notifies about nodes that were created during the patch opearation.
   */
  Context.prototype.notifyChanges = function () {
    if (this.created && this.created.length > 0) {
      notifications.nodesCreated(this.created);
    }

    if (this.deleted && this.deleted.length > 0) {
      notifications.nodesDeleted(this.deleted);
    }
  };

  /**
  * Makes sure that keyed Element matches the tag name provided.
  * @param {!string} nodeName The nodeName of the node that is being matched.
  * @param {string=} tag The tag name of the Element.
  * @param {?string=} key The key of the Element.
  */
  var assertKeyedTagMatches = function (nodeName, tag, key) {
    if (nodeName !== tag) {
      throw new Error('Was expecting node with key "' + key + '" to be a ' + tag + ', not a ' + nodeName + '.');
    }
  };

  /** @type {?Context} */
  var context = null;

  /** @type {?Node} */
  var currentNode = null;

  /** @type {?Node} */
  var currentParent = null;

  /** @type {?Element|?DocumentFragment} */
  var root = null;

  /** @type {?Document} */
  var doc = null;

  /**
   * Returns a patcher function that sets up and restores a patch context,
   * running the run function with the provided data.
   * @param {function((!Element|!DocumentFragment),!function(T),T=)} run
   * @return {function((!Element|!DocumentFragment),!function(T),T=)}
   * @template T
   */
  var patchFactory = function (run) {
    /**
     * TODO(moz): These annotations won't be necessary once we switch to Closure
     * Compiler's new type inference. Remove these once the switch is done.
     *
     * @param {(!Element|!DocumentFragment)} node
     * @param {!function(T)} fn
     * @param {T=} data
     * @template T
     */
    var f = function (node, fn, data) {
      var prevContext = context;
      var prevRoot = root;
      var prevDoc = doc;
      var prevCurrentNode = currentNode;
      var prevCurrentParent = currentParent;
      var previousInAttributes = false;
      var previousInSkip = false;

      context = new Context();
      root = node;
      doc = node.ownerDocument;
      currentParent = node.parentNode;

      if ('production' !== 'production') {}

      run(node, fn, data);

      if ('production' !== 'production') {}

      context.notifyChanges();

      context = prevContext;
      root = prevRoot;
      doc = prevDoc;
      currentNode = prevCurrentNode;
      currentParent = prevCurrentParent;
    };
    return f;
  };

  /**
   * Patches the document starting at node with the provided function. This
   * function may be called during an existing patch operation.
   * @param {!Element|!DocumentFragment} node The Element or Document
   *     to patch.
   * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
   *     calls that describe the DOM.
   * @param {T=} data An argument passed to fn to represent DOM state.
   * @template T
   */
  var patchInner = patchFactory(function (node, fn, data) {
    currentNode = node;

    enterNode();
    fn(data);
    exitNode();

    if ('production' !== 'production') {}
  });

  /**
   * Patches an Element with the the provided function. Exactly one top level
   * element call should be made corresponding to `node`.
   * @param {!Element} node The Element where the patch should start.
   * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
   *     calls that describe the DOM. This should have at most one top level
   *     element call.
   * @param {T=} data An argument passed to fn to represent DOM state.
   * @template T
   */
  var patchOuter = patchFactory(function (node, fn, data) {
    currentNode = /** @type {!Element} */{ nextSibling: node };

    fn(data);

    if ('production' !== 'production') {}
  });

  /**
   * Checks whether or not the current node matches the specified nodeName and
   * key.
   *
   * @param {?string} nodeName The nodeName for this node.
   * @param {?string=} key An optional key that identifies a node.
   * @return {boolean} True if the node matches, false otherwise.
   */
  var matches = function (nodeName, key) {
    var data = getData(currentNode);

    // Key check is done using double equals as we want to treat a null key the
    // same as undefined. This should be okay as the only values allowed are
    // strings, null and undefined so the == semantics are not too weird.
    return nodeName === data.nodeName && key == data.key;
  };

  /**
   * Aligns the virtual Element definition with the actual DOM, moving the
   * corresponding DOM node to the correct location or creating it if necessary.
   * @param {string} nodeName For an Element, this should be a valid tag string.
   *     For a Text, this should be #text.
   * @param {?string=} key The key used to identify this element.
   * @param {?Array<*>=} statics For an Element, this should be an array of
   *     name-value pairs.
   */
  var alignWithDOM = function (nodeName, key, statics) {
    if (currentNode && matches(nodeName, key)) {
      return;
    }

    var node = undefined;

    // Check to see if the node has moved within the parent.
    if (key) {
      node = getChild(currentParent, key);
      if (node && 'production' !== 'production') {
        assertKeyedTagMatches(getData(node).nodeName, nodeName, key);
      }
    }

    // Create the node if it doesn't exist.
    if (!node) {
      if (nodeName === '#text') {
        node = createText(doc);
      } else {
        node = createElement(doc, currentParent, nodeName, key, statics);
      }

      if (key) {
        registerChild(currentParent, key, node);
      }

      context.markCreated(node);
    }

    // If the node has a key, remove it from the DOM to prevent a large number
    // of re-orders in the case that it moved far or was completely removed.
    // Since we hold on to a reference through the keyMap, we can always add it
    // back.
    if (currentNode && getData(currentNode).key) {
      currentParent.replaceChild(node, currentNode);
      getData(currentParent).keyMapValid = false;
    } else {
      currentParent.insertBefore(node, currentNode);
    }

    currentNode = node;
  };

  /**
   * Clears out any unvisited Nodes, as the corresponding virtual element
   * functions were never called for them.
   */
  var clearUnvisitedDOM = function () {
    var node = currentParent;
    var data = getData(node);
    var keyMap = data.keyMap;
    var keyMapValid = data.keyMapValid;
    var child = node.lastChild;
    var key = undefined;

    if (child === currentNode && keyMapValid) {
      return;
    }

    if (data.attrs[symbols.placeholder] && node !== root) {
      if ('production' !== 'production') {}
      return;
    }

    while (child !== currentNode) {
      node.removeChild(child);
      context.markDeleted( /** @type {!Node}*/child);

      key = getData(child).key;
      if (key) {
        delete keyMap[key];
      }
      child = node.lastChild;
    }

    // Clean the keyMap, removing any unusued keys.
    if (!keyMapValid) {
      for (key in keyMap) {
        child = keyMap[key];
        if (child.parentNode !== node) {
          context.markDeleted(child);
          delete keyMap[key];
        }
      }

      data.keyMapValid = true;
    }
  };

  /**
   * Changes to the first child of the current node.
   */
  var enterNode = function () {
    currentParent = currentNode;
    currentNode = null;
  };

  /**
   * Changes to the next sibling of the current node.
   */
  var nextNode = function () {
    if (currentNode) {
      currentNode = currentNode.nextSibling;
    } else {
      currentNode = currentParent.firstChild;
    }
  };

  /**
   * Changes to the parent of the current node, removing any unvisited children.
   */
  var exitNode = function () {
    clearUnvisitedDOM();

    currentNode = currentParent;
    currentParent = currentParent.parentNode;
  };

  /**
   * Makes sure that the current node is an Element with a matching tagName and
   * key.
   *
   * @param {string} tag The element's tag.
   * @param {?string=} key The key used to identify this element. This can be an
   *     empty string, but performance may be better if a unique value is used
   *     when iterating over an array of items.
   * @param {?Array<*>=} statics An array of attribute name/value pairs of the
   *     static attributes for the Element. These will only be set once when the
   *     Element is created.
   * @return {!Element} The corresponding Element.
   */
  var coreElementOpen = function (tag, key, statics) {
    nextNode();
    alignWithDOM(tag, key, statics);
    enterNode();
    return (/** @type {!Element} */currentParent
    );
  };

  /**
   * Closes the currently open Element, removing any unvisited children if
   * necessary.
   *
   * @return {!Element} The corresponding Element.
   */
  var coreElementClose = function () {
    if ('production' !== 'production') {}

    exitNode();
    return (/** @type {!Element} */currentNode
    );
  };

  /**
   * Makes sure the current node is a Text node and creates a Text node if it is
   * not.
   *
   * @return {!Text} The corresponding Text Node.
   */
  var coreText = function () {
    nextNode();
    alignWithDOM('#text', null, null);
    return (/** @type {!Text} */currentNode
    );
  };

  /**
   * Gets the current Element being patched.
   * @return {!Element}
   */
  var currentElement = function () {
    if ('production' !== 'production') {}
    return (/** @type {!Element} */currentParent
    );
  };

  /**
   * Skips the children in a subtree, allowing an Element to be closed without
   * clearing out the children.
   */
  var skip = function () {
    if ('production' !== 'production') {}
    currentNode = currentParent.lastChild;
  };

  /**
   * The offset in the virtual element declaration where the attributes are
   * specified.
   * @const
   */
  var ATTRIBUTES_OFFSET = 3;

  /**
   * Builds an array of arguments for use with elementOpenStart, attr and
   * elementOpenEnd.
   * @const {Array<*>}
   */
  var argsBuilder = [];

  /**
   * @param {string} tag The element's tag.
   * @param {?string=} key The key used to identify this element. This can be an
   *     empty string, but performance may be better if a unique value is used
   *     when iterating over an array of items.
   * @param {?Array<*>=} statics An array of attribute name/value pairs of the
   *     static attributes for the Element. These will only be set once when the
   *     Element is created.
   * @param {...*} const_args Attribute name/value pairs of the dynamic attributes
   *     for the Element.
   * @return {!Element} The corresponding Element.
   */
  var elementOpen = function (tag, key, statics, const_args) {
    if ('production' !== 'production') {}

    var node = coreElementOpen(tag, key, statics);
    var data = getData(node);

    /*
     * Checks to see if one or more attributes have changed for a given Element.
     * When no attributes have changed, this is much faster than checking each
     * individual argument. When attributes have changed, the overhead of this is
     * minimal.
     */
    var attrsArr = data.attrsArr;
    var newAttrs = data.newAttrs;
    var attrsChanged = false;
    var i = ATTRIBUTES_OFFSET;
    var j = 0;

    for (; i < arguments.length; i += 1, j += 1) {
      if (attrsArr[j] !== arguments[i]) {
        attrsChanged = true;
        break;
      }
    }

    for (; i < arguments.length; i += 1, j += 1) {
      attrsArr[j] = arguments[i];
    }

    if (j < attrsArr.length) {
      attrsChanged = true;
      attrsArr.length = j;
    }

    /*
     * Actually perform the attribute update.
     */
    if (attrsChanged) {
      for (i = ATTRIBUTES_OFFSET; i < arguments.length; i += 2) {
        newAttrs[arguments[i]] = arguments[i + 1];
      }

      for (var _attr in newAttrs) {
        updateAttribute(node, _attr, newAttrs[_attr]);
        newAttrs[_attr] = undefined;
      }
    }

    return node;
  };

  /**
   * Declares a virtual Element at the current location in the document. This
   * corresponds to an opening tag and a elementClose tag is required. This is
   * like elementOpen, but the attributes are defined using the attr function
   * rather than being passed as arguments. Must be folllowed by 0 or more calls
   * to attr, then a call to elementOpenEnd.
   * @param {string} tag The element's tag.
   * @param {?string=} key The key used to identify this element. This can be an
   *     empty string, but performance may be better if a unique value is used
   *     when iterating over an array of items.
   * @param {?Array<*>=} statics An array of attribute name/value pairs of the
   *     static attributes for the Element. These will only be set once when the
   *     Element is created.
   */
  var elementOpenStart = function (tag, key, statics) {
    if ('production' !== 'production') {}

    argsBuilder[0] = tag;
    argsBuilder[1] = key;
    argsBuilder[2] = statics;
  };

  /***
   * Defines a virtual attribute at this point of the DOM. This is only valid
   * when called between elementOpenStart and elementOpenEnd.
   *
   * @param {string} name
   * @param {*} value
   */
  var attr = function (name, value) {
    if ('production' !== 'production') {}

    argsBuilder.push(name, value);
  };

  /**
   * Closes an open tag started with elementOpenStart.
   * @return {!Element} The corresponding Element.
   */
  var elementOpenEnd = function () {
    if ('production' !== 'production') {}

    var node = elementOpen.apply(null, argsBuilder);
    argsBuilder.length = 0;
    return node;
  };

  /**
   * Closes an open virtual Element.
   *
   * @param {string} tag The element's tag.
   * @return {!Element} The corresponding Element.
   */
  var elementClose = function (tag) {
    if ('production' !== 'production') {}

    var node = coreElementClose();

    if ('production' !== 'production') {}

    return node;
  };

  /**
   * Declares a virtual Element at the current location in the document that has
   * no children.
   * @param {string} tag The element's tag.
   * @param {?string=} key The key used to identify this element. This can be an
   *     empty string, but performance may be better if a unique value is used
   *     when iterating over an array of items.
   * @param {?Array<*>=} statics An array of attribute name/value pairs of the
   *     static attributes for the Element. These will only be set once when the
   *     Element is created.
   * @param {...*} const_args Attribute name/value pairs of the dynamic attributes
   *     for the Element.
   * @return {!Element} The corresponding Element.
   */
  var elementVoid = function (tag, key, statics, const_args) {
    elementOpen.apply(null, arguments);
    return elementClose(tag);
  };

  /**
   * Declares a virtual Element at the current location in the document that is a
   * placeholder element. Children of this Element can be manually managed and
   * will not be cleared by the library.
   *
   * A key must be specified to make sure that this node is correctly preserved
   * across all conditionals.
   *
   * @param {string} tag The element's tag.
   * @param {string} key The key used to identify this element.
   * @param {?Array<*>=} statics An array of attribute name/value pairs of the
   *     static attributes for the Element. These will only be set once when the
   *     Element is created.
   * @param {...*} const_args Attribute name/value pairs of the dynamic attributes
   *     for the Element.
   * @return {!Element} The corresponding Element.
   */
  var elementPlaceholder = function (tag, key, statics, const_args) {
    if ('production' !== 'production') {}

    elementOpen.apply(null, arguments);
    skip();
    return elementClose(tag);
  };

  /**
   * Declares a virtual Text at this point in the document.
   *
   * @param {string|number|boolean} value The value of the Text.
   * @param {...(function((string|number|boolean)):string)} const_args
   *     Functions to format the value which are called only when the value has
   *     changed.
   * @return {!Text} The corresponding text node.
   */
  var text = function (value, const_args) {
    if ('production' !== 'production') {}

    var node = coreText();
    var data = getData(node);

    if (data.text !== value) {
      data.text = /** @type {string} */value;

      var formatted = value;
      for (var i = 1; i < arguments.length; i += 1) {
        /*
         * Call the formatter function directly to prevent leaking arguments.
         * https://github.com/google/incremental-dom/pull/204#issuecomment-178223574
         */
        var fn = arguments[i];
        formatted = fn(formatted);
      }

      node.data = formatted;
    }

    return node;
  };

  exports.patch = patchInner;
  exports.patchInner = patchInner;
  exports.patchOuter = patchOuter;
  exports.currentElement = currentElement;
  exports.skip = skip;
  exports.elementVoid = elementVoid;
  exports.elementOpenStart = elementOpenStart;
  exports.elementOpenEnd = elementOpenEnd;
  exports.elementOpen = elementOpen;
  exports.elementClose = elementClose;
  exports.elementPlaceholder = elementPlaceholder;
  exports.text = text;
  exports.attr = attr;
  exports.symbols = symbols;
  exports.attributes = attributes;
  exports.applyAttr = applyAttr;
  exports.applyProp = applyProp;
  exports.notifications = notifications;

}));


},{}],2:[function(require,module,exports){
/**
 * @license
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
// @version 0.7.22
if (typeof WeakMap === "undefined") {
  (function() {
    var defineProperty = Object.defineProperty;
    var counter = Date.now() % 1e9;
    var WeakMap = function() {
      this.name = "__st" + (Math.random() * 1e9 >>> 0) + (counter++ + "__");
    };
    WeakMap.prototype = {
      set: function(key, value) {
        var entry = key[this.name];
        if (entry && entry[0] === key) entry[1] = value; else defineProperty(key, this.name, {
          value: [ key, value ],
          writable: true
        });
        return this;
      },
      get: function(key) {
        var entry;
        return (entry = key[this.name]) && entry[0] === key ? entry[1] : undefined;
      },
      "delete": function(key) {
        var entry = key[this.name];
        if (!entry || entry[0] !== key) return false;
        entry[0] = entry[1] = undefined;
        return true;
      },
      has: function(key) {
        var entry = key[this.name];
        if (!entry) return false;
        return entry[0] === key;
      }
    };
    window.WeakMap = WeakMap;
  })();
}

(function(global) {
  if (global.JsMutationObserver) {
    return;
  }
  var registrationsTable = new WeakMap();
  var setImmediate;
  if (/Trident|Edge/.test(navigator.userAgent)) {
    setImmediate = setTimeout;
  } else if (window.setImmediate) {
    setImmediate = window.setImmediate;
  } else {
    var setImmediateQueue = [];
    var sentinel = String(Math.random());
    window.addEventListener("message", function(e) {
      if (e.data === sentinel) {
        var queue = setImmediateQueue;
        setImmediateQueue = [];
        queue.forEach(function(func) {
          func();
        });
      }
    });
    setImmediate = function(func) {
      setImmediateQueue.push(func);
      window.postMessage(sentinel, "*");
    };
  }
  var isScheduled = false;
  var scheduledObservers = [];
  function scheduleCallback(observer) {
    scheduledObservers.push(observer);
    if (!isScheduled) {
      isScheduled = true;
      setImmediate(dispatchCallbacks);
    }
  }
  function wrapIfNeeded(node) {
    return window.ShadowDOMPolyfill && window.ShadowDOMPolyfill.wrapIfNeeded(node) || node;
  }
  function dispatchCallbacks() {
    isScheduled = false;
    var observers = scheduledObservers;
    scheduledObservers = [];
    observers.sort(function(o1, o2) {
      return o1.uid_ - o2.uid_;
    });
    var anyNonEmpty = false;
    observers.forEach(function(observer) {
      var queue = observer.takeRecords();
      removeTransientObserversFor(observer);
      if (queue.length) {
        observer.callback_(queue, observer);
        anyNonEmpty = true;
      }
    });
    if (anyNonEmpty) dispatchCallbacks();
  }
  function removeTransientObserversFor(observer) {
    observer.nodes_.forEach(function(node) {
      var registrations = registrationsTable.get(node);
      if (!registrations) return;
      registrations.forEach(function(registration) {
        if (registration.observer === observer) registration.removeTransientObservers();
      });
    });
  }
  function forEachAncestorAndObserverEnqueueRecord(target, callback) {
    for (var node = target; node; node = node.parentNode) {
      var registrations = registrationsTable.get(node);
      if (registrations) {
        for (var j = 0; j < registrations.length; j++) {
          var registration = registrations[j];
          var options = registration.options;
          if (node !== target && !options.subtree) continue;
          var record = callback(options);
          if (record) registration.enqueue(record);
        }
      }
    }
  }
  var uidCounter = 0;
  function JsMutationObserver(callback) {
    this.callback_ = callback;
    this.nodes_ = [];
    this.records_ = [];
    this.uid_ = ++uidCounter;
  }
  JsMutationObserver.prototype = {
    observe: function(target, options) {
      target = wrapIfNeeded(target);
      if (!options.childList && !options.attributes && !options.characterData || options.attributeOldValue && !options.attributes || options.attributeFilter && options.attributeFilter.length && !options.attributes || options.characterDataOldValue && !options.characterData) {
        throw new SyntaxError();
      }
      var registrations = registrationsTable.get(target);
      if (!registrations) registrationsTable.set(target, registrations = []);
      var registration;
      for (var i = 0; i < registrations.length; i++) {
        if (registrations[i].observer === this) {
          registration = registrations[i];
          registration.removeListeners();
          registration.options = options;
          break;
        }
      }
      if (!registration) {
        registration = new Registration(this, target, options);
        registrations.push(registration);
        this.nodes_.push(target);
      }
      registration.addListeners();
    },
    disconnect: function() {
      this.nodes_.forEach(function(node) {
        var registrations = registrationsTable.get(node);
        for (var i = 0; i < registrations.length; i++) {
          var registration = registrations[i];
          if (registration.observer === this) {
            registration.removeListeners();
            registrations.splice(i, 1);
            break;
          }
        }
      }, this);
      this.records_ = [];
    },
    takeRecords: function() {
      var copyOfRecords = this.records_;
      this.records_ = [];
      return copyOfRecords;
    }
  };
  function MutationRecord(type, target) {
    this.type = type;
    this.target = target;
    this.addedNodes = [];
    this.removedNodes = [];
    this.previousSibling = null;
    this.nextSibling = null;
    this.attributeName = null;
    this.attributeNamespace = null;
    this.oldValue = null;
  }
  function copyMutationRecord(original) {
    var record = new MutationRecord(original.type, original.target);
    record.addedNodes = original.addedNodes.slice();
    record.removedNodes = original.removedNodes.slice();
    record.previousSibling = original.previousSibling;
    record.nextSibling = original.nextSibling;
    record.attributeName = original.attributeName;
    record.attributeNamespace = original.attributeNamespace;
    record.oldValue = original.oldValue;
    return record;
  }
  var currentRecord, recordWithOldValue;
  function getRecord(type, target) {
    return currentRecord = new MutationRecord(type, target);
  }
  function getRecordWithOldValue(oldValue) {
    if (recordWithOldValue) return recordWithOldValue;
    recordWithOldValue = copyMutationRecord(currentRecord);
    recordWithOldValue.oldValue = oldValue;
    return recordWithOldValue;
  }
  function clearRecords() {
    currentRecord = recordWithOldValue = undefined;
  }
  function recordRepresentsCurrentMutation(record) {
    return record === recordWithOldValue || record === currentRecord;
  }
  function selectRecord(lastRecord, newRecord) {
    if (lastRecord === newRecord) return lastRecord;
    if (recordWithOldValue && recordRepresentsCurrentMutation(lastRecord)) return recordWithOldValue;
    return null;
  }
  function Registration(observer, target, options) {
    this.observer = observer;
    this.target = target;
    this.options = options;
    this.transientObservedNodes = [];
  }
  Registration.prototype = {
    enqueue: function(record) {
      var records = this.observer.records_;
      var length = records.length;
      if (records.length > 0) {
        var lastRecord = records[length - 1];
        var recordToReplaceLast = selectRecord(lastRecord, record);
        if (recordToReplaceLast) {
          records[length - 1] = recordToReplaceLast;
          return;
        }
      } else {
        scheduleCallback(this.observer);
      }
      records[length] = record;
    },
    addListeners: function() {
      this.addListeners_(this.target);
    },
    addListeners_: function(node) {
      var options = this.options;
      if (options.attributes) node.addEventListener("DOMAttrModified", this, true);
      if (options.characterData) node.addEventListener("DOMCharacterDataModified", this, true);
      if (options.childList) node.addEventListener("DOMNodeInserted", this, true);
      if (options.childList || options.subtree) node.addEventListener("DOMNodeRemoved", this, true);
    },
    removeListeners: function() {
      this.removeListeners_(this.target);
    },
    removeListeners_: function(node) {
      var options = this.options;
      if (options.attributes) node.removeEventListener("DOMAttrModified", this, true);
      if (options.characterData) node.removeEventListener("DOMCharacterDataModified", this, true);
      if (options.childList) node.removeEventListener("DOMNodeInserted", this, true);
      if (options.childList || options.subtree) node.removeEventListener("DOMNodeRemoved", this, true);
    },
    addTransientObserver: function(node) {
      if (node === this.target) return;
      this.addListeners_(node);
      this.transientObservedNodes.push(node);
      var registrations = registrationsTable.get(node);
      if (!registrations) registrationsTable.set(node, registrations = []);
      registrations.push(this);
    },
    removeTransientObservers: function() {
      var transientObservedNodes = this.transientObservedNodes;
      this.transientObservedNodes = [];
      transientObservedNodes.forEach(function(node) {
        this.removeListeners_(node);
        var registrations = registrationsTable.get(node);
        for (var i = 0; i < registrations.length; i++) {
          if (registrations[i] === this) {
            registrations.splice(i, 1);
            break;
          }
        }
      }, this);
    },
    handleEvent: function(e) {
      e.stopImmediatePropagation();
      switch (e.type) {
       case "DOMAttrModified":
        var name = e.attrName;
        var namespace = e.relatedNode.namespaceURI;
        var target = e.target;
        var record = new getRecord("attributes", target);
        record.attributeName = name;
        record.attributeNamespace = namespace;
        var oldValue = e.attrChange === MutationEvent.ADDITION ? null : e.prevValue;
        forEachAncestorAndObserverEnqueueRecord(target, function(options) {
          if (!options.attributes) return;
          if (options.attributeFilter && options.attributeFilter.length && options.attributeFilter.indexOf(name) === -1 && options.attributeFilter.indexOf(namespace) === -1) {
            return;
          }
          if (options.attributeOldValue) return getRecordWithOldValue(oldValue);
          return record;
        });
        break;

       case "DOMCharacterDataModified":
        var target = e.target;
        var record = getRecord("characterData", target);
        var oldValue = e.prevValue;
        forEachAncestorAndObserverEnqueueRecord(target, function(options) {
          if (!options.characterData) return;
          if (options.characterDataOldValue) return getRecordWithOldValue(oldValue);
          return record;
        });
        break;

       case "DOMNodeRemoved":
        this.addTransientObserver(e.target);

       case "DOMNodeInserted":
        var changedNode = e.target;
        var addedNodes, removedNodes;
        if (e.type === "DOMNodeInserted") {
          addedNodes = [ changedNode ];
          removedNodes = [];
        } else {
          addedNodes = [];
          removedNodes = [ changedNode ];
        }
        var previousSibling = changedNode.previousSibling;
        var nextSibling = changedNode.nextSibling;
        var record = getRecord("childList", e.target.parentNode);
        record.addedNodes = addedNodes;
        record.removedNodes = removedNodes;
        record.previousSibling = previousSibling;
        record.nextSibling = nextSibling;
        forEachAncestorAndObserverEnqueueRecord(e.relatedNode, function(options) {
          if (!options.childList) return;
          return record;
        });
      }
      clearRecords();
    }
  };
  global.JsMutationObserver = JsMutationObserver;
  if (!global.MutationObserver) {
    global.MutationObserver = JsMutationObserver;
    JsMutationObserver._isPolyfilled = true;
  }
})(self);

(function(scope) {
  "use strict";
  if (!window.performance) {
    var start = Date.now();
    window.performance = {
      now: function() {
        return Date.now() - start;
      }
    };
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function() {
      var nativeRaf = window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
      return nativeRaf ? function(callback) {
        return nativeRaf(function() {
          callback(performance.now());
        });
      } : function(callback) {
        return window.setTimeout(callback, 1e3 / 60);
      };
    }();
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function() {
      return window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || function(id) {
        clearTimeout(id);
      };
    }();
  }
  var workingDefaultPrevented = function() {
    var e = document.createEvent("Event");
    e.initEvent("foo", true, true);
    e.preventDefault();
    return e.defaultPrevented;
  }();
  if (!workingDefaultPrevented) {
    var origPreventDefault = Event.prototype.preventDefault;
    Event.prototype.preventDefault = function() {
      if (!this.cancelable) {
        return;
      }
      origPreventDefault.call(this);
      Object.defineProperty(this, "defaultPrevented", {
        get: function() {
          return true;
        },
        configurable: true
      });
    };
  }
  var isIE = /Trident/.test(navigator.userAgent);
  if (!window.CustomEvent || isIE && typeof window.CustomEvent !== "function") {
    window.CustomEvent = function(inType, params) {
      params = params || {};
      var e = document.createEvent("CustomEvent");
      e.initCustomEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable), params.detail);
      return e;
    };
    window.CustomEvent.prototype = window.Event.prototype;
  }
  if (!window.Event || isIE && typeof window.Event !== "function") {
    var origEvent = window.Event;
    window.Event = function(inType, params) {
      params = params || {};
      var e = document.createEvent("Event");
      e.initEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable));
      return e;
    };
    window.Event.prototype = origEvent.prototype;
  }
})(window.WebComponents);

window.CustomElements = window.CustomElements || {
  flags: {}
};

(function(scope) {
  var flags = scope.flags;
  var modules = [];
  var addModule = function(module) {
    modules.push(module);
  };
  var initializeModules = function() {
    modules.forEach(function(module) {
      module(scope);
    });
  };
  scope.addModule = addModule;
  scope.initializeModules = initializeModules;
  scope.hasNative = Boolean(document.registerElement);
  scope.isIE = /Trident/.test(navigator.userAgent);
  scope.useNative = !flags.register && scope.hasNative && !window.ShadowDOMPolyfill && (!window.HTMLImports || window.HTMLImports.useNative);
})(window.CustomElements);

window.CustomElements.addModule(function(scope) {
  var IMPORT_LINK_TYPE = window.HTMLImports ? window.HTMLImports.IMPORT_LINK_TYPE : "none";
  function forSubtree(node, cb) {
    findAllElements(node, function(e) {
      if (cb(e)) {
        return true;
      }
      forRoots(e, cb);
    });
    forRoots(node, cb);
  }
  function findAllElements(node, find, data) {
    var e = node.firstElementChild;
    if (!e) {
      e = node.firstChild;
      while (e && e.nodeType !== Node.ELEMENT_NODE) {
        e = e.nextSibling;
      }
    }
    while (e) {
      if (find(e, data) !== true) {
        findAllElements(e, find, data);
      }
      e = e.nextElementSibling;
    }
    return null;
  }
  function forRoots(node, cb) {
    var root = node.shadowRoot;
    while (root) {
      forSubtree(root, cb);
      root = root.olderShadowRoot;
    }
  }
  function forDocumentTree(doc, cb) {
    _forDocumentTree(doc, cb, []);
  }
  function _forDocumentTree(doc, cb, processingDocuments) {
    doc = window.wrap(doc);
    if (processingDocuments.indexOf(doc) >= 0) {
      return;
    }
    processingDocuments.push(doc);
    var imports = doc.querySelectorAll("link[rel=" + IMPORT_LINK_TYPE + "]");
    for (var i = 0, l = imports.length, n; i < l && (n = imports[i]); i++) {
      if (n.import) {
        _forDocumentTree(n.import, cb, processingDocuments);
      }
    }
    cb(doc);
  }
  scope.forDocumentTree = forDocumentTree;
  scope.forSubtree = forSubtree;
});

window.CustomElements.addModule(function(scope) {
  var flags = scope.flags;
  var forSubtree = scope.forSubtree;
  var forDocumentTree = scope.forDocumentTree;
  function addedNode(node, isAttached) {
    return added(node, isAttached) || addedSubtree(node, isAttached);
  }
  function added(node, isAttached) {
    if (scope.upgrade(node, isAttached)) {
      return true;
    }
    if (isAttached) {
      attached(node);
    }
  }
  function addedSubtree(node, isAttached) {
    forSubtree(node, function(e) {
      if (added(e, isAttached)) {
        return true;
      }
    });
  }
  var hasThrottledAttached = window.MutationObserver._isPolyfilled && flags["throttle-attached"];
  scope.hasPolyfillMutations = hasThrottledAttached;
  scope.hasThrottledAttached = hasThrottledAttached;
  var isPendingMutations = false;
  var pendingMutations = [];
  function deferMutation(fn) {
    pendingMutations.push(fn);
    if (!isPendingMutations) {
      isPendingMutations = true;
      setTimeout(takeMutations);
    }
  }
  function takeMutations() {
    isPendingMutations = false;
    var $p = pendingMutations;
    for (var i = 0, l = $p.length, p; i < l && (p = $p[i]); i++) {
      p();
    }
    pendingMutations = [];
  }
  function attached(element) {
    if (hasThrottledAttached) {
      deferMutation(function() {
        _attached(element);
      });
    } else {
      _attached(element);
    }
  }
  function _attached(element) {
    if (element.__upgraded__ && !element.__attached) {
      element.__attached = true;
      if (element.attachedCallback) {
        element.attachedCallback();
      }
    }
  }
  function detachedNode(node) {
    detached(node);
    forSubtree(node, function(e) {
      detached(e);
    });
  }
  function detached(element) {
    if (hasThrottledAttached) {
      deferMutation(function() {
        _detached(element);
      });
    } else {
      _detached(element);
    }
  }
  function _detached(element) {
    if (element.__upgraded__ && element.__attached) {
      element.__attached = false;
      if (element.detachedCallback) {
        element.detachedCallback();
      }
    }
  }
  function inDocument(element) {
    var p = element;
    var doc = window.wrap(document);
    while (p) {
      if (p == doc) {
        return true;
      }
      p = p.parentNode || p.nodeType === Node.DOCUMENT_FRAGMENT_NODE && p.host;
    }
  }
  function watchShadow(node) {
    if (node.shadowRoot && !node.shadowRoot.__watched) {
      flags.dom && console.log("watching shadow-root for: ", node.localName);
      var root = node.shadowRoot;
      while (root) {
        observe(root);
        root = root.olderShadowRoot;
      }
    }
  }
  function handler(root, mutations) {
    if (flags.dom) {
      var mx = mutations[0];
      if (mx && mx.type === "childList" && mx.addedNodes) {
        if (mx.addedNodes) {
          var d = mx.addedNodes[0];
          while (d && d !== document && !d.host) {
            d = d.parentNode;
          }
          var u = d && (d.URL || d._URL || d.host && d.host.localName) || "";
          u = u.split("/?").shift().split("/").pop();
        }
      }
      console.group("mutations (%d) [%s]", mutations.length, u || "");
    }
    var isAttached = inDocument(root);
    mutations.forEach(function(mx) {
      if (mx.type === "childList") {
        forEach(mx.addedNodes, function(n) {
          if (!n.localName) {
            return;
          }
          addedNode(n, isAttached);
        });
        forEach(mx.removedNodes, function(n) {
          if (!n.localName) {
            return;
          }
          detachedNode(n);
        });
      }
    });
    flags.dom && console.groupEnd();
  }
  function takeRecords(node) {
    node = window.wrap(node);
    if (!node) {
      node = window.wrap(document);
    }
    while (node.parentNode) {
      node = node.parentNode;
    }
    var observer = node.__observer;
    if (observer) {
      handler(node, observer.takeRecords());
      takeMutations();
    }
  }
  var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
  function observe(inRoot) {
    if (inRoot.__observer) {
      return;
    }
    var observer = new MutationObserver(handler.bind(this, inRoot));
    observer.observe(inRoot, {
      childList: true,
      subtree: true
    });
    inRoot.__observer = observer;
  }
  function upgradeDocument(doc) {
    doc = window.wrap(doc);
    flags.dom && console.group("upgradeDocument: ", doc.baseURI.split("/").pop());
    var isMainDocument = doc === window.wrap(document);
    addedNode(doc, isMainDocument);
    observe(doc);
    flags.dom && console.groupEnd();
  }
  function upgradeDocumentTree(doc) {
    forDocumentTree(doc, upgradeDocument);
  }
  var originalCreateShadowRoot = Element.prototype.createShadowRoot;
  if (originalCreateShadowRoot) {
    Element.prototype.createShadowRoot = function() {
      var root = originalCreateShadowRoot.call(this);
      window.CustomElements.watchShadow(this);
      return root;
    };
  }
  scope.watchShadow = watchShadow;
  scope.upgradeDocumentTree = upgradeDocumentTree;
  scope.upgradeDocument = upgradeDocument;
  scope.upgradeSubtree = addedSubtree;
  scope.upgradeAll = addedNode;
  scope.attached = attached;
  scope.takeRecords = takeRecords;
});

window.CustomElements.addModule(function(scope) {
  var flags = scope.flags;
  function upgrade(node, isAttached) {
    if (node.localName === "template") {
      if (window.HTMLTemplateElement && HTMLTemplateElement.decorate) {
        HTMLTemplateElement.decorate(node);
      }
    }
    if (!node.__upgraded__ && node.nodeType === Node.ELEMENT_NODE) {
      var is = node.getAttribute("is");
      var definition = scope.getRegisteredDefinition(node.localName) || scope.getRegisteredDefinition(is);
      if (definition) {
        if (is && definition.tag == node.localName || !is && !definition.extends) {
          return upgradeWithDefinition(node, definition, isAttached);
        }
      }
    }
  }
  function upgradeWithDefinition(element, definition, isAttached) {
    flags.upgrade && console.group("upgrade:", element.localName);
    if (definition.is) {
      element.setAttribute("is", definition.is);
    }
    implementPrototype(element, definition);
    element.__upgraded__ = true;
    created(element);
    if (isAttached) {
      scope.attached(element);
    }
    scope.upgradeSubtree(element, isAttached);
    flags.upgrade && console.groupEnd();
    return element;
  }
  function implementPrototype(element, definition) {
    if (Object.__proto__) {
      element.__proto__ = definition.prototype;
    } else {
      customMixin(element, definition.prototype, definition.native);
      element.__proto__ = definition.prototype;
    }
  }
  function customMixin(inTarget, inSrc, inNative) {
    var used = {};
    var p = inSrc;
    while (p !== inNative && p !== HTMLElement.prototype) {
      var keys = Object.getOwnPropertyNames(p);
      for (var i = 0, k; k = keys[i]; i++) {
        if (!used[k]) {
          Object.defineProperty(inTarget, k, Object.getOwnPropertyDescriptor(p, k));
          used[k] = 1;
        }
      }
      p = Object.getPrototypeOf(p);
    }
  }
  function created(element) {
    if (element.createdCallback) {
      element.createdCallback();
    }
  }
  scope.upgrade = upgrade;
  scope.upgradeWithDefinition = upgradeWithDefinition;
  scope.implementPrototype = implementPrototype;
});

window.CustomElements.addModule(function(scope) {
  var isIE = scope.isIE;
  var upgradeDocumentTree = scope.upgradeDocumentTree;
  var upgradeAll = scope.upgradeAll;
  var upgradeWithDefinition = scope.upgradeWithDefinition;
  var implementPrototype = scope.implementPrototype;
  var useNative = scope.useNative;
  function register(name, options) {
    var definition = options || {};
    if (!name) {
      throw new Error("document.registerElement: first argument `name` must not be empty");
    }
    if (name.indexOf("-") < 0) {
      throw new Error("document.registerElement: first argument ('name') must contain a dash ('-'). Argument provided was '" + String(name) + "'.");
    }
    if (isReservedTag(name)) {
      throw new Error("Failed to execute 'registerElement' on 'Document': Registration failed for type '" + String(name) + "'. The type name is invalid.");
    }
    if (getRegisteredDefinition(name)) {
      throw new Error("DuplicateDefinitionError: a type with name '" + String(name) + "' is already registered");
    }
    if (!definition.prototype) {
      definition.prototype = Object.create(HTMLElement.prototype);
    }
    definition.__name = name.toLowerCase();
    if (definition.extends) {
      definition.extends = definition.extends.toLowerCase();
    }
    definition.lifecycle = definition.lifecycle || {};
    definition.ancestry = ancestry(definition.extends);
    resolveTagName(definition);
    resolvePrototypeChain(definition);
    overrideAttributeApi(definition.prototype);
    registerDefinition(definition.__name, definition);
    definition.ctor = generateConstructor(definition);
    definition.ctor.prototype = definition.prototype;
    definition.prototype.constructor = definition.ctor;
    if (scope.ready) {
      upgradeDocumentTree(document);
    }
    return definition.ctor;
  }
  function overrideAttributeApi(prototype) {
    if (prototype.setAttribute._polyfilled) {
      return;
    }
    var setAttribute = prototype.setAttribute;
    prototype.setAttribute = function(name, value) {
      changeAttribute.call(this, name, value, setAttribute);
    };
    var removeAttribute = prototype.removeAttribute;
    prototype.removeAttribute = function(name) {
      changeAttribute.call(this, name, null, removeAttribute);
    };
    prototype.setAttribute._polyfilled = true;
  }
  function changeAttribute(name, value, operation) {
    name = name.toLowerCase();
    var oldValue = this.getAttribute(name);
    operation.apply(this, arguments);
    var newValue = this.getAttribute(name);
    if (this.attributeChangedCallback && newValue !== oldValue) {
      this.attributeChangedCallback(name, oldValue, newValue);
    }
  }
  function isReservedTag(name) {
    for (var i = 0; i < reservedTagList.length; i++) {
      if (name === reservedTagList[i]) {
        return true;
      }
    }
  }
  var reservedTagList = [ "annotation-xml", "color-profile", "font-face", "font-face-src", "font-face-uri", "font-face-format", "font-face-name", "missing-glyph" ];
  function ancestry(extnds) {
    var extendee = getRegisteredDefinition(extnds);
    if (extendee) {
      return ancestry(extendee.extends).concat([ extendee ]);
    }
    return [];
  }
  function resolveTagName(definition) {
    var baseTag = definition.extends;
    for (var i = 0, a; a = definition.ancestry[i]; i++) {
      baseTag = a.is && a.tag;
    }
    definition.tag = baseTag || definition.__name;
    if (baseTag) {
      definition.is = definition.__name;
    }
  }
  function resolvePrototypeChain(definition) {
    if (!Object.__proto__) {
      var nativePrototype = HTMLElement.prototype;
      if (definition.is) {
        var inst = document.createElement(definition.tag);
        nativePrototype = Object.getPrototypeOf(inst);
      }
      var proto = definition.prototype, ancestor;
      var foundPrototype = false;
      while (proto) {
        if (proto == nativePrototype) {
          foundPrototype = true;
        }
        ancestor = Object.getPrototypeOf(proto);
        if (ancestor) {
          proto.__proto__ = ancestor;
        }
        proto = ancestor;
      }
      if (!foundPrototype) {
        console.warn(definition.tag + " prototype not found in prototype chain for " + definition.is);
      }
      definition.native = nativePrototype;
    }
  }
  function instantiate(definition) {
    return upgradeWithDefinition(domCreateElement(definition.tag), definition);
  }
  var registry = {};
  function getRegisteredDefinition(name) {
    if (name) {
      return registry[name.toLowerCase()];
    }
  }
  function registerDefinition(name, definition) {
    registry[name] = definition;
  }
  function generateConstructor(definition) {
    return function() {
      return instantiate(definition);
    };
  }
  var HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
  function createElementNS(namespace, tag, typeExtension) {
    if (namespace === HTML_NAMESPACE) {
      return createElement(tag, typeExtension);
    } else {
      return domCreateElementNS(namespace, tag);
    }
  }
  function createElement(tag, typeExtension) {
    if (tag) {
      tag = tag.toLowerCase();
    }
    if (typeExtension) {
      typeExtension = typeExtension.toLowerCase();
    }
    var definition = getRegisteredDefinition(typeExtension || tag);
    if (definition) {
      if (tag == definition.tag && typeExtension == definition.is) {
        return new definition.ctor();
      }
      if (!typeExtension && !definition.is) {
        return new definition.ctor();
      }
    }
    var element;
    if (typeExtension) {
      element = createElement(tag);
      element.setAttribute("is", typeExtension);
      return element;
    }
    element = domCreateElement(tag);
    if (tag.indexOf("-") >= 0) {
      implementPrototype(element, HTMLElement);
    }
    return element;
  }
  var domCreateElement = document.createElement.bind(document);
  var domCreateElementNS = document.createElementNS.bind(document);
  var isInstance;
  if (!Object.__proto__ && !useNative) {
    isInstance = function(obj, ctor) {
      if (obj instanceof ctor) {
        return true;
      }
      var p = obj;
      while (p) {
        if (p === ctor.prototype) {
          return true;
        }
        p = p.__proto__;
      }
      return false;
    };
  } else {
    isInstance = function(obj, base) {
      return obj instanceof base;
    };
  }
  function wrapDomMethodToForceUpgrade(obj, methodName) {
    var orig = obj[methodName];
    obj[methodName] = function() {
      var n = orig.apply(this, arguments);
      upgradeAll(n);
      return n;
    };
  }
  wrapDomMethodToForceUpgrade(Node.prototype, "cloneNode");
  wrapDomMethodToForceUpgrade(document, "importNode");
  document.registerElement = register;
  document.createElement = createElement;
  document.createElementNS = createElementNS;
  scope.registry = registry;
  scope.instanceof = isInstance;
  scope.reservedTagList = reservedTagList;
  scope.getRegisteredDefinition = getRegisteredDefinition;
  document.register = document.registerElement;
});

(function(scope) {
  var useNative = scope.useNative;
  var initializeModules = scope.initializeModules;
  var isIE = scope.isIE;
  if (useNative) {
    var nop = function() {};
    scope.watchShadow = nop;
    scope.upgrade = nop;
    scope.upgradeAll = nop;
    scope.upgradeDocumentTree = nop;
    scope.upgradeSubtree = nop;
    scope.takeRecords = nop;
    scope.instanceof = function(obj, base) {
      return obj instanceof base;
    };
  } else {
    initializeModules();
  }
  var upgradeDocumentTree = scope.upgradeDocumentTree;
  var upgradeDocument = scope.upgradeDocument;
  if (!window.wrap) {
    if (window.ShadowDOMPolyfill) {
      window.wrap = window.ShadowDOMPolyfill.wrapIfNeeded;
      window.unwrap = window.ShadowDOMPolyfill.unwrapIfNeeded;
    } else {
      window.wrap = window.unwrap = function(node) {
        return node;
      };
    }
  }
  if (window.HTMLImports) {
    window.HTMLImports.__importsParsingHook = function(elt) {
      if (elt.import) {
        upgradeDocument(wrap(elt.import));
      }
    };
  }
  function bootstrap() {
    upgradeDocumentTree(window.wrap(document));
    window.CustomElements.ready = true;
    var requestAnimationFrame = window.requestAnimationFrame || function(f) {
      setTimeout(f, 16);
    };
    requestAnimationFrame(function() {
      setTimeout(function() {
        window.CustomElements.readyTime = Date.now();
        if (window.HTMLImports) {
          window.CustomElements.elapsed = window.CustomElements.readyTime - window.HTMLImports.readyTime;
        }
        document.dispatchEvent(new CustomEvent("WebComponentsReady", {
          bubbles: true
        }));
      });
    });
  }
  if (document.readyState === "complete" || scope.flags.eager) {
    bootstrap();
  } else if (document.readyState === "interactive" && !window.attachEvent && (!window.HTMLImports || window.HTMLImports.ready)) {
    bootstrap();
  } else {
    var loadEvent = window.HTMLImports && !window.HTMLImports.ready ? "HTMLImportsLoaded" : "DOMContentLoaded";
    window.addEventListener(loadEvent, bootstrap);
  }
})(window.CustomElements);
},{}],3:[function(require,module,exports){
(function(self) {
  'use strict';

  if (self.fetch) {
    return
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob()
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift()
        return {done: value === undefined, value: value}
      }
    }

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      }
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      this.map[name].forEach(function(value) {
        callback.call(thisArg, value, name, this)
      }, this)
    }, this)
  }

  Headers.prototype.keys = function() {
    var items = []
    this.forEach(function(value, name) { items.push(name) })
    return iteratorFor(items)
  }

  Headers.prototype.values = function() {
    var items = []
    this.forEach(function(value) { items.push(value) })
    return iteratorFor(items)
  }

  Headers.prototype.entries = function() {
    var items = []
    this.forEach(function(value, name) { items.push([name, value]) })
    return iteratorFor(items)
  }

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    reader.readAsText(blob)
    return fileReaderReady(reader)
  }

  function Body() {
    this.bodyUsed = false

    this._initBody = function(body) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString()
      } else if (!body) {
        this._bodyText = ''
      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
        // Only support ArrayBuffers for POST method.
        // Receiving ArrayBuffers happens via Blobs, instead.
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8')
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type)
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
        }
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = input
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = (xhr.getAllResponseHeaders() || '').trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this.type = 'default'
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
    this._initBody(bodyInit)
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers
  self.Request = Request
  self.Response = Response

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input
      } else {
        request = new Request(input, init)
      }

      var xhr = new XMLHttpRequest()

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})(typeof self !== 'undefined' ? self : this);

},{}],4:[function(require,module,exports){
'use strict';

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/**
 * Aggregate values from dom tree
 */

var Aggregator = function () {
  function Aggregator(element) {
    _classCallCheck(this, Aggregator);

    this.element = element;
  }

  _createClass(Aggregator, [{
    key: 'aggregate',
    value: function aggregate(scope) {
      var elems = this.element.querySelectorAll('input,select,textarea');
      for (var i = 0, l = elems.length; i < l; ++i) {
        var elem = elems[i];
        var modelName = elem.getAttribute('sj-model');
        if (modelName && modelName.substr(0, 5) === 'this.') {
          var val = elem.type === 'checkbox' ? elem.checked : elem.value;
          new Function('$val', 'if (!' + modelName + ') { ' + modelName + '=$val; }').apply(scope, [val]);
        }
      }
    }
  }]);

  return Aggregator;
}();

module.exports = Aggregator;

},{}],5:[function(require,module,exports){
'use strict';

var Compiler = require('./compiler.js');
var Aggregator = require('./aggregator.js');
var IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');

window.addEventListener("DOMContentLoaded", function () {
  var elems = document.querySelectorAll('[sj-app]');

  var _loop = function _loop(i, l) {
    var elem = elems[i];

    var template = document.createElement("div");

    // copy attributes
    var attributes = elem.attributes;
    for (var _i = 0, _l = attributes.length; _i < _l; _i++) {
      var attr = attributes[_i];
      template.setAttribute(attr.name, attr.value);
    }

    new Aggregator(elem).aggregate(template);
    var compiled = new Compiler().compile(elem);
    template.update = function () {
      var _this = this;

      IncrementalDOM.patch(this, function () {
        compiled.apply(_this, [IncrementalDOM]);
      });
    };

    var app = elem.getAttribute('sj-app');
    var replaced = elem.parentNode.replaceChild(template, elem);
    if (app) {
      // Note. sj allows sj-app="" for demo app.
      var func = window[app];
      if (func) {
        func.apply(template);
      } else {
        throw 'Unknown function \'' + app + '\', specefied by sj-app';
      }
    }
    template.update();
  };

  for (var i = 0, l = elems.length; i < l; ++i) {
    _loop(i, l);
  }
});

},{"./aggregator.js":4,"./compiler.js":6,"incremental-dom/dist/incremental-dom.js":1}],6:[function(require,module,exports){
'use strict';

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');
var scan = require('./text-expression-scanner.js');
var assert = function assert(val) {};

// hack
// https://github.com/google/incremental-dom/issues/239
IncrementalDOM.attributes.value = function (el, name, value) {
  el.value = value;
};

var sj_attr2event = {
  'sj-click': 'onclick',
  'sj-blur': 'onblur',
  'sj-checked': 'onchecked',
  'sj-dblclick': 'ondblclick',
  'sj-focus': 'onfocus',
  'sj-keydown': 'onkeydown',
  'sj-keypress': 'onkeypress',
  'sj-keyup': 'onkeyup',
  'sj-mousedown': 'onmousedown',
  'sj-mouseenter': 'onmouseenter',
  'sj-mouseleave': 'onmouseleave',
  'sj-mousemove': 'onmousemove',
  'sj-mouseover': 'onmouseover',
  'sj-mouseup': 'onmouseup',
  'sj-paste': 'onpaste',
  'sj-selected': 'onselected',
  'sj-change': 'onchange',
  'sj-submit': 'onsubmit'
};

var sj_boolean_attributes = {
  'sj-disabled': 'disabled',
  'sj-required': 'required',
  'sj-checked': 'checked'
};

var Compiler = function () {
  function Compiler() {
    _classCallCheck(this, Compiler);

    assert(arguments.length === 0);
  }

  _createClass(Compiler, [{
    key: 'compile',
    value: function compile(templateElement) {
      var children = templateElement.childNodes;
      var code = [];
      for (var i = 0; i < children.length; ++i) {
        code = code.concat(this.renderDOM(children[i], []));
      }
      // console.log(code.join(";\n"));
      return new Function('IncrementalDOM', code.join(";\n"));
    }
  }, {
    key: 'renderDOM',
    value: function renderDOM(elem, vars) {
      assert(elem);
      assert(vars);
      if (elem.nodeType === Node.TEXT_NODE) {
        return 'IncrementalDOM.text(' + this.text(elem.textContent) + ')';
      } else if (elem.nodeType === Node.COMMENT_NODE) {
        // Ignore comment node
        return '';
      }

      var headers = [];
      var footers = [];
      var body = [];

      // process `sj-if`
      {
        var cond = elem.getAttribute('sj-if');
        if (cond) {
          headers.push('if (' + cond + ') {');
          footers.push('}');
        }
      }

      // process `sj-repeat`
      {
        var _cond = elem.getAttribute('sj-repeat');
        if (_cond) {
          var m = _cond.match(/^\s*(?:(\w+)|\(\s*(\w+)\s*,\s*(\w+)\s*\))\s+in\s+([a-z][a-z0-9.]*)\s*$/);
          if (!m) {
            throw 'Invalid sj-repeat value: ' + _cond;
          }

          if (m[1]) {
            var varName = m[1];
            var container = m[4];

            headers.push('(function(IncrementalDOM) {\nvar $$container=' + container + ';\nfor (var $index=0,$l=$$container.length; $index<$l; $index++) {\nvar ' + varName + '=$$container[$index];');
            footers.push('}\n}).apply(this, [IncrementalDOM]);');

            vars = vars.concat([varName, '$index']);
          } else {
            var keyName = m[2];
            var valueName = m[3];
            var _container = m[4];
            headers.push('(function(IncrementalDOM) {\n$$container=' + _container + ';for (var ' + keyName + ' in $$container) {\nvar ' + valueName + '=$$container[' + keyName + '];');
            footers.push('}\n}).apply(this, [IncrementalDOM]);');
            vars = vars.concat([keyName, valueName]);
          }
        }
      }

      var tagName = elem.tagName.toLowerCase();

      // process attributes
      body.push('IncrementalDOM.elementOpenStart("' + tagName + '")');
      body = body.concat(this.renderAttributes(elem, vars));
      body.push('IncrementalDOM.elementOpenEnd("' + tagName + '")');

      var bind = elem.getAttribute('sj-bind');
      if (tagName.indexOf('-') >= 0) {
        body.push('IncrementalDOM.skip()');
      } else if (bind) {
        body.push('IncrementalDOM.text(' + bind + ');');
      } else {
        var children = elem.childNodes;
        for (var i = 0, l = children.length; i < l; ++i) {
          var child = children[i];
          if (child.nodeType === Node.TEXT_NODE) {
            // replaceVariables
            body.push('IncrementalDOM.text(' + this.text(child.textContent) + ')');
          } else {
            body = body.concat(this.renderDOM(child, vars));
          }
        }
      }
      body.push('IncrementalDOM.elementClose("' + tagName + '")');

      var retval = [';'].concat(headers).concat(body).concat(footers);
      // console.log(`DONE renderDOM ${JSON.stringify(retval)}`);
      return retval;
    }
  }, {
    key: 'renderAttributes',
    value: function renderAttributes(elem, vars) {
      assert(vars);
      var attrs = elem.attributes;
      var codeList = [];
      var model = elem.getAttribute('sj-model');
      var events = {};
      for (var i = 0, l = attrs.length; i < l; ++i) {
        var attr = attrs[i];
        var code = this.renderAttribute(elem, attrs[i], vars, events);
        codeList.push(code);
      }

      var normalEvents = ['onclick', 'onblur', 'onchecked', 'ondblclick', 'onfocus', 'onkeydown', 'onkeypress', 'onkeyup', 'onmousedown', 'onmouseenter', 'onmouseleave', 'onmousemove', 'onmouseover', 'onmouseup', 'onpaste', 'onselected', 'onsubmit'];
      if (model) {
        if (elem.type === 'checkbox' || elem.type === 'radio') {
          normalEvents.push('oninput');
          var _code = events['onchange'] || '';
          codeList.push('\n          if (' + model + ') {\n            IncrementalDOM.attr("checked", \'checked\');\n          }\n          IncrementalDOM.attr("onchange", function (' + vars.concat(['$event']).join(",") + ') {\n            ' + model + ' = $event.target.checked;\n            ' + _code + ';\n            this.update();\n          }.bind(' + ['this'].concat(vars).join(",") + '));\n        ');
        } else {
          normalEvents.push('onchange');
          var _code2 = events['oninput'] || '';
          codeList.push('\n          IncrementalDOM.attr("value", ' + model + ');\n          IncrementalDOM.attr("oninput", function (' + vars.concat(['$event']).join(",") + ') {\n            ' + model + ' = $event.target.value;\n            ' + _code2 + ';\n            this.update();\n          }.bind(' + ['this'].concat(vars).join(",") + '));\n        ');
        }
      }
      for (var _i = 0, _l = normalEvents.length; _i < _l; _i++) {
        var eventName = normalEvents[_i];
        var expression = events[eventName];
        if (expression) {
          codeList.push(';\n        IncrementalDOM.attr("' + eventName + '", function (' + vars.concat(['$event']).join(",") + ') {\n          ' + expression + ';\n        }.bind(' + ['this'].concat(vars).join(",") + '));');
        }
      }

      // console.log(`DONE renderAttributes ${JSON.stringify(codeList)}`);
      return codeList;
    }
  }, {
    key: 'renderAttribute',
    value: function renderAttribute(elem, attr, vars, events) {
      assert(vars);
      // console.log(`renderAttribute: ${attr.name}=${attr.value}`);

      var attrName = attr.name;
      if (attrName.substr(0, 3) === 'sj-') {
        var event = sj_attr2event[attrName];
        if (event) {
          var expression = attr.value;
          events[event] = expression;
          return '';
        } else if (sj_boolean_attributes[attr.name]) {
          var attribute = sj_boolean_attributes[attr.name];
          var _expression = attr.value;
          return 'if (' + _expression + ') { IncrementalDOM.attr("' + attribute + '", "' + attribute + '"); }';
        } else if (attr.name === 'sj-class') {
          return 'IncrementalDOM.attr("class", ' + attr.value + '.join(" "));';
        } else if (attr.name === 'sj-href') {
          return 'IncrementalDOM.attr("href", ' + attr.value + '.replace(/^[^:]+?:/, function (scheme) { return (scheme === \'http:\' || scheme === \'https://\') ? scheme : \'unsafe:\' + scheme }));';
        } else if (attr.name.substr(0, 8) === 'sj-attr-') {
          return 'IncrementalDOM.attr(' + JSON.stringify(attr.name.substr(8)) + ', ' + attr.value + ');';
        } else {
          return '';
        }
      } else {
        return 'IncrementalDOM.attr("' + attr.name + '", ' + this.text(attr.value) + ');';
      }
    }
  }, {
    key: 'text',
    value: function text(s) {
      return JSON.stringify(s);
    }
  }]);

  return Compiler;
}();

module.exports = Compiler;

},{"./text-expression-scanner.js":12,"incremental-dom/dist/incremental-dom.js":1}],7:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Compiler = require('./compiler.js');
var Aggregator = require('./aggregator.js');
var IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');

// babel hacks
// See https://phabricator.babeljs.io/T1548
if (typeof HTMLElement !== 'function') {
  var _HTMLElement = function _HTMLElement() {};
  _HTMLElement.prototype = HTMLElement.prototype;
  HTMLElement = _HTMLElement;
}

var Element = function (_HTMLElement2) {
  _inherits(Element, _HTMLElement2);

  function Element() {
    _classCallCheck(this, Element);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Element).apply(this, arguments));
  }

  _createClass(Element, [{
    key: 'createdCallback',
    value: function createdCallback() {
      // parse template
      var template = this.template();
      if (!template) {
        throw 'template shouldn\'t be null';
      }

      var html = document.createElement("div");
      html.innerHTML = template;

      this.prepare();

      // TODO cache result as class variable.
      new Aggregator(html).aggregate(this);
      this.compiled = new Compiler().compile(html);

      this.initialize();

      this.update();
    }
  }, {
    key: 'template',
    value: function template() {
      throw "Please implement 'template' method";
    }
  }, {
    key: 'attributeChangedCallback',
    value: function attributeChangedCallback(key) {
      this[key] = this.getAttribute(key);
      this.update();
    }
  }, {
    key: 'prepare',
    value: function prepare() {
      // nop. abstract method.
    }
  }, {
    key: 'initialize',
    value: function initialize() {
      // nop. abstract method.
    }
  }, {
    key: 'update',
    value: function update() {
      var _this2 = this;

      IncrementalDOM.patch(this, function () {
        _this2.compiled.apply(_this2, [IncrementalDOM]);
      });
    }
  }, {
    key: 'dump',
    value: function dump() {
      var _this3 = this;

      var scope = {};
      Object.keys(this).forEach(function (key) {
        if (key !== 'renderer') {
          scope[key] = _this3[key];
        }
      });
      return scope;
    }
  }]);

  return Element;
}(HTMLElement);

module.exports = Element;

},{"./aggregator.js":4,"./compiler.js":6,"incremental-dom/dist/incremental-dom.js":1}],8:[function(require,module,exports){
"use strict";

// polyfill
// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent

(function () {
  if (typeof window.CustomEvent === "function") return false;

  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();

function fireEvent(element, eventName, options) {
  var event = new CustomEvent(eventName, options);
  element.dispatchEvent(event);
}

module.exports = fireEvent;

},{}],9:[function(require,module,exports){
'use strict';

// polyfills

require('webcomponents.js/CustomElements.js');
require('./polyfill.js');
require('whatwg-fetch/fetch.js');

var tag = require('./tag.js');
var Element = require('./element.js');
require('./app.js');

module.exports.Element = Element;
module.exports.tag = tag;
module.exports.fireEvent = require('./fire-event.js');

},{"./app.js":5,"./element.js":7,"./fire-event.js":8,"./polyfill.js":10,"./tag.js":11,"webcomponents.js/CustomElements.js":2,"whatwg-fetch/fetch.js":3}],10:[function(require,module,exports){
'use strict';

// polyfill

require('webcomponents.js/CustomElements.js');

if (!window.customElements) {
  window.customElements = {
    define: function define(name, elem) {
      document.registerElement(name, elem);
    }
  };
}

},{"webcomponents.js/CustomElements.js":2}],11:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Compiler = require('./compiler');
var IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');
var Aggregator = require('./aggregator.js');

var unwrapComment = /\/\*!?(?:\@preserve)?[ \t]*(?:\r\n|\n)([\s\S]*?)(?:\r\n|\n)\s*\*\//;

function tag(tagName, opts) {
  var template = opts.template;
  delete opts['template'];
  if (!template) {
    throw "Missing template";
  }

  var scope = opts['default'] || {};
  var compiled = void 0;

  var elementClassPrototype = Object.create(HTMLElement.prototype);
  var elementClass = function (_HTMLElement) {
    _inherits(elementClass, _HTMLElement);

    function elementClass() {
      _classCallCheck(this, elementClass);

      return _possibleConstructorReturn(this, Object.getPrototypeOf(elementClass).apply(this, arguments));
    }

    _createClass(elementClass, [{
      key: 'createdCallback',
      value: function createdCallback() {
        if (!compiled) {
          var html = document.createElement("div");
          html.innerHTML = function () {
            if (typeof template === 'function') {
              return unwrapComment.exec(template.toString())[1];
            } else {
              return template;
            }
          }();
          new Aggregator(html).aggregate(scope);
          compiled = new Compiler().compile(html);
        }

        for (var key in scope) {
          if (scope.hasOwnProperty(key)) {
            this[key] = scope[key];
          }
        }

        var attrs = this.attributes;
        for (var i = 0, l = attrs.length; i < l; ++i) {
          var attr = attrs[i];
          this[attr.name] = attr.value;
        }

        // set event listeners
        if (opts.events) {
          for (var event in opts.events) {
            console.log(event);
            this.addEventListener(event, opts.events[event].bind(this));
          }
        }

        if (opts.initialize) {
          opts.initialize.apply(this);
        }
        this.update();
      }
    }, {
      key: 'attributeChangedCallback',
      value: function attributeChangedCallback(key) {
        this[key] = this.getAttribute(key);
        this.update();
      }
    }, {
      key: 'update',
      value: function update() {
        var _this2 = this;

        IncrementalDOM.patch(this, function () {
          compiled.apply(_this2, [IncrementalDOM]);
        });
      }
    }, {
      key: 'dump',
      value: function dump() {
        var _this3 = this;

        var scope = {};
        Object.keys(this).forEach(function (key) {
          if (key !== 'renderer') {
            scope[key] = _this3[key];
          }
        });
        return scope;
      }
    }]);

    return elementClass;
  }(HTMLElement);

  if (opts.methods) {
    for (var name in opts.methods) {
      elementClass.prototype[name] = opts.methods[name];
    }
  }

  if (opts.accessors) {
    for (var _name in opts.accessors) {
      Object.defineProperty(elementClass.prototype, _name, {
        get: opts.accessors[_name].get,
        set: opts.accessors[_name].set
      });
    }
  }

  customElements.define(tagName, elementClass);
}

module.exports = tag;

},{"./aggregator.js":4,"./compiler":6,"incremental-dom/dist/incremental-dom.js":1}],12:[function(require,module,exports){
'use strict';

function scan(s) {
  var orig = s;
  var result = [];
  while (s.length > 0) {
    var i = s.indexOf('{{');
    if (i >= 0) {
      if (i > 0) {
        // there's prefix string
        var p = s.substr(0, i);
        result.push(JSON.stringify(p));
      }

      // find closing }}
      var l = s.indexOf('}}');
      if (l < 0) {
        throw 'Missing closing \'}}\' in expression: ' + orig;
      }
      var exp = s.substr(i + 2, l - (i + 2));
      if (exp.length > 0) {
        result.push('(' + exp + ')');
      }
      s = s.substr(l + 2);
    } else {
      result.push(JSON.stringify(s));
      break;
    }
  }
  return result.join("+");
}

module.exports = scan;

},{}]},{},[9])(9)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9pbmNyZW1lbnRhbC1kb20vZGlzdC9pbmNyZW1lbnRhbC1kb20uanMiLCJub2RlX21vZHVsZXMvd2ViY29tcG9uZW50cy5qcy9DdXN0b21FbGVtZW50cy5qcyIsIm5vZGVfbW9kdWxlcy93aGF0d2ctZmV0Y2gvZmV0Y2guanMiLCJzcmMvYWdncmVnYXRvci5qcyIsInNyYy9hcHAuanMiLCJzcmMvY29tcGlsZXIuanMiLCJzcmMvZWxlbWVudC5qcyIsInNyYy9maXJlLWV2ZW50LmpzIiwic3JjL21haW4uanMiLCJzcmMvcG9seWZpbGwuanMiLCJzcmMvdGFnLmpzIiwic3JjL3RleHQtZXhwcmVzc2lvbi1zY2FubmVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BnQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUFDL0I7VUFBSSxJQUFBLEFBQUksU0FBUixBQUFpQixHQUFHLEFBQ2xCO2VBQUEsQUFBTyxXQUFQLEFBQWdCLE1BQ2pCO0FBQ0Q7VUFBRSxFQUFBLEFBQUUsT0FBTyxJQUFYLEFBQUUsQUFBVyxBQUNkO0FBaEJELFdBZ0JPLEFBQ0w7YUFBQSxBQUFPLEtBQUssS0FBQSxBQUFLLFVBQWpCLEFBQVksQUFBZSxBQUMzQjtBQUNEO0FBQ0Y7QUFDRDtTQUFPLE9BQUEsQUFBTyxLQUFkLEFBQU8sQUFBWSxBQUNwQjs7O0FBRUQsT0FBQSxBQUFPLFVBQVAsQUFBaUIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG4vKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4oZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBmYWN0b3J5KGV4cG9ydHMpIDpcbiAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKFsnZXhwb3J0cyddLCBmYWN0b3J5KSA6XG4gIChmYWN0b3J5KChnbG9iYWwuSW5jcmVtZW50YWxET00gPSB7fSkpKTtcbn0odGhpcywgZnVuY3Rpb24gKGV4cG9ydHMpIHsgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qKlxuICAgKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gICAqXG4gICAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gICAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAgICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gICAqXG4gICAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gICAqXG4gICAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAgICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICAgKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAgICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICAgKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAgICovXG5cbiAgLyoqXG4gICAqIEEgY2FjaGVkIHJlZmVyZW5jZSB0byB0aGUgaGFzT3duUHJvcGVydHkgZnVuY3Rpb24uXG4gICAqL1xuICB2YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4gIC8qKlxuICAgKiBBIGNhY2hlZCByZWZlcmVuY2UgdG8gdGhlIGNyZWF0ZSBmdW5jdGlvbi5cbiAgICovXG4gIHZhciBjcmVhdGUgPSBPYmplY3QuY3JlYXRlO1xuXG4gIC8qKlxuICAgKiBVc2VkIHRvIHByZXZlbnQgcHJvcGVydHkgY29sbGlzaW9ucyBiZXR3ZWVuIG91ciBcIm1hcFwiIGFuZCBpdHMgcHJvdG90eXBlLlxuICAgKiBAcGFyYW0geyFPYmplY3Q8c3RyaW5nLCAqPn0gbWFwIFRoZSBtYXAgdG8gY2hlY2suXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eSBUaGUgcHJvcGVydHkgdG8gY2hlY2suXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgbWFwIGhhcyBwcm9wZXJ0eS5cbiAgICovXG4gIHZhciBoYXMgPSBmdW5jdGlvbiAobWFwLCBwcm9wZXJ0eSkge1xuICAgIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG1hcCwgcHJvcGVydHkpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIG1hcCBvYmplY3Qgd2l0aG91dCBhIHByb3RvdHlwZS5cbiAgICogQHJldHVybiB7IU9iamVjdH1cbiAgICovXG4gIHZhciBjcmVhdGVNYXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGNyZWF0ZShudWxsKTtcbiAgfTtcblxuICAvKipcbiAgICogS2VlcHMgdHJhY2sgb2YgaW5mb3JtYXRpb24gbmVlZGVkIHRvIHBlcmZvcm0gZGlmZnMgZm9yIGEgZ2l2ZW4gRE9NIG5vZGUuXG4gICAqIEBwYXJhbSB7IXN0cmluZ30gbm9kZU5hbWVcbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5XG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKi9cbiAgZnVuY3Rpb24gTm9kZURhdGEobm9kZU5hbWUsIGtleSkge1xuICAgIC8qKlxuICAgICAqIFRoZSBhdHRyaWJ1dGVzIGFuZCB0aGVpciB2YWx1ZXMuXG4gICAgICogQGNvbnN0IHshT2JqZWN0PHN0cmluZywgKj59XG4gICAgICovXG4gICAgdGhpcy5hdHRycyA9IGNyZWF0ZU1hcCgpO1xuXG4gICAgLyoqXG4gICAgICogQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMsIHVzZWQgZm9yIHF1aWNrbHkgZGlmZmluZyB0aGVcbiAgICAgKiBpbmNvbW1pbmcgYXR0cmlidXRlcyB0byBzZWUgaWYgdGhlIERPTSBub2RlJ3MgYXR0cmlidXRlcyBuZWVkIHRvIGJlXG4gICAgICogdXBkYXRlZC5cbiAgICAgKiBAY29uc3Qge0FycmF5PCo+fVxuICAgICAqL1xuICAgIHRoaXMuYXR0cnNBcnIgPSBbXTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBpbmNvbWluZyBhdHRyaWJ1dGVzIGZvciB0aGlzIE5vZGUsIGJlZm9yZSB0aGV5IGFyZSB1cGRhdGVkLlxuICAgICAqIEBjb25zdCB7IU9iamVjdDxzdHJpbmcsICo+fVxuICAgICAqL1xuICAgIHRoaXMubmV3QXR0cnMgPSBjcmVhdGVNYXAoKTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIG5vZGUsIHVzZWQgdG8gcHJlc2VydmUgRE9NIG5vZGVzIHdoZW4gdGhleVxuICAgICAqIG1vdmUgd2l0aGluIHRoZWlyIHBhcmVudC5cbiAgICAgKiBAY29uc3RcbiAgICAgKi9cbiAgICB0aGlzLmtleSA9IGtleTtcblxuICAgIC8qKlxuICAgICAqIEtlZXBzIHRyYWNrIG9mIGNoaWxkcmVuIHdpdGhpbiB0aGlzIG5vZGUgYnkgdGhlaXIga2V5LlxuICAgICAqIHs/T2JqZWN0PHN0cmluZywgIUVsZW1lbnQ+fVxuICAgICAqL1xuICAgIHRoaXMua2V5TWFwID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgb3Igbm90IHRoZSBrZXlNYXAgaXMgY3VycmVudGx5IHZhbGlkLlxuICAgICAqIHtib29sZWFufVxuICAgICAqL1xuICAgIHRoaXMua2V5TWFwVmFsaWQgPSB0cnVlO1xuXG4gICAgLyoqXG4gICAgICogVGhlIG5vZGUgbmFtZSBmb3IgdGhpcyBub2RlLlxuICAgICAqIEBjb25zdCB7c3RyaW5nfVxuICAgICAqL1xuICAgIHRoaXMubm9kZU5hbWUgPSBub2RlTmFtZTtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHs/c3RyaW5nfVxuICAgICAqL1xuICAgIHRoaXMudGV4dCA9IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSBOb2RlRGF0YSBvYmplY3QgZm9yIGEgTm9kZS5cbiAgICpcbiAgICogQHBhcmFtIHtOb2RlfSBub2RlIFRoZSBub2RlIHRvIGluaXRpYWxpemUgZGF0YSBmb3IuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlTmFtZSBUaGUgbm9kZSBuYW1lIG9mIG5vZGUuXG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHRoYXQgaWRlbnRpZmllcyB0aGUgbm9kZS5cbiAgICogQHJldHVybiB7IU5vZGVEYXRhfSBUaGUgbmV3bHkgaW5pdGlhbGl6ZWQgZGF0YSBvYmplY3RcbiAgICovXG4gIHZhciBpbml0RGF0YSA9IGZ1bmN0aW9uIChub2RlLCBub2RlTmFtZSwga2V5KSB7XG4gICAgdmFyIGRhdGEgPSBuZXcgTm9kZURhdGEobm9kZU5hbWUsIGtleSk7XG4gICAgbm9kZVsnX19pbmNyZW1lbnRhbERPTURhdGEnXSA9IGRhdGE7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgTm9kZURhdGEgb2JqZWN0IGZvciBhIE5vZGUsIGNyZWF0aW5nIGl0IGlmIG5lY2Vzc2FyeS5cbiAgICpcbiAgICogQHBhcmFtIHtOb2RlfSBub2RlIFRoZSBub2RlIHRvIHJldHJpZXZlIHRoZSBkYXRhIGZvci5cbiAgICogQHJldHVybiB7IU5vZGVEYXRhfSBUaGUgTm9kZURhdGEgZm9yIHRoaXMgTm9kZS5cbiAgICovXG4gIHZhciBnZXREYXRhID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICB2YXIgZGF0YSA9IG5vZGVbJ19faW5jcmVtZW50YWxET01EYXRhJ107XG5cbiAgICBpZiAoIWRhdGEpIHtcbiAgICAgIHZhciBub2RlTmFtZSA9IG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgIHZhciBrZXkgPSBudWxsO1xuXG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAga2V5ID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ2tleScpO1xuICAgICAgfVxuXG4gICAgICBkYXRhID0gaW5pdERhdGEobm9kZSwgbm9kZU5hbWUsIGtleSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH07XG5cbiAgLyoqXG4gICAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAgICpcbiAgICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAgICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICAgKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAgICpcbiAgICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAgICpcbiAgICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICAgKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gICAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICAgKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gICAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICAgKi9cblxuICAvKiogQGNvbnN0ICovXG4gIHZhciBzeW1ib2xzID0ge1xuICAgIGRlZmF1bHQ6ICdfX2RlZmF1bHQnLFxuXG4gICAgcGxhY2Vob2xkZXI6ICdfX3BsYWNlaG9sZGVyJ1xuICB9O1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgKiBAcmV0dXJuIHtzdHJpbmd8dW5kZWZpbmVkfSBUaGUgbmFtZXNwYWNlIHRvIHVzZSBmb3IgdGhlIGF0dHJpYnV0ZS5cbiAgICovXG4gIHZhciBnZXROYW1lc3BhY2UgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIGlmIChuYW1lLmxhc3RJbmRleE9mKCd4bWw6JywgMCkgPT09IDApIHtcbiAgICAgIHJldHVybiAnaHR0cDovL3d3dy53My5vcmcvWE1MLzE5OTgvbmFtZXNwYWNlJztcbiAgICB9XG5cbiAgICBpZiAobmFtZS5sYXN0SW5kZXhPZigneGxpbms6JywgMCkgPT09IDApIHtcbiAgICAgIHJldHVybiAnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayc7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGFuIGF0dHJpYnV0ZSBvciBwcm9wZXJ0eSB0byBhIGdpdmVuIEVsZW1lbnQuIElmIHRoZSB2YWx1ZSBpcyBudWxsXG4gICAqIG9yIHVuZGVmaW5lZCwgaXQgaXMgcmVtb3ZlZCBmcm9tIHRoZSBFbGVtZW50LiBPdGhlcndpc2UsIHRoZSB2YWx1ZSBpcyBzZXRcbiAgICogYXMgYW4gYXR0cmlidXRlLlxuICAgKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAgICogQHBhcmFtIHs/KGJvb2xlYW58bnVtYmVyfHN0cmluZyk9fSB2YWx1ZSBUaGUgYXR0cmlidXRlJ3MgdmFsdWUuXG4gICAqL1xuICB2YXIgYXBwbHlBdHRyID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBhdHRyTlMgPSBnZXROYW1lc3BhY2UobmFtZSk7XG4gICAgICBpZiAoYXR0ck5TKSB7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZU5TKGF0dHJOUywgbmFtZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgYSBwcm9wZXJ0eSB0byBhIGdpdmVuIEVsZW1lbnQuXG4gICAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBwcm9wZXJ0eSdzIG5hbWUuXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHByb3BlcnR5J3MgdmFsdWUuXG4gICAqL1xuICB2YXIgYXBwbHlQcm9wID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICAgIGVsW25hbWVdID0gdmFsdWU7XG4gIH07XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgYSBzdHlsZSB0byBhbiBFbGVtZW50LiBObyB2ZW5kb3IgcHJlZml4IGV4cGFuc2lvbiBpcyBkb25lIGZvclxuICAgKiBwcm9wZXJ0eSBuYW1lcy92YWx1ZXMuXG4gICAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBhdHRyaWJ1dGUncyBuYW1lLlxuICAgKiBAcGFyYW0geyp9IHN0eWxlIFRoZSBzdHlsZSB0byBzZXQuIEVpdGhlciBhIHN0cmluZyBvZiBjc3Mgb3IgYW4gb2JqZWN0XG4gICAqICAgICBjb250YWluaW5nIHByb3BlcnR5LXZhbHVlIHBhaXJzLlxuICAgKi9cbiAgdmFyIGFwcGx5U3R5bGUgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHN0eWxlKSB7XG4gICAgaWYgKHR5cGVvZiBzdHlsZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVsLnN0eWxlLmNzc1RleHQgPSBzdHlsZTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWwuc3R5bGUuY3NzVGV4dCA9ICcnO1xuICAgICAgdmFyIGVsU3R5bGUgPSBlbC5zdHlsZTtcbiAgICAgIHZhciBvYmogPSAvKiogQHR5cGUgeyFPYmplY3Q8c3RyaW5nLHN0cmluZz59ICovc3R5bGU7XG5cbiAgICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgICAgIGlmIChoYXMob2JqLCBwcm9wKSkge1xuICAgICAgICAgIGVsU3R5bGVbcHJvcF0gPSBvYmpbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgYSBzaW5nbGUgYXR0cmlidXRlIG9uIGFuIEVsZW1lbnQuXG4gICAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBhdHRyaWJ1dGUncyBuYW1lLlxuICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBhdHRyaWJ1dGUncyB2YWx1ZS4gSWYgdGhlIHZhbHVlIGlzIGFuIG9iamVjdCBvclxuICAgKiAgICAgZnVuY3Rpb24gaXQgaXMgc2V0IG9uIHRoZSBFbGVtZW50LCBvdGhlcndpc2UsIGl0IGlzIHNldCBhcyBhbiBIVE1MXG4gICAqICAgICBhdHRyaWJ1dGUuXG4gICAqL1xuICB2YXIgYXBwbHlBdHRyaWJ1dGVUeXBlZCA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcblxuICAgIGlmICh0eXBlID09PSAnb2JqZWN0JyB8fCB0eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBhcHBseVByb3AoZWwsIG5hbWUsIHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXBwbHlBdHRyKGVsLCBuYW1lLCAvKiogQHR5cGUgez8oYm9vbGVhbnxudW1iZXJ8c3RyaW5nKX0gKi92YWx1ZSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBDYWxscyB0aGUgYXBwcm9wcmlhdGUgYXR0cmlidXRlIG11dGF0b3IgZm9yIHRoaXMgYXR0cmlidXRlLlxuICAgKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgYXR0cmlidXRlJ3MgdmFsdWUuXG4gICAqL1xuICB2YXIgdXBkYXRlQXR0cmlidXRlID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICAgIHZhciBkYXRhID0gZ2V0RGF0YShlbCk7XG4gICAgdmFyIGF0dHJzID0gZGF0YS5hdHRycztcblxuICAgIGlmIChhdHRyc1tuYW1lXSA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgbXV0YXRvciA9IGF0dHJpYnV0ZXNbbmFtZV0gfHwgYXR0cmlidXRlc1tzeW1ib2xzLmRlZmF1bHRdO1xuICAgIG11dGF0b3IoZWwsIG5hbWUsIHZhbHVlKTtcblxuICAgIGF0dHJzW25hbWVdID0gdmFsdWU7XG4gIH07XG5cbiAgLyoqXG4gICAqIEEgcHVibGljbHkgbXV0YWJsZSBvYmplY3QgdG8gcHJvdmlkZSBjdXN0b20gbXV0YXRvcnMgZm9yIGF0dHJpYnV0ZXMuXG4gICAqIEBjb25zdCB7IU9iamVjdDxzdHJpbmcsIGZ1bmN0aW9uKCFFbGVtZW50LCBzdHJpbmcsICopPn1cbiAgICovXG4gIHZhciBhdHRyaWJ1dGVzID0gY3JlYXRlTWFwKCk7XG5cbiAgLy8gU3BlY2lhbCBnZW5lcmljIG11dGF0b3IgdGhhdCdzIGNhbGxlZCBmb3IgYW55IGF0dHJpYnV0ZSB0aGF0IGRvZXMgbm90XG4gIC8vIGhhdmUgYSBzcGVjaWZpYyBtdXRhdG9yLlxuICBhdHRyaWJ1dGVzW3N5bWJvbHMuZGVmYXVsdF0gPSBhcHBseUF0dHJpYnV0ZVR5cGVkO1xuXG4gIGF0dHJpYnV0ZXNbc3ltYm9scy5wbGFjZWhvbGRlcl0gPSBmdW5jdGlvbiAoKSB7fTtcblxuICBhdHRyaWJ1dGVzWydzdHlsZSddID0gYXBwbHlTdHlsZTtcblxuICAvKipcbiAgICogR2V0cyB0aGUgbmFtZXNwYWNlIHRvIGNyZWF0ZSBhbiBlbGVtZW50IChvZiBhIGdpdmVuIHRhZykgaW4uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIHRhZyB0byBnZXQgdGhlIG5hbWVzcGFjZSBmb3IuXG4gICAqIEBwYXJhbSB7P05vZGV9IHBhcmVudFxuICAgKiBAcmV0dXJuIHs/c3RyaW5nfSBUaGUgbmFtZXNwYWNlIHRvIGNyZWF0ZSB0aGUgdGFnIGluLlxuICAgKi9cbiAgdmFyIGdldE5hbWVzcGFjZUZvclRhZyA9IGZ1bmN0aW9uICh0YWcsIHBhcmVudCkge1xuICAgIGlmICh0YWcgPT09ICdzdmcnKSB7XG4gICAgICByZXR1cm4gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcbiAgICB9XG5cbiAgICBpZiAoZ2V0RGF0YShwYXJlbnQpLm5vZGVOYW1lID09PSAnZm9yZWlnbk9iamVjdCcpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBwYXJlbnQubmFtZXNwYWNlVVJJO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIEVsZW1lbnQuXG4gICAqIEBwYXJhbSB7RG9jdW1lbnR9IGRvYyBUaGUgZG9jdW1lbnQgd2l0aCB3aGljaCB0byBjcmVhdGUgdGhlIEVsZW1lbnQuXG4gICAqIEBwYXJhbSB7P05vZGV9IHBhcmVudFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSB0YWcgZm9yIHRoZSBFbGVtZW50LlxuICAgKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgQSBrZXkgdG8gaWRlbnRpZnkgdGhlIEVsZW1lbnQuXG4gICAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAgICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC5cbiAgICogQHJldHVybiB7IUVsZW1lbnR9XG4gICAqL1xuICB2YXIgY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uIChkb2MsIHBhcmVudCwgdGFnLCBrZXksIHN0YXRpY3MpIHtcbiAgICB2YXIgbmFtZXNwYWNlID0gZ2V0TmFtZXNwYWNlRm9yVGFnKHRhZywgcGFyZW50KTtcbiAgICB2YXIgZWwgPSB1bmRlZmluZWQ7XG5cbiAgICBpZiAobmFtZXNwYWNlKSB7XG4gICAgICBlbCA9IGRvYy5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCB0YWcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbCA9IGRvYy5jcmVhdGVFbGVtZW50KHRhZyk7XG4gICAgfVxuXG4gICAgaW5pdERhdGEoZWwsIHRhZywga2V5KTtcblxuICAgIGlmIChzdGF0aWNzKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0YXRpY3MubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgdXBkYXRlQXR0cmlidXRlKGVsLCAvKiogQHR5cGUgeyFzdHJpbmd9Ki9zdGF0aWNzW2ldLCBzdGF0aWNzW2kgKyAxXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGVsO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgVGV4dCBOb2RlLlxuICAgKiBAcGFyYW0ge0RvY3VtZW50fSBkb2MgVGhlIGRvY3VtZW50IHdpdGggd2hpY2ggdG8gY3JlYXRlIHRoZSBFbGVtZW50LlxuICAgKiBAcmV0dXJuIHshVGV4dH1cbiAgICovXG4gIHZhciBjcmVhdGVUZXh0ID0gZnVuY3Rpb24gKGRvYykge1xuICAgIHZhciBub2RlID0gZG9jLmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICBpbml0RGF0YShub2RlLCAnI3RleHQnLCBudWxsKTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG1hcHBpbmcgdGhhdCBjYW4gYmUgdXNlZCB0byBsb29rIHVwIGNoaWxkcmVuIHVzaW5nIGEga2V5LlxuICAgKiBAcGFyYW0gez9Ob2RlfSBlbFxuICAgKiBAcmV0dXJuIHshT2JqZWN0PHN0cmluZywgIUVsZW1lbnQ+fSBBIG1hcHBpbmcgb2Yga2V5cyB0byB0aGUgY2hpbGRyZW4gb2YgdGhlXG4gICAqICAgICBFbGVtZW50LlxuICAgKi9cbiAgdmFyIGNyZWF0ZUtleU1hcCA9IGZ1bmN0aW9uIChlbCkge1xuICAgIHZhciBtYXAgPSBjcmVhdGVNYXAoKTtcbiAgICB2YXIgY2hpbGQgPSBlbC5maXJzdEVsZW1lbnRDaGlsZDtcblxuICAgIHdoaWxlIChjaGlsZCkge1xuICAgICAgdmFyIGtleSA9IGdldERhdGEoY2hpbGQpLmtleTtcblxuICAgICAgaWYgKGtleSkge1xuICAgICAgICBtYXBba2V5XSA9IGNoaWxkO1xuICAgICAgfVxuXG4gICAgICBjaGlsZCA9IGNoaWxkLm5leHRFbGVtZW50U2libGluZztcbiAgICB9XG5cbiAgICByZXR1cm4gbWFwO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIG1hcHBpbmcgb2Yga2V5IHRvIGNoaWxkIG5vZGUgZm9yIGEgZ2l2ZW4gRWxlbWVudCwgY3JlYXRpbmcgaXRcbiAgICogaWYgbmVjZXNzYXJ5LlxuICAgKiBAcGFyYW0gez9Ob2RlfSBlbFxuICAgKiBAcmV0dXJuIHshT2JqZWN0PHN0cmluZywgIU5vZGU+fSBBIG1hcHBpbmcgb2Yga2V5cyB0byBjaGlsZCBFbGVtZW50c1xuICAgKi9cbiAgdmFyIGdldEtleU1hcCA9IGZ1bmN0aW9uIChlbCkge1xuICAgIHZhciBkYXRhID0gZ2V0RGF0YShlbCk7XG5cbiAgICBpZiAoIWRhdGEua2V5TWFwKSB7XG4gICAgICBkYXRhLmtleU1hcCA9IGNyZWF0ZUtleU1hcChlbCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGEua2V5TWFwO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYSBjaGlsZCBmcm9tIHRoZSBwYXJlbnQgd2l0aCB0aGUgZ2l2ZW4ga2V5LlxuICAgKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnRcbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5XG4gICAqIEByZXR1cm4gez9Ob2RlfSBUaGUgY2hpbGQgY29ycmVzcG9uZGluZyB0byB0aGUga2V5LlxuICAgKi9cbiAgdmFyIGdldENoaWxkID0gZnVuY3Rpb24gKHBhcmVudCwga2V5KSB7XG4gICAgcmV0dXJuIGtleSA/IGdldEtleU1hcChwYXJlbnQpW2tleV0gOiBudWxsO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYW4gZWxlbWVudCBhcyBiZWluZyBhIGNoaWxkLiBUaGUgcGFyZW50IHdpbGwga2VlcCB0cmFjayBvZiB0aGVcbiAgICogY2hpbGQgdXNpbmcgdGhlIGtleS4gVGhlIGNoaWxkIGNhbiBiZSByZXRyaWV2ZWQgdXNpbmcgdGhlIHNhbWUga2V5IHVzaW5nXG4gICAqIGdldEtleU1hcC4gVGhlIHByb3ZpZGVkIGtleSBzaG91bGQgYmUgdW5pcXVlIHdpdGhpbiB0aGUgcGFyZW50IEVsZW1lbnQuXG4gICAqIEBwYXJhbSB7P05vZGV9IHBhcmVudCBUaGUgcGFyZW50IG9mIGNoaWxkLlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IEEga2V5IHRvIGlkZW50aWZ5IHRoZSBjaGlsZCB3aXRoLlxuICAgKiBAcGFyYW0geyFOb2RlfSBjaGlsZCBUaGUgY2hpbGQgdG8gcmVnaXN0ZXIuXG4gICAqL1xuICB2YXIgcmVnaXN0ZXJDaGlsZCA9IGZ1bmN0aW9uIChwYXJlbnQsIGtleSwgY2hpbGQpIHtcbiAgICBnZXRLZXlNYXAocGFyZW50KVtrZXldID0gY2hpbGQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAgICpcbiAgICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAgICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICAgKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAgICpcbiAgICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAgICpcbiAgICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICAgKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gICAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICAgKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gICAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICAgKi9cblxuICAvKiogQGNvbnN0ICovXG4gIHZhciBub3RpZmljYXRpb25zID0ge1xuICAgIC8qKlxuICAgICAqIENhbGxlZCBhZnRlciBwYXRjaCBoYXMgY29tcGxlYXRlZCB3aXRoIGFueSBOb2RlcyB0aGF0IGhhdmUgYmVlbiBjcmVhdGVkXG4gICAgICogYW5kIGFkZGVkIHRvIHRoZSBET00uXG4gICAgICogQHR5cGUgez9mdW5jdGlvbihBcnJheTwhTm9kZT4pfVxuICAgICAqL1xuICAgIG5vZGVzQ3JlYXRlZDogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIENhbGxlZCBhZnRlciBwYXRjaCBoYXMgY29tcGxlYXRlZCB3aXRoIGFueSBOb2RlcyB0aGF0IGhhdmUgYmVlbiByZW1vdmVkXG4gICAgICogZnJvbSB0aGUgRE9NLlxuICAgICAqIE5vdGUgaXQncyBhbiBhcHBsaWNhdGlvbnMgcmVzcG9uc2liaWxpdHkgdG8gaGFuZGxlIGFueSBjaGlsZE5vZGVzLlxuICAgICAqIEB0eXBlIHs/ZnVuY3Rpb24oQXJyYXk8IU5vZGU+KX1cbiAgICAgKi9cbiAgICBub2Rlc0RlbGV0ZWQ6IG51bGxcbiAgfTtcblxuICAvKipcbiAgICogS2VlcHMgdHJhY2sgb2YgdGhlIHN0YXRlIG9mIGEgcGF0Y2guXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKi9cbiAgZnVuY3Rpb24gQ29udGV4dCgpIHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7KEFycmF5PCFOb2RlPnx1bmRlZmluZWQpfVxuICAgICAqL1xuICAgIHRoaXMuY3JlYXRlZCA9IG5vdGlmaWNhdGlvbnMubm9kZXNDcmVhdGVkICYmIFtdO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUgeyhBcnJheTwhTm9kZT58dW5kZWZpbmVkKX1cbiAgICAgKi9cbiAgICB0aGlzLmRlbGV0ZWQgPSBub3RpZmljYXRpb25zLm5vZGVzRGVsZXRlZCAmJiBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gICAqL1xuICBDb250ZXh0LnByb3RvdHlwZS5tYXJrQ3JlYXRlZCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgaWYgKHRoaXMuY3JlYXRlZCkge1xuICAgICAgdGhpcy5jcmVhdGVkLnB1c2gobm9kZSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gICAqL1xuICBDb250ZXh0LnByb3RvdHlwZS5tYXJrRGVsZXRlZCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgaWYgKHRoaXMuZGVsZXRlZCkge1xuICAgICAgdGhpcy5kZWxldGVkLnB1c2gobm9kZSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBOb3RpZmllcyBhYm91dCBub2RlcyB0aGF0IHdlcmUgY3JlYXRlZCBkdXJpbmcgdGhlIHBhdGNoIG9wZWFyYXRpb24uXG4gICAqL1xuICBDb250ZXh0LnByb3RvdHlwZS5ub3RpZnlDaGFuZ2VzID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmNyZWF0ZWQgJiYgdGhpcy5jcmVhdGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIG5vdGlmaWNhdGlvbnMubm9kZXNDcmVhdGVkKHRoaXMuY3JlYXRlZCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZGVsZXRlZCAmJiB0aGlzLmRlbGV0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgbm90aWZpY2F0aW9ucy5ub2Rlc0RlbGV0ZWQodGhpcy5kZWxldGVkKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICogTWFrZXMgc3VyZSB0aGF0IGtleWVkIEVsZW1lbnQgbWF0Y2hlcyB0aGUgdGFnIG5hbWUgcHJvdmlkZWQuXG4gICogQHBhcmFtIHshc3RyaW5nfSBub2RlTmFtZSBUaGUgbm9kZU5hbWUgb2YgdGhlIG5vZGUgdGhhdCBpcyBiZWluZyBtYXRjaGVkLlxuICAqIEBwYXJhbSB7c3RyaW5nPX0gdGFnIFRoZSB0YWcgbmFtZSBvZiB0aGUgRWxlbWVudC5cbiAgKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSBvZiB0aGUgRWxlbWVudC5cbiAgKi9cbiAgdmFyIGFzc2VydEtleWVkVGFnTWF0Y2hlcyA9IGZ1bmN0aW9uIChub2RlTmFtZSwgdGFnLCBrZXkpIHtcbiAgICBpZiAobm9kZU5hbWUgIT09IHRhZykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdXYXMgZXhwZWN0aW5nIG5vZGUgd2l0aCBrZXkgXCInICsga2V5ICsgJ1wiIHRvIGJlIGEgJyArIHRhZyArICcsIG5vdCBhICcgKyBub2RlTmFtZSArICcuJyk7XG4gICAgfVxuICB9O1xuXG4gIC8qKiBAdHlwZSB7P0NvbnRleHR9ICovXG4gIHZhciBjb250ZXh0ID0gbnVsbDtcblxuICAvKiogQHR5cGUgez9Ob2RlfSAqL1xuICB2YXIgY3VycmVudE5vZGUgPSBudWxsO1xuXG4gIC8qKiBAdHlwZSB7P05vZGV9ICovXG4gIHZhciBjdXJyZW50UGFyZW50ID0gbnVsbDtcblxuICAvKiogQHR5cGUgez9FbGVtZW50fD9Eb2N1bWVudEZyYWdtZW50fSAqL1xuICB2YXIgcm9vdCA9IG51bGw7XG5cbiAgLyoqIEB0eXBlIHs/RG9jdW1lbnR9ICovXG4gIHZhciBkb2MgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcGF0Y2hlciBmdW5jdGlvbiB0aGF0IHNldHMgdXAgYW5kIHJlc3RvcmVzIGEgcGF0Y2ggY29udGV4dCxcbiAgICogcnVubmluZyB0aGUgcnVuIGZ1bmN0aW9uIHdpdGggdGhlIHByb3ZpZGVkIGRhdGEuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24oKCFFbGVtZW50fCFEb2N1bWVudEZyYWdtZW50KSwhZnVuY3Rpb24oVCksVD0pfSBydW5cbiAgICogQHJldHVybiB7ZnVuY3Rpb24oKCFFbGVtZW50fCFEb2N1bWVudEZyYWdtZW50KSwhZnVuY3Rpb24oVCksVD0pfVxuICAgKiBAdGVtcGxhdGUgVFxuICAgKi9cbiAgdmFyIHBhdGNoRmFjdG9yeSA9IGZ1bmN0aW9uIChydW4pIHtcbiAgICAvKipcbiAgICAgKiBUT0RPKG1veik6IFRoZXNlIGFubm90YXRpb25zIHdvbid0IGJlIG5lY2Vzc2FyeSBvbmNlIHdlIHN3aXRjaCB0byBDbG9zdXJlXG4gICAgICogQ29tcGlsZXIncyBuZXcgdHlwZSBpbmZlcmVuY2UuIFJlbW92ZSB0aGVzZSBvbmNlIHRoZSBzd2l0Y2ggaXMgZG9uZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7KCFFbGVtZW50fCFEb2N1bWVudEZyYWdtZW50KX0gbm9kZVxuICAgICAqIEBwYXJhbSB7IWZ1bmN0aW9uKFQpfSBmblxuICAgICAqIEBwYXJhbSB7VD19IGRhdGFcbiAgICAgKiBAdGVtcGxhdGUgVFxuICAgICAqL1xuICAgIHZhciBmID0gZnVuY3Rpb24gKG5vZGUsIGZuLCBkYXRhKSB7XG4gICAgICB2YXIgcHJldkNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgdmFyIHByZXZSb290ID0gcm9vdDtcbiAgICAgIHZhciBwcmV2RG9jID0gZG9jO1xuICAgICAgdmFyIHByZXZDdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlO1xuICAgICAgdmFyIHByZXZDdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudDtcbiAgICAgIHZhciBwcmV2aW91c0luQXR0cmlidXRlcyA9IGZhbHNlO1xuICAgICAgdmFyIHByZXZpb3VzSW5Ta2lwID0gZmFsc2U7XG5cbiAgICAgIGNvbnRleHQgPSBuZXcgQ29udGV4dCgpO1xuICAgICAgcm9vdCA9IG5vZGU7XG4gICAgICBkb2MgPSBub2RlLm93bmVyRG9jdW1lbnQ7XG4gICAgICBjdXJyZW50UGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xuXG4gICAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgICAgIHJ1bihub2RlLCBmbiwgZGF0YSk7XG5cbiAgICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICAgICAgY29udGV4dC5ub3RpZnlDaGFuZ2VzKCk7XG5cbiAgICAgIGNvbnRleHQgPSBwcmV2Q29udGV4dDtcbiAgICAgIHJvb3QgPSBwcmV2Um9vdDtcbiAgICAgIGRvYyA9IHByZXZEb2M7XG4gICAgICBjdXJyZW50Tm9kZSA9IHByZXZDdXJyZW50Tm9kZTtcbiAgICAgIGN1cnJlbnRQYXJlbnQgPSBwcmV2Q3VycmVudFBhcmVudDtcbiAgICB9O1xuICAgIHJldHVybiBmO1xuICB9O1xuXG4gIC8qKlxuICAgKiBQYXRjaGVzIHRoZSBkb2N1bWVudCBzdGFydGluZyBhdCBub2RlIHdpdGggdGhlIHByb3ZpZGVkIGZ1bmN0aW9uLiBUaGlzXG4gICAqIGZ1bmN0aW9uIG1heSBiZSBjYWxsZWQgZHVyaW5nIGFuIGV4aXN0aW5nIHBhdGNoIG9wZXJhdGlvbi5cbiAgICogQHBhcmFtIHshRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudH0gbm9kZSBUaGUgRWxlbWVudCBvciBEb2N1bWVudFxuICAgKiAgICAgdG8gcGF0Y2guXG4gICAqIEBwYXJhbSB7IWZ1bmN0aW9uKFQpfSBmbiBBIGZ1bmN0aW9uIGNvbnRhaW5pbmcgZWxlbWVudE9wZW4vZWxlbWVudENsb3NlL2V0Yy5cbiAgICogICAgIGNhbGxzIHRoYXQgZGVzY3JpYmUgdGhlIERPTS5cbiAgICogQHBhcmFtIHtUPX0gZGF0YSBBbiBhcmd1bWVudCBwYXNzZWQgdG8gZm4gdG8gcmVwcmVzZW50IERPTSBzdGF0ZS5cbiAgICogQHRlbXBsYXRlIFRcbiAgICovXG4gIHZhciBwYXRjaElubmVyID0gcGF0Y2hGYWN0b3J5KGZ1bmN0aW9uIChub2RlLCBmbiwgZGF0YSkge1xuICAgIGN1cnJlbnROb2RlID0gbm9kZTtcblxuICAgIGVudGVyTm9kZSgpO1xuICAgIGZuKGRhdGEpO1xuICAgIGV4aXROb2RlKCk7XG5cbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBQYXRjaGVzIGFuIEVsZW1lbnQgd2l0aCB0aGUgdGhlIHByb3ZpZGVkIGZ1bmN0aW9uLiBFeGFjdGx5IG9uZSB0b3AgbGV2ZWxcbiAgICogZWxlbWVudCBjYWxsIHNob3VsZCBiZSBtYWRlIGNvcnJlc3BvbmRpbmcgdG8gYG5vZGVgLlxuICAgKiBAcGFyYW0geyFFbGVtZW50fSBub2RlIFRoZSBFbGVtZW50IHdoZXJlIHRoZSBwYXRjaCBzaG91bGQgc3RhcnQuXG4gICAqIEBwYXJhbSB7IWZ1bmN0aW9uKFQpfSBmbiBBIGZ1bmN0aW9uIGNvbnRhaW5pbmcgZWxlbWVudE9wZW4vZWxlbWVudENsb3NlL2V0Yy5cbiAgICogICAgIGNhbGxzIHRoYXQgZGVzY3JpYmUgdGhlIERPTS4gVGhpcyBzaG91bGQgaGF2ZSBhdCBtb3N0IG9uZSB0b3AgbGV2ZWxcbiAgICogICAgIGVsZW1lbnQgY2FsbC5cbiAgICogQHBhcmFtIHtUPX0gZGF0YSBBbiBhcmd1bWVudCBwYXNzZWQgdG8gZm4gdG8gcmVwcmVzZW50IERPTSBzdGF0ZS5cbiAgICogQHRlbXBsYXRlIFRcbiAgICovXG4gIHZhciBwYXRjaE91dGVyID0gcGF0Y2hGYWN0b3J5KGZ1bmN0aW9uIChub2RlLCBmbiwgZGF0YSkge1xuICAgIGN1cnJlbnROb2RlID0gLyoqIEB0eXBlIHshRWxlbWVudH0gKi97IG5leHRTaWJsaW5nOiBub2RlIH07XG5cbiAgICBmbihkYXRhKTtcblxuICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cbiAgfSk7XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIG9yIG5vdCB0aGUgY3VycmVudCBub2RlIG1hdGNoZXMgdGhlIHNwZWNpZmllZCBub2RlTmFtZSBhbmRcbiAgICoga2V5LlxuICAgKlxuICAgKiBAcGFyYW0gez9zdHJpbmd9IG5vZGVOYW1lIFRoZSBub2RlTmFtZSBmb3IgdGhpcyBub2RlLlxuICAgKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgQW4gb3B0aW9uYWwga2V5IHRoYXQgaWRlbnRpZmllcyBhIG5vZGUuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIG5vZGUgbWF0Y2hlcywgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKi9cbiAgdmFyIG1hdGNoZXMgPSBmdW5jdGlvbiAobm9kZU5hbWUsIGtleSkge1xuICAgIHZhciBkYXRhID0gZ2V0RGF0YShjdXJyZW50Tm9kZSk7XG5cbiAgICAvLyBLZXkgY2hlY2sgaXMgZG9uZSB1c2luZyBkb3VibGUgZXF1YWxzIGFzIHdlIHdhbnQgdG8gdHJlYXQgYSBudWxsIGtleSB0aGVcbiAgICAvLyBzYW1lIGFzIHVuZGVmaW5lZC4gVGhpcyBzaG91bGQgYmUgb2theSBhcyB0aGUgb25seSB2YWx1ZXMgYWxsb3dlZCBhcmVcbiAgICAvLyBzdHJpbmdzLCBudWxsIGFuZCB1bmRlZmluZWQgc28gdGhlID09IHNlbWFudGljcyBhcmUgbm90IHRvbyB3ZWlyZC5cbiAgICByZXR1cm4gbm9kZU5hbWUgPT09IGRhdGEubm9kZU5hbWUgJiYga2V5ID09IGRhdGEua2V5O1xuICB9O1xuXG4gIC8qKlxuICAgKiBBbGlnbnMgdGhlIHZpcnR1YWwgRWxlbWVudCBkZWZpbml0aW9uIHdpdGggdGhlIGFjdHVhbCBET00sIG1vdmluZyB0aGVcbiAgICogY29ycmVzcG9uZGluZyBET00gbm9kZSB0byB0aGUgY29ycmVjdCBsb2NhdGlvbiBvciBjcmVhdGluZyBpdCBpZiBuZWNlc3NhcnkuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlTmFtZSBGb3IgYW4gRWxlbWVudCwgdGhpcyBzaG91bGQgYmUgYSB2YWxpZCB0YWcgc3RyaW5nLlxuICAgKiAgICAgRm9yIGEgVGV4dCwgdGhpcyBzaG91bGQgYmUgI3RleHQuXG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LlxuICAgKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgRm9yIGFuIEVsZW1lbnQsIHRoaXMgc2hvdWxkIGJlIGFuIGFycmF5IG9mXG4gICAqICAgICBuYW1lLXZhbHVlIHBhaXJzLlxuICAgKi9cbiAgdmFyIGFsaWduV2l0aERPTSA9IGZ1bmN0aW9uIChub2RlTmFtZSwga2V5LCBzdGF0aWNzKSB7XG4gICAgaWYgKGN1cnJlbnROb2RlICYmIG1hdGNoZXMobm9kZU5hbWUsIGtleSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgbm9kZSA9IHVuZGVmaW5lZDtcblxuICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgbm9kZSBoYXMgbW92ZWQgd2l0aGluIHRoZSBwYXJlbnQuXG4gICAgaWYgKGtleSkge1xuICAgICAgbm9kZSA9IGdldENoaWxkKGN1cnJlbnRQYXJlbnQsIGtleSk7XG4gICAgICBpZiAobm9kZSAmJiAncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICBhc3NlcnRLZXllZFRhZ01hdGNoZXMoZ2V0RGF0YShub2RlKS5ub2RlTmFtZSwgbm9kZU5hbWUsIGtleSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIHRoZSBub2RlIGlmIGl0IGRvZXNuJ3QgZXhpc3QuXG4gICAgaWYgKCFub2RlKSB7XG4gICAgICBpZiAobm9kZU5hbWUgPT09ICcjdGV4dCcpIHtcbiAgICAgICAgbm9kZSA9IGNyZWF0ZVRleHQoZG9jKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGUgPSBjcmVhdGVFbGVtZW50KGRvYywgY3VycmVudFBhcmVudCwgbm9kZU5hbWUsIGtleSwgc3RhdGljcyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgcmVnaXN0ZXJDaGlsZChjdXJyZW50UGFyZW50LCBrZXksIG5vZGUpO1xuICAgICAgfVxuXG4gICAgICBjb250ZXh0Lm1hcmtDcmVhdGVkKG5vZGUpO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBub2RlIGhhcyBhIGtleSwgcmVtb3ZlIGl0IGZyb20gdGhlIERPTSB0byBwcmV2ZW50IGEgbGFyZ2UgbnVtYmVyXG4gICAgLy8gb2YgcmUtb3JkZXJzIGluIHRoZSBjYXNlIHRoYXQgaXQgbW92ZWQgZmFyIG9yIHdhcyBjb21wbGV0ZWx5IHJlbW92ZWQuXG4gICAgLy8gU2luY2Ugd2UgaG9sZCBvbiB0byBhIHJlZmVyZW5jZSB0aHJvdWdoIHRoZSBrZXlNYXAsIHdlIGNhbiBhbHdheXMgYWRkIGl0XG4gICAgLy8gYmFjay5cbiAgICBpZiAoY3VycmVudE5vZGUgJiYgZ2V0RGF0YShjdXJyZW50Tm9kZSkua2V5KSB7XG4gICAgICBjdXJyZW50UGFyZW50LnJlcGxhY2VDaGlsZChub2RlLCBjdXJyZW50Tm9kZSk7XG4gICAgICBnZXREYXRhKGN1cnJlbnRQYXJlbnQpLmtleU1hcFZhbGlkID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIGN1cnJlbnRQYXJlbnQuaW5zZXJ0QmVmb3JlKG5vZGUsIGN1cnJlbnROb2RlKTtcbiAgICB9XG5cbiAgICBjdXJyZW50Tm9kZSA9IG5vZGU7XG4gIH07XG5cbiAgLyoqXG4gICAqIENsZWFycyBvdXQgYW55IHVudmlzaXRlZCBOb2RlcywgYXMgdGhlIGNvcnJlc3BvbmRpbmcgdmlydHVhbCBlbGVtZW50XG4gICAqIGZ1bmN0aW9ucyB3ZXJlIG5ldmVyIGNhbGxlZCBmb3IgdGhlbS5cbiAgICovXG4gIHZhciBjbGVhclVudmlzaXRlZERPTSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbm9kZSA9IGN1cnJlbnRQYXJlbnQ7XG4gICAgdmFyIGRhdGEgPSBnZXREYXRhKG5vZGUpO1xuICAgIHZhciBrZXlNYXAgPSBkYXRhLmtleU1hcDtcbiAgICB2YXIga2V5TWFwVmFsaWQgPSBkYXRhLmtleU1hcFZhbGlkO1xuICAgIHZhciBjaGlsZCA9IG5vZGUubGFzdENoaWxkO1xuICAgIHZhciBrZXkgPSB1bmRlZmluZWQ7XG5cbiAgICBpZiAoY2hpbGQgPT09IGN1cnJlbnROb2RlICYmIGtleU1hcFZhbGlkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGRhdGEuYXR0cnNbc3ltYm9scy5wbGFjZWhvbGRlcl0gJiYgbm9kZSAhPT0gcm9vdCkge1xuICAgICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHdoaWxlIChjaGlsZCAhPT0gY3VycmVudE5vZGUpIHtcbiAgICAgIG5vZGUucmVtb3ZlQ2hpbGQoY2hpbGQpO1xuICAgICAgY29udGV4dC5tYXJrRGVsZXRlZCggLyoqIEB0eXBlIHshTm9kZX0qL2NoaWxkKTtcblxuICAgICAga2V5ID0gZ2V0RGF0YShjaGlsZCkua2V5O1xuICAgICAgaWYgKGtleSkge1xuICAgICAgICBkZWxldGUga2V5TWFwW2tleV07XG4gICAgICB9XG4gICAgICBjaGlsZCA9IG5vZGUubGFzdENoaWxkO1xuICAgIH1cblxuICAgIC8vIENsZWFuIHRoZSBrZXlNYXAsIHJlbW92aW5nIGFueSB1bnVzdWVkIGtleXMuXG4gICAgaWYgKCFrZXlNYXBWYWxpZCkge1xuICAgICAgZm9yIChrZXkgaW4ga2V5TWFwKSB7XG4gICAgICAgIGNoaWxkID0ga2V5TWFwW2tleV07XG4gICAgICAgIGlmIChjaGlsZC5wYXJlbnROb2RlICE9PSBub2RlKSB7XG4gICAgICAgICAgY29udGV4dC5tYXJrRGVsZXRlZChjaGlsZCk7XG4gICAgICAgICAgZGVsZXRlIGtleU1hcFtrZXldO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGRhdGEua2V5TWFwVmFsaWQgPSB0cnVlO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQ2hhbmdlcyB0byB0aGUgZmlyc3QgY2hpbGQgb2YgdGhlIGN1cnJlbnQgbm9kZS5cbiAgICovXG4gIHZhciBlbnRlck5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgY3VycmVudFBhcmVudCA9IGN1cnJlbnROb2RlO1xuICAgIGN1cnJlbnROb2RlID0gbnVsbDtcbiAgfTtcblxuICAvKipcbiAgICogQ2hhbmdlcyB0byB0aGUgbmV4dCBzaWJsaW5nIG9mIHRoZSBjdXJyZW50IG5vZGUuXG4gICAqL1xuICB2YXIgbmV4dE5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGN1cnJlbnROb2RlKSB7XG4gICAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLm5leHRTaWJsaW5nO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnRQYXJlbnQuZmlyc3RDaGlsZDtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIENoYW5nZXMgdG8gdGhlIHBhcmVudCBvZiB0aGUgY3VycmVudCBub2RlLCByZW1vdmluZyBhbnkgdW52aXNpdGVkIGNoaWxkcmVuLlxuICAgKi9cbiAgdmFyIGV4aXROb2RlID0gZnVuY3Rpb24gKCkge1xuICAgIGNsZWFyVW52aXNpdGVkRE9NKCk7XG5cbiAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnRQYXJlbnQ7XG4gICAgY3VycmVudFBhcmVudCA9IGN1cnJlbnRQYXJlbnQucGFyZW50Tm9kZTtcbiAgfTtcblxuICAvKipcbiAgICogTWFrZXMgc3VyZSB0aGF0IHRoZSBjdXJyZW50IG5vZGUgaXMgYW4gRWxlbWVudCB3aXRoIGEgbWF0Y2hpbmcgdGFnTmFtZSBhbmRcbiAgICoga2V5LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICAgKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC4gVGhpcyBjYW4gYmUgYW5cbiAgICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICAgKiAgICAgd2hlbiBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAgICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICAgKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAgICogICAgIEVsZW1lbnQgaXMgY3JlYXRlZC5cbiAgICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gICAqL1xuICB2YXIgY29yZUVsZW1lbnRPcGVuID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzKSB7XG4gICAgbmV4dE5vZGUoKTtcbiAgICBhbGlnbldpdGhET00odGFnLCBrZXksIHN0YXRpY3MpO1xuICAgIGVudGVyTm9kZSgpO1xuICAgIHJldHVybiAoLyoqIEB0eXBlIHshRWxlbWVudH0gKi9jdXJyZW50UGFyZW50XG4gICAgKTtcbiAgfTtcblxuICAvKipcbiAgICogQ2xvc2VzIHRoZSBjdXJyZW50bHkgb3BlbiBFbGVtZW50LCByZW1vdmluZyBhbnkgdW52aXNpdGVkIGNoaWxkcmVuIGlmXG4gICAqIG5lY2Vzc2FyeS5cbiAgICpcbiAgICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gICAqL1xuICB2YXIgY29yZUVsZW1lbnRDbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgICBleGl0Tm9kZSgpO1xuICAgIHJldHVybiAoLyoqIEB0eXBlIHshRWxlbWVudH0gKi9jdXJyZW50Tm9kZVxuICAgICk7XG4gIH07XG5cbiAgLyoqXG4gICAqIE1ha2VzIHN1cmUgdGhlIGN1cnJlbnQgbm9kZSBpcyBhIFRleHQgbm9kZSBhbmQgY3JlYXRlcyBhIFRleHQgbm9kZSBpZiBpdCBpc1xuICAgKiBub3QuXG4gICAqXG4gICAqIEByZXR1cm4geyFUZXh0fSBUaGUgY29ycmVzcG9uZGluZyBUZXh0IE5vZGUuXG4gICAqL1xuICB2YXIgY29yZVRleHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgbmV4dE5vZGUoKTtcbiAgICBhbGlnbldpdGhET00oJyN0ZXh0JywgbnVsbCwgbnVsbCk7XG4gICAgcmV0dXJuICgvKiogQHR5cGUgeyFUZXh0fSAqL2N1cnJlbnROb2RlXG4gICAgKTtcbiAgfTtcblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBFbGVtZW50IGJlaW5nIHBhdGNoZWQuXG4gICAqIEByZXR1cm4geyFFbGVtZW50fVxuICAgKi9cbiAgdmFyIGN1cnJlbnRFbGVtZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cbiAgICByZXR1cm4gKC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovY3VycmVudFBhcmVudFxuICAgICk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNraXBzIHRoZSBjaGlsZHJlbiBpbiBhIHN1YnRyZWUsIGFsbG93aW5nIGFuIEVsZW1lbnQgdG8gYmUgY2xvc2VkIHdpdGhvdXRcbiAgICogY2xlYXJpbmcgb3V0IHRoZSBjaGlsZHJlbi5cbiAgICovXG4gIHZhciBza2lwID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cbiAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnRQYXJlbnQubGFzdENoaWxkO1xuICB9O1xuXG4gIC8qKlxuICAgKiBUaGUgb2Zmc2V0IGluIHRoZSB2aXJ0dWFsIGVsZW1lbnQgZGVjbGFyYXRpb24gd2hlcmUgdGhlIGF0dHJpYnV0ZXMgYXJlXG4gICAqIHNwZWNpZmllZC5cbiAgICogQGNvbnN0XG4gICAqL1xuICB2YXIgQVRUUklCVVRFU19PRkZTRVQgPSAzO1xuXG4gIC8qKlxuICAgKiBCdWlsZHMgYW4gYXJyYXkgb2YgYXJndW1lbnRzIGZvciB1c2Ugd2l0aCBlbGVtZW50T3BlblN0YXJ0LCBhdHRyIGFuZFxuICAgKiBlbGVtZW50T3BlbkVuZC5cbiAgICogQGNvbnN0IHtBcnJheTwqPn1cbiAgICovXG4gIHZhciBhcmdzQnVpbGRlciA9IFtdO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICAgKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC4gVGhpcyBjYW4gYmUgYW5cbiAgICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICAgKiAgICAgd2hlbiBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAgICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICAgKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAgICogICAgIEVsZW1lbnQgaXMgY3JlYXRlZC5cbiAgICogQHBhcmFtIHsuLi4qfSBjb25zdF9hcmdzIEF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZSBkeW5hbWljIGF0dHJpYnV0ZXNcbiAgICogICAgIGZvciB0aGUgRWxlbWVudC5cbiAgICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gICAqL1xuICB2YXIgZWxlbWVudE9wZW4gPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MsIGNvbnN0X2FyZ3MpIHtcbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgICB2YXIgbm9kZSA9IGNvcmVFbGVtZW50T3Blbih0YWcsIGtleSwgc3RhdGljcyk7XG4gICAgdmFyIGRhdGEgPSBnZXREYXRhKG5vZGUpO1xuXG4gICAgLypcbiAgICAgKiBDaGVja3MgdG8gc2VlIGlmIG9uZSBvciBtb3JlIGF0dHJpYnV0ZXMgaGF2ZSBjaGFuZ2VkIGZvciBhIGdpdmVuIEVsZW1lbnQuXG4gICAgICogV2hlbiBubyBhdHRyaWJ1dGVzIGhhdmUgY2hhbmdlZCwgdGhpcyBpcyBtdWNoIGZhc3RlciB0aGFuIGNoZWNraW5nIGVhY2hcbiAgICAgKiBpbmRpdmlkdWFsIGFyZ3VtZW50LiBXaGVuIGF0dHJpYnV0ZXMgaGF2ZSBjaGFuZ2VkLCB0aGUgb3ZlcmhlYWQgb2YgdGhpcyBpc1xuICAgICAqIG1pbmltYWwuXG4gICAgICovXG4gICAgdmFyIGF0dHJzQXJyID0gZGF0YS5hdHRyc0FycjtcbiAgICB2YXIgbmV3QXR0cnMgPSBkYXRhLm5ld0F0dHJzO1xuICAgIHZhciBhdHRyc0NoYW5nZWQgPSBmYWxzZTtcbiAgICB2YXIgaSA9IEFUVFJJQlVURVNfT0ZGU0VUO1xuICAgIHZhciBqID0gMDtcblxuICAgIGZvciAoOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAxLCBqICs9IDEpIHtcbiAgICAgIGlmIChhdHRyc0FycltqXSAhPT0gYXJndW1lbnRzW2ldKSB7XG4gICAgICAgIGF0dHJzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAxLCBqICs9IDEpIHtcbiAgICAgIGF0dHJzQXJyW2pdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGlmIChqIDwgYXR0cnNBcnIubGVuZ3RoKSB7XG4gICAgICBhdHRyc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgYXR0cnNBcnIubGVuZ3RoID0gajtcbiAgICB9XG5cbiAgICAvKlxuICAgICAqIEFjdHVhbGx5IHBlcmZvcm0gdGhlIGF0dHJpYnV0ZSB1cGRhdGUuXG4gICAgICovXG4gICAgaWYgKGF0dHJzQ2hhbmdlZCkge1xuICAgICAgZm9yIChpID0gQVRUUklCVVRFU19PRkZTRVQ7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgbmV3QXR0cnNbYXJndW1lbnRzW2ldXSA9IGFyZ3VtZW50c1tpICsgMV07XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIF9hdHRyIGluIG5ld0F0dHJzKSB7XG4gICAgICAgIHVwZGF0ZUF0dHJpYnV0ZShub2RlLCBfYXR0ciwgbmV3QXR0cnNbX2F0dHJdKTtcbiAgICAgICAgbmV3QXR0cnNbX2F0dHJdID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBub2RlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZWNsYXJlcyBhIHZpcnR1YWwgRWxlbWVudCBhdCB0aGUgY3VycmVudCBsb2NhdGlvbiBpbiB0aGUgZG9jdW1lbnQuIFRoaXNcbiAgICogY29ycmVzcG9uZHMgdG8gYW4gb3BlbmluZyB0YWcgYW5kIGEgZWxlbWVudENsb3NlIHRhZyBpcyByZXF1aXJlZC4gVGhpcyBpc1xuICAgKiBsaWtlIGVsZW1lbnRPcGVuLCBidXQgdGhlIGF0dHJpYnV0ZXMgYXJlIGRlZmluZWQgdXNpbmcgdGhlIGF0dHIgZnVuY3Rpb25cbiAgICogcmF0aGVyIHRoYW4gYmVpbmcgcGFzc2VkIGFzIGFyZ3VtZW50cy4gTXVzdCBiZSBmb2xsbG93ZWQgYnkgMCBvciBtb3JlIGNhbGxzXG4gICAqIHRvIGF0dHIsIHRoZW4gYSBjYWxsIHRvIGVsZW1lbnRPcGVuRW5kLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICAgKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC4gVGhpcyBjYW4gYmUgYW5cbiAgICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICAgKiAgICAgd2hlbiBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAgICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICAgKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAgICogICAgIEVsZW1lbnQgaXMgY3JlYXRlZC5cbiAgICovXG4gIHZhciBlbGVtZW50T3BlblN0YXJ0ID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzKSB7XG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gICAgYXJnc0J1aWxkZXJbMF0gPSB0YWc7XG4gICAgYXJnc0J1aWxkZXJbMV0gPSBrZXk7XG4gICAgYXJnc0J1aWxkZXJbMl0gPSBzdGF0aWNzO1xuICB9O1xuXG4gIC8qKipcbiAgICogRGVmaW5lcyBhIHZpcnR1YWwgYXR0cmlidXRlIGF0IHRoaXMgcG9pbnQgb2YgdGhlIERPTS4gVGhpcyBpcyBvbmx5IHZhbGlkXG4gICAqIHdoZW4gY2FsbGVkIGJldHdlZW4gZWxlbWVudE9wZW5TdGFydCBhbmQgZWxlbWVudE9wZW5FbmQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWVcbiAgICovXG4gIHZhciBhdHRyID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gICAgYXJnc0J1aWxkZXIucHVzaChuYW1lLCB2YWx1ZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENsb3NlcyBhbiBvcGVuIHRhZyBzdGFydGVkIHdpdGggZWxlbWVudE9wZW5TdGFydC5cbiAgICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gICAqL1xuICB2YXIgZWxlbWVudE9wZW5FbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gICAgdmFyIG5vZGUgPSBlbGVtZW50T3Blbi5hcHBseShudWxsLCBhcmdzQnVpbGRlcik7XG4gICAgYXJnc0J1aWxkZXIubGVuZ3RoID0gMDtcbiAgICByZXR1cm4gbm9kZTtcbiAgfTtcblxuICAvKipcbiAgICogQ2xvc2VzIGFuIG9wZW4gdmlydHVhbCBFbGVtZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICAgKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAgICovXG4gIHZhciBlbGVtZW50Q2xvc2UgPSBmdW5jdGlvbiAodGFnKSB7XG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gICAgdmFyIG5vZGUgPSBjb3JlRWxlbWVudENsb3NlKCk7XG5cbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgICByZXR1cm4gbm9kZTtcbiAgfTtcblxuICAvKipcbiAgICogRGVjbGFyZXMgYSB2aXJ0dWFsIEVsZW1lbnQgYXQgdGhlIGN1cnJlbnQgbG9jYXRpb24gaW4gdGhlIGRvY3VtZW50IHRoYXQgaGFzXG4gICAqIG5vIGNoaWxkcmVuLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICAgKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC4gVGhpcyBjYW4gYmUgYW5cbiAgICogICAgIGVtcHR5IHN0cmluZywgYnV0IHBlcmZvcm1hbmNlIG1heSBiZSBiZXR0ZXIgaWYgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZFxuICAgKiAgICAgd2hlbiBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBvZiBpdGVtcy5cbiAgICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICAgKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAgICogICAgIEVsZW1lbnQgaXMgY3JlYXRlZC5cbiAgICogQHBhcmFtIHsuLi4qfSBjb25zdF9hcmdzIEF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZSBkeW5hbWljIGF0dHJpYnV0ZXNcbiAgICogICAgIGZvciB0aGUgRWxlbWVudC5cbiAgICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gICAqL1xuICB2YXIgZWxlbWVudFZvaWQgPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MsIGNvbnN0X2FyZ3MpIHtcbiAgICBlbGVtZW50T3Blbi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgIHJldHVybiBlbGVtZW50Q2xvc2UodGFnKTtcbiAgfTtcblxuICAvKipcbiAgICogRGVjbGFyZXMgYSB2aXJ0dWFsIEVsZW1lbnQgYXQgdGhlIGN1cnJlbnQgbG9jYXRpb24gaW4gdGhlIGRvY3VtZW50IHRoYXQgaXMgYVxuICAgKiBwbGFjZWhvbGRlciBlbGVtZW50LiBDaGlsZHJlbiBvZiB0aGlzIEVsZW1lbnQgY2FuIGJlIG1hbnVhbGx5IG1hbmFnZWQgYW5kXG4gICAqIHdpbGwgbm90IGJlIGNsZWFyZWQgYnkgdGhlIGxpYnJhcnkuXG4gICAqXG4gICAqIEEga2V5IG11c3QgYmUgc3BlY2lmaWVkIHRvIG1ha2Ugc3VyZSB0aGF0IHRoaXMgbm9kZSBpcyBjb3JyZWN0bHkgcHJlc2VydmVkXG4gICAqIGFjcm9zcyBhbGwgY29uZGl0aW9uYWxzLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBlbGVtZW50J3MgdGFnLlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuXG4gICAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAgICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gICAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gICAqIEBwYXJhbSB7Li4uKn0gY29uc3RfYXJncyBBdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGUgZHluYW1pYyBhdHRyaWJ1dGVzXG4gICAqICAgICBmb3IgdGhlIEVsZW1lbnQuXG4gICAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICAgKi9cbiAgdmFyIGVsZW1lbnRQbGFjZWhvbGRlciA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcywgY29uc3RfYXJncykge1xuICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICAgIGVsZW1lbnRPcGVuLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgc2tpcCgpO1xuICAgIHJldHVybiBlbGVtZW50Q2xvc2UodGFnKTtcbiAgfTtcblxuICAvKipcbiAgICogRGVjbGFyZXMgYSB2aXJ0dWFsIFRleHQgYXQgdGhpcyBwb2ludCBpbiB0aGUgZG9jdW1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcnxib29sZWFufSB2YWx1ZSBUaGUgdmFsdWUgb2YgdGhlIFRleHQuXG4gICAqIEBwYXJhbSB7Li4uKGZ1bmN0aW9uKChzdHJpbmd8bnVtYmVyfGJvb2xlYW4pKTpzdHJpbmcpfSBjb25zdF9hcmdzXG4gICAqICAgICBGdW5jdGlvbnMgdG8gZm9ybWF0IHRoZSB2YWx1ZSB3aGljaCBhcmUgY2FsbGVkIG9ubHkgd2hlbiB0aGUgdmFsdWUgaGFzXG4gICAqICAgICBjaGFuZ2VkLlxuICAgKiBAcmV0dXJuIHshVGV4dH0gVGhlIGNvcnJlc3BvbmRpbmcgdGV4dCBub2RlLlxuICAgKi9cbiAgdmFyIHRleHQgPSBmdW5jdGlvbiAodmFsdWUsIGNvbnN0X2FyZ3MpIHtcbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgICB2YXIgbm9kZSA9IGNvcmVUZXh0KCk7XG4gICAgdmFyIGRhdGEgPSBnZXREYXRhKG5vZGUpO1xuXG4gICAgaWYgKGRhdGEudGV4dCAhPT0gdmFsdWUpIHtcbiAgICAgIGRhdGEudGV4dCA9IC8qKiBAdHlwZSB7c3RyaW5nfSAqL3ZhbHVlO1xuXG4gICAgICB2YXIgZm9ybWF0dGVkID0gdmFsdWU7XG4gICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAvKlxuICAgICAgICAgKiBDYWxsIHRoZSBmb3JtYXR0ZXIgZnVuY3Rpb24gZGlyZWN0bHkgdG8gcHJldmVudCBsZWFraW5nIGFyZ3VtZW50cy5cbiAgICAgICAgICogaHR0cHM6Ly9naXRodWIuY29tL2dvb2dsZS9pbmNyZW1lbnRhbC1kb20vcHVsbC8yMDQjaXNzdWVjb21tZW50LTE3ODIyMzU3NFxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIGZuID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBmb3JtYXR0ZWQgPSBmbihmb3JtYXR0ZWQpO1xuICAgICAgfVxuXG4gICAgICBub2RlLmRhdGEgPSBmb3JtYXR0ZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vZGU7XG4gIH07XG5cbiAgZXhwb3J0cy5wYXRjaCA9IHBhdGNoSW5uZXI7XG4gIGV4cG9ydHMucGF0Y2hJbm5lciA9IHBhdGNoSW5uZXI7XG4gIGV4cG9ydHMucGF0Y2hPdXRlciA9IHBhdGNoT3V0ZXI7XG4gIGV4cG9ydHMuY3VycmVudEVsZW1lbnQgPSBjdXJyZW50RWxlbWVudDtcbiAgZXhwb3J0cy5za2lwID0gc2tpcDtcbiAgZXhwb3J0cy5lbGVtZW50Vm9pZCA9IGVsZW1lbnRWb2lkO1xuICBleHBvcnRzLmVsZW1lbnRPcGVuU3RhcnQgPSBlbGVtZW50T3BlblN0YXJ0O1xuICBleHBvcnRzLmVsZW1lbnRPcGVuRW5kID0gZWxlbWVudE9wZW5FbmQ7XG4gIGV4cG9ydHMuZWxlbWVudE9wZW4gPSBlbGVtZW50T3BlbjtcbiAgZXhwb3J0cy5lbGVtZW50Q2xvc2UgPSBlbGVtZW50Q2xvc2U7XG4gIGV4cG9ydHMuZWxlbWVudFBsYWNlaG9sZGVyID0gZWxlbWVudFBsYWNlaG9sZGVyO1xuICBleHBvcnRzLnRleHQgPSB0ZXh0O1xuICBleHBvcnRzLmF0dHIgPSBhdHRyO1xuICBleHBvcnRzLnN5bWJvbHMgPSBzeW1ib2xzO1xuICBleHBvcnRzLmF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzO1xuICBleHBvcnRzLmFwcGx5QXR0ciA9IGFwcGx5QXR0cjtcbiAgZXhwb3J0cy5hcHBseVByb3AgPSBhcHBseVByb3A7XG4gIGV4cG9ydHMubm90aWZpY2F0aW9ucyA9IG5vdGlmaWNhdGlvbnM7XG5cbn0pKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5jcmVtZW50YWwtZG9tLmpzLm1hcCIsIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAoYykgMjAxNCBUaGUgUG9seW1lciBQcm9qZWN0IEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBUaGlzIGNvZGUgbWF5IG9ubHkgYmUgdXNlZCB1bmRlciB0aGUgQlNEIHN0eWxlIGxpY2Vuc2UgZm91bmQgYXQgaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0xJQ0VOU0UudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGF1dGhvcnMgbWF5IGJlIGZvdW5kIGF0IGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9BVVRIT1JTLnR4dFxuICogVGhlIGNvbXBsZXRlIHNldCBvZiBjb250cmlidXRvcnMgbWF5IGJlIGZvdW5kIGF0IGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9DT05UUklCVVRPUlMudHh0XG4gKiBDb2RlIGRpc3RyaWJ1dGVkIGJ5IEdvb2dsZSBhcyBwYXJ0IG9mIHRoZSBwb2x5bWVyIHByb2plY3QgaXMgYWxzb1xuICogc3ViamVjdCB0byBhbiBhZGRpdGlvbmFsIElQIHJpZ2h0cyBncmFudCBmb3VuZCBhdCBodHRwOi8vcG9seW1lci5naXRodWIuaW8vUEFURU5UUy50eHRcbiAqL1xuLy8gQHZlcnNpb24gMC43LjIyXG5pZiAodHlwZW9mIFdlYWtNYXAgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgKGZ1bmN0aW9uKCkge1xuICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eTtcbiAgICB2YXIgY291bnRlciA9IERhdGUubm93KCkgJSAxZTk7XG4gICAgdmFyIFdlYWtNYXAgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMubmFtZSA9IFwiX19zdFwiICsgKE1hdGgucmFuZG9tKCkgKiAxZTkgPj4+IDApICsgKGNvdW50ZXIrKyArIFwiX19cIik7XG4gICAgfTtcbiAgICBXZWFrTWFwLnByb3RvdHlwZSA9IHtcbiAgICAgIHNldDogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgICB2YXIgZW50cnkgPSBrZXlbdGhpcy5uYW1lXTtcbiAgICAgICAgaWYgKGVudHJ5ICYmIGVudHJ5WzBdID09PSBrZXkpIGVudHJ5WzFdID0gdmFsdWU7IGVsc2UgZGVmaW5lUHJvcGVydHkoa2V5LCB0aGlzLm5hbWUsIHtcbiAgICAgICAgICB2YWx1ZTogWyBrZXksIHZhbHVlIF0sXG4gICAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSxcbiAgICAgIGdldDogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHZhciBlbnRyeTtcbiAgICAgICAgcmV0dXJuIChlbnRyeSA9IGtleVt0aGlzLm5hbWVdKSAmJiBlbnRyeVswXSA9PT0ga2V5ID8gZW50cnlbMV0gOiB1bmRlZmluZWQ7XG4gICAgICB9LFxuICAgICAgXCJkZWxldGVcIjogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHZhciBlbnRyeSA9IGtleVt0aGlzLm5hbWVdO1xuICAgICAgICBpZiAoIWVudHJ5IHx8IGVudHJ5WzBdICE9PSBrZXkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgZW50cnlbMF0gPSBlbnRyeVsxXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9LFxuICAgICAgaGFzOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgdmFyIGVudHJ5ID0ga2V5W3RoaXMubmFtZV07XG4gICAgICAgIGlmICghZW50cnkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGVudHJ5WzBdID09PSBrZXk7XG4gICAgICB9XG4gICAgfTtcbiAgICB3aW5kb3cuV2Vha01hcCA9IFdlYWtNYXA7XG4gIH0pKCk7XG59XG5cbihmdW5jdGlvbihnbG9iYWwpIHtcbiAgaWYgKGdsb2JhbC5Kc011dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIHJlZ2lzdHJhdGlvbnNUYWJsZSA9IG5ldyBXZWFrTWFwKCk7XG4gIHZhciBzZXRJbW1lZGlhdGU7XG4gIGlmICgvVHJpZGVudHxFZGdlLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG4gICAgc2V0SW1tZWRpYXRlID0gc2V0VGltZW91dDtcbiAgfSBlbHNlIGlmICh3aW5kb3cuc2V0SW1tZWRpYXRlKSB7XG4gICAgc2V0SW1tZWRpYXRlID0gd2luZG93LnNldEltbWVkaWF0ZTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2V0SW1tZWRpYXRlUXVldWUgPSBbXTtcbiAgICB2YXIgc2VudGluZWwgPSBTdHJpbmcoTWF0aC5yYW5kb20oKSk7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChlLmRhdGEgPT09IHNlbnRpbmVsKSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IHNldEltbWVkaWF0ZVF1ZXVlO1xuICAgICAgICBzZXRJbW1lZGlhdGVRdWV1ZSA9IFtdO1xuICAgICAgICBxdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICAgICAgICBmdW5jKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHNldEltbWVkaWF0ZSA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICAgIHNldEltbWVkaWF0ZVF1ZXVlLnB1c2goZnVuYyk7XG4gICAgICB3aW5kb3cucG9zdE1lc3NhZ2Uoc2VudGluZWwsIFwiKlwiKTtcbiAgICB9O1xuICB9XG4gIHZhciBpc1NjaGVkdWxlZCA9IGZhbHNlO1xuICB2YXIgc2NoZWR1bGVkT2JzZXJ2ZXJzID0gW107XG4gIGZ1bmN0aW9uIHNjaGVkdWxlQ2FsbGJhY2sob2JzZXJ2ZXIpIHtcbiAgICBzY2hlZHVsZWRPYnNlcnZlcnMucHVzaChvYnNlcnZlcik7XG4gICAgaWYgKCFpc1NjaGVkdWxlZCkge1xuICAgICAgaXNTY2hlZHVsZWQgPSB0cnVlO1xuICAgICAgc2V0SW1tZWRpYXRlKGRpc3BhdGNoQ2FsbGJhY2tzKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gd3JhcElmTmVlZGVkKG5vZGUpIHtcbiAgICByZXR1cm4gd2luZG93LlNoYWRvd0RPTVBvbHlmaWxsICYmIHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbC53cmFwSWZOZWVkZWQobm9kZSkgfHwgbm9kZTtcbiAgfVxuICBmdW5jdGlvbiBkaXNwYXRjaENhbGxiYWNrcygpIHtcbiAgICBpc1NjaGVkdWxlZCA9IGZhbHNlO1xuICAgIHZhciBvYnNlcnZlcnMgPSBzY2hlZHVsZWRPYnNlcnZlcnM7XG4gICAgc2NoZWR1bGVkT2JzZXJ2ZXJzID0gW107XG4gICAgb2JzZXJ2ZXJzLnNvcnQoZnVuY3Rpb24obzEsIG8yKSB7XG4gICAgICByZXR1cm4gbzEudWlkXyAtIG8yLnVpZF87XG4gICAgfSk7XG4gICAgdmFyIGFueU5vbkVtcHR5ID0gZmFsc2U7XG4gICAgb2JzZXJ2ZXJzLmZvckVhY2goZnVuY3Rpb24ob2JzZXJ2ZXIpIHtcbiAgICAgIHZhciBxdWV1ZSA9IG9ic2VydmVyLnRha2VSZWNvcmRzKCk7XG4gICAgICByZW1vdmVUcmFuc2llbnRPYnNlcnZlcnNGb3Iob2JzZXJ2ZXIpO1xuICAgICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBvYnNlcnZlci5jYWxsYmFja18ocXVldWUsIG9ic2VydmVyKTtcbiAgICAgICAgYW55Tm9uRW1wdHkgPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChhbnlOb25FbXB0eSkgZGlzcGF0Y2hDYWxsYmFja3MoKTtcbiAgfVxuICBmdW5jdGlvbiByZW1vdmVUcmFuc2llbnRPYnNlcnZlcnNGb3Iob2JzZXJ2ZXIpIHtcbiAgICBvYnNlcnZlci5ub2Rlc18uZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XG4gICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQobm9kZSk7XG4gICAgICBpZiAoIXJlZ2lzdHJhdGlvbnMpIHJldHVybjtcbiAgICAgIHJlZ2lzdHJhdGlvbnMuZm9yRWFjaChmdW5jdGlvbihyZWdpc3RyYXRpb24pIHtcbiAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbi5vYnNlcnZlciA9PT0gb2JzZXJ2ZXIpIHJlZ2lzdHJhdGlvbi5yZW1vdmVUcmFuc2llbnRPYnNlcnZlcnMoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGZvckVhY2hBbmNlc3RvckFuZE9ic2VydmVyRW5xdWV1ZVJlY29yZCh0YXJnZXQsIGNhbGxiYWNrKSB7XG4gICAgZm9yICh2YXIgbm9kZSA9IHRhcmdldDsgbm9kZTsgbm9kZSA9IG5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KG5vZGUpO1xuICAgICAgaWYgKHJlZ2lzdHJhdGlvbnMpIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCByZWdpc3RyYXRpb25zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbiA9IHJlZ2lzdHJhdGlvbnNbal07XG4gICAgICAgICAgdmFyIG9wdGlvbnMgPSByZWdpc3RyYXRpb24ub3B0aW9ucztcbiAgICAgICAgICBpZiAobm9kZSAhPT0gdGFyZ2V0ICYmICFvcHRpb25zLnN1YnRyZWUpIGNvbnRpbnVlO1xuICAgICAgICAgIHZhciByZWNvcmQgPSBjYWxsYmFjayhvcHRpb25zKTtcbiAgICAgICAgICBpZiAocmVjb3JkKSByZWdpc3RyYXRpb24uZW5xdWV1ZShyZWNvcmQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHZhciB1aWRDb3VudGVyID0gMDtcbiAgZnVuY3Rpb24gSnNNdXRhdGlvbk9ic2VydmVyKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5jYWxsYmFja18gPSBjYWxsYmFjaztcbiAgICB0aGlzLm5vZGVzXyA9IFtdO1xuICAgIHRoaXMucmVjb3Jkc18gPSBbXTtcbiAgICB0aGlzLnVpZF8gPSArK3VpZENvdW50ZXI7XG4gIH1cbiAgSnNNdXRhdGlvbk9ic2VydmVyLnByb3RvdHlwZSA9IHtcbiAgICBvYnNlcnZlOiBmdW5jdGlvbih0YXJnZXQsIG9wdGlvbnMpIHtcbiAgICAgIHRhcmdldCA9IHdyYXBJZk5lZWRlZCh0YXJnZXQpO1xuICAgICAgaWYgKCFvcHRpb25zLmNoaWxkTGlzdCAmJiAhb3B0aW9ucy5hdHRyaWJ1dGVzICYmICFvcHRpb25zLmNoYXJhY3RlckRhdGEgfHwgb3B0aW9ucy5hdHRyaWJ1dGVPbGRWYWx1ZSAmJiAhb3B0aW9ucy5hdHRyaWJ1dGVzIHx8IG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyICYmIG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyLmxlbmd0aCAmJiAhb3B0aW9ucy5hdHRyaWJ1dGVzIHx8IG9wdGlvbnMuY2hhcmFjdGVyRGF0YU9sZFZhbHVlICYmICFvcHRpb25zLmNoYXJhY3RlckRhdGEpIHtcbiAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKCk7XG4gICAgICB9XG4gICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQodGFyZ2V0KTtcbiAgICAgIGlmICghcmVnaXN0cmF0aW9ucykgcmVnaXN0cmF0aW9uc1RhYmxlLnNldCh0YXJnZXQsIHJlZ2lzdHJhdGlvbnMgPSBbXSk7XG4gICAgICB2YXIgcmVnaXN0cmF0aW9uO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWdpc3RyYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChyZWdpc3RyYXRpb25zW2ldLm9ic2VydmVyID09PSB0aGlzKSB7XG4gICAgICAgICAgcmVnaXN0cmF0aW9uID0gcmVnaXN0cmF0aW9uc1tpXTtcbiAgICAgICAgICByZWdpc3RyYXRpb24ucmVtb3ZlTGlzdGVuZXJzKCk7XG4gICAgICAgICAgcmVnaXN0cmF0aW9uLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIXJlZ2lzdHJhdGlvbikge1xuICAgICAgICByZWdpc3RyYXRpb24gPSBuZXcgUmVnaXN0cmF0aW9uKHRoaXMsIHRhcmdldCwgb3B0aW9ucyk7XG4gICAgICAgIHJlZ2lzdHJhdGlvbnMucHVzaChyZWdpc3RyYXRpb24pO1xuICAgICAgICB0aGlzLm5vZGVzXy5wdXNoKHRhcmdldCk7XG4gICAgICB9XG4gICAgICByZWdpc3RyYXRpb24uYWRkTGlzdGVuZXJzKCk7XG4gICAgfSxcbiAgICBkaXNjb25uZWN0OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMubm9kZXNfLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQobm9kZSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVnaXN0cmF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciByZWdpc3RyYXRpb24gPSByZWdpc3RyYXRpb25zW2ldO1xuICAgICAgICAgIGlmIChyZWdpc3RyYXRpb24ub2JzZXJ2ZXIgPT09IHRoaXMpIHtcbiAgICAgICAgICAgIHJlZ2lzdHJhdGlvbi5yZW1vdmVMaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgIHJlZ2lzdHJhdGlvbnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LCB0aGlzKTtcbiAgICAgIHRoaXMucmVjb3Jkc18gPSBbXTtcbiAgICB9LFxuICAgIHRha2VSZWNvcmRzOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjb3B5T2ZSZWNvcmRzID0gdGhpcy5yZWNvcmRzXztcbiAgICAgIHRoaXMucmVjb3Jkc18gPSBbXTtcbiAgICAgIHJldHVybiBjb3B5T2ZSZWNvcmRzO1xuICAgIH1cbiAgfTtcbiAgZnVuY3Rpb24gTXV0YXRpb25SZWNvcmQodHlwZSwgdGFyZ2V0KSB7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICB0aGlzLmFkZGVkTm9kZXMgPSBbXTtcbiAgICB0aGlzLnJlbW92ZWROb2RlcyA9IFtdO1xuICAgIHRoaXMucHJldmlvdXNTaWJsaW5nID0gbnVsbDtcbiAgICB0aGlzLm5leHRTaWJsaW5nID0gbnVsbDtcbiAgICB0aGlzLmF0dHJpYnV0ZU5hbWUgPSBudWxsO1xuICAgIHRoaXMuYXR0cmlidXRlTmFtZXNwYWNlID0gbnVsbDtcbiAgICB0aGlzLm9sZFZhbHVlID0gbnVsbDtcbiAgfVxuICBmdW5jdGlvbiBjb3B5TXV0YXRpb25SZWNvcmQob3JpZ2luYWwpIHtcbiAgICB2YXIgcmVjb3JkID0gbmV3IE11dGF0aW9uUmVjb3JkKG9yaWdpbmFsLnR5cGUsIG9yaWdpbmFsLnRhcmdldCk7XG4gICAgcmVjb3JkLmFkZGVkTm9kZXMgPSBvcmlnaW5hbC5hZGRlZE5vZGVzLnNsaWNlKCk7XG4gICAgcmVjb3JkLnJlbW92ZWROb2RlcyA9IG9yaWdpbmFsLnJlbW92ZWROb2Rlcy5zbGljZSgpO1xuICAgIHJlY29yZC5wcmV2aW91c1NpYmxpbmcgPSBvcmlnaW5hbC5wcmV2aW91c1NpYmxpbmc7XG4gICAgcmVjb3JkLm5leHRTaWJsaW5nID0gb3JpZ2luYWwubmV4dFNpYmxpbmc7XG4gICAgcmVjb3JkLmF0dHJpYnV0ZU5hbWUgPSBvcmlnaW5hbC5hdHRyaWJ1dGVOYW1lO1xuICAgIHJlY29yZC5hdHRyaWJ1dGVOYW1lc3BhY2UgPSBvcmlnaW5hbC5hdHRyaWJ1dGVOYW1lc3BhY2U7XG4gICAgcmVjb3JkLm9sZFZhbHVlID0gb3JpZ2luYWwub2xkVmFsdWU7XG4gICAgcmV0dXJuIHJlY29yZDtcbiAgfVxuICB2YXIgY3VycmVudFJlY29yZCwgcmVjb3JkV2l0aE9sZFZhbHVlO1xuICBmdW5jdGlvbiBnZXRSZWNvcmQodHlwZSwgdGFyZ2V0KSB7XG4gICAgcmV0dXJuIGN1cnJlbnRSZWNvcmQgPSBuZXcgTXV0YXRpb25SZWNvcmQodHlwZSwgdGFyZ2V0KTtcbiAgfVxuICBmdW5jdGlvbiBnZXRSZWNvcmRXaXRoT2xkVmFsdWUob2xkVmFsdWUpIHtcbiAgICBpZiAocmVjb3JkV2l0aE9sZFZhbHVlKSByZXR1cm4gcmVjb3JkV2l0aE9sZFZhbHVlO1xuICAgIHJlY29yZFdpdGhPbGRWYWx1ZSA9IGNvcHlNdXRhdGlvblJlY29yZChjdXJyZW50UmVjb3JkKTtcbiAgICByZWNvcmRXaXRoT2xkVmFsdWUub2xkVmFsdWUgPSBvbGRWYWx1ZTtcbiAgICByZXR1cm4gcmVjb3JkV2l0aE9sZFZhbHVlO1xuICB9XG4gIGZ1bmN0aW9uIGNsZWFyUmVjb3JkcygpIHtcbiAgICBjdXJyZW50UmVjb3JkID0gcmVjb3JkV2l0aE9sZFZhbHVlID0gdW5kZWZpbmVkO1xuICB9XG4gIGZ1bmN0aW9uIHJlY29yZFJlcHJlc2VudHNDdXJyZW50TXV0YXRpb24ocmVjb3JkKSB7XG4gICAgcmV0dXJuIHJlY29yZCA9PT0gcmVjb3JkV2l0aE9sZFZhbHVlIHx8IHJlY29yZCA9PT0gY3VycmVudFJlY29yZDtcbiAgfVxuICBmdW5jdGlvbiBzZWxlY3RSZWNvcmQobGFzdFJlY29yZCwgbmV3UmVjb3JkKSB7XG4gICAgaWYgKGxhc3RSZWNvcmQgPT09IG5ld1JlY29yZCkgcmV0dXJuIGxhc3RSZWNvcmQ7XG4gICAgaWYgKHJlY29yZFdpdGhPbGRWYWx1ZSAmJiByZWNvcmRSZXByZXNlbnRzQ3VycmVudE11dGF0aW9uKGxhc3RSZWNvcmQpKSByZXR1cm4gcmVjb3JkV2l0aE9sZFZhbHVlO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGZ1bmN0aW9uIFJlZ2lzdHJhdGlvbihvYnNlcnZlciwgdGFyZ2V0LCBvcHRpb25zKSB7XG4gICAgdGhpcy5vYnNlcnZlciA9IG9ic2VydmVyO1xuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy50cmFuc2llbnRPYnNlcnZlZE5vZGVzID0gW107XG4gIH1cbiAgUmVnaXN0cmF0aW9uLnByb3RvdHlwZSA9IHtcbiAgICBlbnF1ZXVlOiBmdW5jdGlvbihyZWNvcmQpIHtcbiAgICAgIHZhciByZWNvcmRzID0gdGhpcy5vYnNlcnZlci5yZWNvcmRzXztcbiAgICAgIHZhciBsZW5ndGggPSByZWNvcmRzLmxlbmd0aDtcbiAgICAgIGlmIChyZWNvcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGxhc3RSZWNvcmQgPSByZWNvcmRzW2xlbmd0aCAtIDFdO1xuICAgICAgICB2YXIgcmVjb3JkVG9SZXBsYWNlTGFzdCA9IHNlbGVjdFJlY29yZChsYXN0UmVjb3JkLCByZWNvcmQpO1xuICAgICAgICBpZiAocmVjb3JkVG9SZXBsYWNlTGFzdCkge1xuICAgICAgICAgIHJlY29yZHNbbGVuZ3RoIC0gMV0gPSByZWNvcmRUb1JlcGxhY2VMYXN0O1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NoZWR1bGVDYWxsYmFjayh0aGlzLm9ic2VydmVyKTtcbiAgICAgIH1cbiAgICAgIHJlY29yZHNbbGVuZ3RoXSA9IHJlY29yZDtcbiAgICB9LFxuICAgIGFkZExpc3RlbmVyczogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmFkZExpc3RlbmVyc18odGhpcy50YXJnZXQpO1xuICAgIH0sXG4gICAgYWRkTGlzdGVuZXJzXzogZnVuY3Rpb24obm9kZSkge1xuICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVzKSBub2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJET01BdHRyTW9kaWZpZWRcIiwgdGhpcywgdHJ1ZSk7XG4gICAgICBpZiAob3B0aW9ucy5jaGFyYWN0ZXJEYXRhKSBub2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJET01DaGFyYWN0ZXJEYXRhTW9kaWZpZWRcIiwgdGhpcywgdHJ1ZSk7XG4gICAgICBpZiAob3B0aW9ucy5jaGlsZExpc3QpIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTU5vZGVJbnNlcnRlZFwiLCB0aGlzLCB0cnVlKTtcbiAgICAgIGlmIChvcHRpb25zLmNoaWxkTGlzdCB8fCBvcHRpb25zLnN1YnRyZWUpIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTU5vZGVSZW1vdmVkXCIsIHRoaXMsIHRydWUpO1xuICAgIH0sXG4gICAgcmVtb3ZlTGlzdGVuZXJzOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXJzXyh0aGlzLnRhcmdldCk7XG4gICAgfSxcbiAgICByZW1vdmVMaXN0ZW5lcnNfOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgIGlmIChvcHRpb25zLmF0dHJpYnV0ZXMpIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIkRPTUF0dHJNb2RpZmllZFwiLCB0aGlzLCB0cnVlKTtcbiAgICAgIGlmIChvcHRpb25zLmNoYXJhY3RlckRhdGEpIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIkRPTUNoYXJhY3RlckRhdGFNb2RpZmllZFwiLCB0aGlzLCB0cnVlKTtcbiAgICAgIGlmIChvcHRpb25zLmNoaWxkTGlzdCkgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiRE9NTm9kZUluc2VydGVkXCIsIHRoaXMsIHRydWUpO1xuICAgICAgaWYgKG9wdGlvbnMuY2hpbGRMaXN0IHx8IG9wdGlvbnMuc3VidHJlZSkgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiRE9NTm9kZVJlbW92ZWRcIiwgdGhpcywgdHJ1ZSk7XG4gICAgfSxcbiAgICBhZGRUcmFuc2llbnRPYnNlcnZlcjogZnVuY3Rpb24obm9kZSkge1xuICAgICAgaWYgKG5vZGUgPT09IHRoaXMudGFyZ2V0KSByZXR1cm47XG4gICAgICB0aGlzLmFkZExpc3RlbmVyc18obm9kZSk7XG4gICAgICB0aGlzLnRyYW5zaWVudE9ic2VydmVkTm9kZXMucHVzaChub2RlKTtcbiAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldChub2RlKTtcbiAgICAgIGlmICghcmVnaXN0cmF0aW9ucykgcmVnaXN0cmF0aW9uc1RhYmxlLnNldChub2RlLCByZWdpc3RyYXRpb25zID0gW10pO1xuICAgICAgcmVnaXN0cmF0aW9ucy5wdXNoKHRoaXMpO1xuICAgIH0sXG4gICAgcmVtb3ZlVHJhbnNpZW50T2JzZXJ2ZXJzOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0cmFuc2llbnRPYnNlcnZlZE5vZGVzID0gdGhpcy50cmFuc2llbnRPYnNlcnZlZE5vZGVzO1xuICAgICAgdGhpcy50cmFuc2llbnRPYnNlcnZlZE5vZGVzID0gW107XG4gICAgICB0cmFuc2llbnRPYnNlcnZlZE5vZGVzLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyc18obm9kZSk7XG4gICAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldChub2RlKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWdpc3RyYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbnNbaV0gPT09IHRoaXMpIHtcbiAgICAgICAgICAgIHJlZ2lzdHJhdGlvbnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LCB0aGlzKTtcbiAgICB9LFxuICAgIGhhbmRsZUV2ZW50OiBmdW5jdGlvbihlKSB7XG4gICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgc3dpdGNoIChlLnR5cGUpIHtcbiAgICAgICBjYXNlIFwiRE9NQXR0ck1vZGlmaWVkXCI6XG4gICAgICAgIHZhciBuYW1lID0gZS5hdHRyTmFtZTtcbiAgICAgICAgdmFyIG5hbWVzcGFjZSA9IGUucmVsYXRlZE5vZGUubmFtZXNwYWNlVVJJO1xuICAgICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgIHZhciByZWNvcmQgPSBuZXcgZ2V0UmVjb3JkKFwiYXR0cmlidXRlc1wiLCB0YXJnZXQpO1xuICAgICAgICByZWNvcmQuYXR0cmlidXRlTmFtZSA9IG5hbWU7XG4gICAgICAgIHJlY29yZC5hdHRyaWJ1dGVOYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gICAgICAgIHZhciBvbGRWYWx1ZSA9IGUuYXR0ckNoYW5nZSA9PT0gTXV0YXRpb25FdmVudC5BRERJVElPTiA/IG51bGwgOiBlLnByZXZWYWx1ZTtcbiAgICAgICAgZm9yRWFjaEFuY2VzdG9yQW5kT2JzZXJ2ZXJFbnF1ZXVlUmVjb3JkKHRhcmdldCwgZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICAgIGlmICghb3B0aW9ucy5hdHRyaWJ1dGVzKSByZXR1cm47XG4gICAgICAgICAgaWYgKG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyICYmIG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyLmxlbmd0aCAmJiBvcHRpb25zLmF0dHJpYnV0ZUZpbHRlci5pbmRleE9mKG5hbWUpID09PSAtMSAmJiBvcHRpb25zLmF0dHJpYnV0ZUZpbHRlci5pbmRleE9mKG5hbWVzcGFjZSkgPT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChvcHRpb25zLmF0dHJpYnV0ZU9sZFZhbHVlKSByZXR1cm4gZ2V0UmVjb3JkV2l0aE9sZFZhbHVlKG9sZFZhbHVlKTtcbiAgICAgICAgICByZXR1cm4gcmVjb3JkO1xuICAgICAgICB9KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwiRE9NQ2hhcmFjdGVyRGF0YU1vZGlmaWVkXCI6XG4gICAgICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICAgICAgdmFyIHJlY29yZCA9IGdldFJlY29yZChcImNoYXJhY3RlckRhdGFcIiwgdGFyZ2V0KTtcbiAgICAgICAgdmFyIG9sZFZhbHVlID0gZS5wcmV2VmFsdWU7XG4gICAgICAgIGZvckVhY2hBbmNlc3RvckFuZE9ic2VydmVyRW5xdWV1ZVJlY29yZCh0YXJnZXQsIGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgICBpZiAoIW9wdGlvbnMuY2hhcmFjdGVyRGF0YSkgcmV0dXJuO1xuICAgICAgICAgIGlmIChvcHRpb25zLmNoYXJhY3RlckRhdGFPbGRWYWx1ZSkgcmV0dXJuIGdldFJlY29yZFdpdGhPbGRWYWx1ZShvbGRWYWx1ZSk7XG4gICAgICAgICAgcmV0dXJuIHJlY29yZDtcbiAgICAgICAgfSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcIkRPTU5vZGVSZW1vdmVkXCI6XG4gICAgICAgIHRoaXMuYWRkVHJhbnNpZW50T2JzZXJ2ZXIoZS50YXJnZXQpO1xuXG4gICAgICAgY2FzZSBcIkRPTU5vZGVJbnNlcnRlZFwiOlxuICAgICAgICB2YXIgY2hhbmdlZE5vZGUgPSBlLnRhcmdldDtcbiAgICAgICAgdmFyIGFkZGVkTm9kZXMsIHJlbW92ZWROb2RlcztcbiAgICAgICAgaWYgKGUudHlwZSA9PT0gXCJET01Ob2RlSW5zZXJ0ZWRcIikge1xuICAgICAgICAgIGFkZGVkTm9kZXMgPSBbIGNoYW5nZWROb2RlIF07XG4gICAgICAgICAgcmVtb3ZlZE5vZGVzID0gW107XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWRkZWROb2RlcyA9IFtdO1xuICAgICAgICAgIHJlbW92ZWROb2RlcyA9IFsgY2hhbmdlZE5vZGUgXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcHJldmlvdXNTaWJsaW5nID0gY2hhbmdlZE5vZGUucHJldmlvdXNTaWJsaW5nO1xuICAgICAgICB2YXIgbmV4dFNpYmxpbmcgPSBjaGFuZ2VkTm9kZS5uZXh0U2libGluZztcbiAgICAgICAgdmFyIHJlY29yZCA9IGdldFJlY29yZChcImNoaWxkTGlzdFwiLCBlLnRhcmdldC5wYXJlbnROb2RlKTtcbiAgICAgICAgcmVjb3JkLmFkZGVkTm9kZXMgPSBhZGRlZE5vZGVzO1xuICAgICAgICByZWNvcmQucmVtb3ZlZE5vZGVzID0gcmVtb3ZlZE5vZGVzO1xuICAgICAgICByZWNvcmQucHJldmlvdXNTaWJsaW5nID0gcHJldmlvdXNTaWJsaW5nO1xuICAgICAgICByZWNvcmQubmV4dFNpYmxpbmcgPSBuZXh0U2libGluZztcbiAgICAgICAgZm9yRWFjaEFuY2VzdG9yQW5kT2JzZXJ2ZXJFbnF1ZXVlUmVjb3JkKGUucmVsYXRlZE5vZGUsIGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgICBpZiAoIW9wdGlvbnMuY2hpbGRMaXN0KSByZXR1cm47XG4gICAgICAgICAgcmV0dXJuIHJlY29yZDtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBjbGVhclJlY29yZHMoKTtcbiAgICB9XG4gIH07XG4gIGdsb2JhbC5Kc011dGF0aW9uT2JzZXJ2ZXIgPSBKc011dGF0aW9uT2JzZXJ2ZXI7XG4gIGlmICghZ2xvYmFsLk11dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgICBnbG9iYWwuTXV0YXRpb25PYnNlcnZlciA9IEpzTXV0YXRpb25PYnNlcnZlcjtcbiAgICBKc011dGF0aW9uT2JzZXJ2ZXIuX2lzUG9seWZpbGxlZCA9IHRydWU7XG4gIH1cbn0pKHNlbGYpO1xuXG4oZnVuY3Rpb24oc2NvcGUpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIGlmICghd2luZG93LnBlcmZvcm1hbmNlKSB7XG4gICAgdmFyIHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICB3aW5kb3cucGVyZm9ybWFuY2UgPSB7XG4gICAgICBub3c6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gRGF0ZS5ub3coKSAtIHN0YXJ0O1xuICAgICAgfVxuICAgIH07XG4gIH1cbiAgaWYgKCF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG5hdGl2ZVJhZiA9IHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZTtcbiAgICAgIHJldHVybiBuYXRpdmVSYWYgPyBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gbmF0aXZlUmFmKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGNhbGxiYWNrKHBlcmZvcm1hbmNlLm5vdygpKTtcbiAgICAgICAgfSk7XG4gICAgICB9IDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5zZXRUaW1lb3V0KGNhbGxiYWNrLCAxZTMgLyA2MCk7XG4gICAgICB9O1xuICAgIH0oKTtcbiAgfVxuICBpZiAoIXdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSkge1xuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHdpbmRvdy53ZWJraXRDYW5jZWxBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHwgZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGlkKTtcbiAgICAgIH07XG4gICAgfSgpO1xuICB9XG4gIHZhciB3b3JraW5nRGVmYXVsdFByZXZlbnRlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJFdmVudFwiKTtcbiAgICBlLmluaXRFdmVudChcImZvb1wiLCB0cnVlLCB0cnVlKTtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgcmV0dXJuIGUuZGVmYXVsdFByZXZlbnRlZDtcbiAgfSgpO1xuICBpZiAoIXdvcmtpbmdEZWZhdWx0UHJldmVudGVkKSB7XG4gICAgdmFyIG9yaWdQcmV2ZW50RGVmYXVsdCA9IEV2ZW50LnByb3RvdHlwZS5wcmV2ZW50RGVmYXVsdDtcbiAgICBFdmVudC5wcm90b3R5cGUucHJldmVudERlZmF1bHQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghdGhpcy5jYW5jZWxhYmxlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIG9yaWdQcmV2ZW50RGVmYXVsdC5jYWxsKHRoaXMpO1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiZGVmYXVsdFByZXZlbnRlZFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuICB2YXIgaXNJRSA9IC9UcmlkZW50Ly50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuICBpZiAoIXdpbmRvdy5DdXN0b21FdmVudCB8fCBpc0lFICYmIHR5cGVvZiB3aW5kb3cuQ3VzdG9tRXZlbnQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgIHdpbmRvdy5DdXN0b21FdmVudCA9IGZ1bmN0aW9uKGluVHlwZSwgcGFyYW1zKSB7XG4gICAgICBwYXJhbXMgPSBwYXJhbXMgfHwge307XG4gICAgICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiQ3VzdG9tRXZlbnRcIik7XG4gICAgICBlLmluaXRDdXN0b21FdmVudChpblR5cGUsIEJvb2xlYW4ocGFyYW1zLmJ1YmJsZXMpLCBCb29sZWFuKHBhcmFtcy5jYW5jZWxhYmxlKSwgcGFyYW1zLmRldGFpbCk7XG4gICAgICByZXR1cm4gZTtcbiAgICB9O1xuICAgIHdpbmRvdy5DdXN0b21FdmVudC5wcm90b3R5cGUgPSB3aW5kb3cuRXZlbnQucHJvdG90eXBlO1xuICB9XG4gIGlmICghd2luZG93LkV2ZW50IHx8IGlzSUUgJiYgdHlwZW9mIHdpbmRvdy5FdmVudCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgdmFyIG9yaWdFdmVudCA9IHdpbmRvdy5FdmVudDtcbiAgICB3aW5kb3cuRXZlbnQgPSBmdW5jdGlvbihpblR5cGUsIHBhcmFtcykge1xuICAgICAgcGFyYW1zID0gcGFyYW1zIHx8IHt9O1xuICAgICAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkV2ZW50XCIpO1xuICAgICAgZS5pbml0RXZlbnQoaW5UeXBlLCBCb29sZWFuKHBhcmFtcy5idWJibGVzKSwgQm9vbGVhbihwYXJhbXMuY2FuY2VsYWJsZSkpO1xuICAgICAgcmV0dXJuIGU7XG4gICAgfTtcbiAgICB3aW5kb3cuRXZlbnQucHJvdG90eXBlID0gb3JpZ0V2ZW50LnByb3RvdHlwZTtcbiAgfVxufSkod2luZG93LldlYkNvbXBvbmVudHMpO1xuXG53aW5kb3cuQ3VzdG9tRWxlbWVudHMgPSB3aW5kb3cuQ3VzdG9tRWxlbWVudHMgfHwge1xuICBmbGFnczoge31cbn07XG5cbihmdW5jdGlvbihzY29wZSkge1xuICB2YXIgZmxhZ3MgPSBzY29wZS5mbGFncztcbiAgdmFyIG1vZHVsZXMgPSBbXTtcbiAgdmFyIGFkZE1vZHVsZSA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuICAgIG1vZHVsZXMucHVzaChtb2R1bGUpO1xuICB9O1xuICB2YXIgaW5pdGlhbGl6ZU1vZHVsZXMgPSBmdW5jdGlvbigpIHtcbiAgICBtb2R1bGVzLmZvckVhY2goZnVuY3Rpb24obW9kdWxlKSB7XG4gICAgICBtb2R1bGUoc2NvcGUpO1xuICAgIH0pO1xuICB9O1xuICBzY29wZS5hZGRNb2R1bGUgPSBhZGRNb2R1bGU7XG4gIHNjb3BlLmluaXRpYWxpemVNb2R1bGVzID0gaW5pdGlhbGl6ZU1vZHVsZXM7XG4gIHNjb3BlLmhhc05hdGl2ZSA9IEJvb2xlYW4oZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KTtcbiAgc2NvcGUuaXNJRSA9IC9UcmlkZW50Ly50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuICBzY29wZS51c2VOYXRpdmUgPSAhZmxhZ3MucmVnaXN0ZXIgJiYgc2NvcGUuaGFzTmF0aXZlICYmICF3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwgJiYgKCF3aW5kb3cuSFRNTEltcG9ydHMgfHwgd2luZG93LkhUTUxJbXBvcnRzLnVzZU5hdGl2ZSk7XG59KSh3aW5kb3cuQ3VzdG9tRWxlbWVudHMpO1xuXG53aW5kb3cuQ3VzdG9tRWxlbWVudHMuYWRkTW9kdWxlKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBJTVBPUlRfTElOS19UWVBFID0gd2luZG93LkhUTUxJbXBvcnRzID8gd2luZG93LkhUTUxJbXBvcnRzLklNUE9SVF9MSU5LX1RZUEUgOiBcIm5vbmVcIjtcbiAgZnVuY3Rpb24gZm9yU3VidHJlZShub2RlLCBjYikge1xuICAgIGZpbmRBbGxFbGVtZW50cyhub2RlLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoY2IoZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBmb3JSb290cyhlLCBjYik7XG4gICAgfSk7XG4gICAgZm9yUm9vdHMobm9kZSwgY2IpO1xuICB9XG4gIGZ1bmN0aW9uIGZpbmRBbGxFbGVtZW50cyhub2RlLCBmaW5kLCBkYXRhKSB7XG4gICAgdmFyIGUgPSBub2RlLmZpcnN0RWxlbWVudENoaWxkO1xuICAgIGlmICghZSkge1xuICAgICAgZSA9IG5vZGUuZmlyc3RDaGlsZDtcbiAgICAgIHdoaWxlIChlICYmIGUubm9kZVR5cGUgIT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIGUgPSBlLm5leHRTaWJsaW5nO1xuICAgICAgfVxuICAgIH1cbiAgICB3aGlsZSAoZSkge1xuICAgICAgaWYgKGZpbmQoZSwgZGF0YSkgIT09IHRydWUpIHtcbiAgICAgICAgZmluZEFsbEVsZW1lbnRzKGUsIGZpbmQsIGRhdGEpO1xuICAgICAgfVxuICAgICAgZSA9IGUubmV4dEVsZW1lbnRTaWJsaW5nO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBmdW5jdGlvbiBmb3JSb290cyhub2RlLCBjYikge1xuICAgIHZhciByb290ID0gbm9kZS5zaGFkb3dSb290O1xuICAgIHdoaWxlIChyb290KSB7XG4gICAgICBmb3JTdWJ0cmVlKHJvb3QsIGNiKTtcbiAgICAgIHJvb3QgPSByb290Lm9sZGVyU2hhZG93Um9vdDtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gZm9yRG9jdW1lbnRUcmVlKGRvYywgY2IpIHtcbiAgICBfZm9yRG9jdW1lbnRUcmVlKGRvYywgY2IsIFtdKTtcbiAgfVxuICBmdW5jdGlvbiBfZm9yRG9jdW1lbnRUcmVlKGRvYywgY2IsIHByb2Nlc3NpbmdEb2N1bWVudHMpIHtcbiAgICBkb2MgPSB3aW5kb3cud3JhcChkb2MpO1xuICAgIGlmIChwcm9jZXNzaW5nRG9jdW1lbnRzLmluZGV4T2YoZG9jKSA+PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHByb2Nlc3NpbmdEb2N1bWVudHMucHVzaChkb2MpO1xuICAgIHZhciBpbXBvcnRzID0gZG9jLnF1ZXJ5U2VsZWN0b3JBbGwoXCJsaW5rW3JlbD1cIiArIElNUE9SVF9MSU5LX1RZUEUgKyBcIl1cIik7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBpbXBvcnRzLmxlbmd0aCwgbjsgaSA8IGwgJiYgKG4gPSBpbXBvcnRzW2ldKTsgaSsrKSB7XG4gICAgICBpZiAobi5pbXBvcnQpIHtcbiAgICAgICAgX2ZvckRvY3VtZW50VHJlZShuLmltcG9ydCwgY2IsIHByb2Nlc3NpbmdEb2N1bWVudHMpO1xuICAgICAgfVxuICAgIH1cbiAgICBjYihkb2MpO1xuICB9XG4gIHNjb3BlLmZvckRvY3VtZW50VHJlZSA9IGZvckRvY3VtZW50VHJlZTtcbiAgc2NvcGUuZm9yU3VidHJlZSA9IGZvclN1YnRyZWU7XG59KTtcblxud2luZG93LkN1c3RvbUVsZW1lbnRzLmFkZE1vZHVsZShmdW5jdGlvbihzY29wZSkge1xuICB2YXIgZmxhZ3MgPSBzY29wZS5mbGFncztcbiAgdmFyIGZvclN1YnRyZWUgPSBzY29wZS5mb3JTdWJ0cmVlO1xuICB2YXIgZm9yRG9jdW1lbnRUcmVlID0gc2NvcGUuZm9yRG9jdW1lbnRUcmVlO1xuICBmdW5jdGlvbiBhZGRlZE5vZGUobm9kZSwgaXNBdHRhY2hlZCkge1xuICAgIHJldHVybiBhZGRlZChub2RlLCBpc0F0dGFjaGVkKSB8fCBhZGRlZFN1YnRyZWUobm9kZSwgaXNBdHRhY2hlZCk7XG4gIH1cbiAgZnVuY3Rpb24gYWRkZWQobm9kZSwgaXNBdHRhY2hlZCkge1xuICAgIGlmIChzY29wZS51cGdyYWRlKG5vZGUsIGlzQXR0YWNoZWQpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGlzQXR0YWNoZWQpIHtcbiAgICAgIGF0dGFjaGVkKG5vZGUpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBhZGRlZFN1YnRyZWUobm9kZSwgaXNBdHRhY2hlZCkge1xuICAgIGZvclN1YnRyZWUobm9kZSwgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKGFkZGVkKGUsIGlzQXR0YWNoZWQpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIHZhciBoYXNUaHJvdHRsZWRBdHRhY2hlZCA9IHdpbmRvdy5NdXRhdGlvbk9ic2VydmVyLl9pc1BvbHlmaWxsZWQgJiYgZmxhZ3NbXCJ0aHJvdHRsZS1hdHRhY2hlZFwiXTtcbiAgc2NvcGUuaGFzUG9seWZpbGxNdXRhdGlvbnMgPSBoYXNUaHJvdHRsZWRBdHRhY2hlZDtcbiAgc2NvcGUuaGFzVGhyb3R0bGVkQXR0YWNoZWQgPSBoYXNUaHJvdHRsZWRBdHRhY2hlZDtcbiAgdmFyIGlzUGVuZGluZ011dGF0aW9ucyA9IGZhbHNlO1xuICB2YXIgcGVuZGluZ011dGF0aW9ucyA9IFtdO1xuICBmdW5jdGlvbiBkZWZlck11dGF0aW9uKGZuKSB7XG4gICAgcGVuZGluZ011dGF0aW9ucy5wdXNoKGZuKTtcbiAgICBpZiAoIWlzUGVuZGluZ011dGF0aW9ucykge1xuICAgICAgaXNQZW5kaW5nTXV0YXRpb25zID0gdHJ1ZTtcbiAgICAgIHNldFRpbWVvdXQodGFrZU11dGF0aW9ucyk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHRha2VNdXRhdGlvbnMoKSB7XG4gICAgaXNQZW5kaW5nTXV0YXRpb25zID0gZmFsc2U7XG4gICAgdmFyICRwID0gcGVuZGluZ011dGF0aW9ucztcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9ICRwLmxlbmd0aCwgcDsgaSA8IGwgJiYgKHAgPSAkcFtpXSk7IGkrKykge1xuICAgICAgcCgpO1xuICAgIH1cbiAgICBwZW5kaW5nTXV0YXRpb25zID0gW107XG4gIH1cbiAgZnVuY3Rpb24gYXR0YWNoZWQoZWxlbWVudCkge1xuICAgIGlmIChoYXNUaHJvdHRsZWRBdHRhY2hlZCkge1xuICAgICAgZGVmZXJNdXRhdGlvbihmdW5jdGlvbigpIHtcbiAgICAgICAgX2F0dGFjaGVkKGVsZW1lbnQpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIF9hdHRhY2hlZChlbGVtZW50KTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gX2F0dGFjaGVkKGVsZW1lbnQpIHtcbiAgICBpZiAoZWxlbWVudC5fX3VwZ3JhZGVkX18gJiYgIWVsZW1lbnQuX19hdHRhY2hlZCkge1xuICAgICAgZWxlbWVudC5fX2F0dGFjaGVkID0gdHJ1ZTtcbiAgICAgIGlmIChlbGVtZW50LmF0dGFjaGVkQ2FsbGJhY2spIHtcbiAgICAgICAgZWxlbWVudC5hdHRhY2hlZENhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGRldGFjaGVkTm9kZShub2RlKSB7XG4gICAgZGV0YWNoZWQobm9kZSk7XG4gICAgZm9yU3VidHJlZShub2RlLCBmdW5jdGlvbihlKSB7XG4gICAgICBkZXRhY2hlZChlKTtcbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBkZXRhY2hlZChlbGVtZW50KSB7XG4gICAgaWYgKGhhc1Rocm90dGxlZEF0dGFjaGVkKSB7XG4gICAgICBkZWZlck11dGF0aW9uKGZ1bmN0aW9uKCkge1xuICAgICAgICBfZGV0YWNoZWQoZWxlbWVudCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgX2RldGFjaGVkKGVsZW1lbnQpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBfZGV0YWNoZWQoZWxlbWVudCkge1xuICAgIGlmIChlbGVtZW50Ll9fdXBncmFkZWRfXyAmJiBlbGVtZW50Ll9fYXR0YWNoZWQpIHtcbiAgICAgIGVsZW1lbnQuX19hdHRhY2hlZCA9IGZhbHNlO1xuICAgICAgaWYgKGVsZW1lbnQuZGV0YWNoZWRDYWxsYmFjaykge1xuICAgICAgICBlbGVtZW50LmRldGFjaGVkQ2FsbGJhY2soKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gaW5Eb2N1bWVudChlbGVtZW50KSB7XG4gICAgdmFyIHAgPSBlbGVtZW50O1xuICAgIHZhciBkb2MgPSB3aW5kb3cud3JhcChkb2N1bWVudCk7XG4gICAgd2hpbGUgKHApIHtcbiAgICAgIGlmIChwID09IGRvYykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHAgPSBwLnBhcmVudE5vZGUgfHwgcC5ub2RlVHlwZSA9PT0gTm9kZS5ET0NVTUVOVF9GUkFHTUVOVF9OT0RFICYmIHAuaG9zdDtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gd2F0Y2hTaGFkb3cobm9kZSkge1xuICAgIGlmIChub2RlLnNoYWRvd1Jvb3QgJiYgIW5vZGUuc2hhZG93Um9vdC5fX3dhdGNoZWQpIHtcbiAgICAgIGZsYWdzLmRvbSAmJiBjb25zb2xlLmxvZyhcIndhdGNoaW5nIHNoYWRvdy1yb290IGZvcjogXCIsIG5vZGUubG9jYWxOYW1lKTtcbiAgICAgIHZhciByb290ID0gbm9kZS5zaGFkb3dSb290O1xuICAgICAgd2hpbGUgKHJvb3QpIHtcbiAgICAgICAgb2JzZXJ2ZShyb290KTtcbiAgICAgICAgcm9vdCA9IHJvb3Qub2xkZXJTaGFkb3dSb290O1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBoYW5kbGVyKHJvb3QsIG11dGF0aW9ucykge1xuICAgIGlmIChmbGFncy5kb20pIHtcbiAgICAgIHZhciBteCA9IG11dGF0aW9uc1swXTtcbiAgICAgIGlmIChteCAmJiBteC50eXBlID09PSBcImNoaWxkTGlzdFwiICYmIG14LmFkZGVkTm9kZXMpIHtcbiAgICAgICAgaWYgKG14LmFkZGVkTm9kZXMpIHtcbiAgICAgICAgICB2YXIgZCA9IG14LmFkZGVkTm9kZXNbMF07XG4gICAgICAgICAgd2hpbGUgKGQgJiYgZCAhPT0gZG9jdW1lbnQgJiYgIWQuaG9zdCkge1xuICAgICAgICAgICAgZCA9IGQucGFyZW50Tm9kZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHUgPSBkICYmIChkLlVSTCB8fCBkLl9VUkwgfHwgZC5ob3N0ICYmIGQuaG9zdC5sb2NhbE5hbWUpIHx8IFwiXCI7XG4gICAgICAgICAgdSA9IHUuc3BsaXQoXCIvP1wiKS5zaGlmdCgpLnNwbGl0KFwiL1wiKS5wb3AoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc29sZS5ncm91cChcIm11dGF0aW9ucyAoJWQpIFslc11cIiwgbXV0YXRpb25zLmxlbmd0aCwgdSB8fCBcIlwiKTtcbiAgICB9XG4gICAgdmFyIGlzQXR0YWNoZWQgPSBpbkRvY3VtZW50KHJvb3QpO1xuICAgIG11dGF0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKG14KSB7XG4gICAgICBpZiAobXgudHlwZSA9PT0gXCJjaGlsZExpc3RcIikge1xuICAgICAgICBmb3JFYWNoKG14LmFkZGVkTm9kZXMsIGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgICBpZiAoIW4ubG9jYWxOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGFkZGVkTm9kZShuLCBpc0F0dGFjaGVkKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGZvckVhY2gobXgucmVtb3ZlZE5vZGVzLCBmdW5jdGlvbihuKSB7XG4gICAgICAgICAgaWYgKCFuLmxvY2FsTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkZXRhY2hlZE5vZGUobik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGZsYWdzLmRvbSAmJiBjb25zb2xlLmdyb3VwRW5kKCk7XG4gIH1cbiAgZnVuY3Rpb24gdGFrZVJlY29yZHMobm9kZSkge1xuICAgIG5vZGUgPSB3aW5kb3cud3JhcChub2RlKTtcbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgIG5vZGUgPSB3aW5kb3cud3JhcChkb2N1bWVudCk7XG4gICAgfVxuICAgIHdoaWxlIChub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgfVxuICAgIHZhciBvYnNlcnZlciA9IG5vZGUuX19vYnNlcnZlcjtcbiAgICBpZiAob2JzZXJ2ZXIpIHtcbiAgICAgIGhhbmRsZXIobm9kZSwgb2JzZXJ2ZXIudGFrZVJlY29yZHMoKSk7XG4gICAgICB0YWtlTXV0YXRpb25zKCk7XG4gICAgfVxuICB9XG4gIHZhciBmb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbC5iaW5kKEFycmF5LnByb3RvdHlwZS5mb3JFYWNoKTtcbiAgZnVuY3Rpb24gb2JzZXJ2ZShpblJvb3QpIHtcbiAgICBpZiAoaW5Sb290Ll9fb2JzZXJ2ZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoaGFuZGxlci5iaW5kKHRoaXMsIGluUm9vdCkpO1xuICAgIG9ic2VydmVyLm9ic2VydmUoaW5Sb290LCB7XG4gICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICBzdWJ0cmVlOiB0cnVlXG4gICAgfSk7XG4gICAgaW5Sb290Ll9fb2JzZXJ2ZXIgPSBvYnNlcnZlcjtcbiAgfVxuICBmdW5jdGlvbiB1cGdyYWRlRG9jdW1lbnQoZG9jKSB7XG4gICAgZG9jID0gd2luZG93LndyYXAoZG9jKTtcbiAgICBmbGFncy5kb20gJiYgY29uc29sZS5ncm91cChcInVwZ3JhZGVEb2N1bWVudDogXCIsIGRvYy5iYXNlVVJJLnNwbGl0KFwiL1wiKS5wb3AoKSk7XG4gICAgdmFyIGlzTWFpbkRvY3VtZW50ID0gZG9jID09PSB3aW5kb3cud3JhcChkb2N1bWVudCk7XG4gICAgYWRkZWROb2RlKGRvYywgaXNNYWluRG9jdW1lbnQpO1xuICAgIG9ic2VydmUoZG9jKTtcbiAgICBmbGFncy5kb20gJiYgY29uc29sZS5ncm91cEVuZCgpO1xuICB9XG4gIGZ1bmN0aW9uIHVwZ3JhZGVEb2N1bWVudFRyZWUoZG9jKSB7XG4gICAgZm9yRG9jdW1lbnRUcmVlKGRvYywgdXBncmFkZURvY3VtZW50KTtcbiAgfVxuICB2YXIgb3JpZ2luYWxDcmVhdGVTaGFkb3dSb290ID0gRWxlbWVudC5wcm90b3R5cGUuY3JlYXRlU2hhZG93Um9vdDtcbiAgaWYgKG9yaWdpbmFsQ3JlYXRlU2hhZG93Um9vdCkge1xuICAgIEVsZW1lbnQucHJvdG90eXBlLmNyZWF0ZVNoYWRvd1Jvb3QgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByb290ID0gb3JpZ2luYWxDcmVhdGVTaGFkb3dSb290LmNhbGwodGhpcyk7XG4gICAgICB3aW5kb3cuQ3VzdG9tRWxlbWVudHMud2F0Y2hTaGFkb3codGhpcyk7XG4gICAgICByZXR1cm4gcm9vdDtcbiAgICB9O1xuICB9XG4gIHNjb3BlLndhdGNoU2hhZG93ID0gd2F0Y2hTaGFkb3c7XG4gIHNjb3BlLnVwZ3JhZGVEb2N1bWVudFRyZWUgPSB1cGdyYWRlRG9jdW1lbnRUcmVlO1xuICBzY29wZS51cGdyYWRlRG9jdW1lbnQgPSB1cGdyYWRlRG9jdW1lbnQ7XG4gIHNjb3BlLnVwZ3JhZGVTdWJ0cmVlID0gYWRkZWRTdWJ0cmVlO1xuICBzY29wZS51cGdyYWRlQWxsID0gYWRkZWROb2RlO1xuICBzY29wZS5hdHRhY2hlZCA9IGF0dGFjaGVkO1xuICBzY29wZS50YWtlUmVjb3JkcyA9IHRha2VSZWNvcmRzO1xufSk7XG5cbndpbmRvdy5DdXN0b21FbGVtZW50cy5hZGRNb2R1bGUoZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIGZsYWdzID0gc2NvcGUuZmxhZ3M7XG4gIGZ1bmN0aW9uIHVwZ3JhZGUobm9kZSwgaXNBdHRhY2hlZCkge1xuICAgIGlmIChub2RlLmxvY2FsTmFtZSA9PT0gXCJ0ZW1wbGF0ZVwiKSB7XG4gICAgICBpZiAod2luZG93LkhUTUxUZW1wbGF0ZUVsZW1lbnQgJiYgSFRNTFRlbXBsYXRlRWxlbWVudC5kZWNvcmF0ZSkge1xuICAgICAgICBIVE1MVGVtcGxhdGVFbGVtZW50LmRlY29yYXRlKG5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIW5vZGUuX191cGdyYWRlZF9fICYmIG5vZGUubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICB2YXIgaXMgPSBub2RlLmdldEF0dHJpYnV0ZShcImlzXCIpO1xuICAgICAgdmFyIGRlZmluaXRpb24gPSBzY29wZS5nZXRSZWdpc3RlcmVkRGVmaW5pdGlvbihub2RlLmxvY2FsTmFtZSkgfHwgc2NvcGUuZ2V0UmVnaXN0ZXJlZERlZmluaXRpb24oaXMpO1xuICAgICAgaWYgKGRlZmluaXRpb24pIHtcbiAgICAgICAgaWYgKGlzICYmIGRlZmluaXRpb24udGFnID09IG5vZGUubG9jYWxOYW1lIHx8ICFpcyAmJiAhZGVmaW5pdGlvbi5leHRlbmRzKSB7XG4gICAgICAgICAgcmV0dXJuIHVwZ3JhZGVXaXRoRGVmaW5pdGlvbihub2RlLCBkZWZpbml0aW9uLCBpc0F0dGFjaGVkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiB1cGdyYWRlV2l0aERlZmluaXRpb24oZWxlbWVudCwgZGVmaW5pdGlvbiwgaXNBdHRhY2hlZCkge1xuICAgIGZsYWdzLnVwZ3JhZGUgJiYgY29uc29sZS5ncm91cChcInVwZ3JhZGU6XCIsIGVsZW1lbnQubG9jYWxOYW1lKTtcbiAgICBpZiAoZGVmaW5pdGlvbi5pcykge1xuICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJpc1wiLCBkZWZpbml0aW9uLmlzKTtcbiAgICB9XG4gICAgaW1wbGVtZW50UHJvdG90eXBlKGVsZW1lbnQsIGRlZmluaXRpb24pO1xuICAgIGVsZW1lbnQuX191cGdyYWRlZF9fID0gdHJ1ZTtcbiAgICBjcmVhdGVkKGVsZW1lbnQpO1xuICAgIGlmIChpc0F0dGFjaGVkKSB7XG4gICAgICBzY29wZS5hdHRhY2hlZChlbGVtZW50KTtcbiAgICB9XG4gICAgc2NvcGUudXBncmFkZVN1YnRyZWUoZWxlbWVudCwgaXNBdHRhY2hlZCk7XG4gICAgZmxhZ3MudXBncmFkZSAmJiBjb25zb2xlLmdyb3VwRW5kKCk7XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cbiAgZnVuY3Rpb24gaW1wbGVtZW50UHJvdG90eXBlKGVsZW1lbnQsIGRlZmluaXRpb24pIHtcbiAgICBpZiAoT2JqZWN0Ll9fcHJvdG9fXykge1xuICAgICAgZWxlbWVudC5fX3Byb3RvX18gPSBkZWZpbml0aW9uLnByb3RvdHlwZTtcbiAgICB9IGVsc2Uge1xuICAgICAgY3VzdG9tTWl4aW4oZWxlbWVudCwgZGVmaW5pdGlvbi5wcm90b3R5cGUsIGRlZmluaXRpb24ubmF0aXZlKTtcbiAgICAgIGVsZW1lbnQuX19wcm90b19fID0gZGVmaW5pdGlvbi5wcm90b3R5cGU7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGN1c3RvbU1peGluKGluVGFyZ2V0LCBpblNyYywgaW5OYXRpdmUpIHtcbiAgICB2YXIgdXNlZCA9IHt9O1xuICAgIHZhciBwID0gaW5TcmM7XG4gICAgd2hpbGUgKHAgIT09IGluTmF0aXZlICYmIHAgIT09IEhUTUxFbGVtZW50LnByb3RvdHlwZSkge1xuICAgICAgdmFyIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhwKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBrOyBrID0ga2V5c1tpXTsgaSsrKSB7XG4gICAgICAgIGlmICghdXNlZFtrXSkge1xuICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShpblRhcmdldCwgaywgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihwLCBrKSk7XG4gICAgICAgICAgdXNlZFtrXSA9IDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHAgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YocCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGNyZWF0ZWQoZWxlbWVudCkge1xuICAgIGlmIChlbGVtZW50LmNyZWF0ZWRDYWxsYmFjaykge1xuICAgICAgZWxlbWVudC5jcmVhdGVkQ2FsbGJhY2soKTtcbiAgICB9XG4gIH1cbiAgc2NvcGUudXBncmFkZSA9IHVwZ3JhZGU7XG4gIHNjb3BlLnVwZ3JhZGVXaXRoRGVmaW5pdGlvbiA9IHVwZ3JhZGVXaXRoRGVmaW5pdGlvbjtcbiAgc2NvcGUuaW1wbGVtZW50UHJvdG90eXBlID0gaW1wbGVtZW50UHJvdG90eXBlO1xufSk7XG5cbndpbmRvdy5DdXN0b21FbGVtZW50cy5hZGRNb2R1bGUoZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIGlzSUUgPSBzY29wZS5pc0lFO1xuICB2YXIgdXBncmFkZURvY3VtZW50VHJlZSA9IHNjb3BlLnVwZ3JhZGVEb2N1bWVudFRyZWU7XG4gIHZhciB1cGdyYWRlQWxsID0gc2NvcGUudXBncmFkZUFsbDtcbiAgdmFyIHVwZ3JhZGVXaXRoRGVmaW5pdGlvbiA9IHNjb3BlLnVwZ3JhZGVXaXRoRGVmaW5pdGlvbjtcbiAgdmFyIGltcGxlbWVudFByb3RvdHlwZSA9IHNjb3BlLmltcGxlbWVudFByb3RvdHlwZTtcbiAgdmFyIHVzZU5hdGl2ZSA9IHNjb3BlLnVzZU5hdGl2ZTtcbiAgZnVuY3Rpb24gcmVnaXN0ZXIobmFtZSwgb3B0aW9ucykge1xuICAgIHZhciBkZWZpbml0aW9uID0gb3B0aW9ucyB8fCB7fTtcbiAgICBpZiAoIW5hbWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudDogZmlyc3QgYXJndW1lbnQgYG5hbWVgIG11c3Qgbm90IGJlIGVtcHR5XCIpO1xuICAgIH1cbiAgICBpZiAobmFtZS5pbmRleE9mKFwiLVwiKSA8IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudDogZmlyc3QgYXJndW1lbnQgKCduYW1lJykgbXVzdCBjb250YWluIGEgZGFzaCAoJy0nKS4gQXJndW1lbnQgcHJvdmlkZWQgd2FzICdcIiArIFN0cmluZyhuYW1lKSArIFwiJy5cIik7XG4gICAgfVxuICAgIGlmIChpc1Jlc2VydmVkVGFnKG5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gZXhlY3V0ZSAncmVnaXN0ZXJFbGVtZW50JyBvbiAnRG9jdW1lbnQnOiBSZWdpc3RyYXRpb24gZmFpbGVkIGZvciB0eXBlICdcIiArIFN0cmluZyhuYW1lKSArIFwiJy4gVGhlIHR5cGUgbmFtZSBpcyBpbnZhbGlkLlwiKTtcbiAgICB9XG4gICAgaWYgKGdldFJlZ2lzdGVyZWREZWZpbml0aW9uKG5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEdXBsaWNhdGVEZWZpbml0aW9uRXJyb3I6IGEgdHlwZSB3aXRoIG5hbWUgJ1wiICsgU3RyaW5nKG5hbWUpICsgXCInIGlzIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgaWYgKCFkZWZpbml0aW9uLnByb3RvdHlwZSkge1xuICAgICAgZGVmaW5pdGlvbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgfVxuICAgIGRlZmluaXRpb24uX19uYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChkZWZpbml0aW9uLmV4dGVuZHMpIHtcbiAgICAgIGRlZmluaXRpb24uZXh0ZW5kcyA9IGRlZmluaXRpb24uZXh0ZW5kcy50b0xvd2VyQ2FzZSgpO1xuICAgIH1cbiAgICBkZWZpbml0aW9uLmxpZmVjeWNsZSA9IGRlZmluaXRpb24ubGlmZWN5Y2xlIHx8IHt9O1xuICAgIGRlZmluaXRpb24uYW5jZXN0cnkgPSBhbmNlc3RyeShkZWZpbml0aW9uLmV4dGVuZHMpO1xuICAgIHJlc29sdmVUYWdOYW1lKGRlZmluaXRpb24pO1xuICAgIHJlc29sdmVQcm90b3R5cGVDaGFpbihkZWZpbml0aW9uKTtcbiAgICBvdmVycmlkZUF0dHJpYnV0ZUFwaShkZWZpbml0aW9uLnByb3RvdHlwZSk7XG4gICAgcmVnaXN0ZXJEZWZpbml0aW9uKGRlZmluaXRpb24uX19uYW1lLCBkZWZpbml0aW9uKTtcbiAgICBkZWZpbml0aW9uLmN0b3IgPSBnZW5lcmF0ZUNvbnN0cnVjdG9yKGRlZmluaXRpb24pO1xuICAgIGRlZmluaXRpb24uY3Rvci5wcm90b3R5cGUgPSBkZWZpbml0aW9uLnByb3RvdHlwZTtcbiAgICBkZWZpbml0aW9uLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGRlZmluaXRpb24uY3RvcjtcbiAgICBpZiAoc2NvcGUucmVhZHkpIHtcbiAgICAgIHVwZ3JhZGVEb2N1bWVudFRyZWUoZG9jdW1lbnQpO1xuICAgIH1cbiAgICByZXR1cm4gZGVmaW5pdGlvbi5jdG9yO1xuICB9XG4gIGZ1bmN0aW9uIG92ZXJyaWRlQXR0cmlidXRlQXBpKHByb3RvdHlwZSkge1xuICAgIGlmIChwcm90b3R5cGUuc2V0QXR0cmlidXRlLl9wb2x5ZmlsbGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBzZXRBdHRyaWJ1dGUgPSBwcm90b3R5cGUuc2V0QXR0cmlidXRlO1xuICAgIHByb3RvdHlwZS5zZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgICAgY2hhbmdlQXR0cmlidXRlLmNhbGwodGhpcywgbmFtZSwgdmFsdWUsIHNldEF0dHJpYnV0ZSk7XG4gICAgfTtcbiAgICB2YXIgcmVtb3ZlQXR0cmlidXRlID0gcHJvdG90eXBlLnJlbW92ZUF0dHJpYnV0ZTtcbiAgICBwcm90b3R5cGUucmVtb3ZlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSkge1xuICAgICAgY2hhbmdlQXR0cmlidXRlLmNhbGwodGhpcywgbmFtZSwgbnVsbCwgcmVtb3ZlQXR0cmlidXRlKTtcbiAgICB9O1xuICAgIHByb3RvdHlwZS5zZXRBdHRyaWJ1dGUuX3BvbHlmaWxsZWQgPSB0cnVlO1xuICB9XG4gIGZ1bmN0aW9uIGNoYW5nZUF0dHJpYnV0ZShuYW1lLCB2YWx1ZSwgb3BlcmF0aW9uKSB7XG4gICAgbmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgICBvcGVyYXRpb24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB2YXIgbmV3VmFsdWUgPSB0aGlzLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgICBpZiAodGhpcy5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sgJiYgbmV3VmFsdWUgIT09IG9sZFZhbHVlKSB7XG4gICAgICB0aGlzLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBpc1Jlc2VydmVkVGFnKG5hbWUpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc2VydmVkVGFnTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKG5hbWUgPT09IHJlc2VydmVkVGFnTGlzdFtpXSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdmFyIHJlc2VydmVkVGFnTGlzdCA9IFsgXCJhbm5vdGF0aW9uLXhtbFwiLCBcImNvbG9yLXByb2ZpbGVcIiwgXCJmb250LWZhY2VcIiwgXCJmb250LWZhY2Utc3JjXCIsIFwiZm9udC1mYWNlLXVyaVwiLCBcImZvbnQtZmFjZS1mb3JtYXRcIiwgXCJmb250LWZhY2UtbmFtZVwiLCBcIm1pc3NpbmctZ2x5cGhcIiBdO1xuICBmdW5jdGlvbiBhbmNlc3RyeShleHRuZHMpIHtcbiAgICB2YXIgZXh0ZW5kZWUgPSBnZXRSZWdpc3RlcmVkRGVmaW5pdGlvbihleHRuZHMpO1xuICAgIGlmIChleHRlbmRlZSkge1xuICAgICAgcmV0dXJuIGFuY2VzdHJ5KGV4dGVuZGVlLmV4dGVuZHMpLmNvbmNhdChbIGV4dGVuZGVlIF0pO1xuICAgIH1cbiAgICByZXR1cm4gW107XG4gIH1cbiAgZnVuY3Rpb24gcmVzb2x2ZVRhZ05hbWUoZGVmaW5pdGlvbikge1xuICAgIHZhciBiYXNlVGFnID0gZGVmaW5pdGlvbi5leHRlbmRzO1xuICAgIGZvciAodmFyIGkgPSAwLCBhOyBhID0gZGVmaW5pdGlvbi5hbmNlc3RyeVtpXTsgaSsrKSB7XG4gICAgICBiYXNlVGFnID0gYS5pcyAmJiBhLnRhZztcbiAgICB9XG4gICAgZGVmaW5pdGlvbi50YWcgPSBiYXNlVGFnIHx8IGRlZmluaXRpb24uX19uYW1lO1xuICAgIGlmIChiYXNlVGFnKSB7XG4gICAgICBkZWZpbml0aW9uLmlzID0gZGVmaW5pdGlvbi5fX25hbWU7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHJlc29sdmVQcm90b3R5cGVDaGFpbihkZWZpbml0aW9uKSB7XG4gICAgaWYgKCFPYmplY3QuX19wcm90b19fKSB7XG4gICAgICB2YXIgbmF0aXZlUHJvdG90eXBlID0gSFRNTEVsZW1lbnQucHJvdG90eXBlO1xuICAgICAgaWYgKGRlZmluaXRpb24uaXMpIHtcbiAgICAgICAgdmFyIGluc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGRlZmluaXRpb24udGFnKTtcbiAgICAgICAgbmF0aXZlUHJvdG90eXBlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGluc3QpO1xuICAgICAgfVxuICAgICAgdmFyIHByb3RvID0gZGVmaW5pdGlvbi5wcm90b3R5cGUsIGFuY2VzdG9yO1xuICAgICAgdmFyIGZvdW5kUHJvdG90eXBlID0gZmFsc2U7XG4gICAgICB3aGlsZSAocHJvdG8pIHtcbiAgICAgICAgaWYgKHByb3RvID09IG5hdGl2ZVByb3RvdHlwZSkge1xuICAgICAgICAgIGZvdW5kUHJvdG90eXBlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBhbmNlc3RvciA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihwcm90byk7XG4gICAgICAgIGlmIChhbmNlc3Rvcikge1xuICAgICAgICAgIHByb3RvLl9fcHJvdG9fXyA9IGFuY2VzdG9yO1xuICAgICAgICB9XG4gICAgICAgIHByb3RvID0gYW5jZXN0b3I7XG4gICAgICB9XG4gICAgICBpZiAoIWZvdW5kUHJvdG90eXBlKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihkZWZpbml0aW9uLnRhZyArIFwiIHByb3RvdHlwZSBub3QgZm91bmQgaW4gcHJvdG90eXBlIGNoYWluIGZvciBcIiArIGRlZmluaXRpb24uaXMpO1xuICAgICAgfVxuICAgICAgZGVmaW5pdGlvbi5uYXRpdmUgPSBuYXRpdmVQcm90b3R5cGU7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGluc3RhbnRpYXRlKGRlZmluaXRpb24pIHtcbiAgICByZXR1cm4gdXBncmFkZVdpdGhEZWZpbml0aW9uKGRvbUNyZWF0ZUVsZW1lbnQoZGVmaW5pdGlvbi50YWcpLCBkZWZpbml0aW9uKTtcbiAgfVxuICB2YXIgcmVnaXN0cnkgPSB7fTtcbiAgZnVuY3Rpb24gZ2V0UmVnaXN0ZXJlZERlZmluaXRpb24obmFtZSkge1xuICAgIGlmIChuYW1lKSB7XG4gICAgICByZXR1cm4gcmVnaXN0cnlbbmFtZS50b0xvd2VyQ2FzZSgpXTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcmVnaXN0ZXJEZWZpbml0aW9uKG5hbWUsIGRlZmluaXRpb24pIHtcbiAgICByZWdpc3RyeVtuYW1lXSA9IGRlZmluaXRpb247XG4gIH1cbiAgZnVuY3Rpb24gZ2VuZXJhdGVDb25zdHJ1Y3RvcihkZWZpbml0aW9uKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGluc3RhbnRpYXRlKGRlZmluaXRpb24pO1xuICAgIH07XG4gIH1cbiAgdmFyIEhUTUxfTkFNRVNQQUNFID0gXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sXCI7XG4gIGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2UsIHRhZywgdHlwZUV4dGVuc2lvbikge1xuICAgIGlmIChuYW1lc3BhY2UgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICByZXR1cm4gY3JlYXRlRWxlbWVudCh0YWcsIHR5cGVFeHRlbnNpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZG9tQ3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgdGFnKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gY3JlYXRlRWxlbWVudCh0YWcsIHR5cGVFeHRlbnNpb24pIHtcbiAgICBpZiAodGFnKSB7XG4gICAgICB0YWcgPSB0YWcudG9Mb3dlckNhc2UoKTtcbiAgICB9XG4gICAgaWYgKHR5cGVFeHRlbnNpb24pIHtcbiAgICAgIHR5cGVFeHRlbnNpb24gPSB0eXBlRXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuICAgIHZhciBkZWZpbml0aW9uID0gZ2V0UmVnaXN0ZXJlZERlZmluaXRpb24odHlwZUV4dGVuc2lvbiB8fCB0YWcpO1xuICAgIGlmIChkZWZpbml0aW9uKSB7XG4gICAgICBpZiAodGFnID09IGRlZmluaXRpb24udGFnICYmIHR5cGVFeHRlbnNpb24gPT0gZGVmaW5pdGlvbi5pcykge1xuICAgICAgICByZXR1cm4gbmV3IGRlZmluaXRpb24uY3RvcigpO1xuICAgICAgfVxuICAgICAgaWYgKCF0eXBlRXh0ZW5zaW9uICYmICFkZWZpbml0aW9uLmlzKSB7XG4gICAgICAgIHJldHVybiBuZXcgZGVmaW5pdGlvbi5jdG9yKCk7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBlbGVtZW50O1xuICAgIGlmICh0eXBlRXh0ZW5zaW9uKSB7XG4gICAgICBlbGVtZW50ID0gY3JlYXRlRWxlbWVudCh0YWcpO1xuICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJpc1wiLCB0eXBlRXh0ZW5zaW9uKTtcbiAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbiAgICBlbGVtZW50ID0gZG9tQ3JlYXRlRWxlbWVudCh0YWcpO1xuICAgIGlmICh0YWcuaW5kZXhPZihcIi1cIikgPj0gMCkge1xuICAgICAgaW1wbGVtZW50UHJvdG90eXBlKGVsZW1lbnQsIEhUTUxFbGVtZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cbiAgdmFyIGRvbUNyZWF0ZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50LmJpbmQoZG9jdW1lbnQpO1xuICB2YXIgZG9tQ3JlYXRlRWxlbWVudE5TID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TLmJpbmQoZG9jdW1lbnQpO1xuICB2YXIgaXNJbnN0YW5jZTtcbiAgaWYgKCFPYmplY3QuX19wcm90b19fICYmICF1c2VOYXRpdmUpIHtcbiAgICBpc0luc3RhbmNlID0gZnVuY3Rpb24ob2JqLCBjdG9yKSB7XG4gICAgICBpZiAob2JqIGluc3RhbmNlb2YgY3Rvcikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHZhciBwID0gb2JqO1xuICAgICAgd2hpbGUgKHApIHtcbiAgICAgICAgaWYgKHAgPT09IGN0b3IucHJvdG90eXBlKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcCA9IHAuX19wcm90b19fO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgaXNJbnN0YW5jZSA9IGZ1bmN0aW9uKG9iaiwgYmFzZSkge1xuICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIGJhc2U7XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiB3cmFwRG9tTWV0aG9kVG9Gb3JjZVVwZ3JhZGUob2JqLCBtZXRob2ROYW1lKSB7XG4gICAgdmFyIG9yaWcgPSBvYmpbbWV0aG9kTmFtZV07XG4gICAgb2JqW21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbiA9IG9yaWcuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHVwZ3JhZGVBbGwobik7XG4gICAgICByZXR1cm4gbjtcbiAgICB9O1xuICB9XG4gIHdyYXBEb21NZXRob2RUb0ZvcmNlVXBncmFkZShOb2RlLnByb3RvdHlwZSwgXCJjbG9uZU5vZGVcIik7XG4gIHdyYXBEb21NZXRob2RUb0ZvcmNlVXBncmFkZShkb2N1bWVudCwgXCJpbXBvcnROb2RlXCIpO1xuICBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQgPSByZWdpc3RlcjtcbiAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCA9IGNyZWF0ZUVsZW1lbnQ7XG4gIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyA9IGNyZWF0ZUVsZW1lbnROUztcbiAgc2NvcGUucmVnaXN0cnkgPSByZWdpc3RyeTtcbiAgc2NvcGUuaW5zdGFuY2VvZiA9IGlzSW5zdGFuY2U7XG4gIHNjb3BlLnJlc2VydmVkVGFnTGlzdCA9IHJlc2VydmVkVGFnTGlzdDtcbiAgc2NvcGUuZ2V0UmVnaXN0ZXJlZERlZmluaXRpb24gPSBnZXRSZWdpc3RlcmVkRGVmaW5pdGlvbjtcbiAgZG9jdW1lbnQucmVnaXN0ZXIgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQ7XG59KTtcblxuKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciB1c2VOYXRpdmUgPSBzY29wZS51c2VOYXRpdmU7XG4gIHZhciBpbml0aWFsaXplTW9kdWxlcyA9IHNjb3BlLmluaXRpYWxpemVNb2R1bGVzO1xuICB2YXIgaXNJRSA9IHNjb3BlLmlzSUU7XG4gIGlmICh1c2VOYXRpdmUpIHtcbiAgICB2YXIgbm9wID0gZnVuY3Rpb24oKSB7fTtcbiAgICBzY29wZS53YXRjaFNoYWRvdyA9IG5vcDtcbiAgICBzY29wZS51cGdyYWRlID0gbm9wO1xuICAgIHNjb3BlLnVwZ3JhZGVBbGwgPSBub3A7XG4gICAgc2NvcGUudXBncmFkZURvY3VtZW50VHJlZSA9IG5vcDtcbiAgICBzY29wZS51cGdyYWRlU3VidHJlZSA9IG5vcDtcbiAgICBzY29wZS50YWtlUmVjb3JkcyA9IG5vcDtcbiAgICBzY29wZS5pbnN0YW5jZW9mID0gZnVuY3Rpb24ob2JqLCBiYXNlKSB7XG4gICAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgYmFzZTtcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIGluaXRpYWxpemVNb2R1bGVzKCk7XG4gIH1cbiAgdmFyIHVwZ3JhZGVEb2N1bWVudFRyZWUgPSBzY29wZS51cGdyYWRlRG9jdW1lbnRUcmVlO1xuICB2YXIgdXBncmFkZURvY3VtZW50ID0gc2NvcGUudXBncmFkZURvY3VtZW50O1xuICBpZiAoIXdpbmRvdy53cmFwKSB7XG4gICAgaWYgKHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCkge1xuICAgICAgd2luZG93LndyYXAgPSB3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwud3JhcElmTmVlZGVkO1xuICAgICAgd2luZG93LnVud3JhcCA9IHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbC51bndyYXBJZk5lZWRlZDtcbiAgICB9IGVsc2Uge1xuICAgICAgd2luZG93LndyYXAgPSB3aW5kb3cudW53cmFwID0gZnVuY3Rpb24obm9kZSkge1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgIH07XG4gICAgfVxuICB9XG4gIGlmICh3aW5kb3cuSFRNTEltcG9ydHMpIHtcbiAgICB3aW5kb3cuSFRNTEltcG9ydHMuX19pbXBvcnRzUGFyc2luZ0hvb2sgPSBmdW5jdGlvbihlbHQpIHtcbiAgICAgIGlmIChlbHQuaW1wb3J0KSB7XG4gICAgICAgIHVwZ3JhZGVEb2N1bWVudCh3cmFwKGVsdC5pbXBvcnQpKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIGJvb3RzdHJhcCgpIHtcbiAgICB1cGdyYWRlRG9jdW1lbnRUcmVlKHdpbmRvdy53cmFwKGRvY3VtZW50KSk7XG4gICAgd2luZG93LkN1c3RvbUVsZW1lbnRzLnJlYWR5ID0gdHJ1ZTtcbiAgICB2YXIgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCBmdW5jdGlvbihmKSB7XG4gICAgICBzZXRUaW1lb3V0KGYsIDE2KTtcbiAgICB9O1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHdpbmRvdy5DdXN0b21FbGVtZW50cy5yZWFkeVRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICBpZiAod2luZG93LkhUTUxJbXBvcnRzKSB7XG4gICAgICAgICAgd2luZG93LkN1c3RvbUVsZW1lbnRzLmVsYXBzZWQgPSB3aW5kb3cuQ3VzdG9tRWxlbWVudHMucmVhZHlUaW1lIC0gd2luZG93LkhUTUxJbXBvcnRzLnJlYWR5VGltZTtcbiAgICAgICAgfVxuICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcIldlYkNvbXBvbmVudHNSZWFkeVwiLCB7XG4gICAgICAgICAgYnViYmxlczogdHJ1ZVxuICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gXCJjb21wbGV0ZVwiIHx8IHNjb3BlLmZsYWdzLmVhZ2VyKSB7XG4gICAgYm9vdHN0cmFwKCk7XG4gIH0gZWxzZSBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gXCJpbnRlcmFjdGl2ZVwiICYmICF3aW5kb3cuYXR0YWNoRXZlbnQgJiYgKCF3aW5kb3cuSFRNTEltcG9ydHMgfHwgd2luZG93LkhUTUxJbXBvcnRzLnJlYWR5KSkge1xuICAgIGJvb3RzdHJhcCgpO1xuICB9IGVsc2Uge1xuICAgIHZhciBsb2FkRXZlbnQgPSB3aW5kb3cuSFRNTEltcG9ydHMgJiYgIXdpbmRvdy5IVE1MSW1wb3J0cy5yZWFkeSA/IFwiSFRNTEltcG9ydHNMb2FkZWRcIiA6IFwiRE9NQ29udGVudExvYWRlZFwiO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKGxvYWRFdmVudCwgYm9vdHN0cmFwKTtcbiAgfVxufSkod2luZG93LkN1c3RvbUVsZW1lbnRzKTsiLCIoZnVuY3Rpb24oc2VsZikge1xuICAndXNlIHN0cmljdCc7XG5cbiAgaWYgKHNlbGYuZmV0Y2gpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIHZhciBzdXBwb3J0ID0ge1xuICAgIHNlYXJjaFBhcmFtczogJ1VSTFNlYXJjaFBhcmFtcycgaW4gc2VsZixcbiAgICBpdGVyYWJsZTogJ1N5bWJvbCcgaW4gc2VsZiAmJiAnaXRlcmF0b3InIGluIFN5bWJvbCxcbiAgICBibG9iOiAnRmlsZVJlYWRlcicgaW4gc2VsZiAmJiAnQmxvYicgaW4gc2VsZiAmJiAoZnVuY3Rpb24oKSB7XG4gICAgICB0cnkge1xuICAgICAgICBuZXcgQmxvYigpXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfSkoKSxcbiAgICBmb3JtRGF0YTogJ0Zvcm1EYXRhJyBpbiBzZWxmLFxuICAgIGFycmF5QnVmZmVyOiAnQXJyYXlCdWZmZXInIGluIHNlbGZcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZU5hbWUobmFtZSkge1xuICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIG5hbWUgPSBTdHJpbmcobmFtZSlcbiAgICB9XG4gICAgaWYgKC9bXmEtejAtOVxcLSMkJSYnKisuXFxeX2B8fl0vaS50ZXN0KG5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGNoYXJhY3RlciBpbiBoZWFkZXIgZmllbGQgbmFtZScpXG4gICAgfVxuICAgIHJldHVybiBuYW1lLnRvTG93ZXJDYXNlKClcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZVZhbHVlKHZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHZhbHVlID0gU3RyaW5nKHZhbHVlKVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWVcbiAgfVxuXG4gIC8vIEJ1aWxkIGEgZGVzdHJ1Y3RpdmUgaXRlcmF0b3IgZm9yIHRoZSB2YWx1ZSBsaXN0XG4gIGZ1bmN0aW9uIGl0ZXJhdG9yRm9yKGl0ZW1zKSB7XG4gICAgdmFyIGl0ZXJhdG9yID0ge1xuICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IGl0ZW1zLnNoaWZ0KClcbiAgICAgICAgcmV0dXJuIHtkb25lOiB2YWx1ZSA9PT0gdW5kZWZpbmVkLCB2YWx1ZTogdmFsdWV9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN1cHBvcnQuaXRlcmFibGUpIHtcbiAgICAgIGl0ZXJhdG9yW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGl0ZXJhdG9yXG4gIH1cblxuICBmdW5jdGlvbiBIZWFkZXJzKGhlYWRlcnMpIHtcbiAgICB0aGlzLm1hcCA9IHt9XG5cbiAgICBpZiAoaGVhZGVycyBpbnN0YW5jZW9mIEhlYWRlcnMpIHtcbiAgICAgIGhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICB0aGlzLmFwcGVuZChuYW1lLCB2YWx1ZSlcbiAgICAgIH0sIHRoaXMpXG5cbiAgICB9IGVsc2UgaWYgKGhlYWRlcnMpIHtcbiAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGhlYWRlcnMpLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgICB0aGlzLmFwcGVuZChuYW1lLCBoZWFkZXJzW25hbWVdKVxuICAgICAgfSwgdGhpcylcbiAgICB9XG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgIG5hbWUgPSBub3JtYWxpemVOYW1lKG5hbWUpXG4gICAgdmFsdWUgPSBub3JtYWxpemVWYWx1ZSh2YWx1ZSlcbiAgICB2YXIgbGlzdCA9IHRoaXMubWFwW25hbWVdXG4gICAgaWYgKCFsaXN0KSB7XG4gICAgICBsaXN0ID0gW11cbiAgICAgIHRoaXMubWFwW25hbWVdID0gbGlzdFxuICAgIH1cbiAgICBsaXN0LnB1c2godmFsdWUpXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZVsnZGVsZXRlJ10gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgZGVsZXRlIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIHZhbHVlcyA9IHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldXG4gICAgcmV0dXJuIHZhbHVlcyA/IHZhbHVlc1swXSA6IG51bGxcbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmdldEFsbCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV0gfHwgW11cbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5tYXAuaGFzT3duUHJvcGVydHkobm9ybWFsaXplTmFtZShuYW1lKSlcbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV0gPSBbbm9ybWFsaXplVmFsdWUodmFsdWUpXVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGhpcy5tYXApLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgdGhpcy5tYXBbbmFtZV0uZm9yRWFjaChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHZhbHVlLCBuYW1lLCB0aGlzKVxuICAgICAgfSwgdGhpcylcbiAgICB9LCB0aGlzKVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpdGVtcyA9IFtdXG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7IGl0ZW1zLnB1c2gobmFtZSkgfSlcbiAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS52YWx1ZXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXRlbXMgPSBbXVxuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSkgeyBpdGVtcy5wdXNoKHZhbHVlKSB9KVxuICAgIHJldHVybiBpdGVyYXRvckZvcihpdGVtcylcbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmVudHJpZXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXRlbXMgPSBbXVxuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkgeyBpdGVtcy5wdXNoKFtuYW1lLCB2YWx1ZV0pIH0pXG4gICAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKVxuICB9XG5cbiAgaWYgKHN1cHBvcnQuaXRlcmFibGUpIHtcbiAgICBIZWFkZXJzLnByb3RvdHlwZVtTeW1ib2wuaXRlcmF0b3JdID0gSGVhZGVycy5wcm90b3R5cGUuZW50cmllc1xuICB9XG5cbiAgZnVuY3Rpb24gY29uc3VtZWQoYm9keSkge1xuICAgIGlmIChib2R5LmJvZHlVc2VkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IFR5cGVFcnJvcignQWxyZWFkeSByZWFkJykpXG4gICAgfVxuICAgIGJvZHkuYm9keVVzZWQgPSB0cnVlXG4gIH1cblxuICBmdW5jdGlvbiBmaWxlUmVhZGVyUmVhZHkocmVhZGVyKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKHJlYWRlci5yZXN1bHQpXG4gICAgICB9XG4gICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QocmVhZGVyLmVycm9yKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiByZWFkQmxvYkFzQXJyYXlCdWZmZXIoYmxvYikge1xuICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGJsb2IpXG4gICAgcmV0dXJuIGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpXG4gIH1cblxuICBmdW5jdGlvbiByZWFkQmxvYkFzVGV4dChibG9iKSB7XG4gICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcbiAgICByZWFkZXIucmVhZEFzVGV4dChibG9iKVxuICAgIHJldHVybiBmaWxlUmVhZGVyUmVhZHkocmVhZGVyKVxuICB9XG5cbiAgZnVuY3Rpb24gQm9keSgpIHtcbiAgICB0aGlzLmJvZHlVc2VkID0gZmFsc2VcblxuICAgIHRoaXMuX2luaXRCb2R5ID0gZnVuY3Rpb24oYm9keSkge1xuICAgICAgdGhpcy5fYm9keUluaXQgPSBib2R5XG4gICAgICBpZiAodHlwZW9mIGJvZHkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keVxuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmJsb2IgJiYgQmxvYi5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgICB0aGlzLl9ib2R5QmxvYiA9IGJvZHlcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5mb3JtRGF0YSAmJiBGb3JtRGF0YS5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgICB0aGlzLl9ib2R5Rm9ybURhdGEgPSBib2R5XG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuc2VhcmNoUGFyYW1zICYmIFVSTFNlYXJjaFBhcmFtcy5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgICB0aGlzLl9ib2R5VGV4dCA9IGJvZHkudG9TdHJpbmcoKVxuICAgICAgfSBlbHNlIGlmICghYm9keSkge1xuICAgICAgICB0aGlzLl9ib2R5VGV4dCA9ICcnXG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYXJyYXlCdWZmZXIgJiYgQXJyYXlCdWZmZXIucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgLy8gT25seSBzdXBwb3J0IEFycmF5QnVmZmVycyBmb3IgUE9TVCBtZXRob2QuXG4gICAgICAgIC8vIFJlY2VpdmluZyBBcnJheUJ1ZmZlcnMgaGFwcGVucyB2aWEgQmxvYnMsIGluc3RlYWQuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vuc3VwcG9ydGVkIEJvZHlJbml0IHR5cGUnKVxuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMuaGVhZGVycy5nZXQoJ2NvbnRlbnQtdHlwZScpKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYm9keSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KCdjb250ZW50LXR5cGUnLCAndGV4dC9wbGFpbjtjaGFyc2V0PVVURi04JylcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5QmxvYiAmJiB0aGlzLl9ib2R5QmxvYi50eXBlKSB7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzLnNldCgnY29udGVudC10eXBlJywgdGhpcy5fYm9keUJsb2IudHlwZSlcbiAgICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LnNlYXJjaFBhcmFtcyAmJiBVUkxTZWFyY2hQYXJhbXMucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KCdjb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkO2NoYXJzZXQ9VVRGLTgnKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN1cHBvcnQuYmxvYikge1xuICAgICAgdGhpcy5ibG9iID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpXG4gICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgIHJldHVybiByZWplY3RlZFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2JvZHlCbG9iKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5QmxvYilcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgYmxvYicpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgQmxvYihbdGhpcy5fYm9keVRleHRdKSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLmFycmF5QnVmZmVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmJsb2IoKS50aGVuKHJlYWRCbG9iQXNBcnJheUJ1ZmZlcilcbiAgICAgIH1cblxuICAgICAgdGhpcy50ZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpXG4gICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgIHJldHVybiByZWplY3RlZFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2JvZHlCbG9iKSB7XG4gICAgICAgICAgcmV0dXJuIHJlYWRCbG9iQXNUZXh0KHRoaXMuX2JvZHlCbG9iKVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlGb3JtRGF0YSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IHJlYWQgRm9ybURhdGEgYm9keSBhcyB0ZXh0JylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2JvZHlUZXh0KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudGV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKVxuICAgICAgICByZXR1cm4gcmVqZWN0ZWQgPyByZWplY3RlZCA6IFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5VGV4dClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3VwcG9ydC5mb3JtRGF0YSkge1xuICAgICAgdGhpcy5mb3JtRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50ZXh0KCkudGhlbihkZWNvZGUpXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5qc29uID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy50ZXh0KCkudGhlbihKU09OLnBhcnNlKVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvLyBIVFRQIG1ldGhvZHMgd2hvc2UgY2FwaXRhbGl6YXRpb24gc2hvdWxkIGJlIG5vcm1hbGl6ZWRcbiAgdmFyIG1ldGhvZHMgPSBbJ0RFTEVURScsICdHRVQnLCAnSEVBRCcsICdPUFRJT05TJywgJ1BPU1QnLCAnUFVUJ11cblxuICBmdW5jdGlvbiBub3JtYWxpemVNZXRob2QobWV0aG9kKSB7XG4gICAgdmFyIHVwY2FzZWQgPSBtZXRob2QudG9VcHBlckNhc2UoKVxuICAgIHJldHVybiAobWV0aG9kcy5pbmRleE9mKHVwY2FzZWQpID4gLTEpID8gdXBjYXNlZCA6IG1ldGhvZFxuICB9XG5cbiAgZnVuY3Rpb24gUmVxdWVzdChpbnB1dCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gICAgdmFyIGJvZHkgPSBvcHRpb25zLmJvZHlcbiAgICBpZiAoUmVxdWVzdC5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihpbnB1dCkpIHtcbiAgICAgIGlmIChpbnB1dC5ib2R5VXNlZCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBbHJlYWR5IHJlYWQnKVxuICAgICAgfVxuICAgICAgdGhpcy51cmwgPSBpbnB1dC51cmxcbiAgICAgIHRoaXMuY3JlZGVudGlhbHMgPSBpbnB1dC5jcmVkZW50aWFsc1xuICAgICAgaWYgKCFvcHRpb25zLmhlYWRlcnMpIHtcbiAgICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMoaW5wdXQuaGVhZGVycylcbiAgICAgIH1cbiAgICAgIHRoaXMubWV0aG9kID0gaW5wdXQubWV0aG9kXG4gICAgICB0aGlzLm1vZGUgPSBpbnB1dC5tb2RlXG4gICAgICBpZiAoIWJvZHkpIHtcbiAgICAgICAgYm9keSA9IGlucHV0Ll9ib2R5SW5pdFxuICAgICAgICBpbnB1dC5ib2R5VXNlZCA9IHRydWVcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy51cmwgPSBpbnB1dFxuICAgIH1cblxuICAgIHRoaXMuY3JlZGVudGlhbHMgPSBvcHRpb25zLmNyZWRlbnRpYWxzIHx8IHRoaXMuY3JlZGVudGlhbHMgfHwgJ29taXQnXG4gICAgaWYgKG9wdGlvbnMuaGVhZGVycyB8fCAhdGhpcy5oZWFkZXJzKSB7XG4gICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgSGVhZGVycyhvcHRpb25zLmhlYWRlcnMpXG4gICAgfVxuICAgIHRoaXMubWV0aG9kID0gbm9ybWFsaXplTWV0aG9kKG9wdGlvbnMubWV0aG9kIHx8IHRoaXMubWV0aG9kIHx8ICdHRVQnKVxuICAgIHRoaXMubW9kZSA9IG9wdGlvbnMubW9kZSB8fCB0aGlzLm1vZGUgfHwgbnVsbFxuICAgIHRoaXMucmVmZXJyZXIgPSBudWxsXG5cbiAgICBpZiAoKHRoaXMubWV0aG9kID09PSAnR0VUJyB8fCB0aGlzLm1ldGhvZCA9PT0gJ0hFQUQnKSAmJiBib2R5KSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdCb2R5IG5vdCBhbGxvd2VkIGZvciBHRVQgb3IgSEVBRCByZXF1ZXN0cycpXG4gICAgfVxuICAgIHRoaXMuX2luaXRCb2R5KGJvZHkpXG4gIH1cblxuICBSZXF1ZXN0LnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUmVxdWVzdCh0aGlzKVxuICB9XG5cbiAgZnVuY3Rpb24gZGVjb2RlKGJvZHkpIHtcbiAgICB2YXIgZm9ybSA9IG5ldyBGb3JtRGF0YSgpXG4gICAgYm9keS50cmltKCkuc3BsaXQoJyYnKS5mb3JFYWNoKGZ1bmN0aW9uKGJ5dGVzKSB7XG4gICAgICBpZiAoYnl0ZXMpIHtcbiAgICAgICAgdmFyIHNwbGl0ID0gYnl0ZXMuc3BsaXQoJz0nKVxuICAgICAgICB2YXIgbmFtZSA9IHNwbGl0LnNoaWZ0KCkucmVwbGFjZSgvXFwrL2csICcgJylcbiAgICAgICAgdmFyIHZhbHVlID0gc3BsaXQuam9pbignPScpLnJlcGxhY2UoL1xcKy9nLCAnICcpXG4gICAgICAgIGZvcm0uYXBwZW5kKGRlY29kZVVSSUNvbXBvbmVudChuYW1lKSwgZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKSlcbiAgICAgIH1cbiAgICB9KVxuICAgIHJldHVybiBmb3JtXG4gIH1cblxuICBmdW5jdGlvbiBoZWFkZXJzKHhocikge1xuICAgIHZhciBoZWFkID0gbmV3IEhlYWRlcnMoKVxuICAgIHZhciBwYWlycyA9ICh4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkgfHwgJycpLnRyaW0oKS5zcGxpdCgnXFxuJylcbiAgICBwYWlycy5mb3JFYWNoKGZ1bmN0aW9uKGhlYWRlcikge1xuICAgICAgdmFyIHNwbGl0ID0gaGVhZGVyLnRyaW0oKS5zcGxpdCgnOicpXG4gICAgICB2YXIga2V5ID0gc3BsaXQuc2hpZnQoKS50cmltKClcbiAgICAgIHZhciB2YWx1ZSA9IHNwbGl0LmpvaW4oJzonKS50cmltKClcbiAgICAgIGhlYWQuYXBwZW5kKGtleSwgdmFsdWUpXG4gICAgfSlcbiAgICByZXR1cm4gaGVhZFxuICB9XG5cbiAgQm9keS5jYWxsKFJlcXVlc3QucHJvdG90eXBlKVxuXG4gIGZ1bmN0aW9uIFJlc3BvbnNlKGJvZHlJbml0LCBvcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0ge31cbiAgICB9XG5cbiAgICB0aGlzLnR5cGUgPSAnZGVmYXVsdCdcbiAgICB0aGlzLnN0YXR1cyA9IG9wdGlvbnMuc3RhdHVzXG4gICAgdGhpcy5vayA9IHRoaXMuc3RhdHVzID49IDIwMCAmJiB0aGlzLnN0YXR1cyA8IDMwMFxuICAgIHRoaXMuc3RhdHVzVGV4dCA9IG9wdGlvbnMuc3RhdHVzVGV4dFxuICAgIHRoaXMuaGVhZGVycyA9IG9wdGlvbnMuaGVhZGVycyBpbnN0YW5jZW9mIEhlYWRlcnMgPyBvcHRpb25zLmhlYWRlcnMgOiBuZXcgSGVhZGVycyhvcHRpb25zLmhlYWRlcnMpXG4gICAgdGhpcy51cmwgPSBvcHRpb25zLnVybCB8fCAnJ1xuICAgIHRoaXMuX2luaXRCb2R5KGJvZHlJbml0KVxuICB9XG5cbiAgQm9keS5jYWxsKFJlc3BvbnNlLnByb3RvdHlwZSlcblxuICBSZXNwb25zZS5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKHRoaXMuX2JvZHlJbml0LCB7XG4gICAgICBzdGF0dXM6IHRoaXMuc3RhdHVzLFxuICAgICAgc3RhdHVzVGV4dDogdGhpcy5zdGF0dXNUZXh0LFxuICAgICAgaGVhZGVyczogbmV3IEhlYWRlcnModGhpcy5oZWFkZXJzKSxcbiAgICAgIHVybDogdGhpcy51cmxcbiAgICB9KVxuICB9XG5cbiAgUmVzcG9uc2UuZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UobnVsbCwge3N0YXR1czogMCwgc3RhdHVzVGV4dDogJyd9KVxuICAgIHJlc3BvbnNlLnR5cGUgPSAnZXJyb3InXG4gICAgcmV0dXJuIHJlc3BvbnNlXG4gIH1cblxuICB2YXIgcmVkaXJlY3RTdGF0dXNlcyA9IFszMDEsIDMwMiwgMzAzLCAzMDcsIDMwOF1cblxuICBSZXNwb25zZS5yZWRpcmVjdCA9IGZ1bmN0aW9uKHVybCwgc3RhdHVzKSB7XG4gICAgaWYgKHJlZGlyZWN0U3RhdHVzZXMuaW5kZXhPZihzdGF0dXMpID09PSAtMSkge1xuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0ludmFsaWQgc3RhdHVzIGNvZGUnKVxuICAgIH1cblxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UobnVsbCwge3N0YXR1czogc3RhdHVzLCBoZWFkZXJzOiB7bG9jYXRpb246IHVybH19KVxuICB9XG5cbiAgc2VsZi5IZWFkZXJzID0gSGVhZGVyc1xuICBzZWxmLlJlcXVlc3QgPSBSZXF1ZXN0XG4gIHNlbGYuUmVzcG9uc2UgPSBSZXNwb25zZVxuXG4gIHNlbGYuZmV0Y2ggPSBmdW5jdGlvbihpbnB1dCwgaW5pdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHZhciByZXF1ZXN0XG4gICAgICBpZiAoUmVxdWVzdC5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihpbnB1dCkgJiYgIWluaXQpIHtcbiAgICAgICAgcmVxdWVzdCA9IGlucHV0XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXF1ZXN0ID0gbmV3IFJlcXVlc3QoaW5wdXQsIGluaXQpXG4gICAgICB9XG5cbiAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKVxuXG4gICAgICBmdW5jdGlvbiByZXNwb25zZVVSTCgpIHtcbiAgICAgICAgaWYgKCdyZXNwb25zZVVSTCcgaW4geGhyKSB7XG4gICAgICAgICAgcmV0dXJuIHhoci5yZXNwb25zZVVSTFxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXZvaWQgc2VjdXJpdHkgd2FybmluZ3Mgb24gZ2V0UmVzcG9uc2VIZWFkZXIgd2hlbiBub3QgYWxsb3dlZCBieSBDT1JTXG4gICAgICAgIGlmICgvXlgtUmVxdWVzdC1VUkw6L20udGVzdCh4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkpKSB7XG4gICAgICAgICAgcmV0dXJuIHhoci5nZXRSZXNwb25zZUhlYWRlcignWC1SZXF1ZXN0LVVSTCcpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICBzdGF0dXM6IHhoci5zdGF0dXMsXG4gICAgICAgICAgc3RhdHVzVGV4dDogeGhyLnN0YXR1c1RleHQsXG4gICAgICAgICAgaGVhZGVyczogaGVhZGVycyh4aHIpLFxuICAgICAgICAgIHVybDogcmVzcG9uc2VVUkwoKVxuICAgICAgICB9XG4gICAgICAgIHZhciBib2R5ID0gJ3Jlc3BvbnNlJyBpbiB4aHIgPyB4aHIucmVzcG9uc2UgOiB4aHIucmVzcG9uc2VUZXh0XG4gICAgICAgIHJlc29sdmUobmV3IFJlc3BvbnNlKGJvZHksIG9wdGlvbnMpKVxuICAgICAgfVxuXG4gICAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QobmV3IFR5cGVFcnJvcignTmV0d29yayByZXF1ZXN0IGZhaWxlZCcpKVxuICAgICAgfVxuXG4gICAgICB4aHIub250aW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChuZXcgVHlwZUVycm9yKCdOZXR3b3JrIHJlcXVlc3QgZmFpbGVkJykpXG4gICAgICB9XG5cbiAgICAgIHhoci5vcGVuKHJlcXVlc3QubWV0aG9kLCByZXF1ZXN0LnVybCwgdHJ1ZSlcblxuICAgICAgaWYgKHJlcXVlc3QuY3JlZGVudGlhbHMgPT09ICdpbmNsdWRlJykge1xuICAgICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gdHJ1ZVxuICAgICAgfVxuXG4gICAgICBpZiAoJ3Jlc3BvbnNlVHlwZScgaW4geGhyICYmIHN1cHBvcnQuYmxvYikge1xuICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2Jsb2InXG4gICAgICB9XG5cbiAgICAgIHJlcXVlc3QuaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKG5hbWUsIHZhbHVlKVxuICAgICAgfSlcblxuICAgICAgeGhyLnNlbmQodHlwZW9mIHJlcXVlc3QuX2JvZHlJbml0ID09PSAndW5kZWZpbmVkJyA/IG51bGwgOiByZXF1ZXN0Ll9ib2R5SW5pdClcbiAgICB9KVxuICB9XG4gIHNlbGYuZmV0Y2gucG9seWZpbGwgPSB0cnVlXG59KSh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcgPyBzZWxmIDogdGhpcyk7XG4iLCIvKipcbiAqIEFnZ3JlZ2F0ZSB2YWx1ZXMgZnJvbSBkb20gdHJlZVxuICovXG5jbGFzcyBBZ2dyZWdhdG9yIHtcbiAgY29uc3RydWN0b3IoZWxlbWVudCkge1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gIH1cblxuICBhZ2dyZWdhdGUoc2NvcGUpIHtcbiAgICBjb25zdCBlbGVtcyA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdpbnB1dCxzZWxlY3QsdGV4dGFyZWEnKTtcbiAgICBmb3IgKGxldCBpPTAsIGw9ZWxlbXMubGVuZ3RoOyBpPGw7ICsraSkge1xuICAgICAgY29uc3QgZWxlbSA9IGVsZW1zW2ldO1xuICAgICAgY29uc3QgbW9kZWxOYW1lID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3NqLW1vZGVsJyk7XG4gICAgICBpZiAobW9kZWxOYW1lICYmIG1vZGVsTmFtZS5zdWJzdHIoMCw1KSA9PT0gJ3RoaXMuJykge1xuICAgICAgICBjb25zdCB2YWwgPSBlbGVtLnR5cGUgPT09ICdjaGVja2JveCcgPyBlbGVtLmNoZWNrZWQgOiBlbGVtLnZhbHVlO1xuICAgICAgICBuZXcgRnVuY3Rpb24oJyR2YWwnLCBgaWYgKCEke21vZGVsTmFtZX0pIHsgJHttb2RlbE5hbWV9PSR2YWw7IH1gKS5hcHBseShzY29wZSwgW3ZhbF0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFnZ3JlZ2F0b3I7XG5cbiIsImNvbnN0IENvbXBpbGVyID0gcmVxdWlyZSgnLi9jb21waWxlci5qcycpO1xuY29uc3QgQWdncmVnYXRvciA9IHJlcXVpcmUoJy4vYWdncmVnYXRvci5qcycpO1xuY29uc3QgSW5jcmVtZW50YWxET00gPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20vZGlzdC9pbmNyZW1lbnRhbC1kb20uanMnKTtcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsICgpID0+IHtcbiAgY29uc3QgZWxlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbc2otYXBwXScpO1xuICBmb3IgKGxldCBpPTAsIGw9ZWxlbXMubGVuZ3RoOyBpPGw7ICsraSkge1xuICAgIGNvbnN0IGVsZW0gPSBlbGVtc1tpXTtcblxuICAgIGNvbnN0IHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgIC8vIGNvcHkgYXR0cmlidXRlc1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBlbGVtLmF0dHJpYnV0ZXM7XG4gICAgZm9yIChsZXQgaT0wLCBsPWF0dHJpYnV0ZXMubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgY29uc3QgYXR0ciA9IGF0dHJpYnV0ZXNbaV07XG4gICAgICB0ZW1wbGF0ZS5zZXRBdHRyaWJ1dGUoYXR0ci5uYW1lLCBhdHRyLnZhbHVlKTtcbiAgICB9XG5cbiAgICBuZXcgQWdncmVnYXRvcihlbGVtKS5hZ2dyZWdhdGUodGVtcGxhdGUpO1xuICAgIGNvbnN0IGNvbXBpbGVkID0gbmV3IENvbXBpbGVyKCkuY29tcGlsZShlbGVtKTtcbiAgICB0ZW1wbGF0ZS51cGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBJbmNyZW1lbnRhbERPTS5wYXRjaCh0aGlzLCAoKSA9PiB7XG4gICAgICAgIGNvbXBpbGVkLmFwcGx5KHRoaXMsIFtJbmNyZW1lbnRhbERPTV0pO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNvbnN0IGFwcCA9IGVsZW0uZ2V0QXR0cmlidXRlKCdzai1hcHAnKTtcbiAgICBjb25zdCByZXBsYWNlZCA9IGVsZW0ucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQodGVtcGxhdGUsIGVsZW0pO1xuICAgIGlmIChhcHApIHsgLy8gTm90ZS4gc2ogYWxsb3dzIHNqLWFwcD1cIlwiIGZvciBkZW1vIGFwcC5cbiAgICAgIGNvbnN0IGZ1bmMgPSB3aW5kb3dbYXBwXTtcbiAgICAgIGlmIChmdW5jKSB7XG4gICAgICAgIGZ1bmMuYXBwbHkodGVtcGxhdGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgYFVua25vd24gZnVuY3Rpb24gJyR7YXBwfScsIHNwZWNlZmllZCBieSBzai1hcHBgO1xuICAgICAgfVxuICAgIH1cbiAgICB0ZW1wbGF0ZS51cGRhdGUoKTtcbiAgfVxufSk7XG5cbiIsImNvbnN0IEluY3JlbWVudGFsRE9NID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tL2Rpc3QvaW5jcmVtZW50YWwtZG9tLmpzJyk7XG5jb25zdCBzY2FuID0gcmVxdWlyZSgnLi90ZXh0LWV4cHJlc3Npb24tc2Nhbm5lci5qcycpO1xuY29uc3QgYXNzZXJ0ID0gdmFsID0+IHsgfTtcblxuLy8gaGFja1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL2dvb2dsZS9pbmNyZW1lbnRhbC1kb20vaXNzdWVzLzIzOVxuSW5jcmVtZW50YWxET00uYXR0cmlidXRlcy52YWx1ZSA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgZWwudmFsdWUgPSB2YWx1ZVxufTtcblxuY29uc3Qgc2pfYXR0cjJldmVudCA9IHtcbiAgJ3NqLWNsaWNrJzogJ29uY2xpY2snLFxuICAnc2otYmx1cic6ICdvbmJsdXInLFxuICAnc2otY2hlY2tlZCc6ICdvbmNoZWNrZWQnLFxuICAnc2otZGJsY2xpY2snOiAnb25kYmxjbGljaycsXG4gICdzai1mb2N1cyc6ICdvbmZvY3VzJyxcbiAgJ3NqLWtleWRvd24nOiAnb25rZXlkb3duJyxcbiAgJ3NqLWtleXByZXNzJzogJ29ua2V5cHJlc3MnLFxuICAnc2ota2V5dXAnOiAnb25rZXl1cCcsXG4gICdzai1tb3VzZWRvd24nOiAnb25tb3VzZWRvd24nLFxuICAnc2otbW91c2VlbnRlcic6ICdvbm1vdXNlZW50ZXInLFxuICAnc2otbW91c2VsZWF2ZSc6ICdvbm1vdXNlbGVhdmUnLFxuICAnc2otbW91c2Vtb3ZlJzogJ29ubW91c2Vtb3ZlJyxcbiAgJ3NqLW1vdXNlb3Zlcic6ICdvbm1vdXNlb3ZlcicsXG4gICdzai1tb3VzZXVwJzogJ29ubW91c2V1cCcsXG4gICdzai1wYXN0ZSc6ICdvbnBhc3RlJyxcbiAgJ3NqLXNlbGVjdGVkJzogJ29uc2VsZWN0ZWQnLFxuICAnc2otY2hhbmdlJzogJ29uY2hhbmdlJyxcbiAgJ3NqLXN1Ym1pdCc6ICdvbnN1Ym1pdCdcbn07XG5cbmNvbnN0IHNqX2Jvb2xlYW5fYXR0cmlidXRlcyA9IHtcbiAgJ3NqLWRpc2FibGVkJzogJ2Rpc2FibGVkJyxcbiAgJ3NqLXJlcXVpcmVkJzogJ3JlcXVpcmVkJyxcbiAgJ3NqLWNoZWNrZWQnOiAnY2hlY2tlZCdcbn07XG5cbmNsYXNzIENvbXBpbGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgYXNzZXJ0KGFyZ3VtZW50cy5sZW5ndGggPT09IDApO1xuICB9XG5cbiAgY29tcGlsZSh0ZW1wbGF0ZUVsZW1lbnQpIHtcbiAgICBjb25zdCBjaGlsZHJlbiA9IHRlbXBsYXRlRWxlbWVudC5jaGlsZE5vZGVzO1xuICAgIGxldCBjb2RlID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgY29kZSA9IGNvZGUuY29uY2F0KHRoaXMucmVuZGVyRE9NKGNoaWxkcmVuW2ldLCBbXSkpO1xuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhjb2RlLmpvaW4oXCI7XFxuXCIpKTtcbiAgICByZXR1cm4gbmV3IEZ1bmN0aW9uKCdJbmNyZW1lbnRhbERPTScsIGNvZGUuam9pbihcIjtcXG5cIikpO1xuICB9XG5cbiAgcmVuZGVyRE9NKGVsZW0sIHZhcnMpIHtcbiAgICBhc3NlcnQoZWxlbSk7XG4gICAgYXNzZXJ0KHZhcnMpO1xuICAgIGlmIChlbGVtLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuICAgICAgcmV0dXJuIGBJbmNyZW1lbnRhbERPTS50ZXh0KCR7dGhpcy50ZXh0KGVsZW0udGV4dENvbnRlbnQpfSlgO1xuICAgIH0gZWxzZSBpZiAoZWxlbS5ub2RlVHlwZSA9PT0gTm9kZS5DT01NRU5UX05PREUpIHtcbiAgICAgIC8vIElnbm9yZSBjb21tZW50IG5vZGVcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkZXJzID0gW107XG4gICAgY29uc3QgZm9vdGVycyA9IFtdO1xuICAgIHZhciBib2R5ID0gW107XG5cbiAgICAvLyBwcm9jZXNzIGBzai1pZmBcbiAgICB7XG4gICAgICBjb25zdCBjb25kID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3NqLWlmJyk7XG4gICAgICBpZiAoY29uZCkge1xuICAgICAgICBoZWFkZXJzLnB1c2goYGlmICgke2NvbmR9KSB7YCk7XG4gICAgICAgIGZvb3RlcnMucHVzaChgfWApO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHByb2Nlc3MgYHNqLXJlcGVhdGBcbiAgICB7XG4gICAgICBjb25zdCBjb25kID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3NqLXJlcGVhdCcpO1xuICAgICAgaWYgKGNvbmQpIHtcbiAgICAgICAgY29uc3QgbSA9IGNvbmQubWF0Y2goL15cXHMqKD86KFxcdyspfFxcKFxccyooXFx3KylcXHMqLFxccyooXFx3KylcXHMqXFwpKVxccytpblxccysoW2Etel1bYS16MC05Ll0qKVxccyokLyk7XG4gICAgICAgIGlmICghbSkge1xuICAgICAgICAgIHRocm93IGBJbnZhbGlkIHNqLXJlcGVhdCB2YWx1ZTogJHtjb25kfWA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobVsxXSkge1xuICAgICAgICAgIGNvbnN0IHZhck5hbWUgPSBtWzFdO1xuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IG1bNF07XG5cbiAgICAgICAgICBoZWFkZXJzLnB1c2goYChmdW5jdGlvbihJbmNyZW1lbnRhbERPTSkge1xcbnZhciAkJGNvbnRhaW5lcj0ke2NvbnRhaW5lcn07XFxuZm9yICh2YXIgJGluZGV4PTAsJGw9JCRjb250YWluZXIubGVuZ3RoOyAkaW5kZXg8JGw7ICRpbmRleCsrKSB7XFxudmFyICR7dmFyTmFtZX09JCRjb250YWluZXJbJGluZGV4XTtgKTtcbiAgICAgICAgICBmb290ZXJzLnB1c2goYH1cXG59KS5hcHBseSh0aGlzLCBbSW5jcmVtZW50YWxET01dKTtgKTtcblxuICAgICAgICAgIHZhcnMgPSB2YXJzLmNvbmNhdChbdmFyTmFtZSwgJyRpbmRleCddKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBrZXlOYW1lID0gbVsyXTtcbiAgICAgICAgICBjb25zdCB2YWx1ZU5hbWUgPSBtWzNdO1xuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IG1bNF07XG4gICAgICAgICAgaGVhZGVycy5wdXNoKGAoZnVuY3Rpb24oSW5jcmVtZW50YWxET00pIHtcXG4kJGNvbnRhaW5lcj0ke2NvbnRhaW5lcn07Zm9yICh2YXIgJHtrZXlOYW1lfSBpbiAkJGNvbnRhaW5lcikge1xcbnZhciAke3ZhbHVlTmFtZX09JCRjb250YWluZXJbJHtrZXlOYW1lfV07YCk7XG4gICAgICAgICAgZm9vdGVycy5wdXNoKGB9XFxufSkuYXBwbHkodGhpcywgW0luY3JlbWVudGFsRE9NXSk7YCk7XG4gICAgICAgICAgdmFycyA9IHZhcnMuY29uY2F0KFtrZXlOYW1lLCB2YWx1ZU5hbWVdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHRhZ05hbWUgPSBlbGVtLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcblxuICAgIC8vIHByb2Nlc3MgYXR0cmlidXRlc1xuICAgIGJvZHkucHVzaChgSW5jcmVtZW50YWxET00uZWxlbWVudE9wZW5TdGFydChcIiR7dGFnTmFtZX1cIilgKTtcbiAgICBib2R5ID0gYm9keS5jb25jYXQodGhpcy5yZW5kZXJBdHRyaWJ1dGVzKGVsZW0sIHZhcnMpKTtcbiAgICBib2R5LnB1c2goYEluY3JlbWVudGFsRE9NLmVsZW1lbnRPcGVuRW5kKFwiJHt0YWdOYW1lfVwiKWApO1xuXG4gICAgY29uc3QgYmluZCA9IGVsZW0uZ2V0QXR0cmlidXRlKCdzai1iaW5kJyk7XG4gICAgaWYgKHRhZ05hbWUuaW5kZXhPZignLScpID49IDApIHtcbiAgICAgIGJvZHkucHVzaChgSW5jcmVtZW50YWxET00uc2tpcCgpYCk7XG4gICAgfSBlbHNlIGlmIChiaW5kKSB7XG4gICAgICBib2R5LnB1c2goYEluY3JlbWVudGFsRE9NLnRleHQoJHtiaW5kfSk7YCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGNoaWxkcmVuID0gZWxlbS5jaGlsZE5vZGVzO1xuICAgICAgZm9yIChsZXQgaSA9IDAsIGwgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICBpZiAoY2hpbGQubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFKSB7XG4gICAgICAgIC8vIHJlcGxhY2VWYXJpYWJsZXNcbiAgICAgICAgYm9keS5wdXNoKGBJbmNyZW1lbnRhbERPTS50ZXh0KCR7dGhpcy50ZXh0KGNoaWxkLnRleHRDb250ZW50KX0pYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBib2R5ID0gYm9keS5jb25jYXQodGhpcy5yZW5kZXJET00oY2hpbGQsIHZhcnMpKTtcbiAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgYm9keS5wdXNoKGBJbmNyZW1lbnRhbERPTS5lbGVtZW50Q2xvc2UoXCIke3RhZ05hbWV9XCIpYCk7XG5cbiAgICBjb25zdCByZXR2YWwgPSBbJzsnXS5jb25jYXQoaGVhZGVycykuY29uY2F0KGJvZHkpLmNvbmNhdChmb290ZXJzKTtcbiAgICAvLyBjb25zb2xlLmxvZyhgRE9ORSByZW5kZXJET00gJHtKU09OLnN0cmluZ2lmeShyZXR2YWwpfWApO1xuICAgIHJldHVybiByZXR2YWw7XG4gIH1cblxuICByZW5kZXJBdHRyaWJ1dGVzKGVsZW0sIHZhcnMpIHtcbiAgICBhc3NlcnQodmFycyk7XG4gICAgY29uc3QgYXR0cnMgPSBlbGVtLmF0dHJpYnV0ZXM7XG4gICAgY29uc3QgY29kZUxpc3QgPSBbXTtcbiAgICBjb25zdCBtb2RlbCA9IGVsZW0uZ2V0QXR0cmlidXRlKCdzai1tb2RlbCcpO1xuICAgIGNvbnN0IGV2ZW50cyA9IHt9O1xuICAgIGZvciAobGV0IGkgPSAwLCBsID0gYXR0cnMubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgICBjb25zdCBhdHRyID0gYXR0cnNbaV07XG4gICAgICBjb25zdCBjb2RlID0gdGhpcy5yZW5kZXJBdHRyaWJ1dGUoZWxlbSwgYXR0cnNbaV0sIHZhcnMsIGV2ZW50cyk7XG4gICAgICBjb2RlTGlzdC5wdXNoKGNvZGUpO1xuICAgIH1cblxuICAgIGNvbnN0IG5vcm1hbEV2ZW50cyA9IFtcbiAgICAgICdvbmNsaWNrJyxcbiAgICAgICdvbmJsdXInLFxuICAgICAgJ29uY2hlY2tlZCcsXG4gICAgICAnb25kYmxjbGljaycsXG4gICAgICAnb25mb2N1cycsXG4gICAgICAnb25rZXlkb3duJyxcbiAgICAgICdvbmtleXByZXNzJyxcbiAgICAgICdvbmtleXVwJyxcbiAgICAgICdvbm1vdXNlZG93bicsXG4gICAgICAnb25tb3VzZWVudGVyJyxcbiAgICAgICdvbm1vdXNlbGVhdmUnLFxuICAgICAgJ29ubW91c2Vtb3ZlJyxcbiAgICAgICdvbm1vdXNlb3ZlcicsXG4gICAgICAnb25tb3VzZXVwJyxcbiAgICAgICdvbnBhc3RlJyxcbiAgICAgICdvbnNlbGVjdGVkJyxcbiAgICAgICdvbnN1Ym1pdCdcbiAgICBdO1xuICAgIGlmIChtb2RlbCkge1xuICAgICAgaWYgKGVsZW0udHlwZSA9PT0gJ2NoZWNrYm94JyB8fCBlbGVtLnR5cGUgPT09ICdyYWRpbycpIHtcbiAgICAgICAgbm9ybWFsRXZlbnRzLnB1c2goJ29uaW5wdXQnKTtcbiAgICAgICAgY29uc3QgY29kZSA9IGV2ZW50c1snb25jaGFuZ2UnXSB8fCAnJztcbiAgICAgICAgY29kZUxpc3QucHVzaChgXG4gICAgICAgICAgaWYgKCR7bW9kZWx9KSB7XG4gICAgICAgICAgICBJbmNyZW1lbnRhbERPTS5hdHRyKFwiY2hlY2tlZFwiLCAnY2hlY2tlZCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBJbmNyZW1lbnRhbERPTS5hdHRyKFwib25jaGFuZ2VcIiwgZnVuY3Rpb24gKCR7dmFycy5jb25jYXQoWyckZXZlbnQnXSkuam9pbihcIixcIil9KSB7XG4gICAgICAgICAgICAke21vZGVsfSA9ICRldmVudC50YXJnZXQuY2hlY2tlZDtcbiAgICAgICAgICAgICR7Y29kZX07XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgICAgIH0uYmluZCgke1sndGhpcyddLmNvbmNhdCh2YXJzKS5qb2luKFwiLFwiKX0pKTtcbiAgICAgICAgYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBub3JtYWxFdmVudHMucHVzaCgnb25jaGFuZ2UnKTtcbiAgICAgICAgY29uc3QgY29kZSA9IGV2ZW50c1snb25pbnB1dCddIHx8ICcnO1xuICAgICAgICBjb2RlTGlzdC5wdXNoKGBcbiAgICAgICAgICBJbmNyZW1lbnRhbERPTS5hdHRyKFwidmFsdWVcIiwgJHttb2RlbH0pO1xuICAgICAgICAgIEluY3JlbWVudGFsRE9NLmF0dHIoXCJvbmlucHV0XCIsIGZ1bmN0aW9uICgke3ZhcnMuY29uY2F0KFsnJGV2ZW50J10pLmpvaW4oXCIsXCIpfSkge1xuICAgICAgICAgICAgJHttb2RlbH0gPSAkZXZlbnQudGFyZ2V0LnZhbHVlO1xuICAgICAgICAgICAgJHtjb2RlfTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICAgICAgfS5iaW5kKCR7Wyd0aGlzJ10uY29uY2F0KHZhcnMpLmpvaW4oXCIsXCIpfSkpO1xuICAgICAgICBgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChsZXQgaT0wLCBsPW5vcm1hbEV2ZW50cy5sZW5ndGg7IGk8bDsgaSsrKSB7XG4gICAgICBjb25zdCBldmVudE5hbWUgPSBub3JtYWxFdmVudHNbaV07XG4gICAgICBjb25zdCBleHByZXNzaW9uID0gZXZlbnRzW2V2ZW50TmFtZV07XG4gICAgICBpZiAoZXhwcmVzc2lvbikge1xuICAgICAgICBjb2RlTGlzdC5wdXNoKGA7XG4gICAgICAgIEluY3JlbWVudGFsRE9NLmF0dHIoXCIke2V2ZW50TmFtZX1cIiwgZnVuY3Rpb24gKCR7dmFycy5jb25jYXQoWyckZXZlbnQnXSkuam9pbihcIixcIil9KSB7XG4gICAgICAgICAgJHtleHByZXNzaW9ufTtcbiAgICAgICAgfS5iaW5kKCR7Wyd0aGlzJ10uY29uY2F0KHZhcnMpLmpvaW4oXCIsXCIpfSkpO2ApO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKGBET05FIHJlbmRlckF0dHJpYnV0ZXMgJHtKU09OLnN0cmluZ2lmeShjb2RlTGlzdCl9YCk7XG4gICAgcmV0dXJuIGNvZGVMaXN0O1xuICB9XG5cbiAgcmVuZGVyQXR0cmlidXRlKGVsZW0sIGF0dHIsIHZhcnMsIGV2ZW50cykge1xuICAgIGFzc2VydCh2YXJzKTtcbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyQXR0cmlidXRlOiAke2F0dHIubmFtZX09JHthdHRyLnZhbHVlfWApO1xuXG4gICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyLm5hbWU7XG4gICAgaWYgKGF0dHJOYW1lLnN1YnN0cigwLDMpID09PSAnc2otJykge1xuICAgICAgY29uc3QgZXZlbnQgPSBzal9hdHRyMmV2ZW50W2F0dHJOYW1lXTtcbiAgICAgIGlmIChldmVudCkge1xuICAgICAgICBjb25zdCBleHByZXNzaW9uID0gYXR0ci52YWx1ZTtcbiAgICAgICAgZXZlbnRzW2V2ZW50XSA9IGV4cHJlc3Npb247XG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIH0gZWxzZSBpZiAoc2pfYm9vbGVhbl9hdHRyaWJ1dGVzW2F0dHIubmFtZV0pIHtcbiAgICAgICAgY29uc3QgYXR0cmlidXRlID0gc2pfYm9vbGVhbl9hdHRyaWJ1dGVzW2F0dHIubmFtZV07XG4gICAgICAgIGNvbnN0IGV4cHJlc3Npb24gPSBhdHRyLnZhbHVlO1xuICAgICAgICByZXR1cm4gYGlmICgke2V4cHJlc3Npb259KSB7IEluY3JlbWVudGFsRE9NLmF0dHIoXCIke2F0dHJpYnV0ZX1cIiwgXCIke2F0dHJpYnV0ZX1cIik7IH1gO1xuICAgICAgfSBlbHNlIGlmIChhdHRyLm5hbWUgPT09ICdzai1jbGFzcycpIHtcbiAgICAgICAgcmV0dXJuIGBJbmNyZW1lbnRhbERPTS5hdHRyKFwiY2xhc3NcIiwgJHthdHRyLnZhbHVlfS5qb2luKFwiIFwiKSk7YDtcbiAgICAgIH0gZWxzZSBpZiAoYXR0ci5uYW1lID09PSAnc2otaHJlZicpIHtcbiAgICAgICAgcmV0dXJuIGBJbmNyZW1lbnRhbERPTS5hdHRyKFwiaHJlZlwiLCAke2F0dHIudmFsdWV9LnJlcGxhY2UoL15bXjpdKz86LywgZnVuY3Rpb24gKHNjaGVtZSkgeyByZXR1cm4gKHNjaGVtZSA9PT0gJ2h0dHA6JyB8fCBzY2hlbWUgPT09ICdodHRwczovLycpID8gc2NoZW1lIDogJ3Vuc2FmZTonICsgc2NoZW1lIH0pKTtgO1xuICAgICAgfSBlbHNlIGlmIChhdHRyLm5hbWUuc3Vic3RyKDAsOCkgPT09ICdzai1hdHRyLScpIHtcbiAgICAgICAgcmV0dXJuIGBJbmNyZW1lbnRhbERPTS5hdHRyKCR7SlNPTi5zdHJpbmdpZnkoYXR0ci5uYW1lLnN1YnN0cig4KSl9LCAke2F0dHIudmFsdWV9KTtgO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYEluY3JlbWVudGFsRE9NLmF0dHIoXCIke2F0dHIubmFtZX1cIiwgJHt0aGlzLnRleHQoYXR0ci52YWx1ZSl9KTtgO1xuICAgIH1cbiAgfVxuXG4gIHRleHQocykge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShzKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBpbGVyO1xuXG4iLCJjb25zdCBDb21waWxlciA9IHJlcXVpcmUoJy4vY29tcGlsZXIuanMnKTtcbmNvbnN0IEFnZ3JlZ2F0b3IgPSByZXF1aXJlKCcuL2FnZ3JlZ2F0b3IuanMnKTtcbmNvbnN0IEluY3JlbWVudGFsRE9NID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tL2Rpc3QvaW5jcmVtZW50YWwtZG9tLmpzJyk7XG5cbi8vIGJhYmVsIGhhY2tzXG4vLyBTZWUgaHR0cHM6Ly9waGFicmljYXRvci5iYWJlbGpzLmlvL1QxNTQ4XG5pZiAodHlwZW9mIEhUTUxFbGVtZW50ICE9PSAnZnVuY3Rpb24nKSB7XG4gIHZhciBfSFRNTEVsZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gIH07XG4gIF9IVE1MRWxlbWVudC5wcm90b3R5cGUgPSBIVE1MRWxlbWVudC5wcm90b3R5cGU7XG4gIEhUTUxFbGVtZW50ID0gX0hUTUxFbGVtZW50O1xufVxuXG5jbGFzcyBFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgLy8gcGFyc2UgdGVtcGxhdGVcbiAgICB2YXIgdGVtcGxhdGUgPSB0aGlzLnRlbXBsYXRlKCk7XG4gICAgaWYgKCF0ZW1wbGF0ZSkge1xuICAgICAgdGhyb3cgYHRlbXBsYXRlIHNob3VsZG4ndCBiZSBudWxsYDtcbiAgICB9XG5cbiAgICBjb25zdCBodG1sID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBodG1sLmlubmVySFRNTCA9IHRlbXBsYXRlO1xuXG4gICAgdGhpcy5wcmVwYXJlKCk7XG5cbiAgICAvLyBUT0RPIGNhY2hlIHJlc3VsdCBhcyBjbGFzcyB2YXJpYWJsZS5cbiAgICBuZXcgQWdncmVnYXRvcihodG1sKS5hZ2dyZWdhdGUodGhpcyk7XG4gICAgdGhpcy5jb21waWxlZCA9IG5ldyBDb21waWxlcigpLmNvbXBpbGUoaHRtbCk7XG5cbiAgICB0aGlzLmluaXRpYWxpemUoKTtcblxuICAgIHRoaXMudXBkYXRlKCk7XG4gIH1cblxuICB0ZW1wbGF0ZSgpIHtcbiAgICB0aHJvdyBcIlBsZWFzZSBpbXBsZW1lbnQgJ3RlbXBsYXRlJyBtZXRob2RcIjtcbiAgfVxuXG4gIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhrZXkpIHtcbiAgICB0aGlzW2tleV0gPSB0aGlzLmdldEF0dHJpYnV0ZShrZXkpO1xuICAgIHRoaXMudXBkYXRlKCk7XG4gIH1cblxuICBwcmVwYXJlKCkge1xuICAgIC8vIG5vcC4gYWJzdHJhY3QgbWV0aG9kLlxuICB9XG5cbiAgaW5pdGlhbGl6ZSgpIHtcbiAgICAvLyBub3AuIGFic3RyYWN0IG1ldGhvZC5cbiAgfVxuXG4gIHVwZGF0ZSgpIHtcbiAgICBJbmNyZW1lbnRhbERPTS5wYXRjaCh0aGlzLCAoKSA9PiB7XG4gICAgICB0aGlzLmNvbXBpbGVkLmFwcGx5KHRoaXMsIFtJbmNyZW1lbnRhbERPTV0pO1xuICAgIH0pO1xuICB9XG5cbiAgZHVtcCgpIHtcbiAgICBjb25zdCBzY29wZSA9IHt9O1xuICAgIE9iamVjdC5rZXlzKHRoaXMpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIGlmIChrZXkgIT09ICdyZW5kZXJlcicpIHtcbiAgICAgICAgc2NvcGVba2V5XSA9IHRoaXNba2V5XTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gc2NvcGU7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFbGVtZW50O1xuXG4iLCIvLyBwb2x5ZmlsbFxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0N1c3RvbUV2ZW50L0N1c3RvbUV2ZW50XG4oZnVuY3Rpb24gKCkge1xuICBpZiAoIHR5cGVvZiB3aW5kb3cuQ3VzdG9tRXZlbnQgPT09IFwiZnVuY3Rpb25cIiApIHJldHVybiBmYWxzZTtcblxuICBmdW5jdGlvbiBDdXN0b21FdmVudCAoIGV2ZW50LCBwYXJhbXMgKSB7XG4gICAgcGFyYW1zID0gcGFyYW1zIHx8IHsgYnViYmxlczogZmFsc2UsIGNhbmNlbGFibGU6IGZhbHNlLCBkZXRhaWw6IHVuZGVmaW5lZCB9O1xuICAgIHZhciBldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCggJ0N1c3RvbUV2ZW50JyApO1xuICAgIGV2dC5pbml0Q3VzdG9tRXZlbnQoIGV2ZW50LCBwYXJhbXMuYnViYmxlcywgcGFyYW1zLmNhbmNlbGFibGUsIHBhcmFtcy5kZXRhaWwgKTtcbiAgICByZXR1cm4gZXZ0O1xuICAgfVxuXG4gIEN1c3RvbUV2ZW50LnByb3RvdHlwZSA9IHdpbmRvdy5FdmVudC5wcm90b3R5cGU7XG5cbiAgd2luZG93LkN1c3RvbUV2ZW50ID0gQ3VzdG9tRXZlbnQ7XG59KSgpO1xuXG5mdW5jdGlvbiBmaXJlRXZlbnQoZWxlbWVudCwgZXZlbnROYW1lLCBvcHRpb25zKSB7XG4gIGNvbnN0IGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KGV2ZW50TmFtZSwgb3B0aW9ucyk7XG4gIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZmlyZUV2ZW50O1xuIiwiLy8gcG9seWZpbGxzXG5yZXF1aXJlKCd3ZWJjb21wb25lbnRzLmpzL0N1c3RvbUVsZW1lbnRzLmpzJyk7XG5yZXF1aXJlKCcuL3BvbHlmaWxsLmpzJyk7XG5yZXF1aXJlKCd3aGF0d2ctZmV0Y2gvZmV0Y2guanMnKTtcblxuY29uc3QgdGFnID0gcmVxdWlyZSgnLi90YWcuanMnKTtcbmNvbnN0IEVsZW1lbnQgPSByZXF1aXJlKCcuL2VsZW1lbnQuanMnKTtcbnJlcXVpcmUoJy4vYXBwLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzLkVsZW1lbnQgPSBFbGVtZW50O1xubW9kdWxlLmV4cG9ydHMudGFnID0gdGFnO1xubW9kdWxlLmV4cG9ydHMuZmlyZUV2ZW50ID0gcmVxdWlyZSgnLi9maXJlLWV2ZW50LmpzJyk7XG5cbiIsIi8vIHBvbHlmaWxsXG5yZXF1aXJlKCd3ZWJjb21wb25lbnRzLmpzL0N1c3RvbUVsZW1lbnRzLmpzJyk7XG5cbmlmICghd2luZG93LmN1c3RvbUVsZW1lbnRzKSB7XG4gIHdpbmRvdy5jdXN0b21FbGVtZW50cyA9IHtcbiAgICBkZWZpbmU6IGZ1bmN0aW9uIChuYW1lLCBlbGVtKSB7XG4gICAgICBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQobmFtZSwgZWxlbSk7XG4gICAgfVxuICB9O1xufVxuXG4iLCJjb25zdCBDb21waWxlciA9IHJlcXVpcmUoJy4vY29tcGlsZXInKTtcbmNvbnN0IEluY3JlbWVudGFsRE9NID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tL2Rpc3QvaW5jcmVtZW50YWwtZG9tLmpzJyk7XG5jb25zdCBBZ2dyZWdhdG9yID0gcmVxdWlyZSgnLi9hZ2dyZWdhdG9yLmpzJyk7XG5cbnZhciB1bndyYXBDb21tZW50ID0gL1xcL1xcKiE/KD86XFxAcHJlc2VydmUpP1sgXFx0XSooPzpcXHJcXG58XFxuKShbXFxzXFxTXSo/KSg/OlxcclxcbnxcXG4pXFxzKlxcKlxcLy87XG5cbmZ1bmN0aW9uIHRhZyh0YWdOYW1lLCBvcHRzKSB7XG4gIGNvbnN0IHRlbXBsYXRlID0gb3B0cy50ZW1wbGF0ZTtcbiAgZGVsZXRlIG9wdHNbJ3RlbXBsYXRlJ107XG4gIGlmICghdGVtcGxhdGUpIHtcbiAgICB0aHJvdyBcIk1pc3NpbmcgdGVtcGxhdGVcIjtcbiAgfVxuXG4gIGNvbnN0IHNjb3BlID0gb3B0c1snZGVmYXVsdCddIHx8IHt9O1xuICBsZXQgY29tcGlsZWQ7XG5cbiAgY29uc3QgZWxlbWVudENsYXNzUHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICBjb25zdCBlbGVtZW50Q2xhc3MgPSBjbGFzcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICBpZiAoIWNvbXBpbGVkKSB7XG4gICAgICAgIGNvbnN0IGh0bWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBodG1sLmlubmVySFRNTCA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZih0ZW1wbGF0ZSkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiB1bndyYXBDb21tZW50LmV4ZWModGVtcGxhdGUudG9TdHJpbmcoKSlbMV07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKCk7XG4gICAgICAgIG5ldyBBZ2dyZWdhdG9yKGh0bWwpLmFnZ3JlZ2F0ZShzY29wZSk7XG4gICAgICAgIGNvbXBpbGVkID0gbmV3IENvbXBpbGVyKCkuY29tcGlsZShodG1sKTtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBrZXkgaW4gc2NvcGUpIHtcbiAgICAgICAgaWYgKHNjb3BlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICB0aGlzW2tleV0gPSBzY29wZVtrZXldO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGF0dHJzID0gdGhpcy5hdHRyaWJ1dGVzO1xuICAgICAgZm9yIChsZXQgaSA9IDAsIGwgPSBhdHRycy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgY29uc3QgYXR0ciA9IGF0dHJzW2ldO1xuICAgICAgICB0aGlzW2F0dHIubmFtZV0gPSBhdHRyLnZhbHVlO1xuICAgICAgfVxuXG4gICAgICAvLyBzZXQgZXZlbnQgbGlzdGVuZXJzXG4gICAgICBpZiAob3B0cy5ldmVudHMpIHtcbiAgICAgICAgZm9yIChjb25zdCBldmVudCBpbiBvcHRzLmV2ZW50cykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGV2ZW50KTtcbiAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIG9wdHMuZXZlbnRzW2V2ZW50XS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAob3B0cy5pbml0aWFsaXplKSB7XG4gICAgICAgIG9wdHMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGtleSkge1xuICAgICAgdGhpc1trZXldID0gdGhpcy5nZXRBdHRyaWJ1dGUoa2V5KTtcbiAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgfVxuXG4gICAgdXBkYXRlKCkge1xuICAgICAgSW5jcmVtZW50YWxET00ucGF0Y2godGhpcywgKCkgPT4ge1xuICAgICAgICBjb21waWxlZC5hcHBseSh0aGlzLCBbSW5jcmVtZW50YWxET01dKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGR1bXAoKSB7XG4gICAgICBjb25zdCBzY29wZSA9IHt9O1xuICAgICAgT2JqZWN0LmtleXModGhpcykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICBpZiAoa2V5ICE9PSAncmVuZGVyZXInKSB7XG4gICAgICAgICAgc2NvcGVba2V5XSA9IHRoaXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gc2NvcGU7XG4gICAgfVxuICB9O1xuXG4gIGlmIChvcHRzLm1ldGhvZHMpIHtcbiAgICBmb3IgKGNvbnN0IG5hbWUgaW4gb3B0cy5tZXRob2RzKSB7XG4gICAgICBlbGVtZW50Q2xhc3MucHJvdG90eXBlW25hbWVdID0gb3B0cy5tZXRob2RzW25hbWVdO1xuICAgIH1cbiAgfVxuXG4gIGlmIChvcHRzLmFjY2Vzc29ycykge1xuICAgIGZvciAoY29uc3QgbmFtZSBpbiBvcHRzLmFjY2Vzc29ycykge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnRDbGFzcy5wcm90b3R5cGUsIG5hbWUsIHtcbiAgICAgICAgZ2V0OiBvcHRzLmFjY2Vzc29yc1tuYW1lXS5nZXQsXG4gICAgICAgIHNldDogb3B0cy5hY2Nlc3NvcnNbbmFtZV0uc2V0XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBjdXN0b21FbGVtZW50cy5kZWZpbmUodGFnTmFtZSwgZWxlbWVudENsYXNzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0YWc7XG5cbiIsImZ1bmN0aW9uIHNjYW4ocykge1xuICBjb25zdCBvcmlnID0gcztcbiAgY29uc3QgcmVzdWx0ID0gW107XG4gIHdoaWxlIChzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBpID0gcy5pbmRleE9mKCd7eycpO1xuICAgIGlmIChpPj0wKSB7XG4gICAgICBpZiAoaT4wKSB7IC8vIHRoZXJlJ3MgcHJlZml4IHN0cmluZ1xuICAgICAgICBjb25zdCBwID0gcy5zdWJzdHIoMCwgaSk7XG4gICAgICAgIHJlc3VsdC5wdXNoKEpTT04uc3RyaW5naWZ5KHApKTtcbiAgICAgIH1cblxuICAgICAgLy8gZmluZCBjbG9zaW5nIH19XG4gICAgICBjb25zdCBsID0gcy5pbmRleE9mKCd9fScpO1xuICAgICAgaWYgKGw8MCkge1xuICAgICAgICB0aHJvdyBgTWlzc2luZyBjbG9zaW5nICd9fScgaW4gZXhwcmVzc2lvbjogJHtvcmlnfWA7XG4gICAgICB9XG4gICAgICBjb25zdCBleHAgPSBzLnN1YnN0cihpKzIsIGwtKGkrMikpO1xuICAgICAgaWYgKGV4cC5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGAoJHtleHB9KWApO1xuICAgICAgfVxuICAgICAgcz1zLnN1YnN0cihsKzIpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQucHVzaChKU09OLnN0cmluZ2lmeShzKSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdC5qb2luKFwiK1wiKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzY2FuO1xuXG4iXX0=
