exports.eventify = function(obj){
    obj._callbacks = {};
    
    function evlist(events){
        if( Object.prototype.toString.call( events ) != '[object Array]' ){
            events = [events];
        }
        return events;
    };
    
    obj.on = function(events, callback, context){
        
        evlist(events).forEach(function(event){
            if(!this._callbacks[event]) this._callbacks[event] = [];
            this._callbacks[event].push([callback, context]);
        }, this)
    };
    
    obj.off = function(events, callback, context){
        evlist(events).forEach(function(event){
            if(this._callbacks[event]){
                var nlist = [];
                this._callbacks[event].forEach(function(cb){
                    if(!((cb[0].toString()==callback.toString()) && (cb[1]==context))) nlist.push(cb);
                }, this);
                this._callbacks[event] = nlist;
            } 
        }, this);
    };
    
    obj.fire = function(event, args){
        if(!args) args = [this];
        else args.splice(0, 0, this);
        if(this._callbacks[event]){
            this._callbacks[event].forEach(function(cb){
                cb[0].apply(cb[1], args);
            }, this);
        }
    };
}