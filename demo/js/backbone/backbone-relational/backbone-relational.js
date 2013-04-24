/* vim: set tabstop=4 softtabstop=4 shiftwidth=4 noexpandtab: */
/**
 * Backbone-relational.js 0.7.1
 * (c) 2011-2013 Paul Uithol and contributors (https://github.com/PaulUithol/Backbone-relational/graphs/contributors)
 * 
 * Backbone-relational may be freely distributed under the MIT license; see the accompanying LICENSE.txt.
 * For details and documentation: https://github.com/PaulUithol/Backbone-relational.
 * Depends on Backbone (and thus on Underscore as well): https://github.com/documentcloud/backbone.
 */
( function( undefined ) {
	"use strict";
	
	/**
	 * CommonJS shim
	 **/
	var _, Backbone, exports;
	if ( typeof window === 'undefined' ) {
		_ = require( 'underscore' );
		Backbone = require( 'backbone' );
		exports = module.exports = Backbone;
	}
	else {
		_ = window._;
		Backbone = window.Backbone;
		exports = window;
	}

	Backbone.Relational = {
		showWarnings: true
	};

	/**
	 * Semaphore mixin; can be used as both binary and counting.
	 **/
	Backbone.Semaphore = {
		_permitsAvailable: null,
		_permitsUsed: 0,
		
		acquire: function() {
			if ( this._permitsAvailable && this._permitsUsed >= this._permitsAvailable ) {
				throw new Error( 'Max permits acquired' );
			}
			else {
				this._permitsUsed++;
			}
		},
		
		release: function() {
			if ( this._permitsUsed === 0 ) {
				throw new Error( 'All permits released' );
			}
			else {
				this._permitsUsed--;
			}
		},
		
		isLocked: function() {
			return this._permitsUsed > 0;
		},
		
		setAvailablePermits: function( amount ) {
			if ( this._permitsUsed > amount ) {
				throw new Error( 'Available permits cannot be less than used permits' );
			}
			this._permitsAvailable = amount;
		}
	};
	
	/**
	 * A BlockingQueue that accumulates items while blocked (via 'block'),
	 * and processes them when unblocked (via 'unblock').
	 * Process can also be called manually (via 'process').
	 */
	Backbone.BlockingQueue = function() {
		this._queue = [];
	};
	_.extend( Backbone.BlockingQueue.prototype, Backbone.Semaphore, {
		_queue: null,
		
		add: function( func ) {
			if ( this.isBlocked() ) {
				this._queue.push( func );
			}
			else {
				func();
			}
		},
		
		process: function() {
			while ( this._queue && this._queue.length ) {
				this._queue.shift()();
			}
		},
		
		block: function() {
			this.acquire();
		},
		
		unblock: function() {
			this.release();
			if ( !this.isBlocked() ) {
				this.process();
			}
		},
		
		isBlocked: function() {
			return this.isLocked();
		}
	});
	/**
	 * Global event queue. Accumulates external events ('add:<key>', 'remove:<key>' and 'update:<key>')
	 * until the top-level object is fully initialized (see 'Backbone.RelationalModel').
	 */
	Backbone.Relational.eventQueue = new Backbone.BlockingQueue();
	
	/**
	 * Backbone.Store keeps track of all created (and destruction of) Backbone.RelationalModel.
	 * Handles lookup for relations.
	 */
	Backbone.Store = function() {
		this._collections = [];
		this._reverseRelations = [];
		this._subModels = [];
		this._modelScopes = [ exports ];
	};
	_.extend( Backbone.Store.prototype, Backbone.Events, {
		addModelScope: function( scope ) {
			this._modelScopes.push( scope );
		},

		/**
		 * Add a set of subModelTypes to the store, that can be used to resolve the '_superModel'
		 * for a model later in 'setupSuperModel'.
		 *
		 * @param {Backbone.RelationalModel} subModelTypes
		 * @param {Backbone.RelationalModel} superModelType
		 */
		addSubModels: function( subModelTypes, superModelType ) {
			this._subModels.push({
				'superModelType': superModelType,
				'subModels': subModelTypes
			});
		},

		/**
		 * Check if the given modelType is registered as another model's subModel. If so, add it to the super model's
		 * '_subModels', and set the modelType's '_superModel', '_subModelTypeName', and '_subModelTypeAttribute'.
		 *
		 * @param {Backbone.RelationalModel} modelType
		 */
		setupSuperModel: function( modelType ) {
			_.find( this._subModels || [], function( subModelDef ) {
				return _.find( subModelDef.subModels || [], function( subModelTypeName, typeValue ) {
					var subModelType = this.getObjectByName( subModelTypeName );

					if ( modelType === subModelType ) {
						// Set 'modelType' as a child of the found superModel
						subModelDef.superModelType._subModels[ typeValue ] = modelType;

						// Set '_superModel', '_subModelTypeValue', and '_subModelTypeAttribute' on 'modelType'.
						modelType._superModel = subModelDef.superModelType;
						modelType._subModelTypeValue = typeValue;
						modelType._subModelTypeAttribute = subModelDef.superModelType.prototype.subModelTypeAttribute;
						return true;
					}
				}, this );
			}, this );
		},
		
		/**
		 * Add a reverse relation. Is added to the 'relations' property on model's prototype, and to
		 * existing instances of 'model' in the store as well.
		 * @param {Object} relation
		 * @param {Backbone.RelationalModel} relation.model
		 * @param {String} relation.type
		 * @param {String} relation.key
		 * @param {String|Object} relation.relatedModel
		 */
		addReverseRelation: function( relation ) {
			var exists = _.any( this._reverseRelations || [], function( rel ) {
				return _.all( relation || [], function( val, key ) {
					return val === rel[ key ];
				});
			});
			
			if ( !exists && relation.model && relation.type ) {
				this._reverseRelations.push( relation );
				this._addRelation( relation.model, relation );
				this.retroFitRelation( relation );
			}
		},

		_addRelation: function( model, relation ) {
			if ( !model.prototype.relations ) {
				model.prototype.relations = [];
			}
			model.prototype.relations.push( relation );

			_.each( model._subModels || [], function( subModel ) {
				this._addRelation( subModel, relation );
			}, this );
		},
		
		/**
		 * Add a 'relation' to all existing instances of 'relation.model' in the store
		 * @param {Object} relation
		 */
		retroFitRelation: function( relation ) {
			var coll = this.getCollection( relation.model );
			coll.each( function( model ) {
				if ( !( model instanceof relation.model ) ) {
					return;
				}

				new relation.type( model, relation );
			}, this);
		},
		
		/**
		 * Find the Store's collection for a certain type of model.
		 * @param {Backbone.RelationalModel} model
		 * @return {Backbone.Collection} A collection if found (or applicable for 'model'), or null
		 */
		getCollection: function( model ) {
			if ( model instanceof Backbone.RelationalModel ) {
				model = model.constructor;
			}
			
			var rootModel = model;
			while ( rootModel._superModel ) {
				rootModel = rootModel._superModel;
			}
			
			var coll = _.detect( this._collections, function( c ) {
				return c.model === rootModel;
			});
			
			if ( !coll ) {
				coll = this._createCollection( rootModel );
			}
			
			return coll;
		},
		
		/**
		 * Find a type on the global object by name. Splits name on dots.
		 * @param {String} name
		 * @return {Object}
		 */
		getObjectByName: function( name ) {
			var parts = name.split( '.' ),
				type = null;

			_.find( this._modelScopes || [], function( scope ) {
				type = _.reduce( parts || [], function( memo, val ) {
					return memo ? memo[ val ] : undefined;
				}, scope );

				if ( type && type !== scope ) {
					return true;
				}
			}, this );

			return type;
		},
		
		_createCollection: function( type ) {
			var coll;
			
			// If 'type' is an instance, take its constructor
			if ( type instanceof Backbone.RelationalModel ) {
				type = type.constructor;
			}
			
			// Type should inherit from Backbone.RelationalModel.
			if ( type.prototype instanceof Backbone.RelationalModel ) {
				coll = new Backbone.Collection();
				coll.model = type;
				
				this._collections.push( coll );
			}
			
			return coll;
		},

		/**
		 * Find the attribute that is to be used as the `id` on a given object
		 * @param type
		 * @param {String|Number|Object|Backbone.RelationalModel} item
		 * @return {String|Number}
		 */
		resolveIdForItem: function( type, item ) {
			var id = _.isString( item ) || _.isNumber( item ) ? item : null;

			if ( id === null ) {
				if ( item instanceof Backbone.RelationalModel ) {
					id = item.id;
				}
				else if ( _.isObject( item ) ) {
					id = item[ type.prototype.idAttribute ];
				}
			}

			// Make all falsy values `null` (except for 0, which could be an id.. see '/issues/179')
			if ( !id && id !== 0 ) {
				id = null;
			}

			return id;
		},

		/**
		 *
		 * @param type
		 * @param {String|Number|Object|Backbone.RelationalModel} item
		 */
		find: function( type, item ) {
			var id = this.resolveIdForItem( type, item );
			var coll = this.getCollection( type );
			
			// Because the found object could be of any of the type's superModel
			// types, only return it if it's actually of the type asked for.
			if ( coll ) {
				var obj = coll.get( id );

				if ( obj instanceof type ) {
					return obj;
				}
			}

			return null;
		},
		
		/**
		 * Add a 'model' to its appropriate collection. Retain the original contents of 'model.collection'.
		 * @param {Backbone.RelationalModel} model
		 */
		register: function( model ) {
			var coll = this.getCollection( model );

			if ( coll ) {
				if ( coll.get( model ) ) {
					if ( Backbone.Relational.showWarnings && typeof console !== 'undefined' ) {
						console.warn( 'Duplicate id! Old RelationalModel:%o, New RelationalModel:%o', coll.get( model ), model );
					}
					throw new Error( "Cannot instantiate more than one Backbone.RelationalModel with the same id per type!" );
				}

				var modelColl = model.collection;
				coll.add( model );
				model.bind( 'destroy', this.unregister, this );
				model.collection = modelColl;
			}
		},
		
		/**
		 * Explicitly update a model's id in its store collection
		 * @param {Backbone.RelationalModel} model
		 */
		update: function( model ) {
			var coll = this.getCollection( model );
			coll._onModelEvent( 'change:' + model.idAttribute, model, coll );
		},
		
		/**
		 * Remove a 'model' from the store.
		 * @param {Backbone.RelationalModel} model
		 */
		unregister: function( model ) {
			model.unbind( 'destroy', this.unregister );
			var coll = this.getCollection( model );
			coll && coll.remove( model );
		}
	});
	Backbone.Relational.store = new Backbone.Store();
	
	/**
	 * The main Relation class, from which 'HasOne' and 'HasMany' inherit. Internally, 'relational:<key>' events
	 * are used to regulate addition and removal of models from relations.
	 *
	 * @param {Backbone.RelationalModel} instance
	 * @param {Object} options
	 * @param {string} options.key
	 * @param {Backbone.RelationalModel.constructor} options.relatedModel
	 * @param {Boolean|String} [options.includeInJSON=true] Serialize the given attribute for related model(s)' in toJSON, or just their ids.
	 * @param {Boolean} [options.createModels=true] Create objects from the contents of keys if the object is not found in Backbone.store.
	 * @param {Object} [options.reverseRelation] Specify a bi-directional relation. If provided, Relation will reciprocate
	 *    the relation to the 'relatedModel'. Required and optional properties match 'options', except that it also needs
	 *    {Backbone.Relation|String} type ('HasOne' or 'HasMany').
	 */
	Backbone.Relation = function( instance, options ) {
		this.instance = instance;
		// Make sure 'options' is sane, and fill with defaults from subclasses and this object's prototype
		options = _.isObject( options ) ? options : {};
		this.reverseRelation = _.defaults( options.reverseRelation || {}, this.options.reverseRelation );
		this.reverseRelation.type = !_.isString( this.reverseRelation.type ) ? this.reverseRelation.type :
			Backbone[ this.reverseRelation.type ] || Backbone.Relational.store.getObjectByName( this.reverseRelation.type );
		this.model = options.model || this.instance.constructor;
		this.options = _.defaults( options, this.options, Backbone.Relation.prototype.options );
		
		this.key = this.options.key;
		this.keySource = this.options.keySource || this.key;
		this.keyDestination = this.options.keyDestination || this.keySource || this.key;

		// 'exports' should be the global object where 'relatedModel' can be found on if given as a string.
		this.relatedModel = this.options.relatedModel;
		if ( _.isString( this.relatedModel ) ) {
			this.relatedModel = Backbone.Relational.store.getObjectByName( this.relatedModel );
		}

		if ( !this.checkPreconditions() ) {
			return;
		}

		if ( instance ) {
			var contentKey = this.keySource;
			if ( contentKey !== this.key && typeof this.instance.get( this.key ) === 'object' ) {
				contentKey = this.key;
			}

			this.keyContents = this.instance.get( contentKey );

			// Explicitly clear 'keySource', to prevent a leaky abstraction if 'keySource' differs from 'key'.
			if ( this.keySource !== this.key ) {
				this.instance.unset( this.keySource, { silent: true } );
			}

			// Add this Relation to instance._relations
			this.instance._relations.push( this );
		}

		// Add the reverse relation on 'relatedModel' to the store's reverseRelations
		if ( !this.options.isAutoRelation && this.reverseRelation.type && this.reverseRelation.key ) {
			Backbone.Relational.store.addReverseRelation( _.defaults( {
					isAutoRelation: true,
					model: this.relatedModel,
					relatedModel: this.model,
					reverseRelation: this.options // current relation is the 'reverseRelation' for its own reverseRelation
				},
				this.reverseRelation // Take further properties from this.reverseRelation (type, key, etc.)
			) );
		}

		_.bindAll( this, '_modelRemovedFromCollection', '_relatedModelAdded', '_relatedModelRemoved' );

		if ( instance ) {
			this.initialize();

			if ( options.autoFetch ) {
				this.instance.fetchRelated( options.key, _.isObject( options.autoFetch ) ? options.autoFetch : {} );
			}

			// When a model in the store is destroyed, check if it is 'this.instance'.
			Backbone.Relational.store.getCollection( this.instance )
				.bind( 'relational:remove', this._modelRemovedFromCollection );

			// When 'relatedModel' are created or destroyed, check if it affects this relation.
			Backbone.Relational.store.getCollection( this.relatedModel )
				.bind( 'relational:add', this._relatedModelAdded )
				.bind( 'relational:remove', this._relatedModelRemoved );
		}
	};
	// Fix inheritance :\
	Backbone.Relation.extend = Backbone.Model.extend;
	// Set up all inheritable **Backbone.Relation** properties and methods.
	_.extend( Backbone.Relation.prototype, Backbone.Events, Backbone.Semaphore, {
		options: {
			createModels: true,
			includeInJSON: true,
			isAutoRelation: false,
			autoFetch: false
		},
		
		instance: null,
		key: null,
		keyContents: null,
		relatedModel: null,
		reverseRelation: null,
		related: null,
		
		_relatedModelAdded: function( model, coll, options ) {
			// Allow 'model' to set up its relations, before calling 'tryAddRelated'
			// (which can result in a call to 'addRelated' on a relation of 'model')
			var dit = this;
			model.queue( function() {
				dit.tryAddRelated( model, options );
			});
		},
		
		_relatedModelRemoved: function( model, coll, options ) {
			this.removeRelated( model, options );
		},
		
		_modelRemovedFromCollection: function( model ) {
			if ( model === this.instance ) {
				this.destroy();
			}
		},
		
		/**
		 * Check several pre-conditions.
		 * @return {Boolean} True if pre-conditions are satisfied, false if they're not.
		 */
		checkPreconditions: function() {
			var i = this.instance,
				k = this.key,
				m = this.model,
				rm = this.relatedModel,
				warn = Backbone.Relational.showWarnings && typeof console !== 'undefined';

			if ( !m || !k || !rm ) {
				warn && console.warn( 'Relation=%o; no model, key or relatedModel (%o, %o, %o)', this, m, k, rm );
				return false;
			}
			// Check if the type in 'model' inherits from Backbone.RelationalModel
			if ( !( m.prototype instanceof Backbone.RelationalModel ) ) {
				warn && console.warn( 'Relation=%o; model does not inherit from Backbone.RelationalModel (%o)', this, i );
				return false;
			}
			// Check if the type in 'relatedModel' inherits from Backbone.RelationalModel
			if ( !( rm.prototype instanceof Backbone.RelationalModel ) ) {
				warn && console.warn( 'Relation=%o; relatedModel does not inherit from Backbone.RelationalModel (%o)', this, rm );
				return false;
			}
			// Check if this is not a HasMany, and the reverse relation is HasMany as well
			if ( this instanceof Backbone.HasMany && this.reverseRelation.type === Backbone.HasMany ) {
				warn && console.warn( 'Relation=%o; relation is a HasMany, and the reverseRelation is HasMany as well.', this );
				return false;
			}

			// Check if we're not attempting to create a duplicate relationship
			if ( i && i._relations.length ) {
				var exists = _.any( i._relations || [], function( rel ) {
						var hasReverseRelation = this.reverseRelation.key && rel.reverseRelation.key;
						return rel.relatedModel === rm && rel.key === k &&
							( !hasReverseRelation || this.reverseRelation.key === rel.reverseRelation.key );
					}, this );

				if ( exists ) {
					warn && console.warn( 'Relation=%o between instance=%o.%s and relatedModel=%o.%s already exists',
						this, i, k, rm, this.reverseRelation.key );
					return false;
				}
			}

			return true;
		},

		/**
		 * Set the related model(s) for this relation
		 * @param {Backbone.Model|Backbone.Collection} related
		 * @param {Object} [options]
		 */
		setRelated: function( related, options ) {
			this.related = related;

			this.instance.acquire();
			this.instance.attributes[ this.key ] = related;
			this.instance.release();
		},
		
		/**
		 * Determine if a relation (on a different RelationalModel) is the reverse
		 * relation of the current one.
		 * @param {Backbone.Relation} relation
		 * @return {Boolean}
		 */
		_isReverseRelation: function( relation ) {
			if ( relation.instance instanceof this.relatedModel && this.reverseRelation.key === relation.key &&
					this.key === relation.reverseRelation.key ) {
				return true;
			}
			return false;
		},
		
		/**
		 * Get the reverse relations (pointing back to 'this.key' on 'this.instance') for the currently related model(s).
		 * @param {Backbone.RelationalModel} [model] Get the reverse relations for a specific model.
		 *    If not specified, 'this.related' is used.
		 * @return {Backbone.Relation[]}
		 */
		getReverseRelations: function( model ) {
			var reverseRelations = [];
			// Iterate over 'model', 'this.related.models' (if this.related is a Backbone.Collection), or wrap 'this.related' in an array.
			var models = !_.isUndefined( model ) ? [ model ] : this.related && ( this.related.models || [ this.related ] );
			_.each( models || [], function( related ) {
				_.each( related.getRelations() || [], function( relation ) {
						if ( this._isReverseRelation( relation ) ) {
							reverseRelations.push( relation );
						}
					}, this );
			}, this );
			
			return reverseRelations;
		},
		
		/**
		 * Rename options.silent to options.silentChange, so events propagate properly.
		 * (for example in HasMany, from 'addRelated'->'handleAddition')
		 * @param {Object} [options]
		 * @return {Object}
		 */
		sanitizeOptions: function( options ) {
			options = options ? _.clone( options ) : {};
			if ( options.silent ) {
				options.silentChange = true;
				delete options.silent;
			}
			return options;
		},

		/**
		 * Rename options.silentChange to options.silent, so events are silenced as intended in Backbone's
		 * original functions.
		 * @param {Object} [options]
		 * @return {Object}
		 */
		unsanitizeOptions: function( options ) {
			options = options ? _.clone( options ) : {};
			if ( options.silentChange ) {
				options.silent = true;
				delete options.silentChange;
			}
			return options;
		},
		
		// Cleanup. Get reverse relation, call removeRelated on each.
		destroy: function() {
			Backbone.Relational.store.getCollection( this.instance )
				.unbind( 'relational:remove', this._modelRemovedFromCollection );
			
			Backbone.Relational.store.getCollection( this.relatedModel )
				.unbind( 'relational:add', this._relatedModelAdded )
				.unbind( 'relational:remove', this._relatedModelRemoved );
			
			_.each( this.getReverseRelations() || [], function( relation ) {
				relation.removeRelated( this.instance );
			}, this );
		}
	});
	
	Backbone.HasOne = Backbone.Relation.extend({
		options: {
			reverseRelation: { type: 'HasMany' }
		},
		
		initialize: function() {
			_.bindAll( this, 'onChange' );

			this.instance.bind( 'relational:change:' + this.key, this.onChange );

			var model = this.findRelated( { silent: true } );
			this.setRelated( model );

			// Notify new 'related' object of the new relation.
			_.each( this.getReverseRelations() || [], function( relation ) {
				relation.addRelated( this.instance );
			}, this );
		},
		
		findRelated: function( options ) {
			var item = this.keyContents;
			var model = null;
			
			if ( item instanceof this.relatedModel ) {
				model = item;
			}
			else if ( item || item === 0 ) { // since 0 can be a valid `id` as well
				model = this.relatedModel.findOrCreate( item, { create: this.options.createModels } );
			}
			
			return model;
		},
		
		/**
		 * If the key is changed, notify old & new reverse relations and initialize the new relation
		 */
		onChange: function( model, attr, options ) {
			// Don't accept recursive calls to onChange (like onChange->findRelated->findOrCreate->initializeRelations->addRelated->onChange)
			if ( this.isLocked() ) {
				return;
			}
			this.acquire();
			options = this.sanitizeOptions( options );
			
			// 'options._related' is set by 'addRelated'/'removeRelated'. If it is set, the change
			// is the result of a call from a relation. If it's not, the change is the result of 
			// a 'set' call on this.instance.
			var changed = _.isUndefined( options._related );
			var oldRelated = changed ? this.related : options._related;
			
			if ( changed ) {	
				this.keyContents = attr;
				
				// Set new 'related'
				if ( attr instanceof this.relatedModel ) {
					this.related = attr;
				}
				else if ( attr ) {
					var related = this.findRelated( options );
					this.setRelated( related );
				}
				else {
					this.setRelated( null );
				}
			}
			
			// Notify old 'related' object of the terminated relation
			if ( oldRelated && this.related !== oldRelated ) {
				_.each( this.getReverseRelations( oldRelated ) || [], function( relation ) {
					relation.removeRelated( this.instance, options );
				}, this );
			}
			
			// Notify new 'related' object of the new relation. Note we do re-apply even if this.related is oldRelated;
			// that can be necessary for bi-directional relations if 'this.instance' was created after 'this.related'.
			// In that case, 'this.instance' will already know 'this.related', but the reverse might not exist yet.
			_.each( this.getReverseRelations() || [], function( relation ) {
				relation.addRelated( this.instance, options );
			}, this);
			
			// Fire the 'update:<key>' event if 'related' was updated
			if ( !options.silentChange && this.related !== oldRelated ) {
				var dit = this;
				Backbone.Relational.eventQueue.add( function() {
					dit.instance.trigger( 'update:' + dit.key, dit.instance, dit.related, options );
				});
			}
			this.release();
		},
		
		/**
		 * If a new 'this.relatedModel' appears in the 'store', try to match it to the last set 'keyContents'
		 */
		tryAddRelated: function( model, options ) {
			if ( this.related ) {
				return;
			}
			options = this.sanitizeOptions( options );
			
			var item = this.keyContents;
			if ( item || item === 0 ) { // since 0 can be a valid `id` as well
				var id = Backbone.Relational.store.resolveIdForItem( this.relatedModel, item );
				if ( !_.isNull( id ) && model.id === id ) {
					this.addRelated( model, options );
				}
			}
		},
		
		addRelated: function( model, options ) {
			if ( model !== this.related ) {
				var oldRelated = this.related || null;
				this.setRelated( model );
				this.onChange( this.instance, model, { _related: oldRelated } );
			}
		},
		
		removeRelated: function( model, options ) {
			if ( !this.related ) {
				return;
			}
			
			if ( model === this.related ) {
				var oldRelated = this.related || null;
				this.setRelated( null );
				this.onChange( this.instance, model, { _related: oldRelated } );
			}
		}
	});
	
	Backbone.HasMany = Backbone.Relation.extend({
		collectionType: null,
		
		options: {
			reverseRelation: { type: 'HasOne' },
			collectionType: Backbone.Collection,
			collectionKey: true,
			collectionOptions: {}
		},
		
		initialize: function() {
			_.bindAll( this, 'onChange', 'handleAddition', 'handleRemoval', 'handleReset' );
			this.instance.bind( 'relational:change:' + this.key, this.onChange );
			
			// Handle a custom 'collectionType'
			this.collectionType = this.options.collectionType;
			if ( _.isString( this.collectionType ) ) {
				this.collectionType = Backbone.Relational.store.getObjectByName( this.collectionType );
			}
			if ( !this.collectionType.prototype instanceof Backbone.Collection ){
				throw new Error( 'collectionType must inherit from Backbone.Collection' );
			}

			// Handle cases where a model/relation is created with a collection passed straight into 'attributes'
			if ( this.keyContents instanceof Backbone.Collection ) {
				this.setRelated( this._prepareCollection( this.keyContents ) );
			}
			else {
				this.setRelated( this._prepareCollection() );
			}

			this.findRelated( { silent: true } );
		},
		
		_getCollectionOptions: function() {
			return _.isFunction( this.options.collectionOptions ) ?
				this.options.collectionOptions( this.instance ) :
				this.options.collectionOptions;
		},

		/**
		 * Bind events and setup collectionKeys for a collection that is to be used as the backing store for a HasMany.
		 * If no 'collection' is supplied, a new collection will be created of the specified 'collectionType' option.
		 * @param {Backbone.Collection} [collection]
		 */
		_prepareCollection: function( collection ) {
			if ( this.related ) {
				this.related
					.unbind( 'relational:add', this.handleAddition )
					.unbind( 'relational:remove', this.handleRemoval )
					.unbind( 'relational:reset', this.handleReset )
			}

			if ( !collection || !( collection instanceof Backbone.Collection ) ) {
				collection = new this.collectionType( [], this._getCollectionOptions() );
			}

			collection.model = this.relatedModel;
			
			if ( this.options.collectionKey ) {
				var key = this.options.collectionKey === true ? this.options.reverseRelation.key : this.options.collectionKey;
				
				if ( collection[ key ] && collection[ key ] !== this.instance ) {
					if ( Backbone.Relational.showWarnings && typeof console !== 'undefined' ) {
						console.warn( 'Relation=%o; collectionKey=%s already exists on collection=%o', this, key, this.options.collectionKey );
					}
				}
				else if ( key ) {
					collection[ key ] = this.instance;
				}
			}
			
			collection
				.bind( 'relational:add', this.handleAddition )
				.bind( 'relational:remove', this.handleRemoval )
				.bind( 'relational:reset', this.handleReset );
			
			return collection;
		},
		
		findRelated: function( options ) {
			if ( this.keyContents ) {
				var models = [];

				if ( this.keyContents instanceof Backbone.Collection ) {
					models = this.keyContents.models;
				}
				else {
					// Handle cases the an API/user supplies just an Object/id instead of an Array
					this.keyContents = _.isArray( this.keyContents ) ? this.keyContents : [ this.keyContents ];

					// Try to find instances of the appropriate 'relatedModel' in the store
					_.each( this.keyContents || [], function( item ) {
						var model = null;
						if ( item instanceof this.relatedModel ) {
							model = item;
						}
						else if ( item || item === 0 ) { // since 0 can be a valid `id` as well
							model = this.relatedModel.findOrCreate( item, { create: this.options.createModels } );
						}

						if ( model && !this.related.get( model ) ) {
							models.push( model );
						}
					}, this );
				}

				// Add all found 'models' in on go, so 'add' will only be called once (and thus 'sort', etc.)
				if ( models.length ) {
					options = this.unsanitizeOptions( options );
					this.related.add( models, options );
				}
			}
		},
		
		/**
		 * If the key is changed, notify old & new reverse relations and initialize the new relation
		 */
		onChange: function( model, attr, options ) {
			options = this.sanitizeOptions( options );
			this.keyContents = attr;
			
			// Replace 'this.related' by 'attr' if it is a Backbone.Collection
			if ( attr instanceof Backbone.Collection ) {
				this._prepareCollection( attr );
				this.related = attr;
			}
			// Otherwise, 'attr' should be an array of related object ids.
			// Re-use the current 'this.related' if it is a Backbone.Collection, and remove any current entries.
			// Otherwise, create a new collection.
			else {
				var oldIds = {}, newIds = {};

				if ( !_.isArray( attr ) && attr !== undefined ) {
					attr = [ attr ];
				}

				_.each( attr, function( attributes ) {
					newIds[ attributes.id ] = true;
				});

				var coll = this.related;
				if ( coll instanceof Backbone.Collection ) {
					// Make sure to operate on a copy since we're removing while iterating
					_.each( coll.models.slice(0) , function( model ) {
						// When fetch is called with the 'keepNewModels' option, we don't want to remove
						// client-created new models when the fetch is completed.
						if ( !options.keepNewModels || !model.isNew() ) {
							oldIds[ model.id ] = true;
							coll.remove( model, { silent: (model.id in newIds) } );
						}
					});
				} else {
					coll = this._prepareCollection();
				}

				_.each( attr, function( attributes ) {
					var model = this.relatedModel.findOrCreate( attributes, { create: this.options.createModels } );
					if (model) {
						coll.add( model, { silent: (model.id in oldIds)} );
					}
				}, this );

				this.setRelated( coll );

			}
			
			var dit = this;
			Backbone.Relational.eventQueue.add( function() {
				!options.silentChange && dit.instance.trigger( 'update:' + dit.key, dit.instance, dit.related, options );
			});
		},
		
		tryAddRelated: function( model, options ) {
			options = this.sanitizeOptions( options );
			if ( !this.related.get( model ) ) {
				// Check if this new model was specified in 'this.keyContents'
				var item = _.any( this.keyContents || [], function( item ) {
					var id = Backbone.Relational.store.resolveIdForItem( this.relatedModel, item );
					return !_.isNull( id ) && id === model.id;
				}, this );
				
				if ( item ) {
					this.related.add( model, options );
				}
			}
		},
		
		/**
		 * When a model is added to a 'HasMany', trigger 'add' on 'this.instance' and notify reverse relations.
		 * (should be 'HasOne', must set 'this.instance' as their related).
		 */
		handleAddition: function( model, coll, options ) {
			//console.debug('handleAddition called; args=%o', arguments);
			// Make sure the model is in fact a valid model before continuing.
			// (it can be invalid as a result of failing validation in Backbone.Collection._prepareModel)
			if ( !( model instanceof Backbone.Model ) ) {
				return;
			}
			
			options = this.sanitizeOptions( options );
			
			_.each( this.getReverseRelations( model ) || [], function( relation ) {
				relation.addRelated( this.instance, options );
			}, this );

			// Only trigger 'add' once the newly added model is initialized (so, has its relations set up)
			var dit = this;
			Backbone.Relational.eventQueue.add( function() {
				!options.silentChange && dit.instance.trigger( 'add:' + dit.key, model, dit.related, options );
			});
		},
		
		/**
		 * When a model is removed from a 'HasMany', trigger 'remove' on 'this.instance' and notify reverse relations.
		 * (should be 'HasOne', which should be nullified)
		 */
		handleRemoval: function( model, coll, options ) {
			//console.debug('handleRemoval called; args=%o', arguments);
			if ( !( model instanceof Backbone.Model ) ) {
				return;
			}

			options = this.sanitizeOptions( options );
			
			_.each( this.getReverseRelations( model ) || [], function( relation ) {
				relation.removeRelated( this.instance, options );
			}, this );
			
			var dit = this;
			Backbone.Relational.eventQueue.add( function() {
				!options.silentChange && dit.instance.trigger( 'remove:' + dit.key, model, dit.related, options );
			});
		},

		handleReset: function( coll, options ) {
			options = this.sanitizeOptions( options );

			var dit = this;
			Backbone.Relational.eventQueue.add( function() {
				!options.silentChange && dit.instance.trigger( 'reset:' + dit.key, dit.related, options );
			});
		},
		
		addRelated: function( model, options ) {
			var dit = this;
			options = this.unsanitizeOptions( options );
			model.queue( function() { // Queued to avoid errors for adding 'model' to the 'this.related' set twice
				if ( dit.related && !dit.related.get( model ) ) {
					dit.related.add( model, options );
				}
			});
		},
		
		removeRelated: function( model, options ) {
			options = this.unsanitizeOptions( options );
			if ( this.related.get( model ) ) {
				this.related.remove( model, options );
			}
		}
	});
	
	/**
	 * A type of Backbone.Model that also maintains relations to other models and collections.
	 * New events when compared to the original:
	 *  - 'add:<key>' (model, related collection, options)
	 *  - 'remove:<key>' (model, related collection, options)
	 *  - 'update:<key>' (model, related model or collection, options)
	 */
	Backbone.RelationalModel = Backbone.Model.extend({
		relations: null, // Relation descriptions on the prototype
		_relations: null, // Relation instances
		_isInitialized: false,
		_deferProcessing: false,
		_queue: null,
		
		subModelTypeAttribute: 'type',
		subModelTypes: null,
		
		constructor: function( attributes, options ) {
			// Nasty hack, for cases like 'model.get( <HasMany key> ).add( item )'.
			// Defer 'processQueue', so that when 'Relation.createModels' is used we:
			// a) Survive 'Backbone.Collection.add'; this takes care we won't error on "can't add model to a set twice"
			//    (by creating a model from properties, having the model add itself to the collection via one of
			//    its relations, then trying to add it to the collection).
			// b) Trigger 'HasMany' collection events only after the model is really fully set up.
			// Example that triggers both a and b: "p.get('jobs').add( { company: c, person: p } )".
			var dit = this;
			if ( options && options.collection ) {
				this._deferProcessing = true;
				
				var processQueue = function( model ) {
					if ( model === dit ) {
						dit._deferProcessing = false;
						dit.processQueue();
						options.collection.unbind( 'relational:add', processQueue );
					}
				};
				options.collection.bind( 'relational:add', processQueue );
				
				// So we do process the queue eventually, regardless of whether this model really gets added to 'options.collection'.
				_.defer( function() {
					processQueue( dit );
				});
			}
			
			this._queue = new Backbone.BlockingQueue();
			this._queue.block();
			Backbone.Relational.eventQueue.block();
			
			Backbone.Model.apply( this, arguments );
			
			// Try to run the global queue holding external events
			Backbone.Relational.eventQueue.unblock();
		},
		
		/**
		 * Override 'trigger' to queue 'change' and 'change:*' events
		 */
		trigger: function( eventName ) {
			if ( eventName.length > 5 && 'change' === eventName.substr( 0, 6 ) ) {
				var dit = this, args = arguments;
				Backbone.Relational.eventQueue.add( function() {
					Backbone.Model.prototype.trigger.apply( dit, args );
				});
			}
			else {
				Backbone.Model.prototype.trigger.apply( this, arguments );
			}
			
			return this;
		},
		
		/**
		 * Initialize Relations present in this.relations; determine the type (HasOne/HasMany), then creates a new instance.
		 * Invoked in the first call so 'set' (which is made from the Backbone.Model constructor).
		 */
		initializeRelations: function() {
			this.acquire(); // Setting up relations often also involve calls to 'set', and we only want to enter this function once
			this._relations = [];
			
			_.each( this.relations || [], function( rel ) {
				var type = !_.isString( rel.type ) ? rel.type :	Backbone[ rel.type ] || Backbone.Relational.store.getObjectByName( rel.type );
				if ( type && type.prototype instanceof Backbone.Relation ) {
					new type( this, rel ); // Also pushes the new Relation into _relations
				}
				else {
					Backbone.Relational.showWarnings && typeof console !== 'undefined' && console.warn( 'Relation=%o; missing or invalid type!', rel );
				}
			}, this );
			
			this._isInitialized = true;
			this.release();
			this.processQueue();
		},

		/**
		 * When new values are set, notify this model's relations (also if options.silent is set).
		 * (Relation.setRelated locks this model before calling 'set' on it to prevent loops)
		 */
		updateRelations: function( options ) {
			if ( this._isInitialized && !this.isLocked() ) {
				_.each( this._relations || [], function( rel ) {
					// Update from data in `rel.keySource` if set, or `rel.key` otherwise
					var val = this.attributes[ rel.keySource ] || this.attributes[ rel.key ];
					if ( rel.related !== val ) {
						this.trigger( 'relational:change:' + rel.key, this, val, options || {} );
					}
				}, this );
			}
		},
		
		/**
		 * Either add to the queue (if we're not initialized yet), or execute right away.
		 */
		queue: function( func ) {
			this._queue.add( func );
		},
		
		/**
		 * Process _queue
		 */
		processQueue: function() {
			if ( this._isInitialized && !this._deferProcessing && this._queue.isBlocked() ) {
				this._queue.unblock();
			}
		},
		
		/**
		 * Get a specific relation.
		 * @param key {string} The relation key to look for.
		 * @return {Backbone.Relation} An instance of 'Backbone.Relation', if a relation was found for 'key', or null.
		 */
		getRelation: function( key ) {
			return _.detect( this._relations, function( rel ) {
				if ( rel.key === key ) {
					return true;
				}
			}, this );
		},
		
		/**
		 * Get all of the created relations.
		 * @return {Backbone.Relation[]}
		 */
		getRelations: function() {
			return this._relations;
		},
		
		/**
		 * Retrieve related objects.
		 * @param key {string} The relation key to fetch models for.
		 * @param [options] {Object} Options for 'Backbone.Model.fetch' and 'Backbone.sync'.
		 * @param [update=false] {boolean} Whether to force a fetch from the server (updating existing models).
		 * @return {jQuery.when[]} An array of request objects
		 */
		fetchRelated: function( key, options, update ) {
			options || ( options = {} );
			var setUrl,
				requests = [],
				rel = this.getRelation( key ),
				keyContents = rel && rel.keyContents,
				toFetch = keyContents && _.select( _.isArray( keyContents ) ? keyContents : [ keyContents ], function( item ) {
					var id = Backbone.Relational.store.resolveIdForItem( rel.relatedModel, item );
					return !_.isNull( id ) && ( update || !Backbone.Relational.store.find( rel.relatedModel, id ) );
				}, this );
			
			if ( toFetch && toFetch.length ) {
				// Create a model for each entry in 'keyContents' that is to be fetched
				var models = _.map( toFetch, function( item ) {
					var model;

					if ( _.isObject( item ) ) {
						model = rel.relatedModel.findOrCreate( item );
					}
					else {
						var attrs = {};
						attrs[ rel.relatedModel.prototype.idAttribute ] = item;
						model = rel.relatedModel.findOrCreate( attrs );
					}

					return model;
				}, this );
				
				// Try if the 'collection' can provide a url to fetch a set of models in one request.
				if ( rel.related instanceof Backbone.Collection && _.isFunction( rel.related.url ) ) {
					setUrl = rel.related.url( models );
				}
				
				// An assumption is that when 'Backbone.Collection.url' is a function, it can handle building of set urls.
				// To make sure it can, test if the url we got by supplying a list of models to fetch is different from
				// the one supplied for the default fetch action (without args to 'url').
				if ( setUrl && setUrl !== rel.related.url() ) {
					var opts = _.defaults(
						{
							error: function() {
								var args = arguments;
								_.each( models || [], function( model ) {
									model.trigger( 'destroy', model, model.collection, options );
									options.error && options.error.apply( model, args );
								});
							},
							url: setUrl
						},
						options,
						{ add: true }
					);

					requests = [ rel.related.fetch( opts ) ];
				}
				else {
					requests = _.map( models || [], function( model ) {
						var opts = _.defaults(
							{
								error: function() {
									model.trigger( 'destroy', model, model.collection, options );
									options.error && options.error.apply( model, arguments );
								}
							},
							options
						);
						return model.fetch( opts );
					}, this );
				}
			}
			
			return requests;
		},

		get: function( attr ) {
			var originalResult = Backbone.Model.prototype.get.call( this, attr );

			// Use `originalResult` get if dotNotation not enabled or not required because no dot is in `attr`
			if ( !this.dotNotation || attr.indexOf( '.' ) === -1 ) {
				return originalResult;
			}

			// Go through all splits and return the final result
			var splits = attr.split( '.' );
			var result = _.reduce(splits, function( model, split ) {
				if ( !( model instanceof Backbone.Model ) ) {
					throw new Error( 'Attribute must be an instanceof Backbone.Model. Is: ' + model + ', currentSplit: ' + split );
				}

				return Backbone.Model.prototype.get.call( model, split );
			}, this );

			if ( originalResult !== undefined && result !== undefined ) {
				throw new Error( "Ambiguous result for '" + attr + "'. direct result: " + originalResult + ", dotNotation: " + result );
			}

			return originalResult || result;
		},
		
		set: function( key, value, options ) {
			Backbone.Relational.eventQueue.block();
			
			// Duplicate backbone's behavior to allow separate key/value parameters, instead of a single 'attributes' object
			var attributes;
			if ( _.isObject( key ) || key == null ) {
				attributes = key;
				options = value;
			}
			else {
				attributes = {};
				attributes[ key ] = value;
			}
			
			var result = Backbone.Model.prototype.set.apply( this, arguments );
			
			// Ideal place to set up relations :)
			if ( !this._isInitialized && !this.isLocked() ) {
				this.constructor.initializeModelHierarchy();

				Backbone.Relational.store.register( this );

				this.initializeRelations();
			}
			// Update the 'idAttribute' in Backbone.store if; we don't want it to miss an 'id' update due to {silent:true}
			else if ( attributes && this.idAttribute in attributes ) {
				Backbone.Relational.store.update( this );
			}
			
			if ( attributes ) {
				this.updateRelations( options );
			}
			
			// Try to run the global queue holding external events
			Backbone.Relational.eventQueue.unblock();
			
			return result;
		},
		
		unset: function( attribute, options ) {
			Backbone.Relational.eventQueue.block();
			
			var result = Backbone.Model.prototype.unset.apply( this, arguments );
			this.updateRelations( options );
			
			// Try to run the global queue holding external events
			Backbone.Relational.eventQueue.unblock();
			
			return result;
		},
		
		clear: function( options ) {
			Backbone.Relational.eventQueue.block();
			
			var result = Backbone.Model.prototype.clear.apply( this, arguments );
			this.updateRelations( options );
			
			// Try to run the global queue holding external events
			Backbone.Relational.eventQueue.unblock();
			
			return result;
		},

		clone: function() {
			var attributes = _.clone( this.attributes );
			if ( !_.isUndefined( attributes[ this.idAttribute ] ) ) {
				attributes[ this.idAttribute ] = null;
			}

			_.each( this.getRelations() || [], function( rel ) {
					delete attributes[ rel.key ];
				});

			return new this.constructor( attributes );
		},
		
		/**
		 * Convert relations to JSON, omits them when required
		 */
		toJSON: function(options) {
			// If this Model has already been fully serialized in this branch once, return to avoid loops
			if ( this.isLocked() ) {
				return this.id;
			}
			
			this.acquire();
			var json = Backbone.Model.prototype.toJSON.call( this, options );
			
			if ( this.constructor._superModel && !( this.constructor._subModelTypeAttribute in json ) ) {
				json[ this.constructor._subModelTypeAttribute ] = this.constructor._subModelTypeValue;
			}
			
			_.each( this._relations || [], function( rel ) {
				var value = json[ rel.key ];

				if ( rel.options.includeInJSON === true) {
					if ( value && _.isFunction( value.toJSON ) ) {
						json[ rel.keyDestination ] = value.toJSON( options );
					}
					else {
						json[ rel.keyDestination ] = null;
					}
				}
				else if ( _.isString( rel.options.includeInJSON ) ) {
					if ( value instanceof Backbone.Collection ) {
						json[ rel.keyDestination ] = value.pluck( rel.options.includeInJSON );
					}
					else if ( value instanceof Backbone.Model ) {
						json[ rel.keyDestination ] = value.get( rel.options.includeInJSON );
					}
					else {
						json[ rel.keyDestination ] = null;
					}
				}
				else if ( _.isArray( rel.options.includeInJSON ) ) {
					if ( value instanceof Backbone.Collection ) {
						var valueSub = [];
						value.each( function( model ) {
							var curJson = {};
							_.each( rel.options.includeInJSON, function( key ) {
								curJson[ key ] = model.get( key );
							});
							valueSub.push( curJson );
						});
						json[ rel.keyDestination ] = valueSub;
					}
					else if ( value instanceof Backbone.Model ) {
						var valueSub = {};
						_.each( rel.options.includeInJSON, function( key ) {
							valueSub[ key ] = value.get( key );
						});
						json[ rel.keyDestination ] = valueSub;
					}
					else {
						json[ rel.keyDestination ] = null;
					}
				}
				else {
					delete json[ rel.key ];
				}

				if ( rel.keyDestination !== rel.key ) {
					delete json[ rel.key ];
				}
			});
			
			this.release();
			return json;
		}
	},
	{
		setup: function( superModel ) {
			// We don't want to share a relations array with a parent, as this will cause problems with
			// reverse relations.
			this.prototype.relations = ( this.prototype.relations || [] ).slice( 0 );

			this._subModels = {};
			this._superModel = null;

			// If this model has 'subModelTypes' itself, remember them in the store
			if ( this.prototype.hasOwnProperty( 'subModelTypes' ) ) {
				Backbone.Relational.store.addSubModels( this.prototype.subModelTypes, this );
			}
			// The 'subModelTypes' property should not be inherited, so reset it.
			else {
				this.prototype.subModelTypes = null;
			}

			// Initialize all reverseRelations that belong to this new model.
			_.each( this.prototype.relations || [], function( rel ) {
				if ( !rel.model ) {
					rel.model = this;
				}

				if ( rel.reverseRelation && rel.model === this ) {
					var preInitialize = true;
					if ( _.isString( rel.relatedModel ) ) {
						/**
						 * The related model might not be defined for two reasons
						 *  1. it never gets defined, e.g. a typo
						 *  2. it is related to itself
						 * In neither of these cases do we need to pre-initialize reverse relations.
						 */
						var relatedModel = Backbone.Relational.store.getObjectByName( rel.relatedModel );
						preInitialize = relatedModel && ( relatedModel.prototype instanceof Backbone.RelationalModel );
					}

					var type = !_.isString( rel.type ) ? rel.type : Backbone[ rel.type ] || Backbone.Relational.store.getObjectByName( rel.type );
					if ( preInitialize && type && type.prototype instanceof Backbone.Relation ) {
						new type( null, rel );
					}
				}
			}, this );
			
			return this;
		},

		/**
		 * Create a 'Backbone.Model' instance based on 'attributes'.
		 * @param {Object} attributes
		 * @param {Object} [options]
		 * @return {Backbone.Model}
		 */
		build: function( attributes, options ) {
			var model = this;

			// 'build' is a possible entrypoint; it's possible no model hierarchy has been determined yet.
			this.initializeModelHierarchy();

			// Determine what type of (sub)model should be built if applicable.
			// Lookup the proper subModelType in 'this._subModels'.
			if ( this._subModels && this.prototype.subModelTypeAttribute in attributes ) {
				var subModelTypeAttribute = attributes[ this.prototype.subModelTypeAttribute ];
				var subModelType = this._subModels[ subModelTypeAttribute ];
				if ( subModelType ) {
					model = subModelType;
				}
			}
			
			return new model( attributes, options );
		},

		initializeModelHierarchy: function() {
			// If we're here for the first time, try to determine if this modelType has a 'superModel'.
			if ( _.isUndefined( this._superModel ) || _.isNull( this._superModel ) ) {
				Backbone.Relational.store.setupSuperModel( this );

				// If a superModel has been found, copy relations from the _superModel if they haven't been
				// inherited automatically (due to a redefinition of 'relations').
				// Otherwise, make sure we don't get here again for this type by making '_superModel' false so we fail
				// the isUndefined/isNull check next time.
				if ( this._superModel ) {
					//
					if ( this._superModel.prototype.relations ) {
						var supermodelRelationsExist = _.any( this.prototype.relations || [], function( rel ) {
							return rel.model && rel.model !== this;
						}, this );

						if ( !supermodelRelationsExist ) {
							this.prototype.relations = this._superModel.prototype.relations.concat( this.prototype.relations );
						}
					}
				}
				else {
					this._superModel = false;
				}
			}

			// If we came here through 'build' for a model that has 'subModelTypes', and not all of them have been resolved yet, try to resolve each.
			if ( this.prototype.subModelTypes && _.keys( this.prototype.subModelTypes ).length !== _.keys( this._subModels ).length ) {
				_.each( this.prototype.subModelTypes || [], function( subModelTypeName ) {
					var subModelType = Backbone.Relational.store.getObjectByName( subModelTypeName );
					subModelType && subModelType.initializeModelHierarchy();
				});
			}
		},

		/**
		 * Find an instance of `this` type in 'Backbone.Relational.store'.
		 * - If `attributes` is a string or a number, `findOrCreate` will just query the `store` and return a model if found.
		 * - If `attributes` is an object and is found in the store, the model will be updated with `attributes` unless `options.update` is `false`. 
		 *   Otherwise, a new model is created with `attributes` (unless `options.create` is explicitly set to `false`).
		 * @param {Object|String|Number} attributes Either a model's id, or the attributes used to create or update a model.
		 * @param {Object} [options]
		 * @param {Boolean} [options.create=true]
		 * @param {Boolean} [options.update=true]
		 * @return {Backbone.RelationalModel}
		 */
		findOrCreate: function( attributes, options ) {
			options || ( options = {} );
			var parsedAttributes = (_.isObject( attributes ) && this.prototype.parse) ? this.prototype.parse( attributes ) : attributes;
			// Try to find an instance of 'this' model type in the store
			var model = Backbone.Relational.store.find( this, parsedAttributes );

			// If we found an instance, update it with the data in 'item' (unless 'options.update' is false).
			// If not, create an instance (unless 'options.create' is false).
			if ( _.isObject( attributes ) ) {
				if ( model && options.update !== false ) {
					model.set( parsedAttributes, options );
				}
				else if ( !model && options.create !== false ) {
					model = this.build( attributes, options );
				}
			}

			return model;
		}
	});
	_.extend( Backbone.RelationalModel.prototype, Backbone.Semaphore );
	
	/**
	 * Override Backbone.Collection._prepareModel, so objects will be built using the correct type
	 * if the collection.model has subModels.
	 */
	Backbone.Collection.prototype.__prepareModel = Backbone.Collection.prototype._prepareModel;
	Backbone.Collection.prototype._prepareModel = function ( attrs, options ) {
		var model;
		
		if ( attrs instanceof Backbone.Model ) {
			if ( !attrs.collection ) {
				attrs.collection = this;
			}
			model = attrs;
		}
		else {
			options || (options = {});
			options.collection = this;
			
			if ( typeof this.model.findOrCreate !== 'undefined' ) {
				model = this.model.findOrCreate( attrs, options );
			}
			else {
				model = new this.model( attrs, options );
			}
			
			if ( !model._validate( attrs, options ) ) {
				model = false;
			}
		}
		
		return model;
	};

	
	/**
	 * Override Backbone.Collection.add, so objects fetched from the server multiple times will
	 * update the existing Model. Also, trigger 'relational:add'.
	 */
	var add = Backbone.Collection.prototype.__add = Backbone.Collection.prototype.add;
	Backbone.Collection.prototype.add = function( models, options ) {
		options || (options = {});
		if ( !_.isArray( models ) ) {
			models = [ models ];
		}

		var modelsToAdd = [];

		//console.debug( 'calling add on coll=%o; model=%o, options=%o', this, models, options );
		_.each( models || [], function( model ) {
			if ( !( model instanceof Backbone.Model ) ) {
				// `_prepareModel` attempts to find `model` in Backbone.store through `findOrCreate`,
				// and sets the new properties on it if is found. Otherwise, a new model is instantiated.
				model = Backbone.Collection.prototype._prepareModel.call( this, model, options );
			}

			if ( model instanceof Backbone.Model && !this.get( model ) && !this.get( model.cid ) ) {
				modelsToAdd.push( model );
			}
		}, this );

		// Add 'models' in a single batch, so the original add will only be called once (and thus 'sort', etc).
		if ( modelsToAdd.length ) {
			add.call( this, modelsToAdd, options );

			_.each( modelsToAdd || [], function( model ) {
				this.trigger( 'relational:add', model, this, options );
			}, this );
		}
		
		return this;
	};
	
	/**
	 * Override 'Backbone.Collection.remove' to trigger 'relational:remove'.
	 */
	var remove = Backbone.Collection.prototype.__remove = Backbone.Collection.prototype.remove;
	Backbone.Collection.prototype.remove = function( models, options ) {
		options || (options = {});
		if ( !_.isArray( models ) ) {
			models = [ models ];
		}
		else {
			models = models.slice( 0 );
		}

		//console.debug('calling remove on coll=%o; models=%o, options=%o', this, models, options );
		_.each( models || [], function( model ) {
			model = this.get( model ) || this.get( model.cid );

			if ( model instanceof Backbone.Model ) {
				remove.call( this, model, options );
				this.trigger('relational:remove', model, this, options);
			}
		}, this );
		
		return this;
	};

	/**
	 * Override 'Backbone.Collection.reset' to trigger 'relational:reset'.
	 */
	var reset = Backbone.Collection.prototype.__reset = Backbone.Collection.prototype.reset;
	Backbone.Collection.prototype.reset = function( models, options ) {
		reset.call( this, models, options );
		this.trigger( 'relational:reset', this, options );

		return this;
	};

	/**
	 * Override 'Backbone.Collection.sort' to trigger 'relational:reset'.
	 */
	var sort = Backbone.Collection.prototype.__sort = Backbone.Collection.prototype.sort;
	Backbone.Collection.prototype.sort = function( options ) {
		sort.call( this, options );
		this.trigger( 'relational:reset', this, options );

		return this;
	};
	
	/**
	 * Override 'Backbone.Collection.trigger' so 'add', 'remove' and 'reset' events are queued until relations
	 * are ready.
	 */
	var trigger = Backbone.Collection.prototype.__trigger = Backbone.Collection.prototype.trigger;
	Backbone.Collection.prototype.trigger = function( eventName ) {
		if ( eventName === 'add' || eventName === 'remove' || eventName === 'reset' ) {
			var dit = this, args = arguments;
			
			if (eventName === 'add') {
				args = _.toArray( args );
				// the fourth argument in case of a regular add is the option object.
				// we need to clone it, as it could be modified while we wait on the eventQueue to be unblocked
				if (_.isObject( args[3] ) ) {
					args[3] = _.clone( args[3] );
				}
			}
			
			Backbone.Relational.eventQueue.add( function() {
				trigger.apply( dit, args );
			});
		}
		else {
			trigger.apply( this, arguments );
		}
		
		return this;
	};

	// Override .extend() to automatically call .setup()
	Backbone.RelationalModel.extend = function( protoProps, classProps ) {
		var child = Backbone.Model.extend.apply( this, arguments );
		
		child.setup( this );

		return child;
	};
})();
