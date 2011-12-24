!function(){
    var compat = 'createEvent' in document,
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
        return string.match(/([a-zA-Z.]+)\:([a-zA-Z]*)$/) || [string,string];
    }

    function processType(type){
        var result = getPseudo(removeOn(type));

        return {
            name : result[1],
            pseudo : result[2]
        };
    }

    addEvent = compat ?
        function(type,fn){
            var type = processType(type);

            if (this.$latched[type.name]){
                fn.apply(null,[this.$latched[type.name].event]);
                return this;
            }

            if (type.pseudo == 'once'){
                return this.addEventOnce(type.name,fn);
            }

            this.$event_element.addEventListener(type.name,fn,false);
            return this;
         } :
         function(type,fn){
            var type = processType(type);

            if (this.$latched[type.name]){
                fn.apply(null,[this.$latched[type.name].event]);
                return this;
            }

            if (type.pseudo == 'once'){
                return this.addEventOnce(type.name,fn);
            }

            if (!this.$events[type.name]) this.$events[type.name] = [fn];
            else this.$evetns[type.name].push(fn);

            return this;
        };

    fireEvent = compat ?
        function(type, args){
            var type = processType(type),
                ev = document.createEvent('UIEvents');

            ev.initEvent(type.name, false, false);

            ev.args = args;
            ev.dispatcher = this;

            this.$event_element.dispatchEvent(ev);

            if (type.pseudo == 'latched'){
                this.$latched[type.name] = {
                    event : ev
                };
            }

            return this;
         } :
         function(type, args){
            var type = processType(type),
                ev = {
                    args : args,
                    dispatcher : this
                }, i, fn;

            if (type.pseudo == 'latched'){
                this.$latched[type.name] = {
                    event : ev
                };
            }

            if (!this.$events[type.name]) return this;

            for (i=0; fn = this.$events[type.name]; i++){
                fn.apply(null,[ev]);
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

    this.Events = Events;

}.call(this);

