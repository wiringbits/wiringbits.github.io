(()=>{"use strict";var e={99:(e,t,r)=>{r.d(t,{Z:()=>c});var n=r(81),o=r.n(n),a=r(645),i=r.n(a)()(o());i.push([e.id,".wb-container{font-weight:400;font-style:normal;display:flex;align-items:center;justify-content:center;position:fixed;box-sizing:content-box;bottom:1rem;right:1rem;cursor:pointer}.wb-img-container{display:flex;align-items:center;justify-content:center;padding:.5rem;width:3rem;height:3rem;border-radius:9999px;box-shadow:.25rem .25rem .5rem rgba(0,0,0,.25);background:rgba(0,0,0,.8);transition:all 250ms ease}.wb-container:hover>.wb-img-container{transform:scale(1.2);background-color:#fff;border-width:1px;border-style:solid;border-color:#d3d3d3}.wb-img{filter:brightness(0) invert(1)}.wb-container:hover .wb-img{filter:none}.wb-tooltip{background-color:#fff;color:#39f;white-space:nowrap;opacity:0%;position:absolute;right:0;transform:translateX(-5rem);z-index:9999;box-shadow:.25rem .25rem .5rem rgba(0,0,0,.25);padding:.5rem;border-radius:1rem;border-width:1px;border-style:solid;border-color:#d3d3d3;font-weight:700;transition:opacity 200ms linear 250ms}.wb-container:hover>.wb-tooltip{opacity:100%;border-width:1px;border-style:solid;border-color:#d3d3d3}",""]);const c=i},645:e=>{e.exports=function(e){var t=[];return t.toString=function(){return this.map((function(t){var r="",n=void 0!==t[5];return t[4]&&(r+="@supports (".concat(t[4],") {")),t[2]&&(r+="@media ".concat(t[2]," {")),n&&(r+="@layer".concat(t[5].length>0?" ".concat(t[5]):""," {")),r+=e(t),n&&(r+="}"),t[2]&&(r+="}"),t[4]&&(r+="}"),r})).join("")},t.i=function(e,r,n,o,a){"string"==typeof e&&(e=[[null,e,void 0]]);var i={};if(n)for(var c=0;c<this.length;c++){var s=this[c][0];null!=s&&(i[s]=!0)}for(var d=0;d<e.length;d++){var l=[].concat(e[d]);n&&i[l[0]]||(void 0!==a&&(void 0===l[5]||(l[1]="@layer".concat(l[5].length>0?" ".concat(l[5]):""," {").concat(l[1],"}")),l[5]=a),r&&(l[2]?(l[1]="@media ".concat(l[2]," {").concat(l[1],"}"),l[2]=r):l[2]=r),o&&(l[4]?(l[1]="@supports (".concat(l[4],") {").concat(l[1],"}"),l[4]=o):l[4]="".concat(o)),t.push(l))}},t}},81:e=>{e.exports=function(e){return e[1]}},379:e=>{var t=[];function r(e){for(var r=-1,n=0;n<t.length;n++)if(t[n].identifier===e){r=n;break}return r}function n(e,n){for(var a={},i=[],c=0;c<e.length;c++){var s=e[c],d=n.base?s[0]+n.base:s[0],l=a[d]||0,u="".concat(d," ").concat(l);a[d]=l+1;var p=r(u),m={css:s[1],media:s[2],sourceMap:s[3],supports:s[4],layer:s[5]};if(-1!==p)t[p].references++,t[p].updater(m);else{var f=o(m,n);n.byIndex=c,t.splice(c,0,{identifier:u,updater:f,references:1})}i.push(u)}return i}function o(e,t){var r=t.domAPI(t);return r.update(e),function(t){if(t){if(t.css===e.css&&t.media===e.media&&t.sourceMap===e.sourceMap&&t.supports===e.supports&&t.layer===e.layer)return;r.update(e=t)}else r.remove()}}e.exports=function(e,o){var a=n(e=e||[],o=o||{});return function(e){e=e||[];for(var i=0;i<a.length;i++){var c=r(a[i]);t[c].references--}for(var s=n(e,o),d=0;d<a.length;d++){var l=r(a[d]);0===t[l].references&&(t[l].updater(),t.splice(l,1))}a=s}}},569:e=>{var t={};e.exports=function(e,r){var n=function(e){if(void 0===t[e]){var r=document.querySelector(e);if(window.HTMLIFrameElement&&r instanceof window.HTMLIFrameElement)try{r=r.contentDocument.head}catch(e){r=null}t[e]=r}return t[e]}(e);if(!n)throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");n.appendChild(r)}},216:e=>{e.exports=function(e){var t=document.createElement("style");return e.setAttributes(t,e.attributes),e.insert(t,e.options),t}},565:(e,t,r)=>{e.exports=function(e){var t=r.nc;t&&e.setAttribute("nonce",t)}},795:e=>{e.exports=function(e){var t=e.insertStyleElement(e);return{update:function(r){!function(e,t,r){var n="";r.supports&&(n+="@supports (".concat(r.supports,") {")),r.media&&(n+="@media ".concat(r.media," {"));var o=void 0!==r.layer;o&&(n+="@layer".concat(r.layer.length>0?" ".concat(r.layer):""," {")),n+=r.css,o&&(n+="}"),r.media&&(n+="}"),r.supports&&(n+="}");var a=r.sourceMap;a&&"undefined"!=typeof btoa&&(n+="\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(a))))," */")),t.styleTagTransform(n,e,t.options)}(t,e,r)},remove:function(){!function(e){if(null===e.parentNode)return!1;e.parentNode.removeChild(e)}(t)}}}},589:e=>{e.exports=function(e,t){if(t.styleSheet)t.styleSheet.cssText=e;else{for(;t.firstChild;)t.removeChild(t.firstChild);t.appendChild(document.createTextNode(e))}}}},t={};function r(n){var o=t[n];if(void 0!==o)return o.exports;var a=t[n]={id:n,exports:{}};return e[n](a,a.exports,r),a.exports}r.n=e=>{var t=e&&e.__esModule?()=>e.default:()=>e;return r.d(t,{a:t}),t},r.d=(e,t)=>{for(var n in t)r.o(t,n)&&!r.o(e,n)&&Object.defineProperty(e,n,{enumerable:!0,get:t[n]})},r.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),(()=>{var e=r(379),t=r.n(e),n=r(795),o=r.n(n),a=r(569),i=r.n(a),c=r(565),s=r.n(c),d=r(216),l=r.n(d),u=r(589),p=r.n(u),m=r(99),f={};f.styleTagTransform=p(),f.setAttributes=s(),f.insert=i().bind(null,"head"),f.domAPI=o(),f.insertStyleElement=l(),t()(m.Z,f),m.Z&&m.Z.locals&&m.Z.locals;const h=document.currentScript.dataset;document.addEventListener("DOMContentLoaded",(()=>function(){const e=function(){var e;const{website:t}=h;if(t){const r=new URL(t);return r.searchParams.append("utm_source",null!==(e=h.utm_source)&&void 0!==e?e:window.location.hostname),v.forEach((e=>{const t=h[e];t&&r.searchParams.append(e,t)})),r.href}return console.error("please provide website for utm url"),null}(),t=document.createElement("div");t.classList.add("wb-container");const{font_fam:r}=h;r&&(t.style.fontFamily=r),e&&(t.onclick=()=>window.location.href=e);const n=document.createElement("div");n.classList.add("wb-img-container");const o=document.createElement("img");o.classList.add("wb-img");const{img_src:a}=h;a&&(o.src=a);const i=document.createElement("div");i.classList.add("wb-tooltip");const{tip:c}=h;c&&(i.textContent=c),n.appendChild(o),t.appendChild(n),t.appendChild(i),document.body.appendChild(t)}()));const v=["utm_id","utm_medium","utm_campaign","utm_term","utm_content"]})()})();