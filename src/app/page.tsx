"use client";

import dynamic from "next/dynamic";
import React, { useState } from "react";
import { Button } from "@/components/ui/stateful-button";
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function codeEditor(){
  const [code, setCode] = useState("//start your magic here :)");
  const [language, setLanguage] = useState("cpp");
  const [result, setResult] = useState<string|null>(null);

  const handleEditorChange = (value:string | undefined) => setCode(value ?? "");

  const handleSubmit = async  () =>{
    setResult("Judging.........");
    try{
      const res = await fetch('/api/submit',{
        method:"POST",
        headers:{
          "content-type":"application/json"
        },
        body: JSON.stringify({code,language})
      })

      const verdict = await res.json();
      setResult(verdict);
    }
    catch(err){
       if(err instanceof Error){
        setResult(`error : ${err.message}`);
       }
       else{
        setResult(`error : ${String(err)}`);
       }
    }
  }

  return (
    <div>
      <select
        value={language}
        onChange={e => setLanguage(e.target.value)}
        style={{ marginLeft: 12, marginBottom: 12 }}
      >
        <option value="cpp">C++</option>
        <option value="python">Python</option>
        <option value="js">JavaScript</option>
      </select>
      <Editor
        height="500px"
        language={language}
        theme="vs-dark"
        value={code}
        defaultValue="//start your magic here :)"
        onChange={handleEditorChange}
      />
      <Button onClick={handleSubmit}>
        Submit
      </Button>
      {result && (
        <div style={{
          marginTop: 16,
          background: "#222",
          color: "#fff",
          padding: 12,
          borderRadius: 4
        }}>
          {typeof result === 'string' ? result : JSON.stringify(result)}
        </div>
      )}
    </div>
  );
}