import { useMemo,useState } from 'react';
import { flexRender,getCoreRowModel,getFilteredRowModel,getSortedRowModel,useReactTable,type ColumnDef,type SortingState } from '@tanstack/react-table';
import { ArrowDownUp,Search } from 'lucide-react';
import type { RecordRow } from '../api';
export type Field = {key:string;label:string};
export function display(value:unknown){if(value===null||value===undefined||value==='')return '—';if(typeof value==='boolean')return value?'فعال':'غیرفعال';return String(value);}
export function DataTable({data,fields,onInspect}:{data:RecordRow[];fields:Field[];onInspect:(row:RecordRow)=>void}){
  const [search,setSearch]=useState('');const [sorting,setSorting]=useState<SortingState>([]);
  const columns=useMemo<ColumnDef<RecordRow>[]>(()=>fields.map((field,index)=>({accessorKey:field.key,header:field.label,cell:({getValue,row})=>index===0?<button className="record-link" onClick={()=>onInspect(row.original)}>{display(getValue())}</button>:<span className={field.key==='status'?'status-badge':''}>{display(getValue())}</span>})),[fields,onInspect]);
  const table=useReactTable({data,columns,state:{globalFilter:search,sorting},onGlobalFilterChange:setSearch,onSortingChange:setSorting,getCoreRowModel:getCoreRowModel(),getFilteredRowModel:getFilteredRowModel(),getSortedRowModel:getSortedRowModel(),getRowId:row=>row.id});
  return <><div className="table-tools"><label className="search"><Search size={17}/><input aria-label="جست‌وجو در اطلاعات" placeholder="جست‌وجو در این فهرست…" value={search} onChange={e=>setSearch(e.target.value)}/></label><span>{table.getFilteredRowModel().rows.length.toLocaleString('fa-IR')} مورد</span></div><div className="table-scroll"><table><thead>{table.getHeaderGroups().map(group=><tr key={group.id}>{group.headers.map(header=><th key={header.id} scope="col"><button onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header,header.getContext())}<ArrowDownUp size={13}/></button></th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map(row=><tr key={row.id}>{row.getVisibleCells().map(cell=><td key={cell.id}>{flexRender(cell.column.columnDef.cell,cell.getContext())}</td>)}</tr>)}</tbody></table>{table.getRowModel().rows.length===0&&<p className="no-result">نتیجه‌ای برای این جست‌وجو پیدا نشد.</p>}</div></>;
}
