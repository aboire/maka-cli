var meteorSettings = require('./settings.json');

module.exports = {
  apps : [
      {
        name: 'app',
        script: './bundle/main.js',
        watch: false,
        env: {
          ROOT_URL: 'http://0.0.0.0',
          PORT: 3000,
          MONGO_URL: 'mongodb://localhost:27017/app',
          METEOR_SETTINGS: { ...meteorSettings },
        },
        max_memory_restart: '300M',
        exp_backoff_restart_delay: 100,
        //instances: 'max',
        //exec_mode: 'cluster',
      }
  ]
}

