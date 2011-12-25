!function(){
    var compat = 'createEvent' in document,
        pseudo_regex = /([a-zA-Z0-9.]+)(\:([a-zA-Z]*))?(\((.*)\))?/,
        addEvent, fireEvent, removeEvent, addEventOnce, Events;

    function indexOf(arr, target){
        var i, item;
        if (arr.indexOf) return arr.indexOf(target);

        for(i=0; item = arr[i]; i++) if (item == target) return i;

        return -1;
    }

    function removeOn(string){
        return string.replace(/^on([A-Z])/, function(full, first){
            return first.toLowerCase();
        });
    }

    function getPseudo(string){
        var match = string.match(pseudo_regex);
        return {
            name : match[1],
            pseudo : match[3],
            args : match[5]
        };
    }

    function processType(type){
        return getPseudo(removeOn(type));
    }

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

        this.addEvent('destroy',function(){
            $this.$event_element = null;
        });
    };

    Events.removeOn = removeOn;
    Events.getPseudos = getPseudo;
    Events.processType = processType;

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
                if (!this.$latched) this.$latched = {};

                this.$latched[type] = {args : args};
                this.fireEvent(type,args);
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

    this.Events = Events;

    addEvent = compat ?
        function(type,fn){
            var type = processType(type),
                pseudo_fn = Events.Pseudoes[type.pseudo] && Events.Pseudoes[type.pseudo].addEvent, 
                args = this.$latched[type.name] && this.$latched[type.name].args,
                ev;

            if (pseudo_fn){
                return pseudo_fn.apply(this,[type.name,fn,type.args]);
            }

            if (this.$latched && this.$latched[type.name]){
                ev = createEvent(type.name, this, args);
                fn.apply(null,[ev]);
            }

            this.$event_element.addEventListener(type.name,fn,false);
            return this;
         } :
         function(type,fn){
            var type = processType(type),
                pseudo_fn = Events.Pseudoes[type.pseudo] && Events.Pseudoes[type.pseudo].addEvent,
                args = this.$latched[type.name] && this.$latched[type.name].args,
                ev;

            if (pseudo_fn){
                return pseudo_fn.apply(this,[type.name,fn,type.args]);
            }

            if (this.$latched && this.$latched[type.name]){
                ev = createEvent(type.name, args);
                fn.apply(null,[ev]);
            }

            if (!this.$events[type.name]) this.$events[type.name] = [fn];
            else this.$evetns[type.name].push(fn);

            return this;
        };

    fireEvent = compat ?
        function(type, args){
            var type = processType(type),
                pseudo_fn = Events.Pseudoes[type.pseudo] && Events.Pseudoes[type.pseudo].fireEvent,
                ev;
            
            if (pseudo_fn){
                return pseudo_fn.call(this,type.name,args);
            }   
            
            ev = createEvent(type.name, this, args);

            this.$event_element.dispatchEvent(ev);

            return this;
         } :
         function(type, args){
            var type = processType(type),
                pseudo_fn = Events.Pseudoes[type.pseudo] && Events.Pseudoes[type.pseudo].fireEvent,
                ev, i, fn;

            if (pseudo_fn){
                return pseudo_fn.call(this,type.name,args);
            }

            if (!this.$events[type.name]) return this;

            ev = createEvent(type.name, this, args);

            for (i=0; fn = this.$events[type.name]; i++){
                fn.apply(null,[ev]);
            }

            if (pseudo_fn){
                Events.Pseudoes[type.pseudo].fireEvent.call(this,type,ev);
            }

            return this;
         };

    removeEvent = compat ?
        function(type, fn){
            var type = processType(type);

            this.$event_element.removeEventListener(type.name,fn,false);

            return this;
        } : function(type, fn){
            var index,
                type = processType(type);
            if (!this.$events[type.name]) return this;

            index = indexOf(this.$events[type.name],fn);

            if (index <0) return this;

            this.$events[type.name].splice(index,1);

            return this;
        };

    addEventOnce = function(type, fn){
        var $this = this,
            type = processType(type);

        this.addEvent(type.name, function once(e){
            fn.apply(null,[e]);
            $this.removeEvent(type.name,once);
        });
    };


}.call(this);

