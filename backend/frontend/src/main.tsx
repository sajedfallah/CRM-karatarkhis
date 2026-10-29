import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient,QueryClientProvider,useQuery,useQueryClient } from '@tanstack/react-query';
import { createRootRoute,createRoute,createRouter,RouterProvider,Link,Outlet,useRouterState } from '@tanstack/react-router';
import { Building2,Files,ListTodo,LayoutDashboard,FileText,RefreshCw,LogOut,ChevronDown,ChevronLeft,ArrowUpLeft,ShieldCheck,X,Menu,Bell } from 'lucide-react';
import {request,logout,type User,type RecordRow} from './api';
import { Button } from './components/Button';
import { DataTable,display,type Field } from './components/DataTable';
import {CustomerEditor} from './components/CustomerEditor';
import {customerProfileFields} from './customerProfile';
import {CustomerReviewer} from './components/CustomerReviewer';
import {CustomerManagerAccess} from './components/CustomerManagerAccess';
import {CustomerDocuments} from './components/CustomerDocuments';
import {Notifications,type AppNotification} from './components/Notifications';
import {CaseDeclarations,DeclarationsPage} from './components/Declarations';
import {CustomerDraftReviewsPage} from './components/DraftCustomerReview';
import {CaseRegistrationRequestsPage} from './components/CaseRegistrationRequests';
import {CustomerTeamPage} from './components/CustomerTeam';
import {CaseWorkflow} from './components/CaseWorkflow';
import {CaseWorkflowMessages} from './components/CaseWorkflowMessages';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/700.css';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/600.css';
import '@fontsource/vazirmatn/700.css';
import './styles.css';

const UserContext=createContext<User|null>(null);
function useUser(){const user=useContext(UserContext);if(!user)throw new Error('identity_required');return user;}
type Resource='customers'|'cases'|'tasks'|'documents';
function useRecords(resource:Resource){const user=useUser();return useQuery({queryKey:['records',user.organization_id,resource],queryFn:()=>request<RecordRow[]>(resource),enabled:resource!=='customers'||user.role==='admin'});}
const resources:{key:Resource;name:string;description:string;icon:typeof Files;fields:Field[]}[]=[
  {key:'customers',name:'مشتریان',description:'شرکت‌ها و صاحبان کالای ثبت‌شده',icon:Building2,fields:[{key:'name',label:'نام مشتری'},{key:'email',label:'ایمیل مدیر شرکت'},{key:'contact_name',label:'رابط'},{key:'phone',label:'تلفن ثابت'},{key:'mobile',label:'همراه'},{key:'is_active',label:'وضعیت'}]},
  {key:'cases',name:'پرونده‌ها',description:'پرونده‌های مجاز در محدوده دسترسی شما',icon:Files,fields:[{key:'real_case_number',label:'شماره پرونده'},{key:'id',label:'شناسه'},{key:'operation_type',label:'نوع عملیات'},{key:'customs',label:'گمرک'},{key:'status',label:'وضعیت'}]},
  {key:'tasks',name:'وظایف',description:'کارها، موعدها و اقدام‌های بعدی',icon:ListTodo,fields:[{key:'title',label:'موضوع'},{key:'priority',label:'اولویت'},{key:'status',label:'وضعیت'},{key:'due_at',label:'موعد'}]},
  {key:'documents',name:'اسناد',description:'فهرست اسناد قابل مشاهده در پرونده‌ها',icon:FileText,fields:[{key:'title',label:'عنوان سند'},{key:'document_type',label:'نوع سند'},{key:'status',label:'وضعیت'},{key:'version',label:'نسخه'}]},
];
const roleNames:Record<string,string>={admin:'مدیر سامانه',internal_employee:'کارمند داخلی',customer_manager:'مدیر مشتری',customer_employee:'کارمند مشتری'};
function EmptyState({icon:Icon=Files,title,description}:{icon?:typeof Files;title:string;description:string}){return <div className="empty-state"><div className="empty-icon"><Icon size={26}/></div><h3>{title}</h3><p>{description}</p></div>;}
function Loading(){return <p className="loading" role="status">در حال دریافت اطلاعات…</p>;}
function ErrorState({retry}:{retry:()=>void}){return <div className="error-state" role="alert"><p>دریافت اطلاعات انجام نشد.</p><Button variant="outline" onClick={retry}>تلاش دوباره</Button></div>;}

