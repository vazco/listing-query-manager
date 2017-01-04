import _ from 'lodash';


/*
 *  Each resolver defines how to translate value to mongo selector
 */
const predefinedMongoResolvers = {
    regex: ({value, fieldName}) => {
        return {
            [fieldName]: {$regex: `^.*${value}.*$`}
        };
    },
    eq: ({value, fieldName}) => {
        return {
            [fieldName]: value
        };
    }
};


const define = function define (config = {}) {
    const mongoResolvers = {};


    _.each(config.filter, (definition, name) => {
        let resolver;
        if (_.isString(definition)) {
            resolver = predefinedMongoResolvers[definition];
        } else if (_.isFunction(definition)) {
            resolver = definition;
        }

        if (!resolver) {
            throw new Error(`Invalid filter config for field: ${name}.
                Should be String (${Object.keys(predefinedMongoResolvers)}) or function({value, fieldName})`);
        }

        mongoResolvers[name] = resolver;

    });

    const filterParamsToMongo = params => {
        const mongoFilter = {};

        _.each(params, (value, name) => {
            const resolver = mongoResolvers[name];
            if (!resolver) {
                throw new Error('Invalid filter param: ' + name);
            }
            _.extend(mongoFilter, resolver({
                fieldName: name,
                value
            }));
        });

        return mongoFilter;
    };

    return {
        toQuery: ({queryParams, infix}) => {
            // transform url to params
            return {
                filter: _.pick(queryParams, Object.keys(config.filter)),
                sort: queryParams && queryParams[getSortParamKey({infix})]
            };
        },
        toMongo: ({query, queryParams}) => {
            // transform query or queryParams to mongo query
            let mongoQuery = {filter: {}, sort: {}};
            if (query) {
                mongoQuery = {
                    filter: _.pick(query.filter, Object.keys(config.filter)),
                    sort: parseSortString(query.sort)
                };
            } else if (queryParams) {
                mongoQuery = {
                    filter: _.pick(queryParams, Object.keys(config.filter)),
                    sort: getSortFromUrl({queryParams})
                };
            }

            mongoQuery.filter = filterParamsToMongo(mongoQuery.filter);

            return mongoQuery;
        },
        setFilter: ({queryParams, router, filter}) => {
            const query = Object.assign({}, queryParams, _.pick(filter, Object.keys(config.filter)));
            router.replaceWith({query});
        }
    };
};


/*
 *  We keep sort state in url param. This param can be customized by infix e.g. sort-by or sort-items-by
 */
function getSortParamKey ({infix} = {}) {
    return 'sort' + (infix ? '-' + infix : '') + '-by';
}

/*
 *  returns {fieldName: 1/-1}
 */
function getSortFromUrl ({infix, queryParams}) {
    const paramKey = getSortParamKey({infix});
    const paramVal = queryParams && queryParams[paramKey];
    if (!paramVal) {
        return undefined;
    }
    return parseSortString(paramVal);
}

function parseSortString (sortString) {
    if (!sortString) {
        return {};
    }
    const matches = sortString.match(/^(.*)-(asc|desc)$/);
    return {
        [matches[1]]: (matches[2] === 'asc' ? 1 : -1)
    };
}

/*
 *  Takes {fieldName: 1} returns {'sort-by': 'fieldName:asc'}
 */
export const createSortQuery = ({infix, sort}) => {
    const sortField = _.keys(sort)[0];
    const order = sort[sortField];
    const paramKey = getSortParamKey({infix});

    return {
        [paramKey]: [sortField, order > 0 ? 'asc' : 'desc'].join('-')
    };
};

/*
 *  Takes fieldName returns {'sort-by': 'fieldName:asc'} or {'sort-by': 'fieldName:desc'}
 *  depending on previous sort order
 */
export const createSortQueryToggle = ({infix, name, queryParams = {}}) => {
    const currentSort = getSortFromUrl({infix, queryParams});
    const newOrder = currentSort && currentSort[name] && -currentSort[name] || -1;
    return Object.assign({}, queryParams, createSortQuery({infix, sort: {
        [name]: newOrder
    }}));
};


export const QueryManager = {
    define
};
