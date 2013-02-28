/**
 * code taken from https://gist.github.com/4540134
 *
 */
!function(){
    function cloneArr(arr){
        return Array.prototype.splice.call(arr,0);
    }
    function Stack(){
        function next(){
            var fn = this.$stack[this.$index++];
            return fn && fn.apply(this, arguments);
        }

        function current(){
            var fn = this.$index === 0 ? this.$stack[this.$index] : this.$stack[this.$index -1];
            return fn && fn.apply(this, arguments);
        }

        function prev(){
            var fn;

            this.$index-=1;
            if (this.$index < 1) this.$index = 1;

            fn = this.$stack[this.$index-1];

            return fn && fn.apply(this, arguments);
        }


        this.$stack = cloneArr(arguments);
        this.$index = 0;

        this.next = next.bind(this);
        this.current = current.bind(this);
        this.prev = prev.bind(this);

        this.reset = function(){
            this.$index = 0;
        };

        this.run = function(){
            next.apply(this,arguments);
        };

        this.$index = 0;

        if (!this.as_object) this.run();
    }

    Stack.prototype.as_object=true;

    this.Stack = Stack;

}.apply(this, []);