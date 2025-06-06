declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.js?url' {
  const value: any;
  export default value;
}

declare module '*?raw' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: any;
  export default content;
}

declare module '*?worker' {
  class WebWorker extends Worker {
    constructor();
  }
  export default WebWorker;
}

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.md?raw' {
  const content: string
  export default content
}

declare module '*.md' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}


declare module 'vue3-markdown-it';
