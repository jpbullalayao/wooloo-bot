// Setup our environment variables via dotenv
require('dotenv').config()

// For YouTube
var fs = require('fs');
var readline = require('readline');
var {google} = require('googleapis');
const { auth } = require('googleapis/build/src/apis/abusiveexperiencereport');
var OAuth2 = google.auth.OAuth2;

// Import relevant classes from discord.js
const {
  Client,
  Intents,
} = require('discord.js');

// Instantiate a new client with some necessary parameters.
const client = new Client(
  {
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES],
  },
);

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'youtube-nodejs-quickstart.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.web.client_secret;
  var clientId = credentials.web.client_id;
  var redirectUrl = credentials.web.redirect_uris[0];
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log('Token stored to ' + TOKEN_PATH);
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function getChannel(auth) {
  var service = google.youtube('v3');
  service.channels.list({
    auth: auth,
    part: 'snippet,contentDetails,statistics',
    // forUsername: 'UC-0ljMy0cGg01VoYNOw2qXA'
    id: 'UC-0ljMy0cGg01VoYNOw2qXA',
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var channels = response.data.items;
    if (channels.length == 0) {
      console.log('No channel found.');
    } else {
      console.log('This channel\'s ID is %s. Its title is \'%s\', and ' +
                  'it has %s views.',
                  channels[0].id,
                  channels[0].snippet.title,
                  channels[0].statistics.viewCount);
    }
  });
}

function getThumbnail(video) {

}



async function getLatestVideo(auth) {
  var service = google.youtube('v3');
  
  service.channels.list({
    auth: auth,
    part: 'snippet,contentDetails',
    id: 'UC-0ljMy0cGg01VoYNOw2qXA',
  }, function(err, response) {
    // console.log(err);
    // console.log(response);
    // console.log(response.data.items[0].contentDetails.relatedPlaylists);
    const uploadsId = response.data.items[0].contentDetails.relatedPlaylists.uploads;

    service.playlistItems.list({
      auth: auth,
      part: 'snippet',
      playlistId: uploadsId,
    }, function(err, response) {
      console.log(err);
      console.log(response.data.items);
    });
  });

  // service.videos.list({
  //   auth: auth,
  //   part: 'snippet,contentDetails,id',
  //   channelId: 'UC-0ljMy0cGg01VoYNOw2qXA',
  // }, function(err, response) {
  //   console.log(err);
  //   console.log(response);

  //   console.log(response.data.items);
  // });
}

// function getActivities(auth) {
//   var service = google.youtube('v3');
//   service.activities.list({
//     auth: auth,
//     part: 'snippet,contentDetails,id',
//     channelId: 'UC-0ljMy0cGg01VoYNOw2qXA',
//   }, function(err, response) {
//     // console.log(response);

//     console.log(response.data.items);
//   });
// };

// Notify progress
client.on('ready', function(e){
  console.log(`Logged in as ${client.user.tag}!`);
  // console.log('client', client);
  // console.log('guilds', client.guilds.cache);
  // console.log('channels', client.channels.cache);

  const guilds = client.guilds.cache;
  const ragnaGuild = client.guilds.cache.get('274386575243214849');
  const youtubeChannel = ragnaGuild.channels.cache.get('976592462904713226');

  // console.log(youtubeChannel.data);

  // Load client secrets from a local file.
  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the YouTube API.
    // authorize(JSON.parse(content), getChannel);

    authorize(JSON.parse(content), getLatestVideo);
  });
});

// Authenticate
client.login(process.env.DISCORD_TOKEN);
