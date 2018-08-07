import { Meteor } from 'meteor/meteor';

import * as React from 'react';
import * as Adapter from 'enzyme-adapter-react-16';
import { expect } from 'chai';
import { spy } from 'sinon';
import { mount, shallow, configure } from 'enzyme';

configure({ adapter: new Adapter() });

import { <%=className%>, <%= className %>Component } from './<%= fileName %>';

if (Meteor.isClient) {

  describe('<<%= className %>/>', function() {

   it('calls componentDidMount', () => {
      spy(<%= className %>Component.prototype, 'componentDidMount');
      mount(<<%= className %>/>);
      expect(<%= className %>Component.prototype.componentDidMount).to.have.property('callCount', 1);
    });

  });
}
