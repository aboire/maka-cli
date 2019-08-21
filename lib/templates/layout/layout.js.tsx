<% if (client === 'react') { %>import * as React from 'react';<% } else { %>
import * as React from 'react';
import Reflux from 'reflux';<% } %>

interface <%= className %>Component { 
  props: Props;
  state: object;
}
<% if (client === 'reflux') { %>
class <%= className %>Component extends Reflux.Component<<%= className %>Component> {<% } else { %>
class <%= className %>Component extends React.Component<<%= className %>Component> {<% } %>
  static propTypes = {}

  static defaultProps = {}

  constructor(props:Props) {
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
