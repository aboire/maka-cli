interface Window { cordova: any; }

declare module "react" {
  interface React {
    let Component:TODO;
  }
}

declare module "react-router-dom" {
  export let BrowserRouter: any;
  export let StaticRouter: any;
}

declare module "react-router" {
  export let Router: any;
  export let Route: any;
  export let IndexRoute: any;
  export let browserHistory: any;
}

declare module "react-dom" {
  export let render: any;
  export let hydrate: any;
}

declare module "react-dom/server" {
  export let renderToStaticMarkup: any;
}

declare module "history" {
  export let createMemoryHistory: any;
}

declare module "styled-components" {
  export let ServerStyleSheet: any;
}

declare module "winston" {
  export let winston: any;
}

declare module "winston-transport" {
  export let index: any;
}

type Props {
  children: any;
}

type UpdateModifier {
  $set: object;
}

declare namespace JSX {
  interface IntrinsicElements {
    a: any;
    abbr: any;
    address: any;
    area: any;
    article: any;
    aside: any;
    audio: any;
    base: any;
    bdi: any;
    bdo: any;
    blockquote: any;
    body: any;
    button: any;
    canvas: any;
    caption: any;
    cite: any;
    code: any;
    col: any;
    colgroup: any;
    data: any;
    datalist: any;
    dd: any;
    del: any;
    details: any;
    dfn: any;
    dialog: any;
    div: any;
    dl: any;
    dt: any;
    em: any;
    embed: any;
    fieldset: any;
    figcaption: any;
    figure: any;
    footer: any;
    form: any;
    h1: any;
    h2: any;
    h3: any;
    h4: any;
    h5: any;
    h6: any;
    head: any;
    header: any;
    hr: any;
    html: any;
    i: any;
    img: any;
    input: any;
    ins: any;
    kbd: any;
    label: any;
    legend: any;
    li: any;
    link: any;
    main: any;
    map: any;
    mark: any;
    meta: any;
    meter: any;
    nav: any;
    object: any;
    ol: any;
    optgroup: any;
    option: any;
    output: any;
    p: any;
    param: any;
    picture: any;
    pre: any;
    progress: any;
    q: any;
    rp: any;
    ruby: any;
    s: any;
    samp: any;
    section: any;
    select: any;
    small: any;
    source: any;
    span: any;
    strong: any;
    style: any;
    sub: any;
    summary: any;
    sup: any;
    svg: any;
    table: any;
    tbody: any;
    td: any;
    template: any;
    textarea: any;
    tfoot: any;
    th: any;
    thead: any;
    time: any;
    tr: any;
    track: any;
    u: any;
    ul: any;
    var: any;
    video: any;
    wbr: any;
  }
}
