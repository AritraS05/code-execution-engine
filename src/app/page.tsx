"use client";

import dynamic from "next/dynamic";
import React, { useState } from "react";
import { Button } from "@/components/ui/stateful-button";
import { Toaster,toast} from "react-hot-toast";
import { LoaderOne } from "@/components/ui/loader";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function codeEditor(){
  const [code, setCode] = useState("//start your magic here :)");
  const [language, setLanguage] = useState("cpp");
  const [result, setResult] = useState<{verdict:string;errors?:string;details?:string[]}|null>(null);
  const problems = [
    { id: "sum", name: "Sum of Two Numbers" },
    { id: "sort", name: "Sort Array" }
  ];
  const [problemId, setProblemId] = useState(problems[0].id);
  const handleEditorChange = (value:string | undefined) => setCode(value ?? "");

  const handleSubmit = async  () =>{
    toast.loading(<LoaderOne/>);
    try{
      const res = await fetch('/api/submit',{
        method:"POST",
        headers:{
          "content-type":"application/json"
        },
        body: JSON.stringify({code,language,problemId})
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
    <div className="bg-black">
      <select className="text-amber-100"
        value={language}
        onChange={e => setLanguage(e.target.value)}
        style={{ marginLeft: 12, marginBottom: 12 }}
      >
        <option value="cpp">C++</option>
        <option value="python">Python</option>
        <option value="js">JavaScript</option>
      </select>
      <Editor
        height="91vh"
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