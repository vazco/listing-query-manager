<h1 align="center">
    <a href="https://github.com/vazco">vazco</a>/Listing Query Manager
</h1>

&nbsp;

<h3 align="center">
  -- Abandonware. This package is deprecated! --
</h3>

&nbsp;

This utility allows you to handle repetitive tasks related to fetching data for listing: state management, url parsing, validation. It keeps state in url, and transforms it to two additional formats:

1. Url - pretty and customizable formating
e.g.
```
    /my-listing?sort=created-desc&name=Donald%20T
```

2. Params - ready to pass as argument to server call. Only allowed fields will pass
e.g.
```javascript
    MyQuery.toQuery();
    // => {
    //     sort: 'created-desc',
    //     filter: {
    //         name: 'Donald T'
    //     }
    // }
```

2. Mongo query - ready to pass to mongo find(). Define your default regex pattern once and use it across whole project e.g.
```javascript
    MyQuery.toMongo();
    // => {
    //     sort: {
    //         createdAt: -1
    //     },
    //     filter: {
    //         name: {$regex: `^.*Donald T.*$`}
    //     }
    // }
```

### Usage
```javascript
import {QueryManager} from 'listing-query-manager';

// client and server: Define query
const ItemsQuery = QueryManager.define({
    filter: {
        title: 'regex',
        authorId: 'eq'
    },
    sort: {
        created: 'createdAt',
        title: 'title',
    }
});


// client: subscribe and get data
Meteor.subscribe('items', {
    query: ItemsQuery.toQuery()
}, function () {
    const {filter, sort} = ItemsQuery.toMongo();

    Items.find(filter, {sort});
});

// server: get data
Meteor.publish('items', function ({query}) {

    const {filter, sort} = ItemsQuery.toMongo({query});

    Items.find(filter, {sort});

    return cursor;
});

// client: handle sorting by render clickable labels
class Listing extends React.Component {
    render () {
        return (
            <ClickToSort name="name" queryParams={queryParams}>
                Name
            </ClickToSort>
            <ClickToSort name="createdAt" queryParams={queryParams}>
                Created At
            </ClickToSort>
        );
    }
}

// client: handle filtering

ItemsQuery.setFilter({
    name: 'Donald T'
});

```

### API
```javascript
// long form
Listing.define({
    filter: {
        name: (term) => {
            return {
                name: {$regex: `^.*${term}.*$`}
            }
        },
        itemId: (val) => {
            return {
                itemId
            }
        }
    },
    sort: {
        created: 'createdAt',
        title: 'title',
    }
});
```

### License

<img src="https://vazco.eu/banner.png" align="right">

**Like every package maintained by [Vazco](https://vazco.eu/), Listing Query Manager is [MIT licensed](https://github.com/vazco/uniforms/blob/master/LICENSE).**
