const processEnv = process.env;
const localEnv = require('./custom-setup/.env.json');
const localSetup = require('./custom-setup/setup.json');

const retrieveEnv = (key) => {
    const env = processEnv[key] ? processEnv[key] : (localEnv[key] ? localEnv[key] : null);
    if (!env) {
        console.log(`env: ${key} is not found.`);
        process.exit();
    };
    return env;
}

const retrieveSetup = (key) => {
    const setup = localSetup[key];
    if (!setup){
        console.log(`setup: ${key} is not found.`);
        process.exit();
    };
    return setup;
}

const setUp = () => {
    const wordpressRestUrl = retrieveEnv('WORDPRESS_REST_URL');
    const wordpressSlugs = retrieveSetup('WORDPRESS_POST_TYPE_SLUGS');
    const wordpressSlugIds = retrieveSetup('WORDPRESS_POST_TYPE_SLUG_IDS');

    const contentfulManagementApiKey = retrieveEnv('CONTENTFUL_MANAGEMENT_API_KEY');
    const contentfulDeliveryApiKey = retrieveEnv('CONTENTFUL_DELIVERY_API_KEY');
    const contentfulSpaceId = retrieveEnv('CONTENTFUL_SPACE_ID');
    const contentfulEnvironmentId = retrieveEnv('CONTENTFUL_ENVIRONMENT_ID');
    const contentfulDefaultArea = retrieveEnv('CONTENTFUL_DEFAULT_AREA');

    return {
        wordpressSetup: {
            restUrl: wordpressRestUrl,
            slugs: wordpressSlugs,
            slugIds: wordpressSlugIds
        },
        contentfulSetup: {
            m_ApiKey: contentfulManagementApiKey,
            d_ApiKey: contentfulDeliveryApiKey,
            spaceId: contentfulSpaceId,
            environmentId: contentfulEnvironmentId,
            defaultArea: contentfulDefaultArea
        }
    }
}

module.exports.setUp = setUp;