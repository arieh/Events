!function(){
    var compat = 'createEvent' in document,
        pseudo_regex = /([^:]+)(?:\:([^(]*)(?:\((.*)\))?)?/,
        addEvent, fireEvent, removeEvent, addEventOnce, Events, fireLatchedEvent;

    //=================
    //    UTILITIES
    //=================

    //utility function for cross-browser
    function indexOf(arr, target){
        var i, item;
        if (arr.indexOf) return arr.indexOf(target);

        for(i=0; item = arr[i]; i++) if (item == target) return i;

        return -1;
    }

    //removes the on* prefix from event names
    function removeOn(string){
        return string.replace(/^on([A-Z])/, function(full, first){
            return first.toLowerCase();
        });
    }

    //returns a structured data object about a type's pseudo-events
    function getPseudo(string){
        var match = string.match(pseudo_regex);

        if (string.split(':').length > 2) throw new RangeError("Library does not support multiple pseudo events");

        return {
            name : match[1],
            pseudo : match[2],
            args : match[3]
        };
    }

    //returns an object with needed type about event type
    function processType(type){
        return getPseudo(removeOn(type));
    }

    //cross-browser function to create event object for fire method
    function createEvent(type, dis, args){
        var ev;

        if (compat){
            ev = document.createEvent('UIEvents');
            ev.initUIEvent(type, false, false, window, 1);
        }else{
            ev = {};
        }

        ev.dispatcher = dis;
        ev.args = args;

        return ev;
    }

    //handles warnings set by the library
    function warn(error){
        if (Events.strict){
            throw new Error(error);    
        }else if (window['console']){
            if (console.error) console.error(error);
            else if (console.warn) console.warn(error);
            else console.log(error);
        }
    }

    /**
     * Events Provider.
     *
     * Can function either as a standalone or a Mixin
     *
     * @param {Element} el element to use as event target. Optional
     *
     */
    Events = function Events(el){
        var $this = this;

        if (!compat){
            this.$events = {};
        }else{
            this.$event_element = el || document.createElement('events');
        }

        this.$latched = {};

        /**
         * Adds an event
         *
         * @param {String}    the event type
         * @param {Function}  a function to add
         *
         * @return this
         */
        this.addEvent = addEvent;

        /**
         * dispatches an event
         *
         * @param {String} event type
         * @param {Mixed}  arguments to pass with the event
         *
         * @return this
         */
        this.fireEvent = fireEvent;

        /**
         * removes a function from an event
         *
         * @param {String}   event type
         * @param {Function} function to remove from stack
         *
         * @return this
         */
        this.removeEvent = removeEvent;

        /**
         * Adds an event for one execution, then removes it
         *
         * @param {String}    the event type
         * @param {Function}  a function to add
         *
         * @return this
         */
        this.addEventOnce = addEventOnce;

        /**
         * Fires a latched event
         *
         * @param {String} the event type
         * @param {Mixed}  arguments to pass with the event
         *
         * @return this
         */
        this.fireLatchedEvent = fireLatchedEvent;

        this.addEvent('destroy',function(){
            $this.$event_element = null;
            $this.$latched = null;
            $this.$events = null;
        });
    };

    //In case someone want to use these
    Events.removeOn = removeOn;
    Events.getPseudos = getPseudo;
    Events.processType = processType;
    Events.strict = false;

    /*
     * Events.Pesudoes allows you to add pseudo behaviors
     *
     * Each object in the collection can hold both addEvent and fireEvent Methods
     *
     * The addEvent method will be fired *instead* of the normal behavior, and will be passed
     * the event type and fn
     *
     * The fireEvent method will be fired *after* the fireEvent method, and will be passed
     * the event name and the event object created
     *
     * Look at examples to see how it can be used
     */
    Events.Pseudoes = {
        once : {
            addEvent : function(type,fn){
                return this.addEventOnce(type, fn);
            }
        },

        latched : {
            fireEvent : function(type, args){
                return this.fireLatchedEvent(type,args);
            }
        },

        times : {
            addEvent : function(type, fn, ammount){
                var count = 0, $this = this;

                this.addEvent(type, function times(){
                    fn.apply(null, arguments);
                    count+=1;
                    if (count == ammount) $this.removeEvent(type,times);
                });
            }
        },

        delayed : {
            addEvent : function(type, fn, delay){
                this.addEvent(type, function(){
                    setTimeout(fn,delay);
                });
            },
            fireEvent : function(type, args, delay){
                var $this = this;
                setTimeout(function(){
                    $this.fireEvent(type, args);
                }, delay);
            }
        }
    };

    //globaly expose Mixin
    this.Events = Events;

    //=======================
    // Function Declarations
    //=======================

    addEvent = compat ?
        function(type,fn){
            var data = processType(type),
                pseudo_fn = Events.Pseudoes[data.pseudo] && Events.Pseudoes[data.pseudo].addEvent,
                args = this.$latched[data.name] && this.$latched[data.name].args,
                ev;

            if (pseudo_fn){
                return pseudo_fn.apply(this,[data.name,fn,data.args]);
            }

            if (this.$latched && this.$latched[data.name]){
                ev = createEvent(data.name, this, args);
                fn.apply(null,[ev]);
            }

            this.$event_element.addEventListener(data.name,fn,false);
            return this;
         } :
         function(type,fn){
            var data = processType(type),
                pseudo_fn = Events.Pseudoes[data.pseudo] && Events.Pseudoes[data.pseudo].addEvent,
                args = this.$latched[data.name] && this.$latched[data.name].args,
                ev;

            if (pseudo_fn){
                return pseudo_fn.apply(this,[data.name,fn,data.args]);
            }

            if (this.$latched && this.$latched[data.name]){
                ev = createEvent(data.name, args);
                fn.apply(null,[ev]);
            }

            if (!this.$events[data.name]) this.$events[data.name] = [fn];
            else this.$evetns[data.name].push(fn);

            return this;
        };

    fireEvent = compat ?
        function(type, args){
            var data = processType(type),
                pseudo_fn = Events.Pseudoes[data.pseudo] && Events.Pseudoes[data.pseudo].fireEvent,
                ev;

            if (pseudo_fn){
                return pseudo_fn.call(this,data.name,args);
            }

            ev = createEvent(data.name, this, args);

            this.$event_element.dispatchEvent(ev);

            return this;
         } :
         function(type, args){
            var data = processType(type),
                pseudo_fn = Events.Pseudoes[data.pseudo] && Events.Pseudoes[data.pseudo].fireEvent,
                ev, i, fn;

            if (pseudo_fn){
                return pseudo_fn.call(this,data.name,args);
            }

            if (!this.$events[data.name]) return this;

            ev = createEvent(data.name, this, args);

            for (i=0; fn = this.$events[data.name]; i++){
                fn.apply(null,[ev]);
            }

            if (pseudo_fn){
                Events.Pseudoes[data.pseudo].fireEvent.call(this,data,ev);
            }

            return this;
         };

    removeEvent = compat ?
        function(type, fn){
            var data = processType(type);

            this.$event_element.removeEventListener(data.name,fn,false);

            return this;
        } : function(type, fn){
            var index,
                data = processType(type);
            if (!this.$events[data.name]) return this;

            index = indexOf(this.$events[data.name],fn);

            if (index <0) return this;

            this.$events[data.name].splice(index,1);

            return this;
        };

    addEventOnce = function(type, fn){
        var $this = this,
            data = processType(type);

        this.addEvent(data.name, function once(e){
            fn.apply(null,[e]);
            $this.removeEvent(data.name,once);
        });

        return this;
    };

    fireLatchedEvent = function(type, args){
        if (!this.$latched) this.$latched = {};

        this.$latched[type] = {args : args};
        this.fireEvent(type,args);

        return this;
    };


}.call(this);

