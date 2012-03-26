#Events


This library is intended to supply an event interface to javascript objects using a Mixin pattern.
The library is designed with encapsulation and uninterupptability in mind. This means a broken function will not stop
the event loop (on modern browsers).


##Features
  1. Easy to integrate - can be used as a mixin, thus making it easy to integrate with any existing codebase.
  2. Fast - On modern browsers (FF, Chrome, Safari and IE > 8) the library uses costume DOM events to handle the events.
  3. Encapsulated - When used on modern browsers, broken functions will not break the event loop.
  4. Supports creating pseudo events (like `:once` and `:latched`).
  5. Comes with built in useful utilities.
  6. Cross-browser - falls back to a more standard costume events handler.

##Usage

The simplest way to enable events support is like this:


    function MyObject(){
        Events.call(this);
    }


This method will introduce the entire events API onto the object.
You could also create an instance of the object:


    var ev = new Events();


Or, if you wish, you could always inherit it:


    obj.prototype = new Events();


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
The library supports a few pseudo events out of the box:

  1. `:once` - when used event will be added once.
  2. `:latched` - see latched section
  3. `:times(number)` - same as once, only it will execute X times (as passed by parameter).
  4. `:delayed(ms)` - on `fireEvent`, will delay X miliseconds before firing the event. On `addEvent` will delay each execution of specific function.


    obj.addEvent('test:once', function(){/* ... */ }); //will add a function to be fired once

    obj.fireEvent('load:latched'); //will fire a latched event

    obj.addEvent('test:times(5)', fn); //will add an event that will remove itself after 5 runs

    obj.addEvent('test:delayed(500)',fn); //will add an event that will wait 500ms before executing when fired

    obj.fireEvent('test:delayed(500)',args); //will wait 500ms before firing the event


You can also add your own pseudo events, by adding them to Events.Pseudoes.
In order to create a new pseudo-event, add an object to the collection, containing either `addEvent` method, `fireEvent` method or both.
You can even add a parameter to the pseudo-event.
The `addEvent` and `fireEvent` methods will be fired *instead* of the default methods. It's arguments will be the same as their default, with a third argument, which is the passed pseudo-parameter (if any).
In order to see more simply look at the code.


###Important note
The library *does not support multiple pseudo events*. This is by design - the pseudo events hide complex logic and function-wrapping.
Doing `addEvent:once:delayed(1000)` might look nice, but hides the fact that it uses 3 levels of function wrapping.
By default, The library would simply fail to assign the pseudo event properly (will try to match `once:delayed` which doesn't exist), and will log an error to the console.
However, you can make the librart throw exceptions for multiple pseudo events by setting the `Events.strict` flag to true.

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
