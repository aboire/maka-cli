<% if (config.engines.client === 'vanilla') { } else { %>import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

/**
 * The FlowRouter client side routing definitions.
 * @namespace Client.Routes
 */

import './templates.js';<% } %>
