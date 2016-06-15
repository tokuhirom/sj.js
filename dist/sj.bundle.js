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

      var normalEvents = ['onclick', 'onblur', 'onchecked', 'ondblclick', 'onfocus', 'onkeydown', 'onkeypress', 'onkeyup', 'onmousedown', 'onmouseenter', 'onmouseleave', 'onmousemove', 'onmouseover', 'onmouseup', 'onpaste', 'onselected', 'onchange', 'onsubmit'];
      if (model) {
        if (elem.type === 'checkbox' || elem.type === 'radio') {
          normalEvents.push('oninput');
          var _code = events['onchange'] || '';
          codeList.push('\n          if (' + model + ') {\n            IncrementalDOM.attr("checked", \'checked\');\n          }\n          IncrementalDOM.attr("onchange", function (' + vars.concat(['$event']).join(",") + ') {\n            ' + _code + ';\n            ' + model + ' = $event.target.checked;\n            this.update();\n          }.bind(' + ['this'].concat(vars).join(",") + '));\n        ');
        } else {
          normalEvents.push('onchange');
          var _code2 = events['oninput'] || '';
          codeList.push('\n          IncrementalDOM.attr("value", ' + model + ');\n          IncrementalDOM.attr("oninput", function (' + vars.concat(['$event']).join(",") + ') {\n            ' + _code2 + ';\n            ' + model + ' = $event.target.value;\n            this.update();\n          }.bind(' + ['this'].concat(vars).join(",") + '));\n        ');
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
        } else if (attr.name === 'sj-style') {
          return 'IncrementalDOM.attr("style", ' + attr.value + ');';
        } else {
          return '';
        }
      } else {
        if (attr.name === 'href') {
          return 'IncrementalDOM.attr("' + attr.name + '", ' + this.text(attr.value) + '.replace(/^[^:]+?:/, function (scheme) { return (scheme === \'http:\' || scheme === \'https://\') ? scheme : \'unsafe:\' + scheme }));';
        } else {
          if (attr.name.substr(0, 2) === 'on' && (attr.value = ~/\{\{/)) {
            throw 'You can\'t include {{}} expression in event handler(Security reason). You should use sj-* instead.';
          }
          return 'IncrementalDOM.attr("' + attr.name + '", ' + this.text(attr.value) + ');';
        }
      }
    }
  }, {
    key: 'text',
    value: function text(s) {
      return scan(s);
    }
  }]);

  return Compiler;
}();

