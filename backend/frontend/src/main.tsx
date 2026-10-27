import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient,QueryClientProvider,useQuery,useQueryClient } from '@tanstack/react-query';
import { createRootRoute,createRoute,createRouter,RouterProvider,Link,Outlet } from '@tanstack/react-router';
import { Building2,Files,ListTodo,LayoutDashboard,FileText,RefreshCw,LogOut,ChevronLeft,ArrowUpLeft,ShieldCheck,X,Menu,Bell } from 'lucide-react';
import {request,logout,type User,type RecordRow} from './api';
import { Button } from './components/Button';
import { DataTable,display,type Field } from './components/DataTable';
import {CustomerEditor} from './components/CustomerEditor';
import {customerProfileFields} from './customerProfile';
import {CustomerDocuments} from './components/CustomerDocuments';
import {Notifications,type AppNotification} from './components/Notifications';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/700.css';
import './styles.css';

const UserContext=createContext<User|null>(null);
function useUser(){const user=useContext(UserContext);if(!user)throw new Error('identity_required');return user;}
type Resource='customers'|'cases'|'tasks'|'documents';
function useRecords(resource:Resource){const user=useUser();return useQuery({queryKey:['records',user.organization_id,resource],queryFn:()=>request<RecordRow[]>(resource),enabled:resource!=='customers'||user.role==='admin'});}
const resources:{key:Resource;name:string;description:string;icon:typeof Files;fields:Field[]}[]=[
  {key:'customers',name:'مشتریان',description:'شرکت‌ها و صاحبان کالای ثبت‌شده',icon:Building2,fields:[{key:'name',label:'نام مشتری'},{key:'contact_name',label:'رابط'},{key:'phone',label:'تلفن ثابت'},{key:'mobile',label:'همراه'},{key:'is_active',label:'وضعیت'}]},
  {key:'cases',name:'پرونده‌ها',description:'پرونده‌های مجاز در محدوده دسترسی شما',icon:Files,fields:[{key:'real_case_number',label:'شماره پرونده'},{key:'id',label:'شناسه'},{key:'operation_type',label:'نوع عملیات'},{key:'customs',label:'گمرک'},{key:'status',label:'وضعیت'}]},
  {key:'tasks',name:'وظایف',description:'کارها، موعدها و اقدام‌های بعدی',icon:ListTodo,fields:[{key:'title',label:'موضوع'},{key:'priority',label:'اولویت'},{key:'status',label:'وضعیت'},{key:'due_at',label:'موعد'}]},
  {key:'documents',name:'اسناد',description:'فهرست اسناد قابل مشاهده در پرونده‌ها',icon:FileText,fields:[{key:'title',label:'عنوان سند'},{key:'document_type',label:'نوع سند'},{key:'status',label:'وضعیت'},{key:'version',label:'نسخه'}]},
];
const roleNames:Record<string,string>={admin:'مدیر سامانه',internal_employee:'کارمند داخلی',customer_manager:'مدیر مشتری',customer_employee:'کارمند مشتری'};
function EmptyState({icon:Icon=Files,title,description}:{icon?:typeof Files;title:string;description:string}){return <div className="empty-state"><div className="empty-icon"><Icon size={26}/></div><h3>{title}</h3><p>{description}</p></div>;}
function Loading(){return <p className="loading" role="status">در حال دریافت اطلاعات…</p>;}
function ErrorState({retry}:{retry:()=>void}){return <div className="error-state" role="alert"><p>دریافت اطلاعات انجام نشد.</p><Button variant="outline" onClick={retry}>تلاش دوباره</Button></div>;}

