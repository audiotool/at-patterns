export default {
    // config options
    server: {
	host: '127.0.0.1',	
	port: 5173,
    },
    base: '/at-patterns/',
    esbuild: {
	pure: ['console.log'],    // example: have esbuild remove any console.log
	keepNames: true,
    },
    build: {
	minify: 'esbuild',
    }
}
