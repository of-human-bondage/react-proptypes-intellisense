import React from 'react';
import AnonymousComponent from './AnonymousComponent';

export default class MainComponent extends React.Component {
    render() {
        return (
            <div className="thursday">
                <AnonymousComponent />
            </div>
        );
    }
}
