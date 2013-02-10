var gamejs = require('gamejs');
var utils = require('./utils');
var sprite = require('./sprite');
var game = require('./game').game;
var Vision = require('./vision').Vision;
var Inventory = require('./inventory/inventory').Inventory; 
var controllers = require('./controllers');
var eventify = require('./lib/events').eventify;
var constants = require('./constants');
var events = require('./events');


var Object = {
    
    //PROPERTIES
    'position':[0, 0],
    'angle':0,
    'sprite_name':'', //base name for sprite
    'sprite':'static', //currently active sprite
    'threadable':true,      //can it be stood/waled on?
    'transparent':true, //can it be seen through?
    'solid': false,     //can projectiles pass through?
    'vision_range':0, 
    'z':0,
    
   
    
    //METHODS
    'init':function(world){
        this.world = world;
        eventify(this);
        this._sprites = {};
        this.set_sprite(this.sprite, true);
        this.vision = null;
        if(this.vision_range){
            this.vision = new Vision(this.world, this);
            this.vision.update(); 
        }
        
        for(key in this){
            if(key!='init' && key.search('init')==0){
                this[key](world);
            }
        }
    },
    
    'destroy':function(){
        this.fire('destroy');  
    },
    
    'get_adjacent_items':function(){
        return this.world.get_adjacent_objects(this.position, 'item');  
    },
    
    'act': controllers.do_nothing,
    
    'set_angle':function(angle){
        this.angle = angle;
        if(this.active_sprite) this.active_sprite.angle = angle;
    },
    
    'get_position_px': function(){
        return [this.position[0] * game.settings.TILE_WIDTH, this.position[1] * game.settings.TILE_WIDTH];  
    },
    
    'draw': function(view){
        if(this.active_sprite) this.active_sprite.draw(view);
    },
    
    'update': function(deltams){
        if(this.active_sprite) this.active_sprite.update(deltams);
        
        for(key in this){
            if(key!='update' && key.search('update')==0){
                this[key](world);
            }
        }
    },

    'can_see': function(pos){
        if(this.vision) return this.vision.visible.get(pos);
        return false;
    },
    
    'hide': function(hide){
        this.teleport([-1, -1]);  
    },

    'teleport':  function(position){
        this.position = position;
        this.snap_sprite();
        if(this.vision) this.vision.update();
        this.fire('teleport', [position]);
    },
    
    'absolute_position':function(relative_position){
        return [this.position[0]+relative_position[0], this.position[1]+relative_position[1]];
    },
    
    'teleport_relative':  function(delta_position){
        this.teleport([this.position[0]+delta_position[0], this.position[1]+delta_position[1]]);
    },
    
    'set_sprite': function(type, snap){
        if(type=='') type='static';
        var prev = this.active_sprite;
        if(!this._sprites[type]){
            this._sprites[type] = sprite.new_sprite(this.sprite_name+'_'+type);
        }
        this.active_sprite = this._sprites[type];
        if(!this.active_sprite) return;
        this.active_sprite.position = prev? prev.position.slice(0): this.get_position_px();
        this.active_sprite.angle = prev? prev.angle : this.angle;
        this.active_sprite.reset();
        if(snap) this.snap_sprite();
    },
    
    'snap_sprite': function(){
        if(this.active_sprite){
            this.active_sprite.position = this.get_position_px();
            this.active_sprite.angle = this.angle;
        }  
    },
    
    'vision_perimeter':function(){
        var retv = [];
        if(this.vision_range){
            for(var mod_x=-1;mod_x<=1;mod_x+2){
                for(var mod_y=-1;mod_y<=1;mod_y+2){
                    for(var i=0;i<this.vision_range;i++){
                        retv.push([i*mod_x, (this.vision_range-i)*mod_y]);
                    }
                }
            }
        }
        return retv;
    },
    
    
};

game.objectmanager.c('object', Object);

var Creature = {
    'max_health':100,
    'health':100,
    'team':'neutral',
    'threadable':false,
    'vision_range':10,
    'inventory_size':10,
    'z':1,
    
    'speed_move': 2,
    'speed_act':1,
    
    'moves_left':2,
    'actions_left':1,
    'turn_in_progress': false,
    
    'can_act': function(){
        return this.moves_left + this.actions_left;  
    },
    
    'end_turn':function(){
        this.moves_left = 0;
        this.actions_left = 0;
    },
    
    'start_turn':function(){
        this.moves_left = this.speed_move;
        this.actions_left = this.speed_act;
        this.fire('start_turn');
    },
    
    'consume_move':function(){
        if(this.moves_left) this.moves_left--;
        else this.consume_action();
        this.fire('consume_move');
    },
    
    'consume_action':function(){
        if(this.actions_left) this.actions_left --;
        else console.log('Consuming action but no actions left!', this);
        this.fire('consume_action');
    },
    
    'move':function(direction){
        if(!(this.moves_left+this.actions_left)) {
            console.log('Trying to move but got no moves left!', this);
        }else{
            var new_pos = utils.mod(this.position, constants.MOVE_MOD[direction]);
            var old_pos = this.position;
            if(this.world.is_tile_threadable(new_pos)){
                var event = new events.ObjectMoveEvent({
                    direction: direction,
                    object: this,
                    owner: this
                });
                
                this.consume_move();
                //finish move instantly if invisible
                if(!this.world.scene.can_see(new_pos) && !this.world.scene.can_see(old_pos)){
                    event.finish();
                } 
                this.world.add_event(event);
                this.fire('move', [new_pos]);
                return event;
            }
        }
        return false;
    },
    
    '_equipment_slots':['weapon', 'armor', 'helmet'],
    
    'act':controllers.roam,
    
    'init_inventory':function(world, data){
        this.inventory = new Inventory(this);
    },
    
    'serialize_inventory':function(data){
        data.inventory = this.inventory.serialize();
    },
    
    'post_load_inventory':function(data){
        data.inventory.forEach(function(objid){
            this.inventory.add(this.world.objects.by_id(objid));
        }, this);
    },
    
    '_requires':'object'  
}

game.objectmanager.c('creature', Creature);
