/* This is a very simple version of the QuickPlan algorithm for solving
 * mutli-variable contraints. (http://www.cs.utk.edu/~bvz/quickplan.html)
 * The implementation varies from the standard described approach in a few ways:
 *
 * -There is no notion of constraint heirarchy. Here, all constraints are
 *  considered REQUIRED.
 *
 * -There is no "improvement" phase where rejected constraints are added back
 *  in an attempt to find a "better solution"
 *
 * -In place of the above two, a heuristic is used to pick the "weakest"
 *  free constraint to remove. A function, "stayFunc" is passed to the
 *  Variable class and is expected to return a priority value for the variable
 *  0 being highest and 1, 2, 3, etc... being lower.
 *
 * -I've added a non-standard feature which sets Variable.disabled = true
 *  if any constraint actually in use contains that variable as being assigned
 *  in all methods (i.e.) The variable is always written and cannot, therefore
 *  should be disabled because any external change will always be ignored.
 *
 * I suspect these variations result in there being no guarentee of choosing the
 * optimal solution, but it does seem to work well for the examples I've tested.
 * Note also that the DeltaBlue planner can be used in a similar pattern,
 * but it only supports single variable assignment.
 *
 * Note also that this is hacky and thrown together. Don't expect it to work
 * much at all =-).
 */

function Variable(property, stayFunc) {
  this.property = property;
  this.stayFunc = stayFunc || function() {
    //console.log("Warning: using default stay func");
    return 0;
  };
  this.methods = [];
};

Variable.prototype = {
  addMethod: function(method) {
    this.methods.push(method);
  },

  removeMethod: function(method) {
    this.methods.splice(this.methods.indexOf(method), 1);
  },

  isFree: function() {
    return this.methods.length <= 1;
  },

  get stayPriority() {
    return this.stayFunc(this.property);
  }
}

function Method(opts) {
  opts = opts || {};
  this.name = opts.name;
  this.outputs = opts.outputs || [];
  this.f = opts.f || function() {
    //console.log('Warning: using default execution function');
  };
};

Method.prototype = {
  planned_: false,
  variables_: [],

  set planned(planned) {
    this.planned_ = planned;

    if (this.planned_) {
      if (this.variables_) {
        // Remove this method from all variables.
        this.variables_.forEach(function(variable) {
          variable.removeMethod(this);
        }, this);
      }

      this.variables_ = null;
    } else {
      this.variables_ = null;

      // Get & add this method to all variables.
      if (this.constraint && this.constraint.planner) {
        this.variables_ = this.outputs.map(function(output) {
          var variable = this.constraint.planner.getVariable(output);
          variable.addMethod(this);
          return variable;
        }, this);
      }
    }
  },

  get planned() {
    return this.planned_;
  },

  isFree: function() {
    // Return true only if all variables are free.
    var variables = this.variables_;
    for (var i = variables.length - 1; i >= 0; i--) {
      if (!variables[i].isFree())
        return false;
    }
    return true;
  },

  weakerOf: function(other) {
    if (!other) {
      return this;
    }

    // Prefer a method that assigns to fewer variables.
    if (this.variables_.length != other.variables_.length) {
      return this.variables_.length < other.variables_.length ? this : other;
    }

    // Note: A weaker stay priority is a higher number.
    return this.getStayPriority() >= other.getStayPriority() ? this : other;
  },

  getStayPriority: function() {
    // This returns the strongest (lowest) stay priority of this method's
    // output variables.
    return retval = this.variables_.reduce(function(min, variable) {
      return Math.min(min, variable.stayPriority);
    }, Infinity);
  },

  execute: function() {
    this.constraint.planner.model[this.outputs[0]] = this.f();
  }
};

function Constraint(opts) {
  this.name = opts.name;
  this.when = opts.when;
  this.methods = opts.methods;
};

Constraint.prototype = {
  executionMethod_: null,

  set executionMethod(executionMethod) {
    this.executionMethod_ = executionMethod;
    var planned = !!this.executionMethod_;

    this.methods.forEach(function(method) {
      method.constraint = this;
      method.planned = planned;
    }, this);
  },

  get executionMethod() {
    return this.executionMethod_;
  },

  getWeakestFreeMethod: function() {
    var methods = this.methods;
    var weakest = null;
    for (var i = 0; i < methods.length; i++) {
      var method = methods[i];
      if (method.isFree())
        weakest = method.weakerOf(weakest);
    }
    return weakest;
  },

  execute: function() {
    this.executionMethod.execute();
  },

  toString: function() {
    return this.name;
  }
};

function makeFunc(output, opt_func) {
  var func = opt_func || function() {};
  if (typeof func == 'string') {
    var prop = func;
    return function() {
      if (output instanceof Array) {
        output.forEach(function(o) {
          o[prop]();
        });
      } else {
        output[prop]();
      }
    };
  }
  return func;
}

function makeMethod(output, opt_func) {
  var outputs = output instanceof Array ? output : [ output ];
  return new Method({
    name: '-->[' + outputs + ']',
    outputs: outputs,
    f: makeFunc(output, opt_func)
  })
}

function UnaryConstraint(output, opt_func) {
  Constraint.call(this, {
    name: 'Unary: [' + output + ']',
    methods: [ makeMethod(output, opt_func) ]
  });
}

UnaryConstraint.prototype = createObject({
  __proto__: Constraint.prototype
});

