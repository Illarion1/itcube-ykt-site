import{a4 as n,j as r,A as l,a as o}from"./index-pMUI2Fal.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=n("FileText",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=n("Link2",[["path",{d:"M9 17H7A5 5 0 0 1 7 7h2",key:"8i5ue5"}],["path",{d:"M15 7h2a5 5 0 1 1 0 10h-2",key:"1b9ql8"}],["line",{x1:"8",x2:"16",y1:"12",y2:"12",key:"1jonct"}]]),u=t=>t.startsWith("/"),a=t=>/\.pdf($|\?)/i.test(t);function p(t){try{return new URL(t).hostname.replace(/^www\./,"")}catch{return""}}function m({items:t}){return r.jsx("ul",{className:"divide-y divide-line border-y border-line",children:t.map(e=>{const s=u(e.url),i=a(e.url)?h:c;return r.jsx("li",{children:r.jsxs("a",{href:s?o(e.url):e.url,target:"_blank",rel:"noopener noreferrer",className:"group flex items-start gap-4 py-5 transition-colors hover:bg-surface sm:px-4",children:[r.jsx("span",{className:"grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface transition-colors group-hover:bg-accent","aria-hidden":"true",children:r.jsx(i,{size:20})}),r.jsxs("span",{className:"min-w-0 flex-1",children:[r.jsx("span",{className:"block font-medium leading-snug",children:e.title}),r.jsx("span",{className:"mt-1 block text-sm text-muted",children:s?"PDF · откроется в новой вкладке":`${a(e.url)?"PDF · ":""}${p(e.url)}`})]}),r.jsx(l,{size:18,"aria-hidden":"true",className:"mt-1 shrink-0 text-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"})]})},e.title+e.url)})})}export{m as D,h as F,c as L};
