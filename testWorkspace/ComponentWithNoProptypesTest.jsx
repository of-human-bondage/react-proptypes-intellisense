import React from 'react';
import ComponentWithoutProps from './ComponentWithoutProps';

export default class MainComponent extends React.Component {
    render() {
        return (
            <div className="thursday">
                <ComponentWithoutProps />
            </div>
        );
    }
}