function BinaryConstraint(a, b, opt_aFunc, opt_bFunc) {
  // If opt_aFunc is a string and opt_bFunc is missing, assume both are
  // properties on their respective objects.
  if (!opt_bFunc && opt_aFunc && typeof opt_aFunc === "string") {
    opt_bFunc = opt_aFunc;
  }
  Constraint.call(this, {
    name: 'Binary: [' + a + '] vs [' + b + ']',
    methods: [ makeMethod(a, opt_aFunc), makeMethod(b, opt_bFunc) ]
  });
}

BinaryConstraint.prototype = createObject({
  __proto__: Constraint.prototype
});

function Planner(opts) {
  opts = opts || {};
  this.model = opts.model || {};
  this.constraints = opts.constraints || [];
  this.stayFunc = opts.stayFunc;
};

Planner.prototype = createObject({
  //__proto__: cr.EventTarget.prototype,

  plan_: null,

  addConstraint: function(constraint) {
    if (this.constraints.indexOf(constraint) < 0) {
      this.plan_ = null;
      this.constraints.push(constraint);
      // console.log('Added: ' + constraint.name);
    }
    return constraint;
  },

  removeConstraint: function(constraint) {
    var index = this.constraints.indexOf(constraint);
    if (index >= 0) {
      this.plan_ = null;
      var removed = this.constraints.splice(index, 1)[0];
      // console.log('Removed: ' + removed);
    }
    return constraint;
  },

  getVariable: function(property) {
    var index = this.properties_.indexOf(property);
    if (index >= 0) {
      return this.variables_[index];
    }

    this.properties_.push(property);
    var variable = new Variable(property, this.stayFunc);
    this.variables_.push(variable);
    return variable;
  },

  get plan() {
    if (this.plan_) {
      return this.plan_;
    }

    this.plan_ = [];
    this.properties_ = [];
    this.variables_ = [];

    var unplanned = this.constraints.filter(function(constraint) {
      // Note: setting executionMethod must take place after setting planner.
      if (constraint.when && !constraint.when()) {
        // Conditional and currenty disabled => not in use.
        constraint.planner = null;
        constraint.executionMethod = null;
        return false;
      } else {
        // In use.
        constraint.planner = this;
        constraint.executionMethod = null;
        return true;
      }
    }, this);

    while (unplanned.length > 0) {
      var method = this.chooseNextMethod(unplanned);
      if (!method) {
        throw "Cycle detected";
      }

      var nextConstraint = method.constraint;
      unplanned.splice(unplanned.indexOf(nextConstraint), 1);
      this.plan_.unshift(nextConstraint);
      nextConstraint.executionMethod = method;
    }

    //console.log("New plan...");
    //this.plan_.forEach(function(constraint){
    //  console.log(constraint.name + ": " + constraint.executionMethod.name);
    //});

    return this.plan_;
  },

  chooseNextMethod: function(constraints) {
    var weakest = null;
    for (var i = 0; i < constraints.length; i++) {
      var current = constraints[i].getWeakestFreeMethod();
      weakest = current ? current.weakerOf(weakest) : weakest;
    }
    return weakest;
  },

  execute: function(replan) {
    this.executing = true;
    if (replan) {
      this.plan_ = null;
    }
    this.plan.forEach(function(constraint) {
      constraint.execute();
    });
    this.executing = false;
  },

  addWatchProperties: function(properties, opt_stayFunction) {
    if (!this.watchProperties_)
      this.watchProperties_ = [];
    this.watchProperties_.push.apply(this.watchProperties_, properties);

    var self = this;
    var watchProperties = this.watchProperties_;

    function propertyChanged(property) {
      if (!self.executing) {
        watchProperties.unshift(
            watchProperties.splice(watchProperties.indexOf(property), 1)[0]);
        self.execute(true);
      }
    }

    if (opt_stayFunction) {
      this.stayFunc = opt_stayFunction;
    } else if (!this.stayFunc) {
      this.stayFunc = function(prop) {
        if (Model.get(self.model, prop) === undefined) {
          return Infinity;
        }
        return self.watchProperties_.indexOf(prop);
      };
    }

    properties.forEach(function(property) {
      Model.observePath(this.model, property, function() {
        return function() {
          propertyChanged(property);
        }
      }());
    }.bind(this));
  }
});

/**
 * Whether the planner is currently executing.
 * @type {boolean}
 */
//cr.defineProperty(Planner, 'executing', cr.PropertyKind.JS, false);

/*
 * This is just a convenience constructor. It just takes big JSON struct which
 * defines the list of constraints, each constraint's methods.
 * See property_model.html for usage.
 * Additionally, it implements the stayFunc for each variable and listens
 * to Model valueChange events to cause the planner to re-plan.
 */
Planner.makePlanner = function(model, constraintList) {
  var properties = [];
  var planner = new Planner({model: model});

  function collectProperties(property) {
    if (properties.indexOf(property) < 0) {
      properties.push(property);
    }
  }

  constraintList.forEach(function(constraintData) {
    var methods = [];
    constraintData.methods.forEach(function(methodData) {
      collectProperties(methodData.property);

      methods.push(new Method({
        name: methodData.name,
        outputs: [ methodData.property ],
        f: methodData.f
      }));
    });

    if (constraintData.inputs) {
      constraintData.inputs.forEach(function(property) {
        collectProperties(property);
      });
    }

    planner.addConstraint(new Constraint({
      name: constraintData.name,
      when: constraintData.when,
      methods: methods
    }));
  });

  planner.addWatchProperties(properties);

  planner.execute(true);

  return planner;
}
