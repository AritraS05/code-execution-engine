"use client";

import dynamic from "next/dynamic";
import React, { useState } from "react";
import { Button } from "@/components/ui/stateful-button";
import { Toaster,toast} from "react-hot-toast";
import { LoaderOne } from "@/components/ui/loader";
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function codeEditor(){
  const [code, setCode] = useState("//start your magic here :)");
  const [language, setLanguage] = useState("cpp");
  const [result, setResult] = useState<{verdict:string;errors?:string;details?:string[]}|null>(null);

  const handleEditorChange = (value:string | undefined) => setCode(value ?? "");

  const handleSubmit = async  () =>{
    toast.loading(<LoaderOne/>);
    try{
      const res = await fetch('/api/submit',{
        method:"POST",
        headers:{
          "content-type":"application/json"
        },
        body: JSON.stringify({code,language})
      })

      const data = await res.json();
      toast.dismiss();
      if(data.verdict === "Accepted"){
        toast.success("Accepted :)");
      }
      else{
        toast.error("try again");
      }
    }
    catch(err){
      toast.dismiss();
      toast.error(`Error : ${err instanceof Error ? err.message : String(err)}`);
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
      <div style={{ marginTop: 10 }}>
        <b>Verdict:</b> {result.verdict}
        {result.errors && <div><b>Errors:</b> {result.errors}</div>}
        {result.details && (
          <ul>{result.details.map((d, i) => <li key={i}>{d}</li>)}</ul>
        )}
      </div>
    )}
      <Toaster position="top-right" />
    </div>
  );
}