import Core from '../../core';
import ConditionCollection from './conditionCollection';

export default class ConditionUpdateObserver {
    constructor(hot: Core, conditionCollection: ConditionCollection, columnDataFactory?: () => any[]);
    groupChanges(): void;
    flush(): void;
    updateStatesAtColumn(column: number, conditionArgsChange: any): void;
    destroy(): void;
}
