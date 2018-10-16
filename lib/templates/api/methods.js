import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { _ } from 'meteor/underscore';

import <%= name %> from './<%= fileName %>-collection.js';

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
    validate: null,
    run(doc) {
        return <%= name %>.insert(doc);
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
    validate: null,
    run([docId, obj]) {
        return <%= name %>.update(docId, {$set: obj});
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
    validate: null,
    run(docId) {
        return <%= name %>.remove(docId);
    }
});

const RATE_LIMITED_METHODS = _.pluck([
    insert<%= name %> , update<%= name %> , remove<%= name %>
], 'name');

if (Meteor.isServer) {
    const OPERATIONS = 5;
    const PER_SECOND = 1 * 1000; // milliseconds
    // Only allow 5 list operations per connection per second.
    DDPRateLimiter.addRule({
        name(name) {
            return _.contains(RATE_LIMITED_METHODS, name);
        },

        // Rate limit per connection ID.
        connectionId() { return true; },
    }, OPERATIONS, PER_SECOND);
}
