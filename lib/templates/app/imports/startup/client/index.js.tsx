/** @namespace Client */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
<% if (config.engines.graphql === 'apollo') {  %>
// Apollo Client configuration
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { MeteorAccountsLink } from 'meteor/apollo';
import { ApolloProvider } from 'react-apollo';

const client = new ApolloClient({
  link: ApolloLink.from([
    new MeteorAccountsLink(),
    new HttpLink({
      uri: '/graphql'
    })
  ]),
  // This solves a stupid cache error.
  cache: new InMemoryCache({
    dataIdFromObject: o => {o.id ? `${o.__typename}-${o.id}`: `${o.__typename}-${o.cursor}`},
  })
});

<% } %><% if (config.engines.theme === 'material') { %>
// Material UI Theme config using  default mui.
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
const theme = createMuiTheme({
  typography: {
    useNextVariants: true,
  },
});
<% } %><% if (config.engines.ssr === 'true') { %>
// Server Side Rendering sink and router classifier.
import { BrowserRouter } from 'react-router-dom'
import { onPageLoad } from "meteor/server-render";
import { browserHistory } from 'react-router';
<% } %>
<% if (config.engines.ssr === 'true') { %>import Routes from '../lib/routes';<% } else { %>import Routes from './routes';<% } %>

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

const startApp = () => {<% if (config.engines.ssr === 'true') { %>
  onPageLoad(() => {
    ReactDOM.hydrate(<App />,document.getElementById('app'));
  });<% } else { %>
  ReactDOM.render(<App />, document.getElementById('app'));<% } %>
}

if (!Meteor.isDevelopment && Meteor.isClient) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js')
        .then(reg => {
            console.log('Service worker registered! 😎', reg);
            })
        .catch(err => {
            console.log('😥 Service worker registration failed: ', err);
            });
        });
  } else {
    console.warn('Service worker registration failed. Likely you are not serving content over HTTPS');
  }
}

if(window.cordova) {
  document.addEventListener('deviceready', startApp, false);
} else {
  startApp();
}
