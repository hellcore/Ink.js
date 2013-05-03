
Ink.createModule('Ink.UI.Toggle', '1',
    ['Ink.UI.Aux_1','Ink.Dom.Event_1','Ink.Dom.Css_1','Ink.Dom.Element_1','Ink.Dom.Selector_1'],
    function(Aux, Event, Css, Element, Selector) {

    'use strict';

    /**
     * @module Ink.UI.Toggle_1
     */

    var Toggle = function( selector, options ){

        if( typeof selector !== 'string' && typeof selector !== 'object' ){
            throw '[Ink.UI.Toggle] Invalid CSS selector to determine the root element';
        }

        if( typeof selector === 'string' ){
            this._rootElement = Selector.select( selector );
            if( this._rootElement.length <= 0 ){
                throw '[Ink.UI.Toggle] Root element not found';
            }

            this._rootElement = this._rootElement[0];
        } else {
            this._rootElement = selector;
        }

        this._options = Ink.extendObj({
            target : undefined,
            triggerEvent: 'click'
        },Element.data(this._rootElement));

        this._options = Ink.extendObj(this._options,options || {});

        if( typeof this._options.target === 'undefined' ){
            throw '[Ink.UI.Toggle] Target option not defined';
        }

        this._childElement = Selector.select( this._options.target, this._rootElement );
        if( this._childElement.length <= 0 ){
            if( this._childElement.length <= 0 ){
                this._childElement = Selector.select( this._options.target, this._rootElement.parentNode );
            }

            if( this._childElement.length <= 0 ){
                this._childElement = Selector.select( this._options.target );
            }

            if( this._childElement.length <= 0 ){
                return;
            }
        }
        this._childElement = this._childElement[0];

        this._init();

    };


    Toggle.prototype = {
        _init: function(){

            this._accordion = ( Css.hasClassName(this._rootElement.parentNode,'accordion') || Css.hasClassName(this._childElement.parentNode,'accordion') );

            Event.observe( this._rootElement, this._options.triggerEvent, Ink.bindEvent(this._onTriggerEvent,this) );
            Event.observe( document, 'click', Ink.bindEvent(this._onClick,this));
        },

        _onTriggerEvent: function( event ){
            Event.stop( event );

            if( this._accordion ){
                var elms, i, accordionElement;
                if( Css.hasClassName(this._childElement.parentNode,'accordion') ){
                    accordionElement = this._childElement.parentNode;
                } else {
                    accordionElement = this._childElement.parentNode.parentNode;
                }
                elms = Selector.select('.toggle',accordionElement);
                for( i=0; i<elms.length; i+=1 ){
                    var
                        dataset = Element.data( elms[i] ),
                        targetElm = Selector.select( dataset.target,accordionElement )
                    ;
                    if( (targetElm.length > 0) && (targetElm[0] !== this._childElement) ){
                            targetElm[0].style.display = 'none';
                    }
                }
            }

            var finalClass = ( Css.getStyle(this._childElement,'display') === 'none') ? 'show-all' : 'hide-all';
            var finalDisplay = ( Css.getStyle(this._childElement,'display') === 'none') ? 'block' : 'none';
            Css.removeClassName(this._childElement,'show-all');
            Css.removeClassName(this._childElement, 'hide-all');
            Css.addClassName(this._childElement, finalClass);
            this._childElement.style.display = finalDisplay;
        },

        _onClick: function( event ){
            var tgtEl = Event.element(event);

            if( Element.isAncestorOf( this._rootElement, tgtEl ) ){
                return;
            }

            this._dismiss( this._rootElement );
        },

        _dismiss: function( ){
            if( ( Css.getStyle(this._childElement,'display') === 'none') ){
                return;
            }
            Css.removeClassName(this._childElement, 'show-all');
            Css.addClassName(this._childElement, 'hide-all');
            this._childElement.style.display = 'none';
        }
    };

    return Toggle;

});