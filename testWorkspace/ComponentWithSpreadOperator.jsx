import React from 'react';
import PropTypes from 'prop-types';

export default class MainComponent extends React.Component {
    render() {
        const baseProps = { boolProp: false };

        return (
            <div className="daitro">
                <ComponentWithSpreadOperator  {...baseProps} />
            </div>
        );
    }
}

function ComponentWithSpreadOperator(props) {
    return (
        <div className="haveheart">
            <h1>Turnstile is: {props.boolProp}</h1>
        </div>
    );
}

ComponentWithSpreadOperator.propTypes = {
    boolProp: PropTypes.bool,
    funcProp: PropTypes.func
};
