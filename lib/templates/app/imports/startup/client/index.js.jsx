/** @namespace Client */
import React from 'react';
import ReactDOM from 'react-dom';
<% if (config.engines.graphql === 'apollo') {  %>
// Apollo Client configuration using vanilla meteor settings.
import ApolloClient from 'apollo-client';
import { createMeteorNetworkInterface, meteorClientConfig } from 'meteor/apollo';
import { ApolloProvider } from 'react-apollo';
const networkInterface = createMeteorNetworkInterface({
  opts: { credentials: 'same-origin' },
  uri: Meteor.absoluteUrl('graphql'),
  useMeteorAccounts: true,
  batchingInterface: true,
  batchInterval: 10,
});
const client = new ApolloClient(meteorClientConfig({ networkInterface }));
<% } %><% if (config.engines.theme === 'material') { %>
// Material UI Theme config using roboto typefont and default mui.
import 'typeface-roboto'
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
const theme = createMuiTheme();
<% } %><% if (config.engines.ssr === 'true') { %>
// Server Side Rendering sink and router classifier.
import { BrowserRouter } from 'react-router-dom'
import { onPageLoad } from "meteor/server-render";
import { browserHistory } from 'react-router';
<% } %>
<% if (config.engines.ssr === 'true') { %>import Routes from '../lib/routes.jsx';<% } else { %>import Routes from './routes.jsx';<% } %>

const App = () => (<% if (config.engines.ssr === 'true') { %>
  <BrowserRouter><% } %><% if (config.engines.graphql === 'apollo') { %>
  <ApolloProvider client={client}><% } %><% if (config.engines.theme === 'material') { %>
  <MuiThemeProvider theme={theme}><% } %><% if (config.engines.ssr === 'true') { %>
  <Routes history={browserHistory}/><% } else { %>
  <Routes /><% } %><% if (config.engines.theme === 'material') { %>
  </MuiThemeProvider><% } %><% if (config.engines.graphql === 'apollo') { %>
  </ApolloProvider><% } %><% if (config.engines.ssr === 'true') { %>
  </BrowserRouter><% } %>
);

<% if (config.engines.ssr === 'true') { %>
onPageLoad(sink => {
  ReactDOM.hydrate(<App />,document.getElementById('app'));
});<% } else { %>
ReactDOM.render(<App />, document.getElementById('app'));<% } %>
