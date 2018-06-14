import React from 'react';
import ComponentWithIncorrectSyntax from './ComponentWithIncorrectSyntax';

export default class MainComponent extends React.Component {
    render() {
        return (
            <div className="thursday">
                <ComponentWithIncorrectSyntax />
            </div>
        );
    }
}