import { Meteor } from 'meteor/meteor';

import * as React from 'react';
import Adapter from 'enzyme-adapter-react-16';
import { expect } from 'chai';
import { spy } from 'sinon';
import { mount, shallow, configure } from 'enzyme';

configure({ adapter: new Adapter() });
if (Meteor.isClient) {<% if(graphql === 'apollo' && !isStore) { %>
  import { MockedProvider } from '@apollo/react-testing';
  import gql from 'graphql-tag'; 
  const mocks = [
    {
      request: {
        query: gql`query { trucks }`, // consider importing the query from the actual component
        variables: {
          sample: 'variable'
        },
      },
      result: {
        data: {
          trucks: 'hello trucks'
        }
      }
    }
  ];
  <% } %>
  const { <%=className%>, <%= className %>Component } = require('./<%= fileName %>');
  describe('<<%= className %>/>', function() {

   it('calls componentDidMount', () => {
     const componentDidMountSpy = spy(<%= className %>Component.prototype, 'componentDidMount');<% if(graphql === 'apollo' && !isStore) { %>
     mount(
       <MockedProvider mocks={mocks} addTypename={false}>
         <<%= className %>/>
       </MockedProvider>
     );<% } else { %>
     mount(<<%= className %>/>);<% } %>
     expect(componentDidMountSpy).to.have.property('callCount', 1);
    });
  });
}
