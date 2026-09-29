import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 서버에 localhost가 아닌 사설 IP(10.x.x.x)로 접속해도 화면의 JavaScript가 막히지 않게 한다.
  // 막히면 폼 버튼이 아무 안내 없이 동작하지 않는다. 개발 모드에만 적용되며 배포에는 영향이 없다.
  allowedDevOrigins: ["10.*.*.*"],
};

export default nextConfig;
