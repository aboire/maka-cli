<% if (client === 'vanilla') { %>
class <%= className %> {
  constructor() {
    this.render();
  }

  markup() {
    return `
      <div id="<%= cssCaseName %>"></div>
    `;
  }

  render() {
    $('#app').append(this.markup());
  }
}

export default <%= camelCaseName %> = new <%= className %>();<% } else { %>
import { Template } from 'meteor/templating';

/**
 * @namespace Client.Templates.<%= name %>
 * @memberof Client.Templates
 */

/*****************************************************************************/
/**
 * <%= className %>: Event Handlers
 * @memberof Client.Templates.<%= name %>
 * @member Events
 */
/*****************************************************************************/
Template.<%= className %>.events({
});

/*****************************************************************************/
/**
 * <%= className %>: Helpers
 * @memberof Client.Templates.<%= name %>
 * @member Helpers
 */
/*****************************************************************************/
Template.<%= className %>.helpers({
});<% } %>