function CaseNavigation({user,pendingCount,onNavigate}:{user:User;pendingCount:number;onNavigate:()=>void}){
  const pathname=useRouterState({select:state=>state.location.pathname});
  const inGroup=/\/(cases|drafts|declarations|documents|customer-reviews|case-requests)\/?$/.test(pathname);
  const [open,setOpen]=useState(inGroup);
  useEffect(()=>{if(inGroup)setOpen(true);},[pathname,inGroup]);
  return <details className={'nav-group'+(inGroup?' is-current':'')} open={open} onToggle={event=>setOpen(event.currentTarget.open)}>
    <summary className="nav-item"><Files size={18}/><span>پرونده‌ها</span>{pendingCount>0&&<span className="nav-count" aria-label="درخواست‌های نیازمند بررسی">{pendingCount.toLocaleString('fa-IR')}</span>}<ChevronDown size={15} className="nav-chevron"/></summary>
      <div className="nav-children">
      <Link to="/cases" onClick={onNavigate} activeProps={{className:'nav-item active'}} className="nav-item">فهرست پرونده‌ها</Link>
      {(user.role==='customer_manager'||user.role==='customer_employee')&&<Link to="/case-requests" onClick={onNavigate} activeProps={{className:'nav-item active'}} className="nav-item">درخواست ثبت پرونده</Link>}
      {user.role==='customer_manager'&&<Link to="/declarations" onClick={onNavigate} activeProps={{className:'nav-item active'}} className="nav-item">پیش‌نویس اظهارنامه</Link>}
      {user.role==='customer_manager'&&<Link to="/customer-reviews" onClick={onNavigate} activeProps={{className:'nav-item active'}} className="nav-item">بازبینی اطلاعات پرونده</Link>}
      {user.role!=='admin'&&<Link to="/documents" onClick={onNavigate} activeProps={{className:'nav-item active'}} className="nav-item">اسناد پرونده‌ها</Link>}
    </div>
  </details>;
}

