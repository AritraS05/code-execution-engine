let logs = [];
self.output = function(...args) {
  logs.push(args.map(x => typeof x === "object" ? JSON.stringify(x) : String(x)).join(" "));
}
self.print = self.output; 

self.onmessage = function(e) {
  logs = [];
  let error = null;
  try {
    eval(e.data.code);
  } catch (err) {
    error = err && err.message ? err.message : String(err);
  }
  self.postMessage({ result: logs.join("\n"), error });
};
