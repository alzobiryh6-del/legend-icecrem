const PRODUCTS=["منجو","جوافة","فراولة","اقلاص منوع","معسلات"];
const PEOPLE=[
  {name:"اسحاق القدسي",type:"موزع"},
  {name:"همام الزبيري",type:"موزع"},
  {name:"امين القدسي",type:"المالك"}
];
const RATE=1850, UNITS_PER_SHADA=50;
const KEY="legend_icecream_v1";

let db=JSON.parse(localStorage.getItem(KEY)||'{"production":[],"withdrawals":[]}');

const $=id=>document.getElementById(id);
const fmt=n=>Number(n||0).toLocaleString("ar-YE");
const todayISO=()=>{const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10)};
const save=()=>localStorage.setItem(KEY,JSON.stringify(db));
const toast=(m)=>{const t=$("toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)};
function mondayOf(dateStr){
  const d=new Date(dateStr+"T12:00:00"), day=d.getDay(); // Sun=0
  const diff=day===0?-6:1-day;
  d.setDate(d.getDate()+diff);
  return d;
}
function iso(d){const x=new Date(d); x.setMinutes(x.getMinutes()-x.getTimezoneOffset()); return x.toISOString().slice(0,10)}
function weekDates(dateStr){
  const m=mondayOf(dateStr), arr=[];
  for(let i=0;i<7;i++){const d=new Date(m);d.setDate(m.getDate()+i);arr.push(iso(d))}
  return arr;
}
function weekLabel(dateStr){
  const w=weekDates(dateStr); return `من ${w[0]} إلى ${w[6]}`;
}
function inWeek(dateStr, selected){return weekDates(selected).includes(dateStr)}
function populate(){
  $("prodProduct").innerHTML=PRODUCTS.map(x=>`<option>${x}</option>`).join("");
  $("withProduct").innerHTML=PRODUCTS.map(x=>`<option>${x}</option>`).join("");
  $("withPerson").innerHTML=PEOPLE.map(x=>`<option value="${x.name}">${x.name} — ${x.type}</option>`).join("");
}
function initDates(){
  for(const id of ["prodDate","todayFilter","withDate","reportDate","commissionDate"]) $(id).value=todayISO();
}
function renderToday(){
  const date=$("todayFilter").value;
  const rows=db.production.filter(x=>x.date===date);
  $("todayProduction").innerHTML=rows.length?rows.map(x=>`<div class="row"><div><b>${x.product}</b><small>${x.date}</small></div><strong>${fmt(x.qty)} شدة</strong></div>`).join(""):`<div class="muted">لا يوجد إنتاج مسجل لهذا اليوم.</div>`;
  $("todayProductionTotal").textContent=fmt(rows.reduce((s,x)=>s+Number(x.qty),0))+" شدة";
}
function renderProduction(){
  const rows=[...db.production].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
  $("productionTableWrap").innerHTML=rows.length?`<div class="table-scroll"><table><thead><tr><th>التاريخ</th><th>الصنف</th><th>الكمية</th><th>إجراءات</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${x.date}</td><td>${x.product}</td><td>${fmt(x.qty)} شدة</td><td><div class="row-actions"><button class="icon-btn" onclick="editProduction(${x.id})">تعديل</button><button class="icon-btn" onclick="deleteProduction(${x.id})">حذف</button></div></td></tr>`).join("")}</tbody></table></div>`:`<div class="muted">لا توجد سجلات إنتاج.</div>`;
  renderToday();
}
function renderWithdrawals(){
  const rows=[...db.withdrawals].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
  $("withdrawalsTableWrap").innerHTML=rows.length?`<div class="table-scroll"><table><thead><tr><th>التاريخ</th><th>الجهة</th><th>الصنف</th><th>الشدات</th><th>القيمة</th><th>إجراءات</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${x.date}</td><td>${x.person}</td><td>${x.product}</td><td>${fmt(x.qty)}</td><td>${fmt(x.qty*RATE)} ر.ي</td><td><div class="row-actions"><button class="icon-btn" onclick="invoiceFor('${x.person}')">فاتورة</button><button class="icon-btn" onclick="editWithdrawal(${x.id})">تعديل</button><button class="icon-btn" onclick="deleteWithdrawal(${x.id})">حذف</button></div></td></tr>`).join("")}</tbody></table></div>`:`<div class="muted">لا توجد مسحوبات.</div>`;
}
function renderReport(){
  const date=$("reportDate").value, w=weekDates(date);
  $("weekRange").textContent=`الأسبوع: ${w[0]} → ${w[6]} (الاثنين إلى الأحد)`;
  const prod=db.production.filter(x=>inWeek(x.date,date));
  const wd=db.withdrawals.filter(x=>inWeek(x.date,date));
  const pTotal=prod.reduce((s,x)=>s+Number(x.qty),0);
  const dist=wd.filter(x=>PEOPLE.find(p=>p.name===x.person)?.type==="موزع");
  const owner=wd.filter(x=>PEOPLE.find(p=>p.name===x.person)?.type==="المالك");
  $("rProduction").textContent=fmt(pTotal)+" شدة";
  $("rDistributors").textContent=fmt(dist.reduce((s,x)=>s+Number(x.qty),0))+" شدة";
  $("rOwner").textContent=fmt(owner.reduce((s,x)=>s+Number(x.qty),0))+" شدة";
  $("rDistributorValue").textContent=fmt(dist.reduce((s,x)=>s+Number(x.qty)*RATE,0))+" ر.ي";
  $("reportProductionByProduct").innerHTML=PRODUCTS.map(p=>`<div class="mini"><span>${p}</span><b>${fmt(prod.filter(x=>x.product===p).reduce((s,x)=>s+Number(x.qty),0))} شدة</b></div>`).join("");
  $("reportPeople").innerHTML=PEOPLE.map(p=>{const q=wd.filter(x=>x.person===p.name).reduce((s,x)=>s+Number(x.qty),0);return `<div class="mini"><span>${p.name} <small>(${p.type})</small></span><b>${fmt(q)} شدة</b></div>`}).join("");
}
function renderCommission(){
  const date=$("commissionDate").value, total=db.production.filter(x=>inWeek(x.date,date)).reduce((s,x)=>s+Number(x.qty),0);
  $("commissionProduction").textContent=fmt(total)+" شدة";
  $("commissionQty").textContent=fmt(total);
  $("commissionValue").textContent=fmt(total*2)+" ر.ي";
}
function openModal(html){$("modalContent").innerHTML=html;$("modal").classList.remove("hidden")}
function closeModal(){$("modal").classList.add("hidden")}
function invoiceFor(person){
  const date=$("reportDate").value||todayISO();
  const rows=db.withdrawals.filter(x=>x.person===person);
  const byProduct=PRODUCTS.map(p=>({p,q:rows.filter(x=>x.product===p).reduce((s,x)=>s+Number(x.qty),0)})).filter(x=>x.q);
  const total=rows.reduce((s,x)=>s+Number(x.qty),0);
  const value=total*RATE;
  openModal(`<div class="invoice"><div class="inv-head"><h2>معمل ايسكريم الاسطورة</h2><b>فاتورة مسحوبات</b><div>${person}</div><div>${date}</div></div>
  <table><thead><tr><th>الصنف</th><th>الشدات</th><th>الوحدات</th><th>القيمة</th></tr></thead><tbody>
  ${byProduct.map(x=>`<tr><td>${x.p}</td><td>${fmt(x.q)}</td><td>${fmt(x.q*UNITS_PER_SHADA)}</td><td>${fmt(x.q*RATE)} ر.ي</td></tr>`).join("")}
  </tbody></table><div class="total">الإجمالي: ${fmt(total)} شدة — ${fmt(value)} ر.ي</div><p class="muted">الشدة = 50 وحدة | سعر الشدة = 1,850 ر.ي</p><p><b>تصميم الزبيري</b> — 775154297</p>
  <div class="actions"><button class="primary" onclick="shareInvoice('${person}')">مشاركة الفاتورة</button><button class="secondary" onclick="window.print()">طباعة</button></div></div>`);
}
function shareText(title,text){
  if(navigator.share){navigator.share({title,text}).catch(()=>{})}
  else {navigator.clipboard?.writeText(text);toast("تم نسخ النص للمشاركة");}
}
function shareInvoice(person){
  const rows=db.withdrawals.filter(x=>x.person===person), total=rows.reduce((s,x)=>s+Number(x.qty),0);
  const date=todayISO();
  const lines=PRODUCTS.map(p=>{const q=rows.filter(x=>x.product===p).reduce((s,x)=>s+Number(x.qty),0);return q?`${p}: ${q} شدة`:null}).filter(Boolean).join("\n");
  shareText("فاتورة مسحوبات",`معمل ايسكريم الاسطورة\nفاتورة: ${person}\n${date}\n${lines}\nالإجمالي: ${total} شدة\nالقيمة: ${fmt(total*RATE)} ر.ي\nالشدة 50 وحدة — السعر 1850 ر.ي\nتصميم الزبيري 775154297`);
}
function weeklyText(date){
  const prod=db.production.filter(x=>inWeek(x.date,date)), wd=db.withdrawals.filter(x=>inWeek(x.date,date));
  const pt=prod.reduce((s,x)=>s+Number(x.qty),0), d=wd.filter(x=>PEOPLE.find(p=>p.name===x.person)?.type==="موزع"), o=wd.filter(x=>PEOPLE.find(p=>p.name===x.person)?.type==="المالك");
  return `معمل ايسكريم الاسطورة\nالتقرير الأسبوعي: ${weekLabel(date)}\n\nإجمالي الإنتاج: ${pt} شدة\nمسحوبات الموزعين: ${d.reduce((s,x)=>s+Number(x.qty),0)} شدة\nقيمة مسحوبات الموزعين: ${d.reduce((s,x)=>s+Number(x.qty)*RATE,0)} ر.ي\nمسحوب المالك: ${o.reduce((s,x)=>s+Number(x.qty),0)} شدة\nعمولة الإنتاج: ${pt*2} ر.ي\n\nتصميم الزبيري 775154297`;
}
function editProduction(id){
  const x=db.production.find(x=>x.id===id); if(!x)return;
  $("prodDate").value=x.date;$("prodProduct").value=x.product;$("prodQty").value=x.qty;
  db.production=db.production.filter(y=>y.id!==id);save();renderAll();window.scrollTo({top:0,behavior:"smooth"});toast("تم فتح السجل للتعديل ثم اضغط حفظ الإنتاج");
}
function deleteProduction(id){if(confirm("حذف سجل الإنتاج؟")){db.production=db.production.filter(x=>x.id!==id);save();renderAll();toast("تم الحذف")}}
function editWithdrawal(id){
  const x=db.withdrawals.find(x=>x.id===id);if(!x)return;
  $("withDate").value=x.date;$("withPerson").value=x.person;$("withProduct").value=x.product;$("withQty").value=x.qty;
  db.withdrawals=db.withdrawals.filter(y=>y.id!==id);save();renderAll();window.scrollTo({top:0,behavior:"smooth"});toast("تم فتح السجل للتعديل ثم اضغط حفظ المسحوب");
}
function deleteWithdrawal(id){if(confirm("حذف سجل المسحوب؟")){db.withdrawals=db.withdrawals.filter(x=>x.id!==id);save();renderAll();toast("تم الحذف")}}
function renderAll(){renderProduction();renderWithdrawals();renderReport();renderCommission()}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.tab).classList.add("active")});
$("productionForm").onsubmit=e=>{e.preventDefault();db.production.push({id:Date.now(),date:$("prodDate").value,product:$("prodProduct").value,qty:Number($("prodQty").value)});save();renderAll();$("prodQty").value="";toast("تم حفظ الإنتاج")};
$("withdrawalForm").onsubmit=e=>{e.preventDefault();db.withdrawals.push({id:Date.now(),date:$("withDate").value,person:$("withPerson").value,product:$("withProduct").value,qty:Number($("withQty").value)});save();renderAll();$("withQty").value="";toast("تم حفظ المسحوب")};
["todayFilter","reportDate","commissionDate"].forEach(id=>$(id).addEventListener("change",renderAll));
$("shareWeeklyBtn").onclick=()=>shareText("التقرير الأسبوعي",weeklyText($("reportDate").value));
$("shareCommissionBtn").onclick=()=>{const d=$("commissionDate").value,total=db.production.filter(x=>inWeek(x.date,d)).reduce((s,x)=>s+Number(x.qty),0);shareText("عمولة الإنتاج",`معمل ايسكريم الاسطورة\n${weekLabel(d)}\nإجمالي الإنتاج: ${total} شدة\nالعمولة: ${total} × 2 = ${total*2} ر.ي\nتصميم الزبيري 775154297`)};
$("shareProductionBtn").onclick=()=>{const d=$("todayFilter").value;shareText("إنتاج اليوم",`معمل ايسكريم الاسطورة\nإنتاج يوم ${d}\n${PRODUCTS.map(p=>{const q=db.production.filter(x=>x.date===d&&x.product===p).reduce((s,x)=>s+Number(x.qty),0);return `${p}: ${q} شدة`}).join("\n")}`)};
$("shareWithdrawalsBtn").onclick=()=>shareText("المسحوبات",weeklyText($("reportDate").value));
$("printWeeklyBtn").onclick=()=>window.print();
$("shareAppBtn").onclick=()=>shareText("معمل ايسكريم الاسطورة","نظام معمل ايسكريم الاسطورة — الإنتاج والمسحوبات والتقارير والعمولات.");
$("closeModal").onclick=closeModal;$("modal").onclick=e=>{if(e.target.id==="modal")closeModal()};
$("clearDataBtn").onclick=()=>{if(confirm("سيتم حذف كل الإنتاج والمسحوبات من هذا الجهاز. هل أنت متأكد؟")){db={production:[],withdrawals:[]};save();renderAll();toast("تم حذف البيانات")}};
populate();initDates();renderAll();

if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))}
