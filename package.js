Package.describe({
  name: 'selaias:runkeeper',
  version: '0.9.0',
  summary: 'An implementation of the Runkeeper OAuth flow.',
  git: 'https://github.com/selaias/runkeeper.git',
  documentation: 'README.md'
});

Npm.depends({'request': "2.53.0"});

Package.onUse(function(api) {
  api.versionsFrom('1.0.3.1');
  api.use('oauth2', ['client', 'server']);
  api.use('oauth', ['client', 'server']);
  api.use('http', ['server']);
  api.use('templating', 'client');
  api.use('underscore', 'server');
  api.use('random', 'client');
  api.use('service-configuration', ['client', 'server']);
  
  api.export('Runkeeper');
  
  api.addFiles(['runkeeper_configure.html', 'runkeeper_configure.js'], 'client');
  api.addFiles('runkeeper_server.js', 'server');
  api.addFiles('runkeeper_client.js', 'client');

});