function Frame(){
  const me=useQuery({queryKey:['me'],queryFn:()=>request<User>('users/me'),retry:false});
  const inbox=useQuery({queryKey:['notifications'],queryFn:()=>request<AppNotification[]>('notifications'),enabled:me.data?.role==='admin',refetchInterval:60000});
  const [menu,setMenu]=useState(false);const [error,setError]=useState('');const cache=useQueryClient();
  if(me.isPending)return <Loading/>;
  if(me.isError)return <main className="session-error"><ShieldCheck size={34}/><h1>ورود به حساب لازم است</h1><p>{me.error.message}</p><a href="/login">باز کردن صفحه ورود</a></main>;
  const user=me.data;const visible=resources.filter(r=>r.key!=='customers'||user.role==='admin');
  return <UserContext.Provider value={user}><div className="app-shell"><aside className={menu?'sidebar is-open':'sidebar'}><a className="brand" href="/app"><span className="brand-symbol"><Files size={23}/></span><span>کاراترخیص<small>مدیریت عملیات ترخیص</small></span></a><p className="nav-label">فضای کاری</p><nav aria-label="ناوبری اصلی"><Link to="/" onClick={()=>setMenu(false)} activeOptions={{exact:true}} activeProps={{className:'nav-item active'}} className="nav-item"><LayoutDashboard size={18}/>نمای کلی</Link>{visible.map(r=><Link key={r.key} to={'/'+r.key as '/cases'} onClick={()=>setMenu(false)} activeProps={{className:'nav-item active'}} className="nav-item"><r.icon size={18}/>{r.name}</Link>)}</nav><div className="sidebar-bottom"><div className="scope-note"><ShieldCheck size={17}/><span>{user.scope_type==='SELECTED_CASES'?'دسترسی به پرونده‌های انتخاب‌شده':'دسترسی متناسب با نقش شما'}</span></div><span className="environment">محیط آزمایشی</span></div></aside>{menu&&<button className="menu-backdrop" aria-label="بستن منو" onClick={()=>setMenu(false)}/>}<div className="workspace"><header className="topbar"><div className="topbar-title"><Button className="mobile-menu" variant="ghost" size="icon" aria-label="باز کردن منو" onClick={()=>setMenu(true)}><Menu size={21}/></Button><span>فضای کاری کاراترخیص</span><ChevronLeft size={14}/><span className="muted">پنل عملیات</span></div><div className="topbar-user">{user.role==='admin'&&<Link to="/notifications" className="notification-bell" aria-label="اعلان‌ها"><Bell size={19}/>{!!inbox.data?.filter(n=>!n.read_at).length&&<span>{inbox.data.filter(n=>!n.read_at).length.toLocaleString('fa-IR')}</span>}</Link>}<span className="avatar">{user.full_name.slice(0,1)}</span><div><strong>{user.full_name}</strong><small>{roleNames[user.role]||'کاربر'}</small></div><Button variant="ghost" size="icon" aria-label="خروج از حساب" onClick={async()=>{try{await logout();location.assign('/login');}catch(e){setError(e instanceof Error?e.message:'خروج انجام نشد.');}}}><LogOut size={18}/></Button></div></header>{error&&<p className="global-error" role="alert">{error}</p>}<main className="content"><div className="toolbar"><p className="today">{new Intl.DateTimeFormat('fa-IR',{dateStyle:'full'}).format(new Date())}</p><Button variant="outline" onClick={()=>void cache.invalidateQueries({queryKey:['records']})}><RefreshCw size={15}/>تازه‌سازی اطلاعات</Button></div><Outlet/></main><footer className="app-footer"><span>کاراترخیص</span><span>نسخه اولیه · مدیریت عملیات</span></footer></div></div></UserContext.Provider>;
}

