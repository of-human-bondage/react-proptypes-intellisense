import React from 'react';
import PropTypes from 'prop-types';
import ComponentToImport from './ComponentToImport';
import ComponentWithPropsInPrototype from './ComponentWithPropsInPrototype';
import ComponentWithStaticPropTypes from './ComponentWithStaticPropTypes';

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
                <ComponentWithStaticPropTypes />
                <ComponentWithStaticPropTypes
                    boolProp={true}
                    
                    funcProp={() => {
                        console.log('cleofrom5to7');
                    }}
                />
                <ComponentWithStaticPropTypes
                    boolProp={true}
                    objectProp={ {film : "bandOfOutsiders"}}
                    funcProp={() => {
                        console.log('cleofrom5to7');
                    }}
                    
                />
                <ComponentWithPropsInPrototype />
                <ComponentInTheSameFile />
            </div>
        );
    }
}

class ComponentInTheSameFile extends React.Component {
    static propTypes = {
        boolProp: PropTypes.bool.isRequired
    };

    render() {
        return (
            <div className="classislav">
                <h1>Turnstile is: {this.props.isGood}</h1>
            </div>
        );
    }
}