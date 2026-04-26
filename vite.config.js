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
		cssTarget: "es6"
	}
});