function Overview(){
  const user=useUser();const cases=useRecords('cases'),tasks=useRecords('tasks'),documents=useRecords('documents');
  const queryStates=[cases,tasks,documents];
  const openTasks=tasks.data?.filter(t=>!['انجام شد','لغو شده'].includes(String(t.status)));
  return <><div className="page-heading"><div><p className="eyebrow">خلاصه فضای کاری</p><h1>روز بخیر، {user.full_name}</h1><p>پرونده‌ها و کارهای در دسترس خود را از اینجا دنبال کنید.</p></div></div><div className="metrics">{[{title:'پرونده‌های قابل مشاهده',query:cases,count:cases.data?.length,icon:Files,to:'/cases'},{title:'وظایف باز',query:tasks,count:openTasks?.length,icon:ListTodo,to:'/tasks'},{title:'اسناد قابل مشاهده',query:documents,count:documents.data?.length,icon:FileText,to:'/documents'}].map(item=><Link key={item.title} to={item.to as '/cases'} className="metric"><div><span>{item.title}</span><span className="metric-icon"><item.icon size={20}/></span></div><strong>{item.query.isPending?'…':item.query.isError?'—':(item.count||0).toLocaleString('fa-IR')}</strong><small>مشاهده فهرست<ArrowUpLeft size={15}/></small></Link>)}</div><div className="overview-columns"><section className="surface"><div className="surface-heading"><h2>آخرین پرونده‌ها</h2><Link to="/cases">همه پرونده‌ها<ArrowUpLeft size={14}/></Link></div>{cases.isPending?<Loading/>:cases.isError?<ErrorState retry={()=>void cases.refetch()}/>:cases.data.length===0?<EmptyState title="هنوز پرونده‌ای در دسترس نیست" description="پرونده‌های ثبت‌شده یا تخصیص‌یافته، در این بخش نمایش داده می‌شوند."/>:<ul className="record-list">{cases.data.slice(0,5).map(row=><li key={row.id}><div><Files size={18}/><strong>{display(row.real_case_number||row.id)}</strong><small>{display(row.customs)}</small></div><span className="status-badge">{display(row.status)}</span></li>)}</ul>}</section><section className="surface"><div className="surface-heading"><h2>کارهای پیش رو</h2><Link to="/tasks">همه وظایف<ArrowUpLeft size={14}/></Link></div>{tasks.isPending?<Loading/>:tasks.isError?<ErrorState retry={()=>void tasks.refetch()}/>:!openTasks?.length?<EmptyState icon={ListTodo} title="وظیفه بازی وجود ندارد" description="با ثبت یا تخصیص وظیفه، کارهای پیش رو اینجا قرار می‌گیرند."/>:<ul className="record-list">{openTasks.slice(0,5).map(row=><li key={row.id}><div><ListTodo size={18}/><strong>{display(row.title)}</strong></div><span className="status-badge">{display(row.priority)}</span></li>)}</ul>}</section></div>{queryStates.some(q=>q.isError)&&<p className="muted" role="status">بخشی از اطلاعات دریافت نشده است؛ از دکمه تازه‌سازی استفاده کنید.</p>}<div className="access-banner"><ShieldCheck size={21}/><div><strong>اطلاعات در محدوده دسترسی شما</strong><p>فهرست‌ها بر اساس سازمان، نقش و دسترسی پرونده نمایش داده می‌شوند.</p></div></div></>;
}

function Detail({record,fields,onClose,onEdit,customerDocuments=false}:{record:RecordRow|null;fields:Field[];onClose:()=>void;onEdit?:()=>void;customerDocuments?:boolean}){
  const dialog=useRef<HTMLDialogElement>(null);
  const [tab,setTab]=useState('profile');
  useEffect(()=>{if(record&&!dialog.current?.open)dialog.current?.showModal();if(!record&&dialog.current?.open)dialog.current.close();},[record]);
  useEffect(()=>{setTab(new URLSearchParams(location.search).get('tab')==='documents'?'documents':'profile');},[record?.id]);
  return <dialog ref={dialog} onCancel={onClose} onClose={onClose} className={customerDocuments?'detail-dialog customer-detail':'detail-dialog'} aria-labelledby="detail-title">
    <header><h2 id="detail-title">{customerDocuments?'پرونده مشتری · '+String(record?.name??''):'جزئیات رکورد'}</h2><Button variant="ghost" size="icon" aria-label="بستن جزئیات" onClick={onClose}><X size={20}/></Button></header>
    {customerDocuments&&<div className="detail-tabs" role="tablist" aria-label="بخش‌های مشتری"><button role="tab" id="profile-tab" aria-selected={tab==='profile'} aria-controls="profile-panel" onClick={()=>setTab('profile')}>مشخصات مشتری</button><button role="tab" id="documents-tab" aria-selected={tab==='documents'} aria-controls="documents-panel" onClick={()=>setTab('documents')}>مدارک و مجوزها</button></div>}
    <div id="profile-panel" role={customerDocuments?'tabpanel':undefined} aria-labelledby={customerDocuments?'profile-tab':undefined} hidden={customerDocuments&&tab!=='profile'}>
      <dl>{record&&fields.map(field=><div key={field.key}><dt>{field.label}</dt><dd>{display(record[field.key])}</dd></div>)}</dl><p className="muted">شناسه: <bdi>{record?.id}</bdi></p>{onEdit&&<Button onClick={onEdit}>ویرایش اطلاعات مشتری</Button>}
    </div>
    {customerDocuments&&record&&<div id="documents-panel" role="tabpanel" aria-labelledby="documents-tab" hidden={tab!=='documents'}><CustomerDocuments key={record.id} customerId={record.id}/></div>}
  </dialog>;
}

