import express from "express";
import session from "express-session";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
fs.mkdirSync(path.join(__dirname,"data"),{recursive:true});
const db=new Database(path.join(__dirname,"data","era.sqlite"));
db.pragma("journal_mode = WAL");
db.exec(`CREATE TABLE IF NOT EXISTS days(day TEXT PRIMARY KEY, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'draft', updated_at TEXT NOT NULL)`);
const app=express();
app.disable("x-powered-by");
app.use(helmet({contentSecurityPolicy:false}));
app.use(express.json({limit:"500kb"}));
app.use(session({
  name:"era.sid", secret:process.env.SESSION_SECRET||"development-only-change-me",
  resave:false,saveUninitialized:false,
  cookie:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:8*60*60*1000}
}));
const limiter=rateLimit({windowMs:15*60*1000,limit:8,standardHeaders:true,legacyHeaders:false});
const owner=(req,res,next)=>req.session?.owner===true?next():res.status(401).json({error:"يلزم تسجيل دخول المالك"});
const dayOk=s=>typeof s==="string"&&/^2026-11-(0[1-9]|[12][0-9]|30)$/.test(s);
app.get("/api/config",(req,res)=>res.json({viewerEnabled:process.env.VIEWER_ENABLED==="true",counterEnabled:process.env.COUNTER_ENABLED==="true",month:"2026-11",timezone:"Asia/Tripoli"}));
app.post("/api/login",limiter,async(req,res)=>{
 const password=String(req.body?.password||"");
 const hash=process.env.OWNER_PASSWORD_HASH;
 if(!hash||!password||!(await bcrypt.compare(password,hash)))return res.status(401).json({error:"كلمة المرور غير صحيحة أو لم تُضبط بعد"});
 req.session.owner=true;res.json({ok:true});
});
app.post("/api/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get("/api/me",(req,res)=>res.json({owner:req.session?.owner===true}));
app.get("/api/day/:date",owner,(req,res)=>{
 if(!dayOk(req.params.date))return res.status(400).json({error:"تاريخ خارج الشهر المحدد"});
 const r=db.prepare("SELECT data,revision,status,updated_at FROM days WHERE day=?").get(req.params.date);
 res.json(r?{data:JSON.parse(r.data),revision:r.revision,status:r.status,updatedAt:r.updated_at}:{data:null,revision:0,status:"empty",updatedAt:null});
});
app.put("/api/day/:date",owner,(req,res)=>{
 const date=req.params.date;if(!dayOk(date))return res.status(400).json({error:"تاريخ غير صالح"});
 const {data,revision,status}=req.body||{};
 if(!data||typeof data!=="object"||!Number.isInteger(revision)||!["draft","approved"].includes(status))return res.status(400).json({error:"بيانات الحفظ غير صالحة"});
 const old=db.prepare("SELECT revision FROM days WHERE day=?").get(date);
 const current=old?.revision||0;
 if(revision!==current)return res.status(409).json({error:"يوجد تعديل أحدث من جهاز آخر. أعد تحميل اليوم وراجع التغييرات.",revision:current});
 const next=current+1, now=new Date().toISOString();
 db.prepare(`INSERT INTO days(day,data,revision,status,updated_at) VALUES(?,?,?,?,?)
 ON CONFLICT(day) DO UPDATE SET data=excluded.data,revision=excluded.revision,status=excluded.status,updated_at=excluded.updated_at`)
 .run(date,JSON.stringify(data),next,status,now);
 res.json({ok:true,revision:next,updatedAt:now,status});
});
app.get("/api/export.json",owner,(req,res)=>{const rows=db.prepare("SELECT day,data,revision,status,updated_at FROM days ORDER BY day").all();res.json(rows.map(r=>({...r,data:JSON.parse(r.data)})));});
app.get("/api/export.csv",owner,(req,res)=>{
 const rows=db.prepare("SELECT day,status,revision,updated_at,data FROM days ORDER BY day").all();
 const esc=v=>`"${String(v??"").replaceAll('"','""')}"`;
 const csv=["date,status,revision,updated_at,completion"].concat(rows.map(r=>{const d=JSON.parse(r.data);return [r.day,r.status,r.revision,r.updated_at,d.completion??""].map(esc).join(",")}));
 res.type("text/csv").attachment("era-month-summary.csv").send(csv.join("\r\n"));
});
app.use(express.static(path.join(__dirname,"public")));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(process.env.PORT||3000,()=>console.log(`Era planner running on ${process.env.PORT||3000}`));
