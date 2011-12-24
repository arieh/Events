!function(ns){
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
        return string.match(/([a-zA-Z.]+)\:([a-zA-Z]*)$/);   
    }

    function processType(string){
        var result = getPseudo(removeOn(type));

        return {
            name : result[0],
            pseudo : result[1]
        };
    }

    addEvent = compat ? 
        function(type,fn){
            var type = processType(type);

            if (this.$latched[type.name]){
                fn.apply(null,[this.$latched[type.name].event]);
                return this;
            };

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
            };

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
                ev = document.createEvent('UIEvents'),
            
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
            var type = processType(type),
            this.$events_element.removeEventListener(type.name,fn,false);

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

    Events = function Events(el){
        var $this = this;

        if (compat){
            this.$events = {};    
        }else{
            this.$events_element = el || document.createElement('events');
        }

        this.$latched = {};

        this.addEvent = addEvent;
        this.fireEvent = fireEvent;
        this.removeEvent = removeEvent;
        this.addEventOnce = addEventOnce;

        this.addEvent('destroy',function(){
            $this.$events_element = null;
        });
    };

    Events.removeOn = removeOn;
    Events.getPseudos = getPseudos;
    Events.processType = processType;

    this.Events = Events;

}.apply(this,[this]);

