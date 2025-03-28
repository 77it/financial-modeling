// this version doesn't work with nested relative imports (e.g. importing from https a module that imports another module with a relative path to it)
//
// from https://github.com/oven-sh/bun/issues/38#issuecomment-2033654106
// from https://github.com/oven-sh/bun/issues/38#issuecomment-2558033081
/*
Create this file in your project directory anywhere, say at a path plugins/http.ts

Then in your bunfig.toml add:

from the command line (https://bun.sh/docs/cli/run):
    bun test --preload ./plugins/http.ts

OR

    preload = ['./plugins/http.ts']
*/

const rx_any = /./;
const rx_http = /^https?:\/\//;
const rx_path = /^\.*\//;

function load_http_module(href) {
    return fetch(href).then(function (response) {
        return response.text().then(function (text) {
            return (
                response.ok
                ? {contents: text, loader: "js"}
                : Promise.reject(
                    new Error("Failed to load module '" + href + "': " + text)
                )
            );
        });
    });
}

Bun.plugin({
    name: "http_imports",
    setup(build) {
        build.onResolve({filter: rx_path}, function (args) {
            if (rx_http.test(args.importer)) {
                return {path: new URL(args.path, args.importer).href};
            }
        });
        build.onLoad({filter: rx_any, namespace: "http"}, function (args) {
            return load_http_module("http:" + args.path);
        });
        build.onLoad({filter: rx_any, namespace: "https"}, function (args) {
            return load_http_module("https:" + args.path);
        });
    }
});
