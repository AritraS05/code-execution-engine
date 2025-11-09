"use client";

import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function codeEditor(){
  return <Editor
      height="500px"
      language="cpp"
      theme="vs-dark"
      defaultValue="//start your magic here :)"
  />
}