// https://developer.amazon.com/en-US/docs/alexa/custom-skills/delegate-dialog-to-alexa.html#manual-delegation-scenarios

const StartedPlanMyTripHandler = {
    canHandle(handlerInput){
      const request = handlerInput.requestEnvelope.request;
      return request.type === 'IntentRequest' &&
        request.intent.name === 'PlanMyTripIntent' &&
        request.dialogState === 'STARTED';
    },
    handle(handlerInput){
      const currentIntent = handlerInput.requestEnvelope.request.intent;       
      let fromCity = currentIntent.slots.fromCity;
  
      // fromCity.value is empty if the user has not filled the slot. In this example, 
      // getUserDefaultCity() retrieves the user's default city from persistent storage.
      if (!fromCity.value) {
        currentIntent.slots.fromCity.value = getUserDefaultCity();
      }
  
      // Return the Dialog.Delegate directive
      return handlerInput.responseBuilder
        .addDelegateDirective(currentIntent)
        .getResponse();
    }
  };
  
  const InProgressPlanMyTripHandler = {
    canHandle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      return request.type === 'IntentRequest' &&
        request.intent.name === 'PlanMyTripIntent' &&
        request.dialogState === 'IN_PROGRESS';
    },
    handle(handlerInput) {
      const currentIntent = handlerInput.requestEnvelope.request.intent;
      return handlerInput.responseBuilder
        .addDelegateDirective(currentIntent)
        .getResponse();
    },
  };
  
  const CompletedPlanMyTripHandler = {
    canHandle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      return request.type === 'IntentRequest' && 
        request.intent.name === 'PlanMyTripIntent' &&
        request.dialogState === 'COMPLETED';
    },
    handle(handlerInput) {
      // All required slots are filled when this intent is triggered,
      // so assemble the data into a response about the trip...
    },
  };
  