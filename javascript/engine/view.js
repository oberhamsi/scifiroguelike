var gamejs = require('gamejs');
var utils = require('./utils');
var game = require('./game').game;

var View = exports.View = function(options){
/*
 * Implements zooming, scrolling  & render utilities
 * 
 */
    
    utils.process_options(this, options, {
       world: utils.required,
       width: game.settings.DISPLAY_SIZE[0],
       height: game.settings.DISPLAY_SIZE[1],
       offset: [0, 0],
       zoom: game.settings.ZOOM
    });
    this.surface = null;
    this.follow = null; //object to center view on
};

View.prototype.move_offset_x = function(x){
    this.set_offset_x(this.offset[0]+x);
};

View.prototype.move_offset_y = function(y){ 
    this.set_offset_x(this.offset[1]+y);
};

View.prototype.set_offset_x = function(x){
    this.offset[0] = Math.max(0, Math.min(x, this.world.map.size_px[0]*this.zoom-parseInt(this.width/this.zoom)));
};

View.prototype.set_offset_y = function(y){
    this.offset[1] = Math.max(0, Math.min(y, this.world.map.size_px[1]*this.zoom-parseInt(this.height/this.zoom)));
};

View.prototype.draw_map_layer_surface = function(surface){
    utils.draw(this.surface, surface, [0,0], [parseInt(this.offset[0]/this.zoom), parseInt(this.offset[1]/this.zoom)], this.zoom);
};

View.prototype.draw_surface = function(surface, dst_position, src_position, src_size){
    var ofst = [dst_position[0] * this.zoom - this.offset[0], dst_position[1] * this.zoom - this.offset[1]];
    utils.draw(this.surface, surface, ofst , src_position, this.zoom, src_size);  
};

View.prototype.update = function(deltams){
    if(this.follow && this.surface){
        var pos = this.follow.active_sprite.position;
        var ds = this.surface.getSize();
        this.set_offset_x(parseInt(pos[0]*this.zoom- ds[0]/2));
        this.set_offset_y(parseInt(pos[1]*this.zoom- ds[1]/2));
    }
};

