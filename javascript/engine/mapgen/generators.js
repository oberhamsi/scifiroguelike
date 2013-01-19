var utils = require('../utils');
var gamejs = require('gamejs');
var pieces = require('./pieces');
var game = require('../game').game;
var random = require('../random');
var Map = require('../maps').Map;
var constants = require('../constants');

var Generator = exports.Generator = function(options){
    utils.process_options(this, options, {
        seed: null
    });
    
    this.rnd = new random.Generator(this.seed);
    this.start_pos = [0, 0];
    Generator.superConstructor.apply(this, [options]);
};

gamejs.utils.objects.extend(Generator, pieces.Piece);

Generator.prototype.get_map = function(){
    return new Map({
        size: this.size,
        walls: this.walls
    })  
};

Generator.prototype.generate = function(){
   //implement!!1  
};

Generator.prototype.fits = function(piece, position){
    var ok = false;
    var p, x, y;
    for(x=0;x<piece.size[0];x++){
        for(y=0;y<piece.size[1];y++){
            p=this.walls.get([position[0]+x, position[1]+y]);
            if(p===false || p===null) return false;    
        }
    }; 
    return true; 
};

Generator.prototype.join = function(piece1, piece1_exit, piece2){
      //find a matching piece2 exit
      var piece2_exit = this.rnd.choose(piece2.perimeter_by_facing(constants.INVERSE[piece1_exit[1]]));
      
      //piece 2 exit global position
      var piece2_exit_pos = piece1.global_pos(piece1_exit[0]);
      
      //piece 2 position
      var piece2_pos = [piece2_exit_pos[0]-piece2_exit[0][0], 
                        piece2_exit_pos[1]-piece2_exit[0][1]];
                        
      if(!this.fits(piece2, piece2_pos)) return false;  
                      
      piece1.add_exit(piece1_exit);
      piece2.add_exit(piece2_exit);
      
      //find out where the rooms touch and remove from perimeter;
      var rect1 = new gamejs.Rect(piece1.position, piece1.size);
      var rect2 = new gamejs.Rect(piece2.position, piece2.size);
      
      var isc = piece1.rect().clip(piece2.rect);
      piece1.remove_perimeter(new gamejs.Rect(piece1.local_pos([isc.x, isc.y]), [isc.width, isc.height]));
      piece2.remove_perimeter(new gamejs.Rect(piece2.local_pos([isc.x, isc.y]), [isc.width, isc.height]));
      
      this.add_piece(piece2, piece2_pos);
      return true;
      
};

var Dungeon = exports.Dungeon = function(options){
    Dungeon.superConstructor.apply(this, [options]);
    
    utils.process_options(this, options, {
        size: utils.required,
        min_room_size:[2, 2],
        max_room_size:[6, 6],
        max_corridor_length:6
    });
    
};

gamejs.utils.objects.extend(Dungeon, Generator);

Dungeon.prototype.add_room = function(){
    console.log('adding room..');
    var t = utils.t();
    //choose a random room
    var old_room = this.rnd.choose(this.children);
    
     
    var exit, room;
    var ok = false;
    var i = 0;
    while(!ok){
        //choose a random exit for this room
        exit = this.rnd.choose(old_room.perimeter); 
        room = this.new_room();
        ok=this.join(old_room, exit, room);
        if(i++ ==100){
            console.log('sorry, couldnt fit a piece :( :( :()))')
            break;
        }
    }
    console.log('done. '+(utils.t()-t));
    
    
};

Dungeon.prototype.new_room = function(){
    return new pieces.Room({
        size: this.rnd.vec(this.min_room_size, this.max_room_size)
    })
}

Dungeon.prototype.generate = function(no_rooms){    
    //place first room in the middle
    var room = this.new_room();
    console.log(this.start_pos);
    this.add_piece(room, this.center_pos(room));
    this.start_pos = room.global_pos([1, 1]);
    for(var i =1;i<no_rooms;i++) this.add_room();
};
