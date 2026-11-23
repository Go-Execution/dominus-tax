import { z } from 'zod';
import { websiteSchema } from './websiteSchema.js';
import { HttpError } from './httpError.js';
export const ContentSchema=z.object({values:z.record(z.string(),z.string().max(10000)), hidden:z.array(z.string()).max(6), order:z.array(z.string()).max(6)}).strict();
export type WebsiteContent=z.infer<typeof ContentSchema>;
export const emptyContent:WebsiteContent={values:{},hidden:[],order:websiteSchema.sections.map(s=>s.id)};
export function validateContent(input:unknown):WebsiteContent {
 const content=ContentSchema.parse(input);
 const sectionIds=new Set<string>(websiteSchema.sections.map(s=>s.id));
 if(content.order.length!==sectionIds.size||new Set(content.order).size!==sectionIds.size||[...content.order,...content.hidden].some(id=>!sectionIds.has(id)))throw new HttpError(400,'Invalid section order.');
 for(const [id,value] of Object.entries(content.values)){
  const f=websiteSchema.fields.find(f=>f.id===id);
  if(!f)throw new HttpError(400,'Unknown website field.');
  if(f.type==='link'&&!(/^(https:\/\/[^\s]+|mailto:[^\s]+@[^\s]+|tel:\+?[\d ()-]+|#[\w-]+)$/.test(value)))throw new HttpError(400,'Links must use HTTPS, email, telephone or a page section.');
  if(f.type==='image'&&value&&(!/^https:\/\/[^\s"'()<>]+$/.test(value)))throw new HttpError(400,'Images must use a public HTTPS image URL.');
  if(f.type==='color'&&!/^#[\da-f]{6}$/i.test(value))throw new HttpError(400,'Invalid color.');
 }
 return content;
}
