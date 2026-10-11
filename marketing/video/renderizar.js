// Renderiza video.html quadro a quadro. Uso: node renderizar.js [test]
const {chromium}=require('playwright');const DUR=111.2,FPS=30;(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});await p.goto('file://'+__dirname+'/video.html');
await p.evaluate(()=>Promise.all([...document.fonts].map(f=>f.load())).then(()=>document.fonts.ready));
await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
const m=process.argv[2];
if(m=='test'){for(const t of process.argv.slice(3).map(Number)){await p.evaluate(t=>render(t),t);await p.screenshot({path:__dirname+'/t_'+String(t).replace('.','_')+'.jpg',type:'jpeg',quality:70});}}
else{const fs=require('fs');fs.mkdirSync(__dirname+'/fr',{recursive:true});for(let i=0;i<DUR*FPS;i++){await p.evaluate(t=>render(t),i/FPS);await p.screenshot({path:__dirname+'/fr/'+String(i).padStart(4,'0')+'.jpg',type:'jpeg',quality:93});}}
await b.close()})()