function Frame(){
  const me=useQuery({queryKey:['me'],queryFn:()=>request<User>('users/me'),retry:false});
  const inbox=useQuery({queryKey:['notifications'],queryFn:()=>request<AppNotification[]>('notifications'),enabled:!!me.data,refetchInterval:60000});
  const declarationInbox=useQuery({queryKey:['declaration-inbox'],queryFn:()=>request<{id:string}[]>('declarations/inbox'),enabled:me.data?.role==='customer_manager',refetchInterval:30000});
  const customerReviewInbox=useQuery({queryKey:['customer-draft-reviews'],queryFn:()=>request<{status:string}[]>('case-drafts/customer-reviews'),enabled:me.data?.role==='customer_manager',refetchInterval:30000});
  const [menu,setMenu]=useState(false);const [error,setError]=useState('');const cache=useQueryClient();
  if(me.isPending)return <Loading/>;
  if(me.isError)return <main className="session-error"><ShieldCheck size={34}/><h1>ورود به حساب لازم است</h1><p>{me.error.message}</p><a href="/login">باز کردن صفحه ورود</a></main>;
  const user=me.data;
  const unreadCount=inbox.data?.filter(n=>!n.read_at).length??0;
  return <UserContext.Provider value={user}><div className="app-shell"><aside className={menu?'sidebar is-open':'sidebar'}><a className="brand" href="/app"><span className="brand-symbol"><Files size={23}/></span><span>کاراترخیص<small>مدیریت عملیات ترخیص</small></span></a><p className="nav-label">فضای کاری</p><nav aria-label="ناوبری اصلی"><Link to="/" onClick={()=>setMenu(false)} activeOptions={{exact:true}} activeProps={{className:'nav-item active'}} className="nav-item"><LayoutDashboard size={18}/>نمای کلی</Link>{user.role==='admin'&&<Link to="/customers" onClick={()=>setMenu(false)} activeProps={{className:'nav-item active'}} className="nav-item"><Building2 size={18}/>مشتریان</Link>}<CaseNavigation user={user} pendingCount={(declarationInbox.data?.length??0)+(customerReviewInbox.data?.filter(item=>item.status==='PENDING').length??0)} onNavigate={()=>setMenu(false)}/>{user.role==='customer_manager'&&<Link to="/team" onClick={()=>setMenu(false)} activeProps={{className:'nav-item active'}} className='nav-item'><Building2 size={18}/>کارمندان شرکت</Link>}<Link to="/tasks" onClick={()=>setMenu(false)} activeProps={{className:'nav-item active'}} className="nav-item"><ListTodo size={18}/>وظایف</Link></nav><div className="sidebar-bottom"><div className="scope-note"><ShieldCheck size={17}/><span>{user.scope_type==='SELECTED_CASES'?'دسترسی به پرونده‌های انتخاب‌شده':'دسترسی متناسب با نقش شما'}</span></div><span className="environment">محیط آزمایشی</span></div></aside>{menu&&<button className="menu-backdrop" aria-label="بستن منو" onClick={()=>setMenu(false)}/>}<div className="workspace"><header className="topbar"><div className="topbar-title"><Button className="mobile-menu" variant="ghost" size="icon" aria-label="باز کردن منو" onClick={()=>setMenu(true)}><Menu size={21}/></Button><span>فضای کاری کاراترخیص</span><ChevronLeft size={14}/><span className="muted">پنل عملیات</span></div><div className="topbar-user"><Link to="/notifications" className="notification-bell" aria-label="اعلان‌ها"><Bell size={19}/>{unreadCount>0&&<span>{unreadCount.toLocaleString('fa-IR')}</span>}</Link><span className="avatar">{user.full_name.slice(0,1)}</span><div><strong>{user.full_name}</strong><small>{roleNames[user.role]||'کاربر'}</small></div><Button variant="ghost" size="icon" aria-label="خروج از حساب" onClick={async()=>{try{await logout();location.assign('/login');}catch(e){setError(e instanceof Error?e.message:'خروج انجام نشد.');}}}><LogOut size={18}/></Button></div></header>{error&&<p className="global-error" role="alert">{error}</p>}<main className="content"><div className="toolbar"><p className="today">{new Intl.DateTimeFormat('fa-IR',{dateStyle:'full'}).format(new Date())}</p><Button variant="outline" onClick={()=>void cache.invalidateQueries({queryKey:['records']})}><RefreshCw size={15}/>تازه‌سازی اطلاعات</Button></div><Outlet/></main><footer className="app-footer"><span>کاراترخیص</span><span>نسخه اولیه · مدیریت عملیات</span></footer></div></div></UserContext.Provider>;
}

function Overview(){
  const user=useUser();const cases=useRecords('cases'),tasks=useRecords('tasks'),documents=useRecords('documents');
  const queryStates=[cases,tasks,documents];
  const openTasks=tasks.data?.filter(t=>!['انجام شد','لغو شده'].includes(String(t.status)));
  return <><div className="page-heading"><div><p className="eyebrow">خلاصه فضای کاری</p><h1>روز بخیر، {user.full_name}</h1><p>پرونده‌ها و کارهای در دسترس خود را از اینجا دنبال کنید.</p></div></div><div className="metrics">{[{title:'پرونده‌های قابل مشاهده',query:cases,count:cases.data?.length,icon:Files,to:'/cases'},{title:'وظایف باز',query:tasks,count:openTasks?.length,icon:ListTodo,to:'/tasks'},{title:'اسناد قابل مشاهده',query:documents,count:documents.data?.length,icon:FileText,to:'/documents'}].map(item=><Link key={item.title} to={item.to as '/cases'} className="metric"><div><span>{item.title}</span><span className="metric-icon"><item.icon size={20}/></span></div><strong>{item.query.isPending?'…':item.query.isError?'—':(item.count||0).toLocaleString('fa-IR')}</strong><small>مشاهده فهرست<ArrowUpLeft size={15}/></small></Link>)}</div><div className="overview-columns"><section className="surface"><div className="surface-heading"><h2>آخرین پرونده‌ها</h2><Link to="/cases">همه پرونده‌ها<ArrowUpLeft size={14}/></Link></div>{cases.isPending?<Loading/>:cases.isError?<ErrorState retry={()=>void cases.refetch()}/>:cases.data.length===0?<EmptyState title="هنوز پرونده‌ای در دسترس نیست" description="پرونده‌های ثبت‌شده یا تخصیص‌یافته، در این بخش نمایش داده می‌شوند."/>:<ul className="record-list">{cases.data.slice(0,5).map(row=><li key={row.id}><div><Files size={18}/><strong>{display(row.real_case_number||row.id)}</strong><small>{display(row.customs)}</small></div><span className="status-badge">{display(row.status)}</span></li>)}</ul>}</section><section className="surface"><div className="surface-heading"><h2>کارهای پیش رو</h2><Link to="/tasks">همه وظایف<ArrowUpLeft size={14}/></Link></div>{tasks.isPending?<Loading/>:tasks.isError?<ErrorState retry={()=>void tasks.refetch()}/>:!openTasks?.length?<EmptyState icon={ListTodo} title="وظیفه بازی وجود ندارد" description="با ثبت یا تخصیص وظیفه، کارهای پیش رو اینجا قرار می‌گیرند."/>:<ul className="record-list">{openTasks.slice(0,5).map(row=><li key={row.id}><div><ListTodo size={18}/><strong>{display(row.title)}</strong></div><span className="status-badge">{display(row.priority)}</span></li>)}</ul>}</section></div>{queryStates.some(q=>q.isError)&&<p className="muted" role="status">بخشی از اطلاعات دریافت نشده است؛ از دکمه تازه‌سازی استفاده کنید.</p>}<div className="access-banner"><ShieldCheck size={21}/><div><strong>اطلاعات در محدوده دسترسی شما</strong><p>فهرست‌ها بر اساس سازمان، نقش و دسترسی پرونده نمایش داده می‌شوند.</p></div></div></>;
}

