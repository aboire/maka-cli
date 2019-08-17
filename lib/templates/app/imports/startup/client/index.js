/** @namespace Client */
// This defines the routes that the application will respond to
import './routes.js';

if (!Meteor.isDevelopment && Meteor.isClient) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('sw.js')
        .then(reg => {
          console.log('Service worker registered! 😎', reg);
        })
        .catch(err => {
          console.log('😥 Service worker registration failed: ', err);
        });
    });
  } else {
    console.warn('Service worker registration failed. Likely you are not serving content over HTTPS');
  }
}
