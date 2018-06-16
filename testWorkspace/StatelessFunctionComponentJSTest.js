import React from 'react';
import PropTypes from 'prop-types';

export default class MainComponent extends React.Component {
    render() {
        return (
            <div className="daitro">
                <StatelessComponent />
            </div>
        );
    }
}

function StatelessComponent(props) {
    return (
        <div className="haveheart">
            <h1>Turnstile is: {props.boolProp}</h1>
        </div>
    );
}

StatelessComponent.propTypes = {
    boolProp: PropTypes.bool
};
