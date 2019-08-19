import Table from '../table';
import calculatedRows from './mixin/calculatedRows';
import calculatedColumns from './mixin/calculatedColumns';
import { mixin } from './../../../../helpers/object';

class MasterTable extends Table {

}

mixin(MasterTable, calculatedRows);
mixin(MasterTable, calculatedColumns);

export default MasterTable;
