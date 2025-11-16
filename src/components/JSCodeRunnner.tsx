import React, { useRef } from "react";
import { Button } from "./ui/stateful-button";

interface JSCodeRunnerProps {
  code: string;
}

export default function JSCodeRunner({ code } : JSCodeRunnerProps) {
  const workerRef = useRef<Worker|null>(null);

  const runCode = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }
    const worker = new window.Worker("/worker.js");
    workerRef.current = worker;
    const timeout = setTimeout(() => {
      worker.terminate();
      alert("Execution timed out!");
    }, 3000);

    worker.onmessage = (e) => {
      clearTimeout(timeout);

      if (e.data.error) {
        alert("Error: " + e.data.error);
      } else {
        alert("Output: " + e.data.result);
      }
      worker.terminate();
    };
    worker.postMessage({ code });
  };

  return (
    <Button onClick={runCode} style={{ margin: "10px" }}>
      Run (JS)
    </Button>
  );
}
