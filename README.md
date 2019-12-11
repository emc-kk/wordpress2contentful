wordpress2contentful
====

Migration from Wordpress Custom Post data to Contentful data. 

## Description

The purpose of this script is migrating or updating from Wordpress Custom Post data to Contentful data.

Wordpress has so rich editor and plugins helping not only we developers but also non-programmers. On the other hand, Contentful has so useful and high-performance Headless API Systems. This script makes us to enjoy the both advantages.

## Usage

###!!Attention!!

This script cannot support Simple Post Type. So, need to set Custom Post Type and migrate Simple Post data to the Custom Post Type's before running this script if handling Simple Post Type. (Recommend using [Custom Post Type UI](https://ja.wordpress.org/plugins/custom-post-type-ui/))

###Common

Neccessary information.

- Wordpress Information 

  - "Wordpress rest url"(ex: https://example.com/wp-json/wp/v2)

  - "Wordpress custom post type slug names"(ex: ["example_slug1","example_slug2", ...])

    Or (Only one of these two)

  -  "Wordpress custom posts and custom post type slug names of those" (ex: 
    {  "example_slug1":  ["example_post1", ...], ... } )

- Contentful Information 
  - "Contentful Delivery API" ([see here](https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/spaces))
  - "Contentful Management API"([see here](https://www.contentful.com/developers/docs/references/content-management-api/))
  -  "Contentful Space ID"
  -  "Contentful Environment ID" (default: master)
  -  "Contentful Area"(default: en-US)

#### Usage 1

First, set  information to be migrated on ./custom-setup/setup.json.

Second, run node index.js {env}.

```yarn install```

```node index.js WORDPRESS_REST_URL=string CONTENTFUL_MANAGEMENT_API_KEY=string CONTENTFUL_DELIVERY_API_KEY=string CONTENTFUL_SPACE_ID=string CONTENTFUL_ENVIRONMENT_ID=string CONTENTFUL_DEFAULT_AREA=string  ```

#### Usage2

#####Should not use this way when on published projects. 

First, set  information to be migrated on ./custom-setup/setup.json.

Second, set env infomation on ./custom-setup/.env.json.

```yarn install```

```node index.js```

### Why Custom Post Type?

The reason is very simple. Custom Post Type gose well with Contentful( Contentful fields and Custom Post Type play similar role).

In addtion, Custom Post Type and Simple Post Type has almost the same system of database. The diffrences between these are only UI ,Name and flexibility.

## Licence

MIT

