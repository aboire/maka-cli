import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { check, Match } from 'meteor/check';

import <%= name %> from './<%= fileName %>-collection.tsx';

/**
 * Using ValidatedMethod (maintained by MDG) is the best
 * practice by Meteor Development Group (MDG),
 * and as such is used here to validate that method
 * calls from the client are properly handled.
 *
 */

/**
 * Client side insert method.
 *
 * @memberof Server.<%= name %>
 * @method
 * @property { string }     name        String that defines the method.
 * @property { function }   validate    Is run before the main execution.
 * @property { function }   run         The main action that is executed.
 */
const insert<%= name %> = new ValidatedMethod({
  name: '<%= fileName %>.insert',
  validate(doc) {
    check(doc, Object);
    check(this.userId, String);
  },
  run(doc) {
    //return <%= name %>.insert(doc);
  }
});

/**
 * Client side find method.
 *
 * @memberof Server.<%= name %>
 * @method
 * @property { string }     name        String that defines the method.
 * @property { function }   validate    Is run before the main execution.
 * @property { function }   run         The main action that is executed.
 */
const find<%= name %> = new ValidatedMethod({
  name: '<%= fileName %>.find',
  validate(doc = {}) {
    check(doc, Match.OneOf(String, Object));
    check(this.userId, String);
  },
  run(doc = {}) {
    //return <%= name %>.find(doc);
  }
});

/**
 * Client side findOne method.
 *
 * @memberof Server.<%= name %>
 * @method
 * @property { string }     name        String that defines the method.
 * @property { function }   validate    Is run before the main execution.
 * @property { function }   run         The main action that is executed.
 */
const findOne<%= name %> = new ValidatedMethod({
  name: '<%= fileName %>.findOne',
  validate(doc = {}) {
    check(doc, Match.OneOf(String, Object));
    check(this.userId, String);
  },
  run(doc = {}) {
    //return <%= name %>.findOne(doc);
  }
});


/**
 * Client side update method.
 *
 * @memberof Server.<%= name %>
 * @method
 * @property { string }     name        String that defines the method.
 * @property { function }   validate    Is run before the main execution.
 * @property { function }   run         The main action that is executed.
 */
const update<%= name %>  = new ValidatedMethod({
  name: '<%= fileName %>.update',
  validate({_id, set}) { 
    if (typeof _id !== 'string' && typeof set !== 'object') throw 'Usage Error: Expecting signature { _id: <string>, set: <object> }';
    check(_id, String);
    check(set, Object);
    check(this.userId, String);
  },
  run({_id, set}) {
    //return <%= name %>.update(_id, {$set: set});
  }
});

/**
 * Client side remove method.
 *
 * @memberof Server.<%= name %>
 * @method
 * @property { string }     name        String that defines the method.
 * @property { function }   validate    Is run before the main execution.
 * @property { function }   run         The main action that is executed.
 */
const remove<%= name %>  = new ValidatedMethod({
  name: '<%= fileName %>.remove',
  validate(_id) {
    // NOTE: May want to use object removal, but dangerous!!!
    check(_id, String);
    check(this.userId, String);
  },
  run(_id) {
    //return <%= name %>.remove(_id);
  }
});

const RATE_LIMITED_METHODS = [
  insert<%= name %> , find<%= name %>, findOne<%= name %>, update<%= name %> , remove<%= name %>
].map(value => value['name']);

if (Meteor.isServer) {
  const OPERATIONS = 5;
  const PER_SECOND = 1 * 1000; // milliseconds
  // Only allow 5 list operations per connection per second.
  DDPRateLimiter.addRule({
    name(name) {
      return RATE_LIMITED_METHODS.includes(name);
    },

    // Rate limit per connection ID.
    connectionId() { return true; },
  }, OPERATIONS, PER_SECOND);
}
