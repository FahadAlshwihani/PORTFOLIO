# Project media

Add media to the folder whose name exactly matches the project's `slug`.

An MP4 makes that project video-first. Keep one showcase MP4 per project
folder. When no MP4 exists, the modal falls back to the folder's screenshots.
Videos use their native controls and the shared 16:9 preview frame.

For image-based projects, use a numeric filename prefix to control gallery
order:

```text
01-cover.webp
02-home.webp
03-dashboard.webp
04-details.webp
05-mobile.webp
```

Supported formats are MP4, PNG, JPG/JPEG, WebP, and AVIF. The first naturally
sorted image is the primary screenshot. CRA/Webpack builds this manifest at
compile time, so adding or removing media may require restarting the development
server and always requires a new production build.

