describe("Events", function(){
    it ("Should add an event, then fire it", function(){
        var evs = new Events(), done = false;

        evs.addEvent('test', function(){
            done = true;    
        });

        evs.fireEvent('test');
        expect(done).toEqual(true, "Event to be fired");
    });

    it ("Should fire all events", function(){
        var evs = new Events(), result = 0;

        function add(){result++;}

        evs.addEvent('test', add);
        evs.addEvent('test', add.bind(null));
        evs.addEvent('test', add.bind(null));
        evs.addEvent('test', add.bind(null));

        evs.fireEvent('test');

        expect(result).toEqual(4, "Events to have fired 4 functions");
    });
    
    it ("Should pass paramaters to event", function(){
        var evs = new Events();

        evs.addEvent('test', function(e){
            expect(JSON.stringify(e.args)).toEqual(JSON.stringify({a:"a",b:"b"}), "Arguments should be passed correctly");
            expect(e.dispatcher).toEqual(evs,"dispatcher should be passed correctly");
        });

        evs.fireEvent('test',{a:"a",b:"b"});
    });

    it ("Should remove event properly", function(){
        var evs = new Events(), counter = 0;

        function count(){counter++;}

        evs.addEvent('test',count);
        evs.fireEvent('test');
        evs.removeEvent('test',count);
        evs.fireEvent('test');

        expect(counter).toEqual(1, "Events should have only cought on once");
        
    });
    
    it ("Should use addEventOnce properly", function(){
        var evs = new Events(), counter =0;      

        function count(){counter++;}

        evs.addEventOnce('test',count);
        evs.fireEvent('test');
        evs.fireEvent('test');

        expect(counter).toEqual(1, "Events should have only cought on once");        
    });

    it ("Should use :once pseudo event properly", function(){  
        var evs = new Events(), counter =0;      

        function count(){counter++;}

        evs.addEvent('test:once',count);
        evs.fireEvent('test');
        evs.fireEvent('test');

        expect(counter).toEqual(1, "Events should have only cought on once"); 
        
    });

    it ("Should use latched properly", function(){
        var evs = new Events(), done = false;

        evs.fireEvent('test:latched',{someParam:'bla'});
        evs.addEvent('test',function(e){
            expect(e.args.someParam).toEqual('bla', "Latched parameters should be passed on properly");
            done = true;
        });

        expect(done).toEqual(true, "latched event should have fired");
        
    });
    
        
});
