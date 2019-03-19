import { WebApp } from 'meteor/webapp';
WebApp.addHtmlAttributeHook(() => ({ lang: Meteor.settings.language }));
import '/imports/startup/server/index';