function ResourcePage({resource}:{resource:Resource}){
  const config=resources.find(r=>r.key===resource)!;const user=useUser();const query=useRecords(resource);const [selected,setSelected]=useState<RecordRow|null>(null);
  const [editor,setEditor]=useState<{record:RecordRow|null}|null>(null);const [notice,setNotice]=useState('');
  const requestedCustomer=new URLSearchParams(location.search).get('customer');
  useEffect(()=>{if(resource==='customers'&&requestedCustomer&&query.data){const row=query.data.find(item=>item.id===requestedCustomer);if(row)setSelected(row);}},[resource,requestedCustomer,query.data]);
  if(resource==='customers'&&user.role!=='admin')return <EmptyState icon={ShieldCheck} title="این بخش برای نقش شما فعال نیست" description="از منوی پرونده‌ها و وظایف برای دنبال‌کردن کارهای خود استفاده کنید."/>;
  return <><div className="page-heading"><div><p className="eyebrow">اطلاعات عملیاتی</p><h1>{config.name}</h1><p>{config.description}</p></div><div className="page-actions">{resource==='customers'&&user.role==='admin'&&<Button onClick={()=>{setNotice('');setEditor({record:null});}}>مشتری جدید</Button>}<span className="page-icon"><config.icon size={25}/></span></div></div>{notice&&<p className="save-notice" role="status">{notice}</p>}<section className="surface">{query.isPending?<Loading/>:query.isError?<ErrorState retry={()=>void query.refetch()}/>:query.data.length===0?<EmptyState icon={config.icon} title={'هنوز '+config.name+' ثبت نشده است'} description="پس از ثبت یا تخصیص اطلاعات، فهرست این بخش نمایش داده می‌شود."/>:<DataTable data={query.data} fields={config.fields} onInspect={setSelected}/>}</section><Detail customerDocuments={resource==='customers'&&user.role==='admin'} record={selected} fields={resource==='customers'?[{key:'name',label:'نام مشتری'},{key:'customer_type',label:'نوع مشتری'},...customerProfileFields,{key:'is_active',label:'وضعیت'}]:config.fields} onClose={()=>{setSelected(null);if(requestedCustomer)history.replaceState(null,'',location.pathname);}} onEdit={resource==='customers'&&user.role==='admin'&&selected?()=>{setEditor({record:selected});setSelected(null);}:undefined}/>{editor&&<CustomerEditor record={editor.record} onClose={()=>setEditor(null)} onSaved={()=>{setEditor(null);setNotice('اطلاعات مشتری ذخیره شد.');}}/>}</>;
}

const rootRoute=createRootRoute({component:Frame});
const overviewRoute=createRoute({getParentRoute:()=>rootRoute,path:'/',component:Overview});
const customersRoute=createRoute({getParentRoute:()=>rootRoute,path:'/customers',component:()=> <ResourcePage resource="customers"/>});
const casesRoute=createRoute({getParentRoute:()=>rootRoute,path:'/cases',component:()=> <ResourcePage resource="cases"/>});
const tasksRoute=createRoute({getParentRoute:()=>rootRoute,path:'/tasks',component:()=> <ResourcePage resource="tasks"/>});
const documentsRoute=createRoute({getParentRoute:()=>rootRoute,path:'/documents',component:()=> <ResourcePage resource="documents"/>});
const notificationsRoute=createRoute({getParentRoute:()=>rootRoute,path:'/notifications',component:Notifications});
const router=createRouter({routeTree:rootRoute.addChildren([overviewRoute,customersRoute,casesRoute,tasksRoute,documentsRoute,notificationsRoute]),basepath:'/app',defaultPreload:'intent'});
declare module '@tanstack/react-router'{interface Register{router:typeof router}}
const client=new QueryClient({defaultOptions:{queries:{retry:false,staleTime:30000}}});
createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={client}><RouterProvider router={router}/></QueryClientProvider></React.StrictMode>);
