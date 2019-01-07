<% if (client === 'react') { %>import * as React from 'react';<% } else if (client === 'reflux') { %>
import * as React from 'react';<% if ( isStore ) { %>
import Reflux from 'reflux'; <% } else { %>
import Reflux from 'reflux';<% } %><% } %><% if (features.withTracker !== 'false' && !isStore) { %>
// @ts-ignore: MDG hasn't releasd types
import { withTracker } from 'meteor/react-meteor-data';<% } %><% if(graphql === 'apollo' && !isStore) { %>
import { Query } from 'react-apollo';;
import gql from 'graphql-tag'; <% } %>
<% if (!isStore && client === 'react') { %>
interface <%= className %>Component {
  // Not Implemented
}
class <%= className %>Component extends React.Component<<%= className %>Component> {<% } else if (!isStore && client === 'reflux') { %>
interface <%= className %>Component {
  // Not implemented
}
class <%= className %>Component extends Reflux.Component<<%= className %>Component> {<% } else { %>
interface <%= className %>Component {
  // Not implemented
}
class <%= className %>Component extends Reflux.Store<<%= className %>Component> {<% } %><% if (client === 'reflux' && isStore) { %>
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

  componentWillMount() {<% if (client === 'reflux' && !isStore) { %> super.componentWillMount();<% }%> }

  componentDidMount() { }

  componentWillUnmount() {<% if (client === 'reflux' && !isStore) { %> super.componentWillUnmount();<% }%> }

  render() {
    return (<h2 className="<%=fileName%>">Find me in <%= myPath %></h2>);
  }
}<% if (!isStore) { %><% if (features.withTracker !== 'false') { %>
const <%= className %> = withTracker(() => { return {}; })(<% if(graphql === 'apollo' && !isStore) { %>withApollo(<% } %><%= className %>Component<% if(graphql === 'apollo' && !isStore) { %>)<% } %>);<% } else { %>
const <%= className %> = <%= className %>Component;<% } %>

export { <%= className %>, <%= className %>Component };<% } else { %>
const <%= className %> = <%= className %>Component;

export { <%= className %> };<% } %>
