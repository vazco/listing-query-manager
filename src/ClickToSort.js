import React from 'react';
import Link from 'react-router/Link';
import {createSortQueryToggle} from './QueryManager';

export class ClickToSort extends React.Component {
    render () {
        return (
            <Link
                to={{
                    query: createSortQueryToggle({
                        name: this.props.name,
                        queryParams: this.props.queryParams
                    })
                }}
            >
                {
                    ({onClick}) => React.cloneElement(this.props.children, {onClick})
                }
            </Link>
        );
    }
}

export default ClickToSort;
