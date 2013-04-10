/**
 * @author inkdev AT sapo.pt
 */


Ink.createModule('Ink.Util.Swipe', '1', ['Ink.Dom.Event_1'], function(Event) {

    'use strict';

    /**
     * @class Ink.Util.Swipe
     *
     * <pre>
     * Subscribe swipe gestures!
     * Supports filtering swipes be any combination of the criteria supported in the options.
     * </Pre>
     */

    /**
     * @constructor Ink.Util.Swipe.?
     * @param {String|DOMElement} el
     * @param {Object}            options
     * @... {Function(Object)} callback    required callback function. It receives all the extracted information: elementId, duration, dr, dist, axis
     * @... {optional Number}    minDist     minimum allowed distance, in pixels
     * @... {optional Number}    maxDist     maximum allowed distance, in pixels
     * @... {optional Number}    minDuration minimum allowed duration, in seconds
     * @... {optional Number}    maxDuration maximum allowed duration, in seconds
     * @... {optional String}    forceAxis   if either 'x' or 'y' is passed, only swipes where the dominant axis is the given one trigger the callback
     */
    var Swipe = function(el, options) {

        this._options = Ink.extendObj({
            minDist:        undefined,      // in pixels
            maxDist:        undefined,
            minDuration:    undefined,      // in seconds
            maxDuration:    undefined,
            forceAxis:      undefined,       // x | y
            storeGesture:   false,
            stopEvents:     true
        }, options || {});

        this._handlers = {
            down: Ink.bindEvent(this._onDown, this),
            move: Ink.bindEvent(this._onMove, this),
            up:   Ink.bindEvent(this._onUp, this)
        };

        this._element = Ink.i(el);

        this._init();

    };

    Swipe._supported = ('ontouchstart' in document.documentElement);

    Swipe.prototype = {

        _init: function() {
            var db = document.body;
            Event.observe(db, 'touchstart', this._handlers.down);
            if (this._options.storeGesture) {
                Event.observe(db, 'touchmove', this._handlers.move);
            }
            Event.observe(db, 'touchend', this._handlers.up);
            this._isOn = false;
        },

        _isMeOrParent: function(el, parentEl) {
            if (!el) {
                return;
            }
            do {
                if (el === parentEl) {
                    return true;
                }
                el = el.parentNode;
            } while (el);
            return false;
        },

        _onDown: function(ev) {
            if (event.changedTouches.length !== 1) { return; }
            if (!this._isMeOrParent(ev.target, this._element)) { return; }


            if( this._options.stopEvents === true ){
                Event.stop(ev);
            }
            ev = ev.changedTouches[0];
            this._isOn = true;
            this._target = ev.target;

            this._t0 = new Date().valueOf();
            this._p0 = [ev.pageX, ev.pageY];

            if (this._options.storeGesture) {
                this._gesture = [this._p0];
                this._time    = [0];
            }

        },

        _onMove: function(ev) {
            if (!this._isOn || event.changedTouches.length !== 1) { return; }
            if( this._options.stopEvents === true ){
                Event.stop(ev);
            }
            ev = ev.changedTouches[0];
            var t1 = new Date().valueOf();
            var dt = (t1 - this._t0) * 0.001;
            this._gesture.push([ev.pageX, ev.pageY]);
            this._time.push(dt);
        },

        _onUp: function(ev) {
            if (!this._isOn || event.changedTouches.length !== 1) { return; }

            if( this._options.stopEvents === true ){
                Event.stop(ev);
            }
            ev = ev.changedTouches[0];   // TODO SHOULD CHECK IT IS THE SAME TOUCH
            this._isOn = false;

            var t1 = new Date().valueOf();
            var p1 = [ev.pageX, ev.pageY];
            var dt = (t1 - this._t0) * 0.001;
            var dr = [
                p1[0] - this._p0[0],
                p1[1] - this._p0[1]
            ];
            var dist = Math.sqrt(dr[0]*dr[0] + dr[1]*dr[1]);
            var axis = Math.abs(dr[0]) > Math.abs(dr[1]) ? 'x' : 'y';

            var o = this._options;
            if (o.minDist     && dist <   o.minDist) {     return; }
            if (o.maxDist     && dist >   o.maxDist) {     return; }
            if (o.minDuration && dt   <   o.minDuration) { return; }
            if (o.maxDuration && dt   >   o.maxDuration) { return; }
            if (o.forceAxis   && axis !== o.forceAxis) {   return; }

            var O = {
                elementId: this._element.id,
                duration:  dt,
                dr:        dr,
                dist:      dist,
                axis:      axis,
                target:    this._target
            };

            if (this._options.storeGesture) {
                O.gesture = this._gesture;
                O.time    = this._time;
            }

            this._options.callback(this, O);
        }

    };

    return Swipe;

});
