<% if (client === 'vanilla') { %>
class <%= className %> {
  constructor() {
    this.render();
    //TODO: This still needs to be worked out...
  }

  markup() {
    return `
      <div id="<%= cssCaseName %>"></div>
    `;
  }

  render() {
    document.body.innerHTML = this.markup();
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
