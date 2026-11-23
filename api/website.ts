import { getProductionRuntime } from '../server/src/productionRuntime.js';
import { requireAdmin } from '../server/src/adminAuth.js';
import { requireSameOrigin } from '../server/src/requestSecurity.js';
import { jsonResponse,errorResponse,readLimitedJson } from '../server/src/webResponse.js';
import { emptyContent,validateContent } from '../server/src/websiteContent.js';
import { HttpError } from '../server/src/httpError.js';
const BUCKET='dominus-website';
export async function POST(request:Request){try{
 requireSameOrigin(request);await requireAdmin(request,getProductionRuntime().supabase);
 const type=request.headers.get('content-type')||'';const extensions:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
 if(!extensions[type])throw new HttpError(415,'Upload a JPG, PNG or WebP image.');
 const limit=3*1024*1024;if(Number(request.headers.get('content-length'))>limit)throw new HttpError(413,'Image must be smaller than 3 MB.');
 const bytes=new Uint8Array(await request.arrayBuffer());if(bytes.length>limit)throw new HttpError(413,'Image must be smaller than 3 MB.');
 const valid=type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:type==='image/png'?Buffer.from(bytes.subarray(0,8)).equals(Buffer.from([137,80,78,71,13,10,26,10])):Buffer.from(bytes.subarray(0,4)).toString()==='RIFF'&&Buffer.from(bytes.subarray(8,12)).toString()==='WEBP';
 if(!valid)throw new HttpError(400,'This file is not a supported image.');
 const supabase=getProductionRuntime().supabase;const bucket='dominus-website-media';
 const {error:bucketError}=await supabase.storage.createBucket(bucket,{public:true,fileSizeLimit:limit,allowedMimeTypes:Object.keys(extensions)});if(bucketError&&!/already exists|duplicate/i.test(bucketError.message))throw bucketError;
 const path=`${crypto.randomUUID()}.${extensions[type]}`;const {error}=await supabase.storage.from(bucket).upload(path,bytes,{contentType:type,cacheControl:'31536000'});if(error)throw error;
 return jsonResponse({url:supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl});
}catch(error){return errorResponse(error);}}
async function readDocument(name:string){
 const {data,error}=await getProductionRuntime().supabase.storage.from(BUCKET).download(`${name}.json`);
 if(error){if(['404','400'].includes(String((error as unknown as {statusCode:string}).statusCode))&&/not found|does not exist/i.test(error.message))return null;throw error;}
 return JSON.parse(await data.text());
}
export async function GET(request:Request){try{
 if(new URL(request.url).searchParams.get('health')==='1'){
  const {error}=await getProductionRuntime().supabase.from('crm_pipelines').select('id').limit(1);
  return jsonResponse({ok:!error,status:error?'degraded':'healthy',service:'dominus-api',storage:'supabase',integration:'internal-crm'},error?503:200);
 }
 const admin=new URL(request.url).searchParams.get('mode')==='admin';
 if(admin){await requireAdmin(request,getProductionRuntime().supabase);const {error}=await getProductionRuntime().supabase.storage.createBucket(BUCKET,{public:false,fileSizeLimit:262144,allowedMimeTypes:['application/json']});if(error&&!/already exists|duplicate/i.test(error.message))throw error;}
 const published=await readDocument('published');
 if(!admin)return jsonResponse({content:published?.content||emptyContent,publishedAt:published?.savedAt||null});
 const draft=await readDocument('draft');
 return jsonResponse({draft:draft?.content||published?.content||emptyContent,published:published?.content||emptyContent,publishedAt:published?.savedAt||null});
}catch(error){return errorResponse(error);}}
export async function PUT(request:Request){try{
 requireSameOrigin(request);await requireAdmin(request,getProductionRuntime().supabase);
 const body=await readLimitedJson(request) as {action:string;content:unknown};
 if(!['draft','publish'].includes(body.action))throw new HttpError(400,'Unknown action.');
 const content=validateContent(body.content);const savedAt=new Date().toISOString();
 const name=body.action==='publish'?'published':'draft';
 const storage=getProductionRuntime().supabase.storage.from(BUCKET);
 const {error}=await storage.upload(`${name}.json`,JSON.stringify({content,savedAt}),{upsert:true,contentType:'application/json',cacheControl:'0'});if(error)throw error;
 return jsonResponse({savedAt});
}catch(error){return errorResponse(error);}}
