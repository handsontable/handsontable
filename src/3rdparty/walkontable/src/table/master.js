import Table from '../table';
import calculatedRows from './mixin/calculatedRows';
import { mixin } from './../../../../helpers/object';

class MasterTable extends Table {

}

mixin(MasterTable, calculatedRows);

export default MasterTable;
