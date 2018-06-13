import React from 'react';
import ComponentWithPropsInPrototype from './ComponentWithPropsInPrototype';

export default class MainComponent extends React.Component {
    render() {
        return (
            <div className="thursday">
                <ComponentWithPropsInPrototype />
            </div>
        );
    }
}
