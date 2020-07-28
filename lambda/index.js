// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');
const {sendEmailNotification} = require('./emailSender');


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello! Welcome to Amazon Intern Helper. What is your name?';
        const repromtText = 'When is your start date?';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromtText)
            .getResponse();
        
    }
};

const HasNameLaunchRequestHandler = {
    canHandle(handlerInput) {
        console.log(JSON.stringify(handlerInput.requestEnvelope.request));
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        
        const userName = sessionAttributes.hasOwnProperty('name') ? sessionAttributes.name : "";
        const year = sessionAttributes.hasOwnProperty('year') ? sessionAttributes.year : 0;
        
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest' &&
            userName &&
            year === 0;
    },
    async handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        const userName = sessionAttributes.hasOwnProperty('name') ? sessionAttributes.name : "";
        const diffDays = await getDiffToStartDate(handlerInput);
        const speakOutput = `Welcome back, ${userName}. When is your start date?`
        const repromtText = 'When is your start date?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromtText)
            .getResponse();
    }
    
}

const HasStartDateLaunchRequestHandler = {
    canHandle(handlerInput) {
        console.log(JSON.stringify(handlerInput.requestEnvelope.request));
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        
        const userName = sessionAttributes.hasOwnProperty('name') ? sessionAttributes.name : "";
        const year = sessionAttributes.hasOwnProperty('year') ? sessionAttributes.year : 0;
        const month = sessionAttributes.hasOwnProperty('month') ? sessionAttributes.month : 0;
        const day = sessionAttributes.hasOwnProperty('day') ? sessionAttributes.day : 0;
        
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest' &&
            userName &&
            year &&
            month &&
            day;
    },
    async handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        const userName = sessionAttributes.hasOwnProperty('name') ? sessionAttributes.name : "";
        const diffDays = await getDiffToStartDate(handlerInput);
        const speakOutput = `Welcome back, ${userName}. It looks like there are ${diffDays} days until your start date.`

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};


async function getDiffToStartDate(handlerInput) {
    const serviceClientFactory = handlerInput.serviceClientFactory;
    const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes() || {};

    const year = sessionAttributes.hasOwnProperty('year') ? sessionAttributes.year : 0;
    const month = sessionAttributes.hasOwnProperty('month') ? sessionAttributes.month : 0;
    const day = sessionAttributes.hasOwnProperty('day') ? sessionAttributes.day : 0;

    const startDate = Date.parse(`${month} ${day}, ${year}`);
    
    let userTimeZone;
    try {
        const upsServiceClient = serviceClientFactory.getUpsServiceClient();
        userTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);
    } catch (error) {
        if (error.name !== 'ServiceError') {
            return handlerInput.responseBuilder.speak("There was a problem connecting to the service.").getResponse();
        }
        console.log('error', error.message);
    }
    console.log('userTimeZone', userTimeZone);

    const oneDay = 24 * 60 * 60 * 1000;

    // getting the current date with the time
    const currentDateTime = new Date(new Date().toLocaleString("en-US", { timeZone: userTimeZone }));
    // removing the time from the date because it affects our difference calculation
    const currentDate = new Date(currentDateTime.getFullYear(), currentDateTime.getMonth(), currentDateTime.getDate());
    const diffDays = Math.round(Math.abs((currentDate.getTime() - startDate) / oneDay));
    return diffDays

}

const CaptureUserNameIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CaptureUserNameIntent';
    },
    async handle(handlerInput) {
        const userName = handlerInput.requestEnvelope.request.intent.slots.name.value;
        const attributesManager = handlerInput.attributesManager;
        
        const userNameAttributes = {
            "name": userName
        };
        attributesManager.setPersistentAttributes(userNameAttributes);
        await attributesManager.savePersistentAttributes();    
        
        const speakOutput = `Thanks ${userName}.`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            // .reprompt('When is your start date?')
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
        
        const startDateAttributes = {
            "year": year,
            "month": month,
            "day": day
            
        };
        attributesManager.setPersistentAttributes(startDateAttributes);
        await attributesManager.savePersistentAttributes();    
        
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        const userName = sessionAttributes.hasOwnProperty('name') ? sessionAttributes.name : "";
        const speakOutput = `Thanks ${userName}, I'll remember that you will start on ${month} ${day} ${year}.`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
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
const SendBackgroundCheckRequestIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SendBackgroundCheckRequestIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Request receiverd for sending an email.';
        const userInfo = {
            userName: 'UserName',
            emailAddress: 'personal_email@amazon.com'
        }
        sendEmailNotification('BACKGROUND_CHECK_REQUEST', userInfo);
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const SendImmigrationRequestIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SendImmigrationRequestIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Request receiverd for sending an email.';
        const userInfo = {
            userName: 'UserName',
            emailAddress: 'personal_email@amazon.com'
        }
        sendEmailNotification('IMMIGRATION_REQUEST', userInfo);
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const SendManagerContactRequestIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SendManagerContactRequestIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Request receiverd for sending an email.';
        const userInfo = {
            userName: 'UserName',
            emailAddress: 'personal_email@amazon.com'
        }
        sendEmailNotification('MANAGER_CONTACT_REQUEST', userInfo);
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const SendRelocationRequestIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SendRelocationRequestIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Request receiverd for sending an email.';
        const userInfo = {
            userName: 'UserName',
            emailAddress: 'personal_email@amazon.com'
        }
        sendEmailNotification('RELOCATION_REQUEST', userInfo);
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const SendMyDocsRequestIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SendMyDocsRequestIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Request receiverd for sending an email.';
        const userInfo = {
            userName: 'UserName',
            emailAddress: 'personal_email@amazon.com'
        }
        sendEmailNotification('MYDOCS_REQUEST', userInfo);
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const SendNHORequestIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SendNHORequestIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Request receiverd for sending an email.';
        const userInfo = {
            userName: 'UserName',
            emailAddress: 'personal_email@amazon.com'
        }
        sendEmailNotification('NHO_REQUEST', userInfo);
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const LoadStartDateInterceptor = {
    async process(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = await attributesManager.getPersistentAttributes() || {};

        const year = sessionAttributes.hasOwnProperty('year') ? sessionAttributes.year : 0;
        const month = sessionAttributes.hasOwnProperty('month') ? sessionAttributes.month : 0;
        const day = sessionAttributes.hasOwnProperty('day') ? sessionAttributes.day : 0;

        if (year && month && day) {
            attributesManager.setSessionAttributes(sessionAttributes);
        }
    }
}

const LoadUserNameInterceptor = {
    async process(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = await attributesManager.getPersistentAttributes() || {};

        const name = sessionAttributes.hasOwnProperty('name') ? sessionAttributes.name : "";
        if (name) {
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
        HasStartDateLaunchRequestHandler,
        HasNameLaunchRequestHandler,
        LaunchRequestHandler,
        CaptureUserNameHandler,
        CaptureStartDateIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler) // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    .addErrorHandlers(
        ErrorHandler)
    .addRequestInterceptors(
        LoadStartDateInterceptor,
        LoadUserNameInterceptor
    )
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();