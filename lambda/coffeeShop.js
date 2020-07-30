/* https://developer.amazon.com/en-US/blogs/alexa/alexa-skills-kit/2019/03/intent-chaining-for-alexa-skill
*/

return handlerInput.responseBuilder
.addDelegateDirective({
    name: 'OrderIntent',
    confirmationStatus: 'NONE',
    slots: {}
})
.speak("Welcome to the coffee shop.")
.getResponse();
