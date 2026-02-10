// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   allowedDevOrigins: [
//     'http://localhost:3000',

//     // Wi-Fi ปกติ
//     'http://192.168.1.195:3000',

//     // ZeroTier (public-style)
//     'http://26.136.124.73:3000',

//     // ZeroTier (managed 10.x.x.x)
//     'http://10.243.117.189:3000',
//   ],
// }

// module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  // บังคับให้ Next.js ใช้ frontend เป็น root จริง
  turbopack: {
    root: __dirname,
  },

}

module.exports = nextConfig

