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
    async customAxios(url, option) {
        try {
            return (await axios.get(url, option)).data;
        } catch (err) {
            console.log(err);
            process.exit();
        }
    }
    async getContentTypeId(){
        const url = `https://api.contentful.com/spaces/${this.spaceId}/environments/${this.environmentId}/content_types`;
        const response = await this.customAxios(url, {
            headers: { 'Authorization': `Bearer ${this.managementApiKey}` },
            data: {}
        });
        const items = response.items;
        for (const item of items){
            const name = item.name
            if (!this.slugs.includes(name)) continue;
            this.contentModelDict[name] = item.sys.id;
        }
        return;
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
        await this.getContentTypeId();
        let promises = [];
        for (let i = 0; i < this.posts.length; i++) promises.push(this.uploadSomeContents(this.posts[i], this.slugs[i]));
    }
}