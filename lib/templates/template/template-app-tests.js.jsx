import { Meteor } from 'meteor/meteor';

import React from 'react';
import Adapter from 'enzyme-adapter-react-16';
import { expect } from 'chai';
import { spy } from 'sinon';
import { mount, shallow, configure } from 'enzyme';

configure({ adapter: new Adapter() });

if (Meteor.isClient) {<% if(graphql === 'apollo' && !isStore) { %>
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
    cache: new InMemoryCache()
  });
<% } %>
  const { <%=className%>, <%= className %>Component } = require('./<%= fileName %>');
  describe('<<%= className %>/>', function() {

   it('calls componentDidMount', () => {
     spy(<%= className %>Component.prototype, 'componentDidMount');<% if(graphql === 'apollo' && !isStore) { %>
     mount(
       <ApolloProvider client={client}>
         <<%= className %>/>
       </ApolloProvider>
     );<% } else { %>
     mount(<<%= className %>/>);<% } %>
     expect(<%= className %>Component.prototype.componentDidMount).to.have.property('callCount', 1);
    });

  });
}
