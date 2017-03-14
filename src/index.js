/**
 * This simple sample has no external dependencies or session management, and shows the most basic
 * example of how to create a Lambda function for handling Alexa Skill requests.
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, tell Greeter to say hello"
 *  Alexa: "Hello World!"
 */

var http = require('http');

/**
 * App ID for the skill
 */

var APP_ID = "amzn1.ask.skill.89dfb660-564d-4969-a861-bd678d37abe7"; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";
var WUNDERGROUND_API_KEY = "c814c56054a82500"; //replace with your wunderground API key
var WUNDERGROUND_BASE_URL = "http://api.wunderground.com/api/";
var WUNDERGROUND_QUERY_URL = "/conditions/q/pws:";
var WUNDERGROUND_PWS_ID = "KIAIOWAC38"; //replace with your personal weather station ID
var RESPONSE_FORMAT = ".json";

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

function handleGetPersonalWeatherStationIntent(intent, session, response) {
  var speechText = "Personal Weather Station is currently unavailable. Try again later.";

  var query_url = WUNDERGROUND_BASE_URL + WUNDERGROUND_API_KEY + WUNDERGROUND_QUERY_URL + WUNDERGROUND_PWS_ID + RESPONSE_FORMAT;
  var body = '';
  var jsonObject;

  http.get(query_url, (res) => {
    console.log(`Got response: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', () => {
      console.log("RequestBody: " + body)
      jsonObject = JSON.parse(body);
      
      if(jsonObject.response.results != undefined)
      {
        var speechOutput = "Please try again";
        var repromptText = "Please try asking for the weather one more time";
        response.ask(speechOutput, repromptText);
      }else{
        try {
          var temp_rnd = Math.round(jsonObject.current_observation.temp_f);
          var dewpnt_rnd = Math.round(jsonObject.current_observation.dewpoint_f);
          var feelslike_rnd = Math.round(jsonObject.current_observation.feelslike_f);
          var baro_pressure_trend = jsonObject.current_observation.baro_pressure_trend;
          
          //determine if pressure is rising or falling
          if(baro_pressure_trend = "+")
          {
            var pressure = ". The barometric pressure is " + jsonObject.current_observation.pressure_in + " inches, and rising.";
          }
          else if(baro_pressure_trend = "-")
          {
            var pressure = ". The barometric pressure is " + jsonObject.current_observation.pressure_in + " inches, and falling.";
          }
          else
          {
            var pressure = ". The barometric pressure is " + jsonObject.current_observation.pressure_in + " inches, and steady.";
          }
          
          //determine if there is a heat index or windchill and assign to a common variable
          if(temp_rnd = feelslike_rnd)
          {            
            var temp = ", with a temperature of " + temp_rnd + ", and a dewpoint of " + dewpnt_rnd;
          }
          else
          {
            var temp = ", with a temperature of " + temp_rnd + ", and a dewpoint of " + dewpnt_rnd + ".  It feels like " + feelslike_rnd + ".";
          }
          
          //winds
          var wind_abrev = jsonObject.current_observation.wind_dir;
          switch (wind_abrev)
          {
            case 'North':
              var wind_dir = "from the north";
              break;
            case 'South':
              var wind_dir = 'from the south';
              break;
            case 'East':
              var wind_dir = 'from the east';
              break;
            case 'West':
              var wind_dir = 'from the west';
              break;
            case 'NW':
              var wind_dir = 'from the northwest';
              break;
            case 'NE':
              var wind_dir = 'from the northeast';
              break;
            case 'SW':
              var wind_dir = 'from the southwest';
              break;
            case 'SE':
              var wind_dir = 'from the southeast';
              break;
            case 'WNW':
              var wind_dir = 'from the west northwest';
              break;
            case 'ENE':
              var wind_dir = 'from the east northeast';
              break;
            case 'WSW':
              var wind_dir = 'from the west southwest';
              break;
            case 'ESE':
              var wind_dir = 'from the east southeast';
              break;
            case 'NNW':
              var wind_dir = 'from the north northwest';
              break;
            case 'NNE':
              var wind_dir = 'from the north northeast';
              break;
            case 'SSW':
              var wind_dir = 'from the south southwest';
              break;
            case 'SSE':
              var wind_dir = 'from the south southeast';
              break;
            case 'Variable':
              var wind_dir = 'variable';
              break;
          }
          var wind_speed = Math.round(jsonObject.current_observation.wind_mph);
          var wind_gust = Math.round(jsonObject.current_observation.wind_gust_mph);
          if((wind_gust - wind_speed) >= 10 )
          {
            var winds = ". Winds are " + wind_dir + " at " + wind_speed + ", gusting to " + wind_gust + " miles per hour."
          }
          else
          {
            var winds = ". Winds are " + wind_dir + " at " + wind_speed + " miles per hour.";
          }
          
          //Precipitation
          //var precip_in = jsonObject.current_observation.precip_today_in;
          var precip_in = 1.2
          if ( precip_in <= 0.01)
          {
            var precip = "";
          }
          else
          {
            var precip = "There has been measurable precipitation of " + jsonObject.current_observation.precip_today_in + " inches so far today.";
          }

          speechText = "Currently, your personal weather station reports " + jsonObject.current_observation.weather + temp + winds + pressure + precip;
        } catch (e) {
          speechText = "I'm sorry, but I can't do that right now. Please try again later.";
        }

        var speechOutput = {
          speech: speechText,
          type: AlexaSkill.speechOutputType.PLAIN_TEXT
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

