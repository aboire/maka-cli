<% if (client === 'react') { %>import React, { Component } from 'react';<% } else if (client === 'reflux') { %>
import React from 'react';<% if ( isStore ) { %>
import { Store } from 'reflux'; <% } else { %>
import { Component } from 'reflux';<% } %><% } %><% if (features.withTracker !== 'false' && !isStore) { %>
import { withTracker } from 'meteor/react-meteor-data';<% } %><% if(graphql === 'apollo' && !isStore) { %>
import { withApollo } from 'react-apollo';<% } %>

<% if (!isStore) { %>
class <%= className %>Component extends Component {<% } else { %>
class <%= className %>Component extends Store { <% } %><% if (client === 'reflux' && isStore) { %>
  constructor() {
    super();
    this.state = {};
  }<% } else { %>
  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.state = {};<% if (client === 'reflux') { %>
    this.store = null;<% } %>
  }<% } %>

  componentDidMount() { }

  componentWillUnmount() {<% if (client === 'reflux' && !isStore) { %> super.componentWillUnmount();<% }%> }

  render() {
    return (
      <div id="<% if (isComponent) { %><%= cssCaseName %>-component<% } else { %><%= cssCaseName %><% } %>">
        <h2>Find me in <%= myPath %></h2>
      </div>
    );
  }
}<% if (!isStore) { %><% if (features.withTracker !== 'false') { %>
const <%= className %> = withTracker(() => { return {}; })(<% if(graphql === 'apollo' && !isStore) { %>withApollo(<% } %><%= className %>Component<% if(graphql === 'apollo' && !isStore) { %>)<% } %>);<% } else { %>
const <%= className %> = <%= className %>Component;<% } %>

export { <%= className %>, <%= className %>Component };<% } else { %>
const <%= className %> = <%= className %>Component;

export { <%= className %> };<% } %>
