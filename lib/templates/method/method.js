import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

/**
 * Using ValidatedMethod (maintained by MDG) is the best
 * practice by Meteor Development Group (MDG),
 * and as such is used here to validate that method
 * calls from the client are properly handled.
 *
 */

/**
 * @memberof Server.<%= name %>
 * @method
 * @property { string }     name        String that defines the method.
 * @property { function }   validate    Is run before the main execution.
 * @property { function }   run         The main action that is executed.
 */
const <%= name %> = new ValidatedMethod({
  name: '<%= fileName %>.server',
  validate: null,
  run() {
    // insert code to run.
    return false;
  },
});

const RATE_LIMITED_METHODS = [
  <%= name %>,
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