function Detail({record,fields,onClose,onEdit,customerDocuments=false,caseDocuments=false,workflow=false,caseMessages=false,canMessageInternally=false,admin=false}:{record:RecordRow|null;fields:Field[];onClose:()=>void;onEdit?:()=>void;customerDocuments?:boolean;caseDocuments?:boolean;workflow?:boolean;caseMessages?:boolean;canMessageInternally?:boolean;admin?:boolean}){
  const dialog=useRef<HTMLDialogElement>(null);
  const [tab,setTab]=useState('profile');
  useEffect(()=>{if(record&&!dialog.current?.open)dialog.current?.showModal();if(!record&&dialog.current?.open)dialog.current.close();},[record]);
  useEffect(()=>{setTab(new URLSearchParams(location.search).get('tab')==='documents'?'documents':'profile');},[record?.id]);
  return <dialog ref={dialog} onCancel={onClose} onClose={onClose} className={customerDocuments?'detail-dialog customer-detail':'detail-dialog'} aria-labelledby="detail-title">
    <header><h2 id="detail-title">{customerDocuments?'پرونده مشتری · '+String(record?.name??''):'جزئیات رکورد'}</h2><Button variant="ghost" size="icon" aria-label="بستن جزئیات" onClick={onClose}><X size={20}/></Button></header>
    {customerDocuments&&<div className="detail-tabs" role="tablist" aria-label="بخش‌های مشتری"><button role="tab" id="profile-tab" aria-selected={tab==='profile'} aria-controls="profile-panel" onClick={()=>setTab('profile')}>مشخصات مشتری</button><button role="tab" id="documents-tab" aria-selected={tab==='documents'} aria-controls="documents-panel" onClick={()=>setTab('documents')}>مدارک و مجوزها</button><button role="tab" id="manager-tab" aria-selected={tab==='manager'} aria-controls="manager-panel" onClick={()=>setTab('manager')}>مدیر پنل</button><button role="tab" id="reviewer-tab" aria-selected={tab==='reviewer'} aria-controls="reviewer-panel" onClick={()=>setTab('reviewer')}>دسترسی بررسی اسناد</button></div>}
    <div id="profile-panel" role={customerDocuments?'tabpanel':undefined} aria-labelledby={customerDocuments?'profile-tab':undefined} hidden={customerDocuments&&tab!=='profile'}>
      <dl>{record&&fields.map(field=><div key={field.key}><dt>{field.label}</dt><dd>{display(record[field.key])}</dd></div>)}</dl><p className="muted">شناسه: <bdi>{record?.id}</bdi></p>{onEdit&&<Button onClick={onEdit}>ویرایش اطلاعات مشتری</Button>}
    </div>
    {caseDocuments&&record&&['import','export'].includes(String(record.operation_type))&&<CaseDeclarations key={record.id} caseId={record.id} operationType={String(record.operation_type)} admin={admin}/>}
    {workflow&&record&&['import','export'].includes(String(record.operation_type))&&<CaseWorkflow key={`workflow-${record.id}`} caseId={record.id}/>}
    {caseMessages&&record&&['import','export'].includes(String(record.operation_type))&&<CaseWorkflowMessages key={`workflow-messages-${record.id}`} caseId={record.id} canMessageInternally={canMessageInternally}/>}
    {customerDocuments&&record&&<div id="documents-panel" role="tabpanel" aria-labelledby="documents-tab" hidden={tab!=='documents'}><CustomerDocuments key={record.id} customerId={record.id}/></div>}
    {customerDocuments&&record&&tab==='manager'&&<div id="manager-panel" role="tabpanel" aria-labelledby="manager-tab"><CustomerManagerAccess key={record.id} customerId={record.id} email={typeof record.email==='string'?record.email:null}/></div>}
    {customerDocuments&&record&&tab==='reviewer'&&<div id="reviewer-panel" role="tabpanel" aria-labelledby="reviewer-tab"><CustomerReviewer key={record.id} customerId={record.id}/></div>}
  </dialog>;
}

