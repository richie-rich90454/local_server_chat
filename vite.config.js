import {defineConfig} from "vite";
import {createHtmlPlugin} from "vite-plugin-html";

export default defineConfig({
    plugins: [
        createHtmlPlugin({
            minify: true
        })
    ],
    css: {
        transformer: "lightningcss"
    },
    build: {
        outDir: "dist",
        target: "es6",
        cssTarget: "es6",
        assetsInlineLimit: 0,
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        {
                            name: "vendor",
                            test: /node_modules/,
                            entriesAware: true,
                            entriesAwareMergeThreshold: 28000,
                            priority: 20
                        },
                        {
                            name: "highlight",
                            test: /highlight\.js|highlightjs/,
                            entriesAware: true,
                            entriesAwareMergeThreshold: 15000,
                            priority: 30
                        }
                    ]
                }
            }
        }
    }
});