import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Flat output (no assets/ sub-folder) so the files can be uploaded with the S3 console's "Add files"
  build: { assetsDir: '' },
})
