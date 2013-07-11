/**
 * @module Ink.UI.Tooltip_1
 * @author inkdev AT sapo.pt
 * @version 1
 */
Ink.createModule('Ink.UI.Tooltip', '1', ['Ink.UI.Aux_1', 'Ink.Dom.Event_1', 'Ink.Dom.Element_1', 'Ink.Dom.Selector_1', 'Ink.Util.Array_1', 'Ink.Dom.Browser_1'], function (Aux, InkEvent, InkElement, Selector, InkArray) {
    'use strict';

    /**
     * @class Tooltip
     * @version 1
     */
    function Tooltip (element, options) {
        this._init(element, options || {});
    }

    function EachTooltip(root, elm) {
        this._init(root, elm);
    }

    function ok(v) {  // Sanity check. TODO remove
        if (!v) {throw new Error(v);}
    }

    Tooltip.prototype = {
        _init: function(element, options) {
            var elements;

            this.sto = false;

            this.options = Ink.extendObj({
                    //elementAttr: 'element',
                    where: 'up',
                    zIndex: 10000,
                    hasText: true,
                    left: 10,
                    top: 10,
                    spacing: 8,
                    delay: 0,
                    color: '',
                    template: null,
                    templatefield: null,
                    text: '',
                }, options || {});

            if (typeof element === 'string') {
                elements = Selector.select(element);
            } else if (typeof element === 'object') {
                elements = [element];
            } else {
                throw 'Element expected';
            }

            this.tooltips = [];

            for (var i = 0, len = elements.length; i < len; i++) {
                this.tooltips[i] = new EachTooltip(this, elements[i]);
            }
        },
        destroy: function () {
            InkArray.each(this.tooltips, function (tooltip) {
                tooltip._destroy();
            });
            this.tooltips = null;
            this.options = null;
        }
    };

    EachTooltip.prototype = {
        _oppositeDirections: {
            left: 'right',
            right: 'left',
            up: 'down',
            down: 'up'
        },
        _init: function(root, elm) {
            InkEvent.observe(elm, 'mouseover', Ink.bindEvent(this._onMouseOver, this));
            InkEvent.observe(elm, 'mouseout', Ink.bindEvent(this._onMouseOut, this));
            InkEvent.observe(elm, 'mousemove', Ink.bindEvent(this._onMouseMove, this));

            this.root = root;
            this.element = elm;
            this.tooltip = null;
        },
        _makeTooltip: function (mouseEvent) {  // TODO refactor this into like 20 functions
            var where = this._getOpt('where'),
                template = this._getOpt('template'),  // User template instead of our HTML
                templatefield = this._getOpt('templatefield'),

                tooltip,  // The element we float
                field;  // Element where we write our message. Child or same as the above

            if (template) {  // The user told us of a template to use. We copy it.
                var temp = document.createElement('DIV');
                temp.innerHTML = Aux.elOrSelector(template, 'options.template').outerHTML;
                tooltip = temp.firstChild;
                
                if (templatefield) {
                    field = Selector.select(templatefield, tooltip);
                    if (field) {
                        field = field[0];
                    } else {
                        throw 'options.templatefield must be a valid selector within options.template';
                    }
                } else {
                    field = tooltip;  // Assume same element if user did not specify a field
                }
            } else {  // We create the default structure
                tooltip = document.createElement('DIV');
                tooltip.setAttribute('class', 'ink-tooltip ' + this._getOpt('color'));
                field = document.createElement('DIV');
                field.setAttribute('class', 'content');

                var arrow = document.createElement('SPAN');
                arrow.setAttribute('class', 'arrow ' + this._oppositeDirections[where] || 'left');

                tooltip.appendChild(field);
                tooltip.appendChild(arrow);
            }

            InkElement.setTextContent(field, this._getOpt('text'));
            tooltip.style.display = 'block';
            tooltip.style.zIndex = this._getIntOpt('zIndex');
            
            if (where === 'mousemove' || where === 'mousefix') {
                tooltip.style.position = 'absolute';
                var mPos = this._getMousePosition(mouseEvent);
                this._setPos(mPos[0] + this._getIntOpt('left'), mPos[1] + this._getIntOpt('top'));
                if (document.documentElement) {
                    document.documentElement.appendChild(tooltip);
                }
            } else if (where.match(/(up|down|left|right)/)) {
                tooltip.style.position = 'absolute';

                if (document.documentElement) {
                    document.documentElement.appendChild(tooltip);
                }
                
                var targetElementPos = InkElement.offset2(this.element);
                var tleft = targetElementPos[0],
                    ttop = targetElementPos[1];

                var centerh = (InkElement.elementWidth(this.element) / 2) - (InkElement.elementWidth(tooltip) / 2),
                    centerv = (InkElement.elementHeight(this.element) / 2) - (InkElement.elementHeight(tooltip) / 2);
                var spacing = this._getIntOpt('spacing');
                
                if (where === 'up') {
                    ttop -= InkElement.elementHeight(tooltip);
                    ttop -= spacing;
                    tleft += centerh;
                } else if (where === 'down') {
                    ttop += InkElement.elementHeight(this.element);
                    ttop += spacing;
                    tleft += centerh;
                } else if (where === 'left') {
                    tleft -= InkElement.elementWidth(tooltip);
                    tleft -= spacing;
                    ttop += centerv;
                } else if (where === 'right') {
                    tleft += InkElement.elementWidth(this.element);
                    tleft += spacing;
                    ttop += centerv;
                }

                var scrl = this._getLocalScroll();
                tooltip.style.left = (tleft - scrl[0]) + 'px';
                tooltip.style.top = (ttop - scrl[1]) + 'px';
            }

            if (this.tooltip) {
                InkElement.remove(this.tooltip);
            }
            this.tooltip = tooltip;
        },
        _getOpt: function (option) {
            var dataAttrVal = this.element.getAttribute('data-tip-' + option);
            if (dataAttrVal /* either null or "" may signify the absense of this attribute*/) {
                return dataAttrVal;
            }
            var instanceOption = this.root.options[option];
            if (typeof instanceOption !== 'undefined') {
                return instanceOption;
            }
            ok(false);
        },
        _getIntOpt: function (option) {
            return parseInt(this._getOpt(option), 10);
        },
        _destroy: function () {
            if (this.tooltip) {
                InkElement.remove(this.tooltip);
            }
            if (this.sto) {
                clearTimeout(this.sto);
            }
            this.root = null;  // Cyclic reference = memory leaks
            this.element = null;
            this.tooltip = null;
        },
        _onMouseOver: function(e) {
            if(this.sto) {
                clearTimeout(this.sto);
            }
            
            var cb = Ink.bind(this._makeTooltip, this, e);
            this.sto = setTimeout(cb, this._getIntOpt('delay') * 1000);
            this.active = true;
        },
        _onMouseOut: function() {
            if (this.tooltip) {
                InkElement.remove(this.tooltip);

                if(this.sto) {
                    clearTimeout(this.sto);
                    this.sto = false;
                }

                this.active = false;
            }
            this.tooltip = null;
        },
        _onMouseMove: function(e) {
            if (this.tooltip) {
                if (this._getOpt('where') === 'mousemove' && this.active) {
                    var mPos = this._getMousePosition(e);
                    this._setPos(mPos[0] + this._getIntOpt('left'),
                                 mPos[1] + this._getIntOpt('top'));
                }
            }
        },
        _setPos: function(left, top) {
            var pageDims = this._getPageXY();
            if (this.tooltip) {
                var elmDims = [InkElement.elementWidth(this.tooltip), InkElement.elementHeight(this.tooltip)];
                var scrollDim = this._getScroll();

                if((elmDims[0] + left - scrollDim[0]) >= (pageDims[0] - 20)) {
                    left = (left - elmDims[0] - this._getIntOpt('left') - 10);
                }
                if((elmDims[1] + top - scrollDim[1]) >= (pageDims[1] - 20)) {
                    top = (top - elmDims[1] - this._getIntOpt('top') - 10);
                }

                this.tooltip.style.left = left + 'px';
                this.tooltip.style.top = top + 'px';
            }
        },
        _getPageXY: function() {
            var cWidth = 0;
            var cHeight = 0;
            if( typeof( window.innerWidth ) === 'number' ) {
                cWidth = window.innerWidth;
                cHeight = window.innerHeight;
            } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
                cWidth = document.documentElement.clientWidth;
                cHeight = document.documentElement.clientHeight;
            } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
                cWidth = document.body.clientWidth;
                cHeight = document.body.clientHeight;
            }
            return [parseInt(cWidth, 10), parseInt(cHeight, 10)];
        },
        _getScroll: function() {
            var dd = document.documentElement, db = document.body;
            if (dd && (dd.scrollLeft || dd.scrollTop)) {
                return [dd.scrollLeft, dd.scrollTop];
            } else if (db) {
                return [db.scrollLeft, db.scrollTop];
            } else {
                return [0, 0];
            }
        },
        _getLocalScroll: function () {
            var cumScroll = [0, 0];
            var cursor = this.element.parentNode;
            var left, top;
            while (cursor && cursor !== document.documentElement && cursor !== document.body) {
                left = cursor.scrollLeft;
                top = cursor.scrollTop;
                if (left) {
                    cumScroll[0] += left;
                }
                if (top) {
                    cumScroll[1] += top;
                }
                cursor = cursor.parentNode;
            }
            return cumScroll;
        },
        _getMousePosition: function(e) {
            return [parseInt(InkEvent.pointerX(e), 10), parseInt(InkEvent.pointerY(e), 10)];
        }
    };

    return Tooltip;
});
