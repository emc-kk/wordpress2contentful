const objectAssignDeep = require(`object-assign-deep`);

const migrationWordpressClass = require('./migration/wordpress');
const migrationContentfulClass = require('./migration/contentful');
const uploadWordpressClass = require('./upload/wordpress');
const uploadContentfulClass = require('./upload/contentful');

const setUp = require('./setup');
let {
    wordpressSetup,
    contentfulSetup
} = setUp.setUp();


const main = async () => {
    if (wordpressSetup.slugs.length && Object.keys(wordpressSetup.slugIds).length){
        console.log('Either WORDPRESS_POST_TYPE_SLUGS or WORDPRESS_POST_IDS should be empty!');
        process.exit();
    }
    if (wordpressSetup.slugs.length) {
        const data = await (new migrationWordpressClass(wordpressSetup)).getPosts();
        objectAssignDeep(contentfulSetup, data);
        console.log(contentfulSetup);
        await (new migrationContentfulClass(contentfulSetup)).setContent();
    } else {
        const data = await (new uploadWordpressClass(wordpressSetup)).getPosts();
        objectAssignDeep(contentfulSetup, data);
        console.log(contentfulSetup);
        await (new uploadContentfulClass(contentfulSetup)).setContent();
    }
}

main().then(() => console.log('all done'));