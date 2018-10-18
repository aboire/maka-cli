import { Meteor } from 'meteor/meteor';
import Transport from 'winston-transport';
import 'setimmediate';

import Logs from '/imports/startup/lib/collections/logs';

class MongoTransport extends Transport {
  constructor(opts) {
    super(opts);
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    let location;
    if (Meteor.isServer) {
      location = 'server';
    } else if (Meteor.isClient) {
      location = 'client';
    } else {
      location = 'common';
    }

    Logs.insert({info, time: new Date(), location});

    callback();
  }
};


export { MongoTransport }
