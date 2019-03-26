/** @namespace Client */
import React from 'react';
import ReactDOM from 'react-dom';
<% if (config.engines.graphql === 'apollo') {  %>
// Apollo Client configuration
import { ApolloProvider } from 'react-apollo';
import { initialize } from 'meteor/cultofcoders:apollo';

const { client } = initialize({
  disableWebsockets: false, // Whether or not to try to connect to websockets, it connects by default
});

<% } %><% if (config.engines.theme === 'material') { %>
// Material UI Theme config using roboto typefont and default mui.
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

const startApp = () => {<% if (config.engines.ssr === 'true') { %>
  onPageLoad(sink => {
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
  }
}


if(window.cordova) {
  document.addEventListener('deviceready', startApp, false);
} else {
  startApp();
}

