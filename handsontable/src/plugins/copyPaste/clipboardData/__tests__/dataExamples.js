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

export const simpleWithHeaders =
  toSingleLine`${META_HEAD}
    <table>
      <thead>
        <tr>
          <th>A</th>
          <th>B</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>A1</td>
          <td>B1</td>
        </tr>
      </tbody>
    </table>`;

export const simpleWithNestedHeaders =
  toSingleLine`
    <table>
     <thead>
       <tr>
         <th>A-1</th>
         <th>B-1</th>
       </tr>
       <tr>
         <th>A-0</th>
         <th>B-0</th>
       </tr>
     </thead>
     <tbody>
       <tr>
         <td>A1</td> 
         <td>B1</td> 
       </tr>
     </tbody>
   </table>`;

export const simpleWithOnlyNestedHeaders =
  toSingleLine`
    <table>
     <thead>
       <tr>
         <th>A-1</th>
         <th>B-1</th>
       </tr>
       <tr>
         <th>A-0</th>
         <th>B-0</th>
       </tr>
     </thead>
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

export const simpleWithGroupHeaders =
  toSingleLine`
    <table>
     <thead>
       <tr>
         <th colspan=3>A-0-0</th>
         <th colspan=3>D-0-0</th>
         <th>G-0-0</th>
         <th>H-0-0</th>
       </tr>
     </thead>
   </table>`;

export const simpleHandsontableWithOnlyHeaders = `${META_HEAD}${simpleTableWithOnlyHeaders}`;
