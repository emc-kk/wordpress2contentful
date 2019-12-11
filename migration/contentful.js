const request = require('request');
const axios = require('axios');
const contentfulDelivery = require('contentful');
const contentfulMangement = require('contentful-management');
const objectAssignDeep = require(`object-assign-deep`);

//const baseUrl = 'https://api.contentful.com';

module.exports = class contentfulClass {
    constructor(contentfulSetup) {
        this.managementApiKey = contentfulSetup.m_ApiKey;
        this.deliveryApiKey = contentfulSetup.d_ApiKey;
        this.spaceId = contentfulSetup.spaceId;
        this.environmentId = contentfulSetup.environmentId;
        this.defaultArea = contentfulSetup.defaultArea;
        this.posts = contentfulSetup.posts;
        this.slugs = contentfulSetup.slugs;
        this.tagSlugs = contentfulSetup.tagSlugs;
        this.categorySlugs = contentfulSetup.categorySlugs;
        this.allTaxonomies = contentfulSetup.allTaxonomies;
        this.taxonomySlugs = [...this.tagSlugs, ...this.categorySlugs];

        this.contentTypeEnum = {
            int: {
                type: "Integer"
            },
            shortText: {
                type: 'Symbol'
            },
            longText: {
                type: 'Text'
            },
            richText: {
                type: 'RichText'
            },
            mediaLinks: {
                type: "Array",
                items: {
                    type: "Link",
                    linkType: "Asset"
                }
            },
            taxonomies: {
                type: "Array",
                items: {
                    type: "Symbol"
                }
            },
            media: {
                type: "Link",
                linkType: "Asset"
            }
            //here
        };

        this.clientDelivery = contentfulDelivery.createClient({
            space: this.spaceId,
            environment: this.environmentId,
            accessToken: this.deliveryApiKey
        })
        this.clientManagement = contentfulMangement.createClient({
            accessToken: this.managementApiKey
        })


        this.contentModelDict = {};
    }
    throwError(text) {
        console.log(text);
        process.exit();
    }
    async createContentModel(slug) {
        const fields = [];
        const createLocalContentType = (key, typejson, required = false, option = {}) => {
            return Object.assign({
                id: key,
                name: key,
                required: required,
                localized: false
            }, typejson, option);
        };
        fields.push(createLocalContentType('id', this.contentTypeEnum.int, true));
        fields.push(createLocalContentType('title', this.contentTypeEnum.shortText, true));
        fields.push(createLocalContentType('content', this.contentTypeEnum.longText, true));
        fields.push(createLocalContentType('thumbnails', this.contentTypeEnum.media, false));
        for (const taxonomySlug of this.taxonomySlugs) {
            fields.push(createLocalContentType(taxonomySlug, this.contentTypeEnum.taxonomies, false));
        }
        const id = await this.clientManagement.getSpace(this.spaceId)
            .then(space => space.createContentType({
                name: slug,
                fields: fields
            }))
            .then(contentType => {
                return contentType.sys.id
            })
            .catch(err => this.throwError(err));

        this.contentModelDict[slug] = id;

        await this.clientManagement.getSpace(this.spaceId)
            .then((space) => space.getContentType(id))
            .then((contentType) => contentType.publish())
            .then((contentType) => console.log(`Content type ${contentType.sys.id} activated.`))
            .catch(console.error)
    }
    async uploadSingleContent(post, slug) {
        const postId = post.id;
        const createContentField = (key, value) => {
            return {
                [key]: {
                    [this.defaultArea]: value
                }
            }
        }
        let fields = {};
        objectAssignDeep(fields, createContentField('id', postId), createContentField('title', post.title), createContentField('content', post.content));

        // taxonomy start 
        const taxonomyKeys = [];
        const taxonomyValues = [];
        for (const taxonomy of this.allTaxonomies) {
            if (taxonomy.postId !== postId) continue;
            const index = taxonomyKeys.indexOf(taxonomy.taxonomy);
            if (index === -1) {
                taxonomyKeys.push(taxonomy.taxonomy);
                taxonomyValues.push([taxonomy.name]);
            } else taxonomyValues.splice(index, 1, [...taxonomyValues[index], taxonomy.name]);
        }
        for (let i = 0; i < taxonomyKeys.length; i++) objectAssignDeep(fields, createContentField(taxonomyKeys[i], taxonomyValues[i]));
        // taxonomy end
        // thumbnail start
        const {
            thumbnailPath,
            name,
            caption,
            mimeType
        } = post.thumbnail;

        if (thumbnailPath && name && mimeType) {
            const thumbnailBinary = await new Promise((resolve, reject) => {
                request.get(thumbnailPath, {
                    encoding: null
                }, (error, response, body) => {
                    if (error) this.throwError(error);
                    resolve(body);
                })
            });
            const thumbnailRes = await this.clientManagement.getSpace(this.spaceId)
                .then((space) => space.createAssetFromFiles({
                    fields: {
                        title: {
                            [this.defaultArea]: name
                        },
                        description: {
                            [this.defaultArea]: caption
                        },
                        file: {
                            [this.defaultArea]: {
                                contentType: mimeType,
                                fileName: name,
                                file: thumbnailBinary
                            }
                        }
                    }
                }))
                .then((asset) => asset.processForAllLocales())
                .then((asset) => asset.publish())
                .catch(err => this.throwError(err))
            const thumbnailId = thumbnailRes.sys.id;

            objectAssignDeep(fields, {
                "thumbnails": {
                    [this.defaultArea]: {
                        "sys": {
                            "type": "Link",
                            "linkType": "Asset",
                            "id": thumbnailId
                        }
                    }
                }
            });
        }
        // thumbnail end

        console.log(fields)

        //entry upload process
        await this.clientManagement.getSpace(this.spaceId)
            .then(space => space.createEntry(this.contentModelDict[slug], {
                fields: fields
            }))
            .then(entry => entry.publish())
            .catch(err => this.throwError(err));
    }
    async uploadSomeContents(slugPosts, slug) {
        for (const post of slugPosts) {
            await this.uploadSingleContent(post, slug);
        };
    }
    async setContent() {
        if (this.posts.length !== this.slugs.length) this.throwError('some problems found in posts or slugs.');
        let promises = [];
        for (let i = 0; i < this.posts.length; i++) {
            promises.push(this.createContentModel(this.slugs[i]));
        }
        await Promise.all(promises);
        console.log('all contentModel created');
        console.log(this.contentModelDict);
        promises = new Array();
        for (let i = 0; i < this.posts.length; i++) promises.push(this.uploadSomeContents(this.posts[i], this.slugs[i]));
    }
}