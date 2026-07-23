
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/home",
    "route": "/"
  },
  {
    "renderMode": 2,
    "route": "/login"
  },
  {
    "renderMode": 2,
    "route": "/home"
  },
  {
    "renderMode": 2,
    "redirectTo": "/home",
    "route": "/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 23562, hash: '92743042da42a37b6624e53f974afe048d63cfef02ab39cb74fb407a4159da6c', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17185, hash: 'c148ced5f13adead1894f617ab5335f942c0b86b93d2b9b880060cb0f81564ac', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 240, hash: 'db096474d521163c4f5fb7d700305222bcea1012b38583442ad232da75e59192', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'login/index.html': {size: 104155, hash: '0e1144f185376524dd1213d1fdcd40bcf70d15e68cd3db6f1987526674a67bb3', text: () => import('./assets-chunks/login_index_html.mjs').then(m => m.default)},
    'styles-Z5UYKNDX.css': {size: 6934, hash: 'VxIyzD7LHG8', text: () => import('./assets-chunks/styles-Z5UYKNDX_css.mjs').then(m => m.default)}
  },
};
