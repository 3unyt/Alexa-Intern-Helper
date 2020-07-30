// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');
const { sendEmailNotification } = require('./emailSender');
const { getNextTask, getDiffToStartDate } = require('./reminders.js');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        const userName = sessionAttributes.hasOwnProperty('name') ? sessionAttributes.name : "";

        const speakOutput = userName
            ? `Welcome ${userName}, when is your start date?`
            : 'Hello! Welcome to Amazon Intern Helper. What is your name?';
            
        const repromtText = 'When is your start date?';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromtText)
            .getResponse();
        
    }
};


const HasNameDateLaunchRequestHandler = {
    canHandle(handlerInput) {
        console.log(JSON.stringify(handlerInput.requestEnvelope.request));
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        
        const userName = sessionAttributes.hasOwnProperty('name') ? sessionAttributes.name : "";
        const startDate = sessionAttributes.hasOwnProperty('startDate') ? sessionAttributes.startDate : 0;
        
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest' &&
            userName &&
            startDate;
    },
    async handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        const userName = sessionAttributes.hasOwnProperty('name') ? sessionAttributes.name : "";
        const diffDays = await getDiffToStartDate(handlerInput);
        const speakOutput = `Welcome back ${userName}. It looks like there are ${diffDays} days until your start date.`

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('')
            .getResponse();
    }
};


const CaptureUserNameHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CaptureUserNameIntent';
    },
    async handle(handlerInput) {
        const userName = handlerInput.requestEnvelope.request.intent.slots.name.value;
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        
        sessionAttributes.name = userName;
        attributesManager.setPersistentAttributes(sessionAttributes);
        await attributesManager.savePersistentAttributes(); 

        const date = sessionAttributes.hasOwnProperty('startDate') ? sessionAttributes.startDate : 0;
        let speakOutput; 
        if (date){
            speakOutput = `Thanks ${userName}, your start date is ${date.month} ${date.day}, ${date.year}.`
        } else {
            speakOutput = `Thanks ${userName}, when is your start date?`;
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('When is your start date?')
            .getResponse();
    }
};

const CaptureStartDateIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CaptureStartDateIntent';
    },
    async handle(handlerInput) {
        const year = handlerInput.requestEnvelope.request.intent.slots.year.value;
        const month = handlerInput.requestEnvelope.request.intent.slots.month.value;
        const day = handlerInput.requestEnvelope.request.intent.slots.day.value;
        
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        const userName = sessionAttributes.hasOwnProperty('name') ? sessionAttributes.name : "";
        
        const startDateAttributes = {
            "year": year,
            "month": month,
            "day": day   
        };
        sessionAttributes.startDate = startDateAttributes;
        
        attributesManager.setPersistentAttributes(sessionAttributes);
        await attributesManager.savePersistentAttributes();    
        
        
        const speakOutput = `Thanks ${userName}, I'll remember that you will start on ${month} ${day} ${year}.`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

/*
 * Handles retrieving the "latest" task, in a sort of "stack" style, for the intern to complete.
 * If the intern completed the task and lets us know, we store it and not ask the intern about that task again.
*/
const WhatToDoNextIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest'
            && request.intent.name === 'WhatToDoNextIntent';
            
    },
    async handle(handlerInput) {
        const currentIntent = handlerInput.requestEnvelope.request.intent;       
        // const nextTask = JSON.stringify(await getNextTask(handlerInput, getDiffToStartDate));
        const nextTask = "managerInfo";
        const speakOutput = "You should be able to receive manager information by now, have you done that?";

        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        sessionAttributes.taskType = nextTask;
        attributesManager.setPersistentAttributes(sessionAttributes);
        await attributesManager.savePersistentAttributes();

        return handlerInput.responseBuilder
            .addDelegateDirective({
                name: 'ConfirmCompletionOfTaskIntent',
                confirmationStatus: 'NONE',
                slots: {}
            })
            .speak(speakOutput)
            .getResponse();
    }
};

/*
 * Handles user confirming that they completed a task.
*/
const ConfirmCompletionOfTaskIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest'
            && request.intent.name === 'ConfirmCompletionOfTaskIntent';
    },
    async handle(handlerInput) {
        const currentIntent = handlerInput.requestEnvelope.request.intent;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const taskType = sessionAttributes.taskType;
        
        const isCompleted = handlerInput.requestEnvelope.request.intent.slots.isCompleted.value;
        sessionAttributes.isTaskOutOfDate = isCompleted === 'no';

        const speakOutput = sessionAttributes.isTaskOutOfDate
                ? 'Do you need me to reach amazon student program on your behalf?'
                : 'Well done!'

        // const tempPersistentAttrs = await handlerInput.attributesManager.getPersistentAttributes();
        // tempPersistentAttrs[taskType] = true;
        // handlerInput.attributesManager.setPersistentAttributes(tempPersistentAttrs);
        // await handlerInput.attributesManager.savePersistentAttributes();

        return handlerInput.responseBuilder
            .speak(speakOutput)
            // .reprompt('')
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = handlerInput.requestEnvelope.request.intent.name;
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.message}`);
        const speakOutput = `Sorry, I couldn't understand what you said. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// Email sender handler
const YesIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Request received for sending an email.';
        
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        const isTaskOutOfDate = sessionAttributes.hasOwnProperty('isTaskOutOfDate') ? sessionAttributes.isTaskOutOfDate : false;
        const taskType = sessionAttributes.hasOwnProperty('taskType') ? sessionAttributes.isTaskOutOfDate : "";
        const userName = sessionAttributes.hasOwnProperty('name') ? sessionAttributes.name : "";
        
        const userInfo = {
            userName: userName,
            emailAddress: 'personal_email@amazon.com'
        }
        if (isTaskOutOfDate === true){
            sendEmailNotification(taskType, userInfo);
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const LoadStorageInterceptor = {
    async process(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = await attributesManager.getPersistentAttributes() || {};
        const name = sessionAttributes.hasOwnProperty('name') ? sessionAttributes.name : "";
        const date = sessionAttributes.hasOwnProperty('startDate') ? sessionAttributes.startDate : {};

        if (name || date) {
            attributesManager.setSessionAttributes(sessionAttributes);
        }
    }
}

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .withPersistenceAdapter(
        new persistenceAdapter.S3PersistenceAdapter({bucketName:process.env.S3_PERSISTENCE_BUCKET})
    )
    .addRequestHandlers(
        HasNameDateLaunchRequestHandler,
        LaunchRequestHandler,
        WhatToDoNextIntentHandler,
        ConfirmCompletionOfTaskIntentHandler,
        CaptureUserNameHandler,
        CaptureStartDateIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler) // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    .addErrorHandlers(
        ErrorHandler)
    .addRequestInterceptors(
        LoadStorageInterceptor
    )
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();