const tagValuesObject;

const fieldValues = {}

Object.values(tagValuesObject).forEach((item, index) => {
    if (item.type === "Text") {
        const translationObject = {... tagValuesObject[item.id]};
        translationObject.isTranslationCompleted = !!((item.lang[translationLangCode].string && item.lang[translationLangCode].roman.length));
        fieldValues[item.id] = translationObject;
    }
})