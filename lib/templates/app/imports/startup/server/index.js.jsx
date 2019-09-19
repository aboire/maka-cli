<% if (config.engines.graphql === 'apollo') { %>
import { ApolloServer } from 'apollo-server-express';
import { WebApp } from 'meteor/webapp';
import { getUser } from 'meteor/apollo';
import { mergeTypes, mergeResolvers } from 'merge-graphql-schemas';

const typeList = [];
const resolverList = [];
if (typeList.length > 0 && resolverList.length > 0) {
  const typeDefs = mergeTypes(typeList);
  const resolvers = mergeResolvers(resolverList);
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => ({
      user: await getUser(req.headers.authorization)
    }),
    formatError: (err) => {
      // Don't give specific errors to the client
      return err.message;
    }
  });
  server.applyMiddleware({
    app: WebApp.connectHandlers,
    path: '/graphql'
  });
}<% } %>
<% if (config.engines.ssr === 'true') { %>
/************* SSR Code ********************/
import Routes from '../lib/routes';
import React from 'react';
import { renderToStaticMarkup, renderToNodeStream } from 'react-dom/server';
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
import { ServerStyleSheets, ThemeProvider } from '@material-ui/styles';
import { createGenerateClassName } from '@material-ui/core/styles';
import { grey } from '@material-ui/core/colors';
import { theme } from '../lib/index';<% } else { %>
import { ServerStyleSheet } from 'styled-components';<% } %>

onPageLoad(sink => {
  const history = createMemoryHistory(sink.request.url.pathname);
  const App = (props) => (
      <StaticRouter
          location={props.location}
          context={{}}>
          <Routes history={history}/>
      </StaticRouter>
  );<% if (config.engines.theme === 'material') { %>
  // Create a sheets instance.
  const sheets = new ServerStyleSheets();

  const jss = create(preset());
  jss.options.createGenerateClassName = createGenerateClassName;
  <% if (config.engines.graphql === 'apollo') { %>
  renderToStringWithData(
    sheets.collect(
      <ApolloProvider client={client}>
        <JssProvider registry={sheets} jss={jss}>
          <ThemeProvider theme={theme}>
            <App location={sink.request.url} />
          </ThemeProvider>
        </JssProvider>
      </ApolloProvider>
    )
  ).then((content) => {
    const css = sheets.toString();
    sink.appendToHead('<style id="jss-server-side">${css}</style>');
    sink.renderIntoElementById('app', content);
  });
  <% } else { %>
  const html = renderToStaticMarkup(
    sheets.collect(
      <JssProvider registry={sheets} jss={jss}>
        <ThemeProvider theme={theme}>
          <App location={sink.request.url} />
        </ThemeProvider>
      </JssProvider>
    )
  );
  const css = sheets.toString();
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
  const jsx = sheet.collectStyles(<App location={sink.request.url} />);
  const stream = sheet.interleaveWithNodeStream(renderToNodeStream(jsx));
  sink.renderIntoElementById('app', stream);<% } %><% } %>
});<% } %>
