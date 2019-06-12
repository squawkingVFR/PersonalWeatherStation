/**
 * This simple sample has no external dependencies or session management, and shows the most basic
 * example of how to create a Lambda function for handling Alexa Skill requests.
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, tell Greeter to say hello"
 *  Alexa: "Hello World!"
 */

var http = require('https');

/**
 * App ID for the skill
 */

var APP_ID = process.env.APP_ID; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";
var WUNDERGROUND_API_KEY = process.env.WUNDERGROUND_API_KEY; //replace with your wunderground API key
var WUNDERGROUND_BASE_URL = "https://api.weather.com/v2/pws/observations/current?stationId=";
var WUNDERGROUND_QUERY_URL = "&format=json&units=e&apiKey=";
var WUNDERGROUND_PWS_ID = process.env.PWS_ID; //replace with your personal weather station ID

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * PersonalWeatherStation is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var PersonalWeatherStation = function () {
  AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
PersonalWeatherStation.prototype = Object.create(AlexaSkill.prototype);
PersonalWeatherStation.prototype.constructor = PersonalWeatherStation;

PersonalWeatherStation.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
  console.log("PersonalWeatherStation onSessionStarted requestId: " + sessionStartedRequest.requestId
      + ", sessionId: " + session.sessionId);
  // any initialization logic goes here
};

PersonalWeatherStation.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
  console.log("PersonalWeatherStation onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
  var speechOutput = "Welcome to Personal Weather Station, you can ask for the weather from your weather station";
  var repromptText = "You can ask for your personal weather station's current readings";
  response.ask(speechOutput, repromptText);
};

PersonalWeatherStation.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
  console.log("PersonalWeatherStation onSessionEnded requestId: " + sessionEndedRequest.requestId
      + ", sessionId: " + session.sessionId);
  // any cleanup logic goes here
};

PersonalWeatherStation.prototype.intentHandlers = {
  // register custom intent handlers
  "GetPersonalWeatherStation": function (intent, session, response) {
    handleGetPersonalWeatherStationIntent(intent, session, response);
  },

  "AMAZON.HelpIntent": function (intent, session, response) {
    response.ask("You can ask for the current weather conditions, or, you can say exit", "You can ask for the current weather station's readings");
  },

  "AMAZON.StopIntent": function (intent, session, response) {
    var speechOutput = "Goodbye";
    response.tell(speechOutput);
  },

  "AMAZON.CancelIntent": function (intent, session, response) {
    var speechOutput = "Goodbye";
    response.tell(speechOutput);
  }
};

function numberWithSpaces(x) {
    return x.toString().replace(/\B(?=(\d{1})+(?!\d))/g, " ");
}

function handleGetPersonalWeatherStationIntent(intent, session, response) {
  var speechText = "Personal Weather Station is currently unavailable. Try again later.";
  var query_url = WUNDERGROUND_BASE_URL + WUNDERGROUND_PWS_ID + WUNDERGROUND_QUERY_URL + WUNDERGROUND_API_KEY;
  var body = '';
  var jsonObject;

  http.get(query_url, (res) => {
    console.log(`Got response: ${res.statusCode}`);
    console.log(query_url);
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', () => {
      //console.log("RequestBody: " + body)
      jsonObject = JSON.parse(body);

      if(res.statusCode == 204){
        speechText = "I received a blank response from Weather Underground. Please check the weather station's network connectivity.";
      }else if(jsonObject == null){
        speechText = "I received a null response from Weather Underground.";
      }else{
        try {
            var weather = jsonObject.observations[0];
            var weather_imp = jsonObject.observations[0].imperial;
            console.log(weather_imp);
            var temp_f = numberWithSpaces(weather_imp.temp);
            // var feelslike = weather_imp.heatIndex;
            var dew_point = numberWithSpaces(weather_imp.dewpt);
            var pressure = "Altimeter " + numberWithSpaces(weather_imp.pressure.toFixed(2) * 100) + ".";
            var winddir_rnd = Math.ceil(weather.winddir / 10) * 10;
            if (winddir_rnd < 100 ){
              var winddir = numberWithSpaces(winddir_rnd);
              var winddir = "0 " + winddir.ToString();
            }else{
              var winddir = numberWithSpaces(winddir_rnd);
            }
            var wind_speed = Math.round(weather_imp.windSpeed * 0.868976);
            var windspd = numberWithSpaces(wind_speed);
            var wind_gust = Math.round(weather_imp.windGust * 0.868976);
            var windgust = numberWithSpaces(wind_gust);
            // //determine if there is a heat index or windchill and assign to a common variable
            var temp = "Temperature " + temp_f + ".  Dew point " + dew_point + ".  "
            //winds
            
            if(wind_speed <= 3 ){
              var winds = " winds calm.  ";
            }else if((wind_gust - wind_speed) >= 10 ){
              var winds = " winds " + winddir + " at " + windspd + ", gusts " + windgust + ". "
            }else{
              var winds = " winds " + winddir + " at " + windspd + ". ";
            }
            
            //Precipitation
            var precip_in = weather_imp.precipTotal;
            if ( precip_in <= 0.01){
              var precip = "";
            }else{
              var precip = "  Daily precipitation " + precip_in + " inches.";
            }
            //put it all together
            console.log(winds + temp + pressure + precip);
            speechText = "Your personal weather station reports" + winds + temp + pressure + precip;
          } catch (e) {
            speechText = "I'm sorry, but I can't do that right now. Please try again later.";
          }

        var speechOutput = {
          speech: "<speak>" + speechText + "</speak>",
          type: AlexaSkill.speechOutputType.SSML
        };
        response.tellWithCard(speechOutput, "Personal Weather Station", speechText);
      }
    })
  }).on('error', (e) => {
    console.log(`Got error: ${e.message}`);
  });

}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
  // Create an instance of the PersonalWeatherStation skill.
  var personalWeatherStation = new PersonalWeatherStation();
  personalWeatherStation.execute(event, context);
};