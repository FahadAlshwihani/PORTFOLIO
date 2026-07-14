# Project screenshots

Add screenshots to the folder whose name exactly matches the project's `slug`.

Use a numeric filename prefix to control gallery order:

```text
01-cover.webp
02-home.webp
03-dashboard.webp
04-details.webp
05-mobile.webp
```

Supported formats are PNG, JPG/JPEG, WebP, and AVIF. The first naturally
sorted file is the primary screenshot. CRA/Webpack builds this manifest at
compile time, so adding or removing files may require restarting the
development server and always requires a new production build.

