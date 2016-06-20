(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

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
/*!
 * QUnit 2.0.0
 * https://qunitjs.com/
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
 *
 * Date: 2016-06-16T17:09Z
 */

( function( global ) {

var QUnit = {};

var Date = global.Date;
var now = Date.now || function() {
	return new Date().getTime();
};

var setTimeout = global.setTimeout;
var clearTimeout = global.clearTimeout;

// Store a local window from the global to allow direct references.
var window = global.window;

var defined = {
	document: window && window.document !== undefined,
	setTimeout: setTimeout !== undefined,
	sessionStorage: ( function() {
		var x = "qunit-test-string";
		try {
			sessionStorage.setItem( x, x );
			sessionStorage.removeItem( x );
			return true;
		} catch ( e ) {
			return false;
		}
	}() )
};

var fileName = ( sourceFromStacktrace( 0 ) || "" ).replace( /(:\d+)+\)?/, "" ).replace( /.+\//, "" );
var globalStartCalled = false;
var runStarted = false;

var autorun = false;

var toString = Object.prototype.toString,
	hasOwn = Object.prototype.hasOwnProperty;

// Returns a new Array with the elements that are in a but not in b
function diff( a, b ) {
	var i, j,
		result = a.slice();

	for ( i = 0; i < result.length; i++ ) {
		for ( j = 0; j < b.length; j++ ) {
			if ( result[ i ] === b[ j ] ) {
				result.splice( i, 1 );
				i--;
				break;
			}
		}
	}
	return result;
}

// From jquery.js
function inArray( elem, array ) {
	if ( array.indexOf ) {
		return array.indexOf( elem );
	}

	for ( var i = 0, length = array.length; i < length; i++ ) {
		if ( array[ i ] === elem ) {
			return i;
		}
	}

	return -1;
}

/**
 * Makes a clone of an object using only Array or Object as base,
 * and copies over the own enumerable properties.
 *
 * @param {Object} obj
 * @return {Object} New object with only the own properties (recursively).
 */
function objectValues ( obj ) {
	var key, val,
		vals = QUnit.is( "array", obj ) ? [] : {};
	for ( key in obj ) {
		if ( hasOwn.call( obj, key ) ) {
			val = obj[ key ];
			vals[ key ] = val === Object( val ) ? objectValues( val ) : val;
		}
	}
	return vals;
}

function extend( a, b, undefOnly ) {
	for ( var prop in b ) {
		if ( hasOwn.call( b, prop ) ) {
			if ( b[ prop ] === undefined ) {
				delete a[ prop ];
			} else if ( !( undefOnly && typeof a[ prop ] !== "undefined" ) ) {
				a[ prop ] = b[ prop ];
			}
		}
	}

	return a;
}

function objectType( obj ) {
	if ( typeof obj === "undefined" ) {
		return "undefined";
	}

	// Consider: typeof null === object
	if ( obj === null ) {
		return "null";
	}

	var match = toString.call( obj ).match( /^\[object\s(.*)\]$/ ),
		type = match && match[ 1 ];

	switch ( type ) {
		case "Number":
			if ( isNaN( obj ) ) {
				return "nan";
			}
			return "number";
		case "String":
		case "Boolean":
		case "Array":
		case "Set":
		case "Map":
		case "Date":
		case "RegExp":
		case "Function":
		case "Symbol":
			return type.toLowerCase();
	}
	if ( typeof obj === "object" ) {
		return "object";
	}
}

// Safe object type checking
function is( type, obj ) {
	return QUnit.objectType( obj ) === type;
}

// Doesn't support IE9, it will return undefined on these browsers
// See also https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error/Stack
function extractStacktrace( e, offset ) {
	offset = offset === undefined ? 4 : offset;

	var stack, include, i;

	if ( e.stack ) {
		stack = e.stack.split( "\n" );
		if ( /^error$/i.test( stack[ 0 ] ) ) {
			stack.shift();
		}
		if ( fileName ) {
			include = [];
			for ( i = offset; i < stack.length; i++ ) {
				if ( stack[ i ].indexOf( fileName ) !== -1 ) {
					break;
				}
				include.push( stack[ i ] );
			}
			if ( include.length ) {
				return include.join( "\n" );
			}
		}
		return stack[ offset ];
	}
}

function sourceFromStacktrace( offset ) {
	var error = new Error();

	// Support: Safari <=7 only, IE <=10 - 11 only
	// Not all browsers generate the `stack` property for `new Error()`, see also #636
	if ( !error.stack ) {
		try {
			throw error;
		} catch ( err ) {
			error = err;
		}
	}

	return extractStacktrace( error, offset );
}

/**
 * Config object: Maintain internal state
 * Later exposed as QUnit.config
 * `config` initialized at top of scope
 */
var config = {

	// The queue of tests to run
	queue: [],

	// Block until document ready
	blocking: true,

	// By default, run previously failed tests first
	// very useful in combination with "Hide passed tests" checked
	reorder: true,

	// By default, modify document.title when suite is done
	altertitle: true,

	// HTML Reporter: collapse every test except the first failing test
	// If false, all failing tests will be expanded
	collapse: true,

	// By default, scroll to top of the page when suite is done
	scrolltop: true,

	// Depth up-to which object will be dumped
	maxDepth: 5,

	// When enabled, all tests must call expect()
	requireExpects: false,

	// Placeholder for user-configurable form-exposed URL parameters
	urlConfig: [],

	// Set of all modules.
	modules: [],

	// Stack of nested modules
	moduleStack: [],

	// The first unnamed module
	currentModule: {
		name: "",
		tests: []
	},

	callbacks: {}
};

// Push a loose unnamed module to the modules collection
config.modules.push( config.currentModule );

// Register logging callbacks
function registerLoggingCallbacks( obj ) {
	var i, l, key,
		callbackNames = [ "begin", "done", "log", "testStart", "testDone",
			"moduleStart", "moduleDone" ];

	function registerLoggingCallback( key ) {
		var loggingCallback = function( callback ) {
			if ( objectType( callback ) !== "function" ) {
				throw new Error(
					"QUnit logging methods require a callback function as their first parameters."
				);
			}

			config.callbacks[ key ].push( callback );
		};

		return loggingCallback;
	}

	for ( i = 0, l = callbackNames.length; i < l; i++ ) {
		key = callbackNames[ i ];

		// Initialize key collection of logging callback
		if ( objectType( config.callbacks[ key ] ) === "undefined" ) {
			config.callbacks[ key ] = [];
		}

		obj[ key ] = registerLoggingCallback( key );
	}
}

function runLoggingCallbacks( key, args ) {
	var i, l, callbacks;

	callbacks = config.callbacks[ key ];
	for ( i = 0, l = callbacks.length; i < l; i++ ) {
		callbacks[ i ]( args );
	}
}

( function() {
	if ( !defined.document ) {
		return;
	}

	// `onErrorFnPrev` initialized at top of scope
	// Preserve other handlers
	var onErrorFnPrev = window.onerror;

	// Cover uncaught exceptions
	// Returning true will suppress the default browser handler,
	// returning false will let it run.
	window.onerror = function( error, filePath, linerNr ) {
		var ret = false;
		if ( onErrorFnPrev ) {
			ret = onErrorFnPrev( error, filePath, linerNr );
		}

		// Treat return value as window.onerror itself does,
		// Only do our handling if not suppressed.
		if ( ret !== true ) {
			if ( QUnit.config.current ) {
				if ( QUnit.config.current.ignoreGlobalErrors ) {
					return true;
				}
				QUnit.pushFailure( error, filePath + ":" + linerNr );
			} else {
				QUnit.test( "global failure", extend( function() {
					QUnit.pushFailure( error, filePath + ":" + linerNr );
				}, { validTest: true } ) );
			}
			return false;
		}

		return ret;
	};
}() );

// Figure out if we're running the tests from a server or not
QUnit.isLocal = !( defined.document && window.location.protocol !== "file:" );

// Expose the current QUnit version
QUnit.version = "2.0.0";

extend( QUnit, {

	// Call on start of module test to prepend name to all tests
	module: function( name, testEnvironment, executeNow ) {
		var module, moduleFns;
		var currentModule = config.currentModule;

		if ( arguments.length === 2 ) {
			if ( objectType( testEnvironment ) === "function" ) {
				executeNow = testEnvironment;
				testEnvironment = undefined;
			}
		}

		module = createModule();

		if ( testEnvironment && ( testEnvironment.setup || testEnvironment.teardown ) ) {
			console.warn(
				"Module's `setup` and `teardown` are not hooks anymore on QUnit 2.0, use " +
				"`beforeEach` and `afterEach` instead\n" +
				"Details in our upgrade guide at https://qunitjs.com/upgrade-guide-2.x/"
			);
		}

		moduleFns = {
			before: setHook( module, "before" ),
			beforeEach: setHook( module, "beforeEach" ),
			afterEach: setHook( module, "afterEach" ),
			after: setHook( module, "after" )
		};

		if ( objectType( executeNow ) === "function" ) {
			config.moduleStack.push( module );
			setCurrentModule( module );
			executeNow.call( module.testEnvironment, moduleFns );
			config.moduleStack.pop();
			module = module.parentModule || currentModule;
		}

		setCurrentModule( module );

		function createModule() {
			var parentModule = config.moduleStack.length ?
				config.moduleStack.slice( -1 )[ 0 ] : null;
			var moduleName = parentModule !== null ?
				[ parentModule.name, name ].join( " > " ) : name;
			var module = {
				name: moduleName,
				parentModule: parentModule,
				tests: [],
				moduleId: generateHash( moduleName ),
				testsRun: 0
			};

			var env = {};
			if ( parentModule ) {
				parentModule.childModule = module;
				extend( env, parentModule.testEnvironment );
				delete env.beforeEach;
				delete env.afterEach;
			}
			extend( env, testEnvironment );
			module.testEnvironment = env;

			config.modules.push( module );
			return module;
		}

		function setCurrentModule( module ) {
			config.currentModule = module;
		}

	},

	test: test,

	skip: skip,

	only: only,

	start: function( count ) {
		var globalStartAlreadyCalled = globalStartCalled;

		if ( !config.current ) {
			globalStartCalled = true;

			if ( runStarted ) {
				throw new Error( "Called start() while test already started running" );
			} else if ( globalStartAlreadyCalled || count > 1 ) {
				throw new Error( "Called start() outside of a test context too many times" );
			} else if ( config.autostart ) {
				throw new Error( "Called start() outside of a test context when " +
					"QUnit.config.autostart was true" );
			} else if ( !config.pageLoaded ) {

				// The page isn't completely loaded yet, so bail out and let `QUnit.load` handle it
				config.autostart = true;
				return;
			}
		} else {
			throw new Error(
				"QUnit.start cannot be called inside a test context. This feature is removed in " +
				"QUnit 2.0. For async tests, use QUnit.test() with assert.async() instead.\n" +
				"Details in our upgrade guide at https://qunitjs.com/upgrade-guide-2.x/"
			);
		}

		resumeProcessing();
	},

	config: config,

	is: is,

	objectType: objectType,

	extend: extend,

	load: function() {
		config.pageLoaded = true;

		// Initialize the configuration options
		extend( config, {
			stats: { all: 0, bad: 0 },
			moduleStats: { all: 0, bad: 0 },
			started: 0,
			updateRate: 1000,
			autostart: true,
			filter: ""
		}, true );

		config.blocking = false;

		if ( config.autostart ) {
			resumeProcessing();
		}
	},

	stack: function( offset ) {
		offset = ( offset || 0 ) + 2;
		return sourceFromStacktrace( offset );
	}
} );

registerLoggingCallbacks( QUnit );

function begin() {
	var i, l,
		modulesLog = [];

	// If the test run hasn't officially begun yet
	if ( !config.started ) {

		// Record the time of the test run's beginning
		config.started = now();

		// Delete the loose unnamed module if unused.
		if ( config.modules[ 0 ].name === "" && config.modules[ 0 ].tests.length === 0 ) {
			config.modules.shift();
		}

		// Avoid unnecessary information by not logging modules' test environments
		for ( i = 0, l = config.modules.length; i < l; i++ ) {
			modulesLog.push( {
				name: config.modules[ i ].name,
				tests: config.modules[ i ].tests
			} );
		}

		// The test run is officially beginning now
		runLoggingCallbacks( "begin", {
			totalTests: Test.count,
			modules: modulesLog
		} );
	}

	config.blocking = false;
	process( true );
}

function process( last ) {
	function next() {
		process( last );
	}
	var start = now();
	config.depth = ( config.depth || 0 ) + 1;

	while ( config.queue.length && !config.blocking ) {
		if ( !defined.setTimeout || config.updateRate <= 0 ||
				( ( now() - start ) < config.updateRate ) ) {
			if ( config.current ) {

				// Reset async tracking for each phase of the Test lifecycle
				config.current.usedAsync = false;
			}
			config.queue.shift()();
		} else {
			setTimeout( next, 13 );
			break;
		}
	}
	config.depth--;
	if ( last && !config.blocking && !config.queue.length && config.depth === 0 ) {
		done();
	}
}

function pauseProcessing( test ) {
	config.blocking = true;

	if ( config.testTimeout && defined.setTimeout ) {
		clearTimeout( config.timeout );
		config.timeout = setTimeout( function() {
			test.semaphore = 0;
			QUnit.pushFailure( "Test timed out", sourceFromStacktrace( 2 ) );
			resumeProcessing( test );
		}, config.testTimeout );
	}
}

function resumeProcessing( test ) {
	runStarted = true;

	// A slight delay to allow this iteration of the event loop to finish (more assertions, etc.)
	if ( defined.setTimeout ) {
		setTimeout( function() {
			var current = test || config.current;
			if ( current && ( current.semaphore > 0 || current.resumed ) ) {
				return;
			}

			if ( config.timeout ) {
				clearTimeout( config.timeout );
			}

			if ( current ) {
				current.resumed = true;
			}

			begin();
		}, 13 );
	} else {
		begin();
	}
}

function done() {
	var runtime, passed;

	autorun = true;

	// Log the last module results
	if ( config.previousModule ) {
		runLoggingCallbacks( "moduleDone", {
			name: config.previousModule.name,
			tests: config.previousModule.tests,
			failed: config.moduleStats.bad,
			passed: config.moduleStats.all - config.moduleStats.bad,
			total: config.moduleStats.all,
			runtime: now() - config.moduleStats.started
		} );
	}
	delete config.previousModule;

	runtime = now() - config.started;
	passed = config.stats.all - config.stats.bad;

	runLoggingCallbacks( "done", {
		failed: config.stats.bad,
		passed: passed,
		total: config.stats.all,
		runtime: runtime
	} );
}

function setHook( module, hookName ) {
	if ( module.testEnvironment === undefined ) {
		module.testEnvironment = {};
	}

	return function( callback ) {
		module.testEnvironment[ hookName ] = callback;
	};
}

var unitSampler,
	focused = false,
	priorityCount = 0;

function Test( settings ) {
	var i, l;

	++Test.count;

	this.expected = null;
	extend( this, settings );
	this.assertions = [];
	this.semaphore = 0;
	this.usedAsync = false;
	this.module = config.currentModule;
	this.stack = sourceFromStacktrace( 3 );

	// Register unique strings
	for ( i = 0, l = this.module.tests; i < l.length; i++ ) {
		if ( this.module.tests[ i ].name === this.testName ) {
			this.testName += " ";
		}
	}

	this.testId = generateHash( this.module.name, this.testName );

	this.module.tests.push( {
		name: this.testName,
		testId: this.testId
	} );

	if ( settings.skip ) {

		// Skipped tests will fully ignore any sent callback
		this.callback = function() {};
		this.async = false;
		this.expected = 0;
	} else {
		this.assert = new Assert( this );
	}
}

Test.count = 0;

Test.prototype = {
	before: function() {
		if (

			// Emit moduleStart when we're switching from one module to another
			this.module !== config.previousModule ||

				// They could be equal (both undefined) but if the previousModule property doesn't
				// yet exist it means this is the first test in a suite that isn't wrapped in a
				// module, in which case we'll just emit a moduleStart event for 'undefined'.
				// Without this, reporters can get testStart before moduleStart  which is a problem.
				!hasOwn.call( config, "previousModule" )
		) {
			if ( hasOwn.call( config, "previousModule" ) ) {
				runLoggingCallbacks( "moduleDone", {
					name: config.previousModule.name,
					tests: config.previousModule.tests,
					failed: config.moduleStats.bad,
					passed: config.moduleStats.all - config.moduleStats.bad,
					total: config.moduleStats.all,
					runtime: now() - config.moduleStats.started
				} );
			}
			config.previousModule = this.module;
			config.moduleStats = { all: 0, bad: 0, started: now() };
			runLoggingCallbacks( "moduleStart", {
				name: this.module.name,
				tests: this.module.tests
			} );
		}

		config.current = this;

		if ( this.module.testEnvironment ) {
			delete this.module.testEnvironment.before;
			delete this.module.testEnvironment.beforeEach;
			delete this.module.testEnvironment.afterEach;
			delete this.module.testEnvironment.after;
		}
		this.testEnvironment = extend( {}, this.module.testEnvironment );

		this.started = now();
		runLoggingCallbacks( "testStart", {
			name: this.testName,
			module: this.module.name,
			testId: this.testId
		} );

		if ( !config.pollution ) {
			saveGlobal();
		}
	},

	run: function() {
		var promise;

		config.current = this;

		if ( this.async ) {
			internalStop( this );
		}

		this.callbackStarted = now();

		if ( config.notrycatch ) {
			runTest( this );
			return;
		}

		try {
			runTest( this );
		} catch ( e ) {
			this.pushFailure( "Died on test #" + ( this.assertions.length + 1 ) + " " +
				this.stack + ": " + ( e.message || e ), extractStacktrace( e, 0 ) );

			// Else next test will carry the responsibility
			saveGlobal();

			// Restart the tests if they're blocking
			if ( config.blocking ) {
				internalStart( this );
			}
		}

		function runTest( test ) {
			promise = test.callback.call( test.testEnvironment, test.assert );
			test.resolvePromise( promise );
		}
	},

	after: function() {
		checkPollution();
	},

	queueHook: function( hook, hookName, hookOwner ) {
		var promise,
			test = this;
		return function runHook() {
			if ( hookName === "before" ) {
				if ( hookOwner.testsRun !== 0 ) {
					return;
				}

				test.preserveEnvironment = true;
			}

			if ( hookName === "after" && hookOwner.testsRun !== numberOfTests( hookOwner ) - 1 ) {
				return;
			}

			config.current = test;
			if ( config.notrycatch ) {
				callHook();
				return;
			}
			try {
				callHook();
			} catch ( error ) {
				test.pushFailure( hookName + " failed on " + test.testName + ": " +
				( error.message || error ), extractStacktrace( error, 0 ) );
			}

			function callHook() {
				promise = hook.call( test.testEnvironment, test.assert );
				test.resolvePromise( promise, hookName );
			}
		};
	},

	// Currently only used for module level hooks, can be used to add global level ones
	hooks: function( handler ) {
		var hooks = [];

		function processHooks( test, module ) {
			if ( module.parentModule ) {
				processHooks( test, module.parentModule );
			}
			if ( module.testEnvironment &&
				QUnit.objectType( module.testEnvironment[ handler ] ) === "function" ) {
				hooks.push( test.queueHook( module.testEnvironment[ handler ], handler, module ) );
			}
		}

		// Hooks are ignored on skipped tests
		if ( !this.skip ) {
			processHooks( this, this.module );
		}
		return hooks;
	},

	finish: function() {
		config.current = this;
		if ( config.requireExpects && this.expected === null ) {
			this.pushFailure( "Expected number of assertions to be defined, but expect() was " +
				"not called.", this.stack );
		} else if ( this.expected !== null && this.expected !== this.assertions.length ) {
			this.pushFailure( "Expected " + this.expected + " assertions, but " +
				this.assertions.length + " were run", this.stack );
		} else if ( this.expected === null && !this.assertions.length ) {
			this.pushFailure( "Expected at least one assertion, but none were run - call " +
				"expect(0) to accept zero assertions.", this.stack );
		}

		var i,
			bad = 0;

		this.runtime = now() - this.started;
		config.stats.all += this.assertions.length;
		config.moduleStats.all += this.assertions.length;

		for ( i = 0; i < this.assertions.length; i++ ) {
			if ( !this.assertions[ i ].result ) {
				bad++;
				config.stats.bad++;
				config.moduleStats.bad++;
			}
		}

		notifyTestsRan( this.module );
		runLoggingCallbacks( "testDone", {
			name: this.testName,
			module: this.module.name,
			skipped: !!this.skip,
			failed: bad,
			passed: this.assertions.length - bad,
			total: this.assertions.length,
			runtime: this.runtime,

			// HTML Reporter use
			assertions: this.assertions,
			testId: this.testId,

			// Source of Test
			source: this.stack
		} );

		config.current = undefined;
	},

	preserveTestEnvironment: function() {
		if ( this.preserveEnvironment ) {
			this.module.testEnvironment = this.testEnvironment;
			this.testEnvironment = extend( {}, this.module.testEnvironment );
		}
	},

	queue: function() {
		var priority,
			test = this;

		if ( !this.valid() ) {
			return;
		}

		function run() {

			// Each of these can by async
			synchronize( [
				function() {
					test.before();
				},

				test.hooks( "before" ),

				function() {
					test.preserveTestEnvironment();
				},

				test.hooks( "beforeEach" ),

				function() {
					test.run();
				},

				test.hooks( "afterEach" ).reverse(),
				test.hooks( "after" ).reverse(),

				function() {
					test.after();
				},

				function() {
					test.finish();
				}
			] );
		}

		// Prioritize previously failed tests, detected from sessionStorage
		priority = QUnit.config.reorder && defined.sessionStorage &&
				+sessionStorage.getItem( "qunit-test-" + this.module.name + "-" + this.testName );

		return synchronize( run, priority, config.seed );
	},

	pushResult: function( resultInfo ) {

		// Destructure of resultInfo = { result, actual, expected, message, negative }
		var source,
			details = {
				module: this.module.name,
				name: this.testName,
				result: resultInfo.result,
				message: resultInfo.message,
				actual: resultInfo.actual,
				expected: resultInfo.expected,
				testId: this.testId,
				negative: resultInfo.negative || false,
				runtime: now() - this.started
			};

		if ( !resultInfo.result ) {
			source = sourceFromStacktrace();

			if ( source ) {
				details.source = source;
			}
		}

		runLoggingCallbacks( "log", details );

		this.assertions.push( {
			result: !!resultInfo.result,
			message: resultInfo.message
		} );
	},

	pushFailure: function( message, source, actual ) {
		if ( !( this instanceof Test ) ) {
			throw new Error( "pushFailure() assertion outside test context, was " +
				sourceFromStacktrace( 2 ) );
		}

		var details = {
				module: this.module.name,
				name: this.testName,
				result: false,
				message: message || "error",
				actual: actual || null,
				testId: this.testId,
				runtime: now() - this.started
			};

		if ( source ) {
			details.source = source;
		}

		runLoggingCallbacks( "log", details );

		this.assertions.push( {
			result: false,
			message: message
		} );
	},

	resolvePromise: function( promise, phase ) {
		var then, message,
			test = this;
		if ( promise != null ) {
			then = promise.then;
			if ( QUnit.objectType( then ) === "function" ) {
				internalStop( test );
				then.call(
					promise,
					function() { internalStart( test ); },
					function( error ) {
						message = "Promise rejected " +
							( !phase ? "during" : phase.replace( /Each$/, "" ) ) +
							" " + test.testName + ": " + ( error.message || error );
						test.pushFailure( message, extractStacktrace( error, 0 ) );

						// Else next test will carry the responsibility
						saveGlobal();

						// Unblock
						internalStart( test );
					}
				);
			}
		}
	},

	valid: function() {
		var filter = config.filter,
			regexFilter = /^(!?)\/([\w\W]*)\/(i?$)/.exec( filter ),
			module = config.module && config.module.toLowerCase(),
			fullName = ( this.module.name + ": " + this.testName );

		function moduleChainNameMatch( testModule ) {
			var testModuleName = testModule.name ? testModule.name.toLowerCase() : null;
			if ( testModuleName === module ) {
				return true;
			} else if ( testModule.parentModule ) {
				return moduleChainNameMatch( testModule.parentModule );
			} else {
				return false;
			}
		}

		function moduleChainIdMatch( testModule ) {
			return inArray( testModule.moduleId, config.moduleId ) > -1 ||
				testModule.parentModule && moduleChainIdMatch( testModule.parentModule );
		}

		// Internally-generated tests are always valid
		if ( this.callback && this.callback.validTest ) {
			return true;
		}

		if ( config.moduleId && config.moduleId.length > 0 &&
			!moduleChainIdMatch( this.module ) ) {

			return false;
		}

		if ( config.testId && config.testId.length > 0 &&
			inArray( this.testId, config.testId ) < 0 ) {

			return false;
		}

		if ( module && !moduleChainNameMatch( this.module ) ) {
			return false;
		}

		if ( !filter ) {
			return true;
		}

		return regexFilter ?
			this.regexFilter( !!regexFilter[ 1 ], regexFilter[ 2 ], regexFilter[ 3 ], fullName ) :
			this.stringFilter( filter, fullName );
	},

	regexFilter: function( exclude, pattern, flags, fullName ) {
		var regex = new RegExp( pattern, flags );
		var match = regex.test( fullName );

		return match !== exclude;
	},

	stringFilter: function( filter, fullName ) {
		filter = filter.toLowerCase();
		fullName = fullName.toLowerCase();

		var include = filter.charAt( 0 ) !== "!";
		if ( !include ) {
			filter = filter.slice( 1 );
		}

		// If the filter matches, we need to honour include
		if ( fullName.indexOf( filter ) !== -1 ) {
			return include;
		}

		// Otherwise, do the opposite
		return !include;
	}
};

QUnit.pushFailure = function() {
	if ( !QUnit.config.current ) {
		throw new Error( "pushFailure() assertion outside test context, in " +
			sourceFromStacktrace( 2 ) );
	}

	// Gets current test obj
	var currentTest = QUnit.config.current;

	return currentTest.pushFailure.apply( currentTest, arguments );
};

// Based on Java's String.hashCode, a simple but not
// rigorously collision resistant hashing function
function generateHash( module, testName ) {
	var hex,
		i = 0,
		hash = 0,
		str = module + "\x1C" + testName,
		len = str.length;

	for ( ; i < len; i++ ) {
		hash  = ( ( hash << 5 ) - hash ) + str.charCodeAt( i );
		hash |= 0;
	}

	// Convert the possibly negative integer hash code into an 8 character hex string, which isn't
	// strictly necessary but increases user understanding that the id is a SHA-like hash
	hex = ( 0x100000000 + hash ).toString( 16 );
	if ( hex.length < 8 ) {
		hex = "0000000" + hex;
	}

	return hex.slice( -8 );
}

function synchronize( callback, priority, seed ) {
	var last = !priority,
		index;

	if ( QUnit.objectType( callback ) === "array" ) {
		while ( callback.length ) {
			synchronize( callback.shift() );
		}
		return;
	}

	if ( priority ) {
		config.queue.splice( priorityCount++, 0, callback );
	} else if ( seed ) {
		if ( !unitSampler ) {
			unitSampler = unitSamplerGenerator( seed );
		}

		// Insert into a random position after all priority items
		index = Math.floor( unitSampler() * ( config.queue.length - priorityCount + 1 ) );
		config.queue.splice( priorityCount + index, 0, callback );
	} else {
		config.queue.push( callback );
	}

	if ( autorun && !config.blocking ) {
		process( last );
	}
}

function unitSamplerGenerator( seed ) {

	// 32-bit xorshift, requires only a nonzero seed
	// http://excamera.com/sphinx/article-xorshift.html
	var sample = parseInt( generateHash( seed ), 16 ) || -1;
	return function() {
		sample ^= sample << 13;
		sample ^= sample >>> 17;
		sample ^= sample << 5;

		// ECMAScript has no unsigned number type
		if ( sample < 0 ) {
			sample += 0x100000000;
		}

		return sample / 0x100000000;
	};
}

function saveGlobal() {
	config.pollution = [];

	if ( config.noglobals ) {
		for ( var key in global ) {
			if ( hasOwn.call( global, key ) ) {

				// In Opera sometimes DOM element ids show up here, ignore them
				if ( /^qunit-test-output/.test( key ) ) {
					continue;
				}
				config.pollution.push( key );
			}
		}
	}
}

function checkPollution() {
	var newGlobals,
		deletedGlobals,
		old = config.pollution;

	saveGlobal();

	newGlobals = diff( config.pollution, old );
	if ( newGlobals.length > 0 ) {
		QUnit.pushFailure( "Introduced global variable(s): " + newGlobals.join( ", " ) );
	}

	deletedGlobals = diff( old, config.pollution );
	if ( deletedGlobals.length > 0 ) {
		QUnit.pushFailure( "Deleted global variable(s): " + deletedGlobals.join( ", " ) );
	}
}

// Will be exposed as QUnit.test
function test( testName, callback ) {
	if ( focused )  { return; }

	var newTest;

	newTest = new Test( {
		testName: testName,
		callback: callback
	} );

	newTest.queue();
}

// Will be exposed as QUnit.skip
function skip( testName ) {
	if ( focused )  { return; }

	var test = new Test( {
		testName: testName,
		skip: true
	} );

	test.queue();
}

// Will be exposed as QUnit.only
function only( testName, callback ) {
	var newTest;

	if ( focused )  { return; }

	QUnit.config.queue.length = 0;
	focused = true;

	newTest = new Test( {
		testName: testName,
		callback: callback
	} );

	newTest.queue();
}

function internalStop( test ) {

	// If a test is running, adjust its semaphore
	test.semaphore += 1;

	pauseProcessing( test );
}

function internalStart( test ) {

	// If a test is running, adjust its semaphore
	test.semaphore -= 1;

	// If semaphore is non-numeric, throw error
	if ( isNaN( test.semaphore ) ) {
		test.semaphore = 0;

		QUnit.pushFailure(
			"Invalid value on test.semaphore",
			sourceFromStacktrace( 2 )
		);
		return;
	}

	// Don't start until equal number of stop-calls
	if ( test.semaphore > 0 ) {
		return;
	}

	// Throw an Error if start is called more often than stop
	if ( test.semaphore < 0 ) {
		test.semaphore = 0;

		QUnit.pushFailure(
			"Tried to restart test while already started (test's semaphore was 0 already)",
			sourceFromStacktrace( 2 )
		);
		return;
	}

	resumeProcessing( test );
}

function numberOfTests( module ) {
	var count = module.tests.length;
	while ( module = module.childModule ) {
		count += module.tests.length;
	}
	return count;
}

function notifyTestsRan( module ) {
	module.testsRun++;
	while ( module = module.parentModule ) {
		module.testsRun++;
	}
}

function Assert( testContext ) {
	this.test = testContext;
}

// Assert helpers
QUnit.assert = Assert.prototype = {

	// Specify the number of expected assertions to guarantee that failed test
	// (no assertions are run at all) don't slip through.
	expect: function( asserts ) {
		if ( arguments.length === 1 ) {
			this.test.expected = asserts;
		} else {
			return this.test.expected;
		}
	},

	// Increment this Test's semaphore counter, then return a function that
	// decrements that counter a maximum of once.
	async: function( count ) {
		var test = this.test,
			popped = false,
			acceptCallCount = count;

		if ( typeof acceptCallCount === "undefined" ) {
			acceptCallCount = 1;
		}

		test.semaphore += 1;
		test.usedAsync = true;
		pauseProcessing( test );

		return function done() {

			if ( popped ) {
				test.pushFailure( "Too many calls to the `assert.async` callback",
					sourceFromStacktrace( 2 ) );
				return;
			}
			acceptCallCount -= 1;
			if ( acceptCallCount > 0 ) {
				return;
			}

			test.semaphore -= 1;
			popped = true;
			resumeProcessing( test );
		};
	},

	// Exports test.push() to the user API
	// Alias of pushResult.
	push: function( result, actual, expected, message, negative ) {
		var currentAssert = this instanceof Assert ? this : QUnit.config.current.assert;
		return currentAssert.pushResult( {
			result: result,
			actual: actual,
			expected: expected,
			message: message,
			negative: negative
		} );
	},

	pushResult: function( resultInfo ) {

		// Destructure of resultInfo = { result, actual, expected, message, negative }
		var assert = this,
			currentTest = ( assert instanceof Assert && assert.test ) || QUnit.config.current;

		// Backwards compatibility fix.
		// Allows the direct use of global exported assertions and QUnit.assert.*
		// Although, it's use is not recommended as it can leak assertions
		// to other tests from async tests, because we only get a reference to the current test,
		// not exactly the test where assertion were intended to be called.
		if ( !currentTest ) {
			throw new Error( "assertion outside test context, in " + sourceFromStacktrace( 2 ) );
		}

		if ( currentTest.usedAsync === true && currentTest.semaphore === 0 ) {
			currentTest.pushFailure( "Assertion after the final `assert.async` was resolved",
				sourceFromStacktrace( 2 ) );

			// Allow this assertion to continue running anyway...
		}

		if ( !( assert instanceof Assert ) ) {
			assert = currentTest.assert;
		}

		return assert.test.pushResult( resultInfo );
	},

	ok: function( result, message ) {
		message = message || ( result ? "okay" : "failed, expected argument to be truthy, was: " +
			QUnit.dump.parse( result ) );
		this.pushResult( {
			result: !!result,
			actual: result,
			expected: true,
			message: message
		} );
	},

	notOk: function( result, message ) {
		message = message || ( !result ? "okay" : "failed, expected argument to be falsy, was: " +
			QUnit.dump.parse( result ) );
		this.pushResult( {
			result: !result,
			actual: result,
			expected: false,
			message: message
		} );
	},

	equal: function( actual, expected, message ) {
		/*jshint eqeqeq:false */
		this.pushResult( {
			result: expected == actual,
			actual: actual,
			expected: expected,
			message: message
		} );
	},

	notEqual: function( actual, expected, message ) {
		/*jshint eqeqeq:false */
		this.pushResult( {
			result: expected != actual,
			actual: actual,
			expected: expected,
			message: message,
			negative: true
		} );
	},

	propEqual: function( actual, expected, message ) {
		actual = objectValues( actual );
		expected = objectValues( expected );
		this.pushResult( {
			result: QUnit.equiv( actual, expected ),
			actual: actual,
			expected: expected,
			message: message
		} );
	},

	notPropEqual: function( actual, expected, message ) {
		actual = objectValues( actual );
		expected = objectValues( expected );
		this.pushResult( {
			result: !QUnit.equiv( actual, expected ),
			actual: actual,
			expected: expected,
			message: message,
			negative: true
		} );
	},

	deepEqual: function( actual, expected, message ) {
		this.pushResult( {
			result: QUnit.equiv( actual, expected ),
			actual: actual,
			expected: expected,
			message: message
		} );
	},

	notDeepEqual: function( actual, expected, message ) {
		this.pushResult( {
			result: !QUnit.equiv( actual, expected ),
			actual: actual,
			expected: expected,
			message: message,
			negative: true
		} );
	},

	strictEqual: function( actual, expected, message ) {
		this.pushResult( {
			result: expected === actual,
			actual: actual,
			expected: expected,
			message: message
		} );
	},

	notStrictEqual: function( actual, expected, message ) {
		this.pushResult( {
			result: expected !== actual,
			actual: actual,
			expected: expected,
			message: message,
			negative: true
		} );
	},

	"throws": function( block, expected, message ) {
		var actual, expectedType,
			expectedOutput = expected,
			ok = false,
			currentTest = ( this instanceof Assert && this.test ) || QUnit.config.current;

		// 'expected' is optional unless doing string comparison
		if ( QUnit.objectType( expected ) === "string" ) {
			if ( message == null ) {
				message = expected;
				expected = null;
			} else {
				throw new Error(
					"throws/raises does not accept a string value for the expected argument.\n" +
					"Use a non-string object value (e.g. regExp) instead if it's necessary." +
					"Details in our upgrade guide at https://qunitjs.com/upgrade-guide-2.x/"
				);
			}
		}

		currentTest.ignoreGlobalErrors = true;
		try {
			block.call( currentTest.testEnvironment );
		} catch ( e ) {
			actual = e;
		}
		currentTest.ignoreGlobalErrors = false;

		if ( actual ) {
			expectedType = QUnit.objectType( expected );

			// We don't want to validate thrown error
			if ( !expected ) {
				ok = true;
				expectedOutput = null;

			// Expected is a regexp
			} else if ( expectedType === "regexp" ) {
				ok = expected.test( errorString( actual ) );

			// Expected is a constructor, maybe an Error constructor
			} else if ( expectedType === "function" && actual instanceof expected ) {
				ok = true;

			// Expected is an Error object
			} else if ( expectedType === "object" ) {
				ok = actual instanceof expected.constructor &&
					actual.name === expected.name &&
					actual.message === expected.message;

			// Expected is a validation function which returns true if validation passed
			} else if ( expectedType === "function" && expected.call( {}, actual ) === true ) {
				expectedOutput = null;
				ok = true;
			}
		}

		currentTest.assert.pushResult( {
			result: ok,
			actual: actual,
			expected: expectedOutput,
			message: message
		} );
	}
};

// Provide an alternative to assert.throws(), for environments that consider throws a reserved word
// Known to us are: Closure Compiler, Narwhal
( function() {
	/*jshint sub:true */
	Assert.prototype.raises = Assert.prototype [ "throws" ]; //jscs:ignore requireDotNotation
}() );

function errorString( error ) {
	var name, message,
		resultErrorString = error.toString();
	if ( resultErrorString.substring( 0, 7 ) === "[object" ) {
		name = error.name ? error.name.toString() : "Error";
		message = error.message ? error.message.toString() : "";
		if ( name && message ) {
			return name + ": " + message;
		} else if ( name ) {
			return name;
		} else if ( message ) {
			return message;
		} else {
			return "Error";
		}
	} else {
		return resultErrorString;
	}
}

// Test for equality any JavaScript type.
// Author: Philippe Rathé <prathe@gmail.com>
QUnit.equiv = ( function() {

	// Stack to decide between skip/abort functions
	var callers = [];

	// Stack to avoiding loops from circular referencing
	var parents = [];
	var parentsB = [];

	var getProto = Object.getPrototypeOf || function( obj ) {

		/*jshint proto: true */
		return obj.__proto__;
	};

	function useStrictEquality( b, a ) {

		// To catch short annotation VS 'new' annotation of a declaration. e.g.:
		// `var i = 1;`
		// `var j = new Number(1);`
		if ( typeof a === "object" ) {
			a = a.valueOf();
		}
		if ( typeof b === "object" ) {
			b = b.valueOf();
		}

		return a === b;
	}

	function compareConstructors( a, b ) {
		var protoA = getProto( a );
		var protoB = getProto( b );

		// Comparing constructors is more strict than using `instanceof`
		if ( a.constructor === b.constructor ) {
			return true;
		}

		// Ref #851
		// If the obj prototype descends from a null constructor, treat it
		// as a null prototype.
		if ( protoA && protoA.constructor === null ) {
			protoA = null;
		}
		if ( protoB && protoB.constructor === null ) {
			protoB = null;
		}

		// Allow objects with no prototype to be equivalent to
		// objects with Object as their constructor.
		if ( ( protoA === null && protoB === Object.prototype ) ||
				( protoB === null && protoA === Object.prototype ) ) {
			return true;
		}

		return false;
	}

	function getRegExpFlags( regexp ) {
		return "flags" in regexp ? regexp.flags : regexp.toString().match( /[gimuy]*$/ )[ 0 ];
	}

	var callbacks = {
		"string": useStrictEquality,
		"boolean": useStrictEquality,
		"number": useStrictEquality,
		"null": useStrictEquality,
		"undefined": useStrictEquality,
		"symbol": useStrictEquality,
		"date": useStrictEquality,

		"nan": function() {
			return true;
		},

		"regexp": function( b, a ) {
			return a.source === b.source &&

				// Include flags in the comparison
				getRegExpFlags( a ) === getRegExpFlags( b );
		},

		// - skip when the property is a method of an instance (OOP)
		// - abort otherwise,
		// initial === would have catch identical references anyway
		"function": function() {
			var caller = callers[ callers.length - 1 ];
			return caller !== Object && typeof caller !== "undefined";
		},

		"array": function( b, a ) {
			var i, j, len, loop, aCircular, bCircular;

			len = a.length;
			if ( len !== b.length ) {

				// Safe and faster
				return false;
			}

			// Track reference to avoid circular references
			parents.push( a );
			parentsB.push( b );
			for ( i = 0; i < len; i++ ) {
				loop = false;
				for ( j = 0; j < parents.length; j++ ) {
					aCircular = parents[ j ] === a[ i ];
					bCircular = parentsB[ j ] === b[ i ];
					if ( aCircular || bCircular ) {
						if ( a[ i ] === b[ i ] || aCircular && bCircular ) {
							loop = true;
						} else {
							parents.pop();
							parentsB.pop();
							return false;
						}
					}
				}
				if ( !loop && !innerEquiv( a[ i ], b[ i ] ) ) {
					parents.pop();
					parentsB.pop();
					return false;
				}
			}
			parents.pop();
			parentsB.pop();
			return true;
		},

		"set": function( b, a ) {
			var innerEq,
				outerEq = true;

			if ( a.size !== b.size ) {
				return false;
			}

			a.forEach( function( aVal ) {
				innerEq = false;

				b.forEach( function( bVal ) {
					if ( innerEquiv( bVal, aVal ) ) {
						innerEq = true;
					}
				} );

				if ( !innerEq ) {
					outerEq = false;
				}
			} );

			return outerEq;
		},

		"map": function( b, a ) {
			var innerEq,
				outerEq = true;

			if ( a.size !== b.size ) {
				return false;
			}

			a.forEach( function( aVal, aKey ) {
				innerEq = false;

				b.forEach( function( bVal, bKey ) {
					if ( innerEquiv( [ bVal, bKey ], [ aVal, aKey ] ) ) {
						innerEq = true;
					}
				} );

				if ( !innerEq ) {
					outerEq = false;
				}
			} );

			return outerEq;
		},

		"object": function( b, a ) {
			var i, j, loop, aCircular, bCircular;

			// Default to true
			var eq = true;
			var aProperties = [];
			var bProperties = [];

			if ( compareConstructors( a, b ) === false ) {
				return false;
			}

			// Stack constructor before traversing properties
			callers.push( a.constructor );

			// Track reference to avoid circular references
			parents.push( a );
			parentsB.push( b );

			// Be strict: don't ensure hasOwnProperty and go deep
			for ( i in a ) {
				loop = false;
				for ( j = 0; j < parents.length; j++ ) {
					aCircular = parents[ j ] === a[ i ];
					bCircular = parentsB[ j ] === b[ i ];
					if ( aCircular || bCircular ) {
						if ( a[ i ] === b[ i ] || aCircular && bCircular ) {
							loop = true;
						} else {
							eq = false;
							break;
						}
					}
				}
				aProperties.push( i );
				if ( !loop && !innerEquiv( a[ i ], b[ i ] ) ) {
					eq = false;
					break;
				}
			}

			parents.pop();
			parentsB.pop();

			// Unstack, we are done
			callers.pop();

			for ( i in b ) {

				// Collect b's properties
				bProperties.push( i );
			}

			// Ensures identical properties name
			return eq && innerEquiv( aProperties.sort(), bProperties.sort() );
		}
	};

	function typeEquiv( a, b ) {
		var type = QUnit.objectType( a );
		return QUnit.objectType( b ) === type && callbacks[ type ]( b, a );
	}

	// The real equiv function
	function innerEquiv( a, b ) {

		// We're done when there's nothing more to compare
		if ( arguments.length < 2 ) {
			return true;
		}

		// Require type-specific equality
		return ( a === b || typeEquiv( a, b ) ) &&

			// ...across all consecutive argument pairs
			( arguments.length === 2 || innerEquiv.apply( this, [].slice.call( arguments, 1 ) ) );
	}

	return innerEquiv;
}() );

// Based on jsDump by Ariel Flesler
// http://flesler.blogspot.com/2008/05/jsdump-pretty-dump-of-any-javascript.html
QUnit.dump = ( function() {
	function quote( str ) {
		return "\"" + str.toString().replace( /\\/g, "\\\\" ).replace( /"/g, "\\\"" ) + "\"";
	}
	function literal( o ) {
		return o + "";
	}
	function join( pre, arr, post ) {
		var s = dump.separator(),
			base = dump.indent(),
			inner = dump.indent( 1 );
		if ( arr.join ) {
			arr = arr.join( "," + s + inner );
		}
		if ( !arr ) {
			return pre + post;
		}
		return [ pre, inner + arr, base + post ].join( s );
	}
	function array( arr, stack ) {
		var i = arr.length,
			ret = new Array( i );

		if ( dump.maxDepth && dump.depth > dump.maxDepth ) {
			return "[object Array]";
		}

		this.up();
		while ( i-- ) {
			ret[ i ] = this.parse( arr[ i ], undefined, stack );
		}
		this.down();
		return join( "[", ret, "]" );
	}

	function isArray( obj ) {
		return (

			//Native Arrays
			toString.call( obj ) === "[object Array]" ||

			// NodeList objects
			( typeof obj.length === "number" && obj.item !== undefined ) &&
			( obj.length ?
				obj.item( 0 ) === obj[ 0 ] :
				( obj.item( 0 ) === null && obj[ 0 ] === undefined )
			)
		);
	}

	var reName = /^function (\w+)/,
		dump = {

			// The objType is used mostly internally, you can fix a (custom) type in advance
			parse: function( obj, objType, stack ) {
				stack = stack || [];
				var res, parser, parserType,
					inStack = inArray( obj, stack );

				if ( inStack !== -1 ) {
					return "recursion(" + ( inStack - stack.length ) + ")";
				}

				objType = objType || this.typeOf( obj  );
				parser = this.parsers[ objType ];
				parserType = typeof parser;

				if ( parserType === "function" ) {
					stack.push( obj );
					res = parser.call( this, obj, stack );
					stack.pop();
					return res;
				}
				return ( parserType === "string" ) ? parser : this.parsers.error;
			},
			typeOf: function( obj ) {
				var type;

				if ( obj === null ) {
					type = "null";
				} else if ( typeof obj === "undefined" ) {
					type = "undefined";
				} else if ( QUnit.is( "regexp", obj ) ) {
					type = "regexp";
				} else if ( QUnit.is( "date", obj ) ) {
					type = "date";
				} else if ( QUnit.is( "function", obj ) ) {
					type = "function";
				} else if ( obj.setInterval !== undefined &&
						obj.document !== undefined &&
						obj.nodeType === undefined ) {
					type = "window";
				} else if ( obj.nodeType === 9 ) {
					type = "document";
				} else if ( obj.nodeType ) {
					type = "node";
				} else if ( isArray( obj ) ) {
					type = "array";
				} else if ( obj.constructor === Error.prototype.constructor ) {
					type = "error";
				} else {
					type = typeof obj;
				}
				return type;
			},

			separator: function() {
				return this.multiline ? this.HTML ? "<br />" : "\n" : this.HTML ? "&#160;" : " ";
			},

			// Extra can be a number, shortcut for increasing-calling-decreasing
			indent: function( extra ) {
				if ( !this.multiline ) {
					return "";
				}
				var chr = this.indentChar;
				if ( this.HTML ) {
					chr = chr.replace( /\t/g, "   " ).replace( / /g, "&#160;" );
				}
				return new Array( this.depth + ( extra || 0 ) ).join( chr );
			},
			up: function( a ) {
				this.depth += a || 1;
			},
			down: function( a ) {
				this.depth -= a || 1;
			},
			setParser: function( name, parser ) {
				this.parsers[ name ] = parser;
			},

			// The next 3 are exposed so you can use them
			quote: quote,
			literal: literal,
			join: join,
			depth: 1,
			maxDepth: QUnit.config.maxDepth,

			// This is the list of parsers, to modify them, use dump.setParser
			parsers: {
				window: "[Window]",
				document: "[Document]",
				error: function( error ) {
					return "Error(\"" + error.message + "\")";
				},
				unknown: "[Unknown]",
				"null": "null",
				"undefined": "undefined",
				"function": function( fn ) {
					var ret = "function",

						// Functions never have name in IE
						name = "name" in fn ? fn.name : ( reName.exec( fn ) || [] )[ 1 ];

					if ( name ) {
						ret += " " + name;
					}
					ret += "(";

					ret = [ ret, dump.parse( fn, "functionArgs" ), "){" ].join( "" );
					return join( ret, dump.parse( fn, "functionCode" ), "}" );
				},
				array: array,
				nodelist: array,
				"arguments": array,
				object: function( map, stack ) {
					var keys, key, val, i, nonEnumerableProperties,
						ret = [];

					if ( dump.maxDepth && dump.depth > dump.maxDepth ) {
						return "[object Object]";
					}

					dump.up();
					keys = [];
					for ( key in map ) {
						keys.push( key );
					}

					// Some properties are not always enumerable on Error objects.
					nonEnumerableProperties = [ "message", "name" ];
					for ( i in nonEnumerableProperties ) {
						key = nonEnumerableProperties[ i ];
						if ( key in map && inArray( key, keys ) < 0 ) {
							keys.push( key );
						}
					}
					keys.sort();
					for ( i = 0; i < keys.length; i++ ) {
						key = keys[ i ];
						val = map[ key ];
						ret.push( dump.parse( key, "key" ) + ": " +
							dump.parse( val, undefined, stack ) );
					}
					dump.down();
					return join( "{", ret, "}" );
				},
				node: function( node ) {
					var len, i, val,
						open = dump.HTML ? "&lt;" : "<",
						close = dump.HTML ? "&gt;" : ">",
						tag = node.nodeName.toLowerCase(),
						ret = open + tag,
						attrs = node.attributes;

					if ( attrs ) {
						for ( i = 0, len = attrs.length; i < len; i++ ) {
							val = attrs[ i ].nodeValue;

							// IE6 includes all attributes in .attributes, even ones not explicitly
							// set. Those have values like undefined, null, 0, false, "" or
							// "inherit".
							if ( val && val !== "inherit" ) {
								ret += " " + attrs[ i ].nodeName + "=" +
									dump.parse( val, "attribute" );
							}
						}
					}
					ret += close;

					// Show content of TextNode or CDATASection
					if ( node.nodeType === 3 || node.nodeType === 4 ) {
						ret += node.nodeValue;
					}

					return ret + open + "/" + tag + close;
				},

				// Function calls it internally, it's the arguments part of the function
				functionArgs: function( fn ) {
					var args,
						l = fn.length;

					if ( !l ) {
						return "";
					}

					args = new Array( l );
					while ( l-- ) {

						// 97 is 'a'
						args[ l ] = String.fromCharCode( 97 + l );
					}
					return " " + args.join( ", " ) + " ";
				},

				// Object calls it internally, the key part of an item in a map
				key: quote,

				// Function calls it internally, it's the content of the function
				functionCode: "[code]",

				// Node calls it internally, it's a html attribute value
				attribute: quote,
				string: quote,
				date: quote,
				regexp: literal,
				number: literal,
				"boolean": literal
			},

			// If true, entities are escaped ( <, >, \t, space and \n )
			HTML: false,

			// Indentation unit
			indentChar: "  ",

			// If true, items in a collection, are separated by a \n, else just a space.
			multiline: true
		};

	return dump;
}() );

// Back compat
QUnit.jsDump = QUnit.dump;

function applyDeprecated( name ) {
	return function() {
		throw new Error(
			name + " is removed in QUnit 2.0.\n" +
			"Details in our upgrade guide at https://qunitjs.com/upgrade-guide-2.x/"
		);
	};
}

Object.keys( Assert.prototype ).forEach( function( key ) {
	QUnit[ key ] = applyDeprecated( "`QUnit." + key + "`" );
} );

QUnit.asyncTest = function() {
	throw new Error(
		"asyncTest is removed in QUnit 2.0, use QUnit.test() with assert.async() instead.\n" +
		"Details in our upgrade guide at https://qunitjs.com/upgrade-guide-2.x/"
	);
};

QUnit.stop = function() {
	throw new Error(
		"QUnit.stop is removed in QUnit 2.0, use QUnit.test() with assert.async() instead.\n" +
		"Details in our upgrade guide at https://qunitjs.com/upgrade-guide-2.x/"
	);
};

function resetThrower() {
	throw new Error(
		"QUnit.reset is removed in QUnit 2.0 without replacement.\n" +
		"Details in our upgrade guide at https://qunitjs.com/upgrade-guide-2.x/"
	);
}

Object.defineProperty( QUnit, "reset", {
	get: function() {
		return resetThrower;
	},
	set: resetThrower
} );

if ( defined.document ) {
	if ( window.QUnit ) {
		throw new Error( "QUnit has already been defined." );
	}

	[
		"test",
		"module",
		"expect",
		"start",
		"ok",
		"notOk",
		"equal",
		"notEqual",
		"propEqual",
		"notPropEqual",
		"deepEqual",
		"notDeepEqual",
		"strictEqual",
		"notStrictEqual",
		"throws",
		"raises"
	].forEach( function( key ) {
		window[ key ] = applyDeprecated( "The global `" + key + "`" );
	} );

	window.QUnit = QUnit;
}

// For nodejs
if ( typeof module !== "undefined" && module && module.exports ) {
	module.exports = QUnit;

	// For consistency with CommonJS environments' exports
	module.exports.QUnit = QUnit;
}

// For CommonJS with exports, but without module.exports, like Rhino
if ( typeof exports !== "undefined" && exports ) {
	exports.QUnit = QUnit;
}

if ( typeof define === "function" && define.amd ) {
	define( function() {
		return QUnit;
	} );
	QUnit.config.autostart = false;
}

// Get a reference to the global object, like window in browsers
}( ( function() {
	return this;
}() ) ) );

( function() {

if ( typeof window === "undefined" || !window.document ) {
	return;
}

var config = QUnit.config,
	hasOwn = Object.prototype.hasOwnProperty;

// Stores fixture HTML for resetting later
function storeFixture() {

	// Avoid overwriting user-defined values
	if ( hasOwn.call( config, "fixture" ) ) {
		return;
	}

	var fixture = document.getElementById( "qunit-fixture" );
	if ( fixture ) {
		config.fixture = fixture.innerHTML;
	}
}

QUnit.begin( storeFixture );

// Resets the fixture DOM element if available.
function resetFixture() {
	if ( config.fixture == null ) {
		return;
	}

	var fixture = document.getElementById( "qunit-fixture" );
	if ( fixture ) {
		fixture.innerHTML = config.fixture;
	}
}

QUnit.testStart( resetFixture );

}() );

( function() {

// Only interact with URLs via window.location
var location = typeof window !== "undefined" && window.location;
if ( !location ) {
	return;
}

var urlParams = getUrlParams();

QUnit.urlParams = urlParams;

// Match module/test by inclusion in an array
QUnit.config.moduleId = [].concat( urlParams.moduleId || [] );
QUnit.config.testId = [].concat( urlParams.testId || [] );

// Exact case-insensitive match of the module name
QUnit.config.module = urlParams.module;

// Regular expression or case-insenstive substring match against "moduleName: testName"
QUnit.config.filter = urlParams.filter;

// Test order randomization
if ( urlParams.seed === true ) {

	// Generate a random seed if the option is specified without a value
	QUnit.config.seed = Math.random().toString( 36 ).slice( 2 );
} else if ( urlParams.seed ) {
	QUnit.config.seed = urlParams.seed;
}

// Add URL-parameter-mapped config values with UI form rendering data
QUnit.config.urlConfig.push(
	{
		id: "hidepassed",
		label: "Hide passed tests",
		tooltip: "Only show tests and assertions that fail. Stored as query-strings."
	},
	{
		id: "noglobals",
		label: "Check for Globals",
		tooltip: "Enabling this will test if any test introduces new properties on the " +
			"global object (`window` in Browsers). Stored as query-strings."
	},
	{
		id: "notrycatch",
		label: "No try-catch",
		tooltip: "Enabling this will run tests outside of a try-catch block. Makes debugging " +
			"exceptions in IE reasonable. Stored as query-strings."
	}
);

QUnit.begin( function() {
	var i, option,
		urlConfig = QUnit.config.urlConfig;

	for ( i = 0; i < urlConfig.length; i++ ) {

		// Options can be either strings or objects with nonempty "id" properties
		option = QUnit.config.urlConfig[ i ];
		if ( typeof option !== "string" ) {
			option = option.id;
		}

		if ( QUnit.config[ option ] === undefined ) {
			QUnit.config[ option ] = urlParams[ option ];
		}
	}
} );

function getUrlParams() {
	var i, param, name, value;
	var urlParams = {};
	var params = location.search.slice( 1 ).split( "&" );
	var length = params.length;

	for ( i = 0; i < length; i++ ) {
		if ( params[ i ] ) {
			param = params[ i ].split( "=" );
			name = decodeQueryParam( param[ 0 ] );

			// Allow just a key to turn on a flag, e.g., test.html?noglobals
			value = param.length === 1 ||
				decodeQueryParam( param.slice( 1 ).join( "=" ) ) ;
			if ( urlParams[ name ] ) {
				urlParams[ name ] = [].concat( urlParams[ name ], value );
			} else {
				urlParams[ name ] = value;
			}
		}
	}

	return urlParams;
}

function decodeQueryParam( param ) {
	return decodeURIComponent( param.replace( /\+/g, "%20" ) );
}

// Don't load the HTML Reporter on non-browser environments
if ( typeof window === "undefined" || !window.document ) {
	return;
}

QUnit.init = function() {
	throw new Error(
		"QUnit.init is removed in QUnit 2.0, use QUnit.test() with assert.async() instead.\n" +
		"Details in our upgrade guide at https://qunitjs.com/upgrade-guide-2.x/"
	);
};

var config = QUnit.config,
	document = window.document,
	collapseNext = false,
	hasOwn = Object.prototype.hasOwnProperty,
	unfilteredUrl = setUrl( { filter: undefined, module: undefined,
		moduleId: undefined, testId: undefined } ),
	defined = {
		sessionStorage: ( function() {
			var x = "qunit-test-string";
			try {
				sessionStorage.setItem( x, x );
				sessionStorage.removeItem( x );
				return true;
			} catch ( e ) {
				return false;
			}
		}() )
	},
	modulesList = [];

// Escape text for attribute or text content.
function escapeText( s ) {
	if ( !s ) {
		return "";
	}
	s = s + "";

	// Both single quotes and double quotes (for attributes)
	return s.replace( /['"<>&]/g, function( s ) {
		switch ( s ) {
		case "'":
			return "&#039;";
		case "\"":
			return "&quot;";
		case "<":
			return "&lt;";
		case ">":
			return "&gt;";
		case "&":
			return "&amp;";
		}
	} );
}

function addEvent( elem, type, fn ) {
	elem.addEventListener( type, fn, false );
}

function removeEvent( elem, type, fn ) {
	elem.removeEventListener( type, fn, false );
}

function addEvents( elems, type, fn ) {
	var i = elems.length;
	while ( i-- ) {
		addEvent( elems[ i ], type, fn );
	}
}

function hasClass( elem, name ) {
	return ( " " + elem.className + " " ).indexOf( " " + name + " " ) >= 0;
}

function addClass( elem, name ) {
	if ( !hasClass( elem, name ) ) {
		elem.className += ( elem.className ? " " : "" ) + name;
	}
}

function toggleClass( elem, name, force ) {
	if ( force || typeof force === "undefined" && !hasClass( elem, name ) ) {
		addClass( elem, name );
	} else {
		removeClass( elem, name );
	}
}

function removeClass( elem, name ) {
	var set = " " + elem.className + " ";

	// Class name may appear multiple times
	while ( set.indexOf( " " + name + " " ) >= 0 ) {
		set = set.replace( " " + name + " ", " " );
	}

	// Trim for prettiness
	elem.className = typeof set.trim === "function" ? set.trim() : set.replace( /^\s+|\s+$/g, "" );
}

function id( name ) {
	return document.getElementById && document.getElementById( name );
}

function interceptNavigation( ev ) {
	applyUrlParams();

	if ( ev && ev.preventDefault ) {
		ev.preventDefault();
	}

	return false;
}

function getUrlConfigHtml() {
	var i, j, val,
		escaped, escapedTooltip,
		selection = false,
		urlConfig = config.urlConfig,
		urlConfigHtml = "";

	for ( i = 0; i < urlConfig.length; i++ ) {

		// Options can be either strings or objects with nonempty "id" properties
		val = config.urlConfig[ i ];
		if ( typeof val === "string" ) {
			val = {
				id: val,
				label: val
			};
		}

		escaped = escapeText( val.id );
		escapedTooltip = escapeText( val.tooltip );

		if ( !val.value || typeof val.value === "string" ) {
			urlConfigHtml += "<label for='qunit-urlconfig-" + escaped +
				"' title='" + escapedTooltip + "'><input id='qunit-urlconfig-" + escaped +
				"' name='" + escaped + "' type='checkbox'" +
				( val.value ? " value='" + escapeText( val.value ) + "'" : "" ) +
				( config[ val.id ] ? " checked='checked'" : "" ) +
				" title='" + escapedTooltip + "' />" + escapeText( val.label ) + "</label>";
		} else {
			urlConfigHtml += "<label for='qunit-urlconfig-" + escaped +
				"' title='" + escapedTooltip + "'>" + val.label +
				": </label><select id='qunit-urlconfig-" + escaped +
				"' name='" + escaped + "' title='" + escapedTooltip + "'><option></option>";

			if ( QUnit.is( "array", val.value ) ) {
				for ( j = 0; j < val.value.length; j++ ) {
					escaped = escapeText( val.value[ j ] );
					urlConfigHtml += "<option value='" + escaped + "'" +
						( config[ val.id ] === val.value[ j ] ?
							( selection = true ) && " selected='selected'" : "" ) +
						">" + escaped + "</option>";
				}
			} else {
				for ( j in val.value ) {
					if ( hasOwn.call( val.value, j ) ) {
						urlConfigHtml += "<option value='" + escapeText( j ) + "'" +
							( config[ val.id ] === j ?
								( selection = true ) && " selected='selected'" : "" ) +
							">" + escapeText( val.value[ j ] ) + "</option>";
					}
				}
			}
			if ( config[ val.id ] && !selection ) {
				escaped = escapeText( config[ val.id ] );
				urlConfigHtml += "<option value='" + escaped +
					"' selected='selected' disabled='disabled'>" + escaped + "</option>";
			}
			urlConfigHtml += "</select>";
		}
	}

	return urlConfigHtml;
}

// Handle "click" events on toolbar checkboxes and "change" for select menus.
// Updates the URL with the new state of `config.urlConfig` values.
function toolbarChanged() {
	var updatedUrl, value, tests,
		field = this,
		params = {};

	// Detect if field is a select menu or a checkbox
	if ( "selectedIndex" in field ) {
		value = field.options[ field.selectedIndex ].value || undefined;
	} else {
		value = field.checked ? ( field.defaultValue || true ) : undefined;
	}

	params[ field.name ] = value;
	updatedUrl = setUrl( params );

	// Check if we can apply the change without a page refresh
	if ( "hidepassed" === field.name && "replaceState" in window.history ) {
		QUnit.urlParams[ field.name ] = value;
		config[ field.name ] = value || false;
		tests = id( "qunit-tests" );
		if ( tests ) {
			toggleClass( tests, "hidepass", value || false );
		}
		window.history.replaceState( null, "", updatedUrl );
	} else {
		window.location = updatedUrl;
	}
}

function setUrl( params ) {
	var key, arrValue, i,
		querystring = "?",
		location = window.location;

	params = QUnit.extend( QUnit.extend( {}, QUnit.urlParams ), params );

	for ( key in params ) {

		// Skip inherited or undefined properties
		if ( hasOwn.call( params, key ) && params[ key ] !== undefined ) {

			// Output a parameter for each value of this key (but usually just one)
			arrValue = [].concat( params[ key ] );
			for ( i = 0; i < arrValue.length; i++ ) {
				querystring += encodeURIComponent( key );
				if ( arrValue[ i ] !== true ) {
					querystring += "=" + encodeURIComponent( arrValue[ i ] );
				}
				querystring += "&";
			}
		}
	}
	return location.protocol + "//" + location.host +
		location.pathname + querystring.slice( 0, -1 );
}

function applyUrlParams() {
	var i,
		selectedModules = [],
		modulesList = id( "qunit-modulefilter-dropdown-list" ).getElementsByTagName( "input" ),
		filter = id( "qunit-filter-input" ).value;

	for ( i = 0; i < modulesList.length; i++ )  {
		if ( modulesList[ i ].checked ) {
			selectedModules.push( modulesList[ i ].value );
		}
	}

	window.location = setUrl( {
		filter: ( filter === "" ) ? undefined : filter,
		moduleId: ( selectedModules.length === 0 ) ? undefined : selectedModules,

		// Remove module and testId filter
		module: undefined,
		testId: undefined
	} );
}

function toolbarUrlConfigContainer() {
	var urlConfigContainer = document.createElement( "span" );

	urlConfigContainer.innerHTML = getUrlConfigHtml();
	addClass( urlConfigContainer, "qunit-url-config" );

	addEvents( urlConfigContainer.getElementsByTagName( "input" ), "change", toolbarChanged );
	addEvents( urlConfigContainer.getElementsByTagName( "select" ), "change", toolbarChanged );

	return urlConfigContainer;
}

function toolbarLooseFilter() {
	var filter = document.createElement( "form" ),
		label = document.createElement( "label" ),
		input = document.createElement( "input" ),
		button = document.createElement( "button" );

	addClass( filter, "qunit-filter" );

	label.innerHTML = "Filter: ";

	input.type = "text";
	input.value = config.filter || "";
	input.name = "filter";
	input.id = "qunit-filter-input";

	button.innerHTML = "Go";

	label.appendChild( input );

	filter.appendChild( label );
	filter.appendChild( document.createTextNode( " " ) );
	filter.appendChild( button );
	addEvent( filter, "submit", interceptNavigation );

	return filter;
}

function moduleListHtml () {
	var i, checked,
		html = "";

	for ( i = 0; i < config.modules.length; i++ ) {
		if ( config.modules[ i ].name !== "" ) {
			checked = config.moduleId.indexOf( config.modules[ i ].moduleId ) > -1;
			html += "<li><label class='clickable" + ( checked ? " checked" : "" ) +
				"'><input type='checkbox' " + "value='" + config.modules[ i ].moduleId + "'" +
				( checked ? " checked='checked'" : "" ) + " />" +
				escapeText( config.modules[ i ].name ) + "</label></li>";
		}
	}

	return html;
}

function toolbarModuleFilter () {
	var allCheckbox, commit, reset,
		moduleFilter = document.createElement( "form" ),
		label = document.createElement( "label" ),
		moduleSearch = document.createElement( "input" ),
		dropDown = document.createElement( "div" ),
		actions = document.createElement( "span" ),
		dropDownList = document.createElement( "ul" ),
		dirty = false;

	moduleSearch.id = "qunit-modulefilter-search";
	addEvent( moduleSearch, "input", searchInput );
	addEvent( moduleSearch, "input", searchFocus );
	addEvent( moduleSearch, "focus", searchFocus );
	addEvent( moduleSearch, "click", searchFocus );

	label.id = "qunit-modulefilter-search-container";
	label.innerHTML = "Module: ";
	label.appendChild( moduleSearch );

	actions.id = "qunit-modulefilter-actions";
	actions.innerHTML =
		"<button style='display:none'>Apply</button>" +
		"<button type='reset' style='display:none'>Reset</button>" +
		"<label class='clickable" +
		( config.moduleId.length ? "" : " checked" ) +
		"'><input type='checkbox'" + ( config.moduleId.length ? "" : " checked='checked'" ) +
		">All modules</label>";
	allCheckbox = actions.lastChild.firstChild;
	commit = actions.firstChild;
	reset = commit.nextSibling;
	addEvent( commit, "click", applyUrlParams );

	dropDownList.id = "qunit-modulefilter-dropdown-list";
	dropDownList.innerHTML = moduleListHtml();

	dropDown.id = "qunit-modulefilter-dropdown";
	dropDown.style.display = "none";
	dropDown.appendChild( actions );
	dropDown.appendChild( dropDownList );
	addEvent( dropDown, "change", selectionChange );
	selectionChange();

	moduleFilter.id = "qunit-modulefilter";
	moduleFilter.appendChild( label );
	moduleFilter.appendChild( dropDown ) ;
	addEvent( moduleFilter, "submit", interceptNavigation );
	addEvent( moduleFilter, "reset", function() {

		// Let the reset happen, then update styles
		window.setTimeout( selectionChange );
	} );

	// Enables show/hide for the dropdown
	function searchFocus() {
		if ( dropDown.style.display !== "none" ) {
			return;
		}

		dropDown.style.display = "block";
		addEvent( document, "click", hideHandler );
		addEvent( document, "keydown", hideHandler );

		// Hide on Escape keydown or outside-container click
		function hideHandler( e )  {
			var inContainer = moduleFilter.contains( e.target );

			if ( e.keyCode === 27 || !inContainer ) {
				if ( e.keyCode === 27 && inContainer ) {
					moduleSearch.focus();
				}
				dropDown.style.display = "none";
				removeEvent( document, "click", hideHandler );
				removeEvent( document, "keydown", hideHandler );
				moduleSearch.value = "";
				searchInput();
			}
		}
	}

	// Processes module search box input
	function searchInput() {
		var i, item,
			searchText = moduleSearch.value.toLowerCase(),
			listItems = dropDownList.children;

		for ( i = 0; i < listItems.length; i++ ) {
			item = listItems[ i ];
			if ( !searchText || item.textContent.toLowerCase().indexOf( searchText ) > -1 ) {
				item.style.display = "";
			} else {
				item.style.display = "none";
			}
		}
	}

	// Processes selection changes
	function selectionChange( evt ) {
		var i,
			checkbox = evt && evt.target || allCheckbox,
			modulesList = dropDownList.getElementsByTagName( "input" ),
			selectedNames = [];

		toggleClass( checkbox.parentNode, "checked", checkbox.checked );

		dirty = false;
		if ( checkbox.checked && checkbox !== allCheckbox ) {
		   allCheckbox.checked = false;
		   removeClass( allCheckbox.parentNode, "checked" );
		}
		for ( i = 0; i < modulesList.length; i++ )  {
			if ( !evt ) {
				toggleClass( modulesList[ i ].parentNode, "checked", modulesList[ i ].checked );
			} else if ( checkbox === allCheckbox && checkbox.checked ) {
				modulesList[ i ].checked = false;
				removeClass( modulesList[ i ].parentNode, "checked" );
			}
			dirty = dirty || ( checkbox.checked !== checkbox.defaultChecked );
			if ( modulesList[ i ].checked ) {
				selectedNames.push( modulesList[ i ].parentNode.textContent );
			}
		}

		commit.style.display = reset.style.display = dirty ? "" : "none";
		moduleSearch.placeholder = selectedNames.join( ", " ) || allCheckbox.parentNode.textContent;
		moduleSearch.title = "Type to filter list. Current selection:\n" +
			( selectedNames.join( "\n" ) || allCheckbox.parentNode.textContent );
	}

	return moduleFilter;
}

function appendToolbar() {
	var toolbar = id( "qunit-testrunner-toolbar" );

	if ( toolbar ) {
		toolbar.appendChild( toolbarUrlConfigContainer() );
		toolbar.appendChild( toolbarModuleFilter() );
		toolbar.appendChild( toolbarLooseFilter() );
		toolbar.appendChild( document.createElement( "div" ) ).className = "clearfix";
	}
}

function appendHeader() {
	var header = id( "qunit-header" );

	if ( header ) {
		header.innerHTML = "<a href='" + escapeText( unfilteredUrl ) + "'>" + header.innerHTML +
			"</a> ";
	}
}

function appendBanner() {
	var banner = id( "qunit-banner" );

	if ( banner ) {
		banner.className = "";
	}
}

function appendTestResults() {
	var tests = id( "qunit-tests" ),
		result = id( "qunit-testresult" );

	if ( result ) {
		result.parentNode.removeChild( result );
	}

	if ( tests ) {
		tests.innerHTML = "";
		result = document.createElement( "p" );
		result.id = "qunit-testresult";
		result.className = "result";
		tests.parentNode.insertBefore( result, tests );
		result.innerHTML = "Running...<br />&#160;";
	}
}

function appendFilteredTest() {
	var testId = QUnit.config.testId;
	if ( !testId || testId.length <= 0 ) {
		return "";
	}
	return "<div id='qunit-filteredTest'>Rerunning selected tests: " +
		escapeText( testId.join( ", " ) ) +
		" <a id='qunit-clearFilter' href='" +
		escapeText( unfilteredUrl ) +
		"'>Run all tests</a></div>";
}

function appendUserAgent() {
	var userAgent = id( "qunit-userAgent" );

	if ( userAgent ) {
		userAgent.innerHTML = "";
		userAgent.appendChild(
			document.createTextNode(
				"QUnit " + QUnit.version + "; " + navigator.userAgent
			)
		);
	}
}

function appendInterface() {
	var qunit = id( "qunit" );

	if ( qunit ) {
		qunit.innerHTML =
			"<h1 id='qunit-header'>" + escapeText( document.title ) + "</h1>" +
			"<h2 id='qunit-banner'></h2>" +
			"<div id='qunit-testrunner-toolbar'></div>" +
			appendFilteredTest() +
			"<h2 id='qunit-userAgent'></h2>" +
			"<ol id='qunit-tests'></ol>";
	}

	appendHeader();
	appendBanner();
	appendTestResults();
	appendUserAgent();
	appendToolbar();
}

function appendTestsList( modules ) {
	var i, l, x, z, test, moduleObj;

	for ( i = 0, l = modules.length; i < l; i++ ) {
		moduleObj = modules[ i ];

		for ( x = 0, z = moduleObj.tests.length; x < z; x++ ) {
			test = moduleObj.tests[ x ];

			appendTest( test.name, test.testId, moduleObj.name );
		}
	}
}

function appendTest( name, testId, moduleName ) {
	var title, rerunTrigger, testBlock, assertList,
		tests = id( "qunit-tests" );

	if ( !tests ) {
		return;
	}

	title = document.createElement( "strong" );
	title.innerHTML = getNameHtml( name, moduleName );

	rerunTrigger = document.createElement( "a" );
	rerunTrigger.innerHTML = "Rerun";
	rerunTrigger.href = setUrl( { testId: testId } );

	testBlock = document.createElement( "li" );
	testBlock.appendChild( title );
	testBlock.appendChild( rerunTrigger );
	testBlock.id = "qunit-test-output-" + testId;

	assertList = document.createElement( "ol" );
	assertList.className = "qunit-assert-list";

	testBlock.appendChild( assertList );

	tests.appendChild( testBlock );
}

// HTML Reporter initialization and load
QUnit.begin( function( details ) {
	var i, moduleObj, tests;

	// Sort modules by name for the picker
	for ( i = 0; i < details.modules.length; i++ ) {
		moduleObj = details.modules[ i ];
		if ( moduleObj.name ) {
			modulesList.push( moduleObj.name );
		}
	}
	modulesList.sort( function( a, b ) {
		return a.localeCompare( b );
	} );

	// Initialize QUnit elements
	appendInterface();
	appendTestsList( details.modules );
	tests = id( "qunit-tests" );
	if ( tests && config.hidepassed ) {
		addClass( tests, "hidepass" );
	}
} );

QUnit.done( function( details ) {
	var i, key,
		banner = id( "qunit-banner" ),
		tests = id( "qunit-tests" ),
		html = [
			"Tests completed in ",
			details.runtime,
			" milliseconds.<br />",
			"<span class='passed'>",
			details.passed,
			"</span> assertions of <span class='total'>",
			details.total,
			"</span> passed, <span class='failed'>",
			details.failed,
			"</span> failed."
		].join( "" );

	if ( banner ) {
		banner.className = details.failed ? "qunit-fail" : "qunit-pass";
	}

	if ( tests ) {
		id( "qunit-testresult" ).innerHTML = html;
	}

	if ( config.altertitle && document.title ) {

		// Show ✖ for good, ✔ for bad suite result in title
		// use escape sequences in case file gets loaded with non-utf-8-charset
		document.title = [
			( details.failed ? "\u2716" : "\u2714" ),
			document.title.replace( /^[\u2714\u2716] /i, "" )
		].join( " " );
	}

	// Clear own sessionStorage items if all tests passed
	if ( config.reorder && defined.sessionStorage && details.failed === 0 ) {
		for ( i = 0; i < sessionStorage.length; i++ ) {
			key = sessionStorage.key( i++ );
			if ( key.indexOf( "qunit-test-" ) === 0 ) {
				sessionStorage.removeItem( key );
			}
		}
	}

	// Scroll back to top to show results
	if ( config.scrolltop && window.scrollTo ) {
		window.scrollTo( 0, 0 );
	}
} );

function getNameHtml( name, module ) {
	var nameHtml = "";

	if ( module ) {
		nameHtml = "<span class='module-name'>" + escapeText( module ) + "</span>: ";
	}

	nameHtml += "<span class='test-name'>" + escapeText( name ) + "</span>";

	return nameHtml;
}

QUnit.testStart( function( details ) {
	var running, testBlock, bad;

	testBlock = id( "qunit-test-output-" + details.testId );
	if ( testBlock ) {
		testBlock.className = "running";
	} else {

		// Report later registered tests
		appendTest( details.name, details.testId, details.module );
	}

	running = id( "qunit-testresult" );
	if ( running ) {
		bad = QUnit.config.reorder && defined.sessionStorage &&
			+sessionStorage.getItem( "qunit-test-" + details.module + "-" + details.name );

		running.innerHTML = ( bad ?
			"Rerunning previously failed test: <br />" :
			"Running: <br />" ) +
			getNameHtml( details.name, details.module );
	}

} );

function stripHtml( string ) {

	// Strip tags, html entity and whitespaces
	return string.replace( /<\/?[^>]+(>|$)/g, "" ).replace( /\&quot;/g, "" ).replace( /\s+/g, "" );
}

QUnit.log( function( details ) {
	var assertList, assertLi,
		message, expected, actual, diff,
		showDiff = false,
		testItem = id( "qunit-test-output-" + details.testId );

	if ( !testItem ) {
		return;
	}

	message = escapeText( details.message ) || ( details.result ? "okay" : "failed" );
	message = "<span class='test-message'>" + message + "</span>";
	message += "<span class='runtime'>@ " + details.runtime + " ms</span>";

	// The pushFailure doesn't provide details.expected
	// when it calls, it's implicit to also not show expected and diff stuff
	// Also, we need to check details.expected existence, as it can exist and be undefined
	if ( !details.result && hasOwn.call( details, "expected" ) ) {
		if ( details.negative ) {
			expected = "NOT " + QUnit.dump.parse( details.expected );
		} else {
			expected = QUnit.dump.parse( details.expected );
		}

		actual = QUnit.dump.parse( details.actual );
		message += "<table><tr class='test-expected'><th>Expected: </th><td><pre>" +
			escapeText( expected ) +
			"</pre></td></tr>";

		if ( actual !== expected ) {

			message += "<tr class='test-actual'><th>Result: </th><td><pre>" +
				escapeText( actual ) + "</pre></td></tr>";

			// Don't show diff if actual or expected are booleans
			if ( !( /^(true|false)$/.test( actual ) ) &&
					!( /^(true|false)$/.test( expected ) ) ) {
				diff = QUnit.diff( expected, actual );
				showDiff = stripHtml( diff ).length !==
					stripHtml( expected ).length +
					stripHtml( actual ).length;
			}

			// Don't show diff if expected and actual are totally different
			if ( showDiff ) {
				message += "<tr class='test-diff'><th>Diff: </th><td><pre>" +
					diff + "</pre></td></tr>";
			}
		} else if ( expected.indexOf( "[object Array]" ) !== -1 ||
				expected.indexOf( "[object Object]" ) !== -1 ) {
			message += "<tr class='test-message'><th>Message: </th><td>" +
				"Diff suppressed as the depth of object is more than current max depth (" +
				QUnit.config.maxDepth + ").<p>Hint: Use <code>QUnit.dump.maxDepth</code> to " +
				" run with a higher max depth or <a href='" +
				escapeText( setUrl( { maxDepth: -1 } ) ) + "'>" +
				"Rerun</a> without max depth.</p></td></tr>";
		} else {
			message += "<tr class='test-message'><th>Message: </th><td>" +
				"Diff suppressed as the expected and actual results have an equivalent" +
				" serialization</td></tr>";
		}

		if ( details.source ) {
			message += "<tr class='test-source'><th>Source: </th><td><pre>" +
				escapeText( details.source ) + "</pre></td></tr>";
		}

		message += "</table>";

	// This occurs when pushFailure is set and we have an extracted stack trace
	} else if ( !details.result && details.source ) {
		message += "<table>" +
			"<tr class='test-source'><th>Source: </th><td><pre>" +
			escapeText( details.source ) + "</pre></td></tr>" +
			"</table>";
	}

	assertList = testItem.getElementsByTagName( "ol" )[ 0 ];

	assertLi = document.createElement( "li" );
	assertLi.className = details.result ? "pass" : "fail";
	assertLi.innerHTML = message;
	assertList.appendChild( assertLi );
} );

QUnit.testDone( function( details ) {
	var testTitle, time, testItem, assertList,
		good, bad, testCounts, skipped, sourceName,
		tests = id( "qunit-tests" );

	if ( !tests ) {
		return;
	}

	testItem = id( "qunit-test-output-" + details.testId );

	assertList = testItem.getElementsByTagName( "ol" )[ 0 ];

	good = details.passed;
	bad = details.failed;

	// Store result when possible
	if ( config.reorder && defined.sessionStorage ) {
		if ( bad ) {
			sessionStorage.setItem( "qunit-test-" + details.module + "-" + details.name, bad );
		} else {
			sessionStorage.removeItem( "qunit-test-" + details.module + "-" + details.name );
		}
	}

	if ( bad === 0 ) {

		// Collapse the passing tests
		addClass( assertList, "qunit-collapsed" );
	} else if ( bad && config.collapse && !collapseNext ) {

		// Skip collapsing the first failing test
		collapseNext = true;
	} else {

		// Collapse remaining tests
		addClass( assertList, "qunit-collapsed" );
	}

	// The testItem.firstChild is the test name
	testTitle = testItem.firstChild;

	testCounts = bad ?
		"<b class='failed'>" + bad + "</b>, " + "<b class='passed'>" + good + "</b>, " :
		"";

	testTitle.innerHTML += " <b class='counts'>(" + testCounts +
		details.assertions.length + ")</b>";

	if ( details.skipped ) {
		testItem.className = "skipped";
		skipped = document.createElement( "em" );
		skipped.className = "qunit-skipped-label";
		skipped.innerHTML = "skipped";
		testItem.insertBefore( skipped, testTitle );
	} else {
		addEvent( testTitle, "click", function() {
			toggleClass( assertList, "qunit-collapsed" );
		} );

		testItem.className = bad ? "fail" : "pass";

		time = document.createElement( "span" );
		time.className = "runtime";
		time.innerHTML = details.runtime + " ms";
		testItem.insertBefore( time, assertList );
	}

	// Show the source of the test when showing assertions
	if ( details.source ) {
		sourceName = document.createElement( "p" );
		sourceName.innerHTML = "<strong>Source: </strong>" + details.source;
		addClass( sourceName, "qunit-source" );
		if ( bad === 0 ) {
			addClass( sourceName, "qunit-collapsed" );
		}
		addEvent( testTitle, "click", function() {
			toggleClass( sourceName, "qunit-collapsed" );
		} );
		testItem.appendChild( sourceName );
	}
} );

// Avoid readyState issue with phantomjs
// Ref: #818
var notPhantom = ( function( p ) {
	return !( p && p.version && p.version.major > 0 );
} )( window.phantom );

if ( notPhantom && document.readyState === "complete" ) {
	QUnit.load();
} else {
	addEvent( window, "load", QUnit.load );
}

/*
 * This file is a modified version of google-diff-match-patch's JavaScript implementation
 * (https://code.google.com/p/google-diff-match-patch/source/browse/trunk/javascript/diff_match_patch_uncompressed.js),
 * modifications are licensed as more fully set forth in LICENSE.txt.
 *
 * The original source of google-diff-match-patch is attributable and licensed as follows:
 *
 * Copyright 2006 Google Inc.
 * https://code.google.com/p/google-diff-match-patch/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * More Info:
 *  https://code.google.com/p/google-diff-match-patch/
 *
 * Usage: QUnit.diff(expected, actual)
 *
 */
QUnit.diff = ( function() {
	function DiffMatchPatch() {
	}

	//  DIFF FUNCTIONS

	/**
	 * The data structure representing a diff is an array of tuples:
	 * [[DIFF_DELETE, 'Hello'], [DIFF_INSERT, 'Goodbye'], [DIFF_EQUAL, ' world.']]
	 * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
	 */
	var DIFF_DELETE = -1,
		DIFF_INSERT = 1,
		DIFF_EQUAL = 0;

	/**
	 * Find the differences between two texts.  Simplifies the problem by stripping
	 * any common prefix or suffix off the texts before diffing.
	 * @param {string} text1 Old string to be diffed.
	 * @param {string} text2 New string to be diffed.
	 * @param {boolean=} optChecklines Optional speedup flag. If present and false,
	 *     then don't run a line-level diff first to identify the changed areas.
	 *     Defaults to true, which does a faster, slightly less optimal diff.
	 * @return {!Array.<!DiffMatchPatch.Diff>} Array of diff tuples.
	 */
	DiffMatchPatch.prototype.DiffMain = function( text1, text2, optChecklines ) {
		var deadline, checklines, commonlength,
			commonprefix, commonsuffix, diffs;

		// The diff must be complete in up to 1 second.
		deadline = ( new Date() ).getTime() + 1000;

		// Check for null inputs.
		if ( text1 === null || text2 === null ) {
			throw new Error( "Null input. (DiffMain)" );
		}

		// Check for equality (speedup).
		if ( text1 === text2 ) {
			if ( text1 ) {
				return [
					[ DIFF_EQUAL, text1 ]
				];
			}
			return [];
		}

		if ( typeof optChecklines === "undefined" ) {
			optChecklines = true;
		}

		checklines = optChecklines;

		// Trim off common prefix (speedup).
		commonlength = this.diffCommonPrefix( text1, text2 );
		commonprefix = text1.substring( 0, commonlength );
		text1 = text1.substring( commonlength );
		text2 = text2.substring( commonlength );

		// Trim off common suffix (speedup).
		commonlength = this.diffCommonSuffix( text1, text2 );
		commonsuffix = text1.substring( text1.length - commonlength );
		text1 = text1.substring( 0, text1.length - commonlength );
		text2 = text2.substring( 0, text2.length - commonlength );

		// Compute the diff on the middle block.
		diffs = this.diffCompute( text1, text2, checklines, deadline );

		// Restore the prefix and suffix.
		if ( commonprefix ) {
			diffs.unshift( [ DIFF_EQUAL, commonprefix ] );
		}
		if ( commonsuffix ) {
			diffs.push( [ DIFF_EQUAL, commonsuffix ] );
		}
		this.diffCleanupMerge( diffs );
		return diffs;
	};

	/**
	 * Reduce the number of edits by eliminating operationally trivial equalities.
	 * @param {!Array.<!DiffMatchPatch.Diff>} diffs Array of diff tuples.
	 */
	DiffMatchPatch.prototype.diffCleanupEfficiency = function( diffs ) {
		var changes, equalities, equalitiesLength, lastequality,
			pointer, preIns, preDel, postIns, postDel;
		changes = false;
		equalities = []; // Stack of indices where equalities are found.
		equalitiesLength = 0; // Keeping our own length var is faster in JS.
		/** @type {?string} */
		lastequality = null;

		// Always equal to diffs[equalities[equalitiesLength - 1]][1]
		pointer = 0; // Index of current position.

		// Is there an insertion operation before the last equality.
		preIns = false;

		// Is there a deletion operation before the last equality.
		preDel = false;

		// Is there an insertion operation after the last equality.
		postIns = false;

		// Is there a deletion operation after the last equality.
		postDel = false;
		while ( pointer < diffs.length ) {

			// Equality found.
			if ( diffs[ pointer ][ 0 ] === DIFF_EQUAL ) {
				if ( diffs[ pointer ][ 1 ].length < 4 && ( postIns || postDel ) ) {

					// Candidate found.
					equalities[ equalitiesLength++ ] = pointer;
					preIns = postIns;
					preDel = postDel;
					lastequality = diffs[ pointer ][ 1 ];
				} else {

					// Not a candidate, and can never become one.
					equalitiesLength = 0;
					lastequality = null;
				}
				postIns = postDel = false;

			// An insertion or deletion.
			} else {

				if ( diffs[ pointer ][ 0 ] === DIFF_DELETE ) {
					postDel = true;
				} else {
					postIns = true;
				}

				/*
				 * Five types to be split:
				 * <ins>A</ins><del>B</del>XY<ins>C</ins><del>D</del>
				 * <ins>A</ins>X<ins>C</ins><del>D</del>
				 * <ins>A</ins><del>B</del>X<ins>C</ins>
				 * <ins>A</del>X<ins>C</ins><del>D</del>
				 * <ins>A</ins><del>B</del>X<del>C</del>
				 */
				if ( lastequality && ( ( preIns && preDel && postIns && postDel ) ||
						( ( lastequality.length < 2 ) &&
						( preIns + preDel + postIns + postDel ) === 3 ) ) ) {

					// Duplicate record.
					diffs.splice(
						equalities[ equalitiesLength - 1 ],
						0,
						[ DIFF_DELETE, lastequality ]
					);

					// Change second copy to insert.
					diffs[ equalities[ equalitiesLength - 1 ] + 1 ][ 0 ] = DIFF_INSERT;
					equalitiesLength--; // Throw away the equality we just deleted;
					lastequality = null;
					if ( preIns && preDel ) {

						// No changes made which could affect previous entry, keep going.
						postIns = postDel = true;
						equalitiesLength = 0;
					} else {
						equalitiesLength--; // Throw away the previous equality.
						pointer = equalitiesLength > 0 ? equalities[ equalitiesLength - 1 ] : -1;
						postIns = postDel = false;
					}
					changes = true;
				}
			}
			pointer++;
		}

		if ( changes ) {
			this.diffCleanupMerge( diffs );
		}
	};

	/**
	 * Convert a diff array into a pretty HTML report.
	 * @param {!Array.<!DiffMatchPatch.Diff>} diffs Array of diff tuples.
	 * @param {integer} string to be beautified.
	 * @return {string} HTML representation.
	 */
	DiffMatchPatch.prototype.diffPrettyHtml = function( diffs ) {
		var op, data, x,
			html = [];
		for ( x = 0; x < diffs.length; x++ ) {
			op = diffs[ x ][ 0 ]; // Operation (insert, delete, equal)
			data = diffs[ x ][ 1 ]; // Text of change.
			switch ( op ) {
			case DIFF_INSERT:
				html[ x ] = "<ins>" + escapeText( data ) + "</ins>";
				break;
			case DIFF_DELETE:
				html[ x ] = "<del>" + escapeText( data ) + "</del>";
				break;
			case DIFF_EQUAL:
				html[ x ] = "<span>" + escapeText( data ) + "</span>";
				break;
			}
		}
		return html.join( "" );
	};

	/**
	 * Determine the common prefix of two strings.
	 * @param {string} text1 First string.
	 * @param {string} text2 Second string.
	 * @return {number} The number of characters common to the start of each
	 *     string.
	 */
	DiffMatchPatch.prototype.diffCommonPrefix = function( text1, text2 ) {
		var pointermid, pointermax, pointermin, pointerstart;

		// Quick check for common null cases.
		if ( !text1 || !text2 || text1.charAt( 0 ) !== text2.charAt( 0 ) ) {
			return 0;
		}

		// Binary search.
		// Performance analysis: https://neil.fraser.name/news/2007/10/09/
		pointermin = 0;
		pointermax = Math.min( text1.length, text2.length );
		pointermid = pointermax;
		pointerstart = 0;
		while ( pointermin < pointermid ) {
			if ( text1.substring( pointerstart, pointermid ) ===
					text2.substring( pointerstart, pointermid ) ) {
				pointermin = pointermid;
				pointerstart = pointermin;
			} else {
				pointermax = pointermid;
			}
			pointermid = Math.floor( ( pointermax - pointermin ) / 2 + pointermin );
		}
		return pointermid;
	};

	/**
	 * Determine the common suffix of two strings.
	 * @param {string} text1 First string.
	 * @param {string} text2 Second string.
	 * @return {number} The number of characters common to the end of each string.
	 */
	DiffMatchPatch.prototype.diffCommonSuffix = function( text1, text2 ) {
		var pointermid, pointermax, pointermin, pointerend;

		// Quick check for common null cases.
		if ( !text1 ||
				!text2 ||
				text1.charAt( text1.length - 1 ) !== text2.charAt( text2.length - 1 ) ) {
			return 0;
		}

		// Binary search.
		// Performance analysis: https://neil.fraser.name/news/2007/10/09/
		pointermin = 0;
		pointermax = Math.min( text1.length, text2.length );
		pointermid = pointermax;
		pointerend = 0;
		while ( pointermin < pointermid ) {
			if ( text1.substring( text1.length - pointermid, text1.length - pointerend ) ===
					text2.substring( text2.length - pointermid, text2.length - pointerend ) ) {
				pointermin = pointermid;
				pointerend = pointermin;
			} else {
				pointermax = pointermid;
			}
			pointermid = Math.floor( ( pointermax - pointermin ) / 2 + pointermin );
		}
		return pointermid;
	};

	/**
	 * Find the differences between two texts.  Assumes that the texts do not
	 * have any common prefix or suffix.
	 * @param {string} text1 Old string to be diffed.
	 * @param {string} text2 New string to be diffed.
	 * @param {boolean} checklines Speedup flag.  If false, then don't run a
	 *     line-level diff first to identify the changed areas.
	 *     If true, then run a faster, slightly less optimal diff.
	 * @param {number} deadline Time when the diff should be complete by.
	 * @return {!Array.<!DiffMatchPatch.Diff>} Array of diff tuples.
	 * @private
	 */
	DiffMatchPatch.prototype.diffCompute = function( text1, text2, checklines, deadline ) {
		var diffs, longtext, shorttext, i, hm,
			text1A, text2A, text1B, text2B,
			midCommon, diffsA, diffsB;

		if ( !text1 ) {

			// Just add some text (speedup).
			return [
				[ DIFF_INSERT, text2 ]
			];
		}

		if ( !text2 ) {

			// Just delete some text (speedup).
			return [
				[ DIFF_DELETE, text1 ]
			];
		}

		longtext = text1.length > text2.length ? text1 : text2;
		shorttext = text1.length > text2.length ? text2 : text1;
		i = longtext.indexOf( shorttext );
		if ( i !== -1 ) {

			// Shorter text is inside the longer text (speedup).
			diffs = [
				[ DIFF_INSERT, longtext.substring( 0, i ) ],
				[ DIFF_EQUAL, shorttext ],
				[ DIFF_INSERT, longtext.substring( i + shorttext.length ) ]
			];

			// Swap insertions for deletions if diff is reversed.
			if ( text1.length > text2.length ) {
				diffs[ 0 ][ 0 ] = diffs[ 2 ][ 0 ] = DIFF_DELETE;
			}
			return diffs;
		}

		if ( shorttext.length === 1 ) {

			// Single character string.
			// After the previous speedup, the character can't be an equality.
			return [
				[ DIFF_DELETE, text1 ],
				[ DIFF_INSERT, text2 ]
			];
		}

		// Check to see if the problem can be split in two.
		hm = this.diffHalfMatch( text1, text2 );
		if ( hm ) {

			// A half-match was found, sort out the return data.
			text1A = hm[ 0 ];
			text1B = hm[ 1 ];
			text2A = hm[ 2 ];
			text2B = hm[ 3 ];
			midCommon = hm[ 4 ];

			// Send both pairs off for separate processing.
			diffsA = this.DiffMain( text1A, text2A, checklines, deadline );
			diffsB = this.DiffMain( text1B, text2B, checklines, deadline );

			// Merge the results.
			return diffsA.concat( [
				[ DIFF_EQUAL, midCommon ]
			], diffsB );
		}

		if ( checklines && text1.length > 100 && text2.length > 100 ) {
			return this.diffLineMode( text1, text2, deadline );
		}

		return this.diffBisect( text1, text2, deadline );
	};

	/**
	 * Do the two texts share a substring which is at least half the length of the
	 * longer text?
	 * This speedup can produce non-minimal diffs.
	 * @param {string} text1 First string.
	 * @param {string} text2 Second string.
	 * @return {Array.<string>} Five element Array, containing the prefix of
	 *     text1, the suffix of text1, the prefix of text2, the suffix of
	 *     text2 and the common middle.  Or null if there was no match.
	 * @private
	 */
	DiffMatchPatch.prototype.diffHalfMatch = function( text1, text2 ) {
		var longtext, shorttext, dmp,
			text1A, text2B, text2A, text1B, midCommon,
			hm1, hm2, hm;

		longtext = text1.length > text2.length ? text1 : text2;
		shorttext = text1.length > text2.length ? text2 : text1;
		if ( longtext.length < 4 || shorttext.length * 2 < longtext.length ) {
			return null; // Pointless.
		}
		dmp = this; // 'this' becomes 'window' in a closure.

		/**
		 * Does a substring of shorttext exist within longtext such that the substring
		 * is at least half the length of longtext?
		 * Closure, but does not reference any external variables.
		 * @param {string} longtext Longer string.
		 * @param {string} shorttext Shorter string.
		 * @param {number} i Start index of quarter length substring within longtext.
		 * @return {Array.<string>} Five element Array, containing the prefix of
		 *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
		 *     of shorttext and the common middle.  Or null if there was no match.
		 * @private
		 */
		function diffHalfMatchI( longtext, shorttext, i ) {
			var seed, j, bestCommon, prefixLength, suffixLength,
				bestLongtextA, bestLongtextB, bestShorttextA, bestShorttextB;

			// Start with a 1/4 length substring at position i as a seed.
			seed = longtext.substring( i, i + Math.floor( longtext.length / 4 ) );
			j = -1;
			bestCommon = "";
			while ( ( j = shorttext.indexOf( seed, j + 1 ) ) !== -1 ) {
				prefixLength = dmp.diffCommonPrefix( longtext.substring( i ),
					shorttext.substring( j ) );
				suffixLength = dmp.diffCommonSuffix( longtext.substring( 0, i ),
					shorttext.substring( 0, j ) );
				if ( bestCommon.length < suffixLength + prefixLength ) {
					bestCommon = shorttext.substring( j - suffixLength, j ) +
						shorttext.substring( j, j + prefixLength );
					bestLongtextA = longtext.substring( 0, i - suffixLength );
					bestLongtextB = longtext.substring( i + prefixLength );
					bestShorttextA = shorttext.substring( 0, j - suffixLength );
					bestShorttextB = shorttext.substring( j + prefixLength );
				}
			}
			if ( bestCommon.length * 2 >= longtext.length ) {
				return [ bestLongtextA, bestLongtextB,
					bestShorttextA, bestShorttextB, bestCommon
				];
			} else {
				return null;
			}
		}

		// First check if the second quarter is the seed for a half-match.
		hm1 = diffHalfMatchI( longtext, shorttext,
			Math.ceil( longtext.length / 4 ) );

		// Check again based on the third quarter.
		hm2 = diffHalfMatchI( longtext, shorttext,
			Math.ceil( longtext.length / 2 ) );
		if ( !hm1 && !hm2 ) {
			return null;
		} else if ( !hm2 ) {
			hm = hm1;
		} else if ( !hm1 ) {
			hm = hm2;
		} else {

			// Both matched.  Select the longest.
			hm = hm1[ 4 ].length > hm2[ 4 ].length ? hm1 : hm2;
		}

		// A half-match was found, sort out the return data.
		text1A, text1B, text2A, text2B;
		if ( text1.length > text2.length ) {
			text1A = hm[ 0 ];
			text1B = hm[ 1 ];
			text2A = hm[ 2 ];
			text2B = hm[ 3 ];
		} else {
			text2A = hm[ 0 ];
			text2B = hm[ 1 ];
			text1A = hm[ 2 ];
			text1B = hm[ 3 ];
		}
		midCommon = hm[ 4 ];
		return [ text1A, text1B, text2A, text2B, midCommon ];
	};

	/**
	 * Do a quick line-level diff on both strings, then rediff the parts for
	 * greater accuracy.
	 * This speedup can produce non-minimal diffs.
	 * @param {string} text1 Old string to be diffed.
	 * @param {string} text2 New string to be diffed.
	 * @param {number} deadline Time when the diff should be complete by.
	 * @return {!Array.<!DiffMatchPatch.Diff>} Array of diff tuples.
	 * @private
	 */
	DiffMatchPatch.prototype.diffLineMode = function( text1, text2, deadline ) {
		var a, diffs, linearray, pointer, countInsert,
			countDelete, textInsert, textDelete, j;

		// Scan the text on a line-by-line basis first.
		a = this.diffLinesToChars( text1, text2 );
		text1 = a.chars1;
		text2 = a.chars2;
		linearray = a.lineArray;

		diffs = this.DiffMain( text1, text2, false, deadline );

		// Convert the diff back to original text.
		this.diffCharsToLines( diffs, linearray );

		// Eliminate freak matches (e.g. blank lines)
		this.diffCleanupSemantic( diffs );

		// Rediff any replacement blocks, this time character-by-character.
		// Add a dummy entry at the end.
		diffs.push( [ DIFF_EQUAL, "" ] );
		pointer = 0;
		countDelete = 0;
		countInsert = 0;
		textDelete = "";
		textInsert = "";
		while ( pointer < diffs.length ) {
			switch ( diffs[ pointer ][ 0 ] ) {
			case DIFF_INSERT:
				countInsert++;
				textInsert += diffs[ pointer ][ 1 ];
				break;
			case DIFF_DELETE:
				countDelete++;
				textDelete += diffs[ pointer ][ 1 ];
				break;
			case DIFF_EQUAL:

				// Upon reaching an equality, check for prior redundancies.
				if ( countDelete >= 1 && countInsert >= 1 ) {

					// Delete the offending records and add the merged ones.
					diffs.splice( pointer - countDelete - countInsert,
						countDelete + countInsert );
					pointer = pointer - countDelete - countInsert;
					a = this.DiffMain( textDelete, textInsert, false, deadline );
					for ( j = a.length - 1; j >= 0; j-- ) {
						diffs.splice( pointer, 0, a[ j ] );
					}
					pointer = pointer + a.length;
				}
				countInsert = 0;
				countDelete = 0;
				textDelete = "";
				textInsert = "";
				break;
			}
			pointer++;
		}
		diffs.pop(); // Remove the dummy entry at the end.

		return diffs;
	};

	/**
	 * Find the 'middle snake' of a diff, split the problem in two
	 * and return the recursively constructed diff.
	 * See Myers 1986 paper: An O(ND) Difference Algorithm and Its Variations.
	 * @param {string} text1 Old string to be diffed.
	 * @param {string} text2 New string to be diffed.
	 * @param {number} deadline Time at which to bail if not yet complete.
	 * @return {!Array.<!DiffMatchPatch.Diff>} Array of diff tuples.
	 * @private
	 */
	DiffMatchPatch.prototype.diffBisect = function( text1, text2, deadline ) {
		var text1Length, text2Length, maxD, vOffset, vLength,
			v1, v2, x, delta, front, k1start, k1end, k2start,
			k2end, k2Offset, k1Offset, x1, x2, y1, y2, d, k1, k2;

		// Cache the text lengths to prevent multiple calls.
		text1Length = text1.length;
		text2Length = text2.length;
		maxD = Math.ceil( ( text1Length + text2Length ) / 2 );
		vOffset = maxD;
		vLength = 2 * maxD;
		v1 = new Array( vLength );
		v2 = new Array( vLength );

		// Setting all elements to -1 is faster in Chrome & Firefox than mixing
		// integers and undefined.
		for ( x = 0; x < vLength; x++ ) {
			v1[ x ] = -1;
			v2[ x ] = -1;
		}
		v1[ vOffset + 1 ] = 0;
		v2[ vOffset + 1 ] = 0;
		delta = text1Length - text2Length;

		// If the total number of characters is odd, then the front path will collide
		// with the reverse path.
		front = ( delta % 2 !== 0 );

		// Offsets for start and end of k loop.
		// Prevents mapping of space beyond the grid.
		k1start = 0;
		k1end = 0;
		k2start = 0;
		k2end = 0;
		for ( d = 0; d < maxD; d++ ) {

			// Bail out if deadline is reached.
			if ( ( new Date() ).getTime() > deadline ) {
				break;
			}

			// Walk the front path one step.
			for ( k1 = -d + k1start; k1 <= d - k1end; k1 += 2 ) {
				k1Offset = vOffset + k1;
				if ( k1 === -d || ( k1 !== d && v1[ k1Offset - 1 ] < v1[ k1Offset + 1 ] ) ) {
					x1 = v1[ k1Offset + 1 ];
				} else {
					x1 = v1[ k1Offset - 1 ] + 1;
				}
				y1 = x1 - k1;
				while ( x1 < text1Length && y1 < text2Length &&
					text1.charAt( x1 ) === text2.charAt( y1 ) ) {
					x1++;
					y1++;
				}
				v1[ k1Offset ] = x1;
				if ( x1 > text1Length ) {

					// Ran off the right of the graph.
					k1end += 2;
				} else if ( y1 > text2Length ) {

					// Ran off the bottom of the graph.
					k1start += 2;
				} else if ( front ) {
					k2Offset = vOffset + delta - k1;
					if ( k2Offset >= 0 && k2Offset < vLength && v2[ k2Offset ] !== -1 ) {

						// Mirror x2 onto top-left coordinate system.
						x2 = text1Length - v2[ k2Offset ];
						if ( x1 >= x2 ) {

							// Overlap detected.
							return this.diffBisectSplit( text1, text2, x1, y1, deadline );
						}
					}
				}
			}

			// Walk the reverse path one step.
			for ( k2 = -d + k2start; k2 <= d - k2end; k2 += 2 ) {
				k2Offset = vOffset + k2;
				if ( k2 === -d || ( k2 !== d && v2[ k2Offset - 1 ] < v2[ k2Offset + 1 ] ) ) {
					x2 = v2[ k2Offset + 1 ];
				} else {
					x2 = v2[ k2Offset - 1 ] + 1;
				}
				y2 = x2 - k2;
				while ( x2 < text1Length && y2 < text2Length &&
					text1.charAt( text1Length - x2 - 1 ) ===
					text2.charAt( text2Length - y2 - 1 ) ) {
					x2++;
					y2++;
				}
				v2[ k2Offset ] = x2;
				if ( x2 > text1Length ) {

					// Ran off the left of the graph.
					k2end += 2;
				} else if ( y2 > text2Length ) {

					// Ran off the top of the graph.
					k2start += 2;
				} else if ( !front ) {
					k1Offset = vOffset + delta - k2;
					if ( k1Offset >= 0 && k1Offset < vLength && v1[ k1Offset ] !== -1 ) {
						x1 = v1[ k1Offset ];
						y1 = vOffset + x1 - k1Offset;

						// Mirror x2 onto top-left coordinate system.
						x2 = text1Length - x2;
						if ( x1 >= x2 ) {

							// Overlap detected.
							return this.diffBisectSplit( text1, text2, x1, y1, deadline );
						}
					}
				}
			}
		}

		// Diff took too long and hit the deadline or
		// number of diffs equals number of characters, no commonality at all.
		return [
			[ DIFF_DELETE, text1 ],
			[ DIFF_INSERT, text2 ]
		];
	};

	/**
	 * Given the location of the 'middle snake', split the diff in two parts
	 * and recurse.
	 * @param {string} text1 Old string to be diffed.
	 * @param {string} text2 New string to be diffed.
	 * @param {number} x Index of split point in text1.
	 * @param {number} y Index of split point in text2.
	 * @param {number} deadline Time at which to bail if not yet complete.
	 * @return {!Array.<!DiffMatchPatch.Diff>} Array of diff tuples.
	 * @private
	 */
	DiffMatchPatch.prototype.diffBisectSplit = function( text1, text2, x, y, deadline ) {
		var text1a, text1b, text2a, text2b, diffs, diffsb;
		text1a = text1.substring( 0, x );
		text2a = text2.substring( 0, y );
		text1b = text1.substring( x );
		text2b = text2.substring( y );

		// Compute both diffs serially.
		diffs = this.DiffMain( text1a, text2a, false, deadline );
		diffsb = this.DiffMain( text1b, text2b, false, deadline );

		return diffs.concat( diffsb );
	};

	/**
	 * Reduce the number of edits by eliminating semantically trivial equalities.
	 * @param {!Array.<!DiffMatchPatch.Diff>} diffs Array of diff tuples.
	 */
	DiffMatchPatch.prototype.diffCleanupSemantic = function( diffs ) {
		var changes, equalities, equalitiesLength, lastequality,
			pointer, lengthInsertions2, lengthDeletions2, lengthInsertions1,
			lengthDeletions1, deletion, insertion, overlapLength1, overlapLength2;
		changes = false;
		equalities = []; // Stack of indices where equalities are found.
		equalitiesLength = 0; // Keeping our own length var is faster in JS.
		/** @type {?string} */
		lastequality = null;

		// Always equal to diffs[equalities[equalitiesLength - 1]][1]
		pointer = 0; // Index of current position.

		// Number of characters that changed prior to the equality.
		lengthInsertions1 = 0;
		lengthDeletions1 = 0;

		// Number of characters that changed after the equality.
		lengthInsertions2 = 0;
		lengthDeletions2 = 0;
		while ( pointer < diffs.length ) {
			if ( diffs[ pointer ][ 0 ] === DIFF_EQUAL ) { // Equality found.
				equalities[ equalitiesLength++ ] = pointer;
				lengthInsertions1 = lengthInsertions2;
				lengthDeletions1 = lengthDeletions2;
				lengthInsertions2 = 0;
				lengthDeletions2 = 0;
				lastequality = diffs[ pointer ][ 1 ];
			} else { // An insertion or deletion.
				if ( diffs[ pointer ][ 0 ] === DIFF_INSERT ) {
					lengthInsertions2 += diffs[ pointer ][ 1 ].length;
				} else {
					lengthDeletions2 += diffs[ pointer ][ 1 ].length;
				}

				// Eliminate an equality that is smaller or equal to the edits on both
				// sides of it.
				if ( lastequality && ( lastequality.length <=
						Math.max( lengthInsertions1, lengthDeletions1 ) ) &&
						( lastequality.length <= Math.max( lengthInsertions2,
							lengthDeletions2 ) ) ) {

					// Duplicate record.
					diffs.splice(
						equalities[ equalitiesLength - 1 ],
						0,
						[ DIFF_DELETE, lastequality ]
					);

					// Change second copy to insert.
					diffs[ equalities[ equalitiesLength - 1 ] + 1 ][ 0 ] = DIFF_INSERT;

					// Throw away the equality we just deleted.
					equalitiesLength--;

					// Throw away the previous equality (it needs to be reevaluated).
					equalitiesLength--;
					pointer = equalitiesLength > 0 ? equalities[ equalitiesLength - 1 ] : -1;

					// Reset the counters.
					lengthInsertions1 = 0;
					lengthDeletions1 = 0;
					lengthInsertions2 = 0;
					lengthDeletions2 = 0;
					lastequality = null;
					changes = true;
				}
			}
			pointer++;
		}

		// Normalize the diff.
		if ( changes ) {
			this.diffCleanupMerge( diffs );
		}

		// Find any overlaps between deletions and insertions.
		// e.g: <del>abcxxx</del><ins>xxxdef</ins>
		//   -> <del>abc</del>xxx<ins>def</ins>
		// e.g: <del>xxxabc</del><ins>defxxx</ins>
		//   -> <ins>def</ins>xxx<del>abc</del>
		// Only extract an overlap if it is as big as the edit ahead or behind it.
		pointer = 1;
		while ( pointer < diffs.length ) {
			if ( diffs[ pointer - 1 ][ 0 ] === DIFF_DELETE &&
					diffs[ pointer ][ 0 ] === DIFF_INSERT ) {
				deletion = diffs[ pointer - 1 ][ 1 ];
				insertion = diffs[ pointer ][ 1 ];
				overlapLength1 = this.diffCommonOverlap( deletion, insertion );
				overlapLength2 = this.diffCommonOverlap( insertion, deletion );
				if ( overlapLength1 >= overlapLength2 ) {
					if ( overlapLength1 >= deletion.length / 2 ||
							overlapLength1 >= insertion.length / 2 ) {

						// Overlap found.  Insert an equality and trim the surrounding edits.
						diffs.splice(
							pointer,
							0,
							[ DIFF_EQUAL, insertion.substring( 0, overlapLength1 ) ]
						);
						diffs[ pointer - 1 ][ 1 ] =
							deletion.substring( 0, deletion.length - overlapLength1 );
						diffs[ pointer + 1 ][ 1 ] = insertion.substring( overlapLength1 );
						pointer++;
					}
				} else {
					if ( overlapLength2 >= deletion.length / 2 ||
							overlapLength2 >= insertion.length / 2 ) {

						// Reverse overlap found.
						// Insert an equality and swap and trim the surrounding edits.
						diffs.splice(
							pointer,
							0,
							[ DIFF_EQUAL, deletion.substring( 0, overlapLength2 ) ]
						);

						diffs[ pointer - 1 ][ 0 ] = DIFF_INSERT;
						diffs[ pointer - 1 ][ 1 ] =
							insertion.substring( 0, insertion.length - overlapLength2 );
						diffs[ pointer + 1 ][ 0 ] = DIFF_DELETE;
						diffs[ pointer + 1 ][ 1 ] =
							deletion.substring( overlapLength2 );
						pointer++;
					}
				}
				pointer++;
			}
			pointer++;
		}
	};

	/**
	 * Determine if the suffix of one string is the prefix of another.
	 * @param {string} text1 First string.
	 * @param {string} text2 Second string.
	 * @return {number} The number of characters common to the end of the first
	 *     string and the start of the second string.
	 * @private
	 */
	DiffMatchPatch.prototype.diffCommonOverlap = function( text1, text2 ) {
		var text1Length, text2Length, textLength,
			best, length, pattern, found;

		// Cache the text lengths to prevent multiple calls.
		text1Length = text1.length;
		text2Length = text2.length;

		// Eliminate the null case.
		if ( text1Length === 0 || text2Length === 0 ) {
			return 0;
		}

		// Truncate the longer string.
		if ( text1Length > text2Length ) {
			text1 = text1.substring( text1Length - text2Length );
		} else if ( text1Length < text2Length ) {
			text2 = text2.substring( 0, text1Length );
		}
		textLength = Math.min( text1Length, text2Length );

		// Quick check for the worst case.
		if ( text1 === text2 ) {
			return textLength;
		}

		// Start by looking for a single character match
		// and increase length until no match is found.
		// Performance analysis: https://neil.fraser.name/news/2010/11/04/
		best = 0;
		length = 1;
		while ( true ) {
			pattern = text1.substring( textLength - length );
			found = text2.indexOf( pattern );
			if ( found === -1 ) {
				return best;
			}
			length += found;
			if ( found === 0 || text1.substring( textLength - length ) ===
					text2.substring( 0, length ) ) {
				best = length;
				length++;
			}
		}
	};

	/**
	 * Split two texts into an array of strings.  Reduce the texts to a string of
	 * hashes where each Unicode character represents one line.
	 * @param {string} text1 First string.
	 * @param {string} text2 Second string.
	 * @return {{chars1: string, chars2: string, lineArray: !Array.<string>}}
	 *     An object containing the encoded text1, the encoded text2 and
	 *     the array of unique strings.
	 *     The zeroth element of the array of unique strings is intentionally blank.
	 * @private
	 */
	DiffMatchPatch.prototype.diffLinesToChars = function( text1, text2 ) {
		var lineArray, lineHash, chars1, chars2;
		lineArray = []; // E.g. lineArray[4] === 'Hello\n'
		lineHash = {};  // E.g. lineHash['Hello\n'] === 4

		// '\x00' is a valid character, but various debuggers don't like it.
		// So we'll insert a junk entry to avoid generating a null character.
		lineArray[ 0 ] = "";

		/**
		 * Split a text into an array of strings.  Reduce the texts to a string of
		 * hashes where each Unicode character represents one line.
		 * Modifies linearray and linehash through being a closure.
		 * @param {string} text String to encode.
		 * @return {string} Encoded string.
		 * @private
		 */
		function diffLinesToCharsMunge( text ) {
			var chars, lineStart, lineEnd, lineArrayLength, line;
			chars = "";

			// Walk the text, pulling out a substring for each line.
			// text.split('\n') would would temporarily double our memory footprint.
			// Modifying text would create many large strings to garbage collect.
			lineStart = 0;
			lineEnd = -1;

			// Keeping our own length variable is faster than looking it up.
			lineArrayLength = lineArray.length;
			while ( lineEnd < text.length - 1 ) {
				lineEnd = text.indexOf( "\n", lineStart );
				if ( lineEnd === -1 ) {
					lineEnd = text.length - 1;
				}
				line = text.substring( lineStart, lineEnd + 1 );
				lineStart = lineEnd + 1;

				if ( lineHash.hasOwnProperty ? lineHash.hasOwnProperty( line ) :
							( lineHash[ line ] !== undefined ) ) {
					chars += String.fromCharCode( lineHash[ line ] );
				} else {
					chars += String.fromCharCode( lineArrayLength );
					lineHash[ line ] = lineArrayLength;
					lineArray[ lineArrayLength++ ] = line;
				}
			}
			return chars;
		}

		chars1 = diffLinesToCharsMunge( text1 );
		chars2 = diffLinesToCharsMunge( text2 );
		return {
			chars1: chars1,
			chars2: chars2,
			lineArray: lineArray
		};
	};

	/**
	 * Rehydrate the text in a diff from a string of line hashes to real lines of
	 * text.
	 * @param {!Array.<!DiffMatchPatch.Diff>} diffs Array of diff tuples.
	 * @param {!Array.<string>} lineArray Array of unique strings.
	 * @private
	 */
	DiffMatchPatch.prototype.diffCharsToLines = function( diffs, lineArray ) {
		var x, chars, text, y;
		for ( x = 0; x < diffs.length; x++ ) {
			chars = diffs[ x ][ 1 ];
			text = [];
			for ( y = 0; y < chars.length; y++ ) {
				text[ y ] = lineArray[ chars.charCodeAt( y ) ];
			}
			diffs[ x ][ 1 ] = text.join( "" );
		}
	};

	/**
	 * Reorder and merge like edit sections.  Merge equalities.
	 * Any edit section can move as long as it doesn't cross an equality.
	 * @param {!Array.<!DiffMatchPatch.Diff>} diffs Array of diff tuples.
	 */
	DiffMatchPatch.prototype.diffCleanupMerge = function( diffs ) {
		var pointer, countDelete, countInsert, textInsert, textDelete,
			commonlength, changes, diffPointer, position;
		diffs.push( [ DIFF_EQUAL, "" ] ); // Add a dummy entry at the end.
		pointer = 0;
		countDelete = 0;
		countInsert = 0;
		textDelete = "";
		textInsert = "";
		commonlength;
		while ( pointer < diffs.length ) {
			switch ( diffs[ pointer ][ 0 ] ) {
			case DIFF_INSERT:
				countInsert++;
				textInsert += diffs[ pointer ][ 1 ];
				pointer++;
				break;
			case DIFF_DELETE:
				countDelete++;
				textDelete += diffs[ pointer ][ 1 ];
				pointer++;
				break;
			case DIFF_EQUAL:

				// Upon reaching an equality, check for prior redundancies.
				if ( countDelete + countInsert > 1 ) {
					if ( countDelete !== 0 && countInsert !== 0 ) {

						// Factor out any common prefixes.
						commonlength = this.diffCommonPrefix( textInsert, textDelete );
						if ( commonlength !== 0 ) {
							if ( ( pointer - countDelete - countInsert ) > 0 &&
									diffs[ pointer - countDelete - countInsert - 1 ][ 0 ] ===
									DIFF_EQUAL ) {
								diffs[ pointer - countDelete - countInsert - 1 ][ 1 ] +=
									textInsert.substring( 0, commonlength );
							} else {
								diffs.splice( 0, 0, [ DIFF_EQUAL,
									textInsert.substring( 0, commonlength )
								] );
								pointer++;
							}
							textInsert = textInsert.substring( commonlength );
							textDelete = textDelete.substring( commonlength );
						}

						// Factor out any common suffixies.
						commonlength = this.diffCommonSuffix( textInsert, textDelete );
						if ( commonlength !== 0 ) {
							diffs[ pointer ][ 1 ] = textInsert.substring( textInsert.length -
									commonlength ) + diffs[ pointer ][ 1 ];
							textInsert = textInsert.substring( 0, textInsert.length -
								commonlength );
							textDelete = textDelete.substring( 0, textDelete.length -
								commonlength );
						}
					}

					// Delete the offending records and add the merged ones.
					if ( countDelete === 0 ) {
						diffs.splice( pointer - countInsert,
							countDelete + countInsert, [ DIFF_INSERT, textInsert ] );
					} else if ( countInsert === 0 ) {
						diffs.splice( pointer - countDelete,
							countDelete + countInsert, [ DIFF_DELETE, textDelete ] );
					} else {
						diffs.splice(
							pointer - countDelete - countInsert,
							countDelete + countInsert,
							[ DIFF_DELETE, textDelete ], [ DIFF_INSERT, textInsert ]
						);
					}
					pointer = pointer - countDelete - countInsert +
						( countDelete ? 1 : 0 ) + ( countInsert ? 1 : 0 ) + 1;
				} else if ( pointer !== 0 && diffs[ pointer - 1 ][ 0 ] === DIFF_EQUAL ) {

					// Merge this equality with the previous one.
					diffs[ pointer - 1 ][ 1 ] += diffs[ pointer ][ 1 ];
					diffs.splice( pointer, 1 );
				} else {
					pointer++;
				}
				countInsert = 0;
				countDelete = 0;
				textDelete = "";
				textInsert = "";
				break;
			}
		}
		if ( diffs[ diffs.length - 1 ][ 1 ] === "" ) {
			diffs.pop(); // Remove the dummy entry at the end.
		}

		// Second pass: look for single edits surrounded on both sides by equalities
		// which can be shifted sideways to eliminate an equality.
		// e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
		changes = false;
		pointer = 1;

		// Intentionally ignore the first and last element (don't need checking).
		while ( pointer < diffs.length - 1 ) {
			if ( diffs[ pointer - 1 ][ 0 ] === DIFF_EQUAL &&
					diffs[ pointer + 1 ][ 0 ] === DIFF_EQUAL ) {

				diffPointer = diffs[ pointer ][ 1 ];
				position = diffPointer.substring(
					diffPointer.length - diffs[ pointer - 1 ][ 1 ].length
				);

				// This is a single edit surrounded by equalities.
				if ( position === diffs[ pointer - 1 ][ 1 ] ) {

					// Shift the edit over the previous equality.
					diffs[ pointer ][ 1 ] = diffs[ pointer - 1 ][ 1 ] +
						diffs[ pointer ][ 1 ].substring( 0, diffs[ pointer ][ 1 ].length -
							diffs[ pointer - 1 ][ 1 ].length );
					diffs[ pointer + 1 ][ 1 ] =
						diffs[ pointer - 1 ][ 1 ] + diffs[ pointer + 1 ][ 1 ];
					diffs.splice( pointer - 1, 1 );
					changes = true;
				} else if ( diffPointer.substring( 0, diffs[ pointer + 1 ][ 1 ].length ) ===
						diffs[ pointer + 1 ][ 1 ] ) {

					// Shift the edit over the next equality.
					diffs[ pointer - 1 ][ 1 ] += diffs[ pointer + 1 ][ 1 ];
					diffs[ pointer ][ 1 ] =
						diffs[ pointer ][ 1 ].substring( diffs[ pointer + 1 ][ 1 ].length ) +
						diffs[ pointer + 1 ][ 1 ];
					diffs.splice( pointer + 1, 1 );
					changes = true;
				}
			}
			pointer++;
		}

		// If shifts were made, the diff needs reordering and another shift sweep.
		if ( changes ) {
			this.diffCleanupMerge( diffs );
		}
	};

	return function( o, n ) {
		var diff, output, text;
		diff = new DiffMatchPatch();
		output = diff.DiffMain( o, n );
		diff.diffCleanupEfficiency( output );
		text = diff.diffPrettyHtml( output );

		return text;
	};
}() );

}() );

},{}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{"./aggregator.js":5,"./compiler.js":7,"incremental-dom/dist/incremental-dom.js":1}],7:[function(require,module,exports){
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
        return ['IncrementalDOM.text(' + this.text(elem.textContent) + ')'];
      } else if (elem.nodeType === Node.COMMENT_NODE) {
        // Ignore comment node
        return [];
      }

      var tagName = elem.tagName.toLowerCase();

      // process `sj-if`
      {
        var cond = elem.getAttribute('sj-if');
        if (cond) {
          var body = [';'];
          body.push('if (' + cond + ') {');
          body.push('IncrementalDOM.elementOpenStart("' + tagName + '")');
          body = body.concat(this.renderAttributes(elem, vars));
          body.push('IncrementalDOM.elementOpenEnd("' + tagName + '")');

          body = body.concat(this.renderBody(elem, vars));

          body.push('IncrementalDOM.elementClose("' + tagName + '")');

          body.push('}');
          return body;
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
            // varName in container
            var varName = m[1];
            var container = m[4];

            var body = [';'];
            body.push('IncrementalDOM.elementOpenStart("' + tagName + '")');
            body = body.concat(this.renderAttributes(elem, vars));
            body.push('IncrementalDOM.elementOpenEnd("' + tagName + '")');

            body.push('(function(IncrementalDOM) {\nvar $$container=' + container + ';\nfor (var $index=0,$l=$$container.length; $index<$l; $index++) {\nvar ' + varName + '=$$container[$index];');

            body = body.concat(this.renderBody(elem, vars.concat([varName, '$index'])));

            body.push('}\n}).apply(this, [IncrementalDOM]);');
            body.push('IncrementalDOM.elementClose("' + tagName + '")');

            return body;
          } else {
            // (keyName, varName) in container
            var keyName = m[2];
            var valueName = m[3];
            var _container = m[4];
            var body = [';'];
            body.push('IncrementalDOM.elementOpenStart("' + tagName + '")');
            body = body.concat(this.renderAttributes(elem, vars));
            body.push('IncrementalDOM.elementOpenEnd("' + tagName + '")');
            body.push('(function(IncrementalDOM) {\nvar $$container=' + _container + ';for (var ' + keyName + ' in $$container) {\nvar ' + valueName + '=$$container[' + keyName + '];');
            body = body.concat(this.renderBody(elem, vars.concat([keyName, valueName])));
            body.push('}\n}).apply(this, [IncrementalDOM]);');
            body.push('IncrementalDOM.elementClose("' + tagName + '")');
            return body;
          }
        }
      }

      // process attributes
      var body = [';'];
      body.push('IncrementalDOM.elementOpenStart("' + tagName + '")');
      body = body.concat(this.renderAttributes(elem, vars));
      body.push('IncrementalDOM.elementOpenEnd("' + tagName + '")');
      body = body.concat(this.renderBody(elem, vars));
      body.push('IncrementalDOM.elementClose("' + tagName + '")');

      return body;
    }
  }, {
    key: 'renderBody',
    value: function renderBody(elem, vars) {
      var body = [];
      var bind = elem.getAttribute('sj-bind');
      var tagName = elem.tagName.toLowerCase();
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
      return body;
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

},{"incremental-dom/dist/incremental-dom.js":1}],8:[function(require,module,exports){
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

var scopes = {};
var compiled = {};

var Element = function (_HTMLElement2) {
  _inherits(Element, _HTMLElement2);

  function Element() {
    _classCallCheck(this, Element);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Element).apply(this, arguments));
  }

  _createClass(Element, [{
    key: 'createdCallback',
    value: function createdCallback() {
      console.log("CREATED " + this.tagName);
      if (!scopes[this.tagName]) {
        // parse template
        var template = this.template();
        if (!template) {
          throw 'template shouldn\'t be null';
        }

        var html = document.createElement("div");
        html.innerHTML = template;

        scopes[this.tagName] = this.default();
        new Aggregator(html).aggregate(scopes[this.tagName]);
        compiled[this.tagName] = new Compiler().compile(html);
      }

      var def = {};

      // overwrite by scope values
      var scope = scopes[this.tagName];
      for (var key in scope) {
        if (scope.hasOwnProperty(key)) {
          def[key] = scope[key];
        }
      }

      //  // overwrite by attribute values
      //  const attrs = this.attributes;
      //  for (let i = 0, l = attrs.length; i < l; ++i) {
      //    const attr = attrs[i];
      //    if (attr.name.substr(0, 8) !== 'sj-attr-') {
      //      def[attr.name] = attr.value;
      //    }
      //  }

      // and set to tag attributes
      console.trace("SETTING VALUES");
      console.log(def);
      for (var _key in def) {
        if (def.hasOwnProperty(_key)) {
          this[_key] = def[_key];
        }
      }

      this.initialize();

      this.update();
    }
  }, {
    key: 'default',
    value: function _default() {
      return {};
    }
  }, {
    key: 'template',
    value: function template() {
      throw "Please implement 'template' method";
    }
  }, {
    key: 'attributeChangedCallback',
    value: function attributeChangedCallback(key) {
      console.log('SET ATTRIBUTE: ' + key);
      this[key] = this.getAttribute(key);
      this.update();
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

      console.log("UPDATE");
      IncrementalDOM.patch(this, function () {
        compiled[_this2.tagName].apply(_this2, [IncrementalDOM]);
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

},{"./aggregator.js":5,"./compiler.js":7,"incremental-dom/dist/incremental-dom.js":1}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{"./app.js":6,"./element.js":8,"./fire-event.js":9,"./polyfill.js":11,"./tag.js":12,"webcomponents.js/CustomElements.js":3,"whatwg-fetch/fetch.js":4}],11:[function(require,module,exports){
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

},{"webcomponents.js/CustomElements.js":3}],12:[function(require,module,exports){
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
var Element = require('./element.js');

var unwrapComment = /\/\*!?(?:\@preserve)?[ \t]*(?:\r\n|\n)([\s\S]*?)(?:\r\n|\n)\s*\*\//;

var knownOpts = ['template', 'accessors', 'default', 'events', 'initialize', 'methods'];
var knownOptMap = {};
knownOpts.forEach(function (e) {
  knownOptMap[e] = e;
});

function tag(tagName, opts) {
  for (var key in opts) {
    if (!knownOptMap[key]) {
      throw 'Unknown options for sj.tag: ' + tagName + ':' + key + '(Known keys: ' + knownOpts + ')';
    }
  }

  var _template = void 0;

  var elementClass = function (_Element) {
    _inherits(elementClass, _Element);

    function elementClass() {
      _classCallCheck(this, elementClass);

      return _possibleConstructorReturn(this, Object.getPrototypeOf(elementClass).apply(this, arguments));
    }

    _createClass(elementClass, [{
      key: 'template',
      value: function template() {
        if (!_template) {
          if (typeof opts.template === 'function') {
            _template = unwrapComment.exec(opts.template.toString())[1];
          } else {
            _template = opts.template;
          }
        }
        return _template;
      }
    }, {
      key: 'default',
      value: function _default() {
        return opts.default || {};
      }
    }, {
      key: 'initialize',
      value: function initialize() {
        // set event listeners
        if (opts.events) {
          for (var event in opts.events) {
            this.addEventListener(event, opts.events[event].bind(this));
          }
        }
        if (opts.initialize) {
          opts.initialize.apply(this);
        }
      }
    }]);

    return elementClass;
  }(Element);

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

},{"./aggregator.js":5,"./compiler":7,"./element.js":8,"incremental-dom/dist/incremental-dom.js":1}],13:[function(require,module,exports){
'use strict';

require('./test-compile.js');
require('./test-suite.js');
require('./test-aggregator.js');
require('./test-element.js');

},{"./test-aggregator.js":14,"./test-compile.js":15,"./test-element.js":16,"./test-suite.js":17}],14:[function(require,module,exports){
'use strict';

var test = require('qunitjs').test;
var Aggregator = require('../src/aggregator');

test('input', function (t) {
  var div = document.createElement('div');
  div.innerHTML = '<input sj-model="this.hoge" value="iyan">';
  var scope = {};
  new Aggregator(div).aggregate(scope);
  t.deepEqual(scope, {
    hoge: 'iyan'
  });
});

test('input(checkbox)', function (t) {
  var div = document.createElement('div');
  div.innerHTML = '\n  <input type="checkbox" sj-model="this.a" checked="checked">\n  <input type="checkbox" sj-model="this.b">\n  ';
  var scope = {};
  new Aggregator(div).aggregate(scope);
  t.deepEqual(scope, {
    a: true,
    b: false
  });
});

test('input(empty)', function (t) {
  var div = document.createElement('div');
  div.innerHTML = '<input sj-model="this.hoge" value="">';
  var scope = {};
  new Aggregator(div).aggregate(scope);
  t.deepEqual(scope, {
    hoge: ''
  });
});

test('input(repeat)', function (t) {
  var div = document.createElement('div');
  div.innerHTML = '\n  <div sj-repeat="item in this.items">\n    <input sj-model="item.hoge" value="">\n  </div>';
  var scope = {};
  new Aggregator(div).aggregate(scope);
  t.deepEqual(scope, {});
});

test('textarea', function (t) {
  var div = document.createElement('div');
  div.innerHTML = '<textarea sj-model="this.hoge">iyan</textarea>';
  var scope = {};
  new Aggregator(div).aggregate(scope);
  t.deepEqual(scope, {
    hoge: 'iyan'
  });
});

test('select', function (t) {
  var div = document.createElement('div');
  div.innerHTML = '<select sj-model="this.hoge"><option value="iyan" checked>iyan</option></select>';
  var scope = {};
  new Aggregator(div).aggregate(scope);
  t.deepEqual(scope, {
    hoge: 'iyan'
  });
});

},{"../src/aggregator":5,"qunitjs":2}],15:[function(require,module,exports){
'use strict';

// var test = require('tape');

var test = require('qunitjs').test;
var Compiler = require('../src/compiler');
var IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');

test('foo', function (t) {
  console.log("AH");
  var div = document.createElement('div');
  div.innerHTML = '<div id="foo"></div>';
  var code = new Compiler().compile(div);
  var target = document.createElement('target');
  target.update = function () {};
  IncrementalDOM.patch(target, function () {
    code.apply(target, [IncrementalDOM]);
  });
  t.equal(target.querySelector('div').getAttribute('id'), 'foo');
});
test('sj-if', function (t) {
  var div = document.createElement('div');
  div.innerHTML = '\n    <div id="foo" sj-if="this.foo"></div>\n    <div id="bar" sj-if="this.bar"></div>\n  ';
  var code = new Compiler().compile(div);
  var target = document.createElement('target');
  target.update = function () {};
  target.foo = true;
  IncrementalDOM.patch(target, function () {
    code.apply(target, [IncrementalDOM]);
  });
  t.ok(target.querySelector('#foo'));
  t.ok(!target.querySelector('#bar'));
});
test('sj-repeat', function (t) {
  var div = document.createElement('div');
  div.innerHTML = '\n    <div sj-repeat="book in this.books" class="outer">\n      <div class="book" sj-bind="book.name"></div>\n    </div>\n  ';
  var code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () {};
  target.books = [{ name: 'hoge' }, { name: 'fuga' }];

  IncrementalDOM.patch(target, function () {
    code.apply(target, [IncrementalDOM]);
  });

  console.log(target.innerHTML);

  var books = target.querySelectorAll('.book');
  t.equal(books.length, 2);
  t.equal(target.querySelectorAll('.outer').length, 1);
});
test('sj-repeat array kv', function (t) {
  var div = document.createElement('div');
  div.innerHTML = '\n    <div sj-repeat="(i,book) in this.books">\n      <div class="book"><span sj-bind="i"></span>:<span sj-bind="book.name"></span></div>\n    </div>\n  ';
  var code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () {};
  target.books = [{ name: 'hoge' }, { name: 'fuga' }];

  IncrementalDOM.patch(target, function () {
    code.apply(target, [IncrementalDOM]);
  });

  var books = target.querySelectorAll('.book');
  t.equal(books.length, 2);
  t.equal(books[0].textContent, '0:hoge');
  t.equal(books[1].textContent, '1:fuga');
});
test('sj-repeat(object)', function (t) {
  var div = document.createElement('div');
  div.innerHTML = '\n    <div sj-repeat="(x,y) in this.obj">\n      <div class="item" sj-click="this.result.push(x)"><span sj-bind="x"></span>:<span sj-bind="y"></span></div>\n    </div>\n  ';
  var code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () {};
  target.obj = {
    a: 'b',
    c: 'd'
  };
  target.result = [];

  IncrementalDOM.patch(target, function () {
    code.apply(target, [IncrementalDOM]);
  });

  var items = target.querySelectorAll('.item');
  t.equal(items.length, 2);

  for (var i = 0; i < items.length; i++) {
    items[i].click();
  }
  t.deepEqual(target.result, ['a', 'c']);
});
test('sj-click', function (t) {
  var div = document.createElement('div');
  div.innerHTML = '\n    <div sj-click="this.called = true"></div>\n  ';
  var code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () {};
  target.books = [{ name: 'hoge' }, { name: 'fuga' }];

  IncrementalDOM.patch(target, function () {
    code.apply(target, [IncrementalDOM]);
  });

  target.querySelector('div').click();

  t.ok(target.called);
});
test('sj-disabled', function (t) {
  var div = document.createElement('div');
  div.innerHTML = '\n    <div class="t" sj-disabled="true"></div>\n    <div class="f" sj-disabled="false"></div>\n  ';
  var code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () {};

  IncrementalDOM.patch(target, function () {
    code.apply(target, [IncrementalDOM]);
  });

  t.equal(target.querySelector('.t').getAttribute('disabled'), 'disabled');
  t.ok(!target.querySelector('.f').getAttribute('disabled'));
});
test('sj-bind', function (t) {
  var div = document.createElement('div');
  div.innerHTML = '\n    <div sj-bind="this.foo"></div>\n  ';
  var code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () {};
  target.foo = 'foo';

  IncrementalDOM.patch(target, function () {
    code.apply(target, [IncrementalDOM]);
  });

  t.ok(target.innerHTML.match(/foo/));
});
test('nested for', function (t) {
  var div = document.createElement('div');
  div.innerHTML = '\n    <div sj-repeat="blog in this.blogs">\n      <div sj-repeat="entry in blog.entries">\n        <div class="book"><span sj-bind="entry.title"></span>:<span sj-bind="$index"></span></div>\n      </div>\n    </div>\n  ';
  var code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () {};
  target.blogs = [{ entries: [{ title: 'hoge' }, { title: 'hige' }] }, { entries: [{ title: 'fuga' }, { title: 'figa' }] }];

  IncrementalDOM.patch(target, function () {
    code.apply(target, [IncrementalDOM]);
  });

  t.ok(target.innerHTML.match(/hoge/));
  t.ok(target.innerHTML.match(/fuga/));
});
test('nested for', function (t) {
  var div = document.createElement('div');
  div.innerHTML = '\n    <div sj-repeat="blog in this.blogs">\n      <div sj-repeat="entry in blog.entries">\n        <div class="book" sj-click="this.result.push($index)"><span sj-bind="entry.title"></span>:<span sj-bind="$index"></span></div>\n      </div>\n    </div>\n  ';
  var code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () {};
  target.blogs = [{ entries: [{ title: 'hoge' }, { title: 'hige' }] }, { entries: [{ title: 'fuga' }, { title: 'figa' }] }];
  target.result = [];

  IncrementalDOM.patch(target, function () {
    code.apply(target, [IncrementalDOM]);
  });
  var books = target.querySelectorAll('.book');
  for (var i = 0; i < books.length; i++) {
    books[i].click();
  }
  t.deepEqual(target.result, [0, 1, 0, 1]);
});
test('text', function (t) {
  var compiler = new Compiler();
  var s = ["\n", '"'];
  for (var i = 0, l = s.length; i < l; i++) {
    var m = s[i];
    t.equal(eval(compiler.text(m)), m);
  }
});
test('sj-class', function (t) {
  var div = document.createElement('div');
  div.innerHTML = '\n    <div sj-class=\'this.klass\'>\n    </div>\n  ';
  var code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () {};
  target.klass = ['a', 'b'];

  IncrementalDOM.patch(target, function () {
    code.apply(target, [IncrementalDOM]);
  });

  var got = target.querySelector('div');
  t.deepEqual(got.getAttribute('class'), 'a b');
});

},{"../src/compiler":7,"incremental-dom/dist/incremental-dom.js":1,"qunitjs":2}],16:[function(require,module,exports){
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

var test = require('qunitjs').test;
var Element = require('../src/element.js');
require('../src/polyfill.js');

test('es6', function (t) {
  customElements.define('test-es6', function (_Element) {
    _inherits(_class, _Element);

    function _class() {
      _classCallCheck(this, _class);

      return _possibleConstructorReturn(this, Object.getPrototypeOf(_class).apply(this, arguments));
    }

    _createClass(_class, [{
      key: 'template',
      value: function template() {
        return '<input type="text" sj-model="this.filter" value="hoge">';
      }
    }]);

    return _class;
  }(Element));

  var elem = document.createElement('test-es6');
  t.equal(elem.filter, 'hoge');
});

},{"../src/element.js":8,"../src/polyfill.js":11,"qunitjs":2}],17:[function(require,module,exports){
'use strict';

var test = require('qunitjs').test;
var sj = require('../src/main.js');

function runTest(tagName, elementClass, code) {
  test(tagName, function (t) {
    var elem = document.createElement(tagName);
    code.apply(elem, [t, tagName]);
  });
}

// simulate onchange event
// http://stackoverflow.com/questions/2856513/how-can-i-trigger-an-onchange-event-manually
function invokeEvent(elem, name) {
  if ("createEvent" in document) {
    var evt = document.createEvent("HTMLEvents");
    evt.initEvent(name, false, true);
    elem.dispatchEvent(evt);
  } else {
    elem.fireEvent('on' + name);
  }
}

test('export', function (t) {
  t.ok(sj.tag, 'sj.tag');
  t.ok(sj.Element, 'sj.Element');
});

runTest('test-input-value', sj.tag('test-input-value', {
  template: function template() {/*
                                     <input type="text" sj-model="this.filter" value="hoge">
                                 */}
}), function (t, tagName) {
  var input = this.querySelector('input');

  t.equal(input.value, 'hoge', 'input.value');
  t.equal(this.filter, 'hoge', tagName);
});

runTest('test-disabled', sj.tag('test-disabled', {
  template: function template() {/*
                                 <div sj-disabled="this.f">f</div>
                                 <div sj-disabled="this.t">t</div>
                                 */},
  initialize: function initialize() {
    this.t = true;
    this.f = false;
  }
}), function (t, tagName) {
  var divs = this.querySelectorAll('div');
  t.ok(divs.length == 2, tagName);
  t.ok(!divs[0].getAttribute('disabled'), tagName);
  t.ok(divs[1].getAttribute('disabled') === 'disabled', tagName);
});

// regression test
runTest('test-multi-attributes', sj.tag('test-multi-attributes', {
  template: function template() {/*
                                 <div class="b" sj-repeat="x in this.books">
                                 <div class='book'><span sj-bind="x.name"></span></div>
                                 </div>
                                 */},
  initialize: function initialize() {
    this.books = [{ "name": "foo" }, { "name": "bar" }];
  }
}), function (t, tagName) {
  t.equal(this.querySelectorAll('div.book').length, 2, tagName);
});

runTest('test-events', sj.tag('test-events', {
  template: function template() {/*
                                     <button id="clickTest" sj-click="this.btnclick($event)">yay</button>
                                     */},
  methods: {
    btnclick: function btnclick() {
      this.clicked = true;
    }
  }
}), function (t) {
  var elem = this.querySelector("#clickTest");
  elem.click();

  t.ok(!!this.clicked);
});

runTest('test-set-attrs', sj.tag('test-set-attrs', {
  template: '<div sj-bind="this.foo"></div>'
}), function (t, tagName) {
  this.setAttribute('foo', 'bar');
  t.equal(this.querySelector('div').textContent, 'bar');
});

runTest('test-input', sj.tag('test-input', {
  template: function template() {/*
                                    <h1>Input</h1>
                                    <input type="text" name="name" sj-model="this.name" id="myInput">
                                    Hello, <span sj-bind="this.name"></span>
                                    */}
}), function (t, tagName) {
  var input = this.querySelector('input');
  input.value = 'foo';

  invokeEvent(input, 'input');

  t.ok(this.querySelector('span').textContent === "foo", tagName);
});

runTest('test-input-checkbox', sj.tag('test-input-checkbox', {
  template: function template() {/*
                                    <input class='a' type="checkbox" sj-model="this.a">
                                    <input type="checkbox" sj-model="this.b">
                                    */}
}), function (t, tagName) {
  var a = this.querySelector('.a');
  a.checked = true;

  invokeEvent(a, 'change');

  t.equal(this.a, true, 'this.a is checked');
  t.equal(this.b, false);
});

runTest('test-input-nested', sj.tag('test-input-nested', {
  template: function template() {/*
                                 <h1>Input</h1>
                                 <input type="text" name="name" sj-model="this.x.y" id="myInput">
                                 Hello, <span sj-model="this.name"></span>
                                 */},
  default: {
    x: {}
  },
  initialize: function initialize() {
    this.x = {
      y: 3
    };
  }
}), function (t, tagName) {
  var input = this.querySelector('input');
  input.value = 'foo';

  invokeEvent(input, 'input');

  t.ok(this.x.y === 'foo', tagName);
});

runTest('test-textarea', sj.tag('test-textarea', {
  template: function template() {/*
                                 <h1>Textarea</h1>
                                 <textarea name="hoge" sj-model="this.hoge"></textarea>
                                 Hello, <span sj-bind="this.hoge"></span>
                                 */}
}), function (t, tagName) {
  var input = this.querySelector('textarea');
  input.value = "foo";
  invokeEvent(input, 'input');

  t.ok(this.querySelector('span').textContent === "foo", tagName);
});

runTest('test-from-controller', sj.tag('test-from-controller', {
  initialize: function initialize() {
    this.hogehoge = "foo";
  },
  template: function template() {/*
                                 <h1>Passed from controller</h1>
                                 <input type="text" name="bar" sj-model="this.hogehoge">
                                 */}
}), function (t, tagName) {
  t.ok(this.querySelector('input').value === "foo", tagName);
});

runTest('test-select', sj.tag('test-select', {
  template: function template() {/*
                                 <h1>Select</h1>
                                 <select sj-model="this.sss">
                                 <option value="ppp">ppp</option>
                                 <option value="qqq">qqq</option>
                                 </select>
                                 SSS: <span sj-bind="this.sss"></span>
                                 */}
}), function (t, tagName) {
  t.equal(this.querySelector('span').textContent, "ppp");
});

runTest('test-for', sj.tag('test-for', {
  template: function template() {/*
                                 <h1>bar</h1>
                                 <div sj-repeat="x in this.bar">
                                 <div class="item" sj-bind="x.boo"></div>
                                 </div>
                                 */},
  initialize: function initialize() {
    this.bar = [{ boo: 4649 }, { boo: 1 }, { boo: 2 }, { boo: 3 }];
  }
}), function (t, tagName) {
  var elems = this.querySelectorAll('div.item');
  t.ok(elems.length == 4 && elems[0].textContent == "4649" && elems[1].textContent === '1' && elems[2].textContent === '2' && elems[3].textContent === '3', tagName);
});

runTest('test-for-index', sj.tag('test-for-index', {
  template: function template() {/*
                                 <h1>For index</h1>
                                 <div sj-repeat="x in this.bar">
                                 <div class="item"><span sj-bind="x.boo"></span>:<span sj-bind="$index"></span></div>
                                 </div>
                                 */},
  initialize: function initialize() {
    this.bar = [{ boo: 4649 }, { boo: 1 }, { boo: 2 }, { boo: 3 }];
  }
}), function (t, tagName) {
  var elems = this.querySelectorAll('div.item');
  t.ok(elems.length == 4 && elems[0].textContent == "4649:0" && elems[1].textContent === '1:1' && elems[2].textContent === '2:2' && elems[3].textContent === '3:3', tagName);
});

runTest('test-for-empty', sj.tag('test-for-empty', {
  template: function template() {/*
                                 <h1>sj-repeat with empty value</h1>
                                 <div sj-repeat="x in this.bar">
                                 <div class="item" sj-model="x.boo">replace here</div>
                                 </div>
                                 */},
  initialize: function initialize() {
    this.bar = [];
  }
}), function (t, tagName) {
  var elems = this.querySelectorAll('div.item');
  t.ok(elems.length == 0, tagName);
});

runTest('test-if', sj.tag('test-if', {
  template: function template() {/*
                                 <h1>Test if</h1>
                                 <div sj-if="this.getFalse()">FALSE</div>
                                 <div sj-if="this.getTrue()">TRUE</div>
                                 */},
  methods: {
    getTrue: function getTrue() {
      return true;
    },
    getFalse: function getFalse() {
      return false;
    }
  }
}), function (t, tagName) {
  var elems = this.querySelectorAll('div');
  t.ok(elems.length == 1 && elems[0].textContent === 'TRUE', tagName);
});

runTest('test-if-array', sj.tag('test-if-array', {
  template: function template() {/*
                                 return `
                                 <h1>Test if</h1>
                                 <div sj-repeat="x in this.bar">
                                 <div sj-if="this.matched(x)" class="target" sj-bind="x.foo"></div>
                                 </div>
                                 */},
  initialize: function initialize() {
    this.bar = [{ "foo": 1 }];
  },
  methods: {
    matched: function matched(x) {
      return x.foo == 1;
    }
  }
}), function (t, tagName) {
  var elems = this.querySelectorAll('div.target');
  t.ok(elems.length === 1 && elems[0].textContent === '1', tagName);
});

runTest('test-text-var', sj.tag('test-text-var', {
  template: function template() {/*
                                 <h1>Test text var</h1>
                                 <div>Hello, <span sj-bind="this.name"></span></div>
                                 */},
  initialize: function initialize() {
    this.name = 'John';
  }
}), function (t, tagName) {
  var elem = this.querySelector('div');
  t.ok(elem.textContent === 'Hello, John', tagName);
});

runTest('test-filter', sj.tag('test-filter', {
  template: function template() {/*
                                 <h1>Test filter</h1>
                                 <div sj-if="this.filter(this.x.y)">Hello</div>
                                 <div sj-if="this.filter(this.x.z)">Hi</div>
                                 */},
  initialize: function initialize() {
    this.x = {
      y: true,
      z: false
    };
    this.filter = function (e) {
      return e;
    };
  }
}), function (t, tagName) {
  var elems = this.querySelectorAll('div');
  t.ok(elems.length === 1 && elems[0].textContent === 'Hello', tagName);
});

runTest('test-comment', sj.tag('test-comment', {
  template: function template() {/*
                                 <h1>Test comment</h1>
                                 <!-- foo -->
                                 */}
}), function (t, tagName) {
  t.ok(this.querySelector('h1'), tagName);
});

runTest('test-sanitize-href', sj.tag('test-sanitize-href', {
  template: function template() {/*
                                    <a class='unsafe' sj-href="this.href"></a>
                                    <a class='unsafe2' sj-href="'jscript:alert(3)'"></a>
                                    <a class='unsafe3' sj-href="'view-source:alert(3)'"></a>
                                    <a class='safe' sj-href="'http://example.com'"></a>
                                 */},
  default: {
    'href': 'javascript:this.x=3',
    x: 5
  }
}), function (t, tagName) {
  t.equal(this.querySelector('a.unsafe').getAttribute('href'), 'unsafe:javascript:this.x=3');
  t.equal(this.querySelector('a.unsafe2').getAttribute('href'), 'unsafe:jscript:alert(3)');
  t.equal(this.querySelector('a.unsafe3').getAttribute('href'), 'unsafe:view-source:alert(3)');
  t.equal(this.querySelector('a.safe').getAttribute('href'), 'http://example.com');
});

runTest('test-bind', sj.tag('test-bind', {
  template: function template() {/*
                                    <span sj-bind="this.text"></span>
                                 */},
  default: {
    'text': '<xmp>hoge'
  }
}), function (t, tagName) {
  console.log(this.outerHTML);
  t.ok(this.querySelector('span').outerHTML.match(/\&lt;xmp&gt;hoge/));
});

runTest('test-sj-attr', sj.tag('test-sj-attr', {
  template: function template() {/*
                                    <span sj-attr-data-foo="5963"></span>
                                 */}
}), function (t, tagName) {
  t.equal(this.querySelector('span').getAttribute('data-foo'), '5963');
});

runTest('test-fireEvent', sj.tag('test-fireevent', {
  template: function template() {/*
                                    <div></div>
                                 */},
  events: {
    foo: function foo($event) {
      this.gotEvent = $event.detail;
    }
  }
}), function (t, tagName) {
  sj.fireEvent(this, 'foo', {
    detail: { hello: 'nick' }
  });
  t.deepEqual(this.gotEvent, { hello: 'nick' });
});

},{"../src/main.js":10,"qunitjs":2}]},{},[13])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5jcmVtZW50YWwtZG9tL2Rpc3QvaW5jcmVtZW50YWwtZG9tLmpzIiwibm9kZV9tb2R1bGVzL3F1bml0anMvcXVuaXQvcXVuaXQuanMiLCJub2RlX21vZHVsZXMvd2ViY29tcG9uZW50cy5qcy9DdXN0b21FbGVtZW50cy5qcyIsIm5vZGVfbW9kdWxlcy93aGF0d2ctZmV0Y2gvZmV0Y2guanMiLCJzcmMvYWdncmVnYXRvci5qcyIsInNyYy9hcHAuanMiLCJzcmMvY29tcGlsZXIuanMiLCJzcmMvZWxlbWVudC5qcyIsInNyYy9maXJlLWV2ZW50LmpzIiwic3JjL21haW4uanMiLCJzcmMvcG9seWZpbGwuanMiLCJzcmMvdGFnLmpzIiwidGVzdC9hbGwuanMiLCJ0ZXN0L3Rlc3QtYWdncmVnYXRvci5qcyIsInRlc3QvdGVzdC1jb21waWxlLmpzIiwidGVzdC90ZXN0LWVsZW1lbnQuanMiLCJ0ZXN0L3Rlc3Qtc3VpdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDampDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuMElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwZ0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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RCxBQUNQO0FBTHFDLEFBQ3ZDLENBRG1CLEdBT2pCLFVBQUEsQUFBVSxHQUFWLEFBQWEsU0FBUyxBQUN4QjtVQUFBLEFBQVEsSUFBSSxLQUFaLEFBQWlCLEFBQ2pCO0lBQUEsQUFBRSxHQUFHLEtBQUEsQUFBSyxjQUFMLEFBQW1CLFFBQW5CLEFBQTJCLFVBQTNCLEFBQXFDLE1BQTFDLEFBQUssQUFBMkMsQUFDakQ7QUFWRDs7QUFZQSxRQUFBLEFBQVEsbUJBQWdCLEFBQUcsSUFBSCxBQUFPO1lBQ25CLG9CLEFBQVksQUFFbkI7O21DQUhMLEFBQXdCLEFBQXVCO0FBQUEsQUFDN0MsQ0FEc0IsR0FJcEIsVUFBQSxBQUFVLEdBQVYsQUFBYSxTQUFTLEFBQ3hCO0lBQUEsQUFBRSxNQUFNLEtBQUEsQUFBSyxjQUFMLEFBQW1CLFFBQW5CLEFBQTJCLGFBQW5DLEFBQVEsQUFBd0MsYUFBaEQsQUFBNkQsQUFDOUQ7QUFORDs7QUFRQSxRQUFBLEFBQVEscUJBQWtCLEFBQUcsSUFBSCxBQUFPO1lBQ3JCLG9CLEFBQVksQUFFbkI7O21DQUg4QyxBQUlqRDs7U0FDTyxhQUFBLEFBQVUsUUFBUSxBQUNyQjtXQUFBLEFBQUssV0FBVyxPQUFoQixBQUF1QixBQUN4QjtBQVBMLEFBQTBCLEFBQXlCLEFBSXpDO0FBQUEsQUFDTjtBQUwrQyxBQUNqRCxDQUR3QixHQVN0QixVQUFBLEFBQVUsR0FBVixBQUFhLFNBQVMsQUFDeEI7S0FBQSxBQUFHLFVBQUgsQUFBYSxNQUFiLEFBQW1CO1lBQ1QsRUFBQyxPQURYLEFBQTBCLEFBQ2hCLEFBQVEsQUFFbEI7QUFIMEIsQUFDeEI7SUFFRixBQUFFLFVBQVUsS0FBWixBQUFpQixVQUFVLEVBQUMsT0FBNUIsQUFBMkIsQUFBUSxBQUNwQztBQWREIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxuLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gZmFjdG9yeShleHBvcnRzKSA6XG4gIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShbJ2V4cG9ydHMnXSwgZmFjdG9yeSkgOlxuICAoZmFjdG9yeSgoZ2xvYmFsLkluY3JlbWVudGFsRE9NID0ge30pKSk7XG59KHRoaXMsIGZ1bmN0aW9uIChleHBvcnRzKSB7ICd1c2Ugc3RyaWN0JztcblxuICAvKipcbiAgICogQ29weXJpZ2h0IDIwMTUgVGhlIEluY3JlbWVudGFsIERPTSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICAgKlxuICAgKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICAgKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gICAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICAgKlxuICAgKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICAgKlxuICAgKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gICAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbiAgICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gICAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBBIGNhY2hlZCByZWZlcmVuY2UgdG8gdGhlIGhhc093blByb3BlcnR5IGZ1bmN0aW9uLlxuICAgKi9cbiAgdmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuICAvKipcbiAgICogQSBjYWNoZWQgcmVmZXJlbmNlIHRvIHRoZSBjcmVhdGUgZnVuY3Rpb24uXG4gICAqL1xuICB2YXIgY3JlYXRlID0gT2JqZWN0LmNyZWF0ZTtcblxuICAvKipcbiAgICogVXNlZCB0byBwcmV2ZW50IHByb3BlcnR5IGNvbGxpc2lvbnMgYmV0d2VlbiBvdXIgXCJtYXBcIiBhbmQgaXRzIHByb3RvdHlwZS5cbiAgICogQHBhcmFtIHshT2JqZWN0PHN0cmluZywgKj59IG1hcCBUaGUgbWFwIHRvIGNoZWNrLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHkgVGhlIHByb3BlcnR5IHRvIGNoZWNrLlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIG1hcCBoYXMgcHJvcGVydHkuXG4gICAqL1xuICB2YXIgaGFzID0gZnVuY3Rpb24gKG1hcCwgcHJvcGVydHkpIHtcbiAgICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChtYXAsIHByb3BlcnR5KTtcbiAgfTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBtYXAgb2JqZWN0IHdpdGhvdXQgYSBwcm90b3R5cGUuXG4gICAqIEByZXR1cm4geyFPYmplY3R9XG4gICAqL1xuICB2YXIgY3JlYXRlTWFwID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBjcmVhdGUobnVsbCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRyYWNrIG9mIGluZm9ybWF0aW9uIG5lZWRlZCB0byBwZXJmb3JtIGRpZmZzIGZvciBhIGdpdmVuIERPTSBub2RlLlxuICAgKiBAcGFyYW0geyFzdHJpbmd9IG5vZGVOYW1lXG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleVxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGZ1bmN0aW9uIE5vZGVEYXRhKG5vZGVOYW1lLCBrZXkpIHtcbiAgICAvKipcbiAgICAgKiBUaGUgYXR0cmlidXRlcyBhbmQgdGhlaXIgdmFsdWVzLlxuICAgICAqIEBjb25zdCB7IU9iamVjdDxzdHJpbmcsICo+fVxuICAgICAqL1xuICAgIHRoaXMuYXR0cnMgPSBjcmVhdGVNYXAoKTtcblxuICAgIC8qKlxuICAgICAqIEFuIGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIHBhaXJzLCB1c2VkIGZvciBxdWlja2x5IGRpZmZpbmcgdGhlXG4gICAgICogaW5jb21taW5nIGF0dHJpYnV0ZXMgdG8gc2VlIGlmIHRoZSBET00gbm9kZSdzIGF0dHJpYnV0ZXMgbmVlZCB0byBiZVxuICAgICAqIHVwZGF0ZWQuXG4gICAgICogQGNvbnN0IHtBcnJheTwqPn1cbiAgICAgKi9cbiAgICB0aGlzLmF0dHJzQXJyID0gW107XG5cbiAgICAvKipcbiAgICAgKiBUaGUgaW5jb21pbmcgYXR0cmlidXRlcyBmb3IgdGhpcyBOb2RlLCBiZWZvcmUgdGhleSBhcmUgdXBkYXRlZC5cbiAgICAgKiBAY29uc3QgeyFPYmplY3Q8c3RyaW5nLCAqPn1cbiAgICAgKi9cbiAgICB0aGlzLm5ld0F0dHJzID0gY3JlYXRlTWFwKCk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBub2RlLCB1c2VkIHRvIHByZXNlcnZlIERPTSBub2RlcyB3aGVuIHRoZXlcbiAgICAgKiBtb3ZlIHdpdGhpbiB0aGVpciBwYXJlbnQuXG4gICAgICogQGNvbnN0XG4gICAgICovXG4gICAgdGhpcy5rZXkgPSBrZXk7XG5cbiAgICAvKipcbiAgICAgKiBLZWVwcyB0cmFjayBvZiBjaGlsZHJlbiB3aXRoaW4gdGhpcyBub2RlIGJ5IHRoZWlyIGtleS5cbiAgICAgKiB7P09iamVjdDxzdHJpbmcsICFFbGVtZW50Pn1cbiAgICAgKi9cbiAgICB0aGlzLmtleU1hcCA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUga2V5TWFwIGlzIGN1cnJlbnRseSB2YWxpZC5cbiAgICAgKiB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICB0aGlzLmtleU1hcFZhbGlkID0gdHJ1ZTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBub2RlIG5hbWUgZm9yIHRoaXMgbm9kZS5cbiAgICAgKiBAY29uc3Qge3N0cmluZ31cbiAgICAgKi9cbiAgICB0aGlzLm5vZGVOYW1lID0gbm9kZU5hbWU7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7P3N0cmluZ31cbiAgICAgKi9cbiAgICB0aGlzLnRleHQgPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgTm9kZURhdGEgb2JqZWN0IGZvciBhIE5vZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgbm9kZSB0byBpbml0aWFsaXplIGRhdGEgZm9yLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZU5hbWUgVGhlIG5vZGUgbmFtZSBvZiBub2RlLlxuICAgKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB0aGF0IGlkZW50aWZpZXMgdGhlIG5vZGUuXG4gICAqIEByZXR1cm4geyFOb2RlRGF0YX0gVGhlIG5ld2x5IGluaXRpYWxpemVkIGRhdGEgb2JqZWN0XG4gICAqL1xuICB2YXIgaW5pdERhdGEgPSBmdW5jdGlvbiAobm9kZSwgbm9kZU5hbWUsIGtleSkge1xuICAgIHZhciBkYXRhID0gbmV3IE5vZGVEYXRhKG5vZGVOYW1lLCBrZXkpO1xuICAgIG5vZGVbJ19faW5jcmVtZW50YWxET01EYXRhJ10gPSBkYXRhO1xuICAgIHJldHVybiBkYXRhO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIE5vZGVEYXRhIG9iamVjdCBmb3IgYSBOb2RlLCBjcmVhdGluZyBpdCBpZiBuZWNlc3NhcnkuXG4gICAqXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgbm9kZSB0byByZXRyaWV2ZSB0aGUgZGF0YSBmb3IuXG4gICAqIEByZXR1cm4geyFOb2RlRGF0YX0gVGhlIE5vZGVEYXRhIGZvciB0aGlzIE5vZGUuXG4gICAqL1xuICB2YXIgZ2V0RGF0YSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgdmFyIGRhdGEgPSBub2RlWydfX2luY3JlbWVudGFsRE9NRGF0YSddO1xuXG4gICAgaWYgKCFkYXRhKSB7XG4gICAgICB2YXIgbm9kZU5hbWUgPSBub2RlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICB2YXIga2V5ID0gbnVsbDtcblxuICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICAgIGtleSA9IG5vZGUuZ2V0QXR0cmlidXRlKCdrZXknKTtcbiAgICAgIH1cblxuICAgICAgZGF0YSA9IGluaXREYXRhKG5vZGUsIG5vZGVOYW1lLCBrZXkpO1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gICAqXG4gICAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gICAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAgICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gICAqXG4gICAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gICAqXG4gICAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAgICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICAgKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAgICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICAgKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAgICovXG5cbiAgLyoqIEBjb25zdCAqL1xuICB2YXIgc3ltYm9scyA9IHtcbiAgICBkZWZhdWx0OiAnX19kZWZhdWx0JyxcblxuICAgIHBsYWNlaG9sZGVyOiAnX19wbGFjZWhvbGRlcidcbiAgfTtcblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICogQHJldHVybiB7c3RyaW5nfHVuZGVmaW5lZH0gVGhlIG5hbWVzcGFjZSB0byB1c2UgZm9yIHRoZSBhdHRyaWJ1dGUuXG4gICAqL1xuICB2YXIgZ2V0TmFtZXNwYWNlID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBpZiAobmFtZS5sYXN0SW5kZXhPZigneG1sOicsIDApID09PSAwKSB7XG4gICAgICByZXR1cm4gJ2h0dHA6Ly93d3cudzMub3JnL1hNTC8xOTk4L25hbWVzcGFjZSc7XG4gICAgfVxuXG4gICAgaWYgKG5hbWUubGFzdEluZGV4T2YoJ3hsaW5rOicsIDApID09PSAwKSB7XG4gICAgICByZXR1cm4gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQXBwbGllcyBhbiBhdHRyaWJ1dGUgb3IgcHJvcGVydHkgdG8gYSBnaXZlbiBFbGVtZW50LiBJZiB0aGUgdmFsdWUgaXMgbnVsbFxuICAgKiBvciB1bmRlZmluZWQsIGl0IGlzIHJlbW92ZWQgZnJvbSB0aGUgRWxlbWVudC4gT3RoZXJ3aXNlLCB0aGUgdmFsdWUgaXMgc2V0XG4gICAqIGFzIGFuIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gICAqIEBwYXJhbSB7Pyhib29sZWFufG51bWJlcnxzdHJpbmcpPX0gdmFsdWUgVGhlIGF0dHJpYnV0ZSdzIHZhbHVlLlxuICAgKi9cbiAgdmFyIGFwcGx5QXR0ciA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYXR0ck5TID0gZ2V0TmFtZXNwYWNlKG5hbWUpO1xuICAgICAgaWYgKGF0dHJOUykge1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGVOUyhhdHRyTlMsIG5hbWUsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGEgcHJvcGVydHkgdG8gYSBnaXZlbiBFbGVtZW50LlxuICAgKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgcHJvcGVydHkncyBuYW1lLlxuICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBwcm9wZXJ0eSdzIHZhbHVlLlxuICAgKi9cbiAgdmFyIGFwcGx5UHJvcCA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgICBlbFtuYW1lXSA9IHZhbHVlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGEgc3R5bGUgdG8gYW4gRWxlbWVudC4gTm8gdmVuZG9yIHByZWZpeCBleHBhbnNpb24gaXMgZG9uZSBmb3JcbiAgICogcHJvcGVydHkgbmFtZXMvdmFsdWVzLlxuICAgKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAgICogQHBhcmFtIHsqfSBzdHlsZSBUaGUgc3R5bGUgdG8gc2V0LiBFaXRoZXIgYSBzdHJpbmcgb2YgY3NzIG9yIGFuIG9iamVjdFxuICAgKiAgICAgY29udGFpbmluZyBwcm9wZXJ0eS12YWx1ZSBwYWlycy5cbiAgICovXG4gIHZhciBhcHBseVN0eWxlID0gZnVuY3Rpb24gKGVsLCBuYW1lLCBzdHlsZSkge1xuICAgIGlmICh0eXBlb2Ygc3R5bGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbC5zdHlsZS5jc3NUZXh0ID0gc3R5bGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsLnN0eWxlLmNzc1RleHQgPSAnJztcbiAgICAgIHZhciBlbFN0eWxlID0gZWwuc3R5bGU7XG4gICAgICB2YXIgb2JqID0gLyoqIEB0eXBlIHshT2JqZWN0PHN0cmluZyxzdHJpbmc+fSAqL3N0eWxlO1xuXG4gICAgICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgICAgICBpZiAoaGFzKG9iaiwgcHJvcCkpIHtcbiAgICAgICAgICBlbFN0eWxlW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBVcGRhdGVzIGEgc2luZ2xlIGF0dHJpYnV0ZSBvbiBhbiBFbGVtZW50LlxuICAgKiBAcGFyYW0geyFFbGVtZW50fSBlbFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlJ3MgbmFtZS5cbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgYXR0cmlidXRlJ3MgdmFsdWUuIElmIHRoZSB2YWx1ZSBpcyBhbiBvYmplY3Qgb3JcbiAgICogICAgIGZ1bmN0aW9uIGl0IGlzIHNldCBvbiB0aGUgRWxlbWVudCwgb3RoZXJ3aXNlLCBpdCBpcyBzZXQgYXMgYW4gSFRNTFxuICAgKiAgICAgYXR0cmlidXRlLlxuICAgKi9cbiAgdmFyIGFwcGx5QXR0cmlidXRlVHlwZWQgPSBmdW5jdGlvbiAoZWwsIG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG5cbiAgICBpZiAodHlwZSA9PT0gJ29iamVjdCcgfHwgdHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgYXBwbHlQcm9wKGVsLCBuYW1lLCB2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFwcGx5QXR0cihlbCwgbmFtZSwgLyoqIEB0eXBlIHs/KGJvb2xlYW58bnVtYmVyfHN0cmluZyl9ICovdmFsdWUpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQ2FsbHMgdGhlIGFwcHJvcHJpYXRlIGF0dHJpYnV0ZSBtdXRhdG9yIGZvciB0aGlzIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIHshRWxlbWVudH0gZWxcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSdzIG5hbWUuXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIGF0dHJpYnV0ZSdzIHZhbHVlLlxuICAgKi9cbiAgdmFyIHVwZGF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgICB2YXIgZGF0YSA9IGdldERhdGEoZWwpO1xuICAgIHZhciBhdHRycyA9IGRhdGEuYXR0cnM7XG5cbiAgICBpZiAoYXR0cnNbbmFtZV0gPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIG11dGF0b3IgPSBhdHRyaWJ1dGVzW25hbWVdIHx8IGF0dHJpYnV0ZXNbc3ltYm9scy5kZWZhdWx0XTtcbiAgICBtdXRhdG9yKGVsLCBuYW1lLCB2YWx1ZSk7XG5cbiAgICBhdHRyc1tuYW1lXSA9IHZhbHVlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBIHB1YmxpY2x5IG11dGFibGUgb2JqZWN0IHRvIHByb3ZpZGUgY3VzdG9tIG11dGF0b3JzIGZvciBhdHRyaWJ1dGVzLlxuICAgKiBAY29uc3QgeyFPYmplY3Q8c3RyaW5nLCBmdW5jdGlvbighRWxlbWVudCwgc3RyaW5nLCAqKT59XG4gICAqL1xuICB2YXIgYXR0cmlidXRlcyA9IGNyZWF0ZU1hcCgpO1xuXG4gIC8vIFNwZWNpYWwgZ2VuZXJpYyBtdXRhdG9yIHRoYXQncyBjYWxsZWQgZm9yIGFueSBhdHRyaWJ1dGUgdGhhdCBkb2VzIG5vdFxuICAvLyBoYXZlIGEgc3BlY2lmaWMgbXV0YXRvci5cbiAgYXR0cmlidXRlc1tzeW1ib2xzLmRlZmF1bHRdID0gYXBwbHlBdHRyaWJ1dGVUeXBlZDtcblxuICBhdHRyaWJ1dGVzW3N5bWJvbHMucGxhY2Vob2xkZXJdID0gZnVuY3Rpb24gKCkge307XG5cbiAgYXR0cmlidXRlc1snc3R5bGUnXSA9IGFwcGx5U3R5bGU7XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG5hbWVzcGFjZSB0byBjcmVhdGUgYW4gZWxlbWVudCAob2YgYSBnaXZlbiB0YWcpIGluLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSB0YWcgdG8gZ2V0IHRoZSBuYW1lc3BhY2UgZm9yLlxuICAgKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnRcbiAgICogQHJldHVybiB7P3N0cmluZ30gVGhlIG5hbWVzcGFjZSB0byBjcmVhdGUgdGhlIHRhZyBpbi5cbiAgICovXG4gIHZhciBnZXROYW1lc3BhY2VGb3JUYWcgPSBmdW5jdGlvbiAodGFnLCBwYXJlbnQpIHtcbiAgICBpZiAodGFnID09PSAnc3ZnJykge1xuICAgICAgcmV0dXJuICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG4gICAgfVxuXG4gICAgaWYgKGdldERhdGEocGFyZW50KS5ub2RlTmFtZSA9PT0gJ2ZvcmVpZ25PYmplY3QnKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFyZW50Lm5hbWVzcGFjZVVSSTtcbiAgfTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBFbGVtZW50LlxuICAgKiBAcGFyYW0ge0RvY3VtZW50fSBkb2MgVGhlIGRvY3VtZW50IHdpdGggd2hpY2ggdG8gY3JlYXRlIHRoZSBFbGVtZW50LlxuICAgKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgdGFnIGZvciB0aGUgRWxlbWVudC5cbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IEEga2V5IHRvIGlkZW50aWZ5IHRoZSBFbGVtZW50LlxuICAgKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gICAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuXG4gICAqIEByZXR1cm4geyFFbGVtZW50fVxuICAgKi9cbiAgdmFyIGNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbiAoZG9jLCBwYXJlbnQsIHRhZywga2V5LCBzdGF0aWNzKSB7XG4gICAgdmFyIG5hbWVzcGFjZSA9IGdldE5hbWVzcGFjZUZvclRhZyh0YWcsIHBhcmVudCk7XG4gICAgdmFyIGVsID0gdW5kZWZpbmVkO1xuXG4gICAgaWYgKG5hbWVzcGFjZSkge1xuICAgICAgZWwgPSBkb2MuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgdGFnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWwgPSBkb2MuY3JlYXRlRWxlbWVudCh0YWcpO1xuICAgIH1cblxuICAgIGluaXREYXRhKGVsLCB0YWcsIGtleSk7XG5cbiAgICBpZiAoc3RhdGljcykge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGF0aWNzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgIHVwZGF0ZUF0dHJpYnV0ZShlbCwgLyoqIEB0eXBlIHshc3RyaW5nfSovc3RhdGljc1tpXSwgc3RhdGljc1tpICsgMV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBlbDtcbiAgfTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFRleHQgTm9kZS5cbiAgICogQHBhcmFtIHtEb2N1bWVudH0gZG9jIFRoZSBkb2N1bWVudCB3aXRoIHdoaWNoIHRvIGNyZWF0ZSB0aGUgRWxlbWVudC5cbiAgICogQHJldHVybiB7IVRleHR9XG4gICAqL1xuICB2YXIgY3JlYXRlVGV4dCA9IGZ1bmN0aW9uIChkb2MpIHtcbiAgICB2YXIgbm9kZSA9IGRvYy5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gICAgaW5pdERhdGEobm9kZSwgJyN0ZXh0JywgbnVsbCk7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH07XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBtYXBwaW5nIHRoYXQgY2FuIGJlIHVzZWQgdG8gbG9vayB1cCBjaGlsZHJlbiB1c2luZyBhIGtleS5cbiAgICogQHBhcmFtIHs/Tm9kZX0gZWxcbiAgICogQHJldHVybiB7IU9iamVjdDxzdHJpbmcsICFFbGVtZW50Pn0gQSBtYXBwaW5nIG9mIGtleXMgdG8gdGhlIGNoaWxkcmVuIG9mIHRoZVxuICAgKiAgICAgRWxlbWVudC5cbiAgICovXG4gIHZhciBjcmVhdGVLZXlNYXAgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICB2YXIgbWFwID0gY3JlYXRlTWFwKCk7XG4gICAgdmFyIGNoaWxkID0gZWwuZmlyc3RFbGVtZW50Q2hpbGQ7XG5cbiAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgIHZhciBrZXkgPSBnZXREYXRhKGNoaWxkKS5rZXk7XG5cbiAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgbWFwW2tleV0gPSBjaGlsZDtcbiAgICAgIH1cblxuICAgICAgY2hpbGQgPSBjaGlsZC5uZXh0RWxlbWVudFNpYmxpbmc7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hcDtcbiAgfTtcblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBtYXBwaW5nIG9mIGtleSB0byBjaGlsZCBub2RlIGZvciBhIGdpdmVuIEVsZW1lbnQsIGNyZWF0aW5nIGl0XG4gICAqIGlmIG5lY2Vzc2FyeS5cbiAgICogQHBhcmFtIHs/Tm9kZX0gZWxcbiAgICogQHJldHVybiB7IU9iamVjdDxzdHJpbmcsICFOb2RlPn0gQSBtYXBwaW5nIG9mIGtleXMgdG8gY2hpbGQgRWxlbWVudHNcbiAgICovXG4gIHZhciBnZXRLZXlNYXAgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICB2YXIgZGF0YSA9IGdldERhdGEoZWwpO1xuXG4gICAgaWYgKCFkYXRhLmtleU1hcCkge1xuICAgICAgZGF0YS5rZXlNYXAgPSBjcmVhdGVLZXlNYXAoZWwpO1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhLmtleU1hcDtcbiAgfTtcblxuICAvKipcbiAgICogUmV0cmlldmVzIGEgY2hpbGQgZnJvbSB0aGUgcGFyZW50IHdpdGggdGhlIGdpdmVuIGtleS5cbiAgICogQHBhcmFtIHs/Tm9kZX0gcGFyZW50XG4gICAqIEBwYXJhbSB7P3N0cmluZz19IGtleVxuICAgKiBAcmV0dXJuIHs/Tm9kZX0gVGhlIGNoaWxkIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGtleS5cbiAgICovXG4gIHZhciBnZXRDaGlsZCA9IGZ1bmN0aW9uIChwYXJlbnQsIGtleSkge1xuICAgIHJldHVybiBrZXkgPyBnZXRLZXlNYXAocGFyZW50KVtrZXldIDogbnVsbDtcbiAgfTtcblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGFuIGVsZW1lbnQgYXMgYmVpbmcgYSBjaGlsZC4gVGhlIHBhcmVudCB3aWxsIGtlZXAgdHJhY2sgb2YgdGhlXG4gICAqIGNoaWxkIHVzaW5nIHRoZSBrZXkuIFRoZSBjaGlsZCBjYW4gYmUgcmV0cmlldmVkIHVzaW5nIHRoZSBzYW1lIGtleSB1c2luZ1xuICAgKiBnZXRLZXlNYXAuIFRoZSBwcm92aWRlZCBrZXkgc2hvdWxkIGJlIHVuaXF1ZSB3aXRoaW4gdGhlIHBhcmVudCBFbGVtZW50LlxuICAgKiBAcGFyYW0gez9Ob2RlfSBwYXJlbnQgVGhlIHBhcmVudCBvZiBjaGlsZC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBBIGtleSB0byBpZGVudGlmeSB0aGUgY2hpbGQgd2l0aC5cbiAgICogQHBhcmFtIHshTm9kZX0gY2hpbGQgVGhlIGNoaWxkIHRvIHJlZ2lzdGVyLlxuICAgKi9cbiAgdmFyIHJlZ2lzdGVyQ2hpbGQgPSBmdW5jdGlvbiAocGFyZW50LCBrZXksIGNoaWxkKSB7XG4gICAgZ2V0S2V5TWFwKHBhcmVudClba2V5XSA9IGNoaWxkO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb3B5cmlnaHQgMjAxNSBUaGUgSW5jcmVtZW50YWwgRE9NIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gICAqXG4gICAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gICAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAgICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gICAqXG4gICAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gICAqXG4gICAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAgICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuICAgKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAgICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICAgKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAgICovXG5cbiAgLyoqIEBjb25zdCAqL1xuICB2YXIgbm90aWZpY2F0aW9ucyA9IHtcbiAgICAvKipcbiAgICAgKiBDYWxsZWQgYWZ0ZXIgcGF0Y2ggaGFzIGNvbXBsZWF0ZWQgd2l0aCBhbnkgTm9kZXMgdGhhdCBoYXZlIGJlZW4gY3JlYXRlZFxuICAgICAqIGFuZCBhZGRlZCB0byB0aGUgRE9NLlxuICAgICAqIEB0eXBlIHs/ZnVuY3Rpb24oQXJyYXk8IU5vZGU+KX1cbiAgICAgKi9cbiAgICBub2Rlc0NyZWF0ZWQ6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgYWZ0ZXIgcGF0Y2ggaGFzIGNvbXBsZWF0ZWQgd2l0aCBhbnkgTm9kZXMgdGhhdCBoYXZlIGJlZW4gcmVtb3ZlZFxuICAgICAqIGZyb20gdGhlIERPTS5cbiAgICAgKiBOb3RlIGl0J3MgYW4gYXBwbGljYXRpb25zIHJlc3BvbnNpYmlsaXR5IHRvIGhhbmRsZSBhbnkgY2hpbGROb2Rlcy5cbiAgICAgKiBAdHlwZSB7P2Z1bmN0aW9uKEFycmF5PCFOb2RlPil9XG4gICAgICovXG4gICAgbm9kZXNEZWxldGVkOiBudWxsXG4gIH07XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRyYWNrIG9mIHRoZSBzdGF0ZSBvZiBhIHBhdGNoLlxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGZ1bmN0aW9uIENvbnRleHQoKSB7XG4gICAgLyoqXG4gICAgICogQHR5cGUgeyhBcnJheTwhTm9kZT58dW5kZWZpbmVkKX1cbiAgICAgKi9cbiAgICB0aGlzLmNyZWF0ZWQgPSBub3RpZmljYXRpb25zLm5vZGVzQ3JlYXRlZCAmJiBbXTtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHsoQXJyYXk8IU5vZGU+fHVuZGVmaW5lZCl9XG4gICAgICovXG4gICAgdGhpcy5kZWxldGVkID0gbm90aWZpY2F0aW9ucy5ub2Rlc0RlbGV0ZWQgJiYgW107XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICAgKi9cbiAgQ29udGV4dC5wcm90b3R5cGUubWFya0NyZWF0ZWQgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIGlmICh0aGlzLmNyZWF0ZWQpIHtcbiAgICAgIHRoaXMuY3JlYXRlZC5wdXNoKG5vZGUpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICAgKi9cbiAgQ29udGV4dC5wcm90b3R5cGUubWFya0RlbGV0ZWQgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIGlmICh0aGlzLmRlbGV0ZWQpIHtcbiAgICAgIHRoaXMuZGVsZXRlZC5wdXNoKG5vZGUpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogTm90aWZpZXMgYWJvdXQgbm9kZXMgdGhhdCB3ZXJlIGNyZWF0ZWQgZHVyaW5nIHRoZSBwYXRjaCBvcGVhcmF0aW9uLlxuICAgKi9cbiAgQ29udGV4dC5wcm90b3R5cGUubm90aWZ5Q2hhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5jcmVhdGVkICYmIHRoaXMuY3JlYXRlZC5sZW5ndGggPiAwKSB7XG4gICAgICBub3RpZmljYXRpb25zLm5vZGVzQ3JlYXRlZCh0aGlzLmNyZWF0ZWQpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmRlbGV0ZWQgJiYgdGhpcy5kZWxldGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIG5vdGlmaWNhdGlvbnMubm9kZXNEZWxldGVkKHRoaXMuZGVsZXRlZCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAqIE1ha2VzIHN1cmUgdGhhdCBrZXllZCBFbGVtZW50IG1hdGNoZXMgdGhlIHRhZyBuYW1lIHByb3ZpZGVkLlxuICAqIEBwYXJhbSB7IXN0cmluZ30gbm9kZU5hbWUgVGhlIG5vZGVOYW1lIG9mIHRoZSBub2RlIHRoYXQgaXMgYmVpbmcgbWF0Y2hlZC5cbiAgKiBAcGFyYW0ge3N0cmluZz19IHRhZyBUaGUgdGFnIG5hbWUgb2YgdGhlIEVsZW1lbnQuXG4gICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgb2YgdGhlIEVsZW1lbnQuXG4gICovXG4gIHZhciBhc3NlcnRLZXllZFRhZ01hdGNoZXMgPSBmdW5jdGlvbiAobm9kZU5hbWUsIHRhZywga2V5KSB7XG4gICAgaWYgKG5vZGVOYW1lICE9PSB0YWcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignV2FzIGV4cGVjdGluZyBub2RlIHdpdGgga2V5IFwiJyArIGtleSArICdcIiB0byBiZSBhICcgKyB0YWcgKyAnLCBub3QgYSAnICsgbm9kZU5hbWUgKyAnLicpO1xuICAgIH1cbiAgfTtcblxuICAvKiogQHR5cGUgez9Db250ZXh0fSAqL1xuICB2YXIgY29udGV4dCA9IG51bGw7XG5cbiAgLyoqIEB0eXBlIHs/Tm9kZX0gKi9cbiAgdmFyIGN1cnJlbnROb2RlID0gbnVsbDtcblxuICAvKiogQHR5cGUgez9Ob2RlfSAqL1xuICB2YXIgY3VycmVudFBhcmVudCA9IG51bGw7XG5cbiAgLyoqIEB0eXBlIHs/RWxlbWVudHw/RG9jdW1lbnRGcmFnbWVudH0gKi9cbiAgdmFyIHJvb3QgPSBudWxsO1xuXG4gIC8qKiBAdHlwZSB7P0RvY3VtZW50fSAqL1xuICB2YXIgZG9jID0gbnVsbDtcblxuICAvKipcbiAgICogUmV0dXJucyBhIHBhdGNoZXIgZnVuY3Rpb24gdGhhdCBzZXRzIHVwIGFuZCByZXN0b3JlcyBhIHBhdGNoIGNvbnRleHQsXG4gICAqIHJ1bm5pbmcgdGhlIHJ1biBmdW5jdGlvbiB3aXRoIHRoZSBwcm92aWRlZCBkYXRhLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uKCghRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudCksIWZ1bmN0aW9uKFQpLFQ9KX0gcnVuXG4gICAqIEByZXR1cm4ge2Z1bmN0aW9uKCghRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudCksIWZ1bmN0aW9uKFQpLFQ9KX1cbiAgICogQHRlbXBsYXRlIFRcbiAgICovXG4gIHZhciBwYXRjaEZhY3RvcnkgPSBmdW5jdGlvbiAocnVuKSB7XG4gICAgLyoqXG4gICAgICogVE9ETyhtb3opOiBUaGVzZSBhbm5vdGF0aW9ucyB3b24ndCBiZSBuZWNlc3Nhcnkgb25jZSB3ZSBzd2l0Y2ggdG8gQ2xvc3VyZVxuICAgICAqIENvbXBpbGVyJ3MgbmV3IHR5cGUgaW5mZXJlbmNlLiBSZW1vdmUgdGhlc2Ugb25jZSB0aGUgc3dpdGNoIGlzIGRvbmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyghRWxlbWVudHwhRG9jdW1lbnRGcmFnbWVudCl9IG5vZGVcbiAgICAgKiBAcGFyYW0geyFmdW5jdGlvbihUKX0gZm5cbiAgICAgKiBAcGFyYW0ge1Q9fSBkYXRhXG4gICAgICogQHRlbXBsYXRlIFRcbiAgICAgKi9cbiAgICB2YXIgZiA9IGZ1bmN0aW9uIChub2RlLCBmbiwgZGF0YSkge1xuICAgICAgdmFyIHByZXZDb250ZXh0ID0gY29udGV4dDtcbiAgICAgIHZhciBwcmV2Um9vdCA9IHJvb3Q7XG4gICAgICB2YXIgcHJldkRvYyA9IGRvYztcbiAgICAgIHZhciBwcmV2Q3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZTtcbiAgICAgIHZhciBwcmV2Q3VycmVudFBhcmVudCA9IGN1cnJlbnRQYXJlbnQ7XG4gICAgICB2YXIgcHJldmlvdXNJbkF0dHJpYnV0ZXMgPSBmYWxzZTtcbiAgICAgIHZhciBwcmV2aW91c0luU2tpcCA9IGZhbHNlO1xuXG4gICAgICBjb250ZXh0ID0gbmV3IENvbnRleHQoKTtcbiAgICAgIHJvb3QgPSBub2RlO1xuICAgICAgZG9jID0gbm9kZS5vd25lckRvY3VtZW50O1xuICAgICAgY3VycmVudFBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcblxuICAgICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gICAgICBydW4obm9kZSwgZm4sIGRhdGEpO1xuXG4gICAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgICAgIGNvbnRleHQubm90aWZ5Q2hhbmdlcygpO1xuXG4gICAgICBjb250ZXh0ID0gcHJldkNvbnRleHQ7XG4gICAgICByb290ID0gcHJldlJvb3Q7XG4gICAgICBkb2MgPSBwcmV2RG9jO1xuICAgICAgY3VycmVudE5vZGUgPSBwcmV2Q3VycmVudE5vZGU7XG4gICAgICBjdXJyZW50UGFyZW50ID0gcHJldkN1cnJlbnRQYXJlbnQ7XG4gICAgfTtcbiAgICByZXR1cm4gZjtcbiAgfTtcblxuICAvKipcbiAgICogUGF0Y2hlcyB0aGUgZG9jdW1lbnQgc3RhcnRpbmcgYXQgbm9kZSB3aXRoIHRoZSBwcm92aWRlZCBmdW5jdGlvbi4gVGhpc1xuICAgKiBmdW5jdGlvbiBtYXkgYmUgY2FsbGVkIGR1cmluZyBhbiBleGlzdGluZyBwYXRjaCBvcGVyYXRpb24uXG4gICAqIEBwYXJhbSB7IUVsZW1lbnR8IURvY3VtZW50RnJhZ21lbnR9IG5vZGUgVGhlIEVsZW1lbnQgb3IgRG9jdW1lbnRcbiAgICogICAgIHRvIHBhdGNoLlxuICAgKiBAcGFyYW0geyFmdW5jdGlvbihUKX0gZm4gQSBmdW5jdGlvbiBjb250YWluaW5nIGVsZW1lbnRPcGVuL2VsZW1lbnRDbG9zZS9ldGMuXG4gICAqICAgICBjYWxscyB0aGF0IGRlc2NyaWJlIHRoZSBET00uXG4gICAqIEBwYXJhbSB7VD19IGRhdGEgQW4gYXJndW1lbnQgcGFzc2VkIHRvIGZuIHRvIHJlcHJlc2VudCBET00gc3RhdGUuXG4gICAqIEB0ZW1wbGF0ZSBUXG4gICAqL1xuICB2YXIgcGF0Y2hJbm5lciA9IHBhdGNoRmFjdG9yeShmdW5jdGlvbiAobm9kZSwgZm4sIGRhdGEpIHtcbiAgICBjdXJyZW50Tm9kZSA9IG5vZGU7XG5cbiAgICBlbnRlck5vZGUoKTtcbiAgICBmbihkYXRhKTtcbiAgICBleGl0Tm9kZSgpO1xuXG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuICB9KTtcblxuICAvKipcbiAgICogUGF0Y2hlcyBhbiBFbGVtZW50IHdpdGggdGhlIHRoZSBwcm92aWRlZCBmdW5jdGlvbi4gRXhhY3RseSBvbmUgdG9wIGxldmVsXG4gICAqIGVsZW1lbnQgY2FsbCBzaG91bGQgYmUgbWFkZSBjb3JyZXNwb25kaW5nIHRvIGBub2RlYC5cbiAgICogQHBhcmFtIHshRWxlbWVudH0gbm9kZSBUaGUgRWxlbWVudCB3aGVyZSB0aGUgcGF0Y2ggc2hvdWxkIHN0YXJ0LlxuICAgKiBAcGFyYW0geyFmdW5jdGlvbihUKX0gZm4gQSBmdW5jdGlvbiBjb250YWluaW5nIGVsZW1lbnRPcGVuL2VsZW1lbnRDbG9zZS9ldGMuXG4gICAqICAgICBjYWxscyB0aGF0IGRlc2NyaWJlIHRoZSBET00uIFRoaXMgc2hvdWxkIGhhdmUgYXQgbW9zdCBvbmUgdG9wIGxldmVsXG4gICAqICAgICBlbGVtZW50IGNhbGwuXG4gICAqIEBwYXJhbSB7VD19IGRhdGEgQW4gYXJndW1lbnQgcGFzc2VkIHRvIGZuIHRvIHJlcHJlc2VudCBET00gc3RhdGUuXG4gICAqIEB0ZW1wbGF0ZSBUXG4gICAqL1xuICB2YXIgcGF0Y2hPdXRlciA9IHBhdGNoRmFjdG9yeShmdW5jdGlvbiAobm9kZSwgZm4sIGRhdGEpIHtcbiAgICBjdXJyZW50Tm9kZSA9IC8qKiBAdHlwZSB7IUVsZW1lbnR9ICoveyBuZXh0U2libGluZzogbm9kZSB9O1xuXG4gICAgZm4oZGF0YSk7XG5cbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciBvciBub3QgdGhlIGN1cnJlbnQgbm9kZSBtYXRjaGVzIHRoZSBzcGVjaWZpZWQgbm9kZU5hbWUgYW5kXG4gICAqIGtleS5cbiAgICpcbiAgICogQHBhcmFtIHs/c3RyaW5nfSBub2RlTmFtZSBUaGUgbm9kZU5hbWUgZm9yIHRoaXMgbm9kZS5cbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IEFuIG9wdGlvbmFsIGtleSB0aGF0IGlkZW50aWZpZXMgYSBub2RlLlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSBub2RlIG1hdGNoZXMsIGZhbHNlIG90aGVyd2lzZS5cbiAgICovXG4gIHZhciBtYXRjaGVzID0gZnVuY3Rpb24gKG5vZGVOYW1lLCBrZXkpIHtcbiAgICB2YXIgZGF0YSA9IGdldERhdGEoY3VycmVudE5vZGUpO1xuXG4gICAgLy8gS2V5IGNoZWNrIGlzIGRvbmUgdXNpbmcgZG91YmxlIGVxdWFscyBhcyB3ZSB3YW50IHRvIHRyZWF0IGEgbnVsbCBrZXkgdGhlXG4gICAgLy8gc2FtZSBhcyB1bmRlZmluZWQuIFRoaXMgc2hvdWxkIGJlIG9rYXkgYXMgdGhlIG9ubHkgdmFsdWVzIGFsbG93ZWQgYXJlXG4gICAgLy8gc3RyaW5ncywgbnVsbCBhbmQgdW5kZWZpbmVkIHNvIHRoZSA9PSBzZW1hbnRpY3MgYXJlIG5vdCB0b28gd2VpcmQuXG4gICAgcmV0dXJuIG5vZGVOYW1lID09PSBkYXRhLm5vZGVOYW1lICYmIGtleSA9PSBkYXRhLmtleTtcbiAgfTtcblxuICAvKipcbiAgICogQWxpZ25zIHRoZSB2aXJ0dWFsIEVsZW1lbnQgZGVmaW5pdGlvbiB3aXRoIHRoZSBhY3R1YWwgRE9NLCBtb3ZpbmcgdGhlXG4gICAqIGNvcnJlc3BvbmRpbmcgRE9NIG5vZGUgdG8gdGhlIGNvcnJlY3QgbG9jYXRpb24gb3IgY3JlYXRpbmcgaXQgaWYgbmVjZXNzYXJ5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbm9kZU5hbWUgRm9yIGFuIEVsZW1lbnQsIHRoaXMgc2hvdWxkIGJlIGEgdmFsaWQgdGFnIHN0cmluZy5cbiAgICogICAgIEZvciBhIFRleHQsIHRoaXMgc2hvdWxkIGJlICN0ZXh0LlxuICAgKiBAcGFyYW0gez9zdHJpbmc9fSBrZXkgVGhlIGtleSB1c2VkIHRvIGlkZW50aWZ5IHRoaXMgZWxlbWVudC5cbiAgICogQHBhcmFtIHs/QXJyYXk8Kj49fSBzdGF0aWNzIEZvciBhbiBFbGVtZW50LCB0aGlzIHNob3VsZCBiZSBhbiBhcnJheSBvZlxuICAgKiAgICAgbmFtZS12YWx1ZSBwYWlycy5cbiAgICovXG4gIHZhciBhbGlnbldpdGhET00gPSBmdW5jdGlvbiAobm9kZU5hbWUsIGtleSwgc3RhdGljcykge1xuICAgIGlmIChjdXJyZW50Tm9kZSAmJiBtYXRjaGVzKG5vZGVOYW1lLCBrZXkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIG5vZGUgPSB1bmRlZmluZWQ7XG5cbiAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIG5vZGUgaGFzIG1vdmVkIHdpdGhpbiB0aGUgcGFyZW50LlxuICAgIGlmIChrZXkpIHtcbiAgICAgIG5vZGUgPSBnZXRDaGlsZChjdXJyZW50UGFyZW50LCBrZXkpO1xuICAgICAgaWYgKG5vZGUgJiYgJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgYXNzZXJ0S2V5ZWRUYWdNYXRjaGVzKGdldERhdGEobm9kZSkubm9kZU5hbWUsIG5vZGVOYW1lLCBrZXkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENyZWF0ZSB0aGUgbm9kZSBpZiBpdCBkb2Vzbid0IGV4aXN0LlxuICAgIGlmICghbm9kZSkge1xuICAgICAgaWYgKG5vZGVOYW1lID09PSAnI3RleHQnKSB7XG4gICAgICAgIG5vZGUgPSBjcmVhdGVUZXh0KGRvYyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBub2RlID0gY3JlYXRlRWxlbWVudChkb2MsIGN1cnJlbnRQYXJlbnQsIG5vZGVOYW1lLCBrZXksIHN0YXRpY3MpO1xuICAgICAgfVxuXG4gICAgICBpZiAoa2V5KSB7XG4gICAgICAgIHJlZ2lzdGVyQ2hpbGQoY3VycmVudFBhcmVudCwga2V5LCBub2RlKTtcbiAgICAgIH1cblxuICAgICAgY29udGV4dC5tYXJrQ3JlYXRlZChub2RlKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgbm9kZSBoYXMgYSBrZXksIHJlbW92ZSBpdCBmcm9tIHRoZSBET00gdG8gcHJldmVudCBhIGxhcmdlIG51bWJlclxuICAgIC8vIG9mIHJlLW9yZGVycyBpbiB0aGUgY2FzZSB0aGF0IGl0IG1vdmVkIGZhciBvciB3YXMgY29tcGxldGVseSByZW1vdmVkLlxuICAgIC8vIFNpbmNlIHdlIGhvbGQgb24gdG8gYSByZWZlcmVuY2UgdGhyb3VnaCB0aGUga2V5TWFwLCB3ZSBjYW4gYWx3YXlzIGFkZCBpdFxuICAgIC8vIGJhY2suXG4gICAgaWYgKGN1cnJlbnROb2RlICYmIGdldERhdGEoY3VycmVudE5vZGUpLmtleSkge1xuICAgICAgY3VycmVudFBhcmVudC5yZXBsYWNlQ2hpbGQobm9kZSwgY3VycmVudE5vZGUpO1xuICAgICAgZ2V0RGF0YShjdXJyZW50UGFyZW50KS5rZXlNYXBWYWxpZCA9IGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdXJyZW50UGFyZW50Lmluc2VydEJlZm9yZShub2RlLCBjdXJyZW50Tm9kZSk7XG4gICAgfVxuXG4gICAgY3VycmVudE5vZGUgPSBub2RlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDbGVhcnMgb3V0IGFueSB1bnZpc2l0ZWQgTm9kZXMsIGFzIHRoZSBjb3JyZXNwb25kaW5nIHZpcnR1YWwgZWxlbWVudFxuICAgKiBmdW5jdGlvbnMgd2VyZSBuZXZlciBjYWxsZWQgZm9yIHRoZW0uXG4gICAqL1xuICB2YXIgY2xlYXJVbnZpc2l0ZWRET00gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG5vZGUgPSBjdXJyZW50UGFyZW50O1xuICAgIHZhciBkYXRhID0gZ2V0RGF0YShub2RlKTtcbiAgICB2YXIga2V5TWFwID0gZGF0YS5rZXlNYXA7XG4gICAgdmFyIGtleU1hcFZhbGlkID0gZGF0YS5rZXlNYXBWYWxpZDtcbiAgICB2YXIgY2hpbGQgPSBub2RlLmxhc3RDaGlsZDtcbiAgICB2YXIga2V5ID0gdW5kZWZpbmVkO1xuXG4gICAgaWYgKGNoaWxkID09PSBjdXJyZW50Tm9kZSAmJiBrZXlNYXBWYWxpZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChkYXRhLmF0dHJzW3N5bWJvbHMucGxhY2Vob2xkZXJdICYmIG5vZGUgIT09IHJvb3QpIHtcbiAgICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB3aGlsZSAoY2hpbGQgIT09IGN1cnJlbnROb2RlKSB7XG4gICAgICBub2RlLnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICAgIGNvbnRleHQubWFya0RlbGV0ZWQoIC8qKiBAdHlwZSB7IU5vZGV9Ki9jaGlsZCk7XG5cbiAgICAgIGtleSA9IGdldERhdGEoY2hpbGQpLmtleTtcbiAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgZGVsZXRlIGtleU1hcFtrZXldO1xuICAgICAgfVxuICAgICAgY2hpbGQgPSBub2RlLmxhc3RDaGlsZDtcbiAgICB9XG5cbiAgICAvLyBDbGVhbiB0aGUga2V5TWFwLCByZW1vdmluZyBhbnkgdW51c3VlZCBrZXlzLlxuICAgIGlmICgha2V5TWFwVmFsaWQpIHtcbiAgICAgIGZvciAoa2V5IGluIGtleU1hcCkge1xuICAgICAgICBjaGlsZCA9IGtleU1hcFtrZXldO1xuICAgICAgICBpZiAoY2hpbGQucGFyZW50Tm9kZSAhPT0gbm9kZSkge1xuICAgICAgICAgIGNvbnRleHQubWFya0RlbGV0ZWQoY2hpbGQpO1xuICAgICAgICAgIGRlbGV0ZSBrZXlNYXBba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBkYXRhLmtleU1hcFZhbGlkID0gdHJ1ZTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIENoYW5nZXMgdG8gdGhlIGZpcnN0IGNoaWxkIG9mIHRoZSBjdXJyZW50IG5vZGUuXG4gICAqL1xuICB2YXIgZW50ZXJOb2RlID0gZnVuY3Rpb24gKCkge1xuICAgIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50Tm9kZTtcbiAgICBjdXJyZW50Tm9kZSA9IG51bGw7XG4gIH07XG5cbiAgLyoqXG4gICAqIENoYW5nZXMgdG8gdGhlIG5leHQgc2libGluZyBvZiB0aGUgY3VycmVudCBub2RlLlxuICAgKi9cbiAgdmFyIG5leHROb2RlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChjdXJyZW50Tm9kZSkge1xuICAgICAgY3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZS5uZXh0U2libGluZztcbiAgICB9IGVsc2Uge1xuICAgICAgY3VycmVudE5vZGUgPSBjdXJyZW50UGFyZW50LmZpcnN0Q2hpbGQ7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBDaGFuZ2VzIHRvIHRoZSBwYXJlbnQgb2YgdGhlIGN1cnJlbnQgbm9kZSwgcmVtb3ZpbmcgYW55IHVudmlzaXRlZCBjaGlsZHJlbi5cbiAgICovXG4gIHZhciBleGl0Tm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBjbGVhclVudmlzaXRlZERPTSgpO1xuXG4gICAgY3VycmVudE5vZGUgPSBjdXJyZW50UGFyZW50O1xuICAgIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50UGFyZW50LnBhcmVudE5vZGU7XG4gIH07XG5cbiAgLyoqXG4gICAqIE1ha2VzIHN1cmUgdGhhdCB0aGUgY3VycmVudCBub2RlIGlzIGFuIEVsZW1lbnQgd2l0aCBhIG1hdGNoaW5nIHRhZ05hbWUgYW5kXG4gICAqIGtleS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gICAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAgICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gICAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAgICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gICAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gICAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICAgKi9cbiAgdmFyIGNvcmVFbGVtZW50T3BlbiA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcykge1xuICAgIG5leHROb2RlKCk7XG4gICAgYWxpZ25XaXRoRE9NKHRhZywga2V5LCBzdGF0aWNzKTtcbiAgICBlbnRlck5vZGUoKTtcbiAgICByZXR1cm4gKC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovY3VycmVudFBhcmVudFxuICAgICk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENsb3NlcyB0aGUgY3VycmVudGx5IG9wZW4gRWxlbWVudCwgcmVtb3ZpbmcgYW55IHVudmlzaXRlZCBjaGlsZHJlbiBpZlxuICAgKiBuZWNlc3NhcnkuXG4gICAqXG4gICAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICAgKi9cbiAgdmFyIGNvcmVFbGVtZW50Q2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gICAgZXhpdE5vZGUoKTtcbiAgICByZXR1cm4gKC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovY3VycmVudE5vZGVcbiAgICApO1xuICB9O1xuXG4gIC8qKlxuICAgKiBNYWtlcyBzdXJlIHRoZSBjdXJyZW50IG5vZGUgaXMgYSBUZXh0IG5vZGUgYW5kIGNyZWF0ZXMgYSBUZXh0IG5vZGUgaWYgaXQgaXNcbiAgICogbm90LlxuICAgKlxuICAgKiBAcmV0dXJuIHshVGV4dH0gVGhlIGNvcnJlc3BvbmRpbmcgVGV4dCBOb2RlLlxuICAgKi9cbiAgdmFyIGNvcmVUZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIG5leHROb2RlKCk7XG4gICAgYWxpZ25XaXRoRE9NKCcjdGV4dCcsIG51bGwsIG51bGwpO1xuICAgIHJldHVybiAoLyoqIEB0eXBlIHshVGV4dH0gKi9jdXJyZW50Tm9kZVxuICAgICk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgRWxlbWVudCBiZWluZyBwYXRjaGVkLlxuICAgKiBAcmV0dXJuIHshRWxlbWVudH1cbiAgICovXG4gIHZhciBjdXJyZW50RWxlbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG4gICAgcmV0dXJuICgvKiogQHR5cGUgeyFFbGVtZW50fSAqL2N1cnJlbnRQYXJlbnRcbiAgICApO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTa2lwcyB0aGUgY2hpbGRyZW4gaW4gYSBzdWJ0cmVlLCBhbGxvd2luZyBhbiBFbGVtZW50IHRvIGJlIGNsb3NlZCB3aXRob3V0XG4gICAqIGNsZWFyaW5nIG91dCB0aGUgY2hpbGRyZW4uXG4gICAqL1xuICB2YXIgc2tpcCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG4gICAgY3VycmVudE5vZGUgPSBjdXJyZW50UGFyZW50Lmxhc3RDaGlsZDtcbiAgfTtcblxuICAvKipcbiAgICogVGhlIG9mZnNldCBpbiB0aGUgdmlydHVhbCBlbGVtZW50IGRlY2xhcmF0aW9uIHdoZXJlIHRoZSBhdHRyaWJ1dGVzIGFyZVxuICAgKiBzcGVjaWZpZWQuXG4gICAqIEBjb25zdFxuICAgKi9cbiAgdmFyIEFUVFJJQlVURVNfT0ZGU0VUID0gMztcblxuICAvKipcbiAgICogQnVpbGRzIGFuIGFycmF5IG9mIGFyZ3VtZW50cyBmb3IgdXNlIHdpdGggZWxlbWVudE9wZW5TdGFydCwgYXR0ciBhbmRcbiAgICogZWxlbWVudE9wZW5FbmQuXG4gICAqIEBjb25zdCB7QXJyYXk8Kj59XG4gICAqL1xuICB2YXIgYXJnc0J1aWxkZXIgPSBbXTtcblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gICAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAgICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gICAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAgICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gICAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gICAqIEBwYXJhbSB7Li4uKn0gY29uc3RfYXJncyBBdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGUgZHluYW1pYyBhdHRyaWJ1dGVzXG4gICAqICAgICBmb3IgdGhlIEVsZW1lbnQuXG4gICAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICAgKi9cbiAgdmFyIGVsZW1lbnRPcGVuID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzLCBjb25zdF9hcmdzKSB7XG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gICAgdmFyIG5vZGUgPSBjb3JlRWxlbWVudE9wZW4odGFnLCBrZXksIHN0YXRpY3MpO1xuICAgIHZhciBkYXRhID0gZ2V0RGF0YShub2RlKTtcblxuICAgIC8qXG4gICAgICogQ2hlY2tzIHRvIHNlZSBpZiBvbmUgb3IgbW9yZSBhdHRyaWJ1dGVzIGhhdmUgY2hhbmdlZCBmb3IgYSBnaXZlbiBFbGVtZW50LlxuICAgICAqIFdoZW4gbm8gYXR0cmlidXRlcyBoYXZlIGNoYW5nZWQsIHRoaXMgaXMgbXVjaCBmYXN0ZXIgdGhhbiBjaGVja2luZyBlYWNoXG4gICAgICogaW5kaXZpZHVhbCBhcmd1bWVudC4gV2hlbiBhdHRyaWJ1dGVzIGhhdmUgY2hhbmdlZCwgdGhlIG92ZXJoZWFkIG9mIHRoaXMgaXNcbiAgICAgKiBtaW5pbWFsLlxuICAgICAqL1xuICAgIHZhciBhdHRyc0FyciA9IGRhdGEuYXR0cnNBcnI7XG4gICAgdmFyIG5ld0F0dHJzID0gZGF0YS5uZXdBdHRycztcbiAgICB2YXIgYXR0cnNDaGFuZ2VkID0gZmFsc2U7XG4gICAgdmFyIGkgPSBBVFRSSUJVVEVTX09GRlNFVDtcbiAgICB2YXIgaiA9IDA7XG5cbiAgICBmb3IgKDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMSwgaiArPSAxKSB7XG4gICAgICBpZiAoYXR0cnNBcnJbal0gIT09IGFyZ3VtZW50c1tpXSkge1xuICAgICAgICBhdHRyc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKz0gMSwgaiArPSAxKSB7XG4gICAgICBhdHRyc0FycltqXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBpZiAoaiA8IGF0dHJzQXJyLmxlbmd0aCkge1xuICAgICAgYXR0cnNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIGF0dHJzQXJyLmxlbmd0aCA9IGo7XG4gICAgfVxuXG4gICAgLypcbiAgICAgKiBBY3R1YWxseSBwZXJmb3JtIHRoZSBhdHRyaWJ1dGUgdXBkYXRlLlxuICAgICAqL1xuICAgIGlmIChhdHRyc0NoYW5nZWQpIHtcbiAgICAgIGZvciAoaSA9IEFUVFJJQlVURVNfT0ZGU0VUOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgIG5ld0F0dHJzW2FyZ3VtZW50c1tpXV0gPSBhcmd1bWVudHNbaSArIDFdO1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBfYXR0ciBpbiBuZXdBdHRycykge1xuICAgICAgICB1cGRhdGVBdHRyaWJ1dGUobm9kZSwgX2F0dHIsIG5ld0F0dHJzW19hdHRyXSk7XG4gICAgICAgIG5ld0F0dHJzW19hdHRyXSA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbm9kZTtcbiAgfTtcblxuICAvKipcbiAgICogRGVjbGFyZXMgYSB2aXJ0dWFsIEVsZW1lbnQgYXQgdGhlIGN1cnJlbnQgbG9jYXRpb24gaW4gdGhlIGRvY3VtZW50LiBUaGlzXG4gICAqIGNvcnJlc3BvbmRzIHRvIGFuIG9wZW5pbmcgdGFnIGFuZCBhIGVsZW1lbnRDbG9zZSB0YWcgaXMgcmVxdWlyZWQuIFRoaXMgaXNcbiAgICogbGlrZSBlbGVtZW50T3BlbiwgYnV0IHRoZSBhdHRyaWJ1dGVzIGFyZSBkZWZpbmVkIHVzaW5nIHRoZSBhdHRyIGZ1bmN0aW9uXG4gICAqIHJhdGhlciB0aGFuIGJlaW5nIHBhc3NlZCBhcyBhcmd1bWVudHMuIE11c3QgYmUgZm9sbGxvd2VkIGJ5IDAgb3IgbW9yZSBjYWxsc1xuICAgKiB0byBhdHRyLCB0aGVuIGEgY2FsbCB0byBlbGVtZW50T3BlbkVuZC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gICAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAgICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gICAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAgICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gICAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gICAqL1xuICB2YXIgZWxlbWVudE9wZW5TdGFydCA9IGZ1bmN0aW9uICh0YWcsIGtleSwgc3RhdGljcykge1xuICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICAgIGFyZ3NCdWlsZGVyWzBdID0gdGFnO1xuICAgIGFyZ3NCdWlsZGVyWzFdID0ga2V5O1xuICAgIGFyZ3NCdWlsZGVyWzJdID0gc3RhdGljcztcbiAgfTtcblxuICAvKioqXG4gICAqIERlZmluZXMgYSB2aXJ0dWFsIGF0dHJpYnV0ZSBhdCB0aGlzIHBvaW50IG9mIHRoZSBET00uIFRoaXMgaXMgb25seSB2YWxpZFxuICAgKiB3aGVuIGNhbGxlZCBiZXR3ZWVuIGVsZW1lbnRPcGVuU3RhcnQgYW5kIGVsZW1lbnRPcGVuRW5kLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgKiBAcGFyYW0geyp9IHZhbHVlXG4gICAqL1xuICB2YXIgYXR0ciA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICAgIGFyZ3NCdWlsZGVyLnB1c2gobmFtZSwgdmFsdWUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDbG9zZXMgYW4gb3BlbiB0YWcgc3RhcnRlZCB3aXRoIGVsZW1lbnRPcGVuU3RhcnQuXG4gICAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICAgKi9cbiAgdmFyIGVsZW1lbnRPcGVuRW5kID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICAgIHZhciBub2RlID0gZWxlbWVudE9wZW4uYXBwbHkobnVsbCwgYXJnc0J1aWxkZXIpO1xuICAgIGFyZ3NCdWlsZGVyLmxlbmd0aCA9IDA7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH07XG5cbiAgLyoqXG4gICAqIENsb3NlcyBhbiBvcGVuIHZpcnR1YWwgRWxlbWVudC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAgICogQHJldHVybiB7IUVsZW1lbnR9IFRoZSBjb3JyZXNwb25kaW5nIEVsZW1lbnQuXG4gICAqL1xuICB2YXIgZWxlbWVudENsb3NlID0gZnVuY3Rpb24gKHRhZykge1xuICAgIGlmICgncHJvZHVjdGlvbicgIT09ICdwcm9kdWN0aW9uJykge31cblxuICAgIHZhciBub2RlID0gY29yZUVsZW1lbnRDbG9zZSgpO1xuXG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gICAgcmV0dXJuIG5vZGU7XG4gIH07XG5cbiAgLyoqXG4gICAqIERlY2xhcmVzIGEgdmlydHVhbCBFbGVtZW50IGF0IHRoZSBjdXJyZW50IGxvY2F0aW9uIGluIHRoZSBkb2N1bWVudCB0aGF0IGhhc1xuICAgKiBubyBjaGlsZHJlbi5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAgICogQHBhcmFtIHs/c3RyaW5nPX0ga2V5IFRoZSBrZXkgdXNlZCB0byBpZGVudGlmeSB0aGlzIGVsZW1lbnQuIFRoaXMgY2FuIGJlIGFuXG4gICAqICAgICBlbXB0eSBzdHJpbmcsIGJ1dCBwZXJmb3JtYW5jZSBtYXkgYmUgYmV0dGVyIGlmIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWRcbiAgICogICAgIHdoZW4gaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkgb2YgaXRlbXMuXG4gICAqIEBwYXJhbSB7P0FycmF5PCo+PX0gc3RhdGljcyBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGVcbiAgICogICAgIHN0YXRpYyBhdHRyaWJ1dGVzIGZvciB0aGUgRWxlbWVudC4gVGhlc2Ugd2lsbCBvbmx5IGJlIHNldCBvbmNlIHdoZW4gdGhlXG4gICAqICAgICBFbGVtZW50IGlzIGNyZWF0ZWQuXG4gICAqIEBwYXJhbSB7Li4uKn0gY29uc3RfYXJncyBBdHRyaWJ1dGUgbmFtZS92YWx1ZSBwYWlycyBvZiB0aGUgZHluYW1pYyBhdHRyaWJ1dGVzXG4gICAqICAgICBmb3IgdGhlIEVsZW1lbnQuXG4gICAqIEByZXR1cm4geyFFbGVtZW50fSBUaGUgY29ycmVzcG9uZGluZyBFbGVtZW50LlxuICAgKi9cbiAgdmFyIGVsZW1lbnRWb2lkID0gZnVuY3Rpb24gKHRhZywga2V5LCBzdGF0aWNzLCBjb25zdF9hcmdzKSB7XG4gICAgZWxlbWVudE9wZW4uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICByZXR1cm4gZWxlbWVudENsb3NlKHRhZyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIERlY2xhcmVzIGEgdmlydHVhbCBFbGVtZW50IGF0IHRoZSBjdXJyZW50IGxvY2F0aW9uIGluIHRoZSBkb2N1bWVudCB0aGF0IGlzIGFcbiAgICogcGxhY2Vob2xkZXIgZWxlbWVudC4gQ2hpbGRyZW4gb2YgdGhpcyBFbGVtZW50IGNhbiBiZSBtYW51YWxseSBtYW5hZ2VkIGFuZFxuICAgKiB3aWxsIG5vdCBiZSBjbGVhcmVkIGJ5IHRoZSBsaWJyYXJ5LlxuICAgKlxuICAgKiBBIGtleSBtdXN0IGJlIHNwZWNpZmllZCB0byBtYWtlIHN1cmUgdGhhdCB0aGlzIG5vZGUgaXMgY29ycmVjdGx5IHByZXNlcnZlZFxuICAgKiBhY3Jvc3MgYWxsIGNvbmRpdGlvbmFscy5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgZWxlbWVudCdzIHRhZy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHVzZWQgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50LlxuICAgKiBAcGFyYW0gez9BcnJheTwqPj19IHN0YXRpY3MgQW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlXG4gICAqICAgICBzdGF0aWMgYXR0cmlidXRlcyBmb3IgdGhlIEVsZW1lbnQuIFRoZXNlIHdpbGwgb25seSBiZSBzZXQgb25jZSB3aGVuIHRoZVxuICAgKiAgICAgRWxlbWVudCBpcyBjcmVhdGVkLlxuICAgKiBAcGFyYW0gey4uLip9IGNvbnN0X2FyZ3MgQXR0cmlidXRlIG5hbWUvdmFsdWUgcGFpcnMgb2YgdGhlIGR5bmFtaWMgYXR0cmlidXRlc1xuICAgKiAgICAgZm9yIHRoZSBFbGVtZW50LlxuICAgKiBAcmV0dXJuIHshRWxlbWVudH0gVGhlIGNvcnJlc3BvbmRpbmcgRWxlbWVudC5cbiAgICovXG4gIHZhciBlbGVtZW50UGxhY2Vob2xkZXIgPSBmdW5jdGlvbiAodGFnLCBrZXksIHN0YXRpY3MsIGNvbnN0X2FyZ3MpIHtcbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSAncHJvZHVjdGlvbicpIHt9XG5cbiAgICBlbGVtZW50T3Blbi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgIHNraXAoKTtcbiAgICByZXR1cm4gZWxlbWVudENsb3NlKHRhZyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIERlY2xhcmVzIGEgdmlydHVhbCBUZXh0IGF0IHRoaXMgcG9pbnQgaW4gdGhlIGRvY3VtZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ8Ym9vbGVhbn0gdmFsdWUgVGhlIHZhbHVlIG9mIHRoZSBUZXh0LlxuICAgKiBAcGFyYW0gey4uLihmdW5jdGlvbigoc3RyaW5nfG51bWJlcnxib29sZWFuKSk6c3RyaW5nKX0gY29uc3RfYXJnc1xuICAgKiAgICAgRnVuY3Rpb25zIHRvIGZvcm1hdCB0aGUgdmFsdWUgd2hpY2ggYXJlIGNhbGxlZCBvbmx5IHdoZW4gdGhlIHZhbHVlIGhhc1xuICAgKiAgICAgY2hhbmdlZC5cbiAgICogQHJldHVybiB7IVRleHR9IFRoZSBjb3JyZXNwb25kaW5nIHRleHQgbm9kZS5cbiAgICovXG4gIHZhciB0ZXh0ID0gZnVuY3Rpb24gKHZhbHVlLCBjb25zdF9hcmdzKSB7XG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gJ3Byb2R1Y3Rpb24nKSB7fVxuXG4gICAgdmFyIG5vZGUgPSBjb3JlVGV4dCgpO1xuICAgIHZhciBkYXRhID0gZ2V0RGF0YShub2RlKTtcblxuICAgIGlmIChkYXRhLnRleHQgIT09IHZhbHVlKSB7XG4gICAgICBkYXRhLnRleHQgPSAvKiogQHR5cGUge3N0cmluZ30gKi92YWx1ZTtcblxuICAgICAgdmFyIGZvcm1hdHRlZCA9IHZhbHVlO1xuICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgLypcbiAgICAgICAgICogQ2FsbCB0aGUgZm9ybWF0dGVyIGZ1bmN0aW9uIGRpcmVjdGx5IHRvIHByZXZlbnQgbGVha2luZyBhcmd1bWVudHMuXG4gICAgICAgICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9nb29nbGUvaW5jcmVtZW50YWwtZG9tL3B1bGwvMjA0I2lzc3VlY29tbWVudC0xNzgyMjM1NzRcbiAgICAgICAgICovXG4gICAgICAgIHZhciBmbiA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgZm9ybWF0dGVkID0gZm4oZm9ybWF0dGVkKTtcbiAgICAgIH1cblxuICAgICAgbm9kZS5kYXRhID0gZm9ybWF0dGVkO1xuICAgIH1cblxuICAgIHJldHVybiBub2RlO1xuICB9O1xuXG4gIGV4cG9ydHMucGF0Y2ggPSBwYXRjaElubmVyO1xuICBleHBvcnRzLnBhdGNoSW5uZXIgPSBwYXRjaElubmVyO1xuICBleHBvcnRzLnBhdGNoT3V0ZXIgPSBwYXRjaE91dGVyO1xuICBleHBvcnRzLmN1cnJlbnRFbGVtZW50ID0gY3VycmVudEVsZW1lbnQ7XG4gIGV4cG9ydHMuc2tpcCA9IHNraXA7XG4gIGV4cG9ydHMuZWxlbWVudFZvaWQgPSBlbGVtZW50Vm9pZDtcbiAgZXhwb3J0cy5lbGVtZW50T3BlblN0YXJ0ID0gZWxlbWVudE9wZW5TdGFydDtcbiAgZXhwb3J0cy5lbGVtZW50T3BlbkVuZCA9IGVsZW1lbnRPcGVuRW5kO1xuICBleHBvcnRzLmVsZW1lbnRPcGVuID0gZWxlbWVudE9wZW47XG4gIGV4cG9ydHMuZWxlbWVudENsb3NlID0gZWxlbWVudENsb3NlO1xuICBleHBvcnRzLmVsZW1lbnRQbGFjZWhvbGRlciA9IGVsZW1lbnRQbGFjZWhvbGRlcjtcbiAgZXhwb3J0cy50ZXh0ID0gdGV4dDtcbiAgZXhwb3J0cy5hdHRyID0gYXR0cjtcbiAgZXhwb3J0cy5zeW1ib2xzID0gc3ltYm9scztcbiAgZXhwb3J0cy5hdHRyaWJ1dGVzID0gYXR0cmlidXRlcztcbiAgZXhwb3J0cy5hcHBseUF0dHIgPSBhcHBseUF0dHI7XG4gIGV4cG9ydHMuYXBwbHlQcm9wID0gYXBwbHlQcm9wO1xuICBleHBvcnRzLm5vdGlmaWNhdGlvbnMgPSBub3RpZmljYXRpb25zO1xuXG59KSk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluY3JlbWVudGFsLWRvbS5qcy5tYXAiLCIvKiFcbiAqIFFVbml0IDIuMC4wXG4gKiBodHRwczovL3F1bml0anMuY29tL1xuICpcbiAqIENvcHlyaWdodCBqUXVlcnkgRm91bmRhdGlvbiBhbmQgb3RoZXIgY29udHJpYnV0b3JzXG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqIGh0dHBzOi8vanF1ZXJ5Lm9yZy9saWNlbnNlXG4gKlxuICogRGF0ZTogMjAxNi0wNi0xNlQxNzowOVpcbiAqL1xuXG4oIGZ1bmN0aW9uKCBnbG9iYWwgKSB7XG5cbnZhciBRVW5pdCA9IHt9O1xuXG52YXIgRGF0ZSA9IGdsb2JhbC5EYXRlO1xudmFyIG5vdyA9IERhdGUubm93IHx8IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG59O1xuXG52YXIgc2V0VGltZW91dCA9IGdsb2JhbC5zZXRUaW1lb3V0O1xudmFyIGNsZWFyVGltZW91dCA9IGdsb2JhbC5jbGVhclRpbWVvdXQ7XG5cbi8vIFN0b3JlIGEgbG9jYWwgd2luZG93IGZyb20gdGhlIGdsb2JhbCB0byBhbGxvdyBkaXJlY3QgcmVmZXJlbmNlcy5cbnZhciB3aW5kb3cgPSBnbG9iYWwud2luZG93O1xuXG52YXIgZGVmaW5lZCA9IHtcblx0ZG9jdW1lbnQ6IHdpbmRvdyAmJiB3aW5kb3cuZG9jdW1lbnQgIT09IHVuZGVmaW5lZCxcblx0c2V0VGltZW91dDogc2V0VGltZW91dCAhPT0gdW5kZWZpbmVkLFxuXHRzZXNzaW9uU3RvcmFnZTogKCBmdW5jdGlvbigpIHtcblx0XHR2YXIgeCA9IFwicXVuaXQtdGVzdC1zdHJpbmdcIjtcblx0XHR0cnkge1xuXHRcdFx0c2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSggeCwgeCApO1xuXHRcdFx0c2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbSggeCApO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fSBjYXRjaCAoIGUgKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9KCkgKVxufTtcblxudmFyIGZpbGVOYW1lID0gKCBzb3VyY2VGcm9tU3RhY2t0cmFjZSggMCApIHx8IFwiXCIgKS5yZXBsYWNlKCAvKDpcXGQrKStcXCk/LywgXCJcIiApLnJlcGxhY2UoIC8uK1xcLy8sIFwiXCIgKTtcbnZhciBnbG9iYWxTdGFydENhbGxlZCA9IGZhbHNlO1xudmFyIHJ1blN0YXJ0ZWQgPSBmYWxzZTtcblxudmFyIGF1dG9ydW4gPSBmYWxzZTtcblxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcblx0aGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy8gUmV0dXJucyBhIG5ldyBBcnJheSB3aXRoIHRoZSBlbGVtZW50cyB0aGF0IGFyZSBpbiBhIGJ1dCBub3QgaW4gYlxuZnVuY3Rpb24gZGlmZiggYSwgYiApIHtcblx0dmFyIGksIGosXG5cdFx0cmVzdWx0ID0gYS5zbGljZSgpO1xuXG5cdGZvciAoIGkgPSAwOyBpIDwgcmVzdWx0Lmxlbmd0aDsgaSsrICkge1xuXHRcdGZvciAoIGogPSAwOyBqIDwgYi5sZW5ndGg7IGorKyApIHtcblx0XHRcdGlmICggcmVzdWx0WyBpIF0gPT09IGJbIGogXSApIHtcblx0XHRcdFx0cmVzdWx0LnNwbGljZSggaSwgMSApO1xuXHRcdFx0XHRpLS07XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBGcm9tIGpxdWVyeS5qc1xuZnVuY3Rpb24gaW5BcnJheSggZWxlbSwgYXJyYXkgKSB7XG5cdGlmICggYXJyYXkuaW5kZXhPZiApIHtcblx0XHRyZXR1cm4gYXJyYXkuaW5kZXhPZiggZWxlbSApO1xuXHR9XG5cblx0Zm9yICggdmFyIGkgPSAwLCBsZW5ndGggPSBhcnJheS5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKyApIHtcblx0XHRpZiAoIGFycmF5WyBpIF0gPT09IGVsZW0gKSB7XG5cdFx0XHRyZXR1cm4gaTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gLTE7XG59XG5cbi8qKlxuICogTWFrZXMgYSBjbG9uZSBvZiBhbiBvYmplY3QgdXNpbmcgb25seSBBcnJheSBvciBPYmplY3QgYXMgYmFzZSxcbiAqIGFuZCBjb3BpZXMgb3ZlciB0aGUgb3duIGVudW1lcmFibGUgcHJvcGVydGllcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtPYmplY3R9IE5ldyBvYmplY3Qgd2l0aCBvbmx5IHRoZSBvd24gcHJvcGVydGllcyAocmVjdXJzaXZlbHkpLlxuICovXG5mdW5jdGlvbiBvYmplY3RWYWx1ZXMgKCBvYmogKSB7XG5cdHZhciBrZXksIHZhbCxcblx0XHR2YWxzID0gUVVuaXQuaXMoIFwiYXJyYXlcIiwgb2JqICkgPyBbXSA6IHt9O1xuXHRmb3IgKCBrZXkgaW4gb2JqICkge1xuXHRcdGlmICggaGFzT3duLmNhbGwoIG9iaiwga2V5ICkgKSB7XG5cdFx0XHR2YWwgPSBvYmpbIGtleSBdO1xuXHRcdFx0dmFsc1sga2V5IF0gPSB2YWwgPT09IE9iamVjdCggdmFsICkgPyBvYmplY3RWYWx1ZXMoIHZhbCApIDogdmFsO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gdmFscztcbn1cblxuZnVuY3Rpb24gZXh0ZW5kKCBhLCBiLCB1bmRlZk9ubHkgKSB7XG5cdGZvciAoIHZhciBwcm9wIGluIGIgKSB7XG5cdFx0aWYgKCBoYXNPd24uY2FsbCggYiwgcHJvcCApICkge1xuXHRcdFx0aWYgKCBiWyBwcm9wIF0gPT09IHVuZGVmaW5lZCApIHtcblx0XHRcdFx0ZGVsZXRlIGFbIHByb3AgXTtcblx0XHRcdH0gZWxzZSBpZiAoICEoIHVuZGVmT25seSAmJiB0eXBlb2YgYVsgcHJvcCBdICE9PSBcInVuZGVmaW5lZFwiICkgKSB7XG5cdFx0XHRcdGFbIHByb3AgXSA9IGJbIHByb3AgXTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gYTtcbn1cblxuZnVuY3Rpb24gb2JqZWN0VHlwZSggb2JqICkge1xuXHRpZiAoIHR5cGVvZiBvYmogPT09IFwidW5kZWZpbmVkXCIgKSB7XG5cdFx0cmV0dXJuIFwidW5kZWZpbmVkXCI7XG5cdH1cblxuXHQvLyBDb25zaWRlcjogdHlwZW9mIG51bGwgPT09IG9iamVjdFxuXHRpZiAoIG9iaiA9PT0gbnVsbCApIHtcblx0XHRyZXR1cm4gXCJudWxsXCI7XG5cdH1cblxuXHR2YXIgbWF0Y2ggPSB0b1N0cmluZy5jYWxsKCBvYmogKS5tYXRjaCggL15cXFtvYmplY3RcXHMoLiopXFxdJC8gKSxcblx0XHR0eXBlID0gbWF0Y2ggJiYgbWF0Y2hbIDEgXTtcblxuXHRzd2l0Y2ggKCB0eXBlICkge1xuXHRcdGNhc2UgXCJOdW1iZXJcIjpcblx0XHRcdGlmICggaXNOYU4oIG9iaiApICkge1xuXHRcdFx0XHRyZXR1cm4gXCJuYW5cIjtcblx0XHRcdH1cblx0XHRcdHJldHVybiBcIm51bWJlclwiO1xuXHRcdGNhc2UgXCJTdHJpbmdcIjpcblx0XHRjYXNlIFwiQm9vbGVhblwiOlxuXHRcdGNhc2UgXCJBcnJheVwiOlxuXHRcdGNhc2UgXCJTZXRcIjpcblx0XHRjYXNlIFwiTWFwXCI6XG5cdFx0Y2FzZSBcIkRhdGVcIjpcblx0XHRjYXNlIFwiUmVnRXhwXCI6XG5cdFx0Y2FzZSBcIkZ1bmN0aW9uXCI6XG5cdFx0Y2FzZSBcIlN5bWJvbFwiOlxuXHRcdFx0cmV0dXJuIHR5cGUudG9Mb3dlckNhc2UoKTtcblx0fVxuXHRpZiAoIHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCIgKSB7XG5cdFx0cmV0dXJuIFwib2JqZWN0XCI7XG5cdH1cbn1cblxuLy8gU2FmZSBvYmplY3QgdHlwZSBjaGVja2luZ1xuZnVuY3Rpb24gaXMoIHR5cGUsIG9iaiApIHtcblx0cmV0dXJuIFFVbml0Lm9iamVjdFR5cGUoIG9iaiApID09PSB0eXBlO1xufVxuXG4vLyBEb2Vzbid0IHN1cHBvcnQgSUU5LCBpdCB3aWxsIHJldHVybiB1bmRlZmluZWQgb24gdGhlc2UgYnJvd3NlcnNcbi8vIFNlZSBhbHNvIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0Vycm9yL1N0YWNrXG5mdW5jdGlvbiBleHRyYWN0U3RhY2t0cmFjZSggZSwgb2Zmc2V0ICkge1xuXHRvZmZzZXQgPSBvZmZzZXQgPT09IHVuZGVmaW5lZCA/IDQgOiBvZmZzZXQ7XG5cblx0dmFyIHN0YWNrLCBpbmNsdWRlLCBpO1xuXG5cdGlmICggZS5zdGFjayApIHtcblx0XHRzdGFjayA9IGUuc3RhY2suc3BsaXQoIFwiXFxuXCIgKTtcblx0XHRpZiAoIC9eZXJyb3IkL2kudGVzdCggc3RhY2tbIDAgXSApICkge1xuXHRcdFx0c3RhY2suc2hpZnQoKTtcblx0XHR9XG5cdFx0aWYgKCBmaWxlTmFtZSApIHtcblx0XHRcdGluY2x1ZGUgPSBbXTtcblx0XHRcdGZvciAoIGkgPSBvZmZzZXQ7IGkgPCBzdGFjay5sZW5ndGg7IGkrKyApIHtcblx0XHRcdFx0aWYgKCBzdGFja1sgaSBdLmluZGV4T2YoIGZpbGVOYW1lICkgIT09IC0xICkge1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGluY2x1ZGUucHVzaCggc3RhY2tbIGkgXSApO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCBpbmNsdWRlLmxlbmd0aCApIHtcblx0XHRcdFx0cmV0dXJuIGluY2x1ZGUuam9pbiggXCJcXG5cIiApO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gc3RhY2tbIG9mZnNldCBdO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHNvdXJjZUZyb21TdGFja3RyYWNlKCBvZmZzZXQgKSB7XG5cdHZhciBlcnJvciA9IG5ldyBFcnJvcigpO1xuXG5cdC8vIFN1cHBvcnQ6IFNhZmFyaSA8PTcgb25seSwgSUUgPD0xMCAtIDExIG9ubHlcblx0Ly8gTm90IGFsbCBicm93c2VycyBnZW5lcmF0ZSB0aGUgYHN0YWNrYCBwcm9wZXJ0eSBmb3IgYG5ldyBFcnJvcigpYCwgc2VlIGFsc28gIzYzNlxuXHRpZiAoICFlcnJvci5zdGFjayApIHtcblx0XHR0cnkge1xuXHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0fSBjYXRjaCAoIGVyciApIHtcblx0XHRcdGVycm9yID0gZXJyO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBleHRyYWN0U3RhY2t0cmFjZSggZXJyb3IsIG9mZnNldCApO1xufVxuXG4vKipcbiAqIENvbmZpZyBvYmplY3Q6IE1haW50YWluIGludGVybmFsIHN0YXRlXG4gKiBMYXRlciBleHBvc2VkIGFzIFFVbml0LmNvbmZpZ1xuICogYGNvbmZpZ2AgaW5pdGlhbGl6ZWQgYXQgdG9wIG9mIHNjb3BlXG4gKi9cbnZhciBjb25maWcgPSB7XG5cblx0Ly8gVGhlIHF1ZXVlIG9mIHRlc3RzIHRvIHJ1blxuXHRxdWV1ZTogW10sXG5cblx0Ly8gQmxvY2sgdW50aWwgZG9jdW1lbnQgcmVhZHlcblx0YmxvY2tpbmc6IHRydWUsXG5cblx0Ly8gQnkgZGVmYXVsdCwgcnVuIHByZXZpb3VzbHkgZmFpbGVkIHRlc3RzIGZpcnN0XG5cdC8vIHZlcnkgdXNlZnVsIGluIGNvbWJpbmF0aW9uIHdpdGggXCJIaWRlIHBhc3NlZCB0ZXN0c1wiIGNoZWNrZWRcblx0cmVvcmRlcjogdHJ1ZSxcblxuXHQvLyBCeSBkZWZhdWx0LCBtb2RpZnkgZG9jdW1lbnQudGl0bGUgd2hlbiBzdWl0ZSBpcyBkb25lXG5cdGFsdGVydGl0bGU6IHRydWUsXG5cblx0Ly8gSFRNTCBSZXBvcnRlcjogY29sbGFwc2UgZXZlcnkgdGVzdCBleGNlcHQgdGhlIGZpcnN0IGZhaWxpbmcgdGVzdFxuXHQvLyBJZiBmYWxzZSwgYWxsIGZhaWxpbmcgdGVzdHMgd2lsbCBiZSBleHBhbmRlZFxuXHRjb2xsYXBzZTogdHJ1ZSxcblxuXHQvLyBCeSBkZWZhdWx0LCBzY3JvbGwgdG8gdG9wIG9mIHRoZSBwYWdlIHdoZW4gc3VpdGUgaXMgZG9uZVxuXHRzY3JvbGx0b3A6IHRydWUsXG5cblx0Ly8gRGVwdGggdXAtdG8gd2hpY2ggb2JqZWN0IHdpbGwgYmUgZHVtcGVkXG5cdG1heERlcHRoOiA1LFxuXG5cdC8vIFdoZW4gZW5hYmxlZCwgYWxsIHRlc3RzIG11c3QgY2FsbCBleHBlY3QoKVxuXHRyZXF1aXJlRXhwZWN0czogZmFsc2UsXG5cblx0Ly8gUGxhY2Vob2xkZXIgZm9yIHVzZXItY29uZmlndXJhYmxlIGZvcm0tZXhwb3NlZCBVUkwgcGFyYW1ldGVyc1xuXHR1cmxDb25maWc6IFtdLFxuXG5cdC8vIFNldCBvZiBhbGwgbW9kdWxlcy5cblx0bW9kdWxlczogW10sXG5cblx0Ly8gU3RhY2sgb2YgbmVzdGVkIG1vZHVsZXNcblx0bW9kdWxlU3RhY2s6IFtdLFxuXG5cdC8vIFRoZSBmaXJzdCB1bm5hbWVkIG1vZHVsZVxuXHRjdXJyZW50TW9kdWxlOiB7XG5cdFx0bmFtZTogXCJcIixcblx0XHR0ZXN0czogW11cblx0fSxcblxuXHRjYWxsYmFja3M6IHt9XG59O1xuXG4vLyBQdXNoIGEgbG9vc2UgdW5uYW1lZCBtb2R1bGUgdG8gdGhlIG1vZHVsZXMgY29sbGVjdGlvblxuY29uZmlnLm1vZHVsZXMucHVzaCggY29uZmlnLmN1cnJlbnRNb2R1bGUgKTtcblxuLy8gUmVnaXN0ZXIgbG9nZ2luZyBjYWxsYmFja3NcbmZ1bmN0aW9uIHJlZ2lzdGVyTG9nZ2luZ0NhbGxiYWNrcyggb2JqICkge1xuXHR2YXIgaSwgbCwga2V5LFxuXHRcdGNhbGxiYWNrTmFtZXMgPSBbIFwiYmVnaW5cIiwgXCJkb25lXCIsIFwibG9nXCIsIFwidGVzdFN0YXJ0XCIsIFwidGVzdERvbmVcIixcblx0XHRcdFwibW9kdWxlU3RhcnRcIiwgXCJtb2R1bGVEb25lXCIgXTtcblxuXHRmdW5jdGlvbiByZWdpc3RlckxvZ2dpbmdDYWxsYmFjaygga2V5ICkge1xuXHRcdHZhciBsb2dnaW5nQ2FsbGJhY2sgPSBmdW5jdGlvbiggY2FsbGJhY2sgKSB7XG5cdFx0XHRpZiAoIG9iamVjdFR5cGUoIGNhbGxiYWNrICkgIT09IFwiZnVuY3Rpb25cIiApIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0XHRcdFwiUVVuaXQgbG9nZ2luZyBtZXRob2RzIHJlcXVpcmUgYSBjYWxsYmFjayBmdW5jdGlvbiBhcyB0aGVpciBmaXJzdCBwYXJhbWV0ZXJzLlwiXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbmZpZy5jYWxsYmFja3NbIGtleSBdLnB1c2goIGNhbGxiYWNrICk7XG5cdFx0fTtcblxuXHRcdHJldHVybiBsb2dnaW5nQ2FsbGJhY2s7XG5cdH1cblxuXHRmb3IgKCBpID0gMCwgbCA9IGNhbGxiYWNrTmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrICkge1xuXHRcdGtleSA9IGNhbGxiYWNrTmFtZXNbIGkgXTtcblxuXHRcdC8vIEluaXRpYWxpemUga2V5IGNvbGxlY3Rpb24gb2YgbG9nZ2luZyBjYWxsYmFja1xuXHRcdGlmICggb2JqZWN0VHlwZSggY29uZmlnLmNhbGxiYWNrc1sga2V5IF0gKSA9PT0gXCJ1bmRlZmluZWRcIiApIHtcblx0XHRcdGNvbmZpZy5jYWxsYmFja3NbIGtleSBdID0gW107XG5cdFx0fVxuXG5cdFx0b2JqWyBrZXkgXSA9IHJlZ2lzdGVyTG9nZ2luZ0NhbGxiYWNrKCBrZXkgKTtcblx0fVxufVxuXG5mdW5jdGlvbiBydW5Mb2dnaW5nQ2FsbGJhY2tzKCBrZXksIGFyZ3MgKSB7XG5cdHZhciBpLCBsLCBjYWxsYmFja3M7XG5cblx0Y2FsbGJhY2tzID0gY29uZmlnLmNhbGxiYWNrc1sga2V5IF07XG5cdGZvciAoIGkgPSAwLCBsID0gY2FsbGJhY2tzLmxlbmd0aDsgaSA8IGw7IGkrKyApIHtcblx0XHRjYWxsYmFja3NbIGkgXSggYXJncyApO1xuXHR9XG59XG5cbiggZnVuY3Rpb24oKSB7XG5cdGlmICggIWRlZmluZWQuZG9jdW1lbnQgKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Ly8gYG9uRXJyb3JGblByZXZgIGluaXRpYWxpemVkIGF0IHRvcCBvZiBzY29wZVxuXHQvLyBQcmVzZXJ2ZSBvdGhlciBoYW5kbGVyc1xuXHR2YXIgb25FcnJvckZuUHJldiA9IHdpbmRvdy5vbmVycm9yO1xuXG5cdC8vIENvdmVyIHVuY2F1Z2h0IGV4Y2VwdGlvbnNcblx0Ly8gUmV0dXJuaW5nIHRydWUgd2lsbCBzdXBwcmVzcyB0aGUgZGVmYXVsdCBicm93c2VyIGhhbmRsZXIsXG5cdC8vIHJldHVybmluZyBmYWxzZSB3aWxsIGxldCBpdCBydW4uXG5cdHdpbmRvdy5vbmVycm9yID0gZnVuY3Rpb24oIGVycm9yLCBmaWxlUGF0aCwgbGluZXJOciApIHtcblx0XHR2YXIgcmV0ID0gZmFsc2U7XG5cdFx0aWYgKCBvbkVycm9yRm5QcmV2ICkge1xuXHRcdFx0cmV0ID0gb25FcnJvckZuUHJldiggZXJyb3IsIGZpbGVQYXRoLCBsaW5lck5yICk7XG5cdFx0fVxuXG5cdFx0Ly8gVHJlYXQgcmV0dXJuIHZhbHVlIGFzIHdpbmRvdy5vbmVycm9yIGl0c2VsZiBkb2VzLFxuXHRcdC8vIE9ubHkgZG8gb3VyIGhhbmRsaW5nIGlmIG5vdCBzdXBwcmVzc2VkLlxuXHRcdGlmICggcmV0ICE9PSB0cnVlICkge1xuXHRcdFx0aWYgKCBRVW5pdC5jb25maWcuY3VycmVudCApIHtcblx0XHRcdFx0aWYgKCBRVW5pdC5jb25maWcuY3VycmVudC5pZ25vcmVHbG9iYWxFcnJvcnMgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0UVVuaXQucHVzaEZhaWx1cmUoIGVycm9yLCBmaWxlUGF0aCArIFwiOlwiICsgbGluZXJOciApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0UVVuaXQudGVzdCggXCJnbG9iYWwgZmFpbHVyZVwiLCBleHRlbmQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFFVbml0LnB1c2hGYWlsdXJlKCBlcnJvciwgZmlsZVBhdGggKyBcIjpcIiArIGxpbmVyTnIgKTtcblx0XHRcdFx0fSwgeyB2YWxpZFRlc3Q6IHRydWUgfSApICk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJldDtcblx0fTtcbn0oKSApO1xuXG4vLyBGaWd1cmUgb3V0IGlmIHdlJ3JlIHJ1bm5pbmcgdGhlIHRlc3RzIGZyb20gYSBzZXJ2ZXIgb3Igbm90XG5RVW5pdC5pc0xvY2FsID0gISggZGVmaW5lZC5kb2N1bWVudCAmJiB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgIT09IFwiZmlsZTpcIiApO1xuXG4vLyBFeHBvc2UgdGhlIGN1cnJlbnQgUVVuaXQgdmVyc2lvblxuUVVuaXQudmVyc2lvbiA9IFwiMi4wLjBcIjtcblxuZXh0ZW5kKCBRVW5pdCwge1xuXG5cdC8vIENhbGwgb24gc3RhcnQgb2YgbW9kdWxlIHRlc3QgdG8gcHJlcGVuZCBuYW1lIHRvIGFsbCB0ZXN0c1xuXHRtb2R1bGU6IGZ1bmN0aW9uKCBuYW1lLCB0ZXN0RW52aXJvbm1lbnQsIGV4ZWN1dGVOb3cgKSB7XG5cdFx0dmFyIG1vZHVsZSwgbW9kdWxlRm5zO1xuXHRcdHZhciBjdXJyZW50TW9kdWxlID0gY29uZmlnLmN1cnJlbnRNb2R1bGU7XG5cblx0XHRpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT09IDIgKSB7XG5cdFx0XHRpZiAoIG9iamVjdFR5cGUoIHRlc3RFbnZpcm9ubWVudCApID09PSBcImZ1bmN0aW9uXCIgKSB7XG5cdFx0XHRcdGV4ZWN1dGVOb3cgPSB0ZXN0RW52aXJvbm1lbnQ7XG5cdFx0XHRcdHRlc3RFbnZpcm9ubWVudCA9IHVuZGVmaW5lZDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRtb2R1bGUgPSBjcmVhdGVNb2R1bGUoKTtcblxuXHRcdGlmICggdGVzdEVudmlyb25tZW50ICYmICggdGVzdEVudmlyb25tZW50LnNldHVwIHx8IHRlc3RFbnZpcm9ubWVudC50ZWFyZG93biApICkge1xuXHRcdFx0Y29uc29sZS53YXJuKFxuXHRcdFx0XHRcIk1vZHVsZSdzIGBzZXR1cGAgYW5kIGB0ZWFyZG93bmAgYXJlIG5vdCBob29rcyBhbnltb3JlIG9uIFFVbml0IDIuMCwgdXNlIFwiICtcblx0XHRcdFx0XCJgYmVmb3JlRWFjaGAgYW5kIGBhZnRlckVhY2hgIGluc3RlYWRcXG5cIiArXG5cdFx0XHRcdFwiRGV0YWlscyBpbiBvdXIgdXBncmFkZSBndWlkZSBhdCBodHRwczovL3F1bml0anMuY29tL3VwZ3JhZGUtZ3VpZGUtMi54L1wiXG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdG1vZHVsZUZucyA9IHtcblx0XHRcdGJlZm9yZTogc2V0SG9vayggbW9kdWxlLCBcImJlZm9yZVwiICksXG5cdFx0XHRiZWZvcmVFYWNoOiBzZXRIb29rKCBtb2R1bGUsIFwiYmVmb3JlRWFjaFwiICksXG5cdFx0XHRhZnRlckVhY2g6IHNldEhvb2soIG1vZHVsZSwgXCJhZnRlckVhY2hcIiApLFxuXHRcdFx0YWZ0ZXI6IHNldEhvb2soIG1vZHVsZSwgXCJhZnRlclwiIClcblx0XHR9O1xuXG5cdFx0aWYgKCBvYmplY3RUeXBlKCBleGVjdXRlTm93ICkgPT09IFwiZnVuY3Rpb25cIiApIHtcblx0XHRcdGNvbmZpZy5tb2R1bGVTdGFjay5wdXNoKCBtb2R1bGUgKTtcblx0XHRcdHNldEN1cnJlbnRNb2R1bGUoIG1vZHVsZSApO1xuXHRcdFx0ZXhlY3V0ZU5vdy5jYWxsKCBtb2R1bGUudGVzdEVudmlyb25tZW50LCBtb2R1bGVGbnMgKTtcblx0XHRcdGNvbmZpZy5tb2R1bGVTdGFjay5wb3AoKTtcblx0XHRcdG1vZHVsZSA9IG1vZHVsZS5wYXJlbnRNb2R1bGUgfHwgY3VycmVudE1vZHVsZTtcblx0XHR9XG5cblx0XHRzZXRDdXJyZW50TW9kdWxlKCBtb2R1bGUgKTtcblxuXHRcdGZ1bmN0aW9uIGNyZWF0ZU1vZHVsZSgpIHtcblx0XHRcdHZhciBwYXJlbnRNb2R1bGUgPSBjb25maWcubW9kdWxlU3RhY2subGVuZ3RoID9cblx0XHRcdFx0Y29uZmlnLm1vZHVsZVN0YWNrLnNsaWNlKCAtMSApWyAwIF0gOiBudWxsO1xuXHRcdFx0dmFyIG1vZHVsZU5hbWUgPSBwYXJlbnRNb2R1bGUgIT09IG51bGwgP1xuXHRcdFx0XHRbIHBhcmVudE1vZHVsZS5uYW1lLCBuYW1lIF0uam9pbiggXCIgPiBcIiApIDogbmFtZTtcblx0XHRcdHZhciBtb2R1bGUgPSB7XG5cdFx0XHRcdG5hbWU6IG1vZHVsZU5hbWUsXG5cdFx0XHRcdHBhcmVudE1vZHVsZTogcGFyZW50TW9kdWxlLFxuXHRcdFx0XHR0ZXN0czogW10sXG5cdFx0XHRcdG1vZHVsZUlkOiBnZW5lcmF0ZUhhc2goIG1vZHVsZU5hbWUgKSxcblx0XHRcdFx0dGVzdHNSdW46IDBcblx0XHRcdH07XG5cblx0XHRcdHZhciBlbnYgPSB7fTtcblx0XHRcdGlmICggcGFyZW50TW9kdWxlICkge1xuXHRcdFx0XHRwYXJlbnRNb2R1bGUuY2hpbGRNb2R1bGUgPSBtb2R1bGU7XG5cdFx0XHRcdGV4dGVuZCggZW52LCBwYXJlbnRNb2R1bGUudGVzdEVudmlyb25tZW50ICk7XG5cdFx0XHRcdGRlbGV0ZSBlbnYuYmVmb3JlRWFjaDtcblx0XHRcdFx0ZGVsZXRlIGVudi5hZnRlckVhY2g7XG5cdFx0XHR9XG5cdFx0XHRleHRlbmQoIGVudiwgdGVzdEVudmlyb25tZW50ICk7XG5cdFx0XHRtb2R1bGUudGVzdEVudmlyb25tZW50ID0gZW52O1xuXG5cdFx0XHRjb25maWcubW9kdWxlcy5wdXNoKCBtb2R1bGUgKTtcblx0XHRcdHJldHVybiBtb2R1bGU7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gc2V0Q3VycmVudE1vZHVsZSggbW9kdWxlICkge1xuXHRcdFx0Y29uZmlnLmN1cnJlbnRNb2R1bGUgPSBtb2R1bGU7XG5cdFx0fVxuXG5cdH0sXG5cblx0dGVzdDogdGVzdCxcblxuXHRza2lwOiBza2lwLFxuXG5cdG9ubHk6IG9ubHksXG5cblx0c3RhcnQ6IGZ1bmN0aW9uKCBjb3VudCApIHtcblx0XHR2YXIgZ2xvYmFsU3RhcnRBbHJlYWR5Q2FsbGVkID0gZ2xvYmFsU3RhcnRDYWxsZWQ7XG5cblx0XHRpZiAoICFjb25maWcuY3VycmVudCApIHtcblx0XHRcdGdsb2JhbFN0YXJ0Q2FsbGVkID0gdHJ1ZTtcblxuXHRcdFx0aWYgKCBydW5TdGFydGVkICkge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoIFwiQ2FsbGVkIHN0YXJ0KCkgd2hpbGUgdGVzdCBhbHJlYWR5IHN0YXJ0ZWQgcnVubmluZ1wiICk7XG5cdFx0XHR9IGVsc2UgaWYgKCBnbG9iYWxTdGFydEFscmVhZHlDYWxsZWQgfHwgY291bnQgPiAxICkge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoIFwiQ2FsbGVkIHN0YXJ0KCkgb3V0c2lkZSBvZiBhIHRlc3QgY29udGV4dCB0b28gbWFueSB0aW1lc1wiICk7XG5cdFx0XHR9IGVsc2UgaWYgKCBjb25maWcuYXV0b3N0YXJ0ICkge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoIFwiQ2FsbGVkIHN0YXJ0KCkgb3V0c2lkZSBvZiBhIHRlc3QgY29udGV4dCB3aGVuIFwiICtcblx0XHRcdFx0XHRcIlFVbml0LmNvbmZpZy5hdXRvc3RhcnQgd2FzIHRydWVcIiApO1xuXHRcdFx0fSBlbHNlIGlmICggIWNvbmZpZy5wYWdlTG9hZGVkICkge1xuXG5cdFx0XHRcdC8vIFRoZSBwYWdlIGlzbid0IGNvbXBsZXRlbHkgbG9hZGVkIHlldCwgc28gYmFpbCBvdXQgYW5kIGxldCBgUVVuaXQubG9hZGAgaGFuZGxlIGl0XG5cdFx0XHRcdGNvbmZpZy5hdXRvc3RhcnQgPSB0cnVlO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdFx0XCJRVW5pdC5zdGFydCBjYW5ub3QgYmUgY2FsbGVkIGluc2lkZSBhIHRlc3QgY29udGV4dC4gVGhpcyBmZWF0dXJlIGlzIHJlbW92ZWQgaW4gXCIgK1xuXHRcdFx0XHRcIlFVbml0IDIuMC4gRm9yIGFzeW5jIHRlc3RzLCB1c2UgUVVuaXQudGVzdCgpIHdpdGggYXNzZXJ0LmFzeW5jKCkgaW5zdGVhZC5cXG5cIiArXG5cdFx0XHRcdFwiRGV0YWlscyBpbiBvdXIgdXBncmFkZSBndWlkZSBhdCBodHRwczovL3F1bml0anMuY29tL3VwZ3JhZGUtZ3VpZGUtMi54L1wiXG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdHJlc3VtZVByb2Nlc3NpbmcoKTtcblx0fSxcblxuXHRjb25maWc6IGNvbmZpZyxcblxuXHRpczogaXMsXG5cblx0b2JqZWN0VHlwZTogb2JqZWN0VHlwZSxcblxuXHRleHRlbmQ6IGV4dGVuZCxcblxuXHRsb2FkOiBmdW5jdGlvbigpIHtcblx0XHRjb25maWcucGFnZUxvYWRlZCA9IHRydWU7XG5cblx0XHQvLyBJbml0aWFsaXplIHRoZSBjb25maWd1cmF0aW9uIG9wdGlvbnNcblx0XHRleHRlbmQoIGNvbmZpZywge1xuXHRcdFx0c3RhdHM6IHsgYWxsOiAwLCBiYWQ6IDAgfSxcblx0XHRcdG1vZHVsZVN0YXRzOiB7IGFsbDogMCwgYmFkOiAwIH0sXG5cdFx0XHRzdGFydGVkOiAwLFxuXHRcdFx0dXBkYXRlUmF0ZTogMTAwMCxcblx0XHRcdGF1dG9zdGFydDogdHJ1ZSxcblx0XHRcdGZpbHRlcjogXCJcIlxuXHRcdH0sIHRydWUgKTtcblxuXHRcdGNvbmZpZy5ibG9ja2luZyA9IGZhbHNlO1xuXG5cdFx0aWYgKCBjb25maWcuYXV0b3N0YXJ0ICkge1xuXHRcdFx0cmVzdW1lUHJvY2Vzc2luZygpO1xuXHRcdH1cblx0fSxcblxuXHRzdGFjazogZnVuY3Rpb24oIG9mZnNldCApIHtcblx0XHRvZmZzZXQgPSAoIG9mZnNldCB8fCAwICkgKyAyO1xuXHRcdHJldHVybiBzb3VyY2VGcm9tU3RhY2t0cmFjZSggb2Zmc2V0ICk7XG5cdH1cbn0gKTtcblxucmVnaXN0ZXJMb2dnaW5nQ2FsbGJhY2tzKCBRVW5pdCApO1xuXG5mdW5jdGlvbiBiZWdpbigpIHtcblx0dmFyIGksIGwsXG5cdFx0bW9kdWxlc0xvZyA9IFtdO1xuXG5cdC8vIElmIHRoZSB0ZXN0IHJ1biBoYXNuJ3Qgb2ZmaWNpYWxseSBiZWd1biB5ZXRcblx0aWYgKCAhY29uZmlnLnN0YXJ0ZWQgKSB7XG5cblx0XHQvLyBSZWNvcmQgdGhlIHRpbWUgb2YgdGhlIHRlc3QgcnVuJ3MgYmVnaW5uaW5nXG5cdFx0Y29uZmlnLnN0YXJ0ZWQgPSBub3coKTtcblxuXHRcdC8vIERlbGV0ZSB0aGUgbG9vc2UgdW5uYW1lZCBtb2R1bGUgaWYgdW51c2VkLlxuXHRcdGlmICggY29uZmlnLm1vZHVsZXNbIDAgXS5uYW1lID09PSBcIlwiICYmIGNvbmZpZy5tb2R1bGVzWyAwIF0udGVzdHMubGVuZ3RoID09PSAwICkge1xuXHRcdFx0Y29uZmlnLm1vZHVsZXMuc2hpZnQoKTtcblx0XHR9XG5cblx0XHQvLyBBdm9pZCB1bm5lY2Vzc2FyeSBpbmZvcm1hdGlvbiBieSBub3QgbG9nZ2luZyBtb2R1bGVzJyB0ZXN0IGVudmlyb25tZW50c1xuXHRcdGZvciAoIGkgPSAwLCBsID0gY29uZmlnLm1vZHVsZXMubGVuZ3RoOyBpIDwgbDsgaSsrICkge1xuXHRcdFx0bW9kdWxlc0xvZy5wdXNoKCB7XG5cdFx0XHRcdG5hbWU6IGNvbmZpZy5tb2R1bGVzWyBpIF0ubmFtZSxcblx0XHRcdFx0dGVzdHM6IGNvbmZpZy5tb2R1bGVzWyBpIF0udGVzdHNcblx0XHRcdH0gKTtcblx0XHR9XG5cblx0XHQvLyBUaGUgdGVzdCBydW4gaXMgb2ZmaWNpYWxseSBiZWdpbm5pbmcgbm93XG5cdFx0cnVuTG9nZ2luZ0NhbGxiYWNrcyggXCJiZWdpblwiLCB7XG5cdFx0XHR0b3RhbFRlc3RzOiBUZXN0LmNvdW50LFxuXHRcdFx0bW9kdWxlczogbW9kdWxlc0xvZ1xuXHRcdH0gKTtcblx0fVxuXG5cdGNvbmZpZy5ibG9ja2luZyA9IGZhbHNlO1xuXHRwcm9jZXNzKCB0cnVlICk7XG59XG5cbmZ1bmN0aW9uIHByb2Nlc3MoIGxhc3QgKSB7XG5cdGZ1bmN0aW9uIG5leHQoKSB7XG5cdFx0cHJvY2VzcyggbGFzdCApO1xuXHR9XG5cdHZhciBzdGFydCA9IG5vdygpO1xuXHRjb25maWcuZGVwdGggPSAoIGNvbmZpZy5kZXB0aCB8fCAwICkgKyAxO1xuXG5cdHdoaWxlICggY29uZmlnLnF1ZXVlLmxlbmd0aCAmJiAhY29uZmlnLmJsb2NraW5nICkge1xuXHRcdGlmICggIWRlZmluZWQuc2V0VGltZW91dCB8fCBjb25maWcudXBkYXRlUmF0ZSA8PSAwIHx8XG5cdFx0XHRcdCggKCBub3coKSAtIHN0YXJ0ICkgPCBjb25maWcudXBkYXRlUmF0ZSApICkge1xuXHRcdFx0aWYgKCBjb25maWcuY3VycmVudCApIHtcblxuXHRcdFx0XHQvLyBSZXNldCBhc3luYyB0cmFja2luZyBmb3IgZWFjaCBwaGFzZSBvZiB0aGUgVGVzdCBsaWZlY3ljbGVcblx0XHRcdFx0Y29uZmlnLmN1cnJlbnQudXNlZEFzeW5jID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRjb25maWcucXVldWUuc2hpZnQoKSgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZXRUaW1lb3V0KCBuZXh0LCAxMyApO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9XG5cdGNvbmZpZy5kZXB0aC0tO1xuXHRpZiAoIGxhc3QgJiYgIWNvbmZpZy5ibG9ja2luZyAmJiAhY29uZmlnLnF1ZXVlLmxlbmd0aCAmJiBjb25maWcuZGVwdGggPT09IDAgKSB7XG5cdFx0ZG9uZSgpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHBhdXNlUHJvY2Vzc2luZyggdGVzdCApIHtcblx0Y29uZmlnLmJsb2NraW5nID0gdHJ1ZTtcblxuXHRpZiAoIGNvbmZpZy50ZXN0VGltZW91dCAmJiBkZWZpbmVkLnNldFRpbWVvdXQgKSB7XG5cdFx0Y2xlYXJUaW1lb3V0KCBjb25maWcudGltZW91dCApO1xuXHRcdGNvbmZpZy50aW1lb3V0ID0gc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHR0ZXN0LnNlbWFwaG9yZSA9IDA7XG5cdFx0XHRRVW5pdC5wdXNoRmFpbHVyZSggXCJUZXN0IHRpbWVkIG91dFwiLCBzb3VyY2VGcm9tU3RhY2t0cmFjZSggMiApICk7XG5cdFx0XHRyZXN1bWVQcm9jZXNzaW5nKCB0ZXN0ICk7XG5cdFx0fSwgY29uZmlnLnRlc3RUaW1lb3V0ICk7XG5cdH1cbn1cblxuZnVuY3Rpb24gcmVzdW1lUHJvY2Vzc2luZyggdGVzdCApIHtcblx0cnVuU3RhcnRlZCA9IHRydWU7XG5cblx0Ly8gQSBzbGlnaHQgZGVsYXkgdG8gYWxsb3cgdGhpcyBpdGVyYXRpb24gb2YgdGhlIGV2ZW50IGxvb3AgdG8gZmluaXNoIChtb3JlIGFzc2VydGlvbnMsIGV0Yy4pXG5cdGlmICggZGVmaW5lZC5zZXRUaW1lb3V0ICkge1xuXHRcdHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGN1cnJlbnQgPSB0ZXN0IHx8IGNvbmZpZy5jdXJyZW50O1xuXHRcdFx0aWYgKCBjdXJyZW50ICYmICggY3VycmVudC5zZW1hcGhvcmUgPiAwIHx8IGN1cnJlbnQucmVzdW1lZCApICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGlmICggY29uZmlnLnRpbWVvdXQgKSB7XG5cdFx0XHRcdGNsZWFyVGltZW91dCggY29uZmlnLnRpbWVvdXQgKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCBjdXJyZW50ICkge1xuXHRcdFx0XHRjdXJyZW50LnJlc3VtZWQgPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRiZWdpbigpO1xuXHRcdH0sIDEzICk7XG5cdH0gZWxzZSB7XG5cdFx0YmVnaW4oKTtcblx0fVxufVxuXG5mdW5jdGlvbiBkb25lKCkge1xuXHR2YXIgcnVudGltZSwgcGFzc2VkO1xuXG5cdGF1dG9ydW4gPSB0cnVlO1xuXG5cdC8vIExvZyB0aGUgbGFzdCBtb2R1bGUgcmVzdWx0c1xuXHRpZiAoIGNvbmZpZy5wcmV2aW91c01vZHVsZSApIHtcblx0XHRydW5Mb2dnaW5nQ2FsbGJhY2tzKCBcIm1vZHVsZURvbmVcIiwge1xuXHRcdFx0bmFtZTogY29uZmlnLnByZXZpb3VzTW9kdWxlLm5hbWUsXG5cdFx0XHR0ZXN0czogY29uZmlnLnByZXZpb3VzTW9kdWxlLnRlc3RzLFxuXHRcdFx0ZmFpbGVkOiBjb25maWcubW9kdWxlU3RhdHMuYmFkLFxuXHRcdFx0cGFzc2VkOiBjb25maWcubW9kdWxlU3RhdHMuYWxsIC0gY29uZmlnLm1vZHVsZVN0YXRzLmJhZCxcblx0XHRcdHRvdGFsOiBjb25maWcubW9kdWxlU3RhdHMuYWxsLFxuXHRcdFx0cnVudGltZTogbm93KCkgLSBjb25maWcubW9kdWxlU3RhdHMuc3RhcnRlZFxuXHRcdH0gKTtcblx0fVxuXHRkZWxldGUgY29uZmlnLnByZXZpb3VzTW9kdWxlO1xuXG5cdHJ1bnRpbWUgPSBub3coKSAtIGNvbmZpZy5zdGFydGVkO1xuXHRwYXNzZWQgPSBjb25maWcuc3RhdHMuYWxsIC0gY29uZmlnLnN0YXRzLmJhZDtcblxuXHRydW5Mb2dnaW5nQ2FsbGJhY2tzKCBcImRvbmVcIiwge1xuXHRcdGZhaWxlZDogY29uZmlnLnN0YXRzLmJhZCxcblx0XHRwYXNzZWQ6IHBhc3NlZCxcblx0XHR0b3RhbDogY29uZmlnLnN0YXRzLmFsbCxcblx0XHRydW50aW1lOiBydW50aW1lXG5cdH0gKTtcbn1cblxuZnVuY3Rpb24gc2V0SG9vayggbW9kdWxlLCBob29rTmFtZSApIHtcblx0aWYgKCBtb2R1bGUudGVzdEVudmlyb25tZW50ID09PSB1bmRlZmluZWQgKSB7XG5cdFx0bW9kdWxlLnRlc3RFbnZpcm9ubWVudCA9IHt9O1xuXHR9XG5cblx0cmV0dXJuIGZ1bmN0aW9uKCBjYWxsYmFjayApIHtcblx0XHRtb2R1bGUudGVzdEVudmlyb25tZW50WyBob29rTmFtZSBdID0gY2FsbGJhY2s7XG5cdH07XG59XG5cbnZhciB1bml0U2FtcGxlcixcblx0Zm9jdXNlZCA9IGZhbHNlLFxuXHRwcmlvcml0eUNvdW50ID0gMDtcblxuZnVuY3Rpb24gVGVzdCggc2V0dGluZ3MgKSB7XG5cdHZhciBpLCBsO1xuXG5cdCsrVGVzdC5jb3VudDtcblxuXHR0aGlzLmV4cGVjdGVkID0gbnVsbDtcblx0ZXh0ZW5kKCB0aGlzLCBzZXR0aW5ncyApO1xuXHR0aGlzLmFzc2VydGlvbnMgPSBbXTtcblx0dGhpcy5zZW1hcGhvcmUgPSAwO1xuXHR0aGlzLnVzZWRBc3luYyA9IGZhbHNlO1xuXHR0aGlzLm1vZHVsZSA9IGNvbmZpZy5jdXJyZW50TW9kdWxlO1xuXHR0aGlzLnN0YWNrID0gc291cmNlRnJvbVN0YWNrdHJhY2UoIDMgKTtcblxuXHQvLyBSZWdpc3RlciB1bmlxdWUgc3RyaW5nc1xuXHRmb3IgKCBpID0gMCwgbCA9IHRoaXMubW9kdWxlLnRlc3RzOyBpIDwgbC5sZW5ndGg7IGkrKyApIHtcblx0XHRpZiAoIHRoaXMubW9kdWxlLnRlc3RzWyBpIF0ubmFtZSA9PT0gdGhpcy50ZXN0TmFtZSApIHtcblx0XHRcdHRoaXMudGVzdE5hbWUgKz0gXCIgXCI7XG5cdFx0fVxuXHR9XG5cblx0dGhpcy50ZXN0SWQgPSBnZW5lcmF0ZUhhc2goIHRoaXMubW9kdWxlLm5hbWUsIHRoaXMudGVzdE5hbWUgKTtcblxuXHR0aGlzLm1vZHVsZS50ZXN0cy5wdXNoKCB7XG5cdFx0bmFtZTogdGhpcy50ZXN0TmFtZSxcblx0XHR0ZXN0SWQ6IHRoaXMudGVzdElkXG5cdH0gKTtcblxuXHRpZiAoIHNldHRpbmdzLnNraXAgKSB7XG5cblx0XHQvLyBTa2lwcGVkIHRlc3RzIHdpbGwgZnVsbHkgaWdub3JlIGFueSBzZW50IGNhbGxiYWNrXG5cdFx0dGhpcy5jYWxsYmFjayA9IGZ1bmN0aW9uKCkge307XG5cdFx0dGhpcy5hc3luYyA9IGZhbHNlO1xuXHRcdHRoaXMuZXhwZWN0ZWQgPSAwO1xuXHR9IGVsc2Uge1xuXHRcdHRoaXMuYXNzZXJ0ID0gbmV3IEFzc2VydCggdGhpcyApO1xuXHR9XG59XG5cblRlc3QuY291bnQgPSAwO1xuXG5UZXN0LnByb3RvdHlwZSA9IHtcblx0YmVmb3JlOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoXG5cblx0XHRcdC8vIEVtaXQgbW9kdWxlU3RhcnQgd2hlbiB3ZSdyZSBzd2l0Y2hpbmcgZnJvbSBvbmUgbW9kdWxlIHRvIGFub3RoZXJcblx0XHRcdHRoaXMubW9kdWxlICE9PSBjb25maWcucHJldmlvdXNNb2R1bGUgfHxcblxuXHRcdFx0XHQvLyBUaGV5IGNvdWxkIGJlIGVxdWFsIChib3RoIHVuZGVmaW5lZCkgYnV0IGlmIHRoZSBwcmV2aW91c01vZHVsZSBwcm9wZXJ0eSBkb2Vzbid0XG5cdFx0XHRcdC8vIHlldCBleGlzdCBpdCBtZWFucyB0aGlzIGlzIHRoZSBmaXJzdCB0ZXN0IGluIGEgc3VpdGUgdGhhdCBpc24ndCB3cmFwcGVkIGluIGFcblx0XHRcdFx0Ly8gbW9kdWxlLCBpbiB3aGljaCBjYXNlIHdlJ2xsIGp1c3QgZW1pdCBhIG1vZHVsZVN0YXJ0IGV2ZW50IGZvciAndW5kZWZpbmVkJy5cblx0XHRcdFx0Ly8gV2l0aG91dCB0aGlzLCByZXBvcnRlcnMgY2FuIGdldCB0ZXN0U3RhcnQgYmVmb3JlIG1vZHVsZVN0YXJ0ICB3aGljaCBpcyBhIHByb2JsZW0uXG5cdFx0XHRcdCFoYXNPd24uY2FsbCggY29uZmlnLCBcInByZXZpb3VzTW9kdWxlXCIgKVxuXHRcdCkge1xuXHRcdFx0aWYgKCBoYXNPd24uY2FsbCggY29uZmlnLCBcInByZXZpb3VzTW9kdWxlXCIgKSApIHtcblx0XHRcdFx0cnVuTG9nZ2luZ0NhbGxiYWNrcyggXCJtb2R1bGVEb25lXCIsIHtcblx0XHRcdFx0XHRuYW1lOiBjb25maWcucHJldmlvdXNNb2R1bGUubmFtZSxcblx0XHRcdFx0XHR0ZXN0czogY29uZmlnLnByZXZpb3VzTW9kdWxlLnRlc3RzLFxuXHRcdFx0XHRcdGZhaWxlZDogY29uZmlnLm1vZHVsZVN0YXRzLmJhZCxcblx0XHRcdFx0XHRwYXNzZWQ6IGNvbmZpZy5tb2R1bGVTdGF0cy5hbGwgLSBjb25maWcubW9kdWxlU3RhdHMuYmFkLFxuXHRcdFx0XHRcdHRvdGFsOiBjb25maWcubW9kdWxlU3RhdHMuYWxsLFxuXHRcdFx0XHRcdHJ1bnRpbWU6IG5vdygpIC0gY29uZmlnLm1vZHVsZVN0YXRzLnN0YXJ0ZWRcblx0XHRcdFx0fSApO1xuXHRcdFx0fVxuXHRcdFx0Y29uZmlnLnByZXZpb3VzTW9kdWxlID0gdGhpcy5tb2R1bGU7XG5cdFx0XHRjb25maWcubW9kdWxlU3RhdHMgPSB7IGFsbDogMCwgYmFkOiAwLCBzdGFydGVkOiBub3coKSB9O1xuXHRcdFx0cnVuTG9nZ2luZ0NhbGxiYWNrcyggXCJtb2R1bGVTdGFydFwiLCB7XG5cdFx0XHRcdG5hbWU6IHRoaXMubW9kdWxlLm5hbWUsXG5cdFx0XHRcdHRlc3RzOiB0aGlzLm1vZHVsZS50ZXN0c1xuXHRcdFx0fSApO1xuXHRcdH1cblxuXHRcdGNvbmZpZy5jdXJyZW50ID0gdGhpcztcblxuXHRcdGlmICggdGhpcy5tb2R1bGUudGVzdEVudmlyb25tZW50ICkge1xuXHRcdFx0ZGVsZXRlIHRoaXMubW9kdWxlLnRlc3RFbnZpcm9ubWVudC5iZWZvcmU7XG5cdFx0XHRkZWxldGUgdGhpcy5tb2R1bGUudGVzdEVudmlyb25tZW50LmJlZm9yZUVhY2g7XG5cdFx0XHRkZWxldGUgdGhpcy5tb2R1bGUudGVzdEVudmlyb25tZW50LmFmdGVyRWFjaDtcblx0XHRcdGRlbGV0ZSB0aGlzLm1vZHVsZS50ZXN0RW52aXJvbm1lbnQuYWZ0ZXI7XG5cdFx0fVxuXHRcdHRoaXMudGVzdEVudmlyb25tZW50ID0gZXh0ZW5kKCB7fSwgdGhpcy5tb2R1bGUudGVzdEVudmlyb25tZW50ICk7XG5cblx0XHR0aGlzLnN0YXJ0ZWQgPSBub3coKTtcblx0XHRydW5Mb2dnaW5nQ2FsbGJhY2tzKCBcInRlc3RTdGFydFwiLCB7XG5cdFx0XHRuYW1lOiB0aGlzLnRlc3ROYW1lLFxuXHRcdFx0bW9kdWxlOiB0aGlzLm1vZHVsZS5uYW1lLFxuXHRcdFx0dGVzdElkOiB0aGlzLnRlc3RJZFxuXHRcdH0gKTtcblxuXHRcdGlmICggIWNvbmZpZy5wb2xsdXRpb24gKSB7XG5cdFx0XHRzYXZlR2xvYmFsKCk7XG5cdFx0fVxuXHR9LFxuXG5cdHJ1bjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHByb21pc2U7XG5cblx0XHRjb25maWcuY3VycmVudCA9IHRoaXM7XG5cblx0XHRpZiAoIHRoaXMuYXN5bmMgKSB7XG5cdFx0XHRpbnRlcm5hbFN0b3AoIHRoaXMgKTtcblx0XHR9XG5cblx0XHR0aGlzLmNhbGxiYWNrU3RhcnRlZCA9IG5vdygpO1xuXG5cdFx0aWYgKCBjb25maWcubm90cnljYXRjaCApIHtcblx0XHRcdHJ1blRlc3QoIHRoaXMgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0cnVuVGVzdCggdGhpcyApO1xuXHRcdH0gY2F0Y2ggKCBlICkge1xuXHRcdFx0dGhpcy5wdXNoRmFpbHVyZSggXCJEaWVkIG9uIHRlc3QgI1wiICsgKCB0aGlzLmFzc2VydGlvbnMubGVuZ3RoICsgMSApICsgXCIgXCIgK1xuXHRcdFx0XHR0aGlzLnN0YWNrICsgXCI6IFwiICsgKCBlLm1lc3NhZ2UgfHwgZSApLCBleHRyYWN0U3RhY2t0cmFjZSggZSwgMCApICk7XG5cblx0XHRcdC8vIEVsc2UgbmV4dCB0ZXN0IHdpbGwgY2FycnkgdGhlIHJlc3BvbnNpYmlsaXR5XG5cdFx0XHRzYXZlR2xvYmFsKCk7XG5cblx0XHRcdC8vIFJlc3RhcnQgdGhlIHRlc3RzIGlmIHRoZXkncmUgYmxvY2tpbmdcblx0XHRcdGlmICggY29uZmlnLmJsb2NraW5nICkge1xuXHRcdFx0XHRpbnRlcm5hbFN0YXJ0KCB0aGlzICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gcnVuVGVzdCggdGVzdCApIHtcblx0XHRcdHByb21pc2UgPSB0ZXN0LmNhbGxiYWNrLmNhbGwoIHRlc3QudGVzdEVudmlyb25tZW50LCB0ZXN0LmFzc2VydCApO1xuXHRcdFx0dGVzdC5yZXNvbHZlUHJvbWlzZSggcHJvbWlzZSApO1xuXHRcdH1cblx0fSxcblxuXHRhZnRlcjogZnVuY3Rpb24oKSB7XG5cdFx0Y2hlY2tQb2xsdXRpb24oKTtcblx0fSxcblxuXHRxdWV1ZUhvb2s6IGZ1bmN0aW9uKCBob29rLCBob29rTmFtZSwgaG9va093bmVyICkge1xuXHRcdHZhciBwcm9taXNlLFxuXHRcdFx0dGVzdCA9IHRoaXM7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIHJ1bkhvb2soKSB7XG5cdFx0XHRpZiAoIGhvb2tOYW1lID09PSBcImJlZm9yZVwiICkge1xuXHRcdFx0XHRpZiAoIGhvb2tPd25lci50ZXN0c1J1biAhPT0gMCApIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0ZXN0LnByZXNlcnZlRW52aXJvbm1lbnQgPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIGhvb2tOYW1lID09PSBcImFmdGVyXCIgJiYgaG9va093bmVyLnRlc3RzUnVuICE9PSBudW1iZXJPZlRlc3RzKCBob29rT3duZXIgKSAtIDEgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Y29uZmlnLmN1cnJlbnQgPSB0ZXN0O1xuXHRcdFx0aWYgKCBjb25maWcubm90cnljYXRjaCApIHtcblx0XHRcdFx0Y2FsbEhvb2soKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y2FsbEhvb2soKTtcblx0XHRcdH0gY2F0Y2ggKCBlcnJvciApIHtcblx0XHRcdFx0dGVzdC5wdXNoRmFpbHVyZSggaG9va05hbWUgKyBcIiBmYWlsZWQgb24gXCIgKyB0ZXN0LnRlc3ROYW1lICsgXCI6IFwiICtcblx0XHRcdFx0KCBlcnJvci5tZXNzYWdlIHx8IGVycm9yICksIGV4dHJhY3RTdGFja3RyYWNlKCBlcnJvciwgMCApICk7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIGNhbGxIb29rKCkge1xuXHRcdFx0XHRwcm9taXNlID0gaG9vay5jYWxsKCB0ZXN0LnRlc3RFbnZpcm9ubWVudCwgdGVzdC5hc3NlcnQgKTtcblx0XHRcdFx0dGVzdC5yZXNvbHZlUHJvbWlzZSggcHJvbWlzZSwgaG9va05hbWUgKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIEN1cnJlbnRseSBvbmx5IHVzZWQgZm9yIG1vZHVsZSBsZXZlbCBob29rcywgY2FuIGJlIHVzZWQgdG8gYWRkIGdsb2JhbCBsZXZlbCBvbmVzXG5cdGhvb2tzOiBmdW5jdGlvbiggaGFuZGxlciApIHtcblx0XHR2YXIgaG9va3MgPSBbXTtcblxuXHRcdGZ1bmN0aW9uIHByb2Nlc3NIb29rcyggdGVzdCwgbW9kdWxlICkge1xuXHRcdFx0aWYgKCBtb2R1bGUucGFyZW50TW9kdWxlICkge1xuXHRcdFx0XHRwcm9jZXNzSG9va3MoIHRlc3QsIG1vZHVsZS5wYXJlbnRNb2R1bGUgKTtcblx0XHRcdH1cblx0XHRcdGlmICggbW9kdWxlLnRlc3RFbnZpcm9ubWVudCAmJlxuXHRcdFx0XHRRVW5pdC5vYmplY3RUeXBlKCBtb2R1bGUudGVzdEVudmlyb25tZW50WyBoYW5kbGVyIF0gKSA9PT0gXCJmdW5jdGlvblwiICkge1xuXHRcdFx0XHRob29rcy5wdXNoKCB0ZXN0LnF1ZXVlSG9vayggbW9kdWxlLnRlc3RFbnZpcm9ubWVudFsgaGFuZGxlciBdLCBoYW5kbGVyLCBtb2R1bGUgKSApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIEhvb2tzIGFyZSBpZ25vcmVkIG9uIHNraXBwZWQgdGVzdHNcblx0XHRpZiAoICF0aGlzLnNraXAgKSB7XG5cdFx0XHRwcm9jZXNzSG9va3MoIHRoaXMsIHRoaXMubW9kdWxlICk7XG5cdFx0fVxuXHRcdHJldHVybiBob29rcztcblx0fSxcblxuXHRmaW5pc2g6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbmZpZy5jdXJyZW50ID0gdGhpcztcblx0XHRpZiAoIGNvbmZpZy5yZXF1aXJlRXhwZWN0cyAmJiB0aGlzLmV4cGVjdGVkID09PSBudWxsICkge1xuXHRcdFx0dGhpcy5wdXNoRmFpbHVyZSggXCJFeHBlY3RlZCBudW1iZXIgb2YgYXNzZXJ0aW9ucyB0byBiZSBkZWZpbmVkLCBidXQgZXhwZWN0KCkgd2FzIFwiICtcblx0XHRcdFx0XCJub3QgY2FsbGVkLlwiLCB0aGlzLnN0YWNrICk7XG5cdFx0fSBlbHNlIGlmICggdGhpcy5leHBlY3RlZCAhPT0gbnVsbCAmJiB0aGlzLmV4cGVjdGVkICE9PSB0aGlzLmFzc2VydGlvbnMubGVuZ3RoICkge1xuXHRcdFx0dGhpcy5wdXNoRmFpbHVyZSggXCJFeHBlY3RlZCBcIiArIHRoaXMuZXhwZWN0ZWQgKyBcIiBhc3NlcnRpb25zLCBidXQgXCIgK1xuXHRcdFx0XHR0aGlzLmFzc2VydGlvbnMubGVuZ3RoICsgXCIgd2VyZSBydW5cIiwgdGhpcy5zdGFjayApO1xuXHRcdH0gZWxzZSBpZiAoIHRoaXMuZXhwZWN0ZWQgPT09IG51bGwgJiYgIXRoaXMuYXNzZXJ0aW9ucy5sZW5ndGggKSB7XG5cdFx0XHR0aGlzLnB1c2hGYWlsdXJlKCBcIkV4cGVjdGVkIGF0IGxlYXN0IG9uZSBhc3NlcnRpb24sIGJ1dCBub25lIHdlcmUgcnVuIC0gY2FsbCBcIiArXG5cdFx0XHRcdFwiZXhwZWN0KDApIHRvIGFjY2VwdCB6ZXJvIGFzc2VydGlvbnMuXCIsIHRoaXMuc3RhY2sgKTtcblx0XHR9XG5cblx0XHR2YXIgaSxcblx0XHRcdGJhZCA9IDA7XG5cblx0XHR0aGlzLnJ1bnRpbWUgPSBub3coKSAtIHRoaXMuc3RhcnRlZDtcblx0XHRjb25maWcuc3RhdHMuYWxsICs9IHRoaXMuYXNzZXJ0aW9ucy5sZW5ndGg7XG5cdFx0Y29uZmlnLm1vZHVsZVN0YXRzLmFsbCArPSB0aGlzLmFzc2VydGlvbnMubGVuZ3RoO1xuXG5cdFx0Zm9yICggaSA9IDA7IGkgPCB0aGlzLmFzc2VydGlvbnMubGVuZ3RoOyBpKysgKSB7XG5cdFx0XHRpZiAoICF0aGlzLmFzc2VydGlvbnNbIGkgXS5yZXN1bHQgKSB7XG5cdFx0XHRcdGJhZCsrO1xuXHRcdFx0XHRjb25maWcuc3RhdHMuYmFkKys7XG5cdFx0XHRcdGNvbmZpZy5tb2R1bGVTdGF0cy5iYWQrKztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRub3RpZnlUZXN0c1JhbiggdGhpcy5tb2R1bGUgKTtcblx0XHRydW5Mb2dnaW5nQ2FsbGJhY2tzKCBcInRlc3REb25lXCIsIHtcblx0XHRcdG5hbWU6IHRoaXMudGVzdE5hbWUsXG5cdFx0XHRtb2R1bGU6IHRoaXMubW9kdWxlLm5hbWUsXG5cdFx0XHRza2lwcGVkOiAhIXRoaXMuc2tpcCxcblx0XHRcdGZhaWxlZDogYmFkLFxuXHRcdFx0cGFzc2VkOiB0aGlzLmFzc2VydGlvbnMubGVuZ3RoIC0gYmFkLFxuXHRcdFx0dG90YWw6IHRoaXMuYXNzZXJ0aW9ucy5sZW5ndGgsXG5cdFx0XHRydW50aW1lOiB0aGlzLnJ1bnRpbWUsXG5cblx0XHRcdC8vIEhUTUwgUmVwb3J0ZXIgdXNlXG5cdFx0XHRhc3NlcnRpb25zOiB0aGlzLmFzc2VydGlvbnMsXG5cdFx0XHR0ZXN0SWQ6IHRoaXMudGVzdElkLFxuXG5cdFx0XHQvLyBTb3VyY2Ugb2YgVGVzdFxuXHRcdFx0c291cmNlOiB0aGlzLnN0YWNrXG5cdFx0fSApO1xuXG5cdFx0Y29uZmlnLmN1cnJlbnQgPSB1bmRlZmluZWQ7XG5cdH0sXG5cblx0cHJlc2VydmVUZXN0RW52aXJvbm1lbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5wcmVzZXJ2ZUVudmlyb25tZW50ICkge1xuXHRcdFx0dGhpcy5tb2R1bGUudGVzdEVudmlyb25tZW50ID0gdGhpcy50ZXN0RW52aXJvbm1lbnQ7XG5cdFx0XHR0aGlzLnRlc3RFbnZpcm9ubWVudCA9IGV4dGVuZCgge30sIHRoaXMubW9kdWxlLnRlc3RFbnZpcm9ubWVudCApO1xuXHRcdH1cblx0fSxcblxuXHRxdWV1ZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHByaW9yaXR5LFxuXHRcdFx0dGVzdCA9IHRoaXM7XG5cblx0XHRpZiAoICF0aGlzLnZhbGlkKCkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gcnVuKCkge1xuXG5cdFx0XHQvLyBFYWNoIG9mIHRoZXNlIGNhbiBieSBhc3luY1xuXHRcdFx0c3luY2hyb25pemUoIFtcblx0XHRcdFx0ZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dGVzdC5iZWZvcmUoKTtcblx0XHRcdFx0fSxcblxuXHRcdFx0XHR0ZXN0Lmhvb2tzKCBcImJlZm9yZVwiICksXG5cblx0XHRcdFx0ZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dGVzdC5wcmVzZXJ2ZVRlc3RFbnZpcm9ubWVudCgpO1xuXHRcdFx0XHR9LFxuXG5cdFx0XHRcdHRlc3QuaG9va3MoIFwiYmVmb3JlRWFjaFwiICksXG5cblx0XHRcdFx0ZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dGVzdC5ydW4oKTtcblx0XHRcdFx0fSxcblxuXHRcdFx0XHR0ZXN0Lmhvb2tzKCBcImFmdGVyRWFjaFwiICkucmV2ZXJzZSgpLFxuXHRcdFx0XHR0ZXN0Lmhvb2tzKCBcImFmdGVyXCIgKS5yZXZlcnNlKCksXG5cblx0XHRcdFx0ZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dGVzdC5hZnRlcigpO1xuXHRcdFx0XHR9LFxuXG5cdFx0XHRcdGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHRlc3QuZmluaXNoKCk7XG5cdFx0XHRcdH1cblx0XHRcdF0gKTtcblx0XHR9XG5cblx0XHQvLyBQcmlvcml0aXplIHByZXZpb3VzbHkgZmFpbGVkIHRlc3RzLCBkZXRlY3RlZCBmcm9tIHNlc3Npb25TdG9yYWdlXG5cdFx0cHJpb3JpdHkgPSBRVW5pdC5jb25maWcucmVvcmRlciAmJiBkZWZpbmVkLnNlc3Npb25TdG9yYWdlICYmXG5cdFx0XHRcdCtzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKCBcInF1bml0LXRlc3QtXCIgKyB0aGlzLm1vZHVsZS5uYW1lICsgXCItXCIgKyB0aGlzLnRlc3ROYW1lICk7XG5cblx0XHRyZXR1cm4gc3luY2hyb25pemUoIHJ1biwgcHJpb3JpdHksIGNvbmZpZy5zZWVkICk7XG5cdH0sXG5cblx0cHVzaFJlc3VsdDogZnVuY3Rpb24oIHJlc3VsdEluZm8gKSB7XG5cblx0XHQvLyBEZXN0cnVjdHVyZSBvZiByZXN1bHRJbmZvID0geyByZXN1bHQsIGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsIG5lZ2F0aXZlIH1cblx0XHR2YXIgc291cmNlLFxuXHRcdFx0ZGV0YWlscyA9IHtcblx0XHRcdFx0bW9kdWxlOiB0aGlzLm1vZHVsZS5uYW1lLFxuXHRcdFx0XHRuYW1lOiB0aGlzLnRlc3ROYW1lLFxuXHRcdFx0XHRyZXN1bHQ6IHJlc3VsdEluZm8ucmVzdWx0LFxuXHRcdFx0XHRtZXNzYWdlOiByZXN1bHRJbmZvLm1lc3NhZ2UsXG5cdFx0XHRcdGFjdHVhbDogcmVzdWx0SW5mby5hY3R1YWwsXG5cdFx0XHRcdGV4cGVjdGVkOiByZXN1bHRJbmZvLmV4cGVjdGVkLFxuXHRcdFx0XHR0ZXN0SWQ6IHRoaXMudGVzdElkLFxuXHRcdFx0XHRuZWdhdGl2ZTogcmVzdWx0SW5mby5uZWdhdGl2ZSB8fCBmYWxzZSxcblx0XHRcdFx0cnVudGltZTogbm93KCkgLSB0aGlzLnN0YXJ0ZWRcblx0XHRcdH07XG5cblx0XHRpZiAoICFyZXN1bHRJbmZvLnJlc3VsdCApIHtcblx0XHRcdHNvdXJjZSA9IHNvdXJjZUZyb21TdGFja3RyYWNlKCk7XG5cblx0XHRcdGlmICggc291cmNlICkge1xuXHRcdFx0XHRkZXRhaWxzLnNvdXJjZSA9IHNvdXJjZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRydW5Mb2dnaW5nQ2FsbGJhY2tzKCBcImxvZ1wiLCBkZXRhaWxzICk7XG5cblx0XHR0aGlzLmFzc2VydGlvbnMucHVzaCgge1xuXHRcdFx0cmVzdWx0OiAhIXJlc3VsdEluZm8ucmVzdWx0LFxuXHRcdFx0bWVzc2FnZTogcmVzdWx0SW5mby5tZXNzYWdlXG5cdFx0fSApO1xuXHR9LFxuXG5cdHB1c2hGYWlsdXJlOiBmdW5jdGlvbiggbWVzc2FnZSwgc291cmNlLCBhY3R1YWwgKSB7XG5cdFx0aWYgKCAhKCB0aGlzIGluc3RhbmNlb2YgVGVzdCApICkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCBcInB1c2hGYWlsdXJlKCkgYXNzZXJ0aW9uIG91dHNpZGUgdGVzdCBjb250ZXh0LCB3YXMgXCIgK1xuXHRcdFx0XHRzb3VyY2VGcm9tU3RhY2t0cmFjZSggMiApICk7XG5cdFx0fVxuXG5cdFx0dmFyIGRldGFpbHMgPSB7XG5cdFx0XHRcdG1vZHVsZTogdGhpcy5tb2R1bGUubmFtZSxcblx0XHRcdFx0bmFtZTogdGhpcy50ZXN0TmFtZSxcblx0XHRcdFx0cmVzdWx0OiBmYWxzZSxcblx0XHRcdFx0bWVzc2FnZTogbWVzc2FnZSB8fCBcImVycm9yXCIsXG5cdFx0XHRcdGFjdHVhbDogYWN0dWFsIHx8IG51bGwsXG5cdFx0XHRcdHRlc3RJZDogdGhpcy50ZXN0SWQsXG5cdFx0XHRcdHJ1bnRpbWU6IG5vdygpIC0gdGhpcy5zdGFydGVkXG5cdFx0XHR9O1xuXG5cdFx0aWYgKCBzb3VyY2UgKSB7XG5cdFx0XHRkZXRhaWxzLnNvdXJjZSA9IHNvdXJjZTtcblx0XHR9XG5cblx0XHRydW5Mb2dnaW5nQ2FsbGJhY2tzKCBcImxvZ1wiLCBkZXRhaWxzICk7XG5cblx0XHR0aGlzLmFzc2VydGlvbnMucHVzaCgge1xuXHRcdFx0cmVzdWx0OiBmYWxzZSxcblx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2Vcblx0XHR9ICk7XG5cdH0sXG5cblx0cmVzb2x2ZVByb21pc2U6IGZ1bmN0aW9uKCBwcm9taXNlLCBwaGFzZSApIHtcblx0XHR2YXIgdGhlbiwgbWVzc2FnZSxcblx0XHRcdHRlc3QgPSB0aGlzO1xuXHRcdGlmICggcHJvbWlzZSAhPSBudWxsICkge1xuXHRcdFx0dGhlbiA9IHByb21pc2UudGhlbjtcblx0XHRcdGlmICggUVVuaXQub2JqZWN0VHlwZSggdGhlbiApID09PSBcImZ1bmN0aW9uXCIgKSB7XG5cdFx0XHRcdGludGVybmFsU3RvcCggdGVzdCApO1xuXHRcdFx0XHR0aGVuLmNhbGwoXG5cdFx0XHRcdFx0cHJvbWlzZSxcblx0XHRcdFx0XHRmdW5jdGlvbigpIHsgaW50ZXJuYWxTdGFydCggdGVzdCApOyB9LFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCBlcnJvciApIHtcblx0XHRcdFx0XHRcdG1lc3NhZ2UgPSBcIlByb21pc2UgcmVqZWN0ZWQgXCIgK1xuXHRcdFx0XHRcdFx0XHQoICFwaGFzZSA/IFwiZHVyaW5nXCIgOiBwaGFzZS5yZXBsYWNlKCAvRWFjaCQvLCBcIlwiICkgKSArXG5cdFx0XHRcdFx0XHRcdFwiIFwiICsgdGVzdC50ZXN0TmFtZSArIFwiOiBcIiArICggZXJyb3IubWVzc2FnZSB8fCBlcnJvciApO1xuXHRcdFx0XHRcdFx0dGVzdC5wdXNoRmFpbHVyZSggbWVzc2FnZSwgZXh0cmFjdFN0YWNrdHJhY2UoIGVycm9yLCAwICkgKTtcblxuXHRcdFx0XHRcdFx0Ly8gRWxzZSBuZXh0IHRlc3Qgd2lsbCBjYXJyeSB0aGUgcmVzcG9uc2liaWxpdHlcblx0XHRcdFx0XHRcdHNhdmVHbG9iYWwoKTtcblxuXHRcdFx0XHRcdFx0Ly8gVW5ibG9ja1xuXHRcdFx0XHRcdFx0aW50ZXJuYWxTdGFydCggdGVzdCApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0dmFsaWQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBmaWx0ZXIgPSBjb25maWcuZmlsdGVyLFxuXHRcdFx0cmVnZXhGaWx0ZXIgPSAvXighPylcXC8oW1xcd1xcV10qKVxcLyhpPyQpLy5leGVjKCBmaWx0ZXIgKSxcblx0XHRcdG1vZHVsZSA9IGNvbmZpZy5tb2R1bGUgJiYgY29uZmlnLm1vZHVsZS50b0xvd2VyQ2FzZSgpLFxuXHRcdFx0ZnVsbE5hbWUgPSAoIHRoaXMubW9kdWxlLm5hbWUgKyBcIjogXCIgKyB0aGlzLnRlc3ROYW1lICk7XG5cblx0XHRmdW5jdGlvbiBtb2R1bGVDaGFpbk5hbWVNYXRjaCggdGVzdE1vZHVsZSApIHtcblx0XHRcdHZhciB0ZXN0TW9kdWxlTmFtZSA9IHRlc3RNb2R1bGUubmFtZSA/IHRlc3RNb2R1bGUubmFtZS50b0xvd2VyQ2FzZSgpIDogbnVsbDtcblx0XHRcdGlmICggdGVzdE1vZHVsZU5hbWUgPT09IG1vZHVsZSApIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9IGVsc2UgaWYgKCB0ZXN0TW9kdWxlLnBhcmVudE1vZHVsZSApIHtcblx0XHRcdFx0cmV0dXJuIG1vZHVsZUNoYWluTmFtZU1hdGNoKCB0ZXN0TW9kdWxlLnBhcmVudE1vZHVsZSApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIG1vZHVsZUNoYWluSWRNYXRjaCggdGVzdE1vZHVsZSApIHtcblx0XHRcdHJldHVybiBpbkFycmF5KCB0ZXN0TW9kdWxlLm1vZHVsZUlkLCBjb25maWcubW9kdWxlSWQgKSA+IC0xIHx8XG5cdFx0XHRcdHRlc3RNb2R1bGUucGFyZW50TW9kdWxlICYmIG1vZHVsZUNoYWluSWRNYXRjaCggdGVzdE1vZHVsZS5wYXJlbnRNb2R1bGUgKTtcblx0XHR9XG5cblx0XHQvLyBJbnRlcm5hbGx5LWdlbmVyYXRlZCB0ZXN0cyBhcmUgYWx3YXlzIHZhbGlkXG5cdFx0aWYgKCB0aGlzLmNhbGxiYWNrICYmIHRoaXMuY2FsbGJhY2sudmFsaWRUZXN0ICkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKCBjb25maWcubW9kdWxlSWQgJiYgY29uZmlnLm1vZHVsZUlkLmxlbmd0aCA+IDAgJiZcblx0XHRcdCFtb2R1bGVDaGFpbklkTWF0Y2goIHRoaXMubW9kdWxlICkgKSB7XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRpZiAoIGNvbmZpZy50ZXN0SWQgJiYgY29uZmlnLnRlc3RJZC5sZW5ndGggPiAwICYmXG5cdFx0XHRpbkFycmF5KCB0aGlzLnRlc3RJZCwgY29uZmlnLnRlc3RJZCApIDwgMCApIHtcblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGlmICggbW9kdWxlICYmICFtb2R1bGVDaGFpbk5hbWVNYXRjaCggdGhpcy5tb2R1bGUgKSApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRpZiAoICFmaWx0ZXIgKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVnZXhGaWx0ZXIgP1xuXHRcdFx0dGhpcy5yZWdleEZpbHRlciggISFyZWdleEZpbHRlclsgMSBdLCByZWdleEZpbHRlclsgMiBdLCByZWdleEZpbHRlclsgMyBdLCBmdWxsTmFtZSApIDpcblx0XHRcdHRoaXMuc3RyaW5nRmlsdGVyKCBmaWx0ZXIsIGZ1bGxOYW1lICk7XG5cdH0sXG5cblx0cmVnZXhGaWx0ZXI6IGZ1bmN0aW9uKCBleGNsdWRlLCBwYXR0ZXJuLCBmbGFncywgZnVsbE5hbWUgKSB7XG5cdFx0dmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cCggcGF0dGVybiwgZmxhZ3MgKTtcblx0XHR2YXIgbWF0Y2ggPSByZWdleC50ZXN0KCBmdWxsTmFtZSApO1xuXG5cdFx0cmV0dXJuIG1hdGNoICE9PSBleGNsdWRlO1xuXHR9LFxuXG5cdHN0cmluZ0ZpbHRlcjogZnVuY3Rpb24oIGZpbHRlciwgZnVsbE5hbWUgKSB7XG5cdFx0ZmlsdGVyID0gZmlsdGVyLnRvTG93ZXJDYXNlKCk7XG5cdFx0ZnVsbE5hbWUgPSBmdWxsTmFtZS50b0xvd2VyQ2FzZSgpO1xuXG5cdFx0dmFyIGluY2x1ZGUgPSBmaWx0ZXIuY2hhckF0KCAwICkgIT09IFwiIVwiO1xuXHRcdGlmICggIWluY2x1ZGUgKSB7XG5cdFx0XHRmaWx0ZXIgPSBmaWx0ZXIuc2xpY2UoIDEgKTtcblx0XHR9XG5cblx0XHQvLyBJZiB0aGUgZmlsdGVyIG1hdGNoZXMsIHdlIG5lZWQgdG8gaG9ub3VyIGluY2x1ZGVcblx0XHRpZiAoIGZ1bGxOYW1lLmluZGV4T2YoIGZpbHRlciApICE9PSAtMSApIHtcblx0XHRcdHJldHVybiBpbmNsdWRlO1xuXHRcdH1cblxuXHRcdC8vIE90aGVyd2lzZSwgZG8gdGhlIG9wcG9zaXRlXG5cdFx0cmV0dXJuICFpbmNsdWRlO1xuXHR9XG59O1xuXG5RVW5pdC5wdXNoRmFpbHVyZSA9IGZ1bmN0aW9uKCkge1xuXHRpZiAoICFRVW5pdC5jb25maWcuY3VycmVudCApIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoIFwicHVzaEZhaWx1cmUoKSBhc3NlcnRpb24gb3V0c2lkZSB0ZXN0IGNvbnRleHQsIGluIFwiICtcblx0XHRcdHNvdXJjZUZyb21TdGFja3RyYWNlKCAyICkgKTtcblx0fVxuXG5cdC8vIEdldHMgY3VycmVudCB0ZXN0IG9ialxuXHR2YXIgY3VycmVudFRlc3QgPSBRVW5pdC5jb25maWcuY3VycmVudDtcblxuXHRyZXR1cm4gY3VycmVudFRlc3QucHVzaEZhaWx1cmUuYXBwbHkoIGN1cnJlbnRUZXN0LCBhcmd1bWVudHMgKTtcbn07XG5cbi8vIEJhc2VkIG9uIEphdmEncyBTdHJpbmcuaGFzaENvZGUsIGEgc2ltcGxlIGJ1dCBub3Rcbi8vIHJpZ29yb3VzbHkgY29sbGlzaW9uIHJlc2lzdGFudCBoYXNoaW5nIGZ1bmN0aW9uXG5mdW5jdGlvbiBnZW5lcmF0ZUhhc2goIG1vZHVsZSwgdGVzdE5hbWUgKSB7XG5cdHZhciBoZXgsXG5cdFx0aSA9IDAsXG5cdFx0aGFzaCA9IDAsXG5cdFx0c3RyID0gbW9kdWxlICsgXCJcXHgxQ1wiICsgdGVzdE5hbWUsXG5cdFx0bGVuID0gc3RyLmxlbmd0aDtcblxuXHRmb3IgKCA7IGkgPCBsZW47IGkrKyApIHtcblx0XHRoYXNoICA9ICggKCBoYXNoIDw8IDUgKSAtIGhhc2ggKSArIHN0ci5jaGFyQ29kZUF0KCBpICk7XG5cdFx0aGFzaCB8PSAwO1xuXHR9XG5cblx0Ly8gQ29udmVydCB0aGUgcG9zc2libHkgbmVnYXRpdmUgaW50ZWdlciBoYXNoIGNvZGUgaW50byBhbiA4IGNoYXJhY3RlciBoZXggc3RyaW5nLCB3aGljaCBpc24ndFxuXHQvLyBzdHJpY3RseSBuZWNlc3NhcnkgYnV0IGluY3JlYXNlcyB1c2VyIHVuZGVyc3RhbmRpbmcgdGhhdCB0aGUgaWQgaXMgYSBTSEEtbGlrZSBoYXNoXG5cdGhleCA9ICggMHgxMDAwMDAwMDAgKyBoYXNoICkudG9TdHJpbmcoIDE2ICk7XG5cdGlmICggaGV4Lmxlbmd0aCA8IDggKSB7XG5cdFx0aGV4ID0gXCIwMDAwMDAwXCIgKyBoZXg7XG5cdH1cblxuXHRyZXR1cm4gaGV4LnNsaWNlKCAtOCApO1xufVxuXG5mdW5jdGlvbiBzeW5jaHJvbml6ZSggY2FsbGJhY2ssIHByaW9yaXR5LCBzZWVkICkge1xuXHR2YXIgbGFzdCA9ICFwcmlvcml0eSxcblx0XHRpbmRleDtcblxuXHRpZiAoIFFVbml0Lm9iamVjdFR5cGUoIGNhbGxiYWNrICkgPT09IFwiYXJyYXlcIiApIHtcblx0XHR3aGlsZSAoIGNhbGxiYWNrLmxlbmd0aCApIHtcblx0XHRcdHN5bmNocm9uaXplKCBjYWxsYmFjay5zaGlmdCgpICk7XG5cdFx0fVxuXHRcdHJldHVybjtcblx0fVxuXG5cdGlmICggcHJpb3JpdHkgKSB7XG5cdFx0Y29uZmlnLnF1ZXVlLnNwbGljZSggcHJpb3JpdHlDb3VudCsrLCAwLCBjYWxsYmFjayApO1xuXHR9IGVsc2UgaWYgKCBzZWVkICkge1xuXHRcdGlmICggIXVuaXRTYW1wbGVyICkge1xuXHRcdFx0dW5pdFNhbXBsZXIgPSB1bml0U2FtcGxlckdlbmVyYXRvciggc2VlZCApO1xuXHRcdH1cblxuXHRcdC8vIEluc2VydCBpbnRvIGEgcmFuZG9tIHBvc2l0aW9uIGFmdGVyIGFsbCBwcmlvcml0eSBpdGVtc1xuXHRcdGluZGV4ID0gTWF0aC5mbG9vciggdW5pdFNhbXBsZXIoKSAqICggY29uZmlnLnF1ZXVlLmxlbmd0aCAtIHByaW9yaXR5Q291bnQgKyAxICkgKTtcblx0XHRjb25maWcucXVldWUuc3BsaWNlKCBwcmlvcml0eUNvdW50ICsgaW5kZXgsIDAsIGNhbGxiYWNrICk7XG5cdH0gZWxzZSB7XG5cdFx0Y29uZmlnLnF1ZXVlLnB1c2goIGNhbGxiYWNrICk7XG5cdH1cblxuXHRpZiAoIGF1dG9ydW4gJiYgIWNvbmZpZy5ibG9ja2luZyApIHtcblx0XHRwcm9jZXNzKCBsYXN0ICk7XG5cdH1cbn1cblxuZnVuY3Rpb24gdW5pdFNhbXBsZXJHZW5lcmF0b3IoIHNlZWQgKSB7XG5cblx0Ly8gMzItYml0IHhvcnNoaWZ0LCByZXF1aXJlcyBvbmx5IGEgbm9uemVybyBzZWVkXG5cdC8vIGh0dHA6Ly9leGNhbWVyYS5jb20vc3BoaW54L2FydGljbGUteG9yc2hpZnQuaHRtbFxuXHR2YXIgc2FtcGxlID0gcGFyc2VJbnQoIGdlbmVyYXRlSGFzaCggc2VlZCApLCAxNiApIHx8IC0xO1xuXHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0c2FtcGxlIF49IHNhbXBsZSA8PCAxMztcblx0XHRzYW1wbGUgXj0gc2FtcGxlID4+PiAxNztcblx0XHRzYW1wbGUgXj0gc2FtcGxlIDw8IDU7XG5cblx0XHQvLyBFQ01BU2NyaXB0IGhhcyBubyB1bnNpZ25lZCBudW1iZXIgdHlwZVxuXHRcdGlmICggc2FtcGxlIDwgMCApIHtcblx0XHRcdHNhbXBsZSArPSAweDEwMDAwMDAwMDtcblx0XHR9XG5cblx0XHRyZXR1cm4gc2FtcGxlIC8gMHgxMDAwMDAwMDA7XG5cdH07XG59XG5cbmZ1bmN0aW9uIHNhdmVHbG9iYWwoKSB7XG5cdGNvbmZpZy5wb2xsdXRpb24gPSBbXTtcblxuXHRpZiAoIGNvbmZpZy5ub2dsb2JhbHMgKSB7XG5cdFx0Zm9yICggdmFyIGtleSBpbiBnbG9iYWwgKSB7XG5cdFx0XHRpZiAoIGhhc093bi5jYWxsKCBnbG9iYWwsIGtleSApICkge1xuXG5cdFx0XHRcdC8vIEluIE9wZXJhIHNvbWV0aW1lcyBET00gZWxlbWVudCBpZHMgc2hvdyB1cCBoZXJlLCBpZ25vcmUgdGhlbVxuXHRcdFx0XHRpZiAoIC9ecXVuaXQtdGVzdC1vdXRwdXQvLnRlc3QoIGtleSApICkge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNvbmZpZy5wb2xsdXRpb24ucHVzaCgga2V5ICk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIGNoZWNrUG9sbHV0aW9uKCkge1xuXHR2YXIgbmV3R2xvYmFscyxcblx0XHRkZWxldGVkR2xvYmFscyxcblx0XHRvbGQgPSBjb25maWcucG9sbHV0aW9uO1xuXG5cdHNhdmVHbG9iYWwoKTtcblxuXHRuZXdHbG9iYWxzID0gZGlmZiggY29uZmlnLnBvbGx1dGlvbiwgb2xkICk7XG5cdGlmICggbmV3R2xvYmFscy5sZW5ndGggPiAwICkge1xuXHRcdFFVbml0LnB1c2hGYWlsdXJlKCBcIkludHJvZHVjZWQgZ2xvYmFsIHZhcmlhYmxlKHMpOiBcIiArIG5ld0dsb2JhbHMuam9pbiggXCIsIFwiICkgKTtcblx0fVxuXG5cdGRlbGV0ZWRHbG9iYWxzID0gZGlmZiggb2xkLCBjb25maWcucG9sbHV0aW9uICk7XG5cdGlmICggZGVsZXRlZEdsb2JhbHMubGVuZ3RoID4gMCApIHtcblx0XHRRVW5pdC5wdXNoRmFpbHVyZSggXCJEZWxldGVkIGdsb2JhbCB2YXJpYWJsZShzKTogXCIgKyBkZWxldGVkR2xvYmFscy5qb2luKCBcIiwgXCIgKSApO1xuXHR9XG59XG5cbi8vIFdpbGwgYmUgZXhwb3NlZCBhcyBRVW5pdC50ZXN0XG5mdW5jdGlvbiB0ZXN0KCB0ZXN0TmFtZSwgY2FsbGJhY2sgKSB7XG5cdGlmICggZm9jdXNlZCApICB7IHJldHVybjsgfVxuXG5cdHZhciBuZXdUZXN0O1xuXG5cdG5ld1Rlc3QgPSBuZXcgVGVzdCgge1xuXHRcdHRlc3ROYW1lOiB0ZXN0TmFtZSxcblx0XHRjYWxsYmFjazogY2FsbGJhY2tcblx0fSApO1xuXG5cdG5ld1Rlc3QucXVldWUoKTtcbn1cblxuLy8gV2lsbCBiZSBleHBvc2VkIGFzIFFVbml0LnNraXBcbmZ1bmN0aW9uIHNraXAoIHRlc3ROYW1lICkge1xuXHRpZiAoIGZvY3VzZWQgKSAgeyByZXR1cm47IH1cblxuXHR2YXIgdGVzdCA9IG5ldyBUZXN0KCB7XG5cdFx0dGVzdE5hbWU6IHRlc3ROYW1lLFxuXHRcdHNraXA6IHRydWVcblx0fSApO1xuXG5cdHRlc3QucXVldWUoKTtcbn1cblxuLy8gV2lsbCBiZSBleHBvc2VkIGFzIFFVbml0Lm9ubHlcbmZ1bmN0aW9uIG9ubHkoIHRlc3ROYW1lLCBjYWxsYmFjayApIHtcblx0dmFyIG5ld1Rlc3Q7XG5cblx0aWYgKCBmb2N1c2VkICkgIHsgcmV0dXJuOyB9XG5cblx0UVVuaXQuY29uZmlnLnF1ZXVlLmxlbmd0aCA9IDA7XG5cdGZvY3VzZWQgPSB0cnVlO1xuXG5cdG5ld1Rlc3QgPSBuZXcgVGVzdCgge1xuXHRcdHRlc3ROYW1lOiB0ZXN0TmFtZSxcblx0XHRjYWxsYmFjazogY2FsbGJhY2tcblx0fSApO1xuXG5cdG5ld1Rlc3QucXVldWUoKTtcbn1cblxuZnVuY3Rpb24gaW50ZXJuYWxTdG9wKCB0ZXN0ICkge1xuXG5cdC8vIElmIGEgdGVzdCBpcyBydW5uaW5nLCBhZGp1c3QgaXRzIHNlbWFwaG9yZVxuXHR0ZXN0LnNlbWFwaG9yZSArPSAxO1xuXG5cdHBhdXNlUHJvY2Vzc2luZyggdGVzdCApO1xufVxuXG5mdW5jdGlvbiBpbnRlcm5hbFN0YXJ0KCB0ZXN0ICkge1xuXG5cdC8vIElmIGEgdGVzdCBpcyBydW5uaW5nLCBhZGp1c3QgaXRzIHNlbWFwaG9yZVxuXHR0ZXN0LnNlbWFwaG9yZSAtPSAxO1xuXG5cdC8vIElmIHNlbWFwaG9yZSBpcyBub24tbnVtZXJpYywgdGhyb3cgZXJyb3Jcblx0aWYgKCBpc05hTiggdGVzdC5zZW1hcGhvcmUgKSApIHtcblx0XHR0ZXN0LnNlbWFwaG9yZSA9IDA7XG5cblx0XHRRVW5pdC5wdXNoRmFpbHVyZShcblx0XHRcdFwiSW52YWxpZCB2YWx1ZSBvbiB0ZXN0LnNlbWFwaG9yZVwiLFxuXHRcdFx0c291cmNlRnJvbVN0YWNrdHJhY2UoIDIgKVxuXHRcdCk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Ly8gRG9uJ3Qgc3RhcnQgdW50aWwgZXF1YWwgbnVtYmVyIG9mIHN0b3AtY2FsbHNcblx0aWYgKCB0ZXN0LnNlbWFwaG9yZSA+IDAgKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Ly8gVGhyb3cgYW4gRXJyb3IgaWYgc3RhcnQgaXMgY2FsbGVkIG1vcmUgb2Z0ZW4gdGhhbiBzdG9wXG5cdGlmICggdGVzdC5zZW1hcGhvcmUgPCAwICkge1xuXHRcdHRlc3Quc2VtYXBob3JlID0gMDtcblxuXHRcdFFVbml0LnB1c2hGYWlsdXJlKFxuXHRcdFx0XCJUcmllZCB0byByZXN0YXJ0IHRlc3Qgd2hpbGUgYWxyZWFkeSBzdGFydGVkICh0ZXN0J3Mgc2VtYXBob3JlIHdhcyAwIGFscmVhZHkpXCIsXG5cdFx0XHRzb3VyY2VGcm9tU3RhY2t0cmFjZSggMiApXG5cdFx0KTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRyZXN1bWVQcm9jZXNzaW5nKCB0ZXN0ICk7XG59XG5cbmZ1bmN0aW9uIG51bWJlck9mVGVzdHMoIG1vZHVsZSApIHtcblx0dmFyIGNvdW50ID0gbW9kdWxlLnRlc3RzLmxlbmd0aDtcblx0d2hpbGUgKCBtb2R1bGUgPSBtb2R1bGUuY2hpbGRNb2R1bGUgKSB7XG5cdFx0Y291bnQgKz0gbW9kdWxlLnRlc3RzLmxlbmd0aDtcblx0fVxuXHRyZXR1cm4gY291bnQ7XG59XG5cbmZ1bmN0aW9uIG5vdGlmeVRlc3RzUmFuKCBtb2R1bGUgKSB7XG5cdG1vZHVsZS50ZXN0c1J1bisrO1xuXHR3aGlsZSAoIG1vZHVsZSA9IG1vZHVsZS5wYXJlbnRNb2R1bGUgKSB7XG5cdFx0bW9kdWxlLnRlc3RzUnVuKys7XG5cdH1cbn1cblxuZnVuY3Rpb24gQXNzZXJ0KCB0ZXN0Q29udGV4dCApIHtcblx0dGhpcy50ZXN0ID0gdGVzdENvbnRleHQ7XG59XG5cbi8vIEFzc2VydCBoZWxwZXJzXG5RVW5pdC5hc3NlcnQgPSBBc3NlcnQucHJvdG90eXBlID0ge1xuXG5cdC8vIFNwZWNpZnkgdGhlIG51bWJlciBvZiBleHBlY3RlZCBhc3NlcnRpb25zIHRvIGd1YXJhbnRlZSB0aGF0IGZhaWxlZCB0ZXN0XG5cdC8vIChubyBhc3NlcnRpb25zIGFyZSBydW4gYXQgYWxsKSBkb24ndCBzbGlwIHRocm91Z2guXG5cdGV4cGVjdDogZnVuY3Rpb24oIGFzc2VydHMgKSB7XG5cdFx0aWYgKCBhcmd1bWVudHMubGVuZ3RoID09PSAxICkge1xuXHRcdFx0dGhpcy50ZXN0LmV4cGVjdGVkID0gYXNzZXJ0cztcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRoaXMudGVzdC5leHBlY3RlZDtcblx0XHR9XG5cdH0sXG5cblx0Ly8gSW5jcmVtZW50IHRoaXMgVGVzdCdzIHNlbWFwaG9yZSBjb3VudGVyLCB0aGVuIHJldHVybiBhIGZ1bmN0aW9uIHRoYXRcblx0Ly8gZGVjcmVtZW50cyB0aGF0IGNvdW50ZXIgYSBtYXhpbXVtIG9mIG9uY2UuXG5cdGFzeW5jOiBmdW5jdGlvbiggY291bnQgKSB7XG5cdFx0dmFyIHRlc3QgPSB0aGlzLnRlc3QsXG5cdFx0XHRwb3BwZWQgPSBmYWxzZSxcblx0XHRcdGFjY2VwdENhbGxDb3VudCA9IGNvdW50O1xuXG5cdFx0aWYgKCB0eXBlb2YgYWNjZXB0Q2FsbENvdW50ID09PSBcInVuZGVmaW5lZFwiICkge1xuXHRcdFx0YWNjZXB0Q2FsbENvdW50ID0gMTtcblx0XHR9XG5cblx0XHR0ZXN0LnNlbWFwaG9yZSArPSAxO1xuXHRcdHRlc3QudXNlZEFzeW5jID0gdHJ1ZTtcblx0XHRwYXVzZVByb2Nlc3NpbmcoIHRlc3QgKTtcblxuXHRcdHJldHVybiBmdW5jdGlvbiBkb25lKCkge1xuXG5cdFx0XHRpZiAoIHBvcHBlZCApIHtcblx0XHRcdFx0dGVzdC5wdXNoRmFpbHVyZSggXCJUb28gbWFueSBjYWxscyB0byB0aGUgYGFzc2VydC5hc3luY2AgY2FsbGJhY2tcIixcblx0XHRcdFx0XHRzb3VyY2VGcm9tU3RhY2t0cmFjZSggMiApICk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGFjY2VwdENhbGxDb3VudCAtPSAxO1xuXHRcdFx0aWYgKCBhY2NlcHRDYWxsQ291bnQgPiAwICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHRlc3Quc2VtYXBob3JlIC09IDE7XG5cdFx0XHRwb3BwZWQgPSB0cnVlO1xuXHRcdFx0cmVzdW1lUHJvY2Vzc2luZyggdGVzdCApO1xuXHRcdH07XG5cdH0sXG5cblx0Ly8gRXhwb3J0cyB0ZXN0LnB1c2goKSB0byB0aGUgdXNlciBBUElcblx0Ly8gQWxpYXMgb2YgcHVzaFJlc3VsdC5cblx0cHVzaDogZnVuY3Rpb24oIHJlc3VsdCwgYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgbmVnYXRpdmUgKSB7XG5cdFx0dmFyIGN1cnJlbnRBc3NlcnQgPSB0aGlzIGluc3RhbmNlb2YgQXNzZXJ0ID8gdGhpcyA6IFFVbml0LmNvbmZpZy5jdXJyZW50LmFzc2VydDtcblx0XHRyZXR1cm4gY3VycmVudEFzc2VydC5wdXNoUmVzdWx0KCB7XG5cdFx0XHRyZXN1bHQ6IHJlc3VsdCxcblx0XHRcdGFjdHVhbDogYWN0dWFsLFxuXHRcdFx0ZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuXHRcdFx0bWVzc2FnZTogbWVzc2FnZSxcblx0XHRcdG5lZ2F0aXZlOiBuZWdhdGl2ZVxuXHRcdH0gKTtcblx0fSxcblxuXHRwdXNoUmVzdWx0OiBmdW5jdGlvbiggcmVzdWx0SW5mbyApIHtcblxuXHRcdC8vIERlc3RydWN0dXJlIG9mIHJlc3VsdEluZm8gPSB7IHJlc3VsdCwgYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgbmVnYXRpdmUgfVxuXHRcdHZhciBhc3NlcnQgPSB0aGlzLFxuXHRcdFx0Y3VycmVudFRlc3QgPSAoIGFzc2VydCBpbnN0YW5jZW9mIEFzc2VydCAmJiBhc3NlcnQudGVzdCApIHx8IFFVbml0LmNvbmZpZy5jdXJyZW50O1xuXG5cdFx0Ly8gQmFja3dhcmRzIGNvbXBhdGliaWxpdHkgZml4LlxuXHRcdC8vIEFsbG93cyB0aGUgZGlyZWN0IHVzZSBvZiBnbG9iYWwgZXhwb3J0ZWQgYXNzZXJ0aW9ucyBhbmQgUVVuaXQuYXNzZXJ0Lipcblx0XHQvLyBBbHRob3VnaCwgaXQncyB1c2UgaXMgbm90IHJlY29tbWVuZGVkIGFzIGl0IGNhbiBsZWFrIGFzc2VydGlvbnNcblx0XHQvLyB0byBvdGhlciB0ZXN0cyBmcm9tIGFzeW5jIHRlc3RzLCBiZWNhdXNlIHdlIG9ubHkgZ2V0IGEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IHRlc3QsXG5cdFx0Ly8gbm90IGV4YWN0bHkgdGhlIHRlc3Qgd2hlcmUgYXNzZXJ0aW9uIHdlcmUgaW50ZW5kZWQgdG8gYmUgY2FsbGVkLlxuXHRcdGlmICggIWN1cnJlbnRUZXN0ICkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCBcImFzc2VydGlvbiBvdXRzaWRlIHRlc3QgY29udGV4dCwgaW4gXCIgKyBzb3VyY2VGcm9tU3RhY2t0cmFjZSggMiApICk7XG5cdFx0fVxuXG5cdFx0aWYgKCBjdXJyZW50VGVzdC51c2VkQXN5bmMgPT09IHRydWUgJiYgY3VycmVudFRlc3Quc2VtYXBob3JlID09PSAwICkge1xuXHRcdFx0Y3VycmVudFRlc3QucHVzaEZhaWx1cmUoIFwiQXNzZXJ0aW9uIGFmdGVyIHRoZSBmaW5hbCBgYXNzZXJ0LmFzeW5jYCB3YXMgcmVzb2x2ZWRcIixcblx0XHRcdFx0c291cmNlRnJvbVN0YWNrdHJhY2UoIDIgKSApO1xuXG5cdFx0XHQvLyBBbGxvdyB0aGlzIGFzc2VydGlvbiB0byBjb250aW51ZSBydW5uaW5nIGFueXdheS4uLlxuXHRcdH1cblxuXHRcdGlmICggISggYXNzZXJ0IGluc3RhbmNlb2YgQXNzZXJ0ICkgKSB7XG5cdFx0XHRhc3NlcnQgPSBjdXJyZW50VGVzdC5hc3NlcnQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGFzc2VydC50ZXN0LnB1c2hSZXN1bHQoIHJlc3VsdEluZm8gKTtcblx0fSxcblxuXHRvazogZnVuY3Rpb24oIHJlc3VsdCwgbWVzc2FnZSApIHtcblx0XHRtZXNzYWdlID0gbWVzc2FnZSB8fCAoIHJlc3VsdCA/IFwib2theVwiIDogXCJmYWlsZWQsIGV4cGVjdGVkIGFyZ3VtZW50IHRvIGJlIHRydXRoeSwgd2FzOiBcIiArXG5cdFx0XHRRVW5pdC5kdW1wLnBhcnNlKCByZXN1bHQgKSApO1xuXHRcdHRoaXMucHVzaFJlc3VsdCgge1xuXHRcdFx0cmVzdWx0OiAhIXJlc3VsdCxcblx0XHRcdGFjdHVhbDogcmVzdWx0LFxuXHRcdFx0ZXhwZWN0ZWQ6IHRydWUsXG5cdFx0XHRtZXNzYWdlOiBtZXNzYWdlXG5cdFx0fSApO1xuXHR9LFxuXG5cdG5vdE9rOiBmdW5jdGlvbiggcmVzdWx0LCBtZXNzYWdlICkge1xuXHRcdG1lc3NhZ2UgPSBtZXNzYWdlIHx8ICggIXJlc3VsdCA/IFwib2theVwiIDogXCJmYWlsZWQsIGV4cGVjdGVkIGFyZ3VtZW50IHRvIGJlIGZhbHN5LCB3YXM6IFwiICtcblx0XHRcdFFVbml0LmR1bXAucGFyc2UoIHJlc3VsdCApICk7XG5cdFx0dGhpcy5wdXNoUmVzdWx0KCB7XG5cdFx0XHRyZXN1bHQ6ICFyZXN1bHQsXG5cdFx0XHRhY3R1YWw6IHJlc3VsdCxcblx0XHRcdGV4cGVjdGVkOiBmYWxzZSxcblx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2Vcblx0XHR9ICk7XG5cdH0sXG5cblx0ZXF1YWw6IGZ1bmN0aW9uKCBhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlICkge1xuXHRcdC8qanNoaW50IGVxZXFlcTpmYWxzZSAqL1xuXHRcdHRoaXMucHVzaFJlc3VsdCgge1xuXHRcdFx0cmVzdWx0OiBleHBlY3RlZCA9PSBhY3R1YWwsXG5cdFx0XHRhY3R1YWw6IGFjdHVhbCxcblx0XHRcdGV4cGVjdGVkOiBleHBlY3RlZCxcblx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2Vcblx0XHR9ICk7XG5cdH0sXG5cblx0bm90RXF1YWw6IGZ1bmN0aW9uKCBhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlICkge1xuXHRcdC8qanNoaW50IGVxZXFlcTpmYWxzZSAqL1xuXHRcdHRoaXMucHVzaFJlc3VsdCgge1xuXHRcdFx0cmVzdWx0OiBleHBlY3RlZCAhPSBhY3R1YWwsXG5cdFx0XHRhY3R1YWw6IGFjdHVhbCxcblx0XHRcdGV4cGVjdGVkOiBleHBlY3RlZCxcblx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2UsXG5cdFx0XHRuZWdhdGl2ZTogdHJ1ZVxuXHRcdH0gKTtcblx0fSxcblxuXHRwcm9wRXF1YWw6IGZ1bmN0aW9uKCBhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlICkge1xuXHRcdGFjdHVhbCA9IG9iamVjdFZhbHVlcyggYWN0dWFsICk7XG5cdFx0ZXhwZWN0ZWQgPSBvYmplY3RWYWx1ZXMoIGV4cGVjdGVkICk7XG5cdFx0dGhpcy5wdXNoUmVzdWx0KCB7XG5cdFx0XHRyZXN1bHQ6IFFVbml0LmVxdWl2KCBhY3R1YWwsIGV4cGVjdGVkICksXG5cdFx0XHRhY3R1YWw6IGFjdHVhbCxcblx0XHRcdGV4cGVjdGVkOiBleHBlY3RlZCxcblx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2Vcblx0XHR9ICk7XG5cdH0sXG5cblx0bm90UHJvcEVxdWFsOiBmdW5jdGlvbiggYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSApIHtcblx0XHRhY3R1YWwgPSBvYmplY3RWYWx1ZXMoIGFjdHVhbCApO1xuXHRcdGV4cGVjdGVkID0gb2JqZWN0VmFsdWVzKCBleHBlY3RlZCApO1xuXHRcdHRoaXMucHVzaFJlc3VsdCgge1xuXHRcdFx0cmVzdWx0OiAhUVVuaXQuZXF1aXYoIGFjdHVhbCwgZXhwZWN0ZWQgKSxcblx0XHRcdGFjdHVhbDogYWN0dWFsLFxuXHRcdFx0ZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuXHRcdFx0bWVzc2FnZTogbWVzc2FnZSxcblx0XHRcdG5lZ2F0aXZlOiB0cnVlXG5cdFx0fSApO1xuXHR9LFxuXG5cdGRlZXBFcXVhbDogZnVuY3Rpb24oIGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UgKSB7XG5cdFx0dGhpcy5wdXNoUmVzdWx0KCB7XG5cdFx0XHRyZXN1bHQ6IFFVbml0LmVxdWl2KCBhY3R1YWwsIGV4cGVjdGVkICksXG5cdFx0XHRhY3R1YWw6IGFjdHVhbCxcblx0XHRcdGV4cGVjdGVkOiBleHBlY3RlZCxcblx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2Vcblx0XHR9ICk7XG5cdH0sXG5cblx0bm90RGVlcEVxdWFsOiBmdW5jdGlvbiggYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSApIHtcblx0XHR0aGlzLnB1c2hSZXN1bHQoIHtcblx0XHRcdHJlc3VsdDogIVFVbml0LmVxdWl2KCBhY3R1YWwsIGV4cGVjdGVkICksXG5cdFx0XHRhY3R1YWw6IGFjdHVhbCxcblx0XHRcdGV4cGVjdGVkOiBleHBlY3RlZCxcblx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2UsXG5cdFx0XHRuZWdhdGl2ZTogdHJ1ZVxuXHRcdH0gKTtcblx0fSxcblxuXHRzdHJpY3RFcXVhbDogZnVuY3Rpb24oIGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UgKSB7XG5cdFx0dGhpcy5wdXNoUmVzdWx0KCB7XG5cdFx0XHRyZXN1bHQ6IGV4cGVjdGVkID09PSBhY3R1YWwsXG5cdFx0XHRhY3R1YWw6IGFjdHVhbCxcblx0XHRcdGV4cGVjdGVkOiBleHBlY3RlZCxcblx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2Vcblx0XHR9ICk7XG5cdH0sXG5cblx0bm90U3RyaWN0RXF1YWw6IGZ1bmN0aW9uKCBhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlICkge1xuXHRcdHRoaXMucHVzaFJlc3VsdCgge1xuXHRcdFx0cmVzdWx0OiBleHBlY3RlZCAhPT0gYWN0dWFsLFxuXHRcdFx0YWN0dWFsOiBhY3R1YWwsXG5cdFx0XHRleHBlY3RlZDogZXhwZWN0ZWQsXG5cdFx0XHRtZXNzYWdlOiBtZXNzYWdlLFxuXHRcdFx0bmVnYXRpdmU6IHRydWVcblx0XHR9ICk7XG5cdH0sXG5cblx0XCJ0aHJvd3NcIjogZnVuY3Rpb24oIGJsb2NrLCBleHBlY3RlZCwgbWVzc2FnZSApIHtcblx0XHR2YXIgYWN0dWFsLCBleHBlY3RlZFR5cGUsXG5cdFx0XHRleHBlY3RlZE91dHB1dCA9IGV4cGVjdGVkLFxuXHRcdFx0b2sgPSBmYWxzZSxcblx0XHRcdGN1cnJlbnRUZXN0ID0gKCB0aGlzIGluc3RhbmNlb2YgQXNzZXJ0ICYmIHRoaXMudGVzdCApIHx8IFFVbml0LmNvbmZpZy5jdXJyZW50O1xuXG5cdFx0Ly8gJ2V4cGVjdGVkJyBpcyBvcHRpb25hbCB1bmxlc3MgZG9pbmcgc3RyaW5nIGNvbXBhcmlzb25cblx0XHRpZiAoIFFVbml0Lm9iamVjdFR5cGUoIGV4cGVjdGVkICkgPT09IFwic3RyaW5nXCIgKSB7XG5cdFx0XHRpZiAoIG1lc3NhZ2UgPT0gbnVsbCApIHtcblx0XHRcdFx0bWVzc2FnZSA9IGV4cGVjdGVkO1xuXHRcdFx0XHRleHBlY3RlZCA9IG51bGw7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdFx0XCJ0aHJvd3MvcmFpc2VzIGRvZXMgbm90IGFjY2VwdCBhIHN0cmluZyB2YWx1ZSBmb3IgdGhlIGV4cGVjdGVkIGFyZ3VtZW50LlxcblwiICtcblx0XHRcdFx0XHRcIlVzZSBhIG5vbi1zdHJpbmcgb2JqZWN0IHZhbHVlIChlLmcuIHJlZ0V4cCkgaW5zdGVhZCBpZiBpdCdzIG5lY2Vzc2FyeS5cIiArXG5cdFx0XHRcdFx0XCJEZXRhaWxzIGluIG91ciB1cGdyYWRlIGd1aWRlIGF0IGh0dHBzOi8vcXVuaXRqcy5jb20vdXBncmFkZS1ndWlkZS0yLngvXCJcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjdXJyZW50VGVzdC5pZ25vcmVHbG9iYWxFcnJvcnMgPSB0cnVlO1xuXHRcdHRyeSB7XG5cdFx0XHRibG9jay5jYWxsKCBjdXJyZW50VGVzdC50ZXN0RW52aXJvbm1lbnQgKTtcblx0XHR9IGNhdGNoICggZSApIHtcblx0XHRcdGFjdHVhbCA9IGU7XG5cdFx0fVxuXHRcdGN1cnJlbnRUZXN0Lmlnbm9yZUdsb2JhbEVycm9ycyA9IGZhbHNlO1xuXG5cdFx0aWYgKCBhY3R1YWwgKSB7XG5cdFx0XHRleHBlY3RlZFR5cGUgPSBRVW5pdC5vYmplY3RUeXBlKCBleHBlY3RlZCApO1xuXG5cdFx0XHQvLyBXZSBkb24ndCB3YW50IHRvIHZhbGlkYXRlIHRocm93biBlcnJvclxuXHRcdFx0aWYgKCAhZXhwZWN0ZWQgKSB7XG5cdFx0XHRcdG9rID0gdHJ1ZTtcblx0XHRcdFx0ZXhwZWN0ZWRPdXRwdXQgPSBudWxsO1xuXG5cdFx0XHQvLyBFeHBlY3RlZCBpcyBhIHJlZ2V4cFxuXHRcdFx0fSBlbHNlIGlmICggZXhwZWN0ZWRUeXBlID09PSBcInJlZ2V4cFwiICkge1xuXHRcdFx0XHRvayA9IGV4cGVjdGVkLnRlc3QoIGVycm9yU3RyaW5nKCBhY3R1YWwgKSApO1xuXG5cdFx0XHQvLyBFeHBlY3RlZCBpcyBhIGNvbnN0cnVjdG9yLCBtYXliZSBhbiBFcnJvciBjb25zdHJ1Y3RvclxuXHRcdFx0fSBlbHNlIGlmICggZXhwZWN0ZWRUeXBlID09PSBcImZ1bmN0aW9uXCIgJiYgYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQgKSB7XG5cdFx0XHRcdG9rID0gdHJ1ZTtcblxuXHRcdFx0Ly8gRXhwZWN0ZWQgaXMgYW4gRXJyb3Igb2JqZWN0XG5cdFx0XHR9IGVsc2UgaWYgKCBleHBlY3RlZFR5cGUgPT09IFwib2JqZWN0XCIgKSB7XG5cdFx0XHRcdG9rID0gYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQuY29uc3RydWN0b3IgJiZcblx0XHRcdFx0XHRhY3R1YWwubmFtZSA9PT0gZXhwZWN0ZWQubmFtZSAmJlxuXHRcdFx0XHRcdGFjdHVhbC5tZXNzYWdlID09PSBleHBlY3RlZC5tZXNzYWdlO1xuXG5cdFx0XHQvLyBFeHBlY3RlZCBpcyBhIHZhbGlkYXRpb24gZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0cnVlIGlmIHZhbGlkYXRpb24gcGFzc2VkXG5cdFx0XHR9IGVsc2UgaWYgKCBleHBlY3RlZFR5cGUgPT09IFwiZnVuY3Rpb25cIiAmJiBleHBlY3RlZC5jYWxsKCB7fSwgYWN0dWFsICkgPT09IHRydWUgKSB7XG5cdFx0XHRcdGV4cGVjdGVkT3V0cHV0ID0gbnVsbDtcblx0XHRcdFx0b2sgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGN1cnJlbnRUZXN0LmFzc2VydC5wdXNoUmVzdWx0KCB7XG5cdFx0XHRyZXN1bHQ6IG9rLFxuXHRcdFx0YWN0dWFsOiBhY3R1YWwsXG5cdFx0XHRleHBlY3RlZDogZXhwZWN0ZWRPdXRwdXQsXG5cdFx0XHRtZXNzYWdlOiBtZXNzYWdlXG5cdFx0fSApO1xuXHR9XG59O1xuXG4vLyBQcm92aWRlIGFuIGFsdGVybmF0aXZlIHRvIGFzc2VydC50aHJvd3MoKSwgZm9yIGVudmlyb25tZW50cyB0aGF0IGNvbnNpZGVyIHRocm93cyBhIHJlc2VydmVkIHdvcmRcbi8vIEtub3duIHRvIHVzIGFyZTogQ2xvc3VyZSBDb21waWxlciwgTmFyd2hhbFxuKCBmdW5jdGlvbigpIHtcblx0Lypqc2hpbnQgc3ViOnRydWUgKi9cblx0QXNzZXJ0LnByb3RvdHlwZS5yYWlzZXMgPSBBc3NlcnQucHJvdG90eXBlIFsgXCJ0aHJvd3NcIiBdOyAvL2pzY3M6aWdub3JlIHJlcXVpcmVEb3ROb3RhdGlvblxufSgpICk7XG5cbmZ1bmN0aW9uIGVycm9yU3RyaW5nKCBlcnJvciApIHtcblx0dmFyIG5hbWUsIG1lc3NhZ2UsXG5cdFx0cmVzdWx0RXJyb3JTdHJpbmcgPSBlcnJvci50b1N0cmluZygpO1xuXHRpZiAoIHJlc3VsdEVycm9yU3RyaW5nLnN1YnN0cmluZyggMCwgNyApID09PSBcIltvYmplY3RcIiApIHtcblx0XHRuYW1lID0gZXJyb3IubmFtZSA/IGVycm9yLm5hbWUudG9TdHJpbmcoKSA6IFwiRXJyb3JcIjtcblx0XHRtZXNzYWdlID0gZXJyb3IubWVzc2FnZSA/IGVycm9yLm1lc3NhZ2UudG9TdHJpbmcoKSA6IFwiXCI7XG5cdFx0aWYgKCBuYW1lICYmIG1lc3NhZ2UgKSB7XG5cdFx0XHRyZXR1cm4gbmFtZSArIFwiOiBcIiArIG1lc3NhZ2U7XG5cdFx0fSBlbHNlIGlmICggbmFtZSApIHtcblx0XHRcdHJldHVybiBuYW1lO1xuXHRcdH0gZWxzZSBpZiAoIG1lc3NhZ2UgKSB7XG5cdFx0XHRyZXR1cm4gbWVzc2FnZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFwiRXJyb3JcIjtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIHJlc3VsdEVycm9yU3RyaW5nO1xuXHR9XG59XG5cbi8vIFRlc3QgZm9yIGVxdWFsaXR5IGFueSBKYXZhU2NyaXB0IHR5cGUuXG4vLyBBdXRob3I6IFBoaWxpcHBlIFJhdGjDqSA8cHJhdGhlQGdtYWlsLmNvbT5cblFVbml0LmVxdWl2ID0gKCBmdW5jdGlvbigpIHtcblxuXHQvLyBTdGFjayB0byBkZWNpZGUgYmV0d2VlbiBza2lwL2Fib3J0IGZ1bmN0aW9uc1xuXHR2YXIgY2FsbGVycyA9IFtdO1xuXG5cdC8vIFN0YWNrIHRvIGF2b2lkaW5nIGxvb3BzIGZyb20gY2lyY3VsYXIgcmVmZXJlbmNpbmdcblx0dmFyIHBhcmVudHMgPSBbXTtcblx0dmFyIHBhcmVudHNCID0gW107XG5cblx0dmFyIGdldFByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uKCBvYmogKSB7XG5cblx0XHQvKmpzaGludCBwcm90bzogdHJ1ZSAqL1xuXHRcdHJldHVybiBvYmouX19wcm90b19fO1xuXHR9O1xuXG5cdGZ1bmN0aW9uIHVzZVN0cmljdEVxdWFsaXR5KCBiLCBhICkge1xuXG5cdFx0Ly8gVG8gY2F0Y2ggc2hvcnQgYW5ub3RhdGlvbiBWUyAnbmV3JyBhbm5vdGF0aW9uIG9mIGEgZGVjbGFyYXRpb24uIGUuZy46XG5cdFx0Ly8gYHZhciBpID0gMTtgXG5cdFx0Ly8gYHZhciBqID0gbmV3IE51bWJlcigxKTtgXG5cdFx0aWYgKCB0eXBlb2YgYSA9PT0gXCJvYmplY3RcIiApIHtcblx0XHRcdGEgPSBhLnZhbHVlT2YoKTtcblx0XHR9XG5cdFx0aWYgKCB0eXBlb2YgYiA9PT0gXCJvYmplY3RcIiApIHtcblx0XHRcdGIgPSBiLnZhbHVlT2YoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYSA9PT0gYjtcblx0fVxuXG5cdGZ1bmN0aW9uIGNvbXBhcmVDb25zdHJ1Y3RvcnMoIGEsIGIgKSB7XG5cdFx0dmFyIHByb3RvQSA9IGdldFByb3RvKCBhICk7XG5cdFx0dmFyIHByb3RvQiA9IGdldFByb3RvKCBiICk7XG5cblx0XHQvLyBDb21wYXJpbmcgY29uc3RydWN0b3JzIGlzIG1vcmUgc3RyaWN0IHRoYW4gdXNpbmcgYGluc3RhbmNlb2ZgXG5cdFx0aWYgKCBhLmNvbnN0cnVjdG9yID09PSBiLmNvbnN0cnVjdG9yICkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gUmVmICM4NTFcblx0XHQvLyBJZiB0aGUgb2JqIHByb3RvdHlwZSBkZXNjZW5kcyBmcm9tIGEgbnVsbCBjb25zdHJ1Y3RvciwgdHJlYXQgaXRcblx0XHQvLyBhcyBhIG51bGwgcHJvdG90eXBlLlxuXHRcdGlmICggcHJvdG9BICYmIHByb3RvQS5jb25zdHJ1Y3RvciA9PT0gbnVsbCApIHtcblx0XHRcdHByb3RvQSA9IG51bGw7XG5cdFx0fVxuXHRcdGlmICggcHJvdG9CICYmIHByb3RvQi5jb25zdHJ1Y3RvciA9PT0gbnVsbCApIHtcblx0XHRcdHByb3RvQiA9IG51bGw7XG5cdFx0fVxuXG5cdFx0Ly8gQWxsb3cgb2JqZWN0cyB3aXRoIG5vIHByb3RvdHlwZSB0byBiZSBlcXVpdmFsZW50IHRvXG5cdFx0Ly8gb2JqZWN0cyB3aXRoIE9iamVjdCBhcyB0aGVpciBjb25zdHJ1Y3Rvci5cblx0XHRpZiAoICggcHJvdG9BID09PSBudWxsICYmIHByb3RvQiA9PT0gT2JqZWN0LnByb3RvdHlwZSApIHx8XG5cdFx0XHRcdCggcHJvdG9CID09PSBudWxsICYmIHByb3RvQSA9PT0gT2JqZWN0LnByb3RvdHlwZSApICkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0UmVnRXhwRmxhZ3MoIHJlZ2V4cCApIHtcblx0XHRyZXR1cm4gXCJmbGFnc1wiIGluIHJlZ2V4cCA/IHJlZ2V4cC5mbGFncyA6IHJlZ2V4cC50b1N0cmluZygpLm1hdGNoKCAvW2dpbXV5XSokLyApWyAwIF07XG5cdH1cblxuXHR2YXIgY2FsbGJhY2tzID0ge1xuXHRcdFwic3RyaW5nXCI6IHVzZVN0cmljdEVxdWFsaXR5LFxuXHRcdFwiYm9vbGVhblwiOiB1c2VTdHJpY3RFcXVhbGl0eSxcblx0XHRcIm51bWJlclwiOiB1c2VTdHJpY3RFcXVhbGl0eSxcblx0XHRcIm51bGxcIjogdXNlU3RyaWN0RXF1YWxpdHksXG5cdFx0XCJ1bmRlZmluZWRcIjogdXNlU3RyaWN0RXF1YWxpdHksXG5cdFx0XCJzeW1ib2xcIjogdXNlU3RyaWN0RXF1YWxpdHksXG5cdFx0XCJkYXRlXCI6IHVzZVN0cmljdEVxdWFsaXR5LFxuXG5cdFx0XCJuYW5cIjogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9LFxuXG5cdFx0XCJyZWdleHBcIjogZnVuY3Rpb24oIGIsIGEgKSB7XG5cdFx0XHRyZXR1cm4gYS5zb3VyY2UgPT09IGIuc291cmNlICYmXG5cblx0XHRcdFx0Ly8gSW5jbHVkZSBmbGFncyBpbiB0aGUgY29tcGFyaXNvblxuXHRcdFx0XHRnZXRSZWdFeHBGbGFncyggYSApID09PSBnZXRSZWdFeHBGbGFncyggYiApO1xuXHRcdH0sXG5cblx0XHQvLyAtIHNraXAgd2hlbiB0aGUgcHJvcGVydHkgaXMgYSBtZXRob2Qgb2YgYW4gaW5zdGFuY2UgKE9PUClcblx0XHQvLyAtIGFib3J0IG90aGVyd2lzZSxcblx0XHQvLyBpbml0aWFsID09PSB3b3VsZCBoYXZlIGNhdGNoIGlkZW50aWNhbCByZWZlcmVuY2VzIGFueXdheVxuXHRcdFwiZnVuY3Rpb25cIjogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgY2FsbGVyID0gY2FsbGVyc1sgY2FsbGVycy5sZW5ndGggLSAxIF07XG5cdFx0XHRyZXR1cm4gY2FsbGVyICE9PSBPYmplY3QgJiYgdHlwZW9mIGNhbGxlciAhPT0gXCJ1bmRlZmluZWRcIjtcblx0XHR9LFxuXG5cdFx0XCJhcnJheVwiOiBmdW5jdGlvbiggYiwgYSApIHtcblx0XHRcdHZhciBpLCBqLCBsZW4sIGxvb3AsIGFDaXJjdWxhciwgYkNpcmN1bGFyO1xuXG5cdFx0XHRsZW4gPSBhLmxlbmd0aDtcblx0XHRcdGlmICggbGVuICE9PSBiLmxlbmd0aCApIHtcblxuXHRcdFx0XHQvLyBTYWZlIGFuZCBmYXN0ZXJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBUcmFjayByZWZlcmVuY2UgdG8gYXZvaWQgY2lyY3VsYXIgcmVmZXJlbmNlc1xuXHRcdFx0cGFyZW50cy5wdXNoKCBhICk7XG5cdFx0XHRwYXJlbnRzQi5wdXNoKCBiICk7XG5cdFx0XHRmb3IgKCBpID0gMDsgaSA8IGxlbjsgaSsrICkge1xuXHRcdFx0XHRsb29wID0gZmFsc2U7XG5cdFx0XHRcdGZvciAoIGogPSAwOyBqIDwgcGFyZW50cy5sZW5ndGg7IGorKyApIHtcblx0XHRcdFx0XHRhQ2lyY3VsYXIgPSBwYXJlbnRzWyBqIF0gPT09IGFbIGkgXTtcblx0XHRcdFx0XHRiQ2lyY3VsYXIgPSBwYXJlbnRzQlsgaiBdID09PSBiWyBpIF07XG5cdFx0XHRcdFx0aWYgKCBhQ2lyY3VsYXIgfHwgYkNpcmN1bGFyICkge1xuXHRcdFx0XHRcdFx0aWYgKCBhWyBpIF0gPT09IGJbIGkgXSB8fCBhQ2lyY3VsYXIgJiYgYkNpcmN1bGFyICkge1xuXHRcdFx0XHRcdFx0XHRsb29wID0gdHJ1ZTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHBhcmVudHMucG9wKCk7XG5cdFx0XHRcdFx0XHRcdHBhcmVudHNCLnBvcCgpO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggIWxvb3AgJiYgIWlubmVyRXF1aXYoIGFbIGkgXSwgYlsgaSBdICkgKSB7XG5cdFx0XHRcdFx0cGFyZW50cy5wb3AoKTtcblx0XHRcdFx0XHRwYXJlbnRzQi5wb3AoKTtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHBhcmVudHMucG9wKCk7XG5cdFx0XHRwYXJlbnRzQi5wb3AoKTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH0sXG5cblx0XHRcInNldFwiOiBmdW5jdGlvbiggYiwgYSApIHtcblx0XHRcdHZhciBpbm5lckVxLFxuXHRcdFx0XHRvdXRlckVxID0gdHJ1ZTtcblxuXHRcdFx0aWYgKCBhLnNpemUgIT09IGIuc2l6ZSApIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHRhLmZvckVhY2goIGZ1bmN0aW9uKCBhVmFsICkge1xuXHRcdFx0XHRpbm5lckVxID0gZmFsc2U7XG5cblx0XHRcdFx0Yi5mb3JFYWNoKCBmdW5jdGlvbiggYlZhbCApIHtcblx0XHRcdFx0XHRpZiAoIGlubmVyRXF1aXYoIGJWYWwsIGFWYWwgKSApIHtcblx0XHRcdFx0XHRcdGlubmVyRXEgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSApO1xuXG5cdFx0XHRcdGlmICggIWlubmVyRXEgKSB7XG5cdFx0XHRcdFx0b3V0ZXJFcSA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cblx0XHRcdHJldHVybiBvdXRlckVxO1xuXHRcdH0sXG5cblx0XHRcIm1hcFwiOiBmdW5jdGlvbiggYiwgYSApIHtcblx0XHRcdHZhciBpbm5lckVxLFxuXHRcdFx0XHRvdXRlckVxID0gdHJ1ZTtcblxuXHRcdFx0aWYgKCBhLnNpemUgIT09IGIuc2l6ZSApIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHRhLmZvckVhY2goIGZ1bmN0aW9uKCBhVmFsLCBhS2V5ICkge1xuXHRcdFx0XHRpbm5lckVxID0gZmFsc2U7XG5cblx0XHRcdFx0Yi5mb3JFYWNoKCBmdW5jdGlvbiggYlZhbCwgYktleSApIHtcblx0XHRcdFx0XHRpZiAoIGlubmVyRXF1aXYoIFsgYlZhbCwgYktleSBdLCBbIGFWYWwsIGFLZXkgXSApICkge1xuXHRcdFx0XHRcdFx0aW5uZXJFcSA9IHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9ICk7XG5cblx0XHRcdFx0aWYgKCAhaW5uZXJFcSApIHtcblx0XHRcdFx0XHRvdXRlckVxID0gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH0gKTtcblxuXHRcdFx0cmV0dXJuIG91dGVyRXE7XG5cdFx0fSxcblxuXHRcdFwib2JqZWN0XCI6IGZ1bmN0aW9uKCBiLCBhICkge1xuXHRcdFx0dmFyIGksIGosIGxvb3AsIGFDaXJjdWxhciwgYkNpcmN1bGFyO1xuXG5cdFx0XHQvLyBEZWZhdWx0IHRvIHRydWVcblx0XHRcdHZhciBlcSA9IHRydWU7XG5cdFx0XHR2YXIgYVByb3BlcnRpZXMgPSBbXTtcblx0XHRcdHZhciBiUHJvcGVydGllcyA9IFtdO1xuXG5cdFx0XHRpZiAoIGNvbXBhcmVDb25zdHJ1Y3RvcnMoIGEsIGIgKSA9PT0gZmFsc2UgKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gU3RhY2sgY29uc3RydWN0b3IgYmVmb3JlIHRyYXZlcnNpbmcgcHJvcGVydGllc1xuXHRcdFx0Y2FsbGVycy5wdXNoKCBhLmNvbnN0cnVjdG9yICk7XG5cblx0XHRcdC8vIFRyYWNrIHJlZmVyZW5jZSB0byBhdm9pZCBjaXJjdWxhciByZWZlcmVuY2VzXG5cdFx0XHRwYXJlbnRzLnB1c2goIGEgKTtcblx0XHRcdHBhcmVudHNCLnB1c2goIGIgKTtcblxuXHRcdFx0Ly8gQmUgc3RyaWN0OiBkb24ndCBlbnN1cmUgaGFzT3duUHJvcGVydHkgYW5kIGdvIGRlZXBcblx0XHRcdGZvciAoIGkgaW4gYSApIHtcblx0XHRcdFx0bG9vcCA9IGZhbHNlO1xuXHRcdFx0XHRmb3IgKCBqID0gMDsgaiA8IHBhcmVudHMubGVuZ3RoOyBqKysgKSB7XG5cdFx0XHRcdFx0YUNpcmN1bGFyID0gcGFyZW50c1sgaiBdID09PSBhWyBpIF07XG5cdFx0XHRcdFx0YkNpcmN1bGFyID0gcGFyZW50c0JbIGogXSA9PT0gYlsgaSBdO1xuXHRcdFx0XHRcdGlmICggYUNpcmN1bGFyIHx8IGJDaXJjdWxhciApIHtcblx0XHRcdFx0XHRcdGlmICggYVsgaSBdID09PSBiWyBpIF0gfHwgYUNpcmN1bGFyICYmIGJDaXJjdWxhciApIHtcblx0XHRcdFx0XHRcdFx0bG9vcCA9IHRydWU7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRlcSA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0YVByb3BlcnRpZXMucHVzaCggaSApO1xuXHRcdFx0XHRpZiAoICFsb29wICYmICFpbm5lckVxdWl2KCBhWyBpIF0sIGJbIGkgXSApICkge1xuXHRcdFx0XHRcdGVxID0gZmFsc2U7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cGFyZW50cy5wb3AoKTtcblx0XHRcdHBhcmVudHNCLnBvcCgpO1xuXG5cdFx0XHQvLyBVbnN0YWNrLCB3ZSBhcmUgZG9uZVxuXHRcdFx0Y2FsbGVycy5wb3AoKTtcblxuXHRcdFx0Zm9yICggaSBpbiBiICkge1xuXG5cdFx0XHRcdC8vIENvbGxlY3QgYidzIHByb3BlcnRpZXNcblx0XHRcdFx0YlByb3BlcnRpZXMucHVzaCggaSApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBFbnN1cmVzIGlkZW50aWNhbCBwcm9wZXJ0aWVzIG5hbWVcblx0XHRcdHJldHVybiBlcSAmJiBpbm5lckVxdWl2KCBhUHJvcGVydGllcy5zb3J0KCksIGJQcm9wZXJ0aWVzLnNvcnQoKSApO1xuXHRcdH1cblx0fTtcblxuXHRmdW5jdGlvbiB0eXBlRXF1aXYoIGEsIGIgKSB7XG5cdFx0dmFyIHR5cGUgPSBRVW5pdC5vYmplY3RUeXBlKCBhICk7XG5cdFx0cmV0dXJuIFFVbml0Lm9iamVjdFR5cGUoIGIgKSA9PT0gdHlwZSAmJiBjYWxsYmFja3NbIHR5cGUgXSggYiwgYSApO1xuXHR9XG5cblx0Ly8gVGhlIHJlYWwgZXF1aXYgZnVuY3Rpb25cblx0ZnVuY3Rpb24gaW5uZXJFcXVpdiggYSwgYiApIHtcblxuXHRcdC8vIFdlJ3JlIGRvbmUgd2hlbiB0aGVyZSdzIG5vdGhpbmcgbW9yZSB0byBjb21wYXJlXG5cdFx0aWYgKCBhcmd1bWVudHMubGVuZ3RoIDwgMiApIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIFJlcXVpcmUgdHlwZS1zcGVjaWZpYyBlcXVhbGl0eVxuXHRcdHJldHVybiAoIGEgPT09IGIgfHwgdHlwZUVxdWl2KCBhLCBiICkgKSAmJlxuXG5cdFx0XHQvLyAuLi5hY3Jvc3MgYWxsIGNvbnNlY3V0aXZlIGFyZ3VtZW50IHBhaXJzXG5cdFx0XHQoIGFyZ3VtZW50cy5sZW5ndGggPT09IDIgfHwgaW5uZXJFcXVpdi5hcHBseSggdGhpcywgW10uc2xpY2UuY2FsbCggYXJndW1lbnRzLCAxICkgKSApO1xuXHR9XG5cblx0cmV0dXJuIGlubmVyRXF1aXY7XG59KCkgKTtcblxuLy8gQmFzZWQgb24ganNEdW1wIGJ5IEFyaWVsIEZsZXNsZXJcbi8vIGh0dHA6Ly9mbGVzbGVyLmJsb2dzcG90LmNvbS8yMDA4LzA1L2pzZHVtcC1wcmV0dHktZHVtcC1vZi1hbnktamF2YXNjcmlwdC5odG1sXG5RVW5pdC5kdW1wID0gKCBmdW5jdGlvbigpIHtcblx0ZnVuY3Rpb24gcXVvdGUoIHN0ciApIHtcblx0XHRyZXR1cm4gXCJcXFwiXCIgKyBzdHIudG9TdHJpbmcoKS5yZXBsYWNlKCAvXFxcXC9nLCBcIlxcXFxcXFxcXCIgKS5yZXBsYWNlKCAvXCIvZywgXCJcXFxcXFxcIlwiICkgKyBcIlxcXCJcIjtcblx0fVxuXHRmdW5jdGlvbiBsaXRlcmFsKCBvICkge1xuXHRcdHJldHVybiBvICsgXCJcIjtcblx0fVxuXHRmdW5jdGlvbiBqb2luKCBwcmUsIGFyciwgcG9zdCApIHtcblx0XHR2YXIgcyA9IGR1bXAuc2VwYXJhdG9yKCksXG5cdFx0XHRiYXNlID0gZHVtcC5pbmRlbnQoKSxcblx0XHRcdGlubmVyID0gZHVtcC5pbmRlbnQoIDEgKTtcblx0XHRpZiAoIGFyci5qb2luICkge1xuXHRcdFx0YXJyID0gYXJyLmpvaW4oIFwiLFwiICsgcyArIGlubmVyICk7XG5cdFx0fVxuXHRcdGlmICggIWFyciApIHtcblx0XHRcdHJldHVybiBwcmUgKyBwb3N0O1xuXHRcdH1cblx0XHRyZXR1cm4gWyBwcmUsIGlubmVyICsgYXJyLCBiYXNlICsgcG9zdCBdLmpvaW4oIHMgKTtcblx0fVxuXHRmdW5jdGlvbiBhcnJheSggYXJyLCBzdGFjayApIHtcblx0XHR2YXIgaSA9IGFyci5sZW5ndGgsXG5cdFx0XHRyZXQgPSBuZXcgQXJyYXkoIGkgKTtcblxuXHRcdGlmICggZHVtcC5tYXhEZXB0aCAmJiBkdW1wLmRlcHRoID4gZHVtcC5tYXhEZXB0aCApIHtcblx0XHRcdHJldHVybiBcIltvYmplY3QgQXJyYXldXCI7XG5cdFx0fVxuXG5cdFx0dGhpcy51cCgpO1xuXHRcdHdoaWxlICggaS0tICkge1xuXHRcdFx0cmV0WyBpIF0gPSB0aGlzLnBhcnNlKCBhcnJbIGkgXSwgdW5kZWZpbmVkLCBzdGFjayApO1xuXHRcdH1cblx0XHR0aGlzLmRvd24oKTtcblx0XHRyZXR1cm4gam9pbiggXCJbXCIsIHJldCwgXCJdXCIgKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGlzQXJyYXkoIG9iaiApIHtcblx0XHRyZXR1cm4gKFxuXG5cdFx0XHQvL05hdGl2ZSBBcnJheXNcblx0XHRcdHRvU3RyaW5nLmNhbGwoIG9iaiApID09PSBcIltvYmplY3QgQXJyYXldXCIgfHxcblxuXHRcdFx0Ly8gTm9kZUxpc3Qgb2JqZWN0c1xuXHRcdFx0KCB0eXBlb2Ygb2JqLmxlbmd0aCA9PT0gXCJudW1iZXJcIiAmJiBvYmouaXRlbSAhPT0gdW5kZWZpbmVkICkgJiZcblx0XHRcdCggb2JqLmxlbmd0aCA/XG5cdFx0XHRcdG9iai5pdGVtKCAwICkgPT09IG9ialsgMCBdIDpcblx0XHRcdFx0KCBvYmouaXRlbSggMCApID09PSBudWxsICYmIG9ialsgMCBdID09PSB1bmRlZmluZWQgKVxuXHRcdFx0KVxuXHRcdCk7XG5cdH1cblxuXHR2YXIgcmVOYW1lID0gL15mdW5jdGlvbiAoXFx3KykvLFxuXHRcdGR1bXAgPSB7XG5cblx0XHRcdC8vIFRoZSBvYmpUeXBlIGlzIHVzZWQgbW9zdGx5IGludGVybmFsbHksIHlvdSBjYW4gZml4IGEgKGN1c3RvbSkgdHlwZSBpbiBhZHZhbmNlXG5cdFx0XHRwYXJzZTogZnVuY3Rpb24oIG9iaiwgb2JqVHlwZSwgc3RhY2sgKSB7XG5cdFx0XHRcdHN0YWNrID0gc3RhY2sgfHwgW107XG5cdFx0XHRcdHZhciByZXMsIHBhcnNlciwgcGFyc2VyVHlwZSxcblx0XHRcdFx0XHRpblN0YWNrID0gaW5BcnJheSggb2JqLCBzdGFjayApO1xuXG5cdFx0XHRcdGlmICggaW5TdGFjayAhPT0gLTEgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFwicmVjdXJzaW9uKFwiICsgKCBpblN0YWNrIC0gc3RhY2subGVuZ3RoICkgKyBcIilcIjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdG9ialR5cGUgPSBvYmpUeXBlIHx8IHRoaXMudHlwZU9mKCBvYmogICk7XG5cdFx0XHRcdHBhcnNlciA9IHRoaXMucGFyc2Vyc1sgb2JqVHlwZSBdO1xuXHRcdFx0XHRwYXJzZXJUeXBlID0gdHlwZW9mIHBhcnNlcjtcblxuXHRcdFx0XHRpZiAoIHBhcnNlclR5cGUgPT09IFwiZnVuY3Rpb25cIiApIHtcblx0XHRcdFx0XHRzdGFjay5wdXNoKCBvYmogKTtcblx0XHRcdFx0XHRyZXMgPSBwYXJzZXIuY2FsbCggdGhpcywgb2JqLCBzdGFjayApO1xuXHRcdFx0XHRcdHN0YWNrLnBvcCgpO1xuXHRcdFx0XHRcdHJldHVybiByZXM7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuICggcGFyc2VyVHlwZSA9PT0gXCJzdHJpbmdcIiApID8gcGFyc2VyIDogdGhpcy5wYXJzZXJzLmVycm9yO1xuXHRcdFx0fSxcblx0XHRcdHR5cGVPZjogZnVuY3Rpb24oIG9iaiApIHtcblx0XHRcdFx0dmFyIHR5cGU7XG5cblx0XHRcdFx0aWYgKCBvYmogPT09IG51bGwgKSB7XG5cdFx0XHRcdFx0dHlwZSA9IFwibnVsbFwiO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCB0eXBlb2Ygb2JqID09PSBcInVuZGVmaW5lZFwiICkge1xuXHRcdFx0XHRcdHR5cGUgPSBcInVuZGVmaW5lZFwiO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCBRVW5pdC5pcyggXCJyZWdleHBcIiwgb2JqICkgKSB7XG5cdFx0XHRcdFx0dHlwZSA9IFwicmVnZXhwXCI7XG5cdFx0XHRcdH0gZWxzZSBpZiAoIFFVbml0LmlzKCBcImRhdGVcIiwgb2JqICkgKSB7XG5cdFx0XHRcdFx0dHlwZSA9IFwiZGF0ZVwiO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCBRVW5pdC5pcyggXCJmdW5jdGlvblwiLCBvYmogKSApIHtcblx0XHRcdFx0XHR0eXBlID0gXCJmdW5jdGlvblwiO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCBvYmouc2V0SW50ZXJ2YWwgIT09IHVuZGVmaW5lZCAmJlxuXHRcdFx0XHRcdFx0b2JqLmRvY3VtZW50ICE9PSB1bmRlZmluZWQgJiZcblx0XHRcdFx0XHRcdG9iai5ub2RlVHlwZSA9PT0gdW5kZWZpbmVkICkge1xuXHRcdFx0XHRcdHR5cGUgPSBcIndpbmRvd1wiO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCBvYmoubm9kZVR5cGUgPT09IDkgKSB7XG5cdFx0XHRcdFx0dHlwZSA9IFwiZG9jdW1lbnRcIjtcblx0XHRcdFx0fSBlbHNlIGlmICggb2JqLm5vZGVUeXBlICkge1xuXHRcdFx0XHRcdHR5cGUgPSBcIm5vZGVcIjtcblx0XHRcdFx0fSBlbHNlIGlmICggaXNBcnJheSggb2JqICkgKSB7XG5cdFx0XHRcdFx0dHlwZSA9IFwiYXJyYXlcIjtcblx0XHRcdFx0fSBlbHNlIGlmICggb2JqLmNvbnN0cnVjdG9yID09PSBFcnJvci5wcm90b3R5cGUuY29uc3RydWN0b3IgKSB7XG5cdFx0XHRcdFx0dHlwZSA9IFwiZXJyb3JcIjtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0eXBlID0gdHlwZW9mIG9iajtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdHlwZTtcblx0XHRcdH0sXG5cblx0XHRcdHNlcGFyYXRvcjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLm11bHRpbGluZSA/IHRoaXMuSFRNTCA/IFwiPGJyIC8+XCIgOiBcIlxcblwiIDogdGhpcy5IVE1MID8gXCImIzE2MDtcIiA6IFwiIFwiO1xuXHRcdFx0fSxcblxuXHRcdFx0Ly8gRXh0cmEgY2FuIGJlIGEgbnVtYmVyLCBzaG9ydGN1dCBmb3IgaW5jcmVhc2luZy1jYWxsaW5nLWRlY3JlYXNpbmdcblx0XHRcdGluZGVudDogZnVuY3Rpb24oIGV4dHJhICkge1xuXHRcdFx0XHRpZiAoICF0aGlzLm11bHRpbGluZSApIHtcblx0XHRcdFx0XHRyZXR1cm4gXCJcIjtcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgY2hyID0gdGhpcy5pbmRlbnRDaGFyO1xuXHRcdFx0XHRpZiAoIHRoaXMuSFRNTCApIHtcblx0XHRcdFx0XHRjaHIgPSBjaHIucmVwbGFjZSggL1xcdC9nLCBcIiAgIFwiICkucmVwbGFjZSggLyAvZywgXCImIzE2MDtcIiApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBuZXcgQXJyYXkoIHRoaXMuZGVwdGggKyAoIGV4dHJhIHx8IDAgKSApLmpvaW4oIGNociApO1xuXHRcdFx0fSxcblx0XHRcdHVwOiBmdW5jdGlvbiggYSApIHtcblx0XHRcdFx0dGhpcy5kZXB0aCArPSBhIHx8IDE7XG5cdFx0XHR9LFxuXHRcdFx0ZG93bjogZnVuY3Rpb24oIGEgKSB7XG5cdFx0XHRcdHRoaXMuZGVwdGggLT0gYSB8fCAxO1xuXHRcdFx0fSxcblx0XHRcdHNldFBhcnNlcjogZnVuY3Rpb24oIG5hbWUsIHBhcnNlciApIHtcblx0XHRcdFx0dGhpcy5wYXJzZXJzWyBuYW1lIF0gPSBwYXJzZXI7XG5cdFx0XHR9LFxuXG5cdFx0XHQvLyBUaGUgbmV4dCAzIGFyZSBleHBvc2VkIHNvIHlvdSBjYW4gdXNlIHRoZW1cblx0XHRcdHF1b3RlOiBxdW90ZSxcblx0XHRcdGxpdGVyYWw6IGxpdGVyYWwsXG5cdFx0XHRqb2luOiBqb2luLFxuXHRcdFx0ZGVwdGg6IDEsXG5cdFx0XHRtYXhEZXB0aDogUVVuaXQuY29uZmlnLm1heERlcHRoLFxuXG5cdFx0XHQvLyBUaGlzIGlzIHRoZSBsaXN0IG9mIHBhcnNlcnMsIHRvIG1vZGlmeSB0aGVtLCB1c2UgZHVtcC5zZXRQYXJzZXJcblx0XHRcdHBhcnNlcnM6IHtcblx0XHRcdFx0d2luZG93OiBcIltXaW5kb3ddXCIsXG5cdFx0XHRcdGRvY3VtZW50OiBcIltEb2N1bWVudF1cIixcblx0XHRcdFx0ZXJyb3I6IGZ1bmN0aW9uKCBlcnJvciApIHtcblx0XHRcdFx0XHRyZXR1cm4gXCJFcnJvcihcXFwiXCIgKyBlcnJvci5tZXNzYWdlICsgXCJcXFwiKVwiO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR1bmtub3duOiBcIltVbmtub3duXVwiLFxuXHRcdFx0XHRcIm51bGxcIjogXCJudWxsXCIsXG5cdFx0XHRcdFwidW5kZWZpbmVkXCI6IFwidW5kZWZpbmVkXCIsXG5cdFx0XHRcdFwiZnVuY3Rpb25cIjogZnVuY3Rpb24oIGZuICkge1xuXHRcdFx0XHRcdHZhciByZXQgPSBcImZ1bmN0aW9uXCIsXG5cblx0XHRcdFx0XHRcdC8vIEZ1bmN0aW9ucyBuZXZlciBoYXZlIG5hbWUgaW4gSUVcblx0XHRcdFx0XHRcdG5hbWUgPSBcIm5hbWVcIiBpbiBmbiA/IGZuLm5hbWUgOiAoIHJlTmFtZS5leGVjKCBmbiApIHx8IFtdIClbIDEgXTtcblxuXHRcdFx0XHRcdGlmICggbmFtZSApIHtcblx0XHRcdFx0XHRcdHJldCArPSBcIiBcIiArIG5hbWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldCArPSBcIihcIjtcblxuXHRcdFx0XHRcdHJldCA9IFsgcmV0LCBkdW1wLnBhcnNlKCBmbiwgXCJmdW5jdGlvbkFyZ3NcIiApLCBcIil7XCIgXS5qb2luKCBcIlwiICk7XG5cdFx0XHRcdFx0cmV0dXJuIGpvaW4oIHJldCwgZHVtcC5wYXJzZSggZm4sIFwiZnVuY3Rpb25Db2RlXCIgKSwgXCJ9XCIgKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0YXJyYXk6IGFycmF5LFxuXHRcdFx0XHRub2RlbGlzdDogYXJyYXksXG5cdFx0XHRcdFwiYXJndW1lbnRzXCI6IGFycmF5LFxuXHRcdFx0XHRvYmplY3Q6IGZ1bmN0aW9uKCBtYXAsIHN0YWNrICkge1xuXHRcdFx0XHRcdHZhciBrZXlzLCBrZXksIHZhbCwgaSwgbm9uRW51bWVyYWJsZVByb3BlcnRpZXMsXG5cdFx0XHRcdFx0XHRyZXQgPSBbXTtcblxuXHRcdFx0XHRcdGlmICggZHVtcC5tYXhEZXB0aCAmJiBkdW1wLmRlcHRoID4gZHVtcC5tYXhEZXB0aCApIHtcblx0XHRcdFx0XHRcdHJldHVybiBcIltvYmplY3QgT2JqZWN0XVwiO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGR1bXAudXAoKTtcblx0XHRcdFx0XHRrZXlzID0gW107XG5cdFx0XHRcdFx0Zm9yICgga2V5IGluIG1hcCApIHtcblx0XHRcdFx0XHRcdGtleXMucHVzaCgga2V5ICk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gU29tZSBwcm9wZXJ0aWVzIGFyZSBub3QgYWx3YXlzIGVudW1lcmFibGUgb24gRXJyb3Igb2JqZWN0cy5cblx0XHRcdFx0XHRub25FbnVtZXJhYmxlUHJvcGVydGllcyA9IFsgXCJtZXNzYWdlXCIsIFwibmFtZVwiIF07XG5cdFx0XHRcdFx0Zm9yICggaSBpbiBub25FbnVtZXJhYmxlUHJvcGVydGllcyApIHtcblx0XHRcdFx0XHRcdGtleSA9IG5vbkVudW1lcmFibGVQcm9wZXJ0aWVzWyBpIF07XG5cdFx0XHRcdFx0XHRpZiAoIGtleSBpbiBtYXAgJiYgaW5BcnJheSgga2V5LCBrZXlzICkgPCAwICkge1xuXHRcdFx0XHRcdFx0XHRrZXlzLnB1c2goIGtleSApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRrZXlzLnNvcnQoKTtcblx0XHRcdFx0XHRmb3IgKCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKysgKSB7XG5cdFx0XHRcdFx0XHRrZXkgPSBrZXlzWyBpIF07XG5cdFx0XHRcdFx0XHR2YWwgPSBtYXBbIGtleSBdO1xuXHRcdFx0XHRcdFx0cmV0LnB1c2goIGR1bXAucGFyc2UoIGtleSwgXCJrZXlcIiApICsgXCI6IFwiICtcblx0XHRcdFx0XHRcdFx0ZHVtcC5wYXJzZSggdmFsLCB1bmRlZmluZWQsIHN0YWNrICkgKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZHVtcC5kb3duKCk7XG5cdFx0XHRcdFx0cmV0dXJuIGpvaW4oIFwie1wiLCByZXQsIFwifVwiICk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdG5vZGU6IGZ1bmN0aW9uKCBub2RlICkge1xuXHRcdFx0XHRcdHZhciBsZW4sIGksIHZhbCxcblx0XHRcdFx0XHRcdG9wZW4gPSBkdW1wLkhUTUwgPyBcIiZsdDtcIiA6IFwiPFwiLFxuXHRcdFx0XHRcdFx0Y2xvc2UgPSBkdW1wLkhUTUwgPyBcIiZndDtcIiA6IFwiPlwiLFxuXHRcdFx0XHRcdFx0dGFnID0gbm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpLFxuXHRcdFx0XHRcdFx0cmV0ID0gb3BlbiArIHRhZyxcblx0XHRcdFx0XHRcdGF0dHJzID0gbm9kZS5hdHRyaWJ1dGVzO1xuXG5cdFx0XHRcdFx0aWYgKCBhdHRycyApIHtcblx0XHRcdFx0XHRcdGZvciAoIGkgPSAwLCBsZW4gPSBhdHRycy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdFx0XHRcdFx0dmFsID0gYXR0cnNbIGkgXS5ub2RlVmFsdWU7XG5cblx0XHRcdFx0XHRcdFx0Ly8gSUU2IGluY2x1ZGVzIGFsbCBhdHRyaWJ1dGVzIGluIC5hdHRyaWJ1dGVzLCBldmVuIG9uZXMgbm90IGV4cGxpY2l0bHlcblx0XHRcdFx0XHRcdFx0Ly8gc2V0LiBUaG9zZSBoYXZlIHZhbHVlcyBsaWtlIHVuZGVmaW5lZCwgbnVsbCwgMCwgZmFsc2UsIFwiXCIgb3Jcblx0XHRcdFx0XHRcdFx0Ly8gXCJpbmhlcml0XCIuXG5cdFx0XHRcdFx0XHRcdGlmICggdmFsICYmIHZhbCAhPT0gXCJpbmhlcml0XCIgKSB7XG5cdFx0XHRcdFx0XHRcdFx0cmV0ICs9IFwiIFwiICsgYXR0cnNbIGkgXS5ub2RlTmFtZSArIFwiPVwiICtcblx0XHRcdFx0XHRcdFx0XHRcdGR1bXAucGFyc2UoIHZhbCwgXCJhdHRyaWJ1dGVcIiApO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldCArPSBjbG9zZTtcblxuXHRcdFx0XHRcdC8vIFNob3cgY29udGVudCBvZiBUZXh0Tm9kZSBvciBDREFUQVNlY3Rpb25cblx0XHRcdFx0XHRpZiAoIG5vZGUubm9kZVR5cGUgPT09IDMgfHwgbm9kZS5ub2RlVHlwZSA9PT0gNCApIHtcblx0XHRcdFx0XHRcdHJldCArPSBub2RlLm5vZGVWYWx1ZTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gcmV0ICsgb3BlbiArIFwiL1wiICsgdGFnICsgY2xvc2U7XG5cdFx0XHRcdH0sXG5cblx0XHRcdFx0Ly8gRnVuY3Rpb24gY2FsbHMgaXQgaW50ZXJuYWxseSwgaXQncyB0aGUgYXJndW1lbnRzIHBhcnQgb2YgdGhlIGZ1bmN0aW9uXG5cdFx0XHRcdGZ1bmN0aW9uQXJnczogZnVuY3Rpb24oIGZuICkge1xuXHRcdFx0XHRcdHZhciBhcmdzLFxuXHRcdFx0XHRcdFx0bCA9IGZuLmxlbmd0aDtcblxuXHRcdFx0XHRcdGlmICggIWwgKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gXCJcIjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRhcmdzID0gbmV3IEFycmF5KCBsICk7XG5cdFx0XHRcdFx0d2hpbGUgKCBsLS0gKSB7XG5cblx0XHRcdFx0XHRcdC8vIDk3IGlzICdhJ1xuXHRcdFx0XHRcdFx0YXJnc1sgbCBdID0gU3RyaW5nLmZyb21DaGFyQ29kZSggOTcgKyBsICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiBcIiBcIiArIGFyZ3Muam9pbiggXCIsIFwiICkgKyBcIiBcIjtcblx0XHRcdFx0fSxcblxuXHRcdFx0XHQvLyBPYmplY3QgY2FsbHMgaXQgaW50ZXJuYWxseSwgdGhlIGtleSBwYXJ0IG9mIGFuIGl0ZW0gaW4gYSBtYXBcblx0XHRcdFx0a2V5OiBxdW90ZSxcblxuXHRcdFx0XHQvLyBGdW5jdGlvbiBjYWxscyBpdCBpbnRlcm5hbGx5LCBpdCdzIHRoZSBjb250ZW50IG9mIHRoZSBmdW5jdGlvblxuXHRcdFx0XHRmdW5jdGlvbkNvZGU6IFwiW2NvZGVdXCIsXG5cblx0XHRcdFx0Ly8gTm9kZSBjYWxscyBpdCBpbnRlcm5hbGx5LCBpdCdzIGEgaHRtbCBhdHRyaWJ1dGUgdmFsdWVcblx0XHRcdFx0YXR0cmlidXRlOiBxdW90ZSxcblx0XHRcdFx0c3RyaW5nOiBxdW90ZSxcblx0XHRcdFx0ZGF0ZTogcXVvdGUsXG5cdFx0XHRcdHJlZ2V4cDogbGl0ZXJhbCxcblx0XHRcdFx0bnVtYmVyOiBsaXRlcmFsLFxuXHRcdFx0XHRcImJvb2xlYW5cIjogbGl0ZXJhbFxuXHRcdFx0fSxcblxuXHRcdFx0Ly8gSWYgdHJ1ZSwgZW50aXRpZXMgYXJlIGVzY2FwZWQgKCA8LCA+LCBcXHQsIHNwYWNlIGFuZCBcXG4gKVxuXHRcdFx0SFRNTDogZmFsc2UsXG5cblx0XHRcdC8vIEluZGVudGF0aW9uIHVuaXRcblx0XHRcdGluZGVudENoYXI6IFwiICBcIixcblxuXHRcdFx0Ly8gSWYgdHJ1ZSwgaXRlbXMgaW4gYSBjb2xsZWN0aW9uLCBhcmUgc2VwYXJhdGVkIGJ5IGEgXFxuLCBlbHNlIGp1c3QgYSBzcGFjZS5cblx0XHRcdG11bHRpbGluZTogdHJ1ZVxuXHRcdH07XG5cblx0cmV0dXJuIGR1bXA7XG59KCkgKTtcblxuLy8gQmFjayBjb21wYXRcblFVbml0LmpzRHVtcCA9IFFVbml0LmR1bXA7XG5cbmZ1bmN0aW9uIGFwcGx5RGVwcmVjYXRlZCggbmFtZSApIHtcblx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdG5hbWUgKyBcIiBpcyByZW1vdmVkIGluIFFVbml0IDIuMC5cXG5cIiArXG5cdFx0XHRcIkRldGFpbHMgaW4gb3VyIHVwZ3JhZGUgZ3VpZGUgYXQgaHR0cHM6Ly9xdW5pdGpzLmNvbS91cGdyYWRlLWd1aWRlLTIueC9cIlxuXHRcdCk7XG5cdH07XG59XG5cbk9iamVjdC5rZXlzKCBBc3NlcnQucHJvdG90eXBlICkuZm9yRWFjaCggZnVuY3Rpb24oIGtleSApIHtcblx0UVVuaXRbIGtleSBdID0gYXBwbHlEZXByZWNhdGVkKCBcImBRVW5pdC5cIiArIGtleSArIFwiYFwiICk7XG59ICk7XG5cblFVbml0LmFzeW5jVGVzdCA9IGZ1bmN0aW9uKCkge1xuXHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XCJhc3luY1Rlc3QgaXMgcmVtb3ZlZCBpbiBRVW5pdCAyLjAsIHVzZSBRVW5pdC50ZXN0KCkgd2l0aCBhc3NlcnQuYXN5bmMoKSBpbnN0ZWFkLlxcblwiICtcblx0XHRcIkRldGFpbHMgaW4gb3VyIHVwZ3JhZGUgZ3VpZGUgYXQgaHR0cHM6Ly9xdW5pdGpzLmNvbS91cGdyYWRlLWd1aWRlLTIueC9cIlxuXHQpO1xufTtcblxuUVVuaXQuc3RvcCA9IGZ1bmN0aW9uKCkge1xuXHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XCJRVW5pdC5zdG9wIGlzIHJlbW92ZWQgaW4gUVVuaXQgMi4wLCB1c2UgUVVuaXQudGVzdCgpIHdpdGggYXNzZXJ0LmFzeW5jKCkgaW5zdGVhZC5cXG5cIiArXG5cdFx0XCJEZXRhaWxzIGluIG91ciB1cGdyYWRlIGd1aWRlIGF0IGh0dHBzOi8vcXVuaXRqcy5jb20vdXBncmFkZS1ndWlkZS0yLngvXCJcblx0KTtcbn07XG5cbmZ1bmN0aW9uIHJlc2V0VGhyb3dlcigpIHtcblx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFwiUVVuaXQucmVzZXQgaXMgcmVtb3ZlZCBpbiBRVW5pdCAyLjAgd2l0aG91dCByZXBsYWNlbWVudC5cXG5cIiArXG5cdFx0XCJEZXRhaWxzIGluIG91ciB1cGdyYWRlIGd1aWRlIGF0IGh0dHBzOi8vcXVuaXRqcy5jb20vdXBncmFkZS1ndWlkZS0yLngvXCJcblx0KTtcbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KCBRVW5pdCwgXCJyZXNldFwiLCB7XG5cdGdldDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHJlc2V0VGhyb3dlcjtcblx0fSxcblx0c2V0OiByZXNldFRocm93ZXJcbn0gKTtcblxuaWYgKCBkZWZpbmVkLmRvY3VtZW50ICkge1xuXHRpZiAoIHdpbmRvdy5RVW5pdCApIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoIFwiUVVuaXQgaGFzIGFscmVhZHkgYmVlbiBkZWZpbmVkLlwiICk7XG5cdH1cblxuXHRbXG5cdFx0XCJ0ZXN0XCIsXG5cdFx0XCJtb2R1bGVcIixcblx0XHRcImV4cGVjdFwiLFxuXHRcdFwic3RhcnRcIixcblx0XHRcIm9rXCIsXG5cdFx0XCJub3RPa1wiLFxuXHRcdFwiZXF1YWxcIixcblx0XHRcIm5vdEVxdWFsXCIsXG5cdFx0XCJwcm9wRXF1YWxcIixcblx0XHRcIm5vdFByb3BFcXVhbFwiLFxuXHRcdFwiZGVlcEVxdWFsXCIsXG5cdFx0XCJub3REZWVwRXF1YWxcIixcblx0XHRcInN0cmljdEVxdWFsXCIsXG5cdFx0XCJub3RTdHJpY3RFcXVhbFwiLFxuXHRcdFwidGhyb3dzXCIsXG5cdFx0XCJyYWlzZXNcIlxuXHRdLmZvckVhY2goIGZ1bmN0aW9uKCBrZXkgKSB7XG5cdFx0d2luZG93WyBrZXkgXSA9IGFwcGx5RGVwcmVjYXRlZCggXCJUaGUgZ2xvYmFsIGBcIiArIGtleSArIFwiYFwiICk7XG5cdH0gKTtcblxuXHR3aW5kb3cuUVVuaXQgPSBRVW5pdDtcbn1cblxuLy8gRm9yIG5vZGVqc1xuaWYgKCB0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZSAmJiBtb2R1bGUuZXhwb3J0cyApIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBRVW5pdDtcblxuXHQvLyBGb3IgY29uc2lzdGVuY3kgd2l0aCBDb21tb25KUyBlbnZpcm9ubWVudHMnIGV4cG9ydHNcblx0bW9kdWxlLmV4cG9ydHMuUVVuaXQgPSBRVW5pdDtcbn1cblxuLy8gRm9yIENvbW1vbkpTIHdpdGggZXhwb3J0cywgYnV0IHdpdGhvdXQgbW9kdWxlLmV4cG9ydHMsIGxpa2UgUmhpbm9cbmlmICggdHlwZW9mIGV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIgJiYgZXhwb3J0cyApIHtcblx0ZXhwb3J0cy5RVW5pdCA9IFFVbml0O1xufVxuXG5pZiAoIHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kICkge1xuXHRkZWZpbmUoIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBRVW5pdDtcblx0fSApO1xuXHRRVW5pdC5jb25maWcuYXV0b3N0YXJ0ID0gZmFsc2U7XG59XG5cbi8vIEdldCBhIHJlZmVyZW5jZSB0byB0aGUgZ2xvYmFsIG9iamVjdCwgbGlrZSB3aW5kb3cgaW4gYnJvd3NlcnNcbn0oICggZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzO1xufSgpICkgKSApO1xuXG4oIGZ1bmN0aW9uKCkge1xuXG5pZiAoIHR5cGVvZiB3aW5kb3cgPT09IFwidW5kZWZpbmVkXCIgfHwgIXdpbmRvdy5kb2N1bWVudCApIHtcblx0cmV0dXJuO1xufVxuXG52YXIgY29uZmlnID0gUVVuaXQuY29uZmlnLFxuXHRoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vLyBTdG9yZXMgZml4dHVyZSBIVE1MIGZvciByZXNldHRpbmcgbGF0ZXJcbmZ1bmN0aW9uIHN0b3JlRml4dHVyZSgpIHtcblxuXHQvLyBBdm9pZCBvdmVyd3JpdGluZyB1c2VyLWRlZmluZWQgdmFsdWVzXG5cdGlmICggaGFzT3duLmNhbGwoIGNvbmZpZywgXCJmaXh0dXJlXCIgKSApIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHR2YXIgZml4dHVyZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCBcInF1bml0LWZpeHR1cmVcIiApO1xuXHRpZiAoIGZpeHR1cmUgKSB7XG5cdFx0Y29uZmlnLmZpeHR1cmUgPSBmaXh0dXJlLmlubmVySFRNTDtcblx0fVxufVxuXG5RVW5pdC5iZWdpbiggc3RvcmVGaXh0dXJlICk7XG5cbi8vIFJlc2V0cyB0aGUgZml4dHVyZSBET00gZWxlbWVudCBpZiBhdmFpbGFibGUuXG5mdW5jdGlvbiByZXNldEZpeHR1cmUoKSB7XG5cdGlmICggY29uZmlnLmZpeHR1cmUgPT0gbnVsbCApIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHR2YXIgZml4dHVyZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCBcInF1bml0LWZpeHR1cmVcIiApO1xuXHRpZiAoIGZpeHR1cmUgKSB7XG5cdFx0Zml4dHVyZS5pbm5lckhUTUwgPSBjb25maWcuZml4dHVyZTtcblx0fVxufVxuXG5RVW5pdC50ZXN0U3RhcnQoIHJlc2V0Rml4dHVyZSApO1xuXG59KCkgKTtcblxuKCBmdW5jdGlvbigpIHtcblxuLy8gT25seSBpbnRlcmFjdCB3aXRoIFVSTHMgdmlhIHdpbmRvdy5sb2NhdGlvblxudmFyIGxvY2F0aW9uID0gdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3cubG9jYXRpb247XG5pZiAoICFsb2NhdGlvbiApIHtcblx0cmV0dXJuO1xufVxuXG52YXIgdXJsUGFyYW1zID0gZ2V0VXJsUGFyYW1zKCk7XG5cblFVbml0LnVybFBhcmFtcyA9IHVybFBhcmFtcztcblxuLy8gTWF0Y2ggbW9kdWxlL3Rlc3QgYnkgaW5jbHVzaW9uIGluIGFuIGFycmF5XG5RVW5pdC5jb25maWcubW9kdWxlSWQgPSBbXS5jb25jYXQoIHVybFBhcmFtcy5tb2R1bGVJZCB8fCBbXSApO1xuUVVuaXQuY29uZmlnLnRlc3RJZCA9IFtdLmNvbmNhdCggdXJsUGFyYW1zLnRlc3RJZCB8fCBbXSApO1xuXG4vLyBFeGFjdCBjYXNlLWluc2Vuc2l0aXZlIG1hdGNoIG9mIHRoZSBtb2R1bGUgbmFtZVxuUVVuaXQuY29uZmlnLm1vZHVsZSA9IHVybFBhcmFtcy5tb2R1bGU7XG5cbi8vIFJlZ3VsYXIgZXhwcmVzc2lvbiBvciBjYXNlLWluc2Vuc3RpdmUgc3Vic3RyaW5nIG1hdGNoIGFnYWluc3QgXCJtb2R1bGVOYW1lOiB0ZXN0TmFtZVwiXG5RVW5pdC5jb25maWcuZmlsdGVyID0gdXJsUGFyYW1zLmZpbHRlcjtcblxuLy8gVGVzdCBvcmRlciByYW5kb21pemF0aW9uXG5pZiAoIHVybFBhcmFtcy5zZWVkID09PSB0cnVlICkge1xuXG5cdC8vIEdlbmVyYXRlIGEgcmFuZG9tIHNlZWQgaWYgdGhlIG9wdGlvbiBpcyBzcGVjaWZpZWQgd2l0aG91dCBhIHZhbHVlXG5cdFFVbml0LmNvbmZpZy5zZWVkID0gTWF0aC5yYW5kb20oKS50b1N0cmluZyggMzYgKS5zbGljZSggMiApO1xufSBlbHNlIGlmICggdXJsUGFyYW1zLnNlZWQgKSB7XG5cdFFVbml0LmNvbmZpZy5zZWVkID0gdXJsUGFyYW1zLnNlZWQ7XG59XG5cbi8vIEFkZCBVUkwtcGFyYW1ldGVyLW1hcHBlZCBjb25maWcgdmFsdWVzIHdpdGggVUkgZm9ybSByZW5kZXJpbmcgZGF0YVxuUVVuaXQuY29uZmlnLnVybENvbmZpZy5wdXNoKFxuXHR7XG5cdFx0aWQ6IFwiaGlkZXBhc3NlZFwiLFxuXHRcdGxhYmVsOiBcIkhpZGUgcGFzc2VkIHRlc3RzXCIsXG5cdFx0dG9vbHRpcDogXCJPbmx5IHNob3cgdGVzdHMgYW5kIGFzc2VydGlvbnMgdGhhdCBmYWlsLiBTdG9yZWQgYXMgcXVlcnktc3RyaW5ncy5cIlxuXHR9LFxuXHR7XG5cdFx0aWQ6IFwibm9nbG9iYWxzXCIsXG5cdFx0bGFiZWw6IFwiQ2hlY2sgZm9yIEdsb2JhbHNcIixcblx0XHR0b29sdGlwOiBcIkVuYWJsaW5nIHRoaXMgd2lsbCB0ZXN0IGlmIGFueSB0ZXN0IGludHJvZHVjZXMgbmV3IHByb3BlcnRpZXMgb24gdGhlIFwiICtcblx0XHRcdFwiZ2xvYmFsIG9iamVjdCAoYHdpbmRvd2AgaW4gQnJvd3NlcnMpLiBTdG9yZWQgYXMgcXVlcnktc3RyaW5ncy5cIlxuXHR9LFxuXHR7XG5cdFx0aWQ6IFwibm90cnljYXRjaFwiLFxuXHRcdGxhYmVsOiBcIk5vIHRyeS1jYXRjaFwiLFxuXHRcdHRvb2x0aXA6IFwiRW5hYmxpbmcgdGhpcyB3aWxsIHJ1biB0ZXN0cyBvdXRzaWRlIG9mIGEgdHJ5LWNhdGNoIGJsb2NrLiBNYWtlcyBkZWJ1Z2dpbmcgXCIgK1xuXHRcdFx0XCJleGNlcHRpb25zIGluIElFIHJlYXNvbmFibGUuIFN0b3JlZCBhcyBxdWVyeS1zdHJpbmdzLlwiXG5cdH1cbik7XG5cblFVbml0LmJlZ2luKCBmdW5jdGlvbigpIHtcblx0dmFyIGksIG9wdGlvbixcblx0XHR1cmxDb25maWcgPSBRVW5pdC5jb25maWcudXJsQ29uZmlnO1xuXG5cdGZvciAoIGkgPSAwOyBpIDwgdXJsQ29uZmlnLmxlbmd0aDsgaSsrICkge1xuXG5cdFx0Ly8gT3B0aW9ucyBjYW4gYmUgZWl0aGVyIHN0cmluZ3Mgb3Igb2JqZWN0cyB3aXRoIG5vbmVtcHR5IFwiaWRcIiBwcm9wZXJ0aWVzXG5cdFx0b3B0aW9uID0gUVVuaXQuY29uZmlnLnVybENvbmZpZ1sgaSBdO1xuXHRcdGlmICggdHlwZW9mIG9wdGlvbiAhPT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdG9wdGlvbiA9IG9wdGlvbi5pZDtcblx0XHR9XG5cblx0XHRpZiAoIFFVbml0LmNvbmZpZ1sgb3B0aW9uIF0gPT09IHVuZGVmaW5lZCApIHtcblx0XHRcdFFVbml0LmNvbmZpZ1sgb3B0aW9uIF0gPSB1cmxQYXJhbXNbIG9wdGlvbiBdO1xuXHRcdH1cblx0fVxufSApO1xuXG5mdW5jdGlvbiBnZXRVcmxQYXJhbXMoKSB7XG5cdHZhciBpLCBwYXJhbSwgbmFtZSwgdmFsdWU7XG5cdHZhciB1cmxQYXJhbXMgPSB7fTtcblx0dmFyIHBhcmFtcyA9IGxvY2F0aW9uLnNlYXJjaC5zbGljZSggMSApLnNwbGl0KCBcIiZcIiApO1xuXHR2YXIgbGVuZ3RoID0gcGFyYW1zLmxlbmd0aDtcblxuXHRmb3IgKCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrICkge1xuXHRcdGlmICggcGFyYW1zWyBpIF0gKSB7XG5cdFx0XHRwYXJhbSA9IHBhcmFtc1sgaSBdLnNwbGl0KCBcIj1cIiApO1xuXHRcdFx0bmFtZSA9IGRlY29kZVF1ZXJ5UGFyYW0oIHBhcmFtWyAwIF0gKTtcblxuXHRcdFx0Ly8gQWxsb3cganVzdCBhIGtleSB0byB0dXJuIG9uIGEgZmxhZywgZS5nLiwgdGVzdC5odG1sP25vZ2xvYmFsc1xuXHRcdFx0dmFsdWUgPSBwYXJhbS5sZW5ndGggPT09IDEgfHxcblx0XHRcdFx0ZGVjb2RlUXVlcnlQYXJhbSggcGFyYW0uc2xpY2UoIDEgKS5qb2luKCBcIj1cIiApICkgO1xuXHRcdFx0aWYgKCB1cmxQYXJhbXNbIG5hbWUgXSApIHtcblx0XHRcdFx0dXJsUGFyYW1zWyBuYW1lIF0gPSBbXS5jb25jYXQoIHVybFBhcmFtc1sgbmFtZSBdLCB2YWx1ZSApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dXJsUGFyYW1zWyBuYW1lIF0gPSB2YWx1ZTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdXJsUGFyYW1zO1xufVxuXG5mdW5jdGlvbiBkZWNvZGVRdWVyeVBhcmFtKCBwYXJhbSApIHtcblx0cmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudCggcGFyYW0ucmVwbGFjZSggL1xcKy9nLCBcIiUyMFwiICkgKTtcbn1cblxuLy8gRG9uJ3QgbG9hZCB0aGUgSFRNTCBSZXBvcnRlciBvbiBub24tYnJvd3NlciBlbnZpcm9ubWVudHNcbmlmICggdHlwZW9mIHdpbmRvdyA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhd2luZG93LmRvY3VtZW50ICkge1xuXHRyZXR1cm47XG59XG5cblFVbml0LmluaXQgPSBmdW5jdGlvbigpIHtcblx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFwiUVVuaXQuaW5pdCBpcyByZW1vdmVkIGluIFFVbml0IDIuMCwgdXNlIFFVbml0LnRlc3QoKSB3aXRoIGFzc2VydC5hc3luYygpIGluc3RlYWQuXFxuXCIgK1xuXHRcdFwiRGV0YWlscyBpbiBvdXIgdXBncmFkZSBndWlkZSBhdCBodHRwczovL3F1bml0anMuY29tL3VwZ3JhZGUtZ3VpZGUtMi54L1wiXG5cdCk7XG59O1xuXG52YXIgY29uZmlnID0gUVVuaXQuY29uZmlnLFxuXHRkb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudCxcblx0Y29sbGFwc2VOZXh0ID0gZmFsc2UsXG5cdGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHksXG5cdHVuZmlsdGVyZWRVcmwgPSBzZXRVcmwoIHsgZmlsdGVyOiB1bmRlZmluZWQsIG1vZHVsZTogdW5kZWZpbmVkLFxuXHRcdG1vZHVsZUlkOiB1bmRlZmluZWQsIHRlc3RJZDogdW5kZWZpbmVkIH0gKSxcblx0ZGVmaW5lZCA9IHtcblx0XHRzZXNzaW9uU3RvcmFnZTogKCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciB4ID0gXCJxdW5pdC10ZXN0LXN0cmluZ1wiO1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0c2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSggeCwgeCApO1xuXHRcdFx0XHRzZXNzaW9uU3RvcmFnZS5yZW1vdmVJdGVtKCB4ICk7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fSBjYXRjaCAoIGUgKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9KCkgKVxuXHR9LFxuXHRtb2R1bGVzTGlzdCA9IFtdO1xuXG4vLyBFc2NhcGUgdGV4dCBmb3IgYXR0cmlidXRlIG9yIHRleHQgY29udGVudC5cbmZ1bmN0aW9uIGVzY2FwZVRleHQoIHMgKSB7XG5cdGlmICggIXMgKSB7XG5cdFx0cmV0dXJuIFwiXCI7XG5cdH1cblx0cyA9IHMgKyBcIlwiO1xuXG5cdC8vIEJvdGggc2luZ2xlIHF1b3RlcyBhbmQgZG91YmxlIHF1b3RlcyAoZm9yIGF0dHJpYnV0ZXMpXG5cdHJldHVybiBzLnJlcGxhY2UoIC9bJ1wiPD4mXS9nLCBmdW5jdGlvbiggcyApIHtcblx0XHRzd2l0Y2ggKCBzICkge1xuXHRcdGNhc2UgXCInXCI6XG5cdFx0XHRyZXR1cm4gXCImIzAzOTtcIjtcblx0XHRjYXNlIFwiXFxcIlwiOlxuXHRcdFx0cmV0dXJuIFwiJnF1b3Q7XCI7XG5cdFx0Y2FzZSBcIjxcIjpcblx0XHRcdHJldHVybiBcIiZsdDtcIjtcblx0XHRjYXNlIFwiPlwiOlxuXHRcdFx0cmV0dXJuIFwiJmd0O1wiO1xuXHRcdGNhc2UgXCImXCI6XG5cdFx0XHRyZXR1cm4gXCImYW1wO1wiO1xuXHRcdH1cblx0fSApO1xufVxuXG5mdW5jdGlvbiBhZGRFdmVudCggZWxlbSwgdHlwZSwgZm4gKSB7XG5cdGVsZW0uYWRkRXZlbnRMaXN0ZW5lciggdHlwZSwgZm4sIGZhbHNlICk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50KCBlbGVtLCB0eXBlLCBmbiApIHtcblx0ZWxlbS5yZW1vdmVFdmVudExpc3RlbmVyKCB0eXBlLCBmbiwgZmFsc2UgKTtcbn1cblxuZnVuY3Rpb24gYWRkRXZlbnRzKCBlbGVtcywgdHlwZSwgZm4gKSB7XG5cdHZhciBpID0gZWxlbXMubGVuZ3RoO1xuXHR3aGlsZSAoIGktLSApIHtcblx0XHRhZGRFdmVudCggZWxlbXNbIGkgXSwgdHlwZSwgZm4gKTtcblx0fVxufVxuXG5mdW5jdGlvbiBoYXNDbGFzcyggZWxlbSwgbmFtZSApIHtcblx0cmV0dXJuICggXCIgXCIgKyBlbGVtLmNsYXNzTmFtZSArIFwiIFwiICkuaW5kZXhPZiggXCIgXCIgKyBuYW1lICsgXCIgXCIgKSA+PSAwO1xufVxuXG5mdW5jdGlvbiBhZGRDbGFzcyggZWxlbSwgbmFtZSApIHtcblx0aWYgKCAhaGFzQ2xhc3MoIGVsZW0sIG5hbWUgKSApIHtcblx0XHRlbGVtLmNsYXNzTmFtZSArPSAoIGVsZW0uY2xhc3NOYW1lID8gXCIgXCIgOiBcIlwiICkgKyBuYW1lO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHRvZ2dsZUNsYXNzKCBlbGVtLCBuYW1lLCBmb3JjZSApIHtcblx0aWYgKCBmb3JjZSB8fCB0eXBlb2YgZm9yY2UgPT09IFwidW5kZWZpbmVkXCIgJiYgIWhhc0NsYXNzKCBlbGVtLCBuYW1lICkgKSB7XG5cdFx0YWRkQ2xhc3MoIGVsZW0sIG5hbWUgKTtcblx0fSBlbHNlIHtcblx0XHRyZW1vdmVDbGFzcyggZWxlbSwgbmFtZSApO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUNsYXNzKCBlbGVtLCBuYW1lICkge1xuXHR2YXIgc2V0ID0gXCIgXCIgKyBlbGVtLmNsYXNzTmFtZSArIFwiIFwiO1xuXG5cdC8vIENsYXNzIG5hbWUgbWF5IGFwcGVhciBtdWx0aXBsZSB0aW1lc1xuXHR3aGlsZSAoIHNldC5pbmRleE9mKCBcIiBcIiArIG5hbWUgKyBcIiBcIiApID49IDAgKSB7XG5cdFx0c2V0ID0gc2V0LnJlcGxhY2UoIFwiIFwiICsgbmFtZSArIFwiIFwiLCBcIiBcIiApO1xuXHR9XG5cblx0Ly8gVHJpbSBmb3IgcHJldHRpbmVzc1xuXHRlbGVtLmNsYXNzTmFtZSA9IHR5cGVvZiBzZXQudHJpbSA9PT0gXCJmdW5jdGlvblwiID8gc2V0LnRyaW0oKSA6IHNldC5yZXBsYWNlKCAvXlxccyt8XFxzKyQvZywgXCJcIiApO1xufVxuXG5mdW5jdGlvbiBpZCggbmFtZSApIHtcblx0cmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICYmIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCBuYW1lICk7XG59XG5cbmZ1bmN0aW9uIGludGVyY2VwdE5hdmlnYXRpb24oIGV2ICkge1xuXHRhcHBseVVybFBhcmFtcygpO1xuXG5cdGlmICggZXYgJiYgZXYucHJldmVudERlZmF1bHQgKSB7XG5cdFx0ZXYucHJldmVudERlZmF1bHQoKTtcblx0fVxuXG5cdHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gZ2V0VXJsQ29uZmlnSHRtbCgpIHtcblx0dmFyIGksIGosIHZhbCxcblx0XHRlc2NhcGVkLCBlc2NhcGVkVG9vbHRpcCxcblx0XHRzZWxlY3Rpb24gPSBmYWxzZSxcblx0XHR1cmxDb25maWcgPSBjb25maWcudXJsQ29uZmlnLFxuXHRcdHVybENvbmZpZ0h0bWwgPSBcIlwiO1xuXG5cdGZvciAoIGkgPSAwOyBpIDwgdXJsQ29uZmlnLmxlbmd0aDsgaSsrICkge1xuXG5cdFx0Ly8gT3B0aW9ucyBjYW4gYmUgZWl0aGVyIHN0cmluZ3Mgb3Igb2JqZWN0cyB3aXRoIG5vbmVtcHR5IFwiaWRcIiBwcm9wZXJ0aWVzXG5cdFx0dmFsID0gY29uZmlnLnVybENvbmZpZ1sgaSBdO1xuXHRcdGlmICggdHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdHZhbCA9IHtcblx0XHRcdFx0aWQ6IHZhbCxcblx0XHRcdFx0bGFiZWw6IHZhbFxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRlc2NhcGVkID0gZXNjYXBlVGV4dCggdmFsLmlkICk7XG5cdFx0ZXNjYXBlZFRvb2x0aXAgPSBlc2NhcGVUZXh0KCB2YWwudG9vbHRpcCApO1xuXG5cdFx0aWYgKCAhdmFsLnZhbHVlIHx8IHR5cGVvZiB2YWwudmFsdWUgPT09IFwic3RyaW5nXCIgKSB7XG5cdFx0XHR1cmxDb25maWdIdG1sICs9IFwiPGxhYmVsIGZvcj0ncXVuaXQtdXJsY29uZmlnLVwiICsgZXNjYXBlZCArXG5cdFx0XHRcdFwiJyB0aXRsZT0nXCIgKyBlc2NhcGVkVG9vbHRpcCArIFwiJz48aW5wdXQgaWQ9J3F1bml0LXVybGNvbmZpZy1cIiArIGVzY2FwZWQgK1xuXHRcdFx0XHRcIicgbmFtZT0nXCIgKyBlc2NhcGVkICsgXCInIHR5cGU9J2NoZWNrYm94J1wiICtcblx0XHRcdFx0KCB2YWwudmFsdWUgPyBcIiB2YWx1ZT0nXCIgKyBlc2NhcGVUZXh0KCB2YWwudmFsdWUgKSArIFwiJ1wiIDogXCJcIiApICtcblx0XHRcdFx0KCBjb25maWdbIHZhbC5pZCBdID8gXCIgY2hlY2tlZD0nY2hlY2tlZCdcIiA6IFwiXCIgKSArXG5cdFx0XHRcdFwiIHRpdGxlPSdcIiArIGVzY2FwZWRUb29sdGlwICsgXCInIC8+XCIgKyBlc2NhcGVUZXh0KCB2YWwubGFiZWwgKSArIFwiPC9sYWJlbD5cIjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dXJsQ29uZmlnSHRtbCArPSBcIjxsYWJlbCBmb3I9J3F1bml0LXVybGNvbmZpZy1cIiArIGVzY2FwZWQgK1xuXHRcdFx0XHRcIicgdGl0bGU9J1wiICsgZXNjYXBlZFRvb2x0aXAgKyBcIic+XCIgKyB2YWwubGFiZWwgK1xuXHRcdFx0XHRcIjogPC9sYWJlbD48c2VsZWN0IGlkPSdxdW5pdC11cmxjb25maWctXCIgKyBlc2NhcGVkICtcblx0XHRcdFx0XCInIG5hbWU9J1wiICsgZXNjYXBlZCArIFwiJyB0aXRsZT0nXCIgKyBlc2NhcGVkVG9vbHRpcCArIFwiJz48b3B0aW9uPjwvb3B0aW9uPlwiO1xuXG5cdFx0XHRpZiAoIFFVbml0LmlzKCBcImFycmF5XCIsIHZhbC52YWx1ZSApICkge1xuXHRcdFx0XHRmb3IgKCBqID0gMDsgaiA8IHZhbC52YWx1ZS5sZW5ndGg7IGorKyApIHtcblx0XHRcdFx0XHRlc2NhcGVkID0gZXNjYXBlVGV4dCggdmFsLnZhbHVlWyBqIF0gKTtcblx0XHRcdFx0XHR1cmxDb25maWdIdG1sICs9IFwiPG9wdGlvbiB2YWx1ZT0nXCIgKyBlc2NhcGVkICsgXCInXCIgK1xuXHRcdFx0XHRcdFx0KCBjb25maWdbIHZhbC5pZCBdID09PSB2YWwudmFsdWVbIGogXSA/XG5cdFx0XHRcdFx0XHRcdCggc2VsZWN0aW9uID0gdHJ1ZSApICYmIFwiIHNlbGVjdGVkPSdzZWxlY3RlZCdcIiA6IFwiXCIgKSArXG5cdFx0XHRcdFx0XHRcIj5cIiArIGVzY2FwZWQgKyBcIjwvb3B0aW9uPlwiO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRmb3IgKCBqIGluIHZhbC52YWx1ZSApIHtcblx0XHRcdFx0XHRpZiAoIGhhc093bi5jYWxsKCB2YWwudmFsdWUsIGogKSApIHtcblx0XHRcdFx0XHRcdHVybENvbmZpZ0h0bWwgKz0gXCI8b3B0aW9uIHZhbHVlPSdcIiArIGVzY2FwZVRleHQoIGogKSArIFwiJ1wiICtcblx0XHRcdFx0XHRcdFx0KCBjb25maWdbIHZhbC5pZCBdID09PSBqID9cblx0XHRcdFx0XHRcdFx0XHQoIHNlbGVjdGlvbiA9IHRydWUgKSAmJiBcIiBzZWxlY3RlZD0nc2VsZWN0ZWQnXCIgOiBcIlwiICkgK1xuXHRcdFx0XHRcdFx0XHRcIj5cIiArIGVzY2FwZVRleHQoIHZhbC52YWx1ZVsgaiBdICkgKyBcIjwvb3B0aW9uPlwiO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKCBjb25maWdbIHZhbC5pZCBdICYmICFzZWxlY3Rpb24gKSB7XG5cdFx0XHRcdGVzY2FwZWQgPSBlc2NhcGVUZXh0KCBjb25maWdbIHZhbC5pZCBdICk7XG5cdFx0XHRcdHVybENvbmZpZ0h0bWwgKz0gXCI8b3B0aW9uIHZhbHVlPSdcIiArIGVzY2FwZWQgK1xuXHRcdFx0XHRcdFwiJyBzZWxlY3RlZD0nc2VsZWN0ZWQnIGRpc2FibGVkPSdkaXNhYmxlZCc+XCIgKyBlc2NhcGVkICsgXCI8L29wdGlvbj5cIjtcblx0XHRcdH1cblx0XHRcdHVybENvbmZpZ0h0bWwgKz0gXCI8L3NlbGVjdD5cIjtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdXJsQ29uZmlnSHRtbDtcbn1cblxuLy8gSGFuZGxlIFwiY2xpY2tcIiBldmVudHMgb24gdG9vbGJhciBjaGVja2JveGVzIGFuZCBcImNoYW5nZVwiIGZvciBzZWxlY3QgbWVudXMuXG4vLyBVcGRhdGVzIHRoZSBVUkwgd2l0aCB0aGUgbmV3IHN0YXRlIG9mIGBjb25maWcudXJsQ29uZmlnYCB2YWx1ZXMuXG5mdW5jdGlvbiB0b29sYmFyQ2hhbmdlZCgpIHtcblx0dmFyIHVwZGF0ZWRVcmwsIHZhbHVlLCB0ZXN0cyxcblx0XHRmaWVsZCA9IHRoaXMsXG5cdFx0cGFyYW1zID0ge307XG5cblx0Ly8gRGV0ZWN0IGlmIGZpZWxkIGlzIGEgc2VsZWN0IG1lbnUgb3IgYSBjaGVja2JveFxuXHRpZiAoIFwic2VsZWN0ZWRJbmRleFwiIGluIGZpZWxkICkge1xuXHRcdHZhbHVlID0gZmllbGQub3B0aW9uc1sgZmllbGQuc2VsZWN0ZWRJbmRleCBdLnZhbHVlIHx8IHVuZGVmaW5lZDtcblx0fSBlbHNlIHtcblx0XHR2YWx1ZSA9IGZpZWxkLmNoZWNrZWQgPyAoIGZpZWxkLmRlZmF1bHRWYWx1ZSB8fCB0cnVlICkgOiB1bmRlZmluZWQ7XG5cdH1cblxuXHRwYXJhbXNbIGZpZWxkLm5hbWUgXSA9IHZhbHVlO1xuXHR1cGRhdGVkVXJsID0gc2V0VXJsKCBwYXJhbXMgKTtcblxuXHQvLyBDaGVjayBpZiB3ZSBjYW4gYXBwbHkgdGhlIGNoYW5nZSB3aXRob3V0IGEgcGFnZSByZWZyZXNoXG5cdGlmICggXCJoaWRlcGFzc2VkXCIgPT09IGZpZWxkLm5hbWUgJiYgXCJyZXBsYWNlU3RhdGVcIiBpbiB3aW5kb3cuaGlzdG9yeSApIHtcblx0XHRRVW5pdC51cmxQYXJhbXNbIGZpZWxkLm5hbWUgXSA9IHZhbHVlO1xuXHRcdGNvbmZpZ1sgZmllbGQubmFtZSBdID0gdmFsdWUgfHwgZmFsc2U7XG5cdFx0dGVzdHMgPSBpZCggXCJxdW5pdC10ZXN0c1wiICk7XG5cdFx0aWYgKCB0ZXN0cyApIHtcblx0XHRcdHRvZ2dsZUNsYXNzKCB0ZXN0cywgXCJoaWRlcGFzc1wiLCB2YWx1ZSB8fCBmYWxzZSApO1xuXHRcdH1cblx0XHR3aW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGUoIG51bGwsIFwiXCIsIHVwZGF0ZWRVcmwgKTtcblx0fSBlbHNlIHtcblx0XHR3aW5kb3cubG9jYXRpb24gPSB1cGRhdGVkVXJsO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHNldFVybCggcGFyYW1zICkge1xuXHR2YXIga2V5LCBhcnJWYWx1ZSwgaSxcblx0XHRxdWVyeXN0cmluZyA9IFwiP1wiLFxuXHRcdGxvY2F0aW9uID0gd2luZG93LmxvY2F0aW9uO1xuXG5cdHBhcmFtcyA9IFFVbml0LmV4dGVuZCggUVVuaXQuZXh0ZW5kKCB7fSwgUVVuaXQudXJsUGFyYW1zICksIHBhcmFtcyApO1xuXG5cdGZvciAoIGtleSBpbiBwYXJhbXMgKSB7XG5cblx0XHQvLyBTa2lwIGluaGVyaXRlZCBvciB1bmRlZmluZWQgcHJvcGVydGllc1xuXHRcdGlmICggaGFzT3duLmNhbGwoIHBhcmFtcywga2V5ICkgJiYgcGFyYW1zWyBrZXkgXSAhPT0gdW5kZWZpbmVkICkge1xuXG5cdFx0XHQvLyBPdXRwdXQgYSBwYXJhbWV0ZXIgZm9yIGVhY2ggdmFsdWUgb2YgdGhpcyBrZXkgKGJ1dCB1c3VhbGx5IGp1c3Qgb25lKVxuXHRcdFx0YXJyVmFsdWUgPSBbXS5jb25jYXQoIHBhcmFtc1sga2V5IF0gKTtcblx0XHRcdGZvciAoIGkgPSAwOyBpIDwgYXJyVmFsdWUubGVuZ3RoOyBpKysgKSB7XG5cdFx0XHRcdHF1ZXJ5c3RyaW5nICs9IGVuY29kZVVSSUNvbXBvbmVudCgga2V5ICk7XG5cdFx0XHRcdGlmICggYXJyVmFsdWVbIGkgXSAhPT0gdHJ1ZSApIHtcblx0XHRcdFx0XHRxdWVyeXN0cmluZyArPSBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudCggYXJyVmFsdWVbIGkgXSApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHF1ZXJ5c3RyaW5nICs9IFwiJlwiO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRyZXR1cm4gbG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vXCIgKyBsb2NhdGlvbi5ob3N0ICtcblx0XHRsb2NhdGlvbi5wYXRobmFtZSArIHF1ZXJ5c3RyaW5nLnNsaWNlKCAwLCAtMSApO1xufVxuXG5mdW5jdGlvbiBhcHBseVVybFBhcmFtcygpIHtcblx0dmFyIGksXG5cdFx0c2VsZWN0ZWRNb2R1bGVzID0gW10sXG5cdFx0bW9kdWxlc0xpc3QgPSBpZCggXCJxdW5pdC1tb2R1bGVmaWx0ZXItZHJvcGRvd24tbGlzdFwiICkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoIFwiaW5wdXRcIiApLFxuXHRcdGZpbHRlciA9IGlkKCBcInF1bml0LWZpbHRlci1pbnB1dFwiICkudmFsdWU7XG5cblx0Zm9yICggaSA9IDA7IGkgPCBtb2R1bGVzTGlzdC5sZW5ndGg7IGkrKyApICB7XG5cdFx0aWYgKCBtb2R1bGVzTGlzdFsgaSBdLmNoZWNrZWQgKSB7XG5cdFx0XHRzZWxlY3RlZE1vZHVsZXMucHVzaCggbW9kdWxlc0xpc3RbIGkgXS52YWx1ZSApO1xuXHRcdH1cblx0fVxuXG5cdHdpbmRvdy5sb2NhdGlvbiA9IHNldFVybCgge1xuXHRcdGZpbHRlcjogKCBmaWx0ZXIgPT09IFwiXCIgKSA/IHVuZGVmaW5lZCA6IGZpbHRlcixcblx0XHRtb2R1bGVJZDogKCBzZWxlY3RlZE1vZHVsZXMubGVuZ3RoID09PSAwICkgPyB1bmRlZmluZWQgOiBzZWxlY3RlZE1vZHVsZXMsXG5cblx0XHQvLyBSZW1vdmUgbW9kdWxlIGFuZCB0ZXN0SWQgZmlsdGVyXG5cdFx0bW9kdWxlOiB1bmRlZmluZWQsXG5cdFx0dGVzdElkOiB1bmRlZmluZWRcblx0fSApO1xufVxuXG5mdW5jdGlvbiB0b29sYmFyVXJsQ29uZmlnQ29udGFpbmVyKCkge1xuXHR2YXIgdXJsQ29uZmlnQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggXCJzcGFuXCIgKTtcblxuXHR1cmxDb25maWdDb250YWluZXIuaW5uZXJIVE1MID0gZ2V0VXJsQ29uZmlnSHRtbCgpO1xuXHRhZGRDbGFzcyggdXJsQ29uZmlnQ29udGFpbmVyLCBcInF1bml0LXVybC1jb25maWdcIiApO1xuXG5cdGFkZEV2ZW50cyggdXJsQ29uZmlnQ29udGFpbmVyLmdldEVsZW1lbnRzQnlUYWdOYW1lKCBcImlucHV0XCIgKSwgXCJjaGFuZ2VcIiwgdG9vbGJhckNoYW5nZWQgKTtcblx0YWRkRXZlbnRzKCB1cmxDb25maWdDb250YWluZXIuZ2V0RWxlbWVudHNCeVRhZ05hbWUoIFwic2VsZWN0XCIgKSwgXCJjaGFuZ2VcIiwgdG9vbGJhckNoYW5nZWQgKTtcblxuXHRyZXR1cm4gdXJsQ29uZmlnQ29udGFpbmVyO1xufVxuXG5mdW5jdGlvbiB0b29sYmFyTG9vc2VGaWx0ZXIoKSB7XG5cdHZhciBmaWx0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcImZvcm1cIiApLFxuXHRcdGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggXCJsYWJlbFwiICksXG5cdFx0aW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcImlucHV0XCIgKSxcblx0XHRidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcImJ1dHRvblwiICk7XG5cblx0YWRkQ2xhc3MoIGZpbHRlciwgXCJxdW5pdC1maWx0ZXJcIiApO1xuXG5cdGxhYmVsLmlubmVySFRNTCA9IFwiRmlsdGVyOiBcIjtcblxuXHRpbnB1dC50eXBlID0gXCJ0ZXh0XCI7XG5cdGlucHV0LnZhbHVlID0gY29uZmlnLmZpbHRlciB8fCBcIlwiO1xuXHRpbnB1dC5uYW1lID0gXCJmaWx0ZXJcIjtcblx0aW5wdXQuaWQgPSBcInF1bml0LWZpbHRlci1pbnB1dFwiO1xuXG5cdGJ1dHRvbi5pbm5lckhUTUwgPSBcIkdvXCI7XG5cblx0bGFiZWwuYXBwZW5kQ2hpbGQoIGlucHV0ICk7XG5cblx0ZmlsdGVyLmFwcGVuZENoaWxkKCBsYWJlbCApO1xuXHRmaWx0ZXIuYXBwZW5kQ2hpbGQoIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCBcIiBcIiApICk7XG5cdGZpbHRlci5hcHBlbmRDaGlsZCggYnV0dG9uICk7XG5cdGFkZEV2ZW50KCBmaWx0ZXIsIFwic3VibWl0XCIsIGludGVyY2VwdE5hdmlnYXRpb24gKTtcblxuXHRyZXR1cm4gZmlsdGVyO1xufVxuXG5mdW5jdGlvbiBtb2R1bGVMaXN0SHRtbCAoKSB7XG5cdHZhciBpLCBjaGVja2VkLFxuXHRcdGh0bWwgPSBcIlwiO1xuXG5cdGZvciAoIGkgPSAwOyBpIDwgY29uZmlnLm1vZHVsZXMubGVuZ3RoOyBpKysgKSB7XG5cdFx0aWYgKCBjb25maWcubW9kdWxlc1sgaSBdLm5hbWUgIT09IFwiXCIgKSB7XG5cdFx0XHRjaGVja2VkID0gY29uZmlnLm1vZHVsZUlkLmluZGV4T2YoIGNvbmZpZy5tb2R1bGVzWyBpIF0ubW9kdWxlSWQgKSA+IC0xO1xuXHRcdFx0aHRtbCArPSBcIjxsaT48bGFiZWwgY2xhc3M9J2NsaWNrYWJsZVwiICsgKCBjaGVja2VkID8gXCIgY2hlY2tlZFwiIDogXCJcIiApICtcblx0XHRcdFx0XCInPjxpbnB1dCB0eXBlPSdjaGVja2JveCcgXCIgKyBcInZhbHVlPSdcIiArIGNvbmZpZy5tb2R1bGVzWyBpIF0ubW9kdWxlSWQgKyBcIidcIiArXG5cdFx0XHRcdCggY2hlY2tlZCA/IFwiIGNoZWNrZWQ9J2NoZWNrZWQnXCIgOiBcIlwiICkgKyBcIiAvPlwiICtcblx0XHRcdFx0ZXNjYXBlVGV4dCggY29uZmlnLm1vZHVsZXNbIGkgXS5uYW1lICkgKyBcIjwvbGFiZWw+PC9saT5cIjtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gaHRtbDtcbn1cblxuZnVuY3Rpb24gdG9vbGJhck1vZHVsZUZpbHRlciAoKSB7XG5cdHZhciBhbGxDaGVja2JveCwgY29tbWl0LCByZXNldCxcblx0XHRtb2R1bGVGaWx0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcImZvcm1cIiApLFxuXHRcdGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggXCJsYWJlbFwiICksXG5cdFx0bW9kdWxlU2VhcmNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggXCJpbnB1dFwiICksXG5cdFx0ZHJvcERvd24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcImRpdlwiICksXG5cdFx0YWN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoIFwic3BhblwiICksXG5cdFx0ZHJvcERvd25MaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggXCJ1bFwiICksXG5cdFx0ZGlydHkgPSBmYWxzZTtcblxuXHRtb2R1bGVTZWFyY2guaWQgPSBcInF1bml0LW1vZHVsZWZpbHRlci1zZWFyY2hcIjtcblx0YWRkRXZlbnQoIG1vZHVsZVNlYXJjaCwgXCJpbnB1dFwiLCBzZWFyY2hJbnB1dCApO1xuXHRhZGRFdmVudCggbW9kdWxlU2VhcmNoLCBcImlucHV0XCIsIHNlYXJjaEZvY3VzICk7XG5cdGFkZEV2ZW50KCBtb2R1bGVTZWFyY2gsIFwiZm9jdXNcIiwgc2VhcmNoRm9jdXMgKTtcblx0YWRkRXZlbnQoIG1vZHVsZVNlYXJjaCwgXCJjbGlja1wiLCBzZWFyY2hGb2N1cyApO1xuXG5cdGxhYmVsLmlkID0gXCJxdW5pdC1tb2R1bGVmaWx0ZXItc2VhcmNoLWNvbnRhaW5lclwiO1xuXHRsYWJlbC5pbm5lckhUTUwgPSBcIk1vZHVsZTogXCI7XG5cdGxhYmVsLmFwcGVuZENoaWxkKCBtb2R1bGVTZWFyY2ggKTtcblxuXHRhY3Rpb25zLmlkID0gXCJxdW5pdC1tb2R1bGVmaWx0ZXItYWN0aW9uc1wiO1xuXHRhY3Rpb25zLmlubmVySFRNTCA9XG5cdFx0XCI8YnV0dG9uIHN0eWxlPSdkaXNwbGF5Om5vbmUnPkFwcGx5PC9idXR0b24+XCIgK1xuXHRcdFwiPGJ1dHRvbiB0eXBlPSdyZXNldCcgc3R5bGU9J2Rpc3BsYXk6bm9uZSc+UmVzZXQ8L2J1dHRvbj5cIiArXG5cdFx0XCI8bGFiZWwgY2xhc3M9J2NsaWNrYWJsZVwiICtcblx0XHQoIGNvbmZpZy5tb2R1bGVJZC5sZW5ndGggPyBcIlwiIDogXCIgY2hlY2tlZFwiICkgK1xuXHRcdFwiJz48aW5wdXQgdHlwZT0nY2hlY2tib3gnXCIgKyAoIGNvbmZpZy5tb2R1bGVJZC5sZW5ndGggPyBcIlwiIDogXCIgY2hlY2tlZD0nY2hlY2tlZCdcIiApICtcblx0XHRcIj5BbGwgbW9kdWxlczwvbGFiZWw+XCI7XG5cdGFsbENoZWNrYm94ID0gYWN0aW9ucy5sYXN0Q2hpbGQuZmlyc3RDaGlsZDtcblx0Y29tbWl0ID0gYWN0aW9ucy5maXJzdENoaWxkO1xuXHRyZXNldCA9IGNvbW1pdC5uZXh0U2libGluZztcblx0YWRkRXZlbnQoIGNvbW1pdCwgXCJjbGlja1wiLCBhcHBseVVybFBhcmFtcyApO1xuXG5cdGRyb3BEb3duTGlzdC5pZCA9IFwicXVuaXQtbW9kdWxlZmlsdGVyLWRyb3Bkb3duLWxpc3RcIjtcblx0ZHJvcERvd25MaXN0LmlubmVySFRNTCA9IG1vZHVsZUxpc3RIdG1sKCk7XG5cblx0ZHJvcERvd24uaWQgPSBcInF1bml0LW1vZHVsZWZpbHRlci1kcm9wZG93blwiO1xuXHRkcm9wRG93bi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG5cdGRyb3BEb3duLmFwcGVuZENoaWxkKCBhY3Rpb25zICk7XG5cdGRyb3BEb3duLmFwcGVuZENoaWxkKCBkcm9wRG93bkxpc3QgKTtcblx0YWRkRXZlbnQoIGRyb3BEb3duLCBcImNoYW5nZVwiLCBzZWxlY3Rpb25DaGFuZ2UgKTtcblx0c2VsZWN0aW9uQ2hhbmdlKCk7XG5cblx0bW9kdWxlRmlsdGVyLmlkID0gXCJxdW5pdC1tb2R1bGVmaWx0ZXJcIjtcblx0bW9kdWxlRmlsdGVyLmFwcGVuZENoaWxkKCBsYWJlbCApO1xuXHRtb2R1bGVGaWx0ZXIuYXBwZW5kQ2hpbGQoIGRyb3BEb3duICkgO1xuXHRhZGRFdmVudCggbW9kdWxlRmlsdGVyLCBcInN1Ym1pdFwiLCBpbnRlcmNlcHROYXZpZ2F0aW9uICk7XG5cdGFkZEV2ZW50KCBtb2R1bGVGaWx0ZXIsIFwicmVzZXRcIiwgZnVuY3Rpb24oKSB7XG5cblx0XHQvLyBMZXQgdGhlIHJlc2V0IGhhcHBlbiwgdGhlbiB1cGRhdGUgc3R5bGVzXG5cdFx0d2luZG93LnNldFRpbWVvdXQoIHNlbGVjdGlvbkNoYW5nZSApO1xuXHR9ICk7XG5cblx0Ly8gRW5hYmxlcyBzaG93L2hpZGUgZm9yIHRoZSBkcm9wZG93blxuXHRmdW5jdGlvbiBzZWFyY2hGb2N1cygpIHtcblx0XHRpZiAoIGRyb3BEb3duLnN0eWxlLmRpc3BsYXkgIT09IFwibm9uZVwiICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGRyb3BEb3duLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG5cdFx0YWRkRXZlbnQoIGRvY3VtZW50LCBcImNsaWNrXCIsIGhpZGVIYW5kbGVyICk7XG5cdFx0YWRkRXZlbnQoIGRvY3VtZW50LCBcImtleWRvd25cIiwgaGlkZUhhbmRsZXIgKTtcblxuXHRcdC8vIEhpZGUgb24gRXNjYXBlIGtleWRvd24gb3Igb3V0c2lkZS1jb250YWluZXIgY2xpY2tcblx0XHRmdW5jdGlvbiBoaWRlSGFuZGxlciggZSApICB7XG5cdFx0XHR2YXIgaW5Db250YWluZXIgPSBtb2R1bGVGaWx0ZXIuY29udGFpbnMoIGUudGFyZ2V0ICk7XG5cblx0XHRcdGlmICggZS5rZXlDb2RlID09PSAyNyB8fCAhaW5Db250YWluZXIgKSB7XG5cdFx0XHRcdGlmICggZS5rZXlDb2RlID09PSAyNyAmJiBpbkNvbnRhaW5lciApIHtcblx0XHRcdFx0XHRtb2R1bGVTZWFyY2guZm9jdXMoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRkcm9wRG93bi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG5cdFx0XHRcdHJlbW92ZUV2ZW50KCBkb2N1bWVudCwgXCJjbGlja1wiLCBoaWRlSGFuZGxlciApO1xuXHRcdFx0XHRyZW1vdmVFdmVudCggZG9jdW1lbnQsIFwia2V5ZG93blwiLCBoaWRlSGFuZGxlciApO1xuXHRcdFx0XHRtb2R1bGVTZWFyY2gudmFsdWUgPSBcIlwiO1xuXHRcdFx0XHRzZWFyY2hJbnB1dCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8vIFByb2Nlc3NlcyBtb2R1bGUgc2VhcmNoIGJveCBpbnB1dFxuXHRmdW5jdGlvbiBzZWFyY2hJbnB1dCgpIHtcblx0XHR2YXIgaSwgaXRlbSxcblx0XHRcdHNlYXJjaFRleHQgPSBtb2R1bGVTZWFyY2gudmFsdWUudG9Mb3dlckNhc2UoKSxcblx0XHRcdGxpc3RJdGVtcyA9IGRyb3BEb3duTGlzdC5jaGlsZHJlbjtcblxuXHRcdGZvciAoIGkgPSAwOyBpIDwgbGlzdEl0ZW1zLmxlbmd0aDsgaSsrICkge1xuXHRcdFx0aXRlbSA9IGxpc3RJdGVtc1sgaSBdO1xuXHRcdFx0aWYgKCAhc2VhcmNoVGV4dCB8fCBpdGVtLnRleHRDb250ZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZiggc2VhcmNoVGV4dCApID4gLTEgKSB7XG5cdFx0XHRcdGl0ZW0uc3R5bGUuZGlzcGxheSA9IFwiXCI7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpdGVtLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvLyBQcm9jZXNzZXMgc2VsZWN0aW9uIGNoYW5nZXNcblx0ZnVuY3Rpb24gc2VsZWN0aW9uQ2hhbmdlKCBldnQgKSB7XG5cdFx0dmFyIGksXG5cdFx0XHRjaGVja2JveCA9IGV2dCAmJiBldnQudGFyZ2V0IHx8IGFsbENoZWNrYm94LFxuXHRcdFx0bW9kdWxlc0xpc3QgPSBkcm9wRG93bkxpc3QuZ2V0RWxlbWVudHNCeVRhZ05hbWUoIFwiaW5wdXRcIiApLFxuXHRcdFx0c2VsZWN0ZWROYW1lcyA9IFtdO1xuXG5cdFx0dG9nZ2xlQ2xhc3MoIGNoZWNrYm94LnBhcmVudE5vZGUsIFwiY2hlY2tlZFwiLCBjaGVja2JveC5jaGVja2VkICk7XG5cblx0XHRkaXJ0eSA9IGZhbHNlO1xuXHRcdGlmICggY2hlY2tib3guY2hlY2tlZCAmJiBjaGVja2JveCAhPT0gYWxsQ2hlY2tib3ggKSB7XG5cdFx0ICAgYWxsQ2hlY2tib3guY2hlY2tlZCA9IGZhbHNlO1xuXHRcdCAgIHJlbW92ZUNsYXNzKCBhbGxDaGVja2JveC5wYXJlbnROb2RlLCBcImNoZWNrZWRcIiApO1xuXHRcdH1cblx0XHRmb3IgKCBpID0gMDsgaSA8IG1vZHVsZXNMaXN0Lmxlbmd0aDsgaSsrICkgIHtcblx0XHRcdGlmICggIWV2dCApIHtcblx0XHRcdFx0dG9nZ2xlQ2xhc3MoIG1vZHVsZXNMaXN0WyBpIF0ucGFyZW50Tm9kZSwgXCJjaGVja2VkXCIsIG1vZHVsZXNMaXN0WyBpIF0uY2hlY2tlZCApO1xuXHRcdFx0fSBlbHNlIGlmICggY2hlY2tib3ggPT09IGFsbENoZWNrYm94ICYmIGNoZWNrYm94LmNoZWNrZWQgKSB7XG5cdFx0XHRcdG1vZHVsZXNMaXN0WyBpIF0uY2hlY2tlZCA9IGZhbHNlO1xuXHRcdFx0XHRyZW1vdmVDbGFzcyggbW9kdWxlc0xpc3RbIGkgXS5wYXJlbnROb2RlLCBcImNoZWNrZWRcIiApO1xuXHRcdFx0fVxuXHRcdFx0ZGlydHkgPSBkaXJ0eSB8fCAoIGNoZWNrYm94LmNoZWNrZWQgIT09IGNoZWNrYm94LmRlZmF1bHRDaGVja2VkICk7XG5cdFx0XHRpZiAoIG1vZHVsZXNMaXN0WyBpIF0uY2hlY2tlZCApIHtcblx0XHRcdFx0c2VsZWN0ZWROYW1lcy5wdXNoKCBtb2R1bGVzTGlzdFsgaSBdLnBhcmVudE5vZGUudGV4dENvbnRlbnQgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb21taXQuc3R5bGUuZGlzcGxheSA9IHJlc2V0LnN0eWxlLmRpc3BsYXkgPSBkaXJ0eSA/IFwiXCIgOiBcIm5vbmVcIjtcblx0XHRtb2R1bGVTZWFyY2gucGxhY2Vob2xkZXIgPSBzZWxlY3RlZE5hbWVzLmpvaW4oIFwiLCBcIiApIHx8IGFsbENoZWNrYm94LnBhcmVudE5vZGUudGV4dENvbnRlbnQ7XG5cdFx0bW9kdWxlU2VhcmNoLnRpdGxlID0gXCJUeXBlIHRvIGZpbHRlciBsaXN0LiBDdXJyZW50IHNlbGVjdGlvbjpcXG5cIiArXG5cdFx0XHQoIHNlbGVjdGVkTmFtZXMuam9pbiggXCJcXG5cIiApIHx8IGFsbENoZWNrYm94LnBhcmVudE5vZGUudGV4dENvbnRlbnQgKTtcblx0fVxuXG5cdHJldHVybiBtb2R1bGVGaWx0ZXI7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZFRvb2xiYXIoKSB7XG5cdHZhciB0b29sYmFyID0gaWQoIFwicXVuaXQtdGVzdHJ1bm5lci10b29sYmFyXCIgKTtcblxuXHRpZiAoIHRvb2xiYXIgKSB7XG5cdFx0dG9vbGJhci5hcHBlbmRDaGlsZCggdG9vbGJhclVybENvbmZpZ0NvbnRhaW5lcigpICk7XG5cdFx0dG9vbGJhci5hcHBlbmRDaGlsZCggdG9vbGJhck1vZHVsZUZpbHRlcigpICk7XG5cdFx0dG9vbGJhci5hcHBlbmRDaGlsZCggdG9vbGJhckxvb3NlRmlsdGVyKCkgKTtcblx0XHR0b29sYmFyLmFwcGVuZENoaWxkKCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcImRpdlwiICkgKS5jbGFzc05hbWUgPSBcImNsZWFyZml4XCI7XG5cdH1cbn1cblxuZnVuY3Rpb24gYXBwZW5kSGVhZGVyKCkge1xuXHR2YXIgaGVhZGVyID0gaWQoIFwicXVuaXQtaGVhZGVyXCIgKTtcblxuXHRpZiAoIGhlYWRlciApIHtcblx0XHRoZWFkZXIuaW5uZXJIVE1MID0gXCI8YSBocmVmPSdcIiArIGVzY2FwZVRleHQoIHVuZmlsdGVyZWRVcmwgKSArIFwiJz5cIiArIGhlYWRlci5pbm5lckhUTUwgK1xuXHRcdFx0XCI8L2E+IFwiO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGFwcGVuZEJhbm5lcigpIHtcblx0dmFyIGJhbm5lciA9IGlkKCBcInF1bml0LWJhbm5lclwiICk7XG5cblx0aWYgKCBiYW5uZXIgKSB7XG5cdFx0YmFubmVyLmNsYXNzTmFtZSA9IFwiXCI7XG5cdH1cbn1cblxuZnVuY3Rpb24gYXBwZW5kVGVzdFJlc3VsdHMoKSB7XG5cdHZhciB0ZXN0cyA9IGlkKCBcInF1bml0LXRlc3RzXCIgKSxcblx0XHRyZXN1bHQgPSBpZCggXCJxdW5pdC10ZXN0cmVzdWx0XCIgKTtcblxuXHRpZiAoIHJlc3VsdCApIHtcblx0XHRyZXN1bHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCggcmVzdWx0ICk7XG5cdH1cblxuXHRpZiAoIHRlc3RzICkge1xuXHRcdHRlc3RzLmlubmVySFRNTCA9IFwiXCI7XG5cdFx0cmVzdWx0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggXCJwXCIgKTtcblx0XHRyZXN1bHQuaWQgPSBcInF1bml0LXRlc3RyZXN1bHRcIjtcblx0XHRyZXN1bHQuY2xhc3NOYW1lID0gXCJyZXN1bHRcIjtcblx0XHR0ZXN0cy5wYXJlbnROb2RlLmluc2VydEJlZm9yZSggcmVzdWx0LCB0ZXN0cyApO1xuXHRcdHJlc3VsdC5pbm5lckhUTUwgPSBcIlJ1bm5pbmcuLi48YnIgLz4mIzE2MDtcIjtcblx0fVxufVxuXG5mdW5jdGlvbiBhcHBlbmRGaWx0ZXJlZFRlc3QoKSB7XG5cdHZhciB0ZXN0SWQgPSBRVW5pdC5jb25maWcudGVzdElkO1xuXHRpZiAoICF0ZXN0SWQgfHwgdGVzdElkLmxlbmd0aCA8PSAwICkge1xuXHRcdHJldHVybiBcIlwiO1xuXHR9XG5cdHJldHVybiBcIjxkaXYgaWQ9J3F1bml0LWZpbHRlcmVkVGVzdCc+UmVydW5uaW5nIHNlbGVjdGVkIHRlc3RzOiBcIiArXG5cdFx0ZXNjYXBlVGV4dCggdGVzdElkLmpvaW4oIFwiLCBcIiApICkgK1xuXHRcdFwiIDxhIGlkPSdxdW5pdC1jbGVhckZpbHRlcicgaHJlZj0nXCIgK1xuXHRcdGVzY2FwZVRleHQoIHVuZmlsdGVyZWRVcmwgKSArXG5cdFx0XCInPlJ1biBhbGwgdGVzdHM8L2E+PC9kaXY+XCI7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZFVzZXJBZ2VudCgpIHtcblx0dmFyIHVzZXJBZ2VudCA9IGlkKCBcInF1bml0LXVzZXJBZ2VudFwiICk7XG5cblx0aWYgKCB1c2VyQWdlbnQgKSB7XG5cdFx0dXNlckFnZW50LmlubmVySFRNTCA9IFwiXCI7XG5cdFx0dXNlckFnZW50LmFwcGVuZENoaWxkKFxuXHRcdFx0ZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXG5cdFx0XHRcdFwiUVVuaXQgXCIgKyBRVW5pdC52ZXJzaW9uICsgXCI7IFwiICsgbmF2aWdhdG9yLnVzZXJBZ2VudFxuXHRcdFx0KVxuXHRcdCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gYXBwZW5kSW50ZXJmYWNlKCkge1xuXHR2YXIgcXVuaXQgPSBpZCggXCJxdW5pdFwiICk7XG5cblx0aWYgKCBxdW5pdCApIHtcblx0XHRxdW5pdC5pbm5lckhUTUwgPVxuXHRcdFx0XCI8aDEgaWQ9J3F1bml0LWhlYWRlcic+XCIgKyBlc2NhcGVUZXh0KCBkb2N1bWVudC50aXRsZSApICsgXCI8L2gxPlwiICtcblx0XHRcdFwiPGgyIGlkPSdxdW5pdC1iYW5uZXInPjwvaDI+XCIgK1xuXHRcdFx0XCI8ZGl2IGlkPSdxdW5pdC10ZXN0cnVubmVyLXRvb2xiYXInPjwvZGl2PlwiICtcblx0XHRcdGFwcGVuZEZpbHRlcmVkVGVzdCgpICtcblx0XHRcdFwiPGgyIGlkPSdxdW5pdC11c2VyQWdlbnQnPjwvaDI+XCIgK1xuXHRcdFx0XCI8b2wgaWQ9J3F1bml0LXRlc3RzJz48L29sPlwiO1xuXHR9XG5cblx0YXBwZW5kSGVhZGVyKCk7XG5cdGFwcGVuZEJhbm5lcigpO1xuXHRhcHBlbmRUZXN0UmVzdWx0cygpO1xuXHRhcHBlbmRVc2VyQWdlbnQoKTtcblx0YXBwZW5kVG9vbGJhcigpO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRUZXN0c0xpc3QoIG1vZHVsZXMgKSB7XG5cdHZhciBpLCBsLCB4LCB6LCB0ZXN0LCBtb2R1bGVPYmo7XG5cblx0Zm9yICggaSA9IDAsIGwgPSBtb2R1bGVzLmxlbmd0aDsgaSA8IGw7IGkrKyApIHtcblx0XHRtb2R1bGVPYmogPSBtb2R1bGVzWyBpIF07XG5cblx0XHRmb3IgKCB4ID0gMCwgeiA9IG1vZHVsZU9iai50ZXN0cy5sZW5ndGg7IHggPCB6OyB4KysgKSB7XG5cdFx0XHR0ZXN0ID0gbW9kdWxlT2JqLnRlc3RzWyB4IF07XG5cblx0XHRcdGFwcGVuZFRlc3QoIHRlc3QubmFtZSwgdGVzdC50ZXN0SWQsIG1vZHVsZU9iai5uYW1lICk7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIGFwcGVuZFRlc3QoIG5hbWUsIHRlc3RJZCwgbW9kdWxlTmFtZSApIHtcblx0dmFyIHRpdGxlLCByZXJ1blRyaWdnZXIsIHRlc3RCbG9jaywgYXNzZXJ0TGlzdCxcblx0XHR0ZXN0cyA9IGlkKCBcInF1bml0LXRlc3RzXCIgKTtcblxuXHRpZiAoICF0ZXN0cyApIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHR0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoIFwic3Ryb25nXCIgKTtcblx0dGl0bGUuaW5uZXJIVE1MID0gZ2V0TmFtZUh0bWwoIG5hbWUsIG1vZHVsZU5hbWUgKTtcblxuXHRyZXJ1blRyaWdnZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcImFcIiApO1xuXHRyZXJ1blRyaWdnZXIuaW5uZXJIVE1MID0gXCJSZXJ1blwiO1xuXHRyZXJ1blRyaWdnZXIuaHJlZiA9IHNldFVybCggeyB0ZXN0SWQ6IHRlc3RJZCB9ICk7XG5cblx0dGVzdEJsb2NrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggXCJsaVwiICk7XG5cdHRlc3RCbG9jay5hcHBlbmRDaGlsZCggdGl0bGUgKTtcblx0dGVzdEJsb2NrLmFwcGVuZENoaWxkKCByZXJ1blRyaWdnZXIgKTtcblx0dGVzdEJsb2NrLmlkID0gXCJxdW5pdC10ZXN0LW91dHB1dC1cIiArIHRlc3RJZDtcblxuXHRhc3NlcnRMaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggXCJvbFwiICk7XG5cdGFzc2VydExpc3QuY2xhc3NOYW1lID0gXCJxdW5pdC1hc3NlcnQtbGlzdFwiO1xuXG5cdHRlc3RCbG9jay5hcHBlbmRDaGlsZCggYXNzZXJ0TGlzdCApO1xuXG5cdHRlc3RzLmFwcGVuZENoaWxkKCB0ZXN0QmxvY2sgKTtcbn1cblxuLy8gSFRNTCBSZXBvcnRlciBpbml0aWFsaXphdGlvbiBhbmQgbG9hZFxuUVVuaXQuYmVnaW4oIGZ1bmN0aW9uKCBkZXRhaWxzICkge1xuXHR2YXIgaSwgbW9kdWxlT2JqLCB0ZXN0cztcblxuXHQvLyBTb3J0IG1vZHVsZXMgYnkgbmFtZSBmb3IgdGhlIHBpY2tlclxuXHRmb3IgKCBpID0gMDsgaSA8IGRldGFpbHMubW9kdWxlcy5sZW5ndGg7IGkrKyApIHtcblx0XHRtb2R1bGVPYmogPSBkZXRhaWxzLm1vZHVsZXNbIGkgXTtcblx0XHRpZiAoIG1vZHVsZU9iai5uYW1lICkge1xuXHRcdFx0bW9kdWxlc0xpc3QucHVzaCggbW9kdWxlT2JqLm5hbWUgKTtcblx0XHR9XG5cdH1cblx0bW9kdWxlc0xpc3Quc29ydCggZnVuY3Rpb24oIGEsIGIgKSB7XG5cdFx0cmV0dXJuIGEubG9jYWxlQ29tcGFyZSggYiApO1xuXHR9ICk7XG5cblx0Ly8gSW5pdGlhbGl6ZSBRVW5pdCBlbGVtZW50c1xuXHRhcHBlbmRJbnRlcmZhY2UoKTtcblx0YXBwZW5kVGVzdHNMaXN0KCBkZXRhaWxzLm1vZHVsZXMgKTtcblx0dGVzdHMgPSBpZCggXCJxdW5pdC10ZXN0c1wiICk7XG5cdGlmICggdGVzdHMgJiYgY29uZmlnLmhpZGVwYXNzZWQgKSB7XG5cdFx0YWRkQ2xhc3MoIHRlc3RzLCBcImhpZGVwYXNzXCIgKTtcblx0fVxufSApO1xuXG5RVW5pdC5kb25lKCBmdW5jdGlvbiggZGV0YWlscyApIHtcblx0dmFyIGksIGtleSxcblx0XHRiYW5uZXIgPSBpZCggXCJxdW5pdC1iYW5uZXJcIiApLFxuXHRcdHRlc3RzID0gaWQoIFwicXVuaXQtdGVzdHNcIiApLFxuXHRcdGh0bWwgPSBbXG5cdFx0XHRcIlRlc3RzIGNvbXBsZXRlZCBpbiBcIixcblx0XHRcdGRldGFpbHMucnVudGltZSxcblx0XHRcdFwiIG1pbGxpc2Vjb25kcy48YnIgLz5cIixcblx0XHRcdFwiPHNwYW4gY2xhc3M9J3Bhc3NlZCc+XCIsXG5cdFx0XHRkZXRhaWxzLnBhc3NlZCxcblx0XHRcdFwiPC9zcGFuPiBhc3NlcnRpb25zIG9mIDxzcGFuIGNsYXNzPSd0b3RhbCc+XCIsXG5cdFx0XHRkZXRhaWxzLnRvdGFsLFxuXHRcdFx0XCI8L3NwYW4+IHBhc3NlZCwgPHNwYW4gY2xhc3M9J2ZhaWxlZCc+XCIsXG5cdFx0XHRkZXRhaWxzLmZhaWxlZCxcblx0XHRcdFwiPC9zcGFuPiBmYWlsZWQuXCJcblx0XHRdLmpvaW4oIFwiXCIgKTtcblxuXHRpZiAoIGJhbm5lciApIHtcblx0XHRiYW5uZXIuY2xhc3NOYW1lID0gZGV0YWlscy5mYWlsZWQgPyBcInF1bml0LWZhaWxcIiA6IFwicXVuaXQtcGFzc1wiO1xuXHR9XG5cblx0aWYgKCB0ZXN0cyApIHtcblx0XHRpZCggXCJxdW5pdC10ZXN0cmVzdWx0XCIgKS5pbm5lckhUTUwgPSBodG1sO1xuXHR9XG5cblx0aWYgKCBjb25maWcuYWx0ZXJ0aXRsZSAmJiBkb2N1bWVudC50aXRsZSApIHtcblxuXHRcdC8vIFNob3cg4pyWIGZvciBnb29kLCDinJQgZm9yIGJhZCBzdWl0ZSByZXN1bHQgaW4gdGl0bGVcblx0XHQvLyB1c2UgZXNjYXBlIHNlcXVlbmNlcyBpbiBjYXNlIGZpbGUgZ2V0cyBsb2FkZWQgd2l0aCBub24tdXRmLTgtY2hhcnNldFxuXHRcdGRvY3VtZW50LnRpdGxlID0gW1xuXHRcdFx0KCBkZXRhaWxzLmZhaWxlZCA/IFwiXFx1MjcxNlwiIDogXCJcXHUyNzE0XCIgKSxcblx0XHRcdGRvY3VtZW50LnRpdGxlLnJlcGxhY2UoIC9eW1xcdTI3MTRcXHUyNzE2XSAvaSwgXCJcIiApXG5cdFx0XS5qb2luKCBcIiBcIiApO1xuXHR9XG5cblx0Ly8gQ2xlYXIgb3duIHNlc3Npb25TdG9yYWdlIGl0ZW1zIGlmIGFsbCB0ZXN0cyBwYXNzZWRcblx0aWYgKCBjb25maWcucmVvcmRlciAmJiBkZWZpbmVkLnNlc3Npb25TdG9yYWdlICYmIGRldGFpbHMuZmFpbGVkID09PSAwICkge1xuXHRcdGZvciAoIGkgPSAwOyBpIDwgc2Vzc2lvblN0b3JhZ2UubGVuZ3RoOyBpKysgKSB7XG5cdFx0XHRrZXkgPSBzZXNzaW9uU3RvcmFnZS5rZXkoIGkrKyApO1xuXHRcdFx0aWYgKCBrZXkuaW5kZXhPZiggXCJxdW5pdC10ZXN0LVwiICkgPT09IDAgKSB7XG5cdFx0XHRcdHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oIGtleSApO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8vIFNjcm9sbCBiYWNrIHRvIHRvcCB0byBzaG93IHJlc3VsdHNcblx0aWYgKCBjb25maWcuc2Nyb2xsdG9wICYmIHdpbmRvdy5zY3JvbGxUbyApIHtcblx0XHR3aW5kb3cuc2Nyb2xsVG8oIDAsIDAgKTtcblx0fVxufSApO1xuXG5mdW5jdGlvbiBnZXROYW1lSHRtbCggbmFtZSwgbW9kdWxlICkge1xuXHR2YXIgbmFtZUh0bWwgPSBcIlwiO1xuXG5cdGlmICggbW9kdWxlICkge1xuXHRcdG5hbWVIdG1sID0gXCI8c3BhbiBjbGFzcz0nbW9kdWxlLW5hbWUnPlwiICsgZXNjYXBlVGV4dCggbW9kdWxlICkgKyBcIjwvc3Bhbj46IFwiO1xuXHR9XG5cblx0bmFtZUh0bWwgKz0gXCI8c3BhbiBjbGFzcz0ndGVzdC1uYW1lJz5cIiArIGVzY2FwZVRleHQoIG5hbWUgKSArIFwiPC9zcGFuPlwiO1xuXG5cdHJldHVybiBuYW1lSHRtbDtcbn1cblxuUVVuaXQudGVzdFN0YXJ0KCBmdW5jdGlvbiggZGV0YWlscyApIHtcblx0dmFyIHJ1bm5pbmcsIHRlc3RCbG9jaywgYmFkO1xuXG5cdHRlc3RCbG9jayA9IGlkKCBcInF1bml0LXRlc3Qtb3V0cHV0LVwiICsgZGV0YWlscy50ZXN0SWQgKTtcblx0aWYgKCB0ZXN0QmxvY2sgKSB7XG5cdFx0dGVzdEJsb2NrLmNsYXNzTmFtZSA9IFwicnVubmluZ1wiO1xuXHR9IGVsc2Uge1xuXG5cdFx0Ly8gUmVwb3J0IGxhdGVyIHJlZ2lzdGVyZWQgdGVzdHNcblx0XHRhcHBlbmRUZXN0KCBkZXRhaWxzLm5hbWUsIGRldGFpbHMudGVzdElkLCBkZXRhaWxzLm1vZHVsZSApO1xuXHR9XG5cblx0cnVubmluZyA9IGlkKCBcInF1bml0LXRlc3RyZXN1bHRcIiApO1xuXHRpZiAoIHJ1bm5pbmcgKSB7XG5cdFx0YmFkID0gUVVuaXQuY29uZmlnLnJlb3JkZXIgJiYgZGVmaW5lZC5zZXNzaW9uU3RvcmFnZSAmJlxuXHRcdFx0K3Nlc3Npb25TdG9yYWdlLmdldEl0ZW0oIFwicXVuaXQtdGVzdC1cIiArIGRldGFpbHMubW9kdWxlICsgXCItXCIgKyBkZXRhaWxzLm5hbWUgKTtcblxuXHRcdHJ1bm5pbmcuaW5uZXJIVE1MID0gKCBiYWQgP1xuXHRcdFx0XCJSZXJ1bm5pbmcgcHJldmlvdXNseSBmYWlsZWQgdGVzdDogPGJyIC8+XCIgOlxuXHRcdFx0XCJSdW5uaW5nOiA8YnIgLz5cIiApICtcblx0XHRcdGdldE5hbWVIdG1sKCBkZXRhaWxzLm5hbWUsIGRldGFpbHMubW9kdWxlICk7XG5cdH1cblxufSApO1xuXG5mdW5jdGlvbiBzdHJpcEh0bWwoIHN0cmluZyApIHtcblxuXHQvLyBTdHJpcCB0YWdzLCBodG1sIGVudGl0eSBhbmQgd2hpdGVzcGFjZXNcblx0cmV0dXJuIHN0cmluZy5yZXBsYWNlKCAvPFxcLz9bXj5dKyg+fCQpL2csIFwiXCIgKS5yZXBsYWNlKCAvXFwmcXVvdDsvZywgXCJcIiApLnJlcGxhY2UoIC9cXHMrL2csIFwiXCIgKTtcbn1cblxuUVVuaXQubG9nKCBmdW5jdGlvbiggZGV0YWlscyApIHtcblx0dmFyIGFzc2VydExpc3QsIGFzc2VydExpLFxuXHRcdG1lc3NhZ2UsIGV4cGVjdGVkLCBhY3R1YWwsIGRpZmYsXG5cdFx0c2hvd0RpZmYgPSBmYWxzZSxcblx0XHR0ZXN0SXRlbSA9IGlkKCBcInF1bml0LXRlc3Qtb3V0cHV0LVwiICsgZGV0YWlscy50ZXN0SWQgKTtcblxuXHRpZiAoICF0ZXN0SXRlbSApIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRtZXNzYWdlID0gZXNjYXBlVGV4dCggZGV0YWlscy5tZXNzYWdlICkgfHwgKCBkZXRhaWxzLnJlc3VsdCA/IFwib2theVwiIDogXCJmYWlsZWRcIiApO1xuXHRtZXNzYWdlID0gXCI8c3BhbiBjbGFzcz0ndGVzdC1tZXNzYWdlJz5cIiArIG1lc3NhZ2UgKyBcIjwvc3Bhbj5cIjtcblx0bWVzc2FnZSArPSBcIjxzcGFuIGNsYXNzPSdydW50aW1lJz5AIFwiICsgZGV0YWlscy5ydW50aW1lICsgXCIgbXM8L3NwYW4+XCI7XG5cblx0Ly8gVGhlIHB1c2hGYWlsdXJlIGRvZXNuJ3QgcHJvdmlkZSBkZXRhaWxzLmV4cGVjdGVkXG5cdC8vIHdoZW4gaXQgY2FsbHMsIGl0J3MgaW1wbGljaXQgdG8gYWxzbyBub3Qgc2hvdyBleHBlY3RlZCBhbmQgZGlmZiBzdHVmZlxuXHQvLyBBbHNvLCB3ZSBuZWVkIHRvIGNoZWNrIGRldGFpbHMuZXhwZWN0ZWQgZXhpc3RlbmNlLCBhcyBpdCBjYW4gZXhpc3QgYW5kIGJlIHVuZGVmaW5lZFxuXHRpZiAoICFkZXRhaWxzLnJlc3VsdCAmJiBoYXNPd24uY2FsbCggZGV0YWlscywgXCJleHBlY3RlZFwiICkgKSB7XG5cdFx0aWYgKCBkZXRhaWxzLm5lZ2F0aXZlICkge1xuXHRcdFx0ZXhwZWN0ZWQgPSBcIk5PVCBcIiArIFFVbml0LmR1bXAucGFyc2UoIGRldGFpbHMuZXhwZWN0ZWQgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZXhwZWN0ZWQgPSBRVW5pdC5kdW1wLnBhcnNlKCBkZXRhaWxzLmV4cGVjdGVkICk7XG5cdFx0fVxuXG5cdFx0YWN0dWFsID0gUVVuaXQuZHVtcC5wYXJzZSggZGV0YWlscy5hY3R1YWwgKTtcblx0XHRtZXNzYWdlICs9IFwiPHRhYmxlPjx0ciBjbGFzcz0ndGVzdC1leHBlY3RlZCc+PHRoPkV4cGVjdGVkOiA8L3RoPjx0ZD48cHJlPlwiICtcblx0XHRcdGVzY2FwZVRleHQoIGV4cGVjdGVkICkgK1xuXHRcdFx0XCI8L3ByZT48L3RkPjwvdHI+XCI7XG5cblx0XHRpZiAoIGFjdHVhbCAhPT0gZXhwZWN0ZWQgKSB7XG5cblx0XHRcdG1lc3NhZ2UgKz0gXCI8dHIgY2xhc3M9J3Rlc3QtYWN0dWFsJz48dGg+UmVzdWx0OiA8L3RoPjx0ZD48cHJlPlwiICtcblx0XHRcdFx0ZXNjYXBlVGV4dCggYWN0dWFsICkgKyBcIjwvcHJlPjwvdGQ+PC90cj5cIjtcblxuXHRcdFx0Ly8gRG9uJ3Qgc2hvdyBkaWZmIGlmIGFjdHVhbCBvciBleHBlY3RlZCBhcmUgYm9vbGVhbnNcblx0XHRcdGlmICggISggL14odHJ1ZXxmYWxzZSkkLy50ZXN0KCBhY3R1YWwgKSApICYmXG5cdFx0XHRcdFx0ISggL14odHJ1ZXxmYWxzZSkkLy50ZXN0KCBleHBlY3RlZCApICkgKSB7XG5cdFx0XHRcdGRpZmYgPSBRVW5pdC5kaWZmKCBleHBlY3RlZCwgYWN0dWFsICk7XG5cdFx0XHRcdHNob3dEaWZmID0gc3RyaXBIdG1sKCBkaWZmICkubGVuZ3RoICE9PVxuXHRcdFx0XHRcdHN0cmlwSHRtbCggZXhwZWN0ZWQgKS5sZW5ndGggK1xuXHRcdFx0XHRcdHN0cmlwSHRtbCggYWN0dWFsICkubGVuZ3RoO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBEb24ndCBzaG93IGRpZmYgaWYgZXhwZWN0ZWQgYW5kIGFjdHVhbCBhcmUgdG90YWxseSBkaWZmZXJlbnRcblx0XHRcdGlmICggc2hvd0RpZmYgKSB7XG5cdFx0XHRcdG1lc3NhZ2UgKz0gXCI8dHIgY2xhc3M9J3Rlc3QtZGlmZic+PHRoPkRpZmY6IDwvdGg+PHRkPjxwcmU+XCIgK1xuXHRcdFx0XHRcdGRpZmYgKyBcIjwvcHJlPjwvdGQ+PC90cj5cIjtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKCBleHBlY3RlZC5pbmRleE9mKCBcIltvYmplY3QgQXJyYXldXCIgKSAhPT0gLTEgfHxcblx0XHRcdFx0ZXhwZWN0ZWQuaW5kZXhPZiggXCJbb2JqZWN0IE9iamVjdF1cIiApICE9PSAtMSApIHtcblx0XHRcdG1lc3NhZ2UgKz0gXCI8dHIgY2xhc3M9J3Rlc3QtbWVzc2FnZSc+PHRoPk1lc3NhZ2U6IDwvdGg+PHRkPlwiICtcblx0XHRcdFx0XCJEaWZmIHN1cHByZXNzZWQgYXMgdGhlIGRlcHRoIG9mIG9iamVjdCBpcyBtb3JlIHRoYW4gY3VycmVudCBtYXggZGVwdGggKFwiICtcblx0XHRcdFx0UVVuaXQuY29uZmlnLm1heERlcHRoICsgXCIpLjxwPkhpbnQ6IFVzZSA8Y29kZT5RVW5pdC5kdW1wLm1heERlcHRoPC9jb2RlPiB0byBcIiArXG5cdFx0XHRcdFwiIHJ1biB3aXRoIGEgaGlnaGVyIG1heCBkZXB0aCBvciA8YSBocmVmPSdcIiArXG5cdFx0XHRcdGVzY2FwZVRleHQoIHNldFVybCggeyBtYXhEZXB0aDogLTEgfSApICkgKyBcIic+XCIgK1xuXHRcdFx0XHRcIlJlcnVuPC9hPiB3aXRob3V0IG1heCBkZXB0aC48L3A+PC90ZD48L3RyPlwiO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRtZXNzYWdlICs9IFwiPHRyIGNsYXNzPSd0ZXN0LW1lc3NhZ2UnPjx0aD5NZXNzYWdlOiA8L3RoPjx0ZD5cIiArXG5cdFx0XHRcdFwiRGlmZiBzdXBwcmVzc2VkIGFzIHRoZSBleHBlY3RlZCBhbmQgYWN0dWFsIHJlc3VsdHMgaGF2ZSBhbiBlcXVpdmFsZW50XCIgK1xuXHRcdFx0XHRcIiBzZXJpYWxpemF0aW9uPC90ZD48L3RyPlwiO1xuXHRcdH1cblxuXHRcdGlmICggZGV0YWlscy5zb3VyY2UgKSB7XG5cdFx0XHRtZXNzYWdlICs9IFwiPHRyIGNsYXNzPSd0ZXN0LXNvdXJjZSc+PHRoPlNvdXJjZTogPC90aD48dGQ+PHByZT5cIiArXG5cdFx0XHRcdGVzY2FwZVRleHQoIGRldGFpbHMuc291cmNlICkgKyBcIjwvcHJlPjwvdGQ+PC90cj5cIjtcblx0XHR9XG5cblx0XHRtZXNzYWdlICs9IFwiPC90YWJsZT5cIjtcblxuXHQvLyBUaGlzIG9jY3VycyB3aGVuIHB1c2hGYWlsdXJlIGlzIHNldCBhbmQgd2UgaGF2ZSBhbiBleHRyYWN0ZWQgc3RhY2sgdHJhY2Vcblx0fSBlbHNlIGlmICggIWRldGFpbHMucmVzdWx0ICYmIGRldGFpbHMuc291cmNlICkge1xuXHRcdG1lc3NhZ2UgKz0gXCI8dGFibGU+XCIgK1xuXHRcdFx0XCI8dHIgY2xhc3M9J3Rlc3Qtc291cmNlJz48dGg+U291cmNlOiA8L3RoPjx0ZD48cHJlPlwiICtcblx0XHRcdGVzY2FwZVRleHQoIGRldGFpbHMuc291cmNlICkgKyBcIjwvcHJlPjwvdGQ+PC90cj5cIiArXG5cdFx0XHRcIjwvdGFibGU+XCI7XG5cdH1cblxuXHRhc3NlcnRMaXN0ID0gdGVzdEl0ZW0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoIFwib2xcIiApWyAwIF07XG5cblx0YXNzZXJ0TGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcImxpXCIgKTtcblx0YXNzZXJ0TGkuY2xhc3NOYW1lID0gZGV0YWlscy5yZXN1bHQgPyBcInBhc3NcIiA6IFwiZmFpbFwiO1xuXHRhc3NlcnRMaS5pbm5lckhUTUwgPSBtZXNzYWdlO1xuXHRhc3NlcnRMaXN0LmFwcGVuZENoaWxkKCBhc3NlcnRMaSApO1xufSApO1xuXG5RVW5pdC50ZXN0RG9uZSggZnVuY3Rpb24oIGRldGFpbHMgKSB7XG5cdHZhciB0ZXN0VGl0bGUsIHRpbWUsIHRlc3RJdGVtLCBhc3NlcnRMaXN0LFxuXHRcdGdvb2QsIGJhZCwgdGVzdENvdW50cywgc2tpcHBlZCwgc291cmNlTmFtZSxcblx0XHR0ZXN0cyA9IGlkKCBcInF1bml0LXRlc3RzXCIgKTtcblxuXHRpZiAoICF0ZXN0cyApIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHR0ZXN0SXRlbSA9IGlkKCBcInF1bml0LXRlc3Qtb3V0cHV0LVwiICsgZGV0YWlscy50ZXN0SWQgKTtcblxuXHRhc3NlcnRMaXN0ID0gdGVzdEl0ZW0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoIFwib2xcIiApWyAwIF07XG5cblx0Z29vZCA9IGRldGFpbHMucGFzc2VkO1xuXHRiYWQgPSBkZXRhaWxzLmZhaWxlZDtcblxuXHQvLyBTdG9yZSByZXN1bHQgd2hlbiBwb3NzaWJsZVxuXHRpZiAoIGNvbmZpZy5yZW9yZGVyICYmIGRlZmluZWQuc2Vzc2lvblN0b3JhZ2UgKSB7XG5cdFx0aWYgKCBiYWQgKSB7XG5cdFx0XHRzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKCBcInF1bml0LXRlc3QtXCIgKyBkZXRhaWxzLm1vZHVsZSArIFwiLVwiICsgZGV0YWlscy5uYW1lLCBiYWQgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbSggXCJxdW5pdC10ZXN0LVwiICsgZGV0YWlscy5tb2R1bGUgKyBcIi1cIiArIGRldGFpbHMubmFtZSApO1xuXHRcdH1cblx0fVxuXG5cdGlmICggYmFkID09PSAwICkge1xuXG5cdFx0Ly8gQ29sbGFwc2UgdGhlIHBhc3NpbmcgdGVzdHNcblx0XHRhZGRDbGFzcyggYXNzZXJ0TGlzdCwgXCJxdW5pdC1jb2xsYXBzZWRcIiApO1xuXHR9IGVsc2UgaWYgKCBiYWQgJiYgY29uZmlnLmNvbGxhcHNlICYmICFjb2xsYXBzZU5leHQgKSB7XG5cblx0XHQvLyBTa2lwIGNvbGxhcHNpbmcgdGhlIGZpcnN0IGZhaWxpbmcgdGVzdFxuXHRcdGNvbGxhcHNlTmV4dCA9IHRydWU7XG5cdH0gZWxzZSB7XG5cblx0XHQvLyBDb2xsYXBzZSByZW1haW5pbmcgdGVzdHNcblx0XHRhZGRDbGFzcyggYXNzZXJ0TGlzdCwgXCJxdW5pdC1jb2xsYXBzZWRcIiApO1xuXHR9XG5cblx0Ly8gVGhlIHRlc3RJdGVtLmZpcnN0Q2hpbGQgaXMgdGhlIHRlc3QgbmFtZVxuXHR0ZXN0VGl0bGUgPSB0ZXN0SXRlbS5maXJzdENoaWxkO1xuXG5cdHRlc3RDb3VudHMgPSBiYWQgP1xuXHRcdFwiPGIgY2xhc3M9J2ZhaWxlZCc+XCIgKyBiYWQgKyBcIjwvYj4sIFwiICsgXCI8YiBjbGFzcz0ncGFzc2VkJz5cIiArIGdvb2QgKyBcIjwvYj4sIFwiIDpcblx0XHRcIlwiO1xuXG5cdHRlc3RUaXRsZS5pbm5lckhUTUwgKz0gXCIgPGIgY2xhc3M9J2NvdW50cyc+KFwiICsgdGVzdENvdW50cyArXG5cdFx0ZGV0YWlscy5hc3NlcnRpb25zLmxlbmd0aCArIFwiKTwvYj5cIjtcblxuXHRpZiAoIGRldGFpbHMuc2tpcHBlZCApIHtcblx0XHR0ZXN0SXRlbS5jbGFzc05hbWUgPSBcInNraXBwZWRcIjtcblx0XHRza2lwcGVkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggXCJlbVwiICk7XG5cdFx0c2tpcHBlZC5jbGFzc05hbWUgPSBcInF1bml0LXNraXBwZWQtbGFiZWxcIjtcblx0XHRza2lwcGVkLmlubmVySFRNTCA9IFwic2tpcHBlZFwiO1xuXHRcdHRlc3RJdGVtLmluc2VydEJlZm9yZSggc2tpcHBlZCwgdGVzdFRpdGxlICk7XG5cdH0gZWxzZSB7XG5cdFx0YWRkRXZlbnQoIHRlc3RUaXRsZSwgXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcblx0XHRcdHRvZ2dsZUNsYXNzKCBhc3NlcnRMaXN0LCBcInF1bml0LWNvbGxhcHNlZFwiICk7XG5cdFx0fSApO1xuXG5cdFx0dGVzdEl0ZW0uY2xhc3NOYW1lID0gYmFkID8gXCJmYWlsXCIgOiBcInBhc3NcIjtcblxuXHRcdHRpbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBcInNwYW5cIiApO1xuXHRcdHRpbWUuY2xhc3NOYW1lID0gXCJydW50aW1lXCI7XG5cdFx0dGltZS5pbm5lckhUTUwgPSBkZXRhaWxzLnJ1bnRpbWUgKyBcIiBtc1wiO1xuXHRcdHRlc3RJdGVtLmluc2VydEJlZm9yZSggdGltZSwgYXNzZXJ0TGlzdCApO1xuXHR9XG5cblx0Ly8gU2hvdyB0aGUgc291cmNlIG9mIHRoZSB0ZXN0IHdoZW4gc2hvd2luZyBhc3NlcnRpb25zXG5cdGlmICggZGV0YWlscy5zb3VyY2UgKSB7XG5cdFx0c291cmNlTmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoIFwicFwiICk7XG5cdFx0c291cmNlTmFtZS5pbm5lckhUTUwgPSBcIjxzdHJvbmc+U291cmNlOiA8L3N0cm9uZz5cIiArIGRldGFpbHMuc291cmNlO1xuXHRcdGFkZENsYXNzKCBzb3VyY2VOYW1lLCBcInF1bml0LXNvdXJjZVwiICk7XG5cdFx0aWYgKCBiYWQgPT09IDAgKSB7XG5cdFx0XHRhZGRDbGFzcyggc291cmNlTmFtZSwgXCJxdW5pdC1jb2xsYXBzZWRcIiApO1xuXHRcdH1cblx0XHRhZGRFdmVudCggdGVzdFRpdGxlLCBcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dG9nZ2xlQ2xhc3MoIHNvdXJjZU5hbWUsIFwicXVuaXQtY29sbGFwc2VkXCIgKTtcblx0XHR9ICk7XG5cdFx0dGVzdEl0ZW0uYXBwZW5kQ2hpbGQoIHNvdXJjZU5hbWUgKTtcblx0fVxufSApO1xuXG4vLyBBdm9pZCByZWFkeVN0YXRlIGlzc3VlIHdpdGggcGhhbnRvbWpzXG4vLyBSZWY6ICM4MThcbnZhciBub3RQaGFudG9tID0gKCBmdW5jdGlvbiggcCApIHtcblx0cmV0dXJuICEoIHAgJiYgcC52ZXJzaW9uICYmIHAudmVyc2lvbi5tYWpvciA+IDAgKTtcbn0gKSggd2luZG93LnBoYW50b20gKTtcblxuaWYgKCBub3RQaGFudG9tICYmIGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiY29tcGxldGVcIiApIHtcblx0UVVuaXQubG9hZCgpO1xufSBlbHNlIHtcblx0YWRkRXZlbnQoIHdpbmRvdywgXCJsb2FkXCIsIFFVbml0LmxvYWQgKTtcbn1cblxuLypcbiAqIFRoaXMgZmlsZSBpcyBhIG1vZGlmaWVkIHZlcnNpb24gb2YgZ29vZ2xlLWRpZmYtbWF0Y2gtcGF0Y2gncyBKYXZhU2NyaXB0IGltcGxlbWVudGF0aW9uXG4gKiAoaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9nb29nbGUtZGlmZi1tYXRjaC1wYXRjaC9zb3VyY2UvYnJvd3NlL3RydW5rL2phdmFzY3JpcHQvZGlmZl9tYXRjaF9wYXRjaF91bmNvbXByZXNzZWQuanMpLFxuICogbW9kaWZpY2F0aW9ucyBhcmUgbGljZW5zZWQgYXMgbW9yZSBmdWxseSBzZXQgZm9ydGggaW4gTElDRU5TRS50eHQuXG4gKlxuICogVGhlIG9yaWdpbmFsIHNvdXJjZSBvZiBnb29nbGUtZGlmZi1tYXRjaC1wYXRjaCBpcyBhdHRyaWJ1dGFibGUgYW5kIGxpY2Vuc2VkIGFzIGZvbGxvd3M6XG4gKlxuICogQ29weXJpZ2h0IDIwMDYgR29vZ2xlIEluYy5cbiAqIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvZ29vZ2xlLWRpZmYtbWF0Y2gtcGF0Y2gvXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHBzOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICpcbiAqIE1vcmUgSW5mbzpcbiAqICBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2dvb2dsZS1kaWZmLW1hdGNoLXBhdGNoL1xuICpcbiAqIFVzYWdlOiBRVW5pdC5kaWZmKGV4cGVjdGVkLCBhY3R1YWwpXG4gKlxuICovXG5RVW5pdC5kaWZmID0gKCBmdW5jdGlvbigpIHtcblx0ZnVuY3Rpb24gRGlmZk1hdGNoUGF0Y2goKSB7XG5cdH1cblxuXHQvLyAgRElGRiBGVU5DVElPTlNcblxuXHQvKipcblx0ICogVGhlIGRhdGEgc3RydWN0dXJlIHJlcHJlc2VudGluZyBhIGRpZmYgaXMgYW4gYXJyYXkgb2YgdHVwbGVzOlxuXHQgKiBbW0RJRkZfREVMRVRFLCAnSGVsbG8nXSwgW0RJRkZfSU5TRVJULCAnR29vZGJ5ZSddLCBbRElGRl9FUVVBTCwgJyB3b3JsZC4nXV1cblx0ICogd2hpY2ggbWVhbnM6IGRlbGV0ZSAnSGVsbG8nLCBhZGQgJ0dvb2RieWUnIGFuZCBrZWVwICcgd29ybGQuJ1xuXHQgKi9cblx0dmFyIERJRkZfREVMRVRFID0gLTEsXG5cdFx0RElGRl9JTlNFUlQgPSAxLFxuXHRcdERJRkZfRVFVQUwgPSAwO1xuXG5cdC8qKlxuXHQgKiBGaW5kIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIHR3byB0ZXh0cy4gIFNpbXBsaWZpZXMgdGhlIHByb2JsZW0gYnkgc3RyaXBwaW5nXG5cdCAqIGFueSBjb21tb24gcHJlZml4IG9yIHN1ZmZpeCBvZmYgdGhlIHRleHRzIGJlZm9yZSBkaWZmaW5nLlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGV4dDEgT2xkIHN0cmluZyB0byBiZSBkaWZmZWQuXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0MiBOZXcgc3RyaW5nIHRvIGJlIGRpZmZlZC5cblx0ICogQHBhcmFtIHtib29sZWFuPX0gb3B0Q2hlY2tsaW5lcyBPcHRpb25hbCBzcGVlZHVwIGZsYWcuIElmIHByZXNlbnQgYW5kIGZhbHNlLFxuXHQgKiAgICAgdGhlbiBkb24ndCBydW4gYSBsaW5lLWxldmVsIGRpZmYgZmlyc3QgdG8gaWRlbnRpZnkgdGhlIGNoYW5nZWQgYXJlYXMuXG5cdCAqICAgICBEZWZhdWx0cyB0byB0cnVlLCB3aGljaCBkb2VzIGEgZmFzdGVyLCBzbGlnaHRseSBsZXNzIG9wdGltYWwgZGlmZi5cblx0ICogQHJldHVybiB7IUFycmF5LjwhRGlmZk1hdGNoUGF0Y2guRGlmZj59IEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuXHQgKi9cblx0RGlmZk1hdGNoUGF0Y2gucHJvdG90eXBlLkRpZmZNYWluID0gZnVuY3Rpb24oIHRleHQxLCB0ZXh0Miwgb3B0Q2hlY2tsaW5lcyApIHtcblx0XHR2YXIgZGVhZGxpbmUsIGNoZWNrbGluZXMsIGNvbW1vbmxlbmd0aCxcblx0XHRcdGNvbW1vbnByZWZpeCwgY29tbW9uc3VmZml4LCBkaWZmcztcblxuXHRcdC8vIFRoZSBkaWZmIG11c3QgYmUgY29tcGxldGUgaW4gdXAgdG8gMSBzZWNvbmQuXG5cdFx0ZGVhZGxpbmUgPSAoIG5ldyBEYXRlKCkgKS5nZXRUaW1lKCkgKyAxMDAwO1xuXG5cdFx0Ly8gQ2hlY2sgZm9yIG51bGwgaW5wdXRzLlxuXHRcdGlmICggdGV4dDEgPT09IG51bGwgfHwgdGV4dDIgPT09IG51bGwgKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoIFwiTnVsbCBpbnB1dC4gKERpZmZNYWluKVwiICk7XG5cdFx0fVxuXG5cdFx0Ly8gQ2hlY2sgZm9yIGVxdWFsaXR5IChzcGVlZHVwKS5cblx0XHRpZiAoIHRleHQxID09PSB0ZXh0MiApIHtcblx0XHRcdGlmICggdGV4dDEgKSB7XG5cdFx0XHRcdHJldHVybiBbXG5cdFx0XHRcdFx0WyBESUZGX0VRVUFMLCB0ZXh0MSBdXG5cdFx0XHRcdF07XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gW107XG5cdFx0fVxuXG5cdFx0aWYgKCB0eXBlb2Ygb3B0Q2hlY2tsaW5lcyA9PT0gXCJ1bmRlZmluZWRcIiApIHtcblx0XHRcdG9wdENoZWNrbGluZXMgPSB0cnVlO1xuXHRcdH1cblxuXHRcdGNoZWNrbGluZXMgPSBvcHRDaGVja2xpbmVzO1xuXG5cdFx0Ly8gVHJpbSBvZmYgY29tbW9uIHByZWZpeCAoc3BlZWR1cCkuXG5cdFx0Y29tbW9ubGVuZ3RoID0gdGhpcy5kaWZmQ29tbW9uUHJlZml4KCB0ZXh0MSwgdGV4dDIgKTtcblx0XHRjb21tb25wcmVmaXggPSB0ZXh0MS5zdWJzdHJpbmcoIDAsIGNvbW1vbmxlbmd0aCApO1xuXHRcdHRleHQxID0gdGV4dDEuc3Vic3RyaW5nKCBjb21tb25sZW5ndGggKTtcblx0XHR0ZXh0MiA9IHRleHQyLnN1YnN0cmluZyggY29tbW9ubGVuZ3RoICk7XG5cblx0XHQvLyBUcmltIG9mZiBjb21tb24gc3VmZml4IChzcGVlZHVwKS5cblx0XHRjb21tb25sZW5ndGggPSB0aGlzLmRpZmZDb21tb25TdWZmaXgoIHRleHQxLCB0ZXh0MiApO1xuXHRcdGNvbW1vbnN1ZmZpeCA9IHRleHQxLnN1YnN0cmluZyggdGV4dDEubGVuZ3RoIC0gY29tbW9ubGVuZ3RoICk7XG5cdFx0dGV4dDEgPSB0ZXh0MS5zdWJzdHJpbmcoIDAsIHRleHQxLmxlbmd0aCAtIGNvbW1vbmxlbmd0aCApO1xuXHRcdHRleHQyID0gdGV4dDIuc3Vic3RyaW5nKCAwLCB0ZXh0Mi5sZW5ndGggLSBjb21tb25sZW5ndGggKTtcblxuXHRcdC8vIENvbXB1dGUgdGhlIGRpZmYgb24gdGhlIG1pZGRsZSBibG9jay5cblx0XHRkaWZmcyA9IHRoaXMuZGlmZkNvbXB1dGUoIHRleHQxLCB0ZXh0MiwgY2hlY2tsaW5lcywgZGVhZGxpbmUgKTtcblxuXHRcdC8vIFJlc3RvcmUgdGhlIHByZWZpeCBhbmQgc3VmZml4LlxuXHRcdGlmICggY29tbW9ucHJlZml4ICkge1xuXHRcdFx0ZGlmZnMudW5zaGlmdCggWyBESUZGX0VRVUFMLCBjb21tb25wcmVmaXggXSApO1xuXHRcdH1cblx0XHRpZiAoIGNvbW1vbnN1ZmZpeCApIHtcblx0XHRcdGRpZmZzLnB1c2goIFsgRElGRl9FUVVBTCwgY29tbW9uc3VmZml4IF0gKTtcblx0XHR9XG5cdFx0dGhpcy5kaWZmQ2xlYW51cE1lcmdlKCBkaWZmcyApO1xuXHRcdHJldHVybiBkaWZmcztcblx0fTtcblxuXHQvKipcblx0ICogUmVkdWNlIHRoZSBudW1iZXIgb2YgZWRpdHMgYnkgZWxpbWluYXRpbmcgb3BlcmF0aW9uYWxseSB0cml2aWFsIGVxdWFsaXRpZXMuXG5cdCAqIEBwYXJhbSB7IUFycmF5LjwhRGlmZk1hdGNoUGF0Y2guRGlmZj59IGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuXHQgKi9cblx0RGlmZk1hdGNoUGF0Y2gucHJvdG90eXBlLmRpZmZDbGVhbnVwRWZmaWNpZW5jeSA9IGZ1bmN0aW9uKCBkaWZmcyApIHtcblx0XHR2YXIgY2hhbmdlcywgZXF1YWxpdGllcywgZXF1YWxpdGllc0xlbmd0aCwgbGFzdGVxdWFsaXR5LFxuXHRcdFx0cG9pbnRlciwgcHJlSW5zLCBwcmVEZWwsIHBvc3RJbnMsIHBvc3REZWw7XG5cdFx0Y2hhbmdlcyA9IGZhbHNlO1xuXHRcdGVxdWFsaXRpZXMgPSBbXTsgLy8gU3RhY2sgb2YgaW5kaWNlcyB3aGVyZSBlcXVhbGl0aWVzIGFyZSBmb3VuZC5cblx0XHRlcXVhbGl0aWVzTGVuZ3RoID0gMDsgLy8gS2VlcGluZyBvdXIgb3duIGxlbmd0aCB2YXIgaXMgZmFzdGVyIGluIEpTLlxuXHRcdC8qKiBAdHlwZSB7P3N0cmluZ30gKi9cblx0XHRsYXN0ZXF1YWxpdHkgPSBudWxsO1xuXG5cdFx0Ly8gQWx3YXlzIGVxdWFsIHRvIGRpZmZzW2VxdWFsaXRpZXNbZXF1YWxpdGllc0xlbmd0aCAtIDFdXVsxXVxuXHRcdHBvaW50ZXIgPSAwOyAvLyBJbmRleCBvZiBjdXJyZW50IHBvc2l0aW9uLlxuXG5cdFx0Ly8gSXMgdGhlcmUgYW4gaW5zZXJ0aW9uIG9wZXJhdGlvbiBiZWZvcmUgdGhlIGxhc3QgZXF1YWxpdHkuXG5cdFx0cHJlSW5zID0gZmFsc2U7XG5cblx0XHQvLyBJcyB0aGVyZSBhIGRlbGV0aW9uIG9wZXJhdGlvbiBiZWZvcmUgdGhlIGxhc3QgZXF1YWxpdHkuXG5cdFx0cHJlRGVsID0gZmFsc2U7XG5cblx0XHQvLyBJcyB0aGVyZSBhbiBpbnNlcnRpb24gb3BlcmF0aW9uIGFmdGVyIHRoZSBsYXN0IGVxdWFsaXR5LlxuXHRcdHBvc3RJbnMgPSBmYWxzZTtcblxuXHRcdC8vIElzIHRoZXJlIGEgZGVsZXRpb24gb3BlcmF0aW9uIGFmdGVyIHRoZSBsYXN0IGVxdWFsaXR5LlxuXHRcdHBvc3REZWwgPSBmYWxzZTtcblx0XHR3aGlsZSAoIHBvaW50ZXIgPCBkaWZmcy5sZW5ndGggKSB7XG5cblx0XHRcdC8vIEVxdWFsaXR5IGZvdW5kLlxuXHRcdFx0aWYgKCBkaWZmc1sgcG9pbnRlciBdWyAwIF0gPT09IERJRkZfRVFVQUwgKSB7XG5cdFx0XHRcdGlmICggZGlmZnNbIHBvaW50ZXIgXVsgMSBdLmxlbmd0aCA8IDQgJiYgKCBwb3N0SW5zIHx8IHBvc3REZWwgKSApIHtcblxuXHRcdFx0XHRcdC8vIENhbmRpZGF0ZSBmb3VuZC5cblx0XHRcdFx0XHRlcXVhbGl0aWVzWyBlcXVhbGl0aWVzTGVuZ3RoKysgXSA9IHBvaW50ZXI7XG5cdFx0XHRcdFx0cHJlSW5zID0gcG9zdElucztcblx0XHRcdFx0XHRwcmVEZWwgPSBwb3N0RGVsO1xuXHRcdFx0XHRcdGxhc3RlcXVhbGl0eSA9IGRpZmZzWyBwb2ludGVyIF1bIDEgXTtcblx0XHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRcdC8vIE5vdCBhIGNhbmRpZGF0ZSwgYW5kIGNhbiBuZXZlciBiZWNvbWUgb25lLlxuXHRcdFx0XHRcdGVxdWFsaXRpZXNMZW5ndGggPSAwO1xuXHRcdFx0XHRcdGxhc3RlcXVhbGl0eSA9IG51bGw7XG5cdFx0XHRcdH1cblx0XHRcdFx0cG9zdElucyA9IHBvc3REZWwgPSBmYWxzZTtcblxuXHRcdFx0Ly8gQW4gaW5zZXJ0aW9uIG9yIGRlbGV0aW9uLlxuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRpZiAoIGRpZmZzWyBwb2ludGVyIF1bIDAgXSA9PT0gRElGRl9ERUxFVEUgKSB7XG5cdFx0XHRcdFx0cG9zdERlbCA9IHRydWU7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cG9zdElucyA9IHRydWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvKlxuXHRcdFx0XHQgKiBGaXZlIHR5cGVzIHRvIGJlIHNwbGl0OlxuXHRcdFx0XHQgKiA8aW5zPkE8L2lucz48ZGVsPkI8L2RlbD5YWTxpbnM+QzwvaW5zPjxkZWw+RDwvZGVsPlxuXHRcdFx0XHQgKiA8aW5zPkE8L2lucz5YPGlucz5DPC9pbnM+PGRlbD5EPC9kZWw+XG5cdFx0XHRcdCAqIDxpbnM+QTwvaW5zPjxkZWw+QjwvZGVsPlg8aW5zPkM8L2lucz5cblx0XHRcdFx0ICogPGlucz5BPC9kZWw+WDxpbnM+QzwvaW5zPjxkZWw+RDwvZGVsPlxuXHRcdFx0XHQgKiA8aW5zPkE8L2lucz48ZGVsPkI8L2RlbD5YPGRlbD5DPC9kZWw+XG5cdFx0XHRcdCAqL1xuXHRcdFx0XHRpZiAoIGxhc3RlcXVhbGl0eSAmJiAoICggcHJlSW5zICYmIHByZURlbCAmJiBwb3N0SW5zICYmIHBvc3REZWwgKSB8fFxuXHRcdFx0XHRcdFx0KCAoIGxhc3RlcXVhbGl0eS5sZW5ndGggPCAyICkgJiZcblx0XHRcdFx0XHRcdCggcHJlSW5zICsgcHJlRGVsICsgcG9zdElucyArIHBvc3REZWwgKSA9PT0gMyApICkgKSB7XG5cblx0XHRcdFx0XHQvLyBEdXBsaWNhdGUgcmVjb3JkLlxuXHRcdFx0XHRcdGRpZmZzLnNwbGljZShcblx0XHRcdFx0XHRcdGVxdWFsaXRpZXNbIGVxdWFsaXRpZXNMZW5ndGggLSAxIF0sXG5cdFx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdFx0WyBESUZGX0RFTEVURSwgbGFzdGVxdWFsaXR5IF1cblx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0Ly8gQ2hhbmdlIHNlY29uZCBjb3B5IHRvIGluc2VydC5cblx0XHRcdFx0XHRkaWZmc1sgZXF1YWxpdGllc1sgZXF1YWxpdGllc0xlbmd0aCAtIDEgXSArIDEgXVsgMCBdID0gRElGRl9JTlNFUlQ7XG5cdFx0XHRcdFx0ZXF1YWxpdGllc0xlbmd0aC0tOyAvLyBUaHJvdyBhd2F5IHRoZSBlcXVhbGl0eSB3ZSBqdXN0IGRlbGV0ZWQ7XG5cdFx0XHRcdFx0bGFzdGVxdWFsaXR5ID0gbnVsbDtcblx0XHRcdFx0XHRpZiAoIHByZUlucyAmJiBwcmVEZWwgKSB7XG5cblx0XHRcdFx0XHRcdC8vIE5vIGNoYW5nZXMgbWFkZSB3aGljaCBjb3VsZCBhZmZlY3QgcHJldmlvdXMgZW50cnksIGtlZXAgZ29pbmcuXG5cdFx0XHRcdFx0XHRwb3N0SW5zID0gcG9zdERlbCA9IHRydWU7XG5cdFx0XHRcdFx0XHRlcXVhbGl0aWVzTGVuZ3RoID0gMDtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZXF1YWxpdGllc0xlbmd0aC0tOyAvLyBUaHJvdyBhd2F5IHRoZSBwcmV2aW91cyBlcXVhbGl0eS5cblx0XHRcdFx0XHRcdHBvaW50ZXIgPSBlcXVhbGl0aWVzTGVuZ3RoID4gMCA/IGVxdWFsaXRpZXNbIGVxdWFsaXRpZXNMZW5ndGggLSAxIF0gOiAtMTtcblx0XHRcdFx0XHRcdHBvc3RJbnMgPSBwb3N0RGVsID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGNoYW5nZXMgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRwb2ludGVyKys7XG5cdFx0fVxuXG5cdFx0aWYgKCBjaGFuZ2VzICkge1xuXHRcdFx0dGhpcy5kaWZmQ2xlYW51cE1lcmdlKCBkaWZmcyApO1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICogQ29udmVydCBhIGRpZmYgYXJyYXkgaW50byBhIHByZXR0eSBIVE1MIHJlcG9ydC5cblx0ICogQHBhcmFtIHshQXJyYXkuPCFEaWZmTWF0Y2hQYXRjaC5EaWZmPn0gZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG5cdCAqIEBwYXJhbSB7aW50ZWdlcn0gc3RyaW5nIHRvIGJlIGJlYXV0aWZpZWQuXG5cdCAqIEByZXR1cm4ge3N0cmluZ30gSFRNTCByZXByZXNlbnRhdGlvbi5cblx0ICovXG5cdERpZmZNYXRjaFBhdGNoLnByb3RvdHlwZS5kaWZmUHJldHR5SHRtbCA9IGZ1bmN0aW9uKCBkaWZmcyApIHtcblx0XHR2YXIgb3AsIGRhdGEsIHgsXG5cdFx0XHRodG1sID0gW107XG5cdFx0Zm9yICggeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKyApIHtcblx0XHRcdG9wID0gZGlmZnNbIHggXVsgMCBdOyAvLyBPcGVyYXRpb24gKGluc2VydCwgZGVsZXRlLCBlcXVhbClcblx0XHRcdGRhdGEgPSBkaWZmc1sgeCBdWyAxIF07IC8vIFRleHQgb2YgY2hhbmdlLlxuXHRcdFx0c3dpdGNoICggb3AgKSB7XG5cdFx0XHRjYXNlIERJRkZfSU5TRVJUOlxuXHRcdFx0XHRodG1sWyB4IF0gPSBcIjxpbnM+XCIgKyBlc2NhcGVUZXh0KCBkYXRhICkgKyBcIjwvaW5zPlwiO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgRElGRl9ERUxFVEU6XG5cdFx0XHRcdGh0bWxbIHggXSA9IFwiPGRlbD5cIiArIGVzY2FwZVRleHQoIGRhdGEgKSArIFwiPC9kZWw+XCI7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBESUZGX0VRVUFMOlxuXHRcdFx0XHRodG1sWyB4IF0gPSBcIjxzcGFuPlwiICsgZXNjYXBlVGV4dCggZGF0YSApICsgXCI8L3NwYW4+XCI7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gaHRtbC5qb2luKCBcIlwiICk7XG5cdH07XG5cblx0LyoqXG5cdCAqIERldGVybWluZSB0aGUgY29tbW9uIHByZWZpeCBvZiB0d28gc3RyaW5ncy5cblx0ICogQHBhcmFtIHtzdHJpbmd9IHRleHQxIEZpcnN0IHN0cmluZy5cblx0ICogQHBhcmFtIHtzdHJpbmd9IHRleHQyIFNlY29uZCBzdHJpbmcuXG5cdCAqIEByZXR1cm4ge251bWJlcn0gVGhlIG51bWJlciBvZiBjaGFyYWN0ZXJzIGNvbW1vbiB0byB0aGUgc3RhcnQgb2YgZWFjaFxuXHQgKiAgICAgc3RyaW5nLlxuXHQgKi9cblx0RGlmZk1hdGNoUGF0Y2gucHJvdG90eXBlLmRpZmZDb21tb25QcmVmaXggPSBmdW5jdGlvbiggdGV4dDEsIHRleHQyICkge1xuXHRcdHZhciBwb2ludGVybWlkLCBwb2ludGVybWF4LCBwb2ludGVybWluLCBwb2ludGVyc3RhcnQ7XG5cblx0XHQvLyBRdWljayBjaGVjayBmb3IgY29tbW9uIG51bGwgY2FzZXMuXG5cdFx0aWYgKCAhdGV4dDEgfHwgIXRleHQyIHx8IHRleHQxLmNoYXJBdCggMCApICE9PSB0ZXh0Mi5jaGFyQXQoIDAgKSApIHtcblx0XHRcdHJldHVybiAwO1xuXHRcdH1cblxuXHRcdC8vIEJpbmFyeSBzZWFyY2guXG5cdFx0Ly8gUGVyZm9ybWFuY2UgYW5hbHlzaXM6IGh0dHBzOi8vbmVpbC5mcmFzZXIubmFtZS9uZXdzLzIwMDcvMTAvMDkvXG5cdFx0cG9pbnRlcm1pbiA9IDA7XG5cdFx0cG9pbnRlcm1heCA9IE1hdGgubWluKCB0ZXh0MS5sZW5ndGgsIHRleHQyLmxlbmd0aCApO1xuXHRcdHBvaW50ZXJtaWQgPSBwb2ludGVybWF4O1xuXHRcdHBvaW50ZXJzdGFydCA9IDA7XG5cdFx0d2hpbGUgKCBwb2ludGVybWluIDwgcG9pbnRlcm1pZCApIHtcblx0XHRcdGlmICggdGV4dDEuc3Vic3RyaW5nKCBwb2ludGVyc3RhcnQsIHBvaW50ZXJtaWQgKSA9PT1cblx0XHRcdFx0XHR0ZXh0Mi5zdWJzdHJpbmcoIHBvaW50ZXJzdGFydCwgcG9pbnRlcm1pZCApICkge1xuXHRcdFx0XHRwb2ludGVybWluID0gcG9pbnRlcm1pZDtcblx0XHRcdFx0cG9pbnRlcnN0YXJ0ID0gcG9pbnRlcm1pbjtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBvaW50ZXJtYXggPSBwb2ludGVybWlkO1xuXHRcdFx0fVxuXHRcdFx0cG9pbnRlcm1pZCA9IE1hdGguZmxvb3IoICggcG9pbnRlcm1heCAtIHBvaW50ZXJtaW4gKSAvIDIgKyBwb2ludGVybWluICk7XG5cdFx0fVxuXHRcdHJldHVybiBwb2ludGVybWlkO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmUgdGhlIGNvbW1vbiBzdWZmaXggb2YgdHdvIHN0cmluZ3MuXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0MSBGaXJzdCBzdHJpbmcuXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0MiBTZWNvbmQgc3RyaW5nLlxuXHQgKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBudW1iZXIgb2YgY2hhcmFjdGVycyBjb21tb24gdG8gdGhlIGVuZCBvZiBlYWNoIHN0cmluZy5cblx0ICovXG5cdERpZmZNYXRjaFBhdGNoLnByb3RvdHlwZS5kaWZmQ29tbW9uU3VmZml4ID0gZnVuY3Rpb24oIHRleHQxLCB0ZXh0MiApIHtcblx0XHR2YXIgcG9pbnRlcm1pZCwgcG9pbnRlcm1heCwgcG9pbnRlcm1pbiwgcG9pbnRlcmVuZDtcblxuXHRcdC8vIFF1aWNrIGNoZWNrIGZvciBjb21tb24gbnVsbCBjYXNlcy5cblx0XHRpZiAoICF0ZXh0MSB8fFxuXHRcdFx0XHQhdGV4dDIgfHxcblx0XHRcdFx0dGV4dDEuY2hhckF0KCB0ZXh0MS5sZW5ndGggLSAxICkgIT09IHRleHQyLmNoYXJBdCggdGV4dDIubGVuZ3RoIC0gMSApICkge1xuXHRcdFx0cmV0dXJuIDA7XG5cdFx0fVxuXG5cdFx0Ly8gQmluYXJ5IHNlYXJjaC5cblx0XHQvLyBQZXJmb3JtYW5jZSBhbmFseXNpczogaHR0cHM6Ly9uZWlsLmZyYXNlci5uYW1lL25ld3MvMjAwNy8xMC8wOS9cblx0XHRwb2ludGVybWluID0gMDtcblx0XHRwb2ludGVybWF4ID0gTWF0aC5taW4oIHRleHQxLmxlbmd0aCwgdGV4dDIubGVuZ3RoICk7XG5cdFx0cG9pbnRlcm1pZCA9IHBvaW50ZXJtYXg7XG5cdFx0cG9pbnRlcmVuZCA9IDA7XG5cdFx0d2hpbGUgKCBwb2ludGVybWluIDwgcG9pbnRlcm1pZCApIHtcblx0XHRcdGlmICggdGV4dDEuc3Vic3RyaW5nKCB0ZXh0MS5sZW5ndGggLSBwb2ludGVybWlkLCB0ZXh0MS5sZW5ndGggLSBwb2ludGVyZW5kICkgPT09XG5cdFx0XHRcdFx0dGV4dDIuc3Vic3RyaW5nKCB0ZXh0Mi5sZW5ndGggLSBwb2ludGVybWlkLCB0ZXh0Mi5sZW5ndGggLSBwb2ludGVyZW5kICkgKSB7XG5cdFx0XHRcdHBvaW50ZXJtaW4gPSBwb2ludGVybWlkO1xuXHRcdFx0XHRwb2ludGVyZW5kID0gcG9pbnRlcm1pbjtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBvaW50ZXJtYXggPSBwb2ludGVybWlkO1xuXHRcdFx0fVxuXHRcdFx0cG9pbnRlcm1pZCA9IE1hdGguZmxvb3IoICggcG9pbnRlcm1heCAtIHBvaW50ZXJtaW4gKSAvIDIgKyBwb2ludGVybWluICk7XG5cdFx0fVxuXHRcdHJldHVybiBwb2ludGVybWlkO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBGaW5kIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIHR3byB0ZXh0cy4gIEFzc3VtZXMgdGhhdCB0aGUgdGV4dHMgZG8gbm90XG5cdCAqIGhhdmUgYW55IGNvbW1vbiBwcmVmaXggb3Igc3VmZml4LlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGV4dDEgT2xkIHN0cmluZyB0byBiZSBkaWZmZWQuXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0MiBOZXcgc3RyaW5nIHRvIGJlIGRpZmZlZC5cblx0ICogQHBhcmFtIHtib29sZWFufSBjaGVja2xpbmVzIFNwZWVkdXAgZmxhZy4gIElmIGZhbHNlLCB0aGVuIGRvbid0IHJ1biBhXG5cdCAqICAgICBsaW5lLWxldmVsIGRpZmYgZmlyc3QgdG8gaWRlbnRpZnkgdGhlIGNoYW5nZWQgYXJlYXMuXG5cdCAqICAgICBJZiB0cnVlLCB0aGVuIHJ1biBhIGZhc3Rlciwgc2xpZ2h0bHkgbGVzcyBvcHRpbWFsIGRpZmYuXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBkZWFkbGluZSBUaW1lIHdoZW4gdGhlIGRpZmYgc2hvdWxkIGJlIGNvbXBsZXRlIGJ5LlxuXHQgKiBAcmV0dXJuIHshQXJyYXkuPCFEaWZmTWF0Y2hQYXRjaC5EaWZmPn0gQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHREaWZmTWF0Y2hQYXRjaC5wcm90b3R5cGUuZGlmZkNvbXB1dGUgPSBmdW5jdGlvbiggdGV4dDEsIHRleHQyLCBjaGVja2xpbmVzLCBkZWFkbGluZSApIHtcblx0XHR2YXIgZGlmZnMsIGxvbmd0ZXh0LCBzaG9ydHRleHQsIGksIGhtLFxuXHRcdFx0dGV4dDFBLCB0ZXh0MkEsIHRleHQxQiwgdGV4dDJCLFxuXHRcdFx0bWlkQ29tbW9uLCBkaWZmc0EsIGRpZmZzQjtcblxuXHRcdGlmICggIXRleHQxICkge1xuXG5cdFx0XHQvLyBKdXN0IGFkZCBzb21lIHRleHQgKHNwZWVkdXApLlxuXHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0WyBESUZGX0lOU0VSVCwgdGV4dDIgXVxuXHRcdFx0XTtcblx0XHR9XG5cblx0XHRpZiAoICF0ZXh0MiApIHtcblxuXHRcdFx0Ly8gSnVzdCBkZWxldGUgc29tZSB0ZXh0IChzcGVlZHVwKS5cblx0XHRcdHJldHVybiBbXG5cdFx0XHRcdFsgRElGRl9ERUxFVEUsIHRleHQxIF1cblx0XHRcdF07XG5cdFx0fVxuXG5cdFx0bG9uZ3RleHQgPSB0ZXh0MS5sZW5ndGggPiB0ZXh0Mi5sZW5ndGggPyB0ZXh0MSA6IHRleHQyO1xuXHRcdHNob3J0dGV4dCA9IHRleHQxLmxlbmd0aCA+IHRleHQyLmxlbmd0aCA/IHRleHQyIDogdGV4dDE7XG5cdFx0aSA9IGxvbmd0ZXh0LmluZGV4T2YoIHNob3J0dGV4dCApO1xuXHRcdGlmICggaSAhPT0gLTEgKSB7XG5cblx0XHRcdC8vIFNob3J0ZXIgdGV4dCBpcyBpbnNpZGUgdGhlIGxvbmdlciB0ZXh0IChzcGVlZHVwKS5cblx0XHRcdGRpZmZzID0gW1xuXHRcdFx0XHRbIERJRkZfSU5TRVJULCBsb25ndGV4dC5zdWJzdHJpbmcoIDAsIGkgKSBdLFxuXHRcdFx0XHRbIERJRkZfRVFVQUwsIHNob3J0dGV4dCBdLFxuXHRcdFx0XHRbIERJRkZfSU5TRVJULCBsb25ndGV4dC5zdWJzdHJpbmcoIGkgKyBzaG9ydHRleHQubGVuZ3RoICkgXVxuXHRcdFx0XTtcblxuXHRcdFx0Ly8gU3dhcCBpbnNlcnRpb25zIGZvciBkZWxldGlvbnMgaWYgZGlmZiBpcyByZXZlcnNlZC5cblx0XHRcdGlmICggdGV4dDEubGVuZ3RoID4gdGV4dDIubGVuZ3RoICkge1xuXHRcdFx0XHRkaWZmc1sgMCBdWyAwIF0gPSBkaWZmc1sgMiBdWyAwIF0gPSBESUZGX0RFTEVURTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBkaWZmcztcblx0XHR9XG5cblx0XHRpZiAoIHNob3J0dGV4dC5sZW5ndGggPT09IDEgKSB7XG5cblx0XHRcdC8vIFNpbmdsZSBjaGFyYWN0ZXIgc3RyaW5nLlxuXHRcdFx0Ly8gQWZ0ZXIgdGhlIHByZXZpb3VzIHNwZWVkdXAsIHRoZSBjaGFyYWN0ZXIgY2FuJ3QgYmUgYW4gZXF1YWxpdHkuXG5cdFx0XHRyZXR1cm4gW1xuXHRcdFx0XHRbIERJRkZfREVMRVRFLCB0ZXh0MSBdLFxuXHRcdFx0XHRbIERJRkZfSU5TRVJULCB0ZXh0MiBdXG5cdFx0XHRdO1xuXHRcdH1cblxuXHRcdC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgcHJvYmxlbSBjYW4gYmUgc3BsaXQgaW4gdHdvLlxuXHRcdGhtID0gdGhpcy5kaWZmSGFsZk1hdGNoKCB0ZXh0MSwgdGV4dDIgKTtcblx0XHRpZiAoIGhtICkge1xuXG5cdFx0XHQvLyBBIGhhbGYtbWF0Y2ggd2FzIGZvdW5kLCBzb3J0IG91dCB0aGUgcmV0dXJuIGRhdGEuXG5cdFx0XHR0ZXh0MUEgPSBobVsgMCBdO1xuXHRcdFx0dGV4dDFCID0gaG1bIDEgXTtcblx0XHRcdHRleHQyQSA9IGhtWyAyIF07XG5cdFx0XHR0ZXh0MkIgPSBobVsgMyBdO1xuXHRcdFx0bWlkQ29tbW9uID0gaG1bIDQgXTtcblxuXHRcdFx0Ly8gU2VuZCBib3RoIHBhaXJzIG9mZiBmb3Igc2VwYXJhdGUgcHJvY2Vzc2luZy5cblx0XHRcdGRpZmZzQSA9IHRoaXMuRGlmZk1haW4oIHRleHQxQSwgdGV4dDJBLCBjaGVja2xpbmVzLCBkZWFkbGluZSApO1xuXHRcdFx0ZGlmZnNCID0gdGhpcy5EaWZmTWFpbiggdGV4dDFCLCB0ZXh0MkIsIGNoZWNrbGluZXMsIGRlYWRsaW5lICk7XG5cblx0XHRcdC8vIE1lcmdlIHRoZSByZXN1bHRzLlxuXHRcdFx0cmV0dXJuIGRpZmZzQS5jb25jYXQoIFtcblx0XHRcdFx0WyBESUZGX0VRVUFMLCBtaWRDb21tb24gXVxuXHRcdFx0XSwgZGlmZnNCICk7XG5cdFx0fVxuXG5cdFx0aWYgKCBjaGVja2xpbmVzICYmIHRleHQxLmxlbmd0aCA+IDEwMCAmJiB0ZXh0Mi5sZW5ndGggPiAxMDAgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5kaWZmTGluZU1vZGUoIHRleHQxLCB0ZXh0MiwgZGVhZGxpbmUgKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5kaWZmQmlzZWN0KCB0ZXh0MSwgdGV4dDIsIGRlYWRsaW5lICk7XG5cdH07XG5cblx0LyoqXG5cdCAqIERvIHRoZSB0d28gdGV4dHMgc2hhcmUgYSBzdWJzdHJpbmcgd2hpY2ggaXMgYXQgbGVhc3QgaGFsZiB0aGUgbGVuZ3RoIG9mIHRoZVxuXHQgKiBsb25nZXIgdGV4dD9cblx0ICogVGhpcyBzcGVlZHVwIGNhbiBwcm9kdWNlIG5vbi1taW5pbWFsIGRpZmZzLlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGV4dDEgRmlyc3Qgc3RyaW5nLlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGV4dDIgU2Vjb25kIHN0cmluZy5cblx0ICogQHJldHVybiB7QXJyYXkuPHN0cmluZz59IEZpdmUgZWxlbWVudCBBcnJheSwgY29udGFpbmluZyB0aGUgcHJlZml4IG9mXG5cdCAqICAgICB0ZXh0MSwgdGhlIHN1ZmZpeCBvZiB0ZXh0MSwgdGhlIHByZWZpeCBvZiB0ZXh0MiwgdGhlIHN1ZmZpeCBvZlxuXHQgKiAgICAgdGV4dDIgYW5kIHRoZSBjb21tb24gbWlkZGxlLiAgT3IgbnVsbCBpZiB0aGVyZSB3YXMgbm8gbWF0Y2guXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHREaWZmTWF0Y2hQYXRjaC5wcm90b3R5cGUuZGlmZkhhbGZNYXRjaCA9IGZ1bmN0aW9uKCB0ZXh0MSwgdGV4dDIgKSB7XG5cdFx0dmFyIGxvbmd0ZXh0LCBzaG9ydHRleHQsIGRtcCxcblx0XHRcdHRleHQxQSwgdGV4dDJCLCB0ZXh0MkEsIHRleHQxQiwgbWlkQ29tbW9uLFxuXHRcdFx0aG0xLCBobTIsIGhtO1xuXG5cdFx0bG9uZ3RleHQgPSB0ZXh0MS5sZW5ndGggPiB0ZXh0Mi5sZW5ndGggPyB0ZXh0MSA6IHRleHQyO1xuXHRcdHNob3J0dGV4dCA9IHRleHQxLmxlbmd0aCA+IHRleHQyLmxlbmd0aCA/IHRleHQyIDogdGV4dDE7XG5cdFx0aWYgKCBsb25ndGV4dC5sZW5ndGggPCA0IHx8IHNob3J0dGV4dC5sZW5ndGggKiAyIDwgbG9uZ3RleHQubGVuZ3RoICkge1xuXHRcdFx0cmV0dXJuIG51bGw7IC8vIFBvaW50bGVzcy5cblx0XHR9XG5cdFx0ZG1wID0gdGhpczsgLy8gJ3RoaXMnIGJlY29tZXMgJ3dpbmRvdycgaW4gYSBjbG9zdXJlLlxuXG5cdFx0LyoqXG5cdFx0ICogRG9lcyBhIHN1YnN0cmluZyBvZiBzaG9ydHRleHQgZXhpc3Qgd2l0aGluIGxvbmd0ZXh0IHN1Y2ggdGhhdCB0aGUgc3Vic3RyaW5nXG5cdFx0ICogaXMgYXQgbGVhc3QgaGFsZiB0aGUgbGVuZ3RoIG9mIGxvbmd0ZXh0P1xuXHRcdCAqIENsb3N1cmUsIGJ1dCBkb2VzIG5vdCByZWZlcmVuY2UgYW55IGV4dGVybmFsIHZhcmlhYmxlcy5cblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gbG9uZ3RleHQgTG9uZ2VyIHN0cmluZy5cblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gc2hvcnR0ZXh0IFNob3J0ZXIgc3RyaW5nLlxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBpIFN0YXJ0IGluZGV4IG9mIHF1YXJ0ZXIgbGVuZ3RoIHN1YnN0cmluZyB3aXRoaW4gbG9uZ3RleHQuXG5cdFx0ICogQHJldHVybiB7QXJyYXkuPHN0cmluZz59IEZpdmUgZWxlbWVudCBBcnJheSwgY29udGFpbmluZyB0aGUgcHJlZml4IG9mXG5cdFx0ICogICAgIGxvbmd0ZXh0LCB0aGUgc3VmZml4IG9mIGxvbmd0ZXh0LCB0aGUgcHJlZml4IG9mIHNob3J0dGV4dCwgdGhlIHN1ZmZpeFxuXHRcdCAqICAgICBvZiBzaG9ydHRleHQgYW5kIHRoZSBjb21tb24gbWlkZGxlLiAgT3IgbnVsbCBpZiB0aGVyZSB3YXMgbm8gbWF0Y2guXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHRmdW5jdGlvbiBkaWZmSGFsZk1hdGNoSSggbG9uZ3RleHQsIHNob3J0dGV4dCwgaSApIHtcblx0XHRcdHZhciBzZWVkLCBqLCBiZXN0Q29tbW9uLCBwcmVmaXhMZW5ndGgsIHN1ZmZpeExlbmd0aCxcblx0XHRcdFx0YmVzdExvbmd0ZXh0QSwgYmVzdExvbmd0ZXh0QiwgYmVzdFNob3J0dGV4dEEsIGJlc3RTaG9ydHRleHRCO1xuXG5cdFx0XHQvLyBTdGFydCB3aXRoIGEgMS80IGxlbmd0aCBzdWJzdHJpbmcgYXQgcG9zaXRpb24gaSBhcyBhIHNlZWQuXG5cdFx0XHRzZWVkID0gbG9uZ3RleHQuc3Vic3RyaW5nKCBpLCBpICsgTWF0aC5mbG9vciggbG9uZ3RleHQubGVuZ3RoIC8gNCApICk7XG5cdFx0XHRqID0gLTE7XG5cdFx0XHRiZXN0Q29tbW9uID0gXCJcIjtcblx0XHRcdHdoaWxlICggKCBqID0gc2hvcnR0ZXh0LmluZGV4T2YoIHNlZWQsIGogKyAxICkgKSAhPT0gLTEgKSB7XG5cdFx0XHRcdHByZWZpeExlbmd0aCA9IGRtcC5kaWZmQ29tbW9uUHJlZml4KCBsb25ndGV4dC5zdWJzdHJpbmcoIGkgKSxcblx0XHRcdFx0XHRzaG9ydHRleHQuc3Vic3RyaW5nKCBqICkgKTtcblx0XHRcdFx0c3VmZml4TGVuZ3RoID0gZG1wLmRpZmZDb21tb25TdWZmaXgoIGxvbmd0ZXh0LnN1YnN0cmluZyggMCwgaSApLFxuXHRcdFx0XHRcdHNob3J0dGV4dC5zdWJzdHJpbmcoIDAsIGogKSApO1xuXHRcdFx0XHRpZiAoIGJlc3RDb21tb24ubGVuZ3RoIDwgc3VmZml4TGVuZ3RoICsgcHJlZml4TGVuZ3RoICkge1xuXHRcdFx0XHRcdGJlc3RDb21tb24gPSBzaG9ydHRleHQuc3Vic3RyaW5nKCBqIC0gc3VmZml4TGVuZ3RoLCBqICkgK1xuXHRcdFx0XHRcdFx0c2hvcnR0ZXh0LnN1YnN0cmluZyggaiwgaiArIHByZWZpeExlbmd0aCApO1xuXHRcdFx0XHRcdGJlc3RMb25ndGV4dEEgPSBsb25ndGV4dC5zdWJzdHJpbmcoIDAsIGkgLSBzdWZmaXhMZW5ndGggKTtcblx0XHRcdFx0XHRiZXN0TG9uZ3RleHRCID0gbG9uZ3RleHQuc3Vic3RyaW5nKCBpICsgcHJlZml4TGVuZ3RoICk7XG5cdFx0XHRcdFx0YmVzdFNob3J0dGV4dEEgPSBzaG9ydHRleHQuc3Vic3RyaW5nKCAwLCBqIC0gc3VmZml4TGVuZ3RoICk7XG5cdFx0XHRcdFx0YmVzdFNob3J0dGV4dEIgPSBzaG9ydHRleHQuc3Vic3RyaW5nKCBqICsgcHJlZml4TGVuZ3RoICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICggYmVzdENvbW1vbi5sZW5ndGggKiAyID49IGxvbmd0ZXh0Lmxlbmd0aCApIHtcblx0XHRcdFx0cmV0dXJuIFsgYmVzdExvbmd0ZXh0QSwgYmVzdExvbmd0ZXh0Qixcblx0XHRcdFx0XHRiZXN0U2hvcnR0ZXh0QSwgYmVzdFNob3J0dGV4dEIsIGJlc3RDb21tb25cblx0XHRcdFx0XTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIEZpcnN0IGNoZWNrIGlmIHRoZSBzZWNvbmQgcXVhcnRlciBpcyB0aGUgc2VlZCBmb3IgYSBoYWxmLW1hdGNoLlxuXHRcdGhtMSA9IGRpZmZIYWxmTWF0Y2hJKCBsb25ndGV4dCwgc2hvcnR0ZXh0LFxuXHRcdFx0TWF0aC5jZWlsKCBsb25ndGV4dC5sZW5ndGggLyA0ICkgKTtcblxuXHRcdC8vIENoZWNrIGFnYWluIGJhc2VkIG9uIHRoZSB0aGlyZCBxdWFydGVyLlxuXHRcdGhtMiA9IGRpZmZIYWxmTWF0Y2hJKCBsb25ndGV4dCwgc2hvcnR0ZXh0LFxuXHRcdFx0TWF0aC5jZWlsKCBsb25ndGV4dC5sZW5ndGggLyAyICkgKTtcblx0XHRpZiAoICFobTEgJiYgIWhtMiApIHtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH0gZWxzZSBpZiAoICFobTIgKSB7XG5cdFx0XHRobSA9IGhtMTtcblx0XHR9IGVsc2UgaWYgKCAhaG0xICkge1xuXHRcdFx0aG0gPSBobTI7XG5cdFx0fSBlbHNlIHtcblxuXHRcdFx0Ly8gQm90aCBtYXRjaGVkLiAgU2VsZWN0IHRoZSBsb25nZXN0LlxuXHRcdFx0aG0gPSBobTFbIDQgXS5sZW5ndGggPiBobTJbIDQgXS5sZW5ndGggPyBobTEgOiBobTI7XG5cdFx0fVxuXG5cdFx0Ly8gQSBoYWxmLW1hdGNoIHdhcyBmb3VuZCwgc29ydCBvdXQgdGhlIHJldHVybiBkYXRhLlxuXHRcdHRleHQxQSwgdGV4dDFCLCB0ZXh0MkEsIHRleHQyQjtcblx0XHRpZiAoIHRleHQxLmxlbmd0aCA+IHRleHQyLmxlbmd0aCApIHtcblx0XHRcdHRleHQxQSA9IGhtWyAwIF07XG5cdFx0XHR0ZXh0MUIgPSBobVsgMSBdO1xuXHRcdFx0dGV4dDJBID0gaG1bIDIgXTtcblx0XHRcdHRleHQyQiA9IGhtWyAzIF07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRleHQyQSA9IGhtWyAwIF07XG5cdFx0XHR0ZXh0MkIgPSBobVsgMSBdO1xuXHRcdFx0dGV4dDFBID0gaG1bIDIgXTtcblx0XHRcdHRleHQxQiA9IGhtWyAzIF07XG5cdFx0fVxuXHRcdG1pZENvbW1vbiA9IGhtWyA0IF07XG5cdFx0cmV0dXJuIFsgdGV4dDFBLCB0ZXh0MUIsIHRleHQyQSwgdGV4dDJCLCBtaWRDb21tb24gXTtcblx0fTtcblxuXHQvKipcblx0ICogRG8gYSBxdWljayBsaW5lLWxldmVsIGRpZmYgb24gYm90aCBzdHJpbmdzLCB0aGVuIHJlZGlmZiB0aGUgcGFydHMgZm9yXG5cdCAqIGdyZWF0ZXIgYWNjdXJhY3kuXG5cdCAqIFRoaXMgc3BlZWR1cCBjYW4gcHJvZHVjZSBub24tbWluaW1hbCBkaWZmcy5cblx0ICogQHBhcmFtIHtzdHJpbmd9IHRleHQxIE9sZCBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGV4dDIgTmV3IHN0cmluZyB0byBiZSBkaWZmZWQuXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBkZWFkbGluZSBUaW1lIHdoZW4gdGhlIGRpZmYgc2hvdWxkIGJlIGNvbXBsZXRlIGJ5LlxuXHQgKiBAcmV0dXJuIHshQXJyYXkuPCFEaWZmTWF0Y2hQYXRjaC5EaWZmPn0gQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHREaWZmTWF0Y2hQYXRjaC5wcm90b3R5cGUuZGlmZkxpbmVNb2RlID0gZnVuY3Rpb24oIHRleHQxLCB0ZXh0MiwgZGVhZGxpbmUgKSB7XG5cdFx0dmFyIGEsIGRpZmZzLCBsaW5lYXJyYXksIHBvaW50ZXIsIGNvdW50SW5zZXJ0LFxuXHRcdFx0Y291bnREZWxldGUsIHRleHRJbnNlcnQsIHRleHREZWxldGUsIGo7XG5cblx0XHQvLyBTY2FuIHRoZSB0ZXh0IG9uIGEgbGluZS1ieS1saW5lIGJhc2lzIGZpcnN0LlxuXHRcdGEgPSB0aGlzLmRpZmZMaW5lc1RvQ2hhcnMoIHRleHQxLCB0ZXh0MiApO1xuXHRcdHRleHQxID0gYS5jaGFyczE7XG5cdFx0dGV4dDIgPSBhLmNoYXJzMjtcblx0XHRsaW5lYXJyYXkgPSBhLmxpbmVBcnJheTtcblxuXHRcdGRpZmZzID0gdGhpcy5EaWZmTWFpbiggdGV4dDEsIHRleHQyLCBmYWxzZSwgZGVhZGxpbmUgKTtcblxuXHRcdC8vIENvbnZlcnQgdGhlIGRpZmYgYmFjayB0byBvcmlnaW5hbCB0ZXh0LlxuXHRcdHRoaXMuZGlmZkNoYXJzVG9MaW5lcyggZGlmZnMsIGxpbmVhcnJheSApO1xuXG5cdFx0Ly8gRWxpbWluYXRlIGZyZWFrIG1hdGNoZXMgKGUuZy4gYmxhbmsgbGluZXMpXG5cdFx0dGhpcy5kaWZmQ2xlYW51cFNlbWFudGljKCBkaWZmcyApO1xuXG5cdFx0Ly8gUmVkaWZmIGFueSByZXBsYWNlbWVudCBibG9ja3MsIHRoaXMgdGltZSBjaGFyYWN0ZXItYnktY2hhcmFjdGVyLlxuXHRcdC8vIEFkZCBhIGR1bW15IGVudHJ5IGF0IHRoZSBlbmQuXG5cdFx0ZGlmZnMucHVzaCggWyBESUZGX0VRVUFMLCBcIlwiIF0gKTtcblx0XHRwb2ludGVyID0gMDtcblx0XHRjb3VudERlbGV0ZSA9IDA7XG5cdFx0Y291bnRJbnNlcnQgPSAwO1xuXHRcdHRleHREZWxldGUgPSBcIlwiO1xuXHRcdHRleHRJbnNlcnQgPSBcIlwiO1xuXHRcdHdoaWxlICggcG9pbnRlciA8IGRpZmZzLmxlbmd0aCApIHtcblx0XHRcdHN3aXRjaCAoIGRpZmZzWyBwb2ludGVyIF1bIDAgXSApIHtcblx0XHRcdGNhc2UgRElGRl9JTlNFUlQ6XG5cdFx0XHRcdGNvdW50SW5zZXJ0Kys7XG5cdFx0XHRcdHRleHRJbnNlcnQgKz0gZGlmZnNbIHBvaW50ZXIgXVsgMSBdO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgRElGRl9ERUxFVEU6XG5cdFx0XHRcdGNvdW50RGVsZXRlKys7XG5cdFx0XHRcdHRleHREZWxldGUgKz0gZGlmZnNbIHBvaW50ZXIgXVsgMSBdO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgRElGRl9FUVVBTDpcblxuXHRcdFx0XHQvLyBVcG9uIHJlYWNoaW5nIGFuIGVxdWFsaXR5LCBjaGVjayBmb3IgcHJpb3IgcmVkdW5kYW5jaWVzLlxuXHRcdFx0XHRpZiAoIGNvdW50RGVsZXRlID49IDEgJiYgY291bnRJbnNlcnQgPj0gMSApIHtcblxuXHRcdFx0XHRcdC8vIERlbGV0ZSB0aGUgb2ZmZW5kaW5nIHJlY29yZHMgYW5kIGFkZCB0aGUgbWVyZ2VkIG9uZXMuXG5cdFx0XHRcdFx0ZGlmZnMuc3BsaWNlKCBwb2ludGVyIC0gY291bnREZWxldGUgLSBjb3VudEluc2VydCxcblx0XHRcdFx0XHRcdGNvdW50RGVsZXRlICsgY291bnRJbnNlcnQgKTtcblx0XHRcdFx0XHRwb2ludGVyID0gcG9pbnRlciAtIGNvdW50RGVsZXRlIC0gY291bnRJbnNlcnQ7XG5cdFx0XHRcdFx0YSA9IHRoaXMuRGlmZk1haW4oIHRleHREZWxldGUsIHRleHRJbnNlcnQsIGZhbHNlLCBkZWFkbGluZSApO1xuXHRcdFx0XHRcdGZvciAoIGogPSBhLmxlbmd0aCAtIDE7IGogPj0gMDsgai0tICkge1xuXHRcdFx0XHRcdFx0ZGlmZnMuc3BsaWNlKCBwb2ludGVyLCAwLCBhWyBqIF0gKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cG9pbnRlciA9IHBvaW50ZXIgKyBhLmxlbmd0aDtcblx0XHRcdFx0fVxuXHRcdFx0XHRjb3VudEluc2VydCA9IDA7XG5cdFx0XHRcdGNvdW50RGVsZXRlID0gMDtcblx0XHRcdFx0dGV4dERlbGV0ZSA9IFwiXCI7XG5cdFx0XHRcdHRleHRJbnNlcnQgPSBcIlwiO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHRcdHBvaW50ZXIrKztcblx0XHR9XG5cdFx0ZGlmZnMucG9wKCk7IC8vIFJlbW92ZSB0aGUgZHVtbXkgZW50cnkgYXQgdGhlIGVuZC5cblxuXHRcdHJldHVybiBkaWZmcztcblx0fTtcblxuXHQvKipcblx0ICogRmluZCB0aGUgJ21pZGRsZSBzbmFrZScgb2YgYSBkaWZmLCBzcGxpdCB0aGUgcHJvYmxlbSBpbiB0d29cblx0ICogYW5kIHJldHVybiB0aGUgcmVjdXJzaXZlbHkgY29uc3RydWN0ZWQgZGlmZi5cblx0ICogU2VlIE15ZXJzIDE5ODYgcGFwZXI6IEFuIE8oTkQpIERpZmZlcmVuY2UgQWxnb3JpdGhtIGFuZCBJdHMgVmFyaWF0aW9ucy5cblx0ICogQHBhcmFtIHtzdHJpbmd9IHRleHQxIE9sZCBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGV4dDIgTmV3IHN0cmluZyB0byBiZSBkaWZmZWQuXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBkZWFkbGluZSBUaW1lIGF0IHdoaWNoIHRvIGJhaWwgaWYgbm90IHlldCBjb21wbGV0ZS5cblx0ICogQHJldHVybiB7IUFycmF5LjwhRGlmZk1hdGNoUGF0Y2guRGlmZj59IEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0RGlmZk1hdGNoUGF0Y2gucHJvdG90eXBlLmRpZmZCaXNlY3QgPSBmdW5jdGlvbiggdGV4dDEsIHRleHQyLCBkZWFkbGluZSApIHtcblx0XHR2YXIgdGV4dDFMZW5ndGgsIHRleHQyTGVuZ3RoLCBtYXhELCB2T2Zmc2V0LCB2TGVuZ3RoLFxuXHRcdFx0djEsIHYyLCB4LCBkZWx0YSwgZnJvbnQsIGsxc3RhcnQsIGsxZW5kLCBrMnN0YXJ0LFxuXHRcdFx0azJlbmQsIGsyT2Zmc2V0LCBrMU9mZnNldCwgeDEsIHgyLCB5MSwgeTIsIGQsIGsxLCBrMjtcblxuXHRcdC8vIENhY2hlIHRoZSB0ZXh0IGxlbmd0aHMgdG8gcHJldmVudCBtdWx0aXBsZSBjYWxscy5cblx0XHR0ZXh0MUxlbmd0aCA9IHRleHQxLmxlbmd0aDtcblx0XHR0ZXh0Mkxlbmd0aCA9IHRleHQyLmxlbmd0aDtcblx0XHRtYXhEID0gTWF0aC5jZWlsKCAoIHRleHQxTGVuZ3RoICsgdGV4dDJMZW5ndGggKSAvIDIgKTtcblx0XHR2T2Zmc2V0ID0gbWF4RDtcblx0XHR2TGVuZ3RoID0gMiAqIG1heEQ7XG5cdFx0djEgPSBuZXcgQXJyYXkoIHZMZW5ndGggKTtcblx0XHR2MiA9IG5ldyBBcnJheSggdkxlbmd0aCApO1xuXG5cdFx0Ly8gU2V0dGluZyBhbGwgZWxlbWVudHMgdG8gLTEgaXMgZmFzdGVyIGluIENocm9tZSAmIEZpcmVmb3ggdGhhbiBtaXhpbmdcblx0XHQvLyBpbnRlZ2VycyBhbmQgdW5kZWZpbmVkLlxuXHRcdGZvciAoIHggPSAwOyB4IDwgdkxlbmd0aDsgeCsrICkge1xuXHRcdFx0djFbIHggXSA9IC0xO1xuXHRcdFx0djJbIHggXSA9IC0xO1xuXHRcdH1cblx0XHR2MVsgdk9mZnNldCArIDEgXSA9IDA7XG5cdFx0djJbIHZPZmZzZXQgKyAxIF0gPSAwO1xuXHRcdGRlbHRhID0gdGV4dDFMZW5ndGggLSB0ZXh0Mkxlbmd0aDtcblxuXHRcdC8vIElmIHRoZSB0b3RhbCBudW1iZXIgb2YgY2hhcmFjdGVycyBpcyBvZGQsIHRoZW4gdGhlIGZyb250IHBhdGggd2lsbCBjb2xsaWRlXG5cdFx0Ly8gd2l0aCB0aGUgcmV2ZXJzZSBwYXRoLlxuXHRcdGZyb250ID0gKCBkZWx0YSAlIDIgIT09IDAgKTtcblxuXHRcdC8vIE9mZnNldHMgZm9yIHN0YXJ0IGFuZCBlbmQgb2YgayBsb29wLlxuXHRcdC8vIFByZXZlbnRzIG1hcHBpbmcgb2Ygc3BhY2UgYmV5b25kIHRoZSBncmlkLlxuXHRcdGsxc3RhcnQgPSAwO1xuXHRcdGsxZW5kID0gMDtcblx0XHRrMnN0YXJ0ID0gMDtcblx0XHRrMmVuZCA9IDA7XG5cdFx0Zm9yICggZCA9IDA7IGQgPCBtYXhEOyBkKysgKSB7XG5cblx0XHRcdC8vIEJhaWwgb3V0IGlmIGRlYWRsaW5lIGlzIHJlYWNoZWQuXG5cdFx0XHRpZiAoICggbmV3IERhdGUoKSApLmdldFRpbWUoKSA+IGRlYWRsaW5lICkge1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblxuXHRcdFx0Ly8gV2FsayB0aGUgZnJvbnQgcGF0aCBvbmUgc3RlcC5cblx0XHRcdGZvciAoIGsxID0gLWQgKyBrMXN0YXJ0OyBrMSA8PSBkIC0gazFlbmQ7IGsxICs9IDIgKSB7XG5cdFx0XHRcdGsxT2Zmc2V0ID0gdk9mZnNldCArIGsxO1xuXHRcdFx0XHRpZiAoIGsxID09PSAtZCB8fCAoIGsxICE9PSBkICYmIHYxWyBrMU9mZnNldCAtIDEgXSA8IHYxWyBrMU9mZnNldCArIDEgXSApICkge1xuXHRcdFx0XHRcdHgxID0gdjFbIGsxT2Zmc2V0ICsgMSBdO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHgxID0gdjFbIGsxT2Zmc2V0IC0gMSBdICsgMTtcblx0XHRcdFx0fVxuXHRcdFx0XHR5MSA9IHgxIC0gazE7XG5cdFx0XHRcdHdoaWxlICggeDEgPCB0ZXh0MUxlbmd0aCAmJiB5MSA8IHRleHQyTGVuZ3RoICYmXG5cdFx0XHRcdFx0dGV4dDEuY2hhckF0KCB4MSApID09PSB0ZXh0Mi5jaGFyQXQoIHkxICkgKSB7XG5cdFx0XHRcdFx0eDErKztcblx0XHRcdFx0XHR5MSsrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHYxWyBrMU9mZnNldCBdID0geDE7XG5cdFx0XHRcdGlmICggeDEgPiB0ZXh0MUxlbmd0aCApIHtcblxuXHRcdFx0XHRcdC8vIFJhbiBvZmYgdGhlIHJpZ2h0IG9mIHRoZSBncmFwaC5cblx0XHRcdFx0XHRrMWVuZCArPSAyO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCB5MSA+IHRleHQyTGVuZ3RoICkge1xuXG5cdFx0XHRcdFx0Ly8gUmFuIG9mZiB0aGUgYm90dG9tIG9mIHRoZSBncmFwaC5cblx0XHRcdFx0XHRrMXN0YXJ0ICs9IDI7XG5cdFx0XHRcdH0gZWxzZSBpZiAoIGZyb250ICkge1xuXHRcdFx0XHRcdGsyT2Zmc2V0ID0gdk9mZnNldCArIGRlbHRhIC0gazE7XG5cdFx0XHRcdFx0aWYgKCBrMk9mZnNldCA+PSAwICYmIGsyT2Zmc2V0IDwgdkxlbmd0aCAmJiB2MlsgazJPZmZzZXQgXSAhPT0gLTEgKSB7XG5cblx0XHRcdFx0XHRcdC8vIE1pcnJvciB4MiBvbnRvIHRvcC1sZWZ0IGNvb3JkaW5hdGUgc3lzdGVtLlxuXHRcdFx0XHRcdFx0eDIgPSB0ZXh0MUxlbmd0aCAtIHYyWyBrMk9mZnNldCBdO1xuXHRcdFx0XHRcdFx0aWYgKCB4MSA+PSB4MiApIHtcblxuXHRcdFx0XHRcdFx0XHQvLyBPdmVybGFwIGRldGVjdGVkLlxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kaWZmQmlzZWN0U3BsaXQoIHRleHQxLCB0ZXh0MiwgeDEsIHkxLCBkZWFkbGluZSApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBXYWxrIHRoZSByZXZlcnNlIHBhdGggb25lIHN0ZXAuXG5cdFx0XHRmb3IgKCBrMiA9IC1kICsgazJzdGFydDsgazIgPD0gZCAtIGsyZW5kOyBrMiArPSAyICkge1xuXHRcdFx0XHRrMk9mZnNldCA9IHZPZmZzZXQgKyBrMjtcblx0XHRcdFx0aWYgKCBrMiA9PT0gLWQgfHwgKCBrMiAhPT0gZCAmJiB2MlsgazJPZmZzZXQgLSAxIF0gPCB2MlsgazJPZmZzZXQgKyAxIF0gKSApIHtcblx0XHRcdFx0XHR4MiA9IHYyWyBrMk9mZnNldCArIDEgXTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR4MiA9IHYyWyBrMk9mZnNldCAtIDEgXSArIDE7XG5cdFx0XHRcdH1cblx0XHRcdFx0eTIgPSB4MiAtIGsyO1xuXHRcdFx0XHR3aGlsZSAoIHgyIDwgdGV4dDFMZW5ndGggJiYgeTIgPCB0ZXh0Mkxlbmd0aCAmJlxuXHRcdFx0XHRcdHRleHQxLmNoYXJBdCggdGV4dDFMZW5ndGggLSB4MiAtIDEgKSA9PT1cblx0XHRcdFx0XHR0ZXh0Mi5jaGFyQXQoIHRleHQyTGVuZ3RoIC0geTIgLSAxICkgKSB7XG5cdFx0XHRcdFx0eDIrKztcblx0XHRcdFx0XHR5MisrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHYyWyBrMk9mZnNldCBdID0geDI7XG5cdFx0XHRcdGlmICggeDIgPiB0ZXh0MUxlbmd0aCApIHtcblxuXHRcdFx0XHRcdC8vIFJhbiBvZmYgdGhlIGxlZnQgb2YgdGhlIGdyYXBoLlxuXHRcdFx0XHRcdGsyZW5kICs9IDI7XG5cdFx0XHRcdH0gZWxzZSBpZiAoIHkyID4gdGV4dDJMZW5ndGggKSB7XG5cblx0XHRcdFx0XHQvLyBSYW4gb2ZmIHRoZSB0b3Agb2YgdGhlIGdyYXBoLlxuXHRcdFx0XHRcdGsyc3RhcnQgKz0gMjtcblx0XHRcdFx0fSBlbHNlIGlmICggIWZyb250ICkge1xuXHRcdFx0XHRcdGsxT2Zmc2V0ID0gdk9mZnNldCArIGRlbHRhIC0gazI7XG5cdFx0XHRcdFx0aWYgKCBrMU9mZnNldCA+PSAwICYmIGsxT2Zmc2V0IDwgdkxlbmd0aCAmJiB2MVsgazFPZmZzZXQgXSAhPT0gLTEgKSB7XG5cdFx0XHRcdFx0XHR4MSA9IHYxWyBrMU9mZnNldCBdO1xuXHRcdFx0XHRcdFx0eTEgPSB2T2Zmc2V0ICsgeDEgLSBrMU9mZnNldDtcblxuXHRcdFx0XHRcdFx0Ly8gTWlycm9yIHgyIG9udG8gdG9wLWxlZnQgY29vcmRpbmF0ZSBzeXN0ZW0uXG5cdFx0XHRcdFx0XHR4MiA9IHRleHQxTGVuZ3RoIC0geDI7XG5cdFx0XHRcdFx0XHRpZiAoIHgxID49IHgyICkge1xuXG5cdFx0XHRcdFx0XHRcdC8vIE92ZXJsYXAgZGV0ZWN0ZWQuXG5cdFx0XHRcdFx0XHRcdHJldHVybiB0aGlzLmRpZmZCaXNlY3RTcGxpdCggdGV4dDEsIHRleHQyLCB4MSwgeTEsIGRlYWRsaW5lICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gRGlmZiB0b29rIHRvbyBsb25nIGFuZCBoaXQgdGhlIGRlYWRsaW5lIG9yXG5cdFx0Ly8gbnVtYmVyIG9mIGRpZmZzIGVxdWFscyBudW1iZXIgb2YgY2hhcmFjdGVycywgbm8gY29tbW9uYWxpdHkgYXQgYWxsLlxuXHRcdHJldHVybiBbXG5cdFx0XHRbIERJRkZfREVMRVRFLCB0ZXh0MSBdLFxuXHRcdFx0WyBESUZGX0lOU0VSVCwgdGV4dDIgXVxuXHRcdF07XG5cdH07XG5cblx0LyoqXG5cdCAqIEdpdmVuIHRoZSBsb2NhdGlvbiBvZiB0aGUgJ21pZGRsZSBzbmFrZScsIHNwbGl0IHRoZSBkaWZmIGluIHR3byBwYXJ0c1xuXHQgKiBhbmQgcmVjdXJzZS5cblx0ICogQHBhcmFtIHtzdHJpbmd9IHRleHQxIE9sZCBzdHJpbmcgdG8gYmUgZGlmZmVkLlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGV4dDIgTmV3IHN0cmluZyB0byBiZSBkaWZmZWQuXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSB4IEluZGV4IG9mIHNwbGl0IHBvaW50IGluIHRleHQxLlxuXHQgKiBAcGFyYW0ge251bWJlcn0geSBJbmRleCBvZiBzcGxpdCBwb2ludCBpbiB0ZXh0Mi5cblx0ICogQHBhcmFtIHtudW1iZXJ9IGRlYWRsaW5lIFRpbWUgYXQgd2hpY2ggdG8gYmFpbCBpZiBub3QgeWV0IGNvbXBsZXRlLlxuXHQgKiBAcmV0dXJuIHshQXJyYXkuPCFEaWZmTWF0Y2hQYXRjaC5EaWZmPn0gQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHREaWZmTWF0Y2hQYXRjaC5wcm90b3R5cGUuZGlmZkJpc2VjdFNwbGl0ID0gZnVuY3Rpb24oIHRleHQxLCB0ZXh0MiwgeCwgeSwgZGVhZGxpbmUgKSB7XG5cdFx0dmFyIHRleHQxYSwgdGV4dDFiLCB0ZXh0MmEsIHRleHQyYiwgZGlmZnMsIGRpZmZzYjtcblx0XHR0ZXh0MWEgPSB0ZXh0MS5zdWJzdHJpbmcoIDAsIHggKTtcblx0XHR0ZXh0MmEgPSB0ZXh0Mi5zdWJzdHJpbmcoIDAsIHkgKTtcblx0XHR0ZXh0MWIgPSB0ZXh0MS5zdWJzdHJpbmcoIHggKTtcblx0XHR0ZXh0MmIgPSB0ZXh0Mi5zdWJzdHJpbmcoIHkgKTtcblxuXHRcdC8vIENvbXB1dGUgYm90aCBkaWZmcyBzZXJpYWxseS5cblx0XHRkaWZmcyA9IHRoaXMuRGlmZk1haW4oIHRleHQxYSwgdGV4dDJhLCBmYWxzZSwgZGVhZGxpbmUgKTtcblx0XHRkaWZmc2IgPSB0aGlzLkRpZmZNYWluKCB0ZXh0MWIsIHRleHQyYiwgZmFsc2UsIGRlYWRsaW5lICk7XG5cblx0XHRyZXR1cm4gZGlmZnMuY29uY2F0KCBkaWZmc2IgKTtcblx0fTtcblxuXHQvKipcblx0ICogUmVkdWNlIHRoZSBudW1iZXIgb2YgZWRpdHMgYnkgZWxpbWluYXRpbmcgc2VtYW50aWNhbGx5IHRyaXZpYWwgZXF1YWxpdGllcy5cblx0ICogQHBhcmFtIHshQXJyYXkuPCFEaWZmTWF0Y2hQYXRjaC5EaWZmPn0gZGlmZnMgQXJyYXkgb2YgZGlmZiB0dXBsZXMuXG5cdCAqL1xuXHREaWZmTWF0Y2hQYXRjaC5wcm90b3R5cGUuZGlmZkNsZWFudXBTZW1hbnRpYyA9IGZ1bmN0aW9uKCBkaWZmcyApIHtcblx0XHR2YXIgY2hhbmdlcywgZXF1YWxpdGllcywgZXF1YWxpdGllc0xlbmd0aCwgbGFzdGVxdWFsaXR5LFxuXHRcdFx0cG9pbnRlciwgbGVuZ3RoSW5zZXJ0aW9uczIsIGxlbmd0aERlbGV0aW9uczIsIGxlbmd0aEluc2VydGlvbnMxLFxuXHRcdFx0bGVuZ3RoRGVsZXRpb25zMSwgZGVsZXRpb24sIGluc2VydGlvbiwgb3ZlcmxhcExlbmd0aDEsIG92ZXJsYXBMZW5ndGgyO1xuXHRcdGNoYW5nZXMgPSBmYWxzZTtcblx0XHRlcXVhbGl0aWVzID0gW107IC8vIFN0YWNrIG9mIGluZGljZXMgd2hlcmUgZXF1YWxpdGllcyBhcmUgZm91bmQuXG5cdFx0ZXF1YWxpdGllc0xlbmd0aCA9IDA7IC8vIEtlZXBpbmcgb3VyIG93biBsZW5ndGggdmFyIGlzIGZhc3RlciBpbiBKUy5cblx0XHQvKiogQHR5cGUgez9zdHJpbmd9ICovXG5cdFx0bGFzdGVxdWFsaXR5ID0gbnVsbDtcblxuXHRcdC8vIEFsd2F5cyBlcXVhbCB0byBkaWZmc1tlcXVhbGl0aWVzW2VxdWFsaXRpZXNMZW5ndGggLSAxXV1bMV1cblx0XHRwb2ludGVyID0gMDsgLy8gSW5kZXggb2YgY3VycmVudCBwb3NpdGlvbi5cblxuXHRcdC8vIE51bWJlciBvZiBjaGFyYWN0ZXJzIHRoYXQgY2hhbmdlZCBwcmlvciB0byB0aGUgZXF1YWxpdHkuXG5cdFx0bGVuZ3RoSW5zZXJ0aW9uczEgPSAwO1xuXHRcdGxlbmd0aERlbGV0aW9uczEgPSAwO1xuXG5cdFx0Ly8gTnVtYmVyIG9mIGNoYXJhY3RlcnMgdGhhdCBjaGFuZ2VkIGFmdGVyIHRoZSBlcXVhbGl0eS5cblx0XHRsZW5ndGhJbnNlcnRpb25zMiA9IDA7XG5cdFx0bGVuZ3RoRGVsZXRpb25zMiA9IDA7XG5cdFx0d2hpbGUgKCBwb2ludGVyIDwgZGlmZnMubGVuZ3RoICkge1xuXHRcdFx0aWYgKCBkaWZmc1sgcG9pbnRlciBdWyAwIF0gPT09IERJRkZfRVFVQUwgKSB7IC8vIEVxdWFsaXR5IGZvdW5kLlxuXHRcdFx0XHRlcXVhbGl0aWVzWyBlcXVhbGl0aWVzTGVuZ3RoKysgXSA9IHBvaW50ZXI7XG5cdFx0XHRcdGxlbmd0aEluc2VydGlvbnMxID0gbGVuZ3RoSW5zZXJ0aW9uczI7XG5cdFx0XHRcdGxlbmd0aERlbGV0aW9uczEgPSBsZW5ndGhEZWxldGlvbnMyO1xuXHRcdFx0XHRsZW5ndGhJbnNlcnRpb25zMiA9IDA7XG5cdFx0XHRcdGxlbmd0aERlbGV0aW9uczIgPSAwO1xuXHRcdFx0XHRsYXN0ZXF1YWxpdHkgPSBkaWZmc1sgcG9pbnRlciBdWyAxIF07XG5cdFx0XHR9IGVsc2UgeyAvLyBBbiBpbnNlcnRpb24gb3IgZGVsZXRpb24uXG5cdFx0XHRcdGlmICggZGlmZnNbIHBvaW50ZXIgXVsgMCBdID09PSBESUZGX0lOU0VSVCApIHtcblx0XHRcdFx0XHRsZW5ndGhJbnNlcnRpb25zMiArPSBkaWZmc1sgcG9pbnRlciBdWyAxIF0ubGVuZ3RoO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGxlbmd0aERlbGV0aW9uczIgKz0gZGlmZnNbIHBvaW50ZXIgXVsgMSBdLmxlbmd0aDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEVsaW1pbmF0ZSBhbiBlcXVhbGl0eSB0aGF0IGlzIHNtYWxsZXIgb3IgZXF1YWwgdG8gdGhlIGVkaXRzIG9uIGJvdGhcblx0XHRcdFx0Ly8gc2lkZXMgb2YgaXQuXG5cdFx0XHRcdGlmICggbGFzdGVxdWFsaXR5ICYmICggbGFzdGVxdWFsaXR5Lmxlbmd0aCA8PVxuXHRcdFx0XHRcdFx0TWF0aC5tYXgoIGxlbmd0aEluc2VydGlvbnMxLCBsZW5ndGhEZWxldGlvbnMxICkgKSAmJlxuXHRcdFx0XHRcdFx0KCBsYXN0ZXF1YWxpdHkubGVuZ3RoIDw9IE1hdGgubWF4KCBsZW5ndGhJbnNlcnRpb25zMixcblx0XHRcdFx0XHRcdFx0bGVuZ3RoRGVsZXRpb25zMiApICkgKSB7XG5cblx0XHRcdFx0XHQvLyBEdXBsaWNhdGUgcmVjb3JkLlxuXHRcdFx0XHRcdGRpZmZzLnNwbGljZShcblx0XHRcdFx0XHRcdGVxdWFsaXRpZXNbIGVxdWFsaXRpZXNMZW5ndGggLSAxIF0sXG5cdFx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdFx0WyBESUZGX0RFTEVURSwgbGFzdGVxdWFsaXR5IF1cblx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0Ly8gQ2hhbmdlIHNlY29uZCBjb3B5IHRvIGluc2VydC5cblx0XHRcdFx0XHRkaWZmc1sgZXF1YWxpdGllc1sgZXF1YWxpdGllc0xlbmd0aCAtIDEgXSArIDEgXVsgMCBdID0gRElGRl9JTlNFUlQ7XG5cblx0XHRcdFx0XHQvLyBUaHJvdyBhd2F5IHRoZSBlcXVhbGl0eSB3ZSBqdXN0IGRlbGV0ZWQuXG5cdFx0XHRcdFx0ZXF1YWxpdGllc0xlbmd0aC0tO1xuXG5cdFx0XHRcdFx0Ly8gVGhyb3cgYXdheSB0aGUgcHJldmlvdXMgZXF1YWxpdHkgKGl0IG5lZWRzIHRvIGJlIHJlZXZhbHVhdGVkKS5cblx0XHRcdFx0XHRlcXVhbGl0aWVzTGVuZ3RoLS07XG5cdFx0XHRcdFx0cG9pbnRlciA9IGVxdWFsaXRpZXNMZW5ndGggPiAwID8gZXF1YWxpdGllc1sgZXF1YWxpdGllc0xlbmd0aCAtIDEgXSA6IC0xO1xuXG5cdFx0XHRcdFx0Ly8gUmVzZXQgdGhlIGNvdW50ZXJzLlxuXHRcdFx0XHRcdGxlbmd0aEluc2VydGlvbnMxID0gMDtcblx0XHRcdFx0XHRsZW5ndGhEZWxldGlvbnMxID0gMDtcblx0XHRcdFx0XHRsZW5ndGhJbnNlcnRpb25zMiA9IDA7XG5cdFx0XHRcdFx0bGVuZ3RoRGVsZXRpb25zMiA9IDA7XG5cdFx0XHRcdFx0bGFzdGVxdWFsaXR5ID0gbnVsbDtcblx0XHRcdFx0XHRjaGFuZ2VzID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cG9pbnRlcisrO1xuXHRcdH1cblxuXHRcdC8vIE5vcm1hbGl6ZSB0aGUgZGlmZi5cblx0XHRpZiAoIGNoYW5nZXMgKSB7XG5cdFx0XHR0aGlzLmRpZmZDbGVhbnVwTWVyZ2UoIGRpZmZzICk7XG5cdFx0fVxuXG5cdFx0Ly8gRmluZCBhbnkgb3ZlcmxhcHMgYmV0d2VlbiBkZWxldGlvbnMgYW5kIGluc2VydGlvbnMuXG5cdFx0Ly8gZS5nOiA8ZGVsPmFiY3h4eDwvZGVsPjxpbnM+eHh4ZGVmPC9pbnM+XG5cdFx0Ly8gICAtPiA8ZGVsPmFiYzwvZGVsPnh4eDxpbnM+ZGVmPC9pbnM+XG5cdFx0Ly8gZS5nOiA8ZGVsPnh4eGFiYzwvZGVsPjxpbnM+ZGVmeHh4PC9pbnM+XG5cdFx0Ly8gICAtPiA8aW5zPmRlZjwvaW5zPnh4eDxkZWw+YWJjPC9kZWw+XG5cdFx0Ly8gT25seSBleHRyYWN0IGFuIG92ZXJsYXAgaWYgaXQgaXMgYXMgYmlnIGFzIHRoZSBlZGl0IGFoZWFkIG9yIGJlaGluZCBpdC5cblx0XHRwb2ludGVyID0gMTtcblx0XHR3aGlsZSAoIHBvaW50ZXIgPCBkaWZmcy5sZW5ndGggKSB7XG5cdFx0XHRpZiAoIGRpZmZzWyBwb2ludGVyIC0gMSBdWyAwIF0gPT09IERJRkZfREVMRVRFICYmXG5cdFx0XHRcdFx0ZGlmZnNbIHBvaW50ZXIgXVsgMCBdID09PSBESUZGX0lOU0VSVCApIHtcblx0XHRcdFx0ZGVsZXRpb24gPSBkaWZmc1sgcG9pbnRlciAtIDEgXVsgMSBdO1xuXHRcdFx0XHRpbnNlcnRpb24gPSBkaWZmc1sgcG9pbnRlciBdWyAxIF07XG5cdFx0XHRcdG92ZXJsYXBMZW5ndGgxID0gdGhpcy5kaWZmQ29tbW9uT3ZlcmxhcCggZGVsZXRpb24sIGluc2VydGlvbiApO1xuXHRcdFx0XHRvdmVybGFwTGVuZ3RoMiA9IHRoaXMuZGlmZkNvbW1vbk92ZXJsYXAoIGluc2VydGlvbiwgZGVsZXRpb24gKTtcblx0XHRcdFx0aWYgKCBvdmVybGFwTGVuZ3RoMSA+PSBvdmVybGFwTGVuZ3RoMiApIHtcblx0XHRcdFx0XHRpZiAoIG92ZXJsYXBMZW5ndGgxID49IGRlbGV0aW9uLmxlbmd0aCAvIDIgfHxcblx0XHRcdFx0XHRcdFx0b3ZlcmxhcExlbmd0aDEgPj0gaW5zZXJ0aW9uLmxlbmd0aCAvIDIgKSB7XG5cblx0XHRcdFx0XHRcdC8vIE92ZXJsYXAgZm91bmQuICBJbnNlcnQgYW4gZXF1YWxpdHkgYW5kIHRyaW0gdGhlIHN1cnJvdW5kaW5nIGVkaXRzLlxuXHRcdFx0XHRcdFx0ZGlmZnMuc3BsaWNlKFxuXHRcdFx0XHRcdFx0XHRwb2ludGVyLFxuXHRcdFx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdFx0XHRbIERJRkZfRVFVQUwsIGluc2VydGlvbi5zdWJzdHJpbmcoIDAsIG92ZXJsYXBMZW5ndGgxICkgXVxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdGRpZmZzWyBwb2ludGVyIC0gMSBdWyAxIF0gPVxuXHRcdFx0XHRcdFx0XHRkZWxldGlvbi5zdWJzdHJpbmcoIDAsIGRlbGV0aW9uLmxlbmd0aCAtIG92ZXJsYXBMZW5ndGgxICk7XG5cdFx0XHRcdFx0XHRkaWZmc1sgcG9pbnRlciArIDEgXVsgMSBdID0gaW5zZXJ0aW9uLnN1YnN0cmluZyggb3ZlcmxhcExlbmd0aDEgKTtcblx0XHRcdFx0XHRcdHBvaW50ZXIrKztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aWYgKCBvdmVybGFwTGVuZ3RoMiA+PSBkZWxldGlvbi5sZW5ndGggLyAyIHx8XG5cdFx0XHRcdFx0XHRcdG92ZXJsYXBMZW5ndGgyID49IGluc2VydGlvbi5sZW5ndGggLyAyICkge1xuXG5cdFx0XHRcdFx0XHQvLyBSZXZlcnNlIG92ZXJsYXAgZm91bmQuXG5cdFx0XHRcdFx0XHQvLyBJbnNlcnQgYW4gZXF1YWxpdHkgYW5kIHN3YXAgYW5kIHRyaW0gdGhlIHN1cnJvdW5kaW5nIGVkaXRzLlxuXHRcdFx0XHRcdFx0ZGlmZnMuc3BsaWNlKFxuXHRcdFx0XHRcdFx0XHRwb2ludGVyLFxuXHRcdFx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdFx0XHRbIERJRkZfRVFVQUwsIGRlbGV0aW9uLnN1YnN0cmluZyggMCwgb3ZlcmxhcExlbmd0aDIgKSBdXG5cdFx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0XHRkaWZmc1sgcG9pbnRlciAtIDEgXVsgMCBdID0gRElGRl9JTlNFUlQ7XG5cdFx0XHRcdFx0XHRkaWZmc1sgcG9pbnRlciAtIDEgXVsgMSBdID1cblx0XHRcdFx0XHRcdFx0aW5zZXJ0aW9uLnN1YnN0cmluZyggMCwgaW5zZXJ0aW9uLmxlbmd0aCAtIG92ZXJsYXBMZW5ndGgyICk7XG5cdFx0XHRcdFx0XHRkaWZmc1sgcG9pbnRlciArIDEgXVsgMCBdID0gRElGRl9ERUxFVEU7XG5cdFx0XHRcdFx0XHRkaWZmc1sgcG9pbnRlciArIDEgXVsgMSBdID1cblx0XHRcdFx0XHRcdFx0ZGVsZXRpb24uc3Vic3RyaW5nKCBvdmVybGFwTGVuZ3RoMiApO1xuXHRcdFx0XHRcdFx0cG9pbnRlcisrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRwb2ludGVyKys7XG5cdFx0XHR9XG5cdFx0XHRwb2ludGVyKys7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmUgaWYgdGhlIHN1ZmZpeCBvZiBvbmUgc3RyaW5nIGlzIHRoZSBwcmVmaXggb2YgYW5vdGhlci5cblx0ICogQHBhcmFtIHtzdHJpbmd9IHRleHQxIEZpcnN0IHN0cmluZy5cblx0ICogQHBhcmFtIHtzdHJpbmd9IHRleHQyIFNlY29uZCBzdHJpbmcuXG5cdCAqIEByZXR1cm4ge251bWJlcn0gVGhlIG51bWJlciBvZiBjaGFyYWN0ZXJzIGNvbW1vbiB0byB0aGUgZW5kIG9mIHRoZSBmaXJzdFxuXHQgKiAgICAgc3RyaW5nIGFuZCB0aGUgc3RhcnQgb2YgdGhlIHNlY29uZCBzdHJpbmcuXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHREaWZmTWF0Y2hQYXRjaC5wcm90b3R5cGUuZGlmZkNvbW1vbk92ZXJsYXAgPSBmdW5jdGlvbiggdGV4dDEsIHRleHQyICkge1xuXHRcdHZhciB0ZXh0MUxlbmd0aCwgdGV4dDJMZW5ndGgsIHRleHRMZW5ndGgsXG5cdFx0XHRiZXN0LCBsZW5ndGgsIHBhdHRlcm4sIGZvdW5kO1xuXG5cdFx0Ly8gQ2FjaGUgdGhlIHRleHQgbGVuZ3RocyB0byBwcmV2ZW50IG11bHRpcGxlIGNhbGxzLlxuXHRcdHRleHQxTGVuZ3RoID0gdGV4dDEubGVuZ3RoO1xuXHRcdHRleHQyTGVuZ3RoID0gdGV4dDIubGVuZ3RoO1xuXG5cdFx0Ly8gRWxpbWluYXRlIHRoZSBudWxsIGNhc2UuXG5cdFx0aWYgKCB0ZXh0MUxlbmd0aCA9PT0gMCB8fCB0ZXh0Mkxlbmd0aCA9PT0gMCApIHtcblx0XHRcdHJldHVybiAwO1xuXHRcdH1cblxuXHRcdC8vIFRydW5jYXRlIHRoZSBsb25nZXIgc3RyaW5nLlxuXHRcdGlmICggdGV4dDFMZW5ndGggPiB0ZXh0Mkxlbmd0aCApIHtcblx0XHRcdHRleHQxID0gdGV4dDEuc3Vic3RyaW5nKCB0ZXh0MUxlbmd0aCAtIHRleHQyTGVuZ3RoICk7XG5cdFx0fSBlbHNlIGlmICggdGV4dDFMZW5ndGggPCB0ZXh0Mkxlbmd0aCApIHtcblx0XHRcdHRleHQyID0gdGV4dDIuc3Vic3RyaW5nKCAwLCB0ZXh0MUxlbmd0aCApO1xuXHRcdH1cblx0XHR0ZXh0TGVuZ3RoID0gTWF0aC5taW4oIHRleHQxTGVuZ3RoLCB0ZXh0Mkxlbmd0aCApO1xuXG5cdFx0Ly8gUXVpY2sgY2hlY2sgZm9yIHRoZSB3b3JzdCBjYXNlLlxuXHRcdGlmICggdGV4dDEgPT09IHRleHQyICkge1xuXHRcdFx0cmV0dXJuIHRleHRMZW5ndGg7XG5cdFx0fVxuXG5cdFx0Ly8gU3RhcnQgYnkgbG9va2luZyBmb3IgYSBzaW5nbGUgY2hhcmFjdGVyIG1hdGNoXG5cdFx0Ly8gYW5kIGluY3JlYXNlIGxlbmd0aCB1bnRpbCBubyBtYXRjaCBpcyBmb3VuZC5cblx0XHQvLyBQZXJmb3JtYW5jZSBhbmFseXNpczogaHR0cHM6Ly9uZWlsLmZyYXNlci5uYW1lL25ld3MvMjAxMC8xMS8wNC9cblx0XHRiZXN0ID0gMDtcblx0XHRsZW5ndGggPSAxO1xuXHRcdHdoaWxlICggdHJ1ZSApIHtcblx0XHRcdHBhdHRlcm4gPSB0ZXh0MS5zdWJzdHJpbmcoIHRleHRMZW5ndGggLSBsZW5ndGggKTtcblx0XHRcdGZvdW5kID0gdGV4dDIuaW5kZXhPZiggcGF0dGVybiApO1xuXHRcdFx0aWYgKCBmb3VuZCA9PT0gLTEgKSB7XG5cdFx0XHRcdHJldHVybiBiZXN0O1xuXHRcdFx0fVxuXHRcdFx0bGVuZ3RoICs9IGZvdW5kO1xuXHRcdFx0aWYgKCBmb3VuZCA9PT0gMCB8fCB0ZXh0MS5zdWJzdHJpbmcoIHRleHRMZW5ndGggLSBsZW5ndGggKSA9PT1cblx0XHRcdFx0XHR0ZXh0Mi5zdWJzdHJpbmcoIDAsIGxlbmd0aCApICkge1xuXHRcdFx0XHRiZXN0ID0gbGVuZ3RoO1xuXHRcdFx0XHRsZW5ndGgrKztcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0LyoqXG5cdCAqIFNwbGl0IHR3byB0ZXh0cyBpbnRvIGFuIGFycmF5IG9mIHN0cmluZ3MuICBSZWR1Y2UgdGhlIHRleHRzIHRvIGEgc3RyaW5nIG9mXG5cdCAqIGhhc2hlcyB3aGVyZSBlYWNoIFVuaWNvZGUgY2hhcmFjdGVyIHJlcHJlc2VudHMgb25lIGxpbmUuXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0MSBGaXJzdCBzdHJpbmcuXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0MiBTZWNvbmQgc3RyaW5nLlxuXHQgKiBAcmV0dXJuIHt7Y2hhcnMxOiBzdHJpbmcsIGNoYXJzMjogc3RyaW5nLCBsaW5lQXJyYXk6ICFBcnJheS48c3RyaW5nPn19XG5cdCAqICAgICBBbiBvYmplY3QgY29udGFpbmluZyB0aGUgZW5jb2RlZCB0ZXh0MSwgdGhlIGVuY29kZWQgdGV4dDIgYW5kXG5cdCAqICAgICB0aGUgYXJyYXkgb2YgdW5pcXVlIHN0cmluZ3MuXG5cdCAqICAgICBUaGUgemVyb3RoIGVsZW1lbnQgb2YgdGhlIGFycmF5IG9mIHVuaXF1ZSBzdHJpbmdzIGlzIGludGVudGlvbmFsbHkgYmxhbmsuXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHREaWZmTWF0Y2hQYXRjaC5wcm90b3R5cGUuZGlmZkxpbmVzVG9DaGFycyA9IGZ1bmN0aW9uKCB0ZXh0MSwgdGV4dDIgKSB7XG5cdFx0dmFyIGxpbmVBcnJheSwgbGluZUhhc2gsIGNoYXJzMSwgY2hhcnMyO1xuXHRcdGxpbmVBcnJheSA9IFtdOyAvLyBFLmcuIGxpbmVBcnJheVs0XSA9PT0gJ0hlbGxvXFxuJ1xuXHRcdGxpbmVIYXNoID0ge307ICAvLyBFLmcuIGxpbmVIYXNoWydIZWxsb1xcbiddID09PSA0XG5cblx0XHQvLyAnXFx4MDAnIGlzIGEgdmFsaWQgY2hhcmFjdGVyLCBidXQgdmFyaW91cyBkZWJ1Z2dlcnMgZG9uJ3QgbGlrZSBpdC5cblx0XHQvLyBTbyB3ZSdsbCBpbnNlcnQgYSBqdW5rIGVudHJ5IHRvIGF2b2lkIGdlbmVyYXRpbmcgYSBudWxsIGNoYXJhY3Rlci5cblx0XHRsaW5lQXJyYXlbIDAgXSA9IFwiXCI7XG5cblx0XHQvKipcblx0XHQgKiBTcGxpdCBhIHRleHQgaW50byBhbiBhcnJheSBvZiBzdHJpbmdzLiAgUmVkdWNlIHRoZSB0ZXh0cyB0byBhIHN0cmluZyBvZlxuXHRcdCAqIGhhc2hlcyB3aGVyZSBlYWNoIFVuaWNvZGUgY2hhcmFjdGVyIHJlcHJlc2VudHMgb25lIGxpbmUuXG5cdFx0ICogTW9kaWZpZXMgbGluZWFycmF5IGFuZCBsaW5laGFzaCB0aHJvdWdoIGJlaW5nIGEgY2xvc3VyZS5cblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCBTdHJpbmcgdG8gZW5jb2RlLlxuXHRcdCAqIEByZXR1cm4ge3N0cmluZ30gRW5jb2RlZCBzdHJpbmcuXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHRmdW5jdGlvbiBkaWZmTGluZXNUb0NoYXJzTXVuZ2UoIHRleHQgKSB7XG5cdFx0XHR2YXIgY2hhcnMsIGxpbmVTdGFydCwgbGluZUVuZCwgbGluZUFycmF5TGVuZ3RoLCBsaW5lO1xuXHRcdFx0Y2hhcnMgPSBcIlwiO1xuXG5cdFx0XHQvLyBXYWxrIHRoZSB0ZXh0LCBwdWxsaW5nIG91dCBhIHN1YnN0cmluZyBmb3IgZWFjaCBsaW5lLlxuXHRcdFx0Ly8gdGV4dC5zcGxpdCgnXFxuJykgd291bGQgd291bGQgdGVtcG9yYXJpbHkgZG91YmxlIG91ciBtZW1vcnkgZm9vdHByaW50LlxuXHRcdFx0Ly8gTW9kaWZ5aW5nIHRleHQgd291bGQgY3JlYXRlIG1hbnkgbGFyZ2Ugc3RyaW5ncyB0byBnYXJiYWdlIGNvbGxlY3QuXG5cdFx0XHRsaW5lU3RhcnQgPSAwO1xuXHRcdFx0bGluZUVuZCA9IC0xO1xuXG5cdFx0XHQvLyBLZWVwaW5nIG91ciBvd24gbGVuZ3RoIHZhcmlhYmxlIGlzIGZhc3RlciB0aGFuIGxvb2tpbmcgaXQgdXAuXG5cdFx0XHRsaW5lQXJyYXlMZW5ndGggPSBsaW5lQXJyYXkubGVuZ3RoO1xuXHRcdFx0d2hpbGUgKCBsaW5lRW5kIDwgdGV4dC5sZW5ndGggLSAxICkge1xuXHRcdFx0XHRsaW5lRW5kID0gdGV4dC5pbmRleE9mKCBcIlxcblwiLCBsaW5lU3RhcnQgKTtcblx0XHRcdFx0aWYgKCBsaW5lRW5kID09PSAtMSApIHtcblx0XHRcdFx0XHRsaW5lRW5kID0gdGV4dC5sZW5ndGggLSAxO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGxpbmUgPSB0ZXh0LnN1YnN0cmluZyggbGluZVN0YXJ0LCBsaW5lRW5kICsgMSApO1xuXHRcdFx0XHRsaW5lU3RhcnQgPSBsaW5lRW5kICsgMTtcblxuXHRcdFx0XHRpZiAoIGxpbmVIYXNoLmhhc093blByb3BlcnR5ID8gbGluZUhhc2guaGFzT3duUHJvcGVydHkoIGxpbmUgKSA6XG5cdFx0XHRcdFx0XHRcdCggbGluZUhhc2hbIGxpbmUgXSAhPT0gdW5kZWZpbmVkICkgKSB7XG5cdFx0XHRcdFx0Y2hhcnMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSggbGluZUhhc2hbIGxpbmUgXSApO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNoYXJzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoIGxpbmVBcnJheUxlbmd0aCApO1xuXHRcdFx0XHRcdGxpbmVIYXNoWyBsaW5lIF0gPSBsaW5lQXJyYXlMZW5ndGg7XG5cdFx0XHRcdFx0bGluZUFycmF5WyBsaW5lQXJyYXlMZW5ndGgrKyBdID0gbGluZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGNoYXJzO1xuXHRcdH1cblxuXHRcdGNoYXJzMSA9IGRpZmZMaW5lc1RvQ2hhcnNNdW5nZSggdGV4dDEgKTtcblx0XHRjaGFyczIgPSBkaWZmTGluZXNUb0NoYXJzTXVuZ2UoIHRleHQyICk7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGNoYXJzMTogY2hhcnMxLFxuXHRcdFx0Y2hhcnMyOiBjaGFyczIsXG5cdFx0XHRsaW5lQXJyYXk6IGxpbmVBcnJheVxuXHRcdH07XG5cdH07XG5cblx0LyoqXG5cdCAqIFJlaHlkcmF0ZSB0aGUgdGV4dCBpbiBhIGRpZmYgZnJvbSBhIHN0cmluZyBvZiBsaW5lIGhhc2hlcyB0byByZWFsIGxpbmVzIG9mXG5cdCAqIHRleHQuXG5cdCAqIEBwYXJhbSB7IUFycmF5LjwhRGlmZk1hdGNoUGF0Y2guRGlmZj59IGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuXHQgKiBAcGFyYW0geyFBcnJheS48c3RyaW5nPn0gbGluZUFycmF5IEFycmF5IG9mIHVuaXF1ZSBzdHJpbmdzLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0RGlmZk1hdGNoUGF0Y2gucHJvdG90eXBlLmRpZmZDaGFyc1RvTGluZXMgPSBmdW5jdGlvbiggZGlmZnMsIGxpbmVBcnJheSApIHtcblx0XHR2YXIgeCwgY2hhcnMsIHRleHQsIHk7XG5cdFx0Zm9yICggeCA9IDA7IHggPCBkaWZmcy5sZW5ndGg7IHgrKyApIHtcblx0XHRcdGNoYXJzID0gZGlmZnNbIHggXVsgMSBdO1xuXHRcdFx0dGV4dCA9IFtdO1xuXHRcdFx0Zm9yICggeSA9IDA7IHkgPCBjaGFycy5sZW5ndGg7IHkrKyApIHtcblx0XHRcdFx0dGV4dFsgeSBdID0gbGluZUFycmF5WyBjaGFycy5jaGFyQ29kZUF0KCB5ICkgXTtcblx0XHRcdH1cblx0XHRcdGRpZmZzWyB4IF1bIDEgXSA9IHRleHQuam9pbiggXCJcIiApO1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICogUmVvcmRlciBhbmQgbWVyZ2UgbGlrZSBlZGl0IHNlY3Rpb25zLiAgTWVyZ2UgZXF1YWxpdGllcy5cblx0ICogQW55IGVkaXQgc2VjdGlvbiBjYW4gbW92ZSBhcyBsb25nIGFzIGl0IGRvZXNuJ3QgY3Jvc3MgYW4gZXF1YWxpdHkuXG5cdCAqIEBwYXJhbSB7IUFycmF5LjwhRGlmZk1hdGNoUGF0Y2guRGlmZj59IGRpZmZzIEFycmF5IG9mIGRpZmYgdHVwbGVzLlxuXHQgKi9cblx0RGlmZk1hdGNoUGF0Y2gucHJvdG90eXBlLmRpZmZDbGVhbnVwTWVyZ2UgPSBmdW5jdGlvbiggZGlmZnMgKSB7XG5cdFx0dmFyIHBvaW50ZXIsIGNvdW50RGVsZXRlLCBjb3VudEluc2VydCwgdGV4dEluc2VydCwgdGV4dERlbGV0ZSxcblx0XHRcdGNvbW1vbmxlbmd0aCwgY2hhbmdlcywgZGlmZlBvaW50ZXIsIHBvc2l0aW9uO1xuXHRcdGRpZmZzLnB1c2goIFsgRElGRl9FUVVBTCwgXCJcIiBdICk7IC8vIEFkZCBhIGR1bW15IGVudHJ5IGF0IHRoZSBlbmQuXG5cdFx0cG9pbnRlciA9IDA7XG5cdFx0Y291bnREZWxldGUgPSAwO1xuXHRcdGNvdW50SW5zZXJ0ID0gMDtcblx0XHR0ZXh0RGVsZXRlID0gXCJcIjtcblx0XHR0ZXh0SW5zZXJ0ID0gXCJcIjtcblx0XHRjb21tb25sZW5ndGg7XG5cdFx0d2hpbGUgKCBwb2ludGVyIDwgZGlmZnMubGVuZ3RoICkge1xuXHRcdFx0c3dpdGNoICggZGlmZnNbIHBvaW50ZXIgXVsgMCBdICkge1xuXHRcdFx0Y2FzZSBESUZGX0lOU0VSVDpcblx0XHRcdFx0Y291bnRJbnNlcnQrKztcblx0XHRcdFx0dGV4dEluc2VydCArPSBkaWZmc1sgcG9pbnRlciBdWyAxIF07XG5cdFx0XHRcdHBvaW50ZXIrKztcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIERJRkZfREVMRVRFOlxuXHRcdFx0XHRjb3VudERlbGV0ZSsrO1xuXHRcdFx0XHR0ZXh0RGVsZXRlICs9IGRpZmZzWyBwb2ludGVyIF1bIDEgXTtcblx0XHRcdFx0cG9pbnRlcisrO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgRElGRl9FUVVBTDpcblxuXHRcdFx0XHQvLyBVcG9uIHJlYWNoaW5nIGFuIGVxdWFsaXR5LCBjaGVjayBmb3IgcHJpb3IgcmVkdW5kYW5jaWVzLlxuXHRcdFx0XHRpZiAoIGNvdW50RGVsZXRlICsgY291bnRJbnNlcnQgPiAxICkge1xuXHRcdFx0XHRcdGlmICggY291bnREZWxldGUgIT09IDAgJiYgY291bnRJbnNlcnQgIT09IDAgKSB7XG5cblx0XHRcdFx0XHRcdC8vIEZhY3RvciBvdXQgYW55IGNvbW1vbiBwcmVmaXhlcy5cblx0XHRcdFx0XHRcdGNvbW1vbmxlbmd0aCA9IHRoaXMuZGlmZkNvbW1vblByZWZpeCggdGV4dEluc2VydCwgdGV4dERlbGV0ZSApO1xuXHRcdFx0XHRcdFx0aWYgKCBjb21tb25sZW5ndGggIT09IDAgKSB7XG5cdFx0XHRcdFx0XHRcdGlmICggKCBwb2ludGVyIC0gY291bnREZWxldGUgLSBjb3VudEluc2VydCApID4gMCAmJlxuXHRcdFx0XHRcdFx0XHRcdFx0ZGlmZnNbIHBvaW50ZXIgLSBjb3VudERlbGV0ZSAtIGNvdW50SW5zZXJ0IC0gMSBdWyAwIF0gPT09XG5cdFx0XHRcdFx0XHRcdFx0XHRESUZGX0VRVUFMICkge1xuXHRcdFx0XHRcdFx0XHRcdGRpZmZzWyBwb2ludGVyIC0gY291bnREZWxldGUgLSBjb3VudEluc2VydCAtIDEgXVsgMSBdICs9XG5cdFx0XHRcdFx0XHRcdFx0XHR0ZXh0SW5zZXJ0LnN1YnN0cmluZyggMCwgY29tbW9ubGVuZ3RoICk7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0ZGlmZnMuc3BsaWNlKCAwLCAwLCBbIERJRkZfRVFVQUwsXG5cdFx0XHRcdFx0XHRcdFx0XHR0ZXh0SW5zZXJ0LnN1YnN0cmluZyggMCwgY29tbW9ubGVuZ3RoIClcblx0XHRcdFx0XHRcdFx0XHRdICk7XG5cdFx0XHRcdFx0XHRcdFx0cG9pbnRlcisrO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHRleHRJbnNlcnQgPSB0ZXh0SW5zZXJ0LnN1YnN0cmluZyggY29tbW9ubGVuZ3RoICk7XG5cdFx0XHRcdFx0XHRcdHRleHREZWxldGUgPSB0ZXh0RGVsZXRlLnN1YnN0cmluZyggY29tbW9ubGVuZ3RoICk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8vIEZhY3RvciBvdXQgYW55IGNvbW1vbiBzdWZmaXhpZXMuXG5cdFx0XHRcdFx0XHRjb21tb25sZW5ndGggPSB0aGlzLmRpZmZDb21tb25TdWZmaXgoIHRleHRJbnNlcnQsIHRleHREZWxldGUgKTtcblx0XHRcdFx0XHRcdGlmICggY29tbW9ubGVuZ3RoICE9PSAwICkge1xuXHRcdFx0XHRcdFx0XHRkaWZmc1sgcG9pbnRlciBdWyAxIF0gPSB0ZXh0SW5zZXJ0LnN1YnN0cmluZyggdGV4dEluc2VydC5sZW5ndGggLVxuXHRcdFx0XHRcdFx0XHRcdFx0Y29tbW9ubGVuZ3RoICkgKyBkaWZmc1sgcG9pbnRlciBdWyAxIF07XG5cdFx0XHRcdFx0XHRcdHRleHRJbnNlcnQgPSB0ZXh0SW5zZXJ0LnN1YnN0cmluZyggMCwgdGV4dEluc2VydC5sZW5ndGggLVxuXHRcdFx0XHRcdFx0XHRcdGNvbW1vbmxlbmd0aCApO1xuXHRcdFx0XHRcdFx0XHR0ZXh0RGVsZXRlID0gdGV4dERlbGV0ZS5zdWJzdHJpbmcoIDAsIHRleHREZWxldGUubGVuZ3RoIC1cblx0XHRcdFx0XHRcdFx0XHRjb21tb25sZW5ndGggKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyBEZWxldGUgdGhlIG9mZmVuZGluZyByZWNvcmRzIGFuZCBhZGQgdGhlIG1lcmdlZCBvbmVzLlxuXHRcdFx0XHRcdGlmICggY291bnREZWxldGUgPT09IDAgKSB7XG5cdFx0XHRcdFx0XHRkaWZmcy5zcGxpY2UoIHBvaW50ZXIgLSBjb3VudEluc2VydCxcblx0XHRcdFx0XHRcdFx0Y291bnREZWxldGUgKyBjb3VudEluc2VydCwgWyBESUZGX0lOU0VSVCwgdGV4dEluc2VydCBdICk7XG5cdFx0XHRcdFx0fSBlbHNlIGlmICggY291bnRJbnNlcnQgPT09IDAgKSB7XG5cdFx0XHRcdFx0XHRkaWZmcy5zcGxpY2UoIHBvaW50ZXIgLSBjb3VudERlbGV0ZSxcblx0XHRcdFx0XHRcdFx0Y291bnREZWxldGUgKyBjb3VudEluc2VydCwgWyBESUZGX0RFTEVURSwgdGV4dERlbGV0ZSBdICk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGRpZmZzLnNwbGljZShcblx0XHRcdFx0XHRcdFx0cG9pbnRlciAtIGNvdW50RGVsZXRlIC0gY291bnRJbnNlcnQsXG5cdFx0XHRcdFx0XHRcdGNvdW50RGVsZXRlICsgY291bnRJbnNlcnQsXG5cdFx0XHRcdFx0XHRcdFsgRElGRl9ERUxFVEUsIHRleHREZWxldGUgXSwgWyBESUZGX0lOU0VSVCwgdGV4dEluc2VydCBdXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRwb2ludGVyID0gcG9pbnRlciAtIGNvdW50RGVsZXRlIC0gY291bnRJbnNlcnQgK1xuXHRcdFx0XHRcdFx0KCBjb3VudERlbGV0ZSA/IDEgOiAwICkgKyAoIGNvdW50SW5zZXJ0ID8gMSA6IDAgKSArIDE7XG5cdFx0XHRcdH0gZWxzZSBpZiAoIHBvaW50ZXIgIT09IDAgJiYgZGlmZnNbIHBvaW50ZXIgLSAxIF1bIDAgXSA9PT0gRElGRl9FUVVBTCApIHtcblxuXHRcdFx0XHRcdC8vIE1lcmdlIHRoaXMgZXF1YWxpdHkgd2l0aCB0aGUgcHJldmlvdXMgb25lLlxuXHRcdFx0XHRcdGRpZmZzWyBwb2ludGVyIC0gMSBdWyAxIF0gKz0gZGlmZnNbIHBvaW50ZXIgXVsgMSBdO1xuXHRcdFx0XHRcdGRpZmZzLnNwbGljZSggcG9pbnRlciwgMSApO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHBvaW50ZXIrKztcblx0XHRcdFx0fVxuXHRcdFx0XHRjb3VudEluc2VydCA9IDA7XG5cdFx0XHRcdGNvdW50RGVsZXRlID0gMDtcblx0XHRcdFx0dGV4dERlbGV0ZSA9IFwiXCI7XG5cdFx0XHRcdHRleHRJbnNlcnQgPSBcIlwiO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYgKCBkaWZmc1sgZGlmZnMubGVuZ3RoIC0gMSBdWyAxIF0gPT09IFwiXCIgKSB7XG5cdFx0XHRkaWZmcy5wb3AoKTsgLy8gUmVtb3ZlIHRoZSBkdW1teSBlbnRyeSBhdCB0aGUgZW5kLlxuXHRcdH1cblxuXHRcdC8vIFNlY29uZCBwYXNzOiBsb29rIGZvciBzaW5nbGUgZWRpdHMgc3Vycm91bmRlZCBvbiBib3RoIHNpZGVzIGJ5IGVxdWFsaXRpZXNcblx0XHQvLyB3aGljaCBjYW4gYmUgc2hpZnRlZCBzaWRld2F5cyB0byBlbGltaW5hdGUgYW4gZXF1YWxpdHkuXG5cdFx0Ly8gZS5nOiBBPGlucz5CQTwvaW5zPkMgLT4gPGlucz5BQjwvaW5zPkFDXG5cdFx0Y2hhbmdlcyA9IGZhbHNlO1xuXHRcdHBvaW50ZXIgPSAxO1xuXG5cdFx0Ly8gSW50ZW50aW9uYWxseSBpZ25vcmUgdGhlIGZpcnN0IGFuZCBsYXN0IGVsZW1lbnQgKGRvbid0IG5lZWQgY2hlY2tpbmcpLlxuXHRcdHdoaWxlICggcG9pbnRlciA8IGRpZmZzLmxlbmd0aCAtIDEgKSB7XG5cdFx0XHRpZiAoIGRpZmZzWyBwb2ludGVyIC0gMSBdWyAwIF0gPT09IERJRkZfRVFVQUwgJiZcblx0XHRcdFx0XHRkaWZmc1sgcG9pbnRlciArIDEgXVsgMCBdID09PSBESUZGX0VRVUFMICkge1xuXG5cdFx0XHRcdGRpZmZQb2ludGVyID0gZGlmZnNbIHBvaW50ZXIgXVsgMSBdO1xuXHRcdFx0XHRwb3NpdGlvbiA9IGRpZmZQb2ludGVyLnN1YnN0cmluZyhcblx0XHRcdFx0XHRkaWZmUG9pbnRlci5sZW5ndGggLSBkaWZmc1sgcG9pbnRlciAtIDEgXVsgMSBdLmxlbmd0aFxuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdC8vIFRoaXMgaXMgYSBzaW5nbGUgZWRpdCBzdXJyb3VuZGVkIGJ5IGVxdWFsaXRpZXMuXG5cdFx0XHRcdGlmICggcG9zaXRpb24gPT09IGRpZmZzWyBwb2ludGVyIC0gMSBdWyAxIF0gKSB7XG5cblx0XHRcdFx0XHQvLyBTaGlmdCB0aGUgZWRpdCBvdmVyIHRoZSBwcmV2aW91cyBlcXVhbGl0eS5cblx0XHRcdFx0XHRkaWZmc1sgcG9pbnRlciBdWyAxIF0gPSBkaWZmc1sgcG9pbnRlciAtIDEgXVsgMSBdICtcblx0XHRcdFx0XHRcdGRpZmZzWyBwb2ludGVyIF1bIDEgXS5zdWJzdHJpbmcoIDAsIGRpZmZzWyBwb2ludGVyIF1bIDEgXS5sZW5ndGggLVxuXHRcdFx0XHRcdFx0XHRkaWZmc1sgcG9pbnRlciAtIDEgXVsgMSBdLmxlbmd0aCApO1xuXHRcdFx0XHRcdGRpZmZzWyBwb2ludGVyICsgMSBdWyAxIF0gPVxuXHRcdFx0XHRcdFx0ZGlmZnNbIHBvaW50ZXIgLSAxIF1bIDEgXSArIGRpZmZzWyBwb2ludGVyICsgMSBdWyAxIF07XG5cdFx0XHRcdFx0ZGlmZnMuc3BsaWNlKCBwb2ludGVyIC0gMSwgMSApO1xuXHRcdFx0XHRcdGNoYW5nZXMgPSB0cnVlO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCBkaWZmUG9pbnRlci5zdWJzdHJpbmcoIDAsIGRpZmZzWyBwb2ludGVyICsgMSBdWyAxIF0ubGVuZ3RoICkgPT09XG5cdFx0XHRcdFx0XHRkaWZmc1sgcG9pbnRlciArIDEgXVsgMSBdICkge1xuXG5cdFx0XHRcdFx0Ly8gU2hpZnQgdGhlIGVkaXQgb3ZlciB0aGUgbmV4dCBlcXVhbGl0eS5cblx0XHRcdFx0XHRkaWZmc1sgcG9pbnRlciAtIDEgXVsgMSBdICs9IGRpZmZzWyBwb2ludGVyICsgMSBdWyAxIF07XG5cdFx0XHRcdFx0ZGlmZnNbIHBvaW50ZXIgXVsgMSBdID1cblx0XHRcdFx0XHRcdGRpZmZzWyBwb2ludGVyIF1bIDEgXS5zdWJzdHJpbmcoIGRpZmZzWyBwb2ludGVyICsgMSBdWyAxIF0ubGVuZ3RoICkgK1xuXHRcdFx0XHRcdFx0ZGlmZnNbIHBvaW50ZXIgKyAxIF1bIDEgXTtcblx0XHRcdFx0XHRkaWZmcy5zcGxpY2UoIHBvaW50ZXIgKyAxLCAxICk7XG5cdFx0XHRcdFx0Y2hhbmdlcyA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHBvaW50ZXIrKztcblx0XHR9XG5cblx0XHQvLyBJZiBzaGlmdHMgd2VyZSBtYWRlLCB0aGUgZGlmZiBuZWVkcyByZW9yZGVyaW5nIGFuZCBhbm90aGVyIHNoaWZ0IHN3ZWVwLlxuXHRcdGlmICggY2hhbmdlcyApIHtcblx0XHRcdHRoaXMuZGlmZkNsZWFudXBNZXJnZSggZGlmZnMgKTtcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIGZ1bmN0aW9uKCBvLCBuICkge1xuXHRcdHZhciBkaWZmLCBvdXRwdXQsIHRleHQ7XG5cdFx0ZGlmZiA9IG5ldyBEaWZmTWF0Y2hQYXRjaCgpO1xuXHRcdG91dHB1dCA9IGRpZmYuRGlmZk1haW4oIG8sIG4gKTtcblx0XHRkaWZmLmRpZmZDbGVhbnVwRWZmaWNpZW5jeSggb3V0cHV0ICk7XG5cdFx0dGV4dCA9IGRpZmYuZGlmZlByZXR0eUh0bWwoIG91dHB1dCApO1xuXG5cdFx0cmV0dXJuIHRleHQ7XG5cdH07XG59KCkgKTtcblxufSgpICk7XG4iLCIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQgVGhlIFBvbHltZXIgUHJvamVjdCBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVGhpcyBjb2RlIG1heSBvbmx5IGJlIHVzZWQgdW5kZXIgdGhlIEJTRCBzdHlsZSBsaWNlbnNlIGZvdW5kIGF0IGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9MSUNFTlNFLnR4dFxuICogVGhlIGNvbXBsZXRlIHNldCBvZiBhdXRob3JzIG1heSBiZSBmb3VuZCBhdCBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQVVUSE9SUy50eHRcbiAqIFRoZSBjb21wbGV0ZSBzZXQgb2YgY29udHJpYnV0b3JzIG1heSBiZSBmb3VuZCBhdCBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQ09OVFJJQlVUT1JTLnR4dFxuICogQ29kZSBkaXN0cmlidXRlZCBieSBHb29nbGUgYXMgcGFydCBvZiB0aGUgcG9seW1lciBwcm9qZWN0IGlzIGFsc29cbiAqIHN1YmplY3QgdG8gYW4gYWRkaXRpb25hbCBJUCByaWdodHMgZ3JhbnQgZm91bmQgYXQgaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL1BBVEVOVFMudHh0XG4gKi9cbi8vIEB2ZXJzaW9uIDAuNy4yMlxuaWYgKHR5cGVvZiBXZWFrTWFwID09PSBcInVuZGVmaW5lZFwiKSB7XG4gIChmdW5jdGlvbigpIHtcbiAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHk7XG4gICAgdmFyIGNvdW50ZXIgPSBEYXRlLm5vdygpICUgMWU5O1xuICAgIHZhciBXZWFrTWFwID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLm5hbWUgPSBcIl9fc3RcIiArIChNYXRoLnJhbmRvbSgpICogMWU5ID4+PiAwKSArIChjb3VudGVyKysgKyBcIl9fXCIpO1xuICAgIH07XG4gICAgV2Vha01hcC5wcm90b3R5cGUgPSB7XG4gICAgICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgICAgdmFyIGVudHJ5ID0ga2V5W3RoaXMubmFtZV07XG4gICAgICAgIGlmIChlbnRyeSAmJiBlbnRyeVswXSA9PT0ga2V5KSBlbnRyeVsxXSA9IHZhbHVlOyBlbHNlIGRlZmluZVByb3BlcnR5KGtleSwgdGhpcy5uYW1lLCB7XG4gICAgICAgICAgdmFsdWU6IFsga2V5LCB2YWx1ZSBdLFxuICAgICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sXG4gICAgICBnZXQ6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICB2YXIgZW50cnk7XG4gICAgICAgIHJldHVybiAoZW50cnkgPSBrZXlbdGhpcy5uYW1lXSkgJiYgZW50cnlbMF0gPT09IGtleSA/IGVudHJ5WzFdIDogdW5kZWZpbmVkO1xuICAgICAgfSxcbiAgICAgIFwiZGVsZXRlXCI6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICB2YXIgZW50cnkgPSBrZXlbdGhpcy5uYW1lXTtcbiAgICAgICAgaWYgKCFlbnRyeSB8fCBlbnRyeVswXSAhPT0ga2V5KSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGVudHJ5WzBdID0gZW50cnlbMV0gPSB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSxcbiAgICAgIGhhczogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHZhciBlbnRyeSA9IGtleVt0aGlzLm5hbWVdO1xuICAgICAgICBpZiAoIWVudHJ5KSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiBlbnRyeVswXSA9PT0ga2V5O1xuICAgICAgfVxuICAgIH07XG4gICAgd2luZG93LldlYWtNYXAgPSBXZWFrTWFwO1xuICB9KSgpO1xufVxuXG4oZnVuY3Rpb24oZ2xvYmFsKSB7XG4gIGlmIChnbG9iYWwuSnNNdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciByZWdpc3RyYXRpb25zVGFibGUgPSBuZXcgV2Vha01hcCgpO1xuICB2YXIgc2V0SW1tZWRpYXRlO1xuICBpZiAoL1RyaWRlbnR8RWRnZS8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkge1xuICAgIHNldEltbWVkaWF0ZSA9IHNldFRpbWVvdXQ7XG4gIH0gZWxzZSBpZiAod2luZG93LnNldEltbWVkaWF0ZSkge1xuICAgIHNldEltbWVkaWF0ZSA9IHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gIH0gZWxzZSB7XG4gICAgdmFyIHNldEltbWVkaWF0ZVF1ZXVlID0gW107XG4gICAgdmFyIHNlbnRpbmVsID0gU3RyaW5nKE1hdGgucmFuZG9tKCkpO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoZS5kYXRhID09PSBzZW50aW5lbCkge1xuICAgICAgICB2YXIgcXVldWUgPSBzZXRJbW1lZGlhdGVRdWV1ZTtcbiAgICAgICAgc2V0SW1tZWRpYXRlUXVldWUgPSBbXTtcbiAgICAgICAgcXVldWUuZm9yRWFjaChmdW5jdGlvbihmdW5jKSB7XG4gICAgICAgICAgZnVuYygpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBzZXRJbW1lZGlhdGUgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgICBzZXRJbW1lZGlhdGVRdWV1ZS5wdXNoKGZ1bmMpO1xuICAgICAgd2luZG93LnBvc3RNZXNzYWdlKHNlbnRpbmVsLCBcIipcIik7XG4gICAgfTtcbiAgfVxuICB2YXIgaXNTY2hlZHVsZWQgPSBmYWxzZTtcbiAgdmFyIHNjaGVkdWxlZE9ic2VydmVycyA9IFtdO1xuICBmdW5jdGlvbiBzY2hlZHVsZUNhbGxiYWNrKG9ic2VydmVyKSB7XG4gICAgc2NoZWR1bGVkT2JzZXJ2ZXJzLnB1c2gob2JzZXJ2ZXIpO1xuICAgIGlmICghaXNTY2hlZHVsZWQpIHtcbiAgICAgIGlzU2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgIHNldEltbWVkaWF0ZShkaXNwYXRjaENhbGxiYWNrcyk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHdyYXBJZk5lZWRlZChub2RlKSB7XG4gICAgcmV0dXJuIHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCAmJiB3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwud3JhcElmTmVlZGVkKG5vZGUpIHx8IG5vZGU7XG4gIH1cbiAgZnVuY3Rpb24gZGlzcGF0Y2hDYWxsYmFja3MoKSB7XG4gICAgaXNTY2hlZHVsZWQgPSBmYWxzZTtcbiAgICB2YXIgb2JzZXJ2ZXJzID0gc2NoZWR1bGVkT2JzZXJ2ZXJzO1xuICAgIHNjaGVkdWxlZE9ic2VydmVycyA9IFtdO1xuICAgIG9ic2VydmVycy5zb3J0KGZ1bmN0aW9uKG8xLCBvMikge1xuICAgICAgcmV0dXJuIG8xLnVpZF8gLSBvMi51aWRfO1xuICAgIH0pO1xuICAgIHZhciBhbnlOb25FbXB0eSA9IGZhbHNlO1xuICAgIG9ic2VydmVycy5mb3JFYWNoKGZ1bmN0aW9uKG9ic2VydmVyKSB7XG4gICAgICB2YXIgcXVldWUgPSBvYnNlcnZlci50YWtlUmVjb3JkcygpO1xuICAgICAgcmVtb3ZlVHJhbnNpZW50T2JzZXJ2ZXJzRm9yKG9ic2VydmVyKTtcbiAgICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgb2JzZXJ2ZXIuY2FsbGJhY2tfKHF1ZXVlLCBvYnNlcnZlcik7XG4gICAgICAgIGFueU5vbkVtcHR5ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoYW55Tm9uRW1wdHkpIGRpc3BhdGNoQ2FsbGJhY2tzKCk7XG4gIH1cbiAgZnVuY3Rpb24gcmVtb3ZlVHJhbnNpZW50T2JzZXJ2ZXJzRm9yKG9ic2VydmVyKSB7XG4gICAgb2JzZXJ2ZXIubm9kZXNfLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xuICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KG5vZGUpO1xuICAgICAgaWYgKCFyZWdpc3RyYXRpb25zKSByZXR1cm47XG4gICAgICByZWdpc3RyYXRpb25zLmZvckVhY2goZnVuY3Rpb24ocmVnaXN0cmF0aW9uKSB7XG4gICAgICAgIGlmIChyZWdpc3RyYXRpb24ub2JzZXJ2ZXIgPT09IG9ic2VydmVyKSByZWdpc3RyYXRpb24ucmVtb3ZlVHJhbnNpZW50T2JzZXJ2ZXJzKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBmb3JFYWNoQW5jZXN0b3JBbmRPYnNlcnZlckVucXVldWVSZWNvcmQodGFyZ2V0LCBjYWxsYmFjaykge1xuICAgIGZvciAodmFyIG5vZGUgPSB0YXJnZXQ7IG5vZGU7IG5vZGUgPSBub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldChub2RlKTtcbiAgICAgIGlmIChyZWdpc3RyYXRpb25zKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcmVnaXN0cmF0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIHZhciByZWdpc3RyYXRpb24gPSByZWdpc3RyYXRpb25zW2pdO1xuICAgICAgICAgIHZhciBvcHRpb25zID0gcmVnaXN0cmF0aW9uLm9wdGlvbnM7XG4gICAgICAgICAgaWYgKG5vZGUgIT09IHRhcmdldCAmJiAhb3B0aW9ucy5zdWJ0cmVlKSBjb250aW51ZTtcbiAgICAgICAgICB2YXIgcmVjb3JkID0gY2FsbGJhY2sob3B0aW9ucyk7XG4gICAgICAgICAgaWYgKHJlY29yZCkgcmVnaXN0cmF0aW9uLmVucXVldWUocmVjb3JkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICB2YXIgdWlkQ291bnRlciA9IDA7XG4gIGZ1bmN0aW9uIEpzTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjaykge1xuICAgIHRoaXMuY2FsbGJhY2tfID0gY2FsbGJhY2s7XG4gICAgdGhpcy5ub2Rlc18gPSBbXTtcbiAgICB0aGlzLnJlY29yZHNfID0gW107XG4gICAgdGhpcy51aWRfID0gKyt1aWRDb3VudGVyO1xuICB9XG4gIEpzTXV0YXRpb25PYnNlcnZlci5wcm90b3R5cGUgPSB7XG4gICAgb2JzZXJ2ZTogZnVuY3Rpb24odGFyZ2V0LCBvcHRpb25zKSB7XG4gICAgICB0YXJnZXQgPSB3cmFwSWZOZWVkZWQodGFyZ2V0KTtcbiAgICAgIGlmICghb3B0aW9ucy5jaGlsZExpc3QgJiYgIW9wdGlvbnMuYXR0cmlidXRlcyAmJiAhb3B0aW9ucy5jaGFyYWN0ZXJEYXRhIHx8IG9wdGlvbnMuYXR0cmlidXRlT2xkVmFsdWUgJiYgIW9wdGlvbnMuYXR0cmlidXRlcyB8fCBvcHRpb25zLmF0dHJpYnV0ZUZpbHRlciAmJiBvcHRpb25zLmF0dHJpYnV0ZUZpbHRlci5sZW5ndGggJiYgIW9wdGlvbnMuYXR0cmlidXRlcyB8fCBvcHRpb25zLmNoYXJhY3RlckRhdGFPbGRWYWx1ZSAmJiAhb3B0aW9ucy5jaGFyYWN0ZXJEYXRhKSB7XG4gICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcigpO1xuICAgICAgfVxuICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KHRhcmdldCk7XG4gICAgICBpZiAoIXJlZ2lzdHJhdGlvbnMpIHJlZ2lzdHJhdGlvbnNUYWJsZS5zZXQodGFyZ2V0LCByZWdpc3RyYXRpb25zID0gW10pO1xuICAgICAgdmFyIHJlZ2lzdHJhdGlvbjtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVnaXN0cmF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocmVnaXN0cmF0aW9uc1tpXS5vYnNlcnZlciA9PT0gdGhpcykge1xuICAgICAgICAgIHJlZ2lzdHJhdGlvbiA9IHJlZ2lzdHJhdGlvbnNbaV07XG4gICAgICAgICAgcmVnaXN0cmF0aW9uLnJlbW92ZUxpc3RlbmVycygpO1xuICAgICAgICAgIHJlZ2lzdHJhdGlvbi5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFyZWdpc3RyYXRpb24pIHtcbiAgICAgICAgcmVnaXN0cmF0aW9uID0gbmV3IFJlZ2lzdHJhdGlvbih0aGlzLCB0YXJnZXQsIG9wdGlvbnMpO1xuICAgICAgICByZWdpc3RyYXRpb25zLnB1c2gocmVnaXN0cmF0aW9uKTtcbiAgICAgICAgdGhpcy5ub2Rlc18ucHVzaCh0YXJnZXQpO1xuICAgICAgfVxuICAgICAgcmVnaXN0cmF0aW9uLmFkZExpc3RlbmVycygpO1xuICAgIH0sXG4gICAgZGlzY29ubmVjdDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLm5vZGVzXy5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KG5vZGUpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlZ2lzdHJhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgcmVnaXN0cmF0aW9uID0gcmVnaXN0cmF0aW9uc1tpXTtcbiAgICAgICAgICBpZiAocmVnaXN0cmF0aW9uLm9ic2VydmVyID09PSB0aGlzKSB7XG4gICAgICAgICAgICByZWdpc3RyYXRpb24ucmVtb3ZlTGlzdGVuZXJzKCk7XG4gICAgICAgICAgICByZWdpc3RyYXRpb25zLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSwgdGhpcyk7XG4gICAgICB0aGlzLnJlY29yZHNfID0gW107XG4gICAgfSxcbiAgICB0YWtlUmVjb3JkczogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY29weU9mUmVjb3JkcyA9IHRoaXMucmVjb3Jkc187XG4gICAgICB0aGlzLnJlY29yZHNfID0gW107XG4gICAgICByZXR1cm4gY29weU9mUmVjb3JkcztcbiAgICB9XG4gIH07XG4gIGZ1bmN0aW9uIE11dGF0aW9uUmVjb3JkKHR5cGUsIHRhcmdldCkge1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgdGhpcy5hZGRlZE5vZGVzID0gW107XG4gICAgdGhpcy5yZW1vdmVkTm9kZXMgPSBbXTtcbiAgICB0aGlzLnByZXZpb3VzU2libGluZyA9IG51bGw7XG4gICAgdGhpcy5uZXh0U2libGluZyA9IG51bGw7XG4gICAgdGhpcy5hdHRyaWJ1dGVOYW1lID0gbnVsbDtcbiAgICB0aGlzLmF0dHJpYnV0ZU5hbWVzcGFjZSA9IG51bGw7XG4gICAgdGhpcy5vbGRWYWx1ZSA9IG51bGw7XG4gIH1cbiAgZnVuY3Rpb24gY29weU11dGF0aW9uUmVjb3JkKG9yaWdpbmFsKSB7XG4gICAgdmFyIHJlY29yZCA9IG5ldyBNdXRhdGlvblJlY29yZChvcmlnaW5hbC50eXBlLCBvcmlnaW5hbC50YXJnZXQpO1xuICAgIHJlY29yZC5hZGRlZE5vZGVzID0gb3JpZ2luYWwuYWRkZWROb2Rlcy5zbGljZSgpO1xuICAgIHJlY29yZC5yZW1vdmVkTm9kZXMgPSBvcmlnaW5hbC5yZW1vdmVkTm9kZXMuc2xpY2UoKTtcbiAgICByZWNvcmQucHJldmlvdXNTaWJsaW5nID0gb3JpZ2luYWwucHJldmlvdXNTaWJsaW5nO1xuICAgIHJlY29yZC5uZXh0U2libGluZyA9IG9yaWdpbmFsLm5leHRTaWJsaW5nO1xuICAgIHJlY29yZC5hdHRyaWJ1dGVOYW1lID0gb3JpZ2luYWwuYXR0cmlidXRlTmFtZTtcbiAgICByZWNvcmQuYXR0cmlidXRlTmFtZXNwYWNlID0gb3JpZ2luYWwuYXR0cmlidXRlTmFtZXNwYWNlO1xuICAgIHJlY29yZC5vbGRWYWx1ZSA9IG9yaWdpbmFsLm9sZFZhbHVlO1xuICAgIHJldHVybiByZWNvcmQ7XG4gIH1cbiAgdmFyIGN1cnJlbnRSZWNvcmQsIHJlY29yZFdpdGhPbGRWYWx1ZTtcbiAgZnVuY3Rpb24gZ2V0UmVjb3JkKHR5cGUsIHRhcmdldCkge1xuICAgIHJldHVybiBjdXJyZW50UmVjb3JkID0gbmV3IE11dGF0aW9uUmVjb3JkKHR5cGUsIHRhcmdldCk7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0UmVjb3JkV2l0aE9sZFZhbHVlKG9sZFZhbHVlKSB7XG4gICAgaWYgKHJlY29yZFdpdGhPbGRWYWx1ZSkgcmV0dXJuIHJlY29yZFdpdGhPbGRWYWx1ZTtcbiAgICByZWNvcmRXaXRoT2xkVmFsdWUgPSBjb3B5TXV0YXRpb25SZWNvcmQoY3VycmVudFJlY29yZCk7XG4gICAgcmVjb3JkV2l0aE9sZFZhbHVlLm9sZFZhbHVlID0gb2xkVmFsdWU7XG4gICAgcmV0dXJuIHJlY29yZFdpdGhPbGRWYWx1ZTtcbiAgfVxuICBmdW5jdGlvbiBjbGVhclJlY29yZHMoKSB7XG4gICAgY3VycmVudFJlY29yZCA9IHJlY29yZFdpdGhPbGRWYWx1ZSA9IHVuZGVmaW5lZDtcbiAgfVxuICBmdW5jdGlvbiByZWNvcmRSZXByZXNlbnRzQ3VycmVudE11dGF0aW9uKHJlY29yZCkge1xuICAgIHJldHVybiByZWNvcmQgPT09IHJlY29yZFdpdGhPbGRWYWx1ZSB8fCByZWNvcmQgPT09IGN1cnJlbnRSZWNvcmQ7XG4gIH1cbiAgZnVuY3Rpb24gc2VsZWN0UmVjb3JkKGxhc3RSZWNvcmQsIG5ld1JlY29yZCkge1xuICAgIGlmIChsYXN0UmVjb3JkID09PSBuZXdSZWNvcmQpIHJldHVybiBsYXN0UmVjb3JkO1xuICAgIGlmIChyZWNvcmRXaXRoT2xkVmFsdWUgJiYgcmVjb3JkUmVwcmVzZW50c0N1cnJlbnRNdXRhdGlvbihsYXN0UmVjb3JkKSkgcmV0dXJuIHJlY29yZFdpdGhPbGRWYWx1ZTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBmdW5jdGlvbiBSZWdpc3RyYXRpb24ob2JzZXJ2ZXIsIHRhcmdldCwgb3B0aW9ucykge1xuICAgIHRoaXMub2JzZXJ2ZXIgPSBvYnNlcnZlcjtcbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMudHJhbnNpZW50T2JzZXJ2ZWROb2RlcyA9IFtdO1xuICB9XG4gIFJlZ2lzdHJhdGlvbi5wcm90b3R5cGUgPSB7XG4gICAgZW5xdWV1ZTogZnVuY3Rpb24ocmVjb3JkKSB7XG4gICAgICB2YXIgcmVjb3JkcyA9IHRoaXMub2JzZXJ2ZXIucmVjb3Jkc187XG4gICAgICB2YXIgbGVuZ3RoID0gcmVjb3Jkcy5sZW5ndGg7XG4gICAgICBpZiAocmVjb3Jkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBsYXN0UmVjb3JkID0gcmVjb3Jkc1tsZW5ndGggLSAxXTtcbiAgICAgICAgdmFyIHJlY29yZFRvUmVwbGFjZUxhc3QgPSBzZWxlY3RSZWNvcmQobGFzdFJlY29yZCwgcmVjb3JkKTtcbiAgICAgICAgaWYgKHJlY29yZFRvUmVwbGFjZUxhc3QpIHtcbiAgICAgICAgICByZWNvcmRzW2xlbmd0aCAtIDFdID0gcmVjb3JkVG9SZXBsYWNlTGFzdDtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNjaGVkdWxlQ2FsbGJhY2sodGhpcy5vYnNlcnZlcik7XG4gICAgICB9XG4gICAgICByZWNvcmRzW2xlbmd0aF0gPSByZWNvcmQ7XG4gICAgfSxcbiAgICBhZGRMaXN0ZW5lcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5hZGRMaXN0ZW5lcnNfKHRoaXMudGFyZ2V0KTtcbiAgICB9LFxuICAgIGFkZExpc3RlbmVyc186IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgaWYgKG9wdGlvbnMuYXR0cmlidXRlcykgbm9kZS5hZGRFdmVudExpc3RlbmVyKFwiRE9NQXR0ck1vZGlmaWVkXCIsIHRoaXMsIHRydWUpO1xuICAgICAgaWYgKG9wdGlvbnMuY2hhcmFjdGVyRGF0YSkgbm9kZS5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ2hhcmFjdGVyRGF0YU1vZGlmaWVkXCIsIHRoaXMsIHRydWUpO1xuICAgICAgaWYgKG9wdGlvbnMuY2hpbGRMaXN0KSBub2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJET01Ob2RlSW5zZXJ0ZWRcIiwgdGhpcywgdHJ1ZSk7XG4gICAgICBpZiAob3B0aW9ucy5jaGlsZExpc3QgfHwgb3B0aW9ucy5zdWJ0cmVlKSBub2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJET01Ob2RlUmVtb3ZlZFwiLCB0aGlzLCB0cnVlKTtcbiAgICB9LFxuICAgIHJlbW92ZUxpc3RlbmVyczogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyc18odGhpcy50YXJnZXQpO1xuICAgIH0sXG4gICAgcmVtb3ZlTGlzdGVuZXJzXzogZnVuY3Rpb24obm9kZSkge1xuICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVzKSBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJET01BdHRyTW9kaWZpZWRcIiwgdGhpcywgdHJ1ZSk7XG4gICAgICBpZiAob3B0aW9ucy5jaGFyYWN0ZXJEYXRhKSBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJET01DaGFyYWN0ZXJEYXRhTW9kaWZpZWRcIiwgdGhpcywgdHJ1ZSk7XG4gICAgICBpZiAob3B0aW9ucy5jaGlsZExpc3QpIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIkRPTU5vZGVJbnNlcnRlZFwiLCB0aGlzLCB0cnVlKTtcbiAgICAgIGlmIChvcHRpb25zLmNoaWxkTGlzdCB8fCBvcHRpb25zLnN1YnRyZWUpIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIkRPTU5vZGVSZW1vdmVkXCIsIHRoaXMsIHRydWUpO1xuICAgIH0sXG4gICAgYWRkVHJhbnNpZW50T2JzZXJ2ZXI6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIGlmIChub2RlID09PSB0aGlzLnRhcmdldCkgcmV0dXJuO1xuICAgICAgdGhpcy5hZGRMaXN0ZW5lcnNfKG5vZGUpO1xuICAgICAgdGhpcy50cmFuc2llbnRPYnNlcnZlZE5vZGVzLnB1c2gobm9kZSk7XG4gICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQobm9kZSk7XG4gICAgICBpZiAoIXJlZ2lzdHJhdGlvbnMpIHJlZ2lzdHJhdGlvbnNUYWJsZS5zZXQobm9kZSwgcmVnaXN0cmF0aW9ucyA9IFtdKTtcbiAgICAgIHJlZ2lzdHJhdGlvbnMucHVzaCh0aGlzKTtcbiAgICB9LFxuICAgIHJlbW92ZVRyYW5zaWVudE9ic2VydmVyczogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdHJhbnNpZW50T2JzZXJ2ZWROb2RlcyA9IHRoaXMudHJhbnNpZW50T2JzZXJ2ZWROb2RlcztcbiAgICAgIHRoaXMudHJhbnNpZW50T2JzZXJ2ZWROb2RlcyA9IFtdO1xuICAgICAgdHJhbnNpZW50T2JzZXJ2ZWROb2Rlcy5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcnNfKG5vZGUpO1xuICAgICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQobm9kZSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVnaXN0cmF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmIChyZWdpc3RyYXRpb25zW2ldID09PSB0aGlzKSB7XG4gICAgICAgICAgICByZWdpc3RyYXRpb25zLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSwgdGhpcyk7XG4gICAgfSxcbiAgICBoYW5kbGVFdmVudDogZnVuY3Rpb24oZSkge1xuICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgIHN3aXRjaCAoZS50eXBlKSB7XG4gICAgICAgY2FzZSBcIkRPTUF0dHJNb2RpZmllZFwiOlxuICAgICAgICB2YXIgbmFtZSA9IGUuYXR0ck5hbWU7XG4gICAgICAgIHZhciBuYW1lc3BhY2UgPSBlLnJlbGF0ZWROb2RlLm5hbWVzcGFjZVVSSTtcbiAgICAgICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0O1xuICAgICAgICB2YXIgcmVjb3JkID0gbmV3IGdldFJlY29yZChcImF0dHJpYnV0ZXNcIiwgdGFyZ2V0KTtcbiAgICAgICAgcmVjb3JkLmF0dHJpYnV0ZU5hbWUgPSBuYW1lO1xuICAgICAgICByZWNvcmQuYXR0cmlidXRlTmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuICAgICAgICB2YXIgb2xkVmFsdWUgPSBlLmF0dHJDaGFuZ2UgPT09IE11dGF0aW9uRXZlbnQuQURESVRJT04gPyBudWxsIDogZS5wcmV2VmFsdWU7XG4gICAgICAgIGZvckVhY2hBbmNlc3RvckFuZE9ic2VydmVyRW5xdWV1ZVJlY29yZCh0YXJnZXQsIGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgICBpZiAoIW9wdGlvbnMuYXR0cmlidXRlcykgcmV0dXJuO1xuICAgICAgICAgIGlmIChvcHRpb25zLmF0dHJpYnV0ZUZpbHRlciAmJiBvcHRpb25zLmF0dHJpYnV0ZUZpbHRlci5sZW5ndGggJiYgb3B0aW9ucy5hdHRyaWJ1dGVGaWx0ZXIuaW5kZXhPZihuYW1lKSA9PT0gLTEgJiYgb3B0aW9ucy5hdHRyaWJ1dGVGaWx0ZXIuaW5kZXhPZihuYW1lc3BhY2UpID09PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVPbGRWYWx1ZSkgcmV0dXJuIGdldFJlY29yZFdpdGhPbGRWYWx1ZShvbGRWYWx1ZSk7XG4gICAgICAgICAgcmV0dXJuIHJlY29yZDtcbiAgICAgICAgfSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAgY2FzZSBcIkRPTUNoYXJhY3RlckRhdGFNb2RpZmllZFwiOlxuICAgICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgIHZhciByZWNvcmQgPSBnZXRSZWNvcmQoXCJjaGFyYWN0ZXJEYXRhXCIsIHRhcmdldCk7XG4gICAgICAgIHZhciBvbGRWYWx1ZSA9IGUucHJldlZhbHVlO1xuICAgICAgICBmb3JFYWNoQW5jZXN0b3JBbmRPYnNlcnZlckVucXVldWVSZWNvcmQodGFyZ2V0LCBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgICAgaWYgKCFvcHRpb25zLmNoYXJhY3RlckRhdGEpIHJldHVybjtcbiAgICAgICAgICBpZiAob3B0aW9ucy5jaGFyYWN0ZXJEYXRhT2xkVmFsdWUpIHJldHVybiBnZXRSZWNvcmRXaXRoT2xkVmFsdWUob2xkVmFsdWUpO1xuICAgICAgICAgIHJldHVybiByZWNvcmQ7XG4gICAgICAgIH0pO1xuICAgICAgICBicmVhaztcblxuICAgICAgIGNhc2UgXCJET01Ob2RlUmVtb3ZlZFwiOlxuICAgICAgICB0aGlzLmFkZFRyYW5zaWVudE9ic2VydmVyKGUudGFyZ2V0KTtcblxuICAgICAgIGNhc2UgXCJET01Ob2RlSW5zZXJ0ZWRcIjpcbiAgICAgICAgdmFyIGNoYW5nZWROb2RlID0gZS50YXJnZXQ7XG4gICAgICAgIHZhciBhZGRlZE5vZGVzLCByZW1vdmVkTm9kZXM7XG4gICAgICAgIGlmIChlLnR5cGUgPT09IFwiRE9NTm9kZUluc2VydGVkXCIpIHtcbiAgICAgICAgICBhZGRlZE5vZGVzID0gWyBjaGFuZ2VkTm9kZSBdO1xuICAgICAgICAgIHJlbW92ZWROb2RlcyA9IFtdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFkZGVkTm9kZXMgPSBbXTtcbiAgICAgICAgICByZW1vdmVkTm9kZXMgPSBbIGNoYW5nZWROb2RlIF07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHByZXZpb3VzU2libGluZyA9IGNoYW5nZWROb2RlLnByZXZpb3VzU2libGluZztcbiAgICAgICAgdmFyIG5leHRTaWJsaW5nID0gY2hhbmdlZE5vZGUubmV4dFNpYmxpbmc7XG4gICAgICAgIHZhciByZWNvcmQgPSBnZXRSZWNvcmQoXCJjaGlsZExpc3RcIiwgZS50YXJnZXQucGFyZW50Tm9kZSk7XG4gICAgICAgIHJlY29yZC5hZGRlZE5vZGVzID0gYWRkZWROb2RlcztcbiAgICAgICAgcmVjb3JkLnJlbW92ZWROb2RlcyA9IHJlbW92ZWROb2RlcztcbiAgICAgICAgcmVjb3JkLnByZXZpb3VzU2libGluZyA9IHByZXZpb3VzU2libGluZztcbiAgICAgICAgcmVjb3JkLm5leHRTaWJsaW5nID0gbmV4dFNpYmxpbmc7XG4gICAgICAgIGZvckVhY2hBbmNlc3RvckFuZE9ic2VydmVyRW5xdWV1ZVJlY29yZChlLnJlbGF0ZWROb2RlLCBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgICAgaWYgKCFvcHRpb25zLmNoaWxkTGlzdCkgcmV0dXJuO1xuICAgICAgICAgIHJldHVybiByZWNvcmQ7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgY2xlYXJSZWNvcmRzKCk7XG4gICAgfVxuICB9O1xuICBnbG9iYWwuSnNNdXRhdGlvbk9ic2VydmVyID0gSnNNdXRhdGlvbk9ic2VydmVyO1xuICBpZiAoIWdsb2JhbC5NdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgZ2xvYmFsLk11dGF0aW9uT2JzZXJ2ZXIgPSBKc011dGF0aW9uT2JzZXJ2ZXI7XG4gICAgSnNNdXRhdGlvbk9ic2VydmVyLl9pc1BvbHlmaWxsZWQgPSB0cnVlO1xuICB9XG59KShzZWxmKTtcblxuKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICBpZiAoIXdpbmRvdy5wZXJmb3JtYW5jZSkge1xuICAgIHZhciBzdGFydCA9IERhdGUubm93KCk7XG4gICAgd2luZG93LnBlcmZvcm1hbmNlID0ge1xuICAgICAgbm93OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIERhdGUubm93KCkgLSBzdGFydDtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIGlmICghd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSkge1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBuYXRpdmVSYWYgPSB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG4gICAgICByZXR1cm4gbmF0aXZlUmFmID8gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIG5hdGl2ZVJhZihmdW5jdGlvbigpIHtcbiAgICAgICAgICBjYWxsYmFjayhwZXJmb3JtYW5jZS5ub3coKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSA6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3cuc2V0VGltZW91dChjYWxsYmFjaywgMWUzIC8gNjApO1xuICAgICAgfTtcbiAgICB9KCk7XG4gIH1cbiAgaWYgKCF3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUpIHtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB3aW5kb3cud2Via2l0Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1vekNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChpZCk7XG4gICAgICB9O1xuICAgIH0oKTtcbiAgfVxuICB2YXIgd29ya2luZ0RlZmF1bHRQcmV2ZW50ZWQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiRXZlbnRcIik7XG4gICAgZS5pbml0RXZlbnQoXCJmb29cIiwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHJldHVybiBlLmRlZmF1bHRQcmV2ZW50ZWQ7XG4gIH0oKTtcbiAgaWYgKCF3b3JraW5nRGVmYXVsdFByZXZlbnRlZCkge1xuICAgIHZhciBvcmlnUHJldmVudERlZmF1bHQgPSBFdmVudC5wcm90b3R5cGUucHJldmVudERlZmF1bHQ7XG4gICAgRXZlbnQucHJvdG90eXBlLnByZXZlbnREZWZhdWx0ID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXRoaXMuY2FuY2VsYWJsZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBvcmlnUHJldmVudERlZmF1bHQuY2FsbCh0aGlzKTtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImRlZmF1bHRQcmV2ZW50ZWRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cbiAgdmFyIGlzSUUgPSAvVHJpZGVudC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbiAgaWYgKCF3aW5kb3cuQ3VzdG9tRXZlbnQgfHwgaXNJRSAmJiB0eXBlb2Ygd2luZG93LkN1c3RvbUV2ZW50ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB3aW5kb3cuQ3VzdG9tRXZlbnQgPSBmdW5jdGlvbihpblR5cGUsIHBhcmFtcykge1xuICAgICAgcGFyYW1zID0gcGFyYW1zIHx8IHt9O1xuICAgICAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkN1c3RvbUV2ZW50XCIpO1xuICAgICAgZS5pbml0Q3VzdG9tRXZlbnQoaW5UeXBlLCBCb29sZWFuKHBhcmFtcy5idWJibGVzKSwgQm9vbGVhbihwYXJhbXMuY2FuY2VsYWJsZSksIHBhcmFtcy5kZXRhaWwpO1xuICAgICAgcmV0dXJuIGU7XG4gICAgfTtcbiAgICB3aW5kb3cuQ3VzdG9tRXZlbnQucHJvdG90eXBlID0gd2luZG93LkV2ZW50LnByb3RvdHlwZTtcbiAgfVxuICBpZiAoIXdpbmRvdy5FdmVudCB8fCBpc0lFICYmIHR5cGVvZiB3aW5kb3cuRXZlbnQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgIHZhciBvcmlnRXZlbnQgPSB3aW5kb3cuRXZlbnQ7XG4gICAgd2luZG93LkV2ZW50ID0gZnVuY3Rpb24oaW5UeXBlLCBwYXJhbXMpIHtcbiAgICAgIHBhcmFtcyA9IHBhcmFtcyB8fCB7fTtcbiAgICAgIHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJFdmVudFwiKTtcbiAgICAgIGUuaW5pdEV2ZW50KGluVHlwZSwgQm9vbGVhbihwYXJhbXMuYnViYmxlcyksIEJvb2xlYW4ocGFyYW1zLmNhbmNlbGFibGUpKTtcbiAgICAgIHJldHVybiBlO1xuICAgIH07XG4gICAgd2luZG93LkV2ZW50LnByb3RvdHlwZSA9IG9yaWdFdmVudC5wcm90b3R5cGU7XG4gIH1cbn0pKHdpbmRvdy5XZWJDb21wb25lbnRzKTtcblxud2luZG93LkN1c3RvbUVsZW1lbnRzID0gd2luZG93LkN1c3RvbUVsZW1lbnRzIHx8IHtcbiAgZmxhZ3M6IHt9XG59O1xuXG4oZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIGZsYWdzID0gc2NvcGUuZmxhZ3M7XG4gIHZhciBtb2R1bGVzID0gW107XG4gIHZhciBhZGRNb2R1bGUgPSBmdW5jdGlvbihtb2R1bGUpIHtcbiAgICBtb2R1bGVzLnB1c2gobW9kdWxlKTtcbiAgfTtcbiAgdmFyIGluaXRpYWxpemVNb2R1bGVzID0gZnVuY3Rpb24oKSB7XG4gICAgbW9kdWxlcy5mb3JFYWNoKGZ1bmN0aW9uKG1vZHVsZSkge1xuICAgICAgbW9kdWxlKHNjb3BlKTtcbiAgICB9KTtcbiAgfTtcbiAgc2NvcGUuYWRkTW9kdWxlID0gYWRkTW9kdWxlO1xuICBzY29wZS5pbml0aWFsaXplTW9kdWxlcyA9IGluaXRpYWxpemVNb2R1bGVzO1xuICBzY29wZS5oYXNOYXRpdmUgPSBCb29sZWFuKGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCk7XG4gIHNjb3BlLmlzSUUgPSAvVHJpZGVudC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbiAgc2NvcGUudXNlTmF0aXZlID0gIWZsYWdzLnJlZ2lzdGVyICYmIHNjb3BlLmhhc05hdGl2ZSAmJiAhd2luZG93LlNoYWRvd0RPTVBvbHlmaWxsICYmICghd2luZG93LkhUTUxJbXBvcnRzIHx8IHdpbmRvdy5IVE1MSW1wb3J0cy51c2VOYXRpdmUpO1xufSkod2luZG93LkN1c3RvbUVsZW1lbnRzKTtcblxud2luZG93LkN1c3RvbUVsZW1lbnRzLmFkZE1vZHVsZShmdW5jdGlvbihzY29wZSkge1xuICB2YXIgSU1QT1JUX0xJTktfVFlQRSA9IHdpbmRvdy5IVE1MSW1wb3J0cyA/IHdpbmRvdy5IVE1MSW1wb3J0cy5JTVBPUlRfTElOS19UWVBFIDogXCJub25lXCI7XG4gIGZ1bmN0aW9uIGZvclN1YnRyZWUobm9kZSwgY2IpIHtcbiAgICBmaW5kQWxsRWxlbWVudHMobm9kZSwgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKGNiKGUpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgZm9yUm9vdHMoZSwgY2IpO1xuICAgIH0pO1xuICAgIGZvclJvb3RzKG5vZGUsIGNiKTtcbiAgfVxuICBmdW5jdGlvbiBmaW5kQWxsRWxlbWVudHMobm9kZSwgZmluZCwgZGF0YSkge1xuICAgIHZhciBlID0gbm9kZS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICBpZiAoIWUpIHtcbiAgICAgIGUgPSBub2RlLmZpcnN0Q2hpbGQ7XG4gICAgICB3aGlsZSAoZSAmJiBlLm5vZGVUeXBlICE9PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICBlID0gZS5uZXh0U2libGluZztcbiAgICAgIH1cbiAgICB9XG4gICAgd2hpbGUgKGUpIHtcbiAgICAgIGlmIChmaW5kKGUsIGRhdGEpICE9PSB0cnVlKSB7XG4gICAgICAgIGZpbmRBbGxFbGVtZW50cyhlLCBmaW5kLCBkYXRhKTtcbiAgICAgIH1cbiAgICAgIGUgPSBlLm5leHRFbGVtZW50U2libGluZztcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgZnVuY3Rpb24gZm9yUm9vdHMobm9kZSwgY2IpIHtcbiAgICB2YXIgcm9vdCA9IG5vZGUuc2hhZG93Um9vdDtcbiAgICB3aGlsZSAocm9vdCkge1xuICAgICAgZm9yU3VidHJlZShyb290LCBjYik7XG4gICAgICByb290ID0gcm9vdC5vbGRlclNoYWRvd1Jvb3Q7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGZvckRvY3VtZW50VHJlZShkb2MsIGNiKSB7XG4gICAgX2ZvckRvY3VtZW50VHJlZShkb2MsIGNiLCBbXSk7XG4gIH1cbiAgZnVuY3Rpb24gX2ZvckRvY3VtZW50VHJlZShkb2MsIGNiLCBwcm9jZXNzaW5nRG9jdW1lbnRzKSB7XG4gICAgZG9jID0gd2luZG93LndyYXAoZG9jKTtcbiAgICBpZiAocHJvY2Vzc2luZ0RvY3VtZW50cy5pbmRleE9mKGRvYykgPj0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBwcm9jZXNzaW5nRG9jdW1lbnRzLnB1c2goZG9jKTtcbiAgICB2YXIgaW1wb3J0cyA9IGRvYy5xdWVyeVNlbGVjdG9yQWxsKFwibGlua1tyZWw9XCIgKyBJTVBPUlRfTElOS19UWVBFICsgXCJdXCIpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gaW1wb3J0cy5sZW5ndGgsIG47IGkgPCBsICYmIChuID0gaW1wb3J0c1tpXSk7IGkrKykge1xuICAgICAgaWYgKG4uaW1wb3J0KSB7XG4gICAgICAgIF9mb3JEb2N1bWVudFRyZWUobi5pbXBvcnQsIGNiLCBwcm9jZXNzaW5nRG9jdW1lbnRzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY2IoZG9jKTtcbiAgfVxuICBzY29wZS5mb3JEb2N1bWVudFRyZWUgPSBmb3JEb2N1bWVudFRyZWU7XG4gIHNjb3BlLmZvclN1YnRyZWUgPSBmb3JTdWJ0cmVlO1xufSk7XG5cbndpbmRvdy5DdXN0b21FbGVtZW50cy5hZGRNb2R1bGUoZnVuY3Rpb24oc2NvcGUpIHtcbiAgdmFyIGZsYWdzID0gc2NvcGUuZmxhZ3M7XG4gIHZhciBmb3JTdWJ0cmVlID0gc2NvcGUuZm9yU3VidHJlZTtcbiAgdmFyIGZvckRvY3VtZW50VHJlZSA9IHNjb3BlLmZvckRvY3VtZW50VHJlZTtcbiAgZnVuY3Rpb24gYWRkZWROb2RlKG5vZGUsIGlzQXR0YWNoZWQpIHtcbiAgICByZXR1cm4gYWRkZWQobm9kZSwgaXNBdHRhY2hlZCkgfHwgYWRkZWRTdWJ0cmVlKG5vZGUsIGlzQXR0YWNoZWQpO1xuICB9XG4gIGZ1bmN0aW9uIGFkZGVkKG5vZGUsIGlzQXR0YWNoZWQpIHtcbiAgICBpZiAoc2NvcGUudXBncmFkZShub2RlLCBpc0F0dGFjaGVkKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChpc0F0dGFjaGVkKSB7XG4gICAgICBhdHRhY2hlZChub2RlKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gYWRkZWRTdWJ0cmVlKG5vZGUsIGlzQXR0YWNoZWQpIHtcbiAgICBmb3JTdWJ0cmVlKG5vZGUsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChhZGRlZChlLCBpc0F0dGFjaGVkKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICB2YXIgaGFzVGhyb3R0bGVkQXR0YWNoZWQgPSB3aW5kb3cuTXV0YXRpb25PYnNlcnZlci5faXNQb2x5ZmlsbGVkICYmIGZsYWdzW1widGhyb3R0bGUtYXR0YWNoZWRcIl07XG4gIHNjb3BlLmhhc1BvbHlmaWxsTXV0YXRpb25zID0gaGFzVGhyb3R0bGVkQXR0YWNoZWQ7XG4gIHNjb3BlLmhhc1Rocm90dGxlZEF0dGFjaGVkID0gaGFzVGhyb3R0bGVkQXR0YWNoZWQ7XG4gIHZhciBpc1BlbmRpbmdNdXRhdGlvbnMgPSBmYWxzZTtcbiAgdmFyIHBlbmRpbmdNdXRhdGlvbnMgPSBbXTtcbiAgZnVuY3Rpb24gZGVmZXJNdXRhdGlvbihmbikge1xuICAgIHBlbmRpbmdNdXRhdGlvbnMucHVzaChmbik7XG4gICAgaWYgKCFpc1BlbmRpbmdNdXRhdGlvbnMpIHtcbiAgICAgIGlzUGVuZGluZ011dGF0aW9ucyA9IHRydWU7XG4gICAgICBzZXRUaW1lb3V0KHRha2VNdXRhdGlvbnMpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiB0YWtlTXV0YXRpb25zKCkge1xuICAgIGlzUGVuZGluZ011dGF0aW9ucyA9IGZhbHNlO1xuICAgIHZhciAkcCA9IHBlbmRpbmdNdXRhdGlvbnM7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSAkcC5sZW5ndGgsIHA7IGkgPCBsICYmIChwID0gJHBbaV0pOyBpKyspIHtcbiAgICAgIHAoKTtcbiAgICB9XG4gICAgcGVuZGluZ011dGF0aW9ucyA9IFtdO1xuICB9XG4gIGZ1bmN0aW9uIGF0dGFjaGVkKGVsZW1lbnQpIHtcbiAgICBpZiAoaGFzVGhyb3R0bGVkQXR0YWNoZWQpIHtcbiAgICAgIGRlZmVyTXV0YXRpb24oZnVuY3Rpb24oKSB7XG4gICAgICAgIF9hdHRhY2hlZChlbGVtZW50KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBfYXR0YWNoZWQoZWxlbWVudCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIF9hdHRhY2hlZChlbGVtZW50KSB7XG4gICAgaWYgKGVsZW1lbnQuX191cGdyYWRlZF9fICYmICFlbGVtZW50Ll9fYXR0YWNoZWQpIHtcbiAgICAgIGVsZW1lbnQuX19hdHRhY2hlZCA9IHRydWU7XG4gICAgICBpZiAoZWxlbWVudC5hdHRhY2hlZENhbGxiYWNrKSB7XG4gICAgICAgIGVsZW1lbnQuYXR0YWNoZWRDYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBkZXRhY2hlZE5vZGUobm9kZSkge1xuICAgIGRldGFjaGVkKG5vZGUpO1xuICAgIGZvclN1YnRyZWUobm9kZSwgZnVuY3Rpb24oZSkge1xuICAgICAgZGV0YWNoZWQoZSk7XG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gZGV0YWNoZWQoZWxlbWVudCkge1xuICAgIGlmIChoYXNUaHJvdHRsZWRBdHRhY2hlZCkge1xuICAgICAgZGVmZXJNdXRhdGlvbihmdW5jdGlvbigpIHtcbiAgICAgICAgX2RldGFjaGVkKGVsZW1lbnQpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIF9kZXRhY2hlZChlbGVtZW50KTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gX2RldGFjaGVkKGVsZW1lbnQpIHtcbiAgICBpZiAoZWxlbWVudC5fX3VwZ3JhZGVkX18gJiYgZWxlbWVudC5fX2F0dGFjaGVkKSB7XG4gICAgICBlbGVtZW50Ll9fYXR0YWNoZWQgPSBmYWxzZTtcbiAgICAgIGlmIChlbGVtZW50LmRldGFjaGVkQ2FsbGJhY2spIHtcbiAgICAgICAgZWxlbWVudC5kZXRhY2hlZENhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGluRG9jdW1lbnQoZWxlbWVudCkge1xuICAgIHZhciBwID0gZWxlbWVudDtcbiAgICB2YXIgZG9jID0gd2luZG93LndyYXAoZG9jdW1lbnQpO1xuICAgIHdoaWxlIChwKSB7XG4gICAgICBpZiAocCA9PSBkb2MpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBwID0gcC5wYXJlbnROb2RlIHx8IHAubm9kZVR5cGUgPT09IE5vZGUuRE9DVU1FTlRfRlJBR01FTlRfTk9ERSAmJiBwLmhvc3Q7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHdhdGNoU2hhZG93KG5vZGUpIHtcbiAgICBpZiAobm9kZS5zaGFkb3dSb290ICYmICFub2RlLnNoYWRvd1Jvb3QuX193YXRjaGVkKSB7XG4gICAgICBmbGFncy5kb20gJiYgY29uc29sZS5sb2coXCJ3YXRjaGluZyBzaGFkb3ctcm9vdCBmb3I6IFwiLCBub2RlLmxvY2FsTmFtZSk7XG4gICAgICB2YXIgcm9vdCA9IG5vZGUuc2hhZG93Um9vdDtcbiAgICAgIHdoaWxlIChyb290KSB7XG4gICAgICAgIG9ic2VydmUocm9vdCk7XG4gICAgICAgIHJvb3QgPSByb290Lm9sZGVyU2hhZG93Um9vdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gaGFuZGxlcihyb290LCBtdXRhdGlvbnMpIHtcbiAgICBpZiAoZmxhZ3MuZG9tKSB7XG4gICAgICB2YXIgbXggPSBtdXRhdGlvbnNbMF07XG4gICAgICBpZiAobXggJiYgbXgudHlwZSA9PT0gXCJjaGlsZExpc3RcIiAmJiBteC5hZGRlZE5vZGVzKSB7XG4gICAgICAgIGlmIChteC5hZGRlZE5vZGVzKSB7XG4gICAgICAgICAgdmFyIGQgPSBteC5hZGRlZE5vZGVzWzBdO1xuICAgICAgICAgIHdoaWxlIChkICYmIGQgIT09IGRvY3VtZW50ICYmICFkLmhvc3QpIHtcbiAgICAgICAgICAgIGQgPSBkLnBhcmVudE5vZGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciB1ID0gZCAmJiAoZC5VUkwgfHwgZC5fVVJMIHx8IGQuaG9zdCAmJiBkLmhvc3QubG9jYWxOYW1lKSB8fCBcIlwiO1xuICAgICAgICAgIHUgPSB1LnNwbGl0KFwiLz9cIikuc2hpZnQoKS5zcGxpdChcIi9cIikucG9wKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnNvbGUuZ3JvdXAoXCJtdXRhdGlvbnMgKCVkKSBbJXNdXCIsIG11dGF0aW9ucy5sZW5ndGgsIHUgfHwgXCJcIik7XG4gICAgfVxuICAgIHZhciBpc0F0dGFjaGVkID0gaW5Eb2N1bWVudChyb290KTtcbiAgICBtdXRhdGlvbnMuZm9yRWFjaChmdW5jdGlvbihteCkge1xuICAgICAgaWYgKG14LnR5cGUgPT09IFwiY2hpbGRMaXN0XCIpIHtcbiAgICAgICAgZm9yRWFjaChteC5hZGRlZE5vZGVzLCBmdW5jdGlvbihuKSB7XG4gICAgICAgICAgaWYgKCFuLmxvY2FsTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhZGRlZE5vZGUobiwgaXNBdHRhY2hlZCk7XG4gICAgICAgIH0pO1xuICAgICAgICBmb3JFYWNoKG14LnJlbW92ZWROb2RlcywgZnVuY3Rpb24obikge1xuICAgICAgICAgIGlmICghbi5sb2NhbE5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGV0YWNoZWROb2RlKG4pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBmbGFncy5kb20gJiYgY29uc29sZS5ncm91cEVuZCgpO1xuICB9XG4gIGZ1bmN0aW9uIHRha2VSZWNvcmRzKG5vZGUpIHtcbiAgICBub2RlID0gd2luZG93LndyYXAobm9kZSk7XG4gICAgaWYgKCFub2RlKSB7XG4gICAgICBub2RlID0gd2luZG93LndyYXAoZG9jdW1lbnQpO1xuICAgIH1cbiAgICB3aGlsZSAobm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgIH1cbiAgICB2YXIgb2JzZXJ2ZXIgPSBub2RlLl9fb2JzZXJ2ZXI7XG4gICAgaWYgKG9ic2VydmVyKSB7XG4gICAgICBoYW5kbGVyKG5vZGUsIG9ic2VydmVyLnRha2VSZWNvcmRzKCkpO1xuICAgICAgdGFrZU11dGF0aW9ucygpO1xuICAgIH1cbiAgfVxuICB2YXIgZm9yRWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwuYmluZChBcnJheS5wcm90b3R5cGUuZm9yRWFjaCk7XG4gIGZ1bmN0aW9uIG9ic2VydmUoaW5Sb290KSB7XG4gICAgaWYgKGluUm9vdC5fX29ic2VydmVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGhhbmRsZXIuYmluZCh0aGlzLCBpblJvb3QpKTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKGluUm9vdCwge1xuICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgc3VidHJlZTogdHJ1ZVxuICAgIH0pO1xuICAgIGluUm9vdC5fX29ic2VydmVyID0gb2JzZXJ2ZXI7XG4gIH1cbiAgZnVuY3Rpb24gdXBncmFkZURvY3VtZW50KGRvYykge1xuICAgIGRvYyA9IHdpbmRvdy53cmFwKGRvYyk7XG4gICAgZmxhZ3MuZG9tICYmIGNvbnNvbGUuZ3JvdXAoXCJ1cGdyYWRlRG9jdW1lbnQ6IFwiLCBkb2MuYmFzZVVSSS5zcGxpdChcIi9cIikucG9wKCkpO1xuICAgIHZhciBpc01haW5Eb2N1bWVudCA9IGRvYyA9PT0gd2luZG93LndyYXAoZG9jdW1lbnQpO1xuICAgIGFkZGVkTm9kZShkb2MsIGlzTWFpbkRvY3VtZW50KTtcbiAgICBvYnNlcnZlKGRvYyk7XG4gICAgZmxhZ3MuZG9tICYmIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgfVxuICBmdW5jdGlvbiB1cGdyYWRlRG9jdW1lbnRUcmVlKGRvYykge1xuICAgIGZvckRvY3VtZW50VHJlZShkb2MsIHVwZ3JhZGVEb2N1bWVudCk7XG4gIH1cbiAgdmFyIG9yaWdpbmFsQ3JlYXRlU2hhZG93Um9vdCA9IEVsZW1lbnQucHJvdG90eXBlLmNyZWF0ZVNoYWRvd1Jvb3Q7XG4gIGlmIChvcmlnaW5hbENyZWF0ZVNoYWRvd1Jvb3QpIHtcbiAgICBFbGVtZW50LnByb3RvdHlwZS5jcmVhdGVTaGFkb3dSb290ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcm9vdCA9IG9yaWdpbmFsQ3JlYXRlU2hhZG93Um9vdC5jYWxsKHRoaXMpO1xuICAgICAgd2luZG93LkN1c3RvbUVsZW1lbnRzLndhdGNoU2hhZG93KHRoaXMpO1xuICAgICAgcmV0dXJuIHJvb3Q7XG4gICAgfTtcbiAgfVxuICBzY29wZS53YXRjaFNoYWRvdyA9IHdhdGNoU2hhZG93O1xuICBzY29wZS51cGdyYWRlRG9jdW1lbnRUcmVlID0gdXBncmFkZURvY3VtZW50VHJlZTtcbiAgc2NvcGUudXBncmFkZURvY3VtZW50ID0gdXBncmFkZURvY3VtZW50O1xuICBzY29wZS51cGdyYWRlU3VidHJlZSA9IGFkZGVkU3VidHJlZTtcbiAgc2NvcGUudXBncmFkZUFsbCA9IGFkZGVkTm9kZTtcbiAgc2NvcGUuYXR0YWNoZWQgPSBhdHRhY2hlZDtcbiAgc2NvcGUudGFrZVJlY29yZHMgPSB0YWtlUmVjb3Jkcztcbn0pO1xuXG53aW5kb3cuQ3VzdG9tRWxlbWVudHMuYWRkTW9kdWxlKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBmbGFncyA9IHNjb3BlLmZsYWdzO1xuICBmdW5jdGlvbiB1cGdyYWRlKG5vZGUsIGlzQXR0YWNoZWQpIHtcbiAgICBpZiAobm9kZS5sb2NhbE5hbWUgPT09IFwidGVtcGxhdGVcIikge1xuICAgICAgaWYgKHdpbmRvdy5IVE1MVGVtcGxhdGVFbGVtZW50ICYmIEhUTUxUZW1wbGF0ZUVsZW1lbnQuZGVjb3JhdGUpIHtcbiAgICAgICAgSFRNTFRlbXBsYXRlRWxlbWVudC5kZWNvcmF0ZShub2RlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFub2RlLl9fdXBncmFkZWRfXyAmJiBub2RlLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgdmFyIGlzID0gbm9kZS5nZXRBdHRyaWJ1dGUoXCJpc1wiKTtcbiAgICAgIHZhciBkZWZpbml0aW9uID0gc2NvcGUuZ2V0UmVnaXN0ZXJlZERlZmluaXRpb24obm9kZS5sb2NhbE5hbWUpIHx8IHNjb3BlLmdldFJlZ2lzdGVyZWREZWZpbml0aW9uKGlzKTtcbiAgICAgIGlmIChkZWZpbml0aW9uKSB7XG4gICAgICAgIGlmIChpcyAmJiBkZWZpbml0aW9uLnRhZyA9PSBub2RlLmxvY2FsTmFtZSB8fCAhaXMgJiYgIWRlZmluaXRpb24uZXh0ZW5kcykge1xuICAgICAgICAgIHJldHVybiB1cGdyYWRlV2l0aERlZmluaXRpb24obm9kZSwgZGVmaW5pdGlvbiwgaXNBdHRhY2hlZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gdXBncmFkZVdpdGhEZWZpbml0aW9uKGVsZW1lbnQsIGRlZmluaXRpb24sIGlzQXR0YWNoZWQpIHtcbiAgICBmbGFncy51cGdyYWRlICYmIGNvbnNvbGUuZ3JvdXAoXCJ1cGdyYWRlOlwiLCBlbGVtZW50LmxvY2FsTmFtZSk7XG4gICAgaWYgKGRlZmluaXRpb24uaXMpIHtcbiAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaXNcIiwgZGVmaW5pdGlvbi5pcyk7XG4gICAgfVxuICAgIGltcGxlbWVudFByb3RvdHlwZShlbGVtZW50LCBkZWZpbml0aW9uKTtcbiAgICBlbGVtZW50Ll9fdXBncmFkZWRfXyA9IHRydWU7XG4gICAgY3JlYXRlZChlbGVtZW50KTtcbiAgICBpZiAoaXNBdHRhY2hlZCkge1xuICAgICAgc2NvcGUuYXR0YWNoZWQoZWxlbWVudCk7XG4gICAgfVxuICAgIHNjb3BlLnVwZ3JhZGVTdWJ0cmVlKGVsZW1lbnQsIGlzQXR0YWNoZWQpO1xuICAgIGZsYWdzLnVwZ3JhZGUgJiYgY29uc29sZS5ncm91cEVuZCgpO1xuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG4gIGZ1bmN0aW9uIGltcGxlbWVudFByb3RvdHlwZShlbGVtZW50LCBkZWZpbml0aW9uKSB7XG4gICAgaWYgKE9iamVjdC5fX3Byb3RvX18pIHtcbiAgICAgIGVsZW1lbnQuX19wcm90b19fID0gZGVmaW5pdGlvbi5wcm90b3R5cGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGN1c3RvbU1peGluKGVsZW1lbnQsIGRlZmluaXRpb24ucHJvdG90eXBlLCBkZWZpbml0aW9uLm5hdGl2ZSk7XG4gICAgICBlbGVtZW50Ll9fcHJvdG9fXyA9IGRlZmluaXRpb24ucHJvdG90eXBlO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBjdXN0b21NaXhpbihpblRhcmdldCwgaW5TcmMsIGluTmF0aXZlKSB7XG4gICAgdmFyIHVzZWQgPSB7fTtcbiAgICB2YXIgcCA9IGluU3JjO1xuICAgIHdoaWxlIChwICE9PSBpbk5hdGl2ZSAmJiBwICE9PSBIVE1MRWxlbWVudC5wcm90b3R5cGUpIHtcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocCk7XG4gICAgICBmb3IgKHZhciBpID0gMCwgazsgayA9IGtleXNbaV07IGkrKykge1xuICAgICAgICBpZiAoIXVzZWRba10pIHtcbiAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoaW5UYXJnZXQsIGssIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocCwgaykpO1xuICAgICAgICAgIHVzZWRba10gPSAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHApO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBjcmVhdGVkKGVsZW1lbnQpIHtcbiAgICBpZiAoZWxlbWVudC5jcmVhdGVkQ2FsbGJhY2spIHtcbiAgICAgIGVsZW1lbnQuY3JlYXRlZENhbGxiYWNrKCk7XG4gICAgfVxuICB9XG4gIHNjb3BlLnVwZ3JhZGUgPSB1cGdyYWRlO1xuICBzY29wZS51cGdyYWRlV2l0aERlZmluaXRpb24gPSB1cGdyYWRlV2l0aERlZmluaXRpb247XG4gIHNjb3BlLmltcGxlbWVudFByb3RvdHlwZSA9IGltcGxlbWVudFByb3RvdHlwZTtcbn0pO1xuXG53aW5kb3cuQ3VzdG9tRWxlbWVudHMuYWRkTW9kdWxlKGZ1bmN0aW9uKHNjb3BlKSB7XG4gIHZhciBpc0lFID0gc2NvcGUuaXNJRTtcbiAgdmFyIHVwZ3JhZGVEb2N1bWVudFRyZWUgPSBzY29wZS51cGdyYWRlRG9jdW1lbnRUcmVlO1xuICB2YXIgdXBncmFkZUFsbCA9IHNjb3BlLnVwZ3JhZGVBbGw7XG4gIHZhciB1cGdyYWRlV2l0aERlZmluaXRpb24gPSBzY29wZS51cGdyYWRlV2l0aERlZmluaXRpb247XG4gIHZhciBpbXBsZW1lbnRQcm90b3R5cGUgPSBzY29wZS5pbXBsZW1lbnRQcm90b3R5cGU7XG4gIHZhciB1c2VOYXRpdmUgPSBzY29wZS51c2VOYXRpdmU7XG4gIGZ1bmN0aW9uIHJlZ2lzdGVyKG5hbWUsIG9wdGlvbnMpIHtcbiAgICB2YXIgZGVmaW5pdGlvbiA9IG9wdGlvbnMgfHwge307XG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQ6IGZpcnN0IGFyZ3VtZW50IGBuYW1lYCBtdXN0IG5vdCBiZSBlbXB0eVwiKTtcbiAgICB9XG4gICAgaWYgKG5hbWUuaW5kZXhPZihcIi1cIikgPCAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQ6IGZpcnN0IGFyZ3VtZW50ICgnbmFtZScpIG11c3QgY29udGFpbiBhIGRhc2ggKCctJykuIEFyZ3VtZW50IHByb3ZpZGVkIHdhcyAnXCIgKyBTdHJpbmcobmFtZSkgKyBcIicuXCIpO1xuICAgIH1cbiAgICBpZiAoaXNSZXNlcnZlZFRhZyhuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGV4ZWN1dGUgJ3JlZ2lzdGVyRWxlbWVudCcgb24gJ0RvY3VtZW50JzogUmVnaXN0cmF0aW9uIGZhaWxlZCBmb3IgdHlwZSAnXCIgKyBTdHJpbmcobmFtZSkgKyBcIicuIFRoZSB0eXBlIG5hbWUgaXMgaW52YWxpZC5cIik7XG4gICAgfVxuICAgIGlmIChnZXRSZWdpc3RlcmVkRGVmaW5pdGlvbihuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRHVwbGljYXRlRGVmaW5pdGlvbkVycm9yOiBhIHR5cGUgd2l0aCBuYW1lICdcIiArIFN0cmluZyhuYW1lKSArIFwiJyBpcyBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIGlmICghZGVmaW5pdGlvbi5wcm90b3R5cGUpIHtcbiAgICAgIGRlZmluaXRpb24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuICAgIH1cbiAgICBkZWZpbml0aW9uLl9fbmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoZGVmaW5pdGlvbi5leHRlbmRzKSB7XG4gICAgICBkZWZpbml0aW9uLmV4dGVuZHMgPSBkZWZpbml0aW9uLmV4dGVuZHMudG9Mb3dlckNhc2UoKTtcbiAgICB9XG4gICAgZGVmaW5pdGlvbi5saWZlY3ljbGUgPSBkZWZpbml0aW9uLmxpZmVjeWNsZSB8fCB7fTtcbiAgICBkZWZpbml0aW9uLmFuY2VzdHJ5ID0gYW5jZXN0cnkoZGVmaW5pdGlvbi5leHRlbmRzKTtcbiAgICByZXNvbHZlVGFnTmFtZShkZWZpbml0aW9uKTtcbiAgICByZXNvbHZlUHJvdG90eXBlQ2hhaW4oZGVmaW5pdGlvbik7XG4gICAgb3ZlcnJpZGVBdHRyaWJ1dGVBcGkoZGVmaW5pdGlvbi5wcm90b3R5cGUpO1xuICAgIHJlZ2lzdGVyRGVmaW5pdGlvbihkZWZpbml0aW9uLl9fbmFtZSwgZGVmaW5pdGlvbik7XG4gICAgZGVmaW5pdGlvbi5jdG9yID0gZ2VuZXJhdGVDb25zdHJ1Y3RvcihkZWZpbml0aW9uKTtcbiAgICBkZWZpbml0aW9uLmN0b3IucHJvdG90eXBlID0gZGVmaW5pdGlvbi5wcm90b3R5cGU7XG4gICAgZGVmaW5pdGlvbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBkZWZpbml0aW9uLmN0b3I7XG4gICAgaWYgKHNjb3BlLnJlYWR5KSB7XG4gICAgICB1cGdyYWRlRG9jdW1lbnRUcmVlKGRvY3VtZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmluaXRpb24uY3RvcjtcbiAgfVxuICBmdW5jdGlvbiBvdmVycmlkZUF0dHJpYnV0ZUFwaShwcm90b3R5cGUpIHtcbiAgICBpZiAocHJvdG90eXBlLnNldEF0dHJpYnV0ZS5fcG9seWZpbGxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgc2V0QXR0cmlidXRlID0gcHJvdG90eXBlLnNldEF0dHJpYnV0ZTtcbiAgICBwcm90b3R5cGUuc2V0QXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICAgIGNoYW5nZUF0dHJpYnV0ZS5jYWxsKHRoaXMsIG5hbWUsIHZhbHVlLCBzZXRBdHRyaWJ1dGUpO1xuICAgIH07XG4gICAgdmFyIHJlbW92ZUF0dHJpYnV0ZSA9IHByb3RvdHlwZS5yZW1vdmVBdHRyaWJ1dGU7XG4gICAgcHJvdG90eXBlLnJlbW92ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGNoYW5nZUF0dHJpYnV0ZS5jYWxsKHRoaXMsIG5hbWUsIG51bGwsIHJlbW92ZUF0dHJpYnV0ZSk7XG4gICAgfTtcbiAgICBwcm90b3R5cGUuc2V0QXR0cmlidXRlLl9wb2x5ZmlsbGVkID0gdHJ1ZTtcbiAgfVxuICBmdW5jdGlvbiBjaGFuZ2VBdHRyaWJ1dGUobmFtZSwgdmFsdWUsIG9wZXJhdGlvbikge1xuICAgIG5hbWUgPSBuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyIG9sZFZhbHVlID0gdGhpcy5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgb3BlcmF0aW9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgdmFyIG5ld1ZhbHVlID0gdGhpcy5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgaWYgKHRoaXMuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrICYmIG5ld1ZhbHVlICE9PSBvbGRWYWx1ZSkge1xuICAgICAgdGhpcy5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gaXNSZXNlcnZlZFRhZyhuYW1lKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXNlcnZlZFRhZ0xpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChuYW1lID09PSByZXNlcnZlZFRhZ0xpc3RbaV0pIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHZhciByZXNlcnZlZFRhZ0xpc3QgPSBbIFwiYW5ub3RhdGlvbi14bWxcIiwgXCJjb2xvci1wcm9maWxlXCIsIFwiZm9udC1mYWNlXCIsIFwiZm9udC1mYWNlLXNyY1wiLCBcImZvbnQtZmFjZS11cmlcIiwgXCJmb250LWZhY2UtZm9ybWF0XCIsIFwiZm9udC1mYWNlLW5hbWVcIiwgXCJtaXNzaW5nLWdseXBoXCIgXTtcbiAgZnVuY3Rpb24gYW5jZXN0cnkoZXh0bmRzKSB7XG4gICAgdmFyIGV4dGVuZGVlID0gZ2V0UmVnaXN0ZXJlZERlZmluaXRpb24oZXh0bmRzKTtcbiAgICBpZiAoZXh0ZW5kZWUpIHtcbiAgICAgIHJldHVybiBhbmNlc3RyeShleHRlbmRlZS5leHRlbmRzKS5jb25jYXQoWyBleHRlbmRlZSBdKTtcbiAgICB9XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIGZ1bmN0aW9uIHJlc29sdmVUYWdOYW1lKGRlZmluaXRpb24pIHtcbiAgICB2YXIgYmFzZVRhZyA9IGRlZmluaXRpb24uZXh0ZW5kcztcbiAgICBmb3IgKHZhciBpID0gMCwgYTsgYSA9IGRlZmluaXRpb24uYW5jZXN0cnlbaV07IGkrKykge1xuICAgICAgYmFzZVRhZyA9IGEuaXMgJiYgYS50YWc7XG4gICAgfVxuICAgIGRlZmluaXRpb24udGFnID0gYmFzZVRhZyB8fCBkZWZpbml0aW9uLl9fbmFtZTtcbiAgICBpZiAoYmFzZVRhZykge1xuICAgICAgZGVmaW5pdGlvbi5pcyA9IGRlZmluaXRpb24uX19uYW1lO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiByZXNvbHZlUHJvdG90eXBlQ2hhaW4oZGVmaW5pdGlvbikge1xuICAgIGlmICghT2JqZWN0Ll9fcHJvdG9fXykge1xuICAgICAgdmFyIG5hdGl2ZVByb3RvdHlwZSA9IEhUTUxFbGVtZW50LnByb3RvdHlwZTtcbiAgICAgIGlmIChkZWZpbml0aW9uLmlzKSB7XG4gICAgICAgIHZhciBpbnN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChkZWZpbml0aW9uLnRhZyk7XG4gICAgICAgIG5hdGl2ZVByb3RvdHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihpbnN0KTtcbiAgICAgIH1cbiAgICAgIHZhciBwcm90byA9IGRlZmluaXRpb24ucHJvdG90eXBlLCBhbmNlc3RvcjtcbiAgICAgIHZhciBmb3VuZFByb3RvdHlwZSA9IGZhbHNlO1xuICAgICAgd2hpbGUgKHByb3RvKSB7XG4gICAgICAgIGlmIChwcm90byA9PSBuYXRpdmVQcm90b3R5cGUpIHtcbiAgICAgICAgICBmb3VuZFByb3RvdHlwZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgYW5jZXN0b3IgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YocHJvdG8pO1xuICAgICAgICBpZiAoYW5jZXN0b3IpIHtcbiAgICAgICAgICBwcm90by5fX3Byb3RvX18gPSBhbmNlc3RvcjtcbiAgICAgICAgfVxuICAgICAgICBwcm90byA9IGFuY2VzdG9yO1xuICAgICAgfVxuICAgICAgaWYgKCFmb3VuZFByb3RvdHlwZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oZGVmaW5pdGlvbi50YWcgKyBcIiBwcm90b3R5cGUgbm90IGZvdW5kIGluIHByb3RvdHlwZSBjaGFpbiBmb3IgXCIgKyBkZWZpbml0aW9uLmlzKTtcbiAgICAgIH1cbiAgICAgIGRlZmluaXRpb24ubmF0aXZlID0gbmF0aXZlUHJvdG90eXBlO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBpbnN0YW50aWF0ZShkZWZpbml0aW9uKSB7XG4gICAgcmV0dXJuIHVwZ3JhZGVXaXRoRGVmaW5pdGlvbihkb21DcmVhdGVFbGVtZW50KGRlZmluaXRpb24udGFnKSwgZGVmaW5pdGlvbik7XG4gIH1cbiAgdmFyIHJlZ2lzdHJ5ID0ge307XG4gIGZ1bmN0aW9uIGdldFJlZ2lzdGVyZWREZWZpbml0aW9uKG5hbWUpIHtcbiAgICBpZiAobmFtZSkge1xuICAgICAgcmV0dXJuIHJlZ2lzdHJ5W25hbWUudG9Mb3dlckNhc2UoKV07XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHJlZ2lzdGVyRGVmaW5pdGlvbihuYW1lLCBkZWZpbml0aW9uKSB7XG4gICAgcmVnaXN0cnlbbmFtZV0gPSBkZWZpbml0aW9uO1xuICB9XG4gIGZ1bmN0aW9uIGdlbmVyYXRlQ29uc3RydWN0b3IoZGVmaW5pdGlvbikge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBpbnN0YW50aWF0ZShkZWZpbml0aW9uKTtcbiAgICB9O1xuICB9XG4gIHZhciBIVE1MX05BTUVTUEFDRSA9IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbFwiO1xuICBmdW5jdGlvbiBjcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCB0YWcsIHR5cGVFeHRlbnNpb24pIHtcbiAgICBpZiAobmFtZXNwYWNlID09PSBIVE1MX05BTUVTUEFDRSkge1xuICAgICAgcmV0dXJuIGNyZWF0ZUVsZW1lbnQodGFnLCB0eXBlRXh0ZW5zaW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGRvbUNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2UsIHRhZyk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQodGFnLCB0eXBlRXh0ZW5zaW9uKSB7XG4gICAgaWYgKHRhZykge1xuICAgICAgdGFnID0gdGFnLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuICAgIGlmICh0eXBlRXh0ZW5zaW9uKSB7XG4gICAgICB0eXBlRXh0ZW5zaW9uID0gdHlwZUV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpO1xuICAgIH1cbiAgICB2YXIgZGVmaW5pdGlvbiA9IGdldFJlZ2lzdGVyZWREZWZpbml0aW9uKHR5cGVFeHRlbnNpb24gfHwgdGFnKTtcbiAgICBpZiAoZGVmaW5pdGlvbikge1xuICAgICAgaWYgKHRhZyA9PSBkZWZpbml0aW9uLnRhZyAmJiB0eXBlRXh0ZW5zaW9uID09IGRlZmluaXRpb24uaXMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBkZWZpbml0aW9uLmN0b3IoKTtcbiAgICAgIH1cbiAgICAgIGlmICghdHlwZUV4dGVuc2lvbiAmJiAhZGVmaW5pdGlvbi5pcykge1xuICAgICAgICByZXR1cm4gbmV3IGRlZmluaXRpb24uY3RvcigpO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgZWxlbWVudDtcbiAgICBpZiAodHlwZUV4dGVuc2lvbikge1xuICAgICAgZWxlbWVudCA9IGNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaXNcIiwgdHlwZUV4dGVuc2lvbik7XG4gICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG4gICAgZWxlbWVudCA9IGRvbUNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgICBpZiAodGFnLmluZGV4T2YoXCItXCIpID49IDApIHtcbiAgICAgIGltcGxlbWVudFByb3RvdHlwZShlbGVtZW50LCBIVE1MRWxlbWVudCk7XG4gICAgfVxuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG4gIHZhciBkb21DcmVhdGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudC5iaW5kKGRvY3VtZW50KTtcbiAgdmFyIGRvbUNyZWF0ZUVsZW1lbnROUyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUy5iaW5kKGRvY3VtZW50KTtcbiAgdmFyIGlzSW5zdGFuY2U7XG4gIGlmICghT2JqZWN0Ll9fcHJvdG9fXyAmJiAhdXNlTmF0aXZlKSB7XG4gICAgaXNJbnN0YW5jZSA9IGZ1bmN0aW9uKG9iaiwgY3Rvcikge1xuICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIGN0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB2YXIgcCA9IG9iajtcbiAgICAgIHdoaWxlIChwKSB7XG4gICAgICAgIGlmIChwID09PSBjdG9yLnByb3RvdHlwZSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHAgPSBwLl9fcHJvdG9fXztcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIGlzSW5zdGFuY2UgPSBmdW5jdGlvbihvYmosIGJhc2UpIHtcbiAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBiYXNlO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gd3JhcERvbU1ldGhvZFRvRm9yY2VVcGdyYWRlKG9iaiwgbWV0aG9kTmFtZSkge1xuICAgIHZhciBvcmlnID0gb2JqW21ldGhvZE5hbWVdO1xuICAgIG9ialttZXRob2ROYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG4gPSBvcmlnLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB1cGdyYWRlQWxsKG4pO1xuICAgICAgcmV0dXJuIG47XG4gICAgfTtcbiAgfVxuICB3cmFwRG9tTWV0aG9kVG9Gb3JjZVVwZ3JhZGUoTm9kZS5wcm90b3R5cGUsIFwiY2xvbmVOb2RlXCIpO1xuICB3cmFwRG9tTWV0aG9kVG9Gb3JjZVVwZ3JhZGUoZG9jdW1lbnQsIFwiaW1wb3J0Tm9kZVwiKTtcbiAgZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50ID0gcmVnaXN0ZXI7XG4gIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgPSBjcmVhdGVFbGVtZW50O1xuICBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMgPSBjcmVhdGVFbGVtZW50TlM7XG4gIHNjb3BlLnJlZ2lzdHJ5ID0gcmVnaXN0cnk7XG4gIHNjb3BlLmluc3RhbmNlb2YgPSBpc0luc3RhbmNlO1xuICBzY29wZS5yZXNlcnZlZFRhZ0xpc3QgPSByZXNlcnZlZFRhZ0xpc3Q7XG4gIHNjb3BlLmdldFJlZ2lzdGVyZWREZWZpbml0aW9uID0gZ2V0UmVnaXN0ZXJlZERlZmluaXRpb247XG4gIGRvY3VtZW50LnJlZ2lzdGVyID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50O1xufSk7XG5cbihmdW5jdGlvbihzY29wZSkge1xuICB2YXIgdXNlTmF0aXZlID0gc2NvcGUudXNlTmF0aXZlO1xuICB2YXIgaW5pdGlhbGl6ZU1vZHVsZXMgPSBzY29wZS5pbml0aWFsaXplTW9kdWxlcztcbiAgdmFyIGlzSUUgPSBzY29wZS5pc0lFO1xuICBpZiAodXNlTmF0aXZlKSB7XG4gICAgdmFyIG5vcCA9IGZ1bmN0aW9uKCkge307XG4gICAgc2NvcGUud2F0Y2hTaGFkb3cgPSBub3A7XG4gICAgc2NvcGUudXBncmFkZSA9IG5vcDtcbiAgICBzY29wZS51cGdyYWRlQWxsID0gbm9wO1xuICAgIHNjb3BlLnVwZ3JhZGVEb2N1bWVudFRyZWUgPSBub3A7XG4gICAgc2NvcGUudXBncmFkZVN1YnRyZWUgPSBub3A7XG4gICAgc2NvcGUudGFrZVJlY29yZHMgPSBub3A7XG4gICAgc2NvcGUuaW5zdGFuY2VvZiA9IGZ1bmN0aW9uKG9iaiwgYmFzZSkge1xuICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIGJhc2U7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBpbml0aWFsaXplTW9kdWxlcygpO1xuICB9XG4gIHZhciB1cGdyYWRlRG9jdW1lbnRUcmVlID0gc2NvcGUudXBncmFkZURvY3VtZW50VHJlZTtcbiAgdmFyIHVwZ3JhZGVEb2N1bWVudCA9IHNjb3BlLnVwZ3JhZGVEb2N1bWVudDtcbiAgaWYgKCF3aW5kb3cud3JhcCkge1xuICAgIGlmICh3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwpIHtcbiAgICAgIHdpbmRvdy53cmFwID0gd2luZG93LlNoYWRvd0RPTVBvbHlmaWxsLndyYXBJZk5lZWRlZDtcbiAgICAgIHdpbmRvdy51bndyYXAgPSB3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwudW53cmFwSWZOZWVkZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpbmRvdy53cmFwID0gd2luZG93LnVud3JhcCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuICBpZiAod2luZG93LkhUTUxJbXBvcnRzKSB7XG4gICAgd2luZG93LkhUTUxJbXBvcnRzLl9faW1wb3J0c1BhcnNpbmdIb29rID0gZnVuY3Rpb24oZWx0KSB7XG4gICAgICBpZiAoZWx0LmltcG9ydCkge1xuICAgICAgICB1cGdyYWRlRG9jdW1lbnQod3JhcChlbHQuaW1wb3J0KSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBib290c3RyYXAoKSB7XG4gICAgdXBncmFkZURvY3VtZW50VHJlZSh3aW5kb3cud3JhcChkb2N1bWVudCkpO1xuICAgIHdpbmRvdy5DdXN0b21FbGVtZW50cy5yZWFkeSA9IHRydWU7XG4gICAgdmFyIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgZnVuY3Rpb24oZikge1xuICAgICAgc2V0VGltZW91dChmLCAxNik7XG4gICAgfTtcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB3aW5kb3cuQ3VzdG9tRWxlbWVudHMucmVhZHlUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgaWYgKHdpbmRvdy5IVE1MSW1wb3J0cykge1xuICAgICAgICAgIHdpbmRvdy5DdXN0b21FbGVtZW50cy5lbGFwc2VkID0gd2luZG93LkN1c3RvbUVsZW1lbnRzLnJlYWR5VGltZSAtIHdpbmRvdy5IVE1MSW1wb3J0cy5yZWFkeVRpbWU7XG4gICAgICAgIH1cbiAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJXZWJDb21wb25lbnRzUmVhZHlcIiwge1xuICAgICAgICAgIGJ1YmJsZXM6IHRydWVcbiAgICAgICAgfSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiY29tcGxldGVcIiB8fCBzY29wZS5mbGFncy5lYWdlcikge1xuICAgIGJvb3RzdHJhcCgpO1xuICB9IGVsc2UgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiaW50ZXJhY3RpdmVcIiAmJiAhd2luZG93LmF0dGFjaEV2ZW50ICYmICghd2luZG93LkhUTUxJbXBvcnRzIHx8IHdpbmRvdy5IVE1MSW1wb3J0cy5yZWFkeSkpIHtcbiAgICBib290c3RyYXAoKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbG9hZEV2ZW50ID0gd2luZG93LkhUTUxJbXBvcnRzICYmICF3aW5kb3cuSFRNTEltcG9ydHMucmVhZHkgPyBcIkhUTUxJbXBvcnRzTG9hZGVkXCIgOiBcIkRPTUNvbnRlbnRMb2FkZWRcIjtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihsb2FkRXZlbnQsIGJvb3RzdHJhcCk7XG4gIH1cbn0pKHdpbmRvdy5DdXN0b21FbGVtZW50cyk7IiwiKGZ1bmN0aW9uKHNlbGYpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGlmIChzZWxmLmZldGNoKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICB2YXIgc3VwcG9ydCA9IHtcbiAgICBzZWFyY2hQYXJhbXM6ICdVUkxTZWFyY2hQYXJhbXMnIGluIHNlbGYsXG4gICAgaXRlcmFibGU6ICdTeW1ib2wnIGluIHNlbGYgJiYgJ2l0ZXJhdG9yJyBpbiBTeW1ib2wsXG4gICAgYmxvYjogJ0ZpbGVSZWFkZXInIGluIHNlbGYgJiYgJ0Jsb2InIGluIHNlbGYgJiYgKGZ1bmN0aW9uKCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgbmV3IEJsb2IoKVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH0pKCksXG4gICAgZm9ybURhdGE6ICdGb3JtRGF0YScgaW4gc2VsZixcbiAgICBhcnJheUJ1ZmZlcjogJ0FycmF5QnVmZmVyJyBpbiBzZWxmXG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWxpemVOYW1lKG5hbWUpIHtcbiAgICBpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICBuYW1lID0gU3RyaW5nKG5hbWUpXG4gICAgfVxuICAgIGlmICgvW15hLXowLTlcXC0jJCUmJyorLlxcXl9gfH5dL2kudGVzdChuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBjaGFyYWN0ZXIgaW4gaGVhZGVyIGZpZWxkIG5hbWUnKVxuICAgIH1cbiAgICByZXR1cm4gbmFtZS50b0xvd2VyQ2FzZSgpXG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWxpemVWYWx1ZSh2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSlcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlXG4gIH1cblxuICAvLyBCdWlsZCBhIGRlc3RydWN0aXZlIGl0ZXJhdG9yIGZvciB0aGUgdmFsdWUgbGlzdFxuICBmdW5jdGlvbiBpdGVyYXRvckZvcihpdGVtcykge1xuICAgIHZhciBpdGVyYXRvciA9IHtcbiAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmFsdWUgPSBpdGVtcy5zaGlmdCgpXG4gICAgICAgIHJldHVybiB7ZG9uZTogdmFsdWUgPT09IHVuZGVmaW5lZCwgdmFsdWU6IHZhbHVlfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdXBwb3J0Lml0ZXJhYmxlKSB7XG4gICAgICBpdGVyYXRvcltTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBpdGVyYXRvclxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpdGVyYXRvclxuICB9XG5cbiAgZnVuY3Rpb24gSGVhZGVycyhoZWFkZXJzKSB7XG4gICAgdGhpcy5tYXAgPSB7fVxuXG4gICAgaWYgKGhlYWRlcnMgaW5zdGFuY2VvZiBIZWFkZXJzKSB7XG4gICAgICBoZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgdmFsdWUpXG4gICAgICB9LCB0aGlzKVxuXG4gICAgfSBlbHNlIGlmIChoZWFkZXJzKSB7XG4gICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhoZWFkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgaGVhZGVyc1tuYW1lXSlcbiAgICAgIH0sIHRoaXMpXG4gICAgfVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICBuYW1lID0gbm9ybWFsaXplTmFtZShuYW1lKVxuICAgIHZhbHVlID0gbm9ybWFsaXplVmFsdWUodmFsdWUpXG4gICAgdmFyIGxpc3QgPSB0aGlzLm1hcFtuYW1lXVxuICAgIGlmICghbGlzdCkge1xuICAgICAgbGlzdCA9IFtdXG4gICAgICB0aGlzLm1hcFtuYW1lXSA9IGxpc3RcbiAgICB9XG4gICAgbGlzdC5wdXNoKHZhbHVlKVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGVbJ2RlbGV0ZSddID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGRlbGV0ZSB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciB2YWx1ZXMgPSB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXVxuICAgIHJldHVybiB2YWx1ZXMgPyB2YWx1ZXNbMF0gOiBudWxsXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5nZXRBbGwgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldIHx8IFtdXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMubWFwLmhhc093blByb3BlcnR5KG5vcm1hbGl6ZU5hbWUobmFtZSkpXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldID0gW25vcm1hbGl6ZVZhbHVlKHZhbHVlKV1cbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbihjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRoaXMubWFwKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHRoaXMubWFwW25hbWVdLmZvckVhY2goZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB2YWx1ZSwgbmFtZSwgdGhpcylcbiAgICAgIH0sIHRoaXMpXG4gICAgfSwgdGhpcylcbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXRlbXMgPSBbXVxuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkgeyBpdGVtcy5wdXNoKG5hbWUpIH0pXG4gICAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUudmFsdWVzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW1zID0gW11cbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24odmFsdWUpIHsgaXRlbXMucHVzaCh2YWx1ZSkgfSlcbiAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5lbnRyaWVzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW1zID0gW11cbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHsgaXRlbXMucHVzaChbbmFtZSwgdmFsdWVdKSB9KVxuICAgIHJldHVybiBpdGVyYXRvckZvcihpdGVtcylcbiAgfVxuXG4gIGlmIChzdXBwb3J0Lml0ZXJhYmxlKSB7XG4gICAgSGVhZGVycy5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSA9IEhlYWRlcnMucHJvdG90eXBlLmVudHJpZXNcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbnN1bWVkKGJvZHkpIHtcbiAgICBpZiAoYm9keS5ib2R5VXNlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBUeXBlRXJyb3IoJ0FscmVhZHkgcmVhZCcpKVxuICAgIH1cbiAgICBib2R5LmJvZHlVc2VkID0gdHJ1ZVxuICB9XG5cbiAgZnVuY3Rpb24gZmlsZVJlYWRlclJlYWR5KHJlYWRlcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KVxuICAgICAgfVxuICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KHJlYWRlci5lcnJvcilcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEJsb2JBc0FycmF5QnVmZmVyKGJsb2IpIHtcbiAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxuICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihibG9iKVxuICAgIHJldHVybiBmaWxlUmVhZGVyUmVhZHkocmVhZGVyKVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEJsb2JBc1RleHQoYmxvYikge1xuICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gICAgcmVhZGVyLnJlYWRBc1RleHQoYmxvYilcbiAgICByZXR1cm4gZmlsZVJlYWRlclJlYWR5KHJlYWRlcilcbiAgfVxuXG4gIGZ1bmN0aW9uIEJvZHkoKSB7XG4gICAgdGhpcy5ib2R5VXNlZCA9IGZhbHNlXG5cbiAgICB0aGlzLl9pbml0Qm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgICAgIHRoaXMuX2JvZHlJbml0ID0gYm9keVxuICAgICAgaWYgKHR5cGVvZiBib2R5ID09PSAnc3RyaW5nJykge1xuICAgICAgICB0aGlzLl9ib2R5VGV4dCA9IGJvZHlcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5ibG9iICYmIEJsb2IucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUJsb2IgPSBib2R5XG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuZm9ybURhdGEgJiYgRm9ybURhdGEucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUZvcm1EYXRhID0gYm9keVxuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LnNlYXJjaFBhcmFtcyAmJiBVUkxTZWFyY2hQYXJhbXMucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keVRleHQgPSBib2R5LnRvU3RyaW5nKClcbiAgICAgIH0gZWxzZSBpZiAoIWJvZHkpIHtcbiAgICAgICAgdGhpcy5fYm9keVRleHQgPSAnJ1xuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmFycmF5QnVmZmVyICYmIEFycmF5QnVmZmVyLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgIC8vIE9ubHkgc3VwcG9ydCBBcnJheUJ1ZmZlcnMgZm9yIFBPU1QgbWV0aG9kLlxuICAgICAgICAvLyBSZWNlaXZpbmcgQXJyYXlCdWZmZXJzIGhhcHBlbnMgdmlhIEJsb2JzLCBpbnN0ZWFkLlxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bnN1cHBvcnRlZCBCb2R5SW5pdCB0eXBlJylcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLmhlYWRlcnMuZ2V0KCdjb250ZW50LXR5cGUnKSkge1xuICAgICAgICBpZiAodHlwZW9mIGJvZHkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzLnNldCgnY29udGVudC10eXBlJywgJ3RleHQvcGxhaW47Y2hhcnNldD1VVEYtOCcpXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUJsb2IgJiYgdGhpcy5fYm9keUJsb2IudHlwZSkge1xuICAgICAgICAgIHRoaXMuaGVhZGVycy5zZXQoJ2NvbnRlbnQtdHlwZScsIHRoaXMuX2JvZHlCbG9iLnR5cGUpXG4gICAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5zZWFyY2hQYXJhbXMgJiYgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzLnNldCgnY29udGVudC10eXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDtjaGFyc2V0PVVURi04JylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdXBwb3J0LmJsb2IpIHtcbiAgICAgIHRoaXMuYmxvYiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKVxuICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0ZWRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keUJsb2IpXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUZvcm1EYXRhKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcmVhZCBGb3JtRGF0YSBib2R5IGFzIGJsb2InKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEJsb2IoW3RoaXMuX2JvZHlUZXh0XSkpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5hcnJheUJ1ZmZlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ibG9iKCkudGhlbihyZWFkQmxvYkFzQXJyYXlCdWZmZXIpXG4gICAgICB9XG5cbiAgICAgIHRoaXMudGV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKVxuICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0ZWRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgIHJldHVybiByZWFkQmxvYkFzVGV4dCh0aGlzLl9ib2R5QmxvYilcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgdGV4dCcpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5VGV4dClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnRleHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcylcbiAgICAgICAgcmV0dXJuIHJlamVjdGVkID8gcmVqZWN0ZWQgOiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keVRleHQpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN1cHBvcnQuZm9ybURhdGEpIHtcbiAgICAgIHRoaXMuZm9ybURhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oZGVjb2RlKVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuanNvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oSlNPTi5wYXJzZSlcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLy8gSFRUUCBtZXRob2RzIHdob3NlIGNhcGl0YWxpemF0aW9uIHNob3VsZCBiZSBub3JtYWxpemVkXG4gIHZhciBtZXRob2RzID0gWydERUxFVEUnLCAnR0VUJywgJ0hFQUQnLCAnT1BUSU9OUycsICdQT1NUJywgJ1BVVCddXG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplTWV0aG9kKG1ldGhvZCkge1xuICAgIHZhciB1cGNhc2VkID0gbWV0aG9kLnRvVXBwZXJDYXNlKClcbiAgICByZXR1cm4gKG1ldGhvZHMuaW5kZXhPZih1cGNhc2VkKSA+IC0xKSA/IHVwY2FzZWQgOiBtZXRob2RcbiAgfVxuXG4gIGZ1bmN0aW9uIFJlcXVlc3QoaW5wdXQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICAgIHZhciBib2R5ID0gb3B0aW9ucy5ib2R5XG4gICAgaWYgKFJlcXVlc3QucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoaW5wdXQpKSB7XG4gICAgICBpZiAoaW5wdXQuYm9keVVzZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQWxyZWFkeSByZWFkJylcbiAgICAgIH1cbiAgICAgIHRoaXMudXJsID0gaW5wdXQudXJsXG4gICAgICB0aGlzLmNyZWRlbnRpYWxzID0gaW5wdXQuY3JlZGVudGlhbHNcbiAgICAgIGlmICghb3B0aW9ucy5oZWFkZXJzKSB7XG4gICAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKGlucHV0LmhlYWRlcnMpXG4gICAgICB9XG4gICAgICB0aGlzLm1ldGhvZCA9IGlucHV0Lm1ldGhvZFxuICAgICAgdGhpcy5tb2RlID0gaW5wdXQubW9kZVxuICAgICAgaWYgKCFib2R5KSB7XG4gICAgICAgIGJvZHkgPSBpbnB1dC5fYm9keUluaXRcbiAgICAgICAgaW5wdXQuYm9keVVzZWQgPSB0cnVlXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudXJsID0gaW5wdXRcbiAgICB9XG5cbiAgICB0aGlzLmNyZWRlbnRpYWxzID0gb3B0aW9ucy5jcmVkZW50aWFscyB8fCB0aGlzLmNyZWRlbnRpYWxzIHx8ICdvbWl0J1xuICAgIGlmIChvcHRpb25zLmhlYWRlcnMgfHwgIXRoaXMuaGVhZGVycykge1xuICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKVxuICAgIH1cbiAgICB0aGlzLm1ldGhvZCA9IG5vcm1hbGl6ZU1ldGhvZChvcHRpb25zLm1ldGhvZCB8fCB0aGlzLm1ldGhvZCB8fCAnR0VUJylcbiAgICB0aGlzLm1vZGUgPSBvcHRpb25zLm1vZGUgfHwgdGhpcy5tb2RlIHx8IG51bGxcbiAgICB0aGlzLnJlZmVycmVyID0gbnVsbFxuXG4gICAgaWYgKCh0aGlzLm1ldGhvZCA9PT0gJ0dFVCcgfHwgdGhpcy5tZXRob2QgPT09ICdIRUFEJykgJiYgYm9keSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQm9keSBub3QgYWxsb3dlZCBmb3IgR0VUIG9yIEhFQUQgcmVxdWVzdHMnKVxuICAgIH1cbiAgICB0aGlzLl9pbml0Qm9keShib2R5KVxuICB9XG5cbiAgUmVxdWVzdC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFJlcXVlc3QodGhpcylcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlY29kZShib2R5KSB7XG4gICAgdmFyIGZvcm0gPSBuZXcgRm9ybURhdGEoKVxuICAgIGJvZHkudHJpbSgpLnNwbGl0KCcmJykuZm9yRWFjaChmdW5jdGlvbihieXRlcykge1xuICAgICAgaWYgKGJ5dGVzKSB7XG4gICAgICAgIHZhciBzcGxpdCA9IGJ5dGVzLnNwbGl0KCc9JylcbiAgICAgICAgdmFyIG5hbWUgPSBzcGxpdC5zaGlmdCgpLnJlcGxhY2UoL1xcKy9nLCAnICcpXG4gICAgICAgIHZhciB2YWx1ZSA9IHNwbGl0LmpvaW4oJz0nKS5yZXBsYWNlKC9cXCsvZywgJyAnKVxuICAgICAgICBmb3JtLmFwcGVuZChkZWNvZGVVUklDb21wb25lbnQobmFtZSksIGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkpXG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gZm9ybVxuICB9XG5cbiAgZnVuY3Rpb24gaGVhZGVycyh4aHIpIHtcbiAgICB2YXIgaGVhZCA9IG5ldyBIZWFkZXJzKClcbiAgICB2YXIgcGFpcnMgPSAoeGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpIHx8ICcnKS50cmltKCkuc3BsaXQoJ1xcbicpXG4gICAgcGFpcnMuZm9yRWFjaChmdW5jdGlvbihoZWFkZXIpIHtcbiAgICAgIHZhciBzcGxpdCA9IGhlYWRlci50cmltKCkuc3BsaXQoJzonKVxuICAgICAgdmFyIGtleSA9IHNwbGl0LnNoaWZ0KCkudHJpbSgpXG4gICAgICB2YXIgdmFsdWUgPSBzcGxpdC5qb2luKCc6JykudHJpbSgpXG4gICAgICBoZWFkLmFwcGVuZChrZXksIHZhbHVlKVxuICAgIH0pXG4gICAgcmV0dXJuIGhlYWRcbiAgfVxuXG4gIEJvZHkuY2FsbChSZXF1ZXN0LnByb3RvdHlwZSlcblxuICBmdW5jdGlvbiBSZXNwb25zZShib2R5SW5pdCwgb3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IHt9XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ2RlZmF1bHQnXG4gICAgdGhpcy5zdGF0dXMgPSBvcHRpb25zLnN0YXR1c1xuICAgIHRoaXMub2sgPSB0aGlzLnN0YXR1cyA+PSAyMDAgJiYgdGhpcy5zdGF0dXMgPCAzMDBcbiAgICB0aGlzLnN0YXR1c1RleHQgPSBvcHRpb25zLnN0YXR1c1RleHRcbiAgICB0aGlzLmhlYWRlcnMgPSBvcHRpb25zLmhlYWRlcnMgaW5zdGFuY2VvZiBIZWFkZXJzID8gb3B0aW9ucy5oZWFkZXJzIDogbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKVxuICAgIHRoaXMudXJsID0gb3B0aW9ucy51cmwgfHwgJydcbiAgICB0aGlzLl9pbml0Qm9keShib2R5SW5pdClcbiAgfVxuXG4gIEJvZHkuY2FsbChSZXNwb25zZS5wcm90b3R5cGUpXG5cbiAgUmVzcG9uc2UucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZSh0aGlzLl9ib2R5SW5pdCwge1xuICAgICAgc3RhdHVzOiB0aGlzLnN0YXR1cyxcbiAgICAgIHN0YXR1c1RleHQ6IHRoaXMuc3RhdHVzVGV4dCxcbiAgICAgIGhlYWRlcnM6IG5ldyBIZWFkZXJzKHRoaXMuaGVhZGVycyksXG4gICAgICB1cmw6IHRoaXMudXJsXG4gICAgfSlcbiAgfVxuXG4gIFJlc3BvbnNlLmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKG51bGwsIHtzdGF0dXM6IDAsIHN0YXR1c1RleHQ6ICcnfSlcbiAgICByZXNwb25zZS50eXBlID0gJ2Vycm9yJ1xuICAgIHJldHVybiByZXNwb25zZVxuICB9XG5cbiAgdmFyIHJlZGlyZWN0U3RhdHVzZXMgPSBbMzAxLCAzMDIsIDMwMywgMzA3LCAzMDhdXG5cbiAgUmVzcG9uc2UucmVkaXJlY3QgPSBmdW5jdGlvbih1cmwsIHN0YXR1cykge1xuICAgIGlmIChyZWRpcmVjdFN0YXR1c2VzLmluZGV4T2Yoc3RhdHVzKSA9PT0gLTEpIHtcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbnZhbGlkIHN0YXR1cyBjb2RlJylcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHtzdGF0dXM6IHN0YXR1cywgaGVhZGVyczoge2xvY2F0aW9uOiB1cmx9fSlcbiAgfVxuXG4gIHNlbGYuSGVhZGVycyA9IEhlYWRlcnNcbiAgc2VsZi5SZXF1ZXN0ID0gUmVxdWVzdFxuICBzZWxmLlJlc3BvbnNlID0gUmVzcG9uc2VcblxuICBzZWxmLmZldGNoID0gZnVuY3Rpb24oaW5wdXQsIGluaXQpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB2YXIgcmVxdWVzdFxuICAgICAgaWYgKFJlcXVlc3QucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoaW5wdXQpICYmICFpbml0KSB7XG4gICAgICAgIHJlcXVlc3QgPSBpbnB1dFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KGlucHV0LCBpbml0KVxuICAgICAgfVxuXG4gICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KClcblxuICAgICAgZnVuY3Rpb24gcmVzcG9uc2VVUkwoKSB7XG4gICAgICAgIGlmICgncmVzcG9uc2VVUkwnIGluIHhocikge1xuICAgICAgICAgIHJldHVybiB4aHIucmVzcG9uc2VVUkxcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEF2b2lkIHNlY3VyaXR5IHdhcm5pbmdzIG9uIGdldFJlc3BvbnNlSGVhZGVyIHdoZW4gbm90IGFsbG93ZWQgYnkgQ09SU1xuICAgICAgICBpZiAoL15YLVJlcXVlc3QtVVJMOi9tLnRlc3QoeGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpKSkge1xuICAgICAgICAgIHJldHVybiB4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ1gtUmVxdWVzdC1VUkwnKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgc3RhdHVzOiB4aHIuc3RhdHVzLFxuICAgICAgICAgIHN0YXR1c1RleHQ6IHhoci5zdGF0dXNUZXh0LFxuICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnMoeGhyKSxcbiAgICAgICAgICB1cmw6IHJlc3BvbnNlVVJMKClcbiAgICAgICAgfVxuICAgICAgICB2YXIgYm9keSA9ICdyZXNwb25zZScgaW4geGhyID8geGhyLnJlc3BvbnNlIDogeGhyLnJlc3BvbnNlVGV4dFxuICAgICAgICByZXNvbHZlKG5ldyBSZXNwb25zZShib2R5LCBvcHRpb25zKSlcbiAgICAgIH1cblxuICAgICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ05ldHdvcmsgcmVxdWVzdCBmYWlsZWQnKSlcbiAgICAgIH1cblxuICAgICAgeGhyLm9udGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QobmV3IFR5cGVFcnJvcignTmV0d29yayByZXF1ZXN0IGZhaWxlZCcpKVxuICAgICAgfVxuXG4gICAgICB4aHIub3BlbihyZXF1ZXN0Lm1ldGhvZCwgcmVxdWVzdC51cmwsIHRydWUpXG5cbiAgICAgIGlmIChyZXF1ZXN0LmNyZWRlbnRpYWxzID09PSAnaW5jbHVkZScpIHtcbiAgICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRydWVcbiAgICAgIH1cblxuICAgICAgaWYgKCdyZXNwb25zZVR5cGUnIGluIHhociAmJiBzdXBwb3J0LmJsb2IpIHtcbiAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdibG9iJ1xuICAgICAgfVxuXG4gICAgICByZXF1ZXN0LmhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihuYW1lLCB2YWx1ZSlcbiAgICAgIH0pXG5cbiAgICAgIHhoci5zZW5kKHR5cGVvZiByZXF1ZXN0Ll9ib2R5SW5pdCA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogcmVxdWVzdC5fYm9keUluaXQpXG4gICAgfSlcbiAgfVxuICBzZWxmLmZldGNoLnBvbHlmaWxsID0gdHJ1ZVxufSkodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnID8gc2VsZiA6IHRoaXMpO1xuIiwiLyoqXG4gKiBBZ2dyZWdhdGUgdmFsdWVzIGZyb20gZG9tIHRyZWVcbiAqL1xuY2xhc3MgQWdncmVnYXRvciB7XG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICB9XG5cbiAgYWdncmVnYXRlKHNjb3BlKSB7XG4gICAgY29uc3QgZWxlbXMgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnaW5wdXQsc2VsZWN0LHRleHRhcmVhJyk7XG4gICAgZm9yIChsZXQgaT0wLCBsPWVsZW1zLmxlbmd0aDsgaTxsOyArK2kpIHtcbiAgICAgIGNvbnN0IGVsZW0gPSBlbGVtc1tpXTtcbiAgICAgIGNvbnN0IG1vZGVsTmFtZSA9IGVsZW0uZ2V0QXR0cmlidXRlKCdzai1tb2RlbCcpO1xuICAgICAgaWYgKG1vZGVsTmFtZSAmJiBtb2RlbE5hbWUuc3Vic3RyKDAsNSkgPT09ICd0aGlzLicpIHtcbiAgICAgICAgY29uc3QgdmFsID0gZWxlbS50eXBlID09PSAnY2hlY2tib3gnID8gZWxlbS5jaGVja2VkIDogZWxlbS52YWx1ZTtcbiAgICAgICAgbmV3IEZ1bmN0aW9uKCckdmFsJywgYGlmICghJHttb2RlbE5hbWV9KSB7ICR7bW9kZWxOYW1lfT0kdmFsOyB9YCkuYXBwbHkoc2NvcGUsIFt2YWxdKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBZ2dyZWdhdG9yO1xuXG4iLCJjb25zdCBDb21waWxlciA9IHJlcXVpcmUoJy4vY29tcGlsZXIuanMnKTtcbmNvbnN0IEFnZ3JlZ2F0b3IgPSByZXF1aXJlKCcuL2FnZ3JlZ2F0b3IuanMnKTtcbmNvbnN0IEluY3JlbWVudGFsRE9NID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tL2Rpc3QvaW5jcmVtZW50YWwtZG9tLmpzJyk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCAoKSA9PiB7XG4gIGNvbnN0IGVsZW1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW3NqLWFwcF0nKTtcbiAgZm9yIChsZXQgaT0wLCBsPWVsZW1zLmxlbmd0aDsgaTxsOyArK2kpIHtcbiAgICBjb25zdCBlbGVtID0gZWxlbXNbaV07XG5cbiAgICBjb25zdCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cbiAgICAvLyBjb3B5IGF0dHJpYnV0ZXNcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0gZWxlbS5hdHRyaWJ1dGVzO1xuICAgIGZvciAobGV0IGk9MCwgbD1hdHRyaWJ1dGVzLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgIGNvbnN0IGF0dHIgPSBhdHRyaWJ1dGVzW2ldO1xuICAgICAgdGVtcGxhdGUuc2V0QXR0cmlidXRlKGF0dHIubmFtZSwgYXR0ci52YWx1ZSk7XG4gICAgfVxuXG4gICAgbmV3IEFnZ3JlZ2F0b3IoZWxlbSkuYWdncmVnYXRlKHRlbXBsYXRlKTtcbiAgICBjb25zdCBjb21waWxlZCA9IG5ldyBDb21waWxlcigpLmNvbXBpbGUoZWxlbSk7XG4gICAgdGVtcGxhdGUudXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgSW5jcmVtZW50YWxET00ucGF0Y2godGhpcywgKCkgPT4ge1xuICAgICAgICBjb21waWxlZC5hcHBseSh0aGlzLCBbSW5jcmVtZW50YWxET01dKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBjb25zdCBhcHAgPSBlbGVtLmdldEF0dHJpYnV0ZSgnc2otYXBwJyk7XG4gICAgY29uc3QgcmVwbGFjZWQgPSBlbGVtLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKHRlbXBsYXRlLCBlbGVtKTtcbiAgICBpZiAoYXBwKSB7IC8vIE5vdGUuIHNqIGFsbG93cyBzai1hcHA9XCJcIiBmb3IgZGVtbyBhcHAuXG4gICAgICBjb25zdCBmdW5jID0gd2luZG93W2FwcF07XG4gICAgICBpZiAoZnVuYykge1xuICAgICAgICBmdW5jLmFwcGx5KHRlbXBsYXRlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGBVbmtub3duIGZ1bmN0aW9uICcke2FwcH0nLCBzcGVjZWZpZWQgYnkgc2otYXBwYDtcbiAgICAgIH1cbiAgICB9XG4gICAgdGVtcGxhdGUudXBkYXRlKCk7XG4gIH1cbn0pO1xuXG4iLCJjb25zdCBJbmNyZW1lbnRhbERPTSA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbS9kaXN0L2luY3JlbWVudGFsLWRvbS5qcycpO1xuY29uc3QgYXNzZXJ0ID0gdmFsID0+IHsgfTtcblxuLy8gaGFja1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL2dvb2dsZS9pbmNyZW1lbnRhbC1kb20vaXNzdWVzLzIzOVxuSW5jcmVtZW50YWxET00uYXR0cmlidXRlcy52YWx1ZSA9IGZ1bmN0aW9uIChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgZWwudmFsdWUgPSB2YWx1ZVxufTtcblxuY29uc3Qgc2pfYXR0cjJldmVudCA9IHtcbiAgJ3NqLWNsaWNrJzogJ29uY2xpY2snLFxuICAnc2otYmx1cic6ICdvbmJsdXInLFxuICAnc2otY2hlY2tlZCc6ICdvbmNoZWNrZWQnLFxuICAnc2otZGJsY2xpY2snOiAnb25kYmxjbGljaycsXG4gICdzai1mb2N1cyc6ICdvbmZvY3VzJyxcbiAgJ3NqLWtleWRvd24nOiAnb25rZXlkb3duJyxcbiAgJ3NqLWtleXByZXNzJzogJ29ua2V5cHJlc3MnLFxuICAnc2ota2V5dXAnOiAnb25rZXl1cCcsXG4gICdzai1tb3VzZWRvd24nOiAnb25tb3VzZWRvd24nLFxuICAnc2otbW91c2VlbnRlcic6ICdvbm1vdXNlZW50ZXInLFxuICAnc2otbW91c2VsZWF2ZSc6ICdvbm1vdXNlbGVhdmUnLFxuICAnc2otbW91c2Vtb3ZlJzogJ29ubW91c2Vtb3ZlJyxcbiAgJ3NqLW1vdXNlb3Zlcic6ICdvbm1vdXNlb3ZlcicsXG4gICdzai1tb3VzZXVwJzogJ29ubW91c2V1cCcsXG4gICdzai1wYXN0ZSc6ICdvbnBhc3RlJyxcbiAgJ3NqLXNlbGVjdGVkJzogJ29uc2VsZWN0ZWQnLFxuICAnc2otY2hhbmdlJzogJ29uY2hhbmdlJyxcbiAgJ3NqLXN1Ym1pdCc6ICdvbnN1Ym1pdCdcbn07XG5cbmNvbnN0IHNqX2Jvb2xlYW5fYXR0cmlidXRlcyA9IHtcbiAgJ3NqLWRpc2FibGVkJzogJ2Rpc2FibGVkJyxcbiAgJ3NqLXJlcXVpcmVkJzogJ3JlcXVpcmVkJyxcbiAgJ3NqLWNoZWNrZWQnOiAnY2hlY2tlZCdcbn07XG5cbmNsYXNzIENvbXBpbGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgYXNzZXJ0KGFyZ3VtZW50cy5sZW5ndGggPT09IDApO1xuICB9XG5cbiAgY29tcGlsZSh0ZW1wbGF0ZUVsZW1lbnQpIHtcbiAgICBjb25zdCBjaGlsZHJlbiA9IHRlbXBsYXRlRWxlbWVudC5jaGlsZE5vZGVzO1xuICAgIGxldCBjb2RlID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgY29kZSA9IGNvZGUuY29uY2F0KHRoaXMucmVuZGVyRE9NKGNoaWxkcmVuW2ldLCBbXSkpO1xuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhjb2RlLmpvaW4oXCI7XFxuXCIpKTtcbiAgICByZXR1cm4gbmV3IEZ1bmN0aW9uKCdJbmNyZW1lbnRhbERPTScsIGNvZGUuam9pbihcIjtcXG5cIikpO1xuICB9XG5cbiAgcmVuZGVyRE9NKGVsZW0sIHZhcnMpIHtcbiAgICBhc3NlcnQoZWxlbSk7XG4gICAgYXNzZXJ0KHZhcnMpO1xuICAgIGlmIChlbGVtLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuICAgICAgcmV0dXJuIFtgSW5jcmVtZW50YWxET00udGV4dCgke3RoaXMudGV4dChlbGVtLnRleHRDb250ZW50KX0pYF07XG4gICAgfSBlbHNlIGlmIChlbGVtLm5vZGVUeXBlID09PSBOb2RlLkNPTU1FTlRfTk9ERSkge1xuICAgICAgLy8gSWdub3JlIGNvbW1lbnQgbm9kZVxuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IHRhZ05hbWUgPSBlbGVtLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcblxuICAgIC8vIHByb2Nlc3MgYHNqLWlmYFxuICAgIHtcbiAgICAgIGNvbnN0IGNvbmQgPSBlbGVtLmdldEF0dHJpYnV0ZSgnc2otaWYnKTtcbiAgICAgIGlmIChjb25kKSB7XG4gICAgICAgIHZhciBib2R5ID0gWyc7J107XG4gICAgICAgIGJvZHkucHVzaChgaWYgKCR7Y29uZH0pIHtgKTtcbiAgICAgICAgYm9keS5wdXNoKGBJbmNyZW1lbnRhbERPTS5lbGVtZW50T3BlblN0YXJ0KFwiJHt0YWdOYW1lfVwiKWApO1xuICAgICAgICBib2R5ID0gYm9keS5jb25jYXQodGhpcy5yZW5kZXJBdHRyaWJ1dGVzKGVsZW0sIHZhcnMpKTtcbiAgICAgICAgYm9keS5wdXNoKGBJbmNyZW1lbnRhbERPTS5lbGVtZW50T3BlbkVuZChcIiR7dGFnTmFtZX1cIilgKTtcblxuICAgICAgICBib2R5ID0gYm9keS5jb25jYXQodGhpcy5yZW5kZXJCb2R5KGVsZW0sIHZhcnMpKTtcblxuICAgICAgICBib2R5LnB1c2goYEluY3JlbWVudGFsRE9NLmVsZW1lbnRDbG9zZShcIiR7dGFnTmFtZX1cIilgKTtcblxuICAgICAgICBib2R5LnB1c2goYH1gKTtcbiAgICAgICAgcmV0dXJuIGJvZHk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gcHJvY2VzcyBgc2otcmVwZWF0YFxuICAgIHtcbiAgICAgIGNvbnN0IGNvbmQgPSBlbGVtLmdldEF0dHJpYnV0ZSgnc2otcmVwZWF0Jyk7XG4gICAgICBpZiAoY29uZCkge1xuICAgICAgICBjb25zdCBtID0gY29uZC5tYXRjaCgvXlxccyooPzooXFx3Kyl8XFwoXFxzKihcXHcrKVxccyosXFxzKihcXHcrKVxccypcXCkpXFxzK2luXFxzKyhbYS16XVthLXowLTkuXSopXFxzKiQvKTtcbiAgICAgICAgaWYgKCFtKSB7XG4gICAgICAgICAgdGhyb3cgYEludmFsaWQgc2otcmVwZWF0IHZhbHVlOiAke2NvbmR9YDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtWzFdKSB7XG4gICAgICAgICAgLy8gdmFyTmFtZSBpbiBjb250YWluZXJcbiAgICAgICAgICBjb25zdCB2YXJOYW1lID0gbVsxXTtcbiAgICAgICAgICBjb25zdCBjb250YWluZXIgPSBtWzRdO1xuXG4gICAgICAgICAgdmFyIGJvZHkgPSBbJzsnXTtcbiAgICAgICAgICBib2R5LnB1c2goYEluY3JlbWVudGFsRE9NLmVsZW1lbnRPcGVuU3RhcnQoXCIke3RhZ05hbWV9XCIpYCk7XG4gICAgICAgICAgYm9keSA9IGJvZHkuY29uY2F0KHRoaXMucmVuZGVyQXR0cmlidXRlcyhlbGVtLCB2YXJzKSk7XG4gICAgICAgICAgYm9keS5wdXNoKGBJbmNyZW1lbnRhbERPTS5lbGVtZW50T3BlbkVuZChcIiR7dGFnTmFtZX1cIilgKTtcblxuICAgICAgICAgIGJvZHkucHVzaChgKGZ1bmN0aW9uKEluY3JlbWVudGFsRE9NKSB7XFxudmFyICQkY29udGFpbmVyPSR7Y29udGFpbmVyfTtcXG5mb3IgKHZhciAkaW5kZXg9MCwkbD0kJGNvbnRhaW5lci5sZW5ndGg7ICRpbmRleDwkbDsgJGluZGV4KyspIHtcXG52YXIgJHt2YXJOYW1lfT0kJGNvbnRhaW5lclskaW5kZXhdO2ApO1xuXG4gICAgICAgICAgYm9keSA9IGJvZHkuY29uY2F0KHRoaXMucmVuZGVyQm9keShlbGVtLCB2YXJzLmNvbmNhdChbdmFyTmFtZSwgJyRpbmRleCddKSkpO1xuXG4gICAgICAgICAgYm9keS5wdXNoKGB9XFxufSkuYXBwbHkodGhpcywgW0luY3JlbWVudGFsRE9NXSk7YCk7XG4gICAgICAgICAgYm9keS5wdXNoKGBJbmNyZW1lbnRhbERPTS5lbGVtZW50Q2xvc2UoXCIke3RhZ05hbWV9XCIpYCk7XG5cbiAgICAgICAgICByZXR1cm4gYm9keTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyAoa2V5TmFtZSwgdmFyTmFtZSkgaW4gY29udGFpbmVyXG4gICAgICAgICAgY29uc3Qga2V5TmFtZSA9IG1bMl07XG4gICAgICAgICAgY29uc3QgdmFsdWVOYW1lID0gbVszXTtcbiAgICAgICAgICBjb25zdCBjb250YWluZXIgPSBtWzRdO1xuICAgICAgICAgIHZhciBib2R5ID0gWyc7J107XG4gICAgICAgICAgYm9keS5wdXNoKGBJbmNyZW1lbnRhbERPTS5lbGVtZW50T3BlblN0YXJ0KFwiJHt0YWdOYW1lfVwiKWApO1xuICAgICAgICAgIGJvZHkgPSBib2R5LmNvbmNhdCh0aGlzLnJlbmRlckF0dHJpYnV0ZXMoZWxlbSwgdmFycykpO1xuICAgICAgICAgIGJvZHkucHVzaChgSW5jcmVtZW50YWxET00uZWxlbWVudE9wZW5FbmQoXCIke3RhZ05hbWV9XCIpYCk7XG4gICAgICAgICAgYm9keS5wdXNoKGAoZnVuY3Rpb24oSW5jcmVtZW50YWxET00pIHtcXG52YXIgJCRjb250YWluZXI9JHtjb250YWluZXJ9O2ZvciAodmFyICR7a2V5TmFtZX0gaW4gJCRjb250YWluZXIpIHtcXG52YXIgJHt2YWx1ZU5hbWV9PSQkY29udGFpbmVyWyR7a2V5TmFtZX1dO2ApO1xuICAgICAgICAgIGJvZHkgPSBib2R5LmNvbmNhdCh0aGlzLnJlbmRlckJvZHkoZWxlbSwgdmFycy5jb25jYXQoW2tleU5hbWUsIHZhbHVlTmFtZV0pKSk7XG4gICAgICAgICAgYm9keS5wdXNoKGB9XFxufSkuYXBwbHkodGhpcywgW0luY3JlbWVudGFsRE9NXSk7YCk7XG4gICAgICAgICAgYm9keS5wdXNoKGBJbmNyZW1lbnRhbERPTS5lbGVtZW50Q2xvc2UoXCIke3RhZ05hbWV9XCIpYCk7XG4gICAgICAgICAgcmV0dXJuIGJvZHk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBwcm9jZXNzIGF0dHJpYnV0ZXNcbiAgICB2YXIgYm9keSA9IFsnOyddO1xuICAgIGJvZHkucHVzaChgSW5jcmVtZW50YWxET00uZWxlbWVudE9wZW5TdGFydChcIiR7dGFnTmFtZX1cIilgKTtcbiAgICBib2R5ID0gYm9keS5jb25jYXQodGhpcy5yZW5kZXJBdHRyaWJ1dGVzKGVsZW0sIHZhcnMpKTtcbiAgICBib2R5LnB1c2goYEluY3JlbWVudGFsRE9NLmVsZW1lbnRPcGVuRW5kKFwiJHt0YWdOYW1lfVwiKWApO1xuICAgIGJvZHkgPSBib2R5LmNvbmNhdCh0aGlzLnJlbmRlckJvZHkoZWxlbSwgdmFycykpO1xuICAgIGJvZHkucHVzaChgSW5jcmVtZW50YWxET00uZWxlbWVudENsb3NlKFwiJHt0YWdOYW1lfVwiKWApO1xuXG4gICAgcmV0dXJuIGJvZHk7XG4gIH1cblxuICByZW5kZXJCb2R5KGVsZW0sIHZhcnMpIHtcbiAgICBsZXQgYm9keSA9IFtdO1xuICAgIGNvbnN0IGJpbmQgPSBlbGVtLmdldEF0dHJpYnV0ZSgnc2otYmluZCcpO1xuICAgIGNvbnN0IHRhZ05hbWUgPSBlbGVtLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAodGFnTmFtZS5pbmRleE9mKCctJykgPj0gMCkge1xuICAgICAgYm9keS5wdXNoKGBJbmNyZW1lbnRhbERPTS5za2lwKClgKTtcbiAgICB9IGVsc2UgaWYgKGJpbmQpIHtcbiAgICAgIGJvZHkucHVzaChgSW5jcmVtZW50YWxET00udGV4dCgke2JpbmR9KTtgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY2hpbGRyZW4gPSBlbGVtLmNoaWxkTm9kZXM7XG4gICAgICBmb3IgKGxldCBpID0gMCwgbCA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICBpZiAoY2hpbGQubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFKSB7XG4gICAgICAgICAgLy8gcmVwbGFjZVZhcmlhYmxlc1xuICAgICAgICAgIGJvZHkucHVzaChgSW5jcmVtZW50YWxET00udGV4dCgke3RoaXMudGV4dChjaGlsZC50ZXh0Q29udGVudCl9KWApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJvZHkgPSBib2R5LmNvbmNhdCh0aGlzLnJlbmRlckRPTShjaGlsZCwgdmFycykpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBib2R5O1xuICB9XG5cbiAgcmVuZGVyQXR0cmlidXRlcyhlbGVtLCB2YXJzKSB7XG4gICAgYXNzZXJ0KHZhcnMpO1xuICAgIGNvbnN0IGF0dHJzID0gZWxlbS5hdHRyaWJ1dGVzO1xuICAgIGNvbnN0IGNvZGVMaXN0ID0gW107XG4gICAgY29uc3QgbW9kZWwgPSBlbGVtLmdldEF0dHJpYnV0ZSgnc2otbW9kZWwnKTtcbiAgICBjb25zdCBldmVudHMgPSB7fTtcbiAgICBmb3IgKGxldCBpID0gMCwgbCA9IGF0dHJzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgY29uc3QgYXR0ciA9IGF0dHJzW2ldO1xuICAgICAgY29uc3QgY29kZSA9IHRoaXMucmVuZGVyQXR0cmlidXRlKGVsZW0sIGF0dHJzW2ldLCB2YXJzLCBldmVudHMpO1xuICAgICAgY29kZUxpc3QucHVzaChjb2RlKTtcbiAgICB9XG5cbiAgICBjb25zdCBub3JtYWxFdmVudHMgPSBbXG4gICAgICAnb25jbGljaycsXG4gICAgICAnb25ibHVyJyxcbiAgICAgICdvbmNoZWNrZWQnLFxuICAgICAgJ29uZGJsY2xpY2snLFxuICAgICAgJ29uZm9jdXMnLFxuICAgICAgJ29ua2V5ZG93bicsXG4gICAgICAnb25rZXlwcmVzcycsXG4gICAgICAnb25rZXl1cCcsXG4gICAgICAnb25tb3VzZWRvd24nLFxuICAgICAgJ29ubW91c2VlbnRlcicsXG4gICAgICAnb25tb3VzZWxlYXZlJyxcbiAgICAgICdvbm1vdXNlbW92ZScsXG4gICAgICAnb25tb3VzZW92ZXInLFxuICAgICAgJ29ubW91c2V1cCcsXG4gICAgICAnb25wYXN0ZScsXG4gICAgICAnb25zZWxlY3RlZCcsXG4gICAgICAnb25zdWJtaXQnXG4gICAgXTtcbiAgICBpZiAobW9kZWwpIHtcbiAgICAgIGlmIChlbGVtLnR5cGUgPT09ICdjaGVja2JveCcgfHwgZWxlbS50eXBlID09PSAncmFkaW8nKSB7XG4gICAgICAgIG5vcm1hbEV2ZW50cy5wdXNoKCdvbmlucHV0Jyk7XG4gICAgICAgIGNvbnN0IGNvZGUgPSBldmVudHNbJ29uY2hhbmdlJ10gfHwgJyc7XG4gICAgICAgIGNvZGVMaXN0LnB1c2goYFxuICAgICAgICAgIGlmICgke21vZGVsfSkge1xuICAgICAgICAgICAgSW5jcmVtZW50YWxET00uYXR0cihcImNoZWNrZWRcIiwgJ2NoZWNrZWQnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgSW5jcmVtZW50YWxET00uYXR0cihcIm9uY2hhbmdlXCIsIGZ1bmN0aW9uICgke3ZhcnMuY29uY2F0KFsnJGV2ZW50J10pLmpvaW4oXCIsXCIpfSkge1xuICAgICAgICAgICAgJHttb2RlbH0gPSAkZXZlbnQudGFyZ2V0LmNoZWNrZWQ7XG4gICAgICAgICAgICAke2NvZGV9O1xuICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgICAgICB9LmJpbmQoJHtbJ3RoaXMnXS5jb25jYXQodmFycykuam9pbihcIixcIil9KSk7XG4gICAgICAgIGApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm9ybWFsRXZlbnRzLnB1c2goJ29uY2hhbmdlJyk7XG4gICAgICAgIGNvbnN0IGNvZGUgPSBldmVudHNbJ29uaW5wdXQnXSB8fCAnJztcbiAgICAgICAgY29kZUxpc3QucHVzaChgXG4gICAgICAgICAgSW5jcmVtZW50YWxET00uYXR0cihcInZhbHVlXCIsICR7bW9kZWx9KTtcbiAgICAgICAgICBJbmNyZW1lbnRhbERPTS5hdHRyKFwib25pbnB1dFwiLCBmdW5jdGlvbiAoJHt2YXJzLmNvbmNhdChbJyRldmVudCddKS5qb2luKFwiLFwiKX0pIHtcbiAgICAgICAgICAgICR7bW9kZWx9ID0gJGV2ZW50LnRhcmdldC52YWx1ZTtcbiAgICAgICAgICAgICR7Y29kZX07XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgICAgIH0uYmluZCgke1sndGhpcyddLmNvbmNhdCh2YXJzKS5qb2luKFwiLFwiKX0pKTtcbiAgICAgICAgYCk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAobGV0IGk9MCwgbD1ub3JtYWxFdmVudHMubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgY29uc3QgZXZlbnROYW1lID0gbm9ybWFsRXZlbnRzW2ldO1xuICAgICAgY29uc3QgZXhwcmVzc2lvbiA9IGV2ZW50c1tldmVudE5hbWVdO1xuICAgICAgaWYgKGV4cHJlc3Npb24pIHtcbiAgICAgICAgY29kZUxpc3QucHVzaChgO1xuICAgICAgICBJbmNyZW1lbnRhbERPTS5hdHRyKFwiJHtldmVudE5hbWV9XCIsIGZ1bmN0aW9uICgke3ZhcnMuY29uY2F0KFsnJGV2ZW50J10pLmpvaW4oXCIsXCIpfSkge1xuICAgICAgICAgICR7ZXhwcmVzc2lvbn07XG4gICAgICAgIH0uYmluZCgke1sndGhpcyddLmNvbmNhdCh2YXJzKS5qb2luKFwiLFwiKX0pKTtgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgRE9ORSByZW5kZXJBdHRyaWJ1dGVzICR7SlNPTi5zdHJpbmdpZnkoY29kZUxpc3QpfWApO1xuICAgIHJldHVybiBjb2RlTGlzdDtcbiAgfVxuXG4gIHJlbmRlckF0dHJpYnV0ZShlbGVtLCBhdHRyLCB2YXJzLCBldmVudHMpIHtcbiAgICBhc3NlcnQodmFycyk7XG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckF0dHJpYnV0ZTogJHthdHRyLm5hbWV9PSR7YXR0ci52YWx1ZX1gKTtcblxuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0ci5uYW1lO1xuICAgIGlmIChhdHRyTmFtZS5zdWJzdHIoMCwzKSA9PT0gJ3NqLScpIHtcbiAgICAgIGNvbnN0IGV2ZW50ID0gc2pfYXR0cjJldmVudFthdHRyTmFtZV07XG4gICAgICBpZiAoZXZlbnQpIHtcbiAgICAgICAgY29uc3QgZXhwcmVzc2lvbiA9IGF0dHIudmFsdWU7XG4gICAgICAgIGV2ZW50c1tldmVudF0gPSBleHByZXNzaW9uO1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9IGVsc2UgaWYgKHNqX2Jvb2xlYW5fYXR0cmlidXRlc1thdHRyLm5hbWVdKSB7XG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IHNqX2Jvb2xlYW5fYXR0cmlidXRlc1thdHRyLm5hbWVdO1xuICAgICAgICBjb25zdCBleHByZXNzaW9uID0gYXR0ci52YWx1ZTtcbiAgICAgICAgcmV0dXJuIGBpZiAoJHtleHByZXNzaW9ufSkgeyBJbmNyZW1lbnRhbERPTS5hdHRyKFwiJHthdHRyaWJ1dGV9XCIsIFwiJHthdHRyaWJ1dGV9XCIpOyB9YDtcbiAgICAgIH0gZWxzZSBpZiAoYXR0ci5uYW1lID09PSAnc2otY2xhc3MnKSB7XG4gICAgICAgIHJldHVybiBgSW5jcmVtZW50YWxET00uYXR0cihcImNsYXNzXCIsICR7YXR0ci52YWx1ZX0uam9pbihcIiBcIikpO2A7XG4gICAgICB9IGVsc2UgaWYgKGF0dHIubmFtZSA9PT0gJ3NqLWhyZWYnKSB7XG4gICAgICAgIHJldHVybiBgSW5jcmVtZW50YWxET00uYXR0cihcImhyZWZcIiwgJHthdHRyLnZhbHVlfS5yZXBsYWNlKC9eW146XSs/Oi8sIGZ1bmN0aW9uIChzY2hlbWUpIHsgcmV0dXJuIChzY2hlbWUgPT09ICdodHRwOicgfHwgc2NoZW1lID09PSAnaHR0cHM6Ly8nKSA/IHNjaGVtZSA6ICd1bnNhZmU6JyArIHNjaGVtZSB9KSk7YDtcbiAgICAgIH0gZWxzZSBpZiAoYXR0ci5uYW1lLnN1YnN0cigwLDgpID09PSAnc2otYXR0ci0nKSB7XG4gICAgICAgIHJldHVybiBgSW5jcmVtZW50YWxET00uYXR0cigke0pTT04uc3RyaW5naWZ5KGF0dHIubmFtZS5zdWJzdHIoOCkpfSwgJHthdHRyLnZhbHVlfSk7YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGBJbmNyZW1lbnRhbERPTS5hdHRyKFwiJHthdHRyLm5hbWV9XCIsICR7dGhpcy50ZXh0KGF0dHIudmFsdWUpfSk7YDtcbiAgICB9XG4gIH1cblxuICB0ZXh0KHMpIHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkocyk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb21waWxlcjtcblxuIiwiY29uc3QgQ29tcGlsZXIgPSByZXF1aXJlKCcuL2NvbXBpbGVyLmpzJyk7XG5jb25zdCBBZ2dyZWdhdG9yID0gcmVxdWlyZSgnLi9hZ2dyZWdhdG9yLmpzJyk7XG5jb25zdCBJbmNyZW1lbnRhbERPTSA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbS9kaXN0L2luY3JlbWVudGFsLWRvbS5qcycpO1xuXG4vLyBiYWJlbCBoYWNrc1xuLy8gU2VlIGh0dHBzOi8vcGhhYnJpY2F0b3IuYmFiZWxqcy5pby9UMTU0OFxuaWYgKHR5cGVvZiBIVE1MRWxlbWVudCAhPT0gJ2Z1bmN0aW9uJykge1xuICB2YXIgX0hUTUxFbGVtZW50ID0gZnVuY3Rpb24gKCkge1xuICB9O1xuICBfSFRNTEVsZW1lbnQucHJvdG90eXBlID0gSFRNTEVsZW1lbnQucHJvdG90eXBlO1xuICBIVE1MRWxlbWVudCA9IF9IVE1MRWxlbWVudDtcbn1cblxuY29uc3Qgc2NvcGVzID0ge307XG5jb25zdCBjb21waWxlZCA9IHt9O1xuXG5jbGFzcyBFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgY29uc29sZS5sb2coXCJDUkVBVEVEIFwiICsgdGhpcy50YWdOYW1lKTtcbiAgICBpZiAoIXNjb3Blc1t0aGlzLnRhZ05hbWVdKSB7XG4gICAgICAvLyBwYXJzZSB0ZW1wbGF0ZVxuICAgICAgdmFyIHRlbXBsYXRlID0gdGhpcy50ZW1wbGF0ZSgpO1xuICAgICAgaWYgKCF0ZW1wbGF0ZSkge1xuICAgICAgICB0aHJvdyBgdGVtcGxhdGUgc2hvdWxkbid0IGJlIG51bGxgO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBodG1sID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIGh0bWwuaW5uZXJIVE1MID0gdGVtcGxhdGU7XG5cbiAgICAgIHNjb3Blc1t0aGlzLnRhZ05hbWVdID0gdGhpcy5kZWZhdWx0KCk7XG4gICAgICBuZXcgQWdncmVnYXRvcihodG1sKS5hZ2dyZWdhdGUoc2NvcGVzW3RoaXMudGFnTmFtZV0pO1xuICAgICAgY29tcGlsZWRbdGhpcy50YWdOYW1lXSA9IG5ldyBDb21waWxlcigpLmNvbXBpbGUoaHRtbCk7XG4gICAgfVxuXG4gICAgY29uc3QgZGVmID0ge307XG5cbiAgICAvLyBvdmVyd3JpdGUgYnkgc2NvcGUgdmFsdWVzXG4gICAgY29uc3Qgc2NvcGUgPSBzY29wZXNbdGhpcy50YWdOYW1lXTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBzY29wZSkge1xuICAgICAgaWYgKHNjb3BlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgZGVmW2tleV0gPSBzY29wZVtrZXldO1xuICAgICAgfVxuICAgIH1cblxuLy8gIC8vIG92ZXJ3cml0ZSBieSBhdHRyaWJ1dGUgdmFsdWVzXG4vLyAgY29uc3QgYXR0cnMgPSB0aGlzLmF0dHJpYnV0ZXM7XG4vLyAgZm9yIChsZXQgaSA9IDAsIGwgPSBhdHRycy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbi8vICAgIGNvbnN0IGF0dHIgPSBhdHRyc1tpXTtcbi8vICAgIGlmIChhdHRyLm5hbWUuc3Vic3RyKDAsIDgpICE9PSAnc2otYXR0ci0nKSB7XG4vLyAgICAgIGRlZlthdHRyLm5hbWVdID0gYXR0ci52YWx1ZTtcbi8vICAgIH1cbi8vICB9XG5cbiAgICAvLyBhbmQgc2V0IHRvIHRhZyBhdHRyaWJ1dGVzXG4gICAgY29uc29sZS50cmFjZShcIlNFVFRJTkcgVkFMVUVTXCIpO1xuICAgIGNvbnNvbGUubG9nKGRlZik7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gZGVmKSB7XG4gICAgICBpZiAoZGVmLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgdGhpc1trZXldID0gZGVmW2tleV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5pbml0aWFsaXplKCk7XG5cbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9XG5cbiAgZGVmYXVsdCgpIHtcbiAgICByZXR1cm4ge307XG4gIH1cblxuICB0ZW1wbGF0ZSgpIHtcbiAgICB0aHJvdyBcIlBsZWFzZSBpbXBsZW1lbnQgJ3RlbXBsYXRlJyBtZXRob2RcIjtcbiAgfVxuXG4gIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhrZXkpIHtcbiAgICBjb25zb2xlLmxvZyhgU0VUIEFUVFJJQlVURTogJHtrZXl9YCk7XG4gICAgdGhpc1trZXldID0gdGhpcy5nZXRBdHRyaWJ1dGUoa2V5KTtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9XG5cbiAgaW5pdGlhbGl6ZSgpIHtcbiAgICAvLyBub3AuIGFic3RyYWN0IG1ldGhvZC5cbiAgfVxuXG4gIHVwZGF0ZSgpIHtcbiAgICBjb25zb2xlLmxvZyhcIlVQREFURVwiKTtcbiAgICBJbmNyZW1lbnRhbERPTS5wYXRjaCh0aGlzLCAoKSA9PiB7XG4gICAgICBjb21waWxlZFt0aGlzLnRhZ05hbWVdLmFwcGx5KHRoaXMsIFtJbmNyZW1lbnRhbERPTV0pO1xuICAgIH0pO1xuICB9XG5cbiAgZHVtcCgpIHtcbiAgICBjb25zdCBzY29wZSA9IHt9O1xuICAgIE9iamVjdC5rZXlzKHRoaXMpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIGlmIChrZXkgIT09ICdyZW5kZXJlcicpIHtcbiAgICAgICAgc2NvcGVba2V5XSA9IHRoaXNba2V5XTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gc2NvcGU7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFbGVtZW50O1xuXG4iLCIvLyBwb2x5ZmlsbFxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0N1c3RvbUV2ZW50L0N1c3RvbUV2ZW50XG4oZnVuY3Rpb24gKCkge1xuICBpZiAoIHR5cGVvZiB3aW5kb3cuQ3VzdG9tRXZlbnQgPT09IFwiZnVuY3Rpb25cIiApIHJldHVybiBmYWxzZTtcblxuICBmdW5jdGlvbiBDdXN0b21FdmVudCAoIGV2ZW50LCBwYXJhbXMgKSB7XG4gICAgcGFyYW1zID0gcGFyYW1zIHx8IHsgYnViYmxlczogZmFsc2UsIGNhbmNlbGFibGU6IGZhbHNlLCBkZXRhaWw6IHVuZGVmaW5lZCB9O1xuICAgIHZhciBldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCggJ0N1c3RvbUV2ZW50JyApO1xuICAgIGV2dC5pbml0Q3VzdG9tRXZlbnQoIGV2ZW50LCBwYXJhbXMuYnViYmxlcywgcGFyYW1zLmNhbmNlbGFibGUsIHBhcmFtcy5kZXRhaWwgKTtcbiAgICByZXR1cm4gZXZ0O1xuICAgfVxuXG4gIEN1c3RvbUV2ZW50LnByb3RvdHlwZSA9IHdpbmRvdy5FdmVudC5wcm90b3R5cGU7XG5cbiAgd2luZG93LkN1c3RvbUV2ZW50ID0gQ3VzdG9tRXZlbnQ7XG59KSgpO1xuXG5mdW5jdGlvbiBmaXJlRXZlbnQoZWxlbWVudCwgZXZlbnROYW1lLCBvcHRpb25zKSB7XG4gIGNvbnN0IGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KGV2ZW50TmFtZSwgb3B0aW9ucyk7XG4gIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZmlyZUV2ZW50O1xuIiwiLy8gcG9seWZpbGxzXG5yZXF1aXJlKCd3ZWJjb21wb25lbnRzLmpzL0N1c3RvbUVsZW1lbnRzLmpzJyk7XG5yZXF1aXJlKCcuL3BvbHlmaWxsLmpzJyk7XG5yZXF1aXJlKCd3aGF0d2ctZmV0Y2gvZmV0Y2guanMnKTtcblxuY29uc3QgdGFnID0gcmVxdWlyZSgnLi90YWcuanMnKTtcbmNvbnN0IEVsZW1lbnQgPSByZXF1aXJlKCcuL2VsZW1lbnQuanMnKTtcbnJlcXVpcmUoJy4vYXBwLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzLkVsZW1lbnQgPSBFbGVtZW50O1xubW9kdWxlLmV4cG9ydHMudGFnID0gdGFnO1xubW9kdWxlLmV4cG9ydHMuZmlyZUV2ZW50ID0gcmVxdWlyZSgnLi9maXJlLWV2ZW50LmpzJyk7XG5cbiIsIi8vIHBvbHlmaWxsXG5yZXF1aXJlKCd3ZWJjb21wb25lbnRzLmpzL0N1c3RvbUVsZW1lbnRzLmpzJyk7XG5cbmlmICghd2luZG93LmN1c3RvbUVsZW1lbnRzKSB7XG4gIHdpbmRvdy5jdXN0b21FbGVtZW50cyA9IHtcbiAgICBkZWZpbmU6IGZ1bmN0aW9uIChuYW1lLCBlbGVtKSB7XG4gICAgICBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQobmFtZSwgZWxlbSk7XG4gICAgfVxuICB9O1xufVxuXG4iLCJjb25zdCBDb21waWxlciA9IHJlcXVpcmUoJy4vY29tcGlsZXInKTtcbmNvbnN0IEluY3JlbWVudGFsRE9NID0gcmVxdWlyZSgnaW5jcmVtZW50YWwtZG9tL2Rpc3QvaW5jcmVtZW50YWwtZG9tLmpzJyk7XG5jb25zdCBBZ2dyZWdhdG9yID0gcmVxdWlyZSgnLi9hZ2dyZWdhdG9yLmpzJyk7XG5jb25zdCBFbGVtZW50ID0gcmVxdWlyZSgnLi9lbGVtZW50LmpzJyk7XG5cbnZhciB1bndyYXBDb21tZW50ID0gL1xcL1xcKiE/KD86XFxAcHJlc2VydmUpP1sgXFx0XSooPzpcXHJcXG58XFxuKShbXFxzXFxTXSo/KSg/OlxcclxcbnxcXG4pXFxzKlxcKlxcLy87XG5cbmNvbnN0IGtub3duT3B0cyA9IFtcbiAgJ3RlbXBsYXRlJyxcbiAgJ2FjY2Vzc29ycycsXG4gICdkZWZhdWx0JyxcbiAgJ2V2ZW50cycsXG4gICdpbml0aWFsaXplJyxcbiAgJ21ldGhvZHMnXG5dO1xuY29uc3Qga25vd25PcHRNYXAgPSB7fTtcbmtub3duT3B0cy5mb3JFYWNoKGUgPT4ge1xuICBrbm93bk9wdE1hcFtlXSA9IGU7XG59KTtcblxuZnVuY3Rpb24gdGFnKHRhZ05hbWUsIG9wdHMpIHtcbiAgZm9yIChjb25zdCBrZXkgaW4gb3B0cykge1xuICAgIGlmICgha25vd25PcHRNYXBba2V5XSkge1xuICAgICAgdGhyb3cgYFVua25vd24gb3B0aW9ucyBmb3Igc2oudGFnOiAke3RhZ05hbWV9OiR7a2V5fShLbm93biBrZXlzOiAke2tub3duT3B0c30pYDtcbiAgICB9XG4gIH1cblxuICBsZXQgdGVtcGxhdGU7XG5cbiAgY29uc3QgZWxlbWVudENsYXNzID0gY2xhc3MgZXh0ZW5kcyBFbGVtZW50IHtcbiAgICB0ZW1wbGF0ZSgpIHtcbiAgICAgIGlmICghdGVtcGxhdGUpIHtcbiAgICAgICAgaWYgKHR5cGVvZihvcHRzLnRlbXBsYXRlKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHRlbXBsYXRlID0gdW53cmFwQ29tbWVudC5leGVjKG9wdHMudGVtcGxhdGUudG9TdHJpbmcoKSlbMV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGVtcGxhdGUgPSBvcHRzLnRlbXBsYXRlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxuXG4gICAgZGVmYXVsdCgpIHtcbiAgICAgIHJldHVybiBvcHRzLmRlZmF1bHQgfHwge307XG4gICAgfVxuXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgIC8vIHNldCBldmVudCBsaXN0ZW5lcnNcbiAgICAgIGlmIChvcHRzLmV2ZW50cykge1xuICAgICAgICBmb3IgKGNvbnN0IGV2ZW50IGluIG9wdHMuZXZlbnRzKSB7XG4gICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBvcHRzLmV2ZW50c1tldmVudF0uYmluZCh0aGlzKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChvcHRzLmluaXRpYWxpemUpIHtcbiAgICAgICAgb3B0cy5pbml0aWFsaXplLmFwcGx5KHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBpZiAob3B0cy5tZXRob2RzKSB7XG4gICAgZm9yIChjb25zdCBuYW1lIGluIG9wdHMubWV0aG9kcykge1xuICAgICAgZWxlbWVudENsYXNzLnByb3RvdHlwZVtuYW1lXSA9IG9wdHMubWV0aG9kc1tuYW1lXTtcbiAgICB9XG4gIH1cblxuICBpZiAob3B0cy5hY2Nlc3NvcnMpIHtcbiAgICBmb3IgKGNvbnN0IG5hbWUgaW4gb3B0cy5hY2Nlc3NvcnMpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50Q2xhc3MucHJvdG90eXBlLCBuYW1lLCB7XG4gICAgICAgIGdldDogb3B0cy5hY2Nlc3NvcnNbbmFtZV0uZ2V0LFxuICAgICAgICBzZXQ6IG9wdHMuYWNjZXNzb3JzW25hbWVdLnNldFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgY3VzdG9tRWxlbWVudHMuZGVmaW5lKHRhZ05hbWUsIGVsZW1lbnRDbGFzcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdGFnO1xuXG4iLCJyZXF1aXJlKCcuL3Rlc3QtY29tcGlsZS5qcycpO1xucmVxdWlyZSgnLi90ZXN0LXN1aXRlLmpzJyk7XG5yZXF1aXJlKCcuL3Rlc3QtYWdncmVnYXRvci5qcycpO1xucmVxdWlyZSgnLi90ZXN0LWVsZW1lbnQuanMnKTtcblxuIiwiY29uc3QgdGVzdCA9IHJlcXVpcmUoJ3F1bml0anMnKS50ZXN0O1xuY29uc3QgQWdncmVnYXRvciA9IHJlcXVpcmUoJy4uL3NyYy9hZ2dyZWdhdG9yJyk7XG5cbnRlc3QoJ2lucHV0JywgKHQpID0+IHtcbiAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGRpdi5pbm5lckhUTUwgPSAnPGlucHV0IHNqLW1vZGVsPVwidGhpcy5ob2dlXCIgdmFsdWU9XCJpeWFuXCI+JztcbiAgY29uc3Qgc2NvcGUgPSB7fTtcbiAgbmV3IEFnZ3JlZ2F0b3IoZGl2KS5hZ2dyZWdhdGUoc2NvcGUpO1xuICB0LmRlZXBFcXVhbChzY29wZSwge1xuICAgIGhvZ2U6ICdpeWFuJ1xuICB9KTtcbn0pO1xuXG50ZXN0KCdpbnB1dChjaGVja2JveCknLCAodCkgPT4ge1xuICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZGl2LmlubmVySFRNTCA9IGBcbiAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIHNqLW1vZGVsPVwidGhpcy5hXCIgY2hlY2tlZD1cImNoZWNrZWRcIj5cbiAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIHNqLW1vZGVsPVwidGhpcy5iXCI+XG4gIGA7XG4gIGNvbnN0IHNjb3BlID0ge307XG4gIG5ldyBBZ2dyZWdhdG9yKGRpdikuYWdncmVnYXRlKHNjb3BlKTtcbiAgdC5kZWVwRXF1YWwoc2NvcGUsIHtcbiAgICBhOiB0cnVlLFxuICAgIGI6IGZhbHNlXG4gIH0pO1xufSk7XG5cbnRlc3QoJ2lucHV0KGVtcHR5KScsICh0KSA9PiB7XG4gIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkaXYuaW5uZXJIVE1MID0gJzxpbnB1dCBzai1tb2RlbD1cInRoaXMuaG9nZVwiIHZhbHVlPVwiXCI+JztcbiAgY29uc3Qgc2NvcGUgPSB7fTtcbiAgbmV3IEFnZ3JlZ2F0b3IoZGl2KS5hZ2dyZWdhdGUoc2NvcGUpO1xuICB0LmRlZXBFcXVhbChzY29wZSwge1xuICAgIGhvZ2U6ICcnXG4gIH0pO1xufSk7XG5cbnRlc3QoJ2lucHV0KHJlcGVhdCknLCAodCkgPT4ge1xuICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZGl2LmlubmVySFRNTCA9IGBcbiAgPGRpdiBzai1yZXBlYXQ9XCJpdGVtIGluIHRoaXMuaXRlbXNcIj5cbiAgICA8aW5wdXQgc2otbW9kZWw9XCJpdGVtLmhvZ2VcIiB2YWx1ZT1cIlwiPlxuICA8L2Rpdj5gO1xuICBjb25zdCBzY29wZSA9IHt9O1xuICBuZXcgQWdncmVnYXRvcihkaXYpLmFnZ3JlZ2F0ZShzY29wZSk7XG4gIHQuZGVlcEVxdWFsKHNjb3BlLCB7IH0pO1xufSk7XG5cbnRlc3QoJ3RleHRhcmVhJywgKHQpID0+IHtcbiAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGRpdi5pbm5lckhUTUwgPSAnPHRleHRhcmVhIHNqLW1vZGVsPVwidGhpcy5ob2dlXCI+aXlhbjwvdGV4dGFyZWE+JztcbiAgY29uc3Qgc2NvcGUgPSB7fTtcbiAgbmV3IEFnZ3JlZ2F0b3IoZGl2KS5hZ2dyZWdhdGUoc2NvcGUpO1xuICB0LmRlZXBFcXVhbChzY29wZSwge1xuICAgIGhvZ2U6ICdpeWFuJ1xuICB9KTtcbn0pO1xuXG50ZXN0KCdzZWxlY3QnLCAodCkgPT4ge1xuICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZGl2LmlubmVySFRNTCA9ICc8c2VsZWN0IHNqLW1vZGVsPVwidGhpcy5ob2dlXCI+PG9wdGlvbiB2YWx1ZT1cIml5YW5cIiBjaGVja2VkPml5YW48L29wdGlvbj48L3NlbGVjdD4nO1xuICBjb25zdCBzY29wZSA9IHt9O1xuICBuZXcgQWdncmVnYXRvcihkaXYpLmFnZ3JlZ2F0ZShzY29wZSk7XG4gIHQuZGVlcEVxdWFsKHNjb3BlLCB7XG4gICAgaG9nZTogJ2l5YW4nXG4gIH0pO1xufSk7XG5cbiIsIi8vIHZhciB0ZXN0ID0gcmVxdWlyZSgndGFwZScpO1xuY29uc3QgdGVzdCA9IHJlcXVpcmUoJ3F1bml0anMnKS50ZXN0O1xudmFyIENvbXBpbGVyID0gcmVxdWlyZSgnLi4vc3JjL2NvbXBpbGVyJyk7XG5jb25zdCBJbmNyZW1lbnRhbERPTSA9IHJlcXVpcmUoJ2luY3JlbWVudGFsLWRvbS9kaXN0L2luY3JlbWVudGFsLWRvbS5qcycpO1xuXG50ZXN0KCdmb28nLCAodCkgPT4ge1xuICBjb25zb2xlLmxvZyhcIkFIXCIpO1xuICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGRpdi5pbm5lckhUTUwgPSAnPGRpdiBpZD1cImZvb1wiPjwvZGl2Pic7XG4gIGNvbnN0IGNvZGUgPSBuZXcgQ29tcGlsZXIoKS5jb21waWxlKGRpdik7XG4gIHZhciB0YXJnZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0YXJnZXQnKTtcbiAgdGFyZ2V0LnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgSW5jcmVtZW50YWxET00ucGF0Y2godGFyZ2V0LCAoKSA9PiB7XG4gICAgY29kZS5hcHBseSh0YXJnZXQsIFtJbmNyZW1lbnRhbERPTV0pO1xuICB9KTtcbiAgdC5lcXVhbCh0YXJnZXQucXVlcnlTZWxlY3RvcignZGl2JykuZ2V0QXR0cmlidXRlKCdpZCcpLCAnZm9vJyk7XG59KTtcbnRlc3QoJ3NqLWlmJywgKHQpID0+IHtcbiAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkaXYuaW5uZXJIVE1MID0gYFxuICAgIDxkaXYgaWQ9XCJmb29cIiBzai1pZj1cInRoaXMuZm9vXCI+PC9kaXY+XG4gICAgPGRpdiBpZD1cImJhclwiIHNqLWlmPVwidGhpcy5iYXJcIj48L2Rpdj5cbiAgYDtcbiAgY29uc3QgY29kZSA9IG5ldyBDb21waWxlcigpLmNvbXBpbGUoZGl2KTtcbiAgdmFyIHRhcmdldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RhcmdldCcpO1xuICB0YXJnZXQudXBkYXRlID0gZnVuY3Rpb24gKCkgeyB9O1xuICB0YXJnZXQuZm9vID0gdHJ1ZTtcbiAgSW5jcmVtZW50YWxET00ucGF0Y2godGFyZ2V0LCAoKSA9PiB7XG4gICAgY29kZS5hcHBseSh0YXJnZXQsIFtJbmNyZW1lbnRhbERPTV0pO1xuICB9KTtcbiAgdC5vayh0YXJnZXQucXVlcnlTZWxlY3RvcignI2ZvbycpKTtcbiAgdC5vayghdGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJyNiYXInKSk7XG59KTtcbnRlc3QoJ3NqLXJlcGVhdCcsICh0KSA9PiB7XG4gIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZGl2LmlubmVySFRNTCA9IGBcbiAgICA8ZGl2IHNqLXJlcGVhdD1cImJvb2sgaW4gdGhpcy5ib29rc1wiIGNsYXNzPVwib3V0ZXJcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJib29rXCIgc2otYmluZD1cImJvb2submFtZVwiPjwvZGl2PlxuICAgIDwvZGl2PlxuICBgO1xuICBjb25zdCBjb2RlID0gbmV3IENvbXBpbGVyKCkuY29tcGlsZShkaXYpO1xuXG4gIHZhciB0YXJnZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0YXJnZXQnKTtcbiAgdGFyZ2V0LnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgdGFyZ2V0LmJvb2tzID0gW3tuYW1lOiAnaG9nZSd9LCB7bmFtZTogJ2Z1Z2EnfV07XG5cbiAgSW5jcmVtZW50YWxET00ucGF0Y2godGFyZ2V0LCAoKSA9PiB7XG4gICAgY29kZS5hcHBseSh0YXJnZXQsIFtJbmNyZW1lbnRhbERPTV0pO1xuICB9KTtcblxuICBjb25zb2xlLmxvZyh0YXJnZXQuaW5uZXJIVE1MKTtcblxuICBjb25zdCBib29rcyA9IHRhcmdldC5xdWVyeVNlbGVjdG9yQWxsKCcuYm9vaycpO1xuICB0LmVxdWFsKGJvb2tzLmxlbmd0aCwgMik7XG4gIHQuZXF1YWwodGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwoJy5vdXRlcicpLmxlbmd0aCwgMSk7XG59KTtcbnRlc3QoJ3NqLXJlcGVhdCBhcnJheSBrdicsICh0KSA9PiB7XG4gIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZGl2LmlubmVySFRNTCA9IGBcbiAgICA8ZGl2IHNqLXJlcGVhdD1cIihpLGJvb2spIGluIHRoaXMuYm9va3NcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJib29rXCI+PHNwYW4gc2otYmluZD1cImlcIj48L3NwYW4+OjxzcGFuIHNqLWJpbmQ9XCJib29rLm5hbWVcIj48L3NwYW4+PC9kaXY+XG4gICAgPC9kaXY+XG4gIGA7XG4gIGNvbnN0IGNvZGUgPSBuZXcgQ29tcGlsZXIoKS5jb21waWxlKGRpdik7XG5cbiAgdmFyIHRhcmdldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RhcmdldCcpO1xuICB0YXJnZXQudXBkYXRlID0gZnVuY3Rpb24gKCkgeyB9O1xuICB0YXJnZXQuYm9va3MgPSBbe25hbWU6ICdob2dlJ30sIHtuYW1lOiAnZnVnYSd9XTtcblxuICBJbmNyZW1lbnRhbERPTS5wYXRjaCh0YXJnZXQsICgpID0+IHtcbiAgICBjb2RlLmFwcGx5KHRhcmdldCwgW0luY3JlbWVudGFsRE9NXSk7XG4gIH0pO1xuXG4gIGNvbnN0IGJvb2tzID0gdGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwoJy5ib29rJyk7XG4gIHQuZXF1YWwoYm9va3MubGVuZ3RoLCAyKTtcbiAgdC5lcXVhbChib29rc1swXS50ZXh0Q29udGVudCwgJzA6aG9nZScpO1xuICB0LmVxdWFsKGJvb2tzWzFdLnRleHRDb250ZW50LCAnMTpmdWdhJyk7XG59KTtcbnRlc3QoJ3NqLXJlcGVhdChvYmplY3QpJywgKHQpID0+IHtcbiAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkaXYuaW5uZXJIVE1MID0gYFxuICAgIDxkaXYgc2otcmVwZWF0PVwiKHgseSkgaW4gdGhpcy5vYmpcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJpdGVtXCIgc2otY2xpY2s9XCJ0aGlzLnJlc3VsdC5wdXNoKHgpXCI+PHNwYW4gc2otYmluZD1cInhcIj48L3NwYW4+OjxzcGFuIHNqLWJpbmQ9XCJ5XCI+PC9zcGFuPjwvZGl2PlxuICAgIDwvZGl2PlxuICBgO1xuICBjb25zdCBjb2RlID0gbmV3IENvbXBpbGVyKCkuY29tcGlsZShkaXYpO1xuXG4gIHZhciB0YXJnZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0YXJnZXQnKTtcbiAgdGFyZ2V0LnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgdGFyZ2V0Lm9iaiA9IHtcbiAgICBhOiAnYicsXG4gICAgYzogJ2QnXG4gIH07XG4gIHRhcmdldC5yZXN1bHQgPSBbXTtcblxuICBJbmNyZW1lbnRhbERPTS5wYXRjaCh0YXJnZXQsICgpID0+IHtcbiAgICBjb2RlLmFwcGx5KHRhcmdldCwgW0luY3JlbWVudGFsRE9NXSk7XG4gIH0pO1xuXG4gIGNvbnN0IGl0ZW1zID0gdGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwoJy5pdGVtJyk7XG4gIHQuZXF1YWwoaXRlbXMubGVuZ3RoLCAyKTtcblxuICBmb3IgKGxldCBpPTA7IGk8aXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICBpdGVtc1tpXS5jbGljaygpO1xuICB9XG4gIHQuZGVlcEVxdWFsKHRhcmdldC5yZXN1bHQsIFsnYScsICdjJ10pO1xufSk7XG50ZXN0KCdzai1jbGljaycsICh0KSA9PiB7XG4gIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZGl2LmlubmVySFRNTCA9IGBcbiAgICA8ZGl2IHNqLWNsaWNrPVwidGhpcy5jYWxsZWQgPSB0cnVlXCI+PC9kaXY+XG4gIGA7XG4gIGNvbnN0IGNvZGUgPSBuZXcgQ29tcGlsZXIoKS5jb21waWxlKGRpdik7XG5cbiAgdmFyIHRhcmdldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RhcmdldCcpO1xuICB0YXJnZXQudXBkYXRlID0gZnVuY3Rpb24gKCkgeyB9O1xuICB0YXJnZXQuYm9va3MgPSBbe25hbWU6ICdob2dlJ30sIHtuYW1lOiAnZnVnYSd9XTtcblxuICBJbmNyZW1lbnRhbERPTS5wYXRjaCh0YXJnZXQsICgpID0+IHtcbiAgICBjb2RlLmFwcGx5KHRhcmdldCwgW0luY3JlbWVudGFsRE9NXSk7XG4gIH0pO1xuXG4gIHRhcmdldC5xdWVyeVNlbGVjdG9yKCdkaXYnKS5jbGljaygpO1xuXG4gIHQub2sodGFyZ2V0LmNhbGxlZCk7XG59KTtcbnRlc3QoJ3NqLWRpc2FibGVkJywgKHQpID0+IHtcbiAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkaXYuaW5uZXJIVE1MID0gYFxuICAgIDxkaXYgY2xhc3M9XCJ0XCIgc2otZGlzYWJsZWQ9XCJ0cnVlXCI+PC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImZcIiBzai1kaXNhYmxlZD1cImZhbHNlXCI+PC9kaXY+XG4gIGA7XG4gIGNvbnN0IGNvZGUgPSBuZXcgQ29tcGlsZXIoKS5jb21waWxlKGRpdik7XG5cbiAgdmFyIHRhcmdldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RhcmdldCcpO1xuICB0YXJnZXQudXBkYXRlID0gZnVuY3Rpb24gKCkgeyB9O1xuXG4gIEluY3JlbWVudGFsRE9NLnBhdGNoKHRhcmdldCwgKCkgPT4ge1xuICAgIGNvZGUuYXBwbHkodGFyZ2V0LCBbSW5jcmVtZW50YWxET01dKTtcbiAgfSk7XG5cbiAgdC5lcXVhbCh0YXJnZXQucXVlcnlTZWxlY3RvcignLnQnKS5nZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJyksICdkaXNhYmxlZCcpO1xuICB0Lm9rKCF0YXJnZXQucXVlcnlTZWxlY3RvcignLmYnKS5nZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJykpO1xufSk7XG50ZXN0KCdzai1iaW5kJywgKHQpID0+IHtcbiAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkaXYuaW5uZXJIVE1MID0gYFxuICAgIDxkaXYgc2otYmluZD1cInRoaXMuZm9vXCI+PC9kaXY+XG4gIGA7XG4gIGNvbnN0IGNvZGUgPSBuZXcgQ29tcGlsZXIoKS5jb21waWxlKGRpdik7XG5cbiAgdmFyIHRhcmdldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RhcmdldCcpO1xuICB0YXJnZXQudXBkYXRlID0gZnVuY3Rpb24gKCkgeyB9O1xuICB0YXJnZXQuZm9vID0gJ2Zvbyc7XG5cbiAgSW5jcmVtZW50YWxET00ucGF0Y2godGFyZ2V0LCAoKSA9PiB7XG4gICAgY29kZS5hcHBseSh0YXJnZXQsIFtJbmNyZW1lbnRhbERPTV0pO1xuICB9KTtcblxuICB0Lm9rKHRhcmdldC5pbm5lckhUTUwubWF0Y2goL2Zvby8pKTtcbn0pO1xudGVzdCgnbmVzdGVkIGZvcicsICh0KSA9PiB7XG4gIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZGl2LmlubmVySFRNTCA9IGBcbiAgICA8ZGl2IHNqLXJlcGVhdD1cImJsb2cgaW4gdGhpcy5ibG9nc1wiPlxuICAgICAgPGRpdiBzai1yZXBlYXQ9XCJlbnRyeSBpbiBibG9nLmVudHJpZXNcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImJvb2tcIj48c3BhbiBzai1iaW5kPVwiZW50cnkudGl0bGVcIj48L3NwYW4+OjxzcGFuIHNqLWJpbmQ9XCIkaW5kZXhcIj48L3NwYW4+PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgYDtcbiAgY29uc3QgY29kZSA9IG5ldyBDb21waWxlcigpLmNvbXBpbGUoZGl2KTtcblxuICB2YXIgdGFyZ2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGFyZ2V0Jyk7XG4gIHRhcmdldC51cGRhdGUgPSBmdW5jdGlvbiAoKSB7IH07XG4gIHRhcmdldC5ibG9ncyA9IFtcbiAgICB7ZW50cmllczogW1xuICAgICAge3RpdGxlOidob2dlJ30sXG4gICAgICB7dGl0bGU6J2hpZ2UnfVxuICAgIF19LFxuICAgIHtlbnRyaWVzOiBbXG4gICAgICB7dGl0bGU6J2Z1Z2EnfSxcbiAgICAgIHt0aXRsZTonZmlnYSd9XG4gICAgXX0sXG4gIF07XG5cbiAgSW5jcmVtZW50YWxET00ucGF0Y2godGFyZ2V0LCAoKSA9PiB7XG4gICAgY29kZS5hcHBseSh0YXJnZXQsIFtJbmNyZW1lbnRhbERPTV0pO1xuICB9KTtcblxuICB0Lm9rKHRhcmdldC5pbm5lckhUTUwubWF0Y2goL2hvZ2UvKSk7XG4gIHQub2sodGFyZ2V0LmlubmVySFRNTC5tYXRjaCgvZnVnYS8pKTtcbn0pO1xudGVzdCgnbmVzdGVkIGZvcicsICh0KSA9PiB7XG4gIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZGl2LmlubmVySFRNTCA9IGBcbiAgICA8ZGl2IHNqLXJlcGVhdD1cImJsb2cgaW4gdGhpcy5ibG9nc1wiPlxuICAgICAgPGRpdiBzai1yZXBlYXQ9XCJlbnRyeSBpbiBibG9nLmVudHJpZXNcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImJvb2tcIiBzai1jbGljaz1cInRoaXMucmVzdWx0LnB1c2goJGluZGV4KVwiPjxzcGFuIHNqLWJpbmQ9XCJlbnRyeS50aXRsZVwiPjwvc3Bhbj46PHNwYW4gc2otYmluZD1cIiRpbmRleFwiPjwvc3Bhbj48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICBgO1xuICBjb25zdCBjb2RlID0gbmV3IENvbXBpbGVyKCkuY29tcGlsZShkaXYpO1xuXG4gIHZhciB0YXJnZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0YXJnZXQnKTtcbiAgdGFyZ2V0LnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgdGFyZ2V0LmJsb2dzID0gW1xuICAgIHtlbnRyaWVzOiBbXG4gICAgICB7dGl0bGU6J2hvZ2UnfSxcbiAgICAgIHt0aXRsZTonaGlnZSd9XG4gICAgXX0sXG4gICAge2VudHJpZXM6IFtcbiAgICAgIHt0aXRsZTonZnVnYSd9LFxuICAgICAge3RpdGxlOidmaWdhJ31cbiAgICBdfSxcbiAgXTtcbiAgdGFyZ2V0LnJlc3VsdCA9IFtdO1xuXG4gIEluY3JlbWVudGFsRE9NLnBhdGNoKHRhcmdldCwgKCkgPT4ge1xuICAgIGNvZGUuYXBwbHkodGFyZ2V0LCBbSW5jcmVtZW50YWxET01dKTtcbiAgfSk7XG4gIGNvbnN0IGJvb2tzID0gdGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwoJy5ib29rJyk7XG4gIGZvciAobGV0IGk9MDsgaTxib29rcy5sZW5ndGg7IGkrKykge1xuICAgIGJvb2tzW2ldLmNsaWNrKCk7XG4gIH1cbiAgdC5kZWVwRXF1YWwodGFyZ2V0LnJlc3VsdCwgWzAsMSwwLDFdKTtcbn0pO1xudGVzdCgndGV4dCcsICh0KSA9PiB7XG4gIGNvbnN0IGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKCk7XG4gIGNvbnN0IHMgPSBbXCJcXG5cIiwgYFwiYF07XG4gIGZvciAobGV0IGk9MCwgbD1zLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICBjb25zdCBtID0gc1tpXTtcbiAgICB0LmVxdWFsKGV2YWwoY29tcGlsZXIudGV4dChtKSksIG0pO1xuICB9XG59KTtcbnRlc3QoJ3NqLWNsYXNzJywgKHQpID0+IHtcbiAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkaXYuaW5uZXJIVE1MID0gYFxuICAgIDxkaXYgc2otY2xhc3M9J3RoaXMua2xhc3MnPlxuICAgIDwvZGl2PlxuICBgO1xuICBjb25zdCBjb2RlID0gbmV3IENvbXBpbGVyKCkuY29tcGlsZShkaXYpO1xuXG4gIHZhciB0YXJnZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0YXJnZXQnKTtcbiAgdGFyZ2V0LnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgdGFyZ2V0LmtsYXNzID0gWydhJywgJ2InXTtcblxuICBJbmNyZW1lbnRhbERPTS5wYXRjaCh0YXJnZXQsICgpID0+IHtcbiAgICBjb2RlLmFwcGx5KHRhcmdldCwgW0luY3JlbWVudGFsRE9NXSk7XG4gIH0pO1xuXG4gIGNvbnN0IGdvdCA9IHRhcmdldC5xdWVyeVNlbGVjdG9yKCdkaXYnKTtcbiAgdC5kZWVwRXF1YWwoZ290LmdldEF0dHJpYnV0ZSgnY2xhc3MnKSwgJ2EgYicpO1xufSk7XG4iLCJ2YXIgdGVzdCA9IHJlcXVpcmUoJ3F1bml0anMnKS50ZXN0O1xudmFyIEVsZW1lbnQgPSByZXF1aXJlKCcuLi9zcmMvZWxlbWVudC5qcycpO1xucmVxdWlyZSgnLi4vc3JjL3BvbHlmaWxsLmpzJyk7XG5cbnRlc3QoJ2VzNicsIHQgPT4ge1xuICBjdXN0b21FbGVtZW50cy5kZWZpbmUoJ3Rlc3QtZXM2JywgY2xhc3MgZXh0ZW5kcyBFbGVtZW50IHtcbiAgICB0ZW1wbGF0ZSgpIHtcbiAgICAgIHJldHVybiBgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc2otbW9kZWw9XCJ0aGlzLmZpbHRlclwiIHZhbHVlPVwiaG9nZVwiPmA7XG4gICAgfVxuICB9KTtcblxuICBjb25zdCBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVzdC1lczYnKTtcbiAgdC5lcXVhbChlbGVtLmZpbHRlciwgJ2hvZ2UnKTtcbn0pO1xuXG4iLCJ2YXIgdGVzdCA9IHJlcXVpcmUoJ3F1bml0anMnKS50ZXN0O1xudmFyIHNqID0gcmVxdWlyZSgnLi4vc3JjL21haW4uanMnKTtcblxuZnVuY3Rpb24gcnVuVGVzdCh0YWdOYW1lLCBlbGVtZW50Q2xhc3MsIGNvZGUpIHtcbiAgdGVzdCh0YWdOYW1lLCBmdW5jdGlvbiAodCkge1xuICAgIHZhciBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcbiAgICBjb2RlLmFwcGx5KGVsZW0sIFt0LCB0YWdOYW1lXSk7XG4gIH0pO1xufVxuXG4vLyBzaW11bGF0ZSBvbmNoYW5nZSBldmVudFxuLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yODU2NTEzL2hvdy1jYW4taS10cmlnZ2VyLWFuLW9uY2hhbmdlLWV2ZW50LW1hbnVhbGx5XG5mdW5jdGlvbiBpbnZva2VFdmVudChlbGVtLCBuYW1lKSB7XG4gIGlmIChcImNyZWF0ZUV2ZW50XCIgaW4gZG9jdW1lbnQpIHtcbiAgICB2YXIgZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJIVE1MRXZlbnRzXCIpO1xuICAgIGV2dC5pbml0RXZlbnQobmFtZSwgZmFsc2UsIHRydWUpO1xuICAgIGVsZW0uZGlzcGF0Y2hFdmVudChldnQpO1xuICB9IGVsc2Uge1xuICAgIGVsZW0uZmlyZUV2ZW50KGBvbiR7bmFtZX1gKTtcbiAgfVxufVxuXG50ZXN0KCdleHBvcnQnLCBmdW5jdGlvbiAodCkge1xuICB0Lm9rKHNqLnRhZywgJ3NqLnRhZycpO1xuICB0Lm9rKHNqLkVsZW1lbnQsICdzai5FbGVtZW50Jyk7XG59KTtcblxucnVuVGVzdCgndGVzdC1pbnB1dC12YWx1ZScsIHNqLnRhZygndGVzdC1pbnB1dC12YWx1ZScsIHtcbiAgdGVtcGxhdGU6IGZ1bmN0aW9uKCkgey8qXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc2otbW9kZWw9XCJ0aGlzLmZpbHRlclwiIHZhbHVlPVwiaG9nZVwiPlxuICAqL31cbn0pLCBmdW5jdGlvbiAodCwgdGFnTmFtZSkge1xuICB2YXIgaW5wdXQgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0Jyk7XG5cbiAgdC5lcXVhbChpbnB1dC52YWx1ZSwgJ2hvZ2UnLCAnaW5wdXQudmFsdWUnKTtcbiAgdC5lcXVhbCh0aGlzLmZpbHRlciwgJ2hvZ2UnLCB0YWdOYW1lKTtcbn0pO1xuXG5ydW5UZXN0KCd0ZXN0LWRpc2FibGVkJywgc2oudGFnKCd0ZXN0LWRpc2FibGVkJywge1xuICB0ZW1wbGF0ZTogZnVuY3Rpb24oKSB7LypcbiAgICAgIDxkaXYgc2otZGlzYWJsZWQ9XCJ0aGlzLmZcIj5mPC9kaXY+XG4gICAgICA8ZGl2IHNqLWRpc2FibGVkPVwidGhpcy50XCI+dDwvZGl2PlxuICAqL30sXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMudCA9IHRydWU7XG4gICAgdGhpcy5mID0gZmFsc2U7XG4gIH1cbn0pLCBmdW5jdGlvbiAodCwgdGFnTmFtZSkge1xuICB2YXIgZGl2cyA9IHRoaXMucXVlcnlTZWxlY3RvckFsbCgnZGl2Jyk7XG4gIHQub2soZGl2cy5sZW5ndGggPT0gMiwgdGFnTmFtZSk7XG4gIHQub2soIWRpdnNbMF0uZ2V0QXR0cmlidXRlKCdkaXNhYmxlZCcpLCB0YWdOYW1lKTtcbiAgdC5vayhkaXZzWzFdLmdldEF0dHJpYnV0ZSgnZGlzYWJsZWQnKT09PSdkaXNhYmxlZCcsIHRhZ05hbWUpO1xufSk7XG5cbi8vIHJlZ3Jlc3Npb24gdGVzdFxucnVuVGVzdCgndGVzdC1tdWx0aS1hdHRyaWJ1dGVzJywgc2oudGFnKCd0ZXN0LW11bHRpLWF0dHJpYnV0ZXMnLCB7XG4gIHRlbXBsYXRlOiBmdW5jdGlvbigpIHsvKlxuICAgICAgPGRpdiBjbGFzcz1cImJcIiBzai1yZXBlYXQ9XCJ4IGluIHRoaXMuYm9va3NcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPSdib29rJz48c3BhbiBzai1iaW5kPVwieC5uYW1lXCI+PC9zcGFuPjwvZGl2PlxuICAgICAgPC9kaXY+XG4gICovfSxcbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5ib29rcyA9IFt7XCJuYW1lXCI6XCJmb29cIn0sIHtcIm5hbWVcIjpcImJhclwifV07XG4gIH1cbn0pLCBmdW5jdGlvbiAodCwgdGFnTmFtZSkge1xuICB0LmVxdWFsKHRoaXMucXVlcnlTZWxlY3RvckFsbCgnZGl2LmJvb2snKS5sZW5ndGgsIDIsIHRhZ05hbWUpO1xufSk7XG5cbnJ1blRlc3QoJ3Rlc3QtZXZlbnRzJywgc2oudGFnKCd0ZXN0LWV2ZW50cycsIHtcbiAgdGVtcGxhdGU6IGZ1bmN0aW9uKCkgey8qXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBpZD1cImNsaWNrVGVzdFwiIHNqLWNsaWNrPVwidGhpcy5idG5jbGljaygkZXZlbnQpXCI+eWF5PC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKi99LFxuICBtZXRob2RzOiB7XG4gICAgYnRuY2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5jbGlja2VkID0gdHJ1ZTtcbiAgICB9XG4gIH1cbn0pLCBmdW5jdGlvbiAodCkge1xuICB2YXIgZWxlbSA9IHRoaXMucXVlcnlTZWxlY3RvcihcIiNjbGlja1Rlc3RcIik7XG4gIGVsZW0uY2xpY2soKTtcblxuICB0Lm9rKCEhdGhpcy5jbGlja2VkKTtcbn0pO1xuXG5ydW5UZXN0KCd0ZXN0LXNldC1hdHRycycsIHNqLnRhZygndGVzdC1zZXQtYXR0cnMnLCB7XG4gIHRlbXBsYXRlOiAnPGRpdiBzai1iaW5kPVwidGhpcy5mb29cIj48L2Rpdj4nXG59KSwgZnVuY3Rpb24gKHQsIHRhZ05hbWUpIHtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoJ2ZvbycsICdiYXInKTtcbiAgdC5lcXVhbCh0aGlzLnF1ZXJ5U2VsZWN0b3IoJ2RpdicpLnRleHRDb250ZW50LCAnYmFyJyk7XG59KTtcblxucnVuVGVzdCgndGVzdC1pbnB1dCcsIHNqLnRhZygndGVzdC1pbnB1dCcsIHtcbiAgdGVtcGxhdGU6IGZ1bmN0aW9uICgpIHsvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoMT5JbnB1dDwvaDE+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgbmFtZT1cIm5hbWVcIiBzai1tb2RlbD1cInRoaXMubmFtZVwiIGlkPVwibXlJbnB1dFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEhlbGxvLCA8c3BhbiBzai1iaW5kPVwidGhpcy5uYW1lXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICovfVxufSksIGZ1bmN0aW9uICh0LCB0YWdOYW1lKSB7XG4gIHZhciBpbnB1dCA9IHRoaXMucXVlcnlTZWxlY3RvcignaW5wdXQnKTtcbiAgaW5wdXQudmFsdWUgPSAnZm9vJztcblxuICBpbnZva2VFdmVudChpbnB1dCwgJ2lucHV0Jyk7XG5cbiAgdC5vayh0aGlzLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4nKS50ZXh0Q29udGVudCA9PT0gXCJmb29cIiwgdGFnTmFtZSk7XG59KTtcblxucnVuVGVzdCgndGVzdC1pbnB1dC1jaGVja2JveCcsIHNqLnRhZygndGVzdC1pbnB1dC1jaGVja2JveCcsIHtcbiAgdGVtcGxhdGU6IGZ1bmN0aW9uICgpIHsvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzcz0nYScgdHlwZT1cImNoZWNrYm94XCIgc2otbW9kZWw9XCJ0aGlzLmFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgc2otbW9kZWw9XCJ0aGlzLmJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAqL31cbn0pLCBmdW5jdGlvbiAodCwgdGFnTmFtZSkge1xuICBjb25zdCBhPXRoaXMucXVlcnlTZWxlY3RvcignLmEnKTtcbiAgYS5jaGVja2VkID0gdHJ1ZTtcblxuICBpbnZva2VFdmVudChhLCAnY2hhbmdlJyk7XG5cbiAgdC5lcXVhbCh0aGlzLmEsIHRydWUsICd0aGlzLmEgaXMgY2hlY2tlZCcpO1xuICB0LmVxdWFsKHRoaXMuYiwgZmFsc2UpO1xufSk7XG5cbnJ1blRlc3QoJ3Rlc3QtaW5wdXQtbmVzdGVkJywgc2oudGFnKCd0ZXN0LWlucHV0LW5lc3RlZCcsIHtcbiAgdGVtcGxhdGU6IGZ1bmN0aW9uICgpIHsvKlxuICAgIDxoMT5JbnB1dDwvaDE+XG4gICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgbmFtZT1cIm5hbWVcIiBzai1tb2RlbD1cInRoaXMueC55XCIgaWQ9XCJteUlucHV0XCI+XG4gICAgSGVsbG8sIDxzcGFuIHNqLW1vZGVsPVwidGhpcy5uYW1lXCI+PC9zcGFuPlxuICAqL30sXG4gIGRlZmF1bHQ6IHtcbiAgICB4OiB7IH1cbiAgfSxcbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy54ID0ge1xuICAgICAgeTogM1xuICAgIH07XG4gIH1cbn0pLCBmdW5jdGlvbiAodCwgdGFnTmFtZSkge1xuICB2YXIgaW5wdXQgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0Jyk7XG4gIGlucHV0LnZhbHVlID0gJ2Zvbyc7XG5cbiAgaW52b2tlRXZlbnQoaW5wdXQsICdpbnB1dCcpO1xuXG4gIHQub2sodGhpcy54LnkgPT09ICdmb28nLCB0YWdOYW1lKTtcbn0pO1xuXG5ydW5UZXN0KCd0ZXN0LXRleHRhcmVhJywgc2oudGFnKCd0ZXN0LXRleHRhcmVhJywge1xuICB0ZW1wbGF0ZTogZnVuY3Rpb24gKCkgey8qXG4gICAgPGgxPlRleHRhcmVhPC9oMT5cbiAgICA8dGV4dGFyZWEgbmFtZT1cImhvZ2VcIiBzai1tb2RlbD1cInRoaXMuaG9nZVwiPjwvdGV4dGFyZWE+XG4gICAgSGVsbG8sIDxzcGFuIHNqLWJpbmQ9XCJ0aGlzLmhvZ2VcIj48L3NwYW4+XG4gICovfVxufSksIGZ1bmN0aW9uICh0LCB0YWdOYW1lKSB7XG4gIHZhciBpbnB1dCA9IHRoaXMucXVlcnlTZWxlY3RvcigndGV4dGFyZWEnKTtcbiAgaW5wdXQudmFsdWUgPSBcImZvb1wiO1xuICBpbnZva2VFdmVudChpbnB1dCwgJ2lucHV0Jyk7XG5cbiAgdC5vayh0aGlzLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4nKS50ZXh0Q29udGVudCA9PT0gXCJmb29cIiwgdGFnTmFtZSk7XG59KTtcblxucnVuVGVzdCgndGVzdC1mcm9tLWNvbnRyb2xsZXInLCBzai50YWcoJ3Rlc3QtZnJvbS1jb250cm9sbGVyJywge1xuICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmhvZ2Vob2dlID0gXCJmb29cIjtcbiAgfSxcbiAgdGVtcGxhdGU6IGZ1bmN0aW9uKCkgey8qXG4gICAgPGgxPlBhc3NlZCBmcm9tIGNvbnRyb2xsZXI8L2gxPlxuICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIG5hbWU9XCJiYXJcIiBzai1tb2RlbD1cInRoaXMuaG9nZWhvZ2VcIj5cbiAgKi99XG59KSwgZnVuY3Rpb24gKHQsIHRhZ05hbWUpIHtcbiAgdC5vayh0aGlzLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0JykudmFsdWUgPT09IFwiZm9vXCIsIHRhZ05hbWUpO1xufSk7XG5cbnJ1blRlc3QoJ3Rlc3Qtc2VsZWN0Jywgc2oudGFnKCd0ZXN0LXNlbGVjdCcsIHtcbiAgdGVtcGxhdGU6IGZ1bmN0aW9uICgpIHsvKlxuICAgIDxoMT5TZWxlY3Q8L2gxPlxuICAgIDxzZWxlY3Qgc2otbW9kZWw9XCJ0aGlzLnNzc1wiPlxuICAgIDxvcHRpb24gdmFsdWU9XCJwcHBcIj5wcHA8L29wdGlvbj5cbiAgICA8b3B0aW9uIHZhbHVlPVwicXFxXCI+cXFxPC9vcHRpb24+XG4gICAgPC9zZWxlY3Q+XG4gICAgU1NTOiA8c3BhbiBzai1iaW5kPVwidGhpcy5zc3NcIj48L3NwYW4+XG4gICovfVxufSksIGZ1bmN0aW9uICh0LCB0YWdOYW1lKSB7XG4gIHQuZXF1YWwodGhpcy5xdWVyeVNlbGVjdG9yKCdzcGFuJykudGV4dENvbnRlbnQsIFwicHBwXCIpO1xufSk7XG5cbnJ1blRlc3QoJ3Rlc3QtZm9yJywgc2oudGFnKCd0ZXN0LWZvcicsIHtcbiAgdGVtcGxhdGU6IGZ1bmN0aW9uKCkgey8qXG4gICAgPGgxPmJhcjwvaDE+XG4gICAgPGRpdiBzai1yZXBlYXQ9XCJ4IGluIHRoaXMuYmFyXCI+XG4gICAgPGRpdiBjbGFzcz1cIml0ZW1cIiBzai1iaW5kPVwieC5ib29cIj48L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKi99LFxuICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5iYXIgPSBbXG4gICAgICB7Ym9vOiA0NjQ5fSxcbiAgICAgIHtib286IDF9LFxuICAgICAge2JvbzogMn0sXG4gICAgICB7Ym9vOiAzfVxuICAgIF07XG4gIH1cbn0pLCBmdW5jdGlvbiAodCwgdGFnTmFtZSkge1xuICB2YXIgZWxlbXMgPSB0aGlzLnF1ZXJ5U2VsZWN0b3JBbGwoJ2Rpdi5pdGVtJyk7XG4gIHQub2soZWxlbXMubGVuZ3RoID09IDQgJiYgZWxlbXNbMF0udGV4dENvbnRlbnQgPT0gXCI0NjQ5XCIgJiYgZWxlbXNbMV0udGV4dENvbnRlbnQgPT09ICcxJyAmJlxuICAgICAgICBlbGVtc1syXS50ZXh0Q29udGVudCA9PT0gJzInICYmIGVsZW1zWzNdLnRleHRDb250ZW50ID09PSAnMycsIHRhZ05hbWUpO1xufSk7XG5cbnJ1blRlc3QoJ3Rlc3QtZm9yLWluZGV4Jywgc2oudGFnKCd0ZXN0LWZvci1pbmRleCcsIHtcbiAgdGVtcGxhdGU6IGZ1bmN0aW9uICgpIHsvKlxuICAgIDxoMT5Gb3IgaW5kZXg8L2gxPlxuICAgIDxkaXYgc2otcmVwZWF0PVwieCBpbiB0aGlzLmJhclwiPlxuICAgIDxkaXYgY2xhc3M9XCJpdGVtXCI+PHNwYW4gc2otYmluZD1cInguYm9vXCI+PC9zcGFuPjo8c3BhbiBzai1iaW5kPVwiJGluZGV4XCI+PC9zcGFuPjwvZGl2PlxuICAgIDwvZGl2PlxuICAqL30sXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmJhciA9IFtcbiAgICAgIHtib286IDQ2NDl9LFxuICAgICAge2JvbzogMX0sXG4gICAgICB7Ym9vOiAyfSxcbiAgICAgIHtib286IDN9XG4gICAgXTtcbiAgfVxufSksIGZ1bmN0aW9uICh0LCB0YWdOYW1lKSB7XG4gIHZhciBlbGVtcyA9IHRoaXMucXVlcnlTZWxlY3RvckFsbCgnZGl2Lml0ZW0nKTtcbiAgdC5vayhlbGVtcy5sZW5ndGggPT0gNCAmJiBlbGVtc1swXS50ZXh0Q29udGVudCA9PSBcIjQ2NDk6MFwiICYmIGVsZW1zWzFdLnRleHRDb250ZW50ID09PSAnMToxJyAmJlxuICAgICAgICBlbGVtc1syXS50ZXh0Q29udGVudCA9PT0gJzI6MicgJiYgZWxlbXNbM10udGV4dENvbnRlbnQgPT09ICczOjMnLCB0YWdOYW1lKTtcbn0pO1xuXG5ydW5UZXN0KCd0ZXN0LWZvci1lbXB0eScsIHNqLnRhZygndGVzdC1mb3ItZW1wdHknLCB7XG4gIHRlbXBsYXRlOiBmdW5jdGlvbiAoKSB7LypcbiAgICA8aDE+c2otcmVwZWF0IHdpdGggZW1wdHkgdmFsdWU8L2gxPlxuICAgIDxkaXYgc2otcmVwZWF0PVwieCBpbiB0aGlzLmJhclwiPlxuICAgIDxkaXYgY2xhc3M9XCJpdGVtXCIgc2otbW9kZWw9XCJ4LmJvb1wiPnJlcGxhY2UgaGVyZTwvZGl2PlxuICAgIDwvZGl2PlxuICAqL30sXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYmFyID0gW107XG4gIH1cbn0pLCBmdW5jdGlvbiAodCwgdGFnTmFtZSkge1xuICB2YXIgZWxlbXMgPSB0aGlzLnF1ZXJ5U2VsZWN0b3JBbGwoJ2Rpdi5pdGVtJyk7XG4gIHQub2soZWxlbXMubGVuZ3RoID09IDAsIHRhZ05hbWUpO1xufSk7XG5cbnJ1blRlc3QoJ3Rlc3QtaWYnLCBzai50YWcoJ3Rlc3QtaWYnLCB7XG4gIHRlbXBsYXRlOiBmdW5jdGlvbiAoKSB7LypcbiAgICA8aDE+VGVzdCBpZjwvaDE+XG4gICAgPGRpdiBzai1pZj1cInRoaXMuZ2V0RmFsc2UoKVwiPkZBTFNFPC9kaXY+XG4gICAgPGRpdiBzai1pZj1cInRoaXMuZ2V0VHJ1ZSgpXCI+VFJVRTwvZGl2PlxuICAqL30sXG4gIG1ldGhvZHM6IHtcbiAgICBnZXRUcnVlOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0sXG4gICAgZ2V0RmFsc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG59KSwgZnVuY3Rpb24gKHQsIHRhZ05hbWUpIHtcbiAgdmFyIGVsZW1zID0gdGhpcy5xdWVyeVNlbGVjdG9yQWxsKCdkaXYnKTtcbiAgdC5vayhlbGVtcy5sZW5ndGggPT0gMSAmJiBlbGVtc1swXS50ZXh0Q29udGVudCA9PT0gJ1RSVUUnLCB0YWdOYW1lKTtcbn0pO1xuXG5ydW5UZXN0KCd0ZXN0LWlmLWFycmF5Jywgc2oudGFnKCd0ZXN0LWlmLWFycmF5Jywge1xuICB0ZW1wbGF0ZTogZnVuY3Rpb24oKSB7LypcbiAgICByZXR1cm4gYFxuICAgIDxoMT5UZXN0IGlmPC9oMT5cbiAgICA8ZGl2IHNqLXJlcGVhdD1cInggaW4gdGhpcy5iYXJcIj5cbiAgICAgIDxkaXYgc2otaWY9XCJ0aGlzLm1hdGNoZWQoeClcIiBjbGFzcz1cInRhcmdldFwiIHNqLWJpbmQ9XCJ4LmZvb1wiPjwvZGl2PlxuICAgIDwvZGl2PlxuICAqL30sXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmJhciA9IFt7XCJmb29cIjoxfV07XG4gIH0sXG4gIG1ldGhvZHM6IHtcbiAgICBtYXRjaGVkOiBmdW5jdGlvbiAoeCkge1xuICAgICAgcmV0dXJuIHguZm9vID09IDE7XG4gICAgfVxuICB9XG59KSwgZnVuY3Rpb24gKHQsIHRhZ05hbWUpIHtcbiAgdmFyIGVsZW1zID0gdGhpcy5xdWVyeVNlbGVjdG9yQWxsKCdkaXYudGFyZ2V0Jyk7XG4gIHQub2soZWxlbXMubGVuZ3RoID09PSAxICYmIGVsZW1zWzBdLnRleHRDb250ZW50ID09PSAnMScsIHRhZ05hbWUpO1xufSk7XG5cbnJ1blRlc3QoJ3Rlc3QtdGV4dC12YXInLCBzai50YWcoJ3Rlc3QtdGV4dC12YXInLCB7XG4gIHRlbXBsYXRlOiBmdW5jdGlvbigpIHsvKlxuICAgIDxoMT5UZXN0IHRleHQgdmFyPC9oMT5cbiAgICA8ZGl2PkhlbGxvLCA8c3BhbiBzai1iaW5kPVwidGhpcy5uYW1lXCI+PC9zcGFuPjwvZGl2PlxuICAqL30sXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLm5hbWUgPSAnSm9obic7XG4gIH1cbn0pLCBmdW5jdGlvbiAodCwgdGFnTmFtZSkge1xuICB2YXIgZWxlbSA9IHRoaXMucXVlcnlTZWxlY3RvcignZGl2Jyk7XG4gIHQub2soZWxlbS50ZXh0Q29udGVudCA9PT0gJ0hlbGxvLCBKb2huJywgdGFnTmFtZSk7XG59KTtcblxucnVuVGVzdCgndGVzdC1maWx0ZXInLCBzai50YWcoJ3Rlc3QtZmlsdGVyJywge1xuICB0ZW1wbGF0ZTogZnVuY3Rpb24oKSB7LypcbiAgICA8aDE+VGVzdCBmaWx0ZXI8L2gxPlxuICAgIDxkaXYgc2otaWY9XCJ0aGlzLmZpbHRlcih0aGlzLngueSlcIj5IZWxsbzwvZGl2PlxuICAgIDxkaXYgc2otaWY9XCJ0aGlzLmZpbHRlcih0aGlzLngueilcIj5IaTwvZGl2PlxuICAqL30sXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnggPSB7XG4gICAgICB5OiB0cnVlLFxuICAgICAgejogZmFsc2VcbiAgICB9O1xuICAgIHRoaXMuZmlsdGVyID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgIHJldHVybiBlO1xuICAgIH07XG4gIH1cbn0pLCBmdW5jdGlvbiAodCwgdGFnTmFtZSkge1xuICB2YXIgZWxlbXMgPSB0aGlzLnF1ZXJ5U2VsZWN0b3JBbGwoJ2RpdicpO1xuICB0Lm9rKGVsZW1zLmxlbmd0aCA9PT0gMSAmJiBlbGVtc1swXS50ZXh0Q29udGVudCA9PT0gJ0hlbGxvJywgdGFnTmFtZSk7XG59KTtcblxucnVuVGVzdCgndGVzdC1jb21tZW50Jywgc2oudGFnKCd0ZXN0LWNvbW1lbnQnLCB7XG4gIHRlbXBsYXRlOiBmdW5jdGlvbiAoKSB7LypcbiAgICA8aDE+VGVzdCBjb21tZW50PC9oMT5cbiAgICA8IS0tIGZvbyAtLT5cbiAgKi99XG59KSwgZnVuY3Rpb24gKHQsIHRhZ05hbWUpIHtcbiAgdC5vayh0aGlzLnF1ZXJ5U2VsZWN0b3IoJ2gxJyksIHRhZ05hbWUpO1xufSk7XG5cbnJ1blRlc3QoJ3Rlc3Qtc2FuaXRpemUtaHJlZicsIHNqLnRhZygndGVzdC1zYW5pdGl6ZS1ocmVmJywge1xuICB0ZW1wbGF0ZTogZnVuY3Rpb24gKCkgey8qXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgY2xhc3M9J3Vuc2FmZScgc2otaHJlZj1cInRoaXMuaHJlZlwiPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBjbGFzcz0ndW5zYWZlMicgc2otaHJlZj1cIidqc2NyaXB0OmFsZXJ0KDMpJ1wiPjwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBjbGFzcz0ndW5zYWZlMycgc2otaHJlZj1cIid2aWV3LXNvdXJjZTphbGVydCgzKSdcIj48L2E+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgY2xhc3M9J3NhZmUnIHNqLWhyZWY9XCInaHR0cDovL2V4YW1wbGUuY29tJ1wiPjwvYT5cbiAgKi99LFxuICBkZWZhdWx0OiB7XG4gICAgJ2hyZWYnOiAnamF2YXNjcmlwdDp0aGlzLng9MycsXG4gICAgeDogNVxuICB9XG59KSwgZnVuY3Rpb24gKHQsIHRhZ05hbWUpIHtcbiAgdC5lcXVhbCh0aGlzLnF1ZXJ5U2VsZWN0b3IoJ2EudW5zYWZlJykuZ2V0QXR0cmlidXRlKCdocmVmJyksICd1bnNhZmU6amF2YXNjcmlwdDp0aGlzLng9MycpO1xuICB0LmVxdWFsKHRoaXMucXVlcnlTZWxlY3RvcignYS51bnNhZmUyJykuZ2V0QXR0cmlidXRlKCdocmVmJyksICd1bnNhZmU6anNjcmlwdDphbGVydCgzKScpO1xuICB0LmVxdWFsKHRoaXMucXVlcnlTZWxlY3RvcignYS51bnNhZmUzJykuZ2V0QXR0cmlidXRlKCdocmVmJyksICd1bnNhZmU6dmlldy1zb3VyY2U6YWxlcnQoMyknKTtcbiAgdC5lcXVhbCh0aGlzLnF1ZXJ5U2VsZWN0b3IoJ2Euc2FmZScpLmdldEF0dHJpYnV0ZSgnaHJlZicpLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG59KTtcblxucnVuVGVzdCgndGVzdC1iaW5kJywgc2oudGFnKCd0ZXN0LWJpbmQnLCB7XG4gIHRlbXBsYXRlOiBmdW5jdGlvbiAoKSB7LypcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBzai1iaW5kPVwidGhpcy50ZXh0XCI+PC9zcGFuPlxuICAqL30sXG4gIGRlZmF1bHQ6IHtcbiAgICAndGV4dCc6ICc8eG1wPmhvZ2UnXG4gIH1cbn0pLCBmdW5jdGlvbiAodCwgdGFnTmFtZSkge1xuICBjb25zb2xlLmxvZyh0aGlzLm91dGVySFRNTCk7XG4gIHQub2sodGhpcy5xdWVyeVNlbGVjdG9yKCdzcGFuJykub3V0ZXJIVE1MLm1hdGNoKC9cXCZsdDt4bXAmZ3Q7aG9nZS8pKTtcbn0pO1xuXG5ydW5UZXN0KCd0ZXN0LXNqLWF0dHInLCBzai50YWcoJ3Rlc3Qtc2otYXR0cicsIHtcbiAgdGVtcGxhdGU6IGZ1bmN0aW9uICgpIHsvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIHNqLWF0dHItZGF0YS1mb289XCI1OTYzXCI+PC9zcGFuPlxuICAqL31cbn0pLCBmdW5jdGlvbiAodCwgdGFnTmFtZSkge1xuICB0LmVxdWFsKHRoaXMucXVlcnlTZWxlY3Rvcignc3BhbicpLmdldEF0dHJpYnV0ZSgnZGF0YS1mb28nKSwgJzU5NjMnKTtcbn0pO1xuXG5ydW5UZXN0KCd0ZXN0LWZpcmVFdmVudCcsIHNqLnRhZygndGVzdC1maXJlZXZlbnQnLCB7XG4gIHRlbXBsYXRlOiBmdW5jdGlvbiAoKSB7LypcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PjwvZGl2PlxuICAqL30sXG4gIGV2ZW50czoge1xuICAgIGZvbzogZnVuY3Rpb24gKCRldmVudCkge1xuICAgICAgdGhpcy5nb3RFdmVudCA9ICRldmVudC5kZXRhaWw7XG4gICAgfVxuICB9XG59KSwgZnVuY3Rpb24gKHQsIHRhZ05hbWUpIHtcbiAgc2ouZmlyZUV2ZW50KHRoaXMsICdmb28nLCB7XG4gICAgZGV0YWlsOiB7aGVsbG86ICduaWNrJ31cbiAgfSk7XG4gIHQuZGVlcEVxdWFsKHRoaXMuZ290RXZlbnQsIHtoZWxsbzogJ25pY2snfSk7XG59KTtcblxuIl19
