import esbuild from 'esbuild'

esbuild.buildSync({
  entryPoints: ['server/mock-server.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'es2019',
  outdir: 'server/bin',
})
