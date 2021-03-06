var engine = require('../engine');

engine.game.objectmanager.c('pistol_clip',{
   'sprite_name':'pistol_clip',
   'ammo':8,
   'capacity':8,
   'ammo_type':'pistol ammo',
   '_requires':'clip' 
});

engine.game.objectmanager.c('pistol_clip_lov',{
    '_requires':'pistol_clip',
    'sprite_name':'pistol_clip_lov',
    'base_damage':6,
    'ammo_type':'LoV'
});

engine.game.objectmanager.c('pistol_clip_incendiary', {
   '_requires':'pistol_clip',
   'sprite_name':'pistol_clip_incendiary',
   'ammo_type':'incendiary',
   'base_damage':5,
   'thermal_damage':2,

   'on_hit_add_fire_damage':function(weapon, owner, object, position){
      console.log('inendiary works!');
      object.hit(new engine.Damage({
        'amount':this.thermal_damage,
        'type':'thermal',
        'weapon':weapon,
        'owner':owner,
        'spawn_particle':false
      }, position));
   }
});

engine.game.objectmanager.c('pistol', {
    'sprite_name':'pistol',
    '_slot': 'weapon',
    'clip_type': 'pistol_clip',
    '_requires': 'ranged_weapon usesammo',
    'shots':1,
    'hits_per_shot':1,
    'spread':3,
    'base_damage':1
});

engine.game.objectmanager.c('wrench', {
    'sprite_name':'wrench',
    'base_damage':6,
    '_slot':'weapon',
    '_requires':'melee_weapon'
});

