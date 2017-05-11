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

var APP_ID = "amzn1.ask.skill.89dfb660-564d-4969-a861-bd678d37abe7";

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

  var query_url = "http://pws-test.azurewebsites.net/api/pwsPowerShellFunction";
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
        try {
          
          speechText = jsonObject.string;
        } catch (e) {
          speechText = "I'm sorry, but I can't do that right now. Please try again later.";
        }

        var speechOutput = {
          speech: speechText,
          type: AlexaSkill.speechOutputType.SSML
        };
        response.tellWithCard(speechOutput, "Personal Weather Station", speechText);
      }
    )
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