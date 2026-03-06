import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import {
  FaBox,
  FaMotorcycle,
  FaStar,
  FaSignOutAlt,
  FaHistory,
  FaBullhorn,
  FaMapMarkerAlt,
  FaTruck,
  FaEdit,
  FaTimes,
  FaWallet,
  FaPhone,
  FaEnvelope,
  FaHome,
  FaBolt,
  FaCheckCircle,
} from "react-icons/fa";

/* ─────────────────────────────────────────
   Global styles
   ───────────────────────────────────────── */
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

    .dr * { box-sizing: border-box; }
    .dr   { font-family: 'Syne', sans-serif; }
    .mono { font-family: 'JetBrains Mono', monospace !important; }

    @keyframes spin      { to { transform: rotate(360deg); } }
    @keyframes slideUp   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
    @keyframes scanDot   { 0%,100%{ opacity:.25; } 50%{ opacity:1; } }
    @keyframes pulseGlow {
      0%   { box-shadow: 0 0 0 0   rgba(124,58,237,.35); }
      70%  { box-shadow: 0 0 0 8px rgba(124,58,237,0);   }
      100% { box-shadow: 0 0 0 0   rgba(124,58,237,0);   }
    }
    @keyframes liveBlink { 0%,100%{ opacity:.5; } 50%{ opacity:1; } }

    .su  { animation: slideUp .38s cubic-bezier(.22,1,.36,1) both; }
    .fi  { animation: fadeIn  .3s ease both; }
    .pv  { animation: pulseGlow 2s infinite; }

    /* card lifts */
    .lift { transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
    .lift:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 32px rgba(109,40,217,.12), 0 2px 8px rgba(0,0,0,.06) !important;
      border-color: #c4b5fd !important;
    }

    /* stat cards */
    .sc { transition: all .18s ease; }
    .sc:hover { border-color: #7c3aed !important; background: #faf5ff !important; }
    .sc-btn { cursor: pointer; }

    /* offer rows */
    .or { transition: border-color .18s, background .18s; }
    .or:hover { border-color: #c4b5fd !important; background: #faf5ff !important; }

    /* accept button */
    .ab { transition: transform .15s ease, box-shadow .15s ease; }
    .ab:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(109,40,217,.38) !important; }
    .ab:active { transform: scale(.97); }

    /* inputs */
    .inf:focus { border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,.12); outline: none; }
    .inf::placeholder { color: #c4b5fd; }
    .sa {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239CA3AF'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 13px center;
    }

    /* subtle dot grid bg */
    .dotgrid {
      background-image: radial-gradient(circle, #e9d5ff 1px, transparent 1px);
      background-size: 28px 28px;
    }

    /* scrollbar */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: #f5f3ff; }
    ::-webkit-scrollbar-thumb { background: #ddd6fe; border-radius: 4px; }
  `}</style>
);

/* ─────────────────────────────────────────
   Dashboard
   ───────────────────────────────────────── */
export default function DeliveryStaffDashboard() {
  const [totalDeliveries,     setTotalDeliveries]     = useState(0);
  const [completedDeliveries, setCompletedDeliveries] = useState(0);
  const navigate = useNavigate();
  const [user,            setUser]            = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [deliveries,      setDeliveries]      = useState([]);
  const [availableOffers, setAvailableOffers] = useState([]);
  const [loadingOffers,   setLoadingOffers]   = useState(false);
  const [isAvailable,     setIsAvailable]     = useState(true);
  const [reviews,         setReviews]         = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const staffId       = user?.id || user?._id;
  const averageRating = reviews.length
    ? Number((reviews.reduce((s,r)=>s+(Number(r.rating)||0),0)/reviews.length).toFixed(1)) : 0;

  useEffect(()=>{
    const ud = localStorage.getItem("user");
    if(!ud){ navigate("/login"); return; }
    try {
      const p = JSON.parse(ud);
      if(p.role!=="deliveryStaff"){ navigate("/"); return; }
      setUser(p); setIsAvailable(p.isAvailable!==false);
    } catch { navigate("/login"); }
    finally { setLoading(false); }
  },[navigate]);

  useEffect(()=>{
    if(!user) return;
    const loadD=async()=>{
      try {
        const r=await axiosInstance.get("/api/deliveries/staff/my");
        if(r.data.totals){ setTotalDeliveries(r.data.totals.totalDeliveries||0); setCompletedDeliveries(r.data.totals.completedDeliveries||0); }
        else setTotalDeliveries((r.data.deliveries||[]).length);
        setDeliveries(r.data.deliveries||[]);
      } catch(e){ console.error(e); }
    };
    const loadO=async()=>{
      if(!isAvailable){ setAvailableOffers([]); return; }
      setLoadingOffers(true);
      try { const r=await axiosInstance.get("/api/deliveries/offers/available"); setAvailableOffers(r.data.offers||[]); }
      catch(e){ console.error(e); } finally{ setLoadingOffers(false); }
    };
    loadD(); loadO();
    const iv=setInterval(()=>{ loadD(); if(isAvailable) loadO(); },15000);
    return()=>clearInterval(iv);
  },[user,isAvailable]);

  useEffect(()=>{
    if(!user) return;
    axiosInstance.get("/api/reviews/delivery-staff/me")
      .then(r=>setReviews(Array.isArray(r.data)?r.data:[])).catch(()=>setReviews([]));
  },[user]);

  const handleLogout=()=>{
    localStorage.removeItem("token"); localStorage.removeItem("user");
    window.dispatchEvent(new Event("userLogout")); navigate("/");
  };

  const toggleAvailability=async()=>{
    try {
      const r=await axiosInstance.patch("/api/deliveries/availability/toggle");
      if(r.data.success){
        const na=r.data.isAvailable; setIsAvailable(na);
        const ud=localStorage.getItem("user");
        if(ud){ const p=JSON.parse(ud); p.isAvailable=na; localStorage.setItem("user",JSON.stringify(p)); setUser(p); }
        if(na){ const r2=await axiosInstance.get("/api/deliveries/offers/available"); setAvailableOffers(r2.data.offers||[]); }
        else setAvailableOffers([]);
      }
    } catch(e){ console.error(e); }
  };

  const refreshDeliveries=async()=>{
    try { const r=await axiosInstance.get("/api/deliveries/staff/my"); setDeliveries(r.data.deliveries||[]); } catch(e){ console.error(e); }
  };

  const acceptOffer=async(id)=>{
    try {
      const r=await axiosInstance.post(`/api/deliveries/offers/${id}/accept`);
      if(r.data.success){ await refreshDeliveries(); if(isAvailable){ const r2=await axiosInstance.get("/api/deliveries/offers/available"); setAvailableOffers(r2.data.offers||[]); } }
    } catch(e){ alert(e.response?.data?.message||"Failed to accept offer"); }
  };

  if(loading) return (
    <div style={{background:"#faf5ff",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:40,height:40,border:"3px solid #e9d5ff",borderTop:"3px solid #7c3aed",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
    </div>
  );

  const activeDeliveries = deliveries.filter(d=>["assigned","picked_up","on_the_way"].includes(d.status));
  const userCity         = user?.address?.city?.toLowerCase().trim();
  const filteredOffers   = availableOffers.filter(o=>{
    const oc=o.order?.restaurantId?.location?.city?.toLowerCase().trim();
    return userCity&&oc&&userCity===oc;
  });

  return (
    <div className="dr" style={{background:"#faf5ff",minHeight:"100vh",paddingTop:80,paddingBottom:64}}>
      <Styles/>

      {/* subtle dot pattern */}
      <div className="dotgrid" style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,opacity:.45}}/>
      {/* purple radial wash top-right */}
      <div style={{position:"fixed",top:-180,right:-140,width:560,height:560,borderRadius:"50%",background:"radial-gradient(circle,rgba(167,139,250,.18) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"0 20px",position:"relative",zIndex:1}}>

        {/* ── Header card ── */}
        <div className="su" style={{
          background:"#fff",border:"1px solid #ede9fe",borderRadius:20,
          padding:"20px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:14,
          marginBottom:20,boxShadow:"0 2px 20px rgba(109,40,217,.07)",
        }}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{
              width:52,height:52,borderRadius:16,
              background:"linear-gradient(135deg,#7c3aed,#5b21b6)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:22,color:"#fff",
              boxShadow:"0 4px 18px rgba(124,58,237,.35)",
            }}><FaMotorcycle/></div>
            <div>
              <div style={{color:"#a78bfa",fontSize:10,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:2}}>
                Dispatch Console
              </div>
              <h1 style={{color:"#1e1b4b",fontSize:20,fontWeight:800,lineHeight:1.2,margin:0}}>
                Hello, {user?.name}
              </h1>
            </div>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {/* availability */}
            <button onClick={toggleAvailability} style={{
              display:"flex",alignItems:"center",gap:7,
              padding:"8px 16px",borderRadius:10,cursor:"pointer",
              border:`1.5px solid ${isAvailable?"#6ee7b7":"#e5e7eb"}`,
              background:isAvailable?"#ecfdf5":"#f9fafb",
              color:isAvailable?"#059669":"#6b7280",
              fontSize:11,fontWeight:700,letterSpacing:"0.08em",
              fontFamily:"'Syne',sans-serif",transition:"all .2s",
            }}>
              <span className={isAvailable?"pv":""} style={{width:7,height:7,borderRadius:"50%",display:"inline-block",background:isAvailable?"#10b981":"#9ca3af"}}/>
              {isAvailable?"ONLINE":"OFFLINE"}
            </button>

            <button onClick={handleLogout}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#fca5a5";e.currentTarget.style.color="#dc2626";e.currentTarget.style.background="#fef2f2";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#e5e7eb";e.currentTarget.style.color="#6b7280";e.currentTarget.style.background="#f9fafb";}}
              style={{
                display:"flex",alignItems:"center",gap:7,
                padding:"8px 16px",borderRadius:10,cursor:"pointer",
                border:"1.5px solid #e5e7eb",background:"#f9fafb",color:"#6b7280",
                fontSize:11,fontWeight:700,letterSpacing:"0.08em",
                fontFamily:"'Syne',sans-serif",transition:"all .2s",
              }}>
              <FaSignOutAlt style={{fontSize:11}}/>SIGN OUT
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="su" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20,animationDelay:".06s"}}>
          {[
            {icon:<FaHistory/>,  label:"Total Runs",  value:totalDeliveries,        sub:`${completedDeliveries} done`, color:"#7c3aed", bg:"#ede9fe", onClick:()=>navigate("/delivery-staff/my-deliveries")},
            {icon:<FaTruck/>,    label:"Active Now",  value:activeDeliveries.length, color:"#2563eb", bg:"#eff6ff"},
            {icon:<FaStar/>,     label:"Avg Rating",  value:averageRating,            color:"#d97706", bg:"#fffbeb"},
            {icon:<FaBullhorn/>, label:"Reviews",     value:reviews.length,           color:"#db2777", bg:"#fdf2f8", onClick:()=>staffId&&navigate(`/delivery-staff/${staffId}/reviews`)},
          ].map((s,i)=>(
            <div key={i} className={`sc${s.onClick?" sc-btn":""}`} onClick={s.onClick} style={{
              background:"#fff",border:"1px solid #ede9fe",borderRadius:16,padding:"18px 20px",
              boxShadow:"0 1px 6px rgba(109,40,217,.06)",
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div style={{width:36,height:36,borderRadius:10,background:s.bg,color:s.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>
                  {s.icon}
                </div>
                {s.onClick&&<span style={{color:"#c4b5fd",fontSize:14,fontWeight:700}}>↗</span>}
              </div>
              <div className="mono" style={{color:"#1e1b4b",fontSize:26,fontWeight:700,lineHeight:1,marginBottom:4}}>{s.value}</div>
              <div style={{color:"#9ca3af",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>{s.label}</div>
              {s.sub&&<div style={{color:s.color,fontSize:11,marginTop:4,fontWeight:600}}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* ── Two-column layout ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 296px",gap:20}}>

          {/* Left */}
          <div>
            <SecLabel label="Active Deliveries" count={activeDeliveries.length} color="#7c3aed"/>
            <div style={{marginBottom:28}}>
              {activeDeliveries.length>0
                ? activeDeliveries.map((d,i)=><ActiveCard key={d._id} delivery={d} onUpdate={refreshDeliveries} index={i}/>)
                : <Empty icon="🏁" text="No active deliveries. Accept an offer below to get started."/>}
            </div>

            <SecLabel label="Available Offers" count={filteredOffers.length} color="#2563eb" live/>
            <div>
              {loadingOffers
                ? <Scanning/>
                : filteredOffers.length>0
                  ? filteredOffers.map((o,i)=><OfferCard key={o._id} offer={o} onAccept={acceptOffer} index={i}/>)
                  : <Empty icon="📡" text={
                      isAvailable
                        ?(userCity?"No orders in your city right now.":"Set your city in profile to see available orders.")
                        :"Go online to start receiving delivery offers."
                    }/>}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>

            {/* Profile */}
            <div style={{background:"#fff",border:"1px solid #ede9fe",borderRadius:18,overflow:"hidden",boxShadow:"0 1px 8px rgba(109,40,217,.06)"}}>
              <div style={{padding:"13px 18px",borderBottom:"1px solid #f3f0ff",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#faf5ff"}}>
                <span style={{color:"#1e1b4b",fontWeight:700,fontSize:13}}>Driver Profile</span>
                <button onClick={()=>setIsEditModalOpen(true)} style={{
                  display:"flex",alignItems:"center",gap:5,
                  background:"transparent",border:"none",color:"#7c3aed",
                  fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.07em",
                  fontFamily:"'Syne',sans-serif",
                }}><FaEdit style={{fontSize:9}}/>EDIT</button>
              </div>
              <div style={{padding:"14px 18px",display:"flex",flexDirection:"column",gap:12}}>
                {[
                  {icon:<FaMotorcycle/>,label:"Vehicle",value:user?.vehicleType||"Not set",c:"#7c3aed"},
                  {icon:<FaPhone/>,     label:"Phone",  value:user?.phone,                  c:"#2563eb"},
                  {icon:<FaEnvelope/>,  label:"Email",  value:user?.email,                  c:"#db2777"},
                  {icon:<FaHome/>,      label:"City",   value:user?.address?.city||"Not set",c:"#059669"},
                ].map((p,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:28,height:28,borderRadius:8,background:`${p.c}18`,color:p.c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0}}>
                      {p.icon}
                    </div>
                    <div style={{minWidth:0}}>
                      <div style={{color:"#9ca3af",fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:1}}>{p.label}</div>
                      <div style={{color:"#374151",fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.value||"Not set"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session summary */}
            <div style={{background:"#fff",border:"1px solid #ede9fe",borderRadius:18,padding:"16px 18px",boxShadow:"0 1px 8px rgba(109,40,217,.06)"}}>
              <div style={{color:"#9ca3af",fontSize:9,fontWeight:700,letterSpacing:"0.13em",textTransform:"uppercase",marginBottom:14}}>Session Summary</div>
              {[
                {label:"Completed",   value:completedDeliveries,     color:"#059669"},
                {label:"In Progress", value:activeDeliveries.length, color:"#7c3aed"},
                {label:"Open Offers", value:filteredOffers.length,    color:"#2563eb"},
              ].map((r,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:i<2?10:0}}>
                  <span style={{color:"#6b7280",fontSize:12}}>{r.label}</span>
                  <span className="mono" style={{color:r.color,fontWeight:700,fontSize:17}}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* Tip card */}
            <div style={{
              background:"linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%)",
              borderRadius:18,padding:"18px",position:"relative",overflow:"hidden",
              boxShadow:"0 6px 24px rgba(109,40,217,.25)",
            }}>
              <div style={{position:"absolute",right:-16,bottom:-14,fontSize:72,color:"rgba(255,255,255,0.1)",transform:"rotate(-10deg)",pointerEvents:"none"}}>
                <FaBolt/>
              </div>
              <div style={{position:"absolute",top:-30,left:-30,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.07)",pointerEvents:"none"}}/>
              <div style={{position:"relative",zIndex:1}}>
                <div style={{color:"#c4b5fd",fontSize:9,fontWeight:700,letterSpacing:"0.13em",textTransform:"uppercase",marginBottom:7}}>⚡ Dispatch Tip</div>
                <p style={{color:"rgba(255,255,255,0.8)",fontSize:12,lineHeight:1.65,margin:0}}>
                  Verify order at pickup. COD orders require cash collection — confirm the amount before leaving.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen&&(
        <EditModal user={user} onClose={()=>setIsEditModalOpen(false)} onUpdate={u=>{
          setUser(u);
          const ld=JSON.parse(localStorage.getItem("user")||"{}");
          localStorage.setItem("user",JSON.stringify({...ld,...u}));
        }}/>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Helpers
   ───────────────────────────────────────── */

const SecLabel=({label,count,color,live})=>(
  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
    <div style={{width:3,height:18,background:color,borderRadius:2}}/>
    <span style={{color:"#1e1b4b",fontWeight:800,fontSize:14}}>{label}</span>
    <span className="mono" style={{background:`${color}15`,color,fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,border:`1px solid ${color}30`}}>{count}</span>
    {live&&<span style={{display:"flex",alignItems:"center",gap:5,marginLeft:"auto",color:"#9ca3af",fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:"#10b981",display:"inline-block",animation:"liveBlink 2s infinite"}}/>LIVE
    </span>}
  </div>
);

const Empty=({icon,text})=>(
  <div style={{background:"#fff",border:"1.5px dashed #ddd6fe",borderRadius:14,padding:"28px 20px",textAlign:"center",marginBottom:12}}>
    <div style={{fontSize:26,marginBottom:8}}>{icon}</div>
    <p style={{color:"#9ca3af",fontSize:12,margin:0,lineHeight:1.65}}>{text}</p>
  </div>
);

const Scanning=()=>(
  <div style={{padding:"20px 0",display:"flex",alignItems:"center",gap:9}}>
    {[0,1,2].map(i=>(
      <div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#7c3aed",animation:"scanDot 1.2s ease infinite",animationDelay:`${i*0.22}s`}}/>
    ))}
    <span style={{color:"#9ca3af",fontSize:12}}>Scanning for orders…</span>
  </div>
);

const STATUS={
  assigned:  {label:"ASSIGNED",   color:"#2563eb", bg:"#eff6ff",  dot:"#2563eb"},
  picked_up: {label:"PICKED UP",  color:"#7c3aed", bg:"#f5f3ff",  dot:"#7c3aed"},
  on_the_way:{label:"ON THE WAY", color:"#d97706", bg:"#fffbeb",  dot:"#d97706"},
  delivered: {label:"DELIVERED",  color:"#059669", bg:"#ecfdf5",  dot:"#059669"},
};

const PayBadge=({paid})=>(
  <span style={{
    display:"inline-flex",alignItems:"center",gap:4,
    padding:"3px 9px",borderRadius:6,
    background:paid?"#ecfdf5":"#fef2f2",
    border:`1px solid ${paid?"#6ee7b7":"#fca5a5"}`,
    color:paid?"#059669":"#dc2626",
    fontSize:9,fontWeight:700,letterSpacing:"0.08em",
    fontFamily:"'JetBrains Mono',monospace",
  }}>
    <FaWallet style={{fontSize:7}}/>{paid?"PAID":"COD"}
  </span>
);

/* ── Active Delivery Card ── */
const ActiveCard=({delivery,onUpdate,index})=>{
  const [status,setStatus]=useState(delivery.status);
  const [saving,setSaving]=useState(false);

  const update=async(s)=>{
    setSaving(true);
    try{ await axiosInstance.patch(`/api/deliveries/${delivery._id}/location`,{status:s}); setStatus(s); if(onUpdate) onUpdate(); }
    catch{ alert("Failed to update status"); } finally{ setSaving(false); }
  };

  const id   = String(delivery.order?._id||delivery.order).slice(-6).toUpperCase();
  const cfg  = STATUS[status]||STATUS.assigned;
  const paid = delivery.order?.paymentStatus==="paid";

  const rl      = delivery.order?.restaurantId?.location;
  const pickup  = rl?[rl.road,rl.area,rl.city].filter(Boolean).join(", "):"No address set";
  const dropoff = delivery.order?.deliveryAddress?.fullAddress
    ||(delivery.address?[delivery.address.road,delivery.address.area,delivery.address.city].filter(Boolean).join(", "):"No address set");

  return (
    <div className="lift su" style={{
      background:"#fff",border:"1px solid #ede9fe",
      borderRadius:16,marginBottom:12,overflow:"hidden",
      boxShadow:"0 2px 12px rgba(109,40,217,.07)",
      animationDelay:`${index*.07}s`,
    }}>
      {/* header */}
      <div style={{padding:"12px 16px",borderBottom:"1px solid #f3f0ff",background:"#faf5ff",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:10,background:"#ede9fe",display:"flex",alignItems:"center",justifyContent:"center",color:"#7c3aed",fontSize:14,flexShrink:0}}>
            <FaBox/>
          </div>
          <div>
            <div className="mono" style={{color:"#1e1b4b",fontWeight:700,fontSize:13,letterSpacing:"0.05em"}}>#{id}</div>
            <div style={{color:"#9ca3af",fontSize:10,marginTop:1}}>{delivery.order?.restaurantId?.name||"Kitchen order"}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
          <PayBadge paid={paid}/>
          <span style={{
            display:"inline-flex",alignItems:"center",gap:5,
            padding:"3px 9px",borderRadius:6,
            background:cfg.bg,color:cfg.color,
            fontSize:9,fontWeight:700,letterSpacing:"0.08em",
            fontFamily:"'JetBrains Mono',monospace",
            border:`1px solid ${cfg.color}30`,
          }}>
            <span style={{width:5,height:5,borderRadius:"50%",background:cfg.dot,display:"inline-block"}}/>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* addresses */}
      <div style={{padding:"12px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[
          {label:"Pickup",   pin:"#7c3aed", value:pickup},
          {label:"Drop Off", pin:"#2563eb", value:dropoff},
        ].map((a,i)=>(
          <div key={i} style={{background:"#faf5ff",borderRadius:10,padding:"10px 12px",border:"1px solid #ede9fe"}}>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
              <FaMapMarkerAlt style={{color:a.pin,fontSize:8}}/>
              <span style={{color:"#9ca3af",fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>{a.label}</span>
            </div>
            <span style={{color:"#374151",fontSize:11,lineHeight:1.55}}>{a.value}</span>
          </div>
        ))}
      </div>

      {/* status selector */}
      <div style={{padding:"10px 16px 14px",display:"flex",alignItems:"center",gap:8}}>
        <span style={{color:"#9ca3af",fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",whiteSpace:"nowrap"}}>Status:</span>
        <select value={status} onChange={e=>update(e.target.value)} disabled={saving} style={{
          flex:1,background:"#fff",border:"1.5px solid #ddd6fe",
          borderRadius:9,padding:"7px 12px",color:"#1e1b4b",
          fontSize:11,fontWeight:600,fontFamily:"'Syne',sans-serif",
          cursor:"pointer",outline:"none",appearance:"none",
        }}>
          <option value="assigned">⏳ Awaiting Pickup</option>
          <option value="picked_up">📦 Picked Up</option>
          <option value="on_the_way">🛵 Out for Delivery</option>
          <option value="delivered">✅ Mark Delivered</option>
        </select>
        {saving&&<div style={{width:14,height:14,border:"2px solid #ddd6fe",borderTop:"2px solid #7c3aed",borderRadius:"50%",animation:"spin .6s linear infinite",flexShrink:0}}/>}
      </div>
    </div>
  );
};

/* ── Offer Card ── */
const OfferCard=({offer,onAccept,index})=>{
  const paid=offer.order?.paymentStatus==="paid";
  return (
    <div className="or su" style={{
      background:"#fff",border:"1px solid #ede9fe",
      borderRadius:14,padding:"13px 16px",
      display:"flex",justifyContent:"space-between",alignItems:"center",gap:14,
      marginBottom:10,boxShadow:"0 1px 6px rgba(109,40,217,.05)",
      animationDelay:`${index*.07}s`,
    }}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,flexWrap:"wrap"}}>
          <span style={{background:"#ede9fe",color:"#7c3aed",fontSize:8,fontWeight:700,padding:"3px 7px",borderRadius:4,letterSpacing:"0.1em",fontFamily:"'JetBrains Mono',monospace"}}>NEW</span>
          <span className="mono" style={{color:"#1e1b4b",fontWeight:700,fontSize:12,letterSpacing:"0.05em"}}>#{String(offer.order?._id).slice(-6).toUpperCase()}</span>
          <PayBadge paid={paid}/>
        </div>
        <div style={{color:"#374151",fontWeight:700,fontSize:12,marginBottom:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {offer.order?.restaurantId?.name}
        </div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          <span style={{color:"#9ca3af",fontSize:10,display:"flex",alignItems:"center",gap:4}}>
            <FaMapMarkerAlt style={{color:"#a78bfa",fontSize:8}}/>{offer.order?.restaurantId?.location?.area||"Nearby"}
          </span>
          <span style={{color:"#9ca3af",fontSize:10,display:"flex",alignItems:"center",gap:4}}>
            <FaWallet style={{color:"#7c3aed",fontSize:8}}/>{offer.order?.total} ৳
          </span>
        </div>
      </div>
      <button className="ab" onClick={()=>onAccept(offer._id)} style={{
        background:"linear-gradient(135deg,#7c3aed,#5b21b6)",
        color:"#fff",border:"none",borderRadius:10,
        padding:"10px 20px",fontSize:11,fontWeight:800,
        cursor:"pointer",letterSpacing:"0.07em",
        fontFamily:"'Syne',sans-serif",whiteSpace:"nowrap",
        boxShadow:"0 4px 14px rgba(109,40,217,.28)",
      }}>ACCEPT</button>
    </div>
  );
};

/* ── Edit Modal ── */
const EditModal=({user,onClose,onUpdate})=>{
  const [f,setF]=useState({
    name:user?.name||"",phone:user?.phone||"",vehicleType:user?.vehicleType||"",
    address:{house:user?.address?.house||"",road:user?.address?.road||"",area:user?.address?.area||"",city:user?.address?.city||""},
  });
  const [saving,setSaving]=useState(false);

  const submit=async(e)=>{
    e.preventDefault(); setSaving(true);
    try{ const r=await axiosInstance.put("/api/auth/profile",f); if(r.data.success){ onUpdate(r.data.data.user); onClose(); } }
    catch(e){ alert(e.response?.data?.message||"Failed to update profile"); } finally{ setSaving(false); }
  };

  const inp={
    width:"100%",background:"#fff",border:"1.5px solid #ddd6fe",
    borderRadius:10,padding:"10px 14px",color:"#1e1b4b",
    fontSize:13,fontWeight:600,outline:"none",
    fontFamily:"'Syne',sans-serif",transition:"border-color .2s",
  };
  const lbl={display:"block",color:"#9ca3af",fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:5};

  return (
    <div className="fi" style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16,background:"rgba(30,27,75,0.45)",backdropFilter:"blur(6px)"}}>
      <div className="su" style={{background:"#fff",border:"1px solid #ede9fe",borderRadius:22,width:"100%",maxWidth:430,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(109,40,217,.18)"}}>
        {/* header */}
        <div style={{padding:"18px 22px",borderBottom:"1px solid #f3f0ff",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#fff",zIndex:1}}>
          <span style={{color:"#1e1b4b",fontWeight:800,fontSize:15}}>Edit Profile</span>
          <button onClick={onClose} style={{background:"#f5f3ff",border:"1px solid #ede9fe",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",color:"#7c3aed",cursor:"pointer",fontSize:12}}>
            <FaTimes/>
          </button>
        </div>

        <form onSubmit={submit} style={{padding:"22px",display:"flex",flexDirection:"column",gap:14}}>
          {[{l:"Full Name",k:"name",t:"text"},{l:"Phone Number",k:"phone",t:"tel"}].map(x=>(
            <div key={x.k}>
              <label style={lbl}>{x.l}</label>
              <input className="inf" type={x.t} style={inp} value={f[x.k]} onChange={e=>setF({...f,[x.k]:e.target.value})} required/>
            </div>
          ))}

          <div>
            <label style={lbl}>Vehicle Type</label>
            <select className="inf sa" style={{...inp,appearance:"none"}} value={f.vehicleType} onChange={e=>setF({...f,vehicleType:e.target.value})} required>
              <option value="">Select vehicle…</option>
              {["Bike","Bicycle","Car","Other"].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div style={{borderTop:"1px solid #f3f0ff",paddingTop:16}}>
            <div style={{...lbl,marginBottom:12}}>Address</div>
            <div style={{display:"flex",flexDirection:"column",gap:11}}>
              {[
                {l:"House / Flat",k:"house",p:"e.g. 5B"},
                {l:"Road / Street",k:"road",p:"e.g. Lake Road"},
                {l:"Area",k:"area",p:"e.g. Gulshan"},
              ].map(x=>(
                <div key={x.k}>
                  <label style={lbl}>{x.l}</label>
                  <input className="inf" type="text" style={inp} placeholder={x.p} value={f.address[x.k]} onChange={e=>setF({...f,address:{...f.address,[x.k]:e.target.value}})}/>
                </div>
              ))}
              <div>
                <label style={lbl}>City</label>
                <select className="inf sa" style={{...inp,appearance:"none"}} value={f.address.city} onChange={e=>setF({...f,address:{...f.address,city:e.target.value}})}>
                  <option value="" disabled>Select city…</option>
                  {["Dhaka","Chattogram","Sylhet"].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{display:"flex",gap:10,paddingTop:8}}>
            <button type="button" onClick={onClose} style={{flex:1,padding:"11px",borderRadius:11,background:"#f9fafb",border:"1.5px solid #e5e7eb",color:"#6b7280",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Syne',sans-serif"}}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{flex:2,padding:"11px",borderRadius:11,background:"linear-gradient(135deg,#7c3aed,#5b21b6)",border:"none",color:"#fff",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"'Syne',sans-serif",boxShadow:"0 4px 16px rgba(109,40,217,.28)",opacity:saving?.6:1,transition:"opacity .2s"}}>
              {saving?"Saving…":"Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};