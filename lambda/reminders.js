const EMAIL_TYPES = [
    ['STRING_BACKGROUND_CHECK_REQUEST', 45, 'By now, your background check should have been started. Did you receive a notice about it starting?'],
    ['STRING_IMMIGRATION_REQUEST', 30, 'You should have had a CPT letter uploaded to your candiate portal, if that applies to you. \
        If you already dealt with this or if this doesnt apply to you, please say Yes.'],
    ['STRING_MANAGER_CONTACT_REQUEST', 30, 'You should have been introduced to your manager and or team.'],
    ['STRING_RELOCATION_REQUEST', 30, 'You should have received a note from Graebel in-regards to relocation.'],
    ['STRING_MYDOCS_REQUEST', 14, 'By now, you should have received a MyDocs email. Have you already received it?'],
    ['STRING_NHO_REQUEST', 0, '']
];
const setupTasks = async (handlerInput) => {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = await attributesManager.getPersistentAttributes() || {};

    const unsavedAttrs = EMAIL_TYPES.filter(([type, days]) => !sessionAttributes.hasOwnProperty(type));
    if (unsavedAttrs.length) {
        const intializeCompleted = {};
        EMAIL_TYPES.forEach(([type, days]) => intializeCompleted[type] = false);
        attributesManager.setPersistentAttributes(intializeCompleted);
        await attributesManager.savePersistentAttributes();
    }
};
const getNextTask = async (handlerInput, getDiffToStartDate, getKey=false) => {
    setupTasks(handlerInput);
    const days = await getDiffToStartDate(handlerInput);
    const persistentAttrs = await handlerInput.attributesManager.getPersistentAttributes();
    const notificationBin = EMAIL_TYPES.filter(([type, lateDayLimit, message]) => (days < lateDayLimit && !persistentAttrs[ type ]));
    const selectedTask = notificationBin[0];
    if (selectedTask) {
        // Set session attrs appropriately
        const [type, lateDayLimit, message] = selectedTask;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.taskType = type;
        sessionAttributes.isTaskOutOfDate = true;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        if (!getKey) return message;
        return type;
    }
    return 'You have nothing to worry about!';
};


module.exports = Object.freeze({
  getNextTask
});
