import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".worktrees/**",
      "node_modules/**",
    ],
  },
  ...nextVitals,
  {
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      // Images are plain <img> with srcset from lib/images/cdn.ts (resized at the
      // Cloudflare edge), not next/image, whose optimizer timed out on the image bed.
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