function ResourcePage({resource}:{resource:Resource}){
  const config=resources.find(r=>r.key===resource)!;const user=useUser();const query=useRecords(resource);const [selected,setSelected]=useState<RecordRow|null>(null);
  const [editor,setEditor]=useState<{record:RecordRow|null}|null>(null);const [notice,setNotice]=useState('');
  const requestedCustomer=new URLSearchParams(location.search).get('customer');
  const requestedCase=new URLSearchParams(location.search).get('case');
  useEffect(()=>{if(resource==='customers'&&requestedCustomer&&query.data){const row=query.data.find(item=>item.id===requestedCustomer);if(row)setSelected(row);}},[resource,requestedCustomer,query.data]);
  useEffect(()=>{if(resource==='cases'&&requestedCase&&query.data){const row=query.data.find(item=>item.id===requestedCase);if(row)setSelected(row);}},[resource,requestedCase,query.data]);
  if(resource==='customers'&&user.role!=='admin')return <EmptyState icon={ShieldCheck} title="این بخش برای نقش شما فعال نیست" description="از منوی پرونده‌ها و وظایف برای دنبال‌کردن کارهای خود استفاده کنید."/>;
  return <><div className="page-heading"><div><p className="eyebrow">اطلاعات عملیاتی</p><h1>{config.name}</h1><p>{config.description}</p></div><div className="page-actions">{resource==='customers'&&user.role==='admin'&&<Button onClick={()=>{setNotice('');setEditor({record:null});}}>مشتری جدید</Button>}<span className="page-icon"><config.icon size={25}/></span></div></div>{notice&&<p className="save-notice" role="status">{notice}</p>}<section className="surface">{query.isPending?<Loading/>:query.isError?<ErrorState retry={()=>void query.refetch()}/>:query.data.length===0?<EmptyState icon={config.icon} title={'هنوز '+config.name+' ثبت نشده است'} description="پس از ثبت یا تخصیص اطلاعات، فهرست این بخش نمایش داده می‌شود."/>:<DataTable data={query.data} fields={config.fields} onInspect={setSelected}/>}</section><Detail customerDocuments={resource==='customers'&&user.role==='admin'} caseDocuments={resource==='cases'&&user.role==='admin'} workflow={resource==='cases'&&['admin','internal_employee'].includes(user.role)} caseMessages={resource==='cases'} canMessageInternally={['admin','internal_employee'].includes(user.role)} admin={user.role==='admin'} record={selected} fields={resource==='customers'?[{key:'name',label:'نام مشتری'},{key:'customer_type',label:'نوع مشتری'},...customerProfileFields,{key:'is_active',label:'وضعیت'}]:config.fields} onClose={()=>{setSelected(null);if(requestedCustomer||requestedCase)history.replaceState(null,'',location.pathname);}} onEdit={resource==='customers'&&user.role==='admin'&&selected?()=>{setEditor({record:selected});setSelected(null);}:undefined}/>{editor&&<CustomerEditor record={editor.record} onClose={()=>setEditor(null)} onSaved={(saved)=>{setEditor(null);const status=saved.manager_invitation_status;setNotice(status==='pending'?'مشتری ثبت شد؛ سرویس ایمیل درخواست دعوت مدیر را پذیرفت.':status==='existing_account'?'مشتری ثبت شد؛ ایمیل مدیر از قبل حساب دارد و باید عضویت او جداگانه بررسی شود.':status==='delivery_failed'?'مشتری ثبت شد اما دعوت ایمیلی ارسال نشد؛ پس از بررسی تنظیمات می‌توانید دعوت را دوباره بفرستید.':status==='email_required'?'مشتری ثبت شد؛ برای دعوت مدیر، ایمیل شرکت را وارد و از زبانه مدیر پنل دعوت را ارسال کنید.':'اطلاعات مشتری ذخیره شد.');}}/>}</>;
}

