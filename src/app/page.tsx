"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/stateful-button";
import { Toaster,toast} from "react-hot-toast";
import { LoaderOne } from "@/components/ui/loader";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";
import useSWR from 'swr';
import JSCodeRunner from "@/components/JSCodeRunnner";
const fetcher = (url: string) => fetch(url).then(res => res.json());

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface ProblemDetails {
  title: string;
  description: string;
  sampleInput: string;
  sampleOutput: string;
}

export default function codeEditor(){
  const [code, setCode] = useState("//start your magic here :)");
  const [language, setLanguage] = useState("cpp");
  const [result, setResult] = useState<{verdict:string;errors?:string;details?:string[]}|null>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  // const problems = [
  //   { id: "sum", name: "Sum of Two Numbers" },
  //   { id: "sort", name: "Sort Array" }
  // ];
  const [problemUrl, setProblemUrl] = useState("");
  const [problemDetails, setProblemDetails] = useState<ProblemDetails|null>(null);
  const { data: problems, isLoading } = useSWR('/api/problems', fetcher);
  const [problemId, setProblemId] = useState<string>();
  const [selectedProblem, setSelectedProblem] = useState<any>();
  const handleEditorChange = (value:string | undefined) => setCode(value ?? "");
  useEffect(() => {
    if (problems) {
      setProblemId(problems[0].id);
      setSelectedProblem(problems[0]);
    }
  }, [problems]);

  useEffect(() => {
    if (problems && problemId) {
      setSelectedProblem(problems.find((p: any) => p.id === problemId));
    }
  }, [problemId, problems]);
// const fetchProblemDetails = async () => {
//   setProblemDetails(null);
//   const resp = await fetch('/api/fetchProblem', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ url: problemUrl })
//   });
//   const data = await resp.json();
//   setProblemDetails(data);
// };
    if (isLoading) return <div>Loading problems...</div>;
  const handleSubmit = async () => {
    toast.loading(<LoaderOne />);
    try {
      const res = await fetch('/api/submit', {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ code, language, input })
      });

      const data = await res.json();
      toast.dismiss();
      if (data.output) {
        toast.success("no errors :)");
        setOutput(data.output);
      } else if (data.error) {
        toast.error("try again");
        setOutput(data.error);
      } else {
        toast.error("Unknown error");
        setOutput("Unknown error");
      }
    } catch (err) {
      toast.dismiss();
      toast.error(`Error : ${err instanceof Error ? err.message : String(err)}`);
      setOutput("Error: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="bg-black">
      <div className="flex items-center p-4 space-x-4">
      <select className="text-amber-100"
        value={language}
        onChange={e => setLanguage(e.target.value)}
        style={{ marginLeft: 12, marginBottom: 12 }}
      >
        <option value="cpp">C++</option>
        <option value="python">Python</option>
        <option value="js">JavaScript</option>
      </select>
      {/* //TODO: implemet the problem fetching logic from diff websites so that the problems are more
      //TODO: easily accessible as of now this is giving a huge number of errors :/ */}
      {/* <input
          className="border-amber-50 text-amber-100"
          value={problemUrl}
          onChange={e => setProblemUrl(e.target.value)}
          placeholder="Paste problem link here"
        />
        <button onClick={fetchProblemDetails} className="border-amber-50  text-amber-50">Fetch</button> */}
        </div>
      {/* <div>
        
        
        {problemDetails && (
          <div className="text-amber-100">
            <h2>{problemDetails.title}</h2>
            <p>{problemDetails.description}</p>
            <div>
              <b>Sample Input</b>
              <pre>{problemDetails.sampleInput}</pre>
              <b>Sample Output</b>
              <pre>{problemDetails.sampleOutput}</pre>
            </div>
          </div>
        )}
      </div> */}

      <div>
      <Editor
        height="91vh"
        language={language}
        theme="vs-dark"
        value={code}
        defaultValue="//start your magic here :)"
        onChange={handleEditorChange}
      />
      <textarea
      placeholder="Paste input here"
      value={input}
      onChange={e => setInput(e.target.value)}
    />
      {/* <JSCodeRunner code={code} /> */}
      <Button onClick={handleSubmit}>
        Submit
      </Button>
      <pre>{output}</pre>
      {result && (
      <div style={{ marginTop: 10 }}>
        <b>Verdict:</b> {result.verdict}
        {result.errors && <div><b>Errors:</b> {result.errors}</div>}
        {result.details && (
          <ul>{result.details.map((d, i) => <li key={i}>{d}</li>)}</ul>
        )}
      </div>
    )}
    </div>
      <Toaster position="top-right" />
    </div>
  );
}