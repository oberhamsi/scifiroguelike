/**
 * ComponentEntityManager JavaScript Library v0.1
 *
 * Copyright 2011, Adrian Gaudebert
 * Licensed under the MIT license.
 * 
 * 
Copyright (c) 2011 Adrian Gaudebert, http://adrian.gaudebert.fr/

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Modified by Domas Lapinskas
 */

(function(exports) {

    /**
     * Class ComponentEntityManager
     *
     * Implement the Component / Entity model and provide tools to easily
     * create and manipulate Components and Entities.
     *
     * @author Adrian Gaudebert - adrian@gaudebert.fr
     * @constructor
     */
    function ComponentEntityManager() {
        var GUID = 0,
            entities = {},
            components = {},
            cemInstance = this;

        /**
         * Transform a string into a list of selectors.
         * Split the string by spaces.
         *
         * @return Array of strings.
         */
        function prepareSelectors(selector) {
            if (typeof(selector) == "string") {
                selector = selector.split(" ");
            }
            if (typeof selector !== 'object') {
                return null;
            }
            return selector;
        }

        /**
         * Class Entity.
         *
         * @author Adrian Gaudebert - adrian@gaudebert.fr
         * @constructor
         */
        var Entity = function(id, name) {
            var state = {};
            this.name = name;
            this.id = id;
            this.type = [];
            this.properties = ['id'];

            /**
             * Extend this entity by adding new states and methods.
             *
             * @param obj Component to take attributes and methods from.
             * @return this.
             */
            
            this.is_type = function(type){
                for(var i=0;i<this.type.length;i++){
                    if(this.type[i]==type) return true;
                }
                return false;
            };
            
            this.get_properties = function(){
                var properties = {};
                this.properties.forEach(function(property){
                    properties[property] = this[property];
                }, this);
                return properties;
            }
            
            this.serialize = function(){
                var data = {
                    'name':this.name,
                    'properties':this.get_properties()
                }
                
                for(var key in this){
                    if(key.search('serialize')==0 && key!='serialize'){
                        this[key](data.properties);
                    }
                }
                
                return data;
            }
            
            this.extend = function(obj) {
                var target = this,
                    key;

                if (!obj)
                    return target;

                for (key in obj) {
                    if(target.hasOwnProperty(key)) continue;
                    // Avoid recursivity
                    if (obj[key] === target)
                        continue;

                    // Specific attributes and methods
                    if (key === "_requires") {
                        target.requires(obj[key]);
                        continue;
                    }

                    // If not a function add the new property and
                    // add a getter and a setter for it
                    if (typeof obj[key] !== "function") {
                        target.set(key, obj[key]);
                        if(key[0]!='_')this.properties.push(key);
                        (function(object, property) {
                            // Getter
                            target.__defineGetter__(property, function() {
                                return object.get(property);
                            });
                            // Setter
                            target.__defineSetter__(property, function(value) {
                                // If the CEM instance has an emit function,
                                // notify that an entity was changed.
                                if (cemInstance.emit instanceof Function) {
                                    cemInstance.emit('entityChanged', { 'entity': object });
                                }
                                object.set(property, value);
                            });
                        })(target, key);
                    }
                    // If a function add it directly to the object
                    else {
                        target[key] = obj[key];
                    }
                }

                return target;
            };

            /**
             * Add one or several components to the Entity.
             *
             * @param selector A list or a string of components to add to the Entity.
             * @return this.
             */
            this.requires = function(selector) {
                var c,
                    comp;

                selector = prepareSelectors(selector);
                // selector is a list of components
                for (c in selector) {
                    if(!selector.hasOwnProperty(c)) continue;
                    comp = components[selector[c]];
                    if (!comp) {
                        throw 'Trying to use unknown component: "' + selector[c] + '"';
                    }
                    else if (this.type.indexOf(selector[c]) == -1) {
                        this.type.push(selector[c]);
                        this.extend(comp);
                    }
                }

                return this;
            };

            /**
             * Get a value from the state of the Entity.
             */
            this.get = function(key) {
                return state[key];
            };

            /**
             * Set a value to a key in the state of the Entity.
             */
            this.set = function(key, value) {
                state[key] = value;
                return this;
            };
        };

        /**
         * Generate and return a unique ID.
         */
        this.UID = function(id) {
            if(id) {
                GUID = Math.max(id, GUID);
                return id;
            } else return ++GUID;
        };

        /**
         * Add a Component to use in Entities.
         */
        this.addComponent = this.c = function(id, fn) {
            components[id] = fn;
            return this;
        };

        /**
         * Remove an existing Component.
         */
        this.removeComponent = function(id) {
            delete components[id];
            return this;
        };

        /**
         * Create and return a new Entity.
         *
         * @param selector A list or a string of components to add to the Entity.
         * @return Entity.
         */
        this.createEntity = this.e = function(type, id) {
            id = this.UID(id);
            var ent;
            entities[id] = ent = new Entity(id, type);
            ent.requires.apply(ent, [type]);
            ent.requires(["obj"]);
            return ent;
        };

        /**
         * Remove an Entity from the internal memory.
         *
         * @param entity The entity to remove.
         */
        this.removeEntity = this.r = function(entity) {
            delete entities[entity.id];
            return this;
        };

        /**
         * Return an entity from its ID or return all entities that contain at
         * least all the specified components.
         *
         * @param selector An ID, or a list or a string of components.
         * @return A single Entity object, an array of Entity objects, or
         *         null if no result was found.
         */
        this.get = function(selector) {
            var i, j,
                e, c,
                valid,
                entitiesList = [];

            // First verify if it's a valid id
            if (typeof selector == 'string' || typeof selector == 'number') {
                e = entities[selector];
                if (typeof e !== 'undefined' && e !== null) {
                    return e;
                }
            }

            // Otherwise consider it as a list of components
            selector = prepareSelectors(selector);

            if (selector === null || selector.length === 0) {
                return null;
            }

            for (i in entities) {
                e = entities[i];
                valid = true;

                for (j in selector) {
                    c = selector[j];
                    if (e.type.indexOf(c) < 0) {
                        valid = false;
                        break;
                    }
                }

                if (valid) {
                    entitiesList.push(e);
                }
            }

            if (entitiesList.length == 0) {
                return null;
            }

            return entitiesList;
        }

        /**
         * Return the list of all components available.
         *
         * @return An array of Component objects.
         */
        this.getComponentsList = function() {
            var list = [];
            for (c in components) {
                list.push(c);
            }
            return list;
        }

        // Add a default component
        this.c("obj", {});
    }

    exports.ComponentEntityManager = ComponentEntityManager;

})(typeof exports === 'undefined' ? this['exports'] = {} : exports);