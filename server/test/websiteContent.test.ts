import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyContent,validateContent } from '../src/websiteContent.js';
import { websiteSchema } from '../src/websiteSchema.js';
test('website content only accepts known editable fields and safe destinations',()=>{
 const link=websiteSchema.fields.find(f=>f.type==='link')!;
 assert.throws(()=>validateContent({...emptyContent,values:{[link.id]:'javascript:alert(1)'}}));
 assert.throws(()=>validateContent({...emptyContent,values:{unknown:'injected'}}));
 assert.throws(()=>validateContent({...emptyContent,order:['section-1','section-1']}));
 assert.equal(validateContent({...emptyContent,values:{[link.id]:'https://calendly.com/example'}}).values[link.id],'https://calendly.com/example');
});
test('website images and brand colors reject markup and CSS injection',()=>{
 const image=websiteSchema.fields.find(f=>f.type==='image')!;const color=websiteSchema.fields.find(f=>f.type==='color')!;
 assert.throws(()=>validateContent({...emptyContent,values:{[image.id]:'https://example.com/");color:red'}}));
 assert.throws(()=>validateContent({...emptyContent,values:{[color.id]:'red;display:none'}}));
 assert.doesNotThrow(()=>validateContent({...emptyContent,values:{[image.id]:'',[color.id]:'#112233'}}));
});
