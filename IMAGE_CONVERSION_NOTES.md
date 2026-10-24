# Image Conversion Notes

To convert images to WebP format, use one of the following methods:

## Using ImageMagick (CLI)
```bash
# Convert SVG to WebP (not recommended - SVG is better for logos)
# SVG should remain as SVG for best quality and scalability

# Convert any PNG/JPG images to WebP
magick input.png output.webp
magick input.jpg output.webp

# Convert with quality control
magick input.png -quality 80 output.webp
```

## Using Online Tools
- https://cloudconvert.com/svg-to-webp
- https://convertio.co/svg-webp/
- https://www.aconvert.com/image/svg-to-webp/

## Recommendation
For the logo.svg file, keep it as SVG format because:
1. SVG is scalable without quality loss
2. SVG file size is typically smaller than WebP for simple logos
3. SVG is supported by all modern browsers
4. SVG allows for better accessibility and styling

If you have any PNG or JPG images in the project, convert them to WebP using the methods above.

## Lazy Loading
All images now have `loading="lazy"` attribute for better performance.
