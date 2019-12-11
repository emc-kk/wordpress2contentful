const axios = require('axios');
module.exports = class wordpressClass {
    constructor(wordpressSetup) {
        this.restUrl = wordpressSetup.restUrl.replace(/\/$/, '') + '/';
        this.slugs = wordpressSetup.slugs;
        this.tagSlugs = [];
        this.categorySlugs = [];
        this.taxonomyPromises = [];
        this.allTaxonomies = [];
    }
    async customAxios(url) {
        try {
            return (await axios.get(url)).data;
        } catch (err) {
            console.log(err);
            process.exit();
        }
    }
    async getSingleRelation(url) {
        const json = await this.customAxios(url);
        if (!json) return null;
        if (!json[0]) return null;
        return json[0];
    }
    async handleTaxonomies(taxonomies, id) {
        for (const taxonomy of taxonomies) {
            const json = await this.getSingleRelation(`${this.restUrl}${taxonomy}?post=${id}`);
            if (!json) return null;
            const set = {
                'taxonomy': taxonomy,
                'postId': id,
                'name': json.name
            };
            this.allTaxonomies.push(set);
            if (this.categorySlugs.includes(taxonomy) || this.tagSlugs.includes(taxonomy)) continue;
            if (json.parent == undefined || json.parent == null) this.tagSlugs.push(taxonomy);
            else this.categorySlugs.push(taxonomy);
        }
    }
    async getThumbnailPath(id) {
        const json = await this.getSingleRelation(`${this.restUrl}media?parent=${id}`);
        if (!json) return {
            thumbnailPath: null,
            name: null,
            caption: null,
            mimeType: null
        };
        const thumbnailPath = json.guid.rendered;
        const name = json.title.rendered ? json.title.rendered : "unkown";
        const caption = json.caption.rendered ? json.caption.rendered : "";
        const mimeType = json.mime_type;
        if (!(thumbnailPath && name && mimeType)) {
            console.log(`postId:${id} thumbnailPath or name or mimeType not found`);
            console.log(json)
            process.exit();
        }
        return {
            thumbnailPath,
            name,
            caption,
            mimeType
        };
    }
    async renderPost(post) {
        const id = post.id;
        const title = post.title.rendered;
        const content = post.content.rendered;
        const taxonomies = post._links['wp:term'].map(json => json.taxonomy);
        this.taxonomyPromises.push(this.handleTaxonomies(taxonomies, id));
        const thumbnail = await this.getThumbnailPath(id);
        return {
            id,
            title,
            content,
            thumbnail
        };
    };
    async getPosts() {
        const posts = [];
        for (const slug of this.slugs) {
            const slugPosts = [];
            const data = await this.customAxios(`${this.restUrl}${slug}`);
            for (const post of data) {
                slugPosts.push(await this.renderPost(post));
            };
            posts.push(slugPosts);
        };
        await Promise.all(this.taxonomyPromises);
        return {
            posts: posts,
            slugs: this.slugs,
            tagSlugs: this.tagSlugs,
            categorySlugs: this.categorySlugs,
            allTaxonomies: this.allTaxonomies
        };
    };
}