import { Meteor } from 'meteor/meteor';
import Transport from 'winston-transport';
import 'setimmediate';

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

    Logs.insert({time: new Date(), location, message: info.message, level: info.level});

    callback();
  }
};


export { MongoTransport }