module.exports = Compiler;

},{"./text-expression-scanner.js":10,"incremental-dom/dist/incremental-dom.js":1}],6:[function(require,module,exports){
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

},{"./aggregator.js":4,"./compiler.js":5,"incremental-dom/dist/incremental-dom.js":1}],7:[function(require,module,exports){
'use strict';

// polyfills

require('webcomponents.js/CustomElements.js');
require('./polyfill.js');
require('whatwg-fetch/fetch.js');

var tag = require('./tag.js');
var Element = require('./element.js');

module.exports.Element = Element;
module.exports.tag = tag;

},{"./element.js":6,"./polyfill.js":8,"./tag.js":9,"webcomponents.js/CustomElements.js":2,"whatwg-fetch/fetch.js":3}],8:[function(require,module,exports){
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

},{"webcomponents.js/CustomElements.js":2}],9:[function(require,module,exports){
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

},{"./aggregator.js":4,"./compiler":5,"incremental-dom/dist/incremental-dom.js":1}],10:[function(require,module,exports){
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

},{}]},{},[7])(7)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9pbmNyZW1lbnRhbC1kb20vZGlzdC9pbmNyZW1lbnRhbC1kb20uanMiLCJub2RlX21vZHVsZXMvd2ViY29tcG9uZW50cy5qcy9DdXN0b21FbGVtZW50cy5qcyIsIm5vZGVfbW9kdWxlcy93aGF0d2ctZmV0Y2gvZmV0Y2guanMiLCJzcmMvYWdncmVnYXRvci5qcyIsInNyYy9jb21waWxlci5qcyIsInNyYy9lbGVtZW50LmpzIiwic3JjL21haW4uanMiLCJzcmMvcG9seWZpbGwuanMiLCJzcmMvdGFnLmpzIiwic3JjL3RleHQtZXhwcmVzc2lvbi1zY2FubmVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BnQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QUFBLEFBQUssVUFBakIsQUFBWSxBQUFlLEFBQzNCO0FBQ0Q7QUFDRjtBQUNEO1NBQU8sT0FBQSxBQUFPLEtBQWQsQUFBTyxBQUFZLEFBQ3BCOzs7QUFFRCxPQUFBLEFBQU8sVUFBUCxBQUFpQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcbi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IGZhY3RvcnkoZXhwb3J0cykgOlxuICB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoWydleHBvcnRzJ10sIGZhY3RvcnkpIDpcbiAgKGZhY3RvcnkoKGdsb2JhbC5JbmNyZW1lbnRhbERPTSA9IHt9KSkpO1xufSh0aGlzLCBmdW5jdGlvbiAoZXhwb3J0cykgeyAndXNlIHN0cmljdCc7XG5cbiAgLyoqXG4gICAqIENvcHlyaWdodCAyMDE1IFRoZSBJbmNyZW1lbnRhbCBET00gQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAgICpcbiAgICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAgICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICAgKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAgICpcbiAgICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAgICpcbiAgICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICAgKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4gICAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICAgKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gICAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICAgKi9cblxuICAvKipcbiAgICogQSBjYWNoZWQgcmVmZXJlbmNlIHRvIHRoZSBoYXNPd25Qcm9wZXJ0eSBmdW5jdGlvbi5cbiAgICovXG4gIHZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbiAgLyoqXG4gICAqIEEgY2FjaGVkIHJlZmVyZW5jZSB0byB0aGUgY3JlYXRlIGZ1bmN0aW9uLlxuICAgKi9cbiAgdmFyIGNyZWF0ZSA9IE9iamVjdC5jcmVhdGU7XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gcHJldmVudCBwcm9wZXJ0eSBjb2xsaXNpb25zIGJldHdlZW4gb3VyIFwibWFwXCIgYW5kIGl0cyBwcm90b3R5cGUuXG4gICAqIEBwYXJhbSB7IU9iamVjdDxzdHJpbmcsICo+fSBtYXAgVGhlIG1hcCB0byBjaGVjay5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IFRoZSBwcm9wZXJ0eSB0byBjaGVjay5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciBtYXAgaGFzIHByb3BlcnR5LlxuICAgKi9cbiAgdmFyIGhhcyA9IGZ1bmN0aW9uIChtYXAsIHByb3BlcnR5KSB7XG4gICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwobWFwLCBwcm9wZXJ0eSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gbWFwIG9iamVjdCB3aXRob3V0IGEgcHJvdG90eXBlLlxuICAgKiBAcmV0dXJuIHshT2JqZWN0fVxuICAgKi9cbiAgdmFyIGNyZWF0ZU1hcCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gY3JlYXRlKG51bGwpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBLZWVwcyB0cmFjayBvZiBpbmZvcm1hdGlvbiBuZWVkZWQgdG8gcGVyZm9ybSBkaWZmcyBmb3IgYSBnaXZlbiBET00gbm9kZS5cbiAgICogQHBhcmFtIHshc3RyaW5nfSBub2RlTmFtZVxuICAgKiBAcGFyYW0gez9zdHJpbmc9fSBrZXlcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuICBmdW5jdGlvbiBOb2RlRGF0YShub2RlTmFtZSwga2V5KSB7XG4gICAgLyoqXG4gICAgICogVGhlIGF0dHJpYnV0ZXMgYW5kIHRoZWlyIHZhbHVlcy5cbiAgICAgKiBAY29uc3QgeyFPYmplY3Q8c3RyaW5nLCAqPn1cbiAgICAgKi9cbiAgICB0aGlzLmF0dHJzID0gY3JlYXRlTWFwKCk7XG5cbiAgICAvKipcbiAgICAgKiBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycywgdXNlZCBmb3IgcXVpY2tseSBkaWZmaW5nIHRoZVxuICAgICAqIGluY29tbWluZyBhdHRyaWJ1dGVzIHRvIHNlZSBpZiB0aGUgRE9NIG5vZGUncyBhdHRyaWJ1dGVzIG5lZWQgdG8gYmVcbiAgICAgKiB1cGRhdGVkLlxuICAgICAqIEBjb25zdCB7QXJyYXk8Kj59XG4gICAgICovXG4gICAgdGhpcy5hdHRyc0FyciA9IFtdO1xuXG4gICAgLyoqXG4gICAgICogVGhlIGluY29taW5nIGF0dHJpYnV0ZXMgZm9yIHRoaXMgTm9kZSwgYmVmb3JlIHRoZXkgYXJlIHVwZGF0ZWQuXG4gICAgICogQGNvbnN0IHshT2JqZWN0PHN0cmluZywgKj59XG4gICAgICovXG4gICAgdGhpcy5uZXdBdHRycyA9IGNyZWF0ZU1hcCgpO1xuXG4gICAgLyoqXG4gICAgICogVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgbm9kZSwgdXNlZCB0byBwcmVzZXJ2ZSBET00gbm9kZXMgd2hlbiB0aGV5XG4gICAgICogbW92ZSB3aXRoaW4gdGhlaXIgcGFyZW50LlxuICAgICAqIEBjb25zdFxuICAgICAqL1xuICAgIHRoaXMua2V5ID0ga2V5O1xuXG4gICAgLyoqXG4gICAgICogS2VlcHMgdHJhY2sgb2YgY2hpbGRyZW4gd2l0aGluIHRoaXMgbm9kZSBieSB0aGVpciBrZXkuXG4gICAgICogez9PYmplY3Q8c3RyaW5nLCAhRWxlbWVudD59XG4gICAgICovXG4gICAgdGhpcy5rZXlNYXAgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogV2hldGhlciBvciBub3QgdGhlIGtleU1hcCBpcyBjdXJyZW50bHkgdmFsaWQuXG4gICAgICoge2Jvb2xlYW59XG4gICAgICovXG4gICAgdGhpcy5rZXlNYXBWYWxpZCA9IHRydWU7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbm9kZSBuYW1lIGZvciB0aGlzIG5vZGUuXG4gICAgICogQGNvbnN0IHtzdHJpbmd9XG4gICAgICovXG4gICAgdGhpcy5ub2RlTmFtZSA9IG5vZGVOYW1lO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUgez9zdHJpbmd9XG4gICAgICovXG4gICAgdGhpcy50ZXh0ID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIE5vZGVEYXRhIG9iamVjdCBmb3IgYSBOb2RlLlxuICAgKlxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGUgVGhlIG5vZGUgdG8gaW5pdGlhbGl6ZSBkYXRhIGZvci5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVOYW1lIFRoZSBub2RlIG5hbWUgb2Ygbm9kZS5cbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdGhhdCBpZGVudGlmaWVzIHRoZSBub2RlLlxuICAgKiBAcmV0dXJuIHshTm9kZURhdGF9IFRoZSBuZXdseSBpbml0aWFsaXplZCBkYXRhIG9iamVjdFxuICAgKi9cbiAgdmFyIGluaXREYXRhID0gZnVuY3Rpb24gKG5vZGUsIG5vZGVOYW1lLCBrZXkpIHtcbiAgICB2YXIgZGF0YSA9IG5ldyBOb2RlRGF0YShub2RlTmFtZSwga2V5KTtcbiAgICBub2RlWydfX2luY3JlbWVudGFsRE9NRGF0YSddID0gZGF0YTtcbiAgICByZXR1cm4gZGF0YTtcbiAgfTtcblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBOb2RlRGF0YSBvYmplY3QgZm9yIGEgTm9kZSwgY3JlYXRpbmcgaXQgaWYgbmVjZXNzYXJ5LlxuICAgKlxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGUgVGhlIG5vZGUgdG8gcmV0cmlldmUgdGhlIGRhdGEgZm9yLlxuICAgKiBAcmV0dXJuIHshTm9kZURhdGF9IFRoZSBOb2RlRGF0YSBmb3IgdGhpcyBOb2RlLlxuICAgKi9cbiAgdmFyIGdldERhdGEgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIHZhciBkYXRhID0gbm9kZVsnX19pbmNyZW1lbnRhbERPTURhdGEnXTtcblxuICAgIGlmICghZGF0YSkge1xuICAgICAgdmFyIG5vZGVOYW1lID0gbm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgdmFyIGtleSA9IG51bGw7XG5cbiAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICBrZXkgPSBub2RlLmdldEF0dHJpYnV0ZSgna2V5Jyk7XG4gICAgICB9XG5cbiAgICAgIGRhdGEgPSBpbml0RGF0YShub2RlLCBub2RlTmFtZSwga2V5KTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfTtcblxuICAvKipcbiAgICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICAgKlxuICAgKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICAgKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gICAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICAgKlxuICAgKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICAgKlxuICAgKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gICAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAgICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gICAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gICAqL1xuXG4gIC8qKiBAY29uc3QgKi9cbiAgdmFyIHN5bWJvbHMgPSB7XG4gICAgZGVmYXVsdDogJ19fZGVmYXVsdCcsXG5cbiAgICBwbGFjZWhvbGRlcjogJ19fcGxhY2Vob2xkZXInXG4gIH07XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAqIEByZXR1cm4ge3N0cmluZ3x1bmRlZmluZWR9IFRoZSBuYW1lc3BhY2UgdG8gdXNlIGZvciB0aGUgYXR0cmlidXRlLlxuICAgKi9cbiAgdmFyIGdldE5hbWVzcGFjZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgaWYgKG5hbWUubGFzdEluZGV4T2YoJ3htbDonLCAwKSA9PT0gMCkge1xuICAgICAgcmV0dXJuICdodHRwOi8vd3d3LnczLm9yZy9YTUwvMTk5OC9uYW1lc3BhY2UnO1xuICAgIH1cblxuICAgIGlmIChuYW1lLmxhc3RJbmRleE9mKCd4bGluazonLCAwKSA9PT0gMCkge1xuICAgICAgcmV0dXJuICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJztcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgYW4gYXR0cmlidXRlIG9yIHByb3BlcnR5IHRvIGEgZ2l2ZW4gRWxlbWVudC4gSWYgdGhlIHZhbHVlIGlzIG51bGxcbiAgICogb3IgdW5kZWZpbmVkLCBpdCBpcyByZW1vdmVkIGZyb20gdGhlIEVsZW1lbnQuIE90aGVyd2lzZSwgdGhlIHZhbHVlIGlzIHNldFxuICAgKiBhcyBhbiBhdHRyaWJ1dGUuXG4gICAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBhdHRyaWJ1dGUncyBuYW1lLlxuICAgKiBAcGFyYW0gez8oYm9vbGVhbnxudW1iZXJ8c3RyaW5nKT19IHZhbHVlIFRoZSBhdHRyaWJ1dGUncyB2YWx1ZS5cbiAgICovXG4gIHZhciBhcHBseUF0dHIgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGF0dHJOUyA9IGdldE5hbWVzcGFjZShuYW1lKTtcbiAgICAgIGlmIChhdHRyTlMpIHtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlTlMoYXR0ck5TLCBuYW1lLCB2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQXBwbGllcyBhIHByb3BlcnR5IHRvIGEgZ2l2ZW4gRWxlbWVudC5cbiAgICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIHByb3BlcnR5J3MgbmFtZS5cbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgcHJvcGVydHkncyB2YWx1ZS5cbiAgICovXG4gIHZhciBhcHBseVByb3AgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gICAgZWxbbmFtZV0gPSB2YWx1ZTtcbiAgfTtcblxuICAvKipcbiAgICogQXBwbGllcyBhIHN0eWxlIHRvIGFuIEVsZW1lbnQuIE5vIHZlbmRvciBwcmVmaXggZXhwYW5zaW9uIGlzIGRvbmUgZm9yXG4gICAqIHByb3BlcnR5IG5hbWVzL3ZhbHVlcy5cbiAgICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gICAqIEBwYXJhbSB7Kn0gc3R5bGUgVGhlIHN0eWxlIHRvIHNldC4gRWl0aGVyIGEgc3RyaW5nIG9mIGNzcyBvciBhbiBvYmplY3RcbiAgICogICAgIGNvbnRhaW5pbmcgcHJvcGVydHktdmFsdWUgcGFpcnMuXG4gICAqL1xuICB2YXIgYXBwbHlTdHlsZSA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgc3R5bGUpIHtcbiAgICBpZiAodHlwZW9mIHN0eWxlID09PSAnc3RyaW5nJykge1xuICAgICAgZWwuc3R5bGUuY3NzVGV4dCA9IHN0eWxlO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbC5zdHlsZS5jc3NUZXh0ID0gJyc7XG4gICAgICB2YXIgZWxTdHlsZSA9IGVsLnN0eWxlO1xuICAgICAgdmFyIG9iaiA9IC8qKiBAdHlwZSB7IU9iamVjdDxzdHJpbmcsc3RyaW5nPn0gKi9zdHlsZTtcblxuICAgICAgZm9yICh2YXIgcHJvcCBpbiBvYmopIHtcbiAgICAgICAgaWYgKGhhcyhvYmosIHByb3ApKSB7XG4gICAgICAgICAgZWxTdHlsZVtwcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogVXBkYXRlcyBhIHNpbmdsZSBhdHRyaWJ1dGUgb24gYW4gRWxlbWVudC5cbiAgICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIGF0dHJpYnV0ZSdzIHZhbHVlLiBJZiB0aGUgdmFsdWUgaXMgYW4gb2JqZWN0IG9yXG4gICAqICAgICBmdW5jdGlvbiBpdCBpcyBzZXQgb24gdGhlIEVsZW1lbnQsIG90aGVyd2lzZSwgaXQgaXMgc2V0IGFzIGFuIEhUTUxcbiAgICogICAgIGF0dHJpYnV0ZS5cbiAgICovXG4gIHZhciBhcHBseUF0dHJpYnV0ZVR5cGVkID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICAgIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuXG4gICAgaWYgKHR5cGUgPT09ICdvYmplY3QnIHx8IHR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGFwcGx5UHJvcChlbCwgbmFtZSwgdmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhcHBseUF0dHIoZWwsIG5hbWUsIC8qKiBAdHlwZSB7Pyhib29sZWFufG51bWJlcnxzdHJpbmcpfSAqL3ZhbHVlKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIENhbGxzIHRoZSBhcHByb3ByaWF0ZSBhdHRyaWJ1dGUgbXV0YXRvciBmb3IgdGhpcyBhdHRyaWJ1dGUuXG4gICAqIEBwYXJhbSB7IUVsZW1lbnR9IGVsXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBhdHRyaWJ1dGUncyBuYW1lLlxuICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBhdHRyaWJ1dGUncyB2YWx1ZS5cbiAgICovXG4gIHZhciB1cGRhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIGRhdGEgPSBnZXREYXRhKGVsKTtcbiAgICB2YXIgYXR0cnMgPSBkYXRhLmF0dHJzO1xuXG4gICAgaWYgKGF0dHJzW25hbWVdID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBtdXRhdG9yID0gYXR0cmlidXRlc1tuYW1lXSB8fCBhdHRyaWJ1dGVzW3N5bWJvbHMuZGVmYXVsdF07XG4gICAgbXV0YXRvcihlbCwgbmFtZSwgdmFsdWUpO1xuXG4gICAgYXR0cnNbbmFtZV0gPSB2YWx1ZTtcbiAgfTtcblxuICAvKipcbiAgICogQSBwdWJsaWNseSBtdXRhYmxlIG9iamVjdCB0byBwcm92aWRlIGN1c3RvbSBtdXRhdG9ycyBmb3IgYXR0cmlidXRlcy5cbiAgICogQGNvbnN0IHshT2JqZWN0PHN0cmluZywgZnVuY3Rpb24oIUVsZW1lbnQsIHN0cmluZywgKik+fVxuICAgKi9cbiAgdmFyIGF0dHJpYnV0ZXMgPSBjcmVhdGVNYXAoKTtcblxuICAvLyBTcGVjaWFsIGdlbmVyaWMgbXV0YXRvciB0aGF0J3MgY2FsbGVkIGZvciBhbnkgYXR0cmlidXRlIHRoYXQgZG9lcyBub3RcbiAgLy8gaGF2ZSBhIHNwZWNpZmljIG11dGF0b3IuXG4gIGF0dHJpYnV0ZXNbc3ltYm9scy5kZWZhdWx0XSA9IGFwcGx5QXR0cmlidXRlVHlwZWQ7XG5cbiAgYXR0cmlidXRlc1tzeW1ib2xzLnBsYWNlaG9sZGVyXSA9IGZ1bmN0aW9uICgpIHt9O1xuXG4gIGF0dHJpYnV0ZXNbJ3N0eWxlJ10gPSBhcHBseVN0eWxlO1xuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBuYW1lc3BhY2UgdG8gY3JlYXRlIGFuIGVsZW1lbnQgKG9mIGEgZ2l2ZW4gdGFnKSBpbi5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgdGFnIHRvIGdldCB0aGUgbmFtZXNwYWNlIGZvci5cbiAgICogQHBhcmFtIHs/Tm9kZX0gcGFyZW50XG4gICAqIEByZXR1cm4gez9zdHJpbmd9IFRoZSBuYW1lc3BhY2UgdG8gY3JlYXRlIHRoZSB0YWcgaW4uXG4gICAqL1xuICB2YXIgZ2V0TmFtZXNwYWNlRm9yVGFnID0gZnVuY3Rpb24gKHRhZywgcGFyZW50KSB7XG4gICAgaWYgKHRhZyA9PT0gJ3N2ZycpIHtcbiAgICAgIHJldHVybiAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xuICAgIH1cblxuICAgIGlmIChnZXREYXRhKHBhcmVudCkubm9kZU5hbWUgPT09ICdmb3JlaWduT2JqZWN0Jykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcmVudC5uYW1lc3BhY2VVUkk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gRWxlbWVudC5cbiAgICogQHBhcmFtIHtEb2N1bWVudH0gZG9jIFRoZSBkb2N1bWVudCB3aXRoIHdoaWNoIHRvIGNyZWF0ZSB0aGUgRWxlbWVudC5cbiAgICogQHBhcmFtIHs/Tm9kZX0gcGFyZW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIHRhZyBmb3IgdGhlIEVsZW1lbnQuXG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBBIGtleSB0byBpZGVudGlmeSB0aGUgRWxlbWVudC5cbiAgICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICAgKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LlxuICAgKiBAcmV0dXJuIHshRWxlbWVudH1cbiAgICovXG4gIHZhciBjcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24gKGRvYywgcGFyZW50LCB0YWcsIGtleSwgc3RhdGljcykge1xuICAgIHZhciBuYW1lc3BhY2UgPSBnZXROYW1lc3BhY2VGb3JUYWcodGFnLCBwYXJlbnQpO1xuICAgIHZhciBlbCA9IHVuZGVmaW5lZDtcblxuICAgIGlmIChuYW1lc3BhY2UpIHtcbiAgICAgIGVsID0gZG9jLmNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2UsIHRhZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsID0gZG9jLmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgICB9XG5cbiAgICBpbml0RGF0YShlbCwgdGFnLCBrZXkpO1xuXG4gICAgaWYgKHN0YXRpY3MpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhdGljcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICB1cGRhdGVBdHRyaWJ1dGUoZWwsIC8qKiBAdHlwZSB7IXN0cmluZ30qL3N0YXRpY3NbaV0sIHN0YXRpY3NbaSArIDFdKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZWw7XG4gIH07XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBUZXh0IE5vZGUuXG4gICAqIEBwYXJhbSB7RG9jdW1lbnR9IGRvYyBUaGUgZG9jdW1lbnQgd2l0aCB3aGljaCB0byBjcmVhdGUgdGhlIEVsZW1lbnQuXG4gICAqIEByZXR1cm4geyFUZXh0fVxuICAgKi9cbiAgdmFyIGNyZWF0ZVRleHQgPSBmdW5jdGlvbiAoZG9jKSB7XG4gICAgdmFyIG5vZGUgPSBkb2MuY3JlYXRlVGV4dE5vZGUoJycpO1xuICAgIGluaXREYXRhKG5vZGUsICcjdGV4dCcsIG51bGwpO1xuICAgIHJldHVybiBub2RlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbWFwcGluZyB0aGF0IGNhbiBiZSB1c2VkIHRvIGxvb2sgdXAgY2hpbGRyZW4gdXNpbmcgYSBrZXkuXG4gICAqIEBwYXJhbSB7P05vZGV9IGVsXG4gICAqIEByZXR1cm4geyFPYmplY3Q8c3RyaW5nLCAhRWxlbWVudD59IEEgbWFwcGluZyBvZiBrZXlzIHRvIHRoZSBjaGlsZHJlbiBvZiB0aGVcbiAgICogICAgIEVsZW1lbnQuXG4gICAqL1xuICB2YXIgY3JlYXRlS2V5TWFwID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgdmFyIG1hcCA9IGNyZWF0ZU1hcCgpO1xuICAgIHZhciBjaGlsZCA9IGVsLmZpcnN0RWxlbWVudENoaWxkO1xuXG4gICAgd2hpbGUgKGNoaWxkKSB7XG4gICAgICB2YXIga2V5ID0gZ2V0RGF0YShjaGlsZCkua2V5O1xuXG4gICAgICBpZiAoa2V5KSB7XG4gICAgICAgIG1hcFtrZXldID0gY2hpbGQ7XG4gICAgICB9XG5cbiAgICAgIGNoaWxkID0gY2hpbGQubmV4dEVsZW1lbnRTaWJsaW5nO1xuICAgIH1cblxuICAgIHJldHVybiBtYXA7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgbWFwcGluZyBvZiBrZXkgdG8gY2hpbGQgbm9kZSBmb3IgYSBnaXZlbiBFbGVtZW50LCBjcmVhdGluZyBpdFxuICAgKiBpZiBuZWNlc3NhcnkuXG4gICAqIEBwYXJhbSB7P05vZGV9IGVsXG4gICAqIEByZXR1cm4geyFPYmplY3Q8c3RyaW5nLCAhTm9kZT59IEEgbWFwcGluZyBvZiBrZXlzIHRvIGNoaWxkIEVsZW1lbnRzXG4gICAqL1xuICB2YXIgZ2V0S2V5TWFwID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgdmFyIGRhdGEgPSBnZXREYXRhKGVsKTtcblxuICAgIGlmICghZGF0YS5rZXlNYXApIHtcbiAgICAgIGRhdGEua2V5TWFwID0gY3JlYXRlS2V5TWFwKGVsKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YS5rZXlNYXA7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIGNoaWxkIGZyb20gdGhlIHBhcmVudCB3aXRoIHRoZSBnaXZlbiBrZXkuXG4gICAqIEBwYXJhbSB7P05vZGV9IHBhcmVudFxuICAgKiBAcGFyYW0gez9zdHJpbmc9fSBrZXlcbiAgICogQHJldHVybiB7P05vZGV9IFRoZSBjaGlsZCBjb3JyZXNwb25kaW5nIHRvIHRoZSBrZXkuXG4gICAqL1xuICB2YXIgZ2V0Q2hpbGQgPSBmdW5jdGlvbiAocGFyZW50LCBrZXkpIHtcbiAgICByZXR1cm4ga2V5ID8gZ2V0S2V5TWFwKHBhcmVudClba2V5XSA6IG51bGw7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhbiBlbGVtZW50IGFzIGJlaW5nIGEgY2hpbGQuIFRoZSBwYXJlbnQgd2lsbCBrZWVwIHRyYWNrIG9mIHRoZVxuICAgKiBjaGlsZCB1c2luZyB0aGUga2V5LiBUaGUgY2hpbGQgY2FuIGJlIHJldHJpZXZlZCB1c2luZyB0aGUgc2FtZSBrZXkgdXNpbmdcbiAgICogZ2V0S2V5TWFwLiBUaGUgcHJvdmlkZWQga2V5IHNob3VsZCBiZSB1bmlxdWUgd2l0aGluIHRoZSBwYXJlbnQgRWxlbWVudC5cbiAgICogQHBhcmFtIHs/Tm9kZX0gcGFyZW50IFRoZSBwYXJlbnQgb2YgY2hpbGQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgQSBrZXkgdG8gaWRlbnRpZnkgdGhlIGNoaWxkIHdpdGguXG4gICAqIEBwYXJhbSB7IU5vZGV9IGNoaWxkIFRoZSBjaGlsZCB0byByZWdpc3Rlci5cbiAgICovXG4gIHZhciByZWdpc3RlckNoaWxkID0gZnVuY3Rpb24gKHBhcmVudCwga2V5LCBjaGlsZCkge1xuICAgIGdldEtleU1hcChwYXJlbnQpW2tleV0gPSBjaGlsZDtcbiAgfTtcblxuICAvKipcbiAgICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICAgKlxuICAgKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICAgKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gICAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICAgKlxuICAgKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICAgKlxuICAgKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gICAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAgICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gICAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gICAqL1xuXG4gIC8qKiBAY29uc3QgKi9cbiAgdmFyIG5vdGlmaWNhdGlvbnMgPSB7XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIGFmdGVyIHBhdGNoIGhhcyBjb21wbGVhdGVkIHdpdGggYW55IE5vZGVzIHRoYXQgaGF2ZSBiZWVuIGNyZWF0ZWRcbiAgICAgKiBhbmQgYWRkZWQgdG8gdGhlIERPTS5cbiAgICAgKiBAdHlwZSB7P2Z1bmN0aW9uKEFycmF5PCFOb2RlPil9XG4gICAgICovXG4gICAgbm9kZXNDcmVhdGVkOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIGFmdGVyIHBhdGNoIGhhcyBjb21wbGVhdGVkIHdpdGggYW55IE5vZGVzIHRoYXQgaGF2ZSBiZWVuIHJlbW92ZWRcbiAgICAgKiBmcm9tIHRoZSBET00uXG4gICAgICogTm90ZSBpdCdzIGFuIGFwcGxpY2F0aW9ucyByZXNwb25zaWJpbGl0eSB0byBoYW5kbGUgYW55IGNoaWxkTm9kZXMuXG4gICAgICogQHR5cGUgez9mdW5jdGlvbihBcnJheTwhTm9kZT4pfVxuICAgICAqL1xuICAgIG5vZGVzRGVsZXRlZDogbnVsbFxuICB9O1xuXG4gIC8qKlxuICAgKiBLZWVwcyB0cmFjayBvZiB0aGUgc3RhdGUgb2YgYSBwYXRjaC5cbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuICBmdW5jdGlvbiBDb250ZXh0KCkge1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHsoQXJyYXk8IU5vZGU+fHVuZGVmaW5lZCl9XG4gICAgICovXG4gICAgdGhpcy5jcmVhdGVkID0gbm90aWZpY2F0aW9ucy5ub2Rlc0NyZWF0ZWQgJiYgW107XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7KEFycmF5PCFOb2RlPnx1bmRlZmluZWQpfVxuICAgICAqL1xuICAgIHRoaXMuZGVsZXRlZCA9IG5vdGlmaWNhdGlvbnMubm9kZXNEZWxldGVkICYmIFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAgICovXG4gIENvbnRleHQucHJvdG90eXBlLm1hcmtDcmVhdGVkID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICBpZiAodGhpcy5jcmVhdGVkKSB7XG4gICAgICB0aGlzLmNyZWF0ZWQucHVzaChub2RlKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAgICovXG4gIENvbnRleHQucHJvdG90eXBlLm1hcmtEZWxldGVkID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICBpZiAodGhpcy5kZWxldGVkKSB7XG4gICAgICB0aGlzLmRlbGV0ZWQucHVzaChub2RlKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIE5vdGlmaWVzIGFib3V0IG5vZGVzIHRoYXQgd2VyZSBjcmVhdGVkIGR1cmluZyB0aGUgcGF0Y2ggb3BlYXJhdGlvbi5cbiAgICovXG4gIENvbnRleHQucHJvdG90eXBlLm5vdGlmeUNoYW5nZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuY3JlYXRlZCAmJiB0aGlzLmNyZWF0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgbm90aWZpY2F0aW9ucy5ub2Rlc0NyZWF0ZWQodGhpcy5jcmVhdGVkKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5kZWxldGVkICYmIHRoaXMuZGVsZXRlZC5sZW5ndGggPiAwKSB7XG4gICAgICBub3RpZmljYXRpb25zLm5vZGVzRGVsZXRlZCh0aGlzLmRlbGV0ZWQpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgKiBNYWtlcyBzdXJlIHRoYXQga2V5ZWQgRWxlbWVudCBtYXRjaGVzIHRoZSB0YWcgbmFtZSBwcm92aWRlZC5cbiAgKiBAcGFyYW0geyFzdHJpbmd9IG5vZGVOYW1lIFRoZSBub2RlTmFtZSBvZiB0aGUgbm9kZSB0aGF0IGlzIGJlaW5nIG1hdGNoZWQuXG4gICogQHBhcmFtIHtzdHJpbmc9fSB0YWcgVGhlIHRhZyBuYW1lIG9mIHRoZSBFbGVtZW50LlxuICAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IG9mIHRoZSBFbGVtZW50LlxuICAqL1xuICB2YXIgYXNzZXJ0S2V5ZWRUYWdNYXRjaGVzID0gZnVuY3Rpb24gKG5vZGVOYW1lLCB0YWcsIGtleSkge1xuICAgIGlmIChub2RlTmFtZSAhPT0gdGFnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dhcyBleHBlY3Rpbmcgbm9kZSB3aXRoIGtleSBcIicgKyBrZXkgKyAnXCIgdG8gYmUgYSAnICsgdGFnICsgJywgbm90IGEgJyArIG5vZGVOYW1lICsgJy4nKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqIEB0eXBlIHs/Q29udGV4dH0gKi9cbiAgdmFyIGNvbnRleHQgPSBudWxsO1xuXG4gIC8qKiBAdHlwZSB7P05vZGV9ICovXG4gIHZhciBjdXJyZW50Tm9kZSA9IG51bGw7XG5cbiAgLyoqIEB0eXBlIHs/Tm9kZX0gKi9cbiAgdmFyIGN1cnJlbnRQYXJlbnQgPSBudWxsO1xuXG4gIC8qKiBAdHlwZSB7P0VsZW1lbnR8P0RvY3VtZW50RnJhZ21lbnR9ICovXG4gIHZhciByb290ID0gbnVsbDtcblxuICAvKiogQHR5cGUgez9Eb2N1bWVudH0gKi9cbiAgdmFyIGRvYyA9IG51bGw7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBwYXRjaGVyIGZ1bmN0aW9uIHRoYXQgc2V0cyB1cCBhbmQgcmVzdG9yZXMgYSBwYXRjaCBjb250ZXh0LFxuICAgKiBydW5uaW5nIHRoZSBydW4gZnVuY3Rpb24gd2l0aCB0aGUgcHJvdmlkZWQgZGF0YS5cbiAgICogQHBhcmFtIHtmdW5jdGlvbigoIUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnQpLCFmdW5jdGlvbihUKSxUPSl9IHJ1blxuICAgKiBAcmV0dXJuIHtmdW5jdGlvbigoIUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnQpLCFmdW5jdGlvbihUKSxUPSl9XG4gICAqIEB0ZW1wbGF0ZSBUXG4gICAqL1xuICB2YXIgcGF0Y2hGYWN0b3J5ID0gZnVuY3Rpb24gKHJ1bikge1xuICAgIC8qKlxuICAgICAqIFRPRE8obW96KTogVGhlc2UgYW5ub3RhdGlvbnMgd29uJ3QgYmUgbmVjZXNzYXJ5IG9uY2Ugd2Ugc3dpdGNoIHRvIENsb3N1cmVcbiAgICAgKiBDb21waWxlcidzIG5ldyB0eXBlIGluZmVyZW5jZS4gUmVtb3ZlIHRoZXNlIG9uY2UgdGhlIHN3aXRjaCBpcyBkb25lLlxuICAgICAqXG4gICAgICogQHBhcmFtIHsoIUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnQpfSBub2RlXG4gICAgICogQHBhcmFtIHshZnVuY3Rpb24oVCl9IGZuXG4gICAgICogQHBhcmFtIHtUPX0gZGF0YVxuICAgICAqIEB0ZW1wbGF0ZSBUXG4gICAgICovXG4gICAgdmFyIGYgPSBmdW5jdGlvbiAobm9kZSwgZm4sIGRhdGEpIHtcbiAgICAgIHZhciBwcmV2Q29udGV4dCA9IGNvbnRleHQ7XG4gICAgICB2YXIgcHJldlJvb3QgPSByb290O1xuICAgICAgdmFyIHByZXZEb2MgPSBkb2M7XG4gICAgICB2YXIgcHJldkN1cnJlbnROb2RlID0gY3VycmVudE5vZGU7XG4gICAgICB2YXIgcHJldkN1cnJlbnRQYXJlbnQgPSBjdXJyZW50UGFyZW50O1xuICAgICAgdmFyIHByZXZpb3VzSW5BdHRyaWJ1dGVzID0gZmFsc2U7XG4gICAgICB2YXIgcHJldmlvdXNJblNraXAgPSBmYWxzZTtcblxuICAgICAgY29udGV4dCA9IG5ldyBDb250ZXh0KCk7XG4gICAgICByb290ID0gbm9kZTtcbiAgICAgIGRvYyA9IG5vZGUub3duZXJEb2N1bWVudDtcbiAgICAgIGN1cnJlbnRQYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XG5cbiAgICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICAgICAgcnVuKG5vZGUsIGZuLCBkYXRhKTtcblxuICAgICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gICAgICBjb250ZXh0Lm5vdGlmeUNoYW5nZXMoKTtcblxuICAgICAgY29udGV4dCA9IHByZXZDb250ZXh0O1xuICAgICAgcm9vdCA9IHByZXZSb290O1xuICAgICAgZG9jID0gcHJldkRvYztcbiAgICAgIGN1cnJlbnROb2RlID0gcHJldkN1cnJlbnROb2RlO1xuICAgICAgY3VycmVudFBhcmVudCA9IHByZXZDdXJyZW50UGFyZW50O1xuICAgIH07XG4gICAgcmV0dXJuIGY7XG4gIH07XG5cbiAgLyoqXG4gICAqIFBhdGNoZXMgdGhlIGRvY3VtZW50IHN0YXJ0aW5nIGF0IG5vZGUgd2l0aCB0aGUgcHJvdmlkZWQgZnVuY3Rpb24uIFRoaXNcbiAgICogZnVuY3Rpb24gbWF5IGJlIGNhbGxlZCBkdXJpbmcgYW4gZXhpc3RpbmcgcGF0Y2ggb3BlcmF0aW9uLlxuICAgKiBAcGFyYW0geyFFbGVtZW50fCFEb2N1bWVudEZyYWdtZW50fSBub2RlIFRoZSBFbGVtZW50IG9yIERvY3VtZW50XG4gICAqICAgICB0byBwYXRjaC5cbiAgICogQHBhcmFtIHshZnVuY3Rpb24oVCl9IGZuIEEgZnVuY3Rpb24gY29udGFpbmluZyBlbGVtZW50T3Blbi9lbGVtZW50Q2xvc2UvZXRjLlxuICAgKiAgICAgY2FsbHMgdGhhdCBkZXNjcmliZSB0aGUgRE9NLlxuICAgKiBAcGFyYW0ge1Q9fSBkYXRhIEFuIGFyZ3VtZW50IHBhc3NlZCB0byBmbiB0byByZXByZXNlbnQgRE9NIHN0YXRlLlxuICAgKiBAdGVtcGxhdGUgVFxuICAgKi9cbiAgdmFyIHBhdGNoSW5uZXIgPSBwYXRjaEZhY3RvcnkoZnVuY3Rpb24gKG5vZGUsIGZuLCBkYXRhKSB7XG4gICAgY3VycmVudE5vZGUgPSBub2RlO1xuXG4gICAgZW50ZXJOb2RlKCk7XG4gICAgZm4oZGF0YSk7XG4gICAgZXhpdE5vZGUoKTtcblxuICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cbiAgfSk7XG5cbiAgLyoqXG4gICAqIFBhdGNoZXMgYW4gRWxlbWVudCB3aXRoIHRoZSB0aGUgcHJvdmlkZWQgZnVuY3Rpb24uIEV4YWN0bHkgb25lIHRvcCBsZXZlbFxuICAgKiBlbGVtZW50IGNhbGwgc2hvdWxkIGJlIG1hZGUgY29ycmVzcG9uZGluZyB0byBgbm9kZWAuXG4gICAqIEBwYXJhbSB7IUVsZW1lbnR9IG5vZGUgVGhlIEVsZW1lbnQgd2hlcmUgdGhlIHBhdGNoIHNob3VsZCBzdGFydC5cbiAgICogQHBhcmFtIHshZnVuY3Rpb24oVCl9IGZuIEEgZnVuY3Rpb24gY29udGFpbmluZyBlbGVtZW50T3Blbi9lbGVtZW50Q2xvc2UvZXRjLlxuICAgKiAgICAgY2FsbHMgdGhhdCBkZXNjcmliZSB0aGUgRE9NLiBUaGlzIHNob3VsZCBoYXZlIGF0IG1vc3Qgb25lIHRvcCBsZXZlbFxuICAgKiAgICAgZWxlbWVudCBjYWxsLlxuICAgKiBAcGFyYW0ge1Q9fSBkYXRhIEFuIGFyZ3VtZW50IHBhc3NlZCB0byBmbiB0byByZXByZXNlbnQgRE9NIHN0YXRlLlxuICAgKiBAdGVtcGxhdGUgVFxuICAgKi9cbiAgdmFyIHBhdGNoT3V0ZXIgPSBwYXRjaEZhY3RvcnkoZnVuY3Rpb24gKG5vZGUsIGZuLCBkYXRhKSB7XG4gICAgY3VycmVudE5vZGUgPSAvKiogQHR5cGUgeyFFbGVtZW50fSAqL3sgbmV4dFNpYmxpbmc6IG5vZGUgfTtcblxuICAgIGZuKGRhdGEpO1xuXG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuICB9KTtcblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgb3Igbm90IHRoZSBjdXJyZW50IG5vZGUgbWF0Y2hlcyB0aGUgc3BlY2lmaWVkIG5vZGVOYW1lIGFuZFxuICAgKiBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSB7P3N0cmluZ30gbm9kZU5hbWUgVGhlIG5vZGVOYW1lIGZvciB0aGlzIG5vZGUuXG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBBbiBvcHRpb25hbCBrZXkgdGhhdCBpZGVudGlmaWVzIGEgbm9kZS5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgbm9kZSBtYXRjaGVzLCBmYWxzZSBvdGhlcndpc2UuXG4gICAqL1xuICB2YXIgbWF0Y2hlcyA9IGZ1bmN0aW9uIChub2RlTmFtZSwga2V5KSB7XG4gICAgdmFyIGRhdGEgPSBnZXREYXRhKGN1cnJlbnROb2RlKTtcblxuICAgIC8vIEtleSBjaGVjayBpcyBkb25lIHVzaW5nIGRvdWJsZSBlcXVhbHMgYXMgd2Ugd2FudCB0byB0cmVhdCBhIG51bGwga2V5IHRoZVxuICAgIC8vIHNhbWUgYXMgdW5kZWZpbmVkLiBUaGlzIHNob3VsZCBiZSBva2F5IGFzIHRoZSBvbmx5IHZhbHVlcyBhbGxvd2VkIGFyZVxuICAgIC8vIHN0cmluZ3MsIG51bGwgYW5kIHVuZGVmaW5lZCBzbyB0aGUgPT0gc2VtYW50aWNzIGFyZSBub3QgdG9vIHdlaXJkLlxuICAgIHJldHVybiBub2RlTmFtZSA9PT0gZGF0YS5ub2RlTmFtZSAmJiBrZXkgPT0gZGF0YS5rZXk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEFsaWducyB0aGUgdmlydHVhbCBFbGVtZW50IGRlZmluaXRpb24gd2l0aCB0aGUgYWN0dWFsIERPTSwgbW92aW5nIHRoZVxuICAgKiBjb3JyZXNwb25kaW5nIERPTSBub2RlIHRvIHRoZSBjb3JyZWN0IGxvY2F0aW9uIG9yIGNyZWF0aW5nIGl0IGlmIG5lY2Vzc2FyeS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVOYW1lIEZvciBhbiBFbGVtZW50LCB0aGlzIHNob3VsZCBiZSBhIHZhbGlkIHRhZyBzdHJpbmcuXG4gICAqICAgICBGb3IgYSBUZXh0LCB0aGlzIHNob3VsZCBiZSAjdGV4dC5cbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuXG4gICAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBGb3IgYW4gRWxlbWVudCwgdGhpcyBzaG91bGQgYmUgYW4gYXJyYXkgb2ZcbiAgICogICAgIG5hbWUtdmFsdWUgcGFpcnMuXG4gICAqL1xuICB2YXIgYWxpZ25XaXRoRE9NID0gZnVuY3Rpb24gKG5vZGVOYW1lLCBrZXksIHN0YXRpY3MpIHtcbiAgICBpZiAoY3VycmVudE5vZGUgJiYgbWF0Y2hlcyhub2RlTmFtZSwga2V5KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBub2RlID0gdW5kZWZpbmVkO1xuXG4gICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSBub2RlIGhhcyBtb3ZlZCB3aXRoaW4gdGhlIHBhcmVudC5cbiAgICBpZiAoa2V5KSB7XG4gICAgICBub2RlID0gZ2V0Q2hpbGQoY3VycmVudFBhcmVudCwga2V5KTtcbiAgICAgIGlmIChub2RlICYmICdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgIGFzc2VydEtleWVkVGFnTWF0Y2hlcyhnZXREYXRhKG5vZGUpLm5vZGVOYW1lLCBub2RlTmFtZSwga2V5KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgdGhlIG5vZGUgaWYgaXQgZG9lc24ndCBleGlzdC5cbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgIGlmIChub2RlTmFtZSA9PT0gJyN0ZXh0Jykge1xuICAgICAgICBub2RlID0gY3JlYXRlVGV4dChkb2MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZSA9IGNyZWF0ZUVsZW1lbnQoZG9jLCBjdXJyZW50UGFyZW50LCBub2RlTmFtZSwga2V5LCBzdGF0aWNzKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGtleSkge1xuICAgICAgICByZWdpc3RlckNoaWxkKGN1cnJlbnRQYXJlbnQsIGtleSwgbm9kZSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnRleHQubWFya0NyZWF0ZWQobm9kZSk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIG5vZGUgaGFzIGEga2V5LCByZW1vdmUgaXQgZnJvbSB0aGUgRE9NIHRvIHByZXZlbnQgYSBsYXJnZSBudW1iZXJcbiAgICAvLyBvZiByZS1vcmRlcnMgaW4gdGhlIGNhc2UgdGhhdCBpdCBtb3ZlZCBmYXIgb3Igd2FzIGNvbXBsZXRlbHkgcmVtb3ZlZC5cbiAgICAvLyBTaW5jZSB3ZSBob2xkIG9uIHRvIGEgcmVmZXJlbmNlIHRocm91Z2ggdGhlIGtleU1hcCwgd2UgY2FuIGFsd2F5cyBhZGQgaXRcbiAgICAvLyBiYWNrLlxuICAgIGlmIChjdXJyZW50Tm9kZSAmJiBnZXREYXRhKGN1cnJlbnROb2RlKS5rZXkpIHtcbiAgICAgIGN1cnJlbnRQYXJlbnQucmVwbGFjZUNoaWxkKG5vZGUsIGN1cnJlbnROb2RlKTtcbiAgICAgIGdldERhdGEoY3VycmVudFBhcmVudCkua2V5TWFwVmFsaWQgPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgY3VycmVudFBhcmVudC5pbnNlcnRCZWZvcmUobm9kZSwgY3VycmVudE5vZGUpO1xuICAgIH1cblxuICAgIGN1cnJlbnROb2RlID0gbm9kZTtcbiAgfTtcblxuICAvKipcbiAgICogQ2xlYXJzIG91dCBhbnkgdW52aXNpdGVkIE5vZGVzLCBhcyB0aGUgY29ycmVzcG9uZGluZyB2aXJ0dWFsIGVsZW1lbnRcbiAgICogZnVuY3Rpb25zIHdlcmUgbmV2ZXIgY2FsbGVkIGZvciB0aGVtLlxuICAgKi9cbiAgdmFyIGNsZWFyVW52aXNpdGVkRE9NID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBub2RlID0gY3VycmVudFBhcmVudDtcbiAgICB2YXIgZGF0YSA9IGdldERhdGEobm9kZSk7XG4gICAgdmFyIGtleU1hcCA9IGRhdGEua2V5TWFwO1xuICAgIHZhciBrZXlNYXBWYWxpZCA9IGRhdGEua2V5TWFwVmFsaWQ7XG4gICAgdmFyIGNoaWxkID0gbm9kZS5sYXN0Q2hpbGQ7XG4gICAgdmFyIGtleSA9IHVuZGVmaW5lZDtcblxuICAgIGlmIChjaGlsZCA9PT0gY3VycmVudE5vZGUgJiYga2V5TWFwVmFsaWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZGF0YS5hdHRyc1tzeW1ib2xzLnBsYWNlaG9sZGVyXSAmJiBub2RlICE9PSByb290KSB7XG4gICAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgd2hpbGUgKGNoaWxkICE9PSBjdXJyZW50Tm9kZSkge1xuICAgICAgbm9kZS5yZW1vdmVDaGlsZChjaGlsZCk7XG4gICAgICBjb250ZXh0Lm1hcmtEZWxldGVkKCAvKiogQHR5cGUgeyFOb2RlfSovY2hpbGQpO1xuXG4gICAgICBrZXkgPSBnZXREYXRhKGNoaWxkKS5rZXk7XG4gICAgICBpZiAoa2V5KSB7XG4gICAgICAgIGRlbGV0ZSBrZXlNYXBba2V5XTtcbiAgICAgIH1cbiAgICAgIGNoaWxkID0gbm9kZS5sYXN0Q2hpbGQ7XG4gICAgfVxuXG4gICAgLy8gQ2xlYW4gdGhlIGtleU1hcCwgcmVtb3ZpbmcgYW55IHVudXN1ZWQga2V5cy5cbiAgICBpZiAoIWtleU1hcFZhbGlkKSB7XG4gICAgICBmb3IgKGtleSBpbiBrZXlNYXApIHtcbiAgICAgICAgY2hpbGQgPSBrZXlNYXBba2V5XTtcbiAgICAgICAgaWYgKGNoaWxkLnBhcmVudE5vZGUgIT09IG5vZGUpIHtcbiAgICAgICAgICBjb250ZXh0Lm1hcmtEZWxldGVkKGNoaWxkKTtcbiAgICAgICAgICBkZWxldGUga2V5TWFwW2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZGF0YS5rZXlNYXBWYWxpZCA9IHRydWU7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBDaGFuZ2VzIHRvIHRoZSBmaXJzdCBjaGlsZCBvZiB0aGUgY3VycmVudCBub2RlLlxuICAgKi9cbiAgdmFyIGVudGVyTm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBjdXJyZW50UGFyZW50ID0gY3VycmVudE5vZGU7XG4gICAgY3VycmVudE5vZGUgPSBudWxsO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDaGFuZ2VzIHRvIHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhlIGN1cnJlbnQgbm9kZS5cbiAgICovXG4gIHZhciBuZXh0Tm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoY3VycmVudE5vZGUpIHtcbiAgICAgIGN1cnJlbnROb2RlID0gY3VycmVudE5vZGUubmV4dFNpYmxpbmc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGN1cnJlbnROb2RlID0gY3VycmVudFBhcmVudC5maXJzdENoaWxkO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQ2hhbmdlcyB0byB0aGUgcGFyZW50IG9mIHRoZSBjdXJyZW50IG5vZGUsIHJlbW92aW5nIGFueSB1bnZpc2l0ZWQgY2hpbGRyZW4uXG4gICAqL1xuICB2YXIgZXhpdE5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgY2xlYXJVbnZpc2l0ZWRET00oKTtcblxuICAgIGN1cnJlbnROb2RlID0gY3VycmVudFBhcmVudDtcbiAgICBjdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudC5wYXJlbnROb2RlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBNYWtlcyBzdXJlIHRoYXQgdGhlIGN1cnJlbnQgbm9kZSBpcyBhbiBFbGVtZW50IHdpdGggYSBtYXRjaGluZyB0YWdOYW1lIGFuZFxuICAgKiBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICAgKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gICAqICAgICB3aGVuIGl0ZXJhdGluZyBvdmVyIGFuIGFycmF5IG9mIGl0ZW1zLlxuICAgKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gICAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICAgKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICAgKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAgICovXG4gIHZhciBjb3JlRWxlbWVudE9wZW4gPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MpIHtcbiAgICBuZXh0Tm9kZSgpO1xuICAgIGFsaWduV2l0aERPTSh0YWcsIGtleSwgc3RhdGljcyk7XG4gICAgZW50ZXJOb2RlKCk7XG4gICAgcmV0dXJuICgvKiogQHR5cGUgeyFFbGVtZW50fSAqL2N1cnJlbnRQYXJlbnRcbiAgICApO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDbG9zZXMgdGhlIGN1cnJlbnRseSBvcGVuIEVsZW1lbnQsIHJlbW92aW5nIGFueSB1bnZpc2l0ZWQgY2hpbGRyZW4gaWZcbiAgICogbmVjZXNzYXJ5LlxuICAgKlxuICAgKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAgICovXG4gIHZhciBjb3JlRWxlbWVudENsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICAgIGV4aXROb2RlKCk7XG4gICAgcmV0dXJuICgvKiogQHR5cGUgeyFFbGVtZW50fSAqL2N1cnJlbnROb2RlXG4gICAgKTtcbiAgfTtcblxuICAvKipcbiAgICogTWFrZXMgc3VyZSB0aGUgY3VycmVudCBub2RlIGlzIGEgVGV4dCBub2RlIGFuZCBjcmVhdGVzIGEgVGV4dCBub2RlIGlmIGl0IGlzXG4gICAqIG5vdC5cbiAgICpcbiAgICogQHJldHVybiB7IVRleHR9IFRoZSBjb3JyZXNwb25kaW5nIFRleHQgTm9kZS5cbiAgICovXG4gIHZhciBjb3JlVGV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICBuZXh0Tm9kZSgpO1xuICAgIGFsaWduV2l0aERPTSgnI3RleHQnLCBudWxsLCBudWxsKTtcbiAgICByZXR1cm4gKC8qKiBAdHlwZSB7IVRleHR9ICovY3VycmVudE5vZGVcbiAgICApO1xuICB9O1xuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IEVsZW1lbnQgYmVpbmcgcGF0Y2hlZC5cbiAgICogQHJldHVybiB7IUVsZW1lbnR9XG4gICAqL1xuICB2YXIgY3VycmVudEVsZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuICAgIHJldHVybiAoLyoqIEB0eXBlIHshRWxlbWVudH0gKi9jdXJyZW50UGFyZW50XG4gICAgKTtcbiAgfTtcblxuICAvKipcbiAgICogU2tpcHMgdGhlIGNoaWxkcmVuIGluIGEgc3VidHJlZSwgYWxsb3dpbmcgYW4gRWxlbWVudCB0byBiZSBjbG9zZWQgd2l0aG91dFxuICAgKiBjbGVhcmluZyBvdXQgdGhlIGNoaWxkcmVuLlxuICAgKi9cbiAgdmFyIHNraXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuICAgIGN1cnJlbnROb2RlID0gY3VycmVudFBhcmVudC5sYXN0Q2hpbGQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIFRoZSBvZmZzZXQgaW4gdGhlIHZpcnR1YWwgZWxlbWVudCBkZWNsYXJhdGlvbiB3aGVyZSB0aGUgYXR0cmlidXRlcyBhcmVcbiAgICogc3BlY2lmaWVkLlxuICAgKiBAY29uc3RcbiAgICovXG4gIHZhciBBVFRSSUJVVEVTX09GRlNFVCA9IDM7XG5cbiAgLyoqXG4gICAqIEJ1aWxkcyBhbiBhcnJheSBvZiBhcmd1bWVudHMgZm9yIHVzZSB3aXRoIGVsZW1lbnRPcGVuU3RhcnQsIGF0dHIgYW5kXG4gICAqIGVsZW1lbnRPcGVuRW5kLlxuICAgKiBAY29uc3Qge0FycmF5PCo+fVxuICAgKi9cbiAgdmFyIGFyZ3NCdWlsZGVyID0gW107XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICAgKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gICAqICAgICB3aGVuIGl0ZXJhdGluZyBvdmVyIGFuIGFycmF5IG9mIGl0ZW1zLlxuICAgKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gICAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICAgKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICAgKiBAcGFyYW0gey4uLip9IGNvbnN0X2FyZ3MgQXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlIGR5bmFtaWMgYXR0cmlidXRlc1xuICAgKiAgICAgZm9yIHRoZSBFbGVtZW50LlxuICAgKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAgICovXG4gIHZhciBlbGVtZW50T3BlbiA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcywgY29uc3RfYXJncykge1xuICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICAgIHZhciBub2RlID0gY29yZUVsZW1lbnRPcGVuKHRhZywga2V5LCBzdGF0aWNzKTtcbiAgICB2YXIgZGF0YSA9IGdldERhdGEobm9kZSk7XG5cbiAgICAvKlxuICAgICAqIENoZWNrcyB0byBzZWUgaWYgb25lIG9yIG1vcmUgYXR0cmlidXRlcyBoYXZlIGNoYW5nZWQgZm9yIGEgZ2l2ZW4gRWxlbWVudC5cbiAgICAgKiBXaGVuIG5vIGF0dHJpYnV0ZXMgaGF2ZSBjaGFuZ2VkLCB0aGlzIGlzIG11Y2ggZmFzdGVyIHRoYW4gY2hlY2tpbmcgZWFjaFxuICAgICAqIGluZGl2aWR1YWwgYXJndW1lbnQuIFdoZW4gYXR0cmlidXRlcyBoYXZlIGNoYW5nZWQsIHRoZSBvdmVyaGVhZCBvZiB0aGlzIGlzXG4gICAgICogbWluaW1hbC5cbiAgICAgKi9cbiAgICB2YXIgYXR0cnNBcnIgPSBkYXRhLmF0dHJzQXJyO1xuICAgIHZhciBuZXdBdHRycyA9IGRhdGEubmV3QXR0cnM7XG4gICAgdmFyIGF0dHJzQ2hhbmdlZCA9IGZhbHNlO1xuICAgIHZhciBpID0gQVRUUklCVVRFU19PRkZTRVQ7XG4gICAgdmFyIGogPSAwO1xuXG4gICAgZm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDEsIGogKz0gMSkge1xuICAgICAgaWYgKGF0dHJzQXJyW2pdICE9PSBhcmd1bWVudHNbaV0pIHtcbiAgICAgICAgYXR0cnNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDEsIGogKz0gMSkge1xuICAgICAgYXR0cnNBcnJbal0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgaWYgKGogPCBhdHRyc0Fyci5sZW5ndGgpIHtcbiAgICAgIGF0dHJzQ2hhbmdlZCA9IHRydWU7XG4gICAgICBhdHRyc0Fyci5sZW5ndGggPSBqO1xuICAgIH1cblxuICAgIC8qXG4gICAgICogQWN0dWFsbHkgcGVyZm9ybSB0aGUgYXR0cmlidXRlIHVwZGF0ZS5cbiAgICAgKi9cbiAgICBpZiAoYXR0cnNDaGFuZ2VkKSB7XG4gICAgICBmb3IgKGkgPSBBVFRSSUJVVEVTX09GRlNFVDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICBuZXdBdHRyc1thcmd1bWVudHNbaV1dID0gYXJndW1lbnRzW2kgKyAxXTtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgX2F0dHIgaW4gbmV3QXR0cnMpIHtcbiAgICAgICAgdXBkYXRlQXR0cmlidXRlKG5vZGUsIF9hdHRyLCBuZXdBdHRyc1tfYXR0cl0pO1xuICAgICAgICBuZXdBdHRyc1tfYXR0cl0gPSB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vZGU7XG4gIH07XG5cbiAgLyoqXG4gICAqIERlY2xhcmVzIGEgdmlydHVhbCBFbGVtZW50IGF0IHRoZSBjdXJyZW50IGxvY2F0aW9uIGluIHRoZSBkb2N1bWVudC4gVGhpc1xuICAgKiBjb3JyZXNwb25kcyB0byBhbiBvcGVuaW5nIHRhZyBhbmQgYSBlbGVtZW50Q2xvc2UgdGFnIGlzIHJlcXVpcmVkLiBUaGlzIGlzXG4gICAqIGxpa2UgZWxlbWVudE9wZW4sIGJ1dCB0aGUgYXR0cmlidXRlcyBhcmUgZGVmaW5lZCB1c2luZyB0aGUgYXR0ciBmdW5jdGlvblxuICAgKiByYXRoZXIgdGhhbiBiZWluZyBwYXNzZWQgYXMgYXJndW1lbnRzLiBNdXN0IGJlIGZvbGxsb3dlZCBieSAwIG9yIG1vcmUgY2FsbHNcbiAgICogdG8gYXR0ciwgdGhlbiBhIGNhbGwgdG8gZWxlbWVudE9wZW5FbmQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICAgKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gICAqICAgICB3aGVuIGl0ZXJhdGluZyBvdmVyIGFuIGFycmF5IG9mIGl0ZW1zLlxuICAgKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gICAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICAgKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICAgKi9cbiAgdmFyIGVsZW1lbnRPcGVuU3RhcnQgPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MpIHtcbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgICBhcmdzQnVpbGRlclswXSA9IHRhZztcbiAgICBhcmdzQnVpbGRlclsxXSA9IGtleTtcbiAgICBhcmdzQnVpbGRlclsyXSA9IHN0YXRpY3M7XG4gIH07XG5cbiAgLyoqKlxuICAgKiBEZWZpbmVzIGEgdmlydHVhbCBhdHRyaWJ1dGUgYXQgdGhpcyBwb2ludCBvZiB0aGUgRE9NLiBUaGlzIGlzIG9ubHkgdmFsaWRcbiAgICogd2hlbiBjYWxsZWQgYmV0d2VlbiBlbGVtZW50T3BlblN0YXJ0IGFuZCBlbGVtZW50T3BlbkVuZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICogQHBhcmFtIHsqfSB2YWx1ZVxuICAgKi9cbiAgdmFyIGF0dHIgPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgICBhcmdzQnVpbGRlci5wdXNoKG5hbWUsIHZhbHVlKTtcbiAgfTtcblxuICAvKipcbiAgICogQ2xvc2VzIGFuIG9wZW4gdGFnIHN0YXJ0ZWQgd2l0aCBlbGVtZW50T3BlblN0YXJ0LlxuICAgKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAgICovXG4gIHZhciBlbGVtZW50T3BlbkVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgICB2YXIgbm9kZSA9IGVsZW1lbnRPcGVuLmFwcGx5KG51bGwsIGFyZ3NCdWlsZGVyKTtcbiAgICBhcmdzQnVpbGRlci5sZW5ndGggPSAwO1xuICAgIHJldHVybiBub2RlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDbG9zZXMgYW4gb3BlbiB2aXJ0dWFsIEVsZW1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gICAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICAgKi9cbiAgdmFyIGVsZW1lbnRDbG9zZSA9IGZ1bmN0aW9uICh0YWcpIHtcbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgICB2YXIgbm9kZSA9IGNvcmVFbGVtZW50Q2xvc2UoKTtcblxuICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICAgIHJldHVybiBub2RlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZWNsYXJlcyBhIHZpcnR1YWwgRWxlbWVudCBhdCB0aGUgY3VycmVudCBsb2NhdGlvbiBpbiB0aGUgZG9jdW1lbnQgdGhhdCBoYXNcbiAgICogbm8gY2hpbGRyZW4uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LiBUaGlzIGNhbiBiZSBhblxuICAgKiAgICAgZW1wdHkgc3RyaW5nLCBidXQgcGVyZm9ybWFuY2UgbWF5IGJlIGJldHRlciBpZiBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkXG4gICAqICAgICB3aGVuIGl0ZXJhdGluZyBvdmVyIGFuIGFycmF5IG9mIGl0ZW1zLlxuICAgKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gICAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICAgKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICAgKiBAcGFyYW0gey4uLip9IGNvbnN0X2FyZ3MgQXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlIGR5bmFtaWMgYXR0cmlidXRlc1xuICAgKiAgICAgZm9yIHRoZSBFbGVtZW50LlxuICAgKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAgICovXG4gIHZhciBlbGVtZW50Vm9pZCA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcywgY29uc3RfYXJncykge1xuICAgIGVsZW1lbnRPcGVuLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIGVsZW1lbnRDbG9zZSh0YWcpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZWNsYXJlcyBhIHZpcnR1YWwgRWxlbWVudCBhdCB0aGUgY3VycmVudCBsb2NhdGlvbiBpbiB0aGUgZG9jdW1lbnQgdGhhdCBpcyBhXG4gICAqIHBsYWNlaG9sZGVyIGVsZW1lbnQuIENoaWxkcmVuIG9mIHRoaXMgRWxlbWVudCBjYW4gYmUgbWFudWFsbHkgbWFuYWdlZCBhbmRcbiAgICogd2lsbCBub3QgYmUgY2xlYXJlZCBieSB0aGUgbGlicmFyeS5cbiAgICpcbiAgICogQSBrZXkgbXVzdCBiZSBzcGVjaWZpZWQgdG8gbWFrZSBzdXJlIHRoYXQgdGhpcyBub2RlIGlzIGNvcnJlY3RseSBwcmVzZXJ2ZWRcbiAgICogYWNyb3NzIGFsbCBjb25kaXRpb25hbHMuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGVsZW1lbnQncyB0YWcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC5cbiAgICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZVxuICAgKiAgICAgc3RhdGljIGF0dHJpYnV0ZXMgZm9yIHRoZSBFbGVtZW50LiBUaGVzZSB3aWxsIG9ubHkgYmUgc2V0IG9uY2Ugd2hlbiB0aGVcbiAgICogICAgIEVsZW1lbnQgaXMgY3JlYXRlZC5cbiAgICogQHBhcmFtIHsuLi4qfSBjb25zdF9hcmdzIEF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzIG9mIHRoZSBkeW5hbWljIGF0dHJpYnV0ZXNcbiAgICogICAgIGZvciB0aGUgRWxlbWVudC5cbiAgICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gICAqL1xuICB2YXIgZWxlbWVudFBsYWNlaG9sZGVyID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzLCBjb25zdF9hcmdzKSB7XG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gICAgZWxlbWVudE9wZW4uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICBza2lwKCk7XG4gICAgcmV0dXJuIGVsZW1lbnRDbG9zZSh0YWcpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZWNsYXJlcyBhIHZpcnR1YWwgVGV4dCBhdCB0aGlzIHBvaW50IGluIHRoZSBkb2N1bWVudC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfGJvb2xlYW59IHZhbHVlIFRoZSB2YWx1ZSBvZiB0aGUgVGV4dC5cbiAgICogQHBhcmFtIHsuLi4oZnVuY3Rpb24oKHN0cmluZ3xudW1iZXJ8Ym9vbGVhbikpOnN0cmluZyl9IGNvbnN0X2FyZ3NcbiAgICogICAgIEZ1bmN0aW9ucyB0byBmb3JtYXQgdGhlIHZhbHVlIHdoaWNoIGFyZSBjYWxsZWQgb25seSB3aGVuIHRoZSB2YWx1ZSBoYXNcbiAgICogICAgIGNoYW5nZWQuXG4gICAqIEByZXR1cm4geyFUZXh0fSBUaGUgY29ycmVzcG9uZGluZyB0ZXh0IG5vZGUuXG4gICAqL1xuICB2YXIgdGV4dCA9IGZ1bmN0aW9uICh2YWx1ZSwgY29uc3RfYXJncykge1xuICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICAgIHZhciBub2RlID0gY29yZVRleHQoKTtcbiAgICB2YXIgZGF0YSA9IGdldERhdGEobm9kZSk7XG5cbiAgICBpZiAoZGF0YS50ZXh0ICE9PSB2YWx1ZSkge1xuICAgICAgZGF0YS50ZXh0ID0gLyoqIEB0eXBlIHtzdHJpbmd9ICovdmFsdWU7XG5cbiAgICAgIHZhciBmb3JtYXR0ZWQgPSB2YWx1ZTtcbiAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIC8qXG4gICAgICAgICAqIENhbGwgdGhlIGZvcm1hdHRlciBmdW5jdGlvbiBkaXJlY3RseSB0byBwcmV2ZW50IGxlYWtpbmcgYXJndW1lbnRzLlxuICAgICAgICAgKiBodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlL2luY3JlbWVudGFsLWRvbS9wdWxsLzIwNCNpc3N1ZWNvbW1lbnQtMTc4MjIzNTc0XG4gICAgICAgICAqL1xuICAgICAgICB2YXIgZm4gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGZvcm1hdHRlZCA9IGZuKGZvcm1hdHRlZCk7XG4gICAgICB9XG5cbiAgICAgIG5vZGUuZGF0YSA9IGZvcm1hdHRlZDtcbiAgICB9XG5cbiAgICByZXR1cm4gbm9kZTtcbiAgfTtcblxuICBleHBvcnRzLnBhdGNoID0gcGF0Y2hJbm5lcjtcbiAgZXhwb3J0cy5wYXRjaElubmVyID0gcGF0Y2hJbm5lcjtcbiAgZXhwb3J0cy5wYXRjaE91dGVyID0gcGF0Y2hPdXRlcjtcbiAgZXhwb3J0cy5jdXJyZW50RWxlbWVudCA9IGN1cnJlbnRFbGVtZW50O1xuICBleHBvcnRzLnNraXAgPSBza2lwO1xuICBleHBvcnRzLmVsZW1lbnRWb2lkID0gZWxlbWVudFZvaWQ7XG4gIGV4cG9ydHMuZWxlbWVudE9wZW5TdGFydCA9IGVsZW1lbnRPcGVuU3RhcnQ7XG4gIGV4cG9ydHMuZWxlbWVudE9wZW5FbmQgPSBlbGVtZW50T3BlbkVuZDtcbiAgZXhwb3J0cy5lbGVtZW50T3BlbiA9IGVsZW1lbnRPcGVuO1xuICBleHBvcnRzLmVsZW1lbnRDbG9zZSA9IGVsZW1lbnRDbG9zZTtcbiAgZXhwb3J0cy5lbGVtZW50UGxhY2Vob2xkZXIgPSBlbGVtZW50UGxhY2Vob2xkZXI7XG4gIGV4cG9ydHMudGV4dCA9IHRleHQ7XG4gIGV4cG9ydHMuYXR0ciA9IGF0dHI7XG4gIGV4cG9ydHMuc3ltYm9scyA9IHN5bWJvbHM7XG4gIGV4cG9ydHMuYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXM7XG4gIGV4cG9ydHMuYXBwbHlBdHRyID0gYXBwbHlBdHRyO1xuICBleHBvcnRzLmFwcGx5UHJvcCA9IGFwcGx5UHJvcDtcbiAgZXhwb3J0cy5ub3RpZmljYXRpb25zID0gbm90aWZpY2F0aW9ucztcblxufSkpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmNyZW1lbnRhbC1kb20uanMubWFwIiwiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IChjKSAyMDE0IFRoZSBQb2x5bWVyIFByb2plY3QgQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFRoaXMgY29kZSBtYXkgb25seSBiZSB1c2VkIHVuZGVyIHRoZSBCU0Qgc3R5bGUgbGljZW5zZSBmb3VuZCBhdCBodHRwOi8vcG9seW1lci5naXRodWIuaW8vTElDRU5TRS50eHRcbiAqIFRoZSBjb21wbGV0ZSBzZXQgb2YgYXV0aG9ycyBtYXkgYmUgZm91bmQgYXQgaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0FVVEhPUlMudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGNvbnRyaWJ1dG9ycyBtYXkgYmUgZm91bmQgYXQgaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0NPTlRSSUJVVE9SUy50eHRcbiAqIENvZGUgZGlzdHJpYnV0ZWQgYnkgR29vZ2xlIGFzIHBhcnQgb2YgdGhlIHBvbHltZXIgcHJvamVjdCBpcyBhbHNvXG4gKiBzdWJqZWN0IHRvIGFuIGFkZGl0aW9uYWwgSVAgcmlnaHRzIGdyYW50IGZvdW5kIGF0IGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9QQVRFTlRTLnR4dFxuICovXG4vLyBAdmVyc2lvbiAwLjcuMjJcbmlmICh0eXBlb2YgV2Vha01hcCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRlZmluZVByb3BlcnR5ID0gT2JqZWN0LmRlZmluZVByb3BlcnR5O1xuICAgIHZhciBjb3VudGVyID0gRGF0ZS5ub3coKSAlIDFlOTtcbiAgICB2YXIgV2Vha01hcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5uYW1lID0gXCJfX3N0XCIgKyAoTWF0aC5yYW5kb20oKSAqIDFlOSA+Pj4gMCkgKyAoY291bnRlcisrICsgXCJfX1wiKTtcbiAgICB9O1xuICAgIFdlYWtNYXAucHJvdG90eXBlID0ge1xuICAgICAgc2V0OiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgIHZhciBlbnRyeSA9IGtleVt0aGlzLm5hbWVdO1xuICAgICAgICBpZiAoZW50cnkgJiYgZW50cnlbMF0gPT09IGtleSkgZW50cnlbMV0gPSB2YWx1ZTsgZWxzZSBkZWZpbmVQcm9wZXJ0eShrZXksIHRoaXMubmFtZSwge1xuICAgICAgICAgIHZhbHVlOiBbIGtleSwgdmFsdWUgXSxcbiAgICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuICAgICAgZ2V0OiBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgdmFyIGVudHJ5O1xuICAgICAgICByZXR1cm4gKGVudHJ5ID0ga2V5W3RoaXMubmFtZV0pICYmIGVudHJ5WzBdID09PSBrZXkgPyBlbnRyeVsxXSA6IHVuZGVmaW5lZDtcbiAgICAgIH0sXG4gICAgICBcImRlbGV0ZVwiOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgdmFyIGVudHJ5ID0ga2V5W3RoaXMubmFtZV07XG4gICAgICAgIGlmICghZW50cnkgfHwgZW50cnlbMF0gIT09IGtleSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBlbnRyeVswXSA9IGVudHJ5WzFdID0gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG4gICAgICBoYXM6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICB2YXIgZW50cnkgPSBrZXlbdGhpcy5uYW1lXTtcbiAgICAgICAgaWYgKCFlbnRyeSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICByZXR1cm4gZW50cnlbMF0gPT09IGtleTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHdpbmRvdy5XZWFrTWFwID0gV2Vha01hcDtcbiAgfSkoKTtcbn1cblxuKGZ1bmN0aW9uKGdsb2JhbCkge1xuICBpZiAoZ2xvYmFsLkpzTXV0YXRpb25PYnNlcnZlcikge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgcmVnaXN0cmF0aW9uc1RhYmxlID0gbmV3IFdlYWtNYXAoKTtcbiAgdmFyIHNldEltbWVkaWF0ZTtcbiAgaWYgKC9UcmlkZW50fEVkZ2UvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICBzZXRJbW1lZGlhdGUgPSBzZXRUaW1lb3V0O1xuICB9IGVsc2UgaWYgKHdpbmRvdy5zZXRJbW1lZGlhdGUpIHtcbiAgICBzZXRJbW1lZGlhdGUgPSB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICB9IGVsc2Uge1xuICAgIHZhciBzZXRJbW1lZGlhdGVRdWV1ZSA9IFtdO1xuICAgIHZhciBzZW50aW5lbCA9IFN0cmluZyhNYXRoLnJhbmRvbSgpKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKGUuZGF0YSA9PT0gc2VudGluZWwpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gc2V0SW1tZWRpYXRlUXVldWU7XG4gICAgICAgIHNldEltbWVkaWF0ZVF1ZXVlID0gW107XG4gICAgICAgIHF1ZXVlLmZvckVhY2goZnVuY3Rpb24oZnVuYykge1xuICAgICAgICAgIGZ1bmMoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgc2V0SW1tZWRpYXRlID0gZnVuY3Rpb24oZnVuYykge1xuICAgICAgc2V0SW1tZWRpYXRlUXVldWUucHVzaChmdW5jKTtcbiAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZShzZW50aW5lbCwgXCIqXCIpO1xuICAgIH07XG4gIH1cbiAgdmFyIGlzU2NoZWR1bGVkID0gZmFsc2U7XG4gIHZhciBzY2hlZHVsZWRPYnNlcnZlcnMgPSBbXTtcbiAgZnVuY3Rpb24gc2NoZWR1bGVDYWxsYmFjayhvYnNlcnZlcikge1xuICAgIHNjaGVkdWxlZE9ic2VydmVycy5wdXNoKG9ic2VydmVyKTtcbiAgICBpZiAoIWlzU2NoZWR1bGVkKSB7XG4gICAgICBpc1NjaGVkdWxlZCA9IHRydWU7XG4gICAgICBzZXRJbW1lZGlhdGUoZGlzcGF0Y2hDYWxsYmFja3MpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiB3cmFwSWZOZWVkZWQobm9kZSkge1xuICAgIHJldHVybiB3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwgJiYgd2luZG93LlNoYWRvd0RPTVBvbHlmaWxsLndyYXBJZk5lZWRlZChub2RlKSB8fCBub2RlO1xuICB9XG4gIGZ1bmN0aW9uIGRpc3BhdGNoQ2FsbGJhY2tzKCkge1xuICAgIGlzU2NoZWR1bGVkID0gZmFsc2U7XG4gICAgdmFyIG9ic2VydmVycyA9IHNjaGVkdWxlZE9ic2VydmVycztcbiAgICBzY2hlZHVsZWRPYnNlcnZlcnMgPSBbXTtcbiAgICBvYnNlcnZlcnMuc29ydChmdW5jdGlvbihvMSwgbzIpIHtcbiAgICAgIHJldHVybiBvMS51aWRfIC0gbzIudWlkXztcbiAgICB9KTtcbiAgICB2YXIgYW55Tm9uRW1wdHkgPSBmYWxzZTtcbiAgICBvYnNlcnZlcnMuZm9yRWFjaChmdW5jdGlvbihvYnNlcnZlcikge1xuICAgICAgdmFyIHF1ZXVlID0gb2JzZXJ2ZXIudGFrZVJlY29yZHMoKTtcbiAgICAgIHJlbW92ZVRyYW5zaWVudE9ic2VydmVyc0ZvcihvYnNlcnZlcik7XG4gICAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIG9ic2VydmVyLmNhbGxiYWNrXyhxdWV1ZSwgb2JzZXJ2ZXIpO1xuICAgICAgICBhbnlOb25FbXB0eSA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKGFueU5vbkVtcHR5KSBkaXNwYXRjaENhbGxiYWNrcygpO1xuICB9XG4gIGZ1bmN0aW9uIHJlbW92ZVRyYW5zaWVudE9ic2VydmVyc0ZvcihvYnNlcnZlcikge1xuICAgIG9ic2VydmVyLm5vZGVzXy5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldChub2RlKTtcbiAgICAgIGlmICghcmVnaXN0cmF0aW9ucykgcmV0dXJuO1xuICAgICAgcmVnaXN0cmF0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKHJlZ2lzdHJhdGlvbikge1xuICAgICAgICBpZiAocmVnaXN0cmF0aW9uLm9ic2VydmVyID09PSBvYnNlcnZlcikgcmVnaXN0cmF0aW9uLnJlbW92ZVRyYW5zaWVudE9ic2VydmVycygpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gZm9yRWFjaEFuY2VzdG9yQW5kT2JzZXJ2ZXJFbnF1ZXVlUmVjb3JkKHRhcmdldCwgY2FsbGJhY2spIHtcbiAgICBmb3IgKHZhciBub2RlID0gdGFyZ2V0OyBub2RlOyBub2RlID0gbm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQobm9kZSk7XG4gICAgICBpZiAocmVnaXN0cmF0aW9ucykge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJlZ2lzdHJhdGlvbnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICB2YXIgcmVnaXN0cmF0aW9uID0gcmVnaXN0cmF0aW9uc1tqXTtcbiAgICAgICAgICB2YXIgb3B0aW9ucyA9IHJlZ2lzdHJhdGlvbi5vcHRpb25zO1xuICAgICAgICAgIGlmIChub2RlICE9PSB0YXJnZXQgJiYgIW9wdGlvbnMuc3VidHJlZSkgY29udGludWU7XG4gICAgICAgICAgdmFyIHJlY29yZCA9IGNhbGxiYWNrKG9wdGlvbnMpO1xuICAgICAgICAgIGlmIChyZWNvcmQpIHJlZ2lzdHJhdGlvbi5lbnF1ZXVlKHJlY29yZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdmFyIHVpZENvdW50ZXIgPSAwO1xuICBmdW5jdGlvbiBKc011dGF0aW9uT2JzZXJ2ZXIoY2FsbGJhY2spIHtcbiAgICB0aGlzLmNhbGxiYWNrXyA9IGNhbGxiYWNrO1xuICAgIHRoaXMubm9kZXNfID0gW107XG4gICAgdGhpcy5yZWNvcmRzXyA9IFtdO1xuICAgIHRoaXMudWlkXyA9ICsrdWlkQ291bnRlcjtcbiAgfVxuICBKc011dGF0aW9uT2JzZXJ2ZXIucHJvdG90eXBlID0ge1xuICAgIG9ic2VydmU6IGZ1bmN0aW9uKHRhcmdldCwgb3B0aW9ucykge1xuICAgICAgdGFyZ2V0ID0gd3JhcElmTmVlZGVkKHRhcmdldCk7XG4gICAgICBpZiAoIW9wdGlvbnMuY2hpbGRMaXN0ICYmICFvcHRpb25zLmF0dHJpYnV0ZXMgJiYgIW9wdGlvbnMuY2hhcmFjdGVyRGF0YSB8fCBvcHRpb25zLmF0dHJpYnV0ZU9sZFZhbHVlICYmICFvcHRpb25zLmF0dHJpYnV0ZXMgfHwgb3B0aW9ucy5hdHRyaWJ1dGVGaWx0ZXIgJiYgb3B0aW9ucy5hdHRyaWJ1dGVGaWx0ZXIubGVuZ3RoICYmICFvcHRpb25zLmF0dHJpYnV0ZXMgfHwgb3B0aW9ucy5jaGFyYWN0ZXJEYXRhT2xkVmFsdWUgJiYgIW9wdGlvbnMuY2hhcmFjdGVyRGF0YSkge1xuICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoKTtcbiAgICAgIH1cbiAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldCh0YXJnZXQpO1xuICAgICAgaWYgKCFyZWdpc3RyYXRpb25zKSByZWdpc3RyYXRpb25zVGFibGUuc2V0KHRhcmdldCwgcmVnaXN0cmF0aW9ucyA9IFtdKTtcbiAgICAgIHZhciByZWdpc3RyYXRpb247XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlZ2lzdHJhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbnNbaV0ub2JzZXJ2ZXIgPT09IHRoaXMpIHtcbiAgICAgICAgICByZWdpc3RyYXRpb24gPSByZWdpc3RyYXRpb25zW2ldO1xuICAgICAgICAgIHJlZ2lzdHJhdGlvbi5yZW1vdmVMaXN0ZW5lcnMoKTtcbiAgICAgICAgICByZWdpc3RyYXRpb24ub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghcmVnaXN0cmF0aW9uKSB7XG4gICAgICAgIHJlZ2lzdHJhdGlvbiA9IG5ldyBSZWdpc3RyYXRpb24odGhpcywgdGFyZ2V0LCBvcHRpb25zKTtcbiAgICAgICAgcmVnaXN0cmF0aW9ucy5wdXNoKHJlZ2lzdHJhdGlvbik7XG4gICAgICAgIHRoaXMubm9kZXNfLnB1c2godGFyZ2V0KTtcbiAgICAgIH1cbiAgICAgIHJlZ2lzdHJhdGlvbi5hZGRMaXN0ZW5lcnMoKTtcbiAgICB9LFxuICAgIGRpc2Nvbm5lY3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5ub2Rlc18uZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldChub2RlKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWdpc3RyYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbiA9IHJlZ2lzdHJhdGlvbnNbaV07XG4gICAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbi5vYnNlcnZlciA9PT0gdGhpcykge1xuICAgICAgICAgICAgcmVnaXN0cmF0aW9uLnJlbW92ZUxpc3RlbmVycygpO1xuICAgICAgICAgICAgcmVnaXN0cmF0aW9ucy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sIHRoaXMpO1xuICAgICAgdGhpcy5yZWNvcmRzXyA9IFtdO1xuICAgIH0sXG4gICAgdGFrZVJlY29yZHM6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGNvcHlPZlJlY29yZHMgPSB0aGlzLnJlY29yZHNfO1xuICAgICAgdGhpcy5yZWNvcmRzXyA9IFtdO1xuICAgICAgcmV0dXJuIGNvcHlPZlJlY29yZHM7XG4gICAgfVxuICB9O1xuICBmdW5jdGlvbiBNdXRhdGlvblJlY29yZCh0eXBlLCB0YXJnZXQpIHtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgIHRoaXMuYWRkZWROb2RlcyA9IFtdO1xuICAgIHRoaXMucmVtb3ZlZE5vZGVzID0gW107XG4gICAgdGhpcy5wcmV2aW91c1NpYmxpbmcgPSBudWxsO1xuICAgIHRoaXMubmV4dFNpYmxpbmcgPSBudWxsO1xuICAgIHRoaXMuYXR0cmlidXRlTmFtZSA9IG51bGw7XG4gICAgdGhpcy5hdHRyaWJ1dGVOYW1lc3BhY2UgPSBudWxsO1xuICAgIHRoaXMub2xkVmFsdWUgPSBudWxsO1xuICB9XG4gIGZ1bmN0aW9uIGNvcHlNdXRhdGlvblJlY29yZChvcmlnaW5hbCkge1xuICAgIHZhciByZWNvcmQgPSBuZXcgTXV0YXRpb25SZWNvcmQob3JpZ2luYWwudHlwZSwgb3JpZ2luYWwudGFyZ2V0KTtcbiAgICByZWNvcmQuYWRkZWROb2RlcyA9IG9yaWdpbmFsLmFkZGVkTm9kZXMuc2xpY2UoKTtcbiAgICByZWNvcmQucmVtb3ZlZE5vZGVzID0gb3JpZ2luYWwucmVtb3ZlZE5vZGVzLnNsaWNlKCk7XG4gICAgcmVjb3JkLnByZXZpb3VzU2libGluZyA9IG9yaWdpbmFsLnByZXZpb3VzU2libGluZztcbiAgICByZWNvcmQubmV4dFNpYmxpbmcgPSBvcmlnaW5hbC5uZXh0U2libGluZztcbiAgICByZWNvcmQuYXR0cmlidXRlTmFtZSA9IG9yaWdpbmFsLmF0dHJpYnV0ZU5hbWU7XG4gICAgcmVjb3JkLmF0dHJpYnV0ZU5hbWVzcGFjZSA9IG9yaWdpbmFsLmF0dHJpYnV0ZU5hbWVzcGFjZTtcbiAgICByZWNvcmQub2xkVmFsdWUgPSBvcmlnaW5hbC5vbGRWYWx1ZTtcbiAgICByZXR1cm4gcmVjb3JkO1xuICB9XG4gIHZhciBjdXJyZW50UmVjb3JkLCByZWNvcmRXaXRoT2xkVmFsdWU7XG4gIGZ1bmN0aW9uIGdldFJlY29yZCh0eXBlLCB0YXJnZXQpIHtcbiAgICByZXR1cm4gY3VycmVudFJlY29yZCA9IG5ldyBNdXRhdGlvblJlY29yZCh0eXBlLCB0YXJnZXQpO1xuICB9XG4gIGZ1bmN0aW9uIGdldFJlY29yZFdpdGhPbGRWYWx1ZShvbGRWYWx1ZSkge1xuICAgIGlmIChyZWNvcmRXaXRoT2xkVmFsdWUpIHJldHVybiByZWNvcmRXaXRoT2xkVmFsdWU7XG4gICAgcmVjb3JkV2l0aE9sZFZhbHVlID0gY29weU11dGF0aW9uUmVjb3JkKGN1cnJlbnRSZWNvcmQpO1xuICAgIHJlY29yZFdpdGhPbGRWYWx1ZS5vbGRWYWx1ZSA9IG9sZFZhbHVlO1xuICAgIHJldHVybiByZWNvcmRXaXRoT2xkVmFsdWU7XG4gIH1cbiAgZnVuY3Rpb24gY2xlYXJSZWNvcmRzKCkge1xuICAgIGN1cnJlbnRSZWNvcmQgPSByZWNvcmRXaXRoT2xkVmFsdWUgPSB1bmRlZmluZWQ7XG4gIH1cbiAgZnVuY3Rpb24gcmVjb3JkUmVwcmVzZW50c0N1cnJlbnRNdXRhdGlvbihyZWNvcmQpIHtcbiAgICByZXR1cm4gcmVjb3JkID09PSByZWNvcmRXaXRoT2xkVmFsdWUgfHwgcmVjb3JkID09PSBjdXJyZW50UmVjb3JkO1xuICB9XG4gIGZ1bmN0aW9uIHNlbGVjdFJlY29yZChsYXN0UmVjb3JkLCBuZXdSZWNvcmQpIHtcbiAgICBpZiAobGFzdFJlY29yZCA9PT0gbmV3UmVjb3JkKSByZXR1cm4gbGFzdFJlY29yZDtcbiAgICBpZiAocmVjb3JkV2l0aE9sZFZhbHVlICYmIHJlY29yZFJlcHJlc2VudHNDdXJyZW50TXV0YXRpb24obGFzdFJlY29yZCkpIHJldHVybiByZWNvcmRXaXRoT2xkVmFsdWU7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgZnVuY3Rpb24gUmVnaXN0cmF0aW9uKG9ic2VydmVyLCB0YXJnZXQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLm9ic2VydmVyID0gb2JzZXJ2ZXI7XG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLnRyYW5zaWVudE9ic2VydmVkTm9kZXMgPSBbXTtcbiAgfVxuICBSZWdpc3RyYXRpb24ucHJvdG90eXBlID0ge1xuICAgIGVucXVldWU6IGZ1bmN0aW9uKHJlY29yZCkge1xuICAgICAgdmFyIHJlY29yZHMgPSB0aGlzLm9ic2VydmVyLnJlY29yZHNfO1xuICAgICAgdmFyIGxlbmd0aCA9IHJlY29yZHMubGVuZ3RoO1xuICAgICAgaWYgKHJlY29yZHMubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgbGFzdFJlY29yZCA9IHJlY29yZHNbbGVuZ3RoIC0gMV07XG4gICAgICAgIHZhciByZWNvcmRUb1JlcGxhY2VMYXN0ID0gc2VsZWN0UmVjb3JkKGxhc3RSZWNvcmQsIHJlY29yZCk7XG4gICAgICAgIGlmIChyZWNvcmRUb1JlcGxhY2VMYXN0KSB7XG4gICAgICAgICAgcmVjb3Jkc1tsZW5ndGggLSAxXSA9IHJlY29yZFRvUmVwbGFjZUxhc3Q7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzY2hlZHVsZUNhbGxiYWNrKHRoaXMub2JzZXJ2ZXIpO1xuICAgICAgfVxuICAgICAgcmVjb3Jkc1tsZW5ndGhdID0gcmVjb3JkO1xuICAgIH0sXG4gICAgYWRkTGlzdGVuZXJzOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuYWRkTGlzdGVuZXJzXyh0aGlzLnRhcmdldCk7XG4gICAgfSxcbiAgICBhZGRMaXN0ZW5lcnNfOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgIGlmIChvcHRpb25zLmF0dHJpYnV0ZXMpIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUF0dHJNb2RpZmllZFwiLCB0aGlzLCB0cnVlKTtcbiAgICAgIGlmIChvcHRpb25zLmNoYXJhY3RlckRhdGEpIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNoYXJhY3RlckRhdGFNb2RpZmllZFwiLCB0aGlzLCB0cnVlKTtcbiAgICAgIGlmIChvcHRpb25zLmNoaWxkTGlzdCkgbm9kZS5hZGRFdmVudExpc3RlbmVyKFwiRE9NTm9kZUluc2VydGVkXCIsIHRoaXMsIHRydWUpO1xuICAgICAgaWYgKG9wdGlvbnMuY2hpbGRMaXN0IHx8IG9wdGlvbnMuc3VidHJlZSkgbm9kZS5hZGRFdmVudExpc3RlbmVyKFwiRE9NTm9kZVJlbW92ZWRcIiwgdGhpcywgdHJ1ZSk7XG4gICAgfSxcbiAgICByZW1vdmVMaXN0ZW5lcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcnNfKHRoaXMudGFyZ2V0KTtcbiAgICB9LFxuICAgIHJlbW92ZUxpc3RlbmVyc186IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgaWYgKG9wdGlvbnMuYXR0cmlidXRlcykgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiRE9NQXR0ck1vZGlmaWVkXCIsIHRoaXMsIHRydWUpO1xuICAgICAgaWYgKG9wdGlvbnMuY2hhcmFjdGVyRGF0YSkgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiRE9NQ2hhcmFjdGVyRGF0YU1vZGlmaWVkXCIsIHRoaXMsIHRydWUpO1xuICAgICAgaWYgKG9wdGlvbnMuY2hpbGRMaXN0KSBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJET01Ob2RlSW5zZXJ0ZWRcIiwgdGhpcywgdHJ1ZSk7XG4gICAgICBpZiAob3B0aW9ucy5jaGlsZExpc3QgfHwgb3B0aW9ucy5zdWJ0cmVlKSBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJET01Ob2RlUmVtb3ZlZFwiLCB0aGlzLCB0cnVlKTtcbiAgICB9LFxuICAgIGFkZFRyYW5zaWVudE9ic2VydmVyOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICBpZiAobm9kZSA9PT0gdGhpcy50YXJnZXQpIHJldHVybjtcbiAgICAgIHRoaXMuYWRkTGlzdGVuZXJzXyhub2RlKTtcbiAgICAgIHRoaXMudHJhbnNpZW50T2JzZXJ2ZWROb2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KG5vZGUpO1xuICAgICAgaWYgKCFyZWdpc3RyYXRpb25zKSByZWdpc3RyYXRpb25zVGFibGUuc2V0KG5vZGUsIHJlZ2lzdHJhdGlvbnMgPSBbXSk7XG4gICAgICByZWdpc3RyYXRpb25zLnB1c2godGhpcyk7XG4gICAgfSxcbiAgICByZW1vdmVUcmFuc2llbnRPYnNlcnZlcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHRyYW5zaWVudE9ic2VydmVkTm9kZXMgPSB0aGlzLnRyYW5zaWVudE9ic2VydmVkTm9kZXM7XG4gICAgICB0aGlzLnRyYW5zaWVudE9ic2VydmVkTm9kZXMgPSBbXTtcbiAgICAgIHRyYW5zaWVudE9ic2VydmVkTm9kZXMuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXJzXyhub2RlKTtcbiAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KG5vZGUpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlZ2lzdHJhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAocmVnaXN0cmF0aW9uc1tpXSA9PT0gdGhpcykge1xuICAgICAgICAgICAgcmVnaXN0cmF0aW9ucy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG4gICAgaGFuZGxlRXZlbnQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICBzd2l0Y2ggKGUudHlwZSkge1xuICAgICAgIGNhc2UgXCJET01BdHRyTW9kaWZpZWRcIjpcbiAgICAgICAgdmFyIG5hbWUgPSBlLmF0dHJOYW1lO1xuICAgICAgICB2YXIgbmFtZXNwYWNlID0gZS5yZWxhdGVkTm9kZS5uYW1lc3BhY2VVUkk7XG4gICAgICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICAgICAgdmFyIHJlY29yZCA9IG5ldyBnZXRSZWNvcmQoXCJhdHRyaWJ1dGVzXCIsIHRhcmdldCk7XG4gICAgICAgIHJlY29yZC5hdHRyaWJ1dGVOYW1lID0gbmFtZTtcbiAgICAgICAgcmVjb3JkLmF0dHJpYnV0ZU5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcbiAgICAgICAgdmFyIG9sZFZhbHVlID0gZS5hdHRyQ2hhbmdlID09PSBNdXRhdGlvbkV2ZW50LkFERElUSU9OID8gbnVsbCA6IGUucHJldlZhbHVlO1xuICAgICAgICBmb3JFYWNoQW5jZXN0b3JBbmRPYnNlcnZlckVucXVldWVSZWNvcmQodGFyZ2V0LCBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgICAgaWYgKCFvcHRpb25zLmF0dHJpYnV0ZXMpIHJldHVybjtcbiAgICAgICAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVGaWx0ZXIgJiYgb3B0aW9ucy5hdHRyaWJ1dGVGaWx0ZXIubGVuZ3RoICYmIG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyLmluZGV4T2YobmFtZSkgPT09IC0xICYmIG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyLmluZGV4T2YobmFtZXNwYWNlKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG9wdGlvbnMuYXR0cmlidXRlT2xkVmFsdWUpIHJldHVybiBnZXRSZWNvcmRXaXRoT2xkVmFsdWUob2xkVmFsdWUpO1xuICAgICAgICAgIHJldHVybiByZWNvcmQ7XG4gICAgICAgIH0pO1xuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJET01DaGFyYWN0ZXJEYXRhTW9kaWZpZWRcIjpcbiAgICAgICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0O1xuICAgICAgICB2YXIgcmVjb3JkID0gZ2V0UmVjb3JkKFwiY2hhcmFjdGVyRGF0YVwiLCB0YXJnZXQpO1xuICAgICAgICB2YXIgb2xkVmFsdWUgPSBlLnByZXZWYWx1ZTtcbiAgICAgICAgZm9yRWFjaEFuY2VzdG9yQW5kT2JzZXJ2ZXJFbnF1ZXVlUmVjb3JkKHRhcmdldCwgZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICAgIGlmICghb3B0aW9ucy5jaGFyYWN0ZXJEYXRhKSByZXR1cm47XG4gICAgICAgICAgaWYgKG9wdGlvbnMuY2hhcmFjdGVyRGF0YU9sZFZhbHVlKSByZXR1cm4gZ2V0UmVjb3JkV2l0aE9sZFZhbHVlKG9sZFZhbHVlKTtcbiAgICAgICAgICByZXR1cm4gcmVjb3JkO1xuICAgICAgICB9KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgICBjYXNlIFwiRE9NTm9kZVJlbW92ZWRcIjpcbiAgICAgICAgdGhpcy5hZGRUcmFuc2llbnRPYnNlcnZlcihlLnRhcmdldCk7XG5cbiAgICAgICBjYXNlIFwiRE9NTm9kZUluc2VydGVkXCI6XG4gICAgICAgIHZhciBjaGFuZ2VkTm9kZSA9IGUudGFyZ2V0O1xuICAgICAgICB2YXIgYWRkZWROb2RlcywgcmVtb3ZlZE5vZGVzO1xuICAgICAgICBpZiAoZS50eXBlID09PSBcIkRPTU5vZGVJbnNlcnRlZFwiKSB7XG4gICAgICAgICAgYWRkZWROb2RlcyA9IFsgY2hhbmdlZE5vZGUgXTtcbiAgICAgICAgICByZW1vdmVkTm9kZXMgPSBbXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhZGRlZE5vZGVzID0gW107XG4gICAgICAgICAgcmVtb3ZlZE5vZGVzID0gWyBjaGFuZ2VkTm9kZSBdO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwcmV2aW91c1NpYmxpbmcgPSBjaGFuZ2VkTm9kZS5wcmV2aW91c1NpYmxpbmc7XG4gICAgICAgIHZhciBuZXh0U2libGluZyA9IGNoYW5nZWROb2RlLm5leHRTaWJsaW5nO1xuICAgICAgICB2YXIgcmVjb3JkID0gZ2V0UmVjb3JkKFwiY2hpbGRMaXN0XCIsIGUudGFyZ2V0LnBhcmVudE5vZGUpO1xuICAgICAgICByZWNvcmQuYWRkZWROb2RlcyA9IGFkZGVkTm9kZXM7XG4gICAgICAgIHJlY29yZC5yZW1vdmVkTm9kZXMgPSByZW1vdmVkTm9kZXM7XG4gICAgICAgIHJlY29yZC5wcmV2aW91c1NpYmxpbmcgPSBwcmV2aW91c1NpYmxpbmc7XG4gICAgICAgIHJlY29yZC5uZXh0U2libGluZyA9IG5leHRTaWJsaW5nO1xuICAgICAgICBmb3JFYWNoQW5jZXN0b3JBbmRPYnNlcnZlckVucXVldWVSZWNvcmQoZS5yZWxhdGVkTm9kZSwgZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICAgIGlmICghb3B0aW9ucy5jaGlsZExpc3QpIHJldHVybjtcbiAgICAgICAgICByZXR1cm4gcmVjb3JkO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNsZWFyUmVjb3JkcygpO1xuICAgIH1cbiAgfTtcbiAgZ2xvYmFsLkpzTXV0YXRpb25PYnNlcnZlciA9IEpzTXV0YXRpb25PYnNlcnZlcjtcbiAgaWYgKCFnbG9iYWwuTXV0YXRpb25PYnNlcnZlcikge1xuICAgIGdsb2JhbC5NdXRhdGlvbk9ic2VydmVyID0gSnNNdXRhdGlvbk9ic2VydmVyO1xuICAgIEpzTXV0YXRpb25PYnNlcnZlci5faXNQb2x5ZmlsbGVkID0gdHJ1ZTtcbiAgfVxufSkoc2VsZik7XG5cbihmdW5jdGlvbihzY29wZSkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgaWYgKCF3aW5kb3cucGVyZm9ybWFuY2UpIHtcbiAgICB2YXIgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgIHdpbmRvdy5wZXJmb3JtYW5jZSA9IHtcbiAgICAgIG5vdzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBEYXRlLm5vdygpIC0gc3RhcnQ7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBpZiAoIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUpIHtcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbmF0aXZlUmFmID0gd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuICAgICAgcmV0dXJuIG5hdGl2ZVJhZiA/IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBuYXRpdmVSYWYoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgY2FsbGJhY2socGVyZm9ybWFuY2Uubm93KCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0gOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gd2luZG93LnNldFRpbWVvdXQoY2FsbGJhY2ssIDFlMyAvIDYwKTtcbiAgICAgIH07XG4gICAgfSgpO1xuICB9XG4gIGlmICghd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gd2luZG93LndlYmtpdENhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pDYW5jZWxBbmltYXRpb25GcmFtZSB8fCBmdW5jdGlvbihpZCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaWQpO1xuICAgICAgfTtcbiAgICB9KCk7XG4gIH1cbiAgdmFyIHdvcmtpbmdEZWZhdWx0UHJldmVudGVkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkV2ZW50XCIpO1xuICAgIGUuaW5pdEV2ZW50KFwiZm9vXCIsIHRydWUsIHRydWUpO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICByZXR1cm4gZS5kZWZhdWx0UHJldmVudGVkO1xuICB9KCk7XG4gIGlmICghd29ya2luZ0RlZmF1bHRQcmV2ZW50ZWQpIHtcbiAgICB2YXIgb3JpZ1ByZXZlbnREZWZhdWx0ID0gRXZlbnQucHJvdG90eXBlLnByZXZlbnREZWZhdWx0O1xuICAgIEV2ZW50LnByb3RvdHlwZS5wcmV2ZW50RGVmYXVsdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCF0aGlzLmNhbmNlbGFibGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgb3JpZ1ByZXZlbnREZWZhdWx0LmNhbGwodGhpcyk7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJkZWZhdWx0UHJldmVudGVkXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9O1xuICB9XG4gIHZhciBpc0lFID0gL1RyaWRlbnQvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG4gIGlmICghd2luZG93LkN1c3RvbUV2ZW50IHx8IGlzSUUgJiYgdHlwZW9mIHdpbmRvdy5DdXN0b21FdmVudCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgd2luZG93LkN1c3RvbUV2ZW50ID0gZnVuY3Rpb24oaW5UeXBlLCBwYXJhbXMpIHtcbiAgICAgIHBhcmFtcyA9IHBhcmFtcyB8fCB7fTtcbiAgICAgIHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJDdXN0b21FdmVudFwiKTtcbiAgICAgIGUuaW5pdEN1c3RvbUV2ZW50KGluVHlwZSwgQm9vbGVhbihwYXJhbXMuYnViYmxlcyksIEJvb2xlYW4ocGFyYW1zLmNhbmNlbGFibGUpLCBwYXJhbXMuZGV0YWlsKTtcbiAgICAgIHJldHVybiBlO1xuICAgIH07XG4gICAgd2luZG93LkN1c3RvbUV2ZW50LnByb3RvdHlwZSA9IHdpbmRvdy5FdmVudC5wcm90b3R5cGU7XG4gIH1cbiAgaWYgKCF3aW5kb3cuRXZlbnQgfHwgaXNJRSAmJiB0eXBlb2Ygd2luZG93LkV2ZW50ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB2YXIgb3JpZ0V2ZW50ID0gd2luZG93LkV2ZW50O1xuICAgIHdpbmRvdy5FdmVudCA9IGZ1bmN0aW9uKGluVHlwZSwgcGFyYW1zKSB7XG4gICAgICBwYXJhbXMgPSBwYXJhbXMgfHwge307XG4gICAgICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiRXZlbnRcIik7XG4gICAgICBlLmluaXRFdmVudChpblR5cGUsIEJvb2xlYW4ocGFyYW1zLmJ1YmJsZXMpLCBCb29sZWFuKHBhcmFtcy5jYW5jZWxhYmxlKSk7XG4gICAgICByZXR1cm4gZTtcbiAgICB9O1xuICAgIHdpbmRvdy5FdmVudC5wcm90b3R5cGUgPSBvcmlnRXZlbnQucHJvdG90eXBlO1xuICB9XG59KSh3aW5kb3cuV2ViQ29tcG9uZW50cyk7XG5cbndpbmRvdy5DdXN0b21FbGVtZW50cyA9IHdpbmRvdy5DdXN0b21FbGVtZW50cyB8fCB7XG4gIGZsYWdzOiB7fVxufTtcblxuKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBmbGFncyA9IHNjb3BlLmZsYWdzO1xuICB2YXIgbW9kdWxlcyA9IFtdO1xuICB2YXIgYWRkTW9kdWxlID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gICAgbW9kdWxlcy5wdXNoKG1vZHVsZSk7XG4gIH07XG4gIHZhciBpbml0aWFsaXplTW9kdWxlcyA9IGZ1bmN0aW9uKCkge1xuICAgIG1vZHVsZXMuZm9yRWFjaChmdW5jdGlvbihtb2R1bGUpIHtcbiAgICAgIG1vZHVsZShzY29wZSk7XG4gICAgfSk7XG4gIH07XG4gIHNjb3BlLmFkZE1vZHVsZSA9IGFkZE1vZHVsZTtcbiAgc2NvcGUuaW5pdGlhbGl6ZU1vZHVsZXMgPSBpbml0aWFsaXplTW9kdWxlcztcbiAgc2NvcGUuaGFzTmF0aXZlID0gQm9vbGVhbihkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQpO1xuICBzY29wZS5pc0lFID0gL1RyaWRlbnQvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG4gIHNjb3BlLnVzZU5hdGl2ZSA9ICFmbGFncy5yZWdpc3RlciAmJiBzY29wZS5oYXNOYXRpdmUgJiYgIXdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCAmJiAoIXdpbmRvdy5IVE1MSW1wb3J0cyB8fCB3aW5kb3cuSFRNTEltcG9ydHMudXNlTmF0aXZlKTtcbn0pKHdpbmRvdy5DdXN0b21FbGVtZW50cyk7XG5cbndpbmRvdy5DdXN0b21FbGVtZW50cy5hZGRNb2R1bGUoZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIElNUE9SVF9MSU5LX1RZUEUgPSB3aW5kb3cuSFRNTEltcG9ydHMgPyB3aW5kb3cuSFRNTEltcG9ydHMuSU1QT1JUX0xJTktfVFlQRSA6IFwibm9uZVwiO1xuICBmdW5jdGlvbiBmb3JTdWJ0cmVlKG5vZGUsIGNiKSB7XG4gICAgZmluZEFsbEVsZW1lbnRzKG5vZGUsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChjYihlKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGZvclJvb3RzKGUsIGNiKTtcbiAgICB9KTtcbiAgICBmb3JSb290cyhub2RlLCBjYik7XG4gIH1cbiAgZnVuY3Rpb24gZmluZEFsbEVsZW1lbnRzKG5vZGUsIGZpbmQsIGRhdGEpIHtcbiAgICB2YXIgZSA9IG5vZGUuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgaWYgKCFlKSB7XG4gICAgICBlID0gbm9kZS5maXJzdENoaWxkO1xuICAgICAgd2hpbGUgKGUgJiYgZS5ub2RlVHlwZSAhPT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgZSA9IGUubmV4dFNpYmxpbmc7XG4gICAgICB9XG4gICAgfVxuICAgIHdoaWxlIChlKSB7XG4gICAgICBpZiAoZmluZChlLCBkYXRhKSAhPT0gdHJ1ZSkge1xuICAgICAgICBmaW5kQWxsRWxlbWVudHMoZSwgZmluZCwgZGF0YSk7XG4gICAgICB9XG4gICAgICBlID0gZS5uZXh0RWxlbWVudFNpYmxpbmc7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGZ1bmN0aW9uIGZvclJvb3RzKG5vZGUsIGNiKSB7XG4gICAgdmFyIHJvb3QgPSBub2RlLnNoYWRvd1Jvb3Q7XG4gICAgd2hpbGUgKHJvb3QpIHtcbiAgICAgIGZvclN1YnRyZWUocm9vdCwgY2IpO1xuICAgICAgcm9vdCA9IHJvb3Qub2xkZXJTaGFkb3dSb290O1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBmb3JEb2N1bWVudFRyZWUoZG9jLCBjYikge1xuICAgIF9mb3JEb2N1bWVudFRyZWUoZG9jLCBjYiwgW10pO1xuICB9XG4gIGZ1bmN0aW9uIF9mb3JEb2N1bWVudFRyZWUoZG9jLCBjYiwgcHJvY2Vzc2luZ0RvY3VtZW50cykge1xuICAgIGRvYyA9IHdpbmRvdy53cmFwKGRvYyk7XG4gICAgaWYgKHByb2Nlc3NpbmdEb2N1bWVudHMuaW5kZXhPZihkb2MpID49IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcHJvY2Vzc2luZ0RvY3VtZW50cy5wdXNoKGRvYyk7XG4gICAgdmFyIGltcG9ydHMgPSBkb2MucXVlcnlTZWxlY3RvckFsbChcImxpbmtbcmVsPVwiICsgSU1QT1JUX0xJTktfVFlQRSArIFwiXVwiKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGltcG9ydHMubGVuZ3RoLCBuOyBpIDwgbCAmJiAobiA9IGltcG9ydHNbaV0pOyBpKyspIHtcbiAgICAgIGlmIChuLmltcG9ydCkge1xuICAgICAgICBfZm9yRG9jdW1lbnRUcmVlKG4uaW1wb3J0LCBjYiwgcHJvY2Vzc2luZ0RvY3VtZW50cyk7XG4gICAgICB9XG4gICAgfVxuICAgIGNiKGRvYyk7XG4gIH1cbiAgc2NvcGUuZm9yRG9jdW1lbnRUcmVlID0gZm9yRG9jdW1lbnRUcmVlO1xuICBzY29wZS5mb3JTdWJ0cmVlID0gZm9yU3VidHJlZTtcbn0pO1xuXG53aW5kb3cuQ3VzdG9tRWxlbWVudHMuYWRkTW9kdWxlKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBmbGFncyA9IHNjb3BlLmZsYWdzO1xuICB2YXIgZm9yU3VidHJlZSA9IHNjb3BlLmZvclN1YnRyZWU7XG4gIHZhciBmb3JEb2N1bWVudFRyZWUgPSBzY29wZS5mb3JEb2N1bWVudFRyZWU7XG4gIGZ1bmN0aW9uIGFkZGVkTm9kZShub2RlLCBpc0F0dGFjaGVkKSB7XG4gICAgcmV0dXJuIGFkZGVkKG5vZGUsIGlzQXR0YWNoZWQpIHx8IGFkZGVkU3VidHJlZShub2RlLCBpc0F0dGFjaGVkKTtcbiAgfVxuICBmdW5jdGlvbiBhZGRlZChub2RlLCBpc0F0dGFjaGVkKSB7XG4gICAgaWYgKHNjb3BlLnVwZ3JhZGUobm9kZSwgaXNBdHRhY2hlZCkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoaXNBdHRhY2hlZCkge1xuICAgICAgYXR0YWNoZWQobm9kZSk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGFkZGVkU3VidHJlZShub2RlLCBpc0F0dGFjaGVkKSB7XG4gICAgZm9yU3VidHJlZShub2RlLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoYWRkZWQoZSwgaXNBdHRhY2hlZCkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgdmFyIGhhc1Rocm90dGxlZEF0dGFjaGVkID0gd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXIuX2lzUG9seWZpbGxlZCAmJiBmbGFnc1tcInRocm90dGxlLWF0dGFjaGVkXCJdO1xuICBzY29wZS5oYXNQb2x5ZmlsbE11dGF0aW9ucyA9IGhhc1Rocm90dGxlZEF0dGFjaGVkO1xuICBzY29wZS5oYXNUaHJvdHRsZWRBdHRhY2hlZCA9IGhhc1Rocm90dGxlZEF0dGFjaGVkO1xuICB2YXIgaXNQZW5kaW5nTXV0YXRpb25zID0gZmFsc2U7XG4gIHZhciBwZW5kaW5nTXV0YXRpb25zID0gW107XG4gIGZ1bmN0aW9uIGRlZmVyTXV0YXRpb24oZm4pIHtcbiAgICBwZW5kaW5nTXV0YXRpb25zLnB1c2goZm4pO1xuICAgIGlmICghaXNQZW5kaW5nTXV0YXRpb25zKSB7XG4gICAgICBpc1BlbmRpbmdNdXRhdGlvbnMgPSB0cnVlO1xuICAgICAgc2V0VGltZW91dCh0YWtlTXV0YXRpb25zKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gdGFrZU11dGF0aW9ucygpIHtcbiAgICBpc1BlbmRpbmdNdXRhdGlvbnMgPSBmYWxzZTtcbiAgICB2YXIgJHAgPSBwZW5kaW5nTXV0YXRpb25zO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gJHAubGVuZ3RoLCBwOyBpIDwgbCAmJiAocCA9ICRwW2ldKTsgaSsrKSB7XG4gICAgICBwKCk7XG4gICAgfVxuICAgIHBlbmRpbmdNdXRhdGlvbnMgPSBbXTtcbiAgfVxuICBmdW5jdGlvbiBhdHRhY2hlZChlbGVtZW50KSB7XG4gICAgaWYgKGhhc1Rocm90dGxlZEF0dGFjaGVkKSB7XG4gICAgICBkZWZlck11dGF0aW9uKGZ1bmN0aW9uKCkge1xuICAgICAgICBfYXR0YWNoZWQoZWxlbWVudCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgX2F0dGFjaGVkKGVsZW1lbnQpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBfYXR0YWNoZWQoZWxlbWVudCkge1xuICAgIGlmIChlbGVtZW50Ll9fdXBncmFkZWRfXyAmJiAhZWxlbWVudC5fX2F0dGFjaGVkKSB7XG4gICAgICBlbGVtZW50Ll9fYXR0YWNoZWQgPSB0cnVlO1xuICAgICAgaWYgKGVsZW1lbnQuYXR0YWNoZWRDYWxsYmFjaykge1xuICAgICAgICBlbGVtZW50LmF0dGFjaGVkQ2FsbGJhY2soKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gZGV0YWNoZWROb2RlKG5vZGUpIHtcbiAgICBkZXRhY2hlZChub2RlKTtcbiAgICBmb3JTdWJ0cmVlKG5vZGUsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGRldGFjaGVkKGUpO1xuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGRldGFjaGVkKGVsZW1lbnQpIHtcbiAgICBpZiAoaGFzVGhyb3R0bGVkQXR0YWNoZWQpIHtcbiAgICAgIGRlZmVyTXV0YXRpb24oZnVuY3Rpb24oKSB7XG4gICAgICAgIF9kZXRhY2hlZChlbGVtZW50KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBfZGV0YWNoZWQoZWxlbWVudCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIF9kZXRhY2hlZChlbGVtZW50KSB7XG4gICAgaWYgKGVsZW1lbnQuX191cGdyYWRlZF9fICYmIGVsZW1lbnQuX19hdHRhY2hlZCkge1xuICAgICAgZWxlbWVudC5fX2F0dGFjaGVkID0gZmFsc2U7XG4gICAgICBpZiAoZWxlbWVudC5kZXRhY2hlZENhbGxiYWNrKSB7XG4gICAgICAgIGVsZW1lbnQuZGV0YWNoZWRDYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBpbkRvY3VtZW50KGVsZW1lbnQpIHtcbiAgICB2YXIgcCA9IGVsZW1lbnQ7XG4gICAgdmFyIGRvYyA9IHdpbmRvdy53cmFwKGRvY3VtZW50KTtcbiAgICB3aGlsZSAocCkge1xuICAgICAgaWYgKHAgPT0gZG9jKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcCA9IHAucGFyZW50Tm9kZSB8fCBwLm5vZGVUeXBlID09PSBOb2RlLkRPQ1VNRU5UX0ZSQUdNRU5UX05PREUgJiYgcC5ob3N0O1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiB3YXRjaFNoYWRvdyhub2RlKSB7XG4gICAgaWYgKG5vZGUuc2hhZG93Um9vdCAmJiAhbm9kZS5zaGFkb3dSb290Ll9fd2F0Y2hlZCkge1xuICAgICAgZmxhZ3MuZG9tICYmIGNvbnNvbGUubG9nKFwid2F0Y2hpbmcgc2hhZG93LXJvb3QgZm9yOiBcIiwgbm9kZS5sb2NhbE5hbWUpO1xuICAgICAgdmFyIHJvb3QgPSBub2RlLnNoYWRvd1Jvb3Q7XG4gICAgICB3aGlsZSAocm9vdCkge1xuICAgICAgICBvYnNlcnZlKHJvb3QpO1xuICAgICAgICByb290ID0gcm9vdC5vbGRlclNoYWRvd1Jvb3Q7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGhhbmRsZXIocm9vdCwgbXV0YXRpb25zKSB7XG4gICAgaWYgKGZsYWdzLmRvbSkge1xuICAgICAgdmFyIG14ID0gbXV0YXRpb25zWzBdO1xuICAgICAgaWYgKG14ICYmIG14LnR5cGUgPT09IFwiY2hpbGRMaXN0XCIgJiYgbXguYWRkZWROb2Rlcykge1xuICAgICAgICBpZiAobXguYWRkZWROb2Rlcykge1xuICAgICAgICAgIHZhciBkID0gbXguYWRkZWROb2Rlc1swXTtcbiAgICAgICAgICB3aGlsZSAoZCAmJiBkICE9PSBkb2N1bWVudCAmJiAhZC5ob3N0KSB7XG4gICAgICAgICAgICBkID0gZC5wYXJlbnROb2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgdSA9IGQgJiYgKGQuVVJMIHx8IGQuX1VSTCB8fCBkLmhvc3QgJiYgZC5ob3N0LmxvY2FsTmFtZSkgfHwgXCJcIjtcbiAgICAgICAgICB1ID0gdS5zcGxpdChcIi8/XCIpLnNoaWZ0KCkuc3BsaXQoXCIvXCIpLnBvcCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zb2xlLmdyb3VwKFwibXV0YXRpb25zICglZCkgWyVzXVwiLCBtdXRhdGlvbnMubGVuZ3RoLCB1IHx8IFwiXCIpO1xuICAgIH1cbiAgICB2YXIgaXNBdHRhY2hlZCA9IGluRG9jdW1lbnQocm9vdCk7XG4gICAgbXV0YXRpb25zLmZvckVhY2goZnVuY3Rpb24obXgpIHtcbiAgICAgIGlmIChteC50eXBlID09PSBcImNoaWxkTGlzdFwiKSB7XG4gICAgICAgIGZvckVhY2gobXguYWRkZWROb2RlcywgZnVuY3Rpb24obikge1xuICAgICAgICAgIGlmICghbi5sb2NhbE5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYWRkZWROb2RlKG4sIGlzQXR0YWNoZWQpO1xuICAgICAgICB9KTtcbiAgICAgICAgZm9yRWFjaChteC5yZW1vdmVkTm9kZXMsIGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgICBpZiAoIW4ubG9jYWxOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGRldGFjaGVkTm9kZShuKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZmxhZ3MuZG9tICYmIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgfVxuICBmdW5jdGlvbiB0YWtlUmVjb3Jkcyhub2RlKSB7XG4gICAgbm9kZSA9IHdpbmRvdy53cmFwKG5vZGUpO1xuICAgIGlmICghbm9kZSkge1xuICAgICAgbm9kZSA9IHdpbmRvdy53cmFwKGRvY3VtZW50KTtcbiAgICB9XG4gICAgd2hpbGUgKG5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICB9XG4gICAgdmFyIG9ic2VydmVyID0gbm9kZS5fX29ic2VydmVyO1xuICAgIGlmIChvYnNlcnZlcikge1xuICAgICAgaGFuZGxlcihub2RlLCBvYnNlcnZlci50YWtlUmVjb3JkcygpKTtcbiAgICAgIHRha2VNdXRhdGlvbnMoKTtcbiAgICB9XG4gIH1cbiAgdmFyIGZvckVhY2ggPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsLmJpbmQoQXJyYXkucHJvdG90eXBlLmZvckVhY2gpO1xuICBmdW5jdGlvbiBvYnNlcnZlKGluUm9vdCkge1xuICAgIGlmIChpblJvb3QuX19vYnNlcnZlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihoYW5kbGVyLmJpbmQodGhpcywgaW5Sb290KSk7XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShpblJvb3QsIHtcbiAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgIHN1YnRyZWU6IHRydWVcbiAgICB9KTtcbiAgICBpblJvb3QuX19vYnNlcnZlciA9IG9ic2VydmVyO1xuICB9XG4gIGZ1bmN0aW9uIHVwZ3JhZGVEb2N1bWVudChkb2MpIHtcbiAgICBkb2MgPSB3aW5kb3cud3JhcChkb2MpO1xuICAgIGZsYWdzLmRvbSAmJiBjb25zb2xlLmdyb3VwKFwidXBncmFkZURvY3VtZW50OiBcIiwgZG9jLmJhc2VVUkkuc3BsaXQoXCIvXCIpLnBvcCgpKTtcbiAgICB2YXIgaXNNYWluRG9jdW1lbnQgPSBkb2MgPT09IHdpbmRvdy53cmFwKGRvY3VtZW50KTtcbiAgICBhZGRlZE5vZGUoZG9jLCBpc01haW5Eb2N1bWVudCk7XG4gICAgb2JzZXJ2ZShkb2MpO1xuICAgIGZsYWdzLmRvbSAmJiBjb25zb2xlLmdyb3VwRW5kKCk7XG4gIH1cbiAgZnVuY3Rpb24gdXBncmFkZURvY3VtZW50VHJlZShkb2MpIHtcbiAgICBmb3JEb2N1bWVudFRyZWUoZG9jLCB1cGdyYWRlRG9jdW1lbnQpO1xuICB9XG4gIHZhciBvcmlnaW5hbENyZWF0ZVNoYWRvd1Jvb3QgPSBFbGVtZW50LnByb3RvdHlwZS5jcmVhdGVTaGFkb3dSb290O1xuICBpZiAob3JpZ2luYWxDcmVhdGVTaGFkb3dSb290KSB7XG4gICAgRWxlbWVudC5wcm90b3R5cGUuY3JlYXRlU2hhZG93Um9vdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJvb3QgPSBvcmlnaW5hbENyZWF0ZVNoYWRvd1Jvb3QuY2FsbCh0aGlzKTtcbiAgICAgIHdpbmRvdy5DdXN0b21FbGVtZW50cy53YXRjaFNoYWRvdyh0aGlzKTtcbiAgICAgIHJldHVybiByb290O1xuICAgIH07XG4gIH1cbiAgc2NvcGUud2F0Y2hTaGFkb3cgPSB3YXRjaFNoYWRvdztcbiAgc2NvcGUudXBncmFkZURvY3VtZW50VHJlZSA9IHVwZ3JhZGVEb2N1bWVudFRyZWU7XG4gIHNjb3BlLnVwZ3JhZGVEb2N1bWVudCA9IHVwZ3JhZGVEb2N1bWVudDtcbiAgc2NvcGUudXBncmFkZVN1YnRyZWUgPSBhZGRlZFN1YnRyZWU7XG4gIHNjb3BlLnVwZ3JhZGVBbGwgPSBhZGRlZE5vZGU7XG4gIHNjb3BlLmF0dGFjaGVkID0gYXR0YWNoZWQ7XG4gIHNjb3BlLnRha2VSZWNvcmRzID0gdGFrZVJlY29yZHM7XG59KTtcblxud2luZG93LkN1c3RvbUVsZW1lbnRzLmFkZE1vZHVsZShmdW5jdGlvbihzY29wZSkge1xuICB2YXIgZmxhZ3MgPSBzY29wZS5mbGFncztcbiAgZnVuY3Rpb24gdXBncmFkZShub2RlLCBpc0F0dGFjaGVkKSB7XG4gICAgaWYgKG5vZGUubG9jYWxOYW1lID09PSBcInRlbXBsYXRlXCIpIHtcbiAgICAgIGlmICh3aW5kb3cuSFRNTFRlbXBsYXRlRWxlbWVudCAmJiBIVE1MVGVtcGxhdGVFbGVtZW50LmRlY29yYXRlKSB7XG4gICAgICAgIEhUTUxUZW1wbGF0ZUVsZW1lbnQuZGVjb3JhdGUobm9kZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghbm9kZS5fX3VwZ3JhZGVkX18gJiYgbm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgIHZhciBpcyA9IG5vZGUuZ2V0QXR0cmlidXRlKFwiaXNcIik7XG4gICAgICB2YXIgZGVmaW5pdGlvbiA9IHNjb3BlLmdldFJlZ2lzdGVyZWREZWZpbml0aW9uKG5vZGUubG9jYWxOYW1lKSB8fCBzY29wZS5nZXRSZWdpc3RlcmVkRGVmaW5pdGlvbihpcyk7XG4gICAgICBpZiAoZGVmaW5pdGlvbikge1xuICAgICAgICBpZiAoaXMgJiYgZGVmaW5pdGlvbi50YWcgPT0gbm9kZS5sb2NhbE5hbWUgfHwgIWlzICYmICFkZWZpbml0aW9uLmV4dGVuZHMpIHtcbiAgICAgICAgICByZXR1cm4gdXBncmFkZVdpdGhEZWZpbml0aW9uKG5vZGUsIGRlZmluaXRpb24sIGlzQXR0YWNoZWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHVwZ3JhZGVXaXRoRGVmaW5pdGlvbihlbGVtZW50LCBkZWZpbml0aW9uLCBpc0F0dGFjaGVkKSB7XG4gICAgZmxhZ3MudXBncmFkZSAmJiBjb25zb2xlLmdyb3VwKFwidXBncmFkZTpcIiwgZWxlbWVudC5sb2NhbE5hbWUpO1xuICAgIGlmIChkZWZpbml0aW9uLmlzKSB7XG4gICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShcImlzXCIsIGRlZmluaXRpb24uaXMpO1xuICAgIH1cbiAgICBpbXBsZW1lbnRQcm90b3R5cGUoZWxlbWVudCwgZGVmaW5pdGlvbik7XG4gICAgZWxlbWVudC5fX3VwZ3JhZGVkX18gPSB0cnVlO1xuICAgIGNyZWF0ZWQoZWxlbWVudCk7XG4gICAgaWYgKGlzQXR0YWNoZWQpIHtcbiAgICAgIHNjb3BlLmF0dGFjaGVkKGVsZW1lbnQpO1xuICAgIH1cbiAgICBzY29wZS51cGdyYWRlU3VidHJlZShlbGVtZW50LCBpc0F0dGFjaGVkKTtcbiAgICBmbGFncy51cGdyYWRlICYmIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuICBmdW5jdGlvbiBpbXBsZW1lbnRQcm90b3R5cGUoZWxlbWVudCwgZGVmaW5pdGlvbikge1xuICAgIGlmIChPYmplY3QuX19wcm90b19fKSB7XG4gICAgICBlbGVtZW50Ll9fcHJvdG9fXyA9IGRlZmluaXRpb24ucHJvdG90eXBlO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdXN0b21NaXhpbihlbGVtZW50LCBkZWZpbml0aW9uLnByb3RvdHlwZSwgZGVmaW5pdGlvbi5uYXRpdmUpO1xuICAgICAgZWxlbWVudC5fX3Byb3RvX18gPSBkZWZpbml0aW9uLnByb3RvdHlwZTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gY3VzdG9tTWl4aW4oaW5UYXJnZXQsIGluU3JjLCBpbk5hdGl2ZSkge1xuICAgIHZhciB1c2VkID0ge307XG4gICAgdmFyIHAgPSBpblNyYztcbiAgICB3aGlsZSAocCAhPT0gaW5OYXRpdmUgJiYgcCAhPT0gSFRNTEVsZW1lbnQucHJvdG90eXBlKSB7XG4gICAgICB2YXIga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHApO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGs7IGsgPSBrZXlzW2ldOyBpKyspIHtcbiAgICAgICAgaWYgKCF1c2VkW2tdKSB7XG4gICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGluVGFyZ2V0LCBrLCBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHAsIGspKTtcbiAgICAgICAgICB1c2VkW2tdID0gMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihwKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gY3JlYXRlZChlbGVtZW50KSB7XG4gICAgaWYgKGVsZW1lbnQuY3JlYXRlZENhbGxiYWNrKSB7XG4gICAgICBlbGVtZW50LmNyZWF0ZWRDYWxsYmFjaygpO1xuICAgIH1cbiAgfVxuICBzY29wZS51cGdyYWRlID0gdXBncmFkZTtcbiAgc2NvcGUudXBncmFkZVdpdGhEZWZpbml0aW9uID0gdXBncmFkZVdpdGhEZWZpbml0aW9uO1xuICBzY29wZS5pbXBsZW1lbnRQcm90b3R5cGUgPSBpbXBsZW1lbnRQcm90b3R5cGU7XG59KTtcblxud2luZG93LkN1c3RvbUVsZW1lbnRzLmFkZE1vZHVsZShmdW5jdGlvbihzY29wZSkge1xuICB2YXIgaXNJRSA9IHNjb3BlLmlzSUU7XG4gIHZhciB1cGdyYWRlRG9jdW1lbnRUcmVlID0gc2NvcGUudXBncmFkZURvY3VtZW50VHJlZTtcbiAgdmFyIHVwZ3JhZGVBbGwgPSBzY29wZS51cGdyYWRlQWxsO1xuICB2YXIgdXBncmFkZVdpdGhEZWZpbml0aW9uID0gc2NvcGUudXBncmFkZVdpdGhEZWZpbml0aW9uO1xuICB2YXIgaW1wbGVtZW50UHJvdG90eXBlID0gc2NvcGUuaW1wbGVtZW50UHJvdG90eXBlO1xuICB2YXIgdXNlTmF0aXZlID0gc2NvcGUudXNlTmF0aXZlO1xuICBmdW5jdGlvbiByZWdpc3RlcihuYW1lLCBvcHRpb25zKSB7XG4gICAgdmFyIGRlZmluaXRpb24gPSBvcHRpb25zIHx8IHt9O1xuICAgIGlmICghbmFtZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50OiBmaXJzdCBhcmd1bWVudCBgbmFtZWAgbXVzdCBub3QgYmUgZW1wdHlcIik7XG4gICAgfVxuICAgIGlmIChuYW1lLmluZGV4T2YoXCItXCIpIDwgMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50OiBmaXJzdCBhcmd1bWVudCAoJ25hbWUnKSBtdXN0IGNvbnRhaW4gYSBkYXNoICgnLScpLiBBcmd1bWVudCBwcm92aWRlZCB3YXMgJ1wiICsgU3RyaW5nKG5hbWUpICsgXCInLlwiKTtcbiAgICB9XG4gICAgaWYgKGlzUmVzZXJ2ZWRUYWcobmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBleGVjdXRlICdyZWdpc3RlckVsZW1lbnQnIG9uICdEb2N1bWVudCc6IFJlZ2lzdHJhdGlvbiBmYWlsZWQgZm9yIHR5cGUgJ1wiICsgU3RyaW5nKG5hbWUpICsgXCInLiBUaGUgdHlwZSBuYW1lIGlzIGludmFsaWQuXCIpO1xuICAgIH1cbiAgICBpZiAoZ2V0UmVnaXN0ZXJlZERlZmluaXRpb24obmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkR1cGxpY2F0ZURlZmluaXRpb25FcnJvcjogYSB0eXBlIHdpdGggbmFtZSAnXCIgKyBTdHJpbmcobmFtZSkgKyBcIicgaXMgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBpZiAoIWRlZmluaXRpb24ucHJvdG90eXBlKSB7XG4gICAgICBkZWZpbml0aW9uLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcbiAgICB9XG4gICAgZGVmaW5pdGlvbi5fX25hbWUgPSBuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKGRlZmluaXRpb24uZXh0ZW5kcykge1xuICAgICAgZGVmaW5pdGlvbi5leHRlbmRzID0gZGVmaW5pdGlvbi5leHRlbmRzLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuICAgIGRlZmluaXRpb24ubGlmZWN5Y2xlID0gZGVmaW5pdGlvbi5saWZlY3ljbGUgfHwge307XG4gICAgZGVmaW5pdGlvbi5hbmNlc3RyeSA9IGFuY2VzdHJ5KGRlZmluaXRpb24uZXh0ZW5kcyk7XG4gICAgcmVzb2x2ZVRhZ05hbWUoZGVmaW5pdGlvbik7XG4gICAgcmVzb2x2ZVByb3RvdHlwZUNoYWluKGRlZmluaXRpb24pO1xuICAgIG92ZXJyaWRlQXR0cmlidXRlQXBpKGRlZmluaXRpb24ucHJvdG90eXBlKTtcbiAgICByZWdpc3RlckRlZmluaXRpb24oZGVmaW5pdGlvbi5fX25hbWUsIGRlZmluaXRpb24pO1xuICAgIGRlZmluaXRpb24uY3RvciA9IGdlbmVyYXRlQ29uc3RydWN0b3IoZGVmaW5pdGlvbik7XG4gICAgZGVmaW5pdGlvbi5jdG9yLnByb3RvdHlwZSA9IGRlZmluaXRpb24ucHJvdG90eXBlO1xuICAgIGRlZmluaXRpb24ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gZGVmaW5pdGlvbi5jdG9yO1xuICAgIGlmIChzY29wZS5yZWFkeSkge1xuICAgICAgdXBncmFkZURvY3VtZW50VHJlZShkb2N1bWVudCk7XG4gICAgfVxuICAgIHJldHVybiBkZWZpbml0aW9uLmN0b3I7XG4gIH1cbiAgZnVuY3Rpb24gb3ZlcnJpZGVBdHRyaWJ1dGVBcGkocHJvdG90eXBlKSB7XG4gICAgaWYgKHByb3RvdHlwZS5zZXRBdHRyaWJ1dGUuX3BvbHlmaWxsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHNldEF0dHJpYnV0ZSA9IHByb3RvdHlwZS5zZXRBdHRyaWJ1dGU7XG4gICAgcHJvdG90eXBlLnNldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgICBjaGFuZ2VBdHRyaWJ1dGUuY2FsbCh0aGlzLCBuYW1lLCB2YWx1ZSwgc2V0QXR0cmlidXRlKTtcbiAgICB9O1xuICAgIHZhciByZW1vdmVBdHRyaWJ1dGUgPSBwcm90b3R5cGUucmVtb3ZlQXR0cmlidXRlO1xuICAgIHByb3RvdHlwZS5yZW1vdmVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgICBjaGFuZ2VBdHRyaWJ1dGUuY2FsbCh0aGlzLCBuYW1lLCBudWxsLCByZW1vdmVBdHRyaWJ1dGUpO1xuICAgIH07XG4gICAgcHJvdG90eXBlLnNldEF0dHJpYnV0ZS5fcG9seWZpbGxlZCA9IHRydWU7XG4gIH1cbiAgZnVuY3Rpb24gY2hhbmdlQXR0cmlidXRlKG5hbWUsIHZhbHVlLCBvcGVyYXRpb24pIHtcbiAgICBuYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIHZhciBvbGRWYWx1ZSA9IHRoaXMuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgIG9wZXJhdGlvbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIHZhciBuZXdWYWx1ZSA9IHRoaXMuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgIGlmICh0aGlzLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayAmJiBuZXdWYWx1ZSAhPT0gb2xkVmFsdWUpIHtcbiAgICAgIHRoaXMuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGlzUmVzZXJ2ZWRUYWcobmFtZSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzZXJ2ZWRUYWdMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobmFtZSA9PT0gcmVzZXJ2ZWRUYWdMaXN0W2ldKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB2YXIgcmVzZXJ2ZWRUYWdMaXN0ID0gWyBcImFubm90YXRpb24teG1sXCIsIFwiY29sb3ItcHJvZmlsZVwiLCBcImZvbnQtZmFjZVwiLCBcImZvbnQtZmFjZS1zcmNcIiwgXCJmb250LWZhY2UtdXJpXCIsIFwiZm9udC1mYWNlLWZvcm1hdFwiLCBcImZvbnQtZmFjZS1uYW1lXCIsIFwibWlzc2luZy1nbHlwaFwiIF07XG4gIGZ1bmN0aW9uIGFuY2VzdHJ5KGV4dG5kcykge1xuICAgIHZhciBleHRlbmRlZSA9IGdldFJlZ2lzdGVyZWREZWZpbml0aW9uKGV4dG5kcyk7XG4gICAgaWYgKGV4dGVuZGVlKSB7XG4gICAgICByZXR1cm4gYW5jZXN0cnkoZXh0ZW5kZWUuZXh0ZW5kcykuY29uY2F0KFsgZXh0ZW5kZWUgXSk7XG4gICAgfVxuICAgIHJldHVybiBbXTtcbiAgfVxuICBmdW5jdGlvbiByZXNvbHZlVGFnTmFtZShkZWZpbml0aW9uKSB7XG4gICAgdmFyIGJhc2VUYWcgPSBkZWZpbml0aW9uLmV4dGVuZHM7XG4gICAgZm9yICh2YXIgaSA9IDAsIGE7IGEgPSBkZWZpbml0aW9uLmFuY2VzdHJ5W2ldOyBpKyspIHtcbiAgICAgIGJhc2VUYWcgPSBhLmlzICYmIGEudGFnO1xuICAgIH1cbiAgICBkZWZpbml0aW9uLnRhZyA9IGJhc2VUYWcgfHwgZGVmaW5pdGlvbi5fX25hbWU7XG4gICAgaWYgKGJhc2VUYWcpIHtcbiAgICAgIGRlZmluaXRpb24uaXMgPSBkZWZpbml0aW9uLl9fbmFtZTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcmVzb2x2ZVByb3RvdHlwZUNoYWluKGRlZmluaXRpb24pIHtcbiAgICBpZiAoIU9iamVjdC5fX3Byb3RvX18pIHtcbiAgICAgIHZhciBuYXRpdmVQcm90b3R5cGUgPSBIVE1MRWxlbWVudC5wcm90b3R5cGU7XG4gICAgICBpZiAoZGVmaW5pdGlvbi5pcykge1xuICAgICAgICB2YXIgaW5zdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZGVmaW5pdGlvbi50YWcpO1xuICAgICAgICBuYXRpdmVQcm90b3R5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoaW5zdCk7XG4gICAgICB9XG4gICAgICB2YXIgcHJvdG8gPSBkZWZpbml0aW9uLnByb3RvdHlwZSwgYW5jZXN0b3I7XG4gICAgICB2YXIgZm91bmRQcm90b3R5cGUgPSBmYWxzZTtcbiAgICAgIHdoaWxlIChwcm90bykge1xuICAgICAgICBpZiAocHJvdG8gPT0gbmF0aXZlUHJvdG90eXBlKSB7XG4gICAgICAgICAgZm91bmRQcm90b3R5cGUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGFuY2VzdG9yID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHByb3RvKTtcbiAgICAgICAgaWYgKGFuY2VzdG9yKSB7XG4gICAgICAgICAgcHJvdG8uX19wcm90b19fID0gYW5jZXN0b3I7XG4gICAgICAgIH1cbiAgICAgICAgcHJvdG8gPSBhbmNlc3RvcjtcbiAgICAgIH1cbiAgICAgIGlmICghZm91bmRQcm90b3R5cGUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGRlZmluaXRpb24udGFnICsgXCIgcHJvdG90eXBlIG5vdCBmb3VuZCBpbiBwcm90b3R5cGUgY2hhaW4gZm9yIFwiICsgZGVmaW5pdGlvbi5pcyk7XG4gICAgICB9XG4gICAgICBkZWZpbml0aW9uLm5hdGl2ZSA9IG5hdGl2ZVByb3RvdHlwZTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gaW5zdGFudGlhdGUoZGVmaW5pdGlvbikge1xuICAgIHJldHVybiB1cGdyYWRlV2l0aERlZmluaXRpb24oZG9tQ3JlYXRlRWxlbWVudChkZWZpbml0aW9uLnRhZyksIGRlZmluaXRpb24pO1xuICB9XG4gIHZhciByZWdpc3RyeSA9IHt9O1xuICBmdW5jdGlvbiBnZXRSZWdpc3RlcmVkRGVmaW5pdGlvbihuYW1lKSB7XG4gICAgaWYgKG5hbWUpIHtcbiAgICAgIHJldHVybiByZWdpc3RyeVtuYW1lLnRvTG93ZXJDYXNlKCldO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiByZWdpc3RlckRlZmluaXRpb24obmFtZSwgZGVmaW5pdGlvbikge1xuICAgIHJlZ2lzdHJ5W25hbWVdID0gZGVmaW5pdGlvbjtcbiAgfVxuICBmdW5jdGlvbiBnZW5lcmF0ZUNvbnN0cnVjdG9yKGRlZmluaXRpb24pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gaW5zdGFudGlhdGUoZGVmaW5pdGlvbik7XG4gICAgfTtcbiAgfVxuICB2YXIgSFRNTF9OQU1FU1BBQ0UgPSBcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIjtcbiAgZnVuY3Rpb24gY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgdGFnLCB0eXBlRXh0ZW5zaW9uKSB7XG4gICAgaWYgKG5hbWVzcGFjZSA9PT0gSFRNTF9OQU1FU1BBQ0UpIHtcbiAgICAgIHJldHVybiBjcmVhdGVFbGVtZW50KHRhZywgdHlwZUV4dGVuc2lvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBkb21DcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCB0YWcpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBjcmVhdGVFbGVtZW50KHRhZywgdHlwZUV4dGVuc2lvbikge1xuICAgIGlmICh0YWcpIHtcbiAgICAgIHRhZyA9IHRhZy50b0xvd2VyQ2FzZSgpO1xuICAgIH1cbiAgICBpZiAodHlwZUV4dGVuc2lvbikge1xuICAgICAgdHlwZUV4dGVuc2lvbiA9IHR5cGVFeHRlbnNpb24udG9Mb3dlckNhc2UoKTtcbiAgICB9XG4gICAgdmFyIGRlZmluaXRpb24gPSBnZXRSZWdpc3RlcmVkRGVmaW5pdGlvbih0eXBlRXh0ZW5zaW9uIHx8IHRhZyk7XG4gICAgaWYgKGRlZmluaXRpb24pIHtcbiAgICAgIGlmICh0YWcgPT0gZGVmaW5pdGlvbi50YWcgJiYgdHlwZUV4dGVuc2lvbiA9PSBkZWZpbml0aW9uLmlzKSB7XG4gICAgICAgIHJldHVybiBuZXcgZGVmaW5pdGlvbi5jdG9yKCk7XG4gICAgICB9XG4gICAgICBpZiAoIXR5cGVFeHRlbnNpb24gJiYgIWRlZmluaXRpb24uaXMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBkZWZpbml0aW9uLmN0b3IoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIGVsZW1lbnQ7XG4gICAgaWYgKHR5cGVFeHRlbnNpb24pIHtcbiAgICAgIGVsZW1lbnQgPSBjcmVhdGVFbGVtZW50KHRhZyk7XG4gICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShcImlzXCIsIHR5cGVFeHRlbnNpb24pO1xuICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuICAgIGVsZW1lbnQgPSBkb21DcmVhdGVFbGVtZW50KHRhZyk7XG4gICAgaWYgKHRhZy5pbmRleE9mKFwiLVwiKSA+PSAwKSB7XG4gICAgICBpbXBsZW1lbnRQcm90b3R5cGUoZWxlbWVudCwgSFRNTEVsZW1lbnQpO1xuICAgIH1cbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuICB2YXIgZG9tQ3JlYXRlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQuYmluZChkb2N1bWVudCk7XG4gIHZhciBkb21DcmVhdGVFbGVtZW50TlMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMuYmluZChkb2N1bWVudCk7XG4gIHZhciBpc0luc3RhbmNlO1xuICBpZiAoIU9iamVjdC5fX3Byb3RvX18gJiYgIXVzZU5hdGl2ZSkge1xuICAgIGlzSW5zdGFuY2UgPSBmdW5jdGlvbihvYmosIGN0b3IpIHtcbiAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBjdG9yKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgdmFyIHAgPSBvYmo7XG4gICAgICB3aGlsZSAocCkge1xuICAgICAgICBpZiAocCA9PT0gY3Rvci5wcm90b3R5cGUpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBwID0gcC5fX3Byb3RvX187XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBpc0luc3RhbmNlID0gZnVuY3Rpb24ob2JqLCBiYXNlKSB7XG4gICAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgYmFzZTtcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIHdyYXBEb21NZXRob2RUb0ZvcmNlVXBncmFkZShvYmosIG1ldGhvZE5hbWUpIHtcbiAgICB2YXIgb3JpZyA9IG9ialttZXRob2ROYW1lXTtcbiAgICBvYmpbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBuID0gb3JpZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgdXBncmFkZUFsbChuKTtcbiAgICAgIHJldHVybiBuO1xuICAgIH07XG4gIH1cbiAgd3JhcERvbU1ldGhvZFRvRm9yY2VVcGdyYWRlKE5vZGUucHJvdG90eXBlLCBcImNsb25lTm9kZVwiKTtcbiAgd3JhcERvbU1ldGhvZFRvRm9yY2VVcGdyYWRlKGRvY3VtZW50LCBcImltcG9ydE5vZGVcIik7XG4gIGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCA9IHJlZ2lzdGVyO1xuICBkb2N1bWVudC5jcmVhdGVFbGVtZW50ID0gY3JlYXRlRWxlbWVudDtcbiAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TID0gY3JlYXRlRWxlbWVudE5TO1xuICBzY29wZS5yZWdpc3RyeSA9IHJlZ2lzdHJ5O1xuICBzY29wZS5pbnN0YW5jZW9mID0gaXNJbnN0YW5jZTtcbiAgc2NvcGUucmVzZXJ2ZWRUYWdMaXN0ID0gcmVzZXJ2ZWRUYWdMaXN0O1xuICBzY29wZS5nZXRSZWdpc3RlcmVkRGVmaW5pdGlvbiA9IGdldFJlZ2lzdGVyZWREZWZpbml0aW9uO1xuICBkb2N1bWVudC5yZWdpc3RlciA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudDtcbn0pO1xuXG4oZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIHVzZU5hdGl2ZSA9IHNjb3BlLnVzZU5hdGl2ZTtcbiAgdmFyIGluaXRpYWxpemVNb2R1bGVzID0gc2NvcGUuaW5pdGlhbGl6ZU1vZHVsZXM7XG4gIHZhciBpc0lFID0gc2NvcGUuaXNJRTtcbiAgaWYgKHVzZU5hdGl2ZSkge1xuICAgIHZhciBub3AgPSBmdW5jdGlvbigpIHt9O1xuICAgIHNjb3BlLndhdGNoU2hhZG93ID0gbm9wO1xuICAgIHNjb3BlLnVwZ3JhZGUgPSBub3A7XG4gICAgc2NvcGUudXBncmFkZUFsbCA9IG5vcDtcbiAgICBzY29wZS51cGdyYWRlRG9jdW1lbnRUcmVlID0gbm9wO1xuICAgIHNjb3BlLnVwZ3JhZGVTdWJ0cmVlID0gbm9wO1xuICAgIHNjb3BlLnRha2VSZWNvcmRzID0gbm9wO1xuICAgIHNjb3BlLmluc3RhbmNlb2YgPSBmdW5jdGlvbihvYmosIGJhc2UpIHtcbiAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBiYXNlO1xuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgaW5pdGlhbGl6ZU1vZHVsZXMoKTtcbiAgfVxuICB2YXIgdXBncmFkZURvY3VtZW50VHJlZSA9IHNjb3BlLnVwZ3JhZGVEb2N1bWVudFRyZWU7XG4gIHZhciB1cGdyYWRlRG9jdW1lbnQgPSBzY29wZS51cGdyYWRlRG9jdW1lbnQ7XG4gIGlmICghd2luZG93LndyYXApIHtcbiAgICBpZiAod2luZG93LlNoYWRvd0RPTVBvbHlmaWxsKSB7XG4gICAgICB3aW5kb3cud3JhcCA9IHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbC53cmFwSWZOZWVkZWQ7XG4gICAgICB3aW5kb3cudW53cmFwID0gd2luZG93LlNoYWRvd0RPTVBvbHlmaWxsLnVud3JhcElmTmVlZGVkO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aW5kb3cud3JhcCA9IHdpbmRvdy51bndyYXAgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgICAgfTtcbiAgICB9XG4gIH1cbiAgaWYgKHdpbmRvdy5IVE1MSW1wb3J0cykge1xuICAgIHdpbmRvdy5IVE1MSW1wb3J0cy5fX2ltcG9ydHNQYXJzaW5nSG9vayA9IGZ1bmN0aW9uKGVsdCkge1xuICAgICAgaWYgKGVsdC5pbXBvcnQpIHtcbiAgICAgICAgdXBncmFkZURvY3VtZW50KHdyYXAoZWx0LmltcG9ydCkpO1xuICAgICAgfVxuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gYm9vdHN0cmFwKCkge1xuICAgIHVwZ3JhZGVEb2N1bWVudFRyZWUod2luZG93LndyYXAoZG9jdW1lbnQpKTtcbiAgICB3aW5kb3cuQ3VzdG9tRWxlbWVudHMucmVhZHkgPSB0cnVlO1xuICAgIHZhciByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IGZ1bmN0aW9uKGYpIHtcbiAgICAgIHNldFRpbWVvdXQoZiwgMTYpO1xuICAgIH07XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgd2luZG93LkN1c3RvbUVsZW1lbnRzLnJlYWR5VGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIGlmICh3aW5kb3cuSFRNTEltcG9ydHMpIHtcbiAgICAgICAgICB3aW5kb3cuQ3VzdG9tRWxlbWVudHMuZWxhcHNlZCA9IHdpbmRvdy5DdXN0b21FbGVtZW50cy5yZWFkeVRpbWUgLSB3aW5kb3cuSFRNTEltcG9ydHMucmVhZHlUaW1lO1xuICAgICAgICB9XG4gICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwiV2ViQ29tcG9uZW50c1JlYWR5XCIsIHtcbiAgICAgICAgICBidWJibGVzOiB0cnVlXG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImNvbXBsZXRlXCIgfHwgc2NvcGUuZmxhZ3MuZWFnZXIpIHtcbiAgICBib290c3RyYXAoKTtcbiAgfSBlbHNlIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImludGVyYWN0aXZlXCIgJiYgIXdpbmRvdy5hdHRhY2hFdmVudCAmJiAoIXdpbmRvdy5IVE1MSW1wb3J0cyB8fCB3aW5kb3cuSFRNTEltcG9ydHMucmVhZHkpKSB7XG4gICAgYm9vdHN0cmFwKCk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxvYWRFdmVudCA9IHdpbmRvdy5IVE1MSW1wb3J0cyAmJiAhd2luZG93LkhUTUxJbXBvcnRzLnJlYWR5ID8gXCJIVE1MSW1wb3J0c0xvYWRlZFwiIDogXCJET01Db250ZW50TG9hZGVkXCI7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIobG9hZEV2ZW50LCBib290c3RyYXApO1xuICB9XG59KSh3aW5kb3cuQ3VzdG9tRWxlbWVudHMpOyIsIihmdW5jdGlvbihzZWxmKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBpZiAoc2VsZi5mZXRjaCkge1xuICAgIHJldHVyblxuICB9XG5cbiAgdmFyIHN1cHBvcnQgPSB7XG4gICAgc2VhcmNoUGFyYW1zOiAnVVJMU2VhcmNoUGFyYW1zJyBpbiBzZWxmLFxuICAgIGl0ZXJhYmxlOiAnU3ltYm9sJyBpbiBzZWxmICYmICdpdGVyYXRvcicgaW4gU3ltYm9sLFxuICAgIGJsb2I6ICdGaWxlUmVhZGVyJyBpbiBzZWxmICYmICdCbG9iJyBpbiBzZWxmICYmIChmdW5jdGlvbigpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIG5ldyBCbG9iKClcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9KSgpLFxuICAgIGZvcm1EYXRhOiAnRm9ybURhdGEnIGluIHNlbGYsXG4gICAgYXJyYXlCdWZmZXI6ICdBcnJheUJ1ZmZlcicgaW4gc2VsZlxuICB9XG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplTmFtZShuYW1lKSB7XG4gICAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgbmFtZSA9IFN0cmluZyhuYW1lKVxuICAgIH1cbiAgICBpZiAoL1teYS16MC05XFwtIyQlJicqKy5cXF5fYHx+XS9pLnRlc3QobmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgY2hhcmFjdGVyIGluIGhlYWRlciBmaWVsZCBuYW1lJylcbiAgICB9XG4gICAgcmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKVxuICB9XG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplVmFsdWUodmFsdWUpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykge1xuICAgICAgdmFsdWUgPSBTdHJpbmcodmFsdWUpXG4gICAgfVxuICAgIHJldHVybiB2YWx1ZVxuICB9XG5cbiAgLy8gQnVpbGQgYSBkZXN0cnVjdGl2ZSBpdGVyYXRvciBmb3IgdGhlIHZhbHVlIGxpc3RcbiAgZnVuY3Rpb24gaXRlcmF0b3JGb3IoaXRlbXMpIHtcbiAgICB2YXIgaXRlcmF0b3IgPSB7XG4gICAgICBuZXh0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gaXRlbXMuc2hpZnQoKVxuICAgICAgICByZXR1cm4ge2RvbmU6IHZhbHVlID09PSB1bmRlZmluZWQsIHZhbHVlOiB2YWx1ZX1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3VwcG9ydC5pdGVyYWJsZSkge1xuICAgICAgaXRlcmF0b3JbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gaXRlcmF0b3JcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaXRlcmF0b3JcbiAgfVxuXG4gIGZ1bmN0aW9uIEhlYWRlcnMoaGVhZGVycykge1xuICAgIHRoaXMubWFwID0ge31cblxuICAgIGlmIChoZWFkZXJzIGluc3RhbmNlb2YgSGVhZGVycykge1xuICAgICAgaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIHZhbHVlKVxuICAgICAgfSwgdGhpcylcblxuICAgIH0gZWxzZSBpZiAoaGVhZGVycykge1xuICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoaGVhZGVycykuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIGhlYWRlcnNbbmFtZV0pXG4gICAgICB9LCB0aGlzKVxuICAgIH1cbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgbmFtZSA9IG5vcm1hbGl6ZU5hbWUobmFtZSlcbiAgICB2YWx1ZSA9IG5vcm1hbGl6ZVZhbHVlKHZhbHVlKVxuICAgIHZhciBsaXN0ID0gdGhpcy5tYXBbbmFtZV1cbiAgICBpZiAoIWxpc3QpIHtcbiAgICAgIGxpc3QgPSBbXVxuICAgICAgdGhpcy5tYXBbbmFtZV0gPSBsaXN0XG4gICAgfVxuICAgIGxpc3QucHVzaCh2YWx1ZSlcbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlWydkZWxldGUnXSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBkZWxldGUgdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV1cbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgdmFsdWVzID0gdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV1cbiAgICByZXR1cm4gdmFsdWVzID8gdmFsdWVzWzBdIDogbnVsbFxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuZ2V0QWxsID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXSB8fCBbXVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiB0aGlzLm1hcC5oYXNPd25Qcm9wZXJ0eShub3JtYWxpemVOYW1lKG5hbWUpKVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXSA9IFtub3JtYWxpemVWYWx1ZSh2YWx1ZSldXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24oY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0aGlzLm1hcCkuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICB0aGlzLm1hcFtuYW1lXS5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdmFsdWUsIG5hbWUsIHRoaXMpXG4gICAgICB9LCB0aGlzKVxuICAgIH0sIHRoaXMpXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW1zID0gW11cbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHsgaXRlbXMucHVzaChuYW1lKSB9KVxuICAgIHJldHVybiBpdGVyYXRvckZvcihpdGVtcylcbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLnZhbHVlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpdGVtcyA9IFtdXG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlKSB7IGl0ZW1zLnB1c2godmFsdWUpIH0pXG4gICAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuZW50cmllcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpdGVtcyA9IFtdXG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7IGl0ZW1zLnB1c2goW25hbWUsIHZhbHVlXSkgfSlcbiAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpXG4gIH1cblxuICBpZiAoc3VwcG9ydC5pdGVyYWJsZSkge1xuICAgIEhlYWRlcnMucHJvdG90eXBlW1N5bWJvbC5pdGVyYXRvcl0gPSBIZWFkZXJzLnByb3RvdHlwZS5lbnRyaWVzXG4gIH1cblxuICBmdW5jdGlvbiBjb25zdW1lZChib2R5KSB7XG4gICAgaWYgKGJvZHkuYm9keVVzZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgVHlwZUVycm9yKCdBbHJlYWR5IHJlYWQnKSlcbiAgICB9XG4gICAgYm9keS5ib2R5VXNlZCA9IHRydWVcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUocmVhZGVyLnJlc3VsdClcbiAgICAgIH1cbiAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChyZWFkZXIuZXJyb3IpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRCbG9iQXNBcnJheUJ1ZmZlcihibG9iKSB7XG4gICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcbiAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoYmxvYilcbiAgICByZXR1cm4gZmlsZVJlYWRlclJlYWR5KHJlYWRlcilcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRCbG9iQXNUZXh0KGJsb2IpIHtcbiAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxuICAgIHJlYWRlci5yZWFkQXNUZXh0KGJsb2IpXG4gICAgcmV0dXJuIGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpXG4gIH1cblxuICBmdW5jdGlvbiBCb2R5KCkge1xuICAgIHRoaXMuYm9keVVzZWQgPSBmYWxzZVxuXG4gICAgdGhpcy5faW5pdEJvZHkgPSBmdW5jdGlvbihib2R5KSB7XG4gICAgICB0aGlzLl9ib2R5SW5pdCA9IGJvZHlcbiAgICAgIGlmICh0eXBlb2YgYm9keSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhpcy5fYm9keVRleHQgPSBib2R5XG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYmxvYiAmJiBCbG9iLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgIHRoaXMuX2JvZHlCbG9iID0gYm9keVxuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmZvcm1EYXRhICYmIEZvcm1EYXRhLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgIHRoaXMuX2JvZHlGb3JtRGF0YSA9IGJvZHlcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5zZWFyY2hQYXJhbXMgJiYgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keS50b1N0cmluZygpXG4gICAgICB9IGVsc2UgaWYgKCFib2R5KSB7XG4gICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gJydcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5hcnJheUJ1ZmZlciAmJiBBcnJheUJ1ZmZlci5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgICAvLyBPbmx5IHN1cHBvcnQgQXJyYXlCdWZmZXJzIGZvciBQT1NUIG1ldGhvZC5cbiAgICAgICAgLy8gUmVjZWl2aW5nIEFycmF5QnVmZmVycyBoYXBwZW5zIHZpYSBCbG9icywgaW5zdGVhZC5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcigndW5zdXBwb3J0ZWQgQm9keUluaXQgdHlwZScpXG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5oZWFkZXJzLmdldCgnY29udGVudC10eXBlJykpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBib2R5ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRoaXMuaGVhZGVycy5zZXQoJ2NvbnRlbnQtdHlwZScsICd0ZXh0L3BsYWluO2NoYXJzZXQ9VVRGLTgnKVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlCbG9iICYmIHRoaXMuX2JvZHlCbG9iLnR5cGUpIHtcbiAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KCdjb250ZW50LXR5cGUnLCB0aGlzLl9ib2R5QmxvYi50eXBlKVxuICAgICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuc2VhcmNoUGFyYW1zICYmIFVSTFNlYXJjaFBhcmFtcy5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgICAgIHRoaXMuaGVhZGVycy5zZXQoJ2NvbnRlbnQtdHlwZScsICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7Y2hhcnNldD1VVEYtOCcpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3VwcG9ydC5ibG9iKSB7XG4gICAgICB0aGlzLmJsb2IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcylcbiAgICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdGVkXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fYm9keUJsb2IpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2JvZHlCbG9iKVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlGb3JtRGF0YSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IHJlYWQgRm9ybURhdGEgYm9keSBhcyBibG9iJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBCbG9iKFt0aGlzLl9ib2R5VGV4dF0pKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuYXJyYXlCdWZmZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmxvYigpLnRoZW4ocmVhZEJsb2JBc0FycmF5QnVmZmVyKVxuICAgICAgfVxuXG4gICAgICB0aGlzLnRleHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcylcbiAgICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdGVkXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fYm9keUJsb2IpIHtcbiAgICAgICAgICByZXR1cm4gcmVhZEJsb2JBc1RleHQodGhpcy5fYm9keUJsb2IpXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUZvcm1EYXRhKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcmVhZCBGb3JtRGF0YSBib2R5IGFzIHRleHQnKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keVRleHQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy50ZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpXG4gICAgICAgIHJldHVybiByZWplY3RlZCA/IHJlamVjdGVkIDogUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2JvZHlUZXh0KVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdXBwb3J0LmZvcm1EYXRhKSB7XG4gICAgICB0aGlzLmZvcm1EYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRleHQoKS50aGVuKGRlY29kZSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmpzb24gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnRleHQoKS50aGVuKEpTT04ucGFyc2UpXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8vIEhUVFAgbWV0aG9kcyB3aG9zZSBjYXBpdGFsaXphdGlvbiBzaG91bGQgYmUgbm9ybWFsaXplZFxuICB2YXIgbWV0aG9kcyA9IFsnREVMRVRFJywgJ0dFVCcsICdIRUFEJywgJ09QVElPTlMnLCAnUE9TVCcsICdQVVQnXVxuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZU1ldGhvZChtZXRob2QpIHtcbiAgICB2YXIgdXBjYXNlZCA9IG1ldGhvZC50b1VwcGVyQ2FzZSgpXG4gICAgcmV0dXJuIChtZXRob2RzLmluZGV4T2YodXBjYXNlZCkgPiAtMSkgPyB1cGNhc2VkIDogbWV0aG9kXG4gIH1cblxuICBmdW5jdGlvbiBSZXF1ZXN0KGlucHV0LCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgICB2YXIgYm9keSA9IG9wdGlvbnMuYm9keVxuICAgIGlmIChSZXF1ZXN0LnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGlucHV0KSkge1xuICAgICAgaWYgKGlucHV0LmJvZHlVc2VkKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FscmVhZHkgcmVhZCcpXG4gICAgICB9XG4gICAgICB0aGlzLnVybCA9IGlucHV0LnVybFxuICAgICAgdGhpcy5jcmVkZW50aWFscyA9IGlucHV0LmNyZWRlbnRpYWxzXG4gICAgICBpZiAoIW9wdGlvbnMuaGVhZGVycykge1xuICAgICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgSGVhZGVycyhpbnB1dC5oZWFkZXJzKVxuICAgICAgfVxuICAgICAgdGhpcy5tZXRob2QgPSBpbnB1dC5tZXRob2RcbiAgICAgIHRoaXMubW9kZSA9IGlucHV0Lm1vZGVcbiAgICAgIGlmICghYm9keSkge1xuICAgICAgICBib2R5ID0gaW5wdXQuX2JvZHlJbml0XG4gICAgICAgIGlucHV0LmJvZHlVc2VkID0gdHJ1ZVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnVybCA9IGlucHV0XG4gICAgfVxuXG4gICAgdGhpcy5jcmVkZW50aWFscyA9IG9wdGlvbnMuY3JlZGVudGlhbHMgfHwgdGhpcy5jcmVkZW50aWFscyB8fCAnb21pdCdcbiAgICBpZiAob3B0aW9ucy5oZWFkZXJzIHx8ICF0aGlzLmhlYWRlcnMpIHtcbiAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKG9wdGlvbnMuaGVhZGVycylcbiAgICB9XG4gICAgdGhpcy5tZXRob2QgPSBub3JtYWxpemVNZXRob2Qob3B0aW9ucy5tZXRob2QgfHwgdGhpcy5tZXRob2QgfHwgJ0dFVCcpXG4gICAgdGhpcy5tb2RlID0gb3B0aW9ucy5tb2RlIHx8IHRoaXMubW9kZSB8fCBudWxsXG4gICAgdGhpcy5yZWZlcnJlciA9IG51bGxcblxuICAgIGlmICgodGhpcy5tZXRob2QgPT09ICdHRVQnIHx8IHRoaXMubWV0aG9kID09PSAnSEVBRCcpICYmIGJvZHkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0JvZHkgbm90IGFsbG93ZWQgZm9yIEdFVCBvciBIRUFEIHJlcXVlc3RzJylcbiAgICB9XG4gICAgdGhpcy5faW5pdEJvZHkoYm9keSlcbiAgfVxuXG4gIFJlcXVlc3QucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBSZXF1ZXN0KHRoaXMpXG4gIH1cblxuICBmdW5jdGlvbiBkZWNvZGUoYm9keSkge1xuICAgIHZhciBmb3JtID0gbmV3IEZvcm1EYXRhKClcbiAgICBib2R5LnRyaW0oKS5zcGxpdCgnJicpLmZvckVhY2goZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICAgIGlmIChieXRlcykge1xuICAgICAgICB2YXIgc3BsaXQgPSBieXRlcy5zcGxpdCgnPScpXG4gICAgICAgIHZhciBuYW1lID0gc3BsaXQuc2hpZnQoKS5yZXBsYWNlKC9cXCsvZywgJyAnKVxuICAgICAgICB2YXIgdmFsdWUgPSBzcGxpdC5qb2luKCc9JykucmVwbGFjZSgvXFwrL2csICcgJylcbiAgICAgICAgZm9ybS5hcHBlbmQoZGVjb2RlVVJJQ29tcG9uZW50KG5hbWUpLCBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpKVxuICAgICAgfVxuICAgIH0pXG4gICAgcmV0dXJuIGZvcm1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhlYWRlcnMoeGhyKSB7XG4gICAgdmFyIGhlYWQgPSBuZXcgSGVhZGVycygpXG4gICAgdmFyIHBhaXJzID0gKHhoci5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKSB8fCAnJykudHJpbSgpLnNwbGl0KCdcXG4nKVxuICAgIHBhaXJzLmZvckVhY2goZnVuY3Rpb24oaGVhZGVyKSB7XG4gICAgICB2YXIgc3BsaXQgPSBoZWFkZXIudHJpbSgpLnNwbGl0KCc6JylcbiAgICAgIHZhciBrZXkgPSBzcGxpdC5zaGlmdCgpLnRyaW0oKVxuICAgICAgdmFyIHZhbHVlID0gc3BsaXQuam9pbignOicpLnRyaW0oKVxuICAgICAgaGVhZC5hcHBlbmQoa2V5LCB2YWx1ZSlcbiAgICB9KVxuICAgIHJldHVybiBoZWFkXG4gIH1cblxuICBCb2R5LmNhbGwoUmVxdWVzdC5wcm90b3R5cGUpXG5cbiAgZnVuY3Rpb24gUmVzcG9uc2UoYm9keUluaXQsIG9wdGlvbnMpIHtcbiAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSB7fVxuICAgIH1cblxuICAgIHRoaXMudHlwZSA9ICdkZWZhdWx0J1xuICAgIHRoaXMuc3RhdHVzID0gb3B0aW9ucy5zdGF0dXNcbiAgICB0aGlzLm9rID0gdGhpcy5zdGF0dXMgPj0gMjAwICYmIHRoaXMuc3RhdHVzIDwgMzAwXG4gICAgdGhpcy5zdGF0dXNUZXh0ID0gb3B0aW9ucy5zdGF0dXNUZXh0XG4gICAgdGhpcy5oZWFkZXJzID0gb3B0aW9ucy5oZWFkZXJzIGluc3RhbmNlb2YgSGVhZGVycyA/IG9wdGlvbnMuaGVhZGVycyA6IG5ldyBIZWFkZXJzKG9wdGlvbnMuaGVhZGVycylcbiAgICB0aGlzLnVybCA9IG9wdGlvbnMudXJsIHx8ICcnXG4gICAgdGhpcy5faW5pdEJvZHkoYm9keUluaXQpXG4gIH1cblxuICBCb2R5LmNhbGwoUmVzcG9uc2UucHJvdG90eXBlKVxuXG4gIFJlc3BvbnNlLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUmVzcG9uc2UodGhpcy5fYm9keUluaXQsIHtcbiAgICAgIHN0YXR1czogdGhpcy5zdGF0dXMsXG4gICAgICBzdGF0dXNUZXh0OiB0aGlzLnN0YXR1c1RleHQsXG4gICAgICBoZWFkZXJzOiBuZXcgSGVhZGVycyh0aGlzLmhlYWRlcnMpLFxuICAgICAgdXJsOiB0aGlzLnVybFxuICAgIH0pXG4gIH1cblxuICBSZXNwb25zZS5lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciByZXNwb25zZSA9IG5ldyBSZXNwb25zZShudWxsLCB7c3RhdHVzOiAwLCBzdGF0dXNUZXh0OiAnJ30pXG4gICAgcmVzcG9uc2UudHlwZSA9ICdlcnJvcidcbiAgICByZXR1cm4gcmVzcG9uc2VcbiAgfVxuXG4gIHZhciByZWRpcmVjdFN0YXR1c2VzID0gWzMwMSwgMzAyLCAzMDMsIDMwNywgMzA4XVxuXG4gIFJlc3BvbnNlLnJlZGlyZWN0ID0gZnVuY3Rpb24odXJsLCBzdGF0dXMpIHtcbiAgICBpZiAocmVkaXJlY3RTdGF0dXNlcy5pbmRleE9mKHN0YXR1cykgPT09IC0xKSB7XG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW52YWxpZCBzdGF0dXMgY29kZScpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7c3RhdHVzOiBzdGF0dXMsIGhlYWRlcnM6IHtsb2NhdGlvbjogdXJsfX0pXG4gIH1cblxuICBzZWxmLkhlYWRlcnMgPSBIZWFkZXJzXG4gIHNlbGYuUmVxdWVzdCA9IFJlcXVlc3RcbiAgc2VsZi5SZXNwb25zZSA9IFJlc3BvbnNlXG5cbiAgc2VsZi5mZXRjaCA9IGZ1bmN0aW9uKGlucHV0LCBpbml0KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdmFyIHJlcXVlc3RcbiAgICAgIGlmIChSZXF1ZXN0LnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGlucHV0KSAmJiAhaW5pdCkge1xuICAgICAgICByZXF1ZXN0ID0gaW5wdXRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlcXVlc3QgPSBuZXcgUmVxdWVzdChpbnB1dCwgaW5pdClcbiAgICAgIH1cblxuICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpXG5cbiAgICAgIGZ1bmN0aW9uIHJlc3BvbnNlVVJMKCkge1xuICAgICAgICBpZiAoJ3Jlc3BvbnNlVVJMJyBpbiB4aHIpIHtcbiAgICAgICAgICByZXR1cm4geGhyLnJlc3BvbnNlVVJMXG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdm9pZCBzZWN1cml0eSB3YXJuaW5ncyBvbiBnZXRSZXNwb25zZUhlYWRlciB3aGVuIG5vdCBhbGxvd2VkIGJ5IENPUlNcbiAgICAgICAgaWYgKC9eWC1SZXF1ZXN0LVVSTDovbS50ZXN0KHhoci5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKSkpIHtcbiAgICAgICAgICByZXR1cm4geGhyLmdldFJlc3BvbnNlSGVhZGVyKCdYLVJlcXVlc3QtVVJMJylcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgIHN0YXR1czogeGhyLnN0YXR1cyxcbiAgICAgICAgICBzdGF0dXNUZXh0OiB4aHIuc3RhdHVzVGV4dCxcbiAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzKHhociksXG4gICAgICAgICAgdXJsOiByZXNwb25zZVVSTCgpXG4gICAgICAgIH1cbiAgICAgICAgdmFyIGJvZHkgPSAncmVzcG9uc2UnIGluIHhociA/IHhoci5yZXNwb25zZSA6IHhoci5yZXNwb25zZVRleHRcbiAgICAgICAgcmVzb2x2ZShuZXcgUmVzcG9uc2UoYm9keSwgb3B0aW9ucykpXG4gICAgICB9XG5cbiAgICAgIHhoci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChuZXcgVHlwZUVycm9yKCdOZXR3b3JrIHJlcXVlc3QgZmFpbGVkJykpXG4gICAgICB9XG5cbiAgICAgIHhoci5vbnRpbWVvdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ05ldHdvcmsgcmVxdWVzdCBmYWlsZWQnKSlcbiAgICAgIH1cblxuICAgICAgeGhyLm9wZW4ocmVxdWVzdC5tZXRob2QsIHJlcXVlc3QudXJsLCB0cnVlKVxuXG4gICAgICBpZiAocmVxdWVzdC5jcmVkZW50aWFscyA9PT0gJ2luY2x1ZGUnKSB7XG4gICAgICAgIHhoci53aXRoQ3JlZGVudGlhbHMgPSB0cnVlXG4gICAgICB9XG5cbiAgICAgIGlmICgncmVzcG9uc2VUeXBlJyBpbiB4aHIgJiYgc3VwcG9ydC5ibG9iKSB7XG4gICAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnYmxvYidcbiAgICAgIH1cblxuICAgICAgcmVxdWVzdC5oZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIobmFtZSwgdmFsdWUpXG4gICAgICB9KVxuXG4gICAgICB4aHIuc2VuZCh0eXBlb2YgcmVxdWVzdC5fYm9keUluaXQgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IHJlcXVlc3QuX2JvZHlJbml0KVxuICAgIH0pXG4gIH1cbiAgc2VsZi5mZXRjaC5wb2x5ZmlsbCA9IHRydWVcbn0pKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJyA/IHNlbGYgOiB0aGlzKTtcbiIsIi8qKlxuICogQWdncmVnYXRlIHZhbHVlcyBmcm9tIGRvbSB0cmVlXG4gKi9cbmNsYXNzIEFnZ3JlZ2F0b3Ige1xuICBjb25zdHJ1Y3RvcihlbGVtZW50KSB7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgfVxuXG4gIGFnZ3JlZ2F0ZShzY29wZSkge1xuICAgIGNvbnN0IGVsZW1zID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2lucHV0LHNlbGVjdCx0ZXh0YXJlYScpO1xuICAgIGZvciAobGV0IGk9MCwgbD1lbGVtcy5sZW5ndGg7IGk8bDsgKytpKSB7XG4gICAgICBjb25zdCBlbGVtID0gZWxlbXNbaV07XG4gICAgICBjb25zdCBtb2RlbE5hbWUgPSBlbGVtLmdldEF0dHJpYnV0ZSgnc2otbW9kZWwnKTtcbiAgICAgIGlmIChtb2RlbE5hbWUgJiYgbW9kZWxOYW1lLnN1YnN0cigwLDUpID09PSAndGhpcy4nKSB7XG4gICAgICAgIGNvbnN0IHZhbCA9IGVsZW0udHlwZSA9PT0gJ2NoZWNrYm94JyA/IGVsZW0uY2hlY2tlZCA6IGVsZW0udmFsdWU7XG4gICAgICAgIG5ldyBGdW5jdGlvbignJHZhbCcsIGBpZiAoISR7bW9kZWxOYW1lfSkgeyAke21vZGVsTmFtZX09JHZhbDsgfWApLmFwcGx5KHNjb3BlLCBbdmFsXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQWdncmVnYXRvcjtcblxuIiwiY29uc3QgSW5jcmVtZW50YWxET00gPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20vZGlzdC9pbmNyZW1lbnRhbC1kb20uanMnKTtcbmNvbnN0IHNjYW4gPSByZXF1aXJlKCcuL3RleHQtZXhwcmVzc2lvbi1zY2FubmVyLmpzJyk7XG5jb25zdCBhc3NlcnQgPSB2YWwgPT4geyB9O1xuXG4vLyBoYWNrXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlL2luY3JlbWVudGFsLWRvbS9pc3N1ZXMvMjM5XG5JbmNyZW1lbnRhbERPTS5hdHRyaWJ1dGVzLnZhbHVlID0gZnVuY3Rpb24gKGVsLCBuYW1lLCB2YWx1ZSkge1xuICBlbC52YWx1ZSA9IHZhbHVlXG59O1xuXG5jb25zdCBzal9hdHRyMmV2ZW50ID0ge1xuICAnc2otY2xpY2snOiAnb25jbGljaycsXG4gICdzai1ibHVyJzogJ29uYmx1cicsXG4gICdzai1jaGVja2VkJzogJ29uY2hlY2tlZCcsXG4gICdzai1kYmxjbGljayc6ICdvbmRibGNsaWNrJyxcbiAgJ3NqLWZvY3VzJzogJ29uZm9jdXMnLFxuICAnc2ota2V5ZG93bic6ICdvbmtleWRvd24nLFxuICAnc2ota2V5cHJlc3MnOiAnb25rZXlwcmVzcycsXG4gICdzai1rZXl1cCc6ICdvbmtleXVwJyxcbiAgJ3NqLW1vdXNlZG93bic6ICdvbm1vdXNlZG93bicsXG4gICdzai1tb3VzZWVudGVyJzogJ29ubW91c2VlbnRlcicsXG4gICdzai1tb3VzZWxlYXZlJzogJ29ubW91c2VsZWF2ZScsXG4gICdzai1tb3VzZW1vdmUnOiAnb25tb3VzZW1vdmUnLFxuICAnc2otbW91c2VvdmVyJzogJ29ubW91c2VvdmVyJyxcbiAgJ3NqLW1vdXNldXAnOiAnb25tb3VzZXVwJyxcbiAgJ3NqLXBhc3RlJzogJ29ucGFzdGUnLFxuICAnc2otc2VsZWN0ZWQnOiAnb25zZWxlY3RlZCcsXG4gICdzai1zdWJtaXQnOiAnb25zdWJtaXQnXG59O1xuXG5jb25zdCBzal9ib29sZWFuX2F0dHJpYnV0ZXMgPSB7XG4gICdzai1kaXNhYmxlZCc6ICdkaXNhYmxlZCcsXG4gICdzai1yZXF1aXJlZCc6ICdyZXF1aXJlZCcsXG4gICdzai1jaGVja2VkJzogJ2NoZWNrZWQnXG59O1xuXG5jbGFzcyBDb21waWxlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIGFzc2VydChhcmd1bWVudHMubGVuZ3RoID09PSAwKTtcbiAgfVxuXG4gIGNvbXBpbGUodGVtcGxhdGVFbGVtZW50KSB7XG4gICAgY29uc3QgY2hpbGRyZW4gPSB0ZW1wbGF0ZUVsZW1lbnQuY2hpbGROb2RlcztcbiAgICBsZXQgY29kZSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgIGNvZGUgPSBjb2RlLmNvbmNhdCh0aGlzLnJlbmRlckRPTShjaGlsZHJlbltpXSwgW10pKTtcbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2coY29kZS5qb2luKFwiO1xcblwiKSk7XG4gICAgcmV0dXJuIG5ldyBGdW5jdGlvbignSW5jcmVtZW50YWxET00nLCBjb2RlLmpvaW4oXCI7XFxuXCIpKTtcbiAgfVxuXG4gIHJlbmRlckRPTShlbGVtLCB2YXJzKSB7XG4gICAgYXNzZXJ0KGVsZW0pO1xuICAgIGFzc2VydCh2YXJzKTtcbiAgICBpZiAoZWxlbS5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcbiAgICAgIHJldHVybiBgSW5jcmVtZW50YWxET00udGV4dCgke3RoaXMudGV4dChlbGVtLnRleHRDb250ZW50KX0pYDtcbiAgICB9IGVsc2UgaWYgKGVsZW0ubm9kZVR5cGUgPT09IE5vZGUuQ09NTUVOVF9OT0RFKSB7XG4gICAgICAvLyBJZ25vcmUgY29tbWVudCBub2RlXG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGVycyA9IFtdO1xuICAgIGNvbnN0IGZvb3RlcnMgPSBbXTtcbiAgICB2YXIgYm9keSA9IFtdO1xuXG4gICAgLy8gcHJvY2VzcyBgc2otaWZgXG4gICAge1xuICAgICAgY29uc3QgY29uZCA9IGVsZW0uZ2V0QXR0cmlidXRlKCdzai1pZicpO1xuICAgICAgaWYgKGNvbmQpIHtcbiAgICAgICAgaGVhZGVycy5wdXNoKGBpZiAoJHtjb25kfSkge2ApO1xuICAgICAgICBmb290ZXJzLnB1c2goYH1gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBwcm9jZXNzIGBzai1yZXBlYXRgXG4gICAge1xuICAgICAgY29uc3QgY29uZCA9IGVsZW0uZ2V0QXR0cmlidXRlKCdzai1yZXBlYXQnKTtcbiAgICAgIGlmIChjb25kKSB7XG4gICAgICAgIGNvbnN0IG0gPSBjb25kLm1hdGNoKC9eXFxzKig/OihcXHcrKXxcXChcXHMqKFxcdyspXFxzKixcXHMqKFxcdyspXFxzKlxcKSlcXHMraW5cXHMrKFthLXpdW2EtejAtOS5dKilcXHMqJC8pO1xuICAgICAgICBpZiAoIW0pIHtcbiAgICAgICAgICB0aHJvdyBgSW52YWxpZCBzai1yZXBlYXQgdmFsdWU6ICR7Y29uZH1gO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1bMV0pIHtcbiAgICAgICAgICBjb25zdCB2YXJOYW1lID0gbVsxXTtcbiAgICAgICAgICBjb25zdCBjb250YWluZXIgPSBtWzRdO1xuXG4gICAgICAgICAgaGVhZGVycy5wdXNoKGAoZnVuY3Rpb24oSW5jcmVtZW50YWxET00pIHtcXG52YXIgJCRjb250YWluZXI9JHtjb250YWluZXJ9O1xcbmZvciAodmFyICRpbmRleD0wLCRsPSQkY29udGFpbmVyLmxlbmd0aDsgJGluZGV4PCRsOyAkaW5kZXgrKykge1xcbnZhciAke3Zhck5hbWV9PSQkY29udGFpbmVyWyRpbmRleF07YCk7XG4gICAgICAgICAgZm9vdGVycy5wdXNoKGB9XFxufSkuYXBwbHkodGhpcywgW0luY3JlbWVudGFsRE9NXSk7YCk7XG5cbiAgICAgICAgICB2YXJzID0gdmFycy5jb25jYXQoW3Zhck5hbWUsICckaW5kZXgnXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3Qga2V5TmFtZSA9IG1bMl07XG4gICAgICAgICAgY29uc3QgdmFsdWVOYW1lID0gbVszXTtcbiAgICAgICAgICBjb25zdCBjb250YWluZXIgPSBtWzRdO1xuICAgICAgICAgIGhlYWRlcnMucHVzaChgKGZ1bmN0aW9uKEluY3JlbWVudGFsRE9NKSB7XFxuJCRjb250YWluZXI9JHtjb250YWluZXJ9O2ZvciAodmFyICR7a2V5TmFtZX0gaW4gJCRjb250YWluZXIpIHtcXG52YXIgJHt2YWx1ZU5hbWV9PSQkY29udGFpbmVyWyR7a2V5TmFtZX1dO2ApO1xuICAgICAgICAgIGZvb3RlcnMucHVzaChgfVxcbn0pLmFwcGx5KHRoaXMsIFtJbmNyZW1lbnRhbERPTV0pO2ApO1xuICAgICAgICAgIHZhcnMgPSB2YXJzLmNvbmNhdChba2V5TmFtZSwgdmFsdWVOYW1lXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB0YWdOYW1lID0gZWxlbS50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAvLyBwcm9jZXNzIGF0dHJpYnV0ZXNcbiAgICBib2R5LnB1c2goYEluY3JlbWVudGFsRE9NLmVsZW1lbnRPcGVuU3RhcnQoXCIke3RhZ05hbWV9XCIpYCk7XG4gICAgYm9keSA9IGJvZHkuY29uY2F0KHRoaXMucmVuZGVyQXR0cmlidXRlcyhlbGVtLCB2YXJzKSk7XG4gICAgYm9keS5wdXNoKGBJbmNyZW1lbnRhbERPTS5lbGVtZW50T3BlbkVuZChcIiR7dGFnTmFtZX1cIilgKTtcblxuICAgIGNvbnN0IGJpbmQgPSBlbGVtLmdldEF0dHJpYnV0ZSgnc2otYmluZCcpO1xuICAgIGlmICh0YWdOYW1lLmluZGV4T2YoJy0nKSA+PSAwKSB7XG4gICAgICBib2R5LnB1c2goYEluY3JlbWVudGFsRE9NLnNraXAoKWApO1xuICAgIH0gZWxzZSBpZiAoYmluZCkge1xuICAgICAgYm9keS5wdXNoKGBJbmNyZW1lbnRhbERPTS50ZXh0KCR7YmluZH0pO2ApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjaGlsZHJlbiA9IGVsZW0uY2hpbGROb2RlcztcbiAgICAgIGZvciAobGV0IGkgPSAwLCBsID0gY2hpbGRyZW4ubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgaWYgKGNoaWxkLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuICAgICAgICAvLyByZXBsYWNlVmFyaWFibGVzXG4gICAgICAgIGJvZHkucHVzaChgSW5jcmVtZW50YWxET00udGV4dCgke3RoaXMudGV4dChjaGlsZC50ZXh0Q29udGVudCl9KWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYm9keSA9IGJvZHkuY29uY2F0KHRoaXMucmVuZGVyRE9NKGNoaWxkLCB2YXJzKSk7XG4gICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGJvZHkucHVzaChgSW5jcmVtZW50YWxET00uZWxlbWVudENsb3NlKFwiJHt0YWdOYW1lfVwiKWApO1xuXG4gICAgY29uc3QgcmV0dmFsID0gWyc7J10uY29uY2F0KGhlYWRlcnMpLmNvbmNhdChib2R5KS5jb25jYXQoZm9vdGVycyk7XG4gICAgLy8gY29uc29sZS5sb2coYERPTkUgcmVuZGVyRE9NICR7SlNPTi5zdHJpbmdpZnkocmV0dmFsKX1gKTtcbiAgICByZXR1cm4gcmV0dmFsO1xuICB9XG5cbiAgcmVuZGVyQXR0cmlidXRlcyhlbGVtLCB2YXJzKSB7XG4gICAgYXNzZXJ0KHZhcnMpO1xuICAgIGNvbnN0IGF0dHJzID0gZWxlbS5hdHRyaWJ1dGVzO1xuICAgIGNvbnN0IGNvZGVMaXN0ID0gW107XG4gICAgY29uc3QgbW9kZWwgPSBlbGVtLmdldEF0dHJpYnV0ZSgnc2otbW9kZWwnKTtcbiAgICBjb25zdCBldmVudHMgPSB7fTtcbiAgICBmb3IgKGxldCBpID0gMCwgbCA9IGF0dHJzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgY29uc3QgYXR0ciA9IGF0dHJzW2ldO1xuICAgICAgY29uc3QgY29kZSA9IHRoaXMucmVuZGVyQXR0cmlidXRlKGVsZW0sIGF0dHJzW2ldLCB2YXJzLCBldmVudHMpO1xuICAgICAgY29kZUxpc3QucHVzaChjb2RlKTtcbiAgICB9XG5cbiAgICBjb25zdCBub3JtYWxFdmVudHMgPSBbXG4gICAgICAnb25jbGljaycsXG4gICAgICAnb25ibHVyJyxcbiAgICAgICdvbmNoZWNrZWQnLFxuICAgICAgJ29uZGJsY2xpY2snLFxuICAgICAgJ29uZm9jdXMnLFxuICAgICAgJ29ua2V5ZG93bicsXG4gICAgICAnb25rZXlwcmVzcycsXG4gICAgICAnb25rZXl1cCcsXG4gICAgICAnb25tb3VzZWRvd24nLFxuICAgICAgJ29ubW91c2VlbnRlcicsXG4gICAgICAnb25tb3VzZWxlYXZlJyxcbiAgICAgICdvbm1vdXNlbW92ZScsXG4gICAgICAnb25tb3VzZW92ZXInLFxuICAgICAgJ29ubW91c2V1cCcsXG4gICAgICAnb25wYXN0ZScsXG4gICAgICAnb25zZWxlY3RlZCcsXG4gICAgICAnb25jaGFuZ2UnLFxuICAgICAgJ29uc3VibWl0J1xuICAgIF07XG4gICAgaWYgKG1vZGVsKSB7XG4gICAgICBpZiAoZWxlbS50eXBlID09PSAnY2hlY2tib3gnIHx8IGVsZW0udHlwZSA9PT0gJ3JhZGlvJykge1xuICAgICAgICBub3JtYWxFdmVudHMucHVzaCgnb25pbnB1dCcpO1xuICAgICAgICBjb25zdCBjb2RlID0gZXZlbnRzWydvbmNoYW5nZSddIHx8ICcnO1xuICAgICAgICBjb2RlTGlzdC5wdXNoKGBcbiAgICAgICAgICBpZiAoJHttb2RlbH0pIHtcbiAgICAgICAgICAgIEluY3JlbWVudGFsRE9NLmF0dHIoXCJjaGVja2VkXCIsICdjaGVja2VkJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIEluY3JlbWVudGFsRE9NLmF0dHIoXCJvbmNoYW5nZVwiLCBmdW5jdGlvbiAoJHt2YXJzLmNvbmNhdChbJyRldmVudCddKS5qb2luKFwiLFwiKX0pIHtcbiAgICAgICAgICAgICR7Y29kZX07XG4gICAgICAgICAgICAke21vZGVsfSA9ICRldmVudC50YXJnZXQuY2hlY2tlZDtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICAgICAgfS5iaW5kKCR7Wyd0aGlzJ10uY29uY2F0KHZhcnMpLmpvaW4oXCIsXCIpfSkpO1xuICAgICAgICBgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vcm1hbEV2ZW50cy5wdXNoKCdvbmNoYW5nZScpO1xuICAgICAgICBjb25zdCBjb2RlID0gZXZlbnRzWydvbmlucHV0J10gfHwgJyc7XG4gICAgICAgIGNvZGVMaXN0LnB1c2goYFxuICAgICAgICAgIEluY3JlbWVudGFsRE9NLmF0dHIoXCJ2YWx1ZVwiLCAke21vZGVsfSk7XG4gICAgICAgICAgSW5jcmVtZW50YWxET00uYXR0cihcIm9uaW5wdXRcIiwgZnVuY3Rpb24gKCR7dmFycy5jb25jYXQoWyckZXZlbnQnXSkuam9pbihcIixcIil9KSB7XG4gICAgICAgICAgICAke2NvZGV9O1xuICAgICAgICAgICAgJHttb2RlbH0gPSAkZXZlbnQudGFyZ2V0LnZhbHVlO1xuICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgICAgICB9LmJpbmQoJHtbJ3RoaXMnXS5jb25jYXQodmFycykuam9pbihcIixcIil9KSk7XG4gICAgICAgIGApO1xuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGxldCBpPTAsIGw9bm9ybWFsRXZlbnRzLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgIGNvbnN0IGV2ZW50TmFtZSA9IG5vcm1hbEV2ZW50c1tpXTtcbiAgICAgIGNvbnN0IGV4cHJlc3Npb24gPSBldmVudHNbZXZlbnROYW1lXTtcbiAgICAgIGlmIChleHByZXNzaW9uKSB7XG4gICAgICAgIGNvZGVMaXN0LnB1c2goYDtcbiAgICAgICAgSW5jcmVtZW50YWxET00uYXR0cihcIiR7ZXZlbnROYW1lfVwiLCBmdW5jdGlvbiAoJHt2YXJzLmNvbmNhdChbJyRldmVudCddKS5qb2luKFwiLFwiKX0pIHtcbiAgICAgICAgICAke2V4cHJlc3Npb259O1xuICAgICAgICB9LmJpbmQoJHtbJ3RoaXMnXS5jb25jYXQodmFycykuam9pbihcIixcIil9KSk7YCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coYERPTkUgcmVuZGVyQXR0cmlidXRlcyAke0pTT04uc3RyaW5naWZ5KGNvZGVMaXN0KX1gKTtcbiAgICByZXR1cm4gY29kZUxpc3Q7XG4gIH1cblxuICByZW5kZXJBdHRyaWJ1dGUoZWxlbSwgYXR0ciwgdmFycywgZXZlbnRzKSB7XG4gICAgYXNzZXJ0KHZhcnMpO1xuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJBdHRyaWJ1dGU6ICR7YXR0ci5uYW1lfT0ke2F0dHIudmFsdWV9YCk7XG5cbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHIubmFtZTtcbiAgICBpZiAoYXR0ck5hbWUuc3Vic3RyKDAsMykgPT09ICdzai0nKSB7XG4gICAgICBjb25zdCBldmVudCA9IHNqX2F0dHIyZXZlbnRbYXR0ck5hbWVdO1xuICAgICAgaWYgKGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IGV4cHJlc3Npb24gPSBhdHRyLnZhbHVlO1xuICAgICAgICBldmVudHNbZXZlbnRdID0gZXhwcmVzc2lvbjtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfSBlbHNlIGlmIChzal9ib29sZWFuX2F0dHJpYnV0ZXNbYXR0ci5uYW1lXSkge1xuICAgICAgICBjb25zdCBhdHRyaWJ1dGUgPSBzal9ib29sZWFuX2F0dHJpYnV0ZXNbYXR0ci5uYW1lXTtcbiAgICAgICAgY29uc3QgZXhwcmVzc2lvbiA9IGF0dHIudmFsdWU7XG4gICAgICAgIHJldHVybiBgaWYgKCR7ZXhwcmVzc2lvbn0pIHsgSW5jcmVtZW50YWxET00uYXR0cihcIiR7YXR0cmlidXRlfVwiLCBcIiR7YXR0cmlidXRlfVwiKTsgfWA7XG4gICAgICB9IGVsc2UgaWYgKGF0dHIubmFtZSA9PT0gJ3NqLWNsYXNzJykge1xuICAgICAgICByZXR1cm4gYEluY3JlbWVudGFsRE9NLmF0dHIoXCJjbGFzc1wiLCAke2F0dHIudmFsdWV9LmpvaW4oXCIgXCIpKTtgO1xuICAgICAgfSBlbHNlIGlmIChhdHRyLm5hbWUgPT09ICdzai1zdHlsZScpIHtcbiAgICAgICAgcmV0dXJuIGBJbmNyZW1lbnRhbERPTS5hdHRyKFwic3R5bGVcIiwgJHthdHRyLnZhbHVlfSk7YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGF0dHIubmFtZSA9PT0gJ2hyZWYnKSB7XG4gICAgICAgIHJldHVybiBgSW5jcmVtZW50YWxET00uYXR0cihcIiR7YXR0ci5uYW1lfVwiLCAke3RoaXMudGV4dChhdHRyLnZhbHVlKX0ucmVwbGFjZSgvXlteOl0rPzovLCBmdW5jdGlvbiAoc2NoZW1lKSB7IHJldHVybiAoc2NoZW1lID09PSAnaHR0cDonIHx8IHNjaGVtZSA9PT0gJ2h0dHBzOi8vJykgPyBzY2hlbWUgOiAndW5zYWZlOicgKyBzY2hlbWUgfSkpO2A7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoKGF0dHIubmFtZS5zdWJzdHIoMCwgMikgPT09ICdvbicpICYmIChhdHRyLnZhbHVlID1+IC9cXHtcXHsvKSkge1xuICAgICAgICAgIHRocm93IGBZb3UgY2FuJ3QgaW5jbHVkZSB7e319IGV4cHJlc3Npb24gaW4gZXZlbnQgaGFuZGxlcihTZWN1cml0eSByZWFzb24pLiBZb3Ugc2hvdWxkIHVzZSBzai0qIGluc3RlYWQuYDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYEluY3JlbWVudGFsRE9NLmF0dHIoXCIke2F0dHIubmFtZX1cIiwgJHt0aGlzLnRleHQoYXR0ci52YWx1ZSl9KTtgO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHRleHQocykge1xuICAgIHJldHVybiBzY2FuKHMpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcGlsZXI7XG5cbiIsImNvbnN0IENvbXBpbGVyID0gcmVxdWlyZSgnLi9jb21waWxlci5qcycpO1xuY29uc3QgQWdncmVnYXRvciA9IHJlcXVpcmUoJy4vYWdncmVnYXRvci5qcycpO1xuY29uc3QgSW5jcmVtZW50YWxET00gPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20vZGlzdC9pbmNyZW1lbnRhbC1kb20uanMnKTtcblxuLy8gYmFiZWwgaGFja3Ncbi8vIFNlZSBodHRwczovL3BoYWJyaWNhdG9yLmJhYmVsanMuaW8vVDE1NDhcbmlmICh0eXBlb2YgSFRNTEVsZW1lbnQgIT09ICdmdW5jdGlvbicpIHtcbiAgdmFyIF9IVE1MRWxlbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgfTtcbiAgX0hUTUxFbGVtZW50LnByb3RvdHlwZSA9IEhUTUxFbGVtZW50LnByb3RvdHlwZTtcbiAgSFRNTEVsZW1lbnQgPSBfSFRNTEVsZW1lbnQ7XG59XG5cbmNsYXNzIEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAvLyBwYXJzZSB0ZW1wbGF0ZVxuICAgIHZhciB0ZW1wbGF0ZSA9IHRoaXMudGVtcGxhdGUoKTtcbiAgICBpZiAoIXRlbXBsYXRlKSB7XG4gICAgICB0aHJvdyBgdGVtcGxhdGUgc2hvdWxkbid0IGJlIG51bGxgO1xuICAgIH1cblxuICAgIGNvbnN0IGh0bWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGh0bWwuaW5uZXJIVE1MID0gdGVtcGxhdGU7XG5cbiAgICB0aGlzLnByZXBhcmUoKTtcblxuICAgIC8vIFRPRE8gY2FjaGUgcmVzdWx0IGFzIGNsYXNzIHZhcmlhYmxlLlxuICAgIG5ldyBBZ2dyZWdhdG9yKGh0bWwpLmFnZ3JlZ2F0ZSh0aGlzKTtcbiAgICB0aGlzLmNvbXBpbGVkID0gbmV3IENvbXBpbGVyKCkuY29tcGlsZShodG1sKTtcblxuICAgIHRoaXMuaW5pdGlhbGl6ZSgpO1xuXG4gICAgdGhpcy51cGRhdGUoKTtcbiAgfVxuXG4gIHRlbXBsYXRlKCkge1xuICAgIHRocm93IFwiUGxlYXNlIGltcGxlbWVudCAndGVtcGxhdGUnIG1ldGhvZFwiO1xuICB9XG5cbiAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGtleSkge1xuICAgIHRoaXNba2V5XSA9IHRoaXMuZ2V0QXR0cmlidXRlKGtleSk7XG4gICAgdGhpcy51cGRhdGUoKTtcbiAgfVxuXG4gIHByZXBhcmUoKSB7XG4gICAgLy8gbm9wLiBhYnN0cmFjdCBtZXRob2QuXG4gIH1cblxuICBpbml0aWFsaXplKCkge1xuICAgIC8vIG5vcC4gYWJzdHJhY3QgbWV0aG9kLlxuICB9XG5cbiAgdXBkYXRlKCkge1xuICAgIEluY3JlbWVudGFsRE9NLnBhdGNoKHRoaXMsICgpID0+IHtcbiAgICAgIHRoaXMuY29tcGlsZWQuYXBwbHkodGhpcywgW0luY3JlbWVudGFsRE9NXSk7XG4gICAgfSk7XG4gIH1cblxuICBkdW1wKCkge1xuICAgIGNvbnN0IHNjb3BlID0ge307XG4gICAgT2JqZWN0LmtleXModGhpcykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgaWYgKGtleSAhPT0gJ3JlbmRlcmVyJykge1xuICAgICAgICBzY29wZVtrZXldID0gdGhpc1trZXldO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBzY29wZTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVsZW1lbnQ7XG5cbiIsIi8vIHBvbHlmaWxsc1xucmVxdWlyZSgnd2ViY29tcG9uZW50cy5qcy9DdXN0b21FbGVtZW50cy5qcycpO1xucmVxdWlyZSgnLi9wb2x5ZmlsbC5qcycpO1xucmVxdWlyZSgnd2hhdHdnLWZldGNoL2ZldGNoLmpzJyk7XG5cbmNvbnN0IHRhZyA9IHJlcXVpcmUoJy4vdGFnLmpzJyk7XG5jb25zdCBFbGVtZW50ID0gcmVxdWlyZSgnLi9lbGVtZW50LmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzLkVsZW1lbnQgPSBFbGVtZW50O1xubW9kdWxlLmV4cG9ydHMudGFnID0gdGFnO1xuIiwiLy8gcG9seWZpbGxcbnJlcXVpcmUoJ3dlYmNvbXBvbmVudHMuanMvQ3VzdG9tRWxlbWVudHMuanMnKTtcblxuaWYgKCF3aW5kb3cuY3VzdG9tRWxlbWVudHMpIHtcbiAgd2luZG93LmN1c3RvbUVsZW1lbnRzID0ge1xuICAgIGRlZmluZTogZnVuY3Rpb24gKG5hbWUsIGVsZW0pIHtcbiAgICAgIGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChuYW1lLCBlbGVtKTtcbiAgICB9XG4gIH07XG59XG5cbiIsImNvbnN0IENvbXBpbGVyID0gcmVxdWlyZSgnLi9jb21waWxlcicpO1xuY29uc3QgSW5jcmVtZW50YWxET00gPSByZXF1aXJlKCdpbmNyZW1lbnRhbC1kb20vZGlzdC9pbmNyZW1lbnRhbC1kb20uanMnKTtcbmNvbnN0IEFnZ3JlZ2F0b3IgPSByZXF1aXJlKCcuL2FnZ3JlZ2F0b3IuanMnKTtcblxudmFyIHVud3JhcENvbW1lbnQgPSAvXFwvXFwqIT8oPzpcXEBwcmVzZXJ2ZSk/WyBcXHRdKig/OlxcclxcbnxcXG4pKFtcXHNcXFNdKj8pKD86XFxyXFxufFxcbilcXHMqXFwqXFwvLztcblxuZnVuY3Rpb24gdGFnKHRhZ05hbWUsIG9wdHMpIHtcbiAgY29uc3QgdGVtcGxhdGUgPSBvcHRzLnRlbXBsYXRlO1xuICBkZWxldGUgb3B0c1sndGVtcGxhdGUnXTtcbiAgaWYgKCF0ZW1wbGF0ZSkge1xuICAgIHRocm93IFwiTWlzc2luZyB0ZW1wbGF0ZVwiO1xuICB9XG5cbiAgY29uc3Qgc2NvcGUgPSBvcHRzWydkZWZhdWx0J10gfHwge307XG4gIGxldCBjb21waWxlZDtcblxuICBjb25zdCBlbGVtZW50Q2xhc3NQcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG4gIGNvbnN0IGVsZW1lbnRDbGFzcyA9IGNsYXNzIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgIGlmICghY29tcGlsZWQpIHtcbiAgICAgICAgY29uc3QgaHRtbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIGh0bWwuaW5uZXJIVE1MID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAodHlwZW9mKHRlbXBsYXRlKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIHVud3JhcENvbW1lbnQuZXhlYyh0ZW1wbGF0ZS50b1N0cmluZygpKVsxXTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkoKTtcbiAgICAgICAgbmV3IEFnZ3JlZ2F0b3IoaHRtbCkuYWdncmVnYXRlKHNjb3BlKTtcbiAgICAgICAgY29tcGlsZWQgPSBuZXcgQ29tcGlsZXIoKS5jb21waWxlKGh0bWwpO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IGtleSBpbiBzY29wZSkge1xuICAgICAgICBpZiAoc2NvcGUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgIHRoaXNba2V5XSA9IHNjb3BlW2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgYXR0cnMgPSB0aGlzLmF0dHJpYnV0ZXM7XG4gICAgICBmb3IgKGxldCBpID0gMCwgbCA9IGF0dHJzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICBjb25zdCBhdHRyID0gYXR0cnNbaV07XG4gICAgICAgIHRoaXNbYXR0ci5uYW1lXSA9IGF0dHIudmFsdWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRzLmluaXRpYWxpemUpIHtcbiAgICAgICAgb3B0cy5pbml0aWFsaXplLmFwcGx5KHRoaXMpO1xuICAgICAgfVxuICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soa2V5KSB7XG4gICAgICB0aGlzW2tleV0gPSB0aGlzLmdldEF0dHJpYnV0ZShrZXkpO1xuICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICB9XG5cbiAgICB1cGRhdGUoKSB7XG4gICAgICBJbmNyZW1lbnRhbERPTS5wYXRjaCh0aGlzLCAoKSA9PiB7XG4gICAgICAgIGNvbXBpbGVkLmFwcGx5KHRoaXMsIFtJbmNyZW1lbnRhbERPTV0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZHVtcCgpIHtcbiAgICAgIGNvbnN0IHNjb3BlID0ge307XG4gICAgICBPYmplY3Qua2V5cyh0aGlzKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIGlmIChrZXkgIT09ICdyZW5kZXJlcicpIHtcbiAgICAgICAgICBzY29wZVtrZXldID0gdGhpc1trZXldO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBzY29wZTtcbiAgICB9XG4gIH07XG5cbiAgaWYgKG9wdHMubWV0aG9kcykge1xuICAgIGZvciAoY29uc3QgbmFtZSBpbiBvcHRzLm1ldGhvZHMpIHtcbiAgICAgIGVsZW1lbnRDbGFzcy5wcm90b3R5cGVbbmFtZV0gPSBvcHRzLm1ldGhvZHNbbmFtZV07XG4gICAgfVxuICB9XG5cbiAgaWYgKG9wdHMuYWNjZXNzb3JzKSB7XG4gICAgZm9yIChjb25zdCBuYW1lIGluIG9wdHMuYWNjZXNzb3JzKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbWVudENsYXNzLnByb3RvdHlwZSwgbmFtZSwge1xuICAgICAgICBnZXQ6IG9wdHMuYWNjZXNzb3JzW25hbWVdLmdldCxcbiAgICAgICAgc2V0OiBvcHRzLmFjY2Vzc29yc1tuYW1lXS5zZXRcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGN1c3RvbUVsZW1lbnRzLmRlZmluZSh0YWdOYW1lLCBlbGVtZW50Q2xhc3MpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRhZztcblxuIiwiZnVuY3Rpb24gc2NhbihzKSB7XG4gIGNvbnN0IG9yaWcgPSBzO1xuICBjb25zdCByZXN1bHQgPSBbXTtcbiAgd2hpbGUgKHMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGkgPSBzLmluZGV4T2YoJ3t7Jyk7XG4gICAgaWYgKGk+PTApIHtcbiAgICAgIGlmIChpPjApIHsgLy8gdGhlcmUncyBwcmVmaXggc3RyaW5nXG4gICAgICAgIGNvbnN0IHAgPSBzLnN1YnN0cigwLCBpKTtcbiAgICAgICAgcmVzdWx0LnB1c2goSlNPTi5zdHJpbmdpZnkocCkpO1xuICAgICAgfVxuXG4gICAgICAvLyBmaW5kIGNsb3NpbmcgfX1cbiAgICAgIGNvbnN0IGwgPSBzLmluZGV4T2YoJ319Jyk7XG4gICAgICBpZiAobDwwKSB7XG4gICAgICAgIHRocm93IGBNaXNzaW5nIGNsb3NpbmcgJ319JyBpbiBleHByZXNzaW9uOiAke29yaWd9YDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGV4cCA9IHMuc3Vic3RyKGkrMiwgbC0oaSsyKSk7XG4gICAgICBpZiAoZXhwLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmVzdWx0LnB1c2goYCgke2V4cH0pYCk7XG4gICAgICB9XG4gICAgICBzPXMuc3Vic3RyKGwrMik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5wdXNoKEpTT04uc3RyaW5naWZ5KHMpKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0LmpvaW4oXCIrXCIpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNjYW47XG5cbiJdfQ==
