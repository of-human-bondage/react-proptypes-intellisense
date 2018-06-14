import React from 'react';
import ComponentToImport from './ComponentToImport';

export default class MainComponent extends React.Component {
    render() {
        return (
            <div className="classislav">
                <h1>My name is {this.props.name}</h1>
                <ul>
                    <li>Turnstile</li>
                    <li>Bane</li>
                    <li>No warning</li>
                </ul>
                <ComponentToImport />
            </div>
        );
    }
}
