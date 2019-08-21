<% if (client === 'react') { %>import React, { Component } from 'react';<% } else { %>
import React from 'react';
import { Component } from 'reflux';<% } %>

class <%= className %>Component extends Component {
  static propTypes = {}

  static defaultProps = {}

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() { }

  componentWillUnmount() {<% if (client === 'reflux' && !isStore) { %>
    super.componentWillUnmount();<% }%>
  }

  render() { return (<div>{ this.props.children }</div>); }
}

const <%= className %> = <%= className %>Component;
export { <%= className %> };
