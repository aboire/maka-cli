import { Meteor } from 'meteor/meteor';
import <%= name %> from './<%= fileName %>-collection';

/**
 * If the <%= name %> collection is empty on server start, and you'd like to
 * populate it with some data here is a handy spot.
 *
 * Example:
 * ```
 *   if (<%= name %>.find({}).count() === 0) {
 *       const data = JSON.parse(Assets.getText('<%= fileName %>.json')) || [ {} ];
 *       data.forEach((datum) => {
 *           <%= name %>.insert(datum);
 *       });
 *   }
 *
 * ```
 * @memberof Server.<%= name %>
 * @member Fixtures
 */
Meteor.startup(() => {

});
