var Future = Npm.require('fibers/future');
var request = Npm.require('request')


Runkeeper = {};

OAuth.registerService('runkeeper', 2, null, function(query, callback) {

  var accessToken= getTokenResponse(query)

  var userData = getUserData(accessToken)

  var profileData = getProfileData(accessToken)

  var serviceData = {
    accessToken: accessToken,
    expiresAt: moment().add(30, 'days').format('X'),
    id: userData.userID,
    name: profileData.name,
    small_picture: profileData.small_picture,
    localtion: profileData.location
  };

  // include all fields from runkeeper
  // http://developer.runkeeper.com/healthgraph/profile
  var whitelisted = ['name', 'location', 'athlete_type', 'gender', 'birthday', 'small_picture', 'normal_picture'];

  var fields = _.pick(userData, whitelisted);
  _.extend(serviceData, fields);

  return {
    serviceData: serviceData,
    options: {profile: {name: profileData.name, small_picture: profileData.small_picture, gender: profileData.gender, location:profileData.location}}
  };
});

var userAgent = "Meteor";
if (Meteor.release)
  userAgent += "/" + Meteor.release;


// returns an object containing:
// - accessToken
// - expiresIn: lifetime of token in seconds
var getTokenResponse = function (query) {

  var config = ServiceConfiguration.configurations.findOne({service: 'runkeeper'});
  if (!config)
    throw new ServiceConfiguration.ConfigError();

  var request_params = {
    grant_type: "authorization_code",
    code: query.code,
    client_id: config.client_id,
    client_secret: OAuth.openSecret(config.secret),
    redirect_uri: OAuth._redirectUri('runkeeper', config)
    //redirect_uri: OAuth._redirectUri('runkeeper', config, null, {replaceLocalhost: true})
  };
  var paramlist = [];
  for (var pk in request_params) {
    paramlist.push(pk + "=" + request_params[pk]);
  };
  var body_string = paramlist.join("&");

  var request_details = {
    method: "POST",
    headers: {'content-type' : 'application/x-www-form-urlencoded'},
    uri: 'https://runkeeper.com/apps/token',
    body: body_string
  };

  var fut = new Future();
  request(request_details, function(error, response, body) {
     var responseContent;
    try {
      responseContent = JSON.parse(body);
    } catch(e) {
      error = new Meteor.Error(204, 'Response is not a valid JSON string.');
      fut.throw(error);
    } finally {
      fut.return(responseContent.access_token);
    }
  });
  var res = fut.wait();
  return res;
};

//////////////////////////////////////////////// 
// We need to first fetch the UserID
////////////////////////////////////////////////
var getUserData = function (accessToken) {
  
  var fut = new Future();
  var request_user = {
    method: 'GET',
    headers: {'Accept': 'application/vnd.com.runkeeper.User+json',
              'Authorization' : 'Bearer ' + accessToken},
    uri: "https://api.runkeeper.com/user"
  };
  request(request_user, function(error, response, body) {
    var responseContent;
    try {
      responseContent = JSON.parse(body);
    } catch(e) {
      error = new Meteor.Error(204, 'Response is not a valid JSON string.');
      fut.throw(error);
    } finally {
      fut.return(responseContent);
    }
  });
  var userRes = fut.wait();
  return userRes;
};

//////////////////////////////////////////////// 
// fetch profile data
////////////////////////////////////////////////

var getProfileData = function (accessToken) {
  var profileFut = new Future();

  var request_profile = {
    method: 'GET',
    headers: {'Accept': 'application/vnd.com.runkeeper.Profile+json',
              'Authorization' : 'Bearer ' + accessToken},
    uri: "https://api.runkeeper.com/profile"
  };
  
  request(request_profile, function(error, response, body) {
    var responseContent;
    try {
      responseContent = JSON.parse(body);
    } catch(e) {
      error = new Meteor.Error(204, 'Response is not a valid JSON string.');
      profileFut.throw(error);
    } finally {
      profileFut.return(responseContent);
    }
  });
  var profileRes= profileFut.wait();
  return profileRes;
};

Runkeeper.retrieveCredential = function(credentialToken, credentialSecret) {
  return OAuth.retrieveCredential(credentialToken, credentialSecret);
};
