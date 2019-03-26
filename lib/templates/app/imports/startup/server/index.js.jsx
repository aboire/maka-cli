<% if (config.engines.graphql === 'apollo') { %>
import { initialize } from "meteor/cultofcoders:apollo";
import { mergeTypes, mergeResolvers } from "merge-graphql-schemas";
import { initAccounts } from "meteor/cultofcoders:apollo-accounts";
import { load, getSchema } from "graphql-load";
import gql from "graphql-tag";

load(
  initAccounts({
    loginWithFacebook: false,
    loginWithGoogle: false,
    loginWithLinkedIn: false,
    loginWithPhone: false,
    loginWithPassword: true
    // overrideCreateUser(createUser, _, args, context) {
    //   // Optionally override createUser if you need custom logic
    //   // Or simply restrict him from authenticating
    // }
  })
);

// Expose User type for meteor-apollo-accounts to get loaded on graphql
const usersTypeDefs = gql`
  type User {
  id: ID
  }
`;

const typeList = [usersTypeDefs];
const resolverList = [];

if (typeList.length > 0 && resolverList.length > 0) {
  const typeDefs = mergeTypes(typeList);
  const resolvers = mergeResolvers(resolverList);

  // graph-load all schemas
  load({ 
		typeDefs, 
		resolvers 
	});

  // initialize Apollo Server
  initialize();
}<% } %>
<% if (config.engines.ssr === 'true') { %>
/************* SSR Code ********************/
import Routes from '../lib/routes.jsx';
  import React from 'react';
  import { renderToStaticMarkup } from 'react-dom/server';
  import { onPageLoad } from 'meteor/server-render';
  import { StaticRouter } from 'react-router-dom';
  import { createMemoryHistory } from 'history';
<% if (config.engines.graphql === 'apollo') { %>
import ApolloClient from 'apollo-client';
    import { createMeteorNetworkInterface, meteorClientConfig } from 'meteor/apollo';
    import { ApolloProvider, renderToStringWithData } from 'react-apollo';
    import 'isomorphic-fetch';

    const networkInterface = createMeteorNetworkInterface({
      opts: { credentials: 'same-origin' },
      uri: Meteor.absoluteUrl('graphql'),
      useMeteorAccounts: true,
      batchingInterface: true,
      batchInterval: 10,
    });
    const client = new ApolloClient(meteorClientConfig({ networkInterface, ssrMode: Meteor.isServer }));<% } %>
<% if (config.engines.theme === 'material') { %>
import { SheetsRegistry } from 'react-jss/lib/jss';
    import JssProvider from 'react-jss/lib/JssProvider';
    import { create } from 'jss';
    import preset from 'jss-preset-default';
    import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
    import createGenerateClassName from '@material-ui/core/styles/createGenerateClassName';
    import { grey } from '@material-ui/core/colors';<% } else { %>
import { ServerStyleSheet } from 'styled-components';<% } %>

    onPageLoad(sink => {
      const history = createMemoryHistory(sink.request.url.pathname);
      const App = (props) => (
        <StaticRouter
          location={props.location}
          context={{}}>
          <Routes history={history} />
        </StaticRouter>
      );<% if (config.engines.theme === 'material') { %>
    // Create a sheetsRegistry instance.
    const sheetsRegistry = new SheetsRegistry();

        // Create a theme instance.
        const theme = createMuiTheme({
          typography: {
            useNextVariants: true,
          },
          palette: {
            primary: grey,
            accent: grey,
            type: 'light',
          },
        });

        const jss = create(preset());
        jss.options.createGenerateClassName = createGenerateClassName;
    <% if (config.engines.graphql === 'apollo') { %>
          renderToStringWithData(
            <ApolloProvider client={client}>
              <JssProvider registry={sheetsRegistry} jss={jss}>
                <MuiThemeProvider theme={theme} sheetsManager={new Map()}>
                  <App location={sink.request.url} />
                </MuiThemeProvider>
              </JssProvider>
            </ApolloProvider>
          ).then((content) => {
            const css = sheetsRegistry.toString();
            sink.appendToHead(`<style id="jss-server-side">${css}</style>`);
            sink.renderIntoElementById('app', content);
          });
    <% } else { %>
    const html = renderToStaticMarkup(
            <JssProvider registry={sheetsRegistry} jss={jss}>
              <MuiThemeProvider theme={theme} sheetsManager={new Map()}>
                <App location={sink.request.url} />
              </MuiThemeProvider>
            </JssProvider>
          );
          const css = sheetsRegistry.toString();
          sink.appendToHead(`<style id="jss-server-side">${css}</style>`);
          sink.renderIntoElementById('app', html);<% } %><% } else { %>
    <% if (config.engines.graphql === 'apollo') { %>
    const sheet = new ServerStyleSheet();
          renderToStringWithData(sheet.collectStyles(
            <ApolloProvider client={client}>
              <App location={sink.request.url} />
            </ApolloProvider>
          )).then((content) => {
            sink.appendToHead(sheet.getStyleTags());
            sink.renderIntoElementById('app', content);
          });<% } else { %>
    const sheet = new ServerStyleSheet();
          const html = renderToStaticMarkup(sheet.collectStyles(
            <App location={sink.request.url} />
          ));
          sink.appendToHead(sheet.getStyleTags());
          sink.renderIntoElementById('app', html);<% } %><% } %>
});<% } %>


