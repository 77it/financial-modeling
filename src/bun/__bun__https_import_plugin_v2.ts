// Enhanced HTTP imports plugin for Bun with nested relative import support
// Based on https://github.com/oven-sh/bun/issues/38#issuecomment-2033654106 
// and https://github.com/oven-sh/bun/issues/38#issuecomment-2558033081 

/* 
Create this file in your project directory anywhere, say at a path plugins/http.ts 
 
Then in your bunfig.toml add: 
 
from the command line (https://bun.sh/docs/cli/run): 
    bun test --preload ./plugins/http.ts 
 
OR 
 
    preload = ['./plugins/http.ts'] 
*/ 

const rx_any = /./;
const rx_http = /^https?:[\\\/]/;
const rx_path = /^\.\.?\//;
const rx_http_url = /^https?:\/\/.+/;

// Cache for loaded modules to avoid duplicate fetches
const moduleCache = new Map();

function load_http_module(href) {
    // Check cache first
    if (moduleCache.has(href)) {
        return moduleCache.get(href);
    }
    
    const promise = fetch(href).then(function (response) {
        return response.text().then(function (text) {
            if (!response.ok) {
                throw new Error("Failed to load module '" + href + "': " + text);
            }
            
            // Determine the appropriate loader based on the URL
            let loader = "js";
            const url = new URL(href);
            const pathname = url.pathname.toLowerCase();
            
            if (pathname.endsWith('.ts')) {
                loader = "ts";
            } else if (pathname.endsWith('.tsx')) {
                loader = "tsx";
            } else if (pathname.endsWith('.jsx')) {
                loader = "jsx";
            } else if (pathname.endsWith('.json')) {
                loader = "json";
            } else if (pathname.endsWith('.css')) {
                loader = "css";
            }
            
            return {
                contents: text,
                loader: loader
            };
        });
    }).catch(function(error) {
        // Remove from cache if loading failed
        moduleCache.delete(href);
        throw error;
    });
    
    // Cache the promise
    moduleCache.set(href, promise);
    return promise;
}

function resolveHttpUrl(path, importer) {
    try {
        // If path is already a full HTTP URL, return as-is
        if (rx_http.test(path)) {
            return path;
        }
        
        // If importer is an HTTP URL and path is relative, resolve against importer
        if (importer && rx_http.test(importer)) {
            // Normalize backslashes to forward slashes for URL resolution
            const normalizedImporter = importer.replace(/\\/g, '/');
            return new URL(path, normalizedImporter).href;
        }
        
        return null;
    } catch (error) {
        //console.log.warn(`Failed to resolve URL: ${path} from ${importer}`, error);
        return null;
    }
}

Bun.plugin({
    name: "http_imports",
    setup(build) {
        // Handle direct HTTP/HTTPS imports
        build.onResolve({filter: rx_http_url}, function (args) {
            const url = new URL(args.path);
            return {
                path: "//" + url.host + url.pathname + url.search + url.hash,
                namespace: url.protocol.slice(0, -1) // Remove the ':' from protocol
            };
        });
        
        // Handle relative imports from HTTP modules
        build.onResolve({filter: rx_path}, function (args) {
            // Debug logging
            //console.log.log('Resolving relative path:', args.path, 'from importer:', args.importer, 'namespace:', args.namespace);
            
            if (args.importer && rx_http.test(args.importer)) {
                // Importer is a full HTTP URL, resolve relative path against it
                const resolvedUrl = resolveHttpUrl(args.path, args.importer);
                //console.log.log('Resolved to:', resolvedUrl);
                if (resolvedUrl) {
                    const url = new URL(resolvedUrl);
                    return {
                        path: "//" + url.host + url.pathname + url.search + url.hash,
                        namespace: url.protocol.slice(0, -1)
                    };
                }
            } else if (args.namespace === "http" || args.namespace === "https") {
                // Importer is in http/https namespace, reconstruct full URL and resolve
                const importerUrl = args.namespace + ":" + args.importer;
                const resolvedUrl = resolveHttpUrl(args.path, importerUrl);
                //console.log.log('Resolved to:', resolvedUrl);
                if (resolvedUrl) {
                    const url = new URL(resolvedUrl);
                    return {
                        path: "//" + url.host + url.pathname + url.search + url.hash,
                        namespace: url.protocol.slice(0, -1)
                    };
                }
            }
        });
        
        // Handle loading from http namespace
        build.onLoad({filter: rx_any, namespace: "http"}, function (args) {
            const fullUrl = "http:" + args.path;
            //console.log.log('Loading HTTP module:', fullUrl);
            return load_http_module(fullUrl);
        });
        
        // Handle loading from https namespace
        build.onLoad({filter: rx_any, namespace: "https"}, function (args) {
            const fullUrl = "https:" + args.path;
            //console.log.log('Loading HTTPS module:', fullUrl);
            return load_http_module(fullUrl);
        });
    }
});