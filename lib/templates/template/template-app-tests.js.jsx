import { Meteor } from 'meteor/meteor';

import React from 'react';
import Adapter from 'enzyme-adapter-react-16';
import { expect } from 'chai';
import { spy } from 'sinon';
import { mount, shallow, configure } from 'enzyme';

configure({ adapter: new Adapter() });


if (Meteor.isClient) {
  const { <%=className%>, <%= className %>Component } = require('./<%= fileName %>');
  describe('<<%= className %>/>', function() {

   it('calls componentDidMount', () => {
      spy(<%= className %>Component.prototype, 'componentDidMount');
      mount(<<%= className %>/>);
      expect(<%= className %>Component.prototype.componentDidMount).to.have.property('callCount', 1);
    });

  });
}
