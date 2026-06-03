import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 公開ページを use cache でキャッシュし、動的部分を Suspense でストリーミングする
  cacheComponents: true,
  images: {
    // セキュリティ: '**'（全ホスト許可）は /_next/image をオープンプロキシ化し
    // SSRF・帯域の踏み台になるため使わない。実際に使うホストだけを列挙する。
    // 新しいサムネイル配信元を使う場合は、ここにホストを追加すること。
    remotePatterns: [
      // Google アカウントのアバター画像
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // コースサムネイル（現行データの配信元）
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // YouTube サムネイル
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
};

export default nextConfig;