function Declarations(){const user=useUser();return user.role==='admin'?<CaseRegistrationRequestsPage key={user.id} admin identityId={user.id}/>:<DeclarationsPage admin={false}/>;}
function Drafts(){const user=useUser();return user.role==='admin'?<CaseRegistrationRequestsPage key={user.id} admin identityId={user.id}/>:user.role==='customer_manager'||user.role==='customer_employee'?<CaseRegistrationRequestsPage key={user.id} admin={false} identityId={user.id}/>:<p role="alert">دسترسی به این بخش برای این نقش فعال نیست.</p>;}
function CaseRequests(){const user=useUser();return user.role==='admin'?<CaseRegistrationRequestsPage key={user.id} admin identityId={user.id}/>:user.role==='customer_manager'||user.role==='customer_employee'?<CaseRegistrationRequestsPage key={user.id} admin={false} identityId={user.id}/>:<ResourcePage resource="cases"/>;}
function CustomerTeam(){const user=useUser();return user.role==='customer_manager'?<CustomerTeamPage organizationId={user.organization_id}/>:<p role="alert">این بخش فقط برای مدیر شرکت فعال است.</p>;}
const rootRoute=createRootRoute({component:Frame});
const overviewRoute=createRoute({getParentRoute:()=>rootRoute,path:'/',component:Overview});
const customersRoute=createRoute({getParentRoute:()=>rootRoute,path:'/customers',component:()=> <ResourcePage resource="customers"/>});
const casesRoute=createRoute({getParentRoute:()=>rootRoute,path:'/cases',component:()=> <CaseRequests/>});
const caseRequestsRoute=createRoute({getParentRoute:()=>rootRoute,path:'/case-requests',component:()=> <CaseRequests/>});
const tasksRoute=createRoute({getParentRoute:()=>rootRoute,path:'/tasks',component:()=> <ResourcePage resource="tasks"/>});
const documentsRoute=createRoute({getParentRoute:()=>rootRoute,path:'/documents',component:()=> <ResourcePage resource="documents"/>});
const notificationsRoute=createRoute({getParentRoute:()=>rootRoute,path:'/notifications',component:Notifications});
const declarationsRoute=createRoute({getParentRoute:()=>rootRoute,path:'/declarations',component:Declarations});
const draftsRoute=createRoute({getParentRoute:()=>rootRoute,path:'/drafts',component:Drafts});
const customerReviewsRoute=createRoute({getParentRoute:()=>rootRoute,path:'/customer-reviews',component:CustomerDraftReviewsPage});
const teamRoute=createRoute({getParentRoute:()=>rootRoute,path:'/team',component:CustomerTeam});
const router=createRouter({routeTree:rootRoute.addChildren([overviewRoute,customersRoute,casesRoute,caseRequestsRoute,tasksRoute,documentsRoute,notificationsRoute,draftsRoute,declarationsRoute,customerReviewsRoute,teamRoute]),basepath:'/app',defaultPreload:'intent'});
declare module '@tanstack/react-router'{interface Register{router:typeof router}}
const client=new QueryClient({defaultOptions:{queries:{retry:false,staleTime:30000}}});
createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={client}><RouterProvider router={router}/></QueryClientProvider></React.StrictMode>);
