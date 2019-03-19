import { WebApp } from 'meteor/webapp';
WebApp.addHtmlAttributeHook(() => ({ lang: (Meteor.settings.language) ? Meteor.settings.language : 'en' }));
import '/imports/startup/server';
