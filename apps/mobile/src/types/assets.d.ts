/**
 * Static asset imports.
 *
 * Metro resolves `import cover from "./x.jpg"` to an opaque numeric asset
 * handle. TypeScript has no idea, so the modules are declared here.
 */
declare module "*.jpg" {
  const asset: number;
  export default asset;
}
declare module "*.png" {
  const asset: number;
  export default asset;
}
declare module "*.svg" {
  const asset: number;
  export default asset;
}
