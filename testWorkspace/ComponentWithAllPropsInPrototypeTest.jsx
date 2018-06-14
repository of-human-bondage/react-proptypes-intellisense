import React from 'react';
import ComponentWithPropsInPrototype from './ComponentWithPropsInPrototype';

export default class MainComponent extends React.Component {
    render() {
        return (
            <div className="thursday">
                <ComponentWithPropsInPrototype
                    boolProp={true}
                    objectProp={{ film: 'bandOfOutsiders' }}
                    funcProp={() => {
                        console.log('cleofrom5to7');
                    }}
                    
                />
            </div>
        );
    }
}