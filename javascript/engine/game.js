var ComponentEntityManager = require('./lib/cem').ComponentEntityManager;

var Game =  function(){
    this.objectmanager = new ComponentEntityManager();
};

Game.prototype.init = function(settings,  resources){
    /*
     * Global variables & methods
     */
    this.sprite_defs = resources.sprites;
    this.settings = settings;
    this.cache = new (require('./cache').Cache)(resources); //workaround circular ref
    this.scene = null;
    
}

exports.game = window.game = new Game();

