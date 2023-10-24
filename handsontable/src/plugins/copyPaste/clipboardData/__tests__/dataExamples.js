import { toSingleLine } from '../../../../helpers/templateLiteralTag';
import { META_HEAD } from '../clipboardData';

export const simpleWithMergedCell =
  toSingleLine`${META_HEAD}
    <table>
      <tbody>
        <tr>
          <td rowspan="2" colspan="2">B2</td>
        </tr>
        <tr>
        </tr>
      </tbody>
    </table>`;

export const simpleTableWithOnlyHeaders =
  toSingleLine`
    <table>
     <thead>
       <tr>
         <th>A-0-0</th>
         <th>A-0-1</th>
       </tr>
     </thead>
   </table>`;

export const simpleHandsontableWithOnlyHeaders = `${META_HEAD}${simpleTableWithOnlyHeaders}`;
