#Events


This library is intended to supply an event interface to javascript objects using a Mixin pattern. 


##Features
  1. Easy to integrate - can be used as a mixin, thus making it easy to integrate with any existing codebase.
  2. Fast - On modern browsers (FF, Chrome, Safari and IE > 8) the library uses costume DOM events to handle the events.
  3. Encapsulated - When used on modern browsers, broken functions will not break the event loop.
  4. Advanced use case - supports latched events and adding events once.
  5. Cross-browser - falls back to a more standard costume events handler.

##Usage

The simplest way to enable events support is like this:

    function MyObject(){
        Events.call(this);    
    }

##Methods

###addEvent(type, fn)
Adds a listener. When fired, the function will be passed an event object, with 2 parameters:
  1. args - arguments that were passed by dispatcher.
  2. dispatcher - the object dispatching the event

    obj.addEvent('show',function(e){
        e.dispatcher; //obj
        e.args; //whatever arguments were passed
    });

###fireEvent(type, args)
Dispathces an event, passing arguments:

    obj.fireEvent('show', {counter:1});

###removeEvent(type, fn)
Removes a listener.
    
    obj.removeEvent('show', this.bound.handleShow);

###addEventOnce(type, fn)
Same as `addEvent` only it will remove the listener automatically once dispatched.

##Pseudo events
The library supports 2 specific pseudo events:
  
  1. `:once` - when used event will be added once.
  2. `:latched` - see latched section


    obj.addEvent('test:once', function(){/* ... */ });
    
    obj.fireEvent('load:latched');

You can also add your own pseudo events, by adding them to Events.Pseudoes.
In order to create a new pseudo-event, add an object to the collection, containing either `addEvent` method, `fireEvent` method or both.
You can even add a parameter to the pseudo-event.
For example:

    Events.Pseudoes.delayed = {
        addEvent : function(type, fn, time){
            this.addEvent(type, function(){
                setTimeout(fn, time);    
            });    
        }
    };

This will allow you to do:

    obj.addEvent('test:delayed(1000)', fn);//will fire a delayed event

Some important notes:
  * the `addEvent` method will be fired *instead* of the default `addEvent` method. It's arguments will be `event-type`, the function, and passed parameter (if exists).
  * the `fireEvent` method will be fire *after* the default `fireEvent` method. It's arguments will be `event-type` and the event created by the method.

##Latched events
Latched events are events that once fired once will dispatch automatically afterwards. Examples for such events can be 
a 'load' event, or a 'domready' event. If any arguments were passed, they will be passed on as well. For example:

    obj.fireEvent('load:latched',{someParam:"a"});

    //will be fire automatically
    obj.addEvent('load', function(e){  
        e.args.someParam; //a    
    });


##Cleanup
In case you want to ensure cleanup, the Mixin automatically listens to the `destroy` event and cleans itself up for destruction
