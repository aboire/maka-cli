/* eslint-env jasmine */
import { Meteor } from 'meteor/meteor';
import <%= name %> from './<%= fileName %>-collection';

if (Meteor.isServer) {
  describe('<%= name %>', () => {
    <% if (test === 'jasmine') { %>
       it('has been defined', () => {
         let isDefined = false;
         if(<%= name %>) {
           isDefined = true;
         }

         expect(isDefined).toBe(true);

       });
    <% } else if (test === 'mocha') { %>
       it('has been defined', () => {
         let isDefined = false;
         if(<%= name %>) {
           isDefined = true;
         }
         assert.equal(isDefined, true);
       });
     <% } %>
  });
}
